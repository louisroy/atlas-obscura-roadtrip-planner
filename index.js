/* global require, process */

require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const request = require('request');
const turf = require('@turf/turf');

const app = express();
app.use(bodyParser.json());

let cache = {
	all:null,
	ids:{}
};

app.get('/', function (req, res) {
	fs.readFile(__dirname + '/public/index.html', 'utf8', (err, data) => {
		if (err) throw err;
		data = data.replace('{{ GOOGLE_MAPS_API_KEY }}', process.env.GOOGLE_MAPS_API_KEY);
		res.send(data);
	});
});

app.get('/geo', function (req, res) {
	request(`http://ip-api.com/json`, function (err, response, body) {
		if (err) throw err;
		res.json(JSON.parse(body));
	});
});

app.get('/locations/:id', function (req, res) {
	fetchById(req.params.id, (all) => {
		res.json(all);
	});
});

app.post('/locations/find', function (req, res) {
	fetchAll(all => {
		res.json(
			turf.pointsWithinPolygon(all, turf.polygon(req.body))
		);
	});
});

app.get('/:name', function (req, res, next) {
	let options = {
		root: __dirname + '/public/',
		dotfiles: 'deny',
		headers: {
			'x-timestamp': Date.now(),
			'x-sent': true
		}
	};
	
	let fileName = req.params.name;
	res.sendFile(fileName, options, function (err) {
		if (err) {
			next(err);
		} else {
			console.log('Sent:', fileName);
		}
	});
});

function fetchAll(callback) {
	if (cache.all) {
		callback(cache.all);
	} else {
		const url = 'https://www.atlasobscura.com/articles/all-places-in-the-atlas-on-one-map';
		request(url, function (err, response, body) {
			if (err) throw err;
			let matches = body.match(/AtlasObscura\.all_places = (.*?);/);
			let locations = JSON.parse(matches[1]);
			let points = locations.map(location => {
				return turf.point([location.lng, location.lat], {id: location.id});
			});
			cache.all = turf.featureCollection(points);
			callback(cache.all);
		});
	}
}

function fetchById(id, callback) {
	if (cache.ids[id]) {
		callback(cache.ids[id]);
	} else {
		request(`https://www.atlasobscura.com/places/${id}.json?place_only=1`, function (err, response, body) {
			if (err) throw err;
			cache.ids[id] = JSON.parse(body);
			callback(cache.ids[id]);
		});
	}
}

app.listen(process.env.PORT || 80);