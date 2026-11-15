// v27 U8: standings shape per season. SEED=n node tools/u8.js [seasons]. Real NBA (2015-26): wins SD 12-14, best 60-68, worst 15-22, 60+ 1-3 teams, <25 3-5, 50+ 8-11
const {run}=require('./load.js')(process.env.SRC||'src',+process.env.SEED||1);
run(`(function(N){const L=newLeague({mode:'commish',nba:true,games:82});
const sd=a=>{const m=a.reduce((x,y)=>x+y,0)/a.length;return Math.sqrt(a.reduce((x,y)=>x+(y-m)**2,0)/a.length)};
const cor=(a,b)=>{const ma=a.reduce((x,y)=>x+y,0)/a.length,mb=b.reduce((x,y)=>x+y,0)/b.length;let s=0,p=0,q=0;for(let i=0;i<a.length;i++){s+=(a[i]-ma)*(b[i]-mb);p+=(a[i]-ma)**2;q+=(b[i]-mb)**2}return s/Math.sqrt(p*q)};
let prev=null;
for(let y=1;y<=N;y++){let g=0;const str=L.teams.map(t=>teamStrength(L,t));
 while(L.phase==='regular'&&g++<400)simDay(L);
 const w=L.teams.map(t=>t.w),srt=w.slice().sort((a,b)=>b-a),E=L.teams.filter(t=>t.conf==='North').map(t=>t.w),W=L.teams.filter(t=>t.conf==='South').map(t=>t.w);
 const top=L.teams.slice().sort((a,b)=>b.w-a.w).slice(0,3).map(t=>t.abbr+' '+t.w).join(', '),bot=L.teams.slice().sort((a,b)=>a.w-b.w).slice(0,3).map(t=>t.abbr+' '+t.w).join(', ');
 console.log('S'+y+' SD '+sd(w).toFixed(1)+' max '+srt[0]+' min '+srt[29]+' | 60+ '+w.filter(x=>x>=60).length+' 50+ '+w.filter(x=>x>=50).length+' <25 '+w.filter(x=>x<25).length+' | E/W avg '+(E.reduce((a,b)=>a+b,0)/15).toFixed(1)+'/'+(W.reduce((a,b)=>a+b,0)/15).toFixed(1)+' | r(pre strength) '+cor(str,w).toFixed(2)+(prev?' r(last yr) '+cor(prev,w).toFixed(2):'')+' | '+top+' … '+bot);
 prev=w;
 processPending(L);startPlayoffs(L);g=0;while(L.phase==='playoffs'&&g++<400)simPlayoffDay(L);
 if(y<N){startOffseason(L);runLottery(L);startDraft(L);g=0;while(L.phase==='off-draft'&&g++<200)aiDraftPick(L);startFA(L);g=0;while(L.phase==='off-fa'&&g++<40)faDay(L);processPending(L);startNewSeason(L);}}
})(${+process.argv[2]||5})`);
