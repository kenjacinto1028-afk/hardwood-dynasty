// v26.0 checks: SRC=src SEED=n node tools/t260.js  (tags, coach report, roster needs)
const {run}=require('./load.js')(process.env.SRC||'src',+process.env.SEED||5);
console.log(run(`(function(){const res=[],info=[];const ok=(n,c,x)=>res.push((c?'PASS ':'FAIL ')+n+(x!=null?'  ['+x+']':''));
const t0=Date.now();const L=newLeague({mode:'team',userTeam:0,size:30});for(let i=0;i<30;i++)simDay(L);refreshTradeStatus(L);
const ps=active(L).filter(p=>p.team!=null&&!p.prospect);const cnt={};const tg=new Map();ps.forEach(p=>{const t=playerTags(L,p);tg.set(p.id,t);t.forEach(x=>cnt[x.k]=(cnt[x.k]||0)+1);});
info.push('tags '+JSON.stringify(cnt)+' of '+ps.length);
ok('every team has 0-2 cornerstones',L.teams.every(t=>{const n=rosterOf(L,t).filter(p=>tg.get(p.id)&&tg.get(p.id).some(x=>x.k==='corner')).length;return n<=2;}));
ok('at least 15 teams have a cornerstone',L.teams.filter(t=>rosterOf(L,t).some(p=>(tg.get(p.id)||[]).some(x=>x.k==='corner'))).length>=15,L.teams.filter(t=>rosterOf(L,t).some(p=>(tg.get(p.id)||[]).some(x=>x.k==='corner'))).length);
ok('bargain and overpaid never together',ps.every(p=>!(tg.get(p.id).some(x=>x.k==='bargain')&&tg.get(p.id).some(x=>x.k==='overpaid'))));
ok('fits and clash both show up, 5-30% of rotation each',(()=>{const r=L.teams.flatMap(t=>rotationOf(L,t));const f=r.filter(p=>fitTag(p,L.teams[p.team].coach)==='fits').length/r.length,c=r.filter(p=>fitTag(p,L.teams[p.team].coach)==='clash').length/r.length;info.push('fits '+(f*100).toFixed(0)+'% clash '+(c*100).toFixed(0)+'%');return f>=0.05&&f<=0.3&&c>=0.05&&c<=0.3;})());
const me=rosterOf(L,L.teams[0]).sort((a,b)=>b.ovr-a.ovr)[1];me.protect=true;ok('your protected player is Untouchable',playerTags(L,me).some(x=>x.k==='untouch'));me.protect=false;
ok('AI cornerstone tagged Untouchable too (most)',(()=>{const c=ps.filter(p=>p.team!==0&&tg.get(p.id).some(x=>x.k==='corner'));return c.filter(p=>tg.get(p.id).some(x=>x.k==='untouch')).length>=c.length*0.6;})());
// coach report
const T=L.teams[0],r=coachReport(L,T.coach,T);
ok('coach report: style, star, fit, wants',r.style.offN&&r.star&&r.fit.score>0&&r.fit.rank>=1&&r.fit.rank<=12&&r.wants.length>=5,JSON.stringify({fit:r.fit,key:r.key.length,clash:r.clash.length}));
ok('coach report line filled',r.line&&!/[{}]/.test(r.line),r.line);
const fl0=coachFitList(L,T,L.coachPool.slice(0,8));ok('hiring list sorted by fit',fl0.every((x,i)=>!i||x.score<=fl0[i-1].score),fl0.slice(0,3).map(x=>x.c.name+' '+x.score+' ('+(x.delta>=0?'+':'')+x.delta+')').join(', '));
// roster needs
const needs=L.teams.map(t=>rosterNeeds(L,t));const cats={},urg={},ks={};needs.flat().forEach(n=>{cats[n.cat]=(cats[n.cat]||0)+1;urg[n.urg]=(urg[n.urg]||0)+1;ks[n.k]=(ks[n.k]||0)+1;});
info.push('needs per team avg '+(needs.flat().length/30).toFixed(1)+' cats '+JSON.stringify(cats)+' urg '+JSON.stringify(urg)+' kinds '+JSON.stringify(ks));
ok('needs text filled',needs.flat().every(n=>n.text&&!/[{}]|undefined|NaN/.test(n.text)));
ok('every team has 1-8 needs (most)',needs.filter(n=>n.length>=1&&n.length<=8).length>=27);
ok('weakest rebounding team gets the rebounding need',(()=>{const w=L.teams.slice().sort((a,b)=>rnTeamVals(L,a).reb-rnTeamVals(L,b).reb)[0];return rosterNeeds(L,w).some(n=>n.k==='reb');})());
info.push('team 0 needs: '+rosterNeeds(L,T).map(n=>'['+RN_URG[n.urg]+'] '+n.text).join(' | '));
info.push('team 0 tags: '+rosterOf(L,T).map(p=>playerTags(L,p)).filter(x=>x.length).map(x=>x.map(y=>y.n).join('+')).join(' / '));
// S1 recentLine: a fresh league says first season; after a few seasons every team has text with no braces
ok('recentLine: first season with no history',recentLine(L,L.teams[0]).k==='yr5.first');
{const M=newLeague({mode:'commish',size:30});const NS=${+process.env.SEASONS||3};
 for(let y=0;y<NS;y++){let g=0;while(M.phase==='regular')simDay(M);processPending(M);startPlayoffs(M);while(M.phase==='playoffs'&&g++<400)simPlayoffDay(M);startOffseason(M);runLottery(M);startDraft(M);g=0;while(M.phase==='off-draft'&&g++<200)aiDraftPick(M);startFA(M);g=0;while(M.phase==='off-fa'&&g++<40)faDay(M);processPending(M);if(y<NS-1)startNewSeason(M);}
 const rl=M.teams.map(t=>recentLine(M,t)),kc={};rl.forEach(r=>kc[r.k]=(kc[r.k]||0)+1);
 ok('recentLine: text for every team, no braces / undefined',rl.every(r=>r.text&&!/[{}]|undefined|NaN/.test(r.text)),JSON.stringify(kc));
 ok('recentLine: playoff trips in range, champion line only for a champion',rl.every((r,i)=>r.trips>=0&&r.trips<=r.n&&(!/^Won/.test(r.text)||M.history.slice(-5).some(h=>h.champion===i))));
 ok('recentLine: a champion says so',(()=>{const h=M.history[M.history.length-1];const r=recentLine(M,M.teams[h.champion]);return /^yr5\.titles?$/.test(r.k);})(),recentLine(M,M.teams[M.history[M.history.length-1].champion]).text);
 info.push('recent lines: '+rl.slice(0,4).map(r=>r.text).join(' | '));}
info.push('ms '+(Date.now()-t0));
return res.join('\\n')+'\\n--\\n'+info.join('\\n');})()`));
