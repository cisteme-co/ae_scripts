(function (thisObj) {
	buildUI(thisObj);

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

		var tPanel = win.add('tabbedpanel');
		tPanel.borderStyle = 'none';
		var effects = tPanel.add('tab', undefined, 'Effects');
		effects.alignChildren = 'fill';
		var effectsList = effects.add('listbox', undefined, []);
		effectsList.preferredSize = [100, 400];
		populateList(effectsList, getFiles(effectsPath));

		var tools = tPanel.add('tab', undefined, 'Tools');
		tools.alignChildren = 'fill';
		var toolsList = tools.add('listbox', undefined, []);
		toolsList.preferredSize = [100, 400];
		populateList(toolsList, getFiles(toolsPath));

		var applyButton = win.add('button', undefined, 'Apply');
		applyButton.onClick = function () {
			if (tPanel.selection.text == 'Effects') {
				if (effectsList.selection.text != undefined) {
					runFile(effectsPath, effectsList);
				} else {
					alert('No Effects selected.');
				}
			}

			if (tPanel.selection.text == 'Tools') {
				if (toolsList.selection.text != undefined) {
					runFile(toolsPath, toolsList);
				} else {
					alert('No Tools selected.');
				}
			}
		};

		var reloadButton = win.add('button', undefined, 'Reload');
		reloadButton.onClick = function () {
			effectsList.removeAll();
			toolsList.removeAll();

			populateList(effectsList, getFiles(effectsPath));
			populateList(toolsList, getFiles(toolsPath));
		};

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

function populateList(list, items) {
	for (var i = 0; i < items.length; i++) {
		var name = items[i].name.replace(/_/g, ' ').replace('.jsx', '');
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

function getFiles(path) {
	var files = Folder(path).getFiles();
	var jsx = [];
	for (var i = 0; i < files.length; i++) {
		var extension = files[i].name.split('.')[1];
		if (extension.toLowerCase() == 'jsx' || extension == 'ffx') {
			jsx.push(files[i]);
		}
	}

	return jsx;
}

function runFile(path, list) {
	var selectedName = list.selection.text;
	var fileName = selectedName.toLowerCase().replace(/ /g, '_') + '.jsx';
	var effectFile = File(path + '/' + fileName);

	if (effectFile.exists) {
		effectFile.open();
		eval(effectFile.read());
		effectFile.close();
	} else {
		alert('Could not find file:\n' + fileName);
	}
}
