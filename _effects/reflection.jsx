if (isValid(app.project.activeItem) == true) {
    app.beginUndoGroup("Reflection");

    var curItem = app.project.activeItem;
    var selectedLayers = curItem.selectedLayers;

    for (var i = 0; i < selectedLayers.length; i++) {
        var reflection = selectedLayers[i];
        var duplicate = reflection.duplicate();
        duplicate.name = reflection.name + "_reflect";
        duplicate.moveAfter(reflection);

        try {
            var reflectEffect = duplicate.Effects.addProperty("VIDEOCOPILOT VCReflect");
            reflectEffect.property("VIDEOCOPILOT VCReflect-0012").setValue(3);
        } catch (err) {
            var reflectEffect = duplicate.Effects.addProperty("ADBE Geometry2");
            reflectEffect.property("ADBE Geometry2-0007").setValue(180);
            reflectEffect.property("ADBE Geometry2-0008").setValue(25);
        }
        duplicate.selected = true;
        reflection.selected = false;
    }

    app.endUndoGroup();
} else {
    alert("レイヤーを選択してください。")
}