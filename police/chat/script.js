(() => {
  "use strict";

  // ===== ここだけ変えれば後からURLや待ち時間を調整できます =====
  const CONFIG = {
    messageDelay: 3000,
    typingLeadTime: 850,
    puzzleUrl: "../../mystery/",
    databaseUrl: "../db/",
    saveProgress: true
  };

  const STORAGE_KEY = "phantom-case-police-chat-v1";

  const messageList = document.getElementById("messageList");
  const typingIndicator = document.getElementById("typingIndicator");
  const actionArea = document.getElementById("actionArea");
  const chatForm = document.getElementById("chatForm");
  const chatInput = document.getElementById("chatInput");
  const sendButton = document.getElementById("sendButton");
  const resetButton = document.getElementById("resetButton");

  const state = {
    phase: "boot",
    dateFailures: 0,
    locationFailures: 0,
    declineCount: 0,
    busy: false,
    completed: false
  };

  // ---------- Utility ----------
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  function nowText() {
    return new Intl.DateTimeFormat("ja-JP", {
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date());
  }

  function scrollToBottom() {
    requestAnimationFrame(() => {
      messageList.scrollTop = messageList.scrollHeight;
    });
  }

  function setTyping(visible) {
    typingIndicator.classList.toggle("is-hidden", !visible);
    scrollToBottom();
  }

  function setBusy(value) {
    state.busy = value;
    chatInput.disabled = value;
    sendButton.disabled = value;
  }

  function setInputEnabled(value, placeholder = "メッセージを入力") {
    chatInput.disabled = !value;
    sendButton.disabled = !value;
    chatInput.placeholder = placeholder;
    if (value) {
      window.setTimeout(() => chatInput.focus(), 80);
    }
  }

  function clearActions() {
    actionArea.innerHTML = "";
  }

  function addMessage(text, sender = "police") {
    const row = document.createElement("div");
    row.className = `message-row ${sender === "user" ? "user" : "police"}`;

    if (sender !== "user") {
      const avatar = document.createElement("div");
      avatar.className = "avatar";
      avatar.setAttribute("aria-hidden", "true");
      avatar.textContent = "相";
      row.appendChild(avatar);
    }

    const stack = document.createElement("div");
    stack.className = "message-stack";

    if (sender !== "user") {
      const senderName = document.createElement("div");
      senderName.className = "sender";
      senderName.textContent = "相沢 直人";
      stack.appendChild(senderName);
    }

    const bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.textContent = text;
    stack.appendChild(bubble);

    const time = document.createElement("div");
    time.className = "time";
    time.textContent = nowText();
    stack.appendChild(time);

    row.appendChild(stack);
    messageList.appendChild(row);
    scrollToBottom();
  }

  async function policeSay(text, delay = CONFIG.messageDelay) {
    setInputEnabled(false, "相沢が入力中…");
    setTyping(true);

    const typingMs = Math.min(CONFIG.typingLeadTime, Math.max(350, delay - 250));
    await sleep(typingMs);

    setTyping(false);
    addMessage(text, "police");

    const remain = Math.max(0, delay - typingMs);
    if (remain > 0) await sleep(remain);
  }

  async function policeSequence(messages, finalDelay = 0) {
    state.busy = true;
    for (const item of messages) {
      if (typeof item === "string") {
        await policeSay(item);
      } else {
        await policeSay(item.text, item.delay ?? CONFIG.messageDelay);
      }
    }
    if (finalDelay) await sleep(finalDelay);
    state.busy = false;
  }

  function userSay(text) {
    addMessage(text, "user");
  }

  function normalizeDigits(text) {
    return text
      .replace(/[０-９]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0))
      .trim();
  }

  function isCorrectDate(raw) {
    const s = normalizeDigits(raw)
      .replace(/\s/g, "")
      .replace(/年|月/g, "/")
      .replace(/日/g, "")
      .replace(/[.\-]/g, "/")
      .replace(/\/+/g, "/");

    const accepted = new Set([
      "2022/10/2",
      "2022/10/02",
      "22/10/2",
      "22/10/02",
      "10/2",
      "10/02"
    ]);

    return accepted.has(s.replace(/\/$/, ""));
  }

  function isBirthdayDate(raw) {
    const s = normalizeDigits(raw)
      .replace(/\s/g, "")
      .replace(/年|月/g, "/")
      .replace(/日/g, "")
      .replace(/[.\-]/g, "/")
      .replace(/\/+/g, "/")
      .replace(/\/$/, "");

    return [
      "2022/10/3", "2022/10/03",
      "22/10/3", "22/10/03",
      "10/3", "10/03"
    ].includes(s);
  }

  function isCorrectLocation(raw) {
    const s = normalizeDigits(raw)
      .replace(/\s/g, "")
      .replace(/[都道府県]/g, "");
    return s === "高知";
  }

  // ---------- Persistence ----------
  function saveState() {
    if (!CONFIG.saveProgress) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...state,
      transcript: [...messageList.querySelectorAll(".message-row")].map(row => ({
        sender: row.classList.contains("user") ? "user" : "police",
        text: row.querySelector(".bubble")?.textContent ?? ""
      }))
    }));
  }

  function loadState() {
    if (!CONFIG.saveProgress) return false;

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;

    try {
      const saved = JSON.parse(raw);
      Object.assign(state, saved);

      if (Array.isArray(saved.transcript)) {
        saved.transcript.forEach(item => addMessage(item.text, item.sender));
      }

      return true;
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      return false;
    }
  }

  function restoreUiForPhase() {
    clearActions();

    if (state.phase === "date") {
      setInputEnabled(true, "事件が起きた日付を入力");
    } else if (state.phase === "location") {
      setInputEnabled(true, "事件が起きた都道府県を入力");
    } else if (state.phase === "cooperation") {
      setInputEnabled(true, "メッセージを入力");
      showCooperationChoices();
    } else if (state.phase === "resources" || state.completed) {
      setInputEnabled(true, "気付いたことがあれば入力");
      showResourceCards();
    } else {
      setInputEnabled(false, "少々お待ちください");
    }
  }

  // ---------- Flow ----------
  async function startFlow() {
    state.phase = "intro";
    setInputEnabled(false, "少々お待ちください");

    await policeSequence([
      "こんにちは。\n怪盗関連事件特別捜査本部の相沢です。",
      "急に手紙が届いて、びっくりしましたよね。",
      "今回、過去に怪盗の被害に遭われた方へ、順番に捜査協力のお願いをしています。",
      "まずはご本人確認だけさせてください。",
      "以前、怪盗による被害に遭われた日を覚えていますか？",
      "事件が起きた日付を入力してください。"
    ]);

    state.phase = "date";
    setInputEnabled(true, "例：2022/10/2");
    saveState();
  }

  async function handleDate(text) {
    if (isCorrectDate(text)) {
      await policeSequence([
        "はい、合っています。",
        "ありがとうございます。",
        "もう一つだけお願いします。",
        "その事件が起きた都道府県はどこでしたか？"
      ]);
      state.phase = "location";
      setInputEnabled(true, "都道府県を入力");
      saveState();
      return;
    }

    state.dateFailures += 1;

    if (isBirthdayDate(text)) {
      await policeSequence([
        "惜しいです。",
        "10月3日は誕生日ですね。",
        "今回確認したいのは、怪盗の事件が起きた日です。",
        "もう一度思い出してみてください。"
      ]);
    } else if (state.dateFailures >= 3) {
      await policeSequence([
        "うーん、その日付では記録が見つかりませんでした。",
        "ヒントを出しますね。",
        "事件が起きたのは、誕生日の前日です。"
      ]);
    } else {
      await policeSequence([
        "うーん、その日付では記録が見つかりませんでした。",
        "誕生日の前後だったと思うので、当時のことを少し思い出してみてください。"
      ]);
    }

    state.phase = "date";
    setInputEnabled(true, "事件が起きた日付を入力");
    saveState();
  }

  async function handleLocation(text) {
    if (isCorrectLocation(text)) {
      await policeSequence([
        "確認できました。",
        "2022年10月2日、高知県で起きた\nCASE13「高知誕生日プレゼント盗難事件」",
        "この事件の被害者の方で間違いありませんね。",
        "ご協力ありがとうございます。",
        "では、今回ご連絡した理由を説明しますね。",
        "数日前、こちらで少し変わったWebページが見つかりました。",
        "誰が作ったのか、どこから公開されたのか、今のところ分かっていません。",
        "ただ、ページの内容を見る限り、怪盗ヘンタイおじさんと関係している可能性があります。",
        "中には、暗号のようなものや、意味の分からない文章もいくつかありました。",
        "私たちでも確認を進めているんですが、正直なところ、まだ全部は解析できていません。",
        "それで過去の事件を調べていたところ、CASE13でも怪盗があなたに謎を解かせていましたよね。",
        "そこでお願いがあります。",
        "実際にあの怪盗の謎を解いた経験がある方の目で、このページを一度見てもらえないでしょうか。",
        "ページを見て「これ何かありそうだな」と思ったことがあれば、このチャットで教えてもらえれば十分です。"
      ]);

      state.phase = "cooperation";
      setInputEnabled(true, "メッセージを入力");
      showCooperationChoices();
      saveState();
      return;
    }

    state.locationFailures += 1;

    if (state.locationFailures >= 3) {
      await policeSequence([
        "その場所では記録が見つかりませんでした。",
        "ヒントです。",
        "事件が起きたのは四国地方です。"
      ]);
    } else {
      await policeSequence([
        "その場所では記録が見つかりませんでした。",
        "当時、旅行先で事件に遭っていたはずです。"
      ]);
    }

    state.phase = "location";
    setInputEnabled(true, "事件が起きた都道府県を入力");
    saveState();
  }

  function showCooperationChoices() {
    clearActions();

    const wrap = document.createElement("div");
    wrap.className = "choice-group";

    const yes = document.createElement("button");
    yes.type = "button";
    yes.className = "choice-button primary";
    yes.textContent = "捜査に協力する";
    yes.addEventListener("click", () => handleCooperation(true));

    const no = document.createElement("button");
    no.type = "button";
    no.className = "choice-button";
    no.textContent = "今回は協力しない";
    no.addEventListener("click", () => handleCooperation(false));

    wrap.append(yes, no);
    actionArea.appendChild(wrap);
  }

  async function handleCooperation(accept) {
    if (state.busy) return;
    clearActions();

    if (accept) {
      userSay("捜査に協力する");

      await policeSequence([
        state.declineCount > 0
          ? "ありがとうございます！\nよかったです。永遠に断られるかと思いました。"
          : "ありがとうございます。助かります。",
        "では、問題のページをお送りします。",
        "あわせて、参考用に怪盗関連事件のデータベースも共有しておきますね。",
        "過去の事件がまとまっている資料です。",
        "今回の解析に必要かどうかは分かりませんが、気になることがあったら見てみてください。"
      ]);

      state.phase = "resources";
      state.completed = true;
      showResourceCards();

      await policeSequence([
        "ページを見ている途中でも、このチャットにはいつでも戻ってきて大丈夫です。",
        "何か見つけたら、気軽に送ってください。",
        "それでは、よろしくお願いします。"
      ], 100);

      setInputEnabled(true, "気付いたことがあれば入力");
      saveState();
      return;
    }

    userSay("今回は協力しない");
    state.declineCount += 1;

    const scripts = [
      [
        "えっ。",
        "協力してくれないんですか？",
        "……冗談ですよね？",
        "大丈夫です。もう一度出しますね。"
      ],
      [
        "あれ。",
        "もう一回「協力しない」を押しました？",
        "押し間違いですよね？",
        "もう一度出しておきます。"
      ],
      [
        "……。",
        "もしかして、本当に協力する気ないですか？",
        "いやいや。",
        "でも、ここまで来てますし。",
        "せっかくなのでお願いします。"
      ],
      [
        "強いですね。",
        "ここまで断られるとは思ってませんでした。",
        "でもこちらも仕事なので。",
        "もう一度だけ聞きます。"
      ],
      [
        "分かりました。",
        "あなたがそのつもりなら、こちらにも考えがあります。",
        "……もう一度聞きます。"
      ]
    ];

    if (state.declineCount <= scripts.length) {
      await policeSequence(scripts[state.declineCount - 1]);
    } else {
      const loopMessages = [
        "まだ押します？",
        "たぶんこのボタン、壊れてませんよ。",
        "協力する方、上ですよ。",
        "一応、捜査協力は任意なんですけどね。",
        "……任意なんですけど。",
        "そろそろお願いします。"
      ];
      const msg = loopMessages[(state.declineCount - scripts.length - 1) % loopMessages.length];
      await policeSequence([msg]);
    }

    state.phase = "cooperation";
    setInputEnabled(true, "メッセージを入力");
    showCooperationChoices();
    saveState();
  }

  function showResourceCards() {
    clearActions();

    const wrap = document.createElement("div");
    wrap.className = "link-cards";

    const puzzle = document.createElement("a");
    puzzle.className = "resource-card";
    puzzle.href = CONFIG.puzzleUrl;
    puzzle.innerHTML = `
      <span class="card-kicker">捜査対象</span>
      <span class="card-title">出所不明Webページ</span>
      <span class="card-desc">作成者不明 / 怪盗ヘンタイおじさんとの関連を調査中</span>
    `;

    const db = document.createElement("a");
    db.className = "resource-card";
    db.href = CONFIG.databaseUrl;
    db.innerHTML = `
      <span class="card-kicker">参考資料</span>
      <span class="card-title">怪盗関連事件データベース</span>
      <span class="card-desc">過去の怪盗関連事件記録</span>
    `;

    wrap.append(puzzle, db);
    actionArea.appendChild(wrap);
  }

  async function handleFreeText(text) {
    // 本編後の自由入力は、後で会話シナリオを追加しやすいよう最低限の応答だけ入れています。
    await policeSequence([
      "ありがとうございます。",
      "内容はこちらでも確認してみます。",
      "ほかにも気になることがあれば、そのまま送ってください。"
    ]);
    setInputEnabled(true, "気付いたことがあれば入力");
    saveState();
  }

  // ---------- Events ----------
  chatForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (state.busy || chatInput.disabled) return;

    const text = chatInput.value.trim();
    if (!text) return;

    chatInput.value = "";
    userSay(text);

    if (state.phase === "date") {
      await handleDate(text);
    } else if (state.phase === "location") {
      await handleLocation(text);
    } else if (state.phase === "cooperation") {
      const normalized = text.replace(/\s/g, "");
      if (/協力する|はい|やります|手伝/.test(normalized)) {
        await handleCooperation(true);
      } else if (/協力しない|いいえ|やめ|断/.test(normalized)) {
        await handleCooperation(false);
      } else {
        await policeSequence([
          "ありがとうございます。",
          "すみません、この確認だけ下のボタンから選んでもらえますか？"
        ]);
        showCooperationChoices();
        setInputEnabled(true, "メッセージを入力");
      }
    } else if (state.phase === "resources" || state.completed) {
      await handleFreeText(text);
    }

    saveState();
  });

  resetButton.addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  });

  // URL末尾に ?reset=1 をつけてもリセットできます
  if (new URLSearchParams(window.location.search).get("reset") === "1") {
    localStorage.removeItem(STORAGE_KEY);
    history.replaceState({}, "", window.location.pathname);
  }

  // ---------- Boot ----------
  const restored = loadState();
  if (restored) {
    restoreUiForPhase();
  } else {
    startFlow();
  }
})();
