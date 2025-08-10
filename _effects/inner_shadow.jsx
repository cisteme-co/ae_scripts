// ────────────────────────────────────────────────
// Inner Shadow Effect Script for Selected Layers
// ────────────────────────────────────────────────

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

if (isValid(app.project.activeItem) === true) {
	app.beginUndoGroup('Inner Shadow');

	var curItem = app.project.activeItem;
	var selectedLayers = curItem.selectedLayers;

	if (selectedLayers.length === 0) {
		Alerts.alertNoLayerSelected();
		app.endUndoGroup();
	} else {
		for (var i = 0; i < selectedLayers.length; i++) {
			var layer = selectedLayers[i];

			try {
				// Add layer styles (inner shadow)
				app.executeCommand(9001);

				// Add controls
				Controls.addColorChange(layer, 'Color', [0, 0, 0]);
				var blendDropdown = Controls.addDropdown(layer, 'Blend Mode', 2);
				Controls.setDropdownItems(blendDropdown, blendModeNames);
				Controls.addSlider(layer, 'Opacity', 100);
				Controls.addAngle(layer, 'Angle', 120);
				Controls.addSlider(layer, 'Distance', 0);
				Controls.addSlider(layer, 'Choke', 0);
				Controls.addSlider(layer, 'Size', 5);

				// Reference innerShadow layer style properties by matchName
				var innerShadow = layer
					.property('ADBE Layer Styles')
					.property('innerShadow/enabled');

				innerShadow.property('innerShadow/mode2').expression =
					'var mode = effect("Dropdown Menu Control")("Menu");\n' +
					'mode == 1 ? 1 :\n' +
					'mode == 2 ? 5 :\n' +
					'mode == 3 ? 11 :\n' +
					'mode == 4 ? 16 :\n' +
					'mode == 5 ? 17 :\n' +
					'mode == 6 ? 18 :\n' +
					'1;';

				innerShadow.property('innerShadow/color').expression =
					'effect("Color")("ADBE Color Control-0001")';

				innerShadow.property('innerShadow/opacity').expression =
					'effect("Opacity")("ADBE Slider Control-0001")';

				innerShadow.property('innerShadow/localLightingAngle').expression =
					'effect("Angle")("ADBE Angle Control-0001") - 180';

				innerShadow.property('innerShadow/distance').expression =
					'effect("Distance")("ADBE Slider Control-0001")';

				innerShadow.property('innerShadow/chokeMatte').expression =
					'effect("Choke")("ADBE Slider Control-0001")';

				innerShadow.property('innerShadow/blur').expression =
					'effect("Size")("ADBE Slider Control-0001")';
			} catch (err) {
				alert(
					'Error applying Inner Shadow on layer "' +
						layer.name +
						'": ' +
						err.toString()
				);
				app.endUndoGroup();
				break;
			}
		}
		app.endUndoGroup();
	}
} else {
	Alerts.alertNoCompSelected();
}
