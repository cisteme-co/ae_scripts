function frameRateKeep()
{
// プロジェクト内のすべてのコンポジションを取得
var compositions = app.project.items;

// 各コンポジションに対して処理
for (var i = 1; i <= compositions.length; i++) {
    var composition = compositions[i];

    // コンポジションのフレームレートを保持に設定
    composition.preserveNestedFrameRate = true;
}
alert("全てのコンポジションの"+"\r"+"「ネスト時またはレンダーキューでフレーレートを保持」"+"\r"+"チェックボックスをONにしました")
}
frameRateKeep();