(function (thisObj) {

    buildUI(thisObj);

    function buildUI(thisObj) {

        var win = (thisObj instanceof Panel) ? thisObj : new Window("palette", "Retimer", undefined, {

            resizeable: true

        });

        var panelGroup = win.add("group");
        panelGroup.alignChildren = 'fill'
        panelGroup.orientation = 'column'
        panelGroup.spacing = 10

        var inputs = panelGroup.add('group')
        inputs.alignChildren = 'right'
        inputs.orientation = 'column'
        inputs.spacing = 4
        var folderGroup = inputs.add('group')
        folderGroup.alignChildren = 'right'
        folderGroup.spacing = 4
        folderGroup.add('statictext', undefined, 'Folder output')
        var folderInput = folderGroup.add('edittext', undefined, 'output')
        folderInput.characters = 10

        var boldGroup = inputs.add('group')
        boldGroup.alignChildren = 'right'
        boldGroup.spacing = 4
        boldGroup.add('statictext', undefined, 'Bold duration')
        var boldInput = boldGroup.add('edittext', undefined, '0+8')
        boldInput.characters = 10

        var durationGroup = inputs.add('group')
        durationGroup.alignChildren = 'right'
        durationGroup.spacing = 4
        durationGroup.add('statictext', undefined, 'Duration')
        var durationInput = durationGroup.add('edittext', undefined, '6+0')
        durationInput.characters = 10

        var framerateGroup = inputs.add('group')
        framerateGroup.alignChildren = 'right'
        framerateGroup.spacing = 4
        framerateGroup.add('statictext', undefined, 'Framerate')
        var framerateInput = framerateGroup.add('edittext', undefined, '24')
        framerateInput.characters = 10

        var nestedComps = panelGroup.add("checkbox", undefined, "Nested Compositions");
        var applyButton = panelGroup.add('button', undefined, 'Apply')
        applyButton.onClick = function () { changeDuration(folderInput.text, boldInput.text, durationInput.text, framerateInput.text, nestedComps.value) }

        win.onResizing = win.onResize = function () {
            this.layout.resize();
        };

        if (win instanceof Window) {
            win.center();
            win.show();
        } else {
            win.layout.layout(true);
            win.layout.resize();
        }

    }

})(this);

function changeDuration(folder, bold, duration, fps, nested) {
    var selectItem = app.project.selection
    var framerate = Number(fps)

    if (duration.indexOf('+') != -1) {
        var dur = duration.split('+')
        var seconds = Number(dur[0])
        var frames = Number(dur[1])
        var newDuration = seconds + frames / framerate
    } else {
        var newDuration = Number(duration) / framerate
    }

    if (bold.indexOf("+") != -1) {
        var boldDuration = bold.split("+");
        var boldSeconds = Number(boldDuration[0]);
        var boldFrames = Number(boldDuration[1]);
        var newBold = (boldSeconds + boldFrames) / framerate;
    } else {
        var newBold = Number(bold) / framerate;
    }

    if (selectItem.length != 0) {
        for (var i = 0; i < selectItem.length; i++) {
            var curSel = selectItem[i]

            app.beginUndoGroup('Change Duration')

            if (curSel instanceof CompItem) {
                if (curSel.frameRate != framerate) {
                    curSel.frameRate = framerate;
                }

                if (curSel.parentFolder.name == folder) {
                    curSel.duration = newDuration + newBold;
                } else {
                    curSel.duration = newDuration;
                    curSel.outPoint = newDuration;
                }

                if (nested) {
                    for (var e = 1; e <= curSel.numLayers; e++) {
                        if (curSel.layer(e).locked == false) {
                            if (curSel.layer(e).source instanceof CompItem) {
                                curSel.layer(e).source.frameRate = framerate;
                                curSel.layer(e).source.duration = newDuration;

                                for (var d = 1; d <= curSel.layer(e).source.numLayers; d++) {
                                    if (curSel.layer(e).source.layer(d).source instanceof CompItem) {
                                        curSel.layer(e).source.layer(d).source.frameRate = framerate;
                                        curSel.layer(e).source.layer(d).source.duration = newDuration;
                                    }
                                    curSel.layer(e).source.layer(d).outPoint = newDuration;
                                }
                            }

                            curSel.layer(e).outPoint = newDuration;

                        }
                    }
                }
            }

            app.endUndoGroup()
        }
    } else { alert('Please select a composition') }
}