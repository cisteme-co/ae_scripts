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
					'Please select only footage files.'
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
			1 / item.frameDuration
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
			1 / cellComp.frameDuration
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
			'PSOFT ANTI-ALIASING'
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
					'PSOFT ANTI-ALIASING or OLM Smoother plugin is not installed.\nPlease install the plugin.'
				);
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
