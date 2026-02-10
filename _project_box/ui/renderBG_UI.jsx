function showRenderBG_UI(compNames, tempFilePath, totalFrames, logFilePath) {
    if (!compNames || compNames.length === 0) return;

    var is_win_os = $.os.toLowerCase().indexOf('windows') >= 0;
    var locale = $.locale || 'en';
    var lang = locale.substring(0, 2); // e.g., "ja" or "en"

    var strings = {
        title: { en: 'Background Render', ja: '背景レンダリング' },
        header: { en: 'Rendering Compositions:', ja: 'レンダリング中のコンポジション:' },
        cancel: { en: 'Cancel Render', ja: 'レンダーを中止' },
        confirmCancel: { 
            en: 'Are you sure you want to stop all background renders?', 
            ja: 'すべての背景レンダリングを停止してもよろしいですか？' 
        },
        cancelled: { en: 'Render cancelled.', ja: 'レンダーが中止されました。' },
        preparing: { en: 'Preparing render...', ja: 'レンダリングの準備中...' },
        rendering: { en: 'Rendering: ', ja: 'レンダリング中: ' },
        finished: { en: 'Finished!', ja: '完了しました！' },
        error: { en: 'Error cancelling render: ', ja: 'レンダー中止中にエラーが発生しました: ' },
        renderSuccess: { en: 'Render completed successfully!', ja: 'レンダリングが正常に完了しました！' },
        renderFailed: { en: 'Render failed or crashed. Please check the log for details.', ja: 'レンダリングが失敗またはクラッシュしました。詳細はログを確認してください。' }
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
    progressText.graphics.foregroundColor = progressText.graphics.newPen(progressText.graphics.PenType.SOLID_COLOR, [0.7, 0.7, 0.7, 1], 1);

    // Cancel Button
    var cancelBtn = win.add('button', undefined, t('cancel'));
    cancelBtn.preferredSize.height = 30;
    
    var pollTask = null;
    var renderOutcomeDetected = false;
    var lastFramesDone = 0;

    cancelBtn.onClick = function() {
        if (confirm(t('confirmCancel'))) {
            try {
                if (is_win_os) {
                    system.callSystem('taskkill /F /IM aerender.exe /T');
                } else {
                    system.callSystem('killall aerender');
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

                alert(t('cancelled'));
                win.close();
            } catch (e) {
                alert(t('error') + e.toString());
            }
        }
    };

    // IMPROVED: Auto-close check with better error handling
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

                    if (hasStarted) {
                        if (totalFrames > 0) {
                            var percent = Math.min(100, Math.round((framesDone / totalFrames) * 100));
                            progressBar.value = percent;
                            progressText.text = t('rendering') + percent + '% (' + framesDone + '/' + totalFrames + ')';
                        } else {
                            progressText.text = t('rendering') + framesDone + ' frames';
                            if (framesDone > lastFramesDone) {
                                lastFramesDone = framesDone;
                                if (progressBar.value < 95) progressBar.value += 1;
                            }
                        }
                    } else {
                        progressText.text = t('preparing');
                    }
                } else {
                    progressText.text = t('preparing');
                }
            }

            // Check if render is complete (log file contains finished marker)
            if (logFilePath) {
                try {
                    var content = readLogSafely(logFilePath);
                    
                    // Robust check for multiple possible finish markers
                    var isFinishedMarkerFound = (content.indexOf('Render process finished.') !== -1) || 
                                              (content.indexOf('AERENDER FINISHED') !== -1);
                    
                    if (isFinishedMarkerFound && !renderOutcomeDetected) {
                        renderOutcomeDetected = true;
                        
                        if (pollTask != null) {
                            try {
                                app.cancelTask(pollTask);
                            } catch (e) {
                                // Ignore
                            }
                            pollTask = null;
                        }
                        
                        progressBar.value = 100;
                        progressText.text = t('finished');
                        
                        // Final check of the log file to determine success/failure
                        var isSuccess = false;
                        if (logFilePath) {
                            var finalContent = readLogSafely(logFilePath);
                            
                            if (finalContent && finalContent.length > 0) {
                                var upperContent = finalContent.toUpperCase();
                                
                                // Check for success markers
                                if (upperContent.indexOf('TOTAL TIME ELAPSED') !== -1 ||
                                    upperContent.indexOf('AERENDER FINISHED') !== -1 ||
                                    upperContent.indexOf('LOG ENDED') !== -1) {
                                    isSuccess = true;
                                }
                                
                                // Fallback: If we rendered all frames, consider it success
                                if (!isSuccess && totalFrames > 0) {
                                    var finalMatches = finalContent.match(/PROGRESS:.*?\(\d+\)/gi);
                                    var finalFramesDone = finalMatches ? finalMatches.length : 0;
                                    if (finalFramesDone >= totalFrames) {
                                        isSuccess = true;
                                    }
                                }

                                // Check for explicit error markers
                                if (upperContent.indexOf('AERENDER ERROR') !== -1 || 
                                    upperContent.indexOf('AFTER EFFECTS ERROR:') !== -1 ||
                                    upperContent.indexOf(': ERROR ') !== -1) {
                                    isSuccess = false;
                                }
                            }
                        }

                        // Show alert based on outcome
                        if (isSuccess) {
                            alert(t('renderSuccess'));
                            // Cleanup log file only on success
                            if (logFilePath) {
                                try {
                                    var lf = new File(logFilePath);
                                    if (lf.exists) lf.remove();
                                } catch (e) {}
                            }
                        } else {
                            alert(t('renderFailed'));
                            // Open log file directly on failure
                            if (logFilePath) {
                                try {
                                    var lf = new File(logFilePath);
                                    if (lf.exists) {
                                        lf.execute();
                                    }
                                } catch (e) {
                                    $.writeln('Error opening log file: ' + e.toString());
                                }
                            }
                        }

                        // IMPROVED: Use unique global reference for scheduled close
                        var closeWinId = 'closeRenderWin_' + new Date().getTime();
                        $.global[closeWinId] = win;
                        app.scheduleTask(
                            'try { if($.global.' + closeWinId + ') { $.global.' + closeWinId + '.close(); $.global.' + closeWinId + ' = null; } } catch(e) {}',
                            500,
                            false
                        );
                        
                    }
                } catch (e) {
                    // ADDED: Error handling for file existence check
                    $.writeln('Error checking temp file: ' + e.toString());
                }
            }
        } catch (e) {
            // ADDED: Catch-all error handler to prevent crashes
            $.writeln('Error in checkStatus: ' + e.toString());
        }
    }

    // IMPROVED: Use unique global reference to avoid conflicts
    var winId = 'renderBG_win_' + new Date().getTime();
    $.global[winId] = win;

    win.onClose = function() {
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
        
        $.global[checkFnName] = function() {
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
            pollTask = app.scheduleTask('if($.global.' + checkFnName + ') $.global.' + checkFnName + '();', 1000, true);
        } catch (e) {
            alert('Error starting progress monitor: ' + e.toString());
        }
    }

    return win;
}