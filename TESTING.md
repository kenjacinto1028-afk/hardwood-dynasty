# Testing tiers (Nov 15 2026)

Pick the smallest tier that covers what changed. Run long sims in the background while doing other work.

| Change touches | Test | Rough time |
|---|---|---|
| UI or text only | `node --check`, `node tools/lint-v30-text.js`, the one browser test for that page | 2-5 min |
| One system (two-way, interviews, jerseys, one dialog's logic) | Its unit test + 3 seasons from a saved league | 5-8 min |
| Several systems (free agency, progression, trade AI, contracts) | 10 seasons, one league (start from a saved league if the issue is late-game) | ~15 min |
| End of a version | 20 seasons, one NBA league from a new league (`tools/r30.js`) | ~35 min |

Speed rules
- Use a 16-team PBL league for logic checks (~40 s a season); use NBA only for NBA features (~95 s a season).
- One league per check, not four. Compare against the last saved results in `tools/runs30/`.
- Only run the browser tests for pages that changed.
- One seed per test: treat differences under ~10% as noise.

## Saved leagues (start tests 10 seasons in)
Files in `tools/snap/` (gzip JSON, saved at day 0 of season 11):
- `nba-commish-s10.json.gz` — NBA, commissioner
- `nba-team-s10.json.gz` — NBA, franchise (your team id 5)
- `pbl16-commish-s10.json.gz` — PBL, 16 teams, commissioner

Use in a test:
```js
const {run} = require('./snap.js')('src', 3, 'tools/snap/pbl16-commish-s10.json.gz');
run(`(()=>{ const L = SL; /* sim from here */ })()`);
```
Long-sim harness from a saved league: `SNAP=tools/snap/nba-commish-s10.json.gz node tools/r30.js 3`

Remake them when save fields change (each version): `SEED=21 NBA=1 SIZE=30 MODE=commish node tools/snap-make.js 10` (MODE=team for franchise; NBA=0 SIZE=16 for PBL).
v33d: the 20-season run can write the commissioner saves on the way: `SEED=21 NBA=1 MODE=commish SNAPOUT=tools/snap/nba-commish-s10.json.gz node tools/r30.js 20` (SNAPAT=10 default; same loop as snap-make).

Caveats
- A saved league goes stale when save fields change; `migrateLeague` covers most of it, but remake each version.
- Slow problems (rating climb, contract inflation) still need the 20-season run at the end of a version.

v33e: browser check for legends' trophy cases, the single-file build and the floor messages: `tools/browser-v33e.py.txt` (rename to .py, serve the folder, `python3 browser-v33e.py PORT [PAGE] [SAVE]`). Saves it needs are not committed (big): `gunzip -c tools/snap/nba-commish-s10.json.gz > tools/_s1.json` for the legends part; for the floor part play S11 into free agency day 11 from that snap (`faDay(L)` loop after the offseason calls, as in tools/snap-make.js) and write the league JSON to tools/_fa.json. Single file: `python3 -I build.py --single . pbl-single.html`, then pass `pbl-single.html` as PAGE.
