function addSlider(layers, name, value) {
    var layer = layers.Effects.addProperty("ADBE Slider Control");
    layer.property(1).setValue(value);
    layer.name = name;
}

function addAngle(layers, name, value) {
    var layer = layers.Effects.addProperty("ADBE Angle Control");
    layer.property(1).setValue(value);
    layer.name = name;
}

function addColorChange(layers, name, value) {
    var layer = layers.Effects.addProperty("ADBE Color Control")
    layer.property(1).setValue(value);
    layer.name = name;
}


if (isValid(app.project.activeItem) == true) {
    app.beginUndoGroup("Inner Shadow");

    var curItem = app.project.activeItem;
    var selectedLayers = curItem.selectedLayers;

    for (var i = 0; i < selectedLayers.length; i++) {
        var layer = selectedLayers[i];

        app.executeCommand(9001);

        addColorChange(layer, "Color", [0, 0, 0]);
        addSlider(layer, "Opacity", 100);
        addAngle(layer, "Angle", 120);
        addSlider(layer, "Distance", 0);
        addSlider(layer, "Choke", 0);
        addSlider(layer, "Size", 5)

        layer.property("ADBE Layer Styles")("innerShadow/enabled")("innerShadow/color").expression = 'effect("Color")("カラー")';
        layer.property("ADBE Layer Styles")("innerShadow/enabled")("innerShadow/opacity").expression = 'effect("Opacity")("スライダー")';
        layer.property("ADBE Layer Styles")("innerShadow/enabled")("innerShadow/localLightingAngle").expression = 'effect("Angle")("角度")-180';
        layer.property("ADBE Layer Styles")("innerShadow/enabled")("innerShadow/distance").expression = 'effect("Distance")("スライダー")';
        layer.property("ADBE Layer Styles")("innerShadow/enabled")("innerShadow/chokeMatte").expression = 'effect("Choke")("スライダー")';
        layer.property("ADBE Layer Styles")("innerShadow/enabled")("innerShadow/blur").expression = 'effect("Size")("スライダー")';

    }

    app.endUndoGroup();
} else {
    alert("レイヤーを選択してください。")
}