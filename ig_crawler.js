var Promise = require('bluebird');
var fs = require('fs');

var request = require('./request.js');
var cache = require('./cache.js');
var comments = require('./comments.js');
var relationships = require('./relationships.js');
var users = require('./users.js');
var media = require('./media.js');
var crawl_user = require('./crawl_user.js');
var crawl_follows = require('./crawl_follows.js');

request.request_loop();

var user_name = 'CHANGE ME!';
var access_token = 'CHANGE ME!';

crawl_user(user_name, access_token)
.then(function (res) {
	return crawl_follows(res['follows'], 0, access_token);
})
.then(function () {
	process.exit(0);
});