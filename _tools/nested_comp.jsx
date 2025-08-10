// ────────────────────────────────────────────────
// ───────────── Nested Comp Frame Rate Fix ───────
// ────────────────────────────────────────────────
var rootFolder = File($.fileName).parent;
$.evalFile(new File(rootFolder.fsName + '/utils/alerts.jsx'));

if (typeof app !== 'undefined' && app.project && app.project.numItems) {
	app.beginUndoGroup('Nested Comp');

	for (var i = 1; i <= app.project.numItems; i++) {
		var item = app.project.item(i);
		// Only set if property exists to avoid errors
		if (item && 'preserveNestedFrameRate' in item) {
			item.preserveNestedFrameRate = true;
		}
	}

	app.endUndoGroup();
} else {
	// Fallback alert if project or items not accessible
	if (typeof Alerts !== 'undefined' && Alerts.alertNoCompSelected) {
		Alerts.alertNoCompSelected();
	} else {
		alert('コンポジションを選択または開いてください。'); // Japanese fallback
	}
}
