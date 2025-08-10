// ────────────────────────────────────────────────
// Utility: Remove Sequence Number from Item Name
// ────────────────────────────────────────────────
function removeSequenceNumber(name) {
	// Remove optional underscore + brackets with 3-4 digits or range,
	// or underscore + digits at end,
	// or digits at end (3-4 digits)
	return name.replace(
		/(\_?\[\d{3,4}([~-]\d{3,4})?\](\.\w+)?|\_\d{3,4}(\.\w+)?$|\d{3,4}$)/,
		''
	);
}

// ────────────────────────────────────────────────
// Utility: Get Folder Item by Name in Project, or Create if Missing
// ────────────────────────────────────────────────
function getFolder(theName) {
	for (var i = 1; i <= app.project.numItems; i++) {
		var item = app.project.item(i);
		if (item.name === theName && item instanceof FolderItem) {
			return item;
		}
	}
	// Folder not found, create it now
	return app.project.items.addFolder(theName);
}

function getComp(theName) {
	for (var i = 1; i <= app.project.numItems; i++) {
		if (
			app.project.item(i).name == theName &&
			app.project.item(i) instanceof CompItem
		) {
			return app.project.item(i);
		}
	}
	return null;
}
