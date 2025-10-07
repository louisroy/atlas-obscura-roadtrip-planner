/* global require, process */

require('dotenv').config();

const createError = require('http-errors');
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
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

module.exports = app;