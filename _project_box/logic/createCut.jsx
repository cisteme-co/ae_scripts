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
	}

	// ──────────────
	// Clean up template comps
	// ──────────────
	var folder000 = getFolder('000');
	if (folder000) folder000.remove();
	if (renderComp) renderComp.remove();

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
