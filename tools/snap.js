// Saved-league loader: const {run,ctx}=require('./snap.js')(SRC, seed, 'tools/snap/nba-s10.json.gz')
// Loads engine + league (load.js), then the saved league into the global SL (migrated like a browser load). Use SL in run(`...`).
const fs = require('fs'), zlib = require('zlib');
module.exports = function (SRC, seed, file) {
  const o = require('./load.js')(SRC, seed);
  const raw = fs.readFileSync(file); o.ctx.__snap = JSON.parse((file.endsWith('.gz') ? zlib.gunzipSync(raw) : raw).toString());
  o.run(`var SL = __snap; delete this.__snap; NEXT_ID = SL.nextId || (Math.max(...Object.keys(SL.players).map(Number)) + 1); migrateLeague(SL);`);
  return o;
};
