// ────────────────────────────────────────────────
// Import Background Assets Utility
// ────────────────────────────────────────────────

function importBG() {
	if (!app.project.file) {
		if (typeof Alerts !== 'undefined' && Alerts.alertPleaseSaveProject) {
			Alerts.alertPleaseSaveProject();
		} else {
			Alerts.alertSaveProjectFirst();
		}
		return;
	}

	var fileName = app.project.file.name;
	var info = parseFilename(fileName);
	if (!info) {
		alert('Unexpected filename format: ' + fileName);
		return;
	}

	var project = info.project;
	var episode = info.episode;
	var cut = info.cut;
	var baseName = info.base;
	var isLighting = app.project.file.fsName.toLowerCase().indexOf('lighting') !== -1;

	// Prepare search keys for BG files
	// Handle variations like:
	// - ws_06_001 (standard)
	// - ws06_001 (project + episode joined)
	// - ws06001 (all joined)
	var searchKeys = [
		baseName.toLowerCase(), // ws_06_001
		(info.project + info.episode + '_' + info.cut).toLowerCase(), // ws06_001
		baseName.replace(/_/g, '').toLowerCase(), // ws06001
	];

	// If cut is a range (e.g. 001-003), also search for the first part (001)
	if (cut.indexOf('-') !== -1) {
		var firstCut = cut.split('-')[0];
		var firstBase = [info.project, episode, firstCut].join('_').toLowerCase();
		searchKeys.push(firstBase); // ws_06_001
		searchKeys.push((info.project + info.episode + '_' + firstCut).toLowerCase()); // ws06_001
		searchKeys.push(firstBase.replace(/_/g, '')); // ws06001
	}

	// Remove duplicates from searchKeys
	var uniqueKeys = [];
	var keyMap = {};
	for (var k = 0; k < searchKeys.length; k++) {
		if (!keyMap[searchKeys[k]]) {
			uniqueKeys.push(searchKeys[k]);
			keyMap[searchKeys[k]] = true;
		}
	}
	searchKeys = uniqueKeys;

	var projectFolder = getNthParentFolder(app.project.file.parent, 5);
	if (!projectFolder) {
		if (typeof Alerts !== 'undefined' && Alerts.alertProjectFolderNotFound) {
			Alerts.alertCouldNotFindProjectFolder();
		} else {
			alert('Could not find project folder 5 levels up.');
		}
		return;
	}

	var bgFolder = new Folder(projectFolder.fsName + '/assets/textures/bg/');
	if (!bgFolder.exists) {
		Alerts.alertBgFolderMissing(bgFolder.fsName);
		return;
	}

	// Find episode folder (e.g. orb01 for compositing, #01 for lighting)
	var targetName = (project + episode).toLowerCase();
	var lightingTargetName = ('#' + episode).toLowerCase();

	var episodeFolders = bgFolder.getFiles(function (f) {
		return f instanceof Folder;
	});

	var episodeFolder = null;
	for (var i = 0; i < episodeFolders.length; i++) {
		var folderName = episodeFolders[i].name.toLowerCase();
		if (isLighting) {
			if (folderName === lightingTargetName || folderName === episode.toLowerCase()) {
				episodeFolder = episodeFolders[i];
				break;
			}
		} else {
			if (folderName === targetName) {
				episodeFolder = episodeFolders[i];
				break;
			}
		}
	}

	if (!episodeFolder) {
		Alerts.alertEpisodeFolderNotFound(isLighting ? lightingTargetName : targetName);
		return;
	}

	app.beginUndoGroup('Import BG');
	importBGAssets(episodeFolder, searchKeys, cut, isLighting);
	app.endUndoGroup();
}

// ────────────────────────────────────────────────
// Import background assets from specified folder
// ────────────────────────────────────────────────
function importBGAssets(folder, searchKeys, cut, isLighting) {
	var files = folder.getFiles();
	var foundPSD = null;
	var foundEXR = null;
	var foundSeqFolder = null;

	// Sum durations of _work comps for later use
	var sumDurations = 0;
	for (var i = 1; i <= app.project.numItems; i++) {
		var projItem = app.project.item(i);
		if (
			projItem instanceof CompItem &&
			projItem.name.toLowerCase().indexOf('_work') !== -1
		) {
			sumDurations += projItem.duration;
		}
	}

	for (var i = 0; i < files.length; i++) {
		var f = files[i];
		if (f instanceof File) {
			var nameNoExt = f.name.replace(/\.[^\.]+$/, '').toLowerCase();
			var ext = getFileExtension(f.name);

			var matches = false;
			for (var k = 0; k < searchKeys.length; k++) {
				if (nameNoExt.indexOf(searchKeys[k]) !== -1) {
					matches = true;
					break;
				}
			}

			if (matches) {
				if (ext === 'psd') foundPSD = f;

				if (ext === 'exr') {
					// Check if single EXR or sequence
					var others = folder.getFiles(function (ff) {
						return (
							ff instanceof File &&
							ff.name !== f.name &&
							ff.name.match(new RegExp(nameNoExt + '\\.\\d+\\.exr$', 'i'))
						);
					});
					if (others.length === 0) {
						foundEXR = f; // single EXR
					}
				}
			}
		}

		if (f instanceof Folder && f.name === cut) {
			foundSeqFolder = f;
		}
	}

	if (!foundPSD && !foundEXR && !foundSeqFolder) {
		Alerts.alertNoBGAssetFound(searchKeys[0]);
		return;
	}

	var nothingImported = true;

	// Import PSD as comp
	if (foundPSD && !isFileAlreadyImportedByPath(foundPSD)) {
		nothingImported = false;
		try {
			var importOpts = new ImportOptions(foundPSD);
			importOpts.importAs = ImportAsType.COMP;
			var compItem = app.project.importFile(importOpts);
			var fps = getCurrentCompFrameRate();

			compItem.frameRate = fps;

			var durationSeconds = 1440 / fps;
			compItem.duration = durationSeconds;

			for (var i = 1; i <= compItem.numLayers; i++) {
				var layer = compItem.layer(i);
				layer.outPoint = durationSeconds;
			}

			var folderBG;
			if (isLighting) {
				var binSozai = findOrCreateBin('01)_sozai');
				folderBG = findOrCreateBin('02_BG', binSozai);
			} else {
				folderBG = getOrCreateNestedFolder(['2D', 'bg']);
			}
			compItem.parentFolder = folderBG;

			var footageFolder = null;
			for (var i = app.project.numItems; i >= 1; i--) {
				var item = app.project.item(i);
				if (
					item instanceof FolderItem &&
					item.name.indexOf(compItem.name) != -1 &&
					!(item instanceof CompItem)
				) {
					footageFolder = item;
					break;
				}
			}

			if (footageFolder) {
				footageFolder.parentFolder = folderBG;
			}

			for (var i = 1; i <= app.project.numItems; i++) {
				var projItem = app.project.item(i);
				if (
					projItem instanceof CompItem &&
					projItem.name.toLowerCase().indexOf('_work') !== -1
				) {
					var newLayer = projItem.layers.add(compItem);
					newLayer.outPoint = projItem.duration;
					newLayer.label = 8;
				}
			}
		} catch (e) {
			Alerts.alertErrorImportingPSD(e.toString());
			return;
		}
	}

	// Import EXR as footage with alphaMode IGNORED
	if (foundEXR && !isFileAlreadyImportedByPath(foundEXR)) {
		try {
			nothingImported = false;
			var exrOpts = new ImportOptions(foundEXR);
			exrOpts.sequence = false;

			if (exrOpts.canImportAs(ImportAsType.FOOTAGE)) {
				exrOpts.importAs = ImportAsType.FOOTAGE;
			} else {
				alert('Cannot import EXR as footage.');
				return;
			}

			var exrItem = app.project.importFile(exrOpts);

			if (exrItem && exrItem.mainSource) {
				exrItem.mainSource.alphaMode = 5413; // IGNORED
			}

			var folderBG;
			if (isLighting) {
				var binSozai = findOrCreateBin('01)_sozai');
				folderBG = findOrCreateBin('02_BG', binSozai);
			} else {
				folderBG = getOrCreateNestedFolder(['3D', 'bg']);
			}
			exrItem.parentFolder = folderBG;

			var base3DComp = getComp(cut + '_3d');
			if (base3DComp) {
				base3DComp.width = exrItem.width;
				base3DComp.height = exrItem.height;
				base3DComp.duration = sumDurations;

				var newEXRLayer = base3DComp.layers.add(exrItem);
				newEXRLayer.outPoint = base3DComp.duration;
			}
		} catch (e) {
			Alerts.alertErrorImportingEXR(e.toString());
			return;
		}
	}

	// Import sequence folder as image sequence
	if (foundSeqFolder) {
		var seqFiles = foundSeqFolder.getFiles(function (f) {
			return f instanceof File && f.name.match(/\.(exr|png|jpg|jpeg|tif)$/i);
		});

		if (seqFiles.length > 0) {
			if (!isFileAlreadyImportedByPath(seqFiles[0])) {
				nothingImported = false;
				try {
					seqFiles.sort();
					var seqOpts = new ImportOptions(seqFiles[0]);
					seqOpts.sequence = true;
					var seqItem = app.project.importFile(seqOpts);

					if (getFileExtension(seqFiles[0].name) === 'exr') {
						try {
							if (seqItem.mainSource) {
								seqItem.mainSource.alphaMode = 5413;
								seqItem.mainSource.frameRate = getCurrentCompFrameRate();
							}
						} catch (seqAlphaErr) {
							Alerts.alertWarningAlphaModeEXRSequence(seqAlphaErr.toString());
						}
					}

					var folderBG;
					if (isLighting) {
						var binSozai = findOrCreateBin('01)_sozai');
						folderBG = findOrCreateBin('02_BG', binSozai);
					} else {
						folderBG = getOrCreateNestedFolder(['3D', 'bg']);
					}
					seqItem.parentFolder = folderBG;

					var base3DComp = getComp(cut + '_3d');
					if (base3DComp) {
						base3DComp.width = seqItem.width;
						base3DComp.height = seqItem.height;
						base3DComp.duration = seqItem.duration;
						base3DComp.layers.add(seqItem);
					}
				} catch (seqErr) {
					Alerts.alertErrorImportingSequence(seqErr.toString());
					return;
				}
			}
		} else {
			Alerts.alertNoImportableImageSequence(foundSeqFolder.name);
			return;
		}
	}

	if (nothingImported) {
		Alerts.alertLatestBackgroundImported();
		return;
	}
}

// ────────────────────────────────────────────────
// Check if file already imported by path
// ────────────────────────────────────────────────
function isFileAlreadyImportedByPath(file) {
	if (!file || !file.fsName) return false;

	var pathToMatch = file.fsName;

	for (var i = 1; i <= app.project.numItems; i++) {
		var item = app.project.item(i);
		if (
			(item instanceof FootageItem || item instanceof CompItem) &&
			item.mainSource &&
			item.mainSource.file
		) {
			if (item.mainSource.file.fsName === pathToMatch) {
				return true;
			}
		}
	}

	return false;
}
