// one-season trade mix: SRC=... SEED=n node tools/m3.js
const {run}=require('./load.js')(process.env.SRC||'src',+process.env.SEED||777);
console.log(run(`(function(){const L=newLeague({mode:'team',userTeam:0,size:30});L.user=null;
while(L.phase==='regular')simDay(L);
const tr=L.trades.filter(t=>t.s===L.season);const c={};let pk1=0,pk2=0;
for(const t of tr){const k=t.type||t.kind||'?';c[k]=(c[k]||0)+1;for(const g of [t.aIn,t.bIn])if(g&&g.picks)for(const id of g.picks){const p=L.picks.find(x=>x.id===id);if(p){if(p.rd===1)pk1++;else pk2++;}}}
return 'trades '+tr.length+' '+JSON.stringify(c)+' picks moved rd1 '+pk1+' rd2 '+pk2;})()`));
