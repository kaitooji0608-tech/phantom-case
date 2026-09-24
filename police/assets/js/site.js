
(function(){
  const body=document.body;
  const sid=body.dataset.secretId;
  if(sid){
    const key='phantomPoliceSecrets';
    let found=[]; try{found=JSON.parse(localStorage.getItem(key)||'[]')}catch(e){}
    if(!found.includes(sid)){found.push(sid);localStorage.setItem(key,JSON.stringify(found));const t=document.getElementById('secret-toast');if(t){t.textContent=sid+' FOUND';setTimeout(()=>t.classList.add('show'),250);setTimeout(()=>t.classList.remove('show'),3300)}}
  }
  document.querySelectorAll('.evidence img').forEach(img=>img.addEventListener('click',()=>{let lb=document.querySelector('.lightbox');if(!lb){lb=document.createElement('div');lb.className='lightbox';lb.innerHTML='<img>';document.body.appendChild(lb);lb.addEventListener('click',()=>lb.classList.remove('open'))}lb.querySelector('img').src=img.src;lb.classList.add('open')}));
})();
