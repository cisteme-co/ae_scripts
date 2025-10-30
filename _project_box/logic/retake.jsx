function retake(newText) {
	app.beginUndoGroup('Retake Text Replace');

	var outputFolder = getFolder('output');
	if (!outputFolder || !(outputFolder instanceof FolderItem)) {
		alert("Folder named 'output' not found in Project panel.");
		return;
	}

	if (outputFolder.parentFolder) {
		alert(
			"Skipping 'output' folder because it is nested inside another folder."
		);
		app.endUndoGroup();
		return;
	}

	for (var i = 1; i <= outputFolder.numItems; i++) {
		var item = outputFolder.item(i);

		if (item instanceof CompItem) {
			var comp = item;

			// Find layer named "Retakes"
			var retakesLayer = comp.layer('Retakes');
			if (retakesLayer && retakesLayer instanceof TextLayer) {
				var textProp = retakesLayer.property('Source Text');
				if (textProp) {
					var textDoc = textProp.value;
					textDoc.text = newText;
					textProp.setValue(textDoc);
				}
			}
		}
	}

	app.endUndoGroup();
}
