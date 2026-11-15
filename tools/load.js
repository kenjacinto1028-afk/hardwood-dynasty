// loader: const {ctx,run}=require('./load.js')(SRC, seed); returns vm context with engine+league
const fs=require('fs'),vm=require('vm');
module.exports=function(SRC,seed){let s=seed||777;const rnd=()=>{s|=0;s=(s+0x6D2B79F5)|0;let t=Math.imul(s^(s>>>15),1|s);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};
const ctx=vm.createContext({console,Math:Object.create(Math,{random:{value:rnd}}),setTimeout,clearTimeout,Date,performance,structuredClone,JSON,Object,Array,Set,Map,require});
vm.runInContext(fs.readFileSync(SRC+'/engine.js','utf8')+'\n'+fs.readFileSync(SRC+'/league.js','utf8')+(fs.existsSync(SRC+'/nba-2026.js')?'\n'+fs.readFileSync(SRC+'/nba-2026.js','utf8'):'')+(fs.existsSync(SRC+'/nba-text.js')?'\n'+fs.readFileSync(SRC+'/nba-text.js','utf8'):''),ctx);
return {ctx,run:c=>vm.runInContext(c,ctx)};};
