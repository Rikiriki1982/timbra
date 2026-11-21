// Ferie: il dipendente chiede, il titolare approva
const {test,expect,seed,EMP,ADMIN}=require('./fixture');
test.use({db:seed({as:EMP})});

test('richiesta ferie del dipendente e approvazione del titolare',async({page})=>{
  await page.clock.setFixedTime(new Date('2026-11-17T09:00:00+01:00'));
  await page.goto('/');
  await page.locator('nav').getByRole('button',{name:'Richieste'}).click();
  await page.getByRole('button',{name:'+ Nuova',exact:true}).click();
  const md=page.locator('.md');
  await md.locator('select').first().selectOption('ferie');
  await md.locator('input[type=date]').nth(0).fill('2026-12-01');
  await md.locator('input[type=date]').nth(1).fill('2026-12-02');
  await md.getByRole('button',{name:'Invia'}).click();
  await expect(page.locator('main')).toContainText('2026-12-01 → 2026-12-02 · totale 16 h');
  await expect(page.locator('main')).toContainText('In attesa');
  const req=()=>page.fakeDb().then(s=>s.tables.docs.filter(d=>d.coll==='reqs'));
  expect(await req()).toHaveLength(1);
  expect((await req())[0].data).toMatchObject({uid:EMP.id,type:'ferie',from:'2026-12-01',to:'2026-12-02',status:'pending'});

  // ora entra il titolare
  await page.evaluate(a=>{const s=JSON.parse(localStorage.getItem('__fake_db'));s.session.user={id:a.id,email:a.email,user_metadata:{name:a.name}};localStorage.setItem('__fake_db',JSON.stringify(s))},ADMIN);
  await page.reload();
  await page.locator('nav').getByRole('button',{name:'Richieste'}).click();
  await expect(page.locator('main')).toContainText('Mario Dipendente · Ferie');
  await page.getByRole('button',{name:'✔ Approva'}).click();
  await expect.poll(async()=>(await req())[0].data.status).toBe('approved');
  await expect(page.locator('main')).not.toContainText('In attesa');
  expect(page.errors).toEqual([]);
});

test('il dipendente non vede i pulsanti per approvare',async({page})=>{
  await page.goto('/');
  await page.locator('nav').getByRole('button',{name:'Richieste'}).click();
  await page.getByRole('button',{name:'+ Nuova',exact:true}).click();
  await page.locator('.md').getByRole('button',{name:'Invia'}).click();
  await expect(page.locator('main')).toContainText('In attesa');
  await expect(page.getByRole('button',{name:'✔ Approva'})).toHaveCount(0);
});
