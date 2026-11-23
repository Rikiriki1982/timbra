// Ticket: al completamento si inseriscono materiale usato, ore di lavoro e link alla pagina OneNote
const {test,expect,seed,ADMIN,EMP}=require('./fixture');

test.use({db:seed({docs:[
  {coll:'settings',id:'company',data:{name:'Prova',in:'09:00',out:'18:00',pause:60}},
  {coll:'tix',id:'t1',data:{uid:ADMIN.id,title:'Caldaia in blocco',status:'Fare',prio:'normale',due:'2026-11-17',assignees:[EMP.id],created:Date.parse('2026-11-16T08:00:00Z')}}]})});

test('completamento con materiale, ore e pagina OneNote',async({page})=>{
  await page.clock.setFixedTime(new Date('2026-11-17T10:00:00+01:00'));
  await page.goto('/');
  await page.locator('nav').getByRole('button',{name:'Ticket'}).click();
  await page.getByRole('button',{name:'📋 Elenco'}).click();
  await page.getByTitle('Segna come fatto').click();
  const md=page.locator('.md');
  await expect(md).toContainText('Materiale usato');
  await md.getByPlaceholder('Materiale (es. cavo di rete)').fill('Valvola di sfiato');
  await md.getByPlaceholder('Q.tà').fill('1');
  await md.getByRole('button',{name:'➕ Aggiungi materiale'}).click();
  await md.getByPlaceholder('Materiale (es. cavo di rete)').nth(1).fill('Guarnizione');
  await md.getByPlaceholder('Q.tà').nth(1).fill('2');
  await md.locator('input[type=number]').nth(0).fill('1');
  await md.locator('input[type=number]').nth(1).fill('30');
  // un link non valido viene rifiutato
  await md.getByPlaceholder('Incolla qui il link della pagina').fill('javascript:alert(1)');
  await md.getByRole('button',{name:'✓ Completa'}).click();
  await expect(md).toContainText('deve iniziare con https://');
  await md.getByPlaceholder('Incolla qui il link della pagina').fill('https://onedrive.live.com/redir?resid=ABC&page=Caldaia');
  await md.getByRole('button',{name:'✓ Completa'}).click();
  const tix=()=>page.fakeDb().then(s=>s.tables.docs.find(d=>d.id==='t1').data);
  await expect.poll(async()=>(await tix()).status).toBe('Fatto');
  expect((await tix()).rep).toMatchObject({min:90,link:'https://onedrive.live.com/redir?resid=ABC&page=Caldaia',
    mat:[{d:'Valvola di sfiato',q:'1'},{d:'Guarnizione',q:'2'}],by:ADMIN.id});
  // nel dettaglio (Archivio) si vede il lavoro svolto e si apre la pagina OneNote
  await page.getByRole('button',{name:/🗄 Archivio/}).click();
  await page.locator('main').getByText('Caldaia in blocco').click();
  await expect(md).toContainText('Ore di lavoro: 1 h 30 min');
  await expect(md).toContainText('Valvola di sfiato · 1');
  await expect(md.getByRole('link',{name:'📓 Apri pagina OneNote'})).toHaveAttribute('href',/onedrive\.live\.com/);
  // si può correggere dopo
  await md.getByRole('button',{name:'✏️ Modifica materiale e ore'}).click();
  await md.locator('input[type=number]').nth(0).fill('2');
  await md.getByRole('button',{name:'Salva'}).click();
  await expect.poll(async()=>(await tix()).rep.min).toBe(150);
  expect(page.errors).toEqual([]);
});

test.describe('dal listino e dal preventivo',()=>{
  const db=seed({as:EMP,docs:[
    {coll:'settings',id:'company',data:{name:'Prova',in:'09:00',out:'18:00',pause:60}},
    {coll:'tix',id:'t2',data:{uid:ADMIN.id,title:'Rete ufficio Rossi',status:'Fare',prio:'normale',due:'2026-11-17',assignees:[EMP.id],
      preventivo:{id:'q1',numero:'7'},matPrev:[{d:'SW8 - Switch 8 porte',q:'2',c:'SW8'}]}}]});
  db.rpc.listino_voci=[{id:'a1',codice:'SW8',titolo:'Switch 8 porte',descr:'',um:'pz'},{id:'a2',codice:'CV5',titolo:'Cavo di rete 5 m',descr:'',um:'pz'}];
  test.use({db});
  test('materiale del preventivo già caricato, scelta dal listino e seriali',async({page})=>{
    await page.clock.setFixedTime(new Date('2026-11-17T10:00:00+01:00'));
    await page.goto('/');
    await page.locator('nav').getByRole('button',{name:'Ticket'}).click();
    await page.getByRole('button',{name:'📋 Elenco'}).click();
    await page.locator('main').getByText('Rete ufficio Rossi').click();
    const md=page.locator('.md');
    await expect(md).toContainText('📦 Materiale previsto (preventivo 7)');
    await expect(md).toContainText('SW8 - Switch 8 porte · 2');
    await md.getByRole('button',{name:'→ Fatto'}).click();
    await expect(md).toContainText('dal preventivo');
    const art=md.getByPlaceholder('Cerca nel listino o scrivi');
    await expect(art.first()).toHaveValue('SW8 - Switch 8 porte');
    await expect(md.locator('datalist option')).toHaveCount(2);
    await md.getByPlaceholder('Seriali (facoltativi, separati da virgola)').first().fill('SN111, SN222');
    await md.getByRole('button',{name:'➕ Aggiungi materiale'}).click();
    await art.nth(1).fill('CV5 - Cavo di rete 5 m');
    await art.nth(1).dispatchEvent('change');
    await expect(md.getByPlaceholder('Q.tà').nth(1)).toHaveValue('1');
    await md.getByRole('button',{name:'✓ Completa'}).click();
    const tix=()=>page.fakeDb().then(s=>s.tables.docs.find(d=>d.id==='t2').data);
    await expect.poll(async()=>(await tix()).status).toBe('Fatto');
    expect((await tix()).rep.mat).toEqual([{d:'SW8 - Switch 8 porte',q:'2',sn:'SN111, SN222',c:'SW8'},{d:'CV5 - Cavo di rete 5 m',q:'1',c:'CV5'}]);
    await page.getByRole('button',{name:/🗄 Archivio/}).click();
    await page.locator('main').getByText('Rete ufficio Rossi').click();
    await expect(md).toContainText('S/N: SN111, SN222');
    expect(page.errors).toEqual([]);
  });
});

test('il ticket dal preventivo prende il materiale senza la manodopera',async({page})=>{
  await page.goto('/preventivi/');
  await expect(page.locator('#syncSt')).toContainText('Salvato');
  const m=await page.evaluate(()=>ticketMat({righe:[
    {cat:'mat',codice:'SW8',titolo:'Switch 8 porte',qta:'2',um:'pz'},
    {cat:'mat',titolo:'Cavo',qta:'15',um:'m'},
    {cat:'man',descr:'Manodopera',qta:'3',um:'h'},
    {cat:'mat',titolo:'Riga vuota',qta:'0'}]}));
  expect(m).toEqual([{d:'SW8 - Switch 8 porte',q:'2',c:'SW8'},{d:'Cavo',q:'15 m'}]);
  expect(await page.evaluate(()=>ticketMat({tipo:'conn',conn:[{titolo:'Fibra',qta:1}]}))).toEqual([]);
});
