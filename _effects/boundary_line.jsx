// ────────────────────────────────────────────────
// Initialize and Load Alerts Utility
// ────────────────────────────────────────────────
var rootFolder = File($.fileName).parent;
$.evalFile(new File(rootFolder.fsName + '/utils/alerts.jsx'));

// ────────────────────────────────────────────────
// Check Active Item and Apply Boundary Line Effect
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
		app.beginUndoGroup('Boundary Line');

		// ────────────────────────────────────────────
		// Loop through selected layers and add effect
		// ────────────────────────────────────────────
		for (var i = 0; i < selectedLayers.length; i++) {
			var layer = selectedLayers[i];
			var effectAdded = false;

			try {
				// Try PSOFT BOUNDARYLINE effect
				layer.property('Effects').addProperty('PSOFT BOUNDARYLINE');
				effectAdded = true;
			} catch (err1) {
				try {
					// Fallback to F's EdgeLine-Hi effect
					layer.property('Effects').addProperty("F's EdgeLine-Hi");
					effectAdded = true;
				} catch (err2) {
					// If neither effect found, show alert and exit
					Alerts.alertMissingPlugin(['PSOFT BOUNDARYLINE', "F's EdgeLine-Hi"]);
					break;
				}
			}
		}

		app.endUndoGroup();
	}
}
