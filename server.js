// External Dependencies
var express = require('express');
var request = require('request-json');
var http = require('http');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var syncLoop = require('./util.js');

var app = express();
var cx = '008709307696191659990:81dznmj-lmg';
var api = process.env.API;

app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.get('/', function(req, res) {
	res.sendFile(__dirname + '/index.html');
});

app.get('/*', function(req, res) {
	console.log('* Offset: ', req.query.offset);

	var searchTerm = req.params[0],
		offset = req.query.offset || 10,
		arr = [];
	var client = request.createClient('https://www.googleapis.com');
	var path = '/customsearch/v1?key=' + api + '&cx=' + cx + '&q=' + searchTerm;
	var iterations = Math.ceil(offset / 10);
	console.log('Iterations: ', iterations);

	syncLoop(iterations,
		// What to do in the loop
		function(loop){
			var start = loop.iteration() * 10 + 1;
			var num = Math.min(10, offset - loop.iteration() * 10);
			var p = '&num=' + num + '&start=' + start;
			console.log('* Path <%s>', 'https://www.googleapis.com' + path + p);

			// Get num results
			client.get(path + p, function(err, response, body) {
				if (err || response.statusCode !== 200) {
					console.log('Error: ' + err, response.statusCode);
					return response.sendStatus(500);
				}

				for (var i = 0; i < body.items.length; i++) {
					arr.push({image: body.items[i].pagemap.cse_image[0].src, thumbnail: body.items[i].pagemap.cse_thumbnail[0].src, snippet: body.items[i].snippet, context: body.items[i].link});
				}
				loop.next();
		});
	},
		// What to do after completion
		function(){
			res.json(arr);
	});

});

app.set('port', process.env.PORT || 3000);
var server = http.createServer(app);
server.listen(app.get('port'), function() {
	console.log('Server listening on port ' + app.get('port') + ' ...');
});
