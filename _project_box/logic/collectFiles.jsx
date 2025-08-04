function collectFiles() {
	if (!app.project.file) {
		alert('Please save your project file first.');
		return;
	}

	var projectFolder = getNthParentFolder(app.project.file.parent, 5);
	if (!projectFolder) {
		alert('Could not find project folder 5 levels up.');
		return;
	}

	var toSendFolder = new Folder(projectFolder.fsName + '/to_send/compositing/');

	// Get date as YYYYMMDD
	var now = new Date();
	var yyyy = now.getFullYear();
	var mm = ('0' + (now.getMonth() + 1)).slice(-2);
	var dd = ('0' + now.getDate()).slice(-2);
	var dateStr = yyyy + mm + dd;

	var projectName = app.project.file.name.replace(/\.[^\.]+$/, ''); // remove extension
	var destinationPath =
		toSendFolder.fsName + '/' + dateStr + '/aep/' + projectName;
	var destFolder = new Folder(destinationPath);
	if (!destFolder.exists) {
		destFolder.create();
	}

	var project = app.project;

	// Step 1: Save the current project as a copy in the destination folder
	var projectFile = app.project.file;
	var destAepFile = new File(destFolder.fsName + '/' + projectFile.name);
	if (!destAepFile.exists) {
		var saved = app.project.save(destAepFile);
		if (!saved) {
			alert('Failed to save project copy!');
			return;
		}
	} else {
		// If already exists, overwrite to make sure it's current
		var saved = app.project.save(destAepFile);
		if (!saved) {
			alert('Failed to save project copy!');
			return;
		}
	}

	// Step 2: Copy assets
	for (var i = 1; i <= project.numItems; i++) {
		var item = project.item(i);
		if (!(item instanceof FootageItem)) continue;

		var source = item.mainSource;
		if (!source || !source.file) continue;

		var srcFile = source.file;

		var relativeFolderPath = getItemFolderPath(item);
		var itemDestFolder = new Folder(
			destFolder.fsName + '/' + relativeFolderPath
		);
		if (!itemDestFolder.exists) itemDestFolder.create();

		if (source.isStill === false) {
			// Copy the whole folder where the sequence lives
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
	}

	// Step 3: Replace footage paths inside the open project with the copied files
	for (var i = 1; i <= project.numItems; i++) {
		var item = project.item(i);
		if (!(item instanceof FootageItem)) continue;

		var source = item.mainSource;
		if (!source || !source.file) continue;

		var srcFile = source.file;

		var relativeFolderPath = getItemFolderPath(item);
		var itemDestFolder = new Folder(
			destFolder.fsName + '/' + relativeFolderPath
		);

		if (source.isStill === false) {
			// New path points to copied folder + original sequence folder name + original file name
			var sequenceFolder = srcFile.parent;
			var destSequenceParentFolder = new Folder(
				itemDestFolder.fsName + '/' + sequenceFolder.name
			);
			var newMainFile = new File(
				destSequenceParentFolder.fsName + '/' + source.file.name
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
	}

	// Step 4: Save the project again with updated paths
	app.project.save();

	// Step 5: Open destination folder in OS file explorer
	destFolder.execute();

	alert('Files collected and project saved to:\n' + destFolder.fsName);
}
