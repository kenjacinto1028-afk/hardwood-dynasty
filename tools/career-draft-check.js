// Draft projection check for My Career (PR #44 follow-up, Nov 23 2026): node tools/career-draft-check.js [seeds]
// Runs careers to the draft (fresh, and "old save" = the new fields stripped + JSON round trip mid-season) and compares
// mock rank, what his stats support (cap) and the real pick.
const fs = require('fs');
const seeds = (process.argv[2] || '1,2,3,4').split(',').map(Number); let fails = 0;
const rows = [];
for (const mode of ['fresh', 'oldsave']) for (const seed of seeds) {
  const o = require('./load.js')('src', seed * 13 + 1);
  for (const f of ['career-text.js', 'career.js', 'career-biz.js']) o.run(fs.readFileSync('src/' + f, 'utf8'));
  const story = ['blue', 'street', 'grinder', 'late'][seed % 4];
  o.run(`var L=newLeague({mode:'career',size:16,games:58});carCreate(L,{first:'Dr',last:'Aft${seed}',pos:${seed % 5},hgt:76,style:'',story:'${story}',path:'NCHF',team:null,num:7});
  var step=()=>{switch(L.phase){case 'regular':simDay(L);break;case 'regular-done':startPlayoffs(L);break;case 'playoffs':simPlayoffDay(L);break;case 'season-done':startOffseason(L);break;case 'off-review':runLottery(L);break;case 'off-lottery':startDraft(L);break;case 'off-draft':aiDraftPick(L);break;}};`);
  if (mode === 'oldsave') o.run(`{let n=0;while(L.phase==='regular'&&L.day<Math.floor(L.schedule.length*0.55)&&n++<500)simDay(L);
    const C=L.career;delete C.adjKey;delete C.scoutAdj;delete C.stock;delete C.biz;const p=carP(L);L.__restore=1;
    L=JSON.parse(JSON.stringify(L));}`);
  const r = JSON.parse(o.run(`JSON.stringify((()=>{const out={};let g=0;
    while(L.phase==='regular'||L.phase==='regular-done'||L.phase==='playoffs'||L.phase==='season-done'){step();if(g++>20000)break;}
    const p=carP(L);let st=carStock(L,p);out.mockEnd=st&&st.c;out.cap=st&&st.cap;out.scoutAdj=L.career.scoutAdj||0;out.ovr=p.ovr;out.scout=p.scout;
    carStockLog(L,p);st=carStock(L,p);out.mockAfterLog=st&&st.c;
    while(L.phase!=='off-lottery'&&g++<30000)step();carStockLog(L,p);st=carStock(L,p);out.mockLottery=st&&st.c;
    startDraft(L);st=carStock(L,p);out.mockDraft=st&&st.c;
    let n=0;while(L.phase==='off-draft'&&!p.draft&&n++<400)aiDraftPick(L);
    out.pick=p.draft?(L.draftOrder?L.draftOrder.findIndex(x=>x.pid===p.id)+1:p.draft.no):null;out.teams=L.teams.length;
    const sl=carSeasonLine(L);out.val=sl?Math.round(carVal(sl)*10)/10:null;out.gp=sl&&sl.gp;return out;})())`));
  rows.push(Object.assign({ mode, seed, story }, r));
}
console.table(rows.map(r => ({ mode: r.mode, seed: r.seed, story: r.story, ovr: r.ovr, val: r.val, cap: r.cap, mockEnd: r.mockEnd, mockDraft: r.mockDraft, pick: r.pick, adj: Math.round(r.scoutAdj * 10) / 10 })));
for (const r of rows) {
  const okPick = (r.pick == null && r.mockDraft > r.teams * 2 - 4) || r.pick != null && (r.cap == null || r.pick >= Math.min(r.cap, 60) * 0.5 || r.pick >= r.mockDraft - 6);
  const okMock = r.mockDraft == null || (r.pick == null && r.mockDraft > r.teams * 2 - 4) || r.pick == null || Math.abs(r.pick - r.mockDraft) <= 12;
  console.log((okPick ? 'PASS' : 'FAIL') + ' ' + r.mode + ' seed ' + r.seed + ': real pick ' + r.pick + ' vs cap ' + r.cap + ', mock at draft ' + r.mockDraft); if (!okPick) fails++;
  console.log((okMock ? 'PASS' : 'FAIL') + ' ' + r.mode + ' seed ' + r.seed + ': real draft follows the mock (' + r.pick + ' vs ' + r.mockDraft + ')'); if (!okMock) fails++;
}
console.log(fails ? 'FAILED ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
