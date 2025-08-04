function readDropboxJSON(file) {
	if (file.exists == true) {
		var currentLine;
		var jsonStuff = [];
		file.open('r');
		while (!file.eof) {
			currentLine = file.readln();
			jsonStuff.push(currentLine);
		}
		file.close();
		jsonStuff = jsonStuff.join('');
		var parsedJson = JSON.parse(jsonStuff);
		return parsedJson.business.path;
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

function getProjects() {
	var workFolders = Folder(getWorkFolder()).getFiles();
	var projects = [];

	for (var i = 0; i < workFolders.length; i++) {
		var folder = workFolders[i];
		if (folder.name[0] != '_') {
			if (
				Folder(folder.path + '/' + folder.name + '/production/compositing/')
					.exists
			) {
				projects.push(folder);
			}
		}
	}
	return projects;
}

function getEpisodes(index) {
	var projectsFolders = getProjects();
	var episodes = [];

	for (var i = 0; i < projectsFolders.length; i++) {
		var path =
			projectsFolders[i].path +
			'/' +
			projectsFolders[i].name +
			'/production/compositing/';
		var projectEpisodes = Folder(path).getFiles();
		if (i == index) {
			for (var e = 0; e < projectEpisodes.length; e++) {
				episodes.push(projectEpisodes[e]);
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
