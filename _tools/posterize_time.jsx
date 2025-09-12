// ────────────────────────────────────────────────
// Posterize Time Effect Application Script
// ────────────────────────────────────────────────
var rootFolder = File($.fileName).parent;
$.evalFile(new File(rootFolder.fsName + '/utils/alerts.jsx'));

app.beginUndoGroup('Posterize');

// Validate active composition
if (!(app.project.activeItem && app.project.activeItem instanceof CompItem)) {
	Alerts.alertNoCompSelected();
	app.endUndoGroup();
}

var comp = app.project.activeItem;
var selectedLayers = comp.selectedLayers;

// Check if layers are selected
if (selectedLayers.length === 0) {
	Alerts.alertNoLayerSelected();
	app.endUndoGroup();
}

// Calculate target posterize frame rate (half the comp's frame rate)
var fps = 1 / comp.frameDuration;
var posterizeValue = fps / 2;

// Apply Posterize Time effect to each selected layer
for (var i = 0; i < selectedLayers.length; i++) {
	var layer = selectedLayers[i];
	var posterizeEffect = layer.Effects.addProperty('ADBE Posterize Time');
	posterizeEffect.property('ADBE Posterize Time-0001').setValue(posterizeValue);
}

app.endUndoGroup();
