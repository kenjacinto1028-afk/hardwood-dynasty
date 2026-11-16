// v25.7 100-season AI harness: SRC=<src dir> node tools/h257.js seed seasons   (prints one JSON summary)
const fs=require('fs'),vm=require('vm');const SRC=process.env.SRC||'src';const seed=+process.argv[2]||1,N=+process.argv[3]||5;
let s=(seed*2654435761)>>>0;const rnd=()=>{s|=0;s=(s+0x6D2B79F5)|0;let t=Math.imul(s^(s>>>15),1|s);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};
const code=fs.readFileSync(SRC+'/engine.js','utf8')+'\n'+fs.readFileSync(SRC+'/league.js','utf8');
const ctx=vm.createContext({console,Math:Object.create(Math,{random:{value:rnd}}),setTimeout,clearTimeout,Date,performance,structuredClone,JSON,Object,Array,Set,Map});
vm.runInContext(code,ctx);
const out=vm.runInContext(`(function(N){const L=newLeague({mode:'commish',size:30});
const T=[];let cur=null;
const orig=executeTrade;
executeTrade=function(L,tr){
  const rec={s:L.season,ph:L.phase,id:String(tr.id||''),type:tradeType(tr.aGive,tr.bGive),draft:L.phase==='off-draft',a:tr.a,b:tr.b,np:tr.aGive.players.length+tr.bGive.players.length,picks:[],cash:(tr.aGive.cash||0)+(tr.bGive.cash||0),prot:Object.keys(tr.aGive.prot||{}).length+Object.keys(tr.bGive.prot||{}).length,cashFrom:(tr.aGive.cash?tr.a:tr.bGive.cash?tr.b:null)};
  for(const g of [tr.aGive,tr.bGive])for(const pk of g.picks){const k=L.picks.find(x=>x.id===pk),o=draftSlotOf(L,k),pr=pickProj(L,k);rec.picks.push({rd:k.rd,s:k.s,slot:o?(k.rd===1?o.no:L.teams.length+o.no):null,mean:pr.mean,pts:pickPtsNow(L,k)});}
  rec.dump=/^dump-/.test(rec.id);
  orig(L,tr);T.push(rec);};
const res=[];
for(let y=0;y<N;y++){const t0=Date.now(),S=L.season;const n0=T.length;
 const cash0=Object.fromEntries(L.teams.map(t=>[t.id,0]));
 while(L.phase==='regular')simDay(L);if(typeof processPending==='function')processPending(L);
 startPlayoffs(L);let g=0;while(L.phase==='playoffs'&&g++<400)simPlayoffDay(L);
 startOffseason(L);runLottery(L);startDraft(L);g=0;while(L.phase==='off-draft'&&g++<200)aiDraftPick(L);startFA(L);g=0;while(L.phase==='off-fa'&&g++<40)faDay(L);if(typeof processPending==='function')processPending(L);
 const tr=T.slice(n0);
 const mix={plyr:0,dump:0,pick:0,mix:0};tr.forEach(x=>mix[x.type]=(mix[x.type]||0)+1);
 const withPicks=tr.filter(x=>x.picks.length),cash=tr.filter(x=>x.cash>0);
 const r1=tr.reduce((a,x)=>a+x.picks.filter(p=>p.rd===1).length,0),r2=tr.reduce((a,x)=>a+x.picks.filter(p=>p.rd===2).length,0);
 const top5=tr.reduce((a,x)=>a+x.picks.filter(p=>p.rd===1&&((p.slot!=null&&p.slot<=5)||(p.slot==null&&p.mean<=5))).length,0);
 const dd=tr.filter(x=>x.draft);const d2833=dd.reduce((a,x)=>a+x.picks.filter(p=>p.slot!=null&&p.slot>=28&&p.slot<=33).length,0);
 const dumps=tr.filter(x=>x.dump&&x.picks.length);const dumpPts=dumps.length?dumps.reduce((a,x)=>a+x.picks.reduce((b,p)=>b+p.pts,0),0)/dumps.length:0;
 const net={};for(const x of cash){}
 const maxNet=Math.max(0,...L.teams.map(t=>t.cashTr&&t.cashTr.s===capSeason(L)?Math.abs(t.cashTr.got-t.cashTr.sent):0));
 const fh=L.teams.map(t=>(t.finHist||[]).slice(-1)[0]).filter(Boolean);const maxCash=Math.max(0,...fh.map(h=>Math.max(h.cashIn||0,h.cashOut||0)));
 const protCount=tr.reduce((a,x)=>a+x.prot,0);
 res.push({S,n:tr.length,mix,withPicks:withPicks.length,picksPerDeal:withPicks.length?+(tr.reduce((a,x)=>a+x.picks.length,0)/withPicks.length).toFixed(2):0,cashDeals:cash.length,cashTotal:+cash.reduce((a,x)=>a+x.cash,0).toFixed(1),prot:protCount,r1,r2,top5,d2833,draftDeals:dd.length,dumpPts:+dumpPts.toFixed(0),maxCash,secs:(Date.now()-t0)/1000});
 startNewSeason(L);}
return res;})`,ctx)(N);
console.log(JSON.stringify({src:SRC,seed,res:out}));
