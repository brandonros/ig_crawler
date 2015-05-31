var Promise = require('bluebird');

var request_module = require('./request.js');

var comments = module.exports;

comments.get = function (media, client_id) {
	if (media['comments']['count'] <= 20) {
		return Promise.resolve(media['comments']['data']);
	}

	return request_module.request('/v1/media/' + media['id'] + '/comments')
		.then(function (res) {
			return res['data'];
		});
};

