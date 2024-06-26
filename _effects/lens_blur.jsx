function cameraBlur(radius, adjValue, selLayerValue, gammaValue, highlightValue, depthListValue, effectName) {
    if (isValid(app.project.activeItem) == true) {
        app.beginUndoGroup("Lens Blur");

        if (adjValue == "true") {
            alert(radius + adjValue + selLayerValue + gammaValue + highlightValue + depthListValue + effectName)

            var curItem = app.project.activeItem;
            var layer = curItem.layers.addShape();
            var layerShapeGroup = layer.property("Contents").addProperty("ADBE Vector Group");
            var layerShape = layerShapeGroup.property("Contents").addProperty("ADBE Vector Shape - Rect");
            layerShape.property("ADBE Vector Rect Size").expression = "[thisComp.width, thisComp.height];";
            layerShapeGroup.property("Contents").addProperty("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color").setValue([1, 1, 1]);

            layer.name = effectName + " - Lens Care";
            layer.adjustmentLayer = true;
            lensEffect(layer, effectName);

        } else if (selLayerValue == "true") {
            var curItem = app.project.activeItem;
            var selectedLayers = curItem.selectedLayers;

            for (var i = 0; i < selectedLayers.length; i++) {
                var layers = selectedLayers[i];
                lensEffect(layers, effectName);
            }
        }

        app.endUndoGroup();
    } else {
        alert("コンポジションを開いてください。")
    }

    function lensEffect(layer, effectName) {
        layer.Effects.addProperty(effectName)("radius").setValue(radius);

        if (gammaValue == "true") {
            layer.property("Effects").property(effectName)("gamma correction").setValue(true);
        } else {
            layer.property("Effects").property(effectName)("gamma correction").setValue(false);
        }

        if (highlightValue == "true") {
            layer.property("Effects").property(effectName)("enable").setValue(true);
        } else {
            layer.property("Effects").property(effectName)("enable").setValue(false);
        }

        if (Number(depthListValue) != 0) {
            layer.property("Effects").property(effectName)("depth layer").setValue(Number(depthListValue));
        }
    }
}