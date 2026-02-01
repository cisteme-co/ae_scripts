// ────────────────────────────────────────────────
// ─────────────── Temporary 3D Helper ────────────
// ────────────────────────────────────────────────

var rootFolder = File($.fileName).parent;
$.evalFile(new File(rootFolder.fsName + '/utils/alerts.jsx'));

app.beginUndoGroup('Temporary 3D');

(function () {
	try {
		var comp = app.project.activeItem;
		if (!(comp && comp instanceof CompItem)) {
			Alerts.alertNoCompSelected();
			app.endUndoGroup();
			return;
		}

		// ------------------------------------------------
		// Settings
		// ------------------------------------------------

		var STROKE_WIDTH = 16;

		// #FFF2CB
		var BG_COLOR = [1, 0.9490196078, 0.7960784314, 1];

		// #AA4242
		var STROKE_COLOR = [0.6666666667, 0.2588235294, 0.2588235294, 1];

		// ------------------------------------------------
		// Create shape layer
		// ------------------------------------------------

		var layer = comp.layers.addShape();
		layer.name = '仮3D';
		layer.label = 1; // Red

		var contents = layer.property('ADBE Root Vectors Group');

		// ------------------------------------------------
		// Utility
		// ------------------------------------------------

		function addStrokeShapeGroup(parent, name, shapeData) {
			var g = parent.addProperty('ADBE Vector Group');
			g.name = name;

			var c = g.property('ADBE Vectors Group');

			var pathGroup = c.addProperty('ADBE Vector Shape - Group');
			pathGroup.name = 'Path';

			var s = new Shape();
			s.closed = shapeData.closed;

			// Remove offset - use vertices as-is
			s.vertices = shapeData.vertices;
			s.inTangents = shapeData.inTangents;
			s.outTangents = shapeData.outTangents;

			pathGroup.property('ADBE Vector Shape').setValue(s);
		}

		function addMaskPath(parent, name, shapeData) {
			var pathGroup = parent.addProperty('ADBE Vector Shape - Group');
			pathGroup.name = name;

			var s = new Shape();
			s.closed = shapeData.closed;

			// Offset vertices by [0, 25]
			s.vertices = shapeData.vertices;
			s.inTangents = shapeData.inTangents;
			s.outTangents = shapeData.outTangents;

			pathGroup.property('ADBE Vector Shape').setValue(s);
		}

		// ------------------------------------------------
		// Text group
		// ------------------------------------------------

		var textGroup = contents.addProperty('ADBE Vector Group');
		textGroup.name = 'Text';

		var textContents = textGroup.property('ADBE Vectors Group');

		// Set Text group transform
		textGroup
			.property('ADBE Vector Transform Group')
			.property('ADBE Vector Anchor')
			.setValue([806, 445]);
		textGroup
			.property('ADBE Vector Transform Group')
			.property('ADBE Vector Position')
			.setValue([0, 0]);

		// ------------------------------------------------
		// 仮
		// ------------------------------------------------

		var kaGroup = textContents.addProperty('ADBE Vector Group');
		kaGroup.name = '仮';

		var kaContents = kaGroup.property('ADBE Vectors Group');

		// Create empty group for 仮_1 and 仮_2
		var kaFillGroup = kaContents.addProperty('ADBE Vector Group');
		kaFillGroup.name = '仮_fill';
		var kaFillContents = kaFillGroup.property('ADBE Vectors Group');

		// ---- 仮 path 1
		addStrokeShapeGroup(kaFillContents, '仮_1', {
			closed: true,
			vertices: [
				[-70.88671875, -57.94921875],
				[-76.951171875, -37.8017578125],
				[-84.6328125, -22.33740234375],
				[-78.53466796875, -17.3173828125],
				[-75.43505859375, -22.1689453125],
				[-75.43505859375, 3.80712890625],
				[-66.20361328125, 3.80712890625],
				[-66.20361328125, -37.330078125],
				[-67.921875, -37.330078125],
				[-61.7900390625, -56.50048828125],
			],
			inTangents: [
				[0, 0],
				[2.91957092285156, -6.98518371582031],
				[2.20098876953125, -3.32386779785156],
				[0, 0],
				[-0.80859375, 1.34765625],
				[0, 0],
				[0, 0],
				[0, 0],
				[0, 0],
				[-1.23553466796875, 6.22184753417969],
			],
			outTangents: [
				[-1.12339782714844, 6.44664001464844],
				[-2.92010498046875, 6.98570251464844],
				[0, 0],
				[1.25762939453125, -1.88671875],
				[0, 0],
				[0, 0],
				[0, 0],
				[0, 0],
				[2.85218811035156, -6.55824279785156],
				[0, 0],
			],
		});

		// ---- 仮 path 2
		addStrokeShapeGroup(kaFillContents, '仮_2', {
			closed: true,
			vertices: [
				[-49.56005859375, -40.4296875],
				[-49.56005859375, -47.74072265625],
				[-18.732421875, -47.74072265625],
				[-18.732421875, -54.984375],
				[-58.892578125, -54.984375],
				[-58.892578125, -30.55810546875],
				[-60.425537109375, -15.413818359375],
				[-65.73193359375, -1.1455078125],
				[-59.3642578125, 2.830078125],
				[-52.339599609375, -11.842529296875],
				[-49.9306640625, -33.38818359375],
				[-48.24609375, -33.38818359375],
				[-40.16015625, -11.75830078125],
				[-54.68115234375, -2.96484375],
				[-50.806640625, 3.67236328125],
				[-34.53369140625, -5.55908203125],
				[-21.83203125, 2.830078125],
				[-16.7109375, -5.22216796875],
				[-28.46923828125, -12.12890625],
				[-19.77685546875, -40.4296875],
			],
			inTangents: [
				[0, 0],
				[0, 0],
				[0, 0],
				[0, 0],
				[0, 0],
				[0, 0],
				[1.02178955078125, -5.33430480957031],
				[2.51527404785156, -4.177734375],
				[0, 0],
				[-1.60614013671875, 5.71647644042969],
				[0, 8.64762878417969],
				[0, 0],
				[-4.53729248046875, -6.19921875],
				[5.74964904785156, -2.2236328125],
				[0, 0],
				[-4.29039001464844, 3.638671875],
				[-5.12109375, -2.60581970214844],
				[0, 0],
				[2.74005126953125, 2.17887878417969],
				[0, 10.5791015625],
			],
			outTangents: [
				[0, 0],
				[0, 0],
				[0, 0],
				[0, 0],
				[0, 0],
				[0, 4.76206970214844],
				[-1.02232360839844, 5.33482360839844],
				[0, 0],
				[3.07696533203125, -4.06507873535156],
				[1.60560607910156, -5.71595764160156],
				[0, 0],
				[0.85333251953125, 8.220703125],
				[-3.93084716796875, 3.638671875],
				[0, 0],
				[6.55824279785156, -2.51579284667969],
				[3.34649658203125, 2.98747253417969],
				[0, 0],
				[-5.09898376464844, -2.42578125],
				[5.794921875, -8.2880859375],
				[0, 0],
			],
		});

		// ---- 仮 path 3 (mask)
		addMaskPath(kaContents, '仮_3', {
			closed: true,
			vertices: [
				[-40.26123046875, -33.38818359375],
				[-29.61474609375, -33.38818359375],
				[-34.76953125, -18.328125],
			],
			inTangents: [
				[0.8759765625, 5.66015625],
				[0, 0],
				[2.830078125, -4.58203125],
			],
			outTangents: [
				[0, 0],
				[-0.6064453125, 5.4580078125],
				[-2.78533935546875, -4.3798828125],
			],
		});

		// Set 仮_3 as mask
		var kaMask = kaContents.addProperty('ADBE Vector Filter - Merge');
		kaMask.name = 'Merge Paths 1';

		// ADD FILL AFTER MERGE
		var kaFill = kaContents.addProperty('ADBE Vector Graphic - Fill');
		kaFill.property('ADBE Vector Fill Color').setValue(STROKE_COLOR);

		// ------------------------------------------------
		// 3
		// ------------------------------------------------

		addStrokeShapeGroup(textContents, '3', {
			closed: true,
			vertices: [
				[5.28955078125, 1.078125],
				[20.619140625, -3.369140625],
				[26.279296875, -15.228515625],
				[23.314453125, -23.095458984375],
				[15.26220703125, -27.05419921875],
				[15.26220703125, -27.52587890625],
				[22.37109375, -31.787841796875],
				[25.03271484375, -39.216796875],
				[20.231689453125, -48.34716796875],
				[6.064453125, -51.78369140625],
				[-10.41064453125, -48.5830078125],
				[-10.41064453125, -39.11572265625],
				[-9.39990234375, -39.11572265625],
				[4.75048828125, -43.42822265625],
				[11.6572265625, -41.928955078125],
				[14.0830078125, -37.5322265625],
				[2.7626953125, -30.62548828125],
				[-0.03369140625, -30.62548828125],
				[-0.03369140625, -22.9775390625],
				[2.93115234375, -22.9775390625],
				[12.617431640625, -21.141357421875],
				[14.958984375, -15.93603515625],
				[11.96044921875, -9.484130859375],
				[3.638671875, -7.27734375],
				[-10.81494140625, -11.69091796875],
				[-11.89306640625, -11.69091796875],
				[-11.89306640625, -2.12255859375],
			],
			inTangents: [
				[-6.24449157714844, 0],
				[-3.7734375, 2.96484375],
				[0, 4.94157409667969],
				[1.97621154785156, 2.03306579589844],
				[3.39125061035156, 0.6064453125],
				[0, 0],
				[-1.77458190917969, 2.12255859375],
				[0, 2.830078125],
				[3.20068359375, 2.291015625],
				[6.24397277832031, 0],
				[5.70489501953125, -2.13362121582031],
				[0, 0],
				[0, 0],
				[-4.02085876464844, 0],
				[-1.6171875, -0.99916076660156],
				[0, -1.93147277832031],
				[7.546875, 0],
				[0, 0],
				[0, 0],
				[0, 0],
				[-1.56138610839844, -1.22393798828125],
				[0, -2.24574279785156],
				[1.99885559082031, -1.47084045410156],
				[3.54866027832031, 0],
				[5.14320373535156, 2.94273376464844],
				[0, 0],
				[0, 0],
			],
			outTangents: [
				[6.44612121582031, 0],
				[3.7734375, -2.96484375],
				[0, -3.21174621582031],
				[-1.97673034667969, -2.03254699707031],
				[0, 0],
				[2.96484375, -0.71858215332031],
				[1.77406311035156, -2.12255859375],
				[0, -3.79554748535156],
				[-3.20068359375, -2.291015625],
				[-5.27848815917969, 0],
				[0, 0],
				[0, 0],
				[5.41273498535156, -2.87483215332031],
				[2.98695373535156, 0],
				[1.6171875, 0.99967956542969],
				[0, 4.60466003417969],
				[0, 0],
				[0, 0],
				[0, 0],
				[4.89631652832031, 0],
				[1.56085205078125, 1.22447204589844],
				[0, 2.830078125],
				[-1.99937438964844, 1.47135925292969],
				[-4.49253845214844, 0],
				[0, 0],
				[0, 0],
				[5.21058654785156, 2.13362121582031],
			],
		});

		// ADD FILL FOR 3
		var threeFill = textContents.addProperty('ADBE Vector Graphic - Fill');
		threeFill.property('ADBE Vector Fill Color').setValue(STROKE_COLOR);

		// ------------------------------------------------
		// D
		// ------------------------------------------------

		var dGroup = textContents.addProperty('ADBE Vector Group');
		dGroup.name = 'D';
		var dContents = dGroup.property('ADBE Vectors Group');

		// Create empty group for D_outer
		var dFillGroup = dContents.addProperty('ADBE Vector Group');
		dFillGroup.name = 'D_fill';
		var dFillContents = dFillGroup.property('ADBE Vectors Group');

		// D outer
		addStrokeShapeGroup(dFillContents, 'D_outer', {
			closed: true,
			vertices: [
				[52.6259765625, 0],
				[69, -2.7626953125],
				[78.686279296875, -11.606689453125],
				[82.30810546875, -25.3359375],
				[78.821044921875, -39.52001953125],
				[69.30322265625, -48.01025390625],
				[52.4912109375, -50.77294921875],
				[36.62255859375, -50.77294921875],
				[36.62255859375, 0],
			],
			inTangents: [
				[0, 0],
				[-4.04296875, 1.84196472167969],
				[-2.41471862792969, 4.05455017089844],
				[0, 5.09898376464844],
				[2.32470703125, 3.81871032714844],
				[4.02033996582031, 1.84196472167969],
				[7.18733215332031, 0],
				[0, 0],
				[0, 0],
			],
			outTangents: [
				[6.873046875, 0],
				[4.04296875, -1.84144592285156],
				[2.41419982910156, -4.05403137207031],
				[0, -5.63752746582031],
				[-2.32470703125, -3.81819152832031],
				[-4.02085876464844, -1.84144592285156],
				[0, 0],
				[0, 0],
				[0, 0],
			],
		});

		// D inner (mask)
		addMaskPath(dContents, 'D_inner', {
			closed: true,
			vertices: [
				[53.19873046875, -42.7880859375],
				[70.6845703125, -25.43701171875],
				[53.19873046875, -7.98486328125],
				[47.74072265625, -7.98486328125],
				[47.74072265625, -42.7880859375],
			],
			inTangents: [
				[0, 0],
				[0, -11.5672149658203],
				[11.6572265625, 0],
				[0, 0],
				[0, 0],
			],
			outTangents: [
				[11.6572265625, 0],
				[0, 11.6351165771484],
				[0, 0],
				[0, 0],
				[0, 0],
			],
		});

		// Set D_inner as mask
		var dMask = dContents.addProperty('ADBE Vector Filter - Merge');
		dMask.name = 'Merge Paths 1';

		// ADD FILL AFTER MERGE
		var dFill = dContents.addProperty('ADBE Vector Graphic - Fill');
		dFill.property('ADBE Vector Fill Color').setValue(STROKE_COLOR);

		// ------------------------------------------------
		// Case rectangle
		// ------------------------------------------------

		var caseGroup = contents.addProperty('ADBE Vector Group');
		caseGroup.name = 'Case';

		var caseContents = caseGroup.property('ADBE Vectors Group');

		var rect = caseContents.addProperty('ADBE Vector Shape - Rect');
		rect.property('ADBE Vector Rect Size').setValue([240, 100]);
		rect.property('ADBE Vector Rect Roundness').setValue(4);

		var caseStroke = caseContents.addProperty('ADBE Vector Graphic - Stroke');
		caseStroke.property('ADBE Vector Stroke Color').setValue(STROKE_COLOR);
		caseStroke.property('ADBE Vector Stroke Width').setValue(STROKE_WIDTH);

		var rectFill = caseContents.addProperty('ADBE Vector Graphic - Fill');
		rectFill.property('ADBE Vector Fill Color').setValue(BG_COLOR);

		// Set Case group transform
		caseGroup
			.property('ADBE Vector Transform Group')
			.property('ADBE Vector Anchor')
			.setValue([0, 0]);
		caseGroup
			.property('ADBE Vector Transform Group')
			.property('ADBE Vector Position')
			.setValue([-806.8, -470.8]);

		// ------------------------------------------------
		// Set layer transform
		// ------------------------------------------------

		layer
			.property('ADBE Transform Group')
			.property('ADBE Anchor Point')
			.setValue([-809.5, -472, 0]);
		layer
			.property('ADBE Transform Group')
			.property('ADBE Position')
			.setValue([1996, 1194]);
	} catch (e) {
		alert(
			'ERROR: ' +
				e.toString() +
				'\nMessage: ' +
				e.message +
				'\nLine: ' +
				e.line +
				'\nSource: ' +
				e.source,
		);
	}
})();

app.endUndoGroup();
