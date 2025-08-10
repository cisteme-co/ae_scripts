(function (thisObj) {
	// ──────────────
	// Build UI for Retimer Preferences
	// ──────────────
	buildUI(thisObj);

	function buildUI(thisObj) {
		var section = 'RetimerPrefs';

		// Load saved settings or use defaults
		var savedFolder = app.settings.haveSetting(section, 'folderOutput')
			? app.settings.getSetting(section, 'folderOutput')
			: 'output';
		var savedBold = app.settings.haveSetting(section, 'boldDuration')
			? app.settings.getSetting(section, 'boldDuration')
			: '0+8';
		var savedDuration = app.settings.haveSetting(section, 'duration')
			? app.settings.getSetting(section, 'duration')
			: '6+0';
		var savedFramerate = app.settings.haveSetting(section, 'framerate')
			? app.settings.getSetting(section, 'framerate')
			: '24';
		var savedNested = app.settings.haveSetting(section, 'nestedComps')
			? app.settings.getSetting(section, 'nestedComps') === 'true'
			: false;

		// Create palette window or panel
		var win =
			thisObj instanceof Panel ? thisObj : new Window('palette', 'Retimer');

		// Main vertical group container
		var panelGroup = win.add('group');
		panelGroup.alignChildren = 'fill';
		panelGroup.orientation = 'column';
		panelGroup.spacing = 10;

		// Inputs group
		var inputs = panelGroup.add('group');
		inputs.alignChildren = 'right';
		inputs.orientation = 'column';
		inputs.spacing = 4;

		// Folder output input
		var folderGroup = inputs.add('group');
		folderGroup.alignChildren = 'right';
		folderGroup.spacing = 4;
		folderGroup.add('statictext', undefined, 'Folder output');
		var folderInput = folderGroup.add('edittext', undefined, savedFolder);
		folderInput.characters = 10;
		folderInput.onChange = function () {
			app.settings.saveSetting(section, 'folderOutput', folderInput.text);
		};

		// Bold duration input
		var boldGroup = inputs.add('group');
		boldGroup.alignChildren = 'right';
		boldGroup.spacing = 4;
		boldGroup.add('statictext', undefined, 'Bold duration');
		var boldInput = boldGroup.add('edittext', undefined, savedBold);
		boldInput.characters = 10;
		boldInput.onChange = function () {
			app.settings.saveSetting(section, 'boldDuration', boldInput.text);
		};

		// Duration input
		var durationGroup = inputs.add('group');
		durationGroup.alignChildren = 'right';
		durationGroup.spacing = 4;
		durationGroup.add('statictext', undefined, 'Duration');
		var durationInput = durationGroup.add('edittext', undefined, savedDuration);
		durationInput.characters = 10;
		durationInput.onChange = function () {
			app.settings.saveSetting(section, 'duration', durationInput.text);
		};

		// Framerate input
		var framerateGroup = inputs.add('group');
		framerateGroup.alignChildren = 'right';
		framerateGroup.spacing = 4;
		framerateGroup.add('statictext', undefined, 'Framerate');
		var framerateInput = framerateGroup.add(
			'edittext',
			undefined,
			savedFramerate
		);
		framerateInput.characters = 10;
		framerateInput.onChange = function () {
			app.settings.saveSetting(section, 'framerate', framerateInput.text);
		};

		// Nested compositions checkbox
		var nestedComps = panelGroup.add('checkbox', undefined, T('nestedComps'));
		nestedComps.value = savedNested;
		nestedComps.onChange = function () {
			app.settings.saveSetting(
				section,
				'nestedComps',
				nestedComps.value.toString()
			);
		};
		nestedComps.helpTip = TT('nestedComps');

		// Apply button
		var applyButton = panelGroup.add('button', undefined, 'Apply');
		applyButton.onClick = function () {
			changeDuration(
				folderInput.text,
				boldInput.text,
				durationInput.text,
				framerateInput.text,
				nestedComps.value
			);
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
})(this);

// ──────────────
// Change Duration on selected comps and optionally nested comps
// ──────────────
function changeDuration(folder, bold, duration, fps, nested) {
	var selection = app.project.selection;
	var framerate = Number(fps);

	// Parse duration like "6+0" into seconds + frames
	var newDuration = 0;
	if (duration.indexOf('+') !== -1) {
		var parts = duration.split('+');
		var seconds = Number(parts[0]);
		var frames = Number(parts[1]);
		newDuration = seconds + frames / framerate;
	} else {
		newDuration = Number(duration) / framerate;
	}

	// Parse bold duration similarly
	var newBold = 0;
	if (bold.indexOf('+') !== -1) {
		var parts = bold.split('+');
		var seconds = Number(parts[0]);
		var frames = Number(parts[1]);
		newBold = (seconds + frames) / framerate;
	} else {
		newBold = Number(bold) / framerate;
	}

	if (selection.length === 0) {
		alertPleaseSelectComp();
		return;
	}

	// Process each selected comp
	for (var i = 0; i < selection.length; i++) {
		var comp = selection[i];

		app.beginUndoGroup('Change Duration');

		if (comp instanceof CompItem) {
			// Change framerate if needed
			if (comp.frameRate !== framerate) {
				comp.frameRate = framerate;
			}

			// Adjust duration with bold if in the specified folder
			if (comp.parentFolder && comp.parentFolder.name === folder) {
				comp.duration = newDuration + newBold;
			} else {
				comp.duration = newDuration;
				comp.outPoint = newDuration;
			}

			// If nested comps option is enabled
			if (nested) {
				for (var e = 1; e <= comp.numLayers; e++) {
					var layer = comp.layer(e);
					if (!layer.locked && layer.source instanceof CompItem) {
						var nestedComp = layer.source;
						nestedComp.frameRate = framerate;
						nestedComp.duration = newDuration;

						for (var d = 1; d <= nestedComp.numLayers; d++) {
							var nestedLayer = nestedComp.layer(d);
							if (nestedLayer.source instanceof CompItem) {
								nestedLayer.source.frameRate = framerate;
								nestedLayer.source.duration = newDuration;
							}
							nestedLayer.outPoint = newDuration;
						}
						layer.outPoint = newDuration;
					}
				}
			}
		}

		app.endUndoGroup();
	}
}

// ──────────────
// Alert: Please select a composition
// ──────────────
function alertPleaseSelectComp() {
	var lang = getLanguage();
	var msg = '';
	switch (lang) {
		case 'japanese':
		case 'ja':
			msg = 'コンポジションを選択してください。';
			break;
		// Add other languages as needed
		default:
			msg = 'Please select a composition.';
	}
	alert(msg);
}
