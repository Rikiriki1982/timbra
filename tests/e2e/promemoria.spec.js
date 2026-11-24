// Promemoria di timbratura nell'app: entrata 5 minuti prima dell'orario, uscita 5 minuti dopo
const {test,expect,seed,EMP}=require('./fixture');
const doc=(coll,id,data)=>({coll,id,data});

test.describe('entrata',()=>{
  test.use({db:seed({as:EMP})});
  test('il promemoria di entrata arriva 5 minuti prima (8:55 per le 9:00)',async({page})=>{
    await page.clock.install({time:new Date('2026-11-02T08:53:00+01:00')});
    await page.goto('/');
    await expect(page.locator('main')).toBeVisible();
    await page.clock.fastForward(60000);                                  // 8:54: ancora niente
    await expect(page.locator('.md')).toHaveCount(0);
    await page.clock.fastForward(60000);                                  // 8:55
    const md=page.locator('.md');
    await expect(md).toContainText('Alle 09:00 inizia il tuo orario: ricordati di timbrare l\'entrata.');
    await md.getByRole('button',{name:'Timbra entrata'}).click();
    await expect.poll(async()=>(await page.fakeDb()).tables.docs.find(d=>d.coll==='days')?.data).toMatchObject({in:'08:55'});
    expect(page.errors).toEqual([]);
  });
});

test.describe('uscita',()=>{
  test.use({db:seed({as:EMP,docs:[doc('days',EMP.id+'_2026-11-02',{uid:EMP.id,date:'2026-11-02',in:'09:00',out:'',pause:0,in_src:'server'})]})});
  test('il promemoria di uscita arriva 5 minuti dopo (18:05 per le 18:00)',async({page})=>{
    await page.clock.install({time:new Date('2026-11-02T18:03:00+01:00')});
    await page.goto('/');
    await expect(page.locator('main')).toBeVisible();
    await page.clock.fastForward(60000);                                  // 18:04: ancora niente
    await expect(page.locator('.md')).toHaveCount(0);
    await page.clock.fastForward(60000);                                  // 18:05
    await expect(page.locator('.md')).toContainText('Timbra uscita');
    expect(page.errors).toEqual([]);
  });
});
