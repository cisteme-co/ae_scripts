// ───────────────────────────────
// Globals and State
// ───────────────────────────────
var aeremapCallPath = File.decode('c:/tmp/adobe/AE_RemapCall.exe'); // Path to AE remap executable
var cellData = null; // Raw JSON data loaded from AE remap export
var cellDataV = null; // Parsed/processed cell data for UI usage
var radioBtns = []; // Array of UI radio button controls
var selectedIndex = -1; // Index of currently selected radio button
var emptyCell = 0; // Placeholder flag for empty cell mode

// ───────────────────────────────
// Localization dictionary for alerts/messages
// ───────────────────────────────
var aeLang = app.language || 'en_US';

var alertMessages = {
	en_US: {
		connectionLost: 'Connection lost.\r\nPlease restart AE_Remap Exceed.',
		noLayersSelected: 'Please select layers.',
		selectOneLayer: 'Please select exactly one layer.',
		noActiveComp: 'Please activate a composition!',
		noCellDataLoaded: 'Cell data has not been loaded.',
		selectCell: 'Please select a cell.',
		execAEReampError: 'execAEReamp error:\r\n',
		getCellInfoError: 'getCellInfo error:\r\n',
		errorParsingCellData: 'Error parsing cell data:\r\n',
		errorPrefix: 'Error: ',
	},
	ja_JP: {
		connectionLost:
			'接続が切れました。\r\nAE_Remap Exceedを再起動させてください',
		noLayersSelected: 'レイヤを選んで',
		selectOneLayer: 'レイヤを1個だけ選んで',
		noActiveComp: 'コンポをアクティブにしてください！',
		noCellDataLoaded: 'セル情報が読み込まれていません',
		selectCell: 'セルを選んでください',
		execAEReampError: 'execAEReampエラー:\r\n',
		getCellInfoError: 'getCellInfoエラー:\r\n',
		errorParsingCellData: 'セルデータ解析エラー:\r\n',
		errorPrefix: 'エラー: ',
	},
	fr_FR: {
		connectionLost: 'Connexion perdue.\r\nVeuillez redémarrer AE_Remap Exceed.',
		noLayersSelected: 'Veuillez sélectionner des calques.',
		selectOneLayer: 'Veuillez sélectionner exactement un calque.',
		noActiveComp: 'Veuillez activer une composition !',
		noCellDataLoaded: "Les données des cellules n'ont pas été chargées.",
		selectCell: 'Veuillez sélectionner une cellule.',
		execAEReampError: 'Erreur execAEReamp:\r\n',
		getCellInfoError: 'Erreur getCellInfo:\r\n',
		errorParsingCellData: "Erreur d'analyse des données des cellules:\r\n",
		errorPrefix: 'Erreur: ',
	},
};

var AM = alertMessages[aeLang] || alertMessages['en_US'];

// ───────────────────────────────
// Utility: Clear all UI and data state
// ───────────────────────────────
function clearAll(edInfo) {
	edInfo.text = '';
	clearRadioBtns();
	selectedIndex = -1;
	cellData = null;
	cellDataV = null;
}

// ───────────────────────────────
// Utility: Clear all radio buttons from UI and reset selection
// ───────────────────────────────
function clearRadioBtns() {
	if (radioBtns.length > 0) {
		for (var i = radioBtns.length - 1; i >= 0; i--) {
			radioBtns[i].visible = false;
			radioBtns[i] = null;
			radioBtns.pop();
		}
	}
	selectedIndex = -1;
	radioBtns = [];
}

// ───────────────────────────────
// Utility: Find a property by matchName and name within a property group
// ───────────────────────────────
function findProp(pb, matchName, name) {
	if (pb.numProperties > 0) {
		for (var i = 1; i <= pb.numProperties; i++) {
			var prop = pb.property(i);
			if (prop.matchName === matchName && prop.name === name) {
				return prop;
			}
		}
	}
	return null;
}

// ───────────────────────────────
// Execute AE Remap external process with given args and handle states
// Returns true on success, false otherwise
// ───────────────────────────────
function execAEReamp() {
	var ret = false;
	var aeremapCall = new File(aeremapCallPath);
	var cmd = '"' + aeremapCall.fsName + '"';

	if (!aeremapCall.exists) return false;

	try {
		var status = system
			.callSystem(cmd + ' /exenow')
			.trim()
			.toLowerCase();
		if (status === 'false') {
			var result = system.callSystem(cmd + ' /call');
			if (result.indexOf('err') >= 0) {
				alert(result);
				ret = false;
			} else {
				ret = true;
			}
		} else {
			system.callSystem(cmd + ' /active');
			ret = true;
		}
	} catch (e) {
		alert(AM.execAEReampError + e.toString());
		ret = false;
	}
	return ret;
}

// ───────────────────────────────
// Fetch and parse cell info from AE Remap export, update UI radio buttons
// edInfo: UI element to display sheet name
// applyBtn: Button whose label updates based on selection
// cellPanel: Panel to add radio buttons
// Returns true on success
// ───────────────────────────────
function getCellInfo(edInfo, applyBtn, cellPanel) {
	var ret = false;
	var aeremapCall = new File(aeremapCallPath);
	var cmd = '"' + aeremapCall.fsName + '"';

	clearAll(edInfo);

	if (!aeremapCall.exists) return false;

	try {
		var exportPath = system.callSystem(cmd + ' /export');
		if (exportPath.indexOf('err') >= 0) {
			alert(AM.errorPrefix + exportPath);
			return false;
		}
		exportPath = exportPath.trim();
		if (exportPath === '') {
			alert(AM.connectionLost);
			return false;
		}

		var f = new File(exportPath);
		if (f.exists && f.open('r')) {
			var jsonStr = f.read();
			f.close();

			var obj = FsJSON.parse(jsonStr);
			if (obj.header === 'ardjV2') {
				edInfo.text = obj.sheetName;
				cellData = obj;

				try {
					cellDataV = analysisCellData(obj);
				} catch (e) {
					alert(AM.errorParsingCellData + e.toString());
				}
				makeRadioBtn(cellDataV.caption, applyBtn, cellPanel);
				ret = true;
			}
		}
	} catch (e) {
		alert(AM.getCellInfoError + e.toString());
		ret = false;
	}
	return ret;
}

// ───────────────────────────────
// Parse raw JSON cell data to structured object for UI usage
// Returns object with frameCount, duration, captions, and cell time/value arrays
// ───────────────────────────────
function analysisCellData(obj) {
	var ret = {
		frameCount: obj.frameCount,
		caption: [],
		cell: [],
		duration: obj.frameCount / obj.frameRate,
		frameRate: obj.frameRate,
	};

	for (var i = 0; i < obj.cellCount; i++) {
		var cd = obj.cell[i];
		if (cd.length === 1 && cd[0][0] === 0 && cd[0][1] === 0) continue;

		ret.caption.push(obj.caption[i]);

		var times = [];
		var values = [];

		for (var j = 0; j < cd.length; j++) {
			times.push(cd[j][0] / obj.frameRate);
			values.push((cd[j][1] - 1) / obj.frameRate);
		}
		ret.cell.push([times, values]);
	}

	return ret;
}

// ───────────────────────────────
// Dynamically create radio buttons for each caption, update applyBtn label on click
// ───────────────────────────────
function makeRadioBtn(captions, applyBtn, cellPanel) {
	clearRadioBtns();

	if (!captions.length) return;

	var x = 5,
		y = 5;
	for (var i = 0; i < captions.length; i++) {
		var rb = cellPanel.add('radiobutton', [x, y, x + 150, y + 20], captions[i]);
		rb.idx = i;

		rb.onClick = function () {
			selectedIndex = this.idx;
			applyBtn.text = 'Apply ' + cellData.caption[this.idx];
		};

		radioBtns.push(rb);
		y += 23;
	}
}

// ───────────────────────────────
// Get selected layers from the active comp
// Alerts if none selected, returns array of selected layers or null
// ───────────────────────────────
function getLayer(cmp) {
	if (!cmp || !(cmp instanceof CompItem)) {
		cmp = getActiveComp();
		if (!cmp) return null;
	}
	var layers = cmp.selectedLayers;
	if (!layers.length) {
		alert(AM.noLayersSelected);
		return null;
	}
	return layers;
}

// ───────────────────────────────
// Get exactly one selected layer from the active comp
// Alerts if not exactly one, returns the layer or null
// ───────────────────────────────
function getLayerOne(cmp) {
	if (!cmp || !(cmp instanceof CompItem)) {
		cmp = getActiveComp();
		if (!cmp) return null;
	}
	var layers = cmp.selectedLayers;
	if (layers.length !== 1) {
		alert(AM.selectOneLayer);
		return null;
	}
	return layers[0];
}

// ───────────────────────────────
// Get the currently active composition, alert if none
// ───────────────────────────────
function getActiveComp() {
	var ac = app.project.activeItem;
	if (!(ac instanceof CompItem)) {
		alert(AM.noActiveComp);
		return null;
	}
	return ac;
}

// ───────────────────────────────
// Apply the currently selected cell remapping to selected layers
// inOutPoint: boolean, whether to adjust layer in/out points based on remap keys
// emptyCell: mode controlling empty cell effect (0 = Block Dissolve, 2 = Opacity toggle, 1/default = none)
// ───────────────────────────────
function applyCells(inOutPoint, emptyCell) {
	if (!cellDataV || !cellData) {
		alert(AM.noCellDataLoaded);
		return;
	}

	// Internal helper to apply remap and effects on a single layer
	function applySub(
		layer,
		times,
		values,
		empties,
		emptyTimes,
		inOutPoint,
		emptyCell
	) {
		if (!layer.canSetTimeRemapEnabled) return;

		try {
			var rp = layer.property(2); // Time remap property

			// Clear existing keys
			for (var i = rp.numKeys; i >= 1; i--) rp.removeKey(i);

			layer.timeRemapEnabled = true;

			// Reset layer timing
			layer.startTime = 0;
			layer.inPoint = 0;
			layer.outPoint = layer.containingComp.duration;

			var fr = layer.containingComp.frameRate;

			// Set new keyframes and hold interpolation
			rp.setValuesAtTimes(times, values);
			for (var i = 1; i <= rp.numKeys; i++) {
				rp.setInterpolationTypeAtKey(
					i,
					KeyframeInterpolationType.HOLD,
					KeyframeInterpolationType.HOLD
				);
			}

			// Apply empty cell effects based on mode
			switch (emptyCell) {
				case 0: {
					// Block Dissolve effect
					var eg = layer.property('ADBE Effect Parade');
					var mn = 'ADBE Block Dissolve';
					var na = 'EmptyCell';

					if (eg.canAddProperty(mn)) {
						var bp = findProp(eg, mn, na);
						if (!bp) {
							bp = eg.addProperty(mn);
							bp.name = na;
						}
						var bpv = bp.property(1);

						// Clear existing keys
						for (var i = bpv.numKeys; i >= 1; i--) bpv.removeKey(i);

						// Set new keys and hold interpolation
						bpv.setValuesAtTimes(emptyTimes, empties);
						for (var i = 1; i <= bpv.numKeys; i++) {
							bpv.setInterpolationTypeAtKey(
								i,
								KeyframeInterpolationType.HOLD,
								KeyframeInterpolationType.HOLD
							);
						}
					}
					break;
				}
				case 1: {
					// Toggle Opacity effect
					var opa = layer.transform.opacity;

					for (var i = opa.numKeys; i >= 1; i--) opa.removeKey(i);

					// Invert opacity values (100 <-> 0)
					for (var i = 0; i < empties.length; i++) {
						empties[i] = empties[i] === 100 ? 0 : 100;
					}

					opa.setValuesAtTimes(emptyTimes, empties);
					for (var i = 1; i <= opa.numKeys; i++) {
						opa.setInterpolationTypeAtKey(
							i,
							KeyframeInterpolationType.HOLD,
							KeyframeInterpolationType.HOLD
						);
					}
					break;
				}
				default:
					// No effect
					break;
			}

			// Adjust in/out points based on remap keys if requested
			if (inOutPoint) {
				if (rp.numKeys > 2) {
					var maxV = Math.round(layer.source.duration * fr);

					var firstValFrame = Math.round(rp.keyValue(1) * fr);
					if (firstValFrame >= maxV) {
						layer.inPoint = rp.keyTime(2);
					}

					var lastValFrame = Math.round(rp.keyValue(rp.numKeys) * fr);
					if (lastValFrame >= maxV) {
						layer.outPoint = rp.keyTime(rp.numKeys);
					}
				}
			} else {
				layer.outPoint = layer.containingComp.duration;
			}
		} catch (e) {
			alert(e.toString());
		}
	}

	if (selectedIndex < 0) {
		alert(AM.selectCell);
		return;
	}

	var layers = getLayer();
	if (!layers || layers.length === 0) return;

	app.beginUndoGroup('AE_Remap');

	// Set composition duration to cell data duration
	var cmp = layers[0].containingComp;
	if (cmp.duration !== cellDataV.duration) cmp.duration = cellDataV.duration;

	// For each selected layer, build times/values arrays and apply remap
	for (var i = 0; i < layers.length; i++) {
		var layer = layers[i];

		var times = [];
		var values = [];
		var empties = [];
		var emptyTimes = [];
		var fr = cellDataV.frameRate;
		var rp = layer.property(2);
		var maxV = rp.maxValue;

		var timeVals = cellDataV.cell[selectedIndex][0];
		var numVals = cellDataV.cell[selectedIndex][1];

		for (var j = 0; j < numVals.length; j++) {
			var tim = timeVals[j];
			var num = numVals[j];

			if (num < 0) num = maxV;
			else if (num > maxV) num = maxV;

			times.push(tim);
			values.push(num);

			empties.push(num >= maxV ? 100 : 0);
			emptyTimes.push(tim);
		}

		// Remove consecutive duplicate empty values for efficiency
		for (var j = empties.length - 1; j >= 1; j--) {
			if (empties[j] === empties[j - 1]) {
				empties.splice(j, 1);
				emptyTimes.splice(j, 1);
			}
		}

		applySub(layer, times, values, empties, emptyTimes, inOutPoint, emptyCell);
	}

	app.endUndoGroup();
}
