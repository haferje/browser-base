import './main.scss';

// Build the router
import { Router5 } from 'router5';
import { createLoader } from './util/systemLoader';


const route = (name, path, opts = {}) => ({ path, name, ...opts });

const lodashUri = 'https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.15.0/lodash.min.js';
const d3Uri = 'https://cdnjs.cloudflare.com/ajax/libs/d3/4.2.2/d3.min.js';

// Define some routes to test
const routes = [
	// Resolve as module
	route('root', '/', {
		systemjs: d3Uri,
	}),
	// Resolve as keyed map
	route('test', '/test', {
		systemjs: {
			lodash: lodashUri,
			d3: d3Uri,
		},
	}),
	// Resolve as module list
	route('test2', '/test2', {
		systemjs: [
			lodashUri, d3Uri,
		],
	}),
	route('fail', '/fail', {
		systemjs: 'invalid module path!',
	}),
];

const router = new Router5(routes, {
	useHash: true,
	defaultRoute: 'root',
}).useMiddleware(createLoader({
	routes,
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

console.debug('State => ', state);

// Kick off the router
router.start();

// Pass and get d3 as systemjs value
router.navigate('test');

// Pass and get object of { d3, lodash }
// router.navigate('test2');

// Fail
// router.navigate('fail');
