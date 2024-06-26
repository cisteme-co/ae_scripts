app.beginUndoGroup("key curve control")


var ACT = app.project.activeItem;
var SEL = ACT.selectedLayers[0];

var Pos = SEL.property("ADBE Transform Group").property("ADBE Position");

var Orient = SEL.property("ADBE Transform Group").property("ADBE Orientation");

var RoX = SEL.property("ADBE Transform Group").property("ADBE Rotate X");
var RoY = SEL.property("ADBE Transform Group").property("ADBE Rotate Y");
var RoZ = SEL.property("ADBE Transform Group").property("ADBE Rotate Z");

var Sc = SEL.property("ADBE Transform Group").property("ADBE Scale");

/*
't=effect("key curve control")(1);\r'+
'//キーフレームの値をスライダーに集約\r'+
'tx=linear(t, 0, 100, thisProperty.key(1).time, thisProperty.key(XXXX).time); \r'+
'valueAtTime(tx)'
*/

//エクスプレッションを分割して間にキーフレームの総数を差し込みます。
var exp01 =
    't=effect("key curve control")(1);\r' +
    '//キーフレームの値をスライダーに集約\r' +
    'tx=linear(t, 0, 100, thisProperty.key(1).time, thisProperty.key('

var exp02 =
    ').time); \r' +
    'valueAtTime(tx)'

var SL = SEL.property("ADBE Effect Parade").addProperty("ADBE Slider Control");
SL.name = "key curve control"

if (ACT) {
    if (SEL) {
        //positionの確認
        //3Dレイヤーの判定は必要か？
        //次元の分割は非対応
        if (Pos.numKeys > 1) {
            Pos.expression = exp01 + Pos.numKeys + exp02;
        }
        //回転の確認
        if (RoZ.numKeys > 1) {
            RoZ.expression = exp01 + RoZ.numKeys + exp02;
        }
        if (RoX.numKeys > 1) {
            RoX.expression = exp01 + RoX.numKeys + exp02;
        }
        if (RoY.numKeys > 1) {
            RoY.expression = exp01 + RoY.numKeys + exp02;
        }
        if (Orient.numKeys > 1) {
            Orient.expression = exp01 + Orient.numKeys + exp02;
        }
        //スケールの確認       
        if (Sc.numKeys > 1) {
            Sc.expression = exp01 + Sc.numKeys + exp02;
        }
    } else {
        alert("Please selected layer")
    }
}

app.endUndoGroup()
