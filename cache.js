var Promise = require('bluebird');
var redis = require('redis').createClient();
var querystring = require('querystring');

var cache = module.exports;

cache.get = function (path, parameters) {
	return new Promise(function (resolve, reject) {
		delete parameters['client_id'];

		var key = path + '?' + querystring.stringify(parameters);

		redis.get(key, function (err, reply) {
			if (err) {
				reject(err);
			}

			else {
				resolve(JSON.parse(reply));
			}
		})
	})
}

cache.set = function (path, parameters, buf) {
	delete parameters['client_id'];

	var key = path + '?' + querystring.stringify(parameters);

	redis.set(key, buf);
}