let map, directionsService, directionsRenderer, overviewPath, radiusPolygon, markers, infoWindow, userLocation;

let userLocationInitialized = false;
let mapInitialized = false;

function initMap() {
	mapInitialized = true;
	if (userLocationInitialized) {
		init();
	}
}

window.fetch('./geo')
	.then(response => {
		return response.json();
	})
	.then(json => {
		userLocation = json;
	})
	.then(() => {
		userLocationInitialized = true;
		if (mapInitialized) {
			init();
		}
	});

function init() {
	directionsService = new google.maps.DirectionsService();
	directionsRenderer = new google.maps.DirectionsRenderer();
	
	map = new google.maps.Map(document.querySelector('#map'), {
		center: (userLocation) ? {lat: userLocation.lat, lng: userLocation.lon} : {lat: -34.397, lng: 150.644},
		zoom: 8,
		styles: [
			{elementType: 'geometry', stylers: [{color: '#242f3e'}]},
			{elementType: 'labels.text.stroke', stylers: [{color: '#242f3e'}]},
			{elementType: 'labels.text.fill', stylers: [{color: '#746855'}]},
			{
				featureType: 'administrative.locality',
				elementType: 'labels.text.fill',
				stylers: [{color: '#d59563'}]
			},
			{
				featureType: 'poi',
				elementType: 'labels.text.fill',
				stylers: [{color: '#d59563'}]
			},
			{
				featureType: 'poi.park',
				elementType: 'geometry',
				stylers: [{color: '#263c3f'}]
			},
			{
				featureType: 'poi.park',
				elementType: 'labels.text.fill',
				stylers: [{color: '#6b9a76'}]
			},
			{
				featureType: 'road',
				elementType: 'geometry',
				stylers: [{color: '#38414e'}]
			},
			{
				featureType: 'road',
				elementType: 'geometry.stroke',
				stylers: [{color: '#212a37'}]
			},
			{
				featureType: 'road',
				elementType: 'labels.text.fill',
				stylers: [{color: '#9ca5b3'}]
			},
			{
				featureType: 'road.highway',
				elementType: 'geometry',
				stylers: [{color: '#746855'}]
			},
			{
				featureType: 'road.highway',
				elementType: 'geometry.stroke',
				stylers: [{color: '#1f2835'}]
			},
			{
				featureType: 'road.highway',
				elementType: 'labels.text.fill',
				stylers: [{color: '#f3d19c'}]
			},
			{
				featureType: 'transit',
				elementType: 'geometry',
				stylers: [{color: '#2f3948'}]
			},
			{
				featureType: 'transit.station',
				elementType: 'labels.text.fill',
				stylers: [{color: '#d59563'}]
			},
			{
				featureType: 'water',
				elementType: 'geometry',
				stylers: [{color: '#17263c'}]
			},
			{
				featureType: 'water',
				elementType: 'labels.text.fill',
				stylers: [{color: '#515c6d'}]
			},
			{
				featureType: 'water',
				elementType: 'labels.text.stroke',
				stylers: [{color: '#17263c'}]
			}
		]
	});
	
	// Set mouseover event for each feature.
	map.data.addListener('click', onMarkerClick);
	
	map.data.setStyle(feature => {
		return {
			icon: {
				path: google.maps.SymbolPath.CIRCLE,
				fillColor: '#1b624f',
				fillOpacity: 0.8,
				scale: 10,
				strokeColor: '#FFF',
				strokeWeight: 1
			}
		}
	});
	
	directionsRenderer.setMap(map);
	
	if (userLocation) {
		// if (!document.querySelector('#search .waypoint').value) {
		document.querySelector('#search input[name="waypoint"]').value = `${userLocation.city}, ${userLocation.regionName}`;
		// }
	}
	
	document.querySelector('#search').addEventListener('submit', onSearchSubmit);
	document.querySelector('#range').addEventListener('input', onMapChange);
	document.querySelector('#range').addEventListener('change', onMapChange);
	Array.from(document.querySelectorAll('input[type=checkbox]')).forEach(checkbox => {
		checkbox.addEventListener('change', onSearchChange);
	});
	
	document.querySelector('.btn-add-waypoint').addEventListener('click', onAddWaypoint);
	document.body.addEventListener('click', ev => {
		if (ev.target) {
			if (ev.target.parentNode.classList.contains('btn-waypoint-delete')) {
				onDeleteWaypoint(ev);
			}
		}
	});
	
	onMapChange();
}

function onAddWaypoint(ev) {
	ev.preventDefault();
	let $waypoints = document.querySelector('.waypoints');
	let $clone = $waypoints.querySelector('.form-control').cloneNode(true);
	$clone.querySelector('input').value = '';
	$waypoints.appendChild($clone);
}

function onDeleteWaypoint(ev) {
	ev.preventDefault();
	
	ev.target.parentNode.parentNode.parentNode.removeChild(ev.target.parentNode.parentNode);
}

function onSearchChange(ev) {
	document.querySelector('#search button[type="submit"]').click();
}

function onSearchSubmit(ev) {
	ev.preventDefault();
	
	let waypoints = [];
	
	ev.currentTarget['waypoint'].forEach(input => {
		if (input.value.trim() !== '') {
			waypoints.push({location: input.value});
		}
	});
	
	let route = waypoints.slice();
	
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
		} else {
			alert(`Unable to determine route for ${route.map(obj => obj.location).join(' -> ')}.`);
		}
	});
}

function onMapChange() {
	let range = parseInt(document.querySelector('#range').value);
	
	document.querySelector('.range-value').textContent = range.toString();
	
	if (!overviewPath) return null;
	
	closeInfoWindow();
	
	let overviewPathGeo = [];
	
	for (let i = 0; i < overviewPath.length; i++) {
		overviewPathGeo.push(
			[overviewPath[i].lng(), overviewPath[i].lat()]
		);
	}
	
	let lineString = turf.lineString(overviewPathGeo, {name: 'line 1'});
	let polygon = turf.buffer(lineString, range, {units: 'miles'});
	let paths = jsts2googleMaps(polygon);
	
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
	
	findInPaths(polygon, locations => {
		clearMarkers();
		markers = map.data.addGeoJson(locations);
	});
}

function onMarkerClick(ev) {
	closeInfoWindow();
	
	infoWindow = new google.maps.InfoWindow({
		content: `<div class="info-window">Loading</div>`,
		position: new google.maps.LatLng(
			ev.feature.getGeometry().get().lat(),
			ev.feature.getGeometry().get().lng()
		)
	});
	
	window.fetch(`./locations/${ev.feature.getProperty('id')}`)
		.then(response => {
			return response.json();
		})
		.then(location => {
			infoWindow.setContent(`
				<a href="${location.url}" target="_blank" class="info-window">
					<div>
						<img src="${location.thumbnail_url_3x2}" />
						<h1>${location.title}</h1>
					</div>
					
					<p>${location.subtitle}</p>
					<p class="learn-more">Learn more &rsaquo;</p>
				</a>
			`);
		})
		.catch(function (ex) {
		
		});
	
	infoWindow.open(map);
}

function jsts2googleMaps(jsts) {
	let coordArray = jsts.geometry.coordinates[0];
	let GMcoords = [];
	for (let i = 0; i < coordArray.length; i++) {
		GMcoords.push(new google.maps.LatLng(coordArray[i][1], coordArray[i][0]));
	}
	return GMcoords;
}

function findInPaths(polygon, callback) {
	window.fetch('./locations/find', {
		method: 'POST',
		body: JSON.stringify(polygon.geometry.coordinates),
		headers: {
			'Content-Type': 'application/json'
		}
	})
		.then((response) => {
			return response.json();
		})
		.then((json) => {
			callback(json);
		})
		.catch(function (ex) {
		
		});
}

function closeInfoWindow() {
	if (infoWindow) {
		infoWindow.close();
	}
	infoWindow = null;
}

function clearMarkers() {
	map.data.forEach(feature => {
		map.data.remove(feature);
	});
}