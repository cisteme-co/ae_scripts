if (isValid(app.project.activeItem) == true) {

    app.beginUndoGroup("Alpha Reverse");

    var curItem = app.project.activeItem;
    var selectedLayers = curItem.selectedLayers;

    for (var i = 0; i < selectedLayers.length; i++) {
        var alphaReverse = selectedLayers[i];
        alphaReverse.Effects.addProperty("ADBE Invert")("ADBE Invert-0001").setValue(16);
    }

    app.endUndoGroup();

} else {
    alert("レイヤーを選択してください。")
}