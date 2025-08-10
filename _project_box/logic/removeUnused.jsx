// ──────────────
// Remove unused items from project
// ──────────────
function removeUnused() {
	app.beginUndoGroup('Remove Unused Items');

	var project = app.project;
	var rq = project.renderQueue;
	var itemsToRemove = [];

	// Collect comps currently in render queue to exclude from removal
	var compsInRQ = {};
	for (var i = 1; i <= rq.numItems; i++) {
		if (rq.item(i).comp) {
			compsInRQ[rq.item(i).comp.id] = true;
		}
	}

	// Helper: Check if an item is used in any comp layers
	function isItemUsed(item) {
		for (var i = 1; i <= project.numItems; i++) {
			var comp = project.item(i);
			if (comp instanceof CompItem) {
				for (var j = 1; j <= comp.numLayers; j++) {
					if (comp.layer(j).source === item) {
						return true;
					}
				}
			}
		}
		return false;
	}

	// Collect items that are unused and eligible for removal
	for (var i = project.numItems; i >= 1; i--) {
		var item = project.item(i);

		if (item instanceof FolderItem) {
			continue; // Do not remove folders
		}

		if (item instanceof CompItem && compsInRQ[item.id]) {
			continue; // Do not remove comps in render queue
		}

		if (
			(item instanceof CompItem || item instanceof FootageItem) &&
			!isItemUsed(item)
		) {
			itemsToRemove.push(item);
		}
	}

	// Attempt to remove unused items
	for (var i = 0; i < itemsToRemove.length; i++) {
		try {
			itemsToRemove[i].remove();
		} catch (e) {
			Alerts.alertFailedToRemove(itemsToRemove[i].name, e.toString());
		}
	}

	Alerts.alertRemovedUnusedItems(itemsToRemove.length);
	app.endUndoGroup();
}
