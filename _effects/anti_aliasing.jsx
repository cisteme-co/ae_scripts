// ────────────────────────────────────────────────
// Initialize and Load Alerts Utility
// ────────────────────────────────────────────────
var rootFolder = File($.fileName).parent;
$.evalFile(new File(rootFolder.fsName + '/utils/alerts.jsx'));

// ────────────────────────────────────────────────
// Check Active Item (Composition) and Apply Anti-Aliasing Effect
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
		app.beginUndoGroup('Anti-Aliasing');

		// ────────────────────────────────────────────
		// Loop through selected layers and add effect
		// ────────────────────────────────────────────
		for (var i = 0; i < selectedLayers.length; i++) {
			var layer = selectedLayers[i];
			var effectAdded = false;

			try {
				// Try PSOFT ANTI-ALIASING
				layer.property('Effects').addProperty('PSOFT ANTI-ALIASING');
				effectAdded = true;
			} catch (err1) {
				try {
					// Fallback to OLM Smoother
					layer.property('Effects').addProperty('OLM Smoother');
					effectAdded = true;
				} catch (err2) {
					// If neither effect found, show alert and exit
					Alerts.alertMissingPlugin(['PSOFT ANTI-ALIASING', 'OLM Smoother']);
					break;
				}
			}
		}

		app.endUndoGroup();
	}
}
