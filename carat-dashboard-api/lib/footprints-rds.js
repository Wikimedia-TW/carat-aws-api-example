'use strict';

var q = require('q');
var mysql = require('mysql');
var connections = {};

connections.connect = function(domain, callback) {
    var d = q.defer();

    connections.pool  = mysql.createPool({
        multipleStatements : true,
        host     : process.env.RDS_HOST,
        user     : process.env.RDS_USER,
        password : process.env.RDS_PASSWORD,
        database : 'carat_161108_' + domain + process.env.RDS_SUFFIX
    });

    connections.pool.getConnection(function(err, connection) {
        if (err) {
            console.log(err);
            callback(err);
            d.reject();
        } else {
            d.resolve(connection);
        }
    });

    return d.promise;
}

module.exports = connections;