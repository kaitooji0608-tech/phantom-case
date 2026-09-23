
const params=new URLSearchParams(location.search);
const q=(params.get("q")||"").trim();
const box=document.getElementById("searchBox");
const results=document.getElementById("results");
const summary=document.getElementById("summary");
box.value=q;
const norm=s=>(s||"").toLowerCase().replace(/[　\s\-‐‑‒–—―ー・･。、，,.()[\]{}「」『』【】]/g,"");
const tokens=s=>(s||"").toLowerCase().split(/[\s　]+/).filter(Boolean).map(norm);
function publicMatch(x,q){
 const hay=norm(x.title+" "+x.text), ts=tokens(q);
 return ts.length && ts.every(t=>hay.includes(t));
}
function keyedMatch(x,q){
 const nq=norm(q);
 return (x.keys||[]).some(k=>nq===norm(k));
}
if(!q){summary.textContent="キーワードを入力してください。";}
else{
 const hits=(window.POLICE_SEARCH_INDEX||[]).filter(x=>x.mode==="public"?publicMatch(x,q):keyedMatch(x,q));
 summary.textContent=`「${q}」の検索結果：${hits.length}件`;
 if(!hits.length){results.innerHTML='<div class="no-result">該当する公開情報は見つかりませんでした。</div>';}
 else{results.innerHTML=hits.map(x=>`<article class="search-result"><small class="search-type">${x.type}</small><h3><a href="${x.url}">${x.title}</a></h3><p>${x.text}</p></article>`).join("");}
}
