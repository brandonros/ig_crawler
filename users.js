var Promise = require('bluebird');

var request_module = require('./request.js');

var users_module = module.exports;

users_module.search = function (user_name, client_id) {
	return request_module.request('/v1/users/search/', { q: user_name }, client_id)
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

users_module.get = function (user_id, client_id) {
	return request_module.request('/v1/users/' + user_id, {}, client_id)
		.then(function (res) {
			if (res['meta']['code'] === 400) {
				return null; /* private account */
			}

			return res['data'];
		});
};