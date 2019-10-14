
;$$slide_mov = (function(){
  // ----------
  // Library

  var __event = function(target, mode, func){
		if (target.addEventListener){target.addEventListener(mode, func, false)}
		else{target.attachEvent('on' + mode, function(){func.call(target , window.event)})}
  };
  var __urlinfo = function(uri){
    uri = (uri) ? uri : location.href;
    var data={};
    var urls_hash  = uri.split("#");
    var urls_query = urls_hash[0].split("?");
		var sp   = urls_query[0].split("/");
		var data = {
      uri      : uri
		,	url      : sp.join("/")
    , dir      : sp.slice(0 , sp.length-1).join("/") +"/"
    , file     : sp.pop()
		,	domain   : sp[2]
    , protocol : sp[0].replace(":","")
    , hash     : (urls_hash[1]) ? urls_hash[1] : ""
		,	query    : (urls_query[1])?(function(urls_query){
				var data = {};
				var sp   = urls_query.split("#")[0].split("&");
				for(var i=0;i<sp .length;i++){
					var kv = sp[i].split("=");
					if(!kv[0]){continue}
					data[kv[0]]=kv[1];
				}
				return data;
			})(urls_query[1]):[]
		};
		return data;
  };
  var __construct = function(){
    switch(document.readyState){
      case "complete"    : new $$;break;
      case "interactive" : __event(window , "DOMContentLoaded" , function(){new $$});break;
      default            : __event(window , "load" , function(){new $$});break;
		}
  };
  // 起動scriptタグを選択
  var __currentScriptTag = (function(){
    var scripts = document.getElementsByTagName("script");
    return __currentScriptTag = scripts[scripts.length-1].src;
  })();
  var __setCss = function(){
    var head = document.getElementsByTagName("head");
    var base = (head) ? head[0] : document.body;
    var current_pathinfo = __urlinfo(__currentScriptTag);
    var css  = document.createElement("link");
    css.rel  = "stylesheet";
    var target_css = current_pathinfo.dir + current_pathinfo.file.replace(".js",".css");
    var query = [];
    for(var i in current_pathinfo.query){
      query.push(i);
    }
    css.href = target_css +"?"+ query.join("");
    base.appendChild(css);
  };

  var __options = {

    target    : {
      base    : "#movie_base",
      time    : "#movie_time",
      seek    : "#movie_seek",
      volume  : "#movie_volume",
      play    : "#movie_play",
      pause   : "#movie_pause",
      return  : "#movie_return",
      sound   : "#movie_sound",
      volume  : "#movie_volume",
      expand  : "#movie_expand",
      volume  : "#movie_volume",
      mute    : "#movie_mute"
    },

    selectors : {
      base    : ".slide_mov",
      loading : ".slide_mov-loading",
      play    : ".slide_mov-play",
      pause   : ".slide_mov-pause",
      images  : ".slide_mov_images",
      texts   : ".slide_mov_texts"
    },
    control_image : {
      play    : "img/play.svg",
      pause   : "img/pause.svg"
    },

    default : {
      volume : 2
    },

    loading     : 1,
    
		startTime   : 0,
    pauseTime   : 0,
    maxTime     : 0,
    currentTime : 0,
    current_sound_id : 0,
    current_sount_event : null,
    intervalTime : 250,

    animSet : [],
    goodRanks : [],
    goodRanksID : [],

    contents : {
      sounds : [],
      images : [],
      texts  : [],
    },
    animations : [],
    animation_set : [],

    contents_loadFiles : [],
    contents_sounds    : [],
    
    contents_images    : {},
    

    contentsLoaded : false
	};

  // ----------
  // 初期設定
  var $$ = function(options){

    // cssの自動読み込み
    __setCss();

    // 格納用データの設置
    this.setOptions(options);

    // ページ読み込み待ち
    switch(document.readyState){
      case "complete"    : this.setting();break;
      case "interactive" : __event(window , "DOMContentLoaded" , (function(){this.setting()}).bind(this));break;
      default            : __event(window , "load" , (function(){this.setting()}).bind(this));break;
		}
  };

  $$.prototype.setting = function(){

    // optionデータチェック
    if(!this.options
    || !this.options.target.base){
      console.log("Error : no-target. ");
      return;
    }

    // make-element
    this.make_default_element();

    // base-set
    var base = document.querySelector(this.options.target.base)
    if(!base){return;}
    base.setAttribute("data-base" , this.options.selectors.base.replace(/\./,""));

    

    // animationセット
    if(typeof this.options.animations !== "undefined"
    && this.options.animations.length){
      this.set_animation_set();
      this.set_animations();
    }

    // 設定データをサーバーから読み込み
    if(typeof this.options.contents !== "undefined"){
      this.set_contents(this.options.contents);
    }

    // data-loading-start
    if(this.options.contents_loadFiles.length > 0){
      this.nowLoading_start();
      this.load_contents();
    }

    // event
    this.setting_event();

  };

  // ----------
  // Event
  $$.prototype.setting_event = function(){
    // 画面拡大処理
    var expand = document.querySelector(this.options.target.expand);
    if(expand){
      __event(expand , "click" , (function(e){this.clickExpand(e)}).bind(this));
    }

    // 再生処理
    var play = document.querySelector(this.options.target.play);
    if(play){
      __event(play , "click" , (function(e){this.pauseButton_visible();this.movie_play();}).bind(this));
    }
    // 停止処理
    var pause = document.querySelector(this.options.target.pause);
    if(pause){
      __event(pause , "click" , (function(e){this.pauseButton_visible();this.movie_pause();}).bind(this));
    }
    // 動画を始めに戻す処理
    var restart = document.querySelector(this.options.target.return);
    if(restart){
      __event(restart , "click" , (function(e){this.clickReturn(e);}).bind(this));
    }

    // // volume
    // var volume = document.querySelector(this.options.target.volume);
    // if(volume){
    //   __event(volume , "click" , (function(e){this.clickVolume(e);}).bind(this));
    //   volume.setAttribute("data-volume",this.options.default.volume);
    // }

    // mute
    var mute = document.querySelector(this.options.target.mute);
    if(mute){
      __event(mute , "click" , (function(e){this.clickMute(e);}).bind(this));
    }


    __event(window , "keydown" , (function(e){this.keydown(e)}).bind(this));
  };

  // ----------
  // Options
  $$.prototype.setOptions = function(options){
    this.options = {};
    for(var i in __options){
      this.options[i] = __options[i];
    }
    if(options){
      for(var i in options){
        this.options[i] = options[i];
      }
    }
  };

  $$.prototype.make_default_element = function(){
    var base = document.querySelector(this.options.target.base);

    // image-area
    var img = document.createElement("div");
    img.className = this.options.selectors.images.replace(/^\./,"");
    base.appendChild(img);

    // text-area
    var txt = document.createElement("div");
    txt.className = this.options.selectors.texts.replace(/^\./,"");
    base.appendChild(txt);
  };

  // ----------
  // Contents-load

  // 設定データ(options)から、コンテンツデータの読み込み(BGM,pictures(wall,other...),texts,timeline)のキャッシュデータを作成する
  $$.prototype.set_contents = function(data){
    // bgm
    if(typeof data.sounds !== "undefined"){
      for(var i=0; i<data.sounds.length; i++){
        if(typeof data.sounds[i].file === "undefined" || !data.sounds[i].file){continue}
        data.sounds[i].type = "sound";
        data.sounds[i].id = i;
        this.options.contents_loadFiles.push(data.sounds[i]);
      }
    }

    // pictures
    if(typeof data.images !== "undefined"){
      for(var i=0; i<data.images.length; i++){
        if(typeof data.images[i].file === "undefined" || !data.images[i].file){continue}

        data.images[i].type = "image";
        data.images[i].id   = (typeof data.images[i].id !== "undefined") ? data.images[i].id : i;
        
        if(!this.checkAnimationInImageData(data.images[i].id)){continue;}
        this.options.contents_loadFiles.push(data.images[i]);
      }
    }

    // texts
    if(typeof data.texts !== "undefined"){
      for(var i=0; i<data.texts.length; i++){
        data.texts[i].id = (typeof data.texts[i].id !== "undefined" && data.texts[i]) ? data.texts[i].id : i;
        this.makeTextElement(data.texts[i]);
      }
    }

  };

  // animationデータにimageが含まれているかチェック（含まれていない場合は読み込みをしない）
  $$.prototype.checkAnimationInImageData = function(image_id){
    var anims = this.options.animations;
    for(var i=0; i<anims.length; i++){
      if(typeof anims[i].image_id !== "undefined"
      && anims[i].image_id == image_id){
        return true;
      }
    }
    return false;
  };

  $$.prototype.set_animations = function(){
    
    // animation
    if(this.options.animations.length){
      for(var i=0; i<this.options.animations.length; i++){
        if(typeof this.options.animations[i].fi === "undefined" || !this.options.animations[i].fi){
          this.options.animations[i].fi = 0;
        }
        if(typeof this.options.animations[i].fo === "undefined" || !this.options.animations[i].fo){
          this.options.animations[i].fo = 0;
        }

        // fade-in,outが画像の表示時間を超えている場合は自動的に調整する。
        var total_sec = this.options.animations[i].out - this.options.animations[i].in;
        var fade_sec  = this.options.animations[i].fi + this.options.animations[i].fo;
        if(total_sec < fade_sec){
          this.options.animations[i].fi = this.options.animations[i].fo = total_sec / 2;

        }
      }
    }
    else{
      this.options.animations = [];
    }
  }
  $$.prototype.set_animation_set = function(){
    if(!this.options.animations
    || !this.options.animations.length){reutrn;}

    for(var i=0; i<this.options.animations.length; i++){
      if(typeof this.options.animations[i].images_id === "undefined"
      || !this.options.animations[i].images_id
      || !this.options.animations[i].images_id.length){continue;}

      this.options.animations[i].images_id = this.set_images_sort(this.options.animations[i].images_id , this.options.animations[i]);

      var image_datas = (function(data){
        data.in  = (data.in)  ? data.in  : 0;
        data.out = (data.out) ? data.out : 0;
        var face_mode = (typeof data["fade-mode"] !== "undefined") ? data["fade-mode"] : "";
        var cache = JSON.stringify(data);
        var datas = [];
        switch(face_mode){
          case "cross":
            var start_sec = data.in;
            var between   = data.out - data.in;
            var fade_sec  = (data.fi * data.images_id.length) + data.fo;
            if((data.out - data.in) < fade_sec){
              data.fi = data.fo = between / (data.images_id.length + 1) / 2;
            }
            var step_sec  = (between - fade_sec) / (data.images_id.length);

            for(var i=0; i<data.images_id.length; i++){
              var newData = JSON.parse(cache);
              newData.image_id = data.images_id[i];
              newData.in  = i * (step_sec + data.fi) + start_sec;
              newData.out = (i+1) * (step_sec + data.fi) + data.fo + start_sec;

              delete newData.images_id;
              datas.push(newData);
            }
            break;
          default : 
            var start_sec = data.in;
            var step_sec  = (data.out - data.in) / data.images_id.length;
            for(var i=0; i<data.images_id.length; i++){
              var newData = JSON.parse(cache);
              newData.image_id = data.images_id[i];
              newData.in  = i * step_sec + start_sec;
              newData.out = (i+1) * step_sec + start_sec;

              delete newData.images_id;
              datas.push(newData);
            }
            break;
        }
        
        return datas;
      })(this.options.animations[i]); 

      if(!image_datas){
        this.options.animations.splice(i,0);
        continue;
      }

      this.options.animations = __array_merge(this.options.animations , image_datas , i);
      i = i + image_datas.length - 1;
    }
  };

  // ソート処理
  $$.prototype.set_images_sort = function(lists , data){
    if(typeof data.sort === "undefined" || !data.sort){return lists}
    switch(data.sort){
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

  // 配列の指定の箇所の値に、別の配列を入れ込む
  var __array_merge = function(arr_base , arr_add , num){
    var arr_before = arr_base.slice(0 , num);
    var arr_after  = arr_base.slice(num+1);
    return [].concat(arr_before,arr_add,arr_after);
  };


  // コンテンツデータを順番に読み込む
  $$.prototype.load_contents = function(){

    // 全てのコンテンツを読み込み完了
    if(this.options.contents_loadFiles.length === 0){
      this.nowLoading_end();
      this.loaded_sound_totalMaxTime();
      console.log("Complete : Contents-loaded !!!");
      this.setControls();
    }
    // 継続して次のコンテンツを読み込む
    else{
      var data = this.options.contents_loadFiles.shift();
      switch(data.type){
        case "sound":
          this.load_contents_sound(data);
          break;
        case "image":
          this.load_contents_image(data);
          break;
      }

    }
  };

  // soundの読み込み処理（読み込み完了後に次のload処理に遷移）
  $$.prototype.load_contents_sound = function(data){
    var request = new XMLHttpRequest();
    request.open('GET', data.file, true);
    request.responseType = 'arraybuffer';
    request.onload = (function(data,e){
      var target = e.target;
      switch(target.status){
        case 200:
          break;
        case 404:
          console.log("Error : File not found. ("+target.responseURL+")");
          this.load_contents();
          return false;
        default:
          this.load_contents();
          return false;
      }
      var sounds = this.options.contents_sounds;
      sounds[data.id] = {};
      sounds[data.id].context = new (window.AudioContext || window.webkitAudioContext)();
      sounds[data.id].gainNode = sounds[data.id].context.createGain();
      sounds[data.id].gainNode.connect(sounds[data.id].context.destination);
      sounds[data.id].context.decodeAudioData(target.response, (function(data,buffer){
        var sound = this.options.contents_sounds[data.id];
        sound.buffer = buffer;
        sound.startTime = 0;
        sound.pauseTime = 0;
        var maxTime = (typeof data.maxTime !== "undefined" && data.maxTime && Number(data.maxTime) < buffer.duration) ? Number(data.maxTime) : buffer.duration;
        sound.maxTime   = maxTime;
        this.viewTime();
        this.load_contents();
      }).bind(this,data));
    }).bind(this,data);
    request.send();
  };

  // 読み込み終了したsoundのtotal再生時間数を取得
  $$.prototype.loaded_sound_totalMaxTime = function(){
    var globalTime = 0;
console.log("contents_sounds-count : "+this.options.contents_sounds.length);
    for(var i=0; i<this.options.contents_sounds.length; i++){
      this.options.maxTime += this.options.contents_sounds[i].maxTime;
      this.options.contents_sounds[i].globalTime = globalTime;
      globalTime += this.options.contents_sounds[i].maxTime;
    }
    this.viewTime();
  };

  // imageの読み込み処理（読み込み完了後に次のload処理に遷移）
  $$.prototype.load_contents_image = function(data){
      if(typeof data.file === "undefined"){return;}
      var img = new Image();
      img.onload = (function(){
        this.load_contents();
      }).bind(this);
      img.src = data.file;
      img.setAttribute("class" , "pics");
      img.setAttribute("data-id" , data.id);
      img.setAttribute("data-group" , (typeof data.group !== "undefined") ? data.group : "");
      this.options.contents_images[data.id] = img;
  };

  // ----------
  // Now-loading
  $$.prototype.nowLoading_start = function(){
    var movie_base = document.querySelector(this.options.target.base);
    if(!movie_base){return;}

    var div = document.createElement("div");
    div.className = this.options.selectors.loading.replace(/^\./,"");
    movie_base.appendChild(div);
  };
  $$.prototype.nowLoading_end = function(){
    var loading_elm = document.querySelector(this.options.selectors.loading);
    loading_elm.parentNode.removeChild(loading_elm);
  };

  // ----------
  // Control
  $$.prototype.setControls = function(){
    var movie_base = document.querySelector(this.options.target.base);
    if(!movie_base){return;}

    movie_base.setAttribute("data-play" , "0");

    var play_base = document.createElement("div");
    play_base.className = this.options.selectors.play.replace(/^\./,"");
    movie_base.appendChild(play_base);
    var play_img = new Image();
    play_img.src = this.options.control_image.play;
    play_base.appendChild(play_img);

    var pause_base = document.createElement("div");
    pause_base.className = this.options.selectors.pause.replace(/^\./,"");
    movie_base.appendChild(pause_base);
    var pause_img = new Image();
    pause_img.src = this.options.control_image.pause;
    pause_base.appendChild(pause_img);

    __event(movie_base , "click" , (function(e){this.pauseButton_visible();this.click_base(e);}).bind(this));
    __event(movie_base , "mouseover" , (function(e){this.pauseButton_visible()}).bind(this));
    __event(movie_base , "mouseout"  , (function(e){this.pauseButton_fadeout()}).bind(this));
  };

  // ----------
  // animations
  $$.prototype.view_animations = function(time){
    var anim = this.options.animations;
    var target_images = [];
    var target_texts  = [];
    for(var i=0; i<anim.length; i++){
      var __in = (typeof anim[i].in  !== "undefined") ? Number(anim[i].in)  : 0;
      var _out = (typeof anim[i].out !== "undefined") ? Number(anim[i].out) : 9999;

      if(__in <= time && _out >= time){
        if(typeof anim[i].image_id !== "undefined" && anim[i].image_id !== ""){
          this.view_image(anim[i] , time);
          target_images.push(anim[i].image_id);
        }
        else if(typeof anim[i].text_id !== "undefined" && anim[i].text_id !== ""){
          this.view_text(anim[i] , time);
          target_texts.push(anim[i].text_id);
        }
      }
    }

    // 削除処理(image)
    var visibleImages = document.querySelectorAll(this.options.target.base +" "+this.options.selectors.images+" .img-base");
    for(var i=0; i<visibleImages.length; i++){
      var id = Number(visibleImages[i].getAttribute("data-id"));
      if(target_images.indexOf(id) === -1){
        visibleImages[i].parentNode.removeChild(visibleImages[i]);
      }
    }
    // 削除処理(text)
    var visibleImages = document.querySelectorAll(this.options.target.base +" "+this.options.selectors.texts+" .img-base");
    for(var i=0; i<visibleImages.length; i++){
      var id = Number(visibleImages[i].getAttribute("data-id"));
      if(target_texts.indexOf(id) === -1){
        visibleImages[i].parentNode.removeChild(visibleImages[i]);
      }
    }
    
  };

  $$.prototype.view_image = function(data , time){
    if(!data || !data.image_id){return}

    var img_area = document.querySelector(this.options.target.base +" "+this.options.selectors.images);
    if(!img_area){return}

    // データ存在確認(imgが作られているか)
    if(typeof this.options.contents_images[data.image_id] === "undefined"){return}

    // Fade-out
    var img_elm = img_area.querySelector("img[data-id='"+data.image_id+"']");
    if(img_elm){
      // fade-out (* - this.options.intervalTime)
      if(data.fo && (data.out - data.fo) < time){
        img_elm.style.setProperty("animation" , "anim-fo "+data.fo+"s linear forwards" , "");
      }
    }
    // Fade-in
    else{
      var img = this.options.contents_images[data.image_id];
      var img_base = document.createElement("div");
      img_base.className = "img-base";
      img_base.setAttribute("data-id",img.getAttribute("data-id"));
      img_base.setAttribute("data-group",img.getAttribute("data-group"));
      // fade-in
      if(data.fi){
        img.style.setProperty("animation" , "anim-fi "+data.fi+"s linear forwards" , "");
      }
      img_base.appendChild(img);
      img_area.appendChild(img_base);

      // anim-mode-set
      this.setAnimationMode(img_base , data.mode , (data.out - data.in));
    }
  };

  // init-setting : animation-mode
  $$.prototype.setAnimationMode = function(elm , mode , time){
    if(!elm || !mode || !time){return}
    if(elm.getAttribute("data-animation-flg") === "1"){return;}
    if(mode === "scroll-up"){
      var base = document.querySelector(this.options.target.base);
      elm.style.setProperty("bottom", (elm.offsetHeight * -1 - base.offsetHeight) + "px","");
    }
    elm.style.setProperty("animation" , "anim-"+ mode +" "+ time +"s linear forwards" , "");
    elm.setAttribute("data-animation-flg" , "1");
  };

  // initial-setting : text
  $$.prototype.makeTextElement = function(data){
    if(!data){return}
    var text_area = document.querySelector(this.options.target.base +" "+this.options.selectors.texts);
    if(!text_area){return}

    var text_base = document.createElement("div");
    text_base.className = "text-base";
    text_base.setAttribute("data-id" , data.id);

    var text_value = document.createElement("div");
    text_value.className = "text-value";
    text_value.innerHTML = data.text;
    text_value.setAttribute("data-id" , data.id);
    text_base.appendChild(text_value);

    if(typeof data.type !== "undefined"){
      text_base.setAttribute("data-type",data.type);
    }
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

    text_area.appendChild(text_base);
  };

  // animation : text
  $$.prototype.view_text = function(data , time){
    if(!data || !data.text_id){return}

    var text_area = document.querySelector(this.options.target.base +" "+this.options.selectors.texts);
    if(!text_area){return}

    // データ存在確認(elmが作られているか)
    var text_base = text_area.querySelector(".text-base[data-id='"+data.text_id+"']");
    if(!text_base){return}

    //
    var text_value = text_base.querySelector(".text-value");
    if(!text_value){return}

    // Fade-out (* - this.options.intervalTime)
    if(data.fo && (data.out - data.fo) < time){
      text_value.style.setProperty("animation" , "anim-fo "+data.fo+"s linear forwards" , "");
    }

    // Fade-in
    else{
      // fade-in
      if(data.fi){
        text_value.style.setProperty("animation" , "anim-fi "+data.fi+"s linear forwards" , "");
      }
      text_value.style.setProperty("visibility" , "visible");

      // anim-mode-set
      this.setAnimationMode(text_base , data.mode , (data.out - data.in));
    }
  };


  // ----------
  // Play

  $$.prototype.click_base = function(e){
    var target = document.querySelector(this.options.target.base);
    if(!target){return}
    var play_flg = target.getAttribute("data-play");
    // play -> pause
    if(play_flg == 1){
      this.movie_pause();
    }
    // pause->play
    else{
      this.movie_play();
    }
  };
  $$.prototype.movie_play = function(){
    var target = document.querySelector(this.options.target.base);
    if(!target){return}
    if(target.getAttribute("data-play") === "1"){return;}
    target.setAttribute("data-play","1");
    this.playSound();
    this.options.animFlg = setInterval((function(){this.viewTime()}).bind(this) , this.options.intervalTime);
    this.pauseButton_fadeout();

    var play = document.querySelector(this.options.target.play);
    if(play){
      play.setAttribute("data-play","0");
    }
    var pause = document.querySelector(this.options.target.pause);
    if(pause){
      pause.setAttribute("data-pause","1");
    }
  };
  $$.prototype.movie_pause = function(){
    var target = document.querySelector(this.options.target.base);
    if(!target){return}
    target.setAttribute("data-play","0");
    this.stopSound();
    clearInterval(this.options.animFlg);

    var play = document.querySelector(this.options.target.play);
    if(play){
      play.setAttribute("data-play","1");
    }
    var pause = document.querySelector(this.options.target.pause);
    if(pause){
      pause.setAttribute("data-pause","0");
    }
  };

  $$.prototype.pauseButton_visible = function(){
    var base = document.querySelector(this.options.target.base);
    var pauseButton = base.querySelector(".slide_mov-pause");
    if(pauseButton){
      pauseButton.setAttribute("data-fadeout" , "0");
    }
  };
  $$.prototype.pauseButton_fadeout = function(){
    var base = document.querySelector(this.options.target.base);
    var pauseButton = base.querySelector(".slide_mov-pause");
    if(pauseButton){
      setTimeout((function(pauseButton){pauseButton.setAttribute("data-fadeout" , "1")}).bind(this,pauseButton) , 300);
    }
  };

  // sound-play
  $$.prototype.playSound = function(){
    var sound = this.options.contents_sounds[this.options.current_sound_id];
		if(typeof sound.gainSource === "undefined" || !sound.gainSource){
			sound.gainSource = sound.context.createBufferSource();
      sound.gainSource.connect(sound.gainNode);
    }
    sound.gainSource.buffer = sound.buffer;
    sound.gainSource.start(0 , sound.pauseTime);
    sound.startTime = sound.context.currentTime - sound.pauseTime;
    this.viewTime();
  };

	// sound-pause
	$$.prototype.stopSound = function(){console.log("pause");
    var sound = this.options.contents_sounds[this.options.current_sound_id];
    if(typeof sound.gainSource === "undefined"){return;}
    sound.pauseTime = sound.context.currentTime - sound.startTime;
    sound.gainSource.disconnect();
    sound.gainSource.stop();
    delete sound.gainSource;
  };

  // 動画のタイムライン表示処理
	$$.prototype.viewTime = function(){
    var movieTime = document.querySelector(this.options.target.time);
    if(!movieTime){return;}
    var sound = this.options.contents_sounds[this.options.current_sound_id];
    if(!sound){return;}
    var currentTime = this.getCurrentTime();
    var globalTime = (sound.globalTime) ? sound.globalTime : 0;
    var currentTimeView = (currentTime + globalTime <= this.options.maxTime) ? currentTime + globalTime : this.options.maxTime;
    // loading
    currentTimeView = (!this.options.maxTime) ? null : currentTimeView ;
    var maxTime = (currentTimeView === null) ? null : this.options.maxTime;
    movieTime.innerHTML = this.setFormatTime(currentTimeView , "") +" / "+ this.setFormatTime(maxTime,"");

    // animation
    this.view_animations(currentTime + globalTime);

    // check-sound-maxTime-over
    var sound = this.options.contents_sounds[this.options.current_sound_id];
    if(currentTime >= sound.maxTime){
      this.checkSoundEnd(sound);
    }
  };

  // 現在再生しているsoundの終了フラグ処理
  $$.prototype.checkSoundEnd = function(sound){
    sound = (sound) ? sound : this.options.contents_sounds[this.options.current_sound_id];
    var movie_base = document.querySelector(this.options.target.base);
    if(movie_base.getAttribute("data-play") != 1){return}

    this.stopSound();
    sound.context.currentTime = 0;
    sound.pauseTime = 0;

    if(typeof this.options.contents_sounds[this.options.current_sound_id+1] !== "undefined"){
      var currentTime = this.getCurrentTime();
      var prevMaxTime = sound.maxTime;
      this.options.current_sound_id++;
      var nextSound = this.options.contents_sounds[this.options.current_sound_id];
      nextSound.maxTime += (currentTime - prevMaxTime);
      this.playSound();
    }
    else{
      this.click_base();
      this.options.current_sound_id = 0;
    }
  };

  // AudioContext用現在時刻の取得
  $$.prototype.getCurrentTime = function(){
    var sound = this.options.contents_sounds[this.options.current_sound_id];
    if(!sound){return;}
    var movie = document.querySelector(this.options.target.base);
		if(movie.getAttribute("data-play") != 1) {
      return sound.context.currentTime;
    }
    else{
      return sound.context.currentTime - sound.startTime;
    }
  };
  
  // タイムラインの時間表示フォーマット
  // mode @ ["" , "micro-second"]
	$$.prototype.setFormatTime = function(time , mode){
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


  // 動画ウィンドウをフルウィンドウに切り替え（切り戻し）ボタン操作
  $$.prototype.clickExpand = function(e){
    var base = document.querySelector(this.options.target.base);
    if(!base){return}
    // フルウィンドウ
    base.webkitRequestFullScreen();
  };
  // 動画を始めに戻す処理
  $$.prototype.clickReturn = function(){
    var base = document.querySelector(this.options.target.base);
    if(!base){return}

    // 一旦現在再生中の音楽を停止
    this.movie_pause();
    this.stopSound();
    

    // 全てのサウンドをスタート位置に戻す
    for(var i=0; i<this.options.contents_sounds.length; i++){
      var sound = this.options.contents_sounds[i];
      if(!sound){continue;}
      sound.context.currentTime = 0;
      sound.pauseTime = 0;
    }

    // 音楽を最初に戻す
    this.options.current_sound_id = 0;

    // 表示
    this.view_animations(0);
  };

  // // クリックでボリューム変更
  // $$.prototype.clickVolume = function(e){
  //   var volume = document.querySelector(this.options.target.volume);
  //   if(!volume){return}

  //   var lists = document.querySelector(".volume-lists");
  //   if(lists){
  //     lists.parentNode.removeChild(lists);
  //     return;
  //   }

  //   // プルダウン表示
  //   var div = document.createElement("div");
  //   div.className = "volume-lists";
  //   volume.parentNode.appendChild(div);

  //   var vol0 = document.createElement("img");
  //   vol0.setAttribute("data-volume","0");
  //   vol0.src = "sample/icon/volume-0.svg";
  //   div.appendChild(vol0);

  //   var vol1 = document.createElement("img");
  //   vol1.setAttribute("data-volume","1");
  //   vol1.src = "sample/icon/volume-1.svg";
  //   div.appendChild(vol1);

  //   var vol2 = document.createElement("img");
  //   vol2.setAttribute("data-volume","2");
  //   vol2.src = "sample/icon/volume-2.svg";
  //   div.appendChild(vol2);

  //   var vol3 = document.createElement("img");
  //   vol3.setAttribute("data-volume","3");
  //   vol3.src = "sample/icon/volume-3.svg";
  //   div.appendChild(vol3);

  // };

  $$.prototype.clickMute = function(e){
    var target = document.querySelector(this.options.target.mute);
    if(!target){return}

    if(target.getAttribute("data-mute") === "1"){
      target.setAttribute("data-mute" , "0");
      this.setSounds_mute(1);
    }
    else{
      target.setAttribute("data-mute" , "1");
      this.setSounds_mute(0);
    }
  };
  // 全てのsoundをmuteにする
  $$.prototype.setSounds_mute = function(val){
    // var sound = this.options.contents_sounds[this.options.current_sound_id];
    // sound.gainNode.gain.value = val;



    for(var i=0; i<this.options.contents_sounds.length; i++){
      var sound = this.options.contents_sounds[i];
      sound.gainNode.gain.value = val;
    //   if(typeof sound.source === "undefined" || !sound.source){
    //     sound.source = sound.context.createBufferSource();
    //     sound.source.connect(sound.context.destination);
    //     sound.source.playbackRate.value = val;
    //     sound.source.disconnect();
    //   }
    //   else{
    //     sound.source.playbackRate.value = val;
    //   }


// // console.log(this.options.contents_sounds[i]);
//       // this.options.contents_sounds[i].context.createBufferSource().start(0);
//       var sound = this.options.contents_sounds[i];
//       // sound.source = sound.context.createBufferSource();
//       // sound.source.connect(sound.context.destination);
//       // console.log(sound);
//       // var gainNode = sound.context.createGain;
//       // sound.source.connect(gainNode);
//       // gainNode.connect(sound.context.destination);
// console.log(sound.gainNode);
//       sound.gainNode.gain.value = 0;
//       // sound.source.start(0);
//       // if(typeof sound.source === "undefined"){continue}
//       // this.options.contents_sounds[i].source.muted = bool;
//       // this.options.contents_sounds[i].muted = bool;
//       // console.log(sound.muted);
    }
  };



	$$.prototype.keyup = function(e){
		if(!this.options.keyCache.length || !e.keyCode){return;}
		var newData = [];
		for(var i=this.options.keyCache.length-1; i>=0; i--){
			if(e.keyCode == this.options.keyCache[i]){continue;}
			newData.push(this.options.keyCache[i]);
		}
		this.options.keyCache = newData;
	};
	$$.prototype.keydown = function(e){
		// proc
		switch(e.keyCode){
			// etc (full-screen -> normal) : 27
			case 27:
        break;
        
			// F1 : fullscreen
			case 112:
          this.clickExpand();
        break;
        
			// enter :13
			case 13:
          this.click_base();
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
        this.clickReturn();
				break;
		}
		// cache
		// this.options.keyCache.push(e.keyCode);
	};

  return $$;
})();
