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

	// Find episode folder (e.g. orb01)
	var targetName = (project + episode).toLowerCase();
	var episodeFolders = bgFolder.getFiles(function (f) {
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

	app.beginUndoGroup('Import BG');
	importBGAssets(episodeFolder, baseName, cut);
	app.endUndoGroup();
}

// ────────────────────────────────────────────────
// Import background assets from specified folder
// ────────────────────────────────────────────────
function importBGAssets(folder, baseName, cut) {
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

			if (nameNoExt.indexOf(baseName) !== -1) {
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
		Alerts.alertNoBGAssetFound(baseName);
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

			var folder2D = getOrCreateNestedFolder(['2D', 'bg']);
			compItem.parentFolder = folder2D;

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
				footageFolder.parentFolder = folder2D;
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

			var folder3D = getOrCreateNestedFolder(['3D', 'bg']);
			exrItem.parentFolder = folder3D;

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

					var folder3D = getOrCreateNestedFolder(['3D', 'bg']);
					seqItem.parentFolder = folder3D;

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
