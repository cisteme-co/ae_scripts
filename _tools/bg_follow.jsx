function addSlider(layers, name, value) {
	var layer = layers.Effects.addProperty('ADBE Slider Control');
	layer.property('ADBE Slider Control-0001').setValue(value);
	layer.name = name;
}

function addCheckbox(layers, name, value) {
	var layer = layers.Effects.addProperty('ADBE Checkbox Control');
	layer.property('ADBE Checkbox Control-0001').setValue(value);
	layer.name = name;
}

function addAngle(layers, name, value) {
	var layer = layers.Effects.addProperty('ADBE Angle Control');
	layer.property('ADBE Angle Control-0001').setValue(value);
	layer.name = name;
}

if (isValid(app.project.activeItem) == true) {
	app.beginUndoGroup('BG Follow');

	var curItem = app.project.activeItem;
	var selectedLayers = curItem.selectedLayers;

	for (var i = 0; i < selectedLayers.length; i++) {
		var layers = selectedLayers[i];

		addSlider(layers, 'Speed (mm/k)', 10);
		addAngle(layers, 'Angle', 90);
		addSlider(layers, 'Frame Frequency', 1);
		addSlider(layers, 'Resolution (in DPI)', 144);
		addCheckbox(layers, 'Opposite', false);

		var motionTile = layers.Effects.addProperty('ADBE Tile');
		motionTile.property('ADBE Tile-0001').expression =
			'[thisLayer.width/2, thisLayer.height/2]';
		motionTile.property('ADBE Tile-0006').setValue(true);

		var loop = layers.Effects.addProperty('ADBE Offset');
		loop.name = 'Loop';
		loop.property('ADBE Offset-0001').expressionEnabled = true;
		loop.property('ADBE Offset-0001').expression =
			'var offsetX = thisLayer.width/2;\n' +
			'var offsetY = thisLayer.height/2;\n' +
			'var fps= 1/thisComp.frameDuration;\n' +
			"posterizeTime(fps/effect('Frame Frequency')('ADBE Slider Control-0001'));\n" +
			'var followX =0;\n' +
			'var followY =0;\n' +
			'for(var f=0;f<Math.round(time/thisComp.frameDuration);f++){\n' +
			"  var DPM=effect('Resolution (in DPI)')('ADBE Slider Control-0001').valueAtTime(f*thisComp.frameDuration)/25.40;\n" +
			"  var _shift=effect('Speed (mm/k)')('ADBE Slider Control-0001').valueAtTime(f*thisComp.frameDuration);\n" +
			"  var _angle = effect('Angle')('ADBE Angle Control-0001').valueAtTime(f*thisComp.frameDuration) + 90;\n" +
			"  if (effect('Opposite')('ADBE Checkbox Control-0001').valueAtTime(f*thisComp.frameDuration) == true) {FollowFlag = 'SLIDE'} else {FollowFlag = 'FOLLOW'}\n" +
			"  if (FollowFlag == 'FOLLOW') {_angle = _angle +180}\n" +
			'  followX += DPM*_shift * Math.cos(Math.PI * (_angle / 180));\n' +
			'  followY += DPM*_shift * Math.sin(Math.PI * (_angle / 180));\n' +
			'}\n' +
			'var _X= offsetX + followX ;\n' +
			'var _Y= offsetY + followY ;\n' +
			'[_X,_Y]';

		var noLoop = layers.Effects.addProperty('ADBE Geometry2');
		noLoop.enabled = false;
		noLoop.name = 'No Loop';
		noLoop.property('ADBE Geometry2-0001').expressionEnabled = true;
		noLoop.property('ADBE Geometry2-0001').expression =
			'[thisLayer.width/2, thisLayer.height/2]';
		noLoop.property('ADBE Geometry2-0002').expressionEnabled = true;
		noLoop.property('ADBE Geometry2-0002').expression =
			'var offsetX = thisLayer.width/2;\n' +
			'var offsetY = thisLayer.height/2;\n' +
			'var fps= 1/thisComp.frameDuration;\n' +
			"posterizeTime(fps/effect('Frame Frequency')('ADBE Slider Control-0001'));\n" +
			'var followX =0;\n' +
			'var followY =0;\n' +
			'for(var f=0;f<Math.round(time/thisComp.frameDuration);f++){\n' +
			"  var DPM=effect('Resolution (in DPI)')('ADBE Slider Control-0001').valueAtTime(f*thisComp.frameDuration)/25.40;\n" +
			"  var _shift=effect('Speed (mm/k)')('ADBE Slider Control-0001').valueAtTime(f*thisComp.frameDuration);\n" +
			"  var _angle = effect('Angle')('ADBE Angle Control-0001').valueAtTime(f*thisComp.frameDuration) + 90;\n" +
			"  if (effect('Opposite')('ADBE Checkbox Control-0001').valueAtTime(f*thisComp.frameDuration) == true) {FollowFlag = 'SLIDE'} else {FollowFlag = 'FOLLOW'}\n" +
			"  if (FollowFlag == 'FOLLOW') {_angle = _angle +180}\n" +
			'  followX += DPM*_shift * Math.cos(Math.PI * (_angle / 180));\n' +
			'  followY += DPM*_shift * Math.sin(Math.PI * (_angle / 180));\n' +
			'}\n' +
			'var _X= offsetX + followX ;\n' +
			'var _Y= offsetY + followY ;\n' +
			'[_X,_Y]';
	}

	app.endUndoGroup();
} else {
	alert('レイヤーを選択してください。');
}
