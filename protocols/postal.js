var config = require('../config/postal.js');

var soap = require('soap');
 
module.exports.send = function (message, to, callback) {

	console.log('Sending POSTAL to ' + to + '...');

	soap.createClient('https://api.postalmethods.com/2009-02-26/PostalWS.asmx?WSDL', function(err, client) {
		if (err) {
			console.log(err);
		} else {
			client.SendLetter({
				'Username': config[to].username,
				'Password': config[to].password,
				'MyDescription': message.description,
				'FileExtension': message.extension,
				'FileBinaryData': message.data,
				'WorkMode': 'Default'
			}, function(err, result) {
				if (err) {
					console.log(err);
				} else {
					console.log('POSTAL sent to ' + to);
				}
				callback();
			});
		}
	});
};