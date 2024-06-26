var frameDisplayTextExpression = 'fps = 1/thisComp.frameDuration; \n' +
    'koma = time * fps; \n' +
    'pageBorder = 144; \n' +
    'total = thisComp.duration * fps; \n' +
    'a1 = Math.floor(koma / fps); \n' +
    'b1 = Math.floor(koma % fps); \n' +
    'a2 = Math.floor(koma % pageBorder) + 1; \n' +
    'b2 = Math.floor(koma / pageBorder) + 1; \n' +
    'String(a2).padStart(3, "0") + "    " + String(b2).padStart(2, "0") + "/" + String(Math.round(total / pageBorder)).padStart(2, "0") + "\\r" + "(total : " + String(total).padStart(3, "0") + ")"; ';


app.beginUndoGroup("Sequence Layer");

if (isValid(app.project.activeItem) == true) {
    var curComp = app.project.activeItem;
    var layer = curComp.layers.addText(' ')
    var layerTextProp = layer.property("ADBE Text Properties").property("ADBE Text Document");
    layer.name = "コマ表示";
    layer.guideLayer = true;
    layer.sourceText.expression = frameDisplayTextExpression
    var layerTextDoc = layerTextProp.value;
    layerTextDoc.resetCharStyle();
    layerTextDoc.resetParagraphStyle();
    layerTextDoc.font = "MeiryoUI-Bold";
    layerTextDoc.fontSize = 50;
    layerTextDoc.applyFill = true;
    layerTextDoc.fillColor = [1, 0, 0];
    layerTextDoc.applyStroke = true;
    layerTextDoc.strokeOverFill = false;
    layerTextDoc.strokeColor = [0, 0, 0];
    layerTextDoc.strokeWidth = 7;
    layerTextDoc.justification = ParagraphJustification.LEFT_JUSTIFY;
    layerTextProp.setValue(layerTextDoc);

}

app.endUndoGroup();