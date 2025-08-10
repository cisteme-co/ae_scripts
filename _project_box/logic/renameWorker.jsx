// ──────────────
// Rename all 'worker' text layers in Comps inside output folder
// ──────────────
function renameWorker(workerName) {
	var outputFolder = getFolder('output');
	if (!outputFolder) {
		Alerts.alertOutputFolderMissing();
		return;
	}

	for (var i = 1; i <= app.project.numItems; i++) {
		var item = app.project.item(i);

		// Only process comps inside the output folder
		if (item instanceof CompItem && item.parentFolder === outputFolder) {
			for (var l = 1; l <= item.numLayers; l++) {
				var layer = item.layer(l);

				// Rename text layers named 'worker'
				if (layer.name === 'worker' && layer instanceof TextLayer) {
					layer.text.sourceText.setValue(workerName);
				}
			}
		}
	}
}
