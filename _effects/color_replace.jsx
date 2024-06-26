if (isValid(app.project.activeItem) == true) {
    app.beginUndoGroup("Color Replace");

    var curItem = app.project.activeItem;
    var selectedLayers = curItem.selectedLayers;

    for (var i = 0; i < selectedLayers.length; i++) {
        var colorReplace = selectedLayers[i];

        try {
            colorReplace.property("Effects").addProperty("PSOFT REPLACECOLOR");
        }
        catch (err) {
            colorReplace.property("Effects").addProperty("F's ColorChange");
            colorReplace.property("Effects").property("F's ColorChange")("F's ColorChange-0003").setValue(1);
        }
    }

    app.endUndoGroup();
} else {
    alert("レイヤーを選択してください。")
}