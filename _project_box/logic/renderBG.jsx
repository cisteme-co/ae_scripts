// Capture the logic dir at eval time so $.fileName is reliable regardless of call site.
var _RENDER_BG_LOGIC_DIR = (function () {
	return new File($.fileName).parent;
})();

// Load locale first
$.evalFile(new File(_RENDER_BG_LOGIC_DIR.fsName + '/lib/locale.jsx'));

// On Japanese OS, override renderBG with the locale-safe implementation
if (getLanguage() === 'ja') {
	$.evalFile(new File(_RENDER_BG_LOGIC_DIR.fsName + '/_test/renderBG.jsx'));
}

function renderBG() {
	// ── Load modules ─────────────────────────────────────────────────────────
	var ld = _RENDER_BG_LOGIC_DIR.fsName;
	$.evalFile(new File(ld + '/lib/fsUtils.jsx'));
	$.evalFile(new File(ld + '/lib/tempDir.jsx'));
	$.evalFile(new File(ld + '/lib/renderQueueScan.jsx'));
	$.evalFile(new File(ld + '/lib/outputPathResolver.jsx'));
	$.evalFile(new File(ld + '/lib/aerenderCommand.win.jsx'));
	$.evalFile(new File(ld + '/lib/aerenderCommand.mac.jsx'));
	$.evalFile(new File(ld + '/lib/processLauncher.jsx'));
	$.evalFile(new File(ld + '/ui/selectItemsDialog.jsx'));

	try {
		var is_win_os = $.os.toLowerCase().indexOf('windows') >= 0;
		var timestamp = new Date().getTime();
		var tempDir = resolveTempDir(is_win_os);

		// ── 1. Validate project is saved ─────────────────────────────────────
		if (app.project.file == null) {
			alertSaveProjectFirst();
			app.project.saveWithDialog();
			if (app.project.file == null) return;
		}

		// ── 2. Scan the render queue ──────────────────────────────────────────
		var rq = app.project.renderQueue;
		var scan = scanRenderQueue(rq);
		if (!scan) {
			alertNoValidRenderQueue();
			return;
		}

		// ── 3. Item selection dialog (only when there are multiple items) ─────
		var selection = scan;
		if (scan.queueInfo.length >= 2) {
			selection = showSelectItemsDialog(scan.queueInfo, rq);
			if (!selection) return;
		}

		var queueInfo = selection.queueInfo;
		var compNames = selection.compNames;
		var totalFrames = selection.totalFrames;

		// ── 4. Resolve output paths; collect post-render move commands ────────
		var moveCommands = setOutputPaths(
			queueInfo,
			rq,
			timestamp,
			is_win_os,
			tempDir,
		);
		if (moveCommands === null) return;

		// ── 5. Save temp .aep; restore final paths in the main project ────────
		var af = app.project.file;
		var tmpAep = new File(tempDir + '/aerender_temp_' + timestamp + '.aep');
		var logFile = new File(tempDir + '/aerender_log_' + timestamp + '.txt');
		var pidFile = new File(tempDir + '/aerender_pid_' + timestamp + '.txt');

		try {
			if (is_win_os) {
				$.writeln('VERIFYING PATHS BEFORE SAVE...');
				for (var k = 0; k < queueInfo.length; k++) {
					var itemData = queueInfo[k];
					var item = rq.item(itemData.index);
					for (var m = 0; m < itemData.outputs.length; m++) {
						var outputData = itemData.outputs[m];
						if (!outputData.tempPath) continue;
						var om = item.outputModule(outputData.omIndex);
						if (
							om.file &&
							om.file.fsName.toLowerCase() !== outputData.tempPath.toLowerCase()
						) {
							$.writeln(
								'CRITICAL WARNING: Path reverted before save — forcing reset. Item ' +
									itemData.index +
									' Module ' +
									outputData.omIndex,
							);
							om.file = new File(outputData.tempPath);
							if (
								om.file.fsName.toLowerCase() !==
								outputData.tempPath.toLowerCase()
							) {
								throw new Error(
									'Unrecoverable path error for Item ' + itemData.index,
								);
							}
						}
					}
				}
			}

			$.writeln('Saving temporary project: ' + tmpAep.fsName);
			app.project.save(tmpAep);

			// Restore final (non-temp) paths so the user sees correct names in the Render Queue
			if (is_win_os) {
				$.writeln('Restoring main project paths to final destination...');
				for (var k = 0; k < queueInfo.length; k++) {
					var itemData = queueInfo[k];
					var item = rq.item(itemData.index);
					for (var m = 0; m < itemData.outputs.length; m++) {
						var outputData = itemData.outputs[m];
						if (outputData.finalPath) {
							try {
								item.outputModule(outputData.omIndex).file = new File(
									outputData.finalPath,
								);
							} catch (e) {
								$.writeln(
									'Error restoring path for item ' +
										itemData.index +
										': ' +
										e.toString(),
								);
							}
						}
					}
				}
			}

			$.writeln('Saving main project...');
			app.project.save(af);
		} catch (saveErr) {
			alert('Error saving:\n' + saveErr.toString());
			try {
				if (tmpAep.exists) tmpAep.remove();
			} catch (e) {}
			return;
		}

		// ── 6. Locate aerender executable ─────────────────────────────────────
		var aer;
		if (is_win_os) {
			aer = new File(Folder.appPackage.fullName + '/aerender.exe');
			if (!aer.exists) {
				var alt = new File(
					'C:\\Program Files\\Adobe\\Adobe After Effects 2025\\Support Files\\aerender.exe',
				);
				if (alt.exists) aer = alt;
			}
			if (!aer.exists) {
				alert('aerender.exe not found at:\n' + aer.fsName);
				return;
			}
		} else {
			aer = new File(Folder.appPackage.parent.fullName + '/aerender');
		}

		// ── 7. Write shell script ─────────────────────────────────────────────
		var shellCmdFile, cmd;
		if (is_win_os) {
			shellCmdFile = new File(tempDir + '/aerender_' + timestamp + '.bat');
			cmd = buildWinCommand(
				queueInfo,
				tmpAep,
				logFile,
				aer,
				moveCommands,
				timestamp,
				tempDir,
			);
		} else {
			shellCmdFile = new File(tempDir + '/aerender_' + timestamp + '.command');
			cmd = buildMacCommand(tmpAep, logFile, aer, shellCmdFile);
		}

		if (shellCmdFile.exists) shellCmdFile.remove();
		if (shellCmdFile.open('w')) {
			shellCmdFile.encoding = 'UTF-8';
			shellCmdFile.lineFeed = is_win_os ? 'Windows' : 'Unix'; // no BOM on Windows — breaks cmd.exe
			shellCmdFile.write(cmd);
			shellCmdFile.close();
		}
		if (!is_win_os)
			system.callSystem('chmod 755 "' + shellCmdFile.fullName + '"');

		// ── 8. Launch aerender in the background ──────────────────────────────
		launchShellCommand(shellCmdFile, is_win_os, timestamp, tempDir);

		// ── 9. Show monitoring panel ──────────────────────────────────────────
		try {
			var uiFile = new File(
				_RENDER_BG_LOGIC_DIR.parent.fsName + '/ui/renderBG_UI.jsx',
			);
			if (uiFile.exists) {
				$.evalFile(uiFile);
				if (typeof showRenderBG_UI === 'function') {
					showRenderBG_UI(
						compNames,
						tmpAep.fsName,
						totalFrames,
						logFile.fsName,
						pidFile.fsName,
					);
				}
			}
		} catch (uiErr) {}
	} catch (mainErr) {
		var errorMsg =
			'CRITICAL ERROR:\n' +
			mainErr.toString() +
			'\n\nLine: ' +
			(mainErr.line || 'unknown');
		$.writeln(errorMsg);
		alert(errorMsg);
		if (typeof logFile !== 'undefined' && logFile && logFile.exists)
			logFile.execute();
	}
}
