// v27 P0: SEED=n node tools/s20.js [seasons] -> per season: counts 90/85/80/75, top 5, young tracking; end: peak ovr by draft slot
const {run}=require('./load.js')(process.env.SRC||'src',+process.env.SEED||1);
run(`(function(N){const L=newLeague({mode:'commish',nba:'${process.env.NBA||1}'==='1',games:82});
const track=['Cooper Flagg','Kon Knueppel','VJ Edgecombe','AJ Dybantsa','Darryn Peterson','Cameron Boozer','Victor Wembanyama','Chet Holmgren','Ausar Thompson','Jalen Duren','Dylan Harper','Ace Bailey'];
const ids=track.map(n=>{const p=Object.values(L.players).find(p=>p.name===n);return p?p.id:null});
const cnt=()=>{const a=Object.values(L.players).filter(p=>!p.retired&&(p.team!=null||(L.fa||[]).includes(p.id)));const c=x=>a.filter(p=>p.ovr>=x).length;const top=a.sort((x,y)=>y.ovr-x.ovr).slice(0,5).map(p=>p.last+' '+p.ovr+'('+p.age+')').join(', ');return c(90)+'/'+c(85)+'/'+c(80)+'/'+c(75)+' | '+top};
console.log('S0 '+cnt());
for(let y=1;y<=N;y++){let g=0;
 while(L.phase==='regular'&&g++<400)simDay(L);processPending(L);startPlayoffs(L);g=0;while(L.phase==='playoffs'&&g++<400)simPlayoffDay(L);
 startOffseason(L);runLottery(L);startDraft(L);g=0;while(L.phase==='off-draft'&&g++<200)aiDraftPick(L);startFA(L);g=0;while(L.phase==='off-fa'&&g++<40)faDay(L);processPending(L);startNewSeason(L);
 const yt=ids.map((id,i)=>{const p=id!=null&&L.players[id];return p?track[i].split(' ').slice(-1)[0]+' '+p.ovr+(p.retired?'R':''):''}).filter(Boolean).join(' ');
 console.log('S'+y+' '+cnt()+' || '+yt);}
const sl=[[1,5],[6,14],[15,30],[31,60]];const dr=Object.values(L.players).filter(p=>p.draft&&p.draft.s>=1&&p.draft.s<=N-6&&p.draft.no).map(p=>{p._slot=(p.draft.rd===2?30:0)+p.draft.no;return p});
console.log('peak by slot (drafted S1-S'+(N-6)+'): '+sl.map(([a,b])=>{const g=dr.filter(p=>p._slot>=a&&p._slot<=b).map(p=>Math.max(p.ovr,...((p.hist||[]).map(h=>h.ovr||0))));g.sort((x,y)=>y-x);const m=g.reduce((x,y)=>x+y,0)/Math.max(1,g.length);return a+'-'+b+': n'+g.length+' avg '+m.toFixed(1)+' 85+ '+g.filter(x=>x>=85).length+' 75+ '+g.filter(x=>x>=75).length}).join(' | '));
})(${+process.argv[2]||20})`);
