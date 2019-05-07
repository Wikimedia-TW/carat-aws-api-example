/**
 * @api {get} /exit-page-table Exit Page Table
 * @apiName exit-page-table
 * @apiGroup User Analysis
 *
 * @apiDescription 離站分析 1. 離開頁面網址 2. 離開次數 3. 工作階段數 4. 總訪問量 5. 不重複使用者數 6. 平均頁面瀏覽時間 7.離開率
 *
 * @apiParam {String} domain e.g. nissan
 * @apiParam {String} group cluster id
 * @apiParam {String} from e.g. 2016-09-12
 * @apiParam {String} to e.g. 2016-09-19
 * @apiParam {String} device ^(all||pc||mobile||^)$ e.g. pc
 *
 * @apiSuccess {Number} draw datatable rendered times
 * @apiSuccess {Number} recordsTotal total records
 * @apiSuccess {Number} recordsFiltered total filtered records
 * @apiSuccess {Object[]} data
 * @apiSuccess {String} data.landingPage landing page url
 * @apiSuccess {Number} data.exits exit count
 * @apiSuccess {Number} data.sessions session count
 * @apiSuccess {Number} data.totalVisitors total visitor count
 * @apiSuccess {Number} data.uniqueVisitors unique visitor count
 * @apiSuccess {Number} data.averageTime average pageview duration(estimated)
 * @apiSuccess {String} data.exitRate exit rate
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "draw": 0,
 *       "recordsTotal": 7932,
 *       "recordsFiltered": 7932,
 *       "data": [
 *         {
 *           "landingPage": "new.nissan.com.tw/nissan",
 *           "exits": 8463,
 *           "sessions": 24201,
 *           "totalVisitors": 39190,
 *           "uniqueVisitors": 20087,
 *           "averageTime": 0.65,
 *           "exitRate": "34.97 %"
 *         },
 *         {
 *           "landingPage": "event.nissan.com.tw/2016story/",
 *           "exits": 6748,
 *           "sessions": 8219,
 *           "totalVisitors": 9995,
 *           "uniqueVisitors": 7720,
 *           "averageTime": 0.76,
 *           "exitRate": "82.10 %"
 *         }
 *       ]
 *     } */

'use strict';

var cons = require('../../lib/footprints-rds');
var async = require('async');
var connection;

const INSERTING_GAP_INTERVAL = 0.6;
  
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
					SELECT COUNT(DISTINCT nodeIdLast) AS total 
					FROM session_client FORCE INDEX (id_sc_firstTimestamp)
					WHERE 
						firstTimestamp BETWEEN '${escape(event.from)} 00:00:00' AND DATE_ADD('${escape(event.to)} 00:00:00', INTERVAL 1 DAY)
						${baseClients}
						${deviceCondition}`;

				q(queryString, cb);
			},
			function (cb) {

				async.waterfall([
						function (cb) {

							var queryString = `
								SELECT nodeIdLast 
								FROM session_client FORCE INDEX (id_sc_firstTimestamp)
								WHERE 
									firstTimestamp BETWEEN '${escape(event.from)} 00:00:00' AND DATE_ADD('${escape(event.to)} 00:00:00', INTERVAL 1 DAY)
									${baseClients}
									${deviceCondition}
								GROUP BY nodeIdLast 
								ORDER BY COUNT(nodeIdLast) DESC
								LIMIT ${start}, ${length}
							`;

							q(queryString, cb);
						},
						function (selectedPages, cb) {

							var pages = `AND nodeIdTo IN (0`;
							for (var key in selectedPages) {
								pages += `,` + selectedPages[key].nodeIdLast;
							}
							pages += `)`;

							var queryString = `
								SELECT 
									CONCAT(to_node_list.hostName, to_node_list.pathName, to_node_list.search) AS landingPage,
									SUM(nodeIdTo = nodeIdLast AND (UNIX_TIMESTAMP(lastTimestamp) - UNIX_TIMESTAMP(timestamp)) BETWEEN -${INSERTING_GAP_INTERVAL} AND ${INSERTING_GAP_INTERVAL}) AS exits,
									COUNT(DISTINCT session_node.sessionId) AS sessions,
									COUNT(session_node.sessionId) AS totalVisitors,
									COUNT(DISTINCT session_client.uid) AS uniqueVisitors,
									ROUND(AVG((UNIX_TIMESTAMP(lastTimestamp) - UNIX_TIMESTAMP(firstTimestamp)) / 60 / eventCount), 3) AS averageTime
								FROM
									session_node FORCE INDEX (id_exit_page_table)
									INNER JOIN session_client
									ON session_node.sessionId = session_client.sessionId
									INNER JOIN node_list AS to_node_list
									ON session_node.nodeIdTo = to_node_list.nodeId
								WHERE
									timestamp BETWEEN '${escape(event.from)} 00:00:00' AND DATE_ADD('${escape(event.to)} 00:00:00', INTERVAL 1 DAY)
									${pages}
									${baseClients}
									${deviceCondition}
								GROUP BY landingPage
								ORDER BY exits DESC`;

							q(queryString, cb);
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
		],
		function (err, results) {

			connection.destroy();

			if (err) {
				console.log(err);
				callback(err);
			} else {

				var data = {};

				data.draw = draw;
				data.recordsTotal = results[0][0].total;
				data.recordsFiltered = results[0][0].total;

				for (var key in results[1]) {
					results[1][key].exitRate = Math.ceil(results[1][key].exits / results[1][key].sessions * 100 * 100) / 100;
				}

				data.data = results[1];

				callback(null, data);
			}
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
