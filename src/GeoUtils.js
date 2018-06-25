/* global google */

class GeoUtils {
	jsts2googleMaps(object) {
		let coordArray = object.geometry.coordinates[0];
		let GMcoords = [];
		for (let i = 0; i < coordArray.length; i++) {
			GMcoords.push(new google.maps.LatLng(coordArray[i][1], coordArray[i][0]));
		}
		return GMcoords;
	};
}

export default new GeoUtils();