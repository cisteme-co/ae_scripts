(function (thisObj) {
	var section = 'ProjectsBoxPrefs'; // arbitrary name for your prefs section

	// Get the folder path of the current script
	var scriptFolder = File($.fileName).parent;

	// Build full path to json2.js
	var json2File = new File(scriptFolder.fsName + '/assets/json2.js');

	// Load json2.js, so JSON.parse and JSON.stringify are defined if missing
	if (json2File.exists) {
		$.evalFile(json2File);
	} else {
		alert('json2.js not found!');
	}

	// Build UI function
	function buildUI(thisObj) {
		// Utils
		var scriptPath = File($.fileName).path;
		var iconsPath = scriptPath + '/assets/projectsBox/';
		var framerates = [8, 12, 15, 23.976, 24, 29.97, 30];
		var takes = [
			'コンテ撮',
			'原撮',
			'3DCG撮',
			'タイミング撮',
			'仮本撮',
			'本撮',
		];
		var takesCodes = ['c1', 'g1', '3D_t1', 't1', 'v0', 'v1'];

		// UI
		var panel =
			thisObj instanceof Panel
				? thisObj
				: new Window('palette', 'Projects Box', undefined, {
						resizeable: true,
				  });
		panel.spacing = 4;

		var firstRow = panel.add('group');
		firstRow.orientation = 'row';
		firstRow.spacing = 5;

		var projectsDrop = firstRow.add('dropdownlist', undefined, []);
		projectsDrop.preferredSize.width = 100;
		var episodeDrop = firstRow.add('dropdownlist', undefined, []);
		var cutInput = firstRow.add('edittext', undefined, '000');
		cutInput.characters = 3;

		var buttonGroup = firstRow.add('group');
		buttonGroup.orientation = 'row';
		buttonGroup.spacing = 0;

		var newCut = buttonGroup.add(
			'iconbutton',
			undefined,
			File(iconsPath + '02.png'),
			{ style: 'toolbutton' }
		);
		newCut.onClick = function () {
			handleNewCut(
				projectsDrop,
				episodeDrop,
				cutInput,
				framerates,
				takes,
				takesCodes
			);
		};

		var importFiles = buttonGroup.add(
			'iconbutton',
			undefined,
			File(iconsPath + '01.png'),
			{ style: 'toolbutton' }
		);

		var lastVersion = buttonGroup.add(
			'iconbutton',
			undefined,
			File(iconsPath + '03.png'),
			{ style: 'toolbutton' }
		);
		lastVersion.onClick = function () {
			openFile(projectsDrop, episodeDrop, cutInput);
		};

		var retimer = buttonGroup.add(
			'iconbutton',
			undefined,
			File(iconsPath + '04.png'),
			{ style: 'toolbutton' }
		);
		retimer.onClick = function () {
			var retimer = File(scriptPath + '/retimer.jsx');
			retimer.open();
			eval(retimer.read());
		};

		var timesheet = buttonGroup.add(
			'iconbutton',
			undefined,
			File(iconsPath + '05.png'),
			{ style: 'toolbutton' }
		);

		var location = buttonGroup.add(
			'iconbutton',
			undefined,
			File(iconsPath + '06.png'),
			{ style: 'toolbutton' }
		);
		location.onClick = openRootFolder;

		var fileReplace = buttonGroup.add(
			'iconbutton',
			undefined,
			File(iconsPath + '07.png'),
			{ style: 'toolbutton' }
		);

		var removeUnused = buttonGroup.add(
			'iconbutton',
			undefined,
			File(iconsPath + '08.png'),
			{ style: 'toolbutton' }
		);

		var render = buttonGroup.add(
			'iconbutton',
			undefined,
			File(iconsPath + '09.png'),
			{ style: 'toolbutton' }
		);
		render.onClick = renderBG;

		panel.add('panel', [0, 20, 420, 20]);

		// Second Row
		var secondRow = panel.add('group');
		secondRow.orientation = 'row';
		secondRow.spacing = 5;

		var workerGroup = secondRow.add('group');
		workerGroup.spacing = 0;
		workerGroup.add('statictext', undefined, 'Worker');

		var workerKey = 'workerName';
		var defaultWorker = $.getenv('COMPUTERNAME') || 'Worker';
		var savedWorker = app.settings.haveSetting(section, workerKey)
			? app.settings.getSetting(section, workerKey)
			: defaultWorker;

		var workerInput = workerGroup.add('edittext', undefined, savedWorker);
		workerInput.characters = 10;

		workerInput.onChange = function () {
			app.settings.saveSetting(section, workerKey, workerInput.text);

			renameWorker();
		};

		secondRow.add('panel', [100, 0, 103, 20]);

		var takeGroup = secondRow.add('group');
		takeGroup.spacing = 0;
		var takeInput = takeGroup.add('edittext', undefined, '--');
		takeInput.characters = 3;
		var takeButton = takeGroup.add(
			'iconbutton',
			undefined,
			File(iconsPath + '02.png'),
			{ style: 'toolbutton' }
		);

		secondRow.add('panel', [100, 0, 103, 20]);

		var retakeInput = secondRow.add('edittext', undefined, 'Retake');
		retakeInput.characters = 25;

		// Return & Render Panel
		panel.onResizing = panel.onResize = function () {
			this.layout.resize();
		};

		// Display Panel
		if (panel instanceof Window) {
			panel.center();
			panel.show();
		} else {
			panel.layout.layout(true);
			panel.layout.resize();
		}

		// Populate projects dropdown
		populateDropDown(projectsDrop, getProjects());

		// Load saved project selection if exists, else default 0
		if (app.settings.haveSetting(section, 'projectsDropIndex')) {
			var savedProjIndex = parseInt(
				app.settings.getSetting(section, 'projectsDropIndex'),
				10
			);
			if (savedProjIndex >= 0 && savedProjIndex < projectsDrop.items.length) {
				projectsDrop.selection = savedProjIndex;
			} else {
				projectsDrop.selection = 0;
			}
		} else {
			projectsDrop.selection = 0;
		}

		// Populate episodes for the selected project
		function refreshEpisodes(selectedProjectIndex) {
			var episodes = getEpisodes(selectedProjectIndex);
			episodeDropdown(episodeDrop, episodes);

			// Load saved episode selection if exists
			if (app.settings.haveSetting(section, 'episodeDropIndex')) {
				var savedEpisodeIndex = parseInt(
					app.settings.getSetting(section, 'episodeDropIndex'),
					10
				);
				if (
					savedEpisodeIndex >= 0 &&
					savedEpisodeIndex < episodeDrop.items.length
				) {
					episodeDrop.selection = savedEpisodeIndex;
				} else {
					episodeDrop.selection = 0;
				}
			} else {
				episodeDrop.selection = 0;
			}
		}

		// Initially load episodes for the saved or default project
		refreshEpisodes(projectsDrop.selection.index);

		if (app.settings.haveSetting(section, 'cutInputText')) {
			cutInput.text = app.settings.getSetting(section, 'cutInputText');
		} else {
			cutInput.text = '000';
		}

		// When project changes, update episodes and save project selection
		projectsDrop.onChange = function () {
			var newProjIndex = projectsDrop.selection.index;
			refreshEpisodes(newProjIndex);

			// Save selected project index
			app.settings.saveSetting(
				section,
				'projectsDropIndex',
				String(newProjIndex)
			);
			// Reset episode selection saved index to 0 or clear?
			app.settings.saveSetting(section, 'episodeDropIndex', '0');
		};

		// When episode changes, save episode selection
		episodeDrop.onChange = function () {
			var newEpIndex = episodeDrop.selection.index;
			app.settings.saveSetting(section, 'episodeDropIndex', String(newEpIndex));
		};

		cutInput.onChanging = function () {
			app.settings.saveSetting(section, 'cutInputText', cutInput.text);
		};

		// Show panel
		if (panel instanceof Window) {
			panel.center();
			panel.show();
		} else {
			panel.layout.layout(true);
			panel.layout.resize();
		}
	}
	// Your existing functions:
	function populateDropDown(dropdown, items) {
		dropdown.removeAll();
		for (var i = 0; i < items.length; i++) {
			dropdown.add('item', items[i].name);
		}
	}

	function episodeDropdown(dropdown, items) {
		populateDropDown(dropdown, items);
	}

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

		return false;
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

	function getEpisodes(index) {
		var projectsFolders = getProjects();
		var episodes = [];

		for (var i = 0; i < projectsFolders.length; i++) {
			var path =
				projectsFolders[i].path +
				'/' +
				projectsFolders[i].name +
				'/production/compositing/';
			var projectEpisodes = Folder(path).getFiles();
			if (i == index) {
				for (var e = 0; e < projectEpisodes.length; e++) {
					episodes.push(projectEpisodes[e]);
				}
			}
		}

		return episodes;
	}

	buildUI(thisObj);
})(this);

function handleNewCut(
	projectsDrop,
	episodeDrop,
	cutInput,
	framerates,
	takes,
	takesCodes
) {
	var section = 'ProjectsBoxPrefs'; // reuse your existing section name
	var framerateKey = 'framerateSelection';
	var takeKey = 'takeSelection';
	var savedFramerateIndex = app.settings.haveSetting(section, framerateKey)
		? parseInt(app.settings.getSetting(section, framerateKey), 10)
		: 4;

	var savedTakeIndex = app.settings.haveSetting(section, takeKey)
		? parseInt(app.settings.getSetting(section, takeKey), 10)
		: 1;

	var win = new Window('dialog', 'New Cut');
	win.preferredSize.width = 400;

	var masterGroup = win.add('group');

	var selectGroup = masterGroup.add('group');
	selectGroup.add('statictext', undefined, 'Project');
	var projectDrop = selectGroup.add('dropdownlist', undefined, [
		projectsDrop.selection.text,
	]);
	projectDrop.selection = 0;
	projectDrop.enabled = false;
	selectGroup.add('statictext', undefined, 'Episode');
	var episode = selectGroup.add('dropdownlist', undefined, [
		episodeDrop.selection.text,
	]);
	episode.selection = 0;
	episode.enabled = false;

	var maingroup = win.add('panel', undefined, 'Cut');
	var buttonGroup = win.add('group');
	var addButton = buttonGroup.add('button', undefined, '+');
	addButton.onClick = function () {
		add_btn(cutInput.text);
	};
	var removeButton = buttonGroup.add('button', undefined, '-');
	removeButton.onClick = minus_btn;

	var parametersGroup = win.add('group');
	parametersGroup.add('statictext', undefined, 'Framerate');

	var framerateDrop = parametersGroup.add(
		'dropdownlist',
		undefined,
		framerates
	);
	framerateDrop.selection = Math.min(
		savedFramerateIndex,
		framerates.length - 1
	);
	framerateDrop.onChange = function () {
		app.settings.saveSetting(
			section,
			framerateKey,
			framerateDrop.selection.index.toString()
		);
	};

	parametersGroup.add('statictext', undefined, 'Take');

	var takesDrop = parametersGroup.add('dropdownlist', undefined, takes);
	takesDrop.selection = Math.min(savedTakeIndex, takes.length - 1);
	takesDrop.onChange = function () {
		app.settings.saveSetting(
			section,
			takeKey,
			takesDrop.selection.index.toString()
		);
	};

	var createButton = win.add('button', undefined, 'Create');
	createButton.onClick = function () {
		var cuts = [];
		var seconds = [];
		var frames = [];
		var framerate = parseFloat(framerateDrop.selection.text);
		for (var n = 0; n < maingroup.children.length; n++) {
			cuts.push(maingroup.children[n].cutInput.text);
			seconds.push(maingroup.children[n].secondsInput.text);
			frames.push(maingroup.children[n].framesInput.text);
		}

		createCut(
			projectDrop.selection,
			episode.selection,
			cuts,
			framerate,
			takesDrop.selection,
			takesCodes,
			seconds,
			frames
		);

		win.close();
	};

	add_row(maingroup, cutInput.text);

	win.show();

	function add_row(maingroup, cut) {
		var group = maingroup.add('group');
		group.spacing = 4;

		var noLabel = group.add('statictext', undefined, ' No.');
		noLabel.preferredSize.width = 30;
		group.cutInput = group.add('edittext', undefined, cut);
		group.cutInput.characters = 4;
		group.add('statictext', undefined, 'TIME (');
		group.secondsInput = group.add('edittext', undefined, '6');
		group.secondsInput.characters = 3;
		group.add('statictext', undefined, '+');
		group.framesInput = group.add('edittext', undefined, '0');
		group.framesInput.characters = 3;
		group.add('statictext', undefined, ')');

		group.index = maingroup.children.length - 1;
		win.layout.layout(true);
	}
	function add_btn(cut) {
		add_row(maingroup, cut);
	}
	function minus_btn() {
		if (maingroup.children.length > 1) {
			lastChild = maingroup.children[maingroup.children.length - 1];
			maingroup.remove(lastChild);
		}
		win.layout.layout(true);
	}
}

function createCut(
	project,
	episode,
	cuts,
	framerate,
	take,
	takeCodes,
	seconds,
	frames
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
		for (var i = 0; i <= Folder(templateFiles).getFiles().length; i++) {
			var templateFile = Folder(templateFiles).getFiles()[i];
			if (decodeURI(templateFile).indexOf('.aep') != -1) {
				var templateFileTake = templateFile.name.split('_')[3].split('.')[0];
				if (templateFileTake == takeCodes[take.index]) {
					thisTemplate = templateFile;
				}
			}
		}
	} else {
		alert('Oops! No Template folder for this project...');
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

		renameWorker();

		alert('Cut "' + allCuts + '" created!');
	} else {
		alert('Oops! No Template file for this project...');
	}
}

function openFile(projects, episodes, cutInput) {
	var projectFolder = getProjects()[projects.selection.index];
	var projectWorkFolder = projectFolder.path + '/' + projectFolder.name;
	var production = projectWorkFolder + '/production/compositing/';
	var episode = episodes.selection.text;
	var cuts = production + '/' + episode + '/cuts/';
	var cut = cutInput.text;

	var cutsFolder = Folder(cuts);
	var cutsFolders = cutsFolder.getFiles();
	var cutFolderName;
	var cutFile;

	for (var i = 0; i < cutsFolders.length; i++) {
		var cutFolder = cutsFolders[i];
		if (cutFolder.name.indexOf(cut) != -1) {
			cutFolderName = cutFolder.name;
			break;
		}
	}

	if (cutFolderName) {
		var cutPath = cuts + cutFolderName;
		var cutFolder = Folder(cutPath);
		var cutFiles = cutFolder.getFiles();

		for (var i = cutFiles.length - 1; i >= 0; i--) {
			if (cutFiles[i] instanceof File) {
				cutFile = cutFiles[i];
				break;
			}
		}

		if (cutFile) {
			app.project.close(CloseOptions.PROMPT_TO_SAVE_CHANGES);
			app.open(cutFile);
		} else {
			alert('No file in the ' + cut + ' folder');
		}
	} else {
		alert('The folder for ' + cut + " doesn't exists");
	}
}

// Open Root Folder
function openRootFolder() {
	if (app.project.file == null) {
		alert('プロジェクトを保存してください。');
	} else {
		app.project.file.parent.execute();
	}
}

// Render BG
function renderBG() {
	var is_win_os = $.os.toLowerCase().indexOf('windows') >= 0;

	function wq(s) {
		return '"' + s + '"';
	}

	if (app.project.file == null) {
		alert('プロジェクトを保存してください。');
		app.project.saveWithDialog();
	}

	var rq = app.project.renderQueue;
	var rqOK = false;
	if (rq.numItems > 0) {
		for (var i = 1; i <= rq.numItems; i++) {
			if (rq.item(i).status == RQItemStatus.QUEUED) {
				if (rq.item(i).numOutputModules > 0) {
					for (var j = 1; j <= rq.item(i).numOutputModules; j++) {
						if (rq.item(i).outputModule(j).file != null)
							if (rq.item(i).outputModule(j).file.parent.exists == true) {
								rqOK = true;
								break;
							}
					}
				}
			}
			if (rqOK == true) break;
		}
	}
	if (rqOK == false) {
		alert('有効なレンダーキューがありません。');
		return;
	}

	var proOp = '/low';
	var af = app.project.file;
	var tmpAep = new File(Folder.temp.fullName + '/' + 'aerender_temp_.aep');

	app.project.save(tmpAep);
	app.project.save(af);

	var shellCmdFile = null;
	var cmd = '';
	var aer = null;
	if (is_win_os) {
		//windows batchファイル
		aer = new File(Folder.appPackage.fullName + '/aerender.exe');
		shellCmdFile = new File(Folder.temp.fullName + '/aerender.bat');
		cmd = '@echo off\r\n';
		cmd += 'start "" /b ' + proOp + ' /wait ';
		cmd += wq(aer.fsName) + ' -project ' + wq(tmpAep.fsName) + ' -sound ON\r\n';
		cmd += 'del ' + wq(tmpAep.fsName) + '\r\n';
	} else {
		// Mac shell script
		aer = new File(Folder.appPackage.parent.fullName + '/aerender');
		shellCmdFile = new File(Folder.temp.fullName + '/aerender.command');
		cmd = '#!/bin/sh\r\n';
		cmd += wq(aer.fsName) + ' -project ' + wq(tmpAep.fsName) + ' -sound ON\r\n';
		cmd += 'rm -f ' + wq(tmpAep.fsName) + '\r\n';
	}
	if (shellCmdFile.exists == true) shellCmdFile.remove();
	if (shellCmdFile.open('w')) {
		try {
			shellCmdFile.encoding = 'UTF-8';
			shellCmdFile.lineFeed = 'Unix';
			shellCmdFile.write(cmd);
		} catch (e) {
			alert(e.toString());
		} finally {
			shellCmdFile.close();
		}
	}
	//Macの時は実行属性をつける
	if (is_win_os == false) {
		system.callSystem('chmod 755 ' + wq(shellCmdFile.fullName));
	}
	if (shellCmdFile.exists == true) shellCmdFile.execute();
}

// Utils Functions
function replaceComp(replaceComp, sourceComp, newComp) {
	for (var i = 1; i <= sourceComp.layers.length; i++) {
		if (sourceComp.layers[i].source instanceof CompItem) {
			if (sourceComp.layers[i].source.name == replaceComp) {
				sourceComp.layers[i].replaceSource(newComp, true);
			}
		}
	}
}

function getFolder(theName) {
	for (var i = 1; i <= app.project.numItems; i++) {
		if (
			app.project.item(i).name == theName &&
			app.project.item(i) instanceof FolderItem
		) {
			return app.project.item(i);
		}
	}
	return null;
}

//Get Comps　||　コンポ名をサーチ
function getComp(theName) {
	for (var i = 1; i <= app.project.numItems; i++) {
		if (
			app.project.item(i).name == theName &&
			app.project.item(i) instanceof CompItem
		) {
			return app.project.item(i);
		}
	}
	return null;
}

//Get Comp through Parent Folder　||　親フォルダ名を使い、コンポをサーチ
function getCompParent(theName) {
	for (var i = 1; i <= app.project.numItems; i++) {
		if (
			app.project.item(i).parentFolder.name == theName &&
			app.project.item(i) instanceof CompItem
		) {
			return app.project.item(i);
		}
	}
	return null;
}

function createFolder(name, comment, parent) {
	var folder = app.project.items.addFolder(name);
	folder.comment = comment;

	if (parent == undefined) {
		null;
	} else {
		var thisParent = getFolder(parent);
		folder.parentFolder = thisParent;
	}

	return folder;
}

function getLayer(compName, layerName) {
	var comp = compName;

	for (var i = 1; i <= comp.numLayers; i++) {
		var layer = comp.layers[i];
		if (layer.name == layerName) {
			return layer;
		}
	}
}

function renameWorker() {
	var outputFolder = getFolder('output');
	if (outputFolder) {
		for (var i = 1; i <= app.project.numItems; i++) {
			var item = app.project.item(i);
			if (item instanceof CompItem && item.parentFolder === outputFolder) {
				for (var l = 1; l <= item.numLayers; l++) {
					var layer = item.layer(l);
					if (layer.name === 'worker' && layer instanceof TextLayer) {
						layer.text.sourceText.setValue(workerInput.text);
					}
				}
			}
		}
	}
}
