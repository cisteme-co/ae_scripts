// ────────────────────────────────────────────────
// Motion Blur Script with Fallback Alerts
// ────────────────────────────────────────────────

// Import Alerts utility if needed (adjust path if necessary)
$.evalFile(new File(File($.fileName).parent.fsName + '/utils/alerts.jsx'));

if (isValid(app.project.activeItem) === true) {
	app.beginUndoGroup('Motion Blur');

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
			var motionBlurLayer = selectedLayers[i];
			try {
				var effect = motionBlurLayer
					.property('Effects')
					.addProperty('OLM DirectionalBlur');
				if (!effect) {
					if (typeof Alerts !== 'undefined' && Alerts.alertMissingPlugin) {
						Alerts.alertMissingPlugin(['OLM DirectionalBlur']);
					} else {
						alert('OLM DirectionalBlur effect is not available.');
					}
					app.endUndoGroup();
					break;
				}
				// Set properties safely
				if (effect.property('Angle')) {
					effect.property('Angle').setValue(90);
				}
				if (effect.property('OLM Directional Blur-0005')) {
					effect.property('OLM Directional Blur-0005').setValue(25);
				}
				if (effect.property('OLM Directional Blur-0010')) {
					effect.property('OLM Directional Blur-0010').setValue(25);
				}
			} catch (e) {
				alert(
					"Error applying effect on layer '" +
						motionBlurLayer.name +
						"': " +
						e.toString()
				);
				app.endUndoGroup();
				break;
			}
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
