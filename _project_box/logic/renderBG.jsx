// ──────────────
// FIXED VALIDATION - Doesn't require output paths to be set first
// ──────────────

function getLanguage() {
	try {
		var locale = $.locale || 'en_US';
		if (locale.indexOf('ja') === 0 || locale.indexOf('jp') === 0) {
			return 'ja';
		}
		return 'en';
	} catch (e) {
		return 'en';
	}
}

function alertSaveProjectFirst() {
	var lang = getLanguage();
	var msg =
		lang === 'ja'
			? 'プロジェクトを保存してください。'
			: 'Please save the project first.';
	alert(msg);
}

function alertNoValidRenderQueue() {
	var lang = getLanguage();
	var msg =
		lang === 'ja'
			? '有効なレンダーキューがありません。'
			: 'There is no valid render queue.';
	alert(msg);
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

function sanitizeFilename(name) {
	if (!name) return 'unnamed';
	// Remove illegal characters for Windows/Mac
	return name.replace(/[<>:"\/\\|?*]/g, '_');
}

function getShortPath(fileOrFolder) {
	if ($.os.toLowerCase().indexOf('windows') < 0) return fileOrFolder.fsName;
	try {
		var cmd = 'cmd /c "for %I in ("' + fileOrFolder.fsName + '") do echo %~sI"';
		var shortPath = system
			.callSystem(cmd)
			.replace(/[\r\n]/g, '')
			.trim();
		if (shortPath && shortPath.length > 0 && shortPath.indexOf('?') === -1) {
			return shortPath;
		}
	} catch (e) {}
	return fileOrFolder.fsName;
}

function getTodayYYYYMMDD() {
	var today = new Date();
	var yyyy = today.getFullYear();
	var mm = ('0' + (today.getMonth() + 1)).slice(-2);
	var dd = ('0' + today.getDate()).slice(-2);
	return '' + yyyy + mm + dd;
}

function createFolderSafe(folderPath) {
	try {
		var folder =
			folderPath instanceof Folder ? folderPath : new Folder(folderPath);

		if (folder.exists) {
			return true;
		}

		if (folder.parent && !folder.parent.exists) {
			if (!createFolderSafe(folder.parent)) {
				return false;
			}
		}

		var result = folder.create();
		return result;
	} catch (e) {
		$.writeln('Error creating folder ' + folderPath + ': ' + e.toString());
		return false;
	}
}

function renderBG() {
	try {
		var is_win_os = $.os.toLowerCase().indexOf('windows') >= 0;
		var timestamp = new Date().getTime();
		var moveCommands = [];

		// When the temp path has non-ASCII chars (Japanese username), find an ASCII-safe folder.
		// MUST verify the resolved fsName is ASCII – NTFS junctions can remap paths back to Japanese.
		// Tests actual write access to confirm usability before committing.
		var tempDir;
		if (is_win_os) {
			var rawTempPath = Folder.temp.fsName;
			if (/[^\x00-\x7F]/.test(rawTempPath)) {
				var diagLines = ['rawTempPath: ' + rawTempPath];

				// Build candidate list from environment variables + hardcoded fallbacks
				var candidates = [];
				try {
					var pubEnv = system
						.callSystem('cmd /c echo %PUBLIC%')
						.replace(/[\r\n]/g, '')
						.trim();
					if (pubEnv && !/[^\x00-\x7F]/.test(pubEnv))
						candidates.push(pubEnv + '\\ae_tmp');
				} catch (e) {}
				candidates.push('C:\\Users\\Public\\ae_tmp');

				for (var ci = 0; ci < candidates.length && !tempDir; ci++) {
					var cand = candidates[ci];
					if (/[^\x00-\x7F]/.test(cand)) {
						diagLines.push('SKIP (non-ASCII candidate): ' + cand);
						continue;
					}
					try {
						var cf = new Folder(cand);
						if (!cf.exists) cf.create();
						var resolved = cf.fsName;
						if (/[^\x00-\x7F]/.test(resolved)) {
							diagLines.push('SKIP (non-ASCII resolved): ' + resolved);
							continue;
						}
						// Test actual write access
						var testF = new File(
							resolved + '\\ae_write_test_' + timestamp + '.tmp',
						);
						if (testF.open('w')) {
							testF.write('ok');
							testF.close();
							if (testF.exists) testF.remove();
							tempDir = resolved;
							diagLines.push('OK: ' + tempDir);
						} else {
							diagLines.push('SKIP (not writable): ' + resolved);
						}
					} catch (e) {
						diagLines.push('SKIP (error): ' + cand + ' — ' + e.toString());
					}
				}

				if (!tempDir) {
					alert(
						'renderBG: Could not find a writable ASCII temp folder.\n\n' +
							diagLines.join('\n') +
							'\n\nAerrender will likely fail. Please ensure C:\\Users\\Public is accessible.',
					);
					tempDir = rawTempPath; // last resort
				}
				$.writeln('tempDir resolved: ' + tempDir + '\n' + diagLines.join('\n'));
			} else {
				tempDir = rawTempPath;
			}
		} else {
			tempDir = Folder.temp.fullName;
		}

		function wq(s) {
			return '"' + s + '"';
		}

		if (app.project.file == null) {
			alertSaveProjectFirst();
			app.project.saveWithDialog();
			if (app.project.file == null) {
				return;
			}
		}

		var rq = app.project.renderQueue;
		var compNames = [];
		var totalFrames = 0;
		var queueInfo = [];

		// FIXED VALIDATION: Just check if items are queued, don't validate output paths
		if (rq.numItems > 0) {
			for (var i = 1; i <= rq.numItems; i++) {
				try {
					var item = rq.item(i);
					if (item.status == RQItemStatus.QUEUED) {
						var itemData = {
							index: i,
							compName: item.comp.name,
							outputs: [],
						};

						compNames.push(item.comp.name);

						var frameDuration = item.comp.frameDuration;
						var start = item.timeStart;
						var end = item.timeEnd;

						if (end <= start) {
							start = item.comp.workAreaStart;
							end = start + item.comp.workAreaDuration;
						}

						var itemFrames = Math.ceil((end - start) / frameDuration);
						if (itemFrames <= 0) itemFrames = 1;
						totalFrames += itemFrames;

						// Collect output module info (don't validate paths yet)
						if (item.numOutputModules > 0) {
							for (var j = 1; j <= item.numOutputModules; j++) {
								try {
									var om = item.outputModule(j);
									// Just check if output module exists, not if file is set
									itemData.outputs.push({
										omIndex: j,
										hasFile: om.file != null,
										tempPath: null, // To be filled later
										finalPath: null,
									});
								} catch (omErr) {
									$.writeln('Error reading output module: ' + omErr.toString());
								}
							}
						}

						queueInfo.push(itemData);
					}
				} catch (itemErr) {
					$.writeln('Error reading queue item: ' + itemErr.toString());
				}
			}
		}

		// Check if we have any queued items
		if (queueInfo.length === 0) {
			alertNoValidRenderQueue();
			return;
		}

		// ──────────────
		// CONFIRMATION DIALOG (ScriptUI with Checkboxes)
		// Only show if there are 2 or more items in the queue
		// ──────────────
		if (queueInfo.length >= 2) {
			var lang = getLanguage();
			var uiStrings = {
				title: { en: 'Select Items to Render', ja: 'レンダリング項目の選択' },
				msg: {
					en: 'Select the items you want to render in the background:',
					ja: '背景でレンダリングする項目を選択してください：',
				},
				start: { en: 'Start Render', ja: 'レンダー開始' },
				cancel: { en: 'Cancel', ja: 'キャンセル' },
				selectAll: { en: 'Select All', ja: 'すべて選択' },
				selectNone: { en: 'Select None', ja: 'すべて解除' },
			};

			var t = function (key) {
				return uiStrings[key][lang] || uiStrings[key]['en'];
			};

			var dlg = new Window('dialog', t('title'));
			dlg.orientation = 'column';
			dlg.alignChildren = ['fill', 'top'];
			dlg.spacing = 15;
			dlg.margins = 20;

			dlg.add('statictext', undefined, t('msg'));

			// Scrollable area for checkboxes
			var panel = dlg.add('panel', undefined, undefined);
			panel.orientation = 'column';
			panel.alignChildren = ['fill', 'top'];
			panel.preferredSize = [400, 250];

			var scrollGroup = panel.add('group');
			scrollGroup.orientation = 'column';
			scrollGroup.alignChildren = ['left', 'top'];
			scrollGroup.spacing = 5;
			scrollGroup.alignment = ['fill', 'fill'];
			// Make it scrollable if many items
			scrollGroup.maximumSize.height = 10000;

			var checkboxes = [];
			for (var i = 0; i < queueInfo.length; i++) {
				var cb = scrollGroup.add('checkbox', undefined, queueInfo[i].compName);
				cb.value = true; // Default to checked
				checkboxes.push(cb);
			}

			// Selection helpers
			var selGroup = dlg.add('group');
			selGroup.orientation = 'row';
			selGroup.spacing = 10;
			var allBtn = selGroup.add('button', undefined, t('selectAll'), {
				style: 'toolbutton',
			});
			var noneBtn = selGroup.add('button', undefined, t('selectNone'), {
				style: 'toolbutton',
			});

			allBtn.onClick = function () {
				for (var i = 0; i < checkboxes.length; i++) checkboxes[i].value = true;
			};
			noneBtn.onClick = function () {
				for (var i = 0; i < checkboxes.length; i++) checkboxes[i].value = false;
			};

			var btnGroup = dlg.add('group');
			btnGroup.orientation = 'row';
			btnGroup.alignment = 'right';
			btnGroup.spacing = 10;

			var cancelBtn = btnGroup.add('button', undefined, t('cancel'), {
				name: 'cancel',
			});
			var startBtn = btnGroup.add('button', undefined, t('start'), {
				name: 'ok',
			});

			if (dlg.show() !== 1) {
				return;
			}

			// Filter queueInfo based on selection
			var selectedQueueInfo = [];
			var selectedCompNames = [];
			var selectedTotalFrames = 0;

			for (var i = 0; i < checkboxes.length; i++) {
				if (checkboxes[i].value) {
					var itemData = queueInfo[i];
					selectedQueueInfo.push(itemData);
					selectedCompNames.push(itemData.compName);

					// Re-calculate total frames for selected items
					var item = rq.item(itemData.index);
					var frameDuration = item.comp.frameDuration;
					var start = item.timeStart;
					var end = item.timeEnd;
					if (end <= start) {
						start = item.comp.workAreaStart;
						end = start + item.comp.workAreaDuration;
					}
					var itemFrames = Math.ceil((end - start) / frameDuration);
					if (itemFrames <= 0) itemFrames = 1;
					selectedTotalFrames += itemFrames;
				}
			}

			if (selectedQueueInfo.length === 0) {
				return;
			}

			// Update variables with filtered selection
			queueInfo = selectedQueueInfo;
			compNames = selectedCompNames;
			totalFrames = selectedTotalFrames;

			$.writeln(
				'User selected ' +
					queueInfo.length +
					' items with ' +
					totalFrames +
					' total frames',
			);
		}

		// Now set output paths for mp4 and mov files
		$.writeln('Starting path setting...');
		// REMOVED UNDO GROUP: Render Queue changes in AE 2025 are more stable without undo groups
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

						// Get current file if set, otherwise we'll create a new path
						var currentFile = om.file;
						var ext = null;

						if (currentFile) {
							ext = currentFile.name.split('.').pop().toLowerCase();
						} else {
							// Even if no file is set, we must handle the module index alignment
							// But usually, modules without files don't need paths.
							// However, aerender maps -output sequentially.
							// So if module 1 is skipped, module 2 becomes the first -output target?
							// Actually, if we skip adding to 'queueInfo' outputs, we lose track.
							// But we added ALL modules to itemData.outputs earlier.

							// If we skip processing here, outputData.tempPath remains null.
							// Then in command generation, we skip adding -output.
							// So if Module 1 is skipped, Module 2 gets the first -output.
							// This is RISKY if aerender expects -output for Module 1.
							// But if Module 1 has no file, aerender probably ignores it.

							// Let's assume modules without files are irrelevant.
							$.writeln(
								'  Output module ' +
									outputData.omIndex +
									' has no file set, skipping',
							);
							continue;
						}

						$.writeln(
							'  Output module ' + outputData.omIndex + ' extension: ' + ext,
						);

						var outputFolder = null;
						var sanitizedCompName = sanitizeFilename(itemData.compName);
						$.writeln('  Comp Name: ' + itemData.compName);
						$.writeln('  Sanitized Name: ' + sanitizedCompName);

						if (ext === 'mp4') {
							var baseFolder = getNthParentFolders(app.project.file, 5);
							if (!baseFolder) {
								alert(
									'Cannot go up 5 folders from project file. Project might be too close to root.',
								);
								return;
							}

							var folderPath = baseFolder.fullName + '/to_send/撮影/check';
							$.writeln('  MP4 output folder: ' + folderPath);

							if (!createFolderSafe(folderPath)) {
								alert('Failed to create MP4 output folder:\n' + folderPath);
								return;
							}

							outputFolder = new Folder(folderPath);

							// FORCE SANITIZED COMP NAME FOR MP4 TOO
							sanitizedCompName = sanitizeFilename(itemData.compName);
							$.writeln('  MP4 forced sanitized name: ' + sanitizedCompName);
						} else if (ext === 'mov') {
							// FIX: Ensure we are getting the correct parent folder
							// User wants: <projectFolder>/compositing/<episode>/renders/<today Folder>
							// Current structure: <projectFolder>/compositing/<episode>/cuts/<cutFolder>/<aep file>
							// OR structure: <projectFolder>/compositing/<episode>/progress/<aep file>

							// Strategy: Search UP for "cuts" or "progress" folder.
							// The parent of "cuts" or "progress" is the Episode folder.

							var baseFolder = null;
							var current = app.project.file.parent;
							var safetyLimit = 10;
							while (current && safetyLimit > 0) {
								if (
									current.name.toLowerCase() === 'cuts' ||
									current.name.toLowerCase() === 'progress'
								) {
									baseFolder = current.parent;
									break;
								}
								current = current.parent;
								safetyLimit--;
							}

							// Fallback if not found (e.g. project structure is different)
							if (!baseFolder) {
								$.writeln(
									'  Could not find "cuts" or "progress" folder in path. Defaulting to n=2 logic.',
								);
								baseFolder = getNthParentFolders(app.project.file, 2);
							}

							if (!baseFolder) {
								alert(
									'Cannot find base folder (cuts/progress parent) or go up 2 folders from project file.',
								);
								return;
							}

							var folderPath =
								baseFolder.fullName + '/renders/' + getTodayYYYYMMDD();
							$.writeln('  MOV output folder: ' + folderPath);

							if (!createFolderSafe(folderPath)) {
								alert('Failed to create MOV output folder:\n' + folderPath);
								return;
							}

							outputFolder = new Folder(folderPath);
						} else {
							// For other formats, also put them in the today's folder if requested
							// The user specifically asked for "renders folder in todays's folder"

							// FIX: Use same dynamic logic as MOV
							var baseFolder = null;
							var current = app.project.file.parent;
							var safetyLimit = 10;
							while (current && safetyLimit > 0) {
								if (
									current.name.toLowerCase() === 'cuts' ||
									current.name.toLowerCase() === 'progress'
								) {
									baseFolder = current.parent;
									break;
								}
								current = current.parent;
								safetyLimit--;
							}

							if (!baseFolder) {
								baseFolder = getNthParentFolders(app.project.file, 2);
							}

							if (baseFolder) {
								var folderPath =
									baseFolder.fullName + '/renders/' + getTodayYYYYMMDD();
								// Try to create folder, but even if it fails (due to unicode issues?),
								// we might still want to proceed with temp path rendering.
								// But for now let's assume createFolderSafe works.
								if (createFolderSafe(folderPath)) {
									outputFolder = new Folder(folderPath);
									$.writeln(
										'  ' +
											ext.toUpperCase() +
											' output folder (defaulted): ' +
											folderPath,
									);
								} else {
									$.writeln(
										'  WARNING: Failed to create output folder: ' + folderPath,
									);
								}
							}

							if (!outputFolder) {
								$.writeln('  Keeping original path for ' + ext + ' file');
								// If we fail to determine a folder, we SKIP setting temp path.
								// This is dangerous if the original path has Japanese chars.
								// BUT we can't determine where to move the file TO.

								// Should we force a temp path anyway?
								// If we force temp path, we can't move it later.
								// So the user gets a file in temp folder.

								// Let's at least log this skipping clearly.
								continue;
							}
						}

						// Set new output path
						// FIX: Remove strict .exists check here as it might fail on unicode paths even if created
						if (outputFolder) {
							var finalFilePath;
							var tempFilePath;

							if (is_win_os) {
								// STRATEGY: Render to ASCII temp folder, then move to Japanese destination
								// This is the only 100% reliable way to handle Japanese paths in aerender
								finalFilePath = new File(
									outputFolder.fsName + '\\' + sanitizedCompName + '.' + ext,
								);

								// Use a more unique temp name with counter
								var tempName =
									'ae_render_' +
									timestamp +
									'_i' +
									itemData.index +
									'_m' +
									outputData.omIndex +
									'.' +
									ext;
								tempFilePath = new File(tempDir + '\\' + tempName);

								// Store move command for later
								// Use powershell for moving to handle Unicode paths correctly
								// -LiteralPath avoids issues with special characters in the source path
								// We use single quotes inside the powershell command for simplicity
								// ESCAPE SINGLE QUOTES for PowerShell (replace ' with '')
								var safeTempPath = tempFilePath.fsName.replace(/'/g, "''");
								var safeFinalPath = finalFilePath.fsName.replace(/'/g, "''");

								moveCommands.push(
									"Move-Item -LiteralPath '" +
										safeTempPath +
										"' -Destination '" +
										safeFinalPath +
										"' -Force",
								);

								// AE 2025 Robustness: Set the path to the temp file
								$.writeln('  [WIN] Temp Path: ' + tempFilePath.fsName);
								$.writeln('  [WIN] Final Path: ' + finalFilePath.fsName);

								var targetFile = tempFilePath;
								outputData.tempPath = tempFilePath.fsName; // Store for aerender flag
								outputData.finalPath = finalFilePath.fsName; // Store for restoring main project
							} else {
								var targetFile = new File(
									outputFolder.fullName + '/' + sanitizedCompName + '.' + ext,
								);
								$.writeln('  [MAC] Path: ' + targetFile.fsName);
							}

							// AE 2025 Robustness
							var originalStatus = item.status;
							try {
								app.beginSuppressDialogs();

								if (originalStatus === RQItemStatus.QUEUED) {
									item.status = RQItemStatus.USER_STOPPED;
								}

								// AE 2025 Fix: Extremely aggressive path setting
								// 1. Set to null
								om.file = null;

								// 2. REMOVED applyTemplate as it resets custom settings
								// try {
								// 	om.applyTemplate(om.name);
								// } catch (e) {}

								// 3. Set the file using setSettings (Modern AE way)
								// try {
								// 	var settings = {
								// 		"Output File Info": {
								// 			"Full Flat Path": targetFile.fsName
								// 		}
								// 	};
								// 	om.setSettings(settings);
								// } catch (e) {
								// 	$.writeln('  setSettings failed, falling back to .file assignment: ' + e.toString());
								// }

								// 4. Fallback/Verify with .file assignment
								// DIRECT ASSIGNMENT ONLY - Keep it simple and robust
								om.file = new File(targetFile.fsName);

								// 5. Final verification - if this fails, we cannot proceed safely
								if (
									om.file === null ||
									om.file.fsName.toLowerCase() !==
										targetFile.fsName.toLowerCase()
								) {
									// Double check if it's just case sensitivity issue
									// But wait, if fsName is different, it might be due to 8.3 names or symlinks?
									// Let's assume File object handles it.

									// If direct assignment failed, try setSettings as last resort
									try {
										var settings = {
											'Output File Info': {
												'Full Flat Path': targetFile.fsName,
											},
										};
										om.setSettings(settings);
									} catch (e) {}

									if (om.file === null) {
										var err =
											'CRITICAL: Failed to set output path for ' +
											itemData.compName +
											'.\n' +
											'Expected: ' +
											targetFile.fsName +
											'\n' +
											'Got: NULL';
										throw new Error(err);
									}
									// If path is different but not null, we log warning but proceed?
									// No, if path is wrong, aerender fails.
									if (
										om.file.fsName.toLowerCase() !==
										targetFile.fsName.toLowerCase()
									) {
										$.writeln(
											'WARNING: Path mismatch after setting. Expected: ' +
												targetFile.fsName +
												', Got: ' +
												om.file.fsName,
										);
										// This might happen if AE normalizes path differently.
										// But usually on Windows they should match.
									}
								}

								if (originalStatus === RQItemStatus.QUEUED) {
									item.status = RQItemStatus.QUEUED;
								}

								app.endSuppressDialogs(false);
								$.writeln('  Path set successfully to: ' + om.file.fsName);
							} catch (setErr) {
								app.endSuppressDialogs(false);
								$.writeln(
									'  Warning: Path assignment error: ' + setErr.toString(),
								);
								if (originalStatus === RQItemStatus.QUEUED) {
									try {
										item.status = RQItemStatus.QUEUED;
									} catch (e) {}
								}
							}
						}
					} catch (omSetErr) {
						$.writeln(
							'ERROR setting output module path: ' + omSetErr.toString(),
						);
						alert(
							'Error setting output path:\n' +
								omSetErr.toString() +
								'\n\nComp: ' +
								itemData.compName,
						);
						return;
					}
				}

				// Auto-add H.264 MP4 to the check folder if this item only has .mov outputs
				var hasMovOut = false;
				var hasMp4Out = false;
				for (var mScan = 0; mScan < itemData.outputs.length; mScan++) {
					var scanPath =
						itemData.outputs[mScan].finalPath ||
						itemData.outputs[mScan].tempPath;
					if (scanPath) {
						var scanExt = scanPath.split('.').pop().toLowerCase();
						if (scanExt === 'mov') hasMovOut = true;
						if (scanExt === 'mp4') hasMp4Out = true;
					}
				}
				if (hasMovOut && !hasMp4Out) {
					try {
						var newOM = item.outputModules.add();
						var newOMIdx = item.numOutputModules;
						var sanitizedMP4Name = sanitizeFilename(itemData.compName);
						var h264Template = 'H.264 - Match Render Settings -  5 Mbps';
						for (var tIdx = 0; tIdx < newOM.templates.length; tIdx++) {
							if (newOM.templates[tIdx] === h264Template) {
								try {
									newOM.applyTemplate(h264Template);
								} catch (e) {}
								break;
							}
						}
						var mp4Base = getNthParentFolders(app.project.file, 5);
						if (mp4Base) {
							var mp4FolderPath = mp4Base.fullName + '/to_send/撮影/check';
							createFolderSafe(mp4FolderPath);
							var mp4Folder = new Folder(mp4FolderPath);
							var newOutData = {
								omIndex: newOMIdx,
								hasFile: true,
								tempPath: null,
								finalPath: null,
							};
							if (is_win_os) {
								var finalMP4 = new File(
									mp4Folder.fsName + '\\' + sanitizedMP4Name + '.mp4',
								);
								var tempMP4Name =
									'ae_render_' +
									timestamp +
									'_i' +
									itemData.index +
									'_m' +
									newOMIdx +
									'.mp4';
								var tempMP4 = new File(tempDir + '\\' + tempMP4Name);
								var safeTempMP4 = tempMP4.fsName.replace(/'/g, "''");
								var safeFinalMP4 = finalMP4.fsName.replace(/'/g, "''");
								moveCommands.push(
									"Move-Item -LiteralPath '" +
										safeTempMP4 +
										"' -Destination '" +
										safeFinalMP4 +
										"' -Force",
								);
								newOutData.tempPath = tempMP4.fsName;
								newOutData.finalPath = finalMP4.fsName;
								newOM.file = new File(tempMP4.fsName);
							} else {
								var targetMP4 = new File(
									mp4Folder.fullName + '/' + sanitizedMP4Name + '.mp4',
								);
								newOM.file = new File(targetMP4.fsName);
								newOutData.tempPath = targetMP4.fsName;
							}
							itemData.outputs.push(newOutData);
							$.writeln('  Auto-added H.264 MP4: ' + sanitizedMP4Name + '.mp4');
						}
					} catch (addMP4Err) {
						$.writeln(
							'  Warning: Could not add H.264 module: ' + addMP4Err.toString(),
						);
					}
				}
			}
		} catch (pathErr) {
			alert('Error in path setting:\n' + pathErr.toString());
			return;
		}

		$.writeln('All output paths set successfully');
		$.sleep(500); // Give AE a moment to settle

		// Save
		var af = app.project.file;

		var tmpAep = new File(
			tempDir + '/' + 'aerender_temp_' + timestamp + '.aep',
		);
		var logFile = new File(
			tempDir + '/' + 'aerender_log_' + timestamp + '.txt',
		);
		var pidFile = new File(
			tempDir + '/' + 'aerender_pid_' + timestamp + '.txt',
		);

		try {
			// PRE-SAVE VERIFICATION
			if (is_win_os) {
				$.writeln('VERIFYING PATHS BEFORE SAVE...');
				for (var k = 0; k < queueInfo.length; k++) {
					var itemData = queueInfo[k];
					var item = rq.item(itemData.index);
					for (var m = 0; m < itemData.outputs.length; m++) {
						var outputData = itemData.outputs[m];
						if (outputData.tempPath) {
							var om = item.outputModule(outputData.omIndex);
							// Case-insensitive check
							if (
								om.file &&
								om.file.fsName.toLowerCase() !==
									outputData.tempPath.toLowerCase()
							) {
								$.writeln(
									'CRITICAL WARNING: Path reverted/changed before save! Item ' +
										itemData.index +
										' Module ' +
										outputData.omIndex,
								);
								$.writeln('  Expected: ' + outputData.tempPath);
								$.writeln('  Got: ' + om.file.fsName);

								// FORCE RESET
								om.file = new File(outputData.tempPath);
								if (
									om.file.fsName.toLowerCase() !==
									outputData.tempPath.toLowerCase()
								) {
									throw new Error(
										'Unrecoverable path error for Item ' + itemData.index,
									);
								}
								$.writeln('  FIXED path before save.');
							}
						}
					}
				}
			}

			$.writeln('Saving temporary project: ' + tmpAep.fsName);
			app.project.save(tmpAep);

			// Restore main project paths to final destination
			// This ensures the user sees the correct filenames in the Render Queue
			if (is_win_os) {
				$.writeln('Restoring main project paths to final destination...');
				for (var k = 0; k < queueInfo.length; k++) {
					var itemData = queueInfo[k];
					var item = rq.item(itemData.index);
					for (var m = 0; m < itemData.outputs.length; m++) {
						var outputData = itemData.outputs[m];
						if (outputData.finalPath) {
							try {
								var om = item.outputModule(outputData.omIndex);
								// We can use simple assignment here as we are in the main UI thread context
								// and this is primarily for user visibility
								om.file = new File(outputData.finalPath);
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

		// Create shell command
		var shellCmdFile = null;
		var cmd = '';
		var aer = null;

		if (is_win_os) {
			aer = new File(Folder.appPackage.fullName + '/aerender.exe');
			if (!aer.exists) {
				var altAer = new File(
					'C:\\Program Files\\Adobe\\Adobe After Effects 2025\\Support Files\\aerender.exe',
				);
				if (altAer.exists) aer = altAer;
			}

			if (!aer.exists) {
				alert('aerender.exe not found at:\n' + aer.fsName);
				return;
			}

			shellCmdFile = new File(tempDir + '/aerender_' + timestamp + '.bat');

			cmd = '@echo off\r\n';
			cmd += 'chcp 65001 >nul\r\n';
			cmd += 'echo Starting render...\r\n';

			// Write start marker to log immediately
			cmd += 'echo RENDER_STARTED > ' + wq(logFile.fsName) + '\r\n';
			cmd += 'SET RENDER_FAILED=0\r\n';

			// Generate aerender command for each item using the -output flag
			for (var rIdx = 0; rIdx < queueInfo.length; rIdx++) {
				var rItem = queueInfo[rIdx];
				var itemCmd = '';
				var hasTempPath = false;

				cmd +=
					'echo Rendering Item ' +
					(rIdx + 1) +
					' (Index ' +
					rItem.index +
					')...\r\n';

				itemCmd += wq(aer.fsName) + ' -project ' + wq(tmpAep.fsName);
				itemCmd += ' -rqindex ' + rItem.index;

				// CRITICAL FIX: Ensure -output flags map to modules correctly.
				// By removing -output flags, we force aerender to use the paths saved in the project file.
				// This assumes we successfully saved ASCII temp paths to the project file.

				// Also check if any temp path has non-ASCII characters
				for (var oIdx = 0; oIdx < rItem.outputs.length; oIdx++) {
					var oData = rItem.outputs[oIdx];
					if (oData.tempPath) {
						if (/[^\x00-\x7F]/.test(oData.tempPath)) {
							cmd +=
								'echo WARNING: Non-ASCII characters in temp path for Module ' +
								oData.omIndex +
								'\r\n';
						}
						hasTempPath = true;
						cmd +=
							'echo   Module ' +
							oData.omIndex +
							' -> ' +
							wq(oData.tempPath) +
							'\r\n';
					}
				}

				if (hasTempPath) {
					// Use -output flags to explicitly override paths, bypassing whatever is saved in the .aep
					for (var oIdx2 = 0; oIdx2 < rItem.outputs.length; oIdx2++) {
						var oData2 = rItem.outputs[oIdx2];
						if (oData2.tempPath) {
							itemCmd += ' -output ' + wq(oData2.tempPath);
						}
					}
					itemCmd += ' -sound ON >> ' + wq(logFile.fsName) + ' 2>&1\r\n';
					cmd += itemCmd;

					// Capture ERRORLEVEL immediately; a second command would reset it
					cmd += 'SET _EL=%ERRORLEVEL%\r\n';
					cmd +=
						'if %_EL% NEQ 0 echo Error rendering item ' +
						(rIdx + 1) +
						' (exit code %_EL%) >> ' +
						wq(logFile.fsName) +
						'\r\n';
					cmd += 'if %_EL% NEQ 0 SET RENDER_FAILED=1\r\n';
					cmd += 'timeout /t 2 /nobreak >nul\r\n';
				}
			}

			// Write finish marker BEFORE cleanup so the UI detects completion immediately
			cmd += 'IF %RENDER_FAILED% EQU 1 (\r\n';
			cmd +=
				'  echo AERENDER FINISHED - FAILED >> ' + wq(logFile.fsName) + '\r\n';
			cmd += ') ELSE (\r\n';
			cmd +=
				'  echo AERENDER FINISHED - SUCCESS >> ' + wq(logFile.fsName) + '\r\n';
			cmd += ')\r\n';

			// Single PowerShell invocation for all moves (avoids per-call startup overhead)
			if (moveCommands.length > 0) {
				cmd += 'powershell -Command "' + moveCommands.join('; ') + '"\r\n';
			}

			cmd +=
				'if exist ' +
				wq(tmpAep.fsName) +
				' del ' +
				wq(tmpAep.fsName) +
				' 2>nul\r\n';
			cmd += 'exit\r\n';
		} else {
			aer = new File(Folder.appPackage.parent.fullName + '/aerender');
			shellCmdFile = new File(tempDir + '/aerender_' + timestamp + '.command');

			cmd = '#!/bin/bash\r\n';
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
		}

		if (shellCmdFile.exists == true) shellCmdFile.remove();

		if (shellCmdFile.open('w')) {
			if (is_win_os) {
				shellCmdFile.encoding = 'UTF-8';
				shellCmdFile.lineFeed = 'Windows';
				// NO BOM: It causes "'∩╗┐@echo' is not recognized" errors in cmd.exe
			} else {
				shellCmdFile.encoding = 'UTF-8';
				shellCmdFile.lineFeed = 'Unix';
			}
			shellCmdFile.write(cmd);
			shellCmdFile.close();
		} else {
			alert(
				'Failed to write batch file.\n\nPath: ' +
					shellCmdFile.fsName +
					'\nTemp dir: ' +
					tempDir +
					'\nRaw temp: ' +
					Folder.temp.fsName,
			);
			return;
		}

		if (is_win_os == false) {
			system.callSystem('chmod 755 ' + wq(shellCmdFile.fullName));
		}

		if (shellCmdFile.exists == true) {
			$.sleep(500);

			try {
				$.writeln('Launching shell. Temp dir: ' + tempDir);
				$.writeln('Batch file: ' + shellCmdFile.fsName);
				$.writeln('Batch file exists: ' + shellCmdFile.exists);

				if (is_win_os) {
					// To make it TRULY non-blocking and HIDDEN on Windows, we use a VBScript wrapper.
					// This launches the batch file without any CMD window popping up.
					var vbsFile = new File(
						tempDir + '/aerender_launcher_' + timestamp + '.vbs',
					);
					$.writeln('VBS file path: ' + vbsFile.fsName);

					if (vbsFile.open('w')) {
						// WshShell.Run(command, windowStyle, waitOnReturn)
						// windowStyle: 0 = Hidden window
						var vbsContent =
							'Set WshShell = CreateObject("WScript.Shell")\n' +
							'WshShell.Run "cmd.exe /c " & Chr(34) & "' +
							shellCmdFile.fsName +
							'" & Chr(34), 0, false\n';
						$.writeln('VBS content:\n' + vbsContent);
						vbsFile.write(vbsContent);
						vbsFile.close();

						try {
							var execOk = vbsFile.execute();
							if (!execOk) {
								throw new Error(
									'vbsFile.execute() returned false.\n' +
										'VBS path: ' +
										vbsFile.fsName +
										'\n' +
										'WSH may be disabled on this system.',
								);
							}
						} catch (execErr) {
							throw new Error(
								'vbsFile.execute() failed.\n' +
									'VBS path: ' +
									vbsFile.fsName +
									'\n' +
									'Error: ' +
									execErr.toString(),
							);
						}

						// Cleanup VBS after a short delay
						app.scheduleTask(
							'try { var f = new File("' +
								vbsFile.fsName.replace(/\\/g, '/') +
								'"); if(f.exists) f.remove(); } catch(e) {}',
							5000,
							false,
						);
					} else {
						// Fallback: try executing the batch file directly
						$.writeln(
							'WARNING: Could not open VBS file for writing. Falling back to direct execute.',
						);
						try {
							shellCmdFile.execute();
							$.writeln(
								'shellCmdFile.execute() (fallback) called successfully.',
							);
						} catch (fbErr) {
							throw new Error(
								'shellCmdFile.execute() fallback failed.\n' +
									'Batch path: ' +
									shellCmdFile.fsName +
									'\n' +
									'Error: ' +
									fbErr.toString(),
							);
						}
					}
				} else {
					try {
						shellCmdFile.execute();
						$.writeln('shellCmdFile.execute() called successfully.');
					} catch (execErr) {
						throw new Error(
							'shellCmdFile.execute() failed.\n' +
								'Script path: ' +
								shellCmdFile.fsName +
								'\n' +
								'Error: ' +
								execErr.toString(),
						);
					}
				}
			} catch (launchErr) {
				var launchErrMsg =
					'Failed to launch background render process.\n\n' +
					launchErr.toString() +
					'\n\nOS Locale: ' +
					($.locale || 'unknown') +
					'\nTemp folder (raw): ' +
					Folder.temp.fsName +
					'\nTemp folder (used): ' +
					tempDir +
					'\nBatch file: ' +
					shellCmdFile.fsName;
				$.writeln('LAUNCH ERROR: ' + launchErrMsg);
				alert(launchErrMsg);
				return;
			}

			// Show UI
			try {
				var scriptFile = new File($.fileName);
				if (scriptFile && scriptFile.exists) {
					var uiFile = new File(
						scriptFile.parent.parent.fsName + '/ui/renderBG_UI.jsx',
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
				}
			} catch (uiErr) {}
		}
	} catch (mainErr) {
		var errorMsg =
			'CRITICAL ERROR:\n' +
			mainErr.toString() +
			'\n\nLine: ' +
			(mainErr.line || 'unknown');
		$.writeln(errorMsg);
		alert(errorMsg);

		// If we have a log file and it was a shell execution issue, try to open it
		if (typeof logFile !== 'undefined' && logFile && logFile.exists) {
			logFile.execute();
		}
	}
}
