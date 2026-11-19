// Walker Kessler check: ratings, archetype, one-season averages. node tools/kessler.js [seed] [sim=1]
const {run}=require('./load.js')('src',+process.argv[2]||1);const SIM=process.argv[3]!=='0';
console.log(run(`(function(){const L=newLeague({mode:'commish',size:30,games:82,nba:true});const p=Object.values(L.players).find(q=>q.name==='Walker Kessler');
const K=['ovr','pot','fin','mid','tp','ft','pst','drw','hnd','pas','orb','drb','stl','blk','per','pdf','tct','iq','t3','tmd','trm','tps','tpa','tbd','tcs','tcr','uf'];
const o={r:K.map(k=>k+' '+(typeof p[k]==='number'?Math.round(p[k]*100)/100:p[k])).join(' '),arch:archLabel(p)};
if(${SIM}){let g=0;while(L.phase==='regular'&&g++<400)simDay(L);const s=p.stats.rs,n=s.gp,f=x=>(x/n).toFixed(1);
o.line='GP '+n+' MIN '+(s.min/60/n).toFixed(1)+' PTS '+f(s.pts)+' REB '+f(s.orb+s.drb)+' BLK '+f(s.blk)+' STL '+f(s.stl)+' AST '+f(s.ast)+' FG% '+(s.fgm/s.fga*100).toFixed(1)+' 3PA '+f(s.tpa)+' FT% '+(s.ftm/Math.max(1,s.fta)*100).toFixed(1)+' FTA '+f(s.fta);
const dz=Object.values(L.players).filter(q=>q.stats&&q.stats.rs&&q.stats.rs.gp>=40&&q.stats.rs.dz);o.dz=!!p.stats.rs.dz;}
return JSON.stringify(o,null,1);})()`));
