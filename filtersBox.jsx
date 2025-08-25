(function (thisObj) {
	// ────────────────────────────────────────────────
	// Setup root and script folder paths
	// ────────────────────────────────────────────────
	var rootFolder = File($.fileName).parent;
	var scriptFile = File($.fileName);
	var scriptFolder = scriptFile.parent;

	// ────────────────────────────────────────────────
	// Load core dependency
	// ────────────────────────────────────────────────
	$.evalFile(new File(rootFolder.fsName + '/utils/json2.js'));
	$.evalFile(new File(rootFolder.fsName + '/utils/alerts.jsx'));

	// ────────────────────────────────────────────────
	// Load UI scripts
	// ────────────────────────────────────────────────
	$.evalFile(
		new File(scriptFolder.fsName + '/_filters_box/utils/files_utils.jsx')
	);
	$.evalFile(new File(scriptFolder.fsName + '/_filters_box/ui/main.jsx'));

	// ────────────────────────────────────────────────
	// Launch UI
	// ────────────────────────────────────────────────
	buildUI(thisObj);
})(this);
