if (isValid(app.project.activeItem) == true) {
    app.beginUndoGroup("Line Repaint");

    var curItem = app.project.activeItem;
    var selectedLayers = curItem.selectedLayers;

    for (var i = 0; i < selectedLayers.length; i++) {
        var lineRepaint = selectedLayers[i];
        var duplicateLayer = lineRepaint.duplicate();
        duplicateLayer.name = lineRepaint.name + "_line";
        duplicateLayer.Effects.addProperty("F's MainLineRepaint_old");
        duplicateLayer.property("Effects").addProperty("ADBE Color Key");
        duplicateLayer.property("Effects").property("ADBE Color Key")("ADBE Color Key-0001").setValue([1, 1, 1]);
        duplicateLayer.selected = true;
        lineRepaint.selected = false;
    }

    app.endUndoGroup();
} else {
    alert("レイヤーを選択してください。")
}