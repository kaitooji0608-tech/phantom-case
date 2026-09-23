(() => {
  const CHAT_URL="https://phantom-case-police.github.io/phantom-case/police/chat/";

  function hasActiveChat(){
    const candidates=[];
    for(let i=0;i<localStorage.length;i++){
      const key=localStorage.key(i);
      if(key && /^phantom_case_master_state_v\d+/.test(key)){
        candidates.push(key);
      }
    }

    for(const key of candidates){
      try{
        const s=JSON.parse(localStorage.getItem(key));
        if(
          s &&
          s.chat &&
          Array.isArray(s.chat.transcript) &&
          s.chat.transcript.length>0
        ){
          return true;
        }
      }catch(e){}
    }
    return false;
  }

  document.querySelectorAll("[data-session-return]").forEach(el=>{
    if(hasActiveChat()){
      el.classList.add("show");
      const a=el.querySelector("a");
      if(a) a.href=CHAT_URL;
    }
  });
})();