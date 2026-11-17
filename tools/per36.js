// v36a: one NBA season from a save, top PER / usage / TS / ppg. SC=shareCap SK=shareK UT=useTax SEED=n node tools/per36.js [save]
const {run}=require('./snap.js')(process.env.SRC||'src',+process.env.SEED||21,process.argv[2]||'tools/snap/nba-commish-s10.json.gz');
console.log(run(`(()=>{const L=SL;${process.env.UT?"ENG.useTax="+process.env.UT+";":""}${process.env.SC!=null?"ENG.shareCap="+process.env.SC+";ENG.shareK="+(process.env.SK||4)+";":""}let g=0;while(L.phase==='regular'&&g++<400)simDay(L);computeAdv(L,'rs',true);
const ps=Object.values(L.players).filter(p=>p.stats&&p.stats.rs&&p.stats.rs.gp>=50);
const line=p=>{const s=p.stats.rs,m=s.min/60,k=36/m;const f=x=>+(x*k).toFixed(1);return {n:p.name,ovr:p.ovr,pos:p.pos,arch:(typeof archLabel==='function'?archLabel(p):''),mpg:+(m/s.gp).toFixed(1),per:s.per,usg:s.usg,ws:s.ws,bpm:s.bpm,p36:f(s.pts),r36:f((s.orb||0)+(s.drb||0)),orb36:f(s.orb||0),a36:f(s.ast),s36:f(s.stl),b36:f(s.blk),to36:f(s.tov),pf36:f(s.pf||0),fga36:f(s.fga),fg:+(s.fgm/s.fga).toFixed(3),tp:+((s.tpm||0)/Math.max(1,s.tpa||0)).toFixed(3),tpa36:f(s.tpa||0),fta36:f(s.fta),ts:+(s.pts/(2*(s.fga+0.44*s.fta))).toFixed(3)};};
const by=ps.slice().sort((a,b)=>b.stats.rs.per-a.stats.rs.per);
const cnt=x=>ps.filter(p=>p.stats.rs.per>=x).length;
const lg={ts:0,n:0};for(const p of ps){const s=p.stats.rs;lg.ts+=s.pts;lg.n+=2*(s.fga+0.44*s.fta);}
const pts=ps.map(p=>p.stats.rs.pts/p.stats.rs.gp).sort((a,b)=>b-a);return JSON.stringify({ppg:pts.slice(0,3).map(x=>+x.toFixed(1)),usgTop:ps.map(p=>p.stats.rs.usg).sort((a,b)=>b-a).slice(0,5),wsTop:ps.map(p=>p.stats.rs.ws).sort((a,b)=>b-a).slice(0,3),top:by.slice(0,4).map(line),med:line(by[Math.floor(by.length/2)]),n25:cnt(25),n30:cnt(30),n35:cnt(35),lgTS:+(lg.ts/lg.n).toFixed(3)},null,0).replace(/\\},\\{/g,'},\\n{');})()`));
