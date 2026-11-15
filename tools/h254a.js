// v25.4 5a: unit checks + tag stats over AI trade proposals. SRC=<src> node h254a.js seed seasons
const fs=require('fs'),vm=require('vm');const SRC=process.env.SRC||'src';const seed=+process.argv[2]||1,N=+process.argv[3]||2;
let s=(seed*2654435761)>>>0;const rnd=()=>{s|=0;s=(s+0x6D2B79F5)|0;let t=Math.imul(s^(s>>>15),1|s);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};
const ctx=vm.createContext({console,Math:Object.create(Math,{random:{value:rnd}}),setTimeout,clearTimeout,Date,performance,structuredClone,JSON,Object,Array,Set,Map});
let lg=fs.readFileSync(SRC+'/league.js','utf8');if(process.env.NEED)lg=lg.replace('need: 0.9, expBest: true','need: '+process.env.NEED+', expBest: '+(process.env.EXPB||'false'));vm.runInContext(fs.readFileSync(SRC+'/engine.js','utf8')+'\n'+lg,ctx);
const out=vm.runInContext(`(function(N){const res=[];const ok=(n,c,x)=>res.push((c?'PASS ':'FAIL ')+n+(x!=null?'  ['+x+']':''));
const L=newLeague({mode:'team',userTeam:0,size:30});
// ---- unit cases
const T1=L.teams[1],T2=L.teams[2];const pl=t=>rosterOf(L,t).sort((a,b)=>b.ovr-a.ovr);
const star=pl(T2)[0];star.ovr=84;star.age=27;
let g=tradeGets(L,1,{players:[star.id],picks:[]},{players:[],picks:[]});ok('star + win-now tags',g[0].k==='star'&&g.some(t=>t.k==='winNow'),g.map(t=>t.k).join());
const k1=L.picks.find(k=>k.owner===2&&k.rd===1),k2=L.picks.find(k=>k.owner===2&&k.rd===2);
g=tradeGets(L,1,{players:[],picks:[k1.id]},{players:[],picks:[]});ok('1st-round pick tag',g.some(t=>t.k==='pick1'));
g=tradeGets(L,1,{players:[],picks:[k2.id]},{players:[],picks:[]});ok('picks tag for 2nd only',g.some(t=>t.k==='picks')&&!g.some(t=>t.k==='pick1'));
const kid=pl(T2).slice(-1)[0];kid.age=19;kid.pot=kid.ovr+15;
g=tradeGets(L,1,{players:[kid.id],picks:[]},{players:[],picks:[]});ok('young tag',g.some(t=>t.k==='young'));
const vet=pl(T2)[3];vet.ovr=72;vet.contract.exp=capSeason(L);g=tradeGets(L,1,{players:[vet.id],picks:[]},{players:[],picks:[]});ok('expiring tag',g.some(t=>t.k==='expiring'));
const big=pl(T1)[0];big.contract.amt=40;big.contract.exp=capSeason(L)+2;const cheap=pl(T2).slice(-1)[0];cheap.contract.amt=2;
g=tradeGets(L,2,{players:[cheap.id],picks:[]},{players:[big.id],picks:[]});ok('cap tag when shedding 15M+',g.some(t=>t.k==='cap'));
g=tradeGets(L,1,{players:pl(T2).slice(0,6).map(p=>p.id),picks:[k1.id,k2.id]},{players:[],picks:[]});ok('max 3 tags',g.length<=3,g.map(t=>t.k).join());
ok('text joins naturally',/ and /.test(tradeGetsText(L,1,{players:[star.id],picks:[k1.id]},{players:[],picks:[]})),tradeGetsText(L,1,{players:[star.id],picks:[k1.id]},{players:[],picks:[]}));
ok('empty deal gives empty text',tradeGetsText(L,1,{players:[],picks:[]},{players:[],picks:[]})==='');
// ---- stats over AI proposals
const L2=newLeague({mode:'team',userTeam:0,size:30});const tally={},per={0:0,1:0,2:0,3:0};let deals=0,sides=0,empty=0,offers=0;const kinds={};
const orig=aiTradeAttempt;
const nv=[],phr={};let bad=0;const rec=tr=>{if(!tr)return;deals++;for(const [tid,get] of [[tr.a,tr.bGive],[tr.b,tr.aGive]]){const needs=teamNeeds(L2,L2.teams[tid]);let bv=0;for(const id of get.players)for(const a of L2.players[id].arch||[])bv=Math.max(bv,needs[a.p+'|'+a.n]||0);nv.push(bv);}for(const [tid,get,give] of [[tr.a,tr.bGive,tr.aGive],[tr.b,tr.aGive,tr.bGive]]){const tg=tradeGets(L2,tid,get,give);sides++;{const tx=tradeGetsText(L2,tid,get,give);phr[tx]=(phr[tx]||0)+1;if(tradeGetsText(L2,tid,get,give)!==tx)bad++;if(/\ba picks\b|\band and\b|,\s*,|\ba a\b/.test(tx))bad++;}per[tg.length]++;if(!tg.length)empty++;for(const t of tg)tally[t.k]=(tally[t.k]||0)+1;}};
aiTradeAttempt=function(){const tr=orig.apply(this,arguments);rec(tr);return tr;};
for(let y=0;y<N;y++){while(L2.phase==='regular'){simDay(L2);for(const o of L2.offers||[])if(o.isNew){offers++;o.isNew=false;}}
 if(y<N-1){startPlayoffs(L2);let q=0;while(L2.phase==='playoffs'&&q++<400)simPlayoffDay(L2);startOffseason(L2);runLottery(L2);startDraft(L2);q=0;while(L2.phase==='off-draft'&&q++<200)aiDraftPick(L2);startFA(L2);q=0;while(L2.phase==='off-fa'&&q++<40)faDay(L2);processPending(L2);startNewSeason(L2);}}
nv.sort((a,b)=>a-b);res.push('NEEDQ '+[0.1,0.25,0.5,0.6,0.7,0.75,0.8,0.9].map(q=>q+':'+nv[Math.floor(q*(nv.length-1))].toFixed(2)).join(' '));const samp=[];const o2=aiTradeAttempt;
res.push('PHRASES distinct '+Object.keys(phr).length+' bad '+bad+' | '+Object.entries(phr).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([k,v])=>v+'x '+k).join(' | '));res.push('STATS deals '+deals+' sides '+sides+' offers to you '+offers);
res.push('TAGS '+JSON.stringify(Object.fromEntries(Object.entries(tally).sort((a,b)=>b[1]-a[1]).map(([k,v])=>[k,+(v/sides*100).toFixed(1)]))));
res.push('TAGCOUNT per side (0/1/2/3) '+[0,1,2,3].map(k=>(per[k]/sides*100).toFixed(0)+'%').join(' / '));
return res.join(String.fromCharCode(10));})`,ctx)(N);
console.log(out);
