/* Preventivi dentro «Presenze & Ticket»: stessi account, dati online (solo Proprietario e Admin).
   Senza collegamento al database (o con ?local=1) funziona come prima, salvando nel browser. */
(function(){
"use strict";
const CFG=window.PTP_CFG||{},Q=new URLSearchParams(location.search),
  CFGOK=/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(String(CFG.url||'').trim())&&String(CFG.key||'').length>20,
  LOCAL=Q.has('local')||!CFGOK;
const $=s=>document.querySelector(s);
function gate(title,msg,back){
  let g=$('#gate');if(!g){g=document.createElement('div');g.id='gate';g.style.cssText='position:fixed;inset:0;z-index:99;background:var(--bg,#eef1f4);color:var(--ink,#18212b);display:flex;align-items:center;justify-content:center;padding:24px;text-align:center;font:16px system-ui,sans-serif';document.body.appendChild(g)}
  g.innerHTML='<div style="max-width:420px"><h2 style="margin:0 0 8px">'+title+'</h2><p style="margin:0 0 16px;line-height:1.5">'+msg+'</p>'+(back?'<a href="../" style="display:inline-block;padding:10px 16px;border-radius:10px;background:#4f46e5;color:#fff;text-decoration:none;font-weight:600">← Torna all\'app</a>':'')+'</div>';
}
let tT;function note(m){let t=$('#bootToast');if(!t){t=document.createElement('div');t.id='bootToast';t.style.cssText='position:fixed;left:50%;bottom:20px;transform:translateX(-50%);z-index:100;background:#b00020;color:#fff;padding:10px 14px;border-radius:10px;max-width:90vw;font:14px system-ui,sans-serif';document.body.appendChild(t)}t.textContent=m;t.style.display='';clearTimeout(tT);tT=setTimeout(()=>t.style.display='none',6000)}
function status(t){const e=$('#syncSt');if(e)e.textContent=t}

function localStore(){return{
  get(k,def){try{const v=localStorage.getItem('prev_'+k);return v?JSON.parse(v):def}catch(e){return def}},
  set(k,v){try{localStorage.setItem('prev_'+k,JSON.stringify(v));return true}catch(e){note('Spazio del browser esaurito: riduci le immagini caricate');return false}}
}}

/* archivio: un documento per preventivo (collezione prevq); il resto in prev: azienda, listino, clienti, bozza di ognuno */
/* unione a tre vie: le modifiche fatte qui (rispetto a "base", l'ultima versione letta dal database)
   vengono applicate sopra la versione attuale del database ("remote"), voce per voce.
   Elenchi (listino, clienti): voce = id oppure nome. Oggetti (azienda): campo per campo. */
const J=x=>JSON.stringify(x),cp=x=>x==null?x:JSON.parse(J(x));
function keyOf(e){return e&&typeof e==='object'?(e.id!=null?String(e.id):String(e.nome||'').trim().toLowerCase()||null):null}
function merge3(base,local,remote,conf){
  if(J(local)===J(base))return cp(remote);
  if(J(remote)===J(base)||J(remote)===J(local))return cp(local);
  if(Array.isArray(local)&&Array.isArray(remote)&&Array.isArray(base||[])){
    const B=new Map(),L=new Map();(base||[]).forEach(e=>B.set(keyOf(e),e));local.forEach(e=>L.set(keyOf(e),e));
    if([...B.keys(),...L.keys(),...remote.map(keyOf)].some(k=>k==null)){conf.push('');return cp(local)}
    const out=[],seen=new Set();
    remote.forEach(r=>{const k=keyOf(r);seen.add(k);const b=B.get(k),l=L.get(k);
      if(b!==undefined&&l===undefined){if(J(r)!==J(b))conf.push(k);else return}                 // tolta qui
      if(l!==undefined&&b!==undefined&&J(l)!==J(b)){if(J(r)!==J(b)&&J(r)!==J(l))conf.push(k);out.push(cp(l));return}  // cambiata qui
      if(l!==undefined&&b===undefined){if(J(r)!==J(l))conf.push(k);out.push(cp(l));return}       // aggiunta qui e anche là
      out.push(cp(r))});
    local.forEach(l=>{const k=keyOf(l);if(seen.has(k))return;if(!B.has(k))out.push(cp(l));else if(J(l)!==J(B.get(k)))conf.push(k)});   // tolta là ma cambiata qui: resta tolta               // aggiunta solo qui
    return out}
  if(local&&remote&&typeof local==='object'&&typeof remote==='object'&&!Array.isArray(local)&&!Array.isArray(remote)){
    const b=base&&typeof base==='object'?base:{},out=cp(remote);
    new Set([...Object.keys(b),...Object.keys(local)]).forEach(k=>{
      if(J(local[k])===J(b[k]))return;
      if(k==='next'&&+remote[k]>+local[k])return;                                                    // numerazione: vince il numero più alto
      if(J(remote[k])!==J(b[k])&&J(remote[k])!==J(local[k])&&k!=='next')conf.push(k);
      if(local[k]===undefined)delete out[k];else out[k]=cp(local[k])});
    return out}
  conf.push('');return cp(local);
}
window.PREV_MERGE3=merge3;

function remoteStore(sb,uid,prev,quotes){
  const SINGLE=['azienda','listino','listinoFornVer','clienti'],MERGE=['azienda','listino','clienti'],C={},T={},sig={},BASE={},P=new Set(),F=new Set();
  prev.forEach(d=>{const v=d.data&&d.data.v;if(d.id==='bozza_'+uid)C.bozza=v;else if(SINGLE.includes(d.id)){C[d.id]=v;BASE[d.id]=J(v)}});
  const arch=quotes.map(d=>d.data).filter(Boolean).sort((a,b)=>String(b.aggiornato||b.data||'').localeCompare(String(a.aggiornato||a.data||'')));
  arch.forEach(a=>sig[a.id]=JSON.stringify(a));C.archivio=arch;
  let busy=0;
  const upd=()=>status(busy?'☁️ Salvataggio…':'☁️ Salvato'),
  run=(key,fn,wait)=>{if(P.has(key))clearTimeout(T[key]);else{P.add(key);busy++}upd();T[key]=setTimeout(async()=>{P.delete(key);F.add(key);try{await fn();F.delete(key);busy--;upd()}catch(e){F.delete(key);busy--;upd();status('⚠️ Non salvato');note('Salvataggio non riuscito: '+(e.message||e)+'. Riprovo tra poco.');delete sig['!'+key];setTimeout(()=>retry(key),5000)}},wait)},
  put=async(coll,id,data)=>{const r=await sb.from('docs').upsert({coll,id,data});if(r.error)throw r.error},
  del=async(coll,id)=>{const r=await sb.from('docs').delete().eq('coll',coll).eq('id',id);if(r.error)throw r.error},
  retry=k=>{if(k.startsWith('q:')){const id=k.slice(2),a=C.archivio.find(x=>x.id===id);delete sig[id];a?saveQ(a):delQ(id)}else saveK(k)},
  /* listino, clienti, azienda: prima di salvare rilegge il database e unisce le modifiche di altri admin */
  saveMerged=async k=>{
    const mine=J(C[k]);if(BASE[k]===mine)return;
    const r=await sb.from('docs').select('data').eq('coll','prev').eq('id',k).maybeSingle();if(r.error)throw r.error;
    const remote=r.data&&r.data.data?r.data.data.v:undefined,rj=J(remote);let val=JSON.parse(mine),conf=[];
    if(rj!==undefined&&BASE[k]!==undefined&&rj!==BASE[k]&&rj!==mine)val=merge3(JSON.parse(BASE[k]),val,remote,conf);
    await put('prev',k,{v:val});
    const vj=J(val);
    if(J(C[k])!==mine){const later=[];C[k]=merge3(JSON.parse(mine),C[k],val,later);setTimeout(()=>saveK(k),0)}   // modificato di nuovo nel frattempo
    else C[k]=JSON.parse(vj);
    BASE[k]=vj;
    if(vj!==mine&&typeof window.PREV_ON_REMOTE==='function')window.PREV_ON_REMOTE(k,C[k],conf);
  },
  saveK=k=>run(k,()=>MERGE.includes(k)?saveMerged(k):put('prev',k==='bozza'?'bozza_'+uid:k,{v:C[k]}),k==='bozza'?900:500),
  saveQ=a=>{const s=JSON.stringify(a);if(sig[a.id]===s)return;sig[a.id]=s;run('q:'+a.id,()=>put('prevq',a.id,JSON.parse(s)),300)},
  delQ=id=>{delete sig[id];run('q:'+id,()=>del('prevq',id),100)};

  addEventListener('beforeunload',e=>{if(busy){e.preventDefault();e.returnValue=''}});
  status('☁️ Salvato');
  return{
    sb,uid,remote:true,
    /* rilegge l'archivio dal database (preventivi e stati cambiati da altri admin) */
    async reloadArchive(){
      const out=[];for(let from=0;;from+=1000){const {data,error}=await sb.from('docs').select('id,data').eq('coll','prevq').range(from,from+999);if(error)throw error;out.push(...data);if(data.length<1000)break}
      const local=new Map(C.archivio.map(a=>[a.id,a])),pending=id=>P.has('q:'+id)||F.has('q:'+id);
      const list=out.map(d=>d.data).filter(Boolean).map(a=>{if(pending(a.id)&&local.has(a.id))return local.get(a.id);sig[a.id]=JSON.stringify(a);return a});
      C.archivio.forEach(a=>{if(!list.some(x=>x.id===a.id)&&pending(a.id))list.push(a)});
      Object.keys(sig).forEach(id=>{if(!id.startsWith('!')&&!list.some(x=>x.id===id))delete sig[id]});
      list.sort((a,b)=>String(b.aggiornato||b.data||'').localeCompare(String(a.aggiornato||a.data||'')));
      C.archivio=list;return list},
    get(k,def){const v=C[k];return v==null?def:v},
    set(k,v){
      C[k]=v;
      if(k==='archivio'){const ids=new Set(v.map(a=>a.id));v.forEach(saveQ);Object.keys(sig).forEach(id=>{if(!id.startsWith('!')&&!ids.has(id))delQ(id)})}
      else saveK(k);
      return true;
    }};
}

async function start(store){
  window.PREV_STORE=store;
  /* l'app dei preventivi è divisa in più file (cartella js/): si caricano in quest'ordine, uno dopo l'altro */
  ['01-base','02-calcoli-modulo','03-voci','04-documento','05-listino','06-pdf','07-clienti-archivio','08-stato-storico'].forEach(f=>{
    const s=document.createElement('script');s.src='js/'+f+'.js';s.async=false;document.body.appendChild(s)});
}

(async()=>{
  if(LOCAL){const b=$('#bBack');if(b&&!CFGOK)b.style.display='none';status('💾 Solo su questo browser');return start(localStore())}
  if(!window.supabase)return gate('Connessione non disponibile','Non riesco a caricare i componenti necessari. Controlla la connessione e riprova.',true);
  const sb=supabase.createClient(CFG.url,CFG.key);
  const {data:{session}}=await sb.auth.getSession();
  if(!session)return gate('Accesso richiesto','Apri prima l\'app e accedi con il tuo account, poi torna ai Preventivi.',true);
  window.PREV_FN=async(name,body)=>{
    const r=await sb.functions.invoke(name,{body});
    if(r.error){let m=r.error.message;try{const j=await r.error.context.json();if(j&&j.error)m=j.error}catch(e){}throw new Error(m)}
    return r.data};
  const uid=session.user.id,{data:me,error:e1}=await sb.from('profiles').select('role,active').eq('id',uid).maybeSingle();
  if(e1||!me||me.active===false||!['admin','super'].includes(me.role))return gate('Area riservata','I preventivi sono visibili solo al Proprietario e agli Admin.',true);
  gate('Carico i preventivi…','Un attimo.',false);
  const all=async coll=>{const out=[];for(let from=0;;from+=1000){const {data,error}=await sb.from('docs').select('id,data').eq('coll',coll).range(from,from+999);if(error)throw error;out.push(...data);if(data.length<1000)break}return out};
  try{const [p,q]=await Promise.all([all('prev'),all('prevq')]);
    /* ditta nuova: i dati dei preventivi partono da quelli inseriti nelle Impostazioni ditta dell'app */
    if(!p.some(d=>d.id==='azienda')){const r=await sb.from('docs').select('data').eq('coll','settings').eq('id','company').maybeSingle();const c=r.data&&r.data.data;
      if(c&&c.name)window.PREV_AZ_DEFAULT={nome:c.name,ragione:c.name,logo:c.logo||'',sede:String(c.head||'').split(/\n|;/)[0].trim()}}
    $('#gate')?.remove();await start(remoteStore(sb,uid,p,q))}
  catch(e){gate('Non riesco a caricare i dati','Controlla la connessione e riprova. ('+(e.message||e)+')',true)}
})();
})();
