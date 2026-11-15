// v28.4 F4: SEED=n node tools/f4.js [seasons=3] -> HOF speeches + season recaps (facts + text) over N sim seasons
const {run}=require('./load.js')(process.env.SRC||'src',+process.env.SEED||1);
const N=+process.argv[2]||3, FIC=!!process.env.FIC;
console.log(run(`(function(N){const out=[];let ok=0,n=0;const chk=(c,m)=>{n++;if(c)ok++;else out.push('FAIL '+m);};
globalThis.L=newLeague(${FIC?"{mode:'commish'}":"{mode:'commish',nba:true,games:82}"});
const keys=Object.keys(NBA_TEXT.story);chk(keys.length>=16&&keys.every(k=>NBA_TEXT.story[k].length>=4&&NBA_TEXT.story[k].every(t=>t.length<=140)),'story keys: 4+ wordings, <=140 chars');
for(let k=0;k<N;k++){let g=0;while(L.phase==='regular')simDay(L);processPending(L);startPlayoffs(L);while(L.phase==='playoffs'&&g++<400)simPlayoffDay(L);
 const h0=L.hof.length;startOffseason(L);const S=L.season,H=L.history.find(h=>h.s===S);
 chk(H&&H.recap&&L.log.some(x=>x.text.startsWith('Season recap: ')),'recap stored + news '+S);
 const f=seasonRecapFacts(L,S);chk(f.champ===H.champion&&f.mvp&&f.fmvp&&f.best,'recap facts '+S);
 const sn=H.recap.split(/(?<=[.!?"])\\s+(?=[A-Z"])/).length;chk(sn>=3&&sn<=8&&!/\\{\\w+\\}|undefined|NaN/.test(H.recap),'recap text ok ('+sn+')');
 out.push('RECAP '+seasonName(S)+': '+H.recap);if(f.surprise)out.push('  surprise '+L.teams[f.surprise.tid].abbr+' +'+f.surprise.d);
 for(const h of L.hof.slice(h0)){const p=L.players[h.pid],F=hofSpeechFacts(L,p),t=hofSpeech(L,p);
  chk(t&&!/\\{\\w+\\}|undefined|NaN/.test(t),'speech text '+p.name);chk(F.coaches.length<=2&&F.teammates.length<=3&&F.teammates.every(m=>m.name!==p.name),'speech facts '+p.name);
  chk(hofSpeech(L,p)===t,'speech stable');
  out.push('HOF '+p.name+(p.real?' (real)':'')+' team '+(F.team!=null?L.teams[F.team].abbr:'-')+'x'+F.teamN+' coaches '+F.coaches.map(c=>c.name+'x'+c.n).join(', ')+' | mates '+F.teammates.map(m=>m.name+' '+m.n+'s/'+m.min+'m').join(', ')+' | fam '+F.fam.map(x=>x.k+':'+x.name).join(',')+' | titles '+F.titles+' MVP '+F.mvps);out.push('  '+t);}
 runLottery(L);startDraft(L);g=0;while(L.phase==='off-draft'&&g++<200)aiDraftPick(L);startFA(L);g=0;while(L.phase==='off-fa'&&g++<40)faDay(L);processPending(L);startNewSeason(L);}
// a star with a long real career: real teammates show up
${FIC?'':"const lb=Object.values(L.players).find(p=>p.name==='Stephen Curry');const F=hofSpeechFacts(L,lb);chk(F.teammates.length===3&&F.team===L.teams.find(t=>t.abbr==='GSW').id,'Curry: 3 teammates, GSW first ('+F.teammates.map(m=>m.name).join(', ')+')');out.push('CURRY: '+hofSpeech(L,lb));"}
out.push('f4 '+ok+'/'+n);return out.join('\\n');})(${N})`));
