var Promise = require('bluebird');
var querystring = require('querystring');
var https = require('https');

var cache = require('./cache.js');

var request_module = module.exports;

var rate = 3600 / 5000 * 1000; /* 5,000 requests per hour */
var queue = [];

request_module.https_request = function (path, parameters, client_id) {
	var options = {
		host: 'api.instagram.com',
		path: path,
		method: 'GET'
	};

	if (parameters === undefined) {
		parameters = {};
	}

	parameters['access_token'] = client_id;

	options['path'] += '?' + querystring.stringify(parameters);

	var buf = '';

	return new Promise(function (resolve, reject) {
		Promise.delay(rate)
		.then(function () {
			var req = https.request(options, function (res) {
				res.on('data', function (chunk) {
					buf += chunk;
				});

				res.on('end', function () {
					try {
						var data = JSON.parse(buf);
						
						if (data['code'] === 429) {
							throw new Error('rate limited');
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
	});
};

request_module.request_wrapper = function (path, parameters, client_id) {
	var response;

	return cache.get(path, parameters)
		.then(function (res) {
			if (res !== null) {
				process.stdout.write('c'); /* for progress */
				return res;
			}

			process.stdout.write('r'); /* for progress */

			return request_module.https_request(path, parameters, client_id);
		});
};

request_module.request_loop = function () {
	var request = queue[0];

	if (request !== undefined) {
		request_module.request_wrapper(request['path'], request['parameters'], request['client_id'])
		.then(function (res) {
			queue.shift();

			request['resolve'](res);

			request_module.request_loop();
		})
		.catch(function (err) {
			request['reject'](err);
		});
	}

	else {
		setTimeout(request_module.request_loop, 66);
	}
}

request_module.request = function (path, parameters, client_id) {
	return new Promise(function (resolve, reject) {
		queue.push({
			resolve: resolve,
			reject: reject,
			path: path,
			parameters: parameters,
			client_id: client_id
		});
	})
};