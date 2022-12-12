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