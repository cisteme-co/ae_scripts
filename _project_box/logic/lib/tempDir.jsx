//@target aftereffects
// Depends on: fsUtils.jsx (createFolderSafe)

/**
 * Returns an ASCII-safe temp directory path.
 * On Japanese-locale Windows the OS username is often in Japanese, which puts
 * non-ASCII characters in Folder.temp — aerender.exe cannot handle those paths.
 * Falls back to C:\Users\Public\ae_tmp or C:\ae_tmp when that happens.
 * @param {boolean} is_win_os
 * @returns {string}  fsName-style path (backslashes on Win, forward slashes on Mac)
 */
function resolveTempDir(is_win_os) {
	if (!is_win_os) return Folder.temp.fsName;

	var systemTemp = Folder.temp.fsName;
	if (!/[^\x00-\x7F]/.test(systemTemp)) {
		return systemTemp;
	}

	$.writeln(
		'resolveTempDir: Folder.temp has non-ASCII chars (' +
			systemTemp +
			'), searching for ASCII fallback',
	);

	var candidates = ['C:\\Users\\Public\\ae_tmp', 'C:\\ae_tmp'];
	for (var i = 0; i < candidates.length; i++) {
		var dir = new Folder(candidates[i]);
		if (createFolderSafe(dir.fsName) && _canWriteToFolder(dir)) {
			$.writeln('resolveTempDir: using fallback ' + dir.fsName);
			return dir.fsName;
		}
	}

	$.writeln(
		'resolveTempDir: WARNING — no ASCII fallback writable, proceeding with: ' +
			systemTemp,
	);
	return systemTemp;
}

function _canWriteToFolder(folder) {
	try {
		var probe = new File(
			folder.fsName + '\\ae_write_probe_' + new Date().getTime() + '.tmp',
		);
		if (!probe.open('w')) return false;
		probe.write('1');
		probe.close();
		probe.remove();
		return true;
	} catch (e) {
		return false;
	}
}
