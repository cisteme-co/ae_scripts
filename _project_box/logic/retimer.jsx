(function (thisObj) {
	buildUI(thisObj);

	function buildUI(thisObj) {
		var section = 'RetimerPrefs';

		// Load saved values or defaults
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
			? app.settings.getSetting(section, 'nestedComps')
			: false;

		var win =
			thisObj instanceof Panel ? thisObj : new Window('palette', 'Retimer');

		var panelGroup = win.add('group');
		panelGroup.alignChildren = 'fill';
		panelGroup.orientation = 'column';
		panelGroup.spacing = 10;

		var inputs = panelGroup.add('group');
		inputs.alignChildren = 'right';
		inputs.orientation = 'column';
		inputs.spacing = 4;
		var folderGroup = inputs.add('group');
		folderGroup.alignChildren = 'right';
		folderGroup.spacing = 4;
		folderGroup.add('statictext', undefined, 'Folder output');
		var folderInput = folderGroup.add('edittext', undefined, savedFolder);
		folderInput.characters = 10;
		folderInput.onChange = function () {
			app.settings.saveSetting(section, 'folderOutput', folderInput.text);
		};

		var boldGroup = inputs.add('group');
		boldGroup.alignChildren = 'right';
		boldGroup.spacing = 4;
		boldGroup.add('statictext', undefined, 'Bold duration');
		var boldInput = boldGroup.add('edittext', undefined, savedBold);
		boldInput.characters = 10;
		boldInput.onChange = function () {
			app.settings.saveSetting(section, 'boldDuration', boldInput.text);
		};

		var durationGroup = inputs.add('group');
		durationGroup.alignChildren = 'right';
		durationGroup.spacing = 4;
		durationGroup.add('statictext', undefined, 'Duration');
		var durationInput = durationGroup.add('edittext', undefined, savedDuration);
		durationInput.characters = 10;
		durationInput.onChange = function () {
			app.settings.saveSetting(section, 'duration', durationInput.text);
		};

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

		if (win instanceof Window) {
			win.center();
			win.show();
		} else {
			win.layout.layout(true);
			win.layout.resize();
		}
	}
})(this);

function changeDuration(folder, bold, duration, fps, nested) {
	var selectItem = app.project.selection;
	var framerate = Number(fps);

	if (duration.indexOf('+') != -1) {
		var dur = duration.split('+');
		var seconds = Number(dur[0]);
		var frames = Number(dur[1]);
		var newDuration = seconds + frames / framerate;
	} else {
		var newDuration = Number(duration) / framerate;
	}

	if (bold.indexOf('+') != -1) {
		var boldDuration = bold.split('+');
		var boldSeconds = Number(boldDuration[0]);
		var boldFrames = Number(boldDuration[1]);
		var newBold = (boldSeconds + boldFrames) / framerate;
	} else {
		var newBold = Number(bold) / framerate;
	}

	if (selectItem.length != 0) {
		for (var i = 0; i < selectItem.length; i++) {
			var curSel = selectItem[i];

			app.beginUndoGroup('Change Duration');

			if (curSel instanceof CompItem) {
				if (curSel.frameRate != framerate) {
					curSel.frameRate = framerate;
				}

				if (curSel.parentFolder.name == folder) {
					curSel.duration = newDuration + newBold;
				} else {
					curSel.duration = newDuration;
					curSel.outPoint = newDuration;
				}

				if (nested) {
					for (var e = 1; e <= curSel.numLayers; e++) {
						if (curSel.layer(e).locked == false) {
							if (curSel.layer(e).source instanceof CompItem) {
								curSel.layer(e).source.frameRate = framerate;
								curSel.layer(e).source.duration = newDuration;

								for (var d = 1; d <= curSel.layer(e).source.numLayers; d++) {
									if (
										curSel.layer(e).source.layer(d).source instanceof CompItem
									) {
										curSel.layer(e).source.layer(d).source.frameRate =
											framerate;
										curSel.layer(e).source.layer(d).source.duration =
											newDuration;
									}
									curSel.layer(e).source.layer(d).outPoint = newDuration;
								}
							}

							curSel.layer(e).outPoint = newDuration;
						}
					}
				}
			}

			app.endUndoGroup();
		}
	} else {
		alert('Please select a composition');
	}
}
