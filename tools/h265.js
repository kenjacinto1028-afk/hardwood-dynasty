// v26.5: SRC=src SEED=n MODE=commish node tools/h265.js [seasons] -> per season: trades, status mix (end of regular season), Rising teams, rebuild spell lengths, young minutes on low/rising teams, feed size, ms
const {run}=require('./load.js')(process.env.SRC||'src',+process.env.SEED||1);
console.log(run(`(function(N){const L=newLeague({mode:'${process.env.MODE||'commish'}',size:30,userTeam:0,games:+('${process.env.GAMES||82}')});const o=[],spell={},done=[],gLow=[],gOth=[],msA=[],kbA=[];let snap=null,tankSum=0;const hasV=typeof RISE_CNT!=='undefined';
for(let y=0;y<N;y++){const t0=Date.now();let g=0;const seen={};
 if(snap){for(const id in snap){const p=L.players[id];if(!p||p.retired)continue;(snap[id].low?gLow:gOth).push(p.ovr-snap[id].ovr);}snap=null;}
 const pre={};for(const t of L.teams)for(const p of rosterOf(L,t))if(p.age<=23)pre[p.id]={ovr:p.ovr,tid:t.id};
 while(L.phase==='regular'){simDay(L);if([1,Math.floor(totalDays(L)*0.4)+1,Math.floor(totalDays(L)*0.6)+1].includes(L.day))for(const t of L.teams)(seen[t.id]=seen[t.id]||[]).push(t.status);}
 let ff=0;for(const id in seen){const s=seen[id];for(let i=2;i<s.length;i++)if(s[i]===s[i-2]&&s[i]!==s[i-1])ff++;}
 const c={};for(const t of L.teams)c[t.status]=(c[t.status]||0)+1;tankSum+=(c.tank||0);
 snap=pre;for(const id in snap)snap[id].low=['rebuild','tank','rising'].includes(L.teams[snap[id].tid].status);
 const ym=[],ymO=[];for(const t of L.teams)for(const p of rosterOf(L,t)){const s=p.stats.rs;if(!s||s.gp<20||p.age>23)continue;const m=s.min/s.gp/60;(['rebuild','tank','rising'].includes(t.status)?ym:ymO).push(m);}
 const av=a=>a.length?(a.reduce((x,y)=>x+y,0)/a.length).toFixed(1):'-';
 for(const t of L.teams){const low=t.status==='rebuild'||t.status==='tank';if(low)spell[t.id]=(spell[t.id]||0)+1;else if(spell[t.id]){done.push(spell[t.id]);spell[t.id]=0;}}
 processPending(L);startPlayoffs(L);while(L.phase==='playoffs'&&g++<400)simPlayoffDay(L);
 startOffseason(L);runLottery(L);startDraft(L);g=0;while(L.phase==='off-draft'&&g++<200)aiDraftPick(L);startFA(L);g=0;while(L.phase==='off-fa'&&g++<40)faDay(L);processPending(L);
 const tr=L.trades.filter(x=>x.s===L.season).length;
 kbA.push(Math.round(JSON.stringify(L).length/1024));o.push('S'+(y+1)+' trades '+tr+' | save KB '+kbA[y]+' | tank '+(c.tank||0)+' rebuild '+(c.rebuild||0)+' rising '+(c.rising||0)+' hopeful '+(c.hopeful||0)+' | flip '+ff+' | U23 mpg low/rising '+av(ym)+' others '+av(ymO)+' | feed '+((L.feed||[]).length)+' | ms '+(Date.now()-t0));msA.push(Date.now()-t0);
 if(y<N-1)startNewSeason(L);}
o.push('rebuild/tank spells (seasons): '+done.join(',')+' avg '+(done.length?(done.reduce((a,b)=>a+b,0)/done.length).toFixed(2):'-'));
if(hasV)o.push('rolls '+JSON.stringify(RISE_CNT)+' rising-blocked '+(DEAL_CNT.rising||0)+' press '+JSON.stringify(PRESS_CNT));
const av2=a=>a.length?(a.reduce((x,y)=>x+y,0)/a.length).toFixed(2):'-';
o.push('tank avg '+(tankSum/N).toFixed(1)+' of 30 ('+Math.round(tankSum/N/30*100)+'%) | ms/season avg '+Math.round(msA.reduce((a,b)=>a+b,0)/msA.length)+' | OVR change next season, age 23 and under: low/rising teams '+av2(gLow)+' (n '+gLow.length+') vs others '+av2(gOth)+' (n '+gOth.length+')');
o.push('save KB '+Math.round(JSON.stringify(L).length/1024)+' feed KB '+Math.round(JSON.stringify(L.feed||[]).length/1024));
return o.join('\\n');})(${+process.argv[2]||4})`));
