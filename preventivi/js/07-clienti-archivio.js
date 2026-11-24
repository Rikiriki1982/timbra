/* Preventivi · Ricerca dati cliente, archivio preventivi, dati azienda, utilità dell'interfaccia.
   I file in questa cartella si caricano in ordine (vedi boot.js) e condividono le stesse variabili. */
"use strict";
/* ---------- cliente: ricerca dati ---------- */
function refreshClientList(){const cl=store.get("clienti",[]);$("#dlClienti").innerHTML=cl.map(c=>`<option value="${esc(c.nome)}">${esc(c.piva||"")} ${esc(c.legale||"")}</option>`).join("")}
function setClient(o,overwrite){CF.forEach(k=>{if(o[k]!=null&&o[k]!==""&&(overwrite||!q.cliente[k]))q.cliente[k]=o[k]});if(o.sdiVis!=null)q.cliente.sdiVis=!!o.sdiVis;showClient();changed()}
$("#c_nome").addEventListener("change",()=>{const v=$("#c_nome").value.trim().toLowerCase();const c=store.get("clienti",[]).find(x=>x.nome.toLowerCase()===v);
  if(c){setClient(c,true);$("#viesMsg").textContent="Dati presi dai clienti salvati."}
  const lk=$("#lnkPiva");if(lk)lk.href="https://www.google.com/search?q="+encodeURIComponent((v||"")+" partita iva sede legale")});
const tCase=s=>s.toLowerCase().replace(/(^|[\s'(\/-])([a-zà-ù])/g,(m,a,b)=>a+b.toUpperCase());
function fmtAddr(a){const L=String(a||"").split("\n").map(x=>x.trim()).filter(Boolean);
  return L.map(l=>{const m=l.match(/^(\d{5})\s+(.+?)\s+([A-Z]{2})$/);return m?`${m[1]} ${tCase(m[2])} (${m[3]})`:tCase(l)}).join(", ")}
async function vies(piva){
  const api="https://ec.europa.eu/taxation_customs/vies/rest-api/ms/IT/vat/"+piva;
  const tries=[
    async()=>{const r=await fetch("https://r.jina.ai/"+api,{headers:{Accept:"application/json"}});const j=await r.json();return JSON.parse(j.data.content)},
    async()=>{const r=await fetch("https://corsproxy.io/?url="+encodeURIComponent(api));return r.json()},
    async()=>{const r=await fetch("https://api.allorigins.win/raw?url="+encodeURIComponent(api));return r.json()}
  ];
  for(const t of tries){try{const d=await t();if(d&&typeof d.isValid==="boolean")return d}catch(e){}}
  return null;
}
$("#bVies").onclick=async()=>{
  const piva=$("#c_piva").value.replace(/\D/g,"");const msg=$("#viesMsg");
  if(piva.length!==11){msg.textContent="La partita IVA italiana ha 11 cifre.";return}
  const saved=store.get("clienti",[]).find(x=>String(x.piva||"").replace(/\D/g,"")===piva);
  if(saved){setClient(saved,true);msg.textContent="Cliente già presente: dati presi dai clienti salvati.";return}
  const b=$("#bVies");b.disabled=true;b.textContent="Cerco…";msg.textContent="Ricerca nel registro europeo VIES…";
  const d=await vies(piva);b.disabled=false;b.textContent="Cerca dati";
  if(!d){msg.textContent="Servizio VIES non raggiungibile in questo momento: riprova tra poco o inserisci i dati a mano.";return}
  if(!d.isValid){msg.textContent="Partita IVA non trovata o non attiva nel registro VIES: controlla il numero.";return}
  const nome=(d.name||"").trim(),ind=fmtAddr(d.address);
  setClient({nome:nome&&nome!=="---"?nome:"",piva,legale:ind&&ind!=="---"?ind:""},true);
  msg.textContent="Dati trovati nel registro VIES (ragione sociale e sede legale). Completa sede esecutiva, PEC e codice SDI se servono.";
};
/* ricerca dal nome: enti pubblici (IPA), partita IVA (VIES) e, se attiva, ricerca web */
const bNome=$("#bNome");
function applyFound(r){
  const c=q.cliente,o={nome:r.nome||"",piva:r.piva||"",legale:r.indirizzo||"",sdi:r.sdi||""};
  if(r.pec&&!c.email)o.email=r.pec;
  setClient(o,true);$("#nomeRes").textContent="";
  $("#viesMsg").textContent="Dati trovati ("+r.fonte+"). Controlla che siano giusti"+" e completa sede esecutiva, referente e telefono se servono."}
async function cercaNome(){
  const msg=$("#viesMsg"),box=$("#nomeRes"),name=$("#c_nome").value.trim();box.textContent="";
  if(name.length<3){msg.textContent="Scrivi almeno 3 lettere del nome.";return}
  const saved=store.get("clienti",[]).find(x=>x.nome.toLowerCase()===name.toLowerCase());
  if(saved){setClient(saved,true);msg.textContent="Cliente già presente: dati presi dai clienti salvati.";return}
  if(!window.PREV_FN){msg.textContent="La ricerca per nome funziona dopo l'accesso nell'app (qui i dati restano solo su questo browser). Usa la partita IVA e «Cerca dati».";return}
  bNome.disabled=true;bNome.textContent="Cerco…";msg.textContent="Cerco «"+name+"»…";
  try{
    const d=await window.PREV_FN("cerca-azienda",{q:name});const R=d.risultati||[];
    if(!R.length){msg.textContent=d.nota||"Nessun risultato.";return}
    if(R.length===1&&R[0].punteggio>=0.8){applyFound(R[0]);return}
    msg.textContent="Ho trovato più risultati: tocca quello giusto.";
    R.forEach(r=>{const b=document.createElement("button");b.type="button";b.className="btn";b.style.cssText="text-align:left;white-space:normal;line-height:1.35";
      b.textContent=(r.nome||"(nome non disponibile)")+(r.piva?" · P.IVA "+r.piva:"")+(r.indirizzo?" · "+r.indirizzo:"")+" — "+r.fonte;
      b.onclick=()=>applyFound(r);box.appendChild(b)});
  }catch(e){msg.textContent="Ricerca non riuscita: "+(e&&e.message||e)}
  finally{bNome.disabled=false;bNome.textContent="🔎 Cerca"}
}
bNome.onclick=cercaNome;
$("#c_nome").addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();cercaNome()}});
$("#c_piva").addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();$("#bVies").click()}});
refreshClientList();

/* ---------- archivio ---------- */
function saveQuote(silent){
  q.salvato=true;q.aggiornato=new Date().toISOString();
  const i=archive.findIndex(a=>a.id===q.id);const copy=JSON.parse(JSON.stringify(q));
  if(i>=0)archive[i]=copy;else archive.unshift(copy);
  const k=numOf(q.numero);if(k>=n(az.next)){az.next=k+1;store.set("azienda",az);fillCompany()}
  // salva il cliente per riusarlo
  if(q.cliente.nome){const cl=store.get("clienti",[]);const j=cl.findIndex(c=>c.nome.toLowerCase()===q.cliente.nome.toLowerCase());if(j>=0)cl[j]=Object.assign({},q.cliente);else cl.push(Object.assign({},q.cliente));store.set("clienti",cl);refreshClientList()}
  if(store.set("archivio",archive)){store.set("bozza",q);if(!silent)toast("Preventivo "+q.numero+" salvato")}
}
function renderArchive(){
  const s=$("#arcSearch").value.toLowerCase();
  const ft=($("#arcTipo")||{}).value||"",fs=($("#arcStato")||{}).value||"";
  const l=archive.filter(a=>(!s||(a.numero+" "+a.cliente.nome+" "+a.oggetto).toLowerCase().includes(s))&&(!ft||(a.tipo||"lavoro")===ft)&&(!fs||statoOf(a)===fs));
  $("#arcTable").innerHTML=`<tr><th>Numero</th><th>Data</th><th>Stato</th><th>Cliente</th><th>Oggetto</th><th class="num">Totale</th><th></th></tr>`+
   (l.length?l.map(a=>`<tr data-id="${a.id}"><td style="font-family:var(--mono)">${esc(a.numero)}</td><td>${fmtDate(a.data)}</td><td>${statoBadge(a)}${a.ticket?' <span title="Ticket creato">🎫</span>':""}</td><td>${esc(a.cliente.nome)}</td><td><span class="tbadge ${a.tipo==="conn"?"conn":"lav"}">${a.tipo==="conn"?"🌐 Connessione":"🔧 Lavoro"}</span> ${esc(a.oggetto).slice(0,70)}</td><td class="num">${a.tipo==="conn"?(c=>eur.format(c.una)+" una tantum<br>"+eur.format(c.can)+" /mese")(calcConn(a)):eur.format(calc(a).tot)}</td>
   <td style="white-space:nowrap"><button class="btn small" data-a="open">Apri</button> <button class="btn small" data-a="stato">Stato</button> <button class="btn small" data-a="dup">Duplica</button>${LOGOK?' <button class="btn small" data-a="log">Storico</button>':""} <button class="btn small danger" data-a="del">Elimina</button></td></tr>`).join("")
   :`<tr><td colspan="7" class="muted">Nessun preventivo salvato. Compila un preventivo e premi «Salva».</td></tr>`);
}
$("#arcSearch").addEventListener("input",renderArchive);$("#arcTipo").addEventListener("input",renderArchive);$("#arcStato").addEventListener("input",renderArchive);
$("#arcTable").addEventListener("click",e=>{const b=e.target.closest("[data-a]");if(!b)return;const id=b.closest("tr").dataset.id,a=archive.find(x=>x.id===id);
  if(b.dataset.a==="open"){q=normalize(JSON.parse(JSON.stringify(a)));fillForm();show("quote")}
  else if(b.dataset.a==="stato")statoPicker(a);
  else if(b.dataset.a==="log")openLog("prevq",a.id,"Preventivo "+a.numero);
  else if(b.dataset.a==="dup"){q=normalize(JSON.parse(JSON.stringify(a)));q.id=uid();q.numero=nextNumber();q.data=today();q.salvato=false;q.rev="";q.stato="bozza";delete q.statoStoria;delete q.ticket;delete q.inviato;fillForm();show("quote");toast("Copia creata con nuovo numero "+q.numero)}
  else if(b.dataset.a==="del"){confirmBox(`Eliminare il preventivo ${esc(a.numero)}?`,()=>{archive=archive.filter(x=>x.id!==id);store.set("archivio",archive);renderArchive()})}});
$("#bBackup").onclick=()=>{const data=JSON.stringify({azienda:az,listino:catalog,archivio:archive,clienti:store.get("clienti",[])});saveFile("preventivi-backup.json",data,"application/json")};
$("#bRestore").onclick=()=>{modal(`<h3>Ripristina backup</h3><p class="hint">Incolla il testo del backup oppure scegli il file .json.</p><textarea id="rsT" class="inp" rows="8"></textarea>
  <div style="display:flex;gap:6px;justify-content:flex-end;margin-top:10px"><button class="btn" id="rsF">Scegli file</button><button class="btn" data-close>Annulla</button><button class="btn primary" id="rsOk">Ripristina</button></div>`);
  $("#rsF").onclick=()=>{const f=$("#fileCsv");f.accept=".json,application/json";f.value="";f.onchange=()=>{const fr=new FileReader();fr.onload=()=>$("#rsT").value=fr.result;fr.readAsText(f.files[0])};f.click()};
  $("#rsOk").onclick=()=>{try{const d=JSON.parse($("#rsT").value);if(d.azienda)az=Object.assign({},DEF_AZ,d.azienda);if(d.listino)catalog=d.listino;if(d.archivio)archive=d.archivio;
    store.set("azienda",az);store.set("listino",catalog);store.set("archivio",archive);if(d.clienti)store.set("clienti",d.clienti);closeModal();fillCompany();renderArchive();renderSheet();toast("Backup ripristinato")}catch(e){toast("Testo non valido: incolla l'intero contenuto del backup")}}};
$("#bPickClient").onclick=()=>{const cl=store.get("clienti",[]);
  modal(`<h3>Clienti salvati</h3>${cl.length?cl.map((c,i)=>`<div class="picker-item" data-i="${i}"><div><b>${esc(c.nome)}</b><br><span class="muted">${esc(c.piva)} · ${esc(c.legale)}</span></div></div>`).join(""):`<p class="muted">I clienti vengono memorizzati quando salvi un preventivo.</p>`}
   <div style="display:flex;justify-content:flex-end;margin-top:10px"><button class="btn" data-close>Chiudi</button></div>`);
  $(".modal").onclick=e=>{const it=e.target.closest(".picker-item");if(!it)return;q.cliente=Object.assign({},cl[+it.dataset.i]);showClient();closeModal();changed()}};

/* ---------- azienda ---------- */
const AF=["forn","nome","piva","cf","sede","oper","tel","email","web","iban","colore","formato","pref","next","foot","cond","note","pag","iva","ragione","capsoc","pec"];
function fillCompany(){AF.forEach(k=>$("#a_"+k).value=az[k]??"");$("#logoPrev").innerHTML=az.logo?`<img src="${esc(az.logo)}" alt="Logo">`:"Nessun logo";$("#brandAz").textContent=az.nome?"· "+az.nome:""}
AF.forEach(k=>$("#a_"+k).addEventListener("input",e=>{az[k]=e.target.value;store.set("azienda",az);if(k==="forn"&&az.forn==="si"){store.set("listinoFornVer","");applyForn();renderCatalog();toast("Listino fornitori aggiunto")}$("#brandAz").textContent=az.nome?"· "+az.nome:"";renderSheet()}));
$("#bLogo").onclick=()=>{const f=$("#fileLogo");f.value="";f.onchange=async()=>{if(!f.files[0])return;az.logo=await resizeFile(f.files[0],1200);store.set("azienda",az);fillCompany();renderSheet();toast("Logo caricato")};f.click()};
$("#bLogoDel").onclick=()=>{az.logo="";store.set("azienda",az);fillCompany();renderSheet()};

/* ---------- utilità UI ---------- */
function modal(html){$("#modalRoot").innerHTML=`<div class="modal-bg"><div class="modal" role="dialog" aria-modal="true">${html}</div></div>`;
  $("#modalRoot .modal-bg").addEventListener("click",e=>{if(e.target.classList.contains("modal-bg")||e.target.closest("[data-close]"))closeModal()})}
function closeModal(){$("#modalRoot").innerHTML="";pasteHandler=null}
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeModal()});
function confirmBox(msg,ok){modal(`<h3>${msg}</h3><div style="display:flex;gap:6px;justify-content:flex-end"><button class="btn" data-close>Annulla</button><button class="btn primary" id="cfOk">Conferma</button></div>`);$("#cfOk").onclick=()=>{closeModal();ok()}}
let tT;function toast(m){let t=$(".toast");if(!t){t=document.createElement("div");t.className="toast";t.setAttribute("role","status");document.body.appendChild(t)}t.textContent=m;t.hidden=false;clearTimeout(tT);tT=setTimeout(()=>t.hidden=true,2800)}
function saveFile(name,text,type){
  try{const blob=new Blob(["﻿"+text],{type:type+";charset=utf-8"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500)}catch(e){}
  // in alcuni ambienti il download è bloccato: mostra anche il testo da copiare
  modal(`<h3>${esc(name)}</h3><p class="hint">Se il download non è partito, copia il testo e salvalo in un file (anche su Google Drive).</p><textarea class="inp" rows="10" id="sfT" readonly>${esc(text)}</textarea>
   <div style="display:flex;gap:6px;justify-content:flex-end;margin-top:10px"><button class="btn" id="sfC">Copia</button><button class="btn primary" data-close>Fatto</button></div>`);
  $("#sfC").onclick=()=>{const t=$("#sfT");navigator.clipboard?.writeText(t.value).then(()=>toast("Copiato"),()=>{t.select();toast("Testo selezionato: premi Ctrl+C")})||(t.select())};
}
function show(v){$$("#tabs button").forEach(b=>b.classList.toggle("on",b.dataset.v===v));$$(".view").forEach(s=>s.hidden=s.id!=="v-"+v);$("#quoteActions").style.visibility=v==="quote"?"visible":"hidden";
  if(v==="catalog")renderCatalog();if(v==="archive"){renderArchive();reloadArchive()}if(v==="log")loadLog(true)}
$("#tabs").addEventListener("click",e=>{const b=e.target.closest("button");if(b)show(b.dataset.v)});

$("#bSave").onclick=()=>savePdf();
$("#bOpen").onclick=()=>{$("#filePdf").value="";$("#filePdf").click()};
$("#filePdf").addEventListener("change",e=>{const f=e.target.files[0];if(f)openPdf(f)});
$("#bNew").onclick=()=>{modal(`<h3>Nuovo preventivo</h3><p class="hint">Le modifiche non salvate di quello attuale andranno perse. Che tipo di preventivo vuoi fare?</p>
  <div style="display:grid;gap:8px"><button class="btn primary" id="nvLav">🔧 Lavoro: installazione, prodotti e manodopera</button><button class="btn primary" id="nvCon">🌐 Connessione: abbonamento servizi (una tantum + canone mensile)</button><button class="btn" data-close>Annulla</button></div>`);
  const go=tipo=>{closeModal();q=newQuote(false);q.tipo=tipo;normalize(q);store.set("bozza",q);fillForm();toast("Nuovo preventivo "+q.numero)};
  $("#nvLav").onclick=()=>go("lavoro");$("#nvCon").onclick=()=>go("conn")};
$("#bPrint").onclick=()=>{const old=document.title;document.title=`Preventivo ${q.numero} ${q.cliente.nome}`.replace(/[\/\\:]/g,"-");window.print();setTimeout(()=>document.title=old,1000)};

