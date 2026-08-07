//@target aftereffects

/**
 * Walks the render queue and returns a snapshot of all QUEUED items.
 * Returns null (and alerts) when the queue is empty.
 * @param {RenderQueue} rq
 * @returns {{ queueInfo: Array, compNames: string[], totalFrames: number } | null}
 */
function scanRenderQueue(rq) {
	var queueInfo = [];
	var compNames = [];
	var totalFrames = 0;

	for (var i = 1; i <= rq.numItems; i++) {
		try {
			var item = rq.item(i);
			if (item.status !== RQItemStatus.QUEUED) continue;

			var frameDuration = item.comp.frameDuration;
			var start = item.timeStart;
			var end = item.timeEnd;
			if (end <= start) {
				start = item.comp.workAreaStart;
				end = start + item.comp.workAreaDuration;
			}
			var itemFrames = Math.ceil((end - start) / frameDuration);
			if (itemFrames <= 0) itemFrames = 1;
			totalFrames += itemFrames;

			var itemData = { index: i, compName: item.comp.name, outputs: [] };
			compNames.push(item.comp.name);

			for (var j = 1; j <= item.numOutputModules; j++) {
				try {
					var om = item.outputModule(j);
					itemData.outputs.push({
						omIndex: j,
						hasFile: om.file != null,
						tempPath: null,
						finalPath: null,
					});
				} catch (omErr) {
					$.writeln('Error reading output module: ' + omErr.toString());
				}
			}

			queueInfo.push(itemData);
		} catch (itemErr) {
			$.writeln('Error reading queue item: ' + itemErr.toString());
		}
	}

	if (queueInfo.length === 0) return null;
	return {
		queueInfo: queueInfo,
		compNames: compNames,
		totalFrames: totalFrames,
	};
}
