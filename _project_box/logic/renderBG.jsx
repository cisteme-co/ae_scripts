// ──────────────
// Alert: Please save the project first
// ──────────────
function alertSaveProjectFirst() {
	var lang = getLanguage();
	var msg = '';
	switch (lang) {
		case 'japanese':
		case 'ja':
			msg = 'プロジェクトを保存してください。';
			break;
		// add other languages here as needed
		default:
			msg = 'Please save the project first.';
	}
	alert(msg);
}

// ──────────────
// Alert: No valid render queue found
// ──────────────
function alertNoValidRenderQueue() {
	var lang = getLanguage();
	var msg = '';
	switch (lang) {
		case 'japanese':
		case 'ja':
			msg = '有効なレンダーキューがありません。';
			break;
		// add other languages here as needed
		default:
			msg = 'There is no valid render queue.';
	}
	alert(msg);
}

// ──────────────
// Render Background by invoking aerender command with temp project copy
// ──────────────
function renderBG() {
	var is_win_os = $.os.toLowerCase().indexOf('windows') >= 0;

	function wq(s) {
		return '"' + s + '"';
	}

	if (app.project.file == null) {
		alertSaveProjectFirst();
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

		// Loop through render queue items
		for (var i = 1; i <= rq.numItems; i++) {
			var item = rq.item(i);

			if (item.numOutputModules > 0) {
				for (var j = 1; j <= item.numOutputModules; j++) {
					var om = item.outputModule(j);
					var renderFile = om.file;

					if (renderFile) {
						var ext = renderFile.name.split('.').pop().toLowerCase();
						var outputFolder;

						if (ext === 'mp4') {
							// Go 5 levels up from project file to reach 'to_send'
							var baseFolder = getNthParentFolders(app.project.file, 5);
							outputFolder = new Folder(
								baseFolder.fsName + '/to_send/撮影/check'
							);
						} else if (ext === 'mov') {
							// Go 3 levels up from project file to reach 'compositing/01'
							var baseFolder = getNthParentFolders(app.project.file, 2);
							outputFolder = new Folder(
								baseFolder.fsName + '/renders/' + getTodayYYYYMMDD()
							);
						} else {
							outputFolder = renderFile.parent;
						}

						// Make sure the folder exists
						if (!outputFolder.exists) outputFolder.create();

						// Set output file path: same name as comp, same extension
						var compName = item.comp.name;
						var newFilePath = new File(
							outputFolder.fsName + '/' + compName + '.' + ext
						);
						om.file = newFilePath;
					}
				}
			}
		}
	}
	if (rqOK == false) {
		alertNoValidRenderQueue();
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

function getNthParentFolders(startFileOrFolder, n) {
	var folder =
		startFileOrFolder instanceof Folder
			? startFileOrFolder
			: startFileOrFolder.parent;
	for (var i = 0; i < n; i++) {
		if (folder && folder.parent != null) {
			folder = folder.parent;
		} else {
			break;
		}
	}
	return folder;
}

function getTodayYYYYMMDD() {
	var today = new Date();
	var yyyy = today.getFullYear();
	var mm = ('0' + (today.getMonth() + 1)).slice(-2);
	var dd = ('0' + today.getDate()).slice(-2);
	return '' + yyyy + mm + dd;
}
