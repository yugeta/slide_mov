
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
      volume  : "#movie_volume"
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

    // contents_animations : [],
    // animation_val : ["",
    //   "anim-zi-slow",
    //   "anim-zo-slow",
    //   "anim-move-left-slow",
    //   "anim-move-right-slow"
    // ],

    // randomGroup : {},
    // sortPrev : 0,
    // keyCache : [],

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
    this.make_element();

    // base-set
    var base = document.querySelector(this.options.target.base)
    if(!base){return;}
    base.setAttribute("data-base" , this.options.selectors.base.replace(/\./,""));

    // 設定データをサーバーから読み込み
    if(typeof this.options.contents !== "undefined"){
      this.set_contents(this.options.contents);
    }
    // animationセット
    if(typeof this.options.animations !== "undefined"
    && this.options.animations.length){
      this.set_animation_set();
      this.set_animations();
    }
    else{
      console.log("Error ! : Not animations setting.");
    }
    


    // var res = this.getId();
    // if(res === false){return;}
    // if(!res.uid || !res.wall){
    //   console.log("Error!! no-data.");
    //   // return;
    // }
		// this.options.uid  = res.uid;
    // this.options.wall = res.wall;
    
    // // 
    // var uidinfo = __urlinfo();
    // this.loadUrl(
    //   uidinfo.url,
    //   (function(e){this.setJson(e)}).bind(this),
    //   ""
    // );
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

  $$.prototype.make_element = function(){
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
        // data.sounds[i].id   = (typeof data.sounds[i].id !== "undefined") ? data.sounds[i].id : i;
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



    // // animation_set
    // if(typeof data.animation_set !== "undefined"){
    //   this.options.loading_count += 1;
    // }
    

    // // setting ----

    // // bgm
    // if(typeof data.bgm !== "undefined"){
    //   this.load_BGM(data.bgm);
    // }

    // // pictures
    // if(typeof data.pictures !== "undefined"){
    //   this.load_pictures(data.pictures);
    // }

    

    // // animation
    // if(typeof data.animation !== "undefined"){
    //   this.options.animation = data.animation;
    //   this.checkLoadedCount(-1);
    // }

    // // animation_set
    // if(typeof data.animation_set !== "undefined"){
    //   this.options.animSet = data.animation_set;
    //   this.checkLoadedCount(-1);
    // }

    // load-start
    if(this.options.contents_loadFiles.length > 0){
      this.nowLoading_start();
      this.load_contents();
    }

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

      var image_datas = (function(data){
        data.in  = (data.in)  ? data.in  : 0;
        data.out = (data.out) ? data.out : 0;
        var start_sec = data.in;
        var step_sec  = (data.out - data.in) / data.images_id.length;

        var cache = JSON.stringify(data);
        var datas = [];
        for(var i=0; i<data.images_id.length; i++){
          var newData = JSON.parse(cache);
          newData.image_id = data.images_id[i];

          newData.in  = i * step_sec + start_sec;
          newData.out = (i+1) * step_sec + start_sec;

          delete newData.images_id;
          datas.push(newData);
        }
        return datas;
      })(this.options.animations[i]); 

      if(!image_datas){
        this.options.animations.splice(i,0);
        continue;
      }

      this.options.animations = __array_merge(this.options.animations , image_datas , i);
      i = i + image_datas.length - 1;
      // for(var j=image_datas.length-1; j>=0; j--){
      //   // this.options.animations.splice(i,0,image_datas[j]);
      // }
      // delete this.options.animations.splice[i];
      // i = i + image_datas.length - 1;
      // this.options.animations.splice(i,1,image_datas);
    }
console.log(this.options.animations);
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
      var request = e.currentTarget;
      this.options.contents_sounds[data.id] = {};
      this.options.contents_sounds[data.id].context = new (window.AudioContext || window.webkitAudioContext)();
      this.options.contents_sounds[data.id].context.decodeAudioData(request.response, (function(data,buffer){
        this.options.contents_sounds[data.id].buffer = buffer;
        this.options.contents_sounds[data.id].source = this.options.contents_sounds[data.id].context.createBufferSource();
        this.options.contents_sounds[data.id].source.connect(this.options.contents_sounds[data.id].context.destination);
        this.options.contents_sounds[data.id].startTime = 0;
        this.options.contents_sounds[data.id].pauseTime = 0;
        var maxTime = (typeof data.maxTime !== "undefined" && data.maxTime && Number(data.maxTime) < buffer.duration) ? Number(data.maxTime) : buffer.duration;
        this.options.contents_sounds[data.id].maxTime   = maxTime;
        this.viewTime();
        this.load_contents();
      }).bind(this,data));
    }).bind(this,data);
    request.send();
  };

  // 読み込み終了したsoundのtotal再生時間数を取得
  $$.prototype.loaded_sound_totalMaxTime = function(){
    var globalTime = 0;
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
// console.log(target_images.length);
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
    elm.style.setProperty("animation" , "anim-"+ mode +" "+ time +"s linear forwards" , "");
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
    var target = e.currentTarget;
    if(!target){return}
    var play_flg = target.getAttribute("data-play");
    // play -> pause
    if(play_flg == 1){
      target.setAttribute("data-play","0");
      this.stopSound();
      clearInterval(this.options.animFlg);
    }
    // pause->play
    else{
      target.setAttribute("data-play","1");
      this.playSound();
      this.options.animFlg = setInterval((function(){this.viewTime()}).bind(this) , this.options.intervalTime);
      this.pauseButton_fadeout();
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
		if(typeof sound.source === "undefined" || !sound.source){
			sound.source = sound.context.createBufferSource();
	    sound.source.connect(sound.context.destination);
		}
    sound.source.buffer = sound.buffer;
    sound.source.start(0 , sound.pauseTime);
    sound.startTime = sound.context.currentTime - sound.pauseTime;
    this.viewTime();
  };

	// sound-pause
	$$.prototype.stopSound = function(){
    var sound = this.options.contents_sounds[this.options.current_sound_id];
    if(typeof sound.source === "undefined"){return;}
    sound.pauseTime = sound.context.currentTime - sound.startTime;
    sound.source.disconnect();
    sound.source.stop();
    delete sound.source;
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
      var movie = document.querySelector(this.options.target.base);
      this.click_base({currentTarget:movie});
      this.options.current_sound_id = 0;
    }
  };

  // AudioContext用現在時刻の取得
  $$.prototype.getCurrentTime = function(){
    var sound = this.options.contents_sounds[this.options.current_sound_id];
    if(!sound){return;}
    // return sound.context.currentTime;
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













  

  // 全てのloadが完了したかチェック
  $$.prototype.checkLoadedCount = function(minor){
    minor = (minor) ? minor : 0;
    this.options.loading_count += minor;

    // loading
    if(this.options.loading_count > 0){
      this.options.contentsLoaded = false;
			return true;
		}
		
		// loaded
		else{
      var elm = document.querySelector("#movie .loading");
			if(elm){
				elm.parentNode.removeChild(elm);
			}
			// 読み込み完了後にアニメーションのfrom-toの値を調整する。
			this.setAnimationFromToValue();
			// anim-set処理
			this.createAnimationSetting();
			// 素材読み込み完了（動画再生できる準備完了）
			console.log("Loaded !!!");
			//
      this.options.contentsLoaded = true;
      
      this.event_set_init();

      return false;
    }
			
  };
  $$.prototype.event_set_init = function(){
    __event(document.getElementById("movie") , "click" , (function(e){this.toggleMovie(e)}).bind(this));
  };











	$$.prototype.getImageFilePath = function(dir , id , extension){
		return dir + id + ".l." + extension;
	};
	// 画像一覧を表示する時に任意のグループでまとめたい時の為のグループ設定
	$$.prototype.getImageListsGroup = function(json){
		if(typeof json.group !== "undefined" && json.group){
			return json.group;
		}
		else{
			return "";
		}
	};

	// 初期設定チェック※ページ内に必要要素があるかどうか判定
	// return @ {uid , wall-id}
	$$.prototype.getId = function(){
		if(document.getElementById("movie") === null){
			return false;
		}
		if(document.getElementById("uid")  === null
		|| document.getElementById("wall") === null){
			return false;
		}
		var uid  = document.getElementById("uid").value;
		var wall = document.getElementById("wall").value;
		return {uid:uid , wall:wall};
	};

	// 各種イベント設定
	$$.prototype.setEvents = function(){
		// __setEvent(document.getElementById("movie")      , "click" , (function(e){this.toggleMovie(e)}).bind(this));
		__setEvent(document.getElementById("fullscreen") , "click" , (function(e){this.setFullscreen(e)}).bind(this));
		__setEvent(window , "keydown" , (function(e){this.keydown(e)}).bind(this));
		__setEvent(window , "keyup"   , (function(e){this.keyup(e)}).bind(this));
	};

	// 定義ファイル（timeline.json）の取得
	$$.prototype.loadJson = function(file , func , json){
		new $$ajax({
      url       : json.file + "?" + (+new Date()),
      method    : "GET",
      async     : true,
      onSuccess : func
    });
  };

  // 
	$$.prototype.loadUrl = function(url , func , json){
    var group = (json && typeof json.group === "undefined") ? "" : json.group;
    var uid   = this.options.uid;
    var wall  = this.options.wall;
    var type  = "";
		new $$ajax({
      url       : url,
      method    : "POST",
			query     : {
				php     : "\\mynt\\service\\timeline::getJson('"+uid+"','"+wall+"','"+type+"')",
        group   : group,
        exit    : true
			},
      async     : true,
      onSuccess : func
    });
	};

	// 読み込んだ定義ファイル処理(サーバーからのテキストレスポンスをそのまま処理する)
	$$.prototype.setJson = function(res){
		if(!res){console.log();
			this.options.loading--;
			this.checkLoading();
			return;
		}

		var json = JSON.parse(res);
		if(!json || !json.length){
			this.options.loading--;
			this.checkLoading();
			return;
		}

		for(var i=0; i<json.length; i++){
			if(typeof json[i].mode === "undefined" || !json[i].mode){continue;}
			this.setJson_modeProc(json[i]);
		}
		this.options.loading--;
		this.checkLoading();
	};

	$$.prototype.setJson_modeProc = function(json){
		switch ( json.mode ){
			case "load":
        this.options.loading++;
				if(typeof json.url !== "undefined" && json.url){
					this.loadUrl(json.url , (function(e){this.setJson(e)}).bind(this) , json);
				}
				else if(typeof json.file !== "undefined" && json.file){
					this.loadJson(json.file , (function(e){this.setJson(e)}).bind(this) , json);
				}
				break;

			case "pic":
				this.loadPics(json);
				break;

			case "text":
				this.setText(json);
				break;

			case "bgm":
        this.options.loading++;
				this.loadMusic(json);
				break;

			case "anim":
				this.setAnimation(json);
				break;

			// 読み込み完了後の処理
			case "anim-set":
				this.options.animSet.push(json);
				break;

			case "good-rank":
				if(typeof json.lists !== "undefined"){
					this.options.goodRanks = json.lists;
					for(var i=0; i<goodRanks.length; i++){
						var path = this.getImageFilePath(this.options.goodRanks[i].path , this.options.goodRanks[i].file , this.options.goodRanks[i].extension);
					this.options.goodRanksID.push(path);
					}
				}
				break;
		}
	};

	// 画像の一括読み込み処理
  $$.prototype.loadPics = function(data){
    if(!data || typeof data.file === "undefined"){return;}
		var movie = document.getElementById("movie");
    if(!movie){return;}
    var img = document.createElement("img");
    img.src = data.file;
		img.setAttribute("class" , "pics");
		img.id = (typeof data.id !== "undefined" && data.id) ? data.id : data.file;
		img.style.setProperty("visibility","hidden","");
		img.setAttribute("data-image-group" , this.getImageListsGroup(data));
    movie.appendChild(img);
  };

  

	// set-text-element
	$$.prototype.setText = function(data){
		var txt = document.createElement("div");
		txt.className = "text";
		txt.id = data.id;
		// textContents
		if(typeof data.text !== "undefined"){
			txt.innerHTML = data.text;
		}
		// file
		if(typeof data.file !== "undefined"){
			new $$ajax({
	      url       : data.file + "?" +(+new Date()),
	      method    : "GET",
				query     : {
					id      : data.id,
					anim    : data.anim
				},
	      async     : true,
	      onSuccess : function(res){
					if(!res){return;}
					var elm = document.getElementById(this.query.id);
					if(elm){
						elm.innerHTML = res;
					}
				}
	    });
		}
		// style
		if(typeof data.style !== "undefined"){
			txt.style = data.style;
		}
		txt.style.setProperty("z-index",1000,"");
		txt.style.setProperty("visibility","hidden","");
		// attribute
		if(typeof data.attribute !== "undefined"){
			for(var i in data.attribute){
				txt.setAttribute(i , data.attribute[i]);
			}
		}
		// add
		var movie = document.getElementById("movie");
		movie.appendChild(txt);
	};

	// set-animation
	// $$.prototype.setAnimation = function(json){
	// 	this.options.animation.push(json);
	// };
	$$.prototype.createAnimationSetting = function(){
		for(var i=0; i<this.options.animSet.length; i++){
			this.setAnimationSetting(this.options.animSet[i]);
		}
	};
	// アニメーション設定に必要な
	$$.prototype.getAnimationTimeInfo = function(from,to,count){
		var start = this.convertTimeValue("from" , from , this.options.maxTime);
		var end   = this.convertTimeValue("to"   , to   , this.options.maxTime);
		var between = end - start; // アニメーションパートの間隔秒数
		var betweenOnce = Number((Number(between / count * 10) / 10).toFixed(2)); // 個別イメージ毎の間隔秒数
		var betweenGoodRankOnce = Number((Number(between / (count + 5) * 10) / 10).toFixed(2)); // 個別イメージ毎の間隔秒数
		return {
			term     : start,
			interval : betweenOnce,
			goodRank : betweenGoodRankOnce
		};
	};
	$$.prototype.getAnimationDataOption = function(option , timeInfo){
		option = (!option) ? {} : option;
		if(typeof option["anim-fo"] !== "undefined" && option["anim-fo"] !== ""){
			option["anim-fo"] = Number(option["anim-fo"]);
			option["anim-fo"] = (!option["anim-fo"]) ?  2 : option["anim-fo"];
			// 指定秒数または、それより短い間隔値の場合は間隔値の半分値
			option["anim-fo"] = (timeInfo.interval / 2 > option["anim-fo"]) ? option["anim-fo"] : timeInfo.interval / 2;
		}
		return option;
	};
	// animation-setを元に、タイムラインにanim設定を追加する処理
	$$.prototype.setAnimationSetting = function(json){
		// アニメーションタイプが設定されていない場合は処理しない
		if(typeof json.type === "undefined" || !json.type){return;}
		// 使用する画像の枚数（指定が無い場合は1枚のみ）
		json.count = (typeof json.count === "undefined" || !json.count) ? 1 : Number(json.count);
		// 各種情報取得
		var timeInfo = this.getAnimationTimeInfo(json.from , json.to , json.count);
		// option
		json.option = this.getAnimationDataOption(json.option , timeInfo);
		// 値を初期化
		if(json.type === "sort"){this.options.sortPrev = 0;}

		var group = this.getImageListsGroup(json);

		// ランダム処理
		if(json.type === "random"){
			for(var i=0; i<json.count; i++){
				var id = this.getAnimationImageId_random(group);
				this.addAnimation(i , id , json , timeInfo);
			}
		}
		// 順番表示処理
		else if(json.type === "sort"){
			for(var i=0; i<json.count; i++){
				var id = this.getAnimationImageId_sort(i , group);
				this.addAnimation(i , id , json , timeInfo);
			}
		}
		// イイネランキング
		else if(json.type === "goodRanks" && this.options.goodRanks.length && json.count >= 3){
			this.addAnimation_goodRank(json , timeInfo);
		}
		// イイネランキング-No1のみを表示
		else if(json.type === "goodRank-1" && this.options.goodRanks.length){
			this.addAnimation_goodRank_1(json , timeInfo);
    }
  };
  
	$$.prototype.addAnimation = function(i , id , json , timeInfo){

		// アニメパターンの読み込み
		var defaultAnimPettern = this.getAnimationPattern(json.anim);
		// デフォルトアニメーションパターン（ズームイン）
		var elm = document.getElementById(id);
		if(elm === null){return;}

		// 縦長サイズの画像は、縦スクロール
		if(elm.offsetWidth < elm.offsetHeight){
			defaultAnimPettern = "anim-up";
		}
		// 情報付与
		this.options.animation.push({
			mode   : "anim",
			id     : id,
			anim   : defaultAnimPettern,
			option : json.option,
			from   : timeInfo.term + (timeInfo.interval * i),
			to     : timeInfo.term + (timeInfo.interval * (i+1))
		});
  };
  
	$$.prototype.addAnimation_goodRank = function(json , timeInfo){
		// add-text-element
		this.setText({
			"mode"  : "text",
			"id"    : "goodRank-title",
	    "text"  : json.text,
	    "style" : "font-size:60px;color:white;font-weight:bold;top:calc(50% - 30px);"
		});
		this.setText({
			"mode"  : "text",
			"id"    : "goodRank-ranking",
	    "text"  : "Ranking",
			"attribute" : {
				"data-view-type":"ranking"
			}
		});
		// title - [0]
		this.options.animation.push({
			mode   : "anim",
			id     : "goodRank-title",
			anim   : "anim-fi-fo-slow",
			from   : timeInfo.term,
			to     : timeInfo.term + timeInfo.goodRank
		});

		// 10位(任意)- 4位まで - [1 - 7]
		for(var i=0; i<json.count-3; i++){
			var num = this.options.goodRanks.length - i -1;
			var id = this.getImageFilePath(this.options.goodRanks[num].path , this.options.goodRanks[num].file , this.options.goodRanks[num].extension);
			var viewString = this.createGoodString(num + 1 , id);
			var st = Number(timeInfo.term) + (Number(timeInfo.goodRank) * (i + 1));
			var ed = Number(timeInfo.term) + (Number(timeInfo.goodRank) * (i + 2));
			this.options.animation.push({
				mode   : "anim",
				id     : id,
				anim   : "anim-zi-slow",
				option : {"anim-fo" : "1.0"},
				from   : st,
				to     : ed
			});
			this.options.animation.push({
				mode   : "anim",
				id     : "goodRank-ranking",
				text   : viewString,
				from   : st,
				to     : ed
			});
		}

		// 3位 - 1位 [8-14(15)]
		var cnt = 0;
		for(var i=json.count-3; i<json.count; i++){
			var num = this.options.goodRanks.length - i -1;
			var st1 = Number(timeInfo.term) + (Number(timeInfo.goodRank) * (i + 1 + (cnt*1)));
			var ed1 = Number(timeInfo.term) + (Number(timeInfo.goodRank) * (i + 2 + (cnt*1)));
			var id  = this.getImageFilePath(this.options.goodRanks[num].path , this.options.goodRanks[num].file , this.options.goodRanks[num].extension);
			var viewString = this.createGoodString(num + 1 , id);
			this.options.animation.push({
				mode   : "anim",
				id     : "goodRank-title",
				anim   : "anim-fi-fo-slow",
				text   : "No. " + (num + 1),
				from   : st1,
				to     : ed1
			});

			var st2 = Number(timeInfo.term) + (Number(timeInfo.goodRank) * (i + 2 + (cnt*1)));
			var ed2 = Number(timeInfo.term) + (Number(timeInfo.goodRank) * (i + 3 + (cnt*1)));
			var option = {};
			var anim   = "anim-zi-slow";
			// No1の表示秒数は倍
			if(json.count-1 === i){
				ed2 = Number(timeInfo.term) + (Number(timeInfo.goodRank) * (i + 4 + (cnt*1)));
				option = {
					"anim-fo":"2.0"
				};
				anim   = "anim-zi";
			}

			this.options.animation.push({
				mode   : "anim",
				id     : id,
				anim   : anim,
				option : option,
				from   : st2,
				to     : ed2
			});
			this.options.animation.push({
				mode   : "anim",
				id     : "goodRank-ranking",
				text   : viewString,
				// option : option,
				from   : st2,
				to     : ed2
			});

			cnt++;
		}
	};
	$$.prototype.createGoodString = function(num , id){
		var viewString = "No. " + num;
		viewString += "<span class='good good-blank'></span>";
		viewString += "<span class='good good-image'></span>";
		viewString += "<span class='good good-count'>"+this.getGoodRankInfo(id , "count")+"</span>";
		return viewString;
	};
	// GoodRank-No1のみを表示
	$$.prototype.addAnimation_goodRank_1 = function(json , timeInfo){
		var st = this.convertTimeValue("from" , json.from , this.options.maxTime);
		var ed = this.convertTimeValue("to"   , json.to   , this.options.maxTime);
		var id  = this.getImageFilePath(this.options.goodRanks[0].path , this.options.goodRanks[0].file , this.options.goodRanks[0].extension);
		var option = {
		};
		this.options.animation.push({
			mode   : "anim",
			id     : id,
			anim   : (typeof json.anim !== "undefined") ? json.anim : {},
			option : option,
			from   : st,
			to     : ed
		});
	};
	$$.prototype.getGoodRankInfo = function(picsId , key){
		if(!picsId || !key){return "";}
		var data = "";
		for(var i=0; i<this.options.goodRanks.length; i++){
			var path = this.getImageFilePath(this.options.goodRanks[i].path , this.options.goodRanks[i].file , this.options.goodRanks[i].extension);
			if(picsId !== path){continue;}
			if(typeof this.options.goodRanks[i][key] !== "undefined"){
				data = this.options.goodRanks[i][key];
				break;
			}
		}
		return data;
	};

	// animation
	$$.prototype.getAnimationPattern = function(anim){
		if(anim === "random()"){
			var num = Math.floor(Math.random() * this.options.animation_val.length);
			return this.options.animation_val[num];
		}
		else if(anim !== ""){
			return type;
		}
		return "";
	};

	// BGM再生
  $$.prototype.playMusic = function(){
		if(typeof this.source === "undefined"){
			this.source = this.context.createBufferSource();
	    this.source.connect(this.context.destination);
		}
    this.source.buffer = this.buffer;
		this.source.start(0,this.options.pauseTime);
    this.options.startTime = this.context.currentTime - this.options.pauseTime;
  };

	// BGM停止
	$$.prototype.stopMusic = function(){
		if(typeof this.source === "undefined"){return;}
		this.options.pauseTime = this.context.currentTime - this.options.startTime;
    this.source.disconnect();
    this.source.stop();
    delete this.source;
  };
	

  // 再生・停止のトグル処理
	$$.prototype.toggleMovie = function(){
		if(this.options.contentsLoaded === false){return;}

		var movie = document.getElementById("movie");
		if(movie.getAttribute("data-play") != 1){
			this.playMovie();
		}
		else{
			this.stopMovie();
		}
  };
  
	// 動画再生
	$$.prototype.playMovie = function(){
		var movie = document.getElementById("movie");

		// 音楽再生開始
		this.playMusic();

		this.animFlg = setInterval((function(){this.playTimeline()}).bind(this) , 100);
		movie.setAttribute("data-play",1);
		// // 画像開始
		this.pauseTimeline(true);
	};

	// 動画停止
	$$.prototype.stopMovie = function(){
		var movie = document.getElementById("movie");

		// 音楽再生開始
		this.stopMusic();

		// 画像停止
		this.pauseTimeline(false);
		movie.setAttribute("data-play" , 0);

		// タイムライン停止
		clearInterval(this.animFlg);
	};

	// 動画のタイムライン表示処理
	// $$.prototype.viewTime = function(){
	// 	var currentTime = this.getCurrentTime();
	// 	var fullTime = this.options.maxTime;
	// 	var movieTime = document.getElementById("movieTime");
	// 	movieTime.innerHTML = this.setFormatTime(currentTime) +" / "+ this.setFormatTime(fullTime);
	// };
	$$.prototype.playTimeline = function(){
		// 現在時間
		var currentTime = this.getCurrentTime();
		// 曲全体時間
		var fullTime = this.options.maxTime;
		// 差一斉終了チェック
		if(this.checkMovieEnd(currentTime , fullTime) === true){
			return;
		}

		// 現在時間（曲再生時間）と、セットされたタイムラインの判定
		this.getCurrentTimeline(currentTime , fullTime);

		var movieTime = document.getElementById("movieTime");
		movieTime.innerHTML = this.setFormatTime(currentTime) +" / "+ this.setFormatTime(fullTime);
	};

	

	// 動画終了時間の判定
	// return @ true:終了 false:再生途中
	$$.prototype.checkMovieEnd = function(currentTime , fulltime){
		if(currentTime >= fulltime){
			this.stopMovie();
			return true;
		}
		else{
			return false;
		}
	};

	// 現在の動画のタイムライン（時間）を取得
	$$.prototype.getCurrentTimeline = function(currentTime , fulltime){
		if(typeof this.now === "undefined"){this.now = {};}

		// fulltime終了１秒前は処理をせずに停止する。
		if(Number(currentTime) > fulltime - 1){return;}

		// 通常アニメ
		var t = this.options.animation;
		for(var i=0; i<t.length; i++){
			if(typeof t[i].mode === "undefined"){
				continue;
			}
			// 時間対象外（開始前）->処理無
			if(typeof t[i].from !== "undefined"
			&& t[i].from !== ""
			&& Number(t[i].from) > Number(currentTime)){
				continue;
			}
			// 時間対象外（終了後）終了処理（終了直後の場合は停止処理）
			if(typeof t[i].to   !== "undefined"
			&& t[i].to   !== ""
			&& Number(t[i].to)   < Number(currentTime)){
				this.getCurrentTimeline_finish(i , t[i]);
				continue;
			}
			// 対象時間内で既に処理登録されている画像（処理中）は対象外
			if(typeof this.now[i] !== "undefined"){continue;}
			// 処理データに登録
			this.now[i] = t[i];
			// 対象画像の開始処理
			this.getCurrentTimeline_current(i , t[i]);
		}
	};

	// タイムラインの個別画像の表示終了後処理
	$$.prototype.getCurrentTimeline_finish = function(num , json){
		if(typeof this.now[num] === "undefined"){return;}
		// キャッシュデータを削除
		delete this.now[num];
		// 対象画像の指定有(id)
		var elm = this.getAnimationImage(json);
		if(!elm){return;}
		// FO処理
		if(typeof json.option !== "undefined"
		&& typeof json.option["anim-fo"] !== "undefined"
		&& json.option["anim-fo"] !== ""){
			elm.style.setProperty("transition-duration" , json.option["anim-fo"] + "s" , "");
			elm.setAttribute("data-css-fo","1");
		}
		// 通常:非表示処理
		else{
			elm.style.setProperty("visibility","hidden","");
		}
  };
  
	// タイムラインの個別画像の処理開始処理
	$$.prototype.getCurrentTimeline_current = function(num , json){

		var elm = this.getAnimationImage(json);
		if(!elm){return;}
		// idが付与されていないときはファイルパスをIDとして付与する
		if(typeof this.now[num].id === "undefined"){
			this.now[num].id = elm.id;
		}
		// reset css animation（この処理をしないと、前回のanimationが残ったままになる）
		elm.parentNode.insertBefore(elm , elm);
		// 時間設定
		if(typeof json.anim !== "undefined" && json.anim){
			var fulltime = this.options.maxTime;
			var st = this.convertTimeValue("from" , json.from , fulltime);
			var ed = this.convertTimeValue("to"   , json.to   , fulltime);
			var between = ed - st;
			elm.style.setProperty("animation", json.anim +" "+ between +"s linear forwards","");
		}
		if(elm.className === "pics"){
			elm.style.setProperty("z-index",(this.options.animation.length - num + 100),"");
		}
		else if(elm.className === "text"){
			elm.style.setProperty("z-index",(this.options.animation.length - num + 1000),"");
			if(typeof json.text !== "undefined"){
				elm.innerHTML = json.text;
			}
		}
		// style
		if(typeof json.style !== "undefined"){
			this.setElementStyle(elm , json.style);
		}
		// 表示処理
		elm.style.setProperty("visibility","visible","");
		elm.setAttribute("data-css-fo","0");
		// スクロール対応
		this.setAnimationEnd(elm , json);
  };
  
	$$.prototype.setElementStyle = function(elm , cssString){
		if(!cssString){return;}
		cssString = cssString.split("\n").join("");
		var sp = cssString.split(";");
		for(var i=0; i<sp.length; i++){
			var css = sp[i].split(":");
			elm.style.setProperty(css[0] , css[1] , "");
		}
	};

	// アニメーション設定での対象画像の取得 [ id指定 , random , イイネランキング , etc... ]
	$$.prototype.getAnimationImage = function(json){
		// 直接ID指定
		if(typeof json.id !== "undefined" && json.id){
			var target = document.getElementById(json.id);
			if(target !== null){
				return target;
			}
			else{
				return null;
			}
		}
		// random
		if(typeof json.type !== "undefined" && json.type === "random"){
			var target = this.getAnimationImage_random();
			if(target !== null){
				return target;
			}
			else{
				return null;
			}
		}
	};

	// 画像一覧のグローバル変数作成
	$$.prototype.getImageGroup = function(group){
		group = (!group) ? 0 : group;
		if(typeof this.options.randomGroup[group] === "undefined"){
			this.options.randomGroup[group] = [];
		}
		// 空の場合は全部読み込み直す
		if(!this.options.randomGroup[group].length){
			var randomListsBase = document.querySelectorAll('#movie img.pics[data-image-group="'+group+'"]');
			for(var i=randomListsBase.length-1; i>=0; i--){
				if(this.options.goodRanksID.indexOf(randomListsBase[i].id) === -1){
					this.options.randomGroup[group].push(randomListsBase[i]);
				}
			}
		}
		return this.options.randomGroup[group];
	};
	// 画像一覧のグローバル変数から値を削除
	$$.prototype.removeImageListspart = function(group , num){
		group = (!group) ? 0 : group;
		if(typeof this.options.randomGroup[group] === "undefined" || !this.options.randomGroup[group].length){return;}
		this.options.randomGroup[group].splice(num , 1);
	};
	$$.prototype.getAnimationImageId_random = function(group){
		group = (!group) ? 0 : group;
		var lists = this.getImageGroup(group);
		// 既存データがない場合は処理しない
		if(!lists.length){return;}
		var num = Math.floor(Math.random() * Math.floor(lists.length));
		var id  = lists[num].id;
		this.removeImageListspart(group , num);
		return id;
	};
	// 事前準備された画像を順番にピックアップする
	$$.prototype.getAnimationImageId_sort = function(num , group){
		group = (!group) ? 0 : group;
		var pics = this.getImageGroup(group);
		if(!pics.length){return null;}
		var id = pics[0].id;
		this.removeImageListspart(group , 0);
		return id;
	};

	// 画面の端から端までアニメーション処理
	$$.prototype.setAnimationEnd = function(elm,data){
		if(typeof data.anim === "undefined" || !data.anim){return;}
		switch(data.anim){
			case "anim-scroll-up":
				elm.style.setProperty("bottom", (elm.offsetHeight * -1) + "px","");
				break;
			case "anim-move-right":
				elm.style.setProperty("left", (elm.offsetWidth * -1) + "px","");
				break;
			case "anim-move-left":
				elm.style.setProperty("right", (elm.offsetWidth * -1) + "px","");
				break;
		}
	};

	// 縦スクロール
	$$.prototype.setTimeline_verticalScroll = function(t , i , currentTime , fulltime){
		if(typeof this.now[i] !== "undefined"){return;}
		this.now[i] = t[i];
		// 画像表示
		var id = "pic_"+t[i].id;
		var txt = document.createElement("div");
		txt.id = id;
		txt.innerHTML = t[i].text;
		txt.style = t[i].style;
		txt.style.setProperty("z-index",(t.length - i + 100),"");
		var movie = document.getElementById("movie");
		movie.appendChild(txt);
		if(typeof t[i].anim !== "undefined" && t[i].anim){
			var st = this.convertTimeValue("from" , t[i].from , fulltime);
			var ed = this.convertTimeValue("to"   , t[i].to   , fulltime);
			var between = ed - st;
			var keyframe = "anim-" + t[i].anim;
			txt.style.setProperty("animation", keyframe +" "+between+"s linear forwards","");
			txt.style.setProperty("visibility","visible","");
		}
	};

	$$.prototype.setAnimationFromToValue = function(){
    var fulltime = this.options.maxTime;
		for(var i=0; i<this.options.animation.length; i++){
			this.options.animation[i].from = this.convertTimeValue("from" , this.options.animation[i].from , fulltime);
			this.options.animation[i].to   = this.convertTimeValue("to"   , this.options.animation[i].to   , fulltime);
		}
	};
	// type [ from , to ]
	$$.prototype.convertTimeValue = function(type="from" , currentTime , fullTime){
		// 指定無しは"0"
		if(!currentTime){
			if(type === "from"){
				return 0;
			}
			else{
				return fullTime;
			}
		}
		// %指定（全体値の割合）
		else if(currentTime.toString().match(/([\-0-9]+?)%$/)){
			var num = Number(RegExp.$1);
			if(num > 100){
				num = 100;
			}
			var sec = Number(fullTime / 100 * num * 10) /10;
			sec = Number(sec.toFixed(2));
			// 先頭からの秒数
			if(num >= 0){
				return sec;
			}
			// 最終値からの秒数
			else{
				return fullTime + sec;
			}
		}
		// 通常（秒数）
		else{
			var sec = Number(currentTime);
			// 先頭からの秒数
			if(sec >= 0){
				return sec;
			}
			// 最終値からの秒数
			else{
				return fullTime + sec;
			}
		}
	}

	// 映像停止
	$$.prototype.pauseTimeline = function(flg){
		if(typeof this.now === "undefined"){return;}
		this.pause = (flg) ? true : false;
		for(var i in this.now){
			var id = this.now[i].id;
			var elm = document.getElementById(id);
			if(elm !== null){
				// 再生->停止
				if(flg !== true){
					elm.style.setProperty("animation-play-state","paused","");
				}
				// 停止->再開
				else{
					elm.style.setProperty("animation-play-state","running","");
				}
			}
		}
	};

	// 映像非表示
	$$.prototype.setPicsBlack = function(flg){
		if(typeof this.now === "undefined"){return;}
		for(var i in this.now){
			var id = "pic_" + this.now[i].id;
			var elm = document.getElementById(id);
			if(elm !== null){
			}
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
				document.webkitExitFullscreen();
				document.getElementById("movie").setAttribute("data-full","0");
				break;
			// F1 : fullscreen
			case 112:
          this.setFullscreen();
				break;
			// enter :13
			case 13:
          this.toggleMovie();
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
				// css動作停止
				// this.pauseTimeline();

				// 画像非表示
				this.setPicsBlack();

				// 再生停止
				this.stopMovie();

				// mp3停止
				// document.getElementById("music").currentTime = 0;
				this.bgm.currentTime = 0;
				break;
		}
		// cache
		this.options.keyCache.push(e.keyCode);
	};

	// screen
	$$.prototype.setFullscreen = function(){
		document.getElementById("movie").webkitRequestFullScreen();
		document.getElementById("movie").setAttribute("data-full","1");
	};

  
  // 起動 (onload待ち)
  // __construct();
  return $$;
})();

/**
# timeline-setting-format
mode : [ set , anim , text]
--
set :
	id  : Reading ID
	pic : Picture file path

anim :
	id   : Target material (str)
	from : start time (num)
	to   : finish time (num)
	anim : animation pettern symbol (str)
	times : [ from , to ] (array num)
	anims : [ symbol array ] (array str)
	random : [ multi id(array) ] (array str)

text :
	id   : Target material
	from : start time
	to   : finish time
	text : view string
	style : css


*/
