var Promise = require('bluebird');
var redis = require('redis').createClient();
var querystring = require('querystring');

var cache = module.exports;

cache.get = function (path, parameters) {
	var key = path;

	if (parameters === undefined) {
		parameters = {};
	}

	delete parameters['client_id'];
	delete parameters['access_token'];

	if (Object.keys(parameters) !== 0) {
		key += '?' + querystring.stringify(parameters);
	}

	return new Promise(function (resolve, reject) {
		redis.get(key, function (err, reply) {
			if (err) {
				reject(err);
			}

			else {
				resolve(JSON.parse(reply));
			}
		});
	});
};

cache.set = function (path, parameters, buf) {
	var key = path;
	
	if (parameters === undefined) {
		parameters = {};
	}

	delete parameters['client_id'];
	delete parameters['access_token'];

	if (Object.keys(parameters) !== 0) {
		key += '?' + querystring.stringify(parameters);
	}

	return new Promise(function (resolve, reject) {
		redis.set(key, buf, function (err, reply) {
			if (err) {
				reject(err);
			}

			else {
				resolve(reply);
			}
		});
	});
};