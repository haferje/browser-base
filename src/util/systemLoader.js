import System from 'systemjs';
import { keyBy, isObject, isArray, isString, zip, fromPairs } from 'lodash/fp';

const noop = () => {};

const opt = {
	// Dispatch on load
	dispatch: noop,
	// Key to look for
	key: 'systemjs',
	// Route definitions to find key on name match
	routes: [],
	// Systemjs config object
	config: {
		map: {
			'plugin-babel': './plugin-babel.js',
			'systemjs-babel-build': './systemjs-babel-browser.js'
		},
		transpiler: 'plugin-babel'
	},
};

export const createLoader = (options) => {
	const {
		key,
		routes,
		config,
	} = { ...opt, ...options };

	const Context = new System.constructor();

	Context.baseURL = System.baseURL;
	Context.config(config);

	// index by name
	const routeIdx = keyBy('name', routes);

	// Load fn
	const load = name => {
		if (routeIdx[name] && routeIdx[name][key]) {
			const toLoad = routeIdx[name][key];
			if (isString(toLoad)) {
				return Context.import(toLoad);
			} else if (isArray(toLoad)) {
				return Promise.all(toLoad.map(x => Context.import(x)));
			} else if (isObject(toLoad)) {
				const keys = Object.keys(toLoad);
				const vals = keys.map(
					k => Context.import(toLoad[k])
				);

				return Promise.all(vals).then(
					res => fromPairs(zip(keys, res))
				);
			}
		}
		return Promise.resolve();
	};

	// router5 middleware function
	return (/* router*/) => ({ getState, dispatch }, toState /* , fromState*/) =>
		load(toState.name).then(res => {
			const out = { ...toState };
			out[key] = res;
			return out;
		});
};
