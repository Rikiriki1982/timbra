/* Presenze & Ticket Pro · Installazione come app e avvio.
   I file della cartella js/ si caricano in ordine (vedi index.html) e condividono le stesse variabili. */
/* installazione come app (Android e iPhone) */
let ip=null,pushApi=null,pushOn=false,voice=null,hist=null;const snz={},isStd=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true,isIOS=()=>/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1),
 snoozed=k=>{try{return+localStorage.getItem(k)>Date.now()}catch(e){return(snz[k]||0)>Date.now()}},
 canPush=()=>!!(pushApi&&pushApi.key&&'serviceWorker' in navigator&&'PushManager' in window&&'Notification' in window&&(!isIOS()||isStd())),
 u8=b=>Uint8Array.from(atob((b+'='.repeat((4-b.length%4)%4)).replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
function bar(txt,lbl,fn,k){return E('div',{class:'inst'},E('span',{},txt),E('button',{class:'btn sm',onclick:fn},lbl),E('button',{class:'x','aria-label':'Chiudi',onclick:()=>{const t=Date.now()+3*864e5;snz[k]=t;try{localStorage.setItem(k,t)}catch(e){}instBar()}},'✕'))}
function instBar(){const b=$('#inst');if(!b)return;const a=[];
 if(!isStd()&&!snoozed('pwa_snooze'))a.push(bar('📲 Installa l\'app sul telefono','Installa',instGo,'pwa_snooze'));
 if(canPush()&&!pushOn&&Notification.permission!=='denied'&&!snoozed('push_snooze'))a.push(bar('🔔 Ricevi i promemoria anche ad app chiusa','Attiva',pushEnable,'push_snooze'));
 b.replaceChildren(...a)}
async function pushState(){if(!canPush())return;try{const r=await navigator.serviceWorker.ready,s=await r.pushManager.getSubscription();pushOn=!!s&&Notification.permission==='granted';if(pushOn)pushApi.save(s).catch(()=>{})}catch(e){}instBar()}
async function pushEnable(){try{if(Notification.permission==='denied')return modal('🔔 Notifiche bloccate',E('p',{},'Le notifiche sono bloccate per questo sito. Aprile dalle impostazioni del browser (icona del lucchetto accanto all\'indirizzo, oppure Impostazioni → Notifiche → Presenze) e consentile, poi riprova.'),[E('button',{class:'btn',onclick:close},'Ho capito')]);
 if(await Notification.requestPermission()!=='granted')return toast('Notifiche non consentite');
 const r=await navigator.serviceWorker.ready,s=await r.pushManager.getSubscription()||await r.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:u8(pushApi.key)});await pushApi.save(s);pushOn=true;toast('Notifiche attive ✅');instBar();render()}catch(e){err(e)}}
async function pushTest(){try{const n=await pushApi.test();if(!n){pushOn=false;render();return modal('Nessun dispositivo registrato',E('p',{},'Questo account non ha dispositivi con le notifiche attive. Tocca «Attiva notifiche» e riprova.'),[E('button',{class:'btn',onclick:close},'Ok')])}
 modal('🔔 Notifica di prova in arrivo',E('p',{},'Ho registrato '+n+' dispositivo/i. Ora chiudi l\'app o blocca lo schermo: la notifica arriva entro circa un minuto. Se non arriva, scrivimi che cosa vedi.'),[E('button',{class:'btn',onclick:close},'Ok')])}catch(e){err(e)}}
async function pushOff(){try{const r=await navigator.serviceWorker.ready,s=await r.pushManager.getSubscription();if(s){await pushApi.remove(s.endpoint);await s.unsubscribe()}pushOn=false;toast('Notifiche disattivate');instBar();render()}catch(e){err(e)}}
async function instGo(){if(ip){const e=ip;ip=null;try{e.prompt();await e.userChoice}catch(x){}instBar();return}
 const st=isIOS()?['Apri questa pagina con <b>Safari</b> (se arrivi da WhatsApp o da un\'altra app, tocca «Apri in Safari»).','Tocca il pulsante <b>Condividi</b> (il quadrato con la freccia verso l\'alto: in basso su iPhone, in alto a destra se usi Chrome).','Scorri e tocca <b>«Aggiungi alla schermata Home»</b>, poi <b>Aggiungi</b>.']
  :['Apri questa pagina con <b>Chrome</b>.','Tocca i tre puntini <b>⋮</b> in alto a destra.','Tocca <b>«Installa app»</b> (o «Aggiungi a schermata Home») e poi <b>Installa</b>.'];
 const ol=E('ol',{class:'steps'});ol.innerHTML=st.map(x=>'<li>'+x+'</li>').join('');
 modal('📲 Installa l\'app su '+(isIOS()?'iPhone / iPad':'Android'),E('div',{},E('p',{},'Così trovi l\'icona tra le tue app e si apre a schermo intero, senza barra del browser.'),ol,isIOS()?E('p',{class:'mu'},'Poi apri l\'app dall\'icona e attiva le notifiche: su iPhone funzionano solo così (serve iOS 16.4 o più recente).'):null),[E('button',{class:'btn',onclick:close},'Ho capito')])}
addEventListener('beforeinstallprompt',e=>{e.preventDefault();ip=e;instBar()});addEventListener('appinstalled',()=>{ip=null;instBar();toast('App installata ✅')});instBar();
/* avvio */
(async()=>{try{if(typeof claude==='undefined'){$('#v').replaceChildren(E('div',{class:'card'},'Questa pagina funziona solo aprendo il link dell\'artifact dall\'app o dal sito di Claude, non come file scaricato. Riapri il link da Claude.'));return}const user=await claude.use('user');db=await claude.use('db');dl=await claude.use('downloads');try{inv=await claude.use('invite')}catch(e){inv=null}try{pushApi=await claude.use('push')}catch(e){pushApi=null}try{voice=await claude.use('voice')}catch(e){voice=null}try{hist=await claude.use('hist')}catch(e){hist=null}
 if(!user||!db){$('#v').replaceChildren(E('div',{class:'card'},'Per usare l\'app apri il link da claude.ai con il tuo account (serve l\'accesso per registrare email e presenze).'));return}
 me=await user.me();uid=me.id;owner=await user.isOwner();if(!uid){$('#v').replaceChildren(E('div',{class:'card'},'Accesso non riconosciuto: accedi a claude.ai e riapri la pagina.'));return}
 const ref=db.doc('staff/'+uid),s=await ref.get(),cur=s.exists?s.data():{},b=Object.fromEntries(Object.entries({email:me.email,name:me.name}).filter(([k,v])=>v&&!cur[k]));
 if(cur.active===false){$('#v').replaceChildren(E('div',{class:'card'},'Il tuo account è stato disattivato. Contatta l\'amministratore.'));return}
 if(!s.exists)await ref.set({...b,role:owner?'super':'user',created:Date.now()});else{const u={...b,...(owner&&cur.role!=='super'?{role:'super'}:{})};if(Object.keys(u).length)await ref.update(u)}
 for(const c of['staff','days','reqs','tix','groups','ex','settings','notifs'])db.collection(c).onSnapshot(sn=>{S[c]=Object.fromEntries(sn.docs.map(d=>[d.id,{...d.data(),id:d.id}]));render()},err);
 render();pushState();handleShare();setInterval(()=>{const c=$('#clk');if(c)c.textContent=hm(new Date());remind()},20000);document.addEventListener('visibilitychange',()=>!document.hidden&&(checkMissing()||remind()));setTimeout(()=>{const st=S.staff[uid]||{};if(!st.email||st.calSync===undefined)emailModal();else if(role==='super'&&!S.settings.company)setModal(true);else if(!checkMissing())remind()},1500)
}catch(e){$('#v').replaceChildren(E('div',{class:'card'},'Errore di avvio: '+e.message))}})();
if('serviceWorker' in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('sw.js').catch(()=>{});if('serviceWorker' in navigator)navigator.serviceWorker.addEventListener('message',e=>{const d=e.data||{};if(d.type==='push'){toast('🔔 '+(d.body||d.title));alertFx()}});
