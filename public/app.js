let map, directionsService, directionsRenderer, overviewPath, radiusPolygon, markers, infoWindow, userLocation;

let cachedLocations = undefined
let cachedIds = {}

let isPageLoaded = false
let isMapLoaded = false
let isAppInitialized = false

window.addEventListener('load', function () {
    isPageLoaded = true
    if (isMapLoaded && !isAppInitialized) {
        init()
    }
})

function mapLoaded() {
    isMapLoaded = true
    if (isPageLoaded && !isAppInitialized) {
        init()
    }
}

async function init() {
    isAppInitialized = true
    try {
        let geoResponse = await fetch(`https://get.geojs.io/v1/ip/geo.json`);
        userLocation = await geoResponse.json();
    } catch (err) {
        console.log("Could not determine user location.");
    }

    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer();

    map = new google.maps.Map(document.querySelector('#map'), {
        center: (userLocation) ? {lat: parseFloat(userLocation.latitude), lng: parseFloat(userLocation.longitude)} : {
            lat: 54.5260,
            lng: -105.2551
        },
        zoom: (userLocation)? 8 : 3,
        fullscreenControl:false,
        styles: await (await fetch('./style.json')).json()
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
        document.querySelector('#search input[name="waypoint"]').value = `${userLocation.city}, ${userLocation.region}, ${userLocation.country_code}`;
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

    document.querySelector('.btn-export-geojson').addEventListener('click', onExportGeojson);
    document.querySelector('.btn-export-kml').addEventListener('click', onExportKML);

    new Sortable.default(document.querySelectorAll('.waypoints'), {
        draggable: '.form-control',
        handle: '.reorder',
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
    $clone.querySelector('input').removeAttribute('placeholder');
    $clone.querySelector('input').value = value || '';
    $waypoints.appendChild($clone);
}

function onDeleteWaypoint(ev) {
    ev.preventDefault();

    ev.target.parentNode.parentNode.parentNode.removeChild(ev.target.parentNode.parentNode);

    onSearchChange(ev);
}

async function onExportGeojson(ev) {
    ev.preventDefault();

    let {polygon} = await extractPaths();

    let points = turf.pointsWithinPolygon(await fetchAll(), polygon);

    const geojson = JSON.stringify(points, null, 2);

    // Create a blob and download link
    const blob = new Blob([geojson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'output.geojson';
    a.click();
    URL.revokeObjectURL(url);
}

async function onExportKML(ev) {
    let {polygon} = await extractPaths();

    let points = turf.pointsWithinPolygon(await fetchAll(), polygon);

    let kml = tokml(points);

    // Create a blob and download link
    const blob = new Blob([kml], { type: 'application/vnd.google-earth.kml+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'output.kml';
    a.click();
    URL.revokeObjectURL(url);
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

async function extractPaths() {
    let range = parseInt(document.querySelector('#range').value);

    document.querySelector('.range-value').textContent = range.toString();

    let overviewPathGeo = [];

    for (let i = 0; i < overviewPath.length; i++) {
        overviewPathGeo.push(
            [overviewPath[i].lng(), overviewPath[i].lat()]
        );
    }

    let lineString = turf.lineString(overviewPathGeo, {name: 'line 1'});
    let polygon = turf.buffer(lineString, range, {units: 'miles'});
    let paths = jsts2googleMaps(polygon);
    let locations = await findInPaths(polygon);
    return {polygon, paths, locations};
}

async function onMapChange() {
    if (!overviewPath) return null;

    closeInfoWindow();

    let {paths, locations} = await extractPaths();

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

    clearMarkers();
    markers = map.data.addGeoJson(locations);
}

async function fetchById(id) {
    if (!cachedIds[id]) {
        let response = await fetch(`https://www.atlasobscura.com/places/${id}.json?place_only=1`)
        let json  = await response.json()
        cachedIds[id] = json
    }
    return cachedIds[id]
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

    let location = await fetchById(ev.feature.getProperty('id'))

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

async function fetchAll() {
    if (!cachedLocations) {
        const response = await fetch('https://www.atlasobscura.com/articles/all-places-in-the-atlas-on-one-map')
        const html  = await response.text()

        let matches = html.match(/AtlasObscura\.all_places = (.*?);/);

        if (!matches) {
            throw new Error('Could not extract places from HTML')
        }

        locations = JSON.parse(matches[1]);

        let points = locations.map(location => {
            return turf.point([location.lng, location.lat], {id: location.id});
        });
        cachedLocations = turf.featureCollection(points);
    }

    return cachedLocations
}

async function findInPaths(polygon) {
    let points = turf.pointsWithinPolygon(await fetchAll(), polygon);

    return points
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