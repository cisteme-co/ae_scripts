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
			scriptFolder.fsName + '/utils/effects_localized.json',
		);
		if (!jsonFile.exists) {
			alert(
				'⚠ Missing effects_localized.json\nNo translation will be performed.',
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

		// Only replace effect property names:
		// effect("Effect Name")("Property Name")

		expr = expr.replace(
			/(effect\s*\(\s*["'][^"']+["']\s*\)\s*\(\s*["'])([^"']+)(["']\s*\))/g,
			function (match, prefix, propName, suffix) {
				if (nameMap.hasOwnProperty(propName)) {
					return prefix + nameMap[propName] + suffix;
				}

				return match;
			},
		);

		return expr;
	}

	function replaceSliderControl() {
		app.beginUndoGroup('Rename Slider Control to スライダー制御');

		var proj = app.project;
		if (!proj) return;

		for (var i = 1; i <= proj.numItems; i++) {
			var item = proj.item(i);
			if (!(item instanceof CompItem)) continue;

			for (var l = 1; l <= item.numLayers; l++) {
				var layer = item.layer(l);
				var effects = layer.property('ADBE Effect Parade');
				if (!effects) continue;

				for (var e = 1; e <= effects.numProperties; e++) {
					var fx = effects.property(e);

					// Only rename if the visible name is exactly "Slider Control"
					if (fx.name === 'Slider Control') {
						fx.name = 'スライダー制御';
					}

					if (fx.name === 'Layer Control') {
						fx.name = 'レイヤー制御';
					}

					if (fx.name === 'Warp') {
						fx.name = 'ワープ';
					}
				}
			}
		}

		app.endUndoGroup();
	}
	// ─────────────────────────────────────────────
	// Recursively process a property and its subproperties
	// ─────────────────────────────────────────────
	function processProperty(prop, nameMap) {
		if (prop.canSetExpression && prop.expressionEnabled) {
			try {
				var originalExpr = prop.expression;
				var updatedExpr = replaceNamesInExpression(originalExpr, nameMap);
				replaceSliderControl();
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
