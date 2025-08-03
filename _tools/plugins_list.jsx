(function () {
    var effects = app.effects;

    if (!effects || effects.length === 0) {
        alert("No effects found.");
        return;
    }

    // Get the desktop path
    var desktopPath = Folder.desktop.fsName;
    var file = new File(desktopPath + "/AfterEffects_Effects_List.txt");

    if (file.open("w")) {
        file.writeln("Installed Effects and Plugins");
        file.writeln("--------------------------------\n");

        for (var i = 1; i <= effects.length; i++) {
            var effect = effects[i];
            var matchName = effect.matchName;

            file.writeln(i + ". " + " (MatchName: " + matchName + ")");
        }

        file.close();
        alert("Effect list saved to your desktop as 'AfterEffects_Effects_List.txt'.");
    } else {
        alert("Failed to open file for writing.");
    }
})();
