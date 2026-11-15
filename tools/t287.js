// v28.7: SEED=n node tools/t287.js [autoSeasons] -> locker room drama (1 season, team mode, you answer), autopilot run, dynasties / eras
const {run}=require('./load.js')(process.env.SRC||'src',+process.env.SEED||3);
console.log(run(`(function(N){const out=[];let ok=0,bad=0;const chk=(n,c,x)=>{if(c)ok++;else bad++;out.push((c?'PASS ':'FAIL ')+n+(x!=null?' :: '+x:''));};
const LL=newLeague({mode:'team',size:30,userTeam:5,games:${process.env.GAMES||82}${process.env.NBA?',nba:true':''}});const u=LL.user;let opened=0,answered=0;const fxs=[];
while(LL.phase==='regular'){simDay(LL);const ev=dramaOpen(LL);if(ev){opened++;const c=['talk','coach','discipline','player','ignore'][opened%5];const r=answerDrama(LL,c);if(r){answered++;fxs.push(c+':'+r.fx.h);}}}
const evs=LL.drama||[];chk('league had incidents',evs.length>=15,evs.length);
const kinds={};evs.forEach(e=>kinds[e.k]=(kinds[e.k]||0)+1);out.push('kinds '+JSON.stringify(kinds)+' | yours opened '+opened+' answered '+answered+' '+fxs.join(' '));
chk('all incidents have text',evs.every(e=>e.text&&!/[{}]/.test(e.text)&&!/undefined/.test(e.text)),evs.find(e=>!e.text||/[{}]/.test(e.text))?.text);
chk('AI incidents resolved',evs.filter(e=>e.tid!==u).every(e=>e.st==='done'));
const hv=LL.teams.map(t=>lrOf(t).v);chk('harmony in range',hv.every(v=>v>=0&&v<=100),Math.min(...hv)+'-'+Math.max(...hv));
out.push('harmony avg '+(hv.reduce((a,b)=>a+b,0)/hv.length).toFixed(1)+' labels '+JSON.stringify(LL.teams.slice(0,6).map(t=>lrLabel(lrOf(t).v))));
const withLocker=Object.values(LL.players).filter(p=>p.moraleParts&&p.moraleParts.locker!=null).length;chk('locker morale part used',withLocker>0,withLocker);
const posts=(LL.feed||[]).filter(p=>p.ev==='drama');chk('drama posts',posts.length>0,posts.length);chk('post text ok',posts.every(p=>{const t=postText(LL,p);return t&&!/[{}]/.test(t)}));
// finish season via autopilot for N seasons
autoBegin(LL,N,true);let g=0;while(autoStep(LL)&&g++<300000){}const sum=autoEnd(LL);
chk('autopilot finished',LL.phase==='off-ready'&&LL.user===u,LL.phase);chk('summary rows',sum.rows.length===N,sum.rows.length);
out.push('rows '+JSON.stringify(sum.rows.map(r=>[r.s,r.w+'-'+r.l,r.res])));
const D=dynasties(LL),W=dynWatch(LL),E=dynEras(LL);
chk('watch list',W.length>0,JSON.stringify(W.slice(0,3)));chk('eras',E.length>=1,JSON.stringify(E[0]));
out.push('dynasties '+JSON.stringify(D.slice(0,4).map(d=>[d.name,d.from,d.to,d.titles,d.tier,dynCore(LL,d,3).map(x=>x.name)])));
out.push('champs '+JSON.stringify(LL.history.map(h=>LL.teams[h.champion].abbr)));
out.push(ok+' pass, '+bad+' fail');return out.join('\\n');})(${+process.argv[2]||1})`));
