import './main.scss';

// Build the router
import { Router5 } from 'router5';
import { createLoader } from './util/systemLoader';
import historyPlugin from 'router5-history';

const route = (name, path, opts = {}) => ({ path, name, ...opts });

// Define some routes to test
const routes = [
	// Resolve as module
	route('root', '/'),
	route('blog', '/blog'),
	route('toys', '/toys'),
	route('contact', '/contact', {
		systemjs: './contact/ui.js'
	}),
];

const router = new Router5(routes, {
	useHash: true,
	hashPrefix: '!',
	defaultRoute: 'root',
	autoCleaUp: true,
}).useMiddleware(createLoader({
	routes,
	})).usePlugin(historyPlugin({
		forceDeactivate: true
	}));

// Build state from some defaults
import { makeState, defaultMiddleware } from './util/state';
import { combineReducers } from 'redux';
import { router5Middleware, router5Reducer } from 'redux-router5';

const middleware = defaultMiddleware.concat(
	router5Middleware(router)
);

// Base reducer -- publiching route only
const rootReducer = combineReducers({
	route: router5Reducer,
});


// The State object
const state = makeState(rootReducer, middleware);

// Register ui component
import ui from './ui';
ui(state);


// Kick off the router
router.start();

