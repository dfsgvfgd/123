async (page) => {
  const results = {};

  // 1. Walk east in already-open Main Lobby to verify expanded wing & no Pedagang
  await page.waitForLoadState('load');
  await page.waitForTimeout(400);
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(2600);
  await page.keyboard.up('ArrowRight');
  await page.waitForTimeout(200);
  const lobbyEastText = await page.evaluate(() => document.body.innerText);
  results.lobbyEastHasNoPedagangLabel = !lobbyEastText.includes('Toko Senjata');

  // 2. Expanded Enchant Room + Left-facing Pedagang + Workstations
  await page.goto('http://localhost:3000/?autostart=enchant', { waitUntil: 'load' });
  await page.waitForTimeout(600);
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(2150);
  await page.keyboard.up('ArrowRight');
  await page.waitForTimeout(300);
  await page.screenshot({ path: '.playwright-cli/r2-enchant.png', scale: 'css', type: 'png', timeout: 30000 });

  await page.keyboard.press('KeyF');
  await page.waitForTimeout(400);
  results.enchantPedagangShopOpened = await page.evaluate(() => {
    const txt = document.body.innerText.toUpperCase();
    return txt.includes('PEDAGANG') || txt.includes('SENJATA') || txt.includes('MERCHANT');
  });

  // 3. Dungeon Combat: Combo Counter + Depleting Timer Bar + Luna 10-frame swing
  await page.goto('http://localhost:3000/?autostart=dungeon', { waitUntil: 'load' });
  await page.waitForTimeout(700);
  let comboFound = false;
  let val1 = 0;
  let val2 = 0;
  for (let step = 0; step < 18; step++) {
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(240);
    await page.keyboard.up('ArrowRight');
    if (step === 2) await page.keyboard.press('Digit3');
    if (step === 5) await page.keyboard.press('Digit2');
    await page.waitForTimeout(150);
    const bar = page.locator('[data-testid="hud-combo-timer-bar"]');
    if (await bar.count()) {
      const counterVisible = await page.getByTestId('hud-combo-counter').isVisible().catch(() => false);
      if (counterVisible) {
        comboFound = true;
        val1 = Number(await bar.getAttribute('aria-valuenow')) || 0;
        await page.keyboard.press('KeyJ');
        await page.waitForTimeout(90);
        await page.screenshot({ path: '.playwright-cli/r2-combat-combo.png', scale: 'css', type: 'png', timeout: 30000 });
        await page.waitForTimeout(650);
        val2 = Number(await bar.getAttribute('aria-valuenow').catch(() => '0')) || 0;
        break;
      }
    }
  }
  if (!comboFound) {
    await page.keyboard.press('KeyJ');
    await page.waitForTimeout(80);
    await page.screenshot({ path: '.playwright-cli/r2-combat-combo.png', scale: 'css', type: 'png', timeout: 30000 });
  }
  results.comboFound = comboFound;
  results.comboTimerPctBefore = val1;
  results.comboTimerPctAfter650ms = val2;
  results.comboTimerDepleted = comboFound && val1 > val2;

  // 4. Stage 1-2 distinct layout & minimap
  await page.goto('http://localhost:3000/?autostart=dungeon&stage=1&substage=2', { waitUntil: 'load' });
  await page.waitForTimeout(600);
  await page.screenshot({ path: '.playwright-cli/r2-stage2.png', scale: 'css', type: 'png', timeout: 30000 });
  results.stage2Header = await page.evaluate(() => document.body.innerText.includes('1-2'));

  return JSON.stringify(results, null, 2);
}
