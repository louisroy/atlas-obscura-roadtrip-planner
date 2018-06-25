/* global google */

import React from 'react';
import PropTypes from 'prop-types';
import {withStyles} from '@material-ui/core/styles';
import {
	withScriptjs,
	withGoogleMap,
	GoogleMap,
	DirectionsRenderer,
	InfoWindow,
	Marker,
	Polygon
} from "react-google-maps"

const styles = theme => ({
	root: {
		flexGrow: 1,
		height: '100%',
		zIndex: 1,
		overflow: 'hidden',
		position: 'relative',
		display: 'flex',
		width: '100%',
	},
	infoWindow: {
		display:'block',
		textDecoration:'none',
		color:'black',
		width:250
	},
	infoWindowThumbnail: {
		position:'relative',
	},
	infoWindowThumbnailImage: {
		display:'block',
		width:'100%',
		height:'auto',
	},
	infoWindowThumbnailTitle: {
		boxSizing:'border-box',
		width:'100%',
		position:'absolute',
		color:'white',
		textShadow:'0px 0px 10px #000',
		padding:5,
		margin:0,
		lineHeight:1,
		bottom:0,
		left:0
	},
	infoWindowLink: {
		textAlign:'right',
		textDecoration:'underline',
		color:'blue',
		marginBottom:0
	}
});

class MapComponent extends React.Component {
	state = {};
	
	options = {
		mapTypeControl: false,
		fullscreenControl: false,
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
	};
	
	render() {
		const {classes, infoWindow, markers, directions, paths} = this.props;
		
		return (
			<GoogleMap
				defaultZoom={4}
				defaultCenter={{lat: 41.4413664, lng: -95.9141791}}
				defaultOptions={this.options}
			>
				{markers && markers.length && markers.map((marker) => {
					return <Marker
						key={ marker.id }
						position={{lat: marker.lat, lng: marker.lng}}
						onClick={(ev, id) =>this.props.onMarkerClick(ev, marker.id)}
					    icon={{
						    path: google.maps.SymbolPath.CIRCLE,
						    fillColor: 'yellow',
						    fillOpacity: 0.8,
						    scale: 2,
						    strokeColor: 'red',
						    strokeWeight: 14
						
					    }}
					/>
				})}
				
				{infoWindow && <InfoWindow
					position={{lat: infoWindow.coordinates.lat, lng: infoWindow.coordinates.lng}}
					onCloseClick={this.props.onInfoWindowClose}
				>
					<a href={infoWindow.url} target="_blank" className={classes.infoWindow}>
						{infoWindow.thumbnail_url_3x2 &&
						<div className={classes.infoWindowThumbnail}>
							<img className={classes.infoWindowThumbnailImage} src={infoWindow.thumbnail_url_3x2}/>
							<h1 className={classes.infoWindowThumbnailTitle}>{infoWindow.title}</h1>
						</div>
						}
						
						{!infoWindow.thumbnail_url_3x2 &&
							<h1>{infoWindow.title}</h1>
						}
						
						<p>{infoWindow.subtitle}</p>
						<p className={classes.infoWindowLink}>Learn more &rsaquo;</p>
					</a>
				</InfoWindow>}
				
				{paths && <Polygon paths={paths}/>}
				
				{directions && <DirectionsRenderer directions={directions}/>}
			</GoogleMap>
		);
	}
}

MapComponent.propTypes = {
	classes: PropTypes.object.isRequired,
	onMarkerClick: PropTypes.func.isRequired,
	onInfoWindowClose: PropTypes.func.isRequired
};

export default withScriptjs(withGoogleMap(withStyles(styles, {withTheme: true})(MapComponent)));