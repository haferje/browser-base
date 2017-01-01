/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(1);
	__webpack_require__(2);
	module.exports = __webpack_require__(3);


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__.p + "index.css";

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__.p + "index.html";

/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	__webpack_require__(4);

	var _ramda = __webpack_require__(8);

	var _ramda2 = _interopRequireDefault(_ramda);

	var _pugLexer = __webpack_require__(317);

	var _pugLexer2 = _interopRequireDefault(_pugLexer);

	var _pugParser = __webpack_require__(329);

	var _pugParser2 = _interopRequireDefault(_pugParser);

	var _tpl = __webpack_require__(332);

	var _tpl2 = _interopRequireDefault(_tpl);

	var _objectPathImmutable = __webpack_require__(333);

	var _objectPathImmutable2 = _interopRequireDefault(_objectPathImmutable);

	var _incrementalDom = __webpack_require__(334);

	var _incrementalDom2 = _interopRequireDefault(_incrementalDom);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	var fixIdom = function fixIdom(fn) {
		return function (tagname, key, staticProp, rest) {
			return fn.apply(undefined, [tagname, key, staticProp].concat(rest));
		};
	};
	var elementOpen = fixIdom(_incrementalDom2.default.elementOpen);
	var elementClose = _incrementalDom2.default.elementClose;
	var elementVoid = fixIdom(_incrementalDom2.default.elementVoid);
	var text = function text(str) {
		var formatters = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
		return _incrementalDom2.default.text.apply(undefined, [str].concat(formatters));
	};

	/**
	 * elementOpen(tagname, tracking key, static propValArr, propValArr)
	 * elementVoid(tagname, tracking key, static propValArr, propValArr)
	 * elementClose(tagname)
	 * text(text)
	 */

	var PugNodeType = {
		Block: 'Block',
		Tag: 'Tag',
		Text: 'Text',
		Code: 'Code'
	};

	// @todo: eval the argval?!? gross.
	var parseAttrs = function parseAttrs(attrs, props) {
		var staticAttrs = [];
		var dynamicAttrs = [];

		var _R$reduce = _ramda2.default.reduce(function (acc, x) {
			var token = x.name.toLowerCase();
			if (token.startsWith('on')) {
				acc.events.push(x);
			} else if (token === 'class') {
				acc.classes.push(x);
			} else {
				acc.rest.push(x);
			}

			return acc;
		}, { events: [], classes: [], rest: [] }, attrs),
		    classes = _R$reduce.classes,
		    events = _R$reduce.events,
		    rest = _R$reduce.rest;

		if (classes.length) {
			staticAttrs.push('class', classes.map(function (x) {
				return x.val.slice(1, -1);
			}).join(' '));
		}

		if (events.length) {
			events.forEach(function (x) {
				return dynamicAttrs.push(x.name, _ramda2.default.path(x.val.split('.'), props));
			});
		}

		if (rest.length) {
			rest.forEach(function (x) {
				return staticAttrs.push(x.name, x.val);
			});
		}

		return {
			dynamicAttrs: dynamicAttrs,
			staticAttrs: staticAttrs
		};
	};

	var isVoidElt = function isVoidElt(node) {
		return node.selfClosing || node.type === PugNodeType.Tag && ['input'].includes(node.name.toLowerCase());
	};

	// @todo: we can push these calls into a list
	// @todo: and we can develop smart inc-dom...
	var compile = function compile(ast) {
		var commands = [];
		// @todo: pivitol parts of state model changing / extraction

		// @todo: this can be so optimized.
		// @todo: static parts of the tree can stay fine
		// @todo: determine where my code goes to generate a sexy idom loop
		(function recurse(node, parent) {
			switch (node.type) {
				case PugNodeType.Block:
					node.nodes.forEach(function (x) {
						return recurse(x, node);
					});
					break;

				case PugNodeType.Tag:
					{
						commands.push(function (props) {
							var _parseAttrs = parseAttrs(node.attrs, props),
							    staticAttrs = _parseAttrs.staticAttrs,
							    dynamicAttrs = _parseAttrs.dynamicAttrs;

							var args = [node.name, undefined, staticAttrs, dynamicAttrs];
							if (isVoidElt(node)) {
								elementVoid.apply(undefined, args);
							} else {
								elementOpen.apply(undefined, args);
							}
						});

						if (node.block) {
							node.block.nodes.forEach(function (x) {
								return recurse(x, node);
							});
						}

						if (!isVoidElt(node)) {
							commands.push(function () {
								return elementClose(node.name);
							});
						}
					}
					break;

				case PugNodeType.Text:
					commands.push(function () {
						return text(node.val);
					});
					break;

				case PugNodeType.Code:
					// @todo: this is one of the only times we depend on props...
					// @todo: only paths for now?
					if (parent.type === PugNodeType.Tag) {
						(function () {
							// Interpret as interpolated text
							var path = node.val.split('.');
							commands.push(function (props) {
								return text(_ramda2.default.path(path, props));
							});
						})();
					}
					break;

				default:
					console.debug('Walking: ', node, 'from', parent);
					console.error('unhandled.');
			}
		})(ast, undefined);

		// The compiled fn list, injecting props
		return function (props) {
			return commands.forEach(function (cmd) {
				return cmd(props);
			});
		};
	};

	var root = document.createElement('root');

	document.body.appendChild(root);

	var name = 'Frank';
	var state = {
		name: name,
		time: Date.now(),
		input: function input(evt) {
			name = evt.target.value;
		}
	};

	var tokens = (0, _pugLexer2.default)(_tpl2.default);
	var component = (0, _pugParser2.default)(tokens);
	var renderer = compile(component);

	setInterval(function () {
		var newState = (0, _objectPathImmutable2.default)(state).set('name', name).set('time', Date.now()).value();

		_incrementalDom2.default.patch(root, renderer, newState);
	});

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag

	// load the styles
	var content = __webpack_require__(5);
	if(typeof content === 'string') content = [[module.id, content, '']];
	// add the styles to the DOM
	var update = __webpack_require__(7)(content, {});
	if(content.locals) module.exports = content.locals;
	// Hot Module Replacement
	if(false) {
		// When the styles change, update the <style> tags
		if(!content.locals) {
			module.hot.accept("!!./../node_modules/css-loader/index.js!./../node_modules/postcss-loader/index.js!./../node_modules/sass-loader/index.js!./main.scss", function() {
				var newContent = require("!!./../node_modules/css-loader/index.js!./../node_modules/postcss-loader/index.js!./../node_modules/sass-loader/index.js!./main.scss");
				if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
				update(newContent);
			});
		}
		// When the module is disposed, remove the <style> tags
		module.hot.dispose(function() { update(); });
	}

/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(6)();
	// imports


	// module
	exports.push([module.id, ".hidden{display:none}.user__name input{display:block}", ""]);

	// exports


/***/ },
/* 6 */
/***/ function(module, exports) {

	/*
		MIT License http://www.opensource.org/licenses/mit-license.php
		Author Tobias Koppers @sokra
	*/
	// css base code, injected by the css-loader
	module.exports = function() {
		var list = [];

		// return the list of modules as css string
		list.toString = function toString() {
			var result = [];
			for(var i = 0; i < this.length; i++) {
				var item = this[i];
				if(item[2]) {
					result.push("@media " + item[2] + "{" + item[1] + "}");
				} else {
					result.push(item[1]);
				}
			}
			return result.join("");
		};

		// import a list of modules into the list
		list.i = function(modules, mediaQuery) {
			if(typeof modules === "string")
				modules = [[null, modules, ""]];
			var alreadyImportedModules = {};
			for(var i = 0; i < this.length; i++) {
				var id = this[i][0];
				if(typeof id === "number")
					alreadyImportedModules[id] = true;
			}
			for(i = 0; i < modules.length; i++) {
				var item = modules[i];
				// skip already imported module
				// this implementation is not 100% perfect for weird media query combinations
				//  when a module is imported multiple times with different media queries.
				//  I hope this will never occur (Hey this way we have smaller bundles)
				if(typeof item[0] !== "number" || !alreadyImportedModules[item[0]]) {
					if(mediaQuery && !item[2]) {
						item[2] = mediaQuery;
					} else if(mediaQuery) {
						item[2] = "(" + item[2] + ") and (" + mediaQuery + ")";
					}
					list.push(item);
				}
			}
		};
		return list;
	};


/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	/*
		MIT License http://www.opensource.org/licenses/mit-license.php
		Author Tobias Koppers @sokra
	*/
	var stylesInDom = {},
		memoize = function(fn) {
			var memo;
			return function () {
				if (typeof memo === "undefined") memo = fn.apply(this, arguments);
				return memo;
			};
		},
		isOldIE = memoize(function() {
			return /msie [6-9]\b/.test(window.navigator.userAgent.toLowerCase());
		}),
		getHeadElement = memoize(function () {
			return document.head || document.getElementsByTagName("head")[0];
		}),
		singletonElement = null,
		singletonCounter = 0,
		styleElementsInsertedAtTop = [];

	module.exports = function(list, options) {
		if(false) {
			if(typeof document !== "object") throw new Error("The style-loader cannot be used in a non-browser environment");
		}

		options = options || {};
		// Force single-tag solution on IE6-9, which has a hard limit on the # of <style>
		// tags it will allow on a page
		if (typeof options.singleton === "undefined") options.singleton = isOldIE();

		// By default, add <style> tags to the bottom of <head>.
		if (typeof options.insertAt === "undefined") options.insertAt = "bottom";

		var styles = listToStyles(list);
		addStylesToDom(styles, options);

		return function update(newList) {
			var mayRemove = [];
			for(var i = 0; i < styles.length; i++) {
				var item = styles[i];
				var domStyle = stylesInDom[item.id];
				domStyle.refs--;
				mayRemove.push(domStyle);
			}
			if(newList) {
				var newStyles = listToStyles(newList);
				addStylesToDom(newStyles, options);
			}
			for(var i = 0; i < mayRemove.length; i++) {
				var domStyle = mayRemove[i];
				if(domStyle.refs === 0) {
					for(var j = 0; j < domStyle.parts.length; j++)
						domStyle.parts[j]();
					delete stylesInDom[domStyle.id];
				}
			}
		};
	}

	function addStylesToDom(styles, options) {
		for(var i = 0; i < styles.length; i++) {
			var item = styles[i];
			var domStyle = stylesInDom[item.id];
			if(domStyle) {
				domStyle.refs++;
				for(var j = 0; j < domStyle.parts.length; j++) {
					domStyle.parts[j](item.parts[j]);
				}
				for(; j < item.parts.length; j++) {
					domStyle.parts.push(addStyle(item.parts[j], options));
				}
			} else {
				var parts = [];
				for(var j = 0; j < item.parts.length; j++) {
					parts.push(addStyle(item.parts[j], options));
				}
				stylesInDom[item.id] = {id: item.id, refs: 1, parts: parts};
			}
		}
	}

	function listToStyles(list) {
		var styles = [];
		var newStyles = {};
		for(var i = 0; i < list.length; i++) {
			var item = list[i];
			var id = item[0];
			var css = item[1];
			var media = item[2];
			var sourceMap = item[3];
			var part = {css: css, media: media, sourceMap: sourceMap};
			if(!newStyles[id])
				styles.push(newStyles[id] = {id: id, parts: [part]});
			else
				newStyles[id].parts.push(part);
		}
		return styles;
	}

	function insertStyleElement(options, styleElement) {
		var head = getHeadElement();
		var lastStyleElementInsertedAtTop = styleElementsInsertedAtTop[styleElementsInsertedAtTop.length - 1];
		if (options.insertAt === "top") {
			if(!lastStyleElementInsertedAtTop) {
				head.insertBefore(styleElement, head.firstChild);
			} else if(lastStyleElementInsertedAtTop.nextSibling) {
				head.insertBefore(styleElement, lastStyleElementInsertedAtTop.nextSibling);
			} else {
				head.appendChild(styleElement);
			}
			styleElementsInsertedAtTop.push(styleElement);
		} else if (options.insertAt === "bottom") {
			head.appendChild(styleElement);
		} else {
			throw new Error("Invalid value for parameter 'insertAt'. Must be 'top' or 'bottom'.");
		}
	}

	function removeStyleElement(styleElement) {
		styleElement.parentNode.removeChild(styleElement);
		var idx = styleElementsInsertedAtTop.indexOf(styleElement);
		if(idx >= 0) {
			styleElementsInsertedAtTop.splice(idx, 1);
		}
	}

	function createStyleElement(options) {
		var styleElement = document.createElement("style");
		styleElement.type = "text/css";
		insertStyleElement(options, styleElement);
		return styleElement;
	}

	function createLinkElement(options) {
		var linkElement = document.createElement("link");
		linkElement.rel = "stylesheet";
		insertStyleElement(options, linkElement);
		return linkElement;
	}

	function addStyle(obj, options) {
		var styleElement, update, remove;

		if (options.singleton) {
			var styleIndex = singletonCounter++;
			styleElement = singletonElement || (singletonElement = createStyleElement(options));
			update = applyToSingletonTag.bind(null, styleElement, styleIndex, false);
			remove = applyToSingletonTag.bind(null, styleElement, styleIndex, true);
		} else if(obj.sourceMap &&
			typeof URL === "function" &&
			typeof URL.createObjectURL === "function" &&
			typeof URL.revokeObjectURL === "function" &&
			typeof Blob === "function" &&
			typeof btoa === "function") {
			styleElement = createLinkElement(options);
			update = updateLink.bind(null, styleElement);
			remove = function() {
				removeStyleElement(styleElement);
				if(styleElement.href)
					URL.revokeObjectURL(styleElement.href);
			};
		} else {
			styleElement = createStyleElement(options);
			update = applyToTag.bind(null, styleElement);
			remove = function() {
				removeStyleElement(styleElement);
			};
		}

		update(obj);

		return function updateStyle(newObj) {
			if(newObj) {
				if(newObj.css === obj.css && newObj.media === obj.media && newObj.sourceMap === obj.sourceMap)
					return;
				update(obj = newObj);
			} else {
				remove();
			}
		};
	}

	var replaceText = (function () {
		var textStore = [];

		return function (index, replacement) {
			textStore[index] = replacement;
			return textStore.filter(Boolean).join('\n');
		};
	})();

	function applyToSingletonTag(styleElement, index, remove, obj) {
		var css = remove ? "" : obj.css;

		if (styleElement.styleSheet) {
			styleElement.styleSheet.cssText = replaceText(index, css);
		} else {
			var cssNode = document.createTextNode(css);
			var childNodes = styleElement.childNodes;
			if (childNodes[index]) styleElement.removeChild(childNodes[index]);
			if (childNodes.length) {
				styleElement.insertBefore(cssNode, childNodes[index]);
			} else {
				styleElement.appendChild(cssNode);
			}
		}
	}

	function applyToTag(styleElement, obj) {
		var css = obj.css;
		var media = obj.media;

		if(media) {
			styleElement.setAttribute("media", media)
		}

		if(styleElement.styleSheet) {
			styleElement.styleSheet.cssText = css;
		} else {
			while(styleElement.firstChild) {
				styleElement.removeChild(styleElement.firstChild);
			}
			styleElement.appendChild(document.createTextNode(css));
		}
	}

	function updateLink(linkElement, obj) {
		var css = obj.css;
		var sourceMap = obj.sourceMap;

		if(sourceMap) {
			// http://stackoverflow.com/a/26603875
			css += "\n/*# sourceMappingURL=data:application/json;base64," + btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap)))) + " */";
		}

		var blob = new Blob([css], { type: "text/css" });

		var oldSrc = linkElement.href;

		linkElement.href = URL.createObjectURL(blob);

		if(oldSrc)
			URL.revokeObjectURL(oldSrc);
	}


/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = {
	  F: __webpack_require__(9),
	  T: __webpack_require__(13),
	  __: __webpack_require__(14),
	  add: __webpack_require__(15),
	  addIndex: __webpack_require__(17),
	  adjust: __webpack_require__(22),
	  all: __webpack_require__(24),
	  allPass: __webpack_require__(31),
	  always: __webpack_require__(10),
	  and: __webpack_require__(47),
	  any: __webpack_require__(48),
	  anyPass: __webpack_require__(50),
	  ap: __webpack_require__(51),
	  aperture: __webpack_require__(52),
	  append: __webpack_require__(55),
	  apply: __webpack_require__(56),
	  applySpec: __webpack_require__(57),
	  ascend: __webpack_require__(59),
	  assoc: __webpack_require__(60),
	  assocPath: __webpack_require__(61),
	  binary: __webpack_require__(63),
	  bind: __webpack_require__(38),
	  both: __webpack_require__(65),
	  call: __webpack_require__(69),
	  chain: __webpack_require__(71),
	  clamp: __webpack_require__(76),
	  clone: __webpack_require__(77),
	  comparator: __webpack_require__(81),
	  complement: __webpack_require__(82),
	  compose: __webpack_require__(84),
	  composeK: __webpack_require__(91),
	  composeP: __webpack_require__(92),
	  concat: __webpack_require__(95),
	  cond: __webpack_require__(113),
	  construct: __webpack_require__(114),
	  constructN: __webpack_require__(115),
	  contains: __webpack_require__(116),
	  converge: __webpack_require__(117),
	  countBy: __webpack_require__(118),
	  curry: __webpack_require__(70),
	  curryN: __webpack_require__(19),
	  dec: __webpack_require__(121),
	  descend: __webpack_require__(122),
	  defaultTo: __webpack_require__(123),
	  difference: __webpack_require__(124),
	  differenceWith: __webpack_require__(125),
	  dissoc: __webpack_require__(127),
	  dissocPath: __webpack_require__(128),
	  divide: __webpack_require__(129),
	  drop: __webpack_require__(130),
	  dropLast: __webpack_require__(132),
	  dropLastWhile: __webpack_require__(137),
	  dropRepeats: __webpack_require__(140),
	  dropRepeatsWith: __webpack_require__(142),
	  dropWhile: __webpack_require__(145),
	  either: __webpack_require__(147),
	  empty: __webpack_require__(149),
	  eqBy: __webpack_require__(150),
	  eqProps: __webpack_require__(151),
	  equals: __webpack_require__(100),
	  evolve: __webpack_require__(152),
	  filter: __webpack_require__(109),
	  find: __webpack_require__(153),
	  findIndex: __webpack_require__(155),
	  findLast: __webpack_require__(157),
	  findLastIndex: __webpack_require__(159),
	  flatten: __webpack_require__(161),
	  flip: __webpack_require__(162),
	  forEach: __webpack_require__(163),
	  forEachObjIndexed: __webpack_require__(164),
	  fromPairs: __webpack_require__(165),
	  groupBy: __webpack_require__(166),
	  groupWith: __webpack_require__(167),
	  gt: __webpack_require__(168),
	  gte: __webpack_require__(169),
	  has: __webpack_require__(170),
	  hasIn: __webpack_require__(171),
	  head: __webpack_require__(172),
	  identical: __webpack_require__(104),
	  identity: __webpack_require__(173),
	  ifElse: __webpack_require__(175),
	  inc: __webpack_require__(176),
	  indexBy: __webpack_require__(177),
	  indexOf: __webpack_require__(178),
	  init: __webpack_require__(179),
	  insert: __webpack_require__(180),
	  insertAll: __webpack_require__(181),
	  intersection: __webpack_require__(182),
	  intersectionWith: __webpack_require__(186),
	  intersperse: __webpack_require__(188),
	  into: __webpack_require__(189),
	  invert: __webpack_require__(194),
	  invertObj: __webpack_require__(195),
	  invoker: __webpack_require__(196),
	  is: __webpack_require__(197),
	  isArrayLike: __webpack_require__(39),
	  isEmpty: __webpack_require__(198),
	  isNil: __webpack_require__(199),
	  join: __webpack_require__(200),
	  juxt: __webpack_require__(201),
	  keys: __webpack_require__(42),
	  keysIn: __webpack_require__(202),
	  last: __webpack_require__(143),
	  lastIndexOf: __webpack_require__(203),
	  length: __webpack_require__(204),
	  lens: __webpack_require__(206),
	  lensIndex: __webpack_require__(207),
	  lensPath: __webpack_require__(209),
	  lensProp: __webpack_require__(211),
	  lift: __webpack_require__(67),
	  liftN: __webpack_require__(68),
	  lt: __webpack_require__(212),
	  lte: __webpack_require__(213),
	  map: __webpack_require__(34),
	  mapAccum: __webpack_require__(214),
	  mapAccumRight: __webpack_require__(215),
	  mapObjIndexed: __webpack_require__(216),
	  match: __webpack_require__(217),
	  mathMod: __webpack_require__(218),
	  max: __webpack_require__(32),
	  maxBy: __webpack_require__(219),
	  mean: __webpack_require__(220),
	  median: __webpack_require__(222),
	  memoize: __webpack_require__(223),
	  merge: __webpack_require__(224),
	  mergeAll: __webpack_require__(225),
	  mergeWith: __webpack_require__(226),
	  mergeWithKey: __webpack_require__(227),
	  min: __webpack_require__(228),
	  minBy: __webpack_require__(229),
	  modulo: __webpack_require__(230),
	  multiply: __webpack_require__(231),
	  nAry: __webpack_require__(64),
	  negate: __webpack_require__(232),
	  none: __webpack_require__(233),
	  not: __webpack_require__(83),
	  nth: __webpack_require__(144),
	  nthArg: __webpack_require__(234),
	  objOf: __webpack_require__(193),
	  of: __webpack_require__(235),
	  omit: __webpack_require__(237),
	  once: __webpack_require__(238),
	  or: __webpack_require__(148),
	  over: __webpack_require__(239),
	  pair: __webpack_require__(240),
	  partial: __webpack_require__(241),
	  partialRight: __webpack_require__(243),
	  partition: __webpack_require__(244),
	  path: __webpack_require__(210),
	  pathEq: __webpack_require__(245),
	  pathOr: __webpack_require__(246),
	  pathSatisfies: __webpack_require__(247),
	  pick: __webpack_require__(248),
	  pickAll: __webpack_require__(249),
	  pickBy: __webpack_require__(250),
	  pipe: __webpack_require__(85),
	  pipeK: __webpack_require__(251),
	  pipeP: __webpack_require__(93),
	  pluck: __webpack_require__(33),
	  prepend: __webpack_require__(252),
	  product: __webpack_require__(253),
	  project: __webpack_require__(254),
	  prop: __webpack_require__(45),
	  propEq: __webpack_require__(256),
	  propIs: __webpack_require__(257),
	  propOr: __webpack_require__(258),
	  propSatisfies: __webpack_require__(259),
	  props: __webpack_require__(260),
	  range: __webpack_require__(261),
	  reduce: __webpack_require__(46),
	  reduceBy: __webpack_require__(119),
	  reduceRight: __webpack_require__(262),
	  reduceWhile: __webpack_require__(263),
	  reduced: __webpack_require__(264),
	  reject: __webpack_require__(107),
	  remove: __webpack_require__(265),
	  repeat: __webpack_require__(266),
	  replace: __webpack_require__(268),
	  reverse: __webpack_require__(90),
	  scan: __webpack_require__(269),
	  sequence: __webpack_require__(270),
	  set: __webpack_require__(271),
	  slice: __webpack_require__(89),
	  sort: __webpack_require__(272),
	  sortBy: __webpack_require__(273),
	  sortWith: __webpack_require__(274),
	  split: __webpack_require__(275),
	  splitAt: __webpack_require__(276),
	  splitEvery: __webpack_require__(277),
	  splitWhen: __webpack_require__(278),
	  subtract: __webpack_require__(279),
	  sum: __webpack_require__(221),
	  symmetricDifference: __webpack_require__(280),
	  symmetricDifferenceWith: __webpack_require__(281),
	  tail: __webpack_require__(87),
	  take: __webpack_require__(134),
	  takeLast: __webpack_require__(282),
	  takeLastWhile: __webpack_require__(283),
	  takeWhile: __webpack_require__(284),
	  tap: __webpack_require__(286),
	  test: __webpack_require__(287),
	  times: __webpack_require__(267),
	  toLower: __webpack_require__(289),
	  toPairs: __webpack_require__(290),
	  toPairsIn: __webpack_require__(291),
	  toString: __webpack_require__(96),
	  toUpper: __webpack_require__(292),
	  transduce: __webpack_require__(293),
	  transpose: __webpack_require__(294),
	  traverse: __webpack_require__(295),
	  trim: __webpack_require__(296),
	  tryCatch: __webpack_require__(297),
	  type: __webpack_require__(80),
	  unapply: __webpack_require__(298),
	  unary: __webpack_require__(299),
	  uncurryN: __webpack_require__(300),
	  unfold: __webpack_require__(301),
	  union: __webpack_require__(302),
	  unionWith: __webpack_require__(303),
	  uniq: __webpack_require__(183),
	  uniqBy: __webpack_require__(184),
	  uniqWith: __webpack_require__(187),
	  unless: __webpack_require__(304),
	  unnest: __webpack_require__(305),
	  until: __webpack_require__(306),
	  update: __webpack_require__(208),
	  useWith: __webpack_require__(255),
	  values: __webpack_require__(58),
	  valuesIn: __webpack_require__(307),
	  view: __webpack_require__(308),
	  when: __webpack_require__(309),
	  where: __webpack_require__(310),
	  whereEq: __webpack_require__(311),
	  without: __webpack_require__(312),
	  xprod: __webpack_require__(313),
	  zip: __webpack_require__(314),
	  zipObj: __webpack_require__(315),
	  zipWith: __webpack_require__(316)
	};


/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	var always = __webpack_require__(10);


	/**
	 * A function that always returns `false`. Any passed in parameters are ignored.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.9.0
	 * @category Function
	 * @sig * -> Boolean
	 * @param {*}
	 * @return {Boolean}
	 * @see R.always, R.T
	 * @example
	 *
	 *      R.F(); //=> false
	 */
	module.exports = always(false);


/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	var _curry1 = __webpack_require__(11);


	/**
	 * Returns a function that always returns the given value. Note that for
	 * non-primitives the value returned is a reference to the original value.
	 *
	 * This function is known as `const`, `constant`, or `K` (for K combinator) in
	 * other languages and libraries.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.1.0
	 * @category Function
	 * @sig a -> (* -> a)
	 * @param {*} val The value to wrap in a function
	 * @return {Function} A Function :: * -> val.
	 * @example
	 *
	 *      var t = R.always('Tee');
	 *      t(); //=> 'Tee'
	 */
	module.exports = _curry1(function always(val) {
	  return function() {
	    return val;
	  };
	});


/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	var _isPlaceholder = __webpack_require__(12);


	/**
	 * Optimized internal one-arity curry function.
	 *
	 * @private
	 * @category Function
	 * @param {Function} fn The function to curry.
	 * @return {Function} The curried function.
	 */
	module.exports = function _curry1(fn) {
	  return function f1(a) {
	    if (arguments.length === 0 || _isPlaceholder(a)) {
	      return f1;
	    } else {
	      return fn.apply(this, arguments);
	    }
	  };
	};


/***/ },
/* 12 */
/***/ function(module, exports) {

	module.exports = function _isPlaceholder(a) {
	  return a != null &&
	         typeof a === 'object' &&
	         a['@@functional/placeholder'] === true;
	};


/***/ },
/* 13 */
/***/ function(module, exports, __webpack_require__) {

	var always = __webpack_require__(10);


	/**
	 * A function that always returns `true`. Any passed in parameters are ignored.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.9.0
	 * @category Function
	 * @sig * -> Boolean
	 * @param {*}
	 * @return {Boolean}
	 * @see R.always, R.F
	 * @example
	 *
	 *      R.T(); //=> true
	 */
	module.exports = always(true);


/***/ },
/* 14 */
/***/ function(module, exports) {

	/**
	 * A special placeholder value used to specify "gaps" within curried functions,
	 * allowing partial application of any combination of arguments, regardless of
	 * their positions.
	 *
	 * If `g` is a curried ternary function and `_` is `R.__`, the following are
	 * equivalent:
	 *
	 *   - `g(1, 2, 3)`
	 *   - `g(_, 2, 3)(1)`
	 *   - `g(_, _, 3)(1)(2)`
	 *   - `g(_, _, 3)(1, 2)`
	 *   - `g(_, 2, _)(1, 3)`
	 *   - `g(_, 2)(1)(3)`
	 *   - `g(_, 2)(1, 3)`
	 *   - `g(_, 2)(_, 3)(1)`
	 *
	 * @constant
	 * @memberOf R
	 * @since v0.6.0
	 * @category Function
	 * @example
	 *
	 *      var greet = R.replace('{name}', R.__, 'Hello, {name}!');
	 *      greet('Alice'); //=> 'Hello, Alice!'
	 */
	module.exports = {'@@functional/placeholder': true};


/***/ },
/* 15 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);


	/**
	 * Adds two values.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.1.0
	 * @category Math
	 * @sig Number -> Number -> Number
	 * @param {Number} a
	 * @param {Number} b
	 * @return {Number}
	 * @see R.subtract
	 * @example
	 *
	 *      R.add(2, 3);       //=>  5
	 *      R.add(7)(10);      //=> 17
	 */
	module.exports = _curry2(function add(a, b) {
	  return Number(a) + Number(b);
	});


/***/ },
/* 16 */
/***/ function(module, exports, __webpack_require__) {

	var _curry1 = __webpack_require__(11);
	var _isPlaceholder = __webpack_require__(12);


	/**
	 * Optimized internal two-arity curry function.
	 *
	 * @private
	 * @category Function
	 * @param {Function} fn The function to curry.
	 * @return {Function} The curried function.
	 */
	module.exports = function _curry2(fn) {
	  return function f2(a, b) {
	    switch (arguments.length) {
	      case 0:
	        return f2;
	      case 1:
	        return _isPlaceholder(a) ? f2
	             : _curry1(function(_b) { return fn(a, _b); });
	      default:
	        return _isPlaceholder(a) && _isPlaceholder(b) ? f2
	             : _isPlaceholder(a) ? _curry1(function(_a) { return fn(_a, b); })
	             : _isPlaceholder(b) ? _curry1(function(_b) { return fn(a, _b); })
	             : fn(a, b);
	    }
	  };
	};


/***/ },
/* 17 */
/***/ function(module, exports, __webpack_require__) {

	var _concat = __webpack_require__(18);
	var _curry1 = __webpack_require__(11);
	var curryN = __webpack_require__(19);


	/**
	 * Creates a new list iteration function from an existing one by adding two new
	 * parameters to its callback function: the current index, and the entire list.
	 *
	 * This would turn, for instance, Ramda's simple `map` function into one that
	 * more closely resembles `Array.prototype.map`. Note that this will only work
	 * for functions in which the iteration callback function is the first
	 * parameter, and where the list is the last parameter. (This latter might be
	 * unimportant if the list parameter is not used.)
	 *
	 * @func
	 * @memberOf R
	 * @since v0.15.0
	 * @category Function
	 * @category List
	 * @sig ((a ... -> b) ... -> [a] -> *) -> (a ..., Int, [a] -> b) ... -> [a] -> *)
	 * @param {Function} fn A list iteration function that does not pass index or list to its callback
	 * @return {Function} An altered list iteration function that passes (item, index, list) to its callback
	 * @example
	 *
	 *      var mapIndexed = R.addIndex(R.map);
	 *      mapIndexed((val, idx) => idx + '-' + val, ['f', 'o', 'o', 'b', 'a', 'r']);
	 *      //=> ['0-f', '1-o', '2-o', '3-b', '4-a', '5-r']
	 */
	module.exports = _curry1(function addIndex(fn) {
	  return curryN(fn.length, function() {
	    var idx = 0;
	    var origFn = arguments[0];
	    var list = arguments[arguments.length - 1];
	    var args = Array.prototype.slice.call(arguments, 0);
	    args[0] = function() {
	      var result = origFn.apply(this, _concat(arguments, [idx, list]));
	      idx += 1;
	      return result;
	    };
	    return fn.apply(this, args);
	  });
	});


/***/ },
/* 18 */
/***/ function(module, exports) {

	/**
	 * Private `concat` function to merge two array-like objects.
	 *
	 * @private
	 * @param {Array|Arguments} [set1=[]] An array-like object.
	 * @param {Array|Arguments} [set2=[]] An array-like object.
	 * @return {Array} A new, merged array.
	 * @example
	 *
	 *      _concat([4, 5, 6], [1, 2, 3]); //=> [4, 5, 6, 1, 2, 3]
	 */
	module.exports = function _concat(set1, set2) {
	  set1 = set1 || [];
	  set2 = set2 || [];
	  var idx;
	  var len1 = set1.length;
	  var len2 = set2.length;
	  var result = [];

	  idx = 0;
	  while (idx < len1) {
	    result[result.length] = set1[idx];
	    idx += 1;
	  }
	  idx = 0;
	  while (idx < len2) {
	    result[result.length] = set2[idx];
	    idx += 1;
	  }
	  return result;
	};


/***/ },
/* 19 */
/***/ function(module, exports, __webpack_require__) {

	var _arity = __webpack_require__(20);
	var _curry1 = __webpack_require__(11);
	var _curry2 = __webpack_require__(16);
	var _curryN = __webpack_require__(21);


	/**
	 * Returns a curried equivalent of the provided function, with the specified
	 * arity. The curried function has two unusual capabilities. First, its
	 * arguments needn't be provided one at a time. If `g` is `R.curryN(3, f)`, the
	 * following are equivalent:
	 *
	 *   - `g(1)(2)(3)`
	 *   - `g(1)(2, 3)`
	 *   - `g(1, 2)(3)`
	 *   - `g(1, 2, 3)`
	 *
	 * Secondly, the special placeholder value `R.__` may be used to specify
	 * "gaps", allowing partial application of any combination of arguments,
	 * regardless of their positions. If `g` is as above and `_` is `R.__`, the
	 * following are equivalent:
	 *
	 *   - `g(1, 2, 3)`
	 *   - `g(_, 2, 3)(1)`
	 *   - `g(_, _, 3)(1)(2)`
	 *   - `g(_, _, 3)(1, 2)`
	 *   - `g(_, 2)(1)(3)`
	 *   - `g(_, 2)(1, 3)`
	 *   - `g(_, 2)(_, 3)(1)`
	 *
	 * @func
	 * @memberOf R
	 * @since v0.5.0
	 * @category Function
	 * @sig Number -> (* -> a) -> (* -> a)
	 * @param {Number} length The arity for the returned function.
	 * @param {Function} fn The function to curry.
	 * @return {Function} A new, curried function.
	 * @see R.curry
	 * @example
	 *
	 *      var sumArgs = (...args) => R.sum(args);
	 *
	 *      var curriedAddFourNumbers = R.curryN(4, sumArgs);
	 *      var f = curriedAddFourNumbers(1, 2);
	 *      var g = f(3);
	 *      g(4); //=> 10
	 */
	module.exports = _curry2(function curryN(length, fn) {
	  if (length === 1) {
	    return _curry1(fn);
	  }
	  return _arity(length, _curryN(length, [], fn));
	});


/***/ },
/* 20 */
/***/ function(module, exports) {

	module.exports = function _arity(n, fn) {
	  /* eslint-disable no-unused-vars */
	  switch (n) {
	    case 0: return function() { return fn.apply(this, arguments); };
	    case 1: return function(a0) { return fn.apply(this, arguments); };
	    case 2: return function(a0, a1) { return fn.apply(this, arguments); };
	    case 3: return function(a0, a1, a2) { return fn.apply(this, arguments); };
	    case 4: return function(a0, a1, a2, a3) { return fn.apply(this, arguments); };
	    case 5: return function(a0, a1, a2, a3, a4) { return fn.apply(this, arguments); };
	    case 6: return function(a0, a1, a2, a3, a4, a5) { return fn.apply(this, arguments); };
	    case 7: return function(a0, a1, a2, a3, a4, a5, a6) { return fn.apply(this, arguments); };
	    case 8: return function(a0, a1, a2, a3, a4, a5, a6, a7) { return fn.apply(this, arguments); };
	    case 9: return function(a0, a1, a2, a3, a4, a5, a6, a7, a8) { return fn.apply(this, arguments); };
	    case 10: return function(a0, a1, a2, a3, a4, a5, a6, a7, a8, a9) { return fn.apply(this, arguments); };
	    default: throw new Error('First argument to _arity must be a non-negative integer no greater than ten');
	  }
	};


/***/ },
/* 21 */
/***/ function(module, exports, __webpack_require__) {

	var _arity = __webpack_require__(20);
	var _isPlaceholder = __webpack_require__(12);


	/**
	 * Internal curryN function.
	 *
	 * @private
	 * @category Function
	 * @param {Number} length The arity of the curried function.
	 * @param {Array} received An array of arguments received thus far.
	 * @param {Function} fn The function to curry.
	 * @return {Function} The curried function.
	 */
	module.exports = function _curryN(length, received, fn) {
	  return function() {
	    var combined = [];
	    var argsIdx = 0;
	    var left = length;
	    var combinedIdx = 0;
	    while (combinedIdx < received.length || argsIdx < arguments.length) {
	      var result;
	      if (combinedIdx < received.length &&
	          (!_isPlaceholder(received[combinedIdx]) ||
	           argsIdx >= arguments.length)) {
	        result = received[combinedIdx];
	      } else {
	        result = arguments[argsIdx];
	        argsIdx += 1;
	      }
	      combined[combinedIdx] = result;
	      if (!_isPlaceholder(result)) {
	        left -= 1;
	      }
	      combinedIdx += 1;
	    }
	    return left <= 0 ? fn.apply(this, combined)
	                     : _arity(left, _curryN(length, combined, fn));
	  };
	};


/***/ },
/* 22 */
/***/ function(module, exports, __webpack_require__) {

	var _concat = __webpack_require__(18);
	var _curry3 = __webpack_require__(23);


	/**
	 * Applies a function to the value at the given index of an array, returning a
	 * new copy of the array with the element at the given index replaced with the
	 * result of the function application.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.14.0
	 * @category List
	 * @sig (a -> a) -> Number -> [a] -> [a]
	 * @param {Function} fn The function to apply.
	 * @param {Number} idx The index.
	 * @param {Array|Arguments} list An array-like object whose value
	 *        at the supplied index will be replaced.
	 * @return {Array} A copy of the supplied array-like object with
	 *         the element at index `idx` replaced with the value
	 *         returned by applying `fn` to the existing element.
	 * @see R.update
	 * @example
	 *
	 *      R.adjust(R.add(10), 1, [1, 2, 3]);     //=> [1, 12, 3]
	 *      R.adjust(R.add(10))(1)([1, 2, 3]);     //=> [1, 12, 3]
	 * @symb R.adjust(f, -1, [a, b]) = [a, f(b)]
	 * @symb R.adjust(f, 0, [a, b]) = [f(a), b]
	 */
	module.exports = _curry3(function adjust(fn, idx, list) {
	  if (idx >= list.length || idx < -list.length) {
	    return list;
	  }
	  var start = idx < 0 ? list.length : 0;
	  var _idx = start + idx;
	  var _list = _concat(list);
	  _list[_idx] = fn(list[_idx]);
	  return _list;
	});


/***/ },
/* 23 */
/***/ function(module, exports, __webpack_require__) {

	var _curry1 = __webpack_require__(11);
	var _curry2 = __webpack_require__(16);
	var _isPlaceholder = __webpack_require__(12);


	/**
	 * Optimized internal three-arity curry function.
	 *
	 * @private
	 * @category Function
	 * @param {Function} fn The function to curry.
	 * @return {Function} The curried function.
	 */
	module.exports = function _curry3(fn) {
	  return function f3(a, b, c) {
	    switch (arguments.length) {
	      case 0:
	        return f3;
	      case 1:
	        return _isPlaceholder(a) ? f3
	             : _curry2(function(_b, _c) { return fn(a, _b, _c); });
	      case 2:
	        return _isPlaceholder(a) && _isPlaceholder(b) ? f3
	             : _isPlaceholder(a) ? _curry2(function(_a, _c) { return fn(_a, b, _c); })
	             : _isPlaceholder(b) ? _curry2(function(_b, _c) { return fn(a, _b, _c); })
	             : _curry1(function(_c) { return fn(a, b, _c); });
	      default:
	        return _isPlaceholder(a) && _isPlaceholder(b) && _isPlaceholder(c) ? f3
	             : _isPlaceholder(a) && _isPlaceholder(b) ? _curry2(function(_a, _b) { return fn(_a, _b, c); })
	             : _isPlaceholder(a) && _isPlaceholder(c) ? _curry2(function(_a, _c) { return fn(_a, b, _c); })
	             : _isPlaceholder(b) && _isPlaceholder(c) ? _curry2(function(_b, _c) { return fn(a, _b, _c); })
	             : _isPlaceholder(a) ? _curry1(function(_a) { return fn(_a, b, c); })
	             : _isPlaceholder(b) ? _curry1(function(_b) { return fn(a, _b, c); })
	             : _isPlaceholder(c) ? _curry1(function(_c) { return fn(a, b, _c); })
	             : fn(a, b, c);
	    }
	  };
	};


/***/ },
/* 24 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);
	var _dispatchable = __webpack_require__(25);
	var _xall = __webpack_require__(28);


	/**
	 * Returns `true` if all elements of the list match the predicate, `false` if
	 * there are any that don't.
	 *
	 * Dispatches to the `all` method of the second argument, if present.
	 *
	 * Acts as a transducer if a transformer is given in list position.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.1.0
	 * @category List
	 * @sig (a -> Boolean) -> [a] -> Boolean
	 * @param {Function} fn The predicate function.
	 * @param {Array} list The array to consider.
	 * @return {Boolean} `true` if the predicate is satisfied by every element, `false`
	 *         otherwise.
	 * @see R.any, R.none, R.transduce
	 * @example
	 *
	 *      var equals3 = R.equals(3);
	 *      R.all(equals3)([3, 3, 3, 3]); //=> true
	 *      R.all(equals3)([3, 3, 1, 3]); //=> false
	 */
	module.exports = _curry2(_dispatchable(['all'], _xall, function all(fn, list) {
	  var idx = 0;
	  while (idx < list.length) {
	    if (!fn(list[idx])) {
	      return false;
	    }
	    idx += 1;
	  }
	  return true;
	}));


/***/ },
/* 25 */
/***/ function(module, exports, __webpack_require__) {

	var _isArray = __webpack_require__(26);
	var _isTransformer = __webpack_require__(27);


	/**
	 * Returns a function that dispatches with different strategies based on the
	 * object in list position (last argument). If it is an array, executes [fn].
	 * Otherwise, if it has a function with one of the given method names, it will
	 * execute that function (functor case). Otherwise, if it is a transformer,
	 * uses transducer [xf] to return a new transformer (transducer case).
	 * Otherwise, it will default to executing [fn].
	 *
	 * @private
	 * @param {Array} methodNames properties to check for a custom implementation
	 * @param {Function} xf transducer to initialize if object is transformer
	 * @param {Function} fn default ramda implementation
	 * @return {Function} A function that dispatches on object in list position
	 */
	module.exports = function _dispatchable(methodNames, xf, fn) {
	  return function() {
	    if (arguments.length === 0) {
	      return fn();
	    }
	    var args = Array.prototype.slice.call(arguments, 0);
	    var obj = args.pop();
	    if (!_isArray(obj)) {
	      var idx = 0;
	      while (idx < methodNames.length) {
	        if (typeof obj[methodNames[idx]] === 'function') {
	          return obj[methodNames[idx]].apply(obj, args);
	        }
	        idx += 1;
	      }
	      if (_isTransformer(obj)) {
	        var transducer = xf.apply(null, args);
	        return transducer(obj);
	      }
	    }
	    return fn.apply(this, arguments);
	  };
	};


/***/ },
/* 26 */
/***/ function(module, exports) {

	/**
	 * Tests whether or not an object is an array.
	 *
	 * @private
	 * @param {*} val The object to test.
	 * @return {Boolean} `true` if `val` is an array, `false` otherwise.
	 * @example
	 *
	 *      _isArray([]); //=> true
	 *      _isArray(null); //=> false
	 *      _isArray({}); //=> false
	 */
	module.exports = Array.isArray || function _isArray(val) {
	  return (val != null &&
	          val.length >= 0 &&
	          Object.prototype.toString.call(val) === '[object Array]');
	};


/***/ },
/* 27 */
/***/ function(module, exports) {

	module.exports = function _isTransformer(obj) {
	  return typeof obj['@@transducer/step'] === 'function';
	};


/***/ },
/* 28 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);
	var _reduced = __webpack_require__(29);
	var _xfBase = __webpack_require__(30);


	module.exports = (function() {
	  function XAll(f, xf) {
	    this.xf = xf;
	    this.f = f;
	    this.all = true;
	  }
	  XAll.prototype['@@transducer/init'] = _xfBase.init;
	  XAll.prototype['@@transducer/result'] = function(result) {
	    if (this.all) {
	      result = this.xf['@@transducer/step'](result, true);
	    }
	    return this.xf['@@transducer/result'](result);
	  };
	  XAll.prototype['@@transducer/step'] = function(result, input) {
	    if (!this.f(input)) {
	      this.all = false;
	      result = _reduced(this.xf['@@transducer/step'](result, false));
	    }
	    return result;
	  };

	  return _curry2(function _xall(f, xf) { return new XAll(f, xf); });
	}());


/***/ },
/* 29 */
/***/ function(module, exports) {

	module.exports = function _reduced(x) {
	  return x && x['@@transducer/reduced'] ? x :
	    {
	      '@@transducer/value': x,
	      '@@transducer/reduced': true
	    };
	};


/***/ },
/* 30 */
/***/ function(module, exports) {

	module.exports = {
	  init: function() {
	    return this.xf['@@transducer/init']();
	  },
	  result: function(result) {
	    return this.xf['@@transducer/result'](result);
	  }
	};


/***/ },
/* 31 */
/***/ function(module, exports, __webpack_require__) {

	var _curry1 = __webpack_require__(11);
	var curryN = __webpack_require__(19);
	var max = __webpack_require__(32);
	var pluck = __webpack_require__(33);
	var reduce = __webpack_require__(46);


	/**
	 * Takes a list of predicates and returns a predicate that returns true for a
	 * given list of arguments if every one of the provided predicates is satisfied
	 * by those arguments.
	 *
	 * The function returned is a curried function whose arity matches that of the
	 * highest-arity predicate.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.9.0
	 * @category Logic
	 * @sig [(*... -> Boolean)] -> (*... -> Boolean)
	 * @param {Array} predicates An array of predicates to check
	 * @return {Function} The combined predicate
	 * @see R.anyPass
	 * @example
	 *
	 *      var isQueen = R.propEq('rank', 'Q');
	 *      var isSpade = R.propEq('suit', '♠︎');
	 *      var isQueenOfSpades = R.allPass([isQueen, isSpade]);
	 *
	 *      isQueenOfSpades({rank: 'Q', suit: '♣︎'}); //=> false
	 *      isQueenOfSpades({rank: 'Q', suit: '♠︎'}); //=> true
	 */
	module.exports = _curry1(function allPass(preds) {
	  return curryN(reduce(max, 0, pluck('length', preds)), function() {
	    var idx = 0;
	    var len = preds.length;
	    while (idx < len) {
	      if (!preds[idx].apply(this, arguments)) {
	        return false;
	      }
	      idx += 1;
	    }
	    return true;
	  });
	});


/***/ },
/* 32 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);


	/**
	 * Returns the larger of its two arguments.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.1.0
	 * @category Relation
	 * @sig Ord a => a -> a -> a
	 * @param {*} a
	 * @param {*} b
	 * @return {*}
	 * @see R.maxBy, R.min
	 * @example
	 *
	 *      R.max(789, 123); //=> 789
	 *      R.max('a', 'b'); //=> 'b'
	 */
	module.exports = _curry2(function max(a, b) { return b > a ? b : a; });


/***/ },
/* 33 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);
	var map = __webpack_require__(34);
	var prop = __webpack_require__(45);


	/**
	 * Returns a new list by plucking the same named property off all objects in
	 * the list supplied.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.1.0
	 * @category List
	 * @sig k -> [{k: v}] -> [v]
	 * @param {Number|String} key The key name to pluck off of each object.
	 * @param {Array} list The array to consider.
	 * @return {Array} The list of values for the given key.
	 * @see R.props
	 * @example
	 *
	 *      R.pluck('a')([{a: 1}, {a: 2}]); //=> [1, 2]
	 *      R.pluck(0)([[1, 2], [3, 4]]);   //=> [1, 3]
	 * @symb R.pluck('x', [{x: 1, y: 2}, {x: 3, y: 4}, {x: 5, y: 6}]) = [1, 3, 5]
	 * @symb R.pluck(0, [[1, 2], [3, 4], [5, 6]]) = [1, 3, 5]
	 */
	module.exports = _curry2(function pluck(p, list) {
	  return map(prop(p), list);
	});


/***/ },
/* 34 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);
	var _dispatchable = __webpack_require__(25);
	var _map = __webpack_require__(35);
	var _reduce = __webpack_require__(36);
	var _xmap = __webpack_require__(41);
	var curryN = __webpack_require__(19);
	var keys = __webpack_require__(42);


	/**
	 * Takes a function and
	 * a [functor](https://github.com/fantasyland/fantasy-land#functor),
	 * applies the function to each of the functor's values, and returns
	 * a functor of the same shape.
	 *
	 * Ramda provides suitable `map` implementations for `Array` and `Object`,
	 * so this function may be applied to `[1, 2, 3]` or `{x: 1, y: 2, z: 3}`.
	 *
	 * Dispatches to the `map` method of the second argument, if present.
	 *
	 * Acts as a transducer if a transformer is given in list position.
	 *
	 * Also treats functions as functors and will compose them together.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.1.0
	 * @category List
	 * @sig Functor f => (a -> b) -> f a -> f b
	 * @param {Function} fn The function to be called on every element of the input `list`.
	 * @param {Array} list The list to be iterated over.
	 * @return {Array} The new list.
	 * @see R.transduce, R.addIndex
	 * @example
	 *
	 *      var double = x => x * 2;
	 *
	 *      R.map(double, [1, 2, 3]); //=> [2, 4, 6]
	 *
	 *      R.map(double, {x: 1, y: 2, z: 3}); //=> {x: 2, y: 4, z: 6}
	 * @symb R.map(f, [a, b]) = [f(a), f(b)]
	 * @symb R.map(f, { x: a, y: b }) = { x: f(a), y: f(b) }
	 * @symb R.map(f, functor_o) = functor_o.map(f)
	 */
	module.exports = _curry2(_dispatchable(['map'], _xmap, function map(fn, functor) {
	  switch (Object.prototype.toString.call(functor)) {
	    case '[object Function]':
	      return curryN(functor.length, function() {
	        return fn.call(this, functor.apply(this, arguments));
	      });
	    case '[object Object]':
	      return _reduce(function(acc, key) {
	        acc[key] = fn(functor[key]);
	        return acc;
	      }, {}, keys(functor));
	    default:
	      return _map(fn, functor);
	  }
	}));


/***/ },
/* 35 */
/***/ function(module, exports) {

	module.exports = function _map(fn, functor) {
	  var idx = 0;
	  var len = functor.length;
	  var result = Array(len);
	  while (idx < len) {
	    result[idx] = fn(functor[idx]);
	    idx += 1;
	  }
	  return result;
	};


/***/ },
/* 36 */
/***/ function(module, exports, __webpack_require__) {

	var _xwrap = __webpack_require__(37);
	var bind = __webpack_require__(38);
	var isArrayLike = __webpack_require__(39);


	module.exports = (function() {
	  function _arrayReduce(xf, acc, list) {
	    var idx = 0;
	    var len = list.length;
	    while (idx < len) {
	      acc = xf['@@transducer/step'](acc, list[idx]);
	      if (acc && acc['@@transducer/reduced']) {
	        acc = acc['@@transducer/value'];
	        break;
	      }
	      idx += 1;
	    }
	    return xf['@@transducer/result'](acc);
	  }

	  function _iterableReduce(xf, acc, iter) {
	    var step = iter.next();
	    while (!step.done) {
	      acc = xf['@@transducer/step'](acc, step.value);
	      if (acc && acc['@@transducer/reduced']) {
	        acc = acc['@@transducer/value'];
	        break;
	      }
	      step = iter.next();
	    }
	    return xf['@@transducer/result'](acc);
	  }

	  function _methodReduce(xf, acc, obj) {
	    return xf['@@transducer/result'](obj.reduce(bind(xf['@@transducer/step'], xf), acc));
	  }

	  var symIterator = (typeof Symbol !== 'undefined') ? Symbol.iterator : '@@iterator';
	  return function _reduce(fn, acc, list) {
	    if (typeof fn === 'function') {
	      fn = _xwrap(fn);
	    }
	    if (isArrayLike(list)) {
	      return _arrayReduce(fn, acc, list);
	    }
	    if (typeof list.reduce === 'function') {
	      return _methodReduce(fn, acc, list);
	    }
	    if (list[symIterator] != null) {
	      return _iterableReduce(fn, acc, list[symIterator]());
	    }
	    if (typeof list.next === 'function') {
	      return _iterableReduce(fn, acc, list);
	    }
	    throw new TypeError('reduce: list must be array or iterable');
	  };
	}());


/***/ },
/* 37 */
/***/ function(module, exports) {

	module.exports = (function() {
	  function XWrap(fn) {
	    this.f = fn;
	  }
	  XWrap.prototype['@@transducer/init'] = function() {
	    throw new Error('init not implemented on XWrap');
	  };
	  XWrap.prototype['@@transducer/result'] = function(acc) { return acc; };
	  XWrap.prototype['@@transducer/step'] = function(acc, x) {
	    return this.f(acc, x);
	  };

	  return function _xwrap(fn) { return new XWrap(fn); };
	}());


/***/ },
/* 38 */
/***/ function(module, exports, __webpack_require__) {

	var _arity = __webpack_require__(20);
	var _curry2 = __webpack_require__(16);


	/**
	 * Creates a function that is bound to a context.
	 * Note: `R.bind` does not provide the additional argument-binding capabilities of
	 * [Function.prototype.bind](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind).
	 *
	 * @func
	 * @memberOf R
	 * @since v0.6.0
	 * @category Function
	 * @category Object
	 * @sig (* -> *) -> {*} -> (* -> *)
	 * @param {Function} fn The function to bind to context
	 * @param {Object} thisObj The context to bind `fn` to
	 * @return {Function} A function that will execute in the context of `thisObj`.
	 * @see R.partial
	 * @example
	 *
	 *      var log = R.bind(console.log, console);
	 *      R.pipe(R.assoc('a', 2), R.tap(log), R.assoc('a', 3))({a: 1}); //=> {a: 3}
	 *      // logs {a: 2}
	 * @symb R.bind(f, o)(a, b) = f.call(o, a, b)
	 */
	module.exports = _curry2(function bind(fn, thisObj) {
	  return _arity(fn.length, function() {
	    return fn.apply(thisObj, arguments);
	  });
	});


/***/ },
/* 39 */
/***/ function(module, exports, __webpack_require__) {

	var _curry1 = __webpack_require__(11);
	var _isArray = __webpack_require__(26);
	var _isString = __webpack_require__(40);


	/**
	 * Tests whether or not an object is similar to an array.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.5.0
	 * @category Type
	 * @category List
	 * @sig * -> Boolean
	 * @param {*} x The object to test.
	 * @return {Boolean} `true` if `x` has a numeric length property and extreme indices defined; `false` otherwise.
	 * @deprecated since v0.23.0
	 * @example
	 *
	 *      R.isArrayLike([]); //=> true
	 *      R.isArrayLike(true); //=> false
	 *      R.isArrayLike({}); //=> false
	 *      R.isArrayLike({length: 10}); //=> false
	 *      R.isArrayLike({0: 'zero', 9: 'nine', length: 10}); //=> true
	 */
	module.exports = _curry1(function isArrayLike(x) {
	  if (_isArray(x)) { return true; }
	  if (!x) { return false; }
	  if (typeof x !== 'object') { return false; }
	  if (_isString(x)) { return false; }
	  if (x.nodeType === 1) { return !!x.length; }
	  if (x.length === 0) { return true; }
	  if (x.length > 0) {
	    return x.hasOwnProperty(0) && x.hasOwnProperty(x.length - 1);
	  }
	  return false;
	});


/***/ },
/* 40 */
/***/ function(module, exports) {

	module.exports = function _isString(x) {
	  return Object.prototype.toString.call(x) === '[object String]';
	};


/***/ },
/* 41 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);
	var _xfBase = __webpack_require__(30);


	module.exports = (function() {
	  function XMap(f, xf) {
	    this.xf = xf;
	    this.f = f;
	  }
	  XMap.prototype['@@transducer/init'] = _xfBase.init;
	  XMap.prototype['@@transducer/result'] = _xfBase.result;
	  XMap.prototype['@@transducer/step'] = function(result, input) {
	    return this.xf['@@transducer/step'](result, this.f(input));
	  };

	  return _curry2(function _xmap(f, xf) { return new XMap(f, xf); });
	}());


/***/ },
/* 42 */
/***/ function(module, exports, __webpack_require__) {

	var _curry1 = __webpack_require__(11);
	var _has = __webpack_require__(43);
	var _isArguments = __webpack_require__(44);


	/**
	 * Returns a list containing the names of all the enumerable own properties of
	 * the supplied object.
	 * Note that the order of the output array is not guaranteed to be consistent
	 * across different JS platforms.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.1.0
	 * @category Object
	 * @sig {k: v} -> [k]
	 * @param {Object} obj The object to extract properties from
	 * @return {Array} An array of the object's own properties.
	 * @example
	 *
	 *      R.keys({a: 1, b: 2, c: 3}); //=> ['a', 'b', 'c']
	 */
	module.exports = (function() {
	  // cover IE < 9 keys issues
	  var hasEnumBug = !({toString: null}).propertyIsEnumerable('toString');
	  var nonEnumerableProps = ['constructor', 'valueOf', 'isPrototypeOf', 'toString',
	                            'propertyIsEnumerable', 'hasOwnProperty', 'toLocaleString'];
	  // Safari bug
	  var hasArgsEnumBug = (function() {
	    'use strict';
	    return arguments.propertyIsEnumerable('length');
	  }());

	  var contains = function contains(list, item) {
	    var idx = 0;
	    while (idx < list.length) {
	      if (list[idx] === item) {
	        return true;
	      }
	      idx += 1;
	    }
	    return false;
	  };

	  return typeof Object.keys === 'function' && !hasArgsEnumBug ?
	    _curry1(function keys(obj) {
	      return Object(obj) !== obj ? [] : Object.keys(obj);
	    }) :
	    _curry1(function keys(obj) {
	      if (Object(obj) !== obj) {
	        return [];
	      }
	      var prop, nIdx;
	      var ks = [];
	      var checkArgsLength = hasArgsEnumBug && _isArguments(obj);
	      for (prop in obj) {
	        if (_has(prop, obj) && (!checkArgsLength || prop !== 'length')) {
	          ks[ks.length] = prop;
	        }
	      }
	      if (hasEnumBug) {
	        nIdx = nonEnumerableProps.length - 1;
	        while (nIdx >= 0) {
	          prop = nonEnumerableProps[nIdx];
	          if (_has(prop, obj) && !contains(ks, prop)) {
	            ks[ks.length] = prop;
	          }
	          nIdx -= 1;
	        }
	      }
	      return ks;
	    });
	}());


/***/ },
/* 43 */
/***/ function(module, exports) {

	module.exports = function _has(prop, obj) {
	  return Object.prototype.hasOwnProperty.call(obj, prop);
	};


/***/ },
/* 44 */
/***/ function(module, exports, __webpack_require__) {

	var _has = __webpack_require__(43);


	module.exports = (function() {
	  var toString = Object.prototype.toString;
	  return toString.call(arguments) === '[object Arguments]' ?
	    function _isArguments(x) { return toString.call(x) === '[object Arguments]'; } :
	    function _isArguments(x) { return _has('callee', x); };
	}());


/***/ },
/* 45 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);


	/**
	 * Returns a function that when supplied an object returns the indicated
	 * property of that object, if it exists.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.1.0
	 * @category Object
	 * @sig s -> {s: a} -> a | Undefined
	 * @param {String} p The property name
	 * @param {Object} obj The object to query
	 * @return {*} The value at `obj.p`.
	 * @see R.path
	 * @example
	 *
	 *      R.prop('x', {x: 100}); //=> 100
	 *      R.prop('x', {}); //=> undefined
	 */
	module.exports = _curry2(function prop(p, obj) { return obj[p]; });


/***/ },
/* 46 */
/***/ function(module, exports, __webpack_require__) {

	var _curry3 = __webpack_require__(23);
	var _reduce = __webpack_require__(36);


	/**
	 * Returns a single item by iterating through the list, successively calling
	 * the iterator function and passing it an accumulator value and the current
	 * value from the array, and then passing the result to the next call.
	 *
	 * The iterator function receives two values: *(acc, value)*. It may use
	 * `R.reduced` to shortcut the iteration.
	 *
	 * The arguments' order of `reduceRight`'s iterator function is *(value, acc)*.
	 *
	 * Note: `R.reduce` does not skip deleted or unassigned indices (sparse
	 * arrays), unlike the native `Array.prototype.reduce` method. For more details
	 * on this behavior, see:
	 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce#Description
	 *
	 * Dispatches to the `reduce` method of the third argument, if present.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.1.0
	 * @category List
	 * @sig ((a, b) -> a) -> a -> [b] -> a
	 * @param {Function} fn The iterator function. Receives two values, the accumulator and the
	 *        current element from the array.
	 * @param {*} acc The accumulator value.
	 * @param {Array} list The list to iterate over.
	 * @return {*} The final, accumulated value.
	 * @see R.reduced, R.addIndex, R.reduceRight
	 * @example
	 *
	 *      R.reduce(R.subtract, 0, [1, 2, 3, 4]) // => ((((0 - 1) - 2) - 3) - 4) = -10
	 *                -               -10
	 *               / \              / \
	 *              -   4           -6   4
	 *             / \              / \
	 *            -   3   ==>     -3   3
	 *           / \              / \
	 *          -   2           -1   2
	 *         / \              / \
	 *        0   1            0   1
	 *
	 * @symb R.reduce(f, a, [b, c, d]) = f(f(f(a, b), c), d)
	 */
	module.exports = _curry3(_reduce);


/***/ },
/* 47 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);


	/**
	 * Returns `true` if both arguments are `true`; `false` otherwise.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.1.0
	 * @category Logic
	 * @sig a -> b -> a | b
	 * @param {Any} a
	 * @param {Any} b
	 * @return {Any} the first argument if it is falsy, otherwise the second argument.
	 * @see R.both
	 * @example
	 *
	 *      R.and(true, true); //=> true
	 *      R.and(true, false); //=> false
	 *      R.and(false, true); //=> false
	 *      R.and(false, false); //=> false
	 */
	module.exports = _curry2(function and(a, b) {
	  return a && b;
	});


/***/ },
/* 48 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);
	var _dispatchable = __webpack_require__(25);
	var _xany = __webpack_require__(49);


	/**
	 * Returns `true` if at least one of elements of the list match the predicate,
	 * `false` otherwise.
	 *
	 * Dispatches to the `any` method of the second argument, if present.
	 *
	 * Acts as a transducer if a transformer is given in list position.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.1.0
	 * @category List
	 * @sig (a -> Boolean) -> [a] -> Boolean
	 * @param {Function} fn The predicate function.
	 * @param {Array} list The array to consider.
	 * @return {Boolean} `true` if the predicate is satisfied by at least one element, `false`
	 *         otherwise.
	 * @see R.all, R.none, R.transduce
	 * @example
	 *
	 *      var lessThan0 = R.flip(R.lt)(0);
	 *      var lessThan2 = R.flip(R.lt)(2);
	 *      R.any(lessThan0)([1, 2]); //=> false
	 *      R.any(lessThan2)([1, 2]); //=> true
	 */
	module.exports = _curry2(_dispatchable(['any'], _xany, function any(fn, list) {
	  var idx = 0;
	  while (idx < list.length) {
	    if (fn(list[idx])) {
	      return true;
	    }
	    idx += 1;
	  }
	  return false;
	}));


/***/ },
/* 49 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);
	var _reduced = __webpack_require__(29);
	var _xfBase = __webpack_require__(30);


	module.exports = (function() {
	  function XAny(f, xf) {
	    this.xf = xf;
	    this.f = f;
	    this.any = false;
	  }
	  XAny.prototype['@@transducer/init'] = _xfBase.init;
	  XAny.prototype['@@transducer/result'] = function(result) {
	    if (!this.any) {
	      result = this.xf['@@transducer/step'](result, false);
	    }
	    return this.xf['@@transducer/result'](result);
	  };
	  XAny.prototype['@@transducer/step'] = function(result, input) {
	    if (this.f(input)) {
	      this.any = true;
	      result = _reduced(this.xf['@@transducer/step'](result, true));
	    }
	    return result;
	  };

	  return _curry2(function _xany(f, xf) { return new XAny(f, xf); });
	}());


/***/ },
/* 50 */
/***/ function(module, exports, __webpack_require__) {

	var _curry1 = __webpack_require__(11);
	var curryN = __webpack_require__(19);
	var max = __webpack_require__(32);
	var pluck = __webpack_require__(33);
	var reduce = __webpack_require__(46);


	/**
	 * Takes a list of predicates and returns a predicate that returns true for a
	 * given list of arguments if at least one of the provided predicates is
	 * satisfied by those arguments.
	 *
	 * The function returned is a curried function whose arity matches that of the
	 * highest-arity predicate.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.9.0
	 * @category Logic
	 * @sig [(*... -> Boolean)] -> (*... -> Boolean)
	 * @param {Array} predicates An array of predicates to check
	 * @return {Function} The combined predicate
	 * @see R.allPass
	 * @example
	 *
	 *      var isClub = R.propEq('suit', '♣');
	 *      var isSpade = R.propEq('suit', '♠');
	 *      var isBlackCard = R.anyPass([isClub, isSpade]);
	 *
	 *      isBlackCard({rank: '10', suit: '♣'}); //=> true
	 *      isBlackCard({rank: 'Q', suit: '♠'}); //=> true
	 *      isBlackCard({rank: 'Q', suit: '♦'}); //=> false
	 */
	module.exports = _curry1(function anyPass(preds) {
	  return curryN(reduce(max, 0, pluck('length', preds)), function() {
	    var idx = 0;
	    var len = preds.length;
	    while (idx < len) {
	      if (preds[idx].apply(this, arguments)) {
	        return true;
	      }
	      idx += 1;
	    }
	    return false;
	  });
	});


/***/ },
/* 51 */
/***/ function(module, exports, __webpack_require__) {

	var _concat = __webpack_require__(18);
	var _curry2 = __webpack_require__(16);
	var _reduce = __webpack_require__(36);
	var map = __webpack_require__(34);


	/**
	 * ap applies a list of functions to a list of values.
	 *
	 * Dispatches to the `ap` method of the second argument, if present. Also
	 * treats curried functions as applicatives.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.3.0
	 * @category Function
	 * @sig [a -> b] -> [a] -> [b]
	 * @sig Apply f => f (a -> b) -> f a -> f b
	 * @param {Array} fns An array of functions
	 * @param {Array} vs An array of values
	 * @return {Array} An array of results of applying each of `fns` to all of `vs` in turn.
	 * @example
	 *
	 *      R.ap([R.multiply(2), R.add(3)], [1,2,3]); //=> [2, 4, 6, 4, 5, 6]
	 *      R.ap([R.concat('tasty '), R.toUpper], ['pizza', 'salad']); //=> ["tasty pizza", "tasty salad", "PIZZA", "SALAD"]
	 * @symb R.ap([f, g], [a, b]) = [f(a), f(b), g(a), g(b)]
	 */
	module.exports = _curry2(function ap(applicative, fn) {
	  return (
	    typeof applicative.ap === 'function' ?
	      applicative.ap(fn) :
	    typeof applicative === 'function' ?
	      function(x) { return applicative(x)(fn(x)); } :
	    // else
	      _reduce(function(acc, f) { return _concat(acc, map(f, fn)); }, [], applicative)
	  );
	});


/***/ },
/* 52 */
/***/ function(module, exports, __webpack_require__) {

	var _aperture = __webpack_require__(53);
	var _curry2 = __webpack_require__(16);
	var _dispatchable = __webpack_require__(25);
	var _xaperture = __webpack_require__(54);


	/**
	 * Returns a new list, composed of n-tuples of consecutive elements If `n` is
	 * greater than the length of the list, an empty list is returned.
	 *
	 * Acts as a transducer if a transformer is given in list position.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.12.0
	 * @category List
	 * @sig Number -> [a] -> [[a]]
	 * @param {Number} n The size of the tuples to create
	 * @param {Array} list The list to split into `n`-length tuples
	 * @return {Array} The resulting list of `n`-length tuples
	 * @see R.transduce
	 * @example
	 *
	 *      R.aperture(2, [1, 2, 3, 4, 5]); //=> [[1, 2], [2, 3], [3, 4], [4, 5]]
	 *      R.aperture(3, [1, 2, 3, 4, 5]); //=> [[1, 2, 3], [2, 3, 4], [3, 4, 5]]
	 *      R.aperture(7, [1, 2, 3, 4, 5]); //=> []
	 */
	module.exports = _curry2(_dispatchable([], _xaperture, _aperture));


/***/ },
/* 53 */
/***/ function(module, exports) {

	module.exports = function _aperture(n, list) {
	  var idx = 0;
	  var limit = list.length - (n - 1);
	  var acc = new Array(limit >= 0 ? limit : 0);
	  while (idx < limit) {
	    acc[idx] = Array.prototype.slice.call(list, idx, idx + n);
	    idx += 1;
	  }
	  return acc;
	};


/***/ },
/* 54 */
/***/ function(module, exports, __webpack_require__) {

	var _concat = __webpack_require__(18);
	var _curry2 = __webpack_require__(16);
	var _xfBase = __webpack_require__(30);


	module.exports = (function() {
	  function XAperture(n, xf) {
	    this.xf = xf;
	    this.pos = 0;
	    this.full = false;
	    this.acc = new Array(n);
	  }
	  XAperture.prototype['@@transducer/init'] = _xfBase.init;
	  XAperture.prototype['@@transducer/result'] = function(result) {
	    this.acc = null;
	    return this.xf['@@transducer/result'](result);
	  };
	  XAperture.prototype['@@transducer/step'] = function(result, input) {
	    this.store(input);
	    return this.full ? this.xf['@@transducer/step'](result, this.getCopy()) : result;
	  };
	  XAperture.prototype.store = function(input) {
	    this.acc[this.pos] = input;
	    this.pos += 1;
	    if (this.pos === this.acc.length) {
	      this.pos = 0;
	      this.full = true;
	    }
	  };
	  XAperture.prototype.getCopy = function() {
	    return _concat(Array.prototype.slice.call(this.acc, this.pos),
	                   Array.prototype.slice.call(this.acc, 0, this.pos));
	  };

	  return _curry2(function _xaperture(n, xf) { return new XAperture(n, xf); });
	}());


/***/ },
/* 55 */
/***/ function(module, exports, __webpack_require__) {

	var _concat = __webpack_require__(18);
	var _curry2 = __webpack_require__(16);


	/**
	 * Returns a new list containing the contents of the given list, followed by
	 * the given element.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.1.0
	 * @category List
	 * @sig a -> [a] -> [a]
	 * @param {*} el The element to add to the end of the new list.
	 * @param {Array} list The list of elements to add a new item to.
	 *        list.
	 * @return {Array} A new list containing the elements of the old list followed by `el`.
	 * @see R.prepend
	 * @example
	 *
	 *      R.append('tests', ['write', 'more']); //=> ['write', 'more', 'tests']
	 *      R.append('tests', []); //=> ['tests']
	 *      R.append(['tests'], ['write', 'more']); //=> ['write', 'more', ['tests']]
	 */
	module.exports = _curry2(function append(el, list) {
	  return _concat(list, [el]);
	});


/***/ },
/* 56 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);


	/**
	 * Applies function `fn` to the argument list `args`. This is useful for
	 * creating a fixed-arity function from a variadic function. `fn` should be a
	 * bound function if context is significant.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.7.0
	 * @category Function
	 * @sig (*... -> a) -> [*] -> a
	 * @param {Function} fn The function which will be called with `args`
	 * @param {Array} args The arguments to call `fn` with
	 * @return {*} result The result, equivalent to `fn(...args)`
	 * @see R.call, R.unapply
	 * @example
	 *
	 *      var nums = [1, 2, 3, -99, 42, 6, 7];
	 *      R.apply(Math.max, nums); //=> 42
	 * @symb R.apply(f, [a, b, c]) = f(a, b, c)
	 */
	module.exports = _curry2(function apply(fn, args) {
	  return fn.apply(this, args);
	});


/***/ },
/* 57 */
/***/ function(module, exports, __webpack_require__) {

	var _curry1 = __webpack_require__(11);
	var apply = __webpack_require__(56);
	var curryN = __webpack_require__(19);
	var map = __webpack_require__(34);
	var max = __webpack_require__(32);
	var pluck = __webpack_require__(33);
	var reduce = __webpack_require__(46);
	var values = __webpack_require__(58);


	/**
	 * Given a spec object recursively mapping properties to functions, creates a
	 * function producing an object of the same structure, by mapping each property
	 * to the result of calling its associated function with the supplied arguments.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.20.0
	 * @category Function
	 * @sig {k: ((a, b, ..., m) -> v)} -> ((a, b, ..., m) -> {k: v})
	 * @param {Object} spec an object recursively mapping properties to functions for
	 *        producing the values for these properties.
	 * @return {Function} A function that returns an object of the same structure
	 * as `spec', with each property set to the value returned by calling its
	 * associated function with the supplied arguments.
	 * @see R.converge, R.juxt
	 * @example
	 *
	 *      var getMetrics = R.applySpec({
	 *                                      sum: R.add,
	 *                                      nested: { mul: R.multiply }
	 *                                   });
	 *      getMetrics(2, 4); // => { sum: 6, nested: { mul: 8 } }
	 * @symb R.applySpec({ x: f, y: { z: g } })(a, b) = { x: f(a, b), y: { z: g(a, b) } }
	 */
	module.exports = _curry1(function applySpec(spec) {
	  spec = map(function(v) { return typeof v == 'function' ? v : applySpec(v); },
	             spec);
	  return curryN(reduce(max, 0, pluck('length', values(spec))),
	                function() {
	                  var args = arguments;
	                  return map(function(f) { return apply(f, args); }, spec);
	                });
	});


/***/ },
/* 58 */
/***/ function(module, exports, __webpack_require__) {

	var _curry1 = __webpack_require__(11);
	var keys = __webpack_require__(42);


	/**
	 * Returns a list of all the enumerable own properties of the supplied object.
	 * Note that the order of the output array is not guaranteed across different
	 * JS platforms.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.1.0
	 * @category Object
	 * @sig {k: v} -> [v]
	 * @param {Object} obj The object to extract values from
	 * @return {Array} An array of the values of the object's own properties.
	 * @example
	 *
	 *      R.values({a: 1, b: 2, c: 3}); //=> [1, 2, 3]
	 */
	module.exports = _curry1(function values(obj) {
	  var props = keys(obj);
	  var len = props.length;
	  var vals = [];
	  var idx = 0;
	  while (idx < len) {
	    vals[idx] = obj[props[idx]];
	    idx += 1;
	  }
	  return vals;
	});


/***/ },
/* 59 */
/***/ function(module, exports, __webpack_require__) {

	var _curry3 = __webpack_require__(23);


	/**
	 * Makes an ascending comparator function out of a function that returns a value
	 * that can be compared with `<` and `>`.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.23.0
	 * @category Function
	 * @sig Ord b => (a -> b) -> a -> a -> Number
	 * @param {Function} fn A function of arity one that returns a value that can be compared
	 * @param {*} a The first item to be compared.
	 * @param {*} b The second item to be compared.
	 * @return {Number} `-1` if fn(a) < fn(b), `1` if fn(b) < fn(a), otherwise `0`
	 * @example
	 *
	 *      var byAge = R.ascend(R.prop('age'));
	 *      var people = [
	 *        // ...
	 *      ];
	 *      var peopleByYoungestFirst = R.sort(byAge, people);
	 */
	module.exports = _curry3(function ascend(fn, a, b) {
	  var aa = fn(a);
	  var bb = fn(b);
	  return aa < bb ? -1 : aa > bb ? 1 : 0;
	});


/***/ },
/* 60 */
/***/ function(module, exports, __webpack_require__) {

	var _curry3 = __webpack_require__(23);


	/**
	 * Makes a shallow clone of an object, setting or overriding the specified
	 * property with the given value. Note that this copies and flattens prototype
	 * properties onto the new object as well. All non-primitive properties are
	 * copied by reference.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.8.0
	 * @category Object
	 * @sig String -> a -> {k: v} -> {k: v}
	 * @param {String} prop The property name to set
	 * @param {*} val The new value
	 * @param {Object} obj The object to clone
	 * @return {Object} A new object equivalent to the original except for the changed property.
	 * @see R.dissoc
	 * @example
	 *
	 *      R.assoc('c', 3, {a: 1, b: 2}); //=> {a: 1, b: 2, c: 3}
	 */
	module.exports = _curry3(function assoc(prop, val, obj) {
	  var result = {};
	  for (var p in obj) {
	    result[p] = obj[p];
	  }
	  result[prop] = val;
	  return result;
	});


/***/ },
/* 61 */
/***/ function(module, exports, __webpack_require__) {

	var _curry3 = __webpack_require__(23);
	var _has = __webpack_require__(43);
	var _isArray = __webpack_require__(26);
	var _isInteger = __webpack_require__(62);
	var assoc = __webpack_require__(60);


	/**
	 * Makes a shallow clone of an object, setting or overriding the nodes required
	 * to create the given path, and placing the specific value at the tail end of
	 * that path. Note that this copies and flattens prototype properties onto the
	 * new object as well. All non-primitive properties are copied by reference.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.8.0
	 * @category Object
	 * @typedefn Idx = String | Int
	 * @sig [Idx] -> a -> {a} -> {a}
	 * @param {Array} path the path to set
	 * @param {*} val The new value
	 * @param {Object} obj The object to clone
	 * @return {Object} A new object equivalent to the original except along the specified path.
	 * @see R.dissocPath
	 * @example
	 *
	 *      R.assocPath(['a', 'b', 'c'], 42, {a: {b: {c: 0}}}); //=> {a: {b: {c: 42}}}
	 *
	 *      // Any missing or non-object keys in path will be overridden
	 *      R.assocPath(['a', 'b', 'c'], 42, {a: 5}); //=> {a: {b: {c: 42}}}
	 */
	module.exports = _curry3(function assocPath(path, val, obj) {
	  if (path.length === 0) {
	    return val;
	  }
	  var idx = path[0];
	  if (path.length > 1) {
	    var nextObj = _has(idx, obj) ? obj[idx] : _isInteger(path[1]) ? [] : {};
	    val = assocPath(Array.prototype.slice.call(path, 1), val, nextObj);
	  }
	  if (_isInteger(idx) && _isArray(obj)) {
	    var arr = [].concat(obj);
	    arr[idx] = val;
	    return arr;
	  } else {
	    return assoc(idx, val, obj);
	  }
	});


/***/ },
/* 62 */
/***/ function(module, exports) {

	/**
	 * Determine if the passed argument is an integer.
	 *
	 * @private
	 * @param {*} n
	 * @category Type
	 * @return {Boolean}
	 */
	module.exports = Number.isInteger || function _isInteger(n) {
	  return (n << 0) === n;
	};


/***/ },
/* 63 */
/***/ function(module, exports, __webpack_require__) {

	var _curry1 = __webpack_require__(11);
	var nAry = __webpack_require__(64);


	/**
	 * Wraps a function of any arity (including nullary) in a function that accepts
	 * exactly 2 parameters. Any extraneous parameters will not be passed to the
	 * supplied function.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.2.0
	 * @category Function
	 * @sig (* -> c) -> (a, b -> c)
	 * @param {Function} fn The function to wrap.
	 * @return {Function} A new function wrapping `fn`. The new function is guaranteed to be of
	 *         arity 2.
	 * @example
	 *
	 *      var takesThreeArgs = function(a, b, c) {
	 *        return [a, b, c];
	 *      };
	 *      takesThreeArgs.length; //=> 3
	 *      takesThreeArgs(1, 2, 3); //=> [1, 2, 3]
	 *
	 *      var takesTwoArgs = R.binary(takesThreeArgs);
	 *      takesTwoArgs.length; //=> 2
	 *      // Only 2 arguments are passed to the wrapped function
	 *      takesTwoArgs(1, 2, 3); //=> [1, 2, undefined]
	 * @symb R.binary(f)(a, b, c) = f(a, b)
	 */
	module.exports = _curry1(function binary(fn) {
	  return nAry(2, fn);
	});


/***/ },
/* 64 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);


	/**
	 * Wraps a function of any arity (including nullary) in a function that accepts
	 * exactly `n` parameters. Any extraneous parameters will not be passed to the
	 * supplied function.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.1.0
	 * @category Function
	 * @sig Number -> (* -> a) -> (* -> a)
	 * @param {Number} n The desired arity of the new function.
	 * @param {Function} fn The function to wrap.
	 * @return {Function} A new function wrapping `fn`. The new function is guaranteed to be of
	 *         arity `n`.
	 * @example
	 *
	 *      var takesTwoArgs = (a, b) => [a, b];
	 *
	 *      takesTwoArgs.length; //=> 2
	 *      takesTwoArgs(1, 2); //=> [1, 2]
	 *
	 *      var takesOneArg = R.nAry(1, takesTwoArgs);
	 *      takesOneArg.length; //=> 1
	 *      // Only `n` arguments are passed to the wrapped function
	 *      takesOneArg(1, 2); //=> [1, undefined]
	 * @symb R.nAry(0, f)(a, b) = f()
	 * @symb R.nAry(1, f)(a, b) = f(a)
	 * @symb R.nAry(2, f)(a, b) = f(a, b)
	 */
	module.exports = _curry2(function nAry(n, fn) {
	  switch (n) {
	    case 0: return function() {return fn.call(this);};
	    case 1: return function(a0) {return fn.call(this, a0);};
	    case 2: return function(a0, a1) {return fn.call(this, a0, a1);};
	    case 3: return function(a0, a1, a2) {return fn.call(this, a0, a1, a2);};
	    case 4: return function(a0, a1, a2, a3) {return fn.call(this, a0, a1, a2, a3);};
	    case 5: return function(a0, a1, a2, a3, a4) {return fn.call(this, a0, a1, a2, a3, a4);};
	    case 6: return function(a0, a1, a2, a3, a4, a5) {return fn.call(this, a0, a1, a2, a3, a4, a5);};
	    case 7: return function(a0, a1, a2, a3, a4, a5, a6) {return fn.call(this, a0, a1, a2, a3, a4, a5, a6);};
	    case 8: return function(a0, a1, a2, a3, a4, a5, a6, a7) {return fn.call(this, a0, a1, a2, a3, a4, a5, a6, a7);};
	    case 9: return function(a0, a1, a2, a3, a4, a5, a6, a7, a8) {return fn.call(this, a0, a1, a2, a3, a4, a5, a6, a7, a8);};
	    case 10: return function(a0, a1, a2, a3, a4, a5, a6, a7, a8, a9) {return fn.call(this, a0, a1, a2, a3, a4, a5, a6, a7, a8, a9);};
	    default: throw new Error('First argument to nAry must be a non-negative integer no greater than ten');
	  }
	});


/***/ },
/* 65 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);
	var _isFunction = __webpack_require__(66);
	var and = __webpack_require__(47);
	var lift = __webpack_require__(67);


	/**
	 * A function which calls the two provided functions and returns the `&&`
	 * of the results.
	 * It returns the result of the first function if it is false-y and the result
	 * of the second function otherwise. Note that this is short-circuited,
	 * meaning that the second function will not be invoked if the first returns a
	 * false-y value.
	 *
	 * In addition to functions, `R.both` also accepts any fantasy-land compatible
	 * applicative functor.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.12.0
	 * @category Logic
	 * @sig (*... -> Boolean) -> (*... -> Boolean) -> (*... -> Boolean)
	 * @param {Function} f A predicate
	 * @param {Function} g Another predicate
	 * @return {Function} a function that applies its arguments to `f` and `g` and `&&`s their outputs together.
	 * @see R.and
	 * @example
	 *
	 *      var gt10 = R.gt(R.__, 10)
	 *      var lt20 = R.lt(R.__, 20)
	 *      var f = R.both(gt10, lt20);
	 *      f(15); //=> true
	 *      f(30); //=> false
	 */
	module.exports = _curry2(function both(f, g) {
	  return _isFunction(f) ?
	    function _both() {
	      return f.apply(this, arguments) && g.apply(this, arguments);
	    } :
	    lift(and)(f, g);
	});


/***/ },
/* 66 */
/***/ function(module, exports) {

	module.exports = function _isFunction(x) {
	  return Object.prototype.toString.call(x) === '[object Function]';
	};


/***/ },
/* 67 */
/***/ function(module, exports, __webpack_require__) {

	var _curry1 = __webpack_require__(11);
	var liftN = __webpack_require__(68);


	/**
	 * "lifts" a function of arity > 1 so that it may "map over" a list, Function or other
	 * object that satisfies the [FantasyLand Apply spec](https://github.com/fantasyland/fantasy-land#apply).
	 *
	 * @func
	 * @memberOf R
	 * @since v0.7.0
	 * @category Function
	 * @sig (*... -> *) -> ([*]... -> [*])
	 * @param {Function} fn The function to lift into higher context
	 * @return {Function} The lifted function.
	 * @see R.liftN
	 * @example
	 *
	 *      var madd3 = R.lift((a, b, c) => a + b + c);
	 *
	 *      madd3([1,2,3], [1,2,3], [1]); //=> [3, 4, 5, 4, 5, 6, 5, 6, 7]
	 *
	 *      var madd5 = R.lift((a, b, c, d, e) => a + b + c + d + e);
	 *
	 *      madd5([1,2], [3], [4, 5], [6], [7, 8]); //=> [21, 22, 22, 23, 22, 23, 23, 24]
	 */
	module.exports = _curry1(function lift(fn) {
	  return liftN(fn.length, fn);
	});


/***/ },
/* 68 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);
	var _reduce = __webpack_require__(36);
	var ap = __webpack_require__(51);
	var curryN = __webpack_require__(19);
	var map = __webpack_require__(34);


	/**
	 * "lifts" a function to be the specified arity, so that it may "map over" that
	 * many lists, Functions or other objects that satisfy the [FantasyLand Apply spec](https://github.com/fantasyland/fantasy-land#apply).
	 *
	 * @func
	 * @memberOf R
	 * @since v0.7.0
	 * @category Function
	 * @sig Number -> (*... -> *) -> ([*]... -> [*])
	 * @param {Function} fn The function to lift into higher context
	 * @return {Function} The lifted function.
	 * @see R.lift, R.ap
	 * @example
	 *
	 *      var madd3 = R.liftN(3, (...args) => R.sum(args));
	 *      madd3([1,2,3], [1,2,3], [1]); //=> [3, 4, 5, 4, 5, 6, 5, 6, 7]
	 */
	module.exports = _curry2(function liftN(arity, fn) {
	  var lifted = curryN(arity, fn);
	  return curryN(arity, function() {
	    return _reduce(ap, map(lifted, arguments[0]), Array.prototype.slice.call(arguments, 1));
	  });
	});


/***/ },
/* 69 */
/***/ function(module, exports, __webpack_require__) {

	var curry = __webpack_require__(70);


	/**
	 * Returns the result of calling its first argument with the remaining
	 * arguments. This is occasionally useful as a converging function for
	 * `R.converge`: the left branch can produce a function while the right branch
	 * produces a value to be passed to that function as an argument.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.9.0
	 * @category Function
	 * @sig (*... -> a),*... -> a
	 * @param {Function} fn The function to apply to the remaining arguments.
	 * @param {...*} args Any number of positional arguments.
	 * @return {*}
	 * @see R.apply
	 * @example
	 *
	 *      R.call(R.add, 1, 2); //=> 3
	 *
	 *      var indentN = R.pipe(R.times(R.always(' ')),
	 *                           R.join(''),
	 *                           R.replace(/^(?!$)/gm));
	 *
	 *      var format = R.converge(R.call, [
	 *                                  R.pipe(R.prop('indent'), indentN),
	 *                                  R.prop('value')
	 *                              ]);
	 *
	 *      format({indent: 2, value: 'foo\nbar\nbaz\n'}); //=> '  foo\n  bar\n  baz\n'
	 * @symb R.call(f, a, b) = f(a, b)
	 */
	module.exports = curry(function call(fn) {
	  return fn.apply(this, Array.prototype.slice.call(arguments, 1));
	});


/***/ },
/* 70 */
/***/ function(module, exports, __webpack_require__) {

	var _curry1 = __webpack_require__(11);
	var curryN = __webpack_require__(19);


	/**
	 * Returns a curried equivalent of the provided function. The curried function
	 * has two unusual capabilities. First, its arguments needn't be provided one
	 * at a time. If `f` is a ternary function and `g` is `R.curry(f)`, the
	 * following are equivalent:
	 *
	 *   - `g(1)(2)(3)`
	 *   - `g(1)(2, 3)`
	 *   - `g(1, 2)(3)`
	 *   - `g(1, 2, 3)`
	 *
	 * Secondly, the special placeholder value `R.__` may be used to specify
	 * "gaps", allowing partial application of any combination of arguments,
	 * regardless of their positions. If `g` is as above and `_` is `R.__`, the
	 * following are equivalent:
	 *
	 *   - `g(1, 2, 3)`
	 *   - `g(_, 2, 3)(1)`
	 *   - `g(_, _, 3)(1)(2)`
	 *   - `g(_, _, 3)(1, 2)`
	 *   - `g(_, 2)(1)(3)`
	 *   - `g(_, 2)(1, 3)`
	 *   - `g(_, 2)(_, 3)(1)`
	 *
	 * @func
	 * @memberOf R
	 * @since v0.1.0
	 * @category Function
	 * @sig (* -> a) -> (* -> a)
	 * @param {Function} fn The function to curry.
	 * @return {Function} A new, curried function.
	 * @see R.curryN
	 * @example
	 *
	 *      var addFourNumbers = (a, b, c, d) => a + b + c + d;
	 *
	 *      var curriedAddFourNumbers = R.curry(addFourNumbers);
	 *      var f = curriedAddFourNumbers(1, 2);
	 *      var g = f(3);
	 *      g(4); //=> 10
	 */
	module.exports = _curry1(function curry(fn) {
	  return curryN(fn.length, fn);
	});


/***/ },
/* 71 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);
	var _dispatchable = __webpack_require__(25);
	var _makeFlat = __webpack_require__(72);
	var _xchain = __webpack_require__(73);
	var map = __webpack_require__(34);


	/**
	 * `chain` maps a function over a list and concatenates the results. `chain`
	 * is also known as `flatMap` in some libraries
	 *
	 * Dispatches to the `chain` method of the second argument, if present,
	 * according to the [FantasyLand Chain spec](https://github.com/fantasyland/fantasy-land#chain).
	 *
	 * @func
	 * @memberOf R
	 * @since v0.3.0
	 * @category List
	 * @sig Chain m => (a -> m b) -> m a -> m b
	 * @param {Function} fn The function to map with
	 * @param {Array} list The list to map over
	 * @return {Array} The result of flat-mapping `list` with `fn`
	 * @example
	 *
	 *      var duplicate = n => [n, n];
	 *      R.chain(duplicate, [1, 2, 3]); //=> [1, 1, 2, 2, 3, 3]
	 *
	 *      R.chain(R.append, R.head)([1, 2, 3]); //=> [1, 2, 3, 1]
	 */
	module.exports = _curry2(_dispatchable(['chain'], _xchain, function chain(fn, monad) {
	  if (typeof monad === 'function') {
	    return function(x) { return fn(monad(x))(x); };
	  }
	  return _makeFlat(false)(map(fn, monad));
	}));


/***/ },
/* 72 */
/***/ function(module, exports, __webpack_require__) {

	var isArrayLike = __webpack_require__(39);


	/**
	 * `_makeFlat` is a helper function that returns a one-level or fully recursive
	 * function based on the flag passed in.
	 *
	 * @private
	 */
	module.exports = function _makeFlat(recursive) {
	  return function flatt(list) {
	    var value, jlen, j;
	    var result = [];
	    var idx = 0;
	    var ilen = list.length;

	    while (idx < ilen) {
	      if (isArrayLike(list[idx])) {
	        value = recursive ? flatt(list[idx]) : list[idx];
	        j = 0;
	        jlen = value.length;
	        while (j < jlen) {
	          result[result.length] = value[j];
	          j += 1;
	        }
	      } else {
	        result[result.length] = list[idx];
	      }
	      idx += 1;
	    }
	    return result;
	  };
	};


/***/ },
/* 73 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);
	var _flatCat = __webpack_require__(74);
	var map = __webpack_require__(34);


	module.exports = _curry2(function _xchain(f, xf) {
	  return map(f, _flatCat(xf));
	});


/***/ },
/* 74 */
/***/ function(module, exports, __webpack_require__) {

	var _forceReduced = __webpack_require__(75);
	var _reduce = __webpack_require__(36);
	var _xfBase = __webpack_require__(30);
	var isArrayLike = __webpack_require__(39);

	module.exports = (function() {
	  var preservingReduced = function(xf) {
	    return {
	      '@@transducer/init': _xfBase.init,
	      '@@transducer/result': function(result) {
	        return xf['@@transducer/result'](result);
	      },
	      '@@transducer/step': function(result, input) {
	        var ret = xf['@@transducer/step'](result, input);
	        return ret['@@transducer/reduced'] ? _forceReduced(ret) : ret;
	      }
	    };
	  };

	  return function _xcat(xf) {
	    var rxf = preservingReduced(xf);
	    return {
	      '@@transducer/init': _xfBase.init,
	      '@@transducer/result': function(result) {
	        return rxf['@@transducer/result'](result);
	      },
	      '@@transducer/step': function(result, input) {
	        return !isArrayLike(input) ? _reduce(rxf, result, [input]) : _reduce(rxf, result, input);
	      }
	    };
	  };
	}());


/***/ },
/* 75 */
/***/ function(module, exports) {

	module.exports = function _forceReduced(x) {
	  return {
	    '@@transducer/value': x,
	    '@@transducer/reduced': true
	  };
	};


/***/ },
/* 76 */
/***/ function(module, exports, __webpack_require__) {

	var _curry3 = __webpack_require__(23);

	/**
	 * Restricts a number to be within a range.
	 *
	 * Also works for other ordered types such as Strings and Dates.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.20.0
	 * @category Relation
	 * @sig Ord a => a -> a -> a -> a
	 * @param {Number} minimum The lower limit of the clamp (inclusive)
	 * @param {Number} maximum The upper limit of the clamp (inclusive)
	 * @param {Number} value Value to be clamped
	 * @return {Number} Returns `minimum` when `val < minimum`, `maximum` when `val > maximum`, returns `val` otherwise
	 * @example
	 *
	 *      R.clamp(1, 10, -5) // => 1
	 *      R.clamp(1, 10, 15) // => 10
	 *      R.clamp(1, 10, 4)  // => 4
	 */
	module.exports = _curry3(function clamp(min, max, value) {
	  if (min > max) {
	    throw new Error('min must not be greater than max in clamp(min, max, value)');
	  }
	  return value < min ? min :
	         value > max ? max :
	         value;
	});


/***/ },
/* 77 */
/***/ function(module, exports, __webpack_require__) {

	var _clone = __webpack_require__(78);
	var _curry1 = __webpack_require__(11);


	/**
	 * Creates a deep copy of the value which may contain (nested) `Array`s and
	 * `Object`s, `Number`s, `String`s, `Boolean`s and `Date`s. `Function`s are
	 * assigned by reference rather than copied
	 *
	 * Dispatches to a `clone` method if present.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.1.0
	 * @category Object
	 * @sig {*} -> {*}
	 * @param {*} value The object or array to clone
	 * @return {*} A deeply cloned copy of `val`
	 * @example
	 *
	 *      var objects = [{}, {}, {}];
	 *      var objectsClone = R.clone(objects);
	 *      objects === objectsClone; //=> false
	 *      objects[0] === objectsClone[0]; //=> false
	 */
	module.exports = _curry1(function clone(value) {
	  return value != null && typeof value.clone === 'function' ?
	    value.clone() :
	    _clone(value, [], [], true);
	});


/***/ },
/* 78 */
/***/ function(module, exports, __webpack_require__) {

	var _cloneRegExp = __webpack_require__(79);
	var type = __webpack_require__(80);


	/**
	 * Copies an object.
	 *
	 * @private
	 * @param {*} value The value to be copied
	 * @param {Array} refFrom Array containing the source references
	 * @param {Array} refTo Array containing the copied source references
	 * @param {Boolean} deep Whether or not to perform deep cloning.
	 * @return {*} The copied value.
	 */
	module.exports = function _clone(value, refFrom, refTo, deep) {
	  var copy = function copy(copiedValue) {
	    var len = refFrom.length;
	    var idx = 0;
	    while (idx < len) {
	      if (value === refFrom[idx]) {
	        return refTo[idx];
	      }
	      idx += 1;
	    }
	    refFrom[idx + 1] = value;
	    refTo[idx + 1] = copiedValue;
	    for (var key in value) {
	      copiedValue[key] = deep ?
	        _clone(value[key], refFrom, refTo, true) : value[key];
	    }
	    return copiedValue;
	  };
	  switch (type(value)) {
	    case 'Object':  return copy({});
	    case 'Array':   return copy([]);
	    case 'Date':    return new Date(value.valueOf());
	    case 'RegExp':  return _cloneRegExp(value);
	    default:        return value;
	  }
	};


/***/ },
/* 79 */
/***/ function(module, exports) {

	module.exports = function _cloneRegExp(pattern) {
	  return new RegExp(pattern.source, (pattern.global     ? 'g' : '') +
	                                    (pattern.ignoreCase ? 'i' : '') +
	                                    (pattern.multiline  ? 'm' : '') +
	                                    (pattern.sticky     ? 'y' : '') +
	                                    (pattern.unicode    ? 'u' : ''));
	};


/***/ },
/* 80 */
/***/ function(module, exports, __webpack_require__) {

	var _curry1 = __webpack_require__(11);


	/**
	 * Gives a single-word string description of the (native) type of a value,
	 * returning such answers as 'Object', 'Number', 'Array', or 'Null'. Does not
	 * attempt to distinguish user Object types any further, reporting them all as
	 * 'Object'.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.8.0
	 * @category Type
	 * @sig (* -> {*}) -> String
	 * @param {*} val The value to test
	 * @return {String}
	 * @example
	 *
	 *      R.type({}); //=> "Object"
	 *      R.type(1); //=> "Number"
	 *      R.type(false); //=> "Boolean"
	 *      R.type('s'); //=> "String"
	 *      R.type(null); //=> "Null"
	 *      R.type([]); //=> "Array"
	 *      R.type(/[A-z]/); //=> "RegExp"
	 */
	module.exports = _curry1(function type(val) {
	  return val === null      ? 'Null'      :
	         val === undefined ? 'Undefined' :
	         Object.prototype.toString.call(val).slice(8, -1);
	});


/***/ },
/* 81 */
/***/ function(module, exports, __webpack_require__) {

	var _curry1 = __webpack_require__(11);


	/**
	 * Makes a comparator function out of a function that reports whether the first
	 * element is less than the second.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.1.0
	 * @category Function
	 * @sig (a, b -> Boolean) -> (a, b -> Number)
	 * @param {Function} pred A predicate function of arity two which will return `true` if the first argument
	 * is less than the second, `false` otherwise
	 * @return {Function} A Function :: a -> b -> Int that returns `-1` if a < b, `1` if b < a, otherwise `0`
	 * @example
	 *
	 *      var byAge = R.comparator((a, b) => a.age < b.age);
	 *      var people = [
	 *        // ...
	 *      ];
	 *      var peopleByIncreasingAge = R.sort(byAge, people);
	 */
	module.exports = _curry1(function comparator(pred) {
	  return function(a, b) {
	    return pred(a, b) ? -1 : pred(b, a) ? 1 : 0;
	  };
	});


/***/ },
/* 82 */
/***/ function(module, exports, __webpack_require__) {

	var lift = __webpack_require__(67);
	var not = __webpack_require__(83);


	/**
	 * Takes a function `f` and returns a function `g` such that if called with the same arguments
	 * when `f` returns a "truthy" value, `g` returns `false` and when `f` returns a "falsy" value `g` returns `true`.
	 *
	 * `R.complement` may be applied to any functor
	 *
	 * @func
	 * @memberOf R
	 * @since v0.12.0
	 * @category Logic
	 * @sig (*... -> *) -> (*... -> Boolean)
	 * @param {Function} f
	 * @return {Function}
	 * @see R.not
	 * @example
	 *
	 *      var isNotNil = R.complement(R.isNil);
	 *      isNil(null); //=> true
	 *      isNotNil(null); //=> false
	 *      isNil(7); //=> false
	 *      isNotNil(7); //=> true
	 */
	module.exports = lift(not);


/***/ },
/* 83 */
/***/ function(module, exports, __webpack_require__) {

	var _curry1 = __webpack_require__(11);


	/**
	 * A function that returns the `!` of its argument. It will return `true` when
	 * passed false-y value, and `false` when passed a truth-y one.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.1.0
	 * @category Logic
	 * @sig * -> Boolean
	 * @param {*} a any value
	 * @return {Boolean} the logical inverse of passed argument.
	 * @see R.complement
	 * @example
	 *
	 *      R.not(true); //=> false
	 *      R.not(false); //=> true
	 *      R.not(0); //=> true
	 *      R.not(1); //=> false
	 */
	module.exports = _curry1(function not(a) {
	  return !a;
	});


/***/ },
/* 84 */
/***/ function(module, exports, __webpack_require__) {

	var pipe = __webpack_require__(85);
	var reverse = __webpack_require__(90);


	/**
	 * Performs right-to-left function composition. The rightmost function may have
	 * any arity; the remaining functions must be unary.
	 *
	 * **Note:** The result of compose is not automatically curried.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.1.0
	 * @category Function
	 * @sig ((y -> z), (x -> y), ..., (o -> p), ((a, b, ..., n) -> o)) -> ((a, b, ..., n) -> z)
	 * @param {...Function} ...functions The functions to compose
	 * @return {Function}
	 * @see R.pipe
	 * @example
	 *
	 *      var classyGreeting = (firstName, lastName) => "The name's " + lastName + ", " + firstName + " " + lastName
	 *      var yellGreeting = R.compose(R.toUpper, classyGreeting);
	 *      yellGreeting('James', 'Bond'); //=> "THE NAME'S BOND, JAMES BOND"
	 *
	 *      R.compose(Math.abs, R.add(1), R.multiply(2))(-4) //=> 7
	 *
	 * @symb R.compose(f, g, h)(a, b) = f(g(h(a, b)))
	 */
	module.exports = function compose() {
	  if (arguments.length === 0) {
	    throw new Error('compose requires at least one argument');
	  }
	  return pipe.apply(this, reverse(arguments));
	};


/***/ },
/* 85 */
/***/ function(module, exports, __webpack_require__) {

	var _arity = __webpack_require__(20);
	var _pipe = __webpack_require__(86);
	var reduce = __webpack_require__(46);
	var tail = __webpack_require__(87);


	/**
	 * Performs left-to-right function composition. The leftmost function may have
	 * any arity; the remaining functions must be unary.
	 *
	 * In some libraries this function is named `sequence`.
	 *
	 * **Note:** The result of pipe is not automatically curried.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.1.0
	 * @category Function
	 * @sig (((a, b, ..., n) -> o), (o -> p), ..., (x -> y), (y -> z)) -> ((a, b, ..., n) -> z)
	 * @param {...Function} functions
	 * @return {Function}
	 * @see R.compose
	 * @example
	 *
	 *      var f = R.pipe(Math.pow, R.negate, R.inc);
	 *
	 *      f(3, 4); // -(3^4) + 1
	 * @symb R.pipe(f, g, h)(a, b) = h(g(f(a, b)))
	 */
	module.exports = function pipe() {
	  if (arguments.length === 0) {
	    throw new Error('pipe requires at least one argument');
	  }
	  return _arity(arguments[0].length,
	                reduce(_pipe, arguments[0], tail(arguments)));
	};


/***/ },
/* 86 */
/***/ function(module, exports) {

	module.exports = function _pipe(f, g) {
	  return function() {
	    return g.call(this, f.apply(this, arguments));
	  };
	};


/***/ },
/* 87 */
/***/ function(module, exports, __webpack_require__) {

	var _checkForMethod = __webpack_require__(88);
	var _curry1 = __webpack_require__(11);
	var slice = __webpack_require__(89);


	/**
	 * Returns all but the first element of the given list or string (or object
	 * with a `tail` method).
	 *
	 * Dispatches to the `slice` method of the first argument, if present.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.1.0
	 * @category List
	 * @sig [a] -> [a]
	 * @sig String -> String
	 * @param {*} list
	 * @return {*}
	 * @see R.head, R.init, R.last
	 * @example
	 *
	 *      R.tail([1, 2, 3]);  //=> [2, 3]
	 *      R.tail([1, 2]);     //=> [2]
	 *      R.tail([1]);        //=> []
	 *      R.tail([]);         //=> []
	 *
	 *      R.tail('abc');  //=> 'bc'
	 *      R.tail('ab');   //=> 'b'
	 *      R.tail('a');    //=> ''
	 *      R.tail('');     //=> ''
	 */
	module.exports = _curry1(_checkForMethod('tail', slice(1, Infinity)));


/***/ },
/* 88 */
/***/ function(module, exports, __webpack_require__) {

	var _isArray = __webpack_require__(26);


	/**
	 * This checks whether a function has a [methodname] function. If it isn't an
	 * array it will execute that function otherwise it will default to the ramda
	 * implementation.
	 *
	 * @private
	 * @param {Function} fn ramda implemtation
	 * @param {String} methodname property to check for a custom implementation
	 * @return {Object} Whatever the return value of the method is.
	 */
	module.exports = function _checkForMethod(methodname, fn) {
	  return function() {
	    var length = arguments.length;
	    if (length === 0) {
	      return fn();
	    }
	    var obj = arguments[length - 1];
	    return (_isArray(obj) || typeof obj[methodname] !== 'function') ?
	      fn.apply(this, arguments) :
	      obj[methodname].apply(obj, Array.prototype.slice.call(arguments, 0, length - 1));
	  };
	};


/***/ },
/* 89 */
/***/ function(module, exports, __webpack_require__) {

	var _checkForMethod = __webpack_require__(88);
	var _curry3 = __webpack_require__(23);


	/**
	 * Returns the elements of the given list or string (or object with a `slice`
	 * method) from `fromIndex` (inclusive) to `toIndex` (exclusive).
	 *
	 * Dispatches to the `slice` method of the third argument, if present.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.1.4
	 * @category List
	 * @sig Number -> Number -> [a] -> [a]
	 * @sig Number -> Number -> String -> String
	 * @param {Number} fromIndex The start index (inclusive).
	 * @param {Number} toIndex The end index (exclusive).
	 * @param {*} list
	 * @return {*}
	 * @example
	 *
	 *      R.slice(1, 3, ['a', 'b', 'c', 'd']);        //=> ['b', 'c']
	 *      R.slice(1, Infinity, ['a', 'b', 'c', 'd']); //=> ['b', 'c', 'd']
	 *      R.slice(0, -1, ['a', 'b', 'c', 'd']);       //=> ['a', 'b', 'c']
	 *      R.slice(-3, -1, ['a', 'b', 'c', 'd']);      //=> ['b', 'c']
	 *      R.slice(0, 3, 'ramda');                     //=> 'ram'
	 */
	module.exports = _curry3(_checkForMethod('slice', function slice(fromIndex, toIndex, list) {
	  return Array.prototype.slice.call(list, fromIndex, toIndex);
	}));


/***/ },
/* 90 */
/***/ function(module, exports, __webpack_require__) {

	var _curry1 = __webpack_require__(11);
	var _isString = __webpack_require__(40);


	/**
	 * Returns a new list or string with the elements or characters in reverse
	 * order.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.1.0
	 * @category List
	 * @sig [a] -> [a]
	 * @sig String -> String
	 * @param {Array|String} list
	 * @return {Array|String}
	 * @example
	 *
	 *      R.reverse([1, 2, 3]);  //=> [3, 2, 1]
	 *      R.reverse([1, 2]);     //=> [2, 1]
	 *      R.reverse([1]);        //=> [1]
	 *      R.reverse([]);         //=> []
	 *
	 *      R.reverse('abc');      //=> 'cba'
	 *      R.reverse('ab');       //=> 'ba'
	 *      R.reverse('a');        //=> 'a'
	 *      R.reverse('');         //=> ''
	 */
	module.exports = _curry1(function reverse(list) {
	  return _isString(list) ? list.split('').reverse().join('') :
	                           Array.prototype.slice.call(list, 0).reverse();
	});


/***/ },
/* 91 */
/***/ function(module, exports, __webpack_require__) {

	var chain = __webpack_require__(71);
	var compose = __webpack_require__(84);
	var map = __webpack_require__(34);


	/**
	 * Returns the right-to-left Kleisli composition of the provided functions,
	 * each of which must return a value of a type supported by [`chain`](#chain).
	 *
	 * `R.composeK(h, g, f)` is equivalent to `R.compose(R.chain(h), R.chain(g), R.chain(f))`.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.16.0
	 * @category Function
	 * @sig Chain m => ((y -> m z), (x -> m y), ..., (a -> m b)) -> (a -> m z)
	 * @param {...Function} ...functions The functions to compose
	 * @return {Function}
	 * @see R.pipeK
	 * @example
	 *
	 *       //  get :: String -> Object -> Maybe *
	 *       var get = R.curry((propName, obj) => Maybe(obj[propName]))
	 *
	 *       //  getStateCode :: Maybe String -> Maybe String
	 *       var getStateCode = R.composeK(
	 *         R.compose(Maybe.of, R.toUpper),
	 *         get('state'),
	 *         get('address'),
	 *         get('user'),
	 *       );
	 *       getStateCode({"user":{"address":{"state":"ny"}}}); //=> Maybe.Just("NY")
	 *       getStateCode({}); //=> Maybe.Nothing()
	 * @symb R.composeK(f, g, h)(a) = R.chain(f, R.chain(g, h(a)))
	 */
	module.exports = function composeK() {
	  if (arguments.length === 0) {
	    throw new Error('composeK requires at least one argument');
	  }
	  var init = Array.prototype.slice.call(arguments);
	  var last = init.pop();
	  return compose(compose.apply(this, map(chain, init)), last);
	};


/***/ },
/* 92 */
/***/ function(module, exports, __webpack_require__) {

	var pipeP = __webpack_require__(93);
	var reverse = __webpack_require__(90);


	/**
	 * Performs right-to-left composition of one or more Promise-returning
	 * functions. The rightmost function may have any arity; the remaining
	 * functions must be unary.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.10.0
	 * @category Function
	 * @sig ((y -> Promise z), (x -> Promise y), ..., (a -> Promise b)) -> (a -> Promise z)
	 * @param {...Function} functions The functions to compose
	 * @return {Function}
	 * @see R.pipeP
	 * @example
	 *
	 *      var db = {
	 *        users: {
	 *          JOE: {
	 *            name: 'Joe',
	 *            followers: ['STEVE', 'SUZY']
	 *          }
	 *        }
	 *      }
	 *
	 *      // We'll pretend to do a db lookup which returns a promise
	 *      var lookupUser = (userId) => Promise.resolve(db.users[userId])
	 *      var lookupFollowers = (user) => Promise.resolve(user.followers)
	 *      lookupUser('JOE').then(lookupFollowers)
	 *
	 *      //  followersForUser :: String -> Promise [UserId]
	 *      var followersForUser = R.composeP(lookupFollowers, lookupUser);
	 *      followersForUser('JOE').then(followers => console.log('Followers:', followers))
	 *      // Followers: ["STEVE","SUZY"]
	 */
	module.exports = function composeP() {
	  if (arguments.length === 0) {
	    throw new Error('composeP requires at least one argument');
	  }
	  return pipeP.apply(this, reverse(arguments));
	};


/***/ },
/* 93 */
/***/ function(module, exports, __webpack_require__) {

	var _arity = __webpack_require__(20);
	var _pipeP = __webpack_require__(94);
	var reduce = __webpack_require__(46);
	var tail = __webpack_require__(87);


	/**
	 * Performs left-to-right composition of one or more Promise-returning
	 * functions. The leftmost function may have any arity; the remaining functions
	 * must be unary.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.10.0
	 * @category Function
	 * @sig ((a -> Promise b), (b -> Promise c), ..., (y -> Promise z)) -> (a -> Promise z)
	 * @param {...Function} functions
	 * @return {Function}
	 * @see R.composeP
	 * @example
	 *
	 *      //  followersForUser :: String -> Promise [User]
	 *      var followersForUser = R.pipeP(db.getUserById, db.getFollowers);
	 */
	module.exports = function pipeP() {
	  if (arguments.length === 0) {
	    throw new Error('pipeP requires at least one argument');
	  }
	  return _arity(arguments[0].length,
	                reduce(_pipeP, arguments[0], tail(arguments)));
	};


/***/ },
/* 94 */
/***/ function(module, exports) {

	module.exports = function _pipeP(f, g) {
	  return function() {
	    var ctx = this;
	    return f.apply(ctx, arguments).then(function(x) {
	      return g.call(ctx, x);
	    });
	  };
	};


/***/ },
/* 95 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);
	var _isArray = __webpack_require__(26);
	var _isFunction = __webpack_require__(66);
	var toString = __webpack_require__(96);


	/**
	 * Returns the result of concatenating the given lists or strings.
	 *
	 * Note: `R.concat` expects both arguments to be of the same type,
	 * unlike the native `Array.prototype.concat` method. It will throw
	 * an error if you `concat` an Array with a non-Array value.
	 *
	 * Dispatches to the `concat` method of the first argument, if present.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.1.0
	 * @category List
	 * @sig [a] -> [a] -> [a]
	 * @sig String -> String -> String
	 * @param {Array|String} firstList The first list
	 * @param {Array|String} secondList The second list
	 * @return {Array|String} A list consisting of the elements of `firstList` followed by the elements of
	 * `secondList`.
	 *
	 * @example
	 *
	 *      R.concat('ABC', 'DEF'); // 'ABCDEF'
	 *      R.concat([4, 5, 6], [1, 2, 3]); //=> [4, 5, 6, 1, 2, 3]
	 *      R.concat([], []); //=> []
	 */
	module.exports = _curry2(function concat(a, b) {
	  if (a == null || !_isFunction(a.concat)) {
	    throw new TypeError(toString(a) + ' does not have a method named "concat"');
	  }
	  if (_isArray(a) && !_isArray(b)) {
	    throw new TypeError(toString(b) + ' is not an array');
	  }
	  return a.concat(b);
	});


/***/ },
/* 96 */
/***/ function(module, exports, __webpack_require__) {

	var _curry1 = __webpack_require__(11);
	var _toString = __webpack_require__(97);


	/**
	 * Returns the string representation of the given value. `eval`'ing the output
	 * should result in a value equivalent to the input value. Many of the built-in
	 * `toString` methods do not satisfy this requirement.
	 *
	 * If the given value is an `[object Object]` with a `toString` method other
	 * than `Object.prototype.toString`, this method is invoked with no arguments
	 * to produce the return value. This means user-defined constructor functions
	 * can provide a suitable `toString` method. For example:
	 *
	 *     function Point(x, y) {
	 *       this.x = x;
	 *       this.y = y;
	 *     }
	 *
	 *     Point.prototype.toString = function() {
	 *       return 'new Point(' + this.x + ', ' + this.y + ')';
	 *     };
	 *
	 *     R.toString(new Point(1, 2)); //=> 'new Point(1, 2)'
	 *
	 * @func
	 * @memberOf R
	 * @since v0.14.0
	 * @category String
	 * @sig * -> String
	 * @param {*} val
	 * @return {String}
	 * @example
	 *
	 *      R.toString(42); //=> '42'
	 *      R.toString('abc'); //=> '"abc"'
	 *      R.toString([1, 2, 3]); //=> '[1, 2, 3]'
	 *      R.toString({foo: 1, bar: 2, baz: 3}); //=> '{"bar": 2, "baz": 3, "foo": 1}'
	 *      R.toString(new Date('2001-02-03T04:05:06Z')); //=> 'new Date("2001-02-03T04:05:06.000Z")'
	 */
	module.exports = _curry1(function toString(val) { return _toString(val, []); });


/***/ },
/* 97 */
/***/ function(module, exports, __webpack_require__) {

	var _contains = __webpack_require__(98);
	var _map = __webpack_require__(35);
	var _quote = __webpack_require__(105);
	var _toISOString = __webpack_require__(106);
	var keys = __webpack_require__(42);
	var reject = __webpack_require__(107);


	module.exports = function _toString(x, seen) {
	  var recur = function recur(y) {
	    var xs = seen.concat([x]);
	    return _contains(y, xs) ? '<Circular>' : _toString(y, xs);
	  };

	  //  mapPairs :: (Object, [String]) -> [String]
	  var mapPairs = function(obj, keys) {
	    return _map(function(k) { return _quote(k) + ': ' + recur(obj[k]); }, keys.slice().sort());
	  };

	  switch (Object.prototype.toString.call(x)) {
	    case '[object Arguments]':
	      return '(function() { return arguments; }(' + _map(recur, x).join(', ') + '))';
	    case '[object Array]':
	      return '[' + _map(recur, x).concat(mapPairs(x, reject(function(k) { return /^\d+$/.test(k); }, keys(x)))).join(', ') + ']';
	    case '[object Boolean]':
	      return typeof x === 'object' ? 'new Boolean(' + recur(x.valueOf()) + ')' : x.toString();
	    case '[object Date]':
	      return 'new Date(' + (isNaN(x.valueOf()) ? recur(NaN) : _quote(_toISOString(x))) + ')';
	    case '[object Null]':
	      return 'null';
	    case '[object Number]':
	      return typeof x === 'object' ? 'new Number(' + recur(x.valueOf()) + ')' : 1 / x === -Infinity ? '-0' : x.toString(10);
	    case '[object String]':
	      return typeof x === 'object' ? 'new String(' + recur(x.valueOf()) + ')' : _quote(x);
	    case '[object Undefined]':
	      return 'undefined';
	    default:
	      if (typeof x.toString === 'function') {
	        var repr = x.toString();
	        if (repr !== '[object Object]') {
	          return repr;
	        }
	      }
	      return '{' + mapPairs(x, keys(x)).join(', ') + '}';
	  }
	};


/***/ },
/* 98 */
/***/ function(module, exports, __webpack_require__) {

	var _indexOf = __webpack_require__(99);


	module.exports = function _contains(a, list) {
	  return _indexOf(list, a, 0) >= 0;
	};


/***/ },
/* 99 */
/***/ function(module, exports, __webpack_require__) {

	var equals = __webpack_require__(100);


	module.exports = function _indexOf(list, a, idx) {
	  var inf, item;
	  // Array.prototype.indexOf doesn't exist below IE9
	  if (typeof list.indexOf === 'function') {
	    switch (typeof a) {
	      case 'number':
	        if (a === 0) {
	          // manually crawl the list to distinguish between +0 and -0
	          inf = 1 / a;
	          while (idx < list.length) {
	            item = list[idx];
	            if (item === 0 && 1 / item === inf) {
	              return idx;
	            }
	            idx += 1;
	          }
	          return -1;
	        } else if (a !== a) {
	          // NaN
	          while (idx < list.length) {
	            item = list[idx];
	            if (typeof item === 'number' && item !== item) {
	              return idx;
	            }
	            idx += 1;
	          }
	          return -1;
	        }
	        // non-zero numbers can utilise Set
	        return list.indexOf(a, idx);

	      // all these types can utilise Set
	      case 'string':
	      case 'boolean':
	      case 'function':
	      case 'undefined':
	        return list.indexOf(a, idx);

	      case 'object':
	        if (a === null) {
	          // null can utilise Set
	          return list.indexOf(a, idx);
	        }
	    }
	  }
	  // anything else not covered above, defer to R.equals
	  while (idx < list.length) {
	    if (equals(list[idx], a)) {
	      return idx;
	    }
	    idx += 1;
	  }
	  return -1;
	};


/***/ },
/* 100 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);
	var _equals = __webpack_require__(101);


	/**
	 * Returns `true` if its arguments are equivalent, `false` otherwise. Handles
	 * cyclical data structures.
	 *
	 * Dispatches symmetrically to the `equals` methods of both arguments, if
	 * present.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.15.0
	 * @category Relation
	 * @sig a -> b -> Boolean
	 * @param {*} a
	 * @param {*} b
	 * @return {Boolean}
	 * @example
	 *
	 *      R.equals(1, 1); //=> true
	 *      R.equals(1, '1'); //=> false
	 *      R.equals([1, 2, 3], [1, 2, 3]); //=> true
	 *
	 *      var a = {}; a.v = a;
	 *      var b = {}; b.v = b;
	 *      R.equals(a, b); //=> true
	 */
	module.exports = _curry2(function equals(a, b) {
	  return _equals(a, b, [], []);
	});


/***/ },
/* 101 */
/***/ function(module, exports, __webpack_require__) {

	var _arrayFromIterator = __webpack_require__(102);
	var _functionName = __webpack_require__(103);
	var _has = __webpack_require__(43);
	var identical = __webpack_require__(104);
	var keys = __webpack_require__(42);
	var type = __webpack_require__(80);


	module.exports = function _equals(a, b, stackA, stackB) {
	  if (identical(a, b)) {
	    return true;
	  }

	  if (type(a) !== type(b)) {
	    return false;
	  }

	  if (a == null || b == null) {
	    return false;
	  }

	  if (typeof a.equals === 'function' || typeof b.equals === 'function') {
	    return typeof a.equals === 'function' && a.equals(b) &&
	           typeof b.equals === 'function' && b.equals(a);
	  }

	  switch (type(a)) {
	    case 'Arguments':
	    case 'Array':
	    case 'Object':
	      if (typeof a.constructor === 'function' &&
	          _functionName(a.constructor) === 'Promise') {
	        return a === b;
	      }
	      break;
	    case 'Boolean':
	    case 'Number':
	    case 'String':
	      if (!(typeof a === typeof b && identical(a.valueOf(), b.valueOf()))) {
	        return false;
	      }
	      break;
	    case 'Date':
	      if (!identical(a.valueOf(), b.valueOf())) {
	        return false;
	      }
	      break;
	    case 'Error':
	      return a.name === b.name && a.message === b.message;
	    case 'RegExp':
	      if (!(a.source === b.source &&
	            a.global === b.global &&
	            a.ignoreCase === b.ignoreCase &&
	            a.multiline === b.multiline &&
	            a.sticky === b.sticky &&
	            a.unicode === b.unicode)) {
	        return false;
	      }
	      break;
	    case 'Map':
	    case 'Set':
	      if (!_equals(_arrayFromIterator(a.entries()), _arrayFromIterator(b.entries()), stackA, stackB)) {
	        return false;
	      }
	      break;
	    case 'Int8Array':
	    case 'Uint8Array':
	    case 'Uint8ClampedArray':
	    case 'Int16Array':
	    case 'Uint16Array':
	    case 'Int32Array':
	    case 'Uint32Array':
	    case 'Float32Array':
	    case 'Float64Array':
	      break;
	    case 'ArrayBuffer':
	      break;
	    default:
	      // Values of other types are only equal if identical.
	      return false;
	  }

	  var keysA = keys(a);
	  if (keysA.length !== keys(b).length) {
	    return false;
	  }

	  var idx = stackA.length - 1;
	  while (idx >= 0) {
	    if (stackA[idx] === a) {
	      return stackB[idx] === b;
	    }
	    idx -= 1;
	  }

	  stackA.push(a);
	  stackB.push(b);
	  idx = keysA.length - 1;
	  while (idx >= 0) {
	    var key = keysA[idx];
	    if (!(_has(key, b) && _equals(b[key], a[key], stackA, stackB))) {
	      return false;
	    }
	    idx -= 1;
	  }
	  stackA.pop();
	  stackB.pop();
	  return true;
	};


/***/ },
/* 102 */
/***/ function(module, exports) {

	module.exports = function _arrayFromIterator(iter) {
	  var list = [];
	  var next;
	  while (!(next = iter.next()).done) {
	    list.push(next.value);
	  }
	  return list;
	};


/***/ },
/* 103 */
/***/ function(module, exports) {

	module.exports = function _functionName(f) {
	  // String(x => x) evaluates to "x => x", so the pattern may not match.
	  var match = String(f).match(/^function (\w*)/);
	  return match == null ? '' : match[1];
	};


/***/ },
/* 104 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);


	/**
	 * Returns true if its arguments are identical, false otherwise. Values are
	 * identical if they reference the same memory. `NaN` is identical to `NaN`;
	 * `0` and `-0` are not identical.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.15.0
	 * @category Relation
	 * @sig a -> a -> Boolean
	 * @param {*} a
	 * @param {*} b
	 * @return {Boolean}
	 * @example
	 *
	 *      var o = {};
	 *      R.identical(o, o); //=> true
	 *      R.identical(1, 1); //=> true
	 *      R.identical(1, '1'); //=> false
	 *      R.identical([], []); //=> false
	 *      R.identical(0, -0); //=> false
	 *      R.identical(NaN, NaN); //=> true
	 */
	module.exports = _curry2(function identical(a, b) {
	  // SameValue algorithm
	  if (a === b) { // Steps 1-5, 7-10
	    // Steps 6.b-6.e: +0 != -0
	    return a !== 0 || 1 / a === 1 / b;
	  } else {
	    // Step 6.a: NaN == NaN
	    return a !== a && b !== b;
	  }
	});


/***/ },
/* 105 */
/***/ function(module, exports) {

	module.exports = function _quote(s) {
	  var escaped = s
	    .replace(/\\/g, '\\\\')
	    .replace(/[\b]/g, '\\b')  // \b matches word boundary; [\b] matches backspace
	    .replace(/\f/g, '\\f')
	    .replace(/\n/g, '\\n')
	    .replace(/\r/g, '\\r')
	    .replace(/\t/g, '\\t')
	    .replace(/\v/g, '\\v')
	    .replace(/\0/g, '\\0');

	  return '"' + escaped.replace(/"/g, '\\"') + '"';
	};


/***/ },
/* 106 */
/***/ function(module, exports) {

	/**
	 * Polyfill from <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString>.
	 */
	module.exports = (function() {
	  var pad = function pad(n) { return (n < 10 ? '0' : '') + n; };

	  return typeof Date.prototype.toISOString === 'function' ?
	    function _toISOString(d) {
	      return d.toISOString();
	    } :
	    function _toISOString(d) {
	      return (
	        d.getUTCFullYear() + '-' +
	        pad(d.getUTCMonth() + 1) + '-' +
	        pad(d.getUTCDate()) + 'T' +
	        pad(d.getUTCHours()) + ':' +
	        pad(d.getUTCMinutes()) + ':' +
	        pad(d.getUTCSeconds()) + '.' +
	        (d.getUTCMilliseconds() / 1000).toFixed(3).slice(2, 5) + 'Z'
	      );
	    };
	}());


/***/ },
/* 107 */
/***/ function(module, exports, __webpack_require__) {

	var _complement = __webpack_require__(108);
	var _curry2 = __webpack_require__(16);
	var filter = __webpack_require__(109);


	/**
	 * The complement of `filter`.
	 *
	 * Acts as a transducer if a transformer is given in list position.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.1.0
	 * @category List
	 * @sig Filterable f => (a -> Boolean) -> f a -> f a
	 * @param {Function} pred
	 * @param {Array} filterable
	 * @return {Array}
	 * @see R.filter, R.transduce, R.addIndex
	 * @example
	 *
	 *      var isOdd = (n) => n % 2 === 1;
	 *
	 *      R.reject(isOdd, [1, 2, 3, 4]); //=> [2, 4]
	 *
	 *      R.reject(isOdd, {a: 1, b: 2, c: 3, d: 4}); //=> {b: 2, d: 4}
	 */
	module.exports = _curry2(function reject(pred, filterable) {
	  return filter(_complement(pred), filterable);
	});


/***/ },
/* 108 */
/***/ function(module, exports) {

	module.exports = function _complement(f) {
	  return function() {
	    return !f.apply(this, arguments);
	  };
	};


/***/ },
/* 109 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);
	var _dispatchable = __webpack_require__(25);
	var _filter = __webpack_require__(110);
	var _isObject = __webpack_require__(111);
	var _reduce = __webpack_require__(36);
	var _xfilter = __webpack_require__(112);
	var keys = __webpack_require__(42);


	/**
	 * Takes a predicate and a "filterable", and returns a new filterable of the
	 * same type containing the members of the given filterable which satisfy the
	 * given predicate.
	 *
	 * Dispatches to the `filter` method of the second argument, if present.
	 *
	 * Acts as a transducer if a transformer is given in list position.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.1.0
	 * @category List
	 * @sig Filterable f => (a -> Boolean) -> f a -> f a
	 * @param {Function} pred
	 * @param {Array} filterable
	 * @return {Array}
	 * @see R.reject, R.transduce, R.addIndex
	 * @example
	 *
	 *      var isEven = n => n % 2 === 0;
	 *
	 *      R.filter(isEven, [1, 2, 3, 4]); //=> [2, 4]
	 *
	 *      R.filter(isEven, {a: 1, b: 2, c: 3, d: 4}); //=> {b: 2, d: 4}
	 */
	module.exports = _curry2(_dispatchable(['filter'], _xfilter, function(pred, filterable) {
	  return (
	    _isObject(filterable) ?
	      _reduce(function(acc, key) {
	        if (pred(filterable[key])) {
	          acc[key] = filterable[key];
	        }
	        return acc;
	      }, {}, keys(filterable)) :
	    // else
	      _filter(pred, filterable)
	  );
	}));


/***/ },
/* 110 */
/***/ function(module, exports) {

	module.exports = function _filter(fn, list) {
	  var idx = 0;
	  var len = list.length;
	  var result = [];

	  while (idx < len) {
	    if (fn(list[idx])) {
	      result[result.length] = list[idx];
	    }
	    idx += 1;
	  }
	  return result;
	};


/***/ },
/* 111 */
/***/ function(module, exports) {

	module.exports = function _isObject(x) {
	  return Object.prototype.toString.call(x) === '[object Object]';
	};


/***/ },
/* 112 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);
	var _xfBase = __webpack_require__(30);


	module.exports = (function() {
	  function XFilter(f, xf) {
	    this.xf = xf;
	    this.f = f;
	  }
	  XFilter.prototype['@@transducer/init'] = _xfBase.init;
	  XFilter.prototype['@@transducer/result'] = _xfBase.result;
	  XFilter.prototype['@@transducer/step'] = function(result, input) {
	    return this.f(input) ? this.xf['@@transducer/step'](result, input) : result;
	  };

	  return _curry2(function _xfilter(f, xf) { return new XFilter(f, xf); });
	}());


/***/ },
/* 113 */
/***/ function(module, exports, __webpack_require__) {

	var _arity = __webpack_require__(20);
	var _curry1 = __webpack_require__(11);
	var map = __webpack_require__(34);
	var max = __webpack_require__(32);
	var reduce = __webpack_require__(46);


	/**
	 * Returns a function, `fn`, which encapsulates `if/else, if/else, ...` logic.
	 * `R.cond` takes a list of [predicate, transformer] pairs. All of the arguments
	 * to `fn` are applied to each of the predicates in turn until one returns a
	 * "truthy" value, at which point `fn` returns the result of applying its
	 * arguments to the corresponding transformer. If none of the predicates
	 * matches, `fn` returns undefined.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.6.0
	 * @category Logic
	 * @sig [[(*... -> Boolean),(*... -> *)]] -> (*... -> *)
	 * @param {Array} pairs A list of [predicate, transformer]
	 * @return {Function}
	 * @example
	 *
	 *      var fn = R.cond([
	 *        [R.equals(0),   R.always('water freezes at 0°C')],
	 *        [R.equals(100), R.always('water boils at 100°C')],
	 *        [R.T,           temp => 'nothing special happens at ' + temp + '°C']
	 *      ]);
	 *      fn(0); //=> 'water freezes at 0°C'
	 *      fn(50); //=> 'nothing special happens at 50°C'
	 *      fn(100); //=> 'water boils at 100°C'
	 */
	module.exports = _curry1(function cond(pairs) {
	  var arity = reduce(max,
	                     0,
	                     map(function(pair) { return pair[0].length; }, pairs));
	  return _arity(arity, function() {
	    var idx = 0;
	    while (idx < pairs.length) {
	      if (pairs[idx][0].apply(this, arguments)) {
	        return pairs[idx][1].apply(this, arguments);
	      }
	      idx += 1;
	    }
	  });
	});


/***/ },
/* 114 */
/***/ function(module, exports, __webpack_require__) {

	var _curry1 = __webpack_require__(11);
	var constructN = __webpack_require__(115);


	/**
	 * Wraps a constructor function inside a curried function that can be called
	 * with the same arguments and returns the same type.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.1.0
	 * @category Function
	 * @sig (* -> {*}) -> (* -> {*})
	 * @param {Function} fn The constructor function to wrap.
	 * @return {Function} A wrapped, curried constructor function.
	 * @example
	 *
	 *      // Constructor function
	 *      function Animal(kind) {
	 *        this.kind = kind;
	 *      };
	 *      Animal.prototype.sighting = function() {
	 *        return "It's a " + this.kind + "!";
	 *      }
	 *
	 *      var AnimalConstructor = R.construct(Animal)
	 *
	 *      // Notice we no longer need the 'new' keyword:
	 *      AnimalConstructor('Pig'); //=> {"kind": "Pig", "sighting": function (){...}};
	 *
	 *      var animalTypes = ["Lion", "Tiger", "Bear"];
	 *      var animalSighting = R.invoker(0, 'sighting');
	 *      var sightNewAnimal = R.compose(animalSighting, AnimalConstructor);
	 *      R.map(sightNewAnimal, animalTypes); //=> ["It's a Lion!", "It's a Tiger!", "It's a Bear!"]
	 */
	module.exports = _curry1(function construct(Fn) {
	  return constructN(Fn.length, Fn);
	});


/***/ },
/* 115 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);
	var curry = __webpack_require__(70);
	var nAry = __webpack_require__(64);


	/**
	 * Wraps a constructor function inside a curried function that can be called
	 * with the same arguments and returns the same type. The arity of the function
	 * returned is specified to allow using variadic constructor functions.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.4.0
	 * @category Function
	 * @sig Number -> (* -> {*}) -> (* -> {*})
	 * @param {Number} n The arity of the constructor function.
	 * @param {Function} Fn The constructor function to wrap.
	 * @return {Function} A wrapped, curried constructor function.
	 * @example
	 *
	 *      // Variadic Constructor function
	 *      function Salad() {
	 *        this.ingredients = arguments;
	 *      };
	 *      Salad.prototype.recipe = function() {
	 *        var instructions = R.map((ingredient) => (
	 *          'Add a whollop of ' + ingredient, this.ingredients)
	 *        )
	 *        return R.join('\n', instructions)
	 *      }
	 *
	 *      var ThreeLayerSalad = R.constructN(3, Salad)
	 *
	 *      // Notice we no longer need the 'new' keyword, and the constructor is curried for 3 arguments.
	 *      var salad = ThreeLayerSalad('Mayonnaise')('Potato Chips')('Ketchup')
	 *      console.log(salad.recipe());
	 *      // Add a whollop of Mayonnaise
	 *      // Add a whollop of Potato Chips
	 *      // Add a whollop of Potato Ketchup
	 */
	module.exports = _curry2(function constructN(n, Fn) {
	  if (n > 10) {
	    throw new Error('Constructor with greater than ten arguments');
	  }
	  if (n === 0) {
	    return function() { return new Fn(); };
	  }
	  return curry(nAry(n, function($0, $1, $2, $3, $4, $5, $6, $7, $8, $9) {
	    switch (arguments.length) {
	      case  1: return new Fn($0);
	      case  2: return new Fn($0, $1);
	      case  3: return new Fn($0, $1, $2);
	      case  4: return new Fn($0, $1, $2, $3);
	      case  5: return new Fn($0, $1, $2, $3, $4);
	      case  6: return new Fn($0, $1, $2, $3, $4, $5);
	      case  7: return new Fn($0, $1, $2, $3, $4, $5, $6);
	      case  8: return new Fn($0, $1, $2, $3, $4, $5, $6, $7);
	      case  9: return new Fn($0, $1, $2, $3, $4, $5, $6, $7, $8);
	      case 10: return new Fn($0, $1, $2, $3, $4, $5, $6, $7, $8, $9);
	    }
	  }));
	});


/***/ },
/* 116 */
/***/ function(module, exports, __webpack_require__) {

	var _contains = __webpack_require__(98);
	var _curry2 = __webpack_require__(16);


	/**
	 * Returns `true` if the specified value is equal, in `R.equals` terms, to at
	 * least one element of the given list; `false` otherwise.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.1.0
	 * @category List
	 * @sig a -> [a] -> Boolean
	 * @param {Object} a The item to compare against.
	 * @param {Array} list The array to consider.
	 * @return {Boolean} `true` if an equivalent item is in the list, `false` otherwise.
	 * @see R.any
	 * @example
	 *
	 *      R.contains(3, [1, 2, 3]); //=> true
	 *      R.contains(4, [1, 2, 3]); //=> false
	 *      R.contains({ name: 'Fred' }, [{ name: 'Fred' }]); //=> true
	 *      R.contains([42], [[42]]); //=> true
	 */
	module.exports = _curry2(_contains);


/***/ },
/* 117 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);
	var _map = __webpack_require__(35);
	var curryN = __webpack_require__(19);
	var max = __webpack_require__(32);
	var pluck = __webpack_require__(33);
	var reduce = __webpack_require__(46);


	/**
	 * Accepts a converging function and a list of branching functions and returns
	 * a new function. When invoked, this new function is applied to some
	 * arguments, each branching function is applied to those same arguments. The
	 * results of each branching function are passed as arguments to the converging
	 * function to produce the return value.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.4.2
	 * @category Function
	 * @sig (x1 -> x2 -> ... -> z) -> [(a -> b -> ... -> x1), (a -> b -> ... -> x2), ...] -> (a -> b -> ... -> z)
	 * @param {Function} after A function. `after` will be invoked with the return values of
	 *        `fn1` and `fn2` as its arguments.
	 * @param {Array} functions A list of functions.
	 * @return {Function} A new function.
	 * @see R.useWith
	 * @example
	 *
	 *      var average = R.converge(R.divide, [R.sum, R.length])
	 *      average([1, 2, 3, 4, 5, 6, 7]) //=> 4
	 *
	 *      var strangeConcat = R.converge(R.concat, [R.toUpper, R.toLower])
	 *      strangeConcat("Yodel") //=> "YODELyodel"
	 *
	 * @symb R.converge(f, [g, h])(a, b) = f(g(a, b), h(a, b))
	 */
	module.exports = _curry2(function converge(after, fns) {
	  return curryN(reduce(max, 0, pluck('length', fns)), function() {
	    var args = arguments;
	    var context = this;
	    return after.apply(context, _map(function(fn) {
	      return fn.apply(context, args);
	    }, fns));
	  });
	});


/***/ },
/* 118 */
/***/ function(module, exports, __webpack_require__) {

	var reduceBy = __webpack_require__(119);


	/**
	 * Counts the elements of a list according to how many match each value of a
	 * key generated by the supplied function. Returns an object mapping the keys
	 * produced by `fn` to the number of occurrences in the list. Note that all
	 * keys are coerced to strings because of how JavaScript objects work.
	 *
	 * Acts as a transducer if a transformer is given in list position.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.1.0
	 * @category Relation
	 * @sig (a -> String) -> [a] -> {*}
	 * @param {Function} fn The function used to map values to keys.
	 * @param {Array} list The list to count elements from.
	 * @return {Object} An object mapping keys to number of occurrences in the list.
	 * @example
	 *
	 *      var numbers = [1.0, 1.1, 1.2, 2.0, 3.0, 2.2];
	 *      R.countBy(Math.floor)(numbers);    //=> {'1': 3, '2': 2, '3': 1}
	 *
	 *      var letters = ['a', 'b', 'A', 'a', 'B', 'c'];
	 *      R.countBy(R.toLower)(letters);   //=> {'a': 3, 'b': 2, 'c': 1}
	 */
	module.exports = reduceBy(function(acc, elem) { return acc + 1; }, 0);


/***/ },
/* 119 */
/***/ function(module, exports, __webpack_require__) {

	var _curryN = __webpack_require__(21);
	var _dispatchable = __webpack_require__(25);
	var _has = __webpack_require__(43);
	var _reduce = __webpack_require__(36);
	var _xreduceBy = __webpack_require__(120);


	/**
	 * Groups the elements of the list according to the result of calling
	 * the String-returning function `keyFn` on each element and reduces the elements
	 * of each group to a single value via the reducer function `valueFn`.
	 *
	 * This function is basically a more general `groupBy` function.
	 *
	 * Acts as a transducer if a transformer is given in list position.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.20.0
	 * @category List
	 * @sig ((a, b) -> a) -> a -> (b -> String) -> [b] -> {String: a}
	 * @param {Function} valueFn The function that reduces the elements of each group to a single
	 *        value. Receives two values, accumulator for a particular group and the current element.
	 * @param {*} acc The (initial) accumulator value for each group.
	 * @param {Function} keyFn The function that maps the list's element into a key.
	 * @param {Array} list The array to group.
	 * @return {Object} An object with the output of `keyFn` for keys, mapped to the output of
	 *         `valueFn` for elements which produced that key when passed to `keyFn`.
	 * @see R.groupBy, R.reduce
	 * @example
	 *
	 *      var reduceToNamesBy = R.reduceBy((acc, student) => acc.concat(student.name), []);
	 *      var namesByGrade = reduceToNamesBy(function(student) {
	 *        var score = student.score;
	 *        return score < 65 ? 'F' :
	 *               score < 70 ? 'D' :
	 *               score < 80 ? 'C' :
	 *               score < 90 ? 'B' : 'A';
	 *      });
	 *      var students = [{name: 'Lucy', score: 92},
	 *                      {name: 'Drew', score: 85},
	 *                      // ...
	 *                      {name: 'Bart', score: 62}];
	 *      namesByGrade(students);
	 *      // {
	 *      //   'A': ['Lucy'],
	 *      //   'B': ['Drew']
	 *      //   // ...,
	 *      //   'F': ['Bart']
	 *      // }
	 */
	module.exports = _curryN(4, [], _dispatchable([], _xreduceBy,
	  function reduceBy(valueFn, valueAcc, keyFn, list) {
	    return _reduce(function(acc, elt) {
	      var key = keyFn(elt);
	      acc[key] = valueFn(_has(key, acc) ? acc[key] : valueAcc, elt);
	      return acc;
	    }, {}, list);
	  }));


/***/ },
/* 120 */
/***/ function(module, exports, __webpack_require__) {

	var _curryN = __webpack_require__(21);
	var _has = __webpack_require__(43);
	var _xfBase = __webpack_require__(30);


	module.exports = (function() {
	  function XReduceBy(valueFn, valueAcc, keyFn, xf) {
	    this.valueFn = valueFn;
	    this.valueAcc = valueAcc;
	    this.keyFn = keyFn;
	    this.xf = xf;
	    this.inputs = {};
	  }
	  XReduceBy.prototype['@@transducer/init'] = _xfBase.init;
	  XReduceBy.prototype['@@transducer/result'] = function(result) {
	    var key;
	    for (key in this.inputs) {
	      if (_has(key, this.inputs)) {
	        result = this.xf['@@transducer/step'](result, this.inputs[key]);
	        if (result['@@transducer/reduced']) {
	          result = result['@@transducer/value'];
	          break;
	        }
	      }
	    }
	    this.inputs = null;
	    return this.xf['@@transducer/result'](result);
	  };
	  XReduceBy.prototype['@@transducer/step'] = function(result, input) {
	    var key = this.keyFn(input);
	    this.inputs[key] = this.inputs[key] || [key, this.valueAcc];
	    this.inputs[key][1] = this.valueFn(this.inputs[key][1], input);
	    return result;
	  };

	  return _curryN(4, [],
	                 function _xreduceBy(valueFn, valueAcc, keyFn, xf) {
	                   return new XReduceBy(valueFn, valueAcc, keyFn, xf);
	                 });
	}());


/***/ },
/* 121 */
/***/ function(module, exports, __webpack_require__) {

	var add = __webpack_require__(15);


	/**
	 * Decrements its argument.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.9.0
	 * @category Math
	 * @sig Number -> Number
	 * @param {Number} n
	 * @return {Number} n - 1
	 * @see R.inc
	 * @example
	 *
	 *      R.dec(42); //=> 41
	 */
	module.exports = add(-1);


/***/ },
/* 122 */
/***/ function(module, exports, __webpack_require__) {

	var _curry3 = __webpack_require__(23);


	/**
	 * Makes a descending comparator function out of a function that returns a value
	 * that can be compared with `<` and `>`.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.23.0
	 * @category Function
	 * @sig Ord b => (a -> b) -> a -> a -> Number
	 * @param {Function} fn A function of arity one that returns a value that can be compared
	 * @param {*} a The first item to be compared.
	 * @param {*} b The second item to be compared.
	 * @return {Number} `-1` if fn(a) > fn(b), `1` if fn(b) > fn(a), otherwise `0`
	 * @example
	 *
	 *      var byAge = R.descend(R.prop('age'));
	 *      var people = [
	 *        // ...
	 *      ];
	 *      var peopleByOldestFirst = R.sort(byAge, people);
	 */
	module.exports = _curry3(function descend(fn, a, b) {
	  var aa = fn(a);
	  var bb = fn(b);
	  return aa > bb ? -1 : aa < bb ? 1 : 0;
	});


/***/ },
/* 123 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);


	/**
	 * Returns the second argument if it is not `null`, `undefined` or `NaN`
	 * otherwise the first argument is returned.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.10.0
	 * @category Logic
	 * @sig a -> b -> a | b
	 * @param {a} default The default value.
	 * @param {b} val `val` will be returned instead of `default` unless `val` is `null`, `undefined` or `NaN`.
	 * @return {*} The second value if it is not `null`, `undefined` or `NaN`, otherwise the default value
	 * @example
	 *
	 *      var defaultTo42 = R.defaultTo(42);
	 *
	 *      defaultTo42(null);  //=> 42
	 *      defaultTo42(undefined);  //=> 42
	 *      defaultTo42('Ramda');  //=> 'Ramda'
	 *      // parseInt('string') results in NaN
	 *      defaultTo42(parseInt('string')); //=> 42
	 */
	module.exports = _curry2(function defaultTo(d, v) {
	  return v == null || v !== v ? d : v;
	});


/***/ },
/* 124 */
/***/ function(module, exports, __webpack_require__) {

	var _contains = __webpack_require__(98);
	var _curry2 = __webpack_require__(16);


	/**
	 * Finds the set (i.e. no duplicates) of all elements in the first list not
	 * contained in the second list. Objects and Arrays are compared are compared
	 * in terms of value equality, not reference equality.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.1.0
	 * @category Relation
	 * @sig [*] -> [*] -> [*]
	 * @param {Array} list1 The first list.
	 * @param {Array} list2 The second list.
	 * @return {Array} The elements in `list1` that are not in `list2`.
	 * @see R.differenceWith, R.symmetricDifference, R.symmetricDifferenceWith
	 * @example
	 *
	 *      R.difference([1,2,3,4], [7,6,5,4,3]); //=> [1,2]
	 *      R.difference([7,6,5,4,3], [1,2,3,4]); //=> [7,6,5]
	 *      R.difference([{a: 1}, {b: 2}], [{a: 1}, {c: 3}]) //=> [{b: 2}]
	 */
	module.exports = _curry2(function difference(first, second) {
	  var out = [];
	  var idx = 0;
	  var firstLen = first.length;
	  while (idx < firstLen) {
	    if (!_contains(first[idx], second) && !_contains(first[idx], out)) {
	      out[out.length] = first[idx];
	    }
	    idx += 1;
	  }
	  return out;
	});


/***/ },
/* 125 */
/***/ function(module, exports, __webpack_require__) {

	var _containsWith = __webpack_require__(126);
	var _curry3 = __webpack_require__(23);


	/**
	 * Finds the set (i.e. no duplicates) of all elements in the first list not
	 * contained in the second list. Duplication is determined according to the
	 * value returned by applying the supplied predicate to two list elements.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.1.0
	 * @category Relation
	 * @sig ((a, a) -> Boolean) -> [a] -> [a] -> [a]
	 * @param {Function} pred A predicate used to test whether two items are equal.
	 * @param {Array} list1 The first list.
	 * @param {Array} list2 The second list.
	 * @return {Array} The elements in `list1` that are not in `list2`.
	 * @see R.difference, R.symmetricDifference, R.symmetricDifferenceWith
	 * @example
	 *
	 *      var cmp = (x, y) => x.a === y.a;
	 *      var l1 = [{a: 1}, {a: 2}, {a: 3}];
	 *      var l2 = [{a: 3}, {a: 4}];
	 *      R.differenceWith(cmp, l1, l2); //=> [{a: 1}, {a: 2}]
	 */
	module.exports = _curry3(function differenceWith(pred, first, second) {
	  var out = [];
	  var idx = 0;
	  var firstLen = first.length;
	  while (idx < firstLen) {
	    if (!_containsWith(pred, first[idx], second) &&
	        !_containsWith(pred, first[idx], out)) {
	      out.push(first[idx]);
	    }
	    idx += 1;
	  }
	  return out;
	});


/***/ },
/* 126 */
/***/ function(module, exports) {

	module.exports = function _containsWith(pred, x, list) {
	  var idx = 0;
	  var len = list.length;

	  while (idx < len) {
	    if (pred(x, list[idx])) {
	      return true;
	    }
	    idx += 1;
	  }
	  return false;
	};


/***/ },
/* 127 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);


	/**
	 * Returns a new object that does not contain a `prop` property.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.10.0
	 * @category Object
	 * @sig String -> {k: v} -> {k: v}
	 * @param {String} prop The name of the property to dissociate
	 * @param {Object} obj The object to clone
	 * @return {Object} A new object equivalent to the original but without the specified property
	 * @see R.assoc
	 * @example
	 *
	 *      R.dissoc('b', {a: 1, b: 2, c: 3}); //=> {a: 1, c: 3}
	 */
	module.exports = _curry2(function dissoc(prop, obj) {
	  var result = {};
	  for (var p in obj) {
	    result[p] = obj[p];
	  }
	  delete result[prop];
	  return result;
	});


/***/ },
/* 128 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);
	var assoc = __webpack_require__(60);
	var dissoc = __webpack_require__(127);


	/**
	 * Makes a shallow clone of an object, omitting the property at the given path.
	 * Note that this copies and flattens prototype properties onto the new object
	 * as well. All non-primitive properties are copied by reference.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.11.0
	 * @category Object
	 * @sig [String] -> {k: v} -> {k: v}
	 * @param {Array} path The path to the value to omit
	 * @param {Object} obj The object to clone
	 * @return {Object} A new object without the property at path
	 * @see R.assocPath
	 * @example
	 *
	 *      R.dissocPath(['a', 'b', 'c'], {a: {b: {c: 42}}}); //=> {a: {b: {}}}
	 */
	module.exports = _curry2(function dissocPath(path, obj) {
	  switch (path.length) {
	    case 0:
	      return obj;
	    case 1:
	      return dissoc(path[0], obj);
	    default:
	      var head = path[0];
	      var tail = Array.prototype.slice.call(path, 1);
	      return obj[head] == null ? obj : assoc(head, dissocPath(tail, obj[head]), obj);
	  }
	});


/***/ },
/* 129 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);


	/**
	 * Divides two numbers. Equivalent to `a / b`.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.1.0
	 * @category Math
	 * @sig Number -> Number -> Number
	 * @param {Number} a The first value.
	 * @param {Number} b The second value.
	 * @return {Number} The result of `a / b`.
	 * @see R.multiply
	 * @example
	 *
	 *      R.divide(71, 100); //=> 0.71
	 *
	 *      var half = R.divide(R.__, 2);
	 *      half(42); //=> 21
	 *
	 *      var reciprocal = R.divide(1);
	 *      reciprocal(4);   //=> 0.25
	 */
	module.exports = _curry2(function divide(a, b) { return a / b; });


/***/ },
/* 130 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);
	var _dispatchable = __webpack_require__(25);
	var _xdrop = __webpack_require__(131);
	var slice = __webpack_require__(89);


	/**
	 * Returns all but the first `n` elements of the given list, string, or
	 * transducer/transformer (or object with a `drop` method).
	 *
	 * Dispatches to the `drop` method of the second argument, if present.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.1.0
	 * @category List
	 * @sig Number -> [a] -> [a]
	 * @sig Number -> String -> String
	 * @param {Number} n
	 * @param {[a]} list
	 * @return {[a]} A copy of list without the first `n` elements
	 * @see R.take, R.transduce, R.dropLast, R.dropWhile
	 * @example
	 *
	 *      R.drop(1, ['foo', 'bar', 'baz']); //=> ['bar', 'baz']
	 *      R.drop(2, ['foo', 'bar', 'baz']); //=> ['baz']
	 *      R.drop(3, ['foo', 'bar', 'baz']); //=> []
	 *      R.drop(4, ['foo', 'bar', 'baz']); //=> []
	 *      R.drop(3, 'ramda');               //=> 'da'
	 */
	module.exports = _curry2(_dispatchable(['drop'], _xdrop, function drop(n, xs) {
	  return slice(Math.max(0, n), Infinity, xs);
	}));


/***/ },
/* 131 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);
	var _xfBase = __webpack_require__(30);


	module.exports = (function() {
	  function XDrop(n, xf) {
	    this.xf = xf;
	    this.n = n;
	  }
	  XDrop.prototype['@@transducer/init'] = _xfBase.init;
	  XDrop.prototype['@@transducer/result'] = _xfBase.result;
	  XDrop.prototype['@@transducer/step'] = function(result, input) {
	    if (this.n > 0) {
	      this.n -= 1;
	      return result;
	    }
	    return this.xf['@@transducer/step'](result, input);
	  };

	  return _curry2(function _xdrop(n, xf) { return new XDrop(n, xf); });
	}());


/***/ },
/* 132 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);
	var _dispatchable = __webpack_require__(25);
	var _dropLast = __webpack_require__(133);
	var _xdropLast = __webpack_require__(136);


	/**
	 * Returns a list containing all but the last `n` elements of the given `list`.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.16.0
	 * @category List
	 * @sig Number -> [a] -> [a]
	 * @sig Number -> String -> String
	 * @param {Number} n The number of elements of `list` to skip.
	 * @param {Array} list The list of elements to consider.
	 * @return {Array} A copy of the list with only the first `list.length - n` elements
	 * @see R.takeLast, R.drop, R.dropWhile, R.dropLastWhile
	 * @example
	 *
	 *      R.dropLast(1, ['foo', 'bar', 'baz']); //=> ['foo', 'bar']
	 *      R.dropLast(2, ['foo', 'bar', 'baz']); //=> ['foo']
	 *      R.dropLast(3, ['foo', 'bar', 'baz']); //=> []
	 *      R.dropLast(4, ['foo', 'bar', 'baz']); //=> []
	 *      R.dropLast(3, 'ramda');               //=> 'ra'
	 */
	module.exports = _curry2(_dispatchable([], _xdropLast, _dropLast));


/***/ },
/* 133 */
/***/ function(module, exports, __webpack_require__) {

	var take = __webpack_require__(134);

	module.exports = function dropLast(n, xs) {
	  return take(n < xs.length ? xs.length - n : 0, xs);
	};


/***/ },
/* 134 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);
	var _dispatchable = __webpack_require__(25);
	var _xtake = __webpack_require__(135);
	var slice = __webpack_require__(89);


	/**
	 * Returns the first `n` elements of the given list, string, or
	 * transducer/transformer (or object with a `take` method).
	 *
	 * Dispatches to the `take` method of the second argument, if present.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.1.0
	 * @category List
	 * @sig Number -> [a] -> [a]
	 * @sig Number -> String -> String
	 * @param {Number} n
	 * @param {*} list
	 * @return {*}
	 * @see R.drop
	 * @example
	 *
	 *      R.take(1, ['foo', 'bar', 'baz']); //=> ['foo']
	 *      R.take(2, ['foo', 'bar', 'baz']); //=> ['foo', 'bar']
	 *      R.take(3, ['foo', 'bar', 'baz']); //=> ['foo', 'bar', 'baz']
	 *      R.take(4, ['foo', 'bar', 'baz']); //=> ['foo', 'bar', 'baz']
	 *      R.take(3, 'ramda');               //=> 'ram'
	 *
	 *      var personnel = [
	 *        'Dave Brubeck',
	 *        'Paul Desmond',
	 *        'Eugene Wright',
	 *        'Joe Morello',
	 *        'Gerry Mulligan',
	 *        'Bob Bates',
	 *        'Joe Dodge',
	 *        'Ron Crotty'
	 *      ];
	 *
	 *      var takeFive = R.take(5);
	 *      takeFive(personnel);
	 *      //=> ['Dave Brubeck', 'Paul Desmond', 'Eugene Wright', 'Joe Morello', 'Gerry Mulligan']
	 * @symb R.take(-1, [a, b]) = [a, b]
	 * @symb R.take(0, [a, b]) = []
	 * @symb R.take(1, [a, b]) = [a]
	 * @symb R.take(2, [a, b]) = [a, b]
	 */
	module.exports = _curry2(_dispatchable(['take'], _xtake, function take(n, xs) {
	  return slice(0, n < 0 ? Infinity : n, xs);
	}));


/***/ },
/* 135 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);
	var _reduced = __webpack_require__(29);
	var _xfBase = __webpack_require__(30);

	module.exports = (function() {
	  function XTake(n, xf) {
	    this.xf = xf;
	    this.n = n;
	    this.i = 0;
	  }
	  XTake.prototype['@@transducer/init'] = _xfBase.init;
	  XTake.prototype['@@transducer/result'] = _xfBase.result;
	  XTake.prototype['@@transducer/step'] = function(result, input) {
	    this.i += 1;
	    var ret = this.n === 0 ? result : this.xf['@@transducer/step'](result, input);
	    return this.i >= this.n ? _reduced(ret) : ret;
	  };

	  return _curry2(function _xtake(n, xf) { return new XTake(n, xf); });
	}());


/***/ },
/* 136 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);
	var _xfBase = __webpack_require__(30);


	module.exports = (function() {
	  function XDropLast(n, xf) {
	    this.xf = xf;
	    this.pos = 0;
	    this.full = false;
	    this.acc = new Array(n);
	  }
	  XDropLast.prototype['@@transducer/init'] = _xfBase.init;
	  XDropLast.prototype['@@transducer/result'] =  function(result) {
	    this.acc = null;
	    return this.xf['@@transducer/result'](result);
	  };
	  XDropLast.prototype['@@transducer/step'] = function(result, input) {
	    if (this.full) {
	      result = this.xf['@@transducer/step'](result, this.acc[this.pos]);
	    }
	    this.store(input);
	    return result;
	  };
	  XDropLast.prototype.store = function(input) {
	    this.acc[this.pos] = input;
	    this.pos += 1;
	    if (this.pos === this.acc.length) {
	      this.pos = 0;
	      this.full = true;
	    }
	  };

	  return _curry2(function _xdropLast(n, xf) { return new XDropLast(n, xf); });
	}());


/***/ },
/* 137 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);
	var _dispatchable = __webpack_require__(25);
	var _dropLastWhile = __webpack_require__(138);
	var _xdropLastWhile = __webpack_require__(139);


	/**
	 * Returns a new list excluding all the tailing elements of a given list which
	 * satisfy the supplied predicate function. It passes each value from the right
	 * to the supplied predicate function, skipping elements until the predicate
	 * function returns a `falsy` value. The predicate function is applied to one argument:
	 * *(value)*.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.16.0
	 * @category List
	 * @sig (a -> Boolean) -> [a] -> [a]
	 * @param {Function} predicate The function to be called on each element
	 * @param {Array} list The collection to iterate over.
	 * @return {Array} A new array without any trailing elements that return `falsy` values from the `predicate`.
	 * @see R.takeLastWhile, R.addIndex, R.drop, R.dropWhile
	 * @example
	 *
	 *      var lteThree = x => x <= 3;
	 *
	 *      R.dropLastWhile(lteThree, [1, 2, 3, 4, 3, 2, 1]); //=> [1, 2, 3, 4]
	 */
	module.exports = _curry2(_dispatchable([], _xdropLastWhile, _dropLastWhile));


/***/ },
/* 138 */
/***/ function(module, exports) {

	module.exports = function dropLastWhile(pred, list) {
	  var idx = list.length - 1;
	  while (idx >= 0 && pred(list[idx])) {
	    idx -= 1;
	  }
	  return Array.prototype.slice.call(list, 0, idx + 1);
	};


/***/ },
/* 139 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);
	var _reduce = __webpack_require__(36);
	var _xfBase = __webpack_require__(30);

	module.exports = (function() {
	  function XDropLastWhile(fn, xf) {
	    this.f = fn;
	    this.retained = [];
	    this.xf = xf;
	  }
	  XDropLastWhile.prototype['@@transducer/init'] = _xfBase.init;
	  XDropLastWhile.prototype['@@transducer/result'] = function(result) {
	    this.retained = null;
	    return this.xf['@@transducer/result'](result);
	  };
	  XDropLastWhile.prototype['@@transducer/step'] = function(result, input) {
	    return this.f(input) ? this.retain(result, input)
	                         : this.flush(result, input);
	  };
	  XDropLastWhile.prototype.flush = function(result, input) {
	    result = _reduce(
	      this.xf['@@transducer/step'],
	      result,
	      this.retained
	    );
	    this.retained = [];
	    return this.xf['@@transducer/step'](result, input);
	  };
	  XDropLastWhile.prototype.retain = function(result, input) {
	    this.retained.push(input);
	    return result;
	  };

	  return _curry2(function _xdropLastWhile(fn, xf) { return new XDropLastWhile(fn, xf); });
	}());


/***/ },
/* 140 */
/***/ function(module, exports, __webpack_require__) {

	var _curry1 = __webpack_require__(11);
	var _dispatchable = __webpack_require__(25);
	var _xdropRepeatsWith = __webpack_require__(141);
	var dropRepeatsWith = __webpack_require__(142);
	var equals = __webpack_require__(100);


	/**
	 * Returns a new list without any consecutively repeating elements. `R.equals`
	 * is used to determine equality.
	 *
	 * Acts as a transducer if a transformer is given in list position.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.14.0
	 * @category List
	 * @sig [a] -> [a]
	 * @param {Array} list The array to consider.
	 * @return {Array} `list` without repeating elements.
	 * @see R.transduce
	 * @example
	 *
	 *     R.dropRepeats([1, 1, 1, 2, 3, 4, 4, 2, 2]); //=> [1, 2, 3, 4, 2]
	 */
	module.exports = _curry1(_dispatchable([], _xdropRepeatsWith(equals), dropRepeatsWith(equals)));


/***/ },
/* 141 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);
	var _xfBase = __webpack_require__(30);


	module.exports = (function() {
	  function XDropRepeatsWith(pred, xf) {
	    this.xf = xf;
	    this.pred = pred;
	    this.lastValue = undefined;
	    this.seenFirstValue = false;
	  }

	  XDropRepeatsWith.prototype['@@transducer/init'] = _xfBase.init;
	  XDropRepeatsWith.prototype['@@transducer/result'] = _xfBase.result;
	  XDropRepeatsWith.prototype['@@transducer/step'] = function(result, input) {
	    var sameAsLast = false;
	    if (!this.seenFirstValue) {
	      this.seenFirstValue = true;
	    } else if (this.pred(this.lastValue, input)) {
	      sameAsLast = true;
	    }
	    this.lastValue = input;
	    return sameAsLast ? result : this.xf['@@transducer/step'](result, input);
	  };

	  return _curry2(function _xdropRepeatsWith(pred, xf) { return new XDropRepeatsWith(pred, xf); });
	}());


/***/ },
/* 142 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);
	var _dispatchable = __webpack_require__(25);
	var _xdropRepeatsWith = __webpack_require__(141);
	var last = __webpack_require__(143);


	/**
	 * Returns a new list without any consecutively repeating elements. Equality is
	 * determined by applying the supplied predicate to each pair of consecutive elements. The
	 * first element in a series of equal elements will be preserved.
	 *
	 * Acts as a transducer if a transformer is given in list position.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.14.0
	 * @category List
	 * @sig (a, a -> Boolean) -> [a] -> [a]
	 * @param {Function} pred A predicate used to test whether two items are equal.
	 * @param {Array} list The array to consider.
	 * @return {Array} `list` without repeating elements.
	 * @see R.transduce
	 * @example
	 *
	 *      var l = [1, -1, 1, 3, 4, -4, -4, -5, 5, 3, 3];
	 *      R.dropRepeatsWith(R.eqBy(Math.abs), l); //=> [1, 3, 4, -5, 3]
	 */
	module.exports = _curry2(_dispatchable([], _xdropRepeatsWith, function dropRepeatsWith(pred, list) {
	  var result = [];
	  var idx = 1;
	  var len = list.length;
	  if (len !== 0) {
	    result[0] = list[0];
	    while (idx < len) {
	      if (!pred(last(result), list[idx])) {
	        result[result.length] = list[idx];
	      }
	      idx += 1;
	    }
	  }
	  return result;
	}));



/***/ },
/* 143 */
/***/ function(module, exports, __webpack_require__) {

	var nth = __webpack_require__(144);


	/**
	 * Returns the last element of the given list or string.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.1.4
	 * @category List
	 * @sig [a] -> a | Undefined
	 * @sig String -> String
	 * @param {*} list
	 * @return {*}
	 * @see R.init, R.head, R.tail
	 * @example
	 *
	 *      R.last(['fi', 'fo', 'fum']); //=> 'fum'
	 *      R.last([]); //=> undefined
	 *
	 *      R.last('abc'); //=> 'c'
	 *      R.last(''); //=> ''
	 */
	module.exports = nth(-1);


/***/ },
/* 144 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);
	var _isString = __webpack_require__(40);


	/**
	 * Returns the nth element of the given list or string. If n is negative the
	 * element at index length + n is returned.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.1.0
	 * @category List
	 * @sig Number -> [a] -> a | Undefined
	 * @sig Number -> String -> String
	 * @param {Number} offset
	 * @param {*} list
	 * @return {*}
	 * @example
	 *
	 *      var list = ['foo', 'bar', 'baz', 'quux'];
	 *      R.nth(1, list); //=> 'bar'
	 *      R.nth(-1, list); //=> 'quux'
	 *      R.nth(-99, list); //=> undefined
	 *
	 *      R.nth(2, 'abc'); //=> 'c'
	 *      R.nth(3, 'abc'); //=> ''
	 * @symb R.nth(-1, [a, b, c]) = c
	 * @symb R.nth(0, [a, b, c]) = a
	 * @symb R.nth(1, [a, b, c]) = b
	 */
	module.exports = _curry2(function nth(offset, list) {
	  var idx = offset < 0 ? list.length + offset : offset;
	  return _isString(list) ? list.charAt(idx) : list[idx];
	});


/***/ },
/* 145 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);
	var _dispatchable = __webpack_require__(25);
	var _xdropWhile = __webpack_require__(146);


	/**
	 * Returns a new list excluding the leading elements of a given list which
	 * satisfy the supplied predicate function. It passes each value to the supplied
	 * predicate function, skipping elements while the predicate function returns
	 * `true`. The predicate function is applied to one argument: *(value)*.
	 *
	 * Dispatches to the `dropWhile` method of the second argument, if present.
	 *
	 * Acts as a transducer if a transformer is given in list position.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.9.0
	 * @category List
	 * @sig (a -> Boolean) -> [a] -> [a]
	 * @param {Function} fn The function called per iteration.
	 * @param {Array} list The collection to iterate over.
	 * @return {Array} A new array.
	 * @see R.takeWhile, R.transduce, R.addIndex
	 * @example
	 *
	 *      var lteTwo = x => x <= 2;
	 *
	 *      R.dropWhile(lteTwo, [1, 2, 3, 4, 3, 2, 1]); //=> [3, 4, 3, 2, 1]
	 */
	module.exports = _curry2(_dispatchable(['dropWhile'], _xdropWhile, function dropWhile(pred, list) {
	  var idx = 0;
	  var len = list.length;
	  while (idx < len && pred(list[idx])) {
	    idx += 1;
	  }
	  return Array.prototype.slice.call(list, idx);
	}));


/***/ },
/* 146 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);
	var _xfBase = __webpack_require__(30);


	module.exports = (function() {
	  function XDropWhile(f, xf) {
	    this.xf = xf;
	    this.f = f;
	  }
	  XDropWhile.prototype['@@transducer/init'] = _xfBase.init;
	  XDropWhile.prototype['@@transducer/result'] = _xfBase.result;
	  XDropWhile.prototype['@@transducer/step'] = function(result, input) {
	    if (this.f) {
	      if (this.f(input)) {
	        return result;
	      }
	      this.f = null;
	    }
	    return this.xf['@@transducer/step'](result, input);
	  };

	  return _curry2(function _xdropWhile(f, xf) { return new XDropWhile(f, xf); });
	}());


/***/ },
/* 147 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);
	var _isFunction = __webpack_require__(66);
	var lift = __webpack_require__(67);
	var or = __webpack_require__(148);


	/**
	 * A function wrapping calls to the two functions in an `||` operation,
	 * returning the result of the first function if it is truth-y and the result
	 * of the second function otherwise. Note that this is short-circuited,
	 * meaning that the second function will not be invoked if the first returns a
	 * truth-y value.
	 *
	 * In addition to functions, `R.either` also accepts any fantasy-land compatible
	 * applicative functor.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.12.0
	 * @category Logic
	 * @sig (*... -> Boolean) -> (*... -> Boolean) -> (*... -> Boolean)
	 * @param {Function} f a predicate
	 * @param {Function} g another predicate
	 * @return {Function} a function that applies its arguments to `f` and `g` and `||`s their outputs together.
	 * @see R.or
	 * @example
	 *
	 *      var gt10 = x => x > 10;
	 *      var even = x => x % 2 === 0;
	 *      var f = R.either(gt10, even);
	 *      f(101); //=> true
	 *      f(8); //=> true
	 */
	module.exports = _curry2(function either(f, g) {
	  return _isFunction(f) ?
	    function _either() {
	      return f.apply(this, arguments) || g.apply(this, arguments);
	    } :
	    lift(or)(f, g);
	});


/***/ },
/* 148 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);


	/**
	 * Returns `true` if one or both of its arguments are `true`. Returns `false`
	 * if both arguments are `false`.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.1.0
	 * @category Logic
	 * @sig a -> b -> a | b
	 * @param {Any} a
	 * @param {Any} b
	 * @return {Any} the first argument if truthy, otherwise the second argument.
	 * @see R.either
	 * @example
	 *
	 *      R.or(true, true); //=> true
	 *      R.or(true, false); //=> true
	 *      R.or(false, true); //=> true
	 *      R.or(false, false); //=> false
	 */
	module.exports = _curry2(function or(a, b) {
	  return a || b;
	});


/***/ },
/* 149 */
/***/ function(module, exports, __webpack_require__) {

	var _curry1 = __webpack_require__(11);
	var _isArguments = __webpack_require__(44);
	var _isArray = __webpack_require__(26);
	var _isObject = __webpack_require__(111);
	var _isString = __webpack_require__(40);


	/**
	 * Returns the empty value of its argument's type. Ramda defines the empty
	 * value of Array (`[]`), Object (`{}`), String (`''`), and Arguments. Other
	 * types are supported if they define `<Type>.empty` and/or
	 * `<Type>.prototype.empty`.
	 *
	 * Dispatches to the `empty` method of the first argument, if present.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.3.0
	 * @category Function
	 * @sig a -> a
	 * @param {*} x
	 * @return {*}
	 * @example
	 *
	 *      R.empty(Just(42));      //=> Nothing()
	 *      R.empty([1, 2, 3]);     //=> []
	 *      R.empty('unicorns');    //=> ''
	 *      R.empty({x: 1, y: 2});  //=> {}
	 */
	module.exports = _curry1(function empty(x) {
	  return (
	    (x != null && typeof x.empty === 'function') ?
	      x.empty() :
	    (x != null && x.constructor != null && typeof x.constructor.empty === 'function') ?
	      x.constructor.empty() :
	    _isArray(x) ?
	      [] :
	    _isString(x) ?
	      '' :
	    _isObject(x) ?
	      {} :
	    _isArguments(x) ?
	      (function() { return arguments; }()) :
	    // else
	      void 0
	  );
	});


/***/ },
/* 150 */
/***/ function(module, exports, __webpack_require__) {

	var _curry3 = __webpack_require__(23);
	var equals = __webpack_require__(100);


	/**
	 * Takes a function and two values in its domain and returns `true` if the
	 * values map to the same value in the codomain; `false` otherwise.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.18.0
	 * @category Relation
	 * @sig (a -> b) -> a -> a -> Boolean
	 * @param {Function} f
	 * @param {*} x
	 * @param {*} y
	 * @return {Boolean}
	 * @example
	 *
	 *      R.eqBy(Math.abs, 5, -5); //=> true
	 */
	module.exports = _curry3(function eqBy(f, x, y) {
	  return equals(f(x), f(y));
	});


/***/ },
/* 151 */
/***/ function(module, exports, __webpack_require__) {

	var _curry3 = __webpack_require__(23);
	var equals = __webpack_require__(100);


	/**
	 * Reports whether two objects have the same value, in `R.equals` terms, for
	 * the specified property. Useful as a curried predicate.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.1.0
	 * @category Object
	 * @sig k -> {k: v} -> {k: v} -> Boolean
	 * @param {String} prop The name of the property to compare
	 * @param {Object} obj1
	 * @param {Object} obj2
	 * @return {Boolean}
	 *
	 * @example
	 *
	 *      var o1 = { a: 1, b: 2, c: 3, d: 4 };
	 *      var o2 = { a: 10, b: 20, c: 3, d: 40 };
	 *      R.eqProps('a', o1, o2); //=> false
	 *      R.eqProps('c', o1, o2); //=> true
	 */
	module.exports = _curry3(function eqProps(prop, obj1, obj2) {
	  return equals(obj1[prop], obj2[prop]);
	});


/***/ },
/* 152 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);


	/**
	 * Creates a new object by recursively evolving a shallow copy of `object`,
	 * according to the `transformation` functions. All non-primitive properties
	 * are copied by reference.
	 *
	 * A `transformation` function will not be invoked if its corresponding key
	 * does not exist in the evolved object.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.9.0
	 * @category Object
	 * @sig {k: (v -> v)} -> {k: v} -> {k: v}
	 * @param {Object} transformations The object specifying transformation functions to apply
	 *        to the object.
	 * @param {Object} object The object to be transformed.
	 * @return {Object} The transformed object.
	 * @example
	 *
	 *      var tomato  = {firstName: '  Tomato ', data: {elapsed: 100, remaining: 1400}, id:123};
	 *      var transformations = {
	 *        firstName: R.trim,
	 *        lastName: R.trim, // Will not get invoked.
	 *        data: {elapsed: R.add(1), remaining: R.add(-1)}
	 *      };
	 *      R.evolve(transformations, tomato); //=> {firstName: 'Tomato', data: {elapsed: 101, remaining: 1399}, id:123}
	 */
	module.exports = _curry2(function evolve(transformations, object) {
	  var result = {};
	  var transformation, key, type;
	  for (key in object) {
	    transformation = transformations[key];
	    type = typeof transformation;
	    result[key] = type === 'function'                 ? transformation(object[key])
	                : transformation && type === 'object' ? evolve(transformation, object[key])
	                                                      : object[key];
	  }
	  return result;
	});


/***/ },
/* 153 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);
	var _dispatchable = __webpack_require__(25);
	var _xfind = __webpack_require__(154);


	/**
	 * Returns the first element of the list which matches the predicate, or
	 * `undefined` if no element matches.
	 *
	 * Dispatches to the `find` method of the second argument, if present.
	 *
	 * Acts as a transducer if a transformer is given in list position.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.1.0
	 * @category List
	 * @sig (a -> Boolean) -> [a] -> a | undefined
	 * @param {Function} fn The predicate function used to determine if the element is the
	 *        desired one.
	 * @param {Array} list The array to consider.
	 * @return {Object} The element found, or `undefined`.
	 * @see R.transduce
	 * @example
	 *
	 *      var xs = [{a: 1}, {a: 2}, {a: 3}];
	 *      R.find(R.propEq('a', 2))(xs); //=> {a: 2}
	 *      R.find(R.propEq('a', 4))(xs); //=> undefined
	 */
	module.exports = _curry2(_dispatchable(['find'], _xfind, function find(fn, list) {
	  var idx = 0;
	  var len = list.length;
	  while (idx < len) {
	    if (fn(list[idx])) {
	      return list[idx];
	    }
	    idx += 1;
	  }
	}));


/***/ },
/* 154 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);
	var _reduced = __webpack_require__(29);
	var _xfBase = __webpack_require__(30);


	module.exports = (function() {
	  function XFind(f, xf) {
	    this.xf = xf;
	    this.f = f;
	    this.found = false;
	  }
	  XFind.prototype['@@transducer/init'] = _xfBase.init;
	  XFind.prototype['@@transducer/result'] = function(result) {
	    if (!this.found) {
	      result = this.xf['@@transducer/step'](result, void 0);
	    }
	    return this.xf['@@transducer/result'](result);
	  };
	  XFind.prototype['@@transducer/step'] = function(result, input) {
	    if (this.f(input)) {
	      this.found = true;
	      result = _reduced(this.xf['@@transducer/step'](result, input));
	    }
	    return result;
	  };

	  return _curry2(function _xfind(f, xf) { return new XFind(f, xf); });
	}());


/***/ },
/* 155 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);
	var _dispatchable = __webpack_require__(25);
	var _xfindIndex = __webpack_require__(156);


	/**
	 * Returns the index of the first element of the list which matches the
	 * predicate, or `-1` if no element matches.
	 *
	 * Acts as a transducer if a transformer is given in list position.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.1.1
	 * @category List
	 * @sig (a -> Boolean) -> [a] -> Number
	 * @param {Function} fn The predicate function used to determine if the element is the
	 * desired one.
	 * @param {Array} list The array to consider.
	 * @return {Number} The index of the element found, or `-1`.
	 * @see R.transduce
	 * @example
	 *
	 *      var xs = [{a: 1}, {a: 2}, {a: 3}];
	 *      R.findIndex(R.propEq('a', 2))(xs); //=> 1
	 *      R.findIndex(R.propEq('a', 4))(xs); //=> -1
	 */
	module.exports = _curry2(_dispatchable([], _xfindIndex, function findIndex(fn, list) {
	  var idx = 0;
	  var len = list.length;
	  while (idx < len) {
	    if (fn(list[idx])) {
	      return idx;
	    }
	    idx += 1;
	  }
	  return -1;
	}));


/***/ },
/* 156 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);
	var _reduced = __webpack_require__(29);
	var _xfBase = __webpack_require__(30);


	module.exports = (function() {
	  function XFindIndex(f, xf) {
	    this.xf = xf;
	    this.f = f;
	    this.idx = -1;
	    this.found = false;
	  }
	  XFindIndex.prototype['@@transducer/init'] = _xfBase.init;
	  XFindIndex.prototype['@@transducer/result'] = function(result) {
	    if (!this.found) {
	      result = this.xf['@@transducer/step'](result, -1);
	    }
	    return this.xf['@@transducer/result'](result);
	  };
	  XFindIndex.prototype['@@transducer/step'] = function(result, input) {
	    this.idx += 1;
	    if (this.f(input)) {
	      this.found = true;
	      result = _reduced(this.xf['@@transducer/step'](result, this.idx));
	    }
	    return result;
	  };

	  return _curry2(function _xfindIndex(f, xf) { return new XFindIndex(f, xf); });
	}());


/***/ },
/* 157 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);
	var _dispatchable = __webpack_require__(25);
	var _xfindLast = __webpack_require__(158);


	/**
	 * Returns the last element of the list which matches the predicate, or
	 * `undefined` if no element matches.
	 *
	 * Acts as a transducer if a transformer is given in list position.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.1.1
	 * @category List
	 * @sig (a -> Boolean) -> [a] -> a | undefined
	 * @param {Function} fn The predicate function used to determine if the element is the
	 * desired one.
	 * @param {Array} list The array to consider.
	 * @return {Object} The element found, or `undefined`.
	 * @see R.transduce
	 * @example
	 *
	 *      var xs = [{a: 1, b: 0}, {a:1, b: 1}];
	 *      R.findLast(R.propEq('a', 1))(xs); //=> {a: 1, b: 1}
	 *      R.findLast(R.propEq('a', 4))(xs); //=> undefined
	 */
	module.exports = _curry2(_dispatchable([], _xfindLast, function findLast(fn, list) {
	  var idx = list.length - 1;
	  while (idx >= 0) {
	    if (fn(list[idx])) {
	      return list[idx];
	    }
	    idx -= 1;
	  }
	}));


/***/ },
/* 158 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);
	var _xfBase = __webpack_require__(30);


	module.exports = (function() {
	  function XFindLast(f, xf) {
	    this.xf = xf;
	    this.f = f;
	  }
	  XFindLast.prototype['@@transducer/init'] = _xfBase.init;
	  XFindLast.prototype['@@transducer/result'] = function(result) {
	    return this.xf['@@transducer/result'](this.xf['@@transducer/step'](result, this.last));
	  };
	  XFindLast.prototype['@@transducer/step'] = function(result, input) {
	    if (this.f(input)) {
	      this.last = input;
	    }
	    return result;
	  };

	  return _curry2(function _xfindLast(f, xf) { return new XFindLast(f, xf); });
	}());


/***/ },
/* 159 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);
	var _dispatchable = __webpack_require__(25);
	var _xfindLastIndex = __webpack_require__(160);


	/**
	 * Returns the index of the last element of the list which matches the
	 * predicate, or `-1` if no element matches.
	 *
	 * Acts as a transducer if a transformer is given in list position.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.1.1
	 * @category List
	 * @sig (a -> Boolean) -> [a] -> Number
	 * @param {Function} fn The predicate function used to determine if the element is the
	 * desired one.
	 * @param {Array} list The array to consider.
	 * @return {Number} The index of the element found, or `-1`.
	 * @see R.transduce
	 * @example
	 *
	 *      var xs = [{a: 1, b: 0}, {a:1, b: 1}];
	 *      R.findLastIndex(R.propEq('a', 1))(xs); //=> 1
	 *      R.findLastIndex(R.propEq('a', 4))(xs); //=> -1
	 */
	module.exports = _curry2(_dispatchable([], _xfindLastIndex, function findLastIndex(fn, list) {
	  var idx = list.length - 1;
	  while (idx >= 0) {
	    if (fn(list[idx])) {
	      return idx;
	    }
	    idx -= 1;
	  }
	  return -1;
	}));


/***/ },
/* 160 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);
	var _xfBase = __webpack_require__(30);


	module.exports = (function() {
	  function XFindLastIndex(f, xf) {
	    this.xf = xf;
	    this.f = f;
	    this.idx = -1;
	    this.lastIdx = -1;
	  }
	  XFindLastIndex.prototype['@@transducer/init'] = _xfBase.init;
	  XFindLastIndex.prototype['@@transducer/result'] = function(result) {
	    return this.xf['@@transducer/result'](this.xf['@@transducer/step'](result, this.lastIdx));
	  };
	  XFindLastIndex.prototype['@@transducer/step'] = function(result, input) {
	    this.idx += 1;
	    if (this.f(input)) {
	      this.lastIdx = this.idx;
	    }
	    return result;
	  };

	  return _curry2(function _xfindLastIndex(f, xf) { return new XFindLastIndex(f, xf); });
	}());


/***/ },
/* 161 */
/***/ function(module, exports, __webpack_require__) {

	var _curry1 = __webpack_require__(11);
	var _makeFlat = __webpack_require__(72);


	/**
	 * Returns a new list by pulling every item out of it (and all its sub-arrays)
	 * and putting them in a new array, depth-first.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.1.0
	 * @category List
	 * @sig [a] -> [b]
	 * @param {Array} list The array to consider.
	 * @return {Array} The flattened list.
	 * @see R.unnest
	 * @example
	 *
	 *      R.flatten([1, 2, [3, 4], 5, [6, [7, 8, [9, [10, 11], 12]]]]);
	 *      //=> [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
	 */
	module.exports = _curry1(_makeFlat(true));


/***/ },
/* 162 */
/***/ function(module, exports, __webpack_require__) {

	var _curry1 = __webpack_require__(11);
	var curry = __webpack_require__(70);


	/**
	 * Returns a new function much like the supplied one, except that the first two
	 * arguments' order is reversed.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.1.0
	 * @category Function
	 * @sig (a -> b -> c -> ... -> z) -> (b -> a -> c -> ... -> z)
	 * @param {Function} fn The function to invoke with its first two parameters reversed.
	 * @return {*} The result of invoking `fn` with its first two parameters' order reversed.
	 * @example
	 *
	 *      var mergeThree = (a, b, c) => [].concat(a, b, c);
	 *
	 *      mergeThree(1, 2, 3); //=> [1, 2, 3]
	 *
	 *      R.flip(mergeThree)(1, 2, 3); //=> [2, 1, 3]
	 * @symb R.flip(f)(a, b, c) = f(b, a, c)
	 */
	module.exports = _curry1(function flip(fn) {
	  return curry(function(a, b) {
	    var args = Array.prototype.slice.call(arguments, 0);
	    args[0] = b;
	    args[1] = a;
	    return fn.apply(this, args);
	  });
	});


/***/ },
/* 163 */
/***/ function(module, exports, __webpack_require__) {

	var _checkForMethod = __webpack_require__(88);
	var _curry2 = __webpack_require__(16);


	/**
	 * Iterate over an input `list`, calling a provided function `fn` for each
	 * element in the list.
	 *
	 * `fn` receives one argument: *(value)*.
	 *
	 * Note: `R.forEach` does not skip deleted or unassigned indices (sparse
	 * arrays), unlike the native `Array.prototype.forEach` method. For more
	 * details on this behavior, see:
	 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach#Description
	 *
	 * Also note that, unlike `Array.prototype.forEach`, Ramda's `forEach` returns
	 * the original array. In some libraries this function is named `each`.
	 *
	 * Dispatches to the `forEach` method of the second argument, if present.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.1.1
	 * @category List
	 * @sig (a -> *) -> [a] -> [a]
	 * @param {Function} fn The function to invoke. Receives one argument, `value`.
	 * @param {Array} list The list to iterate over.
	 * @return {Array} The original list.
	 * @see R.addIndex
	 * @example
	 *
	 *      var printXPlusFive = x => console.log(x + 5);
	 *      R.forEach(printXPlusFive, [1, 2, 3]); //=> [1, 2, 3]
	 *      // logs 6
	 *      // logs 7
	 *      // logs 8
	 * @symb R.forEach(f, [a, b, c]) = [a, b, c]
	 */
	module.exports = _curry2(_checkForMethod('forEach', function forEach(fn, list) {
	  var len = list.length;
	  var idx = 0;
	  while (idx < len) {
	    fn(list[idx]);
	    idx += 1;
	  }
	  return list;
	}));


/***/ },
/* 164 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);
	var keys = __webpack_require__(42);


	/**
	 * Iterate over an input `object`, calling a provided function `fn` for each
	 * key and value in the object.
	 *
	 * `fn` receives three argument: *(value, key, obj)*.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.23.0
	 * @category Object
	 * @sig ((a, String, StrMap a) -> Any) -> StrMap a -> StrMap a
	 * @param {Function} fn The function to invoke. Receives three argument, `value`, `key`, `obj`.
	 * @param {Object} obj The object to iterate over.
	 * @return {Object} The original object.
	 * @example
	 *
	 *      var printKeyConcatValue = (value, key) => console.log(key + ':' + value);
	 *      R.forEachObjIndexed(printKeyConcatValue, {x: 1, y: 2}); //=> {x: 1, y: 2}
	 *      // logs x:1
	 *      // logs y:2
	 * @symb R.forEachObjIndexed(f, {x: a, y: b}) = {x: a, y: b}
	 */
	module.exports = _curry2(function forEachObjIndexed(fn, obj) {
	  var keyList = keys(obj);
	  var idx = 0;
	  while (idx < keyList.length) {
	    var key = keyList[idx];
	    fn(obj[key], key, obj);
	    idx += 1;
	  }
	  return obj;
	});


/***/ },
/* 165 */
/***/ function(module, exports, __webpack_require__) {

	var _curry1 = __webpack_require__(11);


	/**
	 * Creates a new object from a list key-value pairs. If a key appears in
	 * multiple pairs, the rightmost pair is included in the object.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.3.0
	 * @category List
	 * @sig [[k,v]] -> {k: v}
	 * @param {Array} pairs An array of two-element arrays that will be the keys and values of the output object.
	 * @return {Object} The object made by pairing up `keys` and `values`.
	 * @see R.toPairs, R.pair
	 * @example
	 *
	 *      R.fromPairs([['a', 1], ['b', 2], ['c', 3]]); //=> {a: 1, b: 2, c: 3}
	 */
	module.exports = _curry1(function fromPairs(pairs) {
	  var result = {};
	  var idx = 0;
	  while (idx < pairs.length) {
	    result[pairs[idx][0]] = pairs[idx][1];
	    idx += 1;
	  }
	  return result;
	});


/***/ },
/* 166 */
/***/ function(module, exports, __webpack_require__) {

	var _checkForMethod = __webpack_require__(88);
	var _curry2 = __webpack_require__(16);
	var reduceBy = __webpack_require__(119);

	/**
	 * Splits a list into sub-lists stored in an object, based on the result of
	 * calling a String-returning function on each element, and grouping the
	 * results according to values returned.
	 *
	 * Dispatches to the `groupBy` method of the second argument, if present.
	 *
	 * Acts as a transducer if a transformer is given in list position.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.1.0
	 * @category List
	 * @sig (a -> String) -> [a] -> {String: [a]}
	 * @param {Function} fn Function :: a -> String
	 * @param {Array} list The array to group
	 * @return {Object} An object with the output of `fn` for keys, mapped to arrays of elements
	 *         that produced that key when passed to `fn`.
	 * @see R.transduce
	 * @example
	 *
	 *      var byGrade = R.groupBy(function(student) {
	 *        var score = student.score;
	 *        return score < 65 ? 'F' :
	 *               score < 70 ? 'D' :
	 *               score < 80 ? 'C' :
	 *               score < 90 ? 'B' : 'A';
	 *      });
	 *      var students = [{name: 'Abby', score: 84},
	 *                      {name: 'Eddy', score: 58},
	 *                      // ...
	 *                      {name: 'Jack', score: 69}];
	 *      byGrade(students);
	 *      // {
	 *      //   'A': [{name: 'Dianne', score: 99}],
	 *      //   'B': [{name: 'Abby', score: 84}]
	 *      //   // ...,
	 *      //   'F': [{name: 'Eddy', score: 58}]
	 *      // }
	 */
	module.exports = _curry2(_checkForMethod('groupBy', reduceBy(function(acc, item) {
	  if (acc == null) {
	    acc = [];
	  }
	  acc.push(item);
	  return acc;
	}, null)));


/***/ },
/* 167 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);

	/**
	 * Takes a list and returns a list of lists where each sublist's elements are
	 * all "equal" according to the provided equality function.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.21.0
	 * @category List
	 * @sig ((a, a) → Boolean) → [a] → [[a]]
	 * @param {Function} fn Function for determining whether two given (adjacent)
	 *        elements should be in the same group
	 * @param {Array} list The array to group. Also accepts a string, which will be
	 *        treated as a list of characters.
	 * @return {List} A list that contains sublists of equal elements,
	 *         whose concatenations are equal to the original list.
	 * @example
	 *
	 * R.groupWith(R.equals, [0, 1, 1, 2, 3, 5, 8, 13, 21])
	 * //=> [[0], [1, 1], [2], [3], [5], [8], [13], [21]]
	 *
	 * R.groupWith((a, b) => a % 2 === b % 2, [0, 1, 1, 2, 3, 5, 8, 13, 21])
	 * //=> [[0], [1, 1], [2], [3, 5], [8], [13, 21]]
	 *
	 * R.groupWith(R.eqBy(isVowel), 'aestiou')
	 * //=> ['ae', 'st', 'iou']
	 */
	module.exports = _curry2(function(fn, list) {
	  var res = [];
	  var idx = 0;
	  var len = list.length;
	  while (idx < len) {
	    var nextidx = idx + 1;
	    while (nextidx < len && fn(list[idx], list[nextidx])) {
	      nextidx += 1;
	    }
	    res.push(list.slice(idx, nextidx));
	    idx = nextidx;
	  }
	  return res;
	});


/***/ },
/* 168 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);


	/**
	 * Returns `true` if the first argument is greater than the second; `false`
	 * otherwise.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.1.0
	 * @category Relation
	 * @sig Ord a => a -> a -> Boolean
	 * @param {*} a
	 * @param {*} b
	 * @return {Boolean}
	 * @see R.lt
	 * @example
	 *
	 *      R.gt(2, 1); //=> true
	 *      R.gt(2, 2); //=> false
	 *      R.gt(2, 3); //=> false
	 *      R.gt('a', 'z'); //=> false
	 *      R.gt('z', 'a'); //=> true
	 */
	module.exports = _curry2(function gt(a, b) { return a > b; });


/***/ },
/* 169 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);


	/**
	 * Returns `true` if the first argument is greater than or equal to the second;
	 * `false` otherwise.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.1.0
	 * @category Relation
	 * @sig Ord a => a -> a -> Boolean
	 * @param {Number} a
	 * @param {Number} b
	 * @return {Boolean}
	 * @see R.lte
	 * @example
	 *
	 *      R.gte(2, 1); //=> true
	 *      R.gte(2, 2); //=> true
	 *      R.gte(2, 3); //=> false
	 *      R.gte('a', 'z'); //=> false
	 *      R.gte('z', 'a'); //=> true
	 */
	module.exports = _curry2(function gte(a, b) { return a >= b; });


/***/ },
/* 170 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);
	var _has = __webpack_require__(43);


	/**
	 * Returns whether or not an object has an own property with the specified name
	 *
	 * @func
	 * @memberOf R
	 * @since v0.7.0
	 * @category Object
	 * @sig s -> {s: x} -> Boolean
	 * @param {String} prop The name of the property to check for.
	 * @param {Object} obj The object to query.
	 * @return {Boolean} Whether the property exists.
	 * @example
	 *
	 *      var hasName = R.has('name');
	 *      hasName({name: 'alice'});   //=> true
	 *      hasName({name: 'bob'});     //=> true
	 *      hasName({});                //=> false
	 *
	 *      var point = {x: 0, y: 0};
	 *      var pointHas = R.has(R.__, point);
	 *      pointHas('x');  //=> true
	 *      pointHas('y');  //=> true
	 *      pointHas('z');  //=> false
	 */
	module.exports = _curry2(_has);


/***/ },
/* 171 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);


	/**
	 * Returns whether or not an object or its prototype chain has a property with
	 * the specified name
	 *
	 * @func
	 * @memberOf R
	 * @since v0.7.0
	 * @category Object
	 * @sig s -> {s: x} -> Boolean
	 * @param {String} prop The name of the property to check for.
	 * @param {Object} obj The object to query.
	 * @return {Boolean} Whether the property exists.
	 * @example
	 *
	 *      function Rectangle(width, height) {
	 *        this.width = width;
	 *        this.height = height;
	 *      }
	 *      Rectangle.prototype.area = function() {
	 *        return this.width * this.height;
	 *      };
	 *
	 *      var square = new Rectangle(2, 2);
	 *      R.hasIn('width', square);  //=> true
	 *      R.hasIn('area', square);  //=> true
	 */
	module.exports = _curry2(function hasIn(prop, obj) {
	  return prop in obj;
	});


/***/ },
/* 172 */
/***/ function(module, exports, __webpack_require__) {

	var nth = __webpack_require__(144);


	/**
	 * Returns the first element of the given list or string. In some libraries
	 * this function is named `first`.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.1.0
	 * @category List
	 * @sig [a] -> a | Undefined
	 * @sig String -> String
	 * @param {Array|String} list
	 * @return {*}
	 * @see R.tail, R.init, R.last
	 * @example
	 *
	 *      R.head(['fi', 'fo', 'fum']); //=> 'fi'
	 *      R.head([]); //=> undefined
	 *
	 *      R.head('abc'); //=> 'a'
	 *      R.head(''); //=> ''
	 */
	module.exports = nth(0);


/***/ },
/* 173 */
/***/ function(module, exports, __webpack_require__) {

	var _curry1 = __webpack_require__(11);
	var _identity = __webpack_require__(174);


	/**
	 * A function that does nothing but return the parameter supplied to it. Good
	 * as a default or placeholder function.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.1.0
	 * @category Function
	 * @sig a -> a
	 * @param {*} x The value to return.
	 * @return {*} The input value, `x`.
	 * @example
	 *
	 *      R.identity(1); //=> 1
	 *
	 *      var obj = {};
	 *      R.identity(obj) === obj; //=> true
	 * @symb R.identity(a) = a
	 */
	module.exports = _curry1(_identity);


/***/ },
/* 174 */
/***/ function(module, exports) {

	module.exports = function _identity(x) { return x; };


/***/ },
/* 175 */
/***/ function(module, exports, __webpack_require__) {

	var _curry3 = __webpack_require__(23);
	var curryN = __webpack_require__(19);


	/**
	 * Creates a function that will process either the `onTrue` or the `onFalse`
	 * function depending upon the result of the `condition` predicate.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.8.0
	 * @category Logic
	 * @sig (*... -> Boolean) -> (*... -> *) -> (*... -> *) -> (*... -> *)
	 * @param {Function} condition A predicate function
	 * @param {Function} onTrue A function to invoke when the `condition` evaluates to a truthy value.
	 * @param {Function} onFalse A function to invoke when the `condition` evaluates to a falsy value.
	 * @return {Function} A new unary function that will process either the `onTrue` or the `onFalse`
	 *                    function depending upon the result of the `condition` predicate.
	 * @see R.unless, R.when
	 * @example
	 *
	 *      var incCount = R.ifElse(
	 *        R.has('count'),
	 *        R.over(R.lensProp('count'), R.inc),
	 *        R.assoc('count', 1)
	 *      );
	 *      incCount({});           //=> { count: 1 }
	 *      incCount({ count: 1 }); //=> { count: 2 }
	 */
	module.exports = _curry3(function ifElse(condition, onTrue, onFalse) {
	  return curryN(Math.max(condition.length, onTrue.length, onFalse.length),
	    function _ifElse() {
	      return condition.apply(this, arguments) ? onTrue.apply(this, arguments) : onFalse.apply(this, arguments);
	    }
	  );
	});


/***/ },
/* 176 */
/***/ function(module, exports, __webpack_require__) {

	var add = __webpack_require__(15);


	/**
	 * Increments its argument.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.9.0
	 * @category Math
	 * @sig Number -> Number
	 * @param {Number} n
	 * @return {Number} n + 1
	 * @see R.dec
	 * @example
	 *
	 *      R.inc(42); //=> 43
	 */
	module.exports = add(1);


/***/ },
/* 177 */
/***/ function(module, exports, __webpack_require__) {

	var reduceBy = __webpack_require__(119);


	/**
	 * Given a function that generates a key, turns a list of objects into an
	 * object indexing the objects by the given key. Note that if multiple
	 * objects generate the same value for the indexing key only the last value
	 * will be included in the generated object.
	 *
	 * Acts as a transducer if a transformer is given in list position.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.19.0
	 * @category List
	 * @sig (a -> String) -> [{k: v}] -> {k: {k: v}}
	 * @param {Function} fn Function :: a -> String
	 * @param {Array} array The array of objects to index
	 * @return {Object} An object indexing each array element by the given property.
	 * @example
	 *
	 *      var list = [{id: 'xyz', title: 'A'}, {id: 'abc', title: 'B'}];
	 *      R.indexBy(R.prop('id'), list);
	 *      //=> {abc: {id: 'abc', title: 'B'}, xyz: {id: 'xyz', title: 'A'}}
	 */
	module.exports = reduceBy(function(acc, elem) { return elem; }, null);


/***/ },
/* 178 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);
	var _indexOf = __webpack_require__(99);
	var _isArray = __webpack_require__(26);


	/**
	 * Returns the position of the first occurrence of an item in an array, or -1
	 * if the item is not included in the array. `R.equals` is used to determine
	 * equality.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.1.0
	 * @category List
	 * @sig a -> [a] -> Number
	 * @param {*} target The item to find.
	 * @param {Array} xs The array to search in.
	 * @return {Number} the index of the target, or -1 if the target is not found.
	 * @see R.lastIndexOf
	 * @example
	 *
	 *      R.indexOf(3, [1,2,3,4]); //=> 2
	 *      R.indexOf(10, [1,2,3,4]); //=> -1
	 */
	module.exports = _curry2(function indexOf(target, xs) {
	  return typeof xs.indexOf === 'function' && !_isArray(xs) ?
	    xs.indexOf(target) :
	    _indexOf(xs, target, 0);
	});


/***/ },
/* 179 */
/***/ function(module, exports, __webpack_require__) {

	var slice = __webpack_require__(89);


	/**
	 * Returns all but the last element of the given list or string.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.9.0
	 * @category List
	 * @sig [a] -> [a]
	 * @sig String -> String
	 * @param {*} list
	 * @return {*}
	 * @see R.last, R.head, R.tail
	 * @example
	 *
	 *      R.init([1, 2, 3]);  //=> [1, 2]
	 *      R.init([1, 2]);     //=> [1]
	 *      R.init([1]);        //=> []
	 *      R.init([]);         //=> []
	 *
	 *      R.init('abc');  //=> 'ab'
	 *      R.init('ab');   //=> 'a'
	 *      R.init('a');    //=> ''
	 *      R.init('');     //=> ''
	 */
	module.exports = slice(0, -1);


/***/ },
/* 180 */
/***/ function(module, exports, __webpack_require__) {

	var _curry3 = __webpack_require__(23);


	/**
	 * Inserts the supplied element into the list, at index `index`. _Note that
	 * this is not destructive_: it returns a copy of the list with the changes.
	 * <small>No lists have been harmed in the application of this function.</small>
	 *
	 * @func
	 * @memberOf R
	 * @since v0.2.2
	 * @category List
	 * @sig Number -> a -> [a] -> [a]
	 * @param {Number} index The position to insert the element
	 * @param {*} elt The element to insert into the Array
	 * @param {Array} list The list to insert into
	 * @return {Array} A new Array with `elt` inserted at `index`.
	 * @example
	 *
	 *      R.insert(2, 'x', [1,2,3,4]); //=> [1,2,'x',3,4]
	 */
	module.exports = _curry3(function insert(idx, elt, list) {
	  idx = idx < list.length && idx >= 0 ? idx : list.length;
	  var result = Array.prototype.slice.call(list, 0);
	  result.splice(idx, 0, elt);
	  return result;
	});


/***/ },
/* 181 */
/***/ function(module, exports, __webpack_require__) {

	var _curry3 = __webpack_require__(23);


	/**
	 * Inserts the sub-list into the list, at index `index`. _Note that this is not
	 * destructive_: it returns a copy of the list with the changes.
	 * <small>No lists have been harmed in the application of this function.</small>
	 *
	 * @func
	 * @memberOf R
	 * @since v0.9.0
	 * @category List
	 * @sig Number -> [a] -> [a] -> [a]
	 * @param {Number} index The position to insert the sub-list
	 * @param {Array} elts The sub-list to insert into the Array
	 * @param {Array} list The list to insert the sub-list into
	 * @return {Array} A new Array with `elts` inserted starting at `index`.
	 * @example
	 *
	 *      R.insertAll(2, ['x','y','z'], [1,2,3,4]); //=> [1,2,'x','y','z',3,4]
	 */
	module.exports = _curry3(function insertAll(idx, elts, list) {
	  idx = idx < list.length && idx >= 0 ? idx : list.length;
	  return [].concat(Array.prototype.slice.call(list, 0, idx),
	                   elts,
	                   Array.prototype.slice.call(list, idx));
	});


/***/ },
/* 182 */
/***/ function(module, exports, __webpack_require__) {

	var _contains = __webpack_require__(98);
	var _curry2 = __webpack_require__(16);
	var _filter = __webpack_require__(110);
	var flip = __webpack_require__(162);
	var uniq = __webpack_require__(183);


	/**
	 * Combines two lists into a set (i.e. no duplicates) composed of those
	 * elements common to both lists.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.1.0
	 * @category Relation
	 * @sig [*] -> [*] -> [*]
	 * @param {Array} list1 The first list.
	 * @param {Array} list2 The second list.
	 * @return {Array} The list of elements found in both `list1` and `list2`.
	 * @see R.intersectionWith
	 * @example
	 *
	 *      R.intersection([1,2,3,4], [7,6,5,4,3]); //=> [4, 3]
	 */
	module.exports = _curry2(function intersection(list1, list2) {
	  var lookupList, filteredList;
	  if (list1.length > list2.length) {
	    lookupList = list1;
	    filteredList = list2;
	  } else {
	    lookupList = list2;
	    filteredList = list1;
	  }
	  return uniq(_filter(flip(_contains)(lookupList), filteredList));
	});


/***/ },
/* 183 */
/***/ function(module, exports, __webpack_require__) {

	var identity = __webpack_require__(173);
	var uniqBy = __webpack_require__(184);


	/**
	 * Returns a new list containing only one copy of each element in the original
	 * list. `R.equals` is used to determine equality.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.1.0
	 * @category List
	 * @sig [a] -> [a]
	 * @param {Array} list The array to consider.
	 * @return {Array} The list of unique items.
	 * @example
	 *
	 *      R.uniq([1, 1, 2, 1]); //=> [1, 2]
	 *      R.uniq([1, '1']);     //=> [1, '1']
	 *      R.uniq([[42], [42]]); //=> [[42]]
	 */
	module.exports = uniqBy(identity);


/***/ },
/* 184 */
/***/ function(module, exports, __webpack_require__) {

	var _Set = __webpack_require__(185);
	var _curry2 = __webpack_require__(16);


	/**
	 * Returns a new list containing only one copy of each element in the original
	 * list, based upon the value returned by applying the supplied function to
	 * each list element. Prefers the first item if the supplied function produces
	 * the same value on two items. `R.equals` is used for comparison.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.16.0
	 * @category List
	 * @sig (a -> b) -> [a] -> [a]
	 * @param {Function} fn A function used to produce a value to use during comparisons.
	 * @param {Array} list The array to consider.
	 * @return {Array} The list of unique items.
	 * @example
	 *
	 *      R.uniqBy(Math.abs, [-1, -5, 2, 10, 1, 2]); //=> [-1, -5, 2, 10]
	 */
	module.exports = _curry2(function uniqBy(fn, list) {
	  var set = new _Set();
	  var result = [];
	  var idx = 0;
	  var appliedItem, item;

	  while (idx < list.length) {
	    item = list[idx];
	    appliedItem = fn(item);
	    if (set.add(appliedItem)) {
	      result.push(item);
	    }
	    idx += 1;
	  }
	  return result;
	});


/***/ },
/* 185 */
/***/ function(module, exports, __webpack_require__) {

	var _contains = __webpack_require__(98);


	// A simple Set type that honours R.equals semantics
	module.exports = (function() {
	  function _Set() {
	    /* globals Set */
	    this._nativeSet = typeof Set === 'function' ? new Set() : null;
	    this._items = {};
	  }

	  // until we figure out why jsdoc chokes on this
	  // @param item The item to add to the Set
	  // @returns {boolean} true if the item did not exist prior, otherwise false
	  //
	  _Set.prototype.add = function(item) {
	    return !hasOrAdd(item, true, this);
	  };

	  //
	  // @param item The item to check for existence in the Set
	  // @returns {boolean} true if the item exists in the Set, otherwise false
	  //
	  _Set.prototype.has = function(item) {
	    return hasOrAdd(item, false, this);
	  };

	  //
	  // Combines the logic for checking whether an item is a member of the set and
	  // for adding a new item to the set.
	  //
	  // @param item       The item to check or add to the Set instance.
	  // @param shouldAdd  If true, the item will be added to the set if it doesn't
	  //                   already exist.
	  // @param set        The set instance to check or add to.
	  // @return {boolean} true if the item already existed, otherwise false.
	  //
	  function hasOrAdd(item, shouldAdd, set) {
	    var type = typeof item;
	    var prevSize, newSize;
	    switch (type) {
	      case 'string':
	      case 'number':
	        // distinguish between +0 and -0
	        if (item === 0 && 1 / item === -Infinity) {
	          if (set._items['-0']) {
	            return true;
	          } else {
	            if (shouldAdd) {
	              set._items['-0'] = true;
	            }
	            return false;
	          }
	        }
	        // these types can all utilise the native Set
	        if (set._nativeSet !== null) {
	          if (shouldAdd) {
	            prevSize = set._nativeSet.size;
	            set._nativeSet.add(item);
	            newSize = set._nativeSet.size;
	            return newSize === prevSize;
	          } else {
	            return set._nativeSet.has(item);
	          }
	        } else {
	          if (!(type in set._items)) {
	            if (shouldAdd) {
	              set._items[type] = {};
	              set._items[type][item] = true;
	            }
	            return false;
	          } else if (item in set._items[type]) {
	            return true;
	          } else {
	            if (shouldAdd) {
	              set._items[type][item] = true;
	            }
	            return false;
	          }
	        }

	      case 'boolean':
	        // set._items['boolean'] holds a two element array
	        // representing [ falseExists, trueExists ]
	        if (type in set._items) {
	          var bIdx = item ? 1 : 0;
	          if (set._items[type][bIdx]) {
	            return true;
	          } else {
	            if (shouldAdd) {
	              set._items[type][bIdx] = true;
	            }
	            return false;
	          }
	        } else {
	          if (shouldAdd) {
	            set._items[type] = item ? [false, true] : [true, false];
	          }
	          return false;
	        }

	      case 'function':
	        // compare functions for reference equality
	        if (set._nativeSet !== null) {
	          if (shouldAdd) {
	            prevSize = set._nativeSet.size;
	            set._nativeSet.add(item);
	            newSize = set._nativeSet.size;
	            return newSize === prevSize;
	          } else {
	            return set._nativeSet.has(item);
	          }
	        } else {
	          if (!(type in set._items)) {
	            if (shouldAdd) {
	              set._items[type] = [item];
	            }
	            return false;
	          }
	          if (!_contains(item, set._items[type])) {
	            if (shouldAdd) {
	              set._items[type].push(item);
	            }
	            return false;
	          }
	          return true;
	        }

	      case 'undefined':
	        if (set._items[type]) {
	          return true;
	        } else {
	          if (shouldAdd) {
	            set._items[type] = true;
	          }
	          return false;
	        }

	      case 'object':
	        if (item === null) {
	          if (!set._items['null']) {
	            if (shouldAdd) {
	              set._items['null'] = true;
	            }
	            return false;
	          }
	          return true;
	        }
	      /* falls through */
	      default:
	        // reduce the search size of heterogeneous sets by creating buckets
	        // for each type.
	        type = Object.prototype.toString.call(item);
	        if (!(type in set._items)) {
	          if (shouldAdd) {
	            set._items[type] = [item];
	          }
	          return false;
	        }
	        // scan through all previously applied items
	        if (!_contains(item, set._items[type])) {
	          if (shouldAdd) {
	            set._items[type].push(item);
	          }
	          return false;
	        }
	        return true;
	    }
	  }
	  return _Set;
	}());


/***/ },
/* 186 */
/***/ function(module, exports, __webpack_require__) {

	var _containsWith = __webpack_require__(126);
	var _curry3 = __webpack_require__(23);
	var uniqWith = __webpack_require__(187);


	/**
	 * Combines two lists into a set (i.e. no duplicates) composed of those
	 * elements common to both lists. Duplication is determined according to the
	 * value returned by applying the supplied predicate to two list elements.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.1.0
	 * @category Relation
	 * @sig ((a, a) -> Boolean) -> [a] -> [a] -> [a]
	 * @param {Function} pred A predicate function that determines whether
	 *        the two supplied elements are equal.
	 * @param {Array} list1 One list of items to compare
	 * @param {Array} list2 A second list of items to compare
	 * @return {Array} A new list containing those elements common to both lists.
	 * @see R.intersection
	 * @example
	 *
	 *      var buffaloSpringfield = [
	 *        {id: 824, name: 'Richie Furay'},
	 *        {id: 956, name: 'Dewey Martin'},
	 *        {id: 313, name: 'Bruce Palmer'},
	 *        {id: 456, name: 'Stephen Stills'},
	 *        {id: 177, name: 'Neil Young'}
	 *      ];
	 *      var csny = [
	 *        {id: 204, name: 'David Crosby'},
	 *        {id: 456, name: 'Stephen Stills'},
	 *        {id: 539, name: 'Graham Nash'},
	 *        {id: 177, name: 'Neil Young'}
	 *      ];
	 *
	 *      R.intersectionWith(R.eqBy(R.prop('id')), buffaloSpringfield, csny);
	 *      //=> [{id: 456, name: 'Stephen Stills'}, {id: 177, name: 'Neil Young'}]
	 */
	module.exports = _curry3(function intersectionWith(pred, list1, list2) {
	  var lookupList, filteredList;
	  if (list1.length > list2.length) {
	    lookupList = list1;
	    filteredList = list2;
	  } else {
	    lookupList = list2;
	    filteredList = list1;
	  }
	  var results = [];
	  var idx = 0;
	  while (idx < filteredList.length) {
	    if (_containsWith(pred, filteredList[idx], lookupList)) {
	      results[results.length] = filteredList[idx];
	    }
	    idx += 1;
	  }
	  return uniqWith(pred, results);
	});


/***/ },
/* 187 */
/***/ function(module, exports, __webpack_require__) {

	var _containsWith = __webpack_require__(126);
	var _curry2 = __webpack_require__(16);


	/**
	 * Returns a new list containing only one copy of each element in the original
	 * list, based upon the value returned by applying the supplied predicate to
	 * two list elements. Prefers the first item if two items compare equal based
	 * on the predicate.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.2.0
	 * @category List
	 * @sig (a, a -> Boolean) -> [a] -> [a]
	 * @param {Function} pred A predicate used to test whether two items are equal.
	 * @param {Array} list The array to consider.
	 * @return {Array} The list of unique items.
	 * @example
	 *
	 *      var strEq = R.eqBy(String);
	 *      R.uniqWith(strEq)([1, '1', 2, 1]); //=> [1, 2]
	 *      R.uniqWith(strEq)([{}, {}]);       //=> [{}]
	 *      R.uniqWith(strEq)([1, '1', 1]);    //=> [1]
	 *      R.uniqWith(strEq)(['1', 1, 1]);    //=> ['1']
	 */
	module.exports = _curry2(function uniqWith(pred, list) {
	  var idx = 0;
	  var len = list.length;
	  var result = [];
	  var item;
	  while (idx < len) {
	    item = list[idx];
	    if (!_containsWith(pred, item, result)) {
	      result[result.length] = item;
	    }
	    idx += 1;
	  }
	  return result;
	});


/***/ },
/* 188 */
/***/ function(module, exports, __webpack_require__) {

	var _checkForMethod = __webpack_require__(88);
	var _curry2 = __webpack_require__(16);


	/**
	 * Creates a new list with the separator interposed between elements.
	 *
	 * Dispatches to the `intersperse` method of the second argument, if present.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.14.0
	 * @category List
	 * @sig a -> [a] -> [a]
	 * @param {*} separator The element to add to the list.
	 * @param {Array} list The list to be interposed.
	 * @return {Array} The new list.
	 * @example
	 *
	 *      R.intersperse('n', ['ba', 'a', 'a']); //=> ['ba', 'n', 'a', 'n', 'a']
	 */
	module.exports = _curry2(_checkForMethod('intersperse', function intersperse(separator, list) {
	  var out = [];
	  var idx = 0;
	  var length = list.length;
	  while (idx < length) {
	    if (idx === length - 1) {
	      out.push(list[idx]);
	    } else {
	      out.push(list[idx], separator);
	    }
	    idx += 1;
	  }
	  return out;
	}));


/***/ },
/* 189 */
/***/ function(module, exports, __webpack_require__) {

	var _clone = __webpack_require__(78);
	var _curry3 = __webpack_require__(23);
	var _isTransformer = __webpack_require__(27);
	var _reduce = __webpack_require__(36);
	var _stepCat = __webpack_require__(190);


	/**
	 * Transforms the items of the list with the transducer and appends the
	 * transformed items to the accumulator using an appropriate iterator function
	 * based on the accumulator type.
	 *
	 * The accumulator can be an array, string, object or a transformer. Iterated
	 * items will be appended to arrays and concatenated to strings. Objects will
	 * be merged directly or 2-item arrays will be merged as key, value pairs.
	 *
	 * The accumulator can also be a transformer object that provides a 2-arity
	 * reducing iterator function, step, 0-arity initial value function, init, and
	 * 1-arity result extraction function result. The step function is used as the
	 * iterator function in reduce. The result function is used to convert the
	 * final accumulator into the return type and in most cases is R.identity. The
	 * init function is used to provide the initial accumulator.
	 *
	 * The iteration is performed with R.reduce after initializing the transducer.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.12.0
	 * @category List
	 * @sig a -> (b -> b) -> [c] -> a
	 * @param {*} acc The initial accumulator value.
	 * @param {Function} xf The transducer function. Receives a transformer and returns a transformer.
	 * @param {Array} list The list to iterate over.
	 * @return {*} The final, accumulated value.
	 * @example
	 *
	 *      var numbers = [1, 2, 3, 4];
	 *      var transducer = R.compose(R.map(R.add(1)), R.take(2));
	 *
	 *      R.into([], transducer, numbers); //=> [2, 3]
	 *
	 *      var intoArray = R.into([]);
	 *      intoArray(transducer, numbers); //=> [2, 3]
	 */
	module.exports = _curry3(function into(acc, xf, list) {
	  return _isTransformer(acc) ?
	    _reduce(xf(acc), acc['@@transducer/init'](), list) :
	    _reduce(xf(_stepCat(acc)), _clone(acc, [], [], false), list);
	});


/***/ },
/* 190 */
/***/ function(module, exports, __webpack_require__) {

	var _assign = __webpack_require__(191);
	var _identity = __webpack_require__(174);
	var _isTransformer = __webpack_require__(27);
	var isArrayLike = __webpack_require__(39);
	var objOf = __webpack_require__(193);


	module.exports = (function() {
	  var _stepCatArray = {
	    '@@transducer/init': Array,
	    '@@transducer/step': function(xs, x) {
	      xs.push(x);
	      return xs;
	    },
	    '@@transducer/result': _identity
	  };
	  var _stepCatString = {
	    '@@transducer/init': String,
	    '@@transducer/step': function(a, b) { return a + b; },
	    '@@transducer/result': _identity
	  };
	  var _stepCatObject = {
	    '@@transducer/init': Object,
	    '@@transducer/step': function(result, input) {
	      return _assign(
	        result,
	        isArrayLike(input) ? objOf(input[0], input[1]) : input
	      );
	    },
	    '@@transducer/result': _identity
	  };

	  return function _stepCat(obj) {
	    if (_isTransformer(obj)) {
	      return obj;
	    }
	    if (isArrayLike(obj)) {
	      return _stepCatArray;
	    }
	    if (typeof obj === 'string') {
	      return _stepCatString;
	    }
	    if (typeof obj === 'object') {
	      return _stepCatObject;
	    }
	    throw new Error('Cannot create transformer for ' + obj);
	  };
	}());


/***/ },
/* 191 */
/***/ function(module, exports, __webpack_require__) {

	var _objectAssign = __webpack_require__(192);

	module.exports =
	  typeof Object.assign === 'function' ? Object.assign : _objectAssign;


/***/ },
/* 192 */
/***/ function(module, exports, __webpack_require__) {

	var _has = __webpack_require__(43);

	// Based on https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Object/assign
	module.exports = function _objectAssign(target) {
	  if (target == null) {
	    throw new TypeError('Cannot convert undefined or null to object');
	  }

	  var output = Object(target);
	  var idx = 1;
	  var length = arguments.length;
	  while (idx < length) {
	    var source = arguments[idx];
	    if (source != null) {
	      for (var nextKey in source) {
	        if (_has(nextKey, source)) {
	          output[nextKey] = source[nextKey];
	        }
	      }
	    }
	    idx += 1;
	  }
	  return output;
	};


/***/ },
/* 193 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);


	/**
	 * Creates an object containing a single key:value pair.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.18.0
	 * @category Object
	 * @sig String -> a -> {String:a}
	 * @param {String} key
	 * @param {*} val
	 * @return {Object}
	 * @see R.pair
	 * @example
	 *
	 *      var matchPhrases = R.compose(
	 *        R.objOf('must'),
	 *        R.map(R.objOf('match_phrase'))
	 *      );
	 *      matchPhrases(['foo', 'bar', 'baz']); //=> {must: [{match_phrase: 'foo'}, {match_phrase: 'bar'}, {match_phrase: 'baz'}]}
	 */
	module.exports = _curry2(function objOf(key, val) {
	  var obj = {};
	  obj[key] = val;
	  return obj;
	});


/***/ },
/* 194 */
/***/ function(module, exports, __webpack_require__) {

	var _curry1 = __webpack_require__(11);
	var _has = __webpack_require__(43);
	var keys = __webpack_require__(42);


	/**
	 * Same as R.invertObj, however this accounts for objects with duplicate values
	 * by putting the values into an array.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.9.0
	 * @category Object
	 * @sig {s: x} -> {x: [ s, ... ]}
	 * @param {Object} obj The object or array to invert
	 * @return {Object} out A new object with keys
	 * in an array.
	 * @example
	 *
	 *      var raceResultsByFirstName = {
	 *        first: 'alice',
	 *        second: 'jake',
	 *        third: 'alice',
	 *      };
	 *      R.invert(raceResultsByFirstName);
	 *      //=> { 'alice': ['first', 'third'], 'jake':['second'] }
	 */
	module.exports = _curry1(function invert(obj) {
	  var props = keys(obj);
	  var len = props.length;
	  var idx = 0;
	  var out = {};

	  while (idx < len) {
	    var key = props[idx];
	    var val = obj[key];
	    var list = _has(val, out) ? out[val] : (out[val] = []);
	    list[list.length] = key;
	    idx += 1;
	  }
	  return out;
	});


/***/ },
/* 195 */
/***/ function(module, exports, __webpack_require__) {

	var _curry1 = __webpack_require__(11);
	var keys = __webpack_require__(42);


	/**
	 * Returns a new object with the keys of the given object as values, and the
	 * values of the given object, which are coerced to strings, as keys. Note
	 * that the last key found is preferred when handling the same value.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.9.0
	 * @category Object
	 * @sig {s: x} -> {x: s}
	 * @param {Object} obj The object or array to invert
	 * @return {Object} out A new object
	 * @example
	 *
	 *      var raceResults = {
	 *        first: 'alice',
	 *        second: 'jake'
	 *      };
	 *      R.invertObj(raceResults);
	 *      //=> { 'alice': 'first', 'jake':'second' }
	 *
	 *      // Alternatively:
	 *      var raceResults = ['alice', 'jake'];
	 *      R.invertObj(raceResults);
	 *      //=> { 'alice': '0', 'jake':'1' }
	 */
	module.exports = _curry1(function invertObj(obj) {
	  var props = keys(obj);
	  var len = props.length;
	  var idx = 0;
	  var out = {};

	  while (idx < len) {
	    var key = props[idx];
	    out[obj[key]] = key;
	    idx += 1;
	  }
	  return out;
	});


/***/ },
/* 196 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);
	var _isFunction = __webpack_require__(66);
	var curryN = __webpack_require__(19);
	var toString = __webpack_require__(96);


	/**
	 * Turns a named method with a specified arity into a function that can be
	 * called directly supplied with arguments and a target object.
	 *
	 * The returned function is curried and accepts `arity + 1` parameters where
	 * the final parameter is the target object.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.1.0
	 * @category Function
	 * @sig Number -> String -> (a -> b -> ... -> n -> Object -> *)
	 * @param {Number} arity Number of arguments the returned function should take
	 *        before the target object.
	 * @param {String} method Name of the method to call.
	 * @return {Function} A new curried function.
	 * @example
	 *
	 *      var sliceFrom = R.invoker(1, 'slice');
	 *      sliceFrom(6, 'abcdefghijklm'); //=> 'ghijklm'
	 *      var sliceFrom6 = R.invoker(2, 'slice')(6);
	 *      sliceFrom6(8, 'abcdefghijklm'); //=> 'gh'
	 * @symb R.invoker(0, 'method')(o) = o['method']()
	 * @symb R.invoker(1, 'method')(a, o) = o['method'](a)
	 * @symb R.invoker(2, 'method')(a, b, o) = o['method'](a, b)
	 */
	module.exports = _curry2(function invoker(arity, method) {
	  return curryN(arity + 1, function() {
	    var target = arguments[arity];
	    if (target != null && _isFunction(target[method])) {
	      return target[method].apply(target, Array.prototype.slice.call(arguments, 0, arity));
	    }
	    throw new TypeError(toString(target) + ' does not have a method named "' + method + '"');
	  });
	});


/***/ },
/* 197 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);


	/**
	 * See if an object (`val`) is an instance of the supplied constructor. This
	 * function will check up the inheritance chain, if any.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.3.0
	 * @category Type
	 * @sig (* -> {*}) -> a -> Boolean
	 * @param {Object} ctor A constructor
	 * @param {*} val The value to test
	 * @return {Boolean}
	 * @example
	 *
	 *      R.is(Object, {}); //=> true
	 *      R.is(Number, 1); //=> true
	 *      R.is(Object, 1); //=> false
	 *      R.is(String, 's'); //=> true
	 *      R.is(String, new String('')); //=> true
	 *      R.is(Object, new String('')); //=> true
	 *      R.is(Object, 's'); //=> false
	 *      R.is(Number, {}); //=> false
	 */
	module.exports = _curry2(function is(Ctor, val) {
	  return val != null && val.constructor === Ctor || val instanceof Ctor;
	});


/***/ },
/* 198 */
/***/ function(module, exports, __webpack_require__) {

	var _curry1 = __webpack_require__(11);
	var empty = __webpack_require__(149);
	var equals = __webpack_require__(100);


	/**
	 * Returns `true` if the given value is its type's empty value; `false`
	 * otherwise.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.1.0
	 * @category Logic
	 * @sig a -> Boolean
	 * @param {*} x
	 * @return {Boolean}
	 * @see R.empty
	 * @example
	 *
	 *      R.isEmpty([1, 2, 3]);   //=> false
	 *      R.isEmpty([]);          //=> true
	 *      R.isEmpty('');          //=> true
	 *      R.isEmpty(null);        //=> false
	 *      R.isEmpty({});          //=> true
	 *      R.isEmpty({length: 0}); //=> false
	 */
	module.exports = _curry1(function isEmpty(x) {
	  return x != null && equals(x, empty(x));
	});


/***/ },
/* 199 */
/***/ function(module, exports, __webpack_require__) {

	var _curry1 = __webpack_require__(11);


	/**
	 * Checks if the input value is `null` or `undefined`.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.9.0
	 * @category Type
	 * @sig * -> Boolean
	 * @param {*} x The value to test.
	 * @return {Boolean} `true` if `x` is `undefined` or `null`, otherwise `false`.
	 * @example
	 *
	 *      R.isNil(null); //=> true
	 *      R.isNil(undefined); //=> true
	 *      R.isNil(0); //=> false
	 *      R.isNil([]); //=> false
	 */
	module.exports = _curry1(function isNil(x) { return x == null; });


/***/ },
/* 200 */
/***/ function(module, exports, __webpack_require__) {

	var invoker = __webpack_require__(196);


	/**
	 * Returns a string made by inserting the `separator` between each element and
	 * concatenating all the elements into a single string.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.1.0
	 * @category List
	 * @sig String -> [a] -> String
	 * @param {Number|String} separator The string used to separate the elements.
	 * @param {Array} xs The elements to join into a string.
	 * @return {String} str The string made by concatenating `xs` with `separator`.
	 * @see R.split
	 * @example
	 *
	 *      var spacer = R.join(' ');
	 *      spacer(['a', 2, 3.4]);   //=> 'a 2 3.4'
	 *      R.join('|', [1, 2, 3]);    //=> '1|2|3'
	 */
	module.exports = invoker(1, 'join');


/***/ },
/* 201 */
/***/ function(module, exports, __webpack_require__) {

	var _curry1 = __webpack_require__(11);
	var converge = __webpack_require__(117);


	/**
	 * juxt applies a list of functions to a list of values.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.19.0
	 * @category Function
	 * @sig [(a, b, ..., m) -> n] -> ((a, b, ..., m) -> [n])
	 * @param {Array} fns An array of functions
	 * @return {Function} A function that returns a list of values after applying each of the original `fns` to its parameters.
	 * @see R.applySpec
	 * @example
	 *
	 *      var getRange = R.juxt([Math.min, Math.max]);
	 *      getRange(3, 4, 9, -3); //=> [-3, 9]
	 * @symb R.juxt([f, g, h])(a, b) = [f(a, b), g(a, b), h(a, b)]
	 */
	module.exports = _curry1(function juxt(fns) {
	  return converge(function() { return Array.prototype.slice.call(arguments, 0); }, fns);
	});


/***/ },
/* 202 */
/***/ function(module, exports, __webpack_require__) {

	var _curry1 = __webpack_require__(11);


	/**
	 * Returns a list containing the names of all the properties of the supplied
	 * object, including prototype properties.
	 * Note that the order of the output array is not guaranteed to be consistent
	 * across different JS platforms.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.2.0
	 * @category Object
	 * @sig {k: v} -> [k]
	 * @param {Object} obj The object to extract properties from
	 * @return {Array} An array of the object's own and prototype properties.
	 * @example
	 *
	 *      var F = function() { this.x = 'X'; };
	 *      F.prototype.y = 'Y';
	 *      var f = new F();
	 *      R.keysIn(f); //=> ['x', 'y']
	 */
	module.exports = _curry1(function keysIn(obj) {
	  var prop;
	  var ks = [];
	  for (prop in obj) {
	    ks[ks.length] = prop;
	  }
	  return ks;
	});


/***/ },
/* 203 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);
	var _isArray = __webpack_require__(26);
	var equals = __webpack_require__(100);


	/**
	 * Returns the position of the last occurrence of an item in an array, or -1 if
	 * the item is not included in the array. `R.equals` is used to determine
	 * equality.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.1.0
	 * @category List
	 * @sig a -> [a] -> Number
	 * @param {*} target The item to find.
	 * @param {Array} xs The array to search in.
	 * @return {Number} the index of the target, or -1 if the target is not found.
	 * @see R.indexOf
	 * @example
	 *
	 *      R.lastIndexOf(3, [-1,3,3,0,1,2,3,4]); //=> 6
	 *      R.lastIndexOf(10, [1,2,3,4]); //=> -1
	 */
	module.exports = _curry2(function lastIndexOf(target, xs) {
	  if (typeof xs.lastIndexOf === 'function' && !_isArray(xs)) {
	    return xs.lastIndexOf(target);
	  } else {
	    var idx = xs.length - 1;
	    while (idx >= 0) {
	      if (equals(xs[idx], target)) {
	        return idx;
	      }
	      idx -= 1;
	    }
	    return -1;
	  }
	});


/***/ },
/* 204 */
/***/ function(module, exports, __webpack_require__) {

	var _curry1 = __webpack_require__(11);
	var _isNumber = __webpack_require__(205);


	/**
	 * Returns the number of elements in the array by returning `list.length`.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.3.0
	 * @category List
	 * @sig [a] -> Number
	 * @param {Array} list The array to inspect.
	 * @return {Number} The length of the array.
	 * @example
	 *
	 *      R.length([]); //=> 0
	 *      R.length([1, 2, 3]); //=> 3
	 */
	module.exports = _curry1(function length(list) {
	  return list != null && _isNumber(list.length) ? list.length : NaN;
	});


/***/ },
/* 205 */
/***/ function(module, exports) {

	module.exports = function _isNumber(x) {
	  return Object.prototype.toString.call(x) === '[object Number]';
	};


/***/ },
/* 206 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);
	var map = __webpack_require__(34);


	/**
	 * Returns a lens for the given getter and setter functions. The getter "gets"
	 * the value of the focus; the setter "sets" the value of the focus. The setter
	 * should not mutate the data structure.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.8.0
	 * @category Object
	 * @typedefn Lens s a = Functor f => (a -> f a) -> s -> f s
	 * @sig (s -> a) -> ((a, s) -> s) -> Lens s a
	 * @param {Function} getter
	 * @param {Function} setter
	 * @return {Lens}
	 * @see R.view, R.set, R.over, R.lensIndex, R.lensProp
	 * @example
	 *
	 *      var xLens = R.lens(R.prop('x'), R.assoc('x'));
	 *
	 *      R.view(xLens, {x: 1, y: 2});            //=> 1
	 *      R.set(xLens, 4, {x: 1, y: 2});          //=> {x: 4, y: 2}
	 *      R.over(xLens, R.negate, {x: 1, y: 2});  //=> {x: -1, y: 2}
	 */
	module.exports = _curry2(function lens(getter, setter) {
	  return function(toFunctorFn) {
	    return function(target) {
	      return map(
	        function(focus) {
	          return setter(focus, target);
	        },
	        toFunctorFn(getter(target))
	      );
	    };
	  };
	});


/***/ },
/* 207 */
/***/ function(module, exports, __webpack_require__) {

	var _curry1 = __webpack_require__(11);
	var lens = __webpack_require__(206);
	var nth = __webpack_require__(144);
	var update = __webpack_require__(208);


	/**
	 * Returns a lens whose focus is the specified index.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.14.0
	 * @category Object
	 * @typedefn Lens s a = Functor f => (a -> f a) -> s -> f s
	 * @sig Number -> Lens s a
	 * @param {Number} n
	 * @return {Lens}
	 * @see R.view, R.set, R.over
	 * @example
	 *
	 *      var headLens = R.lensIndex(0);
	 *
	 *      R.view(headLens, ['a', 'b', 'c']);            //=> 'a'
	 *      R.set(headLens, 'x', ['a', 'b', 'c']);        //=> ['x', 'b', 'c']
	 *      R.over(headLens, R.toUpper, ['a', 'b', 'c']); //=> ['A', 'b', 'c']
	 */
	module.exports = _curry1(function lensIndex(n) {
	  return lens(nth(n), update(n));
	});


/***/ },
/* 208 */
/***/ function(module, exports, __webpack_require__) {

	var _curry3 = __webpack_require__(23);
	var adjust = __webpack_require__(22);
	var always = __webpack_require__(10);


	/**
	 * Returns a new copy of the array with the element at the provided index
	 * replaced with the given value.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.14.0
	 * @category List
	 * @sig Number -> a -> [a] -> [a]
	 * @param {Number} idx The index to update.
	 * @param {*} x The value to exist at the given index of the returned array.
	 * @param {Array|Arguments} list The source array-like object to be updated.
	 * @return {Array} A copy of `list` with the value at index `idx` replaced with `x`.
	 * @see R.adjust
	 * @example
	 *
	 *      R.update(1, 11, [0, 1, 2]);     //=> [0, 11, 2]
	 *      R.update(1)(11)([0, 1, 2]);     //=> [0, 11, 2]
	 * @symb R.update(-1, a, [b, c]) = [b, a]
	 * @symb R.update(0, a, [b, c]) = [a, c]
	 * @symb R.update(1, a, [b, c]) = [b, a]
	 */
	module.exports = _curry3(function update(idx, x, list) {
	  return adjust(always(x), idx, list);
	});


/***/ },
/* 209 */
/***/ function(module, exports, __webpack_require__) {

	var _curry1 = __webpack_require__(11);
	var assocPath = __webpack_require__(61);
	var lens = __webpack_require__(206);
	var path = __webpack_require__(210);


	/**
	 * Returns a lens whose focus is the specified path.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.19.0
	 * @category Object
	 * @typedefn Idx = String | Int
	 * @typedefn Lens s a = Functor f => (a -> f a) -> s -> f s
	 * @sig [Idx] -> Lens s a
	 * @param {Array} path The path to use.
	 * @return {Lens}
	 * @see R.view, R.set, R.over
	 * @example
	 *
	 *      var xHeadYLens = R.lensPath(['x', 0, 'y']);
	 *
	 *      R.view(xHeadYLens, {x: [{y: 2, z: 3}, {y: 4, z: 5}]});
	 *      //=> 2
	 *      R.set(xHeadYLens, 1, {x: [{y: 2, z: 3}, {y: 4, z: 5}]});
	 *      //=> {x: [{y: 1, z: 3}, {y: 4, z: 5}]}
	 *      R.over(xHeadYLens, R.negate, {x: [{y: 2, z: 3}, {y: 4, z: 5}]});
	 *      //=> {x: [{y: -2, z: 3}, {y: 4, z: 5}]}
	 */
	module.exports = _curry1(function lensPath(p) {
	  return lens(path(p), assocPath(p));
	});


/***/ },
/* 210 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);


	/**
	 * Retrieve the value at a given path.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.2.0
	 * @category Object
	 * @typedefn Idx = String | Int
	 * @sig [Idx] -> {a} -> a | Undefined
	 * @param {Array} path The path to use.
	 * @param {Object} obj The object to retrieve the nested property from.
	 * @return {*} The data at `path`.
	 * @see R.prop
	 * @example
	 *
	 *      R.path(['a', 'b'], {a: {b: 2}}); //=> 2
	 *      R.path(['a', 'b'], {c: {b: 2}}); //=> undefined
	 */
	module.exports = _curry2(function path(paths, obj) {
	  var val = obj;
	  var idx = 0;
	  while (idx < paths.length) {
	    if (val == null) {
	      return;
	    }
	    val = val[paths[idx]];
	    idx += 1;
	  }
	  return val;
	});


/***/ },
/* 211 */
/***/ function(module, exports, __webpack_require__) {

	var _curry1 = __webpack_require__(11);
	var assoc = __webpack_require__(60);
	var lens = __webpack_require__(206);
	var prop = __webpack_require__(45);


	/**
	 * Returns a lens whose focus is the specified property.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.14.0
	 * @category Object
	 * @typedefn Lens s a = Functor f => (a -> f a) -> s -> f s
	 * @sig String -> Lens s a
	 * @param {String} k
	 * @return {Lens}
	 * @see R.view, R.set, R.over
	 * @example
	 *
	 *      var xLens = R.lensProp('x');
	 *
	 *      R.view(xLens, {x: 1, y: 2});            //=> 1
	 *      R.set(xLens, 4, {x: 1, y: 2});          //=> {x: 4, y: 2}
	 *      R.over(xLens, R.negate, {x: 1, y: 2});  //=> {x: -1, y: 2}
	 */
	module.exports = _curry1(function lensProp(k) {
	  return lens(prop(k), assoc(k));
	});


/***/ },
/* 212 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);


	/**
	 * Returns `true` if the first argument is less than the second; `false`
	 * otherwise.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.1.0
	 * @category Relation
	 * @sig Ord a => a -> a -> Boolean
	 * @param {*} a
	 * @param {*} b
	 * @return {Boolean}
	 * @see R.gt
	 * @example
	 *
	 *      R.lt(2, 1); //=> false
	 *      R.lt(2, 2); //=> false
	 *      R.lt(2, 3); //=> true
	 *      R.lt('a', 'z'); //=> true
	 *      R.lt('z', 'a'); //=> false
	 */
	module.exports = _curry2(function lt(a, b) { return a < b; });


/***/ },
/* 213 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);


	/**
	 * Returns `true` if the first argument is less than or equal to the second;
	 * `false` otherwise.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.1.0
	 * @category Relation
	 * @sig Ord a => a -> a -> Boolean
	 * @param {Number} a
	 * @param {Number} b
	 * @return {Boolean}
	 * @see R.gte
	 * @example
	 *
	 *      R.lte(2, 1); //=> false
	 *      R.lte(2, 2); //=> true
	 *      R.lte(2, 3); //=> true
	 *      R.lte('a', 'z'); //=> true
	 *      R.lte('z', 'a'); //=> false
	 */
	module.exports = _curry2(function lte(a, b) { return a <= b; });


/***/ },
/* 214 */
/***/ function(module, exports, __webpack_require__) {

	var _curry3 = __webpack_require__(23);


	/**
	 * The mapAccum function behaves like a combination of map and reduce; it
	 * applies a function to each element of a list, passing an accumulating
	 * parameter from left to right, and returning a final value of this
	 * accumulator together with the new list.
	 *
	 * The iterator function receives two arguments, *acc* and *value*, and should
	 * return a tuple *[acc, value]*.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.10.0
	 * @category List
	 * @sig (acc -> x -> (acc, y)) -> acc -> [x] -> (acc, [y])
	 * @param {Function} fn The function to be called on every element of the input `list`.
	 * @param {*} acc The accumulator value.
	 * @param {Array} list The list to iterate over.
	 * @return {*} The final, accumulated value.
	 * @see R.addIndex, R.mapAccumRight
	 * @example
	 *
	 *      var digits = ['1', '2', '3', '4'];
	 *      var appender = (a, b) => [a + b, a + b];
	 *
	 *      R.mapAccum(appender, 0, digits); //=> ['01234', ['01', '012', '0123', '01234']]
	 * @symb R.mapAccum(f, a, [b, c, d]) = [
	 *   f(f(f(a, b)[0], c)[0], d)[0],
	 *   [
	 *     f(a, b)[1],
	 *     f(f(a, b)[0], c)[1],
	 *     f(f(f(a, b)[0], c)[0], d)[1]
	 *   ]
	 * ]
	 */
	module.exports = _curry3(function mapAccum(fn, acc, list) {
	  var idx = 0;
	  var len = list.length;
	  var result = [];
	  var tuple = [acc];
	  while (idx < len) {
	    tuple = fn(tuple[0], list[idx]);
	    result[idx] = tuple[1];
	    idx += 1;
	  }
	  return [tuple[0], result];
	});


/***/ },
/* 215 */
/***/ function(module, exports, __webpack_require__) {

	var _curry3 = __webpack_require__(23);


	/**
	 * The mapAccumRight function behaves like a combination of map and reduce; it
	 * applies a function to each element of a list, passing an accumulating
	 * parameter from right to left, and returning a final value of this
	 * accumulator together with the new list.
	 *
	 * Similar to `mapAccum`, except moves through the input list from the right to
	 * the left.
	 *
	 * The iterator function receives two arguments, *value* and *acc*, and should
	 * return a tuple *[value, acc]*.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.10.0
	 * @category List
	 * @sig (x-> acc -> (y, acc)) -> acc -> [x] -> ([y], acc)
	 * @param {Function} fn The function to be called on every element of the input `list`.
	 * @param {*} acc The accumulator value.
	 * @param {Array} list The list to iterate over.
	 * @return {*} The final, accumulated value.
	 * @see R.addIndex, R.mapAccum
	 * @example
	 *
	 *      var digits = ['1', '2', '3', '4'];
	 *      var append = (a, b) => [a + b, a + b];
	 *
	 *      R.mapAccumRight(append, 5, digits); //=> [['12345', '2345', '345', '45'], '12345']
	 * @symb R.mapAccumRight(f, a, [b, c, d]) = [
	 *   [
	 *     f(b, f(c, f(d, a)[0])[0])[1],
	 *     f(c, f(d, a)[0])[1],
	 *     f(d, a)[1],
	 *   ]
	 *   f(b, f(c, f(d, a)[0])[0])[0],
	 * ]
	 */
	module.exports = _curry3(function mapAccumRight(fn, acc, list) {
	  var idx = list.length - 1;
	  var result = [];
	  var tuple = [acc];
	  while (idx >= 0) {
	    tuple = fn(list[idx], tuple[0]);
	    result[idx] = tuple[1];
	    idx -= 1;
	  }
	  return [result, tuple[0]];
	});


/***/ },
/* 216 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);
	var _reduce = __webpack_require__(36);
	var keys = __webpack_require__(42);


	/**
	 * An Object-specific version of `map`. The function is applied to three
	 * arguments: *(value, key, obj)*. If only the value is significant, use
	 * `map` instead.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.9.0
	 * @category Object
	 * @sig ((*, String, Object) -> *) -> Object -> Object
	 * @param {Function} fn
	 * @param {Object} obj
	 * @return {Object}
	 * @see R.map
	 * @example
	 *
	 *      var values = { x: 1, y: 2, z: 3 };
	 *      var prependKeyAndDouble = (num, key, obj) => key + (num * 2);
	 *
	 *      R.mapObjIndexed(prependKeyAndDouble, values); //=> { x: 'x2', y: 'y4', z: 'z6' }
	 */
	module.exports = _curry2(function mapObjIndexed(fn, obj) {
	  return _reduce(function(acc, key) {
	    acc[key] = fn(obj[key], key, obj);
	    return acc;
	  }, {}, keys(obj));
	});


/***/ },
/* 217 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);


	/**
	 * Tests a regular expression against a String. Note that this function will
	 * return an empty array when there are no matches. This differs from
	 * [`String.prototype.match`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/match)
	 * which returns `null` when there are no matches.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.1.0
	 * @category String
	 * @sig RegExp -> String -> [String | Undefined]
	 * @param {RegExp} rx A regular expression.
	 * @param {String} str The string to match against
	 * @return {Array} The list of matches or empty array.
	 * @see R.test
	 * @example
	 *
	 *      R.match(/([a-z]a)/g, 'bananas'); //=> ['ba', 'na', 'na']
	 *      R.match(/a/, 'b'); //=> []
	 *      R.match(/a/, null); //=> TypeError: null does not have a method named "match"
	 */
	module.exports = _curry2(function match(rx, str) {
	  return str.match(rx) || [];
	});


/***/ },
/* 218 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);
	var _isInteger = __webpack_require__(62);


	/**
	 * mathMod behaves like the modulo operator should mathematically, unlike the
	 * `%` operator (and by extension, R.modulo). So while "-17 % 5" is -2,
	 * mathMod(-17, 5) is 3. mathMod requires Integer arguments, and returns NaN
	 * when the modulus is zero or negative.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.3.0
	 * @category Math
	 * @sig Number -> Number -> Number
	 * @param {Number} m The dividend.
	 * @param {Number} p the modulus.
	 * @return {Number} The result of `b mod a`.
	 * @example
	 *
	 *      R.mathMod(-17, 5);  //=> 3
	 *      R.mathMod(17, 5);   //=> 2
	 *      R.mathMod(17, -5);  //=> NaN
	 *      R.mathMod(17, 0);   //=> NaN
	 *      R.mathMod(17.2, 5); //=> NaN
	 *      R.mathMod(17, 5.3); //=> NaN
	 *
	 *      var clock = R.mathMod(R.__, 12);
	 *      clock(15); //=> 3
	 *      clock(24); //=> 0
	 *
	 *      var seventeenMod = R.mathMod(17);
	 *      seventeenMod(3);  //=> 2
	 *      seventeenMod(4);  //=> 1
	 *      seventeenMod(10); //=> 7
	 */
	module.exports = _curry2(function mathMod(m, p) {
	  if (!_isInteger(m)) { return NaN; }
	  if (!_isInteger(p) || p < 1) { return NaN; }
	  return ((m % p) + p) % p;
	});


/***/ },
/* 219 */
/***/ function(module, exports, __webpack_require__) {

	var _curry3 = __webpack_require__(23);


	/**
	 * Takes a function and two values, and returns whichever value produces the
	 * larger result when passed to the provided function.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.8.0
	 * @category Relation
	 * @sig Ord b => (a -> b) -> a -> a -> a
	 * @param {Function} f
	 * @param {*} a
	 * @param {*} b
	 * @return {*}
	 * @see R.max, R.minBy
	 * @example
	 *
	 *      //  square :: Number -> Number
	 *      var square = n => n * n;
	 *
	 *      R.maxBy(square, -3, 2); //=> -3
	 *
	 *      R.reduce(R.maxBy(square), 0, [3, -5, 4, 1, -2]); //=> -5
	 *      R.reduce(R.maxBy(square), 0, []); //=> 0
	 */
	module.exports = _curry3(function maxBy(f, a, b) {
	  return f(b) > f(a) ? b : a;
	});


/***/ },
/* 220 */
/***/ function(module, exports, __webpack_require__) {

	var _curry1 = __webpack_require__(11);
	var sum = __webpack_require__(221);


	/**
	 * Returns the mean of the given list of numbers.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.14.0
	 * @category Math
	 * @sig [Number] -> Number
	 * @param {Array} list
	 * @return {Number}
	 * @example
	 *
	 *      R.mean([2, 7, 9]); //=> 6
	 *      R.mean([]); //=> NaN
	 */
	module.exports = _curry1(function mean(list) {
	  return sum(list) / list.length;
	});


/***/ },
/* 221 */
/***/ function(module, exports, __webpack_require__) {

	var add = __webpack_require__(15);
	var reduce = __webpack_require__(46);


	/**
	 * Adds together all the elements of a list.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.1.0
	 * @category Math
	 * @sig [Number] -> Number
	 * @param {Array} list An array of numbers
	 * @return {Number} The sum of all the numbers in the list.
	 * @see R.reduce
	 * @example
	 *
	 *      R.sum([2,4,6,8,100,1]); //=> 121
	 */
	module.exports = reduce(add, 0);


/***/ },
/* 222 */
/***/ function(module, exports, __webpack_require__) {

	var _curry1 = __webpack_require__(11);
	var mean = __webpack_require__(220);


	/**
	 * Returns the median of the given list of numbers.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.14.0
	 * @category Math
	 * @sig [Number] -> Number
	 * @param {Array} list
	 * @return {Number}
	 * @example
	 *
	 *      R.median([2, 9, 7]); //=> 7
	 *      R.median([7, 2, 10, 9]); //=> 8
	 *      R.median([]); //=> NaN
	 */
	module.exports = _curry1(function median(list) {
	  var len = list.length;
	  if (len === 0) {
	    return NaN;
	  }
	  var width = 2 - len % 2;
	  var idx = (len - width) / 2;
	  return mean(Array.prototype.slice.call(list, 0).sort(function(a, b) {
	    return a < b ? -1 : a > b ? 1 : 0;
	  }).slice(idx, idx + width));
	});


/***/ },
/* 223 */
/***/ function(module, exports, __webpack_require__) {

	var _arity = __webpack_require__(20);
	var _curry1 = __webpack_require__(11);
	var _has = __webpack_require__(43);
	var toString = __webpack_require__(96);


	/**
	 * Creates a new function that, when invoked, caches the result of calling `fn`
	 * for a given argument set and returns the result. Subsequent calls to the
	 * memoized `fn` with the same argument set will not result in an additional
	 * call to `fn`; instead, the cached result for that set of arguments will be
	 * returned.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.1.0
	 * @category Function
	 * @sig (*... -> a) -> (*... -> a)
	 * @param {Function} fn The function to memoize.
	 * @return {Function} Memoized version of `fn`.
	 * @example
	 *
	 *      var count = 0;
	 *      var factorial = R.memoize(n => {
	 *        count += 1;
	 *        return R.product(R.range(1, n + 1));
	 *      });
	 *      factorial(5); //=> 120
	 *      factorial(5); //=> 120
	 *      factorial(5); //=> 120
	 *      count; //=> 1
	 */
	module.exports = _curry1(function memoize(fn) {
	  var cache = {};
	  return _arity(fn.length, function() {
	    var key = toString(arguments);
	    if (!_has(key, cache)) {
	      cache[key] = fn.apply(this, arguments);
	    }
	    return cache[key];
	  });
	});


/***/ },
/* 224 */
/***/ function(module, exports, __webpack_require__) {

	var _assign = __webpack_require__(191);
	var _curry2 = __webpack_require__(16);


	/**
	 * Create a new object with the own properties of the first object merged with
	 * the own properties of the second object. If a key exists in both objects,
	 * the value from the second object will be used.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.1.0
	 * @category Object
	 * @sig {k: v} -> {k: v} -> {k: v}
	 * @param {Object} l
	 * @param {Object} r
	 * @return {Object}
	 * @see R.mergeWith, R.mergeWithKey
	 * @example
	 *
	 *      R.merge({ 'name': 'fred', 'age': 10 }, { 'age': 40 });
	 *      //=> { 'name': 'fred', 'age': 40 }
	 *
	 *      var resetToDefault = R.merge(R.__, {x: 0});
	 *      resetToDefault({x: 5, y: 2}); //=> {x: 0, y: 2}
	 * @symb R.merge({ x: 1, y: 2 }, { y: 5, z: 3 }) = { x: 1, y: 5, z: 3 }
	 */
	module.exports = _curry2(function merge(l, r) {
	  return _assign({}, l, r);
	});


/***/ },
/* 225 */
/***/ function(module, exports, __webpack_require__) {

	var _assign = __webpack_require__(191);
	var _curry1 = __webpack_require__(11);


	/**
	 * Merges a list of objects together into one object.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.10.0
	 * @category List
	 * @sig [{k: v}] -> {k: v}
	 * @param {Array} list An array of objects
	 * @return {Object} A merged object.
	 * @see R.reduce
	 * @example
	 *
	 *      R.mergeAll([{foo:1},{bar:2},{baz:3}]); //=> {foo:1,bar:2,baz:3}
	 *      R.mergeAll([{foo:1},{foo:2},{bar:2}]); //=> {foo:2,bar:2}
	 * @symb R.mergeAll([{ x: 1 }, { y: 2 }, { z: 3 }]) = { x: 1, y: 2, z: 3 }
	 */
	module.exports = _curry1(function mergeAll(list) {
	  return _assign.apply(null, [{}].concat(list));
	});


/***/ },
/* 226 */
/***/ function(module, exports, __webpack_require__) {

	var _curry3 = __webpack_require__(23);
	var mergeWithKey = __webpack_require__(227);


	/**
	 * Creates a new object with the own properties of the two provided objects. If
	 * a key exists in both objects, the provided function is applied to the values
	 * associated with the key in each object, with the result being used as the
	 * value associated with the key in the returned object. The key will be
	 * excluded from the returned object if the resulting value is `undefined`.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.19.0
	 * @category Object
	 * @sig (a -> a -> a) -> {a} -> {a} -> {a}
	 * @param {Function} fn
	 * @param {Object} l
	 * @param {Object} r
	 * @return {Object}
	 * @see R.merge, R.mergeWithKey
	 * @example
	 *
	 *      R.mergeWith(R.concat,
	 *                  { a: true, values: [10, 20] },
	 *                  { b: true, values: [15, 35] });
	 *      //=> { a: true, b: true, values: [10, 20, 15, 35] }
	 */
	module.exports = _curry3(function mergeWith(fn, l, r) {
	  return mergeWithKey(function(_, _l, _r) {
	    return fn(_l, _r);
	  }, l, r);
	});


/***/ },
/* 227 */
/***/ function(module, exports, __webpack_require__) {

	var _curry3 = __webpack_require__(23);
	var _has = __webpack_require__(43);


	/**
	 * Creates a new object with the own properties of the two provided objects. If
	 * a key exists in both objects, the provided function is applied to the key
	 * and the values associated with the key in each object, with the result being
	 * used as the value associated with the key in the returned object. The key
	 * will be excluded from the returned object if the resulting value is
	 * `undefined`.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.19.0
	 * @category Object
	 * @sig (String -> a -> a -> a) -> {a} -> {a} -> {a}
	 * @param {Function} fn
	 * @param {Object} l
	 * @param {Object} r
	 * @return {Object}
	 * @see R.merge, R.mergeWith
	 * @example
	 *
	 *      let concatValues = (k, l, r) => k == 'values' ? R.concat(l, r) : r
	 *      R.mergeWithKey(concatValues,
	 *                     { a: true, thing: 'foo', values: [10, 20] },
	 *                     { b: true, thing: 'bar', values: [15, 35] });
	 *      //=> { a: true, b: true, thing: 'bar', values: [10, 20, 15, 35] }
	 * @symb R.mergeWithKey(f, { x: 1, y: 2 }, { y: 5, z: 3 }) = { x: 1, y: f('y', 2, 5), z: 3 }
	 */
	module.exports = _curry3(function mergeWithKey(fn, l, r) {
	  var result = {};
	  var k;

	  for (k in l) {
	    if (_has(k, l)) {
	      result[k] = _has(k, r) ? fn(k, l[k], r[k]) : l[k];
	    }
	  }

	  for (k in r) {
	    if (_has(k, r) && !(_has(k, result))) {
	      result[k] = r[k];
	    }
	  }

	  return result;
	});


/***/ },
/* 228 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);


	/**
	 * Returns the smaller of its two arguments.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.1.0
	 * @category Relation
	 * @sig Ord a => a -> a -> a
	 * @param {*} a
	 * @param {*} b
	 * @return {*}
	 * @see R.minBy, R.max
	 * @example
	 *
	 *      R.min(789, 123); //=> 123
	 *      R.min('a', 'b'); //=> 'a'
	 */
	module.exports = _curry2(function min(a, b) { return b < a ? b : a; });


/***/ },
/* 229 */
/***/ function(module, exports, __webpack_require__) {

	var _curry3 = __webpack_require__(23);


	/**
	 * Takes a function and two values, and returns whichever value produces the
	 * smaller result when passed to the provided function.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.8.0
	 * @category Relation
	 * @sig Ord b => (a -> b) -> a -> a -> a
	 * @param {Function} f
	 * @param {*} a
	 * @param {*} b
	 * @return {*}
	 * @see R.min, R.maxBy
	 * @example
	 *
	 *      //  square :: Number -> Number
	 *      var square = n => n * n;
	 *
	 *      R.minBy(square, -3, 2); //=> 2
	 *
	 *      R.reduce(R.minBy(square), Infinity, [3, -5, 4, 1, -2]); //=> 1
	 *      R.reduce(R.minBy(square), Infinity, []); //=> Infinity
	 */
	module.exports = _curry3(function minBy(f, a, b) {
	  return f(b) < f(a) ? b : a;
	});


/***/ },
/* 230 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);


	/**
	 * Divides the first parameter by the second and returns the remainder. Note
	 * that this function preserves the JavaScript-style behavior for modulo. For
	 * mathematical modulo see `mathMod`.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.1.1
	 * @category Math
	 * @sig Number -> Number -> Number
	 * @param {Number} a The value to the divide.
	 * @param {Number} b The pseudo-modulus
	 * @return {Number} The result of `b % a`.
	 * @see R.mathMod
	 * @example
	 *
	 *      R.modulo(17, 3); //=> 2
	 *      // JS behavior:
	 *      R.modulo(-17, 3); //=> -2
	 *      R.modulo(17, -3); //=> 2
	 *
	 *      var isOdd = R.modulo(R.__, 2);
	 *      isOdd(42); //=> 0
	 *      isOdd(21); //=> 1
	 */
	module.exports = _curry2(function modulo(a, b) { return a % b; });


/***/ },
/* 231 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);


	/**
	 * Multiplies two numbers. Equivalent to `a * b` but curried.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.1.0
	 * @category Math
	 * @sig Number -> Number -> Number
	 * @param {Number} a The first value.
	 * @param {Number} b The second value.
	 * @return {Number} The result of `a * b`.
	 * @see R.divide
	 * @example
	 *
	 *      var double = R.multiply(2);
	 *      var triple = R.multiply(3);
	 *      double(3);       //=>  6
	 *      triple(4);       //=> 12
	 *      R.multiply(2, 5);  //=> 10
	 */
	module.exports = _curry2(function multiply(a, b) { return a * b; });


/***/ },
/* 232 */
/***/ function(module, exports, __webpack_require__) {

	var _curry1 = __webpack_require__(11);


	/**
	 * Negates its argument.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.9.0
	 * @category Math
	 * @sig Number -> Number
	 * @param {Number} n
	 * @return {Number}
	 * @example
	 *
	 *      R.negate(42); //=> -42
	 */
	module.exports = _curry1(function negate(n) { return -n; });


/***/ },
/* 233 */
/***/ function(module, exports, __webpack_require__) {

	var _complement = __webpack_require__(108);
	var _curry2 = __webpack_require__(16);
	var _dispatchable = __webpack_require__(25);
	var _xany = __webpack_require__(49);
	var any = __webpack_require__(48);


	/**
	 * Returns `true` if no elements of the list match the predicate, `false`
	 * otherwise.
	 *
	 * Dispatches to the `any` method of the second argument, if present.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.12.0
	 * @category List
	 * @sig (a -> Boolean) -> [a] -> Boolean
	 * @param {Function} fn The predicate function.
	 * @param {Array} list The array to consider.
	 * @return {Boolean} `true` if the predicate is not satisfied by every element, `false` otherwise.
	 * @see R.all, R.any
	 * @example
	 *
	 *      var isEven = n => n % 2 === 0;
	 *
	 *      R.none(isEven, [1, 3, 5, 7, 9, 11]); //=> true
	 *      R.none(isEven, [1, 3, 5, 7, 8, 11]); //=> false
	 */
	module.exports = _curry2(_complement(_dispatchable(['any'], _xany, any)));


/***/ },
/* 234 */
/***/ function(module, exports, __webpack_require__) {

	var _curry1 = __webpack_require__(11);
	var curryN = __webpack_require__(19);
	var nth = __webpack_require__(144);


	/**
	 * Returns a function which returns its nth argument.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.9.0
	 * @category Function
	 * @sig Number -> *... -> *
	 * @param {Number} n
	 * @return {Function}
	 * @example
	 *
	 *      R.nthArg(1)('a', 'b', 'c'); //=> 'b'
	 *      R.nthArg(-1)('a', 'b', 'c'); //=> 'c'
	 * @symb R.nthArg(-1)(a, b, c) = c
	 * @symb R.nthArg(0)(a, b, c) = a
	 * @symb R.nthArg(1)(a, b, c) = b
	 */
	module.exports = _curry1(function nthArg(n) {
	  var arity = n < 0 ? 1 : n + 1;
	  return curryN(arity, function() {
	    return nth(n, arguments);
	  });
	});


/***/ },
/* 235 */
/***/ function(module, exports, __webpack_require__) {

	var _curry1 = __webpack_require__(11);
	var _of = __webpack_require__(236);


	/**
	 * Returns a singleton array containing the value provided.
	 *
	 * Note this `of` is different from the ES6 `of`; See
	 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/of
	 *
	 * @func
	 * @memberOf R
	 * @since v0.3.0
	 * @category Function
	 * @sig a -> [a]
	 * @param {*} x any value
	 * @return {Array} An array wrapping `x`.
	 * @example
	 *
	 *      R.of(null); //=> [null]
	 *      R.of([42]); //=> [[42]]
	 */
	module.exports = _curry1(_of);


/***/ },
/* 236 */
/***/ function(module, exports) {

	module.exports = function _of(x) { return [x]; };


/***/ },
/* 237 */
/***/ function(module, exports, __webpack_require__) {

	var _contains = __webpack_require__(98);
	var _curry2 = __webpack_require__(16);


	/**
	 * Returns a partial copy of an object omitting the keys specified.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.1.0
	 * @category Object
	 * @sig [String] -> {String: *} -> {String: *}
	 * @param {Array} names an array of String property names to omit from the new object
	 * @param {Object} obj The object to copy from
	 * @return {Object} A new object with properties from `names` not on it.
	 * @see R.pick
	 * @example
	 *
	 *      R.omit(['a', 'd'], {a: 1, b: 2, c: 3, d: 4}); //=> {b: 2, c: 3}
	 */
	module.exports = _curry2(function omit(names, obj) {
	  var result = {};
	  for (var prop in obj) {
	    if (!_contains(prop, names)) {
	      result[prop] = obj[prop];
	    }
	  }
	  return result;
	});


/***/ },
/* 238 */
/***/ function(module, exports, __webpack_require__) {

	var _arity = __webpack_require__(20);
	var _curry1 = __webpack_require__(11);


	/**
	 * Accepts a function `fn` and returns a function that guards invocation of
	 * `fn` such that `fn` can only ever be called once, no matter how many times
	 * the returned function is invoked. The first value calculated is returned in
	 * subsequent invocations.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.1.0
	 * @category Function
	 * @sig (a... -> b) -> (a... -> b)
	 * @param {Function} fn The function to wrap in a call-only-once wrapper.
	 * @return {Function} The wrapped function.
	 * @example
	 *
	 *      var addOneOnce = R.once(x => x + 1);
	 *      addOneOnce(10); //=> 11
	 *      addOneOnce(addOneOnce(50)); //=> 11
	 */
	module.exports = _curry1(function once(fn) {
	  var called = false;
	  var result;
	  return _arity(fn.length, function() {
	    if (called) {
	      return result;
	    }
	    called = true;
	    result = fn.apply(this, arguments);
	    return result;
	  });
	});


/***/ },
/* 239 */
/***/ function(module, exports, __webpack_require__) {

	var _curry3 = __webpack_require__(23);


	/**
	 * Returns the result of "setting" the portion of the given data structure
	 * focused by the given lens to the result of applying the given function to
	 * the focused value.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.16.0
	 * @category Object
	 * @typedefn Lens s a = Functor f => (a -> f a) -> s -> f s
	 * @sig Lens s a -> (a -> a) -> s -> s
	 * @param {Lens} lens
	 * @param {*} v
	 * @param {*} x
	 * @return {*}
	 * @see R.prop, R.lensIndex, R.lensProp
	 * @example
	 *
	 *      var headLens = R.lensIndex(0);
	 *
	 *      R.over(headLens, R.toUpper, ['foo', 'bar', 'baz']); //=> ['FOO', 'bar', 'baz']
	 */
	module.exports = (function() {
	  // `Identity` is a functor that holds a single value, where `map` simply
	  // transforms the held value with the provided function.
	  var Identity = function(x) {
	    return {value: x, map: function(f) { return Identity(f(x)); }};
	  };

	  return _curry3(function over(lens, f, x) {
	    // The value returned by the getter function is first transformed with `f`,
	    // then set as the value of an `Identity`. This is then mapped over with the
	    // setter function of the lens.
	    return lens(function(y) { return Identity(f(y)); })(x).value;
	  });
	}());


/***/ },
/* 240 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);


	/**
	 * Takes two arguments, `fst` and `snd`, and returns `[fst, snd]`.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.18.0
	 * @category List
	 * @sig a -> b -> (a,b)
	 * @param {*} fst
	 * @param {*} snd
	 * @return {Array}
	 * @see R.objOf, R.of
	 * @example
	 *
	 *      R.pair('foo', 'bar'); //=> ['foo', 'bar']
	 */
	module.exports = _curry2(function pair(fst, snd) { return [fst, snd]; });


/***/ },
/* 241 */
/***/ function(module, exports, __webpack_require__) {

	var _concat = __webpack_require__(18);
	var _createPartialApplicator = __webpack_require__(242);


	/**
	 * Takes a function `f` and a list of arguments, and returns a function `g`.
	 * When applied, `g` returns the result of applying `f` to the arguments
	 * provided initially followed by the arguments provided to `g`.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.10.0
	 * @category Function
	 * @sig ((a, b, c, ..., n) -> x) -> [a, b, c, ...] -> ((d, e, f, ..., n) -> x)
	 * @param {Function} f
	 * @param {Array} args
	 * @return {Function}
	 * @see R.partialRight
	 * @example
	 *
	 *      var multiply2 = (a, b) => a * b;
	 *      var double = R.partial(multiply2, [2]);
	 *      double(2); //=> 4
	 *
	 *      var greet = (salutation, title, firstName, lastName) =>
	 *        salutation + ', ' + title + ' ' + firstName + ' ' + lastName + '!';
	 *
	 *      var sayHello = R.partial(greet, ['Hello']);
	 *      var sayHelloToMs = R.partial(sayHello, ['Ms.']);
	 *      sayHelloToMs('Jane', 'Jones'); //=> 'Hello, Ms. Jane Jones!'
	 * @symb R.partial(f, [a, b])(c, d) = f(a, b, c, d)
	 */
	module.exports = _createPartialApplicator(_concat);


/***/ },
/* 242 */
/***/ function(module, exports, __webpack_require__) {

	var _arity = __webpack_require__(20);
	var _curry2 = __webpack_require__(16);


	module.exports = function _createPartialApplicator(concat) {
	  return _curry2(function(fn, args) {
	    return _arity(Math.max(0, fn.length - args.length), function() {
	      return fn.apply(this, concat(args, arguments));
	    });
	  });
	};


/***/ },
/* 243 */
/***/ function(module, exports, __webpack_require__) {

	var _concat = __webpack_require__(18);
	var _createPartialApplicator = __webpack_require__(242);
	var flip = __webpack_require__(162);


	/**
	 * Takes a function `f` and a list of arguments, and returns a function `g`.
	 * When applied, `g` returns the result of applying `f` to the arguments
	 * provided to `g` followed by the arguments provided initially.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.10.0
	 * @category Function
	 * @sig ((a, b, c, ..., n) -> x) -> [d, e, f, ..., n] -> ((a, b, c, ...) -> x)
	 * @param {Function} f
	 * @param {Array} args
	 * @return {Function}
	 * @see R.partial
	 * @example
	 *
	 *      var greet = (salutation, title, firstName, lastName) =>
	 *        salutation + ', ' + title + ' ' + firstName + ' ' + lastName + '!';
	 *
	 *      var greetMsJaneJones = R.partialRight(greet, ['Ms.', 'Jane', 'Jones']);
	 *
	 *      greetMsJaneJones('Hello'); //=> 'Hello, Ms. Jane Jones!'
	 * @symb R.partialRight(f, [a, b])(c, d) = f(c, d, a, b)
	 */
	module.exports = _createPartialApplicator(flip(_concat));


/***/ },
/* 244 */
/***/ function(module, exports, __webpack_require__) {

	var filter = __webpack_require__(109);
	var juxt = __webpack_require__(201);
	var reject = __webpack_require__(107);


	/**
	 * Takes a predicate and a list or other "filterable" object and returns the
	 * pair of filterable objects of the same type of elements which do and do not
	 * satisfy, the predicate, respectively.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.1.4
	 * @category List
	 * @sig Filterable f => (a -> Boolean) -> f a -> [f a, f a]
	 * @param {Function} pred A predicate to determine which side the element belongs to.
	 * @param {Array} filterable the list (or other filterable) to partition.
	 * @return {Array} An array, containing first the subset of elements that satisfy the
	 *         predicate, and second the subset of elements that do not satisfy.
	 * @see R.filter, R.reject
	 * @example
	 *
	 *      R.partition(R.contains('s'), ['sss', 'ttt', 'foo', 'bars']);
	 *      // => [ [ 'sss', 'bars' ],  [ 'ttt', 'foo' ] ]
	 *
	 *      R.partition(R.contains('s'), { a: 'sss', b: 'ttt', foo: 'bars' });
	 *      // => [ { a: 'sss', foo: 'bars' }, { b: 'ttt' }  ]
	 */
	module.exports = juxt([filter, reject]);


/***/ },
/* 245 */
/***/ function(module, exports, __webpack_require__) {

	var _curry3 = __webpack_require__(23);
	var equals = __webpack_require__(100);
	var path = __webpack_require__(210);


	/**
	 * Determines whether a nested path on an object has a specific value, in
	 * `R.equals` terms. Most likely used to filter a list.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.7.0
	 * @category Relation
	 * @typedefn Idx = String | Int
	 * @sig [Idx] -> a -> {a} -> Boolean
	 * @param {Array} path The path of the nested property to use
	 * @param {*} val The value to compare the nested property with
	 * @param {Object} obj The object to check the nested property in
	 * @return {Boolean} `true` if the value equals the nested object property,
	 *         `false` otherwise.
	 * @example
	 *
	 *      var user1 = { address: { zipCode: 90210 } };
	 *      var user2 = { address: { zipCode: 55555 } };
	 *      var user3 = { name: 'Bob' };
	 *      var users = [ user1, user2, user3 ];
	 *      var isFamous = R.pathEq(['address', 'zipCode'], 90210);
	 *      R.filter(isFamous, users); //=> [ user1 ]
	 */
	module.exports = _curry3(function pathEq(_path, val, obj) {
	  return equals(path(_path, obj), val);
	});


/***/ },
/* 246 */
/***/ function(module, exports, __webpack_require__) {

	var _curry3 = __webpack_require__(23);
	var defaultTo = __webpack_require__(123);
	var path = __webpack_require__(210);


	/**
	 * If the given, non-null object has a value at the given path, returns the
	 * value at that path. Otherwise returns the provided default value.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.18.0
	 * @category Object
	 * @typedefn Idx = String | Int
	 * @sig a -> [Idx] -> {a} -> a
	 * @param {*} d The default value.
	 * @param {Array} p The path to use.
	 * @param {Object} obj The object to retrieve the nested property from.
	 * @return {*} The data at `path` of the supplied object or the default value.
	 * @example
	 *
	 *      R.pathOr('N/A', ['a', 'b'], {a: {b: 2}}); //=> 2
	 *      R.pathOr('N/A', ['a', 'b'], {c: {b: 2}}); //=> "N/A"
	 */
	module.exports = _curry3(function pathOr(d, p, obj) {
	  return defaultTo(d, path(p, obj));
	});


/***/ },
/* 247 */
/***/ function(module, exports, __webpack_require__) {

	var _curry3 = __webpack_require__(23);
	var path = __webpack_require__(210);


	/**
	 * Returns `true` if the specified object property at given path satisfies the
	 * given predicate; `false` otherwise.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.19.0
	 * @category Logic
	 * @typedefn Idx = String | Int
	 * @sig (a -> Boolean) -> [Idx] -> {a} -> Boolean
	 * @param {Function} pred
	 * @param {Array} propPath
	 * @param {*} obj
	 * @return {Boolean}
	 * @see R.propSatisfies, R.path
	 * @example
	 *
	 *      R.pathSatisfies(y => y > 0, ['x', 'y'], {x: {y: 2}}); //=> true
	 */
	module.exports = _curry3(function pathSatisfies(pred, propPath, obj) {
	  return propPath.length > 0 && pred(path(propPath, obj));
	});


/***/ },
/* 248 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);


	/**
	 * Returns a partial copy of an object containing only the keys specified. If
	 * the key does not exist, the property is ignored.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.1.0
	 * @category Object
	 * @sig [k] -> {k: v} -> {k: v}
	 * @param {Array} names an array of String property names to copy onto a new object
	 * @param {Object} obj The object to copy from
	 * @return {Object} A new object with only properties from `names` on it.
	 * @see R.omit, R.props
	 * @example
	 *
	 *      R.pick(['a', 'd'], {a: 1, b: 2, c: 3, d: 4}); //=> {a: 1, d: 4}
	 *      R.pick(['a', 'e', 'f'], {a: 1, b: 2, c: 3, d: 4}); //=> {a: 1}
	 */
	module.exports = _curry2(function pick(names, obj) {
	  var result = {};
	  var idx = 0;
	  while (idx < names.length) {
	    if (names[idx] in obj) {
	      result[names[idx]] = obj[names[idx]];
	    }
	    idx += 1;
	  }
	  return result;
	});


/***/ },
/* 249 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);


	/**
	 * Similar to `pick` except that this one includes a `key: undefined` pair for
	 * properties that don't exist.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.1.0
	 * @category Object
	 * @sig [k] -> {k: v} -> {k: v}
	 * @param {Array} names an array of String property names to copy onto a new object
	 * @param {Object} obj The object to copy from
	 * @return {Object} A new object with only properties from `names` on it.
	 * @see R.pick
	 * @example
	 *
	 *      R.pickAll(['a', 'd'], {a: 1, b: 2, c: 3, d: 4}); //=> {a: 1, d: 4}
	 *      R.pickAll(['a', 'e', 'f'], {a: 1, b: 2, c: 3, d: 4}); //=> {a: 1, e: undefined, f: undefined}
	 */
	module.exports = _curry2(function pickAll(names, obj) {
	  var result = {};
	  var idx = 0;
	  var len = names.length;
	  while (idx < len) {
	    var name = names[idx];
	    result[name] = obj[name];
	    idx += 1;
	  }
	  return result;
	});


/***/ },
/* 250 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);


	/**
	 * Returns a partial copy of an object containing only the keys that satisfy
	 * the supplied predicate.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.8.0
	 * @category Object
	 * @sig (v, k -> Boolean) -> {k: v} -> {k: v}
	 * @param {Function} pred A predicate to determine whether or not a key
	 *        should be included on the output object.
	 * @param {Object} obj The object to copy from
	 * @return {Object} A new object with only properties that satisfy `pred`
	 *         on it.
	 * @see R.pick, R.filter
	 * @example
	 *
	 *      var isUpperCase = (val, key) => key.toUpperCase() === key;
	 *      R.pickBy(isUpperCase, {a: 1, b: 2, A: 3, B: 4}); //=> {A: 3, B: 4}
	 */
	module.exports = _curry2(function pickBy(test, obj) {
	  var result = {};
	  for (var prop in obj) {
	    if (test(obj[prop], prop, obj)) {
	      result[prop] = obj[prop];
	    }
	  }
	  return result;
	});


/***/ },
/* 251 */
/***/ function(module, exports, __webpack_require__) {

	var composeK = __webpack_require__(91);
	var reverse = __webpack_require__(90);

	/**
	 * Returns the left-to-right Kleisli composition of the provided functions,
	 * each of which must return a value of a type supported by [`chain`](#chain).
	 *
	 * `R.pipeK(f, g, h)` is equivalent to `R.pipe(R.chain(f), R.chain(g), R.chain(h))`.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.16.0
	 * @category Function
	 * @sig Chain m => ((a -> m b), (b -> m c), ..., (y -> m z)) -> (a -> m z)
	 * @param {...Function}
	 * @return {Function}
	 * @see R.composeK
	 * @example
	 *
	 *      //  parseJson :: String -> Maybe *
	 *      //  get :: String -> Object -> Maybe *
	 *
	 *      //  getStateCode :: Maybe String -> Maybe String
	 *      var getStateCode = R.pipeK(
	 *        parseJson,
	 *        get('user'),
	 *        get('address'),
	 *        get('state'),
	 *        R.compose(Maybe.of, R.toUpper)
	 *      );
	 *
	 *      getStateCode('{"user":{"address":{"state":"ny"}}}');
	 *      //=> Just('NY')
	 *      getStateCode('[Invalid JSON]');
	 *      //=> Nothing()
	 * @symb R.pipeK(f, g, h)(a) = R.chain(h, R.chain(g, f(a)))
	 */
	module.exports = function pipeK() {
	  if (arguments.length === 0) {
	    throw new Error('pipeK requires at least one argument');
	  }
	  return composeK.apply(this, reverse(arguments));
	};


/***/ },
/* 252 */
/***/ function(module, exports, __webpack_require__) {

	var _concat = __webpack_require__(18);
	var _curry2 = __webpack_require__(16);


	/**
	 * Returns a new list with the given element at the front, followed by the
	 * contents of the list.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.1.0
	 * @category List
	 * @sig a -> [a] -> [a]
	 * @param {*} el The item to add to the head of the output list.
	 * @param {Array} list The array to add to the tail of the output list.
	 * @return {Array} A new array.
	 * @see R.append
	 * @example
	 *
	 *      R.prepend('fee', ['fi', 'fo', 'fum']); //=> ['fee', 'fi', 'fo', 'fum']
	 */
	module.exports = _curry2(function prepend(el, list) {
	  return _concat([el], list);
	});


/***/ },
/* 253 */
/***/ function(module, exports, __webpack_require__) {

	var multiply = __webpack_require__(231);
	var reduce = __webpack_require__(46);


	/**
	 * Multiplies together all the elements of a list.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.1.0
	 * @category Math
	 * @sig [Number] -> Number
	 * @param {Array} list An array of numbers
	 * @return {Number} The product of all the numbers in the list.
	 * @see R.reduce
	 * @example
	 *
	 *      R.product([2,4,6,8,100,1]); //=> 38400
	 */
	module.exports = reduce(multiply, 1);


/***/ },
/* 254 */
/***/ function(module, exports, __webpack_require__) {

	var _map = __webpack_require__(35);
	var identity = __webpack_require__(173);
	var pickAll = __webpack_require__(249);
	var useWith = __webpack_require__(255);


	/**
	 * Reasonable analog to SQL `select` statement.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.1.0
	 * @category Object
	 * @category Relation
	 * @sig [k] -> [{k: v}] -> [{k: v}]
	 * @param {Array} props The property names to project
	 * @param {Array} objs The objects to query
	 * @return {Array} An array of objects with just the `props` properties.
	 * @example
	 *
	 *      var abby = {name: 'Abby', age: 7, hair: 'blond', grade: 2};
	 *      var fred = {name: 'Fred', age: 12, hair: 'brown', grade: 7};
	 *      var kids = [abby, fred];
	 *      R.project(['name', 'grade'], kids); //=> [{name: 'Abby', grade: 2}, {name: 'Fred', grade: 7}]
	 */
	module.exports = useWith(_map, [pickAll, identity]); // passing `identity` gives correct arity


/***/ },
/* 255 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);
	var curryN = __webpack_require__(19);


	/**
	 * Accepts a function `fn` and a list of transformer functions and returns a
	 * new curried function. When the new function is invoked, it calls the
	 * function `fn` with parameters consisting of the result of calling each
	 * supplied handler on successive arguments to the new function.
	 *
	 * If more arguments are passed to the returned function than transformer
	 * functions, those arguments are passed directly to `fn` as additional
	 * parameters. If you expect additional arguments that don't need to be
	 * transformed, although you can ignore them, it's best to pass an identity
	 * function so that the new function reports the correct arity.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.1.0
	 * @category Function
	 * @sig (x1 -> x2 -> ... -> z) -> [(a -> x1), (b -> x2), ...] -> (a -> b -> ... -> z)
	 * @param {Function} fn The function to wrap.
	 * @param {Array} transformers A list of transformer functions
	 * @return {Function} The wrapped function.
	 * @see R.converge
	 * @example
	 *
	 *      R.useWith(Math.pow, [R.identity, R.identity])(3, 4); //=> 81
	 *      R.useWith(Math.pow, [R.identity, R.identity])(3)(4); //=> 81
	 *      R.useWith(Math.pow, [R.dec, R.inc])(3, 4); //=> 32
	 *      R.useWith(Math.pow, [R.dec, R.inc])(3)(4); //=> 32
	 * @symb R.useWith(f, [g, h])(a, b) = f(g(a), h(b))
	 */
	module.exports = _curry2(function useWith(fn, transformers) {
	  return curryN(transformers.length, function() {
	    var args = [];
	    var idx = 0;
	    while (idx < transformers.length) {
	      args.push(transformers[idx].call(this, arguments[idx]));
	      idx += 1;
	    }
	    return fn.apply(this, args.concat(Array.prototype.slice.call(arguments, transformers.length)));
	  });
	});


/***/ },
/* 256 */
/***/ function(module, exports, __webpack_require__) {

	var _curry3 = __webpack_require__(23);
	var equals = __webpack_require__(100);


	/**
	 * Returns `true` if the specified object property is equal, in `R.equals`
	 * terms, to the given value; `false` otherwise.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.1.0
	 * @category Relation
	 * @sig String -> a -> Object -> Boolean
	 * @param {String} name
	 * @param {*} val
	 * @param {*} obj
	 * @return {Boolean}
	 * @see R.equals, R.propSatisfies
	 * @example
	 *
	 *      var abby = {name: 'Abby', age: 7, hair: 'blond'};
	 *      var fred = {name: 'Fred', age: 12, hair: 'brown'};
	 *      var rusty = {name: 'Rusty', age: 10, hair: 'brown'};
	 *      var alois = {name: 'Alois', age: 15, disposition: 'surly'};
	 *      var kids = [abby, fred, rusty, alois];
	 *      var hasBrownHair = R.propEq('hair', 'brown');
	 *      R.filter(hasBrownHair, kids); //=> [fred, rusty]
	 */
	module.exports = _curry3(function propEq(name, val, obj) {
	  return equals(val, obj[name]);
	});


/***/ },
/* 257 */
/***/ function(module, exports, __webpack_require__) {

	var _curry3 = __webpack_require__(23);
	var is = __webpack_require__(197);


	/**
	 * Returns `true` if the specified object property is of the given type;
	 * `false` otherwise.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.16.0
	 * @category Type
	 * @sig Type -> String -> Object -> Boolean
	 * @param {Function} type
	 * @param {String} name
	 * @param {*} obj
	 * @return {Boolean}
	 * @see R.is, R.propSatisfies
	 * @example
	 *
	 *      R.propIs(Number, 'x', {x: 1, y: 2});  //=> true
	 *      R.propIs(Number, 'x', {x: 'foo'});    //=> false
	 *      R.propIs(Number, 'x', {});            //=> false
	 */
	module.exports = _curry3(function propIs(type, name, obj) {
	  return is(type, obj[name]);
	});


/***/ },
/* 258 */
/***/ function(module, exports, __webpack_require__) {

	var _curry3 = __webpack_require__(23);
	var _has = __webpack_require__(43);


	/**
	 * If the given, non-null object has an own property with the specified name,
	 * returns the value of that property. Otherwise returns the provided default
	 * value.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.6.0
	 * @category Object
	 * @sig a -> String -> Object -> a
	 * @param {*} val The default value.
	 * @param {String} p The name of the property to return.
	 * @param {Object} obj The object to query.
	 * @return {*} The value of given property of the supplied object or the default value.
	 * @example
	 *
	 *      var alice = {
	 *        name: 'ALICE',
	 *        age: 101
	 *      };
	 *      var favorite = R.prop('favoriteLibrary');
	 *      var favoriteWithDefault = R.propOr('Ramda', 'favoriteLibrary');
	 *
	 *      favorite(alice);  //=> undefined
	 *      favoriteWithDefault(alice);  //=> 'Ramda'
	 */
	module.exports = _curry3(function propOr(val, p, obj) {
	  return (obj != null && _has(p, obj)) ? obj[p] : val;
	});


/***/ },
/* 259 */
/***/ function(module, exports, __webpack_require__) {

	var _curry3 = __webpack_require__(23);


	/**
	 * Returns `true` if the specified object property satisfies the given
	 * predicate; `false` otherwise.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.16.0
	 * @category Logic
	 * @sig (a -> Boolean) -> String -> {String: a} -> Boolean
	 * @param {Function} pred
	 * @param {String} name
	 * @param {*} obj
	 * @return {Boolean}
	 * @see R.propEq, R.propIs
	 * @example
	 *
	 *      R.propSatisfies(x => x > 0, 'x', {x: 1, y: 2}); //=> true
	 */
	module.exports = _curry3(function propSatisfies(pred, name, obj) {
	  return pred(obj[name]);
	});


/***/ },
/* 260 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);


	/**
	 * Acts as multiple `prop`: array of keys in, array of values out. Preserves
	 * order.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.1.0
	 * @category Object
	 * @sig [k] -> {k: v} -> [v]
	 * @param {Array} ps The property names to fetch
	 * @param {Object} obj The object to query
	 * @return {Array} The corresponding values or partially applied function.
	 * @example
	 *
	 *      R.props(['x', 'y'], {x: 1, y: 2}); //=> [1, 2]
	 *      R.props(['c', 'a', 'b'], {b: 2, a: 1}); //=> [undefined, 1, 2]
	 *
	 *      var fullName = R.compose(R.join(' '), R.props(['first', 'last']));
	 *      fullName({last: 'Bullet-Tooth', age: 33, first: 'Tony'}); //=> 'Tony Bullet-Tooth'
	 */
	module.exports = _curry2(function props(ps, obj) {
	  var len = ps.length;
	  var out = [];
	  var idx = 0;

	  while (idx < len) {
	    out[idx] = obj[ps[idx]];
	    idx += 1;
	  }

	  return out;
	});


/***/ },
/* 261 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);
	var _isNumber = __webpack_require__(205);


	/**
	 * Returns a list of numbers from `from` (inclusive) to `to` (exclusive).
	 *
	 * @func
	 * @memberOf R
	 * @since v0.1.0
	 * @category List
	 * @sig Number -> Number -> [Number]
	 * @param {Number} from The first number in the list.
	 * @param {Number} to One more than the last number in the list.
	 * @return {Array} The list of numbers in tthe set `[a, b)`.
	 * @example
	 *
	 *      R.range(1, 5);    //=> [1, 2, 3, 4]
	 *      R.range(50, 53);  //=> [50, 51, 52]
	 */
	module.exports = _curry2(function range(from, to) {
	  if (!(_isNumber(from) && _isNumber(to))) {
	    throw new TypeError('Both arguments to range must be numbers');
	  }
	  var result = [];
	  var n = from;
	  while (n < to) {
	    result.push(n);
	    n += 1;
	  }
	  return result;
	});


/***/ },
/* 262 */
/***/ function(module, exports, __webpack_require__) {

	var _curry3 = __webpack_require__(23);


	/**
	 * Returns a single item by iterating through the list, successively calling
	 * the iterator function and passing it an accumulator value and the current
	 * value from the array, and then passing the result to the next call.
	 *
	 * Similar to `reduce`, except moves through the input list from the right to
	 * the left.
	 *
	 * The iterator function receives two values: *(value, acc)*, while the arguments'
	 * order of `reduce`'s iterator function is *(acc, value)*.
	 *
	 * Note: `R.reduceRight` does not skip deleted or unassigned indices (sparse
	 * arrays), unlike the native `Array.prototype.reduce` method. For more details
	 * on this behavior, see:
	 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduceRight#Description
	 *
	 * @func
	 * @memberOf R
	 * @since v0.1.0
	 * @category List
	 * @sig (a, b -> b) -> b -> [a] -> b
	 * @param {Function} fn The iterator function. Receives two values, the current element from the array
	 *        and the accumulator.
	 * @param {*} acc The accumulator value.
	 * @param {Array} list The list to iterate over.
	 * @return {*} The final, accumulated value.
	 * @see R.reduce, R.addIndex
	 * @example
	 *
	 *      R.reduceRight(R.subtract, 0, [1, 2, 3, 4]) // => (1 - (2 - (3 - (4 - 0)))) = -2
	 *          -               -2
	 *         / \              / \
	 *        1   -            1   3
	 *           / \              / \
	 *          2   -     ==>    2  -1
	 *             / \              / \
	 *            3   -            3   4
	 *               / \              / \
	 *              4   0            4   0
	 *
	 * @symb R.reduceRight(f, a, [b, c, d]) = f(b, f(c, f(d, a)))
	 */
	module.exports = _curry3(function reduceRight(fn, acc, list) {
	  var idx = list.length - 1;
	  while (idx >= 0) {
	    acc = fn(list[idx], acc);
	    idx -= 1;
	  }
	  return acc;
	});


/***/ },
/* 263 */
/***/ function(module, exports, __webpack_require__) {

	var _curryN = __webpack_require__(21);
	var _reduce = __webpack_require__(36);
	var _reduced = __webpack_require__(29);


	/**
	 * Like `reduce`, `reduceWhile` returns a single item by iterating through
	 * the list, successively calling the iterator function. `reduceWhile` also
	 * takes a predicate that is evaluated before each step. If the predicate returns
	 * `false`, it "short-circuits" the iteration and returns the current value
	 * of the accumulator.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.22.0
	 * @category List
	 * @sig ((a, b) -> Boolean) -> ((a, b) -> a) -> a -> [b] -> a
	 * @param {Function} pred The predicate. It is passed the accumulator and the
	 *        current element.
	 * @param {Function} fn The iterator function. Receives two values, the
	 *        accumulator and the current element.
	 * @param {*} a The accumulator value.
	 * @param {Array} list The list to iterate over.
	 * @return {*} The final, accumulated value.
	 * @see R.reduce, R.reduced
	 * @example
	 *
	 *      var isOdd = (acc, x) => x % 2 === 1;
	 *      var xs = [1, 3, 5, 60, 777, 800];
	 *      R.reduceWhile(isOdd, R.add, 0, xs); //=> 9
	 *
	 *      var ys = [2, 4, 6]
	 *      R.reduceWhile(isOdd, R.add, 111, ys); //=> 111
	 */
	module.exports = _curryN(4, [], function _reduceWhile(pred, fn, a, list) {
	  return _reduce(function(acc, x) {
	    return pred(acc, x) ? fn(acc, x) : _reduced(acc);
	  }, a, list);
	});


/***/ },
/* 264 */
/***/ function(module, exports, __webpack_require__) {

	var _curry1 = __webpack_require__(11);
	var _reduced = __webpack_require__(29);

	/**
	 * Returns a value wrapped to indicate that it is the final value of the reduce
	 * and transduce functions. The returned value should be considered a black
	 * box: the internal structure is not guaranteed to be stable.
	 *
	 * Note: this optimization is unavailable to functions not explicitly listed
	 * above. For instance, it is not currently supported by reduceRight.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.15.0
	 * @category List
	 * @sig a -> *
	 * @param {*} x The final value of the reduce.
	 * @return {*} The wrapped value.
	 * @see R.reduce, R.transduce
	 * @example
	 *
	 *      R.reduce(
	 *        R.pipe(R.add, R.when(R.gte(R.__, 10), R.reduced)),
	 *        0,
	 *        [1, 2, 3, 4, 5]) // 10
	 */

	module.exports = _curry1(_reduced);


/***/ },
/* 265 */
/***/ function(module, exports, __webpack_require__) {

	var _curry3 = __webpack_require__(23);


	/**
	 * Removes the sub-list of `list` starting at index `start` and containing
	 * `count` elements. _Note that this is not destructive_: it returns a copy of
	 * the list with the changes.
	 * <small>No lists have been harmed in the application of this function.</small>
	 *
	 * @func
	 * @memberOf R
	 * @since v0.2.2
	 * @category List
	 * @sig Number -> Number -> [a] -> [a]
	 * @param {Number} start The position to start removing elements
	 * @param {Number} count The number of elements to remove
	 * @param {Array} list The list to remove from
	 * @return {Array} A new Array with `count` elements from `start` removed.
	 * @example
	 *
	 *      R.remove(2, 3, [1,2,3,4,5,6,7,8]); //=> [1,2,6,7,8]
	 */
	module.exports = _curry3(function remove(start, count, list) {
	  var result = Array.prototype.slice.call(list, 0);
	  result.splice(start, count);
	  return result;
	});


/***/ },
/* 266 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);
	var always = __webpack_require__(10);
	var times = __webpack_require__(267);


	/**
	 * Returns a fixed list of size `n` containing a specified identical value.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.1.1
	 * @category List
	 * @sig a -> n -> [a]
	 * @param {*} value The value to repeat.
	 * @param {Number} n The desired size of the output list.
	 * @return {Array} A new array containing `n` `value`s.
	 * @example
	 *
	 *      R.repeat('hi', 5); //=> ['hi', 'hi', 'hi', 'hi', 'hi']
	 *
	 *      var obj = {};
	 *      var repeatedObjs = R.repeat(obj, 5); //=> [{}, {}, {}, {}, {}]
	 *      repeatedObjs[0] === repeatedObjs[1]; //=> true
	 * @symb R.repeat(a, 0) = []
	 * @symb R.repeat(a, 1) = [a]
	 * @symb R.repeat(a, 2) = [a, a]
	 */
	module.exports = _curry2(function repeat(value, n) {
	  return times(always(value), n);
	});


/***/ },
/* 267 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);


	/**
	 * Calls an input function `n` times, returning an array containing the results
	 * of those function calls.
	 *
	 * `fn` is passed one argument: The current value of `n`, which begins at `0`
	 * and is gradually incremented to `n - 1`.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.2.3
	 * @category List
	 * @sig (Number -> a) -> Number -> [a]
	 * @param {Function} fn The function to invoke. Passed one argument, the current value of `n`.
	 * @param {Number} n A value between `0` and `n - 1`. Increments after each function call.
	 * @return {Array} An array containing the return values of all calls to `fn`.
	 * @example
	 *
	 *      R.times(R.identity, 5); //=> [0, 1, 2, 3, 4]
	 * @symb R.times(f, 0) = []
	 * @symb R.times(f, 1) = [f(0)]
	 * @symb R.times(f, 2) = [f(0), f(1)]
	 */
	module.exports = _curry2(function times(fn, n) {
	  var len = Number(n);
	  var idx = 0;
	  var list;

	  if (len < 0 || isNaN(len)) {
	    throw new RangeError('n must be a non-negative number');
	  }
	  list = new Array(len);
	  while (idx < len) {
	    list[idx] = fn(idx);
	    idx += 1;
	  }
	  return list;
	});


/***/ },
/* 268 */
/***/ function(module, exports, __webpack_require__) {

	var _curry3 = __webpack_require__(23);


	/**
	 * Replace a substring or regex match in a string with a replacement.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.7.0
	 * @category String
	 * @sig RegExp|String -> String -> String -> String
	 * @param {RegExp|String} pattern A regular expression or a substring to match.
	 * @param {String} replacement The string to replace the matches with.
	 * @param {String} str The String to do the search and replacement in.
	 * @return {String} The result.
	 * @example
	 *
	 *      R.replace('foo', 'bar', 'foo foo foo'); //=> 'bar foo foo'
	 *      R.replace(/foo/, 'bar', 'foo foo foo'); //=> 'bar foo foo'
	 *
	 *      // Use the "g" (global) flag to replace all occurrences:
	 *      R.replace(/foo/g, 'bar', 'foo foo foo'); //=> 'bar bar bar'
	 */
	module.exports = _curry3(function replace(regex, replacement, str) {
	  return str.replace(regex, replacement);
	});


/***/ },
/* 269 */
/***/ function(module, exports, __webpack_require__) {

	var _curry3 = __webpack_require__(23);


	/**
	 * Scan is similar to reduce, but returns a list of successively reduced values
	 * from the left
	 *
	 * @func
	 * @memberOf R
	 * @since v0.10.0
	 * @category List
	 * @sig (a,b -> a) -> a -> [b] -> [a]
	 * @param {Function} fn The iterator function. Receives two values, the accumulator and the
	 *        current element from the array
	 * @param {*} acc The accumulator value.
	 * @param {Array} list The list to iterate over.
	 * @return {Array} A list of all intermediately reduced values.
	 * @example
	 *
	 *      var numbers = [1, 2, 3, 4];
	 *      var factorials = R.scan(R.multiply, 1, numbers); //=> [1, 1, 2, 6, 24]
	 * @symb R.scan(f, a, [b, c]) = [a, f(a, b), f(f(a, b), c)]
	 */
	module.exports = _curry3(function scan(fn, acc, list) {
	  var idx = 0;
	  var len = list.length;
	  var result = [acc];
	  while (idx < len) {
	    acc = fn(acc, list[idx]);
	    result[idx + 1] = acc;
	    idx += 1;
	  }
	  return result;
	});


/***/ },
/* 270 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);
	var ap = __webpack_require__(51);
	var map = __webpack_require__(34);
	var prepend = __webpack_require__(252);
	var reduceRight = __webpack_require__(262);


	/**
	 * Transforms a [Traversable](https://github.com/fantasyland/fantasy-land#traversable)
	 * of [Applicative](https://github.com/fantasyland/fantasy-land#applicative) into an
	 * Applicative of Traversable.
	 *
	 * Dispatches to the `sequence` method of the second argument, if present.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.19.0
	 * @category List
	 * @sig (Applicative f, Traversable t) => (a -> f a) -> t (f a) -> f (t a)
	 * @param {Function} of
	 * @param {*} traversable
	 * @return {*}
	 * @see R.traverse
	 * @example
	 *
	 *      R.sequence(Maybe.of, [Just(1), Just(2), Just(3)]);   //=> Just([1, 2, 3])
	 *      R.sequence(Maybe.of, [Just(1), Just(2), Nothing()]); //=> Nothing()
	 *
	 *      R.sequence(R.of, Just([1, 2, 3])); //=> [Just(1), Just(2), Just(3)]
	 *      R.sequence(R.of, Nothing());       //=> [Nothing()]
	 */
	module.exports = _curry2(function sequence(of, traversable) {
	  return typeof traversable.sequence === 'function' ?
	    traversable.sequence(of) :
	    reduceRight(function(x, acc) { return ap(map(prepend, x), acc); },
	                of([]),
	                traversable);
	});


/***/ },
/* 271 */
/***/ function(module, exports, __webpack_require__) {

	var _curry3 = __webpack_require__(23);
	var always = __webpack_require__(10);
	var over = __webpack_require__(239);


	/**
	 * Returns the result of "setting" the portion of the given data structure
	 * focused by the given lens to the given value.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.16.0
	 * @category Object
	 * @typedefn Lens s a = Functor f => (a -> f a) -> s -> f s
	 * @sig Lens s a -> a -> s -> s
	 * @param {Lens} lens
	 * @param {*} v
	 * @param {*} x
	 * @return {*}
	 * @see R.prop, R.lensIndex, R.lensProp
	 * @example
	 *
	 *      var xLens = R.lensProp('x');
	 *
	 *      R.set(xLens, 4, {x: 1, y: 2});  //=> {x: 4, y: 2}
	 *      R.set(xLens, 8, {x: 1, y: 2});  //=> {x: 8, y: 2}
	 */
	module.exports = _curry3(function set(lens, v, x) {
	  return over(lens, always(v), x);
	});


/***/ },
/* 272 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);


	/**
	 * Returns a copy of the list, sorted according to the comparator function,
	 * which should accept two values at a time and return a negative number if the
	 * first value is smaller, a positive number if it's larger, and zero if they
	 * are equal. Please note that this is a **copy** of the list. It does not
	 * modify the original.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.1.0
	 * @category List
	 * @sig (a,a -> Number) -> [a] -> [a]
	 * @param {Function} comparator A sorting function :: a -> b -> Int
	 * @param {Array} list The list to sort
	 * @return {Array} a new array with its elements sorted by the comparator function.
	 * @example
	 *
	 *      var diff = function(a, b) { return a - b; };
	 *      R.sort(diff, [4,2,7,5]); //=> [2, 4, 5, 7]
	 */
	module.exports = _curry2(function sort(comparator, list) {
	  return Array.prototype.slice.call(list, 0).sort(comparator);
	});


/***/ },
/* 273 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);


	/**
	 * Sorts the list according to the supplied function.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.1.0
	 * @category Relation
	 * @sig Ord b => (a -> b) -> [a] -> [a]
	 * @param {Function} fn
	 * @param {Array} list The list to sort.
	 * @return {Array} A new list sorted by the keys generated by `fn`.
	 * @example
	 *
	 *      var sortByFirstItem = R.sortBy(R.prop(0));
	 *      var sortByNameCaseInsensitive = R.sortBy(R.compose(R.toLower, R.prop('name')));
	 *      var pairs = [[-1, 1], [-2, 2], [-3, 3]];
	 *      sortByFirstItem(pairs); //=> [[-3, 3], [-2, 2], [-1, 1]]
	 *      var alice = {
	 *        name: 'ALICE',
	 *        age: 101
	 *      };
	 *      var bob = {
	 *        name: 'Bob',
	 *        age: -10
	 *      };
	 *      var clara = {
	 *        name: 'clara',
	 *        age: 314.159
	 *      };
	 *      var people = [clara, bob, alice];
	 *      sortByNameCaseInsensitive(people); //=> [alice, bob, clara]
	 */
	module.exports = _curry2(function sortBy(fn, list) {
	  return Array.prototype.slice.call(list, 0).sort(function(a, b) {
	    var aa = fn(a);
	    var bb = fn(b);
	    return aa < bb ? -1 : aa > bb ? 1 : 0;
	  });
	});


/***/ },
/* 274 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);


	/**
	 * Sorts a list according to a list of comparators.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.23.0
	 * @category Relation
	 * @sig [a -> a -> Number] -> [a] -> [a]
	 * @param {Array} functions A list of comparator functions.
	 * @param {Array} list The list to sort.
	 * @return {Array} A new list sorted according to the comarator functions.
	 * @example
	 *
	 *      var alice = {
	 *        name: 'alice',
	 *        age: 40
	 *      };
	 *      var bob = {
	 *        name: 'bob',
	 *        age: 30
	 *      };
	 *      var clara = {
	 *        name: 'clara',
	 *        age: 40
	 *      };
	 *      var people = [clara, bob, alice];
	 *      var ageNameSort = R.sortWith([
	 *        R.descend(R.prop('age')),
	 *        R.ascend(R.prop('name'))
	 *      ]);
	 *      ageNameSort(people); //=> [alice, clara, bob]
	 */
	module.exports = _curry2(function sortWith(fns, list) {
	  return Array.prototype.slice.call(list, 0).sort(function(a, b) {
	    var result = 0;
	    var i = 0;
	    while (result === 0 && i < fns.length) {
	      result = fns[i](a, b);
	      i += 1;
	    }
	    return result;
	  });
	});


/***/ },
/* 275 */
/***/ function(module, exports, __webpack_require__) {

	var invoker = __webpack_require__(196);


	/**
	 * Splits a string into an array of strings based on the given
	 * separator.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.1.0
	 * @category String
	 * @sig (String | RegExp) -> String -> [String]
	 * @param {String|RegExp} sep The pattern.
	 * @param {String} str The string to separate into an array.
	 * @return {Array} The array of strings from `str` separated by `str`.
	 * @see R.join
	 * @example
	 *
	 *      var pathComponents = R.split('/');
	 *      R.tail(pathComponents('/usr/local/bin/node')); //=> ['usr', 'local', 'bin', 'node']
	 *
	 *      R.split('.', 'a.b.c.xyz.d'); //=> ['a', 'b', 'c', 'xyz', 'd']
	 */
	module.exports = invoker(1, 'split');


/***/ },
/* 276 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);
	var length = __webpack_require__(204);
	var slice = __webpack_require__(89);


	/**
	 * Splits a given list or string at a given index.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.19.0
	 * @category List
	 * @sig Number -> [a] -> [[a], [a]]
	 * @sig Number -> String -> [String, String]
	 * @param {Number} index The index where the array/string is split.
	 * @param {Array|String} array The array/string to be split.
	 * @return {Array}
	 * @example
	 *
	 *      R.splitAt(1, [1, 2, 3]);          //=> [[1], [2, 3]]
	 *      R.splitAt(5, 'hello world');      //=> ['hello', ' world']
	 *      R.splitAt(-1, 'foobar');          //=> ['fooba', 'r']
	 */
	module.exports = _curry2(function splitAt(index, array) {
	  return [slice(0, index, array), slice(index, length(array), array)];
	});


/***/ },
/* 277 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);
	var slice = __webpack_require__(89);


	/**
	 * Splits a collection into slices of the specified length.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.16.0
	 * @category List
	 * @sig Number -> [a] -> [[a]]
	 * @sig Number -> String -> [String]
	 * @param {Number} n
	 * @param {Array} list
	 * @return {Array}
	 * @example
	 *
	 *      R.splitEvery(3, [1, 2, 3, 4, 5, 6, 7]); //=> [[1, 2, 3], [4, 5, 6], [7]]
	 *      R.splitEvery(3, 'foobarbaz'); //=> ['foo', 'bar', 'baz']
	 */
	module.exports = _curry2(function splitEvery(n, list) {
	  if (n <= 0) {
	    throw new Error('First argument to splitEvery must be a positive integer');
	  }
	  var result = [];
	  var idx = 0;
	  while (idx < list.length) {
	    result.push(slice(idx, idx += n, list));
	  }
	  return result;
	});


/***/ },
/* 278 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);


	/**
	 * Takes a list and a predicate and returns a pair of lists with the following properties:
	 *
	 *  - the result of concatenating the two output lists is equivalent to the input list;
	 *  - none of the elements of the first output list satisfies the predicate; and
	 *  - if the second output list is non-empty, its first element satisfies the predicate.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.19.0
	 * @category List
	 * @sig (a -> Boolean) -> [a] -> [[a], [a]]
	 * @param {Function} pred The predicate that determines where the array is split.
	 * @param {Array} list The array to be split.
	 * @return {Array}
	 * @example
	 *
	 *      R.splitWhen(R.equals(2), [1, 2, 3, 1, 2, 3]);   //=> [[1], [2, 3, 1, 2, 3]]
	 */
	module.exports = _curry2(function splitWhen(pred, list) {
	  var idx = 0;
	  var len = list.length;
	  var prefix = [];

	  while (idx < len && !pred(list[idx])) {
	    prefix.push(list[idx]);
	    idx += 1;
	  }

	  return [prefix, Array.prototype.slice.call(list, idx)];
	});


/***/ },
/* 279 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);


	/**
	 * Subtracts its second argument from its first argument.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.1.0
	 * @category Math
	 * @sig Number -> Number -> Number
	 * @param {Number} a The first value.
	 * @param {Number} b The second value.
	 * @return {Number} The result of `a - b`.
	 * @see R.add
	 * @example
	 *
	 *      R.subtract(10, 8); //=> 2
	 *
	 *      var minus5 = R.subtract(R.__, 5);
	 *      minus5(17); //=> 12
	 *
	 *      var complementaryAngle = R.subtract(90);
	 *      complementaryAngle(30); //=> 60
	 *      complementaryAngle(72); //=> 18
	 */
	module.exports = _curry2(function subtract(a, b) {
	  return Number(a) - Number(b);
	});


/***/ },
/* 280 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);
	var concat = __webpack_require__(95);
	var difference = __webpack_require__(124);


	/**
	 * Finds the set (i.e. no duplicates) of all elements contained in the first or
	 * second list, but not both.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.19.0
	 * @category Relation
	 * @sig [*] -> [*] -> [*]
	 * @param {Array} list1 The first list.
	 * @param {Array} list2 The second list.
	 * @return {Array} The elements in `list1` or `list2`, but not both.
	 * @see R.symmetricDifferenceWith, R.difference, R.differenceWith
	 * @example
	 *
	 *      R.symmetricDifference([1,2,3,4], [7,6,5,4,3]); //=> [1,2,7,6,5]
	 *      R.symmetricDifference([7,6,5,4,3], [1,2,3,4]); //=> [7,6,5,1,2]
	 */
	module.exports = _curry2(function symmetricDifference(list1, list2) {
	  return concat(difference(list1, list2), difference(list2, list1));
	});


/***/ },
/* 281 */
/***/ function(module, exports, __webpack_require__) {

	var _curry3 = __webpack_require__(23);
	var concat = __webpack_require__(95);
	var differenceWith = __webpack_require__(125);


	/**
	 * Finds the set (i.e. no duplicates) of all elements contained in the first or
	 * second list, but not both. Duplication is determined according to the value
	 * returned by applying the supplied predicate to two list elements.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.19.0
	 * @category Relation
	 * @sig ((a, a) -> Boolean) -> [a] -> [a] -> [a]
	 * @param {Function} pred A predicate used to test whether two items are equal.
	 * @param {Array} list1 The first list.
	 * @param {Array} list2 The second list.
	 * @return {Array} The elements in `list1` or `list2`, but not both.
	 * @see R.symmetricDifference, R.difference, R.differenceWith
	 * @example
	 *
	 *      var eqA = R.eqBy(R.prop('a'));
	 *      var l1 = [{a: 1}, {a: 2}, {a: 3}, {a: 4}];
	 *      var l2 = [{a: 3}, {a: 4}, {a: 5}, {a: 6}];
	 *      R.symmetricDifferenceWith(eqA, l1, l2); //=> [{a: 1}, {a: 2}, {a: 5}, {a: 6}]
	 */
	module.exports = _curry3(function symmetricDifferenceWith(pred, list1, list2) {
	  return concat(differenceWith(pred, list1, list2), differenceWith(pred, list2, list1));
	});


/***/ },
/* 282 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);
	var drop = __webpack_require__(130);


	/**
	 * Returns a new list containing the last `n` elements of the given list.
	 * If `n > list.length`, returns a list of `list.length` elements.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.16.0
	 * @category List
	 * @sig Number -> [a] -> [a]
	 * @sig Number -> String -> String
	 * @param {Number} n The number of elements to return.
	 * @param {Array} xs The collection to consider.
	 * @return {Array}
	 * @see R.dropLast
	 * @example
	 *
	 *      R.takeLast(1, ['foo', 'bar', 'baz']); //=> ['baz']
	 *      R.takeLast(2, ['foo', 'bar', 'baz']); //=> ['bar', 'baz']
	 *      R.takeLast(3, ['foo', 'bar', 'baz']); //=> ['foo', 'bar', 'baz']
	 *      R.takeLast(4, ['foo', 'bar', 'baz']); //=> ['foo', 'bar', 'baz']
	 *      R.takeLast(3, 'ramda');               //=> 'mda'
	 */
	module.exports = _curry2(function takeLast(n, xs) {
	  return drop(n >= 0 ? xs.length - n : 0, xs);
	});


/***/ },
/* 283 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);


	/**
	 * Returns a new list containing the last `n` elements of a given list, passing
	 * each value to the supplied predicate function, and terminating when the
	 * predicate function returns `false`. Excludes the element that caused the
	 * predicate function to fail. The predicate function is passed one argument:
	 * *(value)*.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.16.0
	 * @category List
	 * @sig (a -> Boolean) -> [a] -> [a]
	 * @param {Function} fn The function called per iteration.
	 * @param {Array} list The collection to iterate over.
	 * @return {Array} A new array.
	 * @see R.dropLastWhile, R.addIndex
	 * @example
	 *
	 *      var isNotOne = x => x !== 1;
	 *
	 *      R.takeLastWhile(isNotOne, [1, 2, 3, 4]); //=> [2, 3, 4]
	 */
	module.exports = _curry2(function takeLastWhile(fn, list) {
	  var idx = list.length - 1;
	  while (idx >= 0 && fn(list[idx])) {
	    idx -= 1;
	  }
	  return Array.prototype.slice.call(list, idx + 1);
	});


/***/ },
/* 284 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);
	var _dispatchable = __webpack_require__(25);
	var _xtakeWhile = __webpack_require__(285);


	/**
	 * Returns a new list containing the first `n` elements of a given list,
	 * passing each value to the supplied predicate function, and terminating when
	 * the predicate function returns `false`. Excludes the element that caused the
	 * predicate function to fail. The predicate function is passed one argument:
	 * *(value)*.
	 *
	 * Dispatches to the `takeWhile` method of the second argument, if present.
	 *
	 * Acts as a transducer if a transformer is given in list position.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.1.0
	 * @category List
	 * @sig (a -> Boolean) -> [a] -> [a]
	 * @param {Function} fn The function called per iteration.
	 * @param {Array} list The collection to iterate over.
	 * @return {Array} A new array.
	 * @see R.dropWhile, R.transduce, R.addIndex
	 * @example
	 *
	 *      var isNotFour = x => x !== 4;
	 *
	 *      R.takeWhile(isNotFour, [1, 2, 3, 4, 3, 2, 1]); //=> [1, 2, 3]
	 */
	module.exports = _curry2(_dispatchable(['takeWhile'], _xtakeWhile, function takeWhile(fn, list) {
	  var idx = 0;
	  var len = list.length;
	  while (idx < len && fn(list[idx])) {
	    idx += 1;
	  }
	  return Array.prototype.slice.call(list, 0, idx);
	}));


/***/ },
/* 285 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);
	var _reduced = __webpack_require__(29);
	var _xfBase = __webpack_require__(30);


	module.exports = (function() {
	  function XTakeWhile(f, xf) {
	    this.xf = xf;
	    this.f = f;
	  }
	  XTakeWhile.prototype['@@transducer/init'] = _xfBase.init;
	  XTakeWhile.prototype['@@transducer/result'] = _xfBase.result;
	  XTakeWhile.prototype['@@transducer/step'] = function(result, input) {
	    return this.f(input) ? this.xf['@@transducer/step'](result, input) : _reduced(result);
	  };

	  return _curry2(function _xtakeWhile(f, xf) { return new XTakeWhile(f, xf); });
	}());


/***/ },
/* 286 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);


	/**
	 * Runs the given function with the supplied object, then returns the object.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.1.0
	 * @category Function
	 * @sig (a -> *) -> a -> a
	 * @param {Function} fn The function to call with `x`. The return value of `fn` will be thrown away.
	 * @param {*} x
	 * @return {*} `x`.
	 * @example
	 *
	 *      var sayX = x => console.log('x is ' + x);
	 *      R.tap(sayX, 100); //=> 100
	 *      // logs 'x is 100'
	 * @symb R.tap(f, a) = a
	 */
	module.exports = _curry2(function tap(fn, x) {
	  fn(x);
	  return x;
	});


/***/ },
/* 287 */
/***/ function(module, exports, __webpack_require__) {

	var _cloneRegExp = __webpack_require__(79);
	var _curry2 = __webpack_require__(16);
	var _isRegExp = __webpack_require__(288);
	var toString = __webpack_require__(96);


	/**
	 * Determines whether a given string matches a given regular expression.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.12.0
	 * @category String
	 * @sig RegExp -> String -> Boolean
	 * @param {RegExp} pattern
	 * @param {String} str
	 * @return {Boolean}
	 * @see R.match
	 * @example
	 *
	 *      R.test(/^x/, 'xyz'); //=> true
	 *      R.test(/^y/, 'xyz'); //=> false
	 */
	module.exports = _curry2(function test(pattern, str) {
	  if (!_isRegExp(pattern)) {
	    throw new TypeError('‘test’ requires a value of type RegExp as its first argument; received ' + toString(pattern));
	  }
	  return _cloneRegExp(pattern).test(str);
	});


/***/ },
/* 288 */
/***/ function(module, exports) {

	module.exports = function _isRegExp(x) {
	  return Object.prototype.toString.call(x) === '[object RegExp]';
	};


/***/ },
/* 289 */
/***/ function(module, exports, __webpack_require__) {

	var invoker = __webpack_require__(196);


	/**
	 * The lower case version of a string.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.9.0
	 * @category String
	 * @sig String -> String
	 * @param {String} str The string to lower case.
	 * @return {String} The lower case version of `str`.
	 * @see R.toUpper
	 * @example
	 *
	 *      R.toLower('XYZ'); //=> 'xyz'
	 */
	module.exports = invoker(0, 'toLowerCase');


/***/ },
/* 290 */
/***/ function(module, exports, __webpack_require__) {

	var _curry1 = __webpack_require__(11);
	var _has = __webpack_require__(43);


	/**
	 * Converts an object into an array of key, value arrays. Only the object's
	 * own properties are used.
	 * Note that the order of the output array is not guaranteed to be consistent
	 * across different JS platforms.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.4.0
	 * @category Object
	 * @sig {String: *} -> [[String,*]]
	 * @param {Object} obj The object to extract from
	 * @return {Array} An array of key, value arrays from the object's own properties.
	 * @see R.fromPairs
	 * @example
	 *
	 *      R.toPairs({a: 1, b: 2, c: 3}); //=> [['a', 1], ['b', 2], ['c', 3]]
	 */
	module.exports = _curry1(function toPairs(obj) {
	  var pairs = [];
	  for (var prop in obj) {
	    if (_has(prop, obj)) {
	      pairs[pairs.length] = [prop, obj[prop]];
	    }
	  }
	  return pairs;
	});


/***/ },
/* 291 */
/***/ function(module, exports, __webpack_require__) {

	var _curry1 = __webpack_require__(11);


	/**
	 * Converts an object into an array of key, value arrays. The object's own
	 * properties and prototype properties are used. Note that the order of the
	 * output array is not guaranteed to be consistent across different JS
	 * platforms.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.4.0
	 * @category Object
	 * @sig {String: *} -> [[String,*]]
	 * @param {Object} obj The object to extract from
	 * @return {Array} An array of key, value arrays from the object's own
	 *         and prototype properties.
	 * @example
	 *
	 *      var F = function() { this.x = 'X'; };
	 *      F.prototype.y = 'Y';
	 *      var f = new F();
	 *      R.toPairsIn(f); //=> [['x','X'], ['y','Y']]
	 */
	module.exports = _curry1(function toPairsIn(obj) {
	  var pairs = [];
	  for (var prop in obj) {
	    pairs[pairs.length] = [prop, obj[prop]];
	  }
	  return pairs;
	});


/***/ },
/* 292 */
/***/ function(module, exports, __webpack_require__) {

	var invoker = __webpack_require__(196);


	/**
	 * The upper case version of a string.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.9.0
	 * @category String
	 * @sig String -> String
	 * @param {String} str The string to upper case.
	 * @return {String} The upper case version of `str`.
	 * @see R.toLower
	 * @example
	 *
	 *      R.toUpper('abc'); //=> 'ABC'
	 */
	module.exports = invoker(0, 'toUpperCase');


/***/ },
/* 293 */
/***/ function(module, exports, __webpack_require__) {

	var _reduce = __webpack_require__(36);
	var _xwrap = __webpack_require__(37);
	var curryN = __webpack_require__(19);


	/**
	 * Initializes a transducer using supplied iterator function. Returns a single
	 * item by iterating through the list, successively calling the transformed
	 * iterator function and passing it an accumulator value and the current value
	 * from the array, and then passing the result to the next call.
	 *
	 * The iterator function receives two values: *(acc, value)*. It will be
	 * wrapped as a transformer to initialize the transducer. A transformer can be
	 * passed directly in place of an iterator function. In both cases, iteration
	 * may be stopped early with the `R.reduced` function.
	 *
	 * A transducer is a function that accepts a transformer and returns a
	 * transformer and can be composed directly.
	 *
	 * A transformer is an an object that provides a 2-arity reducing iterator
	 * function, step, 0-arity initial value function, init, and 1-arity result
	 * extraction function, result. The step function is used as the iterator
	 * function in reduce. The result function is used to convert the final
	 * accumulator into the return type and in most cases is R.identity. The init
	 * function can be used to provide an initial accumulator, but is ignored by
	 * transduce.
	 *
	 * The iteration is performed with R.reduce after initializing the transducer.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.12.0
	 * @category List
	 * @sig (c -> c) -> (a,b -> a) -> a -> [b] -> a
	 * @param {Function} xf The transducer function. Receives a transformer and returns a transformer.
	 * @param {Function} fn The iterator function. Receives two values, the accumulator and the
	 *        current element from the array. Wrapped as transformer, if necessary, and used to
	 *        initialize the transducer
	 * @param {*} acc The initial accumulator value.
	 * @param {Array} list The list to iterate over.
	 * @return {*} The final, accumulated value.
	 * @see R.reduce, R.reduced, R.into
	 * @example
	 *
	 *      var numbers = [1, 2, 3, 4];
	 *      var transducer = R.compose(R.map(R.add(1)), R.take(2));
	 *
	 *      R.transduce(transducer, R.flip(R.append), [], numbers); //=> [2, 3]
	 */
	module.exports = curryN(4, function transduce(xf, fn, acc, list) {
	  return _reduce(xf(typeof fn === 'function' ? _xwrap(fn) : fn), acc, list);
	});


/***/ },
/* 294 */
/***/ function(module, exports, __webpack_require__) {

	var _curry1 = __webpack_require__(11);


	/**
	 * Transposes the rows and columns of a 2D list.
	 * When passed a list of `n` lists of length `x`,
	 * returns a list of `x` lists of length `n`.
	 *
	 *
	 * @func
	 * @memberOf R
	 * @since v0.19.0
	 * @category List
	 * @sig [[a]] -> [[a]]
	 * @param {Array} list A 2D list
	 * @return {Array} A 2D list
	 * @example
	 *
	 *      R.transpose([[1, 'a'], [2, 'b'], [3, 'c']]) //=> [[1, 2, 3], ['a', 'b', 'c']]
	 *      R.transpose([[1, 2, 3], ['a', 'b', 'c']]) //=> [[1, 'a'], [2, 'b'], [3, 'c']]
	 *
	 * If some of the rows are shorter than the following rows, their elements are skipped:
	 *
	 *      R.transpose([[10, 11], [20], [], [30, 31, 32]]) //=> [[10, 20, 30], [11, 31], [32]]
	 * @symb R.transpose([[a], [b], [c]]) = [a, b, c]
	 * @symb R.transpose([[a, b], [c, d]]) = [[a, c], [b, d]]
	 * @symb R.transpose([[a, b], [c]]) = [[a, c], [b]]
	 */
	module.exports = _curry1(function transpose(outerlist) {
	  var i = 0;
	  var result = [];
	  while (i < outerlist.length) {
	    var innerlist = outerlist[i];
	    var j = 0;
	    while (j < innerlist.length) {
	      if (typeof result[j] === 'undefined') {
	        result[j] = [];
	      }
	      result[j].push(innerlist[j]);
	      j += 1;
	    }
	    i += 1;
	  }
	  return result;
	});


/***/ },
/* 295 */
/***/ function(module, exports, __webpack_require__) {

	var _curry3 = __webpack_require__(23);
	var map = __webpack_require__(34);
	var sequence = __webpack_require__(270);


	/**
	 * Maps an [Applicative](https://github.com/fantasyland/fantasy-land#applicative)-returning
	 * function over a [Traversable](https://github.com/fantasyland/fantasy-land#traversable),
	 * then uses [`sequence`](#sequence) to transform the resulting Traversable of Applicative
	 * into an Applicative of Traversable.
	 *
	 * Dispatches to the `sequence` method of the third argument, if present.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.19.0
	 * @category List
	 * @sig (Applicative f, Traversable t) => (a -> f a) -> (a -> f b) -> t a -> f (t b)
	 * @param {Function} of
	 * @param {Function} f
	 * @param {*} traversable
	 * @return {*}
	 * @see R.sequence
	 * @example
	 *
	 *      // Returns `Nothing` if the given divisor is `0`
	 *      safeDiv = n => d => d === 0 ? Nothing() : Just(n / d)
	 *
	 *      R.traverse(Maybe.of, safeDiv(10), [2, 4, 5]); //=> Just([5, 2.5, 2])
	 *      R.traverse(Maybe.of, safeDiv(10), [2, 0, 5]); //=> Nothing
	 */
	module.exports = _curry3(function traverse(of, f, traversable) {
	  return sequence(of, map(f, traversable));
	});


/***/ },
/* 296 */
/***/ function(module, exports, __webpack_require__) {

	var _curry1 = __webpack_require__(11);


	/**
	 * Removes (strips) whitespace from both ends of the string.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.6.0
	 * @category String
	 * @sig String -> String
	 * @param {String} str The string to trim.
	 * @return {String} Trimmed version of `str`.
	 * @example
	 *
	 *      R.trim('   xyz  '); //=> 'xyz'
	 *      R.map(R.trim, R.split(',', 'x, y, z')); //=> ['x', 'y', 'z']
	 */
	module.exports = (function() {
	  var ws = '\x09\x0A\x0B\x0C\x0D\x20\xA0\u1680\u180E\u2000\u2001\u2002\u2003' +
	           '\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\u2028' +
	           '\u2029\uFEFF';
	  var zeroWidth = '\u200b';
	  var hasProtoTrim = (typeof String.prototype.trim === 'function');
	  if (!hasProtoTrim || (ws.trim() || !zeroWidth.trim())) {
	    return _curry1(function trim(str) {
	      var beginRx = new RegExp('^[' + ws + '][' + ws + ']*');
	      var endRx = new RegExp('[' + ws + '][' + ws + ']*$');
	      return str.replace(beginRx, '').replace(endRx, '');
	    });
	  } else {
	    return _curry1(function trim(str) {
	      return str.trim();
	    });
	  }
	}());


/***/ },
/* 297 */
/***/ function(module, exports, __webpack_require__) {

	var _arity = __webpack_require__(20);
	var _concat = __webpack_require__(18);
	var _curry2 = __webpack_require__(16);


	/**
	 * `tryCatch` takes two functions, a `tryer` and a `catcher`. The returned
	 * function evaluates the `tryer`; if it does not throw, it simply returns the
	 * result. If the `tryer` *does* throw, the returned function evaluates the
	 * `catcher` function and returns its result. Note that for effective
	 * composition with this function, both the `tryer` and `catcher` functions
	 * must return the same type of results.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.20.0
	 * @category Function
	 * @sig (...x -> a) -> ((e, ...x) -> a) -> (...x -> a)
	 * @param {Function} tryer The function that may throw.
	 * @param {Function} catcher The function that will be evaluated if `tryer` throws.
	 * @return {Function} A new function that will catch exceptions and send then to the catcher.
	 * @example
	 *
	 *      R.tryCatch(R.prop('x'), R.F)({x: true}); //=> true
	 *      R.tryCatch(R.prop('x'), R.F)(null);      //=> false
	 */
	module.exports = _curry2(function _tryCatch(tryer, catcher) {
	  return _arity(tryer.length, function() {
	    try {
	      return tryer.apply(this, arguments);
	    } catch (e) {
	      return catcher.apply(this, _concat([e], arguments));
	    }
	  });
	});


/***/ },
/* 298 */
/***/ function(module, exports, __webpack_require__) {

	var _curry1 = __webpack_require__(11);


	/**
	 * Takes a function `fn`, which takes a single array argument, and returns a
	 * function which:
	 *
	 *   - takes any number of positional arguments;
	 *   - passes these arguments to `fn` as an array; and
	 *   - returns the result.
	 *
	 * In other words, R.unapply derives a variadic function from a function which
	 * takes an array. R.unapply is the inverse of R.apply.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.8.0
	 * @category Function
	 * @sig ([*...] -> a) -> (*... -> a)
	 * @param {Function} fn
	 * @return {Function}
	 * @see R.apply
	 * @example
	 *
	 *      R.unapply(JSON.stringify)(1, 2, 3); //=> '[1,2,3]'
	 * @symb R.unapply(f)(a, b) = f([a, b])
	 */
	module.exports = _curry1(function unapply(fn) {
	  return function() {
	    return fn(Array.prototype.slice.call(arguments, 0));
	  };
	});


/***/ },
/* 299 */
/***/ function(module, exports, __webpack_require__) {

	var _curry1 = __webpack_require__(11);
	var nAry = __webpack_require__(64);


	/**
	 * Wraps a function of any arity (including nullary) in a function that accepts
	 * exactly 1 parameter. Any extraneous parameters will not be passed to the
	 * supplied function.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.2.0
	 * @category Function
	 * @sig (* -> b) -> (a -> b)
	 * @param {Function} fn The function to wrap.
	 * @return {Function} A new function wrapping `fn`. The new function is guaranteed to be of
	 *         arity 1.
	 * @example
	 *
	 *      var takesTwoArgs = function(a, b) {
	 *        return [a, b];
	 *      };
	 *      takesTwoArgs.length; //=> 2
	 *      takesTwoArgs(1, 2); //=> [1, 2]
	 *
	 *      var takesOneArg = R.unary(takesTwoArgs);
	 *      takesOneArg.length; //=> 1
	 *      // Only 1 argument is passed to the wrapped function
	 *      takesOneArg(1, 2); //=> [1, undefined]
	 * @symb R.unary(f)(a, b, c) = f(a)
	 */
	module.exports = _curry1(function unary(fn) {
	  return nAry(1, fn);
	});


/***/ },
/* 300 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);
	var curryN = __webpack_require__(19);


	/**
	 * Returns a function of arity `n` from a (manually) curried function.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.14.0
	 * @category Function
	 * @sig Number -> (a -> b) -> (a -> c)
	 * @param {Number} length The arity for the returned function.
	 * @param {Function} fn The function to uncurry.
	 * @return {Function} A new function.
	 * @see R.curry
	 * @example
	 *
	 *      var addFour = a => b => c => d => a + b + c + d;
	 *
	 *      var uncurriedAddFour = R.uncurryN(4, addFour);
	 *      uncurriedAddFour(1, 2, 3, 4); //=> 10
	 */
	module.exports = _curry2(function uncurryN(depth, fn) {
	  return curryN(depth, function() {
	    var currentDepth = 1;
	    var value = fn;
	    var idx = 0;
	    var endIdx;
	    while (currentDepth <= depth && typeof value === 'function') {
	      endIdx = currentDepth === depth ? arguments.length : idx + value.length;
	      value = value.apply(this, Array.prototype.slice.call(arguments, idx, endIdx));
	      currentDepth += 1;
	      idx = endIdx;
	    }
	    return value;
	  });
	});


/***/ },
/* 301 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);


	/**
	 * Builds a list from a seed value. Accepts an iterator function, which returns
	 * either false to stop iteration or an array of length 2 containing the value
	 * to add to the resulting list and the seed to be used in the next call to the
	 * iterator function.
	 *
	 * The iterator function receives one argument: *(seed)*.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.10.0
	 * @category List
	 * @sig (a -> [b]) -> * -> [b]
	 * @param {Function} fn The iterator function. receives one argument, `seed`, and returns
	 *        either false to quit iteration or an array of length two to proceed. The element
	 *        at index 0 of this array will be added to the resulting array, and the element
	 *        at index 1 will be passed to the next call to `fn`.
	 * @param {*} seed The seed value.
	 * @return {Array} The final list.
	 * @example
	 *
	 *      var f = n => n > 50 ? false : [-n, n + 10];
	 *      R.unfold(f, 10); //=> [-10, -20, -30, -40, -50]
	 * @symb R.unfold(f, x) = [f(x)[0], f(f(x)[1])[0], f(f(f(x)[1])[1])[0], ...]
	 */
	module.exports = _curry2(function unfold(fn, seed) {
	  var pair = fn(seed);
	  var result = [];
	  while (pair && pair.length) {
	    result[result.length] = pair[0];
	    pair = fn(pair[1]);
	  }
	  return result;
	});


/***/ },
/* 302 */
/***/ function(module, exports, __webpack_require__) {

	var _concat = __webpack_require__(18);
	var _curry2 = __webpack_require__(16);
	var compose = __webpack_require__(84);
	var uniq = __webpack_require__(183);


	/**
	 * Combines two lists into a set (i.e. no duplicates) composed of the elements
	 * of each list.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.1.0
	 * @category Relation
	 * @sig [*] -> [*] -> [*]
	 * @param {Array} as The first list.
	 * @param {Array} bs The second list.
	 * @return {Array} The first and second lists concatenated, with
	 *         duplicates removed.
	 * @example
	 *
	 *      R.union([1, 2, 3], [2, 3, 4]); //=> [1, 2, 3, 4]
	 */
	module.exports = _curry2(compose(uniq, _concat));


/***/ },
/* 303 */
/***/ function(module, exports, __webpack_require__) {

	var _concat = __webpack_require__(18);
	var _curry3 = __webpack_require__(23);
	var uniqWith = __webpack_require__(187);


	/**
	 * Combines two lists into a set (i.e. no duplicates) composed of the elements
	 * of each list. Duplication is determined according to the value returned by
	 * applying the supplied predicate to two list elements.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.1.0
	 * @category Relation
	 * @sig (a -> a -> Boolean) -> [*] -> [*] -> [*]
	 * @param {Function} pred A predicate used to test whether two items are equal.
	 * @param {Array} list1 The first list.
	 * @param {Array} list2 The second list.
	 * @return {Array} The first and second lists concatenated, with
	 *         duplicates removed.
	 * @see R.union
	 * @example
	 *
	 *      var l1 = [{a: 1}, {a: 2}];
	 *      var l2 = [{a: 1}, {a: 4}];
	 *      R.unionWith(R.eqBy(R.prop('a')), l1, l2); //=> [{a: 1}, {a: 2}, {a: 4}]
	 */
	module.exports = _curry3(function unionWith(pred, list1, list2) {
	  return uniqWith(pred, _concat(list1, list2));
	});


/***/ },
/* 304 */
/***/ function(module, exports, __webpack_require__) {

	var _curry3 = __webpack_require__(23);


	/**
	 * Tests the final argument by passing it to the given predicate function. If
	 * the predicate is not satisfied, the function will return the result of
	 * calling the `whenFalseFn` function with the same argument. If the predicate
	 * is satisfied, the argument is returned as is.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.18.0
	 * @category Logic
	 * @sig (a -> Boolean) -> (a -> a) -> a -> a
	 * @param {Function} pred        A predicate function
	 * @param {Function} whenFalseFn A function to invoke when the `pred` evaluates
	 *                               to a falsy value.
	 * @param {*}        x           An object to test with the `pred` function and
	 *                               pass to `whenFalseFn` if necessary.
	 * @return {*} Either `x` or the result of applying `x` to `whenFalseFn`.
	 * @see R.ifElse, R.when
	 * @example
	 *
	 *      // coerceArray :: (a|[a]) -> [a]
	 *      var coerceArray = R.unless(R.isArrayLike, R.of);
	 *      coerceArray([1, 2, 3]); //=> [1, 2, 3]
	 *      coerceArray(1);         //=> [1]
	 */
	module.exports = _curry3(function unless(pred, whenFalseFn, x) {
	  return pred(x) ? x : whenFalseFn(x);
	});


/***/ },
/* 305 */
/***/ function(module, exports, __webpack_require__) {

	var _identity = __webpack_require__(174);
	var chain = __webpack_require__(71);


	/**
	 * Shorthand for `R.chain(R.identity)`, which removes one level of nesting from
	 * any [Chain](https://github.com/fantasyland/fantasy-land#chain).
	 *
	 * @func
	 * @memberOf R
	 * @since v0.3.0
	 * @category List
	 * @sig Chain c => c (c a) -> c a
	 * @param {*} list
	 * @return {*}
	 * @see R.flatten, R.chain
	 * @example
	 *
	 *      R.unnest([1, [2], [[3]]]); //=> [1, 2, [3]]
	 *      R.unnest([[1, 2], [3, 4], [5, 6]]); //=> [1, 2, 3, 4, 5, 6]
	 */
	module.exports = chain(_identity);


/***/ },
/* 306 */
/***/ function(module, exports, __webpack_require__) {

	var _curry3 = __webpack_require__(23);


	/**
	 * Takes a predicate, a transformation function, and an initial value,
	 * and returns a value of the same type as the initial value.
	 * It does so by applying the transformation until the predicate is satisfied,
	 * at which point it returns the satisfactory value.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.20.0
	 * @category Logic
	 * @sig (a -> Boolean) -> (a -> a) -> a -> a
	 * @param {Function} pred A predicate function
	 * @param {Function} fn The iterator function
	 * @param {*} init Initial value
	 * @return {*} Final value that satisfies predicate
	 * @example
	 *
	 *      R.until(R.gt(R.__, 100), R.multiply(2))(1) // => 128
	 */
	module.exports = _curry3(function until(pred, fn, init) {
	  var val = init;
	  while (!pred(val)) {
	    val = fn(val);
	  }
	  return val;
	});


/***/ },
/* 307 */
/***/ function(module, exports, __webpack_require__) {

	var _curry1 = __webpack_require__(11);


	/**
	 * Returns a list of all the properties, including prototype properties, of the
	 * supplied object.
	 * Note that the order of the output array is not guaranteed to be consistent
	 * across different JS platforms.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.2.0
	 * @category Object
	 * @sig {k: v} -> [v]
	 * @param {Object} obj The object to extract values from
	 * @return {Array} An array of the values of the object's own and prototype properties.
	 * @example
	 *
	 *      var F = function() { this.x = 'X'; };
	 *      F.prototype.y = 'Y';
	 *      var f = new F();
	 *      R.valuesIn(f); //=> ['X', 'Y']
	 */
	module.exports = _curry1(function valuesIn(obj) {
	  var prop;
	  var vs = [];
	  for (prop in obj) {
	    vs[vs.length] = obj[prop];
	  }
	  return vs;
	});


/***/ },
/* 308 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);


	/**
	 * Returns a "view" of the given data structure, determined by the given lens.
	 * The lens's focus determines which portion of the data structure is visible.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.16.0
	 * @category Object
	 * @typedefn Lens s a = Functor f => (a -> f a) -> s -> f s
	 * @sig Lens s a -> s -> a
	 * @param {Lens} lens
	 * @param {*} x
	 * @return {*}
	 * @see R.prop, R.lensIndex, R.lensProp
	 * @example
	 *
	 *      var xLens = R.lensProp('x');
	 *
	 *      R.view(xLens, {x: 1, y: 2});  //=> 1
	 *      R.view(xLens, {x: 4, y: 2});  //=> 4
	 */
	module.exports = (function() {
	  // `Const` is a functor that effectively ignores the function given to `map`.
	  var Const = function(x) {
	    return {value: x, map: function() { return this; }};
	  };

	  return _curry2(function view(lens, x) {
	    // Using `Const` effectively ignores the setter function of the `lens`,
	    // leaving the value returned by the getter function unmodified.
	    return lens(Const)(x).value;
	  });
	}());


/***/ },
/* 309 */
/***/ function(module, exports, __webpack_require__) {

	var _curry3 = __webpack_require__(23);


	/**
	 * Tests the final argument by passing it to the given predicate function. If
	 * the predicate is satisfied, the function will return the result of calling
	 * the `whenTrueFn` function with the same argument. If the predicate is not
	 * satisfied, the argument is returned as is.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.18.0
	 * @category Logic
	 * @sig (a -> Boolean) -> (a -> a) -> a -> a
	 * @param {Function} pred       A predicate function
	 * @param {Function} whenTrueFn A function to invoke when the `condition`
	 *                              evaluates to a truthy value.
	 * @param {*}        x          An object to test with the `pred` function and
	 *                              pass to `whenTrueFn` if necessary.
	 * @return {*} Either `x` or the result of applying `x` to `whenTrueFn`.
	 * @see R.ifElse, R.unless
	 * @example
	 *
	 *      // truncate :: String -> String
	 *      var truncate = R.when(
	 *        R.propSatisfies(R.gt(R.__, 10), 'length'),
	 *        R.pipe(R.take(10), R.append('…'), R.join(''))
	 *      );
	 *      truncate('12345');         //=> '12345'
	 *      truncate('0123456789ABC'); //=> '0123456789…'
	 */
	module.exports = _curry3(function when(pred, whenTrueFn, x) {
	  return pred(x) ? whenTrueFn(x) : x;
	});


/***/ },
/* 310 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);
	var _has = __webpack_require__(43);


	/**
	 * Takes a spec object and a test object; returns true if the test satisfies
	 * the spec. Each of the spec's own properties must be a predicate function.
	 * Each predicate is applied to the value of the corresponding property of the
	 * test object. `where` returns true if all the predicates return true, false
	 * otherwise.
	 *
	 * `where` is well suited to declaratively expressing constraints for other
	 * functions such as `filter` and `find`.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.1.1
	 * @category Object
	 * @sig {String: (* -> Boolean)} -> {String: *} -> Boolean
	 * @param {Object} spec
	 * @param {Object} testObj
	 * @return {Boolean}
	 * @example
	 *
	 *      // pred :: Object -> Boolean
	 *      var pred = R.where({
	 *        a: R.equals('foo'),
	 *        b: R.complement(R.equals('bar')),
	 *        x: R.gt(__, 10),
	 *        y: R.lt(__, 20)
	 *      });
	 *
	 *      pred({a: 'foo', b: 'xxx', x: 11, y: 19}); //=> true
	 *      pred({a: 'xxx', b: 'xxx', x: 11, y: 19}); //=> false
	 *      pred({a: 'foo', b: 'bar', x: 11, y: 19}); //=> false
	 *      pred({a: 'foo', b: 'xxx', x: 10, y: 19}); //=> false
	 *      pred({a: 'foo', b: 'xxx', x: 11, y: 20}); //=> false
	 */
	module.exports = _curry2(function where(spec, testObj) {
	  for (var prop in spec) {
	    if (_has(prop, spec) && !spec[prop](testObj[prop])) {
	      return false;
	    }
	  }
	  return true;
	});


/***/ },
/* 311 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);
	var equals = __webpack_require__(100);
	var map = __webpack_require__(34);
	var where = __webpack_require__(310);


	/**
	 * Takes a spec object and a test object; returns true if the test satisfies
	 * the spec, false otherwise. An object satisfies the spec if, for each of the
	 * spec's own properties, accessing that property of the object gives the same
	 * value (in `R.equals` terms) as accessing that property of the spec.
	 *
	 * `whereEq` is a specialization of [`where`](#where).
	 *
	 * @func
	 * @memberOf R
	 * @since v0.14.0
	 * @category Object
	 * @sig {String: *} -> {String: *} -> Boolean
	 * @param {Object} spec
	 * @param {Object} testObj
	 * @return {Boolean}
	 * @see R.where
	 * @example
	 *
	 *      // pred :: Object -> Boolean
	 *      var pred = R.whereEq({a: 1, b: 2});
	 *
	 *      pred({a: 1});              //=> false
	 *      pred({a: 1, b: 2});        //=> true
	 *      pred({a: 1, b: 2, c: 3});  //=> true
	 *      pred({a: 1, b: 1});        //=> false
	 */
	module.exports = _curry2(function whereEq(spec, testObj) {
	  return where(map(equals, spec), testObj);
	});


/***/ },
/* 312 */
/***/ function(module, exports, __webpack_require__) {

	var _contains = __webpack_require__(98);
	var _curry2 = __webpack_require__(16);
	var flip = __webpack_require__(162);
	var reject = __webpack_require__(107);


	/**
	 * Returns a new list without values in the first argument.
	 * `R.equals` is used to determine equality.
	 *
	 * Acts as a transducer if a transformer is given in list position.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.19.0
	 * @category List
	 * @sig [a] -> [a] -> [a]
	 * @param {Array} list1 The values to be removed from `list2`.
	 * @param {Array} list2 The array to remove values from.
	 * @return {Array} The new array without values in `list1`.
	 * @see R.transduce
	 * @example
	 *
	 *      R.without([1, 2], [1, 2, 1, 3, 4]); //=> [3, 4]
	 */
	module.exports = _curry2(function(xs, list) {
	  return reject(flip(_contains)(xs), list);
	});


/***/ },
/* 313 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);


	/**
	 * Creates a new list out of the two supplied by creating each possible pair
	 * from the lists.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.1.0
	 * @category List
	 * @sig [a] -> [b] -> [[a,b]]
	 * @param {Array} as The first list.
	 * @param {Array} bs The second list.
	 * @return {Array} The list made by combining each possible pair from
	 *         `as` and `bs` into pairs (`[a, b]`).
	 * @example
	 *
	 *      R.xprod([1, 2], ['a', 'b']); //=> [[1, 'a'], [1, 'b'], [2, 'a'], [2, 'b']]
	 * @symb R.xprod([a, b], [c, d]) = [[a, c], [a, d], [b, c], [b, d]]
	 */
	module.exports = _curry2(function xprod(a, b) { // = xprodWith(prepend); (takes about 3 times as long...)
	  var idx = 0;
	  var ilen = a.length;
	  var j;
	  var jlen = b.length;
	  var result = [];
	  while (idx < ilen) {
	    j = 0;
	    while (j < jlen) {
	      result[result.length] = [a[idx], b[j]];
	      j += 1;
	    }
	    idx += 1;
	  }
	  return result;
	});


/***/ },
/* 314 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);


	/**
	 * Creates a new list out of the two supplied by pairing up equally-positioned
	 * items from both lists. The returned list is truncated to the length of the
	 * shorter of the two input lists.
	 * Note: `zip` is equivalent to `zipWith(function(a, b) { return [a, b] })`.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.1.0
	 * @category List
	 * @sig [a] -> [b] -> [[a,b]]
	 * @param {Array} list1 The first array to consider.
	 * @param {Array} list2 The second array to consider.
	 * @return {Array} The list made by pairing up same-indexed elements of `list1` and `list2`.
	 * @example
	 *
	 *      R.zip([1, 2, 3], ['a', 'b', 'c']); //=> [[1, 'a'], [2, 'b'], [3, 'c']]
	 * @symb R.zip([a, b, c], [d, e, f]) = [[a, d], [b, e], [c, f]]
	 */
	module.exports = _curry2(function zip(a, b) {
	  var rv = [];
	  var idx = 0;
	  var len = Math.min(a.length, b.length);
	  while (idx < len) {
	    rv[idx] = [a[idx], b[idx]];
	    idx += 1;
	  }
	  return rv;
	});


/***/ },
/* 315 */
/***/ function(module, exports, __webpack_require__) {

	var _curry2 = __webpack_require__(16);


	/**
	 * Creates a new object out of a list of keys and a list of values.
	 * Key/value pairing is truncated to the length of the shorter of the two lists.
	 * Note: `zipObj` is equivalent to `pipe(zipWith(pair), fromPairs)`.
	 *
	 * @func
	 * @memberOf R
	 * @since v0.3.0
	 * @category List
	 * @sig [String] -> [*] -> {String: *}
	 * @param {Array} keys The array that will be properties on the output object.
	 * @param {Array} values The list of values on the output object.
	 * @return {Object} The object made by pairing up same-indexed elements of `keys` and `values`.
	 * @example
	 *
	 *      R.zipObj(['a', 'b', 'c'], [1, 2, 3]); //=> {a: 1, b: 2, c: 3}
	 */
	module.exports = _curry2(function zipObj(keys, values) {
	  var idx = 0;
	  var len = Math.min(keys.length, values.length);
	  var out = {};
	  while (idx < len) {
	    out[keys[idx]] = values[idx];
	    idx += 1;
	  }
	  return out;
	});


/***/ },
/* 316 */
/***/ function(module, exports, __webpack_require__) {

	var _curry3 = __webpack_require__(23);


	/**
	 * Creates a new list out of the two supplied by applying the function to each
	 * equally-positioned pair in the lists. The returned list is truncated to the
	 * length of the shorter of the two input lists.
	 *
	 * @function
	 * @memberOf R
	 * @since v0.1.0
	 * @category List
	 * @sig (a,b -> c) -> [a] -> [b] -> [c]
	 * @param {Function} fn The function used to combine the two elements into one value.
	 * @param {Array} list1 The first array to consider.
	 * @param {Array} list2 The second array to consider.
	 * @return {Array} The list made by combining same-indexed elements of `list1` and `list2`
	 *         using `fn`.
	 * @example
	 *
	 *      var f = (x, y) => {
	 *        // ...
	 *      };
	 *      R.zipWith(f, [1, 2, 3], ['a', 'b', 'c']);
	 *      //=> [f(1, 'a'), f(2, 'b'), f(3, 'c')]
	 * @symb R.zipWith(fn, [a, b, c], [d, e, f]) = [fn(a, d), fn(b, e), fn(c, f)]
	 */
	module.exports = _curry3(function zipWith(fn, a, b) {
	  var rv = [];
	  var idx = 0;
	  var len = Math.min(a.length, b.length);
	  while (idx < len) {
	    rv[idx] = fn(a[idx], b[idx]);
	    idx += 1;
	  }
	  return rv;
	});


/***/ },
/* 317 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var assert = __webpack_require__(318);
	var isExpression = __webpack_require__(323);
	var characterParser = __webpack_require__(326);
	var error = __webpack_require__(328);

	module.exports = lex;
	module.exports.Lexer = Lexer;
	function lex(str, options) {
	  var lexer = new Lexer(str, options);
	  return JSON.parse(JSON.stringify(lexer.getTokens()));
	}

	/**
	 * Initialize `Lexer` with the given `str`.
	 *
	 * @param {String} str
	 * @param {String} filename
	 * @api private
	 */

	function Lexer(str, options) {
	  options = options || {};
	  if (typeof str !== 'string') {
	    throw new Error('Expected source code to be a string but got "' + (typeof str) + '"')
	  }
	  if (typeof options !== 'object') {
	    throw new Error('Expected "options" to be an object but got "' + (typeof options) + '"')
	  }
	  //Strip any UTF-8 BOM off of the start of `str`, if it exists.
	  str = str.replace(/^\uFEFF/, '');
	  this.input = str.replace(/\r\n|\r/g, '\n');
	  this.originalInput = this.input;
	  this.filename = options.filename;
	  this.interpolated = options.interpolated || false;
	  this.lineno = options.startingLine || 1;
	  this.colno = options.startingColumn || 1;
	  this.plugins = options.plugins || [];
	  this.indentStack = [0];
	  this.indentRe = null;
	  // If #{} or !{} syntax is allowed when adding text
	  this.interpolationAllowed = true;

	  this.tokens = [];
	  this.ended = false;
	};

	/**
	 * Lexer prototype.
	 */

	Lexer.prototype = {

	  constructor: Lexer,

	  error: function (code, message) {
	    var err = error(code, message, {line: this.lineno, column: this.colno, filename: this.filename, src: this.originalInput});
	    throw err;
	  },

	  assert: function (value, message) {
	    if (!value) this.error('ASSERT_FAILED', message);
	  },

	  isExpression: function (exp) {
	    return isExpression(exp, {
	      throw: true
	    });
	  },

	  assertExpression: function (exp, noThrow) {
	    //this verifies that a JavaScript expression is valid
	    try {
	      this.callLexerFunction('isExpression', exp);
	      return true;
	    } catch (ex) {
	      if (noThrow) return false;

	      // not coming from acorn
	      if (!ex.loc) throw ex;

	      this.incrementLine(ex.loc.line - 1);
	      this.incrementColumn(ex.loc.column);
	      var msg = 'Syntax Error: ' + ex.message.replace(/ \([0-9]+:[0-9]+\)$/, '');
	      this.error('SYNTAX_ERROR', msg);
	    }
	  },

	  assertNestingCorrect: function (exp) {
	    //this verifies that code is properly nested, but allows
	    //invalid JavaScript such as the contents of `attributes`
	    var res = characterParser(exp)
	    if (res.isNesting()) {
	      this.error('INCORRECT_NESTING', 'Nesting must match on expression `' + exp + '`')
	    }
	  },

	  /**
	   * Construct a token with the given `type` and `val`.
	   *
	   * @param {String} type
	   * @param {String} val
	   * @return {Object}
	   * @api private
	   */

	  tok: function(type, val){
	    var res = {type: type, line: this.lineno, col: this.colno};

	    if (val !== undefined) res.val = val;

	    return res;
	  },

	  /**
	   * Increment `this.lineno` and reset `this.colno`.
	   *
	   * @param {Number} increment
	   * @api private
	   */

	  incrementLine: function(increment){
	    this.lineno += increment;
	    if (increment) this.colno = 1;
	  },

	  /**
	   * Increment `this.colno`.
	   *
	   * @param {Number} increment
	   * @api private
	   */

	  incrementColumn: function(increment){
	    this.colno += increment
	  },

	  /**
	   * Consume the given `len` of input.
	   *
	   * @param {Number} len
	   * @api private
	   */

	  consume: function(len){
	    this.input = this.input.substr(len);
	  },

	  /**
	   * Scan for `type` with the given `regexp`.
	   *
	   * @param {String} type
	   * @param {RegExp} regexp
	   * @return {Object}
	   * @api private
	   */

	  scan: function(regexp, type){
	    var captures;
	    if (captures = regexp.exec(this.input)) {
	      var len = captures[0].length;
	      var val = captures[1];
	      var diff = len - (val ? val.length : 0);
	      var tok = this.tok(type, val);
	      this.consume(len);
	      this.incrementColumn(diff);
	      return tok;
	    }
	  },
	  scanEndOfLine: function (regexp, type) {
	    var captures;
	    if (captures = regexp.exec(this.input)) {
	      var whitespaceLength = 0;
	      var whitespace;
	      var tok;
	      if (whitespace = /^([ ]+)([^ ]*)/.exec(captures[0])) {
	        whitespaceLength = whitespace[1].length;
	        this.incrementColumn(whitespaceLength);
	      }
	      var newInput = this.input.substr(captures[0].length);
	      if (newInput[0] === ':') {
	        this.input = newInput;
	        tok = this.tok(type, captures[1]);
	        this.incrementColumn(captures[0].length - whitespaceLength);
	        return tok;
	      }
	      if (/^[ \t]*(\n|$)/.test(newInput)) {
	        this.input = newInput.substr(/^[ \t]*/.exec(newInput)[0].length);
	        tok = this.tok(type, captures[1]);
	        this.incrementColumn(captures[0].length - whitespaceLength);
	        return tok;
	      }
	    }
	  },

	  /**
	   * Return the indexOf `(` or `{` or `[` / `)` or `}` or `]` delimiters.
	   *
	   * Make sure that when calling this function, colno is at the character
	   * immediately before the beginning.
	   *
	   * @return {Number}
	   * @api private
	   */

	  bracketExpression: function(skip){
	    skip = skip || 0;
	    var start = this.input[skip];
	    assert(start === '(' || start === '{' || start === '[',
	           'The start character should be "(", "{" or "["');
	    var end = characterParser.BRACKETS[start];
	    var range;
	    try {
	      range = characterParser.parseUntil(this.input, end, {start: skip + 1});
	    } catch (ex) {
	      if (ex.index !== undefined) {
	        var idx = ex.index;
	        // starting from this.input[skip]
	        var tmp = this.input.substr(skip).indexOf('\n');
	        // starting from this.input[0]
	        var nextNewline = tmp + skip;
	        var ptr = 0;
	        while (idx > nextNewline && tmp !== -1) {
	          this.incrementLine(1);
	          idx -= nextNewline + 1;
	          ptr += nextNewline + 1;
	          tmp = nextNewline = this.input.substr(ptr).indexOf('\n');
	        };

	        this.incrementColumn(idx);
	      }
	      if (ex.code === 'CHARACTER_PARSER:END_OF_STRING_REACHED') {
	        this.error('NO_END_BRACKET', 'The end of the string reached with no closing bracket ' + end + ' found.');
	      } else if (ex.code === 'CHARACTER_PARSER:MISMATCHED_BRACKET') {
	        this.error('BRACKET_MISMATCH', ex.message);
	      }
	      throw ex;
	    }
	    return range;
	  },

	  scanIndentation: function() {
	    var captures, re;

	    // established regexp
	    if (this.indentRe) {
	      captures = this.indentRe.exec(this.input);
	    // determine regexp
	    } else {
	      // tabs
	      re = /^\n(\t*) */;
	      captures = re.exec(this.input);

	      // spaces
	      if (captures && !captures[1].length) {
	        re = /^\n( *)/;
	        captures = re.exec(this.input);
	      }

	      // established
	      if (captures && captures[1].length) this.indentRe = re;
	    }

	    return captures;
	  },

	  /**
	   * end-of-source.
	   */

	  eos: function() {
	    if (this.input.length) return;
	    if (this.interpolated) {
	      this.error('NO_END_BRACKET', 'End of line was reached with no closing bracket for interpolation.');
	    }
	    for (var i = 0; this.indentStack[i]; i++) {
	      this.tokens.push(this.tok('outdent'));
	    }
	    this.tokens.push(this.tok('eos'));
	    this.ended = true;
	    return true;
	  },

	  /**
	   * Blank line.
	   */

	  blank: function() {
	    var captures;
	    if (captures = /^\n[ \t]*\n/.exec(this.input)) {
	      this.consume(captures[0].length - 1);
	      this.incrementLine(1);
	      return true;
	    }
	  },

	  /**
	   * Comment.
	   */

	  comment: function() {
	    var captures;
	    if (captures = /^\/\/(-)?([^\n]*)/.exec(this.input)) {
	      this.consume(captures[0].length);
	      var tok = this.tok('comment', captures[2]);
	      tok.buffer = '-' != captures[1];
	      this.interpolationAllowed = tok.buffer;
	      this.tokens.push(tok);
	      this.incrementColumn(captures[0].length);
	      this.callLexerFunction('pipelessText');
	      return true;
	    }
	  },

	  /**
	   * Interpolated tag.
	   */

	  interpolation: function() {
	    if (/^#\{/.test(this.input)) {
	      var match = this.bracketExpression(1);
	      this.consume(match.end + 1);
	      var tok = this.tok('interpolation', match.src);
	      this.tokens.push(tok);
	      this.incrementColumn(2); // '#{'
	      this.assertExpression(match.src);

	      var splitted = match.src.split('\n');
	      var lines = splitted.length - 1;
	      this.incrementLine(lines);
	      this.incrementColumn(splitted[lines].length + 1); // + 1 → '}'
	      return true;
	    }
	  },

	  /**
	   * Tag.
	   */

	  tag: function() {
	    var captures;

	    if (captures = /^(\w(?:[-:\w]*\w)?)/.exec(this.input)) {
	      var tok, name = captures[1], len = captures[0].length;
	      this.consume(len);
	      tok = this.tok('tag', name);
	      this.tokens.push(tok);
	      this.incrementColumn(len);
	      return true;
	    }
	  },

	  /**
	   * Filter.
	   */

	  filter: function(opts) {
	    var tok = this.scan(/^:([\w\-]+)/, 'filter');
	    var inInclude = opts && opts.inInclude;
	    if (tok) {
	      this.tokens.push(tok);
	      this.incrementColumn(tok.val.length);
	      this.callLexerFunction('attrs');
	      if (!inInclude) {
	        this.interpolationAllowed = false;
	        this.callLexerFunction('pipelessText');
	      }
	      return true;
	    }
	  },

	  /**
	   * Doctype.
	   */

	  doctype: function() {
	    var node = this.scanEndOfLine(/^doctype *([^\n]*)/, 'doctype');
	    if (node) {
	      this.tokens.push(node);
	      return true;
	    }
	  },

	  /**
	   * Id.
	   */

	  id: function() {
	    var tok = this.scan(/^#([\w-]+)/, 'id');
	    if (tok) {
	      this.tokens.push(tok);
	      this.incrementColumn(tok.val.length);
	      return true;
	    }
	    if (/^#/.test(this.input)) {
	      this.error('INVALID_ID', '"' + /.[^ \t\(\#\.\:]*/.exec(this.input.substr(1))[0] + '" is not a valid ID.');
	    }
	  },

	  /**
	   * Class.
	   */

	  className: function() {
	    var tok = this.scan(/^\.(-?-?[_a-z][_a-z0-9\-]*)/i, 'class');
	    if (tok) {
	      this.tokens.push(tok);
	      this.incrementColumn(tok.val.length);
	      return true;
	    }
	    if (/^\.\-/i.test(this.input)) {
	      this.error('INVALID_CLASS_NAME', 'If a class name begins with a "-" or "--", it must be followed by a letter or underscore.');
	    }
	    if (/^\.[0-9]/i.test(this.input)) {
	      this.error('INVALID_CLASS_NAME', 'Class names must begin with "-", "_" or a letter.');
	    }
	    if (/^\./.test(this.input)) {
	      this.error('INVALID_CLASS_NAME', '"' + /.[^ \t\(\#\.\:]*/.exec(this.input.substr(1))[0] + '" is not a valid class name.  Class names must begin with "-", "_" or a letter and can only contain "_", "-", a-z and 0-9.');
	    }
	  },

	  /**
	   * Text.
	   */
	  endInterpolation: function () {
	    if (this.interpolated && this.input[0] === ']') {
	      this.input = this.input.substr(1);
	      this.ended = true;
	      return true;
	    }
	  },
	  addText: function (type, value, prefix, escaped) {
	    if (value + prefix === '') return;
	    prefix = prefix || '';
	    var indexOfEnd = this.interpolated ? value.indexOf(']') : -1;
	    var indexOfStart = value.indexOf('#[');
	    var indexOfEscaped = value.indexOf('\\#[');
	    var matchOfStringInterp = /(\\)?([#!]){((?:.|\n)*)$/.exec(value);
	    var indexOfStringInterp = this.interpolationAllowed && matchOfStringInterp ? matchOfStringInterp.index : Infinity;

	    if (indexOfEnd === -1) indexOfEnd = Infinity;
	    if (indexOfStart === -1) indexOfStart = Infinity;
	    if (indexOfEscaped === -1) indexOfEscaped = Infinity;

	    if (indexOfEscaped !== Infinity && indexOfEscaped < indexOfEnd && indexOfEscaped < indexOfStart && indexOfEscaped < indexOfStringInterp) {
	      prefix = prefix + value.substring(0, indexOfEscaped) + '#[';
	      return this.addText(type, value.substring(indexOfEscaped + 3), prefix, true);
	    }
	    if (indexOfStart !== Infinity && indexOfStart < indexOfEnd && indexOfStart < indexOfEscaped && indexOfStart < indexOfStringInterp) {
	      this.tokens.push(this.tok(type, prefix + value.substring(0, indexOfStart)));
	      this.incrementColumn(prefix.length + indexOfStart);
	      if (escaped) this.incrementColumn(1);
	      this.tokens.push(this.tok('start-pug-interpolation'));
	      this.incrementColumn(2);
	      var child = new this.constructor(value.substr(indexOfStart + 2), {
	        filename: this.filename,
	        interpolated: true,
	        startingLine: this.lineno,
	        startingColumn: this.colno
	      });
	      var interpolated;
	      try {
	        interpolated = child.getTokens();
	      } catch (ex) {
	        if (ex.code && /^PUG:/.test(ex.code)) {
	          this.colno = ex.column;
	          this.error(ex.code.substr(4), ex.msg);
	        }
	        throw ex;
	      }
	      this.colno = child.colno;
	      this.tokens = this.tokens.concat(interpolated);
	      this.tokens.push(this.tok('end-pug-interpolation'));
	      this.incrementColumn(1);
	      this.addText(type, child.input);
	      return;
	    }
	    if (indexOfEnd !== Infinity && indexOfEnd < indexOfStart && indexOfEnd < indexOfEscaped && indexOfEnd < indexOfStringInterp) {
	      if (prefix + value.substring(0, indexOfEnd)) {
	        this.addText(type, value.substring(0, indexOfEnd), prefix);
	      }
	      this.ended = true;
	      this.input = value.substr(value.indexOf(']') + 1) + this.input;
	      return;
	    }
	    if (indexOfStringInterp !== Infinity) {
	      if (matchOfStringInterp[1]) {
	        prefix = prefix + value.substring(0, indexOfStringInterp) + '#{';
	        return this.addText(type, value.substring(indexOfStringInterp + 3), prefix);
	      }
	      var before = value.substr(0, indexOfStringInterp);
	      if (prefix || before) {
	        before = prefix + before;
	        this.tokens.push(this.tok(type, before));
	        this.incrementColumn(before.length);
	      }

	      var rest = matchOfStringInterp[3];
	      var range;
	      var tok = this.tok('interpolated-code');
	      this.incrementColumn(2);
	      try {
	        range = characterParser.parseUntil(rest, '}');
	      } catch (ex) {
	        if (ex.index !== undefined) {
	          this.incrementColumn(ex.index);
	        }
	        if (ex.code === 'CHARACTER_PARSER:END_OF_STRING_REACHED') {
	          this.error('NO_END_BRACKET', 'End of line was reached with no closing bracket for interpolation.');
	        } else if (ex.code === 'CHARACTER_PARSER:MISMATCHED_BRACKET') {
	          this.error('BRACKET_MISMATCH', ex.message);
	        } else {
	          throw ex;
	        }
	      }
	      tok.mustEscape = matchOfStringInterp[2] === '#';
	      tok.buffer = true;
	      tok.val = range.src;
	      this.assertExpression(range.src);
	      this.tokens.push(tok);

	      if (range.end + 1 < rest.length) {
	        rest = rest.substr(range.end + 1);
	        this.incrementColumn(range.end + 1);
	        this.addText(type, rest);
	      } else {
	        this.incrementColumn(rest.length);
	      }
	      return;
	    }

	    value = prefix + value;
	    this.tokens.push(this.tok(type, value));
	    this.incrementColumn(value.length);
	  },

	  text: function() {
	    var tok = this.scan(/^(?:\| ?| )([^\n]+)/, 'text') ||
	      this.scan(/^\|?( )/, 'text');
	    if (tok) {
	      this.addText('text', tok.val);
	      return true;
	    }
	  },

	  textHtml: function () {
	    var tok = this.scan(/^(<[^\n]*)/, 'text-html');
	    if (tok) {
	      this.addText('text-html', tok.val);
	      return true;
	    }
	  },

	  /**
	   * Dot.
	   */

	  dot: function() {
	    var tok;
	    if (tok = this.scanEndOfLine(/^\./, 'dot')) {
	      this.tokens.push(tok);
	      this.callLexerFunction('pipelessText');
	      return true;
	    }
	  },

	  /**
	   * Extends.
	   */

	  "extends": function() {
	    var tok = this.scan(/^extends?(?= |$|\n)/, 'extends');
	    if (tok) {
	      this.tokens.push(tok);
	      if (!this.callLexerFunction('path')) {
	        this.error('NO_EXTENDS_PATH', 'missing path for extends');
	      }
	      return true;
	    }
	    if (this.scan(/^extends?\b/)) {
	      this.error('MALFORMED_EXTENDS', 'malformed extends');
	    }
	  },

	  /**
	   * Block prepend.
	   */

	  prepend: function() {
	    var captures;
	    if (captures = /^(?:block +)?prepend +([^\n]+)/.exec(this.input)) {
	      var name = captures[1].trim();
	      var comment = '';
	      if (name.indexOf('//') !== -1) {
	        comment = '//' + name.split('//').slice(1).join('//');
	        name = name.split('//')[0].trim();
	      }
	      if (!name) return;
	      this.consume(captures[0].length - comment.length);
	      var tok = this.tok('block', name);
	      tok.mode = 'prepend';
	      this.tokens.push(tok);
	      return true;
	    }
	  },

	  /**
	   * Block append.
	   */

	  append: function() {
	    var captures;
	    if (captures = /^(?:block +)?append +([^\n]+)/.exec(this.input)) {
	      var name = captures[1].trim();
	      var comment = '';
	      if (name.indexOf('//') !== -1) {
	        comment = '//' + name.split('//').slice(1).join('//');
	        name = name.split('//')[0].trim();
	      }
	      if (!name) return;
	      this.consume(captures[0].length - comment.length);
	      var tok = this.tok('block', name);
	      tok.mode = 'append';
	      this.tokens.push(tok);
	      return true;
	    }
	  },

	  /**
	   * Block.
	   */

	  block: function() {
	    var captures;
	    if (captures = /^block +([^\n]+)/.exec(this.input)) {
	      var name = captures[1].trim();
	      var comment = '';
	      if (name.indexOf('//') !== -1) {
	        comment = '//' + name.split('//').slice(1).join('//');
	        name = name.split('//')[0].trim();
	      }
	      if (!name) return;
	      this.consume(captures[0].length - comment.length);
	      var tok = this.tok('block', name);
	      tok.mode = 'replace';
	      this.tokens.push(tok);
	      return true;
	    }
	  },

	  /**
	   * Mixin Block.
	   */

	  mixinBlock: function() {
	    var tok;
	    if (tok = this.scanEndOfLine(/^block/, 'mixin-block')) {
	      this.tokens.push(tok);
	      return true;
	    }
	  },

	  /**
	   * Yield.
	   */

	  'yield': function() {
	    var tok = this.scanEndOfLine(/^yield/, 'yield');
	    if (tok) {
	      this.tokens.push(tok);
	      return true;
	    }
	  },

	  /**
	   * Include.
	   */

	  include: function() {
	    var tok = this.scan(/^include(?=:| |$|\n)/, 'include');
	    if (tok) {
	      this.tokens.push(tok);
	      while (this.callLexerFunction('filter', { inInclude: true }));
	      if (!this.callLexerFunction('path')) {
	        if (/^[^ \n]+/.test(this.input)) {
	          // if there is more text
	          this.fail();
	        } else {
	          // if not
	          this.error('NO_INCLUDE_PATH', 'missing path for include');
	        }
	      }
	      return true;
	    }
	    if (this.scan(/^include\b/)) {
	      this.error('MALFORMED_INCLUDE', 'malformed include');
	    }
	  },

	  /**
	   * Path
	   */

	  path: function() {
	    var tok = this.scanEndOfLine(/^ ([^\n]+)/, 'path');
	    if (tok && (tok.val = tok.val.trim())) {
	      this.tokens.push(tok);
	      return true;
	    }
	  },

	  /**
	   * Case.
	   */

	  "case": function() {
	    var tok = this.scanEndOfLine(/^case +([^\n]+)/, 'case');
	    if (tok) {
	      this.incrementColumn(-tok.val.length);
	      this.assertExpression(tok.val);
	      this.incrementColumn(tok.val.length);
	      this.tokens.push(tok);
	      return true;
	    }
	    if (this.scan(/^case\b/)) {
	      this.error('NO_CASE_EXPRESSION', 'missing expression for case');
	    }
	  },

	  /**
	   * When.
	   */

	  when: function() {
	    var tok = this.scanEndOfLine(/^when +([^:\n]+)/, 'when');
	    if (tok) {
	      var parser = characterParser(tok.val);
	      while (parser.isNesting() || parser.isString()) {
	        var rest = /:([^:\n]+)/.exec(this.input);
	        if (!rest) break;

	        tok.val += rest[0];
	        this.consume(rest[0].length);
	        this.incrementColumn(rest[0].length);
	        parser = characterParser(tok.val);
	      }

	      this.incrementColumn(-tok.val.length);
	      this.assertExpression(tok.val);
	      this.incrementColumn(tok.val.length);
	      this.tokens.push(tok);
	      return true;
	    }
	    if (this.scan(/^when\b/)) {
	      this.error('NO_WHEN_EXPRESSION', 'missing expression for when');
	    }
	  },

	  /**
	   * Default.
	   */

	  "default": function() {
	    var tok = this.scanEndOfLine(/^default/, 'default');
	    if (tok) {
	      this.tokens.push(tok);
	      return true;
	    }
	    if (this.scan(/^default\b/)) {
	      this.error('DEFAULT_WITH_EXPRESSION', 'default should not have an expression');
	    }
	  },

	  /**
	   * Call mixin.
	   */

	  call: function(){

	    var tok, captures, increment;
	    if (captures = /^\+(\s*)(([-\w]+)|(#\{))/.exec(this.input)) {
	      // try to consume simple or interpolated call
	      if (captures[3]) {
	        // simple call
	        increment = captures[0].length;
	        this.consume(increment);
	        tok = this.tok('call', captures[3]);
	      } else {
	        // interpolated call
	        var match = this.bracketExpression(2 + captures[1].length);
	        increment = match.end + 1;
	        this.consume(increment);
	        this.assertExpression(match.src);
	        tok = this.tok('call', '#{'+match.src+'}');
	      }

	      this.incrementColumn(increment);

	      tok.args = null;
	      // Check for args (not attributes)
	      if (captures = /^ *\(/.exec(this.input)) {
	        var range = this.bracketExpression(captures[0].length - 1);
	        if (!/^\s*[-\w]+ *=/.test(range.src)) { // not attributes
	          this.incrementColumn(1);
	          this.consume(range.end + 1);
	          tok.args = range.src;
	          this.assertExpression('[' + tok.args + ']');
	          for (var i = 0; i <= tok.args.length; i++) {
	            if (tok.args[i] === '\n') {
	              this.incrementLine(1);
	            } else {
	              this.incrementColumn(1);
	            }
	          }
	        }
	      }
	      this.tokens.push(tok);
	      return true;
	    }
	  },

	  /**
	   * Mixin.
	   */

	  mixin: function(){
	    var captures;
	    if (captures = /^mixin +([-\w]+)(?: *\((.*)\))? */.exec(this.input)) {
	      this.consume(captures[0].length);
	      var tok = this.tok('mixin', captures[1]);
	      tok.args = captures[2] || null;
	      this.tokens.push(tok);
	      return true;
	    }
	  },

	  /**
	   * Conditional.
	   */

	  conditional: function() {
	    var captures;
	    if (captures = /^(if|unless|else if|else)\b([^\n]*)/.exec(this.input)) {
	      this.consume(captures[0].length);
	      var type = captures[1].replace(/ /g, '-');
	      var js = captures[2] && captures[2].trim();
	      // type can be "if", "else-if" and "else"
	      var tok = this.tok(type, js);
	      this.incrementColumn(captures[0].length - js.length);

	      switch (type) {
	        case 'if':
	        case 'else-if':
	          this.assertExpression(js);
	          break;
	        case 'unless':
	          this.assertExpression(js);
	          tok.val = '!(' + js + ')';
	          tok.type = 'if';
	          break;
	        case 'else':
	          if (js) {
	            this.error(
	              'ELSE_CONDITION',
	              '`else` cannot have a condition, perhaps you meant `else if`'
	            );
	          }
	          break;
	      }
	      this.tokens.push(tok);
	      return true;
	    }
	  },

	  /**
	   * While.
	   */

	  "while": function() {
	    var captures;
	    if (captures = /^while +([^\n]+)/.exec(this.input)) {
	      this.consume(captures[0].length);
	      this.assertExpression(captures[1])
	      this.tokens.push(this.tok('while', captures[1]));
	      return true;
	    }
	    if (this.scan(/^while\b/)) {
	      this.error('NO_WHILE_EXPRESSION', 'missing expression for while');
	    }
	  },

	  /**
	   * Each.
	   */

	  each: function() {
	    var captures;
	    if (captures = /^(?:each|for) +([a-zA-Z_$][\w$]*)(?: *, *([a-zA-Z_$][\w$]*))? * in *([^\n]+)/.exec(this.input)) {
	      this.consume(captures[0].length);
	      var tok = this.tok('each', captures[1]);
	      tok.key = captures[2] || null;
	      this.incrementColumn(captures[0].length - captures[3].length);
	      this.assertExpression(captures[3])
	      tok.code = captures[3];
	      this.incrementColumn(captures[3].length);
	      this.tokens.push(tok);
	      return true;
	    }
	    if (this.scan(/^(?:each|for)\b/)) {
	      this.error('MALFORMED_EACH', 'malformed each');
	    }
	    if (captures = /^- *(?:each|for) +([a-zA-Z_$][\w$]*)(?: *, *([a-zA-Z_$][\w$]*))? +in +([^\n]+)/.exec(this.input)) {
	      this.error(
	        'MALFORMED_EACH',
	        'Pug each and for should no longer be prefixed with a dash ("-"). They are pug keywords and not part of JavaScript.'
	      );
	    }
	  },

	  /**
	   * Code.
	   */

	  code: function() {
	    var captures;
	    if (captures = /^(!?=|-)[ \t]*([^\n]+)/.exec(this.input)) {
	      var flags = captures[1];
	      var code = captures[2];
	      var shortened = 0;
	      if (this.interpolated) {
	        var parsed;
	        try {
	          parsed = characterParser.parseUntil(code, ']');
	        } catch (err) {
	          if (err.index !== undefined) {
	            this.incrementColumn(captures[0].length - code.length + err.index);
	          }
	          if (err.code === 'CHARACTER_PARSER:END_OF_STRING_REACHED') {
	            this.error('NO_END_BRACKET', 'End of line was reached with no closing bracket for interpolation.');
	          } else if (err.code === 'CHARACTER_PARSER:MISMATCHED_BRACKET') {
	            this.error('BRACKET_MISMATCH', err.message);
	          } else {
	            throw err;
	          }
	        }
	        shortened = code.length - parsed.end;
	        code = parsed.src;
	      }
	      var consumed = captures[0].length - shortened;
	      this.consume(consumed);
	      var tok = this.tok('code', code);
	      tok.mustEscape = flags.charAt(0) === '=';
	      tok.buffer = flags.charAt(0) === '=' || flags.charAt(1) === '=';

	      // p #[!=    abc] hey
	      //     ^              original colno
	      //     -------------- captures[0]
	      //           -------- captures[2]
	      //     ------         captures[0] - captures[2]
	      //           ^        after colno

	      // =   abc
	      // ^                  original colno
	      // -------            captures[0]
	      //     ---            captures[2]
	      // ----               captures[0] - captures[2]
	      //     ^              after colno
	      this.incrementColumn(captures[0].length - captures[2].length);
	      if (tok.buffer) this.assertExpression(code);
	      this.tokens.push(tok);

	      // p #[!=    abc] hey
	      //           ^        original colno
	      //              ----- shortened
	      //           ---      code
	      //              ^     after colno

	      // =   abc
	      //     ^              original colno
	      //                    shortened
	      //     ---            code
	      //        ^           after colno
	      this.incrementColumn(code.length);
	      return true;
	    }
	  },

	  /**
	   * Block code.
	   */
	  blockCode: function() {
	    var tok
	    if (tok = this.scanEndOfLine(/^-/, 'blockcode')) {
	      this.tokens.push(tok);
	      this.interpolationAllowed = false;
	      this.callLexerFunction('pipelessText');
	      return true;
	    }
	  },

	  /**
	   * Attributes.
	   */

	  attrs: function() {
	    if ('(' == this.input.charAt(0)) {
	      var startingLine = this.lineno;
	      this.tokens.push(this.tok('start-attributes'));
	      var index = this.bracketExpression().end
	        , str = this.input.substr(1, index-1);

	      this.incrementColumn(1);
	      this.assertNestingCorrect(str);

	      var quote = '';
	      var self = this;

	      this.consume(index + 1);

	      var whitespaceRe = /[ \n\t]/;
	      var quoteRe = /['"]/;

	      var escapedAttr = true
	      var key = '';
	      var val = '';
	      var state = characterParser.defaultState();
	      var lineno = startingLine;
	      var colnoBeginAttr = this.colno;
	      var colnoBeginVal;
	      var loc = 'key';
	      var isEndOfAttribute = function (i) {
	        // if the key is not started, then the attribute cannot be ended
	        if (key.trim() === '') {
	          colnoBeginAttr = this.colno;
	          return false;
	        }
	        // if there's nothing more then the attribute must be ended
	        if (i === str.length) return true;

	        if (loc === 'key') {
	          if (whitespaceRe.test(str[i])) {
	            // find the first non-whitespace character
	            for (var x = i; x < str.length; x++) {
	              if (!whitespaceRe.test(str[x])) {
	                // starts a `value`
	                if (str[x] === '=' || str[x] === '!') return false;
	                // will be handled when x === i
	                else if (str[x] === ',') return false;
	                // attribute ended
	                else return true;
	              }
	            }
	          }
	          // if there's no whitespace and the character is not ',', the
	          // attribute did not end.
	          return str[i] === ',';
	        } else if (loc === 'value') {
	          // if the character is in a string or in parentheses/brackets/braces
	          if (state.isNesting() || state.isString()) return false;
	          // if the current value expression is not valid JavaScript, then
	          // assume that the user did not end the value
	          if (!self.assertExpression(val, true)) return false;
	          if (whitespaceRe.test(str[i])) {
	            // find the first non-whitespace character
	            for (var x = i; x < str.length; x++) {
	              if (!whitespaceRe.test(str[x])) {
	                // if it is a JavaScript punctuator, then assume that it is
	                // a part of the value
	                return !characterParser.isPunctuator(str[x]) || quoteRe.test(str[x]);
	              }
	            }
	          }
	          // if there's no whitespace and the character is not ',', the
	          // attribute did not end.
	          return str[i] === ',';
	        }
	      }

	      for (var i = 0; i <= str.length; i++) {
	        if (isEndOfAttribute.call(this, i)) {
	          if (val.trim()) {
	            var saved = this.colno;
	            this.colno = colnoBeginVal;
	            this.assertExpression(val);
	            this.colno = saved;
	          }

	          val = val.trim();

	          key = key.trim();
	          key = key.replace(/^['"]|['"]$/g, '');

	          var tok = this.tok('attribute');
	          tok.name = key;
	          tok.val = '' == val ? true : val;
	          tok.col = colnoBeginAttr;
	          tok.mustEscape = escapedAttr;
	          this.tokens.push(tok);

	          key = val = '';
	          loc = 'key';
	          escapedAttr = false;
	          this.lineno = lineno;
	        } else {
	          switch (loc) {
	            case 'key-char':
	              if (str[i] === quote) {
	                loc = 'key';
	                if (i + 1 < str.length && !/[ ,!=\n\t]/.test(str[i + 1]))
	                  this.error('INVALID_KEY_CHARACTER', 'Unexpected character "' + str[i + 1] + '" expected ` `, `\\n`, `\t`, `,`, `!` or `=`');
	              } else {
	                key += str[i];
	              }
	              break;
	            case 'key':
	              if (key === '' && quoteRe.test(str[i])) {
	                loc = 'key-char';
	                quote = str[i];
	              } else if (str[i] === '!' || str[i] === '=') {
	                escapedAttr = str[i] !== '!';
	                if (str[i] === '!') {
	                  this.incrementColumn(1);
	                  i++;
	                }
	                if (str[i] !== '=') this.error('INVALID_KEY_CHARACTER', 'Unexpected character ' + str[i] + ' expected `=`');
	                loc = 'value';
	                colnoBeginVal = this.colno + 1;
	                state = characterParser.defaultState();
	              } else {
	                key += str[i]
	              }
	              break;
	            case 'value':
	              state = characterParser.parseChar(str[i], state);
	              val += str[i];
	              break;
	          }
	        }
	        if (str[i] === '\n') {
	          // Save the line number locally to keep this.lineno at the start of
	          // the attribute.
	          lineno++;
	          this.colno = 1;
	          // If the key has not been started, update this.lineno immediately.
	          if (!key.trim()) this.lineno = lineno;
	        } else if (str[i] !== undefined) {
	          this.incrementColumn(1);
	        }
	      }

	      // Reset the line numbers based on the line started on
	      // plus the number of newline characters encountered
	      this.lineno = startingLine + (str.match(/\n/g) || []).length;

	      this.tokens.push(this.tok('end-attributes'));
	      this.incrementColumn(1);
	      return true;
	    }
	  },

	  /**
	   * &attributes block
	   */
	  attributesBlock: function () {
	    if (/^&attributes\b/.test(this.input)) {
	      var consumed = 11;
	      this.consume(consumed);
	      var tok = this.tok('&attributes');
	      this.incrementColumn(consumed);
	      var args = this.bracketExpression();
	      consumed = args.end + 1;
	      this.consume(consumed);
	      tok.val = args.src;
	      this.tokens.push(tok);
	      this.incrementColumn(consumed);
	      return true;
	    }
	  },

	  /**
	   * Indent | Outdent | Newline.
	   */

	  indent: function() {
	    var captures = this.scanIndentation();

	    if (captures) {
	      var indents = captures[1].length;

	      this.incrementLine(1);
	      this.consume(indents + 1);

	      if (' ' == this.input[0] || '\t' == this.input[0]) {
	        this.error('INVALID_INDENTATION', 'Invalid indentation, you can use tabs or spaces but not both');
	      }

	      // blank line
	      if ('\n' == this.input[0]) {
	        this.interpolationAllowed = true;
	        return this.tok('newline');
	      }

	      // outdent
	      if (indents < this.indentStack[0]) {
	        while (this.indentStack[0] > indents) {
	          if (this.indentStack[1] < indents) {
	            this.error('INCONSISTENT_INDENTATION', 'Inconsistent indentation. Expecting either ' + this.indentStack[1] + ' or ' + this.indentStack[0] + ' spaces/tabs.');
	          }
	          this.colno = this.indentStack[1] + 1;
	          this.tokens.push(this.tok('outdent'));
	          this.indentStack.shift();
	        }
	      // indent
	      } else if (indents && indents != this.indentStack[0]) {
	        this.tokens.push(this.tok('indent', indents));
	        this.colno = 1 + indents;
	        this.indentStack.unshift(indents);
	      // newline
	      } else {
	        this.tokens.push(this.tok('newline'));
	        this.colno = 1 + (this.indentStack[0] || 0);
	      }

	      this.interpolationAllowed = true;
	      return true;
	    }
	  },

	  pipelessText: function pipelessText(indents) {
	    while (this.callLexerFunction('blank'));

	    var captures = this.scanIndentation();

	    indents = indents || captures && captures[1].length;
	    if (indents > this.indentStack[0]) {
	      this.tokens.push(this.tok('start-pipeless-text'));
	      var tokens = [];
	      var isMatch;
	      // Index in this.input. Can't use this.consume because we might need to
	      // retry lexing the block.
	      var stringPtr = 0;
	      do {
	        // text has `\n` as a prefix
	        var i = this.input.substr(stringPtr + 1).indexOf('\n');
	        if (-1 == i) i = this.input.length - stringPtr - 1;
	        var str = this.input.substr(stringPtr + 1, i);
	        var lineCaptures = this.indentRe.exec('\n' + str);
	        var lineIndents = lineCaptures && lineCaptures[1].length;
	        isMatch = lineIndents >= indents || !str.trim();
	        if (isMatch) {
	          // consume test along with `\n` prefix if match
	          stringPtr += str.length + 1;
	          tokens.push(str.substr(indents));
	        } else if (lineIndents > this.indentStack[0]) {
	          // line is indented less than the first line but is still indented
	          // need to retry lexing the text block
	          this.tokens.pop();
	          return pipelessText.call(this, lineCaptures[1].length);
	        }
	      } while((this.input.length - stringPtr) && isMatch);
	      this.consume(stringPtr);
	      while (this.input.length === 0 && tokens[tokens.length - 1] === '') tokens.pop();
	      tokens.forEach(function (token, i) {
	        this.incrementLine(1);
	        if (i !== 0) this.tokens.push(this.tok('newline'));
	        this.incrementColumn(indents);
	        this.addText('text', token);
	      }.bind(this));
	      this.tokens.push(this.tok('end-pipeless-text'));
	      return true;
	    }
	  },

	  /**
	   * Slash.
	   */

	  slash: function() {
	    var tok = this.scan(/^\//, 'slash');
	    if (tok) {
	      this.tokens.push(tok);
	      return true;
	    }
	  },

	  /**
	   * ':'
	   */

	  colon: function() {
	    var tok = this.scan(/^: +/, ':');
	    if (tok) {
	      this.tokens.push(tok);
	      return true;
	    }
	  },

	  fail: function () {
	    this.error('UNEXPECTED_TEXT', 'unexpected text "' + this.input.substr(0, 5) + '"');
	  },

	  callLexerFunction: function (func) {
	    var rest = [];
	    for (var i = 1; i < arguments.length; i++) {
	      rest.push(arguments[i]);
	    }
	    var pluginArgs = [this].concat(rest);
	    for (var i = 0; i < this.plugins.length; i++) {
	      var plugin = this.plugins[i];
	      if (plugin[func] && plugin[func].apply(plugin, pluginArgs)) {
	        return true;
	      }
	    }
	    return this[func].apply(this, rest);
	  },

	  /**
	   * Move to the next token
	   *
	   * @api private
	   */

	  advance: function() {
	    return this.callLexerFunction('blank')
	      || this.callLexerFunction('eos')
	      || this.callLexerFunction('endInterpolation')
	      || this.callLexerFunction('yield')
	      || this.callLexerFunction('doctype')
	      || this.callLexerFunction('interpolation')
	      || this.callLexerFunction('case')
	      || this.callLexerFunction('when')
	      || this.callLexerFunction('default')
	      || this.callLexerFunction('extends')
	      || this.callLexerFunction('append')
	      || this.callLexerFunction('prepend')
	      || this.callLexerFunction('block')
	      || this.callLexerFunction('mixinBlock')
	      || this.callLexerFunction('include')
	      || this.callLexerFunction('mixin')
	      || this.callLexerFunction('call')
	      || this.callLexerFunction('conditional')
	      || this.callLexerFunction('each')
	      || this.callLexerFunction('while')
	      || this.callLexerFunction('tag')
	      || this.callLexerFunction('filter')
	      || this.callLexerFunction('blockCode')
	      || this.callLexerFunction('code')
	      || this.callLexerFunction('id')
	      || this.callLexerFunction('dot')
	      || this.callLexerFunction('className')
	      || this.callLexerFunction('attrs')
	      || this.callLexerFunction('attributesBlock')
	      || this.callLexerFunction('indent')
	      || this.callLexerFunction('text')
	      || this.callLexerFunction('textHtml')
	      || this.callLexerFunction('comment')
	      || this.callLexerFunction('slash')
	      || this.callLexerFunction('colon')
	      || this.fail();
	  },

	  /**
	   * Return an array of tokens for the current file
	   *
	   * @returns {Array.<Token>}
	   * @api public
	   */
	  getTokens: function () {
	    while (!this.ended) {
	      this.callLexerFunction('advance');
	    }
	    return this.tokens;
	  }
	};


/***/ },
/* 318 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global) {'use strict';

	// compare and isBuffer taken from https://github.com/feross/buffer/blob/680e9e5e488f22aac27599a57dc844a6315928dd/index.js
	// original notice:

	/*!
	 * The buffer module from node.js, for the browser.
	 *
	 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
	 * @license  MIT
	 */
	function compare(a, b) {
	  if (a === b) {
	    return 0;
	  }

	  var x = a.length;
	  var y = b.length;

	  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
	    if (a[i] !== b[i]) {
	      x = a[i];
	      y = b[i];
	      break;
	    }
	  }

	  if (x < y) {
	    return -1;
	  }
	  if (y < x) {
	    return 1;
	  }
	  return 0;
	}
	function isBuffer(b) {
	  if (global.Buffer && typeof global.Buffer.isBuffer === 'function') {
	    return global.Buffer.isBuffer(b);
	  }
	  return !!(b != null && b._isBuffer);
	}

	// based on node assert, original notice:

	// http://wiki.commonjs.org/wiki/Unit_Testing/1.0
	//
	// THIS IS NOT TESTED NOR LIKELY TO WORK OUTSIDE V8!
	//
	// Originally from narwhal.js (http://narwhaljs.org)
	// Copyright (c) 2009 Thomas Robinson <280north.com>
	//
	// Permission is hereby granted, free of charge, to any person obtaining a copy
	// of this software and associated documentation files (the 'Software'), to
	// deal in the Software without restriction, including without limitation the
	// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
	// sell copies of the Software, and to permit persons to whom the Software is
	// furnished to do so, subject to the following conditions:
	//
	// The above copyright notice and this permission notice shall be included in
	// all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	// AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
	// ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
	// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

	var util = __webpack_require__(319);
	var hasOwn = Object.prototype.hasOwnProperty;
	var pSlice = Array.prototype.slice;
	var functionsHaveNames = (function () {
	  return function foo() {}.name === 'foo';
	}());
	function pToString (obj) {
	  return Object.prototype.toString.call(obj);
	}
	function isView(arrbuf) {
	  if (isBuffer(arrbuf)) {
	    return false;
	  }
	  if (typeof global.ArrayBuffer !== 'function') {
	    return false;
	  }
	  if (typeof ArrayBuffer.isView === 'function') {
	    return ArrayBuffer.isView(arrbuf);
	  }
	  if (!arrbuf) {
	    return false;
	  }
	  if (arrbuf instanceof DataView) {
	    return true;
	  }
	  if (arrbuf.buffer && arrbuf.buffer instanceof ArrayBuffer) {
	    return true;
	  }
	  return false;
	}
	// 1. The assert module provides functions that throw
	// AssertionError's when particular conditions are not met. The
	// assert module must conform to the following interface.

	var assert = module.exports = ok;

	// 2. The AssertionError is defined in assert.
	// new assert.AssertionError({ message: message,
	//                             actual: actual,
	//                             expected: expected })

	var regex = /\s*function\s+([^\(\s]*)\s*/;
	// based on https://github.com/ljharb/function.prototype.name/blob/adeeeec8bfcc6068b187d7d9fb3d5bb1d3a30899/implementation.js
	function getName(func) {
	  if (!util.isFunction(func)) {
	    return;
	  }
	  if (functionsHaveNames) {
	    return func.name;
	  }
	  var str = func.toString();
	  var match = str.match(regex);
	  return match && match[1];
	}
	assert.AssertionError = function AssertionError(options) {
	  this.name = 'AssertionError';
	  this.actual = options.actual;
	  this.expected = options.expected;
	  this.operator = options.operator;
	  if (options.message) {
	    this.message = options.message;
	    this.generatedMessage = false;
	  } else {
	    this.message = getMessage(this);
	    this.generatedMessage = true;
	  }
	  var stackStartFunction = options.stackStartFunction || fail;
	  if (Error.captureStackTrace) {
	    Error.captureStackTrace(this, stackStartFunction);
	  } else {
	    // non v8 browsers so we can have a stacktrace
	    var err = new Error();
	    if (err.stack) {
	      var out = err.stack;

	      // try to strip useless frames
	      var fn_name = getName(stackStartFunction);
	      var idx = out.indexOf('\n' + fn_name);
	      if (idx >= 0) {
	        // once we have located the function frame
	        // we need to strip out everything before it (and its line)
	        var next_line = out.indexOf('\n', idx + 1);
	        out = out.substring(next_line + 1);
	      }

	      this.stack = out;
	    }
	  }
	};

	// assert.AssertionError instanceof Error
	util.inherits(assert.AssertionError, Error);

	function truncate(s, n) {
	  if (typeof s === 'string') {
	    return s.length < n ? s : s.slice(0, n);
	  } else {
	    return s;
	  }
	}
	function inspect(something) {
	  if (functionsHaveNames || !util.isFunction(something)) {
	    return util.inspect(something);
	  }
	  var rawname = getName(something);
	  var name = rawname ? ': ' + rawname : '';
	  return '[Function' +  name + ']';
	}
	function getMessage(self) {
	  return truncate(inspect(self.actual), 128) + ' ' +
	         self.operator + ' ' +
	         truncate(inspect(self.expected), 128);
	}

	// At present only the three keys mentioned above are used and
	// understood by the spec. Implementations or sub modules can pass
	// other keys to the AssertionError's constructor - they will be
	// ignored.

	// 3. All of the following functions must throw an AssertionError
	// when a corresponding condition is not met, with a message that
	// may be undefined if not provided.  All assertion methods provide
	// both the actual and expected values to the assertion error for
	// display purposes.

	function fail(actual, expected, message, operator, stackStartFunction) {
	  throw new assert.AssertionError({
	    message: message,
	    actual: actual,
	    expected: expected,
	    operator: operator,
	    stackStartFunction: stackStartFunction
	  });
	}

	// EXTENSION! allows for well behaved errors defined elsewhere.
	assert.fail = fail;

	// 4. Pure assertion tests whether a value is truthy, as determined
	// by !!guard.
	// assert.ok(guard, message_opt);
	// This statement is equivalent to assert.equal(true, !!guard,
	// message_opt);. To test strictly for the value true, use
	// assert.strictEqual(true, guard, message_opt);.

	function ok(value, message) {
	  if (!value) fail(value, true, message, '==', assert.ok);
	}
	assert.ok = ok;

	// 5. The equality assertion tests shallow, coercive equality with
	// ==.
	// assert.equal(actual, expected, message_opt);

	assert.equal = function equal(actual, expected, message) {
	  if (actual != expected) fail(actual, expected, message, '==', assert.equal);
	};

	// 6. The non-equality assertion tests for whether two objects are not equal
	// with != assert.notEqual(actual, expected, message_opt);

	assert.notEqual = function notEqual(actual, expected, message) {
	  if (actual == expected) {
	    fail(actual, expected, message, '!=', assert.notEqual);
	  }
	};

	// 7. The equivalence assertion tests a deep equality relation.
	// assert.deepEqual(actual, expected, message_opt);

	assert.deepEqual = function deepEqual(actual, expected, message) {
	  if (!_deepEqual(actual, expected, false)) {
	    fail(actual, expected, message, 'deepEqual', assert.deepEqual);
	  }
	};

	assert.deepStrictEqual = function deepStrictEqual(actual, expected, message) {
	  if (!_deepEqual(actual, expected, true)) {
	    fail(actual, expected, message, 'deepStrictEqual', assert.deepStrictEqual);
	  }
	};

	function _deepEqual(actual, expected, strict, memos) {
	  // 7.1. All identical values are equivalent, as determined by ===.
	  if (actual === expected) {
	    return true;
	  } else if (isBuffer(actual) && isBuffer(expected)) {
	    return compare(actual, expected) === 0;

	  // 7.2. If the expected value is a Date object, the actual value is
	  // equivalent if it is also a Date object that refers to the same time.
	  } else if (util.isDate(actual) && util.isDate(expected)) {
	    return actual.getTime() === expected.getTime();

	  // 7.3 If the expected value is a RegExp object, the actual value is
	  // equivalent if it is also a RegExp object with the same source and
	  // properties (`global`, `multiline`, `lastIndex`, `ignoreCase`).
	  } else if (util.isRegExp(actual) && util.isRegExp(expected)) {
	    return actual.source === expected.source &&
	           actual.global === expected.global &&
	           actual.multiline === expected.multiline &&
	           actual.lastIndex === expected.lastIndex &&
	           actual.ignoreCase === expected.ignoreCase;

	  // 7.4. Other pairs that do not both pass typeof value == 'object',
	  // equivalence is determined by ==.
	  } else if ((actual === null || typeof actual !== 'object') &&
	             (expected === null || typeof expected !== 'object')) {
	    return strict ? actual === expected : actual == expected;

	  // If both values are instances of typed arrays, wrap their underlying
	  // ArrayBuffers in a Buffer each to increase performance
	  // This optimization requires the arrays to have the same type as checked by
	  // Object.prototype.toString (aka pToString). Never perform binary
	  // comparisons for Float*Arrays, though, since e.g. +0 === -0 but their
	  // bit patterns are not identical.
	  } else if (isView(actual) && isView(expected) &&
	             pToString(actual) === pToString(expected) &&
	             !(actual instanceof Float32Array ||
	               actual instanceof Float64Array)) {
	    return compare(new Uint8Array(actual.buffer),
	                   new Uint8Array(expected.buffer)) === 0;

	  // 7.5 For all other Object pairs, including Array objects, equivalence is
	  // determined by having the same number of owned properties (as verified
	  // with Object.prototype.hasOwnProperty.call), the same set of keys
	  // (although not necessarily the same order), equivalent values for every
	  // corresponding key, and an identical 'prototype' property. Note: this
	  // accounts for both named and indexed properties on Arrays.
	  } else if (isBuffer(actual) !== isBuffer(expected)) {
	    return false;
	  } else {
	    memos = memos || {actual: [], expected: []};

	    var actualIndex = memos.actual.indexOf(actual);
	    if (actualIndex !== -1) {
	      if (actualIndex === memos.expected.indexOf(expected)) {
	        return true;
	      }
	    }

	    memos.actual.push(actual);
	    memos.expected.push(expected);

	    return objEquiv(actual, expected, strict, memos);
	  }
	}

	function isArguments(object) {
	  return Object.prototype.toString.call(object) == '[object Arguments]';
	}

	function objEquiv(a, b, strict, actualVisitedObjects) {
	  if (a === null || a === undefined || b === null || b === undefined)
	    return false;
	  // if one is a primitive, the other must be same
	  if (util.isPrimitive(a) || util.isPrimitive(b))
	    return a === b;
	  if (strict && Object.getPrototypeOf(a) !== Object.getPrototypeOf(b))
	    return false;
	  var aIsArgs = isArguments(a);
	  var bIsArgs = isArguments(b);
	  if ((aIsArgs && !bIsArgs) || (!aIsArgs && bIsArgs))
	    return false;
	  if (aIsArgs) {
	    a = pSlice.call(a);
	    b = pSlice.call(b);
	    return _deepEqual(a, b, strict);
	  }
	  var ka = objectKeys(a);
	  var kb = objectKeys(b);
	  var key, i;
	  // having the same number of owned properties (keys incorporates
	  // hasOwnProperty)
	  if (ka.length !== kb.length)
	    return false;
	  //the same set of keys (although not necessarily the same order),
	  ka.sort();
	  kb.sort();
	  //~~~cheap key test
	  for (i = ka.length - 1; i >= 0; i--) {
	    if (ka[i] !== kb[i])
	      return false;
	  }
	  //equivalent values for every corresponding key, and
	  //~~~possibly expensive deep test
	  for (i = ka.length - 1; i >= 0; i--) {
	    key = ka[i];
	    if (!_deepEqual(a[key], b[key], strict, actualVisitedObjects))
	      return false;
	  }
	  return true;
	}

	// 8. The non-equivalence assertion tests for any deep inequality.
	// assert.notDeepEqual(actual, expected, message_opt);

	assert.notDeepEqual = function notDeepEqual(actual, expected, message) {
	  if (_deepEqual(actual, expected, false)) {
	    fail(actual, expected, message, 'notDeepEqual', assert.notDeepEqual);
	  }
	};

	assert.notDeepStrictEqual = notDeepStrictEqual;
	function notDeepStrictEqual(actual, expected, message) {
	  if (_deepEqual(actual, expected, true)) {
	    fail(actual, expected, message, 'notDeepStrictEqual', notDeepStrictEqual);
	  }
	}


	// 9. The strict equality assertion tests strict equality, as determined by ===.
	// assert.strictEqual(actual, expected, message_opt);

	assert.strictEqual = function strictEqual(actual, expected, message) {
	  if (actual !== expected) {
	    fail(actual, expected, message, '===', assert.strictEqual);
	  }
	};

	// 10. The strict non-equality assertion tests for strict inequality, as
	// determined by !==.  assert.notStrictEqual(actual, expected, message_opt);

	assert.notStrictEqual = function notStrictEqual(actual, expected, message) {
	  if (actual === expected) {
	    fail(actual, expected, message, '!==', assert.notStrictEqual);
	  }
	};

	function expectedException(actual, expected) {
	  if (!actual || !expected) {
	    return false;
	  }

	  if (Object.prototype.toString.call(expected) == '[object RegExp]') {
	    return expected.test(actual);
	  }

	  try {
	    if (actual instanceof expected) {
	      return true;
	    }
	  } catch (e) {
	    // Ignore.  The instanceof check doesn't work for arrow functions.
	  }

	  if (Error.isPrototypeOf(expected)) {
	    return false;
	  }

	  return expected.call({}, actual) === true;
	}

	function _tryBlock(block) {
	  var error;
	  try {
	    block();
	  } catch (e) {
	    error = e;
	  }
	  return error;
	}

	function _throws(shouldThrow, block, expected, message) {
	  var actual;

	  if (typeof block !== 'function') {
	    throw new TypeError('"block" argument must be a function');
	  }

	  if (typeof expected === 'string') {
	    message = expected;
	    expected = null;
	  }

	  actual = _tryBlock(block);

	  message = (expected && expected.name ? ' (' + expected.name + ').' : '.') +
	            (message ? ' ' + message : '.');

	  if (shouldThrow && !actual) {
	    fail(actual, expected, 'Missing expected exception' + message);
	  }

	  var userProvidedMessage = typeof message === 'string';
	  var isUnwantedException = !shouldThrow && util.isError(actual);
	  var isUnexpectedException = !shouldThrow && actual && !expected;

	  if ((isUnwantedException &&
	      userProvidedMessage &&
	      expectedException(actual, expected)) ||
	      isUnexpectedException) {
	    fail(actual, expected, 'Got unwanted exception' + message);
	  }

	  if ((shouldThrow && actual && expected &&
	      !expectedException(actual, expected)) || (!shouldThrow && actual)) {
	    throw actual;
	  }
	}

	// 11. Expected to throw an error:
	// assert.throws(block, Error_opt, message_opt);

	assert.throws = function(block, /*optional*/error, /*optional*/message) {
	  _throws(true, block, error, message);
	};

	// EXTENSION! This is annoying to write outside this module.
	assert.doesNotThrow = function(block, /*optional*/error, /*optional*/message) {
	  _throws(false, block, error, message);
	};

	assert.ifError = function(err) { if (err) throw err; };

	var objectKeys = Object.keys || function (obj) {
	  var keys = [];
	  for (var key in obj) {
	    if (hasOwn.call(obj, key)) keys.push(key);
	  }
	  return keys;
	};

	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 319 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global, process) {// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.

	var formatRegExp = /%[sdj%]/g;
	exports.format = function(f) {
	  if (!isString(f)) {
	    var objects = [];
	    for (var i = 0; i < arguments.length; i++) {
	      objects.push(inspect(arguments[i]));
	    }
	    return objects.join(' ');
	  }

	  var i = 1;
	  var args = arguments;
	  var len = args.length;
	  var str = String(f).replace(formatRegExp, function(x) {
	    if (x === '%%') return '%';
	    if (i >= len) return x;
	    switch (x) {
	      case '%s': return String(args[i++]);
	      case '%d': return Number(args[i++]);
	      case '%j':
	        try {
	          return JSON.stringify(args[i++]);
	        } catch (_) {
	          return '[Circular]';
	        }
	      default:
	        return x;
	    }
	  });
	  for (var x = args[i]; i < len; x = args[++i]) {
	    if (isNull(x) || !isObject(x)) {
	      str += ' ' + x;
	    } else {
	      str += ' ' + inspect(x);
	    }
	  }
	  return str;
	};


	// Mark that a method should not be used.
	// Returns a modified function which warns once by default.
	// If --no-deprecation is set, then it is a no-op.
	exports.deprecate = function(fn, msg) {
	  // Allow for deprecating things in the process of starting up.
	  if (isUndefined(global.process)) {
	    return function() {
	      return exports.deprecate(fn, msg).apply(this, arguments);
	    };
	  }

	  if (process.noDeprecation === true) {
	    return fn;
	  }

	  var warned = false;
	  function deprecated() {
	    if (!warned) {
	      if (process.throwDeprecation) {
	        throw new Error(msg);
	      } else if (process.traceDeprecation) {
	        console.trace(msg);
	      } else {
	        console.error(msg);
	      }
	      warned = true;
	    }
	    return fn.apply(this, arguments);
	  }

	  return deprecated;
	};


	var debugs = {};
	var debugEnviron;
	exports.debuglog = function(set) {
	  if (isUndefined(debugEnviron))
	    debugEnviron = process.env.NODE_DEBUG || '';
	  set = set.toUpperCase();
	  if (!debugs[set]) {
	    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
	      var pid = process.pid;
	      debugs[set] = function() {
	        var msg = exports.format.apply(exports, arguments);
	        console.error('%s %d: %s', set, pid, msg);
	      };
	    } else {
	      debugs[set] = function() {};
	    }
	  }
	  return debugs[set];
	};


	/**
	 * Echos the value of a value. Trys to print the value out
	 * in the best way possible given the different types.
	 *
	 * @param {Object} obj The object to print out.
	 * @param {Object} opts Optional options object that alters the output.
	 */
	/* legacy: obj, showHidden, depth, colors*/
	function inspect(obj, opts) {
	  // default options
	  var ctx = {
	    seen: [],
	    stylize: stylizeNoColor
	  };
	  // legacy...
	  if (arguments.length >= 3) ctx.depth = arguments[2];
	  if (arguments.length >= 4) ctx.colors = arguments[3];
	  if (isBoolean(opts)) {
	    // legacy...
	    ctx.showHidden = opts;
	  } else if (opts) {
	    // got an "options" object
	    exports._extend(ctx, opts);
	  }
	  // set default options
	  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
	  if (isUndefined(ctx.depth)) ctx.depth = 2;
	  if (isUndefined(ctx.colors)) ctx.colors = false;
	  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
	  if (ctx.colors) ctx.stylize = stylizeWithColor;
	  return formatValue(ctx, obj, ctx.depth);
	}
	exports.inspect = inspect;


	// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
	inspect.colors = {
	  'bold' : [1, 22],
	  'italic' : [3, 23],
	  'underline' : [4, 24],
	  'inverse' : [7, 27],
	  'white' : [37, 39],
	  'grey' : [90, 39],
	  'black' : [30, 39],
	  'blue' : [34, 39],
	  'cyan' : [36, 39],
	  'green' : [32, 39],
	  'magenta' : [35, 39],
	  'red' : [31, 39],
	  'yellow' : [33, 39]
	};

	// Don't use 'blue' not visible on cmd.exe
	inspect.styles = {
	  'special': 'cyan',
	  'number': 'yellow',
	  'boolean': 'yellow',
	  'undefined': 'grey',
	  'null': 'bold',
	  'string': 'green',
	  'date': 'magenta',
	  // "name": intentionally not styling
	  'regexp': 'red'
	};


	function stylizeWithColor(str, styleType) {
	  var style = inspect.styles[styleType];

	  if (style) {
	    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
	           '\u001b[' + inspect.colors[style][1] + 'm';
	  } else {
	    return str;
	  }
	}


	function stylizeNoColor(str, styleType) {
	  return str;
	}


	function arrayToHash(array) {
	  var hash = {};

	  array.forEach(function(val, idx) {
	    hash[val] = true;
	  });

	  return hash;
	}


	function formatValue(ctx, value, recurseTimes) {
	  // Provide a hook for user-specified inspect functions.
	  // Check that value is an object with an inspect function on it
	  if (ctx.customInspect &&
	      value &&
	      isFunction(value.inspect) &&
	      // Filter out the util module, it's inspect function is special
	      value.inspect !== exports.inspect &&
	      // Also filter out any prototype objects using the circular check.
	      !(value.constructor && value.constructor.prototype === value)) {
	    var ret = value.inspect(recurseTimes, ctx);
	    if (!isString(ret)) {
	      ret = formatValue(ctx, ret, recurseTimes);
	    }
	    return ret;
	  }

	  // Primitive types cannot have properties
	  var primitive = formatPrimitive(ctx, value);
	  if (primitive) {
	    return primitive;
	  }

	  // Look up the keys of the object.
	  var keys = Object.keys(value);
	  var visibleKeys = arrayToHash(keys);

	  if (ctx.showHidden) {
	    keys = Object.getOwnPropertyNames(value);
	  }

	  // IE doesn't make error fields non-enumerable
	  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
	  if (isError(value)
	      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
	    return formatError(value);
	  }

	  // Some type of object without properties can be shortcutted.
	  if (keys.length === 0) {
	    if (isFunction(value)) {
	      var name = value.name ? ': ' + value.name : '';
	      return ctx.stylize('[Function' + name + ']', 'special');
	    }
	    if (isRegExp(value)) {
	      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
	    }
	    if (isDate(value)) {
	      return ctx.stylize(Date.prototype.toString.call(value), 'date');
	    }
	    if (isError(value)) {
	      return formatError(value);
	    }
	  }

	  var base = '', array = false, braces = ['{', '}'];

	  // Make Array say that they are Array
	  if (isArray(value)) {
	    array = true;
	    braces = ['[', ']'];
	  }

	  // Make functions say that they are functions
	  if (isFunction(value)) {
	    var n = value.name ? ': ' + value.name : '';
	    base = ' [Function' + n + ']';
	  }

	  // Make RegExps say that they are RegExps
	  if (isRegExp(value)) {
	    base = ' ' + RegExp.prototype.toString.call(value);
	  }

	  // Make dates with properties first say the date
	  if (isDate(value)) {
	    base = ' ' + Date.prototype.toUTCString.call(value);
	  }

	  // Make error with message first say the error
	  if (isError(value)) {
	    base = ' ' + formatError(value);
	  }

	  if (keys.length === 0 && (!array || value.length == 0)) {
	    return braces[0] + base + braces[1];
	  }

	  if (recurseTimes < 0) {
	    if (isRegExp(value)) {
	      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
	    } else {
	      return ctx.stylize('[Object]', 'special');
	    }
	  }

	  ctx.seen.push(value);

	  var output;
	  if (array) {
	    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
	  } else {
	    output = keys.map(function(key) {
	      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
	    });
	  }

	  ctx.seen.pop();

	  return reduceToSingleString(output, base, braces);
	}


	function formatPrimitive(ctx, value) {
	  if (isUndefined(value))
	    return ctx.stylize('undefined', 'undefined');
	  if (isString(value)) {
	    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
	                                             .replace(/'/g, "\\'")
	                                             .replace(/\\"/g, '"') + '\'';
	    return ctx.stylize(simple, 'string');
	  }
	  if (isNumber(value))
	    return ctx.stylize('' + value, 'number');
	  if (isBoolean(value))
	    return ctx.stylize('' + value, 'boolean');
	  // For some reason typeof null is "object", so special case here.
	  if (isNull(value))
	    return ctx.stylize('null', 'null');
	}


	function formatError(value) {
	  return '[' + Error.prototype.toString.call(value) + ']';
	}


	function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
	  var output = [];
	  for (var i = 0, l = value.length; i < l; ++i) {
	    if (hasOwnProperty(value, String(i))) {
	      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
	          String(i), true));
	    } else {
	      output.push('');
	    }
	  }
	  keys.forEach(function(key) {
	    if (!key.match(/^\d+$/)) {
	      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
	          key, true));
	    }
	  });
	  return output;
	}


	function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
	  var name, str, desc;
	  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
	  if (desc.get) {
	    if (desc.set) {
	      str = ctx.stylize('[Getter/Setter]', 'special');
	    } else {
	      str = ctx.stylize('[Getter]', 'special');
	    }
	  } else {
	    if (desc.set) {
	      str = ctx.stylize('[Setter]', 'special');
	    }
	  }
	  if (!hasOwnProperty(visibleKeys, key)) {
	    name = '[' + key + ']';
	  }
	  if (!str) {
	    if (ctx.seen.indexOf(desc.value) < 0) {
	      if (isNull(recurseTimes)) {
	        str = formatValue(ctx, desc.value, null);
	      } else {
	        str = formatValue(ctx, desc.value, recurseTimes - 1);
	      }
	      if (str.indexOf('\n') > -1) {
	        if (array) {
	          str = str.split('\n').map(function(line) {
	            return '  ' + line;
	          }).join('\n').substr(2);
	        } else {
	          str = '\n' + str.split('\n').map(function(line) {
	            return '   ' + line;
	          }).join('\n');
	        }
	      }
	    } else {
	      str = ctx.stylize('[Circular]', 'special');
	    }
	  }
	  if (isUndefined(name)) {
	    if (array && key.match(/^\d+$/)) {
	      return str;
	    }
	    name = JSON.stringify('' + key);
	    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
	      name = name.substr(1, name.length - 2);
	      name = ctx.stylize(name, 'name');
	    } else {
	      name = name.replace(/'/g, "\\'")
	                 .replace(/\\"/g, '"')
	                 .replace(/(^"|"$)/g, "'");
	      name = ctx.stylize(name, 'string');
	    }
	  }

	  return name + ': ' + str;
	}


	function reduceToSingleString(output, base, braces) {
	  var numLinesEst = 0;
	  var length = output.reduce(function(prev, cur) {
	    numLinesEst++;
	    if (cur.indexOf('\n') >= 0) numLinesEst++;
	    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
	  }, 0);

	  if (length > 60) {
	    return braces[0] +
	           (base === '' ? '' : base + '\n ') +
	           ' ' +
	           output.join(',\n  ') +
	           ' ' +
	           braces[1];
	  }

	  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
	}


	// NOTE: These type checking functions intentionally don't use `instanceof`
	// because it is fragile and can be easily faked with `Object.create()`.
	function isArray(ar) {
	  return Array.isArray(ar);
	}
	exports.isArray = isArray;

	function isBoolean(arg) {
	  return typeof arg === 'boolean';
	}
	exports.isBoolean = isBoolean;

	function isNull(arg) {
	  return arg === null;
	}
	exports.isNull = isNull;

	function isNullOrUndefined(arg) {
	  return arg == null;
	}
	exports.isNullOrUndefined = isNullOrUndefined;

	function isNumber(arg) {
	  return typeof arg === 'number';
	}
	exports.isNumber = isNumber;

	function isString(arg) {
	  return typeof arg === 'string';
	}
	exports.isString = isString;

	function isSymbol(arg) {
	  return typeof arg === 'symbol';
	}
	exports.isSymbol = isSymbol;

	function isUndefined(arg) {
	  return arg === void 0;
	}
	exports.isUndefined = isUndefined;

	function isRegExp(re) {
	  return isObject(re) && objectToString(re) === '[object RegExp]';
	}
	exports.isRegExp = isRegExp;

	function isObject(arg) {
	  return typeof arg === 'object' && arg !== null;
	}
	exports.isObject = isObject;

	function isDate(d) {
	  return isObject(d) && objectToString(d) === '[object Date]';
	}
	exports.isDate = isDate;

	function isError(e) {
	  return isObject(e) &&
	      (objectToString(e) === '[object Error]' || e instanceof Error);
	}
	exports.isError = isError;

	function isFunction(arg) {
	  return typeof arg === 'function';
	}
	exports.isFunction = isFunction;

	function isPrimitive(arg) {
	  return arg === null ||
	         typeof arg === 'boolean' ||
	         typeof arg === 'number' ||
	         typeof arg === 'string' ||
	         typeof arg === 'symbol' ||  // ES6 symbol
	         typeof arg === 'undefined';
	}
	exports.isPrimitive = isPrimitive;

	exports.isBuffer = __webpack_require__(321);

	function objectToString(o) {
	  return Object.prototype.toString.call(o);
	}


	function pad(n) {
	  return n < 10 ? '0' + n.toString(10) : n.toString(10);
	}


	var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
	              'Oct', 'Nov', 'Dec'];

	// 26 Feb 16:19:34
	function timestamp() {
	  var d = new Date();
	  var time = [pad(d.getHours()),
	              pad(d.getMinutes()),
	              pad(d.getSeconds())].join(':');
	  return [d.getDate(), months[d.getMonth()], time].join(' ');
	}


	// log is just a thin wrapper to console.log that prepends a timestamp
	exports.log = function() {
	  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
	};


	/**
	 * Inherit the prototype methods from one constructor into another.
	 *
	 * The Function.prototype.inherits from lang.js rewritten as a standalone
	 * function (not on Function.prototype). NOTE: If this file is to be loaded
	 * during bootstrapping this function needs to be rewritten using some native
	 * functions as prototype setup using normal JavaScript does not work as
	 * expected during bootstrapping (see mirror.js in r114903).
	 *
	 * @param {function} ctor Constructor function which needs to inherit the
	 *     prototype.
	 * @param {function} superCtor Constructor function to inherit prototype from.
	 */
	exports.inherits = __webpack_require__(322);

	exports._extend = function(origin, add) {
	  // Don't do anything if add isn't an object
	  if (!add || !isObject(add)) return origin;

	  var keys = Object.keys(add);
	  var i = keys.length;
	  while (i--) {
	    origin[keys[i]] = add[keys[i]];
	  }
	  return origin;
	};

	function hasOwnProperty(obj, prop) {
	  return Object.prototype.hasOwnProperty.call(obj, prop);
	}

	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }()), __webpack_require__(320)))

/***/ },
/* 320 */
/***/ function(module, exports) {

	// shim for using process in browser
	var process = module.exports = {};

	// cached from whatever global is present so that test runners that stub it
	// don't break things.  But we need to wrap it in a try catch in case it is
	// wrapped in strict mode code which doesn't define any globals.  It's inside a
	// function because try/catches deoptimize in certain engines.

	var cachedSetTimeout;
	var cachedClearTimeout;

	function defaultSetTimout() {
	    throw new Error('setTimeout has not been defined');
	}
	function defaultClearTimeout () {
	    throw new Error('clearTimeout has not been defined');
	}
	(function () {
	    try {
	        if (typeof setTimeout === 'function') {
	            cachedSetTimeout = setTimeout;
	        } else {
	            cachedSetTimeout = defaultSetTimout;
	        }
	    } catch (e) {
	        cachedSetTimeout = defaultSetTimout;
	    }
	    try {
	        if (typeof clearTimeout === 'function') {
	            cachedClearTimeout = clearTimeout;
	        } else {
	            cachedClearTimeout = defaultClearTimeout;
	        }
	    } catch (e) {
	        cachedClearTimeout = defaultClearTimeout;
	    }
	} ())
	function runTimeout(fun) {
	    if (cachedSetTimeout === setTimeout) {
	        //normal enviroments in sane situations
	        return setTimeout(fun, 0);
	    }
	    // if setTimeout wasn't available but was latter defined
	    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
	        cachedSetTimeout = setTimeout;
	        return setTimeout(fun, 0);
	    }
	    try {
	        // when when somebody has screwed with setTimeout but no I.E. maddness
	        return cachedSetTimeout(fun, 0);
	    } catch(e){
	        try {
	            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
	            return cachedSetTimeout.call(null, fun, 0);
	        } catch(e){
	            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
	            return cachedSetTimeout.call(this, fun, 0);
	        }
	    }


	}
	function runClearTimeout(marker) {
	    if (cachedClearTimeout === clearTimeout) {
	        //normal enviroments in sane situations
	        return clearTimeout(marker);
	    }
	    // if clearTimeout wasn't available but was latter defined
	    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
	        cachedClearTimeout = clearTimeout;
	        return clearTimeout(marker);
	    }
	    try {
	        // when when somebody has screwed with setTimeout but no I.E. maddness
	        return cachedClearTimeout(marker);
	    } catch (e){
	        try {
	            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
	            return cachedClearTimeout.call(null, marker);
	        } catch (e){
	            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
	            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
	            return cachedClearTimeout.call(this, marker);
	        }
	    }



	}
	var queue = [];
	var draining = false;
	var currentQueue;
	var queueIndex = -1;

	function cleanUpNextTick() {
	    if (!draining || !currentQueue) {
	        return;
	    }
	    draining = false;
	    if (currentQueue.length) {
	        queue = currentQueue.concat(queue);
	    } else {
	        queueIndex = -1;
	    }
	    if (queue.length) {
	        drainQueue();
	    }
	}

	function drainQueue() {
	    if (draining) {
	        return;
	    }
	    var timeout = runTimeout(cleanUpNextTick);
	    draining = true;

	    var len = queue.length;
	    while(len) {
	        currentQueue = queue;
	        queue = [];
	        while (++queueIndex < len) {
	            if (currentQueue) {
	                currentQueue[queueIndex].run();
	            }
	        }
	        queueIndex = -1;
	        len = queue.length;
	    }
	    currentQueue = null;
	    draining = false;
	    runClearTimeout(timeout);
	}

	process.nextTick = function (fun) {
	    var args = new Array(arguments.length - 1);
	    if (arguments.length > 1) {
	        for (var i = 1; i < arguments.length; i++) {
	            args[i - 1] = arguments[i];
	        }
	    }
	    queue.push(new Item(fun, args));
	    if (queue.length === 1 && !draining) {
	        runTimeout(drainQueue);
	    }
	};

	// v8 likes predictible objects
	function Item(fun, array) {
	    this.fun = fun;
	    this.array = array;
	}
	Item.prototype.run = function () {
	    this.fun.apply(null, this.array);
	};
	process.title = 'browser';
	process.browser = true;
	process.env = {};
	process.argv = [];
	process.version = ''; // empty string to avoid regexp issues
	process.versions = {};

	function noop() {}

	process.on = noop;
	process.addListener = noop;
	process.once = noop;
	process.off = noop;
	process.removeListener = noop;
	process.removeAllListeners = noop;
	process.emit = noop;

	process.binding = function (name) {
	    throw new Error('process.binding is not supported');
	};

	process.cwd = function () { return '/' };
	process.chdir = function (dir) {
	    throw new Error('process.chdir is not supported');
	};
	process.umask = function() { return 0; };


/***/ },
/* 321 */
/***/ function(module, exports) {

	module.exports = function isBuffer(arg) {
	  return arg && typeof arg === 'object'
	    && typeof arg.copy === 'function'
	    && typeof arg.fill === 'function'
	    && typeof arg.readUInt8 === 'function';
	}

/***/ },
/* 322 */
/***/ function(module, exports) {

	if (typeof Object.create === 'function') {
	  // implementation from standard node.js 'util' module
	  module.exports = function inherits(ctor, superCtor) {
	    ctor.super_ = superCtor
	    ctor.prototype = Object.create(superCtor.prototype, {
	      constructor: {
	        value: ctor,
	        enumerable: false,
	        writable: true,
	        configurable: true
	      }
	    });
	  };
	} else {
	  // old school shim for old browsers
	  module.exports = function inherits(ctor, superCtor) {
	    ctor.super_ = superCtor
	    var TempCtor = function () {}
	    TempCtor.prototype = superCtor.prototype
	    ctor.prototype = new TempCtor()
	    ctor.prototype.constructor = ctor
	  }
	}


/***/ },
/* 323 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var acorn = __webpack_require__(324);
	var objectAssign = __webpack_require__(325);

	module.exports = isExpression;

	var DEFAULT_OPTIONS = {
	  throw: false,
	  strict: false,
	  lineComment: false
	};

	function isExpression(src, options) {
	  options = objectAssign({}, DEFAULT_OPTIONS, options);

	  try {
	    var parser = new acorn.Parser(options, src, 0);

	    if (options.strict) {
	      parser.strict = true;
	    }

	    if (!options.lineComment) {
	      parser.skipLineComment = function (startSkip) {
	        this.raise(this.pos, 'Line comments not allowed in an expression');
	      };
	    }

	    parser.nextToken();
	    parser.parseExpression();

	    if (parser.type !== acorn.tokTypes.eof) {
	      parser.unexpected();
	    }
	  } catch (ex) {
	    if (!options.throw) {
	      return false;
	    }

	    throw ex;
	  }

	  return true;
	}


/***/ },
/* 324 */
/***/ function(module, exports, __webpack_require__) {

	(function (global, factory) {
	   true ? factory(exports) :
	  typeof define === 'function' && define.amd ? define(['exports'], factory) :
	  (factory((global.acorn = global.acorn || {})));
	}(this, (function (exports) { 'use strict';

	// Reserved word lists for various dialects of the language

	var reservedWords = {
	  3: "abstract boolean byte char class double enum export extends final float goto implements import int interface long native package private protected public short static super synchronized throws transient volatile",
	  5: "class enum extends super const export import",
	  6: "enum",
	  strict: "implements interface let package private protected public static yield",
	  strictBind: "eval arguments"
	}

	// And the keywords

	var ecma5AndLessKeywords = "break case catch continue debugger default do else finally for function if return switch throw try var while with null true false instanceof typeof void delete new in this"

	var keywords = {
	  5: ecma5AndLessKeywords,
	  6: ecma5AndLessKeywords + " const class extends export import super"
	}

	// ## Character categories

	// Big ugly regular expressions that match characters in the
	// whitespace, identifier, and identifier-start categories. These
	// are only applied when a character is found to actually have a
	// code point above 128.
	// Generated by `bin/generate-identifier-regex.js`.

	var nonASCIIidentifierStartChars = "\xaa\xb5\xba\xc0-\xd6\xd8-\xf6\xf8-\u02c1\u02c6-\u02d1\u02e0-\u02e4\u02ec\u02ee\u0370-\u0374\u0376\u0377\u037a-\u037d\u037f\u0386\u0388-\u038a\u038c\u038e-\u03a1\u03a3-\u03f5\u03f7-\u0481\u048a-\u052f\u0531-\u0556\u0559\u0561-\u0587\u05d0-\u05ea\u05f0-\u05f2\u0620-\u064a\u066e\u066f\u0671-\u06d3\u06d5\u06e5\u06e6\u06ee\u06ef\u06fa-\u06fc\u06ff\u0710\u0712-\u072f\u074d-\u07a5\u07b1\u07ca-\u07ea\u07f4\u07f5\u07fa\u0800-\u0815\u081a\u0824\u0828\u0840-\u0858\u08a0-\u08b4\u08b6-\u08bd\u0904-\u0939\u093d\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098c\u098f\u0990\u0993-\u09a8\u09aa-\u09b0\u09b2\u09b6-\u09b9\u09bd\u09ce\u09dc\u09dd\u09df-\u09e1\u09f0\u09f1\u0a05-\u0a0a\u0a0f\u0a10\u0a13-\u0a28\u0a2a-\u0a30\u0a32\u0a33\u0a35\u0a36\u0a38\u0a39\u0a59-\u0a5c\u0a5e\u0a72-\u0a74\u0a85-\u0a8d\u0a8f-\u0a91\u0a93-\u0aa8\u0aaa-\u0ab0\u0ab2\u0ab3\u0ab5-\u0ab9\u0abd\u0ad0\u0ae0\u0ae1\u0af9\u0b05-\u0b0c\u0b0f\u0b10\u0b13-\u0b28\u0b2a-\u0b30\u0b32\u0b33\u0b35-\u0b39\u0b3d\u0b5c\u0b5d\u0b5f-\u0b61\u0b71\u0b83\u0b85-\u0b8a\u0b8e-\u0b90\u0b92-\u0b95\u0b99\u0b9a\u0b9c\u0b9e\u0b9f\u0ba3\u0ba4\u0ba8-\u0baa\u0bae-\u0bb9\u0bd0\u0c05-\u0c0c\u0c0e-\u0c10\u0c12-\u0c28\u0c2a-\u0c39\u0c3d\u0c58-\u0c5a\u0c60\u0c61\u0c80\u0c85-\u0c8c\u0c8e-\u0c90\u0c92-\u0ca8\u0caa-\u0cb3\u0cb5-\u0cb9\u0cbd\u0cde\u0ce0\u0ce1\u0cf1\u0cf2\u0d05-\u0d0c\u0d0e-\u0d10\u0d12-\u0d3a\u0d3d\u0d4e\u0d54-\u0d56\u0d5f-\u0d61\u0d7a-\u0d7f\u0d85-\u0d96\u0d9a-\u0db1\u0db3-\u0dbb\u0dbd\u0dc0-\u0dc6\u0e01-\u0e30\u0e32\u0e33\u0e40-\u0e46\u0e81\u0e82\u0e84\u0e87\u0e88\u0e8a\u0e8d\u0e94-\u0e97\u0e99-\u0e9f\u0ea1-\u0ea3\u0ea5\u0ea7\u0eaa\u0eab\u0ead-\u0eb0\u0eb2\u0eb3\u0ebd\u0ec0-\u0ec4\u0ec6\u0edc-\u0edf\u0f00\u0f40-\u0f47\u0f49-\u0f6c\u0f88-\u0f8c\u1000-\u102a\u103f\u1050-\u1055\u105a-\u105d\u1061\u1065\u1066\u106e-\u1070\u1075-\u1081\u108e\u10a0-\u10c5\u10c7\u10cd\u10d0-\u10fa\u10fc-\u1248\u124a-\u124d\u1250-\u1256\u1258\u125a-\u125d\u1260-\u1288\u128a-\u128d\u1290-\u12b0\u12b2-\u12b5\u12b8-\u12be\u12c0\u12c2-\u12c5\u12c8-\u12d6\u12d8-\u1310\u1312-\u1315\u1318-\u135a\u1380-\u138f\u13a0-\u13f5\u13f8-\u13fd\u1401-\u166c\u166f-\u167f\u1681-\u169a\u16a0-\u16ea\u16ee-\u16f8\u1700-\u170c\u170e-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176c\u176e-\u1770\u1780-\u17b3\u17d7\u17dc\u1820-\u1877\u1880-\u18a8\u18aa\u18b0-\u18f5\u1900-\u191e\u1950-\u196d\u1970-\u1974\u1980-\u19ab\u19b0-\u19c9\u1a00-\u1a16\u1a20-\u1a54\u1aa7\u1b05-\u1b33\u1b45-\u1b4b\u1b83-\u1ba0\u1bae\u1baf\u1bba-\u1be5\u1c00-\u1c23\u1c4d-\u1c4f\u1c5a-\u1c7d\u1c80-\u1c88\u1ce9-\u1cec\u1cee-\u1cf1\u1cf5\u1cf6\u1d00-\u1dbf\u1e00-\u1f15\u1f18-\u1f1d\u1f20-\u1f45\u1f48-\u1f4d\u1f50-\u1f57\u1f59\u1f5b\u1f5d\u1f5f-\u1f7d\u1f80-\u1fb4\u1fb6-\u1fbc\u1fbe\u1fc2-\u1fc4\u1fc6-\u1fcc\u1fd0-\u1fd3\u1fd6-\u1fdb\u1fe0-\u1fec\u1ff2-\u1ff4\u1ff6-\u1ffc\u2071\u207f\u2090-\u209c\u2102\u2107\u210a-\u2113\u2115\u2118-\u211d\u2124\u2126\u2128\u212a-\u2139\u213c-\u213f\u2145-\u2149\u214e\u2160-\u2188\u2c00-\u2c2e\u2c30-\u2c5e\u2c60-\u2ce4\u2ceb-\u2cee\u2cf2\u2cf3\u2d00-\u2d25\u2d27\u2d2d\u2d30-\u2d67\u2d6f\u2d80-\u2d96\u2da0-\u2da6\u2da8-\u2dae\u2db0-\u2db6\u2db8-\u2dbe\u2dc0-\u2dc6\u2dc8-\u2dce\u2dd0-\u2dd6\u2dd8-\u2dde\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303c\u3041-\u3096\u309b-\u309f\u30a1-\u30fa\u30fc-\u30ff\u3105-\u312d\u3131-\u318e\u31a0-\u31ba\u31f0-\u31ff\u3400-\u4db5\u4e00-\u9fd5\ua000-\ua48c\ua4d0-\ua4fd\ua500-\ua60c\ua610-\ua61f\ua62a\ua62b\ua640-\ua66e\ua67f-\ua69d\ua6a0-\ua6ef\ua717-\ua71f\ua722-\ua788\ua78b-\ua7ae\ua7b0-\ua7b7\ua7f7-\ua801\ua803-\ua805\ua807-\ua80a\ua80c-\ua822\ua840-\ua873\ua882-\ua8b3\ua8f2-\ua8f7\ua8fb\ua8fd\ua90a-\ua925\ua930-\ua946\ua960-\ua97c\ua984-\ua9b2\ua9cf\ua9e0-\ua9e4\ua9e6-\ua9ef\ua9fa-\ua9fe\uaa00-\uaa28\uaa40-\uaa42\uaa44-\uaa4b\uaa60-\uaa76\uaa7a\uaa7e-\uaaaf\uaab1\uaab5\uaab6\uaab9-\uaabd\uaac0\uaac2\uaadb-\uaadd\uaae0-\uaaea\uaaf2-\uaaf4\uab01-\uab06\uab09-\uab0e\uab11-\uab16\uab20-\uab26\uab28-\uab2e\uab30-\uab5a\uab5c-\uab65\uab70-\uabe2\uac00-\ud7a3\ud7b0-\ud7c6\ud7cb-\ud7fb\uf900-\ufa6d\ufa70-\ufad9\ufb00-\ufb06\ufb13-\ufb17\ufb1d\ufb1f-\ufb28\ufb2a-\ufb36\ufb38-\ufb3c\ufb3e\ufb40\ufb41\ufb43\ufb44\ufb46-\ufbb1\ufbd3-\ufd3d\ufd50-\ufd8f\ufd92-\ufdc7\ufdf0-\ufdfb\ufe70-\ufe74\ufe76-\ufefc\uff21-\uff3a\uff41-\uff5a\uff66-\uffbe\uffc2-\uffc7\uffca-\uffcf\uffd2-\uffd7\uffda-\uffdc"
	var nonASCIIidentifierChars = "\u200c\u200d\xb7\u0300-\u036f\u0387\u0483-\u0487\u0591-\u05bd\u05bf\u05c1\u05c2\u05c4\u05c5\u05c7\u0610-\u061a\u064b-\u0669\u0670\u06d6-\u06dc\u06df-\u06e4\u06e7\u06e8\u06ea-\u06ed\u06f0-\u06f9\u0711\u0730-\u074a\u07a6-\u07b0\u07c0-\u07c9\u07eb-\u07f3\u0816-\u0819\u081b-\u0823\u0825-\u0827\u0829-\u082d\u0859-\u085b\u08d4-\u08e1\u08e3-\u0903\u093a-\u093c\u093e-\u094f\u0951-\u0957\u0962\u0963\u0966-\u096f\u0981-\u0983\u09bc\u09be-\u09c4\u09c7\u09c8\u09cb-\u09cd\u09d7\u09e2\u09e3\u09e6-\u09ef\u0a01-\u0a03\u0a3c\u0a3e-\u0a42\u0a47\u0a48\u0a4b-\u0a4d\u0a51\u0a66-\u0a71\u0a75\u0a81-\u0a83\u0abc\u0abe-\u0ac5\u0ac7-\u0ac9\u0acb-\u0acd\u0ae2\u0ae3\u0ae6-\u0aef\u0b01-\u0b03\u0b3c\u0b3e-\u0b44\u0b47\u0b48\u0b4b-\u0b4d\u0b56\u0b57\u0b62\u0b63\u0b66-\u0b6f\u0b82\u0bbe-\u0bc2\u0bc6-\u0bc8\u0bca-\u0bcd\u0bd7\u0be6-\u0bef\u0c00-\u0c03\u0c3e-\u0c44\u0c46-\u0c48\u0c4a-\u0c4d\u0c55\u0c56\u0c62\u0c63\u0c66-\u0c6f\u0c81-\u0c83\u0cbc\u0cbe-\u0cc4\u0cc6-\u0cc8\u0cca-\u0ccd\u0cd5\u0cd6\u0ce2\u0ce3\u0ce6-\u0cef\u0d01-\u0d03\u0d3e-\u0d44\u0d46-\u0d48\u0d4a-\u0d4d\u0d57\u0d62\u0d63\u0d66-\u0d6f\u0d82\u0d83\u0dca\u0dcf-\u0dd4\u0dd6\u0dd8-\u0ddf\u0de6-\u0def\u0df2\u0df3\u0e31\u0e34-\u0e3a\u0e47-\u0e4e\u0e50-\u0e59\u0eb1\u0eb4-\u0eb9\u0ebb\u0ebc\u0ec8-\u0ecd\u0ed0-\u0ed9\u0f18\u0f19\u0f20-\u0f29\u0f35\u0f37\u0f39\u0f3e\u0f3f\u0f71-\u0f84\u0f86\u0f87\u0f8d-\u0f97\u0f99-\u0fbc\u0fc6\u102b-\u103e\u1040-\u1049\u1056-\u1059\u105e-\u1060\u1062-\u1064\u1067-\u106d\u1071-\u1074\u1082-\u108d\u108f-\u109d\u135d-\u135f\u1369-\u1371\u1712-\u1714\u1732-\u1734\u1752\u1753\u1772\u1773\u17b4-\u17d3\u17dd\u17e0-\u17e9\u180b-\u180d\u1810-\u1819\u18a9\u1920-\u192b\u1930-\u193b\u1946-\u194f\u19d0-\u19da\u1a17-\u1a1b\u1a55-\u1a5e\u1a60-\u1a7c\u1a7f-\u1a89\u1a90-\u1a99\u1ab0-\u1abd\u1b00-\u1b04\u1b34-\u1b44\u1b50-\u1b59\u1b6b-\u1b73\u1b80-\u1b82\u1ba1-\u1bad\u1bb0-\u1bb9\u1be6-\u1bf3\u1c24-\u1c37\u1c40-\u1c49\u1c50-\u1c59\u1cd0-\u1cd2\u1cd4-\u1ce8\u1ced\u1cf2-\u1cf4\u1cf8\u1cf9\u1dc0-\u1df5\u1dfb-\u1dff\u203f\u2040\u2054\u20d0-\u20dc\u20e1\u20e5-\u20f0\u2cef-\u2cf1\u2d7f\u2de0-\u2dff\u302a-\u302f\u3099\u309a\ua620-\ua629\ua66f\ua674-\ua67d\ua69e\ua69f\ua6f0\ua6f1\ua802\ua806\ua80b\ua823-\ua827\ua880\ua881\ua8b4-\ua8c5\ua8d0-\ua8d9\ua8e0-\ua8f1\ua900-\ua909\ua926-\ua92d\ua947-\ua953\ua980-\ua983\ua9b3-\ua9c0\ua9d0-\ua9d9\ua9e5\ua9f0-\ua9f9\uaa29-\uaa36\uaa43\uaa4c\uaa4d\uaa50-\uaa59\uaa7b-\uaa7d\uaab0\uaab2-\uaab4\uaab7\uaab8\uaabe\uaabf\uaac1\uaaeb-\uaaef\uaaf5\uaaf6\uabe3-\uabea\uabec\uabed\uabf0-\uabf9\ufb1e\ufe00-\ufe0f\ufe20-\ufe2f\ufe33\ufe34\ufe4d-\ufe4f\uff10-\uff19\uff3f"

	var nonASCIIidentifierStart = new RegExp("[" + nonASCIIidentifierStartChars + "]")
	var nonASCIIidentifier = new RegExp("[" + nonASCIIidentifierStartChars + nonASCIIidentifierChars + "]")

	nonASCIIidentifierStartChars = nonASCIIidentifierChars = null

	// These are a run-length and offset encoded representation of the
	// >0xffff code points that are a valid part of identifiers. The
	// offset starts at 0x10000, and each pair of numbers represents an
	// offset to the next range, and then a size of the range. They were
	// generated by bin/generate-identifier-regex.js
	var astralIdentifierStartCodes = [0,11,2,25,2,18,2,1,2,14,3,13,35,122,70,52,268,28,4,48,48,31,17,26,6,37,11,29,3,35,5,7,2,4,43,157,19,35,5,35,5,39,9,51,157,310,10,21,11,7,153,5,3,0,2,43,2,1,4,0,3,22,11,22,10,30,66,18,2,1,11,21,11,25,71,55,7,1,65,0,16,3,2,2,2,26,45,28,4,28,36,7,2,27,28,53,11,21,11,18,14,17,111,72,56,50,14,50,785,52,76,44,33,24,27,35,42,34,4,0,13,47,15,3,22,0,2,0,36,17,2,24,85,6,2,0,2,3,2,14,2,9,8,46,39,7,3,1,3,21,2,6,2,1,2,4,4,0,19,0,13,4,159,52,19,3,54,47,21,1,2,0,185,46,42,3,37,47,21,0,60,42,86,25,391,63,32,0,449,56,264,8,2,36,18,0,50,29,881,921,103,110,18,195,2749,1070,4050,582,8634,568,8,30,114,29,19,47,17,3,32,20,6,18,881,68,12,0,67,12,65,0,32,6124,20,754,9486,1,3071,106,6,12,4,8,8,9,5991,84,2,70,2,1,3,0,3,1,3,3,2,11,2,0,2,6,2,64,2,3,3,7,2,6,2,27,2,3,2,4,2,0,4,6,2,339,3,24,2,24,2,30,2,24,2,30,2,24,2,30,2,24,2,30,2,24,2,7,4149,196,60,67,1213,3,2,26,2,1,2,0,3,0,2,9,2,3,2,0,2,0,7,0,5,0,2,0,2,0,2,2,2,1,2,0,3,0,2,0,2,0,2,0,2,0,2,1,2,0,3,3,2,6,2,3,2,3,2,0,2,9,2,16,6,2,2,4,2,16,4421,42710,42,4148,12,221,3,5761,10591,541]
	var astralIdentifierCodes = [509,0,227,0,150,4,294,9,1368,2,2,1,6,3,41,2,5,0,166,1,1306,2,54,14,32,9,16,3,46,10,54,9,7,2,37,13,2,9,52,0,13,2,49,13,10,2,4,9,83,11,7,0,161,11,6,9,7,3,57,0,2,6,3,1,3,2,10,0,11,1,3,6,4,4,193,17,10,9,87,19,13,9,214,6,3,8,28,1,83,16,16,9,82,12,9,9,84,14,5,9,423,9,838,7,2,7,17,9,57,21,2,13,19882,9,135,4,60,6,26,9,1016,45,17,3,19723,1,5319,4,4,5,9,7,3,6,31,3,149,2,1418,49,513,54,5,49,9,0,15,0,23,4,2,14,1361,6,2,16,3,6,2,1,2,4,2214,6,110,6,6,9,792487,239]

	// This has a complexity linear to the value of the code. The
	// assumption is that looking up astral identifier characters is
	// rare.
	function isInAstralSet(code, set) {
	  var pos = 0x10000
	  for (var i = 0; i < set.length; i += 2) {
	    pos += set[i]
	    if (pos > code) return false
	    pos += set[i + 1]
	    if (pos >= code) return true
	  }
	}

	// Test whether a given character code starts an identifier.

	function isIdentifierStart(code, astral) {
	  if (code < 65) return code === 36
	  if (code < 91) return true
	  if (code < 97) return code === 95
	  if (code < 123) return true
	  if (code <= 0xffff) return code >= 0xaa && nonASCIIidentifierStart.test(String.fromCharCode(code))
	  if (astral === false) return false
	  return isInAstralSet(code, astralIdentifierStartCodes)
	}

	// Test whether a given character is part of an identifier.

	function isIdentifierChar(code, astral) {
	  if (code < 48) return code === 36
	  if (code < 58) return true
	  if (code < 65) return false
	  if (code < 91) return true
	  if (code < 97) return code === 95
	  if (code < 123) return true
	  if (code <= 0xffff) return code >= 0xaa && nonASCIIidentifier.test(String.fromCharCode(code))
	  if (astral === false) return false
	  return isInAstralSet(code, astralIdentifierStartCodes) || isInAstralSet(code, astralIdentifierCodes)
	}

	// ## Token types

	// The assignment of fine-grained, information-carrying type objects
	// allows the tokenizer to store the information it has about a
	// token in a way that is very cheap for the parser to look up.

	// All token type variables start with an underscore, to make them
	// easy to recognize.

	// The `beforeExpr` property is used to disambiguate between regular
	// expressions and divisions. It is set on all token types that can
	// be followed by an expression (thus, a slash after them would be a
	// regular expression).
	//
	// The `startsExpr` property is used to check if the token ends a
	// `yield` expression. It is set on all token types that either can
	// directly start an expression (like a quotation mark) or can
	// continue an expression (like the body of a string).
	//
	// `isLoop` marks a keyword as starting a loop, which is important
	// to know when parsing a label, in order to allow or disallow
	// continue jumps to that label.

	var TokenType = function TokenType(label, conf) {
	  if ( conf === void 0 ) conf = {};

	  this.label = label
	  this.keyword = conf.keyword
	  this.beforeExpr = !!conf.beforeExpr
	  this.startsExpr = !!conf.startsExpr
	  this.isLoop = !!conf.isLoop
	  this.isAssign = !!conf.isAssign
	  this.prefix = !!conf.prefix
	  this.postfix = !!conf.postfix
	  this.binop = conf.binop || null
	  this.updateContext = null
	};

	function binop(name, prec) {
	  return new TokenType(name, {beforeExpr: true, binop: prec})
	}
	var beforeExpr = {beforeExpr: true};
	var startsExpr = {startsExpr: true};
	// Map keyword names to token types.

	var keywordTypes = {}

	// Succinct definitions of keyword token types
	function kw(name, options) {
	  if ( options === void 0 ) options = {};

	  options.keyword = name
	  return keywordTypes[name] = new TokenType(name, options)
	}

	var tt = {
	  num: new TokenType("num", startsExpr),
	  regexp: new TokenType("regexp", startsExpr),
	  string: new TokenType("string", startsExpr),
	  name: new TokenType("name", startsExpr),
	  eof: new TokenType("eof"),

	  // Punctuation token types.
	  bracketL: new TokenType("[", {beforeExpr: true, startsExpr: true}),
	  bracketR: new TokenType("]"),
	  braceL: new TokenType("{", {beforeExpr: true, startsExpr: true}),
	  braceR: new TokenType("}"),
	  parenL: new TokenType("(", {beforeExpr: true, startsExpr: true}),
	  parenR: new TokenType(")"),
	  comma: new TokenType(",", beforeExpr),
	  semi: new TokenType(";", beforeExpr),
	  colon: new TokenType(":", beforeExpr),
	  dot: new TokenType("."),
	  question: new TokenType("?", beforeExpr),
	  arrow: new TokenType("=>", beforeExpr),
	  template: new TokenType("template"),
	  ellipsis: new TokenType("...", beforeExpr),
	  backQuote: new TokenType("`", startsExpr),
	  dollarBraceL: new TokenType("${", {beforeExpr: true, startsExpr: true}),

	  // Operators. These carry several kinds of properties to help the
	  // parser use them properly (the presence of these properties is
	  // what categorizes them as operators).
	  //
	  // `binop`, when present, specifies that this operator is a binary
	  // operator, and will refer to its precedence.
	  //
	  // `prefix` and `postfix` mark the operator as a prefix or postfix
	  // unary operator.
	  //
	  // `isAssign` marks all of `=`, `+=`, `-=` etcetera, which act as
	  // binary operators with a very low precedence, that should result
	  // in AssignmentExpression nodes.

	  eq: new TokenType("=", {beforeExpr: true, isAssign: true}),
	  assign: new TokenType("_=", {beforeExpr: true, isAssign: true}),
	  incDec: new TokenType("++/--", {prefix: true, postfix: true, startsExpr: true}),
	  prefix: new TokenType("prefix", {beforeExpr: true, prefix: true, startsExpr: true}),
	  logicalOR: binop("||", 1),
	  logicalAND: binop("&&", 2),
	  bitwiseOR: binop("|", 3),
	  bitwiseXOR: binop("^", 4),
	  bitwiseAND: binop("&", 5),
	  equality: binop("==/!=", 6),
	  relational: binop("</>", 7),
	  bitShift: binop("<</>>", 8),
	  plusMin: new TokenType("+/-", {beforeExpr: true, binop: 9, prefix: true, startsExpr: true}),
	  modulo: binop("%", 10),
	  star: binop("*", 10),
	  slash: binop("/", 10),
	  starstar: new TokenType("**", {beforeExpr: true}),

	  // Keyword token types.
	  _break: kw("break"),
	  _case: kw("case", beforeExpr),
	  _catch: kw("catch"),
	  _continue: kw("continue"),
	  _debugger: kw("debugger"),
	  _default: kw("default", beforeExpr),
	  _do: kw("do", {isLoop: true, beforeExpr: true}),
	  _else: kw("else", beforeExpr),
	  _finally: kw("finally"),
	  _for: kw("for", {isLoop: true}),
	  _function: kw("function", startsExpr),
	  _if: kw("if"),
	  _return: kw("return", beforeExpr),
	  _switch: kw("switch"),
	  _throw: kw("throw", beforeExpr),
	  _try: kw("try"),
	  _var: kw("var"),
	  _const: kw("const"),
	  _while: kw("while", {isLoop: true}),
	  _with: kw("with"),
	  _new: kw("new", {beforeExpr: true, startsExpr: true}),
	  _this: kw("this", startsExpr),
	  _super: kw("super", startsExpr),
	  _class: kw("class"),
	  _extends: kw("extends", beforeExpr),
	  _export: kw("export"),
	  _import: kw("import"),
	  _null: kw("null", startsExpr),
	  _true: kw("true", startsExpr),
	  _false: kw("false", startsExpr),
	  _in: kw("in", {beforeExpr: true, binop: 7}),
	  _instanceof: kw("instanceof", {beforeExpr: true, binop: 7}),
	  _typeof: kw("typeof", {beforeExpr: true, prefix: true, startsExpr: true}),
	  _void: kw("void", {beforeExpr: true, prefix: true, startsExpr: true}),
	  _delete: kw("delete", {beforeExpr: true, prefix: true, startsExpr: true})
	}

	// Matches a whole line break (where CRLF is considered a single
	// line break). Used to count lines.

	var lineBreak = /\r\n?|\n|\u2028|\u2029/
	var lineBreakG = new RegExp(lineBreak.source, "g")

	function isNewLine(code) {
	  return code === 10 || code === 13 || code === 0x2028 || code === 0x2029
	}

	var nonASCIIwhitespace = /[\u1680\u180e\u2000-\u200a\u202f\u205f\u3000\ufeff]/

	var skipWhiteSpace = /(?:\s|\/\/.*|\/\*[^]*?\*\/)*/g

	function isArray(obj) {
	  return Object.prototype.toString.call(obj) === "[object Array]"
	}

	// Checks if an object has a property.

	function has(obj, propName) {
	  return Object.prototype.hasOwnProperty.call(obj, propName)
	}

	// These are used when `options.locations` is on, for the
	// `startLoc` and `endLoc` properties.

	var Position = function Position(line, col) {
	  this.line = line
	  this.column = col
	};

	Position.prototype.offset = function offset (n) {
	  return new Position(this.line, this.column + n)
	};

	var SourceLocation = function SourceLocation(p, start, end) {
	  this.start = start
	  this.end = end
	  if (p.sourceFile !== null) this.source = p.sourceFile
	};

	// The `getLineInfo` function is mostly useful when the
	// `locations` option is off (for performance reasons) and you
	// want to find the line/column position for a given character
	// offset. `input` should be the code string that the offset refers
	// into.

	function getLineInfo(input, offset) {
	  for (var line = 1, cur = 0;;) {
	    lineBreakG.lastIndex = cur
	    var match = lineBreakG.exec(input)
	    if (match && match.index < offset) {
	      ++line
	      cur = match.index + match[0].length
	    } else {
	      return new Position(line, offset - cur)
	    }
	  }
	}

	// A second optional argument can be given to further configure
	// the parser process. These options are recognized:

	var defaultOptions = {
	  // `ecmaVersion` indicates the ECMAScript version to parse. Must
	  // be either 3, 5, 6 (2015), 7 (2016), or 8 (2017). This influences support
	  // for strict mode, the set of reserved words, and support for
	  // new syntax features. The default is 7.
	  ecmaVersion: 7,
	  // `sourceType` indicates the mode the code should be parsed in.
	  // Can be either `"script"` or `"module"`. This influences global
	  // strict mode and parsing of `import` and `export` declarations.
	  sourceType: "script",
	  // `onInsertedSemicolon` can be a callback that will be called
	  // when a semicolon is automatically inserted. It will be passed
	  // th position of the comma as an offset, and if `locations` is
	  // enabled, it is given the location as a `{line, column}` object
	  // as second argument.
	  onInsertedSemicolon: null,
	  // `onTrailingComma` is similar to `onInsertedSemicolon`, but for
	  // trailing commas.
	  onTrailingComma: null,
	  // By default, reserved words are only enforced if ecmaVersion >= 5.
	  // Set `allowReserved` to a boolean value to explicitly turn this on
	  // an off. When this option has the value "never", reserved words
	  // and keywords can also not be used as property names.
	  allowReserved: null,
	  // When enabled, a return at the top level is not considered an
	  // error.
	  allowReturnOutsideFunction: false,
	  // When enabled, import/export statements are not constrained to
	  // appearing at the top of the program.
	  allowImportExportEverywhere: false,
	  // When enabled, hashbang directive in the beginning of file
	  // is allowed and treated as a line comment.
	  allowHashBang: false,
	  // When `locations` is on, `loc` properties holding objects with
	  // `start` and `end` properties in `{line, column}` form (with
	  // line being 1-based and column 0-based) will be attached to the
	  // nodes.
	  locations: false,
	  // A function can be passed as `onToken` option, which will
	  // cause Acorn to call that function with object in the same
	  // format as tokens returned from `tokenizer().getToken()`. Note
	  // that you are not allowed to call the parser from the
	  // callback—that will corrupt its internal state.
	  onToken: null,
	  // A function can be passed as `onComment` option, which will
	  // cause Acorn to call that function with `(block, text, start,
	  // end)` parameters whenever a comment is skipped. `block` is a
	  // boolean indicating whether this is a block (`/* */`) comment,
	  // `text` is the content of the comment, and `start` and `end` are
	  // character offsets that denote the start and end of the comment.
	  // When the `locations` option is on, two more parameters are
	  // passed, the full `{line, column}` locations of the start and
	  // end of the comments. Note that you are not allowed to call the
	  // parser from the callback—that will corrupt its internal state.
	  onComment: null,
	  // Nodes have their start and end characters offsets recorded in
	  // `start` and `end` properties (directly on the node, rather than
	  // the `loc` object, which holds line/column data. To also add a
	  // [semi-standardized][range] `range` property holding a `[start,
	  // end]` array with the same numbers, set the `ranges` option to
	  // `true`.
	  //
	  // [range]: https://bugzilla.mozilla.org/show_bug.cgi?id=745678
	  ranges: false,
	  // It is possible to parse multiple files into a single AST by
	  // passing the tree produced by parsing the first file as
	  // `program` option in subsequent parses. This will add the
	  // toplevel forms of the parsed file to the `Program` (top) node
	  // of an existing parse tree.
	  program: null,
	  // When `locations` is on, you can pass this to record the source
	  // file in every node's `loc` object.
	  sourceFile: null,
	  // This value, if given, is stored in every node, whether
	  // `locations` is on or off.
	  directSourceFile: null,
	  // When enabled, parenthesized expressions are represented by
	  // (non-standard) ParenthesizedExpression nodes
	  preserveParens: false,
	  plugins: {}
	}

	// Interpret and default an options object

	function getOptions(opts) {
	  var options = {}

	  for (var opt in defaultOptions)
	    options[opt] = opts && has(opts, opt) ? opts[opt] : defaultOptions[opt]

	  if (options.ecmaVersion >= 2015)
	    options.ecmaVersion -= 2009

	  if (options.allowReserved == null)
	    options.allowReserved = options.ecmaVersion < 5

	  if (isArray(options.onToken)) {
	    var tokens = options.onToken
	    options.onToken = function (token) { return tokens.push(token); }
	  }
	  if (isArray(options.onComment))
	    options.onComment = pushComment(options, options.onComment)

	  return options
	}

	function pushComment(options, array) {
	  return function (block, text, start, end, startLoc, endLoc) {
	    var comment = {
	      type: block ? 'Block' : 'Line',
	      value: text,
	      start: start,
	      end: end
	    }
	    if (options.locations)
	      comment.loc = new SourceLocation(this, startLoc, endLoc)
	    if (options.ranges)
	      comment.range = [start, end]
	    array.push(comment)
	  }
	}

	// Registered plugins
	var plugins = {}

	function keywordRegexp(words) {
	  return new RegExp("^(" + words.replace(/ /g, "|") + ")$")
	}

	var Parser = function Parser(options, input, startPos) {
	  this.options = options = getOptions(options)
	  this.sourceFile = options.sourceFile
	  this.keywords = keywordRegexp(keywords[options.ecmaVersion >= 6 ? 6 : 5])
	  var reserved = ""
	  if (!options.allowReserved) {
	    for (var v = options.ecmaVersion;; v--)
	      if (reserved = reservedWords[v]) break
	    if (options.sourceType == "module") reserved += " await"
	  }
	  this.reservedWords = keywordRegexp(reserved)
	  var reservedStrict = (reserved ? reserved + " " : "") + reservedWords.strict
	  this.reservedWordsStrict = keywordRegexp(reservedStrict)
	  this.reservedWordsStrictBind = keywordRegexp(reservedStrict + " " + reservedWords.strictBind)
	  this.input = String(input)

	  // Used to signal to callers of `readWord1` whether the word
	  // contained any escape sequences. This is needed because words with
	  // escape sequences must not be interpreted as keywords.
	  this.containsEsc = false

	  // Load plugins
	  this.loadPlugins(options.plugins)

	  // Set up token state

	  // The current position of the tokenizer in the input.
	  if (startPos) {
	    this.pos = startPos
	    this.lineStart = this.input.lastIndexOf("\n", startPos - 1) + 1
	    this.curLine = this.input.slice(0, this.lineStart).split(lineBreak).length
	  } else {
	    this.pos = this.lineStart = 0
	    this.curLine = 1
	  }

	  // Properties of the current token:
	  // Its type
	  this.type = tt.eof
	  // For tokens that include more information than their type, the value
	  this.value = null
	  // Its start and end offset
	  this.start = this.end = this.pos
	  // And, if locations are used, the {line, column} object
	  // corresponding to those offsets
	  this.startLoc = this.endLoc = this.curPosition()

	  // Position information for the previous token
	  this.lastTokEndLoc = this.lastTokStartLoc = null
	  this.lastTokStart = this.lastTokEnd = this.pos

	  // The context stack is used to superficially track syntactic
	  // context to predict whether a regular expression is allowed in a
	  // given position.
	  this.context = this.initialContext()
	  this.exprAllowed = true

	  // Figure out if it's a module code.
	  this.strict = this.inModule = options.sourceType === "module"

	  // Used to signify the start of a potential arrow function
	  this.potentialArrowAt = -1

	  // Flags to track whether we are in a function, a generator, an async function.
	  this.inFunction = this.inGenerator = this.inAsync = false
	  // Positions to delayed-check that yield/await does not exist in default parameters.
	  this.yieldPos = this.awaitPos = 0
	  // Labels in scope.
	  this.labels = []

	  // If enabled, skip leading hashbang line.
	  if (this.pos === 0 && options.allowHashBang && this.input.slice(0, 2) === '#!')
	    this.skipLineComment(2)
	};

	// DEPRECATED Kept for backwards compatibility until 3.0 in case a plugin uses them
	Parser.prototype.isKeyword = function isKeyword (word) { return this.keywords.test(word) };
	Parser.prototype.isReservedWord = function isReservedWord (word) { return this.reservedWords.test(word) };

	Parser.prototype.extend = function extend (name, f) {
	  this[name] = f(this[name])
	};

	Parser.prototype.loadPlugins = function loadPlugins (pluginConfigs) {
	    var this$1 = this;

	  for (var name in pluginConfigs) {
	    var plugin = plugins[name]
	    if (!plugin) throw new Error("Plugin '" + name + "' not found")
	    plugin(this$1, pluginConfigs[name])
	  }
	};

	Parser.prototype.parse = function parse () {
	  var node = this.options.program || this.startNode()
	  this.nextToken()
	  return this.parseTopLevel(node)
	};

	var pp = Parser.prototype

	// ## Parser utilities

	// Test whether a statement node is the string literal `"use strict"`.

	pp.isUseStrict = function(stmt) {
	  return this.options.ecmaVersion >= 5 && stmt.type === "ExpressionStatement" &&
	    stmt.expression.type === "Literal" &&
	    stmt.expression.raw.slice(1, -1) === "use strict"
	}

	// Predicate that tests whether the next token is of the given
	// type, and if yes, consumes it as a side effect.

	pp.eat = function(type) {
	  if (this.type === type) {
	    this.next()
	    return true
	  } else {
	    return false
	  }
	}

	// Tests whether parsed token is a contextual keyword.

	pp.isContextual = function(name) {
	  return this.type === tt.name && this.value === name
	}

	// Consumes contextual keyword if possible.

	pp.eatContextual = function(name) {
	  return this.value === name && this.eat(tt.name)
	}

	// Asserts that following token is given contextual keyword.

	pp.expectContextual = function(name) {
	  if (!this.eatContextual(name)) this.unexpected()
	}

	// Test whether a semicolon can be inserted at the current position.

	pp.canInsertSemicolon = function() {
	  return this.type === tt.eof ||
	    this.type === tt.braceR ||
	    lineBreak.test(this.input.slice(this.lastTokEnd, this.start))
	}

	pp.insertSemicolon = function() {
	  if (this.canInsertSemicolon()) {
	    if (this.options.onInsertedSemicolon)
	      this.options.onInsertedSemicolon(this.lastTokEnd, this.lastTokEndLoc)
	    return true
	  }
	}

	// Consume a semicolon, or, failing that, see if we are allowed to
	// pretend that there is a semicolon at this position.

	pp.semicolon = function() {
	  if (!this.eat(tt.semi) && !this.insertSemicolon()) this.unexpected()
	}

	pp.afterTrailingComma = function(tokType, notNext) {
	  if (this.type == tokType) {
	    if (this.options.onTrailingComma)
	      this.options.onTrailingComma(this.lastTokStart, this.lastTokStartLoc)
	    if (!notNext)
	      this.next()
	    return true
	  }
	}

	// Expect a token of a given type. If found, consume it, otherwise,
	// raise an unexpected token error.

	pp.expect = function(type) {
	  this.eat(type) || this.unexpected()
	}

	// Raise an unexpected token error.

	pp.unexpected = function(pos) {
	  this.raise(pos != null ? pos : this.start, "Unexpected token")
	}

	var DestructuringErrors = function DestructuringErrors() {
	  this.shorthandAssign = 0
	  this.trailingComma = 0
	};

	pp.checkPatternErrors = function(refDestructuringErrors, andThrow) {
	  var trailing = refDestructuringErrors && refDestructuringErrors.trailingComma
	  if (!andThrow) return !!trailing
	  if (trailing) this.raise(trailing, "Comma is not permitted after the rest element")
	}

	pp.checkExpressionErrors = function(refDestructuringErrors, andThrow) {
	  var pos = refDestructuringErrors && refDestructuringErrors.shorthandAssign
	  if (!andThrow) return !!pos
	  if (pos) this.raise(pos, "Shorthand property assignments are valid only in destructuring patterns")
	}

	pp.checkYieldAwaitInDefaultParams = function() {
	  if (this.yieldPos && (!this.awaitPos || this.yieldPos < this.awaitPos))
	    this.raise(this.yieldPos, "Yield expression cannot be a default value")
	  if (this.awaitPos)
	    this.raise(this.awaitPos, "Await expression cannot be a default value")
	}

	var pp$1 = Parser.prototype

	// ### Statement parsing

	// Parse a program. Initializes the parser, reads any number of
	// statements, and wraps them in a Program node.  Optionally takes a
	// `program` argument.  If present, the statements will be appended
	// to its body instead of creating a new node.

	pp$1.parseTopLevel = function(node) {
	  var this$1 = this;

	  var first = true, exports = {}
	  if (!node.body) node.body = []
	  while (this.type !== tt.eof) {
	    var stmt = this$1.parseStatement(true, true, exports)
	    node.body.push(stmt)
	    if (first) {
	      if (this$1.isUseStrict(stmt)) this$1.setStrict(true)
	      first = false
	    }
	  }
	  this.next()
	  if (this.options.ecmaVersion >= 6) {
	    node.sourceType = this.options.sourceType
	  }
	  return this.finishNode(node, "Program")
	}

	var loopLabel = {kind: "loop"};
	var switchLabel = {kind: "switch"};
	pp$1.isLet = function() {
	  if (this.type !== tt.name || this.options.ecmaVersion < 6 || this.value != "let") return false
	  skipWhiteSpace.lastIndex = this.pos
	  var skip = skipWhiteSpace.exec(this.input)
	  var next = this.pos + skip[0].length, nextCh = this.input.charCodeAt(next)
	  if (nextCh === 91 || nextCh == 123) return true // '{' and '['
	  if (isIdentifierStart(nextCh, true)) {
	    for (var pos = next + 1; isIdentifierChar(this.input.charCodeAt(pos), true); ++pos) {}
	    var ident = this.input.slice(next, pos)
	    if (!this.isKeyword(ident)) return true
	  }
	  return false
	}

	// check 'async [no LineTerminator here] function'
	// - 'async /*foo*/ function' is OK.
	// - 'async /*\n*/ function' is invalid.
	pp$1.isAsyncFunction = function() {
	  if (this.type !== tt.name || this.options.ecmaVersion < 8 || this.value != "async")
	    return false

	  skipWhiteSpace.lastIndex = this.pos
	  var skip = skipWhiteSpace.exec(this.input)
	  var next = this.pos + skip[0].length
	  return !lineBreak.test(this.input.slice(this.pos, next)) &&
	    this.input.slice(next, next + 8) === "function" &&
	    (next + 8 == this.input.length || !isIdentifierChar(this.input.charAt(next + 8)))
	}

	// Parse a single statement.
	//
	// If expecting a statement and finding a slash operator, parse a
	// regular expression literal. This is to handle cases like
	// `if (foo) /blah/.exec(foo)`, where looking at the previous token
	// does not help.

	pp$1.parseStatement = function(declaration, topLevel, exports) {
	  var starttype = this.type, node = this.startNode(), kind

	  if (this.isLet()) {
	    starttype = tt._var
	    kind = "let"
	  }

	  // Most types of statements are recognized by the keyword they
	  // start with. Many are trivial to parse, some require a bit of
	  // complexity.

	  switch (starttype) {
	  case tt._break: case tt._continue: return this.parseBreakContinueStatement(node, starttype.keyword)
	  case tt._debugger: return this.parseDebuggerStatement(node)
	  case tt._do: return this.parseDoStatement(node)
	  case tt._for: return this.parseForStatement(node)
	  case tt._function:
	    if (!declaration && this.options.ecmaVersion >= 6) this.unexpected()
	    return this.parseFunctionStatement(node, false)
	  case tt._class:
	    if (!declaration) this.unexpected()
	    return this.parseClass(node, true)
	  case tt._if: return this.parseIfStatement(node)
	  case tt._return: return this.parseReturnStatement(node)
	  case tt._switch: return this.parseSwitchStatement(node)
	  case tt._throw: return this.parseThrowStatement(node)
	  case tt._try: return this.parseTryStatement(node)
	  case tt._const: case tt._var:
	    kind = kind || this.value
	    if (!declaration && kind != "var") this.unexpected()
	    return this.parseVarStatement(node, kind)
	  case tt._while: return this.parseWhileStatement(node)
	  case tt._with: return this.parseWithStatement(node)
	  case tt.braceL: return this.parseBlock()
	  case tt.semi: return this.parseEmptyStatement(node)
	  case tt._export:
	  case tt._import:
	    if (!this.options.allowImportExportEverywhere) {
	      if (!topLevel)
	        this.raise(this.start, "'import' and 'export' may only appear at the top level")
	      if (!this.inModule)
	        this.raise(this.start, "'import' and 'export' may appear only with 'sourceType: module'")
	    }
	    return starttype === tt._import ? this.parseImport(node) : this.parseExport(node, exports)

	    // If the statement does not start with a statement keyword or a
	    // brace, it's an ExpressionStatement or LabeledStatement. We
	    // simply start parsing an expression, and afterwards, if the
	    // next token is a colon and the expression was a simple
	    // Identifier node, we switch to interpreting it as a label.
	  default:
	    if (this.isAsyncFunction() && declaration) {
	      this.next()
	      return this.parseFunctionStatement(node, true)
	    }

	    var maybeName = this.value, expr = this.parseExpression()
	    if (starttype === tt.name && expr.type === "Identifier" && this.eat(tt.colon))
	      return this.parseLabeledStatement(node, maybeName, expr)
	    else return this.parseExpressionStatement(node, expr)
	  }
	}

	pp$1.parseBreakContinueStatement = function(node, keyword) {
	  var this$1 = this;

	  var isBreak = keyword == "break"
	  this.next()
	  if (this.eat(tt.semi) || this.insertSemicolon()) node.label = null
	  else if (this.type !== tt.name) this.unexpected()
	  else {
	    node.label = this.parseIdent()
	    this.semicolon()
	  }

	  // Verify that there is an actual destination to break or
	  // continue to.
	  for (var i = 0; i < this.labels.length; ++i) {
	    var lab = this$1.labels[i]
	    if (node.label == null || lab.name === node.label.name) {
	      if (lab.kind != null && (isBreak || lab.kind === "loop")) break
	      if (node.label && isBreak) break
	    }
	  }
	  if (i === this.labels.length) this.raise(node.start, "Unsyntactic " + keyword)
	  return this.finishNode(node, isBreak ? "BreakStatement" : "ContinueStatement")
	}

	pp$1.parseDebuggerStatement = function(node) {
	  this.next()
	  this.semicolon()
	  return this.finishNode(node, "DebuggerStatement")
	}

	pp$1.parseDoStatement = function(node) {
	  this.next()
	  this.labels.push(loopLabel)
	  node.body = this.parseStatement(false)
	  this.labels.pop()
	  this.expect(tt._while)
	  node.test = this.parseParenExpression()
	  if (this.options.ecmaVersion >= 6)
	    this.eat(tt.semi)
	  else
	    this.semicolon()
	  return this.finishNode(node, "DoWhileStatement")
	}

	// Disambiguating between a `for` and a `for`/`in` or `for`/`of`
	// loop is non-trivial. Basically, we have to parse the init `var`
	// statement or expression, disallowing the `in` operator (see
	// the second parameter to `parseExpression`), and then check
	// whether the next token is `in` or `of`. When there is no init
	// part (semicolon immediately after the opening parenthesis), it
	// is a regular `for` loop.

	pp$1.parseForStatement = function(node) {
	  this.next()
	  this.labels.push(loopLabel)
	  this.expect(tt.parenL)
	  if (this.type === tt.semi) return this.parseFor(node, null)
	  var isLet = this.isLet()
	  if (this.type === tt._var || this.type === tt._const || isLet) {
	    var init$1 = this.startNode(), kind = isLet ? "let" : this.value
	    this.next()
	    this.parseVar(init$1, true, kind)
	    this.finishNode(init$1, "VariableDeclaration")
	    if ((this.type === tt._in || (this.options.ecmaVersion >= 6 && this.isContextual("of"))) && init$1.declarations.length === 1 &&
	        !(kind !== "var" && init$1.declarations[0].init))
	      return this.parseForIn(node, init$1)
	    return this.parseFor(node, init$1)
	  }
	  var refDestructuringErrors = new DestructuringErrors
	  var init = this.parseExpression(true, refDestructuringErrors)
	  if (this.type === tt._in || (this.options.ecmaVersion >= 6 && this.isContextual("of"))) {
	    this.checkPatternErrors(refDestructuringErrors, true)
	    this.toAssignable(init)
	    this.checkLVal(init)
	    return this.parseForIn(node, init)
	  } else {
	    this.checkExpressionErrors(refDestructuringErrors, true)
	  }
	  return this.parseFor(node, init)
	}

	pp$1.parseFunctionStatement = function(node, isAsync) {
	  this.next()
	  return this.parseFunction(node, true, false, isAsync)
	}

	pp$1.isFunction = function() {
	  return this.type === tt._function || this.isAsyncFunction()
	}

	pp$1.parseIfStatement = function(node) {
	  this.next()
	  node.test = this.parseParenExpression()
	  // allow function declarations in branches, but only in non-strict mode
	  node.consequent = this.parseStatement(!this.strict && this.isFunction())
	  node.alternate = this.eat(tt._else) ? this.parseStatement(!this.strict && this.isFunction()) : null
	  return this.finishNode(node, "IfStatement")
	}

	pp$1.parseReturnStatement = function(node) {
	  if (!this.inFunction && !this.options.allowReturnOutsideFunction)
	    this.raise(this.start, "'return' outside of function")
	  this.next()

	  // In `return` (and `break`/`continue`), the keywords with
	  // optional arguments, we eagerly look for a semicolon or the
	  // possibility to insert one.

	  if (this.eat(tt.semi) || this.insertSemicolon()) node.argument = null
	  else { node.argument = this.parseExpression(); this.semicolon() }
	  return this.finishNode(node, "ReturnStatement")
	}

	pp$1.parseSwitchStatement = function(node) {
	  var this$1 = this;

	  this.next()
	  node.discriminant = this.parseParenExpression()
	  node.cases = []
	  this.expect(tt.braceL)
	  this.labels.push(switchLabel)

	  // Statements under must be grouped (by label) in SwitchCase
	  // nodes. `cur` is used to keep the node that we are currently
	  // adding statements to.

	  for (var cur, sawDefault = false; this.type != tt.braceR;) {
	    if (this$1.type === tt._case || this$1.type === tt._default) {
	      var isCase = this$1.type === tt._case
	      if (cur) this$1.finishNode(cur, "SwitchCase")
	      node.cases.push(cur = this$1.startNode())
	      cur.consequent = []
	      this$1.next()
	      if (isCase) {
	        cur.test = this$1.parseExpression()
	      } else {
	        if (sawDefault) this$1.raiseRecoverable(this$1.lastTokStart, "Multiple default clauses")
	        sawDefault = true
	        cur.test = null
	      }
	      this$1.expect(tt.colon)
	    } else {
	      if (!cur) this$1.unexpected()
	      cur.consequent.push(this$1.parseStatement(true))
	    }
	  }
	  if (cur) this.finishNode(cur, "SwitchCase")
	  this.next() // Closing brace
	  this.labels.pop()
	  return this.finishNode(node, "SwitchStatement")
	}

	pp$1.parseThrowStatement = function(node) {
	  this.next()
	  if (lineBreak.test(this.input.slice(this.lastTokEnd, this.start)))
	    this.raise(this.lastTokEnd, "Illegal newline after throw")
	  node.argument = this.parseExpression()
	  this.semicolon()
	  return this.finishNode(node, "ThrowStatement")
	}

	// Reused empty array added for node fields that are always empty.

	var empty = []

	pp$1.parseTryStatement = function(node) {
	  this.next()
	  node.block = this.parseBlock()
	  node.handler = null
	  if (this.type === tt._catch) {
	    var clause = this.startNode()
	    this.next()
	    this.expect(tt.parenL)
	    clause.param = this.parseBindingAtom()
	    this.checkLVal(clause.param, true)
	    this.expect(tt.parenR)
	    clause.body = this.parseBlock()
	    node.handler = this.finishNode(clause, "CatchClause")
	  }
	  node.finalizer = this.eat(tt._finally) ? this.parseBlock() : null
	  if (!node.handler && !node.finalizer)
	    this.raise(node.start, "Missing catch or finally clause")
	  return this.finishNode(node, "TryStatement")
	}

	pp$1.parseVarStatement = function(node, kind) {
	  this.next()
	  this.parseVar(node, false, kind)
	  this.semicolon()
	  return this.finishNode(node, "VariableDeclaration")
	}

	pp$1.parseWhileStatement = function(node) {
	  this.next()
	  node.test = this.parseParenExpression()
	  this.labels.push(loopLabel)
	  node.body = this.parseStatement(false)
	  this.labels.pop()
	  return this.finishNode(node, "WhileStatement")
	}

	pp$1.parseWithStatement = function(node) {
	  if (this.strict) this.raise(this.start, "'with' in strict mode")
	  this.next()
	  node.object = this.parseParenExpression()
	  node.body = this.parseStatement(false)
	  return this.finishNode(node, "WithStatement")
	}

	pp$1.parseEmptyStatement = function(node) {
	  this.next()
	  return this.finishNode(node, "EmptyStatement")
	}

	pp$1.parseLabeledStatement = function(node, maybeName, expr) {
	  var this$1 = this;

	  for (var i = 0; i < this.labels.length; ++i)
	    if (this$1.labels[i].name === maybeName) this$1.raise(expr.start, "Label '" + maybeName + "' is already declared")
	  var kind = this.type.isLoop ? "loop" : this.type === tt._switch ? "switch" : null
	  for (var i$1 = this.labels.length - 1; i$1 >= 0; i$1--) {
	    var label = this$1.labels[i$1]
	    if (label.statementStart == node.start) {
	      label.statementStart = this$1.start
	      label.kind = kind
	    } else break
	  }
	  this.labels.push({name: maybeName, kind: kind, statementStart: this.start})
	  node.body = this.parseStatement(true)
	  this.labels.pop()
	  node.label = expr
	  return this.finishNode(node, "LabeledStatement")
	}

	pp$1.parseExpressionStatement = function(node, expr) {
	  node.expression = expr
	  this.semicolon()
	  return this.finishNode(node, "ExpressionStatement")
	}

	// Parse a semicolon-enclosed block of statements, handling `"use
	// strict"` declarations when `allowStrict` is true (used for
	// function bodies).

	pp$1.parseBlock = function(allowStrict) {
	  var this$1 = this;

	  var node = this.startNode(), first = true, oldStrict
	  node.body = []
	  this.expect(tt.braceL)
	  while (!this.eat(tt.braceR)) {
	    var stmt = this$1.parseStatement(true)
	    node.body.push(stmt)
	    if (first && allowStrict && this$1.isUseStrict(stmt)) {
	      oldStrict = this$1.strict
	      this$1.setStrict(this$1.strict = true)
	    }
	    first = false
	  }
	  if (oldStrict === false) this.setStrict(false)
	  return this.finishNode(node, "BlockStatement")
	}

	// Parse a regular `for` loop. The disambiguation code in
	// `parseStatement` will already have parsed the init statement or
	// expression.

	pp$1.parseFor = function(node, init) {
	  node.init = init
	  this.expect(tt.semi)
	  node.test = this.type === tt.semi ? null : this.parseExpression()
	  this.expect(tt.semi)
	  node.update = this.type === tt.parenR ? null : this.parseExpression()
	  this.expect(tt.parenR)
	  node.body = this.parseStatement(false)
	  this.labels.pop()
	  return this.finishNode(node, "ForStatement")
	}

	// Parse a `for`/`in` and `for`/`of` loop, which are almost
	// same from parser's perspective.

	pp$1.parseForIn = function(node, init) {
	  var type = this.type === tt._in ? "ForInStatement" : "ForOfStatement"
	  this.next()
	  node.left = init
	  node.right = this.parseExpression()
	  this.expect(tt.parenR)
	  node.body = this.parseStatement(false)
	  this.labels.pop()
	  return this.finishNode(node, type)
	}

	// Parse a list of variable declarations.

	pp$1.parseVar = function(node, isFor, kind) {
	  var this$1 = this;

	  node.declarations = []
	  node.kind = kind
	  for (;;) {
	    var decl = this$1.startNode()
	    this$1.parseVarId(decl)
	    if (this$1.eat(tt.eq)) {
	      decl.init = this$1.parseMaybeAssign(isFor)
	    } else if (kind === "const" && !(this$1.type === tt._in || (this$1.options.ecmaVersion >= 6 && this$1.isContextual("of")))) {
	      this$1.unexpected()
	    } else if (decl.id.type != "Identifier" && !(isFor && (this$1.type === tt._in || this$1.isContextual("of")))) {
	      this$1.raise(this$1.lastTokEnd, "Complex binding patterns require an initialization value")
	    } else {
	      decl.init = null
	    }
	    node.declarations.push(this$1.finishNode(decl, "VariableDeclarator"))
	    if (!this$1.eat(tt.comma)) break
	  }
	  return node
	}

	pp$1.parseVarId = function(decl) {
	  decl.id = this.parseBindingAtom()
	  this.checkLVal(decl.id, true)
	}

	// Parse a function declaration or literal (depending on the
	// `isStatement` parameter).

	pp$1.parseFunction = function(node, isStatement, allowExpressionBody, isAsync) {
	  this.initFunction(node)
	  if (this.options.ecmaVersion >= 6 && !isAsync)
	    node.generator = this.eat(tt.star)
	  if (this.options.ecmaVersion >= 8)
	    node.async = !!isAsync

	  if (isStatement)
	    node.id = this.parseIdent()

	  var oldInGen = this.inGenerator, oldInAsync = this.inAsync, oldYieldPos = this.yieldPos, oldAwaitPos = this.awaitPos
	  this.inGenerator = node.generator
	  this.inAsync = node.async
	  this.yieldPos = 0
	  this.awaitPos = 0

	  if (!isStatement && this.type === tt.name)
	    node.id = this.parseIdent()
	  this.parseFunctionParams(node)
	  this.parseFunctionBody(node, allowExpressionBody)

	  this.inGenerator = oldInGen
	  this.inAsync = oldInAsync
	  this.yieldPos = oldYieldPos
	  this.awaitPos = oldAwaitPos
	  return this.finishNode(node, isStatement ? "FunctionDeclaration" : "FunctionExpression")
	}

	pp$1.parseFunctionParams = function(node) {
	  this.expect(tt.parenL)
	  node.params = this.parseBindingList(tt.parenR, false, this.options.ecmaVersion >= 8, true)
	  this.checkYieldAwaitInDefaultParams()
	}

	// Parse a class declaration or literal (depending on the
	// `isStatement` parameter).

	pp$1.parseClass = function(node, isStatement) {
	  var this$1 = this;

	  this.next()
	  this.parseClassId(node, isStatement)
	  this.parseClassSuper(node)
	  var classBody = this.startNode()
	  var hadConstructor = false
	  classBody.body = []
	  this.expect(tt.braceL)
	  while (!this.eat(tt.braceR)) {
	    if (this$1.eat(tt.semi)) continue
	    var method = this$1.startNode()
	    var isGenerator = this$1.eat(tt.star)
	    var isAsync = false
	    var isMaybeStatic = this$1.type === tt.name && this$1.value === "static"
	    this$1.parsePropertyName(method)
	    method.static = isMaybeStatic && this$1.type !== tt.parenL
	    if (method.static) {
	      if (isGenerator) this$1.unexpected()
	      isGenerator = this$1.eat(tt.star)
	      this$1.parsePropertyName(method)
	    }
	    if (this$1.options.ecmaVersion >= 8 && !isGenerator && !method.computed &&
	        method.key.type === "Identifier" && method.key.name === "async" && this$1.type !== tt.parenL &&
	        !this$1.canInsertSemicolon()) {
	      isAsync = true
	      this$1.parsePropertyName(method)
	    }
	    method.kind = "method"
	    var isGetSet = false
	    if (!method.computed) {
	      var key = method.key;
	      if (!isGenerator && !isAsync && key.type === "Identifier" && this$1.type !== tt.parenL && (key.name === "get" || key.name === "set")) {
	        isGetSet = true
	        method.kind = key.name
	        key = this$1.parsePropertyName(method)
	      }
	      if (!method.static && (key.type === "Identifier" && key.name === "constructor" ||
	          key.type === "Literal" && key.value === "constructor")) {
	        if (hadConstructor) this$1.raise(key.start, "Duplicate constructor in the same class")
	        if (isGetSet) this$1.raise(key.start, "Constructor can't have get/set modifier")
	        if (isGenerator) this$1.raise(key.start, "Constructor can't be a generator")
	        if (isAsync) this$1.raise(key.start, "Constructor can't be an async method")
	        method.kind = "constructor"
	        hadConstructor = true
	      }
	    }
	    this$1.parseClassMethod(classBody, method, isGenerator, isAsync)
	    if (isGetSet) {
	      var paramCount = method.kind === "get" ? 0 : 1
	      if (method.value.params.length !== paramCount) {
	        var start = method.value.start
	        if (method.kind === "get")
	          this$1.raiseRecoverable(start, "getter should have no params")
	        else
	          this$1.raiseRecoverable(start, "setter should have exactly one param")
	      } else {
	        if (method.kind === "set" && method.value.params[0].type === "RestElement")
	          this$1.raiseRecoverable(method.value.params[0].start, "Setter cannot use rest params")
	      }
	    }
	  }
	  node.body = this.finishNode(classBody, "ClassBody")
	  return this.finishNode(node, isStatement ? "ClassDeclaration" : "ClassExpression")
	}

	pp$1.parseClassMethod = function(classBody, method, isGenerator, isAsync) {
	  method.value = this.parseMethod(isGenerator, isAsync)
	  classBody.body.push(this.finishNode(method, "MethodDefinition"))
	}

	pp$1.parseClassId = function(node, isStatement) {
	  node.id = this.type === tt.name ? this.parseIdent() : isStatement ? this.unexpected() : null
	}

	pp$1.parseClassSuper = function(node) {
	  node.superClass = this.eat(tt._extends) ? this.parseExprSubscripts() : null
	}

	// Parses module export declaration.

	pp$1.parseExport = function(node, exports) {
	  var this$1 = this;

	  this.next()
	  // export * from '...'
	  if (this.eat(tt.star)) {
	    this.expectContextual("from")
	    node.source = this.type === tt.string ? this.parseExprAtom() : this.unexpected()
	    this.semicolon()
	    return this.finishNode(node, "ExportAllDeclaration")
	  }
	  if (this.eat(tt._default)) { // export default ...
	    this.checkExport(exports, "default", this.lastTokStart)
	    var parens = this.type == tt.parenL
	    var expr = this.parseMaybeAssign()
	    var needsSemi = true
	    if (!parens && (expr.type == "FunctionExpression" ||
	                    expr.type == "ClassExpression")) {
	      needsSemi = false
	      if (expr.id) {
	        expr.type = expr.type == "FunctionExpression"
	          ? "FunctionDeclaration"
	          : "ClassDeclaration"
	      }
	    }
	    node.declaration = expr
	    if (needsSemi) this.semicolon()
	    return this.finishNode(node, "ExportDefaultDeclaration")
	  }
	  // export var|const|let|function|class ...
	  if (this.shouldParseExportStatement()) {
	    node.declaration = this.parseStatement(true)
	    if (node.declaration.type === "VariableDeclaration")
	      this.checkVariableExport(exports, node.declaration.declarations)
	    else
	      this.checkExport(exports, node.declaration.id.name, node.declaration.id.start)
	    node.specifiers = []
	    node.source = null
	  } else { // export { x, y as z } [from '...']
	    node.declaration = null
	    node.specifiers = this.parseExportSpecifiers(exports)
	    if (this.eatContextual("from")) {
	      node.source = this.type === tt.string ? this.parseExprAtom() : this.unexpected()
	    } else {
	      // check for keywords used as local names
	      for (var i = 0; i < node.specifiers.length; i++) {
	        if (this$1.keywords.test(node.specifiers[i].local.name) || this$1.reservedWords.test(node.specifiers[i].local.name)) {
	          this$1.unexpected(node.specifiers[i].local.start)
	        }
	      }

	      node.source = null
	    }
	    this.semicolon()
	  }
	  return this.finishNode(node, "ExportNamedDeclaration")
	}

	pp$1.checkExport = function(exports, name, pos) {
	  if (!exports) return
	  if (Object.prototype.hasOwnProperty.call(exports, name))
	    this.raiseRecoverable(pos, "Duplicate export '" + name + "'")
	  exports[name] = true
	}

	pp$1.checkPatternExport = function(exports, pat) {
	  var this$1 = this;

	  var type = pat.type
	  if (type == "Identifier")
	    this.checkExport(exports, pat.name, pat.start)
	  else if (type == "ObjectPattern")
	    for (var i = 0; i < pat.properties.length; ++i)
	      this$1.checkPatternExport(exports, pat.properties[i].value)
	  else if (type == "ArrayPattern")
	    for (var i$1 = 0; i$1 < pat.elements.length; ++i$1) {
	      var elt = pat.elements[i$1]
	      if (elt) this$1.checkPatternExport(exports, elt)
	    }
	  else if (type == "AssignmentPattern")
	    this.checkPatternExport(exports, pat.left)
	  else if (type == "ParenthesizedExpression")
	    this.checkPatternExport(exports, pat.expression)
	}

	pp$1.checkVariableExport = function(exports, decls) {
	  var this$1 = this;

	  if (!exports) return
	  for (var i = 0; i < decls.length; i++)
	    this$1.checkPatternExport(exports, decls[i].id)
	}

	pp$1.shouldParseExportStatement = function() {
	  return this.type.keyword === "var"
	    || this.type.keyword === "const"
	    || this.type.keyword === "class"
	    || this.type.keyword === "function"
	    || this.isLet()
	    || this.isAsyncFunction()
	}

	// Parses a comma-separated list of module exports.

	pp$1.parseExportSpecifiers = function(exports) {
	  var this$1 = this;

	  var nodes = [], first = true
	  // export { x, y as z } [from '...']
	  this.expect(tt.braceL)
	  while (!this.eat(tt.braceR)) {
	    if (!first) {
	      this$1.expect(tt.comma)
	      if (this$1.afterTrailingComma(tt.braceR)) break
	    } else first = false

	    var node = this$1.startNode()
	    node.local = this$1.parseIdent(this$1.type === tt._default)
	    node.exported = this$1.eatContextual("as") ? this$1.parseIdent(true) : node.local
	    this$1.checkExport(exports, node.exported.name, node.exported.start)
	    nodes.push(this$1.finishNode(node, "ExportSpecifier"))
	  }
	  return nodes
	}

	// Parses import declaration.

	pp$1.parseImport = function(node) {
	  this.next()
	  // import '...'
	  if (this.type === tt.string) {
	    node.specifiers = empty
	    node.source = this.parseExprAtom()
	  } else {
	    node.specifiers = this.parseImportSpecifiers()
	    this.expectContextual("from")
	    node.source = this.type === tt.string ? this.parseExprAtom() : this.unexpected()
	  }
	  this.semicolon()
	  return this.finishNode(node, "ImportDeclaration")
	}

	// Parses a comma-separated list of module imports.

	pp$1.parseImportSpecifiers = function() {
	  var this$1 = this;

	  var nodes = [], first = true
	  if (this.type === tt.name) {
	    // import defaultObj, { x, y as z } from '...'
	    var node = this.startNode()
	    node.local = this.parseIdent()
	    this.checkLVal(node.local, true)
	    nodes.push(this.finishNode(node, "ImportDefaultSpecifier"))
	    if (!this.eat(tt.comma)) return nodes
	  }
	  if (this.type === tt.star) {
	    var node$1 = this.startNode()
	    this.next()
	    this.expectContextual("as")
	    node$1.local = this.parseIdent()
	    this.checkLVal(node$1.local, true)
	    nodes.push(this.finishNode(node$1, "ImportNamespaceSpecifier"))
	    return nodes
	  }
	  this.expect(tt.braceL)
	  while (!this.eat(tt.braceR)) {
	    if (!first) {
	      this$1.expect(tt.comma)
	      if (this$1.afterTrailingComma(tt.braceR)) break
	    } else first = false

	    var node$2 = this$1.startNode()
	    node$2.imported = this$1.parseIdent(true)
	    if (this$1.eatContextual("as")) {
	      node$2.local = this$1.parseIdent()
	    } else {
	      node$2.local = node$2.imported
	      if (this$1.isKeyword(node$2.local.name)) this$1.unexpected(node$2.local.start)
	      if (this$1.reservedWordsStrict.test(node$2.local.name)) this$1.raiseRecoverable(node$2.local.start, "The keyword '" + node$2.local.name + "' is reserved")
	    }
	    this$1.checkLVal(node$2.local, true)
	    nodes.push(this$1.finishNode(node$2, "ImportSpecifier"))
	  }
	  return nodes
	}

	var pp$2 = Parser.prototype

	// Convert existing expression atom to assignable pattern
	// if possible.

	pp$2.toAssignable = function(node, isBinding) {
	  var this$1 = this;

	  if (this.options.ecmaVersion >= 6 && node) {
	    switch (node.type) {
	      case "Identifier":
	      if (this.inAsync && node.name === "await")
	        this.raise(node.start, "Can not use 'await' as identifier inside an async function")
	      break

	    case "ObjectPattern":
	    case "ArrayPattern":
	      break

	    case "ObjectExpression":
	      node.type = "ObjectPattern"
	      for (var i = 0; i < node.properties.length; i++) {
	        var prop = node.properties[i]
	        if (prop.kind !== "init") this$1.raise(prop.key.start, "Object pattern can't contain getter or setter")
	        this$1.toAssignable(prop.value, isBinding)
	      }
	      break

	    case "ArrayExpression":
	      node.type = "ArrayPattern"
	      this.toAssignableList(node.elements, isBinding)
	      break

	    case "AssignmentExpression":
	      if (node.operator === "=") {
	        node.type = "AssignmentPattern"
	        delete node.operator
	        this.toAssignable(node.left, isBinding)
	        // falls through to AssignmentPattern
	      } else {
	        this.raise(node.left.end, "Only '=' operator can be used for specifying default value.")
	        break
	      }

	    case "AssignmentPattern":
	      break

	    case "ParenthesizedExpression":
	      node.expression = this.toAssignable(node.expression, isBinding)
	      break

	    case "MemberExpression":
	      if (!isBinding) break

	    default:
	      this.raise(node.start, "Assigning to rvalue")
	    }
	  }
	  return node
	}

	// Convert list of expression atoms to binding list.

	pp$2.toAssignableList = function(exprList, isBinding) {
	  var this$1 = this;

	  var end = exprList.length
	  if (end) {
	    var last = exprList[end - 1]
	    if (last && last.type == "RestElement") {
	      --end
	    } else if (last && last.type == "SpreadElement") {
	      last.type = "RestElement"
	      var arg = last.argument
	      this.toAssignable(arg, isBinding)
	      if (arg.type !== "Identifier" && arg.type !== "MemberExpression" && arg.type !== "ArrayPattern")
	        this.unexpected(arg.start)
	      --end
	    }

	    if (isBinding && last && last.type === "RestElement" && last.argument.type !== "Identifier")
	      this.unexpected(last.argument.start)
	  }
	  for (var i = 0; i < end; i++) {
	    var elt = exprList[i]
	    if (elt) this$1.toAssignable(elt, isBinding)
	  }
	  return exprList
	}

	// Parses spread element.

	pp$2.parseSpread = function(refDestructuringErrors) {
	  var node = this.startNode()
	  this.next()
	  node.argument = this.parseMaybeAssign(false, refDestructuringErrors)
	  return this.finishNode(node, "SpreadElement")
	}

	pp$2.parseRest = function(allowNonIdent) {
	  var node = this.startNode()
	  this.next()

	  // RestElement inside of a function parameter must be an identifier
	  if (allowNonIdent) node.argument = this.type === tt.name ? this.parseIdent() : this.unexpected()
	  else node.argument = this.type === tt.name || this.type === tt.bracketL ? this.parseBindingAtom() : this.unexpected()

	  return this.finishNode(node, "RestElement")
	}

	// Parses lvalue (assignable) atom.

	pp$2.parseBindingAtom = function() {
	  if (this.options.ecmaVersion < 6) return this.parseIdent()
	  switch (this.type) {
	  case tt.name:
	    return this.parseIdent()

	  case tt.bracketL:
	    var node = this.startNode()
	    this.next()
	    node.elements = this.parseBindingList(tt.bracketR, true, true)
	    return this.finishNode(node, "ArrayPattern")

	  case tt.braceL:
	    return this.parseObj(true)

	  default:
	    this.unexpected()
	  }
	}

	pp$2.parseBindingList = function(close, allowEmpty, allowTrailingComma, allowNonIdent) {
	  var this$1 = this;

	  var elts = [], first = true
	  while (!this.eat(close)) {
	    if (first) first = false
	    else this$1.expect(tt.comma)
	    if (allowEmpty && this$1.type === tt.comma) {
	      elts.push(null)
	    } else if (allowTrailingComma && this$1.afterTrailingComma(close)) {
	      break
	    } else if (this$1.type === tt.ellipsis) {
	      var rest = this$1.parseRest(allowNonIdent)
	      this$1.parseBindingListItem(rest)
	      elts.push(rest)
	      if (this$1.type === tt.comma) this$1.raise(this$1.start, "Comma is not permitted after the rest element")
	      this$1.expect(close)
	      break
	    } else {
	      var elem = this$1.parseMaybeDefault(this$1.start, this$1.startLoc)
	      this$1.parseBindingListItem(elem)
	      elts.push(elem)
	    }
	  }
	  return elts
	}

	pp$2.parseBindingListItem = function(param) {
	  return param
	}

	// Parses assignment pattern around given atom if possible.

	pp$2.parseMaybeDefault = function(startPos, startLoc, left) {
	  left = left || this.parseBindingAtom()
	  if (this.options.ecmaVersion < 6 || !this.eat(tt.eq)) return left
	  var node = this.startNodeAt(startPos, startLoc)
	  node.left = left
	  node.right = this.parseMaybeAssign()
	  return this.finishNode(node, "AssignmentPattern")
	}

	// Verify that a node is an lval — something that can be assigned
	// to.

	pp$2.checkLVal = function(expr, isBinding, checkClashes) {
	  var this$1 = this;

	  switch (expr.type) {
	  case "Identifier":
	    if (this.strict && this.reservedWordsStrictBind.test(expr.name))
	      this.raiseRecoverable(expr.start, (isBinding ? "Binding " : "Assigning to ") + expr.name + " in strict mode")
	    if (checkClashes) {
	      if (has(checkClashes, expr.name))
	        this.raiseRecoverable(expr.start, "Argument name clash")
	      checkClashes[expr.name] = true
	    }
	    break

	  case "MemberExpression":
	    if (isBinding) this.raiseRecoverable(expr.start, (isBinding ? "Binding" : "Assigning to") + " member expression")
	    break

	  case "ObjectPattern":
	    for (var i = 0; i < expr.properties.length; i++)
	      this$1.checkLVal(expr.properties[i].value, isBinding, checkClashes)
	    break

	  case "ArrayPattern":
	    for (var i$1 = 0; i$1 < expr.elements.length; i$1++) {
	      var elem = expr.elements[i$1]
	      if (elem) this$1.checkLVal(elem, isBinding, checkClashes)
	    }
	    break

	  case "AssignmentPattern":
	    this.checkLVal(expr.left, isBinding, checkClashes)
	    break

	  case "RestElement":
	    this.checkLVal(expr.argument, isBinding, checkClashes)
	    break

	  case "ParenthesizedExpression":
	    this.checkLVal(expr.expression, isBinding, checkClashes)
	    break

	  default:
	    this.raise(expr.start, (isBinding ? "Binding" : "Assigning to") + " rvalue")
	  }
	}

	// A recursive descent parser operates by defining functions for all
	// syntactic elements, and recursively calling those, each function
	// advancing the input stream and returning an AST node. Precedence
	// of constructs (for example, the fact that `!x[1]` means `!(x[1])`
	// instead of `(!x)[1]` is handled by the fact that the parser
	// function that parses unary prefix operators is called first, and
	// in turn calls the function that parses `[]` subscripts — that
	// way, it'll receive the node for `x[1]` already parsed, and wraps
	// *that* in the unary operator node.
	//
	// Acorn uses an [operator precedence parser][opp] to handle binary
	// operator precedence, because it is much more compact than using
	// the technique outlined above, which uses different, nesting
	// functions to specify precedence, for all of the ten binary
	// precedence levels that JavaScript defines.
	//
	// [opp]: http://en.wikipedia.org/wiki/Operator-precedence_parser

	var pp$3 = Parser.prototype

	// Check if property name clashes with already added.
	// Object/class getters and setters are not allowed to clash —
	// either with each other or with an init property — and in
	// strict mode, init properties are also not allowed to be repeated.

	pp$3.checkPropClash = function(prop, propHash) {
	  if (this.options.ecmaVersion >= 6 && (prop.computed || prop.method || prop.shorthand))
	    return
	  var key = prop.key;
	  var name
	  switch (key.type) {
	  case "Identifier": name = key.name; break
	  case "Literal": name = String(key.value); break
	  default: return
	  }
	  var kind = prop.kind;
	  if (this.options.ecmaVersion >= 6) {
	    if (name === "__proto__" && kind === "init") {
	      if (propHash.proto) this.raiseRecoverable(key.start, "Redefinition of __proto__ property")
	      propHash.proto = true
	    }
	    return
	  }
	  name = "$" + name
	  var other = propHash[name]
	  if (other) {
	    var isGetSet = kind !== "init"
	    if ((this.strict || isGetSet) && other[kind] || !(isGetSet ^ other.init))
	      this.raiseRecoverable(key.start, "Redefinition of property")
	  } else {
	    other = propHash[name] = {
	      init: false,
	      get: false,
	      set: false
	    }
	  }
	  other[kind] = true
	}

	// ### Expression parsing

	// These nest, from the most general expression type at the top to
	// 'atomic', nondivisible expression types at the bottom. Most of
	// the functions will simply let the function(s) below them parse,
	// and, *if* the syntactic construct they handle is present, wrap
	// the AST node that the inner parser gave them in another node.

	// Parse a full expression. The optional arguments are used to
	// forbid the `in` operator (in for loops initalization expressions)
	// and provide reference for storing '=' operator inside shorthand
	// property assignment in contexts where both object expression
	// and object pattern might appear (so it's possible to raise
	// delayed syntax error at correct position).

	pp$3.parseExpression = function(noIn, refDestructuringErrors) {
	  var this$1 = this;

	  var startPos = this.start, startLoc = this.startLoc
	  var expr = this.parseMaybeAssign(noIn, refDestructuringErrors)
	  if (this.type === tt.comma) {
	    var node = this.startNodeAt(startPos, startLoc)
	    node.expressions = [expr]
	    while (this.eat(tt.comma)) node.expressions.push(this$1.parseMaybeAssign(noIn, refDestructuringErrors))
	    return this.finishNode(node, "SequenceExpression")
	  }
	  return expr
	}

	// Parse an assignment expression. This includes applications of
	// operators like `+=`.

	pp$3.parseMaybeAssign = function(noIn, refDestructuringErrors, afterLeftParse) {
	  if (this.inGenerator && this.isContextual("yield")) return this.parseYield()

	  var ownDestructuringErrors = false
	  if (!refDestructuringErrors) {
	    refDestructuringErrors = new DestructuringErrors
	    ownDestructuringErrors = true
	  }
	  var startPos = this.start, startLoc = this.startLoc
	  if (this.type == tt.parenL || this.type == tt.name)
	    this.potentialArrowAt = this.start
	  var left = this.parseMaybeConditional(noIn, refDestructuringErrors)
	  if (afterLeftParse) left = afterLeftParse.call(this, left, startPos, startLoc)
	  if (this.type.isAssign) {
	    this.checkPatternErrors(refDestructuringErrors, true)
	    if (!ownDestructuringErrors) DestructuringErrors.call(refDestructuringErrors)
	    var node = this.startNodeAt(startPos, startLoc)
	    node.operator = this.value
	    node.left = this.type === tt.eq ? this.toAssignable(left) : left
	    refDestructuringErrors.shorthandAssign = 0 // reset because shorthand default was used correctly
	    this.checkLVal(left)
	    this.next()
	    node.right = this.parseMaybeAssign(noIn)
	    return this.finishNode(node, "AssignmentExpression")
	  } else {
	    if (ownDestructuringErrors) this.checkExpressionErrors(refDestructuringErrors, true)
	  }
	  return left
	}

	// Parse a ternary conditional (`?:`) operator.

	pp$3.parseMaybeConditional = function(noIn, refDestructuringErrors) {
	  var startPos = this.start, startLoc = this.startLoc
	  var expr = this.parseExprOps(noIn, refDestructuringErrors)
	  if (this.checkExpressionErrors(refDestructuringErrors)) return expr
	  if (this.eat(tt.question)) {
	    var node = this.startNodeAt(startPos, startLoc)
	    node.test = expr
	    node.consequent = this.parseMaybeAssign()
	    this.expect(tt.colon)
	    node.alternate = this.parseMaybeAssign(noIn)
	    return this.finishNode(node, "ConditionalExpression")
	  }
	  return expr
	}

	// Start the precedence parser.

	pp$3.parseExprOps = function(noIn, refDestructuringErrors) {
	  var startPos = this.start, startLoc = this.startLoc
	  var expr = this.parseMaybeUnary(refDestructuringErrors, false)
	  if (this.checkExpressionErrors(refDestructuringErrors)) return expr
	  return this.parseExprOp(expr, startPos, startLoc, -1, noIn)
	}

	// Parse binary operators with the operator precedence parsing
	// algorithm. `left` is the left-hand side of the operator.
	// `minPrec` provides context that allows the function to stop and
	// defer further parser to one of its callers when it encounters an
	// operator that has a lower precedence than the set it is parsing.

	pp$3.parseExprOp = function(left, leftStartPos, leftStartLoc, minPrec, noIn) {
	  var prec = this.type.binop
	  if (prec != null && (!noIn || this.type !== tt._in)) {
	    if (prec > minPrec) {
	      var logical = this.type === tt.logicalOR || this.type === tt.logicalAND
	      var op = this.value
	      this.next()
	      var startPos = this.start, startLoc = this.startLoc
	      var right = this.parseExprOp(this.parseMaybeUnary(null, false), startPos, startLoc, prec, noIn)
	      var node = this.buildBinary(leftStartPos, leftStartLoc, left, right, op, logical)
	      return this.parseExprOp(node, leftStartPos, leftStartLoc, minPrec, noIn)
	    }
	  }
	  return left
	}

	pp$3.buildBinary = function(startPos, startLoc, left, right, op, logical) {
	  var node = this.startNodeAt(startPos, startLoc)
	  node.left = left
	  node.operator = op
	  node.right = right
	  return this.finishNode(node, logical ? "LogicalExpression" : "BinaryExpression")
	}

	// Parse unary operators, both prefix and postfix.

	pp$3.parseMaybeUnary = function(refDestructuringErrors, sawUnary) {
	  var this$1 = this;

	  var startPos = this.start, startLoc = this.startLoc, expr
	  if (this.inAsync && this.isContextual("await")) {
	    expr = this.parseAwait(refDestructuringErrors)
	    sawUnary = true
	  } else if (this.type.prefix) {
	    var node = this.startNode(), update = this.type === tt.incDec
	    node.operator = this.value
	    node.prefix = true
	    this.next()
	    node.argument = this.parseMaybeUnary(null, true)
	    this.checkExpressionErrors(refDestructuringErrors, true)
	    if (update) this.checkLVal(node.argument)
	    else if (this.strict && node.operator === "delete" &&
	             node.argument.type === "Identifier")
	      this.raiseRecoverable(node.start, "Deleting local variable in strict mode")
	    else sawUnary = true
	    expr = this.finishNode(node, update ? "UpdateExpression" : "UnaryExpression")
	  } else {
	    expr = this.parseExprSubscripts(refDestructuringErrors)
	    if (this.checkExpressionErrors(refDestructuringErrors)) return expr
	    while (this.type.postfix && !this.canInsertSemicolon()) {
	      var node$1 = this$1.startNodeAt(startPos, startLoc)
	      node$1.operator = this$1.value
	      node$1.prefix = false
	      node$1.argument = expr
	      this$1.checkLVal(expr)
	      this$1.next()
	      expr = this$1.finishNode(node$1, "UpdateExpression")
	    }
	  }

	  if (!sawUnary && this.eat(tt.starstar))
	    return this.buildBinary(startPos, startLoc, expr, this.parseMaybeUnary(null, false), "**", false)
	  else
	    return expr
	}

	// Parse call, dot, and `[]`-subscript expressions.

	pp$3.parseExprSubscripts = function(refDestructuringErrors) {
	  var startPos = this.start, startLoc = this.startLoc
	  var expr = this.parseExprAtom(refDestructuringErrors)
	  var skipArrowSubscripts = expr.type === "ArrowFunctionExpression" && this.input.slice(this.lastTokStart, this.lastTokEnd) !== ")"
	  if (this.checkExpressionErrors(refDestructuringErrors) || skipArrowSubscripts) return expr
	  return this.parseSubscripts(expr, startPos, startLoc)
	}

	pp$3.parseSubscripts = function(base, startPos, startLoc, noCalls) {
	  var this$1 = this;

	  for (;;) {
	    var maybeAsyncArrow = this$1.options.ecmaVersion >= 8 && base.type === "Identifier" && base.name === "async" && !this$1.canInsertSemicolon()
	    if (this$1.eat(tt.dot)) {
	      var node = this$1.startNodeAt(startPos, startLoc)
	      node.object = base
	      node.property = this$1.parseIdent(true)
	      node.computed = false
	      base = this$1.finishNode(node, "MemberExpression")
	    } else if (this$1.eat(tt.bracketL)) {
	      var node$1 = this$1.startNodeAt(startPos, startLoc)
	      node$1.object = base
	      node$1.property = this$1.parseExpression()
	      node$1.computed = true
	      this$1.expect(tt.bracketR)
	      base = this$1.finishNode(node$1, "MemberExpression")
	    } else if (!noCalls && this$1.eat(tt.parenL)) {
	      var refDestructuringErrors = new DestructuringErrors, oldYieldPos = this$1.yieldPos, oldAwaitPos = this$1.awaitPos
	      this$1.yieldPos = 0
	      this$1.awaitPos = 0
	      var exprList = this$1.parseExprList(tt.parenR, this$1.options.ecmaVersion >= 8, false, refDestructuringErrors)
	      if (maybeAsyncArrow && !this$1.canInsertSemicolon() && this$1.eat(tt.arrow)) {
	        this$1.checkPatternErrors(refDestructuringErrors, true)
	        this$1.checkYieldAwaitInDefaultParams()
	        this$1.yieldPos = oldYieldPos
	        this$1.awaitPos = oldAwaitPos
	        return this$1.parseArrowExpression(this$1.startNodeAt(startPos, startLoc), exprList, true)
	      }
	      this$1.checkExpressionErrors(refDestructuringErrors, true)
	      this$1.yieldPos = oldYieldPos || this$1.yieldPos
	      this$1.awaitPos = oldAwaitPos || this$1.awaitPos
	      var node$2 = this$1.startNodeAt(startPos, startLoc)
	      node$2.callee = base
	      node$2.arguments = exprList
	      base = this$1.finishNode(node$2, "CallExpression")
	    } else if (this$1.type === tt.backQuote) {
	      var node$3 = this$1.startNodeAt(startPos, startLoc)
	      node$3.tag = base
	      node$3.quasi = this$1.parseTemplate()
	      base = this$1.finishNode(node$3, "TaggedTemplateExpression")
	    } else {
	      return base
	    }
	  }
	}

	// Parse an atomic expression — either a single token that is an
	// expression, an expression started by a keyword like `function` or
	// `new`, or an expression wrapped in punctuation like `()`, `[]`,
	// or `{}`.

	pp$3.parseExprAtom = function(refDestructuringErrors) {
	  var node, canBeArrow = this.potentialArrowAt == this.start
	  switch (this.type) {
	  case tt._super:
	    if (!this.inFunction)
	      this.raise(this.start, "'super' outside of function or class")

	  case tt._this:
	    var type = this.type === tt._this ? "ThisExpression" : "Super"
	    node = this.startNode()
	    this.next()
	    return this.finishNode(node, type)

	  case tt.name:
	    var startPos = this.start, startLoc = this.startLoc
	    var id = this.parseIdent(this.type !== tt.name)
	    if (this.options.ecmaVersion >= 8 && id.name === "async" && !this.canInsertSemicolon() && this.eat(tt._function))
	      return this.parseFunction(this.startNodeAt(startPos, startLoc), false, false, true)
	    if (canBeArrow && !this.canInsertSemicolon()) {
	      if (this.eat(tt.arrow))
	        return this.parseArrowExpression(this.startNodeAt(startPos, startLoc), [id], false)
	      if (this.options.ecmaVersion >= 8 && id.name === "async" && this.type === tt.name) {
	        id = this.parseIdent()
	        if (this.canInsertSemicolon() || !this.eat(tt.arrow))
	          this.unexpected()
	        return this.parseArrowExpression(this.startNodeAt(startPos, startLoc), [id], true)
	      }
	    }
	    return id

	  case tt.regexp:
	    var value = this.value
	    node = this.parseLiteral(value.value)
	    node.regex = {pattern: value.pattern, flags: value.flags}
	    return node

	  case tt.num: case tt.string:
	    return this.parseLiteral(this.value)

	  case tt._null: case tt._true: case tt._false:
	    node = this.startNode()
	    node.value = this.type === tt._null ? null : this.type === tt._true
	    node.raw = this.type.keyword
	    this.next()
	    return this.finishNode(node, "Literal")

	  case tt.parenL:
	    return this.parseParenAndDistinguishExpression(canBeArrow)

	  case tt.bracketL:
	    node = this.startNode()
	    this.next()
	    node.elements = this.parseExprList(tt.bracketR, true, true, refDestructuringErrors)
	    return this.finishNode(node, "ArrayExpression")

	  case tt.braceL:
	    return this.parseObj(false, refDestructuringErrors)

	  case tt._function:
	    node = this.startNode()
	    this.next()
	    return this.parseFunction(node, false)

	  case tt._class:
	    return this.parseClass(this.startNode(), false)

	  case tt._new:
	    return this.parseNew()

	  case tt.backQuote:
	    return this.parseTemplate()

	  default:
	    this.unexpected()
	  }
	}

	pp$3.parseLiteral = function(value) {
	  var node = this.startNode()
	  node.value = value
	  node.raw = this.input.slice(this.start, this.end)
	  this.next()
	  return this.finishNode(node, "Literal")
	}

	pp$3.parseParenExpression = function() {
	  this.expect(tt.parenL)
	  var val = this.parseExpression()
	  this.expect(tt.parenR)
	  return val
	}

	pp$3.parseParenAndDistinguishExpression = function(canBeArrow) {
	  var this$1 = this;

	  var startPos = this.start, startLoc = this.startLoc, val, allowTrailingComma = this.options.ecmaVersion >= 8
	  if (this.options.ecmaVersion >= 6) {
	    this.next()

	    var innerStartPos = this.start, innerStartLoc = this.startLoc
	    var exprList = [], first = true, lastIsComma = false
	    var refDestructuringErrors = new DestructuringErrors, oldYieldPos = this.yieldPos, oldAwaitPos = this.awaitPos, spreadStart, innerParenStart
	    this.yieldPos = 0
	    this.awaitPos = 0
	    while (this.type !== tt.parenR) {
	      first ? first = false : this$1.expect(tt.comma)
	      if (allowTrailingComma && this$1.afterTrailingComma(tt.parenR, true)) {
	        lastIsComma = true
	        break
	      } else if (this$1.type === tt.ellipsis) {
	        spreadStart = this$1.start
	        exprList.push(this$1.parseParenItem(this$1.parseRest()))
	        if (this$1.type === tt.comma) this$1.raise(this$1.start, "Comma is not permitted after the rest element")
	        break
	      } else {
	        if (this$1.type === tt.parenL && !innerParenStart) {
	          innerParenStart = this$1.start
	        }
	        exprList.push(this$1.parseMaybeAssign(false, refDestructuringErrors, this$1.parseParenItem))
	      }
	    }
	    var innerEndPos = this.start, innerEndLoc = this.startLoc
	    this.expect(tt.parenR)

	    if (canBeArrow && !this.canInsertSemicolon() && this.eat(tt.arrow)) {
	      this.checkPatternErrors(refDestructuringErrors, true)
	      this.checkYieldAwaitInDefaultParams()
	      if (innerParenStart) this.unexpected(innerParenStart)
	      this.yieldPos = oldYieldPos
	      this.awaitPos = oldAwaitPos
	      return this.parseParenArrowList(startPos, startLoc, exprList)
	    }

	    if (!exprList.length || lastIsComma) this.unexpected(this.lastTokStart)
	    if (spreadStart) this.unexpected(spreadStart)
	    this.checkExpressionErrors(refDestructuringErrors, true)
	    this.yieldPos = oldYieldPos || this.yieldPos
	    this.awaitPos = oldAwaitPos || this.awaitPos

	    if (exprList.length > 1) {
	      val = this.startNodeAt(innerStartPos, innerStartLoc)
	      val.expressions = exprList
	      this.finishNodeAt(val, "SequenceExpression", innerEndPos, innerEndLoc)
	    } else {
	      val = exprList[0]
	    }
	  } else {
	    val = this.parseParenExpression()
	  }

	  if (this.options.preserveParens) {
	    var par = this.startNodeAt(startPos, startLoc)
	    par.expression = val
	    return this.finishNode(par, "ParenthesizedExpression")
	  } else {
	    return val
	  }
	}

	pp$3.parseParenItem = function(item) {
	  return item
	}

	pp$3.parseParenArrowList = function(startPos, startLoc, exprList) {
	  return this.parseArrowExpression(this.startNodeAt(startPos, startLoc), exprList)
	}

	// New's precedence is slightly tricky. It must allow its argument to
	// be a `[]` or dot subscript expression, but not a call — at least,
	// not without wrapping it in parentheses. Thus, it uses the noCalls
	// argument to parseSubscripts to prevent it from consuming the
	// argument list.

	var empty$1 = []

	pp$3.parseNew = function() {
	  var node = this.startNode()
	  var meta = this.parseIdent(true)
	  if (this.options.ecmaVersion >= 6 && this.eat(tt.dot)) {
	    node.meta = meta
	    node.property = this.parseIdent(true)
	    if (node.property.name !== "target")
	      this.raiseRecoverable(node.property.start, "The only valid meta property for new is new.target")
	    if (!this.inFunction)
	      this.raiseRecoverable(node.start, "new.target can only be used in functions")
	    return this.finishNode(node, "MetaProperty")
	  }
	  var startPos = this.start, startLoc = this.startLoc
	  node.callee = this.parseSubscripts(this.parseExprAtom(), startPos, startLoc, true)
	  if (this.eat(tt.parenL)) node.arguments = this.parseExprList(tt.parenR, this.options.ecmaVersion >= 8, false)
	  else node.arguments = empty$1
	  return this.finishNode(node, "NewExpression")
	}

	// Parse template expression.

	pp$3.parseTemplateElement = function() {
	  var elem = this.startNode()
	  elem.value = {
	    raw: this.input.slice(this.start, this.end).replace(/\r\n?/g, '\n'),
	    cooked: this.value
	  }
	  this.next()
	  elem.tail = this.type === tt.backQuote
	  return this.finishNode(elem, "TemplateElement")
	}

	pp$3.parseTemplate = function() {
	  var this$1 = this;

	  var node = this.startNode()
	  this.next()
	  node.expressions = []
	  var curElt = this.parseTemplateElement()
	  node.quasis = [curElt]
	  while (!curElt.tail) {
	    this$1.expect(tt.dollarBraceL)
	    node.expressions.push(this$1.parseExpression())
	    this$1.expect(tt.braceR)
	    node.quasis.push(curElt = this$1.parseTemplateElement())
	  }
	  this.next()
	  return this.finishNode(node, "TemplateLiteral")
	}

	// Parse an object literal or binding pattern.

	pp$3.parseObj = function(isPattern, refDestructuringErrors) {
	  var this$1 = this;

	  var node = this.startNode(), first = true, propHash = {}
	  node.properties = []
	  this.next()
	  while (!this.eat(tt.braceR)) {
	    if (!first) {
	      this$1.expect(tt.comma)
	      if (this$1.afterTrailingComma(tt.braceR)) break
	    } else first = false

	    var prop = this$1.startNode(), isGenerator, isAsync, startPos, startLoc
	    if (this$1.options.ecmaVersion >= 6) {
	      prop.method = false
	      prop.shorthand = false
	      if (isPattern || refDestructuringErrors) {
	        startPos = this$1.start
	        startLoc = this$1.startLoc
	      }
	      if (!isPattern)
	        isGenerator = this$1.eat(tt.star)
	    }
	    this$1.parsePropertyName(prop)
	    if (!isPattern && this$1.options.ecmaVersion >= 8 && !isGenerator && !prop.computed &&
	        prop.key.type === "Identifier" && prop.key.name === "async" && this$1.type !== tt.parenL &&
	        this$1.type !== tt.colon && !this$1.canInsertSemicolon()) {
	      isAsync = true
	      this$1.parsePropertyName(prop, refDestructuringErrors)
	    } else {
	      isAsync = false
	    }
	    this$1.parsePropertyValue(prop, isPattern, isGenerator, isAsync, startPos, startLoc, refDestructuringErrors)
	    this$1.checkPropClash(prop, propHash)
	    node.properties.push(this$1.finishNode(prop, "Property"))
	  }
	  return this.finishNode(node, isPattern ? "ObjectPattern" : "ObjectExpression")
	}

	pp$3.parsePropertyValue = function(prop, isPattern, isGenerator, isAsync, startPos, startLoc, refDestructuringErrors) {
	  if ((isGenerator || isAsync) && this.type === tt.colon)
	    this.unexpected()

	  if (this.eat(tt.colon)) {
	    prop.value = isPattern ? this.parseMaybeDefault(this.start, this.startLoc) : this.parseMaybeAssign(false, refDestructuringErrors)
	    prop.kind = "init"
	  } else if (this.options.ecmaVersion >= 6 && this.type === tt.parenL) {
	    if (isPattern) this.unexpected()
	    prop.kind = "init"
	    prop.method = true
	    prop.value = this.parseMethod(isGenerator, isAsync)
	  } else if (this.options.ecmaVersion >= 5 && !prop.computed && prop.key.type === "Identifier" &&
	             (prop.key.name === "get" || prop.key.name === "set") &&
	             (this.type != tt.comma && this.type != tt.braceR)) {
	    if (isGenerator || isAsync || isPattern) this.unexpected()
	    prop.kind = prop.key.name
	    this.parsePropertyName(prop)
	    prop.value = this.parseMethod(false)
	    var paramCount = prop.kind === "get" ? 0 : 1
	    if (prop.value.params.length !== paramCount) {
	      var start = prop.value.start
	      if (prop.kind === "get")
	        this.raiseRecoverable(start, "getter should have no params")
	      else
	        this.raiseRecoverable(start, "setter should have exactly one param")
	    } else {
	      if (prop.kind === "set" && prop.value.params[0].type === "RestElement")
	        this.raiseRecoverable(prop.value.params[0].start, "Setter cannot use rest params")
	    }
	  } else if (this.options.ecmaVersion >= 6 && !prop.computed && prop.key.type === "Identifier") {
	    if (this.keywords.test(prop.key.name) ||
	        (this.strict ? this.reservedWordsStrict : this.reservedWords).test(prop.key.name) ||
	        (this.inGenerator && prop.key.name == "yield") ||
	        (this.inAsync && prop.key.name == "await"))
	      this.raiseRecoverable(prop.key.start, "'" + prop.key.name + "' can not be used as shorthand property")
	    prop.kind = "init"
	    if (isPattern) {
	      prop.value = this.parseMaybeDefault(startPos, startLoc, prop.key)
	    } else if (this.type === tt.eq && refDestructuringErrors) {
	      if (!refDestructuringErrors.shorthandAssign)
	        refDestructuringErrors.shorthandAssign = this.start
	      prop.value = this.parseMaybeDefault(startPos, startLoc, prop.key)
	    } else {
	      prop.value = prop.key
	    }
	    prop.shorthand = true
	  } else this.unexpected()
	}

	pp$3.parsePropertyName = function(prop) {
	  if (this.options.ecmaVersion >= 6) {
	    if (this.eat(tt.bracketL)) {
	      prop.computed = true
	      prop.key = this.parseMaybeAssign()
	      this.expect(tt.bracketR)
	      return prop.key
	    } else {
	      prop.computed = false
	    }
	  }
	  return prop.key = this.type === tt.num || this.type === tt.string ? this.parseExprAtom() : this.parseIdent(true)
	}

	// Initialize empty function node.

	pp$3.initFunction = function(node) {
	  node.id = null
	  if (this.options.ecmaVersion >= 6) {
	    node.generator = false
	    node.expression = false
	  }
	  if (this.options.ecmaVersion >= 8)
	    node.async = false
	}

	// Parse object or class method.

	pp$3.parseMethod = function(isGenerator, isAsync) {
	  var node = this.startNode(), oldInGen = this.inGenerator, oldInAsync = this.inAsync, oldYieldPos = this.yieldPos, oldAwaitPos = this.awaitPos

	  this.initFunction(node)
	  if (this.options.ecmaVersion >= 6)
	    node.generator = isGenerator
	  if (this.options.ecmaVersion >= 8)
	    node.async = !!isAsync

	  this.inGenerator = node.generator
	  this.inAsync = node.async
	  this.yieldPos = 0
	  this.awaitPos = 0

	  this.expect(tt.parenL)
	  node.params = this.parseBindingList(tt.parenR, false, this.options.ecmaVersion >= 8)
	  this.checkYieldAwaitInDefaultParams()
	  this.parseFunctionBody(node, false)

	  this.inGenerator = oldInGen
	  this.inAsync = oldInAsync
	  this.yieldPos = oldYieldPos
	  this.awaitPos = oldAwaitPos
	  return this.finishNode(node, "FunctionExpression")
	}

	// Parse arrow function expression with given parameters.

	pp$3.parseArrowExpression = function(node, params, isAsync) {
	  var oldInGen = this.inGenerator, oldInAsync = this.inAsync, oldYieldPos = this.yieldPos, oldAwaitPos = this.awaitPos

	  this.initFunction(node)
	  if (this.options.ecmaVersion >= 8)
	    node.async = !!isAsync

	  this.inGenerator = false
	  this.inAsync = node.async
	  this.yieldPos = 0
	  this.awaitPos = 0

	  node.params = this.toAssignableList(params, true)
	  this.parseFunctionBody(node, true)

	  this.inGenerator = oldInGen
	  this.inAsync = oldInAsync
	  this.yieldPos = oldYieldPos
	  this.awaitPos = oldAwaitPos
	  return this.finishNode(node, "ArrowFunctionExpression")
	}

	// Parse function body and check parameters.

	pp$3.parseFunctionBody = function(node, isArrowFunction) {
	  var isExpression = isArrowFunction && this.type !== tt.braceL

	  if (isExpression) {
	    node.body = this.parseMaybeAssign()
	    node.expression = true
	  } else {
	    // Start a new scope with regard to labels and the `inFunction`
	    // flag (restore them to their old value afterwards).
	    var oldInFunc = this.inFunction, oldLabels = this.labels
	    this.inFunction = true; this.labels = []
	    node.body = this.parseBlock(true)
	    node.expression = false
	    this.inFunction = oldInFunc; this.labels = oldLabels
	  }

	  // If this is a strict mode function, verify that argument names
	  // are not repeated, and it does not try to bind the words `eval`
	  // or `arguments`.
	  var useStrict = (!isExpression && node.body.body.length && this.isUseStrict(node.body.body[0])) ? node.body.body[0] : null
	  if (useStrict && this.options.ecmaVersion >= 7 && !this.isSimpleParamList(node.params))
	    this.raiseRecoverable(useStrict.start, "Illegal 'use strict' directive in function with non-simple parameter list")

	  if (this.strict || useStrict) {
	    var oldStrict = this.strict
	    this.strict = true
	    if (node.id)
	      this.checkLVal(node.id, true)
	    this.checkParams(node)
	    this.strict = oldStrict
	  } else if (isArrowFunction || !this.isSimpleParamList(node.params)) {
	    this.checkParams(node)
	  }
	}

	pp$3.isSimpleParamList = function(params) {
	  for (var i = 0; i < params.length; i++)
	    if (params[i].type !== "Identifier") return false
	  return true
	}

	// Checks function params for various disallowed patterns such as using "eval"
	// or "arguments" and duplicate parameters.

	pp$3.checkParams = function(node) {
	  var this$1 = this;

	  var nameHash = {}
	  for (var i = 0; i < node.params.length; i++) this$1.checkLVal(node.params[i], true, nameHash)
	}

	// Parses a comma-separated list of expressions, and returns them as
	// an array. `close` is the token type that ends the list, and
	// `allowEmpty` can be turned on to allow subsequent commas with
	// nothing in between them to be parsed as `null` (which is needed
	// for array literals).

	pp$3.parseExprList = function(close, allowTrailingComma, allowEmpty, refDestructuringErrors) {
	  var this$1 = this;

	  var elts = [], first = true
	  while (!this.eat(close)) {
	    if (!first) {
	      this$1.expect(tt.comma)
	      if (allowTrailingComma && this$1.afterTrailingComma(close)) break
	    } else first = false

	    var elt
	    if (allowEmpty && this$1.type === tt.comma)
	      elt = null
	    else if (this$1.type === tt.ellipsis) {
	      elt = this$1.parseSpread(refDestructuringErrors)
	      if (this$1.type === tt.comma && refDestructuringErrors && !refDestructuringErrors.trailingComma) {
	        refDestructuringErrors.trailingComma = this$1.start
	      }
	    } else
	      elt = this$1.parseMaybeAssign(false, refDestructuringErrors)
	    elts.push(elt)
	  }
	  return elts
	}

	// Parse the next token as an identifier. If `liberal` is true (used
	// when parsing properties), it will also convert keywords into
	// identifiers.

	pp$3.parseIdent = function(liberal) {
	  var node = this.startNode()
	  if (liberal && this.options.allowReserved == "never") liberal = false
	  if (this.type === tt.name) {
	    if (!liberal && (this.strict ? this.reservedWordsStrict : this.reservedWords).test(this.value) &&
	        (this.options.ecmaVersion >= 6 ||
	         this.input.slice(this.start, this.end).indexOf("\\") == -1))
	      this.raiseRecoverable(this.start, "The keyword '" + this.value + "' is reserved")
	    if (this.inGenerator && this.value === "yield")
	      this.raiseRecoverable(this.start, "Can not use 'yield' as identifier inside a generator")
	    if (this.inAsync && this.value === "await")
	      this.raiseRecoverable(this.start, "Can not use 'await' as identifier inside an async function")
	    node.name = this.value
	  } else if (liberal && this.type.keyword) {
	    node.name = this.type.keyword
	  } else {
	    this.unexpected()
	  }
	  this.next()
	  return this.finishNode(node, "Identifier")
	}

	// Parses yield expression inside generator.

	pp$3.parseYield = function() {
	  if (!this.yieldPos) this.yieldPos = this.start

	  var node = this.startNode()
	  this.next()
	  if (this.type == tt.semi || this.canInsertSemicolon() || (this.type != tt.star && !this.type.startsExpr)) {
	    node.delegate = false
	    node.argument = null
	  } else {
	    node.delegate = this.eat(tt.star)
	    node.argument = this.parseMaybeAssign()
	  }
	  return this.finishNode(node, "YieldExpression")
	}

	pp$3.parseAwait = function() {
	  if (!this.awaitPos) this.awaitPos = this.start

	  var node = this.startNode()
	  this.next()
	  node.argument = this.parseMaybeUnary(null, true)
	  return this.finishNode(node, "AwaitExpression")
	}

	var pp$4 = Parser.prototype

	// This function is used to raise exceptions on parse errors. It
	// takes an offset integer (into the current `input`) to indicate
	// the location of the error, attaches the position to the end
	// of the error message, and then raises a `SyntaxError` with that
	// message.

	pp$4.raise = function(pos, message) {
	  var loc = getLineInfo(this.input, pos)
	  message += " (" + loc.line + ":" + loc.column + ")"
	  var err = new SyntaxError(message)
	  err.pos = pos; err.loc = loc; err.raisedAt = this.pos
	  throw err
	}

	pp$4.raiseRecoverable = pp$4.raise

	pp$4.curPosition = function() {
	  if (this.options.locations) {
	    return new Position(this.curLine, this.pos - this.lineStart)
	  }
	}

	var Node = function Node(parser, pos, loc) {
	  this.type = ""
	  this.start = pos
	  this.end = 0
	  if (parser.options.locations)
	    this.loc = new SourceLocation(parser, loc)
	  if (parser.options.directSourceFile)
	    this.sourceFile = parser.options.directSourceFile
	  if (parser.options.ranges)
	    this.range = [pos, 0]
	};

	// Start an AST node, attaching a start offset.

	var pp$5 = Parser.prototype

	pp$5.startNode = function() {
	  return new Node(this, this.start, this.startLoc)
	}

	pp$5.startNodeAt = function(pos, loc) {
	  return new Node(this, pos, loc)
	}

	// Finish an AST node, adding `type` and `end` properties.

	function finishNodeAt(node, type, pos, loc) {
	  node.type = type
	  node.end = pos
	  if (this.options.locations)
	    node.loc.end = loc
	  if (this.options.ranges)
	    node.range[1] = pos
	  return node
	}

	pp$5.finishNode = function(node, type) {
	  return finishNodeAt.call(this, node, type, this.lastTokEnd, this.lastTokEndLoc)
	}

	// Finish node at given position

	pp$5.finishNodeAt = function(node, type, pos, loc) {
	  return finishNodeAt.call(this, node, type, pos, loc)
	}

	// The algorithm used to determine whether a regexp can appear at a
	// given point in the program is loosely based on sweet.js' approach.
	// See https://github.com/mozilla/sweet.js/wiki/design

	var TokContext = function TokContext(token, isExpr, preserveSpace, override) {
	  this.token = token
	  this.isExpr = !!isExpr
	  this.preserveSpace = !!preserveSpace
	  this.override = override
	};

	var types = {
	  b_stat: new TokContext("{", false),
	  b_expr: new TokContext("{", true),
	  b_tmpl: new TokContext("${", true),
	  p_stat: new TokContext("(", false),
	  p_expr: new TokContext("(", true),
	  q_tmpl: new TokContext("`", true, true, function (p) { return p.readTmplToken(); }),
	  f_expr: new TokContext("function", true)
	}

	var pp$6 = Parser.prototype

	pp$6.initialContext = function() {
	  return [types.b_stat]
	}

	pp$6.braceIsBlock = function(prevType) {
	  if (prevType === tt.colon) {
	    var parent = this.curContext()
	    if (parent === types.b_stat || parent === types.b_expr)
	      return !parent.isExpr
	  }
	  if (prevType === tt._return)
	    return lineBreak.test(this.input.slice(this.lastTokEnd, this.start))
	  if (prevType === tt._else || prevType === tt.semi || prevType === tt.eof || prevType === tt.parenR)
	    return true
	  if (prevType == tt.braceL)
	    return this.curContext() === types.b_stat
	  return !this.exprAllowed
	}

	pp$6.updateContext = function(prevType) {
	  var update, type = this.type
	  if (type.keyword && prevType == tt.dot)
	    this.exprAllowed = false
	  else if (update = type.updateContext)
	    update.call(this, prevType)
	  else
	    this.exprAllowed = type.beforeExpr
	}

	// Token-specific context update code

	tt.parenR.updateContext = tt.braceR.updateContext = function() {
	  if (this.context.length == 1) {
	    this.exprAllowed = true
	    return
	  }
	  var out = this.context.pop()
	  if (out === types.b_stat && this.curContext() === types.f_expr) {
	    this.context.pop()
	    this.exprAllowed = false
	  } else if (out === types.b_tmpl) {
	    this.exprAllowed = true
	  } else {
	    this.exprAllowed = !out.isExpr
	  }
	}

	tt.braceL.updateContext = function(prevType) {
	  this.context.push(this.braceIsBlock(prevType) ? types.b_stat : types.b_expr)
	  this.exprAllowed = true
	}

	tt.dollarBraceL.updateContext = function() {
	  this.context.push(types.b_tmpl)
	  this.exprAllowed = true
	}

	tt.parenL.updateContext = function(prevType) {
	  var statementParens = prevType === tt._if || prevType === tt._for || prevType === tt._with || prevType === tt._while
	  this.context.push(statementParens ? types.p_stat : types.p_expr)
	  this.exprAllowed = true
	}

	tt.incDec.updateContext = function() {
	  // tokExprAllowed stays unchanged
	}

	tt._function.updateContext = function(prevType) {
	  if (prevType.beforeExpr && prevType !== tt.semi && prevType !== tt._else &&
	      !((prevType === tt.colon || prevType === tt.braceL) && this.curContext() === types.b_stat))
	    this.context.push(types.f_expr)
	  this.exprAllowed = false
	}

	tt.backQuote.updateContext = function() {
	  if (this.curContext() === types.q_tmpl)
	    this.context.pop()
	  else
	    this.context.push(types.q_tmpl)
	  this.exprAllowed = false
	}

	// Object type used to represent tokens. Note that normally, tokens
	// simply exist as properties on the parser object. This is only
	// used for the onToken callback and the external tokenizer.

	var Token = function Token(p) {
	  this.type = p.type
	  this.value = p.value
	  this.start = p.start
	  this.end = p.end
	  if (p.options.locations)
	    this.loc = new SourceLocation(p, p.startLoc, p.endLoc)
	  if (p.options.ranges)
	    this.range = [p.start, p.end]
	};

	// ## Tokenizer

	var pp$7 = Parser.prototype

	// Are we running under Rhino?
	var isRhino = typeof Packages == "object" && Object.prototype.toString.call(Packages) == "[object JavaPackage]"

	// Move to the next token

	pp$7.next = function() {
	  if (this.options.onToken)
	    this.options.onToken(new Token(this))

	  this.lastTokEnd = this.end
	  this.lastTokStart = this.start
	  this.lastTokEndLoc = this.endLoc
	  this.lastTokStartLoc = this.startLoc
	  this.nextToken()
	}

	pp$7.getToken = function() {
	  this.next()
	  return new Token(this)
	}

	// If we're in an ES6 environment, make parsers iterable
	if (typeof Symbol !== "undefined")
	  pp$7[Symbol.iterator] = function () {
	    var self = this
	    return {next: function () {
	      var token = self.getToken()
	      return {
	        done: token.type === tt.eof,
	        value: token
	      }
	    }}
	  }

	// Toggle strict mode. Re-reads the next number or string to please
	// pedantic tests (`"use strict"; 010;` should fail).

	pp$7.setStrict = function(strict) {
	  var this$1 = this;

	  this.strict = strict
	  if (this.type !== tt.num && this.type !== tt.string) return
	  this.pos = this.start
	  if (this.options.locations) {
	    while (this.pos < this.lineStart) {
	      this$1.lineStart = this$1.input.lastIndexOf("\n", this$1.lineStart - 2) + 1
	      --this$1.curLine
	    }
	  }
	  this.nextToken()
	}

	pp$7.curContext = function() {
	  return this.context[this.context.length - 1]
	}

	// Read a single token, updating the parser object's token-related
	// properties.

	pp$7.nextToken = function() {
	  var curContext = this.curContext()
	  if (!curContext || !curContext.preserveSpace) this.skipSpace()

	  this.start = this.pos
	  if (this.options.locations) this.startLoc = this.curPosition()
	  if (this.pos >= this.input.length) return this.finishToken(tt.eof)

	  if (curContext.override) return curContext.override(this)
	  else this.readToken(this.fullCharCodeAtPos())
	}

	pp$7.readToken = function(code) {
	  // Identifier or keyword. '\uXXXX' sequences are allowed in
	  // identifiers, so '\' also dispatches to that.
	  if (isIdentifierStart(code, this.options.ecmaVersion >= 6) || code === 92 /* '\' */)
	    return this.readWord()

	  return this.getTokenFromCode(code)
	}

	pp$7.fullCharCodeAtPos = function() {
	  var code = this.input.charCodeAt(this.pos)
	  if (code <= 0xd7ff || code >= 0xe000) return code
	  var next = this.input.charCodeAt(this.pos + 1)
	  return (code << 10) + next - 0x35fdc00
	}

	pp$7.skipBlockComment = function() {
	  var this$1 = this;

	  var startLoc = this.options.onComment && this.curPosition()
	  var start = this.pos, end = this.input.indexOf("*/", this.pos += 2)
	  if (end === -1) this.raise(this.pos - 2, "Unterminated comment")
	  this.pos = end + 2
	  if (this.options.locations) {
	    lineBreakG.lastIndex = start
	    var match
	    while ((match = lineBreakG.exec(this.input)) && match.index < this.pos) {
	      ++this$1.curLine
	      this$1.lineStart = match.index + match[0].length
	    }
	  }
	  if (this.options.onComment)
	    this.options.onComment(true, this.input.slice(start + 2, end), start, this.pos,
	                           startLoc, this.curPosition())
	}

	pp$7.skipLineComment = function(startSkip) {
	  var this$1 = this;

	  var start = this.pos
	  var startLoc = this.options.onComment && this.curPosition()
	  var ch = this.input.charCodeAt(this.pos+=startSkip)
	  while (this.pos < this.input.length && ch !== 10 && ch !== 13 && ch !== 8232 && ch !== 8233) {
	    ++this$1.pos
	    ch = this$1.input.charCodeAt(this$1.pos)
	  }
	  if (this.options.onComment)
	    this.options.onComment(false, this.input.slice(start + startSkip, this.pos), start, this.pos,
	                           startLoc, this.curPosition())
	}

	// Called at the start of the parse and after every token. Skips
	// whitespace and comments, and.

	pp$7.skipSpace = function() {
	  var this$1 = this;

	  loop: while (this.pos < this.input.length) {
	    var ch = this$1.input.charCodeAt(this$1.pos)
	    switch (ch) {
	      case 32: case 160: // ' '
	        ++this$1.pos
	        break
	      case 13:
	        if (this$1.input.charCodeAt(this$1.pos + 1) === 10) {
	          ++this$1.pos
	        }
	      case 10: case 8232: case 8233:
	        ++this$1.pos
	        if (this$1.options.locations) {
	          ++this$1.curLine
	          this$1.lineStart = this$1.pos
	        }
	        break
	      case 47: // '/'
	        switch (this$1.input.charCodeAt(this$1.pos + 1)) {
	          case 42: // '*'
	            this$1.skipBlockComment()
	            break
	          case 47:
	            this$1.skipLineComment(2)
	            break
	          default:
	            break loop
	        }
	        break
	      default:
	        if (ch > 8 && ch < 14 || ch >= 5760 && nonASCIIwhitespace.test(String.fromCharCode(ch))) {
	          ++this$1.pos
	        } else {
	          break loop
	        }
	    }
	  }
	}

	// Called at the end of every token. Sets `end`, `val`, and
	// maintains `context` and `exprAllowed`, and skips the space after
	// the token, so that the next one's `start` will point at the
	// right position.

	pp$7.finishToken = function(type, val) {
	  this.end = this.pos
	  if (this.options.locations) this.endLoc = this.curPosition()
	  var prevType = this.type
	  this.type = type
	  this.value = val

	  this.updateContext(prevType)
	}

	// ### Token reading

	// This is the function that is called to fetch the next token. It
	// is somewhat obscure, because it works in character codes rather
	// than characters, and because operator parsing has been inlined
	// into it.
	//
	// All in the name of speed.
	//
	pp$7.readToken_dot = function() {
	  var next = this.input.charCodeAt(this.pos + 1)
	  if (next >= 48 && next <= 57) return this.readNumber(true)
	  var next2 = this.input.charCodeAt(this.pos + 2)
	  if (this.options.ecmaVersion >= 6 && next === 46 && next2 === 46) { // 46 = dot '.'
	    this.pos += 3
	    return this.finishToken(tt.ellipsis)
	  } else {
	    ++this.pos
	    return this.finishToken(tt.dot)
	  }
	}

	pp$7.readToken_slash = function() { // '/'
	  var next = this.input.charCodeAt(this.pos + 1)
	  if (this.exprAllowed) {++this.pos; return this.readRegexp()}
	  if (next === 61) return this.finishOp(tt.assign, 2)
	  return this.finishOp(tt.slash, 1)
	}

	pp$7.readToken_mult_modulo_exp = function(code) { // '%*'
	  var next = this.input.charCodeAt(this.pos + 1)
	  var size = 1
	  var tokentype = code === 42 ? tt.star : tt.modulo

	  // exponentiation operator ** and **=
	  if (this.options.ecmaVersion >= 7 && next === 42) {
	    ++size
	    tokentype = tt.starstar
	    next = this.input.charCodeAt(this.pos + 2)
	  }

	  if (next === 61) return this.finishOp(tt.assign, size + 1)
	  return this.finishOp(tokentype, size)
	}

	pp$7.readToken_pipe_amp = function(code) { // '|&'
	  var next = this.input.charCodeAt(this.pos + 1)
	  if (next === code) return this.finishOp(code === 124 ? tt.logicalOR : tt.logicalAND, 2)
	  if (next === 61) return this.finishOp(tt.assign, 2)
	  return this.finishOp(code === 124 ? tt.bitwiseOR : tt.bitwiseAND, 1)
	}

	pp$7.readToken_caret = function() { // '^'
	  var next = this.input.charCodeAt(this.pos + 1)
	  if (next === 61) return this.finishOp(tt.assign, 2)
	  return this.finishOp(tt.bitwiseXOR, 1)
	}

	pp$7.readToken_plus_min = function(code) { // '+-'
	  var next = this.input.charCodeAt(this.pos + 1)
	  if (next === code) {
	    if (next == 45 && this.input.charCodeAt(this.pos + 2) == 62 &&
	        lineBreak.test(this.input.slice(this.lastTokEnd, this.pos))) {
	      // A `-->` line comment
	      this.skipLineComment(3)
	      this.skipSpace()
	      return this.nextToken()
	    }
	    return this.finishOp(tt.incDec, 2)
	  }
	  if (next === 61) return this.finishOp(tt.assign, 2)
	  return this.finishOp(tt.plusMin, 1)
	}

	pp$7.readToken_lt_gt = function(code) { // '<>'
	  var next = this.input.charCodeAt(this.pos + 1)
	  var size = 1
	  if (next === code) {
	    size = code === 62 && this.input.charCodeAt(this.pos + 2) === 62 ? 3 : 2
	    if (this.input.charCodeAt(this.pos + size) === 61) return this.finishOp(tt.assign, size + 1)
	    return this.finishOp(tt.bitShift, size)
	  }
	  if (next == 33 && code == 60 && this.input.charCodeAt(this.pos + 2) == 45 &&
	      this.input.charCodeAt(this.pos + 3) == 45) {
	    if (this.inModule) this.unexpected()
	    // `<!--`, an XML-style comment that should be interpreted as a line comment
	    this.skipLineComment(4)
	    this.skipSpace()
	    return this.nextToken()
	  }
	  if (next === 61) size = 2
	  return this.finishOp(tt.relational, size)
	}

	pp$7.readToken_eq_excl = function(code) { // '=!'
	  var next = this.input.charCodeAt(this.pos + 1)
	  if (next === 61) return this.finishOp(tt.equality, this.input.charCodeAt(this.pos + 2) === 61 ? 3 : 2)
	  if (code === 61 && next === 62 && this.options.ecmaVersion >= 6) { // '=>'
	    this.pos += 2
	    return this.finishToken(tt.arrow)
	  }
	  return this.finishOp(code === 61 ? tt.eq : tt.prefix, 1)
	}

	pp$7.getTokenFromCode = function(code) {
	  switch (code) {
	    // The interpretation of a dot depends on whether it is followed
	    // by a digit or another two dots.
	  case 46: // '.'
	    return this.readToken_dot()

	    // Punctuation tokens.
	  case 40: ++this.pos; return this.finishToken(tt.parenL)
	  case 41: ++this.pos; return this.finishToken(tt.parenR)
	  case 59: ++this.pos; return this.finishToken(tt.semi)
	  case 44: ++this.pos; return this.finishToken(tt.comma)
	  case 91: ++this.pos; return this.finishToken(tt.bracketL)
	  case 93: ++this.pos; return this.finishToken(tt.bracketR)
	  case 123: ++this.pos; return this.finishToken(tt.braceL)
	  case 125: ++this.pos; return this.finishToken(tt.braceR)
	  case 58: ++this.pos; return this.finishToken(tt.colon)
	  case 63: ++this.pos; return this.finishToken(tt.question)

	  case 96: // '`'
	    if (this.options.ecmaVersion < 6) break
	    ++this.pos
	    return this.finishToken(tt.backQuote)

	  case 48: // '0'
	    var next = this.input.charCodeAt(this.pos + 1)
	    if (next === 120 || next === 88) return this.readRadixNumber(16) // '0x', '0X' - hex number
	    if (this.options.ecmaVersion >= 6) {
	      if (next === 111 || next === 79) return this.readRadixNumber(8) // '0o', '0O' - octal number
	      if (next === 98 || next === 66) return this.readRadixNumber(2) // '0b', '0B' - binary number
	    }
	    // Anything else beginning with a digit is an integer, octal
	    // number, or float.
	  case 49: case 50: case 51: case 52: case 53: case 54: case 55: case 56: case 57: // 1-9
	    return this.readNumber(false)

	    // Quotes produce strings.
	  case 34: case 39: // '"', "'"
	    return this.readString(code)

	    // Operators are parsed inline in tiny state machines. '=' (61) is
	    // often referred to. `finishOp` simply skips the amount of
	    // characters it is given as second argument, and returns a token
	    // of the type given by its first argument.

	  case 47: // '/'
	    return this.readToken_slash()

	  case 37: case 42: // '%*'
	    return this.readToken_mult_modulo_exp(code)

	  case 124: case 38: // '|&'
	    return this.readToken_pipe_amp(code)

	  case 94: // '^'
	    return this.readToken_caret()

	  case 43: case 45: // '+-'
	    return this.readToken_plus_min(code)

	  case 60: case 62: // '<>'
	    return this.readToken_lt_gt(code)

	  case 61: case 33: // '=!'
	    return this.readToken_eq_excl(code)

	  case 126: // '~'
	    return this.finishOp(tt.prefix, 1)
	  }

	  this.raise(this.pos, "Unexpected character '" + codePointToString(code) + "'")
	}

	pp$7.finishOp = function(type, size) {
	  var str = this.input.slice(this.pos, this.pos + size)
	  this.pos += size
	  return this.finishToken(type, str)
	}

	// Parse a regular expression. Some context-awareness is necessary,
	// since a '/' inside a '[]' set does not end the expression.

	function tryCreateRegexp(src, flags, throwErrorAt, parser) {
	  try {
	    return new RegExp(src, flags)
	  } catch (e) {
	    if (throwErrorAt !== undefined) {
	      if (e instanceof SyntaxError) parser.raise(throwErrorAt, "Error parsing regular expression: " + e.message)
	      throw e
	    }
	  }
	}

	var regexpUnicodeSupport = !!tryCreateRegexp("\uffff", "u")

	pp$7.readRegexp = function() {
	  var this$1 = this;

	  var escaped, inClass, start = this.pos
	  for (;;) {
	    if (this$1.pos >= this$1.input.length) this$1.raise(start, "Unterminated regular expression")
	    var ch = this$1.input.charAt(this$1.pos)
	    if (lineBreak.test(ch)) this$1.raise(start, "Unterminated regular expression")
	    if (!escaped) {
	      if (ch === "[") inClass = true
	      else if (ch === "]" && inClass) inClass = false
	      else if (ch === "/" && !inClass) break
	      escaped = ch === "\\"
	    } else escaped = false
	    ++this$1.pos
	  }
	  var content = this.input.slice(start, this.pos)
	  ++this.pos
	  // Need to use `readWord1` because '\uXXXX' sequences are allowed
	  // here (don't ask).
	  var mods = this.readWord1()
	  var tmp = content, tmpFlags = ""
	  if (mods) {
	    var validFlags = /^[gim]*$/
	    if (this.options.ecmaVersion >= 6) validFlags = /^[gimuy]*$/
	    if (!validFlags.test(mods)) this.raise(start, "Invalid regular expression flag")
	    if (mods.indexOf("u") >= 0) {
	      if (regexpUnicodeSupport) {
	        tmpFlags = "u"
	      } else {
	        // Replace each astral symbol and every Unicode escape sequence that
	        // possibly represents an astral symbol or a paired surrogate with a
	        // single ASCII symbol to avoid throwing on regular expressions that
	        // are only valid in combination with the `/u` flag.
	        // Note: replacing with the ASCII symbol `x` might cause false
	        // negatives in unlikely scenarios. For example, `[\u{61}-b]` is a
	        // perfectly valid pattern that is equivalent to `[a-b]`, but it would
	        // be replaced by `[x-b]` which throws an error.
	        tmp = tmp.replace(/\\u\{([0-9a-fA-F]+)\}/g, function (_match, code, offset) {
	          code = Number("0x" + code)
	          if (code > 0x10FFFF) this$1.raise(start + offset + 3, "Code point out of bounds")
	          return "x"
	        })
	        tmp = tmp.replace(/\\u([a-fA-F0-9]{4})|[\uD800-\uDBFF][\uDC00-\uDFFF]/g, "x")
	        tmpFlags = tmpFlags.replace("u", "")
	      }
	    }
	  }
	  // Detect invalid regular expressions.
	  var value = null
	  // Rhino's regular expression parser is flaky and throws uncatchable exceptions,
	  // so don't do detection if we are running under Rhino
	  if (!isRhino) {
	    tryCreateRegexp(tmp, tmpFlags, start, this)
	    // Get a regular expression object for this pattern-flag pair, or `null` in
	    // case the current environment doesn't support the flags it uses.
	    value = tryCreateRegexp(content, mods)
	  }
	  return this.finishToken(tt.regexp, {pattern: content, flags: mods, value: value})
	}

	// Read an integer in the given radix. Return null if zero digits
	// were read, the integer value otherwise. When `len` is given, this
	// will return `null` unless the integer has exactly `len` digits.

	pp$7.readInt = function(radix, len) {
	  var this$1 = this;

	  var start = this.pos, total = 0
	  for (var i = 0, e = len == null ? Infinity : len; i < e; ++i) {
	    var code = this$1.input.charCodeAt(this$1.pos), val
	    if (code >= 97) val = code - 97 + 10 // a
	    else if (code >= 65) val = code - 65 + 10 // A
	    else if (code >= 48 && code <= 57) val = code - 48 // 0-9
	    else val = Infinity
	    if (val >= radix) break
	    ++this$1.pos
	    total = total * radix + val
	  }
	  if (this.pos === start || len != null && this.pos - start !== len) return null

	  return total
	}

	pp$7.readRadixNumber = function(radix) {
	  this.pos += 2 // 0x
	  var val = this.readInt(radix)
	  if (val == null) this.raise(this.start + 2, "Expected number in radix " + radix)
	  if (isIdentifierStart(this.fullCharCodeAtPos())) this.raise(this.pos, "Identifier directly after number")
	  return this.finishToken(tt.num, val)
	}

	// Read an integer, octal integer, or floating-point number.

	pp$7.readNumber = function(startsWithDot) {
	  var start = this.pos, isFloat = false, octal = this.input.charCodeAt(this.pos) === 48
	  if (!startsWithDot && this.readInt(10) === null) this.raise(start, "Invalid number")
	  if (octal && this.pos == start + 1) octal = false
	  var next = this.input.charCodeAt(this.pos)
	  if (next === 46 && !octal) { // '.'
	    ++this.pos
	    this.readInt(10)
	    isFloat = true
	    next = this.input.charCodeAt(this.pos)
	  }
	  if ((next === 69 || next === 101) && !octal) { // 'eE'
	    next = this.input.charCodeAt(++this.pos)
	    if (next === 43 || next === 45) ++this.pos // '+-'
	    if (this.readInt(10) === null) this.raise(start, "Invalid number")
	    isFloat = true
	  }
	  if (isIdentifierStart(this.fullCharCodeAtPos())) this.raise(this.pos, "Identifier directly after number")

	  var str = this.input.slice(start, this.pos), val
	  if (isFloat) val = parseFloat(str)
	  else if (!octal || str.length === 1) val = parseInt(str, 10)
	  else if (/[89]/.test(str) || this.strict) this.raise(start, "Invalid number")
	  else val = parseInt(str, 8)
	  return this.finishToken(tt.num, val)
	}

	// Read a string value, interpreting backslash-escapes.

	pp$7.readCodePoint = function() {
	  var ch = this.input.charCodeAt(this.pos), code

	  if (ch === 123) {
	    if (this.options.ecmaVersion < 6) this.unexpected()
	    var codePos = ++this.pos
	    code = this.readHexChar(this.input.indexOf('}', this.pos) - this.pos)
	    ++this.pos
	    if (code > 0x10FFFF) this.raise(codePos, "Code point out of bounds")
	  } else {
	    code = this.readHexChar(4)
	  }
	  return code
	}

	function codePointToString(code) {
	  // UTF-16 Decoding
	  if (code <= 0xFFFF) return String.fromCharCode(code)
	  code -= 0x10000
	  return String.fromCharCode((code >> 10) + 0xD800, (code & 1023) + 0xDC00)
	}

	pp$7.readString = function(quote) {
	  var this$1 = this;

	  var out = "", chunkStart = ++this.pos
	  for (;;) {
	    if (this$1.pos >= this$1.input.length) this$1.raise(this$1.start, "Unterminated string constant")
	    var ch = this$1.input.charCodeAt(this$1.pos)
	    if (ch === quote) break
	    if (ch === 92) { // '\'
	      out += this$1.input.slice(chunkStart, this$1.pos)
	      out += this$1.readEscapedChar(false)
	      chunkStart = this$1.pos
	    } else {
	      if (isNewLine(ch)) this$1.raise(this$1.start, "Unterminated string constant")
	      ++this$1.pos
	    }
	  }
	  out += this.input.slice(chunkStart, this.pos++)
	  return this.finishToken(tt.string, out)
	}

	// Reads template string tokens.

	pp$7.readTmplToken = function() {
	  var this$1 = this;

	  var out = "", chunkStart = this.pos
	  for (;;) {
	    if (this$1.pos >= this$1.input.length) this$1.raise(this$1.start, "Unterminated template")
	    var ch = this$1.input.charCodeAt(this$1.pos)
	    if (ch === 96 || ch === 36 && this$1.input.charCodeAt(this$1.pos + 1) === 123) { // '`', '${'
	      if (this$1.pos === this$1.start && this$1.type === tt.template) {
	        if (ch === 36) {
	          this$1.pos += 2
	          return this$1.finishToken(tt.dollarBraceL)
	        } else {
	          ++this$1.pos
	          return this$1.finishToken(tt.backQuote)
	        }
	      }
	      out += this$1.input.slice(chunkStart, this$1.pos)
	      return this$1.finishToken(tt.template, out)
	    }
	    if (ch === 92) { // '\'
	      out += this$1.input.slice(chunkStart, this$1.pos)
	      out += this$1.readEscapedChar(true)
	      chunkStart = this$1.pos
	    } else if (isNewLine(ch)) {
	      out += this$1.input.slice(chunkStart, this$1.pos)
	      ++this$1.pos
	      switch (ch) {
	        case 13:
	          if (this$1.input.charCodeAt(this$1.pos) === 10) ++this$1.pos
	        case 10:
	          out += "\n"
	          break
	        default:
	          out += String.fromCharCode(ch)
	          break
	      }
	      if (this$1.options.locations) {
	        ++this$1.curLine
	        this$1.lineStart = this$1.pos
	      }
	      chunkStart = this$1.pos
	    } else {
	      ++this$1.pos
	    }
	  }
	}

	// Used to read escaped characters

	pp$7.readEscapedChar = function(inTemplate) {
	  var ch = this.input.charCodeAt(++this.pos)
	  ++this.pos
	  switch (ch) {
	  case 110: return "\n" // 'n' -> '\n'
	  case 114: return "\r" // 'r' -> '\r'
	  case 120: return String.fromCharCode(this.readHexChar(2)) // 'x'
	  case 117: return codePointToString(this.readCodePoint()) // 'u'
	  case 116: return "\t" // 't' -> '\t'
	  case 98: return "\b" // 'b' -> '\b'
	  case 118: return "\u000b" // 'v' -> '\u000b'
	  case 102: return "\f" // 'f' -> '\f'
	  case 13: if (this.input.charCodeAt(this.pos) === 10) ++this.pos // '\r\n'
	  case 10: // ' \n'
	    if (this.options.locations) { this.lineStart = this.pos; ++this.curLine }
	    return ""
	  default:
	    if (ch >= 48 && ch <= 55) {
	      var octalStr = this.input.substr(this.pos - 1, 3).match(/^[0-7]+/)[0]
	      var octal = parseInt(octalStr, 8)
	      if (octal > 255) {
	        octalStr = octalStr.slice(0, -1)
	        octal = parseInt(octalStr, 8)
	      }
	      if (octalStr !== "0" && (this.strict || inTemplate)) {
	        this.raise(this.pos - 2, "Octal literal in strict mode")
	      }
	      this.pos += octalStr.length - 1
	      return String.fromCharCode(octal)
	    }
	    return String.fromCharCode(ch)
	  }
	}

	// Used to read character escape sequences ('\x', '\u', '\U').

	pp$7.readHexChar = function(len) {
	  var codePos = this.pos
	  var n = this.readInt(16, len)
	  if (n === null) this.raise(codePos, "Bad character escape sequence")
	  return n
	}

	// Read an identifier, and return it as a string. Sets `this.containsEsc`
	// to whether the word contained a '\u' escape.
	//
	// Incrementally adds only escaped chars, adding other chunks as-is
	// as a micro-optimization.

	pp$7.readWord1 = function() {
	  var this$1 = this;

	  this.containsEsc = false
	  var word = "", first = true, chunkStart = this.pos
	  var astral = this.options.ecmaVersion >= 6
	  while (this.pos < this.input.length) {
	    var ch = this$1.fullCharCodeAtPos()
	    if (isIdentifierChar(ch, astral)) {
	      this$1.pos += ch <= 0xffff ? 1 : 2
	    } else if (ch === 92) { // "\"
	      this$1.containsEsc = true
	      word += this$1.input.slice(chunkStart, this$1.pos)
	      var escStart = this$1.pos
	      if (this$1.input.charCodeAt(++this$1.pos) != 117) // "u"
	        this$1.raise(this$1.pos, "Expecting Unicode escape sequence \\uXXXX")
	      ++this$1.pos
	      var esc = this$1.readCodePoint()
	      if (!(first ? isIdentifierStart : isIdentifierChar)(esc, astral))
	        this$1.raise(escStart, "Invalid Unicode escape")
	      word += codePointToString(esc)
	      chunkStart = this$1.pos
	    } else {
	      break
	    }
	    first = false
	  }
	  return word + this.input.slice(chunkStart, this.pos)
	}

	// Read an identifier or keyword token. Will check for reserved
	// words when necessary.

	pp$7.readWord = function() {
	  var word = this.readWord1()
	  var type = tt.name
	  if ((this.options.ecmaVersion >= 6 || !this.containsEsc) && this.keywords.test(word))
	    type = keywordTypes[word]
	  return this.finishToken(type, word)
	}

	// Acorn is a tiny, fast JavaScript parser written in JavaScript.
	//
	// Acorn was written by Marijn Haverbeke, Ingvar Stepanyan, and
	// various contributors and released under an MIT license.
	//
	// Git repositories for Acorn are available at
	//
	//     http://marijnhaverbeke.nl/git/acorn
	//     https://github.com/ternjs/acorn.git
	//
	// Please use the [github bug tracker][ghbt] to report issues.
	//
	// [ghbt]: https://github.com/ternjs/acorn/issues
	//
	// This file defines the main parser interface. The library also comes
	// with a [error-tolerant parser][dammit] and an
	// [abstract syntax tree walker][walk], defined in other files.
	//
	// [dammit]: acorn_loose.js
	// [walk]: util/walk.js

	var version = "4.0.4"

	// The main exported interface (under `self.acorn` when in the
	// browser) is a `parse` function that takes a code string and
	// returns an abstract syntax tree as specified by [Mozilla parser
	// API][api].
	//
	// [api]: https://developer.mozilla.org/en-US/docs/SpiderMonkey/Parser_API

	function parse(input, options) {
	  return new Parser(options, input).parse()
	}

	// This function tries to parse a single expression at a given
	// offset in a string. Useful for parsing mixed-language formats
	// that embed JavaScript expressions.

	function parseExpressionAt(input, pos, options) {
	  var p = new Parser(options, input, pos)
	  p.nextToken()
	  return p.parseExpression()
	}

	// Acorn is organized as a tokenizer and a recursive-descent parser.
	// The `tokenizer` export provides an interface to the tokenizer.

	function tokenizer(input, options) {
	  return new Parser(options, input)
	}

	// This is a terrible kludge to support the existing, pre-ES6
	// interface where the loose parser module retroactively adds exports
	// to this module.
	function addLooseExports(parse, Parser, plugins) {
	  exports.parse_dammit = parse
	  exports.LooseParser = Parser
	  exports.pluginsLoose = plugins
	}

	exports.version = version;
	exports.parse = parse;
	exports.parseExpressionAt = parseExpressionAt;
	exports.tokenizer = tokenizer;
	exports.addLooseExports = addLooseExports;
	exports.Parser = Parser;
	exports.plugins = plugins;
	exports.defaultOptions = defaultOptions;
	exports.Position = Position;
	exports.SourceLocation = SourceLocation;
	exports.getLineInfo = getLineInfo;
	exports.Node = Node;
	exports.TokenType = TokenType;
	exports.tokTypes = tt;
	exports.TokContext = TokContext;
	exports.tokContexts = types;
	exports.isIdentifierChar = isIdentifierChar;
	exports.isIdentifierStart = isIdentifierStart;
	exports.Token = Token;
	exports.isNewLine = isNewLine;
	exports.lineBreak = lineBreak;
	exports.lineBreakG = lineBreakG;

	Object.defineProperty(exports, '__esModule', { value: true });

	})));

/***/ },
/* 325 */
/***/ function(module, exports) {

	'use strict';
	/* eslint-disable no-unused-vars */
	var hasOwnProperty = Object.prototype.hasOwnProperty;
	var propIsEnumerable = Object.prototype.propertyIsEnumerable;

	function toObject(val) {
		if (val === null || val === undefined) {
			throw new TypeError('Object.assign cannot be called with null or undefined');
		}

		return Object(val);
	}

	function shouldUseNative() {
		try {
			if (!Object.assign) {
				return false;
			}

			// Detect buggy property enumeration order in older V8 versions.

			// https://bugs.chromium.org/p/v8/issues/detail?id=4118
			var test1 = new String('abc');  // eslint-disable-line
			test1[5] = 'de';
			if (Object.getOwnPropertyNames(test1)[0] === '5') {
				return false;
			}

			// https://bugs.chromium.org/p/v8/issues/detail?id=3056
			var test2 = {};
			for (var i = 0; i < 10; i++) {
				test2['_' + String.fromCharCode(i)] = i;
			}
			var order2 = Object.getOwnPropertyNames(test2).map(function (n) {
				return test2[n];
			});
			if (order2.join('') !== '0123456789') {
				return false;
			}

			// https://bugs.chromium.org/p/v8/issues/detail?id=3056
			var test3 = {};
			'abcdefghijklmnopqrst'.split('').forEach(function (letter) {
				test3[letter] = letter;
			});
			if (Object.keys(Object.assign({}, test3)).join('') !==
					'abcdefghijklmnopqrst') {
				return false;
			}

			return true;
		} catch (e) {
			// We don't expect any of the above to throw, but better to be safe.
			return false;
		}
	}

	module.exports = shouldUseNative() ? Object.assign : function (target, source) {
		var from;
		var to = toObject(target);
		var symbols;

		for (var s = 1; s < arguments.length; s++) {
			from = Object(arguments[s]);

			for (var key in from) {
				if (hasOwnProperty.call(from, key)) {
					to[key] = from[key];
				}
			}

			if (Object.getOwnPropertySymbols) {
				symbols = Object.getOwnPropertySymbols(from);
				for (var i = 0; i < symbols.length; i++) {
					if (propIsEnumerable.call(from, symbols[i])) {
						to[symbols[i]] = from[symbols[i]];
					}
				}
			}
		}

		return to;
	};


/***/ },
/* 326 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var objIsRegex = __webpack_require__(327);

	exports = (module.exports = parse);

	var TOKEN_TYPES = exports.TOKEN_TYPES = {
	  LINE_COMMENT: '//',
	  BLOCK_COMMENT: '/**/',
	  SINGLE_QUOTE: '\'',
	  DOUBLE_QUOTE: '"',
	  TEMPLATE_QUOTE: '`',
	  REGEXP: '//g'
	}

	var BRACKETS = exports.BRACKETS = {
	  '(': ')',
	  '{': '}',
	  '[': ']'
	};
	var BRACKETS_REVERSED = {
	  ')': '(',
	  '}': '{',
	  ']': '['
	};

	exports.parse = parse;
	function parse(src, state, options) {
	  options = options || {};
	  state = state || exports.defaultState();
	  var start = options.start || 0;
	  var end = options.end || src.length;
	  var index = start;
	  while (index < end) {
	    try {
	      parseChar(src[index], state);
	    } catch (ex) {
	      ex.index = index;
	      throw ex;
	    }
	    index++;
	  }
	  return state;
	}

	exports.parseUntil = parseUntil;
	function parseUntil(src, delimiter, options) {
	  options = options || {};
	  var start = options.start || 0;
	  var index = start;
	  var state = exports.defaultState();
	  while (index < src.length) {
	    if ((options.ignoreNesting || !state.isNesting(options)) && matches(src, delimiter, index)) {
	      var end = index;
	      return {
	        start: start,
	        end: end,
	        src: src.substring(start, end)
	      };
	    }
	    try {
	      parseChar(src[index], state);
	    } catch (ex) {
	      ex.index = index;
	      throw ex;
	    }
	    index++;
	  }
	  var err = new Error('The end of the string was reached with no closing bracket found.');
	  err.code = 'CHARACTER_PARSER:END_OF_STRING_REACHED';
	  err.index = index;
	  throw err;
	}

	exports.parseChar = parseChar;
	function parseChar(character, state) {
	  if (character.length !== 1) {
	    var err = new Error('Character must be a string of length 1');
	    err.name = 'InvalidArgumentError';
	    err.code = 'CHARACTER_PARSER:CHAR_LENGTH_NOT_ONE';
	    throw err;
	  }
	  state = state || exports.defaultState();
	  state.src += character;
	  var wasComment = state.isComment();
	  var lastChar = state.history ? state.history[0] : '';


	  if (state.regexpStart) {
	    if (character === '/' || character == '*') {
	      state.stack.pop();
	    }
	    state.regexpStart = false;
	  }
	  switch (state.current()) {
	    case TOKEN_TYPES.LINE_COMMENT:
	      if (character === '\n') {
	        state.stack.pop();
	      }
	      break;
	    case TOKEN_TYPES.BLOCK_COMMENT:
	      if (state.lastChar === '*' && character === '/') {
	        state.stack.pop();
	      }
	      break;
	    case TOKEN_TYPES.SINGLE_QUOTE:
	      if (character === '\'' && !state.escaped) {
	        state.stack.pop();
	      } else if (character === '\\' && !state.escaped) {
	        state.escaped = true;
	      } else {
	        state.escaped = false;
	      }
	      break;
	    case TOKEN_TYPES.DOUBLE_QUOTE:
	      if (character === '"' && !state.escaped) {
	        state.stack.pop();
	      } else if (character === '\\' && !state.escaped) {
	        state.escaped = true;
	      } else {
	        state.escaped = false;
	      }
	      break;
	    case TOKEN_TYPES.TEMPLATE_QUOTE:
	      if (character === '`' && !state.escaped) {
	        state.stack.pop();
	        state.hasDollar = false;
	      } else if (character === '\\' && !state.escaped) {
	        state.escaped = true;
	        state.hasDollar = false;
	      } else if (character === '$' && !state.escaped) {
	        state.hasDollar = true;
	      } else if (character === '{' && state.hasDollar) {
	        state.stack.push(BRACKETS[character]);
	      } else {
	        state.escaped = false;
	        state.hasDollar = false;
	      }
	      break;
	    case TOKEN_TYPES.REGEXP:
	      if (character === '/' && !state.escaped) {
	        state.stack.pop();
	      } else if (character === '\\' && !state.escaped) {
	        state.escaped = true;
	      } else {
	        state.escaped = false;
	      }
	      break;
	    default:
	      if (character in BRACKETS) {
	        state.stack.push(BRACKETS[character]);
	      } else if (character in BRACKETS_REVERSED) {
	        if (state.current() !== character) {
	          var err = new SyntaxError('Mismatched Bracket: ' + character);
	          err.code = 'CHARACTER_PARSER:MISMATCHED_BRACKET';
	          throw err;
	        };
	        state.stack.pop();
	      } else if (lastChar === '/' && character === '/') {
	        // Don't include comments in history
	        state.history = state.history.substr(1);
	        state.stack.push(TOKEN_TYPES.LINE_COMMENT);
	      } else if (lastChar === '/' && character === '*') {
	        // Don't include comment in history
	        state.history = state.history.substr(1);
	        state.stack.push(TOKEN_TYPES.BLOCK_COMMENT);
	      } else if (character === '/' && isRegexp(state.history)) {
	        state.stack.push(TOKEN_TYPES.REGEXP);
	        // N.B. if the next character turns out to be a `*` or a `/`
	        //      then this isn't actually a regexp
	        state.regexpStart = true;
	      } else if (character === '\'') {
	        state.stack.push(TOKEN_TYPES.SINGLE_QUOTE);
	      } else if (character === '"') {
	        state.stack.push(TOKEN_TYPES.DOUBLE_QUOTE);
	      } else if (character === '`') {
	        state.stack.push(TOKEN_TYPES.TEMPLATE_QUOTE);
	      }
	      break;
	  }
	  if (!state.isComment() && !wasComment) {
	    state.history = character + state.history;
	  }
	  state.lastChar = character; // store last character for ending block comments
	  return state;
	}

	exports.defaultState = function () { return new State() };
	function State() {
	  this.stack = [];

	  this.regexpStart = false;
	  this.escaped = false;
	  this.hasDollar = false;

	  this.src = '';
	  this.history = ''
	  this.lastChar = ''
	}
	State.prototype.current = function () {
	  return this.stack[this.stack.length - 1];
	};
	State.prototype.isString = function () {
	  return (
	    this.current() === TOKEN_TYPES.SINGLE_QUOTE ||
	    this.current() === TOKEN_TYPES.DOUBLE_QUOTE ||
	    this.current() === TOKEN_TYPES.TEMPLATE_QUOTE
	  );
	}
	State.prototype.isComment = function () {
	  return this.current() === TOKEN_TYPES.LINE_COMMENT || this.current() === TOKEN_TYPES.BLOCK_COMMENT;
	}
	State.prototype.isNesting = function (opts) {
	  if (
	    opts && opts.ignoreLineComment &&
	    this.stack.length === 1 && this.stack[0] === TOKEN_TYPES.LINE_COMMENT
	  ) {
	    // if we are only inside a line comment, and line comments are ignored
	    // don't count it as nesting
	    return false;
	  }
	  return !!this.stack.length;
	}

	function matches(str, matcher, i) {
	  if (objIsRegex(matcher)) {
	    return matcher.test(str.substr(i || 0));
	  } else {
	    return str.substr(i || 0, matcher.length) === matcher;
	  }
	}

	exports.isPunctuator = isPunctuator
	function isPunctuator(c) {
	  if (!c) return true; // the start of a string is a punctuator
	  var code = c.charCodeAt(0)

	  switch (code) {
	    case 46:   // . dot
	    case 40:   // ( open bracket
	    case 41:   // ) close bracket
	    case 59:   // ; semicolon
	    case 44:   // , comma
	    case 123:  // { open curly brace
	    case 125:  // } close curly brace
	    case 91:   // [
	    case 93:   // ]
	    case 58:   // :
	    case 63:   // ?
	    case 126:  // ~
	    case 37:   // %
	    case 38:   // &
	    case 42:   // *:
	    case 43:   // +
	    case 45:   // -
	    case 47:   // /
	    case 60:   // <
	    case 62:   // >
	    case 94:   // ^
	    case 124:  // |
	    case 33:   // !
	    case 61:   // =
	      return true;
	    default:
	      return false;
	  }
	}

	exports.isKeyword = isKeyword
	function isKeyword(id) {
	  return (id === 'if') || (id === 'in') || (id === 'do') || (id === 'var') || (id === 'for') || (id === 'new') ||
	         (id === 'try') || (id === 'let') || (id === 'this') || (id === 'else') || (id === 'case') ||
	         (id === 'void') || (id === 'with') || (id === 'enum') || (id === 'while') || (id === 'break') || (id === 'catch') ||
	         (id === 'throw') || (id === 'const') || (id === 'yield') || (id === 'class') || (id === 'super') ||
	         (id === 'return') || (id === 'typeof') || (id === 'delete') || (id === 'switch') || (id === 'export') ||
	         (id === 'import') || (id === 'default') || (id === 'finally') || (id === 'extends') || (id === 'function') ||
	         (id === 'continue') || (id === 'debugger') || (id === 'package') || (id === 'private') || (id === 'interface') ||
	         (id === 'instanceof') || (id === 'implements') || (id === 'protected') || (id === 'public') || (id === 'static');
	}

	function isRegexp(history) {
	  //could be start of regexp or divide sign

	  history = history.replace(/^\s*/, '');

	  //unless its an `if`, `while`, `for` or `with` it's a divide, so we assume it's a divide
	  if (history[0] === ')') return false;
	  //unless it's a function expression, it's a regexp, so we assume it's a regexp
	  if (history[0] === '}') return true;
	  //any punctuation means it's a regexp
	  if (isPunctuator(history[0])) return true;
	  //if the last thing was a keyword then it must be a regexp (e.g. `typeof /foo/`)
	  if (/^\w+\b/.test(history) && isKeyword(/^\w+\b/.exec(history)[0].split('').reverse().join(''))) return true;

	  return false;
	}


/***/ },
/* 327 */
/***/ function(module, exports) {

	'use strict';

	var regexExec = RegExp.prototype.exec;
	var tryRegexExec = function tryRegexExec(value) {
		try {
			regexExec.call(value);
			return true;
		} catch (e) {
			return false;
		}
	};
	var toStr = Object.prototype.toString;
	var regexClass = '[object RegExp]';
	var hasToStringTag = typeof Symbol === 'function' && typeof Symbol.toStringTag === 'symbol';

	module.exports = function isRegex(value) {
		if (typeof value !== 'object') { return false; }
		return hasToStringTag ? tryRegexExec(value) : toStr.call(value) === regexClass;
	};


/***/ },
/* 328 */
/***/ function(module, exports) {

	'use strict';

	module.exports = makeError;
	function makeError(code, message, options) {
	  var line = options.line;
	  var column = options.column;
	  var filename = options.filename;
	  var src = options.src;
	  var fullMessage;
	  var location = line + (column ? ':' + column : '');
	  if (src && line >= 1 && line <= src.split('\n').length) {
	    var lines = src.split('\n');
	    var start = Math.max(line - 3, 0);
	    var end = Math.min(lines.length, line + 3);
	    // Error context
	    var context = lines.slice(start, end).map(function(text, i){
	      var curr = i + start + 1;
	      var preamble = (curr == line ? '  > ' : '    ')
	        + curr
	        + '| ';
	      var out = preamble + text;
	      if (curr === line && column > 0) {
	        out += '\n';
	        out += Array(preamble.length + column).join('-') + '^';
	      }
	      return out;
	    }).join('\n');
	    fullMessage = (filename || 'Pug') + ':' + location + '\n' + context + '\n\n' + message;
	  } else {
	    fullMessage = (filename || 'Pug') + ':' + location + '\n\n' + message;
	  }
	  var err = new Error(fullMessage);
	  err.code = 'PUG:' + code;
	  err.msg = message;
	  err.line = line;
	  err.column = column;
	  err.filename = filename;
	  err.src = src;
	  err.toJSON = function () {
	    return {
	      code: this.code,
	      msg: this.msg,
	      line: this.line,
	      column: this.column,
	      filename: this.filename
	    };
	  };
	  return err;
	}


/***/ },
/* 329 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var assert = __webpack_require__(318);
	var TokenStream = __webpack_require__(330);
	var error = __webpack_require__(328);
	var inlineTags = __webpack_require__(331);

	module.exports = parse;
	module.exports.Parser = Parser;
	function parse(tokens, options) {
	  var parser = new Parser(tokens, options);
	  var ast = parser.parse();
	  return JSON.parse(JSON.stringify(ast));
	};

	/**
	 * Initialize `Parser` with the given input `str` and `filename`.
	 *
	 * @param {String} str
	 * @param {String} filename
	 * @param {Object} options
	 * @api public
	 */

	function Parser(tokens, options) {
	  options = options || {};
	  if (!Array.isArray(tokens)) {
	    throw new Error('Expected tokens to be an Array but got "' + (typeof tokens) + '"');
	  }
	  if (typeof options !== 'object') {
	    throw new Error('Expected "options" to be an object but got "' + (typeof options) + '"');
	  }
	  this.tokens = new TokenStream(tokens);
	  this.filename = options.filename;
	  this.src = options.src;
	  this.inMixin = 0;
	  this.plugins = options.plugins || [];
	};

	/**
	 * Parser prototype.
	 */

	Parser.prototype = {

	  /**
	   * Save original constructor
	   */

	  constructor: Parser,

	  error: function (code, message, token) {
	    var err = error(code, message, {
	      line: token.line,
	      column: token.col,
	      filename: this.filename,
	      src: this.src
	    });
	    throw err;
	  },

	  /**
	   * Return the next token object.
	   *
	   * @return {Object}
	   * @api private
	   */

	  advance: function(){
	    return this.tokens.advance();
	  },

	  /**
	   * Single token lookahead.
	   *
	   * @return {Object}
	   * @api private
	   */

	  peek: function() {
	    return this.tokens.peek();
	  },

	  /**
	   * `n` token lookahead.
	   *
	   * @param {Number} n
	   * @return {Object}
	   * @api private
	   */

	  lookahead: function(n){
	    return this.tokens.lookahead(n);
	  },

	  /**
	   * Parse input returning a string of js for evaluation.
	   *
	   * @return {String}
	   * @api public
	   */

	  parse: function(){
	    var block = this.emptyBlock(0);

	    while ('eos' != this.peek().type) {
	      if ('newline' == this.peek().type) {
	        this.advance();
	      } else if ('text-html' == this.peek().type) {
	        block.nodes = block.nodes.concat(this.parseTextHtml());
	      } else {
	        var expr = this.parseExpr();
	        if (expr) block.nodes.push(expr);
	      }
	    }

	    return block;
	  },

	  /**
	   * Expect the given type, or throw an exception.
	   *
	   * @param {String} type
	   * @api private
	   */

	  expect: function(type){
	    if (this.peek().type === type) {
	      return this.advance();
	    } else {
	      this.error('INVALID_TOKEN', 'expected "' + type + '", but got "' + this.peek().type + '"', this.peek());
	    }
	  },

	  /**
	   * Accept the given `type`.
	   *
	   * @param {String} type
	   * @api private
	   */

	  accept: function(type){
	    if (this.peek().type === type) {
	      return this.advance();
	    }
	  },

	  initBlock: function(line, nodes) {
	    /* istanbul ignore if */
	    if ((line | 0) !== line) throw new Error('`line` is not an integer');
	    /* istanbul ignore if */
	    if (!Array.isArray(nodes)) throw new Error('`nodes` is not an array');
	    return {
	      type: 'Block',
	      nodes: nodes,
	      line: line,
	      filename: this.filename
	    };
	  },

	  emptyBlock: function(line) {
	    return this.initBlock(line, []);
	  },

	  runPlugin: function(context, tok) {
	    var rest = [this];
	    for (var i = 2; i < arguments.length; i++) {
	      rest.push(arguments[i]);
	    }
	    var pluginContext;
	    for (var i = 0; i < this.plugins.length; i++) {
	      var plugin = this.plugins[i];
	      if (plugin[context] && plugin[context][tok.type]) {
	        if (pluginContext) throw new Error('Multiple plugin handlers found for context ' + JSON.stringify(context) + ', token type ' + JSON.stringify(tok.type));
	        pluginContext = plugin[context];
	      }
	    }
	    if (pluginContext) return pluginContext[tok.type].apply(pluginContext, rest);
	  },

	  /**
	   *   tag
	   * | doctype
	   * | mixin
	   * | include
	   * | filter
	   * | comment
	   * | text
	   * | text-html
	   * | dot
	   * | each
	   * | code
	   * | yield
	   * | id
	   * | class
	   * | interpolation
	   */

	  parseExpr: function(){
	    switch (this.peek().type) {
	      case 'tag':
	        return this.parseTag();
	      case 'mixin':
	        return this.parseMixin();
	      case 'block':
	        return this.parseBlock();
	      case 'mixin-block':
	        return this.parseMixinBlock();
	      case 'case':
	        return this.parseCase();
	      case 'extends':
	        return this.parseExtends();
	      case 'include':
	        return this.parseInclude();
	      case 'doctype':
	        return this.parseDoctype();
	      case 'filter':
	        return this.parseFilter();
	      case 'comment':
	        return this.parseComment();
	      case 'text':
	      case 'interpolated-code':
	      case 'start-pug-interpolation':
	        return this.parseText({block: true});
	      case 'text-html':
	        return this.initBlock(this.peek().line, this.parseTextHtml());
	      case 'dot':
	        return this.parseDot();
	      case 'each':
	        return this.parseEach();
	      case 'code':
	        return this.parseCode();
	      case 'blockcode':
	        return this.parseBlockCode();
	      case 'if':
	        return this.parseConditional();
	      case 'while':
	        return this.parseWhile();
	      case 'call':
	        return this.parseCall();
	      case 'interpolation':
	        return this.parseInterpolation();
	      case 'yield':
	        return this.parseYield();
	      case 'id':
	      case 'class':
	        this.tokens.defer({
	          type: 'tag',
	          val: 'div',
	          line: this.peek().line,
	          filename: this.filename
	        });
	        return this.parseExpr();
	      default:
	        var pluginResult = this.runPlugin('expressionTokens', this.peek());
	        if (pluginResult) return pluginResult;
	        this.error('INVALID_TOKEN', 'unexpected token "' + this.peek().type + '"', this.peek());
	    }
	  },

	  parseDot: function() {
	    this.advance();
	    return this.parseTextBlock();
	  },

	  /**
	   * Text
	   */

	  parseText: function(options){
	    var tags = [];
	    var lineno = this.peek().line;
	    var nextTok = this.peek();
	    loop:
	      while (true) {
	        switch (nextTok.type) {
	          case 'text':
	            var tok = this.advance();
	            tags.push({
	              type: 'Text',
	              val: tok.val,
	              line: tok.line,
	              filename: this.filename
	            });
	            break;
	          case 'interpolated-code':
	            var tok = this.advance();
	            tags.push({
	              type: 'Code',
	              val: tok.val,
	              buffer: tok.buffer,
	              mustEscape: tok.mustEscape !== false,
	              isInline: true,
	              line: tok.line,
	              filename: this.filename
	            });
	            break;
	          case 'newline':
	            if (!options || !options.block) break loop;
	            var tok = this.advance();
	            if (this.peek().type === 'text') {
	              tags.push({
	                type: 'Text',
	                val: '\n',
	                line: tok.line,
	                filename: this.filename
	              });
	            }
	            break;
	          case 'start-pug-interpolation':
	            this.advance();
	            tags.push(this.parseExpr());
	            this.expect('end-pug-interpolation');
	            break;
	          default:
	            var pluginResult = this.runPlugin('textTokens', nextTok, tags);
	            if (pluginResult) break;
	            break loop;
	        }
	        nextTok = this.peek();
	      }
	    if (tags.length === 1) return tags[0];
	    else return this.initBlock(lineno, tags);
	  },

	  parseTextHtml: function () {
	    var nodes = [];
	    var currentNode = null;
	loop:
	    while (true) {
	      switch (this.peek().type) {
	        case 'text-html':
	          var text = this.advance();
	          if (!currentNode) {
	            currentNode = {
	              type: 'Text',
	              val: text.val,
	              filename: this.filename,
	              line: text.line,
	              isHtml: true
	            };
	            nodes.push(currentNode);
	          } else {
	            currentNode.val += '\n' + text.val;
	          }
	          break;
	        case 'indent':
	          var block = this.block();
	          block.nodes.forEach(function (node) {
	            if (node.isHtml) {
	              if (!currentNode) {
	                currentNode = node;
	                nodes.push(currentNode);
	              } else {
	                currentNode.val += '\n' + node.val;
	              }
	            } else {
	              currentNode = null;
	              nodes.push(node);
	            }
	          });
	          break;
	        case 'code':
	          currentNode = null;
	          nodes.push(this.parseCode(true));
	          break;
	        case 'newline':
	          this.advance();
	          break;
	        default:
	          break loop;
	      }
	    }
	    return nodes;
	  },

	  /**
	   *   ':' expr
	   * | block
	   */

	  parseBlockExpansion: function(){
	    var tok = this.accept(':');
	    if (tok) {
	      return this.initBlock(tok.line, [this.parseExpr()]);
	    } else {
	      return this.block();
	    }
	  },

	  /**
	   * case
	   */

	  parseCase: function(){
	    var tok = this.expect('case');
	    var node = {type: 'Case', expr: tok.val, line: tok.line, filename: this.filename};

	    var block = this.emptyBlock(tok.line + 1);
	    this.expect('indent');
	    while ('outdent' != this.peek().type) {
	      switch (this.peek().type) {
	        case 'comment':
	        case 'newline':
	          this.advance();
	          break;
	        case 'when':
	          block.nodes.push(this.parseWhen());
	          break;
	        case 'default':
	          block.nodes.push(this.parseDefault());
	          break;
	        default:
	          var pluginResult = this.runPlugin('caseTokens', this.peek(), block);
	          if (pluginResult) break;
	          this.error('INVALID_TOKEN', 'Unexpected token "' + this.peek().type
	                          + '", expected "when", "default" or "newline"', this.peek());
	      }
	    }
	    this.expect('outdent');

	    node.block = block;

	    return node;
	  },

	  /**
	   * when
	   */

	  parseWhen: function(){
	    var tok = this.expect('when');
	    if (this.peek().type !== 'newline') {
	      return {
	        type: 'When',
	        expr: tok.val,
	        block: this.parseBlockExpansion(),
	        debug: false,
	        line: tok.line,
	        filename: this.filename
	      };
	    } else {
	      return {
	        type: 'When',
	        expr: tok.val,
	        debug: false,
	        line: tok.line,
	        filename: this.filename
	      };
	    }
	  },

	  /**
	   * default
	   */

	  parseDefault: function(){
	    var tok = this.expect('default');
	    return {
	      type: 'When',
	      expr: 'default',
	      block: this.parseBlockExpansion(),
	      debug: false,
	      line: tok.line,
	      filename: this.filename
	    };
	  },

	  /**
	   * code
	   */

	  parseCode: function(noBlock){
	    var tok = this.expect('code');
	    assert(typeof tok.mustEscape === 'boolean', 'Please update to the newest version of pug-lexer.');
	    var node = {
	      type: 'Code',
	      val: tok.val,
	      buffer: tok.buffer,
	      mustEscape: tok.mustEscape !== false,
	      isInline: !!noBlock,
	      line: tok.line,
	      filename: this.filename
	    };
	    // todo: why is this here?  It seems like a hacky workaround
	    if (node.val.match(/^ *else/)) node.debug = false;

	    if (noBlock) return node;

	    var block;

	    // handle block
	    block = 'indent' == this.peek().type;
	    if (block) {
	      if (tok.buffer) {
	        this.error('BLOCK_IN_BUFFERED_CODE', 'Buffered code cannot have a block attached to it', this.peek());
	      }
	      node.block = this.block();
	    }

	    return node;
	  },
	  parseConditional: function(){
	    var tok = this.expect('if');
	    var node = {
	      type: 'Conditional',
	      test: tok.val,
	      consequent: this.emptyBlock(tok.line),
	      alternate: null,
	      line: tok.line,
	      filename: this.filename
	    };

	    // handle block
	    if ('indent' == this.peek().type) {
	      node.consequent = this.block();
	    }

	    var currentNode = node;
	    while (true) {
	      if (this.peek().type === 'newline') {
	        this.expect('newline');
	      } else if (this.peek().type === 'else-if') {
	        tok = this.expect('else-if');
	        currentNode = (
	          currentNode.alternate = {
	            type: 'Conditional',
	            test: tok.val,
	            consequent: this.emptyBlock(tok.line),
	            alternate: null,
	            line: tok.line,
	            filename: this.filename
	          }
	        );
	        if ('indent' == this.peek().type) {
	          currentNode.consequent = this.block();
	        }
	      } else if (this.peek().type === 'else') {
	        this.expect('else');
	        if (this.peek().type === 'indent') {
	          currentNode.alternate = this.block();
	        }
	        break;
	      } else {
	        break;
	      }
	    }

	    return node;
	  },
	  parseWhile: function(){
	    var tok = this.expect('while');
	    var node = {
	      type: 'While',
	      test: tok.val,
	      line: tok.line,
	      filename: this.filename
	    };

	    // handle block
	    if ('indent' == this.peek().type) {
	      node.block = this.block();
	    } else {
	      node.block = this.emptyBlock(tok.line);
	    }

	    return node;
	  },

	  /**
	   * block code
	   */

	  parseBlockCode: function(){
	    var line = this.expect('blockcode').line;
	    var body = this.peek();
	    var text = '';
	    if (body.type === 'start-pipeless-text') {
	      this.advance();
	      while (this.peek().type !== 'end-pipeless-text') {
	        var tok = this.advance();
	        switch (tok.type) {
	          case 'text':
	            text += tok.val;
	            break;
	          case 'newline':
	            text += '\n';
	            break;
	          default:
	            var pluginResult = this.runPlugin('blockCodeTokens', tok, tok);
	            if (pluginResult) {
	              text += pluginResult;
	              break;
	            }
	            this.error('INVALID_TOKEN', 'Unexpected token type: ' + tok.type, tok);
	        }
	      }
	      this.advance();
	    }
	    return {
	      type: 'Code',
	      val: text,
	      buffer: false,
	      mustEscape: false,
	      isInline: false,
	      line: line,
	      filename: this.filename
	    };
	  },
	  /**
	   * comment
	   */

	  parseComment: function(){
	    var tok = this.expect('comment');
	    var block;
	    if (block = this.parseTextBlock()) {
	      return {
	        type: 'BlockComment',
	        val: tok.val,
	        block: block,
	        buffer: tok.buffer,
	        line: tok.line,
	        filename: this.filename
	      };
	    } else {
	      return {
	        type: 'Comment',
	        val: tok.val,
	        buffer: tok.buffer,
	        line: tok.line,
	        filename: this.filename
	      };
	    }
	  },

	  /**
	   * doctype
	   */

	  parseDoctype: function(){
	    var tok = this.expect('doctype');
	    return {
	      type: 'Doctype',
	      val: tok.val,
	      line: tok.line,
	      filename: this.filename
	    };
	  },

	  parseIncludeFilter: function() {
	    var tok = this.expect('filter');
	    var attrs = [];

	    if (this.peek().type === 'start-attributes') {
	      attrs = this.attrs();
	    }

	    return {
	      type: 'IncludeFilter',
	      name: tok.val,
	      attrs: attrs,
	      line: tok.line,
	      filename: this.filename
	    };
	  },

	  /**
	   * filter attrs? text-block
	   */

	  parseFilter: function(){
	    var tok = this.expect('filter');
	    var block, attrs = [];

	    if (this.peek().type === 'start-attributes') {
	      attrs = this.attrs();
	    }

	    if (this.peek().type === 'text') {
	      var textToken = this.advance();
	      block = this.initBlock(textToken.line, [
	        {
	          type: 'Text',
	          val: textToken.val,
	          line: textToken.line,
	          filename: this.filename
	        }
	      ]);
	    } else if (this.peek().type === 'filter') {
	      block = this.initBlock(tok.line, [this.parseFilter()]);
	    } else {
	      block = this.parseTextBlock() || this.emptyBlock(tok.line);
	    }

	    return {
	      type: 'Filter',
	      name: tok.val,
	      block: block,
	      attrs: attrs,
	      line: tok.line,
	      filename: this.filename
	    };
	  },

	  /**
	   * each block
	   */

	  parseEach: function(){
	    var tok = this.expect('each');
	    var node = {
	      type: 'Each',
	      obj: tok.code,
	      val: tok.val,
	      key: tok.key,
	      block: this.block(),
	      line: tok.line,
	      filename: this.filename
	    };
	    if (this.peek().type == 'else') {
	      this.advance();
	      node.alternate = this.block();
	    }
	    return node;
	  },

	  /**
	   * 'extends' name
	   */

	  parseExtends: function(){
	    var tok = this.expect('extends');
	    var path = this.expect('path');
	    return {
	      type: 'Extends',
	      file: {
	        type: 'FileReference',
	        path: path.val.trim(),
	        line: tok.line,
	        filename: this.filename
	      },
	      line: tok.line,
	      filename: this.filename
	    };
	  },

	  /**
	   * 'block' name block
	   */

	  parseBlock: function(){
	    var tok = this.expect('block');

	    var node = 'indent' == this.peek().type ? this.block() : this.emptyBlock(tok.line);
	    node.type = 'NamedBlock';
	    node.name = tok.val.trim();
	    node.mode = tok.mode;
	    node.line = tok.line;

	    return node;
	  },

	  parseMixinBlock: function () {
	    var tok = this.expect('mixin-block');
	    if (!this.inMixin) {
	      this.error('BLOCK_OUTISDE_MIXIN', 'Anonymous blocks are not allowed unless they are part of a mixin.', tok);
	    }
	    return {type: 'MixinBlock', line: tok.line, filename: this.filename};
	  },

	  parseYield: function() {
	    var tok = this.expect('yield');
	    return {type: 'YieldBlock', line: tok.line, filename: this.filename};
	  },

	  /**
	   * include block?
	   */

	  parseInclude: function(){
	    var tok = this.expect('include');
	    var node = {
	      type: 'Include',
	      file: {
	        type: 'FileReference',
	        line: tok.line,
	        filename: this.filename
	      },
	      line: tok.line,
	      filename: this.filename
	    };
	    var filters = [];
	    while (this.peek().type === 'filter') {
	      filters.push(this.parseIncludeFilter());
	    }
	    var path = this.expect('path');

	    node.file.path = path.val.trim();

	    if ((/\.jade$/.test(node.file.path) || /\.pug$/.test(node.file.path)) && !filters.length) {
	      node.block = 'indent' == this.peek().type ? this.block() : this.emptyBlock(tok.line);
	      if (/\.jade$/.test(node.file.path)) {
	        console.warn(
	          this.filename + ', line ' + tok.line +
	          ':\nThe .jade extension is deprecated, use .pug for "' + node.file.path +'".'
	        );
	      }
	    } else {
	      node.type = 'RawInclude';
	      node.filters = filters;
	      if (this.peek().type === 'indent') {
	        this.error('RAW_INCLUDE_BLOCK', 'Raw inclusion cannot contain a block', this.peek());
	      }
	    }
	    return node;
	  },

	  /**
	   * call ident block
	   */

	  parseCall: function(){
	    var tok = this.expect('call');
	    var name = tok.val;
	    var args = tok.args;
	    var mixin = {
	      type: 'Mixin',
	      name: name,
	      args: args,
	      block: this.emptyBlock(tok.line),
	      call: true,
	      attrs: [],
	      attributeBlocks: [],
	      line: tok.line,
	      filename: this.filename
	    };

	    this.tag(mixin);
	    if (mixin.code) {
	      mixin.block.nodes.push(mixin.code);
	      delete mixin.code;
	    }
	    if (mixin.block.nodes.length === 0) mixin.block = null;
	    return mixin;
	  },

	  /**
	   * mixin block
	   */

	  parseMixin: function(){
	    var tok = this.expect('mixin');
	    var name = tok.val;
	    var args = tok.args;

	    if ('indent' == this.peek().type) {
	      this.inMixin++;
	      var mixin = {
	        type: 'Mixin',
	        name: name,
	        args: args,
	        block: this.block(),
	        call: false,
	        line: tok.line,
	        filename: this.filename
	      };
	      this.inMixin--;
	      return mixin;
	    } else {
	      this.error('MIXIN_WITHOUT_BODY', 'Mixin ' + name + ' declared without body', tok);
	    }
	  },

	  /**
	   * indent (text | newline)* outdent
	   */

	  parseTextBlock: function(){
	    var tok = this.accept('start-pipeless-text');
	    if (!tok) return;
	    var block = this.emptyBlock(tok.line);
	    while (this.peek().type !== 'end-pipeless-text') {
	      var tok = this.advance();
	      switch (tok.type) {
	        case 'text':
	          block.nodes.push({type: 'Text', val: tok.val, line: tok.line});
	          break;
	        case 'newline':
	          block.nodes.push({type: 'Text', val: '\n', line: tok.line});
	          break;
	        case 'start-pug-interpolation':
	          block.nodes.push(this.parseExpr());
	          this.expect('end-pug-interpolation');
	          break;
	        case 'interpolated-code':
	          block.nodes.push({
	            type: 'Code',
	            val: tok.val,
	            buffer: tok.buffer,
	            mustEscape: tok.mustEscape !== false,
	            isInline: true,
	            line: tok.line,
	            filename: this.filename
	          });
	          break;
	        default:
	          var pluginResult = this.runPlugin('textBlockTokens', tok, block, tok);
	          if (pluginResult) break;
	          this.error('INVALID_TOKEN', 'Unexpected token type: ' + tok.type, tok);
	      }
	    }
	    this.advance();
	    return block;
	  },

	  /**
	   * indent expr* outdent
	   */

	  block: function(){
	    var tok = this.expect('indent');
	    var block = this.emptyBlock(tok.line);
	    while ('outdent' != this.peek().type) {
	      if ('newline' == this.peek().type) {
	        this.advance();
	      } else if ('text-html' == this.peek().type) {
	        block.nodes = block.nodes.concat(this.parseTextHtml());
	      } else {
	        var expr = this.parseExpr();
	        block.nodes.push(expr);
	      }
	    }
	    this.expect('outdent');
	    return block;
	  },

	  /**
	   * interpolation (attrs | class | id)* (text | code | ':')? newline* block?
	   */

	  parseInterpolation: function(){
	    var tok = this.advance();
	    var tag = {
	      type: 'InterpolatedTag',
	      expr: tok.val,
	      selfClosing: false,
	      block: this.emptyBlock(tok.line),
	      attrs: [],
	      attributeBlocks: [],
	      isInline: false,
	      line: tok.line,
	      filename: this.filename
	    };

	    return this.tag(tag, {selfClosingAllowed: true});
	  },

	  /**
	   * tag (attrs | class | id)* (text | code | ':')? newline* block?
	   */

	  parseTag: function(){
	    var tok = this.advance();
	    var tag = {
	      type: 'Tag',
	      name: tok.val,
	      selfClosing: false,
	      block: this.emptyBlock(tok.line),
	      attrs: [],
	      attributeBlocks: [],
	      isInline: inlineTags.indexOf(tok.val) !== -1,
	      line: tok.line,
	      filename: this.filename
	    };

	    return this.tag(tag, {selfClosingAllowed: true});
	  },

	  /**
	   * Parse tag.
	   */

	  tag: function(tag, options) {
	    var seenAttrs = false;
	    var attributeNames = [];
	    var selfClosingAllowed = options && options.selfClosingAllowed;
	    // (attrs | class | id)*
	    out:
	      while (true) {
	        switch (this.peek().type) {
	          case 'id':
	          case 'class':
	            var tok = this.advance();
	            if (tok.type === 'id') {
	              if (attributeNames.indexOf('id') !== -1) {
	                this.error('DUPLICATE_ID', 'Duplicate attribute "id" is not allowed.', tok);
	              }
	              attributeNames.push('id');
	            }
	            tag.attrs.push({
	              name: tok.type,
	              val: "'" + tok.val + "'",
	              mustEscape: false
	            });
	            continue;
	          case 'start-attributes':
	            if (seenAttrs) {
	              console.warn(this.filename + ', line ' + this.peek().line + ':\nYou should not have pug tags with multiple attributes.');
	            }
	            seenAttrs = true;
	            tag.attrs = tag.attrs.concat(this.attrs(attributeNames));
	            continue;
	          case '&attributes':
	            var tok = this.advance();
	            tag.attributeBlocks.push(tok.val);
	            break;
	          default:
	            var pluginResult = this.runPlugin('tagAttributeTokens', this.peek(), tag, attributeNames);
	            if (pluginResult) break;
	            break out;
	        }
	      }

	    // check immediate '.'
	    if ('dot' == this.peek().type) {
	      tag.textOnly = true;
	      this.advance();
	    }

	    // (text | code | ':')?
	    switch (this.peek().type) {
	      case 'text':
	      case 'interpolated-code':
	        var text = this.parseText();
	        if (text.type === 'Block') {
	          tag.block.nodes.push.apply(tag.block.nodes, text.nodes);
	        } else {
	          tag.block.nodes.push(text);
	        }
	        break;
	      case 'code':
	        tag.block.nodes.push(this.parseCode(true));
	        break;
	      case ':':
	        this.advance();
	        tag.block = this.initBlock(tag.line, [this.parseExpr()]);
	        break;
	      case 'newline':
	      case 'indent':
	      case 'outdent':
	      case 'eos':
	      case 'start-pipeless-text':
	      case 'end-pug-interpolation':
	        break;
	      case 'slash':
	        if (selfClosingAllowed) {
	          this.advance();
	          tag.selfClosing = true;
	          break;
	        }
	      default:
	        var pluginResult = this.runPlugin('tagTokens', this.peek(), tag, options);
	        if (pluginResult) break;
	        this.error('INVALID_TOKEN', 'Unexpected token `' + this.peek().type + '` expected `text`, `interpolated-code`, `code`, `:`' + (selfClosingAllowed ? ', `slash`' : '') + ', `newline` or `eos`', this.peek())
	    }

	    // newline*
	    while ('newline' == this.peek().type) this.advance();

	    // block?
	    if (tag.textOnly) {
	      tag.block = this.parseTextBlock() || this.emptyBlock(tag.line);
	    } else if ('indent' == this.peek().type) {
	      var block = this.block();
	      for (var i = 0, len = block.nodes.length; i < len; ++i) {
	        tag.block.nodes.push(block.nodes[i]);
	      }
	    }

	    return tag;
	  },

	  attrs: function(attributeNames) {
	    this.expect('start-attributes');

	    var attrs = [];
	    var tok = this.advance();
	    while (tok.type === 'attribute') {
	      if (tok.name !== 'class' && attributeNames) {
	        if (attributeNames.indexOf(tok.name) !== -1) {
	          this.error('DUPLICATE_ATTRIBUTE', 'Duplicate attribute "' + tok.name + '" is not allowed.', tok);
	        }
	        attributeNames.push(tok.name);
	      }
	      attrs.push({
	        name: tok.name,
	        val: tok.val,
	        mustEscape: tok.mustEscape !== false
	      });
	      tok = this.advance();
	    }
	    this.tokens.defer(tok);
	    this.expect('end-attributes');
	    return attrs;
	  }
	};


/***/ },
/* 330 */
/***/ function(module, exports) {

	'use strict';

	module.exports = TokenStream;
	function TokenStream(tokens) {
	  if (!Array.isArray(tokens)) {
	    throw new TypeError('tokens must be passed to TokenStream as an array.');
	  }
	  this._tokens = tokens;
	}
	TokenStream.prototype.lookahead = function (index) {
	  if (this._tokens.length <= index) {
	    throw new Error('Cannot read past the end of a stream');
	  }
	  return this._tokens[index];
	};
	TokenStream.prototype.peek = function () {
	  if (this._tokens.length === 0) {
	    throw new Error('Cannot read past the end of a stream');
	  }
	  return this._tokens[0];
	};
	TokenStream.prototype.advance = function () {
	  if (this._tokens.length === 0) {
	    throw new Error('Cannot read past the end of a stream');
	  }
	  return this._tokens.shift();
	};
	TokenStream.prototype.defer = function (token) {
	  this._tokens.unshift(token);
	};


/***/ },
/* 331 */
/***/ function(module, exports) {

	'use strict';

	module.exports = [
	    'a'
	  , 'abbr'
	  , 'acronym'
	  , 'b'
	  , 'br'
	  , 'code'
	  , 'em'
	  , 'font'
	  , 'i'
	  , 'img'
	  , 'ins'
	  , 'kbd'
	  , 'map'
	  , 'samp'
	  , 'small'
	  , 'span'
	  , 'strong'
	  , 'sub'
	  , 'sup'
	];

/***/ },
/* 332 */
/***/ function(module, exports) {

	module.exports = ".user\n\t.user__name\n\t\tlabel #{name}\n\t\t\tinput(\n\t\t\t\tvalue=name,\n\t\t\t\ttype=\"text\",\n\t\t\t\toninput=input\n\t\t\t)\n\t\n\th1 #{time}\n"

/***/ },
/* 333 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/* globals define */

	(function (root, factory) {
	  'use strict'

	  /* istanbul ignore next:cant test */
	  if (typeof module === 'object' && typeof module.exports === 'object') {
	    module.exports = factory()
	  } else if (true) {
	    // AMD. Register as an anonymous module.
	    !(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory), __WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ? (__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__))
	  } else {
	    // Browser globals
	    root.objectPath = factory()
	  }
	})(this, function () {
	  'use strict'
	  var _hasOwnProperty = Object.prototype.hasOwnProperty

	  function isEmpty (value) {
	    if (!value) {
	      return true
	    }
	    if (isArray(value) && value.length === 0) {
	      return true
	    } else if (!isString(value)) {
	      for (var i in value) {
	        if (_hasOwnProperty.call(value, i)) {
	          return false
	        }
	      }
	      return true
	    }
	    return false
	  }

	  function isNumber (value) {
	    return typeof value === 'number'
	  }

	  function isString (obj) {
	    return typeof obj === 'string'
	  }

	  function isArray (obj) {
	    return Array.isArray(obj)
	  }

	  function getKey (key) {
	    var intKey = parseInt(key)
	    if (intKey.toString() === key) {
	      return intKey
	    }
	    return key
	  }

	  var objectPathImmutable = function (src) {
	    var dest = src
	    var committed = false

	    var transaction = Object.keys(api).reduce(function (proxy, prop) {
	      /* istanbul ignore else */
	      if (typeof api[prop] === 'function') {
	        proxy[prop] = function () {
	          var args = [dest, src].concat(Array.prototype.slice.call(arguments))

	          if (committed) {
	            throw new Error('Cannot call ' + prop + ' after `value`')
	          }

	          dest = api[prop].apply(null, args)

	          return transaction
	        }
	      }

	      return proxy
	    }, {})

	    transaction.value = function () {
	      committed = true
	      return dest
	    }

	    return transaction
	  }

	  function clone (obj, createIfEmpty, assumeArray) {
	    if (obj == null) {
	      if (createIfEmpty) {
	        if (assumeArray) {
	          return []
	        }

	        return {}
	      }

	      return obj
	    } else if (isArray(obj)) {
	      return obj.slice()
	    }

	    var res = {}
	    for (var key in obj) {
	      if (obj.hasOwnProperty(key)) {
	        res[key] = obj[key]
	      }
	    }

	    return res
	  }

	  function changeImmutable (dest, src, path, changeCallback) {
	    if (isNumber(path)) {
	      path = [path]
	    }
	    if (isEmpty(path)) {
	      return src
	    }
	    if (isString(path)) {
	      return changeImmutable(dest, src, path.split('.').map(getKey), changeCallback)
	    }
	    var currentPath = path[0]

	    if (!dest || dest === src) {
	      dest = clone(src, true, isNumber(currentPath))
	    }

	    if (path.length === 1) {
	      return changeCallback(dest, currentPath)
	    }

	    if (src != null) {
	      src = src[currentPath]
	    }

	    dest[currentPath] = changeImmutable(dest[currentPath], src, path.slice(1), changeCallback)

	    return dest
	  }

	  var api = {}
	  api.set = function set (dest, src, path, value) {
	    return changeImmutable(dest, src, path, function (clonedObj, finalPath) {
	      clonedObj[finalPath] = value
	      return clonedObj
	    })
	  }

	  api.push = function push (dest, src, path /*, values */) {
	    var values = Array.prototype.slice.call(arguments, 3)
	    return changeImmutable(dest, src, path, function (clonedObj, finalPath) {
	      if (!isArray(clonedObj[finalPath])) {
	        clonedObj[finalPath] = values
	      } else {
	        clonedObj[finalPath] = clonedObj[finalPath].concat(values)
	      }
	      return clonedObj
	    })
	  }

	  api.insert = function insert (dest, src, path, value, at) {
	    at = ~~at
	    return changeImmutable(dest, src, path, function (clonedObj, finalPath) {
	      var arr = clonedObj[finalPath]
	      if (!isArray(arr)) {
	        if (arr != null && typeof arr !== 'undefined') {
	          throw new Error('Expected ' + path + 'to be an array. Instead got ' + typeof path)
	        }
	        arr = []
	      }

	      var first = arr.slice(0, at)
	      first.push(value)
	      clonedObj[finalPath] = first.concat(arr.slice(at))
	      return clonedObj
	    })
	  }

	  api.del = function del (dest, src, path, value, at) {
	    return changeImmutable(dest, src, path, function (clonedObj, finalPath) {
	      if (Array.isArray(clonedObj)) {
	        if (clonedObj[finalPath] !== undefined) {
	          clonedObj.splice(finalPath, 1)
	        }
	      } else {
	        if (clonedObj.hasOwnProperty(finalPath)) {
	          delete clonedObj[finalPath]
	        }
	      }
	      return clonedObj
	    })
	  }

	  api.assign = function assign (dest, src, path, source) {
	    return changeImmutable(dest, src, path, function (clonedObj, finalPath) {
	      source = Object(source)
	      var target = clone(clonedObj[finalPath], true)

	      for (var key in source) {
	        if (_hasOwnProperty.call(source, key)) {
	          target[key] = source[key]
	        }
	      }

	      clonedObj[finalPath] = target
	      return clonedObj
	    })
	  }

	  return Object.keys(api).reduce(function (objectPathImmutable, method) {
	    objectPathImmutable[method] = api[method].bind(null, null)

	    return objectPathImmutable
	  }, objectPathImmutable)
	})


/***/ },
/* 334 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {
	/**
	 * @license
	 * Copyright 2015 The Incremental DOM Authors. All Rights Reserved.
	 *
	 * Licensed under the Apache License, Version 2.0 (the "License");
	 * you may not use this file except in compliance with the License.
	 * You may obtain a copy of the License at
	 *
	 *      http://www.apache.org/licenses/LICENSE-2.0
	 *
	 * Unless required by applicable law or agreed to in writing, software
	 * distributed under the License is distributed on an "AS-IS" BASIS,
	 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	 * See the License for the specific language governing permissions and
	 * limitations under the License.
	 */

	'use strict';

	/**
	 * Copyright 2015 The Incremental DOM Authors. All Rights Reserved.
	 *
	 * Licensed under the Apache License, Version 2.0 (the "License");
	 * you may not use this file except in compliance with the License.
	 * You may obtain a copy of the License at
	 *
	 *      http://www.apache.org/licenses/LICENSE-2.0
	 *
	 * Unless required by applicable law or agreed to in writing, software
	 * distributed under the License is distributed on an "AS-IS" BASIS,
	 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	 * See the License for the specific language governing permissions and
	 * limitations under the License.
	 */

	/**
	 * A cached reference to the hasOwnProperty function.
	 */
	var hasOwnProperty = Object.prototype.hasOwnProperty;

	/**
	 * A constructor function that will create blank objects.
	 * @constructor
	 */
	function Blank() {}

	Blank.prototype = Object.create(null);

	/**
	 * Used to prevent property collisions between our "map" and its prototype.
	 * @param {!Object<string, *>} map The map to check.
	 * @param {string} property The property to check.
	 * @return {boolean} Whether map has property.
	 */
	var has = function (map, property) {
	  return hasOwnProperty.call(map, property);
	};

	/**
	 * Creates an map object without a prototype.
	 * @return {!Object}
	 */
	var createMap = function () {
	  return new Blank();
	};

	/**
	 * Keeps track of information needed to perform diffs for a given DOM node.
	 * @param {!string} nodeName
	 * @param {?string=} key
	 * @constructor
	 */
	function NodeData(nodeName, key) {
	  /**
	   * The attributes and their values.
	   * @const {!Object<string, *>}
	   */
	  this.attrs = createMap();

	  /**
	   * An array of attribute name/value pairs, used for quickly diffing the
	   * incomming attributes to see if the DOM node's attributes need to be
	   * updated.
	   * @const {Array<*>}
	   */
	  this.attrsArr = [];

	  /**
	   * The incoming attributes for this Node, before they are updated.
	   * @const {!Object<string, *>}
	   */
	  this.newAttrs = createMap();

	  /**
	   * Whether or not the statics have been applied for the node yet.
	   * {boolean}
	   */
	  this.staticsApplied = false;

	  /**
	   * The key used to identify this node, used to preserve DOM nodes when they
	   * move within their parent.
	   * @const
	   */
	  this.key = key;

	  /**
	   * Keeps track of children within this node by their key.
	   * {!Object<string, !Element>}
	   */
	  this.keyMap = createMap();

	  /**
	   * Whether or not the keyMap is currently valid.
	   * @type {boolean}
	   */
	  this.keyMapValid = true;

	  /**
	   * Whether or the associated node is, or contains, a focused Element.
	   * @type {boolean}
	   */
	  this.focused = false;

	  /**
	   * The node name for this node.
	   * @const {string}
	   */
	  this.nodeName = nodeName;

	  /**
	   * @type {?string}
	   */
	  this.text = null;
	}

	/**
	 * Initializes a NodeData object for a Node.
	 *
	 * @param {Node} node The node to initialize data for.
	 * @param {string} nodeName The node name of node.
	 * @param {?string=} key The key that identifies the node.
	 * @return {!NodeData} The newly initialized data object
	 */
	var initData = function (node, nodeName, key) {
	  var data = new NodeData(nodeName, key);
	  node['__incrementalDOMData'] = data;
	  return data;
	};

	/**
	 * Retrieves the NodeData object for a Node, creating it if necessary.
	 *
	 * @param {?Node} node The Node to retrieve the data for.
	 * @return {!NodeData} The NodeData for this Node.
	 */
	var getData = function (node) {
	  importNode(node);
	  return node['__incrementalDOMData'];
	};

	/**
	 * Imports node and its subtree, initializing caches.
	 *
	 * @param {?Node} node The Node to import.
	 */
	var importNode = function (node) {
	  if (node['__incrementalDOMData']) {
	    return;
	  }

	  var isElement = node instanceof Element;
	  var nodeName = isElement ? node.localName : node.nodeName;
	  var key = isElement ? node.getAttribute('key') : null;
	  var data = initData(node, nodeName, key);

	  if (key) {
	    getData(node.parentNode).keyMap[key] = node;
	  }

	  if (isElement) {
	    var attributes = node.attributes;
	    var attrs = data.attrs;
	    var newAttrs = data.newAttrs;
	    var attrsArr = data.attrsArr;

	    for (var i = 0; i < attributes.length; i += 1) {
	      var attr = attributes[i];
	      var name = attr.name;
	      var value = attr.value;

	      attrs[name] = value;
	      newAttrs[name] = undefined;
	      attrsArr.push(name);
	      attrsArr.push(value);
	    }
	  }

	  for (var child = node.firstChild; child; child = child.nextSibling) {
	    importNode(child);
	  }
	};

	/**
	 * Gets the namespace to create an element (of a given tag) in.
	 * @param {string} tag The tag to get the namespace for.
	 * @param {?Node} parent
	 * @return {?string} The namespace to create the tag in.
	 */
	var getNamespaceForTag = function (tag, parent) {
	  if (tag === 'svg') {
	    return 'http://www.w3.org/2000/svg';
	  }

	  if (getData(parent).nodeName === 'foreignObject') {
	    return null;
	  }

	  return parent.namespaceURI;
	};

	/**
	 * Creates an Element.
	 * @param {Document} doc The document with which to create the Element.
	 * @param {?Node} parent
	 * @param {string} tag The tag for the Element.
	 * @param {?string=} key A key to identify the Element.
	 * @return {!Element}
	 */
	var createElement = function (doc, parent, tag, key) {
	  var namespace = getNamespaceForTag(tag, parent);
	  var el = undefined;

	  if (namespace) {
	    el = doc.createElementNS(namespace, tag);
	  } else {
	    el = doc.createElement(tag);
	  }

	  initData(el, tag, key);

	  return el;
	};

	/**
	 * Creates a Text Node.
	 * @param {Document} doc The document with which to create the Element.
	 * @return {!Text}
	 */
	var createText = function (doc) {
	  var node = doc.createTextNode('');
	  initData(node, '#text', null);
	  return node;
	};

	/**
	 * Copyright 2015 The Incremental DOM Authors. All Rights Reserved.
	 *
	 * Licensed under the Apache License, Version 2.0 (the "License");
	 * you may not use this file except in compliance with the License.
	 * You may obtain a copy of the License at
	 *
	 *      http://www.apache.org/licenses/LICENSE-2.0
	 *
	 * Unless required by applicable law or agreed to in writing, software
	 * distributed under the License is distributed on an "AS-IS" BASIS,
	 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	 * See the License for the specific language governing permissions and
	 * limitations under the License.
	 */

	/** @const */
	var notifications = {
	  /**
	   * Called after patch has compleated with any Nodes that have been created
	   * and added to the DOM.
	   * @type {?function(Array<!Node>)}
	   */
	  nodesCreated: null,

	  /**
	   * Called after patch has compleated with any Nodes that have been removed
	   * from the DOM.
	   * Note it's an applications responsibility to handle any childNodes.
	   * @type {?function(Array<!Node>)}
	   */
	  nodesDeleted: null
	};

	/**
	 * Keeps track of the state of a patch.
	 * @constructor
	 */
	function Context() {
	  /**
	   * @type {(Array<!Node>|undefined)}
	   */
	  this.created = notifications.nodesCreated && [];

	  /**
	   * @type {(Array<!Node>|undefined)}
	   */
	  this.deleted = notifications.nodesDeleted && [];
	}

	/**
	 * @param {!Node} node
	 */
	Context.prototype.markCreated = function (node) {
	  if (this.created) {
	    this.created.push(node);
	  }
	};

	/**
	 * @param {!Node} node
	 */
	Context.prototype.markDeleted = function (node) {
	  if (this.deleted) {
	    this.deleted.push(node);
	  }
	};

	/**
	 * Notifies about nodes that were created during the patch opearation.
	 */
	Context.prototype.notifyChanges = function () {
	  if (this.created && this.created.length > 0) {
	    notifications.nodesCreated(this.created);
	  }

	  if (this.deleted && this.deleted.length > 0) {
	    notifications.nodesDeleted(this.deleted);
	  }
	};

	/**
	 * Copyright 2015 The Incremental DOM Authors. All Rights Reserved.
	 *
	 * Licensed under the Apache License, Version 2.0 (the "License");
	 * you may not use this file except in compliance with the License.
	 * You may obtain a copy of the License at
	 *
	 *      http://www.apache.org/licenses/LICENSE-2.0
	 *
	 * Unless required by applicable law or agreed to in writing, software
	 * distributed under the License is distributed on an "AS-IS" BASIS,
	 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	 * See the License for the specific language governing permissions and
	 * limitations under the License.
	 */

	/**
	  * Keeps track whether or not we are in an attributes declaration (after
	  * elementOpenStart, but before elementOpenEnd).
	  * @type {boolean}
	  */
	var inAttributes = false;

	/**
	  * Keeps track whether or not we are in an element that should not have its
	  * children cleared.
	  * @type {boolean}
	  */
	var inSkip = false;

	/**
	 * Makes sure that there is a current patch context.
	 * @param {string} functionName
	 * @param {*} context
	 */
	var assertInPatch = function (functionName, context) {
	  if (!context) {
	    throw new Error('Cannot call ' + functionName + '() unless in patch.');
	  }
	};

	/**
	 * Makes sure that a patch closes every node that it opened.
	 * @param {?Node} openElement
	 * @param {!Node|!DocumentFragment} root
	 */
	var assertNoUnclosedTags = function (openElement, root) {
	  if (openElement === root) {
	    return;
	  }

	  var currentElement = openElement;
	  var openTags = [];
	  while (currentElement && currentElement !== root) {
	    openTags.push(currentElement.nodeName.toLowerCase());
	    currentElement = currentElement.parentNode;
	  }

	  throw new Error('One or more tags were not closed:\n' + openTags.join('\n'));
	};

	/**
	 * Makes sure that the caller is not where attributes are expected.
	 * @param {string} functionName
	 */
	var assertNotInAttributes = function (functionName) {
	  if (inAttributes) {
	    throw new Error(functionName + '() can not be called between ' + 'elementOpenStart() and elementOpenEnd().');
	  }
	};

	/**
	 * Makes sure that the caller is not inside an element that has declared skip.
	 * @param {string} functionName
	 */
	var assertNotInSkip = function (functionName) {
	  if (inSkip) {
	    throw new Error(functionName + '() may not be called inside an element ' + 'that has called skip().');
	  }
	};

	/**
	 * Makes sure that the caller is where attributes are expected.
	 * @param {string} functionName
	 */
	var assertInAttributes = function (functionName) {
	  if (!inAttributes) {
	    throw new Error(functionName + '() can only be called after calling ' + 'elementOpenStart().');
	  }
	};

	/**
	 * Makes sure the patch closes virtual attributes call
	 */
	var assertVirtualAttributesClosed = function () {
	  if (inAttributes) {
	    throw new Error('elementOpenEnd() must be called after calling ' + 'elementOpenStart().');
	  }
	};

	/**
	  * Makes sure that tags are correctly nested.
	  * @param {string} nodeName
	  * @param {string} tag
	  */
	var assertCloseMatchesOpenTag = function (nodeName, tag) {
	  if (nodeName !== tag) {
	    throw new Error('Received a call to close "' + tag + '" but "' + nodeName + '" was open.');
	  }
	};

	/**
	 * Makes sure that no children elements have been declared yet in the current
	 * element.
	 * @param {string} functionName
	 * @param {?Node} previousNode
	 */
	var assertNoChildrenDeclaredYet = function (functionName, previousNode) {
	  if (previousNode !== null) {
	    throw new Error(functionName + '() must come before any child ' + 'declarations inside the current element.');
	  }
	};

	/**
	 * Checks that a call to patchOuter actually patched the element.
	 * @param {?Node} startNode The value for the currentNode when the patch
	 *     started.
	 * @param {?Node} currentNode The currentNode when the patch finished.
	 * @param {?Node} expectedNextNode The Node that is expected to follow the
	 *    currentNode after the patch;
	 * @param {?Node} expectedPrevNode The Node that is expected to preceed the
	 *    currentNode after the patch.
	 */
	var assertPatchElementNoExtras = function (startNode, currentNode, expectedNextNode, expectedPrevNode) {
	  var wasUpdated = currentNode.nextSibling === expectedNextNode && currentNode.previousSibling === expectedPrevNode;
	  var wasChanged = currentNode.nextSibling === startNode.nextSibling && currentNode.previousSibling === expectedPrevNode;
	  var wasRemoved = currentNode === startNode;

	  if (!wasUpdated && !wasChanged && !wasRemoved) {
	    throw new Error('There must be exactly one top level call corresponding ' + 'to the patched element.');
	  }
	};

	/**
	 * Updates the state of being in an attribute declaration.
	 * @param {boolean} value
	 * @return {boolean} the previous value.
	 */
	var setInAttributes = function (value) {
	  var previous = inAttributes;
	  inAttributes = value;
	  return previous;
	};

	/**
	 * Updates the state of being in a skip element.
	 * @param {boolean} value
	 * @return {boolean} the previous value.
	 */
	var setInSkip = function (value) {
	  var previous = inSkip;
	  inSkip = value;
	  return previous;
	};

	/**
	 * Copyright 2016 The Incremental DOM Authors. All Rights Reserved.
	 *
	 * Licensed under the Apache License, Version 2.0 (the "License");
	 * you may not use this file except in compliance with the License.
	 * You may obtain a copy of the License at
	 *
	 *      http://www.apache.org/licenses/LICENSE-2.0
	 *
	 * Unless required by applicable law or agreed to in writing, software
	 * distributed under the License is distributed on an "AS-IS" BASIS,
	 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	 * See the License for the specific language governing permissions and
	 * limitations under the License.
	 */

	/**
	 * @param {!Node} node
	 * @return {boolean} True if the node the root of a document, false otherwise.
	 */
	var isDocumentRoot = function (node) {
	  // For ShadowRoots, check if they are a DocumentFragment instead of if they
	  // are a ShadowRoot so that this can work in 'use strict' if ShadowRoots are
	  // not supported.
	  return node instanceof Document || node instanceof DocumentFragment;
	};

	/**
	 * @param {!Node} node The node to start at, inclusive.
	 * @param {?Node} root The root ancestor to get until, exclusive.
	 * @return {!Array<!Node>} The ancestry of DOM nodes.
	 */
	var getAncestry = function (node, root) {
	  var ancestry = [];
	  var cur = node;

	  while (cur !== root) {
	    ancestry.push(cur);
	    cur = cur.parentNode;
	  }

	  return ancestry;
	};

	/**
	 * @param {!Node} node
	 * @return {!Node} The root node of the DOM tree that contains node.
	 */
	var getRoot = function (node) {
	  var cur = node;
	  var prev = cur;

	  while (cur) {
	    prev = cur;
	    cur = cur.parentNode;
	  }

	  return prev;
	};

	/**
	 * @param {!Node} node The node to get the activeElement for.
	 * @return {?Element} The activeElement in the Document or ShadowRoot
	 *     corresponding to node, if present.
	 */
	var getActiveElement = function (node) {
	  var root = getRoot(node);
	  return isDocumentRoot(root) ? root.activeElement : null;
	};

	/**
	 * Gets the path of nodes that contain the focused node in the same document as
	 * a reference node, up until the root.
	 * @param {!Node} node The reference node to get the activeElement for.
	 * @param {?Node} root The root to get the focused path until.
	 * @return {!Array<Node>}
	 */
	var getFocusedPath = function (node, root) {
	  var activeElement = getActiveElement(node);

	  if (!activeElement || !node.contains(activeElement)) {
	    return [];
	  }

	  return getAncestry(activeElement, root);
	};

	/**
	 * Like insertBefore, but instead instead of moving the desired node, instead
	 * moves all the other nodes after.
	 * @param {?Node} parentNode
	 * @param {!Node} node
	 * @param {?Node} referenceNode
	 */
	var moveBefore = function (parentNode, node, referenceNode) {
	  var insertReferenceNode = node.nextSibling;
	  var cur = referenceNode;

	  while (cur !== node) {
	    var next = cur.nextSibling;
	    parentNode.insertBefore(cur, insertReferenceNode);
	    cur = next;
	  }
	};

	/** @type {?Context} */
	var context = null;

	/** @type {?Node} */
	var currentNode = null;

	/** @type {?Node} */
	var currentParent = null;

	/** @type {?Document} */
	var doc = null;

	/**
	 * @param {!Array<Node>} focusPath The nodes to mark.
	 * @param {boolean} focused Whether or not they are focused.
	 */
	var markFocused = function (focusPath, focused) {
	  for (var i = 0; i < focusPath.length; i += 1) {
	    getData(focusPath[i]).focused = focused;
	  }
	};

	/**
	 * Returns a patcher function that sets up and restores a patch context,
	 * running the run function with the provided data.
	 * @param {function((!Element|!DocumentFragment),!function(T),T=): ?Node} run
	 * @return {function((!Element|!DocumentFragment),!function(T),T=): ?Node}
	 * @template T
	 */
	var patchFactory = function (run) {
	  /**
	   * TODO(moz): These annotations won't be necessary once we switch to Closure
	   * Compiler's new type inference. Remove these once the switch is done.
	   *
	   * @param {(!Element|!DocumentFragment)} node
	   * @param {!function(T)} fn
	   * @param {T=} data
	   * @return {?Node} node
	   * @template T
	   */
	  var f = function (node, fn, data) {
	    var prevContext = context;
	    var prevDoc = doc;
	    var prevCurrentNode = currentNode;
	    var prevCurrentParent = currentParent;
	    var previousInAttributes = false;
	    var previousInSkip = false;

	    context = new Context();
	    doc = node.ownerDocument;
	    currentParent = node.parentNode;

	    if (process.env.NODE_ENV !== 'production') {
	      previousInAttributes = setInAttributes(false);
	      previousInSkip = setInSkip(false);
	    }

	    var focusPath = getFocusedPath(node, currentParent);
	    markFocused(focusPath, true);
	    var retVal = run(node, fn, data);
	    markFocused(focusPath, false);

	    if (process.env.NODE_ENV !== 'production') {
	      assertVirtualAttributesClosed();
	      setInAttributes(previousInAttributes);
	      setInSkip(previousInSkip);
	    }

	    context.notifyChanges();

	    context = prevContext;
	    doc = prevDoc;
	    currentNode = prevCurrentNode;
	    currentParent = prevCurrentParent;

	    return retVal;
	  };
	  return f;
	};

	/**
	 * Patches the document starting at node with the provided function. This
	 * function may be called during an existing patch operation.
	 * @param {!Element|!DocumentFragment} node The Element or Document
	 *     to patch.
	 * @param {!function(T)} fn A function containing elementOpen/elementClose/etc.
	 *     calls that describe the DOM.
	 * @param {T=} data An argument passed to fn to represent DOM state.
	 * @return {!Node} The patched node.
	 * @template T
	 */
	var patchInner = patchFactory(function (node, fn, data) {
	  currentNode = node;

	  enterNode();
	  fn(data);
	  exitNode();

	  if (process.env.NODE_ENV !== 'production') {
	    assertNoUnclosedTags(currentNode, node);
	  }

	  return node;
	});

	/**
	 * Patches an Element with the the provided function. Exactly one top level
	 * element call should be made corresponding to `node`.
	 * @param {!Element} node The Element where the patch should start.
	 * @param {!function(T)} fn A function containing elementOpen/elementClose/etc.
	 *     calls that describe the DOM. This should have at most one top level
	 *     element call.
	 * @param {T=} data An argument passed to fn to represent DOM state.
	 * @return {?Node} The node if it was updated, its replacedment or null if it
	 *     was removed.
	 * @template T
	 */
	var patchOuter = patchFactory(function (node, fn, data) {
	  var startNode = /** @type {!Element} */{ nextSibling: node };
	  var expectedNextNode = null;
	  var expectedPrevNode = null;

	  if (process.env.NODE_ENV !== 'production') {
	    expectedNextNode = node.nextSibling;
	    expectedPrevNode = node.previousSibling;
	  }

	  currentNode = startNode;
	  fn(data);

	  if (process.env.NODE_ENV !== 'production') {
	    assertPatchElementNoExtras(startNode, currentNode, expectedNextNode, expectedPrevNode);
	  }

	  if (node !== currentNode && node.parentNode) {
	    removeChild(currentParent, node, getData(currentParent).keyMap);
	  }

	  return startNode === currentNode ? null : currentNode;
	});

	/**
	 * Checks whether or not the current node matches the specified nodeName and
	 * key.
	 *
	 * @param {!Node} matchNode A node to match the data to.
	 * @param {?string} nodeName The nodeName for this node.
	 * @param {?string=} key An optional key that identifies a node.
	 * @return {boolean} True if the node matches, false otherwise.
	 */
	var matches = function (matchNode, nodeName, key) {
	  var data = getData(matchNode);

	  // Key check is done using double equals as we want to treat a null key the
	  // same as undefined. This should be okay as the only values allowed are
	  // strings, null and undefined so the == semantics are not too weird.
	  return nodeName === data.nodeName && key == data.key;
	};

	/**
	 * Aligns the virtual Element definition with the actual DOM, moving the
	 * corresponding DOM node to the correct location or creating it if necessary.
	 * @param {string} nodeName For an Element, this should be a valid tag string.
	 *     For a Text, this should be #text.
	 * @param {?string=} key The key used to identify this element.
	 */
	var alignWithDOM = function (nodeName, key) {
	  if (currentNode && matches(currentNode, nodeName, key)) {
	    return;
	  }

	  var parentData = getData(currentParent);
	  var currentNodeData = currentNode && getData(currentNode);
	  var keyMap = parentData.keyMap;
	  var node = undefined;

	  // Check to see if the node has moved within the parent.
	  if (key) {
	    var keyNode = keyMap[key];
	    if (keyNode) {
	      if (matches(keyNode, nodeName, key)) {
	        node = keyNode;
	      } else if (keyNode === currentNode) {
	        context.markDeleted(keyNode);
	      } else {
	        removeChild(currentParent, keyNode, keyMap);
	      }
	    }
	  }

	  // Create the node if it doesn't exist.
	  if (!node) {
	    if (nodeName === '#text') {
	      node = createText(doc);
	    } else {
	      node = createElement(doc, currentParent, nodeName, key);
	    }

	    if (key) {
	      keyMap[key] = node;
	    }

	    context.markCreated(node);
	  }

	  // Re-order the node into the right position, preserving focus if either
	  // node or currentNode are focused by making sure that they are not detached
	  // from the DOM.
	  if (getData(node).focused) {
	    // Move everything else before the node.
	    moveBefore(currentParent, node, currentNode);
	  } else if (currentNodeData && currentNodeData.key && !currentNodeData.focused) {
	    // Remove the currentNode, which can always be added back since we hold a
	    // reference through the keyMap. This prevents a large number of moves when
	    // a keyed item is removed or moved backwards in the DOM.
	    currentParent.replaceChild(node, currentNode);
	    parentData.keyMapValid = false;
	  } else {
	    currentParent.insertBefore(node, currentNode);
	  }

	  currentNode = node;
	};

	/**
	 * @param {?Node} node
	 * @param {?Node} child
	 * @param {?Object<string, !Element>} keyMap
	 */
	var removeChild = function (node, child, keyMap) {
	  node.removeChild(child);
	  context.markDeleted( /** @type {!Node}*/child);

	  var key = getData(child).key;
	  if (key) {
	    delete keyMap[key];
	  }
	};

	/**
	 * Clears out any unvisited Nodes, as the corresponding virtual element
	 * functions were never called for them.
	 */
	var clearUnvisitedDOM = function () {
	  var node = currentParent;
	  var data = getData(node);
	  var keyMap = data.keyMap;
	  var keyMapValid = data.keyMapValid;
	  var child = node.lastChild;
	  var key = undefined;

	  if (child === currentNode && keyMapValid) {
	    return;
	  }

	  while (child !== currentNode) {
	    removeChild(node, child, keyMap);
	    child = node.lastChild;
	  }

	  // Clean the keyMap, removing any unusued keys.
	  if (!keyMapValid) {
	    for (key in keyMap) {
	      child = keyMap[key];
	      if (child.parentNode !== node) {
	        context.markDeleted(child);
	        delete keyMap[key];
	      }
	    }

	    data.keyMapValid = true;
	  }
	};

	/**
	 * Changes to the first child of the current node.
	 */
	var enterNode = function () {
	  currentParent = currentNode;
	  currentNode = null;
	};

	/**
	 * @return {?Node} The next Node to be patched.
	 */
	var getNextNode = function () {
	  if (currentNode) {
	    return currentNode.nextSibling;
	  } else {
	    return currentParent.firstChild;
	  }
	};

	/**
	 * Changes to the next sibling of the current node.
	 */
	var nextNode = function () {
	  currentNode = getNextNode();
	};

	/**
	 * Changes to the parent of the current node, removing any unvisited children.
	 */
	var exitNode = function () {
	  clearUnvisitedDOM();

	  currentNode = currentParent;
	  currentParent = currentParent.parentNode;
	};

	/**
	 * Makes sure that the current node is an Element with a matching tagName and
	 * key.
	 *
	 * @param {string} tag The element's tag.
	 * @param {?string=} key The key used to identify this element. This can be an
	 *     empty string, but performance may be better if a unique value is used
	 *     when iterating over an array of items.
	 * @return {!Element} The corresponding Element.
	 */
	var coreElementOpen = function (tag, key) {
	  nextNode();
	  alignWithDOM(tag, key);
	  enterNode();
	  return (/** @type {!Element} */currentParent
	  );
	};

	/**
	 * Closes the currently open Element, removing any unvisited children if
	 * necessary.
	 *
	 * @return {!Element} The corresponding Element.
	 */
	var coreElementClose = function () {
	  if (process.env.NODE_ENV !== 'production') {
	    setInSkip(false);
	  }

	  exitNode();
	  return (/** @type {!Element} */currentNode
	  );
	};

	/**
	 * Makes sure the current node is a Text node and creates a Text node if it is
	 * not.
	 *
	 * @return {!Text} The corresponding Text Node.
	 */
	var coreText = function () {
	  nextNode();
	  alignWithDOM('#text', null);
	  return (/** @type {!Text} */currentNode
	  );
	};

	/**
	 * Gets the current Element being patched.
	 * @return {!Element}
	 */
	var currentElement = function () {
	  if (process.env.NODE_ENV !== 'production') {
	    assertInPatch('currentElement', context);
	    assertNotInAttributes('currentElement');
	  }
	  return (/** @type {!Element} */currentParent
	  );
	};

	/**
	 * @return {Node} The Node that will be evaluated for the next instruction.
	 */
	var currentPointer = function () {
	  if (process.env.NODE_ENV !== 'production') {
	    assertInPatch('currentPointer', context);
	    assertNotInAttributes('currentPointer');
	  }
	  return getNextNode();
	};

	/**
	 * Skips the children in a subtree, allowing an Element to be closed without
	 * clearing out the children.
	 */
	var skip = function () {
	  if (process.env.NODE_ENV !== 'production') {
	    assertNoChildrenDeclaredYet('skip', currentNode);
	    setInSkip(true);
	  }
	  currentNode = currentParent.lastChild;
	};

	/**
	 * Skips the next Node to be patched, moving the pointer forward to the next
	 * sibling of the current pointer.
	 */
	var skipNode = nextNode;

	/**
	 * Copyright 2015 The Incremental DOM Authors. All Rights Reserved.
	 *
	 * Licensed under the Apache License, Version 2.0 (the "License");
	 * you may not use this file except in compliance with the License.
	 * You may obtain a copy of the License at
	 *
	 *      http://www.apache.org/licenses/LICENSE-2.0
	 *
	 * Unless required by applicable law or agreed to in writing, software
	 * distributed under the License is distributed on an "AS-IS" BASIS,
	 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	 * See the License for the specific language governing permissions and
	 * limitations under the License.
	 */

	/** @const */
	var symbols = {
	  default: '__default'
	};

	/**
	 * @param {string} name
	 * @return {string|undefined} The namespace to use for the attribute.
	 */
	var getNamespace = function (name) {
	  if (name.lastIndexOf('xml:', 0) === 0) {
	    return 'http://www.w3.org/XML/1998/namespace';
	  }

	  if (name.lastIndexOf('xlink:', 0) === 0) {
	    return 'http://www.w3.org/1999/xlink';
	  }
	};

	/**
	 * Applies an attribute or property to a given Element. If the value is null
	 * or undefined, it is removed from the Element. Otherwise, the value is set
	 * as an attribute.
	 * @param {!Element} el
	 * @param {string} name The attribute's name.
	 * @param {?(boolean|number|string)=} value The attribute's value.
	 */
	var applyAttr = function (el, name, value) {
	  if (value == null) {
	    el.removeAttribute(name);
	  } else {
	    var attrNS = getNamespace(name);
	    if (attrNS) {
	      el.setAttributeNS(attrNS, name, value);
	    } else {
	      el.setAttribute(name, value);
	    }
	  }
	};

	/**
	 * Applies a property to a given Element.
	 * @param {!Element} el
	 * @param {string} name The property's name.
	 * @param {*} value The property's value.
	 */
	var applyProp = function (el, name, value) {
	  el[name] = value;
	};

	/**
	 * Applies a value to a style declaration. Supports CSS custom properties by
	 * setting properties containing a dash using CSSStyleDeclaration.setProperty.
	 * @param {CSSStyleDeclaration} style
	 * @param {!string} prop
	 * @param {*} value
	 */
	var setStyleValue = function (style, prop, value) {
	  if (prop.indexOf('-') >= 0) {
	    style.setProperty(prop, /** @type {string} */value);
	  } else {
	    style[prop] = value;
	  }
	};

	/**
	 * Applies a style to an Element. No vendor prefix expansion is done for
	 * property names/values.
	 * @param {!Element} el
	 * @param {string} name The attribute's name.
	 * @param {*} style The style to set. Either a string of css or an object
	 *     containing property-value pairs.
	 */
	var applyStyle = function (el, name, style) {
	  if (typeof style === 'string') {
	    el.style.cssText = style;
	  } else {
	    el.style.cssText = '';
	    var elStyle = el.style;
	    var obj = /** @type {!Object<string,string>} */style;

	    for (var prop in obj) {
	      if (has(obj, prop)) {
	        setStyleValue(elStyle, prop, obj[prop]);
	      }
	    }
	  }
	};

	/**
	 * Updates a single attribute on an Element.
	 * @param {!Element} el
	 * @param {string} name The attribute's name.
	 * @param {*} value The attribute's value. If the value is an object or
	 *     function it is set on the Element, otherwise, it is set as an HTML
	 *     attribute.
	 */
	var applyAttributeTyped = function (el, name, value) {
	  var type = typeof value;

	  if (type === 'object' || type === 'function') {
	    applyProp(el, name, value);
	  } else {
	    applyAttr(el, name, /** @type {?(boolean|number|string)} */value);
	  }
	};

	/**
	 * Calls the appropriate attribute mutator for this attribute.
	 * @param {!Element} el
	 * @param {string} name The attribute's name.
	 * @param {*} value The attribute's value.
	 */
	var updateAttribute = function (el, name, value) {
	  var data = getData(el);
	  var attrs = data.attrs;

	  if (attrs[name] === value) {
	    return;
	  }

	  var mutator = attributes[name] || attributes[symbols.default];
	  mutator(el, name, value);

	  attrs[name] = value;
	};

	/**
	 * A publicly mutable object to provide custom mutators for attributes.
	 * @const {!Object<string, function(!Element, string, *)>}
	 */
	var attributes = createMap();

	// Special generic mutator that's called for any attribute that does not
	// have a specific mutator.
	attributes[symbols.default] = applyAttributeTyped;

	attributes['style'] = applyStyle;

	/**
	 * The offset in the virtual element declaration where the attributes are
	 * specified.
	 * @const
	 */
	var ATTRIBUTES_OFFSET = 3;

	/**
	 * Builds an array of arguments for use with elementOpenStart, attr and
	 * elementOpenEnd.
	 * @const {Array<*>}
	 */
	var argsBuilder = [];

	/**
	 * @param {string} tag The element's tag.
	 * @param {?string=} key The key used to identify this element. This can be an
	 *     empty string, but performance may be better if a unique value is used
	 *     when iterating over an array of items.
	 * @param {?Array<*>=} statics An array of attribute name/value pairs of the
	 *     static attributes for the Element. These will only be set once when the
	 *     Element is created.
	 * @param {...*} var_args, Attribute name/value pairs of the dynamic attributes
	 *     for the Element.
	 * @return {!Element} The corresponding Element.
	 */
	var elementOpen = function (tag, key, statics, var_args) {
	  if (process.env.NODE_ENV !== 'production') {
	    assertNotInAttributes('elementOpen');
	    assertNotInSkip('elementOpen');
	  }

	  var node = coreElementOpen(tag, key);
	  var data = getData(node);

	  if (!data.staticsApplied) {
	    if (statics) {
	      for (var _i = 0; _i < statics.length; _i += 2) {
	        var name = /** @type {string} */statics[_i];
	        var value = statics[_i + 1];
	        updateAttribute(node, name, value);
	      }
	    }
	    // Down the road, we may want to keep track of the statics array to use it
	    // as an additional signal about whether a node matches or not. For now,
	    // just use a marker so that we do not reapply statics.
	    data.staticsApplied = true;
	  }

	  /*
	   * Checks to see if one or more attributes have changed for a given Element.
	   * When no attributes have changed, this is much faster than checking each
	   * individual argument. When attributes have changed, the overhead of this is
	   * minimal.
	   */
	  var attrsArr = data.attrsArr;
	  var newAttrs = data.newAttrs;
	  var isNew = !attrsArr.length;
	  var i = ATTRIBUTES_OFFSET;
	  var j = 0;

	  for (; i < arguments.length; i += 2, j += 2) {
	    var _attr = arguments[i];
	    if (isNew) {
	      attrsArr[j] = _attr;
	      newAttrs[_attr] = undefined;
	    } else if (attrsArr[j] !== _attr) {
	      break;
	    }

	    var value = arguments[i + 1];
	    if (isNew || attrsArr[j + 1] !== value) {
	      attrsArr[j + 1] = value;
	      updateAttribute(node, _attr, value);
	    }
	  }

	  if (i < arguments.length || j < attrsArr.length) {
	    for (; i < arguments.length; i += 1, j += 1) {
	      attrsArr[j] = arguments[i];
	    }

	    if (j < attrsArr.length) {
	      attrsArr.length = j;
	    }

	    /*
	     * Actually perform the attribute update.
	     */
	    for (i = 0; i < attrsArr.length; i += 2) {
	      var name = /** @type {string} */attrsArr[i];
	      var value = attrsArr[i + 1];
	      newAttrs[name] = value;
	    }

	    for (var _attr2 in newAttrs) {
	      updateAttribute(node, _attr2, newAttrs[_attr2]);
	      newAttrs[_attr2] = undefined;
	    }
	  }

	  return node;
	};

	/**
	 * Declares a virtual Element at the current location in the document. This
	 * corresponds to an opening tag and a elementClose tag is required. This is
	 * like elementOpen, but the attributes are defined using the attr function
	 * rather than being passed as arguments. Must be folllowed by 0 or more calls
	 * to attr, then a call to elementOpenEnd.
	 * @param {string} tag The element's tag.
	 * @param {?string=} key The key used to identify this element. This can be an
	 *     empty string, but performance may be better if a unique value is used
	 *     when iterating over an array of items.
	 * @param {?Array<*>=} statics An array of attribute name/value pairs of the
	 *     static attributes for the Element. These will only be set once when the
	 *     Element is created.
	 */
	var elementOpenStart = function (tag, key, statics) {
	  if (process.env.NODE_ENV !== 'production') {
	    assertNotInAttributes('elementOpenStart');
	    setInAttributes(true);
	  }

	  argsBuilder[0] = tag;
	  argsBuilder[1] = key;
	  argsBuilder[2] = statics;
	};

	/***
	 * Defines a virtual attribute at this point of the DOM. This is only valid
	 * when called between elementOpenStart and elementOpenEnd.
	 *
	 * @param {string} name
	 * @param {*} value
	 */
	var attr = function (name, value) {
	  if (process.env.NODE_ENV !== 'production') {
	    assertInAttributes('attr');
	  }

	  argsBuilder.push(name);
	  argsBuilder.push(value);
	};

	/**
	 * Closes an open tag started with elementOpenStart.
	 * @return {!Element} The corresponding Element.
	 */
	var elementOpenEnd = function () {
	  if (process.env.NODE_ENV !== 'production') {
	    assertInAttributes('elementOpenEnd');
	    setInAttributes(false);
	  }

	  var node = elementOpen.apply(null, argsBuilder);
	  argsBuilder.length = 0;
	  return node;
	};

	/**
	 * Closes an open virtual Element.
	 *
	 * @param {string} tag The element's tag.
	 * @return {!Element} The corresponding Element.
	 */
	var elementClose = function (tag) {
	  if (process.env.NODE_ENV !== 'production') {
	    assertNotInAttributes('elementClose');
	  }

	  var node = coreElementClose();

	  if (process.env.NODE_ENV !== 'production') {
	    assertCloseMatchesOpenTag(getData(node).nodeName, tag);
	  }

	  return node;
	};

	/**
	 * Declares a virtual Element at the current location in the document that has
	 * no children.
	 * @param {string} tag The element's tag.
	 * @param {?string=} key The key used to identify this element. This can be an
	 *     empty string, but performance may be better if a unique value is used
	 *     when iterating over an array of items.
	 * @param {?Array<*>=} statics An array of attribute name/value pairs of the
	 *     static attributes for the Element. These will only be set once when the
	 *     Element is created.
	 * @param {...*} var_args Attribute name/value pairs of the dynamic attributes
	 *     for the Element.
	 * @return {!Element} The corresponding Element.
	 */
	var elementVoid = function (tag, key, statics, var_args) {
	  elementOpen.apply(null, arguments);
	  return elementClose(tag);
	};

	/**
	 * Declares a virtual Text at this point in the document.
	 *
	 * @param {string|number|boolean} value The value of the Text.
	 * @param {...(function((string|number|boolean)):string)} var_args
	 *     Functions to format the value which are called only when the value has
	 *     changed.
	 * @return {!Text} The corresponding text node.
	 */
	var text = function (value, var_args) {
	  if (process.env.NODE_ENV !== 'production') {
	    assertNotInAttributes('text');
	    assertNotInSkip('text');
	  }

	  var node = coreText();
	  var data = getData(node);

	  if (data.text !== value) {
	    data.text = /** @type {string} */value;

	    var formatted = value;
	    for (var i = 1; i < arguments.length; i += 1) {
	      /*
	       * Call the formatter function directly to prevent leaking arguments.
	       * https://github.com/google/incremental-dom/pull/204#issuecomment-178223574
	       */
	      var fn = arguments[i];
	      formatted = fn(formatted);
	    }

	    node.data = formatted;
	  }

	  return node;
	};

	exports.patch = patchInner;
	exports.patchInner = patchInner;
	exports.patchOuter = patchOuter;
	exports.currentElement = currentElement;
	exports.currentPointer = currentPointer;
	exports.skip = skip;
	exports.skipNode = skipNode;
	exports.elementVoid = elementVoid;
	exports.elementOpenStart = elementOpenStart;
	exports.elementOpenEnd = elementOpenEnd;
	exports.elementOpen = elementOpen;
	exports.elementClose = elementClose;
	exports.text = text;
	exports.attr = attr;
	exports.symbols = symbols;
	exports.attributes = attributes;
	exports.applyAttr = applyAttr;
	exports.applyProp = applyProp;
	exports.notifications = notifications;
	exports.importNode = importNode;

	//# sourceMappingURL=incremental-dom-cjs.js.map
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(320)))

/***/ }
/******/ ]);
//# sourceMappingURL=app.bundle.js.map