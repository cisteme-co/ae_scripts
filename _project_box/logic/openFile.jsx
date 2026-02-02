function openFile(projects, episodes, cutInput, takeInput, mode) {
	// ───────────────────────────────────────────────
	// 0. INITIAL SETUP & VALIDATION
	// ───────────────────────────────────────────────
	mode = mode || 'compositing';
	var projectsList = getProjects();
	var projectObj = projectsList[projects.selection.index];
	var projectFolder = projectObj.folder;
	var projectWorkFolder = projectFolder.path + '/' + projectFolder.name;
	var production = projectWorkFolder + '/production/' + mode + '/';
	var episode = episodes.selection.text;
	var subFolder = mode === 'lighting' ? 'progress' : 'cuts';
	var cutsPath = production + '/' + episode + '/' + subFolder + '/';
	var cut = cutInput.text;

	var cutsFolder = new Folder(cutsPath);
	if (!cutsFolder.exists) {
		Alerts.alertCutsFolderMissing(cutsPath);
		return;
	}

	// ───────────────────────────────────────────────
	// 1. FIND MATCHING CUT FOLDERS
	// ───────────────────────────────────────────────
	var cutsFolders = cutsFolder.getFiles(function (f) {
		return f instanceof Folder;
	});

	var matchingFolders = [];
	for (var i = 0; i < cutsFolders.length; i++) {
		var folderName = cutsFolders[i].name.toLowerCase();
		var cutSearch = cutInput.text.toLowerCase();

		// Check if cutSearch is a substring of folderName
		if (folderName.indexOf(cutSearch) !== -1) {
			matchingFolders.push(cutsFolders[i]);
		}
	}

	if (matchingFolders.length === 0) {
		Alerts.alertNoCutFolderFound(cut);
		return;
	}

	// ───────────────────────────────────────────────
	// 2. HANDLE MULTIPLE MATCHING FOLDERS (USER SELECTION)
	// ───────────────────────────────────────────────
	var selectedFolder;
	if (matchingFolders.length === 1) {
		selectedFolder = matchingFolders[0];
	} else {
		// Build selection dialog
		var dialog = new Window('dialog', 'Select Cut Folder');
		dialog.orientation = 'column';
		dialog.alignChildren = ['fill', 'top'];

		var dropdown = dialog.add('dropdownlist', undefined, []);
		for (var k = 0; k < matchingFolders.length; k++) {
			dropdown.add('item', matchingFolders[k].name);
		}
		dropdown.selection = 0;

		var buttons = dialog.add('group');
		buttons.alignment = 'center';
		var okBtn = buttons.add('button', undefined, 'OK');
		var cancelBtn = buttons.add('button', undefined, 'Cancel');

		okBtn.onClick = function () {
			selectedFolder = matchingFolders[dropdown.selection.index];
			dialog.close();
		};

		cancelBtn.onClick = function () {
			selectedFolder = null;
			dialog.close();
		};

		dialog.show();

		if (!selectedFolder) {
			// User cancelled selection
			return;
		}
	}

	// ───────────────────────────────────────────────
	// 3. FIND AEP FILES AND PICK BEST TAKE
	// ───────────────────────────────────────────────
	var cutFiles = selectedFolder.getFiles(function (f) {
		return f instanceof File && f.name.match(/\.aepx?$/i);
	});

	if (cutFiles.length === 0) {
		Alerts.alertNoAEPFiles(selectedFolder.name);
		return;
	}

	// Rank files by take suffix priority and version number
	function getTakeRank(fileName) {
		var base = fileName.toLowerCase();
		var patterns = [
			{ regex: /_v(\d+)\.aepx?$/, rank: 100 },
			{ regex: /_v0\.aepx?$/, rank: 90 },
			{ regex: /_t(\d+)\.aepx?$/, rank: 80 },
			{ regex: /_3d_t(\d+)\.aepx?$/, rank: 70 },
			{ regex: /_g(\d+)\.aepx?$/, rank: 60 },
			{ regex: /_c(\d+)\.aepx?$/, rank: 50 },
		];

		for (var i = 0; i < patterns.length; i++) {
			var match = base.match(patterns[i].regex);
			if (match) {
				var version = parseInt(match[1], 10);
				if (isNaN(version)) version = 0;
				return patterns[i].rank + version;
			}
		}
		return 0; // fallback rank for no match
	}

	var bestFile = cutFiles[0];
	var bestRank = getTakeRank(bestFile.name);
	for (var m = 1; m < cutFiles.length; m++) {
		var rank = getTakeRank(cutFiles[m].name);
		if (rank > bestRank) {
			bestRank = rank;
			bestFile = cutFiles[m];
		}
	}

	// ───────────────────────────────────────────────
	// 4. OPEN BEST FILE IF NOT ALREADY OPEN
	// ───────────────────────────────────────────────
	if (bestFile) {
		if (
			app.project.file &&
			decodeURI(app.project.file.fsName) === decodeURI(bestFile.fsName)
		) {
			Alerts.alertAlreadyOpen(cutInput.text);
			return;
		}

		app.project.close(CloseOptions.PROMPT_TO_SAVE_CHANGES);
		app.open(bestFile);

		// Update takeInput UI element with detected take suffix or fallback
		if (takeInput) {
			var fileNameSplit = bestFile.name.split('_');
			var lastPart = fileNameSplit[fileNameSplit.length - 1].split('.')[0];
			takeInput.text = lastPart.toLowerCase();
		}
	} else {
		Alerts.alertCouldNotDetermineBestFile();
	}
}
