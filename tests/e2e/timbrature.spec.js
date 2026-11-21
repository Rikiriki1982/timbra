// Timbratura: l'orario lo scrive il "server" (qui il database finto, che imita il trigger vero)
const {test,expect,seed,EMP}=require('./fixture');
test.use({db:seed({as:EMP})});

test('entrata e uscita vengono salvate con l\'orario del server',async({page})=>{
  await page.clock.setFixedTime(new Date('2026-11-17T09:02:00+01:00'));
  await page.goto('/');
  await page.getByRole('button',{name:/Timbra entrata/}).click();
  await expect(page.locator('.hero')).toContainText('09:02');
  let day=(await page.fakeDb()).tables.docs.find(d=>d.coll==='days');
  expect(day.data).toMatchObject({uid:EMP.id,date:'2026-11-17',in:'09:02',in_src:'server'});
  expect(day.data.punch).toBeUndefined();

  await page.clock.setFixedTime(new Date('2026-11-17T18:05:00+01:00'));
  await page.reload();
  await page.getByRole('button',{name:/Timbra uscita/}).click();
  await page.locator('.md').getByRole('button',{name:'Salva uscita'}).click();
  await expect.poll(async()=>(await page.fakeDb()).tables.docs.find(d=>d.coll==='days').data.out).toBe('18:05');
  day=(await page.fakeDb()).tables.docs.find(d=>d.coll==='days');
  expect(day.data).toMatchObject({in:'09:02',in_src:'server',out:'18:05',out_src:'server'});
  expect(page.errors).toEqual([]);
});

test('un orario scritto a mano viene segnato come manuale',async({page})=>{
  await page.clock.setFixedTime(new Date('2026-11-17T09:00:00+01:00'));
  await page.goto('/');
  await page.getByRole('button',{name:/Timbra entrata/}).click();
  await expect(page.locator('.hero')).toContainText('09:00');
  await page.clock.setFixedTime(new Date('2026-11-17T19:30:00+01:00'));
  await page.reload();
  await page.getByRole('button',{name:/Timbra uscita/}).click();
  await page.locator('.md input[type=time]').fill('18:00');
  await page.locator('.md').getByRole('button',{name:'Salva uscita'}).click();
  await expect.poll(async()=>(await page.fakeDb()).tables.docs.find(d=>d.coll==='days').data).toMatchObject({out:'18:00',out_src:'manual'});
});
