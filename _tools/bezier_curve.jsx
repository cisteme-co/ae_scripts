// ────────────────────────────────────────────────
// Key Curve Control Expression Setup Script
// ────────────────────────────────────────────────

$.evalFile(new File(File($.fileName).parent.fsName + '/utils/alerts.jsx'));

app.beginUndoGroup('key curve control');

var comp = app.project.activeItem;

if (!comp || !(comp instanceof CompItem)) {
	if (typeof Alerts !== 'undefined' && Alerts.alertNoCompSelected) {
		Alerts.alertNoCompSelected();
	} else {
		alert('Please open or select a composition.');
	}
	app.endUndoGroup();
	return;
}

var selectedLayers = comp.selectedLayers;

if (selectedLayers.length === 0) {
	if (typeof Alerts !== 'undefined' && Alerts.alertNoLayerSelected) {
		Alerts.alertNoLayerSelected();
	} else {
		alert('Please select at least one layer.');
	}
	app.endUndoGroup();
	return;
}

var layer = selectedLayers[0];

// Properties to set expression on
var Pos = layer.property('ADBE Transform Group').property('ADBE Position');
var Orient = layer
	.property('ADBE Transform Group')
	.property('ADBE Orientation');
var RoX = layer.property('ADBE Transform Group').property('ADBE Rotate X');
var RoY = layer.property('ADBE Transform Group').property('ADBE Rotate Y');
var RoZ = layer.property('ADBE Transform Group').property('ADBE Rotate Z');
var Sc = layer.property('ADBE Transform Group').property('ADBE Scale');

var expStart =
	't=effect("key curve control")(1);\r' +
	'// Aggregate keyframe values to the slider control\r' +
	'tx=linear(t, 0, 100, thisProperty.key(1).time, thisProperty.key(';
var expEnd = ').time); \rvalueAtTime(tx)';

var slider = layer
	.property('ADBE Effect Parade')
	.addProperty('ADBE Slider Control');
slider.name = 'key curve control';

// Apply expression if property has more than 1 keyframe
function applyExpression(prop) {
	if (prop && prop.numKeys > 1) {
		prop.expression = expStart + prop.numKeys + expEnd;
	}
}

applyExpression(Pos);
applyExpression(RoZ);
applyExpression(RoX);
applyExpression(RoY);
applyExpression(Orient);
applyExpression(Sc);

app.endUndoGroup();
