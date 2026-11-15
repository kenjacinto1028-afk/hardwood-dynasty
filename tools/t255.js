// v25.5 checks: weekly snapshot, mood fit halved. SRC=<src> node t255.js
const fs=require('fs'),vm=require('vm');const SRC=process.env.SRC||'src';
let s=12345;const rnd=()=>{s|=0;s=(s+0x6D2B79F5)|0;let t=Math.imul(s^(s>>>15),1|s);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};
const ctx=vm.createContext({console,Math:Object.create(Math,{random:{value:rnd}}),setTimeout,clearTimeout,Date,performance,structuredClone,JSON,Object,Array,Set,Map});
const code=fs.readFileSync(SRC+'/engine.js','utf8')+'\n'+fs.readFileSync(SRC+'/league.js','utf8')+`
(function(){const res=[];const ok=(n,c,x)=>res.push((c?'PASS ':'FAIL ')+n+(x!=null?'  ['+x+']':''));
const L=newLeague({mode:'team',userTeam:0,size:30});
ok('no wk before day 7',!L.wk);
for(let i=0;i<7;i++)simDay(L);
ok('wk after day 7',L.wk&&L.wk.n===1&&L.wk.day===7,L.wk&&L.wk.day);
ok('wk has pr/mvp/heads',L.wk.pr.length===30&&L.wk.mvp.length>0&&L.wk.heads.length>0,L.wk.heads.join(' | '));
for(let i=0;i<7;i++)simDay(L);
ok('wk week 2 + prev order',L.wk.n===2&&Array.isArray(L.wk.prPrev)&&Array.isArray(L.wk.mvpPrev),L.wk.heads.join(' | '));
ok('wk inj entries well formed',L.wk.inj.every(x=>L.players[x.pid]&&x.games>=5));
const p=Object.values(L.players).find(p=>p.team!=null&&p.stats&&p.hist);const parts=moraleParts(L,p);
const f=fit(p,L.teams[p.team].coach);ok('mood fit = (fit-60)*0.15 clamp -4..3',Math.abs(parts.fit-Math.max(-4,Math.min(3,(f-60)*0.15)))<1e-9,f+' -> '+parts.fit);
const json=JSON.stringify(L.wk).length;ok('wk small',json<6000,json);
console.log(res.join('\\n'));})();`;
vm.runInContext(code,ctx);
