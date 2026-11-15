// v27 NBA mode checks: node tools/t27.js
const {run}=require('./load.js')(process.env.SRC||'src',+process.env.SEED||3);
console.log(run(`(()=>{const out=[];let ok=0,n=0;const chk=(c,m)=>{n++;if(c)ok++;else out.push('FAIL '+m);};
const L=newLeague({mode:'team',userTeam:0,nba:true});const T=ab=>L.teams.find(t=>t.abbr===ab);const P=nm=>Object.values(L.players).find(p=>p.name===nm);
chk(L.teams.length===30&&L.nba===1,'30 real teams');
chk(T('BOS').conf==='North'&&T('LAL').conf==='South'&&confName('North',L)==='East'&&confName('South',L)==='West','East/West');
chk(T('BOS').div==='Atlantic'&&T('DEN').div==='Northwest'&&new Set(L.teams.map(t=>t.div)).size===6,'6 divisions');
chk(L.teams.every(t=>L.teams.filter(u=>u.div===t.div).length===5),'5 per division');
const b=T('BOS'),sch=L.schedule.flat?L.schedule.flat():[];const g=L.schedule.reduce((a,d)=>a.concat(d),[]);const vs=ab=>g.filter(x=>(x[0]===b.id&&x[1]===T(ab).id)||(x[1]===b.id&&x[0]===T(ab).id)).length;
chk(vs('NYK')===4&&vs('LAL')===2,'schedule div 4 / other conf 2 (got '+vs('NYK')+'/'+vs('LAL')+')');
chk(g.filter(x=>x[0]===b.id||x[1]===b.id).length===82,'82 games');
chk(CAP===165&&TAXLINE===200.4&&APRON===221.7&&MLE===15&&MINPAY===148.5,'CBA numbers');
chk(rookieScale(1,1,30)===14.8&&rookieScale(1,30,30)===2.9&&rookieScale(2,40,30)===MINSAL,'rookie scale');
chk(Math.abs(maxFor({svc:3,awards:[]})-41.25)<0.01&&Math.abs(maxFor({svc:10,awards:[]})-57.75)<0.01,'max tiers 25/35%');
const jok=P('Nikola Jokic'),sga=P('Shai Gilgeous-Alexander'),wem=P('Victor Wembanyama');
chk(jok&&jok.ovr>=88&&sga.ovr>=88&&wem.pot>=95,'stars rated as stars');
chk(L.teams.every(t=>t.roster.length<=15&&t.roster.length>=13),'roster sizes');
chk(L.teams.every(t=>(t.twoWay||[]).length<=2),'two-way max');
chk(sga.contract.amt===40.8&&capHit(L,sga,L.season+1)===60.8,'SGA real contract + next-year amount');
const pay=L.teams.map(t=>payroll(L,t)),avg=pay.reduce((a,b)=>a+b,0)/30;chk(avg>170&&avg<215,'payroll avg '+avg.toFixed(1));
const lal=T('LAL');chk(lal.coach&&lal.coach.name.length>3,'coaches');
chk(Object.values(L.players).filter(p=>p.real).length>=440,'real players');
const ages=Object.values(L.players).filter(p=>p.real);chk(P('LeBron James').age===41&&P('LeBron James').team===T('PHI').id,'LeBron 41 on PHI');
chk(L.players[b.roster[0]].nat!=null&&P('Nikola Jokic').nat==='RS','nationality');
chk(seasonName(L.season)==='2026-27','2026-27 season');
// save / load round trip keeps NBA rules
const L2=JSON.parse(JSON.stringify(L));migrateLeague(L2);setSeasonLen(L2);for(let i=0;i<3;i++)simDay(L2);chk(L2.nba&&CAP===165&&L2.teams[0].w+L2.teams[0].l>0,'save/load + sim');
const nm=(()=>{const c={};for(let i=0;i<200;i++){const x=genIdentity(new Set());c[x[1]]=(c[x[1]]||0)+1}return (c.US||0)})();chk(nm>100,'NBA name mix mostly US ('+nm+'/200)');
// v27 N7: NBA text file is valid and used
chk(typeof NBA_TEXT==='object'&&typeof NBA_TEXT.setup==='string'&&NBA_TEXT.setup.length<400&&Array.isArray(NBA_TEXT.how)&&NBA_TEXT.how.every(x=>typeof x==='string'&&x.length<=140),'NBA_TEXT shape / lengths');
chk(Object.keys(NBA_TEXT.flavor).every(k=>FLAVOR[k]&&NBA_TEXT.flavor[k].every(t=>{const need=new Set((FLAVOR[k][0].match(/\{\w+\}/g)||[]));const has=t.match(/\{\w+\}/g)||[];return has.every(v=>need.has(v))&&t.length<=140;})),'NBA_TEXT.flavor keys exist, same vars');
// v27 R1 / P1-P4
chk(Object.values(L.players).filter(p=>p.real&&p.uf).length>200&&Object.values(L.players).every(p=>!p.uf||(p.uf>=0.5&&p.uf<=2.2)),'real usage multipliers');
const fl=P('Cooper Flagg');chk(fl&&fl.pot>=fl.ovr+8&&fl.peak>=25,'young star has room to grow');
const dyb=P('AJ Dybantsa');chk(dyb&&dyb.ovr>=58&&dyb.pot>=88,'top rookie rated by slot ('+(dyb&&dyb.ovr)+'/'+(dyb&&dyb.pot)+')');
const lbj=P('LeBron James'),mid=P('Jalen Brunson');chk(lbj.age>=35&&typeof nbaAgeAdj==='function'&&nbaAgeAdj(30)===0&&nbaAgeAdj(28)===0&&nbaAgeAdj(36)<0&&nbaAgeAdj(21)>0,'age nudge only <=23 / >=35');
{const c0=Object.values(L.players).filter(p=>p.ovr>=75&&!p.prospect).length;nbaBalance(L,{});const c1=Object.values(L.players).filter(p=>p.ovr>=75&&!p.prospect).length;chk(Math.abs(c1-c0)<=8,'balance step is small ('+c0+'->'+c1+')');}
// v27 L2 / L3
{const cu=P('Stephen Curry'),kd=P('Kevin Durant'),gs=T('GSW');refreshTradeStatus(L);const sc=tradeStatus(L,cu),sk=tradeStatus(L,kd);
chk(iconTier(L,cu)===2&&iconTier(L,P('Nikola Jokic'))===2&&iconTier(L,P('Jalen Brunson'))===1&&iconTier(L,kd)===0,'icon tiers');
chk(sc&&sc.k==='protect'&&sc.why==='Franchise icon','Curry protected as icon');chk(!sk||sk.k!=='protect'||sk.why!=='Franchise icon','Durant not an icon');
gs.mode='tank';gs.status='tank';refreshTradeStatus(L);chk(tradeStatus(L,cu).why==='Franchise icon','icon protected even when tanking');}
// v27 K1 / K2 / K5
{const c=T('DEN').coach;chk(c.sl&&SL_KEYS.every(k=>c.sl[k]>=0&&c.sl[k]<=100),'coach sliders present');
const old={...c};delete old.sl;const z=slD(old);chk(SL_KEYS.every(k=>z[k]===0),'no sliders = system defaults (old saves unchanged)');
const c2=JSON.parse(JSON.stringify(c));slSet(c2,'depth',0);chk(c2.depth===7,'depth slider -> rotation 7');slSet(c2,'depth',100);chk(c2.depth===11,'depth slider -> rotation 11');
slSet(c2,'pace',100);const p1=c2.pace;slSet(c2,'pace',0);chk(p1-c2.pace>=13,'pace slider moves tempo');
const sh=Object.values(L.players).filter(p=>p.real&&p.team!=null).sort((a,b)=>(b.tp-b.fin)-(a.tp-a.fin))[0];const c3=JSON.parse(JSON.stringify(c));slSet(c3,'three',0);const f0=fit(sh,c3);slSet(c3,'three',100);const f1=fit(sh,c3);chk(f1>f0,'three slider raises a shooter fit ('+f0+'->'+f1+')');
const c4=JSON.parse(JSON.stringify(c));c4.cov='blitz';chk(coachCov(c4)==='blitz','coach coverage setting');}
// fictional league unchanged
const F=newLeague({mode:'commish'});chk(!F.nba&&CAP===150&&TAXLINE===160&&F.teams[0].conf==='North'&&confName('North',F)==='North','fictional league keeps its rules');
// v27 H1: real NBA history
{const H=nbaHist();chk(H.length===80&&H[0].y===1946&&H[79].y===2025,'80 real seasons');
const last=H[79];chk(last.champ==='NYK'&&last.ru==='SAS'&&last.fmvp==='Jalen Brunson'&&last.mvp==='Shai Gilgeous-Alexander'&&last.roy==='Cooper Flagg','2025-26 row');
chk(nbaRealTitles(L,T('BOS')).length===18&&nbaRealTitles(L,T('LAL')).length===17&&nbaRealTitles(L,T('GSW')).length===7&&nbaRealTitles(L,T('NYK')).length===3,'title counts BOS18 LAL17 GSW7 NYK3 (got '+['BOS','LAL','GSW','NYK'].map(a=>nbaRealTitles(L,T(a)).length)+')');
chk(nbaRealTitles(L,T('CHA')).length===0&&nbaTitlesAll(L,T('BOS'))===18,'no titles CHA / total');
chk(nbaAwardLeaders('mvp',1)[0][0]==='Kareem Abdul-Jabbar'&&nbaAwardLeaders('mvp',1)[0][1]===6,'most MVPs Kareem 6');
const sh=nbaRealHonors('Shai Gilgeous-Alexander');chk(sh.find(x=>x.k==='mvp').ys.join()==='2024,2025'&&sh.find(x=>x.k==='fmvp').ys.length===1,'SGA real honors');
chk(nbaRealHonors('Grant Hill').some(x=>x.k==='roy'),'shared ROY split');
chk(H.every(h=>h.champ&&h.ru),'every season has finalists');
const L3=JSON.parse(JSON.stringify(L));chk(!JSON.stringify(L3).includes('Woody Sauldsberry'),'history not in save');}
// v27 U4: real 2027 class
{const c=L.classes[L.season].map(id=>L.players[id]),n=c.filter(p=>p.board27);chk(n.length===60&&L.classType[L.season]==='flat'&&!c.some(p=>p.gen),'2027 class named (60), flat, no generational');
const st=n.find(p=>p.name==='Tyran Stokes'),kr=n.find(p=>p.name==='Motiejus Krivas');chk(st&&POS[st.pos]==='SF'&&st.hgt===80&&st.age===19&&kr&&kr.hgt===86&&kr.nat==='LT','prospect bio (Stokes, Krivas)');
const m=mockOrder(L,L.season).slice(0,10);chk(m.filter(p=>p.board27&&p.board27<=20).length>=6,'mock top 10 mostly board top 20');
chk(n.every(p=>Number.isInteger(p.pot)&&p.pot>p.ovr&&p.prospect&&p.draftYear===L.season),'prospect ratings sane');}
// v27 U8: realism inputs
chk(L.teams.every(t=>t.coach.ovr>=50&&t.coach.ovr<=75)&&T('MIA').coach.age===55&&L.coachPool.length>=10,'real coach ratings 50-75, real ages, coach pool');
chk(P('Tyrese Haliburton').ovr>=78&&P('Jayson Tatum').ovr>=82,'returning stars rated from their usual level');
chk(ENG.teamNight>0&&SYS_SHOT_NBA.pace.tp<SYS_SHOT.pace.tp,'NBA team-night variance and softer system shot mix');
// v27 U12/U13
{const c=P('Cade Cunningham'),q=JSON.parse(JSON.stringify(c));progressPlayer(q,null,L.season);chk(c.keepPos===c.pos&&q.pos===c.pos&&ovr(q)>=c.ovr-3,'real PG keeps his position (no first-summer drop)');
const j=JSON.parse(JSON.stringify(P('Nikola Jokic')));j.regStart=32;const o0=ovr(j);regressYear(j,33);chk(o0-ovr(j)<=3,'star decline is gentle in year 1 ('+(o0-ovr(j))+')');
chk(NBA_BAL.oldAge===32&&NBA_BAL.t75===29,'balance targets');}
// v27 H3: real careers
{const lb=P('LeBron James'),cu=P('Stephen Curry'),ta=P('Jayson Tatum');
chk(nbaRealRows(lb).length===23&&nbaRealRows(lb)[0].season==='2003-04'&&nbaRealRows(lb)[22].pts===1256,'LeBron 23 real seasons');
chk(cu.awards.filter(a=>a.real&&a.a==='MVP').length===2&&cu.awards.filter(a=>a.a==='Champion').length===4&&cu.awards.find(a=>a.a==='MVP').s===-11,'Curry real awards (2 MVP, 4 titles, 2014-15 = s-11)');
chk(nbaRealRows(ta).every(r=>r.ws==null&&r.ts>0.5),'Tatum advanced dropped, TS from totals');
chk(legacyScore(cu,null)>=hofMin(L)&&hofCredentials(cu,L),'Curry is a Hall of Famer on real career');
chk(Object.values(L.players).filter(p=>p.real&&NBA_CAR[p.name]).length===69,'69 stars with real careers');
const rp=Object.values(L.players).find(p=>p.real&&!NBA_CAR[p.name]&&!NBA_CAR2[p.name]&&p.svc>=2&&nbaPastRows(p).length>=2),er=nbaPastRows(rp);chk(er.length>=2&&er.slice(0,-1).every(r=>r.est)&&!er[er.length-1].est&&er.every(r=>r.pts===2*r.fgm+r.tpm+r.ftm||!r.est),'role player: est rows + real 2025-26 ('+rp.name+')');
const rq=Object.values(L.players).find(p=>p.real&&NBA_CAR2[p.name]&&p.svc>=5),eq=nbaPastRows(rq);chk(eq.length>=2&&eq.every(r=>!r.est),'matched role player: real rows only ('+rq.name+')');
chk(nbaLegends().length===77&&nbaLegends().find(x=>x.name==='Michael Jordan').hof===2009,'77 legends');
chk(!JSON.stringify(L).includes('2003-04'),'real rows not in the save');}
// v27 N8
{chk(['sit','normal','ride'].includes(coachLate({id:2}).ft)&&Array.from({length:200},(_,i)=>coachLate({id:i+1}).ft).every(x=>x),'coachLate: every coach has a foul-trouble habit');
chk(realHofCase(P('Rudy Gobert'))&&realHofCase(P('Klay Thompson'))&&realHofCase(P('Damian Lillard'))&&!realHofCase(P('DeMar DeRozan'))&&!realHofCase(P('Devin Booker')),'real HOF case (Gobert, Klay, Lillard yes; DeRozan, Booker no)');
const T=JSON.parse(JSON.stringify(L));const g=Object.values(T.players).find(p=>p.name==='Rudy Gobert');removeFromTeam(T,g);g.hist=[];retirePlayer(T,g,'unsigned');honorRetired(T,g);
chk(T.players[g.id]&&T.players[g.id].hof!=null,'unsigned real retiree kept + reviewed for HOF (Gobert)');}
return ok+'/'+n+(ok===n?' pass':'')+(out.length?'\\n'+out.join('\\n'):'')})()`));
