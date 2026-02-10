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
        rendering: { en: 'Rendering... ', ja: 'レンダリング中... ' },
        finished: { en: 'Finished!', ja: '完了！' },
        error: { en: 'Error cancelling render: ', ja: 'レンダー中止中にエラーが発生しました: ' },
        renderSuccess: { en: 'Render completed successfully!', ja: 'レンダリングが正常に完了しました！' },
        renderFailed: { en: 'Render failed or crashed. Please check the log for details.', ja: 'レンダリングが失敗またはクラッシュしました。詳細はログを確認してください。' }
    };

    function t(key) {
        return strings[key][lang] || strings[key]['en'];
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

    // Progress Bar (Visual only for now)
    var progGroup = win.add('group');
    progGroup.orientation = 'column';
    progGroup.alignChildren = ['fill', 'center'];
    progGroup.spacing = 4;
    progGroup.margins.top = 10;
    
    var progressBar = progGroup.add('progressbar', undefined, 0, 100);
    progressBar.preferredSize.width = 250;
    progressBar.value = 0; // Starts at 0
    
    var progressText = progGroup.add('statictext', undefined, 'Rendering...');
    progressText.alignment = 'center';
    progressText.graphics.foregroundColor = progressText.graphics.newPen(progressText.graphics.PenType.SOLID_COLOR, [0.7, 0.7, 0.7, 1], 1);

    // Cancel Button
    var cancelBtn = win.add('button', undefined, t('cancel'));
    cancelBtn.preferredSize.height = 30;
    
    var pollTask = null;
    var renderOutcomeDetected = false;

    cancelBtn.onClick = function() {
        if (confirm(t('confirmCancel'))) {
            try {
                if (is_win_os) {
                    // Use taskkill /T to kill the process tree (including the shell that started it)
                    system.callSystem('taskkill /F /IM aerender.exe /T');
                } else {
                    system.callSystem('killall aerender');
                }
                if (pollTask) app.cancelTask(pollTask);
                
                // Cleanup temp file if it still exists after cancel
                if (tempFilePath) {
                    var f = new File(tempFilePath);
                    if (f.exists) f.remove();
                }
                // Cleanup log file if it exists
                if (logFilePath) {
                    var lf = new File(logFilePath);
                    if (lf.exists) lf.remove();
                }

                alert(t('cancelled'));
                win.close();
            } catch (e) {
                alert(t('error') + e.toString());
            }
        }
    };

    // Auto-close check
    function checkStatus() {
        var framesDone = 0;
        
        // Try to read log file to get actual progress
        if (logFilePath) {
            var lf = new File(logFilePath);
            if (lf.exists) {
                // On Windows, PowerShell's Tee-Object often writes in UTF-16LE
                // We'll try to detect or just set it to handle common cases
                if (is_win_os) lf.encoding = 'UTF-16'; 
                
                if (lf.open('r')) {
                    try {
                        var content = lf.read();
                        lf.close();
                        
                        // If content is empty with UTF-16, try default encoding (for Mac/Linux or different PS versions)
                        if (!content || content.length === 0) {
                            lf.encoding = 'UTF-8';
                            if (lf.open('r')) {
                                content = lf.read();
                                lf.close();
                            }
                        }

                        // Count lines that indicate a frame was rendered.
                        // aerender outputs: PROGRESS:  0:00:00:00 (1): 1 Frames
                        var matches = content.match(/^PROGRESS:.*?\(\d+\)/gm);
                        if (matches) {
                            framesDone = matches.length;
                        }
                    } catch (e) {
                        // Ignore read errors
                    }
                }
            }
        }

        if (totalFrames > 0) {
            var percent = Math.min(100, Math.round((framesDone / totalFrames) * 100));
            progressBar.value = percent;
            progressText.text = t('rendering') + percent + '% (' + framesDone + '/' + totalFrames + ')';
        } else {
            // Fallback to fake progress if totalFrames is not available
            if (progressBar.value < 95) {
                progressBar.value += 1;
            }
        }

        if (tempFilePath) {
            var f = new File(tempFilePath);
            if (!f.exists && !renderOutcomeDetected) {
                renderOutcomeDetected = true;
                // The batch file deletes the temp AEP when it finishes.
                // If it's gone, the render is likely done.
                if (pollTask) app.cancelTask(pollTask);
                
                progressBar.value = 100;
                progressText.text = t('finished');
                
                // Final check of the log file to determine success/failure
                var isSuccess = false;
                if (logFilePath) {
                    var lf = new File(logFilePath);
                    if (lf.exists) {
                        if (is_win_os) lf.encoding = 'UTF-16';
                        if (lf.open('r')) {
                            var finalContent = lf.read();
                            lf.close();
                            // If content seems empty or garbage (not containing common markers), try UTF-8
                             var isGarbage = !finalContent || (finalContent.indexOf('PROGRESS') === -1 && finalContent.indexOf('FINISHED') === -1);
                             if (isGarbage) {
                                 lf.encoding = 'UTF-8';
                                 if (lf.open('r')) {
                                     finalContent = lf.read();
                                     lf.close();
                                 }
                             }
                             // Check for success markers (case-insensitive)
                              var upperContent = finalContent.toUpperCase();
                              if (upperContent && (
                                  upperContent.indexOf('FINISHED') !== -1 || 
                                  upperContent.indexOf('BATCH RENDER COMPLETED') !== -1 ||
                                  upperContent.indexOf('TOTAL TIME ELAPSED') !== -1 ||
                                  upperContent.indexOf('RENDER PROCESSED') !== -1
                              )) {
                                  isSuccess = true;
                              }
 
                              // Fallback: If we can't find markers but progress shows all frames are done
                              if (!isSuccess && totalFrames > 0) {
                                  var finalMatches = finalContent.match(/^PROGRESS:.*?\(\d+\)/gm);
                                  var finalFramesDone = finalMatches ? finalMatches.length : 0;
                                  if (finalFramesDone >= totalFrames) {
                                      isSuccess = true;
                                  }
                              }

                              // Final check: if there's a clear error message, mark as failure
                              if (upperContent && (
                                  upperContent.indexOf('ERROR:') !== -1 || 
                                  upperContent.indexOf('AFTER EFFECTS ERROR:') !== -1 ||
                                  upperContent.indexOf('AERENDER ERROR:') !== -1
                              )) {
                                  isSuccess = false;
                              }
                        }
                    }
                }

                // Show alert based on outcome
                if (isSuccess) {
                    alert(t('renderSuccess'));
                } else {
                    alert(t('renderFailed'));
                }

                // Delay closing a bit so user can see 100%
                app.scheduleTask('if($.global.renderBG_win) $.global.renderBG_win.close();', 100, false);
                
                // Cleanup log file
                if (logFilePath) {
                    var lf = new File(logFilePath);
                    if (lf.exists) lf.remove();
                }
            }
        }
    }

    $.global.renderBG_win = win;

    win.onClose = function() {
        if (pollTask) app.cancelTask(pollTask);
        $.global.renderBG_win = null;
    };

    win.center();
    win.show();

    // Start a polling task (every 1 second) to check progress
    if (tempFilePath) {
        pollTask = app.scheduleTask('showRenderBG_UI_check();', 1000, true);
        
        // Use global to ensure the task can find the check function
        $.global.showRenderBG_UI_check = function() {
            if (win && win.visible) {
                checkStatus();
            } else {
                if (pollTask) {
                    app.cancelTask(pollTask);
                    pollTask = null;
                }
            }
        };
    }

    return win;
}
