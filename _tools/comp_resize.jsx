
LayerCollection.prototype.addNull = function () {
    var color = [1, 1, 1];
    var name = "ヌル 1";
    var n = this.addSolid(color, name, 100, 100, 1, 1);
    var comp = n.containingComp;
    n.outPoint = comp.duration;
    n.nullLayer = true;
    n.source.width = comp.width;
    n.source.height = comp.height;
    n.source.pixelAspect = comp.pixelAspect;
    return n;
}
Array.prototype.min = function () {
    return Math.min.apply(null, this)
}
Array.prototype.max = function () {
    return Math.max.apply(null, this)
}

function length(point1, point2) {
    var n = Math.sqrt(Math.pow(point2[0] - point1[0], 2) + Math.pow(point2[1] - point1[1], 2));
    return n;
}

function get4RectanglePoint(target) {
    if (target instanceof AVLayer) {
        var layer_pixelAspect = target.source.pixelAspect;
        var comp_pixelAspect = target.containingComp.pixelAspect;

        var anchorX = target.property("ADBE Transform Group").property("ADBE Anchor Point").value[0];
        var anchorY = target.property("ADBE Transform Group").property("ADBE Anchor Point").value[1];
        var anchorZ = target.property("ADBE Transform Group").property("ADBE Anchor Point").value[2];

        var posX = target.property("ADBE Transform Group").property("ADBE Position").value[0];
        var posY = target.property("ADBE Transform Group").property("ADBE Position").value[1];
        var posZ = target.property("ADBE Transform Group").property("ADBE Position").value[2];

        var scaleX = target.property("ADBE Transform Group").property("ADBE Scale").value[0];
        var scaleY = target.property("ADBE Transform Group").property("ADBE Scale").value[1];
        var scaleZ = target.property("ADBE Transform Group").property("ADBE Scale").value[2];

        var rotX = target.property("ADBE Transform Group").property("ADBE Rotate X").value;
        var rotY = target.property("ADBE Transform Group").property("ADBE Rotate Y").value;
        var rotZ = target.property("ADBE Transform Group").property("ADBE Rotate Z").value;

        var r = (rotZ + 180) * Math.PI / 180 * -1;
        scaleX = scaleX * layer_pixelAspect;

        var p = [];
        var x = [];
        var y = [];
        var n = [];

        p[0] = [anchorX / 100 * scaleX, anchorY / 100 * scaleY];
        p[1] = [anchorX / 100 * scaleX - target.width / 100 * scaleX, anchorY / 100 * scaleY];
        p[2] = [anchorX / 100 * scaleX - target.width / 100 * scaleX, anchorY / 100 * scaleY - target.height / 100 * scaleY];
        p[3] = [anchorX / 100 * scaleX, anchorY / 100 * scaleY - target.height / 100 * scaleY];

        for (var i = 0; i < p.length; i++) {
            var dist = length(p[i], [0, 0]);
            var rr = Math.atan2(p[i][0], p[i][1]) + r;
            n[n.length] = [Math.sin(rr) * dist / comp_pixelAspect + posX, Math.cos(rr) * dist + posY];
        }
        return n;
    }
}

function get2RectanglePoint(layer) {
    var m = get4RectanglePoint(layer);
    var x = [],
        y = [];
    var min = [],
        max = [];
    var n = [];
    for (var i = 0; i < m.length; i++) {
        x[x.length] = m[i][0];
        y[y.length] = m[i][1];
    }
    for (var i = 0; i < x.length; i++) {
        if (min != "") {
            min[0] = (min[0] > x[i]) ? x[i] : min[0];
            min[1] = (min[1] > y[i]) ? y[i] : min[1];
            max[0] = (max[0] < x[i]) ? x[i] : max[0];
            max[1] = (max[1] < y[i]) ? y[i] : max[1];
        } else {
            min[0] = x[i];
            min[1] = y[i];
            max[0] = x[i];
            max[1] = y[i];
        }
    }
    n = [min[0], min[1], max[0], max[1]];
    return n;
}
var comp = app.project.activeItem;
var newRectanglePoints = [];
var parentList = [];
var lockList = [];

if (comp) {
    var lay = comp.selectedLayers;
    if (lay != "") {
        app.beginUndoGroup("コンポの大きさをレイヤーにあわせる");
        for (var i = 1; i <= comp.numLayers; i++) {
            parentList[parentList.length] = comp.layer(i).parent;
            lockList[lockList.length] = comp.layer(i).locked;
            comp.layer(i).locked = false;
            comp.layer(i).parent = null;
        }
        for (var i = 0; i < lay.length; i++) {
            var n = get2RectanglePoint(lay[i]);
            if (n) {
                if (newRectanglePoints != "") {
                    newRectanglePoints[0] = (newRectanglePoints[0] > n[0]) ? n[0] : newRectanglePoints[0];
                    newRectanglePoints[1] = (newRectanglePoints[1] > n[1]) ? n[1] : newRectanglePoints[1];
                    newRectanglePoints[2] = (newRectanglePoints[2] < n[2]) ? n[2] : newRectanglePoints[2];
                    newRectanglePoints[3] = (newRectanglePoints[3] < n[3]) ? n[3] : newRectanglePoints[3];
                } else {
                    newRectanglePoints[0] = n[0];
                    newRectanglePoints[1] = n[1];
                    newRectanglePoints[2] = n[2];
                    newRectanglePoints[3] = n[3];
                }
            }
        }
        var nu = comp.layers.addNull();
        nu.property("ADBE Transform Group").property("ADBE Position").setValue([newRectanglePoints[0], newRectanglePoints[1]]);
        comp.width = Math.floor(Math.abs(newRectanglePoints[2] - newRectanglePoints[0]));
        comp.height = Math.floor(Math.abs(newRectanglePoints[3] - newRectanglePoints[1]));
        for (var i = 2; i <= comp.numLayers; i++) {
            comp.layer(i).parent = nu;
        }
        nu.property("ADBE Transform Group").property("ADBE Position").setValue([0, 0]);
        nu.source.remove();
        for (var i = 1; i <= comp.numLayers; i++) {
            comp.layer(i).parent = parentList[i - 1];
            comp.layer(i).locked = lockList[i - 1];
        }

        app.endUndoGroup();
    }
}
