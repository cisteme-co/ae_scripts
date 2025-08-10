// ────────────────────────────────────────────────
// Initialize and Load Alerts Utility
// ────────────────────────────────────────────────
var rootFolder = File($.fileName).parent;
$.evalFile(new File(rootFolder.fsName + '/utils/alerts.jsx'));

// ────────────────────────────────────────────────
// Check Active Item and Apply Cell Blur Effect
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
		app.beginUndoGroup('Cell Blur');

		// ────────────────────────────────────────────
		// Loop through selected layers and add effect
		// ────────────────────────────────────────────
		for (var i = 0; i < selectedLayers.length; i++) {
			var layer = selectedLayers[i];
			var effectAdded = false;

			try {
				// Try PSOFT BLURCEL effect with specific property enabled
				var blurEffect = layer.property('Effects').addProperty('PSOFT BLURCEL');
				blurEffect.property('PSOFT BLURCEL-0060').setValue(true);
				effectAdded = true;
			} catch (err1) {
				try {
					// Fallback to F's SelectedBlur effect
					layer.property('Effects').addProperty("F's SelectedBlur");
					effectAdded = true;
				} catch (err2) {
					// If neither effect found, show alert and exit
					Alerts.alertMissingPlugin(['PSOFT BLURCEL', "F's SelectedBlur"]);
					break;
				}
			}
		}

		app.endUndoGroup();
	}
}
