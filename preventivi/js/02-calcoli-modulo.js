/* Preventivi · Calcoli dei totali, collegamento del modulo, preventivo «Connessione».
   I file in questa cartella si caricano in ordine (vedi boot.js) e condividono le stesse variabili. */
"use strict";
/* ---------- calcoli ---------- */
function calc(qq){
  const rows=qq.righe.map(r=>{const lordo=r2(n(r.prezzo)*n(r.qta)*(r.cat==="man"?(n(r.pers)||1):1));const netto=r.omaggio?0:r2(lordo*(1-Math.min(100,n(r.sconto))/100));return{r,lordo,netto}});
  const sub={mat:0,man:0,acc:0};rows.forEach(x=>sub[x.r.cat]=r2((sub[x.r.cat]||0)+x.netto));
  const listino=r2(rows.reduce((a,x)=>a+x.lordo,0));
  const subtot=r2(rows.reduce((a,x)=>a+x.netto,0));
  let sc=qq.scontoTipo==="%"?r2(subtot*Math.min(100,n(qq.sconto))/100):Math.min(subtot,r2(n(qq.sconto)));
  let imp=r2(subtot-sc);
  const iva=n(qq.iva);
  let tot=r2(imp*(1+iva/100));
  const step=n(qq.arr);let arr=0;
  if(step>0&&tot>0){const t2=Math.floor(tot/step)*step;arr=r2(t2-tot);
    // l'arrotondamento è un ulteriore sconto: ricalcola imponibile e IVA a ritroso
    imp=r2(t2/(1+iva/100));sc=r2(subtot-imp);tot=t2;}
  const ivaV=r2(tot-imp);
  return{rows,sub,listino,subtot,sc,imp,ivaV,tot,arr,risparmio:r2(listino-imp)};
}

/* ---------- binding form preventivo ---------- */
const QF=["tipo","connFinale","voipTitolo","connNote","connDurata","numero","data","validita","rev","oggetto","titoloTab","layout","totIva","sconto","scontoTipo","iva","arr","show","note","pag","tempi","cond"];
const CF=["nome","piva","cf","legale","esecutiva","ref","tel","email","sdi"];
function fillForm(){
  QF.forEach(k=>$("#q_"+k).value=q[k]??"");
  CF.forEach(k=>$("#c_"+k).value=q.cliente[k]??"");
  $("#q_showImg").checked=!!q.showImg;$("#q_showListino").checked=!!q.showListino;$("#q_dataTab").checked=!!q.dataTab;
  applyTipo();renderRows();renderConnRows();renderSheet();fillStato();
}
QF.forEach(k=>$("#q_"+k).addEventListener("input",e=>{q[k]=e.target.value;changed()}));
CF.forEach(k=>$("#c_"+k).addEventListener("input",e=>{q.cliente[k]=e.target.value;changed()}));
$("#q_showImg").addEventListener("change",e=>{q.showImg=e.target.checked;changed()});
$("#q_dataTab").addEventListener("change",e=>{q.dataTab=e.target.checked;changed()});
$("#q_showListino").addEventListener("change",e=>{q.showListino=e.target.checked;changed()});

let saveT;
function changed(rerenderRows){if(rerenderRows)renderRows();else updateRowTotals();renderSheet();clearTimeout(saveT);saveT=setTimeout(()=>store.set("bozza",q),300)}

/* ---------- preventivo "Connessione" (abbonamento servizi) ---------- */
const DEF_VOIP=()=>[["FISSI NAZIONALI",0.04],["MOBILI NAZIONALI",0.08],["RESTO DEL MONDO",0.35]].map(([label,prezzo])=>({id:uid(),label,prezzo}));
const voipDefault=()=>Array.isArray(az.voip)&&az.voip.length?az.voip.map(r=>({id:uid(),label:r.label,prezzo:r.prezzo})):DEF_VOIP();
const blankConn=()=>({id:uid(),titolo:"",dett:"",qta:1,una:0,can:0});
const blankVoip=()=>({id:uid(),label:"",prezzo:0});
function applyTipo(){
  document.body.classList.toggle("tconn",q.tipo==="conn");
  if(q.tipo==="conn"){if(!q.conn.length)q.conn.push(blankConn());if(!q.voip.length&&!q.voipOff)q.voip=voipDefault();
    if(!q.oggetto)q.oggetto="Proposta di abbonamento servizi di telecomunicazioni";$("#q_oggetto").value=q.oggetto}
}
function calcConn(qq){let una=0,can=0;(qq.conn||[]).forEach(r=>{una+=n(r.una)*n(r.qta);can+=n(r.can)*n(r.qta)});return{una:r2(una),can:r2(can)}}
function renderConnRows(){
  const box=$("#connRows");if(!box)return;
  box.innerHTML=q.conn.map((r,i)=>`<div class="row-card" data-i="${i}"><div class="row-fields" style="grid-column:1/-1">
    <textarea class="inp c4" data-k="titolo" rows="2" placeholder="Servizio / prodotto (anche su più righe)">${esc(r.titolo)}</textarea>
    <textarea class="inp c2" data-k="dett" rows="2" placeholder="Dettaglio piccolo a lato (facoltativo)">${esc(r.dett)}</textarea>
    <label class="f">Q.tà<input class="inp" data-k="qta" type="number" step="any" min="0" value="${esc(r.qta)}"></label>
    <label class="f c2">Una tantum €<input class="inp" data-k="una" type="number" step="0.01" min="0" value="${esc(r.una)}"></label>
    <label class="f c2">Canone mensile €<input class="inp" data-k="can" type="number" step="0.01" min="0" value="${esc(r.can)}"></label>
    <div class="row-tools"><button class="btn small" data-act="up">↑</button><button class="btn small" data-act="down">↓</button><button class="btn small" data-act="dup">Duplica</button><button class="btn small danger" data-act="del">Elimina</button></div>
  </div></div>`).join("")||`<div class="empty">Nessun servizio.</div>`;
  const t=calcConn(q);$("#connTot").innerHTML=`Totale una tantum <b>${eur.format(t.una)}</b> · canone mensile <b>${eur.format(t.can)}</b> (IVA esclusa)`;
  const vb=$("#voipRows");vb.innerHTML=q.voip.map((r,i)=>`<div class="row-card" data-i="${i}"><div class="row-fields" style="grid-column:1/-1">
    <input class="inp c4" data-k="label" value="${esc(r.label)}" placeholder="Destinazione (es. RESTO DEL MONDO)">
    <label class="f c2">Tariffa € / min<input class="inp" data-k="prezzo" type="number" step="0.001" min="0" value="${esc(r.prezzo)}"></label>
    <div class="row-tools"><button class="btn small" data-act="up">↑</button><button class="btn small" data-act="down">↓</button><button class="btn small danger" data-act="del">Elimina</button></div></div></div>`).join("")||`<div class="empty">Nessuna tariffa: la tabella VoIP non verrà mostrata.</div>`;
}
function listEditor(box,key,blank,after){
  box.addEventListener("input",e=>{const card=e.target.closest(".row-card"),k=e.target.dataset.k;if(!card||!k)return;q[key][+card.dataset.i][k]=e.target.value;
    const t=calcConn(q);$("#connTot").innerHTML=`Totale una tantum <b>${eur.format(t.una)}</b> · canone mensile <b>${eur.format(t.can)}</b> (IVA esclusa)`;changed()});
  box.addEventListener("click",e=>{const b=e.target.closest("[data-act]");if(!b)return;const L=q[key],i=+b.closest(".row-card").dataset.i,act=b.dataset.act;
    if(act==="del")L.splice(i,1);else if(act==="dup")L.splice(i+1,0,Object.assign({},L[i],{id:uid()}));
    else{const t=i+(act==="up"?-1:1);if(t<0||t>=L.length)return;[L[i],L[t]]=[L[t],L[i]]}
    if(key==="voip")q.voipOff=!q.voip.length;
    renderConnRows();changed()})
}
listEditor($("#connRows"),"conn");listEditor($("#voipRows"),"voip");
$("#bConnAdd").onclick=()=>{q.conn.push(blankConn());renderConnRows();changed()};
$("#bVoipSave").onclick=()=>{az.voip=q.voip.map(r=>({label:r.label,prezzo:r.prezzo}));store.set("azienda",az);toast("Listino VoIP salvato: sarà proposto nei nuovi preventivi di connessione")};
$("#bVoipAdd").onclick=()=>{q.voipOff=false;q.voip.push(blankVoip());renderConnRows();changed()};
$("#q_tipo").addEventListener("input",()=>{applyTipo();renderConnRows();changed()});

