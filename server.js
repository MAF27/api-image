// External Dependencies
var express = require('express');
var request = require('request-json');
var http = require('http');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');

var app = express();
var cx = '008709307696191659990:81dznmj-lmg';
var api = process.env.API;
var history = [];

app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.get('/latest', function(req, res) {
	res.json(history);
});

app.get('/*', function(req, res) {
	var searchTerm = req.params[0], offset = req.query.offset, arr = [];
	var client = request.createClient('https://www.googleapis.com');
	var path = '/customsearch/v1?key=' + api + '&cx=' + cx + '&q=' + searchTerm
		+ (offset ? ('&start=' + offset) : '');

	// Record search
	history.push({
		term: searchTerm,
		when: new Date
	});

	client.get(path, function(err, response, body) {
		if (err || response.statusCode !== 200) {
			console.log('Error: ' + err, response.statusCode);
			return response.sendStatus(500);
		}

		for (var i = 0; i < body.items.length; i++) {
			arr.push({
				image: (body.items[i].pagemap.cse_image ? body.items[i].pagemap.cse_image[0].src : 'n/a'),
				thumbnail: (body.items[i].pagemap.cse_thumbnail ? body.items[i].pagemap.cse_thumbnail[0].src : 'n/a'),
				snippet: body.items[i].snippet,
				context: body.items[i].link});
		}
		res.json(arr);
		});
});

app.set('port', process.env.PORT || 3000);
var server = http.createServer(app);
server.listen(app.get('port'), function() {
	console.log('Server listening on port ' + app.get('port') + ' ...');
});
