var mySelectedItems = [];
for (var i = 1; i <= app.project.numItems; i++) {
	if (app.project.item(i).selected) {
		mySelectedItems[mySelectedItems.length] = app.project.item(i);
	}
}

if (mySelectedItems.length) {
	app.beginUndoGroup('Cell FX');
	for (var i = 0; i < mySelectedItems.length; i++) {
		var item = mySelectedItems[i];

		var cellComp = app.project.items.addComp(
			removeSequenceNumber(item.name),
			item.width,
			item.height,
			1,
			item.duration,
			1 / item.frameDuration
		);
		cellComp.layers.add(item);
		cellComp.parentFolder = getFolder('cell');

		var cellFXComp = app.project.items.addComp(
			cellComp.name + '_cellFX',
			cellComp.width,
			cellComp.height,
			1,
			cellComp.duration,
			1 / cellComp.frameDuration
		);
		var cellFXLayer = cellFXComp.layers.add(cellComp);
		cellFXComp.parentFolder = getFolder('cellFX');

		var colorKeyEffect = cellFXLayer.Effects.addProperty('ADBE Color Key');
		if (colorKeyEffect) {
			colorKeyEffect.property(1).setValue([1, 1, 1]);
		}

		var antiAliasEffect = cellFXLayer.Effects.addProperty(
			'PSOFT ANTI-ALIASING'
		);
	}

	app.endUndoGroup();
} else {
	alert('セルを選択してください');
}

function removeSequenceNumber(name) {
	// Remove [0001~0012] or [0001] or _0001 at the end
	return name.replace(/(\[\d{4}([~-]\d{4})?\](\.\w+)?|\_\d{4}(\.\w+)?$)/, '');
}

function getFolder(theName) {
	for (var i = 1; i <= app.project.numItems; i++) {
		if (
			app.project.item(i).name == theName &&
			app.project.item(i) instanceof FolderItem
		) {
			return app.project.item(i);
		}
	}
	return null;
}
