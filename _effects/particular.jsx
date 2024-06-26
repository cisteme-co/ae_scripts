if (isValid(app.project.activeItem) == true) {

    app.beginUndoGroup("Opitcal Flare");

    var curItem = app.project.activeItem;
    var layer = curItem.layers.addShape();
    var layerShapeGroup = layer.property("Contents").addProperty("ADBE Vector Group");
    var layerShape = layerShapeGroup.property("Contents").addProperty("ADBE Vector Shape - Rect");
    layerShape.property("ADBE Vector Rect Size").expression = "[thisComp.width, thisComp.height];";
    layerShapeGroup.property("Contents").addProperty("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color").setValue([1, 1, 1]);

    layer.name = "Particular";

    try {
        layer.property("Effects").addProperty("tc Particular");
    } catch (err) {
        layer.property("Effects").addProperty("CC Particle World");
    }

    app.endUndoGroup();

} else {
    alert("コンポジションを開いてください。")
}