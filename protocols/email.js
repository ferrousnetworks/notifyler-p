var config = require('../config/email.js');

function extend(target) {
	var sources = [].slice.call(arguments, 1);
	sources.forEach(function (source) {
		for (var prop in source) {
			target[prop] = source[prop];
		}
	});
	return target;
}

var email = require('emailjs');
var server = email.server.connect(config.server);

module.exports.send = function (message, to, callback) {
	console.log('Sending EMAIL to ' + to + '...')
	server.send(extend(config.sender, message, { to: to }), function(err, message) {
		if (err) {
			console.log(err);
		} else {
			console.log('Email sent to ' + to);
		}
		callback();
	});
};