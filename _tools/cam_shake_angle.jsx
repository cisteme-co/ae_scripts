// ────────────────────────────────────────────────
// Camera Shake Setup Script
// Adds a null parent layer with shaking controls and expression
// ────────────────────────────────────────────────

var rootFolder = File($.fileName).parent;
$.evalFile(new File(rootFolder.fsName + '/utils/alerts.jsx'));
$.evalFile(new File(rootFolder.fsName + '/utils/controls.jsx'));

// Alert fallback for no layer selected, localized
function alertNoLayerSelected() {
	if (typeof Alerts !== 'undefined' && Alerts.alertNoLayerSelected) {
		Alerts.alertNoLayerSelected();
	} else {
		var langCode = app.language.toString().substr(0, 2);
		var messages = {
			en: 'Please select at least one layer.',
			ja: 'レイヤーを選択してください。',
			fr: 'Veuillez sélectionner au moins un calque.',
			de: 'Bitte wählen Sie mindestens eine Ebene aus.',
		};
		alert(messages[langCode] || messages.en);
	}
}

// Check if active item is valid composition and has layers selected
if (isValid(app.project.activeItem) === true) {
	app.beginUndoGroup('Cam Shake');

	var comp = app.project.activeItem;
	var selectedLayers = comp.selectedLayers;

	if (selectedLayers.length === 0) {
		alertNoLayerSelected();
		app.endUndoGroup();
	} else {
		for (var i = 0; i < selectedLayers.length; i++) {
			var layer = selectedLayers[i];

			// Create null layer parent for camera shake
			var nullLayer = comp.layers.addNull(comp.duration);
			nullLayer.moveBefore(layer);
			layer.parent = nullLayer;

			// Localized names for the nullLayer source
			var nameByLang = {
				en: 'Camera Shake - Angle',
				ja: '画面動 - 角度',
				fr: 'Secousse Caméra - Angle',
				de: 'Kamera-Wackeln - Winkel',
			};
			var langCode = app.language.toString().substr(0, 2);
			nullLayer.source.name = nameByLang[langCode] || nameByLang.en;

			// Add control effects to null layer
			Controls.addSlider(nullLayer, 'Resolution (dpi)', 144);
			Controls.addSlider(nullLayer, 'Shaking (mm)', 0);
			Controls.addAngle(nullLayer, 'Angle', 0);
			Controls.addSlider(nullLayer, 'Random %', 50);
			Controls.addCheckbox(nullLayer, 'Invert Shaking', false);

			// Set expression for shaking position on the null layer
			nullLayer.property('Position').expression =
				'// Camera Shake Expression\n' +
				'a = effect("Shaking (mm)")("ADBE Slider Control-0001");\n' +
				'r = effect("Angle")("ADBE Angle Control-0001") - 90;\n' +
				'intDPI = effect("Resolution (dpi)")("ADBE Slider Control-0001");\n' +
				'mySpeed = intDPI / 25.4;\n' +
				'RandomSlider = clamp(effect("Random %")("ADBE Slider Control-0001"), 0, 100);\n' +
				'myRandom = (100 - RandomSlider) / 100;\n' +
				'myInverse = (effect("Invert Shaking")("ADBE Checkbox Control-0001") * 2 - 1) / 2 + myRandom / 400;\n' +
				'T = timeToFrames(time, 1 / thisComp.frameDuration);\n' +
				'X = position[0];\n' +
				'Y = position[1];\n' +
				'x = X + Math.cos(r * Math.PI / 180) * Math.pow(-1, T) * a * random(myRandom, 1) * mySpeed * myInverse;\n' +
				'y = Y + Math.sin(r * Math.PI / 180) * Math.pow(-1, T) * a * random(myRandom, 1) * mySpeed * myInverse;\n' +
				'[x, y];';
		}

		app.endUndoGroup();
	}
} else {
	Alerts.alertNoCompSelected();
}
