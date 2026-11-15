# TASK_STATE — v32 version-end review (Opus) + history files check (v119 zip) — Nov 16 2026

- [x] R0. Read PROGRESS v32a-v32h, TESTING, v32-plan; start 4 x 20-season runs (tools/runs32/v32r-*.txt) — running SEED=21
- [x] R1. Code review — found: S2 role promises travel with a traded contract (floor on new team) but clauseTV priced only old starter/min promises -> fixed league.js clauseTV; tools/t32r.js 6/6
- [x] R2. History zip (v119): inventory, blank/gap audit — /home/claude/hist/inv*.py; source = B-Ref dataset (sumitrodatta/bball-reference-datasets)
- [x] R3. Reconstruct blanks — /home/claude/hist/build.py -> hist/out/*v120.xlsx + NBA_ADVANCED_RS_BY_SEASON_v120.csv + build.log (fill log sheet per workbook)
- [x] R4. 4 x 20 seasons done (tools/runs32/v32r-{nba,pbl16}-{commish,team}.txt), summary tools/runs32/v32r-summary.txt (tools/v32r-sum.py.txt): 0 errors
- [x] R5. Fixes: clauseTV role promises, win-first bar wfBar (5 per team; A/B old 0,1,3,1,3,4 vs new 0,1,1,1,2,2); t32r 10/10, t32e 21/21, t30a 21/21, lint 106, t32h 11/11
- [x] R6. V32-REVIEW.md + V32-NEXT-PROMPTS.md written, PROGRESS + README updated ; project docs claude/nba/v32-review.md + v32-next-prompts.md written
- [ ] R7. Commit; push or zip

---
# TASK_STATE — v32h (Opus): cleanup from v32 review — Nov 16 2026

- [x] H0. Read code: planRotation sixth-man stints, hard cap checks (rookie scale, player options), save size (what grows) — done
- [x] H1. Sixth man: plan his stints before the starters' rest pattern; target 24-28 every season — engine.js planRotation: the sixth man's partner starter sits up to SIX_EARLY (4) min earlier each half; 60 days: sixth 25.2 -> 26.0, starters 27.8 -> 28.0
- [x] H2. Hard cap: hard-capped teams can't go over via rookie-scale picks / player options (NBA rule); AI + user handled — league.js: tradeCheck blocks AI teams going over APRON next season; icon re-sign must fit (up to 25% hometown discount, else leaves t:cap); AI team option declined if over APRON; player options stay the player's right; r30 capOver audit
- [x] H3. Save pruning: cut per-season growth (old box scores/logs/history detail) without losing visible history — league.js pruneSave (startNewSeason): stale p.vs[t].cs dropped, retired moraleParts/disc/dl, retired p.vs packed (vsPack/vsUnpack); 3-season save 8715 -> 7270 KB
- [x] H4. tools/t32h.js — 10/10
- [x] H5. Tests: node --check, lint 104, t30a 21/21, t30c 30/30, t32b 20, t32c 15, t32e 21, t32g 23, t32h 11; 10 seasons (tools/runs32/v32h-nba-*.txt): 0 errors, save S10 14.3 MB (was 17.4), max next-season payroll = hard cap
- [x] H6. Plan docs (drop fantasy/betting: v32-plan, v32-prompts, v32-interim-prompts), PROGRESS + README, commit, zip

---
# TASK_STATE — v32g (Opus): open items + v32 review (S7) — Nov 16 2026

Part A
- [x] A0. Read code (roleMinutes/RM_LIFT, mleStatus/cap rules/AI signing, rotChart validation in planRotation) — done
- [x] A1. Sixth men 24-28 via role minutes plan — engine.js planRotation: long run per half for the top bench man, gap fill weights minutes owed, planEven; RM_LIFT sixth 9, fs 6.5. 1 season: sixth 25.3 (was 22.5)
- [x] A2. Mid-level = real cap exception — league.js MLE_REAL, mleFits, canFit, faRoom(max room/MLE), b2Room, demandCtx proj, signContract marks t.mleUsed/mleWho; negotiate + makeFAOffer refuse over-cap offers with mle unticked; app.js offer warnings
- [x] A3. Saved chart stand-ins — engine.js chartPlan (one stand-in per out player, g.chartSubs -> tl.subs); app.js game chart note, editor note (rcOut), out players can be removed, no save block
- [x] A4. tools/snap/ remade (nba-commish-s10 3.8 MB gz, nba-team-s10 3.8 MB gz, pbl16 in progress); kept out of git (.gitignore)
- [x] A5. tools/t32g.js 21/21; node --check, lint 104, t30a 21/21, t30c pass, t32a 38, t32b 20, t32c 15 (chart test updated), t32d 15 (mle test updated), t32e 20/21 seed 5 (leave-kinds check is seed noise; 21/21 SEED=11). Also: win-first room = cap room or MLE; coaching targets note 'Needs your mid-level'
- [x] A6. 10 seasons NBA SEED=21 (tools/runs32/v32g-nba-*.txt): 0 errors, 0 roster problems; sixth 22.9-26.2 (avg ~24.3/24.9) -> RM_LIFT sixth 9 -> 10.5; payroll avg 152-184 (v32e2 163-181); win-first 0-3; save 17.4-17.5 MB
Part B
- [x] B1. Review: sixth men low (fixed A1), MLE vs win-first room (fixed), coaching-target notes vs MLE (fixed), teams far under payroll floor (67-95M committed), floor charge static in season, rating climb 57->64 (known, levels off), t32e leave-kinds check seed-flaky
- [x] B2. Fixes: payroll() floor charge only up to the floor (payNoFloor), salary dumps go to under-floor teams first and ask less; t32g D 23/23
- [x] B3. 20 seasons new NBA league: tools/runs32/v32g-20-nba-commish.txt, 0 errors; r30 row v32g + tools/v32g-sum.py.txt
- [x] B4. V32-REVIEW.md + project doc claude/nba/v32-review.md
- [x] B5. PROGRESS.md + README, committed; push blocked (GitHub not linked): zip of changed files + separate snap zip sent

---
# TASK_STATE — v32f-a (one universe UI): remove real-vs-game split — Nov 16 2026

- [x] G0. Grep src for real/Real NBA/historical wording + the split panels — grep of app/league/engine/nba-setup/nba-text; only app.js and nba-text.js had user-facing real-vs-game text
- [x] G1. History tab: drop Real NBA sub-tab, merge into Seasons / Championships — src/app.js vHistory merged list (simRow + pastRow), Championships list, awards table + leaders, Real NBA tab removed
- [x] G2. Team pages: merge Real NBA panel into team titles / Finals / history — src/app.js teamFinalYears, nbaTeamHonors, summary counts; header Titles tile combined
- [x] G3. Trophy case one case, no "(real NBA)" — src/app.js trophyCase one case merged by award type
- [x] G4. Dynasties & eras: no `real` class / greyed rows — src/app.js dynastyView + styles.css: no real class / muted rows
- [x] G5. Player pages + chart note, other user-facing text — src/app.js chart notes, est tags, legends text, setup text; src/nba-text.js wording
- [x] G6. tools/t32f-a.js + node --check, lint, t30a quick — tools/t32f-a.js 43/43; node --check, lint 104 PASS, t30a 29/29
- [x] G7. Browser check History + team + real player (1300 + 390) — tools/browser-v32f-a.py.txt 36/36 (1300 + 390px)
- [x] G8. PROGRESS.md + README, commit, zip (GitHub not linked) — PROGRESS.md + README written, committed; push blocked (GitHub not linked), zip sent

---
# TASK_STATE — v32e2 (Opus): smooth asks, realistic re-signing, de-tune — Nov 15 2026

- [x] F0. Measure real salaries vs market value by OVR (new NBA league) — real NBA salaries by OVR: 60-61 med $10.9M, 62-63 $19.3M, 64-65 $16.1M; market value had a cliff 59 $2.3M -> 60 $8.7M
- [x] F1. Ask ramp 56-69 (no cliff at 60), per-player variation, vet minimum — ASK_RAMP + rampAmt: hard to 59, soft 60-64 (40% above), jitter 0.88-1.12; asks med 58 1.9, 59 2.5, 60 4.5, 61 6.3, 62 7.6, 63 10.7, 64 13.0, 65 16.6
- [x] F2. Re-signing: probabilistic, several leave reasons — resignWantP/resignLeave/resignDecide/resignLog, RESIGN_WHY, news.leave (replaces news.walk); team pays 70-95% of ask per case
- [x] F3. De-tune: win-first per-candidate chance (WIN_FIRST.p 0.8 x score, no quota), picks among top 3 contenders; EXP_TR max 8 (safety only); ramp soft share grows 15%->55%
- [x] F4. Update t32e + report (contracts by OVR, leave reasons) — t32e 21/21; r30 row v32e: contracts by OVR band, payroll, why
- [x] F5. Tests: check, lint 104, t30a 21/21, t30c 30/30, t32e 21/21, 10 seasons commish + franchise (tools/runs32/v32e2-nba-*.txt): 0 errors
- [x] F6. PROGRESS + README, commit, zip (push blocked: GitHub not linked)

---
# TASK_STATE — v32e S5 (Opus): market logic — Nov 15 2026

- [x] E0. Read code (ask/computeMarket, AI re-sign, faRound, AI signing, trade AI, write-up keys, news FLAVOR) — done
- [x] E1. Asks: young <=25 OVR<=55 min, 56-59 <=~2x min; cap young <60; check older low-rated; before/after counts — league.js lowAskCap/capAsk (computeMarket mval, setAsk, re-sign ask, negotiate needR, faRound W, demand/insult bumps); new NBA league: 175/175 young <=55 ask min, 56-59 ask 1.6-2.6M
- [x] E2. AI re-signing more often + random walk-aways — league.js RESIGN consts (rank 10/ovr 58 wanted, pay 0.9 of ask, leave 0.22, walk 0.06), news.walk
- [x] E3. Win-first stars: 1-2 pay-cut signings per offseason to contenders + news key — league.js WIN_FIRST, winFirstFA (faDay days 1-2), news.paycut
- [x] E4. Trades: AI buys expirings with low picks / dumps long contracts; write-up reason keys — league.js expiringTrade/runExpiringTrades (in runSalaryDumps), rec.kind 'exp', rec.wk, mv.t.expiring/absorb/longfit/dump
- [x] E5. Per-season report tool (asks by OVR band/age, re-sign rate, pay-cuts, dump trades) — tools/r30.js row.v32e; baseline tools/runs32/v32e-base.txt (3 seasons)
- [x] E6. tools/t32e.js — 19/19 (asks, AI bids, re-sign rate + walk-aways, win-first, expiring trades, text keys)
- [x] E7. Tests: node --check, lint 104 PASS, t30a 21/21, t30c 30/30, t32e 19/19; 10 seasons commish + franchise SEED=21 (tools/runs32/v32e-nba-*.txt): 0 errors, 0 roster problems
- [x] E8. PROGRESS.md + README, committed (820d2d8); push blocked (GitHub not linked), zip of changed files sent

---
# TASK_STATE — v32d S4 (Sonnet): UI pass — Nov 15 2026

- [x] D0. Read code (game page, starting window, rotChart/tl API, roles UI, offer popup, MLE/cap box, coaching targets, draft tab)
- [x] D1. Rotation chart view (game page) + starting lineup window planned subs — app.js rotChartPanel, tlStints, nextSubs; styles.css .rc-*
- [x] D2. Rotation chart editor (my team) + reset + minutes-vs-role warning — app.js rotEditor (toggle grid, save/undo/reset, role warnings), tab "Rotation chart" in My Team
- [x] D3. Roles + expected minutes on roster, player page, FA offer form
- [x] D4. MLE "Use mid-level" in offer popup + cap box info
- [x] D5. Coaching targets: affordable FAs only + fit notes
- [x] D6. Draft tab: any team's owned picks (this year + future, traded, protections)
- [x] D7. Tests: node --check, lint, t30a, browser per screen (desktop + 390px) — node --check, lint 100, t30a 21/21, t30c 30/30, t32a 38, t32b 20, t32c 15, new t32d 15/15, browser-v32bc 22/22, new browser-v32d 70/70 (1300 + 390px)
- [x] D8. PROGRESS.md + README, commit, push or zip

# TASK_STATE — v32b S2 (Opus): stats, minutes, roles — Nov 15 2026

- [x] B0. Read code (buildSide targets, doSubs, rebKey, block calc, moraleParts EXP_MIN, c.role promises, negotiate/clauseMult, faRound)
- [x] B1. tools/v32stats.js (ENGX= overrides). Baseline tools/runs32/v32b-base.txt: 29 at 9+ RPG, 6 at 1.5+ BPG, 2.6 BPG/team, top MPG 39
- [x] B2. engine ENG.teamReb 0.1 (team rebounds, no player credit) + rebPos by court slot [.9,.92,1,1.05,1.12]: 18 at 9+ RPG, 43.5 team RPG (probe9b)
- [x] B3. engine ENG.blkK 1.7, blkPow 1.2, blkSel 1.6: 13-16 at 1.5+ BPG, 4.3 team BPG
- [x] B4. engine ROLES, teamRoles/setTeamRoles/roleOf, roleMinutes (lambda fit to 240); buildSide uses it (non-manual); weekly refresh; morale minutes vs role range
- [x] B5. league.js expRole/roleAppeal; AI offers carry role (appeal), c.rl stored; promised role = floor + promiseState by range; clauseMult/signConcerns weigh role; app.js roster Role column, sumCard, rotation panel, offer Role picker, morale row
- [x] B6. tools/t32b.js 20/20
- [x] B7. node --check, lint, t30a 21/21, t30c 30/30, t32a 38/38, t32b 20/20; 10 seasons NBA commish + team (tools/runs32/v32b-*); tuned teamReb 0.115, sixth man lift, star stretch cap
- [x] B8. PROGRESS.md v32b section (README with v32c)

# TASK_STATE — v32c S3 (Opus): rotation timeline (engine) — Nov 15 2026

- [x] C0. Read runPeriod subs (doSubs every 180 s / 60 late), lateSubs, logE entry[8] lineups, pbpReplay, L.games retention
- [x] C1. engine coachPat (per coach: first-sub group, Q1/Q3 out times by style, Q2/Q4 split), planRotation (48x5 plan, bench stints by position fit + role minutes), per-game jitter
- [x] C2. subStep/followPlan: plan in normal play; doSubs for close finish / blowout / OT; inTrouble + injuries filled by fit + minutes owed
- [x] C3. g.tl {st, ev[[ds,out,in]], src, bad}; game.tl; tlPrune (yours + last 30); tlReplay; PBP 'u' sub lines with lineups; pbpReplay starters from tl
- [x] C4. t.rotChart {q:[4 quarters x 4 blocks x 5 ids]} -> chartPlan/rotSetup; invalid -> coach plan + tl.bad reason
- [x] C5. tools/t32c.js 15/15
- [x] C6. All tests pass; 10 seasons commish + team (tools/runs32/v32c-*): minutes by role in range (sixth ~22.7), save +0.7% vs v32b
- [x] C7. PROGRESS.md + README, committed, zip sent (GitHub not linked)

---
# TASK_STATE — v32a S1 (Sonnet): data + quick fixes — Nov 15 2026

- [x] A0. Read code: nba-setup.js hook (nbaSetupV30a), rmb in engine buildSide, negotiate() 'disc' rule, p.ext (pending extension), offers panel
- [x] A1. src/nba-setup.js: NBA_ADJ ratings, Embiid -5, Kawhi/Embiid fragile, Porzingis retired + GSW fill, Lakers Knecht FA / Thiero rookie, Luka perm grudge, nbaFixRmb
- [x] A2. engine.js rmb cap +-4; league.js addGrudge perm, yrsLeft/contractEnd (ext counts), negotiate no silent shortening, acceptOffer clears overlapping offers, rivalry bump + news; app.js years left, Negotiate -> trade center, perm grudge labels
- [x] A3. tools/t32a.js
- [x] A4. node --check, lint, t30a quick, t30c, browser check (extension + draft offers)
- [x] A5. PROGRESS.md + README, OVR before/after report, commit, zip

---
# TASK_STATE — merge v31 overseas (Sonnet) into v30-review — Nov 15 2026

- [x] M1. git apply --3way v31-abroad.patch: code clean (same base as round 2); PROGRESS.md + TASK_STATE.md conflicts kept both
- [x] M2. Tests: node --check all, lint 100 PASS, t31-abroad 14/14, browser-v31 23/23, 3 seasons from tools/snap/nba-commish-s10 (no errors, 0 jersey dups, tw 38-48/60, abroad 45/89/116)
- [x] M3. Committed, combined zip sent

---
# TASK_STATE — v31 overseas (cut players aged <=26 go abroad instead of retiring) — Nov 15 2026

- [x] A0. Read code: startNewSeason FA cap, retirePlayer, pipeBuild P3, aiFillTwoWay, startOffseason, app.js player page + League>Players
- [x] A1. src/league.js: ABROAD consts, sendAbroad, abroadOffseason (after computeMarket in startOffseason), startNewSeason cut rule, pipeBuild P3 club + tx/news, FLAVOR ab.go (4 wordings)
- [x] A2. src/app.js: faTxt() label in League>Players, 'Overseas' team filter (FA filter excludes abroad), player page label, negotiable blocks abroad
- [x] A3. tools/t31-abroad.js 13/13 (2m50s PBL 16); lint extended to ab.* (100 keys PASS)
- [x] A4. node --check OK, lint 100 PASS, t30a 29/29, t30c 30/30, t31 14/14 (after fix: earlier abroad seasons carry over via p.abroadSeasons)
- [x] A5. tools/runs31/v31n-nba-commish.txt: tw start 48.3 vs 46.8, FA 26.9 vs 26.7, 173 abroad at S10, save 17,411 KB vs 16,968 KB
- [x] A6. tools/browser-v31.py.txt 23/23 (player page + League>Players Info/Stats, 1300 + 390px); fixed 'Role: Free agent' on sumCard
- [x] A7a. PROGRESS.md + README written
- [x] A7b. committed on branch v31-abroad; PUSH BLOCKED (GitHub not linked, add_repo asks to connect); zip + patch sent

---

# TASK_STATE — faster testing: tiers doc + season-10 snapshots — Nov 15 2026

- [x] F1. TESTING.md (repo) + project claude/testing-tiers.md; r30.js SNAP= option
- [x] F2. Snapshot maker tools/snap-make.js + loader tools/snap.js (load save, migrate, set globals)
- [x] F3. tools/snap/nba-commish-s10, nba-team-s10, pbl16-commish-s10 (.json.gz); each loads + sims 1 season via r30 SNAP
- [x] F4. PROGRESS.md, committed, zip sent

---
# TASK_STATE — v30 next steps in this session (prompts 1-3) — Nov 15 2026

- [x] N1. 17 keys sc.* (5) + tk.* (12) at end of src/league.js; scoutDlg + tickerItems in src/app.js use fl() with a per-day seed (same text as before)
- [x] N2. 4 wordings per sc.*/tk.* key (src/league.js end); tools/lint-v30-text.js checks sc/tk: 99 keys PASS
- [x] N3. faRound (league.js): in season, unsigned player with offers below his ask drops to max(best offer, ask x0.8) weekly (was only x0.9 and capped-out teams only offer the minimum, so a $23.5M ask never reached it)
- [x] N4. Drift cause: season-start FA cap (60) retired lowest-OVR first, deleting young two-way prospects (9-23 a year). league.js startNewSeason now ranks by two-way value. FA>=13th-man rise was mostly two-way refusers (cumulative count); bench line + league OVR climb same as v29
- [x] N5. 20 seasons NBA commish + PBL team (30): tools/runs30/v30n-*.txt
- [x] N6. lint 99 PASS, t27 71/71, t30a 29/29, t30b-ui 17/17, t30c 30/30, browser v30a 95/95, v30b 135/135 (2 sc.matchup wordings reworded to keep 'offense ('), v30c 126/126
- [x] N7. Round 2 section in V30-REVIEW.md + project doc; PROGRESS.md; committed; zip of all changes since 6d6f2a6 sent

---
# TASK_STATE — v30 review + 20-season sims (Opus QA) — Nov 15 2026

- [x] R0. Clone, read v30-plan + PROGRESS, lint PASS, t30a 29/29, t30c 30/30
- [x] R1. v30a reviewed: #13 two-way too strict (fixed R4c), #10 jersey dups (fixed R4b), #22/#24 OK, #25 tags 2026 draft class (55, season 1 = 2026-27) — ask Kenneth if he meant Flagg's 2025 class. UI items covered by browser-v30a (rerun in R7)
- [x] R2. v30b reviewed: pbpReplay +/- assumes 5 per side (edge: foul-outs); small-league best-of-5 text correct; 8t/7t still hard-coded strings
- [x] R3. v30c reviewed: #5 write-ups hook sign/release/trade OK (re-sign shows no fit, by design); #23 periods + no-repeat OK; Haiku ivAnswers seed change OK
- [x] R4. Long-sim harness tools/r30.js (done; SRC/SEED/NBA/SIZE/MODE env)
- [x] R4c. Bug: two-way rejections left 16/60 slots filled at NBA S2 start (v29 48). league.js TW_REJ: mval counts only >25% over min, weekly cooling, post-FA factor 0.2. Now 42/60, ~1/3 of asked players refuse once
- [x] R4b. Bug: jersey duplicates after trades / two-way signings. Fixed league.js assignNumber (two-ways + text compare), addToTeam, executeTrade/executeTrade3, startNewSeason sweep. 2 PBL seasons: 0 dups (was 8-14)
- [x] R5. v29 baseline: commit 1253318, NBA commish 20 seasons (tools/runs30/v29-nba-commish.txt)
- [x] R6. 20 seasons x 4: NBA commish, NBA team, PBL commish (16), PBL team (30). Raw in tools/runs30/, summary: python3 tools/r30sum.py.txt
- [x] R7. Re-test: lint PASS, t30a 29/29, t30b-ui 17/17, t30c 30/30, t27 71/71, browser v30a 95/95, v30b 136/136, v30c 118/118. Speed v29 85-90 s vs v30 95-100 s per NBA season
- [x] R8. Report V30-REVIEW.md + project claude/nba/v30-review.md
- [x] R9. PROGRESS.md updated, committed on branch v30-review. Push blocked (GitHub not linked); patch + changed files sent

---
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
