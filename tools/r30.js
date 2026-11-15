// v30 review: long sims with metrics. SRC=src SEED=n NBA=1 MODE=commish|team node tools/r30.js [seasons]
// Prints one JSON line per season (prefix "S ") and a summary ("SUM "). Works on pre-v30 code too (v30 hooks guarded).
const {run,ctx}=require('./load.js')(process.env.SRC||'src',+process.env.SEED||1);
const N=+process.argv[2]||20, NBA=(process.env.NBA||'1')==='1', MODE=process.env.MODE||'commish';
run(`var R30={inj:{rs:0,po:0,rsG:0,poG:0},tw:{calls:0,no:0,pw:new Map(),noP:new Set(),askP:new Set(),byPh:{},byWhy:{}},err:[]};
(function(){const ai=addInjury;addInjury=function(p,med){const n=ai(p,med);const po=LCUR&&LCUR.phase==='playoffs';R30.inj[po?'po':'rs']++;R30.inj[po?'poG':'rsG']+=n;return n;};
if(typeof twWillSign==='function'){const tw=twWillSign;twWillSign=function(L,p){const r=tw(L,p);const k=L.phase+(L.phase==='regular'?(L.day>totalDays(L)*0.5?'-late':'-early'):'');const b=R30.tw.byPh[k]=R30.tw.byPh[k]||[0,0];b[0]++;R30.tw.calls++;R30.tw.askP.add(p.id);R30.tw.pw.set(p.id+':'+L.season+':'+L.phase+':'+Math.floor((L.day||0)/7),r.ok?1:0);if(!r.ok){b[1]++;R30.tw.no++;R30.tw.noP.add(p.id);R30.tw.byWhy[r.k]=(R30.tw.byWhy[r.k]||0)+1;}return r;};}
})();var LCUR=null;`);
const out=run(`(function(N){
const L=newLeague({mode:'${MODE}',size:${+process.env.SIZE||30},userTeam:${MODE==='team'?5:'undefined'},games:82${NBA?",nba:true":""}});LCUR=L;
const U=L.user, rows=[], t00=Date.now();
const iv={seasons:[],dupKeys:0,dupText:0,stages:{}};
const ivSeen=new Map();const answerIv=()=>{const I=L.iv;if(!I||I.done)return;for(const q of I.qs){const tx=ivText(L,q);const k=I.s+'|'+tx;if(ivSeen.has(k))iv.dupText++;ivSeen.set(k,1);const an=ivAnswers(L,q);if(new Set(an).size<an.length)iv.dupAns=(iv.dupAns||0)+1;}for(let i=0;i<I.qs.length;i++){try{ivAnswer(L,i,Math.floor(Math.random()*4));}catch(e){R30.err.push('ivAnswer '+e.message);}}};
const benchLine=()=>{const v=L.teams.map(t=>t.roster.map(id=>L.players[id]).filter(Boolean).map(p=>p.ovr).sort((a,b)=>b-a)[12]).filter(x=>x!=null).sort((a,b)=>a-b);return v[Math.floor(v.length/2)]||45;};
const seasonStart=()=>{const bl=benchLine();const fa=(L.fa||[]).map(id=>L.players[id]).filter(p=>p&&!p.retired&&!p.prospect);
 return {fa:fa.length,faOverBench:fa.filter(p=>p.ovr>=bl).length,faNear:fa.filter(p=>p.ovr>=bl-3).length,bench:bl,faTop:fa.sort((a,b)=>b.ovr-a.ovr).slice(0,3).map(p=>p.name+' '+p.ovr+' a'+p.age+(R30.tw.noP.has(p.id)?' (TWno)':'')),
  twRejUnsigned:fa.filter(p=>R30.tw.noP.has(p.id)).length,
  rosterBad:L.teams.filter(t=>t.roster.length<13||t.roster.length>15).map(t=>t.abbr+':'+t.roster.length),
  twFill:L.teams.reduce((a,t)=>a+(t.twoWay||[]).length,0),
  twDiag:(()=>{const e=(L.fa||[]).map(id=>L.players[id]).filter(p=>p&&twEligible(L,p));const t0=L.teams.find(t=>t.id!==L.user)||L.teams[0];const v=e.map(p=>0.6*teamPotEst(L,t0.id,p).est+0.4*p.ovr);
   const tw=L.teams.flatMap(t=>(t.twoWay||[]).map(id=>L.players[id])).filter(Boolean);
   return {elig:e.length,pass48:v.filter(x=>x>=48).length,eligOvr:e.length?+(e.reduce((a,p)=>a+p.ovr,0)/e.length).toFixed(1):null,young:e.filter(p=>p.age<=23).length,
    twAge:tw.length?+(tw.reduce((a,p)=>a+p.age,0)/tw.length).toFixed(1):null,lgOvr:+(Object.values(L.players).filter(p=>p.team!=null&&!p.retired).reduce((a,p,_,A)=>a+p.ovr/A.length,0)).toFixed(1),
    svc3:(L.fa||[]).map(id=>L.players[id]).filter(p=>p&&!p.retired&&p.age<=27&&!p.tw&&twSvc(p)>=3).length};})()};};
const jersey=()=>{let dup=[],none=0;for(const t of L.teams){const ids=[...t.roster,...(t.twoWay||[])];const seen={};for(const id of ids){const p=L.players[id];if(!p)continue;if(p.num==null||p.num===''){none++;continue;}const k=String(p.num);if(seen[k])dup.push(t.abbr+' #'+k+' '+seen[k]+'/'+p.name);else seen[k]=p.name;}}return {dup,none};};
const weird=()=>{const w=[];const on=new Map();for(const t of L.teams)for(const id of t.roster){if(on.has(id))w.push('dup roster '+id);on.set(id,t.id);const p=L.players[id];if(!p)w.push('missing player '+id);else{if(p.team!==t.id)w.push('team mismatch '+p.name);if(!(p.ovr>=1&&p.ovr<=99))w.push('bad ovr '+p.name+' '+p.ovr);if(p.retired)w.push('retired on roster '+p.name);}}
 for(const id of L.fa||[]){const p=L.players[id];if(p&&p.team!=null)w.push('FA with team '+p.name);}for(const t of L.teams)if(!t.coach)w.push('no coach '+t.abbr);return w;};
for(let y=1;y<=N;y++){const t0=Date.now();R30.inj={rs:0,po:0,rsG:0,poG:0};const tw0={calls:R30.tw.calls,no:R30.tw.no};const row={s:L.season};
 try{
 row.start=seasonStart();row.jerseyStart=jersey();
 let g=0;while(L.phase==='regular'&&g++<400){simDay(L);answerIv();}
 row.twFillEnd=L.teams.reduce((a,t)=>a+(t.twoWay||[]).length,0);
 processPending(L);startPlayoffs(L);g=0;while(L.phase==='playoffs'&&g++<400){simPlayoffDay(L);answerIv();}
 // series lengths (skip play-in)
 const sl={};let poGames=0;L.po.rounds.forEach((r,i)=>{const st=poStages(L)[i];for(const s of r){const n=s.hw+s.lw;poGames+=n;if(/Play-in/.test(st))continue;(sl[st]=sl[st]||[]).push(n+'/'+s.best);}});row.series=sl;row.poGames=poGames;
 row.champ=L.teams[L.po.champion].abbr;
 // playoff load: top 10 ovr players' playoff minutes
 const top=Object.values(L.players).filter(p=>!p.retired&&p.team!=null).sort((a,b)=>b.ovr-a.ovr).slice(0,10);
 row.top10PoMin=Math.round(top.reduce((a,p)=>a+((p.stats.po&&p.stats.po.min)||0)/60,0));row.top10RsMin=Math.round(top.reduce((a,p)=>a+((p.stats.rs&&p.stats.rs.min)||0)/60,0));
 row.injSeason=Object.assign({},R30.inj);
 row.injuredNow=Object.values(L.players).filter(p=>!p.retired&&p.team!=null&&p.injury>0).length;
 startOffseason(L);
 const A=L.awards[L.season]||{};const rp=A.roy!=null?L.players[A.roy&&A.roy.pid!=null?A.roy.pid:A.roy]:null;
 row.roty=rp?{n:rp.name,real:!!rp.real,draft:rp.draft?(rp.draft.rd+'-'+rp.draft.no+' s'+rp.draft.s):'none',ovr:rp.ovr,age:rp.age,rookieSeason:rp.rookieSeason}:null;
 runLottery(L);startDraft(L);
 if(U!=null){answerIv();L.user=null;}
 g=0;while(L.phase==='off-draft'&&g++<200)aiDraftPick(L);
 if(L.phase==='off-resign')startFA(L);g=0;while(L.phase==='off-fa'&&g++<60)faDay(L);processPending(L);
 if(U!=null)L.user=U;
 if(L.ivUsed){const ks=L.ivUsed.ks;const d=ks.length-new Set(ks).size;iv.dupKeys+=d;iv.seasons.push(ks.length);}
 if(L.ivDone)for(const k in L.ivDone)if(k.startsWith(L.season+':')){const st=k.split(':')[1];iv.stages[st]=(iv.stages[st]||0)+(L.ivDone[k]>0?1:0);}
 row.jerseyOff=jersey();
 startNewSeason(L);
 row.twCalls=R30.tw.calls-tw0.calls;row.twNo=R30.tw.no-tw0.no;
 row.weird=weird();
 }catch(e){R30.err.push('S'+L.season+' '+String(e.stack).slice(0,300));row.err=String(e.message);console.log('S '+JSON.stringify(row));break;}
 row.ms=Date.now()-t0;row.kb=Math.round(JSON.stringify(L).length/1024);
 console.log('S '+JSON.stringify(row));
}
// interview text repeats: check every season's questions via the feed/log not stored; use ivUsed keys only
return {ms:Date.now()-t00,tw:{pw:R30.tw.pw.size,pwNo:[...R30.tw.pw.values()].filter(v=>v===0).length,calls:R30.tw.calls,no:R30.tw.no,players:R30.tw.askP.size,noPlayers:R30.tw.noP.size,byPh:R30.tw.byPh,byWhy:R30.tw.byWhy},iv,err:R30.err.slice(0,10)};
})(${N})`);
console.log('SUM '+JSON.stringify(out));
