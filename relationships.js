var Promise = require('bluebird');

var request_module = require('./request.js');
var users = require('./users.js');

var relationships_module = module.exports;

relationships_module.get = function (user_id, client_id, type, next_cursor, relationships) {
	var relationship_res;

	if (relationships === undefined) {
		relationships = [];
	}

	var path = '/v1/users/' + user_id + '/' + type;
	var parameters = {};

	if (next_cursor !== undefined) {
		parameters['cursor'] = next_cursor;
	}
 
	return request_module.request(path, parameters)
		.then(function (res) {
			if (res['meta']['code'] !== 200) {
				throw new Error('bad meta');
			}

			next_cursor = res['pagination']['next_cursor'];
			relationship_res = res;

			return Promise.all(res['data'].map(function (m) {
				return users.get(m['id'], client_id);
			}));
		})
		.then(function (res) {
			for (var i = 0; i < res.length; ++i) {
				relationship_res['data'][i] = res[i];
			}

			relationships = relationships.concat(relationship_res['data'])

			if (next_cursor !== undefined) {
				return relationships_module.get(user_id, client_id, type, next_cursor, relationships)
			}

			return relationships;
		})
}
