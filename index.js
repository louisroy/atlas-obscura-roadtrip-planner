/* global require, process */

require('dotenv').config();

const createError = require('http-errors');
const express = require('express');
const bodyParser = require('body-parser');
const request = require('request-promise');
const path = require('path');
const turf = require('@turf/turf');
const app = express();

app.use(bodyParser.json());

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

let cache = {
	all: null,
	ids: {}
};

app.get('/', async (req, res) => {
	res.render('index', {
		apiKey: process.env.GOOGLE_MAPS_API_KEY
	});
});

app.get('/locations/:id', async (req, res) => {
	res.json(await fetchById(req.params.id));
});

app.post('/locations/find', async (req, res) => {
	res.json(
		turf.pointsWithinPolygon(await fetchAll(), turf.polygon(req.body))
	);
});

app.get('/:name', async (req, res, next) => {
	let options = {
		root: __dirname + '/public/',
		dotfiles: 'deny',
		headers: {
			'x-timestamp': Date.now(),
			'x-sent': true
		}
	};
	
	let fileName = req.params.name;
	await res.sendFile(fileName, options);
});

// catch 404 and forward to error handler
app.use((req, res, next) => {
	next(createError(404));
});

async function fetchAll() {
	if (!cache.all) {
		const url = 'https://www.atlasobscura.com/articles/all-places-in-the-atlas-on-one-map';
		let html = await request(url); //, (err, response, body) => {
		let matches = html.match(/AtlasObscura\.all_places = (.*?);/);
		let locations = JSON.parse(matches[1]);
		let points = locations.map(location => {
			return turf.point([location.lng, location.lat], {id: location.id});
		});
		cache.all = turf.featureCollection(points);
	}

	return cache.all;
}

async function fetchById(id) {
	if (!cache.ids[id]) {
		let json = await request(`https://www.atlasobscura.com/places/${id}.json?place_only=1`);
		cache.ids[id] = JSON.parse(json);
	}
	return cache.ids[id];
}

module.exports = app;