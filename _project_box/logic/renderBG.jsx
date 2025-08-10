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
	var isWin = $.os.toLowerCase().indexOf('windows') >= 0;

	function quote(s) {
		return '"' + s + '"';
	}

	// 1. Check project saved
	if (app.project.file == null) {
		alertSaveProjectFirst();
		app.project.saveWithDialog();
		return;
	}

	// 2. Validate render queue items queued with valid output paths
	var rq = app.project.renderQueue;
	var rqHasValidItem = false;
	for (var i = 1; i <= rq.numItems; i++) {
		var rqItem = rq.item(i);
		if (rqItem.status === RQItemStatus.QUEUED && rqItem.numOutputModules > 0) {
			for (var j = 1; j <= rqItem.numOutputModules; j++) {
				var outFile = rqItem.outputModule(j).file;
				if (outFile != null && outFile.parent.exists) {
					rqHasValidItem = true;
					break;
				}
			}
		}
		if (rqHasValidItem) break;
	}
	if (!rqHasValidItem) {
		alertNoValidRenderQueue();
		return;
	}

	// 3. Save temp AEP file and the current project file
	var tmpAep = new File(Folder.temp.fullName + '/aerender_temp_.aep');
	app.project.save(tmpAep);
	app.project.save(app.project.file);

	// 4. Build shell command
	var shellCmdFile, cmd;
	if (isWin) {
		var aerenderExe = new File(Folder.appPackage.fullName + '/aerender.exe');
		shellCmdFile = new File(Folder.temp.fullName + '/aerender.bat');
		cmd = '@echo off\r\n';
		cmd +=
			'start "" /b /wait ' +
			quote(aerenderExe.fsName) +
			' -project ' +
			quote(tmpAep.fsName) +
			' -sound ON\r\n';
		cmd += 'del ' + quote(tmpAep.fsName) + '\r\n';
	} else {
		var aerenderUnix = new File(
			Folder.appPackage.parent.fullName + '/aerender'
		);
		shellCmdFile = new File(Folder.temp.fullName + '/aerender.command');
		cmd = '#!/bin/sh\r\n';
		cmd +=
			quote(aerenderUnix.fsName) +
			' -project ' +
			quote(tmpAep.fsName) +
			' -sound ON\r\n';
		cmd += 'rm -f ' + quote(tmpAep.fsName) + '\r\n';
	}

	// 5. Write command file
	if (shellCmdFile.exists) shellCmdFile.remove();
	if (shellCmdFile.open('w')) {
		try {
			shellCmdFile.encoding = 'UTF-8';
			shellCmdFile.lineFeed = 'Unix';
			shellCmdFile.write(cmd);
		} catch (e) {
			alert(e.toString());
			return;
		} finally {
			shellCmdFile.close();
		}
	}

	// 6. On Unix, make shell script executable
	if (!isWin) {
		system.callSystem('chmod 755 ' + quote(shellCmdFile.fullName));
	}

	// 7. Execute the shell command file
	if (shellCmdFile.exists) {
		shellCmdFile.execute();
	}
}
