function addSlider(layers, name, value) {
	var layer = layers.Effects.addProperty('ADBE Slider Control');
	layer.property(1).setValue(value);
	layer.name = name;
}

if (isValid(app.project.activeItem) == true) {
	app.beginUndoGroup('Handy Shake');

	var curItem = app.project.activeItem;
	var selectedLayers = curItem.selectedLayers;

	for (i = 0; i < selectedLayers.length; i++) {
		var layers = selectedLayers[i];
		var nullLayer = curItem.layers.addNull(curItem.duration);

		var nameMap = {
			en_US: 'Handy Shake',
			ja_JP: '手ブレ',
			fr_FR: 'Handy Shake',
		};

		var aeLang = app.language || 'en_US';

		var nullLayerName = nameMap[aeLang] || nameMap['en_US'];

		nullLayer.source.name = nullLayerName;

		nullLayer.moveBefore(layers);
		layers.parent = nullLayer;

		addSlider(nullLayer, 'Resolution (in DPI)', 72);
		addSlider(nullLayer, 'Scale in %', 100);
		addSlider(nullLayer, 'Frequency', 1);
		addSlider(nullLayer, 'Amplitude (in mm)', 5);
		addSlider(nullLayer, 'Noise Frequency', 5);
		addSlider(nullLayer, 'Noise Amplitude', 5);
		addSlider(nullLayer, 'Phase', 0);

		nullLayer.property('position').expression =
			"intDPI=effect('Resolution (in DPI)')('ADBE Slider Control-0001') ;\n" +
			"scale = effect('Scale in %')('ADBE Slider Control-0001') ;\n" +
			'if(intDPI==0){intDPI=Math.round(128*(scale/100) )}\n' +
			'mySpeed = intDPI/25.4;\n' +
			"freq=effect('Frequency')('ADBE Slider Control-0001');\n" +
			"amp=effect('Amplitude (in mm)')('ADBE Slider Control-0001');\n" +
			"octaves =effect('Noise Frequency')('ADBE Slider Control-0001');\n" +
			"amp_mult=effect('Noise Amplitude')('ADBE Slider Control-0001')/20;\n" +
			"t=time+framesToTime(effect('Phase')('ADBE Slider Control-0001'),1/thisComp.frameDuration);\n" +
			'amp=amp*mySpeed ;\n' +
			'wiggle(freq, amp, octaves , amp_mult , t)';
	}

	app.endUndoGroup();
} else {
	alert('レイヤーを選択してください。');
}
