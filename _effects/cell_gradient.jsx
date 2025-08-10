// ────────────────────────────────────────────────
// Initialize and Load Alerts Utility
// ────────────────────────────────────────────────
var rootFolder = File($.fileName).parent;
$.evalFile(new File(rootFolder.fsName + '/utils/alerts.jsx'));

// ────────────────────────────────────────────────
// Check Active Item and Apply Gradient Effect
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
		app.beginUndoGroup('Gradient');

		// ────────────────────────────────────────────
		// Loop through selected layers and add effect or duplicate layer with fallback
		// ────────────────────────────────────────────
		for (var i = 0; i < selectedLayers.length; i++) {
			var layer = selectedLayers[i];

			try {
				// Try adding PSOFT GRADIENT effect
				layer.property('Effects').addProperty('PSOFT GRADIENT');
			} catch (err1) {
				try {
					// Fallback: duplicate layer, add F's CellGrad effect, rename and select it
					var duplicateLayer = layer.duplicate();
					duplicateLayer.property('Effects').addProperty("F's CellGrad");
					duplicateLayer.name = duplicateLayer.name + '_Gradient';
					duplicateLayer.selected = true;
					layer.selected = false;
				} catch (err2) {
					// Neither plugin found, show alert and stop
					Alerts.alertMissingPlugin(['PSOFT GRADIENT', "F's CellGrad"]);
					break;
				}
			}
		}

		app.endUndoGroup();
	}
}
