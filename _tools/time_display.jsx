(function () {
	// ────────────────────────────────────────────────
	// Add Frame Display Text Layer with Expression
	// ────────────────────────────────────────────────
	var rootFolder = File($.fileName).parent;
	$.evalFile(new File(rootFolder.fsName + '/utils/alerts.jsx'));

	// Expression for the text layer sourceText
	var frameDisplayTextExpression =
		'fps = 1 / thisComp.frameDuration;\n' +
		'koma = time * fps;\n' +
		'pageBorder = 144;\n' +
		'total = thisComp.duration * fps;\n' +
		'a1 = Math.floor(koma / fps);\n' +
		'b1 = Math.floor(koma % fps);\n' +
		'a2 = Math.floor(koma % pageBorder) + 1;\n' +
		'b2 = Math.floor(koma / pageBorder) + 1;\n' +
		'String(a2).padStart(3, "0") + " - " + String(b2).padStart(2, "0") + "/" + String(Math.floor(total / pageBorder)+1).padStart(2, "0") + "\\r" + "(total : " + String(total).padStart(3, "0") + ")";';

	app.beginUndoGroup('Add Frame Display Text Layer');

	// Validate active composition
	var comp = app.project.activeItem;
	if (!(comp && comp instanceof CompItem)) {
		Alerts.alertNoCompSelected();
		app.endUndoGroup();
		return;
	}

	// Detect AE language for naming
	var aeLang = app.language.toString().toLowerCase();
	var layerName = 'Time Display';
	if (aeLang.indexOf('ja') === 0) layerName = 'コマ表示';
	else if (aeLang.indexOf('fr') === 0) layerName = 'Affichage de temps';
	// Add more languages as needed...

	// Add a new text layer
	var textLayer = comp.layers.addText(' ');
	textLayer.name = layerName;
	textLayer.guideLayer = true; // Guide layer (non-rendering)

	// Get text document property to customize font and style
	var textProp = textLayer
		.property('ADBE Text Properties')
		.property('ADBE Text Document');

	// Assign the expression to sourceText
	textLayer.sourceText.expression = frameDisplayTextExpression;

	// Configure text appearance
	var textDocument = textProp.value;
	textDocument.resetCharStyle();
	textDocument.resetParagraphStyle();

	textDocument.font = 'MeiryoUI-Bold';
	textDocument.fontSize = 50;
	textDocument.applyFill = true;
	textDocument.fillColor = [1, 0, 0]; // Red fill
	textDocument.applyStroke = true;
	textDocument.strokeOverFill = false;
	textDocument.strokeColor = [0, 0, 0]; // Black stroke
	textDocument.strokeWidth = 7;
	textDocument.justification = ParagraphJustification.LEFT_JUSTIFY;

	// Apply updated text document settings
	textProp.setValue(textDocument);

	// Position text in bottom-right corner
	var textRect = textLayer.sourceRectAtTime(0, false);
	var x = comp.width - textRect.width / 2 - 200; // 20px padding from right
	var y = comp.height - textRect.height / 2 - 48; // 20px padding from bottom
	textLayer.property('Position').setValue([x, y]);

	app.endUndoGroup();
})();
