// v28.7: SRC=src SEED=n FAST=1 NBA=1 node tools/auto.js [seasons] -> autopilot run in team mode, checks user team handled by AI, restore
const {run}=require('./load.js')(process.env.SRC||'src',+process.env.SEED||1);
console.log(run(`(function(N){const out=[];let ok=0,bad=0;const chk=(n,c,x)=>{if(c)ok++;else bad++;out.push((c?'PASS ':'FAIL ')+n+(x!=null?' :: '+x:''));};
const L=newLeague({mode:'team',size:30,userTeam:3,games:82${process.env.NBA?',nba:true':''}});
const u=L.user;const t0=Date.now();autoBegin(L,N,${process.env.FAST?'true':'false'});
chk('user handed to AI',L.user===null&&L.auto.user===u);
let g=0;while(autoStep(L)&&g++<200000){}
const sum=autoEnd(L);
chk('finished at off-ready',L.phase==='off-ready',L.phase+' s'+L.season);
chk('seasons done',sum.rows.length===N,sum.rows.length);
chk('user restored',L.user===u&&L.mode==='team');
chk('user team has no AI GM',!L.teams[u].gm);
const t=L.teams[u];chk('roster 13-15',t.roster.length>=13&&t.roster.length<=15,t.roster.length);
chk('moves recorded',sum.moves.length>0,sum.moves.length);
chk('no auto left',!L.auto);
out.push('rows '+JSON.stringify(sum.rows.map(r=>[r.s,r.w+'-'+r.l,r.res,r.status,r.best&&r.best.o])));
out.push('moves sample '+JSON.stringify(sum.moves.slice(0,6).map(m=>m.text.slice(0,80))));
out.push('ms/season '+Math.round((Date.now()-t0)/N)+' steps '+sum.steps+' save KB '+Math.round(JSON.stringify(L).length/1024)+' feed '+(L.feed||[]).length);
// continue normally: start new season as user
startNewSeason(L);chk('new season starts with user',L.phase==='regular'&&L.user===u);
for(let i=0;i<10;i++)simDay(L);chk('sims as user',L.day>=10);
out.push(ok+' pass, '+bad+' fail');return out.join('\\n');})(${+process.argv[2]||2})`));
