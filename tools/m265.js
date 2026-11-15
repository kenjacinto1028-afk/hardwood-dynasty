// v26.5 migration check: strip v26.5 fields from a league (like a v26.4 save), JSON round-trip, migrateLeague, check fields come back and the league still sims.
const {run}=require('./load.js')(process.env.SRC||'src',+process.env.SEED||3);
console.log(run(`(function(){const L0=newLeague({mode:'team',size:30,userTeam:0});for(let i=0;i<40;i++)simDay(L0);
const o=JSON.parse(JSON.stringify(L0));delete o.feed;delete o.feedN;delete o.media;delete o.press;delete o.rumors;delete o.prBlurbs;for(const t of o.teams){if(t.fo){delete t.fo.pat;delete t.fo.amb;}}
const L=JSON.parse(JSON.stringify(o));migrateLeague(L);const r=[];const ck=(n,c)=>r.push((c?'PASS ':'FAIL ')+n);
ck('t.fo.pat/amb on all teams (5-95)',L.teams.every(t=>t.fo&&t.fo.pat>=5&&t.fo.pat<=95&&t.fo.amb>=5&&t.fo.amb<=95));
ck('L.feed is an array',Array.isArray(L.feed));ck('L.media.rep = 50',L.media&&L.media.rep===50);
ck('foSummary works for every team',L.teams.every(t=>{const f=foSummary(L,t);return f.styleLabel&&Array.isArray(f.traits);}));
ck('feedList / mediaRep / pressOpen safe',feedList(L,'all',5).length>=0&&mediaRep(L)===50&&pressOpen(L)===null);
let ok=true;try{for(let i=0;i<30;i++)simDay(L);}catch(e){ok=false;r.push(String(e.stack).slice(0,200));}
ck('sims 30 days after migrating',ok);ck('feed fills after sim',L.feed.length>0);
return r.join('\\n')+'\\n'+r.filter(x=>x.startsWith('PASS')).length+'/'+r.length;})()`));
