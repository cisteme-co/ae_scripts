// ────────────────────────────────────────────────
// ─────────────── Add Slider Helper ──────────────
// ────────────────────────────────────────────────
var rootFolder = File($.fileName).parent;
$.evalFile(new File(rootFolder.fsName + '/utils/alerts.jsx'));
$.evalFile(new File(rootFolder.fsName + '/utils/controls.jsx'));

// ────────────────────────────────────────────────
// ─────────────── Main Execution ─────────────────
// ────────────────────────────────────────────────
if (typeof isValid === 'function' && isValid(app.project.activeItem)) {
	app.beginUndoGroup('Handy Shake');

	var curItem = app.project.activeItem;
	var selectedLayers = curItem.selectedLayers;

	for (var i = 0; i < selectedLayers.length; i++) {
		var layer = selectedLayers[i];
		var nullLayer = curItem.layers.addNull(curItem.duration);

		// ────────────────────────────────────────────
		// ───────────── Localized Null Name ──────────
		// ────────────────────────────────────────────
		var nameMap = {
			en_US: 'Handy Shake',
			ja_JP: '手ブレ',
			fr_FR: 'Handy Shake',
		};

		var aeLang = app.language || 'en_US';
		var nullLayerName = nameMap[aeLang] || nameMap['en_US'];
		nullLayer.source.name = nullLayerName;

		// ────────────────────────────────────────────
		// ───────────── Setup Null Layer ─────────────
		// ────────────────────────────────────────────
		nullLayer.moveBefore(layer);
		layer.parent = nullLayer;

		// ────────────────────────────────────────────
		// ───────────── Add Slider Controls ──────────
		// ────────────────────────────────────────────
		Controls.addSlider(nullLayer, 'Resolution (in DPI)', 72);
		Controls.addSlider(nullLayer, 'Scale in %', 100);
		Controls.addSlider(nullLayer, 'Frequency', 1);
		Controls.addSlider(nullLayer, 'Amplitude X (in mm)', 5);
		Controls.addSlider(nullLayer, 'Amplitude Y (in mm)', 5);
		Controls.addSlider(nullLayer, 'Noise Frequency', 5);
		Controls.addSlider(nullLayer, 'Noise Amplitude', 5);
		Controls.addSlider(nullLayer, 'Phase', 0);

		// ────────────────────────────────────────────
		// ───────────── Position Expression ──────────
		// ────────────────────────────────────────────
		nullLayer.property('position').expression =
			"intDPI=effect('Resolution (in DPI)')('ADBE Slider Control-0001') ;\n" +
			"scale = effect('Scale in %')('ADBE Slider Control-0001') ;\n" +
			'if(intDPI==0){intDPI=Math.round(128*(scale/100) )}\n' +
			'mySpeed = intDPI/25.4;\n' +
			"freq=effect('Frequency')('ADBE Slider Control-0001');\n" +
			"ampX=effect('Amplitude X (in mm)')('ADBE Slider Control-0001');\n" +
			"ampY=effect('Amplitude Y (in mm)')('ADBE Slider Control-0001');\n" +
			"octaves =effect('Noise Frequency')('ADBE Slider Control-0001');\n" +
			"amp_mult=effect('Noise Amplitude')('ADBE Slider Control-0001')/20;\n" +
			"t=time+framesToTime(effect('Phase')('ADBE Slider Control-0001'),1/thisComp.frameDuration);\n" +
			'x = wiggle(freq, ampX, octaves, amp_mult, t)[0]; ;\n' +
			'y = wiggle(freq, ampY, octaves, amp_mult, t)[1]; ;\n' +
			'value + [x - value[0], y - value[1]];';
	}

	app.endUndoGroup();
} else {
	// ────────────────────────────────────────────────
	// ────────────── Alert No Layer Selected ─────────
	// ────────────────────────────────────────────────
	if (typeof Alerts !== 'undefined' && Alerts.alertNoLayerSelected) {
		Alerts.alertNoLayerSelected();
	} else {
		alert('レイヤーを選択してください。'); // Fallback Japanese alert
	}
}
