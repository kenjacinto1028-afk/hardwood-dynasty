// v38 All-Star Weekend contests check: sim a saved league to All-Star day, print entrants and winners; then N seasons of autopilot for variety.
const {run}=require('./snap.js')('src',+process.env.SEED||5,process.env.SNAP||'tools/snap/pbl16-commish-s10.json.gz');
console.log(run(`(function(N){const L=SL,out=[];let ok=0,bad=0;const chk=(n,c,x)=>{if(c)ok++;else bad++;out.push((c?'PASS ':'FAIL ')+n+(x!=null?' :: '+x:''));};
const nm=id=>L.players[id].name+' ('+L.players[id].ovr+')';
autoBegin(L,N,true);let g=0;while(autoStep(L)&&g++<400000){}autoEnd(L);
const H=L.allStarHist||{};const ss=Object.keys(H).map(Number).filter(s=>H[s].contests);
chk('contests every season',ss.length>=N,ss.join(','));
const wins={three:{},dunk:{},skills:{}};
for(const s of ss){const c=H[s].contests;
 chk('s'+s+' three has 8 + final 3',c.three&&c.three.r1.length===8&&c.three.fin.length===3);
 chk('s'+s+' dunk has 4 + final 2',c.dunk&&c.dunk.r1.length===4&&c.dunk.fin.length===2);
 chk('s'+s+' skills has 6 + final 2',c.skills&&c.skills.r1.length===6&&c.skills.fin.length===2);
 for(const k of ['three','dunk','skills']){const w=L.players[c[k].win];chk('s'+s+' '+k+' winner award',w.awards.some(a=>a.s===s&&a.a===ASW_AW[k]));}
 out.push('S'+s+' 3PT: '+nm(c.three.win)+' final '+c.three.fin.map(x=>x.pts).join('/')+' | r1 '+c.three.r1.map(x=>x.pts).join(',')+' | racks '+c.three.fin[0].racks.join(' '));
 out.push('   DUNK: '+nm(c.dunk.win)+' '+c.dunk.best+' final '+c.dunk.fin.map(x=>x.pts).join('/')+' | r1 '+c.dunk.r1.map(x=>x.pts).join(','));
 out.push('   SKILLS: '+nm(c.skills.win)+' final '+c.skills.fin.map(x=>x.time).join('/')+' | r1 '+c.skills.r1.map(x=>x.time+(x.big?'b':'')).join(','));}
const nw=(L.log||[]).map(x=>x.text).filter(x=>/Contest|Skills Challenge/.test(x));chk('news lines',nw.length>=3*N,nw.length);out.push('  '+nw.slice(0,3).join('\\n  '));
out.push(ok+' pass, '+bad+' fail');return out.join('\\n');})(${+process.argv[2]||2})`));
