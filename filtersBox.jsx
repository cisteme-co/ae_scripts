// JSON
"object" != typeof JSON && (JSON = {}), function () { "use strict"; var rx_one = /^[\],:{}\s]*$/, rx_two = /\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, rx_three = /"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, rx_four = /(?:^|:|,)(?:\s*\[)+/g, rx_escapable = /[\\"\u0000-\u001f\u007f-\u009f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g, rx_dangerous = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g, gap, indent, meta, rep; function f(t) { return t < 10 ? "0" + t : t } function this_value() { return this.valueOf() } function quote(t) { return rx_escapable.lastIndex = 0, rx_escapable.test(t) ? '"' + t.replace(rx_escapable, function (t) { var e = meta[t]; return "string" == typeof e ? e : "\\u" + ("0000" + t.charCodeAt(0).toString(16)).slice(-4) }) + '"' : '"' + t + '"' } function str(t, e) { var r, n, o, u, f, a = gap, i = e[t]; switch (i && "object" == typeof i && "function" == typeof i.toJSON && (i = i.toJSON(t)), "function" == typeof rep && (i = rep.call(e, t, i)), typeof i) { case "string": return quote(i); case "number": return isFinite(i) ? String(i) : "null"; case "boolean": case "null": return String(i); case "object": if (!i) return "null"; if (gap += indent, f = [], "[object Array]" === Object.prototype.toString.apply(i)) { for (u = i.length, r = 0; r < u; r += 1)f[r] = str(r, i) || "null"; return o = 0 === f.length ? "[]" : gap ? "[\n" + gap + f.join(",\n" + gap) + "\n" + a + "]" : "[" + f.join(",") + "]", gap = a, o } if (rep && "object" == typeof rep) for (u = rep.length, r = 0; r < u; r += 1)"string" == typeof rep[r] && (o = str(n = rep[r], i)) && f.push(quote(n) + (gap ? ": " : ":") + o); else for (n in i) Object.prototype.hasOwnProperty.call(i, n) && (o = str(n, i)) && f.push(quote(n) + (gap ? ": " : ":") + o); return o = 0 === f.length ? "{}" : gap ? "{\n" + gap + f.join(",\n" + gap) + "\n" + a + "}" : "{" + f.join(",") + "}", gap = a, o } } "function" != typeof Date.prototype.toJSON && (Date.prototype.toJSON = function () { return isFinite(this.valueOf()) ? this.getUTCFullYear() + "-" + f(this.getUTCMonth() + 1) + "-" + f(this.getUTCDate()) + "T" + f(this.getUTCHours()) + ":" + f(this.getUTCMinutes()) + ":" + f(this.getUTCSeconds()) + "Z" : null }, Boolean.prototype.toJSON = this_value, Number.prototype.toJSON = this_value, String.prototype.toJSON = this_value), "function" != typeof JSON.stringify && (meta = { "\b": "\\b", "\t": "\\t", "\n": "\\n", "\f": "\\f", "\r": "\\r", '"': '\\"', "\\": "\\\\" }, JSON.stringify = function (t, e, r) { var n; if (indent = gap = "", "number" == typeof r) for (n = 0; n < r; n += 1)indent += " "; else "string" == typeof r && (indent = r); if ((rep = e) && "function" != typeof e && ("object" != typeof e || "number" != typeof e.length)) throw new Error("JSON.stringify"); return str("", { "": t }) }), "function" != typeof JSON.parse && (JSON.parse = function (text, reviver) { var j; function walk(t, e) { var r, n, o = t[e]; if (o && "object" == typeof o) for (r in o) Object.prototype.hasOwnProperty.call(o, r) && (void 0 !== (n = walk(o, r)) ? o[r] = n : delete o[r]); return reviver.call(t, e, o) } if (text = String(text), rx_dangerous.lastIndex = 0, rx_dangerous.test(text) && (text = text.replace(rx_dangerous, function (t) { return "\\u" + ("0000" + t.charCodeAt(0).toString(16)).slice(-4) })), rx_one.test(text.replace(rx_two, "@").replace(rx_three, "]").replace(rx_four, ""))) return j = eval("(" + text + ")"), "function" == typeof reviver ? walk({ "": j }, "") : j; throw new SyntaxError("JSON.parse") }) }();

(function (thisObj) {

    buildUI(thisObj);

    function buildUI(thisObj) {

        var win = (thisObj instanceof Panel) ? thisObj : new Window("palette", "Filters Box", undefined, {
            resizeable: true
        });
        win.alignChildren = 'fill'
        win.spacing = 4

        // First Row
        var firstRow = win.add('group');
        firstRow.orientation = 'row';
        firstRow.spacing = 5;
        var projectsDrop = firstRow.add('dropdownlist', undefined, []);
        populateDropDown(projectsDrop, getProjects());
        projectsDrop.onChange = reload

        var reloadButton = firstRow.add('button', undefined, 'Reload')
        reloadButton.onClick = reload

        var tPanel = win.add('tabbedpanel')
        var ffx = tPanel.add('tab', undefined, 'FFX Presets')
        ffx.alignChildren = "fill";
        var ffxList = ffx.add('listbox', undefined, [])
        ffxList.preferredSize = [100, 400];
        populateList(ffxList, getPresets(getProjects()[projectsDrop.selection.index], 'ffx'))

        var aep = tPanel.add('tab', undefined, 'AEP Presets')
        aep.alignChildren = "fill";
        var aepList = aep.add('listbox', undefined, [])
        aepList.preferredSize = [100, 400];
        populateList(aepList, getPresets(getProjects()[projectsDrop.selection.index], 'aep'))

        var applyButton = win.add('button', undefined, 'Apply')
        applyButton.onClick = function () {
            var projectPath = getProjects()[projectsDrop.selection.index]
            var presetFolder = '/assets/templates/compositing/_presets/'
            var extension, file;

            if (tPanel.selection.text == 'FFX Presets') {
                extension = '.ffx'
                file = ffxList.selection.text
            } else {
                extension = '.aep'
                file = aepList.selection.text
            }

            var filePath = decodeURI(projectPath.path) + '/' + decodeURI(projectPath.name) + presetFolder + '/' + file + extension
            var file = File(filePath)

            if (file.exists) {
                if (extension == '.ffx') {
                    app.beginUndoGroup("preset");

                    var curItem = app.project.activeItem;
                    var selectedLayers = curItem.selectedLayers;

                    for (var i = 0; i < selectedLayers.length; i++) {
                        var selectedLayer = selectedLayers[i];
                        selectedLayer.applyPreset(file)
                    }

                    app.endUndoGroup();
                } else if (extension == ".aep") {
                    var comp = app.project.activeItem
                    var io = new ImportOptions(file)
                    if (io.canImportAs(ImportAsType.PROJECT)) {
                        app.project.importFile(io)
                    }
                }
            } else {
                alert('No Preset here')
            }
        }

        function reload() {
            ffxList.removeAll()
            aepList.removeAll()

            populateList(ffxList, getPresets(getProjects()[projectsDrop.selection.index], 'ffx'))
            populateList(aepList, getPresets(getProjects()[projectsDrop.selection.index], 'aep'))

        }

        win.onResizing = win.onResize = function () {
            this.layout.resize();
        };

        if (win instanceof Window) {
            win.center();
            win.show();
        } else {
            win.layout.layout(true);
            win.layout.resize();
        }

    }

})(this);

function readDropboxJSON(file) {
    if (file.exists == true) {
        var currentLine;
        var jsonStuff = [];
        file.open('r');
        while (!file.eof) {
            currentLine = file.readln();
            jsonStuff.push(currentLine);
        }
        file.close();
        jsonStuff = jsonStuff.join('');
        var parsedJson = JSON.parse(jsonStuff);
        return parsedJson.business.path;
    }
}

function getWorkFolder() {
    var appdataFolder = Folder('~/./AppData/Local/').path;
    var dropboxFolder = appdataFolder + '/local/Dropbox/';
    var infoFile = File(dropboxFolder + 'info.json');

    if (infoFile.exists) {
        var dropboxPath = readDropboxJSON(infoFile);
        var workFolder = dropboxPath + '/work/';

        return workFolder;
    } else {
        var appdataFolder = Folder('~/../AppData/Local/').path;
        var dropboxFolder = appdataFolder + '/local/Dropbox/';
        var infoFile = File(dropboxFolder + 'info.json');

        if (infoFile.exists) {
            var dropboxPath = readDropboxJSON(infoFile);
            var workFolder = dropboxPath + '/work/';

            return workFolder;
        } else {
			var workFolder = "~/OneDrive/work/"

			if (Folder(workFolder).exists) {
				return workFolder
			} else {
				return "D:/OneDrive/work/"
			}

		}
    }
}

function getProjects() {
    var workFolders = Folder(getWorkFolder()).getFiles();
    var projects = [];

    for (var i = 0; i < workFolders.length; i++) {
        var folder = workFolders[i];

        if (folder.name[0] != '_') {
            if (
                Folder(folder.path + '/' + folder.name + '/production/compositing/')
                    .exists
            ) {
                projects.push(folder);
            }
        }
    }

    return projects;
}

function populateDropDown(dropdown, items) {
    for (var i = 0; i < items.length; i++) {
        dropdown.add('item', items[i].name);
    }

    dropdown.selection = 0;
}

function getPresets(path, type) {
    var presetsPath = Folder(path.path + '/' + path.name + '/assets/templates/compositing/_presets/')
    var files = []
    if (presetsPath.exists) {
        var presetFiles = presetsPath.getFiles()
        for (var i = 0; i < presetFiles.length; i++) {
            if (presetFiles[i] instanceof File) {
                var extension = presetFiles[i].name.split('.')[1]
                if (extension.toLowerCase() == type) {
                    files.push(presetFiles[i])
                }
            }
        }
    }

    return files
}

function populateList(node, items) {
    if (items.length > 0) {
        for (var i = 0; i < items.length; i++) {
            node.add('item', decodeURI(items[i].name).split('.')[0])
        }
    } else {
        var no = node.add('item', 'No Preset')
        no.enabled = false
    }
}

