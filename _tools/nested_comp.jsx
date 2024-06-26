
app.beginUndoGroup("Nested Comp");

for (var i = 1; i <= app.project.numItems; i++) {
    app.project.item(i).preserveNestedFrameRate = true;
}

app.endUndoGroup();
