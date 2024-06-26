if (isValid(app.project.activeItem) == true) {

    app.beginUndoGroup("Opitcal Flare");

    var curItem = app.project.activeItem;
    var layer = curItem.layers.addShape();
    var layerShapeGroup = layer.property("Contents").addProperty("ADBE Vector Group");
    var layerShape = layerShapeGroup.property("Contents").addProperty("ADBE Vector Shape - Rect");
    layerShape.property("ADBE Vector Rect Size").expression = "[thisComp.width, thisComp.height];";
    layerShapeGroup.property("Contents").addProperty("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color").setValue([1, 1, 1]);

    layer.name = "Optical Flare";
    layer.adjustmentLayer = true;

    try {
        layer.property("Effects").addProperty("VIDEOCOPILOT OpticalFlares");
        layer.property("Effects").property("VIDEOCOPILOT OpticalFlares")("VIDEOCOPILOT OpticalFlares-0025").setValue(3);
    } catch (err) {
        layer.property("Effects").addProperty("ADBE Lens Flare");
    }

    app.endUndoGroup();

} else {
    alert("コンポジションを開いてください。")
}