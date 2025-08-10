// ──────────────
// Open project root folder
// ──────────────
function openRootFolder() {
	if (!app.project.file) {
		Alerts.alertSaveProjectFirst();
	} else {
		app.project.file.parent.execute();
	}
}
