// ────────────────────────────────────────────────
// Sequence Selected Layers in Timeline Script
// ────────────────────────────────────────────────
var rootFolder = File($.fileName).parent;
$.evalFile(new File(rootFolder.fsName + '/utils/alerts.jsx'));

app.beginUndoGroup('Sequence Layer');

// Validate active composition
var comp = app.project.activeItem;
if (!(comp && comp instanceof CompItem)) {
	Alerts.alertNoCompSelected();
	app.endUndoGroup();
}

var selectedLayers = comp.selectedLayers;
if (selectedLayers.length === 0) {
	Alerts.alertNoLayerSelected();
	app.endUndoGroup();
}

var fps = 1 / comp.frameDuration;

// Loop through selected layers, offsetting startTime based on previous layer's duration
for (var i = 0; i < selectedLayers.length; i++) {
	if (i === 0) {
		// First layer stays at original startTime (usually 0)
		selectedLayers[i].startTime = 0;
	} else {
		var prevLayer = selectedLayers[i - 1];
		var offsetFrames = (prevLayer.outPoint - prevLayer.inPoint) * fps;
		var layer = selectedLayers[i];
		layer.startTime = i * offsetFrames * comp.frameDuration;
	}
}

app.endUndoGroup();
