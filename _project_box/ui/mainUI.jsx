function buildUI(thisObj) {
	// ──────────────
	// Projects Box UI builder
	// ──────────────

	// Determine the root folder path relative to this script
	var rootFolder = File($.fileName).parent.parent.path;
	// Path to icon assets used in the UI buttons
	var iconsPath = rootFolder + '/_project_box/assets/icons/';
	// Settings section name to store user preferences
	var section = 'ProjectsBoxPrefs';

	// Keys used for storing last selected project, episode, and cut in settings
	var keys = {
		project: 'lastProjectIndex',
		episode: 'lastEpisodeIndex',
		cut: 'lastCutValue',
	};

	// Supported framerates for reference
	var framerates = [8, 12, 15, 23.976, 24, 29.97, 30];
	// Human-readable take names (in Japanese) mapped to take codes
	function getLocalizedTakes() {
		var locale = $.locale || 'en';
		var lang = locale.substring(0, 2); // e.g., "ja" or "en"

		var takesByLang = {
			ja: [
				'コンテ撮 (c)', // Storyboard take
				'原撮 (g)', // Original shooting
				'3DCG撮 (3d_t)', // 3D CG take
				'タイミング撮 (t)', // Timing take
				'仮本撮 (v0)', // Temporary final take
				'本撮 (v)', // Final take
			],
			en: [
				'Storyboard (c)',
				'Linetest (g)',
				'3D CG (3d_t)',
				'Timing (t)',
				'Temporary (v0)',
				'Final (v)',
			],
			fr: [
				'Storyboard (c)',
				'Linetest (g)',
				'3D CG (3d_t)',
				'Timing (t)',
				'Temporaire (v0)',
				'Final (v)',
			],
			// Add other languages if needed
		};

		return takesByLang[lang] || takesByLang['en'];
	}

	var takes = getLocalizedTakes();
	// Corresponding internal take codes for logic
	var takesCodes = ['c1', 'g1', '3D_t1', 't1', 'v0', 'v1'];

	// Create the main UI panel, or reuse if inside a Panel context
	var panel =
		thisObj instanceof Panel
			? thisObj
			: new Window('palette', 'Projects Box', undefined, { resizeable: true });
	panel.spacing = 4;

	// ───── First Row: Project, Episode dropdowns and Cut input ─────
	var firstRow = panel.add('group');
	firstRow.orientation = 'row';
	firstRow.spacing = 5;

	// Dropdown to select Project
	var projectsDrop = firstRow.add('dropdownlist', undefined, []);
	projectsDrop.preferredSize.width = 100;

	// Dropdown to select Episode within the selected project
	var episodeDrop = firstRow.add('dropdownlist', undefined, []);

	// Input box to enter Cut number (3-digit zero padded)
	var cutInput = firstRow.add('edittext', undefined, '000');
	cutInput.characters = 3;

	// Load saved indices and cut value from settings, with fallbacks
	var savedProject = app.settings.haveSetting(section, keys.project)
		? parseInt(app.settings.getSetting(section, keys.project), 10)
		: 0;
	var savedEpisode = app.settings.haveSetting(section, keys.episode)
		? parseInt(app.settings.getSetting(section, keys.episode), 10)
		: 0;
	var savedCut = app.settings.haveSetting(section, keys.cut)
		? app.settings.getSetting(section, keys.cut)
		: '000';

	// Set the cut input text to the saved value
	cutInput.text = savedCut;

	// ───── Buttons Group: various action buttons ─────
	var buttonGroup = firstRow.add('group');
	buttonGroup.orientation = 'row';
	buttonGroup.spacing = 0;

	// Button to create a new cut
	var newCut = buttonGroup.add(
		'iconbutton',
		undefined,
		File(iconsPath + 'file-plus-2.png'),
		{ style: 'toolbutton' }
	);

	// Button to open the most recent version of the selected cut
	var lastVersion = buttonGroup.add(
		'iconbutton',
		undefined,
		File(iconsPath + 'external-link.png'),
		{ style: 'toolbutton' }
	);
	lastVersion.onClick = function () {
		openFile(projectsDrop, episodeDrop, cutInput, takeInput);
	};

	// Button to import animation cells
	var importCellsBtn = buttonGroup.add(
		'iconbutton',
		undefined,
		File(iconsPath + 'folder-down.png'),
		{ style: 'toolbutton' }
	);

	// Button to import background images
	var importBGBtm = buttonGroup.add(
		'iconbutton',
		undefined,
		File(iconsPath + 'image-down.png'),
		{ style: 'toolbutton' }
	);

	// Button to open timesheet-related tools
	var timesheetBtn = buttonGroup.add(
		'iconbutton',
		undefined,
		File(iconsPath + 'list-ordered.png'),
		{ style: 'toolbutton' }
	);
	timesheetBtn.onClick = function () {
		// Temporary folder to copy EXE utilities for timesheet
		var tmpDir = Folder('C:/tmp/adobe');
		if (!tmpDir.exists) {
			tmpDir.create();
		}

		// List of executable files required
		var exeFiles = ['AE_RemapCall.exe', 'AE_RemapExceed.exe'];

		// Copy EXE files if not already present
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

		// Run the timesheet JSX script
		var timesheet = File(rootFolder + '/_project_box/ui/timesheet.jsx');
		try {
			$.evalFile(timesheet);
		} catch (e) {
			alert(e.toString());
		}
	};

	// Button to launch the retimer tool
	var retimer = buttonGroup.add(
		'iconbutton',
		undefined,
		File(iconsPath + 'timer-reset.png'),
		{ style: 'toolbutton' }
	);
	retimer.onClick = function () {
		var retimerFile = File(rootFolder + '/_project_box/logic/retimer.jsx');
		if (retimerFile.exists) {
			$.evalFile(retimerFile);
		} else {
			alert('retimer.jsx not found!');
		}
	};

	// Button to replace files in project
	var fileReplaceBtn = buttonGroup.add(
		'iconbutton',
		undefined,
		File(iconsPath + 'replace-all.png'),
		{ style: 'toolbutton' }
	);
	fileReplaceBtn.onClick = function () {
		fileReplace();
	};

	// Button to remove unused project items
	var removeUnusedBtn = buttonGroup.add(
		'iconbutton',
		undefined,
		File(iconsPath + 'trash-2.png'),
		{ style: 'toolbutton' }
	);
	removeUnusedBtn.onClick = function () {
		removeUnused();
	};

	// Button to open the project root folder
	var location = buttonGroup.add(
		'iconbutton',
		undefined,
		File(iconsPath + 'folder-root.png'),
		{ style: 'toolbutton' }
	);
	location.onClick = function () {
		openRootFolder();
	};

	// Button to start render queue
	var renderBtn = buttonGroup.add(
		'iconbutton',
		undefined,
		File(iconsPath + 'arrow-right-from-line.png'),
		{ style: 'toolbutton' }
	);

	// Button to collect files (e.g., for archiving)
	var collectBtn = buttonGroup.add(
		'iconbutton',
		undefined,
		File(iconsPath + 'combine.png'),
		{ style: 'toolbutton' }
	);
	collectBtn.onClick = function () {
		collectFiles();
	};

	// ───── Second Row: Worker name and Take controls ─────
	var secondRow = panel.add('group');
	secondRow.orientation = 'row';
	secondRow.spacing = 5;

	// Worker name input group
	var workerGroup = secondRow.add('group');
	workerGroup.spacing = 0;
	workerGroup.add('statictext', undefined, T('worker'));

	// Load or default worker name from environment or settings
	var workerKey = 'workerName';
	var defaultWorker = $.getenv('COMPUTERNAME') || T('worker');
	var savedWorker = app.settings.haveSetting(section, workerKey)
		? app.settings.getSetting(section, workerKey)
		: defaultWorker;

	// Editable worker name field
	var workerInput = workerGroup.add('edittext', undefined, savedWorker);
	workerInput.characters = 10;
	workerInput.onChange = function () {
		// Save and apply the worker name change
		app.settings.saveSetting(section, workerKey, workerInput.text);
		renameWorker(workerInput.text);
	};

	// Spacer panel for layout
	secondRow.add('panel', [100, 0, 103, 20]);

	// Take input and increment button group
	var takeGroup = secondRow.add('group');
	takeGroup.spacing = 0;

	// Editable take code input
	var takeInput = takeGroup.add('edittext', undefined, '--');
	takeInput.characters = 3;

	// Button to increment the take code
	var takeButton = takeGroup.add(
		'iconbutton',
		undefined,
		File(iconsPath + 'diamond-plus.png'),
		{ style: 'toolbutton' }
	);

	takeButton.onClick = function () {
		// Require project file saved before incrementing take
		if (!app.project.file) {
			alertPleaseSaveProject();
			return;
		}

		// Extract old take code from filename (e.g., t01)
		var fileName = app.project.file.name;
		var fileNameSplit = fileName.split('_');
		var oldTake = fileNameSplit[fileNameSplit.length - 1].split('.')[0];

		// Validate take code format and extract prefix and number parts
		var prefixMatch = oldTake.match(/[^\d]+/);
		var numberMatch = oldTake.match(/\d+/);

		if (!prefixMatch || !numberMatch) {
			alert('Invalid take format in filename.');
			return;
		}

		var prefix = prefixMatch[0];
		var number = parseInt(numberMatch[0], 10);

		// Increment take number
		var newNumber = number + 1;
		var newTake = prefix + newNumber;

		// Update the input and trigger any associated logic
		takeInput.text = newTake;
		incrementTake(newTake);
	};

	// Update take info on manual input change
	takeInput.onChange = function () {
		incrementTake(takeInput.text);
	};

	// Spacer panel for layout
	secondRow.add('panel', [100, 0, 103, 20]);

	// Retake input (text field)
	var retakeInput = secondRow.add('edittext', undefined, T('retake'));
	retakeInput.characters = 28;
	retakeInput.onChange = function () {
		retake(retakeInput.text);
	};

	// Assign button click handlers for import and render
	importCellsBtn.onClick = function () {
		importCells();
	};
	importBGBtm.onClick = function () {
		importBG();
	};
	renderBtn.onClick = function () {
		renderBG();
	};

	// Handler for creating a new cut
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

	// ───── Tooltip (help tips) for UI elements ─────
	newCut.helpTip = TT('newCut');
	lastVersion.helpTip = TT('lastVersion');
	importCellsBtn.helpTip = TT('importCells');
	importBGBtm.helpTip = TT('importBG');
	timesheetBtn.helpTip = TT('timesheet');
	retimer.helpTip = TT('retimer');
	fileReplaceBtn.helpTip = TT('fileReplace');
	removeUnusedBtn.helpTip = TT('removeUnused');
	location.helpTip = TT('location');
	renderBtn.helpTip = TT('render');
	takeInput.helpTip = TT('takeUp');
	takeButton.helpTip = TT('takeUp');
	workerInput.helpTip = TT('worker');
	retakeInput.helpTip = TT('retake');

	// Perform layout and resizing logic
	panel.layout.layout(true);
	panel.layout.resize();
	panel.onResizing = panel.onResize = function () {
		panel.layout.resize();
	};

	// Center and show window if applicable
	if (panel instanceof Window) {
		panel.center();
		panel.show();
	}

	// ───── Populate projects dropdown ─────
	var projects = getProjects();
	projectsDrop.removeAll();
	for (var i = 0; i < projects.length; i++) {
		projectsDrop.add('item', projects[i].name);
	}
	projectsDrop.selection = Math.min(savedProject, projects.length - 1);

	// ───── Populate episodes dropdown based on project selection ─────
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

		// Save selected episode index
		app.settings.saveSetting(
			section,
			keys.episode,
			episodeDrop.selection.index.toString()
		);
	}

	// Initial episodes update on UI build
	updateEpisodes(projectsDrop, episodeDrop);

	// Save project selection and update episodes on project dropdown change
	projectsDrop.onChange = function () {
		app.settings.saveSetting(
			section,
			keys.project,
			projectsDrop.selection.index.toString()
		);
		updateEpisodes(projectsDrop, episodeDrop);
	};

	// Save episode selection on change
	episodeDrop.onChange = function () {
		app.settings.saveSetting(
			section,
			keys.episode,
			episodeDrop.selection.index.toString()
		);
	};

	// Save cut input text on typing
	cutInput.onChanging = function () {
		app.settings.saveSetting(section, keys.cut, cutInput.text);
	};

	// ───── Helper function to extract take code from filename ─────
	function extractTakeCode(filename) {
		// Matches take codes like c1, g1, 3d_t1, t1, v0, v1 at the end of filename
		var regex = /(c\d+|g\d+|3d_t\d+|t\d+|v0|v\d+)$/i;
		var match = filename.match(regex);
		return match ? match[0].toLowerCase() : null;
	}

	// Initialize takeInput text from project file name's take code
	if (app.project.file != null) {
		var fileName = app.project.file.name;
		var baseName = fileName.replace(/\.[^\.]+$/, ''); // remove extension
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

// ──────────────
// Alert: Please save the project first (multi-language support)
// ──────────────
function alertPleaseSaveProject() {
	var lang = getLanguage();
	var msg = '';
	switch (lang) {
		case 'japanese':
		case 'ja':
			msg = 'プロジェクトを保存してください。';
			break;
		// Add other languages here if needed
		default:
			msg = 'Please save your project file first.';
	}
	alert(msg);
}
