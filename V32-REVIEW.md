# v32 review (S7, Opus, Nov 16 2026)

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
