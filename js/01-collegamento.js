/* Presenze & Ticket Pro · Collegamento ai dati: online su Supabase (accesso solo su invito) oppure nel browser.
   I file della cartella js/ si caricano in ordine (vedi index.html) e condividono le stesse variabili. */
/* Modalità condivisa: dati online su Supabase, accesso solo su invito */
const CFG=window.PTP_CFG||{},H0=location.hash,NEEDPW=/type=(invite|recovery)/.test(H0);
const CFGOK=/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(String(CFG.url||'').trim())&&String(CFG.key||'').length>20;
if(typeof claude==='undefined'&&(!CFGOK||!window.supabase))window.claude={use:async()=>{throw new Error(!CFGOK?'configurazione mancante o non valida in config.js (Project URL e chiave anon). Dopo aver salvato il file, ricarica la pagina con Ctrl+F5.':'libreria Supabase non caricata, controlla la connessione e riprova.')}};
if(typeof claude==='undefined'&&CFGOK&&window.supabase){(()=>{
const sb=supabase.createClient(CFG.url,CFG.key),rid=()=>crypto.randomUUID?crypto.randomUUID():Math.random().toString(36).slice(2),sd=(id,v)=>({id,exists:v!=null,data:()=>v}),subs=[];
const ck=r=>{if(r.error)throw new Error(r.error.message);return r.data},w=async p=>{const r=ck(await p);subs.forEach(f=>f());return r};
const MAPS={staff:{t:'profiles',m:{email:'email',name:'name',role:'role',calEmail:'cal_email',calSync:'cal_sync',canPunch:'can_punch',canEditPast:'can_edit_past',canRequest:'can_request',hr:'hr',active:'active',joined:'joined',created:'created_at'}},
 notifs:{t:'notifications',m:{kind:'kind',ref:'ref',uid:'from_user',to:'to_user',msg:'message',read:'read',created:'created_at'}}};
const toDoc=(r,m)=>{const d={};for(const k in m){const v=r[m[k]];if(v!=null)d[k]=k==='created'?+new Date(v):v}return d};
const toRow=(d,m)=>{const r={};for(const k in d)if(m[k]&&k!=='created')r[m[k]]=d[k];return r};
const one=async(c,id)=>ck(await sb.from('docs').select('data').eq('coll',c).eq('id',id).maybeSingle());
const dr=(c,id)=>({id,get:async()=>sd(id,(await one(c,id))?.data),
 set:async v=>{const r=await one(c,id);return w(r?sb.from('docs').update({data:v}).eq('coll',c).eq('id',id):sb.from('docs').insert({coll:c,id,data:v}))},
 update:async v=>{const r=await one(c,id);if(!r)throw new Error('Documento inesistente');return w(sb.from('docs').update({data:{...r.data,...v}}).eq('coll',c).eq('id',id))},
 delete:async()=>w(sb.from('docs').delete().eq('coll',c).eq('id',id))});
const tdr=(c,id)=>{const{t,m}=MAPS[c];return{id,get:async()=>{const r=ck(await sb.from(t).select('*').eq('id',id).maybeSingle());return sd(id,r?toDoc(r,m):undefined)},
 set:async v=>{const r=ck(await sb.from(t).select('id').eq('id',id).maybeSingle());if(!r)throw new Error('Profilo non trovato: chiedi un invito al tuo amministratore.');const x=toRow(v,m);return Object.keys(x).length?w(sb.from(t).update(x).eq('id',id)):0},
 update:async v=>{const x=toRow(v,m);return Object.keys(x).length?w(sb.from(t).update(x).eq('id',id)):0},
 delete:async()=>w(sb.from(t).delete().eq('id',id))}};
const db={doc:p=>{const[c,id]=p.split('/');return MAPS[c]?tdr(c,id):dr(c,id)},collection:c=>{const T=MAPS[c];return{doc:id=>T?tdr(c,id):dr(c,id||rid()),
 add:async v=>{if(T)throw new Error('Operazione non consentita');const id=rid();await dr(c,id).set(v);return dr(c,id)},
 onSnapshot:(f,e)=>{const run=async()=>{try{const ds=T?ck(await sb.from(T.t).select('*')).map(r=>sd(r.id,toDoc(r,T.m))):ck(await sb.from('docs').select('id,data').eq('coll',c)).map(x=>sd(x.id,x.data)),have=new Set(ds.map(x=>x.id));
   if(c==='staff')try{ck(await sb.rpc('team_list')).forEach(r=>{if(!have.has(r.id))ds.push(sd(r.id,{name:r.name,role:'user',active:r.active,joined:true,dir:true}))})}catch(_){}
   if(c==='groups')try{ck(await sb.rpc('team_groups')).forEach(r=>{if(!have.has(r.id))ds.push(sd(r.id,r.data))})}catch(_){}
   f({docs:ds})}catch(x){e&&e(x)}};subs.push(run);run();
  sb.channel('rt-'+c+rid()).on('postgres_changes',T?{event:'*',schema:'public',table:T.t}:{event:'*',schema:'public',table:'docs',filter:'coll=eq.'+c},run).subscribe();return()=>{}}}}};
setInterval(()=>subs.forEach(f=>f()),30000);
const ov=h=>{const m=document.createElement('div');m.style.cssText='position:fixed;inset:0;z-index:50;background:var(--bg);display:flex;align-items:center;justify-content:center;padding:20px';m.innerHTML='<div class="card" style="width:100%;max-width:380px">'+h+'</div>';document.body.append(m);return m};
const setPw=()=>new Promise(res=>{const m=ov('<h2>🔑 Imposta la tua password</h2><label class="f"><span>Nuova password (almeno 6 caratteri)</span><input id="p1" type="password"></label><label class="f"><span>Ripeti la password</span><input id="p2" type="password"></label><p id="lm" class="mu"></p><button class="btn" id="go">Salva e continua</button>'),q=s=>m.querySelector(s),msg=t=>{q('#lm').textContent=t};
 q('#go').onclick=async()=>{const a=q('#p1').value;if(a.length<6)return msg('Almeno 6 caratteri.');if(a!==q('#p2').value)return msg('Le password non coincidono.');const r=await sb.auth.updateUser({password:a});if(r.error)return msg(r.error.message);m.remove();history.replaceState(null,'',location.pathname);res()}});
const login=()=>new Promise(res=>{const m=ov('<h2>🔐 Accedi</h2><label class="f"><span>Email</span><input id="le" type="email" autocomplete="username"></label><label class="f"><span>Password</span><input id="lp" type="password" autocomplete="current-password"></label><p id="lm" class="mu"></p><div class="row"><button class="btn" id="li">Accedi</button><button class="btn gh" id="lf">Password dimenticata?</button></div><p class="mu">L\'accesso è solo su invito: chiedi il link al tuo amministratore.</p>'),q=s=>m.querySelector(s),msg=t=>{q('#lm').textContent=t};
 const er=/error_description=([^&]+)/.exec(H0);if(er)msg(decodeURIComponent(er[1].replace(/\+/g,' '))+' Chiedi un nuovo link.');
 q('#li').onclick=async()=>{msg('…');const r=await sb.auth.signInWithPassword({email:q('#le').value.trim(),password:q('#lp').value});if(r.error)return msg(r.error.message);m.remove();res(r.data.session)};
 q('#lf').onclick=async()=>{const e=q('#le').value.trim();if(!e)return msg('Scrivi prima la tua email.');await sb.auth.resetPasswordForEmail(e,{redirectTo:PTP_LINK});msg('Se l\'email è registrata riceverai il link per reimpostare la password. In alternativa chiedi un link al tuo amministratore.')}});
const user={me:async()=>{let s=(await sb.auth.getSession()).data.session;if(NEEDPW&&s)await setPw();if(!s)s=await login();const u=s.user;
 document.querySelector('header span').append(Object.assign(document.createElement('button'),{className:'badge',textContent:'Esci',style:'border:0;color:#fff;cursor:pointer',onclick:async()=>{await sb.auth.signOut();location.reload()}}));
 return{id:u.id,email:u.email,name:u.user_metadata?.name||''}},isOwner:async()=>false};
const push={key:CFG.vapid||'',save:async s=>{const me=(await sb.auth.getSession()).data.session?.user;if(!me)return;const j=s.toJSON?s.toJSON():s;const{error}=await sb.from('push_subs').upsert({user_id:me.id,endpoint:j.endpoint,p256dh:j.keys.p256dh,auth:j.keys.auth,ua:navigator.userAgent.slice(0,200)},{onConflict:'endpoint'});if(error)throw error},remove:async ep=>{await sb.from('push_subs').delete().eq('endpoint',ep)},test:async()=>{const{data,error}=await sb.rpc('push_test');if(error)throw error;return data}};
const mimeOf=f=>{const t=(f.type||'').split(';')[0].toLowerCase();if(/^audio\//.test(t))return t;const n=(f.name||'').toLowerCase();return /\.(m4a|mp4|aac)$/.test(n)?'audio/mp4':/\.mp3$/.test(n)?'audio/mpeg':/\.wav$/.test(n)?'audio/wav':'audio/ogg'},extOf=m=>m.includes('mp4')?'m4a':m.includes('mpeg')?'mp3':m.includes('wav')?'wav':m.includes('webm')?'webm':'ogg';
const fnErr=async error=>{let m=error.message;try{const j=await error.context.json();if(j?.error)m=j.error}catch(e){}return new Error(m)};
const voice={transcribe:async f=>{const fd=new FormData();fd.append('file',f,f.name||'vocale');const{data,error}=await sb.functions.invoke('transcribe',{body:fd});if(error)throw await fnErr(error);if(data?.error)throw new Error(data.error);return data?.text||''},
 put:async f=>{const m=mimeOf(f),path=rid()+'.'+extOf(m),r=await sb.storage.from('ticket-audio').upload(path,f,{contentType:m});if(r.error)throw new Error(r.error.message);return{path,mime:m}},
 url:async path=>{const r=await sb.storage.from('ticket-audio').createSignedUrl(path,3600);if(r.error)throw new Error(r.error.message);return r.data.signedUrl},
 del:async path=>{await sb.storage.from('ticket-audio').remove([path])}};
const invite=async b=>{const{data,error}=await sb.functions.invoke('invite-user',{body:b});if(error){let m=error.message;try{const j=await error.context.json();if(j?.error)m=j.error}catch(e){}throw new Error(m)}if(data?.error)throw new Error(data.error);subs.forEach(f=>f());return data};
const dl={save:async({filename,data})=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([data],{type:filename.endsWith('.ics')?'text/calendar':filename.endsWith('.pdf')?'application/pdf':'text/csv'}));a.download=filename;document.body.append(a);a.click();a.remove();return'saved'}};
const hist={day:async id=>ck(await sb.from('days_log').select('at,by_user,action,before,after').eq('day_id',id).order('at',{ascending:false}).limit(100))};
window.claude={use:async n=>({user,db,downloads:dl,invite,push,voice,hist})[n]||null};
})()}
/* Modalità autonoma: dati salvati nel browser di questo dispositivo */
if(typeof claude==='undefined'){(()=>{
const mem={},ls={get:k=>{try{return localStorage.getItem(k)}catch(e){return mem[k]??null}},set:(k,v)=>{try{localStorage.setItem(k,v)}catch(e){mem[k]=v}}};
const load=()=>JSON.parse(ls.get('ptp_db')||'{}'),save=d=>ls.set('ptp_db',JSON.stringify(d)),subs=[],notify=()=>subs.forEach(f=>f()),rid=()=>Math.random().toString(36).slice(2,10);
const sd=(id,v)=>({id,exists:v!==undefined,data:()=>v});
const emu=(d,q,id,w)=>{const st=(d.staff||{})[q.uid]||{},who=st.name||st.email||'Un dipendente',lb={ferie:'ferie',permesso:'un permesso',malattia:'malattia',modifica:'una modifica al calendario'}[q.type]||q.type,per=q.from===q.to?'il '+q.from:'dal '+q.from+' al '+q.to;
 (d.notifs=d.notifs||{})[rid()]=w==='new'?{kind:'req',ref:id,uid:q.uid,msg:who+' ha richiesto '+lb+' '+per,read:false,created:Date.now()}:{kind:'decision',ref:id,uid:q.uid,to:q.uid,msg:'La tua richiesta di '+lb+' ('+q.from+') è stata '+(q.status==='approved'?'approvata':'rifiutata'),read:false,created:Date.now()}};
const dr=(c,id)=>({id,get:async()=>sd(id,(load()[c]||{})[id]),
 set:async v=>{const d=load(),nw=!(d[c]||{})[id];(d[c]=d[c]||{})[id]=v;if(c==='reqs'&&nw&&v.status==='pending')emu(d,v,id,'new');save(d);notify()},
 update:async v=>{const d=load(),o=(d[c]||{})[id];if(!o)throw new Error('Documento inesistente');d[c][id]={...o,...v};if(c==='reqs'&&o.status==='pending'&&v.status&&v.status!=='pending')emu(d,d[c][id],id,'dec');save(d);notify()},
 delete:async()=>{const d=load();if(d[c])delete d[c][id];save(d);notify()}});
const db={doc:p=>{const[c,id]=p.split('/');return dr(c,id)},collection:c=>({doc:id=>dr(c,id||rid()),add:async v=>{const id=rid();await dr(c,id).set(v);return dr(c,id)},
 onSnapshot:f=>{const run=()=>f({docs:Object.entries(load()[c]||{}).map(([id,v])=>sd(id,v))});subs.push(run);run();return()=>{}}})};
const invite=async b=>{if(b.action!=='delete')throw new Error('Gli inviti funzionano solo nella versione online');const d=load(),t=(d.staff||{})[b.id];if(!t)throw new Error('Utente non trovato');delete d.staff[b.id];
 if(b.keepHistory)(d.ex=d.ex||{})[b.id]={name:t.name||'',email:t.email||'',deleted:Date.now()};else for(const c of['days','reqs','tix'])for(const k in d[c]||{})if(d[c][k].uid===b.id)delete d[c][k];
 for(const k in d.tix||{}){const x=d.tix[k];if((x.assignees||[]).includes(b.id)){x.assignees=x.assignees.filter(i=>i!==b.id);x.assignUsers=(x.assignUsers||[]).filter(i=>i!==b.id)}}
 for(const k in d.groups||{})d.groups[k].members=(d.groups[k].members||[]).filter(i=>i!==b.id);save(d);notify();return{ok:true}};invite.local=true;
const user={me:async()=>({id:'local',name:'',email:null}),isOwner:async()=>true};
const dl={save:async({filename,data})=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([data],{type:filename.endsWith('.ics')?'text/calendar':filename.endsWith('.pdf')?'application/pdf':'text/csv'}));a.download=filename;document.body.append(a);a.click();a.remove();return'saved'}};
window.claude={use:async n=>({user,db,downloads:dl,invite})[n]||null};
})()}
