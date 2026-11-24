// Permessi a ore, tipi di permesso e arrotondamento degli orari
const {test,expect,seed,EMP,ADMIN}=require('./fixture');
const doc=(coll,id,data)=>({coll,id,data});

test.describe('dipendente',()=>{
  test.use({db:seed({as:EMP,docs:[doc('reqs','p1',{uid:EMP.id,type:'permesso',kind:'vis',from:'2026-11-17',to:'2026-11-17',hin:'16:00',hout:'18:00',hours:2,status:'approved'})]})});

  test('permesso a ore: dalle/alle, niente ore per le ferie, uscita prevista in «Oggi»',async({page})=>{
    await page.clock.setFixedTime(new Date('2026-11-17T09:00:00+01:00'));
    await page.goto('/');
    // promemoria in «Oggi»: permesso a fine giornata, uscita alle 16
    await expect(page.locator('.hero')).toContainText('Oggi sei in permesso (Visita medica) dalle 16:00 alle 18:00: uscita prevista alle 16:00');
    await expect(page.getByRole('button',{name:/Timbra entrata/})).toBeEnabled();

    await page.locator('nav').getByRole('button',{name:'Richieste'}).click();
    await expect(page.locator('main')).toContainText('Visita medica · dalle 16:00 alle 18:00');
    await page.getByRole('button',{name:'+ Nuova',exact:true}).click();
    const md=page.locator('.md');
    await md.locator('select').first().selectOption('ferie');
    await expect(md.locator('input[type=time]').first()).toBeHidden();
    await md.locator('select').first().selectOption('permesso');
    await md.locator('select').nth(1).selectOption('l104');
    await md.locator('input[type=date]').nth(0).fill('2026-12-03');
    await md.locator('input[type=date]').nth(1).fill('2026-12-03');
    await md.locator('input[type=time]').nth(0).fill('09:00');
    await md.locator('input[type=time]').nth(1).fill('11:00');
    await expect(md).toContainText('conteggiate: 2 h');
    await expect(md).toContainText('non scala il saldo permessi');
    await md.getByRole('button',{name:'Invia'}).click();
    await expect.poll(async()=>(await page.fakeDb()).tables.docs.find(d=>d.coll==='reqs'&&d.id!=='p1')?.data).toMatchObject({type:'permesso',kind:'l104',hin:'09:00',hout:'11:00',hours:2,status:'pending'});
    expect(page.errors).toEqual([]);
  });
});

test.describe('titolare',()=>{
  test.use({db:seed({as:ADMIN,docs:[doc('days',EMP.id+'_2026-11-17',{uid:EMP.id,date:'2026-11-17',in:'09:10',out:'18:10',pause:60,in_src:'server',out_src:'server'})]})});

  test('arrotondamento: l\'orario reale resta, le ore si calcolano arrotondate',async({page})=>{
    await page.clock.setFixedTime(new Date('2026-11-20T12:00:00+01:00'));
    await page.goto('/');
    await page.locator('nav').getByRole('button',{name:'Report'}).click();
    await page.locator('select.sel').selectOption(EMP.id);
    await expect(page.locator('main')).toContainText('2026-11-1709:1018:10608');
    await page.locator('nav').getByRole('button',{name:'Team'}).click();
    await page.getByRole('button',{name:'⏱️ Tolleranza e arrotondamento'}).click();
    const md=page.locator('.md');
    await md.locator('select').nth(2).selectOption('15');
    await md.locator('select').nth(4).selectOption('15');
    await expect(md).toContainText('entrata 09:10 → 09:15');
    await md.getByRole('button',{name:'Salva'}).click();
    await expect.poll(async()=>(await page.fakeDb()).tables.docs.find(d=>d.coll==='settings'&&d.id==='rules')?.data.rnd).toMatchObject({inStep:15,inDir:'up',outStep:15,outDir:'down'});
    await page.locator('nav').getByRole('button',{name:'Report'}).click();
    await page.locator('select.sel').selectOption(EMP.id);
    await expect(page.locator('main')).toContainText('09:15 (reale 09:10)');
    await expect(page.locator('main')).toContainText('18:00 (reale 18:10)');
    await expect(page.locator('main')).toContainText('7,75');
    const day=(await page.fakeDb()).tables.docs.find(d=>d.coll==='days').data;
    expect(day).toMatchObject({in:'09:10',out:'18:10'});
    expect(page.errors).toEqual([]);
  });
});
