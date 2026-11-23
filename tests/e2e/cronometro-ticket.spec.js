// Ticket: cronometro del lavoro (Avvio / Pausa / Fine lavori); il totale precompila le ore al completamento
const {test,expect,seed,ADMIN,EMP}=require('./fixture');

test.use({db:seed({as:EMP,docs:[
  {coll:'settings',id:'company',data:{name:'Prova',in:'09:00',out:'18:00',pause:60}},
  {coll:'tix',id:'t1',data:{uid:ADMIN.id,title:'Caldaia in blocco',status:'Fare',prio:'normale',due:'2026-11-17',assignees:[EMP.id,ADMIN.id],created:Date.parse('2026-11-16T08:00:00Z'),
    clk:{[ADMIN.id]:{ms:30*60000,end:true}}}}]})});

test('avvio, pausa, ripresa e fine lavori con ore precompilate',async({page})=>{
  await page.clock.install({time:new Date('2026-11-17T09:00:00+01:00')});
  await page.goto('/');
  await page.locator('nav').getByRole('button',{name:'Ticket'}).click();
  await page.getByRole('button',{name:'📋 Elenco'}).click();
  await page.locator('main').getByText('Caldaia in blocco').click();
  const md=page.locator('.md'),tix=()=>page.fakeDb().then(s=>s.tables.docs.find(d=>d.id==='t1').data);
  await expect(md).toContainText('⏱️ Cronometro lavori');
  await expect(md).toContainText('Titolare Prova: 30 min · finito');
  await md.getByRole('button',{name:'▶ Avvio lavori'}).click();
  await expect(md.getByRole('button',{name:'⏸ Pausa'})).toBeVisible();
  expect((await tix()).clk[EMP.id].on).toBeTruthy();
  await page.clock.fastForward(65*60000);                               // 1 ora e 5 minuti di lavoro
  await expect(md.locator('.crono')).toContainText('1:05:00');
  await md.getByRole('button',{name:'⏸ Pausa'}).click();
  await expect(md.getByRole('button',{name:'▶ Riprendi'})).toBeVisible();
  await page.clock.fastForward(30*60000);                               // pausa: non conta
  await md.getByRole('button',{name:'▶ Riprendi'}).click();
  await page.clock.fastForward(25*60000);
  // nell'elenco si vede che il lavoro è in corso
  await md.getByRole('button',{name:'Chiudi'}).click();
  await expect(page.locator('main')).toContainText('⏱️ lavoro in corso');
  await page.locator('main').getByText('Caldaia in blocco').click();
  await md.getByRole('button',{name:'⏹ Fine lavori'}).click();
  // si apre il completamento con le ore del cronometro: 1 h 30 min di Mario + 30 min del titolare
  await expect(md).toContainText('dal cronometro');
  await expect(md.locator('input[type=number]').nth(0)).toHaveValue('2');
  await expect(md.locator('input[type=number]').nth(1)).toHaveValue('0');
  const c=(await tix()).clk[EMP.id];expect(c.end).toBe(true);expect(c.on).toBeUndefined();expect(Math.round(c.ms/60000)).toBe(90);
  await md.getByRole('button',{name:'✓ Completa'}).click();
  await expect.poll(async()=>(await tix()).status).toBe('Fatto');
  expect((await tix()).rep.min).toBe(120);
  expect(page.errors).toEqual([]);
});
