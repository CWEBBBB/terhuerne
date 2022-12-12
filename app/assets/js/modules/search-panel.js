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