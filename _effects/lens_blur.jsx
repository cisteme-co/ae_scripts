// ────────────────────────────────────────────────
// Lens Blur UI Script with Depth Map Selection
// ────────────────────────────────────────────────

var rootFolder = File($.fileName).parent;

// ────────────────────────────────────────────────
// Import Utility Libraries
// ────────────────────────────────────────────────
$.evalFile(new File(rootFolder.fsName + '/utils/alerts.jsx'));

(function () {
	// ────────────────────────────────────────────
	// Create floating palette UI
	// ────────────────────────────────────────────
	var win = new Window('palette', 'Lens Blur', undefined, {
		resizeable: false,
	});
	win.alignChildren = ['fill', 'top'];

	var panelGroup = win.add('group');
	panelGroup.orientation = 'column';
	panelGroup.alignChildren = 'fill';
	panelGroup.spacing = 12;

	// ────────────────────────────────────────────
	// Input controls group
	// ────────────────────────────────────────────
	var inputs = panelGroup.add('group');
	inputs.orientation = 'column';
	inputs.alignChildren = 'left';
	inputs.spacing = 8;

	// Radius input
	var radiusGrp = inputs.add('group');
	radiusGrp.alignChildren = 'center';
	radiusGrp.spacing = 4;
	radiusGrp.add('statictext', undefined, 'Radius');
	var radiusInput = radiusGrp.add('edittext', undefined, '5');
	radiusInput.characters = 10;

	// Checkboxes group
	var checkGrp = panelGroup.add('group');
	checkGrp.orientation = 'column';
	checkGrp.alignChildren = 'left';

	var adjCheck = checkGrp.add('checkbox', undefined, 'Add as Adjustment Layer');
	adjCheck.value = true;

	var gammaCheck = checkGrp.add('checkbox', undefined, 'Gamma Correction');
	var highlightCheck = checkGrp.add('checkbox', undefined, 'Highlight');

	// Depth map dropdown group
	var depthGrp = panelGroup.add('group');
	depthGrp.orientation = 'row';
	depthGrp.alignChildren = 'left';
	depthGrp.spacing = 6;

	depthGrp.add('statictext', undefined, 'Depth Map Layer');
	var depthDropdown = depthGrp.add('dropdownlist', undefined, []);

	// ────────────────────────────────────────────
	// Populate Depth Map Dropdown
	// ────────────────────────────────────────────
	function populateDepthDropdown() {
		depthDropdown.removeAll();

		// Add 'None' option
		depthDropdown.add('item', 'None');

		// Add unselectable separator
		var sepItem = depthDropdown.add('item', '────────────');
		sepItem.enabled = false;

		if (app.project.activeItem && app.project.activeItem instanceof CompItem) {
			var comp = app.project.activeItem;
			for (var i = 1; i <= comp.numLayers; i++) {
				depthDropdown.add('item', comp.layer(i).name);
			}
		}

		depthDropdown.selection = 0; // Default selection 'None'
	}

	populateDepthDropdown();

	// ────────────────────────────────────────────
	// Buttons group
	// ────────────────────────────────────────────
	var btnGrp = win.add('group');
	btnGrp.orientation = 'row';
	btnGrp.alignChildren = 'center';

	var oofBtn = btnGrp.add('button', undefined, 'Out of Focus');
	var dofBtn = btnGrp.add('button', undefined, 'Depth of Field');

	// ────────────────────────────────────────────
	// Helper to get selected depth layer index for effect property
	// (Dropdown index 1 = comp layer 1)
	// ────────────────────────────────────────────
	function getDepthSelectionIndex() {
		if (depthDropdown.selection && depthDropdown.selection.index > 0) {
			return depthDropdown.selection.index;
		}
		return 0; // None selected
	}

	// ────────────────────────────────────────────
	// Button callbacks: Run lens blur effect
	// ────────────────────────────────────────────
	oofBtn.onClick = function () {
		runLensBlur(
			parseFloat(radiusInput.text),
			adjCheck.value,
			gammaCheck.value,
			highlightCheck.value,
			getDepthSelectionIndex(),
			'FL Out Of Focus'
		);
		win.close();
	};

	dofBtn.onClick = function () {
		runLensBlur(
			parseFloat(radiusInput.text),
			adjCheck.value,
			gammaCheck.value,
			highlightCheck.value,
			getDepthSelectionIndex(),
			'FL Depth of Field'
		);
		win.close();
	};

	win.center();
	win.show();

	// ────────────────────────────────────────────
	// Main function to apply lens blur effect
	// ────────────────────────────────────────────
	function runLensBlur(
		radius,
		addAsAdjustment,
		gammaCorrection,
		highlight,
		depthLayerIndex,
		effectName
	) {
		if (!isValid(app.project.activeItem)) {
			if (typeof Alerts !== 'undefined' && Alerts.alertNoCompSelected) {
				Alerts.alertNoCompSelected();
			} else {
				alert('Please select or open a composition.');
			}
			return;
		}

		app.beginUndoGroup('Lens Blur');

		var comp = app.project.activeItem;

		if (addAsAdjustment) {
			// Create new adjustment layer
			var layer = comp.layers.addShape();
			layer.name = effectName + ' - Lens Care';
			layer.adjustmentLayer = true;

			// Create rectangle shape to fill comp size
			var contents = layer.property('Contents');
			var rectGroup = contents.addProperty('ADBE Vector Group');
			var rectShape = rectGroup
				.property('Contents')
				.addProperty('ADBE Vector Shape - Rect');
			rectShape.property('ADBE Vector Rect Size').expression =
				'[thisComp.width, thisComp.height]';
			rectGroup
				.property('Contents')
				.addProperty('ADBE Vector Graphic - Fill')
				.property('ADBE Vector Fill Color')
				.setValue([1, 1, 1]);

			applyLensEffect(
				layer,
				radius,
				gammaCorrection,
				highlight,
				depthLayerIndex,
				effectName
			);
		} else {
			// Apply to selected layers
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

			for (var i = 0; i < selectedLayers.length; i++) {
				applyLensEffect(
					selectedLayers[i],
					radius,
					gammaCorrection,
					highlight,
					depthLayerIndex,
					effectName
				);
			}
		}

		app.endUndoGroup();
	}

	// ────────────────────────────────────────────
	// Apply lens blur effect with properties on a layer
	// ────────────────────────────────────────────
	function applyLensEffect(
		layer,
		radius,
		gammaCorrection,
		highlight,
		depthLayerIndex,
		effectName
	) {
		var effects = layer.property('Effects');
		var lensEffect =
			effects.property(effectName) || effects.addProperty(effectName);

		if (!lensEffect) {
			if (typeof Alerts !== 'undefined' && Alerts.alertMissingPlugin) {
				Alerts.alertMissingPlugin([effectName]);
			} else {
				alert(effectName + ' effect is not available.');
			}
			return;
		}

		// Set effect properties safely with fallback
		try {
			if (lensEffect.property('radius')) {
				lensEffect.property('radius').setValue(radius);
			}
			if (lensEffect.property('gamma correction')) {
				lensEffect.property('gamma correction').setValue(gammaCorrection);
			}
			if (lensEffect.property('enable')) {
				lensEffect.property('enable').setValue(highlight);
			}
			if (depthLayerIndex !== 0 && lensEffect.property('depth layer')) {
				lensEffect.property('depth layer').setValue(depthLayerIndex);
			}
		} catch (e) {
			alert('Failed to set properties on ' + effectName + ': ' + e.toString());
		}
	}
})();
