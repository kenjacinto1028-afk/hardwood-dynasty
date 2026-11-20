// Play as coach mode check (Nov 20 2026): node tools/coach-mode.js
// Starts coach mode on a saved league, sims 2 full seasons with the AI GM running your roster, then forces a firing and takes a job offer.
const fs = require('fs');
let fails = 0; const ok = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x !== undefined ? '  [' + JSON.stringify(x) + ']' : '')); if (!c) fails++; };
const o = require('./snap.js')('src', 7, 'tools/snap/nba-team-s10.json.gz'); o.run(fs.readFileSync('src/coach-mode.js', 'utf8'));
const r = JSON.parse(o.run(`(()=>{const L=SL;const out={};const tid=L.user;
const c=cmBegin(L,tid,'Test Coach');out.mode=L.mode;out.user=L.user;out.coachIsMe=L.teams[tid].coach.id===c.id;out.gm=!!L.teams[tid].gm;
const ros0=L.teams[tid].roster.slice();L.teams[tid].manual=null;
const step=()=>{switch(L.phase){case 'regular':simDay(L);break;case 'regular-done':startPlayoffs(L);break;case 'playoffs':simPlayoffDay(L);break;case 'season-done':startOffseason(L);break;case 'off-review':runLottery(L);break;case 'off-lottery':startDraft(L);break;case 'off-draft':aiDraftPick(L);break;case 'off-resign':startFA(L);break;case 'off-fa':faDay(L);break;case 'off-ready':startNewSeason(L);break;}};
const s0=L.season;let n=0,secs=[],offerSeen=0,userAfter=[];
while(L.season<s0+2&&n++<5000){step();if(L.user!=null&&L.user!==L.cm.tid)out.bad=1;if(L.phase==='regular'&&L.day%40===0&&cmTeam(L)){const s=cmSecurity(L);secs.push(s.v);}if(L.cm.offers.length)offerSeen++;}
out.seasons=L.season-s0;out.secs=secs;out.jobless=L.cm.jobless;out.offerSeen=offerSeen;
const mine=L.log.filter(x=>x.tid===tid&&['tx','trade','draft'].includes(x.cat)).length;out.aiMoves=mine;
out.rosterChanged=L.teams[tid].roster.filter(id=>!ros0.includes(id)).length;
out.drafted=Object.values(L.players).filter(p=>p.draft&&p.draft.s>=s0&&p.draft.tid===tid).length;
out.coachSeasons=(cmCoach(L).seasons||[]).length;out.rep=cmRep(L);
// force a firing mid-season
while(L.phase!=='regular'&&n++<9000)step();
if(!L.cm.jobless){const t=L.teams[L.cm.tid];const me=t.coach;fireCoach(L,t);const nc=affordableCoach(L,t,me.id)||makeInterim(L,t);hireCoach(L,t.id,nc.id,true);cmAfter(L);}
out.firedJobless=L.cm.jobless;out.userNull=L.user===null;out.pop=L.cm.pop&&L.cm.pop.k;out.notHired=L.teams.every(t=>!t.coach.user);
while(L.phase!=='off-review'&&n++<20000)step();
out.offers=L.cm.offers.map(x=>x.tid);out.stillJobless=L.cm.jobless&&L.teams.every(t=>!t.coach.user);
if(L.cm.offers.length){const tid2=L.cm.offers[0].tid;out.take=cmTakeJob(L,tid2);out.newUser=L.user===tid2;out.newCoachMe=L.teams[tid2].coach.id===L.cm.cid;out.contract=L.teams[tid2].coach.contract&&L.teams[tid2].coach.contract.yrs;}
let m=0;while(L.phase!=='regular'&&m++<5000)step();for(let i=0;i<20;i++)step();out.after=L.user===L.cm.tid&&L.teams[L.cm.tid].coach.id===L.cm.cid;
out.pool=L.coachPool.filter(c=>c.user).length;
return JSON.stringify(out);})()`));
console.log(JSON.stringify(r));
ok('coach mode set up', r.mode === 'coach' && r.coachIsMe && r.gm);
ok('L.user restored after each step', !r.bad);
ok('two seasons simmed', r.seasons === 2);
ok('AI GM made moves for your team', r.aiMoves > 0 && r.rosterChanged > 0, [r.aiMoves, r.rosterChanged]);
ok('job security reads', r.secs.length > 3 && r.secs.every(v => v >= 0 && v <= 100), r.secs);
ok('coach seasons recorded', r.coachSeasons >= 2, r.coachSeasons);
ok('firing makes you jobless', r.firedJobless && r.userNull && r.pop === 'fired' && r.notHired);
ok('jobless coach is not hired by AI teams', r.stillJobless);
ok('job offers after firing', r.offers.length >= 1, r.offers);
ok('taking a job works', r.take === null && r.newUser && r.newCoachMe && r.contract >= 3);
ok('next season runs as the new coach', r.after && r.pool === 0);
console.log(fails ? fails + ' FAILED' : 'ALL PASS'); process.exit(fails ? 1 : 0);
