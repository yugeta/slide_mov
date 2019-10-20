Slide-Mov.js
==
```
Author : Yugeta.Koji
Date   : 2019.10.09

History
  ver 1.0 : first-version
  ver 1.1 : auto-image-file-lists
```

# specificate
  - file-type 
    sound : mp3
    image : jpeg,png,svg
    text
  - animation
    zoom in,out
    pan holizontal,vertical
    fade in,out
  - time
    bgm-conform

# flow
  1. 

# howto
  1. set : HTML-tag
  2. set : SCRIPT-tag & instance
  3. set : Options

# options
  var slide_mov = $$slide_mov({

    // HTML内の各エレメント
    target    : {
      base    : "#movie_base",
      time    : "#movie_time",
      seek    : "#movie_seek",
      volume  : "#movie_volume"
    },

    // コントロールボタンの画像（デフォルトの場合は割愛）
    control_image : {
      play    : "img/play.svg",
      pause   : "img/pause.svg"
    },

    // スライド動画のシステムチェック感覚（小さくすると精度があがるがCPU不可が高くなる）
    intervalTime : 250,

    contents : {
      // mp3サウンドファイル（複数登録する場合は記述順番に再生される）
      sounds : [
        {"file" : "%ファイルの置いてあるパス" , "maxTime":"再生時間（登録しない場合はファイルの再生時間になる）"}
      ],
      images : [
        {"id":"登録しない場合は順番の値で登録される※0スタート"  , "group":"%複数の画像でグルーピングを行う際の任意タグ" , "file":"%ファイルの置いてあるパス"}
        *** animationsに"image-file"として登録することで、この項目を作成しなくてもいい(ver1.1)。
      ],
      texts  : []
    },
    animations : [
      {
        "in"  : %表示開始時間（秒）,
        "out" : %表示終了時間（秒）,
        "fi"  : フェイドイン（秒）,
        "fo"  : フェイドアウト（秒）,
        "fade-mode" : フェイドイン・アウトの挙動指定 ("":順次進行 , "cross":クロスフェード),
        "mode":"%動作モード（以下参照）",
        "modes":"*modeがrandomの時のみ使用可能（配列でrandomリストを指定できる）"
        "image_id":"%表示対象の画像を指定",
        "images_id":"%表示対象画像を複数してい（配列）"
        "sort":"*複数画像の表示順番 (sort:昇順 , reverse:降順 , random:ランダム)"
      }
    ]
	});
  【備考】
  - ファイルパスは、絶対パス、相対パス、URLのどれでも可能
  - 
  - 動作モード：
    * zoom-in    : ズームイン
    * zoom-out   : ズームアウト
    * move-right : 右に移動
    * move-left  : 左に移動
    * move-up    : 上に移動
    * move-down  : 下に移動
    * random     : 上記のどれかをランダムで選択


# program
  - sounds
    this.options.current_sound_id = %id%
    this.options.contents_sounds[...]
    this.options.contents_sounds[%id%].context
    this.options.contents_sounds[%id%].maxTime
    this.options.contents_sounds[%id%].source
    this.options.contents_sounds[%id%].buffer

  - images
    this.options.contents_images[]



# reference



# music-download-site
  - sampleのmp3データは、以下からDLしています。
    https://dova-s.jp/

  - sampleの画像データは、以下からDLしています。
    https://pixabay.com/ja/

  - icon(favicon)データは、以下からDLしています。
    https://www.flaticon.com/


# causion
  - 複数のsoundを再生する場合、soundの切り替え処理がintervalの感覚分誤差が発生する場合があるので、切り替えsound数が増えた際にanimationの指定秒数とずれ込む可能性があります。（厳密な秒数指定をしたい場合はsoundを１つにまとめたデータとして使用するとズレが発生しなくなります）

