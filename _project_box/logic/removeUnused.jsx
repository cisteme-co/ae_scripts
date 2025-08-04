function removeUnused() {
	app.beginUndoGroup('Remove Unused Items');

	var project = app.project;
	var rq = project.renderQueue;
	var itemsToRemove = [];

	// Collect comps in the render queue
	var compsInRQ = {};
	for (var i = 1; i <= rq.numItems; i++) {
		if (rq.item(i).comp) {
			compsInRQ[rq.item(i).comp.id] = true;
		}
	}

	// Helper: Check if item is used in any comp
	function isItemUsed(item) {
		for (var i = 1; i <= project.numItems; i++) {
			var comp = project.item(i);
			if (comp instanceof CompItem) {
				for (var j = 1; j <= comp.numLayers; j++) {
					var layer = comp.layer(j);
					if (layer.source === item) {
						return true;
					}
				}
			}
		}
		return false;
	}

	// Collect unused items
	for (var i = project.numItems; i >= 1; i--) {
		var item = project.item(i);

		if (item instanceof FolderItem) {
			continue; // Never delete folders
		}

		if (item instanceof CompItem && compsInRQ[item.id] === true) {
			continue; // Don't remove comps that are in the Render Queue
		}

		if (item instanceof CompItem || item instanceof FootageItem) {
			if (!isItemUsed(item)) {
				itemsToRemove.push(item);
			}
		}
	}

	// Remove unused items
	for (var i = 0; i < itemsToRemove.length; i++) {
		try {
			itemsToRemove[i].remove();
		} catch (e) {
			alert('Failed to remove: ' + itemsToRemove[i].name + '\n' + e.toString());
		}
	}

	alert('Successfully removed ' + itemsToRemove.length + ' unused item(s).');
	app.endUndoGroup();
}
