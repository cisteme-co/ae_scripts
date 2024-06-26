if (isValid(app.project.activeItem) == true) {
    app.beginUndoGroup("Anti-Aliasing");

    var curItem = app.project.activeItem;
    var selectedLayers = curItem.selectedLayers;

    for (var i = 0; i < selectedLayers.length; i++) {
        var antiAliasing = selectedLayers[i];

        try {
            antiAliasing.property("Effects").addProperty("PSOFT ANTI-ALIASING");
        }
        catch (err) {
            antiAliasing.property("Effects").addProperty("OLM Smoother");
        }
    }

    app.endUndoGroup();
} else {
    alert("レイヤーを選択してください。")
}