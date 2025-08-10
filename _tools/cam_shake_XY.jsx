// ────────────────────────────────────────────────
// Setup: Load Utility Scripts
// ────────────────────────────────────────────────
var rootFolder = File($.fileName).parent;
$.evalFile(new File(rootFolder.fsName + '/utils/alerts.jsx'));
$.evalFile(new File(rootFolder.fsName + '/utils/controls.jsx'));

// ────────────────────────────────────────────────
// Main: Check for Valid Composition & Selected Layers
// ────────────────────────────────────────────────
if (isValid(app.project.activeItem) === true) {
	app.beginUndoGroup('Cam Shake');

	var curItem = app.project.activeItem;
	var selectedLayers = curItem.selectedLayers;

	// ────────────────────────────────────────────────
	// Handle: No Layers Selected
	// ────────────────────────────────────────────────
	if (selectedLayers.length === 0) {
		if (typeof Alerts !== 'undefined' && Alerts.alertNoLayerSelected) {
			Alerts.alertNoLayerSelected();
		} else {
			alert('レイヤーを選択してください。');
		}
		app.endUndoGroup();

		// ────────────────────────────────────────────────
		// Process: Add Null Parent and Controls for Each Selected Layer
		// ────────────────────────────────────────────────
	} else {
		for (var i = 0; i < selectedLayers.length; i++) {
			var layers = selectedLayers[i];

			// Create null parent layer
			var nullLayer = curItem.layers.addNull(curItem.duration);
			nullLayer.moveBefore(layers);
			layers.parent = nullLayer;

			// Localized names for the null layer source
			var nameByLang = {
				en: 'Camera Shake - X/Y',
				ja: '画面動 - X/Y',
				fr: 'Secousse Caméra - X/Y',
				de: 'Kamera-Wackeln - X/Y',
			};
			var langCode = app.language.toString().substr(0, 2);
			nullLayer.source.name = nameByLang[langCode] || nameByLang['en'];

			// Add control sliders and checkboxes
			Controls.addSlider(nullLayer, 'Resolution (dpi)', 144);
			Controls.addSlider(nullLayer, 'X Axis (mm)', 5);
			Controls.addSlider(nullLayer, 'Y Axis (mm)', 10);
			Controls.addSlider(nullLayer, 'Random %', 50);
			Controls.addCheckbox(nullLayer, 'Invert Shaking', false);

			// Assign shaking expression to position property
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
	}

	// ────────────────────────────────────────────────
	// Handle: No Valid Composition Selected
	// ────────────────────────────────────────────────
} else {
	if (typeof Alerts !== 'undefined' && Alerts.alertNoCompSelected) {
		Alerts.alertNoCompSelected();
	} else {
		alert('コンポジションを選択してください。');
	}
}
