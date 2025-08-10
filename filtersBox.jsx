(function (thisObj) {
	buildUI(thisObj);

	function buildUI(thisObj) {
		var win =
			thisObj instanceof Panel
				? thisObj
				: new Window('palette', 'Filters Box', undefined, {
						resizeable: true,
				  });
		win.alignChildren = 'fill';
		win.spacing = 4;

		// First Row
		var firstRow = win.add('group');
		firstRow.orientation = 'row';
		firstRow.spacing = 5;
		var projectsDrop = firstRow.add('dropdownlist', undefined, []);
		populateDropDown(projectsDrop, getProjects());
		projectsDrop.onChange = reload;

		var reloadButton = firstRow.add('button', undefined, 'Reload');
		reloadButton.onClick = reload;

		var tPanel = win.add('tabbedpanel');
		var ffx = tPanel.add('tab', undefined, 'FFX Presets');
		ffx.alignChildren = 'fill';
		var ffxList = ffx.add('listbox', undefined, []);
		ffxList.preferredSize = [100, 400];
		populateList(
			ffxList,
			getPresets(getProjects()[projectsDrop.selection.index], 'ffx')
		);

		var aep = tPanel.add('tab', undefined, 'AEP Presets');
		aep.alignChildren = 'fill';
		var aepList = aep.add('listbox', undefined, []);
		aepList.preferredSize = [100, 400];
		populateList(
			aepList,
			getPresets(getProjects()[projectsDrop.selection.index], 'aep')
		);

		var applyButton = win.add('button', undefined, 'Apply');
		applyButton.onClick = function () {
			var projectPath = getProjects()[projectsDrop.selection.index];
			var presetFolder = '/assets/templates/compositing/_presets/';
			var extension, file;

			if (tPanel.selection.text == 'FFX Presets') {
				extension = '.ffx';
				file = ffxList.selection.text;
			} else {
				extension = '.aep';
				file = aepList.selection.text;
			}

			var filePath =
				decodeURI(projectPath.path) +
				'/' +
				decodeURI(projectPath.name) +
				presetFolder +
				'/' +
				file +
				extension;
			var file = File(filePath);

			if (file.exists) {
				if (extension == '.ffx') {
					app.beginUndoGroup('preset');

					var curItem = app.project.activeItem;
					var selectedLayers = curItem.selectedLayers;

					for (var i = 0; i < selectedLayers.length; i++) {
						var selectedLayer = selectedLayers[i];
						selectedLayer.applyPreset(file);
					}

					app.endUndoGroup();
				} else if (extension == '.aep') {
					var comp = app.project.activeItem;
					var io = new ImportOptions(file);
					if (io.canImportAs(ImportAsType.PROJECT)) {
						app.project.importFile(io);
					}
				}
			} else {
				alert('No Preset here');
			}
		};

		function reload() {
			ffxList.removeAll();
			aepList.removeAll();

			populateList(
				ffxList,
				getPresets(getProjects()[projectsDrop.selection.index], 'ffx')
			);
			populateList(
				aepList,
				getPresets(getProjects()[projectsDrop.selection.index], 'aep')
			);
		}

		win.onResizing = win.onResize = function () {
			this.layout.resize();
		};

		if (win instanceof Window) {
			win.center();
			win.show();
		} else {
			win.layout.layout(true);
			win.layout.resize();
		}
	}
})(this);

function readDropboxJSON(file) {
	if (file.exists == true) {
		var currentLine;
		var jsonStuff = [];
		file.open('r');
		while (!file.eof) {
			currentLine = file.readln();
			jsonStuff.push(currentLine);
		}
		file.close();
		jsonStuff = jsonStuff.join('');
		var parsedJson = JSON.parse(jsonStuff);
		return parsedJson.business.path;
	}
}

function getWorkFolder() {
	var appdataFolder = Folder('~/./AppData/Local/').path;
	var dropboxFolder = appdataFolder + '/local/Dropbox/';
	var infoFile = File(dropboxFolder + 'info.json');

	if (infoFile.exists) {
		var dropboxPath = readDropboxJSON(infoFile);
		var workFolder = dropboxPath + '/work/';

		return workFolder;
	} else {
		var appdataFolder = Folder('~/../AppData/Local/').path;
		var dropboxFolder = appdataFolder + '/local/Dropbox/';
		var infoFile = File(dropboxFolder + 'info.json');

		if (infoFile.exists) {
			var dropboxPath = readDropboxJSON(infoFile);
			var workFolder = dropboxPath + '/work/';

			return workFolder;
		} else {
			var workFolder = '~/OneDrive/work/';

			if (Folder(workFolder).exists) {
				return workFolder;
			} else {
				return 'D:/OneDrive/work/';
			}
		}
	}
}

function getProjects() {
	var workFolders = Folder(getWorkFolder()).getFiles();
	var projects = [];

	for (var i = 0; i < workFolders.length; i++) {
		var folder = workFolders[i];

		if (folder.name[0] != '_') {
			if (
				Folder(folder.path + '/' + folder.name + '/production/compositing/')
					.exists
			) {
				projects.push(folder);
			}
		}
	}

	return projects;
}

function populateDropDown(dropdown, items) {
	for (var i = 0; i < items.length; i++) {
		dropdown.add('item', items[i].name);
	}

	dropdown.selection = 0;
}

function getPresets(path, type) {
	var presetsPath = Folder(
		path.path + '/' + path.name + '/assets/templates/compositing/_presets/'
	);
	var files = [];
	if (presetsPath.exists) {
		var presetFiles = presetsPath.getFiles();
		for (var i = 0; i < presetFiles.length; i++) {
			if (presetFiles[i] instanceof File) {
				var extension = presetFiles[i].name.split('.')[1];
				if (extension.toLowerCase() == type) {
					files.push(presetFiles[i]);
				}
			}
		}
	}

	return files;
}

function populateList(node, items) {
	if (items.length > 0) {
		for (var i = 0; i < items.length; i++) {
			node.add('item', decodeURI(items[i].name).split('.')[0]);
		}
	} else {
		var no = node.add('item', 'No Preset');
		no.enabled = false;
	}
}
