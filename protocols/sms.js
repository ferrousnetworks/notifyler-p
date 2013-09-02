var config = require('../config/sms.js');

var twilio = require('twilio');
var client = new twilio.RestClient(config.account_sid, config.auth_token);
 
module.exports.send = function (message, to, callback) {
	console.log('Sending SMS to ' + to + '...')
	client.sms.messages.create({ to: to, body: message, from: config.phone_number }, function(err, message) {
		if (err) {
			console.log(err);
		} else {
			console.log('SMS sent to ' + to);
		}
		callback();
	});
};