// ;"use strict";
$$slide_mov = (function(){

  // デフォルトoptionsデータ
  var OPTIONS = {

    target : "#slide_mov",

    construction : {
      base : "div.slide-mov[data-base='slide-mov']",

      area_img   : "div.slide-mov div.area-image",
      area_text  : "div.slide-mov div.area-text",

      icon_play  : "div.slide-mov div.icon-play",
      icon_pause : "div.slide-mov div.icon-pause",
      icon_load  : "div.slide-mov div.icon-load",

      control    : "div.slide-mov div.control",
      ctl_seek   : "div.slide-mov div.control div.ctl-seek",
        ctl_seek_bg  : "div.slide-mov div.control div.ctl-seek div.bg",
        ctl_seek_bar : "div.slide-mov div.control div.ctl-seek div.bar",
      ctl_play   : "div.slide-mov div.control div.btn-group div.ctl-play",
      ctl_pause  : "div.slide-mov div.control div.btn-group div.ctl-pause",
      ctl_return : "div.slide-mov div.control div.btn-group div.ctl-return",
      ctl_space  : "div.slide-mov div.control div.btn-group div.ctl-space",
      ctl_time   : "div.slide-mov div.control div.btn-group div.ctl-space div.ctl-time",
      ctl_mute   : "div.slide-mov div.control div.btn-group div.ctl-mute",
      ctl_expand : "div.slide-mov div.control div.btn-group div.ctl-expand"
    },

    audioPlayFlg : false, // audioAPI仕様
    // auto_play    : false, // 自動再生機能
    // volume       : 2,

    current_sound_id : 0,
    intervalTime : 30,

    contents : {
      sounds : [],
      images : [],
      texts  : [],
    },

    contents_loadFiles : [],
    contents_sounds    : [],
    contents_images    : {},
    
    contentsLoaded : false,

    playData : {
      totalTime   : 0,
      currentTime : 0,
      playTime    : 0,
      pauseTime   : 0
    }
  };


  var LIB           = function(){};
  var SET           = function(){};
  var SET_ANIMATION = function(){};
  var SET_CONTENTS  = function(){};
  var SET_LOAD      = function(){};
  var VIEW          = function(){};
  var CONTROL       = function(){};
  var AUDIO         = function(){};
  var IMAGE         = function(){};
  var TEXT          = function(){};

  // ----------
  // Library

  

  // イベントリスナーセット
  LIB.prototype.event = function(target, mode, func , flg){
    flg = (flg) ? flg : false;
    if (target.addEventListener){target.addEventListener(mode, func, flg)}
    else{target.attachEvent('on' + mode, function(){func.call(target , window.event)})}
  };


  // URLの情報取得 (uri指定無し(default)はアドレスバーのURL)
  LIB.prototype.urlinfo = function(uri){
    uri = (uri) ? uri : location.href;
    var urls_hash  = uri.split("#");
    var urls_query = urls_hash[0].split("?");
    var sp   = urls_query[0].split("/");
    return {
    uri      : uri,
    url      : sp.join("/"),
    dir      : sp.slice(0 , sp.length-1).join("/") +"/",
    file     : sp.pop(),
    domain   : sp[2],
    protocol : sp[0].replace(":",""),
    hash     : (urls_hash[1]) ? urls_hash[1] : "",
    query_str: (typeof urls_query[1] !== "undefined") ? urls_query[1] : "",
    query    : this.urlquery(urls_query[1])
    };
  };

  // urlクエリをkey=valueに変換して返す
  LIB.prototype.urlquery = function(que){
    if(que === undefined || que === ""){return ""}
    var res = {};
    var arr = que.replace("?","").split("&").map(function(key){
      var d = key.split("=");
      return {"key":d[0],"value":d[1]};
    });
    for(var i in arr){
      res[arr[i].key] = arr[i].value;
    }
    return res;
  };


  // ページ読み込みを待って起動
  LIB.prototype.construct = function(func){
    switch(document.readyState){
      case "complete"    : func();break;
      case "interactive" : this.event(window , "DOMContentLoaded" , func);break;
      default            : this.event(window , "load" , func);break;
    }
  };


  // 起動jsファイルと同じファイル名のcssを読み込む
  LIB.prototype.setCss = function(){
    if(!this.script){return;}
    var head = document.getElementsByTagName("head");
    var base = (head) ? head[0] : document.body;
console.log(this.script);
    var urlinfo = this.urlinfo(this.script);
    var css  = document.createElement("link");
    css.rel  = "stylesheet";
    css.type = "text/css";
    var target_css = urlinfo.dir + urlinfo.file.replace(".js",".css");
    css.href = target_css +"?"+ urlinfo.query_str;
    base.appendChild(css);
  };


  // optionsの初期設定
  LIB.prototype.getBuildOptions = function(options,options_default){
    var newOptions = {};
    if(options_default){
      for(var i in options_default){
        newOptions[i] = options_default[i];
      }
    }
    if(options){
      for(var i in options){
        newOptions[i] = options[i];
      }
    }
    return newOptions;
  };


  // 配列の指定の箇所の値に、別の配列を入れ込む
  LIB.prototype.array_merge = function(arr_base , arr_add , num){
    var arr_before = arr_base.slice(0 , num);
    var arr_after  = arr_base.slice(num+1);
    return [].concat(arr_before,arr_add,arr_after);
  };

  // 起動scriptタグを選択(async=trueのタグには適用できない) *ビルド時に文字列に変換（上書き）
  LIB.prototype.script = (function(scripts,query){
    if(query){
      var elm = document.querySelector(query);
      if(elm){
        return elm;
      }
    }
    return scripts[scripts.length-1].src;
  })(document.getElementsByTagName("script") , "#slide_mov.js");
  
  // タイムラインの時間表示フォーマット
  // mode @ ["" , "micro-second"]
	LIB.prototype.setFormatTime = function(time , mode){
    // 読み込み前
    if(time === null){
      switch(mode){
        case "micro-second":
          return "-- : -- : --";
        default : 
          return "-- : --";
      }
    }
    mode = (mode) ? mode : "";
		var time2 = parseInt(time * 10 , 10) /10;
		var m = parseInt(time2 / 60 , 10);
		m = (m < 10) ? "0" + m.toFixed() : m.toFixed();
		var s = parseInt(time2 % 60 , 10);
    s = (s < 10) ? "0" + s.toFixed() : s.toFixed();
    if(mode === "micro-second"){
      var ms = parseInt((time % 1) * 100 , 10);
      ms = (ms < 10) ? "0" + ms.toFixed() : ms.toFixed();
      return m +":"+ s +":"+ ms;
    }
    else{
      return m +":"+ s;
    }
  };

  // selectorからエレメントを追加作成する（改装対応）
  LIB.prototype.addSelector = function(parent , selector){
    if(!selector){return false}

    // タグの取得
    var selectorInfo = this.selectorInfo(selector);
    if(!selectorInfo || !selectorInfo.length){return false}

    // 階層構造でエレメントを作成
    for(var i=0; i<selectorInfo.length; i++){

      var check = parent.querySelector(selectorInfo[i].input);
      if(check){
        parent = check;
        continue;
      }

      // タグの作成
      var tag = document.createElement(selectorInfo[i].tag);

      // 属性の登録
      if(selectorInfo[i].attrs){
        for(var j=0; j<selectorInfo[i].attrs.length; j++){
          if(!selectorInfo[i].attrs[j].key || !selectorInfo[i].attrs[j].val){continue}
          tag.setAttribute(selectorInfo[i].attrs[j].key , selectorInfo[i].attrs[j].val);
        }
      }

      parent.appendChild(tag);
      parent = tag;
    }
    return true;
  }
  
  // selectorからエレメントを作成する
  LIB.prototype.makeSelector = function(selector){
    if(!selector){return null}

    // タグの取得
    var selectorInfo = this.selectorInfo(selector);
    if(!selectorInfo || !selectorInfo.length){return}

    // 階層構造でエレメントを作成
    var res = null;
    for(var i=0; i<selectorInfo.length; i++){
      // タグの作成
      var tag = document.createElement(selectorInfo[i].tag);

      // 属性の登録
      if(selectorInfo[i].attrs){
        for(var j=0; j<selectorInfo[i].attrs.length; j++){
          if(!selectorInfo[i].attrs[j].key || !selectorInfo[i].attrs[j].val){continue}
          tag.setAttribute(selectorInfo[i].attrs[j].key , selectorInfo[i].attrs[j].val);
        }
      }

      // 最上位以外は子階層にappendする
      if(i===0){
        res = tag;
      }
      else{
        res.attributes(tag);
      }
    }
    return res;
  };

  // selectorから各種情報を取得
  LIB.prototype.selectorInfo = function(selector){
    selector  = selector.replace(/>/g," ");
    selector  = selector.replace(/\s+/g," ");
    selectors = selector.split(" ");
    var return_array = [];
    for(var i=0; i<selectors.length; i++){
      selectors[i].match(/^(.*?)([\.\#\:])(.*?)(\[(.+?)=['"](.+?)['"]\])*?$/);
      var tag = ((RegExp.$1) ? RegExp.$1 : "span").toLowerCase();
      var type = (function(str){
        switch(str){
          case ".":return "class";
          case "#":return "id";
          case ":":
          default:return "";
        }
      })(RegExp.$2);
      var attrs = [];
      var attr = ((RegExp.$3) ? RegExp.$3 : "").toLowerCase();
      if(attr && type){
        attrs.push({
          key : type,
          val : attr
        });
      }
      var attr2 = (RegExp.$5 && RegExp.$6) ? {key:RegExp.$5 , val:RegExp.$6} : null;
      if(attr2){
        attrs.push(attr2);
      }
      return_array.push({
        input : selectors[i],
        tag   : tag,
        attrs : attrs
      });
    }
    return return_array;
  };

  // 任意桁数による四捨五入処理（小数誤差防止用）
  // number : 丸める数値
  // digits : 桁数 (default : 3桁)
  LIB.prototype.adjustDecimal = function(number , digits){
    if(!number){return 0;}
    number = Number(number);
    digits = (digits) ? digits : 3;
    digit = Math.pow(10 , digits);
    return Math.round(number * digit) / digit;
  };

  //指定したエレメントの座標を取得
	LIB.prototype.pos = function(e,t){

		//エレメント確認処理
		if(!e){return null;}

		//途中指定のエレメントチェック（指定がない場合はbody）
		if(typeof(t)=='undefined' || t==null){
			t = document.body;
		}

		//デフォルト座標
		var pos={x:0,y:0};
		do{
			//指定エレメントでストップする。
			if(e == t){break}

			//対象エレメントが存在しない場合はその辞典で終了
			if(typeof(e)=='undefined' || e==null){return pos;}

			//座標を足し込む
			pos.x += e.offsetLeft;
			pos.y += e.offsetTop;
		}

		//上位エレメントを参照する
		while(e = e.offsetParent);

		//最終座標を返す
		return pos;
  };
  
  // 表示開始データ(in)の順番に並べる（無い場合は0扱い）
  LIB.prototype.sortData = function(main){
    if(typeof main.options.animations === "undefined"){return}
    main.options.animations.sort(function(a,b){
      var a_in = (typeof a.in !== "undefined") ? a.in : 0;
      var b_in = (typeof b.in !== "undefined") ? b.in : 0;
      return a_in - b_in;
    });
  };

  


  

  // ----------
  // MAIN : 初期設定、基本データ格納用
  var MAIN = function(options){
    var main  = this;
    var lib   = new LIB();
    
    // cssの自動読み込み
    lib.setCss();

    // 格納用データの設置
    main.options = lib.getBuildOptions(options,OPTIONS);

    // ページonloadでビルド作業実行
    lib.construct((function(e){this.init()}).bind(this));
  };

  // 初期設定 (after page onloaded)
  MAIN.prototype.init = function(){
    var main     = this
    var set      = new SET();
    var set_anim = new SET_ANIMATION();
    var set_cont = new SET_CONTENTS();
    var set_load = new SET_LOAD();
    // var view     = new VIEW();

    // optionデータチェック
    if(!main.options|| !main.options.target){
      console.log("Error : no-target. ");
      return;
    }

    // make-element
    main.make_element(main);

    // animationセット（コンテンツデータがある場合はoption.contentsにセット）
    if(typeof main.options.animations !== "undefined" && main.options.animations.length){
      set.pickupDatas(main);
      set_anim.animation(main);
      set_anim.animations(main);
    }

    // 設定データをサーバーから読み込み(コンテンツデータセット)
    if(typeof main.options.contents !== "undefined"){
      set_cont.contents(main);
    }

    // event
    set.events(main);

    // コンテンツ読み込み開始 : data-loading-start
    if(main.options.contents_loadFiles.length > 0){
      set_load.loading_contents(main);
    }

  };

  // 画像エリアと文字列エリアを作成
  MAIN.prototype.make_element = function(main){
    var lib = new LIB();

    var base = document.querySelector(main.options.target);

    for(var i in main.options.construction){
      lib.addSelector(base , main.options.construction[i]);
    }

    // play/pause表示処理
    if(main.options.auto_play === true){
      new CONTROL().play_pause(main,"play");
    }
    else{
      new CONTROL().play_pause(main,"pause");
    }
    
  };





  // ----------
  // SET : セッティング

  // animationsデータから画像データとテキストデータを抽出する
  SET.prototype.pickupDatas = function(main){
    var set = this;

    // animation->(pictures or texts)
    if(typeof main.options.animations === "undefined"){return}

    main.options.contents = (typeof main.options.contents !== "undefined") ? main.options.contents : {};

    // image
    set.pickupDatas_image(main);
    // images
    set.pickupDatas_images(main);
    // text
    set.pickupDatas_text(main);
    // sound
    set.pickupDatas_sound(main);
  };

  SET.prototype.pickupDatas_image = function(main){
    if(typeof main.options.contents.images === "undefined"){return false}
    var cache = [];
    for(var i=0; i<main.options.animations.length; i++){
      // pictures
      if(typeof main.options.animations[i].image_file !== "undefined"
      && main.options.animations[i].image_file){
        if(cache.indexOf(main.options.animations[i].image_file) !== -1){continue}
        var id = "anim_" + i;
        main.options.contents.images.push({
          "id"   : id,
          "file" : main.options.animations[i].image_file
        });
        main.options.animations[i].image_id = id;
        cache.push(main.options.animations[i].image_file);
      }
    }
    return true;
  };

  SET.prototype.pickupDatas_images = function(main){
    if(typeof main.options.animations === "undefined"){return false}
    if(typeof main.options.contents.images === "undefined"){main.options.contents.images = []}
    var cache = [];
    for(var i=0; i<main.options.animations.length; i++){
      if(typeof main.options.animations[i].image_files !== "undefined"
      && main.options.animations[i].image_files){
        var ids = [];
        for(var j=0; j<main.options.animations[i].image_files.length; j++){
          if(cache.indexOf(main.options.animations[i].image_files[j]) !== -1){continue}
          var id = "anim_" + i +"_"+ j;
          main.options.contents.images.push({
            "id"   : id,
            "file" : main.options.animations[i].image_files[j]
          });
          cache.push(main.options.animations[i].image_files[j]);
          ids.push(id);
        }
        main.options.animations[i].images_id = ids;
      }
    }
    return true;
  };

  SET.prototype.pickupDatas_text = function(main){
    if(typeof main.options.contents.texts === "undefined"){main.options.contents.texts = []}
    for(var i=0; i<main.options.animations.length; i++){

      // animations -> contents_texts
      if(typeof main.options.animations[i].text !== "undefined"
      && main.options.animations[i].text){
        var id = "anim_" + i;
        var data = {
          "id"   : id,
          "text" : main.options.animations[i].text
        };
        var keys = [
          "top","bottom","left","right",
          "width","height",
          "font-size","color","weight","align","style"
        ];
        if(typeof main.options.animations[i].style_data !== "undefined"){
          for(var j=0; j<keys.length; j++){
            if(typeof main.options.animations[i].style_data[keys[j]] !== "undefined"){
              data[keys[j]] = main.options.animations[i].style_data[keys[j]];
            }
          }
        }
        main.options.contents.texts.push(data);
        main.options.animations[i].text_id = id;
      }

      // contents_texts -> animations
      else if(typeof main.options.animations[i].text_id !== "undefined"
      && main.options.animations[i].text_id){
        (function(main,data){
          if(typeof main.options.contents.texts !== "undefined"){
            for(var i=0; i<main.options.contents.texts.length; i++){
              if(main.options.contents.texts[i].id == data.text_id){
                for(var j in main.options.contents.texts[i]){
                  data[j] = main.options.contents.texts[i][j]
                }
                break;
              }
            }
          }
        })(main , main.options.animations[i]);
      }
    }
    return true;
  };

  SET.prototype.pickupDatas_sound = function(main){
    if(typeof main.options.animations === "undefined"){return false}
    if(typeof main.options.contents.sounds === "undefined"){main.options.contents.sounds = []}
    var cache = [];
    for(var i=0; i<main.options.animations.length; i++){
      if(typeof main.options.animations[i].sound_file !== "undefined"
      && main.options.animations[i].sound_file){
        if(cache.indexOf(main.options.animations[i].sound_file) !== -1){continue}
        var _in = (typeof main.options.animations[i].in  !== "undefined") ? Number(main.options.animations[i].in)  : 0;
        var out = (typeof main.options.animations[i].out !== "undefined") ? Number(main.options.animations[i].out) : 0;
        main.options.contents.sounds.push({
          "file" : main.options.animations[i].sound_file,
          "maxTime" : (out - _in)
        });
        main.options.animations[i].sound_id = main.options.contents.sounds.length -1;
        cache.push(main.options.animations[i].sound_file);
      }
    }
    return true;
  };

  // contens順（再生の早い順）に時間調整を行う
  SET.prototype.pickupDatas_sound_loaded = function(main){
    if(typeof main.options.animations === "undefined"){return}
    if(typeof main.options.contents_sounds === "undefined"){return}

    var lib = new LIB();

    // content順処理(totalTimeが無い場合はdirationを差し込む)
    for(var i=0; i<main.options.contents_sounds.length; i++){
      var sound    = main.options.contents_sounds[i];
      var duration = sound.context.buffer.duration;
      if(!sound.context.totalTime || sound.context.totalTime<=0){
        sound.context.totalTime = duration;
      }
    }

    // animations調整(in,outの指定が無い場合に値を設定する)
    var _in = 0;
    // var out = 0;
    for(var i=0; i<main.options.animations.length; i++){
      var anim = main.options.animations[i];
      // type:sound以外は処理しない
      if(new VIEW().view_animations_checkType(anim) !== "sound"){continue;}

      if(typeof anim.in === "undefined"){
        anim.in = _in;
      }
      if(typeof anim.out === "undefined"){
        if(typeof anim.between !== "undefined"
        && anim.between < anim.totalTime){
          anim.out = anim.in + anim.between;
        }
        else{
          anim.out = anim.in + anim.totalTime;
        }
        _in = anim.out;
      }
    }

    // 並べ替え
    lib.sortData(main);
  };

  

  // Event
  SET.prototype.events = function(main){
    var lib     = new LIB();
    var control = new CONTROL();

    // 画面拡大処理
    var expand = document.querySelector(main.options.construction.ctl_expand);
    if(expand){
      lib.event(expand , "click" , (function(main){
        control.clickExpand(main);
      }).bind(this,main));
    }

    // 再生処理
    var play = document.querySelector(main.options.construction.ctl_play);
    if(play){
      lib.event(play , "click" , (function(main){
        main.options.audioPlayFlg = true; // audioAPIの仕様(イベント後にしか再生できない)
        control.play_pause(main , "play");
      }).bind(this,main));
    }

    // 停止処理
    var pause = document.querySelector(main.options.construction.ctl_pause);
    if(pause){
      lib.event(pause , "click" , (function(main){
        control.play_pause(main , "pause");
      }).bind(this,main));
    }

    // 動画を始めに戻す処理
    var restart = document.querySelector(main.options.construction.ctl_return);
    if(restart){
      lib.event(restart , "click" , (function(main){
        control.clickReturn(main);
      }).bind(this,main));
    }

    // // // volume
    // // var volume = document.querySelector(main.options.target.volume);
    // // if(volume){
    // //   lib.event(volume , "click" , (function(e){this.clickVolume(e);}).bind(this));
    // //   volume.setAttribute("data-volume",main.options.default.volume);
    // // }

    // mute
    var mute = document.querySelector(main.options.construction.ctl_mute);
    if(mute){
      lib.event(mute , "click" , (function(main,e){new CONTROL().clickMute(main,e);}).bind(this,main));
    }

    // // 画面クリックで再生・停止処理
    // var base = document.querySelector(main.options.construction.base);
    // if(base){
    //   lib.event(base , "click" , (function(main,e){
    //     new CONTROL().play_pause(main);
    //     new CONTROL().click_base(main);
    //   }).bind(this,main));
    //   lib.event(base , "mouseover" , (function(main,e){
    //     new CONTROL().play_pause(main);
    //   }).bind(this,main));
    //   lib.event(base , "mouseout"  , (function(main,e){
    //     new CONTROL().pauseButton_fadeout(main);
    //   }).bind(this,main));
    // }

    // seek
    var seek = document.querySelector(main.options.construction.ctl_seek);
    if(seek){
      lib.event(seek , "click" , (function(main,e){
        main.options.audioPlayFlg = true;
        control.click_seek(main,e);
      }).bind(this,main));

    }

    // lib.event(window , "keydown" , (function(main){this.keydown(main)}).bind(this,main));
  };

  // animations情報から、movieのmaxTimeを取得する
  SET.prototype.getAnimation_totalTime = function(main){
    if(typeof main.options.animations === "undefined"
    || !main.options.animations
    || !main.options.animations.length){return null;}

    var totalTime = 0;
    for(var i=0; i<main.options.animations.length; i++){
      if(typeof main.options.animations[i].out === "undefined"){continue;}
      if(Number(totalTime) > Number(main.options.animations[i].out)){continue}
      totalTime = Number(main.options.animations[i].out);
    }
    return totalTime;
  };

  




  // ----------
  // SET_ANIMATION : animation設定のビルド処理

  // animationのセット
  SET_ANIMATION.prototype.animation = function(main){
    if(!main.options.animations || !main.options.animations.length){return;}

    var lib = new LIB();
    var set = this;
    var set_animation = new SET_ANIMATION();

    for(var i=0; i<main.options.animations.length; i++){
      if(typeof main.options.animations[i].images_id === "undefined"
      || !main.options.animations[i].images_id
      || !main.options.animations[i].images_id.length){continue;}

      var images_id = main.options.animations[i].images_id;
      var sort = (typeof main.options.animations[i].sort !== "undefined") ? main.options.animations[i].sort : "";
      main.options.animations[i].images_id = set.images_sort(images_id , sort);

      var image_datas = (function(data){
        data.in  = (data.in)  ? data.in  : 0;
        data.out = (data.out) ? data.out : 0;
        var face_mode = (typeof data["fade-mode"] !== "undefined") ? data["fade-mode"] : "";
        var datas = [];
        switch(face_mode){
          case "cross":
            datas = set_animation.animation_cross(JSON.stringify(data));
            break;
            
          default : 
            datas = set_animation.animation_normal(JSON.stringify(data));
            break;
        }
        return datas;
      })(main.options.animations[i]); 
      if(!image_datas){
        main.options.animations.splice(i,0);
        continue;
      }

      main.options.animations = lib.array_merge(main.options.animations , image_datas , i);
      i = i + image_datas.length - 1;
    }
  };

  // 通常時間処理
  SET_ANIMATION.prototype.animation_normal = function(cache){
    var lib = new LIB();

    var data = JSON.parse(cache);
    var datas = [];
    var start_sec = data.in;
    var step_sec  = (data.out - data.in) / data.images_id.length;
    step_sec = lib.adjustDecimal(step_sec);
    for(var i=0; i<data.images_id.length; i++){
      var newData = JSON.parse(cache);
      newData.image_id = data.images_id[i];
      newData.in  = i * step_sec + start_sec;
      newData.in  = lib.adjustDecimal(newData.in);
      newData.out = (i+1) * step_sec + start_sec;
      newData.out = lib.adjustDecimal(newData.out);
      delete newData.images_id;
      datas.push(newData);
    }
    return datas;
  };

  // crossフェード処理の時間計算
  SET_ANIMATION.prototype.animation_cross = function(cache){
    var lib = new LIB();

    var data = JSON.parse(cache);
    var datas = [];
    var start_sec = data.in;
    var between   = data.out - data.in;
    var fade_sec  = (data.fi * data.images_id.length) + data.fo;
    fade_sec = lib.adjustDecimal(fade_sec);
    if((data.out - data.in) < fade_sec){
      data.fi = data.fo = between / (data.images_id.length + 1) / 2;
      data.fi = lib.adjustDecimal(data.fi);
    }
    var step_sec  = (between - fade_sec) / (data.images_id.length);
    step_sec = lib.adjustDecimal(step_sec);
    for(var i=0; i<data.images_id.length; i++){
      var newData = JSON.parse(cache);
      newData.image_id = data.images_id[i];
      newData.in  = i * (step_sec + data.fi) + start_sec;
      newData.in  = lib.adjustDecimal(newData.in);
      newData.out = (i+1) * (step_sec + data.fi) + data.fo + start_sec;
      newData.out = lib.adjustDecimal(newData.out);
      delete newData.images_id;
      datas.push(newData);
    }
    return datas;
  };

  // ソート処理
  SET_ANIMATION.prototype.images_sort = function(lists , sort){
    if(!sort){return lists}
    switch(sort){
      case "sort":
        return lists;
      case "reverse":
        return lists.reverse();
      case "random":

        for(var i = lists.length - 1; i > 0; i--){
          var r = Math.floor(Math.random() * (i + 1));
          var tmp = lists[i];
          lists[i] = lists[r];
          lists[r] = tmp;
        }
        return lists;
      default :
        return lists;
    }
  };

  SET_ANIMATION.prototype.animations = function(main){
    // animation
    if(!main.options.animations.length){
      main.options.animations = [];
      return;
    }

    var lib = new LIB();

    for(var i=0; i<main.options.animations.length; i++){
      if(typeof main.options.animations[i].image_id === "undefined"
      && typeof main.options.animations[i].text === "undefined"){continue}

      if(typeof main.options.animations[i].fi === "undefined" || !main.options.animations[i].fi){
        main.options.animations[i].fi = 0;
      }
      if(typeof main.options.animations[i].fo === "undefined" || !main.options.animations[i].fo){
        main.options.animations[i].fo = 0;
      }

      // fade-in,outが画像の表示時間を超えている場合は自動的に調整する。
      var total_sec = main.options.animations[i].out - main.options.animations[i].in;
      total_sec     = lib.adjustDecimal(total_sec);
      var fade_sec  = main.options.animations[i].fi  + main.options.animations[i].fo;
      fade_sec      = lib.adjustDecimal(fade_sec);
      if(total_sec < fade_sec){
        main.options.animations[i].fi = main.options.animations[i].fo = total_sec / 2;
        main.options.animations[i].fi = lib.adjustDecimal(main.options.animations[i].fi);
      }
    }
    // 表示順に並べ替え
    lib.sortData(main);
  };

  



  // ----------
  // SET_CONTENTS : コンテンツのセット

  // 設定データ(options)から、コンテンツデータの読み込み(sound,pictures(wall,other...),texts,timeline)のキャッシュデータを作成する
  SET_CONTENTS.prototype.contents = function(main){
    if(typeof main.options.contents === "undefined" || !main.options.contents){return}
    var data = main.options.contents;
    var set_contents = this;

    // sound
    var res = set_contents.contents_sound(data);
    if(res && res.length){
      main.options.contents_loadFiles = main.options.contents_loadFiles.concat(res);
    }

    // images
    var res = set_contents.contents_image(data , main);
    if(res && res.length){
      main.options.contents_loadFiles = main.options.contents_loadFiles.concat(res);
    }
  };

  // audio
  SET_CONTENTS.prototype.contents_sound = function(data){
    var datas = [];
    if(typeof data.sounds !== "undefined"){
      for(var i=0; i<data.sounds.length; i++){
        if(typeof data.sounds[i].file === "undefined" || !data.sounds[i].file){continue}
        data.sounds[i].type = "sound";
        data.sounds[i].id = i;
        datas.push(data.sounds[i]);
      }
    }
    return datas;
  };

  // images
  SET_CONTENTS.prototype.contents_image = function(data , main){
    if(typeof data.images === "undefined"){return []}
    var set_contents = this;

    var datas = [];
    for(var i=0; i<data.images.length; i++){
      if(typeof data.images[i].file === "undefined" || !data.images[i].file){continue}
      data.images[i].type = "image";
      data.images[i].id   = (typeof data.images[i].id !== "undefined") ? data.images[i].id : i;
      if(!set_contents.checkAnimationInImageData(data.images[i].id , main.options.animations)){continue;}
      main.options.contents_loadFiles.push(data.images[i]);
    }
    return datas;
  };


  // animationデータにimageが含まれているかチェック（含まれていない場合は読み込みをしない）
  SET_CONTENTS.prototype.checkAnimationInImageData = function(image_id , anims){
    for(var i=0; i<anims.length; i++){
      if(typeof anims[i].image_id !== "undefined" && anims[i].image_id == image_id){return true;}
    }
    return false;
  };



  // ----------
  // SET_LOAD : コンテンツ読み込み読み込み処理

  // コンテンツデータを順番に読み込む
  SET_LOAD.prototype.loading_contents = function(main){
    var set_load = this;
    
    // 全てのコンテンツを読み込み完了
    if(main.options.contents_loadFiles.length === 0){
      set_load.loading_end(main);
    }

    // 継続して次のコンテンツを読み込む
    else{
      var data = main.options.contents_loadFiles.shift();
      switch(data.type){
        case "sound":
          set_load.loading_sound(main,data);
          break;
        case "image":
          set_load.loading_image(main,data);
          break;
      }
    }
  };

  SET_LOAD.prototype.loading_end = function(main){
    var view = new VIEW();
    var set  = new SET();

    var icon_load = document.querySelector(main.options.construction.icon_load);
    // icon_load.parentNode.removeChild(icon_load);
    icon_load.setAttribute("data-hidden" , "1");
    
    main.options.playData.totalTime = new SET().getAnimation_totalTime(main);

    view.time(main);

    // 全ての読み込みが完了した際にsound時間の調整を行う
    set.pickupDatas_sound_loaded(main);

    console.log("Complete : Contents loaded !!!");
    console.log(main.options);
  };

  // imageの読み込み処理（読み込み完了後に次のload処理に遷移）
  SET_LOAD.prototype.loading_image = function(main , data){
      if(typeof data.file === "undefined"){return;}
      var img = new Image();

      img.onload = (function(main){
        var set_load = this;
        set_load.loading_contents(main);
      }).bind(this,main);
      img.src = data.file;
      img.setAttribute("class" , "pics");
      img.setAttribute("data-id" , data.id);
      img.setAttribute("data-group" , (typeof data.group !== "undefined") ? data.group : "");
      main.options.contents_images[data.id] = img;
  };

  // soundの読み込み処理（読み込み完了後に次のload処理に遷移）
  SET_LOAD.prototype.loading_sound = function(main , data){
    var set_load = this;
    var request = new XMLHttpRequest();
    request.open('GET', data.file, true);
    request.responseType = 'arraybuffer';
    request.onload = (function(main,data,e){
      if(set_load.loading_sound_check(e.target) !== true){return;}
      set_load.loading_sound_onload(main , data , e.target);
    }).bind(this,main,data);
    request.send();
  };

  SET_LOAD.prototype.loading_sound_check = function(target){
    var set_load = this;

    switch(target.status){
      case 200:
        return true;
      case 404:
        console.log("Error : File not found. ("+ target.responseURL +")");
        set_load.loading_contents(main);
        return false;
      default:
        set_load.loading_contents(main);
        return false;
    }
  };

  SET_LOAD.prototype.loading_sound_onload = function(main , data , target){
    var set_load = this;

    var sounds = main.options.contents_sounds;
    sounds[data.id] = {};
    sounds[data.id].context = new (window.AudioContext || window.webkitAudioContext)();
    sounds[data.id].context.decodeAudioData(target.response, (function(main,data,buffer){
      set_load.loading_sound_buffer(main,data,buffer);
    }).bind(this , main , data));
  };

  SET_LOAD.prototype.loading_sound_buffer = function(main , data , buffer){
    var set_load = this;

    var sound = main.options.contents_sounds[data.id];
    sound.context.buffer = buffer;

    var maxTime     = (typeof data.maxTime !== "undefined" && data.maxTime) ? Number(data.maxTime) : 0;
    var duration    = (buffer.duration) ? Math.ceil(buffer.duration * 1000) / 1000 : 0;
    var totalTime   = (maxTime && maxTime < duration) ? maxTime : duration;
    sound.context.totalTime = totalTime;
    sound.context.playTime  = 0;
    sound.context.pauseTime = 0;
    sound.context.gainValue = 1;
    sound.id = data.id;
    
    set_load.loading_sound_setAnimations(main , data , totalTime);
    set_load.loading_contents(main);
  };

  // 読み込み完了したサウンドデータをアニメーション設定する。
  SET_LOAD.prototype.loading_sound_setAnimations = function(main , data , totalTime){
    if(typeof main.options.animations === "undefined"){main.options.animations = []}
    var lib = new LIB();

    var sounds = main.options.contents_sounds;
    var add = (function(sounds){
      if(sounds.length <= 1){return 0;}
      var calc = 0;
      for(var i=sounds.length-2; i>=0; i--){
        calc += sounds[i].totalTime;
      }
      return lib.adjustDecimal(calc);
    })(sounds);
    var _in = add;
    var out = lib.adjustDecimal(add + totalTime);

    for(var i=0; i<main.options.animations.length; i++){
      if(typeof main.options.animations[i].sound_file === "undefined"){continue;}
      if(main.options.animations[i].sound_file === data.file){
        main.options.animations[i].totalTime = totalTime;
        main.options.animations[i].sound_id = data.id;
        return;
      }
    }

    main.options.animations.push({
      in  : _in,
      out : out,
      sound_id : data.id
    });

  };



  // ----------
  // VIEW : 表示系処理

  VIEW.prototype.time = function(main){
    var movieTime = document.querySelector(main.options.construction.ctl_time);
    if(!movieTime){return;}

    var progressTime = (main.options.playData.playTime) ? ((+new Date()) - main.options.playData.playTime) : 0;
    var lib = new LIB();
    var control = new CONTROL();
    var view = this;

    main.options.playData.currentTime = lib.adjustDecimal(progressTime / 1000);
    var currentTime = lib.setFormatTime(main.options.playData.currentTime , "micro-second");
    var totalTime   = lib.setFormatTime(main.options.playData.totalTime   , "micro-second");
// console.log(main.options.playData.playTime+"/"+progressTime+"/"+currentTime);

    // check-maxTime-over -> fix(end proc)
    if(progressTime / 1000 >= main.options.playData.totalTime){
      control.play_pause(main , "pause");
      main.options.playData.currentTime =  main.options.playData.totalTime;
      currentTime = totalTime;
    }
    else{
      // animation
      view.view_animations(main , progressTime);
    }

    // 時間表示
    movieTime.innerHTML = currentTime +" / "+ totalTime;

    // time-bar
    view.bar(main);
  };
  VIEW.prototype.time_halfway = function(main , seekTime){
    var movieTime = document.querySelector(main.options.construction.ctl_time);
    if(!movieTime){return;}
    var lib = new LIB();

    main.options.playData.currentTime = lib.adjustDecimal(seekTime);
    var currentTime = lib.setFormatTime(main.options.playData.currentTime , "micro-second");
    var totalTime   = lib.setFormatTime(main.options.playData.totalTime   , "micro-second");

    // check-maxTime-over -> fix(end proc)
    if(seekTime >= main.options.playData.totalTime){
      main.options.playData.currentTime =  main.options.playData.totalTime;
      currentTime = totalTime;
    }

    // 時間表示
    movieTime.innerHTML = currentTime +" / "+ totalTime;

    // 途中開始処理
    main.options.playData.pauseTime = (+new Date()) + (seekTime * 1000);
    main.options.playData.playTime  = (+new Date());

    // seek-bar表示
    this.bar(main);
  };


  VIEW.prototype.bar = function(main){
    var currentTime = main.options.playData.currentTime;
    var totalTime   = main.options.playData.totalTime;
    var par = currentTime / totalTime * 100;
    var bar = document.querySelector(main.options.construction.ctl_seek_bar);
    if(!bar){return}
    bar.style.setProperty("width" , par + "%","");
  };

  // 個別データから、でーたのタイプを取得する
  // return @ image , text , sound
  VIEW.prototype.view_animations_checkType = function(data){
    // 既に分類済みの場合
    // if(typeof data.type !== "undefined" && data.type){return data.type}

    // image
    if(typeof data.image_id !== "undefined"){
      return "image";
    }

    // text
    if(typeof data.text_id !== "undefined"){
      return "text";
    }

    // sound
    if(typeof data.sound_id !== "undefined"){
      return "sound";
    }
  };

  // animations
  VIEW.prototype.view_animations = function(main){
    var anim  = main.options.animations;
    var time  = main.options.playData.currentTime;
    var view  = this;
    var image = new IMAGE();
    var text  = new TEXT();
    var audio = new AUDIO();

    // 時間内のデータを抽出（時間の後ろになるものから条件判定する）
    for(var i=0; i<anim.length; i++){

      // out
      if(typeof anim[i].out !== "undefined"
      && Number(anim[i].out) <= Number(time)){
        switch(view.view_animations_checkType(anim[i])){
          case "image":
            image.image_out(main , anim[i]);
            break;
          case "text":
            text.text_out(main , anim[i]);
            break;
          case "sound":
            audio.sound_out(main , anim[i]);
            break;
        }
      }

      // fade-out
      else if(typeof anim[i].fo !== "undefined"
      && Number(anim[i].out - anim[i].fo) <= Number(time)){
        // anim[i].fo = null;
        switch(view.view_animations_checkType(anim[i])){
          case "image":
            image.image_fo(main , anim[i]);
            break;
          case "text":
            text.text_fo(main , anim[i]);
            break;
          case "sound":
            audio.sound_fo(main , anim[i]);
            break;
        }
      }

      // in
      else if(typeof anim[i].in !== "undefined"
      && Number(anim[i].in) <= Number(time)){
        switch(view.view_animations_checkType(anim[i])){
          case "image":
            image.image_in(main , anim[i]);
            break;
          case "text":
            text.text_in(main , anim[i]);
            break;
          case "sound":
            audio.sound_in(main , anim[i]);
            break;
        }
      }

      // other-remove
      else{
        switch(this.view_animations_checkType(anim[i])){
          case "image":
            image.image_out(main , anim[i]);
            break;
          case "text":
            text.text_out(main , anim[i]);
            break;
          // case "sound":
          //   // this.view_sound_out(main , anim[i]);
          //   break;
        }
      }
    }
  };

  VIEW.prototype.view_animations_halfway = function(main , seekTime){
    var anim = main.options.animations;
    var view = this;

    // 画面を一旦クリア
    var base = document.querySelector(main.options.construction.base);
    if(!base){return;}

    // imageクリア
    var area_img  = base.querySelector(main.options.construction.area_img);
    area_img.innerHTML = "";

    // textクリア
    var area_text = base.querySelector(main.options.construction.area_text);
    area_text.innerHTML = "";

    // soundクリア
    new AUDIO().reset(main);


    // 時間内のデータを抽出（時間の後ろになるものから条件判定する）
    for(var i=0; i<anim.length; i++){
      var _in = (typeof anim[i].in  !== "undefined") ? Number(anim[i].in)  : 0;
      var out = (typeof anim[i].out !== "undefined") ? Number(anim[i].out) : 0;
      // targets(in-out)
      if(_in <= seekTime && out >= seekTime){
        switch(view.view_animations_checkType(anim[i])){
          case "image":
            new IMAGE().image_halfway(main , anim[i] , seekTime);
            break;
          case "text":
            new TEXT().text_halfway(main , anim[i] , seekTime);
            break;
          case "sound":
            new AUDIO().sound_halfway(main , anim[i] , seekTime);
            break;
        }
      }
    }

    // 時間表示処理
    this.time_halfway(main,seekTime);
  };
  


  // 画像表示処理
  IMAGE.prototype.image_in = function(main , data){
    var base = document.querySelector(main.options.construction.base);
    var area_img = base.querySelector(main.options.construction.area_img);
    if(!area_img){return false}
    var view = new VIEW();

    // 作られているエレメントを取得（無い場合はnull）
    var img_base = area_img.querySelector(".img-base[data-id='"+data.image_id+"']");
    if(img_base){return false}

    // データ存在確認(imgが作られているか)
    if(typeof main.options.contents_images[data.image_id] === "undefined"){return}
    var img = main.options.contents_images[data.image_id];

    // make-element
    img_base = document.createElement("div");
    img_base.className = "img-base";
    img_base.setAttribute("data-id",img.getAttribute("data-id"));
    img_base.setAttribute("data-group",img.getAttribute("data-group"));

    // fade-in
    if(data.fi){
      img.style.setProperty("opacity" , "0" , "");
      img.style.setProperty("animation" , "anim-fi "+data.fi+"s linear forwards" , "");
    }

    // append
    img_base.appendChild(img);
    area_img.appendChild(img_base);

    view.setAnimationMode(img_base , data);

    return true;
  };

  // 画像Fade-out処理
  IMAGE.prototype.image_fo = function(main , data){
    var base = document.querySelector(main.options.construction.base);
    var area_img = base.querySelector(main.options.construction.area_img);
    if(!area_img){return false}

    // 作られているエレメントを取得（無い場合はnull）
    var img_base = area_img.querySelector(".img-base[data-id='"+data.image_id+"']");
    if(!img_base){return false}
    var img  = img_base.querySelector("[data-id='"+data.image_id+"']");

    // フラグチェック
    if(img.getAttribute("data-fadeout-flg") === "1"){return false}

    // fade-out (* - main.options.intervalTime)
    img.style.setProperty("opacity" , "1" , "");
    img.style.setProperty("animation" , "anim-fo "+ data.fo +"s linear forwards" , "");
    img.setAttribute("data-fadeout-flg","1");
  };

  // 画像element削除処理
  IMAGE.prototype.image_out = function(main , data){
    if(typeof data.image_id === "undefined" || !data.image_id){return false}

    var base = document.querySelector(main.options.construction.base);
    var area_img = base.querySelector(main.options.construction.area_img);
    if(!area_img){return false}

    // 作られているエレメントを取得（無い場合はnull）
    var img_base = area_img.querySelector(".img-base[data-id='"+ data.image_id +"']");
    if(!img_base){return false}

    // remove
    area_img.removeChild(img_base);
  };


  // 画像表示処理（途中表示）
  IMAGE.prototype.image_halfway = function(main , data , seekTime){
    var base = document.querySelector(main.options.construction.base);
    var area_img = base.querySelector(main.options.construction.area_img);
    if(!area_img){return false}
    var view = new VIEW();

    // 作られているエレメントを取得（無い場合はnull）
    var img_base = area_img.querySelector(".img-base[data-id='"+data.image_id+"']");
    if(img_base){return false}

    // メモリから画像データの検索
    if(typeof main.options.contents_images[data.image_id] === "undefined"){return}
    var img = main.options.contents_images[data.image_id];

    // make-element
    img_base = document.createElement("div");
    img_base.className = "img-base";
    img_base.setAttribute("data-id",img.getAttribute("data-id"));
    img_base.setAttribute("data-group",img.getAttribute("data-group"));


    // fade-in
    if(typeof data.fi !== "undefined"
    && Number(data.in) + Number(data.fi) > seekTime){
      var start = seekTime - Number(data.in);
      var par   = start / Number(data.fi);
      img.style.setProperty("opacity"   , par , "");
      var remining_time = Number(data.fi) - (Number(data.fi) * par);
      img.style.setProperty("animation" , "anim-fi "+ remining_time +"s linear forwards" , "");
    }

    // fade-out
    else if(typeof data.out !== "undefined"
    && Number(data.out) - Number(data.fo) < seekTime){
      var start = Number(data.out) - Number(data.fo);
      var seekTimeRange = seekTime - start;
      var par   = 1 - (seekTimeRange / Number(data.fo));
      img.style.setProperty("opacity"   , par , "");
      var remining_time = Number(data.fo) - (Number(data.fo) * par);
      img.style.setProperty("animation" , "anim-fo "+ remining_time +"s linear forwards" , "");
    }

    // 
    else{
      img.style.setProperty("opacity"   , "1" , "");
      img.style.removeProperty("animation");
    }

    // append
    img_base.appendChild(img);
    area_img.appendChild(img_base);
    

    var seekPar = 1- ((seekTime - Number(data.in)) / (Number(data.out) - Number(data.in)));
    view.setAnimationMode(img_base , data , seekPar);

    return true;
  };



  // init-setting : animation-mode
  VIEW.prototype.setAnimationMode = function(elm , data , seekPar){
    if(!elm || !data || typeof data.mode === "undefined"){return}
    seekPar = (seekPar) ? seekPar : 0;

    var mode = data.mode;
    if(!mode){return;}

    var time = data.out - data.in;
    if(!time){return;}

    if(elm.getAttribute("data-animation-flg") === "1"){return;}

    if(mode === "random"){
      var modes = (data && typeof data.modes !== "undefined" && data.modes.length) ? data.modes : ["zoom-in","zoom-out","move-right","move-left","move-up","move-down"];
      var rnd = Math.floor(Math.random() * (modes.length -1));
      mode = modes[rnd];
    }
    switch(mode){
      case "scroll-up":
        var val = (elm.offsetHeight * -1);
        val = (seekPar) ? val * seekPar : val;
        elm.style.setProperty("bottom", val + "px","");
        elm.style.setProperty("top", "auto","");
        break

      case "scroll-down":
        var val = (elm.offsetHeight * -1);
        val = (seekPar) ? val * seekPar : val;
        elm.style.setProperty("top", val + "px","");
        elm.style.setProperty("bottom", "auto","");
        break;

      case "zoom-in":
        var val = 1.0;
        val = (seekPar) ? val + (seekPar * 0.5) : val;
        elm.style.setProperty("transform","scale("+val+")","");
        elm.style.setProperty("left","0","");
        break;

      case "zoom-out":
        var val = 1.5;
        val = (seekPar) ? val - (seekPar * 0.5) : val;
        elm.style.setProperty("transform","scale("+val+")","");
        elm.style.setProperty("left","0","");
        break;

      case "move-right":
        var val = -15;
        val = (seekPar) ? val + (seekPar * 30) : val;
        elm.style.setProperty("transform","scale(1.3)","");
        elm.style.setProperty("left", val + "%","");
        break;

      case "move-left":
        var val = 15;
        val = (seekPar) ? val - (seekPar * 30) : val;
        elm.style.setProperty("transform","scale(1.3)","");
        elm.style.setProperty("left", val + "%","");
        break;

      case "move-up":
        var val = 15;
        val = (seekPar) ? val - (seekPar * 30) : val;
        elm.style.setProperty("transform","scale(1.3)","");
        elm.style.setProperty("top", val + "%","");
        break;

      case "move-down":
        var val = -15;
        val = (seekPar) ? val + (seekPar * 30) : val;
        elm.style.setProperty("transform","scale(1.3)","");
        elm.style.setProperty("top", val + "%","");
        break;
    }

    time = (seekPar) ? time * seekPar : time;
    elm.style.setProperty("animation" , "anim-"+ mode +" "+ time +"s linear forwards" , "");
    elm.setAttribute("data-animation-flg" , "1");
  };


  // in
  TEXT.prototype.text_in = function(main , data){
    if(!data || !data.text_id){return}
    var view = new VIEW();
    var text = this;

    var base = document.querySelector(main.options.construction.base);
    var area_text = base.querySelector(main.options.construction.area_text);
    if(!area_text){return}

    // 作られているエレメントを取得（無い場合はnull）
    var txt_base = area_text.querySelector(".text-base[data-id='"+data.text_id+"']");
    if(txt_base){return}

    // make-element
    txt_base = text.makeTextElement(main , data);
    var txt_value = txt_base.querySelector(".text-value[data-id='"+ data.text_id +"']");


    // fade-in
    if(data.fi){
      txt_value.style.setProperty("opacity" , "0" , "");
      txt_value.style.setProperty("animation" , "anim-fi "+data.fi+"s linear forwards" , "");
    }

    area_text.appendChild(txt_base);
    view.setAnimationMode(txt_base , data);

    return true;
  }

  // fo
  TEXT.prototype.text_fo = function(main , data){
    if(!data || !data.text_id){return}

    var base = document.querySelector(main.options.construction.base);
    var area_text = base.querySelector(main.options.construction.area_text);
    if(!area_text){return}

    // 作られているエレメントを取得（無い場合はnull）
    var text_base = area_text.querySelector(".text-base[data-id='"+data.text_id+"']");
    if(!text_base){return false}
    var txt_value = text_base.querySelector(".text-value[data-id='"+ data.text_id +"']");

    if(txt_value.getAttribute("data-fadeout-flg") === "1"){return false;}
    

    // fade-out (* - main.options.intervalTime)
    var fo = (data.fo) ? data.fo : 0;
    txt_value.style.setProperty("opacity","1","");
    txt_value.style.setProperty("animation" , "anim-fo "+ fo +"s linear forwards" , "");
    txt_value.setAttribute("data-fadeout-flg" , "1");
  }

  // out
  TEXT.prototype.text_out = function(main , data){
    if(!data || !data.text_id){return}

    var base = document.querySelector(main.options.construction.base);
    var area_text = base.querySelector(main.options.construction.area_text);
    if(!area_text){return}

    // 作られているエレメントを取得（無い場合はnull）
    var txt_base = area_text.querySelector(".text-base[data-id='"+ data.text_id +"']");
    if(!txt_base){return false}

    // remove
    area_text.removeChild(txt_base);
  }

  // 画像表示処理（途中表示）
  TEXT.prototype.text_halfway = function(main , data , seekTime){
    var base = document.querySelector(main.options.construction.base);
    var area_text = base.querySelector(main.options.construction.area_text);
    if(!area_text){return false}
    var view = new VIEW();

    // 作られているエレメントを取得（無い場合はnull）
    var txt_base = area_text.querySelector(".text-base[data-id='"+data.text_id+"']");
    if(txt_base){return}

    // make-element
    txt_base = this.makeTextElement(main , data);
    var txt_value = txt_base.querySelector(".text-value[data-id='"+data.text_id+"']");

    // fade-in
    if(typeof data.fi !== "undefined"
    && Number(data.in) + Number(data.fi) > seekTime){
      var start = seekTime - Number(data.in);
      var par   = start / Number(data.fi);
      txt_value.style.setProperty("opacity"   , par , "");
      var remining_time = Number(data.fi) - (Number(data.fi) * par);
      txt_value.style.setProperty("animation" , "anim-fi "+ remining_time +"s linear forwards" , "");
    }

    // fade-out
    else if(typeof data.out !== "undefined"
    && Number(data.out) - Number(data.fo) < seekTime){
      var start = Number(data.out) - Number(data.fo);
      var seekTimeRange = seekTime - start;
      var par   = 1 - (seekTimeRange / Number(data.fo));
      txt_value.style.setProperty("opacity"   , par , "");
      var remining_time = Number(data.fo) - (Number(data.fo) * par);
      txt_value.style.setProperty("animation" , "anim-fo "+ remining_time +"s linear forwards" , "");
    }

    // 
    else{
      txt_value.style.setProperty("opacity"   , "1" , "");
      txt_value.style.removeProperty("animation");
    }

    // append
    txt_base.appendChild(txt_value);
    area_text.appendChild(txt_base);
    
    var seekPar = 1- ((seekTime - Number(data.in)) / (Number(data.out) - Number(data.in)));
    view.setAnimationMode(txt_base , data , seekPar);

    return true;
  };

  // initial-setting : text
  TEXT.prototype.makeTextElement = function(main , data){
    if(!data || !data.text_id){return}

    var text_base = document.createElement("div");
    text_base.className = "text-base";
    text_base.setAttribute("data-id" , data.text_id);

    var text_value = document.createElement("div");
    text_value.className = "text-value";
    text_value.innerHTML = data.text;
    text_value.setAttribute("data-id" , data.text_id);
    text_base.appendChild(text_value);

    if(typeof data.style !== "undefined" && data.style){
      text_value.style = data.style;
    }
    if(typeof data.top !== "undefined" && data.top){
      text_base.style.setProperty("top" , data.top , "");
    }
    if(typeof data.left !== "undefined" && data.left){
      text_base.style.setProperty("left" , data.left , "");
    }
    if(typeof data.right !== "undefined" && data.right){
      text_base.style.setProperty("right" , data.right , "");
    }
    if(typeof data.bottom !== "undefined" && data.bottom){
      text_base.style.setProperty("bottom" , data.bottom , "");
    }
    if(typeof data.width !== "undefined" && data.width){
      text_base.style.setProperty("width" , data.width , "");
    }
    if(typeof data.height !== "undefined" && data.height){
      text_base.style.setProperty("height" , data.height , "");
    }

    if(typeof data["font-size"] !== "undefined" && data["font-size"]){
      text_value.style.setProperty("font-size" , data["font-size"] , "");
    }
    if(typeof data.color !== "undefined" && data.color){
      text_value.style.setProperty("color" , data.color , "");
    }
    if(typeof data.align !== "undefined" && data.align){
      text_value.style.setProperty("text-align" , data.align , "");
    }
    if(typeof data.weight !== "undefined" && data.weight){
      text_value.style.setProperty("font-weight" , data.weight , "");
    }
    return text_base;
  };


  






  // ----------
  // CONTROL : 動画再生コントロール
  
  // 動画ウィンドウをフルウィンドウに切り替え（切り戻し）ボタン操作
  CONTROL.prototype.clickExpand = function(main){
    var base = document.querySelector(main.options.construction.base);
    if(!base){return}
    // フルウィンドウ
    base.webkitRequestFullScreen();
  };

  // // Play : 基本画面をクリックした時の処理
  // CONTROL.prototype.click_base = function(main){
  //   var target = document.querySelector(main.options.target.base);
  //   if(!target){return}
  //   var play_flg = target.getAttribute("data-play");
  //   // play -> pause
  //   if(play_flg == 1){
  //     this.movie_pause(main);
  //   }
  //   // pause->play
  //   else{
  //     this.movie_play(main);
  //   }
  // };
  // 動画再生
  CONTROL.prototype.movie_play = function(main){
    var control = this;
    var view    = new VIEW();
    var audio   = new AUDIO();

    // currentTimeが末尾の場合は、最初に戻す
    if(main.options.playData.currentTime === main.options.playData.totalTime){
      // reset処理
      control.clickReturn(main);
    }

    var base = document.querySelector(main.options.construction.base);
    if(!base){return}
    base.setAttribute("data-play","1");

    var diff = (main.options.playData.pauseTime) ? ((+new Date()) - main.options.playData.pauseTime) : 0 ;
    main.options.playData.playTime = (diff) ? main.options.playData.playTime + diff : (+new Date());
    main.options.animFlg = setInterval((function(main){
      view.time(main);
    }).bind(this,main) , main.options.intervalTime);

    // 音楽再生
    audio.play(main);
  };
  // 動画停止
  CONTROL.prototype.movie_pause = function(main){
    var audio = new AUDIO();
  
    var base = document.querySelector(main.options.construction.base);
    if(!base){return}
    base.setAttribute("data-play","0");

    main.options.playData.pauseTime = (main.options.playData.playTime) ? (+new Date()) : 0;
    clearInterval(main.options.animFlg);

    // 音楽停止
    audio.pause(main);
  };

  // play / pause　ボタンの切り替え処理
  // flg ["play":play->pause , "pause":pause->play , "toggle":play<->pause]
  CONTROL.prototype.play_pause = function(main , flg){
    var control = this;


    flg = (flg) ? flg : "toggle";
    var base = document.querySelector(main.options.construction.base);

    // play->pause
    if(flg === "play"){
      base.setAttribute("data-play","1");
      control.movie_play(main);
    }
    // pause
    else if(flg === "pause"){
      base.setAttribute("data-play","0");
      control.movie_pause(main);
    }
    // toggle
    else{
      // play->pause
      if(base.getAttribute("data-play") === "1"){
        base.setAttribute("data-play","0");
        control.movie_pause(main);
      }
      // pause->play
      else{
        base.setAttribute("data-play","1");
        control.movie_play(main);
      }
    }
  };

  
  // 動画を始めに戻す処理
  CONTROL.prototype.clickReturn = function(main){
    var base = document.querySelector(main.options.construction.base);
    if(!base){return}
    var audio = new AUDIO();
    var view  = new VIEW();

    // 一旦現在再生中の音楽を停止
    main.options.playData.playTime  = 0;
    main.options.playData.pauseTime = 0;
    // 動作を停止
    this.play_pause(main , "pause");
    // soundをリセット
    audio.reset(main);
    view.time(main);
    //
    view.view_animations_halfway(main , 0);
  };

//   // // クリックでボリューム変更
//   // $$.prototype.clickVolume = function(e){
//   //   var volume = document.querySelector(this.options.target.volume);
//   //   if(!volume){return}

//   //   var lists = document.querySelector(".volume-lists");
//   //   if(lists){
//   //     lists.parentNode.removeChild(lists);
//   //     return;
//   //   }

//   //   // プルダウン表示
//   //   var div = document.createElement("div");
//   //   div.className = "volume-lists";
//   //   volume.parentNode.appendChild(div);

//   //   var vol0 = document.createElement("img");
//   //   vol0.setAttribute("data-volume","0");
//   //   vol0.src = "sample/icon/volume-0.svg";
//   //   div.appendChild(vol0);

//   //   var vol1 = document.createElement("img");
//   //   vol1.setAttribute("data-volume","1");
//   //   vol1.src = "sample/icon/volume-1.svg";
//   //   div.appendChild(vol1);

//   //   var vol2 = document.createElement("img");
//   //   vol2.setAttribute("data-volume","2");
//   //   vol2.src = "sample/icon/volume-2.svg";
//   //   div.appendChild(vol2);

//   //   var vol3 = document.createElement("img");
//   //   vol3.setAttribute("data-volume","3");
//   //   vol3.src = "sample/icon/volume-3.svg";
//   //   div.appendChild(vol3);

//   // };

  CONTROL.prototype.getStatus_mute = function(main){
    var target = document.querySelector(main.options.construction.ctl_mute);
    if(!target){return null}

    return target.getAttribute("data-mute");
  };
  CONTROL.prototype.clickMute = function(main,e){
    var target = document.querySelector(main.options.construction.ctl_mute);
    if(!target){return}
    var audio = new AUDIO();

    if(target.getAttribute("data-mute") === "1"){
      target.setAttribute("data-mute" , "0");
      audio.setSounds_mute(main , 1);
    }
    else{
      target.setAttribute("data-mute" , "1");
      audio.setSounds_mute(main , 0);
    }
  };
  
  



// 	$$.prototype.keyup = function(e){
// 		if(!this.options.keyCache.length || !e.keyCode){return;}
// 		var newData = [];
// 		for(var i=this.options.keyCache.length-1; i>=0; i--){
// 			if(e.keyCode == this.options.keyCache[i]){continue;}
// 			newData.push(this.options.keyCache[i]);
// 		}
// 		this.options.keyCache = newData;
// 	};
	CONTROL.prototype.keydown = function(main){

    var control = this;

		// proc
		switch(e.keyCode){
			// etc (full-screen -> normal) : 27
			case 27:
        break;
        
			// F1 : fullscreen
			case 112:
        control.clickExpand(main);
        break;
        
			// enter :13
			case 13:
          // control.click_base(main);
				break;

			// up : 38
			case 38:
				break;

			// down : 40
			case 40:
				break;

			// right : 39
			case 39:
				break;

			// left : 37 動画を最初に巻き戻して停止
			case 37:
        control.clickReturn(main);
				break;
		}
		// cache
		// this.options.keyCache.push(e.keyCode);
  };

  // seekバーのに箇所をクリックした時の処理
  CONTROL.prototype.click_seek = function(main,e){
    var target = e.currentTarget;
    var view   = new VIEW();
    var lib    = new LIB();

    // pos
    var pos = lib.pos(target);
    var cx  = e.pageX;
    var x   = (cx - pos.x);
    var w   = target.offsetWidth;
    var per = x / w;

    // seek-time
    var totaltime = main.options.playData.totalTime;
    var seekTime  = totaltime * per;

    // movie停止
    new CONTROL().play_pause(main , "pause");

    // クリックした時間へ移動
    view.view_animations_halfway(main , seekTime);

    // movie再開
    new CONTROL().play_pause(main , "play");

  };
  




  // ----------
  // AUDIO

  // 全てを停止して最初に戻る
  AUDIO.prototype.reset = function(main){
    var anims = main.options.animations;
    var view = new VIEW();

    for(var i=0; i<anims.length; i++){
      var anim = anims[i];
      if(view.view_animations_checkType(anim) !== "sound"){continue}
      var sound = main.options.contents_sounds[anim.sound_id];
      if(typeof sound.gainSource === "undefined"){continue;}
      sound.gainSource.disconnect();
      // sound.gainSource.stop();
    }
  };

  // 全てのsoundをmuteにする
  AUDIO.prototype.setSounds_mute = function(main , val){
    for(var i=0; i<main.options.contents_sounds.length; i++){
      var sound = main.options.contents_sounds[i];
      if(typeof sound.gainNode === "undefined"){continue;}
      sound.gainNode.gain.value = val;
    }
  };

  // 停止
  AUDIO.prototype.pause = function(main){
    var sounds = main.options.contents_sounds;
    if(sounds && sounds.length){
      for(var i=0; i<sounds.length; i++){
        sounds[i].context.suspend();
      }
    }
  };
  // 再生
  AUDIO.prototype.play = function(main){
    var sounds = main.options.contents_sounds;
    if(sounds && sounds.length){
      for(var i=0; i<sounds.length; i++){
        // if(typeof sounds[i].gainSource === "undefined"){
        //   this.sound_in(main,sounds[i]);
        //   console.log("sound-in");
        // }
        sounds[i].context.resume();
      }
    }
  };


  // sound-in
  AUDIO.prototype.sound_in = function(main , data){
    if(!main.options.audioPlayFlg){return;}  
    var sound = main.options.contents_sounds[data.sound_id];
    if(!sound){return;}
    // 再生中の場合は処理しない
    if(data.playing === 1){return;}

    // mute状態を取得
    var mute = new CONTROL().getStatus_mute(main);

    sound.gainNode = sound.context.createGain();
    sound.gainNode.connect(sound.context.destination);
    sound.gainNode.gain.value = (mute==="1") ? 0 : 1;
    sound.gainSource = sound.context.createBufferSource();
    sound.gainSource.connect(sound.gainNode);
    sound.gainSource.buffer = sound.context.buffer;
    sound.gainSource.start(0 , sound.context.pauseTime);

    // flg
    data.playing = 1;
  };

  // sound-fade-out
  AUDIO.prototype.sound_fo = function(main , data){

  };

  // sound-out
  AUDIO.prototype.sound_out = function(main , data){
    var sound = main.options.contents_sounds[data.sound_id];
    if(!sound){return;}

    // 再生中以外は処理しない
    if(data.playing !== 1){return;}
    if(typeof sound.gainSource === "undefined"){return;}

    // // 再生
    sound.gainSource.disconnect();
    sound.gainSource.stop();

    // flg
    data.playing = 0;
  };

  AUDIO.prototype.sound_halfway = function(main , data , seekTime){
    if(!main.options.audioPlayFlg){return;}  
    var control = new CONTROL();


    var sound = main.options.contents_sounds[data.sound_id];
    if(!sound){return;}

    // mute状態を取得
    var mute = control.getStatus_mute(main);

    sound.gainNode = sound.context.createGain();
    sound.gainNode.connect(sound.context.destination);
    sound.gainNode.gain.value = (mute==="1") ? 0 : 1;
    sound.gainSource = sound.context.createBufferSource();
    sound.gainSource.connect(sound.gainNode);
    sound.gainSource.buffer = sound.context.buffer;
    sound.gainSource.start(0,(seekTime - data.in));

    // check play-pause
    var base = document.querySelector(main.options.construction.base);

    // play
    if(base.getAttribute("data-play") === "1"){
      sound.context.resume();
    }
    // pause
    else{
      sound.context.suspend();
    }

    // flg
    data.playing = 1;
  };





  return MAIN
})();
