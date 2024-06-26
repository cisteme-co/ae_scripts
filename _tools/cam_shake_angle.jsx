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

        nullLayer.source.name = "画面動 - 角度";

        addSlider(nullLayer, "Resolution (dpi)", 144);
        addSlider(nullLayer, "Shaking (mm)", 0);
        addAngle(nullLayer, "Angle", 0)
        addSlider(nullLayer, "Random %", 50);
        addCheckbox(nullLayer, "Invert Shaking", false)

        nullLayer.property("position").expression =
            ' a=effect("Shaking (mm)").param("スライダー"); /*  ブレ幅（mm)  */ \n' +
            'r=effect("Angle").param("角度")-90; /*角度*/ \n' +
            'intDPI = effect("Resolution (dpi)").param("スライダー"); \n' +
            'mySpeed = intDPI/25.4; \n' +
            'if (effect("Random %").param("スライダー")<=0){RandomSlider=0;} \n' +
            'else if(effect("Random %").param("スライダー")>=100){RandomSlider=100;} \n' +
            'else{RandomSlider=effect("Random %").param("スライダー");} \n' +
            ' myRandom = (100-RandomSlider)/100; \n' +
            ' myInverse = (effect("Invert Shaking").param("チェックボックス")*2-1)/2+myRandom/400; \n' +
            'T=timeToFrames(time,1/thisComp.frameDuration); \n' +
            'X=position[0]     ; \n' +
            'Y=position[1]     ; \n' +
            'x=X+Math.cos(r*Math.PI/180)*Math.pow((-1), T)*a*random(myRandom,1)*mySpeed*myInverse; \n' +
            'y=Y+Math.sin(r*Math.PI/180)*Math.pow((-1), T)*a*random(myRandom,1)*mySpeed*myInverse; \n' +
            '[x,y];'
    }

    app.endUndoGroup();
} else {
    alert("レイヤーを選択してください。")
}

