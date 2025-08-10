// ────────────────────────────────────────────────
// Initialize and Load Alerts Utility
// ────────────────────────────────────────────────
var rootFolder = File($.fileName).parent;
$.evalFile(new File(rootFolder.fsName + '/utils/alerts.jsx'));

// ────────────────────────────────────────────────
// Check Active Item and Apply Color Selection Effect
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
		app.beginUndoGroup('Color Selection');
		var missingPlugin = false;

		// ────────────────────────────────────────────
		// Loop through selected layers and add effect with fallbacks
		// ────────────────────────────────────────────
		for (var i = 0; i < selectedLayers.length; i++) {
			var layer = selectedLayers[i];
			var effects = layer.property('Effects');

			try {
				var effect = effects.addProperty('PSOFT COLORSELECTION');
				effect.property('PSOFT COLORSELECTION-0001').setValue(4);
			} catch (err1) {
				try {
					var fallback = effects.addProperty("F's SelectColor");
					fallback.property("F's SelectColor-0001").setValue(1);
				} catch (err2) {
					// Built-in AE fallback, no plugin alert needed
					effects.addProperty('ADBE Color Key');
					effects
						.addProperty('ADBE Invert')
						.property('ADBE Invert-0001')
						.setValue(16);
				}
			}
		}

		app.endUndoGroup();

		// ────────────────────────────────────────────
		// Show missing plugin alert if neither PSOFT nor F's SelectColor found
		// (In this script missingPlugin flag is not set;
		//  consider adding logic if you want to alert here)
		// ────────────────────────────────────────────
		if (missingPlugin) {
			Alerts.alertMissingPlugin(['PSOFT COLORSELECTION', "F's SelectColor"]);
		}
	}
}
