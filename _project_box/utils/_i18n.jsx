var L = {
	newCut: {
		label: { en: 'New Cut', ja: '新しいカット' },
		tip: { en: 'Create a new cut', ja: '新しいカットを作成' },
	},
	lastVersion: {
		label: { en: 'Open Last Version', ja: '最新バージョンを開く' },
		tip: { en: 'Open latest version', ja: '最新バージョンを開く' },
	},
	importCells: {
		label: { en: 'Import Cells', ja: 'セル画像を読み込み' },
		tip: { en: 'Import Cells', ja: 'セル画像を読み込み' },
	},
	importBG: {
		label: { en: 'Import Background', ja: '背景画像を読み込み' },
		tip: { en: 'Import Background', ja: '背景画像を読み込み' },
	},
	timesheet: {
		label: { en: 'Timesheet', ja: 'タイムシート' },
		tip: { en: 'Open timesheet assistant', ja: 'タイムシート補助を開く' },
	},
	retimer: {
		label: { en: 'Retimer Panel', ja: 'リタイマーパネル' },
		tip: { en: 'Open retimer panel', ja: 'リタイマーパネルを開く' },
	},
	fileReplace: {
		label: { en: 'Replace Files', ja: 'ファイルを置き換え' },
		tip: { en: 'Replace all files', ja: 'ファイルを置き換え' },
	},
	removeUnused: {
		label: { en: 'Remove Unused', ja: '未使用項目を削除' },
		tip: { en: 'Remove unused items', ja: '未使用項目を削除' },
	},
	location: {
		label: { en: 'Project Folder', ja: 'プロジェクトフォルダ' },
		tip: { en: 'Open project folder', ja: 'プロジェクトフォルダを開く' },
	},
	render: {
		label: { en: 'Renderer', ja: 'レンダラー' },
		tip: { en: 'Render', ja: 'レンダー' },
	},
	takeUp: {
		label: { en: 'Increment Take Name', ja: 'テイク名をアップ' },
		tip: { en: 'Increment take name', ja: 'テイク名をアップ' },
	},
	nestedComps: {
		label: { en: 'Nested Compositions', ja: 'ネストされたコンポジション' },
		tip: {
			en: 'Include nested compositions',
			ja: 'ネストされたコンポジションを含める',
		},
	},
	saveProject: {
		label: { en: 'Save Project', ja: 'プロジェクトを保存' },
		tip: { en: 'Save the current project', ja: '現在のプロジェクトを保存' },
	},
	worker: {
		label: { en: 'Worker', ja: '作業者' },
		tip: { en: 'Your name', ja: '相手の名前' },
	},
	retake: {
		label: { en: 'Retake', ja: 'リテイク' },
		tip: { en: 'Retake for this shot', ja: 'リテイク' },
	},
};

function T(key) {
	var lang = app.settings.haveSetting('projectBox', 'lang')
		? app.settings.getSetting('projectBox', 'lang')
		: 'en';

	if (lang !== 'ja' && lang !== 'en') {
		lang = 'en';
	}
	return L[key] ? L[key].label[lang] : key;
}

function TT(key) {
	var lang = app.settings.haveSetting('projectBox', 'lang')
		? app.settings.getSetting('projectBox', 'lang')
		: 'en';

	if (lang !== 'ja' && lang !== 'en') {
		lang = 'en';
	}

	if (L[key] && L[key].tip) {
		return L[key].tip[lang];
	}
	return T(key); // fallback to label if no tooltip
}
