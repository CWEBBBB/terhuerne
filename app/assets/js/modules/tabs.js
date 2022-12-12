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