// dump every player's ratings in a fresh NBA league: node tools/t32-dump.js out.json  (SEED=n default 3, SRC=src)
const load = require('./load.js'), SRC = process.env.SRC || 'src', SEED = +process.env.SEED || 3;
const { run } = load(SRC, SEED);
const o = run(`(function(){const L=newLeague({mode:'commish',size:30,games:82,nba:true});const K=['fin','mid','tp','pst','ft','hnd','pas','orb','drw','per','pdf','stl','blk','drb','iq','spd','agi','vrt','str'];
const out={};for(const p of Object.values(L.players)){if(!p.real)continue;const t=p.team!=null?L.teams[p.team].abbr:(p.tw?L.teams[p.tw.tid].abbr+' (2W)':'FA');out[p.name]={t,pos:POS[p.pos],ovr:p.ovr,ipt:p.ipt,dur:p.dur,a:K.map(k=>p[k])};}
return JSON.stringify({K,out});})()`);
require('fs').writeFileSync(process.argv[2], o); const j = JSON.parse(o); console.log('players', Object.keys(j.out).length);
