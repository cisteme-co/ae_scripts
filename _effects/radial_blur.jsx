if (isValid(app.project.activeItem) == true) {
    app.beginUndoGroup("Radial Blur");

    var curItem = app.project.activeItem;
    var selectedLayers = curItem.selectedLayers;

    for (var i = 0; i < selectedLayers.length; i++) {
        var radialBlur = selectedLayers[i];
        var radialEffect = radialBlur.Effects.addProperty("OLM RadialBlur");
        radialEffect.property("OLM RadialBlur-0004").setValue(25);
        radialEffect.property("OLM RadialBlur-0008").setValue(25);
    }

    app.endUndoGroup();
} else {
    alert("レイヤーを選択してください。")
}