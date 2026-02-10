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
 */
function retimeCompLayers(comp, duration) {
	if (!(comp instanceof CompItem)) return;

	for (var i = 1; i <= comp.numLayers; i++) {
		var layer = comp.layers[i];
		try {
			// If it's a comp or footage layer, extend it
			if (
				layer.source &&
				(layer.source instanceof CompItem || layer.source instanceof FootageItem)
			) {
				// We usually want to extend layers that start at 0
				if (layer.inPoint <= 0.1) {
					layer.inPoint = 0;
					layer.outPoint = duration;
				}
			} else {
				// For other layers (Adjustment, Null, etc.), just extend if they start at 0
				if (layer.inPoint <= 0.1) {
					layer.outPoint = duration;
				}
			}

			// Handle Time Remapping if enabled
			if (layer.timeRemapEnabled) {
				var tr = layer.timeRemap;
				if (tr.numKeys > 0) {
					var lastKeyIndex = tr.numKeys;
					var lastKeyValue = tr.keyValue(lastKeyIndex);
					// Move the last keyframe to the new duration if it was at the old end
					// This is a bit complex to do perfectly, but often we want the last key at the end
					// tr.setValueAtTime(duration, lastKeyValue);
				}
			}
		} catch (e) {
			// Ignore errors for layers that don't support these operations
		}
	}
}
