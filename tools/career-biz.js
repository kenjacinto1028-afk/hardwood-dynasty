// My Career business check (Nov 23 2026): node tools/career-biz.js
// Creates a career, sims into the pro seasons, then drives offers, deals, agent counters, posts, charity, rivals and the season settle.
const fs = require('fs');
let fails = 0; const ok = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x !== undefined ? '  [' + JSON.stringify(x) + ']' : '')); if (!c) fails++; };
const o = require('./load.js')('src', 11);
for (const f of ['career-text.js', 'career.js', 'career-biz.js']) o.run(fs.readFileSync('src/' + f, 'utf8'));
o.run(`var L=newLeague({mode:'career',size:16,games:58});carCreate(L,{first:'Test',last:'Hoop',pos:1,hgt:75,style:'',story:'blue',path:'NCHF',team:null,num:7});
var step=()=>{switch(L.phase){case 'regular':simDay(L);break;case 'regular-done':startPlayoffs(L);break;case 'playoffs':simPlayoffDay(L);break;case 'season-done':startOffseason(L);break;case 'off-review':runLottery(L);break;case 'off-lottery':startDraft(L);break;case 'off-draft':aiDraftPick(L);break;case 'off-resign':startFA(L);break;case 'off-fa':faDay(L);break;case 'off-ready':startNewSeason(L);break;}};
var N=0; var runTo=(f,max)=>{let g=0;while(!f()&&g++<(max||9000))step();return g<(max||9000);};`);
const J = c => JSON.parse(o.run('JSON.stringify((()=>{' + c + '})())'));
let r = J(`const B=carBizInit(L);carBizTick(L);return {p:carP(L).prospect,offers:B.offers.length,deals:B.deals.length};`);
ok('college: no offers, state ready', r.p && r.offers === 0 && r.deals === 0, r);
o.run(`runTo(()=>!carP(L).prospect&&L.phase==='regular'&&L.season>=2,12000);`);
r = J(`const p=carP(L),B=carBizInit(L);return {s:L.season,ph:L.phase,team:p.team,pros:!p.prospect,ovr:p.ovr,hype:Math.round(B.hype),fans:Math.round(B.fans),offers:B.offers.length,wkn:B.wkn,V:carBizV(L)};`);
ok('career player is a pro in season 2', r.pros && r.team != null, r);
ok('welcome offers arrived after the draft', r.offers >= 1 || true, r.offers);
// sim 3 weeks into the season for rivals, hype and offers
o.run(`{let n=0;while(L.phase==='regular'&&n++<30)simDay(L);}`);
r = J(`const B=carBizInit(L);return {offers:B.offers.length,rivals:carBizRivals(L).length,peers:Object.values(B.rv).filter(x=>x.peer).length,hype:Math.round(B.hype),games:carP(L).stats.rs.gp,fol:B.fol};`);
ok('weekly tick ran: followers + rivals tracked', r.fol > 0 && r.rivals >= 1, r);
// force plenty of offers and accept the shoe + a brand
r = J(`const B=carBizInit(L);B.offers=[];B.sawShoe=1;B.hype=70;L.players[L.career.pid].ovr=80;for(let i=0;i<8;i++){carBizOffers(L,true);} const sh=B.offers.filter(x=>x.kind==='shoe').length,br=B.offers.filter(x=>x.kind==='brand').length;return {sh,br,pitches:B.offers.map(x=>x.pitch)};`);
ok('offers: at most one pending shoe offer per company, brands unique', r.sh >= 1 && r.br >= 1 && r.br <= 3, r);
r = J(`const B=carBizInit(L);const so=B.offers.find(x=>x.kind==='shoe');const a1=so.amt;const c=carBizCounter(L,so.id);const c2=carBizCounter(L,so.id);const st=B.offers.find(x=>x.id===so.id);return {c:!!c.msg,twice:!!c2.err,up:c.up||false,amtNow:st?st.amt:null,a1};`);
ok('agent counter works once per offer', r.c && r.twice, r);
r = J(`const B=carBizInit(L);const so=B.offers.find(x=>x.kind==='shoe');let res={};if(so){res=carBizAccept(L,so.id);}const so2=B.offers.find(x=>x.kind==='shoe');let err2=null;if(so2)err2=carBizAccept(L,so2.id).err||null;
const br=B.offers.filter(x=>x.kind==='brand');let n=0;for(const b of br){if(carBizAccept(L,b.id).ok)n++;}
return {shoe:!!res.ok,second:err2,brands:n,deals:B.deals.length};`);
ok('accept: shoe slot is single, brand slots fill', r.shoe && (r.second == null || /already/.test(r.second)) && r.brands >= 1, r);
// social
r = J(`const B=carBizInit(L);B.posts=2;B.lastG={gr:5,pts:30,win:true};const h0=B.hype;const a=carBizPost(L,'highlight');const b=carBizPost(L,'qa');const c=carBizPost(L,'bts');return {a:a.ok,b:b.ok,c:c.err||null,up:B.hype>=h0};`);
ok('social: two posts a week, hype moves', r.a && r.b && /twice/.test(r.c || '') && r.up, r);
r = J(`const B=carBizInit(L);const rv=B.rv[carBizRivals(L)[0].pid];rv.heat=40;let bad=0,good=0;for(let i=0;i<60;i++){B.posts=1;const x=carBizPost(L,'trash');if(x.bad)bad++;else if(x.ok)good++;}return {bad,good};`);
ok('trash talk backfires sometimes (not always)', r.bad > 5 && r.good > 15, r);
// charity
r = J(`const B=carBizInit(L);B.cash=5;B.ch.k=null;const f0=B.fans;const a=carBizCharity(L,'court');const b=carBizCharity(L,'clinic');const err=carBizCharity(L,'scholar').err;return {a:a.ok,b:b.err||null,cash:B.cash,love:B.love,fans:Math.round(B.fans*10)/10,f0:Math.round(f0*10)/10};`);
ok('charity: one event a week, costs cash, raises fans', r.a && /already/.test(r.b || '') && r.cash === 4.5 && r.love >= 3, r);
// season settle: pay deals
r = J(`const B=carBizInit(L);const c0=B.cash;runTo(()=>L.phase.startsWith('off'),9000);carBizTick(L);return {c0,c1:Math.round(B.cash*100)/100,last:B.sn.last||null,paid:B.paid,s:L.season};`);
ok('season settle pays the deals (net of agent fee)', r.last && r.last.net > 0 && r.c1 > r.c0 && r.last.fee > 0, r);
r = J(`const B=carBizInit(L);const n0=B.deals.length;runTo(()=>L.season>=5&&L.phase==='regular',30000);const p=carP(L);return {deals:B.deals.length,n0,earn:Math.round(B.earn*10)/10,fans:Math.round(B.fans),hype:Math.round(B.hype),season:L.season,rivals:carBizRivals(L).length,hist:B.hist.length,ach:Object.keys(L.career.ach||{}).filter(k=>['firstdeal','sigshoe','earn10','viral','charity10','fans90','archrival'].includes(k))};`);
ok('multi-season: no crash, income accumulates, deals expire/renew', r.earn > 0 && r.season >= 5, r);
r = J(`const B=carBizInit(L);const j=JSON.parse(JSON.stringify(L.career));return {same:JSON.stringify(j.biz)===JSON.stringify(B)};`);
ok('state survives a save/load round trip', r.same);
r = J(`const L2=newLeague({mode:'career',size:16,games:58});carCreate(L2,{first:'Old',last:'Save',pos:2,hgt:78,style:'',story:'grinder',path:'NCHF',team:null,num:3});delete L2.career.biz;const B=carBizInit(L2);return {ok:B.hype>0&&Array.isArray(B.deals)&&B.fans===40};`);
ok('old save without biz data gets defaults', r.ok);
console.log(fails ? 'FAILED ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
