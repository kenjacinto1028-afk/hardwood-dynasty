// v27 K2: slider sweep. SEED=n node tools/k27.js [sliders,comma] [days]
// For each slider: 15 random teams set it to 100, the other 15 to 0; one regular season (or [days]); per team-game group averages (hi - lo) and win% gap.
const {run}=require('./load.js')(process.env.SRC||'src',+process.env.SEED||1);
const keys=(process.argv[2]||'three,rim,glass,pace,ball,gamble,help,depth').split(','), days=+process.argv[3]||999;
for(const k of keys){console.log(run(`(()=>{const L=newLeague({mode:'commish',nba:true,games:82});L.noTrades=1;const ids=L.teams.map(t=>t.id).sort(()=>Math.random()-0.5),hi=new Set(ids.slice(0,15));
for(const t of L.teams)slSet(t.coach,'${k}',hi.has(t.id)?100:0);
const S0={};for(const t of L.teams)S0[t.id]=teamStrength(L,t);let d=0;while(L.phase==='regular'&&d++<${days}){for(const t of L.teams)slSet(t.coach,'${k}',hi.has(t.id)?100:0);simDay(L);}
const g=(set,f)=>{const ts=L.teams.filter(t=>set(t)&&t.trs&&t.trs.g);return ts.reduce((a,t)=>a+f(t.trs,t),0)/ts.length;};
const H=t=>hi.has(t.id),Lo=t=>!hi.has(t.id);const m=[['pts',x=>x.pts/x.g],['opp',x=>x.opts/x.g],['3pa',x=>x.tpa/x.g],['fta',x=>x.fta/x.g],['orb',x=>x.orb/x.g],['tov',x=>x.tov/x.g],['otov',x=>x.otov/x.g],['ast',x=>x.ast/x.g],['opp3pa',x=>x.otpa/x.g],['fg%',x=>x.fgm/x.fga],['ofg%',x=>x.ofgm/x.ofga],['poss',x=>(x.fga+0.44*x.fta+x.tov-x.orb)/x.g],['win%',(x,t)=>t.w/(t.w+t.l)]];
return '${k}: '+m.map(([n,f])=>{const a=g(H,f),b=g(Lo,f),dd=a-b;return n+' '+(Math.abs(dd)<1?dd.toFixed(3):dd.toFixed(1))}).join(' | ')+' | wins/82 gap '+((g(H,(x,t)=>t.w/(t.w+t.l))-g(Lo,(x,t)=>t.w/(t.w+t.l)))*82).toFixed(1)+' | talent-adjusted gap '+(()=>{const ts=L.teams,xs=ts.map(t=>S0[t.id]),ys=ts.map(t=>t.w/(t.w+t.l)),mx=xs.reduce((a,b)=>a+b)/30,my=ys.reduce((a,b)=>a+b)/30;let sxy=0,sxx=0;ts.forEach((t,i)=>{sxy+=(xs[i]-mx)*(ys[i]-my);sxx+=(xs[i]-mx)**2;});const b=sxy/sxx,res=t=>t.w/(t.w+t.l)-(my+b*(S0[t.id]-mx));const r=f=>ts.filter(f).reduce((a,t)=>a+res(t),0)/15;return ((r(H)-r(Lo))*82).toFixed(1)})();})()`));}
