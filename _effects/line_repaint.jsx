// ────────────────────────────────────────────────
// Line Repaint Script with Fallback Alerts
// ────────────────────────────────────────────────

// Import Alerts utility if needed (adjust path if necessary)
$.evalFile(new File(File($.fileName).parent.fsName + '/utils/alerts.jsx'));

if (isValid(app.project.activeItem) === true) {
	app.beginUndoGroup('Line Repaint');

	var comp = app.project.activeItem;
	var selectedLayers = comp.selectedLayers;

	if (selectedLayers.length === 0) {
		if (typeof Alerts !== 'undefined' && Alerts.alertNoLayerSelected) {
			Alerts.alertNoLayerSelected();
		} else {
			alert('Please select at least one layer.');
		}
		app.endUndoGroup();
	} else {
		for (var i = 0; i < selectedLayers.length; i++) {
			var lineRepaint = selectedLayers[i];
			var duplicateLayer = lineRepaint.duplicate();
			duplicateLayer.name = lineRepaint.name + '_line';

			// Try adding MainLineRepaint_old effect
			var mainLineEffect = duplicateLayer.Effects.addProperty(
				"F's MainLineRepaint_old"
			);
			if (!mainLineEffect) {
				if (typeof Alerts !== 'undefined' && Alerts.alertMissingPlugin) {
					Alerts.alertMissingPlugin(["F's MainLineRepaint_old"]);
				} else {
					alert("F's MainLineRepaint_old effect is not available.");
				}
				app.endUndoGroup();
				break;
			}

			// Add Color Key effect and set key color to white
			var colorKey = duplicateLayer
				.property('Effects')
				.addProperty('ADBE Color Key');
			if (colorKey) {
				try {
					colorKey.property('ADBE Color Key-0001').setValue([1, 1, 1]);
				} catch (e) {
					alert('Failed to set Color Key property: ' + e.toString());
					app.endUndoGroup();
					break;
				}
			} else {
				alert('Failed to add Color Key effect.');
				app.endUndoGroup();
				break;
			}

			// Select duplicate, deselect original
			duplicateLayer.selected = true;
			lineRepaint.selected = false;
		}

		app.endUndoGroup();
	}
} else {
	if (typeof Alerts !== 'undefined' && Alerts.alertNoCompSelected) {
		Alerts.alertNoCompSelected();
	} else {
		alert('Please select or open a composition.');
	}
}
