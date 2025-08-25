// Make sure you have a composition open and a layer selected
var comp = app.project.activeItem;
if (!(comp && comp instanceof CompItem)) {
	alert('Please select a composition.');
} else if (comp.selectedLayers.length === 0) {
	alert('Please select at least one layer.');
} else {
	var layer = comp.selectedLayers[0];
	var effects = layer.property('ADBE Effect Parade');
	if (!effects || effects.numProperties === 0) {
		alert('Selected layer has no effects.');
	} else {
		// Collect data
		var effectsData = [];

		for (var i = 1; i <= effects.numProperties; i++) {
			var eff = effects.property(i);

			var effObj = {
				index: i,
				name: eff.name,
				matchName: eff.matchName,
				properties: [],
			};

			for (var j = 1; j <= eff.numProperties; j++) {
				var prop = eff.property(j);
				effObj.properties.push({
					index: j,
					name: prop.name,
					matchName: prop.matchName,
				});
			}

			effectsData.push(effObj);
		}

		// Convert to JSON string (pretty print)
		var jsonStr = JSON.stringify(effectsData, null, 4);

		// Define file on desktop
		var desktopPath = Folder.desktop.fsName; // platform-safe desktop path
		var file = new File(desktopPath + '/effects_info.json');

		// Write JSON to file
		file.encoding = 'UTF-8';
		var success = file.open('w');
		if (success) {
			file.write(jsonStr);
			file.close();

			// Open the file after saving
			file.execute();
		} else {
			alert('Failed to open file for writing:\n' + file.fsName);
		}
	}
}
