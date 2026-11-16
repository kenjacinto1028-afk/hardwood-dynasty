// v34 A2: MVP weight + voter-fatigue sets scored on the same seasons. Each set keeps its own MVP history (fatigue follows that set's winners).
// SNAP=tools/snap/nba-commish-s10.json.gz SEED=21 node tools/t34-awgrid.js 10   -> one "G" line per season, then "SUM" per set
const N = +process.argv[2] || 10;
const { run } = require('./snap.js')(process.env.SRC || 'src', +process.env.SEED || 21, process.env.SNAP || 'tools/snap/nba-commish-s10.json.gz');
const W33D = { gs: .30, ws: .40, ws48: .10, per: .05, bpm: .15 }, W30 = { gs: .35, ws: .30, ws48: .10, per: .05, bpm: .20 };
const SETS = {
  v33d: { mvp: W33D, mvpTeam: .5, fat1: 0, fat2: 0, fatOld: 0 },
  A: { mvp: W30, mvpTeam: .5, fat1: 0, fat2: 0, fatOld: 0 },
  B: { mvp: W30, mvpTeam: .5, fat1: .03, fat2: .06, fatOld: 0 },
  C: { mvp: W30, mvpTeam: .5, fat1: .05, fat2: .10, fatOld: .02 },
  D: { mvp: W30, mvpTeam: .5, fat1: .07, fat2: .14, fatOld: .03 },
  E: { mvp: W30, mvpTeam: .5, fat1: .10, fat2: .20, fatOld: .04 },
  F: { mvp: { gs: .40, ws: .30, ws48: .05, per: .05, bpm: .20 }, mvpTeam: .5, fat1: .05, fat2: .10, fatOld: .02 },
  G: { mvp: W33D, mvpTeam: .5, fat1: .05, fat2: .10, fatOld: .02 },
  H: { mvp: { gs: .30, ws: .30, ws48: .10, per: .05, bpm: .25 }, mvpTeam: .5, fat1: .05, fat2: .12, fatOld: .02 } };
run(`var GR=[];var SETS=${JSON.stringify(SETS)};var SH={};for(const k in SETS)SH[k]={};var CUR=null;
(function(){const ms=mvpStreak,mr=mvpRecent;
 mvpStreak=function(L,pid,S){if(!CUR)return ms(L,pid,S);let k=0;for(let s=S-1;SH[CUR][s]===pid;s--)k++;return k;};
 mvpRecent=function(L,pid,S){if(!CUR)return mr(L,pid,S);return [S-2,S-3].some(s=>SH[CUR][s]===pid);};
 const ca=computeAwards;computeAwards=function(L){const q=awardQual(L);const keep=JSON.parse(JSON.stringify(AW_ADV));const row={s:L.season};
 const rank=p=>q.filter(x=>(x.stats.rs.ws||0)>(p.stats.rs.ws||0)).length+1;
 for(const k in SETS){CUR=k;Object.assign(AW_ADV,JSON.parse(JSON.stringify(SETS[k])));const l=awardLadder(L,'mvp',1)[0];const p=l?L.players[l.pid]:null;row[k]=p?[p.name,rank(p)]:null;SH[k][L.season]=p?p.id:null;}
 CUR=null;Object.assign(AW_ADV,keep);GR.push(row);return ca.apply(this,arguments);};})();`);
const rows = [];
for (let y = 1; y <= N; y++) { const r = run(`(function(){const L=SL;let g=0;while(L.phase==='regular'&&g++<400)simDay(L);processPending(L);startPlayoffs(L);g=0;while(L.phase==='playoffs'&&g++<400)simPlayoffDay(L);startOffseason(L);runLottery(L);startDraft(L);g=0;while(L.phase==='off-draft'&&g++<200)aiDraftPick(L);if(L.phase==='off-resign')startFA(L);g=0;while(L.phase==='off-fa'&&g++<60)faDay(L);processPending(L);startNewSeason(L);return JSON.stringify(GR.shift()||null);})()`); console.log('G ' + r); rows.push(JSON.parse(r)); }
for (const k of Object.keys(SETS)) { const w = rows.map(r => r && r[k]).filter(Boolean), c = {}; w.forEach(x => c[x[0]] = (c[x[0]] || 0) + 1);
  console.log('SUM ' + JSON.stringify({ set: k, n: w.length, wsLeader: w.filter(x => x[1] === 1).length, top3: w.filter(x => x[1] <= 3).length, winners: Object.keys(c).length, most: Math.max(...Object.values(c)) })); }
