// ────────────────────────────────────────────────
// Optical Flare Script with Fallback and Error Handling
// ────────────────────────────────────────────────

$.evalFile(new File(File($.fileName).parent.fsName + '/utils/alerts.jsx'));

if (isValid(app.project.activeItem) === true) {
	app.beginUndoGroup('Optical Flare');

	var comp = app.project.activeItem;

	// Create adjustment layer with full comp-sized rectangle shape
	var layer = comp.layers.addShape();
	layer.name = 'Optical Flare';
	layer.adjustmentLayer = true;

	var contents = layer.property('Contents');
	var rectGroup = contents.addProperty('ADBE Vector Group');
	var rectShape = rectGroup
		.property('Contents')
		.addProperty('ADBE Vector Shape - Rect');
	rectShape.property('ADBE Vector Rect Size').expression =
		'[thisComp.width, thisComp.height];';

	rectGroup
		.property('Contents')
		.addProperty('ADBE Vector Graphic - Fill')
		.property('ADBE Vector Fill Color')
		.setValue([1, 1, 1]);

	try {
		// Try to add Video Copilot Optical Flares effect
		var opticalFlares = layer
			.property('Effects')
			.addProperty('VIDEOCOPILOT OpticalFlares');
		if (
			opticalFlares &&
			opticalFlares.property('VIDEOCOPILOT OpticalFlares-0025')
		) {
			opticalFlares.property('VIDEOCOPILOT OpticalFlares-0025').setValue(3);
		}
	} catch (err) {
		// Fallback to built-in Lens Flare effect
		try {
			layer.property('Effects').addProperty('ADBE Lens Flare');
		} catch (err2) {
			if (typeof Alerts !== 'undefined' && Alerts.alertMissingPlugin) {
				Alerts.alertMissingPlugin([
					'VIDEOCOPILOT OpticalFlares',
					'ADBE Lens Flare',
				]);
			} else {
				alert(
					"Neither 'VIDEOCOPILOT OpticalFlares' nor 'ADBE Lens Flare' effects are available."
				);
			}
		}
	}

	app.endUndoGroup();
} else {
	if (typeof Alerts !== 'undefined' && Alerts.alertNoCompSelected) {
		Alerts.alertNoCompSelected();
	} else {
		alert('Please select or open a composition.');
	}
}
