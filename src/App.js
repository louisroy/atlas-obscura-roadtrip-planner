/* global google */

import React from 'react';
import PropTypes from 'prop-types';
import {withStyles} from '@material-ui/core/styles';
import Drawer from '@material-ui/core/Drawer';
import Hidden from '@material-ui/core/Hidden';
import MapComponent from './MapComponent';
import FormComponent from './FormComponent';
import SearchComponent from './SearchComponent';
import GeoUtils from './GeoUtils';
import AtlasObscura from './AtlasObscura';
import * as turf from '@turf/turf'

const drawerWidth = 240;
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
	navIconHide: {
		[theme.breakpoints.up('md')]: {
			display: 'none',
		},
	},
	toolbar: theme.mixins.toolbar,
	drawerPaper: {
		flex: 'none',
		width: drawerWidth,
		[theme.breakpoints.up('md')]: {
			position: 'relative',
		},
	},
	content: {
		flexGrow: 1,
		position: 'relative',
		backgroundColor: theme.palette.background.default,
	},
	search: {
		position: 'absolute',
		top: theme.spacing.unit,
		left: theme.spacing.unit
	}
});

class App extends React.Component {
	state = {
		destinationSubmitted: false,
		mobileOpen: false,
		directionsRequest: null,
		infoWindow: null,
		initialDestination: null,
		markers: []
	};
	
	onDrawerToggle = () => {
		this.setState({mobileOpen: !this.state.mobileOpen});
	};
	
	onDestinationSubmit = (ev) => {
		ev.preventDefault();
		
		this.setState({
			initialDestination: ev.target['destination'].value,
			destinationSubmitted: true,
		});
	};
	
	onFormSubmit = (ev) => {
		ev.preventDefault();
		
		const DirectionsService = new google.maps.DirectionsService();
		
		let waypoints = [];
		
		ev.target['waypoint'].forEach((input) => {
			waypoints.push(input.value);
		});
		
		let options = {
			origin: waypoints.shift(),
			destination: waypoints.pop(),
			waypoints: waypoints,
			avoidHighways: ev.target['avoidHighways'].checked,
			avoidTolls: ev.target['avoidTolls'].checked,
			travelMode: google.maps.TravelMode.DRIVING,
		};
		
		DirectionsService.route(options, (result, status) => {
			this.onDirectionsResult(result, status);
			this.onRadiusChange(ev, 13);
			this.prepareMarkers();
		});
	};
	
	onRadiusChange = (ev, value) => {
		if (this.state.directions) {
			let overviewPath = this.state.directions.routes[0].overview_path,
				overviewPathGeo = [];
			
			for (let i = 0; i < overviewPath.length; i++) {
				overviewPathGeo.push(
					[overviewPath[i].lng(), overviewPath[i].lat()]
				);
			}
			
			let lineString = turf.lineString(overviewPathGeo, {name: 'line 1'});
			let polygon = turf.buffer(lineString, 10, {units: 'miles'});
			
			this.setState({
				paths: GeoUtils.jsts2googleMaps(polygon)
			});
		}
	};
	
	onMarkerClick = (ev, id) => {
		this.setState({
			infoWindow: null
		});
		
		AtlasObscura.find(id, (err, location) => {
			if (err) return console.log("Couldn't find with identifier", err);
			this.setState({
				infoWindow: location
			});
		});
	};
	
	onInfoWindowClose = (ev) => {
		this.setState({
			infoWindow: null
		});
	};
	
	prepareMarkers = () => {
		if (this.state.paths) {
			AtlasObscura.findInPaths(this.state.paths, (err, locations) => {
				if (err) return console.log("Couldn't find in polygon", err);
				this.setState({
					markers: locations
				});
			});
		}
	};
	
	onDirectionsResult(result, status) {
		if (status === google.maps.DirectionsStatus.OK) {
			this.setState({
				directions: result,
			});
		} else {
			console.error(`error fetching directions ${result}`);
		}
	}
	
	render() {
		const {classes, theme} = this.props;
		
		return (
			<div className={classes.root}>
				<div style={{display: this.state.destinationSubmitted ? 'block' : 'none'}}>
					<Hidden mdUp>
						<Drawer
							variant="temporary"
							anchor={theme.direction === 'rtl' ? 'right' : 'left'}
							open={this.state.mobileOpen && this.state.destinationSubmitted}
							onClose={this.onDrawerToggle}
							classes={{
								paper: classes.drawerPaper,
							}}
							ModalProps={{
								keepMounted: true, // Better open performance on mobile.
							}}
						>
							<FormComponent
								onSubmit={this.onFormSubmit.bind(this)}
								onRadiusChange={this.onRadiusChange.bind(this)}
							/>
						</Drawer>
					</Hidden>
					<Hidden smDown implementation="css">
						<Drawer
							variant="persistent"
							open={ this.state.destinationSubmitted }
							classes={{
								paper: classes.drawerPaper,
							}}
						>
							<FormComponent
								initialDestination={this.state.initialDestination}
								onSubmit={this.onFormSubmit.bind(this)}
								onRadiusChange={this.onRadiusChange.bind(this)}
							/>
						</Drawer>
					</Hidden>
				</div>
				<main className={classes.content}>
					<MapComponent
						infoWindow={this.state.infoWindow}
						onInfoWindowClose={this.onInfoWindowClose.bind(this)}
						markers={this.state.markers}
						onMarkerClick={this.onMarkerClick.bind(this)}
						directions={this.state.directions}
						paths={this.state.paths}
						googleMapURL={`https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`}
						loadingElement={<div style={{height: `100%`}}/>}
						containerElement={<div style={{height: `100%`}}/>}
						mapElement={<div style={{height: `100%`}}/>}
					/>
					<div className={classes.search}
					     style={{display: this.state.destinationSubmitted ? 'none' : 'block'}}>
						<SearchComponent
							onSubmit={this.onDestinationSubmit.bind(this)}
						/>
					</div>
				</main>
			</div>
		);
	}
}

App.propTypes = {
	classes: PropTypes.object.isRequired,
	theme: PropTypes.object.isRequired,
};

export default withStyles(styles, {withTheme: true})(App);