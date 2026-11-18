// Phase C check: the desktop bridge (src/desk.js) with a fake Tauri backend (files kept in sessionStorage).
// gunzip -c tools/snap/pbl16-commish-s10.json.gz > tools/_c16.json, then: node tools/browser-desk.js [PAGE]
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'), PAGE = process.argv[2] || 'index.html', BASE = 'http://pbl.test/';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
let fails = 0; const ok = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x !== undefined ? '  [' + JSON.stringify(x) + ']' : '')); if (!c) fails++; };
const ev = (pg, js) => pg.evaluate(js0 => { const L = window.PBL.L; return eval(js0); }, js), wait = (pg, ms) => pg.waitForTimeout(ms);
const FAKE = () => {   // a tiny stand-in for the Rust commands in desktop/src-tauri/src/lib.rs
  const key = n => 'fake-file:' + n, b64 = u => { let s = ''; for (const c of u) s += String.fromCharCode(c); return btoa(s); }, unb = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
  window.__fakeCalls = [];
  window.__TAURI__ = { core: { invoke: async (cmd, a, o) => { window.__fakeCalls.push(cmd);
    if (cmd === 'save_file' || cmd === 'export_file') { const n = o.headers['x-name']; if (cmd === 'export_file') (window.__exp = window.__exp || {})[n] = a.length; else sessionStorage.setItem(key(n), b64(a)); return cmd === 'export_file' ? '/Documents/Pacific Basketball League/exports/' + n : null; }
    if (cmd === 'read_file') { const v = sessionStorage.getItem(key(a.name)); return (v ? unb(v) : new Uint8Array()).buffer; }
    if (cmd === 'delete_file') { sessionStorage.removeItem(key(a.name)); return null; }
    if (cmd === 'saves_folder') return '/Documents/Pacific Basketball League';
    if (cmd === 'plugin:opener|open_path') return null;
    throw new Error('unknown ' + cmd); } } };
};
(async () => {
  const b = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await b.newContext({ viewport: { width: 1300, height: 860 } });
  await ctx.addInitScript(FAKE);
  await ctx.route(BASE + '**', r => { const f = path.join(ROOT, decodeURIComponent(new URL(r.request().url()).pathname)); if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) return r.fulfill({ status: 404, body: '' }); r.fulfill({ status: 200, body: fs.readFileSync(f), headers: { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' } }); });
  const pg = await ctx.newPage(), errs = []; pg.on('pageerror', e => errs.push(String(e)));
  await pg.goto(BASE + PAGE); await wait(pg, 1500);
  ok('desktop bridge is on', await ev(pg, '!!window.DESK'));
  ok('no service worker in the desktop app', await ev(pg, '(async()=>!(await navigator.serviceWorker?.getRegistration?.()))()'));
  // load a league the normal way, then save
  await pg.evaluate(async f => { const txt = await (await fetch(f)).text(); const db = await new Promise((res, rej) => { const r = indexedDB.open('pbl-league', 1); r.onupgradeneeded = () => r.result.createObjectStore('s'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
    const put = (k, v) => new Promise((res, rej) => { const tx = db.transaction('s', 'readwrite'); tx.objectStore('s').put(v, k); tx.oncomplete = res; tx.onerror = () => rej(tx.error); });
    await put('league:slot-dk', txt); await put('slots', JSON.stringify([{ id: 'slot-dk', name: 'dk', mode: 'commish', season: 11, phase: 'regular', updated: 1 }])); await put('current', 'slot-dk'); localStorage.setItem('pbl-tour', 'done'); }, '/tools/_c16.json');
  await pg.reload(); await wait(pg, 4500); await ev(pg, "document.querySelector('#modal').innerHTML=''");
  await ev(pg, "PBL.L.saveName='Desk test'"); await ev(pg, '(async()=>{await PBL.saveNow();})()'); await wait(pg, 300);
  ok('save also written as a file', await ev(pg, "!!sessionStorage.getItem('fake-file:slot-dk.pbl') && !!sessionStorage.getItem('fake-file:slots.json')"));
  ok('file is the gzip league', await ev(pg, "(async()=>JSON.parse(await DESK.readText('slot-dk.pbl')).teams.length===16)()"));
  // wipe the app's own storage: the league comes back from the file
  await pg.evaluate(async () => { await new Promise(res => { const r = indexedDB.deleteDatabase('pbl-league'); r.onsuccess = r.onerror = r.onblocked = () => res(); }); });
  await pg.reload(); await wait(pg, 4500);
  ok('league restored from the save file after app storage was wiped', await ev(pg, "!!PBL.L && PBL.L.saveName==='Desk test' && PBL.L.teams.length===16"));
  await ev(pg, "document.querySelector('#modal').innerHTML=''");
  // Saves popup + export
  await ev(pg, "document.getElementById('b-menu').click()"); await wait(pg, 600);
  ok('Saves popup shows the save folder', await ev(pg, "/Pacific Basketball League/.test(document.querySelector('#modal').textContent) && !!document.querySelector('#dk-open')"));
  await ev(pg, "document.querySelector('#dk-open').click()"); await wait(pg, 300);
  ok('Open the folder calls the app', await ev(pg, "window.__fakeCalls.includes('plugin:opener|open_path')"));
  await ev(pg, "document.querySelector('#x-exp').click()"); await wait(pg, 1500);
  ok('Export writes a file to the exports folder', await ev(pg, "Object.values(window.__exp||{}).some(n=>n>100000) && /Export saved/.test(document.querySelector('#x-msg').textContent)"), await ev(pg, "document.querySelector('#x-msg')?.textContent"));
  ok('no Install-as-app section in settings', await ev(pg, "(()=>{document.getElementById('b-settings').click();const t=document.getElementById('fx-modal').textContent;return !/Install as an app/.test(t)})()"));
  ok('no page errors', !errs.length, errs.slice(0, 3));
  await b.close(); console.log(fails ? fails + ' FAILED' : 'ALL PASS'); process.exit(fails ? 1 : 0);
})();
