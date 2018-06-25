import React from 'react';
import PropTypes from 'prop-types';
import {withStyles} from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import FormControl from '@material-ui/core/FormControl';
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Icon from '@material-ui/core/Icon';
import Button from '@material-ui/core/Button';
import Switch from '@material-ui/core/Switch';
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import Typography from '@material-ui/core/Typography';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import Slider from '@material-ui/lab/Slider';

const styles = theme => ({
	container: {},
	search: {
		padding: theme.spacing.unit,
	},
	heading: {
		fontSize: theme.typography.pxToRem(15),
		flexBasis: '33.33%',
		flexShrink: 0,
	},
	options: {
		flex: 1
	},
	button: {
		margin: theme.spacing.unit,
	},
	leftIcon: {
		marginRight: theme.spacing.unit,
	},
	rightIcon: {
		marginLeft: theme.spacing.unit,
	},
	iconSmall: {
		fontSize: 20,
	},
	waypoint: {
		display: 'flex',
		alignItems: 'center'
	},
	waypointIcon: {
		fontSize: 12
	},
	waypointField: {
		flex: 1,
		marginLeft: theme.spacing.unit,
		marginRight: theme.spacing.unit,
	}
});

class FormComponent extends React.Component {
	state = {
		expanded: null,
		avoidHighways: false,
		avoidTolls: false,
	};
	
	onPanelChange = panel => (event, expanded) => {
		this.setState({
			expanded: expanded ? panel : false,
		});
	};
	
	onOptionsChange = name => event => {
		this.setState({[name]: event.target.checked});
	};
	
	render() {
		const {classes} = this.props;
		const {expanded} = this.state;
		
		return (
			<form
				className={classes.container}
				noValidate
				autoComplete="off"
				action="/"
				method="POST"
				onSubmit={this.props.onSubmit}
			>
				<div className={classes.search}>
					<div className={classes.waypoint}>
						<Icon className={classes.waypointIcon}>trip_origin</Icon>
						<TextField
							placeholder="Starting point"
							className={classes.waypointField}
							defaultValue={process.env.NODE_ENV === 'development' && "Quebec City"}
							name="waypoint"
							margin="normal"
						/>
					</div>
					<div className={classes.waypoint}>
						<Icon className={classes.waypointIcon}>trip_origin</Icon>
						<TextField
							placeholder="Destination"
							className={classes.waypointField}
							defaultValue={process.env.NODE_ENV === 'development' && "Burlington VT"}
							name="waypoint"
							margin="normal"
						/>
					</div>
					<div className={classes.waypoint}>
						<Button variant="fab" mini color="primary" aria-label="add" className={classes.button}>
							<Icon>add</Icon>
						</Button>
						<TextField
							disabled
							placeholder="Add destination"
							className={classes.waypointField}
							margin="normal"
						/>
					</div>
					
					<Slider onChange={this.props.onRadiusChange} name="radius" min={1} max={25} value={13}/>
				</div>
				
				<ExpansionPanel
					className={classes.options}
					expanded={expanded === 'panel1'}
					onChange={this.onPanelChange('panel1')}
				>
					<ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
						<Typography className={classes.heading}>Options</Typography>
					</ExpansionPanelSummary>
					<ExpansionPanelDetails>
						<FormControl component="fieldset">
							<FormGroup>
								<FormControlLabel
									control={
										<Switch
											checked={this.state.avoidHighways}
											onChange={this.onOptionsChange('avoidHighways')}
											name="avoidHighways"
										/>
									}
									label="Avoid highways"
								/>
								<FormControlLabel
									control={
										<Switch
											checked={this.state.avoidTolls}
											onChange={this.onOptionsChange('avoidTolls')}
											name="avoidTolls"
										/>
									}
									label="Avoid tolls"
								/>
							</FormGroup>
						</FormControl>
					</ExpansionPanelDetails>
				</ExpansionPanel>
				<input type="submit" style={{visibility:'hidden'}} />
			</form>
		);
	}
}

FormComponent.propTypes = {
	classes: PropTypes.object.isRequired,
	onSubmit: PropTypes.func.isRequired,
	onRadiusChange: PropTypes.func.isRequired,
};

export default withStyles(styles, {withTheme: true})(FormComponent);