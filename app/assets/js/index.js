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