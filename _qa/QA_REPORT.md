# Shelfwise — QA Report

**Status: PASS.** `_qa/test/report.json` shows `"ok": true` with 0 JS or console errors. `./gradlew.bat assembleRelease` succeeded and produced `app/build/outputs/apk/release/app-release.apk`.

## What was tested (`_qa/scenario.js`, Playwright, 390×844 phone viewport)
All 9 `test_scenarios` from IDEA.json, plus edge cases:

1. **First launch / sample data**: the empty state shows "Load sample data". Loading it puts 9 products in the Price Book (at least 8 required), and the product detail, shopping list, share and Shrink Watch all render.
2. **Deal Check verdict**: Peanut Butter at $3.99 (Store A) and $4.49 (Store B). Entering $3.49 gives **STOCK UP**, "Beats your best ($3.99 at Supermarket) by 12.5%". Entering $4.79 gives **SKIP**.
3. **Unit conversion**: Rice at $2.00/1 lb compared with $2.10/500 g shows $0.441/100g vs $0.420/100g, and the verdict is STOCK UP.
4. **Shrinkflation**: Cereal going from $4.29/18 oz to $4.29/15.5 oz at the same store gets flagged with +16.1% and appears in Shrink Watch.
5. **Quick Compare**: $5.99/24ct, $8.49/36ct and $1.29/4ct. Option B (36ct) wins and the summary is correct. The test confirms no entries were saved.
6. **Shopping list**: Milk, Eggs and Peanut Butter are each cheapest at a different store. They group correctly under Discount Grocer, Warehouse Club and Supermarket, with subtotals and a $2.00 savings banner. A checked item gets a line-through. Share falls back to a toast in the browser.
7. **Persistence**: data, list items (including checked state) and the currency setting all survive `page.reload()`. Export → reset → import restores the state byte-for-byte (`JSON.stringify` compared). Invalid import JSON shows an inline error.
8. **Editing**: editing an entry price moves the Best stat to the other store, the sparkline updates, and the Deal Check verdict reflects the new best price. Deleting an entry recalculates the stats. Deleting a store and choosing "keep prices" reassigns its entries to an auto-created "Unknown store".
9. **Validation**: empty, zero and negative price or size each show inline errors. Choosing a volume unit for a weight product is blocked with "…tracked by weight — use g, kg, oz, lb".

**Edge cases**
- Five rapid taps on "Log price" create exactly one entry.
- A very long product name (about 165 characters with an unbroken word) causes no horizontal overflow on the Check, Book, Product Detail or List screens. This is checked automatically.
- The Android back handler closes the sheet, then the panel, then returns to the Check tab, and finally returns `false` at the root.
- Dark mode was checked visually.

## Bugs found and fixed
1. **Layout overflow with long names (real bug).** Quick-pick staple chips and store chips used `white-space: nowrap` with no width limit. A long product or store name produced a chip wider than the screen (about 1,277 px). Fix: names are wrapped in `<span class="cn">`, chips are capped at `min(260px, 100vw-48px)` with an ellipsis, and `overflow-wrap: anywhere` / `min-width: 0` were added where long unbroken words could push content off screen (autocomplete, pick list, Shrink Watch, store bars, list group headers, banners).
2. **Pluralization.** The Product Detail "Average" stat showed "1 prices". It now reads "1 price".
3. **Housekeeping.** A stray `_qa/` test folder created inside `www/` during a mis-pathed test run was removed so it doesn't get bundled into the APK.

No JS errors and no data-loss bugs turned up. The core verdict, conversion, shrink, compare, list and backup logic were all correct.

## Known limitations
- Share and clipboard paths were checked only through the browser fallback. The native `Android.share` bridge was not exercised in a headless browser.
- The "Unknown store" created when a store is deleted is a real store row that the user can rename or delete afterwards. This is by design.
- Shopping-list estimates use each store's average unit price × the latest package size. Items with no price history go into a "No price yet" group.
- The custom currency field saves on every keystroke but redraws the More screen only on change/blur. The effect is cosmetic.
