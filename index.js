/* global require */

require('dotenv').config()

const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');
const request = require('request');

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

app.get('/data/all', function (req, res) {
	fetchAll(all => {
		res.json(all);
	});
});

app.get('/data/:id', function (req, res) {
	fetchById(req.params.id, (all) => {
		res.json(all);
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
		request('https://www.atlasobscura.com/articles/all-places-in-the-atlas-on-one-map', function (error, response, body) {
			let matches = body.match(/AtlasObscura\.all_places = (.*?);/);
			cache.all = JSON.parse(matches[1]);
			callback(cache.all);
		});
	}
}

function fetchById(id, callback) {
	if (cache.ids[id]) {
		callback(cache.ids[id]);
	} else {
		request(`https://www.atlasobscura.com/places/${id}.json?place_only=1`, function (error, response, body) {
			cache.ids[id] = JSON.parse(body);
			callback(cache.ids[id]);
		});
	}
}

app.listen(process.env.PORT);