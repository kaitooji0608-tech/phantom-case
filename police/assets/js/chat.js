(function(){
const M=document.getElementById('messages');
const T=document.getElementById('typing');
const A=document.getElementById('chat-actions');
const F=document.getElementById('chat-form');
const I=document.getElementById('chat-input');

const STATE_KEY='phantomPoliceMainChatV3State';
const DECLINE_KEY='phantomPoliceMainChatV3Declines';

let state=localStorage.getItem(STATE_KEY)||'start';
let declineCount=parseInt(localStorage.getItem(DECLINE_KEY)||'0',10)||0;
const qs=new URLSearchParams(location.search);
let busy=false;

function save(s){
  state=s;
  localStorage.setItem(STATE_KEY,s);
}

function esc(s){
  return String(s).replace(/[&<>"']/g,c=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}

function msg(text,who='aizawa'){
  const x=document.createElement('div');
  x.className='msg '+(
    who==='user'?'user':
    who==='system'?'system':
    who==='ojisan'?'ojisan':''
  );
  x.innerHTML='<div class="bubble">'+text+'</div>';
  M.appendChild(x);
  requestAnimationFrame(()=>{M.scrollTop=M.scrollHeight;});
}

function userMsg(text){
  msg(esc(text),'user');
}

function wait(ms){
  return new Promise(r=>setTimeout(r,ms));
}

async function later(text,ms=1800,who='aizawa'){
  T.textContent=who==='ojisan'
    ? '未登録ユーザーが入力中…'
    : '相沢さんが入力中…';
  await wait(ms);
  T.textContent='';
  msg(text,who);
}

function clearActions(){
  A.innerHTML='';
}

function actions(items){
  A.innerHTML='<div class="ai-suggest-label">会話支援AIが返信候補を表示しています</div>';
  items.forEach(([label,fn,primary])=>{
    const b=document.createElement('button');
    b.type='button';
    b.className='suggest'+(primary?' primary':'');
    b.textContent=label;
    b.onclick=()=>{if(!busy)fn();};
    A.appendChild(b);
  });
}

function policeRoot(){
  const marker='/police/';
  const i=location.pathname.indexOf(marker);
  if(i>=0){
    return location.origin+location.pathname.slice(0,i+marker.length);
  }
  return new URL('../',location.href).href;
}

function rawLink(url){
  return '<a href="'+url+'">'+url+'</a>';
}

function normalize(v){
  return String(v)
    .replace(/[０-９]/g,c=>String.fromCharCode(c.charCodeAt(0)-0xFEE0))
    .replace(/[／]/g,'/')
    .replace(/[－―ー]/g,'-')
    .replace(/\s|　/g,'');
}

function isCorrectDate(v){
  const n=normalize(v);
  return (
    /2022(?:年|[\/.\-])?10(?:月|[\/.\-])?0?2(?:日)?/.test(n) ||
    /^10(?:月|[\/.\-])0?2(?:日)?$/.test(n)
  );
}

function isBirthday(v){
  const n=normalize(v);
  return (
    /2022(?:年|[\/.\-])?10(?:月|[\/.\-])?0?3(?:日)?/.test(n) ||
    /^10(?:月|[\/.\-])0?3(?:日)?$/.test(n)
  );
}

function isCorrectPlace(v){
  const n=String(v).replace(/\s|　/g,'');
  return /愛媛|松山|道後/.test(n);
}

async function intro(){
  if(state!=='start'||busy)return;
  busy=true;

  await later('こんにちは。<br>怪盗関連事件特別捜査本部の相沢です。',700);

  await later(
    '今回はこちらから突然ご連絡する形になってしまい、すみません。'
  );

  await later(
    '現在、過去に怪盗による被害に遭われた方へ、順次ご連絡しています。'
  );

  await later(
    '今回、ある事件について捜査へのご協力をお願いしたく、ご連絡しました。'
  );

  await later(
    'ただ、その前に。<br>念のため、簡単な本人確認をさせてください。'
  );

  await later(
    '以前、怪盗による被害に遭われた日付を覚えていますか？<br><br>本人確認のため、教えていただけますか？'
  );

  save('verifyDate');
  busy=false;
  I.focus();
}

async function dateVerified(){
  save('verifyPlace');
  busy=true;

  await later('はい、確認できました。',900);
  await later('もう一点だけお願いします。');
  await later('その事件があった場所は、どちらでしたか？');

  busy=false;
  I.focus();
}

async function verified(){
  save('explain');
  busy=true;

  await later('ありがとうございます。',800);
  await later('本人確認が取れました。');
  await later(
    '2022年10月2日、<strong>愛媛県松山市の道後温泉</strong>で発生した事件ですね。'
  );

  await later(
    '少し長くなってしまうんですが、今回ご連絡した理由を説明します。'
  );

  await later(
    '実はつい最近、<strong>怪盗関連事件特別捜査本部宛てに、送信元の分からないURL</strong>が届きました。'
  );

  await later(
    'こちらでも内容の確認と解析を進めています。'
  );

  await later(
    '技術的に危険なページではないことは確認できているんですが……'
  );

  await later(
    'ページの中に、過去の怪盗事件を思わせる内容や、こちらでも意図を判断できていない情報がいくつか含まれています。'
  );

  await later(
    'そこで現在、過去に怪盗による被害に遭われた方の中から、何名かに情報提供と捜査協力をお願いしています。'
  );

  await later(
    '実際に怪盗と関わった方だからこそ、こちらでは気づけていないことに気づく可能性があるんじゃないかと考えています。'
  );

  await later(
    'もちろん、危険なことをお願いするつもりはありません。'
  );

  await later(
    'こちらからお渡しする資料を確認して、<strong>何か気づいたことがあれば教えていただきたい</strong>、というお願いです。'
  );

  await later(
    '突然こんなお願いをしてしまってすみません。'
  );

  await later(
    'もしよければ、今回の捜査に協力していただけませんか？'
  );

  save('offer');
  actions([
    ['捜査に協力する',cooperate,true],
    ['捜査に協力しない',decline,false]
  ]);

  busy=false;
}

async function decline(){
  busy=true;
  clearActions();

  declineCount++;
  localStorage.setItem(DECLINE_KEY,String(declineCount));

  if(declineCount===1){
    await later('え、協力しない……？',700);
    await later('冗談……ですよね？',1100);
    await later(
      'あ、もしかしてAIのレコメンド機能で、間違えて押しちゃいました？（笑）'
    );
    await later('僕もたまにやっちゃうんですよ（笑）');
    await later('じゃあ、改めて聞きますね。');
  }else if(declineCount===2){
    await later('……またですか？（笑）',700);
    await later(
      'AI、今日はずいぶん調子が悪いみたいですね。'
    );
    await later('では、改めてもう一度。');
  }else{
    await later('……なるほど（笑）',700);
    await later(
      'たぶん、また押し間違いですよね。'
    );
    await later('それでは改めて。');
  }

  await later('今回の捜査に協力していただけますか？');

  actions([
    ['捜査に協力する',cooperate,true],
    ['捜査に協力しない',decline,false]
  ]);

  busy=false;
}

async function cooperate(){
  busy=true;
  clearActions();
  save('mission');

  await later('はい、ありがとうございます。',800);
  await later('助かります。');

  const root=policeRoot();
  const suspicious=root+'puzzle/';
  const db=root+'db/';
  const hp=root;

  await later(
    'それでは、今回発見された不審なURLを共有させていただきます。'
  );

  msg(rawLink(suspicious),'system');

  await later(
    '現時点では、危険なプログラムなどは確認されていませんので、そのまま開いていただいて大丈夫です。'
  );

  await later(
    'あと、何かの手がかりになるかもしれないので、怪盗に関する情報のデータベースもお渡ししておきます。'
  );

  msg(rawLink(db),'system');

  await later(
    '過去の事件や怪盗に関する情報が入っています。気になる言葉や番号があれば、こちらも確認してみてください。'
  );

  await later(
    'それと、捜査協力をお願いする方には、本部の概要や公開可能な資料をご確認いただけるよう、準備公開版のホームページもあわせてご案内する運用になっています。'
  );

  await later(
    '今回お送りしたデータベースも、このサイトの一部です。'
  );

  msg(rawLink(hp),'system');

  await later(
    '何か分からない点や、気になることがあれば、このチャットでお気軽に聞いてください！'
  );

  busy=false;
}

async function report(){
  if(state==='reported'||state==='squirrelReported')return;
  busy=true;
  clearActions();
  save('reported');

  userMsg('調査結果を相沢さんに報告する');

  await later(
    'お疲れさまでした。少々お待ちください、照合結果を確認します。',
    1000
  );

  await later('……確認できました。5件とも一致しています。');

  await later(
    '本部内部の記録に関する内容も含まれていますので、私の方で判断せず、担当部署へそのまま共有します。'
  );

  await later(
    'ご協力ありがとうございました。今回お願いしていた調査は、これで——'
  );

  await wait(1000);

  msg(
    '<span class="msg-event">⚠ 通信経路に未登録の接続を検知しました</span>',
    'system'
  );

  await later(
    '……すみません。今、こちらの画面に見慣れない接続表示が出ています。',
    1100
  );

  await later(
    'やっほ〜😏　警察さんのお手伝い、おつかれサマ〜♪',
    1200,
    'ojisan'
  );

  await later(
    '相変わらずマジメだネ〜。でも、まだ終わりじゃないヨ。',
    1700,
    'ojisan'
  );

  await later(
    '次はパソコンばっかり見てないで、<strong>お家の中</strong>を使って遊ぼっか🏠✨',
    1800,
    'ojisan'
  );

  msg(
    '<div class="chat-linkset"><a class="btn" href="../mission/house/">おじさんからの次の手がかりを見る</a></div>',
    'system'
  );

  busy=false;
}

async function squirrel(){
  busy=true;
  clearActions();
  save('squirrelReported');

  userMsg('家の中で見つけたものを相沢さんに報告する');

  await later('お戻りですね。何か見つかったんですか？',900);
  await later('……「リス」ですか？');

  await later(
    '少々待ってください。先ほど表示された追加指示は、こちらから送信したものではありません。'
  );

  await later(
    'もし、その指示をたどって<strong>実際にご自宅の中で何かを見つけた</strong>のであれば……'
  );

  await later(
    '<strong>誰かが、あなたの家の中に入った可能性があります。</strong>',
    1900
  );

  await wait(900);

  msg(
    '<span class="msg-event">⚠ 通信経路に未登録の接続を検知しました</span>',
    'system'
  );

  await later('あ、バレちゃった！？😳',900,'ojisan');

  await later(
    'そんな怖い顔しないでヨ〜。何にも盗んでないってば‼️',
    1500,
    'ojisan'
  );

  await later(
    'せっかくだから、もう少しだけ遊ぼっか♪',
    1500,
    'ojisan'
  );

  msg(
    '<div class="chat-linkset"><a class="btn" href="../mission/trace/">残された痕跡を確認する</a></div>',
    'system'
  );

  busy=false;
}

async function generic(){
  if(state==='mission'){
    return later(
      'ありがとうございます。まずは先ほどお送りしたURLを確認してみてください。何か気になることがあれば教えてください。',
      800
    );
  }

  if(state==='reported'){
    return later(
      '先ほどの未登録接続について確認しています。表示された指示には十分注意してください。',
      800
    );
  }

  if(state==='squirrelReported'){
    return later(
      '安全のため、周囲を確認しながら進めてください。',
      800
    );
  }

  return later('ありがとうございます。確認します。',700);
}

F.onsubmit=async e=>{
  e.preventDefault();

  if(busy)return;

  const v=I.value.trim();
  if(!v)return;

  userMsg(v);
  I.value='';
  clearActions();

  if(state==='verifyDate'){
    busy=true;

    if(isCorrectDate(v)){
      busy=false;
      return dateVerified();
    }

    if(isBirthday(v)){
      await later(
        '惜しいです。<strong>10月3日ではなく、その前日</strong>に起きた事件です。怪盗による被害が確認された日を思い出してみてください。',
        850
      );
      busy=false;
      return;
    }

    await later(
      'すみません。こちらの記録とは一致しないようです。もう一度思い出してみてもらえますか？',
      850
    );

    busy=false;
    return;
  }

  if(state==='verifyPlace'){
    busy=true;

    if(isCorrectPlace(v)){
      busy=false;
      return verified();
    }

    await later(
      'すみません。こちらの記録とは一致しないようです。当時の旅行先を思い出してみてもらえますか？',
      850
    );

    busy=false;
    return;
  }

  if(state==='offer'){
    if(/協力|やる|はい|いいよ|お願い/.test(v)){
      return cooperate();
    }

    if(/しない|無理|いや|嫌|断/.test(v)){
      return decline();
    }

    await later(
      'ありがとうございます。今回の捜査に協力していただけますか？',
      700
    );

    actions([
      ['捜査に協力する',cooperate,true],
      ['捜査に協力しない',decline,false]
    ]);

    return;
  }

  generic();
};

function restore(){
  if(qs.get('report')==='1'){
    setTimeout(report,350);
    return;
  }

  if(qs.get('squirrel')==='1'){
    setTimeout(squirrel,350);
    return;
  }

  if(state==='start'){
    intro();
    return;
  }

  if(state==='verifyDate'){
    msg(
      '本人確認を続けます。以前、怪盗による被害に遭われた<strong>日付</strong>を教えてください。'
    );
    return;
  }

  if(state==='verifyPlace'){
    msg(
      '日付は確認済みです。事件があった<strong>場所</strong>を教えてください。'
    );
    return;
  }

  if(state==='explain'){
    save('offer');
    msg(
      '本人確認は完了しています。今回の捜査に協力していただけますか？'
    );
    actions([
      ['捜査に協力する',cooperate,true],
      ['捜査に協力しない',decline,false]
    ]);
    return;
  }

  if(state==='offer'){
    msg(
      '本人確認は完了しています。今回の捜査に協力していただけますか？'
    );
    actions([
      ['捜査に協力する',cooperate,true],
      ['捜査に協力しない',decline,false]
    ]);
    return;
  }

  if(state==='mission'){
    msg(
      '先ほどお送りした不審なURLと参考資料を確認してみてください。何か分からないことがあれば、このチャットで聞いてください。'
    );

    const root=policeRoot();
    msg(rawLink(root+'puzzle/'),'system');
    msg(rawLink(root+'db/'),'system');
    msg(rawLink(root),'system');

    if(localStorage.getItem('phantomPolicePuzzleComplete')==='1'){
      actions([
        ['照合結果を相沢さんに報告する',()=>location.href='?report=1',true]
      ]);
    }

    return;
  }

  if(state==='reported'){
    msg('先ほどの通信への未登録接続について確認中です。');
    msg(
      '<div class="chat-linkset"><a class="btn" href="../mission/house/">おじさんからの次の手がかりを見る</a></div>',
      'system'
    );
    return;
  }

  if(state==='squirrelReported'){
    msg(
      '家への侵入の可能性があります。周囲を確認しながら進めてください。'
    );
    msg(
      '<div class="chat-linkset"><a class="btn" href="../mission/trace/">残された痕跡を確認する</a></div>',
      'system'
    );
  }
}

restore();
})();
