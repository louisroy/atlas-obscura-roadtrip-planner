let map, directionsService, directionsRenderer, overviewPath, radiusPolygon, markers, infoWindow, userLocation;

async function init() {
    let geoResponse = await fetch(`https://ip.nf/me.json`);
    userLocation = await geoResponse.json();

    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer();

    map = new google.maps.Map(document.querySelector('#map'), {
        center: (userLocation) ? {lat: userLocation.ip.latitude, lng: userLocation.ip.longitude} : {
            lat: -34.397,
            lng: 150.644
        },
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
        document.querySelector('#search input[name="waypoint"]').value = `${userLocation.ip.city}, ${userLocation.ip.country}`;
        // }
    }

    document.querySelector('#search').addEventListener('submit', onSearchSubmit);
    document.querySelector('#search').addEventListener('change', onSearchChange);
    document.querySelector('#range').addEventListener('input', onMapChange);
    document.querySelector('#range').addEventListener('change', onMapChange);
    Array.from(document.querySelectorAll('input[type=checkbox]')).forEach(checkbox => {
        checkbox.addEventListener('change', onCheckChange);
    });

    document.querySelector('.btn-add-waypoint').addEventListener('click', onAddWaypoint);
    document.body.addEventListener('click', ev => {
        if (ev.target) {
            if (ev.target.parentNode.classList.contains('btn-waypoint-delete')) {
                onDeleteWaypoint(ev);
            }
        }
    });

    new Sortable.default(document.querySelectorAll('.waypoints'), {
        draggable: '.form-control',
        mirror: {
            appendTo: '.waypoints',
            constrainDimensions: true,
        },
    });

    if (window.location.hash.match(/#(.*?)/)) {
        onHashLoad();
    }

    await onMapChange();
}

function onAddWaypoint(ev, value) {
    ev && ev.preventDefault();
    let $waypoints = document.querySelector('.waypoints');
    let $clone = $waypoints.querySelector('.form-control').cloneNode(true);
    $clone.querySelector('input').value = value || '';
    $waypoints.appendChild($clone);
}

function onDeleteWaypoint(ev) {
    ev.preventDefault();

    ev.target.parentNode.parentNode.parentNode.removeChild(ev.target.parentNode.parentNode);

    onSearchChange(ev);
}

function onCheckChange(ev) {
    document.querySelector('#search button[type="submit"]').click();
}

function onSearchSubmit(ev) {
    ev && ev.preventDefault();

    let waypoints = [];

    let $form = document.querySelector('#search');
    $form['waypoint'].forEach(input => {
        if (input.value.trim() !== '') {
            waypoints.push({location: input.value});
        }
    });

    if (waypoints.length < 2) return false;

    let route = waypoints.slice();

    let options = {
        origin: waypoints.shift().location,
        destination: waypoints.pop().location,
        waypoints: waypoints,
        avoidHighways: $form['avoid-highways'].checked,
        avoidTolls: $form['avoid-tolls'].checked,
        travelMode: google.maps.TravelMode.DRIVING,
    };

    directionsService.route(options, async (result, status) => {
        if (status === 'OK') {
            directionsRenderer.setDirections(result);

            overviewPath = result.routes[0].overview_path;

            await onMapChange();
        } else {
            alert(`Unable to determine route for ${route.map(obj => obj.location).join(' -> ')}.`);
        }
    });
}

async function onMapChange() {
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

    let locations = await findInPaths(polygon);
    clearMarkers();
    markers = map.data.addGeoJson(locations);
}

async function onMarkerClick(ev) {
    closeInfoWindow();

    infoWindow = new google.maps.InfoWindow({
        content: `<div class="info-window">Loading</div>`,
        position: new google.maps.LatLng(
            ev.feature.getGeometry().get().lat(),
            ev.feature.getGeometry().get().lng()
        )
    });

    let response = await fetch(`./locations/${ev.feature.getProperty('id')}`);
    let location = await response.json();

    infoWindow.setContent(`
        <a href="${location.url}" target="_blank" class="info-window">
            <div style="background-image:url(${location.thumbnail_url_3x2})">
                <img src="${location.thumbnail_url_3x2}" />
                <h1>${location.title}</h1>
            </div>
            
            <p>${location.subtitle}</p>
            <p class="learn-more">Learn more &rsaquo;</p>
        </a>
    `);

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

async function findInPaths(polygon) {
    let response = await window.fetch('./locations/find', {
        method: 'POST',
        body: JSON.stringify(polygon.geometry.coordinates),
        headers: {
            'Content-Type': 'application/json'
        }
    });
    return await response.json();
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

function onHashLoad() {
    let $form = document.querySelector('#search');
    let formValues = JSON.parse(atob(window.location.hash.replace(/^#/, '')));
    console.log(formValues);

    formValues.waypoints.forEach((waypoint, index) => {
        if (index < 2) {
            $form.querySelectorAll('[name=waypoint]')[index].value = waypoint;
        } else {
            onAddWaypoint(null, waypoint);
        }
    });

    $form.querySelector('[name=range]').value = formValues.range;

    if (formValues.avoidTolls) {
        $form.querySelector('[name=avoid-tolls]').setAttribute('checked', 'checked');
    } else {
        $form.querySelector('[name=avoid-tolls]').removeAttribute('checked');
    }

    if (formValues.avoidHighways) {
        $form.querySelector('[name=avoid-highways]').setAttribute('checked', 'checked');
    } else {
        $form.querySelector('[name=avoid-highways]').removeAttribute('checked');
    }

    onSearchSubmit();
}

function onSearchChange(ev) {
    let $form = document.querySelector('#search');
    let formValues = {
        waypoints: Array.from($form['waypoint']).map(input => {
            return input.value;
        }),
        range: $form['range'].value,
        avoidTolls: $form['avoid-tolls'].checked,
        avoidHighways: $form['avoid-highways'].checked
    };
    window.location.hash = '#' + btoa(JSON.stringify(formValues));
}