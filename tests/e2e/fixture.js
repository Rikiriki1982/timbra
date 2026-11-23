/* Preparazione comune: database finto, nessuna connessione al Supabase vero. */
const base=require('@playwright/test');
const path=require('path');
const FAKE=path.join(__dirname,'..','fake-supabase.js');

const ADMIN={id:'00000000-0000-4000-8000-000000000001',email:'titolare@prova.it',name:'Titolare Prova',role:'super'};
const EMP={id:'00000000-0000-4000-8000-000000000002',email:'mario@prova.it',name:'Mario Dipendente',role:'user'};
const profile=u=>({id:u.id,email:u.email,name:u.name,role:u.role,active:true,joined:true,can_punch:true,can_request:true,cal_email:u.email,cal_sync:false,created_at:'2026-01-01T00:00:00Z'});

function seed({as=ADMIN,docs=[],loggedIn=true}={}){
  return{
    users:[ADMIN,EMP].map(u=>({...u,password:'prova123'})),
    session:loggedIn?{access_token:'fake',user:{id:as.id,email:as.email,user_metadata:{name:as.name}}}:undefined,
    tables:{profiles:[profile(ADMIN),profile(EMP)],docs,notifications:[],push_subs:[],days_log:[],prev_log:[],tix_log:[]},
    rpc:{team_list:[],team_groups:[]},
    calls:[]
  };
}

const test=base.test.extend({
  db:[undefined,{option:true}],
  page:async({page,db},use)=>{
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('dialog',d=>d.accept());
    await page.route(/supabase\.min\.js/,r=>r.fulfill({path:FAKE,contentType:'text/javascript'}));
    await page.route(/\.supabase\.co\//,r=>r.abort());           // mai il database vero
    await page.addInitScript(s=>{if(!localStorage.getItem('__fake_db'))localStorage.setItem('__fake_db',JSON.stringify(s))},db||seed());
    page.fakeDb=async()=>page.evaluate(()=>JSON.parse(localStorage.getItem('__fake_db')));
    page.errors=errors;
    await use(page);
  }
});
const today=()=>{const d=new Date(),p=n=>String(n).padStart(2,'0');return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate())};
module.exports={test,expect:base.expect,seed,ADMIN,EMP,today};
