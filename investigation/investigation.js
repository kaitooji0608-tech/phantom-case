(function(){
  const KEY='phantomPolicePuzzle';
  const COMPLETE_KEY='phantomPolicePuzzleComplete';
  let state={};
  try{state=JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){}

  function sync(){
    let n=0;
    document.querySelectorAll('.row').forEach(row=>{
      const k=row.dataset.key;
      if(state[k]){
        n++;
        row.classList.add('correct');
        row.querySelector('input').value=row.dataset.answer;
        row.querySelector('input').disabled=true;
        row.querySelector('button').disabled=true;
        row.querySelector('.state').textContent='照合済';
      }
    });

    if(n===5){
      document.getElementById('complete').hidden=false;
      localStorage.setItem(COMPLETE_KEY,'1');
    }
  }

  document.querySelectorAll('.row button').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const row=btn.closest('.row');
      const input=row.querySelector('input');
      const value=input.value.replace(/\D/g,'');
      const status=row.querySelector('.state');

      if(value===row.dataset.answer){
        state[row.dataset.key]=true;
        localStorage.setItem(KEY,JSON.stringify(state));
        sync();
      }else{
        status.textContent='該当する管理番号を確認できませんでした。';
        status.style.color='#d08080';
      }
    });
  });

  sync();
})();
