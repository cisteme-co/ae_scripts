// ────────────────────────────────────────────────
// Initialize and Load Alerts Utility
// ────────────────────────────────────────────────
var rootFolder = File($.fileName).parent;
$.evalFile(new File(rootFolder.fsName + '/utils/alerts.jsx'));

// ────────────────────────────────────────────────
// Check Active Item and Apply Color Replace Effect
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
		app.beginUndoGroup('Color Replace');
		var missingPlugin = false;

		// ────────────────────────────────────────────
		// Loop through selected layers and add effect with fallback
		// ────────────────────────────────────────────
		for (var i = 0; i < selectedLayers.length; i++) {
			var layer = selectedLayers[i];
			var effects = layer.property('Effects');

			try {
				effects.addProperty('PSOFT REPLACECOLOR');
			} catch (err1) {
				try {
					var fallback = effects.addProperty("F's ColorChange");
					fallback.property("F's ColorChange-0003").setValue(1);
				} catch (err2) {
					missingPlugin = true;
					break; // Stop processing if neither plugin exists
				}
			}
		}

		app.endUndoGroup();

		// ────────────────────────────────────────────
		// Show missing plugin alert if needed
		// ────────────────────────────────────────────
		if (missingPlugin) {
			Alerts.alertMissingPlugin(['PSOFT REPLACECOLOR', "F's ColorChange"]);
		}
	}
}
