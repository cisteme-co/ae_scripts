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

function copyFolderContents(srcFolder, destFolder) {
	if (!destFolder.exists) destFolder.create();
	var filesAndFolders = srcFolder.getFiles();
	for (var i = 0; i < filesAndFolders.length; i++) {
		var f = filesAndFolders[i];
		if (f instanceof File) {
			var targetFile = new File(destFolder.fsName + '/' + f.name);
			if (!targetFile.exists) {
				f.copy(targetFile);
			}
		} else if (f instanceof Folder) {
			var newDestSubFolder = new Folder(destFolder.fsName + '/' + f.name);
			copyFolderContents(f, newDestSubFolder);
		}
	}
}

// Utility: get file extension lowercase
function getFileExtension(fileName) {
	var match = fileName.match(/\.([^.]+)$/);
	return match ? match[1].toLowerCase() : '';
}

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

function getWorkFolder() {
	var appdataFolder = Folder('~/./AppData/Local/').path;
	var dropboxFolder = appdataFolder + '/local/Dropbox/';
	var infoFile = File(dropboxFolder + 'info.json');

	if (infoFile.exists) {
		var dropboxPath = readDropboxJSON(infoFile);
		var workFolder = dropboxPath + '/work/';
		return workFolder;
	} else {
		var appdataFolder = Folder('~/../AppData/Local/').path;
		var dropboxFolder = appdataFolder + '/local/Dropbox/';
		var infoFile = File(dropboxFolder + 'info.json');

		if (infoFile.exists) {
			var dropboxPath = readDropboxJSON(infoFile);
			var workFolder = dropboxPath + '/work/';
			return workFolder;
		} else {
			var workFolder = '~/OneDrive/work/';

			if (Folder(workFolder).exists) {
				return workFolder;
			} else {
				return 'D:/OneDrive/work/';
			}
		}
	}
}

function getProjectCodeName(projectFolder) {
	var infoFile = new File(projectFolder.path + '/' + projectFolder.name + '/info.json');
	if (infoFile.exists) {
		infoFile.open('r');
		var content = infoFile.read();
		infoFile.close();
		try {
			var info = JSON.parse(content);
			if (info && info.codeName) {
				return info.codeName;
			}
		} catch (e) {
			// Fallback if JSON is invalid
		}
	}
	// Fallback: extract first part of folder name or default to 'ws'
	return 'ws';
}

function getProjects() {
	var workFolders = Folder(getWorkFolder()).getFiles();
	var projects = [];

	for (var i = 0; i < workFolders.length; i++) {
		var folder = workFolders[i];
		if (folder.name[0] != '_') {
			var compPath =
				folder.path + '/' + folder.name + '/production/compositing/';
			var lightPath =
				folder.path + '/' + folder.name + '/production/lighting/';

			if (Folder(compPath).exists) {
				projects.push({
					name: folder.name,
					folder: folder,
					mode: 'compositing',
				});
			} else if (Folder(lightPath).exists) {
				projects.push({
					name: folder.name,
					folder: folder,
					mode: 'lighting',
				});
			}
		}
	}
	return projects;
}

function getEpisodes(index) {
	var projectsFolders = getProjects();
	var episodes = [];

	if (index >= 0 && index < projectsFolders.length) {
		var projectObj = projectsFolders[index];
		var path =
			projectObj.folder.path +
			'/' +
			projectObj.folder.name +
			'/production/' +
			projectObj.mode +
			'/';

		if (Folder(path).exists) {
			var projectEpisodes = Folder(path).getFiles();
			for (var e = 0; e < projectEpisodes.length; e++) {
				if (
					projectEpisodes[e] instanceof Folder &&
					projectEpisodes[e].name[0] !== '_'
				) {
					episodes.push(projectEpisodes[e]);
				}
			}
		}
	}
	return episodes;
}

function extractTakeCode(filename) {
	var regex = /(c\d+|g\d+|3d_t\d+|t\d+|v0|v\d+)$/i;
	var match = filename.match(regex);
	return match ? match[0].toLowerCase() : null;
}
