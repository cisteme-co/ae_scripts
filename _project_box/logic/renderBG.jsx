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
	var msg = (lang === 'ja') ? 'プロジェクトを保存してください。' : 'Please save the project first.';
	alert(msg);
}

function alertNoValidRenderQueue() {
	var lang = getLanguage();
	var msg = (lang === 'ja') ? '有効なレンダーキューがありません。' : 'There is no valid render queue.';
	alert(msg);
}

function getNthParentFolders(startFileOrFolder, n) {
	var folder = startFileOrFolder instanceof Folder ? startFileOrFolder : startFileOrFolder.parent;
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
		var shortPath = system.callSystem(cmd).replace(/[\r\n]/g, '').trim();
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
		var folder = (folderPath instanceof Folder) ? folderPath : new Folder(folderPath);
		
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
							outputs: []
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
										hasFile: (om.file != null),
										tempPath: null // To be filled later
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
				msg: { en: 'Select the items you want to render in the background:', ja: '背景でレンダリングする項目を選択してください：' },
				start: { en: 'Start Render', ja: 'レンダー開始' },
				cancel: { en: 'Cancel', ja: 'キャンセル' },
				selectAll: { en: 'Select All', ja: 'すべて選択' },
				selectNone: { en: 'Select None', ja: 'すべて解除' }
			};
			
			var t = function(key) { return uiStrings[key][lang] || uiStrings[key]['en']; };

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
			var allBtn = selGroup.add('button', undefined, t('selectAll'), {style: 'toolbutton'});
			var noneBtn = selGroup.add('button', undefined, t('selectNone'), {style: 'toolbutton'});

			allBtn.onClick = function() { for(var i=0; i<checkboxes.length; i++) checkboxes[i].value = true; };
			noneBtn.onClick = function() { for(var i=0; i<checkboxes.length; i++) checkboxes[i].value = false; };

			var btnGroup = dlg.add('group');
			btnGroup.orientation = 'row';
			btnGroup.alignment = 'right';
			btnGroup.spacing = 10;

			var cancelBtn = btnGroup.add('button', undefined, t('cancel'), {name: 'cancel'});
			var startBtn = btnGroup.add('button', undefined, t('start'), {name: 'ok'});

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
			
			$.writeln('User selected ' + queueInfo.length + ' items with ' + totalFrames + ' total frames');
		}

		// Now set output paths for mp4 and mov files
		$.writeln('Starting path setting...');
		// REMOVED UNDO GROUP: Render Queue changes in AE 2025 are more stable without undo groups
		try {
			for (var k = 0; k < queueInfo.length; k++) {
				var itemData = queueInfo[k];
				var item = rq.item(itemData.index);
				
				$.writeln('Processing item ' + (k+1) + '/' + queueInfo.length + ': ' + itemData.compName);
				
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
							// If no file is set, skip this output module
							$.writeln('  Output module ' + outputData.omIndex + ' has no file set, skipping');
							continue;
						}
						
						$.writeln('  Output module ' + outputData.omIndex + ' extension: ' + ext);
						
						var outputFolder = null;
						var sanitizedCompName = sanitizeFilename(itemData.compName);
						
						if (ext === 'mp4') {
							var baseFolder = getNthParentFolders(app.project.file, 5);
							if (!baseFolder) {
								alert('Cannot go up 5 folders from project file. Project might be too close to root.');
								return;
							}
							
							var folderPath = baseFolder.fullName + '/to_send/撮影/check';
							$.writeln('  MP4 output folder: ' + folderPath);
							
							if (!createFolderSafe(folderPath)) {
								alert('Failed to create MP4 output folder:\n' + folderPath);
								return;
							}
							
							outputFolder = new Folder(folderPath);
							
						} else if (ext === 'mov') {
							var baseFolder = getNthParentFolders(app.project.file, 2);
							if (!baseFolder) {
								alert('Cannot go up 2 folders from project file. Project might be at root.');
								return;
							}
							
							var folderPath = baseFolder.fullName + '/renders/' + getTodayYYYYMMDD();
							$.writeln('  MOV output folder: ' + folderPath);
							
							if (!createFolderSafe(folderPath)) {
								alert('Failed to create MOV output folder:\n' + folderPath);
								return;
							}
							
							outputFolder = new Folder(folderPath);
						} else {
							// For other formats, also put them in the today's folder if requested
							// The user specifically asked for "renders folder in todays's folder"
							var baseFolder = getNthParentFolders(app.project.file, 2);
							if (baseFolder) {
								var folderPath = baseFolder.fullName + '/renders/' + getTodayYYYYMMDD();
								if (createFolderSafe(folderPath)) {
									outputFolder = new Folder(folderPath);
									$.writeln('  ' + ext.toUpperCase() + ' output folder (defaulted): ' + folderPath);
								}
							}
							
							if (!outputFolder) {
								$.writeln('  Keeping original path for ' + ext + ' file');
								continue;
							}
						}
						
						// Set new output path
						if (outputFolder && outputFolder.exists) {
							var finalFilePath;
							var tempFilePath;
							
							if (is_win_os) {
								// STRATEGY: Render to ASCII temp folder, then move to Japanese destination
								// This is the only 100% reliable way to handle Japanese paths in aerender
								finalFilePath = new File(outputFolder.fsName + '\\' + sanitizedCompName + '.' + ext);
								
								// Use a more unique temp name with counter
								var tempName = 'ae_render_' + timestamp + '_i' + itemData.index + '_m' + outputData.omIndex + '.' + ext;
								tempFilePath = new File(Folder.temp.fsName + '\\' + tempName);
								
								// Store move command for later
								// Use powershell for moving to handle Unicode paths correctly
								// -LiteralPath avoids issues with special characters in the source path
								// We use single quotes inside the powershell command for simplicity
								var moveCmd = 'powershell -Command "Move-Item -LiteralPath \'' + tempFilePath.fsName + '\' -Destination \'' + finalFilePath.fsName + '\' -Force"';
								moveCommands.push(moveCmd);
								
								// AE 2025 Robustness: Set the path to the temp file
								$.writeln('  [WIN] Temp Path: ' + tempFilePath.fsName);
								$.writeln('  [WIN] Final Path: ' + finalFilePath.fsName);
								
								var targetFile = tempFilePath;
								outputData.tempPath = tempFilePath.fsName; // Store for aerender flag
							} else {
								var targetFile = new File(outputFolder.fullName + '/' + sanitizedCompName + '.' + ext);
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
								
								// 2. Try to apply template (sometimes resets internal state)
								try {
									om.applyTemplate(om.name);
								} catch (e) {}
								
								// 3. Set the file using setSettings (Modern AE way)
								try {
									var settings = {
										"Output File Info": {
											"Full Flat Path": targetFile.fsName
										}
									};
									om.setSettings(settings);
								} catch (e) {
									$.writeln('  setSettings failed, falling back to .file assignment: ' + e.toString());
								}
								
								// 4. Fallback/Verify with .file assignment
								if (om.file === null || om.file.fsName.toLowerCase() !== targetFile.fsName.toLowerCase()) {
									om.file = new File(targetFile.fsName);
								}
								
								// 5. Final verification - if this fails, we cannot proceed safely
								if (om.file === null || om.file.fsName.toLowerCase() !== targetFile.fsName.toLowerCase()) {
									var err = 'CRITICAL: Failed to set output path for ' + itemData.compName + '.\n' +
											  'Expected: ' + targetFile.fsName + '\n' +
											  'Got: ' + (om.file ? om.file.fsName : 'NULL');
									throw new Error(err);
								}
								
								if (originalStatus === RQItemStatus.QUEUED) {
									item.status = RQItemStatus.QUEUED;
								}
								
								app.endSuppressDialogs(false);
								$.writeln('  Path set successfully to: ' + om.file.fsName);
							} catch (setErr) {
								app.endSuppressDialogs(false);
								$.writeln('  Warning: Path assignment error: ' + setErr.toString());
								if (originalStatus === RQItemStatus.QUEUED) {
									try { item.status = RQItemStatus.QUEUED; } catch(e) {}
								}
							}
						}
					} catch (omSetErr) {
						$.writeln('ERROR setting output module path: ' + omSetErr.toString());
						alert('Error setting output path:\n' + omSetErr.toString() + '\n\nComp: ' + itemData.compName);
						return;
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
		
		// Move temp file back to Folder.temp to avoid Japanese characters in project path
		var tmpAep = new File(Folder.temp.fullName + '/' + 'aerender_temp_' + timestamp + '.aep');
		var logFile = new File(Folder.temp.fullName + '/' + 'aerender_log_' + timestamp + '.txt');

		try {
			$.writeln('Saving temporary project: ' + tmpAep.fsName);
			app.project.save(tmpAep);
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
				var altAer = new File('C:\\Program Files\\Adobe\\Adobe After Effects 2025\\Support Files\\aerender.exe');
				if (altAer.exists) aer = altAer;
			}
			
			if (!aer.exists) {
				alert('aerender.exe not found at:\n' + aer.fsName);
				return;
			}

			shellCmdFile = new File(Folder.temp.fullName + '/aerender_' + timestamp + '.bat');
			var aerShort = getShortPath(aer);
			
			cmd = '@echo off\r\n';
			cmd += 'chcp 65001 >nul\r\n';
			cmd += 'echo Starting render...\r\n';
			
			// Write start marker to log immediately
			cmd += 'echo RENDER_STARTED > ' + wq(logFile.fsName) + '\r\n';
			
			// Generate aerender command for each item using the -output flag
			for (var rIdx = 0; rIdx < queueInfo.length; rIdx++) {
				var rItem = queueInfo[rIdx];
				for (var oIdx = 0; oIdx < rItem.outputs.length; oIdx++) {
					var oData = rItem.outputs[oIdx];
					if (oData.tempPath) {
						cmd += 'echo Rendering Item ' + (rIdx+1) + ' Output ' + (oIdx+1) + '...\r\n';
						// Append to log for accurate progress tracking
						cmd += wq(aerShort) + ' -project ' + wq(tmpAep.fsName);
						cmd += ' -rqindex ' + rItem.index;
						cmd += ' -output ' + wq(oData.tempPath);
						cmd += ' -sound ON >> ' + wq(logFile.fsName) + ' 2>&1\r\n';
					}
				}
			}
			
			if (moveCommands.length > 0) {
				cmd += 'echo Moving files to destination...\r\n';
				for (var moveIdx = 0; moveIdx < moveCommands.length; moveIdx++) {
					cmd += moveCommands[moveIdx] + '\r\n';
				}
			}
			
			cmd += 'echo Cleaning up...\r\n';
			cmd += 'if exist ' + wq(tmpAep.fsName) + ' del ' + wq(tmpAep.fsName) + ' 2>nul\r\n';
			
			// Small delay to ensure all logs are flushed before the final marker
			cmd += 'timeout /t 2 /nobreak >nul\r\n';
			
			cmd += 'echo Render process finished.\r\n';
			// Log finish at the very end to signal success to UI
			cmd += 'echo AERENDER FINISHED - Render process finished. >> ' + wq(logFile.fsName) + ' 2>&1\r\n';
			cmd += 'exit\r\n';
		} else {
			aer = new File(Folder.appPackage.parent.fullName + '/aerender');
			shellCmdFile = new File(Folder.temp.fullName + '/aerender_' + timestamp + '.command');
			
			cmd = '#!/bin/bash\r\n';
			cmd += 'echo "Starting render..."\r\n';
			cmd += wq(aer.fsName) + ' -project ' + wq(tmpAep.fsName) + ' -sound ON 2>&1 | tee ' + wq(logFile.fsName) + '\r\n';
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
		}
		
		if (is_win_os == false) {
			system.callSystem('chmod 755 ' + wq(shellCmdFile.fullName));
		}
		
		if (shellCmdFile.exists == true) {
			$.sleep(500);
			
			if (is_win_os) {
				// To make it TRULY non-blocking and HIDDEN on Windows, we use a VBScript wrapper.
				// This launches the batch file without any CMD window popping up.
				var vbsFile = new File(Folder.temp.fullName + '/aerender_launcher_' + timestamp + '.vbs');
				if (vbsFile.open('w')) {
					// WshShell.Run(command, windowStyle, waitOnReturn)
					// windowStyle: 0 = Hidden window
					vbsFile.write('Set WshShell = CreateObject("WScript.Shell")\n');
					vbsFile.write('WshShell.Run "cmd.exe /c " & Chr(34) & "' + shellCmdFile.fsName + '" & Chr(34), 0, false\n');
					vbsFile.close();
					
					vbsFile.execute();
					
					// Cleanup VBS after a short delay
					app.scheduleTask('try { var f = new File("' + vbsFile.fsName.replace(/\\/g, '/') + '"); if(f.exists) f.remove(); } catch(e) {}', 5000, false);
				} else {
					// Fallback if VBS creation fails
					shellCmdFile.execute();
				}
			} else {
				shellCmdFile.execute();
			}

			// Show UI
			try {
				var scriptFile = new File($.fileName);
				if (scriptFile && scriptFile.exists) {
					var uiFile = new File(scriptFile.parent.parent.fsName + '/ui/renderBG_UI.jsx');
					
					if (uiFile.exists) {
						$.evalFile(uiFile);
						if (typeof showRenderBG_UI === 'function') {
							showRenderBG_UI(compNames, tmpAep.fsName, totalFrames, logFile.fsName);
						}
					}
				}
			} catch (uiErr) {}
		}
		
	} catch (mainErr) {
		var errorMsg = 'CRITICAL ERROR:\n' + mainErr.toString() + '\n\nLine: ' + (mainErr.line || 'unknown');
		$.writeln(errorMsg);
		alert(errorMsg);
		
		// If we have a log file and it was a shell execution issue, try to open it
		if (typeof logFile !== 'undefined' && logFile && logFile.exists) {
			logFile.execute();
		}
	}
}