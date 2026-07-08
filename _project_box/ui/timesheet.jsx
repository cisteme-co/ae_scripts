(function (thisObj) {
	// ───────────────────────────────
	// Build UI for Retimer Preferences with AE language detection
	// ───────────────────────────────
	buildUI(thisObj);

	function buildUI(thisObj) {
		// Detect AE language (example values: "en_US", "ja_JP", "fr_FR", "de_DE", etc.)
		var aeLang = app.language || 'en_US';

		// Simple dictionary for labels per language
		// Add more languages as needed
		var labels = {
			en_US: {
				winTitle: 'Timesheet',
				execAERemapBtn: 'Launch AE Remap',
				cellInfoBtn: 'Cell Info',
				saveArdjBtn: 'Save Ardj',
				saveCompBtn: 'Save Comp',
				fromCompBtn: 'From Comp',
				clearBtn: 'Clear',
				centerBtn: 'Center',
				getCellBtn: 'Get Cell',
				emptyTypeOptions: ['Dissolve', 'Use Last Frame', 'Opacity'],
				inOutPoint: 'In/Out Point',
				applyBtn: 'Apply',
				cellPanel: 'Cells',
			},
			ja_JP: {
				winTitle: 'タイムシート',
				execAERemapBtn: 'AEリマップ起動',
				cellInfoBtn: 'セル情報',
				saveArdjBtn: 'Ardj保存',
				saveCompBtn: 'コンプ保存',
				fromCompBtn: 'コンプから',
				clearBtn: 'クリア',
				centerBtn: '中央配置',
				getCellBtn: 'セル取得',
				emptyTypeOptions: ['ディゾルブ', 'リマップ最大値', '不透明度'],
				inOutPoint: 'イン／アウトポイント',
				applyBtn: '適用',
				cellPanel: 'セル',
			},
			// Add more languages here if needed
		};

		// Fallback to English if language not in dictionary
		var L = labels[aeLang] || labels['en_US'];

		// ───────────────────────────────
		// Create palette window or panel
		// ───────────────────────────────
		var win =
			thisObj instanceof Panel
				? thisObj
				: new Window('palette', L.winTitle, undefined, { resizeable: true });

		win.orientation = 'column';
		win.alignChildren = 'top';

		// ───────────────────────────────
		// Main container: horizontal split
		// ───────────────────────────────
		var items = win.add('group');
		items.orientation = 'row';
		items.alignChildren = ['fill', 'fill'];
		items.alignment = ['fill', 'fill'];
		items.spacing = 10;

		// ───────────────────────────────
		// Left column: controls/buttons
		// ───────────────────────────────
		var panelGroup = items.add('group');
		panelGroup.orientation = 'column';
		panelGroup.alignChildren = ['fill', 'top'];
		panelGroup.spacing = 10;
		panelGroup.alignment = ['fill', 'fill'];

		var execAERemapBtn = panelGroup.add('button', undefined, L.execAERemapBtn);
		execAERemapBtn.alignment = ['fill', 'top'];

		var cellInfoBtn = panelGroup.add('button', undefined, L.cellInfoBtn);
		cellInfoBtn.alignment = ['fill', 'top'];

		var saveArdjBtn = panelGroup.add('button', undefined, L.saveArdjBtn);
		saveArdjBtn.alignment = ['fill', 'top'];

		var saveCompBtn = panelGroup.add('button', undefined, L.saveCompBtn);
		saveCompBtn.alignment = ['fill', 'top'];

		var fromCompBtn = panelGroup.add('button', undefined, L.fromCompBtn);
		fromCompBtn.alignment = ['fill', 'top'];

		var clearBtn = panelGroup.add('button', undefined, L.clearBtn);
		clearBtn.alignment = ['fill', 'top'];

		var centerBtn = panelGroup.add('button', undefined, L.centerBtn);
		centerBtn.alignment = ['fill', 'top'];

		var getCellBtn = panelGroup.add('button', undefined, L.getCellBtn);
		getCellBtn.alignment = ['fill', 'top'];

		var emptyType = panelGroup.add(
			'dropdownlist',
			undefined,
			L.emptyTypeOptions,
		);
		emptyType.alignment = ['fill', 'top'];
		emptyType.selection = 0;

		var inOutPoint = panelGroup.add('checkbox', undefined, L.inOutPoint);
		inOutPoint.alignment = ['fill', 'top'];
		inOutPoint.value = true;

		// ───────────────────────────────
		// Right column: output & action
		// ───────────────────────────────
		var scndPanelGroup = items.add('group');
		scndPanelGroup.orientation = 'column';
		scndPanelGroup.alignChildren = ['fill', 'fill'];
		scndPanelGroup.spacing = 10;
		scndPanelGroup.alignment = ['fill', 'fill'];

		// Readonly info display
		var editInfo = scndPanelGroup.add('edittext', undefined, '', {
			readonly: true,
		});
		editInfo.alignment = ['fill', 'top'];
		editInfo.minimumSize.height = 26;

		// Apply button wrapper with fixed height
		var applyBtnGroup = scndPanelGroup.add('group');
		applyBtnGroup.orientation = 'row';
		applyBtnGroup.alignment = ['fill', 'top'];
		applyBtnGroup.minimumSize.height = 30;
		applyBtnGroup.maximumSize.height = 30;

		var applyBtn = applyBtnGroup.add('button', undefined, L.applyBtn);
		applyBtn.alignment = ['fill', 'fill'];
		applyBtn.minimumSize = [0, 30];
		applyBtn.maximumSize = [10000, 30];

		// Panel for additional UI elements (Cells)
		var cellPanel = scndPanelGroup.add('panel', undefined, L.cellPanel);
		cellPanel.alignment = ['fill', 'fill'];
		cellPanel.minimumSize = [200, 200];
		cellPanel.preferredSize = [300, 300]; // starting size

		// ───────────────────────────────
		// Event handlers
		// ───────────────────────────────
		execAERemapBtn.onClick = function () {
			execAEReamp();
		};
		cellInfoBtn.onClick = function () {
			getCellInfo(editInfo, applyBtn, cellPanel);
		};
		saveArdjBtn.onClick = function () {
			exportArdj();
		};
		saveCompBtn.onClick = function () {
			saveComp();
		};
		fromCompBtn.onClick = function () {
			fromComp(applyBtn, cellPanel);
		};
		clearBtn.onClick = function () {
			clearAll(editInfo);
		};
		centerBtn.onClick = function () {
			centerAERemap();
		};
		getCellBtn.onClick = function () {
			getCellLayer();
		};
		applyBtn.onClick = function () {
			applyCells(inOutPoint.value, emptyType.selection.index);
		};

		// ───────────────────────────────
		// Enforce Apply button height
		// ───────────────────────────────
		function enforceSize() {
			applyBtn.minimumSize = [0, 30];
			applyBtn.preferredSize = [applyBtn.preferredSize[0], 30];
		}

		// ───────────────────────────────
		// Resize handling — applies to BOTH a floating Window
		// and a dockable Panel.
		//
		// AE-specific gotcha: for a DOCKED panel, calling
		// layout.resize()/layout(true) synchronously inside
		// onResizing/onResize doesn't reliably apply — AE's dock
		// host fires these events before it has finished updating
		// the panel's real bounds, so the call runs against stale
		// dimensions. Symptoms: children appear to snap/center
		// incorrectly, and the panel resists resizing past a
		// certain point. The standard fix is to defer the actual
		// resize call via app.scheduleTask instead of running it
		// inline, and debounce so drag events don't pile up tasks.
		// ───────────────────────────────

		win.minimumSize = [0, 0];

		var __resizeTaskId = null;

		// Must live on $.global — app.scheduleTask evaluates its
		// string argument in the global ExtendScript engine scope,
		// not inside this closure.
		$.global.__timesheetDoResize = function () {
			try {
				enforceSize();
				win.layout.resize();
			} catch (e) {}
		};

		function scheduleResize() {
			if (__resizeTaskId !== null) {
				try {
					app.cancelTask(__resizeTaskId);
				} catch (e) {}
			}
			__resizeTaskId = app.scheduleTask(
				'$.global.__timesheetDoResize()',
				50,
				false,
			);
		}

		win.onResizing = scheduleResize;
		win.onResize = scheduleResize;

		// Initial layout pass
		win.layout.layout(true);
		win.layout.resize();

		if (win instanceof Window) {
			win.center();
			win.show();
		}
	}
})(this);
