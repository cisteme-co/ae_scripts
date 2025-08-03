function incrementTake(take) {
	if (!app.project.file) {
		alert('Please save your project file first.');
		return;
	}

	var fileName = app.project.file.name;
	var fileNameSplit = fileName.split('_');
	var oldTake = fileNameSplit[fileNameSplit.length - 1].split('.')[0];

	var newSave = fileName.replace(oldTake, take);
	var newSaveFile = File(app.project.file.path + '/' + newSave);

	for (var i = 1; i <= app.project.numItems; i++) {
		var projItem = app.project.item(i);
		if (
			projItem instanceof CompItem &&
			projItem.name.toLowerCase().indexOf(oldTake) != -1
		) {
			projItem.name = projItem.name.replace(oldTake, take);
		}
	}

	app.project.save(newSaveFile);
}
