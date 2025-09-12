function readDropboxJSON(file) {
	if (file.exists === true) {
		var currentLine;
		var jsonStuff = [];
		file.open('r');
		while (!file.eof) {
			currentLine = file.readln();
			jsonStuff.push(currentLine);
		}
		file.close();

		jsonStuff = jsonStuff.join('');
		var parsedJson;

		try {
			parsedJson = JSON.parse(jsonStuff);
		} catch (e) {
			alert('Dropbox JSON is invalid: ' + e.message);
			return false;
		}

		if (parsedJson.business && parsedJson.business.path) {
			return parsedJson.business.path;
		} else if (parsedJson.personal && parsedJson.personal.path) {
			return parsedJson.personal.path;
		} else {
			alert("You don't have a Dropbox account linked in this JSON!");
			return false;
		}
	}
	return false;
}

function getDropboxInfoPaths() {
	var paths = [];
	if ($.os.toLowerCase().indexOf('windows') !== -1) {
		// Windows Dropbox info.json locations
		paths.push('~/AppData/Local/Dropbox/info.json');
		paths.push('~/AppData/Local/local/Dropbox/info.json');
		paths.push('~/../AppData/Local/Dropbox/info.json');
		paths.push('~/../AppData/Local/local/Dropbox/info.json');
	} else {
		// macOS Dropbox info.json location
		paths.push('~/Library/Application Support/Dropbox/info.json');
	}
	return paths;
}

function getDropboxPath() {
	var infoPaths = getDropboxInfoPaths();
	for (var i = 0; i < infoPaths.length; i++) {
		var infoFile = File(infoPaths[i]);
		var dropboxPath = readDropboxJSON(infoFile);
		if (dropboxPath) return dropboxPath;
	}
	return null;
}

function getWorkFolder() {
	var dropboxPath = getDropboxPath();
	if (dropboxPath) return dropboxPath + '/work/';

	var oneDriveFolder = '';
	if ($.os.toLowerCase().indexOf('windows') !== -1) {
		// Typical OneDrive path on Windows
		oneDriveFolder = Folder('~/OneDrive/work/').fsName;
		if (Folder(oneDriveFolder).exists) return oneDriveFolder;
		// Fallback drive letter path (adjust if needed)
		var driveLetterFallback = 'D:/OneDrive/work/';
		if (Folder(driveLetterFallback).exists) return driveLetterFallback;
	} else {
		// macOS OneDrive path (common default, may vary)
		oneDriveFolder = Folder('~/Library/CloudStorage/OneDrive/work/').fsName;
		if (Folder(oneDriveFolder).exists) return oneDriveFolder;
		// Another fallback (user home)
		oneDriveFolder = Folder('~/OneDrive/work/').fsName;
		if (Folder(oneDriveFolder).exists) return oneDriveFolder;
	}

	// Final fallback, just return ~/work/ in home
	return Folder('~/work/').fsName;
}

function getProjects() {
	var workFolder = getWorkFolder();
	var workFolders = Folder(workFolder).getFiles();
	var projects = [];

	for (var i = 0; i < workFolders.length; i++) {
		var folder = workFolders[i];
		if (folder instanceof Folder && folder.name[0] !== '_') {
			var compPath = folder.fsName + '/production/compositing/';
			if (Folder(compPath).exists) projects.push(folder);
		}
	}
	return projects;
}

function getPresets(projectFolder) {
	var presetsPath = Folder(
		projectFolder.fsName + '/assets/templates/compositing/_presets/'
	);

	if (!presetsPath.exists) return [];

	var files = [];
	var presetFiles = presetsPath.getFiles();
	for (var i = 0; i < presetFiles.length; i++) {
		if (presetFiles[i] instanceof File && /\.jsx$/i.test(presetFiles[i].name)) {
			files.push(presetFiles[i]);
		}
	}
	return files;
}
