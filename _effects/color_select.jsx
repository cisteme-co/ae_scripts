if (isValid(app.project.activeItem) == true) {
    app.beginUndoGroup("Color Selection");

    var curItem = app.project.activeItem;
    var selectedLayers = curItem.selectedLayers;

    for (var i = 0; i < selectedLayers.length; i++) {
        var colorSelect = selectedLayers[i];

        try {
            colorSelect.property("Effects").addProperty("PSOFT COLORSELECTION");
            colorSelect.property("Effects").property("PSOFT COLORSELECTION")("PSOFT COLORSELECTION-0001").setValue(4);
        }
        catch (err) {
            try {
                colorSelect.property("Effects").addProperty("F's SelectColor");
                colorSelect.property("Effects").property("F's SelectColor")("F's SelectColor-0001").setValue(1);
            } catch (err) {
                colorSelect.property("Effects").addProperty("ADBE Color Key");
                colorSelect.Effects.addProperty("ADBE Invert")("ADBE Invert-0001").setValue(16);
            }
        }
    }

    app.endUndoGroup();
} else {
    alert("レイヤーを選択してください。")
}