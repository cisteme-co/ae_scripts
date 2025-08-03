function renderBG() {
	var is_win_os = $.os.toLowerCase().indexOf('windows') >= 0;

	function wq(s) {
		return '"' + s + '"';
	}

	if (app.project.file == null) {
		alert(getMessage('save_project'));
		app.project.saveWithDialog();
	}

	var rq = app.project.renderQueue;
	var rqOK = false;

	if (rq.numItems > 0) {
		for (var i = 1; i <= rq.numItems; i++) {
			if (rq.item(i).status == RQItemStatus.QUEUED) {
				if (rq.item(i).numOutputModules > 0) {
					for (var j = 1; j <= rq.item(i).numOutputModules; j++) {
						var omFile = rq.item(i).outputModule(j).file;
						if (omFile != null && omFile.parent.exists) {
							rqOK = true;
							break;
						}
					}
				}
			}
			if (rqOK) break;
		}
	}

	if (!rqOK) {
		alert(getMessage('no_valid_queue'));
		return;
	}

	var proOp = '/low';
	var af = app.project.file;
	var tmpAep = new File(Folder.temp.fullName + '/aerender_temp_.aep');

	app.project.save(tmpAep);
	app.project.save(af);

	var shellCmdFile = null;
	var cmd = '';
	var aer = null;

	if (is_win_os) {
		aer = new File(Folder.appPackage.fullName + '/aerender.exe');
		shellCmdFile = new File(Folder.temp.fullName + '/aerender.bat');
		cmd = '@echo off\r\n';
		cmd += 'start "" /b ' + proOp + ' /wait ';
		cmd += wq(aer.fsName) + ' -project ' + wq(tmpAep.fsName) + ' -sound ON\r\n';
		cmd += 'del ' + wq(tmpAep.fsName) + '\r\n';
	} else {
		aer = new File(Folder.appPackage.parent.fullName + '/aerender');
		shellCmdFile = new File(Folder.temp.fullName + '/aerender.command');
		cmd = '#!/bin/sh\r\n';
		cmd += wq(aer.fsName) + ' -project ' + wq(tmpAep.fsName) + ' -sound ON\r\n';
		cmd += 'rm -f ' + wq(tmpAep.fsName) + '\r\n';
	}

	if (shellCmdFile.exists) shellCmdFile.remove();

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

	if (!is_win_os) {
		system.callSystem('chmod 755 ' + wq(shellCmdFile.fullName));
	}

	if (shellCmdFile.exists) shellCmdFile.execute();
}

function getMessage(key) {
	var messages = {
		save_project: {
			en: 'Please save the project first.',
			ja: 'プロジェクトを保存してください。',
		},
		no_valid_queue: {
			en: 'There is no valid render queue.',
			ja: '有効なレンダーキューがありません。',
		},
	};

	var locale = $.locale.substring(0, 2); // e.g., "ja_JP" → "ja"
	var langMessages = messages[key];
	if (!langMessages) return key;
	return langMessages[locale] || langMessages['en'];
}
