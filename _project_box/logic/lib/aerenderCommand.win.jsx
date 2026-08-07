//@target aftereffects
// Depends on: fsUtils.jsx (getShortPath)

/**
 * Builds the Windows .bat file content for an aerender background render.
 * Renders are sent to ASCII temp paths (already set in queueInfo); the
 * returned moveCommands list is appended to the script to relocate files after.
 *
 * @param {Array}    queueInfo
 * @param {File}     tmpAep
 * @param {File}     logFile
 * @param {File}     aer          aerender.exe
 * @param {string[]} moveCommands PowerShell move lines from outputPathResolver
 * @returns {string}
 */
function buildWinCommand(queueInfo, tmpAep, logFile, aer, moveCommands) {
	function wq(s) {
		return '"' + s + '"';
	}
	var aerShort = getShortPath(aer);
	var cmd = '';

	cmd += '@echo off\r\n';
	cmd += 'chcp 65001 >nul\r\n';
	cmd += 'echo Starting render...\r\n';
	// Write start marker immediately so the UI panel can detect launch
	cmd += 'echo RENDER_STARTED > ' + wq(logFile.fsName) + '\r\n';

	for (var rIdx = 0; rIdx < queueInfo.length; rIdx++) {
		var rItem = queueInfo[rIdx];
		cmd +=
			'echo Rendering Item ' +
			(rIdx + 1) +
			' (Index ' +
			rItem.index +
			')...\r\n';

		var itemCmd =
			wq(aerShort) +
			' -project ' +
			wq(tmpAep.fsName) +
			' -rqindex ' +
			rItem.index;
		var hasTempPath = false;

		for (var oIdx = 0; oIdx < rItem.outputs.length; oIdx++) {
			var oData = rItem.outputs[oIdx];
			if (!oData.tempPath) continue;
			if (/[^\x00-\x7F]/.test(oData.tempPath)) {
				cmd +=
					'echo WARNING: Non-ASCII characters in temp path for Module ' +
					oData.omIndex +
					'\r\n';
			}
			hasTempPath = true;
			cmd +=
				'echo   Module ' + oData.omIndex + ' -> ' + wq(oData.tempPath) + '\r\n';
		}

		if (hasTempPath) {
			// Paths are baked into the saved .aep; -output flags are intentionally omitted.
			itemCmd += ' -sound ON >> ' + wq(logFile.fsName) + ' 2>&1\r\n';
			cmd += itemCmd;
			cmd +=
				'if %ERRORLEVEL% NEQ 0 echo Error rendering item ' +
				(rIdx + 1) +
				' >> ' +
				wq(logFile.fsName) +
				'\r\n';
			cmd += 'timeout /t 2 /nobreak >nul\r\n';
		}
	}

	if (moveCommands.length > 0) {
		cmd += 'echo Moving files to destination...\r\n';
		for (var mi = 0; mi < moveCommands.length; mi++) {
			cmd += moveCommands[mi] + '\r\n';
		}
	}

	cmd += 'echo Cleaning up...\r\n';
	cmd +=
		'if exist ' +
		wq(tmpAep.fsName) +
		' del ' +
		wq(tmpAep.fsName) +
		' 2>nul\r\n';
	cmd += 'timeout /t 2 /nobreak >nul\r\n';
	cmd += 'echo Render process finished.\r\n';
	// Final marker signals the UI panel that the render is complete
	cmd +=
		'echo AERENDER FINISHED - Render process finished. >> ' +
		wq(logFile.fsName) +
		' 2>&1\r\n';
	cmd += 'exit\r\n';

	return cmd;
}
