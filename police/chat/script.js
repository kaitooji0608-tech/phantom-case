(() => {
const log=document.getElementById("log");
const actions=document.getElementById("actions");
const composer=document.getElementById("composer");
const input=document.getElementById("input");
const startScreen=document.getElementById("startScreen");
const headerName=document.getElementById("headerName");

const sleep=ms=>new Promise(r=>setTimeout(r,ms));

function getState(){return PhantomState.load();}
function saveState(s){PhantomState.save(s);}

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
  await sleep(350);
  addMessage(text,sender);
  await sleep(350);
}

async function seq(items){
  for(const item of items){
    if(typeof item==="string") await say(item,"police");
    else await say(item.text,item.sender||"police");
  }
}

function clearActions(){actions.innerHTML="";}
function makeButton(label,handler,secondary=false){
  const b=document.createElement("button");
  b.textContent=label;
  if(secondary)b.className="secondary";
  b.onclick=handler;
  actions.appendChild(b);
}
function makeLink(label,href,secondary=false){
  const a=document.createElement("a");
  a.textContent=label;
  a.href=href;
  if(secondary)a.className="secondary";
  actions.appendChild(a);
}

function restoreTranscript(){
  const s=getState();
  s.chat.transcript.forEach(item=>{
    if(item.kind==="sys") addSystem(item.text,false);
    else addMessage(item.text,item.sender,false);
  });
}

function dateOK(t){
  const s=t.replace(/[０-９]/g,c=>String.fromCharCode(c.charCodeAt(0)-0xFEE0))
    .replace(/\s/g,"").replace(/年|月/g,"/").replace(/日/g,"")
    .replace(/[.\-]/g,"/").replace(/\/+/g,"/");
  return /(^|\/)2022\/10\/0?2$|^10\/0?2$/.test(s);
}
function placeOK(t){return /愛媛|松山|道後/.test(t);}

async function startFresh(){
  await seq([
    "こんにちは。怪盗関連事件特別捜査本部の相沢です。",
    "過去に怪盗被害に遭われた方へ、順番にご連絡しています。",
    "まず本人確認をお願いします。",
    "事件が起きた日付を入力してください。"
  ]);
  PhantomState.update(s=>{s.chat.phase="date";});
}

async function onUserText(t){
  const s=getState();
  addMessage(t,"user");

  if(s.chat.phase==="date"){
    if(dateOK(t)){
      await say("確認できました。次に、事件が起きた場所を入力してください。");
      PhantomState.update(x=>{x.chat.phase="place";});
    }else{
      await say("このQRに紐づく事件記録と一致しません。");
    }
    return;
  }

  if(s.chat.phase==="place"){
    if(placeOK(t)){
      await seq([
        "本人確認できました。CASE13「松山誕生日プレゼント盗難事件」の被害者の方ですね。",
        "出所不明のWebページを確認しています。前回と同じように謎が含まれているようです。",
        "解析に協力してもらえますか？"
      ]);
      PhantomState.update(x=>{x.identityVerified=true;x.chat.phase="cooperate";});
      renderActions();
    }else{
      await say("このQRに紐づく事件記録と一致しません。");
    }
    return;
  }

  await say("ありがとうございます。こちらでも確認します。");
}

async function chooseCooperation(ok){
  clearActions();
  addMessage(ok?"捜査に協力する":"今回は協力しない","user");

  const s=getState();

  if(ok){
    await seq([
      "ありがとうございます。",
      "問題のページと参考資料DBを共有します。"
    ]);
    PhantomState.update(x=>{x.cooperationAccepted=true;x.chat.phase="investigate";});
    renderActions();
    return;
  }

  const count=s.chat.declines+1;
  PhantomState.update(x=>{x.chat.declines=count;});

  if(count===1){
    await seq(["えっ。","協力してくれないんですか？","……冗談ですよね？"]);
    renderActions();
  }else{
    await seq(["……強いですね。","さすがにお願いします（笑）"]);
    PhantomState.update(x=>{x.chat.phase="forced";});
    renderActions();
  }
}

async function handleDarkReport(){
  clearActions();
  addMessage("3つの記録を確認しました","user");
  await seq([
    "……これ、本当なんでしょうか。",
    "僕も聞いたことがない内容です。",
    "こちらで原記録との照合を始めます。"
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
    "外部接続はこちらでも確認しました。",
    "先ほどの3件は、こちらで真偽確認を進めます。",
    "怪盗が残した新しいページについては、引き続き確認をお願いします。"
  ]);

  PhantomState.update(x=>{x.chat.phase="house-start";});
  renderActions();
}

async function handleSquirrelReport(){
  clearActions();
  addMessage("リスのQRを見つけました","user");

  await seq([
    "確認しました。",
    "ところで、どうやってこのQRを見つけたんですか？"
  ]);

  PhantomState.update(x=>{x.squirrelReported=true;x.chat.phase="squirrel-how";});
  renderActions();
}

async function handleSquirrelHow(){
  clearActions();
  addMessage("家にあるリスの置物についていました","user");
  await seq([
    "……家の中の置物ですか？",
    "そのQRは、もともと付いていたものではないですよね？"
  ]);
  PhantomState.update(x=>{x.chat.phase="squirrel-original";});
  renderActions();
}

async function handleSquirrelOriginal(){
  clearActions();
  addMessage("もともとは付いていません","user");
  await seq([
    "分かりました。",
    "だとすると、ページを作った人物がご自宅の中に入った可能性があります。",
    "こちらでも確認します。",
    "ページには、まだ3つの痕跡が残されているようです。",
    "無理のない範囲で、続きの確認をお願いします。"
  ]);
  PhantomState.update(x=>{
    x.intrusionConcern=true;
    x.traceSearchUnlocked=true;
    x.chat.phase="trace-search";
  });
  renderActions();
}

function renderActions(){
  clearActions();
  const s=getState();

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
    if(s.darkKeys.one && s.darkKeys.two && s.darkKeys.three && !s.darkReported){
      makeButton("3つの記録を相沢に報告する",handleDarkReport);
    }
    return;
  }
  if(s.chat.phase==="house-start"){
    makeLink("怪盗が残した新しい謎ページ","../../house/");
    return;
  }
  if(s.chat.phase==="squirrel-report"){
    makeButton("リスのQRを相沢に報告する",handleSquirrelReport);
    return;
  }
  if(s.chat.phase==="squirrel-how"){
    makeButton("家にあるリスの置物についていました",handleSquirrelHow);
    return;
  }
  if(s.chat.phase==="squirrel-original"){
    makeButton("もともとは付いていません",handleSquirrelOriginal);
    return;
  }
  if(s.chat.phase==="trace-search"){
    makeLink("残り3つの痕跡を探す","../../house/");
    return;
  }
}

function applyIncomingEvent(){
  const q=new URLSearchParams(location.search);
  const event=q.get("event");
  if(!event)return;

  if(event==="dark-cleared"){
    PhantomState.update(s=>{
      if(!s.darkReported) s.chat.phase="investigate";
    });
  }

  if(event==="squirrel-found"){
    PhantomState.update(s=>{
      s.squirrelQrFound=true;
      if(!s.intrusionConcern) s.chat.phase="squirrel-report";
    });
  }

  history.replaceState({}, "", location.pathname);
}

if(new URLSearchParams(location.search).get("reset")==="1"){
  PhantomState.reset();
  history.replaceState({}, "", location.pathname);
}

applyIncomingEvent();

startScreen.addEventListener("click",async()=>{
  startScreen.classList.add("off");
  await sleep(250);

  const s=getState();
  if(s.chat.transcript.length){
    restoreTranscript();
    renderActions();
  }else{
    await startFresh();
  }
});

composer.addEventListener("submit",e=>{
  e.preventDefault();
  const t=input.value.trim();
  if(!t)return;
  input.value="";
  onUserText(t);
});
})();