// v25.5 mood variance: SRC=<src> node hmood.js seed seasons -> one JSON line per season
const fs=require('fs'),vm=require('vm');const SRC=process.env.SRC;const seed=+process.argv[2],N=+process.argv[3];
let s=(seed*2654435761)>>>0;const rnd=()=>{s|=0;s=(s+0x6D2B79F5)|0;let t=Math.imul(s^(s>>>15),1|s);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};
const ctx=vm.createContext({console,Math:Object.create(Math,{random:{value:rnd}}),setTimeout,clearTimeout,Date,performance,structuredClone,JSON,Object,Array,Set,Map});
vm.runInContext(fs.readFileSync(SRC+'/engine.js','utf8')+'\n'+fs.readFileSync(SRC+'/league.js','utf8'),ctx);
const out=vm.runInContext(`(function(N){const L=newLeague({mode:'commish',size:30});const res=[];
for(let y=0;y<N;y++){const req=new Set();let trades0=(L.trades||[]).length;
 while(L.phase==='regular'){simDay(L);for(const id in L.players){const p=L.players[id];if(p.tradeReq===L.season)req.add(id);}}
 const m=[],fp=[],ff=[];let hi=0,lo40=0,lo25=0;
 for(const t of L.teams)for(const p of rosterOf(L,t)){if(p.morale==null)continue;m.push(p.morale);const pa=moraleParts(L,p);if(pa){fp.push(pa.fit);ff.push(fit(p,t.coach));}if(p.morale>=75)hi++;if(p.morale<40)lo40++;if(p.morale<25)lo25++;}
 const mean=a=>a.reduce((x,y)=>x+y,0)/a.length,sd=a=>{const u=mean(a);return Math.sqrt(mean(a.map(x=>(x-u)**2)))};
 const n=m.length;const fitLow=ff.filter(x=>x<50).length;
 res.push({season:y+1,n,mean:+mean(m).toFixed(1),sd:+sd(m).toFixed(1),pct75:+(hi/n*100).toFixed(1),pct40:+(lo40/n*100).toFixed(1),pct25:+(lo25/n*100).toFixed(1),tradeReqs:req.size,fitPartMean:+mean(fp).toFixed(2),fitPartSd:+sd(fp).toFixed(2),fitPartMin:+Math.min(...fp).toFixed(1),fitPartMax:+Math.max(...fp).toFixed(1),fitUnder50:fitLow,trades:(L.trades||[]).length-trades0});
 if(y<N-1){startPlayoffs(L);let k=0;while(L.phase==='playoffs'&&k++<400)simPlayoffDay(L);startOffseason(L);runLottery(L);startDraft(L);k=0;while(L.phase==='off-draft'&&k++<200)aiDraftPick(L);startFA(L);k=0;while(L.phase==='off-fa'&&k++<40)faDay(L);processPending(L);startNewSeason(L);}}
return res;})`,ctx)(N);
for(const r of out)console.log(JSON.stringify({src:SRC.split('/').slice(-2,-1)[0],seed,...r}));
