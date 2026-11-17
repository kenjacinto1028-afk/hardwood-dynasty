// v37b: Hall of Fame counts over 5 seasons from tools/snap/nba-commish-s10.json.gz. SRC=src SEED=21 node tools/t37b-hof5.js [seasons]
// Run once with the code before v37b (SRC=<old src>) for the baseline: same seed, same save.
const N = +process.argv[2] || 5, SRC = process.env.SRC || __dirname + '/../src';
const { run } = require('./snap.js')(SRC, +process.env.SEED || 21, __dirname + '/snap/nba-commish-s10.json.gz');
console.log(run(`(()=>{const L=SL;const h0=L.hof.length,out=[];const hxN=typeof hxHofYear==='function'?(n=>hxHofYear(L,n)):(n=>null);
for(let y=1;y<=${N};y++){let g=0;while(L.phase==='regular'&&g++<400)simDay(L);processPending(L);startPlayoffs(L);g=0;while(L.phase==='playoffs'&&g++<400)simPlayoffDay(L);
 const k=L.hof.length;startOffseason(L);runLottery(L);startDraft(L);g=0;while(L.phase==='off-draft'&&g++<200)aiDraftPick(L);if(L.phase==='off-resign')startFA(L);g=0;while(L.phase==='off-fa'&&g++<60)faDay(L);processPending(L);startNewSeason(L);
 const ret=Object.values(L.players).filter(p=>p.retired===L.season-1).length;
 out.push('S'+(L.season-1)+': retired '+ret+', inducted '+(L.hof.length-k)+(L.hof.length>k?' ('+L.hof.slice(k).map(h=>h.name+(L.players[h.pid].real?'*':'')+' '+Math.round(h.score)).join(', ')+')':''));}
const dup=L.hof.filter(h=>hxN(h.name)).map(h=>h.name);const names=L.hof.map(h=>h.name);
out.push('total inducted in '+${N}+' seasons: '+(L.hof.length-h0)+' (real players *: '+L.hof.slice(h0).filter(h=>L.players[h.pid].real).length+'); already in the history list: '+(dup.length?dup.join(', '):'none')+'; inducted twice: '+(names.length-new Set(names).size));
return out.join('\\n');})()`));
