
(()=>{const el=document.querySelector("[data-session-return]");if(!el)return;
 const active=localStorage.getItem("phantom_case_chat_started")||localStorage.getItem("pc_chat_started")||sessionStorage.getItem("phantom_case_chat_started");
 if(active){el.classList.add("show");const a=el.querySelector("a");if(a)a.href="/phantom-case/police/chat/";}
})();
