var fs = require('fs');
var bluebird = require('bluebird');

var crawl_user = require('./crawl_user.js');

var crawl_follows = module.exports;

crawl_follows.crawl_follows = function (follows, index, client_id) {
	if (index < follows.length - 1) {
		var msg = index + 1 + ' / ' + follows.length + ': ' + follows[index]['username'] + ' ';
		msg += 'Media: ' + follows[index]['counts']['media'] + ' ';
		msg += 'Follows: ' + follows[index]['counts']['follows'] + ' ';
		msg += 'Followed by: ' + follows[index]['counts']['followed_by'];

		console.log(msg);

		return crawl_user(follows[index]['username'], client_id)
			.then(function (res) {
				return crawl_follows.crawl_follows(res['follows'], index + 1, client_id);
			});
	}
}

module.exports = crawl_follows.crawl_follows;