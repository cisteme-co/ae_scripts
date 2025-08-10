// ────────────────────────────────────────────────
// BG Follow Effect Setup with Expressions & Controls
// ────────────────────────────────────────────────
var rootFolder = File($.fileName).parent;
$.evalFile(new File(rootFolder.fsName + '/utils/alerts.jsx'));
$.evalFile(new File(rootFolder.fsName + '/utils/controls.jsx'));

// ────────────────────────────────────────────────
// Alert missing plugin helper (uses Alerts if available)
// ────────────────────────────────────────────────
function alertMissingPlugin(pluginName) {
	if (typeof Alerts !== 'undefined' && Alerts.alertMissingPlugin) {
		Alerts.alertMissingPlugin([pluginName]);
	} else {
		alert('Missing plugin or effect: ' + pluginName);
	}
}

// ────────────────────────────────────────────────
// Main execution block
// ────────────────────────────────────────────────
if (isValid(app.project.activeItem) === true) {
	app.beginUndoGroup('BG Follow');

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

			Controls.addSlider(layer, 'Speed (mm/k)', 10);
			Controls.addAngle(layer, 'Angle', 90);
			Controls.addSlider(layer, 'Frame Frequency', 1);
			Controls.addSlider(layer, 'Resolution (in DPI)', 144);
			Controls.addCheckbox(layer, 'Opposite', false);

			// Add Tile effect with expression
			var motionTile = layer.property('Effects').addProperty('ADBE Tile');
			if (!motionTile) {
				alertMissingPlugin('ADBE Tile');
				continue;
			}
			motionTile.property('ADBE Tile-0001').expression =
				'[thisLayer.width/2, thisLayer.height/2]';
			motionTile.property('ADBE Tile-0006').setValue(true);

			// Common expression string used for Offset and Geometry2
			var followExpression =
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
				'[_X,_Y];';

			// Add Offset effect (Loop)
			var loop = layer.property('Effects').addProperty('ADBE Offset');
			if (!loop) {
				alertMissingPlugin('ADBE Offset');
				continue;
			}
			loop.name = 'Loop';
			loop.property('ADBE Offset-0001').expressionEnabled = true;
			loop.property('ADBE Offset-0001').expression = followExpression;

			// Add Geometry2 effect (No Loop)
			var noLoop = layer.property('Effects').addProperty('ADBE Geometry2');
			if (!noLoop) {
				alertMissingPlugin('ADBE Geometry2');
				continue;
			}
			noLoop.enabled = false;
			noLoop.name = 'No Loop';

			noLoop.property('ADBE Geometry2-0001').expressionEnabled = true;
			noLoop.property('ADBE Geometry2-0001').expression =
				'[thisLayer.width/2, thisLayer.height/2]';

			noLoop.property('ADBE Geometry2-0002').expressionEnabled = true;
			noLoop.property('ADBE Geometry2-0002').expression = followExpression;
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
