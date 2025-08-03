(function smartExpressionEffectNameTranslator() {
	function buildAllEffectNameMap() {
		var map = {};

		// Locate the script's folder
		var scriptFile = File($.fileName);
		var scriptFolder = scriptFile.parent;

		// Load effects_localized.json from the same folder
		var jsonFile = new File(
			scriptFolder.fsName + '/assets/effects_localized.json'
		);
		if (!jsonFile.exists) {
			alert('Missing effects_localized.json');
			return map;
		}

		if (jsonFile.open('r')) {
			try {
				var raw = jsonFile.read();
				map = eval('(' + raw + ')'); // ExtendScript has no native JSON.parse
				jsonFile.close();
			} catch (err) {
				alert('Failed to parse JSON: ' + err.toString());
				jsonFile.close();
			}
		} else {
			alert('Could not open JSON file.');
		}

		return map;
	}

	function escapeRegExp(str) {
		return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	}

	function replaceNamesInExpression(expr, nameMap) {
		// Replace effect names first
		for (var key in nameMap) {
			var matchName = nameMap[key];
			// Replace `"name"` or 'name' with correct matchname
			var doubleQuoted = new RegExp('"' + escapeRegExp(key) + '"', 'g');
			var singleQuoted = new RegExp("'" + escapeRegExp(key) + "'", 'g');
			expr = expr.replace(doubleQuoted, '"' + matchName + '"');
			expr = expr.replace(singleQuoted, '"' + matchName + '"'); // unify to double quotes
		}

		// Now handle Dropdown Menu Control's "Menu" property localization
		var menuPropNameMap = {
			en_US: 'Menu',
			fr_FR: 'Menu',
			ja_JP: 'メニュー',
			// Add other languages if needed
		};
		var lang = app.language;
		var localizedMenu = menuPropNameMap[lang];

		// Replace ("Menu") or ('Menu') with localizedMenu inside parentheses
		var menuPattern = /(\(["'])Menu(['"]\))/g;
		expr = expr.replace(menuPattern, function (match, p1, p2) {
			return p1 + localizedMenu + p2;
		});

		return expr;
	}

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
				$.writeln('✖ Error: ' + e.toString());
			}
		}

		if (prop.numProperties !== undefined) {
			for (var i = 1; i <= prop.numProperties; i++) {
				processProperty(prop.property(i), nameMap);
			}
		}
	}

	function processComp(comp, nameMap) {
		for (var i = 1; i <= comp.numLayers; i++) {
			var layer = comp.layer(i);
			processProperty(layer, nameMap);
		}
	}

	// Run
	app.beginUndoGroup('Smart Expression Translation');

	var nameMap = buildAllEffectNameMap();

	var proj = app.project;
	if (proj && proj.numItems > 0) {
		for (var i = 1; i <= proj.numItems; i++) {
			if (proj.item(i) instanceof CompItem) {
				processComp(proj.item(i), nameMap);
			}
		}
	}

	app.endUndoGroup();
})();
