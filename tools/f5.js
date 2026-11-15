// v28.5 F5 checks: node tools/f5.js
const {run}=require('./load.js')(process.env.SRC||'src',+process.env.SEED||3);
console.log(run(`(()=>{const out=[];let ok=0,n=0;const chk=(c,m)=>{n++;if(c)ok++;else out.push('FAIL '+m);};
const L=newLeague({mode:'team',userTeam:0,nba:true});const P=nm=>Object.values(L.players).find(p=>p.name===nm);
const sum=(rows,k)=>rows.reduce((a,r)=>a+(r[k]||0),0);
const lb=nbaPoRows(P('LeBron James'));chk(sum(lb,'pts')===8521&&sum(lb,'gp')===302,'LeBron playoff career PTS 8,521 / GP 302 (BBRef lookup Nov 2026): got '+sum(lb,'pts')+'/'+sum(lb,'gp'));
chk(nbaPoRows(P('Stephen Curry')).some(r=>r.season==='2016-17'&&r.gp===17),'Curry 2016-17 playoffs (17 GP)');
const ms=nbaPastRows(P('Marcus Smart')),tm=new Set(ms.map(r=>r.team));chk(['BOS','MEM','WAS'].every(t=>tm.has(t))&&ms.every(r=>!r.est),'Marcus Smart real teams BOS/MEM/WAS ('+[...tm]+')');
let est=0,real=0;for(const p of Object.values(L.players).filter(p=>p.real)){const has=(typeof NBA_CAR2!=='undefined'&&NBA_CAR2[p.name])||NBA_CAR[p.name];if(has){real++;if(nbaPastRows(p).some(r=>r.est))est++;}}
chk(real>=380&&est===0,'no est rows for matched players ('+real+' matched, '+est+' with est)');
// totals identity on every row
let bad=0,rows=0;for(const D of [NBA_CAR2,NBA_CARPO])for(const k in D)for(const r of D[k]){rows++;if(r[18]!==2*r[5]+r[7]+r[9])bad++;}
chk(bad===0,'PTS = 2FG+3P+FT on all '+rows+' CAR2/CARPO rows ('+bad+' bad)');
// star RS rows untouched (only Durant PHX 2022-23 fixed)
chk(NBA_CAR['Stephen Curry'].rs.length>=15&&!nbaPoRows(P('Stephen Curry')).some(r=>r.est),'stars keep RS rows, playoffs added');
// advanced sanity: sample minute-weighted PER by season (current players only, so above the 15 league average)
const by={};for(const D of [NBA_CAR2])for(const k in D)for(const r of D[k])if(r[19]!=null&&r[4]>0){const b=by[r[0]]=by[r[0]]||[0,0,0];b[0]+=r[19]*r[4];b[1]+=r[4];b[2]++;}
const bad2=Object.entries(by).filter(([s,b])=>b[2]>=100&&(b[0]/b[1]<13||b[0]/b[1]>18)).map(([s,b])=>s+':'+(b[0]/b[1]).toFixed(1));chk(bad2.length===0,'avg PER of role-player rows per season in 13-18 (n>=100): '+bad2);
const lg=Object.entries(by).filter(([s,b])=>b[2]>=100).map(([s,b])=>s+' '+(b[0]/b[1]).toFixed(1)).join(', ');
// ap flag
chk(nbaPoRows(P('LeBron James')).every(r=>r.ap)&&nbaPastRows(P('Marcus Smart')).filter(r=>r.season!=='2025-26').every(r=>r.ap),'ap flag on estimated advanced rows');
// league leaders sanity
const top=(S,i)=>{let b=null;for(const D of [NBA_CAR2])for(const k in D)for(const r of D[k])if(r[0]===S&&r[4]>1500&&(!b||r[i]>b[1]))b=[k,r[i]];return b};
// Curry 2015-16 is a star row (hand-checked), Jokic 2022-23 too
const c=NBA_CAR['Stephen Curry'].rs.find(r=>r[0]==='2015-16');chk(c&&c[24]>=9,'Curry 2015-16 VORP real row');
console.log(out.join('\\n'));return ok+'/'+n+' pass\\nPER by season: '+lg;})()`));
