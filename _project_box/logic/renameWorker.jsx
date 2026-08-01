// ──────────────
// Rename all 'worker' text layers in Comps inside output folder
// ──────────────

function renameWorker(workerName) {
	var outputFolders = ['output', '03)_Render'];
	var outputFolder = null;
	var sawNestedMatch = false; // true if a name matched but wasn't at root level

	for (var i = 0; i < outputFolders.length; i++) {
		var folderName = outputFolders[i];
		var folder = null;

		for (var e = 1; e <= app.project.numItems; e++) {
			var item = app.project.item(e);
			if (item.name === folderName && item instanceof FolderItem) {
				// Only accept it here if it's at root level. A nested match
				// with this name shouldn't stop us from trying the next
				// candidate name in the list.
				if (item.parentFolder === app.project.rootFolder) {
					folder = item;
					break;
				} else {
					sawNestedMatch = true;
				}
			}
		}

		if (folder) {
			outputFolder = folder;
			break;
		}
	}

	// Bail out early if no root-level output folder was found — check this
	// BEFORE touching outputFolder.name anywhere.
	if (!outputFolder) {
		if (sawNestedMatch) {
			alert(
				"Found an 'output'-named folder, but it's nested inside another folder — skipping it. No root-level output folder found.",
			);
		} else {
			Alerts.alertOutputFolderMissing();
		}
		return;
	}

	app.beginUndoGroup('Rename worker text layers');

	try {
		for (var i = 1; i <= app.project.numItems; i++) {
			var item = app.project.item(i);

			// Only process comps inside the output folder
			if (item instanceof CompItem && item.parentFolder === outputFolder) {
				// Iterate backwards: we add/remove layers inside this loop,
				// and removing a layer shifts every later index down by one.
				// Going front-to-back would cause the layer that shifts into
				// the removed slot to get skipped.
				for (var l = item.numLayers; l >= 1; l--) {
					var layer = item.layer(l);

					// Rename text layers named 'worker'
					if (layer.name === 'worker' && layer instanceof TextLayer) {
						layer.text.sourceText.setValue(workerName);
					}

					// In the case we have the name folder from Cyan
					if (layer.name === 'Name') {
						// Create a text layer on top of it, aligned right, with the worker name
						var newTextLayer = item.layers.addText(workerName);
						newTextLayer.name = 'worker';
						newTextLayer.moveBefore(layer);

						// Trim the layer's duration to frameRate/3 frames
						// (e.g. 8 frames at 24fps), rounded to the nearest
						// whole frame so it lands cleanly at any frame rate
						// — frameRate/3 isn't always a whole number (e.g.
						// 25fps gives 8.33).
						var frameDuration = Math.round(item.frameRate / 3);
						newTextLayer.outPoint =
							newTextLayer.inPoint + frameDuration / item.frameRate;

						// Set the font to Meiryo. Prefer TextDocument.fontFamily
						// (AE 2020/17.0+) since it takes a family name
						// directly and handles localized names like メイリオ
						// without needing a PostScript lookup. Fall back to
						// the older .font (PostScript name) property for
						// older AE versions — Meiryo Regular's PostScript
						// name happens to just be "Meiryo". We pull the
						// TextDocument, edit it in place, then push it back
						// with setValue so the text and font land in one
						// undoable edit.
						//
						// Neither font property reliably throws on an
						// unrecognized value, so we verify by reading the
						// property back after assigning it rather than
						// trusting try/catch alone.
						var textProp = newTextLayer.text.sourceText;
						var textDocument = textProp.value;
						textDocument.text = workerName;
						textDocument.fontSize = 48;
						textDocument.justification = ParagraphJustification.RIGHT_JUSTIFY;

						var meiryoNames = ['Meiryo', 'メイリオ'];
						var meiryoApplied = false;

						for (var mf = 0; mf < meiryoNames.length && !meiryoApplied; mf++) {
							try {
								textDocument.fontFamily = meiryoNames[mf];
								if (textDocument.fontFamily === meiryoNames[mf]) {
									meiryoApplied = true;
								}
							} catch (fontFamilyErr) {
								// fontFamily property not supported on this
								// AE version — fall through to .font below.
							}
						}

						if (!meiryoApplied) {
							for (
								var mn = 0;
								mn < meiryoNames.length && !meiryoApplied;
								mn++
							) {
								try {
									textDocument.font = meiryoNames[mn];
									if (
										textDocument.font === meiryoNames[mn] ||
										/meiryo/i.test(textDocument.font)
									) {
										meiryoApplied = true;
									}
								} catch (fontErr) {
									// Not a valid PostScript name — try the next one.
								}
							}
						}

						if (!meiryoApplied) {
							alert(
								"Couldn't find Meiryo font on this system — leaving default font.",
							);
						}

						textProp.setValue(textDocument);

						newTextLayer.position.setValue([
							layer.position.value[0] + 100,
							layer.position.value[1] + 10,
						]);

						// Delete the name layer
						layer.remove();
					}
				}
			}
		}
	} finally {
		app.endUndoGroup();
	}
}
