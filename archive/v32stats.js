// v32b: one regular season, rebound / block / minutes report. SRC=src SEED=21 NBA=1 node tools/v32stats.js [seasons]
const {run}=require('./load.js')(process.env.SRC||'src',+process.env.SEED||21);
const N=+process.argv[2]||1, NBA=(process.env.NBA||'1')==='1';
if(process.env.ENGX)run(`Object.assign(ENG,${process.env.ENGX})`);
run(`var TGT={};(function(){const bs=buildSide;buildSide=function(L,tid,h,po){const g=bs(L,tid,h,po);if(!po)for(const p of g.players){const k=(p.roleT===tid&&p.role)||'none';const o=TGT[k]=TGT[k]||[0,0];o[0]+=g.target[p.id]/60;o[1]++;}return g;};})();
var V32S=function(L){const ps=Object.values(L.players).filter(p=>p.stats&&p.stats.rs&&p.stats.rs.gp>=50);
const pg=(p,k)=>p.stats.rs[k]/p.stats.rs.gp;const rpg=p=>(p.stats.rs.orb+p.stats.rs.drb)/p.stats.rs.gp;
const top=(f,n)=>ps.slice().sort((a,b)=>f(b)-f(a)).slice(0,n).map(p=>p.name+' '+f(p).toFixed(1));
const mpg=p=>p.stats.rs.min/60/p.stats.rs.gp;
const roles={};if(typeof roleOf==='function')for(const p of Object.values(L.players)){if(!p.stats||!p.stats.rs||p.stats.rs.gp<20||p.team==null)continue;const r=p.role||'?';const o=roles[r]=roles[r]||[0,0];o[0]+=mpg(p);o[1]++;}
for(const k in roles)roles[k]=[+(roles[k][0]/roles[k][1]).toFixed(1),roles[k][1]];
// minutes rank per team (by mpg, gp>=20)
const rk=[];for(const t of L.teams){const r=t.roster.map(id=>L.players[id]).filter(p=>p.stats&&p.stats.rs&&p.stats.rs.gp>=20).map(mpg).sort((a,b)=>b-a);r.forEach((m,i)=>{(rk[i]=rk[i]||[]).push(m);});}
const all=Object.values(L.players).filter(p=>p.stats&&p.stats.rs);const tb=all.reduce((a,p)=>a+p.stats.rs.blk,0),tr=all.reduce((a,p)=>a+p.stats.rs.orb+p.stats.rs.drb,0),tg=L.teams.length*82;
return {tmBpg:+(tb/tg).toFixed(2),tmRpg:+(tr/tg).toFixed(1),n:ps.length,rpg9:ps.filter(p=>rpg(p)>=9).length,rpg10:ps.filter(p=>rpg(p)>=10).length,bpg15:ps.filter(p=>pg(p,'blk')>=1.5).length,bpg1:ps.filter(p=>pg(p,'blk')>=1).length,
 topR:top(rpg,20),topB:top(p=>pg(p,'blk'),12),topM:top(mpg,10),mpg36:ps.filter(p=>mpg(p)>=36).length,mpg34:ps.filter(p=>mpg(p)>=34).length,
 tgt:Object.fromEntries(Object.entries(TGT).map(([k,v])=>[k,+(v[0]/v[1]).toFixed(1)])),rankMpg:rk.slice(0,13).map(a=>+(a.reduce((x,y)=>x+y,0)/a.length).toFixed(1)),roles};};`);
const out=run(`(function(){const L=newLeague({mode:'commish',size:30,games:82${NBA?",nba:true":""}});const res=[];
for(let y=1;y<=${N};y++){let g=0;while(L.phase==='regular'&&g++<400)simDay(L);res.push(V32S(L));
 if(y<${N}){processPending(L);startPlayoffs(L);g=0;while(L.phase==='playoffs'&&g++<400)simPlayoffDay(L);startOffseason(L);runLottery(L);startDraft(L);g=0;while(L.phase==='off-draft'&&g++<200)aiDraftPick(L);if(L.phase==='off-resign')startFA(L);g=0;while(L.phase==='off-fa'&&g++<60)faDay(L);processPending(L);startNewSeason(L);}}
return JSON.stringify(res,null,1);})()`);
console.log(out);
