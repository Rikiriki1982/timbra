/* Preventivi · Voci del preventivo: editor delle righe, immagini, importazione dal web.
   I file in questa cartella si caricano in ordine (vedi boot.js) e condividono le stesse variabili. */
"use strict";
/* ---------- righe (editor) ---------- */
$("#webCat").innerHTML=Object.entries(CATS).map(([k,v])=>`<option value="${k}">${v}</option>`).join("");
function renderRows(){
  const box=$("#rows");let h="";
  for(const cat of Object.keys(CATS)){
    const list=q.righe.filter(r=>r.cat===cat);
    h+=`<div class="cat-head">${CATS[cat]} <span class="pill">${list.length}</span><span class="sp"></span><button class="btn small" data-add="${cat}">+ Voce</button></div>`;
    if(!list.length)h+=`<div class="empty">Nessuna voce. Aggiungila a mano, dal listino o da un link web.</div>`;
    for(const r of list){
      const i=q.righe.indexOf(r);
      h+=`<div class="row-card${r.omaggio?" gift":""}" data-i="${i}">
        <div class="thumb" data-act="img" title="Cambia immagine">${r.img?`<img src="${esc(IS(r.img))}" alt="" referrerpolicy="no-referrer">`:"Aggiungi<br>immagine"}</div>
        <div class="row-fields">
          <input class="inp c2" data-k="codice" value="${esc(r.codice)}" placeholder="Codice / modello">
          <input class="inp c4" data-k="titolo" value="${esc(r.titolo)}" placeholder="Descrizione breve">
          <textarea class="inp c6" data-k="descr" rows="2" placeholder="Dettagli: ogni riga diventa un punto elenco">${esc(r.descr)}</textarea>
          <label class="f">${r.cat==="man"?"Ore / Q.tà":"Q.tà"}<input class="inp" data-k="qta" type="number" step="any" min="0" value="${esc(r.qta)}"></label>
          <label class="f">U.M.<input class="inp" data-k="um" value="${esc(r.um)}"></label>
          <label class="f c2">Prezzo unit. €<input class="inp" data-k="prezzo" type="number" step="0.01" min="0" value="${esc(r.prezzo)}"></label>
          <label class="f">Sconto %<input class="inp" data-k="sconto" type="number" step="0.01" min="0" max="100" value="${esc(r.sconto)}"></label>
          ${r.cat==="man"?`<label class="f">Tecnici<input class="inp" data-k="pers" type="number" step="1" min="1" value="${esc(r.pers||1)}"></label>`:""}
          <label class="f">Categoria<select class="inp" data-k="cat">${Object.entries(CATS).map(([k,v])=>`<option value="${k}"${k===r.cat?" selected":""}>${v.split(" ")[0]}</option>`).join("")}</select></label>
          <div class="row-tools">
            <label class="chk"><input type="checkbox" data-k="omaggio"${r.omaggio?" checked":""}> Omaggio (prezzo azzerato)</label>
            <button class="btn small" data-act="up" title="Sposta su">↑</button><button class="btn small" data-act="down" title="Sposta giù">↓</button>
            <button class="btn small" data-act="dup">Duplica</button>
            <button class="btn small" data-act="tocat" title="Salva questa voce nel listino">→ Listino</button>
            <button class="btn small danger" data-act="del">Elimina</button>
            <span class="tot" data-tot></span>
          </div>
        </div></div>`;
    }
  }
  box.innerHTML=h;updateRowTotals();
}
function updateRowTotals(){
  const c=calc(q);
  $$("#rows .row-card").forEach(el=>{const x=c.rows[+el.dataset.i];if(!x)return;
    el.querySelector("[data-tot]").innerHTML=x.r.omaggio?`<span style="color:var(--ok)">Omaggio</span> <s class="muted">${eur.format(x.lordo)}</s>`:(x.netto!==x.lordo?`<s class="muted">${eur.format(x.lordo)}</s> ${eur.format(x.netto)}`:eur.format(x.netto));
    el.classList.toggle("gift",!!x.r.omaggio);});
}
$("#rows").addEventListener("input",e=>{
  const card=e.target.closest(".row-card"),k=e.target.dataset.k;if(!card||!k)return;
  const r=q.righe[+card.dataset.i];
  if(k==="omaggio"){r.omaggio=e.target.checked;changed();return}
  if(k==="cat"){r.cat=e.target.value;if(r.cat==="man"&&!r.img)r.img=IMG.tools;changed(true);return}
  r[k]=e.target.value;changed();
});
$("#rows").addEventListener("click",e=>{
  const add=e.target.closest("[data-add]");if(add){q.righe.push(blankRow(add.dataset.add));changed(true);return}
  const b=e.target.closest("[data-act]");if(!b)return;
  const i=+b.closest(".row-card").dataset.i,r=q.righe[i],act=b.dataset.act;
  if(act==="del"){q.righe.splice(i,1);changed(true)}
  else if(act==="dup"){q.righe.splice(i+1,0,Object.assign({},r,{id:uid()}));changed(true)}
  else if(act==="up"||act==="down"){const same=q.righe.map((x,j)=>j).filter(j=>q.righe[j].cat===r.cat);const p=same.indexOf(i),t=same[p+(act==="up"?-1:1)];if(t==null)return;[q.righe[i],q.righe[t]]=[q.righe[t],q.righe[i]];changed(true)}
  else if(act==="tocat"){catalog.push({id:uid(),cat:r.cat,codice:r.codice||"",titolo:r.titolo,descr:r.descr,um:r.um,prezzo:n(r.prezzo),pers:n(r.pers)||1,img:r.img});store.set("listino",catalog);toast("Voce aggiunta al listino")}
  else if(act==="img")imageDialog(r);
});

/* ---------- immagini ---------- */
function resizeFile(file,max){return new Promise((res,rej)=>{const fr=new FileReader();fr.onload=()=>{const im=new Image();im.onload=()=>{const s=Math.min(1,max/Math.max(im.width,im.height));const cv=document.createElement("canvas");cv.width=Math.round(im.width*s);cv.height=Math.round(im.height*s);const ctx=cv.getContext("2d");ctx.drawImage(im,0,0,cv.width,cv.height);const png=file.type==="image/png"||file.type==="image/svg+xml";res(cv.toDataURL(png?"image/png":"image/jpeg",.85))};im.onerror=rej;im.src=fr.result};fr.onerror=rej;fr.readAsDataURL(file)})}
function imageDialog(r){
  const q1=encodeURIComponent((r.titolo||"")+" "+(r.codice||""));
  modal(`<h3>Immagine della voce</h3>
   <div class="grid">
    <label class="f full">Indirizzo dell'immagine (tasto destro sull'immagine → «Copia indirizzo immagine»)<input id="mImgUrl" class="inp" value="${r.img&&!r.img.startsWith("data:")?esc(r.img):""}" placeholder="https://…/foto.jpg"></label>
    <div class="full" style="display:flex;gap:6px;flex-wrap:wrap">
     <button class="btn" id="mImgFile">Carica dal computer</button>
     <a class="btn" href="https://www.google.com/search?tbm=isch&q=${q1}" target="_blank" rel="noopener">Cerca su Google Immagini</a>
     <button class="btn danger" id="mImgDel">Rimuovi immagine</button>
    </div>
    <p class="hint full">Puoi anche incollare un'immagine copiata (Ctrl+V) mentre questa finestra è aperta.</p>
   </div>
   <div style="display:flex;gap:6px;justify-content:flex-end;margin-top:12px"><button class="btn" data-close>Annulla</button><button class="btn primary" id="mImgOk">Usa questo indirizzo</button></div>`);
  const done=v=>{r.img=v;closeModal();changed(true)};
  $("#mImgOk").onclick=()=>done($("#mImgUrl").value.trim());
  $("#mImgDel").onclick=()=>done("");
  $("#mImgFile").onclick=()=>{const f=$("#fileImg");f.value="";f.onchange=async()=>{if(f.files[0])done(await resizeFile(f.files[0],800))};f.click()};
  pasteHandler=async e=>{const it=[...(e.clipboardData?.items||[])].find(x=>x.type.startsWith("image/"));if(it){e.preventDefault();done(await resizeFile(it.getAsFile(),800))}};
}
let pasteHandler=null;
document.addEventListener("paste",e=>{if(pasteHandler)pasteHandler(e)});

/* ---------- import dal web ---------- */
async function fetchMeta(url){
  // 1) Microlink: legge i metadati Open Graph (titolo, descrizione, immagine)
  try{
    const res=await fetch("https://api.microlink.io/?url="+encodeURIComponent(url));
    const j=await res.json();
    if(j.status==="success"&&j.data&&(j.data.title||j.data.description)){
      return{titolo:j.data.title||"",descr:j.data.description||"",img:(j.data.image&&j.data.image.url)||(j.data.logo&&j.data.logo.url)||"",prezzo:0};
    }
  }catch(e){}
  // 2) Jina Reader come riserva
  try{
    const res=await fetch("https://r.jina.ai/"+url,{headers:{"Accept":"application/json"}});
    const j=await res.json();const d=j.data||{};
    const content=d.content||"";
    const img=(content.match(/!\[[^\]]*\]\((https?:[^)\s]+)\)/)||[])[1]||"";
    const para=content.split("\n").map(s=>s.trim()).find(s=>s.length>60&&!s.startsWith("!")&&!s.startsWith("[")&&!s.startsWith("#"))||"";
    const pr=(content.match(/(\d{1,3}(?:\.\d{3})*,\d{2})\s?€|€\s?(\d{1,3}(?:\.\d{3})*,\d{2})/)||[]);
    const prezzo=pr[1]||pr[2]?n((pr[1]||pr[2]).replace(/\./g,"")):0;
    if(d.title||para)return{titolo:d.title||"",descr:d.description||para.slice(0,300),img,prezzo};
  }catch(e){}
  return null;
}
$("#bWeb").addEventListener("click",async()=>{
  let url=$("#webUrl").value.trim();if(!url){toast("Incolla prima il link della pagina prodotto");return}
  if(!/^https?:\/\//i.test(url))url="https://"+url;
  const b=$("#bWeb");b.disabled=true;b.textContent="Lettura…";
  const m=await fetchMeta(url);b.disabled=false;b.textContent="Importa";
  const r=blankRow($("#webCat").value);r.link=url;
  if(m){Object.assign(r,{titolo:m.titolo.slice(0,160),descr:m.descr.slice(0,400),img:m.img,prezzo:m.prezzo||0});toast(m.prezzo?"Voce importata, prezzo trovato: verificalo":"Voce importata: inserisci il prezzo")}
  else{r.titolo="";r.descr=url;toast("Il sito non consente la lettura automatica: completa la voce a mano")}
  q.righe.push(r);$("#webUrl").value="";changed(true);
});

