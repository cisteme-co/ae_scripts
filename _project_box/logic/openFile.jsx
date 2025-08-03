function openFile(projects, episodes, cutInput, takeInput) {
	var projectFolder = getProjects()[projects.selection.index];
	var projectWorkFolder = projectFolder.path + '/' + projectFolder.name;
	var production = projectWorkFolder + '/production/compositing/';
	var episode = episodes.selection.text;
	var cuts = production + '/' + episode + '/cuts/';
	var cut = cutInput.text;

	var cutsFolder = new Folder(cuts);
	if (!cutsFolder.exists) {
		alert('Cuts folder does not exist: ' + cuts);
		return;
	}

	var cutsFolders = cutsFolder.getFiles(function (f) {
		return f instanceof Folder;
	});

	var matchingFolders = [];
	for (var i = 0; i < cutsFolders.length; i++) {
		var folderName = cutsFolders[i].name;
		var segments = folderName.split('-');
		for (var j = 0; j < segments.length; j++) {
			if (segments[j] === cut) {
				matchingFolders.push(cutsFolders[i]);
				break;
			}
		}
	}

	if (matchingFolders.length === 0) {
		alert('No folder found for cut ' + cut);
		return;
	}

	var selectedFolder;
	if (matchingFolders.length === 1) {
		selectedFolder = matchingFolders[0];
	} else {
		// Let user choose from multiple folders
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
			return; // user canceled
		}
	}

	// Now open file based on latest take version
	var cutFiles = selectedFolder.getFiles(function (f) {
		return f instanceof File && f.name.match(/\.aepx?$/i);
	});

	if (cutFiles.length === 0) {
		alert('No AEP files found in folder: ' + selectedFolder.name);
		return;
	}

	// Ranking take suffixes
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
		return 0; // fallback if no pattern matched
	}

	// Find file with highest take rank
	var bestFile = cutFiles[0];
	var bestRank = getTakeRank(bestFile.name);

	for (var m = 1; m < cutFiles.length; m++) {
		var rank = getTakeRank(cutFiles[m].name);
		if (rank > bestRank) {
			bestRank = rank;
			bestFile = cutFiles[m];
		}
	}

	if (bestFile) {
		if (
			app.project.file &&
			decodeURI(app.project.file.fsName) === decodeURI(bestFile.fsName)
		) {
			alert(
				'The most recent take for c.' + cutInput.text + ' is already open.'
			);
			return;
		}
		app.project.close(CloseOptions.PROMPT_TO_SAVE_CHANGES);
		app.open(bestFile);

		if (takeInput) {
			var fileName = bestFile.name.replace(/\.[^\.]+$/, '');
			var regex = /(c\d+|g\d+|3d_t\d+|t\d+|v0|v\d+)$/i;
			var match = fileName.match(regex);
			if (match) {
				takeInput.text = match[0].toLowerCase();
			} else {
				takeInput.text = '--';
			}
		}
	} else {
		alert('Could not determine the best file to open.');
	}
}
