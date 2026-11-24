/* Presenze & Ticket Pro · Strumenti comuni, ruoli, arrotondamento orari, tipi di permesso, festività, saldi.
   I file della cartella js/ si caricano in ordine (vedi index.html) e condividono le stesse variabili. */
const $=s=>document.querySelector(s);
const E=(t,a,...c)=>{const e=document.createElement(t);for(const k in a||{}){const v=a[k];if(k==='class')e.className=v;else if(k.startsWith('on'))e[k]=v;else if(v!=null&&v!==false)e.setAttribute(k,v===true?'':v)}for(const x of c.flat())if(x!=null&&x!==false)e.append(x.nodeType?x:document.createTextNode(x));return e};
const pad=n=>String(n).padStart(2,'0'),ymd=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()),hm=d=>pad(d.getHours())+':'+pad(d.getMinutes());
const mn=t=>{const[a,b]=t.split(':');return+a*60+ +b},f1=n=>(Math.round(n*100)/100).toString().replace('.',',');
const MESI=['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];
const TL={ferie:'Ferie',malattia:'Malattia',permesso:'Permesso',modifica:'Modifica calendario'},ST={pending:'In attesa',approved:'Approvata',rejected:'Rifiutata'};
let S={tab:'oggi',m:new Date(),sel:null,day:null,staff:{},days:{},reqs:{},tix:{},groups:{},ex:{},settings:{},notifs:{}},db,dl,inv,uid,owner=false,role='user',me;
const isA=()=>role!=='user',canR=q=>isA()||(q.uid===uid&&q.status==='pending'),P=k=>k==='canPunch'?(S.staff[uid]||{}).canPunch!==false:isA()||(S.staff[uid]||{})[k]!==false,nm=id=>S.staff[id]?.name||S.staff[id]?.email||(S.ex[id]?(S.ex[id].name||S.ex[id].email||'Utente')+' (ex)':'Utente'),allIds=()=>[...Object.keys(S.staff),...Object.keys(S.ex).filter(k=>!S.staff[k])];
const cf=()=>{const c=S.settings.company||{};return{name:c.name||'',in:c.in||'09:00',out:c.out||'18:00',pause:c.pause??60,ot:c.ot??30,logo:c.logo||'',head:c.head||'',hol:Array.isArray(c.hol)?c.hol:[]}},std=()=>Math.max(1,(mn(cf().out)-mn(cf().in)-cf().pause)/60),ot=(h,s)=>{s=s??std();const x=s===0?h:h-s>=cf().ot/60?h-s:0,b=rnd().otStep;return b?Math.floor(x*60/b+1e-6)*b/60:x},PAUSES=[[0,'Nessuna'],[30,'30 minuti'],[45,'45 minuti'],[60,'1 ora'],[90,'1 ora e 30']],net=d=>d&&d.in&&d.out?Math.max(0,(mn(rOut(d.out,d))-mn(rIn(d.in,d))-(+d.pause||0))/60):0;
/* arrotondamento degli orari (Proprietario e Admin, in Team): l'orario vero resta salvato, si arrotondano solo le ore calcolate */
const rnd=()=>({inStep:0,inDir:'up',outStep:0,outDir:'down',otStep:0,inTol:0,outTol:0,...((S.settings.rules||{}).rnd||{})});
const rT=(t,st,dir)=>{if(!t||!+st||!/^\d{1,2}:\d{2}$/.test(t))return t;const m=mn(t),x=Math.min(1439,dir==='up'?Math.ceil(m/st)*st:dir==='down'?Math.floor(m/st)*st:Math.round(m/st)*st);return pad(Math.floor(x/60))+':'+pad(x%60)};
/* tolleranza: chi entra entro N minuti dopo l'orario previsto (o esce entro N minuti prima) conta l'orario previsto. d = giornata timbrata (uid, date) */
const tolT=(t,d,k)=>{const tl=+rnd()[k+'Tol'];if(!tl||!d||!/^\d{1,2}:\d{2}$/.test(t||''))return null;const u=d.uid||(d.id||'').slice(0,-11),dt=d.date||(d.id||'').slice(-10),s=u&&dt?effSch(u,dt):null;if(!s||!s[k])return null;const x=mn(s[k]),m=mn(t);return(k==='in'?m>x&&m<=x+tl:m<x&&m>=x-tl)?s[k]:null};
const rIn=(t,d)=>tolT(t,d,'in')||rT(t,rnd().inStep,rnd().inDir),rOut=(t,d)=>tolT(t,d,'out')||rT(t,rnd().outStep,rnd().outDir),rShow=(t,f,d)=>!t?'':f(t,d)===t?t:f(t,d)+' (reale '+t+')';
/* tipi di permesso: [codice, nome, scala dal saldo permessi di base] */
const PT=[['rol','ROL',1],['exf','Ex festività',1],['vis','Visita medica'],['l104','Legge 104'],['cpar','Congedo parentale'],['pat','Congedo di paternità'],['mat','Maternità'],['allat','Riposi per allattamento'],['mfig','Malattia del figlio'],['lutto','Lutto o grave infermità familiare'],['matr','Congedo matrimoniale'],['studio','Diritto allo studio, 150 ore'],['esami','Permesso per esami'],['sangue','Donazione di sangue o midollo'],['sind','Permesso sindacale'],['elett','Seggio elettorale'],['volont','Protezione civile e volontariato'],['nr','Permesso non retribuito'],['altro','Altro permesso']];
const ptC=k=>((S.settings.rules||{}).pt||{})[k]||{},ptOn=k=>ptC(k).on!==false,ptBal=k=>!k?true:ptC(k).bal??!!(PT.find(p=>p[0]===k)||[])[2],ptName=k=>(PT.find(p=>p[0]===k)||[])[1]||'Permesso';
/* ore di una richiesta in un giorno con s ore previste; permesso a ore: dalle hin alle hout */
const qH=(q,s)=>q.type!=='permesso'||q.full?s:Math.min(q.hin&&q.hout?Math.max(0,mn(q.hout)-mn(q.hin))/60:+q.hours||0,s),hrly=q=>q.type==='permesso'&&!q.full&&!!q.hin&&!!q.hout;
const pDesc=q=>q.type!=='permesso'?'':' · '+(q.kind?ptName(q.kind)+' · ':'')+(q.full?'giornata intera':q.hin&&q.hout?'dalle '+q.hin+' alle '+q.hout:(q.hours||0)+' h/giorno');
/* festività italiane, orario di ogni dipendente, saldo ferie e permessi */
const easter=y=>{const a=y%19,b=Math.floor(y/100),c=y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),x=h+l-7*m+114;return new Date(y,Math.floor(x/31)-1,x%31+1,12)};
const HOLF={'01-01':'Capodanno','01-06':'Epifania','04-25':'Festa della Liberazione','05-01':'Festa del Lavoro','06-02':'Festa della Repubblica','08-15':'Ferragosto','11-01':'Ognissanti','12-08':'Immacolata','12-25':'Natale','12-26':'Santo Stefano'},HOLE={};
const holName=dt=>{if(!dt)return'';const y=+dt.slice(0,4);if(!HOLE[y]){const e=easter(y),m={[ymd(e)]:'Pasqua'};e.setDate(e.getDate()+1);m[ymd(e)]='Lunedì dell\'Angelo';HOLE[y]=m}
 const x=cf().hol.find(h=>h&&(h.d===dt||h.d===dt.slice(5)));return HOLF[dt.slice(5)]||HOLE[y][dt]||(x?x.n||'Chiusura aziendale':'')};
const WDN=['Domenica','Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato'],WDO=[1,2,3,4,5,6,0];
const hrOf=u=>(S.staff[u]||{}).hr||{},defWk=()=>{const c=cf(),o={};[1,2,3,4,5].forEach(i=>o[i]={in:c.in,out:c.out,pause:c.pause});return o};
const wkOf=u=>{const w=hrOf(u).wk;return w&&typeof w==='object'?w:defWk()};
const sch=(u,dt)=>{if(holName(dt))return null;const s=wkOf(u)[new Date(dt+'T12:00').getDay()];return s&&s.in&&s.out?s:null};
const schH=s=>s?Math.max(0,(mn(s.out)-mn(s.in)-(+s.pause||0))/60):0,stdU=(u,dt)=>schH(sch(u,dt));
const wkTxt=u=>{const w=wkOf(u),g={};WDO.forEach(i=>{const s=w[i];if(s&&s.in&&s.out){const k=s.in+'–'+s.out;(g[k]=g[k]||[]).push(WDN[i].slice(0,3))}});const t=Object.entries(g).map(([k,d])=>d.join(', ')+' '+k).join(' · ');return t||'nessun giorno lavorativo'};
const dayH=u=>{const w=wkOf(u),l=WDO.map(i=>schH(w[i]&&w[i].in&&w[i].out?w[i]:null)).filter(Boolean);return l.length?l.reduce((a,b)=>a+b,0)/l.length:std()};
const reqH=(q,a,b)=>{let h=0;const f=a&&q.from<a?a:q.from,l=b&&q.to>b?b:q.to;for(let t=new Date(f+'T12:00');ymd(t)<=l;t.setDate(t.getDate()+1)){const s=stdU(q.uid,ymd(t));if(s)h+=qH(q,s)}return h};
const hasBal=u=>{const h=hrOf(u);return h.fy>0||h.py>0||!!h.f0||!!h.p0};
function bal(u){const h=hrOf(u),n=new Date(),d0=/^\d{4}-\d{2}-\d{2}$/.test(h.d0||'')?h.d0:n.getFullYear()+'-01-01',mesi=Math.max(0,(n.getFullYear()-+d0.slice(0,4))*12+n.getMonth()-(+d0.slice(5,7)-1)),o={d0,mesi};
 for(const[k,y,i0]of[['ferie','fy','f0'],['permesso','py','p0']]){const L=Object.values(S.reqs).filter(q=>q.uid===u&&q.type===k&&q.to>=d0&&(k!=='permesso'||ptBal(q.kind))),sum=st=>L.filter(q=>q.status===st).reduce((a,q)=>a+reqH(q,d0),0);
  const acc=(+h[i0]||0)+(+h[y]||0)/12*mesi,used=sum('approved'),pend=sum('pending');o[k]={acc,used,pend,left:acc-used,year:+h[y]||0}}
 return o}
const gg=(u,h)=>{const d=dayH(u);return d?' (≈ '+f1(Math.round(h/d*2)/2)+' gg)':''};
function balCard(u,tit){if(!hasBal(u))return isA()?E('div',{class:'card mu'},'Saldo ferie e permessi di '+nm(u)+' non ancora impostato: impostalo in Team, «🕘 Orario e ferie».'):null;const b=bal(u),M=MESI[(new Date().getMonth()+11)%12];
 const row=(l,x,dd)=>E('tr',{},E('td',{},l),E('td',{},f1(x.acc)+' h'),E('td',{},f1(x.used)+' h'),E('td',{},x.pend?f1(x.pend)+' h':'—'),E('td',{style:'font-weight:700;color:'+(x.left-x.pend<0?'var(--er)':'inherit')},f1(x.left)+' h'+(dd?gg(u,x.left):'')));
 return E('div',{class:'card'},E('h2',{},tit||'Saldo ferie e permessi'),E('table',{},E('tr',{},['','Maturate','Usate','In attesa','Residuo'].map(x=>E('th',{},x))),row('Ferie',b.ferie,1),row('Permessi',b.permesso)),
  E('p',{class:'mu'},'Conteggio dal '+new Date(b.d0+'T12:00').toLocaleDateString('it-IT')+(b.mesi?', maturate fino a fine '+M.toLowerCase():', nessun mese ancora maturato')+'. Le ore maturano ogni mese (1/12 di quelle annuali). Festivi e giorni di riposo non consumano ferie.'))}
const toast=m=>{const t=$('#toast');t.textContent=m;t.style.display='block';clearTimeout(t.h);t.h=setTimeout(()=>t.style.display='none',3000)};
const reqsOn=(u,dt,m)=>Object.values(S.reqs).filter(q=>q.uid===u&&q.status!=='rejected'&&(m||q.type!=='modifica')&&q.from<=dt&&dt<=q.to);
const mineT=(t,u)=>t.uid===u||(t.assignees||[]).includes(u),tixOn=(u,dt)=>Object.values(S.tix).filter(t=>mineT(t,u)&&t.due===dt);
const err=e=>toast('Errore: '+(e?.message||e));
const run=async p=>{try{await p}catch(e){err(e)}};
/* ore previste in un giorno tolte le ore di permesso approvate */
/* ore in formato leggibile: 8,33 → «8 h 20 min» (corto: «8h20») */
const fHM=(h,c)=>{const m=Math.round((+h||0)*60),a=Math.floor(m/60),b=m%60;return c?a+'h'+(b?pad(b):''):a+' h'+(b?' '+b+' min':'')};
/* permessi approvati di un giorno: ore conteggiate e tipi */
const pDay=(u,dt)=>{const s=stdU(u,dt),L=s?Object.values(S.reqs).filter(q=>q.uid===u&&q.type==='permesso'&&q.status==='approved'&&q.from<=dt&&dt<=q.to):[];return{h:L.reduce((a,q)=>a+qH(q,s),0),t:[...new Set(L.map(q=>q.kind?ptName(q.kind):'Permesso'))].join(', ')}};
const permH=(u,dt)=>{const s=stdU(u,dt);return Object.values(S.reqs).filter(q=>q.uid===u&&q.type==='permesso'&&q.status==='approved'&&q.from<=dt&&dt<=q.to).reduce((a,q)=>a+qH(q,s),0)},sE=(u,dt)=>Math.max(0,stdU(u,dt)-permH(u,dt));
/* permesso a ore di oggi (approvato o in attesa) e orario previsto spostato di conseguenza */
const hpOn=(u,dt)=>reqsOn(u,dt).filter(hrly).sort((a,b)=>(a.status==='approved'?0:1)-(b.status==='approved'?0:1))[0],
 effSch=(u,dt)=>{const s=sch(u,dt);if(!s)return s;const q=reqsOn(u,dt).find(q=>hrly(q)&&q.status==='approved');if(!q)return s;const o={...s};if(mn(q.hin)<=mn(s.in))o.in=q.hout;else if(mn(q.hout)>=mn(s.out))o.out=q.hin;return o},
 hpTxt=(q,s)=>{const pre='Oggi sei in permesso'+(q.kind?' ('+ptName(q.kind)+')':'')+' dalle '+q.hin+' alle '+q.hout+(q.status==='pending'?' (richiesta in attesa)':'');if(!s)return pre+'.';return pre+(mn(q.hin)<=mn(s.in)?': entrata prevista alle '+q.hout+'.':mn(q.hout)>=mn(s.out)?': uscita prevista alle '+q.hin+'. Ricordati di timbrare l\'uscita quando vai via.':': timbra l\'uscita alle '+q.hin+' e rientra alle '+q.hout+'.')};
function calc(u,y,m){const r={w:0,o:0,p:0,f:0,s:0,pk:{}};const n=new Date(y,m+1,0).getDate();
 for(let i=1;i<=n;i++){const dt=ymd(new Date(y,m,i)),d=S.days[u+'_'+dt];if(d){const h=net(d),s=sE(u,dt);r.w+=Math.min(h,s);r.o+=ot(h,s)}}
 for(const q of Object.values(S.reqs)){if(q.uid!==u||q.status!=='approved'||q.type==='modifica')continue;
  for(let t=new Date(q.from+'T12:00');ymd(t)<=q.to;t.setDate(t.getDate()+1)){const s=stdU(u,ymd(t));if(t.getFullYear()!==y||t.getMonth()!==m||!s)continue;
   const v=qH(q,s);r[q.type==='ferie'?'f':q.type==='malattia'?'s':'p']+=v;if(q.type==='permesso'){const k=q.kind||'';r.pk[k]=(r.pk[k]||0)+v}}}
 return r}
