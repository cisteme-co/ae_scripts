// ────────────────────────────────────────────────
// Initialize and Load Alerts Utility
// ────────────────────────────────────────────────
var rootFolder = File($.fileName).parent;
$.evalFile(new File(rootFolder.fsName + '/utils/alerts.jsx'));

// ────────────────────────────────────────────────
// Check Active Item and Apply Color Fill Effect
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
		app.beginUndoGroup('Color Fill');

		// ────────────────────────────────────────────
		// Loop through selected layers and add effect with fallbacks
		// ────────────────────────────────────────────
		for (var i = 0; i < selectedLayers.length; i++) {
			var layer = selectedLayers[i];
			var effectAdded = false;

			try {
				// Try PSOFT FILL effect
				layer.property('Effects').addProperty('PSOFT FILL');
				effectAdded = true;
			} catch (err1) {
				try {
					// Fallback: F's FillColor effect with property enabled
					var fColor = layer.property('Effects').addProperty("F's FillColor");
					fColor.property("F's FillColor-0001").setValue(true);
					effectAdded = true;
				} catch (err2) {
					// Final fallback: Adobe Paint Bucket with preset properties
					var paint = layer
						.property('Effects')
						.addProperty('ADBE Paint Bucket');
					paint.property('ADBE Paint Bucket-0002').setValue([0, 0]);
					paint.property('ADBE Paint Bucket-0004').setValue(6);
					paint.property('ADBE Paint Bucket-0009').setValue(true);
					paint.property('ADBE Paint Bucket-0010').setValue(25);
					effectAdded = true;
				}
			}
		}

		app.endUndoGroup();
	}
}
