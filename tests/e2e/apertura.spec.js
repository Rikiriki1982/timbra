// Apertura dell'app, accesso e scelta della ditta
const {test,expect,seed,EMP}=require('./fixture');

test('il titolare vede tutte le sezioni, senza errori',async({page})=>{
  await page.goto('/');
  for(const s of['Oggi','Calendario','Richieste','Ticket','Report','Team'])await expect(page.locator('nav')).toContainText(s);
  await expect(page.locator('#who')).toContainText('Titolare Prova');
  for(const s of['Calendario','Report','Team','Oggi']){await page.locator('nav').getByRole('button',{name:s}).click();await expect(page.locator('main')).not.toContainText('Caricamento…')}
  expect(page.errors).toEqual([]);
});

test.describe('dipendente',()=>{
  test.use({db:seed({as:EMP})});
  test('il dipendente non vede la sezione Team',async({page})=>{
    await page.goto('/');
    await expect(page.locator('nav')).toContainText('Ticket');
    await expect(page.locator('nav')).not.toContainText('Team');
    expect(page.errors).toEqual([]);
  });
});

test.describe('senza accesso',()=>{
  test.use({db:seed({loggedIn:false})});
  test('chiede email e password, poi entra',async({page})=>{
    await page.goto('/');
    await expect(page.getByRole('heading',{name:/Accedi/})).toBeVisible();
    await page.locator('#le').fill('mario@prova.it');
    await page.locator('#lp').fill('sbagliata');
    await page.locator('#li').click();
    await expect(page.locator('#lm')).toContainText('Invalid');
    await page.locator('#lp').fill('prova123');
    await page.locator('#li').click();
    await expect(page.locator('#who')).toContainText('Mario Dipendente');
  });
});

test('link con ditta sconosciuta: apre la ditta predefinita',async({page})=>{
  await page.goto('/?ditta=non-esiste');
  await expect(page.locator('nav')).toContainText('Oggi');
  expect(await page.evaluate(()=>window.PTP_DITTA)).toBe('lumia');
});

test('la pagina di installazione per nuove ditte si apre',async({page})=>{
  await page.goto('/installa/');
  await expect(page.locator('body')).not.toBeEmpty();
  expect(page.errors).toEqual([]);
});
