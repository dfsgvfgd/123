async (page) => {
  const results = {};

  // 1. Main Lobby east wing check
  await page.waitForLoadState('load');
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(2400);
  await page.keyboard.up('ArrowRight');
  results.lobbyNoPedagang = !(await page.evaluate(() => document.body.innerText.includes('Toko Senjata')));

  // 2. Enchant Room KeyF opens Pedagang shop
  await page.goto('http://localhost:3000/?autostart=enchant', { waitUntil: 'load' });
  await page.waitForTimeout(300);
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(1950);
  await page.keyboard.up('ArrowRight');
  await page.waitForTimeout(150);
  await page.keyboard.press('KeyF');
  await page.waitForTimeout(250);
  results.enchantPedagangShopOpened = await page.evaluate(() => {
    const t = document.body.innerText.toUpperCase();
    return t.includes('PEDAGANG') && (t.includes('SENJATA') || t.includes('SCYTHE') || t.includes('BLADE'));
  });

  // 3. Dungeon Combat Combo Bar Depletion
  await page.goto('http://localhost:3000/?autostart=dungeon', { waitUntil: 'load' });
  await page.waitForTimeout(400);
  let val1 = 0;
  let val2 = 0;
  let found = false;
  for (let i = 0; i < 16; i++) {
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(200);
    await page.keyboard.up('ArrowRight');
    if (i === 1) await page.keyboard.press('Digit3');
    if (i === 4) await page.keyboard.press('Digit2');
    await page.waitForTimeout(120);
    const bar = page.locator('[data-testid="hud-combo-counter"] [role="progressbar"]');
    if (await bar.count()) {
      found = true;
      val1 = Number(await bar.getAttribute('aria-valuenow')) || 0;
      await page.waitForTimeout(700);
      val2 = Number(await bar.getAttribute('aria-valuenow').catch(() => '0')) || 0;
      break;
    }
  }
  results.comboFound = found;
  results.val1 = val1;
  results.val2 = val2;
  results.comboDepleted = found && val1 > val2;

  return JSON.stringify(results, null, 2);
}
