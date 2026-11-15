const fs=require('fs'),vm=require('vm');const SRC=process.env.SRC;const seed=+process.argv[2];
let s=(seed*2654435761)>>>0;const rnd=()=>{s|=0;s=(s+0x6D2B79F5)|0;let t=Math.imul(s^(s>>>15),1|s);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};
const ctx=vm.createContext({console,Math:Object.create(Math,{random:{value:rnd}}),setTimeout,clearTimeout,Date,performance,structuredClone,JSON,Object,Array,Set,Map});
vm.runInContext(fs.readFileSync(SRC+'/engine.js','utf8')+'\n'+fs.readFileSync(SRC+'/league.js','utf8'),ctx);
const out=vm.runInContext(`(function(){const L=newLeague({mode:'commish',size:30});while(L.phase==='regular')simDay(L);
const rows=[];for(const id in L.players){const p=L.players[id];const s=p.stats&&p.stats.rs;if(!s||!s.gp)continue;rows.push({pos:POS[p.pos],tp:p.tp,t3:p.t3,gp:s.gp,min:s.min,tpm:s.tpm,tpa:s.tpa,fga:s.fga});}return rows;})`,ctx)();
fs.writeFileSync((process.env.TAG||'')+'rows'+seed+'.json',JSON.stringify(out));
