// ────────────────────────────────────────────────
// Alpha Reverse Effect on Selected Layers with Alerts
// ────────────────────────────────────────────────

$.evalFile(new File(File($.fileName).parent.fsName + '/utils/alerts.jsx'));

function alphaReverse() {
	if (isValid(app.project.activeItem) === true) {
		app.beginUndoGroup('Alpha Reverse');

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
				try {
					var invertEffect = layer.Effects.addProperty('ADBE Invert');
					if (invertEffect && invertEffect.property('ADBE Invert-0001')) {
						invertEffect.property('ADBE Invert-0001').setValue(16);
					}
				} catch (err) {
					if (typeof Alerts !== 'undefined' && Alerts.alertMissingPlugin) {
						Alerts.alertMissingPlugin(['ADBE Invert']);
					} else {
						alert("Failed to add 'Invert' effect: " + err.toString());
					}
					app.endUndoGroup();
					return;
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
}

alphaReverse();
