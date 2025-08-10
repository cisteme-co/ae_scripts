// ────────────────────────────────────────────────
// Reflection Effect with Duplicate Layer and Fallback + Missing Plugin Alert
// ────────────────────────────────────────────────

$.evalFile(new File(File($.fileName).parent.fsName + '/utils/alerts.jsx'));

if (isValid(app.project.activeItem) === true) {
	app.beginUndoGroup('Reflection');

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
			var originalLayer = selectedLayers[i];
			var duplicateLayer = originalLayer.duplicate();
			duplicateLayer.name = originalLayer.name + '_reflect';
			duplicateLayer.moveAfter(originalLayer);

			try {
				var reflectEffect = duplicateLayer.Effects.addProperty(
					'VIDEOCOPILOT VCReflect'
				);
				if (
					reflectEffect &&
					reflectEffect.property('VIDEOCOPILOT VCReflect-0012')
				) {
					reflectEffect.property('VIDEOCOPILOT VCReflect-0012').setValue(3);
				}
			} catch (err) {
				// If Videocopilot plugin missing, try fallback effect
				try {
					var reflectEffectFallback =
						duplicateLayer.Effects.addProperty('ADBE Geometry2');
					if (reflectEffectFallback.property('ADBE Geometry2-0007')) {
						reflectEffectFallback.property('ADBE Geometry2-0007').setValue(180);
					}
					if (reflectEffectFallback.property('ADBE Geometry2-0008')) {
						reflectEffectFallback.property('ADBE Geometry2-0008').setValue(25);
					}
				} catch (fallbackErr) {
					if (typeof Alerts !== 'undefined' && Alerts.alertMissingPlugin) {
						Alerts.alertMissingPlugin([
							'VIDEOCOPILOT VCReflect',
							'ADBE Geometry2',
						]);
					} else {
						alert(
							'Failed to add reflection effects: ' + fallbackErr.toString()
						);
					}
					app.endUndoGroup();
					return;
				}
			}

			duplicateLayer.selected = true;
			originalLayer.selected = false;
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
