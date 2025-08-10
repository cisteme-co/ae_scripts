(function (thisObj) {
	var rootFolder = File($.fileName).parent;

	// ────────────────────────────────────────────────
	// Load core dependency
	// ────────────────────────────────────────────────
	$.evalFile(new File(rootFolder.fsName + '/utils/json2.js'));

	// ────────────────────────────────────────────────
	// Main entry: build UI
	// ────────────────────────────────────────────────
	buildUI(thisObj);

	// ────────────────────────────────────────────────
	// buildUI: Create the main window with tabs and controls
	// ────────────────────────────────────────────────
	function buildUI(thisObj) {
		var win =
			thisObj instanceof Panel
				? thisObj
				: new Window('palette', 'Tools & Effects Box', undefined, {
						resizeable: true,
				  });

		win.alignChildren = 'fill';
		win.spacing = 4;

		var scriptPath = File($.fileName).path;
		var effectsPath = scriptPath + '/_effects';
		var toolsPath = scriptPath + '/_tools';

		var tabPanel = win.add('tabbedpanel');
		tabPanel.borderStyle = 'none';

		// Effects tab
		var effectsTab = tabPanel.add('tab', undefined, 'Effects');
		effectsTab.alignChildren = 'fill';
		var effectsList = effectsTab.add('listbox', undefined, [], {
			multiselect: false,
		});
		effectsList.preferredSize = [100, 400];
		populateList(effectsList, getFiles(effectsPath));

		// Tools tab
		var toolsTab = tabPanel.add('tab', undefined, 'Tools');
		toolsTab.alignChildren = 'fill';
		var toolsList = toolsTab.add('listbox', undefined, [], {
			multiselect: false,
		});
		toolsList.preferredSize = [100, 400];
		populateList(toolsList, getFiles(toolsPath));

		// Apply button
		var btnGrp = win.add('group');
		btnGrp.alignment = 'center';
		btnGrp.orientation = 'row';
		var applyBtn = btnGrp.add('button', undefined, 'Apply');
		applyBtn.onClick = function () {
			var activeTab = tabPanel.selection;
			if (!activeTab) return;

			var list = activeTab.text === 'Effects' ? effectsList : toolsList;
			if (!list.selection) {
				alert('No ' + activeTab.text + ' selected.');
				return;
			}

			runFile(
				activeTab.text === 'Effects' ? effectsPath : toolsPath,
				list.selection.text
			);
		};

		// Reload button
		var reloadBtn = btnGrp.add('button', undefined, 'Reload');
		reloadBtn.onClick = function () {
			effectsList.removeAll();
			toolsList.removeAll();

			populateList(effectsList, getFiles(effectsPath));
			populateList(toolsList, getFiles(toolsPath));
		};

		// Resize event handler
		win.onResizing = win.onResize = function () {
			this.layout.resize();
		};

		// Show window or layout panel
		if (win instanceof Window) {
			win.center();
			win.show();
		} else {
			win.layout.layout(true);
			win.layout.resize();
		}
	}

	// ────────────────────────────────────────────────
	// populateList: Populate a listbox with file names,
	//               formatted nicely
	// ────────────────────────────────────────────────
	function populateList(list, files) {
		for (var i = 0; i < files.length; i++) {
			var name = files[i].name.replace(/_/g, ' ').replace(/\.(jsx|ffx)$/i, '');

			var words = name.split(' ');
			var capitalizedWords = [];

			for (var j = 0; j < words.length; j++) {
				var word = words[j];
				if (word.length > 0) {
					capitalizedWords.push(word.charAt(0).toUpperCase() + word.slice(1));
				}
			}

			var capitalized = capitalizedWords.join(' ');
			list.add('item', capitalized);
		}
	}

	// ────────────────────────────────────────────────
	// getFiles: Get .jsx and .ffx files from a folder,
	//           returns array of File objects
	// ────────────────────────────────────────────────
	function getFiles(folderPath) {
		var folder = Folder(folderPath);
		if (!folder.exists) return [];

		var allFiles = folder.getFiles();
		var filtered = [];

		for (var i = 0; i < allFiles.length; i++) {
			if (allFiles[i] instanceof File) {
				var extMatch = allFiles[i].name.match(/\.(jsx|ffx)$/i);
				if (extMatch) filtered.push(allFiles[i]);
			}
		}
		return filtered;
	}

	// ────────────────────────────────────────────────
	// runFile: Execute the selected script file
	// ────────────────────────────────────────────────
	function runFile(folderPath, selectedName) {
		var fileName = selectedName.toLowerCase().replace(/ /g, '_') + '.jsx';
		var file = File(folderPath + '/' + fileName);

		if (!file.exists) {
			alert('Could not find file:\n' + fileName);
			return;
		}

		if (file.open('r')) {
			try {
				eval(file.read());
			} catch (e) {
				alert('Error running script:\n' + e.toString());
			}
			file.close();
		} else {
			alert('Failed to open file:\n' + fileName);
		}
	}
})(this);
