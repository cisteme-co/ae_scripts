if (isValid(app.project.activeItem) == true) {

    app.beginUndoGroup("Posterize")

    var curItem = app.project.activeItem;
    var selectedLayers = curItem.selectedLayers;
    var fps = (1 / curItem.frameDuration)

    for (var i = 0; i < selectedLayers.length; i++) {

        var layer = selectedLayers[i];

        layer.Effects.addProperty("ADBE Posterize Time");
        layer.Effects.property("ADBE Posterize Time")("ADBE Posterize Time-0001").setValue(fps / 2)

    }

    app.endUndoGroup();

} else {
    alert("レイヤーを選択してください。")
}