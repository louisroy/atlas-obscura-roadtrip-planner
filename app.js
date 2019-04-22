/* global require, process */

require('dotenv').config();

const createError = require('http-errors');
const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const path = require('path');
const turf = require('@turf/turf');
const app = express();

app.use (function (req, res, next) {
	if (req.secure || req.headers["x-forwarded-proto"] === "http") {
		res.redirect('http://' + req.headers.host + req.url);
	} else {
		next();
	}
});

app.use(bodyParser.json());

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

let cache = {
	all: null,
	ids: {}
};

app.get('/', (req, res) => {
	res.render('index', {
		apiKey: process.env.GOOGLE_MAPS_API_KEY
	});
});

app.get('/locations/:id', (req, res) => {
	fetchById(req.params.id, (all) => {
		res.json(all);
	});
});

app.post('/locations/find', (req, res) => {
	fetchAll(all => {
		res.json(
			turf.pointsWithinPolygon(all, turf.polygon(req.body))
		);
	});
});

app.get('/:name', (req, res, next) => {
	let options = {
		root: __dirname + '/public/',
		dotfiles: 'deny',
		headers: {
			'x-timestamp': Date.now(),
			'x-sent': true
		}
	};
	
	let fileName = req.params.name;
	res.sendFile(fileName, options, (err) => {
		if (err) {
			next(err);
		} else {
			console.log('Sent:', fileName);
		}
	});
});

// catch 404 and forward to error handler
app.use((req, res, next) => {
	next(createError(404));
});

function fetchAll(callback) {
	if (cache.all) {
		callback(cache.all);
	} else {
		const url = 'https://www.atlasobscura.com/articles/all-places-in-the-atlas-on-one-map';
		request(url, (err, response, body) => {
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
		request(`https://www.atlasobscura.com/places/${id}.json?place_only=1`, (err, response, body) => {
			if (err) throw err;
			cache.ids[id] = JSON.parse(body);
			callback(cache.ids[id]);
		});
	}
}

module.exports = app;