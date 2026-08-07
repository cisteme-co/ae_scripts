//@target aftereffects
// Depends on: locale.jsx (getLanguage)

/**
 * Shows a checkbox dialog so the user can choose which queued items to render.
 * Returns the filtered selection, or null if cancelled / nothing selected.
 * @param {Array}        queueInfo  Result of scanRenderQueue
 * @param {RenderQueue}  rq
 * @returns {{ queueInfo: Array, compNames: string[], totalFrames: number } | null}
 */
function showSelectItemsDialog(queueInfo, rq) {
	var lang = getLanguage();
	var S = {
		title: { en: 'Select Items to Render', ja: 'レンダリング項目の選択' },
		msg: {
			en: 'Select the items you want to render in the background:',
			ja: '背景でレンダリングする項目を選択してください：',
		},
		start: { en: 'Start Render', ja: 'レンダー開始' },
		cancel: { en: 'Cancel', ja: 'キャンセル' },
		selectAll: { en: 'Select All', ja: 'すべて選択' },
		selectNone: { en: 'Select None', ja: 'すべて解除' },
	};
	var t = function (key) {
		return S[key][lang] || S[key]['en'];
	};

	var dlg = new Window('dialog', t('title'));
	dlg.orientation = 'column';
	dlg.alignChildren = ['fill', 'top'];
	dlg.spacing = 15;
	dlg.margins = 20;

	dlg.add('statictext', undefined, t('msg'));

	var panel = dlg.add('panel');
	panel.orientation = 'column';
	panel.alignChildren = ['fill', 'top'];
	panel.preferredSize = [400, 250];

	var scrollGroup = panel.add('group');
	scrollGroup.orientation = 'column';
	scrollGroup.alignChildren = ['left', 'top'];
	scrollGroup.spacing = 5;
	scrollGroup.alignment = ['fill', 'fill'];
	scrollGroup.maximumSize.height = 10000;

	var checkboxes = [];
	for (var i = 0; i < queueInfo.length; i++) {
		var cb = scrollGroup.add('checkbox', undefined, queueInfo[i].compName);
		cb.value = true;
		checkboxes.push(cb);
	}

	var selGroup = dlg.add('group');
	selGroup.orientation = 'row';
	selGroup.spacing = 10;
	var allBtn = selGroup.add('button', undefined, t('selectAll'), {
		style: 'toolbutton',
	});
	var noneBtn = selGroup.add('button', undefined, t('selectNone'), {
		style: 'toolbutton',
	});
	allBtn.onClick = function () {
		for (var i = 0; i < checkboxes.length; i++) checkboxes[i].value = true;
	};
	noneBtn.onClick = function () {
		for (var i = 0; i < checkboxes.length; i++) checkboxes[i].value = false;
	};

	var btnGroup = dlg.add('group');
	btnGroup.orientation = 'row';
	btnGroup.alignment = 'right';
	btnGroup.spacing = 10;
	btnGroup.add('button', undefined, t('cancel'), { name: 'cancel' });
	btnGroup.add('button', undefined, t('start'), { name: 'ok' });

	if (dlg.show() !== 1) return null;

	var selQueueInfo = [];
	var selCompNames = [];
	var selTotalFrames = 0;

	for (var i = 0; i < checkboxes.length; i++) {
		if (!checkboxes[i].value) continue;
		var itemData = queueInfo[i];
		selQueueInfo.push(itemData);
		selCompNames.push(itemData.compName);

		var item = rq.item(itemData.index);
		var frameDuration = item.comp.frameDuration;
		var start = item.timeStart;
		var end = item.timeEnd;
		if (end <= start) {
			start = item.comp.workAreaStart;
			end = start + item.comp.workAreaDuration;
		}
		var frames = Math.ceil((end - start) / frameDuration);
		selTotalFrames += frames > 0 ? frames : 1;
	}

	if (selQueueInfo.length === 0) return null;

	$.writeln(
		'User selected ' +
			selQueueInfo.length +
			' items with ' +
			selTotalFrames +
			' total frames',
	);
	return {
		queueInfo: selQueueInfo,
		compNames: selCompNames,
		totalFrames: selTotalFrames,
	};
}
