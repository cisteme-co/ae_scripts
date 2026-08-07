function showRenderBG_UI(
	compNames,
	tempFilePath,
	totalFrames,
	logFilePath,
	pidFilePath,
) {
	if (!compNames || compNames.length === 0) return;

	var is_win_os = $.os.toLowerCase().indexOf('windows') >= 0;
	var locale = $.locale || 'en';
	var lang = locale.substring(0, 2); // e.g., "ja" or "en"

	var strings = {
		title: { en: 'Background Render', ja: '背景レンダリング' },
		header: {
			en: 'Rendering Compositions:',
			ja: 'レンダリング中のコンポジション:',
		},
		cancel: { en: 'Cancel Render', ja: 'レンダーを中止' },
		confirmCancel: {
			en: 'Are you sure you want to stop this render?',
			ja: 'このレンダリングを停止してもよろしいですか？',
		},
		cancelled: { en: 'Render cancelled.', ja: 'レンダーが中止されました。' },
		preparing: { en: 'Preparing render...', ja: 'レンダリングの準備中...' },
		rendering: { en: 'Rendering: ', ja: 'レンダリング中: ' },
		finished: { en: 'Finished!', ja: '完了しました！' },
		error: {
			en: 'Error cancelling render: ',
			ja: 'レンダー中止中にエラーが発生しました: ',
		},
		renderSuccess: {
			en: 'Render completed successfully!',
			ja: 'レンダリングが正常に完了しました！',
		},
		renderFailed: {
			en: 'Render failed or crashed. Please check the log for details.',
			ja: 'レンダリングが失敗またはクラッシュしました。詳細はログを確認してください。',
		},
	};

	function t(key) {
		return strings[key][lang] || strings[key]['en'];
	}

	// IMPROVED: Safe log file reading with proper encoding detection
	function readLogSafely(logFile) {
		if (!logFile) return '';

		try {
			var f = new File(logFile);
			if (!f.exists) return '';

			var content = '';
			var encodings = is_win_os ? ['UTF-8', 'UTF-16LE', 'UTF-16'] : ['UTF-8'];

			for (var i = 0; i < encodings.length; i++) {
				f.encoding = encodings[i];
				if (f.open('r')) {
					try {
						var testContent = f.read();
						f.close();

						// Check if content is valid (not full of null chars or corrupted)
						if (testContent && testContent.length > 0) {
							var nullCount = 0;
							for (var j = 0; j < Math.min(100, testContent.length); j++) {
								if (testContent.charCodeAt(j) === 0) nullCount++;
							}
							// If less than 30% null chars, consider it valid
							if (nullCount < 30) {
								content = testContent;
								break;
							}
						}
					} catch (e) {
						f.close();
					}
				}
			}
			return content;
		} catch (e) {
			return '';
		}
	}

	// Create a palette window (non-modal)
	var win = new Window('palette', t('title'), undefined, { resizeable: false });
	win.orientation = 'column';
	win.alignChildren = ['fill', 'top'];
	win.spacing = 10;
	win.margins = 16;

	// Header
	var header = win.add('statictext', undefined, t('header'));
	header.graphics.font = ScriptUI.newFont('dialog', 'BOLD', 14);

	// List of comps
	var compListGroup = win.add('group');
	compListGroup.orientation = 'column';
	compListGroup.alignChildren = ['left', 'top'];
	compListGroup.spacing = 2;

	for (var i = 0; i < compNames.length; i++) {
		compListGroup.add('statictext', undefined, '• ' + compNames[i]);
	}

	// Progress Bar
	var progGroup = win.add('group');
	progGroup.orientation = 'column';
	progGroup.alignChildren = ['fill', 'center'];
	progGroup.spacing = 4;
	progGroup.margins.top = 10;

	var progressBar = progGroup.add('progressbar', undefined, 0, 100);
	progressBar.preferredSize.width = 300;
	progressBar.value = 0;

	var progressText = progGroup.add('statictext', undefined, t('preparing'));
	progressText.alignment = 'center';
	progressText.preferredSize.width = 300;
	progressText.graphics.foregroundColor = progressText.graphics.newPen(
		progressText.graphics.PenType.SOLID_COLOR,
		[0.7, 0.7, 0.7, 1],
		1,
	);

	// Cancel Button
	var cancelBtn = win.add('button', undefined, t('cancel'));
	cancelBtn.preferredSize.height = 30;

	var pollTask = null;
	var renderOutcomeDetected = false;
	var lastFramesDone = 0;
	var fakeProgressTicks = 0;
	var hasRenderStarted = false;

	cancelBtn.onClick = function () {
		if (confirm(t('confirmCancel'))) {
			try {
				// IMPROVED: Kill only the specific render process by PID instead of all aerender.exe processes
				var processID = null;

				// Try to read PID from pidFile
				if (pidFilePath) {
					try {
						var pidFile = new File(pidFilePath);
						if (pidFile.exists && pidFile.open('r')) {
							var pidContent = pidFile.read();
							pidFile.close();
							processID = parseInt(pidContent.trim());
							if (isNaN(processID)) {
								processID = null;
							}
						}
					} catch (e) {
						$.writeln('Error reading PID file: ' + e.toString());
					}
				}

				// Kill the specific process or fallback to generic kill
				if (is_win_os) {
					if (processID && !isNaN(processID)) {
						// Kill specific PID
						system.callSystem('taskkill /F /PID ' + processID + ' /T');
					} else {
						// Fallback: Kill all aerender processes (only if we can't determine specific PID)
						system.callSystem('taskkill /F /IM aerender.exe /T');
					}
				} else {
					if (processID && !isNaN(processID)) {
						// Kill specific PID on macOS/Linux
						system.callSystem('kill -KILL ' + processID);
					} else {
						// Fallback: Kill all aerender processes (only if we can't determine specific PID)
						system.callSystem('killall aerender');
					}
				}

				// IMPROVED: Safe task cancellation
				if (pollTask != null) {
					try {
						app.cancelTask(pollTask);
					} catch (e) {
						$.writeln('Error canceling task: ' + e.toString());
					}
					pollTask = null;
				}

				// Cleanup temp file if it still exists after cancel
				if (tempFilePath) {
					try {
						var f = new File(tempFilePath);
						if (f.exists) f.remove();
					} catch (e) {
						// Ignore cleanup errors
					}
				}

				// Cleanup log file if it exists
				if (logFilePath) {
					try {
						var lf = new File(logFilePath);
						if (lf.exists) lf.remove();
					} catch (e) {
						// Ignore cleanup errors
					}
				}

				// Cleanup PID file if it exists
				if (pidFilePath) {
					try {
						var pf = new File(pidFilePath);
						if (pf.exists) pf.remove();
					} catch (e) {
						// Ignore cleanup errors
					}
				}

				alert(t('cancelled'));
				win.close();
			} catch (e) {
				alert(t('error') + e.toString());
			}
		}
	};

	function processOutcome(content) {
		if (renderOutcomeDetected) return;
		renderOutcomeDetected = true;

		if (pollTask != null) {
			try {
				app.cancelTask(pollTask);
			} catch (e) {}
			pollTask = null;
		}

		progressBar.value = 100;
		progressText.text = t('finished');

		var isSuccess = false;
		if (content && content.length > 0) {
			var upper = content.toUpperCase();
			// Explicit markers written by the batch file are authoritative
			if (upper.indexOf('AERENDER FINISHED - SUCCESS') !== -1) {
				isSuccess = true;
			} else if (upper.indexOf('AERENDER FINISHED - FAILED') !== -1) {
				isSuccess = false;
			} else {
				// No explicit marker — fall back to aerender output heuristics
				// 合計経過時間 = Japanese 'TOTAL TIME ELAPSED'
				var hasTimeElapsed =
					upper.indexOf('TOTAL TIME ELAPSED') !== -1 ||
					content.indexOf('合計経過時間') !== -1;
				if (hasTimeElapsed || upper.indexOf('LOG ENDED') !== -1) {
					isSuccess = true;
				}
				if (!isSuccess && totalFrames > 0) {
					var fm = content.match(/PROGRESS:.*?\(\d+\)/gi);
					if (fm && fm.length >= totalFrames) isSuccess = true;
				}
				// Non-fatal AE warnings must not override TOTAL TIME ELAPSED (render completed normally)
				if (
					!hasTimeElapsed &&
					(upper.indexOf('AERENDER ERROR') !== -1 ||
						upper.indexOf('AFTER EFFECTS ERROR:') !== -1 ||
						upper.indexOf(': ERROR ') !== -1)
				) {
					isSuccess = false;
				}
			}
		}

		if (isSuccess) {
			alert(t('renderSuccess'));
			if (logFilePath) {
				try {
					var lf = new File(logFilePath);
					if (lf.exists) lf.remove();
				} catch (e) {}
			}
			if (pidFilePath) {
				try {
					var pf = new File(pidFilePath);
					if (pf.exists) pf.remove();
				} catch (e) {}
			}
		} else {
			alert(t('renderFailed'));
			if (logFilePath) {
				try {
					var lf = new File(logFilePath);
					if (lf.exists) lf.execute();
				} catch (e) {}
			}
		}
		try {
			win.close();
		} catch (e) {}
	}

	function checkStatus() {
		try {
			var framesDone = 0;

			// Try to read log file to get actual progress
			if (logFilePath) {
				var content = readLogSafely(logFilePath);

				if (content && content.length > 0) {
					// Check if we have started rendering
					var hasStarted = content.indexOf('RENDER_STARTED') !== -1;

					// Parse actual frame progress from aerender output
					// aerender outputs: PROGRESS:  0:00:00:00 (1): 1 Frames
					var matches = content.match(/PROGRESS:.*?\(\d+\)/gi);
					if (matches) {
						framesDone = matches.length;
					}

					// FALLBACK: If aerender doesn't output PROGRESS (sometimes happens with redirection),
					// look for "Finished frame" which is also common in logs
					if (!matches || matches.length === 0) {
						var finishedMatches = content.match(/Finished frame/gi);
						if (finishedMatches) {
							framesDone = finishedMatches.length;
						}
					}

					if (hasStarted) hasRenderStarted = true;

					if (hasRenderStarted) {
						if (framesDone > 0 && totalFrames > 0) {
							// Real progress from aerender PROGRESS lines
							var percent = Math.min(
								100,
								Math.round((framesDone / totalFrames) * 100),
							);
							progressBar.value = percent;
							progressText.text =
								t('rendering') +
								percent +
								'% (' +
								framesDone +
								'/' +
								totalFrames +
								')';
						} else if (framesDone > lastFramesDone) {
							lastFramesDone = framesDone;
							if (progressBar.value < 95) progressBar.value += 1;
							progressText.text = t('rendering') + framesDone + ' frames';
						} else {
							// Aerender buffers stdout to file — advance bar slowly for visual feedback
							fakeProgressTicks++;
							if (fakeProgressTicks % 2 === 0 && progressBar.value < 85)
								progressBar.value += 1;
							progressText.text = t('rendering') + '...';
						}
					} else {
						progressText.text = t('preparing');
					}
				} else {
					if (!hasRenderStarted) progressText.text = t('preparing');
				}
			}

			// Check if render is complete (log file contains finished marker)
			if (logFilePath) {
				try {
					var content = readLogSafely(logFilePath);

					// Frame count is ASCII and encoding-agnostic — most reliable signal
					var cFm = content.match(/PROGRESS:.*?\(\d+\)/gi);
					var cCount = cFm ? cFm.length : 0;
					var isFinishedMarkerFound =
						content.indexOf('AERENDER FINISHED') !== -1 ||
						content.toUpperCase().indexOf('TOTAL TIME ELAPSED') !== -1 ||
						content.indexOf('合計経過時間') !== -1 ||
						(totalFrames > 0 && cCount >= totalFrames);

					if (isFinishedMarkerFound && !renderOutcomeDetected) {
						processOutcome(content);
					}
				} catch (e) {
					// ADDED: Error handling for file existence check
					$.writeln('Error checking temp file: ' + e.toString());
				}
			}

			// Backup: tmpAep deleted by the batch means render + cleanup are done.
			// Guard: only fire when the log actually confirms completion, so a
			// missing/unsaved tmpAep doesn’t trigger a false failure mid-render.
			if (!renderOutcomeDetected && tempFilePath && hasRenderStarted) {
				try {
					if (!new File(tempFilePath).exists) {
						var bkContent = readLogSafely(logFilePath);
						var bkUpper = bkContent.toUpperCase();
						var bkFm = bkContent.match(/PROGRESS:.*?\(\d+\)/gi);
						var bkCount = bkFm ? bkFm.length : 0;
						var bkDone =
							bkUpper.indexOf('AERENDER FINISHED') !== -1 ||
							bkUpper.indexOf('TOTAL TIME ELAPSED') !== -1 ||
							bkContent.indexOf('合計経過時間') !== -1 ||
							(totalFrames > 0 && bkCount >= totalFrames) ||
							bkCount > 0; // any rendered frames + tmpAep gone = batch completed
						if (bkDone) processOutcome(bkContent);
					}
				} catch (e) {}
			}
		} catch (e) {
			$.writeln('Error in checkStatus: ' + e.toString());
		}
	}

	// IMPROVED: Use unique global reference to avoid conflicts
	var winId = 'renderBG_win_' + new Date().getTime();
	$.global[winId] = win;

	win.onClose = function () {
		if (pollTask != null) {
			try {
				app.cancelTask(pollTask);
			} catch (e) {
				// Ignore
			}
			pollTask = null;
		}
		try {
			$.global[winId] = null;
		} catch (e) {
			// Ignore
		}
	};

	win.center();
	win.show();

	// Start a polling task (every 1 second) to check progress
	if (tempFilePath) {
		// Use unique function name to avoid conflicts
		var checkFnName = 'renderBG_check_' + new Date().getTime();

		$.global[checkFnName] = function () {
			try {
				if (win && win.visible) {
					checkStatus();
				} else {
					if (pollTask != null) {
						try {
							app.cancelTask(pollTask);
						} catch (e) {
							// Ignore
						}
						pollTask = null;
					}
				}
			} catch (e) {
				$.writeln('Error in check function: ' + e.toString());
			}
		};

		try {
			pollTask = app.scheduleTask(
				'if($.global.' + checkFnName + ') $.global.' + checkFnName + '();',
				1000,
				true,
			);
		} catch (e) {
			alert('Error starting progress monitor: ' + e.toString());
		}
	}

	return win;
}
