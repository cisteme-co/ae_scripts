function incrementTake(take) {
	// ───────────────────────────────────────────────
	// 0. CHECK PROJECT FILE SAVED
	// ───────────────────────────────────────────────
	if (!app.project.file) {
		Alerts.alertSaveProjectFirst();
		return;
	}

	// ───────────────────────────────────────────────
	// 1. PARSE FILENAME AND OLD TAKE
	// ───────────────────────────────────────────────
	var fileName = app.project.file.name;
	var fileNameSplit = fileName.split('_');

	if (fileNameSplit.length < 2) {
		Alerts.alertUnexpectedFilenameFormat(fileName);
		return;
	}

	var lastSegment = fileNameSplit[fileNameSplit.length - 1];
	var oldTake = lastSegment.split('.')[0];

	// ───────────────────────────────────────────────
	// 2. PREPARE NEW FILENAME
	// ───────────────────────────────────────────────
	var newSave = fileName.replace(oldTake, take);
	var newSaveFile = File(app.project.file.path + '/' + newSave);

	// ───────────────────────────────────────────────
	// 3. RENAME COMPOSITIONS WITH OLD TAKE
	// ───────────────────────────────────────────────
	for (var i = 1; i <= app.project.numItems; i++) {
		var projItem = app.project.item(i);
		if (
			projItem instanceof CompItem &&
			projItem.name.toLowerCase().indexOf(oldTake.toLowerCase()) !== -1
		) {
			projItem.name = projItem.name.replace(oldTake, take);
		}
	}

	// ───────────────────────────────────────────────
	// 4. SAVE PROJECT WITH NEW FILENAME
	// ───────────────────────────────────────────────
	try {
		app.project.save(newSaveFile);
	} catch (e) {
		Alerts.alertFailedSaveProjectCopy(newSaveFile.fsName, e.toString());
	}
}
