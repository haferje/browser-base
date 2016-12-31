import './main.scss';
import R from 'ramda';
import lexer from 'pug-lexer';
import parser from 'pug-parser';
import tpl from './tpl.pug';
import immutable from 'object-path-immutable';

import idom from 'incremental-dom';
const fixIdom = fn => (tagname, key, staticProp, rest) =>
	fn.apply(undefined, [tagname, key, staticProp].concat(rest));
const elementOpen = fixIdom(idom.elementOpen);
const elementClose = idom.elementClose;
const elementVoid = fixIdom(idom.elementVoid);
const text = (str, formatters = []) => idom.text.apply(undefined, [str].concat(formatters));

/**
 * elementOpen(tagname, tracking key, static propValArr, propValArr)
 * elementVoid(tagname, tracking key, static propValArr, propValArr)
 * elementClose(tagname)
 * text(text)
 */

const PugNodeType = {
	Block: 'Block',
	Tag: 'Tag',
	Text: 'Text',
	Code: 'Code',
};

const parseAttrs = (attrs, props) => {
	const staticAttrs = [];
	const dynamicAttrs = [];

	const {
		classes,
		events,
		rest
	} = R.reduce(
		(acc, x) => {
			const token = x.name.toLowerCase();
			if (token.startsWith('on')) {
				acc.events.push(x);
			} else if (token === 'class') {
				acc.classes.push(x);
			} else {
				acc.rest.push(x);
			}
			
			return acc;
		},
		{ events: [], classes: [], rest: [] },
		attrs
	);
	
	if (classes.length) {
		staticAttrs.push('class', classes.join(' '));
	}
	
	if (events.length) {
		events.forEach(
			x => dynamicAttrs.push(x.name, R.path(x.val.split('.'), props))
		);
	}
	
	if (rest.length) {
		rest.forEach(
			x => staticAttrs.push(x.name, x.val)
		);
	}

	return {
		dynamicAttrs,
		staticAttrs
	};
}

const isVoidElt = (node) => 
	node.selfClosing ||
	(
		node.type === PugNodeType.Tag &&
		[
			'input'
		].includes(node.name.toLowerCase())
	);

// @todo: we can push these calls into a list
// @todo: and we can develop smart inc-dom...
const render = ({ ast, props }) =>
	// @todo: this can be so optimized.
	// @todo: static parts of the tree can stay fine
	// @todo: determine where my code goes to generate a sexy idom loop
	(function recurse(node, parent){
		switch (node.type) {
			case PugNodeType.Block:
				node.nodes.forEach(x => recurse(x, node));
				break;
			
			case PugNodeType.Tag: {
				
				const { staticAttrs, dynamicAttrs } = parseAttrs(node.attrs, props);
				const args = [node.name, undefined, staticAttrs, dynamicAttrs];

				if (isVoidElt(node)) {
					elementVoid.apply(undefined, args);
					break;
				}

				elementOpen.apply(undefined, args);
				if (node.block) {
					node.block.nodes.forEach(x => recurse(x, node));
				}
				elementClose(node.name);
			}
			break;
			
			case PugNodeType.Text:
				text(node.val);
				break;
				
			case PugNodeType.Code:
				// @todo: this is one of the only times we depend on props...
				// @todo: only paths for now?
				if (parent.type === PugNodeType.Tag) {
					// Interpret as interpolated text
					const path = node.val.split('.');
					text(R.path(path, props));
				}
				break;

			default:
				console.debug('Walking: ', node, 'from', parent);
				console.error('unhandled.');
		}
	}(ast, undefined));

const root = document.createElement('root');

document.body.appendChild(root);

const state = {
	name: 'Frank',
	time: Date.now(),
	input: (...args) => {
		console.debug('Input', args);
	}
}

const tokens = lexer(tpl);
const component = parser(tokens);
setInterval(() => {
	const newState = immutable(state)
		.set('time', Date.now())
		.value();

	idom.patch(root, render, {
		ast: component,
		props: newState
	});
});
