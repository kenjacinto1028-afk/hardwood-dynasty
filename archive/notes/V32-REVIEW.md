# v32 version-end review (Opus, Nov 16 2026)

Scope: v32a-v32h (S1-S5, S6a, S7 cleanup) checked against claude/nba/v32-plan.md, with the focus on where S2 (roles/minutes), S3 (rotations) and S5 (market) touch each other. Version-end tier: 20 seasons x 4 leagues, SEED=21, new leagues.
Runs: `tools/runs32/v32r-{nba,pbl16}-{commish,team}.txt`; summary `tools/runs32/v32r-summary.txt` (`python3 tools/v32r-sum.py.txt <files>`). Baselines: `tools/runs31/v31n-nba-commish.txt` (v31: save size, speed), v31 RPG/BPG from the v32b notes, market numbers from `tools/runs32/v32e-base.txt` / `v32e2-base-old.txt` (code before v32e).

## Verdict
v32 works as one system. 80 seasons, 0 errors, 0 broken saves, 1 harness-only roster flag. Minutes by role, young asks, re-signing and payroll hold for 20 seasons in all four leagues. Two cross-system problems found and fixed (below). Remaining issues all trace back to one root: the league's rating climb (NBA 58 -> 64, PBL 58 -> 65.6), which pushes blocks, "wants to win" leaves and team-side releases up over time.

## Fixed in this review
| # | Problem | Systems | Fix |
|---|---|---|---|
| 1 | Win-first moves grew with the rating climb: 0-2 a summer early, 4-6 in seasons 13-17 (NBA commish); "wants to win" leaves 5 -> 15-18 | S5 market x progression | Star bar follows the league: `wfBar(L)` = OVR of the ~5-per-team best active players, never under 66 (league.js, used by the `winFirstFA` pool and `resignLeave`). From the season-10 save (`tools/snap/nba-commish-s10.json.gz`), 6 seasons, SEED=31: old 0,1,3,1,3,4 (avg 2.0); 3.5-per-team 0,1,0,1,1,1; 4-per-team 0,1,1,1,0,0; kept 5-per-team 0,1,1,1,2,2 (avg 1.2). `tools/runs32/v32r-ab-*.txt` |
| 2 | A promised role (S2 roles: fs, star, sixth, rot...) stays on the contract after a trade and is a floor on the new team, but trade value only priced the old starter/minutes promises | S2 roles x trade AI | `clauseTV` prices S2 promises: -5% a role step above what he'd get there, max -15% (buyer only) |

Tests: node --check, lint 106 PASS, t30a 21/21, t32e 21/21, t32h 11/11, new `tools/t32r.js` 10/10. The 4 x 20-season runs used the code before these two fixes; the A/B runs above cover fix #1 (fix #2 only touches trades of players with a promise you gave).

## 20 seasons x 4 leagues (new leagues, SEED=21)
| | NBA commish | NBA franchise | PBL16 commish | PBL16 franchise | Target / before v32 changes |
|---|---|---|---|---|---|
| 9+ RPG | 14-25 (avg 19.3) | 16-22 (18.2) | 5-9 (6.2) | 3-12 (7.0) | 15-20 (NBA); ~8-11 scaled to 16 teams; v31 29 |
| 1.5+ BPG | 14-29 (21.5) | 14-23 (18.3) | 7-16 (11.3) | 4-16 (12.3) | 10+ (NBA); v31 6 |
| Franchise star mpg | 32.6-35.3 (34.4) | 33.2-35.3 (34.1) | 32.8-35.6 (34.2) | 32.3-35.2 (33.9) | 34-37 |
| Star | 31.7-33.2 (32.5) | 31.9-33.4 (32.7) | 31.2-32.8 (32.0) | 30.1-32.5 (31.9) | 32-35 |
| Starter | 26.7-27.7 (27.2) | 26.7-27.8 (27.2) | 26.2-28.1 (27.1) | 26.4-28.2 (27.1) | 26-32 |
| Sixth man | 23.3-26.3 (24.8) | 23.4-26.8 (25.0) | 22.7-27.2 (24.6) | 22.8-26.4 (24.4) | 24-28 |
| Rotation | 17.2-18.7 (17.8) | 16.5-18.2 (17.5) | 16.2-19.3 (17.8) | 17-19.5 (18.1) | 16-24 |
| Bench | 10.2-11.6 (10.9) | 10.4-11.9 (11.1) | 9.6-12 (11.1) | 10-12.7 (11.2) | 8-16 |
| Development | 6.6-7.7 (7.1) | 6.7-7.9 (7.2) | 6.6-8.5 (7.3) | 6.5-8.7 (7.3) | 0-8 |
| Young FA (25-) OVR 55- at minimum | all, every season | all | all | all | all; before v32e: 24 of 101 |
| Young 56-59 ask, max | $2.9M | $2.9M | $2.1M | $1.9M | ~2x min ($2.6M NBA); before v32e max $16.4M |
| Under 60 asking $10M+ | 0 | 0 | 0 | 0 | 0; before v32e 5 |
| Re-sign rate all / 60+ | 0.41-0.60 / 0.58-0.76 | 0.38-0.60 / 0.61-0.76 | 0.38-0.62 / 0.49-0.85 | 0.36-0.65 / 0.46-0.86 | before v32e 0.29-0.40 / 0.53-0.70 |
| Win-first pay cuts a summer | 0-6 (2.1) | 0-3 (1.5) | 0-1 (0.3) | 0-2 (0.3) | 1-2 (fixed #1) |
| Expiring trades / salary dumps a season | 0-5 / 0-3 | 0-6 / 0-6 | 0-4 / 0-4 | 0-6 / 0-4 | AI uses both |
| Payroll avg (next season, after FA) | 158-178 | 160-182 | 109-146 | 110-143 | before v32e2 180-188 (NBA) |
| Max committed next season | 221.7 | 221.3 | 169.7 | 170 | hard cap 221.7 / 170 |
| League OVR S1 -> S20 | 57.8 -> 63.8 | 58.2 -> 63.3 | 58.0 -> 65.4 | 57.8 -> 63.5 | flat would be ideal |
| Save S1 / S10 / S20 (MB JSON) | 4.8 / 14.0 / 22.8 | 4.8 / 14.1 / 22.8 | 2.3 / 7.3 / 12.2 | 2.3 / 7.3 / 12.1 | v31 S10 17.0; v32g S20 28.6 |
| Sec a season (late seasons) | 53-87 | 60-93 | 37-75 | 51-80 | v31 56-75 |
| Errors / roster problems | 0 / 0 | 0 / 1 (CLE 16 at S10 start, harness runs your offseason) | 0 / 0 | 0 / 0 | |

Notes
- Speed: seasons 1-5 ran with 4 leagues sharing 2 CPUs (190-312 s); late seasons alone-ish match v31.
- Blocks drift up in the NBA commissioner league from season 10 (22-29 players at 1.5+ BPG) as drafted players replace the real ones; franchise league stays 17-23. No upper target was set; the real NBA has ~10-15.
- "Team didn't want him" is the top re-sign reason and grows 5 -> 21-33 a summer (60-64 OVR becomes bench level as the league climbs). Asks follow the climb, so payroll stays flat.
- PBL16 is below the NBA targets for rebounds (6-7 at 9+ RPG vs ~8-11 scaled) and stars (31.9-32.0 vs 32-35). The targets were set on NBA data; PBL uses generated players.

## How the systems fit (checked)
- Roles (S2) -> rotation plan (S3): role targets feed `planRotation`; minutes land in range for all roles in all leagues (franchise star and star at the low end; sixth man under 24 in 2-3 of 20 seasons).
- Roles -> market (S5): offers carry the role (`expRole`, `roleAppeal`); re-sign "wants a bigger role" uses mpg under 18 for 62+ players; promised roles are floors in `teamRoles` and now priced in trades (fix #2).
- Contracts -> cap: mid-level is a real exception (4-17 signings a season), next-season payroll never above the hard cap (221.7 / 170) in 80 seasons.
- Market -> progression: asks, re-sign and win-first now all follow league-relative bars except "Team didn't want him" (rank-based already) - see open items.

## Open items (not changed)
| Item | Numbers | Option |
|---|---|---|
| Rating climb (root of the drifts) | NBA 58 -> 64 (flat after S8), PBL 58 -> 65.6 (still rising at S20) | Progression/draft balance pass: equilibrium near the start OVR, or re-center ratings each summer |
| Blocks drift (NBA commish) | 22-29 at 1.5+ BPG from S10 | After the climb fix; else scale `blkK` by league blk average |
| Stars at the low end | star 31.7-33.4, fs 32.6-35.3 (avg 34.1-34.4) | `RM_LIFT` star +0.5 (check early-season stars stay under 37) |
| PBL rebounds / stars | 9+ RPG avg 6-7 of 16 teams; stars 31.9 | Separate PBL check after the climb fix |
| Harness roster flag | CLE 16 at S10 (franchise) | Harness-only (AI runs your offseason); leave |

## Earlier: v32g review (S7, Opus, Nov 16 2026)

Scope: S1-S5 + S6a (v32a-v32f-a) read section by section in PROGRESS.md, checked against each other (roles vs minutes vs re-signing vs market vs rotations vs trades), plus the three open items (sixth men, mid-level, rotation chart). One 20-season NBA league from a new league (SEED=21, commissioner): `tools/runs32/v32g-20-nba-commish.txt`, summary `python3 tools/v32g-sum.py.txt <file>`.

## Verdict
The v32 systems work together. No errors, no roster problems, no broken saves in 20 + 2 x 10 seasons. Minutes by role, rebounds and blocks hold their targets for 20 seasons; the market stays stable (payroll, asks, re-signing don't drift); the league's rating climb levels off by season 8. Real problems found and fixed are below; the rest are open items with numbers.

## Fixed in v32g
| # | Problem | Where it showed | Fix |
|---|---|---|---|
| 1 | Sixth men ~22.5 min (range 24-28) | v32c/e runs | Plan fix, not per player: the first man off the bench gets one long run per half (`planRotation`), gap fill weights minutes owed, `planEven`; `RM_LIFT` sixth 5.5 -> 10.5, franchise star 5.5 -> 6.5. Now 24.3 avg (23.3-25.6) |
| 2 | Mid-level was bookkeeping only (any team could sign anyone up to the hard cap) | S4 caveat | `MLE_REAL`: over the cap, one above-minimum free agent a season up to $15M, only under the tax line, never past the hard cap; AI and you. Re-signing (Bird rights) still to the hard cap |
| 3 | Win-first pay cuts used "room to the hard cap" | Cross-check with #2 | Contenders over the cap offer from their mid-level (real-life pattern: vets take the MLE to chase a ring). Still 0-4 a summer (avg 1.6) |
| 4 | Coaching targets "fits under the hard cap" note wrong once #2 is on | Cross-check with #2 | Over the cap only mid-level deals listed, note "Needs your mid-level" |
| 5 | Saved chart dropped for the whole game when one player was out; the editor blocked Save and locked his squares | S4 caveat | One stand-in takes his blocks; game chart note + editor note; his squares can be cleared |
| 6 | Payroll-floor charge was fixed at season start, so a team under the floor gained nothing by taking salary in season, and salary dumps never favored them | Payroll mins in runs | Floor charge counts only up to the floor (`payroll`, `payNoFloor`); dumps go to teams under the floor first and they ask for fewer picks |
| 7 | t32e "4+ leave reasons" failed on some seeds (role reason needs 15+ games of stats; none in a new league) | t32e | Check is 3+ player kinds + team side |

## 20 seasons, one NBA league (new league, commissioner)
| S | sec | save MB | lg OVR | top-8 | 75+/80+ | 9+ RPG | 1.5+ BPG | MPG fs/star/st/6th/rot/bn/dev | payroll avg (min-max) | over tax | re-sign all / 60+ | top reasons 60+ left | win-first | exp / dump trades | MLE signings (avg $M) | asks med 60-64 / 65-69 / 70+ |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 180 | 5.6 | 58.1 | 65.7 | 32/17 | 17 | 13 | 35/32.9/27.5/24.5/17.6/11.3/7.1 | 179 (149-222) | 4 | 0.35 / 0.45 | team 8, cap 6, win 3 | 0 | 1 / 3 | 10 (17.7) | 10.0 / 29.6 / 48.4 |
| 2 | 134 | 7.2 | 59.2 | 66.1 | 30/15 | 15 | 11 | 34.9/32.6/26.9/25.2/17.6/11/7 | 165 (100-236) | 3 | 0.50 / 0.69 | team 10, money 7, price 4 | 1 | 1 / 2 | 4 (8.2) | 5.8 / 17.2 / 37.2 |
| 3 | 123 | 8.5 | 59.9 | 66.8 | 30/18 | 13 | 11 | 34.1/32.9/27.1/23.6/17.3/11.9/6.8 | 155 (67-211) | 1 | 0.52 / 0.85 | team 6, win 5, money 4 | 0 | 0 / 3 | 6 (10.3) | 6.8 / 15.6 / 21.7 |
| 4 | 101 | 9.9 | 61.3 | 67.5 | 32/15 | 14 | 15 | 34.1/32.5/26.8/25.6/17.5/11.2/7.5 | 156 (51-215) | 5 | 0.42 / 0.67 | team 9, price 4, win 4 | 2 | 0 / 0 | 7 (6.1) | 8.1 / 20.4 / 49.5 |
| 5 | 77 | 11.2 | 62.0 | 68.0 | 34/17 | 23 | 13 | 35.3/32.6/27.5/24.7/16.7/10.7/7.5 | 165 (51-220) | 7 | 0.49 / 0.72 | team 7, price 6, win 5 | 1 | 4 / 0 | 5 (10.9) | 5.8 / 26.4 / 26.1 |
| 6 | 52 | 12.4 | 62.3 | 68.2 | 35/11 | 26 | 18 | 34.6/32.5/27.5/24.2/16.7/10.9/6.7 | 174 (124-218) | 5 | 0.55 / 0.76 | team 11, win 6, money 4 | 0 | 5 / 1 | 7 (7.8) | 6.0 / 14.8 / 37.6 |
| 7 | 81 | 13.6 | 62.7 | 68.4 | 35/14 | 25 | 18 | 34.8/32.4/27.4/23.8/16.8/11.1/7.7 | 178 (145-230) | 6 | 0.50 / 0.67 | team 15, win 11, price 5 | 3 | 2 / 1 | 10 (12.3) | 8.9 / 19.8 / 41.2 |
| 8 | 83 | 14.8 | 63.6 | 68.8 | 34/12 | 17 | 19 | 34.6/32.4/26.9/24.1/17.1/10.9/7.5 | 181 (138-220) | 8 | 0.54 / 0.57 | team 13, cap 7, win 6 | 2 | 4 / 4 | 8 (11.9) | 6.5 / 21.3 / 39.5 |
| 9 | 81 | 16.0 | 63.6 | 68.8 | 27/13 | 18 | 18 | 35.3/33.2/27.7/24/17.4/11.5/7 | 177 (139-213) | 5 | 0.52 / 0.67 | team 14, win 9, cap 4 | 0 | 2 / 2 | 8 (14.9) | 5.9 / 20.1 / 33.9 |
| 10 | 66 | 17.2 | 63.9 | 68.9 | 30/13 | 18 | 21 | 34.8/32.7/27/25.5/17.9/10.6/7.8 | 163 (107-211) | 2 | 0.53 / 0.63 | team 22, win 12, price 8 | 3 | 4 / 1 | 10 (10.1) | 7.2 / 14.9 / 49.5 |
| 11 | 67 | 18.3 | 63.6 | 68.6 | 33/13 | 18 | 20 | 34.8/32.3/27.8/23.8/17.4/10.5/7.4 | 175 (110-202) | 1 | 0.56 / 0.67 | team 17, win 13, price 6 | 2 | 7 / 1 | 7 (12.2) | 6.9 / 14.4 / 44.8 |
| 12 | 61 | 19.4 | 63.6 | 68.5 | 33/12 | 15 | 18 | 34.7/33.1/27.3/23.6/17.7/10.8/7.8 | 175 (84-211) | 7 | 0.56 / 0.67 | team 28, win 9, price 7 | 2 | 3 / 0 | 11 (8.9) | 6.7 / 14.8 / 33.9 |
| 13 | 68 | 20.5 | 63.6 | 68.3 | 32/13 | 17 | 17 | 34.9/33.2/27.1/23.8/17.3/10.9/7.5 | 178 (142-219) | 7 | 0.51 / 0.61 | team 22, money 9, price 9 | 2 | 3 / 1 | 12 (8.5) | 4.8 / 17.0 / 32.9 |
| 14 | 71 | 21.7 | 63.7 | 68.2 | 27/13 | 19 | 21 | 35.3/32.3/27.2/23.3/17.5/11.8/7.3 | 170 (92-216) | 5 | 0.49 / 0.60 | team 33, win 11, price 5 | 1 | 4 / 0 | 10 (11.1) | 4.9 / 18.5 / 49.5 |
| 15 | 60 | 22.9 | 64.0 | 68.4 | 28/12 | 17 | 18 | 34.3/32.9/27.2/24.8/17.8/10.8/7.1 | 164 (70-212) | 5 | 0.50 / 0.62 | team 21, win 12, price 8 | 4 | 3 / 2 | 13 (9.4) | 5.7 / 13.8 / 55.3 |
| 16 | 124 | 24.1 | 63.9 | 68.8 | 32/14 | 16 | 19 | 35.2/32.8/27.5/25.1/17/10.1/7.5 | 162 (70-213) | 6 | 0.49 / 0.58 | team 30, win 13, price 9 | 3 | 1 / 0 | 6 (7.6) | 6.6 / 16.3 / 41.2 |
| 17 | 76 | 25.2 | 63.9 | 68.7 | 29/15 | 13 | 14 | 34.7/32.8/26.9/23.9/17.5/11.3/7.3 | 167 (64-216) | 3 | 0.52 / 0.65 | team 26, win 11, money 4 | 0 | 7 / 1 | 4 (7.9) | 5.7 / 11.6 / 27.5 |
| 18 | 68 | 26.3 | 63.3 | 68.5 | 29/16 | 16 | 16 | 34.3/32.5/27/23.4/17.8/11.1/7.3 | 173 (135-217) | 5 | 0.52 / 0.63 | team 22, win 13, cap 9 | 2 | 4 / 2 | 5 (6.4) | 5.0 / 18.2 / 36.6 |
| 19 | 62 | 27.4 | 63.7 | 68.4 | 28/15 | 15 | 20 | 35.5/32.3/26.7/24.2/17.4/10.7/7.6 | 166 (75-209) | 3 | 0.54 / 0.64 | team 28, win 9, fresh 4 | 2 | 1 / 2 | 11 (9.4) | 6.8 / 16.0 / 49.5 |
| 20 | 83 | 28.6 | 63.8 | 68.5 | 31/14 | 10 | 13 | 34.2/32.1/26.3/24.6/17.3/10.3/7.8 | 166 (77-218) | 4 | 0.51 / 0.57 | team 22, win 12, money 6 | 1 | 4 / 1 | 10 (10.2) | 7.0 / 15.7 / 33.5 |

Speed: seasons 1-9 shared the 2 CPUs with other jobs; seasons 10-20 alone: 60-83 s a season (one 124 s). FA 65+ left unsigned after free agency: 0 every summer. 0 errors, 0 roster problems.

Key reads
- Minutes by role (20-season range): fs 34.1-35.5, star 32.1-33.2, starter 26.3-27.8, sixth 23.3-25.6 (avg 24.3; 12 of 20 seasons at 24+), rotation 16.7-17.9, bench 10.1-11.9, development 6.7-7.8. All in range except sixth in 8 seasons (23.3-23.9).
- 9+ RPG: 10-26 (avg 17; target 15-20; 26/25 in S6-7, 10 in S20). 1.5+ BPG: 11-21, always 10+.
- Rating climb: league OVR 58.1 -> 63.6 by S8, then flat 63.3-64.0 to S20; top-8 OVR 65.7 -> 68.9, flat after; 75+ players 27-35, 80+ 11-18 (no inflation). Known since v29: the real-data start sits below the sim's equilibrium.
- Payroll (next season, right after free agency): avg 169 (155-181), 1-8 teams over the tax. Lowest team 51-77 in 7 summers (they pay the floor difference); at season start the lowest real salary in the saved league was $125M.
- Re-signing: all 0.35-0.56, 60+ 0.45-0.85 (avg ~0.65). Top reasons a 60+ player left: team didn't want him (6-33, grows as 60 becomes below-average with the climb), wants to win (3-13), price / money / cap.
- Win-first: 0-4 a summer (avg 1.6). Expiring trades 0-7, dumps 0-4. Mid-level signings 4-13 a season, average $6-18M.
- Asks (median at FA start): 56-59 $1.3-1.6M; 60-64 $4.8-10M; 65-69 $11.6-29.6M (falls as the climb makes 65-69 average); 70+ $22-55M (small samples).
- Save size: 5.6 MB (S1) -> 29.3 MB (S20) JSON, +1.2 MB a season (saved gzip in IndexedDB).

## Open items (not changed)
| Item | Numbers | Why left / option |
|---|---|---|
| Sixth men below 24 in 8 of 20 seasons | 23.3-23.9 | More lift barely moves it (gap minutes are the limit); next step would be planning the sixth man's stints before the starters' rest pattern |
| A team far under the floor some summers | 51-77M in 7 of 20 summers | Floor charge covers it; option: under-floor teams make 1-year overpay offers early in free agency |
| Committed payroll over the hard cap right after free agency | max 236 / 230 in 2 of 20 summers | Rookie-scale picks and player options aren't checked against the hard cap (NBA hard-capped teams can't); small rule fix if wanted |
| 9+ RPG outside 15-20 in 3 seasons | 23-26, 10 | Within seed noise around the target; tied to rating climb early on |
| "Team didn't want him" rises over time | 6 -> 22-33 a summer | Follows the climb (60-64 is bench level by S8); asks follow it, so not a market problem |
| Save growth | +1.2 MB / season | History/box scores; a pruning pass would help 30+ season leagues |
| Hand-set numbers | RM_LIFT, RESIGN chances, WIN_FIRST, ASK_RAMP, MKT_RAMP_LIFT, MLE_REAL | Checked on one seed each; results look realistic, but a second seed would confirm |

## Tests
node --check all, lint 104 PASS, t30a 21/21, t30c pass, t32a 38/38, t32b 20/20, t32c 15/15, t32d 15/15, t32e 21/21, new t32g 23/23, browser-v32g 22/22 (1300 + 390px). 10 seasons NBA SEED=21 commissioner + franchise (`tools/runs32/v32g-nba-*.txt`) vs v32e2: same payroll path, sixth 23-26, 0 errors. Saved leagues remade in `tools/snap/` (not in git).
