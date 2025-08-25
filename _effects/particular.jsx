// ────────────────────────────────────────────────
// Particular Effect Script with Fallback and Alerts
// ────────────────────────────────────────────────

$.evalFile(new File(File($.fileName).parent.fsName + '/utils/alerts.jsx'));

if (isValid(app.project.activeItem) === true) {
	app.beginUndoGroup('Particular');

	var comp = app.project.activeItem;

	// Create adjustment layer with full comp-sized rectangle shape
	var layer = comp.layers.addShape();
	layer.name = 'Particular';

	var contents = layer.property('Contents');
	var rectGroup = contents.addProperty('ADBE Vector Group');
	var rectShape = rectGroup
		.property('Contents')
		.addProperty('ADBE Vector Shape - Rect');
	noiseRectShape.property('ADBE Vector Rect Size').expression =
		'[thisComp.width, thisComp.height];';

	rectGroup
		.property('Contents')
		.addProperty('ADBE Vector Graphic - Fill')
		.property('ADBE Vector Fill Color')
		.setValue([1, 1, 1]);

	try {
		// Try to add Trapcode Particular effect
		layer.property('Effects').addProperty('tc Particular');
	} catch (err) {
		// Fallback to CC Particle World
		try {
			layer.property('Effects').addProperty('CC Particle World');
		} catch (err2) {
			if (typeof Alerts !== 'undefined' && Alerts.alertMissingPlugin) {
				Alerts.alertMissingPlugin(['Trapcode Particular', 'CC Particle World']);
			} else {
				alert(
					"Neither 'Trapcode Particular' nor 'CC Particle World' effects are available."
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
