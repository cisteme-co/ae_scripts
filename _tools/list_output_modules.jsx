function listOutputModules() {
	// Create a temporary comp so we can access the Render Queue
	var tempComp = app.project.items.addComp('TempComp', 1920, 1080, 1, 1, 25);
	var rqItem = app.project.renderQueue.items.add(tempComp);
	var omTemplates = rqItem.outputModules[1].templates;
	var list = [];

	// Gather list
	for (var i = 0; i < omTemplates.length; i++) {
		list.push(omTemplates[i]);
	}

	// Clean up
	rqItem.remove();
	tempComp.remove();

	// Build JSON string
	var jsonStr = JSON.stringify(list, null, 2);

	// Pick save location (same folder as project if saved, otherwise Desktop)
	var saveFolder = Folder.desktop;

	var jsonFile = new File(saveFolder.fsName + '/outputModules.json');

	// Write file
	try {
		if (jsonFile.open('w')) {
			// <-- Must open in write mode
			jsonFile.write(jsonStr);
			jsonFile.close();
			jsonFile.execute(); // Open in default program
		} else {
			alert('Failed to open file for writing: ' + jsonFile.fsName);
		}
	} catch (e) {
		alert('Error: ' + e.toString());
	}
}

// Run it
listOutputModules();
