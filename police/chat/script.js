(() => {
const log=document.getElementById("log");
const actions=document.getElementById("actions");
const composer=document.getElementById("composer");
const input=document.getElementById("input");
const startScreen=document.getElementById("startScreen");
const headerName=document.getElementById("headerName");

const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let busy=false;

function getState(){ return PhantomState.load(); }

function addMessage(text,sender="police",persist=true){
  const row=document.createElement("div");
  row.className="msg "+sender;

  const bubble=document.createElement("div");
  bubble.className="bubble";
  bubble.textContent=text;

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
    if(typeof item==="string") await say(item,"police");
    else await say(item.text,item.sender||"police");
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
    if(!busy) handler();
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
    if(item.kind==="sys") addSystem(item.text,false);
    else addMessage(item.text,item.sender,false);
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
      await say("確認できました。次に、事件が起きた場所を入力してください。");
      PhantomState.update(x=>{x.chat.phase="place";});
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
      await seq([
        "本人確認できました。",
        "CASE13「松山誕生日プレゼント盗難事件」の被害者の方ですね。",
        "現在、出所不明のWebページを確認しています。",
        "CASE13と同じように謎が含まれているようです。",
        "解析に協力してもらえますか？"
      ]);

      PhantomState.update(x=>{
        x.identityVerified=true;
        x.chat.phase="cooperate";
      });

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
    await seq([
      "ありがとうございます。",
      "問題のページと、参考資料の怪盗関連事件DBを共有します。"
    ]);

    PhantomState.update(x=>{
      x.cooperationAccepted=true;
      x.chat.phase="investigate";
    });

    renderActions();
    return;
  }

  const count=s.chat.declines+1;
  PhantomState.update(x=>{x.chat.declines=count;});

  if(count===1){
    await seq([
      "えっ。",
      "協力してくれないんですか？",
      "……冗談ですよね？"
    ]);
    renderActions();
  }else{
    await seq([
      "……強いですね。",
      "さすがにお願いします（笑）"
    ]);

    PhantomState.update(x=>{x.chat.phase="forced";});
    renderActions();
  }
}

async function reportDark(){
  const s=getState();
  if(!allDarkSolved(s) || s.darkReported) return;

  clearActions();

  addMessage("謎が解けました","user");

  await seq([
    "3つともですか？",
    "どんな内容だったか教えてもらえますか？"
  ]);

  PhantomState.update(x=>{x.chat.phase="dark-summary";});
  renderActions();
}

async function sendDarkSummary(){
  clearActions();

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
    {text:"前回みたいに、もうちょっと遊んでいかない！？😄",sender:"ojisan"}
  ]);

  PhantomState.update(x=>{
    x.darkReported=true;
    x.ojisanFirstAppearance=true;
    x.houseUnlocked=true;
  });

  addSystem("UNKNOWN USER DISCONNECTED");
  headerName.textContent="相沢 直人";

  await seq([
    "……戻りました。",
    "チャットへの外部接続はこちらでも確認しました。",
    "先ほどの3件は、こちらで真偽確認を進めます。",
    "怪盗が残した新しいページについては、引き続き確認をお願いします。"
  ]);

  PhantomState.update(x=>{x.chat.phase="house-start";});
  renderActions();
}

async function reportSquirrel(){
  const s=getState();
  if(!s.squirrelQrFound || s.squirrelReported) return;

  clearActions();

  addMessage("QRコードを見つけました","user");

  await seq([
    "QRコードですか？",
    "どこにあったんですか？"
  ]);

  PhantomState.update(x=>{x.chat.phase="squirrel-location";});
  renderActions();
}

async function answerSquirrelLocation(){
  clearActions();

  addMessage("家にあるリスの置物についていました","user");

  await seq([
    "……家の中にある置物ですか？",
    "そのQRは、もともと付いていたものではないですよね？"
  ]);

  PhantomState.update(x=>{x.chat.phase="squirrel-original";});
  renderActions();
}

async function answerSquirrelOriginal(){
  clearActions();

  addMessage("もともとは付いていません","user");

  await seq([
    "分かりました。",
    "だとすると、ページを作った人物がご自宅の中に入った可能性があります。",
    "こちらでも確認します。",
    "ページには、まだ3つの痕跡が残されているようです。",
    "無理のない範囲で、続きを確認してください。"
  ]);

  PhantomState.update(x=>{
    x.squirrelReported=true;
    x.intrusionConcern=true;
    x.traceSearchUnlocked=true;
    x.chat.phase="trace-search";
  });

  renderActions();
}

function renderActions(){
  clearActions();
  const s=getState();

  // 会話の途中は、その会話フェーズを最優先する。
  if(s.chat.phase==="dark-summary"){
    makeButton("3件の内容を共有する",sendDarkSummary);
    return;
  }

  if(s.chat.phase==="squirrel-location"){
    makeButton("家にあるリスの置物についていました",answerSquirrelLocation);
    return;
  }

  if(s.chat.phase==="squirrel-original"){
    makeButton("もともとは付いていません",answerSquirrelOriginal);
    return;
  }

  // 別ページで新しい事実を見つけ、まだ警察へ報告していない場合。
  if(
    s.chat.phase==="investigate" &&
    allDarkSolved(s) &&
    !s.darkReported &&
    s.cooperationAccepted
  ){
    makeButton("相沢に報告する",reportDark);
    makeLink("謎ページを確認する","../../mystery/",true);
    return;
  }

  if(
    s.chat.phase==="house-start" &&
    s.squirrelQrFound &&
    !s.squirrelReported
  ){
    makeButton("相沢に報告する",reportSquirrel);
    makeLink("怪盗が残した新しい謎ページ","../../house/",true);
    return;
  }

  // 通常フェーズ。
  if(s.chat.phase==="cooperate"){
    makeButton("捜査に協力する",()=>chooseCooperation(true));
    makeButton("今回は協力しない",()=>chooseCooperation(false),true);
    return;
  }

  if(s.chat.phase==="forced"){
    makeButton("捜査に協力する",()=>chooseCooperation(true));
    return;
  }

  if(s.chat.phase==="investigate"){
    makeLink("出所不明Webページを開く","../../mystery/");
    makeLink("参考資料DBを開く","../db/",true);
    return;
  }

  if(s.chat.phase==="house-start"){
    makeLink("怪盗が残した新しい謎ページ","../../house/");
    return;
  }

  if(s.chat.phase==="trace-search"){
    makeLink("残り3つの痕跡を探す","../../house/");
    return;
  }

  if(allTracesSolved(s) && s.endingUnlocked && !s.endingComplete){
    makeLink("最後のページを確認する","../../ending/");
  }
}

function boot(){
  const s=getState();

  if(s.chat.transcript.length){
    startScreen.classList.add("off");
    restoreTranscript();
    renderActions();
  }else{
    startScreen.addEventListener("click",async()=>{
      startScreen.classList.add("off");
      await sleep(220);
      await startFresh();
    },{once:true});
  }
}

composer.addEventListener("submit",e=>{
  e.preventDefault();
  const t=input.value.trim();
  if(!t || busy) return;
  input.value="";
  onUserText(t);
});

const params=new URLSearchParams(location.search);
if(params.get("reset")==="1"){
  PhantomState.reset();
  history.replaceState({}, "", location.pathname);
}

boot();
})();