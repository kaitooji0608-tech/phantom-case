# Phantom Case Flow v7

## 今回のストーリー修正

### 1. 最初の家謎URLは、おじさん本人が投下
警察の闇3件を報告した後、怪盗ヘンタイおじさんが乱入します。

流れ：
- おじさんが警察の件について話す
- 「前回みたいに、もうちょっと遊んでいかない！？」
- おじさん自身がURLを投稿
  - https://phantom-case-police.github.io/phantom-case/house/
- おじさん退場
- 相沢が復帰

相沢側の「怪盗が残した新しい謎ページ」ボタンは廃止。
URLは怪盗のチャット吹き出しから直接クリックします。

### 2. リスの実物導線
最初の家謎の答えは「リス」。

正解後：
- 実際のリスの置物を探す
- 置物の下にQR付きの紙がある
- QRを読む
- おじさんが「相沢クンにも教えてあげれば〜？」と誘導
- 警察チャットに戻る

### 3. 相沢への報告
チャットに戻ると［相沢に報告する］。

会話：
- 自分「QRコードを見つけました」
- 相沢「どこに？」
- 自分「リスの置物の下にありました」
- 相沢「その紙は以前から？」
- 自分「以前はありませんでした」
- 相沢「誰かが意図的に家の中へ置いた可能性があります」

### 4. ここでおじさんが再び乱入
侵入の可能性を相沢が指摘した直後：

- UNKNOWN USER CONNECTED
- 「あ、バレちゃった！？」
- 「今そこにはいないから安心してネ！？」
- 「残りも探してみない！？」
- おじさん本人が次のURLを投稿
  - https://phantom-case-police.github.io/phantom-case/house/traces/
- おじさん退場
- 相沢復帰

これで、第2段階の家探索へ進みます。

### 5. 残された3つの痕跡
`/house/traces/`

各TRACEは：
1. Web上の謎を解く
2. 場所が分かる
3. 実際にその場所へ行く
4. 怪盗が残したカードを探す
5. カードのキーワードをWebへ入力
6. TRACE FOUND

現在の内容は仮です。
本番の謎・場所・キーワードを後で差し替えます。

## テスト用
警察側：
- OP-GOLD
- G-404
- MF-POST

家側：
- リス
- TRACE 01：冷蔵庫 → マンボ
- TRACE 02：ベッド → サマンサ
- TRACE 03：玄関 → おったまげ

## リセット
https://phantom-case-police.github.io/phantom-case/police/chat/?reset=1&build=7

localStorage:
`phantom_case_master_state_v7`


## v8 site prototype
公開側の警察サイトを企業HPのような構造で試作しました。

通常ナビ：
- TOP
- 事件DB
- 怪盗一覧
- 捜査情報
- スタッフ

「セキュアチャット」は通常ナビには表示しません。

ただし、この端末で一度でも警察チャットを開始している場合のみ、
公開サイト各ページのナビ直下に

「捜査協力セッション進行中」
［← 捜査チャットに戻る］

という専用導線が表示されます。

これにより一般閲覧時にはチャットの存在を出さず、
ゲーム進行中だけ相沢へ戻れる設計です。

公開トップ：
https://phantom-case-police.github.io/phantom-case/police/

ゲーム開始：
https://phantom-case-police.github.io/phantom-case/police/chat/


## v9 public police site
- Header redesigned based on the supplied institutional-site reference.
- Site-wide search moved to the top-right header and searches pages, staff, suspects, case records, and news.
- Added /police/about/, /police/message/, /police/contact/, /police/search/.
- Added generated fictional institutional-building hero image.
- Secure chat is still hidden from normal global navigation. During an active chat session, only the session-return strip appears.


## v10
トップページのメインビジュアルを変更しました。

- ヨーロッパ風の重厚な庁舎画像へ変更
- 国旗なし
- メインコピー：
  「正義は、見えないところで支えられている。」
- サブコピー：
  「怪盗関連事件の真相解明に向け、特別捜査本部は継続的な情報収集と分析を行っています。」
- 文字は画像へ焼き込まずHTML/CSSで重ねているため、スマホでも崩れにくい構成です。


## v11 DB prototype
事件DBの情報設計確認用として3件を実装。

- CASE22 怪盗カタッポ：通常事件
- CASE24 怪盗グリッチ：公開CASE＋検索資料＋非公開資料
- CASE23 怪盗ペーパームーン：公開CASE＋非公開作戦資料

CASE本文とRELATED DOCUMENTSを別ページに分離しています。
開発中のみ各記録へ「DEV：公開」「DEV：検索」「DEV：非公開」を表示しています。

検索インデックスにも各CASE・DOCUMENTを登録済みです。
現段階では内部資料も動作確認のため検索対象に含めています。後で公開範囲を整理します。


# v12 Police DB / Dark Records Prototype

警察HP・事件DBの情報量と、3本のARG導線を確認するための試作版です。

## 主な変更
- CASE基本情報を縦テーブルへ変更
- 担当者を個人名＋スタッフページリンク化
- DOCUMENTに添付画像を配置できる共通UIを追加（クリック拡大）
- CASE 11件 / DOCUMENT 34件 / スタッフ個別ページを実装
- 通常ニュース・運用資料・一般CASEを増量
- 検索結果61件。公開ページと、特定キーワードでのみ出る記録を混在
- 開発確認インデックス `/police/dev/` を追加

## 3本の導線
### Glitch
CASE24 → 押収品画像 → 御影 → 特別技術協力員登録 → G-4×× → サイト運用情報 G-404 → 選定・登録審査記録

### Mille-feuille
CASE16 / CASE25 → 共通予告文 → 類似性照合 → 藤堂 → 再捜査却下 → 異動 → MF-17釈放 → COMP-MF17補償・口外条件

### Paper Moon
広報記事 → PA-117 → 未回収資産照会 → 佐野 → `/staff/sn/` → AUD-0214 → ST-204 → CASE23 → PM-02 → OP-GOLD

## 開発用表示
黄色い DEV リボン、DEV公開区分、スタッフ一覧の佐野は本番で削除予定です。
佐野直哉は検索インデックスには登録していないため、「佐野直哉」のサイト内検索は0件になります。
