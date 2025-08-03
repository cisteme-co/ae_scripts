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
	var projectFolder = getProjects()[project.index];
	var projectWorkFolder = projectFolder.path + '/' + projectFolder.name;
	var production = projectWorkFolder + '/production/compositing/';
	var templateFiles = projectWorkFolder + '/assets/templates/compositing';

	var thisTemplate = '';
	var allCuts = cuts.join('-');
	var cutFramerate = parseFloat(framerate);
	var bold = cutFramerate / 3 / cutFramerate;

	if (Folder(templateFiles).exists) {
		var files = Folder(templateFiles).getFiles();
		for (var i = 0; i < files.length; i++) {
			var templateFile = files[i];
			if (decodeURI(templateFile).indexOf('.aep') != -1) {
				var templateFileTake = templateFile.name.split('_')[3].split('.')[0];
				if (templateFileTake == takeCodes[take.index]) {
					thisTemplate = templateFile;
					break;
				}
			}
		}
	} else {
		alert('Oops! No Template folder for this project...');
		return;
	}

	if (thisTemplate != '') {
		app.project.close(CloseOptions.PROMPT_TO_SAVE_CHANGES);
		app.open(File(thisTemplate));

		app.project.timeDisplayType = TimeDisplayType.FRAMES;
		app.project.framesCountType = FramesCountType.FC_START_1;

		var templateName = thisTemplate.name.split('.')[0];
		var workComp = getComp('_work');
		var cameraComp = getComp('camera');
		var filtersComp = getComp('filters');
		var renderComp = getComp(templateName);

		for (var i = 0; i < cuts.length; i++) {
			var cut = cuts[i];
			var cutSeconds = parseFloat(seconds[i]);
			var cutFrames = parseFloat(frames[i]);
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
				.replace('00', episode)
				.replace('000', cut);
			newRender.duration = bold + duration;

			replaceComp('_work', newCamera, newWork);
			replaceComp('camera', newFilters, newCamera);
			replaceComp('filters', newRender, newFilters);
		}

		getFolder('000').remove();
		renderComp.remove();

		var newFilePath = production + '/' + episode.text + '/cuts/' + allCuts;
		if (!Folder(newFilePath).exists) {
			new Folder(newFilePath).create();
		}

		app.project.save(
			File(
				newFilePath +
					'/' +
					thisTemplate.name.replace('00', episode).replace('000', allCuts)
			)
		);

		renameWorker(workerInput.text);

		alert('c."' + allCuts + '" created!');
	} else {
		alert('Oops! No Template file for this project...');
	}
}
