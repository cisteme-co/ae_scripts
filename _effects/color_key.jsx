// ────────────────────────────────────────────────
// Initialize and Load Alerts Utility
// ────────────────────────────────────────────────
var rootFolder = File($.fileName).parent;
$.evalFile(new File(rootFolder.fsName + '/utils/alerts.jsx'));

// ────────────────────────────────────────────────
// Check Active Item and Apply Color Key Effect
// ────────────────────────────────────────────────
if (!isValid(app.project.activeItem)) {
	// No composition open or selected
	Alerts.alertNoCompSelected();
} else {
	var curItem = app.project.activeItem;
	var selectedLayers = curItem.selectedLayers;

	if (!selectedLayers || selectedLayers.length === 0) {
		// No layers selected in the active comp
		Alerts.alertNoLayerSelected();
	} else {
		app.beginUndoGroup('Color Key');

		// ────────────────────────────────────────────
		// Loop through selected layers and add effect + set white color value
		// ────────────────────────────────────────────
		for (var i = 0; i < selectedLayers.length; i++) {
			var layer = selectedLayers[i];
			var effects = layer.property('Effects');

			var colorKeyEffect = effects.addProperty('ADBE Color Key');
			colorKeyEffect.property('ADBE Color Key-0001').setValue([1, 1, 1]);
		}

		app.endUndoGroup();
	}
}
