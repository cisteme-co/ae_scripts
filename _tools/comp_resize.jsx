// ────────────────────────────────────────────────
// Extend LayerCollection: Add Null Layer with correct sizing
// ────────────────────────────────────────────────
var rootFolder = File($.fileName).parent;
$.evalFile(new File(rootFolder.fsName + '/utils/alerts.jsx'));

if (
	typeof LayerCollection !== 'undefined' &&
	!LayerCollection.prototype.addNull
) {
	LayerCollection.prototype.addNull = function () {
		var color = [1, 1, 1];
		var name = 'ヌル 1';
		var n = this.addSolid(color, name, 100, 100, 1, 1);
		var comp = n.containingComp;
		n.outPoint = comp.duration;
		n.nullLayer = true;
		n.source.width = comp.width;
		n.source.height = comp.height;
		n.source.pixelAspect = comp.pixelAspect;
		return n;
	};
}

// ────────────────────────────────────────────────
// Extend Array prototype: min and max utility methods
// ────────────────────────────────────────────────
if (!Array.prototype.min) {
	Array.prototype.min = function () {
		return Math.min.apply(null, this);
	};
}
if (!Array.prototype.max) {
	Array.prototype.max = function () {
		return Math.max.apply(null, this);
	};
}

// ────────────────────────────────────────────────
// Utility: Calculate distance between two points
// ────────────────────────────────────────────────
function length(point1, point2) {
	var n = Math.sqrt(
		Math.pow(point2[0] - point1[0], 2) + Math.pow(point2[1] - point1[1], 2)
	);
	return n;
}

// ────────────────────────────────────────────────
// Get 4 corner points of a layer rectangle with rotation & scale
// Returns array of [x,y] points
// ────────────────────────────────────────────────
function get4RectanglePoint(target) {
	if (!(target instanceof AVLayer)) return;

	var layer_pixelAspect = target.source.pixelAspect;
	var comp_pixelAspect = target.containingComp.pixelAspect;

	var anchor = target
		.property('ADBE Transform Group')
		.property('ADBE Anchor Point').value;
	var pos = target
		.property('ADBE Transform Group')
		.property('ADBE Position').value;
	var scale = target
		.property('ADBE Transform Group')
		.property('ADBE Scale').value;
	var rotZ = target
		.property('ADBE Transform Group')
		.property('ADBE Rotate Z').value;

	var r = (((rotZ + 180) * Math.PI) / 180) * -1;
	var scaleX = scale[0] * layer_pixelAspect;
	var scaleY = scale[1];

	var p = [];
	var n = [];

	p[0] = [(anchor[0] / 100) * scaleX, (anchor[1] / 100) * scaleY];
	p[1] = [
		(anchor[0] / 100) * scaleX - (target.width / 100) * scaleX,
		(anchor[1] / 100) * scaleY,
	];
	p[2] = [
		(anchor[0] / 100) * scaleX - (target.width / 100) * scaleX,
		(anchor[1] / 100) * scaleY - (target.height / 100) * scaleY,
	];
	p[3] = [
		(anchor[0] / 100) * scaleX,
		(anchor[1] / 100) * scaleY - (target.height / 100) * scaleY,
	];

	for (var i = 0; i < p.length; i++) {
		var dist = length(p[i], [0, 0]);
		var rr = Math.atan2(p[i][0], p[i][1]) + r;
		n[i] = [
			(Math.sin(rr) * dist) / comp_pixelAspect + pos[0],
			Math.cos(rr) * dist + pos[1],
		];
	}
	return n;
}

// ────────────────────────────────────────────────
// Get bounding box [minX, minY, maxX, maxY] from 4 corner points
// ────────────────────────────────────────────────
function get2RectanglePoint(layer) {
	var corners = get4RectanglePoint(layer);
	if (!corners) return;

	var x = [],
		y = [];
	for (var i = 0; i < corners.length; i++) {
		x.push(corners[i][0]);
		y.push(corners[i][1]);
	}

	var min = [x[0], y[0]];
	var max = [x[0], y[0]];

	for (var i = 1; i < x.length; i++) {
		if (min[0] > x[i]) min[0] = x[i];
		if (min[1] > y[i]) min[1] = y[i];
		if (max[0] < x[i]) max[0] = x[i];
		if (max[1] < y[i]) max[1] = y[i];
	}
	return [min[0], min[1], max[0], max[1]];
}

// ────────────────────────────────────────────────
// Alerts fallback: define if Alerts utility is not loaded
// ────────────────────────────────────────────────
if (typeof Alerts === 'undefined') {
	Alerts.alertNoLayerSelected();
}

// ────────────────────────────────────────────────
// Main process: Adjust comp size to fit selected layers
// ────────────────────────────────────────────────
(function () {
	var comp = app.project.activeItem;
	if (!(comp instanceof CompItem)) {
		Alerts.alertNoCompSelected(); // Please activate a composition
		return;
	}

	var selectedLayers = comp.selectedLayers;
	if (!selectedLayers || selectedLayers.length === 0) {
		Alerts.alertNoLayerSelected();
		return;
	}

	app.beginUndoGroup('Fit comp size to layers'); // "Fit comp size to layers"

	var parentList = [];
	var lockList = [];

	// Unlock and detach parents
	for (var i = 1; i <= comp.numLayers; i++) {
		var layer = comp.layer(i);
		parentList.push(layer.parent);
		lockList.push(layer.locked);
		layer.locked = false;
		layer.parent = null;
	}

	// Calculate new bounding box around selected layers
	var newRectanglePoints = null;
	for (var i = 0; i < selectedLayers.length; i++) {
		var bbox = get2RectanglePoint(selectedLayers[i]);
		if (bbox) {
			if (newRectanglePoints) {
				newRectanglePoints[0] = Math.min(newRectanglePoints[0], bbox[0]);
				newRectanglePoints[1] = Math.min(newRectanglePoints[1], bbox[1]);
				newRectanglePoints[2] = Math.max(newRectanglePoints[2], bbox[2]);
				newRectanglePoints[3] = Math.max(newRectanglePoints[3], bbox[3]);
			} else {
				newRectanglePoints = bbox.slice();
			}
		}
	}

	if (!newRectanglePoints) {
		Alerts.alertNoValidAreaFromSelectedLayers(); // Could not get valid area from selected layers
		app.endUndoGroup();
		return;
	}

	// Add null for repositioning
	var nu = comp.layers.addNull();
	nu.property('ADBE Transform Group')
		.property('ADBE Position')
		.setValue([newRectanglePoints[0], newRectanglePoints[1]]);

	// Resize comp
	comp.width = Math.floor(
		Math.abs(newRectanglePoints[2] - newRectanglePoints[0])
	);
	comp.height = Math.floor(
		Math.abs(newRectanglePoints[3] - newRectanglePoints[1])
	);

	// Reparent layers to new null and reset null position
	for (var i = 2; i <= comp.numLayers; i++) {
		comp.layer(i).parent = nu;
	}
	nu.property('ADBE Transform Group')
		.property('ADBE Position')
		.setValue([0, 0]);

	// Remove source of null layer (clean up)
	if (nu && nu.source) {
		var parentFolder = nu.source.parentFolder;
		nu.source.remove(); // remove the source

		// Delete parent folder if empty
		if (parentFolder && parentFolder.numItems === 0) {
			try {
				parentFolder.remove();
			} catch (e) {
				// Folder might be a default system folder or can't be deleted
				// Just ignore or alert if needed
				// alert('Failed to remove folder: ' + e.toString());
			}
		}
	}

	// Restore original parents and lock states
	for (var i = 1; i <= comp.numLayers; i++) {
		var layer = comp.layer(i);
		layer.parent = parentList[i - 1];
		layer.locked = lockList[i - 1];
	}

	app.endUndoGroup();
})();
