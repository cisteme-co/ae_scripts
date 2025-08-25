function buildUI(thisObj) {
	var win =
		thisObj instanceof Panel
			? thisObj
			: new Window('pavarte', 'Filters Box', undefined, { resizeable: true });

	win.alignChildren = 'fill';
	win.spacing = 4;

	// Create first row container for dropdown and listbox
	var firstRow = win.add('group');
	firstRow.orientation = 'row';
	firstRow.spacing = 5;

	// Projects dropdown
	var projects = getProjects(); // Cache projects list once
	var projectsDrop = firstRow.add('dropdownlist', undefined, []);
	populateDropDown(projectsDrop, projects);
	projectsDrop.onChange = reloadPresets;

	// Presets list box
	var presetsList = win.add('listbox', undefined, []);
	presetsList.preferredSize = [100, 400];
	populateList(presetsList, getPresets(projects[projectsDrop.selection.index]));

	// Button group container, centered horizontally and vertically
	var btnGrp = win.add('group');
	btnGrp.orientation = 'row';
	btnGrp.alignChildren = ['center', 'center'];
	btnGrp.alignment = ['center', 'top'];

	// Apply preset button
	var applyButton = btnGrp.add('button', undefined, 'Apply');
	applyButton.onClick = function () {
		var selectedProject = projects[projectsDrop.selection.index];
		var presetFolder = '/assets/templates/compositing/_presets/';
		var presetName = presetsList.selection && presetsList.selection.text;
		if (!presetName) {
			alert('Please select a preset.');
			return;
		}

		// varruct full file path to preset JSX file
		var filePath =
			decodeURI(selectedProject.path) +
			'/' +
			decodeURI(selectedProject.name) +
			presetFolder +
			presetName +
			'.jsx';

		runFile(filePath);
	};

	// Reload presets button
	var reloadButton = btnGrp.add('button', undefined, 'Reload');
	reloadButton.onClick = reloadPresets;

	/**
	 * Reloads the presets list based on current project selection.
	 */
	function reloadPresets() {
		presetsList.removeAll();
		var selectedProject = projects[projectsDrop.selection.index];
		populateList(presetsList, getPresets(selectedProject));
	}

	// Handle window resizing to adjust layout
	win.onResizing = win.onResize = function () {
		this.layout.resize();
	};

	// Show the window or layout the panel
	if (win instanceof Window) {
		win.center();
		win.show();
	} else {
		win.layout.layout(true);
		win.layout.resize();
	}
}

function populateDropDown(dropdown, items) {
	for (var i = 0; i < items.length; i++) {
		dropdown.add('item', items[i].name);
	}
	dropdown.selection = 0;
}

function populateList(node, items) {
	if (items.length > 0) {
		for (var i = 0; i < items.length; i++) {
			// Display name without extension
			var displayName = decodeURI(items[i].name).split('.')[0];
			node.add('item', displayName);
		}
	} else {
		var noItem = node.add('item', 'No Preset');
		noItem.enabled = false;
	}
}

function runFile(filePath) {
	var file = File(filePath);
	if (!file.exists) {
		alert('Could not find file:\n' + filePath);
		return;
	}

	if (file.open('r')) {
		try {
			eval(file.read());
		} catch (e) {
			alert('Error running script:\n' + e.toString());
		}
		file.close();
	} else {
		alert('Failed to open file:\n' + filePath);
	}
}
