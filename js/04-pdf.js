/* Presenze & Ticket Pro · PDF del report (generatore minimo senza librerie).
   I file della cartella js/ si caricano in ordine (vedi index.html) e condividono le stesse variabili. */
/* PDF: generatore minimo (testo, linee, rettangoli, un'immagine JPEG), senza librerie */
const HW=[278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556, 1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556, 333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584, 761, 556, 0, 222, 556, 333, 1000, 556, 556, 333, 1000, 667, 333, 1000, 0, 611, 0, 0, 222, 222, 333, 333, 350, 556, 1000, 333, 1000, 500, 333, 944, 0, 500, 667, 278, 333, 556, 556, 556, 556, 260, 556, 333, 737, 370, 556, 584, 333, 737, 333, 400, 584, 333, 333, 333, 556, 537, 278, 333, 333, 365, 556, 834, 834, 834, 611, 667, 667, 667, 667, 667, 667, 1000, 722, 667, 667, 667, 667, 278, 278, 278, 278, 722, 722, 778, 778, 778, 778, 778, 584, 778, 722, 722, 722, 722, 667, 667, 611, 556, 556, 556, 556, 556, 556, 889, 500, 556, 556, 556, 556, 278, 278, 278, 278, 556, 556, 556, 556, 556, 556, 556, 584, 611, 556, 556, 556, 556, 500, 556, 500],HB=[278, 333, 474, 556, 556, 889, 722, 238, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 333, 333, 584, 584, 584, 611, 975, 722, 722, 722, 722, 667, 611, 778, 722, 278, 556, 722, 611, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 333, 278, 333, 584, 556, 333, 556, 611, 556, 611, 556, 333, 611, 611, 278, 278, 556, 278, 889, 611, 611, 611, 611, 389, 556, 333, 611, 556, 778, 556, 556, 500, 389, 280, 389, 584, 761, 556, 0, 278, 556, 500, 1000, 556, 556, 333, 1000, 667, 333, 1000, 0, 611, 0, 0, 278, 278, 500, 500, 350, 556, 1000, 333, 1000, 556, 333, 944, 0, 500, 667, 278, 333, 556, 556, 556, 556, 280, 556, 333, 737, 370, 556, 584, 333, 737, 333, 400, 584, 333, 333, 333, 611, 556, 278, 333, 333, 365, 556, 834, 834, 834, 611, 722, 722, 722, 722, 722, 722, 1000, 722, 667, 667, 667, 667, 278, 278, 278, 278, 722, 722, 778, 778, 778, 778, 778, 584, 778, 722, 722, 722, 722, 667, 667, 611, 556, 556, 556, 556, 556, 556, 889, 556, 556, 556, 556, 556, 278, 278, 278, 278, 611, 611, 611, 611, 611, 611, 611, 584, 611, 611, 611, 611, 611, 556, 611, 556],CP={8217:146,8216:145,8220:147,8221:148,8211:150,8212:151,8364:128,8226:149,8230:133,8482:153};
const pdfBytes=s=>{const o=[];for(const ch of String(s)){let c=ch.codePointAt(0);if(c>=160&&c<256||c>=32&&c<127)o.push(c);else if(CP[c])o.push(CP[c]);else o.push(c<32?32:63)}return o};
const pdfW=(s,z,b)=>pdfBytes(s).reduce((a,c)=>a+((b?HB:HW)[c-32]||0),0)*z/1000;
function jpgInfo(url){const b=Uint8Array.from(atob(url.split(',')[1]),c=>c.charCodeAt(0));let i=2;while(i<b.length){if(b[i]!==255){i++;continue}const m=b[i+1];if(m>=192&&m<=207&&m!==196&&m!==200&&m!==204)return{bytes:b,h:b[i+5]*256+b[i+6],w:b[i+7]*256+b[i+8],n:b[i+9]};i+=2+b[i+2]*256+b[i+3]}return null}
function pdfNew(){const W=595.28,H=841.89,pg=[];let ops=null,img=null;
 const col=c=>{c=c||'#000000';return[1,3,5].map(i=>(parseInt(c.slice(i,i+2),16)/255).toFixed(3)).join(' ')},n2=v=>(+v).toFixed(2);
 const d={W,H,
  page(){ops=[];pg.push(ops)},
  text(x,y,s,z,o){o=o||{};const w=pdfW(s,z,o.b);if(o.al==='r')x-=w;else if(o.al==='c')x-=w/2;ops.push('BT /'+(o.b?'F2':'F1')+' '+z+' Tf '+col(o.c)+' rg '+n2(x)+' '+n2(H-y)+' Td <'+pdfBytes(s).map(c=>c.toString(16).padStart(2,'0')).join('')+'> Tj ET')},
  line(x1,y1,x2,y2,w,c){ops.push(col(c)+' RG '+(w||.5)+' w '+n2(x1)+' '+n2(H-y1)+' m '+n2(x2)+' '+n2(H-y2)+' l S')},
  rect(x,y,w,h,fill,stroke){ops.push((fill?col(fill)+' rg ':'')+(stroke?col(stroke)+' RG .5 w ':'')+n2(x)+' '+n2(H-y-h)+' '+n2(w)+' '+n2(h)+' re '+(fill&&stroke?'B':fill?'f':'S'))},
  image(im,x,y,w,h){img=im;ops.push('q '+n2(w)+' 0 0 '+n2(h)+' '+n2(x)+' '+n2(H-y-h)+' cm /Im1 Do Q')},
  build(foot){const N=pg.length;pg.forEach((o,i)=>{ops=o;foot&&foot(d,i+1,N)});
   const te=new TextEncoder(),parts=[],off=[];let len=0;const push=u=>{parts.push(u);len+=u.length},ps=s=>push(te.encode(s)),ob=(n,s)=>{off[n]=len;ps(n+' 0 obj\n'+s+'\nendobj\n')};
   ps('%PDF-1.4\n');const tot=5+2*N,kids=pg.map((_,i)=>(6+2*i)+' 0 R').join(' ');
   ob(1,'<< /Type /Catalog /Pages 2 0 R >>');ob(2,'<< /Type /Pages /Kids [ '+kids+' ] /Count '+N+' >>');
   ob(3,'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');ob(4,'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
   if(img){off[5]=len;ps('5 0 obj\n<< /Type /XObject /Subtype /Image /Width '+img.w+' /Height '+img.h+' /ColorSpace /'+(img.n===1?'DeviceGray':'DeviceRGB')+' /BitsPerComponent 8 /Filter /DCTDecode /Length '+img.bytes.length+' >>\nstream\n');push(img.bytes);ps('\nendstream\nendobj\n')}else ob(5,'null');
   pg.forEach((o,i)=>{const c=o.join('\n');ob(6+2*i,'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 '+W+' '+H+'] /Resources << /Font << /F1 3 0 R /F2 4 0 R >>'+(img?' /XObject << /Im1 5 0 R >>':'')+' >> /Contents '+(7+2*i)+' 0 R >>');
    off[7+2*i]=len;ps((7+2*i)+' 0 obj\n<< /Length '+te.encode(c).length+' >>\nstream\n'+c+'\nendstream\nendobj\n')});
   const xr=len;ps('xref\n0 '+(tot+1)+'\n0000000000 65535 f \n');for(let i=1;i<=tot;i++)ps(String(off[i]).padStart(10,'0')+' 00000 n \n');
   ps('trailer\n<< /Size '+(tot+1)+' /Root 1 0 R >>\nstartxref\n'+xr+'\n%%EOF');
   const out=new Uint8Array(len);let p=0;for(const u of parts){out.set(u,p);p+=u.length}return out}};
 return d}
function pdfWrap(s,z,b,mw){const out=[];for(const para of String(s||'').split('\n')){let l='';for(const w of para.split(/\s+/).filter(Boolean)){const t=l?l+' '+w:w;if(pdfW(t,z,b)>mw&&l){out.push(l);l=w}else l=t}out.push(l)}return out.filter((x,i,a)=>x||i<a.length-1)}
/* intestazione ditta: logo + nome + indirizzo/P.IVA; restituisce la y da cui continuare */
function pdfHead(d,title,sub){const c=cf(),M=40,im=c.logo?jpgInfo(c.logo):null;let y=40,x=M,bot=y;
 if(im){const h=Math.min(46,110*im.h/im.w),w=h*im.w/im.h;d.image(im,M,y,w,h);x=M+w+12;bot=y+h}
 d.text(x,y+13,c.name||'Presenze & Ticket Pro',16,{b:1,c:'#1a2233'});let ty=y+13;
 for(const l of pdfWrap(c.head,8.5,0,d.W-M-x).slice(0,4)){ty+=11;d.text(x,ty,l,8.5,{c:'#5b6578'})}
 bot=Math.max(bot,ty);y=bot+10;d.line(M,y,d.W-M,y,1,'#4f46e5');y+=26;
 d.text(M,y,title,14,{b:1,c:'#1a2233'});y+=15;if(sub){d.text(M,y,sub,10,{c:'#5b6578'});y+=8}return y+10}
/* tabella con intestazione ripetuta; cols: [{h,w,al}], rows: [{c:[...],fill,b,col}] */
function pdfTable(d,y,cols,rows){const M=40,RH=15,top=40,lim=d.H-70,TW=cols.reduce((a,c)=>a+c.w,0);
 const head=yy=>{d.rect(M,yy,TW,RH+1,'#4f46e5');let x=M;for(const c of cols){d.text(c.al==='r'?x+c.w-5:x+5,yy+11,c.h,8.5,{b:1,c:'#ffffff',al:c.al});x+=c.w}return yy+RH+1};
 y=head(y);for(const r of rows){if(y+RH>lim){d.page();y=head(top)}
  if(r.fill)d.rect(M,y,TW,RH,r.fill);let x=M;
  cols.forEach((c,i)=>{let s=String(r.c[i]??''),mw=c.w-10;while(s.length>1&&pdfW(s,8.5,r.b)>mw)s=s.slice(0,-1);d.text(c.al==='r'?x+c.w-5:x+5,y+10.5,s,8.5,{b:r.b,c:r.col,al:c.al});x+=c.w});
  d.line(M,y+RH,M+TW,y+RH,.3,'#e2e7f1');y+=RH}
 return y}
const pdfFoot=(d,i,N)=>{d.line(40,d.H-42,d.W-40,d.H-42,.4,'#c9d0de');d.text(40,d.H-30,'Generato il '+new Date().toLocaleDateString('it-IT')+' alle '+hm(new Date())+' · '+(cf().name||'Presenze & Ticket Pro'),7.5,{c:'#7b8499'});d.text(d.W-40,d.H-30,'Pagina '+i+' di '+N,7.5,{c:'#7b8499',al:'r'})};
function pdfSave(d,fn){if(!dl)return toast('Download non disponibile');dl.save({filename:fn,data:d.build(pdfFoot)}).catch(()=>{})}
const GS=['Dom','Lun','Mar','Mer','Gio','Ven','Sab'];
function repPdf(u,y,mo){const d=pdfNew(),n=new Date(y,mo+1,0).getDate(),r=calc(u,y,mo);d.page();
 let yy=pdfHead(d,'Report presenze · '+MESI[mo]+' '+y,'Dipendente: '+nm(u)+(S.staff[u]?.email?' · '+S.staff[u].email:''));
 const rows=[];for(let i=1;i<=n;i++){const t=new Date(y,mo,i,12),dt=ymd(t),hn=holName(dt),sd=sE(u,dt),wk=!sch(u,dt),x=S.days[u+'_'+dt],q=Object.values(S.reqs).find(q=>q.uid===u&&q.status==='approved'&&q.type!=='modifica'&&q.from<=dt&&dt<=q.to),
  nt=hn?'Festività: '+hn:wk&&!x?.in?(t.getDay()%6===0?'Weekend':'Riposo'):q?(q.type==='permesso'?(q.kind?ptName(q.kind):'Permesso')+(q.full?'':q.hin?' '+q.hin+'-'+q.hout:q.hours?' '+q.hours+' h':''):TL[q.type]):x&&x.in&&!x.out?'Uscita mancante':'';
  const rr=x&&((x.in&&rIn(x.in)!==x.in)||(x.out&&rOut(x.out)!==x.out))?'reale '+(x.in||'')+(x.out?'-'+x.out:''):'';
  rows.push({c:[GS[t.getDay()]+' '+pad(i)+'/'+pad(mo+1),x?.in?rIn(x.in)+(mk(x,'in')?' *':''):'',x?x.out?rOut(x.out)+(mk(x,'out')?' *':''):'':'',x?.in?String(x.pause||0)+' min':'',x?.out?f1(net(x)):'',x?.out&&ot(net(x),sd)?f1(ot(net(x),sd)):'',[nt,rr].filter(Boolean).join(' · ')],fill:wk?'#f1f3f8':null,col:wk?'#8a93a6':null})}
 yy=pdfTable(d,yy,[{h:'Data',w:80},{h:'Entrata',w:55,al:'r'},{h:'Uscita',w:55,al:'r'},{h:'Pausa',w:55,al:'r'},{h:'Ore nette',w:60,al:'r'},{h:'Straord.',w:55,al:'r'},{h:'Note',w:155}],rows);
 if(rows.some(r=>/\*/.test(r.c[1]+r.c[2]))){yy+=12;d.text(40,yy,'* orario inserito a mano e non con il tasto di timbratura',8,{c:'#5b6578'})}
 if(yy>d.H-190){d.page();yy=50}yy+=18;const T=[['Lavoro',r.w],['Straordinario',r.o],['Permesso',r.p],['Ferie',r.f],['Malattia',r.s]],bw=(d.W-80-40)/5;
 T.forEach(([l,v],i)=>{const x=40+i*(bw+10);d.rect(x,yy,bw,38,'#f1f3f8');d.text(x+8,yy+14,l,8.5,{c:'#5b6578'});d.text(x+8,yy+30,f1(v)+' h',13,{b:1,c:'#1a2233'})});
 yy+=84;d.line(40,yy,230,yy,.6,'#1a2233');d.line(d.W-230,yy,d.W-40,yy,.6,'#1a2233');d.text(40,yy+12,'Firma del dipendente',8.5,{c:'#5b6578'});d.text(d.W-230,yy+12,'Firma del datore di lavoro',8.5,{c:'#5b6578'});
 pdfSave(d,'report-'+y+'-'+pad(mo+1)+'-'+nm(u).replace(/[^\w.-]+/g,'_')+'.pdf')}
function teamPdf(team,y,mo){const d=pdfNew();d.page();let yy=pdfHead(d,'Riepilogo team · '+MESI[mo]+' '+y,'Ore del mese per dipendente');
 const sum=i=>team.reduce((a,t)=>a+(+String(t[i]).replace(',','.')||0),0);
 yy=pdfTable(d,yy,[{h:'Dipendente',w:195},{h:'Lavoro',w:64,al:'r'},{h:'Straord.',w:64,al:'r'},{h:'Permesso',w:64,al:'r'},{h:'Ferie',w:64,al:'r'},{h:'Malattia',w:64,al:'r'}],
  [...team.map((t,i)=>({c:[t[0],...t.slice(2)],fill:i%2?'#f8f9fc':null})),{c:['Totale',...[2,3,4,5,6].map(i=>f1(sum(i)))],b:1,fill:'#e8ebf5'}]);
 pdfSave(d,'team-'+y+'-'+pad(mo+1)+'.pdf')}
