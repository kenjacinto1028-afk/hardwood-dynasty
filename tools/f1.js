// v28 F1: team 3PA per game after one NBA season. SEED=n node tools/f1.js
const {run}=require('./load.js')(process.env.SRC||'src',+process.env.SEED||1);
console.log(run(`(()=>{const L=newLeague({mode:'commish',nba:true});while(L.phase==='regular')simDay(L);
const r=L.teams.map(t=>[t.abbr,t.trs.tpa/t.trs.g,t.trs.pts/t.trs.g]).sort((a,b)=>a[1]-b[1]);const v=r.map(x=>x[1]);
const ok=v.every(x=>x>=28&&x<=48);
return 'SEED '+(${+process.env.SEED||1})+' 3PA/g min '+v[0].toFixed(1)+' max '+v[29].toFixed(1)+' avg '+(v.reduce((a,b)=>a+b,0)/30).toFixed(1)+' ppg avg '+(r.reduce((a,x)=>a+x[2],0)/30).toFixed(1)+(ok?' PASS':' FAIL')+'\\n'+r.map(x=>x[0]+' '+x[1].toFixed(1)).join(', ')})()`));
