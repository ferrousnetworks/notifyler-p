window.onload = function() {

	function tablize(data) {

		$('#thetable .filler').remove();

		for (i = 0; i < data.gone.length; i++) {
			$('tr[data-id="' + data.gone[i] + '"]', '#thetable').remove();
		}
		for (i = 0; i < data.add.length; i++) {
			parts = data.add[i].name.split(':');
			age = '<span class="timer">' + Math.round((data.servertime - data.add[i].time)/1000) + "</span> Seconds";
			$('#thetable').append('<tr data-id="' + data.add[i].name + '"><td>' + parts[0].toUpperCase() + '</td><td>' + parts[1] + '</td><td>' + data.add[i].delay + ' Seconds</td><td>' + age + '</td><td><button class="btn btn-default rmbutton" data-id="' + data.add[i].name + '">Remove</button></td></tr>');
		}

		if (!$('#thetable tr').length) {
			$('#thetable').html('<tr class="filler"><td colspan="5">No queued messages. Messages received will show up here in real time.</td></tr>')
		}
	}

	function requestGraph() {
		socket.emit('counts');
	}

	function graph(arr) {
		width = $('#graph').width();
		$('#graph').html('<canvas id="myChart" height="250" width="' + width + '"></canvas>');

		var d = new Date();
		var n = d.getHours();

		var data = {
			labels: [],
			datasets:[{
				fillColor : "rgba(151,187,205,0.5)",
				strokeColor : "rgba(151,187,205,1)",
				pointColor : "rgba(151,187,205,1)",
				pointStrokeColor : "#fff",
				data : []
			}]
		};

		for (i = 0; i < 24; i++) {
			if (n - 24 + i < 0) {
				data.labels.push((n + i) + ':00');
			} else {
				data.labels.push((n - 24 + i) + ':00')
			}
			if (arr.length - 24 + i < 0) {
				data.datasets[0].data.push(0);
			} else {
				data.datasets[0].data.push(arr[arr.length - 24 + i]);
			}
		}

		ctx = document.getElementById("myChart").getContext("2d");
		new Chart(ctx).Line(data, {	scaleOverlay : true});

	}

	function initialize() {
		$(content).html('<table class="table table-striped table-bordered">' +
			'<thead>' +
				'<tr>' +
					'<th>Protocol</th>' +
					'<th>Recipient</th>' +
					'<th>Delay Time</th>' +
					'<th>Age</th>' +
					'<th>&nbsp;</th>' +
				'</tr>' +
			'</thead>' +
			'<tbody id="thetable">' +
			'</tbody>' +
		'</table>');


		setInterval(function() {
			if (!socket.socket.connected) {
				location.reload();
			}
		}, 2500);

		setInterval(function() {
			$('.timer').each(function(){
				$(this).text(parseInt($(this).text(), 10) + 1);
			});
		}, 1000);

		requestGraph();
		setInterval(function(){
			 requestGraph();
		}, 1000 * 60 * 15);

		$(document).on('click', '.rmbutton', function() {
			$(this).closest('tr').remove();
			socket.emit('remove', { id: $(this).attr('data-id') });
		});
	}
 
	var messages = [];
	var socket = io.connect('http://192.168.1.149:3636/');
	var password = $("#password");
	var loginButton = $("#logsubmit");
	var content = $('#content');
 
	socket.on('push', function (data) {
		tablize(data);
	});
 
	socket.on('login', function (data) {

		if (data.result == 'success') {
			initialize();
		} else {
			$('#messagearea').html('<div class="alert alert-danger">Invalid passkey</div>');
		}
	});

	socket.on('counts', function(data) {
		graph(data.result);
	});
 
	$(loginButton).on('click', function(){
		socket.emit('login', { password: $(password).val() });
	});
}