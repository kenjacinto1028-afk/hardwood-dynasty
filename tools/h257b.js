// v25.7 pick-trade, two-way and core/target report: SRC=src node tools/h257b.js seed seasons
const fs=require('fs'),vm=require('vm');const SRC=process.env.SRC||'src';const seed=+process.argv[2]||1,N=+process.argv[3]||10;
let s=(seed*2654435761)>>>0;const rnd=()=>{s|=0;s=(s+0x6D2B79F5)|0;let t=Math.imul(s^(s>>>15),1|s);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};
const code=fs.readFileSync(SRC+'/engine.js','utf8')+'\n'+fs.readFileSync(SRC+'/league.js','utf8');
const ctx=vm.createContext({console,Math:Object.create(Math,{random:{value:rnd}}),setTimeout,clearTimeout,Date,performance,structuredClone,JSON,Object,Array,Set,Map});
vm.runInContext(code,ctx);
const out=vm.runInContext(`(function(N){const L=newLeague({mode:'commish',size:30});
const T=[],tw=[],core=[],tg=[];
const cat=p=>p.rd===2?'2nd':p.slot<=5?'top5':p.slot<=14?'lottery':'late1st';
const orig=executeTrade;
executeTrade=function(L,tr){
 const picks=[];
 for(const [g,from] of [[tr.aGive,tr.a],[tr.bGive,tr.b]])for(const pk of g.picks){const k=L.picks.find(x=>x.id===pk),o=draftSlotOf(L,k),pr=pickProj(L,k);const slot=o?(k.rd===1?o.no:15):(k.rd===1?Math.round(pr.mean):15);picks.push({rd:k.rd,s:k.s,from,slot,known:!!o,cat:cat({rd:k.rd,slot}),prot:g.prot&&g.prot[pk]||0,orig:k.orig,pts:Math.round(pickPtsNow(L,k))});}
 const pl=[];for(const [g,from] of [[tr.aGive,tr.a],[tr.bGive,tr.b]])for(const id of g.players){const p=L.players[id];pl.push({from,n:p.name,ovr:p.ovr,age:p.age,amt:p.contract?p.contract.amt:0});}
 const type=tradeType(tr.aGive,tr.bGive);
 const rec={S:L.season,ph:L.phase,draft:L.phase==='off-draft',type,id:String(tr.id||'').split('-')[0],a:L.teams[tr.a].abbr+' '+(L.teams[tr.a].status||L.teams[tr.a].mode),b:L.teams[tr.b].abbr+' '+(L.teams[tr.b].status||L.teams[tr.b].mode),picks,pl,cash:(tr.aGive.cash||0)+(tr.bGive.cash||0),why:(tr.why||'').slice(0,170)};
 orig(L,tr);T.push(rec);};
for(let y=0;y<N;y++){const S=L.season;
 let d0=0;
 while(L.phase==='regular'){simDay(L);if(L.day===30&&!d0){d0=1;
   for(const t of L.teams){const c=coreOf(L,t);core.push({S,t:t.abbr,st:t.status,core:c.map(p=>({n:p.name,pos:POS[p.pos],ovr:p.ovr,age:p.age,scout:p.scout}))});
     for(const tab of ['plan','now','dev']){const ts=coachTargets(L,t,'trade',tab);const kept=keptSpots(L,t);for(const x of ts){const same=c.filter(k=>k.pos===x.p.pos||(x.p.pos2!=null&&k.pos===x.p.pos2));const bk=/backs up/.test(x.why);tg.push({S,t:t.abbr,tab,pos:POS[x.p.pos],ovr:x.p.ovr,age:x.p.age,sameCore:same.length,coreOvr:same.length?same[0].ovr:null,backs:bk,takes:!!takesSpot(L,t,x.p,kept),why:x.why.slice(0,90)});}}}
 }}
 if(typeof processPending==='function')processPending(L);
 startPlayoffs(L);let g=0;while(L.phase==='playoffs'&&g++<400)simPlayoffDay(L);
 startOffseason(L);runLottery(L);startDraft(L);g=0;while(L.phase==='off-draft'&&g++<200)aiDraftPick(L);
 { const r2=L.draftOrder.filter(o=>o.rd===2&&o.pid!=null).map(o=>L.players[o.pid]);
   tw.push({S,r2:r2.length,two:r2.filter(p=>p.tw&&p.tw.exp).length,std:r2.filter(p=>p.team!=null).length,fa:r2.filter(p=>p.team==null&&!p.tw).length,twAges:r2.filter(p=>p.tw&&p.tw.exp).map(p=>p.age+'/'+p.scout+'/'+p.ovr)}); }
 startFA(L);g=0;while(L.phase==='off-fa'&&g++<40)faDay(L);if(typeof processPending==='function')processPending(L);
 startNewSeason(L);}
return {T,tw,core,tg};})`,ctx)(N);
console.log(JSON.stringify(out));
