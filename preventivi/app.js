(function(){
"use strict";
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const CATS={mat:"Materiali e prodotti",acc:"Accessori",man:"Manodopera"};
const CAT_CSV={materiali:"mat",materiale:"mat",prodotti:"mat",prodotto:"mat",mat:"mat",manodopera:"man",man:"man",lavoro:"man",accessori:"acc",accessorio:"acc",acc:"acc"};
let eur;try{eur=new Intl.NumberFormat("it-IT",{style:"currency",currency:"EUR",useGrouping:"always"});eur.format(1)}catch(e){eur=new Intl.NumberFormat("it-IT",{style:"currency",currency:"EUR"})}
const num=new Intl.NumberFormat("it-IT",{maximumFractionDigits:3});
const uid=()=>Math.random().toString(36).slice(2,10)+Date.now().toString(36).slice(-4);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const n=v=>{const x=parseFloat(String(v??"").replace(",","."));return isFinite(x)?x:0};
const r2=x=>Math.round((x+Number.EPSILON)*100)/100;
const today=()=>new Date().toISOString().slice(0,10);
const fmtDate=d=>{if(!d)return"";const[y,m,g]=d.split("-");return `${g}/${m}/${y}`};

/* ---------- storage ---------- */
const store=window.PREV_STORE;

const IMG={"logo": "data:image/png;base64,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", "cam": "data:image/png;base64,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", "sw": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADYAAAASCAIAAACfGrqqAAAFWklEQVR42s1WW49cxRHuqu4+1/HcHO+dYBsF21yykRwebNYE8eIkSEkekvgHAL+PpxUSiQgRBNBGJESyYq1tbC/LeGdndy47Z+dcu6vy0ONhvbsKiBco6Uinq091ff3V7QAzCyGYmZnTNHXLH1aklEEQIKJbqtlGURREBABuOYM+08zkpOZbxZ12quHJLWOMtRYAnHIK0VprjDmKL89zR6qUEhGttUSklHL3K4rC8zzP8/I8dyaIiIguGkRkrZVSOr3neWmaund3iDHGvc+UWmuttQMAAGVZSimnS3diURTGmGOX+z9Xn9H5PRLjVKuTXhwFAKAcxKqqjn004/lb/X2PbPsuVlVVKaWklMjMRVGIH58wc1VVzKyqqrLWztL2RyVlWSIi3Llzp9lsnozCUcRPlTmzECzcI9wGs4Cp4ikehHgSTxDAT5fwqUE/6ZqZFQBsb2+7qBMRMyPi0U+dRkqJCFQW1qTAPEmzrDSeH4S+TidpRRalqkfBfn9UOxOXZVmPa/3BIIwiz/cVCqlDkJ6lqRyF6A53Hq21WmvXPZym3W4rIcTW1tZ4PPY8r16vj0YjIqrVarVard/vx3GcZVmz2VxZWYnCsLv9udp8tyRtvHZS0EEGC20fBQ+HI/JbNrAS1YP9Ydw4Z1WWldQZ5+farViVwc9u1hee2+08/np7m4lJsGAWAEIwgDh//iIiTiaTJEna7fa9e/d6vZ619tatW8rJ3Nxcq9UCAERstVpZll28eFFKOSPcbQm2gkSapjtp+Aibf/3w4739/tqr14Mg+OCDz6M4urF2fdAffLbxz+XlpddurH3yyaePtr565erVV9eu/+LMOSL6zxf/fm993RhTVZUf+ExUmcpYeuvtd65du7a8vOx8XbhwwZUHAEgplVJqcXFRKTXLCXgix+qLSEgdaO0Fvu52BoODidTBfzfvt9tnlR9mhbl95363u6v9qNsbTNKquzeUOtz41xcvrK4SIxEXZVVVJREXZaG0EswSZZYVAAJRHm3dQohZK1RueMyy4dTiN8YkSXIwGil9FudfOjvqPKt+erPeZAaJ4Pv+5UvPMwvtaSImawVzvVH/za9vWiJEVGo6w3zfW1u7MR6PPd/r9Xory8tCMAvRaDSOgpsxRc581utdhp4ESkS3b99eX1/Pskwwv/Dcwitt+PLBgwdf7QghFubnsjxPkkQwz88v7O3tEVlE+fylS3c3N621Sqs33/wtIAohTGUHgwGAqEpBZHu9Xa01kxgfHBDZk9RYaxFRORDW2p2dHSnl4uLiyRAnSbKxsTEcDpk59l9brcNkkm9ubhZFIVZfzrP8/v0vlVJK60dbW4PBoNFsLC4tbd69O5lM5ubnyrJEAGZODpOP/vGxp3Sjfqaoqv1+3/M0ACw8s/zS4SSOa0f7DgC4Qa8QUQAQURCG1hpLhMcgChEEwZUrV7TnjUajVvsnGBRvvLGKXtTpPP7D735flOX77/9lfu7c66//6utO528f/v2XV69evnJZKfnw4cM//+mPnucjSgBAhDiOEaAyBgCCMNRKMbNWWgg+1oyIaRrYnW6329s1ZEfDoe8HtVr8TcOdskiHSZKmqR8EZVmhIEHGWiYhJoeTMAzdr0qeF1EUCsF5XggQYRAS0SSdRGHo+UG93gCAra1HjzsdJrbWaO0BTNv90tLS0sozYRQemRGCmbI0/fmLL8Pu7u7jnR03NE4f8MxZniOA5/nMlGVZGEVkbZKM4zhGVGVZGGOCIJQSR6NhFEVKawQcjw/O1GoAiCgFAhPt7+8pKR0FIODwMAmjSCvth4HvB1Iii+kmPPnXuvDs+f8Bdkk2F7wF0VcAAAAASUVORK5CYII=", "cable": "data:image/png;base64,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", "tools": "data:image/png;base64,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"};
const DEF_AZ={nome:"Lumia Network",piva:"",cf:"",sede:"",oper:"",tel:"",email:"",web:"www.lumianetwork.it",iban:"",colore:"#a4c2f4",formato:"n",pref:"",next:131,
  foot:"",cond:"",pag:"",iva:22,logo:IMG.logo};
const DEF_CAT=[
  {id:uid(),cat:"mat",codice:"UVC-G6-DOME",titolo:"UniFi Protect Videocamera",descr:"",um:"pz",prezzo:240,img:IMG.cam},
  {id:uid(),cat:"mat",codice:"CRS112-8P-4S-IN",titolo:"Switch POE 24v / 48v",descr:"",um:"pz",prezzo:250,img:IMG.sw},
  {id:uid(),cat:"mat",codice:"Ubiquiti U7 Outdoor",titolo:"Access Point WiFi",descr:"",um:"pz",prezzo:250,img:"img/ubiquiti-u7-outdoor.jpg"},
  {id:uid(),cat:"mat",codice:"Ubiquiti UniFi U7 Lite",titolo:"Access Point WiFi",descr:"",um:"pz",prezzo:120,img:"img/ubiquiti-u7-lite.jpg"},
  {id:uid(),cat:"mat",codice:"CLOUD KEY",titolo:"Cloud Key Gen2 Plus",descr:"",um:"pz",prezzo:250,img:""},
  {id:uid(),cat:"acc",codice:"",titolo:"",descr:"Accessori montaggio\nCavo elettrico\nCavo Ethernet cat.5E",um:"kit",prezzo:50,img:IMG.cable},
  {id:uid(),cat:"man",codice:"",titolo:"",descr:"Installazione impianto\nConfigurazione e puntamento",um:"h",prezzo:40,pers:2,img:IMG.tools},
  {id:uid(),cat:"man",codice:"",titolo:"",descr:"Installazione impianto\nConfigurazione\nCollaudo\ncavo eth",um:"h",prezzo:40,pers:2,img:IMG.tools}
];
const IS=p=>(p&&window.IMG_DATA&&window.IMG_DATA[p])||p;
let az=Object.assign({},DEF_AZ,store.get("azienda",{}));
if(/\(esempio\)/.test(az.nome))az=Object.assign({},DEF_AZ);
let catalog=store.get("listino",null)||DEF_CAT.slice();
// listino fornitori (listino.js): aggiunge le voci che non sono ancora presenti
(function(){const F=window.LISTINO_FORNITORI||[];if(!F.length)return;const ver=String(F.length)+"-"+(F[0]&&F[0].id);
  if(store.get("listinoFornVer","")===ver)return;const have=new Set(catalog.map(x=>x.id));
  F.forEach(x=>{if(!have.has(x.id))catalog.push(Object.assign({},x))});
  // voci senza foto: usa quella del fornitore con lo stesso codice
  const key=c=>String(c||"").toLowerCase().replace(/^ubiquiti\s+(unifi\s+)?/,"").replace(/\s+/g,"-");
  const byCode={};F.forEach(x=>byCode[key(x.codice)]=x);
  catalog.forEach(x=>{if(!x.img&&byCode[key(x.codice)])x.img=byCode[key(x.codice)].img});store.set("listinoFornVer",ver);store.set("listino",catalog)})();
if(catalog.some(x=>x.codice==="CLM-12"))catalog=DEF_CAT.concat(catalog.filter(x=>!["CLM-12","TUB-14","MO-INST","MO-ORA","STF-50","POMPA"].includes(x.codice)));
let archive=store.get("archivio",null);
let q=store.get("bozza",null);
if(!q)q=newQuote(false);
normalize(q);
// bozza non ancora salvata: data di oggi
if(!q.salvato)q.data=today();
if(!archive)archive=[];
function normalize(x){if(!x.layout)x.layout="lumia";if(x.titoloTab==null)x.titoloTab="";if(x.dataTab==null)x.dataTab=true;if(!x.totIva)x.totIva="piu";
  x.righe.forEach(r=>{if(r.pers==null)r.pers=1;if(r.codice==null)r.codice=""});return x}

function numOf(v){const m=String(v||"").replace(az.pref||"\u0000","").match(/\d+/);return m?parseInt(m[0],10):0}
function nextNum(){const used=(archive||[]).map(a=>numOf(a.numero));return Math.max(n(az.next)||1,...used.map(x=>x+1))}
function nextNumber(){const y=new Date().getFullYear(),k=nextNum();return `${az.pref?az.pref+" ":""}${az.formato==="anno"?String(k).padStart(3,"0")+"/"+y:k}`}
function blankRow(cat){return{id:uid(),cat:cat||"mat",codice:"",titolo:"",descr:"",um:cat==="man"?"h":"pz",qta:1,pers:1,prezzo:0,sconto:0,omaggio:false,img:cat==="man"?IMG.tools:"",link:""}}
function newQuote(sample){
  const base={id:uid(),numero:nextNumber(),data:today(),validita:30,rev:"",oggetto:"",
    cliente:{nome:"",piva:"",cf:"",legale:"",esecutiva:"",ref:"",tel:"",email:"",sdi:""},
    righe:[],sconto:0,scontoTipo:"%",iva:n(az.iva)||22,arr:"0",show:"all",showImg:true,showListino:true,layout:"lumia",titoloTab:"",dataTab:true,totIva:"piu",
    note:"",pag:az.pag||"",tempi:"",cond:az.cond||"",salvato:false};
  if(sample){
    Object.assign(base,{oggetto:"Proposta di abbonamento servizi di telecomunicazioni",titoloTab:"ESTENSIONE TVCC",
      note:"In caso di problematiche non imputabili a Lumia Network durante l'installazione calcolare orario extra manodopera"});
    base.cliente={nome:"Ristorante Il Capriolo Utata S.R.L.",piva:"08207380968",cf:"",legale:"Via Luigi Einaudi, 1, 20080 Pasturago MI",esecutiva:"",ref:"",tel:"",email:"",sdi:""};
    const c=i=>catalog.find(x=>x.codice===DEF_CAT[i].codice&&x.descr===DEF_CAT[i].descr)||DEF_CAT[i];
    const fromCat=(i,qta)=>Object.assign(blankRow(),pick(c(i)),{qta});
    base.righe=[fromCat(0,2),fromCat(1,1),fromCat(5,1),fromCat(6,8)];
  }
  return base;
}
const lbl=x=>[x.codice,x.titolo].filter(Boolean).join(" - ")||String(x.descr||"").split("\n")[0]||"Voce";
function pick(c){return{cat:c.cat||"mat",titolo:c.titolo||"",descr:c.descr||"",um:c.um||"pz",prezzo:n(c.prezzo),pers:n(c.pers)||1,img:c.img||"",codice:c.codice||""}}

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
const QF=["numero","data","validita","rev","oggetto","titoloTab","layout","totIva","sconto","scontoTipo","iva","arr","show","note","pag","tempi","cond"];
const CF=["nome","piva","cf","legale","esecutiva","ref","tel","email","sdi"];
function fillForm(){
  QF.forEach(k=>$("#q_"+k).value=q[k]??"");
  CF.forEach(k=>$("#c_"+k).value=q.cliente[k]??"");
  $("#q_showImg").checked=!!q.showImg;$("#q_showListino").checked=!!q.showListino;$("#q_dataTab").checked=!!q.dataTab;
  renderRows();renderSheet();
}
QF.forEach(k=>$("#q_"+k).addEventListener("input",e=>{q[k]=e.target.value;changed()}));
CF.forEach(k=>$("#c_"+k).addEventListener("input",e=>{q.cliente[k]=e.target.value;changed()}));
$("#q_showImg").addEventListener("change",e=>{q.showImg=e.target.checked;changed()});
$("#q_dataTab").addEventListener("change",e=>{q.dataTab=e.target.checked;changed()});
$("#q_showListino").addEventListener("change",e=>{q.showListino=e.target.checked;changed()});

let saveT;
function changed(rerenderRows){if(rerenderRows)renderRows();else updateRowTotals();renderSheet();clearTimeout(saveT);saveT=setTimeout(()=>store.set("bozza",q),300)}

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
  $("#mImgFile").onclick=()=>{const f=$("#fileImg");f.value="";f.onchange=async()=>{if(f.files[0])done(await resizeFile(f.files[0],500))};f.click()};
  pasteHandler=async e=>{const it=[...(e.clipboardData?.items||[])].find(x=>x.type.startsWith("image/"));if(it){e.preventDefault();done(await resizeFile(it.getAsFile(),500))}};
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
     <div class="ca">${esc(cl.legale)}${cl.esecutiva?`<br>Sede esecutiva: ${esc(cl.esecutiva)}`:""}${cl.cf?`<br>C.F. ${esc(cl.cf)}`:""}${cl.sdi?`<br>Cod. SDI ${esc(cl.sdi)}`:""}${cl.ref?`<br>Alla c.a. ${esc(cl.ref)}`:""}</div></div>
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
  </div>`;
}
function renderSheet(){
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
      ${cl.sdi?`<br>Cod. SDI ${esc(cl.sdi)}`:""}${cl.ref?`<br>Alla c.a. ${esc(cl.ref)}`:""}
      ${cl.tel||cl.email?`<br>${[esc(cl.tel),esc(cl.email)].filter(Boolean).join(" · ")}`:""}</div>
    <div class="box"><div class="lbl">Sede legale</div>${esc(cl.legale)||"—"}
      <div class="lbl" style="margin-top:2mm">Sede esecutiva</div>${esc(cl.esecutiva)||(cl.legale?"Coincide con la sede legale":"—")}</div>
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
   ${az.foot?`<div class="foot">${esc(az.foot)}</div>`:""}`;
}

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

/* ---------- PDF: salvataggio e riapertura ---------- */
const PDF_MARK="%LUMIA-PREVENTIVO:";
function fileName(){return (`Preventivo ${q.numero} - ${q.cliente.nome||"cliente"}`).replace(/[\\/:*?"<>|]+/g,"-").replace(/[.\s]+$/,"").slice(0,120)+".pdf"}
async function makePdf(){
  if(!window.html2canvas||!window.jspdf)throw new Error("lib");
  // copia pulita del foglio, larga esattamente 210 mm, senza ombre né altezza minima
  const wrap=document.createElement("div");wrap.style.cssText="position:absolute;left:-30000px;top:0;width:210mm;background:#fff";
  const el=$("#sheet").cloneNode(true);el.removeAttribute("id");el.style.cssText="box-shadow:none;margin:0;min-height:0;width:210mm";
  wrap.appendChild(el);document.body.appendChild(wrap);
  await Promise.all([...el.querySelectorAll("img")].map(im=>im.complete?0:new Promise(r=>{im.onload=im.onerror=r})));
  let canvas;
  try{canvas=await html2canvas(el,{scale:2,useCORS:true,backgroundColor:"#ffffff",logging:false,imageTimeout:8000,width:el.offsetWidth,height:el.offsetHeight,windowWidth:1400})}
  catch(e){wrap.remove();throw e}
  const {jsPDF}=window.jspdf;const pdf=new jsPDF({unit:"mm",format:"a4",compress:true});
  const W=210,H=297,top=10,k=canvas.width/el.offsetWidth,pxmm=canvas.width/W;
  // punti in cui si può andare a pagina nuova senza tagliare una riga
  const base=el.getBoundingClientRect().top;
  const cuts=[...el.querySelectorAll("tr,table,.bottom,.sign,.foot,.after,.parties,.ogg")].map(e=>Math.min(canvas.height,Math.round((e.getBoundingClientRect().bottom-base+2)*k))).sort((a,b)=>a-b);
  let y=0,page=0;
  while(y<canvas.height-4){
    const cap=Math.floor((H-(page?top:0))*pxmm);let end=Math.min(canvas.height,y+cap);
    if(end<canvas.height){const ok=cuts.filter(c=>c>y+cap*0.4&&c<=end);if(ok.length)end=ok[ok.length-1]}
    const c=document.createElement("canvas");c.width=canvas.width;c.height=end-y;
    const ctx=c.getContext("2d");ctx.fillStyle="#fff";ctx.fillRect(0,0,c.width,c.height);ctx.drawImage(canvas,0,y,canvas.width,end-y,0,0,canvas.width,end-y);
    if(page)pdf.addPage();pdf.addImage(c.toDataURL("image/jpeg",0.9),"JPEG",0,page?top:0,W,(end-y)/pxmm);
    y=end;page++;
    // salta lo spazio bianco finale
    if(canvas.height-y<6*pxmm)break;
    if(y<canvas.height){const rest=canvas.getContext("2d").getImageData(0,y,canvas.width,canvas.height-y).data;let blank=true;for(let i=0;i<rest.length;i+=64){if(rest[i]<245||rest[i+1]<245||rest[i+2]<245){blank=false;break}}if(blank)break}
  }
  wrap.remove();
  pdf.setProperties({title:`Preventivo ${q.numero}`,subject:q.oggetto||"",author:az.nome||"",creator:"Preventivi"});
  const buf=pdf.output("arraybuffer");
  const json=JSON.stringify({v:1,azienda:{nome:az.nome},q});
  const b64=btoa(unescape(encodeURIComponent(json)));
  return new Blob([buf,new TextEncoder().encode("\n"+PDF_MARK+b64+"\n%%EOF\n")],{type:"application/pdf"});
}
async function savePdf(){
  const b=$("#bSave");b.disabled=true;b.textContent="Creo il PDF…";
  try{
    saveQuote(true);
    const blob=await makePdf();
    const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=fileName();document.body.appendChild(a);a.click();
    setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},2000);
    toast(`Salvato: ${fileName()}`);
  }catch(e){console.error(e);toast(e.message==="lib"?"Librerie PDF mancanti: tieni la cartella lib accanto a index.html":"PDF non creato: usa «Stampa» e scegli Salva come PDF")}
  finally{b.disabled=false;b.textContent="Salva PDF"}
}
async function openPdf(file){
  try{
    const bytes=new Uint8Array(await file.arrayBuffer());
    // il blocco dati è in coda al file: cerca il marcatore negli ultimi byte
    const txt=new TextDecoder("latin1").decode(bytes.subarray(Math.max(0,bytes.length-20000000)));
    const i=txt.lastIndexOf(PDF_MARK);
    if(i<0){toast("Questo PDF non è stato creato con l'app: non contiene i dati del preventivo");return}
    const b64=txt.slice(i+PDF_MARK.length).split(/[\r\n]/)[0];
    const d=JSON.parse(decodeURIComponent(escape(atob(b64))));
    q=normalize(d.q);q.salvato=true;
    const j=archive.findIndex(a=>a.id===q.id);if(j>=0)archive[j]=JSON.parse(JSON.stringify(q));else archive.unshift(JSON.parse(JSON.stringify(q)));
    store.set("archivio",archive);store.set("bozza",q);
    const k=numOf(q.numero);if(k>=n(az.next)){az.next=k+1;store.set("azienda",az);fillCompany()}
    fillForm();show("quote");toast(`Preventivo ${q.numero} aperto: puoi modificarlo e salvarlo di nuovo`);
  }catch(e){console.error(e);toast("File non leggibile")}
}

/* ---------- cliente: ricerca dati ---------- */
function refreshClientList(){const cl=store.get("clienti",[]);$("#dlClienti").innerHTML=cl.map(c=>`<option value="${esc(c.nome)}">${esc(c.piva||"")} ${esc(c.legale||"")}</option>`).join("")}
function setClient(o,overwrite){CF.forEach(k=>{if(o[k]!=null&&o[k]!==""&&(overwrite||!q.cliente[k]))q.cliente[k]=o[k]});CF.forEach(k=>$("#c_"+k).value=q.cliente[k]??"");changed()}
$("#c_nome").addEventListener("change",()=>{const v=$("#c_nome").value.trim().toLowerCase();const c=store.get("clienti",[]).find(x=>x.nome.toLowerCase()===v);
  if(c){setClient(c,true);$("#viesMsg").textContent="Dati presi dai clienti salvati."}
  $("#lnkPiva").href="https://www.google.com/search?q="+encodeURIComponent((v||"")+" partita iva sede legale")});
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
  const l=archive.filter(a=>!s||(a.numero+" "+a.cliente.nome+" "+a.oggetto).toLowerCase().includes(s));
  $("#arcTable").innerHTML=`<tr><th>Numero</th><th>Data</th><th>Cliente</th><th>Oggetto</th><th class="num">Totale</th><th></th></tr>`+
   (l.length?l.map(a=>`<tr data-id="${a.id}"><td style="font-family:var(--mono)">${esc(a.numero)}</td><td>${fmtDate(a.data)}</td><td>${esc(a.cliente.nome)}</td><td>${esc(a.oggetto).slice(0,80)}</td><td class="num">${eur.format(calc(a).tot)}</td>
   <td style="white-space:nowrap"><button class="btn small" data-a="open">Apri</button> <button class="btn small" data-a="dup">Duplica</button> <button class="btn small danger" data-a="del">Elimina</button></td></tr>`).join("")
   :`<tr><td colspan="6" class="muted">Nessun preventivo salvato. Compila un preventivo e premi «Salva».</td></tr>`);
}
$("#arcSearch").addEventListener("input",renderArchive);
$("#arcTable").addEventListener("click",e=>{const b=e.target.closest("[data-a]");if(!b)return;const id=b.closest("tr").dataset.id,a=archive.find(x=>x.id===id);
  if(b.dataset.a==="open"){q=normalize(JSON.parse(JSON.stringify(a)));fillForm();show("quote")}
  else if(b.dataset.a==="dup"){q=normalize(JSON.parse(JSON.stringify(a)));q.id=uid();q.numero=nextNumber();q.data=today();q.salvato=false;q.rev="";fillForm();show("quote");toast("Copia creata con nuovo numero "+q.numero)}
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
  $(".modal").onclick=e=>{const it=e.target.closest(".picker-item");if(!it)return;q.cliente=Object.assign({},cl[+it.dataset.i]);CF.forEach(k=>$("#c_"+k).value=q.cliente[k]??"");closeModal();changed()}};

/* ---------- azienda ---------- */
const AF=["nome","piva","cf","sede","oper","tel","email","web","iban","colore","formato","pref","next","foot","cond","pag","iva"];
function fillCompany(){AF.forEach(k=>$("#a_"+k).value=az[k]??"");$("#logoPrev").innerHTML=az.logo?`<img src="${esc(az.logo)}" alt="Logo">`:"Nessun logo";$("#brandAz").textContent=az.nome?"· "+az.nome:""}
AF.forEach(k=>$("#a_"+k).addEventListener("input",e=>{az[k]=e.target.value;store.set("azienda",az);$("#brandAz").textContent=az.nome?"· "+az.nome:"";renderSheet()}));
$("#bLogo").onclick=()=>{const f=$("#fileLogo");f.value="";f.onchange=async()=>{if(!f.files[0])return;az.logo=await resizeFile(f.files[0],600);store.set("azienda",az);fillCompany();renderSheet();toast("Logo caricato")};f.click()};
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
  if(v==="catalog")renderCatalog();if(v==="archive")renderArchive()}
$("#tabs").addEventListener("click",e=>{const b=e.target.closest("button");if(b)show(b.dataset.v)});

$("#bSave").onclick=()=>savePdf();
$("#bOpen").onclick=()=>{$("#filePdf").value="";$("#filePdf").click()};
$("#filePdf").addEventListener("change",e=>{const f=e.target.files[0];if(f)openPdf(f)});
$("#bNew").onclick=()=>confirmBox("Iniziare un nuovo preventivo? Le modifiche non salvate andranno perse.",()=>{q=newQuote(false);store.set("bozza",q);fillForm();toast("Nuovo preventivo "+q.numero)});
$("#bPrint").onclick=()=>{const old=document.title;document.title=`Preventivo ${q.numero} ${q.cliente.nome}`.replace(/[\/\\:]/g,"-");window.print();setTimeout(()=>document.title=old,1000)};

fillCompany();fillForm();
})();
