/* Presenze & Ticket Pro · Ticket: agenda, giornata, settimana, elenco, archivio; disegno delle viste.
   I file della cartella js/ si caricano in ordine (vedi index.html) e condividono le stesse variabili. */
/* ticket: viste Oggi / Settimana / Mese / Tutti, colori per scadenza e urgenza */
const PR={urgente:['Urgente','#e00018'],alta:['Alta','#ff6a00'],normale:['Normale','#3b5bff'],bassa:['Bassa','#7b8794']},PRK=['urgente','alta','normale','bassa'];
const TC={late:'Scaduto',today:'Oggi',soon:'Entro 3 giorni',week:'Entro 7 giorni',far:'Più avanti',none:'Senza data',done:'Fatto'};
const addD=(dt,n)=>{const d=new Date(dt+'T12:00');d.setDate(d.getDate()+n);return ymd(d)},
 fmtD=dt=>new Date(dt+'T12:00').toLocaleDateString('it-IT',{weekday:'short',day:'2-digit',month:'2-digit'}),
 fmtI=ms=>new Date(ms).toLocaleDateString('it-IT',{day:'2-digit',month:'2-digit',year:'numeric'});
function tCls(t){if(t.status==='Fatto')return'done';if(!t.due)return'none';const T=today();if(t.due<T)return'late';if(t.due===T)return'today';if(t.due<=addD(T,3))return'soon';if(t.due<=addD(T,7))return'week';return'far'}
const tSort=(a,b)=>((a.due||'9')+(a.time||'99:99')).localeCompare((b.due||'9')+(b.time||'99:99'))||PRK.indexOf(a.prio||'normale')-PRK.indexOf(b.prio||'normale')||(a.created||0)-(b.created||0);
let tVis=[];
function tRow(t,o){o=o||{};tVis.push(t.id);const sl=S.tsel,on=!!sl&&sl.has(t.id);const k=tCls(t),p=PR[t.prio]||PR.normale,a=(t.assignees||[]).map(nm),
  meta=[t.due&&!o.noDate?fmtD(t.due)+(t.time?' '+t.time:''):t.due?'':'Senza data',a.length?'👤 '+a.join(', '):'',t.audio?'🎤 vocale':'',t.status==='Attesa'?'⏸ in attesa':'',t.status==='Fatto'&&t.doneAt?'completato il '+fmtI(t.doneAt):''].filter(Boolean).join(' · '),ins=(t.created?'Inserito il '+fmtI(t.created):'')+(t.uid!==uid?(t.created?' · ':'')+'da '+nm(t.uid):'');
 return E('div',{class:'tr '+k+(on?' sel':''),style:'--pc:'+p[1],onclick:()=>{if(sl){on?sl.delete(t.id):sl.add(t.id);render()}else tixDetail(t)}},
  sl?E('input',{type:'checkbox',class:'ck',checked:on}):null,
  o.tm?E('div',{class:'ttm'},t.time||'—'):null,
  E('div',{class:'tt'},E('b',{style:t.status==='Fatto'?'text-decoration:line-through':''},t.title),meta?E('div',{class:'mu'},meta):null,ins?E('div',{class:'mu ins'},ins):null),
  t.prio&&t.prio!=='normale'?E('span',{class:'tag',style:'background:'+p[1]},p[0]):null,
  !sl&&t.status!=='Fatto'?E('button',{class:'btn gh sm',title:'Segna come fatto',onclick:e=>{e.stopPropagation();doneModal(t)}},'✓'):null,
  !sl&&t.status==='Fatto'&&tEd(t)?E('button',{class:'btn gh sm',title:'Ripristina',onclick:e=>{e.stopPropagation();run(setSt(t,'Fare'));toast('Ticket ripristinato')}},'↩'):null)}
function tixDetail(t){const k=tCls(t),p=PR[t.prio]||PR.normale,a=(t.assignees||[]).map(nm),can=isA()||t.uid===uid,
  ln=(l,v)=>v?E('div',{},E('span',{class:'mu'},l+': '),v):null;
 modal(t.title,E('div',{},E('div',{class:'row',style:'margin-bottom:6px'},E('span',{class:'tag',style:'background:'+p[1]},'Urgenza: '+p[0]),E('span',{class:'tag tc '+k},TC[k]),E('span',{class:'tag'},{Fare:'Da fare',Attesa:'In attesa',Fatto:'Fatto'}[t.status]||t.status)),
   t.desc?E('p',{style:'white-space:pre-wrap'},t.desc):null,t.audio&&voice?audioEl(t.audio):null,t.photo?E('img',{class:'ph',src:t.photo,onclick:()=>showPh(t.photo)}):null,
   ln('Scadenza',t.due?fmtD(t.due)+(t.time?' alle '+t.time:''):'nessuna'),ln('Inserito il',t.created?fmtI(t.created)+' da '+nm(t.uid):'da '+nm(t.uid)),
   ln('Assegnato a',a.length?a.join(', ')+((t.gnames||[]).length?' · gruppi: '+t.gnames.join(', '):''):''),repView(t),t.status==='Fatto'&&canRep(t)?E('button',{class:'btn gh sm',style:'margin-top:6px',onclick:()=>doneModal(t)},t.rep?'✏️ Modifica materiale e ore':'🧰 Aggiungi materiale e ore'):null,
   E('div',{class:'row',style:'margin-top:10px'},...['Fare','Attesa','Fatto'].filter(s=>s!==t.status).map(s=>E('button',{class:'btn gh sm',onclick:()=>{if(s==='Fatto')return doneModal(t);run(setSt(t,s));close()}},'→ '+{Fare:'Da fare',Attesa:'In attesa',Fatto:'Fatto'}[s])),
    S.staff[uid]?.calSync&&t.due?E('button',{class:'btn gh sm',onclick:()=>calModal(t)},'📅 Calendario'):null,
    can?E('button',{class:'btn gh sm',onclick:()=>tixModal(t)},'✏️ Modifica'):null,
    hist?.tix?E('button',{class:'btn gh sm',onclick:()=>tixHist(t)},'🕓 Storico modifiche'):null,
    can?E('button',{class:'btn gh sm',onclick:()=>ask('Eliminare il ticket?',()=>{run(db.doc('tix/'+t.id).delete());if(t.audio&&voice)voice.del(t.audio.path).catch(()=>{})})},'🗑 Elimina'):null)),[E('button',{class:'btn',onclick:close},'Chiudi')])}

/* storico modifiche del ticket (tabella tix_log, scritta dal database) */
const TXF={title:'Titolo',desc:'Descrizione',status:'Stato',prio:'Urgenza',due:'Scadenza',time:'Ora',dur:'Durata',rem:'Promemoria',assignees:'Assegnato a',gnames:'Gruppi',photo:'Foto',audio:'Vocale',uid:'Inserito da',preventivo:'Preventivo'},
 TXS={Fare:'Da fare',Attesa:'In attesa',Fatto:'Fatto'};
function txv(k,v){if(v==null||v===''||(Array.isArray(v)&&!v.length))return'—';
 if(k==='status')return TXS[v]||v;if(k==='prio')return(PR[v]||[v])[0];if(k==='due')return fmtD(v);
 if(k==='dur')return v>=60?(Math.floor(v/60)+' h'+(v%60?' '+v%60+' min':'')):v+' min';if(k==='rem')return+v?(v>=1440?'1 giorno':v>=60?(v/60)+' ore':v+' min')+' prima':'nessuno';
 if(k==='assignees')return[].concat(v).map(nm).join(', ');if(k==='uid')return nm(v);if(k==='gnames')return[].concat(v).join(', ');
 if(k==='photo')return v==='[nuova foto]'?'nuova foto':'foto';if(k==='audio')return'vocale';if(k==='desc'){v=String(v);return v.length>80?v.slice(0,80)+'…':v}
 if(typeof v==='object')return Array.isArray(v)?v.join(', '):(v.numero?'n. '+v.numero:JSON.stringify(v));return String(v)}
function txLines(r){const c=r.changes||{};
 if(r.action==='update')return Object.keys(c).filter(k=>TXF[k]&&Array.isArray(c[k])).map(k=>E('div',{class:'mu'},TXF[k]+': '+txv(k,c[k][0])+'  ⇒  '+txv(k,c[k][1])));
 return['status','prio','due','assignees','gnames','photo','audio'].filter(k=>c[k]!=null&&c[k]!==''&&!(Array.isArray(c[k])&&!c[k].length)&&!(k==='status'&&r.action==='insert'&&c[k]==='Fare')).map(k=>E('div',{class:'mu'},TXF[k]+': '+txv(k,c[k])))}
async function tixHist(t){if(!hist?.tix)return;let l;try{l=await hist.tix(t.id)}catch(e){return err(/tix_log/.test(e.message||'')?new Error('Lo storico dei ticket non è ancora attivo: va eseguito su Supabase il file SQL dello storico ticket.'):e)}
 const AC={insert:'Creato',update:'Modificato',delete:'Eliminato'};
 modal('Storico · '+t.title,E('div',{},l.length?null:E('p',{class:'mu'},'Nessuna modifica registrata (lo storico dei ticket parte dal 23 novembre 2026).'),
  ...l.map(r=>E('div',{style:'margin-bottom:10px'},E('b',{},dts(r.at)+' · '+AC[r.action]+' da '+(r.by_user?nm(r.by_user):'sistema')),...txLines(r)))),[E('button',{class:'btn',onclick:close},'Chiudi')])}

const tEd=t=>isA()||t.uid===uid;
function tixBar(){const ts=Object.values(S.tix).filter(t=>S.tsel.has(t.id)),n=ts.length,ok=n>0;
 return E('div',{class:'selbar'},E('b',{style:'flex:1;min-width:90px'},n+(n===1?' selezionato':' selezionati')),
  E('button',{class:'btn gh sm',onclick:()=>{const all=tVis.length&&tVis.every(i=>S.tsel.has(i));tVis.forEach(i=>all?S.tsel.delete(i):S.tsel.add(i));render()}},'Tutti/nessuno'),
  E('button',{class:'btn sm',disabled:!ok,onclick:()=>bulkModal(ts)},'✏️ Modifica'),
  E('button',{class:'btn ok sm',disabled:!ok,onclick:()=>{run(Promise.all(ts.map(t=>setSt(t,'Fatto'))));S.tsel=null;render();toast('Completati: spostati in Archivio 🗄')}},'✓ Fatti'),
  E('button',{class:'btn er sm',disabled:!ok,onclick:()=>{const d=ts.filter(tEd);if(!d.length)return toast('Non puoi eliminare questi ticket');ask('Eliminare '+d.length+(d.length===1?' ticket?':' ticket?')+(d.length<n?' ('+(n-d.length)+' non tuoi restano)':''),()=>{run(Promise.all(d.map(t=>db.doc('tix/'+t.id).delete())));S.tsel=null;render()})}},'🗑'))}
function bulkModal(ts){const bw={ack:false,el:E('div',{class:'cw',style:'display:none'})},ed=ts.filter(tEd),ab=ed.length?asgBox(null):null,
  st=E('select',{},opts([['','— non cambiare —'],['Fare','Da fare'],['Attesa','In attesa'],['Fatto','Fatto']],'')),
  pr=E('select',{},opts([['','— non cambiare —'],...PRK.map(k=>[k,PR[k][0]])],'')),
  due=E('input',{type:'date'}),nd=E('input',{type:'checkbox'}),
  rm=E('select',{},opts([['','— non cambiare —'],[0,'Nessun promemoria'],[15,'15 minuti prima'],[60,'1 ora prima'],[1440,'1 giorno prima']],''));
 modal('Modifica '+ts.length+(ts.length===1?' ticket':' ticket'),E('div',{},ed.length<ts.length?E('p',{class:'mu'},'Dei '+ts.length+' ticket, '+(ts.length-ed.length)+' sono stati assegnati da altri: per quelli puoi cambiare solo lo stato.'):null,
  fld('Stato',st),ed.length?E('div',{},fld('Urgenza',pr),fld('Nuova scadenza',due),bw.el,E('label',{class:'tgl'},nd,'Togli la scadenza'),fld('Promemoria calendario',rm),ab.el,E('p',{class:'mu'},'Gli assegnatari scelti si aggiungono a quelli già presenti.')):null),
  [cancel(),E('button',{class:'btn',onclick:ev=>{const ps=[];let ch=0;
   if(due.value&&!nd.checked&&!bw.ack){const ids=new Set(ed.map(t=>t.id)),mv=ed.map(t=>({...t,due:due.value})),bad=[];mv.forEach((m,i)=>{tConf(m,ids).filter(o=>o.k==='overlap').forEach(o=>bad.push(m.title+' ↔ '+(o.t.time||'')+' '+o.t.title));mv.slice(i+1).forEach(m2=>{if(people(m).some(p=>people(m2).includes(p))&&isOv(m,m2))bad.push(m.title+' ↔ '+m2.title)})});if(bad.length){bw.ack=true;bw.el.className='cw bad';bw.el.replaceChildren(E('b',{},'⛔ Si accavallano con altri impegni:'),...bad.slice(0,5).map(x=>E('div',{},x)),E('div',{style:'margin-top:4px'},'Scegli un\'altra data o premi «Applica comunque».'));bw.el.style.display='';ev.currentTarget.textContent='Applica comunque';return}}

   for(const t of ts){const e=tEd(t),pt={};if(st.value){pt.status=st.value;pt.doneAt=st.value==='Fatto'?Date.now():0}
    if(e){if(pr.value)pt.prio=pr.value;if(nd.checked){pt.due='';pt.time=''}else if(due.value)pt.due=due.value;if(rm.value!=='')pt.rem=+rm.value;
     const g=ab.get();if(g.assignUsers.length||g.groups.length)Object.assign(pt,asg([...new Set([...(t.assignUsers||[]),...g.assignUsers])],[...new Set([...(t.groups||[]),...g.groups])]))}
    if(Object.keys(pt).length){ch++;ps.push(db.doc('tix/'+t.id).update(pt))}}
   if(!ch)return toast('Nessuna modifica scelta');run(Promise.all(ps));close();S.tsel=null;render();toast(ch+' ticket aggiornati ✅')}},'Applica')])}
function tixLegend(){const c=k=>E('span',{class:'lgi'},E('i',{class:'tr '+k}),TC[k]);
 return E('details',{class:'card lg',open:S.tlg!==false,ontoggle:e=>{S.tlg=e.target.open}},E('summary',{},'🎨 Legenda colori'),E('div',{class:'mu',style:'margin:6px 0 4px'},'Sfondo = scadenza'),E('div',{class:'row'},['late','today','soon','week','far','none','done'].map(c)),
  E('div',{class:'mu',style:'margin:8px 0 4px'},'Barra a sinistra e etichetta = urgenza (si sceglie quando crei il ticket)'),E('div',{class:'row'},PRK.map(k=>E('span',{class:'lgi'},E('i',{class:'bar',style:'background:'+PR[k][1]}),PR[k][0]))))}
/* agenda: conflitti, anteprima giorno, archivio */
const people=t=>(t.assignees&&t.assignees.length)?t.assignees:[t.uid],tdur=t=>+t.dur||60,
 isOv=(a,b)=>a.time&&b.time&&mn(a.time)<mn(b.time)+tdur(b)&&mn(b.time)<mn(a.time)+tdur(a),
 longD=dt=>{const s=new Date(dt+'T12:00').toLocaleDateString('it-IT',{weekday:'long',day:'numeric',month:'long'});return s[0].toUpperCase()+s.slice(1)},
 setSt=(t,s)=>db.doc('tix/'+t.id).update({status:s,doneAt:s==='Fatto'?Date.now():0});
/* altri impegni nello stesso giorno per le stesse persone (skip = id o Set di id da ignorare) */
function tConf(c,skip){if(!c.due)return[];const pc=people(c),sk=skip instanceof Set?skip:new Set([skip]);
 return Object.values(S.tix).filter(t=>!sk.has(t.id)&&t.status!=='Fatto'&&t.due===c.due&&people(t).some(p=>pc.includes(p)))
  .map(t=>({t,k:isOv(c,t)?'overlap':'day',who:people(t).filter(p=>pc.includes(p)).map(nm)}))
  .sort((a,b)=>(a.k==='overlap'?0:1)-(b.k==='overlap'?0:1)||(a.t.time||'99').localeCompare(b.t.time||'99'))}
function confUi(c){if(!c.length)return[];const ov=c.some(o=>o.k==='overlap');
 return[E('b',{},ov?'⛔ Si accavalla con un altro impegno':'⚠️ Lo stesso giorno hai già altri impegni'),...c.slice(0,5).map(o=>E('div',{},(o.k==='overlap'?'⛔ ':'')+(o.t.time||'tutto il giorno')+' · '+o.t.title+(o.who.length?' ('+o.who.join(', ')+')':''))),c.length>5?E('div',{},'… e altri '+(c.length-5)):null,
  ov?E('div',{style:'margin-top:4px'},'Cambia ora o durata, oppure salva comunque.'):E('div',{style:'margin-top:4px'},'Gli orari sono diversi: controlla che non si accavallino.')].filter(Boolean)}
function dayOver(items){const o=[];for(let i=0;i<items.length;i++)for(let j=i+1;j<items.length;j++){const a=items[i],b=items[j];if(!isOv(a,b))continue;const sh=people(a).filter(p=>people(b).includes(p));if(sh.length)o.push([a,b,sh.map(nm)])}return o}
/* anteprima del giorno (mouse sopra o dito tenuto premuto e fatto scorrere) */
let pvBy={};
const hidePv=()=>{const p=document.getElementById('tpv');if(p)p.remove()};
function showPv(c){hidePv();const dt=c.dataset.d,it=(pvBy[dt]||[]).slice().sort(tSort),ov=dayOver(it).length;
 const el=E('div',{id:'tpv',class:'pv'},E('b',{},longD(dt)),E('div',{class:'mu'},it.length?it.length+(it.length===1?' impegno':' impegni')+(ov?' · ⛔ accavallamenti':''):'Giornata libera'),
  ...it.slice(0,6).map(t=>E('div',{class:'pvr',style:'--pc:'+PR[t.prio||'normale'][1]},E('span',{class:'pt'},t.time||'giorno'),E('span',{class:'pn'},t.title))),it.length>6?E('div',{class:'mu'},'+ altri '+(it.length-6)):null);
 document.body.append(el);const r=c.getBoundingClientRect(),w=el.offsetWidth,h=el.offsetHeight;
 el.style.left=Math.max(8,Math.min(innerWidth-w-8,r.left+r.width/2-w/2))+'px';el.style.top=(r.top-h-8>8?r.top-h-8:r.bottom+8)+'px'}
function wireCal(el,mm){let sx=0,sy=0,tm=null,sc=false,last=null;
 const at=(x,y)=>{const e=document.elementFromPoint(x,y);return e&&e.closest?e.closest('.mc[data-d]'):null},show=c=>{if(c===last)return;last=c;c?showPv(c):hidePv()};
 el.addEventListener('touchstart',e=>{const t=e.touches[0];sx=t.clientX;sy=t.clientY;sc=false;clearTimeout(tm);tm=setTimeout(()=>{sc=true;if(navigator.vibrate)navigator.vibrate(12);show(at(sx,sy))},350)},{passive:true});
 el.addEventListener('touchmove',e=>{const t=e.touches[0];if(!sc){if(Math.hypot(t.clientX-sx,t.clientY-sy)>10)clearTimeout(tm);return}e.preventDefault();show(at(t.clientX,t.clientY))},{passive:false});
 const end=e=>{clearTimeout(tm);if(sc){sc=false;const c=last;last=null;hidePv();if(e.cancelable)e.preventDefault();if(c){S.sd=c.dataset.d;render()}return}
  const t=e.changedTouches&&e.changedTouches[0];if(!t||e.type==='touchcancel')return;const dx=t.clientX-sx,dy=t.clientY-sy;if(Math.abs(dx)>70&&Math.abs(dy)<45){S.tm=mm+(dx<0?1:-1);S.anim=dx<0?'l':'r';render()}};
 el.addEventListener('touchend',end);el.addEventListener('touchcancel',end);el.addEventListener('contextmenu',e=>e.preventDefault());
 if(matchMedia('(hover:hover)').matches){el.addEventListener('mouseover',e=>{const c=e.target.closest?e.target.closest('.mc[data-d]'):null;show(c)});el.addEventListener('mouseleave',()=>show(null))}}
const TVS=[['mese','📆 Agenda'],['oggi','☀️ Giornata'],['sett','🗓 Settimana'],['tutti','📋 Elenco']];
function tvDef(){try{const v=localStorage.getItem('tix_def');return TVS.some(x=>x[0]===v)?v:'mese'}catch(e){return'mese'}}
function tvSet(v){try{localStorage.setItem('tix_def',v)}catch(e){}toast('Vista predefinita: '+TVS.find(x=>x[0]===v)[1].slice(3));render()}
function vTix(){tVis=[];hidePv();const T=today(),sc=S.tv||(S.tv=tvDef()),vis=Object.values(S.tix).filter(t=>isA()||mineT(t,uid)),mine=vis.filter(t=>mineT(t,uid)),mo=isA()&&S.tmine,src=mo?mine:vis,
 op=src.filter(t=>t.status!=='Fatto').sort(tSort),arch=src.filter(t=>t.status==='Fatto').sort((a,b)=>(b.doneAt||0)-(a.doneAt||0)||(b.due||'').localeCompare(a.due||'')),
 sec=(title,items,o,empty)=>E('div',{style:'margin-top:12px'},E('b',{},title+' ('+items.length+')'),items.length?items.map(t=>tRow(t,o)):E('div',{class:'mu',style:'margin-top:4px'},empty||'Nessun ticket.'));
 const tabs=E('div',{class:'seg'},[['mese','📆 Agenda'],['oggi','☀️ Giornata'],['sett','🗓 Settimana'],['tutti','📋 Elenco'],['arch','🗄 Archivio ('+arch.length+')']].map(([k,l])=>E('button',{class:'btn sm '+(sc===k?'':'gh'),onclick:()=>{S.tv=k;render()}},l)));
 const nav=(lbl,prev,next,reset)=>E('div',{class:'row sp',style:'margin:8px 0'},E('button',{class:'btn gh sm',onclick:prev},'◀'),E('b',{},lbl),E('div',{class:'row'},reset?E('button',{class:'btn gh sm',onclick:reset},'Oggi'):null,E('button',{class:'btn gh sm',onclick:next},'▶')));
 let body;
 if(sc==='oggi'){const m=mine.filter(t=>t.status!=='Fatto').sort(tSort),dd=S.days[uid+'_'+T],lv=reqsOn(uid,T)[0],od=m.filter(t=>t.due&&t.due<T),td=m.filter(t=>t.due===T);
  body=E('div',{},E('div',{class:'card',style:'margin-top:8px'},E('div',{class:'row sp'},E('b',{},new Date().toLocaleDateString('it-IT',{weekday:'long',day:'numeric',month:'long'})),E('span',{class:'mu'},td.length?td.length+' da fare':'giornata libera')),
    E('div',{class:'mu'},lv?'🏖 '+TL[lv.type]+(lv.status==='pending'?' (in attesa)':''):P('canPunch')?'Entrata '+(dd?.in||'--:--')+' · Uscita '+(dd?.out||'--:--'):'')),
   dayOver(td).length?E('div',{class:'cw bad',style:'margin-top:8px'},E('b',{},'⛔ Possibili accavallamenti oggi'),...dayOver(td).map(([a,b])=>E('div',{},(a.time||'')+' '+a.title+' ↔ '+(b.time||'')+' '+b.title))):null,
   od.length?sec('⚠️ Scaduti da completare',od,{}):null,sec('📅 Appuntamenti di oggi',td,{tm:1,noDate:1},'Nessun appuntamento oggi 🎉'),
   sec('📥 Da pianificare (senza data)',m.filter(t=>!t.due),{},'Niente da pianificare.'),sec('⏭ Prossimi',m.filter(t=>t.due>T).slice(0,5),{},'Niente in programma.'))}
 else if(sc==='sett'){const w=S.tw||0,mon=new Date();mon.setHours(12,0,0,0);mon.setDate(mon.getDate()-((mon.getDay()+6)%7)+7*w);const d0=ymd(mon),d1=addD(d0,6),fm=x=>new Date(x+'T12:00').toLocaleDateString('it-IT',{day:'numeric',month:'short'}),od=w===0?op.filter(t=>t.due&&t.due<d0):[];
  body=E('div',{},nav('Settimana '+fm(d0)+' – '+fm(d1),()=>{S.tw=w-1;render()},()=>{S.tw=w+1;render()},w?()=>{S.tw=0;render()}:null),od.length?sec('⚠️ Scaduti da prima',od,{}):null,
   ...Array.from({length:7},(_,i)=>{const dt=addD(d0,i),x=op.filter(t=>t.due===dt),ov=dayOver(x).length;return E('div',{style:'margin-top:10px'},E('div',{class:'dh'+(dt===T?' on':'')},E('b',{},fmtD(dt)),E('span',{class:'mu'},(ov?'⛔ ':'')+(x.length?x.length+' ticket':'—'))),x.map(t=>tRow(t,{noDate:1,tm:1})))}))}
 else if(sc==='mese'){const mm=S.tm||0,b=new Date();b.setHours(12,0,0,0);b.setDate(1);b.setMonth(b.getMonth()+mm);const y=b.getFullYear(),mo2=b.getMonth(),n=new Date(y,mo2+1,0).getDate(),first=(new Date(y,mo2,1).getDay()+6)%7,ym=y+'-'+pad(mo2+1),by={};
  op.forEach(t=>{if(t.due&&t.due.slice(0,7)===ym)(by[t.due]=by[t.due]||[]).push(t)});pvBy=by;if(!S.sd||S.sd.slice(0,7)!==ym)S.sd=mm===0?T:(Object.keys(by).sort()[0]||ym+'-01');
  const dc=dt=>dt<T?'late':dt===T?'today':dt<=addD(T,3)?'soon':dt<=addD(T,7)?'week':'far',cells=[...Array(first).fill(null),...Array.from({length:n},(_,i)=>i+1)];
  const grid=E('div',{class:'mg'+(S.anim?' sl'+S.anim:'')},...['L','M','M','G','V','S','D'].map(x=>E('div',{class:'mh'},x)),...cells.map(c=>{if(!c)return E('div',{});const dt=ym+'-'+pad(c),x=(by[dt]||[]).slice().sort(tSort),cf=x.length&&dayOver(x).length;
   return E('div',{class:'mc'+(x.length?' tr '+dc(dt):'')+(dt===T?' now':'')+(dt===S.sd?' selday':''),'data-d':dt,onclick:()=>{S.sd=dt;render()}},E('div',{class:'dn'},E('span',{},c),cf?E('i',{class:'wr'},'⚠️'):null),
    x.length?E('div',{class:'chips'},...x.slice(0,3).map((t,i)=>E('div',{class:'chip'+(i>1?' c3':''),style:'--pc:'+PR[t.prio||'normale'][1]},E('span',{},t.time||'●'),E('span',{class:'ct'},' '+t.title))),x.length>2?E('div',{class:'more mm'},'+'+(x.length-2)):null,x.length>3?E('div',{class:'more dd'},'+'+(x.length-3)):null):null)}));S.anim=null;
  const cal=E('div',{class:'card cal agc'},grid);wireCal(cal,mm);
  const items=(by[S.sd]||[]).slice().sort(tSort),ov=dayOver(items),total=Object.values(by).reduce((a,x)=>a+x.length,0);
  body=E('div',{class:'tsplit'},E('div',{class:'tleft'},nav(MESI[mo2]+' '+y,()=>{S.tm=mm-1;S.anim='r';render()},()=>{S.tm=mm+1;S.anim='l';render()},mm?()=>{S.tm=0;S.sd=T;S.anim=mm>0?'r':'l';render()}:null),cal,
   E('div',{class:'mu hint',style:'text-align:center;margin:-2px 0 6px'},'Scorri per cambiare mese · tieni premuto un giorno per l\'anteprima')),
   E('div',{class:'tright'},E('div',{class:'card',style:'margin-top:8px'},E('div',{class:'row sp'},E('div',{},E('b',{},longD(S.sd)),E('div',{class:'mu'},items.length?items.length+(items.length===1?' impegno':' impegni'):'Giornata libera')),E('button',{class:'btn sm',onclick:()=>tixModal(null,{due:S.sd})},'+ Aggiungi')),
    ov.length?E('div',{class:'cw bad'},E('b',{},'⛔ Possibili accavallamenti'),...ov.map(([a,c2,who])=>E('div',{},(a.time||'')+' '+a.title+' ↔ '+(c2.time||'')+' '+c2.title+(who.length?' ('+who.join(', ')+')':'')))):null,
    items.length?items.map(t=>tRow(t,{noDate:1,tm:1})):E('p',{class:'mu'},'Nessun impegno: tocca «+ Aggiungi» per inserirne uno.')),
   total?E('details',{class:'card',open:matchMedia('(min-width:1000px)').matches},E('summary',{style:'cursor:pointer;font-weight:600'},'📜 Tutti gli impegni di '+MESI[mo2]+' ('+total+')'),...Object.keys(by).sort().map(dt=>E('div',{style:'margin-top:8px'},E('div',{class:'dh'+(dt===T?' on':'')},E('b',{},fmtD(dt)),E('span',{class:'mu'},by[dt].length)),by[dt].map(t=>tRow(t,{noDate:1,tm:1}))))):null,
   (()=>{const nd=op.filter(t=>!t.due);return nd.length?sec('📥 Da pianificare (senza data)',nd,{}):null})()))}
 else if(sc==='arch')body=E('div',{},E('p',{class:'mu',style:'margin:8px 0'},'I ticket completati si nascondono dall\'agenda e restano qui. Tocca ↩ per riportarne uno tra quelli attivi.'),arch.length?arch.map(t=>tRow(t,{arch:1})):E('div',{class:'card mu'},'Archivio vuoto.'));
 else body=E('div',{},...[['Fare','🔵 Da fare'],['Attesa','🟡 In attesa']].map(([s,lb])=>sec(lb,op.filter(t=>t.status===s))));
 const bar=S.tsel?tixBar():null;
 return E('div',{style:S.tsel?'padding-bottom:70px':''},E('div',{class:'row sp'},E('h2',{},'Ticket & interventi'),E('div',{class:'row'},E('button',{class:'btn gh sm',onclick:()=>{S.tsel=S.tsel?null:new Set();render()}},S.tsel?'✕ Fine selezione':'☑ Seleziona'),E('button',{class:'btn sm',onclick:()=>tixModal()},'+ Nuovo'))),tabs,E('div',{class:'trow'},isA()&&sc!=='oggi'?E('label',{class:'tgl'},E('input',{type:'checkbox',checked:!!S.tmine,onchange:e=>{S.tmine=e.target.checked;render()}}),'Solo i miei'):E('span',{}),E('span',{class:'tlk'},TVS.some(x=>x[0]===sc)?(tvDef()===sc?E('span',{class:'mu'},'📌 Vista predefinita'):E('a',{href:'#',onclick:e=>{e.preventDefault();tvSet(sc)}},'📌 Rendi predefinita')):null,isA()?E('a',{class:'btn gh sm',href:'preventivi/',style:'text-decoration:none'},'📄 Preventivi'):null)),sc==='mese'||sc==='arch'?null:tixLegend(),body,bar)}
function vRep(){const csvR=[],u=!isA()?uid:repIds().includes(S.sel||uid)?S.sel||uid:repIds()[0]||uid,y=S.m.getFullYear(),mo=S.m.getMonth(),r=calc(u,y,mo),n=new Date(y,mo+1,0).getDate(),rows=[];
 for(let i=1;i<=n;i++){const dt=ymd(new Date(y,mo,i)),d=S.days[u+'_'+dt],pd=pDay(u,dt);if(d||pd.h){const s=sE(u,dt),pc=pd.h?f1(pd.h)+' h · '+pd.t:'';
  rows.push(d?[dt,rShow(d.in,rIn),rShow(d.out,rOut),d.pause||0,f1(net(d)),f1(Math.min(net(d),s)),f1(ot(net(d),s)),pc]:[dt,'','','','','','',pc]);
  csvR.push(d?[dt,d.in?rIn(d.in):'',d.out?rOut(d.out):'',d.pause||0,f1(net(d)),f1(Math.min(net(d),s)),f1(ot(net(d),s)),pd.h?f1(pd.h):'',pd.t,d.in||'',d.out||'']:[dt,'','','','','','',f1(pd.h),pd.t,'',''])}}
 const tot=[['Lavoro',r.w],['Straordinario',r.o],['Permesso',r.p],['Ferie',r.f],['Malattia',r.s]];
 const team=isA()?repIds().map(k=>[k,calc(k,y,mo)]).filter(([k,c])=>S.staff[k]||c.w+c.o+c.p+c.f+c.s>0).map(([k,c])=>[nm(k),(S.staff[k]||S.ex[k]||{}).email||'',f1(c.w),f1(c.o),f1(c.p),f1(c.f),f1(c.s)]):[];
 const th=a=>E('tr',{},a.map(x=>E('th',{},x))),td=a=>E('tr',{},a.map(x=>E('td',{},x)));
 return E('div',{},pick(1),E('div',{class:'card'},mnav(),E('div',{class:'row'},tot.map(([l,v])=>stat(l,f1(v)+' h'))),
  E('div',{class:'row',style:'margin-top:10px'},E('button',{class:'btn sm',onclick:()=>csv([['Dipendente',nm(u)],['Mese',MESI[mo]+' '+y],[],['Data','Entrata','Uscita','Pausa min','Ore nette','Ore lavoro','Straordinario','Ore permesso','Tipo permesso','Entrata reale','Uscita reale'],...csvR,[],['Totali ore'],...tot.map(([l,v])=>[l,f1(v)]),...(Object.keys(r.pk).length?[[],['Permessi per tipo'],...Object.entries(r.pk).map(([k,v])=>[k?ptName(k):'Permesso',f1(v)])]:[])],`report-${y}-${pad(mo+1)}-${nm(u)}.csv`)},'📥 Esporta CSV'),E('button',{class:'btn sm',onclick:()=>repPdf(u,y,mo)},'📄 Esporta PDF'))),
  E('div',{class:'card'},E('h2',{},'Presenze del mese'),E('table',{},th(['Data','Entr.','Usc.','Pausa','Nette','Lavoro','Straord.','Permessi']),rows.map(td),rows.length?null:E('tr',{},E('td',{colspan:8},'Nessuna presenza.'))),rows.length?E('p',{class:'mu'},'Ore in centesimi: per esempio 8,33 h = 8 h 20 min.'):null,rnd().inStep||rnd().outStep||rnd().otStep?E('p',{class:'mu'},'Ore calcolate con l\'arrotondamento della ditta ('+rndTxt()+'). Tra parentesi l\'orario reale timbrato.'):null),
  Object.keys(r.pk).length?E('div',{class:'card'},E('h2',{},'Permessi per tipo'),E('table',{},th(['Tipo','Ore']),Object.entries(r.pk).map(([k,v])=>td([k?ptName(k):'Permesso',f1(v)+' h'])))):null,
  isA()?E('div',{class:'card'},E('div',{class:'row sp'},E('h2',{},'Riepilogo team (ore)'),E('div',{class:'row'},E('button',{class:'btn gh sm',onclick:()=>csv([['Dipendente','Email','Lavoro','Straordinario','Permesso','Ferie','Malattia'],...team],`team-${y}-${pad(mo+1)}.csv`)},'📥 CSV'),E('button',{class:'btn gh sm',onclick:()=>teamPdf(team,y,mo)},'📄 PDF'))),
   E('table',{},th(['Dipendente','Lavoro','Straord.','Perm.','Ferie','Mal.']),team.map(t=>td([t[0],...t.slice(2)])))):null,
  balCard(u,'Saldo ferie e permessi'+(isA()?' · '+nm(u):'')),
  isA()?(()=>{const L=repIds().filter(k=>S.staff[k]&&hasBal(k));return L.length?E('div',{class:'card'},E('div',{class:'row sp'},E('h2',{},'Saldo ferie e permessi del team (ore)'),E('button',{class:'btn gh sm',onclick:()=>csv([['Dipendente','Ferie maturate','Ferie usate','Ferie in attesa','Ferie residue','Permessi maturati','Permessi usati','Permessi in attesa','Permessi residui'],...L.map(k=>{const b=bal(k);return[nm(k),...['ferie','permesso'].flatMap(t=>[b[t].acc,b[t].used,b[t].pend,b[t].left].map(f1))]})],'saldo-ferie-permessi-'+today()+'.csv')},'📥 CSV')),
   E('table',{},th(['Dipendente','Ferie residue','Permessi residui']),L.map(k=>{const b=bal(k);return td([nm(k),f1(b.ferie.left)+' h'+gg(k,b.ferie.left),f1(b.permesso.left)+' h'])}))):null})():null)}
function vTeam(){const gn=k=>Object.values(S.groups).filter(g=>(g.members||[]).includes(k)).map(g=>g.name),gl=Object.values(S.groups).sort((a,b)=>(a.name||'').localeCompare(b.name||'')),ids=Object.keys(S.staff).sort((a,b)=>nm(a).localeCompare(nm(b)));
 const canEd=(k,s)=>(role==='super'&&k!==uid)||(role==='admin'&&s.role==='user');
 const tg=(k,f,l,s,me)=>E('label',{class:'tgl'},E('input',{type:'checkbox',checked:s[f]!==false,disabled:!me&&!canEd(k,s),onchange:e=>run(db.doc('staff/'+k).update({[f]:e.target.checked}))}),l);
 return E('div',{},E('div',{class:'card'},E('div',{class:'row sp'},E('b',{},'🏢 '+(cf().name||'Ditta non impostata')),role==='super'?E('button',{class:'btn gh sm',onclick:()=>setModal()},'⚙️ Impostazioni'):null),E('div',{class:'mu'},'Entrata '+cf().in+' · Uscita '+cf().out+' · Pausa '+cf().pause+' min · Straordinario da '+cf().ot+' min'),E('div',{class:'mu'},'⏱️ Arrotondamento: '+rndTxt()),isA()?E('div',{class:'row',style:'margin-top:6px'},E('button',{class:'btn gh sm',onclick:()=>rndModal()},'⏱️ Arrotondamento orari'),E('button',{class:'btn gh sm',onclick:()=>ptModal()},'📋 Tipi di permesso')):null),
  E('div',{class:'row sp'},E('h2',{},'Team ('+ids.length+')'),E('div',{class:'row'},E('button',{class:'btn gh sm',onclick:faqModal},'❓ FAQ'),inv&&!inv.local?E('button',{class:'btn sm',onclick:()=>inviteModal()},'✉️ Invita'):null)),
  ...ids.map(k=>{const s=S.staff[k],st=s.active===false?['Disattivato','rejected']:s.joined===false?['Invitato','pending']:['Attivo','approved'];
   return E('div',{class:'card'},E('div',{class:'row sp'},E('div',{},E('b',{},nm(k)),E('div',{class:'mu'},(s.email||'')+(gn(k).length?' · 👥 '+gn(k).join(', '):''))),E('div',{class:'row'},E('span',{class:'tag '+st[1]},st[0]),
     role==='super'&&k!==uid&&s.role!=='super'?E('select',{style:'width:auto',onchange:e=>run(db.doc('staff/'+k).update({role:e.target.value}))},opts([['user','Utente'],['admin','Admin']],s.role||'user')):E('span',{class:'tag'},s.role==='super'?'Proprietario':s.role==='admin'?'Admin':'Utente'))),
    E('div',{class:'mu',style:'margin-top:4px'},'🕘 '+(hrOf(k).wk?wkTxt(k):'Orario della ditta')+(hasBal(k)?(()=>{const b=bal(k);return' · Ferie residue '+f1(b.ferie.left)+' h · Permessi residui '+f1(b.permesso.left)+' h'})():'')),
    canEd(k,s)||(role==='super'&&k===uid)?E('div',{class:'row',style:'margin-top:6px'},E('button',{class:'btn gh sm',onclick:()=>hrModal(k)},'🕘 Orario e ferie')):null,
    s.role==='super'&&k===uid?E('div',{class:'perm'},tg(k,'canPunch','Voglio timbrare anch\'io (presenze, promemoria e report)',s,true),inv&&!inv.local?E('div',{class:'row',style:'margin-top:6px'},E('button',{class:'btn gh sm',onclick:()=>transferModal()},'🔑 Trasferisci la proprietà a un altro Admin')):null):null,
    s.role==='admin'&&role==='super'&&k!==uid?E('div',{class:'perm'},tg(k,'canPunch','Può timbrare',s)):null,
    s.role==='user'?E('div',{class:'perm'},tg(k,'canPunch','Può timbrare',s),tg(k,'canEditPast','Può modificare le timbrature passate',s),tg(k,'canRequest','Può richiedere ferie e permessi',s)):null,
    k!==uid&&canEd(k,s)&&s.role!=='super'?E('div',{class:'row',style:'margin-top:8px'},s.active===false?E('button',{class:'btn ok sm',onclick:()=>run(db.doc('staff/'+k).update({active:true})).then(()=>toast(nm(k)+' riattivato'))},'✅ Riattiva'):E('button',{class:'btn gh sm',onclick:()=>ask('Disattivare '+nm(k)+'? Non potrà più entrare finché non lo riattivi; timbrature e storico restano.',()=>run(db.doc('staff/'+k).update({active:false})).then(()=>toast(nm(k)+' disattivato')),'Disattiva')},'⏸ Disattiva'),inv&&!inv.local&&s.active!==false?E('button',{class:'btn gh sm',onclick:()=>inviteModal(s)},'🔗 Link di accesso'):null,inv?E('button',{class:'btn er sm',onclick:()=>delModal(k)},'🗑 Elimina utente'):null):null)}),
  E('div',{class:'row sp',style:'margin-top:14px'},E('h2',{},'Gruppi ('+gl.length+')'),E('button',{class:'btn sm',onclick:()=>groupModal()},'+ Nuovo gruppo')),
  ...gl.map(g=>{const m=(g.members||[]).filter(i=>S.staff[i]);return E('div',{class:'card'},E('div',{class:'row sp'},E('b',{},'👥 '+g.name),E('div',{class:'row'},E('button',{class:'btn gh sm',onclick:()=>groupModal(g)},'✏️ Modifica'),E('button',{class:'btn gh sm',onclick:()=>ask('Eliminare il gruppo «'+g.name+'»? I ticket assegnati al gruppo non saranno più assegnati ai suoi membri (restano quelli assegnati ai singoli).',()=>run(delGroup(g)))},'🗑'))),E('div',{class:'mu'},m.length?m.map(nm).join(', '):'Nessun membro'))}),
  gl.length?null:E('p',{class:'mu'},'Crea un gruppo (per esempio «Tecnici») per assegnare un ticket a più persone insieme.'),
  inv&&!inv.local?null:E('p',{class:'mu'},'Gli inviti funzionano solo nella versione online con Supabase.'))}
function hrModal(k){const h=hrOf(k),c=cf(),w=wkOf(k),us=E('input',{type:'checkbox',checked:!h.wk});
 const rows=WDO.map(i=>{const x=w[i],on=E('input',{type:'checkbox',checked:!!(x&&x.in&&x.out)}),a=E('input',{type:'time',value:x?.in||c.in}),b=E('input',{type:'time',value:x?.out||c.out}),p=E('select',{},opts(PAUSES,x?.pause??c.pause)),sy=()=>[a,b,p].forEach(e=>e.disabled=!on.checked);on.onchange=sy;sy();
  return{i,on,a,b,p,r:E('div',{class:'wkr'},E('label',{class:'tgl'},on,WDN[i]),a,b,p)}});
 const box=E('div',{},E('div',{class:'wkr mu'},E('span',{},'Giorno'),E('span',{},'Entrata'),E('span',{},'Uscita'),E('span',{},'Pausa')),...rows.map(x=>x.r)),sw=()=>{box.style.display=us.checked?'none':''};us.onchange=sw;sw();
 const num=(v,ph)=>E('input',{type:'number',min:0,step:.5,value:v??'',placeholder:ph||''}),fy=num(h.fy,'es. 160'),py=num(h.py,'es. 104'),d0=E('input',{type:'date',value:h.d0||new Date().getFullYear()+'-01-01'}),f0=E('input',{type:'number',step:.5,value:h.f0??''}),p0=E('input',{type:'number',step:.5,value:h.p0??''});
 modal('Orario e ferie · '+nm(k),E('div',{},E('b',{},'Orario settimanale'),E('label',{class:'tgl'},us,'Usa l\'orario della ditta ('+c.in+'–'+c.out+', dal lunedì al venerdì)'),box,
  E('b',{style:'display:block;margin-top:14px'},'Ferie e permessi'),fld('Ore di ferie spettanti all\'anno',fy),fld('Ore di permesso spettanti all\'anno (ROL ed ex festività)',py),fld('Conteggio dal',d0),fld('Ferie residue a quella data (ore)',f0),fld('Permessi residui a quella data (ore)',p0),
  E('p',{class:'mu'},'Le ore spettanti maturano ogni mese (1/12 all\'anno). Esempio: 4 settimane di ferie a tempo pieno da 40 ore = 160 h. Lascia vuoto se non vuoi tenere il saldo.')),
 [cancel(),E('button',{class:'btn',onclick:()=>{let wk=null;if(!us.checked){wk={};for(const x of rows)if(x.on.checked){if(!x.a.value||!x.b.value||mn(x.b.value)-mn(x.a.value)-+x.p.value<=0)return toast('Orario non valido per '+WDN[x.i]);wk[x.i]={in:x.a.value,out:x.b.value,pause:+x.p.value}}}
  const n=e=>e.value===''?null:+e.value;run(db.doc('staff/'+k).update({hr:{wk,fy:n(fy),py:n(py),d0:d0.value||null,f0:n(f0),p0:n(p0)}}).then(()=>toast('Orario e ferie salvati')));close()}},'Salva')])}
async function syncTix(G,gid){for(const t of Object.values(S.tix))if((t.groups||[]).includes(gid))await db.doc('tix/'+t.id).update(asg(t.assignUsers||[],(t.groups||[]).filter(i=>G[i]),G))}
async function delGroup(g){const G={...S.groups};delete G[g.id];await db.doc('groups/'+g.id).delete();await syncTix(G,g.id);toast('Gruppo eliminato')}
function groupModal(g){const n=E('input',{value:g?.name||'',placeholder:'Nome del gruppo'}),us=Object.keys(S.staff).filter(k=>S.staff[k].active!==false).sort((a,b)=>nm(a).localeCompare(nm(b))),cs=us.map(k=>[k,E('input',{type:'checkbox',checked:(g?.members||[]).includes(k)})]);
 modal(g?'Modifica gruppo':'Nuovo gruppo',E('div',{},fld('Nome',n),E('div',{class:'f'},E('span',{},'Membri'),E('div',{class:'perm'},...cs.map(([k,c])=>E('label',{class:'tgl'},c,nm(k)))))),
  [cancel(),E('button',{class:'btn',onclick:async()=>{const name=n.value.trim();if(!name)return toast('Inserisci il nome del gruppo');if(Object.values(S.groups).some(x=>x.id!==g?.id&&(x.name||'').toLowerCase()===name.toLowerCase()))return toast('Esiste già un gruppo con questo nome');
   const members=cs.filter(([,c])=>c.checked).map(([k])=>k);try{let id=g?.id;if(g)await db.doc('groups/'+id).update({name,members});else id=(await db.collection('groups').add({name,members,created:Date.now()})).id;await syncTix({...S.groups,[id]:{id,name,members}},id)}catch(e){return err(e)}close();toast('Gruppo salvato')}},'Salva')])}

const FAQ=[
['Quali festività riconosce l\'app?','Tutte quelle nazionali: Capodanno, Epifania, Pasqua e Lunedì dell\'Angelo, 25 aprile, 1 maggio, 2 giugno, Ferragosto, 1 novembre, 8 dicembre, Natale e Santo Stefano. Il Proprietario può aggiungere il Santo Patrono e le chiusure aziendali in Impostazioni ditta. Nei festivi niente promemoria e le ferie non vengono scalate.'],
['Posso avere un orario diverso dai colleghi?','Sì. In Team, «🕘 Orario e ferie», l\'amministratore imposta per ogni persona i giorni lavorativi e, per ciascun giorno, entrata, uscita e pausa (per esempio part-time solo al mattino). Promemoria, ore giornaliere e straordinario seguono quell\'orario; chi non ne ha uno usa quello della ditta.'],
['Come vedo quante ferie e permessi mi restano?','Nella scheda Richieste trovi il tuo saldo: ore maturate, usate o già approvate, in attesa e residue. Le ore maturano ogni mese. Se una richiesta supera il residuo l\'app te lo segnala, ma decide l\'amministratore.'],
['Come si timbra?','In «Oggi» tocca «Timbra entrata» quando inizi e «Timbra uscita» quando finisci: l\'app calcola da sola ore nette, pausa e straordinario in base agli orari della ditta.'],
['Ho dimenticato di timbrare, cosa faccio?','Il giorno dopo l\'app ti mostra i giorni mancanti e ti chiede cosa è successo (ho lavorato, permesso, ferie, malattia, non lavoravo). Se non puoi correggere le timbrature passate, la tua risposta diventa una richiesta che un amministratore approva.'],
['Come chiedo un permesso a ore?','In Richieste tocca «+ Nuova», scegli «Permesso», il tipo (ROL, visita medica, Legge 104…) e «A ore» con l\'orario, per esempio dalle 16:00 alle 18:00. Per un giorno intero scegli «Giornata intera»; per le ferie l\'orario non serve. Quando il permesso è approvato, in «Oggi» vedi l\'uscita (o l\'entrata) prevista e il promemoria arriva a quell\'ora.'],
['Come funziona l\'arrotondamento degli orari?','Il Proprietario o un Admin lo imposta in Team, «⏱️ Arrotondamento orari»: per esempio entrata a 15 minuti in avanti (9:10 diventa 9:15) e uscita a 15 minuti indietro (18:10 diventa 18:00), e lo straordinario a blocchi di 30 minuti. L\'orario reale timbrato resta sempre salvato e si vede nel report tra parentesi; l\'arrotondamento cambia solo le ore calcolate.'],
['Come chiedo ferie, permessi o malattia?','Dalla scheda Richieste scegli il tipo e le date. Ferie e permessi restano «In attesa» finché un amministratore li approva o li rifiuta; la malattia viene registrata subito. Puoi anche chiedere la modifica di un giorno dal calendario.'],
['Se sono in ferie, l\'app mi chiede di timbrare?','No. Dal primo all\'ultimo giorno della richiesta (anche se ancora in attesa) niente popup, niente promemoria e niente notifiche di timbratura; i giorni coperti non compaiono tra quelli mancanti. Dal giorno dopo si riparte.'],
['Come funzionano i promemoria?','Se all\'orario di entrata non hai timbrato, o a quello di uscita non hai chiuso la giornata, ricevi un avviso: popup nell\'app e, con le notifiche attive, anche una notifica sul telefono ad app chiusa. Nei tuoi giorni di riposo e nelle festività non arrivano.'],
['Come attivo le notifiche sul telefono?','In «Oggi», riquadro Promemoria, tocca «Attiva notifiche» e consenti. Con «Invia notifica di prova» controlli che funzionino: chiudi l\'app e attendi circa un minuto. Su iPhone prima installa l\'app sulla schermata Home (Condividi → Aggiungi a Home). Va fatto su ogni dispositivo.'],
['Non mi arrivano le notifiche','Controlla che siano consentite per il sito/app nelle impostazioni del telefono, che il risparmio energetico non blocchi Chrome o l\'app installata e di avere attivato le notifiche su questo dispositivo. Poi usa «Invia notifica di prova» chiudendo l\'app. Se la notifica a schermo aperto non compare, vedrai un messaggio dentro l\'app.'],
['Come installo l\'app?','Tocca «Installa» nella barra in alto. Su Android compare la richiesta del browser; su iPhone usa Condividi → Aggiungi alla schermata Home.'],
['Come leggo la pagina Ticket?','Quattro viste: «La mia giornata» (appuntamenti di oggi, scaduti e prossimi), Settimana, Mese e Tutti. Lo sfondo indica la scadenza (rosso scaduto, arancione oggi, giallo entro 3 giorni, azzurro entro 7, verde fatto); la barra a sinistra e l\'etichetta indicano l\'urgenza. Tocca un ticket per vedere i dettagli, la data di inserimento e le azioni; con ✓ lo segni subito come fatto.'],
['Cosa sono i ticket?','Attività con titolo, scadenza, ora, foto e promemoria. Un amministratore può assegnarli a una o più persone e a gruppi; chi li riceve ne vede e cambia lo stato (Da fare, In attesa, Fatto) e riceve una notifica.'],
['Come creo un ticket da WhatsApp?','Su Android, con l\'app installata: in WhatsApp tieni premuto un vocale, tocca ⋮ → Condividi (o Inoltra → Condividi) e scegli «Presenze». Si apre «Nuovo ticket» con il vocale allegato e già trascritto in testo: controlla, scegli urgenza e scadenza e salva. Per un messaggio scritto usa Condividi allo stesso modo, oppure copia e incolla il testo in un nuovo ticket. Da iPhone salva il vocale nei File e allegalo dal campo «Vocale» del ticket.'],
['Come creo un ticket da un messaggio di WhatsApp scritto?','Su Android (app installata): tieni premuto il messaggio, scegli Condividi (o ⋮ › Condividi) e seleziona Presenze & Ticket: si apre un nuovo ticket già compilato. Su iPhone, o se non vedi l\'app: copia il messaggio, apri «+ Nuovo» e premi «📋 Incolla messaggio copiato».'],
['Dove trovo i preventivi?','Proprietario e Admin vedono il tasto «📄 Preventivi» nella pagina Ticket. Si crea il preventivo con cliente, voci dal listino (con foto) e sconti, e si salva in PDF con intestazione e logo. Preventivi, clienti e listino sono salvati online e uguali su PC e telefono; gli utenti semplici non li vedono.'],
['Come funziona l\'Agenda dei ticket?','L\'Agenda mostra il mese: ogni giorno ha i suoi impegni colorati per urgenza/scadenza. Tieni premuto un giorno e fai scorrere il dito per vedere l\'anteprima di cosa c\'è da fare (col mouse basta passarci sopra); scorri a destra o sinistra per cambiare mese; tocca un giorno per vederne i dettagli e aggiungere un impegno.'],
['Dove vanno i ticket completati?','Quando premi ✓ il ticket va in 🗄 Archivio e sparisce da Agenda, Giornata, Settimana ed Elenco. Dall\'Archivio puoi riaprirlo con ↩.'],
['Cosa sono gli avvisi di accavallamento?','Se inserisci un ticket per la stessa persona nello stesso giorno ti avviso subito, anche con orari diversi (⚠️). Se gli orari, tenendo conto della Durata, si sovrappongono compare ⛔ e devi confermare con «Salva comunque». Il controllo vale per i ticket che puoi vedere.'],
['Come modifico più ticket insieme?','Nella pagina Ticket tocca «☑ Seleziona», spunta i ticket (o «Tutti/nessuno») e usa la barra in basso: ✏️ Modifica cambia stato, urgenza, scadenza, promemoria e assegnatari di tutti in un colpo, ✓ Fatti li chiude, 🗑 li elimina.'],
['Posso assegnare un ticket anche se sono un utente?','Sì: quando crei o modifichi un tuo ticket scegli a chi assegnarlo tra colleghi e gruppi. Chi lo riceve può cambiarne solo lo stato.'],
['Come si usano i gruppi?','In Team crea un gruppo (per esempio «Tecnici») e scegli i membri. Assegnando un ticket al gruppo lo ricevono tutti i membri attivi.'],
['Come invito un dipendente?','Con «Invita» inserisci email, nome e ruolo e scegli se mandare l\'email o ottenere un link da inviare tu. L\'accesso è solo su invito. Con «Link di accesso» generi un nuovo link per reimpostare la password.'],
['Disattivare, riattivare o eliminare un utente?','«Disattiva» blocca l\'accesso senza cancellare nulla; «Riattiva» lo ripristina con tutto lo storico. «Elimina utente» lo rimuove e ti chiede se conservare lo storico delle timbrature.'],
['Cosa possono fare i ruoli?','Utente: timbra e gestisce le proprie richieste e i propri ticket, secondo i permessi dati. Admin e Proprietario: vedono tutto, approvano richieste, assegnano ticket, gestiscono il team e i report. Il Proprietario può anche cambiare i ruoli e le impostazioni della ditta.'],
['Il Proprietario deve timbrare?','Dipende da lui: nella sua scheda in Team l\'interruttore «Voglio timbrare anch\'io» decide se vede i pulsanti di timbratura, riceve i promemoria e compare nei report.'],
['Come cedo la proprietà?','Il Proprietario, nella sua scheda in Team, usa «Trasferisci la proprietà a un altro Admin». Il nuovo Proprietario deve essere un Admin attivo che ha già fatto l\'accesso; chi cede diventa Admin.'],
['Dove trovo i report?','Nella scheda Report scegli mese e persona: vedi ore, straordinari, ferie, malattie e permessi. Puoi esportare un PDF con l\'intestazione della ditta (logo, indirizzo, P.IVA), con le firme in fondo, oppure il file CSV per il consulente. C\'è anche il PDF riepilogativo di tutto il team.'],
['Come metto il logo della ditta?','Il Proprietario apre Team → Impostazioni, carica il logo e scrive l\'intestazione (indirizzo, P.IVA, contatti). Il logo compare in alto nell\'app e nell\'intestazione dei PDF.']
];
function faqModal(){modal('❓ Domande frequenti',E('div',{class:'faq'},...FAQ.map(([q,a])=>E('details',{},E('summary',{},q),E('p',{},a)))),[E('button',{class:'btn',onclick:close},'Chiudi')])}
function transferModal(){const ad=Object.keys(S.staff).filter(k=>k!==uid&&S.staff[k].role==='admin'&&S.staff[k].active!==false&&S.staff[k].joined!==false);
 if(!ad.length)return modal('🔑 Trasferisci la proprietà',E('p',{},'Per trasferire la proprietà serve almeno un Admin attivo che abbia già fatto l\'accesso. Promuovi prima un utente ad Admin dal menu del ruolo nella sua scheda.'),[E('button',{class:'btn',onclick:close},'Ho capito')]);
 const sl=E('select',{},opts(ad.map(k=>[k,nm(k)]),ad[0]));
 modal('🔑 Trasferisci la proprietà',E('div',{},E('p',{},'Scegli l\'Admin che diventerà il nuovo Proprietario.'),fld('Nuovo Proprietario',sl),E('p',{class:'mu'},'Tu diventerai Admin. Solo il nuovo Proprietario potrà modificare i dati della ditta, i ruoli e i permessi, e potrà restituirti la proprietà.')),
  [cancel(),E('button',{class:'btn er',onclick:()=>{const id=sl.value;close();ask('Confermi? '+nm(id)+' diventa il nuovo Proprietario e tu diventi Admin.',async()=>{try{await inv({action:'transfer',id});toast('Proprietà trasferita a '+nm(id))}catch(e){err(e)}},'Trasferisci')}},'Trasferisci')])}
function delModal(k){const s=S.staff[k]||{},n=nm(k),go=async keep=>{close();try{await inv({action:'delete',id:k,keepHistory:keep});toast(n+' eliminato'+(keep?' (storico conservato)':' con tutti i suoi dati'))}catch(e){err(e)}};
 if(s.joined===false)return ask('Eliminare l\'invito di '+n+'?',()=>go(false));
 modal('Elimina '+n,E('div',{},E('p',{},'L\'utente non potrà più accedere. Vuoi tenere lo storico delle sue timbrature, richieste e ticket?'),E('p',{class:'mu'},'Se lo tieni, i dati restano nel calendario e nei report come «'+n+' (ex)». Altrimenti vengono cancellati per sempre.')),
  [cancel(),E('button',{class:'btn er',onclick:()=>{close();ask('Sicuro? Timbrature, richieste e ticket di '+n+' verranno cancellati per sempre.',()=>go(false))}},'Elimina tutto'),E('button',{class:'btn ok',onclick:()=>go(true)},'Tieni lo storico')])}
function inviteModal(pre){const em=E('input',{type:'email',value:pre?.email||'',readonly:!!pre,placeholder:'email@dipendente.it'}),nI=E('input',{value:pre?.name||'',readonly:!!pre,placeholder:'Nome e cognome'}),ro=E('select',{},opts(role==='super'?[['user','Utente'],['admin','Admin']]:[['user','Utente']],'user')),mo=E('select',{},opts([['link','Genera link (da inviare su WhatsApp)'],['email','Invia email di invito']],'link'));
 const ck=v=>E('input',{type:'checkbox',checked:v}),c1=ck(true),c2=ck(false),c3=ck(true);
 modal(pre?'Link di accesso per '+nm(pre.id):'Invita un dipendente',E('div',{},fld('Email',em),pre?null:fld('Nome e cognome',nI),pre?E('p',{class:'mu'},role==='super'||pre.joined===false?'Genera un nuovo link per impostare o reimpostare la password.':'Riceverà un\'email per reimpostare la password: per sicurezza il link lo vede solo la persona.'):E('div',{},fld('Ruolo',ro),E('label',{class:'tgl'},c1,'Può timbrare'),E('label',{class:'tgl'},c2,'Può modificare le timbrature passate'),E('label',{class:'tgl'},c3,'Può richiedere ferie e permessi'),fld('Come inviare l\'invito',mo))),
  [cancel(),E('button',{class:'btn',onclick:async ev=>{const b=ev.target;if(!/^\S+@\S+\.\S+$/.test(em.value))return toast('Email non valida');b.disabled=true;
   try{const r=await inv({email:em.value.trim(),name:nI.value.trim(),role:ro.value,mode:pre?'link':mo.value,canPunch:c1.checked,canEditPast:c2.checked,canRequest:c3.checked,redirectTo:PTP_LINK});showInvite(r,em.value.trim(),nI.value.trim())}catch(e){b.disabled=false;err(e)}}},pre?(role==='super'||pre.joined===false?'Genera link':'Invia email'):'Invita')])}
function showInvite(r,email,name){if(!r.link){close();return toast(r.sent?'Email per reimpostare la password inviata a '+email:'Invito inviato a '+email)}
 const msg='Ciao'+(name?' '+name:'')+', ecco il tuo accesso a '+(cf().name||'Presenze')+': '+r.link,i=E('input',{readonly:true,value:r.link,onclick:e=>e.target.select()});
 modal('Link pronto',E('div',{},E('p',{},'Invia questo link a '+email+'. Al primo accesso imposta la password e trova il profilo già configurato. Il link è personale e a uso singolo.'),i),
  [E('button',{class:'btn gh',onclick:()=>{i.select();try{navigator.clipboard.writeText(r.link)}catch(e){document.execCommand('copy')}toast('Link copiato')}},'Copia'),E('a',{class:'btn ok',href:'https://wa.me/?text='+encodeURIComponent(msg),target:'_blank',rel:'noopener',style:'text-decoration:none'},'WhatsApp'),E('button',{class:'btn',onclick:close},'Chiudi')])}
async function decide(q,st){try{if(st==='approved'&&q.type==='modifica'){const a=q.as||'work';if(a==='work'||a==='off')await dref(q.uid,q.from).set(q.off||a==='off'?{uid:q.uid,date:q.from,off:true}:{uid:q.uid,date:q.from,in:q.in,out:q.out||'',pause:+q.pause||0});else await db.collection('reqs').add({uid:q.uid,by:uid,type:a,from:q.from,to:q.to||q.from,hours:+q.hours||0,note:q.note||'Da modifica approvata',status:'approved',created:Date.now()})}
 await db.doc('reqs/'+q.id).update({status:st});for(const n of Object.values(S.notifs).filter(x=>x.ref===q.id&&!x.to&&!x.read))await db.doc('notifs/'+n.id).update({read:true});toast(st==='approved'?'Approvata':'Rifiutata')}catch(e){err(e)}}
const myN=()=>Object.values(S.notifs||{}).filter(n=>isA()?(!n.to||n.to===uid):n.to===uid).sort((a,b)=>b.created-a.created);
function notifPanel(){const l=myN(),un=l.filter(n=>!n.read).length,box=E('div',{}),again=()=>setTimeout(()=>{if($('#ov h3')?.textContent.startsWith('🔔'))notifPanel()},450);
 l.slice(0,40).forEach(n=>{const q=S.reqs[n.ref],pend=isA()&&n.kind==='req'&&q?.status==='pending';
  box.append(E('div',{class:'card',style:'margin-bottom:8px;'+(n.read?'opacity:.7':'border-color:var(--ac)')},E('div',{},n.msg),E('div',{class:'mu'},new Date(n.created).toLocaleString('it-IT',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})+(q&&n.kind==='req'?' · '+ST[q.status]:'')),
   pend&&q.type==='modifica'?E('div',{class:'mu'},qd(q).slice(3)+(q.note?' · '+q.note:'')):(pend&&q.note?E('div',{class:'mu'},q.note):null),
   E('div',{class:'row',style:'margin-top:8px'},pend?[E('button',{class:'btn ok sm',onclick:async()=>{await decide(q,'approved');again()}},'✔ Approva'),E('button',{class:'btn er sm',onclick:async()=>{await decide(q,'rejected');again()}},'✖ Rifiuta')]:null,n.kind==='ticket'?E('button',{class:'btn sm',onclick:async()=>{await run(db.doc('notifs/'+n.id).update({read:true}));S.tab='tix';close();render()}},'🎫 Apri i ticket'):null,!n.read?E('button',{class:'btn gh sm',onclick:async()=>{await run(db.doc('notifs/'+n.id).update({read:true}));again()}},'Segna letta'):null)))});
 modal('🔔 Notifiche'+(un?' ('+un+' da leggere)':''),l.length?box:E('p',{class:'mu'},'Nessuna notifica.'),[un?E('button',{class:'btn gh',onclick:async()=>{for(const n of l.filter(x=>!x.read))await db.doc('notifs/'+n.id).update({read:true}).catch(()=>{});again()}},'Segna tutte lette'):null,E('button',{class:'btn',onclick:close},'Chiudi')])}
function render(){if(!uid)return;role=owner?'super':S.staff[uid]?.role||'user';const y=scrollY;
 $('#who').textContent=nm(uid);{const un=myN().filter(n=>!n.read).length;$('#bell').textContent='🔔'+(un?' '+un:'')}{const L=$('#logo'),lg=cf().logo;if(lg){if(L.getAttribute('src')!==lg)L.src=lg;L.hidden=false}else{L.hidden=true;L.removeAttribute('src')}$('header h1').textContent=(lg?'':'⏱️ ')+(cf().name||'Presenze & Ticket Pro');document.title=cf().name?cf().name+' · Presenze':'Presenze & Ticket Pro'}$('#role').textContent={super:'Proprietario',admin:'Admin',user:'Utente'}[role];
 const tabs=[['oggi','⏱️','Oggi'],['cal','📅','Calendario'],['req','📝','Richieste'],['tix','🎫','Ticket'],['rep','📊','Report'],...(isA()?[['team','👥','Team']]:[])];
 const pend=Object.values(S.reqs).filter(q=>q.status==='pending').length;
 $('#nav').replaceChildren(...tabs.map(([k,i,l])=>E('button',{class:S.tab===k?'on':'',onclick:()=>{S.tab=k;S.sel=null;render()}},E('span',{},i),l,k==='req'&&isA()&&pend?E('i',{},pend):null)));
 if(S.tab==='team'&&!isA())S.tab='oggi';
 $('#v').classList.toggle('wide',S.tab==='tix'&&(S.tv||tvDef())==='mese');$('#v').replaceChildren({oggi:vOggi,cal:vCal,req:vReq,tix:vTix,rep:vRep,team:vTeam}[S.tab]());scrollTo(0,y)}

/* completamento del ticket: materiale usato, ore di lavoro, note e link alla pagina OneNote (campo rep) */
const okLink=u=>/^(https:\/\/|onenote:)/i.test(u||''),
 fmtMin=m=>{m=+m||0;const h=Math.floor(m/60),r=m%60;return(h?h+' h':'')+(h&&r?' ':'')+(r||!h?r+' min':'')},
 canRep=t=>tEd(t)||(t.assignees||[]).includes(uid);
function repView(t){const r=t.rep;if(!r||!((r.mat||[]).length||r.min||r.link||r.note))return null;
 return E('div',{class:'card',style:'margin:8px 0'},E('b',{},'🧰 Lavoro svolto'),
  r.min?E('div',{},E('span',{class:'mu'},'Ore di lavoro: '),fmtMin(r.min)):null,
  (r.mat||[]).length?E('div',{},E('span',{class:'mu'},'Materiale usato:'),E('ul',{style:'margin:4px 0 0;padding-left:20px'},r.mat.map(m=>E('li',{},m.d+(m.q?' · '+m.q:''))))):null,
  r.note?E('p',{style:'white-space:pre-wrap;margin:4px 0'},r.note):null,
  okLink(r.link)?E('a',{class:'btn gh sm',href:r.link,target:'_blank',rel:'noopener',style:'text-decoration:none;display:inline-block;margin-top:6px'},'📓 Apri pagina OneNote'):null,
  r.by?E('div',{class:'mu',style:'font-size:12px;margin-top:4px'},'Inserito da '+nm(r.by)+(r.at?' il '+fmtI(r.at):'')):null)}
function doneModal(t){const r=t.rep||{},done=t.status==='Fatto',rows=E('div',{}),
 addRow=m=>{m=m||{};const d=E('input',{placeholder:'Materiale (es. cavo di rete)',value:m.d||'',style:'flex:1'}),q=E('input',{placeholder:'Q.tà',value:m.q||'',style:'width:70px'}),
   row=E('div',{class:'row mat',style:'margin:0 0 6px;flex-wrap:nowrap'},d,q,E('button',{class:'btn gh sm',title:'Togli riga',onclick:()=>row.remove()},'✕'));rows.append(row);return d},
 hh=E('input',{type:'number',min:0,max:999,inputmode:'numeric',placeholder:'0',value:r.min?Math.floor(r.min/60):'',style:'width:70px'}),
 mm=E('input',{type:'number',min:0,max:59,step:5,inputmode:'numeric',placeholder:'0',value:r.min?r.min%60:'',style:'width:70px'}),
 ln=E('input',{type:'url',placeholder:'Incolla qui il link della pagina',value:r.link||'',style:'width:100%'}),
 no=E('textarea',{rows:2,placeholder:'Note sul lavoro (facoltative)'},r.note||''),
 msg=E('p',{style:'color:#e00018;margin:0'});
 ((r.mat||[]).length?r.mat:[{}]).forEach(addRow);
 const save=()=>{const h=+hh.value||0,m=+mm.value||0,min=h*60+m,link=ln.value.trim();
  if(h<0||m<0||m>59||h>999||!Number.isInteger(h)||!Number.isInteger(m)){msg.textContent='Controlla le ore di lavoro.';return}
  if(link&&!okLink(link)){msg.textContent='Il link della pagina OneNote deve iniziare con https://';return}
  const mat=[...rows.querySelectorAll('.mat')].map(x=>{const[d,q]=x.querySelectorAll('input');return{d:d.value.trim(),q:q.value.trim()}}).filter(x=>x.d),
   u={rep:{mat,min,link,note:no.value.trim(),by:uid,at:Date.now()}};
  if(!done){u.status='Fatto';u.doneAt=Date.now()}
  run(db.doc('tix/'+t.id).update(u));close();toast(done?'Materiale e ore salvati':'Ticket completato: spostato in Archivio 🗄')};
 modal((done?'🧰 ':'✓ Completa · ')+t.title,E('div',{},
  E('div',{class:'f'},E('span',{},'Materiale usato'),rows,E('button',{class:'btn gh sm',onclick:()=>addRow().focus()},'➕ Aggiungi materiale')),
  E('div',{class:'f'},E('span',{},'Ore di lavoro'),E('div',{class:'row',style:'margin:0'},hh,'ore',mm,'minuti')),
  fld('Pagina OneNote (facoltativa)',ln),E('p',{class:'mu',style:'margin:-6px 0 10px;font-size:13px'},'In OneNote: tasto destro sulla pagina → «Copia collegamento alla pagina», poi incolla qui.'),
  fld('Note',no),msg),
  [E('button',{class:'btn gh',onclick:close},'Annulla'),E('button',{class:'btn ok',onclick:save},done?'Salva':'✓ Completa')])}
