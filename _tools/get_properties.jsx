function processProperty(theProp) {
	if (theProp.propertyType == PropertyType.PROPERTY) {
		// alert(theProp.name + "; " + theProp.matchName);
		alert(theProp.name + '; ' + theProp.matchName);
	} else {
		// must be a group
		for (var i = 1; i <= theProp.numProperties; i++) {
			processProperty(theProp.property(i));
		}
	}
}
var myLayer = app.project.activeItem.layer(1);
processProperty(myLayer);
