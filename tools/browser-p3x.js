// Phase 3 part 2 checks (called by browser-p3.js): save / share / import, team link, stories + popup art, draft night show + pick clock.
const DRAFT = 'tools/_draft.json';   // make it with: node tools/_mkdraft.js (one season from the franchise snap, stopped at the draft)
module.exports = async function (pg, T, click, W, touch, load, ok, ev, wait, shot) {
  // --- saves popup
  await click('#b-menu'); await wait(pg, 600);
  ok(T + 'Saves: small file / share / team link buttons', await ev(pg, "!!document.querySelector('#x-p3exp')&&!!document.querySelector('#x-p3share')&&!!document.querySelector('#x-p3team')"));
  const rt = await pg.evaluate(async () => { const x = await P3.leagueBlob(); const f = new File([x.blob], x.name); const t = await P3.readLeagueFile(f); const o = JSON.parse(t); return { name: x.name, small: x.blob.size, raw: x.raw, same: o.season === PBL.L.season && Object.keys(o.players).length === Object.keys(PBL.L.players).length }; });
  ok(T + 'packed league file is much smaller', rt.small < rt.raw / 4, rt);
  ok(T + 'packed file reads back to the same league', rt.same && /\.pbl\.gz$/.test(rt.name), rt.name);
  const plain = await pg.evaluate(async () => { const t = await P3.readLeagueFile(new File(['{"a":1}'], 'x.json')); return t; });
  ok(T + 'plain .json still imports', plain === '{"a":1}');
  await pg.evaluate(() => { window.__dl = 0; const o = HTMLAnchorElement.prototype.click; HTMLAnchorElement.prototype.click = function () { if (this.download) { window.__dl++; window.__dlName = this.download; return; } return o.call(this); }; });
  await click('#x-p3exp'); await wait(pg, 2500);
  ok(T + 'Save league file (small) downloads a .pbl.gz', await ev(pg, "window.__dl===1&&/\\.pbl\\.gz$/.test(window.__dlName)&&/Saved/.test(document.querySelector('#x-msg').textContent)"), await ev(pg, "document.querySelector('#x-msg').textContent"));
  await ev(pg, "document.querySelector('#modal').innerHTML=''");
  const tl = await ev(pg, "P3.teamLink(L.user)");
  ok(T + 'team link made', /#team=[A-Za-z0-9_-]{100,}$/.test(tl) && tl.length < 4000, tl.length);
  await ev(pg, `location.hash='${'#team=' + tl.split('#team=')[1]}'`); await wait(pg, 900);
  ok(T + 'team link opens a read-only team sheet', await ev(pg, "!!document.querySelector('#modal .p3-tsheet table')&&document.querySelectorAll('#modal .p3-tsheet tbody tr').length>=10"));
  ok(T + 'team sheet fits the screen', await ev(pg, "(()=>{const r=document.querySelector('#modal .dialog').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+1})()"));
  await ev(pg, "document.querySelector('#modal').innerHTML=''");
  // --- stories
  await ev(pg, "(()=>{FX.set('stories',true);FX.set('skip',false);const u=L.teams[L.user];const p=L.players[u.roster[0]];L.logN=(L.logN||0)+1;L.log.unshift({n:L.logN,season:L.season,day:L.day,phase:L.phase,text:p.name+' ('+u.abbr+') hurt: Torn ACL, out 60 games',tid:u.id,cat:'inj'});L.logN++;L.log.unshift({n:L.logN,season:L.season,day:L.day,phase:L.phase,text:'Hot streak: the '+u.name+' have won 7 straight',tid:u.id,cat:'feature',k:'streak'});__pbl.render();})()"); await wait(pg, 700);
  ok(T + 'story popup for your team (injury first)', await ev(pg, "!!document.querySelector('#p3-story .p3-art')&&/Major injury/i.test(document.querySelector('#p3-story .p3-stk').textContent)"), await ev(pg, "document.querySelector('#p3-story')?.textContent.slice(0,80)"));
  ok(T + 'story popup fits the screen', await ev(pg, "(()=>{const r=document.querySelector('#p3-story').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1})()"));
  await shot(pg, 'story-' + W);
  await click('#p3-stx'); await wait(pg, 400);
  ok(T + 'next story (hot streak)', await ev(pg, "/Hot streak/i.test(document.querySelector('#p3-story .p3-stk').textContent)"));
  await click('#p3-stall'); await wait(pg, 1200);
  ok(T + 'Stories page with illustrated cards', await ev(pg, "ui.view==='stories'&&document.querySelectorAll('.p3-stcard .p3-art').length>=2"), await ev(pg, "document.querySelectorAll('.p3-stcard').length"));
  await click('[data-p3stf="all"]'); await wait(pg, 600);
  ok(T + 'Stories: whole league tab', await ev(pg, "document.querySelectorAll('.p3-stcard').length>=4"), await ev(pg, "document.querySelectorAll('.p3-stcard').length"));
  ok(T + 'no side-scroll on Stories', await ev(pg, 'document.documentElement.scrollWidth<=innerWidth+1'), await ev(pg, 'document.documentElement.scrollWidth'));
  await shot(pg, 'stories-' + W);
  await ev(pg, "(()=>{PBL.dialog('<h2>Press conference</h2><p>Q</p>');P3.dialogArt();})()"); await wait(pg, 200);
  ok(T + 'press conference popup gets art', await ev(pg, "!!document.querySelector('#modal .p3-dlgart svg')"));
  await ev(pg, "document.querySelector('#modal').innerHTML=''");
  // --- draft night (separate save at the start of the draft)
  if (!require('fs').existsSync(DRAFT)) { ok(T + 'draft save present (node tools/_mkdraft.js)', false); return; }
  const D = await load(W, touch, DRAFT); const dp = D.pg, dclick = s => touch ? dp.tap(s) : dp.click(s);
  await ev(dp, "FX.set('draftShow',true);FX.set('skip',false);location.hash='#draft'"); await wait(dp, 1500);
  const mine = await ev(dp, "(()=>{const s=L.draftOrder[L.draftIdx];return L.user!=null&&s.owner===L.user})()");
  if (mine) { await ev(dp, "document.querySelector('#simctl [data-sim=\"autopick\"]').click()"); await wait(dp, 400); }
  else { await dclick('#simctl [data-sim="pick1"]'); await wait(dp, 400); }
  ok(T + 'draft pick reveal opens', await ev(dp, "!!document.querySelector('#p3-draft .p3-dcard svg')"));
  await wait(dp, 1900);
  ok(T + 'pick revealed with a crowd reaction', await ev(dp, "(()=>{const e=document.querySelector('#p3-draft');return !!e&&e.classList.contains('rev')&&/r-(steal|reach|ok|mine)/.test(e.className)})()"));
  ok(T + 'reveal fits the screen', await ev(dp, "(()=>{const r=document.querySelector('#p3-draft .p3-dpod').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+1})()"));
  await shot(dp, 'draft-' + W);
  ok(T + 'game-day music during the draft show', await ev(dp, "FX.musicMood==='game'||FX.settings.music===false||FX.musicMood===null"), await ev(dp, 'FX.musicMood'));
  await dclick('#p3-dnext'); await wait(dp, 300);
  ok(T + 'reveal closes', await ev(dp, "!document.getElementById('p3-draft')"));
  // sim to my pick: clock
  const hasPick = await ev(dp, "L.draftOrder.some((o,i)=>i>L.draftIdx&&o.owner===L.user)");
  if (hasPick) {
    await ev(dp, "document.querySelector('#simctl [data-sim=\"tomypick\"]')?.click()"); await wait(dp, 3000);
    await ev(dp, "(()=>{const s=document.querySelector('#p3-dskip');if(s)s.click();const n=document.querySelector('#p3-dnext');if(n)n.click();})()"); await wait(dp, 500);
    await ev(dp, "document.querySelector('#modal').innerHTML='';location.hash='#draft'"); await wait(dp, 1200);
    ok(T + 'pick clock when you are on the clock', await ev(dp, "!!document.querySelector('#p3-clock .p3-clk')&&/:/.test(document.querySelector('#p3-clock .p3-clk').textContent)"), await ev(dp, "[L.draftIdx, L.draftOrder[L.draftIdx]?.owner, L.user]"));
    await shot(dp, 'clock-' + W);
    const i0 = await ev(dp, 'L.draftIdx');
    await ev(dp, "FX.set('draftTimer',true);P3._clock.left=1"); await wait(dp, 2500);
    ok(T + 'clock at 0:00 auto-picks (setting on)', await ev(dp, `L.draftIdx>${i0}||L.phase!=='off-draft'`), await ev(dp, 'L.draftIdx'));
    await ev(dp, "FX.set('draftTimer',false)");
  }
  ok(T + 'no page errors in the draft', !D.errs.length, D.errs.slice(0, 3));
  await D.b.close();
};
