// Presenze del mese: colonna permessi e giornata più chiara (orario reale + orario conteggiato, ore in h e min)
const {test,expect,seed,EMP,ADMIN}=require('./fixture');
const doc=(coll,id,data)=>({coll,id,data});

test.use({db:seed({as:ADMIN,docs:[
  doc('settings','rules',{rnd:{inStep:30,inDir:'up',outStep:10,outDir:'down',otStep:30}}),
  doc('days',EMP.id+'_2026-11-19',{uid:EMP.id,date:'2026-11-19',in:'09:00',out:'18:22',pause:60,in_src:'server',out_src:'server'}),
  doc('days',EMP.id+'_2026-11-18',{uid:EMP.id,date:'2026-11-18',in:'09:00',out:'16:00',pause:60,in_src:'server',out_src:'server'}),
  doc('reqs','p1',{uid:EMP.id,type:'permesso',kind:'vis',from:'2026-11-18',to:'2026-11-18',hin:'16:00',hout:'18:00',hours:2,status:'approved'}),
  doc('reqs','p2',{uid:EMP.id,type:'permesso',kind:'rol',full:true,from:'2026-11-20',to:'2026-11-20',status:'approved'})
]})});

test('colonna permessi nel report e giornata con orario conteggiato',async({page})=>{
  await page.clock.setFixedTime(new Date('2026-11-21T12:00:00+01:00'));
  await page.goto('/');
  await page.locator('nav').getByRole('button',{name:'Report'}).click();
  await page.locator('select.sel').selectOption(EMP.id);
  const tab=page.locator('table').first();
  await expect(tab.locator('th').last()).toHaveText('Permessi');
  await expect(tab.locator('tr',{hasText:'2026-11-18'})).toContainText('2 h · Visita medica');
  // giornata intera di permesso, senza timbrature: compare lo stesso
  await expect(tab.locator('tr',{hasText:'2026-11-20'})).toContainText('8 h · ROL');
  // giovedì 19: 09:00 → 18:22 conta 18:20 → 8,33 h, straordinario 0
  await expect(tab.locator('tr',{hasText:'2026-11-19'})).toContainText('18:20 (reale 18:22)608,3380');
  await expect(page.locator('main')).toContainText('8,33 h = 8 h 20 min');

  await page.locator('nav').getByRole('button',{name:'Calendario'}).click();
  await page.locator('select.sel').selectOption(EMP.id);
  await page.locator('.cal .cell',{hasText:'8h20'}).click();
  await expect(page.locator('main')).toContainText('09:00 → 18:22 (conta 18:20) · pausa 60 min · 8 h 20 min');
  expect(page.errors).toEqual([]);
});
