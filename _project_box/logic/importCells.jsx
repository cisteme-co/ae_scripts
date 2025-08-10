// ────────────────────────────────────────────────
// Import Cells Script with Alerts and Folder Setup
// ────────────────────────────────────────────────

function importCells() {
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
	var baseName = [project, episode, cut].join('_').toLowerCase();

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
	// Begin undo group
	// ──────────────
	app.beginUndoGroup('Import Cell');

	importCellAssets(episodeFolder, baseName, cut);

	app.endUndoGroup();
}

// ────────────────────────────────────────────────
// Import cell assets inside episode folder
// ────────────────────────────────────────────────
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
		Alerts.alertNoCellFolderFound(baseName);
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

// ────────────────────────────────────────────────
// Import single images as individual footage
// ────────────────────────────────────────────────
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
			Alerts.alertFailedToImportFile(files[i].name, err.toString());
		}
	}
}

// ────────────────────────────────────────────────
// Import image sequences as footage sequence
// ────────────────────────────────────────────────
function importImageSequence(folder, targetBin) {
	var files = folder.getFiles(function (f) {
		return (
			f instanceof File && /\.(png|jpe?g|tiff?|bmp|psd|tga)$/i.test(f.name)
		);
	});

	if (files.length === 0) {
		Alerts.alertNoSequenceFound(folder.name);
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
		Alerts.alertFailedToImportSequence(folder.name, err.toString());
	}
}

// ────────────────────────────────────────────────
// Helper: Find or create a bin (FolderItem) by name
// ────────────────────────────────────────────────
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

// ────────────────────────────────────────────────
// Setup bins hierarchy for imports
// ────────────────────────────────────────────────
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
