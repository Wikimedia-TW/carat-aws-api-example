/**
 * @api {get} /booking-referral-path-table Booking Referral Path Table
 * @apiName booking-referral-path-table
 * @apiGroup Referral
 *
 * @apiDescription 從工作階段的角度來看使用者轉換的來源歷程
 * 1. uid 2. 歷程的工作階段來源 3. 每個工作階段的開始時間 4. 轉換的工作階段時間 5. 預約試乘產品名稱
 *
 * @apiParam {String} domain e.g. nissan
 * @apiParam {String} group cluster id
 * @apiParam {String} from e.g. 2016-09-12
 * @apiParam {String} to e.g. 2016-09-19
 * @apiParam {String} device ^(all||pc||mobile||^)$ e.g. pc
 *
 * @apiSuccess {Number} uid user identity
 * @apiSuccess {Array} referrals convertion referral path
 * @apiSuccess {Array} dates referral date
 * @apiSuccess {String} conversionDate conversion date
 * @apiSuccess {String} product product name
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "data": [
 *         {
 *           "uid": 1012034,
 *           "referrals": [
 *             "others / Referral",
 *             "LINE",
 *             "LINE",
 *             "LINE",
 *             "Direct / Referral"
 *           ],
 *           "dates": [
 *             "2016-12-10 19:52",
 *             "2016-12-11 10:17",
 *             "2016-12-15 20:01",
 *             "2016-12-15 20:58",
 *             "2016-12-15 23:18"
 *           ],
 *           "conversionDate": "2016-12-15 23:18",
 *           "product": "X-TRAIL"
 *         }
 *       ]
 *     }
 */

'use strict';

var cons = require('../../lib/footprints-rds');
var async = require('async');
var connection;
  
module.exports.handler = function(event, context, callback) {

    cons.connect(event.domain, callback).then(function(con) {

        connection = con;

        connection.on('error', function (err, result) {
            console.log(err);
            reconnect();
        });

        var draw = parseInt(event.draw) ? event.draw : 0;
        var start = parseInt(event.start) ? event.start : 0;
        var length = parseInt(event.length) ? event.length : 10;

        var deviceCondition = !/^(pc|mobile)$/.test(event.device) ? `` : `
            AND EXISTS (SELECT 1 FROM client_date WHERE	client_date.uid = session_client.uid AND client_date.isPC = ${(event.device == 'pc' ? 1 : 0)})`;

        async.parallel([
                function (cb) {
                    var queryString = `
                        SELECT COUNT(uid) AS total
                        FROM session_client FORCE INDEX (id_sc_firstTimestamp)
                        WHERE
                            conversionStatus
                            AND firstTimestamp BETWEEN '${escape(event.from)} 00:00:00' AND DATE_ADD('${escape(event.to)} 00:00:00', INTERVAL 1 DAY)
                            ${deviceCondition}
                        `;

                    q(queryString, cb);
                },
                function (cb) {
                    async.waterfall([
                            function (cb) {

                                var queryString = `
                                    SELECT
                                        uid,
                                        firstTimestamp
                                    FROM session_client FORCE INDEX (id_book)
                                    WHERE
                                        firstTimestamp BETWEEN '${escape(event.from)} 00:00:00' AND DATE_ADD('${escape(event.to)} 00:00:00', INTERVAL 1 DAY)
                                        AND conversionStatus
                                        ${deviceCondition}
                                    ORDER BY firstTimestamp DESC
                                    LIMIT ${start}, ${length};

                                    SELECT * FROM media_list;`;

                                q(queryString, cb);
                            },
                            function (targets, cb) {

                                var mediaList = [];
                                for (var key in targets[1]) {
                                    mediaList[targets[1][key].mediaId] = targets[1][key].mediaName;
                                }

                                async.map(targets[0], conversionSegment,function (err, results) {

                                    if (err) {
                                        console.log(err);
                                        cb(err)
                                    }

                                    cb(null, results);
                                });

                                function conversionSegment(target, cb) {

                                    var queryString = `
                                        SELECT
                                            uid,
                                            DATE_FORMAT(firstTimestamp, '%Y-%m-%d %H:%i') AS date,
                                            mediaId,
                                            conversionStatus,
                                            CASE WHEN productName IS NULL OR productName = 'undefined' THEN '' ELSE productName END AS productName
                                        FROM
                                            session_client FORCE INDEX (id_last_access)
                                            LEFT JOIN (
                                                SELECT
                                                    sessionId,
                                                    GROUP_CONCAT(DISTINCT productName ORDER BY productName SEPARATOR ', ') AS productName
                                                FROM
                                                    session_booking
                                                    INNER JOIN product_list
                                                    ON session_booking.productId = product_list.productId
                                                GROUP BY sessionId) AS session_booking
                                            ON session_client.sessionId = session_booking.sessionId
                                        WHERE
                                            uid = ${target.uid}
                                            AND firstTimestamp <= '${target.firstTimestamp}'
                                            ${deviceCondition}
                                        ORDER BY uid, date`;

                                    connection.query(queryString, function(err, rows, fields) {

                                        if (err) {
                                            console.log(err);
                                            cb(err);
                                        }

                                        rows.forEach(function(item, i) {
                                            var mediaName = mediaList[item.mediaId];
                                            item.mediaName = mediaName != '' ? mediaName : 'Direct';
                                        });

                                        var conversionPos = [];
                                        rows.reduce(function(a, e, i) {
                                            if (e.conversionStatus > 0)
                                                a.push(i);
                                            return a;
                                        }, conversionPos);

                                        var start = conversionPos.length > 1 ? conversionPos[conversionPos.length - 2] + 1 : 0;
                                        var end = conversionPos[conversionPos.length - 1];

                                        var customer = createNewCustomer(target.uid);

                                        for (var i = start; i <= end; i++) {

                                            customer.referrals.push(rows[i].mediaName);
                                            customer.dates.push(rows[i].date);

                                            if (rows[i].conversionStatus > 0) {
                                                customer.conversionDate = rows[i].date;
                                                customer.product = rows[i].productName;
                                            }
                                        }

                                        cb(null, customer);
                                    });
                                }
                            }
                        ],
                        function (err, result) {

                            if (err) {
                                console.log(err);
                                cb(err);
                            }

                            cb(null, result);
                        }
                    );
                }
            ], function (err, results) {

                connection.destroy();

                if (err) {
                    console.log(err);
                    callback(err)
                }

                var data = {};

                data.draw = draw;
                data.recordsTotal = results[0][0].total;
                data.recordsFiltered = results[0][0].total;
                data.data = results[1];

                callback(null, data);
        });
    });
};

function createNewCustomer (uid) {
    var row = {};
    row.uid = uid;

    row.referrals = [];
    row.dates = [];

    return row;
}

function q(queryString, cb) {

    connection.query(queryString, function(err, rows, fields) {

        if (err) {
            console.log(err);
            cb(err);
        } else {
            cb(null, rows);
        }
    });
}

function escape (source) {

    return connection.escape(source).replace(/\'/g,"");
}

function reconnect() {

    cons.connect().then(function(con){

        connection = con;

        connection.on('error', function (err, result) {
            console.log(err);
            reconnect();
        });
    },
    function (error) {

        setTimeout(reconnect, 2000);
    });
}
