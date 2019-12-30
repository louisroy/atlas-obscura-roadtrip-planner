import {NextPage} from 'next';
import React from 'react';
import clsx from 'clsx';
import {makeStyles, useTheme} from '@material-ui/core/styles';
import Drawer from '@material-ui/core/Drawer';
import CssBaseline from '@material-ui/core/CssBaseline';
import Divider from '@material-ui/core/Divider';
import Fab from '@material-ui/core/Fab';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import AddIcon from '@material-ui/icons/Add';
import DragIcon from '@material-ui/icons/DragIndicator';
import ExploreIcon from '@material-ui/icons/Explore';
import CloseIcon from '@material-ui/icons/Close';
import GoogleMapReact from "google-map-react";
import Typography from "@material-ui/core/Typography";
import Checkbox from "@material-ui/core/Checkbox";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import FormControl from "@material-ui/core/FormControl";
import FormLabel from "@material-ui/core/FormLabel";
import FormGroup from "@material-ui/core/FormGroup";
import Input from "@material-ui/core/Input";
import InputAdornment from "@material-ui/core/InputAdornment";

const drawerWidth = 240;

const useStyles = makeStyles(theme => ({
    root: {
        display: 'flex',
        height: '100vh'
    },
    appBar: {
        transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
        }),
    },
    appBarShift: {
        width: `calc(100% - ${drawerWidth}px)`,
        marginLeft: drawerWidth,
        transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.easeOut,
            duration: theme.transitions.duration.enteringScreen,
        }),
    },
    menuButton: {
        position: 'absolute',
        top: '0',
        left: '0',
        margin: theme.spacing(2),
        zIndex: 1
    },
    hide: {
        display: 'none',
    },
    drawer: {
        width: drawerWidth,
        flexShrink: 0,
    },
    drawerPaper: {
        width: drawerWidth,
    },
    drawerHeader: {
        display: 'flex',
        alignItems: 'center',
        padding: theme.spacing(0, 1),
        ...theme.mixins.toolbar,
        justifyContent: 'flex-end',
    },
    content: {
        flexGrow: 1,
        transition: theme.transitions.create('margin', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
        }),
        marginLeft: -drawerWidth,
    },
    contentShift: {
        transition: theme.transitions.create('margin', {
            easing: theme.transitions.easing.easeOut,
            duration: theme.transitions.duration.enteringScreen,
        }),
        marginLeft: 0,
    },
    formControl: {
        display: 'block',
        margin: theme.spacing(1),
    },
    formWaypoint: {
        marginBottom: theme.spacing(1),
    }
}));

const Index: NextPage = () => {
    const classes = useStyles();
    const theme = useTheme();
    const [open, setOpen] = React.useState(true);
    const [state, setState] = React.useState({
        avoidHighways: true,
        avoidTolls: false,
    });
    const [waypoints, setWaypoints] = React.useState(new Array<string>('', ''));


    const handleChange = (name: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
        setState({...state, [name]: event.target.checked});
    };

    const {avoidHighways, avoidTolls} = state;
    const error = [avoidHighways, avoidTolls].filter(v => v).length !== 2;

    const handleDrawerOpen = () => {
        setOpen(true);
    };

    const handleDrawerClose = () => {
        setOpen(false);
    };

    const handleAddWaypoint = () => {
        setWaypoints(waypoints.concat(['']));
    };

    const handleRemoveWaypoint = () => {
        setWaypoints(waypoints.slice(0, -1));
    };

    const createMapOptions = () => {
        return {
            //styles: MapStyles
        };
    };


    const waypointsInputs = waypoints.map(waypoint => {
        return (
            <FormControl className={classes.formWaypoint}>
                <Input
                    required
                    defaultValue={waypoint}
                    startAdornment={
                        <InputAdornment position="start">
                            <DragIcon/>
                        </InputAdornment>
                    }
                    endAdornment={
                        <InputAdornment position="end" onClick={handleRemoveWaypoint}>
                            <CloseIcon/>
                        </InputAdornment>
                    }
                />
            </FormControl>
        );
    });

    return (
        <div className={classes.root}>
            <CssBaseline/>
            <Fab
                color="default"
                size="small"
                aria-label="open drawer"
                onClick={handleDrawerOpen}
                className={clsx(classes.menuButton, open && classes.hide)}
            >
                <MenuIcon/>
            </Fab>
            <Drawer
                className={classes.drawer}
                variant="persistent"
                anchor="left"
                open={open}
                classes={{
                    paper: classes.drawerPaper,
                }}
            >
                <div className={classes.drawerHeader}>
                    <Typography variant="h5" component="h1">Roadtrip Planner</Typography>
                    <IconButton onClick={handleDrawerClose}>
                        {theme.direction === 'ltr' ? <ChevronLeftIcon/> : <ChevronRightIcon/>}
                    </IconButton>
                </div>
                <Divider/>
                <form noValidate autoComplete="off">
                    <FormControl component="fieldset" className={classes.formControl}>
                        <FormLabel component="legend">Waypoints</FormLabel>
                        {waypointsInputs}
                        <div>
                            <Button
                                onClick={handleAddWaypoint}
                                variant="contained"
                                color="default"
                                size="small"
                                endIcon={<AddIcon/>}
                            >
                                Add Waypoint
                            </Button>
                        </div>
                    </FormControl>
                    <FormControl component="fieldset" className={classes.formControl}>
                        <FormLabel component="legend">Options</FormLabel>
                        <FormGroup>
                            <FormControlLabel
                                label="Avoid tolls"
                                control={<Checkbox
                                    checked={avoidTolls}
                                    onChange={handleChange('avoidTolls')}
                                    value="avoidTolls"/>
                                }
                            />
                            <FormControlLabel
                                label="Avoid highways"
                                control={<Checkbox
                                    checked={avoidHighways}
                                    onChange={handleChange('avoidHighways')}
                                    value="avoidHighways"/>}
                            />
                        </FormGroup>
                    </FormControl>
                    <FormControl component="fieldset" className={classes.formControl}>
                        <Button
                            variant="contained"
                            color="primary"
                            endIcon={<ExploreIcon/>}
                        >
                            Submit
                        </Button>
                    </FormControl>
                </form>
            </Drawer>
            <main
                className={clsx(classes.content, {
                    [classes.contentShift]: open,
                })}
            >
                <GoogleMapReact
                    options={createMapOptions}
                    bootstrapURLKeys={{key: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || ''}}
                    defaultCenter={{lat: 40.7, lng: -74.0}}
                    defaultZoom={12}
                >
                </GoogleMapReact>
            </main>
        </div>
    );
};

export default Index;