const {run}=require('./snap.js')('src',5,'tools/snap/nba-team-s10.json.gz');
require('fs').writeFileSync('tools/_t1.json',run(`(()=>{const L=SL;let g=0;while(L.day<=allStarDay(L)&&g++<400)simDay(L);return JSON.stringify(L);})()`));
