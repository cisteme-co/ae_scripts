app.beginUndoGroup("CreateComp");
var SEL = app.project.activeItem;

var selLayers = SEL.selectedLayers;

var ADDshape = SEL.layers.addShape(); //シェイプレイヤー追加

//var shapeProperty =  ADDshape.property('ADBE Root Vectors Group');//パスの属性を指定

//var myShapePath = shapeProperty.addProperty('ADBE Vector Shape - Rect');//長方形パスを追加

//var shapeP = myShapePath.property("ADBE Vector Rect Size") .setValue([SEL.width,SEL.height]);//長方形パスのサイズ指定

if (selLayers.length != 0) {
    //**********コントロールレイヤー追加****************/
    ADDshape.guidLayer = true;
    ADDshape.name = "parallax control"; //レイヤー名変更
    var CN = ADDshape.property("ADBE Effect Parade").addProperty("ADBE Checkbox Control"); //チェックボックスを適用
    CN.name = "parallax control";
    CN.property("ADBE Checkbox Control-0001").setValue(1);
    //*************選択したレイヤーに対し処理********************/
    for (var i = 0; i < selLayers.length; i++) {
        var Dt = selLayers[i].property("ADBE Effect Parade").addProperty("Kikaku 3D Transform Control");

        Dt.property("Kikaku 3D Transform Control-0001").setValue([0, 0, 0]);
        Dt.property("Kikaku 3D Transform Control-0002").setValue([0, 0, 0]);


        //selLayers[i].property("ADBE Effect Parade").addProperty("ADBE Geometry2").name = "素材調整";


        selLayers[i].threeDLayer = true; //3Dレイヤーに設定

        selLayers[i].property("ADBE Transform Group").property("ADBE Anchor Point").setValue([(selLayers[i].width / 2), (selLayers[i].height / 2), 0]);

        selLayers[i].property("ADBE Transform Group").property("ADBE Anchor Point").expression //アンカーポーント

            = 'ON=thisComp.layer("parallax control").effect("parallax control")("ADBE Checkbox Control-0001");\r' +
            'ax=transform.anchorPoint[0];\r' +
            'ay=transform.anchorPoint[1];\r' +
            'az=transform.anchorPoint[2];\r' +
            'px=effect("Kikaku 3D Transform Control")("Kikaku 3D Transform Control-0002")[0];\r' +
            'py=effect("Kikaku 3D Transform Control")("Kikaku 3D Transform Control-0002")[1];\r' +
            'pz=effect("Kikaku 3D Transform Control")("Kikaku 3D Transform Control-0001")[2];\r' +
            'if(ON==1){\r' +
            '[ax-px,ay-py,az-pz]}\r' +
            'else{transform.anchorPoint}';

        selLayers[i].property("ADBE Transform Group").property("ADBE Position").setValue([(selLayers[i].width / 2), (selLayers[i].height / 2), 0]);

        selLayers[i].property("ADBE Transform Group").property("ADBE Position").expression //位置

            = 'ON=thisComp.layer("parallax control").effect("parallax control")("ADBE Checkbox Control-0001");\r' +
            'X=thisComp.width/2;\r' +
            'Y=thisComp.height/2;\r' +
            'Zdepth=effect("Kikaku 3D Transform Control")("Kikaku 3D Transform Control-0002")[2];\r' +
            'if(ON==1){[X,Y,Zdepth]}else{transform.position}';

        selLayers[i].property("ADBE Transform Group").property("ADBE Scale").setValue([100, 100, 100])


        selLayers[i].property("ADBE Transform Group").property("ADBE Scale").expression //スケール

            = 'ON=thisComp.layer("parallax control").effect("parallax control")("ADBE Checkbox Control-0001");\r' +
            'XSC=effect("Kikaku 3D Transform Control")("Kikaku 3D Transform Control-0004");\r' +
            'YSC=effect("Kikaku 3D Transform Control")("Kikaku 3D Transform Control-0005");\r' +
            'ZSC=effect("Kikaku 3D Transform Control")("Kikaku 3D Transform Control-0006");\r' +
            'if(ON==1)\r' +
            '{\r' +
            'cam = thisComp.activeCamera;\r' +
            'distance = length(sub(position, cam.position));\r' +
            'X=XSC * distance / cam.zoom; \r' +
            'Y=YSC * distance / cam.zoom; \r' +
            'Z=ZSC * distance / cam.zoom; \r' +
            '[X,Y,Z]\r' +
            '}\r' +
            'else{transform.scale}';

        selLayers[i].property("ADBE Transform Group").property("ADBE Orientation").expression //回転方向

            = 'XO = effect("Kikaku 3D Transform Control")("Kikaku 3D Transform Control-0007");\r' +
            'YO = effect("Kikaku 3D Transform Control")("Kikaku 3D Transform Control-0008");\r' +
            'ZO = effect("Kikaku 3D Transform Control")("Kikaku 3D Transform Control-0009");\r' +
            '[XO, YO, ZO]'

        selLayers[i].property("ADBE Transform Group").property("ADBE Rotate X").expression //X回転

            = 'effect("Kikaku 3D Transform Control")("Kikaku 3D Transform Control-0010");'

        selLayers[i].property("ADBE Transform Group").property("ADBE Rotate Y").expression //Y回転

            = 'effect("Kikaku 3D Transform Control")("Kikaku 3D Transform Control-0011");'

        selLayers[i].property("ADBE Transform Group").property("ADBE Rotate Z").expression //Z回転

            = 'effect("Kikaku 3D Transform Control")("Kikaku 3D Transform Control-0012");'

        selLayers[i].property("ADBE Transform Group").property("ADBE Opacity").expression

            = 'effect("Kikaku 3D Transform Control")("Kikaku 3D Transform Control-0013");'

    }
} else {
    alert("レイヤーを選択してください")
}
app.endUndoGroup();
