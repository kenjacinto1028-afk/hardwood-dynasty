// core vs coach targets at the same primary position: SRC=src node tools/h257c.js seed seasons
const fs=require('fs'),vm=require('vm');const SRC=process.env.SRC||'src';const seed=+process.argv[2]||1,N=+process.argv[3]||3;
let s=(seed*2654435761)>>>0;const rnd=()=>{s|=0;s=(s+0x6D2B79F5)|0;let t=Math.imul(s^(s>>>15),1|s);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};
const ctx=vm.createContext({console,Math:Object.create(Math,{random:{value:rnd}}),setTimeout,clearTimeout,Date,performance,structuredClone,JSON,Object,Array,Set,Map});
vm.runInContext(fs.readFileSync(SRC+'/engine.js','utf8')+'\n'+fs.readFileSync(SRC+'/league.js','utf8'),ctx);
const out=vm.runInContext(`(function(N){const L=newLeague({mode:'commish',size:30});const R=[];
for(let y=0;y<N;y++){while(L.phase==='regular'&&L.day<30)simDay(L);
 for(const t of L.teams){const kept=keptSpots(L,t),core=coreOf(L,t);
  for(const tab of ['plan','now','dev'])for(const kind of ['trade','fa'])for(const x of coachTargets(L,t,kind,tab)){const p=x.p;
   for(const k of kept)if(k.p.pos===p.pos){R.push({why:k.why,tab,kind,two:p.pos2!=null,gap:k.p.ovr-p.ovr,backs:/backs up/.test(x.why),text:x.why});break;}}}
 while(L.phase==='regular')simDay(L);startPlayoffs(L);let g=0;while(L.phase==='playoffs'&&g++<400)simPlayoffDay(L);
 startOffseason(L);runLottery(L);startDraft(L);g=0;while(L.phase==='off-draft'&&g++<200)aiDraftPick(L);startFA(L);g=0;while(L.phase==='off-fa'&&g++<40)faDay(L);startNewSeason(L);}
return R;})`,ctx)(N);
console.log(JSON.stringify(out));
