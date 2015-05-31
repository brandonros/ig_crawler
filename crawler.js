var Promise = require('bluebird');
var fs = require('fs');

var cache = require('./cache.js');
var comments = require('./comments.js');
var relationships = require('./relationships.js');
var users = require('./users.js');
var media = require('./media.js');

function crawl_user(user_name, client_id) {
	return users.search(user_name, client_id)
		.then(function (user_id) {
			return Promise.all([media.get(user_id, client_id), relationships.get(user_id, client_id, 'follows')]);
		})
		.then(function (res) {
			var media = res[0];
			var follows = res[1];

			var comments = [];

			for (var i = 0; i < media.length; ++i) {
				comments = comments.concat(media[i]['comments']['data']);
			}

			fs.writeFileSync(user_name + '_comments.json', JSON.stringify(comments));
			fs.writeFileSync(user_name + '_follows.json', JSON.stringify(follows));
		})
}

if (process['argv'].length !== 4) {
	console.error('usage: comment_crawler username client_id');
	
	process.exit(1);
}

Promise.onPossiblyUnhandledRejection = function (err) {
	console.error(err.message, err.stack);
}

var user_name = process['argv'][2];
var client_id = process['argv'][3];

crawl_user(user_name, client_id)
.then(function () {
	process.exit(0);
})
.catch(function (err) {
	console.error(err.message, err.stack);

	process.exit(1);
});