/* Preventivi · PDF: creazione, salvataggio e riapertura.
   I file in questa cartella si caricano in ordine (vedi boot.js) e condividono le stesse variabili. */
"use strict";
/* ---------- PDF: salvataggio e riapertura ---------- */
const PDF_MARK="%LUMIA-PREVENTIVO:";
function fileName(){return (`Preventivo ${q.numero} - ${q.cliente.nome||"cliente"}`).replace(/[\\/:*?"<>|]+/g,"-").replace(/[.\s]+$/,"").slice(0,120)+".pdf"}

/* piè di pagina a due colonne (nome, P.IVA, capitale, PEC | sede, tel, email) */
const footRgb=()=>{const h=(az.colore||"#a4c2f4").replace("#",""),c=[0,2,4].map(i=>parseInt(h.substr(i,2),16)||160);return `rgb(${Math.round(c[0]*.6)},${Math.round(c[1]*.75)},${Math.round(Math.min(255,c[2]*.92))})`};
const footMail=()=>{let m=String(az.email||"").trim();if(az.pec&&m.includes("/"))m=m.split("/").map(x=>x.trim()).filter(x=>x&&x.toLowerCase()!==String(az.pec).trim().toLowerCase()).join(" / ");return m};
const footLines=()=>({
  L:[az.piva&&["P.IVA ",az.piva],az.capsoc&&["CAP. SOC. ",az.capsoc],az.pec&&["PEC ",az.pec]].filter(Boolean),
  R:[az.sede&&["",az.sede],az.tel&&["TEL ",az.tel],footMail()&&["MAIL ",footMail()]].filter(Boolean),
  name:az.ragione||az.nome||""});
const hasFoot=()=>{const f=footLines();return !!(f.name||f.L.length||f.R.length)};
const FOOT_MM=24;
function drawFoot(pdf,n){
  const f=footLines(),W=210,y0=297-FOOT_MM+2,mx=14,hex=(az.colore||"#a4c2f4").replace("#",""),rgb=[0,2,4].map(i=>parseInt(hex.substr(i,2),16)||160);
  pdf.setPage(n);
  pdf.setTextColor(0);pdf.setFont("helvetica","bold");pdf.setFontSize(10);pdf.text(String(n),W-mx,y0+2,{align:"right"});
  pdf.setFontSize(9.5);pdf.text(f.name,mx,y0+2);
  {const k=footRgb().match(/\d+/g).map(Number);pdf.setDrawColor(k[0],k[1],k[2])}pdf.setLineWidth(0.7);pdf.line(mx,y0+4.5,W-mx,y0+4.5);
  pdf.setFontSize(7.2);
  f.L.forEach(([lab,v],i)=>{const yy=y0+9+i*3.6;pdf.setFont("helvetica","bold");pdf.text(lab,mx,yy);const w=pdf.getTextWidth(lab.trim())+1.2;pdf.setFont("helvetica","normal");pdf.text(String(v),mx+w,yy)});
  f.R.forEach(([lab,v],i)=>{const yy=y0+9+i*3.6;pdf.setFont("helvetica","normal");const w=pdf.getTextWidth(String(v));pdf.text(String(v),W-mx,yy,{align:"right"});if(lab){pdf.setFont("helvetica","bold");pdf.text(lab.trim(),W-mx-w-1.2,yy,{align:"right"})}});
}
async function makePdf(){
  if(!window.html2canvas||!window.jspdf)throw new Error("lib");
  // copia pulita del foglio, larga esattamente 210 mm, senza ombre né altezza minima
  const wrap=document.createElement("div");wrap.style.cssText="position:absolute;left:-30000px;top:0;width:210mm;background:#fff";
  const el=$("#sheet").cloneNode(true);el.querySelectorAll(".pgfoot,.pgsp").forEach(x=>x.remove());el.removeAttribute("id");el.style.cssText="box-shadow:none;margin:0;min-height:0;width:210mm";
  wrap.appendChild(el);document.body.appendChild(wrap);
  await Promise.all([...el.querySelectorAll("img")].map(im=>im.complete?0:new Promise(r=>{im.onload=im.onerror=r})));
  let canvas;
  try{canvas=await html2canvas(el,{scale:3,useCORS:true,backgroundColor:"#ffffff",logging:false,imageTimeout:8000,width:el.offsetWidth,height:el.offsetHeight,windowWidth:1400})}
  catch(e){wrap.remove();throw e}
  const {jsPDF}=window.jspdf;const pdf=new jsPDF({unit:"mm",format:"a4",compress:true});
  const W=210,H=297,top=10,k=canvas.width/el.offsetWidth,pxmm=canvas.width/W;
  // punti in cui si può andare a pagina nuova senza tagliare una riga
  const base=el.getBoundingClientRect().top;
  const cuts=[...el.querySelectorAll("tr,table,.bottom,.sign,.foot,.after,.parties,.ogg")].map(e=>Math.min(canvas.height,Math.round((e.getBoundingClientRect().bottom-base+2)*k))).sort((a,b)=>a-b);
  let y=0,page=0;
  while(y<canvas.height-4){
    const cap=Math.floor((H-(page?top:0)-(hasFoot()?FOOT_MM:0))*pxmm);let end=Math.min(canvas.height,y+cap);
    if(end<canvas.height){const ok=cuts.filter(c=>c>y+cap*0.4&&c<=end);if(ok.length)end=ok[ok.length-1]}
    const c=document.createElement("canvas");c.width=canvas.width;c.height=end-y;
    const ctx=c.getContext("2d");ctx.fillStyle="#fff";ctx.fillRect(0,0,c.width,c.height);ctx.drawImage(canvas,0,y,canvas.width,end-y,0,0,canvas.width,end-y);
    if(page)pdf.addPage();pdf.addImage(c.toDataURL("image/jpeg",0.95),"JPEG",0,page?top:0,W,(end-y)/pxmm);
    y=end;page++;
    // salta lo spazio bianco finale
    if(canvas.height-y<6*pxmm)break;
    if(y<canvas.height){const rest=canvas.getContext("2d").getImageData(0,y,canvas.width,canvas.height-y).data;let blank=true;for(let i=0;i<rest.length;i+=64){if(rest[i]<245||rest[i+1]<245||rest[i+2]<245){blank=false;break}}if(blank)break}
  }
  wrap.remove();
  if(hasFoot()){const np=pdf.getNumberOfPages();for(let i=1;i<=np;i++)drawFoot(pdf,i)}
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

