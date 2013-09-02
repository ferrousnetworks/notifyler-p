/*******************************************************************************
|
|	Load required libraries, create redis connections and app
|
*******************************************************************************/

var express = require('express');
var redislib = require('redis');
var config = require('./config/app.js');
var pusher = require('./lib/pusher.js');
var fs = require('fs');
var jade = require('jade');

var redis = redislib.createClient();
if (config.redis_password) {
	redis.auth(config.redis_password);
}

console.log('Connected to Redis');

var app = express();
pusher.init(config, redis);

/*******************************************************************************
|
|	Global app settings and functions
|
*******************************************************************************/

app.set('views', './tpl');
app.set('view engine', "jade");

app.use(express.static(__dirname + '/public'));
app.use (function(req, res, next) {
	var data='';
	req.setEncoding('utf8');
	req.on('data', function(chunk) { 
	   data += chunk;
	});

	req.on('end', function() {
		req.body = data;
		next();
	});
});

function compileTemplate(name, data) {
	template = fs.readFileSync(pathToTemplate, 'utf8');
	jadeFn = jade.compile(template, { filename: pathToTemplate, pretty: true });
	return jadeFn(data);
}


/*******************************************************************************
|
|	Start the server and Socket.io handler
|
*******************************************************************************/

var io = require('socket.io').listen(app.listen(3636));

console.log('Express server started and passed to Socket.io');

io.sockets.on('connection', function (socket) {
	var logged_in = false;
	socket.emit('message', { message: 'Notifyler is ready to go...' });

	socket.on('login', function (data) {

		if ('password' in data && data.password == config.password) {
			logged_in = true;
			socket.emit('login', {result: 'success'});

			pusher.addClient(socket.id, function(data) {
				socket.emit('push', data);
			});

		} else {
			socket.emit('login', {result: 'failure'});
		}
	});

	socket.on('remove', function (data) {
		if (!logged_in) {
			return false;
		}

		pusher.removeItem(data.id);
	});

	socket.on('counts', function(data) {
		if (!logged_in) {
			return false;
		}

		pusher.getcount(function(err, data) {
			socket.emit('counts', {result: data });
		});
	});

	socket.on('disconnect', function () {
		pusher.removeClient(socket.id);
	});
});

/*******************************************************************************
|
|	Routes
|
*******************************************************************************/

app.get('/', function(req, res){
	res.render('index');
});
app.post('/push', function(req, res) {

	var data = JSON.parse(req.body);

	if (!pusher.authenticate(data)) {
		res.send(403);
		return false;
	}

	pusher.process(data, res);
});