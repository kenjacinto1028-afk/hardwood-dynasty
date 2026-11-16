// v32b S2: node tools/t32b.js   (SEED=n default 5)
// A roleMinutes: sums to 240, stays in each role's range, stretches when short-handed, playoffs lean on the top roles
// B team roles: every rostered player has one; per team 1 franchise star at most, 2 stars at most, 5 starter-level, 1 sixth man
// C 30 days NBA: minutes per game by role inside the range (+-2), stars play more than end of bench; rebound/block knobs set
// D offers: a bigger promised role lowers the quote, a smaller one raises it; 2+ roles below for a good player = refusal
// E promise: a promised role is a floor in teamRoles; promiseState fails under the range; AI signing stores the role (c.rl)
// F morale: minutes judged against the role range
const load = require('./load.js'), SRC = process.env.SRC || 'src', SEED = +process.env.SEED || 5;
const out = []; let ok = 0, bad = 0;
const chk = (n, c, x) => { if (c) ok++; else bad++; out.push((c ? 'PASS ' : 'FAIL ') + n + (x != null ? ' :: ' + x : '')); };
const { run } = load(SRC, SEED);
const J = c => JSON.parse(run(`JSON.stringify((function(){${c}})())`));

// ---------- A ----------
{
  const r = J(`const list=[['fs'],['star'],['starter'],['starter'],['starter'],['sixth'],['rot'],['rot'],['rot'],['bench'],['bench'],['dev'],['dev']].map((x,i)=>({id:i,k:x[0]}));
    const C={rot:'Balanced'}, m=roleMinutes(list,C,false,240), sum=Object.values(m).reduce((a,b)=>a+b,0);
    const inR=list.every(x=>{const r=ROLE_BY[x.k],lf=RM_LIFT[r.i];return m[x.id]>=r.lo+Math.min(0,lf)-1e-6&&m[x.id]<=r.hi+Math.max(0,lf)+1e-6;});
    const short=list.slice(0,8), ms=roleMinutes(short,C,false,240), sumS=Object.values(ms).reduce((a,b)=>a+b,0);
    const mp=roleMinutes(list,C,true,240), mt=roleMinutes(list,{rot:'Tight'},false,240), md=roleMinutes(list,{rot:'Deep'},false,240);
    return {sum,inR,m,sumS,fsShort:ms[0],fsPo:mp[0],fsReg:m[0],benchPo:mp[9],benchReg:m[9],tightSt:mt[2],deepSt:md[2]};`);
  chk('roleMinutes: 13 players sum to 240', Math.abs(r.sum - 240) < 0.5, r.sum.toFixed(1));
  chk('roleMinutes: every player inside his role range (+ the blowout allowance on the top end)', r.inR, JSON.stringify(r.m));
  chk('roleMinutes: 8 available still sum to 240 (roles stretch)', Math.abs(r.sumS - 240) < 0.5 && r.fsShort >= r.fsReg, r.sumS.toFixed(1) + ' fs ' + r.fsShort.toFixed(1));
  chk('roleMinutes: playoffs give the franchise star more and the bench less', r.fsPo > r.fsReg && r.benchPo <= r.benchReg, r.fsReg.toFixed(1) + '->' + r.fsPo.toFixed(1));
  chk('roleMinutes: tight coach gives starters more than a deep one', r.tightSt > r.deepSt, r.tightSt.toFixed(1) + ' vs ' + r.deepSt.toFixed(1));
}
// ---------- B + C ----------
run(`var L=newLeague({mode:'commish',size:30,games:82,nba:true}); for(const t of L.teams) setTeamRoles(L,t);`);
{
  const r = J(`const bad=[];let miss=0;for(const t of L.teams){const ks=t.roster.map(id=>L.players[id]).filter(p=>!(p.injLong&&p.injury>=30)).map(p=>{if(!ROLE_BY[p.role]||p.roleT!==t.id)miss++;return p.role;});
      const n=k=>ks.filter(x=>x===k).length; if(n('fs')>1||n('star')>2||n('fs')+n('star')+n('starter')!==5||n('sixth')!==1)bad.push(t.abbr+':'+ks.join(','));}
    const fs=Object.values(L.players).filter(p=>p.team!=null&&p.role==='fs').map(p=>p.name);
    return {miss,bad,fs:fs.length,fsN:fs.slice(0,6)};`);
  chk('every rostered player has a role', r.miss === 0, r.miss);
  chk('each team: <=1 franchise star, <=2 stars, 5 starter-level, 1 sixth man', r.bad.length === 0, r.bad.slice(0, 2).join(' | '));
  chk('franchise stars league-wide: 8-20', r.fs >= 8 && r.fs <= 20, r.fs + ' ' + r.fsN.join(', '));
}
{
  const r = J(`for(let d=0;d<30;d++)simDay(L);const by={};for(const p of Object.values(L.players)){const s=p.stats.rs;if(!s||s.gp<10||p.team==null||p.roleT!==p.team)continue;const o=by[p.role]=by[p.role]||[0,0];o[0]+=s.min/60/s.gp;o[1]++;}
    for(const k in by)by[k]=+(by[k][0]/by[k][1]).toFixed(1);return {by,eng:{teamReb:ENG.teamReb,blkK:ENG.blkK,rebPos:ENG.rebPos}};`);
  const off = Object.entries(r.by).filter(([k, v]) => { const R = { fs: [34, 37], star: [32, 35], starter: [26, 32], sixth: [24, 28], rot: [16, 24], bench: [8, 16], dev: [0, 8] }[k]; return !R || v < R[0] - 2 || v > R[1] + 2; });
  chk('30 days: minutes per game by role inside the range (+-2)', off.length === 0, JSON.stringify(r.by));
  chk('franchise stars play more than starters, starters more than rotation, rotation more than bench', r.by.fs > r.by.starter && r.by.starter > r.by.rot && r.by.rot > r.by.bench, JSON.stringify(r.by));
  chk('engine knobs: team rebounds on, block boost on, bigs weighted on the glass', r.eng.teamReb > 0 && r.eng.blkK > 1 && r.eng.rebPos[4] > r.eng.rebPos[0]);
}
// ---------- D offers ----------
{
  const r = J(`const t=L.teams[3];const p=Object.values(L.players).filter(x=>x.team!=null&&x.team!==3&&x.ovr>=66&&x.ovr<=70&&x.age<=29&&(x.mval||0)<25).sort((a,b)=>b.ovr-a.ovr)[0];
    const er=expRole(L,t,p), up=ROLES[Math.max(0,roleRank(er)-1)].k, dn2=ROLES[Math.min(6,roleRank(er)+2)].k;
    const q=x=>negotiate(L,p.id,MINSAL,2,3,'signing',null,Object.assign({quote:true},x?{role:{k:x}}:{}));
    const base=q(null), qu=q(up), qd=q(dn2);
    const low=Object.values(L.players).filter(x=>x.team!=null&&x.team!==3&&x.ovr<=55&&x.age<=27)[0];
    const lr=expRole(L,t,low), ql=negotiate(L,low.id,MINSAL,1,3,'signing',null,{quote:true,role:{k:ROLES[Math.min(6,roleRank(lr)+1)].k}});
    return {n:p.name,ovr:p.ovr,er,up,dn2,base:base.quote,up_:qu.quote,dnRef:!!qd.refused,dnMsg:qd.msg||'',low:low.name,lowQ:ql.quote,lowRef:!!ql.refused};`);
  chk('a bigger promised role lowers his ask', r.up_ < r.base, `${r.n} (${r.er}) ${r.base} -> ${r.up} ${r.up_}`);
  chk('a good player offered 2 roles below what he would get refuses', r.dnRef, `${r.n} ${r.ovr} ${r.er} offered ${r.dn2}: ${r.dnMsg}`);
  chk('a fringe player offered one role lower still negotiates', !r.lowRef && r.lowQ > 0, r.low + ' ' + r.lowQ);
}
// ---------- E promise + AI role ----------
{
  const r = J(`const t=L.teams[7];setTeamRoles(L,t);const p=t.roster.map(id=>L.players[id]).find(x=>x.role==='bench'||x.role==='dev');const was=p.role;
    p.contract.role={k:'starter',v:26,br:[]};t.roleKey=null;setTeamRoles(L,t);const now=p.role;
    const fake={contract:{role:{k:'starter',v:26,br:[]}},team:7,stats:{rs:{gp:20,gs:0,min:20*10*60}},injuries:[]};const t7=L.teams[7];const w=t7.w,l=t7.l;t7.w=10;t7.l=10;
    const st=promiseState(L,fake);t7.w=w;t7.l=l; p.contract.role=null;t.roleKey=null;setTeamRoles(L,t);
    // AI signing in free agency stores the role
    const fa=L.fa.map(id=>L.players[id]).filter(Boolean).sort((a,b)=>b.ovr-a.ovr)[0];let rl=null;
    if(fa){const tt=L.teams.find(x=>x.roster.length<15);signContract(L,fa,tt.id,MINSAL,1,'signing',null,{rl:'bench'});rl=fa.contract.rl;}
    const fa2=L.fa.map(id=>L.players[id]).filter(Boolean)[0];let rl2=null,clauses=null;if(fa2){const tt=L.teams.find(x=>x.roster.length<15);signContract(L,fa2,tt.id,MINSAL,1,'signing');rl2=fa2.contract.rl;}
    return {was,now,st,rl,rl2};`);
  chk('a promised role is a floor (bench -> starter)', r.now === 'starter', r.was + ' -> ' + r.now);
  chk('promiseState: starter promised, 10 mpg after 20 games = failing', r.st === 'failing', r.st);
  chk('signContract stores the role he signed for (c.rl)', r.rl === 'bench' && ROLE_OK(r.rl2), r.rl + ' / ' + r.rl2);
}
function ROLE_OK(k) { return ['fs', 'star', 'starter', 'sixth', 'rot', 'bench', 'dev'].includes(k); }
// ---------- F morale ----------
{
  const r = J(`updateMorale(L);const ps=Object.values(L.players).filter(p=>p.team!=null&&p.moraleParts&&p.moraleParts.role);
    const under=ps.filter(p=>p.moraleParts.mpg<ROLE_BY[p.moraleParts.role].lo-1);const wrong=under.filter(p=>!(p.moraleParts.minutes<0));
    const inR=ps.filter(p=>p.moraleParts.mpg>=ROLE_BY[p.moraleParts.role].lo&&p.moraleParts.mpg<=ROLE_BY[p.moraleParts.role].hi);
    return {n:ps.length,under:under.length,wrong:wrong.length,inR:inR.length,inRpos:inR.filter(p=>p.moraleParts.minutes>0).length};`);
  chk('morale: players judged against their role (parts.role set)', r.n > 200, r.n);
  chk('morale: under the range = negative minutes part', r.wrong === 0, `${r.under} under, ${r.wrong} not negative`);
  chk('morale: inside the range = small plus', r.inR === r.inRpos, `${r.inRpos}/${r.inR}`);
}
console.log(out.join('\n')); console.log(`\nt32b: ${ok}/${ok + bad}`); process.exit(bad ? 1 : 0);
