// ────────────────────────────────────────────────
// controls.jsx - UI Effect Control Utility Functions
// ────────────────────────────────────────────────

var Controls = (function () {
	function addSlider(layer, name, value) {
		var ctrl = layer.Effects.addProperty('ADBE Slider Control');
		ctrl.property(1).setValue(value);
		ctrl.name = name;
	}

	function addCheckbox(layer, name, value) {
		const effect = layer
			.property('Effects')
			.addProperty('ADBE Checkbox Control');
		effect.name = name;
		effect.property('ADBE Checkbox Control-0001').setValue(value);
	}

	function addAngle(layer, name, value) {
		var ctrl = layer.Effects.addProperty('ADBE Angle Control');
		ctrl.property(1).setValue(value);
		ctrl.name = name;
	}

	function addColorChange(layer, name, value) {
		var ctrl = layer.Effects.addProperty('ADBE Color Control');
		ctrl.property(1).setValue(value);
		ctrl.name = name;
	}

	function addDropdown(layer, name, defaultIndex) {
		var ctrl = layer.Effects.addProperty('ADBE Dropdown Control');
		ctrl.name = name;
		ctrl.property(1).setValue(defaultIndex);
		return ctrl;
	}

	function setDropdownItems(dropdown, items) {
		try {
			dropdown.property(1).setPropertyParameters(items);
		} catch (e) {
			alert('Failed to set dropdown items: ' + e.toString());
		}
	}

	return {
		addSlider: addSlider,
		addCheckbox: addCheckbox,
		addAngle: addAngle,
		addColorChange: addColorChange,
		addDropdown: addDropdown,
		setDropdownItems: setDropdownItems,
	};
})();
