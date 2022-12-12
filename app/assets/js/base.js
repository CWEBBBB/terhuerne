
const myApp = {
	breakpoints: {
		xxl: 1920,
		xl: 1450,
		lg: 1230,
		md: 1024,
		sm: 768,
		xs: 480,
	},
	utils: {},
	plugins: {},
	els: {
		root: document.documentElement,
		get body() {
			return document.body
		},
		get header() {
			return this.root.querySelector('header') || this.root.querySelector('header') 
		}
	}
};

const _utils = myApp.utils;
const _plugins = myApp.plugins;