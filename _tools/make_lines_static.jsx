var rootFolder = File($.fileName).parent;
$.evalFile(new File(rootFolder.fsName + '/utils/comp_utils.jsx'));

function makeLinesStatic() {
	var mySelectedItems = [];
	for (var i = 1; i <= app.project.numItems; i++) {
		if (app.project.item(i).selected) {
			mySelectedItems.push(app.project.item(i));
		}
	}
	if (mySelectedItems.length) {
		for (var j = 0; j < mySelectedItems.length; j++) {
			var currentItem = mySelectedItems[j];
			if (
				currentItem.name.toLowerCase().indexOf('cellfx') !== -1 &&
				currentItem instanceof CompItem
			) {
				app.beginUndoGroup('Make Lines Static');

				if (currentItem && 'preserveNestedFrameRate' in currentItem) {
					currentItem.preserveNestedFrameRate = true;
				}

				for (var k = 1; k <= currentItem.numLayers; k++) {
					var layer = currentItem.layer(k);
					if (layer.name.toLowerCase() == 'control') {
						var speedEffect = layer.effect('Speed');
						if (speedEffect && speedEffect.property('Slider')) {
							speedEffect.property('Slider').setValue(0);
						} else {
							alert(
								'No "Speed" slider found on the Control layer in ' +
									currentItem.name
							);
						}
					}

					if (layer.name.toLowerCase().indexOf('line_noise') !== -1) {
						var animatedNoise = layer.effect("F's AnimatedNoise");
						if (animatedNoise) {
							// Set the property F's AnimatedNoise-0001 (assuming it's a checkbox) to false
							var prop1 = animatedNoise.property("F's AnimatedNoise-0001");
							if (prop1) prop1.setValue(false);

							// Set the property F's AnimatedNoise-0007 (assuming it's a number/slider) to 0
							var prop7 = animatedNoise.property("F's AnimatedNoise-0007");
							if (prop7) prop7.setValue(0);
						} else {
							alert('Effect "F\'s AnimatedNoise" not found on ' + layer.name);
						}
					}
					// Check if the layer is a shape layer
				}

				app.endUndoGroup();
			} else {
				alert(
					'The selected item "' +
						currentItem.name +
						'" is not a CellFX composition. Skipping.'
				);
				continue;
			}
		}
	} else {
		alert('No items selected.');
	}
}

makeLinesStatic();
