function showRenderBG_UI(compNames, tempFilePath) {
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
        error: { en: 'Error cancelling render: ', ja: 'レンダー中止中にエラーが発生しました: ' }
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

                alert(t('cancelled'));
                win.close();
            } catch (e) {
                alert(t('error') + e.toString());
            }
        }
    };

    // Auto-close check
    function checkStatus() {
        // Increment progress bar slightly for visual feedback (fake progress)
        if (progressBar.value < 95) {
            progressBar.value += 1;
        }

        if (tempFilePath) {
            var f = new File(tempFilePath);
            if (!f.exists) {
                // The batch file deletes the temp AEP when it finishes.
                // If it's gone, the render is likely done.
                if (pollTask) app.cancelTask(pollTask);
                win.close();
            }
        }
    }

    win.onClose = function() {
        if (pollTask) app.cancelTask(pollTask);
    };

    win.center();
    win.show();

    // Start a very lightweight polling task (every 5 seconds) to check if the file is gone
    if (tempFilePath) {
        pollTask = app.scheduleTask('showRenderBG_UI_check();', 5000, true);
        
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
