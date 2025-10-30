//Multiple Cell Comb--------------------------------------------Fujii Toshihide
//ver1.0--------------------------------------------------------------2020/08/31
//ver2.0--------------------------------------------------------------2022/09/19　コンポ作成を追加、選択した多重組用素材をコンポにいれキーイング適用と並び替えをします。
//ver3.0--------------------------------------------------------------2022/09/21　桁数の選択をドロップダウンメニューに変更。記号選択の欄を作成するコンポ名のみに影響するよう修正。
//多重組み用の撮影スクリプトです。多重組みの時の撮影打ち込みを簡略化します。
//参照レイヤーのリマップをもとに不透明度を切り替えます。
//ver2.0でコンポ作成を追加、選択した多重組用素材をコンポにいれキーイング適用と並び替えをします。
//ver3.0で桁数の選択をドロップダウンメニューに変更。記号選択の欄を作成するコンポ名のみに影響するよう修正。
//ver3.1エクスプレッションのエラーを修正
//*******************************************************************************************************************
//選択したレイヤーを取得

//多重組用ウィンドウ作成
var MYWIN = new Window("palette","Multiple Cell combination",[0,0,200,200]);

var saku = MYWIN.add("statictext",[10,5,80,35],"作成セル名:");
var sakuName = MYWIN.add("edittext",[70,10,100,30],"c");
sakuName.helpTip = "作成セル名を記入してください。\rc0001_b01であれば c です"
var sakuKeta = MYWIN.add("statictext",[110,5,140,35],"桁数:");

var sakuNum = MYWIN.add("dropdownlist",[140,10,190,30],["1","01","001","0001","00001"]);
sakuNum.helpTip = "作成セルの桁数を選択してください。\rc0001_b01であれば 0001 です"
sakuNum.selection = 3;

var sansyou = MYWIN.add("statictext",[10,40,80,60],"参照セル名:");
var sansyouName = MYWIN.add("edittext",[70,40,100,60],"b");
sansyouName.helpTip = "参照先セル名を記入してください。\rc0001_b01であれば b です"
var sansyouKeta = MYWIN.add("statictext",[110,40,140,60],"桁数:");
var sansyouNum = MYWIN.add("dropdownlist",[140,40,190,60],["1","01","001","0001","00001"]);
sansyouNum.helpTip = "参照先セルの桁数を選択してください。\rc0001_b01であれば 01 です"
sansyouNum.selection = 1;

var  kigou =  MYWIN.add("statictext",[30,75,100,95],"記号:");
var kigouValue = MYWIN.add("edittext",[70,75,100,95],"_");
kigouValue.helpTip = "作成セル名と参照先セル名の間に記号があれば記入してください(なければ空白)。\rc0001_b01であれば _ です"

var createComp = MYWIN.add("button",[115,72,180,97],"create comp");

var line = MYWIN.add("statictext",[10,100,210,120],"---------------------------------------------");

var REF = MYWIN.add("statictext",[20,110,130,135],"↓TargetComp↓");
var REFvalue = MYWIN.add("edittext",[10,135,100,155],"");
var REFget = MYWIN.add("button",[115,125,180,145],"getName");

var line = MYWIN.add("statictext",[10,150,210,170],"---------------------------------------------");

var exp = MYWIN.add("statictext",[20,175,160,195],sakuName.text+kigouValue.text+sansyouName.text+sansyouNum.selection.text);

//sakuName.addEventListener('change', exp);
//kigouValue.addEventListener('change', exp);
//sansyouName.addEventListener('change', exp);
//sansyouNum.addEventListener('change', exp);

var Appry = MYWIN.add("button",[115,175,180,195],"Appry");

MYWIN.center();
MYWIN.show();



//********************************************************************************************************************
//expretionメモ
/*
    NUM=XXX;
fps=1/thisComp.frameDuration;
REFremap=Math.round(REF=thisComp.layer("YYY").timeRemap*fps)+1;
if(NUM==REFremap)
	{100}
else{0}
*/
//-----------------------------------------------------------------------------------------------------------------------------------



//-----------------------------------------------------------------------------------------------------------------------------------
//ボタンクリック
createComp.onClick = CreateComp;

REFget.onClick = getREFname;

Appry.onClick = MultipleCellCombination;

//**********************************************************************************************************************
//配列の重複を削除する関数
function removeRep (ary)
{
    var temp ={}, res = [];
    for (var k=0; k<ary.length; k++) temp[ary[k]] = k;
    for (key in temp) res.push (key);
    return res;
}
//******************************************************************************************************************
//コンポ作成関数

function CreateComp()
{
app.beginUndoGroup("CreateComp");

var SEL = app.project.selection;

if(SEL.length !=0)
    {
        if(SEL[0].name.indexOf(".")>-1)
        {var CHname =SEL[0].name.split(".")[0]}
        else
        {var CHname =SEL[0].name}

            if((SEL[0].name.slice(0,sakuName.text.length)==sakuName.text)&&
            (SEL[0].name.slice(sakuName.text.length+sakuNum.selection.text.length + kigouValue.text.length,
                sakuName.text.length + sakuNum.selection.text.length + kigouValue.text.length + sansyouName.text.length)==sansyouName.text)&&
                (sakuName.text.length + sakuNum.selection.text.length + kigouValue.text.length + sansyouName.text.length + sansyouNum.selection.text.length == CHname.length))
                {//作成セル名と参照セル名が素材の名前と一致しているかの確認。
                    
    //var check = Number(sakuNum.selection.text.length)+Number(sansyouNum.selection.text.length);
    //if((isNaN(check)==false)&&(sakuNum.selection.text.match(/^[0-9]+$/))&&(sansyouNum.selection.text.match(/^[0-9]+$/)))
    //if(check==/^[0-9]*$/)
    
                    var compAspect = 1; 

                    var fps = 24;

                    var W = SEL[0].width;
                    var H = SEL[0].height;

                    var sakuseiKetaArray = [];
                    var sansyouKetaArray =[];


                        for(var i=0;i<SEL.length;i++)
                            {

                                if(SEL[0].name.indexOf(".")>-1)
                                    { var footageName = SEL[i].name.split(".")[0];}
                                    else
                                    {var footageName = SEL[i].name;}

                                        var sakuseiKeta = footageName.slice(sakuName.text.length,Number(sakuNum.selection.text.length)+sakuName.text.length);
                                        //作成セル数の桁数だけを残す 0001
                                        var sansyouKeta =footageName.slice(-Number(sansyouNum.selection.text.length));
                                        //参照セル数の桁数だけを残す　01

                                        sakuseiKetaArray.push(Number(sakuseiKeta));
                                        //作成セル桁を配列に
                                        sansyouKetaArray.push(sansyouKeta);
                                        //参照セル桁を配列に

                                        //new Set()配列内の重複したものを削除する　はつかえない！
                                        var sakuseiArray = removeRep(sakuseiKetaArray);
                                        //作成セル数の配列内の重複を削除
                                        var sansyouArray = removeRep(sansyouKetaArray);
                                        //参照セル数の配列内の重複を削除
                            }

                                 for(var c=0;c<sansyouArray.length;c++)
                                    {
                                        var compName = sakuName.text+kigouValue.text+sansyouName.text+sansyouArray[c];
                                        //var createComp = app.project.items.addComp(compName,W,H,compAspect,sakuseiArray.length/fps,fps);
                                        var createComp = app.project.items.addComp(compName,W,H,compAspect,sakuseiArray.length/fps,fps);
                                        createComp.preserveNestedFrameRate=true;
                                        for(var k=SEL.length-1;k>=0;k--)
                                            {
                                                if(SEL[k].name.indexOf(createComp.name.slice(-(sansyouName.text.length+sansyouNum.selection.text.length)))>-1)
                                                    {

                                                        var CCADlayer =createComp.layers.add(SEL[k]);
                                
                                                        CCADlayer.outPoint = 1/fps;

                                                        CCADlayer.startTime = Number((SEL[k].name.split(".")[0].slice(sakuName.text.length,Number(sakuNum.selection.text.length)+1)-1)/fps);

                                                        CCADlayer.property("ADBE Effect Parade").addProperty("ADBE Color Key")(1).setValue([32768,32768,32768]);

                                                    }
                                            }
                                    }
                }
                else
                {alert("作成セル名、参照セル名、桁数、記号欄のいずれかが間違っています")}
   
    
    }else{alert("素材を選択してください")}
app.endUndoGroup();
}
 //-----------------------------------------------------------------------------------------------------------------

//参照先の名称取得関数
function getREFname()
{   
app.beginUndoGroup("getREFname");

var ACT = app.project.activeItem;
var SEL = ACT.selectedLayers[0];
              if(ACT.selectedLayers.length!==0)
                    {
                        if(ACT.selectedLayers.length==1)
                            {
                                 REFvalue.text=SEL.name;
                            }else{alert("Please selcted one layer")}
                    } else(alert("Please selcted one layer"))

app.endUndoGroup();

}


//--------------------------------------------------------------------------------------------------
function MultipleCellCombination() 
    { 
        app.beginUndoGroup("MultipleCellCombination");
        var setAct = app.project.activeItem.selectedLayers;
    
                          if(REFvalue.text.match(/\S+/))
                            { 
                       
                                 for(var n = 0;n < setAct.length;n++)
                                    {
                                    var shift =Number(setAct[n].source.name.slice(Number(-sansyouNum.selection.text.length)));
                                    
                                        setAct[n].property("ADBE Transform Group").property("ADBE Opacity").expression=
                                            'NUM='+shift+';\r'+
                                            'fps=1/thisComp.frameDuration;\r'+
                                            'REFremap=Math.round(REF=thisComp.layer("'+REFvalue.text+'").timeRemap*fps)+1;\r'+
                                            'if(NUM==REFremap)\r'+
                                            '    {100}\r'+
                                            'else{0}'
                                            
                                      // alert(REFvalue)
                                    }
                            }else
                            {alert("targetCompに参照先レイヤー名を記述してください")}                        
                    
              
         app.endUndoGroup();
     }
     
     