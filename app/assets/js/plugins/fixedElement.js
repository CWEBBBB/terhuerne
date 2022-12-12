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