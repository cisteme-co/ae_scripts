function replaceComp(replaceCompName, sourceComp, newComp) {
	for (var i = 1; i <= sourceComp.layers.length; i++) {
		if (sourceComp.layers[i].source instanceof CompItem) {
			if (sourceComp.layers[i].source.name == replaceCompName) {
				sourceComp.layers[i].replaceSource(newComp, true);
			}
		}
	}
}

function getItemFolderPath(item) {
	var pathParts = [];
	var parent = item.parentFolder;
	while (parent && parent !== app.project.rootFolder) {
		pathParts.unshift(parent.name);
		parent = parent.parentFolder;
	}
	return pathParts.join('/');
}

function getCurrentCompFrameRate() {
	if (app.project.activeItem && app.project.activeItem instanceof CompItem) {
		return app.project.activeItem.frameRate;
	}
	// fallback, e.g. 24 fps
	return 24;
}

// Utility: find or create a folder by name inside a parent folder (or project root if no parent)
function findOrCreateFolder(name, parentFolder) {
	var folders = parentFolder ? parentFolder.items : app.project.items;
	for (var i = 1; i <= folders.length; i++) {
		var item = folders[i];
		if (item instanceof FolderItem && item.name === name) {
			return item;
		}
	}
	// Not found, create it
	if (parentFolder) {
		return parentFolder.items.addFolder(name);
	} else {
		return app.project.items.addFolder(name);
	}
}

// Utility: get nested folder by path array, create folders if missing
function getOrCreateNestedFolder(pathArray) {
	var currentFolder = null;
	for (var i = 0; i < pathArray.length; i++) {
		currentFolder = findOrCreateFolder(pathArray[i], currentFolder);
	}
	return currentFolder;
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

function getComp(theName) {
	for (var i = 1; i <= app.project.numItems; i++) {
		if (
			app.project.item(i).name == theName &&
			app.project.item(i) instanceof CompItem
		) {
			return app.project.item(i);
		}
	}
	return null;
}

function getCompParent(theName) {
	for (var i = 1; i <= app.project.numItems; i++) {
		if (
			app.project.item(i).parentFolder.name == theName &&
			app.project.item(i) instanceof CompItem
		) {
			return app.project.item(i);
		}
	}
	return null;
}

function createFolder(name, comment, parent) {
	var folder = app.project.items.addFolder(name);
	folder.comment = comment;

	if (parent !== undefined) {
		var thisParent = getFolder(parent);
		if (thisParent) {
			folder.parentFolder = thisParent;
		}
	}

	return folder;
}

function getLayer(comp, layerName) {
	for (var i = 1; i <= comp.numLayers; i++) {
		var layer = comp.layers[i];
		if (layer.name == layerName) {
			return layer;
		}
	}
}

/**
 * Retimes all layers in a composition to the specified duration.
 * Only extends layers that were originally full-length in the template
 * (outPoint close to the template's max outPoint). Shorter layers such as
 * guide/label layers ("Name", "Time", etc.) are left untouched.
 */
function retimeCompLayers(comp, duration) {
	if (!(comp instanceof CompItem)) return;

	// Determine the original template duration by finding the maximum outPoint
	// across all layers. Layers still carry their pre-change outPoints at this stage.
	var origDuration = 0;
	for (var i = 1; i <= comp.numLayers; i++) {
		try {
			var op = comp.layers[i].outPoint;
			if (op > origDuration) origDuration = op;
		} catch (e) {}
	}

	// Allow 2-frame tolerance when deciding if a layer was full-length.
	var frameTol = origDuration > 0 ? 2 / (comp.frameRate || 24) : 0.1;

	for (var i = 1; i <= comp.numLayers; i++) {
		var layer = comp.layers[i];
		try {
			// Skip layers that did not span the full original comp duration —
			// they are intentional partial layers (labels, guides, etc.).
			if (origDuration > 0 && layer.outPoint < origDuration - frameTol) {
				continue;
			}

			if (layer.inPoint <= 0.1) {
				layer.inPoint = 0;
				layer.outPoint = duration;
			}
		} catch (e) {
			// Ignore errors for layers that don't support these operations
		}
	}
}
