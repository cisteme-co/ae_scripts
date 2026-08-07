//@target aftereffects

/**
 * Builds the macOS .command file content for an aerender background render.
 * Self-deletes both the temp .aep and the script file on completion.
 *
 * @param {File} tmpAep
 * @param {File} logFile
 * @param {File} aer          aerender binary
 * @param {File} shellCmdFile the .command file itself (for self-cleanup)
 * @returns {string}
 */
function buildMacCommand(tmpAep, logFile, aer, shellCmdFile) {
	function wq(s) {
		return '"' + s + '"';
	}
	var cmd = '';
	cmd += '#!/bin/bash\r\n';
	cmd += 'echo "Starting render..."\r\n';
	cmd +=
		wq(aer.fsName) +
		' -project ' +
		wq(tmpAep.fsName) +
		' -sound ON 2>&1 | tee ' +
		wq(logFile.fsName) +
		'\r\n';
	cmd += 'rm -f ' + wq(tmpAep.fsName) + '\r\n';
	cmd += 'rm -f ' + wq(shellCmdFile.fsName) + '\r\n';
	return cmd;
}
