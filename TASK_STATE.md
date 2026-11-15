# TASK_STATE — v30b UI (items 6b, 8, 18, 7) — Sonnet

Note: PROGRESS.md had no 6a entry. Box score already had MIN + pm (engine BX), but pbp entries carried no on-court 5s. Step E1 adds the minimal engine hook (lineup + seconds per play) so 6b can work.

- [x] E1. Engine hook: pbp entry [8] = 10 on-court ids when lineup changed, [9] = seconds of the play (engine.js logE) + pbpReplay(g, n) at end of engine.js
- [x] E2. tools/t30b-ui.js 17/17: replay gives min (<=1s) + pm (exact) matching final box; log overhead ~15% (12.9s vs 11.2s per 60 days NBA, user games only)
- [x] B1. #6b live PBP: on-court window per team, MIN + +/- in live box, home/away labels, records (reg + playoff W-L)
- [x] B2. #6b final box score: home/away + records under team names
- [x] S1. #8 pre-game scouting report (team vs team, best players, matchups, W-L, playstyles)
- [x] P1. #18 playoff bracket in one window (West left, East right, Finals center, play-in outside)
- [x] T1. #7 ticker: news, stats, rumors
- [x] Q1. tools/browser-v30b.py.txt 136/136 desktop 1300 + 390px (NBA 30 + PBL 16)
- [x] Q2. Run all existing tests, compare to baseline
- [x] D1. PROGRESS.md + README, commit, push

---
(previous section, v30a UI — done)
# TASK_STATE — v30a UI (items 20, 16, 17, 12, 14, 15, 11, 4, 9 + 13 UI) — Sonnet

- [x] U0. Clone, read v30-plan + PROGRESS, create this section
- [x] U1. #20 own page: view `review` (League > Progression, shown while L.offSummary exists), banner on Standings/My team (src/app.js vReviewPage, reviewBanner)
- [x] U2. #16 Release button in My team two-way table + player page, confirm dialog (twRelDialog)
- [x] U3. #17 pipeDoneDialog queued when season-done -> off-review (once per season, L.pipeSeen); champions, stock up/down, links to draft board + Pipeline
- [x] U4. #12 "Can afford" checkbox on Free agents (ui.faAfford; ask <= faRoom or minimum)
- [x] U5. #14 header button "Sim to end of free agency" already existed (stops on player talks); added page button (faEndBar, #fa-end) on all 3 Free agency pages
- [x] U6. #15 Type changes: per-player chips (added / dropped / unchanged, Elite up/down) + kind pill (typeDiff, typeMoveRow, CSS .tchg)
- [x] U7. #11 Live draft board: rows with director target (near my remaining picks) or watch list highlighted + pill + summary line (liveDraft tgtOf, #livetgt)
- [x] U8. #4 Completed trades filter bar (All / Player-player / Pick-pick / Mix with counts; ui.trF, trKind)
- [x] U9. #9 Trade center: Buyers and sellers panel (buyersSellersPanel: allin/contend/push/hopeful/rising vs tank/rebuild/retool, status pill, why, Trade button)
- [x] U10. #13 UI: refusal stays on the player page two-way panel as a "Turned down" message with his reason (ui.twNo, twNoHtml)
- [x] U11. tools/browser-v30a.py.txt: 95/95 (desktop 1300 + 390px, full offseason by real buttons)
- [x] U12. Existing tests run: same as before the UI work (details in PROGRESS.md)
- [x] U13. PROGRESS.md + README updated, pushed

---
(previous section, v30a logic — done)
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
