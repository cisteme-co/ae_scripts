function addSlider(layers, name, value) {
    var layer = layers.Effects.addProperty("ADBE Slider Control");
    layer.property(1).setValue(value);
    layer.name = name;
}

if (isValid(app.project.activeItem) == true) {

    app.beginUndoGroup("Posterize")

    var curItem = app.project.activeItem;
    var selectedLayers = curItem.selectedLayers;
    var fps = (1 / curItem.frameDuration)

    for (var i = 0; i < selectedLayers.length; i++) {

        var layer = selectedLayers[i];

        addSlider(layer, "Frame", 3);

        var frameRate = layer.Effects.addProperty("ADBE Slider Control");
        frameRate.name = "Framerate"
        frameRate.property(1).setValue(fps);
        frameRate.property(1).expression = '1/thisComp.frameDuration';

        for (var o = 1; o <= layer.numProperties; o++) {
            var prop = layer.property(o).matchName;

            for (var e = 1; e <= layer.property(prop).numProperties; e++) {

                var propTime = layer.property(prop).property(e).matchName;

                if (layer.property(prop).property(propTime).isTimeVarying) {

                    layer.property(prop).property(propTime).expressionEnabled = true;
                    layer.property(prop).property(propTime).expression = "koma = effect('Frame')('スライダー');\n" +
                        "fps = effect('Framerate')('スライダー'); \n" +
                        "T = time * fps + 1; \n" +
                        "stkf = thisProperty.key(1).time*fps+1; \n" +
                        "ntsa = T - stkf;\n" +
                        "stkfsa = ntsa % koma;\n" +
                        "npro = thisProperty.valueAtTime((T-1-stkfsa)/fps);";
                }

                for (var t = 1; t <= layer.property(prop).property(propTime).numProperties; t++) {

                    var propEffect = layer.property(prop).property(propTime)(t).matchName;

                    if (layer.property(prop).property(propTime)(propEffect).isTimeVarying) {

                        layer.property(prop).property(propTime)(propEffect).expressionEnabled = true;
                        layer.property(prop).property(propTime)(propEffect).expression = "koma = effect('Frame')('スライダー');\n" +
                            "fps = effect('Framerate')('スライダー'); \n" +
                            "T = time * fps + 1; \n" +
                            "stkf = thisProperty.key(1).time*fps+1; \n" +
                            "ntsa = T - stkf;\n" +
                            "stkfsa = ntsa % koma;\n" +
                            "npro = thisProperty.valueAtTime((T-1-stkfsa)/fps);";
                    }
                }
            }
        }




    }

    app.endUndoGroup();

} else {
    alert("レイヤーを選択してください。")
}