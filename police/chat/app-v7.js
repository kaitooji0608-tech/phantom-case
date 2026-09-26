(() => {
const log=document.getElementById("log");
const actions=document.getElementById("actions");
const composer=document.getElementById("composer");
const input=document.getElementById("input");
const startScreen=document.getElementById("startScreen");
const headerName=document.getElementById("headerName");

const PUBLIC_BASE="https://phantom-case-police.github.io/phantom-case";
const MYSTERY_URL=`${PUBLIC_BASE}/mystery/`;
const DB_URL=`${PUBLIC_BASE}/police/db/`;
const HOUSE_URL=`${PUBLIC_BASE}/house/`;
const TRACES_URL=`${PUBLIC_BASE}/house/traces/`;

const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let busy=false;

function getState(){ return PhantomState.load(); }

function escapeHtml(value){
  return String(value)
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#039;");
}

function linkify(text){
  const escaped=escapeHtml(text);
  return escaped.replace(
    /(https:\/\/[^\s<]+)/g,
    '<a class="chat-url" href="$1">$1</a>'
  ).replace(/\n/g,"<br>");
}

function addMessage(text,sender="police",persist=true){
  const row=document.createElement("div");
  row.className="msg "+sender;

  const bubble=document.createElement("div");
  bubble.className="bubble";
  bubble.innerHTML=linkify(text);

  row.appendChild(bubble);
  log.appendChild(row);
  log.scrollTop=log.scrollHeight;

  if(persist){
    PhantomState.update(s=>{
      s.chat.transcript.push({kind:"msg",sender,text});
    });
  }
}

function addSystem(text,persist=true){
  const div=document.createElement("div");
  div.className="sys";
  div.textContent=text;
  log.appendChild(div);
  log.scrollTop=log.scrollHeight;

  if(persist){
    PhantomState.update(s=>{
      s.chat.transcript.push({kind:"sys",text});
    });
  }
}

async function say(text,sender="police"){
  await sleep(320);
  addMessage(text,sender);
  await sleep(320);
}

async function seq(items){
  busy=true;
  for(const item of items){
    if(typeof item==="string"){
      await say(item,"police");
    }else{
      await say(item.text,item.sender||"police");
    }
  }
  busy=false;
}

function clearActions(){
  actions.innerHTML="";
}

function makeButton(label,handler,secondary=false){
  const b=document.createElement("button");
  b.type="button";
  b.textContent=label;
  if(secondary) b.className="secondary";

  b.onclick=()=>{
    if(busy) return;
    handler();
  };

  actions.appendChild(b);
}

function makeLink(label,href,secondary=false){
  const a=document.createElement("a");
  a.textContent=label;
  a.href=href;
  if(secondary) a.className="secondary";
  actions.appendChild(a);
}

function restoreTranscript(){
  log.innerHTML="";
  const s=getState();

  s.chat.transcript.forEach(item=>{
    if(item.kind==="sys"){
      addSystem(item.text,false);
    }else{
      addMessage(item.text,item.sender,false);
    }
  });
}

function dateOK(t){
  const s=t
    .replace(/[０-９]/g,c=>String.fromCharCode(c.charCodeAt(0)-0xFEE0))
    .replace(/\s/g,"")
    .replace(/年|月/g,"/")
    .replace(/日/g,"")
    .replace(/[.\-]/g,"/")
    .replace(/\/+/g,"/");

  return /2022\/10\/0?2$|^10\/0?2$/.test(s);
}

function birthdayDate(t){
  const s=t
    .replace(/[０-９]/g,c=>String.fromCharCode(c.charCodeAt(0)-0xFEE0))
    .replace(/\s/g,"")
    .replace(/年|月/g,"/")
    .replace(/日/g,"")
    .replace(/[.\-]/g,"/")
    .replace(/\/+/g,"/");

  return /2022\/10\/0?3$|^10\/0?3$/.test(s);
}

function placeOK(t){
  return /愛媛|松山|道後/.test(t);
}

function allDarkSolved(s){
  return s.darkKeys.one && s.darkKeys.two && s.darkKeys.three;
}

function allTracesSolved(s){
  return s.traces.one && s.traces.two && s.traces.three;
}

async function startFresh(){
  await seq([
    "こんにちは。怪盗関連事件特別捜査本部の相沢です。",
    "急に手紙が届いて、びっくりしましたよね。",
    "現在、過去に怪盗事件の被害に遭われた方へ順番にご連絡しています。",
    "まず簡単な本人確認だけさせてください。",
    "事件が起きた日付を入力してください。"
  ]);

  PhantomState.update(s=>{s.chat.phase="date";});
}

async function onUserText(t){
  if(busy) return;

  const s=getState();
  addMessage(t,"user");

  if(s.chat.phase==="date"){
    if(dateOK(t)){
      PhantomState.update(x=>{x.chat.phase="place";});
      await say("確認できました。次に、事件が起きた場所を入力してください。");
    }else if(birthdayDate(t)){
      await seq([
        "惜しいです。",
        "10月3日は誕生日ですね。",
        "確認したいのは怪盗事件が起きた日です。"
      ]);
    }else{
      await say("このQRに紐づく事件記録と一致しません。");
    }

    renderActions();
    return;
  }

  if(s.chat.phase==="place"){
    if(placeOK(t)){
      // 先に状態を進めてから会話を出す。
      PhantomState.update(x=>{
        x.identityVerified=true;
        x.chat.phase="cooperate";
      });

      await seq([
        "本人確認できました。",
        "CASE-221002MH「松山誕生日プレゼント盗難事件」の被害者の方ですね。",
        "現在、出所不明のWebページを確認しています。",
        "CASE-221002MHと同じように謎が含まれているようです。",
        "解析に協力してもらえますか？"
      ]);

      renderActions();
    }else{
      await say("このQRに紐づく事件記録と一致しません。");
    }

    return;
  }

  await say("ありがとうございます。こちらでも確認します。");
  renderActions();
}

async function chooseCooperation(ok){
  clearActions();
  addMessage(ok?"捜査に協力する":"今回は協力しない","user");

  const s=getState();

  if(ok){
    // 先に状態を固定。
    PhantomState.update(x=>{
      x.cooperationAccepted=true;
      x.chat.phase="investigate";
    });

    await seq([
      "ありがとうございます。",
      `問題のページはこちらです。\n${MYSTERY_URL}`,
      `参考資料の怪盗関連事件DBはこちらです。\n${DB_URL}`,
      "確認できたことがあれば、このチャットに戻って教えてください。"
    ]);

    renderActions();
    return;
  }

  const count=s.chat.declines+1;

  if(count===1){
    PhantomState.update(x=>{
      x.chat.declines=1;
      x.chat.phase="cooperate";
    });

    await seq([
      "えっ。",
      "協力してくれないんですか？",
      "……冗談ですよね？"
    ]);

    renderActions();
  }else{
    PhantomState.update(x=>{
      x.chat.declines=2;
      x.chat.phase="forced";
    });

    await seq([
      "……強いですね。",
      "さすがにお願いします（笑）"
    ]);

    renderActions();
  }
}

async function reportDark(){
  const s=getState();

  if(
    busy ||
    !s.cooperationAccepted ||
    !allDarkSolved(s) ||
    s.darkReported ||
    s.chat.phase!=="investigate"
  ){
    renderActions();
    return;
  }

  clearActions();

  // ★重要：
  // ボタンを押した瞬間に次フェーズへ固定。
  // これで同じ「相沢に報告する」が再表示されない。
  PhantomState.update(x=>{
    x.chat.phase="dark-summary";
  });

  addMessage("謎が解けました","user");

  await seq([
    "3つともですか？",
    "どんな内容だったか教えてもらえますか？"
  ]);

  renderActions();
}

async function sendDarkSummary(){
  const s=getState();

  if(busy || s.chat.phase!=="dark-summary" || s.darkReported){
    renderActions();
    return;
  }

  clearActions();

  // ここでも押した瞬間に進行中フェーズへ固定。
  PhantomState.update(x=>{
    x.chat.phase="dark-reveal-running";
  });

  addMessage(
    "警察が怪盗に犯行を依頼した記録、グリッチへの非公式な捜査依頼、ミルフィーユの誤認逮捕に関する記録です。",
    "user"
  );

  await seq([
    "……これ、本当なんでしょうか。",
    "僕も聞いたことがない内容です。",
    "こちらで原記録と照合します。"
  ]);

  addSystem("CONNECTION INTERRUPTED");
  addSystem("UNKNOWN USER CONNECTED");
  headerName.textContent="UNKNOWN USER";

  await seq([
    {text:"あれ！？ 相沢クンまだ疑ってるの！？",sender:"ojisan"},
    {text:"ナチちゃんが自分で見つけたんだから、ちゃんと調べてネ😅",sender:"ojisan"},
    {text:"おじさんたち怪盗も悪いことはするヨ！？ でも、やってないことまで怪盗のせいにされたら困るのヨ〜💦",sender:"ojisan"},
    {text:"まぁ難しい話はこのへんにして……。ところでサ！！",sender:"ojisan"},
    {text:"前回みたいに、もうちょっと遊んでいかない！？😄",sender:"ojisan"},
    {text:`じゃあコレ、置いていくネ〜👍\n${HOUSE_URL}`,sender:"ojisan"},
    {text:"ちゃんと最後まで解いてヨ！？ おじさん一生懸命考えたんだからネ🤣",sender:"ojisan"}
  ]);

  PhantomState.update(x=>{
    x.darkReported=true;
    x.ojisanFirstAppearance=true;
    x.houseUnlocked=true;
    x.chat.phase="house-start";
  });

  addSystem("UNKNOWN USER DISCONNECTED");
  headerName.textContent="相沢 直人";

  await seq([
    "……戻りました。",
    "チャットへの外部接続はこちらでも確認しました。",
    "先ほどの3件は、こちらで真偽確認を進めます。",
    "今送られたURLについても、念のため確認をお願いします。"
  ]);

  renderActions();
}

async function reportSquirrel(){
  const s=getState();

  if(
    busy ||
    !s.squirrelQrFound ||
    s.squirrelReported ||
    s.chat.phase!=="house-start"
  ){
    renderActions();
    return;
  }

  clearActions();

  PhantomState.update(x=>{
    x.chat.phase="squirrel-location";
  });

  addMessage("QRコードを見つけました","user");

  await seq([
    "QRコードですか？",
    "どこにあったんですか？"
  ]);

  renderActions();
}

async function answerSquirrelLocation(){
  const s=getState();

  if(busy || s.chat.phase!=="squirrel-location"){
    renderActions();
    return;
  }

  clearActions();

  PhantomState.update(x=>{
    x.chat.phase="squirrel-original";
  });

  addMessage("リスの置物の下にありました","user");

  await seq([
    "……ご自宅にある置物ですよね？",
    "その紙は、以前からそこにあったものですか？"
  ]);

  renderActions();
}

async function answerSquirrelOriginal(){
  const s=getState();

  if(busy || s.chat.phase!=="squirrel-original"){
    renderActions();
    return;
  }

  clearActions();

  PhantomState.update(x=>{
    x.chat.phase="intrusion-reveal-running";
  });

  addMessage("以前はありませんでした","user");

  await seq([
    "分かりました。",
    "だとすると、誰かが意図的にご自宅の中へ置いた可能性があります。"
  ]);

  addSystem("CONNECTION INTERRUPTED");
  addSystem("UNKNOWN USER CONNECTED");
  headerName.textContent="UNKNOWN USER";

  await seq([
    {text:"あ、バレちゃった！？😅💦",sender:"ojisan"},
    {text:"相沢クン鋭いネ〜！！ おじさん、おったまげぇ〜🤣",sender:"ojisan"},
    {text:"あ、ちなみに今そこにはいないから安心してネ！？ 変な意味じゃないヨ😅💦",sender:"ojisan"},
    {text:"でもナチちゃん、せっかくここまで来たんだからサ！",sender:"ojisan"},
    {text:"残りも探してみない！？",sender:"ojisan"},
    {text:`次はコッチ〜👍\n${TRACES_URL}`,sender:"ojisan"},
    {text:"じゃ、がんばってネ〜！！ マンボ！！",sender:"ojisan"}
  ]);

  PhantomState.update(x=>{
    x.squirrelReported=true;
    x.intrusionConcern=true;
    x.traceSearchUnlocked=true;
    x.chat.phase="trace-search";
  });

  addSystem("UNKNOWN USER DISCONNECTED");
  headerName.textContent="相沢 直人";

  await seq([
    "……また接続されましたね。",
    "今送られたページはこちらでも確認します。",
    "先ほどの件も含めて、こちらで調査を進めます。",
    "無理のない範囲で、ページの確認をお願いします。"
  ]);

  renderActions();
}

function renderActions(){
  clearActions();
  const s=getState();

  // ---------------------------------------
  // 1. 会話途中のフェーズを最優先
  // ---------------------------------------
  if(s.chat.phase==="dark-summary"){
    makeButton("3件の内容を共有する",sendDarkSummary);
    return;
  }

  if(s.chat.phase==="dark-reveal-running"){
    return;
  }

  if(s.chat.phase==="squirrel-location"){
    makeButton(
      "リスの置物の下にありました",
      answerSquirrelLocation
    );
    return;
  }

  if(s.chat.phase==="squirrel-original"){
    makeButton(
      "以前はありませんでした",
      answerSquirrelOriginal
    );
    return;
  }

  // ---------------------------------------
  // 2. 別ページで事実を発見し、まだ未報告
  // ---------------------------------------
  if(
    s.chat.phase==="investigate" &&
    s.cooperationAccepted &&
    allDarkSolved(s) &&
    !s.darkReported
  ){
    makeButton("相沢に報告する",reportDark);
    return;
  }

  if(
    s.chat.phase==="house-start" &&
    s.squirrelQrFound &&
    !s.squirrelReported
  ){
    makeButton("相沢に報告する",reportSquirrel);
    return;
  }

  // ---------------------------------------
  // 3. 通常フェーズ
  // ---------------------------------------
  if(s.chat.phase==="cooperate"){
    makeButton("捜査に協力する",()=>chooseCooperation(true));
    makeButton("今回は協力しない",()=>chooseCooperation(false),true);
    return;
  }

  if(s.chat.phase==="forced"){
    makeButton("捜査に協力する",()=>chooseCooperation(true));
    return;
  }

  // investigate ではURLは吹き出し内にあるため、
  // ボタンは基本的に出さない。
  if(s.chat.phase==="investigate"){
    return;
  }

  if(s.chat.phase==="house-start"){
    return;
  }

  if(s.chat.phase==="intrusion-reveal-running"){
    return;
  }

  if(s.chat.phase==="trace-search"){
    return;
  }

  if(
    allTracesSolved(s) &&
    s.endingUnlocked &&
    !s.endingComplete
  ){
    makeLink(
      "最後のページを確認する",
      "../../ending/"
    );
  }
}

function boot(){
  const s=getState();

  if(s.chat.transcript.length){
    startScreen.classList.add("off");
    restoreTranscript();
    renderActions();
  }else{
    startScreen.addEventListener(
      "click",
      async()=>{
        startScreen.classList.add("off");
        await sleep(220);
        await startFresh();
      },
      {once:true}
    );
  }
}

composer.addEventListener("submit",e=>{
  e.preventDefault();

  const t=input.value.trim();
  if(!t || busy) return;

  input.value="";
  onUserText(t);
});

// v5 is a new state key, so old broken test state won't leak in.
// ?reset=1 still works.
const params=new URLSearchParams(location.search);

if(params.get("reset")==="1"){
  PhantomState.reset();
  history.replaceState({}, "", location.pathname);
}

boot();
})();