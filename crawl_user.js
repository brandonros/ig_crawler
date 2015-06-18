var fs = require('fs');
var bluebird = require('bluebird');

var users = require('./users.js');
var media_module = require('./media.js');
var relationships = require('./relationships.js');

module.exports = function (user_name, client_id) {
	var media;
	var follows;
	var user_id;

	return users.search(user_name, client_id)
		.then(function (res) {
			user_id = res;
			
			return media_module.get(user_id, client_id);
		})
		.then(function (res) {
			media = res;

			return relationships.get(user_id, client_id, 'follows');
		})
		.then(function (res) {
			follows = [];

			for (var i = 0; i < res.length; ++i) { /* filter out private profiles */
				if (res[i] === null) {
					continue;
				}

				follows.push(res[i]);
			}

			var comments = [];

			for (var i = 0; i < media.length; ++i) {
				for (var x = 0; x < media[i]['comments']['data'].length; ++x) {
					var translated_comment = {
						link: media[i]['link'],
						comment: media[i]['comments']['data'][x]['text'],
						from: media[i]['comments']['data'][x]['from']['username']
					};

					comments.push(translated_comment);
				}
			}

			fs.writeFileSync('output/' + user_name + '_comments.json', JSON.stringify(comments));
			fs.writeFileSync('output/' + user_name + '_follows.json', JSON.stringify(follows));

			return {
				media: media,
				follows: follows
			};
		});
}