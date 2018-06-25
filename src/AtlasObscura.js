/* global google */

const allPointsUrl = 'https://www.atlasobscura.com/articles/all-places-in-the-atlas-on-one-map';

class AtlasObscura {
	allPoints = [];
	
	getAddress(url) {
		return process.env.REACT_APP_CORS_PROXY + url;
	}
	
	fetchAllPoints(callback) {
		if (this.allPoints.length) {
			callback(null, this.allPoints);
		} else {
			window.fetch(this.getAddress(allPointsUrl))
				.then((response) => {
					return response.text();
				})
				.then((html) => {
					let matches = html.match(/AtlasObscura\.all_places = (.*?);/);
					this.allPoints = eval(matches[1]);
					return callback(null, this.allPoints);
				})
			// .catch(function (ex) {
			// 	console.log('Parsing failed', ex);
			// 	callback(ex);
			// });
		}
	}
	
	findInPaths(paths, callback) {
		let polygon = new google.maps.Polygon({path: paths});
		
		return this.fetchAllPoints((err, allPoints) => {
			if (err) return console.log("Couldn't fetch all points.", err);
			let results = [];
			
			allPoints.forEach((point) => {
				let position = new google.maps.LatLng(point.lat, point.lng);
				if (google.maps.geometry.poly.containsLocation(position, polygon)) {
					results.push({
						id: point.id,
						position: position
					});
				}
			});
			
			return callback(null, results);
		});
	}
	
	find(id, callback) {
		window.fetch(this.getAddress(`https://www.atlasobscura.com/places/${id}.json?place_only=1`))
			.then(function (response) {
				return response.json()
			})
			.then(function (json) {
				return callback(json);
			})
			.catch(function (ex) {
				console.log('parsing failed', ex)
			});
	}
}

export default new AtlasObscura();