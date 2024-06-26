app.beginUndoGroup("DelayMovement");

var layObj = app.project.activeItem.selectedLayers[0];

//ONチェックボックス追加
var FXON = layObj.property("Effects").addProperty("ADBE Checkbox Control");
FXON.name = "ON";

layObj.effect("ON")("ADBE Checkbox Control-0001").setValue(true);
//ループチェックボックス追加
var FXCB = layObj.property("Effects").addProperty("ADBE Checkbox Control");
FXCB.name = "loop";


//変数宣言
var comp = app.project.activeItem;
var layer = comp.selectedLayers;
var exp =
    "late=0;\r" +
    '//↑遅らせるコマ数指定\r' +
    'a=1/thisComp.frameDuration;\r' +
    '//↑fps取得(24)\r' +
    'loop=effect("loop")("ADBE Checkbox Control-0001");\r' +
    'ON=effect("ON")("ADBE Checkbox Control-0001");\r' +
    'compDur=thisComp.duration;\r' +
    'endKey=nearestKey(compDur);\r' +
    'EK=timeToFrames(endKey.time);\r' +
    '//↑最後のキーフレームの時間を取得\r' +
    'LT=late/a;\r' +
    'A=valueAtTime(time-LT);\r' +
    'if(ON==0){value}\r' +
    'else if(late==0){value}\r' +
    'else if(loop==1){if(time<LT){valueAtTime((endKey.time-LT)+time)}else{A}}\r' +
    'else if(loop==0){A}'

//レイヤーが選択されてるかの判定 error01
if (layer.length > 0) {
    //すべての選択レイヤーにアクセス
    for (i = 0; i < layer.length; i++) {
        var actLayer = layer[i]; //アクセスレイヤー代入

        var marker = actLayer.property("ADBE Marker"); //レイヤーマーカ
        var pupeet = actLayer.property("ADBE Effect Parade").property("ADBE FreePin3") //パペットプロパティ

        //↓↓↓↓↓パペットツールプロパティの処理↓↓↓↓↓
        //アクセスレイヤーにパペットプロパティが存在するかの判定
        if (pupeet) {
            //パペットツールの色々代入
            var mesh = pupeet.property("ADBE FreePin3 ARAP Group").property("ADBE FreePin3 Mesh Group");
            var pin = mesh.property("ADBE FreePin3 Mesh Atom").property("ADBE FreePin3 PosPins");

            //すべてのメッシュにアクセス
            for (m = 0; m < mesh.numProperties; m++) {
                //すべてのパペットピンにアクセス
                for (p = 0; p < pin.numProperties; p++) {
                    if (mesh(m + 1).property("ADBE FreePin3 PosPins")(p + 1).property("ADBE FreePin3 PosPin Type").value == 1) //1=ピンタイプ:位置
                    {
                        mesh(m + 1).property("ADBE FreePin3 PosPins")(p + 1).property("ADBE FreePin3 PosPin Position").expression = exp;
                    } else if (mesh(m + 1).property("ADBE FreePin3 PosPins")(p + 1).property("ADBE FreePin3 PosPin Type").value == 3) //3=ピンタイプ:ベンド 
                    {
                        mesh(m + 1).property("ADBE FreePin3 PosPins")(p + 1).property("ADBE FreePin3 PosPin Scale").expression = exp;
                        mesh(m + 1).property("ADBE FreePin3 PosPins")(p + 1).property("ADBE FreePin3 PosPin Rotation").expression = exp;
                    } else if (mesh(m + 1).property("ADBE FreePin3 PosPins")(p + 1).property("ADBE FreePin3 PosPin Type").value == 4) //4=ピンタイプ:詳細                            
                    {
                        mesh(m + 1).property("ADBE FreePin3 PosPins")(p + 1).property("ADBE FreePin3 PosPin Position").expression = exp;
                        mesh(m + 1).property("ADBE FreePin3 PosPins")(p + 1).property("ADBE FreePin3 PosPin Scale").expression = exp;
                        mesh(m + 1).property("ADBE FreePin3 PosPins")(p + 1).property("ADBE FreePin3 PosPin Rotation").expression = exp;
                    }

                }
            }
        }
    }
}
app.endUndoGroup();
