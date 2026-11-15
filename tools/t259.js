// v25.9 checks: SRC=src SEED=n node tools/t259.js [seasons]  (traits, migration, yearly change, tiers, comps, playstyle, reports)
const {run}=require('./load.js')(process.env.SRC||'src',+process.env.SEED||5);
run(`function SEASON(L,next){let g=0;while(L.phase==='regular')simDay(L);processPending(L);startPlayoffs(L);while(L.phase==='playoffs'&&g++<400)simPlayoffDay(L);
 startOffseason(L);runLottery(L);startDraft(L);g=0;while(L.phase==='off-draft'&&g++<200)aiDraftPick(L);startFA(L);g=0;while(L.phase==='off-fa'&&g++<40)faDay(L);processPending(L);if(next!==false)startNewSeason(L);}`);
console.log(run(`(function(N){const res=[],info=[];const ok=(n,c,x)=>res.push((c?'PASS ':'FAIL ')+n+(x!=null?'  ['+x+']':''));
const K=['loy','mon','win','mot','cch'];const st=(ps,k)=>{const v=ps.map(p=>trv(p,k));const m=v.reduce((a,b)=>a+b,0)/v.length;return [Math.round(m),Math.round(Math.sqrt(v.reduce((a,b)=>a+(b-m)*(b-m),0)/v.length))];};
const t0=Date.now();const L=newLeague({mode:'${process.env.MODE||'team'}',userTeam:0,size:30});
let ps=active(L).filter(p=>!p.prospect);
ok('every player has 5 traits in 10-99',ps.every(p=>p.tr&&K.every(k=>p.tr[k]>=10&&p.tr[k]<=99)));
const lab={};ps.forEach(p=>lab[p.pers]=(lab[p.pers]||0)+1);info.push('labels '+JSON.stringify(lab));
const s0=Object.fromEntries([...K,'wrk','dur'].map(k=>[k,st(ps,k)]));info.push('start mean/sd '+JSON.stringify(s0));
ok('a money-first player is not only money (his winning/loyalty still vary)',(()=>{const m=ps.filter(p=>p.pers==='Money');return m.length>10&&st(m,'win')[1]>=8;})());
// migration of an old save
const C=JSON.parse(JSON.stringify(L));for(const p of Object.values(C.players)){delete p.tr;p.pers=['Loyal','Money','Winner','Balanced'][p.id%4];}delete C.v259;
const C2=JSON.parse(JSON.stringify(C));migrateLeague(C);migrateLeague(C2);
ok('old save gets traits',Object.values(C.players).every(p=>p.tr&&K.every(k=>p.tr[k]>=10)));
ok('migration is the same every load',Object.values(C.players).every(p=>K.every(k=>p.tr[k]===C2.players[p.id].tr[k])));
ok('old Money label keeps a high money trait',(()=>{const m=Object.values(C.players).filter(p=>p.id%4===1);return st(m,'mon')[0]>=68;})(),st(Object.values(C.players).filter(p=>p.id%4===1),'mon')[0]);
// seasons
const yrs=[];for(let y=0;y<N;y++){SEASON(L);ps=active(L).filter(p=>!p.prospect);yrs.push(Object.fromEntries(K.map(k=>[k,st(ps,k)[0]])));}
info.push('means by season '+JSON.stringify(yrs));
ok('trait means stay steady over the seasons (within 4)',K.every(k=>Math.abs(yrs[yrs.length-1][k]-s0[k][0])<=4));
const logs=ps.flatMap(p=>(p.trLog||[]));const why={};logs.forEach(x=>why[x.why]=(why[x.why]||0)+1);info.push('trait changes '+logs.length+' by reason '+JSON.stringify(why));
ok('trait changes are logged with a reason',logs.length>50&&logs.every(x=>TR_WHY[x.why]));
const yb=L.yearbook[L.season-1];ok('yearbook has trait changes',yb&&L.teams.every(t=>Array.isArray(yb[t.id].traits))&&L.teams.some(t=>yb[t.id].traits.length),yb?L.teams.reduce((a,t)=>a+yb[t.id].traits.length,0):0);
const fc=L.faChoice||{};info.push('FA choices [n, took less money, paid over ask] '+JSON.stringify(fc));
// tiers
const cuts=tierCuts(L);info.push('tier cuts '+cuts.join('/'));ok('tier cuts go up',cuts.every((c,i)=>!i||c>cuts[i-1]));
const tn={};ps.filter(p=>p.team!=null).forEach(p=>{const t=TIERS[tierNow(L,p)];tn[t]=(tn[t]||0)+1;});info.push('tiers now '+JSON.stringify(tn));
const mvp=Object.values(L.players).find(p=>(p.awards||[]).some(a=>a.a==='MVP'));ok('an MVP winner is MVP tier',mvp&&careerTier(L,mvp)===6);
// comps
const pros=active(L).filter(p=>p.prospect).sort((a,b)=>b.scout-a.scout);const cs=pros.slice(0,30).map(p=>compsFor(L,0,p));
ok('comps: floor and ceiling with league + NBA names',cs.every(c=>c.floor.league&&c.ceil.league&&c.floor.nba&&c.ceil.nba&&c.floor.tier<=c.ceil.tier&&c.floor.league.pid!==c.ceil.league.pid));
ok('comps: NBA names differ when tiers differ',cs.every(c=>c.floor.tier===c.ceil.tier||c.floor.nba.name!==c.ceil.nba.name));
info.push('comps #1-3: '+cs.slice(0,3).map((c,i)=>pros[i].name+' '+c.key+' floor '+c.floor.ovr+' '+c.floor.tierN+' ('+c.floor.league.name+' / '+c.floor.nba.name+') ceil '+c.ceil.ovr+' '+c.ceil.tierN+' ('+c.ceil.league.name+' / '+c.ceil.nba.name+')').join(' | '));
ok('every type has NBA comps',Object.keys(ARCH).every(pos=>Object.keys(ARCH[pos]).every(n=>NBA_COMPS[pos+'|'+n])));
// playstyle + reports
const rot=ps.filter(p=>p.team!=null);const pl=rot.map(p=>playstyleOf(L,p)).filter(Boolean);
ok('playstyle lines filled',pl.length===rot.length&&pl.every(x=>x.text&&!/[{}]|undefined/.test(x.text)));
const pk={};pl.forEach(x=>pk[x.key]=(pk[x.key]||0)+1);info.push('playstyle keys '+JSON.stringify(pk));
const rp=rot.map(p=>playerReport(L,p,0));ok('every rostered player has a report',rp.every(r=>r&&r.slots.length>=3&&!/[{}]|undefined|NaN/.test(r.text)));
const best=L.teams[0].roster.map(id=>L.players[id]).sort((a,b)=>b.ovr-a.ovr)[0];info.push('report: '+best.name+': '+playerReport(L,best,0).text);
const yng=rot.filter(p=>p.age<=22).sort((a,b)=>b.pot-a.pot)[0];info.push('report: '+yng.name+': '+playerReport(L,yng,0).text);
ok('traitsView: 4 off, 3 on',(()=>{const v=traitsView(L,0,best);return v.off.length===4&&v.on.length===3;})());
const pro=pros[0];ok('prospect traits unknown until interviewed',trRead(L,0,pro,'mon').lv===0);
info.push('ms '+(Date.now()-t0));
return res.join('\\n')+'\\n--\\n'+info.join('\\n');})(${+process.argv[2]||3})`));
