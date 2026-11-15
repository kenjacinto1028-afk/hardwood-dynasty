// coach targets + position read: SRC=src node tools/m4.js
const {run}=require('./load.js')(process.env.SRC||'src',+process.env.SEED||777);
console.log(run(`(function(){const L=newLeague({mode:'team',userTeam:0,size:30});const o=[];
for(let i=0;i<40;i++)simDay(L);
const t=L.teams.find(x=>x.mode==='tank'&&x.id!==L.user)||L.teams[5];L.user=t.id;
const ps=rosterOf(L,t).sort((a,b)=>b.scout-a.scout);const yng=ps.find(p=>p.age<=23)||ps[0];
o.push('team '+t.abbr+' status '+t.status+' goal: '+(t.owner&&t.owner.goal&&t.owner.goal.txt)+' lean '+planLean(t));
o.push('marking core: '+yng.name+' '+POS[yng.pos]+' age '+yng.age+' ovr '+yng.ovr+' scout '+yng.scout+' -> '+setCore(L,yng,true));
o.push('kept: '+keptSpots(L,t).map(k=>k.p.name+'('+POS[k.p.pos]+','+k.why+')').join(', '));
for(const tab of ['plan','now','dev']){o.push('-- '+tab);for(const x of coachTargets(L,t,'trade',tab))o.push('  '+x.p.name+' '+POS[x.p.pos]+(x.p.pos2!=null?'/'+POS[x.p.pos2]:'')+' age '+x.p.age+' ovr '+x.p.ovr+' est '+x.est+' | '+x.why);}
const overlap=['plan','now','dev'].flatMap(tab=>coachTargets(L,t,'trade',tab)).filter(x=>takesSpot(L,t,x.p,keptSpots(L,t)));o.push('overlaps with kept: '+overlap.length);
o.push('-- position read');for(const r of positionRead(L,t))o.push('  '+POS[r.pos]+' ['+r.status+'] '+r.line+' | '+r.archs.map(a=>a.n+' '+a.v+' ('+a.why+')').join('; '));
const c2=L.teams.find(x=>x.mode==='contend');o.push('-- contender '+c2.abbr+' plan tab');for(const x of coachTargets(L,c2,'trade','plan').slice(0,4))o.push('  '+x.p.name+' age '+x.p.age+' ovr '+x.p.ovr+' | '+x.why);
let t0=Date.now();for(const T of L.teams)for(const tab of ['plan','now','dev'])coachTargets(L,T,'trade',tab);o.push('90 target lists ms '+(Date.now()-t0));
return o.join('\\n');})()`));
