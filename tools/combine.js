// Draft combine check (Nov 20 2026): node tools/combine.js
// Sims a saved league to the draft lottery, checks combine data, mock moves, board effect and news, then runs the draft.
const fs = require('fs');
let fails = 0; const ok = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x !== undefined ? '  [' + JSON.stringify(x) + ']' : '')); if (!c) fails++; };
const o = require('./snap.js')('src', 7, 'tools/snap/nba-team-s10.json.gz'); o.run(fs.readFileSync('src/combine.js', 'utf8'));
const r = JSON.parse(o.run(`(()=>{const L=SL;const out={};
const step=()=>{switch(L.phase){case 'regular':simDay(L);break;case 'regular-done':startPlayoffs(L);break;case 'playoffs':simPlayoffDay(L);break;case 'season-done':startOffseason(L);break;case 'off-review':runLottery(L);break;case 'off-lottery':startDraft(L);break;case 'off-draft':aiDraftPick(L);break;default:return false}return true};
let n=0;while(L.phase!=='off-lottery'&&n++<5000)step();
const d=L.season,rec=(L.combine||{})[d],ps=L.classes[d].map(id=>L.players[id]).filter(Boolean);
out.rec=!!rec;out.n=ps.length;out.all=ps.every(p=>p.cmb&&p.cmb.s===d&&p.cmb.hb>60&&p.cmb.wing>60&&p.cmb.reach>p.cmb.hb);
const t=ps.filter(p=>!p.cmb.skip);out.tested=t.length;out.skip=ps.length-t.length;
out.ranges={mv:[Math.min(...t.map(p=>p.cmb.mv)),Math.max(...t.map(p=>p.cmb.mv))],lane:[Math.min(...t.map(p=>p.cmb.lane)),Math.max(...t.map(p=>p.cmb.lane))],spr:[Math.min(...t.map(p=>p.cmb.spr)),Math.max(...t.map(p=>p.cmb.spr))],bench:[Math.min(...t.map(p=>p.cmb.bench)),Math.max(...t.map(p=>p.cmb.bench))],bf:[Math.min(...ps.map(p=>p.cmb.bf)),Math.max(...ps.map(p=>p.cmb.bf))],b:[Math.min(...ps.map(p=>p.cmb.b)),Math.max(...ps.map(p=>p.cmb.b))]};
const cor=(xs,ys)=>{const m=a=>a.reduce((s,v)=>s+v,0)/a.length,mx=m(xs),my=m(ys);let a=0,b=0,c=0;xs.forEach((x,i)=>{a+=(x-mx)*(ys[i]-my);b+=(x-mx)**2;c+=(ys[i]-my)**2});return a/Math.sqrt(b*c)};
out.corVrt=+cor(t.map(p=>p.vrt),t.map(p=>p.cmb.sv)).toFixed(2);out.corSpd=+cor(t.map(p=>p.spd),t.map(p=>-p.cmb.spr)).toFixed(2);
out.moved=ps.filter(p=>rec.pre[p.id]!==rec.post[p.id]).length;out.maxMove=Math.max(...ps.map(p=>Math.abs(rec.pre[p.id]-rec.post[p.id])));
out.news=L.log.filter(x=>/[Cc]ombine/.test(x.t||x.text||'')).length;
const again=runCombine(L,d);out.idem=again===rec;
step();out.draftPhase=L.phase;let m=0;while(L.phase==='off-draft'&&m++<200)step();out.after=L.phase;out.drafted=ps.filter(p=>p.draft&&p.draft.s===d).length;
return JSON.stringify(out);})()`));
console.log(JSON.stringify(r));
ok('combine ran after lottery', r.rec && r.all, r.n);
ok('most tested, some measured only', r.tested > r.n * 0.8 && r.tested < r.n, [r.tested, r.skip]);
ok('drill ranges realistic', r.ranges.mv[0] >= 24 && r.ranges.mv[1] <= 46 && r.ranges.lane[0] >= 10.2 && r.ranges.spr[1] <= 3.65, r.ranges);
ok('drills follow ratings', r.corVrt > 0.5 && r.corSpd > 0.6, [r.corVrt, r.corSpd]);
ok('mocks moved, not wildly', r.moved > 5 && r.maxMove <= 25, [r.moved, r.maxMove]);
ok('combine news', r.news >= 3, r.news);
ok('runs once per class', r.idem);
ok('draft still runs', r.after !== 'off-draft' && r.drafted > 20, [r.after, r.drafted]);
console.log(fails ? fails + ' FAIL' : 'ALL PASS');
