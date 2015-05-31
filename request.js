var Promise = require('bluebird');
var querystring = require('querystring');
var https = require('https');

var cache = require('./cache.js');

var request_module = module.exports;

var rate = 5000 / 3600;
var current_request;

request_module.https_request = function (path, parameters) {
	var options = {
		host: 'api.instagram.com',
		path: path,
		method: 'GET'
	};

	if (parameters === undefined) {
		parameters = {};
	}

	parameters['client_id'] = client_id;

	options['path'] += '?' + querystring.stringify(parameters);

	var buf = '';

	return new Promise(function (resolve, reject) {
		var req = https.request(options, function (res) {
			res.on('data', function (chunk) {
				buf += chunk;
			});

			res.on('end', function () {
				try {
					cache.set(path, parameters, buf);

					resolve(JSON.parse(buf));
				} catch (err) {
					reject(err);
				}
			});
		});

		req.on('error', function (err) {
			reject(err);
		});

		req.end();
	});
};

request_module.delay_request = function (path, parameters) {
	return (current_request || Promise.resolve()).then(function() {
		current_request = Promise.delay(rate)
			.then(function () {
				return request_module.https_request(path, parameters);
			});

		return current_request;
	});
};

request_module.request = function (path, parameters) {
	return cache.get(path, parameters)
		.then(function (res) {
			if (res === null) {
				return request_module.delay_request(path, parameters);
			}

			return res;
		});
};