function handleNewCut(
	projectsDrop,
	episodeDrop,
	cutInput,
	framerates,
	takes,
	takesCodes,
	workerInput,
	takeInput
) {
	var selectedIndex = 0;
	if (
		projectsDrop &&
		projectsDrop.selection &&
		projectsDrop.selection.index != null
	) {
		selectedIndex = projectsDrop.selection.index;
	}
	var projectFolder = decodeURI(getProjects()[selectedIndex]);
	if (!projectFolder) {
		alert('Could not retrieve the project path');
		return;
	}

	var templateFolder = new Folder(
		projectFolder + '/assets/templates/compositing'
	);
	if (!templateFolder.exists) {
		alert('Template folder not found:\n' + templateFolder.fsName);
		return;
	}

	var filtered = getAvailableTakes(takes, takesCodes, templateFolder);
	takes = filtered[0];
	takesCodes = filtered[1];

	var section = 'ProjectsBoxPrefs';
	var framerateKey = 'framerateSelection';
	var takeKey = 'takeSelection';
	var savedFramerateIndex = app.settings.haveSetting(section, framerateKey)
		? parseInt(app.settings.getSetting(section, framerateKey), 10)
		: 4;

	var savedTakeIndex = app.settings.haveSetting(section, takeKey)
		? parseInt(app.settings.getSetting(section, takeKey), 10)
		: 1;

	var win = new Window('dialog', 'New Cut');
	win.preferredSize.width = 400;

	var masterGroup = win.add('group');

	var selectGroup = masterGroup.add('group');
	selectGroup.add('statictext', undefined, 'Project');
	var projectDrop = selectGroup.add('dropdownlist', undefined, [
		projectsDrop.selection.text,
	]);
	projectDrop.selection = 0;
	projectDrop.enabled = false;
	selectGroup.add('statictext', undefined, 'Episode');
	var episode = selectGroup.add('dropdownlist', undefined, [
		episodeDrop.selection.text,
	]);
	episode.selection = 0;
	episode.enabled = false;

	var maingroup = win.add('panel', undefined, 'Cut');
	var buttonGroup = win.add('group');
	var addButton = buttonGroup.add('button', undefined, '+');
	addButton.onClick = function () {
		add_btn(cutInput.text);
	};
	var removeButton = buttonGroup.add('button', undefined, '-');
	removeButton.onClick = minus_btn;

	var parametersGroup = win.add('group');
	parametersGroup.add('statictext', undefined, 'Framerate');

	var framerateDrop = parametersGroup.add(
		'dropdownlist',
		undefined,
		framerates
	);
	framerateDrop.selection = Math.min(
		savedFramerateIndex,
		framerates.length - 1
	);
	framerateDrop.onChange = function () {
		app.settings.saveSetting(
			section,
			framerateKey,
			framerateDrop.selection.index.toString()
		);
	};

	parametersGroup.add('statictext', undefined, 'Take');

	var takesDrop = parametersGroup.add('dropdownlist', undefined, takes);
	takesDrop.selection = Math.min(savedTakeIndex, takes.length - 1);
	takesDrop.onChange = function () {
		app.settings.saveSetting(
			section,
			takeKey,
			takesDrop.selection.index.toString()
		);
	};

	var createButton = win.add('button', undefined, 'Create');
	createButton.onClick = function () {
		var cuts = [];
		var seconds = [];
		var frames = [];
		var framerate = parseFloat(framerateDrop.selection.text);
		for (var n = 0; n < maingroup.children.length; n++) {
			cuts.push(maingroup.children[n].cutInput.text);
			seconds.push(maingroup.children[n].secondsInput.text);
			frames.push(maingroup.children[n].framesInput.text);
		}

		createCut(
			projectDrop.selection,
			episode.selection,
			cuts,
			framerate,
			takesDrop.selection,
			takesCodes,
			seconds,
			frames,
			workerInput
		);

		if (takeInput && takesDrop.selection) {
			takeInput.text = takesCodes[takesDrop.selection.index];
		}

		win.close();
	};

	if (cutInput.text.indexOf('-') !== -1) {
		var parts = cutInput.text.split('-');
		for (var i = 0; i < parts.length; i++) {
			add_row(maingroup, parts[i]);
		}
	} else {
		add_row(maingroup, cutInput.text);
	}

	win.show();

	function add_row(maingroup, cut) {
		var group = maingroup.add('group');
		group.spacing = 4;

		var noLabel = group.add('statictext', undefined, ' No.');
		noLabel.preferredSize.width = 30;
		group.cutInput = group.add('edittext', undefined, cut);
		group.cutInput.characters = 4;
		group.add('statictext', undefined, 'TIME (');
		group.secondsInput = group.add('edittext', undefined, '6');
		group.secondsInput.characters = 3;
		group.add('statictext', undefined, '+');
		group.framesInput = group.add('edittext', undefined, '0');
		group.framesInput.characters = 3;
		group.add('statictext', undefined, ')');

		group.index = maingroup.children.length - 1;
		win.layout.layout(true);
	}

	function add_btn(cut) {
		add_row(maingroup, cut);
	}

	function minus_btn() {
		if (maingroup.children.length > 1) {
			lastChild = maingroup.children[maingroup.children.length - 1];
			maingroup.remove(lastChild);
		}
		win.layout.layout(true);
	}

	function getAvailableTakes(takes, takesCodes, templateFolder) {
		var availableTakes = [];
		var availableCodes = [];

		if (!templateFolder.exists) {
			return [availableTakes, availableCodes];
		}

		var files = templateFolder.getFiles('*.aep');

		for (var i = 0; i < takes.length; i++) {
			var code = takesCodes[i].toLowerCase();
			var found = false;

			for (var j = 0; j < files.length; j++) {
				var fileName = files[j].name.toLowerCase();
				if (fileName.indexOf('_' + code + '.aep') !== -1) {
					found = true;
					break;
				}
			}

			if (found) {
				availableTakes.push(takes[i]);
				availableCodes.push(takesCodes[i]);
			}
		}

		return [availableTakes, availableCodes];
	}
}
