// ────────────────────────────────────────────────
// Load Utilities
// ────────────────────────────────────────────────
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
// Helper functions for folder management
// ────────────────────────────────────────────────
function findOrCreateBin(name, parent) {
	var items = parent ? parent.items : app.project.items;
	for (var i = 1; i <= items.length; i++) {
		if (items[i] instanceof FolderItem && items[i].name === name) {
			return items[i];
		}
	}
	return (parent ? parent.items : app.project.items).addFolder(name);
}

function findWorkComps() {
	var workComps = [];
	for (var i = 1; i <= app.project.numItems; i++) {
		var item = app.project.item(i);
		if (
			item instanceof CompItem &&
			item.name.toLowerCase().indexOf('_work') !== -1
		) {
			workComps.push(item);
		}
	}
	return workComps;
}

function getLightingFolders() {
	var binSozai = null;
	for (var i = 1; i <= app.project.numItems; i++) {
		var item = app.project.item(i);
		if (
			item instanceof FolderItem &&
			item.name === '01)_sozai' &&
			item.parentFolder === app.project.rootFolder
		) {
			binSozai = item;
			break;
		}
	}

	if (binSozai) {
		var bin03Cel = findOrCreateBin('03_Cel', binSozai);
		return {
			isLighting: true,
			cell: findOrCreateBin('01_Cel', bin03Cel),
			cellFX: findOrCreateBin('02_Cel_FX', bin03Cel),
		};
	}
	return { isLighting: false };
}

// ────────────────────────────────────────────────
// Collect Selected Items
// ────────────────────────────────────────────────
var mySelectedItems = [];
for (var i = 1; i <= app.project.numItems; i++) {
	if (app.project.item(i).selected) {
		mySelectedItems.push(app.project.item(i));
	}
}

// ────────────────────────────────────────────────
// Main Process
// ────────────────────────────────────────────────
if (mySelectedItems.length) {
	app.beginUndoGroup('Cell FX');

	var lightingFolders = getLightingFolders();

	for (var i = 0; i < mySelectedItems.length; i++) {
		var item = mySelectedItems[i];

		if (!(item instanceof FootageItem)) {
			alert(
				'Selected item "' +
					item.name +
					'" is not a Footage Item.\n' +
					'Please select only footage files.',
			);
			continue;
		}

		var itemName = removeSequenceNumber(item.name);

		// Skip if already precomposed
		if (getComp(itemName) || getComp(itemName + '_cellFX')) {
			alert(t(itemName, { name: itemName }));
			continue;
		}

		// Create cell comp
		var cellComp = app.project.items.addComp(
			itemName,
			item.width,
			item.height,
			1,
			item.duration,
			1 / item.frameDuration,
		);
		cellComp.layers.add(item);

		if (lightingFolders.isLighting) {
			cellComp.parentFolder = lightingFolders.cell;
		} else {
			cellComp.parentFolder = getFolder('cell');
		}

		// Create cellFX comp
		var cellFXComp = app.project.items.addComp(
			cellComp.name + '_cellFX',
			cellComp.width,
			cellComp.height,
			1,
			cellComp.duration,
			1 / cellComp.frameDuration,
		);
		var cellFXLayer = cellFXComp.layers.add(cellComp);

		if (lightingFolders.isLighting) {
			cellFXComp.parentFolder = lightingFolders.cellFX;
		} else {
			cellFXComp.parentFolder = getFolder('cellFX');
		}

		// Add Color Key effect (white)
		var colorKeyEffect = cellFXLayer.Effects.addProperty('ADBE Color Key');
		if (colorKeyEffect) {
			colorKeyEffect.property(1).setValue([1, 1, 1]);
		}

		// Try anti-alias plugins
		var antiAliasPluginFound = false;
		var antiAliasEffect = cellFXLayer.Effects.addProperty(
			'PSOFT ANTI-ALIASING',
		);
		if (antiAliasEffect) {
			antiAliasPluginFound = true;
		} else {
			antiAliasEffect = cellFXLayer.Effects.addProperty('OLM Smoother');
			if (antiAliasEffect) {
				antiAliasPluginFound = true;
			}
		}

		// Missing plugin alert (per item)
		if (!antiAliasPluginFound) {
			if (typeof Alerts !== 'undefined' && Alerts.alertMissingPlugin) {
				Alerts.alertMissingPlugin(['PSOFT ANTI-ALIASING', 'OLM Smoother']);
			} else {
				alert(
					'PSOFT ANTI-ALIASING or OLM Smoother plugin is not installed.\nPlease install the plugin.',
				);
			}
		}

		var cellFXComp = getComp(cellComp.name + '_cellFX');

		if (findWorkComps().length === 0) {
			alert('No work comps found. Please create a work comp.');
			continue;
		} else {
			for (var j = 0; j < findWorkComps().length; j++) {
				var workComp = findWorkComps()[j];
				var newLayer = workComp.layers.add(cellFXComp);
				newLayer.label = 11;

				var newName = cellFXComp.name.replace(/_cellFX$/i, '');
				var newBase = getCellSortName(cellFXComp);
				var isShita = /(?:shita|sita)$/i.test(newName);

				if (isShita) {
					// Place immediately below its base
					for (var i = 1; i <= workComp.numLayers; i++) {
						var layer = workComp.layer(i);

						if (layer === newLayer) continue;
						if (!(layer.source instanceof CompItem)) continue;

						var other = layer.source.name.replace(/_cellFX$/i, '');

						if (other.toLowerCase() === newBase.toLowerCase()) {
							newLayer.moveAfter(layer);
							break;
						}
					}
				} else {
					// Find the first CellFX layer alphabetically BEFORE us.
					// Since AE is top->bottom, names go G,F,E,D,C,B,A.

					for (var i = 1; i <= workComp.numLayers; i++) {
						var layer = workComp.layer(i);

						if (layer === newLayer) continue;
						if (!(layer.source instanceof CompItem)) continue;
						if (!/_cellFX$/i.test(layer.source.name)) continue;

						var otherBase = getCellSortName(layer.source);

						// Found first smaller letter
						if (otherBase < newBase) {
							newLayer.moveBefore(layer);
							break;
						}
					}
				}
			}
		}
	}

	app.endUndoGroup();

	// ────────────────────────────────────────────────
	// Fallback: No items selected
	// ────────────────────────────────────────────────
} else {
	if (typeof Alerts !== 'undefined' && Alerts.alertNoLayerSelected) {
		Alerts.alertNoLayerSelected();
	} else {
		alert('セルを選択してください');
	}
}

function getCellSortName(compOrName) {
	var name = typeof compOrName === 'string' ? compOrName : compOrName.name;

	name = name.replace(/_cellFX$/i, '');

	// Remove _shita/_sita for sorting
	name = name.replace(/[ _-]?(?:shita|sita)$/i, '');

	return name.toUpperCase();
}

function customSortCellFX(a, b) {
	var nameA = getCellSortName(a);
	var nameB = getCellSortName(b);

	if (nameA < nameB) return -1;
	if (nameA > nameB) return 1;

	// Same base (A vs A_shita)
	var aIsBottom = /(?:shita|sita)$/i.test(a.name);
	var bIsBottom = /(?:shita|sita)$/i.test(b.name);

	if (aIsBottom && !bIsBottom) return 1;
	if (!aIsBottom && bIsBottom) return -1;

	return 0;
}
