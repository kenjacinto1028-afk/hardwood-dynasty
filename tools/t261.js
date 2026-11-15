// v26.1 checks: SRC=src SEED=n node tools/t261.js [seasons]  (odds, incentives, clauses, promises)
const {run}=require('./load.js')(process.env.SRC||'src',+process.env.SEED||4);
run(`function SEASON(L,next){let g=0;while(L.phase==='regular')simDay(L);processPending(L);startPlayoffs(L);while(L.phase==='playoffs'&&g++<400)simPlayoffDay(L);
 startOffseason(L);runLottery(L);startDraft(L);g=0;while(L.phase==='off-draft'&&g++<200)aiDraftPick(L);startFA(L);g=0;while(L.phase==='off-fa'&&g++<40)faDay(L);processPending(L);if(next!==false)startNewSeason(L);}`);
console.log(run(`(function(N){const res=[],info=[];const ok=(n,c,x)=>res.push((c?'PASS ':'FAIL ')+n+(x!=null?'  ['+x+']':''));
let t0=Date.now();const L=newLeague({mode:'commish',size:30});const o=seasonOdds(L);info.push('odds ms '+(Date.now()-t0));
ok('odds: 5 title favorites with odds text',o.title.length===5&&o.title.every(x=>/^[+-]\\d+$/.test(x.odds)),o.title.map(x=>L.teams[x.tid].abbr+' '+x.odds).join(', '));
ok('odds: favorite is a top-3 team by strength',(()=>{const r=L.teams.slice().sort((a,b)=>teamStrength(L,b)-teamStrength(L,a)).slice(0,3).map(t=>t.id);return r.includes(o.title[0].tid);})());
ok('odds: each award has 5 names (ROY: none in a new league)',['mvp','dpoy','smoy','mip','coy'].every(k=>o[k].length===5)&&o.roy.length===0,['mvp','roy','coy'].map(k=>k+': '+o[k].slice(0,3).map(x=>(x.pid!=null?L.players[x.pid].name:L.teams[x.tid].abbr)+' '+x.odds).join(', ')).join(' | '));
ok('odds: ROY list is rookies',o.roy.every(x=>L.players[x.pid].rookieSeason===L.season));
ok('odds: preseason snapshot kept',L.odds[L.season].pre===o);
ok('amOdds format',amOdds(0.5)==='-100'&&amOdds(0.2)==='+400'&&amOdds(0.75)==='-300',[amOdds(0.5),amOdds(0.2),amOdds(0.75),amOdds(0.03)].join(' '));
// incentives, clauses (on a mid free agent, as the user team in a team league)
const U=newLeague({mode:'team',userTeam:0,size:30});U.phase='off-fa';const T=U.teams[0];
const fa=active(U).filter(p=>p.team!=null&&p.team!==0&&p.ovr>=66&&p.ovr<=72)[0];removeFromTeam(U,fa);U.fa.push(fa.id);setAsk(U,fa);fa.ask=Math.max(fa.ask,6);
const q0=negotiate(U,fa.id,1,3,0,'signing',null,{quote:true}).quote,q1=negotiate(U,fa.id,1,3,0,'signing',null,{quote:true,role:{k:'starter'}}).quote,q2=negotiate(U,fa.id,1,3,0,'signing',null,{quote:true,kick:0.15}).quote,q3=negotiate(U,fa.id,1,3,0,'signing',null,{quote:true,gtd:0.25}).quote;
ok('a starter promise or kicker lowers his ask; a partial guarantee raises it',q1<q0&&q2<q0&&q3>q0,[q0,q1,q2,q3].join(' / '));
while(T.roster.length>12)release(U,rosterOf(U,T).sort((a,b)=>a.ovr-b.ovr)[0]);
const r=negotiate(U,fa.id,q0,3,0,'signing',null,{noOwner:true,incs:[{k:'gp',amt:0.5},{k:'title',amt:0.5}],kick:0.1,eto:2,gtd:0.5,role:{k:'min',v:28}});
ok('signed with incentives and clauses',r.ok&&fa.contract.incs.length===2&&fa.contract.kick===0.1&&fa.contract.gtd===0.5&&fa.contract.eto===capSeason(U)+1&&fa.contract.role.v===28,r.msg+' '+JSON.stringify(fa.contract));
const lk=fa.contract.incs.filter(x=>x.lk).reduce((a,x)=>a+x.amt,0);ok('likely incentives on the cap, unlikely not',Math.abs(capHit(U,fa)-(fa.contract.amt*(fa.contract.hg?0.9:1)+lk))<1e-6,JSON.stringify(fa.contract.incs));
// kicker on trade
const B=U.teams[5];const amt0=fa.contract.amt;fa.team=0;applyKicker(U,fa);ok('trade kicker raises salary once',fa.contract.amt>amt0&&fa.contract.kicked,amt0+' -> '+fa.contract.amt);const a1=fa.contract.amt;applyKicker(U,fa);ok('kicker only once',fa.contract.amt===a1);
// partial guarantee dead money
const d0=(T.dead||[]).length;release(U,fa);const dd=T.dead.slice(d0);ok('partial guarantee: final season owes its share only',dd.length===2&&dd[1].from===dd[1].exp&&Math.abs(dd[1].amt-r1(dd[0].amt*0.5))<0.11,JSON.stringify(dd.map(d=>[d.amt,d.exp,d.from])));
// early opt-out
const v=active(U).find(p=>p.team===3&&p.contract&&p.contract.exp>=U.season+2);v.contract.eto=U.season;v.mval=v.contract.amt*1.5;v.age=27;etoDecide(U);ok('early opt-out used when he is worth more',v.contract.exp===U.season);
// promises over a season
const P=newLeague({mode:'commish',size:30});const bench=P.teams.map(t=>rosterOf(P,t).sort((a,b)=>b.ovr-a.ovr)[10]).filter(p=>p&&p.contract);bench.forEach(p=>p.contract.role={k:'starter',br:[]});
const top=P.teams.map(t=>rosterOf(P,t).sort((a,b)=>b.ovr-a.ovr)[0]).filter(p=>p.contract);top.forEach(p=>p.contract.role={k:'starter',br:[]});
for(let i=0;i<62;i++)simDay(P);const brokenB=bench.filter(p=>(p.contract.role.br||[]).length).length,brokenT=top.filter(p=>(p.contract.role.br||[]).length).length;
ok('promises: a bench player promised a start is let down; stars are not',brokenB>=bench.length*0.7&&brokenT<=2,brokenB+'/'+bench.length+' bench, '+brokenT+'/'+top.length+' stars');
ok('broken promise shows in morale',bench.filter(p=>p.moraleParts&&p.moraleParts.promise===-8).length>=bench.length*0.5);
// seasons: odds vs results, incentives paid, AI trades still fine
const M=newLeague({mode:'commish',size:30});let pw=0,fav=0;const tr=[];for(let y=0;y<N;y++){const pre=seasonOdds(M);const n0=(M.trades||[]).length;SEASON(M,false);const ov=oddsVsResult(M,M.season);pw+=ov.title.pWon;if(ov.title.fav.tid===ov.title.won)fav++;tr.push(M.trades.filter(x=>x.s===M.season).length);startNewSeason(M);}
info.push('title: champion had '+(pw/N*100).toFixed(1)+'% preseason on average (random 3.3%), favorite won '+fav+'/'+N+'; trades '+tr.join('/'));
ok('odds beat random for the champion',pw/N>0.06);
ok('preseason odds made at season start',!!(M.odds[M.season]&&M.odds[M.season].pre));
info.push('ms '+(Date.now()-t0));
return res.join('\\n')+'\\n--\\n'+info.join('\\n');})(${+process.argv[2]||3})`));
