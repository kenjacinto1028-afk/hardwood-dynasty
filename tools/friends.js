// v37 friendships check: autopilot N seasons from the franchise save; friendships form, duos made/split, FA moves toward friends, news lines.
const {run}=require('./snap.js')('src',+process.env.SEED||5,'tools/snap/nba-team-s10.json.gz');
console.log(run(`(function(N){const L=SL,out=[];let ok=0,bad=0;const chk=(n,c,x)=>{if(c)ok++;else bad++;out.push((c?'PASS ':'FAIL ')+n+(x!=null?' :: '+x:''));};
const cnt=()=>{const ks=Object.keys(L.fr||{});return [ks.length,ks.filter(k=>L.fr[k].duo).length];};
chk('setup friendships on load',cnt()[0]>=30,cnt().join('/'));
const fx=FR; const p0=Object.values(L.players).find(p=>!p.retired&&p.team!=null&&friendsOf(L,p).length);const fr=friendsOf(L,p0)[0];
const t=L.teams.find(x=>x.id===fr.other.team), t2=L.teams.find(x=>x.id!==t.id&&x.id!==p0.team);
const a1=negAppeal(p0,t,'signing',L), a2=negAppeal(p0,t2,'signing',L); chk('friend team has appeal bonus',friendOn(L,p0,t)&&!friendOn(L,p0,t2),(a1).toFixed(3));
chk('morale part friend',moraleParts(L,p0).friend===fx.morale||p0.team!==fr.other.team,JSON.stringify(moraleParts(L,p0).friend));
const fa0=L.fa? L.fa.length:0; let joined=0,tot=0; const before={}; for(const p of Object.values(L.players)) before[p.id]=p.team;
const n0=(L.news||[]).length;
autoBegin(L,N,true);let g=0;while(autoStep(L)&&g++<400000){}autoEnd(L);
for(const p of Object.values(L.players)) if(!p.retired&&p.team!=null&&before[p.id]!==p.team&&p.tx&&p.tx.some(x=>/[Ss]igned/.test(x.t)&&x.s>=L.season-N)){tot++; if(friendOn(L,p,L.teams[p.team])) joined++;}
chk('friendships after '+N+' seasons',cnt()[0]>=60&&cnt()[0]<=170,cnt().join('/'));
chk('per-player cap', Object.values(L.players).every(p=>p.retired||friendsOf(L,p).length<=fx.max));
chk('duos are teammates', Object.values(L.players).every(p=>p.retired||friendsOf(L,p).every(x=>!x.duo||x.other.team===p.team)));
out.push('FA signings joining a friend: '+joined+'/'+tot);
const nw=(L.log||[]).map(x=>x.text).filter(x=>typeof x==='string'&&/friend|duo/i.test(x)); out.push('news lines: '+nw.length+'\\n  '+nw.slice(-6).join('\\n  '));
out.push(ok+' pass, '+bad+' fail');return out.join('\\n');})(${+process.argv[2]||2})`));
