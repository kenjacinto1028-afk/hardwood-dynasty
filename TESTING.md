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

v34: `node tools/t34.js` (scouting, young asks, top cap, legends awards; uses tools/snap/nba-team-s10.json.gz). Browser: `tools/browser-v34.py.txt` on the franchise save (`gunzip -c tools/snap/nba-team-s10.json.gz > tools/_t1.json`). Run summary: `tools/v34sum.py.txt` (payroll, floor, re-sign, top PER / WS, young asks).

v35b: pro-fog sort check `tools/browser-v35b.py.txt` (same loader as browser-v34, franchise save `tools/_t1.json`); PBL top-cap check: `SEED=21 SNAP=tools/snap/pbl16-commish-s10.json.gz node tools/r30.js 10` (cap shows only in a new league's later seasons: `SEED=21 NBA=0 SIZE=16 MODE=commish node tools/r30.js 20`), then `python3 tools/v34sum.py.txt <file>`.

v36a: `node tools/t36.js` (forced PBL top cap on the PBL save, NBA re-sign / early FA / top cap / owner cash on the NBA save; ~1 min). `tools/v34sum.py.txt` also prints 60+ re-sign losses by reason and owner cash (r30 `cash` row).

v36: MVP weight tuning on frozen seasons: `SNAP=tools/snap/nba-commish-s10.json.gz SEED=21 node tools/t36-awsnap.js dump 10 /tmp/awsnap` (~15 min), then `node tools/t36-awsnap.js grid /tmp/awsnap [sets.json|-] [show]` (seconds per run; sets.json = `{name:{mvp:{gs,ws,ws48,per,bpm},mvpTeam,fat1,fat2,fatOld}}`; `show` prints the top-5 ladder with WS rank). Hold-out: dump a second run with SEED=22.
v36a part 2: `node tools/per36.js [save]` = one NBA season, top PER / usage / TS / ppg (env SC / SK / UT try other engine values; `python3 tools/per36show.py.txt <out>` prints it).
v36c: same flow as v36; the in-spec sets grid used fat1 / fat2 / fatOld and gs (bpm = .50 - gs) with WS .35, ws48 .10, per .05 fixed (`tools/runs32/v36c-awgrid-s21.txt`, `-s22.txt`). Award run: `SNAP=tools/snap/nba-commish-s10.json.gz SEED=21 node tools/t33c-awards.js 10 > tools/runs32/v36c-awards-new.txt`, then `python3 tools/t33c-awsum.py.txt <file>` (~15 min).

v36d: `node tools/t36.js` also checks the hard-cap clear room (25 checks). To-do list browser check: `tools/browser-v36d.py.txt` (franchise save `tools/_t1.json`, as browser-v34). `tools/v34sum.py.txt` prints `capCleared` and why no move (`ccWhy`). MVP vs WS leader from a save's past seasons: sum each player's `hist` rows per season (traded players have one row per team).

v37a: UI tier checks for wide pages, the ⋯ menu, records tabs and the pipeline overview: `tools/browser-v37a.py.txt` (rename to .py, serve the game folder, `gunzip -c tools/snap/nba-team-s10.json.gz > tools/_t1.json`, `python3 browser-v37a.py PORT [PAGE] [SAVE]`; it also starts a new day-1 NBA league from the setup screen). It measures every table's natural width against its scroll box at 1600 / 1300 and taps through the menu at 390.

v37b: `node tools/t37b.js` (legacy mapping: day-1 top 3, legends' estimates, award -> season team, no double induction, real vs sim calibration on the commish save; ~1 min). HoF counts: `node tools/t37b-hof5.js` (5 seasons from `tools/snap/nba-commish-s10.json.gz`, ~10 min; `SRC=<old src>` for a baseline). Browser: `tools/browser-v37b.py.txt` (History book, All-time greats Top 100, Hall of Fame tab; day-1 NBA league + franchise save `tools/_t1.json`, same loader as browser-v37a).
