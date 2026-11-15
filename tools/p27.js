// v27 U12/U13: SEED=n node tools/p27.js [seasons] -> per season: counts 90/85/80/75 (active), and real stars' ovr (R = retired) ; end: ages at decline / retirement for 80+ players
const {run}=require('./load.js')(process.env.SRC||'src',+process.env.SEED||1);
run(`(function(N){const L=newLeague({mode:'commish',nba:true,games:${+process.env.G||82}});
const track=['Nikola Jokic','Shai Gilgeous-Alexander','Giannis Antetokounmpo','Luka Doncic','Stephen Curry','LeBron James','Kevin Durant','Jayson Tatum','Anthony Edwards','Victor Wembanyama','Cooper Flagg','Cade Cunningham'];
const ids=track.map(n=>{const p=Object.values(L.players).find(p=>p.name===n);return p?p.id:null});
const act=()=>Object.values(L.players).filter(p=>!p.retired&&!p.prospect&&(p.team!=null||(L.fa||[]).includes(p.id)));
const cnt=()=>{const a=act();const c=x=>a.filter(p=>p.ovr>=x).length;return c(90)+'/'+c(85)+'/'+c(80)+'/'+c(75)};
console.log('S0 '+cnt()+' || '+ids.map((id,i)=>track[i].split(' ').slice(-1)[0].slice(0,6)+' '+L.players[id].ovr).join(' '));
const peaks={};
for(let y=1;y<=N;y++){let g=0;
 while(L.phase==='regular'&&g++<400)simDay(L);processPending(L);startPlayoffs(L);g=0;while(L.phase==='playoffs'&&g++<400)simPlayoffDay(L);
 startOffseason(L);runLottery(L);startDraft(L);g=0;while(L.phase==='off-draft'&&g++<200)aiDraftPick(L);startFA(L);g=0;while(L.phase==='off-fa'&&g++<40)faDay(L);processPending(L);startNewSeason(L);
 for(const p of Object.values(L.players)){if(p.ovr>=80){const k=peaks[p.id]=peaks[p.id]||{peak:0};if(p.ovr>k.peak){k.peak=p.ovr;k.pa=p.age}} if(peaks[p.id]&&p.retired&&!peaks[p.id].ra){peaks[p.id].ra=p.age;peaks[p.id].ro=p.ovr}}
 console.log('S'+y+' '+cnt()+' || '+ids.map((id,i)=>{const p=L.players[id];return track[i].split(' ').slice(-1)[0].slice(0,6)+' '+(p.retired?'R':p.ovr+'('+p.age+')')}).join(' '));}
const ks=Object.values(peaks).filter(k=>k.peak>=85);const ret=ks.filter(k=>k.ra);
console.log('85+ peaks: '+ks.length+' | peak age avg '+(ks.reduce((a,k)=>a+k.pa,0)/Math.max(1,ks.length)).toFixed(1)+' | retired '+ret.length+', retire age avg '+(ret.reduce((a,k)=>a+k.ra,0)/Math.max(1,ret.length)).toFixed(1)+' ovr at retirement avg '+(ret.reduce((a,k)=>a+k.ro,0)/Math.max(1,ret.length)).toFixed(1));
})(${+process.argv[2]||20})`);
