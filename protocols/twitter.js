var config = require('../config/twitter.js');

var twitter = require('node-twitter-api');
 
module.exports.send = function (message, to, callback) {
	var client = new twitter({ consumerKey: config[to].consumer_key, consumerSecret: config[to].consumer_secret });
	console.log('Sending TWEET to ' + to + '...');

	client.statuses("update", {status: message }, config[to].access_token_key,
		config[to].access_token_secret, function(err, message) {
		if (err) {
			console.log(err);
		} else {
			console.log('Tweet sent to ' + to);
		}
		callback();
	});
};