// Draft-night save for tools/browser-p3x.js: plays season 11 of the franchise snap and stops at the start of the draft.
//   node tools/mkdraft.js   -> tools/_draft.json
const { run } = require('./snap.js')('src', 3, 'tools/snap/nba-team-s10.json.gz');
const js = run(`(()=>{const L=SL;let g=0;while(L.phase==='regular'&&g++<400)simDay(L);processPending(L);startPlayoffs(L);g=0;while(L.phase==='playoffs'&&g++<400)simPlayoffDay(L);
startOffseason(L);runLottery(L);startDraft(L);L.nextId=NEXT_ID;return JSON.stringify(L);})()`);
require('fs').writeFileSync('tools/_draft.json', js); console.log('saved tools/_draft.json', Math.round(js.length / 1024), 'KB');
