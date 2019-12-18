Develop
==

# Error
  - 再生中に巻き戻しボタンを押しても、time表示が0にならない
  - 音声なしで最終フレームに行き、再生ボタンが停止しても、さらに再生を押すと時間が継続して進む
  - サウンドがある場合でも、音声ベースではなく、animation指定の時間で継続して欲しい（音声時間ベースのモードも必要）
  - 



# system-flow
  1. init   : $$() ["css-set"] 
  2. onload : setting() ["options" , "make-elements"]
  3. 


