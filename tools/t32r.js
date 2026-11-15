// v32 review: promised roles travel with a traded contract and are priced by the buyer (clauseTV). node tools/t32r.js
const {run}=require('./load.js')('src',7);
const out=run(`(()=>{const res=[];const ok=(n,c,x)=>res.push((c?'PASS ':'FAIL ')+n+(x?' '+x:''));
const L=newLeague({mode:'commish',size:16,games:82});
const buyer=L.teams[0], seller=L.teams[1];
const p=rosterOf(L,seller).sort((a,b)=>a.ovr-b.ovr)[3];   // a bench player on the seller
const er=expRole(L,buyer,p);
const base=clauseTV(L,buyer,p,false,100);
p.contract.role={k:'fs',v:34,br:[]};
const fs=clauseTV(L,buyer,p,false,100);
ok('promised franchise star priced down for the buyer', fs<base, 'exp '+er+' '+base+' -> '+fs.toFixed(1));
ok('discount capped at 15%', fs>=85-1e-9, fs.toFixed(1));
p.contract.role={k:er,v:30,br:[]};
ok('promise at the role he would get: no discount', Math.abs(clauseTV(L,buyer,p,false,100)-base)<1e-9);
p.contract.role={k:'dev',v:0,br:[]};
ok('promise below his role: no discount', Math.abs(clauseTV(L,buyer,p,false,100)-base)<1e-9);
p.contract.role={k:'starter',v:null,br:[]};
const st=clauseTV(L,buyer,p,false,100), rank=rotationOf(L,buyer).filter(x=>x.ovr>p.ovr).length;
ok('old starter promise rule unchanged', rank>=5?st<base:st===base, 'rank '+rank);
ok('seller side unchanged', clauseTV(L,seller,p,true,100)===100);
// win-first bar follows the league
const b0=wfBar(L);ok('win-first bar never under 66', b0>=66, 'bar '+b0);
for(const q of Object.values(L.players))q.ovr+=8; L._wfb=null; Object.defineProperty(L,'_wfb',{value:null,writable:true,configurable:true,enumerable:false});
const b1=wfBar(L);ok('win-first bar rises with a league rating climb', b1>=b0+3, b0+' -> '+b1);
const top=Object.values(L.players).filter(q=>!q.retired&&!q.prospect&&q.team!=null&&q.ovr>=b1).length;ok('pool stays ~5 a team', top>=4.5*L.teams.length&&top<=6*L.teams.length, 'n '+top);
ok('bar not saved', !JSON.stringify(Object.keys(L)).includes('_wfb'));
return res.join('\\n');})()`);
console.log(out);const f=(out.match(/FAIL/g)||[]).length;console.log(f?f+' FAIL':'all pass');process.exit(f?1:0);
