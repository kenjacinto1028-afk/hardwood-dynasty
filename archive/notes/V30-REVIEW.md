# v30 review (Opus QA, Nov 15 2026)

Scope: all v30a, v30b and v30c items checked against claude/nba/v30-plan.md, 2 bugs fixed, then 20 seasons in 4 leagues plus a v29 baseline. Branch `v30-review`.

## Bugs fixed
| Bug | Cause | Fix (src/league.js) | Result |
|---|---|---|---|
| Two-way slots left empty (#13) | After free agency, players with a market value just above the minimum kept refusing, and the answer was fixed for the whole phase. NBA season 2 started with 16 of 60 slots filled (v29: 48) | Market value only counts when it is 25%+ above the minimum. Refusals cool each week in season (0.8 down to 0.3). After free agency most unsigned players accept (factor 0.85 to 0.2) | Season 2 start: 42 of 60. Over 20 seasons about 1 in 3 asked players refuses at least once |
| Duplicate jersey numbers on a team | Trades pushed players onto rosters without a number check. Two-way players were not counted as taken. "23" and 23 did not match | `assignNumber` counts two-way players and compares as text. Number check on every roster move, after 2- and 3-team trades, and a clean-up at each season start (fixes older saves) | 0 duplicates in all 4 leagues (v29 had 11-29 a season) |

## 20-season results
Leagues: NBA commissioner, NBA franchise, PBL commissioner (16 teams), PBL franchise (30 teams). Baseline: v29 (commit 1253318), NBA commissioner. Raw output in `tools/runs30/`, summary with `python3 tools/r30sum.py.txt <files>`.

| Check | v29 NBA | v30 NBA comm. | v30 NBA franchise | v30 PBL 16 | v30 PBL 30 |
|---|---|---|---|---|---|
| Two-way slots filled at season start (avg, S2-S20) | 40/60 | 34/60 | 35/60 | 28/32 | 32/60 |
| Two-way slots filled at season end (avg) | 30/60 | 33/60 | 36/60 | 25/32 | 34/60 |
| Players asked for two-way / refused at least once | n/a | 365 / 121 (33%) | 356 / 134 (38%) | 246 / 65 (26%) | 341 / 129 (38%) |
| Free agents at season start rated at or above a typical 13th man | 21.6 | 28.6 | 28.6 | 14.7 | 23.2 |
| Two-way refusers still unsigned at season start | n/a | 10.2 | 9.8 | 7.1 | 9.6 |
| Playoff games a season | 65.5 | 88.7 | 87.8 | 31.7 | 88.8 |
| Playoff injuries a season (games lost) | 23.9 (132) | 32.5 (193) | 30.6 (177) | 11.1 (69) | 32.1 (179) |
| Playoff injuries per playoff game | 0.37 | 0.37 | 0.35 | 0.35 | 0.36 |
| Regular-season injuries (games lost) | 488 (2,827) | 478 (2,768) | 459 (2,701) | 247 (1,413) | 464 (2,662) |
| Top-10 players' playoff minutes a season | 2,466 | 3,154 | 3,325 | 1,869 | 2,911 |
| Jersey duplicates | 11-29 a season | 0 | 0 | 0 | 0 |
| Rosters outside 13-15 at season start | 0 | 0 | 0* | 0 | 1* |
| Errors / data problems | 0 | 0 | 0 | 0 | 0 |

*Your own team at 16 in one season: a test-script artifact (the game makes you cut to 15 before simming).

Playoff series lengths (best of 7, NBA commissioner, 160 first-round series): 4 games 22%, 5 games 31%, 6 games 28%, 7 games 19%. All rounds average 5.3-5.8 games. PBL 16 keeps best of 5 (avg 3.9-4.0) and a best-of-7 Finals, as planned.

ROTY: NBA season 1 went to a real rookie in both leagues (Cameron Boozer, Caleb Wilson). Later winners are mostly top-5 picks (59-86 OVR), with a few late picks (2-2, 1-14). PBL season 1 has no ROTY (no rookies tagged in PBL, by design).

Interviews (franchise): 0 repeated questions and 0 repeated question texts in 40 seasons. Periods: open 40/40, deadline 40/40, draft 37/40 (no draft interview when you have no picks), playoffs only when your team made it.

Sim speed (one process, same machine): v29 85-90 s per NBA season with offseason, v30 95-100 s (about +10%). Save size after 20 seasons about the same (27.1 MB vs 27.4 MB of JSON).

## Other review notes
- #25 tags the 2026 draft class (Boozer, Dybantsa, Peterson: 55 players) as season-1 rookies, since the game starts in 2026-27. Flagg's 2025 class has a season of service and is not tagged. Confirm this is what you meant by "2025-26 rookies".
- 6a +/-: the replay assumes 5 players a side on the floor. A team down to 4 (foul-outs) could misassign +/- for that stretch. Rare. Not changed.
- 8t / 7t: scouting report and ticker lines are still hard-coded strings in src/app.js and src/league.js, so Haiku couldn't add variants.
- Haiku's `ivAnswers` change (vary by question and slot) checked: answers differ per slot, no repeats.

## Caveats
- The 20-season runs used 4-5 processes on 2 cores, so their per-season times are inflated. Use the one-process numbers above for speed.
- The baseline is one v29 league (NBA commissioner). Each league ran one seed, so differences of a few percent are noise.
- Unsigned free agents above the 13th-man line went up (21.6 to 28.6). About 10 of them are two-way refusers. The rest are older veterans, same as v29. Not a v30 bug, but rosters stay full while useful players sit.
- (Corrected in round 2) The 72 OVR PBL free agent listed at league start signs within the first weeks; that snapshot was taken at league creation.
- (Fixed in round 2) Two-way fill drifting down over 20 seasons.
- The franchise runs let the AI make your offseason moves (draft, re-signs, free agency). Your regular season, playoffs and interviews were played as you.
- Browser tests ran headless Chrome only. v30c reported 118 checks (Sonnet's run had 126). All passed. The count depends on the league's state.

## Round 2 (same day): text keys + free-agent market
| Change | Where | Model tag |
|---|---|---|
| 8t/7t: scouting report "What to watch" lines and ticker stat/rumor lines moved into keys `sc.*` (5) and `tk.*` (12), 4 wordings each, wording changes per game day | src/league.js (end), src/app.js scoutDlg + tickerItems, tools/lint-v30-text.js | Sonnet + Haiku work |
| Two-way drift fix: the season-start free-agent cap (60) retired the lowest-OVR players first, deleting 9-23 young draftees a year before AI teams filled two-way slots. It now ranks young two-way-eligible players by the AI's two-way value (60% potential, 40% overall) | src/league.js startNewSeason | Opus |
| In-season asks: an unsigned player whose offers are all below his ask drops to the best offer, or 20% a week (was 10% a week, so a $23.5M ask never reached the minimum offers of capped-out teams) | src/league.js faRound | Opus |

20 seasons each (tools/runs30/v30n-*.txt):

| Check | v29 NBA | v30 round 1 NBA | v30 round 2 NBA | v30 round 1 PBL 30 | v30 round 2 PBL 30 |
|---|---|---|---|---|---|
| Two-way slots filled at season start (avg S2-S20) | 40/60 | 34/60 | 42/60 | 32/60 | 42/60 |
| Same, last 5 seasons | 41/60 | 35/60 | 38/60 | 33/60 | 40/60 |
| Two-way slots filled at season end (avg) | 30/60 | 33/60 | 42/60 | 34/60 | 44/60 |
| Free agents at season start rated at or above a typical 13th man | 21.6 | 28.6 | 22.4 | 23.2 | 18.0 |
| Players asked for two-way / refused at least once | n/a | 365 / 121 | 449 / 157 (35%) | 341 / 129 | 497 / 173 (35%) |
| Playoff injuries a season | 23.9 | 32.5 | 34.5 | 32.1 | 33.6 |
| Jersey duplicates / roster errors / sim errors | 11-29 a season / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |

Interviews (PBL franchise, 20 seasons): 0 repeated questions. Tests: lint 99 keys PASS, t27 71/71, t30a 29/29, t30b-ui 17/17, t30c 30/30, browser v30a 95/95, v30b 135/135, v30c 126/126.

Round 2 caveats
- One seed per league. Two-way fill still eases a little late in a run (about 53 to 38 in NBA), less than before (53 to 30).
- The league's average rating climbs from 57 to about 62-64 by season 10, then levels off. v29 does the same (13th-man line 43 to 54-55), so it is not a v30 change.
- Young unsigned players who are still cut at the 60 cap "retire" at 20-22. Realistic would be going overseas (pipeline clubs). Not changed.
- The in-season ask fix rarely fires in these runs. It is a safety net, measured only through the unsigned-FA count.
- A star who stays unsigned can now take a minimum deal mid-season if every team is capped out (a buyout-market style signing).
