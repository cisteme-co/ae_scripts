// ────────────────────────────────────────────────
// Drop Shadow Effect Script
// ────────────────────────────────────────────────

var rootFolder = File($.fileName).parent;

// ────────────────────────────────────────────────
// Import Utility Libraries
// ────────────────────────────────────────────────
$.evalFile(new File(rootFolder.fsName + '/utils/alerts.jsx'));
$.evalFile(new File(rootFolder.fsName + '/utils/controls.jsx'));

// ────────────────────────────────────────────────
// Constants and Setup
// ────────────────────────────────────────────────
var blendModeNames = [
	'Normal',
	'Multiply',
	'Screen',
	'Overlay',
	'Soft Light',
	'Hard Light',
];

// ────────────────────────────────────────────────
// Validate active composition and selected layers
// ────────────────────────────────────────────────
if (!isValid(app.project.activeItem)) {
	Alerts.alertNoCompSelected();
} else {
	var curItem = app.project.activeItem;
	var selectedLayers = curItem.selectedLayers;

	if (!selectedLayers || selectedLayers.length === 0) {
		Alerts.alertNoLayerSelected();
	} else {
		app.beginUndoGroup('Drop Shadow');

		// ────────────────────────────────────────────
		// Loop through selected layers and add effects + expressions
		// ────────────────────────────────────────────
		for (var i = 0; i < selectedLayers.length; i++) {
			var layer = selectedLayers[i];

			// Add layer styles (drop shadow)
			app.executeCommand(9000);

			// Add control effects using imported Controls utility
			Controls.addColorChange(layer, 'Color', [0, 0, 0]);
			var blendDropdown = Controls.addDropdown(layer, 'Blend Mode', 2);
			Controls.setDropdownItems(blendDropdown, blendModeNames);
			Controls.addSlider(layer, 'Opacity', 25);
			Controls.addAngle(layer, 'Angle', 0);
			Controls.addSlider(layer, 'Distance', 5);
			Controls.addSlider(layer, 'Choke', 0);
			Controls.addSlider(layer, 'Size', 0);

			// Setup expressions on the drop shadow properties
			var dropShadow = layer
				.property('ADBE Layer Styles')
				.property('dropShadow/enabled');

			if (dropShadow) {
				dropShadow.property('dropShadow/mode2').expression =
					'var mode = effect("Dropdown Menu Control")("Menu");\n' +
					'mode == 1 ? 1 :\n' +
					'mode == 2 ? 5 :\n' +
					'mode == 3 ? 11 :\n' +
					'mode == 4 ? 16 :\n' +
					'mode == 5 ? 17 :\n' +
					'mode == 6 ? 18 :\n' +
					'1;';

				dropShadow.property('dropShadow/color').expression =
					'effect("Color")("ADBE Color Control-0001")';

				dropShadow.property('dropShadow/opacity').expression =
					'effect("Opacity")("ADBE Slider Control-0001")';

				dropShadow.property('dropShadow/localLightingAngle').expression =
					'effect("Angle")("ADBE Angle Control-0001")';

				dropShadow.property('dropShadow/distance').expression =
					'effect("Distance")("ADBE Slider Control-0001")';

				dropShadow.property('dropShadow/chokeMatte').expression =
					'effect("Choke")("ADBE Slider Control-0001")';

				dropShadow.property('dropShadow/blur').expression =
					'effect("Size")("ADBE Slider Control-0001")';
			} else {
				alert(
					'Drop Shadow Layer Style property not found on layer: ' + layer.name
				);
			}
		}

		app.endUndoGroup();
	}
}
