// Make a saved league for fast tests: SRC=src SEED=n NBA=1 SIZE=30 MODE=commish|team OUT=tools/snap/x.json.gz node tools/snap-make.js [seasons]
// Plays [seasons] full seasons (AI runs your offseason in team mode, as in r30.js) and saves at the start of the next regular season (day 0).
const fs = require('fs'), zlib = require('zlib');
const N = +process.argv[2] || 10, NBA = (process.env.NBA || '1') === '1', MODE = process.env.MODE || 'commish', SIZE = +process.env.SIZE || 30;
const { run } = require('./load.js')(process.env.SRC || 'src', +process.env.SEED || 21);
const t0 = Date.now();
const js = run(`(function(N){const L=newLeague({mode:'${MODE}',size:${SIZE},userTeam:${MODE === 'team' ? 5 : 'undefined'},games:82${NBA ? ',nba:true' : ''}});const U=L.user;
for(let y=1;y<=N;y++){let g=0;while(L.phase==='regular'&&g++<400)simDay(L);processPending(L);startPlayoffs(L);g=0;while(L.phase==='playoffs'&&g++<400)simPlayoffDay(L);
 startOffseason(L);runLottery(L);startDraft(L);if(U!=null)L.user=null;g=0;while(L.phase==='off-draft'&&g++<200)aiDraftPick(L);if(L.phase==='off-resign')startFA(L);g=0;while(L.phase==='off-fa'&&g++<60)faDay(L);processPending(L);
 if(U!=null){L.user=U;const t=L.teams[U];while(t.roster.length>15){const p=rosterOf(L,t).sort((a,b)=>a.ovr-b.ovr)[0];release(L,p);}}startNewSeason(L);}
L.nextId=NEXT_ID;L.snap={made:'${new Date().toISOString().slice(0, 10)}',seasons:N,seed:${+process.env.SEED || 21},mode:'${MODE}',size:${SIZE},nba:${NBA}};return JSON.stringify(L);})(${N})`);
const out = process.env.OUT || `tools/snap/${NBA ? 'nba' : 'pbl' + SIZE}-${MODE}-s${N}.json.gz`;
fs.mkdirSync(require('path').dirname(out), { recursive: true });
fs.writeFileSync(out, zlib.gzipSync(js, { level: 9 }));
console.log(`saved ${out}: ${Math.round(js.length / 1024)} KB JSON, ${Math.round(fs.statSync(out).size / 1024)} KB gz, ${Math.round((Date.now() - t0) / 1000)} s`);
