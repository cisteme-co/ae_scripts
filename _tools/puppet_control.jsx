// ────────────────────────────────────────────────
// Delay Movement Script for Selected Layers with Puppet Pins
// ────────────────────────────────────────────────
var rootFolder = File($.fileName).parent;
$.evalFile(new File(rootFolder.fsName + '/utils/alerts.jsx'));

app.beginUndoGroup('DelayMovement');

// Validate active composition and selected layers
var comp = app.project.activeItem;

if (!(comp && comp instanceof CompItem)) {
	Alerts.alertNoCompSelected();
	app.endUndoGroup();
	return;
}

var selectedLayers = comp.selectedLayers;
if (selectedLayers.length === 0) {
	Alerts.alertNoLayerSelected();
	app.endUndoGroup();
	return;
}

// Add control effects to the first selected layer only
var controlLayer = selectedLayers[0];

// Add ON checkbox effect
var fxON = controlLayer
	.property('Effects')
	.addProperty('ADBE Checkbox Control');
fxON.name = 'ON';
controlLayer.effect('ON')('ADBE Checkbox Control-0001').setValue(true);

// Add loop checkbox effect
var fxLoop = controlLayer
	.property('Effects')
	.addProperty('ADBE Checkbox Control');
fxLoop.name = 'loop';

// Expression to apply on puppet pins
var exp =
	'late=0;\r' +
	'// Number of frames to delay\r' +
	'a=1/thisComp.frameDuration;\r' +
	'// FPS calculation\r' +
	"loop=effect('loop')('ADBE Checkbox Control-0001');\r" +
	"ON=effect('ON')('ADBE Checkbox Control-0001');\r" +
	'compDur=thisComp.duration;\r' +
	'endKey=nearestKey(compDur);\r' +
	'EK=timeToFrames(endKey.time);\r' +
	'// Last keyframe time\r' +
	'LT=late/a;\r' +
	'A=valueAtTime(time-LT);\r' +
	'if(ON==0){value}\r' +
	'else if(late==0){value}\r' +
	'else if(loop==1){if(time<LT){valueAtTime((endKey.time-LT)+time)}else{A}}\r' +
	'else if(loop==0){A}';

// Process all selected layers
for (var i = 0; i < selectedLayers.length; i++) {
	var layer = selectedLayers[i];

	var puppetEffect = layer
		.property('ADBE Effect Parade')
		.property('ADBE FreePin3');

	if (puppetEffect) {
		var meshGroup = puppetEffect
			.property('ADBE FreePin3 ARAP Group')
			.property('ADBE FreePin3 Mesh Group');

		for (var m = 1; m <= meshGroup.numProperties; m++) {
			var mesh = meshGroup.property(m);
			var pins = mesh
				.property('ADBE FreePin3 Mesh Atom')
				.property('ADBE FreePin3 PosPins');

			for (var p = 1; p <= pins.numProperties; p++) {
				var pin = pins.property(p);
				var pinType = pin.property('ADBE FreePin3 PosPin Type').value;

				// Apply expressions depending on pin type
				if (pinType === 1) {
					// Position pin
					pin.property('ADBE FreePin3 PosPin Position').expression = exp;
				} else if (pinType === 3) {
					// Bend pin
					pin.property('ADBE FreePin3 PosPin Scale').expression = exp;
					pin.property('ADBE FreePin3 PosPin Rotation').expression = exp;
				} else if (pinType === 4) {
					// Detailed pin
					pin.property('ADBE FreePin3 PosPin Position').expression = exp;
					pin.property('ADBE FreePin3 PosPin Scale').expression = exp;
					pin.property('ADBE FreePin3 PosPin Rotation').expression = exp;
				}
			}
		}
	}
}

app.endUndoGroup();
