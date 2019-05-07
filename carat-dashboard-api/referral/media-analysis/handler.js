/**
 * @api {get} /media-analysis Media Analysis
 * @apiName media-analysis
 * @apiGroup Referral
 *
 * @apiDescription 媒體分析 1. 媒體名稱 2. 不重複使用者數 3. 回訪使用者數
 * 4. 工作階段量 5. 跳出量 6. 平均工作階段瀏覽量 7. 平均工作階段時間
 * 8. 規配觀看數 9. 預約試乘量 10. 新使用者數
 * 11. 新使用者比率 12. 跳出率 13. 規配表轉換率
 *
 * @apiParam {String} domain e.g. nissan
 * @apiParam {String} group cluster id
 * @apiParam {String} from e.g. 2016-09-12
 * @apiParam {String} to e.g. 2016-09-19
 * @apiParam {String} device ^(all||pc||mobile||^)$ e.g. pc
 *
 * @apiSuccess {String} media media name
 * @apiSuccess {Number} uniqueVisitors unique visitor count
 * @apiSuccess {Number} returningVisitors returning visitor count
 * @apiSuccess {Number} sessions session count
 * @apiSuccess {Number} bounces bounce count
 * @apiSuccess {Number} averagePageviews average session pageviews
 * @apiSuccess {Number} averageTime average session duration
 * @apiSuccess {Number} specs spec count
 * @apiSuccess {Number} bookings booking count
 * @apiSuccess {Number} newVisitors new visitor count
 * @apiSuccess {Number} newRate new visitor rate
 * @apiSuccess {Number} bounceRate bounce rate
 * @apiSuccess {Number} specRate spec rate
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "media": "Google Organic / Referral",
 *       "uniqueVisitors": 20397,
 *       "returningVisitors": 1241,
 *       "sessions": 23515,
 *       "bounces": 11142,
 *       "averagePageviews": 6.6301,
 *       "averageTime": 2.638,
 *       "specs": 2892,
 *       "bookings": 11,
 *       "newVisitors": 19156,
 *       "newRate": 0.94,
 *       "bounceRate": 0.48,
 *       "specRate": 0.09
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

		var baseClients = parseInt(event.group) ? `AND EXISTS (SELECT 1 FROM cluster_client WHERE clusterId = ${escape(event.group)} AND uid = session_client.uid)` : ``;
		var deviceCondition = !/^(pc|mobile)$/.test(event.device) ? `` : `
			AND EXISTS (SELECT 1 FROM client_date WHERE	client_date.uid = session_client.uid AND client_date.isPC = ${(event.device == 'pc' ? 1 : 0)})`;

		async.parallel([
				function (cb) {
					var queryString = `
						SELECT 
							COUNT(DISTINCT mediaName) AS total
						FROM 
							session_client FORCE INDEX (id_sc_firstTimestamp)
						    INNER JOIN media_list
						    ON session_client.mediaId = media_list.mediaId
						WHERE
							session_client.firstTimestamp BETWEEN '${escape(event.from)} 00:00:00' AND DATE_ADD('${escape(event.to)} 00:00:00', INTERVAL 1 DAY)
						    AND NOT mediaName RLIKE '(^|undefined)$'
						    ${baseClients}
						    ${deviceCondition};`;

					q(queryString, cb);
				},
				function (cb) {
					async.waterfall([
							function (cb) {

								var queryString = `
									SELECT 
										session_client.mediaId,
									    COUNT(session_client.sessionId) AS sessions
									FROM 
										session_client FORCE INDEX (id_sc_firstTimestamp)
									    INNER JOIN media_list
									    ON session_client.mediaId = media_list.mediaId
									WHERE
										session_client.firstTimestamp BETWEEN '${escape(event.from)} 00:00:00' AND DATE_ADD('${escape(event.to)} 00:00:00', INTERVAL 1 DAY)
									    AND NOT mediaName RLIKE '(^|undefined)$'
									    ${baseClients}
									    ${deviceCondition}
									GROUP BY mediaName
									ORDER BY sessions DESC
									LIMIT ${start}, ${length};`;

								q(queryString, cb);
							},
							function (targets, cb) {
								
								var mediaIds = `(0`;
								for (var key in targets) {
									mediaIds += `,${targets[key].mediaId}`;
								}
								mediaIds += `)`;

								var queryString = `
									SELECT 
										mediaName AS media,
									    COUNT(DISTINCT session_client.uid) AS uniqueVisitors,
									    COUNT(DISTINCT client_finger.uid) AS returningVisitors,
									    COUNT(session_client.sessionId) AS sessions,
									    SUM(session_client.eventCount = 1) AS bounces,
									    AVG(session_client.eventCount) AS averagePageviews,
									    ROUND(AVG(unix_timestamp(session_client.lastTimestamp) - unix_timestamp(session_client.firstTimestamp)) / 60, 3) AS averageTime,
									    SUM(specs > 0) AS sessionSpecs,
									    SUM(specs) AS specs,
									    SUM(bookings) AS bookings
									FROM 
										session_client FORCE INDEX (id_sc_firstTimestamp)
									    INNER JOIN media_list
									    ON session_client.mediaId = media_list.mediaId
									    LEFT JOIN client_finger
									    ON session_client.uid = client_finger.uid AND client_finger.createTimestamp < '${escape(event.from)} 00:00:00'
									    LEFT JOIN (
											SELECT 
												sessionId, 
												COUNT(sessionId) AS specs
											FROM session_spec FORCE INDEX (id_sspec_timestamp)
									        WHERE session_spec.timestamp BETWEEN '${escape(event.from)} 00:00:00' AND DATE_ADD('${escape(event.to)} 00:00:00', INTERVAL 1 DAY)
											GROUP BY sessionId) AS session_spec
										ON session_client.sessionId = session_spec.sessionId
									    LEFT JOIN (
											SELECT 
												sessionId, 
												COUNT(sessionId) AS bookings
											FROM session_booking FORCE INDEX (id_sb_timestamp)
									        WHERE session_booking.timestamp BETWEEN '${escape(event.from)} 00:00:00' AND DATE_ADD('${escape(event.to)} 00:00:00', INTERVAL 1 DAY)
											GROUP BY sessionId) AS session_booking
										ON session_client.sessionId = session_booking.sessionId
									WHERE
										session_client.firstTimestamp BETWEEN '${escape(event.from)} 00:00:00' AND DATE_ADD('${escape(event.to)} 00:00:00', INTERVAL 1 DAY)
									    AND NOT mediaName RLIKE '(^|undefined)$'
									    AND session_client.mediaId IN ${mediaIds}
									    ${baseClients}
									    ${deviceCondition}
									GROUP BY mediaName
									ORDER BY sessions DESC;`;

								q(queryString, cb);
							}
						], 
						function (err, result) {

							if (err) {
								console.log(err);
								cb(err);
							}

							cb(null, result);	
					});
				}
			],
			function (err,results) {

				connection.destroy();

				if (err) {
					console.log(err);
					cb(err);
				}

				var data = {};
				data.draw = draw;
				data.recordsTotal = results[0][0].total;
				data.recordsFiltered = results[0][0].total;
				
				for (var key in results[1]) {
					results[1][key].newVisitors = results[1][key].uniqueVisitors - results[1][key].returningVisitors;
					results[1][key].newRate = Math.ceil(results[1][key].newVisitors / results[1][key].uniqueVisitors * 100) / 100;
					results[1][key].bounceRate = Math.ceil(results[1][key].bounces / results[1][key].sessions * 100) / 100;
					results[1][key].specRate = Math.ceil(results[1][key].sessionSpecs / results[1][key].sessions * 100) / 100;

					results[1][key].specs = results[1][key].specs == null ? 0 : results[1][key].specs;
					results[1][key].bookings = results[1][key].bookings == null ? 0 : results[1][key].bookings; 
					delete results[1][key].sessionSpecs;
				}
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