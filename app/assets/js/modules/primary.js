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