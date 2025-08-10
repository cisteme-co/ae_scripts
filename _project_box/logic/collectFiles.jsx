function collectFiles() {
	// ───────────────────────────────────────────────
	// 0. INITIAL VALIDATION
	// ───────────────────────────────────────────────
	if (!app.project.file) {
		Alerts.alertSaveProjectFirst();
		return;
	}

	var projectFolder = getNthParentFolder(app.project.file.parent, 5);
	if (!projectFolder || !projectFolder.exists) {
		Alerts.alertCouldNotFindProjectFolder();
		return;
	}

	// ───────────────────────────────────────────────
	// 1. SETUP DESTINATION PATHS
	// ───────────────────────────────────────────────
	var toSendFolder = new Folder(projectFolder.fsName + '/to_send/compositing/');
	var now = new Date();
	var dateStr =
		now.getFullYear().toString() +
		('0' + (now.getMonth() + 1)).slice(-2) +
		('0' + now.getDate()).slice(-2);

	var projectName = app.project.file.name.replace(/\.[^\.]+$/, '');
	var destinationPath =
		toSendFolder.fsName + '/' + dateStr + '/aep/' + projectName;
	var destFolder = new Folder(destinationPath);
	if (!destFolder.exists && !destFolder.create()) {
		Alerts.alertFailedCreateFolder(destFolder.fsName);
		return;
	}

	// ───────────────────────────────────────────────
	// 2. SAVE PROJECT COPY
	// ───────────────────────────────────────────────
	var destAepFile = new File(destFolder.fsName + '/' + app.project.file.name);
	if (!app.project.save(destAepFile)) {
		Alerts.alertFailedSaveProjectCopy();
		return;
	}

	// ───────────────────────────────────────────────
	// 3. COPY ASSETS
	// ───────────────────────────────────────────────
	for (var i = 1; i <= app.project.numItems; i++) {
		var item = app.project.item(i);

		// Skip anything that's not a FootageItem or missing a valid source file
		if (
			!(item instanceof FootageItem) ||
			!item.mainSource ||
			!item.mainSource.file
		)
			continue;

		var srcFile = item.mainSource.file;
		var relativeFolderPath = getItemFolderPath(item);
		var itemDestFolder = new Folder(
			destFolder.fsName + '/' + relativeFolderPath
		);
		if (!itemDestFolder.exists) itemDestFolder.create();

		try {
			if (item.mainSource.isStill === false) {
				// Copy the entire sequence folder
				var sequenceFolder = srcFile.parent;
				var destSequenceParentFolder = new Folder(
					itemDestFolder.fsName + '/' + sequenceFolder.name
				);
				copyFolderContents(sequenceFolder, destSequenceParentFolder);
			} else {
				// Copy single file
				var targetFile = new File(itemDestFolder.fsName + '/' + srcFile.name);
				if (!targetFile.exists) srcFile.copy(targetFile);
			}
		} catch (err) {
			Alerts.alertErrorCopyingAsset(srcFile.fsName, err.toString());
		}
	}

	// ───────────────────────────────────────────────
	// 4. REPLACE FOOTAGE PATHS IN PROJECT
	// ───────────────────────────────────────────────
	for (var i = 1; i <= app.project.numItems; i++) {
		var item = app.project.item(i);
		if (
			!(item instanceof FootageItem) ||
			!item.mainSource ||
			!item.mainSource.file
		)
			continue;

		var srcFile = item.mainSource.file;
		var relativeFolderPath = getItemFolderPath(item);
		var itemDestFolder = new Folder(
			destFolder.fsName + '/' + relativeFolderPath
		);

		try {
			if (item.mainSource.isStill === false) {
				var sequenceFolder = srcFile.parent;
				var destSequenceParentFolder = new Folder(
					itemDestFolder.fsName + '/' + sequenceFolder.name
				);
				var newMainFile = new File(
					destSequenceParentFolder.fsName + '/' + srcFile.name
				);
				if (newMainFile.exists) {
					item.replaceWithSequence(newMainFile, true);
				}
			} else {
				var targetFile = new File(itemDestFolder.fsName + '/' + srcFile.name);
				if (targetFile.exists) {
					item.replace(targetFile);
				}
			}
		} catch (err) {
			Alerts.alertReplacingFootage(srcFile.fsName, err.toString());
		}
	}

	// ───────────────────────────────────────────────
	// 5. SAVE FINAL PROJECT AND OPEN FOLDER
	// ───────────────────────────────────────────────
	app.project.save();
	if (destFolder.exists) destFolder.execute();

	Alerts.alertFilesCollected(destFolder.fsName);
}
