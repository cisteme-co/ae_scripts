// ────────────────────────────────────────────────
// Create Lighting Cut from Template
// ────────────────────────────────────────────────
function createLightingCut(
	project,
	episode,
	cuts,
	framerate,
	templateItem,
	takesCodes,
	seconds,
	frames,
	workerInput,
	mode
) {
	// ──────────────
	// Setup paths and variables
	// ──────────────
	var projectObj = getProjects()[project.index];
	var projectFolder = projectObj.folder;
	var codeName = getProjectCodeName(projectFolder);
	var projectWorkFolder = projectFolder.path + '/' + projectFolder.name;
	var lightingBase = projectWorkFolder + '/production/lighting/' + episode.text + '/progress/';
	
	var cutFolderName = cuts.join('-');
	var finalFolder = new Folder(lightingBase + cutFolderName);
	if (!finalFolder.exists) {
		if (!finalFolder.create()) {
			alert('Failed to create folder: ' + finalFolder.fsName);
			return;
		}
	}

	// ──────────────
	// Open template project
	// ──────────────
	var templateFile = templateItem;
	var templateFolder = new Folder(projectWorkFolder + '/assets/templates/compositing');
	
	if (templateFile instanceof ListItem) {
		templateFile = new File(templateFolder.fsName + '/' + templateItem.text);
	} else if (typeof templateFile === 'string') {
		templateFile = new File(templateFolder.fsName + '/' + templateFile);
	}

	if (!templateFile || !templateFile.exists) {
		// Try searching by name if the direct path fails
		var files = templateFolder.getFiles('*.aep');
		var targetName = templateItem instanceof ListItem ? templateItem.text : templateItem;
		for (var i = 0; i < files.length; i++) {
			if (decodeURI(files[i].name) === decodeURI(targetName)) {
				templateFile = files[i];
				break;
			}
		}
	}

	if (!templateFile.exists) {
		alert('Template file not found: ' + templateFile.fsName);
		return;
	}

	app.project.close(CloseOptions.PROMPT_TO_SAVE_CHANGES);
	var openedFile = app.open(templateFile);
	if (!openedFile) {
		alert('Failed to open template file: ' + templateFile.fsName);
		return;
	}

	// ──────────────
	// Set Time Display to Frames
	// ──────────────
	app.project.timeDisplayType = TimeDisplayType.FRAMES;

	// ──────────────
	// Save project with new name
	// ──────────────
	// ws_00_000-3D_t01.aep -> ws_03_001-003-3D_t01.aep
	var episodeNum = episode.text;
	var outputFileName = templateFile.name
		.replace(/^[^\s_]+(?=_\d{2}_\d{3})/, codeName) // Match start of string up to first underscore
		.replace(/00(?=(_|-))/, episodeNum)
		.replace(/000(?=(_|-|$))/, cutFolderName);
	var outputFile = new File(finalFolder.fsName + '/' + outputFileName);
	
	// Check if file path is valid for AE
	if (outputFile.fsName.length > 260) {
		alert("Path too long for After Effects: " + outputFile.fsName.length + " chars");
	}

	try {
		app.project.save(outputFile);
	} catch (e) {
		alert("Error saving project at: " + outputFile.fsName + "\n\n" + e.toString());
		return;
	}

	// ──────────────
	// Find Render and Comp folders
	// ──────────────
	var renderFolder = null;
	var compRootFolder = null;
	
	// Better folder detection: Look for folders with specific names or prefixes
	for (var i = 1; i <= app.project.numItems; i++) {
		var item = app.project.item(i);
		if (item instanceof FolderItem) {
			var name = item.name;
			var lowerName = name.toLowerCase();
			
			// Priority 1: Exact matches for common patterns
			if (name === "03)_Render" || name === "03_Render" || name === "Render") {
				renderFolder = item;
			} else if (!renderFolder && (lowerName.indexOf('render') !== -1 || lowerName.indexOf('output') !== -1)) {
				// Priority 2: Contains "render" but isn't already set
				renderFolder = item;
			}

			if (name === "02)_Comp" || name === "02_Comp" || name === "Comp") {
				compRootFolder = item;
			} else if (!compRootFolder && lowerName.indexOf('comp') !== -1 && lowerName.indexOf('render') === -1) {
				// Priority 2: Contains "comp" but isn't "render"
				compRootFolder = item;
			}
		}
	}

	if (!renderFolder || !compRootFolder) {
		alert('Could not find Render or Comp folder in project.\nRender: ' + (renderFolder ? 'Found' : 'Not Found') + '\nComp: ' + (compRootFolder ? 'Found' : 'Not Found'));
		return;
	}

	// ──────────────
	// Process each cut
	// ──────────────
	var mainRenderCompTemplate = null;
	for (var j = 1; j <= renderFolder.items.length; j++) {
		var item = renderFolder.items[j];
		if (item instanceof CompItem) {
			// Prefer comps that match the template name pattern
			if (item.name.indexOf('000') !== -1 || item.name.indexOf(codeName + '_') !== -1 || item.name.indexOf('ws_') !== -1) {
				mainRenderCompTemplate = item;
				break;
			}
		}
	}
	
	// Fallback to first comp in render folder if no pattern match
	if (!mainRenderCompTemplate) {
		for (var j = 1; j <= renderFolder.items.length; j++) {
			if (renderFolder.items[j] instanceof CompItem) {
				mainRenderCompTemplate = renderFolder.items[j];
				break;
			}
		}
	}

	if (!mainRenderCompTemplate) {
		alert('Could not find a main render composition in ' + renderFolder.name);
		return;
	}

	// Identify comps in Comp folder to duplicate
	var compsToDuplicate = [];
	for (var j = 1; j <= compRootFolder.items.length; j++) {
		var item = compRootFolder.items[j];
		if (item instanceof CompItem) {
			// Include template comps (usually ending in _000)
			// Only skip if they look like they belong to a DIFFERENT cut already (not 000)
			var isDifferentCut = item.name.match(/_(?!000)\d{3}$/);
			if (!isDifferentCut) {
				compsToDuplicate.push(item);
			}
		}
	}
	
	if (compsToDuplicate.length === 0) {
		alert("No compositions found in " + compRootFolder.name + " to duplicate!");
		return;
	}

	try {
		// ────────────────────────────────────────────────
		// Empty Render Queue
		// ────────────────────────────────────────────────
		while (app.project.renderQueue.numItems > 0) {
			app.project.renderQueue.item(1).remove();
		}

		for (var i = 0; i < cuts.length; i++) {
			var cutNo = cuts[i];
			var cutSec = parseFloat(seconds[i]) || 0;
			var cutFrm = parseFloat(frames[i]) || 0;
			var duration = (cutSec * framerate + cutFrm) / framerate;
			var renderDuration = ((cutSec * framerate + cutFrm) + (framerate / 3)) / framerate;

			// 1. Create cut folder inside Comp folder
			var cutCompFolder = findOrCreateFolder(cutNo, compRootFolder);

			// 2. Duplicate comps for this cut
			var duplicatedComps = [];
			for (var j = 0; j < compsToDuplicate.length; j++) {
				var originalComp = compsToDuplicate[j];
				var newComp = originalComp.duplicate();
				
				// Handle naming: ensure _work or _work_000 becomes _work_001
				var newName = originalComp.name.replace(/_000$/, "");
				if (newName === "_work") {
					newComp.name = "_work_" + cutNo;
				} else {
					newComp.name = newName + "_" + cutNo;
				}
				
				newComp.parentFolder = cutCompFolder;
				newComp.duration = duration;
				duplicatedComps.push(newComp);
			}

			// 3. Handle Render comp
			var newRenderComp;
			if (cuts.length === 1) {
				newRenderComp = mainRenderCompTemplate;
			} else {
				newRenderComp = mainRenderCompTemplate.duplicate();
			}
			
			newRenderComp.name = mainRenderCompTemplate.name
				.replace(/^[^\s_]+(?=_\d{2}_\d{3})/, codeName)
				.replace(/00(?=(_|-))/, episodeNum)
				.replace(/000(?=(_|-|$))/, cutNo);
			
			newRenderComp.duration = renderDuration;
			newRenderComp.parentFolder = renderFolder;

			// 4. Recursive replacement in ALL new comps for this cut
			// First in the render comp
			replaceNestedCompsWithSuffix(newRenderComp, cutNo, cutCompFolder);
			// Then in all other duplicated comps (like _work_001)
			for (var k = 0; k < duplicatedComps.length; k++) {
				replaceNestedCompsWithSuffix(duplicatedComps[k], cutNo, cutCompFolder);
			}

			// 5. Add to Render Queue and set templates
			var rqItem = app.project.renderQueue.items.add(newRenderComp);
			
			// Set Render Settings
			var rsTemplates = [
				"Best Settings 23.976 proxy",
				"Best Setting 23.976 proxy",
				"BestSetting 23.976 proxy",
				"Best Settings 23.976 Proxy",
				"Best Setting 23.976 Proxy",
				"BestSetting 23.976 Proxy"
			];
			var rsApplied = false;
			var rsErrors = [];
			for (var r = 0; r < rsTemplates.length; r++) {
				try {
					rqItem.applyTemplate(rsTemplates[r]);
					rsApplied = true;
					break;
				} catch (e) {
					rsErrors.push(rsTemplates[r]);
					continue;
				}
			}
			if (!rsApplied) {
				alert("Could not apply Render Settings template.\nTried:\n- " + rsErrors.join("\n- "));
			}

			// Set Output Module
			var omTemplates = [
				"Apple ProRes 422(HQ)",
				"Apple ProRes 422 (HQ)",
				"AppleProRes 422 HQ"
			];
			var omApplied = false;
			for (var t = 0; t < omTemplates.length; t++) {
				try {
					rqItem.outputModule(1).applyTemplate(omTemplates[t]);
					omApplied = true;
					break;
				} catch (e) {
					continue;
				}
			}
		}
		
	} catch (err) {
		alert("Error during processing:\n" + err.toString() + "\nLine: " + err.line);
	}

	// Clean up original comps in root Comp folder if we have many cuts or if they were duplicated
	for (var j = 0; j < compsToDuplicate.length; j++) {
		try {
			compsToDuplicate[j].remove();
		} catch (e) {
			// Ignore
		}
	}

	// If we duplicated the render comp (multi-cut), remove the template one
	// But only if it's the generic template name (has 000 in it)
	if (cuts.length > 1 && mainRenderCompTemplate.name.indexOf('000') !== -1) {
		try {
			mainRenderCompTemplate.remove();
		} catch (e) {
			// Ignore
		}
	}

	app.project.save();

	// ──────────────
	// Success alert
	// ──────────────
	Alerts && Alerts.alertCutCreated
		? Alerts.alertCutCreated(cutFolderName)
		: alert('Lighting cut "' + cutFolderName + '" created!');
}

/**
 * Recursively replaces nested compositions with their counterparts that have the specified suffix,
 * specifically looking inside the provided cut-specific folder.
 * @param {CompItem} parentComp - The composition to search in.
 * @param {string} suffix - The suffix to look for (e.g., "001").
 * @param {FolderItem} cutFolder - The folder where the new suffixed comps are located.
 */
function replaceNestedCompsWithSuffix(parentComp, suffix, cutFolder) {
	for (var i = 1; i <= parentComp.numLayers; i++) {
		var layer = parentComp.layers[i];
		if (layer.source instanceof CompItem) {
			var currentSource = layer.source;
			
			// 1. Determine base name without any cut suffix
			var baseName = currentSource.name;
			var targetName = baseName;
			
			// If it ends with _000 or similar, remove it
			if (baseName.match(/_\d{3}$/)) {
				targetName = baseName.replace(/_\d{3}$/, '_' + suffix);
			} else {
				targetName = baseName + '_' + suffix;
			}
			
			// 2. Try to find the matching comp in the cutFolder
			var matchingComp = null;
			for (var j = 1; j <= cutFolder.items.length; j++) {
				var item = cutFolder.items[j];
				if (item instanceof CompItem && item.name === targetName) {
					matchingComp = item;
					break;
				}
			}
			
			if (matchingComp) {
				if (currentSource !== matchingComp) {
					layer.replaceSource(matchingComp, true);
					// Recursively check inside the replaced comp
					replaceNestedCompsWithSuffix(matchingComp, suffix, cutFolder);
				}
			} else {
				// Even if already correct suffix or not found in folder, check inside it recursively
				replaceNestedCompsWithSuffix(currentSource, suffix, cutFolder);
			}
		}
	}
}
