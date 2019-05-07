/**
 * @api {get} /booking-info-table-adwords-group Booking Info Table - utm Term
 * @apiName booking-info-table-adwords-group
 * @apiGroup Referral
 *
 * @apiDescription 關鍵字群組轉換的簡單統計，nissan看預約試乘、mitsubishi為規配表觀看次數
 * 1. 群組名稱 2. 平均工作階段時間 3. 轉換數
 *
 * @apiParam {String} domain e.g. nissan
 * @apiParam {String} group cluster id
 * @apiParam {String} from e.g. 2016-09-12
 * @apiParam {String} to e.g. 2016-09-19
 * @apiParam {String} device ^(all||pc||mobile||^)$ e.g. pc
 *
 * @apiSuccess {String} group utm term
 * @apiSuccess {Number} averageTime average session duration
 * @apiSuccess {Number} conversions booking/spec count
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "data": [
 *         {
 *           "group": "CarRegular",
 *           "averageTime": 3.492,
 *           "conversions": 2
 *         },
 *         {
 *           "group": "Brand",
 *           "averageTime": 22,
 *           "conversions": 1
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
        var length = parseInt(event.length) ? event.length : 5;

        var deviceCondition = !/^(pc|mobile)$/.test(event.device) ? `` : `
            AND EXISTS (SELECT 1 FROM client_date WHERE	client_date.uid = session_client.uid AND client_date.isPC = ${(event.device == 'pc' ? 1 : 0)})`;

        async.parallel([
            function(cb){

                var specConversionTable = escape(event.domain) == 'nissan' ? `` : `
                    INNER JOIN session_spec
                    ON session_client.sessionId = session_spec.sessionId`;
                var conversionCondition = escape(event.domain) == 'nissan' ? `AND conversionStatus` : ``;

                var queryString = `
                    SELECT COUNT(DISTINCT utm_list.term) totalCount
                    FROM
                        session_client FORCE INDEX (id_sc_firstTimestamp)
                        INNER JOIN utm_list
                        ON session_client.utmId = utm_list.utmId
                        ${specConversionTable}
                    WHERE
                        session_client.firstTimestamp BETWEEN '${escape(event.from)} 00:00:00' AND DATE_ADD('${escape(event.to)} 00:00:00', INTERVAL 1 DAY)
                        ${conversionCondition}
                        ${deviceCondition}
                        AND utm_list.term <> '';`;

                q(queryString, cb);
            },
            function(cb){

                var specConversionTable = escape(event.domain) == 'nissan' ? `` : `
                    INNER JOIN (
                        SELECT
                            sessionId,
                            COUNT(sessionId) AS conversions
                        FROM session_spec
                        GROUP BY sessionId) AS session_spec
                    ON session_client.sessionId = session_spec.sessionId`;
                var conversionCondition = escape(event.domain) == 'nissan' ? `AND conversionStatus` : ``;
                var conversionColumn = escape(event.domain) == 'nissan' ? `conversionStatus` : `conversions`;

                var queryString = `
                    SELECT
                        utm_list.term AS 'group',
                        ROUND(AVG(unix_timestamp(lastTimestamp) - unix_timestamp(firstTimestamp)) / 60, 3) AS averageTime,
                        SUM(${conversionColumn}) AS conversions
                    FROM
                        session_client FORCE INDEX (id_sc_firstTimestamp)
                        INNER JOIN utm_list
                        ON session_client.utmId = utm_list.utmId
                        ${specConversionTable}
                    WHERE
                        firstTimestamp BETWEEN '${escape(event.from)} 00:00:00' AND DATE_ADD('${escape(event.to)} 00:00:00', INTERVAL 1 DAY)
                        ${conversionCondition}
                        ${deviceCondition}
                        AND utm_list.term <> ''
                    GROUP BY utm_list.term
                    ORDER BY conversions DESC, averageTime DESC
                    LIMIT ${start}, ${length};
                    `;

                q(queryString, cb);
            }
        ],
        function(err, results){

            connection.destroy();

            if (err) {
                console.log(err);
                cb(err)
            }

            var data = {};
            data.draw = draw;

            data.recordsTotal = results[0][0].totalCount;
            data.recordsFiltered = results[0][0].totalCount;
            data.data = results[1];

            callback(null, data);
        });
    });
};

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
