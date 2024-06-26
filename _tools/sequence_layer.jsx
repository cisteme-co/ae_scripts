app.beginUndoGroup("Sequence Layer");

if (isValid(app.project.activeItem) == true) {
    var curComp = app.project.activeItem;
    var selectedLayers = curComp.selectedLayers;
    var fps = (1 / curComp.frameDuration);

    for (var i = 0; i < selectedLayers.length; i++) {
        var layerUnder = selectedLayers[i - 1];

        if (layerUnder != undefined) {
            var offset = (layerUnder.outPoint - layerUnder.inPoint) * fps;
            var layer = selectedLayers[i];
            layer.startTime = i * offset * curComp.frameDuration;
        }
    }
}

app.endUndoGroup();