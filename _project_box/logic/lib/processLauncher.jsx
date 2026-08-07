//@target aftereffects

/**
 * Launches the shell script non-blocking.
 * On Windows a hidden VBScript wrapper is used so no CMD window appears.
 * The VBS file is scheduled for deletion 5 s after launch.
 *
 * @param {File}    shellCmdFile  .bat or .command to execute
 * @param {boolean} is_win_os
 * @param {number}  timestamp     used to give the VBS file a unique name
 * @param {string}  tempDir       ASCII-safe temp directory from resolveTempDir()
 */
function launchShellCommand(shellCmdFile, is_win_os, timestamp, tempDir) {
	if (!shellCmdFile.exists) return;
	$.sleep(500);

	if (is_win_os) {
		var vbsFile = new File(
			tempDir + '/aerender_launcher_' + timestamp + '.vbs',
		);
		if (vbsFile.open('w')) {
			// windowStyle 0 = hidden; waitOnReturn false = non-blocking
			vbsFile.write('Set WshShell = CreateObject("WScript.Shell")\n');
			vbsFile.write(
				'WshShell.Run "cmd.exe /c " & Chr(34) & "' +
					shellCmdFile.fsName +
					'" & Chr(34), 0, false\n',
			);
			vbsFile.close();
			vbsFile.execute();
			app.scheduleTask(
				'try { var f = new File("' +
					vbsFile.fsName.replace(/\\/g, '/') +
					'"); if(f.exists) f.remove(); } catch(e) {}',
				5000,
				false,
			);
		} else {
			shellCmdFile.execute(); // fallback if VBS creation fails
		}
	} else {
		shellCmdFile.execute();
	}
}
