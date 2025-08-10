// ────────────────────────────────────────────────
// ────────────── Load Utilities ──────────────────
// ────────────────────────────────────────────────
var rootFolder = File($.fileName).parent;
$.evalFile(new File(rootFolder.fsName + '/utils/alerts.jsx'));
$.evalFile(new File(rootFolder.fsName + '/utils/controls.jsx'));

// ────────────────────────────────────────────────
// ───────── Check Active Item Validity ───────────
// ────────────────────────────────────────────────
if (typeof isValid === 'function' && isValid(app.project.activeItem)) {
	// ────────────────────────────────────────────
	// ────────────── Begin Undo Group ───────────
	// ────────────────────────────────────────────
	app.beginUndoGroup('Posterize');

	var curItem = app.project.activeItem;
	var selectedLayers = curItem.selectedLayers;
	var fps = 1 / curItem.frameDuration;

	// ────────────────────────────────────────────
	// ─────────── Posterize Expression ──────────
	// ────────────────────────────────────────────
	var POSTERIZE_EXPRESSION =
		"koma = effect('Frame')('ADBE Slider Control-0001');\n" +
		'fps = 1 / thisComp.frameDuration;\n' +
		'T = time * fps + 1;\n' +
		'stkf = thisProperty.key(1).time * fps + 1;\n' +
		'ntsa = T - stkf;\n' +
		'stkfsa = ntsa % koma;\n' +
		'npro = thisProperty.valueAtTime((T - 1 - stkfsa) / fps);';

	// ────────────────────────────────────────────
	// ────────── Apply Expression to Layers ───────
	// ────────────────────────────────────────────
	for (var i = 0; i < selectedLayers.length; i++) {
		var layer = selectedLayers[i];

		// Add 'Frame' slider control
		Controls.addSlider(layer, 'Frame', 3);

		// Iterate top-level properties on the layer
		for (var o = 1; o <= layer.numProperties; o++) {
			var prop = layer.property(o);
			if (!prop) continue;

			// Iterate sub-properties
			for (var e = 1; e <= prop.numProperties; e++) {
				var subProp = prop.property(e);
				if (!subProp) continue;

				if (subProp.isTimeVarying) {
					subProp.expressionEnabled = true;
					subProp.expression = POSTERIZE_EXPRESSION;
				}

				// Deeper properties
				for (var t = 1; t <= subProp.numProperties; t++) {
					var deepProp = subProp.property(t);
					if (!deepProp) continue;

					if (deepProp.isTimeVarying) {
						deepProp.expressionEnabled = true;
						deepProp.expression = POSTERIZE_EXPRESSION;
					}
				}
			}
		}
	}

	// ────────────────────────────────────────────
	// ───────────── End Undo Group ──────────────
	// ────────────────────────────────────────────
	app.endUndoGroup();
} else {
	// ────────────────────────────────────────────
	// ───────────── Alert No Layer Selected ──────
	// ────────────────────────────────────────────
	if (typeof Alerts !== 'undefined' && Alerts.alertNoLayerSelected) {
		Alerts.alertNoLayerSelected();
	} else {
		alert('レイヤーを選択してください。'); // Please select a layer.
	}
}
