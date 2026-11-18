/* Shelfwise — pocket price book. Vanilla JS, offline, localStorage. */
(function () {
  'use strict';

  /* ================= Constants ================= */
  var KEY = 'shelfwise.v1';
  var UNITS = {
    g: { f: 'weight', b: 1, l: 'g' }, kg: { f: 'weight', b: 1000, l: 'kg' },
    oz: { f: 'weight', b: 28.349523125, l: 'oz' }, lb: { f: 'weight', b: 453.59237, l: 'lb' },
    ml: { f: 'volume', b: 1, l: 'ml' }, l: { f: 'volume', b: 1000, l: 'L' },
    floz: { f: 'volume', b: 29.5735295625, l: 'fl oz' }, ct: { f: 'count', b: 1, l: 'ct' }
  };
  var UNIT_ORDER = ['g', 'kg', 'oz', 'lb', 'ml', 'l', 'floz', 'ct'];
  var FAM_UNITS = { weight: ['g', 'kg', 'oz', 'lb'], volume: ['ml', 'l', 'floz'], count: ['ct'] };
  var FAM_LABEL = { weight: 'Weight', volume: 'Volume', count: 'Count' };
  var PER = {
    '100g': { f: 'weight', m: 100, l: '/100g', n: '100 g' }, kg: { f: 'weight', m: 1000, l: '/kg', n: 'kg' },
    oz: { f: 'weight', m: 28.349523125, l: '/oz', n: 'oz' }, lb: { f: 'weight', m: 453.59237, l: '/lb', n: 'lb' },
    '100ml': { f: 'volume', m: 100, l: '/100ml', n: '100 ml' }, l: { f: 'volume', m: 1000, l: '/L', n: 'L' },
    floz: { f: 'volume', m: 29.5735295625, l: '/fl oz', n: 'fl oz' }, each: { f: 'count', m: 1, l: '/each', n: 'each' }
  };
  var PER_OPTS = { weight: ['100g', 'kg', 'oz', 'lb'], volume: ['100ml', 'l', 'floz'], count: ['each'] };
  var COLORS = ['#1F7A5A', '#24897F', '#2F6FB0', '#7A4FB5', '#C4483C', '#D9A23B', '#B5651D', '#5D6660'];
  var DEFAULT_CATS = ['Pantry', 'Dairy', 'Produce', 'Meat & Fish', 'Bakery', 'Breakfast', 'Frozen', 'Snacks', 'Drinks', 'Household', 'Personal care', 'Other'];
  var VMETA = {
    stock: { label: 'STOCK UP', c: 'var(--stock)', ic: 'cart' },
    good: { label: 'GOOD', c: 'var(--good)', ic: 'check' },
    fair: { label: 'FAIR', c: 'var(--fair)', ic: 'minus' },
    skip: { label: 'SKIP', c: 'var(--skip)', ic: 'x' },
    'new': { label: 'First price', c: 'var(--neutral)', ic: 'sparkle' },
    empty: { label: 'Is it a deal?', c: 'var(--neutral)', ic: 'tag' }
  };

  /* ================= Icons ================= */
  var P = {
    tag: '<path d="M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5v14z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/><path d="M9 8h7M9 12h5"/>',
    list: '<path d="M10 6h10M10 12h10M10 18h10"/><path d="M3.5 6l1.5 1.5L7.5 5M3.5 12l1.5 1.5 2.5-2.5M3.5 18l1.5 1.5 2.5-2.5"/>',
    more: '<rect x="3.5" y="3.5" width="7" height="7" rx="2"/><rect x="13.5" y="3.5" width="7" height="7" rx="2"/><rect x="3.5" y="13.5" width="7" height="7" rx="2"/><rect x="13.5" y="13.5" width="7" height="7" rx="2"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    back: '<path d="M15 18l-6-6 6-6"/>',
    chev: '<path d="M9 18l6-6-6-6"/>',
    x: '<path d="M18 6L6 18M6 6l12 12"/>',
    star: '<path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"/>',
    starFill: '<path fill="currentColor" d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"/>',
    share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v5M14 11v5"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    check: '<path d="M20 6L9 17l-5-5"/>',
    scale: '<path d="M12 3v18M7 21h10M5 7h14M5 7l-3 7a3 3 0 0 0 6 0zM19 7l-3 7a3 3 0 0 0 6 0z"/>',
    shrink: '<path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7"/>',
    store: '<path d="M4 4h16l1 5a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z"/><path d="M5 12v8h14v-8M10 20v-5h4v5"/>',
    folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    download: '<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>',
    sparkle: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 16l.7 1.8 1.8.7-1.8.7L19 21l-.7-1.8-1.8-.7 1.8-.7z"/>',
    reset: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
    arrowR: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    cart: '<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.7 12.4a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L21 7H6"/>',
    alert: '<path d="M12 3l10 18H2z"/><path d="M12 10v4M12 17.5v.5"/>',
    copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>',
    coin: '<circle cx="12" cy="12" r="9"/><path d="M15 9.5c-.5-1-1.6-1.5-3-1.5-1.7 0-3 .9-3 2s1.3 1.7 3 2 3 .9 3 2-1.3 2-3 2c-1.4 0-2.5-.5-3-1.5M12 6v2M12 16v2"/>',
    listAdd: '<path d="M4 6h12M4 12h9M4 18h7M18 14v6M15 17h6"/>'
  };
  function ic(n) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (P[n] || '') + '</svg>'; }

  /* ================= Utils ================= */
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function num(v) { if (v === '' || v == null) return NaN; return parseFloat(String(v).replace(',', '.').replace(/[^\d.\-]/g, '')); }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function isoDate(d) { return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
  function today() { return isoDate(new Date()); }
  function daysAgo(n) { var d = new Date(); d.setDate(d.getDate() - n); return isoDate(d); }
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function dParts(s) { var a = String(s).split('-'); return { m: MON[(+a[1] || 1) - 1], d: +a[2] || 1, y: +a[0] }; }
  function dShort(s) { var p = dParts(s); return p.m + ' ' + p.d; }
  function ago(ts) {
    var s = (Date.now() - ts) / 1000;
    if (s < 60) return 'just now'; if (s < 3600) return Math.floor(s / 60) + 'm ago';
    if (s < 86400) return Math.floor(s / 3600) + 'h ago'; return Math.floor(s / 86400) + 'd ago';
  }
  function trimNum(n) { return String(+(+n).toFixed(3)); }
  function cur() { return S.settings.currency || '$'; }
  function money(n) { return (n < 0 ? '−' : '') + cur() + Math.abs(n).toFixed(2); }
  function upNum(v) { return v < 1 ? v.toFixed(3) : v.toFixed(2); }
  function perKey(f) { return (S.settings.per && S.settings.per[f]) || PER_OPTS[f][0]; }
  function upVal(u, f) { return u * PER[perKey(f)].m; }
  function upHTML(u, f) { return cur() + upNum(upVal(u, f)) + '<small>' + PER[perKey(f)].l + '</small>'; }
  function upText(u, f) { return cur() + upNum(upVal(u, f)) + PER[perKey(f)].l; }
  function pct(n) { return Math.abs(n).toFixed(1) + '%'; }
  function sizeStr(size, unit) { return trimNum(size) + ' ' + UNITS[unit].l; }
  function baseSize(e) { return e.size * UNITS[e.unit].b; }
  function unitPrice(e) { return e.price / baseSize(e); }
  function byDate(a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : (a.ts || 0) - (b.ts || 0); }
  function toast(msg) {
    var t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toast._t); toast._t = setTimeout(function () { t.classList.remove('show'); }, 2600);
  }
  function buzz(ms) { try { window.Android && window.Android.vibrate && window.Android.vibrate(ms || 20); } catch (e) { } }

  /* ================= State ================= */
  function freshState() {
    return {
      settings: { currency: '$', defaultStoreId: null, verdictThresholds: { stockUpPct: 15, fairPct: 5 }, per: { weight: '100g', volume: '100ml', count: 'each' }, theme: 'light', shrinkSeen: 0 },
      stores: [
        { id: 's_' + uid(), name: 'Supermarket', color: COLORS[2] },
        { id: 's_' + uid(), name: 'Discount Grocer', color: COLORS[5] },
        { id: 's_' + uid(), name: 'Warehouse Club', color: COLORS[3] }
      ],
      categories: DEFAULT_CATS.slice(), products: [], entries: [], list: [], recentChecks: []
    };
  }
  function normalize(d) {
    var f = freshState();
    if (!d || typeof d !== 'object') return f;
    var s = Object.assign({}, f.settings, d.settings || {});
    s.verdictThresholds = Object.assign({}, f.settings.verdictThresholds, (d.settings || {}).verdictThresholds || {});
    s.per = Object.assign({}, f.settings.per, (d.settings || {}).per || {});
    return {
      settings: s,
      stores: Array.isArray(d.stores) ? d.stores : f.stores,
      categories: Array.isArray(d.categories) && d.categories.length ? d.categories : f.categories,
      products: Array.isArray(d.products) ? d.products : [],
      entries: Array.isArray(d.entries) ? d.entries.filter(function (e) { return e && UNITS[e.unit] && e.size > 0 && e.price >= 0; }) : [],
      list: Array.isArray(d.list) ? d.list : [],
      recentChecks: Array.isArray(d.recentChecks) ? d.recentChecks : []
    };
  }
  function load() { try { var raw = localStorage.getItem(KEY); if (raw) return normalize(JSON.parse(raw)); } catch (e) { } return freshState(); }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast('Could not save — storage unavailable'); } }
  var S = load();

  function prod(id) { return S.products.find(function (p) { return p.id === id; }); }
  function store(id) { return S.stores.find(function (s) { return s.id === id; }); }
  function storeName(id) { var s = store(id); return s ? s.name : 'Unknown store'; }
  function storeColor(id) { var s = store(id); return s ? s.color : '#8A8F89'; }
  function defStore() { var d = S.settings.defaultStoreId; if (d && store(d)) return d; return S.stores[0] ? S.stores[0].id : null; }
  function usualStore() {
    var d = S.settings.defaultStoreId; if (d && store(d)) return d;
    var c = {}; S.entries.forEach(function (e) { c[e.storeId] = (c[e.storeId] || 0) + 1; });
    var best = null; Object.keys(c).forEach(function (k) { if (store(k) && (!best || c[k] > c[best])) best = k; });
    return best || defStore();
  }

  /* ================= Analytics ================= */
  function entriesOf(pid) { return S.entries.filter(function (e) { return e.productId === pid; }).sort(byDate); }
  function stats(pid) {
    var es = entriesOf(pid); if (!es.length) return null;
    var ups = es.map(unitPrice), best = Infinity, bestE = null, sum = 0;
    es.forEach(function (e, i) { sum += ups[i]; if (ups[i] < best - 1e-12) { best = ups[i]; bestE = e; } });
    var latestE = es[es.length - 1], latest = ups[ups.length - 1], prev = ups.length > 1 ? ups[ups.length - 2] : null;
    var by = {};
    es.forEach(function (e, i) { var k = e.storeId; (by[k] = by[k] || { id: k, ups: [], last: null }); by[k].ups.push(ups[i]); by[k].last = e; });
    var stores = Object.keys(by).map(function (k) {
      var o = by[k]; o.best = Math.min.apply(null, o.ups); o.avg = o.ups.reduce(function (a, b) { return a + b; }, 0) / o.ups.length; o.count = o.ups.length; return o;
    }).sort(function (a, b) { return a.avg - b.avg; });
    var trend = prev == null ? 'flat' : latest > prev * 1.005 ? 'up' : latest < prev * 0.995 ? 'down' : 'flat';
    return { es: es, ups: ups, best: best, bestE: bestE, avg: sum / es.length, latest: latest, latestE: latestE, prev: prev, trend: trend, stores: stores };
  }
  function verdictFor(st, u) {
    if (!st) return { k: 'new' };
    var t = S.settings.verdictThresholds, k;
    if (u <= st.best * (1 + 1e-9) || u <= st.avg * (1 - t.stockUpPct / 100)) k = 'stock';
    else if (u < st.avg * (1 - t.fairPct / 100)) k = 'good';
    else if (u <= st.avg * (1 + t.fairPct / 100)) k = 'fair';
    else k = 'skip';
    return { k: k, vsBest: (u - st.best) / st.best * 100, vsAvg: (u - st.avg) / st.avg * 100 };
  }
  function recomputeShrink() {
    var g = {};
    S.entries.forEach(function (e) { var k = e.productId + '|' + e.storeId; (g[k] = g[k] || []).push(e); });
    Object.keys(g).forEach(function (k) {
      var arr = g[k].sort(byDate);
      arr.forEach(function (e, i) { var p = arr[i - 1]; e.shrinkFlag = !!(p && baseSize(e) < baseSize(p) * (1 - 1e-9) && e.price >= p.price - 1e-9); });
    });
  }
  function prevSameStore(e) {
    var arr = S.entries.filter(function (x) { return x.productId === e.productId && x.storeId === e.storeId; }).sort(byDate);
    var i = arr.indexOf(e); return i > 0 ? arr[i - 1] : null;
  }
  function shrinkInfo(e) { var p = prevSameStore(e); if (!p) return null; return { prev: p, pct: (unitPrice(e) / unitPrice(p) - 1) * 100 }; }
  function shrinkItems() {
    return S.entries.filter(function (e) { return e.shrinkFlag && prod(e.productId); }).map(function (e) { return { e: e, info: shrinkInfo(e) }; })
      .filter(function (x) { return x.info; }).sort(function (a, b) { return byDate(b.e, a.e); });
  }

  /* ================= Sample data ================= */
  function sampleState() {
    var st = freshState();
    var A = { id: 's_fresh', name: 'FreshMart', color: '#2F6FB0' }, B = { id: 's_valu', name: 'ValuSave', color: '#D9A23B' }, C = { id: 's_bulk', name: 'BulkBarn', color: '#7A4FB5' };
    st.stores = [A, B, C]; st.settings.defaultStoreId = A.id;
    var ts = Date.now() - 1e7, n = 0;
    function P_(id, name, cat, fam, fav) { st.products.push({ id: id, name: name, category: cat, unitFamily: fam, favorite: !!fav, createdAt: ts }); }
    function E(pid, s, price, size, unit, d, sale) { st.entries.push({ id: 'e_' + (++n) + uid(), productId: pid, storeId: s.id, price: price, size: size, unit: unit, onSale: !!sale, date: daysAgo(d), ts: ts + n, shrinkFlag: false }); }
    P_('p_pb', 'Peanut Butter', 'Pantry', 'weight', true);
    E('p_pb', A, 3.99, 16, 'oz', 84); E('p_pb', B, 3.49, 16, 'oz', 70); E('p_pb', A, 4.29, 16, 'oz', 45); E('p_pb', C, 9.98, 48, 'oz', 30); E('p_pb', B, 3.29, 16, 'oz', 12, true);
    P_('p_rice', 'Jasmine Rice', 'Pantry', 'weight');
    E('p_rice', A, 4.49, 2, 'lb', 80); E('p_rice', C, 17.99, 10, 'kg', 60); E('p_rice', B, 3.79, 2, 'lb', 40); E('p_rice', A, 4.79, 2, 'lb', 9);
    P_('p_milk', 'Whole Milk', 'Dairy', 'volume', true);
    E('p_milk', A, 3.89, 128, 'floz', 60); E('p_milk', B, 3.29, 128, 'floz', 46); E('p_milk', C, 5.99, 256, 'floz', 32); E('p_milk', A, 4.19, 128, 'floz', 15); E('p_milk', B, 3.49, 128, 'floz', 4);
    P_('p_eggs', 'Large Eggs', 'Dairy', 'count', true);
    E('p_eggs', A, 3.99, 12, 'ct', 70); E('p_eggs', B, 3.49, 12, 'ct', 52); E('p_eggs', C, 11.49, 60, 'ct', 35); E('p_eggs', A, 4.49, 12, 'ct', 14); E('p_eggs', B, 4.29, 18, 'ct', 3);
    P_('p_ban', 'Bananas', 'Produce', 'weight');
    E('p_ban', A, 0.69, 1, 'lb', 50); E('p_ban', B, 0.55, 1, 'lb', 30); E('p_ban', A, 0.65, 1, 'lb', 6);
    P_('p_cer', 'Honey Oat Cereal', 'Breakfast', 'weight');
    E('p_cer', A, 4.29, 18, 'oz', 75); E('p_cer', B, 3.99, 18, 'oz', 55); E('p_cer', A, 4.29, 15.5, 'oz', 10); E('p_cer', C, 8.99, 2, 'lb', 20);
    P_('p_coffee', 'Coffee Beans', 'Drinks', 'weight');
    E('p_coffee', A, 9.99, 12, 'oz', 66); E('p_coffee', C, 19.99, 2.5, 'lb', 41); E('p_coffee', A, 8.49, 12, 'oz', 18, true); E('p_coffee', B, 10.49, 12, 'oz', 7);
    P_('p_soap', 'Dish Soap', 'Household', 'volume');
    E('p_soap', B, 2.99, 24, 'floz', 64); E('p_soap', A, 3.49, 24, 'floz', 38); E('p_soap', B, 2.99, 21.6, 'floz', 8);
    P_('p_tow', 'Paper Towels', 'Household', 'count');
    E('p_tow', A, 12.99, 6, 'ct', 58); E('p_tow', C, 22.99, 12, 'ct', 33); E('p_tow', B, 11.49, 6, 'ct', 11);
    st.list = [{ productId: 'p_milk', qty: 1, checked: false }, { productId: 'p_eggs', qty: 1, checked: false }, { productId: 'p_pb', qty: 2, checked: false }, { productId: 'p_coffee', qty: 1, checked: false }, { productId: 'p_tow', qty: 1, checked: false }];
    S = st; recomputeShrink();
    var now = Date.now();
    st.recentChecks = [
      { productId: 'p_milk', unitPrice: 3.29 / (128 * UNITS.floz.b), verdict: 'stock', ts: now - 3600e3 * 26, storeId: B.id },
      { productId: 'p_coffee', unitPrice: 10.49 / (12 * UNITS.oz.b), verdict: 'skip', ts: now - 3600e3 * 50, storeId: B.id },
      { productId: 'p_ban', unitPrice: 0.65 / UNITS.lb.b, verdict: 'fair', ts: now - 3600e3 * 75, storeId: A.id }
    ];
    return st;
  }

  /* ================= Theme ================= */
  var mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  function applyTheme() {
    var t = S.settings.theme; var dark = t === 'dark' || (t === 'system' && mq && mq.matches);
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    var m = $('meta[name=theme-color]'); if (m) m.setAttribute('content', dark ? '#15171A' : '#F6F3EC');
  }
  if (mq && mq.addEventListener) mq.addEventListener('change', applyTheme);

  /* ================= Navigation ================= */
  var tab = 'check';
  function switchTab(t) {
    tab = t;
    $$('.tab').forEach(function (b) { b.classList.toggle('active', b.dataset.tab === t); });
    $$('.view').forEach(function (v) { v.hidden = v.dataset.view !== t; });
    renderView(t);
    var v = $('#view-' + t); if (v) v.scrollTop = 0;
  }
  function renderView(t) { ({ check: renderCheck, book: renderBook, list: renderList, more: renderMore })[t](); }
  function refreshAll() {
    renderView(tab);
    panels.forEach(function (p) { if (PANELS[p.type].live) renderPanel(p); });
    badges();
  }
  function commit() { save(); refreshAll(); }
  function badges() {
    var n = S.list.filter(function (i) { return !i.checked && prod(i.productId); }).length;
    var lb = $('#listBadge'); lb.hidden = !n; lb.textContent = n;
    $('#moreBadge').hidden = !(shrinkItems().length > (S.settings.shrinkSeen || 0));
  }

  /* ================= Panels ================= */
  var panels = [];
  var PANELS = {};
  function openPanel(type, arg) {
    var el = document.createElement('div'); el.className = 'panel';
    $('#panels').appendChild(el);
    var p = { el: el, type: type, arg: arg }; panels.push(p); renderPanel(p);
    requestAnimationFrame(function () { requestAnimationFrame(function () { el.classList.add('open'); }); });
    if (PANELS[type].onOpen) PANELS[type].onOpen(p);
    return p;
  }
  function closePanel() {
    var p = panels.pop(); if (!p) return;
    p.el.classList.remove('open'); setTimeout(function () { p.el.remove(); }, 320);
    refreshAll();
  }
  function renderPanel(p) {
    var r = PANELS[p.type].render(p.arg, p);
    if (!r) { var i = panels.indexOf(p); if (i >= 0) { panels.splice(i, 1); p.el.classList.remove('open'); setTimeout(function () { p.el.remove(); }, 320); } return; }
    var body = $('.pbody', p.el), st = body ? body.scrollTop : 0;
    p.el.innerHTML = '<header class="phead"><button class="icon-btn" data-act="back" aria-label="Back">' + ic('back') + '</button><h1>' + r.title + (r.sub ? '<small>' + r.sub + '</small>' : '') + '</h1>' + (r.actions || '') + '</header><div class="pbody">' + r.body + '</div>';
    $('.pbody', p.el).scrollTop = st;
  }
  function topPanel() { return panels[panels.length - 1]; }

  /* ================= Sheets ================= */
  var sheets = [];
  function openSheet(html, actions, onMount) {
    var w = document.createElement('div'); w.className = 'sheet-wrap';
    w.innerHTML = '<div class="backdrop" data-act="sheet-close"></div><div class="sheet" role="dialog" aria-modal="true"><div class="grab"></div>' + html + '</div>';
    $('#sheets').appendChild(w);
    var s = { el: w, actions: actions || {}, state: {} }; sheets.push(s);
    requestAnimationFrame(function () { requestAnimationFrame(function () { w.classList.add('open'); }); });
    if (onMount) onMount(w, s);
    return s;
  }
  function closeSheet() {
    var s = sheets.pop(); if (!s) return;
    s.el.classList.remove('open'); setTimeout(function () { s.el.remove(); }, 280);
  }
  function topSheet() { return sheets[sheets.length - 1]; }
  function confirmSheet(o) {
    openSheet('<h2>' + esc(o.title) + '</h2><p class="lead">' + o.text + '</p><div class="sheet-actions two"><button class="btn ghost" data-act="sheet-close">Cancel</button><button class="btn ' + (o.danger ? 'danger' : 'primary') + '" data-act="sh" data-a="ok">' + esc(o.ok || 'OK') + '</button></div>',
      { ok: function () { closeSheet(); o.onOk(); } });
  }
  function setErr(root, sel, msg) {
    var f = $(sel, root); if (!f) return;
    f.classList.toggle('invalid', !!msg); var e = $('.ferr', f); if (e) e.textContent = msg || '';
  }

  /* ================= Deal Check ================= */
  var chk = blankCheck();
  function blankCheck() { return { q: '', pid: null, price: '', size: '', unit: 'oz', storeId: defStore(), onSale: false, newCat: 'Pantry', ac: false, errs: {} }; }
  function chkCalc() {
    var price = num(chk.price), size = num(chk.size);
    var valid = price > 0 && size > 0 && UNITS[chk.unit];
    var p = chk.pid ? prod(chk.pid) : null;
    if (p && UNITS[chk.unit].f !== p.unitFamily) valid = false;
    var r = { valid: valid, price: price, size: size, p: p };
    if (!valid) { r.v = { k: 'empty' }; return r; }
    r.u = price / (size * UNITS[chk.unit].b);
    r.fam = UNITS[chk.unit].f;
    r.st = p ? stats(p.id) : null;
    r.v = verdictFor(r.st, r.u);
    if (p && chk.storeId && r.st) {
      var last = r.st.es.filter(function (e) { return e.storeId === chk.storeId; }).pop();
      if (last && size * UNITS[chk.unit].b < baseSize(last) * (1 - 1e-9) && price >= last.price - 1e-9) r.shrink = { last: last, pct: (r.u / unitPrice(last) - 1) * 100 };
    }
    return r;
  }
  function verdictHTML() {
    var r = chkCalc(), v = r.v, m = VMETA[v.k], sub = '', rows = '';
    if (v.k === 'empty') {
      sub = chk.pid || chk.q ? 'Enter the shelf price and package size' : 'Pick a product, then enter the shelf price and size';
      return '<div class="verdict v-empty" id="verdict"><div class="v-top"><div><div class="v-label">' + m.label + '</div><div class="v-sub">' + sub + '</div></div><div class="v-icon">' + ic(m.ic) + '</div></div>' +
        '<div class="v-rows"><div class="v-row"><span>Verdicts compare against</span><b class="plain">your own history</b></div></div></div>';
    }
    var st = r.st, f = r.fam;
    if (v.k === 'new') sub = r.p ? 'No prices logged yet — log this one to start tracking' : 'New product — log it to start your price history';
    else {
      var bS = storeName(st.bestE.storeId), bP = money(st.bestE.price) + ' for ' + sizeStr(st.bestE.size, st.bestE.unit);
      if (v.k === 'stock') sub = v.vsBest < -0.05 ? 'Beats your best (' + money(st.bestE.price) + ' at ' + esc(bS) + ') by ' + pct(v.vsBest) : v.vsBest <= 0.05 ? 'Matches your best-ever price (' + esc(bS) + ')' : pct(v.vsAvg) + ' below your average — stock up';
      else if (v.k === 'good') sub = pct(v.vsAvg) + ' below your average';
      else if (v.k === 'fair') sub = 'About your usual price (' + (v.vsAvg >= 0 ? '+' : '−') + pct(v.vsAvg) + ' vs avg)';
      else sub = pct(v.vsAvg) + ' above your average — wait for a deal';
      rows += '<div class="v-row"><span>Best · ' + esc(bS) + '</span><b>' + upText(st.best, f) + '</b></div>';
      rows += '<div class="v-row"><span>Your average (' + st.es.length + ')</span><b>' + upText(st.avg, f) + '</b></div>';
      rows += '<div class="v-row"><span>Vs best price</span><b>' + (Math.abs(v.vsBest) < 0.05 ? 'same' : pct(v.vsBest) + (v.vsBest < 0 ? ' lower' : ' higher')) + '</b></div>';
      if (v.vsBest > 0.05) rows += '<div class="v-row"><span>This size at your best price</span><b>' + money(st.best * r.size * UNITS[chk.unit].b) + '</b></div>';
      void bP;
    }
    var html = '<div class="verdict v-' + v.k + '" id="verdict"><div class="v-top"><div><div class="v-label">' + m.label + '</div><div class="v-sub">' + sub + '</div></div><div class="v-icon">' + ic(m.ic) + '</div></div>' +
      '<div class="v-price">' + upHTML(r.u, f) + '</div>' + (rows ? '<div class="v-rows">' + rows + '</div>' : '');
    if (r.shrink) html += '<div class="v-warn">⚠ Shrink alert: last time ' + sizeStr(r.shrink.last.size, r.shrink.last.unit) + ' for ' + money(r.shrink.last.price) + ' here — a ' + pct(r.shrink.pct) + ' hidden price increase</div>';
    return html + '</div>';
  }
  function acHTML() {
    if (!chk.ac) return '';
    var q = chk.q.trim().toLowerCase();
    var list = S.products.filter(function (p) { return !q || p.name.toLowerCase().indexOf(q) >= 0; })
      .sort(function (a, b) { var as = a.name.toLowerCase().indexOf(q) === 0 ? 0 : 1, bs = b.name.toLowerCase().indexOf(q) === 0 ? 0 : 1; return as - bs || (b.favorite ? 1 : 0) - (a.favorite ? 1 : 0) || a.name.localeCompare(b.name); }).slice(0, 6);
    var exact = S.products.some(function (p) { return p.name.toLowerCase() === q; });
    var h = list.map(function (p) {
      var st = stats(p.id);
      return '<button class="ac-item" data-act="ac-pick" data-id="' + p.id + '"><span><b>' + esc(p.name) + '</b><br><small>' + esc(p.category) + ' · ' + FAM_LABEL[p.unitFamily].toLowerCase() + '</small></span>' + (st ? '<span class="mono small">' + upHTML(st.best, p.unitFamily) + '</span>' : '') + '</button>';
    }).join('');
    if (q && !exact) h += '<button class="ac-item new" data-act="ac-new">' + ic('plus').replace('<svg', '<svg style="width:18px;height:18px"') + '<span style="flex:1">Create “' + esc(chk.q.trim()) + '”</span></button>';
    return h ? '<div class="ac-list" id="acList">' + h + '</div>' : '';
  }
  function newProdHTML() {
    if (chk.pid || !chk.q.trim()) return '';
    return '<div class="newprod">' + ic('sparkle').replace('<svg', '<svg style="width:18px;height:18px;flex:none;color:var(--accent)"') + '<span>New · ' + FAM_LABEL[UNITS[chk.unit].f].toLowerCase() + '</span><select data-in="chk-cat" aria-label="Category">' +
      S.categories.map(function (c) { return '<option' + (c === chk.newCat ? ' selected' : '') + '>' + esc(c) + '</option>'; }).join('') + '</select></div>';
  }
  function unitsHTML() {
    var p = chk.pid ? prod(chk.pid) : null;
    return UNIT_ORDER.map(function (u) {
      var off = p && UNITS[u].f !== p.unitFamily;
      return '<button class="unit' + (u === chk.unit ? ' on' : '') + (off ? ' off' : '') + (u === 'floz' ? ' sm' : '') + '" data-act="chk-unit" data-u="' + u + '">' + UNITS[u].l + '</button>';
    }).join('');
  }
  function staplesHTML() {
    if (chk.q || !S.products.length) return '';
    var seen = {}, ids = [];
    S.products.filter(function (p) { return p.favorite; }).forEach(function (p) { if (!seen[p.id]) { seen[p.id] = 1; ids.push(p.id); } });
    S.recentChecks.forEach(function (r) { if (!seen[r.productId] && prod(r.productId)) { seen[r.productId] = 1; ids.push(r.productId); } });
    if (!ids.length) return '';
    return '<div class="chips scroll staples">' + ids.slice(0, 8).map(function (id) { var p = prod(id); return '<button class="chip" data-act="ac-pick" data-id="' + id + '">' + (p.favorite ? '<span class="star">★</span>' : '') + '<span class="cn">' + esc(p.name) + '</span></button>'; }).join('') + '</div>';
  }
  function storeChipsHTML() {
    return S.stores.map(function (s) { return '<button class="chip' + (s.id === chk.storeId ? ' on' : '') + '" data-act="chk-store" data-id="' + s.id + '"><span class="dot" style="background:' + s.color + '"></span><span class="cn">' + esc(s.name) + '</span></button>'; }).join('') +
      '<button class="chip add" data-act="store-new">' + ic('plus').replace('<svg', '<svg style="width:16px;height:16px"') + 'Store</button>';
  }
  function recentHTML() {
    var rc = S.recentChecks.filter(function (r) { return prod(r.productId); }).slice(0, 10);
    if (!rc.length) return '';
    return '<div class="sec">Recent checks</div><div class="recent">' + rc.map(function (r) {
      var p = prod(r.productId), m = VMETA[r.verdict] || VMETA['new'];
      return '<button class="rc" style="--c:' + m.c + '" data-act="open-product" data-id="' + p.id + '"><em>' + m.label.toUpperCase() + '</em><b>' + esc(p.name) + '</b><span class="mono">' + upHTML(r.unitPrice, p.unitFamily) + '</span><small>' + ago(r.ts) + (r.storeId && store(r.storeId) ? ' · ' + esc(storeName(r.storeId)) : '') + '</small></button>';
    }).join('') + '</div>';
  }
  function renderCheck() {
    var v = $('#view-check');
    if (chk.storeId && !store(chk.storeId)) chk.storeId = defStore();
    if (chk.pid && !prod(chk.pid)) { chk.pid = null; }
    var welcome = !S.products.length ? '<div class="welcome"><h2>Welcome to your price book</h2><p>Shelfwise tells you in two seconds whether a shelf price is a real deal — based on what <b>you</b> have actually paid. Try it with sample data, or just start logging prices below.</p><div class="btn-row" style="margin-top:0"><button class="btn primary" data-act="load-sample">' + ic('sparkle') + 'Load sample data</button></div></div>' : '';
    var e = chk.errs;
    v.innerHTML =
      '<header class="top"><div class="brand"><div class="logo">' + ic('tag').replace('<svg', '<svg style="width:20px;height:20px"') + '</div><div><b>Shelfwise</b><small>Deal Check</small></div></div>' +
      '<button class="icon-btn boxed" data-act="open-compare" aria-label="Quick Compare">' + ic('scale') + '</button></header>' + welcome +
      '<div class="card">' +
      '<label class="field' + (e.name ? ' invalid' : '') + '" id="f-name"><span>Product</span><div class="ac-wrap"><input type="text" id="chkName" data-in="chk-name" placeholder="Search or add a product" autocomplete="off" value="' + esc(chk.q) + '">' +
      '<button class="icon-btn clear" data-act="chk-clear-name" aria-label="Clear product"' + (chk.q ? '' : ' hidden') + '>' + ic('x') + '</button><div id="acBox">' + acHTML() + '</div></div><div class="ferr">' + esc(e.name || '') + '</div></label>' +
      '<div id="staplesBox">' + staplesHTML() + '</div><div id="newProdBox">' + newProdHTML() + '</div>' +
      '<div class="row2 big"><label class="field' + (e.price ? ' invalid' : '') + '" id="f-price"><span>Shelf price</span><div class="money"><i>' + esc(cur()) + '</i><input type="text" inputmode="decimal" id="chkPrice" data-in="chk-price" placeholder="0.00" value="' + esc(chk.price) + '"></div><div class="ferr">' + esc(e.price || '') + '</div></label>' +
      '<label class="field' + (e.size ? ' invalid' : '') + '" id="f-size"><span>Size</span><input type="text" inputmode="decimal" id="chkSize" data-in="chk-size" placeholder="16" value="' + esc(chk.size) + '"><div class="ferr">' + esc(e.size || '') + '</div></label></div>' +
      '<div class="field" id="f-unit" style="margin-bottom:6px"><div class="units" id="unitsBox">' + unitsHTML() + '</div><div class="ferr" id="unitErr">' + esc(e.unit || '') + '</div></div>' +
      '<div class="field" id="f-store" style="margin:10px 0 0"><span class="flabel">Store</span><div class="chips scroll" id="storeChips">' + storeChipsHTML() + '</div><div class="ferr">' + esc(e.store || '') + '</div></div>' +
      '<label class="toggle" style="margin-top:4px"><span>On sale / promo price</span><input type="checkbox" data-in="chk-sale"' + (chk.onSale ? ' checked' : '') + '><span class="switch"></span></label>' +
      '</div>' +
      '<div id="verdictBox">' + verdictHTML() + '</div>' +
      '<div class="actions"><button class="btn primary lg" data-act="chk-log">' + ic('check') + 'Log price</button><button class="btn ghost lg" data-act="chk-reset">Clear</button></div>' +
      recentHTML();
  }
  function updateCheckLive(popV) {
    var box = $('#verdictBox'); if (!box) return;
    var old = $('#verdict'); var oldK = old ? old.className : '';
    box.innerHTML = verdictHTML();
    var nv = $('#verdict'); if (popV && nv && nv.className !== oldK) nv.classList.add('pop');
    $('#acBox').innerHTML = acHTML();
    $('#newProdBox').innerHTML = newProdHTML();
    $('#staplesBox').innerHTML = staplesHTML();
    $('#unitsBox').innerHTML = unitsHTML();
    var cl = $('[data-act=chk-clear-name]'); if (cl) cl.hidden = !chk.q;
    scheduleRecent();
  }
  function clearChkErr(k) { if (chk.errs[k]) { delete chk.errs[k]; var map = { name: '#f-name', price: '#f-price', size: '#f-size', unit: '#f-unit', store: '#f-store' }; setErr(document, map[k], ''); } }
  function pickProduct(id) {
    var p = prod(id); if (!p) return;
    chk.pid = id; chk.q = p.name; chk.ac = false; delete chk.errs.name; delete chk.errs.unit;
    var st = stats(id);
    if (st) { chk.unit = st.latestE.unit; if (!chk.size) chk.size = trimNum(st.latestE.size); }
    else if (UNITS[chk.unit].f !== p.unitFamily) chk.unit = FAM_UNITS[p.unitFamily][p.unitFamily === 'weight' ? 2 : 0];
    renderCheck();
    var pi = $('#chkPrice'); if (pi) pi.focus();
  }
  var recentTimer = null;
  function scheduleRecent() {
    clearTimeout(recentTimer);
    recentTimer = setTimeout(function () { var r = chkCalc(); if (r.valid && r.p) addRecent(r, false); }, 2500);
  }
  function addRecent(r, rerender) {
    var now = Date.now();
    S.recentChecks = S.recentChecks.filter(function (x) { return !(x.productId === r.p.id && now - x.ts < 10 * 60e3); });
    S.recentChecks.unshift({ productId: r.p.id, unitPrice: r.u, verdict: r.v.k, ts: now, storeId: chk.storeId });
    S.recentChecks = S.recentChecks.slice(0, 15); save();
    if (rerender) return;
  }
  function logCheck() {
    var errs = {}, name = chk.q.trim(), price = num(chk.price), size = num(chk.size);
    var p = chk.pid ? prod(chk.pid) : S.products.find(function (x) { return x.name.toLowerCase() === name.toLowerCase(); });
    if (!name) errs.name = 'Pick or type a product name';
    if (chk.price === '' || chk.price == null) errs.price = 'Enter the shelf price';
    else if (!(price > 0)) errs.price = price < 0 ? 'Price can’t be negative' : 'Enter a price above 0';
    if (chk.size === '' || chk.size == null) errs.size = 'Enter the package size';
    else if (!(size > 0)) errs.size = 'Size must be more than 0';
    if (p && UNITS[chk.unit].f !== p.unitFamily) errs.unit = esc(p.name) + ' is tracked by ' + p.unitFamily + ' — use ' + FAM_UNITS[p.unitFamily].map(function (u) { return UNITS[u].l; }).join(', ');
    if (!chk.storeId || !store(chk.storeId)) errs.store = 'Pick a store (or add one)';
    chk.errs = errs;
    if (Object.keys(errs).length) { renderCheck(); buzz(40); toast('Check the highlighted fields'); return; }
    if (!p) { p = { id: 'p_' + uid(), name: name, category: chk.newCat, unitFamily: UNITS[chk.unit].f, favorite: false, createdAt: Date.now() }; S.products.push(p); }
    chk.pid = p.id;
    var r = chkCalc();
    var e = { id: 'e_' + uid(), productId: p.id, storeId: chk.storeId, price: price, size: size, unit: chk.unit, onSale: chk.onSale, date: today(), ts: Date.now(), shrinkFlag: false };
    S.entries.push(e); recomputeShrink();
    clearTimeout(recentTimer); addRecent(r, true);
    var sid = chk.storeId; chk = blankCheck(); chk.storeId = sid;
    commit();
    buzz(25);
    if (e.shrinkFlag) { var si = shrinkInfo(e); toast('Shrink alert! ' + p.name + ' got smaller — ' + pct(si.pct) + ' hidden increase'); buzz(120); }
    else toast('Logged ' + money(price) + ' for ' + p.name + ' at ' + storeName(sid));
  }

  /* ================= Price Book ================= */
  var book = { q: '', cat: 'all' };
  function bookRows() {
    var q = book.q.trim().toLowerCase();
    return S.products.filter(function (p) {
      if (q && p.name.toLowerCase().indexOf(q) < 0 && p.category.toLowerCase().indexOf(q) < 0) return false;
      if (book.cat === 'fav') return p.favorite;
      if (book.cat !== 'all') return p.category === book.cat;
      return true;
    }).sort(function (a, b) { return (b.favorite ? 1 : 0) - (a.favorite ? 1 : 0) || a.name.localeCompare(b.name); });
  }
  function prowHTML(p) {
    var st = stats(p.id), shrink = S.entries.some(function (e) { return e.productId === p.id && e.shrinkFlag; });
    var right = st ? '<div class="pup">' + upHTML(st.best, p.unitFamily) + '</div><div class="pstore"><span class="dot" style="background:' + storeColor(st.stores[0].id) + '"></span>' + esc(storeName(st.stores[0].id)) + ' <span class="trend ' + st.trend + '">' + (st.trend === 'up' ? '▲' : st.trend === 'down' ? '▼' : '—') + '</span></div>' : '<div class="pstore">No prices yet</div>';
    return '<button class="prow" data-act="open-product" data-id="' + p.id + '"><div class="pmain"><div class="pname">' + (p.favorite ? '<span class="star">★</span>' : '') + '<span class="t">' + esc(p.name) + '</span>' + (shrink ? '<span class="badge shrink">Shrink</span>' : '') + '</div><div class="pmeta">' + esc(p.category) + ' · ' + (st ? st.es.length + ' price' + (st.es.length > 1 ? 's' : '') : FAM_LABEL[p.unitFamily].toLowerCase()) + '</div></div><div class="pright">' + right + '</div></button>';
  }
  function renderBook() {
    var v = $('#view-book');
    var cats = S.categories.filter(function (c) { return S.products.some(function (p) { return p.category === c; }); });
    var chips = '<button class="chip' + (book.cat === 'all' ? ' on' : '') + '" data-act="book-cat" data-c="all">All</button><button class="chip' + (book.cat === 'fav' ? ' on' : '') + '" data-act="book-cat" data-c="fav">★ Staples</button>' +
      cats.map(function (c) { return '<button class="chip' + (book.cat === c ? ' on' : '') + '" data-act="book-cat" data-c="' + esc(c) + '">' + esc(c) + '</button>'; }).join('');
    var body;
    if (!S.products.length) body = '<div class="empty"><div class="em-ic">' + ic('book') + '</div><h3>Your price book is empty</h3><p>Log prices from Deal Check, add a product, or load sample data to see how it works.</p><div class="btn-row" style="justify-content:center"><button class="btn primary" data-act="load-sample">' + ic('sparkle') + 'Load sample data</button><button class="btn ghost" data-act="product-new">Add product</button></div></div>';
    else body = '<div id="bookList">' + bookListHTML() + '</div>';
    v.innerHTML = '<header class="top"><div><h1>Price Book</h1><div class="sub">' + S.products.length + ' products · ' + S.entries.length + ' prices · ' + S.stores.length + ' stores</div></div></header>' +
      (S.products.length ? '<div class="search">' + ic('search') + '<input type="text" data-in="book-q" placeholder="Search products" value="' + esc(book.q) + '" aria-label="Search products"></div><div class="chips scroll" style="margin-top:10px">' + chips + '</div>' : '') +
      body + '<button class="fab" data-act="product-new" aria-label="Add product">' + ic('plus') + '</button>';
  }
  function bookListHTML() {
    var rows = bookRows();
    if (!rows.length) return '<div class="empty"><div class="em-ic">' + ic('search') + '</div><h3>No matches</h3><p>Try another search or category.</p></div>';
    return '<div class="plist">' + rows.map(prowHTML).join('') + '</div><div class="foot">Prices shown are your best unit price and the store that is cheapest on average.</div>';
  }

  /* ================= Product detail ================= */
  function sparkSVG(st, f) {
    var es = st.es, ups = st.ups, n = ups.length, W = 330, H = 110, px = 12, py = 14;
    var min = Math.min.apply(null, ups), max = Math.max.apply(null, ups), rng = (max - min) || max * 0.2 || 1;
    function x(i) { return n === 1 ? W / 2 : px + i * (W - 2 * px) / (n - 1); }
    function y(v) { return H - py - (v - min + (max === min ? rng / 2 : 0)) / rng * (H - 2 * py); }
    var d = ups.map(function (v, i) { return (i ? 'L' : 'M') + x(i).toFixed(1) + ',' + y(v).toFixed(1); }).join(' ');
    var area = d + ' L' + x(n - 1).toFixed(1) + ',' + H + ' L' + x(0).toFixed(1) + ',' + H + ' Z';
    var ay = y(st.avg).toFixed(1);
    var dots = ups.map(function (v, i) { var b = es[i] === st.bestE; return '<circle cx="' + x(i).toFixed(1) + '" cy="' + y(v).toFixed(1) + '" r="' + (b ? 5.5 : 3.6) + '" fill="' + (b ? 'var(--stock)' : storeColor(es[i].storeId)) + '" stroke="var(--card)" stroke-width="2"/>'; }).join('');
    return '<svg class="spark" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" role="img" aria-label="Unit price over time"><defs><linearGradient id="sg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="var(--accent)" stop-opacity=".22"/><stop offset="1" stop-color="var(--accent)" stop-opacity="0"/></linearGradient></defs>' +
      (n > 1 ? '<path d="' + area + '" fill="url(#sg)"/>' : '') + '<line x1="0" x2="' + W + '" y1="' + ay + '" y2="' + ay + '" stroke="var(--muted)" stroke-dasharray="4 4" stroke-width="1" opacity=".6"/>' +
      (n > 1 ? '<path d="' + d + '" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>' : '') + dots + '</svg>' +
      '<div class="spark-legend"><span>' + dShort(es[0].date) + '</span><span>low ' + upText(min, f) + ' · high ' + upText(max, f) + '</span><span>' + dShort(es[n - 1].date) + '</span></div>';
  }
  PANELS.product = {
    live: true,
    render: function (id) {
      var p = prod(id); if (!p) return null;
      var st = stats(id), f = p.unitFamily, inList = S.list.some(function (i) { return i.productId === id; });
      var actions = '<button class="icon-btn" data-act="fav" data-id="' + id + '" aria-label="Toggle staple" style="color:' + (p.favorite ? 'var(--fair)' : 'inherit') + '">' + ic(p.favorite ? 'starFill' : 'star') + '</button><button class="icon-btn" data-act="product-edit" data-id="' + id + '" aria-label="Edit product">' + ic('edit') + '</button>';
      var b = '';
      if (!st) {
        b = '<div class="empty"><div class="em-ic">' + ic('tag') + '</div><h3>No prices yet</h3><p>Log the first price for ' + esc(p.name) + ' to start tracking its best and average unit price.</p><button class="btn primary" data-act="entry-new" data-id="' + id + '">' + ic('plus') + 'Add a price</button></div>';
      } else {
        b += '<div class="stats"><div class="stat best"><span>Best</span><b>' + upHTML(st.best, f) + '</b><small>' + esc(storeName(st.bestE.storeId)) + '</small></div><div class="stat"><span>Average</span><b>' + upHTML(st.avg, f) + '</b><small>' + st.es.length + ' price' + (st.es.length === 1 ? '' : 's') + '</small></div><div class="stat"><span>Latest</span><b>' + upHTML(st.latest, f) + '</b><small>' + dShort(st.latestE.date) + ' <span class="trend ' + st.trend + '">' + (st.trend === 'up' ? '▲' : st.trend === 'down' ? '▼' : '') + '</span></small></div></div>';
        b += '<div class="card">' + sparkSVG(st, f) + '</div>';
        var maxA = Math.max.apply(null, st.stores.map(function (s) { return s.avg; }));
        b += '<div class="sec">Stores · cheapest first</div><div class="card bars">' + st.stores.map(function (s, i) {
          return '<div class="bar-row"><div class="bl"><b><span class="dot" style="background:' + storeColor(s.id) + '"></span>' + esc(storeName(s.id)) + (i === 0 && st.stores.length > 1 ? ' <span class="badge def">Cheapest</span>' : '') + '</b><span>' + upText(s.avg, f) + '</span></div><div class="bar"><i style="width:' + Math.max(8, s.avg / maxA * 100).toFixed(1) + '%;background:' + storeColor(s.id) + '"></i></div><div class="muted small" style="margin-top:4px">avg of ' + s.count + ' · best ' + upText(s.best, f) + '</div></div>';
        }).join('') + '</div>';
        b += '<div class="sec">History<button data-act="entry-new" data-id="' + id + '">+ Add price</button></div><div class="hist">' + st.es.slice().reverse().map(function (e) {
          var dp = dParts(e.date), si = e.shrinkFlag ? shrinkInfo(e) : null, isBest = e === st.bestE;
          return '<button class="hrow" data-act="entry-edit" data-id="' + e.id + '"><div class="hdate">' + dp.m + '<b>' + dp.d + '</b></div><div class="hmain"><div class="l1"><span class="dot" style="background:' + storeColor(e.storeId) + '"></span>' + esc(storeName(e.storeId)) + (e.onSale ? '<span class="badge sale">Sale</span>' : '') + (si ? '<span class="badge shrink">Shrink +' + si.pct.toFixed(0) + '%</span>' : '') + '</div><div class="l2">' + money(e.price) + ' · ' + sizeStr(e.size, e.unit) + '</div></div><div class="hright' + (isBest ? ' best' : '') + '">' + upHTML(unitPrice(e), f) + (isBest ? '<small>BEST</small>' : '') + '</div></button>';
        }).join('') + '</div>';
      }
      b += '<div class="btn-row" style="margin-top:16px"><button class="btn ' + (inList ? 'ghost' : 'primary') + '" data-act="list-toggle" data-id="' + id + '">' + ic(inList ? 'check' : 'listAdd') + (inList ? 'On your list' : 'Add to list') + '</button><button class="btn outline" data-act="check-product" data-id="' + id + '">' + ic('tag') + 'Check price</button></div>';
      b += '<button class="link-danger" data-act="product-del" data-id="' + id + '">Delete product</button>';
      return { title: esc(p.name), sub: esc(p.category) + ' · tracked by ' + p.unitFamily, actions: actions, body: b };
    }
  };

  function unitSegHTML(fam, sel, act) {
    var us = FAM_UNITS[fam];
    return '<div class="units" style="grid-template-columns:repeat(' + us.length + ',1fr)">' + us.map(function (u) { return '<button class="unit' + (u === sel ? ' on' : '') + '" data-act="' + act + '" data-u="' + u + '">' + UNITS[u].l + '</button>'; }).join('') + '</div>';
  }
  function entrySheet(pid, eid) {
    var p = prod(pid); if (!p) return;
    var e = eid ? S.entries.find(function (x) { return x.id === eid; }) : null;
    var st = stats(pid), L = st ? st.latestE : null;
    var f = { storeId: e ? e.storeId : (L ? L.storeId : defStore()), price: e ? e.price : '', size: e ? trimNum(e.size) : (L ? trimNum(L.size) : ''), unit: e ? e.unit : (L ? L.unit : FAM_UNITS[p.unitFamily][0]), date: e ? e.date : today(), onSale: e ? e.onSale : false };
    var storeOpts = S.stores.map(function (s) { return '<option value="' + s.id + '"' + (s.id === f.storeId ? ' selected' : '') + '>' + esc(s.name) + '</option>'; }).join('') + (f.storeId && !store(f.storeId) ? '<option value="' + esc(f.storeId) + '" selected>Unknown store</option>' : '');
    var html = '<h2>' + (e ? 'Edit price' : 'Add price') + '</h2><p class="lead">' + esc(p.name) + ' · ' + p.unitFamily + '</p>' +
      '<label class="field" id="es-f-store"><span>Store</span><select id="es-store">' + storeOpts + '</select><div class="ferr"></div></label>' +
      '<div class="row2"><label class="field" id="es-f-price"><span>Price</span><div class="money"><i>' + esc(cur()) + '</i><input type="text" inputmode="decimal" id="es-price" value="' + esc(f.price) + '" placeholder="0.00"></div><div class="ferr"></div></label>' +
      '<label class="field" id="es-f-size"><span>Size</span><input type="text" inputmode="decimal" id="es-size" value="' + esc(f.size) + '" placeholder="16"><div class="ferr"></div></label></div>' +
      '<div class="field"><span class="flabel">Unit</span><div id="es-units">' + unitSegHTML(p.unitFamily, f.unit, 'es-unit') + '</div></div>' +
      '<label class="field"><span>Date</span><input type="date" id="es-date" value="' + esc(f.date) + '"></label>' +
      '<label class="toggle"><span>On sale / promo</span><input type="checkbox" id="es-sale"' + (f.onSale ? ' checked' : '') + '><span class="switch"></span></label>' +
      '<div class="sheet-actions' + (e ? ' two' : '') + '">' + (e ? '<button class="btn danger-text outline" data-act="sh" data-a="del">' + ic('trash') + 'Delete</button>' : '') + '<button class="btn primary" data-act="sh" data-a="save">' + ic('check') + 'Save</button></div>';
    openSheet(html, {
      save: function () {
        var w = topSheet().el, price = num($('#es-price', w).value), size = num($('#es-size', w).value), ok = true;
        var sv = $('#es-price', w).value.trim(), zv = $('#es-size', w).value.trim();
        setErr(w, '#es-f-price', !sv ? 'Enter a price' : !(price > 0) ? (price < 0 ? 'Price can’t be negative' : 'Must be above 0') : ''); if (!(price > 0)) ok = false;
        setErr(w, '#es-f-size', !zv ? 'Enter a size' : !(size > 0) ? 'Must be above 0' : ''); if (!(size > 0)) ok = false;
        var sid = $('#es-store', w).value; setErr(w, '#es-f-store', sid ? '' : 'Pick a store'); if (!sid) ok = false;
        if (!ok) { buzz(40); return; }
        var unit = topSheet().state.unit || f.unit, date = $('#es-date', w).value || today(), sale = $('#es-sale', w).checked;
        var target = e || { id: 'e_' + uid(), productId: pid, ts: Date.now(), shrinkFlag: false };
        Object.assign(target, { storeId: sid, price: price, size: size, unit: unit, date: date, onSale: sale });
        if (!e) S.entries.push(target);
        recomputeShrink(); closeSheet(); commit();
        if (target.shrinkFlag && !e) toast('Shrink alert! ' + pct(shrinkInfo(target).pct) + ' hidden price increase');
        else toast(e ? 'Price updated' : 'Price added');
      },
      del: function () {
        confirmSheet({ title: 'Delete this price?', text: money(e.price) + ' · ' + sizeStr(e.size, e.unit) + ' at ' + esc(storeName(e.storeId)) + ' on ' + dShort(e.date) + '. Stats will recalculate.', ok: 'Delete', danger: true, onOk: function () {
          S.entries = S.entries.filter(function (x) { return x.id !== e.id; }); recomputeShrink(); closeSheet(); commit(); toast('Price deleted');
        } });
      }
    }, function (w, s) { s.state.unit = f.unit; });
  }
  function productSheet(id) {
    var p = id ? prod(id) : null, has = p && S.entries.some(function (e) { return e.productId === id; });
    var fam = p ? p.unitFamily : 'weight';
    var html = '<h2>' + (p ? 'Edit product' : 'New product') + '</h2><p class="lead">' + (p ? 'Rename, recategorize or mark as a staple.' : 'Add something you buy regularly. You can log prices right after.') + '</p>' +
      '<label class="field" id="ps-f-name"><span>Name</span><input type="text" id="ps-name" value="' + esc(p ? p.name : '') + '" placeholder="e.g. Greek Yogurt" autocomplete="off"><div class="ferr"></div></label>' +
      '<label class="field"><span>Category</span><select id="ps-cat">' + S.categories.map(function (c) { return '<option' + ((p ? p.category : 'Pantry') === c ? ' selected' : '') + '>' + esc(c) + '</option>'; }).join('') + '</select></label>' +
      '<div class="field"><span class="flabel">Measured by</span><div class="seg" id="ps-fam">' + ['weight', 'volume', 'count'].map(function (k) { return '<button data-act="ps-fam" data-f="' + k + '" class="' + (k === fam ? 'on' : '') + '"' + (has && k !== fam ? ' disabled' : '') + '>' + FAM_LABEL[k] + '</button>'; }).join('') + '</div>' + (has ? '<div class="muted small" style="margin:6px 2px 0">Locked because this product has price history.</div>' : '') + '</div>' +
      '<label class="toggle"><span>★ Staple (show first & in quick picks)</span><input type="checkbox" id="ps-fav"' + (p && p.favorite ? ' checked' : '') + '><span class="switch"></span></label>' +
      '<div class="sheet-actions two"><button class="btn ghost" data-act="sheet-close">Cancel</button><button class="btn primary" data-act="sh" data-a="save">Save</button></div>';
    openSheet(html, {
      save: function () {
        var w = topSheet().el, name = $('#ps-name', w).value.trim();
        var dup = S.products.find(function (x) { return x.name.toLowerCase() === name.toLowerCase() && x.id !== id; });
        var err = !name ? 'Give it a name' : dup ? 'You already have “' + dup.name + '”' : '';
        setErr(w, '#ps-f-name', err); if (err) return;
        var data = { name: name, category: $('#ps-cat', w).value, unitFamily: topSheet().state.fam, favorite: $('#ps-fav', w).checked };
        var np;
        if (p) Object.assign(p, data); else { np = Object.assign({ id: 'p_' + uid(), createdAt: Date.now() }, data); S.products.push(np); }
        closeSheet(); commit(); toast(p ? 'Saved' : 'Added ' + name);
        if (np) openPanel('product', np.id);
      }
    }, function (w, s) { s.state.fam = fam; setTimeout(function () { if (!p) $('#ps-name', w).focus(); }, 300); });
  }

  /* ================= Shopping list ================= */
  function listPlan() {
    var usual = usualStore(), groups = {}, savings = 0, compared = 0, missing = 0;
    S.list = S.list.filter(function (i) { return prod(i.productId); });
    S.list.forEach(function (it) {
      var p = prod(it.productId), st = stats(p.id), key = 'none', est = null, alt = null;
      if (st) {
        var c = st.stores[0]; key = c.id;
        var typical = baseSize(st.latestE);
        est = c.avg * typical * it.qty;
        var su = st.stores.find(function (s) { return s.id === usual; });
        if (su) { savings += (su.avg - c.avg) * typical * it.qty; compared++; } else missing++;
        if (st.stores[1] && st.stores[1].avg > c.avg * 1.005) alt ={ id: st.stores[1].id, pct: (st.stores[1].avg / c.avg - 1) * 100 };
        it._size = sizeStr(st.latestE.size, st.latestE.unit);
      }
      (groups[key] = groups[key] || { id: key, items: [], total: 0, left: 0 });
      groups[key].items.push({ it: it, p: p, est: est, alt: alt });
      if (est != null) groups[key].total += est;
      if (!it.checked) groups[key].left++;
    });
    var arr = Object.keys(groups).map(function (k) { return groups[k]; }).sort(function (a, b) { return a.id === 'none' ? 1 : b.id === 'none' ? -1 : b.total - a.total; });
    return { usual: usual, groups: arr, savings: savings, compared: compared, missing: missing, total: arr.reduce(function (a, g) { return a + g.total; }, 0) };
  }
  function renderList() {
    var v = $('#view-list'), pl = listPlan();
    var head = '<header class="top"><div><h1>Shopping List</h1><div class="sub">' + (S.list.length ? S.list.length + ' items · est. ' + money(pl.total) + ' · grouped by cheapest store' : 'Grouped by where each item is cheapest') + '</div></div><div style="display:flex;gap:6px">' +
      (S.list.length ? '<button class="icon-btn boxed" data-act="list-share" aria-label="Share list">' + ic('share') + '</button>' : '') + '<button class="icon-btn boxed" data-act="list-add" aria-label="Add items">' + ic('plus') + '</button></div></header>';
    if (!S.list.length) {
      v.innerHTML = head + '<div class="empty"><div class="em-ic">' + ic('cart') + '</div><h3>Your list is empty</h3><p>Add staples and Shelfwise will split them by the store where each one is historically cheapest.</p><button class="btn primary" data-act="list-add">' + ic('plus') + 'Add items</button></div>';
      return;
    }
    var banner = pl.compared && pl.savings > 0.005 ? '<div class="save-banner"><div class="sb-ic">' + ic('coin') + '</div><div><div class="big">' + money(pl.savings) + '</div><p>estimated savings vs buying ' + (pl.compared === S.list.length ? 'everything' : pl.compared + ' items') + ' at ' + esc(storeName(pl.usual)) + ', your usual store</p></div></div>'
      : '<div class="save-banner" style="background:var(--card2);color:var(--ink)"><div class="sb-ic" style="background:var(--card)">' + ic('store') + '</div><div><b>' + esc(storeName(pl.usual)) + ' is already your best bet</b><p>Log prices at more stores to find savings.</p></div></div>';
    var hasChecked = S.list.some(function (i) { return i.checked; });
    var groups = pl.groups.map(function (g) {
      var nm = g.id === 'none' ? 'No price yet' : storeName(g.id), col = g.id === 'none' ? 'var(--line)' : storeColor(g.id);
      return '<div class="group"><div class="ghead"><b><span class="dot" style="background:' + col + ';width:12px;height:12px"></span>' + esc(nm) + '</b><div><span>' + (g.id === 'none' ? '—' : '≈ ' + money(g.total)) + '</span><small>' + g.left + ' of ' + g.items.length + ' left</small></div></div>' +
        g.items.map(function (x) {
          var pid = x.p.id;
          return '<div class="litem' + (x.it.checked ? ' done' : '') + '"><button class="check" data-act="list-check" data-id="' + pid + '" aria-label="Check off"><i>' + ic('check') + '</i></button><button class="lmain" style="text-align:left" data-act="open-product" data-id="' + pid + '"><b>' + esc(x.p.name) + '</b><small>' + (x.it._size ? x.it._size + (x.alt ? ' · ' + pct(x.alt.pct) + ' more at ' + esc(storeName(x.alt.id)) : '') : 'Log a price to compare stores') + '</small></button>' +
            '<div class="qty"><button data-act="list-qty" data-id="' + pid + '" data-d="-1" aria-label="Less">−</button><span>' + x.it.qty + '</span><button data-act="list-qty" data-id="' + pid + '" data-d="1" aria-label="More">+</button></div><div class="lprice">' + (x.est != null ? money(x.est) : '—') + '</div></div>';
        }).join('') + '</div>';
    }).join('');
    v.innerHTML = head + banner + groups + '<div class="btn-row"><button class="btn outline" data-act="list-clear-checked"' + (hasChecked ? '' : ' disabled') + '>Clear checked</button><button class="btn primary" data-act="list-share">' + ic('share') + 'Share list</button></div><div class="foot">Estimates use each store’s average unit price × your usual package size.</div>';
  }
  function listText() {
    var pl = listPlan(), out = ['🛒 Shelfwise shopping list', ''];
    pl.groups.forEach(function (g) {
      out.push((g.id === 'none' ? 'Anywhere' : storeName(g.id)) + (g.id === 'none' ? '' : ' (≈ ' + money(g.total) + ')'));
      g.items.forEach(function (x) { out.push((x.it.checked ? '[x] ' : '[ ] ') + x.p.name + (x.it.qty > 1 ? ' ×' + x.it.qty : '') + (x.est != null ? ' — ' + money(x.est) : '')); });
      out.push('');
    });
    out.push('Estimated total: ' + money(pl.total));
    if (pl.savings > 0.005) out.push('Est. savings vs ' + storeName(pl.usual) + ': ' + money(pl.savings));
    return out.join('\n');
  }
  function shareText(t, okMsg) {
    if (window.Android && window.Android.share) { try { window.Android.share(t); return; } catch (e) { } }
    copyText(t, okMsg || 'Copied to clipboard');
  }
  function copyText(t, msg) {
    function fallback() {
      var ta = document.createElement('textarea'); ta.value = t; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch (e) { } ta.remove(); toast(msg);
    }
    try { if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(function () { toast(msg); }, fallback); else fallback(); } catch (e) { fallback(); }
  }
  function listToggle(pid) {
    var i = S.list.findIndex(function (x) { return x.productId === pid; });
    if (i >= 0) S.list.splice(i, 1); else S.list.push({ productId: pid, qty: 1, checked: false });
    commit(); return i < 0;
  }
  function pickSheet() {
    function rows(q) {
      q = (q || '').toLowerCase();
      var ps = S.products.filter(function (p) { return !q || p.name.toLowerCase().indexOf(q) >= 0; }).sort(function (a, b) { return (b.favorite ? 1 : 0) - (a.favorite ? 1 : 0) || a.name.localeCompare(b.name); });
      if (!ps.length) return '<div class="empty" style="padding:24px"><p>' + (S.products.length ? 'No matches.' : 'No products yet — add some in the Price Book.') + '</p></div>';
      return ps.map(function (p) {
        var inL = S.list.some(function (i) { return i.productId === p.id; }), st = stats(p.id);
        return '<button class="pick' + (inL ? ' in' : '') + '" data-act="pick-toggle" data-id="' + p.id + '"><span><b>' + (p.favorite ? '<span class="star">★</span> ' : '') + esc(p.name) + '</b><small>' + (st ? 'cheapest at ' + esc(storeName(st.stores[0].id)) : 'no prices yet') + '</small></span><span class="pk">' + (inL ? '✓ Added' : '+ Add') + '</span></button>';
      }).join('');
    }
    openSheet('<h2>Add to list</h2><div class="search" style="margin-top:8px">' + ic('search') + '<input type="text" data-in="pick-q" placeholder="Search products" autocomplete="off"></div><div class="pick-list" id="pickList">' + rows('') + '</div><div class="sheet-actions"><button class="btn primary" data-act="sheet-close">Done</button></div>', {}, function (w, s) { s.state.rows = rows; });
  }

  /* ================= Quick Compare ================= */
  var cmp = null;
  function cmpReset() { cmp = { opts: [{ price: '', size: '', unit: 'oz' }, { price: '', size: '', unit: 'oz' }] }; }
  cmpReset();
  var LETTERS = 'ABCD';
  function cmpCalc() {
    var res = cmp.opts.map(function (o) { var pr = num(o.price), sz = num(o.size); return pr > 0 && sz > 0 ? { u: pr / (sz * UNITS[o.unit].b), f: UNITS[o.unit].f } : null; });
    var valid = res.map(function (r, i) { return r ? i : -1; }).filter(function (i) { return i >= 0; });
    var fams = {}; valid.forEach(function (i) { fams[res[i].f] = 1; });
    var mixed = Object.keys(fams).length > 1, win = -1;
    if (!mixed && valid.length >= 2) { win = valid.reduce(function (a, i) { return res[i].u < res[a].u ? i : a; }, valid[0]); }
    return { res: res, valid: valid, mixed: mixed, win: win };
  }
  function cmpUpdate() {
    var p = panels.find(function (x) { return x.type === 'compare'; }); if (!p) return;
    var c = cmpCalc();
    cmp.opts.forEach(function (o, i) {
      var card = $('#cmp-' + i, p.el), r = c.res[i]; if (!card) return;
      card.classList.toggle('win', i === c.win);
      var tag = '';
      if (r && c.win >= 0) tag = i === c.win ? '<span class="win-tag">BEST VALUE</span>' : '<span class="lose-tag">+' + pct((r.u / c.res[c.win].u - 1) * 100) + '</span>';
      $('.cmp-res', card).innerHTML = r ? '<span class="mono">' + upHTML(r.u, r.f) + '</span>' + tag : '<span class="muted small">Enter price and size</span>';
    });
    var sm = $('#cmpSummary', p.el), txt, cls = '';
    if (c.mixed) { txt = 'Can’t compare different kinds of units — use all weight, all volume or all count.'; cls = 'warn'; }
    else if (c.win < 0) txt = 'Enter at least two options to see which is cheaper per unit.';
    else {
      var w = c.res[c.win], others = c.valid.filter(function (i) { return i !== c.win; }).sort(function (a, b) { return c.res[a].u - c.res[b].u; });
      var nb = others[0], wo = others[others.length - 1];
      var s1 = (1 - w.u / c.res[nb].u) * 100, s2 = (1 - w.u / c.res[wo].u) * 100;
      if (s1 < 0.05) txt = 'It’s a tie — Option ' + LETTERS[c.win] + ' and Option ' + LETTERS[nb] + ' cost the same per unit.';
      else txt = '<b>Option ' + LETTERS[c.win] + ' wins</b> — ' + pct(s1) + ' cheaper per unit than Option ' + LETTERS[nb] + (others.length > 1 ? ', and ' + pct(s2) + ' cheaper than Option ' + LETTERS[wo] : '') + '.';
      cls = 'win';
    }
    sm.className = 'cmp-summary ' + cls; sm.innerHTML = txt;
  }
  PANELS.compare = {
    live: false,
    render: function () {
      var b = '<p class="muted" style="margin:0 2px 4px;line-height:1.45">Compare package options side by side. Nothing is saved to your price book.</p>';
      b += cmp.opts.map(function (o, i) {
        return '<div class="cmp-card" id="cmp-' + i + '"><div class="cmp-head"><b>Option ' + LETTERS[i] + '</b>' + (cmp.opts.length > 2 ? '<button class="icon-btn" data-act="cmp-del" data-i="' + i + '" aria-label="Remove option" style="width:36px;height:36px">' + ic('x') + '</button>' : '<span style="height:36px"></span>') + '</div>' +
          '<div class="cmp-grid"><label class="field"><span>Price</span><div class="money"><i>' + esc(cur()) + '</i><input type="text" inputmode="decimal" data-in="cmp" data-i="' + i + '" data-k="price" value="' + esc(o.price) + '" placeholder="0.00"></div></label>' +
          '<label class="field"><span>Size</span><input type="text" inputmode="decimal" data-in="cmp" data-i="' + i + '" data-k="size" value="' + esc(o.size) + '" placeholder="12"></label>' +
          '<label class="field"><span>Unit</span><select data-in="cmp" data-i="' + i + '" data-k="unit">' + UNIT_ORDER.map(function (u) { return '<option value="' + u + '"' + (u === o.unit ? ' selected' : '') + '>' + UNITS[u].l + '</option>'; }).join('') + '</select></label></div>' +
          '<div class="cmp-res"></div></div>';
      }).join('');
      if (cmp.opts.length < 4) b += '<button class="btn outline block" style="margin-top:12px" data-act="cmp-add">' + ic('plus') + 'Add option</button>';
      b += '<div class="cmp-summary" id="cmpSummary"></div><button class="btn ghost block" style="margin-top:12px" data-act="cmp-reset">' + ic('reset') + 'Start over</button>';
      return { title: 'Quick Compare', sub: 'Which package is cheaper per unit?', body: b };
    },
    onOpen: function () { cmpUpdate(); }
  };

  /* ================= Shrink Watch ================= */
  PANELS.shrink = {
    live: true,
    render: function () {
      var items = shrinkItems(), b;
      if (!items.length) b = '<div class="empty"><div class="em-ic">' + ic('shrink') + '</div><h3>No shrinkflation spotted</h3><p>When a product gets smaller at the same store but the price stays the same or rises, it shows up here.</p></div>';
      else b = '<p class="muted" style="margin:0 2px;line-height:1.45">Same store, smaller package, same or higher price. The percentage is the hidden price increase per unit.</p>' + items.map(function (x) {
        var e = x.e, pv = x.info.prev, p = prod(e.productId);
        return '<button class="shr" data-act="open-product" data-id="' + p.id + '"><div class="shr-top"><div><b>' + esc(p.name) + '</b><small><span class="dot" style="background:' + storeColor(e.storeId) + '"></span> ' + esc(storeName(e.storeId)) + ' · ' + dShort(e.date) + '</small></div><div class="shr-pct">+' + x.info.pct.toFixed(1) + '%<small>hidden increase</small></div></div>' +
          '<div class="shr-sizes"><s>' + sizeStr(pv.size, pv.unit) + ' · ' + money(pv.price) + '</s>' + ic('arrowR') + '<b>' + sizeStr(e.size, e.unit) + ' · ' + money(e.price) + '</b></div></button>';
      }).join('');
      return { title: 'Shrink Watch', sub: items.length + ' flagged item' + (items.length === 1 ? '' : 's'), body: b };
    },
    onOpen: function () { S.settings.shrinkSeen = shrinkItems().length; save(); badges(); }
  };

  /* ================= Stores ================= */
  PANELS.stores = {
    live: true,
    render: function () {
      var b = '<div class="card" style="padding:0">' + (S.stores.length ? S.stores.map(function (s) {
        var n = S.entries.filter(function (e) { return e.storeId === s.id; }).length;
        return '<button class="srow" data-act="store-edit" data-id="' + s.id + '"><span class="swatch" style="background:' + s.color + '"></span><span class="mt"><b>' + esc(s.name) + '</b><small>' + n + ' price' + (n === 1 ? '' : 's') + '</small></span>' + (S.settings.defaultStoreId === s.id ? '<span class="badge def">Default</span>' : '') + '<span class="chev">' + ic('chev') + '</span></button>';
      }).join('') : '<div class="empty"><p>No stores yet.</p></div>') + '</div>';
      b += '<button class="btn primary block" style="margin-top:14px" data-act="store-new">' + ic('plus') + 'Add store</button>';
      return { title: 'Stores', sub: S.stores.length + ' stores', body: b };
    }
  };
  function storeSheet(id) {
    var s = id ? store(id) : null, col = s ? s.color : COLORS[S.stores.length % COLORS.length];
    var html = '<h2>' + (s ? 'Edit store' : 'New store') + '</h2>' +
      '<label class="field" id="ss-f-name" style="margin-top:12px"><span>Name</span><input type="text" id="ss-name" value="' + esc(s ? s.name : '') + '" placeholder="e.g. Corner Market" autocomplete="off"><div class="ferr"></div></label>' +
      '<div class="field"><span class="flabel">Color tag</span><div class="colors" id="ss-colors">' + COLORS.map(function (c) { return '<button style="background:' + c + '" class="' + (c === col ? 'on' : '') + '" data-act="ss-color" data-c="' + c + '" aria-label="Color"></button>'; }).join('') + '</div></div>' +
      '<label class="toggle"><span>Default / usual store</span><input type="checkbox" id="ss-def"' + (s && S.settings.defaultStoreId === s.id ? ' checked' : '') + '><span class="switch"></span></label>' +
      '<div class="sheet-actions' + (s ? ' two' : '') + '">' + (s ? '<button class="btn outline danger-text" data-act="sh" data-a="del">' + ic('trash') + 'Delete</button>' : '') + '<button class="btn primary" data-act="sh" data-a="save">Save</button></div>';
    openSheet(html, {
      save: function () {
        var w = topSheet().el, name = $('#ss-name', w).value.trim();
        var dup = S.stores.find(function (x) { return x.name.toLowerCase() === name.toLowerCase() && x.id !== id; });
        var err = !name ? 'Give the store a name' : dup ? 'That store already exists' : ''; setErr(w, '#ss-f-name', err); if (err) return;
        var target = s || { id: 's_' + uid() };
        target.name = name; target.color = topSheet().state.color;
        if (!s) S.stores.push(target);
        if ($('#ss-def', w).checked) S.settings.defaultStoreId = target.id; else if (S.settings.defaultStoreId === target.id) S.settings.defaultStoreId = null;
        if (!s && tab === 'check') chk.storeId = target.id;
        closeSheet(); commit(); toast(s ? 'Store saved' : 'Added ' + name);
      },
      del: function () { closeSheet(); deleteStore(id); }
    }, function (w, st) { st.state.color = col; setTimeout(function () { if (!s) $('#ss-name', w).focus(); }, 300); });
  }
  function deleteStore(id) {
    var s = store(id), n = S.entries.filter(function (e) { return e.storeId === id; }).length;
    function finish(mode) {
      if (mode === 'move') {
        var u = S.stores.find(function (x) { return x.name === 'Unknown store' && x.id !== id; });
        if (!u) { u = { id: 's_' + uid(), name: 'Unknown store', color: '#8A8F89' }; S.stores.push(u); }
        S.entries.forEach(function (e) { if (e.storeId === id) e.storeId = u.id; });
      } else S.entries = S.entries.filter(function (e) { return e.storeId !== id; });
      S.stores = S.stores.filter(function (x) { return x.id !== id; });
      if (S.settings.defaultStoreId === id) S.settings.defaultStoreId = null;
      recomputeShrink(); commit(); toast('Deleted ' + s.name);
    }
    if (!n) { confirmSheet({ title: 'Delete ' + s.name + '?', text: 'It has no prices logged.', ok: 'Delete', danger: true, onOk: function () { finish('del'); } }); return; }
    openSheet('<h2>Delete ' + esc(s.name) + '?</h2><p class="lead">' + n + ' logged price' + (n === 1 ? '' : 's') + ' belong to this store. Keep them under “Unknown store”, or delete them too.</p><div class="sheet-actions"><button class="btn primary" data-act="sh" data-a="move">Keep prices as “Unknown store”</button><button class="btn danger" data-act="sh" data-a="del">Delete store and ' + n + ' price' + (n === 1 ? '' : 's') + '</button><button class="btn ghost" data-act="sheet-close">Cancel</button></div>',
      { move: function () { closeSheet(); finish('move'); }, del: function () { closeSheet(); finish('del'); } });
  }

  /* ================= Categories ================= */
  PANELS.cats = {
    live: true,
    render: function () {
      var b = '<div class="card" style="padding:0">' + S.categories.map(function (c, i) {
        var n = S.products.filter(function (p) { return p.category === c; }).length;
        return '<button class="srow" data-act="cat-edit" data-i="' + i + '"><span class="mrow" style="padding:0;border:0;min-height:0;width:auto"><span class="mic">' + ic('folder') + '</span></span><span class="mt"><b>' + esc(c) + '</b><small>' + n + ' product' + (n === 1 ? '' : 's') + '</small></span><span class="chev">' + ic('chev') + '</span></button>';
      }).join('') + '</div><button class="btn primary block" style="margin-top:14px" data-act="cat-new">' + ic('plus') + 'Add category</button>';
      return { title: 'Categories', sub: S.categories.length + ' categories', body: b };
    }
  };
  function catSheet(i) {
    var c = i == null ? null : S.categories[i];
    openSheet('<h2>' + (c ? 'Edit category' : 'New category') + '</h2><label class="field" id="cs-f" style="margin-top:12px"><span>Name</span><input type="text" id="cs-name" value="' + esc(c || '') + '" autocomplete="off"><div class="ferr"></div></label>' +
      '<div class="sheet-actions' + (c ? ' two' : '') + '">' + (c && c !== 'Other' ? '<button class="btn outline danger-text" data-act="sh" data-a="del">' + ic('trash') + 'Delete</button>' : '') + '<button class="btn primary" data-act="sh" data-a="save">Save</button></div>', {
      save: function () {
        var w = topSheet().el, n = $('#cs-name', w).value.trim();
        var dup = S.categories.some(function (x, j) { return x.toLowerCase() === n.toLowerCase() && j !== i; });
        var err = !n ? 'Enter a name' : dup ? 'Already exists' : ''; setErr(w, '#cs-f', err); if (err) return;
        if (c) { S.categories[i] = n; S.products.forEach(function (p) { if (p.category === c) p.category = n; }); } else S.categories.push(n);
        closeSheet(); commit();
      },
      del: function () {
        S.categories.splice(i, 1); if (S.categories.indexOf('Other') < 0) S.categories.push('Other');
        S.products.forEach(function (p) { if (p.category === c) p.category = 'Other'; });
        if (book.cat === c) book.cat = 'all';
        closeSheet(); commit(); toast('Moved products to “Other”');
      }
    }, function (w) { setTimeout(function () { $('#cs-name', w).focus(); }, 300); });
  }

  /* ================= Backup ================= */
  PANELS.backup = {
    live: false,
    render: function () {
      var json = JSON.stringify(S);
      var b = '<div class="sec" style="margin-top:4px">Export</div><div class="card"><p class="muted small" style="margin:0 0 10px;line-height:1.45">Your whole price book as JSON (' + S.products.length + ' products, ' + S.entries.length + ' prices). Save it somewhere safe.</p><textarea class="input" id="exportText" readonly>' + esc(json) + '</textarea><div class="btn-row"><button class="btn ghost" data-act="exp-copy">' + ic('copy') + 'Copy</button><button class="btn primary" data-act="exp-share">' + ic('share') + 'Share</button></div></div>' +
        '<div class="sec">Restore</div><div class="card"><p class="muted small" style="margin:0 0 10px;line-height:1.45">Paste a Shelfwise backup below. This replaces all current data.</p><label class="field" id="imp-f" style="margin:0"><textarea class="input" id="importText" placeholder="{ &quot;products&quot;: … }"></textarea><div class="ferr"></div></label><button class="btn primary block" style="margin-top:12px" data-act="imp-go">' + ic('download') + 'Restore from backup</button></div>';
      return { title: 'Backup & restore', sub: 'Offline JSON backup', body: b };
    }
  };
  function doImport() {
    var p = topPanel(), raw = $('#importText', p.el).value.trim(), d;
    if (!raw) { setErr(p.el, '#imp-f', 'Paste your backup JSON first'); return; }
    try { d = JSON.parse(raw); } catch (e) { setErr(p.el, '#imp-f', 'That isn’t valid JSON — check you copied all of it'); return; }
    if (!d || !Array.isArray(d.products) || !Array.isArray(d.entries)) { setErr(p.el, '#imp-f', 'This doesn’t look like a Shelfwise backup'); return; }
    setErr(p.el, '#imp-f', '');
    confirmSheet({ title: 'Replace all data?', text: 'Restore ' + d.products.length + ' products and ' + d.entries.length + ' prices. Your current data will be overwritten.', ok: 'Restore', danger: true, onOk: function () {
      S = normalize(d); recomputeShrink(); chk = blankCheck(); applyTheme(); save(); closePanel(); refreshAll(); toast('Backup restored');
    } });
  }

  /* ================= More ================= */
  function renderMore() {
    var v = $('#view-more'), sh = shrinkItems().length, s = S.settings, t = s.verdictThresholds;
    function mrow(act, icn, title, sub, extra, cls) { return '<button class="mrow' + (cls ? ' ' + cls : '') + '" data-act="' + act + '"><span class="mic">' + ic(icn) + '</span><span class="mt"><b>' + title + '</b><small>' + sub + '</small></span>' + (extra || '') + '<span class="chev">' + ic('chev') + '</span></button>'; }
    var curs = ['$', '€', '£', '₹', '¥', 'C$', 'A$'];
    v.innerHTML = '<header class="top"><div><h1>More</h1><div class="sub">Tools, stores & settings</div></div></header>' +
      '<div class="card menu" style="padding:0">' +
      mrow('open-compare', 'scale', 'Quick Compare', 'Which package is cheaper per unit?') +
      mrow('open-shrink', 'shrink', 'Shrink Watch', sh ? sh + ' product' + (sh === 1 ? '' : 's') + ' got smaller' : 'Catch shrinkflation automatically', sh ? '<span class="count-pill">' + sh + '</span>' : '') +
      mrow('open-stores', 'store', 'Stores', S.stores.length + ' stores · colors & default') +
      mrow('open-cats', 'folder', 'Categories', S.categories.length + ' categories') + '</div>' +
      '<div class="sec">Preferences</div><div class="card">' +
      '<div class="pref"><span class="flabel">Currency symbol</span><div class="chips">' + curs.map(function (c) { return '<button class="chip' + (s.currency === c ? ' on' : '') + '" data-act="set-cur" data-c="' + esc(c) + '">' + esc(c) + '</button>'; }).join('') + '<input class="input cur-input" data-in="cur" maxlength="3" placeholder="Other" value="' + (curs.indexOf(s.currency) < 0 ? esc(s.currency) : '') + '" aria-label="Custom currency"></div></div>' +
      '<div class="pref"><span class="flabel">Default store</span><div class="chips">' + S.stores.map(function (x) { return '<button class="chip' + (s.defaultStoreId === x.id ? ' on' : '') + '" data-act="set-defstore" data-id="' + x.id + '"><span class="dot" style="background:' + x.color + '"></span><span class="cn">' + esc(x.name) + '</span></button>'; }).join('') + '</div></div>' +
      '<div class="pref"><span class="flabel">Show weight prices per</span><div class="seg">' + PER_OPTS.weight.map(function (k) { return '<button class="' + (perKey('weight') === k ? 'on' : '') + '" data-act="set-per" data-f="weight" data-k="' + k + '">' + PER[k].n + '</button>'; }).join('') + '</div></div>' +
      '<div class="pref"><span class="flabel">Show volume prices per</span><div class="seg">' + PER_OPTS.volume.map(function (k) { return '<button class="' + (perKey('volume') === k ? 'on' : '') + '" data-act="set-per" data-f="volume" data-k="' + k + '">' + PER[k].n + '</button>'; }).join('') + '</div></div>' +
      '<div class="pref"><span class="flabel">Verdict thresholds</span>' +
      '<div class="stepper"><span>STOCK UP at ≥ ' + t.stockUpPct + '% below avg</span><div class="qty"><button data-act="set-th" data-k="stockUpPct" data-d="-5" aria-label="Decrease">−</button><span>' + t.stockUpPct + '</span><button data-act="set-th" data-k="stockUpPct" data-d="5" aria-label="Increase">+</button></div></div>' +
      '<div class="stepper"><span>FAIR within ±' + t.fairPct + '% of avg</span><div class="qty"><button data-act="set-th" data-k="fairPct" data-d="-1" aria-label="Decrease">−</button><span>' + t.fairPct + '</span><button data-act="set-th" data-k="fairPct" data-d="1" aria-label="Increase">+</button></div></div></div>' +
      '<div class="pref"><span class="flabel">Theme</span><div class="seg">' + [['light', 'Light'], ['dark', 'Dark'], ['system', 'System']].map(function (o) { return '<button class="' + (s.theme === o[0] ? 'on' : '') + '" data-act="set-theme" data-t="' + o[0] + '">' + o[1] + '</button>'; }).join('') + '</div></div>' +
      '</div>' +
      '<div class="sec">Data</div><div class="card menu" style="padding:0">' +
      mrow('open-backup', 'copy', 'Backup & restore', 'Export or import JSON') +
      mrow('load-sample', 'sparkle', 'Load sample data', '9 products, 3 stores, real-looking history') +
      mrow('reset', 'reset', 'Reset all data', 'Start over with an empty price book', '', 'danger') + '</div>' +
      '<div class="foot">Shelfwise · offline, ad-free, no account<br>Your data never leaves this phone.</div>';
  }
  function loadSample() {
    function go() { sampleState(); chk = blankCheck(); book = { q: '', cat: 'all' }; save(); refreshAll(); toast('Sample price book loaded'); buzz(20); }
    if (S.products.length) confirmSheet({ title: 'Replace with sample data?', text: 'Your current ' + S.products.length + ' products and ' + S.entries.length + ' prices will be replaced. Export a backup first if you want to keep them.', ok: 'Load sample', danger: true, onOk: go });
    else go();
  }

  /* ================= Events ================= */
  var ACT = {
    tab: function (b) { switchTab(b.dataset.tab); },
    back: function () { closePanel(); },
    'sheet-close': function () { closeSheet(); },
    sh: function (b) { var s = topSheet(); if (s && s.actions[b.dataset.a]) s.actions[b.dataset.a](b); },
    'load-sample': loadSample,
    reset: function () { confirmSheet({ title: 'Reset all data?', text: 'This deletes every product, price, store and list item. This can’t be undone.', ok: 'Reset everything', danger: true, onOk: function () { S = freshState(); chk = blankCheck(); book = { q: '', cat: 'all' }; save(); applyTheme(); refreshAll(); switchTab('check'); toast('All data cleared'); } }); },
    'open-compare': function () { openPanel('compare'); },
    'open-shrink': function () { openPanel('shrink'); },
    'open-stores': function () { openPanel('stores'); },
    'open-cats': function () { openPanel('cats'); },
    'open-backup': function () { openPanel('backup'); },
    'open-product': function (b) { closeAllSheets(); openPanel('product', b.dataset.id); },
    // check
    'ac-pick': function (b) { pickProduct(b.dataset.id); },
    'ac-new': function () { chk.ac = false; chk.pid = null; updateCheckLive(); var pi = $('#chkPrice'); if (pi) pi.focus(); },
    'chk-clear-name': function () { chk.q = ''; chk.pid = null; chk.ac = false; renderCheck(); $('#chkName').focus(); },
    'chk-unit': function (b) {
      var u = b.dataset.u, p = chk.pid ? prod(chk.pid) : null;
      if (p && UNITS[u].f !== p.unitFamily) {
        chk.errs.unit = p.name + ' is tracked by ' + p.unitFamily + ' — use ' + FAM_UNITS[p.unitFamily].map(function (x) { return UNITS[x].l; }).join(', ');
        setErr(document, '#f-unit', chk.errs.unit); buzz(40); return;
      }
      chk.unit = u; clearChkErr('unit'); updateCheckLive(true);
    },
    'chk-store': function (b) { chk.storeId = b.dataset.id; clearChkErr('store'); $$('#storeChips .chip').forEach(function (c) { c.classList.toggle('on', c.dataset.id === chk.storeId); }); updateCheckLive(true); },
    'chk-log': logCheck,
    'chk-reset': function () { var sid = chk.storeId; chk = blankCheck(); chk.storeId = sid; renderCheck(); },
    'store-new': function () { storeSheet(null); },
    'check-product': function (b) { var id = b.dataset.id; while (panels.length) { var p = panels.pop(); p.el.remove(); } switchTab('check'); chk.price = ''; chk.size = ''; pickProduct(id); },
    // book
    'book-cat': function (b) { book.cat = b.dataset.c; renderBook(); },
    'product-new': function () { productSheet(null); },
    'product-edit': function (b) { productSheet(b.dataset.id); },
    'product-del': function (b) {
      var p = prod(b.dataset.id), n = S.entries.filter(function (e) { return e.productId === p.id; }).length;
      confirmSheet({ title: 'Delete ' + p.name + '?', text: 'This removes the product and its ' + n + ' logged price' + (n === 1 ? '' : 's') + '.', ok: 'Delete', danger: true, onOk: function () {
        S.products = S.products.filter(function (x) { return x.id !== p.id; }); S.entries = S.entries.filter(function (e) { return e.productId !== p.id; });
        S.list = S.list.filter(function (i) { return i.productId !== p.id; }); S.recentChecks = S.recentChecks.filter(function (r) { return r.productId !== p.id; });
        recomputeShrink(); closePanel(); commit(); toast('Deleted ' + p.name);
      } });
    },
    fav: function (b) { var p = prod(b.dataset.id); p.favorite = !p.favorite; commit(); toast(p.favorite ? 'Marked as a staple' : 'Removed from staples'); },
    'entry-new': function (b) { entrySheet(b.dataset.id, null); },
    'entry-edit': function (b) { var e = S.entries.find(function (x) { return x.id === b.dataset.id; }); if (e) entrySheet(e.productId, e.id); },
    'es-unit': function (b) { var s = topSheet(); s.state.unit = b.dataset.u; $$('[data-act=es-unit]', s.el).forEach(function (x) { x.classList.toggle('on', x === b); }); },
    'ps-fam': function (b) { var s = topSheet(); s.state.fam = b.dataset.f; $$('[data-act=ps-fam]', s.el).forEach(function (x) { x.classList.toggle('on', x === b); }); },
    // list
    'list-toggle': function (b) { var added = listToggle(b.dataset.id); toast(added ? 'Added to shopping list' : 'Removed from list'); },
    'list-add': pickSheet,
    'pick-toggle': function (b) { listToggle(b.dataset.id); var s = topSheet(); var q = $('[data-in=pick-q]', s.el).value; $('#pickList', s.el).innerHTML = s.state.rows(q); },
    'list-check': function (b) { var it = S.list.find(function (i) { return i.productId === b.dataset.id; }); it.checked = !it.checked; buzz(10); commit(); },
    'list-qty': function (b) { var it = S.list.find(function (i) { return i.productId === b.dataset.id; }); it.qty = Math.max(1, Math.min(99, it.qty + (+b.dataset.d))); commit(); },
    'list-clear-checked': function () { var n = S.list.filter(function (i) { return i.checked; }).length; S.list = S.list.filter(function (i) { return !i.checked; }); commit(); toast('Cleared ' + n + ' item' + (n === 1 ? '' : 's')); },
    'list-share': function () { shareText(listText(), 'List copied — sharing isn’t available here'); },
    // compare
    'cmp-add': function () { var last = cmp.opts[cmp.opts.length - 1]; cmp.opts.push({ price: '', size: '', unit: last ? last.unit : 'oz' }); var p = topPanel(); renderPanel(p); cmpUpdate(); },
    'cmp-del': function (b) { cmp.opts.splice(+b.dataset.i, 1); renderPanel(topPanel()); cmpUpdate(); },
    'cmp-reset': function () { cmpReset(); renderPanel(topPanel()); cmpUpdate(); },
    // stores/cats
    'store-edit': function (b) { storeSheet(b.dataset.id); },
    'ss-color': function (b) { var s = topSheet(); s.state.color = b.dataset.c; $$('[data-act=ss-color]', s.el).forEach(function (x) { x.classList.toggle('on', x === b); }); },
    'cat-new': function () { catSheet(null); },
    'cat-edit': function (b) { catSheet(+b.dataset.i); },
    // backup
    'exp-copy': function () { copyText(JSON.stringify(S), 'Backup copied to clipboard'); },
    'exp-share': function () { shareText(JSON.stringify(S), 'Backup copied to clipboard'); },
    'imp-go': doImport,
    // settings
    'set-cur': function (b) { S.settings.currency = b.dataset.c; commit(); },
    'set-defstore': function (b) { S.settings.defaultStoreId = S.settings.defaultStoreId === b.dataset.id ? null : b.dataset.id; chk.storeId = defStore(); commit(); },
    'set-per': function (b) { S.settings.per[b.dataset.f] = b.dataset.k; commit(); },
    'set-th': function (b) {
      var k = b.dataset.k, t = S.settings.verdictThresholds, lim = k === 'stockUpPct' ? [5, 40] : [1, 15];
      t[k] = Math.max(lim[0], Math.min(lim[1], t[k] + (+b.dataset.d)));
      if (t.fairPct >= t.stockUpPct) t.fairPct = t.stockUpPct - 1;
      commit();
    },
    'set-theme': function (b) { S.settings.theme = b.dataset.t; applyTheme(); commit(); }
  };
  function closeAllSheets() { while (sheets.length) closeSheet(); }

  document.addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-act]');
    if (chk.ac && !ev.target.closest('.ac-wrap')) { chk.ac = false; var box = $('#acBox'); if (box) box.innerHTML = ''; }
    if (!b || b.disabled) return;
    var f = ACT[b.dataset.act];
    if (f) { ev.preventDefault(); f(b, ev); }
  });
  document.addEventListener('input', function (ev) {
    var t = ev.target, k = t.dataset && t.dataset.in; if (!k) return;
    if (k === 'chk-name') {
      chk.q = t.value; chk.ac = true; clearChkErr('name');
      var m = S.products.find(function (p) { return p.name.toLowerCase() === chk.q.trim().toLowerCase(); });
      var was = chk.pid; chk.pid = m ? m.id : null;
      if (m && m.id !== was) { var st = stats(m.id); if (st && UNITS[chk.unit].f !== m.unitFamily) chk.unit = st.latestE.unit; else if (UNITS[chk.unit].f !== m.unitFamily) chk.unit = FAM_UNITS[m.unitFamily][0]; }
      updateCheckLive(true);
    }
    else if (k === 'chk-price') { chk.price = t.value; clearChkErr('price'); updateCheckLive(true); }
    else if (k === 'chk-size') { chk.size = t.value; clearChkErr('size'); updateCheckLive(true); }
    else if (k === 'chk-sale') { chk.onSale = t.checked; }
    else if (k === 'chk-cat') { chk.newCat = t.value; }
    else if (k === 'book-q') { book.q = t.value; var bl = $('#bookList'); if (bl) bl.innerHTML = bookListHTML(); }
    else if (k === 'pick-q') { var s = topSheet(); $('#pickList', s.el).innerHTML = s.state.rows(t.value); }
    else if (k === 'cmp') { cmp.opts[+t.dataset.i][t.dataset.k] = t.value; cmpUpdate(); }
    else if (k === 'cur') { var v = t.value.trim(); if (v) { S.settings.currency = v; save(); badges(); } }
  });
  document.addEventListener('change', function (ev) {
    var t = ev.target, k = t.dataset && t.dataset.in;
    if (k === 'chk-sale') chk.onSale = t.checked;
    else if (k === 'chk-cat') chk.newCat = t.value;
    else if (k === 'cmp') { cmp.opts[+t.dataset.i][t.dataset.k] = t.value; cmpUpdate(); }
    else if (k === 'cur') renderMore();
  });
  document.addEventListener('focusin', function (ev) {
    if (ev.target.id === 'chkName' && S.products.length) { chk.ac = true; $('#acBox').innerHTML = acHTML(); }
  });
  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Enter' && ev.target.closest && ev.target.closest('#view-check') && ev.target.tagName === 'INPUT') {
      if (ev.target.id === 'chkName') { var first = $('#acList .ac-item'); if (first && chk.q.trim()) first.click(); else $('#chkPrice').focus(); }
      else if (ev.target.id === 'chkPrice') $('#chkSize').focus();
      else ev.target.blur();
      ev.preventDefault();
    }
  });

  window.onAndroidBack = function () {
    if (sheets.length) { closeSheet(); return true; }
    if (panels.length) { closePanel(); return true; }
    if (chk.ac) { chk.ac = false; var box = $('#acBox'); if (box) box.innerHTML = ''; return true; }
    if (tab !== 'check') { switchTab('check'); return true; }
    return false;
  };

  /* ================= Init ================= */
  $$('[data-ic]').forEach(function (el) { el.innerHTML = ic(el.dataset.ic); });
  recomputeShrink();
  applyTheme();
  switchTab('check');
  badges();

  // test hook (harmless in production)
  window.__shelfwise = { get state() { return S; } };
})();
