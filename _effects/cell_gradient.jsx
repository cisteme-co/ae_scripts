if (isValid(app.project.activeItem) == true) {
    app.beginUndoGroup("Gradient");

    var curItem = app.project.activeItem;
    var selectedLayers = curItem.selectedLayers;

    for (var i = 0; i < selectedLayers.length; i++) {
        var gradient = selectedLayers[i];

        try {
            gradient.Effects.addProperty("PSOFT GRADIENT");
        } catch (err) {
            var duplicateLayer = gradient.duplicate();
            duplicateLayer.Effects.addProperty("F's CellGrad");
            duplicateLayer.name = duplicateLayer.name + "_Gradient"
            duplicateLayer.selected = true;
            gradient.selected = false;
        }

    }

    app.endUndoGroup();
} else {
    alert("レイヤーを選択してください。")
}