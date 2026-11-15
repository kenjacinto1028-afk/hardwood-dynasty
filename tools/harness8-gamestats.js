// v24.8 game-stats harness: SRC=<src> node h8.js seed seasons  (regular seasons only; one JSON line)
const fs=require('fs'),vm=require('vm');const SRC=process.env.SRC;const seed=+process.argv[2],N=+process.argv[3];
let s=(seed*2654435761)>>>0;const rnd=()=>{s|=0;s=(s+0x6D2B79F5)|0;let t=Math.imul(s^(s>>>15),1|s);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};
const ctx=vm.createContext({console,Math:Object.create(Math,{random:{value:rnd}}),setTimeout,clearTimeout,Date,performance,structuredClone,JSON,Object,Array,Set,Map});
vm.runInContext(fs.readFileSync(SRC+'/engine.js','utf8')+'\n'+fs.readFileSync(SRC+'/league.js','utf8'),ctx);
const out=vm.runInContext(`(function(N){const L=newLeague({mode:'commish',size:30});const A={g:0,pts:0,fta:0,fga:0,tpa:0,tov:0,pf:0,mar:0,ot:0,close:0,c3:0,ifl:0,hack:0,to:0,fouledOut:0,q4fta:0};
for(let y=0;y<N;y++){const n0=L.games.length;while(L.phase==='regular')simDay(L);
 for(const g of L.games.slice(n0)){if(g.playoff)continue;A.g++;const m=Math.abs(g.hs-g.as);A.mar+=m;if(g.ot)A.ot++;if(m<=5)A.close++;if(m<=3)A.c3++;
  for(const r of g.box){A.pts+=r[3];A.fta+=r[9];A.fga+=r[5];A.tpa+=r[7];A.tov+=r[15];A.pf+=r[16];if(r[16]>=6)A.fouledOut++;}
  if(g.lg){A.ifl+=g.lg.ifl[0]+g.lg.ifl[1];A.hack+=g.lg.hack[0]+g.lg.hack[1];A.to+=g.lg.to[0]+g.lg.to[1];}}
 if(y<N-1){startPlayoffs(L);let k=0;while(L.phase==='playoffs'&&k++<400)simPlayoffDay(L);startOffseason(L);runLottery(L);startDraft(L);k=0;while(L.phase==='off-draft'&&k++<200)aiDraftPick(L);startFA(L);k=0;while(L.phase==='off-fa'&&k++<40)faDay(L);processPending(L);startNewSeason(L);}}
const tg=A.g*2,f=x=>+x.toFixed(2);return {games:A.g,ptsTeam:f(A.pts/tg),ftaTeam:f(A.fta/tg),fgaTeam:f(A.fga/tg),tpaTeam:f(A.tpa/tg),tovTeam:f(A.tov/tg),pfTeam:f(A.pf/tg),margin:f(A.mar/A.g),otPct:f(A.ot/A.g*100),within5Pct:f(A.close/A.g*100),within3Pct:f(A.c3/A.g*100),iflGame:f(A.ifl/A.g),hackGame:f(A.hack/A.g),toTeam:f(A.to/tg),fouledOutPerGame:f(A.fouledOut/A.g)};})`,ctx)(N);
console.log(JSON.stringify({src:SRC,seed,...out}));
