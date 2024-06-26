if (isValid(app.project.activeItem) == true) {
    app.beginUndoGroup("Color Fill");

    var curItem = app.project.activeItem;
    var selectedLayers = curItem.selectedLayers;

    for (var i = 0; i < selectedLayers.length; i++) {
        var colorFill = selectedLayers[i];

        try {
            colorFill.Effects.addProperty("PSOFT FILL");
        } catch (err) {
            try {
                var fColor = colorFill.Effects.addProperty("F's FillColor");
                fColor.property("F's FillColor-0001").setValue(true);
            } catch (err) {
                var paint = colorFill.Effects.addProperty('ADBE Paint Bucket');
                paint.property('ADBE Paint Bucket-0002').setValue([0, 0])
                paint.property('ADBE Paint Bucket-0004').setValue(6)
                paint.property('ADBE Paint Bucket-0009').setValue(true)
                paint.property('ADBE Paint Bucket-0010').setValue(25)
            }
        }
    }

    app.endUndoGroup();
} else {
    alert("レイヤーを選択してください。")
}