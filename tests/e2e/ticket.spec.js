// Ticket: creazione e cambio di stato
const {test,expect,EMP}=require('./fixture');

test('nuovo ticket salvato e visibile in elenco',async({page})=>{
  await page.clock.setFixedTime(new Date('2026-11-17T09:00:00+01:00'));
  await page.goto('/');
  await page.locator('nav').getByRole('button',{name:'Ticket'}).click();
  await page.getByRole('button',{name:'+ Nuovo',exact:true}).click();
  const md=page.locator('.md');
  await md.locator('label.f:has-text("Titolo") input').fill('Router guasto dal cliente');
  await md.locator('textarea').first().fill('Non si accende');
  await md.locator('label.f:has-text("Urgenza") select').selectOption('urgente');
  await md.locator('label.f:has-text("Scadenza") input').fill('2026-11-18');
  await md.locator('label.tgl:has-text("Mario Dipendente") input').check();
  await md.getByRole('button',{name:'Salva'}).click();
  const tix=()=>page.fakeDb().then(s=>s.tables.docs.filter(d=>d.coll==='tix'));
  await expect.poll(async()=>(await tix()).length).toBe(1);
  expect((await tix())[0].data).toMatchObject({title:'Router guasto dal cliente',desc:'Non si accende',due:'2026-11-18',status:'Fare',prio:'urgente',assignees:[EMP.id]});
  await page.getByRole('button',{name:'📋 Elenco'}).click();
  await expect(page.locator('main')).toContainText('Router guasto dal cliente');
  await expect(page.locator('main')).toContainText('Da fare (1)');
  // segna come fatto
  await page.getByTitle('Segna come fatto').click();
  await expect.poll(async()=>(await tix())[0].data.status).toBe('Fatto');
  expect(page.errors).toEqual([]);
});
