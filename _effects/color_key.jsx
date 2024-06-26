if (isValid(app.project.activeItem) == true) {
    app.beginUndoGroup("Color Key");

    var curItem = app.project.activeItem;
    var selectedLayers = curItem.selectedLayers;

    for (var i = 0; i < selectedLayers.length; i++) {

        var colorKey = selectedLayers[i];
        colorKey.property("Effects").addProperty("ADBE Color Key");
        colorKey.property("Effects").property("ADBE Color Key")("ADBE Color Key-0001").setValue([1, 1, 1]);
    }

    app.endUndoGroup();
} else {
    alert("レイヤーを選択してください。")
}