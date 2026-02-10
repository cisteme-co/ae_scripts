(function () {
	var scriptFile = new File($.fileName);
	var rootFolder = scriptFile.parent;
	// Ensure we have an absolute path
	if (rootFolder.fsName === "" || rootFolder.fsName === ".") {
		// Try to get from active script if possible, but $.fileName is usually best
	}
	
	var alertsFile = new File(rootFolder.parent.fsName + '/utils/alerts.jsx');
	
	// Try alternative path if first one fails (e.g. if rootFolder is already the root)
	if (!alertsFile.exists) {
		alertsFile = new File(rootFolder.fsName + '/utils/alerts.jsx');
	}

	if (alertsFile.exists) {
		$.evalFile(alertsFile);
	}

	// Load fileUtils for parseFilename
	var projectBoxUtils = new File(rootFolder.parent.fsName + '/_project_box/utils/fileUtils.jsx');
	if (!projectBoxUtils.exists) {
		projectBoxUtils = new File(rootFolder.fsName + '/_project_box/utils/fileUtils.jsx');
	}
	if (projectBoxUtils.exists) {
		$.evalFile(projectBoxUtils);
	}

	// Final check/fallback for Alerts
	if (typeof Alerts === 'undefined') {
		Alerts = {
			alertSaveProjectFirst: function () { alert('Please save your project first.'); },
			alertUnexpectedFilename: function (n) { alert('Unexpected filename: ' + n); },
			alertCouldNotFindProjectFolder: function () { alert('Could not find project folder.'); },
			alertPaintFolderMissing: function (p) { alert('Paint folder missing at: ' + p); },
			alertEpisodeFolderNotFound: function (n) { alert('Episode folder not found: ' + n); },
			alertNoCutFolderFound: function (n) { alert('Cut folder not found: ' + n); }
		};
	} else {
		// Ensure alertNoCutFolderFound exists even if using external Alerts
		if (typeof Alerts.alertNoCutFolderFound === 'undefined' && typeof Alerts.alertCutFolderNotFound !== 'undefined') {
			Alerts.alertNoCutFolderFound = Alerts.alertCutFolderNotFound;
		} else if (typeof Alerts.alertNoCutFolderFound !== 'undefined' && typeof Alerts.alertCutFolderNotFound === 'undefined') {
			Alerts.alertCutFolderNotFound = Alerts.alertNoCutFolderFound;
		}
	}

	// ──────────────
	// Validate project saved
	// ──────────────
	if (!app.project.file) {
		Alerts.alertSaveProjectFirst();
		return;
	}

	// ──────────────
	// Validate filename format and extract info
	// ──────────────
	var fileName = app.project.file.name;
	var info = typeof parseFilename === 'function' ? parseFilename(fileName) : null;

	var project, episode, cut;
	if (info) {
		project = info.project;
		episode = info.episode;
		cut = info.cut;
	} else {
		// Fallback to old logic if fileUtils not loaded or failed
		var fileNameSplit = fileName.split('_');
		if (fileNameSplit.length < 3) {
			Alerts.alertUnexpectedFilename(fileName);
			return;
		}
		project = fileNameSplit[0];
		episode = fileNameSplit[1];
		cut = fileNameSplit[2];
	}

	// ──────────────
	// Locate project folder 5 levels up
	// ──────────────
	var projectFolder = getNthParentFolder(app.project.file.parent, 5);
	if (!projectFolder) {
		Alerts.alertCouldNotFindProjectFolder();
		return;
	}

	// ──────────────
	// Determine mode and locate paint/episode folder
	// ──────────────
	var isLighting = app.project.file.fsName.toLowerCase().indexOf('lighting') !== -1;
	var episodeFolder = null;

	// Both lighting and compositing paint folders are in <projectFolder>/assets/paint/
	var paintFolder = new Folder(projectFolder.fsName + '/assets/paint/');
	if (!paintFolder.exists) {
		Alerts.alertPaintFolderMissing(paintFolder.fsName);
		return;
	}

	// Find episode folder inside assets/paint (e.g. orb01)
	var targetName = (project + episode).toLowerCase();
	var episodeFolders = paintFolder.getFiles(function (f) {
		return f instanceof Folder;
	});

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
	var searchKey = cut.toLowerCase();

	var rawCutFolders = episodeFolder.getFiles(function (f) {
		if (!(f instanceof Folder)) return false;
		var folderName = f.name.toLowerCase();
		
		// Priority matching for searchKey (e.g. "001" or "112-124")
		// 1. Exact match (e.g. folder is "001")
		if (folderName === searchKey) return true;
		
		// 2. Distinct part match (e.g. "ws_06_001_k" or "001_v1")
		// Matches searchKey if it's not immediately preceded or followed by another digit.
		// This avoids matching "001" inside "0011".
		var escapedKey = searchKey.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
		var regex = new RegExp("(^|[^0-9])" + escapedKey + "([^0-9]|$)", "i");
		if (regex.test(folderName)) return true;

		return false;
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
		Alerts.alertNoCutFolderFound(searchKey);
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
