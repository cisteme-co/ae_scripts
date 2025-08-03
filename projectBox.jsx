(function (thisObj) {
	var rootFolder = File($.fileName).parent;

	var scriptFile = File($.fileName);
	var scriptFolder = scriptFile.parent;

	$.evalFile(new File(rootFolder.fsName + '/assets/json2.js'));

	$.evalFile(scriptFolder.fsName + '/_project_box/utils/_i18n.jsx');

	$.evalFile(
		new File(scriptFolder.fsName + '/_project_box/utils/fileUtils.jsx')
	);
	$.evalFile(
		new File(scriptFolder.fsName + '/_project_box/utils/compUtils.jsx')
	);

	$.evalFile(
		new File(scriptFolder.fsName + '/_project_box/logic/createCut.jsx')
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
		new File(scriptFolder.fsName + '/_project_box/logic/renderBG.jsx')
	);

	$.evalFile(
		new File(scriptFolder.fsName + '/_project_box/ui/handleNewCut.jsx')
	);
	$.evalFile(new File(scriptFolder.fsName + '/_project_box/ui/buildUI.jsx'));

	buildUI(thisObj);
})(this);
