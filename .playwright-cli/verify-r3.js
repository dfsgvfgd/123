async (page) => {
  const results = {};

  // 1. Expanded Enchant Room + Left-facing 3/4-profile Pedagang + Workstations + Full ceiling pier
  await page.goto('http://localhost:3000/?autostart=enchant', { waitUntil: 'load' });
  await page.waitForTimeout(500);
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(2000);
  await page.keyboard.up('ArrowRight');
  await page.waitForTimeout(250);
  await page.screenshot({ path: '.playwright-cli/r3-enchant.png', scale: 'css', type: 'png', timeout: 30000 });

  await page.keyboard.press('KeyF');
  await page.waitForTimeout(350);
  results.enchantPedagangShopOpened = await page.evaluate(() => {
    const txt = document.body.innerText.toUpperCase();
    return txt.includes('PEDAGANG') || txt.includes('SENJATA') || txt.includes('MERCHANT');
  });

  // 2. Dungeon Combat: Combo Counter + Depleting Timer Bar
  await page.goto('http://localhost:3000/?autostart=dungeon', { waitUntil: 'load' });
  await page.waitForTimeout(600);
  let comboFound = false;
  let val1 = 0;
  let val2 = 0;
  for (let step = 0; step < 18; step++) {
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(220);
    await page.keyboard.up('ArrowRight');
    if (step === 2) await page.keyboard.press('Digit3');
    if (step === 5) await page.keyboard.press('Digit2');
    await page.waitForTimeout(140);
    const bar = page.locator('[data-testid="hud-combo-timer-bar"]');
    if (await bar.count()) {
      const counterVisible = await page.getByTestId('hud-combo-counter').isVisible().catch(() => false);
      if (counterVisible) {
        comboFound = true;
        val1 = Number(await bar.getAttribute('aria-valuenow')) || 0;
        await page.keyboard.press('KeyJ');
        await page.waitForTimeout(80);
        await page.screenshot({ path: '.playwright-cli/r3-combat-combo.png', scale: 'css', type: 'png', timeout: 30000 });
        await page.waitForTimeout(650);
        val2 = Number(await bar.getAttribute('aria-valuenow').catch(() => '0')) || 0;
        break;
      }
    }
  }
  results.comboFound = comboFound;
  results.comboTimerPctBefore = val1;
  results.comboTimerPctAfter650ms = val2;
  results.comboTimerDepleted = comboFound && val1 > val2;

  // 3. Verify Stage 1-2 distinct layout & minimap
  await page.goto('http://localhost:3000/?autostart=dungeon&stage=1&substage=2', { waitUntil: 'load' });
  await page.waitForTimeout(550);
  await page.screenshot({ path: '.playwright-cli/r3-stage2.png', scale: 'css', type: 'png', timeout: 30000 });
  results.stage2Header = await page.evaluate(() => document.body.innerText.includes('1-2'));

  return JSON.stringify(results, null, 2);
}
