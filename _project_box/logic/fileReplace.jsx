// ============================================================
// FILE REPLACE: AE ExtendScript version (non-blocking, reliable)
// ============================================================

function fileReplace() {
	// ────────────── 0. Validation ──────────────
	if (!app.project.file) {
		alert('⚠️ Please save the project before running this script.');
		return;
	}

	var fileName = app.project.file.name;
	var split = fileName.split('_');
	if (split.length < 3) {
		alert('⚠️ Unexpected filename format: ' + fileName);
		return;
	}

	var project = split[0];
	var episode = split[1];
	var cut = split[2];
	var baseName = [project, episode, cut].join('_').toLowerCase();

	// ────────────── 1. Locate project folder (5 levels up) ──────────────
	function getNthParentFolder(folder, n) {
		var f = folder;
		for (var i = 0; i < n; i++) {
			if (!f || !f.parent) return null;
			f = f.parent;
		}
		return f;
	}

	var projectFolder = getNthParentFolder(app.project.file.parent, 5);
	if (!projectFolder) {
		alert('⚠️ Could not find project folder.');
		return;
	}

	// ────────────── 2. Check paint folder ──────────────
	var paintFolder = new Folder(projectFolder.fsName + '/assets/paint/');
	if (!paintFolder.exists) {
		alert('⚠️ Missing paint folder: ' + paintFolder.fsName);
		return;
	}

	// ────────────── 3. Find episode folder ──────────────
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
		alert('⚠️ Episode folder not found: ' + targetName);
		return;
	}

	// ────────────── Begin Undo Group ──────────────
	app.beginUndoGroup('Replace Import Cell');

	if (isLatestDataAlreadyImported(baseName)) {
		alert('✅ Latest version already imported for: ' + baseName);
		app.endUndoGroup();
		return;
	}

	replaceCellAssets(episodeFolder, baseName, cut);

	app.endUndoGroup();
}

// ============================================================
// Helpers
// ============================================================

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

function replaceCellAssets(episodeFolder, baseName, cut) {
	var bins = setupBins();
	var binData = bins.binData;
	var binLo = bins.binLo;

	moveOldFootage(binData, baseName);
	moveOldFootage(binLo, baseName);

	importCellAssets(episodeFolder, baseName, cut);

	replaceFootageInComps();
}

// Move existing footage to _old bin
function moveOldFootage(bin, baseName) {
	var existing = [];
	for (var i = 1; i <= bin.numItems; i++) {
		var item = bin.item(i);
		if (item instanceof FootageItem && item.file instanceof File) {
			if (item.file.fsName.toLowerCase().indexOf(baseName) !== -1)
				existing.push(item);
		}
	}
	if (existing.length > 0) {
		var oldBin = findOrCreateBin('_old', bin);
		for (var j = 0; j < existing.length; j++) existing[j].parentFolder = oldBin;
	}
}

// Import assets
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
		alert('⚠️ No cell folder found for: ' + baseName);
		return;
	}

	var subFolders = foundCell.getFiles(function (f) {
		return f instanceof Folder;
	});
	for (var j = 0; j < subFolders.length; j++) {
		var sub = subFolders[j];
		var name = sub.name.toLowerCase();
		if (name === '_lo') importImagesIndividually(sub, bins.binLo);
		else if (/^[a-z](?:_[a-z0-9]+)?$/i.test(name))
			importImageSequence(sub, bins.binData);
	}
}

// Individual images
function importImagesIndividually(folder, targetBin) {
	var files = folder.getFiles(function (f) {
		return (
			f instanceof File && /\.(png|jpe?g|tiff?|bmp|psd|tga)$/i.test(f.name)
		);
	});
	for (var i = 0; i < files.length; i++) {
		try {
			var opts = new ImportOptions(files[i]);
			opts.importAs = ImportAsType.FOOTAGE;
			var footage = app.project.importFile(opts);
			if (footage) footage.parentFolder = targetBin;
		} catch (err) {
			alert('⚠️ Failed to import: ' + files[i].name + ' - ' + err.toString());
		}
	}
}

// Image sequences
function importImageSequence(folder, targetBin) {
	var files = folder.getFiles(function (f) {
		return (
			f instanceof File && /\.(png|jpe?g|tiff?|bmp|psd|tga)$/i.test(f.name)
		);
	});
	if (files.length === 0) return;
	files.sort(function (a, b) {
		return a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1;
	});

	try {
		var opts = new ImportOptions(files[0]);
		if (opts.canImportAs(ImportAsType.FOOTAGE)) {
			opts.importAs = ImportAsType.FOOTAGE;
			opts.sequence = true;
		}
		var footage = app.project.importFile(opts);
		if (footage) footage.parentFolder = targetBin;
	} catch (err) {
		alert(
			'⚠️ Failed to import sequence: ' + folder.name + ' - ' + err.toString()
		);
	}
}

// ============================================================
// Bins
// ============================================================

function findOrCreateBin(name, parent) {
	parent = parent || app.project.rootFolder;
	for (var i = 1; i <= parent.numItems; i++) {
		var it = parent.item(i);
		if (it instanceof FolderItem && it.name === name) return it;
	}
	return parent.items.addFolder(name);
}

function setupBins() {
	var bin2D = findOrCreateBin('2D');
	var binLo = findOrCreateBin('_lo', bin2D);
	var binPaint = findOrCreateBin('paint', bin2D);
	var binData = findOrCreateBin('_data', binPaint);
	return { bin2D: bin2D, binLo: binLo, binPaint: binPaint, binData: binData };
}

// ============================================================
// Footage Replacement
// ============================================================

function replaceFootageInComps() {
	var bin2D = findOrCreateBin('2D');
	var binPaint = findOrCreateBin('paint', bin2D);
	var binData = findOrCreateBin('_data', binPaint);
	var binLo = findOrCreateBin('_lo', bin2D);

	try {
		// Replace in [cell] folder inside 2D > paint
		var cellFolder = null;
		for (var i = 1; i <= binPaint.numItems; i++) {
			var it = binPaint.item(i);
			if (it instanceof FolderItem && it.name.toLowerCase() === 'cell') {
				cellFolder = it;
				break;
			}
		}

		if (cellFolder) {
			for (var k = 1; k <= cellFolder.numItems; k++) {
				var comp = cellFolder.item(k);
				if (comp instanceof CompItem) {
					replaceInComp(comp, binData, binLo);
				}
			}
		}

		// Replace in _work comps only if they are inside 2D > paint
		for (var i = 1; i <= binPaint.numItems; i++) {
			var it = binPaint.item(i);
			if (it instanceof CompItem && /^_work/i.test(it.name)) {
				replaceInComp(it, binData, binLo);
			}
		}
	} catch (e) {
		alert(e);
	}
}

// Collect footage recursively from a bin
function collectFootage(bin) {
	var map = {};
	function recurse(folder) {
		for (var i = 1; i <= folder.numItems; i++) {
			var item = folder.item(i);
			if (item instanceof FolderItem) {
				if (item.name.toLowerCase() !== '_old') recurse(item);
			} else if (item instanceof FootageItem && item.file) {
				var clean = removeSequenceNumber(item.name.toLowerCase());
				// Keep the latest alphabetically if duplicates exist
				if (!map[clean] || map[clean].name < item.name) {
					map[clean] = item;
				}
			}
		}
	}
	recurse(bin);
	return map;
}

// Replace footage in a single comp, using _data first, then _lo
function replaceInComp(comp, binData, binLo) {
	var dataMap = collectFootage(binData);
	var loMap = collectFootage(binLo);

	for (var i = 1; i <= comp.numLayers; i++) {
		var lyr = comp.layer(i);

		if (lyr.source instanceof FootageItem) {
			var clean = removeSequenceNumber(lyr.source.name.toLowerCase());

			// Prefer _data footage, fallback to _lo
			var newSrc = dataMap[clean] || loMap[clean];

			if (newSrc && newSrc !== lyr.source) {
				lyr.replaceSource(newSrc, false);
			}
		}

		// Recursively handle nested comps
		if (lyr.source instanceof CompItem) {
			replaceInComp(lyr.source, binData, binLo);
		}
	}
}

// ============================================================
// Utilities
// ============================================================

function removeSequenceNumber(name) {
	// Remove optional underscore + brackets with 3-4 digits or range,
	// or underscore + digits at end,
	// or digits at end (3-4 digits)
	return name.replace(
		/(\_?\[\d{3,4}([~-]\d{3,4})?\](\.\w+)?|\_\d{3,4}(\.\w+)?$|\d{3,4}$)/,
		''
	);
}

function getFolder(theName) {
	for (var i = 1; i <= app.project.numItems; i++) {
		var item = app.project.item(i);
		if (item.name === theName && item instanceof FolderItem) return item;
	}
	return app.project.items.addFolder(theName);
}
