// v27 R1: one sim season vs real 2025-26 lines. SEED=n node tools/fit26.js
const {run}=require('./load.js')(process.env.SRC||'src',+process.env.SEED||1);
console.log(run(`(()=>{const L=newLeague({mode:'commish',nba:true});while(L.phase==='regular')simDay(L);
const by={};for(const p of Object.values(L.players))if(p.real)by[p.name]=p;const rows=[];
for(const ab in NBA26)for(const r of NBA26[ab].p){const s=r[11];if(!s||s[0]==null||s[2]==null||s[0]<20||s[2]<15)continue;const p=by[r[0]];if(!p||!p.stats||!p.stats.rs||!p.stats.rs.gp)continue;const t=p.stats.rs,g=t.gp;
rows.push({n:r[0],ab,tm:p.team!=null?L.teams[p.team].abbr:'FA',mt:s[0]*s[2],real:{mpg:s[2],pts:s[3],reb:s[4],ast:s[5],fg:s[9],tp:s[10],tpa:s[11]},sim:{mpg:t.min/60/g,pts:t.pts/g,reb:(t.orb+t.drb)/g,ast:t.ast/g,fg:t.fgm/Math.max(1,t.fga),tp:t.tpm/Math.max(1,t.tpa),tpa:t.tpa/g},gp:g,ovr:p.ovr});}
const st=k=>{const a=rows.map(x=>x.real[k]),b=rows.map(x=>x.sim[k]),n=a.length,ma=a.reduce((x,y)=>x+y,0)/n,mb=b.reduce((x,y)=>x+y,0)/n;let sab=0,saa=0,sbb=0,mae=0;for(let i=0;i<n;i++){sab+=(a[i]-ma)*(b[i]-mb);saa+=(a[i]-ma)**2;sbb+=(b[i]-mb)**2;mae+=Math.abs(a[i]-b[i]);}return k+' bias '+(mb-ma).toFixed(2)+' mae '+(mae/n).toFixed(2)+' r '+(sab/Math.sqrt(saa*sbb)).toFixed(2);};
const top=rows.slice().sort((a,b)=>b.mt-a.mt).slice(0,150);const ok=x=>{const w=(k,f)=>Math.abs(x.sim[k]-x.real[k])<=Math.max(f*x.real[k],k==='pts'?2:1);return w('pts',0.15)&&w('reb',0.15)&&w('ast',0.15)&&Math.abs(x.sim.fg-x.real.fg)<=0.03&&(x.real.tpa<1.5||Math.abs(x.sim.tp-x.real.tp)<=0.03)};
const okL=x=>Math.abs(x.sim.pts-x.real.pts)<=Math.max(0.2*x.real.pts,2.5);
const pass=top.filter(ok).length,passP=top.filter(okL).length;
const net=NBA_NET,tw=L.teams.map(t=>[t.w,net[t.abbr]]);const ma=tw.reduce((a,x)=>a+x[0],0)/30,mb=tw.reduce((a,x)=>a+x[1],0)/30;let sab=0,saa=0,sbb=0;for(const[x,y]of tw){sab+=(x-ma)*(y-mb);saa+=(x-ma)**2;sbb+=(y-mb)**2;}
const worst=top.slice().sort((a,b)=>Math.abs(b.sim.pts-b.real.pts)-Math.abs(a.sim.pts-a.real.pts)).slice(0,14).map(x=>x.n.split(' ').slice(-1)[0]+'('+x.tm+') '+x.real.pts+'>'+x.sim.pts.toFixed(1)+' m'+x.real.mpg+'>'+x.sim.mpg.toFixed(0)+' o'+x.ovr);
return ['n '+rows.length,...['mpg','pts','reb','ast','fg','tp','tpa'].map(st),'top150 strict pass '+pass+' ('+Math.round(pass/1.5)+'%), pts-only ±20% '+passP+' ('+Math.round(passP/1.5)+'%)','team wins vs 2025-26 net r '+(sab/Math.sqrt(saa*sbb)).toFixed(2)+' (note: rosters changed since 2025-26)','worst pts: '+worst.join(', ')].join('\\n')})()`));
