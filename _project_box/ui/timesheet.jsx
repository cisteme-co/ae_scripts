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
				emptyTypeOptions: ['Dissolve', 'Opacity'],
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
				emptyTypeOptions: ['ディゾルブ', '不透明度'],
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
			thisObj instanceof Panel ? thisObj : new Window('palette', L.winTitle);

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
		var cellInfoBtn = panelGroup.add('button', undefined, L.cellInfoBtn);
		var saveArdjBtn = panelGroup.add('button', undefined, L.saveArdjBtn);
		var saveCompBtn = panelGroup.add('button', undefined, L.saveCompBtn);
		var fromCompBtn = panelGroup.add('button', undefined, L.fromCompBtn);
		var clearBtn = panelGroup.add('button', undefined, L.clearBtn);
		var centerBtn = panelGroup.add('button', undefined, L.centerBtn);
		var getCellBtn = panelGroup.add('button', undefined, L.getCellBtn);

		var emptyType = panelGroup.add(
			'dropdownlist',
			undefined,
			L.emptyTypeOptions
		);
		emptyType.selection = 0;

		var inOutPoint = panelGroup.add('checkbox', undefined, L.inOutPoint);
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

		// Panel for additional UI elements (Cells)
		var cellPanel = scndPanelGroup.add('panel', undefined, L.cellPanel);
		cellPanel.alignment = ['fill', 'fill'];
		cellPanel.minimumSize = [200, 200];

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

		// Show window or layout panel accordingly
		if (win instanceof Window) {
			win.center();
			win.show();
			enforceSize();
		} else {
			win.layout.layout(true);
			win.layout.resize();
			enforceSize();
		}
	}
})(this);
