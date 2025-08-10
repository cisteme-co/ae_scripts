// ────────────────────────────────────────────────
// Radial Blur Effect on Selected Layers with Fallbacks
// ────────────────────────────────────────────────

$.evalFile(new File(File($.fileName).parent.fsName + '/utils/alerts.jsx'));

if (isValid(app.project.activeItem) === true) {
	app.beginUndoGroup('Radial Blur');

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
			var layer = selectedLayers[i];
			var radialEffect = null;

			try {
				radialEffect = layer.Effects.addProperty('OLM RadialBlur');
			} catch (err) {
				if (typeof Alerts !== 'undefined' && Alerts.alertMissingPlugin) {
					Alerts.alertMissingPlugin(['OLM RadialBlur']);
				} else {
					alert('OLM RadialBlur effect is not available.');
				}
				break;
			}

			if (radialEffect) {
				try {
					if (radialEffect.property('OLM RadialBlur-0004')) {
						radialEffect.property('OLM RadialBlur-0004').setValue(25);
					}
					if (radialEffect.property('OLM RadialBlur-0008')) {
						radialEffect.property('OLM RadialBlur-0008').setValue(25);
					}
				} catch (e) {
					alert('Failed to set Radial Blur properties: ' + e.toString());
					break;
				}
			}
		}

		app.endUndoGroup();
	}
} else {
	if (typeof Alerts !== 'undefined' && Alerts.alertNoCompSelected) {
		Alerts.alertNoCompSelected();
	} else {
		alert('Please open or select a composition.');
	}
}
