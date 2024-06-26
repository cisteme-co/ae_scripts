if (isValid(app.project.activeItem) == true) {
    app.beginUndoGroup("Motion Blur");

    var curItem = app.project.activeItem;
    var selectedLayers = curItem.selectedLayers;

    for (var i = 0; i < selectedLayers.length; i++) {
        var motionBlur = selectedLayers[i];
        motionBlur.property("Effects").addProperty("OLM DirectionalBlur");
        motionBlur.property("Effects").property("OLM DirectionalBlur")("Angle").setValue(90);
        motionBlur.property("Effects").property("OLM DirectionalBlur")("OLM Directional Blur-0005").setValue(25);
        motionBlur.property("Effects").property("OLM DirectionalBlur")("OLM Directional Blur-0010").setValue(25);
    }

    app.endUndoGroup();
} else {
    alert("レイヤーを選択してください。")
}