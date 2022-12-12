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