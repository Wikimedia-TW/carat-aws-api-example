/**
 * @api {get} /browser-distribution Browser Distribution
 * @apiName browser-distribution
 * @apiGroup User Analysis
 *
 * @apiDescription 使用者瀏覽器分佈
 *
 * @apiParam {String} domain e.g. nissan
 * @apiParam {String} group cluster id
 * @apiParam {String} from e.g. 2016-09-12
 * @apiParam {String} to e.g. 2016-09-19
 * @apiParam {String} device ^(all||pc||mobile||^)$ e.g. pc
 *
 * @apiSuccess {Number} averageTime average session duration
 * @apiSuccess {Number} rate rate
 * @apiSuccess {String} browser browser name
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "data": [
 *         {
 *           "averageTime": 1.791,
 *           "rate": 47.61,
 *           "browser": "Chrome Mobile"
 *         },
 *         {
 *           "averageTime": 3.345,
 *           "rate": 25.63,
 *           "browser": "Chrome"
 *         },
 *         {
 *           "averageTime": 1.46,
 *           "rate": 23.86,
 *           "browser": "Mobile Safari"
 *         },
 *         {
 *           "averageTime": 2.33,
 *           "rate": 8.57,
 *           "browser": "IE"
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

		var baseClients = parseInt(event.group) ? `AND EXISTS (SELECT 1 FROM cluster_client WHERE clusterId = ${escape(event.group)} AND uid = client_date.uid)` : ``;

		var clientDateDeviceCondition = !/^(pc|mobile)$/.test(event.device) ? `` : `
			AND isPC = ${(event.device == 'pc' ? 1 : 0)}`;

		async.parallel([
				function (cb) {
					var queryString = `
						SELECT COUNT(DISTINCT uid) AS total
						FROM client_date FORCE INDEX (id_cd_accessDate)
						WHERE 
							accessDate BETWEEN '${escape(event.from)}' AND '${escape(event.to)}'  
							${baseClients}`;

					q(queryString, cb);
				},
				function (cb) {
					var queryString = `
						SELECT
							ROUND(AVG(UNIX_TIMESTAMP(lastTimestamp) - UNIX_TIMESTAMP(firstTimestamp)) / 60 , 3) AS averageTime,
							COUNT(DISTINCT client_date.uid) AS count, 
							browser 
						FROM 
							client_date FORCE INDEX (id_cd_accessDate),
							session_client
						WHERE
							accessDate BETWEEN '${escape(event.from)}' AND '${escape(event.to)}'
							AND firstTimestamp BETWEEN '${escape(event.from)} 00:00:00' AND DATE_ADD('${escape(event.to)} 00:00:00', INTERVAL 1 DAY)
							AND client_date.uid = session_client.uid
							${baseClients}
							${clientDateDeviceCondition}
						GROUP BY browser 
						ORDER BY count DESC 
						LIMIT 10`;

					q(queryString, cb);
				}
			], 
			function (err, results) {

				connection.destroy();

				if (err) {
					console.log(err);
					callback(err);
				}

				var data = {};
				data.data = [];

				var total = results[0][0].total;
				for (var key in results[1]) {
					data.data.push({
						averageTime : results[1][key].averageTime,
						rate : parseFloat((results[1][key].count / total * 100).toFixed(2)),
						browser : results[1][key].browser
					});
				}

				callback(null, data);
		});

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
	});
};

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
