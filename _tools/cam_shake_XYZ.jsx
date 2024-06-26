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

if (isValid(app.project.activeItem) == true) {
    app.beginUndoGroup("Cam Shake");

    var curItem = app.project.activeItem;
    var selectedLayers = curItem.selectedLayers;

    for (var i = 0; i < selectedLayers.length; i++) {

        var layers = selectedLayers[i];

        addSlider(layers, "Value", 10);
        addCheckbox(layers, "X Axis", false);
        addCheckbox(layers, "Y Axis", true);
        addSlider(layers, "Z Axis in %", 0);
        addCheckbox(layers, "Allow Z Axis Time Reduction", false);
        addSlider(layers, "Rotation", 0);
        addSlider(layers, "Motion Blur", 0);

        var motionTile = layers.Effects.addProperty("ADBE Tile");
        motionTile.name = "Edge Repeat";
        motionTile.property("ADBE Tile-0001").expression = "[thisLayer.width/2, thisLayer.height/2]";
        motionTile.property("ADBE Tile-0004").expression = '100 + effect("Value")("スライダー") + effect("Rotation")("スライダー")';
        motionTile.property("ADBE Tile-0005").expression = '100 + effect("Value")("スライダー") + effect("Rotation")("スライダー")';
        motionTile.property("ADBE Tile-0006").setValue(true);

        var transform = layers.Effects.addProperty("ADBE Geometry2");
        transform.name = "Offset";
        transform.property("ADBE Geometry2-0001").expression = "moto=[thisLayer.width/2,thisLayer.height/2]";
        transform.property("ADBE Geometry2-0002").expression = 'PRM=effect("Value")("スライダー") \n' +
            'moto=[thisLayer.width/2,thisLayer.height/2]; \n' +
            'if(effect("X Axis")("チェックボックス")==true){ \n' +
            'if(effect("Y Axis")("チェックボックス")==true){ \n' +
            'P=[1,1]} \n' +
            'else{P=[1,0]}; \n' +
            '} \n' +
            'else{ \n' +
            'if(effect("Y Axis")("チェックボックス")==true){ \n' +
            'P=[0,1]} \n' +
            'else{P=[0,0]}; \n' +
            '}; \n' +
            '((P*PRM)*0.5)-random(P)*PRM+moto;'
        transform.property("ADBE Geometry2-0003").expression = 'PRM=effect("Z Axis in %")("スライダー") \n' +
            'Z=100*(PRM/100); \n' +
            'BASE=100-(Z*0.5) \n' +
            'if(effect("Allow Z Axis Time Reduction")("チェックボックス")==true){ \n' +
            'RAN=random(Z)+BASE \n' +
            '}else{ \n' +
            'RAN=random(Z)+100};';
        transform.property("ADBE Geometry2-0007").expression = 'sp = effect("Value")("スライダー"); \n' +
            'rot = effect("Rotation")("スライダー"); \n' +
            'wiggle(sp, .12*rot)';
        transform.property("ADBE Geometry2-0010").expression = 'effect("Motion Blur")("スライダー")';

    }

    app.endUndoGroup();
} else {
    alert("レイヤーを選択してください。")
}

