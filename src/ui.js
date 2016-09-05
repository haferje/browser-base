import { actions } from 'redux-router5';
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

		const elt = dom.select('ui');

		elt.selectAll('nav > a').on('click', () => {
			const sref = d3.select(d3.event.target)
				.attr('sref');

			if (sref) {
				d3.event.preventDefault();
				state.dispatch(actions.navigateTo(sref));
			}

		});

	});
}

