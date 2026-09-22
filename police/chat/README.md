# 警察チャット 初期実装

GitHub Pages のリポジトリに、次のように配置する想定です。

```text
phantom-case-police/
└─ police/
   └─ chat/
      ├─ index.html
      ├─ style.css
      └─ script.js
```

## 今入っている動き

- QRから `/police/chat/` を開く想定
- 相沢のメッセージが約3秒ごとに届く
- 「入力中…」アニメーション
- 日付本人確認
  - `2022/10/2`
  - `2022-10-02`
  - `2022年10月2日`
  - `10/2`
  などを許容
- `10/3` を入力すると誕生日専用の返答
- 場所本人確認（`高知` / `高知県`）
- 捜査協力依頼
- 「今回は協力しない」を何度押しても先へ進めない無限ループ
- 「捜査に協力する」で謎ページ＋警察DBのカードを表示
- 自由入力欄あり
- `localStorage` で進行状況を保存
- 「最初から」でテストリセット可能

## URLを変更する場所

`script.js` 冒頭の `CONFIG` です。

```js
const CONFIG = {
  messageDelay: 3000,
  typingLeadTime: 850,
  puzzleUrl: "../../mystery/",
  databaseUrl: "../db/",
  saveProgress: true
};
```

まだ謎ページのURLを決めていないので、`../../mystery/` は仮です。

## テスト時

チャットを最初から試すには、画面右上の「最初から」を押してください。

またはURL末尾に

```text
?reset=1
```

を付けて開くと履歴を消して再スタートします。

## 本番前にやること

- 右上の「最初から」を非表示にする
- `puzzleUrl` を本番URLへ変更
- 後半の相沢の会話（謎発見後・Instagram発見後・怪盗乱入）を追加
