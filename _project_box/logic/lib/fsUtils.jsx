//@target aftereffects

function getNthParentFolders(startFileOrFolder, n) {
	var folder =
		startFileOrFolder instanceof Folder
			? startFileOrFolder
			: startFileOrFolder.parent;
	for (var i = 0; i < n; i++) {
		if (folder && folder.parent != null) {
			folder = folder.parent;
		} else {
			break;
		}
	}
	return folder;
}

function sanitizeFilename(name) {
	if (!name) return 'unnamed';
	return name.replace(/[<>:"\/\\|?*]/g, '_');
}

// Returns the 8.3 short path for a file/folder on Windows to avoid Unicode issues in cmd.exe.
function getShortPath(fileOrFolder) {
	if ($.os.toLowerCase().indexOf('windows') < 0) return fileOrFolder.fsName;
	try {
		var cmd = 'cmd /c "for %I in ("' + fileOrFolder.fsName + '") do echo %~sI"';
		var shortPath = system
			.callSystem(cmd)
			.replace(/[\r\n]/g, '')
			.trim();
		if (shortPath && shortPath.length > 0 && shortPath.indexOf('?') === -1) {
			return shortPath;
		}
	} catch (e) {}
	return fileOrFolder.fsName;
}

function getTodayYYYYMMDD() {
	var today = new Date();
	var yyyy = today.getFullYear();
	var mm = ('0' + (today.getMonth() + 1)).slice(-2);
	var dd = ('0' + today.getDate()).slice(-2);
	return '' + yyyy + mm + dd;
}

function createFolderSafe(folderPath) {
	try {
		var folder =
			folderPath instanceof Folder ? folderPath : new Folder(folderPath);
		if (folder.exists) return true;
		if (folder.parent && !folder.parent.exists) {
			if (!createFolderSafe(folder.parent)) return false;
		}
		return folder.create();
	} catch (e) {
		$.writeln('Error creating folder ' + folderPath + ': ' + e.toString());
		return false;
	}
}
