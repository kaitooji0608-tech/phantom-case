# phantom-case-police v13

怪盗関連事件特別捜査本部 ARG の静的サイトです。GitHub Pages へそのまま配置できます。

## 配置
リポジトリ直下に `index.html` と `police/` フォルダを置いてください。既存サイトへ上書きする場合は、バックアップ後に差し替えてください。

## 主なURL
- `/police/` トップ
- `/police/chat/` セキュアチャット
- `/police/puzzle/` 5問の記録照合
- `/police/search/` 検索
- `/police/secret/` SECRET INDEX（本編ではクリア後に案内）
- `/police/dev/` テスト用
- `/police/mission/squirrel/` リスQR用ページ

## Instagram URL
`police/records/gr-work-note/index.html` 内の `Instagram：［URL差替予定］` を実URLへ差し替えてください。

## SECRET
全30個。ページを実際に開いた時点で localStorage に FOUND として保存されます。検索結果に表示されただけではカウントしません。

## 検索
- 通常検索：部分一致（通常公開ページ）＋正しい検索語で検索限定ページ
- 複合検索：日本語読点 `、` で2語
- 3語以上はエラー
- 通常公開結果を先、隠し結果を後に表示

## 注意
`/police/dev/` はテスト用です。ユーザーからリンクしない設計ですが、GitHub Pages上ではURLを知っていれば閲覧可能です。
