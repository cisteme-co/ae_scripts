// ────────────────────────────────────────────────
// Language-aware Alert Utility Functions
// ────────────────────────────────────────────────

var Alerts = (function () {
	// ──────────────
	// Detect AE UI language
	// ──────────────
	function getLanguage() {
		if (app.language && typeof app.language === 'string') {
			return app.language.toLowerCase();
		} else {
			return 'english';
		}
	}

	// ──────────────
	// Alert: No Layer Selected
	// ──────────────
	function alertNoLayerSelected() {
		var lang = getLanguage();
		var msg = '';

		switch (lang) {
			case 'japanese':
			case 'ja':
				msg = 'レイヤーを選択してください。';
				break;
			case 'french':
			case 'fr':
				msg = 'Veuillez sélectionner un calque.';
				break;
			case 'german':
			case 'de':
				msg = 'Bitte wählen Sie eine Ebene aus.';
				break;
			case 'spanish':
			case 'es':
				msg = 'Por favor seleccione una capa.';
				break;
			default:
				msg = 'Please select a layer.';
		}

		alert(msg);
	}

	// ──────────────
	// Alert: No Composition Selected/Open
	// ──────────────
	function alertNoCompSelected() {
		var lang = getLanguage();
		var msg = '';

		switch (lang) {
			case 'japanese':
			case 'ja':
				msg = 'コンポジションを選択または開いてください。';
				break;
			case 'french':
			case 'fr':
				msg = 'Veuillez sélectionner ou ouvrir une composition.';
				break;
			case 'german':
			case 'de':
				msg = 'Bitte wählen oder öffnen Sie eine Komposition.';
				break;
			case 'spanish':
			case 'es':
				msg = 'Por favor, seleccione o abra una composición.';
				break;
			default:
				msg = 'Please select or open a composition.';
		}

		alert(msg);
	}

	// ──────────────
	// Alert: Missing Plugin(s)
	// ──────────────
	function alertMissingPlugin(pluginNames) {
		var lang = getLanguage();
		var pluginsList = pluginNames.join(' or ');
		var msg = '';

		switch (lang) {
			case 'japanese':
			case 'ja':
				msg =
					'「' +
					pluginsList +
					'」がインストールされていません。\nプラグインをインストールしてください。';
				break;
			case 'french':
			case 'fr':
				msg =
					'Le plugin « ' +
					pluginsList +
					" » n'est pas installé.\nVeuillez installer le plugin.";
				break;
			case 'german':
			case 'de':
				msg =
					'Das Plugin „' +
					pluginsList +
					'“ ist nicht installiert.\nBitte installieren Sie das Plugin.';
				break;
			case 'spanish':
			case 'es':
				msg =
					'El plugin «' +
					pluginsList +
					'» no está instalado.\nPor favor, instale el plugin.';
				break;
			default:
				msg =
					pluginsList + ' plugin is not installed.\nPlease install the plugin.';
		}

		alert(msg);
	}

	function alertNoValidAreaFromSelectedLayers() {
		var lang = getLanguage();
		var msg = '';

		switch (lang) {
			case 'japanese':
			case 'ja':
				msg = '選択されたレイヤーから有効な領域を取得できませんでした。';
				break;
			case 'french':
			case 'fr':
				msg =
					"Impossible d'obtenir une zone valide à partir des calques sélectionnés.";
				break;
			case 'german':
			case 'de':
				msg = 'Kein gültiger Bereich aus den ausgewählten Ebenen erhalten.';
				break;
			case 'spanish':
			case 'es':
				msg = 'No se pudo obtener un área válida de las capas seleccionadas.';
				break;
			default:
				msg = 'Could not get a valid area from selected layers.';
		}

		alert(msg);
	}

	// ──────────────
	// Alert: Please Save Project First
	// ──────────────
	function alertSaveProjectFirst() {
		var lang = getLanguage();
		var msg = '';

		switch (lang) {
			case 'japanese':
			case 'ja':
				msg = 'まずプロジェクトファイルを保存してください。';
				break;
			case 'french':
			case 'fr':
				msg = 'Veuillez d’abord enregistrer votre fichier projet.';
				break;
			case 'german':
			case 'de':
				msg = 'Bitte speichern Sie zuerst Ihre Projektdatei.';
				break;
			case 'spanish':
			case 'es':
				msg = 'Por favor, guarde primero su archivo de proyecto.';
				break;
			default:
				msg = 'Please save your project file first.';
		}

		alert(msg);
	}

	// ──────────────
	// Alert: Failed to Create Destination Folder
	// ──────────────
	function alertFailedCreateFolder(folderPath) {
		var lang = getLanguage();
		var msg = '';

		switch (lang) {
			case 'japanese':
			case 'ja':
				msg = '宛先フォルダーの作成に失敗しました：\n' + folderPath;
				break;
			case 'french':
			case 'fr':
				msg = 'Échec de la création du dossier de destination :\n' + folderPath;
				break;
			case 'german':
			case 'de':
				msg = 'Fehler beim Erstellen des Zielordners:\n' + folderPath;
				break;
			case 'spanish':
			case 'es':
				msg = 'Error al crear la carpeta de destino:\n' + folderPath;
				break;
			default:
				msg = 'Failed to create destination folder:\n' + folderPath;
		}

		alert(msg);
	}

	// ──────────────
	// Alert: Failed to Save Project Copy
	// ──────────────
	function alertFailedSaveProjectCopy() {
		var lang = getLanguage();
		var msg = '';

		switch (lang) {
			case 'japanese':
			case 'ja':
				msg = 'プロジェクトのコピーを保存できませんでした！';
				break;
			case 'french':
			case 'fr':
				msg = "Échec de l'enregistrement de la copie du projet !";
				break;
			case 'german':
			case 'de':
				msg = 'Speichern der Projektkopie fehlgeschlagen!';
				break;
			case 'spanish':
			case 'es':
				msg = 'Error al guardar la copia del proyecto!';
				break;
			default:
				msg = 'Failed to save project copy!';
		}

		alert(msg);
	}

	// ──────────────
	// Alert: Error Copying Asset
	// ──────────────
	function alertErrorCopyingAsset(filePath, errorMsg) {
		var lang = getLanguage();
		var msg = '';

		switch (lang) {
			case 'japanese':
			case 'ja':
				msg =
					'アセットのコピー中にエラーが発生しました：\n' +
					filePath +
					'\n\n' +
					errorMsg;
				break;
			case 'french':
			case 'fr':
				msg =
					"Erreur lors de la copie de l'élément :\n" +
					filePath +
					'\n\n' +
					errorMsg;
				break;
			case 'german':
			case 'de':
				msg =
					'Fehler beim Kopieren der Datei:\n' + filePath + '\n\n' + errorMsg;
				break;
			case 'spanish':
			case 'es':
				msg = 'Error al copiar el archivo:\n' + filePath + '\n\n' + errorMsg;
				break;
			default:
				msg = 'Error copying asset:\n' + filePath + '\n\n' + errorMsg;
		}

		alert(msg);
	}

	// ──────────────
	// Alert: Error Replacing Footage Path
	// ──────────────
	function alertErrorReplacingFootage(filePath, errorMsg) {
		var lang = getLanguage();
		var msg = '';

		switch (lang) {
			case 'japanese':
			case 'ja':
				msg =
					'フッテージパスの置換中にエラーが発生しました：\n' +
					filePath +
					'\n\n' +
					errorMsg;
				break;
			case 'french':
			case 'fr':
				msg =
					"Erreur lors du remplacement du chemin d'élément :\n" +
					filePath +
					'\n\n' +
					errorMsg;
				break;
			case 'german':
			case 'de':
				msg =
					'Fehler beim Ersetzen des Footage-Pfads:\n' +
					filePath +
					'\n\n' +
					errorMsg;
				break;
			case 'spanish':
			case 'es':
				msg =
					'Error al reemplazar la ruta del metraje:\n' +
					filePath +
					'\n\n' +
					errorMsg;
				break;
			default:
				msg = 'Error replacing footage path:\n' + filePath + '\n\n' + errorMsg;
		}

		alert(msg);
	}

	// ──────────────
	// Alert: Files Collected Success
	// ──────────────
	function alertFilesCollected(folderPath) {
		var lang = getLanguage();
		var msg = '';

		switch (lang) {
			case 'japanese':
			case 'ja':
				msg =
					'ファイルが収集され、プロジェクトが保存されました：\n' + folderPath;
				break;
			case 'french':
			case 'fr':
				msg = 'Fichiers collectés et projet enregistré dans :\n' + folderPath;
				break;
			case 'german':
			case 'de':
				msg = 'Dateien gesammelt und Projekt gespeichert in:\n' + folderPath;
				break;
			case 'spanish':
			case 'es':
				msg = 'Archivos recopilados y proyecto guardado en:\n' + folderPath;
				break;
			default:
				msg = 'Files collected and project saved to:\n' + folderPath;
		}

		alert(msg);
	}

	// ──────────────
	// Alert: Could Not Find Project Folder 5 Levels Up
	// ──────────────
	function alertCouldNotFindProjectFolder() {
		var lang = getLanguage();
		var msg = '';

		switch (lang) {
			case 'japanese':
			case 'ja':
				msg = '5階層上のプロジェクトフォルダーが見つかりませんでした。';
				break;
			case 'french':
			case 'fr':
				msg = 'Impossible de trouver le dossier projet 5 niveaux plus haut.';
				break;
			case 'german':
			case 'de':
				msg = 'Projektordner 5 Ebenen höher konnte nicht gefunden werden.';
				break;
			case 'spanish':
			case 'es':
				msg = 'No se pudo encontrar la carpeta del proyecto 5 niveles arriba.';
				break;
			default:
				msg = 'Could not find project folder 5 levels up.';
		}

		alert(msg);
	}

	// ──────────────
	// Alert: No Template Folder
	// ──────────────
	function alertNoTemplateFolder() {
		var lang = getLanguage();
		var msg = '';

		switch (lang) {
			case 'japanese':
			case 'ja':
				msg = 'おっと！このプロジェクトにテンプレートフォルダがありません。';
				break;
			case 'french':
			case 'fr':
				msg = 'Oups ! Aucun dossier de modèle pour ce projet...';
				break;
			case 'german':
			case 'de':
				msg = 'Hoppla! Kein Template-Ordner für dieses Projekt gefunden.';
				break;
			case 'spanish':
			case 'es':
				msg = '¡Vaya! No hay carpeta de plantilla para este proyecto.';
				break;
			default:
				msg = 'Oops! No Template folder for this project...';
		}

		alert(msg);
	}

	// ──────────────
	// Alert: No Template File
	// ──────────────
	function alertNoTemplateFile() {
		var lang = getLanguage();
		var msg = '';

		switch (lang) {
			case 'japanese':
			case 'ja':
				msg = 'おっと！このプロジェクトにテンプレートファイルがありません。';
				break;
			case 'french':
			case 'fr':
				msg = 'Oups ! Aucun fichier de modèle pour ce projet...';
				break;
			case 'german':
			case 'de':
				msg = 'Hoppla! Keine Template-Datei für dieses Projekt gefunden.';
				break;
			case 'spanish':
			case 'es':
				msg = '¡Vaya! No hay archivo de plantilla para este proyecto.';
				break;
			default:
				msg = 'Oops! No Template file for this project...';
		}

		alert(msg);
	}

	// ──────────────
	// Alert: Cut Already Exists
	// ──────────────
	function alertCutExists(allCuts) {
		var lang = getLanguage();
		var msg = '';

		switch (lang) {
			case 'japanese':
			case 'ja':
				msg = 'カット「' + allCuts + '」はすでに存在します。処理を中止します。';
				break;
			case 'french':
			case 'fr':
				msg = 'Le cut "' + allCuts + '" existe déjà. Opération annulée.';
				break;
			case 'german':
			case 'de':
				msg =
					'Der Schnitt "' +
					allCuts +
					'" existiert bereits. Vorgang abgebrochen.';
				break;
			case 'spanish':
			case 'es':
				msg = 'El corte "' + allCuts + '" ya existe. Operación cancelada.';
				break;
			default:
				msg = 'Cut "' + allCuts + '" already exists. Operation cancelled.';
		}

		alert(msg);
	}

	// ──────────────
	// Alert: Cut Created Successfully
	// ──────────────
	function alertCutCreated(allCuts) {
		var lang = getLanguage();
		var msg = '';

		switch (lang) {
			case 'japanese':
			case 'ja':
				msg = 'カット「' + allCuts + '」が作成されました！';
				break;
			case 'french':
			case 'fr':
				msg = 'Cut "' + allCuts + '" créé avec succès !';
				break;
			case 'german':
			case 'de':
				msg = 'Schnitt "' + allCuts + '" wurde erstellt!';
				break;
			case 'spanish':
			case 'es':
				msg = '¡Corte "' + allCuts + '" creado con éxito!';
				break;
			default:
				msg = 'Cut "' + allCuts + '" created!';
		}

		alert(msg);
	}

	// ──────────────
	// Alert: Unexpected Filename Format
	// ──────────────
	function alertUnexpectedFilename(fileName) {
		var lang = getLanguage();
		var msg = '';

		switch (lang) {
			case 'japanese':
			case 'ja':
				msg = '予期しないファイル名の形式: ' + fileName;
				break;
			case 'french':
			case 'fr':
				msg = 'Format de nom de fichier inattendu : ' + fileName;
				break;
			case 'german':
			case 'de':
				msg = 'Unerwartetes Dateinamensformat: ' + fileName;
				break;
			case 'spanish':
			case 'es':
				msg = 'Formato de nombre de archivo inesperado: ' + fileName;
				break;
			default:
				msg = 'Unexpected filename format: ' + fileName;
		}
		alert(msg);
	}

	// ──────────────
	// Alert: Background Folder Missing
	// ──────────────
	function alertBgFolderMissing(folderPath) {
		var lang = getLanguage();
		var msg = '';

		switch (lang) {
			case 'japanese':
			case 'ja':
				msg = '背景フォルダーが存在しません:\n' + folderPath;
				break;
			case 'french':
			case 'fr':
				msg = "Le dossier BG n'existe pas :\n" + folderPath;
				break;
			case 'german':
			case 'de':
				msg = 'Hintergrundordner existiert nicht:\n' + folderPath;
				break;
			case 'spanish':
			case 'es':
				msg = 'La carpeta de fondo no existe:\n' + folderPath;
				break;
			default:
				msg = 'Background folder does not exist:\n' + folderPath;
		}
		alert(msg);
	}

	// ──────────────
	// Alert: Episode Folder Not Found
	// ──────────────
	function alertEpisodeFolderNotFound(targetName) {
		var lang = getLanguage();
		var msg = '';

		switch (lang) {
			case 'japanese':
			case 'ja':
				msg = '話数フォルダーが見つかりません: ' + targetName;
				break;
			case 'french':
			case 'fr':
				msg = "Dossier d'épisode introuvable : " + targetName;
				break;
			case 'german':
			case 'de':
				msg = 'Episode-Ordner nicht gefunden: ' + targetName;
				break;
			case 'spanish':
			case 'es':
				msg = 'Carpeta de episodio no encontrada: ' + targetName;
				break;
			default:
				msg = 'Episode folder not found: ' + targetName;
		}
		alert(msg);
	}

	// ──────────────
	// Alert: No Background Asset Found
	// ──────────────
	function alertNoBGAssetFound(baseName) {
		var lang = getLanguage();
		var msg = '';

		switch (lang) {
			case 'japanese':
			case 'ja':
				msg = '背景が見つかりません: ' + baseName;
				break;
			case 'french':
			case 'fr':
				msg = 'Aucun BG trouvé pour : ' + baseName;
				break;
			case 'german':
			case 'de':
				msg = 'Kein Hintergrund-Asset gefunden für: ' + baseName;
				break;
			case 'spanish':
			case 'es':
				msg = 'No se encontró asset de fondo para: ' + baseName;
				break;
			default:
				msg = 'No background asset found for base name: ' + baseName;
		}
		alert(msg);
	}

	// ──────────────
	// Alert: Error Importing PSD
	// ──────────────
	function alertErrorImportingPSD(error) {
		var lang = getLanguage();
		var msg = '';

		switch (lang) {
			case 'japanese':
			case 'ja':
				msg = 'PSDのインポート中にエラーが発生しました:\n' + error;
				break;
			case 'french':
			case 'fr':
				msg = "Erreur lors de l'importation du PSD :\n" + error;
				break;
			case 'german':
			case 'de':
				msg = 'Fehler beim Importieren der PSD:\n' + error;
				break;
			case 'spanish':
			case 'es':
				msg = 'Error al importar PSD:\n' + error;
				break;
			default:
				msg = 'Error importing PSD:\n' + error;
		}
		alert(msg);
	}

	// ──────────────
	// Alert: Cannot Import EXR as Footage
	// ──────────────
	function alertCannotImportEXR() {
		var lang = getLanguage();
		var msg = '';

		switch (lang) {
			case 'japanese':
			case 'ja':
				msg = 'EXRをフッテージとしてインポートできません。';
				break;
			case 'french':
			case 'fr':
				msg = "Impossible d'importer EXR en tant que séquence.";
				break;
			case 'german':
			case 'de':
				msg = 'EXR kann nicht als Footage importiert werden.';
				break;
			case 'spanish':
			case 'es':
				msg = 'No se puede importar EXR como metraje.';
				break;
			default:
				msg = 'Cannot import EXR as footage.';
		}
		alert(msg);
	}

	// ──────────────
	// Alert: Error Importing EXR
	// ──────────────
	function alertErrorImportingEXR(error) {
		var lang = getLanguage();
		var msg = '';

		switch (lang) {
			case 'japanese':
			case 'ja':
				msg = 'EXRのインポート中にエラーが発生しました:\n' + error;
				break;
			case 'french':
			case 'fr':
				msg = "Erreur lors de l'importation du EXR :\n" + error;
				break;
			case 'german':
			case 'de':
				msg = 'Fehler beim Importieren von EXR:\n' + error;
				break;
			case 'spanish':
			case 'es':
				msg = 'Error al importar EXR:\n' + error;
				break;
			default:
				msg = 'Error importing EXR:\n' + error;
		}
		alert(msg);
	}

	// ──────────────
	// Alert: Warning Unable to Set Alpha Mode on EXR Sequence
	// ──────────────
	function alertWarningAlphaModeEXRSequence(error) {
		var lang = getLanguage();
		var msg = '';

		switch (lang) {
			case 'japanese':
			case 'ja':
				msg = '警告: EXRシーケンスのalphaModeを設定できませんでした:\n' + error;
				break;
			case 'french':
			case 'fr':
				msg =
					'Avertissement : impossible de définir alphaMode sur la séquence EXR :\n' +
					error;
				break;
			case 'german':
			case 'de':
				msg =
					'Warnung: alphaMode auf EXR-Sequenz konnte nicht gesetzt werden:\n' +
					error;
				break;
			case 'spanish':
			case 'es':
				msg =
					'Advertencia: no se pudo establecer alphaMode en la secuencia EXR:\n' +
					error;
				break;
			default:
				msg = 'Warning: unable to set alphaMode on EXR sequence:\n' + error;
		}
		alert(msg);
	}

	// ──────────────
	// Alert: Error Importing Sequence
	// ──────────────
	function alertErrorImportingSequence(error) {
		var lang = getLanguage();
		var msg = '';

		switch (lang) {
			case 'japanese':
			case 'ja':
				msg = 'シーケンスのインポート中にエラーが発生しました:\n' + error;
				break;
			case 'french':
			case 'fr':
				msg = "Erreur lors de l'importation de la séquence :\n" + error;
				break;
			case 'german':
			case 'de':
				msg = 'Fehler beim Importieren der Sequenz:\n' + error;
				break;
			case 'spanish':
			case 'es':
				msg = 'Error al importar secuencia:\n' + error;
				break;
			default:
				msg = 'Error importing sequence:\n' + error;
		}
		alert(msg);
	}

	// ──────────────
	// Alert: No Importable Image Sequence Found
	// ──────────────
	function alertNoImportableImageSequence(folderName) {
		var lang = getLanguage();
		var msg = '';

		switch (lang) {
			case 'japanese':
			case 'ja':
				msg = 'インポート可能な画像シーケンスが見つかりません: ' + folderName;
				break;
			case 'french':
			case 'fr':
				msg =
					"Aucune séquence d'images importable trouvée dans le dossier : " +
					folderName;
				break;
			case 'german':
			case 'de':
				msg =
					'Keine importierbare Bildsequenz im Ordner gefunden: ' + folderName;
				break;
			case 'spanish':
			case 'es':
				msg =
					'No se encontró secuencia de imágenes importable en la carpeta: ' +
					folderName;
				break;
			default:
				msg = 'No importable image sequence found in folder: ' + folderName;
		}
		alert(msg);
	}

	// ──────────────
	// Alert: Latest Background Already Imported
	// ──────────────
	function alertLatestBackgroundImported() {
		var lang = getLanguage();
		var msg = '';

		switch (lang) {
			case 'japanese':
			case 'ja':
				msg = '最新の背景バージョンはすでにインポートされています。';
				break;
			case 'french':
			case 'fr':
				msg = "La dernière version d'arrière-plan est déjà importée.";
				break;
			case 'german':
			case 'de':
				msg = 'Die neueste Hintergrundversion wurde bereits importiert.';
				break;
			case 'spanish':
			case 'es':
				msg = 'La última versión de fondo ya está importada.';
				break;
			default:
				msg = 'Latest background version already imported.';
		}
		alert(msg);
	}

	// ──────────────
	// Alert: Paint folder missing
	// ──────────────
	function alertPaintFolderMissing(path) {
		var lang = getLanguage();
		var msg = '';

		switch (lang) {
			case 'japanese':
			case 'ja':
				msg = 'ペイントフォルダーが存在しません:\n' + path;
				break;
			case 'french':
			case 'fr':
				msg = "Le dossier de peinture n'existe pas :\n" + path;
				break;
			case 'german':
			case 'de':
				msg = 'Der Paint-Ordner existiert nicht:\n' + path;
				break;
			case 'spanish':
			case 'es':
				msg = 'La carpeta de pintura no existe:\n' + path;
				break;
			default:
				msg = 'Paint folder does not exist:\n' + path;
		}

		alert(msg);
	}

	// ──────────────
	// Alert: No cell folder found
	// ──────────────
	function alertNoCellFolderFound(baseName) {
		var lang = getLanguage();
		var msg = '';

		switch (lang) {
			case 'japanese':
			case 'ja':
				msg = 'セルフォルダーが見つかりません: ' + baseName;
				break;
			case 'french':
			case 'fr':
				msg = 'Aucun dossier de cellule trouvé pour : ' + baseName;
				break;
			case 'german':
			case 'de':
				msg = 'Kein Zellordner gefunden für: ' + baseName;
				break;
			case 'spanish':
			case 'es':
				msg = 'No se encontró carpeta de celda para: ' + baseName;
				break;
			default:
				msg = 'No cell folder found for: ' + baseName;
		}

		alert(msg);
	}

	// ──────────────
	// Alert: Failed to import file
	// ──────────────
	function alertFailedToImportFile(fileName, err) {
		var lang = getLanguage();
		var msg = '';

		switch (lang) {
			case 'japanese':
			case 'ja':
				msg = 'インポートに失敗しました: ' + fileName + '\n' + err;
				break;
			case 'french':
			case 'fr':
				msg = "Échec de l'importation : " + fileName + '\n' + err;
				break;
			case 'german':
			case 'de':
				msg = 'Import fehlgeschlagen: ' + fileName + '\n' + err;
				break;
			case 'spanish':
			case 'es':
				msg = 'Error al importar: ' + fileName + '\n' + err;
				break;
			default:
				msg = 'Failed to import: ' + fileName + '\n' + err;
		}

		alert(msg);
	}

	// ──────────────
	// Alert: No sequence found
	// ──────────────
	function alertNoSequenceFound(folderName) {
		var lang = getLanguage();
		var msg = '';

		switch (lang) {
			case 'japanese':
			case 'ja':
				msg = folderName + ' にシーケンスが見つかりません';
				break;
			case 'french':
			case 'fr':
				msg = 'Aucune séquence trouvée dans ' + folderName;
				break;
			case 'german':
			case 'de':
				msg = 'Keine Sequenz gefunden in ' + folderName;
				break;
			case 'spanish':
			case 'es':
				msg = 'No se encontró secuencia en ' + folderName;
				break;
			default:
				msg = 'No sequence found in ' + folderName;
		}

		alert(msg);
	}

	// ──────────────
	// Alert: Failed to import sequence
	// ──────────────
	function alertFailedToImportSequence(folderName, err) {
		var lang = getLanguage();
		var msg = '';

		switch (lang) {
			case 'japanese':
			case 'ja':
				msg = folderName + ' のシーケンスのインポートに失敗しました\n' + err;
				break;
			case 'french':
			case 'fr':
				msg =
					"Échec de l'importation de la séquence dans " +
					folderName +
					'\n' +
					err;
				break;
			case 'german':
			case 'de':
				msg = 'Fehler beim Import der Sequenz in ' + folderName + '\n' + err;
				break;
			case 'spanish':
			case 'es':
				msg = 'Error al importar la secuencia en ' + folderName + '\n' + err;
				break;
			default:
				msg = 'Failed to import sequence in ' + folderName + '\n' + err;
		}

		alert(msg);
	}

	// ──────────────
	// Alert: Cuts folder missing
	// ──────────────
	function alertCutsFolderMissing(path) {
		var lang = getLanguage();
		var msg = '';

		switch (lang) {
			case 'japanese':
			case 'ja':
				msg = 'カットフォルダが存在しません：' + path;
				break;
			case 'french':
			case 'fr':
				msg = 'Dossier de coupes manquant : ' + path;
				break;
			case 'german':
			case 'de':
				msg = 'Schnittordner fehlt: ' + path;
				break;
			case 'spanish':
			case 'es':
				msg = 'Carpeta de cortes no encontrada: ' + path;
				break;
			default:
				msg = 'Cuts folder does not exist: ' + path;
		}

		alert(msg);
	}

	// ──────────────
	// Alert: No cut folder found
	// ──────────────
	function alertNoCutFolderFound(cut) {
		var lang = getLanguage();
		var msg = '';

		switch (lang) {
			case 'japanese':
			case 'ja':
				msg = 'カットフォルダが見つかりません: ' + cut;
				break;
			case 'french':
			case 'fr':
				msg = 'Aucun dossier trouvé pour la coupe ' + cut;
				break;
			case 'german':
			case 'de':
				msg = 'Kein Ordner für Schnitt ' + cut + ' gefunden';
				break;
			case 'spanish':
			case 'es':
				msg = 'No se encontró carpeta para el corte ' + cut;
				break;
			default:
				msg = 'No folder found for cut ' + cut;
		}

		alert(msg);
	}

	// ──────────────
	// Alert: No AEP files found
	// ──────────────
	function alertNoAEPFiles(folderName) {
		var lang = getLanguage();
		var msg = '';

		switch (lang) {
			case 'japanese':
			case 'ja':
				msg = folderName + ' にAEPファイルが見つかりません';
				break;
			case 'french':
			case 'fr':
				msg = 'Aucun fichier AEP trouvé dans ' + folderName;
				break;
			case 'german':
			case 'de':
				msg = 'Keine AEP-Dateien gefunden in ' + folderName;
				break;
			case 'spanish':
			case 'es':
				msg = 'No se encontraron archivos AEP en ' + folderName;
				break;
			default:
				msg = 'No AEP files found in folder: ' + folderName;
		}

		alert(msg);
	}

	// ──────────────
	// Alert: Most recent take already open
	// ──────────────
	function alertAlreadyOpen(cut) {
		var lang = getLanguage();
		var msg = '';

		switch (lang) {
			case 'japanese':
			case 'ja':
				msg = 'カット ' + cut + ' の最新テイクはすでに開かれています。';
				break;
			case 'french':
			case 'fr':
				msg =
					'La prise la plus récente pour la coupe ' +
					cut +
					' est déjà ouverte.';
				break;
			case 'german':
			case 'de':
				msg = 'Der neueste Take für Schnitt ' + cut + ' ist bereits geöffnet.';
				break;
			case 'spanish':
			case 'es':
				msg = 'La toma más reciente para el corte ' + cut + ' ya está abierta.';
				break;
			default:
				msg = 'The most recent take for c.' + cut + ' is already open.';
		}

		alert(msg);
	}

	// ──────────────
	// Alert: Could not determine best file
	// ──────────────
	function alertCouldNotDetermineBestFile() {
		var lang = getLanguage();
		var msg = '';

		switch (lang) {
			case 'japanese':
			case 'ja':
				msg = '開くべき最適なファイルを特定できませんでした。';
				break;
			case 'french':
			case 'fr':
				msg = 'Impossible de déterminer le meilleur fichier à ouvrir.';
				break;
			case 'german':
			case 'de':
				msg = 'Die beste Datei zum Öffnen konnte nicht bestimmt werden.';
				break;
			case 'spanish':
			case 'es':
				msg = 'No se pudo determinar el mejor archivo para abrir.';
				break;
			default:
				msg = 'Could not determine the best file to open.';
		}

		alert(msg);
	}

	// ──────────────
	// Alert: Failed to remove item
	// ──────────────
	function alertFailedToRemove(itemName, error) {
		var lang = getLanguage();
		var msg = '';

		switch (lang) {
			case 'japanese':
			case 'ja':
				msg = '削除に失敗しました: ' + itemName + '\n' + error;
				break;
			case 'french':
			case 'fr':
				msg = 'Échec de la suppression : ' + itemName + '\n' + error;
				break;
			case 'german':
			case 'de':
				msg = 'Entfernen fehlgeschlagen: ' + itemName + '\n' + error;
				break;
			case 'spanish':
			case 'es':
				msg = 'Error al eliminar: ' + itemName + '\n' + error;
				break;
			default:
				msg = 'Failed to remove: ' + itemName + '\n' + error;
		}

		alert(msg);
	}

	// ──────────────
	// Alert: Successfully removed unused items
	// ──────────────
	function alertRemovedUnusedItems(count) {
		var lang = getLanguage();
		var msg = '';

		switch (lang) {
			case 'japanese':
			case 'ja':
				msg = '未使用のアイテム ' + count + ' 件を正常に削除しました。';
				break;
			case 'french':
			case 'fr':
				msg = count + ' élément(s) inutilisé(s) supprimé(s) avec succès.';
				break;
			case 'german':
			case 'de':
				msg = count + ' ungenutzte Elemente erfolgreich entfernt.';
				break;
			case 'spanish':
			case 'es':
				msg = count + ' elemento(s) sin usar eliminado(s) con éxito.';
				break;
			default:
				msg = 'Successfully removed ' + count + ' unused item(s).';
		}

		alert(msg);
	}

	function alertOutputFolderMissing() {
		var lang = getLanguage();
		var msg = '';

		switch (lang) {
			case 'japanese':
			case 'ja':
				msg = '出力フォルダが見つかりません。';
				break;
			case 'french':
			case 'fr':
				msg = 'Dossier de sortie introuvable.';
				break;
			case 'german':
			case 'de':
				msg = 'Ausgabeverzeichnis nicht gefunden.';
				break;
			case 'spanish':
			case 'es':
				msg = 'No se encontró la carpeta de salida.';
				break;
			default:
				msg = 'Output folder not found.';
		}

		alert(msg);
	}

	// ──────────────
	// Public API
	// ──────────────
	return {
		alertNoLayerSelected: alertNoLayerSelected,
		alertNoCompSelected: alertNoCompSelected,
		alertMissingPlugin: alertMissingPlugin,
		alertNoValidAreaFromSelectedLayers: alertNoValidAreaFromSelectedLayers,
		alertNoLayerSelected: alertNoLayerSelected,
		alertNoCompSelected: alertNoCompSelected,
		alertMissingPlugin: alertMissingPlugin,
		alertNoValidAreaFromSelectedLayers: alertNoValidAreaFromSelectedLayers,
		alertSaveProjectFirst: alertSaveProjectFirst,
		alertFailedCreateFolder: alertFailedCreateFolder,
		alertFailedSaveProjectCopy: alertFailedSaveProjectCopy,
		alertErrorCopyingAsset: alertErrorCopyingAsset,
		alertErrorReplacingFootage: alertErrorReplacingFootage,
		alertFilesCollected: alertFilesCollected,
		alertCouldNotFindProjectFolder: alertCouldNotFindProjectFolder,
		alertNoTemplateFolder: alertNoTemplateFolder,
		alertNoTemplateFile: alertNoTemplateFile,
		alertCutExists: alertCutExists,
		alertCutCreated: alertCutCreated,
		alertUnexpectedFilename: alertUnexpectedFilename,
		alertBgFolderMissing: alertBgFolderMissing,
		alertEpisodeFolderNotFound: alertEpisodeFolderNotFound,
		alertNoBGAssetFound: alertNoBGAssetFound,
		alertErrorImportingPSD: alertErrorImportingPSD,
		alertCannotImportEXR: alertCannotImportEXR,
		alertErrorImportingEXR: alertErrorImportingEXR,
		alertWarningAlphaModeEXRSequence: alertWarningAlphaModeEXRSequence,
		alertErrorImportingSequence: alertErrorImportingSequence,
		alertNoImportableImageSequence: alertNoImportableImageSequence,
		alertLatestBackgroundImported: alertLatestBackgroundImported,
		alertNoLayerSelected: alertNoLayerSelected,
		alertPaintFolderMissing: alertPaintFolderMissing,
		alertNoCellFolderFound: alertNoCellFolderFound,
		alertFailedToImportFile: alertFailedToImportFile,
		alertNoSequenceFound: alertNoSequenceFound,
		alertFailedToImportSequence: alertFailedToImportSequence,
		alertCutsFolderMissing: alertCutsFolderMissing,
		alertNoCutFolderFound: alertNoCutFolderFound,
		alertNoAEPFiles: alertNoAEPFiles,
		alertAlreadyOpen: alertAlreadyOpen,
		alertCouldNotDetermineBestFile: alertCouldNotDetermineBestFile,
		alertFailedToRemove: alertFailedToRemove,
		alertRemovedUnusedItems: alertRemovedUnusedItems,
		alertOutputFolderMissing: alertOutputFolderMissing,
	};
})();
