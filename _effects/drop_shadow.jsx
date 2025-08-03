function addSlider(layers, name, value) {
	var layer = layers.Effects.addProperty('ADBE Slider Control');
	layer.property(1).setValue(value);
	layer.name = name;
}

function addAngle(layers, name, value) {
	var layer = layers.Effects.addProperty('ADBE Angle Control');
	layer.property(1).setValue(value);
	layer.name = name;
}

function addColorChange(layers, name, value) {
	var layer = layers.Effects.addProperty('ADBE Color Control');
	layer.property(1).setValue(value);
	layer.name = name;
}

function addDropdown(layers, name, defaultIndex) {
	var dropdown = layers.Effects.addProperty('ADBE Dropdown Control');
	dropdown.name = name;
	dropdown.property(1).setValue(defaultIndex);
	return dropdown;
}

function setDropdownItems(dropdown, items) {
	try {
		dropdown.property(1).setPropertyParameters(items);
	} catch (e) {
		alert('Failed to set dropdown items: ' + e.toString());
	}
}

var blendModeNames = [
	'Normal',
	'Multiply',
	'Screen',
	'Overlay',
	'Soft Light',
	'Hard Light',
];

if (isValid(app.project.activeItem) == true) {
	app.beginUndoGroup('Drop Shadow');

	var curItem = app.project.activeItem;
	var selectedLayers = curItem.selectedLayers;

	for (var i = 0; i < selectedLayers.length; i++) {
		var layer = selectedLayers[i];

		app.executeCommand(9000); // Add layer styles

		addColorChange(layer, 'Color', [0, 0, 0]);
		var blendDropdown = addDropdown(layer, 'Blend Mode', 1);
		setDropdownItems(blendDropdown, blendModeNames);
		addSlider(layer, 'Opacity', 50);
		addAngle(layer, 'Angle', -45);
		addSlider(layer, 'Distance', 10);
		addSlider(layer, 'Choke', 0);
		addSlider(layer, 'Size', 0);

		// Use matchNames for expression referencing
		var dropShadow = layer
			.property('ADBE Layer Styles')
			.property('dropShadow/enabled');

		dropShadow.property('dropShadow/mode2').expression =
			'var mode = effect("Dropdown Menu Control")("Menu");\n' +
			'mode == 1 ? 1 :\n' +
			'mode == 2 ? 5 :\n' +
			'mode == 3 ? 11 :\n' +
			'mode == 4 ? 16 :\n' +
			'mode == 5 ? 17 :\n' +
			'mode == 6 ? 18 :\n' +
			'1;';
		dropShadow.property('dropShadow/color').expression =
			'effect("Color")("ADBE Color Control-0001")';
		dropShadow.property('dropShadow/opacity').expression =
			'effect("Opacity")("ADBE Slider Control-0001")';
		dropShadow.property('dropShadow/localLightingAngle').expression =
			'effect("Angle")("ADBE Angle Control-0001") - 180';
		dropShadow.property('dropShadow/distance').expression =
			'effect("Distance")("ADBE Slider Control-0001")';
		dropShadow.property('dropShadow/chokeMatte').expression =
			'effect("Choke")("ADBE Slider Control-0001")';
		dropShadow.property('dropShadow/blur').expression =
			'effect("Size")("ADBE Slider Control-0001")';
	}

	app.endUndoGroup();
} else {
	alert('レイヤーを選択してください。');
}
