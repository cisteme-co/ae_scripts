// ────────────────────────────────────────────────
// Create Cut from Template with Duplicated Comps
// ────────────────────────────────────────────────
function createCut(
	project,
	episode,
	cuts,
	framerate,
	take,
	takeCodes,
	seconds,
	frames,
	workerInput
) {
	// ──────────────
	// Setup paths and variables
	// ──────────────
	var projectFolder = getProjects()[project.index];
	var projectWorkFolder = projectFolder.path + '/' + projectFolder.name;
	var production = projectWorkFolder + '/production/compositing/';
	var check = projectWorkFolder + '/to_send/撮影/check';
	var templateFiles = projectWorkFolder + '/assets/templates/compositing';

	var thisTemplate = '';
	var allCuts = cuts.join('-');
	var cutFramerate = parseFloat(framerate);
	var bold = cutFramerate / 3 / cutFramerate; // Seems like a small offset for duration

	// ──────────────
	// Validate template folder existence
	// ──────────────
	if (!Folder(templateFiles).exists) {
		Alerts && Alerts.alertNoTemplateFolder
			? Alerts.alertNoTemplateFolder()
			: alert('Oops! No Template folder for this project...');
		return;
	}

	// ──────────────
	// Find matching template file based on take code
	// ──────────────
	var files = Folder(templateFiles).getFiles('*.aep');
	for (var i = 0; i < files.length; i++) {
		var templateFile = files[i];
		try {
			var takeCodeFromFile = templateFile.name.split('_')[3].split('.')[0];
			if (takeCodeFromFile === takeCodes[take.index]) {
				thisTemplate = templateFile;
				break;
			}
		} catch (e) {
			alert(e);
			// Ignore malformed filenames
		}
	}

	// ──────────────
	// Validate template found
	// ──────────────
	if (thisTemplate === '') {
		Alerts && Alerts.alertNoTemplateFile
			? Alerts.alertNoTemplateFile()
			: alert('Oops! No Template file for this project...');
		return;
	}

	// ──────────────
	// Prepare output file path and check for existing cut
	// ──────────────
	var newFilePath = production + '/' + episode.text + '/cuts/' + allCuts;
	var outputFileName = thisTemplate.name
		.replace('00', episode.text)
		.replace('000', allCuts);
	var outputFile = new File(newFilePath + '/' + outputFileName);

	if (outputFile.exists) {
		Alerts && Alerts.alertCutExists
			? Alerts.alertCutExists(allCuts)
			: alert('Cut "' + allCuts + '" already exists. Operation cancelled.');
		return;
	}

	// ──────────────
	// Open template project
	// ──────────────
	app.project.close(CloseOptions.PROMPT_TO_SAVE_CHANGES);
	app.open(File(thisTemplate));

	// ──────────────
	// Set project time display to frames starting at 1
	// ──────────────
	app.project.timeDisplayType = TimeDisplayType.FRAMES;
	app.project.framesCountType = FramesCountType.FC_START_1;

	// ──────────────
	// Get important comps
	// ──────────────
	var templateName = thisTemplate.name.split('.')[0];
	var workComp = getComp('_work');
	var cameraComp = getComp('camera');
	var filtersComp = getComp('filters');
	var renderComp = getComp(templateName);
	var base3D = getComp('000_3d');
	if (base3D) base3D.name = allCuts + '_3d';

	// ──────────────
	// Duplicate and setup comps per cut
	// ──────────────
	for (var i = 0; i < cuts.length; i++) {
		var cut = cuts[i];
		var cutSeconds = parseFloat(seconds[i]) || 0;
		var cutFrames = parseFloat(frames[i]) || 0;
		var duration = cutSeconds + cutFrames / cutFramerate;

		var cutFolder = createFolder(cut, '', 'comps');

		var newWork = workComp.duplicate();
		newWork.name = workComp.name + '_' + cut;
		newWork.parentFolder = cutFolder;
		newWork.duration = duration;

		var newCamera = cameraComp.duplicate();
		newCamera.name = cameraComp.name + '_' + cut;
		newCamera.parentFolder = cutFolder;
		newCamera.duration = duration;

		var newFilters = filtersComp.duplicate();
		newFilters.name = filtersComp.name + '_' + cut;
		newFilters.parentFolder = cutFolder;
		newFilters.duration = duration;

		var newRender = renderComp.duplicate();
		newRender.name = renderComp.name
			.replace('00', episode.text)
			.replace('000', cut);
		newRender.duration = bold + duration;

		replaceComp('_work', newCamera, newWork);
		replaceComp('camera', newFilters, newCamera);
		replaceComp('filters', newRender, newFilters);

		// --- Create render folders ---
		// --- Prepare renders folder with today's date appended ---
		try {
			var today = new Date();
			var yyyy = today.getFullYear();
			var mm = padStart2(today.getMonth() + 1);
			var dd = padStart2(today.getDate());
			var dateSuffix = yyyy + mm + dd;

			if (
				typeof production !== 'string' ||
				!production.length ||
				!episode ||
				typeof episode.text !== 'string' ||
				!episode.text.length
			) {
				alert(
					'Invalid production path or episode text. Cannot create render folder.'
				);
				return;
			}

			var rendersPath =
				production + '/' + episode.text + '/renders/' + dateSuffix;
			var renderFolder = new Folder(rendersPath);
			if (!renderFolder.exists) {
				if (!renderFolder.create()) {
					alert('Failed to create render folder: ' + renderFolder.fsName);
					return;
				}
			}

			var checkFolder = new Folder(check);
			if (!checkFolder.exists) {
				if (!checkFolder.create()) {
					alert('Failed to create check folder: ' + checkFolder.fsName);
					return;
				}
			}

			// --- Add ProRes output ---
			var rqItem = app.project.renderQueue.items.add(newRender);

			// First output module (ProRes)
			var firstOM = rqItem.outputModules[1];
			firstOM.file = new File(
				renderFolder.fsName + '/' + newRender.name + '.mov'
			);
			applyOrCreateOM(rqItem, 1, 'Apple ProRes 422 HQ', {
				'Output File Info': {
					'Base Path': renderFolder.fsName,
					'File Name': newRender.name + '.mov',
				},
				'Video Output': {
					'Output Channels': 'RGB',
					Depth: 'Millions of Colors',
					Color: 'Premultiplied (Matted)',
				},
			});

			// Additional output modules (MP4 etc)
			var mp4Module = rqItem.outputModules.add();
			mp4Module.file = new File(
				checkFolder.fsName + '/' + newRender.name + '.mp4'
			);
			applyOrCreateOM(rqItem, 2, 'H.264 - Match Render Settings -  5 Mbps', {
				'Output File Info': {
					'Base Path': checkFolder.fsName,
					'File Name': newRender.name + '.mp4',
				},
				'Video Output': {
					'Output Channels': 'RGB',
					Depth: 'Millions of Colors',
					Color: 'Premultiplied (Matted)',
				},
			});
		} catch (e) {
			alert(e.toString());
		}
	}

	// ──────────────
	// Clean up template comps
	// ──────────────
	var folder000 = getFolder('000');
	if (folder000) folder000.remove();
	if (renderComp) renderComp.remove();

	// After creating newRender and setting its name/duration:

	// ──────────────
	// Rename worker input (assumes function handles validation)
	// ──────────────
	renameWorker(workerInput.text);

	// ──────────────
	// Create cuts folder if missing
	// ──────────────
	if (!Folder(newFilePath).exists) {
		new Folder(newFilePath).create();
	}

	// ──────────────
	// Save project as new cut file
	// ──────────────
	app.project.save(new File(newFilePath + '/' + outputFileName));

	// ──────────────
	// Open all _work_ comps in viewer
	// ──────────────
	for (var i = 1; i <= app.project.numItems; i++) {
		var item = app.project.item(i);
		if (item instanceof CompItem && item.name.indexOf('_work_') === 0) {
			item.openInViewer();
		}
	}

	// ──────────────
	// Success alert
	// ──────────────
	Alerts && Alerts.alertCutCreated
		? Alerts.alertCutCreated(allCuts)
		: alert('Cut "' + allCuts + '" created!');
}

function applyOrCreateOM(rqItem, moduleIndex, templateName, fallbackSettings) {
	var om = rqItem.outputModules[moduleIndex];

	if (hasTemplate(om, templateName)) {
		try {
			om.applyTemplate(templateName);
		} catch (e) {
			alert('Failed to apply template "' + templateName + '": ' + e.toString());
			safeSetSettings(om, fallbackSettings);
		}
	} else {
		alert('Missing Output Module Template: "' + templateName + '"');
		safeSetSettings(om, fallbackSettings);
	}
}

function hasTemplate(om, templateName) {
	for (var i = 0; i < om.templates.length; i++) {
		if (om.templates[i] === templateName) {
			return true;
		}
	}
	return false;
}

// Only set safe keys to avoid AE errors
function safeSetSettings(om, settings) {
	var allowedKeys = [
		'Output File Info',
		'Video Output',
		'Audio Output',
		'Channels',
		'Depth',
		'Color',
	];

	var filteredSettings = {};
	for (var key in settings) {
		if (allowedKeys.indexOf(key) !== -1) {
			filteredSettings[key] = settings[key];
		}
	}

	try {
		om.setSettings(filteredSettings);
	} catch (e) {
		alert('Failed to apply fallback settings: ' + e.toString());
	}
}

function padStart2(str) {
	str = String(str);
	return str.length < 2 ? '0' + str : str;
}
