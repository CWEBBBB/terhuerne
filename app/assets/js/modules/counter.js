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