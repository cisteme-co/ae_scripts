/*
────────────────────────────────────────────
 Smart Expression Effect Name Translator
────────────────────────────────────────────
 This script:
  1. Loads localized effect names from JSON.
  2. Updates expressions in all comps/layers to use correct matchNames.
  3. Handles language-specific property names (e.g. Dropdown "Menu").
────────────────────────────────────────────
*/

(function smartExpressionEffectNameTranslator() {
	// ─────────────────────────────────────────────
	// Load and build map of all effect names
	// ─────────────────────────────────────────────
	function buildAllEffectNameMap() {
		var map = {};

		// Locate the script's folder
		var scriptFile = File($.fileName);
		var scriptFolder = scriptFile.parent;

		// JSON path
		var jsonFile = new File(
			scriptFolder.fsName + '/utils/effects_localized.json'
		);
		if (!jsonFile.exists) {
			alert(
				'⚠ Missing effects_localized.json\nNo translation will be performed.'
			);
			return map;
		}

		if (!jsonFile.open('r')) {
			alert('⚠ Could not open effects_localized.json');
			return map;
		}

		try {
			var raw = jsonFile.read();
			map = eval('(' + raw + ')'); // ExtendScript fallback for JSON.parse
		} catch (err) {
			alert('⚠ Failed to parse JSON:\n' + err.toString());
		} finally {
			jsonFile.close();
		}

		return map || {};
	}

	// ─────────────────────────────────────────────
	// Utility: Escape regex special characters
	// ─────────────────────────────────────────────
	function escapeRegExp(str) {
		return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	}

	// ─────────────────────────────────────────────
	// Replace effect and property names inside expression text
	// ─────────────────────────────────────────────
	function replaceNamesInExpression(expr, nameMap) {
		if (!expr || !nameMap) return expr;

		// 1. Replace effect names
		for (var key in nameMap) {
			if (!nameMap.hasOwnProperty(key)) continue;
			var matchName = nameMap[key] || key; // fallback to original if missing

			var doubleQuoted = new RegExp('"' + escapeRegExp(key) + '"', 'g');
			var singleQuoted = new RegExp("'" + escapeRegExp(key) + "'", 'g');

			expr = expr.replace(doubleQuoted, '"' + matchName + '"');
			expr = expr.replace(singleQuoted, '"' + matchName + '"');
		}

		// 2. Replace localized Dropdown Menu "Menu" property
		var menuPropNameMap = {
			en_US: 'Menu',
			fr_FR: 'Menu',
			ja_JP: 'メニュー',
			// Add more if needed
		};
		var lang = app.language || 'en_US';
		var localizedMenu = menuPropNameMap[lang] || menuPropNameMap['en_US'];

		// Matches ("Menu") or ('Menu') exactly
		var menuPattern = /(\(["'])Menu(['"]\))/g;
		expr = expr.replace(menuPattern, function (match, p1, p2) {
			return p1 + localizedMenu + p2;
		});

		return expr;
	}

	// ─────────────────────────────────────────────
	// Recursively process a property and its subproperties
	// ─────────────────────────────────────────────
	function processProperty(prop, nameMap) {
		if (prop.canSetExpression && prop.expressionEnabled) {
			try {
				var originalExpr = prop.expression;
				var updatedExpr = replaceNamesInExpression(originalExpr, nameMap);
				if (originalExpr !== updatedExpr) {
					prop.expression = updatedExpr;
					$.writeln('✔ Updated: ' + prop.name);
				}
			} catch (e) {
				$.writeln('✖ Error updating ' + prop.name + ': ' + e.toString());
			}
		}

		if (prop.numProperties !== undefined) {
			for (var i = 1; i <= prop.numProperties; i++) {
				processProperty(prop.property(i), nameMap);
			}
		}
	}

	// ─────────────────────────────────────────────
	// Process an entire comp
	// ─────────────────────────────────────────────
	function processComp(comp, nameMap) {
		for (var i = 1; i <= comp.numLayers; i++) {
			processProperty(comp.layer(i), nameMap);
		}
	}

	// ─────────────────────────────────────────────
	// Main execution
	// ─────────────────────────────────────────────
	app.beginUndoGroup('Smart Expression Translation');

	var nameMap = buildAllEffectNameMap();
	var proj = app.project;

	if (proj && proj.numItems > 0) {
		for (var i = 1; i <= proj.numItems; i++) {
			if (proj.item(i) instanceof CompItem) {
				processComp(proj.item(i), nameMap);
			}
		}
	} else {
		alert('⚠ No project or comps found.');
	}

	app.endUndoGroup();
})();
