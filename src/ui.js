import * as d3 from 'd3-selection';

import uiTpl from './ui.tpl.jade';

const dom = d3.select(document.body);

export default function (state) {
	let doInit = true;

	return state.subscribe(() => {
		if (doInit) {
			doInit = false;
			dom.append('ui').html(uiTpl);
		}
	});
}

