function addSlider(layers, name, value) {
	var layer = layers.Effects.addProperty('ADBE Slider Control');
	layer.property('ADBE Slider Control-0001').setValue(value); // matchName for slider value
	layer.name = name;
}

function addCheckbox(layers, name, value) {
	var layer = layers.Effects.addProperty('ADBE Checkbox Control');
	layer.property('ADBE Checkbox Control-0001').setValue(value); // matchName for checkbox value
	layer.name = name;
}

if (isValid(app.project.activeItem) === true) {
	app.beginUndoGroup('Cam Shake');

	var curItem = app.project.activeItem;
	var selectedLayers = curItem.selectedLayers;

	for (var i = 0; i < selectedLayers.length; i++) {
		var layers = selectedLayers[i];

		addSlider(layers, 'Value', 10);
		addCheckbox(layers, 'X Axis', false);
		addCheckbox(layers, 'Y Axis', true);
		addSlider(layers, 'Z Axis in %', 0);
		addCheckbox(layers, 'Allow Z Axis Time Reduction', false);
		addSlider(layers, 'Rotation', 0);
		addSlider(layers, 'Motion Blur', 0);

		var motionTile = layers.Effects.addProperty('ADBE Tile');
		motionTile.name = 'Edge Repeat';
		motionTile.property('ADBE Tile-0001').expression =
			'[thisLayer.width/2, thisLayer.height/2]';
		motionTile.property('ADBE Tile-0004').expression =
			'100 + effect("Value")("ADBE Slider Control-0001") + effect("Rotation")("ADBE Slider Control-0001")';
		motionTile.property('ADBE Tile-0005').expression =
			'100 + effect("Value")("ADBE Slider Control-0001") + effect("Rotation")("ADBE Slider Control-0001")';
		motionTile.property('ADBE Tile-0006').setValue(true);

		var transform = layers.Effects.addProperty('ADBE Geometry2');
		transform.name = 'Offset';
		transform.property('ADBE Geometry2-0001').expression =
			'moto=[thisLayer.width/2,thisLayer.height/2]';
		transform.property('ADBE Geometry2-0002').expression =
			'PRM=effect("Value")("ADBE Slider Control-0001");\n' +
			'moto=[thisLayer.width/2,thisLayer.height/2];\n' +
			'X=effect("X Axis")("ADBE Checkbox Control-0001");\n' +
			'Y=effect("Y Axis")("ADBE Checkbox Control-0001");\n' +
			'P=[X ? 1 : 0, Y ? 1 : 0];\n' +
			'((P*PRM)*0.5)-random(P)*PRM+moto;';

		transform.property('ADBE Geometry2-0003').expression =
			'PRM=effect("Z Axis in %")("ADBE Slider Control-0001");\n' +
			'Z=100*(PRM/100);\n' +
			'BASE=100-(Z*0.5);\n' +
			'RAN=effect("Allow Z Axis Time Reduction")("ADBE Checkbox Control-0001") ? random(Z)+BASE : random(Z)+100;';

		transform.property('ADBE Geometry2-0007').expression =
			'sp = effect("Value")("ADBE Slider Control-0001");\n' +
			'rot = effect("Rotation")("ADBE Slider Control-0001");\n' +
			'wiggle(sp, .12*rot)';

		transform.property('ADBE Geometry2-0010').expression =
			'effect("Motion Blur")("ADBE Slider Control-0001")';
	}

	app.endUndoGroup();
} else {
	alert('レイヤーを選択してください。');
}
