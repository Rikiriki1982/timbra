/* Preventivi · Listino prodotti.
   I file in questa cartella si caricano in ordine (vedi boot.js) e condividono le stesse variabili. */
"use strict";
/* ---------- listino ---------- */
const gruppoDi=x=>x.gruppo||(x.cat==="man"?"Manodopera":x.cat==="acc"?"Accessori":"Altri prodotti");
function fillCatFilter(){const cur=$("#catFilter").value;const gs=[...new Set(catalog.map(gruppoDi))].sort();
  $("#catFilter").innerHTML=`<option value="">Tutti i gruppi</option>`+gs.map(g=>`<option value="g:${esc(g)}">${esc(g)} (${catalog.filter(x=>gruppoDi(x)===g).length})</option>`).join("")+`<option value="nop">Senza prezzo</option>`;
  $("#catFilter").value=cur}
function catList(){const s=$("#catSearch").value.toLowerCase().trim(),f=$("#catFilter").value;
  return catalog.filter(x=>(!f||(f==="nop"?!n(x.prezzo):gruppoDi(x)===f.slice(2)))&&(!s||s.split(/\s+/).every(w=>[x.codice,x.titolo,x.descr,x.info,x.marca,x.gruppo].join(" ").toLowerCase().includes(w))))}
function renderCatalog(){
  fillCatFilter();const list=catList();$("#catCount").textContent=list.length+" voci";
  const show=list.slice(0,300);
  $("#catTable").innerHTML=`<tr><th></th><th>Gruppo</th><th>Codice</th><th>Articolo</th><th>U.M.</th><th class="num">Costo</th><th class="num">Prezzo</th><th></th></tr>`+
   (show.length?show.map(x=>`<tr data-id="${x.id}"><td>${x.img?`<img class="mini" src="${esc(IS(x.img))}" alt="" loading="lazy" referrerpolicy="no-referrer">`:""}</td>
    <td style="font-size:12px">${esc(gruppoDi(x))}</td><td style="font-family:var(--mono)">${esc(x.codice)}</td>
    <td><b>${esc(x.titolo||lbl(x))}</b>${x.descr?`<br><span class="muted">${esc(x.descr)}</span>`:""}${x.info?`<br><span class="muted" style="font-size:12px">${esc(x.info.slice(0,140))}</span>`:""}${x.fonte?` <a href="${esc(x.fonte)}" target="_blank" rel="noopener" style="font-size:12px">fonte</a>`:""}</td><td>${esc(x.um)}</td>
    <td class="num muted">${x.costo!=null&&n(x.costo)?eur.format(n(x.costo)):"–"}</td>
    <td class="num">${n(x.prezzo)?eur.format(n(x.prezzo)):`<span style="color:var(--warn)">da inserire</span>`}</td>
    <td style="white-space:nowrap"><button class="btn small" data-c="use">Al preventivo</button> <button class="btn small" data-c="edit">Modifica</button> <button class="btn small danger" data-c="del">Elimina</button></td></tr>`).join("")
   :`<tr><td colspan="8" class="muted">Nessuna voce trovata.</td></tr>`)+(list.length>300?`<tr><td colspan="8" class="muted">Mostrate le prime 300 voci: usa la ricerca o il filtro per gruppo.</td></tr>`:"");
}
$("#catSearch").addEventListener("input",renderCatalog);$("#catFilter").addEventListener("change",renderCatalog);
$("#bRicarico").onclick=()=>{const r=n($("#ricarico").value),list=catList().filter(x=>n(x.costo??x.prezzo)>0);
  if(!list.length){toast("Nessuna voce con costo tra quelle mostrate");return}
  confirmBox(`Applicare il ricarico del ${num.format(r)}% a ${list.length} voci?`,()=>{list.forEach(x=>{if(x.costo==null)x.costo=n(x.prezzo);x.prezzo=r2(n(x.costo)*(1+r/100))});store.set("listino",catalog);renderCatalog();toast("Prezzi aggiornati")})};
$("#catTable").addEventListener("click",e=>{const b=e.target.closest("[data-c]");if(!b)return;const id=b.closest("tr").dataset.id,x=catalog.find(c=>c.id===id);
  if(b.dataset.c==="del"){catalog=catalog.filter(c=>c.id!==id);store.set("listino",catalog);renderCatalog()}
  else if(b.dataset.c==="edit")catEdit(x);
  else{q.righe.push(Object.assign(blankRow(),pick(x),{qta:1}));changed(true);toast("Aggiunta al preventivo: "+lbl(x))}});
$("#bCatAdd").onclick=()=>catEdit(null);
function catEdit(x){
  const it=x?Object.assign({},x):{id:uid(),cat:"mat",gruppo:"",codice:"",titolo:"",descr:"",um:"pz",costo:0,prezzo:0,img:""};
  modal(`<h3>${x?"Modifica voce":"Nuova voce di listino"}</h3><div class="grid">
   <label class="f">Categoria<select id="e_cat" class="inp">${Object.entries(CATS).map(([k,v])=>`<option value="${k}"${k===it.cat?" selected":""}>${v}</option>`).join("")}</select></label>
   <label class="f">Gruppo<input id="e_gruppo" class="inp" value="${esc(it.gruppo||"")}" list="dlGruppi"><datalist id="dlGruppi">${[...new Set(catalog.map(gruppoDi))].map(g=>`<option value="${esc(g)}">`).join("")}</datalist></label>
   <label class="f">Codice / modello<input id="e_codice" class="inp" value="${esc(it.codice)}"></label>
   <label class="f">Unità di misura<input id="e_um" class="inp" value="${esc(it.um)}" placeholder="pz, m, h, kit…"></label>
   <label class="f full">Descrizione breve<input id="e_titolo" class="inp" value="${esc(it.titolo)}"></label>
   <label class="f full">Dettagli (una riga per punto elenco)<textarea id="e_descr" class="inp" rows="2">${esc(it.descr)}</textarea></label>
   <label class="f">Costo d'acquisto €<input id="e_costo" class="inp" type="number" step="0.01" value="${esc(it.costo??"")}"></label>
   <label class="f">Prezzo di vendita €<input id="e_prezzo" class="inp" type="number" step="0.01" value="${esc(it.prezzo)}"></label>
   <label class="f full">Immagine (indirizzo web o file nella cartella img)<input id="e_img" class="inp" value="${it.img&&!it.img.startsWith("data:")?esc(it.img):""}" placeholder="${(it.img||"").startsWith("data:")?"Immagine caricata dal computer":"https://…"}"></label>
   <label class="f full">Oppure leggi da pagina web<div style="display:flex;gap:6px"><input id="e_url" class="inp" placeholder="https://…" value="${esc(it.fonte||"")}"><button class="btn" id="e_fetch">Leggi</button></div></label>
   ${it.info?`<p class="hint full">${esc(it.info)}</p>`:""}
  </div><div style="display:flex;gap:6px;justify-content:flex-end;margin-top:12px"><button class="btn" data-close>Annulla</button><button class="btn primary" id="e_ok">Salva</button></div>`);
  $("#e_fetch").onclick=async()=>{let u=$("#e_url").value.trim();if(!u)return;if(!/^https?:/i.test(u))u="https://"+u;$("#e_fetch").textContent="…";const m=await fetchMeta(u);$("#e_fetch").textContent="Leggi";
    if(!m){toast("Lettura non riuscita su questo sito");return}if(m.titolo)$("#e_titolo").value=m.titolo;if(m.descr)$("#e_descr").value=m.descr;if(m.img)$("#e_img").value=m.img;if(m.prezzo)$("#e_costo").value=m.prezzo};
  $("#e_ok").onclick=()=>{["cat","gruppo","codice","titolo","descr","um"].forEach(k=>it[k]=$("#e_"+k).value.trim());it.prezzo=n($("#e_prezzo").value);it.costo=$("#e_costo").value===""?null:n($("#e_costo").value);
    const im=$("#e_img").value.trim();if(im||!(it.img||"").startsWith("data:"))it.img=im;
    const i=catalog.findIndex(c=>c.id===it.id);if(i>=0)catalog[i]=it;else catalog.push(it);store.set("listino",catalog);closeModal();renderCatalog();toast("Listino aggiornato")};
}
$("#bFromCat").onclick=()=>{
  const gs=[...new Set(catalog.map(gruppoDi))].sort();
  modal(`<h3>Aggiungi dal listino</h3><div style="display:flex;gap:6px;margin-bottom:8px"><input id="pkS" class="inp" placeholder="Cerca codice o modello…"><select id="pkG" class="inp" style="width:auto"><option value="">Tutti i gruppi</option>${gs.map(g=>`<option>${esc(g)}</option>`).join("")}</select></div><div id="pkL" style="max-height:60vh;overflow:auto"></div>
   <div style="display:flex;justify-content:flex-end;margin-top:10px"><button class="btn" data-close>Chiudi</button></div>`);
  const draw=()=>{const s=$("#pkS").value.toLowerCase().trim(),g=$("#pkG").value;
    const l=catalog.filter(x=>(!g||gruppoDi(x)===g)&&(!s||s.split(/\s+/).every(w=>[x.codice,x.titolo,x.descr,x.info,x.marca].join(" ").toLowerCase().includes(w))));
    const by={};l.slice(0,200).forEach(x=>(by[gruppoDi(x)]=by[gruppoDi(x)]||[]).push(x));
    $("#pkL").innerHTML=Object.keys(by).sort().map(gr=>`<div class="cat-head">${esc(gr)}</div>`+by[gr].map(x=>`<div class="picker-item" data-id="${x.id}">${x.img?`<img class="mini" src="${esc(IS(x.img))}" alt="" loading="lazy" referrerpolicy="no-referrer">`:`<span class="mini"></span>`}<div><b>${esc(lbl(x))}</b><br><span class="muted">${esc((x.info||x.descr||"").split("\n")[0].slice(0,90))}</span></div><span class="p">${n(x.prezzo)?eur.format(n(x.prezzo)):"da inserire"}</span></div>`).join("")).join("")||`<p class="muted">Nessuna voce trovata.</p>`};
  draw();$("#pkS").oninput=draw;$("#pkG").onchange=draw;$("#pkS").focus();
  $("#pkL").onclick=e=>{const it=e.target.closest(".picker-item");if(!it)return;const x=catalog.find(c=>c.id===it.dataset.id);q.righe.push(Object.assign(blankRow(),pick(x),{qta:1}));changed(true);toast("Aggiunta: "+lbl(x))};
};
/* CSV */
function csvParse(t){const sep=(t.split("\n")[0].match(/;/g)||[]).length>=(t.split("\n")[0].match(/,/g)||[]).length?";":",";const rows=[];let row=[],cur="",inq=false;
  for(let i=0;i<t.length;i++){const ch=t[i];if(inq){if(ch==='"'){if(t[i+1]==='"'){cur+='"';i++}else inq=false}else cur+=ch}else if(ch==='"')inq=true;else if(ch===sep){row.push(cur);cur=""}else if(ch==="\n"){row.push(cur.replace(/\r$/,""));rows.push(row);row=[];cur=""}else cur+=ch}
  if(cur||row.length){row.push(cur);rows.push(row)}return rows.filter(r=>r.some(c=>c.trim()))}
$("#bCatImport").onclick=()=>{const f=$("#fileCsv");f.value="";f.onchange=()=>{const file=f.files[0];if(!file)return;const fr=new FileReader();fr.onload=()=>{
  const rows=csvParse(String(fr.result).replace(/^﻿/,""));if(!rows.length)return;let start=0;if(/categ/i.test(rows[0][0]))start=1;let k=0;
  for(const r of rows.slice(start)){const cat=CAT_CSV[(r[0]||"").trim().toLowerCase()]||"mat";catalog.push({id:uid(),cat,codice:(r[1]||"").trim(),titolo:(r[2]||"").trim(),descr:(r[3]||"").trim(),um:(r[4]||"pz").trim(),prezzo:n((r[5]||"0").replace(/\.(?=\d{3}(\D|$))/g,"")),img:(r[6]||"").trim()});k++}
  store.set("listino",catalog);renderCatalog();toast(k+" voci importate")};fr.readAsText(file)};f.click()};
$("#bCatExport").onclick=()=>{const q2=v=>`"${String(v??"").replace(/"/g,'""')}"`;const inv={mat:"materiali",man:"manodopera",acc:"accessori"};
  const txt="categoria;codice;titolo;descrizione;um;prezzo;immagine\n"+catalog.map(x=>[inv[x.cat],x.codice,x.titolo,x.descr,x.um,String(n(x.prezzo)).replace(".",","),x.img&&x.img.startsWith("data:")?"":x.img].map(q2).join(";")).join("\n");
  saveFile("listino.csv",txt,"text/csv")};

