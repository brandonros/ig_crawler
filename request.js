var Promise = require('bluebird');
var querystring = require('querystring');
var https = require('https');

var cache = require('./cache.js');

var request_module = module.exports;

var rate = 3600 / 5000 * 1000; /* 5,000 requests per hour */
var current_request;

request_module.https_request = function (path, parameters, client_id) {
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
					var data = JSON.parse(buf);
					
					if (data['code'] === 429) {
						Promise.delay(rate)
						.then(function () {
							return request_module.https_request(path, parameters, client_id)
						})
						.then(function (res) {
							resolve(res);
						});
					}

					else {
						cache.set(path, parameters, buf);

						resolve(data);
					}
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

request_module.delay_request = function (path, parameters, client_id) {
	return (current_request || Promise.resolve()).then(function() {
		current_request = Promise.delay(rate)
			.then(function () {
				return request_module.https_request(path, parameters, client_id);
			});

		return current_request;
	});
};

request_module.request = function (path, parameters, client_id) {
	return cache.get(path, parameters)
		.then(function (res) {
			if (res === null) {
				return request_module.delay_request(path, parameters, client_id);
			}

			return res;
		});
};