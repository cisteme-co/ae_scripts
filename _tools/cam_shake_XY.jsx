function addSlider(layers, name, value) {
	var layer = layers.Effects.addProperty('ADBE Slider Control');
	layer.property(1).setValue(value);
	layer.name = name;
}

function addCheckbox(layers, name, value) {
	var layer = layers.Effects.addProperty('ADBE Checkbox Control');
	layer.property(1).setValue(value);
	layer.name = name;
}

function addAngle(layers, name, value) {
	var layer = layers.Effects.addProperty('ADBE Angle Control');
	layer.property(1).setValue(value);
	layer.name = name;
}

if (isValid(app.project.activeItem) == true) {
	app.beginUndoGroup('Cam Shake');

	var curItem = app.project.activeItem;
	var selectedLayers = curItem.selectedLayers;

	for (var i = 0; i < selectedLayers.length; i++) {
		var layers = selectedLayers[i];

		var nullLayer = curItem.layers.addNull(curItem.duration);
		nullLayer.moveBefore(layers);
		layers.parent = nullLayer;

		var nameByLang = {
			en: 'Camera Shake - X/Y',
			ja: '画面動 - X/Y',
			fr: 'Secousse Caméra - X/Y',
			de: 'Kamera-Wackeln - X/Y',
		};

		var langCode = app.language.toString().substr(0, 2); // e.g., "en", "ja"
		nullLayer.source.name = nameByLang[langCode] || nameByLang['en'];

		addSlider(nullLayer, 'Resolution (dpi)', 144);
		addSlider(nullLayer, 'X Axis (mm)', 5);
		addSlider(nullLayer, 'Y Axis (mm)', 10);
		addSlider(nullLayer, 'Random %', 50);
		addCheckbox(nullLayer, 'Invert Shaking', false);

		nullLayer.property('position').expression =
			'// mm units\n' +
			'T = timeToFrames(time, 1/thisComp.frameDuration);\n' +
			'intDPI = effect("Resolution (dpi)")("ADBE Slider Control-0001");\n' +
			'mySpeed = intDPI / 25.4;\n' +
			'RandomSlider = clamp(effect("Random %")("ADBE Slider Control-0001"), 0, 100);\n' +
			'myRandom = (100 - RandomSlider) / 100;\n' +
			'myInverse = (effect("Invert Shaking")("ADBE Checkbox Control-0001") * 2 - 1) / 2 + myRandom / 400;\n' +
			'X = position[0];\n' +
			'Y = position[1];\n' +
			'if (effect("Y Axis (mm)")("ADBE Slider Control-0001") == 0) {\n' +
			'  x = X + Math.pow(-1, T) * effect("X Axis (mm)")("ADBE Slider Control-0001") * random(myRandom, 1) * mySpeed * myInverse;\n' +
			'  y = Y + Math.pow(-1, T) * effect("Y Axis (mm)")("ADBE Slider Control-0001") * random(myRandom, 1) * mySpeed * myInverse;\n' +
			'} else {\n' +
			'  x = X + Math.pow(-1, Math.floor(T / 2) + 1) * effect("X Axis (mm)")("ADBE Slider Control-0001") * random(myRandom * Math.pow(-1, T), Math.pow(-1, T)) * mySpeed * myInverse;\n' +
			'  y = Y + Math.pow(-1, T) * effect("Y Axis (mm)")("ADBE Slider Control-0001") * random(myRandom, 1) * mySpeed * myInverse;\n' +
			'}\n' +
			'[x, y];';
	}

	app.endUndoGroup();
} else {
	alert('レイヤーを選択してください。');
}
