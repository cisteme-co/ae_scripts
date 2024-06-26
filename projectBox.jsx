"object" != typeof JSON && (JSON = {}), function () { "use strict"; var rx_one = /^[\],:{}\s]*$/, rx_two = /\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, rx_three = /"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, rx_four = /(?:^|:|,)(?:\s*\[)+/g, rx_escapable = /[\\"\u0000-\u001f\u007f-\u009f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g, rx_dangerous = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g, gap, indent, meta, rep; function f(t) { return t < 10 ? "0" + t : t } function this_value() { return this.valueOf() } function quote(t) { return rx_escapable.lastIndex = 0, rx_escapable.test(t) ? '"' + t.replace(rx_escapable, function (t) { var e = meta[t]; return "string" == typeof e ? e : "\\u" + ("0000" + t.charCodeAt(0).toString(16)).slice(-4) }) + '"' : '"' + t + '"' } function str(t, e) { var r, n, o, u, f, a = gap, i = e[t]; switch (i && "object" == typeof i && "function" == typeof i.toJSON && (i = i.toJSON(t)), "function" == typeof rep && (i = rep.call(e, t, i)), typeof i) { case "string": return quote(i); case "number": return isFinite(i) ? String(i) : "null"; case "boolean": case "null": return String(i); case "object": if (!i) return "null"; if (gap += indent, f = [], "[object Array]" === Object.prototype.toString.apply(i)) { for (u = i.length, r = 0; r < u; r += 1)f[r] = str(r, i) || "null"; return o = 0 === f.length ? "[]" : gap ? "[\n" + gap + f.join(",\n" + gap) + "\n" + a + "]" : "[" + f.join(",") + "]", gap = a, o } if (rep && "object" == typeof rep) for (u = rep.length, r = 0; r < u; r += 1)"string" == typeof rep[r] && (o = str(n = rep[r], i)) && f.push(quote(n) + (gap ? ": " : ":") + o); else for (n in i) Object.prototype.hasOwnProperty.call(i, n) && (o = str(n, i)) && f.push(quote(n) + (gap ? ": " : ":") + o); return o = 0 === f.length ? "{}" : gap ? "{\n" + gap + f.join(",\n" + gap) + "\n" + a + "}" : "{" + f.join(",") + "}", gap = a, o } } "function" != typeof Date.prototype.toJSON && (Date.prototype.toJSON = function () { return isFinite(this.valueOf()) ? this.getUTCFullYear() + "-" + f(this.getUTCMonth() + 1) + "-" + f(this.getUTCDate()) + "T" + f(this.getUTCHours()) + ":" + f(this.getUTCMinutes()) + ":" + f(this.getUTCSeconds()) + "Z" : null }, Boolean.prototype.toJSON = this_value, Number.prototype.toJSON = this_value, String.prototype.toJSON = this_value), "function" != typeof JSON.stringify && (meta = { "\b": "\\b", "\t": "\\t", "\n": "\\n", "\f": "\\f", "\r": "\\r", '"': '\\"', "\\": "\\\\" }, JSON.stringify = function (t, e, r) { var n; if (indent = gap = "", "number" == typeof r) for (n = 0; n < r; n += 1)indent += " "; else "string" == typeof r && (indent = r); if ((rep = e) && "function" != typeof e && ("object" != typeof e || "number" != typeof e.length)) throw new Error("JSON.stringify"); return str("", { "": t }) }), "function" != typeof JSON.parse && (JSON.parse = function (text, reviver) { var j; function walk(t, e) { var r, n, o = t[e]; if (o && "object" == typeof o) for (r in o) Object.prototype.hasOwnProperty.call(o, r) && (void 0 !== (n = walk(o, r)) ? o[r] = n : delete o[r]); return reviver.call(t, e, o) } if (text = String(text), rx_dangerous.lastIndex = 0, rx_dangerous.test(text) && (text = text.replace(rx_dangerous, function (t) { return "\\u" + ("0000" + t.charCodeAt(0).toString(16)).slice(-4) })), rx_one.test(text.replace(rx_two, "@").replace(rx_three, "]").replace(rx_four, ""))) return j = eval("(" + text + ")"), "function" == typeof reviver ? walk({ "": j }, "") : j; throw new SyntaxError("JSON.parse") }) }();

// UI
(
	function (thisObj) {
		projectBox_buildUI(thisObj)

		function projectBox_buildUI(thisObj) {

			// Vars
			var scriptPath = File($.fileName).path;
			var iconsPath = scriptPath + '/assets/projectsBox/';
			var framerates = [8, 12, 15, 23.976, 24, 29.97, 30]
			var takes = ['コンテ撮', '原撮', '3DCG撮', 'タイミング撮', '仮本撮', '本撮']
			var takesCodes = ['c1', 'g1', '3D_t1', 't1', 'v0', 'v1']

			// UI
			// Panel Window
			var panel = (thisObj instanceof Panel) ? thisObj : new Window("palette", "Projects Box", undefined, {
				resizeable: true
			});
			panel.spacing = 4

			// First Row
			var firstRow = panel.add('group');
			firstRow.orientation = 'row';
			firstRow.spacing = 5;
			var projectsDrop = firstRow.add('dropdownlist', undefined, []);
			populateDropDown(projectsDrop, getProjects());

			var episodeDrop = firstRow.add('dropdownlist', undefined, []);
			episodeDropdown(episodeDrop, getEpisodes(0));

			projectsDrop.onChange = function () {
				for (var i = 0; i < getProjects().length; i++) {
					if (projectsDrop.selection == i) {
						episodeDropdown(episodeDrop, getEpisodes(i))
					}
				}
			}

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
			newCut.onClick = function () { handleNewCut(projectsDrop, episodeDrop, cutInput, framerates, takes, takesCodes) };

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
			lastVersion.onClick = function () { openFile(projectsDrop, episodeDrop, cutInput) }

			var retimer = buttonGroup.add(
				'iconbutton',
				undefined,
				File(iconsPath + '04.png'),
				{ style: 'toolbutton' }
			);
			retimer.onClick = function () {
				var retimer = File(scriptPath + '/retimer.jsx')
				retimer.open()
				eval(retimer.read())
			}

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
			render.onClick = renderBG

			panel.add('panel', [0, 20, 420, 20]);

			// Second Row
			var secondRow = panel.add('group');
			secondRow.orientation = 'row';
			secondRow.spacing = 5;

			var workerGroup = secondRow.add('group');
			workerGroup.spacing = 0;
			workerGroup.add('statictext', undefined, '作業者');
			var workerInput = workerGroup.add('edittext', undefined, 'Lucas');
			workerInput.characters = 10;

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

			var retakeInput = secondRow.add('edittext', undefined, 'リテイク内容');
			retakeInput.characters = 25;

			// Return & Render Panel
			panel.onResizing = panel.onResize = function () {
				this.layout.resize();
			};;


			// Display Panel
			if (panel instanceof Window) {
				panel.center();
				panel.show();
			} else {
				panel.layout.layout(true);
				panel.layout.resize();
			}
		}

	})(this)

// New Panel Functions
function handleNewCut(projectsDrop, episodeDrop, cutInput, framerates, takes, takesCodes) {
	var win = new Window('dialog', 'New Cut')

	var masterGroup = win.add('group')

	var selectGroup = masterGroup.add('group')
	selectGroup.add('statictext', undefined, '作品名')
	var projectDrop = selectGroup.add('dropdownlist', undefined, [projectsDrop.selection.text])
	projectDrop.selection = 0
	projectDrop.enabled = false
	selectGroup.add('statictext', undefined, '話数')
	var episode = selectGroup.add('dropdownlist', undefined, [episodeDrop.selection.text])
	episode.selection = 0
	episode.enabled = false

	var maingroup = win.add("panel", undefined, 'カット');
	var buttonGroup = win.add('group')
	var addButton = buttonGroup.add('button', undefined, '+')
	addButton.onClick = function () { add_btn(cutInput.text) }
	var removeButton = buttonGroup.add('button', undefined, '-')
	removeButton.onClick = minus_btn

	var parametersGroup = win.add('group')
	parametersGroup.add('statictext', undefined, 'フレームレート')
	var framerateDrop = parametersGroup.add('dropdownlist', undefined, framerates)
	framerateDrop.selection = 4
	parametersGroup.add('statictext', undefined, 'テイク')
	var takesDrop = parametersGroup.add('dropdownlist', undefined, takes)
	takesDrop.selection = 1

	var createButton = win.add("button", undefined, "Create");
	createButton.onClick = function () {
		var cuts = []
		var seconds = []
		var frames = []
		var framerate = parseFloat(framerateDrop.selection.text)
		for (var n = 0; n < maingroup.children.length; n++) {
			cuts.push(maingroup.children[n].cutInput.text);
			seconds.push(maingroup.children[n].secondsInput.text);
			frames.push(maingroup.children[n].framesInput.text);
		}

		createCut(projectDrop.selection, episode.selection, cuts, framerate, takesDrop.selection, takesCodes, seconds, frames)

		win.close()
	}

	add_row(maingroup, cutInput.text);

	win.show();

	function add_row(maingroup, cut) {
		var group = maingroup.add("group");
		group.spacing = 4

		group.add('statictext', undefined, '番号')
		group.cutInput = group.add("edittext", undefined, cut);
		group.cutInput.characters = 4
		group.add('statictext', undefined, '尺')
		group.secondsInput = group.add('edittext', undefined, '6')
		group.secondsInput.characters = 3
		group.add('statictext', undefined, '+')
		group.framesInput = group.add('edittext', undefined, '0')
		group.framesInput.characters = 3

		group.index = maingroup.children.length - 1;
		win.layout.layout(true);
	}
	function add_btn(cut) {
		add_row(maingroup, cut);
	}
	function minus_btn() {
		if (maingroup.children.length > 1) {
			lastChild = maingroup.children[maingroup.children.length - 1]
			maingroup.remove(lastChild);
		}
		win.layout.layout(true);
	}
}

function createCut(project, episode, cuts, framerate, take, takeCodes, seconds, frames) {
	var projectFolder = getProjects()[project.index]
	var projectWorkFolder = projectFolder.path + '/' + projectFolder.name
	var production = projectWorkFolder + '/production/compositing/'
	var templateFiles = projectWorkFolder + '/assets/templates/compositing'
	var thisTemplate = '';
	var allCuts = cuts.join('-')
	var cutFramerate = parseFloat(framerate)
	var bold = (cutFramerate / 3) / cutFramerate;

	if (Folder(templateFiles).exists) {
		for (var i = 0; i <= Folder(templateFiles).getFiles().length; i++) {
			var templateFile = Folder(templateFiles).getFiles()[i]
			if (decodeURI(templateFile).indexOf('.aep') != -1) {
				var templateFileTake = templateFile.name.split('_')[3].split('.')[0]
				if (templateFileTake == takeCodes[take.index]) {
					thisTemplate = templateFile
				}
			}
		}
	} else {
		alert('Oops! No Template folder for this project...')
	}

	if (thisTemplate != '') {
		app.project.close(CloseOptions.PROMPT_TO_SAVE_CHANGES);
		app.open(File(thisTemplate))

		app.project.timeDisplayType = TimeDisplayType.FRAMES;
		app.project.framesCountType = FramesCountType.FC_START_1;

		var templateName = thisTemplate.name.split('.')[0];
		var frameComp = getComp('_frame')
		var workComp = getComp('_work')
		var cameraComp = getComp('camera')
		var filtersComp = getComp('filters')
		var renderComp = getComp(templateName)

		for (var i = 0; i < cuts.length; i++) {
			var cut = cuts[i]
			var cutSeconds = parseFloat(seconds[i])
			var cutFrames = parseFloat(frames[i])
			var duration = cutSeconds + (cutFrames / cutFramerate)

			var cutFolder = createFolder(cut, '', 'comps')

			var newFrame = frameComp.duplicate()
			newFrame.name = frameComp.name + '_' + cut
			newFrame.parentFolder = cutFolder
			newFrame.duration = duration
			var newWork = workComp.duplicate()
			newWork.name = workComp.name + '_' + cut
			newWork.parentFolder = cutFolder
			newWork.duration = duration
			var newCamera = cameraComp.duplicate()
			newCamera.name = cameraComp.name + '_' + cut
			newCamera.parentFolder = cutFolder
			newCamera.duration = duration
			var newFilters = filtersComp.duplicate()
			newFilters.name = filtersComp.name + '_' + cut
			newFilters.parentFolder = cutFolder
			newFilters.duration = duration
			var newRender = renderComp.duplicate()
			newRender.name = renderComp.name.replace('000', cut)
			newRender.duration = bold + duration

			replaceComp('_frame', newWork, newFrame)
			replaceComp('_work', newCamera, newWork)
			replaceComp('camera', newFilters, newCamera)
			replaceComp('filters', newRender, newFilters)
		}

		var newFilePath = production + '/' + episode.text + '/cuts/' + allCuts
		if (!Folder(newFilePath).exists) {
			new Folder(newFilePath).create()
		}

		app.project.save(File(newFilePath + "/" + thisTemplate.name.replace('000', allCuts)))

		alert('Cut "' + allCuts + '" created!')
	} else {
		alert('Oops! No Template file for this project...')
	}
}

function openFile(projects, episodes, cutInput) {
	var projectFolder = getProjects()[projects.selection.index]
	var projectWorkFolder = projectFolder.path + '/' + projectFolder.name
	var production = projectWorkFolder + '/production/compositing/'
	var episode = episodes.selection.text
	var cuts = production + "/" + episode + "/cuts/"
	var cut = cutInput.text

	var cutsFolder = Folder(cuts)
	var cutsFolders = cutsFolder.getFiles()
	var cutFolderName;
	var cutFile;

	for (var i = 0; i < cutsFolders.length; i++) {
		var cutFolder = cutsFolders[i]
		if (cutFolder.name.indexOf(cut) != -1) {
			cutFolderName = cutFolder.name
			break;
		}
	}

	if (cutFolderName) {
		var cutPath = cuts + cutFolderName
		var cutFolder = Folder(cutPath)
		var cutFiles = cutFolder.getFiles()

		for (var i = cutFiles.length - 1; i >= 0; i--) {
			if (cutFiles[i] instanceof File) {
				cutFile = cutFiles[i]
				break;
			}
		}

		if (cutFile) {
			app.project.close(CloseOptions.PROMPT_TO_SAVE_CHANGES);
			app.open(cutFile)
		} else {
			alert("No file in the " + cut + " folder")
		}

	} else {
		alert("The folder for " + cut + " doesn't exists")
	}
}

// Open Root Folder
function openRootFolder() {
	if (app.project.file == null) {
		alert("プロジェクトを保存してください。");
	} else {
		app.project.file.parent.execute();
	}
}

// Render BG
function renderBG() {
	var is_win_os = ($.os.toLowerCase().indexOf("windows") >= 0);

	function wq(s) {
		return "\"" + s + "\"";
	}

	if (app.project.file == null) {
		alert("プロジェクトを保存してください。");
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
		alert("有効なレンダーキューがありません。");
		return;
	}

	var proOp = "/low";
	var af = app.project.file;
	var tmpAep = new File(Folder.temp.fullName + "/" + "aerender_temp_.aep");

	app.project.save(tmpAep);
	app.project.save(af);

	var shellCmdFile = null;
	var cmd = "";
	var aer = null;
	if (is_win_os) {
		//windows batchファイル
		aer = new File(Folder.appPackage.fullName + "/aerender.exe");
		shellCmdFile = new File(Folder.temp.fullName + "/aerender.bat");
		cmd = "@echo off\r\n";
		cmd += "start \"\" /b " + proOp + " /wait ";
		cmd += wq(aer.fsName) + " -project " + wq(tmpAep.fsName) + " -sound ON\r\n";
		cmd += "del " + wq(tmpAep.fsName) + "\r\n";
	} else {
		// Mac shell script
		aer = new File(Folder.appPackage.parent.fullName + "/aerender");
		shellCmdFile = new File(Folder.temp.fullName + "/aerender.command");
		cmd = "#!/bin/sh\r\n";
		cmd += wq(aer.fsName) + " -project " + wq(tmpAep.fsName) + " -sound ON\r\n";
		cmd += "rm -f " + wq(tmpAep.fsName) + "\r\n";
	}
	if (shellCmdFile.exists == true) shellCmdFile.remove();
	if (shellCmdFile.open("w")) {
		try {
			shellCmdFile.encoding = "UTF-8";
			shellCmdFile.lineFeed = "Unix";
			shellCmdFile.write(cmd);
		} catch (e) {
			alert(e.toString());
		} finally {
			shellCmdFile.close();
		}
	}
	//Macの時は実行属性をつける
	if (is_win_os == false) {
		system.callSystem("chmod 755 " + wq(shellCmdFile.fullName));
	}
	if (shellCmdFile.exists == true) shellCmdFile.execute();
}

// Utils Functions
function replaceComp(replaceComp, sourceComp, newComp) {
	for (var i = 1; i <= sourceComp.layers.length; i++) {
		if (sourceComp.layers[i].source instanceof CompItem) {
			if (sourceComp.layers[i].source.name == replaceComp) {
				sourceComp.layers[i].replaceSource(newComp, true)
			}
		}
	}
}

function getFolder(theName) {
	for (var i = 1; i <= app.project.numItems; i++) {
		if (app.project.item(i).name == theName && app.project.item(i) instanceof FolderItem) {
			return app.project.item(i);
		}
	}
	return null;
}

//Get Comps　||　コンポ名をサーチ
function getComp(theName) {
	for (var i = 1; i <= app.project.numItems; i++) {
		if (app.project.item(i).name == theName && app.project.item(i) instanceof CompItem) {
			return app.project.item(i);
		}
	}
	return null;
}

//Get Comp through Parent Folder　||　親フォルダ名を使い、コンポをサーチ
function getCompParent(theName) {
	for (var i = 1; i <= app.project.numItems; i++) {
		if (app.project.item(i).parentFolder.name == theName && app.project.item(i) instanceof CompItem) {
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

	return false
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
			var workFolder = "~/work/"
			return workFolder
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
		var path = projectsFolders[i].path + '/' + projectsFolders[i].name + '/production/compositing/';
		var projectEpisodes = Folder(path).getFiles()
		if (i == index) {
			for (var e = 0; e < projectEpisodes.length; e++) {
				episodes.push(projectEpisodes[e]);
			}
		}
	}

	return episodes;
}

function populateDropDown(dropdown, items) {
	for (var i = 0; i < items.length; i++) {
		dropdown.add('item', items[i].name);
	}

	dropdown.selection = 0;
}

function episodeDropdown(dropdown, items) {
	dropdown.removeAll();
	populateDropDown(dropdown, items);
}