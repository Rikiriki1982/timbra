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

test.describe('storico',()=>{
  const {seed,ADMIN}=require('./fixture');
  const db=seed({docs:[
    {coll:'settings',id:'company',data:{name:'Prova',in:'09:00',out:'18:00',pause:60}},
    {coll:'tix',id:'t1',data:{uid:ADMIN.id,title:'Pieve del Cairo',status:'Attesa',prio:'alta',due:'2026-11-20',assignees:[EMP.id],created:Date.parse('2026-11-17T08:00:00Z')}}]});
  db.tables.tix_log=[
    {id:1,tix_id:'t1',at:'2026-11-17T08:00:00Z',by_user:ADMIN.id,action:'insert',changes:{title:'Pieve del Cairo',status:'Fare',prio:'normale',assignees:[]}},
    {id:2,tix_id:'t1',at:'2026-11-17T09:30:00Z',by_user:EMP.id,action:'update',changes:{status:['Fare','Attesa'],prio:['normale','alta'],assignees:[[],[EMP.id]],due:[null,'2026-11-20']}}];
  test.use({db});
  test('storico modifiche nel dettaglio del ticket',async({page})=>{
    await page.clock.setFixedTime(new Date('2026-11-17T10:00:00+01:00'));
    await page.goto('/');
    await page.locator('nav').getByRole('button',{name:'Ticket'}).click();
    await page.getByRole('button',{name:'📋 Elenco'}).click();
    await page.locator('main').getByText('Pieve del Cairo').click();
    await page.getByRole('button',{name:'🕓 Storico modifiche'}).click();
    const md=page.locator('.md');
    await expect(md).toContainText('Creato da Titolare Prova');
    await expect(md).toContainText('Modificato da Mario Dipendente');
    await expect(md).toContainText('Stato: Da fare  ⇒  In attesa');
    await expect(md).toContainText('Urgenza: Normale  ⇒  Alta');
    await expect(md).toContainText('Assegnato a: —  ⇒  Mario Dipendente');
    expect(page.errors).toEqual([]);
  });
});
