function buildUI(thisObj) {
	var rootFolder = File($.fileName).parent.parent.path;
	var iconsPath = rootFolder + '/_project_box/assets/icons/';
	var section = 'ProjectsBoxPrefs';

	var keys = {
		project: 'lastProjectIndex',
		episode: 'lastEpisodeIndex',
		cut: 'lastCutValue',
	};

	var framerates = [8, 12, 15, 23.976, 24, 29.97, 30];
	var takes = [
		'コンテ撮 (c)',
		'原撮 (g)',
		'3DCG撮 (3d_t)',
		'タイミング撮 (t)',
		'仮本撮 (v0)',
		'本撮 (v)',
	];
	var takesCodes = ['c1', 'g1', '3D_t1', 't1', 'v0', 'v1'];

	var panel =
		thisObj instanceof Panel
			? thisObj
			: new Window('palette', 'Projects Box', undefined, { resizeable: true });
	panel.spacing = 4;

	var firstRow = panel.add('group');
	firstRow.orientation = 'row';
	firstRow.spacing = 5;

	var projectsDrop = firstRow.add('dropdownlist', undefined, []);
	projectsDrop.preferredSize.width = 100;
	var episodeDrop = firstRow.add('dropdownlist', undefined, []);
	var cutInput = firstRow.add('edittext', undefined, '000');
	cutInput.characters = 3;

	var savedProject = app.settings.haveSetting(section, keys.project)
		? parseInt(app.settings.getSetting(section, keys.project), 10)
		: 0;
	var savedEpisode = app.settings.haveSetting(section, keys.episode)
		? parseInt(app.settings.getSetting(section, keys.episode), 10)
		: 0;
	var savedCut = app.settings.haveSetting(section, keys.cut)
		? app.settings.getSetting(section, keys.cut)
		: '000';

	cutInput.text = savedCut;

	var buttonGroup = firstRow.add('group');
	buttonGroup.orientation = 'row';
	buttonGroup.spacing = 0;

	var newCut = buttonGroup.add(
		'iconbutton',
		undefined,
		File(iconsPath + 'file-plus-2.png'),
		{ style: 'toolbutton' }
	);

	var lastVersion = buttonGroup.add(
		'iconbutton',
		undefined,
		File(iconsPath + 'external-link.png'),
		{ style: 'toolbutton' }
	);
	lastVersion.onClick = function () {
		openFile(projectsDrop, episodeDrop, cutInput, takeInput);
	};

	var importCellsBtn = buttonGroup.add(
		'iconbutton',
		undefined,
		File(iconsPath + 'folder-down.png'),
		{ style: 'toolbutton' }
	);

	var importBGBtm = buttonGroup.add(
		'iconbutton',
		undefined,
		File(iconsPath + 'image-down.png'),
		{ style: 'toolbutton' }
	);

	var timesheet = buttonGroup.add(
		'iconbutton',
		undefined,
		File(iconsPath + 'list-ordered.png'),
		{ style: 'toolbutton' }
	);
	timesheet.onClick = function () {
		var tmpDir = Folder('C:/tmp/adobe');
		if (!tmpDir.exists) {
			tmpDir.create();
		}

		// List your required EXE files here relative to your rootFolder
		var exeFiles = [
			'AE_RemapCall.exe',
			'AE_RemapExceed.exe', // add any others you need
		];

		for (var i = 0; i < exeFiles.length; i++) {
			var srcFile = File(rootFolder + '/_project_box/utils/' + exeFiles[i]);
			var destFile = File(tmpDir.fsName + '/' + exeFiles[i]);

			if (!destFile.exists) {
				if (srcFile.exists) {
					try {
						srcFile.copy(destFile.fsName);
					} catch (e) {
						alert('Failed to copy ' + exeFiles[i] + ': ' + e.toString());
						return;
					}
				} else {
					alert('Source file not found: ' + srcFile.fsName);
					return;
				}
			}
		}

		var timesheetFile = File(
			rootFolder + '/_project_box/utils/AE_RemapExceed.jsx'
		);
		if (timesheetFile.exists) {
			$.evalFile(timesheetFile);
		} else {
			alert('AE_RemapExceed.jsx not found!');
		}
	};

	var retimer = buttonGroup.add(
		'iconbutton',
		undefined,
		File(iconsPath + 'timer-reset.png'),
		{ style: 'toolbutton' }
	);
	retimer.onClick = function () {
		var retimerFile = File(rootFolder + '/_project_box//logic/retimer.jsx');
		if (retimerFile.exists) {
			$.evalFile(retimerFile);
		} else {
			alert('retimer.jsx not found!');
		}
	};

	var fileReplaceBtn = buttonGroup.add(
		'iconbutton',
		undefined,
		File(iconsPath + 'replace-all.png'),
		{ style: 'toolbutton' }
	);
	fileReplaceBtn.onClick = function () {
		fileReplace();
	};

	var removeUnusedBtn = buttonGroup.add(
		'iconbutton',
		undefined,
		File(iconsPath + 'trash-2.png'),
		{ style: 'toolbutton' }
	);
	removeUnusedBtn.onClick = function () {
		removeUnused();
	};

	var location = buttonGroup.add(
		'iconbutton',
		undefined,
		File(iconsPath + 'folder-root.png'),
		{ style: 'toolbutton' }
	);
	location.onClick = openRootFolder;

	var renderBtn = buttonGroup.add(
		'iconbutton',
		undefined,
		File(iconsPath + 'arrow-right-from-line.png'),
		{ style: 'toolbutton' }
	);

	var collectBtn = buttonGroup.add(
		'iconbutton',
		undefined,
		File(iconsPath + 'combine.png'),
		{ style: 'toolbutton' }
	);
	collectBtn.onClick = function () {
		collectFiles();
	};

	var secondRow = panel.add('group');
	secondRow.orientation = 'row';
	secondRow.spacing = 5;

	var workerGroup = secondRow.add('group');
	workerGroup.spacing = 0;
	workerGroup.add('statictext', undefined, T('worker'));

	var workerKey = 'workerName';
	var defaultWorker = $.getenv('COMPUTERNAME') || T('worker');
	var savedWorker = app.settings.haveSetting(section, workerKey)
		? app.settings.getSetting(section, workerKey)
		: defaultWorker;

	var workerInput = workerGroup.add('edittext', undefined, savedWorker);
	workerInput.characters = 10;
	workerInput.onChange = function () {
		app.settings.saveSetting(section, workerKey, workerInput.text);
		renameWorker(workerInput.text);
	};

	secondRow.add('panel', [100, 0, 103, 20]);

	var takeGroup = secondRow.add('group');
	takeGroup.spacing = 0;
	var takeInput = takeGroup.add('edittext', undefined, '--');
	takeInput.characters = 3;
	var takeButton = takeGroup.add(
		'iconbutton',
		undefined,
		File(iconsPath + 'diamond-plus.png'),
		{ style: 'toolbutton' }
	);

	takeButton.onClick = function () {
		if (!app.project.file) {
			alert('Please save your project file first.');
			return;
		}

		var fileName = app.project.file.name;
		var fileNameSplit = fileName.split('_');
		var oldTake = fileNameSplit[fileNameSplit.length - 1].split('.')[0]; // e.g., "t01"

		// Extract numeric part
		var prefix = oldTake.match(/[^\d]+/)[0]; // e.g., "t"
		var number = parseInt(oldTake.match(/\d+/)[0], 10); // e.g., 1

		var newNumber = number + 1;

		var newTake = prefix + newNumber; // "t02"

		takeInput.text = newTake;
		incrementTake(newTake);
	};

	takeInput.onChange = function () {
		incrementTake(takeInput.text);
	};

	secondRow.add('panel', [100, 0, 103, 20]);

	var retakeInput = secondRow.add('edittext', undefined, T('retake'));
	retakeInput.characters = 28;
	retakeInput.onChange = function () {
		retake(retakeInput.text);
	};

	importCellsBtn.onClick = function () {
		importCells();
	};
	importBGBtm.onClick = function () {
		importBG();
	};
	renderBtn.onClick = function () {
		renderBG();
	};

	// Now that workerInput and takeInput exist:
	newCut.onClick = function () {
		handleNewCut(
			projectsDrop,
			episodeDrop,
			cutInput,
			framerates,
			takes,
			takesCodes,
			workerInput,
			takeInput
		);
	};

	// Helptips
	newCut.helpTip = TT('newCut');
	lastVersion.helpTip = TT('lastVersion');
	importCellsBtn.helpTip = TT('importCells');
	importBGBtm.helpTip = TT('importBG');
	timesheet.helpTip = TT('timesheet');
	retimer.helpTip = TT('retimer');
	fileReplace.helpTip = TT('fileReplace');
	removeUnused.helpTip = TT('removeUnused');
	location.helpTip = TT('location');
	renderBtn.helpTip = TT('render');
	takeInput.helpTip = TT('takeUp');
	takeButton.helpTip = TT('takeUp');
	workerInput.helpTip = TT('worker');
	retakeInput.helpTip = TT('retake');

	panel.layout.layout(true);
	panel.layout.resize();
	panel.onResizing = panel.onResize = function () {
		panel.layout.resize();
	};

	if (panel instanceof Window) {
		panel.center();
		panel.show();
	}

	// Fill dropdowns
	var projects = getProjects();
	projectsDrop.removeAll();
	for (var i = 0; i < projects.length; i++) {
		projectsDrop.add('item', projects[i].name);
	}
	projectsDrop.selection = Math.min(savedProject, projects.length - 1);

	function updateEpisodes(projectsDrop, episodeDrop) {
		episodeDrop.removeAll();
		var episodes = getEpisodes(projectsDrop.selection.index);
		for (var i = 0; i < episodes.length; i++) {
			episodeDrop.add('item', episodes[i].name);
		}
		episodeDrop.selection = Math.min(
			savedEpisode,
			episodeDrop.items.length - 1
		);
		app.settings.saveSetting(
			section,
			keys.episode,
			episodeDrop.selection.index.toString()
		);
	}

	updateEpisodes(projectsDrop, episodeDrop);

	projectsDrop.onChange = function () {
		app.settings.saveSetting(
			section,
			keys.project,
			projectsDrop.selection.index.toString()
		);
		updateEpisodes(projectsDrop, episodeDrop);
	};

	episodeDrop.onChange = function () {
		app.settings.saveSetting(
			section,
			keys.episode,
			episodeDrop.selection.index.toString()
		);
	};

	cutInput.onChanging = function () {
		app.settings.saveSetting(section, keys.cut, cutInput.text);
	};

	function extractTakeCode(filename) {
		var regex = /(c\d+|g\d+|3d_t\d+|t\d+|v0|v\d+)$/i;
		var match = filename.match(regex);
		return match ? match[0].toLowerCase() : null;
	}

	if (app.project.file != null) {
		var fileName = app.project.file.name;
		var baseName = fileName.replace(/\.[^\.]+$/, '');
		var takeCode = extractTakeCode(baseName);
		if (takeCode) {
			takeInput.text = takeCode;
		} else {
			takeInput.text = '--';
		}
	} else {
		takeInput.text = '--';
	}
}
