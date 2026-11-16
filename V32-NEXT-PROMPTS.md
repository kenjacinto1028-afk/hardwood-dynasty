# Next steps after the v32 review (Nov 16 2026)

Status (Nov 16): 1 (S6b) done as v32i, 2 (v33a) done; see PROGRESS.md. Next: v33b below.

## v33b prompt (Opus) — market follows the league
Clone kenjacinto1028-afk/pacific-basketball-league. Read PROGRESS.md (top 2 sections), TESTING.md. Create TASK_STATE.md and checkpoint each step.
- Asks use absolute OVR bands (ASK_RAMP, lowAskCap, MKT_RAMP_LIFT), so a flatter league pays less: with the stronger league pull (LG_GRAV 1.5/2/0.8) NBA payroll fell 182 -> 113; with the mild pull it drifts 182 -> 150; PBL16 averages $109M (floor $120M). Make the ramp and the market lift follow the league (e.g. bands relative to the league mean / percentile), keep Kenneth's rule for young players (55- = minimum, 56-59 up to ~2x) at the start league, then try the stronger pull again.
- Hard cap: one AI signing went over (BKN, 248.8 committed vs 221.7) in tools/runs32/v33a2-nba-commish.txt; find the path that skips the check.
- Blocks: 22-25 players at 1.5+ BPG late in NBA leagues even with a flat league; check generated bigs' block ratings vs real ones.
Tests: t30a, t32e, t32r; 20 seasons NBA + PBL16 commish (SEED=21) vs tools/runs32/v33a-*.txt (python3 tools/v32r-sum.py.txt). Update PROGRESS.md and README. Push if GitHub is linked, else send a zip.

Run in order, one at a time (both edit league.js). Models per claude/model-routing.md.

| Order | Session | Model | Test tier |
|---|---|---|---|
| 1 | S6b history import (files v120) + short final check | Opus | One system + 10 seasons NBA |
| 2 | v33a balance: rating climb, blocks drift, star minutes, PBL check | Opus | Version end (20 seasons NBA + PBL16) |
| later | Data gaps Kenneth may send: All-Star starters, single-game opponents, retired-number years | (Kenneth) | - |

## 1. S6b prompt (Opus)
Clone kenjacinto1028-afk/pacific-basketball-league. Read PROGRESS.md (top 2 sections), TESTING.md, V32-REVIEW.md (top section) and project doc claude/nba/v32-plan.md (S6). Create TASK_STATE.md and checkpoint each step.
Data: NBA_History_v120.zip (attached): six history workbooks (blanks filled, yellow cells + "Fill Log v120" sheet), HISTORY_V120_REPORT.md (read first), NBA_ADVANCED_RS_BY_SEASON_v120.csv.
- Import into the game data (one universe, no source labels in the UI): awards (All-NBA/Def/Rookie, All-Star, stat leaders), HOF, franchise seasons (W-L, result, coach), franchise leaders (RS from the team sheets; RS Recomputed v120 is the checked copy), retired numbers (drop the 3 duplicate rows, keep league-wide #6 separate), league records (Career incl. the rebuilt RS top 25, Single-season RS v120, Single-game, Team, Advanced RS v120).
- Hidden per-row source flag (csv / game / filled) in the data only.
- Advanced stats: every history row gets PER/TS%/WS/BPM/VORP. Recompute with the game's own formulas (team context from the franchise-season file, league averages per season) so history and sim seasons compare like with like; use the B-Ref CSV to check the recompute is close (report correlation, largest gaps). Playoffs: same formulas from the playoff rows in the game.
- Leave out NBA_PRE1997_SIMULATED_PLAYOFF_STATS (simulated). Gaps not in v120 (All-Star starter, single-game opponent, retired years): fill per the plan's order (in-game data, Claude's knowledge, then plausible values consistent with the rest), source flag `filled`, so a later CSV replaces them.
- Sim seasons append to the same history and can break records.
Tests: new tools/t32f.js (counts per file, no duplicates, no real/game labels in rendered pages, champions/runners-up consistent with franchise seasons, sim season appends and can set a record, a later CSV replaces a filled row, advanced stats on every history row), browser check of History + a team page + a legend's page (1300 + 390px), then 10 seasons NBA commissioner SEED=21 (history pages and save size vs tools/runs32/v32r-nba-commish.txt). Update PROGRESS.md and README. Push if GitHub is linked, else send a zip of changed files.

## 2. v33a prompt (Opus) — balance
Clone kenjacinto1028-afk/pacific-basketball-league. Read PROGRESS.md (top 2 sections), TESTING.md and V32-REVIEW.md (top section). Create TASK_STATE.md and checkpoint each step.
- Rating climb: league OVR rises 58 -> 64 (NBA, flat after S8) and 58 -> 65.6 (PBL16, still rising at S20). Find the cause in progression / draft class strength / retirement and bring the equilibrium near the starting level. Don't re-center by hand-editing players.
- After that, re-check what drifted with it: 1.5+ BPG (NBA commish 22-29 from S10; real NBA ~10-15), 9+ RPG (target 15-20), "team didn't want him" re-sign reason, win-first per summer (target 1-2; bar is now league-relative, `wfBar`).
- Star minutes: star 31.7-33.4 and franchise star 32.6-35.3 sit at the low end of 32-35 / 34-37. Raise `RM_LIFT` for those roles a little; early-season stars must stay under 37.
- PBL16: 9+ RPG avg 6-7 (scaled target ~8-11) and stars ~31.9. Check again after the climb fix; tune only if still off.
Tests: t30a, t32b, t32e, t32h, t32r; 20 seasons NBA commissioner + 20 seasons PBL16 commissioner (SEED=21) vs tools/runs32/v32r-*.txt (`python3 tools/v32r-sum.py.txt`). Update PROGRESS.md and README. Push if GitHub is linked, else send a zip of changed files.

## Data Kenneth could add later (optional)
- All-Star starters per season: basketball-reference.com/allstar/NBA_YYYY.html (starters are listed first).
- Single-game record opponents: BBRef game logs (Stathead) or Wikipedia "List of NBA single-game records".
- Retired-number years: each team's Wikipedia page, Retired numbers table.
