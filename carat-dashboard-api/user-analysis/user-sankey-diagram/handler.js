/**
 * @api {get} /user-sankey-diagram User Sankey Diagram
 * @apiName user-sankey-diagram
 * @apiGroup User Analysis
 *
 * @apiDescription 使用者網頁瀏覽歷程分佈，A網頁->B網頁次數前45名組成的Graph圖
 *
 * @apiParam {String} domain e.g. nissan
 * @apiParam {String} group cluster id
 * @apiParam {String} from e.g. 2016-09-12
 * @apiParam {String} to e.g. 2016-09-19
 * @apiParam {String} device ^(all||pc||mobile||^)$ e.g. pc
 *
 * @apiSuccess {Object[]} nodes
 * @apiSuccess {Number} nodes.node node id
 * @apiSuccess {String} nodes.name node url
 * @apiSuccess {Object[]} links
 * @apiSuccess {Number} links.source source id
 * @apiSuccess {Number} links.target target id
 * @apiSuccess {Number} links.value visiting count
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "data": {
 *         "nodes": [
 *           {
 *             "node": 1,
 *             "name": "new.nissan.com.tw/nissan"
 *           },
 *           {
 *             "node": 2,
 *             "name": "new.nissan.com.tw/nissan/cars/MURANO"
 *           },
 *           {
 *             "node": 3,
 *             "name": "new.nissan.com.tw/nissan/cars/lineup"
 *           }
 *         ],
 *         "links": [
 *           {
 *             "source": 21,
 *             "target": 6,
 *             "value": 3714
 *           },
 *           {
 *             "source": 21,
 *             "target": 2,
 *             "value": 3655
 *           },
 *           {
 *             "source": 10,
 *             "target": 20497,
 *             "value": 2171
 *           }
 *         ]
 *       }
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
		
		var limit = 45;
		
		var baseClusterCondiion = parseInt(event.group) ? `
			AND EXISTS (SELECT 1 FROM cluster_client, session_client WHERE session_node.sessionId = session_client.sessionId AND cluster_client.uid = session_client.uid AND cluster_client.clusterId = ${escape(event.group)})
			` : ``;

		var deviceCondition = !/^(pc|mobile)$/.test(event.device) ? `` : `
			AND EXISTS (SELECT 1 FROM client_date, session_client WHERE session_node.sessionId = session_client.sessionId AND client_date.uid = session_client.uid AND client_date.isPC = ${(event.device == 'pc' ? 1 : 0)})`;

		async.parallel([
			function (cb) {
				async.waterfall([
					function (cb) {

						var queryString = `
							SELECT 
								session_node.nodeIdFrom,
								session_node.nodeIdTo,
								COUNT(session_node.sessionId) AS accessCount
							FROM 
								session_node FORCE INDEX (id_sn_timestamp)
							WHERE 
								session_node.timestamp BETWEEN '${escape(event.from)} 00:00:00' AND DATE_ADD('${escape(event.to)} 00:00:00', INTERVAL 1 DAY)
								AND session_node.nodeIdFrom != session_node.nodeIdTo
								${baseClusterCondiion}
								${deviceCondition}
							GROUP BY nodeIdFrom, nodeIdTo 
							ORDER BY accessCount DESC 
							LIMIT ${limit}`;

						q(queryString, cb);
					}, 
					function (selectedNodes, cb) {
						
						var nodeArray = [];
						for (var key in selectedNodes) {
							if (nodeArray.indexOf(selectedNodes[key].nodeIdFrom) == -1) {
								nodeArray.push(selectedNodes[key].nodeIdFrom);
							}

							if (nodeArray.indexOf(selectedNodes[key].nodeIdTo) == -1) {
								nodeArray.push(selectedNodes[key].nodeIdTo);
							}
						}

						var nodes = `nodeId IN (0`;

						for (var key in nodeArray) {
							nodes += `,` + nodeArray[key]
						}
						nodes += `)`;

						var queryString = `
							SELECT 
								nodeId AS node, 
								CONCAT(hostName, pathName, search) AS name
							FROM node_list 
							WHERE ${nodes} 
							ORDER BY node`;

						q(queryString, cb);
					}
				], 
				function (err, result){
					if (err) {
						console.log(err);
						callback(err);
					}

					for (var key in result) {
						if (result[key].name == 'nullnull'){
							result[key].name = 'blank';
						}
					}

					cb(null, result);
				})
			},
			function (cb) {

				var queryString = `
					SELECT 
						session_node.nodeIdFrom AS source, 
						session_node.nodeIdTo AS target, 
						COUNT(session_node.sessionId) AS value 
					FROM 
						session_node FORCE INDEX (id_sn_timestamp)
					WHERE
						session_node.timestamp BETWEEN '${escape(event.from)} 00:00:00' AND DATE_ADD('${escape(event.to)} 00:00:00', INTERVAL 1 DAY)
						AND session_node.nodeIdFrom != session_node.nodeIdTo
						${baseClusterCondiion}
						${deviceCondition}
					GROUP BY source, target
					ORDER BY value DESC 
					LIMIT ${limit}`;

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
			data.data = {};
			data.data.nodes = results[0];
			data.data.links = results[1];

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