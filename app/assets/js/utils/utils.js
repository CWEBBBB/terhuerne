Object.assign(_utils, (function (myApp) {
	const methods = {
		// Сравнение объектов и массивов по элементно (не по ссылке)
		deepCompare(obj1, obj2) {
			if (obj1 === obj2) return true;

			if (!isObject(obj1) && !isArray(obj1) ||
				!isObject(obj2) && !isArray(obj2)) return false;

			if (!isSameType(obj1, obj2) &&
				Object.keys(obj1).length !== Object.keys(obj2).length) return false;

			for (let key of Object.keys(obj1)) {
				if (!obj2.hasOwnProperty(key)) return false;

				if (!deepCompare(obj1[key], obj2[key])) return false;
			}

			return true;
		},

		// глубокое слияние объектов
		deepMerge(obj1, obj2) {
			if (!isObject(obj1) && !isArray(obj1) || !isSameType(obj1, obj2)) {
				if (isArray(obj2) || isObject(obj2)) {
					return deepCopy(obj2);
				}

				return obj2;
			} else if (isArray(obj1)) {
				return deepMergeArrays(obj1, obj2);
			} else {
				return deepMergeObject(obj1, obj2);
			}
		},

		toggleOverflowDocument(is) {
			if (is) {
				const scrollBarWidth = window.innerWidth - document.body.clientWidth;
				myApp.els.body.classList.add('is-overflow');
				myApp.els.body.style.paddingRight = scrollBarWidth + "px";
				myApp.els.body.style.overflow = 'hidden';
			} else {
				myApp.els.body.classList.remove('is-overflow');
				myApp.els.body.style.overflow = '';
				myApp.els.body.style.paddingRight = "";
			}
		},
		isElem(selector) {
			try {
				return document.querySelector(selector) ? true : false;
			} catch (error) {
				return selector instanceof Element;
			}
		},
		throttle(func, ms = 50) {
			let locked = false;

			return function () {
				if (locked) return;

				const context = this;
				const args = arguments;
				locked = true;

				setTimeout(() => {
					func.apply(context, args);
					locked = false;
				}, ms)
			}
		},
		// координаты элемента от верха документа
		getOffsetTop(node) {
			return window.pageYOffset + node.getBoundingClientRect().top;
		},
		isTouchDevice() {
			return 'ontouchstart' in window  // works on most browsers 
				|| navigator.maxTouchPoints // works on IE10/11 and Surface
				|| navigator.userAgent.toLowerCase().match(/mobile/i);   
		},
		isRunAnimation() {
			if (navigator.hardwareConcurrency) {
				return !methods.isTouchDevice() && navigator.hardwareConcurrency > 3;
			} else {
				return !methods.isTouchDevice();
			}
			
		},
		pageYOffsetByNodes (node) {
			const args = Array.from(arguments);
			let summHeight = 0;
		
			if (args.length != 0) {
				summHeight = args.reduce(function (accum, item) {
					return accum + item.offsetHeight;
				}, summHeight)
			}
		
			return window.pageYOffset + summHeight;
		}
	}

	function deepCopy(obj) {
		const result = isObject(obj) ? { ...obj } : [...obj];

		for (let key of Object.keys(obj)) {
			if (isObject(result[key]) || isArray(result[key])) {
				result[key] = deepCopy(result[key]);
				continue;
			}
		}

		return result;
	}

	function deepMergeArrays(arr1, arr2) {
		return deepCopy([...arr1, ...arr2]);
	};

	function deepMergeObject(obj1, obj2) {
		const result = deepCopy(obj1);

		for (let key of Object.keys(obj2)) {
			if (!result.hasOwnProperty(key)) {
				if (isObject(obj2[key])) {
					result[key] = deepCopy(obj2[key])
					continue;
				}

				if (isArray(obj2[key])) {
					result[key] = deepCopy(obj2[key])
					continue;
				}


				result[key] = obj2[key];
				continue;
			}

			result[key] = methods.deepMerge(result[key], obj2[key]);
		}

		return result;
	};

	function isArray(obj) {
		return Object.prototype.toString.call(obj) === '[object Array]';
	};

	function isObject(obj) {
		return Object.prototype.toString.call(obj) === '[object Object]';
	};

	function isSameType(item1, item2) {
		return Object.prototype.toString.call(item1) === Object.prototype.toString.call(item2);
	};
	

	return methods;
}(myApp)));