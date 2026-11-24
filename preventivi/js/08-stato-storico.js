/* Preventivi · Stato del preventivo, ticket, invio per email, storico modifiche, avvio.
   I file in questa cartella si caricano in ordine (vedi boot.js) e condividono le stesse variabili. */
"use strict";
/* ---------- stato, ticket, invio per email, storico, modifiche di altri admin ---------- */
const REMOTE=!!store.remote,LOGOK=REMOTE;
const nowIso=()=>new Date().toISOString();
const fmtDT=iso=>{try{return new Date(iso).toLocaleString("it-IT",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"})}catch(e){return String(iso||"")}};
function statoBadge(a){const s=statoOf(a);return `<span class="sbadge ${s}">${STATI[s]}</span>`}
if(LOGOK)$("#tabLog").hidden=false;

/* un altro admin ha cambiato listino, clienti o dati azienda: le modifiche sono state unite */
window.PREV_ON_REMOTE=(k,v,conf)=>{
  if(k==="listino"){catalog=v;if(!$("#v-catalog").hidden)renderCatalog()}
  else if(k==="clienti")refreshClientList();
  else if(k==="azienda"){az=Object.assign({},DEF_AZ,v);if(az.forn!=="si"&&az.forn!=="no")az.forn=store.get("listinoFornVer","")?"si":"no";fillCompany();renderSheet()}
  const what={listino:"listino",clienti:"anagrafica clienti",azienda:"dati azienda"}[k]||k;
  toast(conf&&conf.length?`Un altro admin aveva cambiato le stesse voci del ${what}: ho tenuto le tue. Le sue restano nello Storico.`:`Ho unito le modifiche fatte da un altro admin al ${what}`)};

/* --- stato --- */
function setStato(a,s,extra){if(!STATI[s]||s==="scaduto")return;const was=a.stato||"bozza";if(was!==s){a.stato=s;(a.statoStoria=a.statoStoria||[]).push({s,at:nowIso()})}if(extra)Object.assign(a,extra)}
// cambia stato a un preventivo dell'archivio senza toccare le modifiche non salvate di quello aperto
function applyStato(id,s,extra){
  const a=archive.find(x=>x.id===id);
  if(a){setStato(a,s,extra);a.aggiornato=nowIso();store.set("archivio",archive)}
  if(q.id===id){setStato(q,s,extra);store.set("bozza",q);fillStato()}
  if(!$("#v-archive").hidden)renderArchive()}
function fillStato(){
  const sel=$("#q_stato");if(!sel)return;sel.value=STATI[q.stato]?q.stato:"bozza";
  const st=statoOf(q),sc=scadenzaOf(q),last=(q.statoStoria||[]).slice(-1)[0];let t="";
  if(st==="scaduto")t="⌛ Scaduto il "+fmtDate(sc);
  else if(last&&last.s===q.stato)t="dal "+fmtDT(last.at);
  if((q.stato==="bozza"||q.stato==="inviato")&&sc&&st!=="scaduto")t+=(t?" · ":"")+"valido fino al "+fmtDate(sc);
  if(q.inviato&&q.inviato.at)t+=(t?" · ":"")+"inviato "+fmtDT(q.inviato.at)+(q.inviato.a?" a "+q.inviato.a:"");
  $("#statoInfo").textContent=t;
  const bt=$("#bTicket");bt.hidden=!(REMOTE&&q.stato==="accettato");bt.textContent=q.ticket?"🎫 Ticket creato":"🎫 Crea ticket"}
$("#q_stato").addEventListener("change",e=>{const v=e.target.value;setStato(q,v);saveQuote(true);fillStato();
  if(v==="accettato"&&REMOTE&&!q.ticket)toast("Accettato! Ora puoi creare il ticket per il lavoro")});
$("#bTicket").onclick=()=>{if(!q.salvato)saveQuote(true);ticketModal(archive.find(x=>x.id===q.id)||q)};
function statoPicker(a){
  modal(`<h3>Stato del preventivo ${esc(a.numero)}</h3><p class="hint">${esc(a.cliente.nome||"")} · ora: ${statoBadge(a)}</p>
   <div style="display:grid;gap:8px;margin-top:8px">${["bozza","inviato","accettato","rifiutato"].map(s=>`<button class="btn${(a.stato||"bozza")===s?" primary":""}" data-s="${s}">${STATI[s]}</button>`).join("")}
   ${REMOTE&&a.stato==="accettato"?`<button class="btn" id="spTix">${a.ticket?"🎫 Ticket già creato: creane un altro":"🎫 Crea ticket"}</button>`:""}
   <button class="btn" data-close>Chiudi</button></div>`);
  $$(".modal [data-s]").forEach(b=>b.onclick=()=>{const s=b.dataset.s;closeModal();applyStato(a.id,s);toast(`Preventivo ${a.numero}: ${STATI[s]}`);
    if(s==="accettato"&&REMOTE&&!a.ticket)setTimeout(()=>statoPicker(a),50)});
  const t=$("#spTix");if(t)t.onclick=()=>ticketModal(a)}

/* --- dal preventivo al ticket --- */
let TEAM=null;
async function loadTeam(){
  if(TEAM)return TEAM;
  const [p,g]=await Promise.all([store.sb.from("profiles").select("id,name,email,active,role"),store.sb.from("docs").select("id,data").eq("coll","groups")]);
  if(p.error)throw p.error;
  TEAM={users:(p.data||[]).filter(u=>u.active!==false).sort((x,y)=>(x.name||x.email).localeCompare(y.name||y.email)),groups:((g&&g.data)||[]).map(d=>Object.assign({},d.data,{id:d.id})).sort((x,y)=>String(x.name||"").localeCompare(String(y.name||"")))};
  return TEAM}
function ticketDesc(a){
  const c=a.cliente||{},L=[`Preventivo ${a.numero} del ${fmtDate(a.data)}`+(a.oggetto?` – ${a.oggetto}`:""),"",`Cliente: ${c.nome||""}`];
  const sede=c.esecutiva||cliSede(c);if(sede)L.push(`Indirizzo: ${sede}`);if(c.ref)L.push(`Referente: ${c.ref}`);if(c.tel)L.push(`Telefono: ${c.tel}`);
  const rows=a.tipo==="conn"?(a.conn||[]).filter(r=>r.titolo).map(r=>`- ${num.format(n(r.qta)||1)} × ${r.titolo}`):(a.righe||[]).map(r=>`- ${num.format(n(r.qta))} ${r.um||""} ${lbl(r)}`.replace(/\s+/g," "));
  if(rows.length)L.push("",a.tipo==="conn"?"Servizi:":"Lavori e materiali:",...rows);
  if(a.tempi)L.push("","Tempi: "+a.tempi);
  return L.join("\n")}
/* materiale previsto per il ticket: le voci del preventivo tranne la manodopera (il tecnico lo conferma alla chiusura) */
function ticketMat(a){
  if(a.tipo==="conn")return[];
  return(a.righe||[]).filter(r=>r.cat!=="man"&&n(r.qta)>0&&lbl(r)!=="Voce").map(r=>{const o={d:lbl(r),q:(num.format(n(r.qta))+" "+(r.um&&r.um!=="pz"?r.um:"")).trim()};if(r.codice)o.c=r.codice;return o})}
async function ticketModal(a){
  if(!REMOTE)return toast("I ticket si creano solo con l'accesso all'app");
  let T;try{T=await loadTeam()}catch(e){return toast("Non riesco a leggere il team: "+(e.message||e))}
  const c=a.cliente||{},title=((c.nome||"Cliente")+" – "+(a.oggetto||"preventivo "+a.numero)).replace(/\s+/g," ").slice(0,110);
  const opt=(v,l,sel)=>`<option value="${v}"${sel?" selected":""}>${l}</option>`;
  modal(`<h3>🎫 Nuovo ticket dal preventivo ${esc(a.numero)}</h3>
   ${a.ticket?`<p class="hint">Per questo preventivo hai già creato un ticket il ${fmtDT(a.ticket.at)}.</p>`:""}
   <div class="grid">
    <label class="f full">Titolo<input id="tkT" value="${esc(title)}"></label>
    <label class="f full">Descrizione<textarea id="tkD" rows="8">${esc(ticketDesc(a))}</textarea></label>
    <label class="f">Data intervento<input id="tkDue" type="date"></label>
    <label class="f">Ora<input id="tkTime" type="time"></label>
    <label class="f">Durata<select id="tkDur">${opt(30,"30 minuti")}${opt(60,"1 ora",1)}${opt(90,"1 ora e 30")}${opt(120,"2 ore")}${opt(180,"3 ore")}${opt(240,"4 ore")}</select></label>
    <label class="f">Urgenza<select id="tkPr">${opt("urgente","Urgente")}${opt("alta","Alta")}${opt("normale","Normale",1)}${opt("bassa","Bassa")}</select></label>
    <div class="full" style="font-size:12px;color:var(--muted)">Assegna a
     <div style="display:flex;flex-wrap:wrap;gap:4px 14px;margin-top:4px;color:var(--ink);font-size:13.5px">
      ${T.groups.map(g=>`<label><input type="checkbox" data-g="${esc(g.id)}"> 👥 ${esc(g.name||"Gruppo")}</label>`).join("")}
      ${T.users.map(u=>`<label><input type="checkbox" data-u="${esc(u.id)}"> ${esc(u.name||u.email)}</label>`).join("")}
     </div></div>
   </div>
   <div style="display:flex;gap:6px;justify-content:flex-end;margin-top:12px"><button class="btn" data-close>Annulla</button><button class="btn primary" id="tkOk">Crea ticket</button></div>`);
  $("#tkOk").onclick=async()=>{
    const t=$("#tkT").value.trim();if(!t)return toast("Inserisci un titolo");
    const au=$$(".modal [data-u]").filter(x=>x.checked).map(x=>x.dataset.u),ag=$$(".modal [data-g]").filter(x=>x.checked).map(x=>x.dataset.g);
    const set=new Set(au);ag.forEach(id=>{const g=T.groups.find(x=>x.id===id);(g&&g.members||[]).forEach(m=>{if(T.users.some(u=>u.id===m))set.add(m)})});
    const data={title:t,desc:$("#tkD").value,due:$("#tkDue").value,status:"Fare",photo:"",time:$("#tkTime").value,dur:+$("#tkDur").value,rem:60,prio:$("#tkPr").value,doneAt:0,
      assignUsers:au,groups:ag,gnames:ag.map(id=>(T.groups.find(x=>x.id===id)||{}).name).filter(Boolean),assignees:[...set],
      uid:store.uid,created:Date.now(),preventivo:{id:a.id,numero:a.numero},matPrev:ticketMat(a)};
    const id=(crypto.randomUUID&&crypto.randomUUID())||uid()+uid(),b=$("#tkOk");b.disabled=true;b.textContent="Creo…";
    const r=await store.sb.from("docs").insert({coll:"tix",id,data});
    if(r.error){b.disabled=false;b.textContent="Crea ticket";return toast("Ticket non creato: "+r.error.message)}
    closeModal();applyStato(a.id,"accettato",{ticket:{id,at:nowIso(),title:t}});
    toast(set.size?`Ticket creato e assegnato (${set.size} ${set.size===1?"persona":"persone"} avvisate)`:"Ticket creato: lo trovi nell'app, sezione Ticket")}}

/* --- invio per email: gratis, con le app di posta del dispositivo --- */
const canShareFiles=(()=>{try{return !!(navigator.canShare&&navigator.share&&navigator.canShare({files:[new File(["x"],"p.pdf",{type:"application/pdf"})]}))}catch(e){return false}})();
$("#bMail").onclick=async()=>{
  saveQuote(true);
  const c=q.cliente||{},sub=`Preventivo n. ${q.numero}${q.oggetto?" – "+q.oggetto.split("\n")[0]:""}`.slice(0,150);
  const body=`Gentile ${c.ref||c.nome||"cliente"},\n\nin allegato il nostro preventivo n. ${q.numero} del ${fmtDate(q.data)}${q.oggetto?" relativo a: "+q.oggetto.replace(/\s+/g," "):""}.\n${n(q.validita)?`L'offerta è valida ${n(q.validita)} giorni.\n`:""}\nRestiamo a disposizione per qualsiasi chiarimento.\n\nCordiali saluti\n${az.nome||""}${az.tel?"\n"+az.tel:""}${az.email?"\n"+az.email:""}`;
  modal(`<h3>✉️ Invia il preventivo ${esc(q.numero)}</h3>
   <div class="grid">
    <label class="f full">A (email del cliente)<input id="mTo" type="email" value="${esc(c.email||"")}" placeholder="nome@cliente.it"></label>
    <label class="f full">Oggetto<input id="mSub" value="${esc(sub)}"></label>
    <label class="f full">Testo<textarea id="mBody" rows="9">${esc(body)}</textarea></label>
   </div>
   <p class="hint" id="mSt">Preparo il PDF…</p>
   <div style="display:grid;gap:8px;margin-top:10px">
    ${canShareFiles?`<button class="btn primary" id="mShare" disabled>📤 Condividi il PDF (Gmail, Outlook, WhatsApp…)</button>`:""}
    <button class="btn${canShareFiles?"":" primary"}" id="mMail" disabled>✉️ Apri il programma di posta${canShareFiles?"":" (il PDF si scarica: trascinalo nella email)"}</button>
    <button class="btn" data-close>Annulla</button></div>`);
  let blob=null;
  try{blob=await makePdf();$("#mSt")&&($("#mSt").textContent=canShareFiles?"PDF pronto. «Condividi» lo allega da solo; con «Apri il programma di posta» il PDF si scarica e va allegato a mano.":"PDF pronto. Il programma di posta si apre con testo già scritto: il PDF si scarica e va trascinato nella email (un link email non può allegare file da solo).")}
  catch(e){console.error(e);if($("#mSt"))$("#mSt").textContent="PDF non creato: usa «Salva PDF» e allegalo a mano.";}
  if(!$("#mMail"))return;   // finestra chiusa nel frattempo
  const sent=via=>{const to=$("#mTo").value.trim();closeModal();
    applyStato(q.id,q.stato==="bozza"||!q.stato?"inviato":q.stato,{inviato:{at:nowIso(),a:to,via}});
    toast(q.stato==="inviato"?"Preventivo segnato come Inviato":"Invio registrato")};
  $("#mMail").disabled=false;
  $("#mMail").onclick=()=>{
    if(blob){const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=fileName();document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},4000)}
    const to=$("#mTo").value.trim(),u=`mailto:${encodeURIComponent(to).replace(/%40/g,"@")}?subject=${encodeURIComponent($("#mSub").value)}&body=${encodeURIComponent($("#mBody").value)}`;
    setTimeout(()=>{location.href=u},blob?600:0);sent("email")};
  const sh=$("#mShare");if(sh&&blob){sh.disabled=false;sh.onclick=async()=>{
    try{await navigator.share({files:[new File([blob],fileName(),{type:"application/pdf"})],title:$("#mSub").value,text:$("#mBody").value});sent("condivisione")}
    catch(e){if(e&&e.name!=="AbortError")toast("Condivisione non riuscita: usa «Apri il programma di posta»")}}}
};

/* --- archivio aggiornato con i preventivi e gli stati cambiati da altri admin --- */
let arcT=0;
async function reloadArchive(){if(!store.reloadArchive||Date.now()-arcT<20000)return;arcT=Date.now();
  try{archive=await store.reloadArchive();if(!$("#v-archive").hidden)renderArchive()}catch(e){console.warn(e)}}

/* --- storico modifiche (tabella prev_log, scritta dal database) --- */
const FL={numero:"Numero",data:"Data",validita:"Validità (giorni)",rev:"Revisione",oggetto:"Oggetto",stato:"Stato",tipo:"Tipo",righe:"Riga",conn:"Servizio",voip:"Tariffa VoIP",
  sconto:"Sconto",scontoTipo:"Tipo sconto",iva:"IVA %",arr:"Arrotondamento",note:"Note",pag:"Pagamento",tempi:"Tempi",cond:"Condizioni",cliente:"Cliente",titoloTab:"Titolo tabella",
  nome:"Nome",piva:"P.IVA",cf:"Cod. fiscale",legale:"Sede legale",esecutiva:"Sede esecutiva",ref:"Referente",tel:"Telefono",email:"Email",sdi:"SDI",pec:"PEC",
  prezzo:"Prezzo",qta:"Quantità",titolo:"Titolo",descr:"Descrizione",codice:"Codice",um:"Unità",pers:"Persone",omaggio:"Omaggio",costo:"Costo",img:"Foto",link:"Link",cat:"Categoria",
  una:"Una tantum",can:"Canone",label:"Voce",dett:"Dettaglio",ticket:"Ticket",logo:"Logo",next:"Prossimo numero",pref:"Prefisso",sede:"Sede",web:"Sito",iban:"IBAN",ragione:"Ragione sociale",
  _listino:"Voce del listino",_clienti:"Cliente",layout:"Modello",show:"Mostra",showImg:"Foto nel PDF",showListino:"Prezzi di listino",dataTab:"Data in tabella",totIva:"Totale IVA"};
const LOG_SKIP=new Set(["statoStoria","salvato","aggiornato","inviato","listinoFornVer","id"]);
const fv=(k,v)=>{if(v==null||v==="")return"(vuoto)";if(k==="stato")return STATI[v]||v;if(/^\d{4}-\d\d-\d\d$/.test(v))return fmtDate(v);if(typeof v==="boolean")return v?"sì":"no";
  if(typeof v==="object")return k==="ticket"?"creato":"…";const s=String(v).replace(/\s+/g," ");return s.length>70?s.slice(0,69)+"…":s};
const FEM=/(Riga|Voce|Tariffa)$/;
const itemName=x=>x?String(x.nome||x.label||lbl(x)||""):"";
function diffLines(d,path,out){
  Object.keys(d||{}).forEach(k=>{if(LOG_SKIP.has(k))return;const v=d[k],L=(path?path+" · ":"")+(FL[k]||k);
    if(v&&Array.isArray(v["~"])){const[a,b]=v["~"];
      if(a==="ordine"&&b==="ordine")out.push(`${esc(L)}: cambiato l'ordine`);else if(k==="img"||k==="logo")out.push(`${esc(L)}: cambiata`);
      else out.push(`${esc(L)}: ${esc(fv(k,a))} → <b>${esc(fv(k,b))}</b>`)}
    else if(v&&Array.isArray(v["#"]))v["#"].forEach(it=>{const nm=esc(itemName(it.to||it.from)||it.k);
      if(!it.from)out.push(`➕ ${esc(L)} «${nm}» aggiunta`.replace(/a$/,FEM.test(L)?"a":"o"));else if(!it.to)out.push(`➖ ${esc(L)} «${nm}» tolt`+(FEM.test(L)?"a":"o"));
      else{const ch=Object.keys(Object.assign({},it.from,it.to)).filter(f=>f!=="id"&&JSON.stringify(it.from[f])!==JSON.stringify(it.to[f]));
        out.push(`${esc(L)} «${nm}»: `+(ch.length?ch.map(f=>`${esc(FL[f]||f)} ${esc(fv(f,it.from[f]))} → <b>${esc(fv(f,it.to[f]))}</b>`).join(", "):"cambiata la foto"))}});
    else if(v&&typeof v==="object")diffLines(v,L,out)});
  return out}
const LOG={coll:"",doc:"",label:"",from:0,users:null,rows:{}};
function openLog(coll,doc,label){LOG.doc=doc||"";LOG.label=label||"";$("#logFilter").value=coll==="prevq"?"prevq":"";show("log")}
function logItem(e){
  LOG.rows[e.id]=e;
  const who=e.by_user?(LOG.users[e.by_user]||"utente non più presente"):"sistema",i=e.info||{};
  let what,lines;
  if(e.coll==="prevq"){what=`Preventivo <b>${esc(i.numero||"")}</b>${i.cliente?" · "+esc(i.cliente):""}`;
    lines=e.action==="insert"?["creato"]:e.action==="delete"?[`eliminato <button class="btn small" data-rest="${e.id}">Recupera</button>`]:diffLines(e.changes,"",[])}
  else{what=`<b>${{listino:"Listino",clienti:"Clienti",azienda:"Dati azienda"}[e.doc_id]||esc(e.doc_id)}</b>`;
    const d=e.changes&&e.changes.v;
    lines=e.action!=="update"?[e.action==="insert"?"creato":"eliminato"]:d&&(d["#"]||d["~"])&&e.doc_id!=="azienda"?diffLines({["_"+e.doc_id]:d},"",[]):diffLines(d,"",[])}
  if(!lines.length)lines=["nessuna differenza visibile"];
  const more=lines.length>15?`<li class="muted">… e altre ${lines.length-15} modifiche</li>`:"";
  return `<div class="log-item"><div class="log-head"><span class="muted" style="font-family:var(--mono);font-size:12.5px">${fmtDT(e.at)}</span><span>👤 ${esc(who)}</span><span>${what}</span></div><ul>${lines.slice(0,15).map(l=>`<li>${l}</li>`).join("")}${more}</ul></div>`}
async function loadLog(reset){
  if(!LOGOK)return;const box=$("#logList");if(reset){LOG.from=0;LOG.rows={};box.innerHTML='<p class="muted">Carico…</p>'}
  $("#logDoc").innerHTML=LOG.doc?`<span class="sbadge">${esc(LOG.label)}</span> <button class="btn small" id="logAll">Mostra tutto</button>`:"";
  if(LOG.doc)$("#logAll").onclick=()=>{LOG.doc="";loadLog(true)};
  try{
    if(!LOG.users){const r=await store.sb.from("profiles").select("id,name,email");LOG.users={};(r.data||[]).forEach(u=>LOG.users[u.id]=u.name||u.email)}
    const f=$("#logFilter").value;let qy=store.sb.from("prev_log").select("*").order("at",{ascending:false}).order("id",{ascending:false}).range(LOG.from,LOG.from+49);
    if(LOG.doc)qy=qy.eq("coll","prevq").eq("doc_id",LOG.doc);else if(f==="prevq")qy=qy.eq("coll","prevq");else if(f)qy=qy.eq("coll","prev").eq("doc_id",f);
    const r=await qy;if(r.error)throw r.error;
    if(reset)box.innerHTML=r.data.length?"":'<p class="muted">Nessuna modifica registrata finora.</p>';
    r.data.forEach(e=>box.insertAdjacentHTML("beforeend",logItem(e)));
    LOG.from+=r.data.length;$("#logMore").hidden=r.data.length<50;
  }catch(e){const m=String(e&&e.message||e);box.innerHTML=`<p class="muted">${/prev_log/.test(m)?"Lo storico non è ancora attivo: va eseguito su Supabase il file SQL del passo 3 (step3-preventivi.sql).":"Storico non disponibile: "+esc(m)}</p>`}}
$("#logFilter").addEventListener("change",()=>{LOG.doc="";loadLog(true)});
$("#logReload").onclick=()=>loadLog(true);$("#logMore").onclick=()=>loadLog(false);
// un preventivo eliminato si può recuperare dallo storico (senza le immagini, che non vengono conservate)
$("#logList").addEventListener("click",e=>{const b=e.target.closest("[data-rest]");if(!b)return;const row=LOG.rows[b.dataset.rest];if(!row||!row.changes)return;
  const d=JSON.parse(JSON.stringify(row.changes,(k,v)=>v==="[immagine]"?"":v));
  if(archive.some(a=>a.id===d.id))return toast("Questo preventivo è già nell'archivio");
  confirmBox(`Recuperare il preventivo ${esc(d.numero||"")}? Torna nell'archivio senza le immagini.`,()=>{normalize(d);d.salvato=true;d.aggiornato=nowIso();archive.unshift(d);store.set("archivio",archive);toast("Preventivo "+d.numero+" recuperato: lo trovi nell'Archivio")})});

fillCompany();fillForm();
