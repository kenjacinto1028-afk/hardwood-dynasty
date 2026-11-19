// My Career face builder: pick a look on New league, check hub header, edit look later.
// node tools/browser-face.js [WIDTH]   (SHOTS=dir saves screenshots)
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'), W = +(process.argv[2] || 1300), BASE = 'http://pbl.test/', SHOTS = process.env.SHOTS;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
let fails = 0; const ok = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x !== undefined ? '  [' + JSON.stringify(x) + ']' : '')); if (!c) fails++; };
(async () => {
  const b = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await b.newContext({ viewport: { width: W, height: 900 } });
  await ctx.route(BASE + '**', r => { const f = path.join(ROOT, decodeURIComponent(new URL(r.request().url()).pathname)); if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) return r.fulfill({ status: 404, body: '' }); r.fulfill({ status: 200, contentType: MIME[path.extname(f)] || 'application/octet-stream', body: fs.readFileSync(f) }); });
  const pg = await ctx.newPage(), errs = []; pg.on('pageerror', e => errs.push(String(e))); pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await pg.goto(BASE + 'index.html'); await pg.evaluate(() => { try { localStorage.setItem('pbl-tour', 'done'); } catch (e) { } }); await pg.reload(); await pg.waitForTimeout(2500);
  const shot = async n => { if (SHOTS) await pg.screenshot({ path: path.join(SHOTS, n + '.png') }); };
  await pg.click('[data-setsize="16"]'); await pg.click('[data-setgames="58"]'); await pg.click('[data-setmode="career"]'); await pg.waitForTimeout(300);
  ok('builder shows with a face', await pg.evaluate("!!document.querySelector('.cf .face svg') && document.querySelectorAll('.cf-row').length === 10"));
  const before = await pg.evaluate("PBL.ui.car.face.hair + PBL.ui.car.face.skin");
  await pg.click('[data-cf="hair|1"]'); await pg.click('[data-cfs="skin|#8d5a3c"]'); await pg.click('[data-cf="facialHair|1"]'); await pg.waitForTimeout(200);
  const f = await pg.evaluate("PBL.ui.car.face"); ok('picks change the look', f.skin === '#8d5a3c' && f.hair + f.skin !== before, f);
  await shot('face-1-setup');
  await pg.click('#cf-rand'); await pg.click('[data-cfs="skin|#e0b48c"]'); await pg.waitForTimeout(200);
  const want = await pg.evaluate("JSON.stringify(PBL.ui.car.face)");
  await pg.click('#create'); await pg.waitForTimeout(3000); await pg.evaluate("document.querySelector('#modal').innerHTML=''");
  ok('look saved on the player', await pg.evaluate("JSON.stringify(PBL.L.career.face)") === want);
  const box = await pg.evaluate("(() => { const f = document.querySelector('.car-id .face'), s = f.querySelector('svg'); const a = f.getBoundingClientRect(), b = s.getBoundingClientRect(); return [a.width, a.height, b.width, b.height].map(Math.round); })()");
  ok('hub avatar fills its frame', box[0] === box[2] && box[3] >= box[1], box);
  await shot('face-2-hub');
  await pg.click('#car-look'); await pg.waitForTimeout(300); await pg.click('[data-cfs="hairColor|#d9b46a"]'); await pg.click('[data-cf="mouth|1"]'); await pg.waitForTimeout(200);
  await shot('face-3-edit'); await pg.click('#cf-save'); await pg.waitForTimeout(300);
  ok('edit saved', await pg.evaluate("PBL.L.career.face.hairColor") === '#d9b46a');
  ok('player page uses the same face', await pg.evaluate("(() => { const p = PBL.L.players[PBL.L.career.pid]; return PBL.portrait('p', p.id, p.nat, p.team) === PBL.faceCustom(PBL.L.career.face, '', p.team); })()"));
  ok('no page errors', errs.length === 0, errs.slice(0, 3));
  await b.close(); console.log(fails ? fails + ' FAILED' : 'ALL PASS'); process.exit(fails ? 1 : 0);
})();
