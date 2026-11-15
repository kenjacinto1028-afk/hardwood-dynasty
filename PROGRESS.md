# PBL progress

## v32 version-end review (Opus, Nov 16 2026)
- [x] Review v32a-v32h against claude/nba/v32-plan.md, focus on S2 roles/minutes x S3 rotations x S5 market. Report: `V32-REVIEW.md` (+ project doc claude/nba/v32-review.md); next prompts `V32-NEXT-PROMPTS.md`
- [x] 20 seasons x 4 leagues (NBA commish/franchise, PBL16 commish/franchise, SEED=21): `tools/runs32/v32r-*.txt`, summary `tools/runs32/v32r-summary.txt` (`python3 tools/v32r-sum.py.txt`). 0 errors; minutes by role in range (stars at the low end); young asks all at min / max $2.9M; re-sign 60+ 0.58-0.76 (NBA); next-season payroll never over the hard cap; save S20 22.8 MB (v32g 28.6)
- [x] Fix: win-first bar follows the league (`wfBar`, ~5-per-team best, never under 66): with the absolute 66, win-first moves grew 0-2 -> 4-6 a summer and "wants to win" leaves 5 -> 15-18 as league OVR climbed. A/B from the season-10 save (`tools/snap/nba-commish-s10.json.gz`, 6 seasons): old 0,1,3,1,3,4; 4-per-team 0,1,1,1,0,0; kept 5-per-team 0,1,1,1,2,2
- [x] Fix: promised S2 roles (fs/star/sixth/rot...) travel with a traded contract and are a floor on the new team; `clauseTV` now prices them (-5% a role step above his expected role there, max -15%)
- [x] History files v120 (separate zip `NBA_History_v120.zip`): checked vs Basketball-Reference data, blanks filled with a fill log, advanced stats added (see its HISTORY_V120_REPORT.md)
- [x] Tests: node --check, lint 106 PASS, t30a 21/21, t32e 21/21, t32h 11/11, new `tools/t32r.js` 10/10
- Open: rating climb (NBA 58 -> 64, PBL 58 -> 65.6) drives blocks drift (NBA commish 22-29 at 1.5+ BPG late), "team didn't want him"; stars/franchise stars at the low end of their ranges; PBL16 rebounds low (6-7 at 9+ RPG). Plan: V32-NEXT-PROMPTS.md (v33a)


## v32h (Opus, Nov 16 2026): cleanup from the v32 review
- [x] Sixth man first (`planRotation`, engine.js): the starter he pairs with (best position fit, not a star) sits up to `SIX_EARLY` (4) minutes earlier each half and comes back earlier, so the sixth man's run starts before the rest of the starters' rest pattern. Franchise star lift `RM_LIFT` 6.5 -> 5.5 (6-6.5 pushed them to ~38 early in a season)
- [x] Hard cap (league.js): AI teams can't take on trade salary that leaves next season's committed payroll over the hard cap (`tradeCheck`; your team may, your call); icons re-sign under the hard cap (hometown discount up to 25%, else he leaves, logged `t:cap`); AI team options declined if picking them up leaves the team over. Player options stay the player's right. Rookie deals and RFA matches were already checked
- [x] Save pruning (`pruneSave`, each new season): stale per-opponent "this season" lines dropped; retired players' per-team career lines packed (`vsPack` / `vsUnpack`, read back the same) and mood/discipline/daily caches dropped. Nothing shown in the game is lost
- [x] Report: `tools/r30.js` row `v32e.capOver` (first event that puts a team over the hard cap, max committed payroll for next season)
- [x] Tests: node --check, lint 104 PASS, t30a quick 21/21, t30c 30/30, t32b 20/20, t32c 15/15, t32e 21/21, t32g 23/23, new `tools/t32h.js` 11/11
- [x] 10 seasons NBA SEED=21 (`tools/runs32/v32h-nba-*.txt`) vs v32g:
  - Sixth men: commish 23.3-26.3 (avg 24.8, under 24 in 1 of 10; v32g avg 23.9, 7 of 10), franchise 23.4-26.6 (avg 25.0, 2 of 10; v32g 24.9, 1 of 10)
  - Franchise stars 33.2-35.3 (v32g 34.3-35.7); starters 26.7-27.7 (same)
  - Next-season committed payroll right after free agency: max 221.7 (= hard cap) every summer (v32g review: up to 236). Over-cap events only in seasons 1-2 (starting contracts) and one in-season signing (OKC S6, franchise)
  - Save at S10: 14,292 / 14,409 KB (v32g 17,441 / 17,529): -18%; growth ~1.05 MB a season (was ~1.3)
  - Payroll avg 162-178, re-sign 60+ 0.58-0.76; 0 errors; roster problems: your team at 16 once (franchise S10, harness only)
- Open:
  - Sixth men still dip under 24 in 1-2 of 10 seasons (gap minutes when starters' targets are high)
  - Franchise stars sit at the low end of 34-37 (3-4 of 20 seasons at 33.2-33.9); the early-season test limits raising their lift
  - First-season over-cap teams come from the starting contracts (OKC, NYK, DEN, SAS); they shed it over time

## v32g (Opus, Nov 16 2026): open items + v32 review (S7)
- [x] Sixth men: plan fix (`planRotation` long run per half for the first man off the bench, owed-minutes gap fill, `planEven`; `RM_LIFT` sixth 10.5, fs 6.5). 20 seasons: sixth 24.3 avg (23.3-25.6, was ~22.5); other roles in range (fs 34.1-35.5, star 32.1-33.2, starter 26.3-27.8, rot 16.7-17.9, bench 10.1-11.9, dev 6.7-7.8)
- [x] Mid-level is a real cap exception (`MLE_REAL`): over the cap, one above-minimum free agent a season up to $15M, under the tax line, never past the hard cap; AI and you; re-signing still to the hard cap. "Use mid-level" unticked over the cap = refused with a reason; popup warnings. Win-first and coaching targets follow it. 4-13 mid-level signings a season ($6-18M avg)
- [x] Saved rotation chart: a player out gets one stand-in for his blocks (no fallback to the coach); game chart note "Chart changed for this game: X out: Y took his N blocks"; editor note, Save not blocked, his squares can be cleared
- [x] Review fixes: floor charge counts only up to the floor (salary added in season uses it up); salary dumps go to under-floor teams first; t32e leave-kinds check (seed noise)
- [x] Saved leagues remade: `tools/snap/nba-commish-s10.json.gz`, `nba-team-s10.json.gz` (3.8 MB each), `pbl16-commish-s10.json.gz` (1.9 MB). Not in git (`.gitignore`); sent in a separate zip
- [x] Tests: node --check, lint 104, t30a 21/21, t30c pass, t32a 38, t32b 20, t32c 15, t32d 15, t32e 21, new `tools/t32g.js` 23/23, new `tools/browser-v32g.py.txt` 22/22. 10 seasons NBA commish + franchise (`tools/runs32/v32g-nba-*.txt`), 20 seasons new NBA league (`tools/runs32/v32g-20-nba-commish.txt`): 0 errors, 0 roster problems
- [x] Report: `V32-REVIEW.md` (+ project doc `claude/nba/v32-review.md`): per-season table (asks by OVR, payroll, re-sign rate + reasons, win-first, expiring trades, RPG/BPG, minutes by role, rating climb, save size, speed)
- Open / caveats:
  - Sixth men under 24 in 8 of 20 seasons (23.3-23.9)
  - A team sits $51-77M committed after free agency in 7 of 20 summers (pays the floor difference)
  - Committed payroll over the hard cap after free agency twice (236 / 230): rookie-scale picks and player options skip the hard-cap check
  - Save grows ~1.2 MB a season (29 MB JSON at S20)
  - Hand-set numbers checked on one seed

## v32f-a (Sonnet, Nov 16 2026): one universe, no real-vs-game split in the UI
- [x] History > Seasons: one list, newest first (this league's seasons, then 2025-26 back to 1946-47), same six columns. The "Real NBA history" sub-tab is gone (an old save with that tab selected opens Seasons). Rows from the NBA data have no standings, so they are not clickable and Best record shows a dash
- [x] History > Championships: one list, each team's NBA titles + titles won here as one number (no "in this league" text); defunct franchise (Baltimore Bullets) is a row in the same list, sorted by count
- [x] History > Awards: NBA seasons sit in the same Awards history table below this league's; four "Most ... awards" panels (MVP, Finals MVP, DPOY, Coach of the Year) count both together (`awardLeadersAll`, `awardLeadersPanels`)
- [x] Team pages: the "Real NBA history" panel is gone. Franchise summary shows Finals appearances, Championships and Finals losses as combined counts with the years in order (`teamFinalYears`); Finals MVPs of earlier titles are rows in Award winners (`nbaTeamHonors`). The header "Titles" tile now counts NBA + league titles (it showed league titles only, 0 for Boston next to "18× champions")
- [x] Trophy case: one case; honors from the NBA award list are merged by award type into the same case and drawn like any other (no "(real NBA)", no "Before this league" heading)
- [x] Dynasties & eras: no `real` class, no muted rows, no "real NBA" label or "greyed" note (`.dyncard.real` CSS removed)
- [x] Player pages: no "est." tags, no greyed estimated rows, no "Career = real NBA + sim seasons" note; rating chart note reads "The chart starts when ratings were first tracked. Last point: rating now."; franchise wins chart note no longer lists real titles
- [x] Other text: Legends intro, setup / How it works lines in `src/nba-text.js` and `src/app.js` ("Real teams, rosters..." -> "Teams, rosters, contracts and coaches as of Nov 2026"), draft history empty text, type comparison tooltip. Internal flags (`p.real`, `a.real`, `d.real`, `e.real`) stay in the data and are never shown
- [x] Tests: node --check all, lint 104 PASS, t30a 29/29, new `tools/t32f-a.js` 43/43 (renders the real app.js views in node with a DOM stub: no real-vs-game text on any History tab, 30 team pages x 2 tabs, 4 player pages, trophy cases; seasons in order; title / Finals counts match the data; header tiles; old code fails 28 of these). Browser `tools/browser-v32f-a.py.txt` 36/36 (History, Awards, Dynasties, a team, a real player; 1300 + 390px, no horizontal scroll)
- Open / caveats:
  - Seasons list is newest first (same direction as before). Putting 1946-47 on top is a one-line sort change if you want oldest first
  - NBA season rows have no W-L, best record or standings page yet (dash, not clickable); the team season-by-season table still lists this league's seasons only. Both are for S6 (history rebuild)
  - Removing the "est." tag means estimated seasons in a player's table now look like any other row (they are still left out of the career line). S6 decides how filled rows are handled
  - Left alone on purpose: "real" in the sense of genuine (e.g. "real title shot", "real minutes", hidden rookie "real rating" after summer league, "real offer" counts)
  - `t32f-a.js` needs no browser but a league with a season: `node tools/t32f-a.js 1` sims one NBA season (~90 s); `SAVE=/tmp/s1.json` keeps it, `LOAD=/tmp/s1.json` reuses it. Browser file: copy the json to `tools/_s1.json`, serve the folder, `python3 browser-v32f-a.py PORT [SHOTS_DIR]`

## v32e round 2 (Opus, Nov 16 2026): smooth asks, realistic re-signing, de-tuned
- [x] Ask ramp (`ASK_RAMP`, `lowAskCap` -> `{cap, hard, soft}`, `rampAmt`): 55 and under = minimum; ceiling grows ~38% a point from 56 (~1x) to 59 (~2x) to 64 (~10x), times a stable per-player factor 0.88-1.12. Hard to 59; from 60 soft (the part above the ceiling kept at 15% at 60 ... 55% at 64); 65+ open market. Removes the cliff at 60
- [x] Market budget: the ramp is counted in `computeMarket`; part of the money not paid to low-rated players moves up (scale may rise up to 20%, `MKT_RAMP_LIFT`), the rest stays as team room. Without it, average payroll fell to ~$146M by season 4; moving all of it up made 65s ask ~$35M
- [x] Re-signing rewritten (`resignWantP`, `resignLeave`, `resignDecide`, `resignLog`, `RESIGN_WHY`): team side = a chance it wants him (rotation 92%, top-10 75%, young 60%, fringe 30%, end of bench 15%; less for vets on tank/rebuild teams, 33+, over the tax) and how far below his ask it goes (70-95% per case). Player side = separate chances to leave: money, winning (losing team), role (under 18 mpg), mood, coach fit, fresh start, win-first; loyalty cuts them; icons can leave too (rarely). Reason in his transactions; news `news.leave` for 68+ (replaces `news.walk`)
- [x] De-tuned: win-first has no quota (each candidate decides once, chance 0.8 x score, signs with one of the top 3 contenders); bar 66+ / 30+ (69+ stars almost never reach free agency); expiring-trade max 5 -> 8 (safety cap only)
- [x] Report: `tools/r30.js` row `v32e` adds contracts signed by OVR band, payroll next season, leave reasons (all / 60+). `python3 tools/v32e-sum.py.txt <runs>`
- [x] Tests: node --check, lint 104 PASS, t30a quick 21/21, t30c 30/30, t32e 21/21 (adds: smooth ramp, per-player variation, 4+ leave reasons, no quota)
- [x] 10 seasons NBA SEED=21 (`tools/runs32/v32e2-nba-commish.txt`, `-team.txt`; old-code payroll baseline `tools/runs32/v32e2-base-old.txt`, 4 seasons):
  - Asks at FA start (new league): median 58 $1.9M, 59 $2.5M, 60 $3.8M, 61 $5.5M, 62 $7.8M, 63 $11.4M, 64 $14.7M, 65 $20.0M, 67 $29.4M (real NBA salaries at these ratings: 64-65 $16M, 66-67 $23M, 68-69 $28M). Under 60 at $10M+: 0 in 20 seasons
  - Contracts signed (median of season medians), commish / franchise: 55- $1.3M, 56-59 $1.3M, 60-64 $5.6 / 5.7M, 65-69 $18.1 / 21.1M, 70-74 $30.2 / 32.0M, 75+ $48.1 / 47.0M. Old code: 56-59 ~$6M, 60-64 ~$9M, 65-69 ~$17M
  - Payroll next season avg: commish 173 (163-186), franchise 173 (163-183); old code 180-188. Lowest team avg $106M / $113M (old 118-136); teams under the $148.5M floor pay the difference
  - Re-sign rate 60+: commish 0.47-0.73 (avg 0.64), franchise 0.61-0.75 (0.69); all: 0.46 / 0.50. Old code 0.56-0.70 / 0.34. Why 60+ players left (10 seasons, commish): team didn't want 137, wants to win 61, price 40, cap 38, money 35, fresh start 21, mood 7
  - Win-first per summer: commish 1,0,0,0,2,2,1,1,1,2 (avg 1.0); franchise 0,2,1,1,0,1,0,3,4,1 (avg 1.3). E.g. Towns 35 (MIL $6.4M of $13.1M), Amen Thompson 32 (PHI $12.4M of $27.1M), Randle 33 (TOR)
  - Expiring trades per season avg 3.4 / 3.3 (0-8); salary dumps 2.1 / 2.3
  - 0 errors, 0 roster problems, save 17,517 / 17,480 KB
- Open / caveats:
  - Payroll ~5% under the old code (bench players are cheaper); a few low-payroll teams sit near $90M some seasons (they pay the floor difference)
  - "Wants to win" is now the top player reason (losing teams lose good veterans more). Watch it in longer runs
  - Leave chances and the 20% budget lift are hand-set; checked against one seed only

## v32e S5 (Opus, Nov 15 2026): market logic
- [x] Asks (`lowAskCap` / `capAsk`, league.js above `computeMarket`): OVR 55 and under = the minimum, 56-59 = 1.25x-2x the minimum (56 1.25x ... 59 2x), any age. Applied to market value, `setAsk`, re-sign asks, `negotiate` quotes, AI bids in `faRound`, daily demand bumps. Hidden rookies use the lower of read and real rating
- [x] AI re-signing (`RESIGN` in startResign): wanted = rotation, young prospect, top-10 on the roster at 58+, or 26 and under at 58+; signs when the team's offer is 75% of his ask (was 97%); 65+ "chase money" chance 0.15 (was 0.35); 6% surprise walk-away for a wanted 60+ player (news `news.walk`, kind `walk`)
- [x] Win-first stars (`WIN_FIRST`, `winFirstFA` on FA days 1-3): goal 0-3 a summer (avg 1.46), picks weighted to ringless older stars (one-ring 0.1x, 2+ rings at 32+ 0.3x). Signs with the best contender where he'd play, at 45-75% of value (not under 30%), 1-2 years. Skips players you made an offer to. Pool: an older ringless star on a non-contender may skip re-signing (`wfLeave`, tx "Wants to join a contender"). News `news.paycut` (1 wording, kind `paycut`)
- [x] Expiring trades (`expiringTrade` / `runExpiringTrades`, called in `runSalaryDumps`, in season only, max 5 a season): a non-contender with next-year payroll near the cap sends a long contract it doesn't want (overpaid, aging on a rebuild, out of the top 7) for a partner's expiring deal (salary within 30%); pays the gap with late 1sts / 2nds (max 2) or none when a contender wants the longer deal. AI teams only. `rec.kind = 'exp'`, `rec.wk` ('expiring' / 'dump'). Write-up keys `mv.t.expiring`, `mv.t.absorb`, `mv.t.longfit`, `mv.t.dump` (4 wordings each); salary dumps now use dump / absorb too
- [x] Report: `tools/r30.js` row `v32e` (asks by OVR band x age, re-sign rate, win-first goal/signed/pool, pay-cut signings, trades by kind). Summary: `python3 tools/v32e-sum.py.txt tools/runs32/v32e-nba-*.txt`
- [x] Tests: node --check all, lint 104 PASS, t30a quick 21/21, t30c 30/30, new `tools/t32e.js` 19/19
- [x] 10 seasons NBA SEED=21 (`tools/runs32/v32e-nba-commish.txt`, `-team.txt`; before: `tools/runs32/v32e-base.txt`, 3 seasons, commish)
  - Asks at FA start, young <=55 at the minimum: before 17-24 of 101-122 (median $2.6M, max $14.4M); now all, every season (92-149). Young 56-59: before median $8.6M, max $16.4M; now max $2.6M. Older <=55: before 22-50 of 71-103 at min (max $8.9M); now all. Under 60 asking $10M+: before 5 (S1); now 0 in all 20 seasons
  - Re-sign rate (AI expiring, same team at season start), all / OVR 60+: before 0.29-0.40 / 0.56-0.70 (avg 0.34 / 0.64); now commish avg 0.49 / 0.73 (0.67-0.82), franchise 0.48 / 0.71 (0.63-0.80)
  - Win-first pay cuts per summer: commish 0,1,2,1,1,0,1,2,0,3; franchise 0,2,2,1,0,1,1,1,2,1 (avg 1.1). Before: 0-1 (generic). Mostly ringless 30-33-year-olds (Randle, Fox, Ingram, Banchero); Jaylen Brown (1 ring) twice; a 3-ring Christian Anderson Jr. once
  - Expiring trades per season: commish 5,1,4,3,5,4,4,1,5,2 (avg 3.4); franchise avg 3.0. Salary dumps 0-6. All trades 33-50 (before 34-57)
  - 0 errors, 0 roster problems, save at S10 17,551 / 17,626 KB (v32c 17,798 / 17,737). FA left at season start fell (commish 12-28 vs v32c 22-29): more players re-sign
- Open / caveats:
  - Cliff at 60: a 59 asks at most $2.6M, a 60-64 can still ask ~$9-14M (young median ~$10M). Not changed (outside the brief); a ramp for 60-64 would smooth it
  - Win-first summers with 0: when no older star reaches free agency (2-3 of 10). The goal is a target, not forced
  - Expiring trades run in season only (not on draft night / summer)
  - Fewer free agents left at season start (9-21): fine for AI rosters, thinner bargain pool for you

## v32d S4 (Sonnet, Nov 15 2026): UI pass
- [x] Rotation chart on the game page (both teams, from `game.tl`), "Planned subs" in the live starting-lineup window
- [x] Chart editor (My Team > Rotation chart): toggle grid, Save / Undo / Reset to coach pattern, 5-per-block and injury checks, role-minutes warnings
- [x] Roles + expected minutes: roster ("exp"), player page ("plan"), offer form (likely role / promised role with minutes)
- [x] Mid-level: "Use mid-level" in the offer popup (amount left, used or not, why not, tax line / hard cap warning); same info in the Salary cap panel and Roster moves header. Engine `mleStatus`, `extra.mle`
- [x] Coaching targets: free agents that fit under the hard cap only, "Cap fit" note per row
- [x] Draft tab > Team picks: any team's picks (this draft + future), via-team, protection, swaps, owed picks
- [x] Tests: node --check, lint 100 PASS, t30a 21/21, t30c 30/30, t32a 38/38, t32b 20/20, t32c 15/15, new `tools/t32d.js` 15/15, browser `tools/browser-v32bc.py.txt` 22/22, new `tools/browser-v32d.py.txt` 70/70 (desktop 1300 + 390px, every screen above, no horizontal page scroll)
- Open / caveats:
  - Mid-level is bookkeeping under the B2 cap rule (any team can sign up to the hard cap): the checkbox only decides whether the once-a-season exception is spent. Making it a real cap exception would need a rule change (S5 or later)
  - A saved chart with a player who is out on game night falls back to the coach pattern for the whole game (S3 rule); the editor and the last-game message say so. A per-slot replacement would be an engine change
  - Role warnings use the role range +-1.5 min (blocks are 3 min); real minutes also move with blowouts and foul trouble
  - Long sims not run: no engine change touches the sim except the mid-level flag on your own signings (t32d covers it)

## v32c S3 (Opus, Nov 15 2026): rotation timeline (engine) + final v32b/c tune
- [x] Coach patterns (`coachPat`): first-sub pair (SF + PF most often), Q1/Q3 first-sit times by style (tight ~7 / 10 min, balanced 6 / 9, deep 5 / 8), Q2/Q4 split; stable per coach, per-game jitter. 10+ distinct patterns in a 30-team league
- [x] Plan (`planRotation`, 48 x 5): starters open each half; bench stints by position fit + role minutes. Game follows it (`subStep` / `followPlan`); close finishes, blowouts and OT use the old `doSubs`; foul trouble / injuries filled by fit + minutes owed (stars ride one foul longer); `planMakeUp` at quarter breaks gives back minutes lost
- [x] `RM_LIFT` [5.5, 4.5, 3, 5.5, -1.5, -3, 0]: a normal game's plan sits above the range for top roles and under for rotation / bench, because blowouts take ~2.9 min a game from stars and give it to the bench. Without it stars averaged ~31
- [x] Timeline `game.tl` (starters + sub events, deciseconds) for your games + last 30 league games (`tlPrune`); `tlReplay`; play-by-play sub lines (flag `u`) at the same times; starting lineup window from the timeline (`pbpReplay`)
- [x] Your chart `t.rotChart` (4 quarters x 4 blocks of 3 min x 5 ids) overrides the coach; invalid (unavailable player, not 5 different) -> coach plan + `tl.bad` reason. Editor = S4
- [x] Final tune (after the S3 engine changed minutes): `ENG.teamReb` 0.06, `blkK` 1.9
- [x] Tests: node --check, lint 100 PASS, t30a quick 21/21, t30c 30/30, t32a 38/38, t32b 20/20, new `tools/t32c.js` 15/15, browser `tools/browser-v32bc.py.txt` 22/22 (roster Role column, summary Role, offer Role picker, rotation panel, live sub lines, starting window; 1300 + 390px)
- [x] 10 seasons NBA SEED=21, commish / franchise (`tools/runs32/v32c-nba-*.txt`, vs v32b `tools/runs32/v32b-nba-*.txt`):
  - 9+ RPG per season: commish avg 17.8 (14-21), franchise 17.7 (13-23). v32b 19.1 / 21.5; baseline 29
  - 1.5+ BPG: commish 17.4 (15-21), franchise 16.8 (11-20). v32b 13.5 / 17.0; baseline 6
  - Minutes by role (season avg, gp 20+), commish / franchise: fs 34.4 / 34.1, star 32.7 / 32.7, starter 27.4 / 27.6, sixth 22.6 / 22.7, rotation 17.6 / 17.2, bench 11.0 / 11.4, development 7.7 / 7.8. v32b: fs 34.1, star 33.4, starter 27.8, sixth 21.9, rot 17.4, bench 11.5. Top MPG 36.5-38.6 (v32b up to 40.3)
  - Save at S10: 17,798 KB vs 17,678 KB in v32b (+120 KB, +0.7%; timelines ~46 KB at any time). Speed same (~107 s a season with two runs in parallel). 0 errors, 0 roster problems; broken role promises 0-2 a season
- Open: sixth men average ~22.7 (range 24-28); development players ~7.7 per game played (garbage time); `tools/snap/` saves are not in the repo, remake them (TESTING.md) before using SNAP

## v32b S2 (Opus, Nov 15 2026): rebounds, blocks, minutes, roles
- [x] Rebounds (engine): `ENG.teamReb` 0.115 (that share of boards is a team rebound, no player credit, as in the NBA) + `ENG.rebPos` by court slot [0.9, 0.92, 1, 1.05, 1.12] (bigs box out near the rim) + `drbPow`/`orbPow` knobs (kept 1.0 / 1.1). Team RPG 47 -> ~43.5. No per-player edits
- [x] Blocks (engine): `ENG.blkK` 1.7, `blkPow` 1.2, `blkSel` 1.6 (was 1 / 1.4 / 2.2): more blocks overall, less piled on one player (Wembanyama 7.8 at blkPow 2 -> ~4). Team BPG 2.6 -> ~4.3
- [x] Roles (engine, above `buildSide`): `ROLES` (fs 34-37, star 32-35, starter 26-32, sixth 24-28, rot 16-24, bench 8-16, dev 0-8), `teamRoles` (greedy starting five; fs/star from league cut lines `roleCuts`: top ~0.5 / 1.6 per team by OVR, max 1 fs + 2 stars a team; bench by coach value: sixth, `coach.depth - 6` rotation, 2 bench, rest dev; a promised role is a floor; `t.roleSet` = your override, data only), `setTeamRoles` (weekly in `simDay` + when the roster or coach changes, `rolesFresh`), `roleOf`, `p.role` / `p.roleT`
- [x] Minutes: `roleMinutes` fits role ranges to 240 for the players available that night (one shared shift times each role's flexibility, bisection; short-handed nights stretch the bench, stars 1.5 at most). Coach style leans: tight = top of the range, deep = bottom. Playoffs: top roles up to +2. `RM_LIFT` plans a bit above the range so minutes played (after blowout rest) land in it. Your manual depth chart keeps the old plan
- [x] Morale: "Minutes vs role" judged against the role range (under the bottom - 1 = minus, inside = +1.5, above = small plus); `parts.role`, `parts.expMin` = range
- [x] Offers: every AI offer carries the role he'd get there (`expRole`, quick rank estimate) and its pull (`roleAppeal`: about +7% for a franchise-star role, -6% for development). Signed role stored as `c.rl`. Your offer: Role picker (coach decides, or promise a role): `clauseMult` gives up to 10% off for a bigger role than he'd get and up to 15% more for a smaller one; 2+ roles below for a 68+ player = refusal (`signConcerns`). A promised role (`c.role.k` = ROLES key) is a floor in `teamRoles`; `promiseState` fails when he plays 3+ minutes under the range
- [x] UI (minimal): roster Role column (sortable, tooltip with mpg + promise), player summary card Role box, Rotation & roles panel uses role names, offer form Role picker, morale row "x min · Starter (26-32)"
- [x] Tests: node --check OK, lint 100 PASS, t30a quick 21/21, t30c 30/30, t32a 38/38, new `tools/t32b.js` 20/20. Probe: `tools/v32stats.js` (ENGX= overrides)
- [x] 10 seasons NBA SEED=21 (`tools/runs32/v32b-nba-commish.txt`, `-team.txt`; before the last tune):
  - 9+ RPG per season: commish 19,16,18,23,23,22,16,19,20,15 (avg 19.1); franchise avg 21.5 (18-28). Baseline 29 (`tools/runs32/v32b-base.txt`). Team rebounds raised 0.10 -> 0.115 after this run
  - 1.5+ BPG: commish avg 13.5 (11-17), franchise 17.0 (12-21). Baseline 6
  - Top-10 MPG leader 37-40 (now capped: stars stretch 1.5 at most when short-handed)
  - Minutes by role (avg of season averages, gp 20+): fs 34.1, star 33.4, starter 27.8, sixth 21.9 (under 24: plan raised after this run), rotation 17.4, bench 11.5, development 8.0 (per game played)
  - Save at S10 17,678 KB vs 17,411 in v31 (+1.5%); 0 errors, 0 roster problems; speed same as v31
- Open: 9+ RPG drifts with league rating climb in some seasons (franchise S5: 28); development players average ~8 per game played (garbage time)

## v31 overseas (Nov 15 2026) — cut players aged 26 and under go abroad instead of retiring
- [x] `startNewSeason` FA cap (60): a cut player aged <= 26 calls `sendAbroad` (league.js, above `startNewSeason`): off `L.fa`, stays in `L.players`, `p.abroad = { s, n }` (s = season he left, n = seasons already abroad on earlier stays). 27+ keep `retirePlayer(.., 'unsigned')` (deleted if never played)
- [x] Club: `pipeBuild` P3 now also covers players abroad (same pick rule: age 30+ or OVR 48+ prefers EABL, else APBA; least-loaded team under the import cap, any least-loaded team if all full). Transaction "Went overseas: signed with X (LG)"; news `ab.go` (new FLAVOR key, 4 wordings) for OVR 50+ or drafted players, max 6 a year
- [x] They keep developing (still in `active(L)`). Random retirement skips them
- [x] `abroadOffseason` (called in `startOffseason` right after `computeMarket`, before free agency): returns to `L.fa` (tx "Returned from overseas", `setAsk`) if two-way eligible with value >= 48 (`0.6 * teamPotEst(L, null, p).est + 0.4 * ovr`, no team) or OVR >= `twBenchLine` (typical 13th man). Otherwise stays; retires ('overseas', deleted if never played) after 3 seasons abroad in total (`p.abroadSeasons` carries earlier stays if he is cut again) or age 27. Log: `L.abroadLog` (back / gone per offseason)
- [x] UI (app.js): player page shows "Overseas (club name)" (header + Role), no Negotiate for players abroad; League > Players (both tabs): team column "Overseas (club)", FA filter excludes them, new "Overseas" filter option
- [x] Old saves: no migration (fields default to absent)
- [x] Tests: node --check all src OK; lint 100 keys PASS (now covers `ab.*`); t30a 29/29; t30c 30/30; new `tools/t31-abroad.js` 14/14; browser `tools/browser-v31.py.txt` 23/23 (desktop 1300 + 390px)
- [x] 10 seasons NBA commissioner, SEED=21 (`tools/runs31/v31n-nba-commish.txt`, harness `tools/r30.js` now logs `ab`): two-way slots at season start (S2-S10) 48.3 vs 46.8 in v30 (`tools/runs30/v30n-nba-commish.txt`), at season end 44.3 vs 43.4, free agents at season start 26.9 vs 26.7, FAs >= 13th man 18.3 vs 20.4. 0 errors, 0 jersey dups, 0 bad rosters
- [x] Save size / abroad count after 10 seasons: **173 players abroad**, save 17,411 KB vs 16,968 KB in v30 (+443 KB, +2.6%). Abroad count by season: 41, 70, 94, 109, 132, 140, 152, 163, 163, 173 (still growing about 10 a year at the end). Each offseason about 140 of them return to free agency and 9-18 retire
- Open: abroad count and save size keep rising slowly; if it matters, lower `ABROAD.seasons` or raise `ABROAD.minValue`. One seed, one league type

## Faster testing (Nov 15 2026)
- [x] TESTING.md: test tiers (UI/text 2-5 min, one system 5-8 min, several systems 10 seasons, version end 20 seasons). Also project doc claude/testing-tiers.md
- [x] Saved leagues at day 0 of season 11 in tools/snap/: nba-commish-s10, nba-team-s10 (your team 5), pbl16-commish-s10 (gzip, 1.8-3.7 MB). Loader tools/snap.js (global SL), maker tools/snap-make.js, `SNAP=... node tools/r30.js N`
- Checked: each loads and sims a season (NBA ~45 s, PBL16 ~29 s); franchise save still gets interviews. Remake each version when save fields change


## v30 review round 2 (Nov 15 2026) — Opus (8t/7t done here too)
- [x] 8t/7t: `sc.*` (5) + `tk.*` (12) keys, 4 wordings each, in src/league.js; scoutDlg + tickerItems (app.js) use fl() with a per-day seed; lint covers sc/tk (99 keys)
- [x] Two-way drift fix: season-start FA cap ranks young two-way-eligible players by two-way value (was lowest OVR first). NBA start fill 42/60 (v29 40, round 1 34)
- [x] faRound: in-season ask drops to the best offer or 20% a week. Unsigned FAs >= 13th man 22.4 (v29 21.6, round 1 28.6)
- [x] #25 kept as is (2026 draft class = season-1 rookies), confirmed by Kenneth
- [x] Tests: lint, t27, t30a, t30b-ui, t30c, browser v30a 95/95, v30b 135/135, v30c 126/126. Runs: tools/runs30/v30n-*.txt
- Open: young players cut at the FA cap "retire" (could go to pipeline clubs instead)

## v30 review (Nov 15 2026) — Opus QA
- [x] Reviewed v30a/b/c against the plan. Full report: `V30-REVIEW.md` (also project doc claude/nba/v30-review.md)
- [x] Fix: two-way rejections left slots empty (NBA S2 start 16/60, v29 48). `TW_REJ` in league.js: mval only counts 25%+ over the minimum, weekly cooling in season, post-FA factor 0.2. Now ~34/60 avg (v29 40), ~1/3 of asked players refuse once
- [x] Fix: duplicate jersey numbers on a team (also in v29, 11-29 a season): `assignNumber` counts two-ways + compares as text, called in `addToTeam`, after 2/3-team trades, and a sweep in `startNewSeason`. 0 dups in 80 seasons
- [x] Harness `tools/r30.js` (SRC, SEED, NBA, SIZE, MODE) + `tools/r30sum.py.txt`; 20 seasons x 4 leagues + v29 baseline in `tools/runs30/`
- [x] Tests: lint PASS, t30a 29/29, t30b-ui 17/17, t30c 30/30, t27 71/71, browser v30a 95/95, v30b 136/136, v30c 118/118
- Open: confirm #25 rookie class (2026 draftees tagged); 8t/7t need strings moved to keys; unsigned high-ask FAs (pre-existing)

## v30 text variants (Nov 15 2026) — Haiku: plan rows 5t, 21t, 23t
- [x] 5t move write-up reasons: `mv.n.*` (13), `mv.t.*` (3), `mv.r.*` (5) in `src/league.js` FLAVOR, 4 wordings each (+3). Vars: `mv.n.depth` keeps `{pos}`
- [x] 21t Hall of Fame speeches: `hof.speech.*` (9 keys) in `src/nba-text.js` story, +4 each (8 total): family (`fam`), coaches (`coach`, `coach2`), teammates (`mates`), city (`team`), humor (`open`, `titles`, `mvp`, `close`)
- [x] 23t interviews: `iv.q.*` for the 10 new pools (bench, future, rotation, pressure, rest, draft: dpick, dtrade, dclass, dneed, dwork) +2 each; `iv.a.*` answers for the same 10 pools, 40 slots, +3 each; `iv.intro.draft` +1, `iv.news.draft` +2. Draft questions are about the draft only
- [x] Code fix: `ivAnswers` (league.js) seeded every answer with `1`, so with 4 wordings each answer would always show the second. Now seeded by question number + slot. Variety checked: 4 distinct answers per slot over 12 seeds
- [x] Lint: `tools/lint-v30-text.js` (new): 82 keys, 4+ wordings, same vars (HOF: allowed vars), under 140 chars. PASS
- [x] Tests: `node --check` all src OK; `node tools/t30c.js` 30/30
- [ ] Not done, not keyed: 8t scouting report lines (`scoutDlg` in `src/app.js`) and 7t ticker stats/rumors (`tickerItems`). Both are inline templates. Plan: move them into keys first (small `app.js` refactor), then add variants. Waiting for Kenneth's OK.
- Note (pre-existing, not changed): `ALL=1 node tools/lint-v30-text.js` flags 182 older keys (e.g. `iv.a.fans.*`, `fd.pipe.award`, `recap.mvp`) with fewer wordings or mismatched vars. Left alone; they are older rounds.

## v30c UI (Nov 15 2026) — Sonnet: items 1, 2, 5, 19, 21, 23
- Note: the repo had no v30c logic (no 6a / 5 / 23 entries), so the minimal logic for 5 and 23 was written here, in `src/league.js` (end of file) + hooks. Not the full Opus pass: Haiku can add wording variants (one wording per key now) and Opus can review.
- [x] #5 logic: `L.mv` (newest first, 300 max) + `rec.wu` on every trade: one write-up per team `{ tid, k, text, fit: [before, after], ovr: [before, after] }`. Trades: need filled (or cap, youth, future), coach fit and team overall before > after. Signings (`sign`, `resign`) and releases: reason + coach fit (no team overall). Hooks: `executeTrade`, `executeTrade3`, `signContract`, `release`. Reasons: `mvNeed` (depth at a position, stretch big, then the weakest rotation style group: play, shoot, reb, rimD, perD, ath, inside; else upgrade / depth piece), `mvWhyRelease` (injury, fit, cap, bench, spot). Text keys `mv.n.*`, `mv.t.*`, `mv.r.*` (FLAVOR, 1 wording each). Coach fit = `coachFitScore` (top 8 vs head coach), team overall = `teamStrength` rounded
- [x] #23 logic: interview periods are now `open`, `deadline`, `playoffs`, `draft` (`IV_STAGES`, label `IV_PERIOD`). The draft interview opens in `startDraft` and asks only the 5 draft-only questions (`dpick`, `dtrade`, `dclass`, `dneed`, `dwork`; 3 per interview, `dpick` only if you own a pick). Pools: `IV_Q[k].st` lists the periods; 5 new questions for the other periods (`bench`, `future`, `rotation`, `pressure`, `rest`). `L.ivUsed = { s, ks }` keeps asked questions per season: no repeat; a dry pool gives a shorter interview or none; `ivPoolLeft(L, stage)`. Keys `iv.q.*`, `iv.a.*.0-3`, `iv.intro.draft`, `iv.news.draft`
- [x] `tools/t30c.js` 30/30 (NBA 30 + PBL 16: write-up shape, every team covered, trades have fit + overall, 17-19 different reasons; interviews: periods, draft-only, no repeat, reset next season, dry pool)
- [x] #1 Roster moves > Overview (`rmoves`, `vRMoves`): sub tabs My team / League, filter All / Trades / Signings / Releases with counts, My team has a summary (roster, payroll, cap room, can offer a free agent, two-way). No league: League tab only
- [x] #2 Player page: `negoBar` shows a Negotiate button (or "Not interested" + reason) instead of the inline form; `negoDlg` is the popup with the same form + a cap box (`negoCapBox`: payroll now, this offer + cap hit, payroll after, room under cap / tax line / hard cap, one-line verdict incl. tax cost). Any change in the form redraws the popup (`negoAfterRender` after every `render()`), so numbers follow the offer. Not shown for players you cannot negotiate with
- [x] #5 UI: write-ups in the Overview rows and under each Completed trades row (`wuHtml`)
- [x] #19 Promises (My team): sub tabs Current players / Former players with counts; Former also shows where he is now (`promisesPanel`)
- [x] #21 News & history > Hall of Fame (`hofc`, `vHofCeremony`): one page per class (year buttons), a card per inductee with his full speech (`hofSpeech`), career line; link from History > Hall of Fame
- [x] #23 UI: interview dialog shows the period, question n of N, the pool left, a draft note; starting the draft (button) opens the draft interview
- [x] Browser test `tools/browser-v30c.py.txt` 126/126 (NBA 30 + PBL 16, desktop 1300 + 390px, real buttons for interviews and the draft)
- [x] Existing tests, same as before this work: t27 71/71, t265 27/27, t287 11/11, t288 34/34, t257 29/29, t30a quick 21/21, t29 quick 18/19 (NCHF leader), auto 9/10, t266 23/24, t258 12/13, unit-v253 26/26, f5 9/9, t30b-ui 17/17, browser-v30a 95/95, v30b 136/136, v30 44/44, v288 45/45. Sim speed: NBA 30, one season + offseason, 104-109 s with the write-ups vs 110 s before (no measurable cost); save size +1.3% (L.mv + rec.wu). Not run: long harnesses (u8, s20, k27, l27, n27, p27, s27, n8), older browser tests
- Not pushed: GitHub was not linked to this session. Changed files + patch were sent instead (upload them the usual way)

## v30b UI (Nov 15 2026) — Sonnet: items 6b, 8, 18, 7
- Note: the repo had no 6a entry. Box score already had MIN + +/-, but the play log had no on-court data, so a small engine hook was added here (not the full Opus 6a): pbp entry `[8]` = 10 on-court ids (home 5, away 5) when the lineup changed, `[9]` = seconds of the play; `pbpReplay(g, n)` (end of engine.js) rebuilds court, minutes, +/- up to n entries.
- [x] E1/E2 `tools/t30b-ui.js` 17/17 (NBA + PBL: replayed minutes within 1s and +/- exact vs box, 10 on court, team minutes 240, home +/- = 5x margin). Log overhead ~0-15% on user games only.
- [x] #6b Live play-by-play: on-court window per team (pts, PF, +/-), Min + +/- in the live box, on-court rows marked, Home/Away + record under team names (regular W-L, plus playoff W-L in playoffs; record going into that game), same on the final box score (`gameRec`, `recLine`)
- [x] #8 Scouting report (`scoutDlg`, Scout button on Next up, Schedule, and undecided playoff series): comparison table (rating, W-L, away/home, playoff W-L, last 10, power rank, PPG, opp, ORtg, DRtg, pace, FG%, 3P%, REB, AST, TOV), 3 best players per team, position matchups, playstyle (systems + league-rank tags), what to watch, meetings this season. Wording is plain templates (Haiku 8t can improve)
- [x] #18 One-window bracket (`bracketOne`): first conference left (West in NBA mode), second right, Finals in the center, play-in boxes outside, seeds 1-8 both sides, future slots TBD then fill as series end, champion under the Finals. "Round view" toggle keeps the old columns. Used in Standings and History
- [x] #7 Ticker (`tickerItems`, `renderTicker`): News (league log), Stats (live leaders, best record, top offense/defense, last day's top score), Rumors (log rumors, trade requests, teams listening on offers). Filter, hide/show (remembered), pauses on hover, reduced-motion safe, rebuilt only when the league changes. Rumor/stat wording is plain (Haiku 7t later)
- [x] Browser test `tools/browser-v30b.py.txt` 136/136 (NBA 30 + PBL 16, desktop 1300 + 390px). If your team misses the playoffs the playoff-record check prints a note and is skipped
- [x] Existing tests, same as before: t27 71/71, t265 27/27, t287 11/11, t288 35/35, t257 29/29, t30a quick 21/21, t29 quick 18/19 (NCHF leader 34.4), auto 9/10, t266 23/24, t258 12/13, unit-v253, f5 9/9, m*, x28, browser-v30a 95/95, v30 44/44, v288 45/45. Not run: long harnesses (u8 timed out at 4 min, s20, k27, l27, n27, p27, s27, n8) and older browser tests.

## v30a logic (Nov 15 2026) — Opus, engine/data only
- [x] #13 Two-way offers: free agents can refuse when they expect a standard contract (reason shown); drafted 2nd-rounders always accept; AI skips refusers + retries weekly — `twWillSign` (league.js)
- [x] #22 Roster needs: no "Fix now" physical (athleticism) flag with 15 players — `rosterNeeds`
- [x] #24 NBA-size (30 teams): every round best of 7; play-in and 16-team format unchanged; odds, bracket labels, How it works updated — `PO_BIG_BEST` (engine.js)
- [x] #25 New NBA league: real first-year players (0 service: 2026 class + undrafted) tagged rookies → ROTY / All-Rookie after season 1 — `nbaRookies` (src/nba-setup.js)
- [x] #10 Real jersey numbers from claude/nba/jersey-numbers.csv.txt (team + name; blank/duplicate → random free; "00" kept) — `nbaJerseys` (src/nba-setup.js, new file)
- [x] Tests: `tools/t30a.js` 29/29 (quick 21/21). Existing: t27 71/71, t265 27/27, t287 11/11, t288 35/35, m265 7/7, unit-v253 26/26, t257 29/29, x28, t255/t256/t258b, m1-m6, u7, u8, f1, f4 38/38, f5 9/9 OK. Same as before v30a: t266 23/24 (R5), t257s 21/22, t258 12/13 (baseline 11/13). New noise: t29 quick 18/19 (NCHF leader 34.4 ppg vs 34 cap; baseline 32.8), auto.js seed 1 9/10 (user roster 12 at off-ready, filled at season start; seeds 2-5 10/10). Not run: browser *.py.txt, long harnesses (u9, s20, k27, l27, n27, p27, s27, n8), an*/h* analysis scripts.
- [x] v30a UI (Nov 15 2026) — **Sonnet**: all in `src/app.js` + `src/styles.css`, engine / league unchanged
  - [x] #20 Progression / regression report has its own page: League → Progression (`#review`, `vReviewPage`), reopenable until the next season starts; Standings and My team show a link banner during the review
  - [x] #16 Release button for two-way players (My team two-way table + player page) with a confirm dialog (`twRelDialog`)
  - [x] #17 "Pipeline seasons are done" popup when the offseason starts (champions, stock up / down, buttons to the draft board and Pipeline); once a season (`L.pipeSeen`), in Recent popups
  - [x] #12 Free agents "Can afford" checkbox (asking price ≤ your biggest possible offer; minimum deals always fit)
  - [x] #14 "Sim to end of free agency": the header button already existed (stops when a player wants to talk); added the same button on all three Free agency pages (`faEndBar`). Behavior unchanged. Open question: skip player talks instead?
  - [x] #15 Type changes: chips per player (added / dropped / unchanged, Elite gained or lost) + kind label (`typeDiff`, `typeMoveRow`)
  - [x] #11 Live draft: Director's board rows near your remaining picks (±2) and your watch list are highlighted with a Target / Watch pill, plus a line with your next pick and targets left
  - [x] #4 Completed trades filter: All / Player-player / Pick-pick / Mix, with counts (`trKind`)
  - [x] #9 Trade center: Buyers and sellers panel from the front-office status (all-in, contender, push, hopeful, rising vs tank, rebuild, retool), with why line and a Trade button
  - [x] #13 UI: a refused two-way offer stays on the player page as "Turned down" with his reason (`twNoHtml`)
  - [x] Tests: `tools/browser-v30a.py.txt` 95/95 (desktop 1300 + 390px, real offseason buttons). Same results as before the UI work: node t27 71/71, t265 27/27, t287 11/11, t288 35/35, t257 29/29, t30a quick 21/21, t29 quick 18/19, auto 9/10, t266 23/24, t257s 21/22, t258 12/13; browser-v30 44/44, v288 45/45. Already failing before the UI work (same on commit 92dc371): browser-v30t 13/15 (Season start has 8 items, expected 10), browser-v29 62/69 (roster select / School-club / call-up checks), browser-v287 22/23 (drama dialog).

## v28.7 (Nov 13 2026) — done
- [x] Multi-season autopilot + fast mode — Opus
- [x] Engine cache speedup (same results, ~15% faster games) — Opus
- [x] Locker room drama (harmony, 7 incident kinds, your decisions, AI answers) — Opus
- [x] Dynasties & eras tab — Opus
- [x] Mobile layout pass — Opus
- [x] Tests: auto.js 10/10, t287.js 11/11, browser-v287 23/23, t266 24/24, t27 71/71

## Plan

## v28.8 (Nov 13 2026) — done
- [x] Positive moments (mentor, sacrifice, trip, praise, rally, charity) — Opus
- [x] Fines by salary (team → team cash, league → league) — Opus
- [x] Suspensions: team (conduct, 1-5) + league (fights, flagrants, repeat techs); unpaid; sit like an injury — Opus
- [x] Media interviews (2-3 a season, 3 questions × 4 answers, claims checked at season end) — Opus
- [x] One-on-ones + promise tracking (start / minutes / extension / trade / stay) — Opus
- [x] Text keys, one wording each — Opus
- [x] Tests: t288.js 35/35 (seeds 3/7/11 + NBA), t287 11/11, auto 10/10
- [x] UI: suspension chips + dialog, drama Suspend, Discipline page, interview dialog, one-on-one dialog, promises panel, browser test — **Sonnet** (Nov 13): browser-v288 45/45 (desktop 1300 + 390px, stable over 3 runs), t288 34/34, t287 11/11, t27 71/71, t266 24/24, auto 10/10. README "v28.8 Sonnet part".
- [x] Text variants — **Haiku** (HAIKU-TASKS.md): +3 wordings on 50 keys (v28.8: sus, dc, fd.fight.nat, dr.mentor/sacrifice/trip/praise/rally/charity/conduct/res.suspend, iv.intro/news/q/claim, fd.iv.beat; v28.7: dr.feud/vetMin/callout/meeting/late/coachRift/bond/res.*, fd.drama.*). v28.7 keys now 6 each. iv.a.* kept at 1. Version 1794565915-0bce. Opus follow-up: mtg.req.* and prm.* now 4 wordings each; conduct suspensions read "for blowing up at the coaches" (noun form `why` from `conductPick`; was "for blew up...").
- [x] Checks (Opus, after Haiku): node --check all src OK; t288 35/35 (seeds 3, 7) + NBA seed 11 35/35; t287 11/11; auto 10/10; text lint on 96 locker room / interview / meeting keys: all 4+ wordings (iv.a.* 1 by design), vars match, under 140 chars

### v29 Draft pipeline "lite" (Nov 13) — Opus part done
Data: PIPELINE-SPEC.md (user's names, conferences, colors, awards, role targets; clash renames approved). EABL 12, APBA 12, NCHF 16 in 4 conferences. Results-only playoffs (EABL Final Four, APBA bo3 semis + bo5 Finals + Finals MVP, NCHF 8-team Founders Cup) replace "standings + champion only".
- [x] P1 College years (`yrsCol` 1-4, ~28/23/23/27%, top-10 mostly 1); classes 4 drafts ahead — Opus
- [x] P2 Sources 70/25/5 (exact per class); NBA real 2027 class from `p.school` — Opus
- [x] P3 EABL / APBA: unsigned FAs < 60 get clubs (still signable); season simmed right after the Finals — Opus
- [x] P4 Stat sim by role (spec targets) + hidden situation factor; stats vs true rating r ≈ 0.63 — Opus
- [x] P5 Stock up / down moves scout reads (±3 a season, ±6 total) → mocks, boards — Opus
- [x] P6 Awards (spec names), conference awards, leaders — Opus logic (Sonnet page)
- [x] P7 News + feed (`pp.*`, `fd.pipe.award`, one wording each) — Opus (Haiku variants)
- [x] P8 Call-ups: `callUp`, AI weekly on injuries, EABL buyout to team finances — Opus (Sonnet button)
- [x] P9 `p.pre` one line per season; club pros / undrafted keep the last one — Opus
- [x] P10 `p.preAw` kept through draft + retirement, `L.pipeHist`, small HOF weight — Opus
- [x] Fix: v28.8 mentor moment overwrote wingspan (NaN contracts); old saves repaired — Opus
- [x] Tests: `tools/t29.js` 37/37 (class mix, years, role averages vs spec, r, playoffs, awards, honors kept after the draft, save size ~1.4%, offseason time ~40 ms); t288 35/35, t287 11/11, t27 71/71, t266 24/24, auto 10/10 — Opus
- [x] UI: Pipeline tab, team colors, player page College table + "Before the pros", draft board School / club + stock chip, call-up button, buyout finance row, news filter, browser test — **Sonnet** (Nov 13): browser-v29 69/69, t29 37/37, t288 35/35, auto 10/10. README "v29 Sonnet part".
- [x] Text variants for v29 keys (+3 wordings on 11 keys, 4 each; PIPE_ACH labels kept) — **Haiku** (HAIKU-TASKS.md). Checks: node --check OK; t29 quick 19/19 PASS (Nov 13 2026)
- [x] Final check (Opus, Nov 13): t29 37/37 (seeds 3, 11), t288 35/35, t287 11/11, t27 NBA 71/71, t266 24/24, auto 10/10, browser-v29 69/69. Text lint: 11 v29 keys × 4 wordings, vars kept, all under 140. Fixed: "the The EABL Crown" / "are The … champions" (cup names start with "The"; 8 wordings reworded), call-up news used the team code ("The DEN bring in") and "Buyout: no" → full team name + `{buy}` phrase ("$0.9M buyout" / "no buyout")

## Backlog (Nov 13): new requests + everything sidelined
Effort: **S** = 1 session, **M** = 1-2 Opus sessions + Sonnet, **L** = 3-4 sessions, **XL** = 5+.

### v30 New requests (Nov 13 interview)
| # | Feature | Effort | Model |
|---|---|---|---|
| R | **Lasting friends + grudges**: pair links between players (−100..100) built from seasons together, duo fit, positive moments, shared titles (friend) or feuds, minutes fights, callouts, rivalries (grudge); slow decay. Effects: lineup chemistry + team harmony, morale when a friend is traded / signed, free agents "want to join a friend", grudges with a starter can lead to trade requests, friend vets mentor more | M | Opus logic · Sonnet "Relationships" panel (family, friends, grudges, duos, rivals) + team chemistry web · Haiku text |
| F | **Fantasy league in your save**: you + AI managers draft sim players (snake draft), weekly head-to-head scoring from real box scores, lineups, waivers, trades with AI managers, fantasy playoffs and champion history. Open questions for the build: managers (default 10), scoring (default points; 9-category as option), roster size (default 13) | L | Opus logic (scoring, AI managers, draft) · Sonnet Fantasy tab (draft room, my team, matchup, standings, waivers, trades) · Haiku manager names + text |
| G | **Better generated logos**: original emblem art matched to each nickname (animal / object / symbol library), wordmark + primary / alternate mark, team colors with contrast check; PBL, NBA mode (original art, not real NBA logos) and the 40 pipeline teams | M | Sonnet SVG library + logo builder · Haiku nickname → emblem map |
| T | **Season to-do list (GM checklist)**: a checklist per phase that resets every season; items tick themselves from game state where possible, others you tick by hand; open count on the header; reminders before key dates. Full list below | S-M | Sonnet (panel + auto-checks) · Opus review of the auto-check rules |
| P | **Compact philosophy window**: one short line per setting (low label · slider · high label · value), text moves to a tooltip, all 8 fit without scrolling; add a "How to read this" line: the slider runs 0-100 between the two styles (50 = neutral), the number is his setting, the small line is his **system default** (far from it = playing against his system) | S | Sonnet |

- v30 G: Haiku part done. `src/nba-text.js` has `NBA_TEXT.emblem` (30 teams: motif, alt, word).
- [x] v30 P (compact philosophy window) — **Sonnet** (Nov 13): README "v30 P + G". browser-v30 44/44, t27 71/71, t29 quick 19/19.
- [x] v30 G NBA mode (29 original emblems + wordmark, initials fallback, PBL / pipeline logos untouched) — **Sonnet** (Nov 13). Still open for G: PBL + 40 pipeline team emblem logos (nickname → emblem map).
- [x] Knicks logo no longer the Kings crown: new `skyline` emblem (`EMB.skyline` in app.js, `NYK` motif in `NBA_TEXT.emblem`) — **Sonnet** (Nov 13). Only NYK uses it.

### v30 T Season to-do list (franchise / team mode only)
Where: My team → "To-do" panel (top) + header chip "To-do 4" (open items in the current phase) + a reminder toast when a phase starts. Each item: text, why it matters (tooltip), a link to the page, ✓ (auto when the game can tell, else your tick), "Hide" (per item, remembered). Resets each season (`L.todo[S]`). Items marked (auto) check themselves.
Optional (setting, default off): stop the sim 3 days before the trade deadline / the last regular-season week if a ★ item is open.

**1. Preseason / season start**
a. Check your roster, your coach's style and fit with the roster, and his targets (Coach page, Targets panel)
b. Check your power ranking and preseason odds (Weekly report / Season preview)
c. Pick draft prospects to watch for the coming draft (3+ on the watch list; auto) and send scouts on assignments
d. Read the owner's goal for the season and team status (Front office)
e. Set training focus for players 25 and under (auto when every one has a focus or you confirmed the Training check)
f. Set rotation, minutes, load management, playbook and coverage (Lineup panel; auto once you open it)
g. Mark up to 4 core players and your Untouchables (auto when at least 1 core player)
h. Extensions: decide on players who can extend now (Needs attention: "Can extend now"; auto when none left undecided)
i. Roster legal: 13-15 players, two-way slots filled (auto) ★
j. Locker room check: harmony, unhappy players, open one-on-ones (auto when no open issue)

**2. Early season (first 3 weeks)**
a. Review lineup chemistry and the first 10 games' play types / coverage
b. Check unhappy players and promises at risk (Promises panel; auto when none at risk)
c. Check pipeline stock: college / EABL / APBA risers and fallers for your watch list

**3. Mid-season → trade deadline**
a. Decide buyer or seller: compare record vs owner goal and power ranking ★
b. Review the trade block, rumors and offers; check pick protections, cash room and the Stepien rule
c. Check the "Re-sign before season end" list
d. Injury report: long injuries, day-to-day calls, call-ups from EABL / APBA if short-handed
e. Deadline interview (if open) ★
f. Trade deadline day reminder (auto when the deadline passes)

**4. After the deadline → end of regular season**
a. Buyout market / free agents / two-way conversions to fill holes
b. Playoff push or tank: load management for stars, minutes for young players
c. Incentives and role promises close to being met or broken
d. Award races you care about (MVP, ROY, MIP for your players)

**5. Playoffs**
a. Check the matchup and set coverage / adjustments for the series
b. Press conference / interview answers

**6. Offseason**
a. Season review: owner review, goal met or missed, awards, Hall of Fame (auto when opened)
b. Lottery: check your pick position and pick swaps / protections that resolved
c. Draft: big board, mock drafts, prospect stats from the pipeline, trade up / down, two-way choices for 2nd-rounders ★
d. Re-sign: your free agents, player / team options, qualifying offers (RFA), rookie extensions ★
e. Coach and staff: keep, fire or hire (coach fit list)
f. Free agency: cap room, owner limit, targets that fit your needs, mid-level exception; roster back to 13+ ★
g. Development report: who grew, who dropped; reset training focus for next season
h. Before the new season: roster 13-15, no unhappy-star surprises, lineup set (auto) ★
- [x] Build (Sonnet, Nov 13): `todoItems()` rules (all 6 phase groups, spec text; auto: watch list ≥3 prospects, training focus / Training check, Lineup tab opened, ≥1 core player, no willing extension left, roster 13-15 + both two-way slots, locker room clear, no promise due within 14 days / 10 games, deadline interview closed, deadline passed, season review opened, roster legal + top-5 happy), panel at the top of My team, header chip "To-do N" (★ when a starred item is open), toast at each phase start + 3 days before the deadline + last week, tick / Hide / Show hidden / All phases, optional sim stop (`L.todo.stop`; Sim day never stops; Sim week / deadline / end stop once at deadline−3 and at last week−7 when a ★ item is open). State in `L.todo` (season fields reset each season). Off in commissioner mode, jobless and autopilot (`todoOn()`); old saves get `L.todo` lazily. `tools/browser-v30t.py.txt` 54/54 at 1300px + 390px; t27 71/71, t29 quick 19/19, browser-v30 44/44. README "v30 T". Review (Opus) of the auto rules still open.
- [ ] Review (Opus): auto-check rules match the game state; nothing fires in autopilot; old saves fine

### Sidelined earlier (still open)
| Feature | Effort | Model |
|---|---|---|
| v30b Play as coach (you coach, AI GM runs the roster; hot seat, job offers, your coaching tree) | L | Opus + Sonnet |
| v31 College playable (recruiting, NIL, scholarships, transfers, playable college games) | XL | Opus + Sonnet + Haiku |
| Pipeline: more teams / conferences | S | Opus (names: user) |
| Pipeline: 64-team college tournament bracket | M | Opus + Sonnet |
| Pipeline: transfer portal + return-to-school decisions | M | Opus + Sonnet |
| Pipeline: coach career ladder (college / intl coach → assistant → head coach) | M | Opus |
| All-Star Weekend contests (dunk, 3-point, skills) | M | Opus + Sonnet + Haiku |
| Draft combine (measurements, drills that move boards) | S-M | Opus + Sonnet |
| Live-game coaching (timeouts, subs, plays during a game) | L | Opus + Sonnet |
| Expansion / relocation | M | Opus + Sonnet |
| In-season tournament (NBA Cup style) | M | Opus + Sonnet |
| Fantasy-draft league start (all players into one pool at league creation) | S-M | Opus + Sonnet |
| Faster sims (engine profiling, history growth ~1 MB a season) | M | Opus |
| Full mobile check (all pages at 390px) | S | Sonnet |
| More legends, legends year-by-year, legends playoff rows | M (data) | Sonnet (Fable for research) |
| Historic season starts (e.g. 1995-96 league) | XL | Fable data + Opus |
| Real franchise W-L by season (franchise wins chart) | S-M (data) | Sonnet |
| Real coach history for HOF speeches | S-M (data) | Sonnet |
| Real USG% / advanced stats for role players | M (data) | Sonnet |
| Playoff rows for stars in sim-era comparisons | S | Sonnet |
| U14 / U15: 90+ star count polish (3.8 vs target 4-5) | S | Opus |
| v25.8 leftovers: team-page front-office chip, 3-team trade before → after | S | Sonnet |

Suggested order: T (quick win) → R → G (PBL + pipeline emblems) → F, then v30b coach mode.

### Later (pipeline expansion)
- More teams / conferences, a college tournament bracket, transfer portal, return-to-school decisions, coach career ladder: college or intl coach → NBA/PBL assistant → head coach

### v30b Play as coach (NBA / PBL) — effort L
- [ ] Coach career mode: you are the head coach; GM (AI) controls the roster; you set rotation, sliders, playbook, development focus, locker room calls; job security from the owner + GM — Opus logic, Sonnet UI
- [ ] Coach hot seat, firing, job offers, coaching tree for you — Opus

### v31 College playable (coach / manager) — effort XL (after v29)
- [ ] Recruiting (high-school prospects, visits, NIL budget), scholarships, transfers; playable college games with play-by-play — Opus + Sonnet + Haiku

### Other ideas (not scheduled)
- All-Star Weekend contests, draft combine, live-game coaching, expansion / relocation

## NBA v28.7 plan: F1-F3 (Nov 14, 2026)
- [x] F1 Conferences: East/West everywhere in NBA mode (playoff news line in engine.js, Conf. Finals MVP label, All-Star header). Division names (Southeast etc.) are real and stay.
- [x] F2 Rookie pay mood: on a rookie deal the happy/unhappy asking-pay swing is halved (-4% / +6%), `signConcerns` in league.js.
- [x] F3 Pipelines: "All players" option in the team picker + filters (position, age min/max, min OVR, min POT). `pipeAll` in app.js; test `tools/browser-f3.py.txt`.
- Tests: t27 71/71, t266 24/24, t265 27/27, m265 7/7, browser-f3 all pass.

## NBA v28.7 plan: F4-F6 (Nov 14, 2026)
- [x] F4 New-league nerfs: Jokic, Murray, Sabonis exactly -3 OVR (`NBA_NERF` in nba-2026.js `nbaFinish`): 93→90, 79→76, 74→71.
- [x] F5 Player page: one career table (real NBA + sim seasons) for Per game / Totals / Advanced, every column sortable; est. rows tagged and left out of the career line; real playoffs in the Playoffs panel. `pastTable` / `pastCareerRow` removed.
- [x] F6 Injuries: 10-20 game layoffs ±2, 20+ game layoffs ±3 (`addInjury` in engine.js).
- Tests: t27 71/71, t266 24/24, t265 27/27, m265 7/7, browser `tools/browser-f5b.py.txt` (no page errors).
- [x] F8 New-league Luka boost (`NBA_BOOST` in nba-2026.js): FIN +4, MID +5, 3PT +7, STL +10 → OVR 89→92. 4-seed avg (58 g): 32.7→33.8 ppg, 1.6→2.0 spg.
- [x] UI declutter (v28.7 U1-U4): My Team: compact season to-do (title opens, ✕ hides, done items fold, options in a fold) beside Needs attention. Trades: sub tabs Trade center / Offers for you (count) / Trading block / Completed trades (offer links + dialog open Offers; "trade for" opens Trade center). Free agency: Cap space | Coach's position read, Front office needs | Coach targets, then sub tabs Free agents now / Upcoming. Draft: "Your picks" sub tab (picks list removed from other draft tabs). Browser `tools/browser-u28.py.txt`, no page errors.
- [x] Pages split (v28.7 P1-P2): Free agency has 3 pages: Overview (re-signs, cap space, coach read, FO needs, coach targets, around the league) / Free agents / Upcoming free agents (`ui.faTab`). Draft: board / scouting / consensus / outlet mocks stay on the class pages; new "How it works & picks" page holds how the draft works, the draft order and your picks.
- Note: "How the draft works" text still describes 16-team rules (picks 1-16) in NBA mode.
- [x] Draft reorg (v28.7 R2): four pages: Overview (your picks this draft, draft order in the offseason, top 10 of the class with your board rank, last draft's grades + steals) / Draft classes (class years; Director's board, Consensus, 3 outlets) / Scouting (class years; director, recommendations, assignments, interviews, top 30 reports, your future picks) / Draft history (team picker: best picks by peak, grade per draft, every pick with mock, now, ovr, peak, GP, PPG). "How it works" panels removed. `draftOverview`, `draftHistory`; browser `tools/browser-d28.py.txt`.
- [x] League > Players (v28.7 L2): fixed the Players tab (it was aliased to Stats › Players). Now its own page: all players, filters (name, team / FA, position, country, age min-max, min Ovr, clear), tabs Ratings & contract / Personal & physical (number, country, height, weight, wingspan, experience, draft, personality, contract) / Attributes (all 23, green/red vs position average) / Stats (RS / playoffs). Browser `tools/browser-p28.py.txt`.
- [x] Stats › Players (v28.7 S1): team + age min/max filters, also in the Defense view (it had no team filter). Browser `tools/browser-s28.py.txt`.
- [x] Extension / re-sign deadlock fix (v28.7 X, league.js `negotiate`): (1) the max is rounded to $0.1M (e.g. $57.75M → $57.7M), so it can be typed and accepted; (2) his need is capped at the legal max (agent / clause multipliers and the award-race rule could push it above the max, so even a max offer was refused); (3) the counter now includes the award-race "only at the max" rule, so offering the counter he names is accepted. `tools/x28.js` (stars on forced extension windows: original 32/57 stuck, now 0/57 and 0/55 on seed 5).
- [x] Stats › Players: team select labelled "Team · All teams".

## v32a S1 (Sonnet): NBA ratings, roster setup, extension/draft-offer fixes
- Ratings: `NBA_ADJ`, `NBA_OVR_ADJ` (Embiid -5), `NBA_PRONE` (Kawhi, Embiid ipt>=2) in `src/nba-setup.js`; full before/after: `tools/runs32/ovr-before-after.csv`.
- Porzingis retired at start (career rows kept); GSW fills with a real FA big. Lakers: Knecht FA, Thiero on roster as rookie.
- Lineups: `rmb` ignored for players who changed teams or have <40 GP, capped at +-4 (`nbaFixRmb`, engine `buildSide`). LaMelo starts.
- Luka: permanent grudge vs DAL (`perm`), rivalry tag + revenge boost on every Luka-DAL game, any team.
- Contracts: `yrsLeft` / `contractEnd` include `p.ext` everywhere; `negotiate` no longer shortens years (2-yr minimum, rookie 4-yr extension).
- Draft offers: Negotiate opens trade center; accepting an offer removes other offers for the same slot or assets.
- Tests: `tools/t32a.js` (38/38), `tools/browser-v32a.py.txt` (8/8), t30a 21/21, t30c 30/30, lint, node --check.
