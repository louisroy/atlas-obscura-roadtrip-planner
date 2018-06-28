import React from 'react';
import PropTypes from 'prop-types';
import {withStyles} from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';

const styles = theme => ({
	container: {
		backgroundColor:theme.palette.background.paper
	},
	search: {
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

class SearchComponent extends React.Component {
	state = {};
	
	render() {
		const {classes} = this.props;
		
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
					<TextField
						placeholder="Destination..."
						className={classes.waypointField}
						defaultValue={process.env.NODE_ENV === 'development' && "Burlington, Vermont"}
						name="destination"
						margin="normal"
					/>
				</div>
				<input type="submit" style={{visibility: 'hidden'}}/>
			</form>
		);
	}
}

SearchComponent.propTypes = {
	classes: PropTypes.object.isRequired,
	onSubmit: PropTypes.func.isRequired,
};

export default withStyles(styles, {withTheme: true})(SearchComponent);