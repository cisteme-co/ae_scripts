// ────────────────────────────────────────────────
// Parallax Control Setup Script for Selected Layers
// ────────────────────────────────────────────────

var rootFolder = File($.fileName).parent;
$.evalFile(new File(rootFolder.fsName + '/utils/alerts.jsx'));

app.beginUndoGroup('CreateComp');

// Get active composition
var comp = app.project.activeItem;

// Check if comp is valid
if (!(comp && comp instanceof CompItem)) {
	Alerts.alertNoCompSelected();
	app.endUndoGroup();
	return;
}

// Get selected layers
var selLayers = comp.selectedLayers;

// Check if layers are selected
if (selLayers.length === 0) {
	Alerts.alertNoLayerSelected();
	app.endUndoGroup();
	return;
}

// ──────────────
// Add Parallax Control Shape Layer
// ──────────────
var parallaxControlLayer = comp.layers.addShape();
parallaxControlLayer.guidLayer = true;
parallaxControlLayer.name = 'parallax control';

// Add Checkbox Control Effect named "parallax control"
var checkboxEffect = parallaxControlLayer
	.property('ADBE Effect Parade')
	.addProperty('ADBE Checkbox Control');
checkboxEffect.name = 'parallax control';
checkboxEffect.property('ADBE Checkbox Control-0001').setValue(1);

// ──────────────
// Process each selected layer
// ──────────────
for (var i = 0; i < selLayers.length; i++) {
	var layer = selLayers[i];

	// Add custom "Kikaku 3D Transform Control" effect to layer
	var transformControl = layer
		.property('ADBE Effect Parade')
		.addProperty('Kikaku 3D Transform Control');

	// Initialize control effect values
	transformControl
		.property('Kikaku 3D Transform Control-0001')
		.setValue([0, 0, 0]); // Some position?
	transformControl
		.property('Kikaku 3D Transform Control-0002')
		.setValue([0, 0, 0]); // Some other position?

	// Enable 3D for layer
	layer.threeDLayer = true;

	// Set Anchor Point to center
	var anchorPoint = [layer.width / 2, layer.height / 2, 0];
	layer
		.property('ADBE Transform Group')
		.property('ADBE Anchor Point')
		.setValue(anchorPoint);

	// Set Position to center
	var position = [layer.width / 2, layer.height / 2, 0];
	layer
		.property('ADBE Transform Group')
		.property('ADBE Position')
		.setValue(position);

	// ──────────────
	// Apply Expressions
	// ──────────────

	// Anchor Point Expression
	layer
		.property('ADBE Transform Group')
		.property('ADBE Anchor Point').expression =
		'ON = thisComp.layer("parallax control").effect("parallax control")("ADBE Checkbox Control-0001");\n' +
		'ax = transform.anchorPoint[0];\n' +
		'ay = transform.anchorPoint[1];\n' +
		'az = transform.anchorPoint[2];\n' +
		'px = effect("Kikaku 3D Transform Control")("Kikaku 3D Transform Control-0002")[0];\n' +
		'py = effect("Kikaku 3D Transform Control")("Kikaku 3D Transform Control-0002")[1];\n' +
		'pz = effect("Kikaku 3D Transform Control")("Kikaku 3D Transform Control-0001")[2];\n' +
		'if(ON == 1) {\n' +
		'  [ax - px, ay - py, az - pz];\n' +
		'} else {\n' +
		'  transform.anchorPoint;\n' +
		'}';

	// Position Expression
	layer.property('ADBE Transform Group').property('ADBE Position').expression =
		'ON = thisComp.layer("parallax control").effect("parallax control")("ADBE Checkbox Control-0001");\n' +
		'X = thisComp.width / 2;\n' +
		'Y = thisComp.height / 2;\n' +
		'Zdepth = effect("Kikaku 3D Transform Control")("Kikaku 3D Transform Control-0002")[2];\n' +
		'if (ON == 1) {\n' +
		'  [X, Y, Zdepth];\n' +
		'} else {\n' +
		'  transform.position;\n' +
		'}';

	// Initialize scale to 100%
	layer
		.property('ADBE Transform Group')
		.property('ADBE Scale')
		.setValue([100, 100, 100]);

	// Scale Expression
	layer.property('ADBE Transform Group').property('ADBE Scale').expression =
		'ON = thisComp.layer("parallax control").effect("parallax control")("ADBE Checkbox Control-0001");\n' +
		'XSC = effect("Kikaku 3D Transform Control")("Kikaku 3D Transform Control-0004");\n' +
		'YSC = effect("Kikaku 3D Transform Control")("Kikaku 3D Transform Control-0005");\n' +
		'ZSC = effect("Kikaku 3D Transform Control")("Kikaku 3D Transform Control-0006");\n' +
		'if (ON == 1) {\n' +
		'  cam = thisComp.activeCamera;\n' +
		'  distance = length(sub(position, cam.position));\n' +
		'  X = XSC * distance / cam.zoom;\n' +
		'  Y = YSC * distance / cam.zoom;\n' +
		'  Z = ZSC * distance / cam.zoom;\n' +
		'  [X, Y, Z];\n' +
		'} else {\n' +
		'  transform.scale;\n' +
		'}';

	// Orientation Expression
	layer
		.property('ADBE Transform Group')
		.property('ADBE Orientation').expression =
		'XO = effect("Kikaku 3D Transform Control")("Kikaku 3D Transform Control-0007");\n' +
		'YO = effect("Kikaku 3D Transform Control")("Kikaku 3D Transform Control-0008");\n' +
		'ZO = effect("Kikaku 3D Transform Control")("Kikaku 3D Transform Control-0009");\n' +
		'[XO, YO, ZO];';

	// Rotate X Expression
	layer.property('ADBE Transform Group').property('ADBE Rotate X').expression =
		'effect("Kikaku 3D Transform Control")("Kikaku 3D Transform Control-0010");';

	// Rotate Y Expression
	layer.property('ADBE Transform Group').property('ADBE Rotate Y').expression =
		'effect("Kikaku 3D Transform Control")("Kikaku 3D Transform Control-0011");';

	// Rotate Z Expression
	layer.property('ADBE Transform Group').property('ADBE Rotate Z').expression =
		'effect("Kikaku 3D Transform Control")("Kikaku 3D Transform Control-0012");';

	// Opacity Expression
	layer.property('ADBE Transform Group').property('ADBE Opacity').expression =
		'effect("Kikaku 3D Transform Control")("Kikaku 3D Transform Control-0013");';
}

app.endUndoGroup();
