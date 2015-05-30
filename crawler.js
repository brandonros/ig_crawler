<<<<<<< HEAD
var Promise = require('bluebird');
var https = require('https');
var fs = require('fs');
var querystring = require('querystring');

var cache = require('./cache.js');

var crawler = module.exports;

var rate = 5000 / 3600;
var current_request;

Promise.onPossiblyUnhandledRejection = function (err) {
	console.log(err.message, err.stack);
}

crawler.https_request = function (path, parameters) {
	return new Promise(function (resolve, reject) {
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

		var req = https.request(options, function (res) {
			res.on('data', function (chunk) {
				buf += chunk;
			});

			res.on('end', function () {
				try {
					cache.set(path, parameters, buf);

					resolve(JSON.parse(buf));
				}
				
				catch (err) {
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

crawler.delay_request = function (path, parameters) {
	return (current_request || Promise.resolve()).then(function() {
		console.log('sleeping');
		
		current_request = Promise.delay(rate)
							.then(function () {
								return crawler.https_request(path, parameters)
							});

		return current_request;
	});
};

crawler.request = function (path, parameters) {
	return cache.get(path, parameters)
			.then(function (res) {
				if (res === null) {
					return crawler.delay_request(path, parameters)
				}

				return Promise.resolve(res);
			});
};

crawler.get_comments = function (media, client_id) {
	if (media['comments']['count'] <= 20) {
		return Promise.resolve(media['comments']['data']);
	}

	return crawler.request('/v1/media/' + media['id'] + '/comments')
			.then(function (res) {
				return res['data'];
			});
};

crawler.get_user = function (user_name, client_id) {
	return crawler.request('/v1/users/search/', { q: user_name })
			.then(function (res) {
				var user_id;

				for (var i = 0; i < res['data'].length; ++i) {
					if (res['data'][i]['username'] === user_name) {
						user_id = res['data'][i]['id'];
						break;
					}
				}

				if (user_id === undefined) {
					throw new Error('user not found');
				}

				return user_id;
			});
};

crawler.get_media = function (user_id, client_id, next_max_id, media) {
	var media_res;

	if (media === undefined) {
		media = [];
	}

	var path = '/v1/users/' + user_id + '/media/recent/';
	var parameters = { 
 		count: 33
 	};

	if (next_max_id !== undefined) {
		parameters['max_id'] = next_max_id;
	}
 
	return crawler.request(path, parameters)
			.then(function (res) {
				if (res['meta']['code'] !== 200) {
					throw new Error('bad meta');
				}
		 
				next_max_id = res['pagination']['next_max_id'];
				media_res = res;
		 
				return Promise.all(res['data'].map(function(m) {
					return crawler.get_comments(m, client_id);
				}));
			})
			.then(function (res) {
				for (var i = 0; i < res.length; ++i) {
					media_res['data'][i]['comments']['data'] = res[i];
				}
		 
				media = media.concat(media_res['data']);
		 
				if (next_max_id !== undefined) {
					return crawler.get_media(user_id, client_id, next_max_id, media);
				}

				return Promise.resolve(media);
			});
};
=======
var https = require('https');
var Q = require('q');
var fs = require('fs');

function r(path) {
	var deferred = Q.defer();

	var options = {
		host: 'api.instagram.com',
		path: path,
		method: 'GET'
	};

	var buf = '';

	var req = https.request(options, function (res) {
		res.on('data', function (chunk) {
			buf += chunk;
		})

		res.on('end', function () {
			try {
				deferred.resolve(JSON.parse(buf));
			}
			
			catch (err) {
				deferred.reject(err);
			}
		})
	})

	req.on('error', function (err) {
		deferred.reject(err);
	})

	req.end();

	return deferred.promise;
}

function get_comments(media, client_id) {
	var deferred = Q.defer();

	if (media['comments']['count'] <= 20) {
		deferred.resolve(media['comments']['data']);
	}

	else {
		r('/v1/media/' + media['id'] + '/comments?client_id=' + client_id)
		.then(function (res) {
			deferred.resolve(res['data']);
		})
		.catch(function (err) {
			deferred.reject(err);
		})
	}

	return deferred.promise;
}

function get_user(user_name, client_id) {
	var deferred = Q.defer();

	r('/v1/users/search/?q=' + user_name + '&client_id=' + client_id)
	.then(function (res) {
		var user_id;

		for (var i = 0; i < res['data'].length; ++i) {
			if (res['data'][i]['username'] === user_name) {
				user_id = res['data'][i]['id'];
				break;
			}
		}

		if (user_id === undefined) {
			throw new Error('user not found');
		}

		deferred.resolve(user_id)
	})
	.catch(function (err) {
		deferred.reject(err);
	})

	return deferred.promise;
}

function get_media(user_id, client_id, next_max_id, deferred, media) {
	if (deferred === undefined) {
		deferred = Q.defer();
		media = [];
	}

	var next_max_id;
	var media_res;

	var path = '/v1/users/' + user_id + '/media/recent/?count=33&client_id=' + client_id;
	if (next_max_id !== undefined) {
		path += '&max_id=' + next_max_id;
	}

	r(path)
	.then(function (res) {
		if (res['meta']['code'] !== 200) {
			throw new Error('bad meta');
		}

		next_max_id = res['pagination']['next_max_id'];
		media_res = res;

		var promises = [];

		for (var i = 0; i < res['data'].length; ++i) {
			promises.push(get_comments(res['data'][i], client_id))
		}

		return Q.all(promises)
	})
	.then(function (res) {
		for (var i = 0; i < res.length; ++i) {
			media_res['data'][i]['comments']['data'] = res[i];
		}

		media = media.concat(media_res['data']);

		if (next_max_id !== undefined) {
			get_media(user_id, client_id, next_max_id, deferred, media)
		}

		else {
			deferred.resolve(media)
		}
	})
	.catch(function (err) {
		deferred.reject(err)
	})

	return deferred.promise;
}
>>>>>>> 741f0b050e1456a54e5b398e51132098237772ef

if (process['argv'].length !== 4) {
	console.error('usage: comment_crawler username client_id');
	return false;
}

var user_name = process['argv'][2];
var client_id = process['argv'][3];

<<<<<<< HEAD
crawler.get_user(user_name, client_id)
.then(function (user_id) {
	return crawler.get_media(user_id, client_id);
=======
get_user(user_name, client_id)
.then(function (user_id) {
	return get_media(user_id, client_id)
>>>>>>> 741f0b050e1456a54e5b398e51132098237772ef
})
.then(function (media) {
	var comments = [];

	for (var i = 0; i < media.length; ++i) {
		comments = comments.concat(media[i]['comments']['data']);
	}

	fs.writeFileSync(user_name + '_' + new Date() + '_comments.json', JSON.stringify(comments));
<<<<<<< HEAD

	process.exit(0);
})
.catch(function (err) {
	console.log(err.message, err.stack);
});
=======
})
.catch(function (err) {
	console.error(err);
})
>>>>>>> 741f0b050e1456a54e5b398e51132098237772ef
