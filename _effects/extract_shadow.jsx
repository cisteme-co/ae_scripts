if (isValid(app.project.activeItem) == true) {
    app.beginUndoGroup("Extract Shadow");

    var curItem = app.project.activeItem;
    var selectedLayers = curItem.selectedLayers;

    for (var i = 0; i < selectedLayers.length; i++) {
        var layer = selectedLayers[i];
        var mask = layer.duplicate();
        mask.name = layer.name + "_mask";
        mask.enabled = false;
        var duplicate = layer.duplicate();
        duplicate.name = layer.name + "_wxp";
        duplicate.trackMatteType = TrackMatteType.ALPHA;

        var replaceShadowToWhite = layer.Effects.addProperty("PSOFT REPLACECOLOR");
        replaceShadowToWhite.property("PSOFT REPLACECOLOR-0106").setValue([1, 0, 1]);
        replaceShadowToWhite.property("PSOFT REPLACECOLOR-0107").setValue([1, 1, 1]);
        layer.Effects.addProperty("ADBE Color Key");
        layer.property("Effects").property("ADBE Color Key")("ADBE Color Key-0001").setValue([1, 1, 1]);

        duplicate.property("Effects").addProperty("PSOFT COLORSELECTION");
        duplicate.property("Effects").property("PSOFT COLORSELECTION")("View").setValue(4);
        duplicate.property("Effects").property("PSOFT COLORSELECTION")("PSOFT COLORSELECTION-0105").setValue([1, 0, 1]);
        duplicate.property("Effects").addProperty("ADBE Minimax");
        duplicate.property("Effects").property("ADBE Minimax")("ADBE Minimax-0002").setValue(2);
        duplicate.property("Effects").property("ADBE Minimax")("ADBE Minimax-0003").setValue(6);

        duplicate.selected = true;
        layer.selected = false;
    }

    app.endUndoGroup();
}