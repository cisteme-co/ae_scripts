if (isValid(app.project.activeItem) == true) {
    app.beginUndoGroup("Boundary Line");

    var curItem = app.project.activeItem;
    var selectedLayers = curItem.selectedLayers;

    for (var i = 0; i < selectedLayers.length; i++) {
        var boundaryLine = selectedLayers[i];

        try {
            boundaryLine.Effects.addProperty("PSOFT BOUNDARYLINE");
        } catch (err) {
            boundaryLine.Effects.addProperty("F's EdgeLine-Hi");
        }
    }

    app.endUndoGroup();
} else {
    alert("レイヤーを選択してください。")
}