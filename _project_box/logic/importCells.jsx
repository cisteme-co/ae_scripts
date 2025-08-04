function importCells() {
	if (!app.project.file) {
		alert('Please save your project file first.');
		return;
	}

	var fileName = app.project.file.name;
	var fileNameSplit = fileName.split('_');
	if (fileNameSplit.length < 3) {
		alert('Unexpected filename format: ' + fileName);
		return;
	}

	var project = fileNameSplit[0];
	var episode = fileNameSplit[1];
	var cut = fileNameSplit[2];
	var baseName = [project, episode, cut].join('_').toLowerCase();

	var projectFolder = getNthParentFolder(app.project.file.parent, 5);
	if (!projectFolder) {
		alert('Could not find project folder 5 levels up.');
		return;
	}

	var paintFolder = new Folder(projectFolder.fsName + '/assets/paint/');
	if (!paintFolder.exists) {
		alert('Background folder does not exist:\n' + paintFolder.fsName);
		return;
	}

	// Find episode folder (e.g. orb01)
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
		alert('Episode folder not found: ' + targetName);
		return;
	}

	app.beginUndoGroup('Import Cell');

	importCellAssets(episodeFolder, baseName, cut);

	app.endUndoGroup();
}

function importCellAssets(folder, baseName, cut) {
	var bins = setupBins();

	var files = folder.getFiles();
	var foundCell = null;

	for (var i = files.length - 1; i >= 0; i--) {
		var f = files[i];
		if (f instanceof Folder && f.name.toLowerCase().indexOf(baseName) !== -1) {
			foundCell = f;
			break;
		}
	}

	if (!foundCell) {
		alert('No cell folder found for: ' + baseName);
		return;
	}

	var subFolders = foundCell.getFiles(function (f) {
		return f instanceof Folder;
	});

	for (var j = 0; j < subFolders.length; j++) {
		var sub = subFolders[j];
		var name = sub.name.toLowerCase();

		if (name === '_lo') {
			importImagesIndividually(sub, bins.binLo);
		} else if (/^[a-z](?:_[a-z0-9]+)?$/i.test(name)) {
			importImageSequence(sub, bins.binData);
		}
	}
}

function importImagesIndividually(folder, targetBin) {
	var files = folder.getFiles(function (f) {
		return (
			f instanceof File && /\.(png|jpe?g|tiff?|bmp|psd|tga)$/i.test(f.name)
		);
	});

	if (files.length === 0) return;

	for (var i = 0; i < files.length; i++) {
		try {
			var importOpts = new ImportOptions(files[i]);
			importOpts.importAs = ImportAsType.FOOTAGE;
			var footage = app.project.importFile(importOpts);

			// Move to target bin
			if (footage) {
				footage.parentFolder = targetBin;
			}
		} catch (err) {
			alert('Failed to import: ' + files[i].name + '\n' + err.toString());
		}
	}
}

function importImageSequence(folder, targetBin) {
	var files = folder.getFiles(function (f) {
		return (
			f instanceof File && /\.(png|jpe?g|tiff?|bmp|psd|tga)$/i.test(f.name)
		);
	});

	if (files.length === 0) {
		alert('No sequence found in ' + folder.name);
		return;
	}

	files.sort(function (a, b) {
		return a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1;
	});

	try {
		var importOpts = new ImportOptions(files[0]);
		if (importOpts.canImportAs(ImportAsType.FOOTAGE)) {
			importOpts.importAs = ImportAsType.FOOTAGE;
			importOpts.sequence = true;
		}

		var footage = app.project.importFile(importOpts);

		if (footage) {
			footage.parentFolder = targetBin;
		}
	} catch (err) {
		alert(
			'Failed to import sequence in ' + folder.name + '\n' + err.toString()
		);
	}
}

// Helper: Find or create a bin (FolderItem) by name at root level or inside a parent bin
function findOrCreateBin(binName, parentBin) {
	parentBin = parentBin || app.project.rootFolder;

	for (var i = 1; i <= parentBin.numItems; i++) {
		var item = parentBin.item(i);
		if (item instanceof FolderItem && item.name === binName) {
			return item;
		}
	}

	// Create bin if not found
	return parentBin.items.addFolder(binName);
}

// Call this at the start of importCellAssets to setup bins
function setupBins() {
	var bin2D = findOrCreateBin('2D');
	var binLo = findOrCreateBin('_lo', bin2D);
	var binPaint = findOrCreateBin('paint', bin2D);
	var binData = findOrCreateBin('_data', binPaint);

	return {
		bin2D: bin2D,
		binLo: binLo,
		binPaint: binPaint,
		binData: binData,
	};
}
