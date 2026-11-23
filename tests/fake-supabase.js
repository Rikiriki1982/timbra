/* Finto Supabase per i controlli automatici: sostituisce la libreria vera solo durante i test.
   I dati stanno nel browser di prova (localStorage "__fake_db"), quindi non tocca mai il database vero. */
(function(){
"use strict";
const KEY='__fake_db';
const load=()=>{try{return JSON.parse(localStorage.getItem(KEY))||{}}catch(e){return{}}};
const save=s=>localStorage.setItem(KEY,JSON.stringify(s));
const st=()=>{const s=load();s.tables=s.tables||{};s.calls=s.calls||[];return s};
const pad=n=>String(n).padStart(2,'0');
const now=()=>{const d=new Date();return{hm:pad(d.getHours())+':'+pad(d.getMinutes()),day:d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())}};
const keyCols=t=>t==='docs'?['coll','id']:t==='push_subs'?['endpoint']:['id'];
const same=(a,b,cols)=>cols.every(c=>String(a[c])===String(b[c]));
let seq=1;

/* come il trigger days_stamp del database: "punch" fa scrivere l'orario al server */
/* come il trigger tix_clock: clk_do = start / pause / stop aggiorna il cronometro di chi lo preme, con l'ora del "server" */
function clock(row,old,uid){
  const d={...row.data},a=d.clk_do,t=Date.now(),o=(old&&old.data)||{},c={...(old&&o.clk||{})};delete d.clk_do;delete d.clk;
  if(['start','pause','stop'].includes(a)){const m=c[uid]||{},n={ms:(+m.ms||0)+(m.on?Math.max(0,t-m.on):0)};if(a==='start')n.on=t;if(a==='stop')n.end=true;c[uid]=n}
  if(old&&d.status==='Fatto'&&o.status!=='Fatto')for(const k in c)if(c[k].on)c[k]={ms:(+c[k].ms||0)+Math.max(0,t-c[k].on),end:true};
  if(Object.keys(c).length)d.clk=c;return{...row,data:d};
}
function stamp(row,old,uid){
  if(row.coll==='tix')return clock(row,old,uid);
  if(row.coll!=='days')return row;
  const d={...row.data},p=d.punch,o=(old&&old.data)||{},t=now();delete d.punch;
  for(const k of['in','out']){
    delete d[k+'_src'];delete d[k+'_at'];delete d[k+'_by'];
    if(p===k&&d.date===t.day)Object.assign(d,{[k]:t.hm,[k+'_src']:'server',[k+'_at']:new Date().toISOString(),[k+'_by']:uid});
    else if(!d[k]);
    else if(d[k]===(o[k]||'')){if(o[k+'_src'])Object.assign(d,{[k+'_src']:o[k+'_src'],[k+'_at']:o[k+'_at'],[k+'_by']:o[k+'_by']})}
    else Object.assign(d,{[k+'_src']:'manual',[k+'_at']:new Date().toISOString(),[k+'_by']:uid});
  }
  return{...row,data:d};
}

function query(table){
  const f=[];let op='select',payload=null,opts={},ord=[],lim=null,rng=null,one=null;
  const b={
    select(){if(op==='select')op='select';return b},
    eq(c,v){f.push(r=>String(r[c])===String(v));return b},
    neq(c,v){f.push(r=>String(r[c])!==String(v));return b},
    in(c,vs){f.push(r=>vs.map(String).includes(String(r[c])));return b},
    gte(c,v){f.push(r=>r[c]>=v);return b},lte(c,v){f.push(r=>r[c]<=v);return b},
    gt(c,v){f.push(r=>r[c]>v);return b},lt(c,v){f.push(r=>r[c]<v);return b},
    is(c,v){f.push(r=>(r[c]??null)===v);return b},
    like(c,v){const re=new RegExp('^'+String(v).replace(/%/g,'.*')+'$');f.push(r=>re.test(r[c]));return b},
    ilike(c,v){const re=new RegExp('^'+String(v).replace(/%/g,'.*')+'$','i');f.push(r=>re.test(r[c]));return b},
    filter(c,o,v){return o==='eq'?b.eq(c,v):b},
    match(o){Object.keys(o).forEach(k=>b.eq(k,o[k]));return b},
    order(c,o){ord.push([c,!o||o.ascending!==false]);return b},
    limit(n){lim=n;return b},range(a,z){rng=[a,z];return b},
    maybeSingle(){one='maybe';return b},single(){one='single';return b},
    insert(rows){op='insert';payload=[].concat(rows);return b},
    upsert(rows,o){op='upsert';payload=[].concat(rows);opts=o||{};return b},
    update(v){op='update';payload=v;return b},
    delete(){op='delete';return b},
    then(res,rej){return Promise.resolve().then(run).then(res,rej)}
  };
  function run(){
    const s=st(),T=s.tables[table]=s.tables[table]||[],uid=s.session&&s.session.user.id,ok=r=>f.every(fn=>fn(r));
    let out=[];
    if(op==='insert'||op==='upsert'){
      const kc=opts.onConflict?String(opts.onConflict).split(','):keyCols(table);
      for(let r of payload){
        r={...r};if(table!=='docs'&&r.id==null&&table!=='profiles')r.id=seq++;
        if(!r.created_at)r.created_at=new Date().toISOString();
        const i=T.findIndex(x=>same(x,r,kc));
        if(i>=0&&op==='insert')return{data:null,error:{message:'duplicate key value violates unique constraint'}};
        if(table==='docs')r=stamp(r,i>=0?T[i]:null,uid);
        if(i>=0)T[i]={...T[i],...r};else T.push(r);out.push(r);
      }
    }else if(op==='update'){
      T.forEach((r,i)=>{if(ok(r)){let n={...r,...payload};if(table==='docs')n=stamp(n,r,uid);T[i]=n;out.push(n)}});
    }else if(op==='delete'){
      s.tables[table]=T.filter(r=>{if(ok(r)){out.push(r);return false}return true});
    }else{
      out=T.filter(ok).map(r=>({...r}));
      ord.slice().reverse().forEach(([c,asc])=>out.sort((a,z)=>(a[c]>z[c]?1:a[c]<z[c]?-1:0)*(asc?1:-1)));
      if(rng)out=out.slice(rng[0],rng[1]+1);if(lim!=null)out=out.slice(0,lim);
    }
    if(op!=='select')s.calls.push({table,op,n:out.length});
    save(s);
    if(one){if(out.length>1&&one==='single')return{data:null,error:{message:'more than one row'}};
      if(!out.length&&one==='single')return{data:null,error:{message:'no rows'}};return{data:out[0]||null,error:null}}
    return{data:op==='select'||payload?out:null,error:null,count:out.length};
  }
  return b;
}

function createClient(){
  const listeners=[];
  return{
    from:query,
    rpc:async(name,args)=>{const s=st();s.calls.push({rpc:name,args});save(s);const r=(s.rpc||{})[name];return{data:r===undefined?[]:r,error:null}},
    channel:()=>{const c={on:()=>c,subscribe:()=>c,unsubscribe:()=>{}};return c},
    removeChannel:()=>{},
    auth:{
      getSession:async()=>({data:{session:st().session||null},error:null}),
      getUser:async()=>({data:{user:(st().session||{}).user||null},error:null}),
      signInWithPassword:async({email,password})=>{const s=st(),u=(s.users||[]).find(x=>x.email===email&&x.password===password);
        if(!u)return{data:{},error:{message:'Invalid login credentials'}};
        s.session={access_token:'fake',user:{id:u.id,email:u.email,user_metadata:{name:u.name}}};save(s);return{data:{session:s.session,user:s.session.user},error:null}},
      signOut:async()=>{const s=st();delete s.session;save(s);return{error:null}},
      updateUser:async()=>({data:{},error:null}),
      resetPasswordForEmail:async()=>({data:{},error:null}),
      onAuthStateChange:f=>{listeners.push(f);return{data:{subscription:{unsubscribe(){}}}}}
    },
    functions:{invoke:async(name,o)=>{const s=st();let body=o&&o.body;if(body instanceof FormData)body='[file]';s.calls.push({fn:name,body});save(s);
      return{data:(s.fn||{})[name]||{ok:true},error:null}}},
    storage:{from:()=>({upload:async p=>({data:{path:p},error:null}),createSignedUrl:async()=>({data:{signedUrl:'data:,'},error:null}),remove:async()=>({data:[],error:null})})}
  };
}
window.supabase={createClient};
})();
