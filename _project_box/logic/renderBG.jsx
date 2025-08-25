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
