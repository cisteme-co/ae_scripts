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
	// Load utility scripts
	// ────────────────────────────────────────────────
	$.evalFile(new File(scriptFolder.fsName + '/_project_box/utils/_i18n.jsx'));
	$.evalFile(
		new File(scriptFolder.fsName + '/_project_box/utils/fileUtils.jsx')
	);
	$.evalFile(
		new File(scriptFolder.fsName + '/_project_box/utils/compUtils.jsx')
	);

	// ────────────────────────────────────────────────
	// Load logic scripts
	// ────────────────────────────────────────────────
	$.evalFile(
		new File(scriptFolder.fsName + '/_project_box/logic/createCut.jsx')
	);
	$.evalFile(
		new File(scriptFolder.fsName + '/_project_box/logic/createLightingCut.jsx')
	);
	$.evalFile(
		new File(scriptFolder.fsName + '/_project_box/logic/importCells.jsx')
	);
	$.evalFile(
		new File(scriptFolder.fsName + '/_project_box/logic/importBG.jsx')
	);
	$.evalFile(
		new File(scriptFolder.fsName + '/_project_box/logic/renameWorker.jsx')
	);
	$.evalFile(
		new File(scriptFolder.fsName + '/_project_box/logic/incrementTake.jsx')
	);
	$.evalFile(new File(scriptFolder.fsName + '/_project_box/logic/retake.jsx'));
	$.evalFile(
		new File(scriptFolder.fsName + '/_project_box/logic/openFile.jsx')
	);
	$.evalFile(
		new File(scriptFolder.fsName + '/_project_box/logic/openRootFolder.jsx')
	);
	$.evalFile(
		new File(scriptFolder.fsName + '/_project_box/logic/removeUnused.jsx')
	);
	$.evalFile(
		new File(scriptFolder.fsName + '/_project_box/logic/fileReplace.jsx')
	);
	$.evalFile(
		new File(scriptFolder.fsName + '/_project_box/logic/renderBG.jsx')
	);
	$.evalFile(
		new File(scriptFolder.fsName + '/_project_box/logic/collectFiles.jsx')
	);
	$.evalFile(
		new File(scriptFolder.fsName + '/_project_box/logic/timesheetLogic.jsx')
	);

	// ────────────────────────────────────────────────
	// Load UI scripts
	// ────────────────────────────────────────────────
	$.evalFile(
		new File(scriptFolder.fsName + '/_project_box/ui/handleNewCut.jsx')
	);
	$.evalFile(new File(scriptFolder.fsName + '/_project_box/ui/mainUI.jsx'));

	// ────────────────────────────────────────────────
	// Launch UI
	// ────────────────────────────────────────────────
	buildUI(thisObj);
})(this);
