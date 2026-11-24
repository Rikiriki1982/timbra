/* Preventivi · Documento A4 (anteprima e stampa).
   I file in questa cartella si caricano in ordine (vedi boot.js) e condividono le stesse variabili. */
"use strict";
/* ---------- documento A4 ---------- */
const eurP=v=>"€ "+eur.format(v).replace(/\s?€/,"").trim();
function lmDesc(r){
  const head=r.codice&&r.titolo?`<b>${esc(r.codice)}</b> - ${esc(r.titolo)}`:r.codice?`<b>${esc(r.codice)}</b>`:r.titolo?`<b>${esc(r.titolo)}</b>`:"";
  const lines=String(r.descr||"").split("\n").map(x=>x.replace(/^\s*[-•*]\s*/,"").trim()).filter(Boolean);
  let h=head?`<div class="ln">${head}</div>`:"";
  if(lines.length>1||(!head&&lines.length))h+=`<ul>${lines.map(l=>`<li>-&nbsp;&nbsp;&nbsp;&nbsp;${esc(l)}</li>`).join("")}</ul>`;
  else if(lines.length)h+=`<div class="sub">${esc(lines[0])}</div>`;
  return h||"<span style='color:#999'>Voce senza descrizione</span>";
}
function lmPrice(x){
  const r=x.r,pz=eurP(n(r.prezzo)),qt=n(r.qta),pers=n(r.pers)||1,um=String(r.um||"").trim().toLowerCase();
  let h;
  if(r.cat==="man"||um==="h"||um==="ore"){h=`${pz} x ${um==="h"||um==="ore"?"ore ":(um&&um!=="pz"?um+" ":"")}${num.format(qt)}`;if(r.cat==="man"&&pers>1)h+=`<br>${pers} tecnici`}
  else h=qt!==1?`${pz} x${num.format(qt)}`:pz;
  if(!r.omaggio&&n(r.sconto)>0)h+=`<br><span style="color:#a15c00">sconto ${num.format(n(r.sconto))}%</span>`;
  return h;
}
/* sede legale del cliente con CAP e provincia (senza ripeterli se sono già scritti nell'indirizzo) */
function cliSede(cl){
  let s=String(cl.legale||"").trim();const cap=String(cl.cap||"").trim(),pr=String(cl.prov||"").replace(/[^a-z]/gi,"").toUpperCase();
  if(cap&&!s.includes(cap)){const i=s.lastIndexOf(",");s=i>=0?`${s.slice(0,i+1)} ${cap} ${s.slice(i+1).trim()}`.trim():(s?s+", ":"")+cap}
  if(pr&&!new RegExp("\\(\\s*"+pr+"\\s*\\)|\\b"+pr+"$","i").test(s))s+=(s?" ":"")+`(${pr})`;
  return s;
}
/* codice SDI nel documento solo se è spuntato «visibile» */
const cliSdi=cl=>cl.sdi&&cl.sdiVis?`<br>Cod. SDI ${esc(cl.sdi)}`:"";
const pgFootHtml=()=>{if(!hasFoot())return "";const f=footLines(),row=a=>a.map(([l,v])=>`<div>${l?`<b>${l}</b>`:""}${esc(v)}</div>`).join("");
  return `<div class="pgsp"></div><div class="pgfoot" style="--ft-line:${esc(footRgb())}"><div class="pfh"><span class="pfn">${esc(f.name)}</span><span class="pfp">1</span></div><div class="pfc"><div>${row(f.L)}</div><div class="pfr">${row(f.R)}</div></div></div>`};
function renderConn(){
  const cl=q.cliente,t=calcConn(q),anyDett=q.conn.some(r=>String(r.dett||"").trim());
  const nl=s=>esc(s).replace(/\n/g,"<br>");
  const rows=q.conn.map(r=>`<tr class="it">${anyDett?(String(r.dett||"").trim()?`<td class="ds">${nl(r.titolo)}</td><td class="dt">${nl(r.dett)}</td>`:`<td class="ds" colspan="2">${nl(r.titolo)}</td>`):`<td class="ds">${nl(r.titolo)}</td>`}
    <td class="cq">${num.format(n(r.qta))}</td><td class="cq">${eurP(n(r.una))}</td><td class="cq">${eurP(n(r.can))}</td></tr>`).join("")||`<tr><td colspan="4" style="text-align:center;color:#999">Aggiungi i servizi del preventivo</td></tr>`;
  const eurV=v=>"€ "+new Intl.NumberFormat("it-IT",{minimumFractionDigits:2,maximumFractionDigits:3}).format(v);
  const voip=q.voip.length?`<table class="cn" style="margin-top:7mm"><tr><td class="hd2" colspan="2">${esc(q.voipTitolo)}</td></tr>${q.voip.map(r=>`<tr><td class="ds">${esc(r.label)}</td><td class="cq" style="width:28mm">${eurV(n(r.prezzo))}</td></tr>`).join("")}</table>`:"";
  const note=[q.connNote,q.connDurata].filter(x=>String(x||"").trim());
  $("#sheet").innerHTML=`<div class="lm" style="--lm-col:${esc(az.colore||"#a4c2f4")}">
   <div class="lh"><div>${az.logo?`<img src="${esc(az.logo)}" alt="Logo">`:`<b style="font-size:16pt">${esc(az.nome)}</b>`}</div><div class="web">${esc(az.web)}</div></div>
   <div class="lp">
    <div class="ogg">OGGETTO:<br>${esc(q.oggetto)}</div>
    <div class="cli"><div class="cn">Spett. ${esc(cl.nome)}${cl.piva?`<br>p.iva ${esc(cl.piva)}`:""}</div>
     <div class="ca">${esc(cliSede(cl))}${cl.esecutiva?`<br>Sede esecutiva: ${esc(cl.esecutiva)}`:""}${cl.cf?`<br>C.F. ${esc(cl.cf)}`:""}${cliSdi(cl)}${cl.ref?`<br>Alla c.a. ${esc(cl.ref)}`:""}</div></div>
   </div>
   <div class="pn">Preventivo ${esc(q.numero)}${q.rev?" "+esc(q.rev):""} del ${fmtDate(q.data)}</div>
   <table class="cn"><tr><td class="hd2"${anyDett?' colspan="2"':""}>SERVIZIO/PRODOTTO</td><td class="hd2 c">QUANTITA'</td><td class="hd2 c">UNA TANTUM</td><td class="hd2 c">CANONE MENSILE</td></tr>
    ${rows}
    <tr class="fin"><td class="tl2" colspan="${anyDett?3:2}">${esc(q.connFinale)}</td><td class="ta2">${eurP(t.una)}</td><td class="ta2">${eurP(t.can)}</td></tr></table>
   ${voip}
   ${note.length?`<div class="cnote">${note.map(x=>`<span>${esc(x)}</span>`).join("<span>-</span>")}</div>`:""}
   ${az.foot?`<div class="after" style="color:#666;font-size:8pt">${esc(az.foot)}</div>`:""}
   ${pgFootHtml()}
  </div>`;
}
function renderLumia(c){
  const cl=q.cliente,lw=q.showImg;const cols=lw?4:3;
  const rows=Object.keys(CATS).flatMap(k=>c.rows.filter(x=>x.r.cat===k));
  const disc=c.listino>c.subtot;
  let tot=`<u>${eurP(c.imp)} +iva</u>`;
  if(q.totIva==="dettaglio")tot=`<span class="sm">Imponibile ${eurP(c.imp)}</span><span class="sm">IVA ${num.format(n(q.iva))}% ${eurP(c.ivaV)}</span><u>${eurP(c.tot)} iva incl.</u>`;
  let pre="";
  if(c.sc>0||disc&&q.showListino)pre=`<span class="sm">${disc&&q.showListino?"Listino "+eurP(c.listino):"Subtotale "+eurP(c.subtot)}</span>`+
    (disc&&q.showListino?`<span class="sm">Sconti voci − ${eurP(r2(c.listino-c.subtot))}</span>`:"")+(c.sc>0?`<span class="sm">Sconto${q.scontoTipo==="%"&&n(q.sconto)?" "+num.format(n(q.sconto))+"%":""} − ${eurP(c.sc)}</span>`:"");
  const after=[q.tempi&&`<b>Tempi</b>${esc(q.tempi)}`,q.pag&&`<b>Pagamento</b>${esc(q.pag)}${az.iban?" – IBAN "+esc(az.iban):""}`,q.cond&&`<b>Condizioni</b>${esc(q.cond)}`].filter(Boolean).join("");
  $("#sheet").innerHTML=`<div class="lm" style="--lm-col:${esc(az.colore||"#a4c2f4")}">
   <div class="lh"><div>${az.logo?`<img src="${esc(az.logo)}" alt="Logo">`:`<b style="font-size:16pt">${esc(az.nome)}</b>`}</div><div class="web">${esc(az.web)}</div></div>
   <div class="lp">
    <div class="ogg">OGGETTO:<br>${esc(q.oggetto)}</div>
    <div class="cli"><div class="cn">Spett.${esc(cl.nome)}${cl.piva?`<br>p.iva ${esc(cl.piva)}`:""}</div>
     <div class="ca">${esc(cliSede(cl))}${cl.esecutiva?`<br>Sede esecutiva: ${esc(cl.esecutiva)}`:""}${cl.cf?`<br>C.F. ${esc(cl.cf)}`:""}${cliSdi(cl)}${cl.ref?`<br>Alla c.a. ${esc(cl.ref)}`:""}</div></div>
   </div>
   <div class="pn">Preventivo ${esc(q.numero)}${q.rev?" "+esc(q.rev):""} del ${fmtDate(q.data)}</div>
   <table>
    <tr>${q.dataTab?`<td class="hd" style="width:${lw?"25mm":"30mm"}">${fmtDate(q.data)}</td>`:""}<td class="hd" colspan="${q.dataTab?cols-1:cols}">PREVENTIVO ${esc(q.titoloTab).toUpperCase()}</td></tr>
    <tr>${lw?"<th>IMMAGINE</th>":""}<th>DESCRIZIONE</th><th>PREZZO CAD</th><th>TOT</th></tr>
    ${rows.map(x=>{const r=x.r,img=r.img||(r.cat==="man"?IMG.tools:"");return `<tr class="it">${lw?`<td class="im">${img?`<img src="${esc(IS(img))}" alt="" referrerpolicy="no-referrer">`:""}</td>`:""}
      <td class="ds">${lmDesc(r)}</td><td class="pr">${lmPrice(x)}</td>
      <td class="tt">${r.omaggio?`<s>${eurP(x.lordo)}</s><span class="gift">OMAGGIO</span>`:(x.netto!==x.lordo&&q.showListino?`<s>${eurP(x.lordo)}</s>`:"")+(r.omaggio?"":eurP(x.netto))}</td></tr>`}).join("")||`<tr><td colspan="${cols}" style="text-align:center;color:#999">Aggiungi le voci del preventivo</td></tr>`}
    <tr><td class="nt" colspan="${cols-1}" rowspan="2">${esc(q.note)}</td><td class="tl">Totale</td></tr>
    <tr><td class="ta">${pre}${tot}</td></tr>
   </table>
   ${after?`<div class="after">${after}</div>`:""}
   ${az.foot?`<div class="after" style="color:#666;font-size:8pt">${esc(az.foot)}</div>`:""}
   ${pgFootHtml()}
  </div>`;
}
function renderSheet(){
  if(q.tipo==="conn"){renderConn();return}
  const c=calc(q),cl=q.cliente,show=q.show;
  if(q.layout!=="classico"){renderLumia(c);return}
  const scad=q.data&&n(q.validita)?(()=>{const d=new Date(q.data);d.setDate(d.getDate()+n(q.validita));return d.toISOString().slice(0,10)})():"";
  const cols=show==="all"?6:show==="tot"?4:3;
  const useImg=q.showImg&&q.righe.some(r=>r.img);const colsImg=useImg?1:0;
  let rowsH="";
  for(const cat of Object.keys(CATS)){
    const list=c.rows.filter(x=>x.r.cat===cat);if(!list.length)continue;
    rowsH+=`<tr class="cat"><td colspan="${cols+colsImg}">${CATS[cat]}</td></tr>`;
    for(const x of list){const r=x.r;const disc=!r.omaggio&&n(r.sconto)>0;
      rowsH+=`<tr>${useImg?`<td style="width:19mm">${r.img?`<img class="pimg" src="${esc(IS(r.img))}" alt="" referrerpolicy="no-referrer">`:""}</td>`:""}
       <td><div class="ititle">${esc(r.titolo)||"<span style='color:#999'>Voce senza titolo</span>"}</div>${r.descr?`<div class="idesc">${esc(r.descr)}</div>`:""}
        ${r.omaggio?`<span class="tag">Omaggio</span>`:disc?`<span class="tag sc">Sconto ${num.format(n(r.sconto))}%</span>`:""}</td>
       <td class="num">${num.format(n(r.qta))}</td><td>${esc(r.um)}</td>
       ${show==="all"?`<td class="num">${eur.format(n(r.prezzo))}</td><td class="num">${disc?num.format(n(r.sconto))+"%":r.omaggio?"100%":"–"}</td>`:""}
       ${show!=="none"?`<td class="num">${(r.omaggio||disc)&&q.showListino?`<span class="old">${eur.format(x.lordo)}</span>`:""}${r.omaggio?"0,00 €":eur.format(x.netto)}</td>`:""}</tr>`;
    }
  }
  const anyDisc=c.listino>c.subtot;
  $("#sheet").innerHTML=`
   <div class="hdr">
    <div class="az">${az.logo?`<img class="logo" src="${esc(az.logo)}" alt="Logo">`:""}<b>${esc(az.nome)}</b><br>
      ${esc(az.sede)}${az.oper?`<br>Sede operativa: ${esc(az.oper)}`:""}<br>
      P.IVA ${esc(az.piva)}${az.cf&&az.cf!==az.piva.replace(/^IT/,"")?` · C.F. ${esc(az.cf)}`:""}<br>
      ${[az.tel&&"Tel. "+esc(az.tel),esc(az.email),esc(az.web)].filter(Boolean).join(" · ")}</div>
    <div class="docid"><div class="t">PREVENTIVO</div><div class="n">N. ${esc(q.numero)}${q.rev?` – ${esc(q.rev)}`:""}</div>
      <div class="d">Data ${fmtDate(q.data)}${scad?`<br>Valido fino al ${fmtDate(scad)}`:""}</div></div>
   </div>
   <div class="parties">
    <div class="box"><div class="lbl">Cliente</div><b>${esc(cl.nome)||"—"}</b><br>
      ${cl.piva?`P.IVA ${esc(cl.piva)}`:""}${cl.cf&&cl.cf!==cl.piva.replace(/^IT/,"")?`${cl.piva?" · ":""}C.F. ${esc(cl.cf)}`:""}
      ${cliSdi(cl)}${cl.ref?`<br>Alla c.a. ${esc(cl.ref)}`:""}
      ${cl.tel||cl.email?`<br>${[esc(cl.tel),esc(cl.email)].filter(Boolean).join(" · ")}`:""}</div>
    <div class="box"><div class="lbl">Sede legale</div>${esc(cliSede(cl))||"—"}
      <div class="lbl" style="margin-top:2mm">Sede esecutiva</div>${esc(cl.esecutiva)||(cliSede(cl)?"Coincide con la sede legale":"—")}</div>
   </div>
   ${q.oggetto?`<div class="ogg"><span>Oggetto</span>${esc(q.oggetto)}</div>`:""}
   <table class="items"><thead><tr>${useImg?"<th></th>":""}<th>Descrizione</th><th class="num">Q.tà</th><th>U.M.</th>
     ${show==="all"?`<th class="num">Prezzo unit.</th><th class="num">Sc.</th>`:""}${show!=="none"?`<th class="num">Importo</th>`:""}</tr></thead>
    <tbody>${rowsH||`<tr><td colspan="${cols+colsImg}" style="color:#999;padding:6mm 0;text-align:center">Aggiungi le voci del preventivo</td></tr>`}</tbody></table>
   <div class="bottom">
    <div class="notes">
     ${q.note?`<p class="lbl">Note</p>${esc(q.note)}<br><br>`:""}
     ${q.pag?`<p class="lbl">Pagamento</p>${esc(q.pag)}${az.iban?`<br>IBAN ${esc(az.iban)}`:""}<br><br>`:""}
     ${q.tempi?`<p class="lbl">Tempi</p>${esc(q.tempi)}<br><br>`:""}
     ${q.cond?`<p class="lbl">Condizioni</p>${esc(q.cond)}`:""}
    </div>
    <div>
     <table class="tot">
      ${anyDisc&&q.showListino?`<tr><td>Totale a listino</td><td class="num">${eur.format(c.listino)}</td></tr><tr class="disc"><td>Sconti e omaggi sulle voci</td><td class="num">− ${eur.format(r2(c.listino-c.subtot))}</td></tr>`:""}
      ${Object.keys(CATS).filter(k=>q.righe.some(r=>r.cat===k)).length>1?Object.keys(CATS).filter(k=>q.righe.some(r=>r.cat===k)).map(k=>`<tr><td>${CATS[k]}</td><td class="num">${eur.format(c.sub[k])}</td></tr>`).join(""):""}
      <tr><td><b>Totale voci</b></td><td class="num"><b>${eur.format(c.subtot)}</b></td></tr>
      ${c.sc>0?`<tr class="disc"><td>Sconto${q.scontoTipo==="%"&&n(q.sconto)?" "+num.format(n(q.sconto))+"%":""}${c.arr?" e arrotondamento":""}</td><td class="num">− ${eur.format(c.sc)}</td></tr>`:""}
      <tr><td>Imponibile</td><td class="num">${eur.format(c.imp)}</td></tr>
      <tr><td>IVA ${num.format(n(q.iva))}%</td><td class="num">${eur.format(c.ivaV)}</td></tr>
      <tr class="grand"><td>Totale</td><td class="num">${eur.format(c.tot)}</td></tr>
     </table>
     ${c.risparmio>0.009?`<div class="save">Risparmio sul prezzo di listino: ${eur.format(c.risparmio)} + IVA</div>`:""}
    </div>
   </div>
   <div class="sign"><div>Luogo e data</div><div>Per accettazione (timbro e firma del cliente)</div></div>
   ${az.foot?`<div class="foot">${esc(az.foot)}</div>`:""}
   ${pgFootHtml()}`;
}

