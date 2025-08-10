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
		// Process: Add Controls & Effects to Each Selected Layer
		// ────────────────────────────────────────────────
	} else {
		for (var i = 0; i < selectedLayers.length; i++) {
			var layers = selectedLayers[i];

			// Add control sliders and checkboxes using Controls module
			Controls.addSlider(layers, 'Value', 10);
			Controls.addCheckbox(layers, 'X Axis', false);
			Controls.addCheckbox(layers, 'Y Axis', true);
			Controls.addSlider(layers, 'Z Axis in %', 0);
			Controls.addCheckbox(layers, 'Allow Z Axis Time Reduction', false);
			Controls.addSlider(layers, 'Rotation', 0);
			Controls.addSlider(layers, 'Motion Blur', 0);

			// Add and configure Motion Tile effect
			var motionTile = layers.Effects.addProperty('ADBE Tile');
			motionTile.name = 'Edge Repeat';
			motionTile.property('ADBE Tile-0001').expression =
				'[thisLayer.width/2, thisLayer.height/2]';
			motionTile.property('ADBE Tile-0004').expression =
				'100 + effect("Value")("ADBE Slider Control-0001") + effect("Rotation")("ADBE Slider Control-0001")';
			motionTile.property('ADBE Tile-0005').expression =
				'100 + effect("Value")("ADBE Slider Control-0001") + effect("Rotation")("ADBE Slider Control-0001")';
			motionTile.property('ADBE Tile-0006').setValue(true);

			// Add and configure Geometry2 (Offset) effect with expressions
			var transform = layers.Effects.addProperty('ADBE Geometry2');
			transform.name = 'Offset';
			transform.property('ADBE Geometry2-0001').expression =
				'moto=[thisLayer.width/2,thisLayer.height/2]; moto;';
			transform.property('ADBE Geometry2-0002').expression =
				'PRM=effect("Value")("ADBE Slider Control-0001");\n' +
				'moto=[thisLayer.width/2,thisLayer.height/2];\n' +
				'X=effect("X Axis")("ADBE Checkbox Control-0001");\n' +
				'Y=effect("Y Axis")("ADBE Checkbox Control-0001");\n' +
				'P=[X ? 1 : 0, Y ? 1 : 0];\n' +
				'((P*PRM)*0.5)-random(P)*PRM+moto;';

			transform.property('ADBE Geometry2-0003').expression =
				'PRM=effect("Z Axis in %")("ADBE Slider Control-0001");\n' +
				'Z=100*(PRM/100);\n' +
				'BASE=100-(Z*0.5);\n' +
				'RAN=effect("Allow Z Axis Time Reduction")("ADBE Checkbox Control-0001") ? random(Z)+BASE : random(Z)+100;';

			transform.property('ADBE Geometry2-0007').expression =
				'sp = effect("Value")("ADBE Slider Control-0001");\n' +
				'rot = effect("Rotation")("ADBE Slider Control-0001");\n' +
				'wiggle(sp, .12*rot);';

			transform.property('ADBE Geometry2-0010').expression =
				'effect("Motion Blur")("ADBE Slider Control-0001");';
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
