(function () {
	var rootFolder = File($.fileName).parent;
	$.evalFile(new File(rootFolder.fsName + '/utils/alerts.jsx'));

	// ──────────────
	// Validate project saved
	// ──────────────
	if (!app.project.file) {
		Alerts.alertSaveProjectFirst();
		return;
	}

	// ──────────────
	// Validate filename format
	// ──────────────
	var fileName = app.project.file.name;
	var fileNameSplit = fileName.split('_');
	if (fileNameSplit.length < 3) {
		Alerts.alertUnexpectedFilename(fileName);
		return;
	}

	// ──────────────
	// Extract project info
	// ──────────────
	var project = fileNameSplit[0];
	var episode = fileNameSplit[1];
	var cut = fileNameSplit[2];

	// ──────────────
	// Locate project folder 5 levels up
	// ──────────────
	var projectFolder = getNthParentFolder(app.project.file.parent, 5);
	if (!projectFolder) {
		Alerts.alertCouldNotFindProjectFolder();
		return;
	}

	// ──────────────
	// Check for paint folder existence
	// ──────────────
	var paintFolder = new Folder(projectFolder.fsName + '/assets/paint/');
	if (!paintFolder.exists) {
		Alerts.alertPaintFolderMissing(paintFolder.fsName);
		return;
	}

	// ──────────────
	// Find episode folder (e.g. orb01)
	// ──────────────
	var targetName = (project + episode).toLowerCase();
	var episodeFolders = paintFolder.getFiles(function (f) {
		return f instanceof Folder;
	});

	var episodeFolder = null;
	for (var i = 0; i < episodeFolders.length; i++) {
		if (episodeFolders[i].name.toLowerCase() === targetName) {
			episodeFolder = episodeFolders[i];
			break;
		}
	}

	if (!episodeFolder) {
		Alerts.alertEpisodeFolderNotFound(targetName);
		return;
	}

	// ──────────────
	// Find cut folder(s) inside episode
	// ──────────────
	var cutName = cut.toLowerCase();

	var rawCutFolders = episodeFolder.getFiles(function (f) {
		return f instanceof Folder && f.name.toLowerCase().indexOf(cutName) !== -1;
	});

	// Convert to array
	var cutFolders = [];
	for (var i = 0; i < rawCutFolders.length; i++) {
		cutFolders.push(rawCutFolders[i]);
	}

	// ──────────────
	// Validate result
	// ──────────────
	if (cutFolders.length === 0) {
		Alerts.alertCutFolderNotFound(cutName);
		return;
	}

	// ──────────────
	// Sort in reverse alphabetical order and pick first
	// ──────────────
	cutFolders.sort(function (a, b) {
		var an = a.name.toLowerCase();
		var bn = b.name.toLowerCase();
		if (an < bn) return 1;
		if (an > bn) return -1;
		return 0;
	});

	var cutFolder = cutFolders[0];

	// ──────────────
	// Open the cut folder in File Explorer
	// ──────────────
	cutFolder.execute();
})();

function getNthParentFolder(startFolder, n) {
	var folder = startFolder;
	for (var i = 0; i < n; i++) {
		if (folder.parent) {
			folder = folder.parent;
		} else {
			break;
		}
	}
	return folder;
}
