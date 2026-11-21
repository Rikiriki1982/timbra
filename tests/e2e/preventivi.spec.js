// Preventivi: accesso riservato, calcolo totali, PDF, archivio nel database, unione modifiche tra admin
const fs=require('fs');
const {test,expect,seed,EMP}=require('./fixture');

test.describe('dipendente',()=>{
  test.use({db:seed({as:EMP})});
  test('il dipendente non può aprire i preventivi',async({page})=>{
    await page.goto('/preventivi/');
    await expect(page.locator('#gate')).toContainText('Area riservata');
  });
});

test('nuovo preventivo: totali, PDF, archivio online e riapertura dal PDF',async({page})=>{
  await page.clock.setFixedTime(new Date('2026-11-17T09:00:00+01:00'));
  await page.goto('/preventivi/');
  await expect(page.locator('#syncSt')).toContainText('Salvato');
  await page.locator('#c_nome').fill('Cliente Prova Srl');
  await page.locator('#q_oggetto').fill('Impianto di rete ufficio');
  await page.getByRole('button',{name:'+ Voce'}).first().click();
  await page.getByPlaceholder('Descrizione breve').fill('Switch 8 porte');
  await page.locator('[data-k=qta]').fill('2');
  await page.locator('[data-k=prezzo]').fill('50');
  await expect(page.locator('[data-tot]').first()).toContainText('100,00');
  await expect(page.locator('#sheet')).toContainText('Switch 8 porte');
  await expect(page.locator('#sheet')).toContainText('100,00');

  // Salva PDF: scarica un PDF vero
  const dl=page.waitForEvent('download');
  await page.locator('#bSave').click();
  const file=await dl;
  expect(file.suggestedFilename()).toBe('Preventivo 1 - Cliente Prova Srl.pdf');
  const pdfPath=await file.path();
  expect(fs.readFileSync(pdfPath).subarray(0,5).toString()).toBe('%PDF-');

  // ...e lo mette nell'archivio online
  const q=()=>page.fakeDb().then(s=>s.tables.docs.filter(d=>d.coll==='prevq'));
  await expect.poll(async()=>(await q()).length).toBe(1);
  expect((await q())[0].data).toMatchObject({numero:'1',oggetto:'Impianto di rete ufficio',stato:'bozza',cliente:{nome:'Cliente Prova Srl'},righe:[{titolo:'Switch 8 porte',prezzo:'50'}]});

  // Nuovo preventivo: numero successivo e campi vuoti
  await page.locator('#bNew').click();
  await page.locator('#nvLav').click();
  await expect(page.locator('#q_numero')).toHaveValue('2');
  await expect(page.locator('#c_nome')).toHaveValue('');

  // Apri PDF: il preventivo torna com'era
  await page.locator('#filePdf').setInputFiles(pdfPath);
  await expect(page.locator('#c_nome')).toHaveValue('Cliente Prova Srl');
  await expect(page.locator('#q_numero')).toHaveValue('1');
  expect(page.errors).toEqual([]);
});

test('unione delle modifiche di due admin sul listino',async({page})=>{
  await page.goto('/preventivi/');
  await expect(page.locator('#syncSt')).toContainText('Salvato');
  const r=await page.evaluate(()=>{
    const m=window.PREV_MERGE3,base=[{id:1,nome:'A',p:1},{id:2,nome:'B',p:2}];
    const out={};let c=[];
    // io cambio A, l'altro admin cambia B: si tengono entrambe
    out.both=m(base,[{id:1,nome:'A',p:10},{id:2,nome:'B',p:2}],[{id:1,nome:'A',p:1},{id:2,nome:'B',p:20}],c);out.bothConf=c;c=[];
    // io aggiungo C, l'altro toglie B
    out.addDel=m(base,[...base,{id:3,nome:'C',p:3}],[base[0]],c);out.addDelConf=c;c=[];
    // stessa voce cambiata da tutti e due: vince la mia, segnalata come conflitto
    out.conf=m(base,[{id:1,nome:'A',p:5},base[1]],[{id:1,nome:'A',p:7},base[1]],c);out.confConf=c;c=[];
    // azienda: campo per campo, la numerazione prende il numero più alto
    out.az=m({nome:'X',next:5,tel:'1'},{nome:'Y',next:6,tel:'1'},{nome:'X',next:9,tel:'2'},c);out.azConf=c;
    return out});
  expect(r.both).toEqual([{id:1,nome:'A',p:10},{id:2,nome:'B',p:20}]);expect(r.bothConf).toEqual([]);
  expect(r.addDel).toEqual([{id:1,nome:'A',p:1},{id:3,nome:'C',p:3}]);expect(r.addDelConf).toEqual([]);
  expect(r.conf).toEqual([{id:1,nome:'A',p:5},{id:2,nome:'B',p:2}]);expect(r.confConf).toEqual(['1']);
  expect(r.az).toEqual({nome:'Y',next:9,tel:'2'});expect(r.azConf).toEqual([]);
});

test('tutte le schede dei preventivi si aprono; listino, archivio e stato funzionano',async({page})=>{
  await page.goto('/preventivi/');
  await expect(page.locator('#syncSt')).toContainText('Salvato');
  // listino: c'è il listino fornitori e si cerca
  await page.locator('#tabs button[data-v=catalog]').click();
  await expect(page.locator('#v-catalog')).toBeVisible();
  // voce dal listino nel preventivo
  await page.locator('#tabs button[data-v=quote]').click();
  await page.locator('#c_nome').fill('Cliente Listino');
  await page.locator('#bFromCat').click();
  await expect(page.getByText('Aggiungi dal listino')).toBeVisible();
  await page.getByText('Manodopera',{exact:true}).last().click();
  await page.getByRole('button',{name:'Chiudi'}).click();
  await expect(page.locator('[data-k=titolo]')).toHaveCount(1);
  // salva e trova nell'archivio
  await page.locator('#q_oggetto').fill('Prova listino');
  await page.locator('#q_stato').selectOption('inviato');
  await page.evaluate(()=>document.querySelector('#bSave').click());
  await page.locator('#tabs button[data-v=archive]').click();
  await expect(page.locator('#v-archive')).toContainText('Cliente Listino');
  await expect.poll(async()=>(await page.fakeDb()).tables.docs.filter(d=>d.coll==='prevq').map(d=>d.data.stato)).toEqual(['inviato']);
  // azienda e storico
  await page.locator('#tabs button[data-v=company]').click();
  await expect(page.locator('#v-company')).toBeVisible();
  await page.locator('#tabs button[data-v=log]').click();
  await expect(page.locator('#v-log')).toBeVisible();
  expect(page.errors).toEqual([]);
});
