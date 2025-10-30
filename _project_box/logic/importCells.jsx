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

	// Check if latest data already imported
	if (isLatestDataAlreadyImported(baseName)) {
		Alerts.alertLatestCellImported(baseName);
		app.endUndoGroup();
		return;
	}

	importCellAssets(episodeFolder, baseName, cut);
	applyCellFXAndInsert();

	app.endUndoGroup();
}

// ────────────────────────────────────────────────
// Helper: Check if latest data already imported
// ────────────────────────────────────────────────
function isLatestDataAlreadyImported(baseName) {
	var bin2D = findOrCreateBin('2D');
	var binPaint = findOrCreateBin('paint', bin2D);
	var binData = findOrCreateBin('_data', binPaint);

	baseName = baseName.toLowerCase();

	for (var i = 1; i <= binData.numItems; i++) {
		var item = binData.item(i);
		if (item instanceof FootageItem && item.file instanceof File) {
			if (item.file.fsName.toLowerCase().indexOf(baseName) !== -1) return true;
		}
	}

	return false;
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

// ────────────────────────────────────────────────
// Apply cellFX_maker logic automatically
// ────────────────────────────────────────────────
function applyCellFXAndInsert() {
	var createdFXComps = [];

	// 1. Collect all FootageItems in "paint/_data"
	var bin2D = findOrCreateBin('2D');
	var binPaint = findOrCreateBin('paint', bin2D);
	var binData = findOrCreateBin('_data', binPaint);

	for (var i = 1; i <= binData.numItems; i++) {
		var item = binData.item(i);
		if (!(item instanceof FootageItem)) continue;

		var itemName = removeSequenceNumber(item.name);

		// Skip if comp already exists
		if (getComp(itemName) || getComp(itemName + '_cellFX')) continue;

		// Create cell comp
		var cellComp = app.project.items.addComp(
			itemName,
			item.width,
			item.height,
			1,
			item.duration,
			1 / item.frameDuration
		);
		cellComp.layers.add(item);
		cellComp.parentFolder = getFolder('cell');

		// Create cellFX comp
		var cellFXComp = app.project.items.addComp(
			itemName + '_cellFX',
			item.width,
			item.height,
			1,
			item.duration,
			1 / item.frameDuration
		);
		var cellFXLayer = cellFXComp.layers.add(cellComp);
		cellFXComp.parentFolder = getFolder('cellFX');

		// Add Color Key (white)
		var colorKeyEffect = cellFXLayer.Effects.addProperty('ADBE Color Key');
		if (colorKeyEffect) {
			colorKeyEffect.property(1).setValue([1, 1, 1]);
		}

		// Try anti-aliasing plugins
		try {
			cellFXLayer.Effects.addProperty('PSOFT ANTI-ALIASING');
		} catch (e1) {
			try {
				cellFXLayer.Effects.addProperty('OLM Smoother');
			} catch (e2) {}
		}

		createdFXComps.push(cellFXComp);
	}

	// 2. Custom sort created FX comps
	createdFXComps.sort(customSortCellFX);

	// 3. Find all comps starting with "work"
	var workComps = [];
	for (var j = 1; j <= app.project.numItems; j++) {
		var it = app.project.item(j);
		if (it instanceof CompItem && /^_work/i.test(it.name)) {
			workComps.push(it);
		}
	}

	// 4. Insert sorted cellFX comps into each work comp
	for (var k = 0; k < workComps.length; k++) {
		var wComp = workComps[k];

		// Add in reverse so stacking order matches sorted order
		for (var m = createdFXComps.length - 1; m >= 0; m--) {
			wComp.layers.add(createdFXComps[m]);
		}
	}
}

// ────────────────────────────────────────────────
// Sorting logic for cellFX comps
// ────────────────────────────────────────────────
// ────────────────────────────────────────────────
// Sorting logic for cellFX comps
// ────────────────────────────────────────────────
function customSortCellFX(a, b) {
	function normalize(name) {
		name = name.replace(/_cellFX$/i, '');

		// Match suffix only if there's an underscore + word after base
		var suffixMatch = name.match(/_(\w+)$/i);
		var suffix = suffixMatch ? suffixMatch[1].toLowerCase() : null;

		var type = 'base';
		if (suffix) {
			if (suffix === 'ue') type = 'ue';
			else if (suffix === 'sita' || suffix === 'shita') type = 'sita';
			else type = 'other';
		}

		// Remove the suffix if found to get base
		var base = suffix ? name.replace(/_\w+$/i, '') : name;

		return { base: base, type: type, suffix: suffix, raw: name };
	}

	var na = normalize(a.name);
	var nb = normalize(b.name);

	// Step 1: reverse alphabetical by base
	if (na.base < nb.base) return 1;
	if (na.base > nb.base) return -1;

	// Step 2: type priority ue → other → base → sita
	var order = { ue: 0, other: 1, base: 2, sita: 3 };
	if (order[na.type] !== order[nb.type]) {
		return order[na.type] - order[nb.type];
	}

	// Step 3: if both are "other", reverse alphabetical by suffix
	if (na.type === 'other' && nb.type === 'other') {
		if (na.suffix < nb.suffix) return 1;
		if (na.suffix > nb.suffix) return -1;
	}

	return 0;
}

function removeSequenceNumber(name) {
	// Remove optional underscore + brackets with 3-4 digits or range,
	// or underscore + digits at end,
	// or digits at end (3-4 digits)
	return name.replace(
		/(\_?\[\d{3,4}([~-]\d{3,4})?\](\.\w+)?|\_\d{3,4}(\.\w+)?$|\d{3,4}$)/,
		''
	);
}

function getComp(theName) {
	for (var i = 1; i <= app.project.numItems; i++) {
		if (
			app.project.item(i).name == theName &&
			app.project.item(i) instanceof CompItem
		) {
			return app.project.item(i);
		}
	}
	return null;
}
