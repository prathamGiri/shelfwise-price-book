// Drives the main flows from IDEA.json test_scenarios.
module.exports = async (page, rawShot) => {
  const shot = async (n) => { await page.evaluate(() => document.getElementById('toast').classList.remove('show')); await page.waitForTimeout(250); await rawShot(n); };
  const W = (ms = 350) => page.waitForTimeout(ms);
  const assert = (c, m) => { if (!c) throw new Error('ASSERT: ' + m); };
  const text = async (sel) => (await page.locator(sel).first().innerText());
  const tab = async (t) => { await page.click(`.tab[data-tab=${t}]`); await W(); };
  const sheetOk = async (a = 'ok') => { await page.locator(`.sheet-wrap.open [data-act=sh][data-a=${a}]`).last().click(); await W(400); };

  async function log(name, price, size, unit, storeIdx, isNew) {
    await page.fill('#chkName', name); await W(150);
    if (isNew) await page.click('[data-act=ac-new]');
    else await page.mouse.click(200, 20);
    await page.fill('#chkPrice', String(price));
    await page.fill('#chkSize', String(size));
    await page.click(`[data-act=chk-unit][data-u=${unit}]`);
    await page.locator('#storeChips [data-act=chk-store]').nth(storeIdx).click();
    await page.click('[data-act=chk-log]'); await W(300);
  }

  // 1. empty state + sample data
  assert((await text('#view-check')).includes('Load sample data'), 'welcome shows sample button');
  await page.click('#view-check [data-act=load-sample]'); await W(500);
  await shot('check-with-sample');
  await tab('book');
  assert(await page.locator('.prow').count() >= 8, 'book lists >= 8 products');
  await shot('price-book');
  await page.locator('.prow', { hasText: 'Peanut Butter' }).click(); await W(500);
  await shot('product-detail');
  await page.click('.panel.open [data-act=back]'); await W(400);
  await tab('list');
  await page.locator('.litem [data-act=list-check]').first().click(); await W();
  assert(await page.locator('.litem.done').count() === 1, 'checked item struck');
  await shot('shopping-list');
  await page.locator('[data-act=list-share]').first().click(); await W(300);
  await tab('more');
  await page.click('[data-act=open-shrink]'); await W(500);
  await shot('shrink-watch');
  await page.click('.panel.open [data-act=back]'); await W(400);

  // reset
  await page.click('[data-act=reset]'); await W(); await sheetOk(); await W();
  assert((await page.evaluate(() => window.__shelfwise.state.products.length)) === 0, 'reset clears');

  // 2. Deal check verdict
  await log('Peanut Butter', 3.99, 16, 'oz', 0, true);
  await log('Peanut Butter', 4.49, 16, 'oz', 1, false);
  await page.fill('#chkName', 'Peanut Butter'); await page.mouse.click(200, 20);
  await page.fill('#chkPrice', '3.49'); await page.fill('#chkSize', '16');
  await page.locator('#storeChips [data-act=chk-store]').nth(1).click(); await W(400);
  let v = await text('#verdict');
  assert(v.includes('STOCK UP') && v.includes('12.5%') && v.includes('$3.99'), 'stock up verdict: ' + v);
  await shot('verdict-stock-up');
  await page.fill('#chkPrice', '4.79'); await W(400);
  v = await text('#verdict'); assert(v.includes('SKIP'), 'skip verdict: ' + v);
  await shot('verdict-skip');
  // family mismatch
  await page.click('[data-act=chk-unit][data-u=ml]'); await W(200);
  assert((await text('#unitErr')).includes('tracked by weight'), 'family mismatch blocked');
  // validation
  await page.fill('#chkPrice', '-2'); await page.fill('#chkSize', '0');
  await page.click('[data-act=chk-log]'); await W(300);
  assert((await text('#f-price .ferr')).length > 0 && (await text('#f-size .ferr')).length > 0, 'inline errors');
  await shot('validation');
  await page.click('[data-act=chk-reset]'); await W(200);

  // 3. Unit conversion
  await log('Rice', 2.00, 1, 'lb', 0, true);
  await page.fill('#chkName', 'Rice'); await page.mouse.click(200, 20);
  await page.fill('#chkPrice', '2.10'); await page.fill('#chkSize', '500');
  await page.click('[data-act=chk-unit][data-u=g]'); await W(400);
  v = await text('#verdict');
  assert(v.includes('0.420') && v.includes('0.441') && v.includes('STOCK UP'), 'unit conversion: ' + v);
  await page.click('[data-act=chk-reset]');

  // 4. Shrinkflation
  await log('Cereal', 4.29, 18, 'oz', 0, true);
  await log('Cereal', 4.29, 15.5, 'oz', 0, false);
  await tab('more');
  await page.click('[data-act=open-shrink]'); await W(500);
  const sw = await text('.panel.open .pbody');
  assert(sw.includes('Cereal') && sw.includes('16.1%'), 'shrink watch: ' + sw);
  await page.click('.panel.open [data-act=back]'); await W(400);

  // 5. Quick compare
  const before = await page.evaluate(() => window.__shelfwise.state.entries.length);
  await page.click('#view-more [data-act=open-compare]'); await W(500);
  await page.click('[data-act=cmp-add]'); await W(200);
  const vals = [['5.99', '24'], ['8.49', '36'], ['1.29', '4']];
  for (let i = 0; i < 3; i++) {
    await page.selectOption(`select[data-i="${i}"]`, 'ct');
    await page.fill(`input[data-i="${i}"][data-k=price]`, vals[i][0]);
    await page.fill(`input[data-i="${i}"][data-k=size]`, vals[i][1]);
  }
  await W(300);
  assert(await page.locator('#cmp-1.win').count() === 1, '36ct wins');
  assert((await text('#cmpSummary')).includes('Option B wins'), 'summary');
  await shot('quick-compare');
  assert((await page.evaluate(() => window.__shelfwise.state.entries.length)) === before, 'compare saves nothing');
  await page.click('.panel.open [data-act=back]'); await W(400);

  // 7. Persistence + export/import
  await page.reload(); await W(800);
  const n = await page.evaluate(() => window.__shelfwise.state.entries.length);
  assert(n === before, 'persisted after reload');
  await tab('more');
  await page.click('[data-act=open-backup]'); await W(500);
  const json = await page.inputValue('#exportText');
  await page.click('.panel.open [data-act=back]'); await W(400);
  await page.click('[data-act=reset]'); await W(); await sheetOk();
  await tab('more');
  await page.click('[data-act=open-backup]'); await W(500);
  await page.fill('#importText', json);
  await page.click('[data-act=imp-go]'); await W(); await sheetOk(); await W(500);
  const after = await page.evaluate(() => JSON.stringify(window.__shelfwise.state));
  assert(after === json, 'import restores exactly');

  // dark mode look
  await tab('more');
  await page.click('[data-act=set-theme][data-t=dark]'); await W(300);
  await tab('book'); await shot('book-dark');
  await tab('more'); await page.click('[data-act=set-theme][data-t=light]'); await W(200);
  await shot('more-settings');

  // ===== Extended QA =====
  const st = () => page.evaluate(() => JSON.parse(JSON.stringify(window.__shelfwise.state)));
  const noOverflow = async (label) => {
    const o = await page.evaluate(() => {
      const bad = [];
      document.querySelectorAll('.view:not([hidden]) *, .panel.open *, .sheet-wrap.open *').forEach(el => {
        const r = el.getBoundingClientRect();
        let p = el.parentElement, inScroll = false;
        while (p) { if (p.classList && (p.classList.contains('scroll') || p.classList.contains('recent'))) { inScroll = true; break; } p = p.parentElement; }
        if (inScroll ? r.width > window.innerWidth - 20 : (r.width && r.right > window.innerWidth + 1)) bad.push((el.className || el.tagName) + ':' + Math.round(r.right));
      });
      return { sw: document.documentElement.scrollWidth, bad: bad.slice(0, 5) };
    });
    assert(o.sw <= 391 && !o.bad.length, label + ' horizontal overflow ' + JSON.stringify(o));
  };

  // 6. Shopping list: three products whose cheapest stores differ
  await page.click('[data-act=reset]'); await W(); await sheetOk(); await W();
  await tab('check');
  await log('Milk', 3.00, 1, 'l', 0, true);
  await log('Milk', 2.50, 1, 'l', 1, false);
  await log('Eggs', 3.00, 12, 'ct', 0, true);
  await log('Eggs', 1.50, 12, 'ct', 2, false);
  await log('Peanut Butter', 3.99, 16, 'oz', 0, true);
  await log('Peanut Butter', 4.49, 16, 'oz', 1, false);
  await tab('list');
  await page.locator('#view-list [data-act=list-add]').first().click(); await W(400);
  for (const nm of ['Milk', 'Eggs', 'Peanut Butter']) { await page.locator('.sheet-wrap.open .pick', { hasText: nm }).click(); await W(150); }
  await shot('pick-sheet');
  await page.locator('.sheet-wrap.open [data-act=sheet-close]').last().click(); await W(400);
  assert(await page.locator('.group').count() === 3, 'list has 3 store groups');
  const groupTxt = await page.locator('.group').allInnerTexts();
  const gfind = (s) => groupTxt.find(g => g.trim().startsWith(s)) || '';
  assert(gfind('Discount Grocer').includes('Milk'), 'milk under Discount Grocer: ' + groupTxt);
  assert(gfind('Warehouse Club').includes('Eggs'), 'eggs under Warehouse Club');
  assert(gfind('Supermarket').includes('Peanut Butter'), 'PB under Supermarket');
  assert(await page.locator('.save-banner .big').count() === 1, 'savings banner shown');
  await page.locator('.litem', { hasText: 'Milk' }).locator('[data-act=list-check]').click(); await W();
  const deco = await page.locator('.litem.done b').first().evaluate(el => getComputedStyle(el).textDecorationLine);
  assert(deco.includes('line-through'), 'checked item struck through: ' + deco);
  await shot('list-grouped');
  await page.locator('[data-act=list-share]').last().click(); await W(300);
  assert((await page.locator('#toast').innerText()).length > 0, 'share fallback toast');

  // settings + list persist across reload
  await tab('more'); await page.click('[data-act=set-cur][data-c="€"]'); await W();
  await page.reload(); await W(800);
  let s1 = await st();
  assert(s1.settings.currency === '€' && s1.list.length === 3 && s1.list.some(i => i.checked), 'list/settings persisted');
  await tab('more'); await page.click('[data-act=set-cur][data-c="$"]'); await W();

  // 8. Editing: edit an entry price, verify stats; delete entry
  await tab('book');
  await page.locator('.prow', { hasText: 'Peanut Butter' }).click(); await W(500);
  let best = await text('.panel.open .stat.best');
  assert(best.includes('Supermarket'), 'best initially Supermarket: ' + best);
  await page.locator('.panel.open .hrow', { hasText: 'Supermarket' }).click(); await W(400);
  await page.fill('#es-price', '5.00');
  await sheetOk('save'); await W(400);
  best = await text('.panel.open .stat.best');
  assert(best.includes('Discount Grocer'), 'best updated after edit: ' + best);
  const sparkDots = await page.locator('.panel.open .spark circle').count();
  assert(sparkDots === 2, 'sparkline dots ' + sparkDots);
  await shot('detail-after-edit');
  // Deal Check verdict reflects edit: $4.49 now equals best => STOCK UP
  await page.click('.panel.open [data-act=check-product]'); await W(400);
  await page.fill('#chkPrice', '4.49'); await W(300);
  v = await text('#verdict'); assert(v.includes('STOCK UP') && v.includes('Matches'), 'verdict after edit: ' + v);
  await page.click('[data-act=chk-reset]'); await W(200);
  await tab('book');
  await page.locator('.prow', { hasText: 'Peanut Butter' }).click(); await W(500);
  await page.locator('.panel.open .hrow', { hasText: 'Discount Grocer' }).click(); await W(400);
  await sheetOk('del'); await sheetOk('ok'); await W(400);
  assert(await page.locator('.panel.open .hrow').count() === 1, 'entry deleted');
  best = await text('.panel.open .stat.best');
  assert(best.includes('Supermarket') && best.includes('1.10'), 'stats recalculated: ' + best);
  await page.click('.panel.open [data-act=back]'); await W(400);

  // delete store -> entries reassigned to Unknown store
  await tab('more'); await page.click('[data-act=open-stores]'); await W(500);
  await page.locator('.panel.open .srow', { hasText: 'Warehouse Club' }).click(); await W(400);
  await sheetOk('del'); await W(300);
  await shot('delete-store-sheet');
  await sheetOk('move'); await W(400);
  s1 = await st();
  const unk = s1.stores.find(x => x.name === 'Unknown store');
  assert(unk && !s1.stores.some(x => x.name === 'Warehouse Club'), 'store removed, unknown created');
  assert(s1.entries.filter(e => e.storeId === unk.id).length === 1, 'eggs entry reassigned');
  await page.click('.panel.open [data-act=back]'); await W(400);

  // Validation: empty size, empty price
  await tab('check');
  await page.fill('#chkName', 'Eggs'); await page.mouse.click(200, 20);
  await page.fill('#chkPrice', ''); await page.fill('#chkSize', '');
  await page.click('[data-act=chk-log]'); await W(300);
  assert((await text('#f-price .ferr')).includes('Enter') && (await text('#f-size .ferr')).includes('Enter'), 'empty errors');
  await page.click('[data-act=chk-reset]'); await W(200);

  // Rapid taps on Log: only one entry
  const cnt0 = (await st()).entries.length;
  await page.fill('#chkName', 'Eggs'); await page.mouse.click(200, 20);
  await page.fill('#chkPrice', '2.99'); await page.fill('#chkSize', '12');
  for (let i = 0; i < 5; i++) await page.click('[data-act=chk-log]', { delay: 0 });
  await W(300);
  assert((await st()).entries.length === cnt0 + 1, 'rapid taps logged once');

  // Very long product name
  const long = 'Extra Crunchy Organic Super Premium Artisan Peanut Butter With Sea Salt And Honey Family Size Value Pack ' + 'X'.repeat(60);
  await page.click('[data-act=chk-reset]');
  await page.fill('#chkName', long); await W(150);
  await page.click('[data-act=ac-new]');
  await page.fill('#chkPrice', '6.49'); await page.fill('#chkSize', '40');
  await page.click('[data-act=chk-unit][data-u=oz]');
  await page.click('[data-act=chk-log]'); await W(400);
  await noOverflow('check');
  await shot('check-long-name');
  await tab('book'); await noOverflow('book'); await shot('book-long-name');
  await page.locator('.prow', { hasText: 'Extra Crunchy' }).click(); await W(500);
  await noOverflow('detail'); await shot('detail-long-name');
  await page.click('.panel.open [data-act=back]'); await W(400);
  await tab('list'); await page.locator('#view-list [data-act=list-add]').first().click(); await W(400);
  await page.locator('.sheet-wrap.open .pick', { hasText: 'Extra Crunchy' }).click(); await W(150);
  await page.locator('.sheet-wrap.open [data-act=sheet-close]').last().click(); await W(400);
  await noOverflow('list'); await shot('list-long-name');

  // Back handler
  await tab('book');
  await page.locator('.prow', { hasText: 'Eggs' }).click(); await W(400);
  await page.click('.panel.open [data-act=product-edit]'); await W(400);
  let r = await page.evaluate(() => window.onAndroidBack());
  await W(400);
  assert(r === true && await page.locator('.sheet-wrap').count() === 0, 'back closes sheet');
  r = await page.evaluate(() => window.onAndroidBack()); await W(400);
  assert(r === true && await page.locator('.panel').count() === 0, 'back closes panel');
  r = await page.evaluate(() => window.onAndroidBack()); await W(300);
  assert(r === true && await page.locator('#view-check:not([hidden])').count() === 1, 'back returns to check tab');
  r = await page.evaluate(() => window.onAndroidBack());
  assert(r === false, 'back at root exits');

  // Import invalid JSON shows error, no crash
  await tab('more'); await page.click('[data-act=open-backup]'); await W(500);
  await page.fill('#importText', '{not json'); await page.click('[data-act=imp-go]'); await W(200);
  assert((await text('#imp-f .ferr')).length > 0, 'invalid import error');
  await page.click('.panel.open [data-act=back]'); await W(400);
};
