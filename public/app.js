/* global google, turf */

let map, directionsService, directionsRenderer, overviewPath, radiusPolygon, allPoints, markers, infoWindow;

window.fetch('./data/all')
	.then((response) => {
		return response.json();
	})
	.then((json) => {
		allPoints = json;
	})
	.catch(function (ex) {
	
	});

function init() {
	directionsService = new google.maps.DirectionsService();
	directionsRenderer = new google.maps.DirectionsRenderer();
	
	map = new google.maps.Map(document.querySelector('#map'), {
		center: {lat: -34.397, lng: 150.644},
		zoom: 8
	});
	
	directionsRenderer.setMap(map);
	
	document.querySelector('.btn-add-waypoint').addEventListener('click', onAddWaypoint);
	document.querySelector('#search').addEventListener('submit', onSearchSubmit);
	document.querySelector('#range').addEventListener('input', onMapChange);
	document.querySelector('#range').addEventListener('change', onMapChange);
	Array.from(document.querySelectorAll('input[type=checkbox]')).forEach(checkbox => {
		checkbox.addEventListener('change', onSearchChange);
	});
}

function onAddWaypoint(ev) {
	ev.preventDefault();
	
}

function onSearchChange(ev) {
	document.querySelector('#search').dispatchEvent(new CustomEvent('submit'));
}

function onSearchSubmit(ev) {
	ev.preventDefault();
	
	let waypoints = [];
	
	ev.currentTarget['waypoint'].forEach((input) => {
		waypoints.push({location: input.value});
	});
	
	let options = {
		origin: waypoints.shift().location,
		destination: waypoints.pop().location,
		waypoints: waypoints,
		avoidHighways: ev.target['avoid-highways'].checked,
		avoidTolls: ev.target['avoid-tolls'].checked,
		travelMode: google.maps.TravelMode.DRIVING,
	};
	
	directionsService.route(options, (result, status) => {
		if (status === 'OK') {
			directionsRenderer.setDirections(result);
			
			overviewPath = result.routes[0].overview_path;
			
			onMapChange();
		}
	});
}

function onMapChange() {
	if (!overviewPath) return null;
	
	closeInfoWindow();
	
	let range = parseInt(document.querySelector('#range').value);
	
	let overviewPathGeo = [];
	
	for (let i = 0; i < overviewPath.length; i++) {
		overviewPathGeo.push(
			[overviewPath[i].lng(), overviewPath[i].lat()]
		);
	}
	
	let lineString = turf.lineString(overviewPathGeo, {name: 'line 1'});
	let polygon = turf.buffer(lineString, range, {units: 'miles'});
	jsts2googleMaps(polygon, paths => {
		if (radiusPolygon) {
			radiusPolygon.setMap(null);
		}
		
		radiusPolygon = new google.maps.Polygon({
			paths: paths,
			strokeColor: '#000',
			strokeOpacity: 0.8,
			strokeWeight: 1,
			fillColor: '#FFF',
			fillOpacity: 0.35
		});
		
		radiusPolygon.setMap(map);
		
		findInPaths(radiusPolygon, locations => {
			clearMarkers();
			locations.forEach(location => {
				let marker = new google.maps.Marker({
					position: {lat: location.lat, lng: location.lng},
					map: map,
					icon: {
						path: google.maps.SymbolPath.CIRCLE,
						fillColor: '#1b624f',
						fillOpacity: 0.8,
						scale: 10,
						strokeColor: '#FFF',
						strokeWeight: 1
					}
				});
				marker.data = {id: location.id};
				marker.addListener('click', onMarkerClick);
				markers.push(marker);
			});
		});
	});
}

function onMarkerClick(ev) {
	closeInfoWindow();
	
	infoWindow = new google.maps.InfoWindow({
		content: `<div class="info-window">Loading</div>`,
		position: this.getPosition()
	});
	
	window.fetch(`./data/${this.data.id}`)
		.then((response) => {
			return response.json();
		})
		.then((json) => {
			infoWindow.setContent(`
				<a href="${json.url}" target="_blank" class="info-window">
					<div>
						<img
							alt="${json.title}"
							src="${json.thumbnail_url_3x2}"
						/>
						<h1>${json.title}</h1>
					</div>
					
					<p>${json.subtitle}</p>
					<p>Learn more &rsaquo;</p>
				</a>
			`);
		})
		.catch(function (ex) {
		
		});
	
	infoWindow.open(map);
}

function jsts2googleMaps(object, callback) {
	let coordArray = object.geometry.coordinates[0];
	let GMcoords = [];
	for (let i = 0; i < coordArray.length; i++) {
		GMcoords.push(new google.maps.LatLng(coordArray[i][1], coordArray[i][0]));
	}
	callback(GMcoords);
}


function findInPaths(polygon, callback) {
	callback(allPoints.filter(point => {
		return google.maps.geometry.poly.containsLocation(
			new google.maps.LatLng(point.lat, point.lng),
			polygon
		);
	}));
}

function closeInfoWindow() {
	if (infoWindow) {
		infoWindow.close();
	}
	infoWindow = null;
}

function clearMarkers() {
	if (markers) {
		markers.forEach(marker => {
			marker.setMap(null);
		});
	}
	markers = [];
}