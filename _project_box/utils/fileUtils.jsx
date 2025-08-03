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
