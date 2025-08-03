function addSlider(layers, name, value) {
	var layer = layers.Effects.addProperty('ADBE Slider Control');
	layer.property(1).setValue(value);
	layer.name = name;
}

if (isValid(app.project.activeItem) == true) {
	app.beginUndoGroup('Posterize');

	var curItem = app.project.activeItem;
	var selectedLayers = curItem.selectedLayers;
	var fps = 1 / curItem.frameDuration;

	var POSTERIZE_EXPRESSION =
		"koma = effect('Frame')('ADBE Slider Control-0001');\n" +
		'fps = 1 / thisComp.frameDuration;\n' +
		'T = time * fps + 1;\n' +
		'stkf = thisProperty.key(1).time * fps + 1;\n' +
		'ntsa = T - stkf;\n' +
		'stkfsa = ntsa % koma;\n' +
		'npro = thisProperty.valueAtTime((T - 1 - stkfsa) / fps);';

	for (var i = 0; i < selectedLayers.length; i++) {
		var layer = selectedLayers[i];

		addSlider(layer, 'Frame', 3);

		for (var o = 1; o <= layer.numProperties; o++) {
			var prop = layer.property(o).matchName;

			for (var e = 1; e <= layer.property(prop).numProperties; e++) {
				var propTime = layer.property(prop).property(e).matchName;

				if (layer.property(prop).property(propTime).isTimeVarying) {
					layer.property(prop).property(propTime).expressionEnabled = true;
					layer.property(prop).property(propTime).expression =
						POSTERIZE_EXPRESSION;
				}

				for (
					var t = 1;
					t <= layer.property(prop).property(propTime).numProperties;
					t++
				) {
					var propEffect = layer.property(prop).property(propTime)(t).matchName;

					if (
						layer.property(prop).property(propTime)(propEffect).isTimeVarying
					) {
						layer.property(prop).property(propTime)(
							propEffect
						).expressionEnabled = true;
						layer.property(prop).property(propTime)(propEffect).expression =
							POSTERIZE_EXPRESSION;
					}
				}
			}
		}
	}

	app.endUndoGroup();
} else {
	alert('レイヤーを選択してください。');
}
