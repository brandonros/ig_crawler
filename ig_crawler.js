var Promise = require('bluebird');
var fs = require('fs');

var cache = require('./cache.js');
var comments = require('./comments.js');
var relationships = require('./relationships.js');
var users = require('./users.js');
var media = require('./media.js');

Promise.onPossiblyUnhandledRejection = function (err) {
	console.error(err.message, err.stack);
};

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

			fs.writeFileSync('output/' + user_name + '_comments.json', JSON.stringify(comments));
			fs.writeFileSync('output/' + user_name + '_follows.json', JSON.stringify(follows));
		});
}

function crawl_follows(follows, index, client_id) {
	if (index < follows.length - 1) {
		var msg = index + 1 + ' / ' + follows.length + ': ' + follows[index]['username'] + ' ';
		msg += 'Media: ' + follows[index]['counts']['media'] + ' ';
		msg += 'Follows: ' + follows[index]['counts']['follows'] + ' ';
		msg += 'Followed by: ' + follows[index]['counts']['followed_by'];

		console.log(msg);

		return crawl_user(follows[index]['username'], client_id)
			.then(function () {
				return crawl_follows(follows, index + 1, client_id);
			});
	}
}

if (process['argv'].length !== 4) {
	console.error('usage: ig_crawler file client_id');
	
	process.exit(1);
}

var filename = process['argv'][2];
var client_id = process['argv'][3];

var follows = JSON.parse(fs.readFileSync(filename)).filter(function (follow) {
	return follow !== null;
});

follows.sort(function (a, b) {
	return a['counts']['media'] - b['counts']['media'];
});

crawl_follows(follows, 0, client_id)
.then(function () {
	process.exit(0);
});