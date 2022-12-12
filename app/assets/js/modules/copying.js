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