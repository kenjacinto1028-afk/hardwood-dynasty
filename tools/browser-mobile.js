// Mobile pass: every page and its sub tabs at phone widths (390, 360): side-scroll, things sticking out of the screen, tiny buttons.
// gunzip -c tools/snap/nba-team-s10.json.gz > tools/_t1.json, then:
//   node tools/browser-p3.js [PAGE] [SAVE]      (PAGE = index.html or pbl-single.html)
// No web server needed: the page is served from this folder through Playwright (page.route).
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'), PAGE = process.argv[2] || 'index.html', SAVE = process.argv[3] || 'tools/_t1.json', BASE = 'http://pbl.test/';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.gz': 'application/gzip' };
const res = [];
const ok = (n, c, x) => { const l = (c ? 'PASS ' : 'FAIL ') + n + (x !== undefined && x !== '' ? '  [' + JSON.stringify(x) + ']' : ''); res.push(l); console.error(l); };
const ev = (pg, js) => pg.evaluate(js0 => { const L = window.__pbl.L, ui = window.__pbl.ui; return eval(js0); }, js);
const wait = (pg, ms) => pg.waitForTimeout(ms);
const closeModals = pg => pg.evaluate(() => { document.querySelector('#modal').innerHTML = ''; const m = document.getElementById('fx-modal'); if (m) m.innerHTML = ''; });

async function load(W, touch, SAVE2) {
  const b = await chromium.launch({ args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const ctx = await b.newContext({ viewport: { width: W, height: 900 }, hasTouch: touch, isMobile: touch });
  await ctx.route(BASE + '**', r => { const f = path.join(ROOT, decodeURIComponent(new URL(r.request().url()).pathname)); if (!f.startsWith(ROOT) || !fs.existsSync(f)) return r.fulfill({ status: 404, body: '' }); r.fulfill({ status: 200, body: fs.readFileSync(f), contentType: MIME[path.extname(f)] || 'application/octet-stream' }); });
  const pg = await ctx.newPage(), errs = []; pg.on('pageerror', e => errs.push(String(e) + ' @ ' + String(e.stack || '').split('\n').slice(1, 3).join(' | ')));
  await pg.goto(BASE + PAGE); await wait(pg, 1500);
  await pg.evaluate(async f => {
    const txt = await (await fetch(f)).text();
    const db = await new Promise((res, rej) => { const r = indexedDB.open('pbl-league', 1); r.onupgradeneeded = () => r.result.createObjectStore('s'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
    const put = (k, v) => new Promise((res, rej) => { const tx = db.transaction('s', 'readwrite'); tx.objectStore('s').put(v, k); tx.oncomplete = res; tx.onerror = () => rej(tx.error); });
    await put('league:slot-mob', txt); await put('slots', JSON.stringify([{ id: 'slot-mob', name: 'p3', mode: 'team', season: 11, phase: 'regular', updated: Date.now() }])); await put('current', 'slot-mob');
  }, '/' + (SAVE2 || SAVE));
  await pg.reload(); await wait(pg, 5000); await closeModals(pg);
  return { b, pg, errs };
}
// usage: node tools/browser-mobile.js [PAGE] [SAVE]   (SHOTS=1 saves a screenshot per page: tools/_mob-*.png)
const VIEWS = ['myteam', 'cards', 'coaches', 'standings', 'schedule', 'teams', 'stats', 'players', 'injuries', 'discipline', 'awards', 'pipeline', 'rmoves', 'trades', 'fa', 'draft', 'weekly', 'news', 'stories', 'feed', 'topplays', 'history', 'trophies', 'hofc', 'rules'];
// elements that stick out past the right edge and are not inside something that scrolls sideways
const AUDIT = `(()=>{const W=innerWidth,out=[],small=[];
 const scrollsX=el=>{for(let e=el.parentElement;e&&e!==document.body;e=e.parentElement){const cs=getComputedStyle(e);if((cs.overflowX==='auto'||cs.overflowX==='scroll'||cs.overflowX==='hidden'||cs.overflowX==='clip')&&e.clientWidth<e.scrollWidth+1)return true;}return false;};
 const name=el=>el.tagName.toLowerCase()+(el.id?'#'+el.id:'')+(typeof el.className==='string'&&el.className?'.'+el.className.trim().split(/\\s+/).slice(0,2).join('.'):'');
 for(const el of document.querySelectorAll('#main *, header *, .dialog *')){const r=el.getBoundingClientRect();if(!r.width||!r.height)continue;const cs=getComputedStyle(el);if(cs.position==='fixed')continue;
  if((r.right>W+1||r.left<-1)&&!scrollsX(el))out.push(name(el)+' '+Math.round(r.left)+'..'+Math.round(r.right));
  if((el.tagName==='BUTTON'||(el.tagName==='A'&&el.closest('nav')))&&r.height<28&&!el.closest('td')&&cs.visibility!=='hidden')small.push(name(el)+' '+Math.round(r.height));}
 return {sw:document.documentElement.scrollWidth,W,out:out.slice(0,6),nOut:out.length,small:small.slice(0,4),nSmall:small.length};})()`;
let tabsChecked = 0;
async function check(pg, T, label) {
  const a = await ev(pg, AUDIT); tabsChecked++;
  const good = a.sw <= a.W + 1 && a.nOut === 0;
  ok(T + label + ': fits the screen', good, good ? '' : a);
  if (a.nSmall) ok(T + label + ': tap targets 28px+', false, a.small);
  return a;
}
async function run(W, touch, SAVE2, views) {
  const { b, pg, errs } = await load(W, touch, SAVE2), T = `${W}px: `;
  await ev(pg, "FX.set('skip',true);FX.set('stories',false);FX.set('draftShow',false)");
  for (const v of views) {
    await ev(pg, `document.querySelector('#modal').innerHTML='';location.hash='#${v}'`); await wait(pg, 1300);
    await check(pg, T, '#' + v);
    if (process.env.SHOTS) await pg.screenshot({ path: `tools/_mob-${W}-${v}.png`, fullPage: true });
    // sub tabs inside the page (buttons that switch a tab in place)
    const n = await ev(pg, "document.querySelectorAll('#main .subtabs > button:not(.primary):not([disabled])').length");
    for (let i = 0; i < Math.min(n, 10); i++) {
      const lbl = await ev(pg, `(()=>{const b=[...document.querySelectorAll('#main .subtabs > button:not([disabled])')].filter(x=>!x.classList.contains('primary'))[${i}];if(!b)return null;const t=b.textContent.trim().slice(0,24);b.click();return t;})()`);
      if (!lbl) break; await wait(pg, 700);
      await check(pg, T, '#' + v + ' › ' + lbl);
    }
  }
  if (!SAVE2) {
    // a player page, a team page, a coach, a box score + live game, popups
    const pages = [["player", "L.teams[L.user].roster[0]"], ["team", "(L.user+1)%L.teams.length"], ["coach", "L.teams[L.user].coach.id"], ["game", "L.games.length?L.games[L.games.length-1].id:null"]];
    for (const [k, id] of pages) {
      const v = await ev(pg, id); if (v == null) continue;
      await ev(pg, `(()=>{const a=document.createElement('a');a.dataset.${k}=${JSON.stringify(String(v))};a.className='lk';document.querySelector('#main').appendChild(a);a.click();})()`); await wait(pg, 1500);
      await check(pg, T, k + ' page');
      if (process.env.SHOTS) await pg.screenshot({ path: `tools/_mob-${W}-p-${k}.png`, fullPage: true });
      const n = await ev(pg, "document.querySelectorAll('#main .subtabs > button:not(.primary):not([disabled])').length");
      for (let i = 0; i < Math.min(n, 8); i++) { const lbl = await ev(pg, `(()=>{const b=[...document.querySelectorAll('#main .subtabs > button:not([disabled])')].filter(x=>!x.classList.contains('primary'))[${i}];if(!b)return null;const t=b.textContent.trim().slice(0,24);b.click();return t;})()`); if (!lbl) break; await wait(pg, 700); await check(pg, T, k + ' page › ' + lbl); }
    }
    for (const [lbl, js] of [['Settings popup', "document.getElementById('b-settings').click()"], ['Saves popup', "document.getElementById('b-menu').click()"], ['Awards popup', "__pbl.awardsDialog && L.awards[10] ? (L.season--, __pbl.awardsDialog('mvp'), L.season++) : 0"], ['Recent popup', "document.getElementById('b-recent').click()"]]) {
      await ev(pg, "document.querySelector('#modal').innerHTML='';const m=document.getElementById('fx-modal');if(m)m.innerHTML=''"); await ev(pg, js); await wait(pg, 900);
      await check(pg, T, lbl);
      if (process.env.SHOTS) await pg.screenshot({ path: `tools/_mob-${W}-d-${lbl.split(' ')[0]}.png` });
    }
    // live game
    await ev(pg, "document.querySelector('#modal').innerHTML='';const m=document.getElementById('fx-modal');if(m)m.innerHTML='';location.hash='#myteam'"); await wait(pg, 1000);
    await ev(pg, "document.querySelector('#simctl [data-sim=\"live\"]')?.click()"); await wait(pg, 3500); await ev(pg, "document.querySelector('#modal').innerHTML=''");
    if (await ev(pg, "!!document.querySelector('#lv-board')")) { await check(pg, T, 'live game'); if (process.env.SHOTS) await pg.screenshot({ path: `tools/_mob-${W}-live.png`, fullPage: true }); }
  }
  ok(T + 'no page errors' + (SAVE2 ? ' (draft save)' : ''), !errs.length, errs.slice(0, 3));
  await b.close();
}
(async () => {
  const only = process.env.ONLY ? process.env.ONLY.split(',') : null, V = only || VIEWS;
  for (const W of (process.env.WIDTHS || '390,360').split(',').map(Number)) {
    await run(W, true, null, V);
    if (!only && require('fs').existsSync('tools/_draft.json')) await run(W, true, 'tools/_draft.json', ['draft', 'rmoves', 'myteam']);
  }
  const fails = res.filter(r => r.startsWith('FAIL'));
  console.log(fails.join('\n')); console.log(`${tabsChecked} screens checked · ${res.length - fails.length}/${res.length} passed`);
})();
