// ────────────────────────────────────────────────
// Extract Shadow Script for Selected Layers
// ────────────────────────────────────────────────

// Load Alerts and Comp Utilities (adjust paths as needed)
var rootFolder = File($.fileName).parent;
$.evalFile(new File(rootFolder.fsName + '/utils/alerts.jsx'));
$.evalFile(new File(rootFolder.fsName + '/utils/comp_utils.jsx'));

// Translation dictionary
var translations = {
	en: '{name} is already pre-composed in this file.',
	fr: '{name} est déjà précomposé dans ce fichier.',
	ja: 'このファイル内で {name} はすでにプリコンポーズされています。',
};

// Function to detect After Effects language
function getAELang() {
	try {
		return app.language ? app.language : 'en';
	} catch (e) {
		return 'en';
	}
}

// Get translation in current language
function t(key, replacements) {
	var lang = getAELang();
	if (!translations[lang]) lang = 'en'; // fallback
	var text = translations[lang];
	for (var r in replacements) {
		text = text.replace(new RegExp('\\{' + r + '\\}', 'g'), replacements[r]);
	}
	return text;
}

// ────────────────────────────────────────────────
// Gather selected items in project
// ────────────────────────────────────────────────
var mySelectedItems = [];
for (var i = 1; i <= app.project.numItems; i++) {
	if (app.project.item(i).selected) {
		mySelectedItems.push(app.project.item(i));
	}
}

// ────────────────────────────────────────────────
// Main processing block
// ────────────────────────────────────────────────
if (mySelectedItems.length) {
	app.beginUndoGroup('Extract Shadow');

	for (var i = 0; i < mySelectedItems.length; i++) {
		var item = mySelectedItems[i];

		if (!(item instanceof FootageItem)) {
			alert(
				'Selected item "' +
					item.name +
					'" is not a Footage Item.\n' +
					'Please select only footage files.'
			);
			continue;
		}

		var itemName = removeSequenceNumber(item.name);
		var cellComp;

		if (getComp(itemName + '_shadow')) {
			alert(t(itemName, { name: itemName + '_shadow' }));
			continue;
		}

		// Get or create cell composition
		if (getComp(itemName)) {
			cellComp = getComp(itemName);
		} else {
			cellComp = app.project.items.addComp(
				itemName,
				item.width,
				item.height,
				1,
				item.duration,
				1 / item.frameDuration
			);
			cellComp.layers.add(item);
			cellComp.parentFolder = getFolder('cell');
		}

		// Create shadow composition
		var shadComp = app.project.items.addComp(
			itemName + '_shadow',
			item.width,
			item.height,
			1,
			item.duration,
			1 / item.frameDuration
		);
		shadComp.layers.add(item);
		shadComp.parentFolder = getFolder('cell');

		// ────────────────────────────────────────────────
		// Add Effects to layers in cellComp
		// ────────────────────────────────────────────────
		var cellCompLayers = cellComp.numLayers;

		for (var j = 1; j <= cellCompLayers; j++) {
			var layer = cellComp.layer(j);

			try {
				// === PSOFT REPLACECOLOR ===
				var replaceShadowEffect = layer.Effects.property('PSOFT REPLACECOLOR');
				if (!replaceShadowEffect) {
					replaceShadowEffect = layer.Effects.addProperty('PSOFT REPLACECOLOR');
					if (replaceShadowEffect) {
						replaceShadowEffect
							.property('PSOFT REPLACECOLOR-0106')
							.setValue([1, 0, 1]); // Magenta
						replaceShadowEffect
							.property('PSOFT REPLACECOLOR-0107')
							.setValue([1, 1, 1]); // White
					} else {
						alert(
							'Failed to add PSOFT REPLACECOLOR effect. Please ensure the plugin is installed.'
						);
						app.endUndoGroup();
						break;
					}
				}

				// === ADBE Color Key ===
				var colorKeyEffect = layer.Effects.property('ADBE Color Key');
				if (!colorKeyEffect) {
					colorKeyEffect = layer.Effects.addProperty('ADBE Color Key');
					if (colorKeyEffect) {
						colorKeyEffect.property('ADBE Color Key-0001').setValue([1, 1, 1]); // White
					} else {
						alert('Failed to add Color Key effect.');
						app.endUndoGroup();
						break;
					}
				}
			} catch (err) {
				alert('An error occurred during processing:\n' + err.toString());
				app.endUndoGroup();
				break;
			}
		}

		// ────────────────────────────────────────────────
		// Prepare shadow composition layers with effects and mattes
		// ────────────────────────────────────────────────
		var shadCompLayers = shadComp.numLayers;
		for (var k = 1; k <= shadCompLayers; k++) {
			var layer = shadComp.layer(k);

			try {
				// Duplicate layer for mask and disable visibility
				var mask = layer.duplicate();
				mask.name = layer.name + '_mask';
				mask.enabled = false;

				// Rename original layer and set as alpha track matte
				layer.name = layer.name + '_shadow';
				layer.trackMatteType = TrackMatteType.ALPHA;

				// Add PSOFT COLORSELECTION effect (magenta selection)
				var colorSelection = layer.Effects.addProperty('PSOFT COLORSELECTION');
				if (colorSelection) {
					colorSelection.property('View').setValue(4);
					colorSelection
						.property('PSOFT COLORSELECTION-0105')
						.setValue([1, 0, 1]); // Magenta
				} else {
					alert(
						'Failed to add PSOFT COLORSELECTION effect on duplicate. Please check plugin installation.'
					);
					app.endUndoGroup();
					break;
				}

				// Add Minimax effect and set radius and threshold
				var minimax = layer.Effects.addProperty('ADBE Minimax');
				if (minimax) {
					minimax.property('ADBE Minimax-0002').setValue(2); // Radius
					minimax.property('ADBE Minimax-0003').setValue(6); // Threshold
				} else {
					alert('Failed to add Minimax effect on duplicate.');
					app.endUndoGroup();
					break;
				}
			} catch (err) {
				alert('An error occurred during processing:\n' + err.toString());
				app.endUndoGroup();
				break;
			}
		}
	}

	app.endUndoGroup();
} else {
	// No layers selected alert
	if (typeof Alerts !== 'undefined' && Alerts.alertNoLayerSelected) {
		Alerts.alertNoLayerSelected();
	} else {
		alert('セルを選択してください');
	}
}
