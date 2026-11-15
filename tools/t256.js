// v25.4 + v25.5 unit checks: SRC=<src> node t256.js
const fs=require('fs'),vm=require('vm');const SRC=process.env.SRC||'src';
let s=777;const rnd=()=>{s|=0;s=(s+0x6D2B79F5)|0;let t=Math.imul(s^(s>>>15),1|s);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};
const ctx=vm.createContext({console,Math:Object.create(Math,{random:{value:rnd}}),setTimeout,clearTimeout,Date,performance,structuredClone,JSON,Object,Array,Set,Map});
const code=fs.readFileSync(SRC+'/engine.js','utf8')+'\n'+fs.readFileSync(SRC+'/league.js','utf8')+`
(function(){const res=[];const ok=(n,c,x)=>res.push((c?'PASS ':'FAIL ')+n+(x!=null?'  ['+x+']':''));
// ---- v25.4 engine: knobs and big-man gate
ok('ENG knobs: zone.tp .350, tpSlope .0036, atb3 .005',ENG.zone.tp===0.350&&ENG.tpSlope===0.0036&&ENG.atb3===0.005);
ok('ENG.bg set',ENG.bg&&ENG.bg.tp[0]===42&&ENG.bg.mid[0]===38);
const big={pos:4},guard={pos:0};
ok('bigGate: guard never gated',bigGate(guard,30,ENG.bg.tp)===1);
ok('bigGate: big tp 45 -> .17',Math.abs(bigGate(big,45,ENG.bg.tp)-3/18)<1e-9,bigGate(big,45,ENG.bg.tp));
ok('bigGate: big tp 60+ -> 1',bigGate(big,62,ENG.bg.tp)===1);
ok('bigGate: floor .08',bigGate(big,20,ENG.bg.tp)===0.08);
ok('bigGate: mid 30 -> floor .2',bigGate(big,30,ENG.bg.mid)===0.2);
// ---- 2b tendencies
const L0=newLeague({mode:'team',userTeam:0,size:30});const ps=Object.values(L0.players).filter(p=>p.tv);
ok('league players store tv and tk',ps.length>300&&ps.every(p=>p.tk),ps.length);
const mean=a=>a.reduce((x,y)=>x+y,0)/a.length;const gen=[];for(let i=0;i<3000;i++)gen.push(genPlayer(['PG','SG','SF','PF','C'][i%5],gauss(-0.2,0.8),25,new Set()));
const sh=gen.filter(p=>p.tp>=62),ot=gen.filter(p=>p.tp<62);
ok('good shooters have lower t3 noise (low-volume roll)',sh.length>200&&mean(sh.map(p=>p.tv.t3))<mean(ot.map(p=>p.tv.t3))-1.5,sh.length+' mean '+mean(sh.map(p=>p.tv.t3)).toFixed(1)+' vs '+mean(ot.map(p=>p.tv.t3)).toFixed(1));
const p=ps.find(p=>p.pos>=3&&p.tp<60);const old=p.t3;p.tp=Math.min(99,p.tp+30);const tgc=Math.max(1,Math.min(99,Math.round(tendTarget(p).t3)));driftTendencies(p);
ok('drift moves t3 20% toward target',Math.abs((p.t3-old)-0.2*(tgc-old))<=1.01,old+' -> '+p.t3+' (target '+tgc+')');
const q=ps.find(x=>x.pos===4&&x!==p);delete q.tv;delete q.tk;const b3=q.t3,btmd=q.tmd;fillTv(q);driftTendencies(q);
ok('old save: no jump on first fill+drift',Math.abs(q.t3-b3)<=1&&Math.abs(q.tmd-btmd)<=1,b3+'->'+q.t3);
// ---- weekly report and final week
const L=newLeague({mode:'team',userTeam:0,size:30});
for(let i=0;i<7;i++)simDay(L);
ok('week 1: no riser/faller lines',!L.wk.heads.some(h=>/surge|slide|tumble|climb|drop|risers|Rough week|Big week/.test(h)),L.wk.heads.join(' | '));
ok('week 1: prPrev null',L.wk.prPrev===null);
const seen={};let repeats=0,wks=1,prevS={};
while(L.phase==='regular'){simDay(L);if(L.wk&&L.wk.day===L.day&&L.day%7===0)wks++;}
ok('final-week report exists after the regular season',L.wk&&L.wk.final===true&&L.wk.day===L.schedule.length,L.wk.day+' of '+L.schedule.length+' n='+L.wk.n);
ok('streaks stored',L.wk.streaks&&typeof L.wk.streaks==='object');
// streak repeat rule
const L2=newLeague({mode:'team',userTeam:0,size:30});for(let i=0;i<14;i++)simDay(L2);
const tm=L2.teams[3];tm.streak=7;L2.wk.streaks={3:7};L2.day=14;L2.phase='regular';
const hb=L2.wk;updateWeekly(L2);ok('same streak not repeated',!L2.wk.heads.some(h=>h.includes(L2.teams[3].abbr)&&/(^|[^0-9])7([^0-9]|$)/.test(h)),L2.wk.heads.join(' | '));
L2.wk.streaks={3:7};tm.streak=11;L2.day=21;updateWeekly(L2);ok('grown streak (+4) shown',L2.wk.heads.some(h=>h.includes(L2.teams[3].abbr)&&/(^|[^0-9])11([^0-9]|$)/.test(h)),L2.wk.heads.join(" | "));
// ---- signConcerns refuse
const t=L2.teams[0],pl=rosterOf(L2,t)[0];pl.morale=10;ok('unhappy player refuses extension',!!signConcerns(L2,pl,t,'extension').refuse);
pl.morale=80;ok('happy player: -8% note',signConcerns(L2,pl,t,'extension').notes.some(x=>/-8%/.test(x)));
console.log(res.join('\\n'));})();`;
vm.runInContext(code,ctx);
