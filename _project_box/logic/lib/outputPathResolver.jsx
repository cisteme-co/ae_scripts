//@target aftereffects
// Depends on: fsUtils.jsx (getNthParentFolders, sanitizeFilename, createFolderSafe, getTodayYYYYMMDD)

// ── Studio folder conventions live here. Edit this table when the structure changes. ──
var OUTPUT_RULES = {
	mp4: {
		baseFolderDepth: 5,
		subPath: '/to_send/撮影/check',
		softFail: false,
		errorMsg:
			'Cannot resolve MP4 output folder.\nProject file must be at least 5 folder levels deep in the hierarchy.',
	},
	mov: {
		findAncestor: ['cuts', 'progress'],
		fallbackDepth: 2,
		subPath: '/renders/',
		softFail: false,
		errorMsg:
			'Cannot resolve MOV output folder.\nCould not find a "cuts" or "progress" ancestor, and the depth-2 fallback also failed.',
	},
	_default: {
		findAncestor: ['cuts', 'progress'],
		fallbackDepth: 2,
		subPath: '/renders/',
		softFail: true, // skip silently — don't abort the whole render
		errorMsg: '',
	},
};

/**
 * Returns the output Folder for the given extension, or null on failure.
 * Does NOT call alert; hard-fail messaging is the caller's responsibility.
 */
function resolveOutputFolder(ext, projectFile) {
	var rule = OUTPUT_RULES[ext] || OUTPUT_RULES._default;

	if (rule.baseFolderDepth !== undefined) {
		var base = getNthParentFolders(projectFile, rule.baseFolderDepth);
		if (!base) return null;
		var fp = base.fullName + rule.subPath;
		$.writeln('  ' + ext.toUpperCase() + ' output folder: ' + fp);
		return createFolderSafe(fp) ? new Folder(fp) : null;
	}

	// Search upward for an ancestor whose name matches the rule
	var base = null;
	var current = projectFile.parent;
	for (var guard = 10; current && guard > 0; guard--) {
		for (var ai = 0; ai < rule.findAncestor.length; ai++) {
			if (current.name.toLowerCase() === rule.findAncestor[ai]) {
				base = current.parent;
				break;
			}
		}
		if (base) break;
		current = current.parent;
	}

	if (!base) {
		$.writeln(
			'  resolveOutputFolder: ancestor not found, falling back to depth=' +
				rule.fallbackDepth,
		);
		base = getNthParentFolders(projectFile, rule.fallbackDepth);
	}
	if (!base) return null;

	var fp = base.fullName + rule.subPath + getTodayYYYYMMDD();
	$.writeln('  ' + ext.toUpperCase() + ' output folder: ' + fp);
	if (!createFolderSafe(fp)) {
		$.writeln('  WARNING: Failed to create output folder: ' + fp);
		return null;
	}
	return new Folder(fp);
}

// ── Private helpers ──────────────────────────────────────────────────────────

function _buildMoveCmd(tempPath, finalPath) {
	var src = tempPath.replace(/'/g, "''");
	var dst = finalPath.replace(/'/g, "''");
	return (
		'powershell -Command "Move-Item -LiteralPath \'' +
		src +
		"' -Destination '" +
		dst +
		'\' -Force"'
	);
}

function _setOutputModulePath(item, om, targetFile) {
	var originalStatus = item.status;
	try {
		app.beginSuppressDialogs();
		if (originalStatus === RQItemStatus.QUEUED)
			item.status = RQItemStatus.USER_STOPPED;

		om.file = null;
		om.file = new File(targetFile.fsName);

		// Verify; fall back to setSettings if the direct assignment didn't stick
		if (
			om.file === null ||
			om.file.fsName.toLowerCase() !== targetFile.fsName.toLowerCase()
		) {
			try {
				om.setSettings({
					'Output File Info': { 'Full Flat Path': targetFile.fsName },
				});
			} catch (e) {}

			if (om.file === null) {
				throw new Error(
					'CRITICAL: Failed to set output path for "' + targetFile.fsName + '"',
				);
			}
			if (om.file.fsName.toLowerCase() !== targetFile.fsName.toLowerCase()) {
				$.writeln(
					'WARNING: Path mismatch. Expected: ' +
						targetFile.fsName +
						', Got: ' +
						om.file.fsName,
				);
			}
		}

		if (originalStatus === RQItemStatus.QUEUED)
			item.status = RQItemStatus.QUEUED;
		app.endSuppressDialogs(false);
		$.writeln('  Path set successfully: ' + om.file.fsName);
	} catch (setErr) {
		app.endSuppressDialogs(false);
		$.writeln('  Warning: Path assignment error: ' + setErr.toString());
		if (originalStatus === RQItemStatus.QUEUED) {
			try {
				item.status = RQItemStatus.QUEUED;
			} catch (e) {}
		}
	}
}

// ── Public entry point ───────────────────────────────────────────────────────

/**
 * Resolves and sets all output paths on the render queue.
 * On Windows, renders go to an ASCII temp folder; move commands are returned
 * so the batch script can relocate them after aerender finishes.
 *
 * @returns {string[] | null}  Move commands on success, null on hard failure.
 */
function setOutputPaths(queueInfo, rq, timestamp, is_win_os, tempDir) {
	var moveCommands = [];
	$.writeln('Starting path setting...');

	try {
		for (var k = 0; k < queueInfo.length; k++) {
			var itemData = queueInfo[k];
			var item = rq.item(itemData.index);
			$.writeln(
				'Processing item ' +
					(k + 1) +
					'/' +
					queueInfo.length +
					': ' +
					itemData.compName,
			);

			for (var m = 0; m < itemData.outputs.length; m++) {
				try {
					var outputData = itemData.outputs[m];
					var om = item.outputModule(outputData.omIndex);
					var currentFile = om.file;
					if (!currentFile) {
						$.writeln(
							'  Module ' + outputData.omIndex + ' has no file set, skipping',
						);
						continue;
					}

					var ext = currentFile.name.split('.').pop().toLowerCase();
					var sanitizedName = sanitizeFilename(itemData.compName);
					$.writeln(
						'  Module ' +
							outputData.omIndex +
							' ext=' +
							ext +
							' name=' +
							sanitizedName,
					);

					var outputFolder = resolveOutputFolder(ext, app.project.file);
					if (!outputFolder) {
						var rule = OUTPUT_RULES[ext] || OUTPUT_RULES._default;
						if (rule.softFail) {
							$.writeln(
								'  Keeping original path for ' +
									ext +
									' (folder resolution failed)',
							);
							continue;
						}
						if (rule.errorMsg) alert(rule.errorMsg);
						return null;
					}

					var targetFile;
					if (is_win_os) {
						var finalFile = new File(
							outputFolder.fsName + '\\' + sanitizedName + '.' + ext,
						);
						var tempName =
							'ae_render_' +
							timestamp +
							'_i' +
							itemData.index +
							'_m' +
							outputData.omIndex +
							'.' +
							ext;
						var tempFile = new File(tempDir + '\\' + tempName);
						moveCommands.push(_buildMoveCmd(tempFile.fsName, finalFile.fsName));
						outputData.tempPath = tempFile.fsName;
						outputData.finalPath = finalFile.fsName;
						$.writeln('  [WIN] Temp:  ' + tempFile.fsName);
						$.writeln('  [WIN] Final: ' + finalFile.fsName);
						targetFile = tempFile;
					} else {
						targetFile = new File(
							outputFolder.fullName + '/' + sanitizedName + '.' + ext,
						);
						outputData.tempPath = targetFile.fsName;
						$.writeln('  [MAC] Path: ' + targetFile.fsName);
					}

					_setOutputModulePath(item, om, targetFile);
				} catch (omErr) {
					$.writeln('ERROR setting output module: ' + omErr.toString());
					alert(
						'Error setting output path:\n' +
							omErr.toString() +
							'\n\nComp: ' +
							itemData.compName,
					);
					return null;
				}
			}

			// Auto-add H.264 MP4 when the item only has MOV outputs
			_autoAddMp4IfMissing(
				item,
				itemData,
				timestamp,
				is_win_os,
				tempDir,
				moveCommands,
			);
		}
	} catch (pathErr) {
		alert('Error in path setting:\n' + pathErr.toString());
		return null;
	}

	$.writeln('All output paths set successfully');
	$.sleep(500);
	return moveCommands;
}

function _autoAddMp4IfMissing(
	item,
	itemData,
	timestamp,
	is_win_os,
	tempDir,
	moveCommands,
) {
	var hasMovOut = false;
	var hasMp4Out = false;
	for (var s = 0; s < itemData.outputs.length; s++) {
		var p = itemData.outputs[s].finalPath || itemData.outputs[s].tempPath;
		if (!p) continue;
		var e = p.split('.').pop().toLowerCase();
		if (e === 'mov') hasMovOut = true;
		if (e === 'mp4') hasMp4Out = true;
	}
	if (!hasMovOut || hasMp4Out) return;

	try {
		var newOM = item.outputModules.add();
		var newOMIdx = item.numOutputModules; // index of the module just added

		var h264Template = 'H.264 - Match Render Settings -  5 Mbps';
		for (var tIdx = 0; tIdx < newOM.templates.length; tIdx++) {
			if (newOM.templates[tIdx] === h264Template) {
				try {
					newOM.applyTemplate(h264Template);
				} catch (e) {}
				break;
			}
		}

		var mp4Rule = OUTPUT_RULES.mp4;
		var mp4Base = getNthParentFolders(
			app.project.file,
			mp4Rule.baseFolderDepth,
		);
		if (!mp4Base) {
			$.writeln('  Auto-MP4: cannot resolve base folder, skipping');
			return;
		}

		var mp4FolderPath = mp4Base.fullName + mp4Rule.subPath;
		createFolderSafe(mp4FolderPath);

		var sanitizedName = sanitizeFilename(itemData.compName);
		var newOutData = {
			omIndex: newOMIdx,
			hasFile: true,
			tempPath: null,
			finalPath: null,
		};

		if (is_win_os) {
			var finalMP4 = new File(
				new Folder(mp4FolderPath).fsName + '\\' + sanitizedName + '.mp4',
			);
			var tempMP4 = new File(
				tempDir +
					'\\ae_render_' +
					timestamp +
					'_i' +
					itemData.index +
					'_m' +
					newOMIdx +
					'.mp4',
			);
			moveCommands.push(_buildMoveCmd(tempMP4.fsName, finalMP4.fsName));
			newOutData.tempPath = tempMP4.fsName;
			newOutData.finalPath = finalMP4.fsName;
			newOM.file = new File(tempMP4.fsName);
		} else {
			var targetMP4 = new File(
				new Folder(mp4FolderPath).fullName + '/' + sanitizedName + '.mp4',
			);
			newOM.file = new File(targetMP4.fsName);
			newOutData.tempPath = targetMP4.fsName;
		}

		itemData.outputs.push(newOutData);
		$.writeln(
			'  Auto-added H.264 MP4 (module ' +
				newOMIdx +
				'): ' +
				sanitizedName +
				'.mp4',
		);
	} catch (addErr) {
		$.writeln(
			'  Warning: Could not auto-add H.264 module: ' + addErr.toString(),
		);
	}
}
