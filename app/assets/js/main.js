
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
_plugins.fixedElemTop = function (selector, options = {}) {
	const $el = typeof selector === 'string' ? document.querySelector(selector) : selector;
	const $startingPlace = document.createElement('div');
	if (options.classPlace) {
		$startingPlace.className = options.classPlace;
	}
	const $header = document.querySelector('header');
	$el.insertAdjacentElement('beforebegin', $startingPlace);

	window.addEventListener('scroll', _utils.throttle(
		function () {
			let pageYOffset = window.pageYOffset;
			let isFixedHeader = false;

			if (getComputedStyle($header).position === 'fixed') {
				pageYOffset = _utils.pageYOffsetByNodes($header);
				isFixedHeader = true;
			}

			if (pageYOffset > _utils.getOffsetTop($startingPlace)) {
				//$startingPlace.style.height = $el.offsetHeight + 'px';
				$el.classList.add('fixed');
				//$el.style.top = isFixedHeader ? $header.offsetHeight - 1 + 'px' : '';
			} else {
				//$startingPlace.style.height = '';
				$el.classList.remove('fixed');
			}
		}
	), 70)
};
//slider
_plugins.slider = function (selector, option = {}) {
	const $slider = (typeof selector === 'string') ? document.querySelector(selector) : selector;
	const $sliderWrap = $slider.closest('.slider');

	const setings = {
		navigation: $sliderWrap.querySelector('.slider__nav'),
		pagination: $sliderWrap.querySelector('.slider__pagination'),
		scrollbar: $sliderWrap.querySelector('.slider__scrollbar'),
		options: {
			watchOverflow: true,
			...option,
		}
	}

	Object.assign(setings.options, {
		watchSlidesVisibility: true,
		watchOverflow: true,
		autoplay: (+$slider.dataset.sliderAutoplay > 0) ? {
			delay: +$slider.dataset.sliderAutoplay,
			pauseOnMouseEnter: true,
			disableOnInteraction: false,
		} : '',
		navigation: setings.navigation ? {
			nextEl: $sliderWrap.querySelector('.slider__nav-btn--next'),
			prevEl: $sliderWrap.querySelector('.slider__nav-btn--prev'),
		} : '',
		scrollbar: setings.scrollbar ? {
			el: setings.scrollbar,
			draggable: true,
		} : '',
		pagination: setings.pagination ? {
			el: $sliderWrap.querySelector('.slider-pagination'),
			clickable: true,
		} : '',
	});

	return new Swiper($slider, setings.options);
};


/*
	burger js	
*/
(function (myApp) {
	const burgerEl = document.querySelector('.header__burger');
	const toggleBurgerClass = 'js-toggle-burger';
	const $togglerBurger = document.querySelector(`.${toggleBurgerClass}`);
	const mediaQuery = window.matchMedia(`(min-width: ${myApp.breakpoints.md + 1}px)`);
	let isOpen = false;

	mediaQuery.addListener(function () {
		if (mediaQuery.matches && burgerEl.classList.contains('open')) {
			toggleBurger($togglerBurger);
		}
	});
	//Hamburger открытия мобильного меню
	document.addEventListener('click', function (e) {
		const togglerEl = e.target.closest(`.${toggleBurgerClass}`);

		if (togglerEl) {
			toggleBurger(togglerEl);
		}
	});
	document.addEventListener('action:closeBurger', function () {
		if (isOpen) {
			toggleBurger($togglerBurger);
		}
	});

	function toggleBurger(togglerEl) {
		if (!togglerEl) return;

		togglerEl.classList.toggle('active');

		let isActive = togglerEl.classList.contains('active');
		isOpen = isActive;

		for (const toggler of document.querySelectorAll(`.${toggleBurgerClass}`)) {
			toggler.classList[isActive ? 'add' : 'remove']('active');
		}

		burgerEl.classList[isActive ? 'add' : 'remove']('open');
		myApp.els.root.classList[isActive ? 'add' : 'remove']('is-burger-open');
		myApp.utils.toggleOverflowDocument(isActive);

		if (isActive) {
			document.documentElement
				.dispatchEvent(new CustomEvent("action:closeSearch", {
					bubbles: true,
					cancelable: true
				}));
		}
	}
}(myApp));
(function() {
	if (!navigator.clipboard) return;

	const defaultText = 'Скопированно в буфер обмена';
	let instance;

	document.addEventListener('click', (e) => {
		if (e.target.closest('[data-copy]')) {
			const $target = e.target.closest('[data-copy]');

			if (instance) {
				instance.close();
			}

			navigator.clipboard.writeText($target.dataset.copy);			

			instance = UIkit.notification(defaultText, {
				pos: 'top-right',
				status: 'primary',
				timeout: 4700
			});
		}
	})
}());
(function (myApp) {
	$(document).on('click', '[data-counter-btn]', function() {
		const $this = $(this);
		const $input = $this.closest('.counter').find('.counter__input');
		let value = +$input.inputmask('unmaskedvalue');
		const step = +$input.attr('data-step') || 1;
        const min = $input.attr('min');
        const max = $input.attr('max');

        value = value + step * ($this.data('counter-btn') === "plus" ? 1 : -1);

        if (min !== 'undefined' && value < min) {
            value = min;
        }

        if (max !== 'undefined' && value > max) {
            value = max;
        }

		$input.val(value);
	});
}(myApp));
(function () {
	for (const $map of document.querySelectorAll('.map--blocked, .map--mob-blocked')) {
		// создаём элемент <div>, который будем перемещать вместе с указателем мыши пользователя
		let mapTitle = document.createElement('div');
		 mapTitle.className = 'mapTitle';
		// вписываем нужный нам текст внутрь элемента
		mapTitle.textContent = 'Для активации карты нажмите по ней';
		// добавляем элемент с подсказкой последним элементов внутрь нашего <div> с id $map
		$map.appendChild(mapTitle);
		// по клику на карту
		$map.onclick = function() {
			this.classList.remove('map--blocked');
			this.classList.remove('map--mob-blocked');
			// удаляем элемент с интерактивной подсказкой
			mapTitle.parentElement.removeChild(mapTitle);

			$map.onclick = null;
		}
		// по движению мыши в области карты
		$map.onmousemove = function(event) {
			// показываем подсказку
			mapTitle.style.display = 'block';
			// двигаем подсказку по области карты вместе с мышкой пользователя
			if(event.offsetY > 10) mapTitle.style.top = event.offsetY + 20 + 'px';
			if(event.offsetX > 10) mapTitle.style.left = event.offsetX + 20 + 'px';
		}
		// при уходе указателя мыши с области карты
		$map.onmouseleave = function() {
			// прячем подсказку
			mapTitle.style.display = 'none';
		}
	}
}());
(function() {
	let broMenuInstance;
	const mediaQuery = window.matchMedia(`(max-width: ${myApp.breakpoints.md}px)`);

	const toggleBroMenu = function () {
		if (mediaQuery.matches) {
			broMenuInstance.init();
		} else {
			broMenuInstance.destroy();
		}
	};

	mediaQuery.addListener(toggleBroMenu);

	broMenuInstance = broMenu('.menu');
	toggleBroMenu();

	//slinky menu
	function broMenu(selector, options) {
		const $menu = typeof selector === "string" ? document.querySelector(selector) : selector;
		const $containerMenu = $menu.querySelector('ul');
		const $level_1 = $menu.lastElementChild;
		const $subMenuList = $containerMenu .querySelectorAll('ul');
		const $subMenuLinks = $menu.querySelectorAll('li > a');
		let activated;

		let defaulOptions = {
			nextBtn: '.bro-menu__next-arr',
			arrow: `
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
			<path d="M12.219 2.281L10.78 3.72 18.062 11H2v2h16.063l-7.282 7.281 1.438 1.438 9-9 .687-.719-.687-.719z" />
			</svg>
		`
		}

		Object.assign(defaulOptions, options);

		let $activeUl;
		let translate = 0;

		const method = {
			init() {
				if (activated) return;

				$menu.classList.add('bro-menu');
				$containerMenu.classList.add('bro-menu__container');

				for (let submenu of $subMenuList) {
					const parentLi = submenu.closest('li');
					const link = parentLi.querySelector('li > a');
					submenu.classList.add('bro-menu__submenu');
					link.classList.add('bro-menu__next');

					_addBtnBack(submenu, link);
					_addBtnNext(link);

					activated = true;
				}

				for (const $link of $subMenuLinks) {
					$link.classList.add('active');
				}

				$menu.addEventListener('click', clickHandler);

				window.addEventListener('resize', _setHeighMenu);
			},

			destroy() {
				if (!activated) return;

				const $arrNodes = $menu.querySelectorAll('.bro-menu__arr');

				$menu.removeEventListener('click', clickHandler);
				window.removeEventListener('resize', _setHeighMenu);

				for (const $link of $menu.querySelectorAll('.link')) {
					if ($link.classList.contains('bro-menu__back')) {
						$link.closest('li').remove();
						continue;
					}

					for (const $arr of $arrNodes) {
						$arr.remove();
					}

					$link.classList.remove('link');
					$link.classList.remove('bro-menu__next');
				}

				for (let $submenu of $subMenuList) {
					$submenu.classList.remove('bro-menu__submenu');				
					$submenu.style.visibility = '';
				}

				$activeUl && $activeUl.classList.remove('active');
				$menu.classList.remove('bro-menu');
				$containerMenu.classList.remove('bro-menu__container')

				$menu.style.height = '';
				$level_1.style.transform = ``;
				translate = 0;
				activated = false;
			}
		}

		function clickHandler(e) {
			const target = e.target;

			if (target.closest(defaulOptions.nextBtn)) {
				e.preventDefault();

				const $nestedMenu = target.closest('li').querySelector('ul');

				if ($activeUl) $activeUl.classList.remove('active');

				$nestedMenu.classList.add('active');
				$nestedMenu.style.visibility = 'visible';
				translate -= 100;

				$level_1.style.transform = `translateX(${translate}%)`;
				$activeUl = $nestedMenu;

				scrollToVisible($activeUl);
				_setHeighMenu();
			}
			else if (target.closest('.bro-menu__back')) {
				e.preventDefault();

				const $upperMenu = $activeUl.parentElement.closest('ul');
				$upperMenu.classList.add('active');

				$activeUl.style.visibility = '';

				translate += 100;

				$level_1.style.transform = `translateX(${translate}%)`;
				$activeUl.classList.remove('active');
				$activeUl = $upperMenu;
				_setHeighMenu();
			}
		}

		function _addBtnNext(elem) {
			elem.classList.add('link')
			elem.insertAdjacentHTML('beforeend', `
				<span class="bro-menu__next-arr">
					${defaulOptions.arrow}
				</span>
			`);

			elem.lastElementChild.classList.add('bro-menu__arr');
		}

		function _addBtnBack(elem, link) {
			const href = link.getAttribute('href');

			elem.insertAdjacentHTML('afterbegin', `
			<li>
				<a class="bro-menu__back link">
					${defaulOptions.arrow}
					${link.textContent}
				</a>
			</li>
		`);
		}

		function _setHeighMenu() {
			if (!$activeUl) return;

			$menu.style.height = $activeUl.offsetHeight + "px";
		}

		function scrollToVisible(el) {
			if (_getPosAbsWindow(el) > window.pageYOffset) return;

			backToTop(-10, _getPos(el));
		}

		function _getPosAbsWindow(elem) {
			const offsetTop = elem.getBoundingClientRect().top;

			return offsetTop - window.pageYOffset;
		}

		function _getPos(el) {
			return el.getBoundingClientRect().top + window.pageYOffset;
		}

		function backToTop(interval, to) {
			if (window.pageYOffset <= to) return;

			window.scrollBy(0, interval);
			setTimeout(() => {
				backToTop(interval, to)
			}, 0);
		}

		return method;
	}
}());
/*
	primary js	
*/
window.addEventListener('DOMContentLoaded', function (e) {
	/* block code */
	{
		if (document.querySelector('header')) {
			const headerEl = document.querySelector('header');

			const setVariableHeightHeader = (el) => {
				if (el) {
					document.documentElement.style.setProperty("--header-height", headerEl.offsetHeight + "px");
				}
			}

			setTimeout(() => { setVariableHeightHeader(headerEl) }, 0);

			['resize', 'load'].forEach(listener => {
				window.addEventListener(listener, function () {
					setVariableHeightHeader(headerEl);
				});
			});
		}
	}
});
// search
if (document.querySelector('[data-search-toggle]') && document.querySelector('[data-search-panel]')) {
	const $html = document.documentElement;
	const $searchPanel = document.querySelector('[data-search-panel]');
	const $input = $searchPanel.querySelector('input[type="search"]');
	const $clearBtn = $searchPanel.querySelector('[data-search-clear]');
	const closePanelSelector = '[data-search-close]';
	const searchBtnSelector = '[data-search-toggle]';
	const toggleClass = 'is-open';
	const $togglers = document.querySelectorAll(searchBtnSelector);
	let isOpen = false;

	document.addEventListener('click', function (e) {
		let $target = e.target;

		if ($target.closest(searchBtnSelector)) {
			$target = $target.closest(searchBtnSelector);

			$searchPanel.classList.toggle(toggleClass);

			if ($searchPanel.classList.contains(toggleClass)) {
				isOpen = true;

				if ($input) $input.focus();
				toggleOverflowDocument(true);
				for (const $toggle of $togglers) {
					$toggle.classList.add('active');
				}

				document.documentElement
					.dispatchEvent(new CustomEvent("action:closeBurger", {
						bubbles: true,
						cancelable: true
					}));
			} else {
				closeSearchPanel();
			}
		} else if ($clearBtn.contains(e.target)) {
			$input.value = "";
			$input.focus();
			$clearBtn.classList.remove('is-clear');
		} else if (e.target.closest(closePanelSelector)) {
			closeSearchPanel();
		}
	});

	document.addEventListener('action:closeSearch', function () {
		if (isOpen) {
			closeSearchPanel();
		}
	});

	$input.addEventListener('keyup', function (e) {
		if (this.value.length !== 0) {
			$clearBtn.classList.add('is-clear');
		} else {
			$clearBtn.classList.remove('is-clear');
		}
	});

	function closeSearchPanel() {
		isOpen = false;

		$searchPanel.classList.remove(toggleClass);
		$input.value = '';
		$clearBtn.classList.remove('is-clear');
		toggleOverflowDocument(false);

		for (const $toggle of $togglers) {
			$toggle.classList.remove('active');
		}
	}

	function toggleOverflowDocument(is) {
		if (is) {
			const scrollBarWidth = window.innerWidth - document.body.offsetWidth;
			$html.style.overflow = 'hidden';
			$html.style.paddingRight = scrollBarWidth + "px";
			$html.classList.add('is-overflow');
		} else {
			$html.classList.remove('is-overflow');
			$html.style.overflow = '';
			$html.style.paddingRight = "";
		}
	}
}
(function() {
	function findIndex($obj, $item) {
		let index = null;

		$obj.each((i, item) => {
			if (item === $item[0]) {
				index = i;
			}
		});
		
		return index;
	}

	function initTabsItem($tabs, $tabsItemActive) {
		const dataTabs = $tabs.attr('data-tabs');

		if (dataTabs) {
			const $itemsTabs = $tabs.find('[data-tab]');

			$itemsTabs.each(function(i) {
				const $sectionsTabs = $(`[data-tabs="${dataTabs}, ${i}"]`);
				const index = findIndex($itemsTabs, $tabsItemActive);
				const $unloadedSrc = $sectionsTabs.find('[data-src]'); 

				if (index !== i) {
					$sectionsTabs.attr('hidden', true);
				} else {
					$(`[data-tabs="${dataTabs}, ${index}"]`).removeAttr('hidden');

					if ($unloadedSrc.length) {
						$unloadedSrc.each((i, item) => {
							const src = $(item).data('src');
							
							$(item).attr('src', src).removeAttr('data-src');
						});
					}
				}
			});
		}
	
		$tabs[0].dispatchEvent(new CustomEvent("tabs:change", {bubbles: true, cancelable: true}));
	}
	
	$('.tabs').each(function(i) {
		const $tabs = $(this);
		let $tabsItemActive = $tabs.find('[data-tab].active');
	
		if ($tabsItemActive.length !== 1) {
			const $tabsItems = $tabs.find('[data-tab]');
	
			$tabsItems.removeClass('active');
			$tabsItems.eq(0).addClass('active');
			$tabsItemActive = $tabsItems.eq(0);
		}
	
		initTabsItem($tabs, $tabsItemActive);

		this.dispatchEvent(new CustomEvent("tabs:init", {bubbles: true, cancelable: true}));
	});
	
	$(document).on('click', '[data-tab]', function() {
		const $tabsItem = $(this);
		const $tabs = $tabsItem.closest('[data-tabs]');
		const $tabsItems = $tabs.find('[data-tab]');
	
		$tabsItems.not($tabsItem).removeClass('active');
		$tabsItem.addClass('active');
		console.log($tabs[0]);
		initTabsItem($tabs, $tabsItem);
	});
}());
window.addEventListener('DOMContentLoaded', function () {
	// btn top 
	if (_utils.isElem('.js-top')) {
		const btnEl = document.querySelector('.js-top');

		window.addEventListener('scroll', _utils.throttle(function () {
			if (window.pageYOffset > (window.innerHeight / 2)) {
				btnEl.classList.add('visible');
			} else if (window.pageYOffset < (window.innerHeight / 2) && btnEl.classList.contains('visible')) {
				btnEl.classList.remove('visible');
			}
		}, 200));
	}

	//fixed header
	if (document.querySelector('header')) {
		showHeader('header');

		function showHeader(el) {
			const $el = (typeof el === 'string') ? document.querySelector(el) : el;
			let scrolling = window.pageYOffset;
			let fixingIndent = $el.offsetHeight + 20;
			let isFix = false;
			let isShow = false;

			scrollHandler();

			window.addEventListener('scroll', _utils.throttle(scrollHandler, 100));

			window.addEventListener('resize', function () {
				fixingIndent = $el.offsetHeight + 20;
			})

			function scrollHandler() {
				toggleShow();
				toggleFix();
			}

			function toggleShow() {
				if (scrolling > window.pageYOffset && !isShow) {
					$el.classList.add('show');
					isShow = true;
				} else if (scrolling < window.pageYOffset && isShow) {
					$el.classList.remove('show');
					isShow = false;
				}

				scrolling = window.pageYOffset;
			}

			function toggleFix() {
				if (window.pageYOffset > fixingIndent) {
					if (isFix) return;

					$el.classList.add('fixed');
					isFix = true;
				} else if (window.pageYOffset < fixingIndent) {
					if (!isFix) return;

					$el.classList.remove('fixed');
					isFix = false;
				}
			}
		}
	}

	if ($(".filters").length) {
		const $filtersBlock = $(".filters");

		$filtersBlock.on("click", function (e) {
			let targeEl = e.target;

			if (targeEl.closest('.filters__fieldset-title')) {
				const $parent = $(targeEl).closest(".filters__fieldset");
				const $innerField = $parent.find('.filters__fieldset-box');

				if ($parent.hasClass("filters__fieldset--unopened")) {
					$parent.removeClass("filters__fieldset--unopened");
				} else {
					$parent.addClass("filters__fieldset--unopened");
				}

				$innerField.slideToggle(300);
			}
		})
	}

	/// mobile filters toggle 
	if (_utils.isElem('.js-toggle-filters')) {
		const $filterEl = document.querySelector('.js-modal-filters');
		const toggleFiltersClass = 'js-toggle-filters';
		const openFiltersClass = 'open';

		document.addEventListener('click', function (e) {
			if (e.target.closest(`.${toggleFiltersClass}`) && $filterEl) {
				$filterEl.classList.toggle(openFiltersClass);

				_utils.toggleOverflowDocument($filterEl.classList.contains(openFiltersClass));
			}
		})
	}

	// product gallery
	if (_utils.isElem('.gallery')) {
		for (const galleryEl of document.querySelectorAll('.gallery')) {
			gallery(galleryEl);
		}

		function gallery($el) {
			const $fullSlider = $el.querySelector('.gallery__slider');
			const $thumbsSlider = $el.querySelector('.gallery__thumbs');

			/* thumbs */
			let galleryThumbs = _plugins.slider($thumbsSlider, {
				spaceBetween: 12,
				slidesPerView: "auto",
				watchSlidesProgress: true,
				freeMode: {
					enabled: true,
					sticky: true,
				},
				breakpoints: {
					300: {
						spaceBetween: 12,
					},
					[myApp.breakpoints.sm]: {
						spaceBetween: 22,
					}
				},
				keyboard: {
					enabled: true,
					onlyInViewport: false
				},
				mousewheel: true,
			});

			let galleryFull = new _plugins.slider($fullSlider, {
				spaceBetween: 10,
				slidesPerView: "auto",
				lazy: {
					loadPrevNext: true,
				},
				thumbs: {
					swiper: galleryThumbs,
				}
			});
		}
	}

	Array.prototype.forEach.call(document.querySelectorAll('[data-visible-items]'), (containerEl) => {
		const generalWrapEl = containerEl.parentElement;
		const togglerEl = document.querySelector('.js-toggler-visible');
		const count = parseInt(containerEl.dataset.visibleItems);
		const hiddenEls = [];

		if (!togglerEl) return;

		if (containerEl.children.length <= count) {
			togglerEl.hidden = true;
		} else {
			Array.from(containerEl.children).forEach((item, i) => {
				if (i < count) return;

				hiddenEls.push(item);
				item.hidden = true;
			});
		}

		togglerEl.addEventListener('click', function() {
			this.classList.toggle('active');
			hiddenEls.forEach(item => item.hidden = !this.classList.contains('active'));
		});
	});

	if (document.querySelector('.sort')) {
		const sort = document.querySelector('.sort');
		const valueSort = sort.querySelector('.sort__val');
		const activeItem = sort.querySelector('.sort__val.active');
		const toggleClass = 'j-sort-toggle';

		if (activeItem) {
			valueSort.textContent = activeItem.textContent;
		}

		document.addEventListener('click', function (e) {
			if (e.target.closest(`.${toggleClass}`)) {
				sort.classList.toggle('active');
			} else if (e.target.closest('.sort__item')) {
				const sortItem = e.target.closest('.sort__item');

				if (sortItem.classList.contains('active')) return;

				valueSort.textContent = sortItem.textContent;
			}

			if (!e.target.closest(`.${toggleClass}`)) {
				sort.classList.remove('active');
			}
		});
	}

	// фиксация навигации продукта
	if (_utils.isElem('.nav-panel')) {
		const $header = document.querySelector('header');
		const $navPanel = document.querySelector('.nav-panel');

		_plugins.fixedElemTop($navPanel, {
			classPlace: 'nav-panel-place'
		});

		const navLinkSelector = '[href*="#"]';
		const $navLinks = $navPanel.querySelectorAll(navLinkSelector);
		const sections = [];
		let indexActiveLink = null;

		for (const $navLink of $navLinks) {
			const hash = $navLink.hash;
			const section = document.querySelector(hash);

			if (section) {
				sections.push(document.querySelector(hash));
			}
		}

		if (sections.length === 0) return;

		setActiveLinkByScroll();

		window.addEventListener('scroll', setActiveLinkByScroll);

		$navPanel.addEventListener('click', function (e) {
			const link = e.target.closest('a[href*="#"]');

			if (!link) return;

			e.preventDefault();
			const sectionId = link.getAttribute('href');
			const section = document.querySelector(sectionId);

			if (!section) return;

			const sectionOffsetTop = _utils.getOffsetTop(section);

			let scrollPoint = sectionOffsetTop + 10;

			if (window.innerWidth > myApp.breakpoints.sm) {
				scrollPoint -= $navPanel.offsetHeight;
			}

			if ($header) {
				scrollPoint = scrollPoint - $header.offsetHeight;
			}

			window.scrollTo(0, scrollPoint);
		})

		function setActiveLinkByScroll() {
			const topSections = sections.map($section => {
				return _utils.getOffsetTop($section) - window.innerHeight * 0.18;
			});

			let currentActiveIndex = null;
			const firstSectionTopCoords = topSections[0];
			const lastSectionBottomCoords = topSections[topSections.length - 1] + sections[topSections.length - 1].offsetHeight;

			let offsetTopByNodes = _utils.pageYOffsetByNodes($navPanel);

			if ($header) {
				offsetTopByNodes = _utils.pageYOffsetByNodes($navPanel, $header);
			}

			if (offsetTopByNodes < firstSectionTopCoords || offsetTopByNodes > lastSectionBottomCoords) {
				if (indexActiveLink === null) return;

				$navLinks[indexActiveLink].classList.remove('active');
				indexActiveLink = null;
				return;
			}

			for (let i = 0; i < topSections.length; i++) {
				if (offsetTopByNodes > topSections[i]) {
					currentActiveIndex = i;
				}
			}

			if (indexActiveLink !== currentActiveIndex) {
				indexActiveLink = currentActiveIndex;
				changeNavActive($navLinks[indexActiveLink])
			}
		}

		function changeNavActive(newNavLinkNode) {
			for (let i = 0; i < $navLinks.length; i++) {
				$navLinks[i].classList.remove('active');
			}

			newNavLinkNode.classList.add('active');
		}
	}

	// tel mask
	if (document.querySelector('input[type="tel"]')) {
		const inputsTel = document.querySelectorAll('input[type="tel"]');

		const im = new Inputmask('+7 (999) 999-99-99', {
			positionCaretOnClick: "none"
		});
		im.mask(inputsTel);

		// for (const inputTel of inputsTel) {
		// 	completeTelHandler(inputTel);
		// }

		// $(document).on('input', 'input[type="tel"]', function () {
		// 	completeTelHandler(this);
		// });

		// function completeTelHandler(inputTelNode) {
		// 	const isComplete = $(inputTelNode).inputmask("isComplete");
		// 	const fieldEl = inputTelNode.closest('.field');
		// 	const notifyEl = fieldEl.querySelector(".field__notify");

		// 	fieldEl.classList[isComplete ? "remove" : "add"]("field--error");
		// 	notifyEl.hidden = isComplete;
		// };
	}
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImJhc2UuanMiLCJ1dGlscy5qcyIsImZpeGVkRWxlbWVudC5qcyIsInNsaWRlci5qcyIsInRhYnMuanMiLCJidXJnZXIuanMiLCJjb3B5aW5nLmpzIiwiY291bnRlci5qcyIsIm1hcC5qcyIsIm1lbnUuanMiLCJwcmltYXJ5LmpzIiwic2VhcmNoLXBhbmVsLmpzIiwiaW5kZXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMvSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdkNBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDckRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNoQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDeE1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QVByRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBUXRFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIlxyXG5jb25zdCBteUFwcCA9IHtcclxuXHRicmVha3BvaW50czoge1xyXG5cdFx0eHhsOiAxOTIwLFxyXG5cdFx0eGw6IDE0NTAsXHJcblx0XHRsZzogMTIzMCxcclxuXHRcdG1kOiAxMDI0LFxyXG5cdFx0c206IDc2OCxcclxuXHRcdHhzOiA0ODAsXHJcblx0fSxcclxuXHR1dGlsczoge30sXHJcblx0cGx1Z2luczoge30sXHJcblx0ZWxzOiB7XHJcblx0XHRyb290OiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQsXHJcblx0XHRnZXQgYm9keSgpIHtcclxuXHRcdFx0cmV0dXJuIGRvY3VtZW50LmJvZHlcclxuXHRcdH0sXHJcblx0XHRnZXQgaGVhZGVyKCkge1xyXG5cdFx0XHRyZXR1cm4gdGhpcy5yb290LnF1ZXJ5U2VsZWN0b3IoJ2hlYWRlcicpIHx8IHRoaXMucm9vdC5xdWVyeVNlbGVjdG9yKCdoZWFkZXInKSBcclxuXHRcdH1cclxuXHR9XHJcbn07XHJcblxyXG5jb25zdCBfdXRpbHMgPSBteUFwcC51dGlscztcclxuY29uc3QgX3BsdWdpbnMgPSBteUFwcC5wbHVnaW5zOyIsIk9iamVjdC5hc3NpZ24oX3V0aWxzLCAoZnVuY3Rpb24gKG15QXBwKSB7XHJcblx0Y29uc3QgbWV0aG9kcyA9IHtcclxuXHRcdC8vINCh0YDQsNCy0L3QtdC90LjQtSDQvtCx0YrQtdC60YLQvtCyINC4INC80LDRgdGB0LjQstC+0LIg0L/QviDRjdC70LXQvNC10L3RgtC90L4gKNC90LUg0L/QviDRgdGB0YvQu9C60LUpXHJcblx0XHRkZWVwQ29tcGFyZShvYmoxLCBvYmoyKSB7XHJcblx0XHRcdGlmIChvYmoxID09PSBvYmoyKSByZXR1cm4gdHJ1ZTtcclxuXHJcblx0XHRcdGlmICghaXNPYmplY3Qob2JqMSkgJiYgIWlzQXJyYXkob2JqMSkgfHxcclxuXHRcdFx0XHQhaXNPYmplY3Qob2JqMikgJiYgIWlzQXJyYXkob2JqMikpIHJldHVybiBmYWxzZTtcclxuXHJcblx0XHRcdGlmICghaXNTYW1lVHlwZShvYmoxLCBvYmoyKSAmJlxyXG5cdFx0XHRcdE9iamVjdC5rZXlzKG9iajEpLmxlbmd0aCAhPT0gT2JqZWN0LmtleXMob2JqMikubGVuZ3RoKSByZXR1cm4gZmFsc2U7XHJcblxyXG5cdFx0XHRmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMob2JqMSkpIHtcclxuXHRcdFx0XHRpZiAoIW9iajIuaGFzT3duUHJvcGVydHkoa2V5KSkgcmV0dXJuIGZhbHNlO1xyXG5cclxuXHRcdFx0XHRpZiAoIWRlZXBDb21wYXJlKG9iajFba2V5XSwgb2JqMltrZXldKSkgcmV0dXJuIGZhbHNlO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRyZXR1cm4gdHJ1ZTtcclxuXHRcdH0sXHJcblxyXG5cdFx0Ly8g0LPQu9GD0LHQvtC60L7QtSDRgdC70LjRj9C90LjQtSDQvtCx0YrQtdC60YLQvtCyXHJcblx0XHRkZWVwTWVyZ2Uob2JqMSwgb2JqMikge1xyXG5cdFx0XHRpZiAoIWlzT2JqZWN0KG9iajEpICYmICFpc0FycmF5KG9iajEpIHx8ICFpc1NhbWVUeXBlKG9iajEsIG9iajIpKSB7XHJcblx0XHRcdFx0aWYgKGlzQXJyYXkob2JqMikgfHwgaXNPYmplY3Qob2JqMikpIHtcclxuXHRcdFx0XHRcdHJldHVybiBkZWVwQ29weShvYmoyKTtcclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdHJldHVybiBvYmoyO1xyXG5cdFx0XHR9IGVsc2UgaWYgKGlzQXJyYXkob2JqMSkpIHtcclxuXHRcdFx0XHRyZXR1cm4gZGVlcE1lcmdlQXJyYXlzKG9iajEsIG9iajIpO1xyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdHJldHVybiBkZWVwTWVyZ2VPYmplY3Qob2JqMSwgb2JqMik7XHJcblx0XHRcdH1cclxuXHRcdH0sXHJcblxyXG5cdFx0dG9nZ2xlT3ZlcmZsb3dEb2N1bWVudChpcykge1xyXG5cdFx0XHRpZiAoaXMpIHtcclxuXHRcdFx0XHRjb25zdCBzY3JvbGxCYXJXaWR0aCA9IHdpbmRvdy5pbm5lcldpZHRoIC0gZG9jdW1lbnQuYm9keS5jbGllbnRXaWR0aDtcclxuXHRcdFx0XHRteUFwcC5lbHMuYm9keS5jbGFzc0xpc3QuYWRkKCdpcy1vdmVyZmxvdycpO1xyXG5cdFx0XHRcdG15QXBwLmVscy5ib2R5LnN0eWxlLnBhZGRpbmdSaWdodCA9IHNjcm9sbEJhcldpZHRoICsgXCJweFwiO1xyXG5cdFx0XHRcdG15QXBwLmVscy5ib2R5LnN0eWxlLm92ZXJmbG93ID0gJ2hpZGRlbic7XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0bXlBcHAuZWxzLmJvZHkuY2xhc3NMaXN0LnJlbW92ZSgnaXMtb3ZlcmZsb3cnKTtcclxuXHRcdFx0XHRteUFwcC5lbHMuYm9keS5zdHlsZS5vdmVyZmxvdyA9ICcnO1xyXG5cdFx0XHRcdG15QXBwLmVscy5ib2R5LnN0eWxlLnBhZGRpbmdSaWdodCA9IFwiXCI7XHJcblx0XHRcdH1cclxuXHRcdH0sXHJcblx0XHRpc0VsZW0oc2VsZWN0b3IpIHtcclxuXHRcdFx0dHJ5IHtcclxuXHRcdFx0XHRyZXR1cm4gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihzZWxlY3RvcikgPyB0cnVlIDogZmFsc2U7XHJcblx0XHRcdH0gY2F0Y2ggKGVycm9yKSB7XHJcblx0XHRcdFx0cmV0dXJuIHNlbGVjdG9yIGluc3RhbmNlb2YgRWxlbWVudDtcclxuXHRcdFx0fVxyXG5cdFx0fSxcclxuXHRcdHRocm90dGxlKGZ1bmMsIG1zID0gNTApIHtcclxuXHRcdFx0bGV0IGxvY2tlZCA9IGZhbHNlO1xyXG5cclxuXHRcdFx0cmV0dXJuIGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0XHRpZiAobG9ja2VkKSByZXR1cm47XHJcblxyXG5cdFx0XHRcdGNvbnN0IGNvbnRleHQgPSB0aGlzO1xyXG5cdFx0XHRcdGNvbnN0IGFyZ3MgPSBhcmd1bWVudHM7XHJcblx0XHRcdFx0bG9ja2VkID0gdHJ1ZTtcclxuXHJcblx0XHRcdFx0c2V0VGltZW91dCgoKSA9PiB7XHJcblx0XHRcdFx0XHRmdW5jLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xyXG5cdFx0XHRcdFx0bG9ja2VkID0gZmFsc2U7XHJcblx0XHRcdFx0fSwgbXMpXHJcblx0XHRcdH1cclxuXHRcdH0sXHJcblx0XHQvLyDQutC+0L7RgNC00LjQvdCw0YLRiyDRjdC70LXQvNC10L3RgtCwINC+0YIg0LLQtdGA0YXQsCDQtNC+0LrRg9C80LXQvdGC0LBcclxuXHRcdGdldE9mZnNldFRvcChub2RlKSB7XHJcblx0XHRcdHJldHVybiB3aW5kb3cucGFnZVlPZmZzZXQgKyBub2RlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnRvcDtcclxuXHRcdH0sXHJcblx0XHRpc1RvdWNoRGV2aWNlKCkge1xyXG5cdFx0XHRyZXR1cm4gJ29udG91Y2hzdGFydCcgaW4gd2luZG93ICAvLyB3b3JrcyBvbiBtb3N0IGJyb3dzZXJzIFxyXG5cdFx0XHRcdHx8IG5hdmlnYXRvci5tYXhUb3VjaFBvaW50cyAvLyB3b3JrcyBvbiBJRTEwLzExIGFuZCBTdXJmYWNlXHJcblx0XHRcdFx0fHwgbmF2aWdhdG9yLnVzZXJBZ2VudC50b0xvd2VyQ2FzZSgpLm1hdGNoKC9tb2JpbGUvaSk7ICAgXHJcblx0XHR9LFxyXG5cdFx0aXNSdW5BbmltYXRpb24oKSB7XHJcblx0XHRcdGlmIChuYXZpZ2F0b3IuaGFyZHdhcmVDb25jdXJyZW5jeSkge1xyXG5cdFx0XHRcdHJldHVybiAhbWV0aG9kcy5pc1RvdWNoRGV2aWNlKCkgJiYgbmF2aWdhdG9yLmhhcmR3YXJlQ29uY3VycmVuY3kgPiAzO1xyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdHJldHVybiAhbWV0aG9kcy5pc1RvdWNoRGV2aWNlKCk7XHJcblx0XHRcdH1cclxuXHRcdFx0XHJcblx0XHR9LFxyXG5cdFx0cGFnZVlPZmZzZXRCeU5vZGVzIChub2RlKSB7XHJcblx0XHRcdGNvbnN0IGFyZ3MgPSBBcnJheS5mcm9tKGFyZ3VtZW50cyk7XHJcblx0XHRcdGxldCBzdW1tSGVpZ2h0ID0gMDtcclxuXHRcdFxyXG5cdFx0XHRpZiAoYXJncy5sZW5ndGggIT0gMCkge1xyXG5cdFx0XHRcdHN1bW1IZWlnaHQgPSBhcmdzLnJlZHVjZShmdW5jdGlvbiAoYWNjdW0sIGl0ZW0pIHtcclxuXHRcdFx0XHRcdHJldHVybiBhY2N1bSArIGl0ZW0ub2Zmc2V0SGVpZ2h0O1xyXG5cdFx0XHRcdH0sIHN1bW1IZWlnaHQpXHJcblx0XHRcdH1cclxuXHRcdFxyXG5cdFx0XHRyZXR1cm4gd2luZG93LnBhZ2VZT2Zmc2V0ICsgc3VtbUhlaWdodDtcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGRlZXBDb3B5KG9iaikge1xyXG5cdFx0Y29uc3QgcmVzdWx0ID0gaXNPYmplY3Qob2JqKSA/IHsgLi4ub2JqIH0gOiBbLi4ub2JqXTtcclxuXHJcblx0XHRmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMob2JqKSkge1xyXG5cdFx0XHRpZiAoaXNPYmplY3QocmVzdWx0W2tleV0pIHx8IGlzQXJyYXkocmVzdWx0W2tleV0pKSB7XHJcblx0XHRcdFx0cmVzdWx0W2tleV0gPSBkZWVwQ29weShyZXN1bHRba2V5XSk7XHJcblx0XHRcdFx0Y29udGludWU7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gcmVzdWx0O1xyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gZGVlcE1lcmdlQXJyYXlzKGFycjEsIGFycjIpIHtcclxuXHRcdHJldHVybiBkZWVwQ29weShbLi4uYXJyMSwgLi4uYXJyMl0pO1xyXG5cdH07XHJcblxyXG5cdGZ1bmN0aW9uIGRlZXBNZXJnZU9iamVjdChvYmoxLCBvYmoyKSB7XHJcblx0XHRjb25zdCByZXN1bHQgPSBkZWVwQ29weShvYmoxKTtcclxuXHJcblx0XHRmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMob2JqMikpIHtcclxuXHRcdFx0aWYgKCFyZXN1bHQuaGFzT3duUHJvcGVydHkoa2V5KSkge1xyXG5cdFx0XHRcdGlmIChpc09iamVjdChvYmoyW2tleV0pKSB7XHJcblx0XHRcdFx0XHRyZXN1bHRba2V5XSA9IGRlZXBDb3B5KG9iajJba2V5XSlcclxuXHRcdFx0XHRcdGNvbnRpbnVlO1xyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0aWYgKGlzQXJyYXkob2JqMltrZXldKSkge1xyXG5cdFx0XHRcdFx0cmVzdWx0W2tleV0gPSBkZWVwQ29weShvYmoyW2tleV0pXHJcblx0XHRcdFx0XHRjb250aW51ZTtcclxuXHRcdFx0XHR9XHJcblxyXG5cclxuXHRcdFx0XHRyZXN1bHRba2V5XSA9IG9iajJba2V5XTtcclxuXHRcdFx0XHRjb250aW51ZTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0cmVzdWx0W2tleV0gPSBtZXRob2RzLmRlZXBNZXJnZShyZXN1bHRba2V5XSwgb2JqMltrZXldKTtcclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gcmVzdWx0O1xyXG5cdH07XHJcblxyXG5cdGZ1bmN0aW9uIGlzQXJyYXkob2JqKSB7XHJcblx0XHRyZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9iaikgPT09ICdbb2JqZWN0IEFycmF5XSc7XHJcblx0fTtcclxuXHJcblx0ZnVuY3Rpb24gaXNPYmplY3Qob2JqKSB7XHJcblx0XHRyZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9iaikgPT09ICdbb2JqZWN0IE9iamVjdF0nO1xyXG5cdH07XHJcblxyXG5cdGZ1bmN0aW9uIGlzU2FtZVR5cGUoaXRlbTEsIGl0ZW0yKSB7XHJcblx0XHRyZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGl0ZW0xKSA9PT0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGl0ZW0yKTtcclxuXHR9O1xyXG5cdFxyXG5cclxuXHRyZXR1cm4gbWV0aG9kcztcclxufShteUFwcCkpKTsiLCJfcGx1Z2lucy5maXhlZEVsZW1Ub3AgPSBmdW5jdGlvbiAoc2VsZWN0b3IsIG9wdGlvbnMgPSB7fSkge1xyXG5cdGNvbnN0ICRlbCA9IHR5cGVvZiBzZWxlY3RvciA9PT0gJ3N0cmluZycgPyBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKHNlbGVjdG9yKSA6IHNlbGVjdG9yO1xyXG5cdGNvbnN0ICRzdGFydGluZ1BsYWNlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcblx0aWYgKG9wdGlvbnMuY2xhc3NQbGFjZSkge1xyXG5cdFx0JHN0YXJ0aW5nUGxhY2UuY2xhc3NOYW1lID0gb3B0aW9ucy5jbGFzc1BsYWNlO1xyXG5cdH1cclxuXHRjb25zdCAkaGVhZGVyID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignaGVhZGVyJyk7XHJcblx0JGVsLmluc2VydEFkamFjZW50RWxlbWVudCgnYmVmb3JlYmVnaW4nLCAkc3RhcnRpbmdQbGFjZSk7XHJcblxyXG5cdHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdzY3JvbGwnLCBfdXRpbHMudGhyb3R0bGUoXHJcblx0XHRmdW5jdGlvbiAoKSB7XHJcblx0XHRcdGxldCBwYWdlWU9mZnNldCA9IHdpbmRvdy5wYWdlWU9mZnNldDtcclxuXHRcdFx0bGV0IGlzRml4ZWRIZWFkZXIgPSBmYWxzZTtcclxuXHJcblx0XHRcdGlmIChnZXRDb21wdXRlZFN0eWxlKCRoZWFkZXIpLnBvc2l0aW9uID09PSAnZml4ZWQnKSB7XHJcblx0XHRcdFx0cGFnZVlPZmZzZXQgPSBfdXRpbHMucGFnZVlPZmZzZXRCeU5vZGVzKCRoZWFkZXIpO1xyXG5cdFx0XHRcdGlzRml4ZWRIZWFkZXIgPSB0cnVlO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRpZiAocGFnZVlPZmZzZXQgPiBfdXRpbHMuZ2V0T2Zmc2V0VG9wKCRzdGFydGluZ1BsYWNlKSkge1xyXG5cdFx0XHRcdC8vJHN0YXJ0aW5nUGxhY2Uuc3R5bGUuaGVpZ2h0ID0gJGVsLm9mZnNldEhlaWdodCArICdweCc7XHJcblx0XHRcdFx0JGVsLmNsYXNzTGlzdC5hZGQoJ2ZpeGVkJyk7XHJcblx0XHRcdFx0Ly8kZWwuc3R5bGUudG9wID0gaXNGaXhlZEhlYWRlciA/ICRoZWFkZXIub2Zmc2V0SGVpZ2h0IC0gMSArICdweCcgOiAnJztcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHQvLyRzdGFydGluZ1BsYWNlLnN0eWxlLmhlaWdodCA9ICcnO1xyXG5cdFx0XHRcdCRlbC5jbGFzc0xpc3QucmVtb3ZlKCdmaXhlZCcpO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0KSwgNzApXHJcbn07IiwiLy9zbGlkZXJcbl9wbHVnaW5zLnNsaWRlciA9IGZ1bmN0aW9uIChzZWxlY3Rvciwgb3B0aW9uID0ge30pIHtcblx0Y29uc3QgJHNsaWRlciA9ICh0eXBlb2Ygc2VsZWN0b3IgPT09ICdzdHJpbmcnKSA/IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3Ioc2VsZWN0b3IpIDogc2VsZWN0b3I7XG5cdGNvbnN0ICRzbGlkZXJXcmFwID0gJHNsaWRlci5jbG9zZXN0KCcuc2xpZGVyJyk7XG5cblx0Y29uc3Qgc2V0aW5ncyA9IHtcblx0XHRuYXZpZ2F0aW9uOiAkc2xpZGVyV3JhcC5xdWVyeVNlbGVjdG9yKCcuc2xpZGVyX19uYXYnKSxcblx0XHRwYWdpbmF0aW9uOiAkc2xpZGVyV3JhcC5xdWVyeVNlbGVjdG9yKCcuc2xpZGVyX19wYWdpbmF0aW9uJyksXG5cdFx0c2Nyb2xsYmFyOiAkc2xpZGVyV3JhcC5xdWVyeVNlbGVjdG9yKCcuc2xpZGVyX19zY3JvbGxiYXInKSxcblx0XHRvcHRpb25zOiB7XG5cdFx0XHR3YXRjaE92ZXJmbG93OiB0cnVlLFxuXHRcdFx0Li4ub3B0aW9uLFxuXHRcdH1cblx0fVxuXG5cdE9iamVjdC5hc3NpZ24oc2V0aW5ncy5vcHRpb25zLCB7XG5cdFx0d2F0Y2hTbGlkZXNWaXNpYmlsaXR5OiB0cnVlLFxuXHRcdHdhdGNoT3ZlcmZsb3c6IHRydWUsXG5cdFx0YXV0b3BsYXk6ICgrJHNsaWRlci5kYXRhc2V0LnNsaWRlckF1dG9wbGF5ID4gMCkgPyB7XG5cdFx0XHRkZWxheTogKyRzbGlkZXIuZGF0YXNldC5zbGlkZXJBdXRvcGxheSxcblx0XHRcdHBhdXNlT25Nb3VzZUVudGVyOiB0cnVlLFxuXHRcdFx0ZGlzYWJsZU9uSW50ZXJhY3Rpb246IGZhbHNlLFxuXHRcdH0gOiAnJyxcblx0XHRuYXZpZ2F0aW9uOiBzZXRpbmdzLm5hdmlnYXRpb24gPyB7XG5cdFx0XHRuZXh0RWw6ICRzbGlkZXJXcmFwLnF1ZXJ5U2VsZWN0b3IoJy5zbGlkZXJfX25hdi1idG4tLW5leHQnKSxcblx0XHRcdHByZXZFbDogJHNsaWRlcldyYXAucXVlcnlTZWxlY3RvcignLnNsaWRlcl9fbmF2LWJ0bi0tcHJldicpLFxuXHRcdH0gOiAnJyxcblx0XHRzY3JvbGxiYXI6IHNldGluZ3Muc2Nyb2xsYmFyID8ge1xuXHRcdFx0ZWw6IHNldGluZ3Muc2Nyb2xsYmFyLFxuXHRcdFx0ZHJhZ2dhYmxlOiB0cnVlLFxuXHRcdH0gOiAnJyxcblx0XHRwYWdpbmF0aW9uOiBzZXRpbmdzLnBhZ2luYXRpb24gPyB7XG5cdFx0XHRlbDogJHNsaWRlcldyYXAucXVlcnlTZWxlY3RvcignLnNsaWRlci1wYWdpbmF0aW9uJyksXG5cdFx0XHRjbGlja2FibGU6IHRydWUsXG5cdFx0fSA6ICcnLFxuXHR9KTtcblxuXHRyZXR1cm4gbmV3IFN3aXBlcigkc2xpZGVyLCBzZXRpbmdzLm9wdGlvbnMpO1xufTtcbiIsIihmdW5jdGlvbigpIHtcclxuXHRmdW5jdGlvbiBmaW5kSW5kZXgoJG9iaiwgJGl0ZW0pIHtcclxuXHRcdGxldCBpbmRleCA9IG51bGw7XHJcblxyXG5cdFx0JG9iai5lYWNoKChpLCBpdGVtKSA9PiB7XHJcblx0XHRcdGlmIChpdGVtID09PSAkaXRlbVswXSkge1xyXG5cdFx0XHRcdGluZGV4ID0gaTtcclxuXHRcdFx0fVxyXG5cdFx0fSk7XHJcblx0XHRcclxuXHRcdHJldHVybiBpbmRleDtcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGluaXRUYWJzSXRlbSgkdGFicywgJHRhYnNJdGVtQWN0aXZlKSB7XHJcblx0XHRjb25zdCBkYXRhVGFicyA9ICR0YWJzLmF0dHIoJ2RhdGEtdGFicycpO1xyXG5cclxuXHRcdGlmIChkYXRhVGFicykge1xyXG5cdFx0XHRjb25zdCAkaXRlbXNUYWJzID0gJHRhYnMuZmluZCgnW2RhdGEtdGFiXScpO1xyXG5cclxuXHRcdFx0JGl0ZW1zVGFicy5lYWNoKGZ1bmN0aW9uKGkpIHtcclxuXHRcdFx0XHRjb25zdCAkc2VjdGlvbnNUYWJzID0gJChgW2RhdGEtdGFicz1cIiR7ZGF0YVRhYnN9LCAke2l9XCJdYCk7XHJcblx0XHRcdFx0Y29uc3QgaW5kZXggPSBmaW5kSW5kZXgoJGl0ZW1zVGFicywgJHRhYnNJdGVtQWN0aXZlKTtcclxuXHRcdFx0XHRjb25zdCAkdW5sb2FkZWRTcmMgPSAkc2VjdGlvbnNUYWJzLmZpbmQoJ1tkYXRhLXNyY10nKTsgXHJcblxyXG5cdFx0XHRcdGlmIChpbmRleCAhPT0gaSkge1xyXG5cdFx0XHRcdFx0JHNlY3Rpb25zVGFicy5hdHRyKCdoaWRkZW4nLCB0cnVlKTtcclxuXHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0JChgW2RhdGEtdGFicz1cIiR7ZGF0YVRhYnN9LCAke2luZGV4fVwiXWApLnJlbW92ZUF0dHIoJ2hpZGRlbicpO1xyXG5cclxuXHRcdFx0XHRcdGlmICgkdW5sb2FkZWRTcmMubGVuZ3RoKSB7XHJcblx0XHRcdFx0XHRcdCR1bmxvYWRlZFNyYy5lYWNoKChpLCBpdGVtKSA9PiB7XHJcblx0XHRcdFx0XHRcdFx0Y29uc3Qgc3JjID0gJChpdGVtKS5kYXRhKCdzcmMnKTtcclxuXHRcdFx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdFx0XHQkKGl0ZW0pLmF0dHIoJ3NyYycsIHNyYykucmVtb3ZlQXR0cignZGF0YS1zcmMnKTtcclxuXHRcdFx0XHRcdFx0fSk7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9KTtcclxuXHRcdH1cclxuXHRcclxuXHRcdCR0YWJzWzBdLmRpc3BhdGNoRXZlbnQobmV3IEN1c3RvbUV2ZW50KFwidGFiczpjaGFuZ2VcIiwge2J1YmJsZXM6IHRydWUsIGNhbmNlbGFibGU6IHRydWV9KSk7XHJcblx0fVxyXG5cdFxyXG5cdCQoJy50YWJzJykuZWFjaChmdW5jdGlvbihpKSB7XHJcblx0XHRjb25zdCAkdGFicyA9ICQodGhpcyk7XHJcblx0XHRsZXQgJHRhYnNJdGVtQWN0aXZlID0gJHRhYnMuZmluZCgnW2RhdGEtdGFiXS5hY3RpdmUnKTtcclxuXHRcclxuXHRcdGlmICgkdGFic0l0ZW1BY3RpdmUubGVuZ3RoICE9PSAxKSB7XHJcblx0XHRcdGNvbnN0ICR0YWJzSXRlbXMgPSAkdGFicy5maW5kKCdbZGF0YS10YWJdJyk7XHJcblx0XHJcblx0XHRcdCR0YWJzSXRlbXMucmVtb3ZlQ2xhc3MoJ2FjdGl2ZScpO1xyXG5cdFx0XHQkdGFic0l0ZW1zLmVxKDApLmFkZENsYXNzKCdhY3RpdmUnKTtcclxuXHRcdFx0JHRhYnNJdGVtQWN0aXZlID0gJHRhYnNJdGVtcy5lcSgwKTtcclxuXHRcdH1cclxuXHRcclxuXHRcdGluaXRUYWJzSXRlbSgkdGFicywgJHRhYnNJdGVtQWN0aXZlKTtcclxuXHJcblx0XHR0aGlzLmRpc3BhdGNoRXZlbnQobmV3IEN1c3RvbUV2ZW50KFwidGFiczppbml0XCIsIHtidWJibGVzOiB0cnVlLCBjYW5jZWxhYmxlOiB0cnVlfSkpO1xyXG5cdH0pO1xyXG5cdFxyXG5cdCQoZG9jdW1lbnQpLm9uKCdjbGljaycsICdbZGF0YS10YWJdJywgZnVuY3Rpb24oKSB7XHJcblx0XHRjb25zdCAkdGFic0l0ZW0gPSAkKHRoaXMpO1xyXG5cdFx0Y29uc3QgJHRhYnMgPSAkdGFic0l0ZW0uY2xvc2VzdCgnW2RhdGEtdGFic10nKTtcclxuXHRcdGNvbnN0ICR0YWJzSXRlbXMgPSAkdGFicy5maW5kKCdbZGF0YS10YWJdJyk7XHJcblx0XHJcblx0XHQkdGFic0l0ZW1zLm5vdCgkdGFic0l0ZW0pLnJlbW92ZUNsYXNzKCdhY3RpdmUnKTtcclxuXHRcdCR0YWJzSXRlbS5hZGRDbGFzcygnYWN0aXZlJyk7XHJcblx0XHRjb25zb2xlLmxvZygkdGFic1swXSk7XHJcblx0XHRpbml0VGFic0l0ZW0oJHRhYnMsICR0YWJzSXRlbSk7XHJcblx0fSk7XHJcbn0oKSk7IiwiLypcclxuXHRidXJnZXIganNcdFxyXG4qL1xyXG4oZnVuY3Rpb24gKG15QXBwKSB7XHJcblx0Y29uc3QgYnVyZ2VyRWwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuaGVhZGVyX19idXJnZXInKTtcclxuXHRjb25zdCB0b2dnbGVCdXJnZXJDbGFzcyA9ICdqcy10b2dnbGUtYnVyZ2VyJztcclxuXHRjb25zdCAkdG9nZ2xlckJ1cmdlciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYC4ke3RvZ2dsZUJ1cmdlckNsYXNzfWApO1xyXG5cdGNvbnN0IG1lZGlhUXVlcnkgPSB3aW5kb3cubWF0Y2hNZWRpYShgKG1pbi13aWR0aDogJHtteUFwcC5icmVha3BvaW50cy5tZCArIDF9cHgpYCk7XHJcblx0bGV0IGlzT3BlbiA9IGZhbHNlO1xyXG5cclxuXHRtZWRpYVF1ZXJ5LmFkZExpc3RlbmVyKGZ1bmN0aW9uICgpIHtcclxuXHRcdGlmIChtZWRpYVF1ZXJ5Lm1hdGNoZXMgJiYgYnVyZ2VyRWwuY2xhc3NMaXN0LmNvbnRhaW5zKCdvcGVuJykpIHtcclxuXHRcdFx0dG9nZ2xlQnVyZ2VyKCR0b2dnbGVyQnVyZ2VyKTtcclxuXHRcdH1cclxuXHR9KTtcclxuXHQvL0hhbWJ1cmdlciDQvtGC0LrRgNGL0YLQuNGPINC80L7QsdC40LvRjNC90L7Qs9C+INC80LXQvdGOXHJcblx0ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbiAoZSkge1xyXG5cdFx0Y29uc3QgdG9nZ2xlckVsID0gZS50YXJnZXQuY2xvc2VzdChgLiR7dG9nZ2xlQnVyZ2VyQ2xhc3N9YCk7XHJcblxyXG5cdFx0aWYgKHRvZ2dsZXJFbCkge1xyXG5cdFx0XHR0b2dnbGVCdXJnZXIodG9nZ2xlckVsKTtcclxuXHRcdH1cclxuXHR9KTtcclxuXHRkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdhY3Rpb246Y2xvc2VCdXJnZXInLCBmdW5jdGlvbiAoKSB7XHJcblx0XHRpZiAoaXNPcGVuKSB7XHJcblx0XHRcdHRvZ2dsZUJ1cmdlcigkdG9nZ2xlckJ1cmdlcik7XHJcblx0XHR9XHJcblx0fSk7XHJcblxyXG5cdGZ1bmN0aW9uIHRvZ2dsZUJ1cmdlcih0b2dnbGVyRWwpIHtcclxuXHRcdGlmICghdG9nZ2xlckVsKSByZXR1cm47XHJcblxyXG5cdFx0dG9nZ2xlckVsLmNsYXNzTGlzdC50b2dnbGUoJ2FjdGl2ZScpO1xyXG5cclxuXHRcdGxldCBpc0FjdGl2ZSA9IHRvZ2dsZXJFbC5jbGFzc0xpc3QuY29udGFpbnMoJ2FjdGl2ZScpO1xyXG5cdFx0aXNPcGVuID0gaXNBY3RpdmU7XHJcblxyXG5cdFx0Zm9yIChjb25zdCB0b2dnbGVyIG9mIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoYC4ke3RvZ2dsZUJ1cmdlckNsYXNzfWApKSB7XHJcblx0XHRcdHRvZ2dsZXIuY2xhc3NMaXN0W2lzQWN0aXZlID8gJ2FkZCcgOiAncmVtb3ZlJ10oJ2FjdGl2ZScpO1xyXG5cdFx0fVxyXG5cclxuXHRcdGJ1cmdlckVsLmNsYXNzTGlzdFtpc0FjdGl2ZSA/ICdhZGQnIDogJ3JlbW92ZSddKCdvcGVuJyk7XHJcblx0XHRteUFwcC5lbHMucm9vdC5jbGFzc0xpc3RbaXNBY3RpdmUgPyAnYWRkJyA6ICdyZW1vdmUnXSgnaXMtYnVyZ2VyLW9wZW4nKTtcclxuXHRcdG15QXBwLnV0aWxzLnRvZ2dsZU92ZXJmbG93RG9jdW1lbnQoaXNBY3RpdmUpO1xyXG5cclxuXHRcdGlmIChpc0FjdGl2ZSkge1xyXG5cdFx0XHRkb2N1bWVudC5kb2N1bWVudEVsZW1lbnRcclxuXHRcdFx0XHQuZGlzcGF0Y2hFdmVudChuZXcgQ3VzdG9tRXZlbnQoXCJhY3Rpb246Y2xvc2VTZWFyY2hcIiwge1xyXG5cdFx0XHRcdFx0YnViYmxlczogdHJ1ZSxcclxuXHRcdFx0XHRcdGNhbmNlbGFibGU6IHRydWVcclxuXHRcdFx0XHR9KSk7XHJcblx0XHR9XHJcblx0fVxyXG59KG15QXBwKSk7IiwiKGZ1bmN0aW9uKCkge1xyXG5cdGlmICghbmF2aWdhdG9yLmNsaXBib2FyZCkgcmV0dXJuO1xyXG5cclxuXHRjb25zdCBkZWZhdWx0VGV4dCA9ICfQodC60L7Qv9C40YDQvtCy0LDQvdC90L4g0LIg0LHRg9GE0LXRgCDQvtCx0LzQtdC90LAnO1xyXG5cdGxldCBpbnN0YW5jZTtcclxuXHJcblx0ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZSkgPT4ge1xyXG5cdFx0aWYgKGUudGFyZ2V0LmNsb3Nlc3QoJ1tkYXRhLWNvcHldJykpIHtcclxuXHRcdFx0Y29uc3QgJHRhcmdldCA9IGUudGFyZ2V0LmNsb3Nlc3QoJ1tkYXRhLWNvcHldJyk7XHJcblxyXG5cdFx0XHRpZiAoaW5zdGFuY2UpIHtcclxuXHRcdFx0XHRpbnN0YW5jZS5jbG9zZSgpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRuYXZpZ2F0b3IuY2xpcGJvYXJkLndyaXRlVGV4dCgkdGFyZ2V0LmRhdGFzZXQuY29weSk7XHRcdFx0XHJcblxyXG5cdFx0XHRpbnN0YW5jZSA9IFVJa2l0Lm5vdGlmaWNhdGlvbihkZWZhdWx0VGV4dCwge1xyXG5cdFx0XHRcdHBvczogJ3RvcC1yaWdodCcsXHJcblx0XHRcdFx0c3RhdHVzOiAncHJpbWFyeScsXHJcblx0XHRcdFx0dGltZW91dDogNDcwMFxyXG5cdFx0XHR9KTtcclxuXHRcdH1cclxuXHR9KVxyXG59KCkpOyIsIihmdW5jdGlvbiAobXlBcHApIHtcclxuXHQkKGRvY3VtZW50KS5vbignY2xpY2snLCAnW2RhdGEtY291bnRlci1idG5dJywgZnVuY3Rpb24oKSB7XHJcblx0XHRjb25zdCAkdGhpcyA9ICQodGhpcyk7XHJcblx0XHRjb25zdCAkaW5wdXQgPSAkdGhpcy5jbG9zZXN0KCcuY291bnRlcicpLmZpbmQoJy5jb3VudGVyX19pbnB1dCcpO1xyXG5cdFx0bGV0IHZhbHVlID0gKyRpbnB1dC5pbnB1dG1hc2soJ3VubWFza2VkdmFsdWUnKTtcclxuXHRcdGNvbnN0IHN0ZXAgPSArJGlucHV0LmF0dHIoJ2RhdGEtc3RlcCcpIHx8IDE7XHJcbiAgICAgICAgY29uc3QgbWluID0gJGlucHV0LmF0dHIoJ21pbicpO1xyXG4gICAgICAgIGNvbnN0IG1heCA9ICRpbnB1dC5hdHRyKCdtYXgnKTtcclxuXHJcbiAgICAgICAgdmFsdWUgPSB2YWx1ZSArIHN0ZXAgKiAoJHRoaXMuZGF0YSgnY291bnRlci1idG4nKSA9PT0gXCJwbHVzXCIgPyAxIDogLTEpO1xyXG5cclxuICAgICAgICBpZiAobWluICE9PSAndW5kZWZpbmVkJyAmJiB2YWx1ZSA8IG1pbikge1xyXG4gICAgICAgICAgICB2YWx1ZSA9IG1pbjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChtYXggIT09ICd1bmRlZmluZWQnICYmIHZhbHVlID4gbWF4KSB7XHJcbiAgICAgICAgICAgIHZhbHVlID0gbWF4O1xyXG4gICAgICAgIH1cclxuXHJcblx0XHQkaW5wdXQudmFsKHZhbHVlKTtcclxuXHR9KTtcclxufShteUFwcCkpOyIsIihmdW5jdGlvbiAoKSB7XHJcblx0Zm9yIChjb25zdCAkbWFwIG9mIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy5tYXAtLWJsb2NrZWQsIC5tYXAtLW1vYi1ibG9ja2VkJykpIHtcclxuXHRcdC8vINGB0L7Qt9C00LDRkdC8INGN0LvQtdC80LXQvdGCIDxkaXY+LCDQutC+0YLQvtGA0YvQuSDQsdGD0LTQtdC8INC/0LXRgNC10LzQtdGJ0LDRgtGMINCy0LzQtdGB0YLQtSDRgSDRg9C60LDQt9Cw0YLQtdC70LXQvCDQvNGL0YjQuCDQv9C+0LvRjNC30L7QstCw0YLQtdC70Y9cclxuXHRcdGxldCBtYXBUaXRsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG5cdFx0IG1hcFRpdGxlLmNsYXNzTmFtZSA9ICdtYXBUaXRsZSc7XHJcblx0XHQvLyDQstC/0LjRgdGL0LLQsNC10Lwg0L3Rg9C20L3Ri9C5INC90LDQvCDRgtC10LrRgdGCINCy0L3Rg9GC0YDRjCDRjdC70LXQvNC10L3RgtCwXHJcblx0XHRtYXBUaXRsZS50ZXh0Q29udGVudCA9ICfQlNC70Y8g0LDQutGC0LjQstCw0YbQuNC4INC60LDRgNGC0Ysg0L3QsNC20LzQuNGC0LUg0L/QviDQvdC10LknO1xyXG5cdFx0Ly8g0LTQvtCx0LDQstC70Y/QtdC8INGN0LvQtdC80LXQvdGCINGBINC/0L7QtNGB0LrQsNC30LrQvtC5INC/0L7RgdC70LXQtNC90LjQvCDRjdC70LXQvNC10L3RgtC+0LIg0LLQvdGD0YLRgNGMINC90LDRiNC10LPQviA8ZGl2PiDRgSBpZCAkbWFwXHJcblx0XHQkbWFwLmFwcGVuZENoaWxkKG1hcFRpdGxlKTtcclxuXHRcdC8vINC/0L4g0LrQu9C40LrRgyDQvdCwINC60LDRgNGC0YNcclxuXHRcdCRtYXAub25jbGljayA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHR0aGlzLmNsYXNzTGlzdC5yZW1vdmUoJ21hcC0tYmxvY2tlZCcpO1xyXG5cdFx0XHR0aGlzLmNsYXNzTGlzdC5yZW1vdmUoJ21hcC0tbW9iLWJsb2NrZWQnKTtcclxuXHRcdFx0Ly8g0YPQtNCw0LvRj9C10Lwg0Y3Qu9C10LzQtdC90YIg0YEg0LjQvdGC0LXRgNCw0LrRgtC40LLQvdC+0Lkg0L/QvtC00YHQutCw0LfQutC+0LlcclxuXHRcdFx0bWFwVGl0bGUucGFyZW50RWxlbWVudC5yZW1vdmVDaGlsZChtYXBUaXRsZSk7XHJcblxyXG5cdFx0XHQkbWFwLm9uY2xpY2sgPSBudWxsO1xyXG5cdFx0fVxyXG5cdFx0Ly8g0L/QviDQtNCy0LjQttC10L3QuNGOINC80YvRiNC4INCyINC+0LHQu9Cw0YHRgtC4INC60LDRgNGC0YtcclxuXHRcdCRtYXAub25tb3VzZW1vdmUgPSBmdW5jdGlvbihldmVudCkge1xyXG5cdFx0XHQvLyDQv9C+0LrQsNC30YvQstCw0LXQvCDQv9C+0LTRgdC60LDQt9C60YNcclxuXHRcdFx0bWFwVGl0bGUuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XHJcblx0XHRcdC8vINC00LLQuNCz0LDQtdC8INC/0L7QtNGB0LrQsNC30LrRgyDQv9C+INC+0LHQu9Cw0YHRgtC4INC60LDRgNGC0Ysg0LLQvNC10YHRgtC1INGBINC80YvRiNC60L7QuSDQv9C+0LvRjNC30L7QstCw0YLQtdC70Y9cclxuXHRcdFx0aWYoZXZlbnQub2Zmc2V0WSA+IDEwKSBtYXBUaXRsZS5zdHlsZS50b3AgPSBldmVudC5vZmZzZXRZICsgMjAgKyAncHgnO1xyXG5cdFx0XHRpZihldmVudC5vZmZzZXRYID4gMTApIG1hcFRpdGxlLnN0eWxlLmxlZnQgPSBldmVudC5vZmZzZXRYICsgMjAgKyAncHgnO1xyXG5cdFx0fVxyXG5cdFx0Ly8g0L/RgNC4INGD0YXQvtC00LUg0YPQutCw0LfQsNGC0LXQu9GPINC80YvRiNC4INGBINC+0LHQu9Cw0YHRgtC4INC60LDRgNGC0YtcclxuXHRcdCRtYXAub25tb3VzZWxlYXZlID0gZnVuY3Rpb24oKSB7XHJcblx0XHRcdC8vINC/0YDRj9GH0LXQvCDQv9C+0LTRgdC60LDQt9C60YNcclxuXHRcdFx0bWFwVGl0bGUuc3R5bGUuZGlzcGxheSA9ICdub25lJztcclxuXHRcdH1cclxuXHR9XHJcbn0oKSk7IiwiKGZ1bmN0aW9uKCkge1xyXG5cdGxldCBicm9NZW51SW5zdGFuY2U7XHJcblx0Y29uc3QgbWVkaWFRdWVyeSA9IHdpbmRvdy5tYXRjaE1lZGlhKGAobWF4LXdpZHRoOiAke215QXBwLmJyZWFrcG9pbnRzLm1kfXB4KWApO1xyXG5cclxuXHRjb25zdCB0b2dnbGVCcm9NZW51ID0gZnVuY3Rpb24gKCkge1xyXG5cdFx0aWYgKG1lZGlhUXVlcnkubWF0Y2hlcykge1xyXG5cdFx0XHRicm9NZW51SW5zdGFuY2UuaW5pdCgpO1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0YnJvTWVudUluc3RhbmNlLmRlc3Ryb3koKTtcclxuXHRcdH1cclxuXHR9O1xyXG5cclxuXHRtZWRpYVF1ZXJ5LmFkZExpc3RlbmVyKHRvZ2dsZUJyb01lbnUpO1xyXG5cclxuXHRicm9NZW51SW5zdGFuY2UgPSBicm9NZW51KCcubWVudScpO1xyXG5cdHRvZ2dsZUJyb01lbnUoKTtcclxuXHJcblx0Ly9zbGlua3kgbWVudVxyXG5cdGZ1bmN0aW9uIGJyb01lbnUoc2VsZWN0b3IsIG9wdGlvbnMpIHtcclxuXHRcdGNvbnN0ICRtZW51ID0gdHlwZW9mIHNlbGVjdG9yID09PSBcInN0cmluZ1wiID8gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihzZWxlY3RvcikgOiBzZWxlY3RvcjtcclxuXHRcdGNvbnN0ICRjb250YWluZXJNZW51ID0gJG1lbnUucXVlcnlTZWxlY3RvcigndWwnKTtcclxuXHRcdGNvbnN0ICRsZXZlbF8xID0gJG1lbnUubGFzdEVsZW1lbnRDaGlsZDtcclxuXHRcdGNvbnN0ICRzdWJNZW51TGlzdCA9ICRjb250YWluZXJNZW51IC5xdWVyeVNlbGVjdG9yQWxsKCd1bCcpO1xyXG5cdFx0Y29uc3QgJHN1Yk1lbnVMaW5rcyA9ICRtZW51LnF1ZXJ5U2VsZWN0b3JBbGwoJ2xpID4gYScpO1xyXG5cdFx0bGV0IGFjdGl2YXRlZDtcclxuXHJcblx0XHRsZXQgZGVmYXVsT3B0aW9ucyA9IHtcclxuXHRcdFx0bmV4dEJ0bjogJy5icm8tbWVudV9fbmV4dC1hcnInLFxyXG5cdFx0XHRhcnJvdzogYFxyXG5cdFx0XHQ8c3ZnIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiB2aWV3Qm94PVwiMCAwIDI0IDI0XCI+XHJcblx0XHRcdDxwYXRoIGQ9XCJNMTIuMjE5IDIuMjgxTDEwLjc4IDMuNzIgMTguMDYyIDExSDJ2MmgxNi4wNjNsLTcuMjgyIDcuMjgxIDEuNDM4IDEuNDM4IDktOSAuNjg3LS43MTktLjY4Ny0uNzE5elwiIC8+XHJcblx0XHRcdDwvc3ZnPlxyXG5cdFx0YFxyXG5cdFx0fVxyXG5cclxuXHRcdE9iamVjdC5hc3NpZ24oZGVmYXVsT3B0aW9ucywgb3B0aW9ucyk7XHJcblxyXG5cdFx0bGV0ICRhY3RpdmVVbDtcclxuXHRcdGxldCB0cmFuc2xhdGUgPSAwO1xyXG5cclxuXHRcdGNvbnN0IG1ldGhvZCA9IHtcclxuXHRcdFx0aW5pdCgpIHtcclxuXHRcdFx0XHRpZiAoYWN0aXZhdGVkKSByZXR1cm47XHJcblxyXG5cdFx0XHRcdCRtZW51LmNsYXNzTGlzdC5hZGQoJ2Jyby1tZW51Jyk7XHJcblx0XHRcdFx0JGNvbnRhaW5lck1lbnUuY2xhc3NMaXN0LmFkZCgnYnJvLW1lbnVfX2NvbnRhaW5lcicpO1xyXG5cclxuXHRcdFx0XHRmb3IgKGxldCBzdWJtZW51IG9mICRzdWJNZW51TGlzdCkge1xyXG5cdFx0XHRcdFx0Y29uc3QgcGFyZW50TGkgPSBzdWJtZW51LmNsb3Nlc3QoJ2xpJyk7XHJcblx0XHRcdFx0XHRjb25zdCBsaW5rID0gcGFyZW50TGkucXVlcnlTZWxlY3RvcignbGkgPiBhJyk7XHJcblx0XHRcdFx0XHRzdWJtZW51LmNsYXNzTGlzdC5hZGQoJ2Jyby1tZW51X19zdWJtZW51Jyk7XHJcblx0XHRcdFx0XHRsaW5rLmNsYXNzTGlzdC5hZGQoJ2Jyby1tZW51X19uZXh0Jyk7XHJcblxyXG5cdFx0XHRcdFx0X2FkZEJ0bkJhY2soc3VibWVudSwgbGluayk7XHJcblx0XHRcdFx0XHRfYWRkQnRuTmV4dChsaW5rKTtcclxuXHJcblx0XHRcdFx0XHRhY3RpdmF0ZWQgPSB0cnVlO1xyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0Zm9yIChjb25zdCAkbGluayBvZiAkc3ViTWVudUxpbmtzKSB7XHJcblx0XHRcdFx0XHQkbGluay5jbGFzc0xpc3QuYWRkKCdhY3RpdmUnKTtcclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdCRtZW51LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgY2xpY2tIYW5kbGVyKTtcclxuXHJcblx0XHRcdFx0d2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIF9zZXRIZWlnaE1lbnUpO1xyXG5cdFx0XHR9LFxyXG5cclxuXHRcdFx0ZGVzdHJveSgpIHtcclxuXHRcdFx0XHRpZiAoIWFjdGl2YXRlZCkgcmV0dXJuO1xyXG5cclxuXHRcdFx0XHRjb25zdCAkYXJyTm9kZXMgPSAkbWVudS5xdWVyeVNlbGVjdG9yQWxsKCcuYnJvLW1lbnVfX2FycicpO1xyXG5cclxuXHRcdFx0XHQkbWVudS5yZW1vdmVFdmVudExpc3RlbmVyKCdjbGljaycsIGNsaWNrSGFuZGxlcik7XHJcblx0XHRcdFx0d2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIF9zZXRIZWlnaE1lbnUpO1xyXG5cclxuXHRcdFx0XHRmb3IgKGNvbnN0ICRsaW5rIG9mICRtZW51LnF1ZXJ5U2VsZWN0b3JBbGwoJy5saW5rJykpIHtcclxuXHRcdFx0XHRcdGlmICgkbGluay5jbGFzc0xpc3QuY29udGFpbnMoJ2Jyby1tZW51X19iYWNrJykpIHtcclxuXHRcdFx0XHRcdFx0JGxpbmsuY2xvc2VzdCgnbGknKS5yZW1vdmUoKTtcclxuXHRcdFx0XHRcdFx0Y29udGludWU7XHJcblx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdFx0Zm9yIChjb25zdCAkYXJyIG9mICRhcnJOb2Rlcykge1xyXG5cdFx0XHRcdFx0XHQkYXJyLnJlbW92ZSgpO1xyXG5cdFx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRcdCRsaW5rLmNsYXNzTGlzdC5yZW1vdmUoJ2xpbmsnKTtcclxuXHRcdFx0XHRcdCRsaW5rLmNsYXNzTGlzdC5yZW1vdmUoJ2Jyby1tZW51X19uZXh0Jyk7XHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRmb3IgKGxldCAkc3VibWVudSBvZiAkc3ViTWVudUxpc3QpIHtcclxuXHRcdFx0XHRcdCRzdWJtZW51LmNsYXNzTGlzdC5yZW1vdmUoJ2Jyby1tZW51X19zdWJtZW51Jyk7XHRcdFx0XHRcclxuXHRcdFx0XHRcdCRzdWJtZW51LnN0eWxlLnZpc2liaWxpdHkgPSAnJztcclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdCRhY3RpdmVVbCAmJiAkYWN0aXZlVWwuY2xhc3NMaXN0LnJlbW92ZSgnYWN0aXZlJyk7XHJcblx0XHRcdFx0JG1lbnUuY2xhc3NMaXN0LnJlbW92ZSgnYnJvLW1lbnUnKTtcclxuXHRcdFx0XHQkY29udGFpbmVyTWVudS5jbGFzc0xpc3QucmVtb3ZlKCdicm8tbWVudV9fY29udGFpbmVyJylcclxuXHJcblx0XHRcdFx0JG1lbnUuc3R5bGUuaGVpZ2h0ID0gJyc7XHJcblx0XHRcdFx0JGxldmVsXzEuc3R5bGUudHJhbnNmb3JtID0gYGA7XHJcblx0XHRcdFx0dHJhbnNsYXRlID0gMDtcclxuXHRcdFx0XHRhY3RpdmF0ZWQgPSBmYWxzZTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdGZ1bmN0aW9uIGNsaWNrSGFuZGxlcihlKSB7XHJcblx0XHRcdGNvbnN0IHRhcmdldCA9IGUudGFyZ2V0O1xyXG5cclxuXHRcdFx0aWYgKHRhcmdldC5jbG9zZXN0KGRlZmF1bE9wdGlvbnMubmV4dEJ0bikpIHtcclxuXHRcdFx0XHRlLnByZXZlbnREZWZhdWx0KCk7XHJcblxyXG5cdFx0XHRcdGNvbnN0ICRuZXN0ZWRNZW51ID0gdGFyZ2V0LmNsb3Nlc3QoJ2xpJykucXVlcnlTZWxlY3RvcigndWwnKTtcclxuXHJcblx0XHRcdFx0aWYgKCRhY3RpdmVVbCkgJGFjdGl2ZVVsLmNsYXNzTGlzdC5yZW1vdmUoJ2FjdGl2ZScpO1xyXG5cclxuXHRcdFx0XHQkbmVzdGVkTWVudS5jbGFzc0xpc3QuYWRkKCdhY3RpdmUnKTtcclxuXHRcdFx0XHQkbmVzdGVkTWVudS5zdHlsZS52aXNpYmlsaXR5ID0gJ3Zpc2libGUnO1xyXG5cdFx0XHRcdHRyYW5zbGF0ZSAtPSAxMDA7XHJcblxyXG5cdFx0XHRcdCRsZXZlbF8xLnN0eWxlLnRyYW5zZm9ybSA9IGB0cmFuc2xhdGVYKCR7dHJhbnNsYXRlfSUpYDtcclxuXHRcdFx0XHQkYWN0aXZlVWwgPSAkbmVzdGVkTWVudTtcclxuXHJcblx0XHRcdFx0c2Nyb2xsVG9WaXNpYmxlKCRhY3RpdmVVbCk7XHJcblx0XHRcdFx0X3NldEhlaWdoTWVudSgpO1xyXG5cdFx0XHR9XHJcblx0XHRcdGVsc2UgaWYgKHRhcmdldC5jbG9zZXN0KCcuYnJvLW1lbnVfX2JhY2snKSkge1xyXG5cdFx0XHRcdGUucHJldmVudERlZmF1bHQoKTtcclxuXHJcblx0XHRcdFx0Y29uc3QgJHVwcGVyTWVudSA9ICRhY3RpdmVVbC5wYXJlbnRFbGVtZW50LmNsb3Nlc3QoJ3VsJyk7XHJcblx0XHRcdFx0JHVwcGVyTWVudS5jbGFzc0xpc3QuYWRkKCdhY3RpdmUnKTtcclxuXHJcblx0XHRcdFx0JGFjdGl2ZVVsLnN0eWxlLnZpc2liaWxpdHkgPSAnJztcclxuXHJcblx0XHRcdFx0dHJhbnNsYXRlICs9IDEwMDtcclxuXHJcblx0XHRcdFx0JGxldmVsXzEuc3R5bGUudHJhbnNmb3JtID0gYHRyYW5zbGF0ZVgoJHt0cmFuc2xhdGV9JSlgO1xyXG5cdFx0XHRcdCRhY3RpdmVVbC5jbGFzc0xpc3QucmVtb3ZlKCdhY3RpdmUnKTtcclxuXHRcdFx0XHQkYWN0aXZlVWwgPSAkdXBwZXJNZW51O1xyXG5cdFx0XHRcdF9zZXRIZWlnaE1lbnUoKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdGZ1bmN0aW9uIF9hZGRCdG5OZXh0KGVsZW0pIHtcclxuXHRcdFx0ZWxlbS5jbGFzc0xpc3QuYWRkKCdsaW5rJylcclxuXHRcdFx0ZWxlbS5pbnNlcnRBZGphY2VudEhUTUwoJ2JlZm9yZWVuZCcsIGBcclxuXHRcdFx0XHQ8c3BhbiBjbGFzcz1cImJyby1tZW51X19uZXh0LWFyclwiPlxyXG5cdFx0XHRcdFx0JHtkZWZhdWxPcHRpb25zLmFycm93fVxyXG5cdFx0XHRcdDwvc3Bhbj5cclxuXHRcdFx0YCk7XHJcblxyXG5cdFx0XHRlbGVtLmxhc3RFbGVtZW50Q2hpbGQuY2xhc3NMaXN0LmFkZCgnYnJvLW1lbnVfX2FycicpO1xyXG5cdFx0fVxyXG5cclxuXHRcdGZ1bmN0aW9uIF9hZGRCdG5CYWNrKGVsZW0sIGxpbmspIHtcclxuXHRcdFx0Y29uc3QgaHJlZiA9IGxpbmsuZ2V0QXR0cmlidXRlKCdocmVmJyk7XHJcblxyXG5cdFx0XHRlbGVtLmluc2VydEFkamFjZW50SFRNTCgnYWZ0ZXJiZWdpbicsIGBcclxuXHRcdFx0PGxpPlxyXG5cdFx0XHRcdDxhIGNsYXNzPVwiYnJvLW1lbnVfX2JhY2sgbGlua1wiPlxyXG5cdFx0XHRcdFx0JHtkZWZhdWxPcHRpb25zLmFycm93fVxyXG5cdFx0XHRcdFx0JHtsaW5rLnRleHRDb250ZW50fVxyXG5cdFx0XHRcdDwvYT5cclxuXHRcdFx0PC9saT5cclxuXHRcdGApO1xyXG5cdFx0fVxyXG5cclxuXHRcdGZ1bmN0aW9uIF9zZXRIZWlnaE1lbnUoKSB7XHJcblx0XHRcdGlmICghJGFjdGl2ZVVsKSByZXR1cm47XHJcblxyXG5cdFx0XHQkbWVudS5zdHlsZS5oZWlnaHQgPSAkYWN0aXZlVWwub2Zmc2V0SGVpZ2h0ICsgXCJweFwiO1xyXG5cdFx0fVxyXG5cclxuXHRcdGZ1bmN0aW9uIHNjcm9sbFRvVmlzaWJsZShlbCkge1xyXG5cdFx0XHRpZiAoX2dldFBvc0Fic1dpbmRvdyhlbCkgPiB3aW5kb3cucGFnZVlPZmZzZXQpIHJldHVybjtcclxuXHJcblx0XHRcdGJhY2tUb1RvcCgtMTAsIF9nZXRQb3MoZWwpKTtcclxuXHRcdH1cclxuXHJcblx0XHRmdW5jdGlvbiBfZ2V0UG9zQWJzV2luZG93KGVsZW0pIHtcclxuXHRcdFx0Y29uc3Qgb2Zmc2V0VG9wID0gZWxlbS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS50b3A7XHJcblxyXG5cdFx0XHRyZXR1cm4gb2Zmc2V0VG9wIC0gd2luZG93LnBhZ2VZT2Zmc2V0O1xyXG5cdFx0fVxyXG5cclxuXHRcdGZ1bmN0aW9uIF9nZXRQb3MoZWwpIHtcclxuXHRcdFx0cmV0dXJuIGVsLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLnRvcCArIHdpbmRvdy5wYWdlWU9mZnNldDtcclxuXHRcdH1cclxuXHJcblx0XHRmdW5jdGlvbiBiYWNrVG9Ub3AoaW50ZXJ2YWwsIHRvKSB7XHJcblx0XHRcdGlmICh3aW5kb3cucGFnZVlPZmZzZXQgPD0gdG8pIHJldHVybjtcclxuXHJcblx0XHRcdHdpbmRvdy5zY3JvbGxCeSgwLCBpbnRlcnZhbCk7XHJcblx0XHRcdHNldFRpbWVvdXQoKCkgPT4ge1xyXG5cdFx0XHRcdGJhY2tUb1RvcChpbnRlcnZhbCwgdG8pXHJcblx0XHRcdH0sIDApO1xyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiBtZXRob2Q7XHJcblx0fVxyXG59KCkpOyIsIi8qXHJcblx0cHJpbWFyeSBqc1x0XHJcbiovXHJcbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgZnVuY3Rpb24gKGUpIHtcclxuXHQvKiBibG9jayBjb2RlICovXHJcblx0e1xyXG5cdFx0aWYgKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ2hlYWRlcicpKSB7XHJcblx0XHRcdGNvbnN0IGhlYWRlckVsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignaGVhZGVyJyk7XHJcblxyXG5cdFx0XHRjb25zdCBzZXRWYXJpYWJsZUhlaWdodEhlYWRlciA9IChlbCkgPT4ge1xyXG5cdFx0XHRcdGlmIChlbCkge1xyXG5cdFx0XHRcdFx0ZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnN0eWxlLnNldFByb3BlcnR5KFwiLS1oZWFkZXItaGVpZ2h0XCIsIGhlYWRlckVsLm9mZnNldEhlaWdodCArIFwicHhcIik7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRzZXRUaW1lb3V0KCgpID0+IHsgc2V0VmFyaWFibGVIZWlnaHRIZWFkZXIoaGVhZGVyRWwpIH0sIDApO1xyXG5cclxuXHRcdFx0WydyZXNpemUnLCAnbG9hZCddLmZvckVhY2gobGlzdGVuZXIgPT4ge1xyXG5cdFx0XHRcdHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKGxpc3RlbmVyLCBmdW5jdGlvbiAoKSB7XHJcblx0XHRcdFx0XHRzZXRWYXJpYWJsZUhlaWdodEhlYWRlcihoZWFkZXJFbCk7XHJcblx0XHRcdFx0fSk7XHJcblx0XHRcdH0pO1xyXG5cdFx0fVxyXG5cdH1cclxufSk7IiwiLy8gc2VhcmNoXHJcbmlmIChkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdbZGF0YS1zZWFyY2gtdG9nZ2xlXScpICYmIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ1tkYXRhLXNlYXJjaC1wYW5lbF0nKSkge1xyXG5cdGNvbnN0ICRodG1sID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50O1xyXG5cdGNvbnN0ICRzZWFyY2hQYW5lbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ1tkYXRhLXNlYXJjaC1wYW5lbF0nKTtcclxuXHRjb25zdCAkaW5wdXQgPSAkc2VhcmNoUGFuZWwucXVlcnlTZWxlY3RvcignaW5wdXRbdHlwZT1cInNlYXJjaFwiXScpO1xyXG5cdGNvbnN0ICRjbGVhckJ0biA9ICRzZWFyY2hQYW5lbC5xdWVyeVNlbGVjdG9yKCdbZGF0YS1zZWFyY2gtY2xlYXJdJyk7XHJcblx0Y29uc3QgY2xvc2VQYW5lbFNlbGVjdG9yID0gJ1tkYXRhLXNlYXJjaC1jbG9zZV0nO1xyXG5cdGNvbnN0IHNlYXJjaEJ0blNlbGVjdG9yID0gJ1tkYXRhLXNlYXJjaC10b2dnbGVdJztcclxuXHRjb25zdCB0b2dnbGVDbGFzcyA9ICdpcy1vcGVuJztcclxuXHRjb25zdCAkdG9nZ2xlcnMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKHNlYXJjaEJ0blNlbGVjdG9yKTtcclxuXHRsZXQgaXNPcGVuID0gZmFsc2U7XHJcblxyXG5cdGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24gKGUpIHtcclxuXHRcdGxldCAkdGFyZ2V0ID0gZS50YXJnZXQ7XHJcblxyXG5cdFx0aWYgKCR0YXJnZXQuY2xvc2VzdChzZWFyY2hCdG5TZWxlY3RvcikpIHtcclxuXHRcdFx0JHRhcmdldCA9ICR0YXJnZXQuY2xvc2VzdChzZWFyY2hCdG5TZWxlY3Rvcik7XHJcblxyXG5cdFx0XHQkc2VhcmNoUGFuZWwuY2xhc3NMaXN0LnRvZ2dsZSh0b2dnbGVDbGFzcyk7XHJcblxyXG5cdFx0XHRpZiAoJHNlYXJjaFBhbmVsLmNsYXNzTGlzdC5jb250YWlucyh0b2dnbGVDbGFzcykpIHtcclxuXHRcdFx0XHRpc09wZW4gPSB0cnVlO1xyXG5cclxuXHRcdFx0XHRpZiAoJGlucHV0KSAkaW5wdXQuZm9jdXMoKTtcclxuXHRcdFx0XHR0b2dnbGVPdmVyZmxvd0RvY3VtZW50KHRydWUpO1xyXG5cdFx0XHRcdGZvciAoY29uc3QgJHRvZ2dsZSBvZiAkdG9nZ2xlcnMpIHtcclxuXHRcdFx0XHRcdCR0b2dnbGUuY2xhc3NMaXN0LmFkZCgnYWN0aXZlJyk7XHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRkb2N1bWVudC5kb2N1bWVudEVsZW1lbnRcclxuXHRcdFx0XHRcdC5kaXNwYXRjaEV2ZW50KG5ldyBDdXN0b21FdmVudChcImFjdGlvbjpjbG9zZUJ1cmdlclwiLCB7XHJcblx0XHRcdFx0XHRcdGJ1YmJsZXM6IHRydWUsXHJcblx0XHRcdFx0XHRcdGNhbmNlbGFibGU6IHRydWVcclxuXHRcdFx0XHRcdH0pKTtcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRjbG9zZVNlYXJjaFBhbmVsKCk7XHJcblx0XHRcdH1cclxuXHRcdH0gZWxzZSBpZiAoJGNsZWFyQnRuLmNvbnRhaW5zKGUudGFyZ2V0KSkge1xyXG5cdFx0XHQkaW5wdXQudmFsdWUgPSBcIlwiO1xyXG5cdFx0XHQkaW5wdXQuZm9jdXMoKTtcclxuXHRcdFx0JGNsZWFyQnRuLmNsYXNzTGlzdC5yZW1vdmUoJ2lzLWNsZWFyJyk7XHJcblx0XHR9IGVsc2UgaWYgKGUudGFyZ2V0LmNsb3Nlc3QoY2xvc2VQYW5lbFNlbGVjdG9yKSkge1xyXG5cdFx0XHRjbG9zZVNlYXJjaFBhbmVsKCk7XHJcblx0XHR9XHJcblx0fSk7XHJcblxyXG5cdGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2FjdGlvbjpjbG9zZVNlYXJjaCcsIGZ1bmN0aW9uICgpIHtcclxuXHRcdGlmIChpc09wZW4pIHtcclxuXHRcdFx0Y2xvc2VTZWFyY2hQYW5lbCgpO1xyXG5cdFx0fVxyXG5cdH0pO1xyXG5cclxuXHQkaW5wdXQuYWRkRXZlbnRMaXN0ZW5lcigna2V5dXAnLCBmdW5jdGlvbiAoZSkge1xyXG5cdFx0aWYgKHRoaXMudmFsdWUubGVuZ3RoICE9PSAwKSB7XHJcblx0XHRcdCRjbGVhckJ0bi5jbGFzc0xpc3QuYWRkKCdpcy1jbGVhcicpO1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0JGNsZWFyQnRuLmNsYXNzTGlzdC5yZW1vdmUoJ2lzLWNsZWFyJyk7XHJcblx0XHR9XHJcblx0fSk7XHJcblxyXG5cdGZ1bmN0aW9uIGNsb3NlU2VhcmNoUGFuZWwoKSB7XHJcblx0XHRpc09wZW4gPSBmYWxzZTtcclxuXHJcblx0XHQkc2VhcmNoUGFuZWwuY2xhc3NMaXN0LnJlbW92ZSh0b2dnbGVDbGFzcyk7XHJcblx0XHQkaW5wdXQudmFsdWUgPSAnJztcclxuXHRcdCRjbGVhckJ0bi5jbGFzc0xpc3QucmVtb3ZlKCdpcy1jbGVhcicpO1xyXG5cdFx0dG9nZ2xlT3ZlcmZsb3dEb2N1bWVudChmYWxzZSk7XHJcblxyXG5cdFx0Zm9yIChjb25zdCAkdG9nZ2xlIG9mICR0b2dnbGVycykge1xyXG5cdFx0XHQkdG9nZ2xlLmNsYXNzTGlzdC5yZW1vdmUoJ2FjdGl2ZScpO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gdG9nZ2xlT3ZlcmZsb3dEb2N1bWVudChpcykge1xyXG5cdFx0aWYgKGlzKSB7XHJcblx0XHRcdGNvbnN0IHNjcm9sbEJhcldpZHRoID0gd2luZG93LmlubmVyV2lkdGggLSBkb2N1bWVudC5ib2R5Lm9mZnNldFdpZHRoO1xyXG5cdFx0XHQkaHRtbC5zdHlsZS5vdmVyZmxvdyA9ICdoaWRkZW4nO1xyXG5cdFx0XHQkaHRtbC5zdHlsZS5wYWRkaW5nUmlnaHQgPSBzY3JvbGxCYXJXaWR0aCArIFwicHhcIjtcclxuXHRcdFx0JGh0bWwuY2xhc3NMaXN0LmFkZCgnaXMtb3ZlcmZsb3cnKTtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdCRodG1sLmNsYXNzTGlzdC5yZW1vdmUoJ2lzLW92ZXJmbG93Jyk7XHJcblx0XHRcdCRodG1sLnN0eWxlLm92ZXJmbG93ID0gJyc7XHJcblx0XHRcdCRodG1sLnN0eWxlLnBhZGRpbmdSaWdodCA9IFwiXCI7XHJcblx0XHR9XHJcblx0fVxyXG59Iiwid2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCBmdW5jdGlvbiAoKSB7XHJcblx0Ly8gYnRuIHRvcCBcclxuXHRpZiAoX3V0aWxzLmlzRWxlbSgnLmpzLXRvcCcpKSB7XHJcblx0XHRjb25zdCBidG5FbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5qcy10b3AnKTtcclxuXHJcblx0XHR3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignc2Nyb2xsJywgX3V0aWxzLnRocm90dGxlKGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0aWYgKHdpbmRvdy5wYWdlWU9mZnNldCA+ICh3aW5kb3cuaW5uZXJIZWlnaHQgLyAyKSkge1xyXG5cdFx0XHRcdGJ0bkVsLmNsYXNzTGlzdC5hZGQoJ3Zpc2libGUnKTtcclxuXHRcdFx0fSBlbHNlIGlmICh3aW5kb3cucGFnZVlPZmZzZXQgPCAod2luZG93LmlubmVySGVpZ2h0IC8gMikgJiYgYnRuRWwuY2xhc3NMaXN0LmNvbnRhaW5zKCd2aXNpYmxlJykpIHtcclxuXHRcdFx0XHRidG5FbC5jbGFzc0xpc3QucmVtb3ZlKCd2aXNpYmxlJyk7XHJcblx0XHRcdH1cclxuXHRcdH0sIDIwMCkpO1xyXG5cdH1cclxuXHJcblx0Ly9maXhlZCBoZWFkZXJcclxuXHRpZiAoZG9jdW1lbnQucXVlcnlTZWxlY3RvcignaGVhZGVyJykpIHtcclxuXHRcdHNob3dIZWFkZXIoJ2hlYWRlcicpO1xyXG5cclxuXHRcdGZ1bmN0aW9uIHNob3dIZWFkZXIoZWwpIHtcclxuXHRcdFx0Y29uc3QgJGVsID0gKHR5cGVvZiBlbCA9PT0gJ3N0cmluZycpID8gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihlbCkgOiBlbDtcclxuXHRcdFx0bGV0IHNjcm9sbGluZyA9IHdpbmRvdy5wYWdlWU9mZnNldDtcclxuXHRcdFx0bGV0IGZpeGluZ0luZGVudCA9ICRlbC5vZmZzZXRIZWlnaHQgKyAyMDtcclxuXHRcdFx0bGV0IGlzRml4ID0gZmFsc2U7XHJcblx0XHRcdGxldCBpc1Nob3cgPSBmYWxzZTtcclxuXHJcblx0XHRcdHNjcm9sbEhhbmRsZXIoKTtcclxuXHJcblx0XHRcdHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdzY3JvbGwnLCBfdXRpbHMudGhyb3R0bGUoc2Nyb2xsSGFuZGxlciwgMTAwKSk7XHJcblxyXG5cdFx0XHR3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgZnVuY3Rpb24gKCkge1xyXG5cdFx0XHRcdGZpeGluZ0luZGVudCA9ICRlbC5vZmZzZXRIZWlnaHQgKyAyMDtcclxuXHRcdFx0fSlcclxuXHJcblx0XHRcdGZ1bmN0aW9uIHNjcm9sbEhhbmRsZXIoKSB7XHJcblx0XHRcdFx0dG9nZ2xlU2hvdygpO1xyXG5cdFx0XHRcdHRvZ2dsZUZpeCgpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRmdW5jdGlvbiB0b2dnbGVTaG93KCkge1xyXG5cdFx0XHRcdGlmIChzY3JvbGxpbmcgPiB3aW5kb3cucGFnZVlPZmZzZXQgJiYgIWlzU2hvdykge1xyXG5cdFx0XHRcdFx0JGVsLmNsYXNzTGlzdC5hZGQoJ3Nob3cnKTtcclxuXHRcdFx0XHRcdGlzU2hvdyA9IHRydWU7XHJcblx0XHRcdFx0fSBlbHNlIGlmIChzY3JvbGxpbmcgPCB3aW5kb3cucGFnZVlPZmZzZXQgJiYgaXNTaG93KSB7XHJcblx0XHRcdFx0XHQkZWwuY2xhc3NMaXN0LnJlbW92ZSgnc2hvdycpO1xyXG5cdFx0XHRcdFx0aXNTaG93ID0gZmFsc2U7XHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRzY3JvbGxpbmcgPSB3aW5kb3cucGFnZVlPZmZzZXQ7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGZ1bmN0aW9uIHRvZ2dsZUZpeCgpIHtcclxuXHRcdFx0XHRpZiAod2luZG93LnBhZ2VZT2Zmc2V0ID4gZml4aW5nSW5kZW50KSB7XHJcblx0XHRcdFx0XHRpZiAoaXNGaXgpIHJldHVybjtcclxuXHJcblx0XHRcdFx0XHQkZWwuY2xhc3NMaXN0LmFkZCgnZml4ZWQnKTtcclxuXHRcdFx0XHRcdGlzRml4ID0gdHJ1ZTtcclxuXHRcdFx0XHR9IGVsc2UgaWYgKHdpbmRvdy5wYWdlWU9mZnNldCA8IGZpeGluZ0luZGVudCkge1xyXG5cdFx0XHRcdFx0aWYgKCFpc0ZpeCkgcmV0dXJuO1xyXG5cclxuXHRcdFx0XHRcdCRlbC5jbGFzc0xpc3QucmVtb3ZlKCdmaXhlZCcpO1xyXG5cdFx0XHRcdFx0aXNGaXggPSBmYWxzZTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdGlmICgkKFwiLmZpbHRlcnNcIikubGVuZ3RoKSB7XHJcblx0XHRjb25zdCAkZmlsdGVyc0Jsb2NrID0gJChcIi5maWx0ZXJzXCIpO1xyXG5cclxuXHRcdCRmaWx0ZXJzQmxvY2sub24oXCJjbGlja1wiLCBmdW5jdGlvbiAoZSkge1xyXG5cdFx0XHRsZXQgdGFyZ2VFbCA9IGUudGFyZ2V0O1xyXG5cclxuXHRcdFx0aWYgKHRhcmdlRWwuY2xvc2VzdCgnLmZpbHRlcnNfX2ZpZWxkc2V0LXRpdGxlJykpIHtcclxuXHRcdFx0XHRjb25zdCAkcGFyZW50ID0gJCh0YXJnZUVsKS5jbG9zZXN0KFwiLmZpbHRlcnNfX2ZpZWxkc2V0XCIpO1xyXG5cdFx0XHRcdGNvbnN0ICRpbm5lckZpZWxkID0gJHBhcmVudC5maW5kKCcuZmlsdGVyc19fZmllbGRzZXQtYm94Jyk7XHJcblxyXG5cdFx0XHRcdGlmICgkcGFyZW50Lmhhc0NsYXNzKFwiZmlsdGVyc19fZmllbGRzZXQtLXVub3BlbmVkXCIpKSB7XHJcblx0XHRcdFx0XHQkcGFyZW50LnJlbW92ZUNsYXNzKFwiZmlsdGVyc19fZmllbGRzZXQtLXVub3BlbmVkXCIpO1xyXG5cdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHQkcGFyZW50LmFkZENsYXNzKFwiZmlsdGVyc19fZmllbGRzZXQtLXVub3BlbmVkXCIpO1xyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0JGlubmVyRmllbGQuc2xpZGVUb2dnbGUoMzAwKTtcclxuXHRcdFx0fVxyXG5cdFx0fSlcclxuXHR9XHJcblxyXG5cdC8vLyBtb2JpbGUgZmlsdGVycyB0b2dnbGUgXHJcblx0aWYgKF91dGlscy5pc0VsZW0oJy5qcy10b2dnbGUtZmlsdGVycycpKSB7XHJcblx0XHRjb25zdCAkZmlsdGVyRWwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuanMtbW9kYWwtZmlsdGVycycpO1xyXG5cdFx0Y29uc3QgdG9nZ2xlRmlsdGVyc0NsYXNzID0gJ2pzLXRvZ2dsZS1maWx0ZXJzJztcclxuXHRcdGNvbnN0IG9wZW5GaWx0ZXJzQ2xhc3MgPSAnb3Blbic7XHJcblxyXG5cdFx0ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbiAoZSkge1xyXG5cdFx0XHRpZiAoZS50YXJnZXQuY2xvc2VzdChgLiR7dG9nZ2xlRmlsdGVyc0NsYXNzfWApICYmICRmaWx0ZXJFbCkge1xyXG5cdFx0XHRcdCRmaWx0ZXJFbC5jbGFzc0xpc3QudG9nZ2xlKG9wZW5GaWx0ZXJzQ2xhc3MpO1xyXG5cclxuXHRcdFx0XHRfdXRpbHMudG9nZ2xlT3ZlcmZsb3dEb2N1bWVudCgkZmlsdGVyRWwuY2xhc3NMaXN0LmNvbnRhaW5zKG9wZW5GaWx0ZXJzQ2xhc3MpKTtcclxuXHRcdFx0fVxyXG5cdFx0fSlcclxuXHR9XHJcblxyXG5cdC8vIHByb2R1Y3QgZ2FsbGVyeVxyXG5cdGlmIChfdXRpbHMuaXNFbGVtKCcuZ2FsbGVyeScpKSB7XHJcblx0XHRmb3IgKGNvbnN0IGdhbGxlcnlFbCBvZiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcuZ2FsbGVyeScpKSB7XHJcblx0XHRcdGdhbGxlcnkoZ2FsbGVyeUVsKTtcclxuXHRcdH1cclxuXHJcblx0XHRmdW5jdGlvbiBnYWxsZXJ5KCRlbCkge1xyXG5cdFx0XHRjb25zdCAkZnVsbFNsaWRlciA9ICRlbC5xdWVyeVNlbGVjdG9yKCcuZ2FsbGVyeV9fc2xpZGVyJyk7XHJcblx0XHRcdGNvbnN0ICR0aHVtYnNTbGlkZXIgPSAkZWwucXVlcnlTZWxlY3RvcignLmdhbGxlcnlfX3RodW1icycpO1xyXG5cclxuXHRcdFx0LyogdGh1bWJzICovXHJcblx0XHRcdGxldCBnYWxsZXJ5VGh1bWJzID0gX3BsdWdpbnMuc2xpZGVyKCR0aHVtYnNTbGlkZXIsIHtcclxuXHRcdFx0XHRzcGFjZUJldHdlZW46IDEyLFxyXG5cdFx0XHRcdHNsaWRlc1BlclZpZXc6IFwiYXV0b1wiLFxyXG5cdFx0XHRcdHdhdGNoU2xpZGVzUHJvZ3Jlc3M6IHRydWUsXHJcblx0XHRcdFx0ZnJlZU1vZGU6IHtcclxuXHRcdFx0XHRcdGVuYWJsZWQ6IHRydWUsXHJcblx0XHRcdFx0XHRzdGlja3k6IHRydWUsXHJcblx0XHRcdFx0fSxcclxuXHRcdFx0XHRicmVha3BvaW50czoge1xyXG5cdFx0XHRcdFx0MzAwOiB7XHJcblx0XHRcdFx0XHRcdHNwYWNlQmV0d2VlbjogMTIsXHJcblx0XHRcdFx0XHR9LFxyXG5cdFx0XHRcdFx0W215QXBwLmJyZWFrcG9pbnRzLnNtXToge1xyXG5cdFx0XHRcdFx0XHRzcGFjZUJldHdlZW46IDIyLFxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH0sXHJcblx0XHRcdFx0a2V5Ym9hcmQ6IHtcclxuXHRcdFx0XHRcdGVuYWJsZWQ6IHRydWUsXHJcblx0XHRcdFx0XHRvbmx5SW5WaWV3cG9ydDogZmFsc2VcclxuXHRcdFx0XHR9LFxyXG5cdFx0XHRcdG1vdXNld2hlZWw6IHRydWUsXHJcblx0XHRcdH0pO1xyXG5cclxuXHRcdFx0bGV0IGdhbGxlcnlGdWxsID0gbmV3IF9wbHVnaW5zLnNsaWRlcigkZnVsbFNsaWRlciwge1xyXG5cdFx0XHRcdHNwYWNlQmV0d2VlbjogMTAsXHJcblx0XHRcdFx0c2xpZGVzUGVyVmlldzogXCJhdXRvXCIsXHJcblx0XHRcdFx0bGF6eToge1xyXG5cdFx0XHRcdFx0bG9hZFByZXZOZXh0OiB0cnVlLFxyXG5cdFx0XHRcdH0sXHJcblx0XHRcdFx0dGh1bWJzOiB7XHJcblx0XHRcdFx0XHRzd2lwZXI6IGdhbGxlcnlUaHVtYnMsXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9KTtcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdEFycmF5LnByb3RvdHlwZS5mb3JFYWNoLmNhbGwoZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnW2RhdGEtdmlzaWJsZS1pdGVtc10nKSwgKGNvbnRhaW5lckVsKSA9PiB7XHJcblx0XHRjb25zdCBnZW5lcmFsV3JhcEVsID0gY29udGFpbmVyRWwucGFyZW50RWxlbWVudDtcclxuXHRcdGNvbnN0IHRvZ2dsZXJFbCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5qcy10b2dnbGVyLXZpc2libGUnKTtcclxuXHRcdGNvbnN0IGNvdW50ID0gcGFyc2VJbnQoY29udGFpbmVyRWwuZGF0YXNldC52aXNpYmxlSXRlbXMpO1xyXG5cdFx0Y29uc3QgaGlkZGVuRWxzID0gW107XHJcblxyXG5cdFx0aWYgKCF0b2dnbGVyRWwpIHJldHVybjtcclxuXHJcblx0XHRpZiAoY29udGFpbmVyRWwuY2hpbGRyZW4ubGVuZ3RoIDw9IGNvdW50KSB7XHJcblx0XHRcdHRvZ2dsZXJFbC5oaWRkZW4gPSB0cnVlO1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0QXJyYXkuZnJvbShjb250YWluZXJFbC5jaGlsZHJlbikuZm9yRWFjaCgoaXRlbSwgaSkgPT4ge1xyXG5cdFx0XHRcdGlmIChpIDwgY291bnQpIHJldHVybjtcclxuXHJcblx0XHRcdFx0aGlkZGVuRWxzLnB1c2goaXRlbSk7XHJcblx0XHRcdFx0aXRlbS5oaWRkZW4gPSB0cnVlO1xyXG5cdFx0XHR9KTtcclxuXHRcdH1cclxuXHJcblx0XHR0b2dnbGVyRWwuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbigpIHtcclxuXHRcdFx0dGhpcy5jbGFzc0xpc3QudG9nZ2xlKCdhY3RpdmUnKTtcclxuXHRcdFx0aGlkZGVuRWxzLmZvckVhY2goaXRlbSA9PiBpdGVtLmhpZGRlbiA9ICF0aGlzLmNsYXNzTGlzdC5jb250YWlucygnYWN0aXZlJykpO1xyXG5cdFx0fSk7XHJcblx0fSk7XHJcblxyXG5cdGlmIChkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuc29ydCcpKSB7XHJcblx0XHRjb25zdCBzb3J0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnNvcnQnKTtcclxuXHRcdGNvbnN0IHZhbHVlU29ydCA9IHNvcnQucXVlcnlTZWxlY3RvcignLnNvcnRfX3ZhbCcpO1xyXG5cdFx0Y29uc3QgYWN0aXZlSXRlbSA9IHNvcnQucXVlcnlTZWxlY3RvcignLnNvcnRfX3ZhbC5hY3RpdmUnKTtcclxuXHRcdGNvbnN0IHRvZ2dsZUNsYXNzID0gJ2otc29ydC10b2dnbGUnO1xyXG5cclxuXHRcdGlmIChhY3RpdmVJdGVtKSB7XHJcblx0XHRcdHZhbHVlU29ydC50ZXh0Q29udGVudCA9IGFjdGl2ZUl0ZW0udGV4dENvbnRlbnQ7XHJcblx0XHR9XHJcblxyXG5cdFx0ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbiAoZSkge1xyXG5cdFx0XHRpZiAoZS50YXJnZXQuY2xvc2VzdChgLiR7dG9nZ2xlQ2xhc3N9YCkpIHtcclxuXHRcdFx0XHRzb3J0LmNsYXNzTGlzdC50b2dnbGUoJ2FjdGl2ZScpO1xyXG5cdFx0XHR9IGVsc2UgaWYgKGUudGFyZ2V0LmNsb3Nlc3QoJy5zb3J0X19pdGVtJykpIHtcclxuXHRcdFx0XHRjb25zdCBzb3J0SXRlbSA9IGUudGFyZ2V0LmNsb3Nlc3QoJy5zb3J0X19pdGVtJyk7XHJcblxyXG5cdFx0XHRcdGlmIChzb3J0SXRlbS5jbGFzc0xpc3QuY29udGFpbnMoJ2FjdGl2ZScpKSByZXR1cm47XHJcblxyXG5cdFx0XHRcdHZhbHVlU29ydC50ZXh0Q29udGVudCA9IHNvcnRJdGVtLnRleHRDb250ZW50O1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRpZiAoIWUudGFyZ2V0LmNsb3Nlc3QoYC4ke3RvZ2dsZUNsYXNzfWApKSB7XHJcblx0XHRcdFx0c29ydC5jbGFzc0xpc3QucmVtb3ZlKCdhY3RpdmUnKTtcclxuXHRcdFx0fVxyXG5cdFx0fSk7XHJcblx0fVxyXG5cclxuXHQvLyDRhNC40LrRgdCw0YbQuNGPINC90LDQstC40LPQsNGG0LjQuCDQv9GA0L7QtNGD0LrRgtCwXHJcblx0aWYgKF91dGlscy5pc0VsZW0oJy5uYXYtcGFuZWwnKSkge1xyXG5cdFx0Y29uc3QgJGhlYWRlciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ2hlYWRlcicpO1xyXG5cdFx0Y29uc3QgJG5hdlBhbmVsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLm5hdi1wYW5lbCcpO1xyXG5cclxuXHRcdF9wbHVnaW5zLmZpeGVkRWxlbVRvcCgkbmF2UGFuZWwsIHtcclxuXHRcdFx0Y2xhc3NQbGFjZTogJ25hdi1wYW5lbC1wbGFjZSdcclxuXHRcdH0pO1xyXG5cclxuXHRcdGNvbnN0IG5hdkxpbmtTZWxlY3RvciA9ICdbaHJlZio9XCIjXCJdJztcclxuXHRcdGNvbnN0ICRuYXZMaW5rcyA9ICRuYXZQYW5lbC5xdWVyeVNlbGVjdG9yQWxsKG5hdkxpbmtTZWxlY3Rvcik7XHJcblx0XHRjb25zdCBzZWN0aW9ucyA9IFtdO1xyXG5cdFx0bGV0IGluZGV4QWN0aXZlTGluayA9IG51bGw7XHJcblxyXG5cdFx0Zm9yIChjb25zdCAkbmF2TGluayBvZiAkbmF2TGlua3MpIHtcclxuXHRcdFx0Y29uc3QgaGFzaCA9ICRuYXZMaW5rLmhhc2g7XHJcblx0XHRcdGNvbnN0IHNlY3Rpb24gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGhhc2gpO1xyXG5cclxuXHRcdFx0aWYgKHNlY3Rpb24pIHtcclxuXHRcdFx0XHRzZWN0aW9ucy5wdXNoKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoaGFzaCkpO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0aWYgKHNlY3Rpb25zLmxlbmd0aCA9PT0gMCkgcmV0dXJuO1xyXG5cclxuXHRcdHNldEFjdGl2ZUxpbmtCeVNjcm9sbCgpO1xyXG5cclxuXHRcdHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdzY3JvbGwnLCBzZXRBY3RpdmVMaW5rQnlTY3JvbGwpO1xyXG5cclxuXHRcdCRuYXZQYW5lbC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uIChlKSB7XHJcblx0XHRcdGNvbnN0IGxpbmsgPSBlLnRhcmdldC5jbG9zZXN0KCdhW2hyZWYqPVwiI1wiXScpO1xyXG5cclxuXHRcdFx0aWYgKCFsaW5rKSByZXR1cm47XHJcblxyXG5cdFx0XHRlLnByZXZlbnREZWZhdWx0KCk7XHJcblx0XHRcdGNvbnN0IHNlY3Rpb25JZCA9IGxpbmsuZ2V0QXR0cmlidXRlKCdocmVmJyk7XHJcblx0XHRcdGNvbnN0IHNlY3Rpb24gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKHNlY3Rpb25JZCk7XHJcblxyXG5cdFx0XHRpZiAoIXNlY3Rpb24pIHJldHVybjtcclxuXHJcblx0XHRcdGNvbnN0IHNlY3Rpb25PZmZzZXRUb3AgPSBfdXRpbHMuZ2V0T2Zmc2V0VG9wKHNlY3Rpb24pO1xyXG5cclxuXHRcdFx0bGV0IHNjcm9sbFBvaW50ID0gc2VjdGlvbk9mZnNldFRvcCArIDEwO1xyXG5cclxuXHRcdFx0aWYgKHdpbmRvdy5pbm5lcldpZHRoID4gbXlBcHAuYnJlYWtwb2ludHMuc20pIHtcclxuXHRcdFx0XHRzY3JvbGxQb2ludCAtPSAkbmF2UGFuZWwub2Zmc2V0SGVpZ2h0O1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRpZiAoJGhlYWRlcikge1xyXG5cdFx0XHRcdHNjcm9sbFBvaW50ID0gc2Nyb2xsUG9pbnQgLSAkaGVhZGVyLm9mZnNldEhlaWdodDtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0d2luZG93LnNjcm9sbFRvKDAsIHNjcm9sbFBvaW50KTtcclxuXHRcdH0pXHJcblxyXG5cdFx0ZnVuY3Rpb24gc2V0QWN0aXZlTGlua0J5U2Nyb2xsKCkge1xyXG5cdFx0XHRjb25zdCB0b3BTZWN0aW9ucyA9IHNlY3Rpb25zLm1hcCgkc2VjdGlvbiA9PiB7XHJcblx0XHRcdFx0cmV0dXJuIF91dGlscy5nZXRPZmZzZXRUb3AoJHNlY3Rpb24pIC0gd2luZG93LmlubmVySGVpZ2h0ICogMC4xODtcclxuXHRcdFx0fSk7XHJcblxyXG5cdFx0XHRsZXQgY3VycmVudEFjdGl2ZUluZGV4ID0gbnVsbDtcclxuXHRcdFx0Y29uc3QgZmlyc3RTZWN0aW9uVG9wQ29vcmRzID0gdG9wU2VjdGlvbnNbMF07XHJcblx0XHRcdGNvbnN0IGxhc3RTZWN0aW9uQm90dG9tQ29vcmRzID0gdG9wU2VjdGlvbnNbdG9wU2VjdGlvbnMubGVuZ3RoIC0gMV0gKyBzZWN0aW9uc1t0b3BTZWN0aW9ucy5sZW5ndGggLSAxXS5vZmZzZXRIZWlnaHQ7XHJcblxyXG5cdFx0XHRsZXQgb2Zmc2V0VG9wQnlOb2RlcyA9IF91dGlscy5wYWdlWU9mZnNldEJ5Tm9kZXMoJG5hdlBhbmVsKTtcclxuXHJcblx0XHRcdGlmICgkaGVhZGVyKSB7XHJcblx0XHRcdFx0b2Zmc2V0VG9wQnlOb2RlcyA9IF91dGlscy5wYWdlWU9mZnNldEJ5Tm9kZXMoJG5hdlBhbmVsLCAkaGVhZGVyKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0aWYgKG9mZnNldFRvcEJ5Tm9kZXMgPCBmaXJzdFNlY3Rpb25Ub3BDb29yZHMgfHwgb2Zmc2V0VG9wQnlOb2RlcyA+IGxhc3RTZWN0aW9uQm90dG9tQ29vcmRzKSB7XHJcblx0XHRcdFx0aWYgKGluZGV4QWN0aXZlTGluayA9PT0gbnVsbCkgcmV0dXJuO1xyXG5cclxuXHRcdFx0XHQkbmF2TGlua3NbaW5kZXhBY3RpdmVMaW5rXS5jbGFzc0xpc3QucmVtb3ZlKCdhY3RpdmUnKTtcclxuXHRcdFx0XHRpbmRleEFjdGl2ZUxpbmsgPSBudWxsO1xyXG5cdFx0XHRcdHJldHVybjtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCB0b3BTZWN0aW9ucy5sZW5ndGg7IGkrKykge1xyXG5cdFx0XHRcdGlmIChvZmZzZXRUb3BCeU5vZGVzID4gdG9wU2VjdGlvbnNbaV0pIHtcclxuXHRcdFx0XHRcdGN1cnJlbnRBY3RpdmVJbmRleCA9IGk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRpZiAoaW5kZXhBY3RpdmVMaW5rICE9PSBjdXJyZW50QWN0aXZlSW5kZXgpIHtcclxuXHRcdFx0XHRpbmRleEFjdGl2ZUxpbmsgPSBjdXJyZW50QWN0aXZlSW5kZXg7XHJcblx0XHRcdFx0Y2hhbmdlTmF2QWN0aXZlKCRuYXZMaW5rc1tpbmRleEFjdGl2ZUxpbmtdKVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0ZnVuY3Rpb24gY2hhbmdlTmF2QWN0aXZlKG5ld05hdkxpbmtOb2RlKSB7XHJcblx0XHRcdGZvciAobGV0IGkgPSAwOyBpIDwgJG5hdkxpbmtzLmxlbmd0aDsgaSsrKSB7XHJcblx0XHRcdFx0JG5hdkxpbmtzW2ldLmNsYXNzTGlzdC5yZW1vdmUoJ2FjdGl2ZScpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRuZXdOYXZMaW5rTm9kZS5jbGFzc0xpc3QuYWRkKCdhY3RpdmUnKTtcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdC8vIHRlbCBtYXNrXHJcblx0aWYgKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ2lucHV0W3R5cGU9XCJ0ZWxcIl0nKSkge1xyXG5cdFx0Y29uc3QgaW5wdXRzVGVsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnaW5wdXRbdHlwZT1cInRlbFwiXScpO1xyXG5cclxuXHRcdGNvbnN0IGltID0gbmV3IElucHV0bWFzaygnKzcgKDk5OSkgOTk5LTk5LTk5Jywge1xyXG5cdFx0XHRwb3NpdGlvbkNhcmV0T25DbGljazogXCJub25lXCJcclxuXHRcdH0pO1xyXG5cdFx0aW0ubWFzayhpbnB1dHNUZWwpO1xyXG5cclxuXHRcdC8vIGZvciAoY29uc3QgaW5wdXRUZWwgb2YgaW5wdXRzVGVsKSB7XHJcblx0XHQvLyBcdGNvbXBsZXRlVGVsSGFuZGxlcihpbnB1dFRlbCk7XHJcblx0XHQvLyB9XHJcblxyXG5cdFx0Ly8gJChkb2N1bWVudCkub24oJ2lucHV0JywgJ2lucHV0W3R5cGU9XCJ0ZWxcIl0nLCBmdW5jdGlvbiAoKSB7XHJcblx0XHQvLyBcdGNvbXBsZXRlVGVsSGFuZGxlcih0aGlzKTtcclxuXHRcdC8vIH0pO1xyXG5cclxuXHRcdC8vIGZ1bmN0aW9uIGNvbXBsZXRlVGVsSGFuZGxlcihpbnB1dFRlbE5vZGUpIHtcclxuXHRcdC8vIFx0Y29uc3QgaXNDb21wbGV0ZSA9ICQoaW5wdXRUZWxOb2RlKS5pbnB1dG1hc2soXCJpc0NvbXBsZXRlXCIpO1xyXG5cdFx0Ly8gXHRjb25zdCBmaWVsZEVsID0gaW5wdXRUZWxOb2RlLmNsb3Nlc3QoJy5maWVsZCcpO1xyXG5cdFx0Ly8gXHRjb25zdCBub3RpZnlFbCA9IGZpZWxkRWwucXVlcnlTZWxlY3RvcihcIi5maWVsZF9fbm90aWZ5XCIpO1xyXG5cclxuXHRcdC8vIFx0ZmllbGRFbC5jbGFzc0xpc3RbaXNDb21wbGV0ZSA/IFwicmVtb3ZlXCIgOiBcImFkZFwiXShcImZpZWxkLS1lcnJvclwiKTtcclxuXHRcdC8vIFx0bm90aWZ5RWwuaGlkZGVuID0gaXNDb21wbGV0ZTtcclxuXHRcdC8vIH07XHJcblx0fVxyXG59KTsiXX0=
