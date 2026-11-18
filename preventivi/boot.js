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
function remoteStore(sb,uid,prev,quotes){
  const SINGLE=['azienda','listino','listinoFornVer','clienti'],C={},T={},sig={};
  prev.forEach(d=>{const v=d.data&&d.data.v;if(d.id==='bozza_'+uid)C.bozza=v;else if(SINGLE.includes(d.id))C[d.id]=v});
  const arch=quotes.map(d=>d.data).filter(Boolean).sort((a,b)=>String(b.aggiornato||b.data||'').localeCompare(String(a.aggiornato||a.data||'')));
  arch.forEach(a=>sig[a.id]=JSON.stringify(a));C.archivio=arch;
  let busy=0;
  const upd=()=>status(busy?'☁️ Salvataggio…':'☁️ Salvato'),
  run=(key,fn,wait)=>{clearTimeout(T[key]);busy++;upd();T[key]=setTimeout(async()=>{try{await fn();busy--;upd()}catch(e){busy--;upd();status('⚠️ Non salvato');note('Salvataggio non riuscito: '+(e.message||e)+'. Riprovo tra poco.');delete sig['!'+key];setTimeout(()=>retry(key),5000)}},wait)},
  put=async(coll,id,data)=>{const r=await sb.from('docs').upsert({coll,id,data});if(r.error)throw r.error},
  del=async(coll,id)=>{const r=await sb.from('docs').delete().eq('coll',coll).eq('id',id);if(r.error)throw r.error},
  retry=k=>{if(k.startsWith('q:')){const id=k.slice(2),a=C.archivio.find(x=>x.id===id);delete sig[id];a?saveQ(a):delQ(id)}else saveK(k)},
  saveK=k=>run(k,()=>put('prev',k==='bozza'?'bozza_'+uid:k,{v:C[k]}),k==='bozza'?900:500),
  saveQ=a=>{const s=JSON.stringify(a);if(sig[a.id]===s)return;sig[a.id]=s;run('q:'+a.id,()=>put('prevq',a.id,JSON.parse(s)),300)},
  delQ=id=>{delete sig[id];run('q:'+id,()=>del('prevq',id),100)};

  addEventListener('beforeunload',e=>{if(busy){e.preventDefault();e.returnValue=''}});
  status('☁️ Salvato');
  return{
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
  const s=document.createElement('script');s.src='app.js';document.body.appendChild(s);
}

(async()=>{
  if(LOCAL){const b=$('#bBack');if(b&&!CFGOK)b.style.display='none';status('💾 Solo su questo browser');return start(localStore())}
  if(!window.supabase)return gate('Connessione non disponibile','Non riesco a caricare i componenti necessari. Controlla la connessione e riprova.',true);
  const sb=supabase.createClient(CFG.url,CFG.key);
  const {data:{session}}=await sb.auth.getSession();
  if(!session)return gate('Accesso richiesto','Apri prima l\'app e accedi con il tuo account, poi torna ai Preventivi.',true);
  const uid=session.user.id,{data:me,error:e1}=await sb.from('profiles').select('role,active').eq('id',uid).maybeSingle();
  if(e1||!me||me.active===false||!['admin','super'].includes(me.role))return gate('Area riservata','I preventivi sono visibili solo al Proprietario e agli Admin.',true);
  gate('Carico i preventivi…','Un attimo.',false);
  const all=async coll=>{const out=[];for(let from=0;;from+=1000){const {data,error}=await sb.from('docs').select('id,data').eq('coll',coll).range(from,from+999);if(error)throw error;out.push(...data);if(data.length<1000)break}return out};
  try{const [p,q]=await Promise.all([all('prev'),all('prevq')]);$('#gate')?.remove();await start(remoteStore(sb,uid,p,q))}
  catch(e){gate('Non riesco a caricare i dati','Controlla la connessione e riprova. ('+(e.message||e)+')',true)}
})();
})();
