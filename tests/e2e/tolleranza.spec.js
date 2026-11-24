// Tolleranza su entrata e uscita: entro N minuti dall'orario previsto conta l'orario previsto
const {test,expect,seed,EMP,ADMIN}=require('./fixture');
const doc=(coll,id,data)=>({coll,id,data});
const day=(dt,i,o)=>doc('days',EMP.id+'_'+dt,{uid:EMP.id,date:dt,in:i,out:o,pause:60,in_src:'server',out_src:'server'});

test.use({db:seed({as:ADMIN,docs:[
  doc('settings','rules',{rnd:{inTol:10,outTol:10}}),
  day('2026-11-17','09:10','17:50'),   // dentro la tolleranza: conta 9:00 → 18:00
  day('2026-11-18','09:11','17:49'),   // fuori tolleranza: orario reale
  day('2026-11-19','09:05','15:55'),   // permesso 16-18: l'uscita prevista è 16:00
  doc('reqs','p1',{uid:EMP.id,type:'permesso',kind:'vis',from:'2026-11-19',to:'2026-11-19',hin:'16:00',hout:'18:00',hours:2,status:'approved'})
]})});

test('tolleranza: 9:10 conta 9:00, 17:50 conta 18:00, oltre vale l\'orario reale',async({page})=>{
  await page.clock.setFixedTime(new Date('2026-11-21T12:00:00+01:00'));
  await page.goto('/');
  await page.locator('nav').getByRole('button',{name:'Report'}).click();
  await page.locator('select.sel').selectOption(EMP.id);
  const tab=page.locator('table').first();
  await expect(tab.locator('tr',{hasText:'2026-11-17'})).toContainText('09:00 (reale 09:10)18:00 (reale 17:50)6088');
  await expect(tab.locator('tr',{hasText:'2026-11-18'})).toContainText('09:1117:49607,63');
  await expect(tab.locator('tr',{hasText:'2026-11-19'})).toContainText('09:00 (reale 09:05)16:00 (reale 15:55)606');
  await expect(page.locator('main')).toContainText('tolleranza entrata 10 min, tolleranza uscita 10 min');

  // le impostazioni in Team
  await page.locator('nav').getByRole('button',{name:'Team'}).click();
  await page.getByRole('button',{name:'⏱️ Tolleranza e arrotondamento'}).click();
  const md=page.locator('.md');
  await md.locator('select').nth(0).selectOption('15');
  await md.locator('select').nth(1).selectOption('5');
  await expect(md).toContainText('entrata 09:10 → 09:00, entrata 09:40 → 09:40, uscita 17:50 → 17:50');
  await md.getByRole('button',{name:'Salva'}).click();
  await expect.poll(async()=>(await page.fakeDb()).tables.docs.find(d=>d.coll==='settings'&&d.id==='rules')?.data.rnd).toMatchObject({inTol:15,outTol:5});
  // l'orario reale resta salvato
  expect((await page.fakeDb()).tables.docs.find(d=>d.id===EMP.id+'_2026-11-17').data).toMatchObject({in:'09:10',out:'17:50'});
  expect(page.errors).toEqual([]);
});
