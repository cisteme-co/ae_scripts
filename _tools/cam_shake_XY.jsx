function addSlider(layers, name, value) {
    var layer = layers.Effects.addProperty("ADBE Slider Control");
    layer.property(1).setValue(value);
    layer.name = name;
}

function addCheckbox(layers, name, value) {
    var layer = layers.Effects.addProperty("ADBE Checkbox Control");
    layer.property(1).setValue(value);
    layer.name = name;
}

function addAngle(layers, name, value) {
    var layer = layers.Effects.addProperty("ADBE Angle Control");
    layer.property(1).setValue(value);
    layer.name = name;
}

if (isValid(app.project.activeItem) == true) {
    app.beginUndoGroup("Cam Shake");

    var curItem = app.project.activeItem;
    var selectedLayers = curItem.selectedLayers;

    for (var i = 0; i < selectedLayers.length; i++) {

        var layers = selectedLayers[i];

        var nullLayer = curItem.layers.addNull(curItem.duration);
        nullLayer.moveBefore(layers);
        layers.parent = nullLayer;

        nullLayer.source.name = "画面動 - XY";

        addSlider(nullLayer, "Resolution (dpi)", 144);
        addSlider(nullLayer, "X Axis (mm)", 5);
        addSlider(nullLayer, "Y Axis (mm)", 10);
        addSlider(nullLayer, "Random %", 50);
        addCheckbox(nullLayer, "Invert Shaking", false)

        nullLayer.property("position").expression =
            '0//mm単位// \n' +
            'T=timeToFrames(time,1/thisComp.frameDuration);\n' +
            'intDPI=effect("Resolution (dpi)").param("スライダー");\n' +
            'mySpeed= intDPI/25.4;\n' +
            'if (effect("Random %").param("スライダー")<=0){RandomSlider=0;}\n' +
            'else if(effect("Random %").param("スライダー")>=100){RandomSlider=100;}\n' +
            'else{RandomSlider=effect("Random %").param("スライダー");}\n' +
            'myRandom = (100-RandomSlider)/100;\n' +
            'myInverse = (effect("Invert Shaking").param("チェックボックス")*2-1)/2+myRandom/400;\n' +
            'X=position[0];\n' +
            'Y=position[1];\n' +
            'if(effect("Y Axis (mm)").param("スライダー")==0)\n' +
            '{\n' +
            'x=X+Math.pow((-1), T)*effect("X Axis (mm)").param("スライダー")*random(myRandom,1)*mySpeed*myInverse;\n' +
            'y=Y+Math.pow((-1), T)*effect("Y Axis (mm)").param("スライダー")*random(myRandom,1)*mySpeed*myInverse;\n' +
            '}\n' +
            'else{\n' +
            'x=X+Math.pow((-1), Math.floor(T/2)+1)*effect("X Axis (mm)").param("スライダー")*random(myRandom*Math.pow((-1), T),Math.pow((-1), T))*mySpeed*myInverse;\n' +
            'y=Y+Math.pow((-1), T)*effect("Y Axis (mm)").param("スライダー")*random(myRandom,1)*mySpeed*myInverse;\n' +
            '}\n' +
            '[x,y];'

    }

    app.endUndoGroup();
} else {
    alert("レイヤーを選択してください。")
}

