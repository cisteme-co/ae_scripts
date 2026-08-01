function retake(newText) {
	app.beginUndoGroup('Retake Text Replace');

	try {
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

		for (var i = 1; i <= outputFolder.numItems; i++) {
			var item = outputFolder.item(i);

			if (item instanceof CompItem) {
				var comp = item;

				try {
					// Find layer named "Retakes"
					var retakesLayer = comp.layer('Retakes');
					if (retakesLayer && retakesLayer instanceof TextLayer) {
						var textProp = retakesLayer.property('Source Text');
						if (textProp) {
							var textDoc = textProp.value;
							textDoc.text = newText;
							textProp.setValue(textDoc);
						}
					}

					// Find layer called "Bold" (needed below either way, to
					// clean up its effects or to position the new layer).
					var boldLayer = comp.layer('Bold');

					// If a "Retake" layer already exists (from a previous
					// run of this function), just update its text instead
					// of creating another one on top of it.
					var existingRetakeLayer = comp.layer('Retake');
					if (existingRetakeLayer && existingRetakeLayer instanceof TextLayer) {
						var existingTextProp = existingRetakeLayer.text.sourceText;
						var existingTextDoc = existingTextProp.value;
						existingTextDoc.text = newText;
						existingTextProp.setValue(existingTextDoc);
					} else if (boldLayer) {
						// No "Retake" layer yet — remove the Bold layer's
						// Path Text effects and create it fresh.
						// "Retake Memo" / "Memo" are just this project's
						// renamed display names for those effect instances
						// — display names are user-editable and localized,
						// so they're not reliable to search by. The
						// matchName ('ADBE Path Text', the classic/obsolete
						// Path Text effect) is invariant across renames and
						// languages, so we identify effects by that instead.
						var effectsGroup = boldLayer.property('ADBE Effect Parade');
						if (effectsGroup) {
							// Walk backwards so removing a property doesn't
							// shift the index of ones we haven't checked yet.
							// PropertyBase.remove() is documented as removing
							// the property from its own parent group, so we
							// call it directly on the effect we found rather
							// than going back through the parent group.
							for (var p = effectsGroup.numProperties; p >= 1; p--) {
								var effectProp = effectsGroup.property(p);
								if (effectProp.matchName === 'ADBE Path Text') {
									effectProp.remove();
								}
							}
						}

						var newTextLayer = comp.layers.addText(newText);
						newTextLayer.name = 'Retake';
						newTextLayer.moveBefore(boldLayer);

						// Trim the layer's duration to frameRate/3 frames
						// (e.g. 8 frames at 24fps), rounded to the nearest whole
						// frame so it lands cleanly at any frame rate — same
						// logic as the worker text layer.
						var frameDuration = Math.round(comp.frameRate / 3);
						newTextLayer.outPoint =
							newTextLayer.inPoint + frameDuration / comp.frameRate;

						// Text should be aligned left, font size 34, and positioned at [168, 774].
						// Same rule as elsewhere: text, fontSize, and justification
						// all live on the TextDocument (sourceText.value), not on
						// the layer's .text PropertyGroup directly — setting them
						// there silently no-ops. Position is a transform property,
						// so it's set separately via .transform.position.
						var newTextProp = newTextLayer.text.sourceText;
						var newTextDoc = newTextProp.value;
						newTextDoc.text = newText;
						newTextDoc.fontSize = 34;
						newTextDoc.justification = ParagraphJustification.LEFT_JUSTIFY;
						newTextProp.setValue(newTextDoc);

						newTextLayer.transform.position.setValue([168, 774]);
					}
				} catch (compErr) {
					alert('Skipped comp "' + comp.name + '": ' + compErr.toString());
				}
			}
		}
	} finally {
		app.endUndoGroup();
	}
}
