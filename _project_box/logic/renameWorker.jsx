function renameWorker(workerName) {
	var outputFolder = getFolder('output');
	if (outputFolder) {
		for (var i = 1; i <= app.project.numItems; i++) {
			var item = app.project.item(i);
			if (item instanceof CompItem && item.parentFolder === outputFolder) {
				for (var l = 1; l <= item.numLayers; l++) {
					var layer = item.layer(l);
					if (layer.name === 'worker' && layer instanceof TextLayer) {
						layer.text.sourceText.setValue(workerName);
					}
				}
			}
		}
	}
}
