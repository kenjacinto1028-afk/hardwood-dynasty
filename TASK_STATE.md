# TASK_STATE — v30 text variants (plan rows 5t, 21t, 23t) — Haiku — Nov 15 2026

Note: 8t (scouting report) and 7t (ticker stats/rumors) are NOT keyed: the lines are inline templates in src/app.js (scoutDlg, tickerItems). Not touched here; needs a small refactor into keys first (see PROGRESS.md).
Rule for this run: 4 wordings per key (1-wording keys get +3; HOF speeches already had 4, so +4 themed variants each, 8 total). Same {vars}, under 140 chars.

- [x] T0. Read state: repo TASK_STATE (v30c done), HAIKU-TASKS.md, plan rows 5t/21t/23t, key locations
- [x] T1. tools/lint-v30-text.js: wordings >= 4, same {vars} as first wording, under 140 chars, no empty strings (HOF: vars must be ones the code passes)
- [x] T2. 5t: mv.n.* (13), mv.t.* (3), mv.r.* (5) in src/league.js FLAVOR block: +3 each
- [x] T3. 21t: hof.speech.* (9 keys) in src/nba-text.js story: +4 each, themes family, coaches, teammates, city, humor
- [x] T4. 23t: iv.q.* new pools (10 keys) +2 each; iv.a.* answers (40 slots) +3 each; iv.news.draft +2; iv.intro.draft +1 (src/league.js). Fixed ivAnswers seed (was always 2nd wording)
- [x] T5. node --check src/*.js; node tools/lint-v30-text.js PASS; node tools/t30c.js 30/30; variety check (4 distinct answers per slot, HOF 8 distinct, no raw braces)
- [x] T6. HAIKU-TASKS.md + PROGRESS.md updated
- [x] T7. Committed locally on branch v30-text-variants (4fdece1). PUSH BLOCKED: GitHub not linked to this session (add_repo asks to connect GitHub). Sent patch instead.
- [ ] T8. 7t / 8t: deferred (need keys first). Ask Kenneth.

---
# TASK_STATE — v30c UI (items 1, 2, 5, 19, 21, 23) — Sonnet

Note: repo had NO v30c logic (no 6a/5/23 entries). Kenneth chose: build minimal logic for 5 + 23 here. GitHub not linked -> commit locally, send files + patch.

- [x] S0. Explore code: negotiatePanel (app.js), L.trades, signContract/release, promisesPanel, hofSpeech, ivTrigger/IV_Q
- [x] L5. Logic #5 in league.js (end): L.mv + rec.wu via mvTradePre/Post, mvSignPre/Post, release hook; keys mv.n.*/mv.t.*/mv.r.*
- [x] L23. Logic #23: stage 'draft' (startDraft), 5 draft-only Qs + 5 new regular/playoff Qs, L.ivUsed no repeats, ivPoolLeft; tools/t30c.js 30/30
- [x] U1. #1 Roster Moves overview: My team / League sub tabs
- [x] U2. #2 Player page Negotiate button + popup with live cap numbers
- [x] U5. #5 write-ups shown on completed trades, signings, releases
- [x] U19. #19 Promises: Current / Former players sub tabs
- [x] U21. #21 Hall of Fame ceremony page, one speech per inductee
- [x] U23. #23 Interview dialog uses periods + pools
- [x] Q1. tools/t30c.js 30/30 + tools/browser-v30c.py.txt 126/126 (NBA 30 + PBL 16, desktop 1300 + 390px)
- [x] Q2. Existing tests: same as baseline (see PROGRESS.md)
- [x] D1. PROGRESS.md + README updated, committed locally, patch + changed files sent (no push: GitHub not linked)

---
(previous section, v30b UI — done)
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
