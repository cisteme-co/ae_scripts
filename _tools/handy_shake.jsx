function addSlider(layers, name, value) {
    var layer = layers.Effects.addProperty("ADBE Slider Control");
    layer.property(1).setValue(value);
    layer.name = name;
}

if (isValid(app.project.activeItem) == true) {

    app.beginUndoGroup("Handy Shake")

    var curItem = app.project.activeItem;
    var selectedLayers = curItem.selectedLayers;

    for (i = 0; i < selectedLayers.length; i++) {
        var layers = selectedLayers[i];
        var nullLayer = curItem.layers.addNull(curItem.duration);
        nullLayer.source.name = "手ブレ";
        nullLayer.moveBefore(layers);
        layers.parent = nullLayer;

        addSlider(nullLayer, "Resolution (in DPI)", 72);
        addSlider(nullLayer, "Scale in %", 100);
        addSlider(nullLayer, "Frequency", 1);
        addSlider(nullLayer, "Amplitude (in mm)", 5);
        addSlider(nullLayer, "Noise Frequency", 5);
        addSlider(nullLayer, "Noise Amplitude", 5);
        addSlider(nullLayer, "Phase", 0);

        nullLayer.property("position").expression = "intDPI=effect('Resolution (in DPI)')('ADBE Slider Control') ;\n" +
            "hiritu = effect('Scale in %')('ADBE Slider Control') ;\n" +
            "if(intDPI==0){intDPI=Math.round(128*(hiritu/100) )}\n" +
            "mySpeed = intDPI/25.4;\n" +
            "freq=effect('Frequency')('ADBE Slider Control');\n" +
            "amp=effect('Amplitude (in mm)')('ADBE Slider Control');\n" +
            "octaves =effect('Noise Frequency')('ADBE Slider Control');\n" +
            "amp_mult=effect('Noise Amplitude')('ADBE Slider Control')/20;\n" +
            "t=time+framesToTime(effect('Phase')('ADBE Slider Control'),1/thisComp.frameDuration);\n" +
            "amp=amp*mySpeed ;\n" +
            "wiggle(freq, amp, octaves , amp_mult , t)"

    }

    app.endUndoGroup();
} else {
    alert("レイヤーを選択してください。")
}