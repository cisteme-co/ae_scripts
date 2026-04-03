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
	mode,
) {
	// ──────────────
	// Validation
	// ──────────────
	if (!project || project.index === undefined) {
		alert('Invalid project selection.');
		return;
	}
	if (!episode || !episode.text) {
		alert('Invalid episode selection.');
		return;
	}
	if (!cuts || cuts.length === 0) {
		alert('No cuts specified.');
		return;
	}

	// ──────────────
	// Setup paths and variables
	// ──────────────
	var projects = getProjects();
	if (!projects || project.index >= projects.length) {
		alert('Could not find project information.');
		return;
	}
	var projectObj = projects[project.index];
	var projectFolder = projectObj.folder;
	var codeName = getProjectCodeName(projectFolder);
	var projectWorkFolder = projectFolder.fsName;

	// ──────────────
	// Create folder structure for the new cut
	// ──────────────
	var lightingBase =
		projectWorkFolder + '/production/lighting/' + episode.text + '/progress/';
	var cutFolderName = cuts.join('-');
	var finalFolderPath = lightingBase + cutFolderName;

	if (!createFolderRecursive(finalFolderPath)) {
		alert('Failed to create folder: ' + finalFolderPath);
		return;
	}
	var finalFolder = new Folder(finalFolderPath);

	// ──────────────
	// Open template project
	// ──────────────
	var templateFile = templateItem;
	var templateFolder = new Folder(
		projectWorkFolder + '/assets/templates/compositing',
	);

	if (templateFile instanceof ListItem) {
		templateFile = new File(templateFolder.fsName + '/' + templateItem.text);
	} else if (typeof templateFile === 'string') {
		templateFile = new File(templateFolder.fsName + '/' + templateFile);
	}

	if (!templateFile || !templateFile.exists) {
		// Try searching by name if the direct path fails
		var files = templateFolder.getFiles('*.aep');
		var targetName =
			templateItem instanceof ListItem ? templateItem.text : templateItem;
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

	// Use a try-catch for the whole process to avoid silent hangs
	try {
		app.beginUndoGroup('Create Lighting Cut');

		// Close current project if it has a file, otherwise just open
		if (app.project.file) {
			app.project.close(CloseOptions.SAVE_CHANGES);
		}

		var openedFile = app.open(templateFile);
		if (!openedFile) {
			throw new Error('Failed to open template file: ' + templateFile.fsName);
		}

		// ──────────────
		// Set Time Display to Frames
		// ──────────────
		app.project.timeDisplayType = TimeDisplayType.FRAMES;

		// ──────────────
		// Save project with new name
		// ──────────────
		var episodeNum = episode.text;
		var cutFolderName = cuts.join('-');
		var outputFileName =
			codeName + '_' + episodeNum + '_' + cutFolderName + '-3D_t01.aep';
		var outputFile = new File(finalFolder.fsName + '/' + outputFileName);

		if (outputFile.fsName.length > 260) {
			alert('Warning: Path might be too long for After Effects.');
		}

		app.project.save(outputFile);

		// ──────────────
		// Find Required Folders
		// ──────────────
		var sozaiFolder = null;
		var sozai3DFolder = null;
		var compRootFolder = null;
		var renderFolder = null;

		for (var i = 1; i <= app.project.numItems; i++) {
			var item = app.project.item(i);
			if (item instanceof FolderItem) {
				var name = item.name;
				if (name === '01)_sozai') sozaiFolder = item;
				if (name === '02)_Comp') compRootFolder = item;
				if (name === '03)_Render') renderFolder = item;
			}
		}

		if (sozaiFolder) {
			for (var i = 1; i <= sozaiFolder.items.length; i++) {
				var item = sozaiFolder.items[i];
				if (item instanceof FolderItem && item.name === '05_3D') {
					sozai3DFolder = item;
					break;
				}
			}
		}

		if (!compRootFolder || !renderFolder) {
			throw new Error(
				'Could not find required folders (02)_Comp or 03)_Render) in project.',
			);
		}

		// ──────────────
		// Process each cut
		// ──────────────

		// 1. Identify Templates
		var workTemplateComp = null;
		if (sozai3DFolder) {
			for (var i = 1; i <= sozai3DFolder.items.length; i++) {
				var item = sozai3DFolder.items[i];
				if (item instanceof CompItem && item.name.indexOf('_work_000') !== -1) {
					workTemplateComp = item;
					break;
				}
			}
		}

		var compTemplates = [];
		for (var i = 1; i <= compRootFolder.items.length; i++) {
			var item = compRootFolder.items[i];
			if (item instanceof CompItem) {
				compTemplates.push(item);
			}
		}

		var renderTemplateComp = null;
		for (var i = 1; i <= renderFolder.items.length; i++) {
			var item = renderFolder.items[i];
			if (item instanceof CompItem) {
				// Looking for something like <project>_00_000-3D_t01
				if (
					item.name.indexOf('_00_000') !== -1 ||
					item.name.indexOf('000') !== -1
				) {
					renderTemplateComp = item;
					break;
				}
			}
		}

		// Empty Render Queue
		while (app.project.renderQueue.numItems > 0) {
			app.project.renderQueue.item(1).remove();
		}

		// For each cut, duplicate and process
		for (var i = 0; i < cuts.length; i++) {
			var cutNo = cuts[i];
			var cutSec = parseFloat(seconds[i]) || 0;
			var cutFrm = parseFloat(frames[i]) || 0;
			var duration = (cutSec * framerate + cutFrm) / framerate;
			var renderDuration =
				(cutSec * framerate + cutFrm + framerate / 3) / framerate;

			// A. Process _work_000
			var newWorkComp = null;
			if (workTemplateComp) {
				newWorkComp = workTemplateComp.duplicate();
				newWorkComp.name = workTemplateComp.name.replace('000', cutNo);
				newWorkComp.duration = duration;
				retimeCompLayers(newWorkComp, duration);
			}

			// B. Process 02)_Comp
			var cutBin = findOrCreateFolder(cutNo, compRootFolder);
			var newCompsForCut = [];
			var templateToNewMap = {}; // Map template ID to the new duplicated comp

			for (var j = 0; j < compTemplates.length; j++) {
				var template = compTemplates[j];
				var newComp = template.duplicate();
				newComp.name = template.name + '_' + cutNo;
				newComp.parentFolder = cutBin;
				newComp.duration = duration;
				retimeCompLayers(newComp, duration);

				newCompsForCut.push(newComp);
				templateToNewMap[template.id] = newComp;
			}

			// Perform replacements inside the new comps for this cut
			for (var j = 0; j < newCompsForCut.length; j++) {
				var currentComp = newCompsForCut[j];
				for (var k = 1; k <= currentComp.numLayers; k++) {
					var layer = currentComp.layers[k];
					if (layer.source instanceof CompItem) {
						var sourceId = layer.source.id;
						// 1. Replace with new work comp if applicable
						if (newWorkComp && layer.source.name.indexOf('_work_') !== -1) {
							layer.replaceSource(newWorkComp, true);
						}
						// 2. Replace with other cut-specific comps from 02)_Comp
						else if (templateToNewMap[sourceId]) {
							layer.replaceSource(templateToNewMap[sourceId], true);
						}
					}
				}
			}

			// C. Process 03)_Render
			if (renderTemplateComp) {
				var newRenderComp = renderTemplateComp.duplicate();
				// Rename from <project codeName>_00_000-3D_t01 to <project codeName>_<episode>_<cutNumber>-3D_t01
				newRenderComp.name =
					codeName + '_' + episodeNum + '_' + cutNo + '-3D_t01';
				newRenderComp.duration = renderDuration;
				retimeCompLayers(newRenderComp, renderDuration);

				// Replace "20_Finish_3D_<cutNumber>" (actually replacing the one that was 000)
				for (var k = 1; k <= newRenderComp.numLayers; k++) {
					var layer = newRenderComp.layers[k];
					if (layer.source instanceof CompItem) {
						var sourceName = layer.source.name;
						// Find matching comp from newCompsForCut
						for (var m = 0; m < newCompsForCut.length; m++) {
							var potentialMatch = newCompsForCut[m];
							var baseTemplateName = compTemplates[m].name;
							if (sourceName === baseTemplateName) {
								layer.replaceSource(potentialMatch, true);
								break;
							}
						}
					}
				}

				// D. Add to Render Queue
				var rqItem = app.project.renderQueue.items.add(newRenderComp);

				// Render Settings
				var rsTemplates = [
					'Best Settings 23.976 Proxy',
					'Best Setting 23.976 Proxy',
					'best settings 23.976 proxy',
					'bestsettings23.976proxy',
					'BestSetting 23.976 Proxy',
				];
				if (!applyRenderSettings(rqItem, rsTemplates)) {
					try {
						rqItem.applyTemplate('Best Settings');
					} catch (e) {}
				}

				// Output Module
				var omTemplates = [
					'Apple ProRes 422(HQ)',
					'Apple ProRes 422 (HQ)',
					'Apple ProRes 422 HQ',
					'ProRes 422 HQ',
					'ProRes 422 (HQ)',
				];
				applyOutputModule(rqItem, 1, omTemplates);
			}
		}

		// ──────────────
		// Cleanup Templates (optional, but requested to "rethink completely")
		// The user didn't explicitly say to delete templates, but usually they are removed if they were just for duplication.
		// However, I'll keep them for now unless they are in the way.
		// Actually, the original code removed them. Let's see if I should.
		// The user said "replace 000 by the cut number and duplicate if many cuts",
		// which implies if there's only 1 cut, we might just rename. But duplication is safer.

		// Original cleanup logic:
		/*
		for (var j = 0; j < compsToDuplicate.length; j++) {
			try { compsToDuplicate[j].remove(); } catch (e) {}
		}
		*/

		// I'll remove the templates to keep it clean.
		if (workTemplateComp)
			try {
				workTemplateComp.remove();
			} catch (e) {}
		for (var j = 0; j < compTemplates.length; j++) {
			try {
				compTemplates[j].remove();
			} catch (e) {}
		}
		if (renderTemplateComp)
			try {
				renderTemplateComp.remove();
			} catch (e) {}

		app.project.save();
		app.endUndoGroup();

		Alerts && Alerts.alertCutCreated
			? Alerts.alertCutCreated(cutFolderName)
			: alert('Lighting cut "' + cutFolderName + '" created!');
	} catch (err) {
		app.endUndoGroup();
		alert(
			'Error creating lighting cut:\n' +
				err.toString() +
				(err.line ? '\nLine: ' + err.line : ''),
		);
	}
}

var __createLightingCutTemplateWarnings = { rs: false, om: false };

function __normalizeTemplateName(name) {
	return String(name)
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '');
}

function __findTemplateMatch(availableTemplates, desiredTemplates) {
	if (!availableTemplates || !availableTemplates.length) return null;
	var map = {};
	for (var i = 0; i < availableTemplates.length; i++) {
		var t = String(availableTemplates[i]); // ensure plain string, not object
		map[__normalizeTemplateName(t)] = t;
	}
	for (var j = 0; j < desiredTemplates.length; j++) {
		var desired = desiredTemplates[j];
		if (map.hasOwnProperty(__normalizeTemplateName(desired))) {
			return map[__normalizeTemplateName(desired)];
		}
	}
	return null;
}

function applyRenderSettings(rqItem, templates) {
	// Note: rqItem.templates is not a valid AE API — render settings template names
	// cannot be listed via ExtendScript, so we try each name directly.
	var errors = [];
	for (var i = 0; i < templates.length; i++) {
		try {
			rqItem.applyTemplate(templates[i]);
			return true;
		} catch (e) {
			errors.push('"' + templates[i] + '": ' + e.toString());
		}
	}

	if (!__createLightingCutTemplateWarnings.rs) {
		__createLightingCutTemplateWarnings.rs = true;
		var msg =
			'Could not apply any Render Settings template.\n\nTried (with errors):\n' +
			errors.join('\n');
		alert(msg);
	}

	return false;
}

function applyOutputModule(rqItem, index, templates) {
	var om = rqItem.outputModule(index);
	var available = null;
	try {
		available = om.templates;
	} catch (e) {}

	var match = __findTemplateMatch(available, templates);
	if (match) {
		try {
			om.applyTemplate(match);
			return true;
		} catch (e) {
			// Found in available list but applyTemplate still failed — surface the real error
			if (!__createLightingCutTemplateWarnings.om) {
				__createLightingCutTemplateWarnings.om = true;
				var msg =
					'Output Module: found template "' +
					match +
					'" but could not apply it.';
				msg += '\nError: ' + e.toString();
				if (available && available.length) {
					msg += '\n\nAll available templates:\n' + available.join('\n');
				}
				alert(msg);
			}
			return false;
		}
	}

	var errors = [];
	for (var i = 0; i < templates.length; i++) {
		try {
			om.applyTemplate(templates[i]);
			return true;
		} catch (e) {
			errors.push('"' + templates[i] + '": ' + e.toString());
		}
	}

	if (!__createLightingCutTemplateWarnings.om) {
		__createLightingCutTemplateWarnings.om = true;
		var msg =
			'Could not apply any Output Module template.\n\nTried (with errors):\n' +
			errors.join('\n');
		if (available && available.length) {
			msg += '\n\nAvailable:\n' + available.join('\n');
		}
		alert(msg);
	}

	return false;
}
