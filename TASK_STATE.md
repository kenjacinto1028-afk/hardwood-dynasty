# TASK_STATE — v30a logic (items 13, 22, 24, 25, 10)

- [x] 1. Explore code — two-way: league.js signTwoWay/aiFillTwoWay; needs: rosterNeeds; playoffs: engine.js nextRound + seasonOdds; rookies: nbaPopulate; numbers: assignNumber
- [x] 2. #13 — league.js twWillSign/twBenchLine (reason text), signTwoWay check, own 2nd-rounders exempt, aiFillTwoWay skips refusers + weekly retry in twoWayDay
- [x] 3. #22 — league.js rosterNeeds: RN_PHYS (ath) capped at "summer" when roster has 15
- [x] 4. #24 — engine.js PO_BIG_BEST=7 in nextRound; league.js seasonOdds best of 7; app.js bracket labels + help text
- [x] 5. #25 — src/nba-setup.js nbaRookies: real players with 0 service get rookieSeason = season 1 (55 players)
- [x] 6. #10 — src/nba-setup.js nbaJerseys (CSV embedded), hooked in engine.js newLeague; index.html + tools/load.js load it; app.js accepts "00"
- [x] 7. tools/t30a.js — 29/29 pass (quick 21/21)
- [x] 8. Existing tests run — no new real failures (see PROGRESS.md v30a line)
- [x] 9. PROGRESS.md + README updated, pushed to main
