var Promise = require('bluebird');

var request_module = require('./request.js');
var comments = require('./comments.js');

var media_module = module.exports;

media_module.get = function (user_id, client_id, next_max_id, media) {
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

	var media_res;
 
	return request_module.request(path, parameters, client_id)
		.then(function (res) {
			if (res['meta']['code'] !== 200) {
				throw new Error('bad meta');
			}
	 
			next_max_id = res['pagination']['next_max_id'];
			media_res = res;
	 
			return Promise.all(res['data'].map(function (m) {
				return comments.get(m, client_id);
			}));
		})
		.then(function (res) {
			for (var i = 0; i < res.length; ++i) {
				media_res['data'][i]['comments']['data'] = res[i];
			}
	 
			media = media.concat(media_res['data']);
	 
			if (next_max_id !== undefined) {
				return media_module.get(user_id, client_id, next_max_id, media);
			}

			return media;
		});
};

