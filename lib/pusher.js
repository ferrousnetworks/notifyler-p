var config;
var redis;

var queue = [];
var clients = {};
var gone = [];
var exgone = [];
var waiting = false;
var lasttime = 0;
var count = 0;

var updateCounts = function() {
	redis.rpush('notifyler:counts', count);
	redis.ltrim('notifyler:counts', -24, -1);
	count = 0;
}

module.exports.init = function(cfg, red) {
	config = cfg;
	redis = red;
	setInterval(updateCounts, 1000 * 60 * 30);

	redis.lrange('notifyler:queues', 0, -1, function(err, data) {
		if (!err) {
			for (i = 0; i < data.length; i++) {
				chompQueue(data);
			}
		}
	});
}

module.exports.getcount = function(callback) {
	redis.lrange('notifyler:counts', -24, -1, callback);
}

module.exports.authenticate = function (variables) {
	if (!('key' in variables) || variables.key != config.auth_token) {
		return false;
	} else {
		return true;
	}
}

function doUpdates() {
	var dodo = function () {
		for (var c in clients) {
			if (!clients.hasOwnProperty(c)) {
				continue;
			}

			send = [];
			for (j = 0; j < queue.length && j < 300; j++) {
				if (queue[j].time > clients[c].lastupdate) {
					send.push(queue[j]);
				}
			}

			clients[c].lastupdate = new Date().getTime();
			clients[c].cb({add: send, gone: gone, servertime: clients[c].lastupdate});
		}
		gone = [];
		waiting = false;
		lasttime = new Date().getTime();
	}

	if (lasttime - (new Date().getTime()) < config.update_interval) {
		if (!waiting) {
			waiting = true;
			setTimeout(dodo, lasttime - (new Date().getTime()));
		}
	} else {
		dodo();
	}
}

function chompQueue(date) {
	var messages = null;
	var name = 'notifyler:queue' + date;
	var messname = 'notifyler:queuemess' + date;

	var spin = function() {

		redis.lpop(name, function(err, value) {
			if (err || !value) {
				redis.del(name);
				redis.del(messname);
				redis.lrem('notifyler:queues', 0, name);
				return false;
			} else {
				for (i = 0; i < exgone.length; i++) {

					if (value == exgone[i]) {
						exgone.splice(i);
						spin();
						return false;
					}
				}
				remover(value);

				parts = value.split(':');

				try {
					require('../protocols/' + parts[0] + '.js').send(messages[parts[0]], parts[1], spin);
				} catch (err) {
					console.log(err);
				}
			}

		});
	}

	redis.get(messname, function(err, data) {
		if (err) {
			console.log(err);
		} else {
			messages = JSON.parse(data);
			for (i = 0; i < config.spur_threads; i++) {
				spin();
			}
		}
	});
}

function remover(id) {
	if (isNaN(id)) {
		for (k = 0; k < queue.length; k++) {
			if (queue[k].name == id) {
				id = k;
				break;
			}
		}
	}

	if (id in queue) {
		gone.push(queue[id].name);
		queue.splice(id);
		doUpdates();
	}
}

module.exports.removeItem = function(name) {
	exgone.push(name);
	remover(name);
}

module.exports.addClient = function(name, callback) {
	clients[name] = {cb: callback, lastupdate: 0};
	doUpdates();
}


module.exports.removeClient = function(name) {
	delete clients[name];
}

module.exports.process = function (variables, res) {

	if (!('recipients' in variables) || !('messages' in variables)) {
		res.send(400);
		return false;
	}

	var date = new Date().getTime();
	var name = 'notifyler:queue' + date;

	if ('delay' in variables) {
		delay = variables.delay;
	} else {
		delay = 0;
	}

	redis.rpush('notifyler:queues', date);
	redis.set('notifyler:queuemess' + date, JSON.stringify(variables.messages));

	for (i = 0; i < variables.recipients.length; i++) {
		key = queue.push({time: (new Date().getTime()), name: variables.recipients[i], delay: delay});
		redis.rpush(name, variables.recipients[i]);
		count++;
	}
	doUpdates();

	setTimeout(function() {
		chompQueue(date);
	}, delay * 1000);

	res.send(200);
}