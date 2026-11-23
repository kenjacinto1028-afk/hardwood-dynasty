// My Career decisions check (Nov 23 2026): node tools/career-decisions.js
const fs = require('fs');
let fails = 0; const ok = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x !== undefined ? '  [' + JSON.stringify(x) + ']' : '')); if (!c) fails++; };
const o = require('./load.js')('src', 5);
for (const f of ['career-text.js', 'career.js', 'career-biz.js']) o.run(fs.readFileSync('src/' + f, 'utf8'));
o.run(`var L=newLeague({mode:'career',size:16,games:58});carCreate(L,{first:'Dec',last:'Test',pos:1,hgt:75,style:'',story:'street',path:'NCHF',team:null,num:7});`);
const J = c => JSON.parse(o.run('JSON.stringify((()=>{' + c + '})())'));
let r = J(`const g=L.career.games.find(x=>x.play);const cur=carStart(L,g);return {plan:cur.plan,tip:cur.tip,n:cur.sc.length,last:cur.sc[3],en:cur.en,lead:cur.lead};`);
ok('a game starts at the plan screen with 4 moments, clutch last', r.plan === null && r.tip === 0 && r.n === 4 && r.last === 'clutch' && r.en === 100, r);
r = J(`const cur=L.career.cur;carPlan(L,'lock');const sc=carScene(cur.sc[0],cur);const o0=sc.o[0];const p=carP(L);
const chL=carChance(L,p,{k:['per','agi'],d:0},cur);cur.plan='take';const chT=carChance(L,p,{k:['per','agi'],d:0},cur);cur.plan='lock';
return {plan:cur.plan,tip:cur.tip,lockBetter:chL>chT};`);
ok('game plan changes the odds for matching plays', r.plan === 'lock' && r.tip === 1 && r.lockBetter, r);
r = J(`const cur=L.career.cur;const en0=cur.en;carChoose(L,0);const e1=cur.en;const rest=carRest(L);const e2=cur.en;const rest2=carRest(L);carChoose(L,0);carChoose(L,0);
const lastOk=carScene(cur.sc[3],cur);const res=carChoose(L,0);return {en0,e1,e2,restOnce:!!rest&&!rest2,steps:cur.step,res:!!res,calls:cur.res.length,labels:cur.res.every(x=>x.l)};`);
ok('energy drops on each call, one breather restores 35', r.e1 < r.en0 && r.e2 > r.e1 && r.restOnce && r.steps === 4 && r.labels, r);
r = J(`const g=carFinish(L);return {plan:g.plan,calls:g.calls.length,done:g.done,xp:g.xp,pts:g.line.pts,cur:L.career.cur};`);
ok('finish stores plan + calls for the review', r.plan === 'lock' && r.calls === 4 && r.done && r.cur === null, r);
r = J(`let n=0,ids={};for(let i=0;i<300;i++){const s=carScenes(carP(L),'bal',{rv:'Star Guy'});s.slice(0,3).forEach(k=>ids[k]=(ids[k]||0)+1);}let none={};for(let i=0;i<300;i++){carScenes(carP(L),'bal',{}).slice(0,3).forEach(k=>none[k]=(none[k]||0)+1);}
const cnt=(pl,cl)=>{let n=0;for(let i=0;i<500;i++)carScenes(carP(L),pl,{}).slice(0,3).forEach(k=>{if(carSceneCls(carScene(k))===cl)n++;});return n;};
let pt={sc:[cnt('take','sc'),cnt('bal','sc')],pm:[cnt('dish','pm'),cnt('bal','pm')],df:[cnt('lock','df'),cnt('bal','df')]};
return {rival:ids.rival||0,noRival:none.rival||0,pt,scenes:Object.keys(ids).length};`);
ok('rival scene only shows when a rival is on the floor', r.rival > 100 && r.noRival === 0, r);
ok('plans pull matching scenes', r.pt.sc[0] > r.pt.sc[1] && r.pt.pm[0] > r.pt.pm[1] && r.pt.df[0] > r.pt.df[1], r.pt);
r = J(`const cur={lead:3,mom:0,rv:null};const up=carScene('clutch',cur);const dn=carScene('clutch',{lead:-3});return {up:carSceneText(up,cur),dn:carSceneText(carScene('clutch',{lead:-3}),{lead:-3}),tie:carSceneText(carScene('clutch',{lead:0}),{lead:0})};`);
ok('clutch moment reads the margin (up / down / tied)', /^Up 3/.test(r.up) && /^Down 3/.test(r.dn) && /^Tied/.test(r.tie), r);
// pro: play through a decision game and check the engine hook still reads fx
o.run(`var step=()=>{switch(L.phase){case 'regular':simDay(L);break;case 'regular-done':startPlayoffs(L);break;case 'playoffs':simPlayoffDay(L);break;case 'season-done':startOffseason(L);break;case 'off-review':runLottery(L);break;case 'off-lottery':startDraft(L);break;case 'off-draft':aiDraftPick(L);break;case 'off-resign':startFA(L);break;case 'off-fa':faDay(L);break;case 'off-ready':startNewSeason(L);break;}};var g=0;while(!(!carP(L).prospect&&L.phase==='regular'&&L.day>3)&&g++<9000)step();`);
r = J(`const t=carProToday(L);let n=0;let guard=0;while(!carProToday(L)&&guard++<10)simDay(L);const cur=carProStart(L);carPlan(L,'take');for(let i=0;i<4;i++)carChoose(L,0);const fx=carProFx(L);return {has:!!cur,plan:fx.plan,o:fx.o,ub:fx.ub,calls:fx.calls.length,good:fx.good};`);
ok('pro game: decisions turn into engine form with the plan', r.has && r.plan === 'take' && r.calls === 4 && r.ub > 0.8, r);
console.log(fails ? 'FAILED ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
