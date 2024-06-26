if (isValid(app.project.activeItem) == true) {
    app.beginUndoGroup("Cell Blur");

    var curItem = app.project.activeItem;
    var selectedLayers = curItem.selectedLayers;

    for (var i = 0; i < selectedLayers.length; i++) {
        var cellBlur = selectedLayers[i];

        try {
            var blurEffect = cellBlur.Effects.addProperty("PSOFT BLURCEL");
            blurEffect.property("PSOFT BLURCEL-0060").setValue(true);
        } catch (err) {
            var blurEffect = cellBlur.Effects.addProperty("F's SelectedBlur");
        }
    }

    app.endUndoGroup();
} else {
    alert("レイヤーを選択してください。")
}