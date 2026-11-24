// Roster fixes check (Nov 23 2026): node tools/hwd-roster-fixes.js
// 1) players with expired contracts can't be traded in the offseason; 2) scouting assignments last one season.
const fs = require('fs');
let fails = 0; const ok = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x !== undefined ? '  [' + JSON.stringify(x) + ']' : '')); if (!c) fails++; };
const o = require('./snap.js')('src', 7, 'tools/snap/nba-team-s10.json.gz');
const r = JSON.parse(o.run(`(()=>{const L=SL;const out={};
const step=()=>{switch(L.phase){case 'regular':simDay(L);break;case 'regular-done':startPlayoffs(L);break;case 'playoffs':simPlayoffDay(L);break;case 'season-done':startOffseason(L);break;case 'off-review':runLottery(L);break;case 'off-lottery':startDraft(L);break;case 'off-draft':aiDraftPick(L);break;case 'off-resign':case 'off-fa':return false;default:return false}return true};
out.userStart=L.user; out.season0=L.season; out.mode=L.mode;
// scouting: a regular-season assignment set now
setAssign(L, L.user, (L.teams[L.user].scoutAssign||[]).length, {k:'pos', v:1});
out.regAssign = JSON.parse(JSON.stringify(L.teams[L.user].scoutAssign));
let n=0; while(L.phase!=='off-review' && n++<5000) { if(!step()) break; }
out.phase1 = L.phase;
// expired players: contract ran out with season L.season
const exp = Object.values(L.players).filter(p => p.team!=null && p.contract && p.contract.exp <= L.season && !p.retired);
out.expCount = exp.length;
const p = exp.find(x => x.team !== L.user);
out.expName = p ? p.name : null;
if (p) {
  out.restricted = tradeRestricted(L, p);
  const other = L.teams.find(t => t.id !== p.team && t.id !== L.user);
  out.msg = tradeCheck(L, p.team, other.id, {players:[p.id],picks:[],cash:0,swaps:[]}, {players:[],picks:[],cash:0,swaps:[]});
}
// offseason assignment, set in the offseason (carries into next season)
L.phase = 'off-ready'; L.day = 0;
setAssign(L, L.user, (L.teams[L.user].scoutAssign||[]).length, {k:'pos', v:2});
out.offAssign = JSON.parse(JSON.stringify(L.teams[L.user].scoutAssign));
startNewSeason(L);
out.afterRollover = JSON.parse(JSON.stringify(L.teams[L.user].scoutAssign));
out.season1 = L.season;
// a regular-season tag and a trade check in the new season: expired rule must not apply in-season
const pr = Object.values(L.players).find(x => x.team!=null && x.contract && x.contract.exp <= L.season);
out.inSeasonRestricted = pr ? tradeRestricted(L, pr) : null;
return JSON.stringify(out);})()`));
console.log(JSON.stringify(r, null, 1).slice(0, 1200));
ok('league reached off-review', r.phase1 === 'off-review', r.phase1);
ok('expired player found in offseason', r.expCount > 0 && !!r.expName, r.expCount);
if (r.expName) { ok('expired player is restricted from trade', r.restricted === true); ok('trade with expired player is refused', /expired/.test(r.msg || ''), r.msg); }
ok('regular-season assignment set', r.regAssign.length === 1);
ok('offseason assignment set', r.offAssign.length === 2 || r.offAssign.length === 1, r.offAssign.length);
ok('new season: regular-season assignment reset', !r.afterRollover.some(a => a.v === 1 && a.d !== 1e6), r.afterRollover);
ok('new season: offseason assignment carried over', r.afterRollover.some(a => a.v === 2), r.afterRollover);
ok('in-season: expired rule not applied', r.inSeasonRestricted !== true, r.inSeasonRestricted);
console.log(fails ? fails + ' FAILED' : 'ALL PASS');
process.exit(fails ? 1 : 0);
