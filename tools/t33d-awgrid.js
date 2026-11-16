// v33d: MVP weight sets scored on the same seasons (WS rank of each set's winner): SNAP=... node tools/t33d-awgrid.js 10   (sets A-H inside)
// score each season's MVP under several weight sets (same seasons): WS rank of each set's winner
const N=+process.argv[2]||10;
const {run}=require('./snap.js')(process.env.SRC||'src',21,process.env.SNAP||'tools/snap/nba-commish-s10.json.gz');
run(`var GR=[];var SETS={
 A:{mvp:{gs:.30,ws:.35,ws48:.12,per:.08,bpm:.15},mvpTeam:.8},
 B:{mvp:{gs:.30,ws:.35,ws48:.12,per:.08,bpm:.15},mvpTeam:.5},
 C:{mvp:{gs:.25,ws:.45,ws48:.10,per:.05,bpm:.15},mvpTeam:.6},
 D:{mvp:{gs:.25,ws:.45,ws48:.10,per:.05,bpm:.15},mvpTeam:.4},
 E:{mvp:{gs:.20,ws:.55,ws48:.10,per:.05,bpm:.10},mvpTeam:.5},
 F:{mvp:{gs:.30,ws:.40,ws48:.10,per:.05,bpm:.15},mvpTeam:.5},
 G:{mvp:{gs:.30,ws:.45,ws48:.10,per:.05,bpm:.10},mvpTeam:.6},
 H:{mvp:{gs:.25,ws:.50,ws48:.10,per:.05,bpm:.10},mvpTeam:.7}};
(function(){const ca=computeAwards;computeAwards=function(L){const q=awardQual(L);const keep=JSON.parse(JSON.stringify({mvp:AW_ADV.mvp,mvpTeam:AW_ADV.mvpTeam}));const row={s:L.season};
 const rank=p=>q.filter(x=>(x.stats.rs.ws||0)>(p.stats.rs.ws||0)).length+1;
 for(const k in SETS){Object.assign(AW_ADV,JSON.parse(JSON.stringify(SETS[k])));const l=awardLadder(L,'mvp',1)[0];const p=l?L.players[l.pid]:null;row[k]=p?[p.name,rank(p)]:null;}
 Object.assign(AW_ADV,keep);GR.push(row);return ca.apply(this,arguments);};})();`);
for(let y=1;y<=N;y++){const r=run(`(function(){const L=SL;let g=0;while(L.phase==='regular'&&g++<400)simDay(L);processPending(L);startPlayoffs(L);g=0;while(L.phase==='playoffs'&&g++<400)simPlayoffDay(L);startOffseason(L);runLottery(L);startDraft(L);g=0;while(L.phase==='off-draft'&&g++<200)aiDraftPick(L);if(L.phase==='off-resign')startFA(L);g=0;while(L.phase==='off-fa'&&g++<60)faDay(L);processPending(L);startNewSeason(L);return JSON.stringify(GR.shift()||null);})()`);console.log('G '+r);}
