//@target aftereffects

function getLanguage() {
	try {
		var locale = $.locale || 'en_US';
		if (locale.indexOf('ja') === 0 || locale.indexOf('jp') === 0) {
			return 'ja';
		}
		return 'en';
	} catch (e) {
		return 'en';
	}
}

function alertSaveProjectFirst() {
	var lang = getLanguage();
	alert(
		lang === 'ja'
			? 'プロジェクトを保存してください。'
			: 'Please save the project first.',
	);
}

function alertNoValidRenderQueue() {
	var lang = getLanguage();
	alert(
		lang === 'ja'
			? '有効なレンダーキューがありません。'
			: 'There is no valid render queue.',
	);
}
