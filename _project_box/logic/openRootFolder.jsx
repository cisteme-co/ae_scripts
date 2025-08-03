function openRootFolder() {
	if (app.project.file == null) {
		var message;
		switch ($.locale) {
			case 'ja_JP':
				message = 'プロジェクトを保存してください。';
				break;
			case 'fr_FR':
				message = 'Veuillez enregistrer le projet.';
				break;
			default:
				message = 'Please save the project first.';
		}
		alert(message);
	} else {
		app.project.file.parent.execute();
	}
}
