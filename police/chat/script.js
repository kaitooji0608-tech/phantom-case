(() => {
  "use strict";

  // ===== 後からURLや待ち時間を調整する場所 =====
  const CONFIG = {
    messageDelay: 3000,
    typingLeadTime: 850,
    puzzleUrl: "../../mystery/", // 仮URL
    databaseUrl: "../db/",      // 仮URL
    saveProgress: true
  };

  const STORAGE_KEY = "phantom-case-police-chat-v2";

  const messageList = document.getElementById("messageList");
  const typingIndicator = document.getElementById("typingIndicator");
  const actionArea = document.getElementById("actionArea");
  const chatForm = document.getElementById("chatForm");
  const chatInput = document.getElementById("chatInput");
  const sendButton = document.getElementById("sendButton");

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

  function normalizeDate(raw) {
    return normalizeDigits(raw)
      .replace(/\s/g, "")
      .replace(/年|月/g, "/")
      .replace(/日/g, "")
      .replace(/[.\-]/g, "/")
      .replace(/\/+/g, "/")
      .replace(/\/$/, "");
  }

  function isCorrectDate(raw) {
    const s = normalizeDate(raw);
    return new Set([
      "2022/10/2", "2022/10/02",
      "22/10/2", "22/10/02",
      "10/2", "10/02"
    ]).has(s);
  }

  function isBirthdayDate(raw) {
    const s = normalizeDate(raw);
    return new Set([
      "2022/10/3", "2022/10/03",
      "22/10/3", "22/10/03",
      "10/3", "10/03"
    ]).has(s);
  }

  function isCorrectLocation(raw) {
    const s = normalizeDigits(raw)
      .replace(/\s/g, "")
      .replace(/[都道府県市]/g, "");
    return s === "愛媛" || s === "松山" || s === "道後温泉" || s === "道後";
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
      setInputEnabled(true, "事件が起きた都道府県または市名を入力");
    } else if (state.phase === "cooperation") {
      setInputEnabled(true, "メッセージを入力");
      showCooperationChoices();
    } else if (state.phase === "forced-cooperation") {
      setInputEnabled(true, "メッセージを入力");
      showForcedCooperationChoice();
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
      "現在、過去に怪盗事件の被害に遭われた方へ、確認のため順番にご連絡しています。",
      "今回お送りしたQRコードは、送付先ごとに個別に発行しています。",
      "ご本人以外の方が手紙を見る可能性もありますので、まず簡単な確認だけさせてください。",
      "この案内に関係する怪盗事件が起きた日を覚えていますか？",
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
        "その事件が起きた場所はどこでしたか？
都道府県または市名で入力してください。"
      ]);
      state.phase = "location";
      setInputEnabled(true, "都道府県または市名を入力");
      saveState();
      return;
    }

    state.dateFailures += 1;

    if (isBirthdayDate(text)) {
      await policeSequence([
        "惜しいです。",
        "10月3日は誕生日ですね。",
        "確認したいのは、怪盗による事件が起きた日です。",
        "もう一度思い出してみてください。"
      ]);
    } else if (state.dateFailures >= 3) {
      await policeSequence([
        "その日付は、この案内に紐づいている事件記録と一致しません。",
        "ヒントを出しますね。",
        "事件が起きたのは、誕生日の前日です。"
      ]);
    } else {
      await policeSequence([
        "その日付は、この案内に紐づいている事件記録と一致しません。",
        "当時のことを思い出して、もう一度入力してみてください。"
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
        "ご本人確認は以上です。ありがとうございます。",
        "2022年10月2日、愛媛県松山市（道後温泉）で発生した\nCASE13「松山誕生日プレゼント盗難事件」",
        "怪盗ヘンタイおじさんによる事件ですね。",
        "……ちょっと待ってください。",
        "今、当時の記録を確認していたんですが。",
        "この事件、今回こちらで調べている件と少し似ていますね。",
        "実は数日前、捜査本部で出所の分からないWebページを確認しました。",
        "誰が作ったのか、どこから公開されたのかは、まだ分かっていません。",
        "ただ、中には暗号のようなものや、過去の怪盗事件を思わせる内容があります。",
        "特に、怪盗ヘンタイおじさんの事件と似ている部分がありまして。",
        "もちろん、現時点では本人が作ったものだとは断定できません。",
        "CASE13では、怪盗から謎を出されて、それを解いてプレゼントを取り戻していますよね。",
        "今回のページにも、似たような仕掛けがあるようなんです。",
        "実際にあの怪盗の謎を解いたことがある方なら、何か気付くことがあるかもしれません。",
        "よければ、一度ページを見てもらえませんか？"
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
        "その場所は、この案内に紐づいている事件記録と一致しません。",
        "ヒントです。",
        "事件が起きたのは四国地方です。"
      ]);
    } else {
      await policeSequence([
        "その場所は、この案内に紐づいている事件記録と一致しません。",
        "当時、旅行先で事件に遭われていたはずです。"
      ]);
    }

    state.phase = "location";
    setInputEnabled(true, "事件が起きた都道府県または市名を入力");
    saveState();
  }

  function makeChoiceButton(label, className, onClick) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.textContent = label;
    button.addEventListener("click", onClick);
    return button;
  }

  function showCooperationChoices() {
    clearActions();

    const wrap = document.createElement("div");
    wrap.className = "choice-group";

    wrap.append(
      makeChoiceButton("捜査に協力する", "choice-button primary", () => chooseCooperation(true)),
      makeChoiceButton("今回は協力しない", "choice-button", () => chooseCooperation(false))
    );

    actionArea.appendChild(wrap);
  }

  function showForcedCooperationChoice() {
    clearActions();

    const wrap = document.createElement("div");
    wrap.className = "choice-group";
    wrap.append(
      makeChoiceButton("捜査に協力する", "choice-button primary", () => chooseCooperation(true))
    );
    actionArea.appendChild(wrap);
  }

  async function chooseCooperation(accept) {
    if (state.busy) return;
    clearActions();

    if (accept) {
      userSay("捜査に協力する");
      await acceptCooperation();
      return;
    }

    userSay("今回は協力しない");
    await declineCooperation();
  }

  async function acceptCooperation() {
    await policeSequence([
      state.declineCount > 0
        ? "ありがとうございます！\nよかったです。"
        : "ありがとうございます。助かります。",
      "では、問題のページを共有しますね。",
      "あわせて、参考用の資料もお送りします。",
      "過去の怪盗事件をまとめた、捜査協力者向けの事件データベースです。",
      "今回のページを確認するのに必要かどうかは分かりませんが、気になることがあれば見てみてください。"
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
  }

  async function declineCooperation() {
    state.declineCount += 1;

    if (state.declineCount === 1) {
      await policeSequence([
        "えっ。",
        "協力してくれないんですか？",
        "……冗談ですよね？",
        "大丈夫です。もう一度聞きますね。"
      ]);
      state.phase = "cooperation";
      setInputEnabled(true, "メッセージを入力");
      showCooperationChoices();
    } else {
      await policeSequence([
        "……本当にもう一回押しましたね。",
        "ここまで断られるとは思ってませんでした。",
        "一応、捜査協力は任意なんですけど。",
        "……さすがにお願いします（笑）"
      ]);
      state.phase = "forced-cooperation";
      setInputEnabled(true, "メッセージを入力");
      showForcedCooperationChoice();
    }

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

  async function handleFreeText() {
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
        await acceptCooperation();
      } else if (/協力しない|いいえ|やめ|断/.test(normalized)) {
        await declineCooperation();
      } else {
        await policeSequence([
          "ありがとうございます。",
          "すみません、この確認だけ下のボタンから選んでもらえますか？"
        ]);
        showCooperationChoices();
        setInputEnabled(true, "メッセージを入力");
      }
    } else if (state.phase === "forced-cooperation") {
      const normalized = text.replace(/\s/g, "");
      if (/協力する|はい|やります|手伝/.test(normalized)) {
        await acceptCooperation();
      } else {
        await policeSequence([
          "もう選択肢はひとつです（笑）",
          "上のボタンからお願いします。"
        ]);
        showForcedCooperationChoice();
        setInputEnabled(true, "メッセージを入力");
      }
    } else if (state.phase === "resources" || state.completed) {
      await handleFreeText(text);
    }

    saveState();
  });

  // テスト用の隠しリセット。画面にはボタンを出さない。
  // URL末尾に ?reset=1 を付けて開くと進行状況を消せます。
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
