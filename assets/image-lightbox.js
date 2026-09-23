
document.addEventListener("DOMContentLoaded",()=>{
  const box=document.createElement("div");box.id="lightbox";
  box.innerHTML='<button aria-label="閉じる">×</button><img alt="">';
  document.body.appendChild(box);
  const img=box.querySelector("img");
  document.querySelectorAll(".evidence-image,.news-photo img").forEach(el=>{
    el.addEventListener("click",()=>{img.src=el.src;box.classList.add("show")});
  });
  const close=()=>box.classList.remove("show");
  box.addEventListener("click",e=>{if(e.target===box||e.target.tagName==="BUTTON")close()});
  document.addEventListener("keydown",e=>{if(e.key==="Escape")close()});
});
