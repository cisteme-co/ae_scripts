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
	// Remove extension if present
	var name = filename.replace(/\.[^\.]+$/, '');

	// 1. Look for standard take patterns (v1, t1, c1, g1, etc.)
	// We want the last one if multiple exist (e.g., _v01_t02 -> t02)
	var patterns = [
		/_v(\d+)$/i,
		/_t(\d+)$/i,
		/_3d_t(\d+)$/i,
		/_g(\d+)$/i,
		/_c(\d+)$/i,
		/([vctg]\d+)$/i, // fallback for no underscore
	];

	for (var i = 0; i < patterns.length; i++) {
		var match = name.match(patterns[i]);
		if (match) {
			// Return the full match (e.g., v01) but without the leading underscore if it was matched
			var code = match[0].replace(/^_/, '');
			// Special case for _3d_t01 -> we want t01 if that was the intent, 
			// but usually the regexes above are ordered by priority.
			if (code.indexOf('3d_') === 0) code = code.replace('3d_', '');
			return code.toLowerCase();
		}
	}

	// 2. Fallback to the last segment if it looks like a take code
	var parts = name.split('_');
	if (parts.length > 0) {
		var lastPart = parts[parts.length - 1];
		if (lastPart.match(/^[vctg]\d+$/i)) {
			return lastPart.toLowerCase();
		}
	}

	return null;
}

/**
 * Parses a filename into project, episode, cut, and take components.
 * Expected format: PROJECT_EPISODE_CUT[_EXTRA_...][_TAKE].aep
 * Handles complex cut names like:
 * - 001-3D -> 001
 * - 112-124 -> 112-124
 */
function parseFilename(fileName) {
	if (!fileName) return null;

	var baseName = fileName.replace(/\.[^\.]+$/, '');
	var parts = baseName.split('_');

	if (parts.length < 3) return null;

	var project = parts[0];
	var episode = parts[1];
	var rawCut = parts[2];
	var take = extractTakeCode(baseName);

	// Refine cut name based on requirements:
	// ws_01_001_t1.aep => 001
	// ws_01_112-124_t1.aep => 112-124
	// ws_01_001-3D_t01.aep => 001
	var cut = rawCut;
	if (rawCut.indexOf('-3D') !== -1) {
		cut = rawCut.replace(/-3D/gi, '');
	}

	return {
		project: project,
		episode: episode,
		cut: cut,
		rawCut: rawCut,
		take: take,
		base: [project, episode, cut].join('_').toLowerCase(),
		fullBase: baseName,
	};
}
