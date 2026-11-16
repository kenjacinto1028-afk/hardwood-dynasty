// v27.13 U7: minutes + team 3PA spread after one NBA season. SEED=n node tools/u7.js
const {run}=require('./load.js')(process.env.SRC||'src',+process.env.SEED||1);
console.log(run(`(()=>{const L=newLeague({mode:'commish',nba:true});while(L.phase==='regular')simDay(L);
const t3=L.teams.map(t=>{let a=0,g=0;for(const id of t.roster){const p=L.players[id];}return t;});
const by={};for(const p of Object.values(L.players))if(p.team!=null&&p.stats&&p.stats.rs&&p.stats.rs.gp){const x=by[p.team]=by[p.team]||{tpa:0,min:0};x.tpa+=p.stats.rs.tpa;x.min+=p.stats.rs.min;}
const g=L.teams.map(t=>t.w+t.l);const v=L.teams.map((t,i)=>[t.abbr,by[i].tpa/g[i]]).sort((a,b)=>a[1]-b[1]);
const star=Object.values(L.players).filter(p=>p.stats&&p.stats.rs&&p.stats.rs.gp>40&&p.ovr>=80).map(p=>(p.stats.rs.min/60/p.stats.rs.gp));
return '3PA/g min '+v[0][0]+' '+v[0][1].toFixed(1)+' max '+v[29][0]+' '+v[29][1].toFixed(1)+' sd '+(Math.sqrt(v.reduce((a,x)=>a+Math.pow(x[1]-v.reduce((b,y)=>b+y[1],0)/30,2),0)/30)).toFixed(1)+' mean '+(v.reduce((a,x)=>a+x[1],0)/30).toFixed(1)+'\\n'+v.map(x=>x[0]+' '+x[1].toFixed(0)).join(' ')+'\\nstar(80+) mpg '+(star.reduce((a,b)=>a+b,0)/star.length).toFixed(1)+' n'+star.length})()`));
