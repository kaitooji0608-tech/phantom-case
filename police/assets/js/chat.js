
(function(){
const M=document.getElementById('messages'),T=document.getElementById('typing'),A=document.getElementById('chat-actions'),F=document.getElementById('chat-form'),I=document.getElementById('chat-input');
const STATE_KEY='phantomPoliceMainChatV2State';
const DECLINE_KEY='phantomPoliceMainChatV2Declines';
let state=localStorage.getItem(STATE_KEY)||'start';
let declineCount=parseInt(localStorage.getItem(DECLINE_KEY)||'0',10)||0;
const qs=new URLSearchParams(location.search);
let busy=false;
function save(s){state=s;localStorage.setItem(STATE_KEY,s)}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function msg(text,who='aizawa'){const x=document.createElement('div');x.className='msg '+(who==='user'?'user':who==='system'?'system':who==='ojisan'?'ojisan':'');x.innerHTML='<div class="bubble">'+text+'</div>';M.appendChild(x);requestAnimationFrame(()=>{M.scrollTop=M.scrollHeight})}
function userMsg(text){msg(esc(text),'user')}
function wait(ms){return new Promise(r=>setTimeout(r,ms))}
async function later(text,ms=1800,who='aizawa'){T.textContent=who==='ojisan'?'未登録ユーザーが入力中…':'相沢さんが入力中…';await wait(ms);T.textContent='';msg(text,who)}
function clearActions(){A.innerHTML=''}
function actions(items){A.innerHTML='<div class="ai-suggest-label">会話支援AIが返信・行動候補を提案しています</div>';items.forEach(([label,fn,primary])=>{const b=document.createElement('button');b.type='button';b.className='suggest'+(primary?' primary':'');b.textContent=label;b.onclick=()=>{if(!busy)fn()};A.appendChild(b)})}
function linkSet(){msg('<div class="chat-linkset"><a class="btn" href="../puzzle/">記録照合ページを開く</a><a class="btn secondary" href="../">警察DBを開く</a></div>','system')}
function normalizeDate(v){return v.replace(/[０-９]/g,c=>String.fromCharCode(c.charCodeAt(0)-0xFEE0)).replace(/\s|　/g,'')}
function isCorrectDate(v){const n=normalizeDate(v);return /2022(?:年|[\/\.\-])?10(?:月|[\/\.\-])?0?2(?:日)?/.test(n)||/^10(?:月|[\/\.\-])0?2(?:日)?$/.test(n)}
function isBirthday(v){const n=normalizeDate(v);return /2022(?:年|[\/\.\-])?10(?:月|[\/\.\-])?0?3(?:日)?/.test(n)||/^10(?:月|[\/\.\-])0?3(?:日)?$/.test(n)}
function isKochi(v){return /高知/.test(v)}
async function intro(){
  if(state!=='start'||busy)return;busy=true;
  await later('こんにちは。怪盗関連事件特別捜査本部の相沢です。',700);
  await later('お手元の書面にあるQRコードからアクセスいただき、ありがとうございます。突然のご連絡で失礼します。');
  await later('捜査協力のお願いをお伝えする前に、まず簡単な本人確認をさせてください。');
  await later('以前、怪盗関連事件に巻き込まれた際の<strong>事件発生日</strong>を教えていただけますか？');
  save('verifyDate');busy=false;I.focus();
}
async function dateVerified(){
  save('verifyPlace');busy=true;
  await later('ありがとうございます。日付は確認できました。',900);
  await later('続いて、その事件が発生した<strong>都道府県</strong>を教えてください。');
  busy=false;I.focus();
}
async function verified(){
  save('offer');busy=true;
  await later('確認できました。<strong>2022年10月2日、高知県内</strong>で発生した事件の関係者の方ですね。',1100);
  await later('本人確認は以上です。ご協力ありがとうございます。');
  await later('今回ご連絡したのは、捜査協力をお願いしたいことがあるためです。');
  await later('本部では現在、複数の怪盗関連事件について過去資料の整理と照合を進めています。');
  await later('こちらからお送りする資料と警察DBを確認し、5つの管理番号を特定していただきたいのですが……ご協力いただけますか？');
  actions([['捜査に協力する',cooperate,true],['今回は協力しない',decline,false]]);busy=false;
}
async function decline(){
  busy=true;clearActions();declineCount++;localStorage.setItem(DECLINE_KEY,String(declineCount));
  if(declineCount===1){
    await later('承知しました。急なお願いですから、そう思われるのも当然です。',900);
    await later('ただ、資料をご覧いただいて気づいた点を教えていただくだけでも助かります。可能な範囲で構いません。');
  }else{
    await later('すみません、何度もお願いしてしまって。',900);
    await later('無理にとは申しませんが、今回だけお力を貸していただけると助かります。');
  }
  actions([['捜査に協力する',cooperate,true],['今回は協力しない',decline,false]]);busy=false;
}
async function cooperate(){
  busy=true;clearActions();save('mission');
  await later('ありがとうございます。助かります。',800);
  await later('これからお送りする<strong>「記録照合ページ」</strong>には、5つの確認項目があります。');
  await later('参考資料として、本部の準備公開版データベースもお送りします。DB内の資料やサイト内検索を使って、それぞれの管理番号を特定してください。');
  msg('<span class="msg-event">会話支援AIが次の行動候補を表示しました</span>','system');
  linkSet();
  await later('5件すべてそろったら、照合ページからこのチャットへ戻って結果を教えてください。');
  busy=false;
}
async function report(){
  if(state==='reported'||state==='squirrelReported')return;
  busy=true;clearActions();save('reported');
  userMsg('調査結果を相沢さんに報告する');
  await later('お疲れさまでした。少々お待ちください、照合結果を確認します。',1000);
  await later('……確認できました。5件とも一致しています。');
  await later('本部内部の記録に関する内容も含まれていますので、私の方で判断せず、担当部署へそのまま共有します。');
  await later('ご協力ありがとうございました。今回お願いしていた調査は、これで——');
  await wait(1000);
  msg('<span class="msg-event">⚠ 通信経路に未登録の接続を検知しました</span>','system');
  await later('……すみません。今、こちらの画面に見慣れない接続表示が出ています。',1100);
  await later('やっほ〜😏　警察さんのお手伝い、おつかれサマ〜♪',1200,'ojisan');
  await later('相変わらずマジメだネ〜。でも、まだ終わりじゃないヨ。',1700,'ojisan');
  await later('次はパソコンばっかり見てないで、<strong>お家の中</strong>を使って遊ぼっか🏠✨',1800,'ojisan');
  msg('<div class="chat-linkset"><a class="btn" href="../mission/house/">おじさんからの次の手がかりを見る</a></div>','system');
  busy=false;
}
async function squirrel(){
  busy=true;clearActions();save('squirrelReported');
  userMsg('家の中で見つけたものを相沢さんに報告する');
  await later('お戻りですね。何か見つかったんですか？',900);
  await later('……「リス」ですか？');
  await later('少々待ってください。先ほど表示された追加指示は、こちらから送信したものではありません。');
  await later('もし、その指示をたどって<strong>実際にご自宅の中で何かを見つけた</strong>のであれば……');
  await later('<strong>誰かが、あなたの家の中に入った可能性があります。</strong>',1900);
  await wait(900);
  msg('<span class="msg-event">⚠ 通信経路に未登録の接続を検知しました</span>','system');
  await later('あ、バレちゃった！？😳',900,'ojisan');
  await later('そんな怖い顔しないでヨ〜。何にも盗んでないってば‼️',1500,'ojisan');
  await later('せっかくだから、もう少しだけ遊ぼっか♪',1500,'ojisan');
  msg('<div class="chat-linkset"><a class="btn" href="../mission/trace/">残された痕跡を確認する</a></div>','system');
  busy=false;
}
async function generic(v){
  if(state==='mission')return later('ありがとうございます。まずは5件の管理番号を照合してください。すべてそろったら結果を報告してください。',800);
  if(state==='reported')return later('先ほどの未登録接続について確認しています。表示された指示には十分注意してください。',800);
  if(state==='squirrelReported')return later('安全のため、周囲を確認しながら進めてください。',800);
  return later('ありがとうございます。確認します。',700);
}
F.onsubmit=async e=>{
  e.preventDefault();if(busy)return;const v=I.value.trim();if(!v)return;userMsg(v);I.value='';clearActions();
  if(state==='verifyDate'){
    busy=true;
    if(isCorrectDate(v)){busy=false;return dateVerified()}
    if(isBirthday(v)){await later('惜しいです。<strong>10月3日ではなく、その前日</strong>に起きた事件です。怪盗の事件が起きた日を思い出してみてください。',850);busy=false;return}
    await later('このQRコードに紐づく事件記録と日付が一致しないようです。もう一度確認してみてください。',850);busy=false;return;
  }
  if(state==='verifyPlace'){
    busy=true;
    if(isKochi(v)){busy=false;return verified()}
    await later('このQRコードに紐づく事件記録の発生場所と一致しないようです。都道府県名で、もう一度確認してみてください。',850);busy=false;return;
  }
  if(state==='offer'){
    if(/協力|やる|はい|いいよ|お願いします/.test(v))return cooperate();
    if(/しない|無理|いや|嫌|断/.test(v))return decline();
    await later('ありがとうございます。捜査協力をお願いしてもよろしいでしょうか？',700);actions([['捜査に協力する',cooperate,true],['今回は協力しない',decline,false]]);return;
  }
  generic(v);
};

function restore(){
  if(qs.get('report')==='1'){setTimeout(report,350);return}
  if(qs.get('squirrel')==='1'){setTimeout(squirrel,350);return}
  if(state==='start'){intro();return}
  if(state==='verifyDate'){msg('本人確認を続けます。以前の怪盗関連事件が発生した<strong>日付</strong>を教えてください。');return}
  if(state==='verifyPlace'){msg('日付は確認済みです。事件が発生した<strong>都道府県</strong>を教えてください。');return}
  if(state==='offer'){msg('本人確認は完了しています。今回の資料照合にご協力いただけますか？');actions([['捜査に協力する',cooperate,true],['今回は協力しない',decline,false]]);return}
  if(state==='mission'){
    msg('資料の照合をお願いします。5件すべてそろったら結果を教えてください。');linkSet();
    if(localStorage.getItem('phantomPolicePuzzleComplete')==='1')actions([['照合結果を相沢さんに報告する',()=>location.href='?report=1',true]]);
    return;
  }
  if(state==='reported'){
    msg('先ほどの通信への未登録接続について確認中です。');
    msg('<div class="chat-linkset"><a class="btn" href="../mission/house/">おじさんからの次の手がかりを見る</a></div>','system');return;
  }
  if(state==='squirrelReported'){
    msg('家への侵入の可能性があります。周囲を確認しながら進めてください。');
    msg('<div class="chat-linkset"><a class="btn" href="../mission/trace/">残された痕跡を確認する</a></div>','system');
  }
}
restore();
})();
