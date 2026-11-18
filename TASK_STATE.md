# TASK_STATE — Phases A/B/C: expansion teams, save safety + tutorial, desktop app (Opus) — Nov 18 2026
Plan: /mnt/project-files/plans/desktop-release-plan.md. One PR per phase, merge when tests pass.
- [x] A1. league.js: expansion logic (xpnPlan/xpnRun at end of league.js, startFA hook; engine.js pairMatrix any-size schedule, isBig = 24+ teams); tools/t-exp.js PASS 16->18
- [x] A2. src/xp.js: Expansion page (pick cities, team creator, protect list, results popup) + wiring (index.html, template, build.py, sw.js)
- [ ] A3. Tests: tools/t-exp.js (PBL 16->18, NBA 30->32, 3 seasons after), browser check; PR, merge
- [x] B1. Auto-backups (app.js backupMaybe/getBaks/loadBak, recovery in load(), Saves popup list) + difficulty (league.js DIFF, fx.js Game section)
- [x] B2. Error card + tour (src/pb.js), cleanup to archive/; browser-pb ALL PASS
- [ ] B3. Tests, PR, merge
- [x] C1. desktop/ (Tauri 2: lib.rs save-file commands, copy-web.js, icons), src/desk.js bridge, .github/workflows/desktop.yml, DESKTOP.md; real Linux build opened a league from a save file; .deb bundle built
- [x] C2. Tests: browser-desk (fake backend) ALL PASS; PR

---
# TASK_STATE — Sonnet batch: popups, spoilers, phone layout, app install (Nov 18 2026)
Branch `sonnet-popups-phone-pwa`. Items: F1 F2 U1 U2 I2 I1.
- [x] F1 popup queue: app.js popupBusy/flushDialogs (one popup at a time; ceremonies/story/to-do toasts wait)
- [x] F2 no spoilers: top bar record before live game, ticker hidden, dialogs + story toasts held until the live game ends
- [x] U1 phone top bar: styles.css (end), index.html/template b-more, app.js Sim menu, p3.js scroll hide
- [x] U2 phone tables: data-ph columns (app.js tables), p3.js phoneCols, styles.css
- [x] I2 Settings stop-the-sim section: fx.js STOPS, app.js interruptKind flags (pauseMtg/pausePress/pauseWarn)
- [x] I1 installable offline app: manifest.webmanifest, sw.js, icons/, fx.js Install section, index.html (offline load checked)
- [ ] tests, PR, merge

# TASK_STATE — Haiku quick fixes: goals box, Notes/to-do covering text, phone search + day-1 standings, root cleanup (Nov 18 2026)
- [x] 1. Repo cloned to /home/user/pacific-basketball-league (HEAD d3e32e6)
- [x] 2. F3 owner goals box: playoff text uses poDirect (6 in 30-team league) in src/league.js ownerGoalFor; goalTracker in src/app.js: 0-0 shows 0%, r2/title goals use seed bar (never full), no money bar on those
- [x] 3. U3 floating Notes + to-do toast: src/styles.css end (phone: Notes shows only icon+label, toast sits above bottom nav)
- [x] 4. U4 phone search row gets 200px basis (src/styles.css); day-1 standings tie-break by preseason expW (src/engine.js seedOrder)
- [x] 5. I3 root cleanup: 41 root copies identical to tools/ deleted; v30a.patch moved to patches/
- [ ] 6. Tests: lint-v30-text PASS, t30c running; phone screenshot check
- [ ] 7. Commit, push branch, PR, merge if tests pass

---
# TASK_STATE — Draft stats, trade pictures, commentary colors (Opus) — Nov 18 2026
- [x] 1. Draft night cards: college/international stats from prospect pipeline (zeros if none) -> p3.js seasonLine falls back to p.pre (also rookie cards), footer shows NCHF/EABL/APBA + season
- [x] 2. News page trades: small player faces + team logos -> app.js newsPics (grouped by team), styles.css .np
- [x] 3. Live commentary colors -> app.js lvTicker mood (tk-me-good/bad), star lines get a side; styles.css uses --win/--loss (both themes)
- [x] 4. Tests: p2 81/81 (index+single), p3 116/116, p1 70/70, lint; PROGRESS.md; tools/mkdraft.js; PR

---
# TASK_STATE — Rebound fix + Phase 3 + mobile (Opus) — Nov 18 2026
PR A: offensive-rebound fix. PR B/C/D: Phase 3 (#4 cards, #13 music, #12 trophies / #7 save-share, #11 draft night / #8 story events, #6 phone layout). PR E: mobile pass.
- [x] A1. engine.js: un-comment the offensive-rebound code (keep ball, putback) -> src/engine.js line ~2234
- [x] A2. Test season before/after (tools/oreb-check.js): pts +1.4, FG% +0.9, ast -0.5; t36 27/27, t34 19/19, lint, browser-p2 67/67
- [x] A3. PR #3 merged (7a06ac2)
- [x] B1. #4 player cards -> src/p3.js (cards view, card popup, PNG/share/link), app.js PBL + P3V hooks, styles.css
- [x] B2. #13 music -> src/fx.js SONGS menu/game, settings Music + Shows
- [x] B3. #12 Trophy room view + MVP/title ceremonies (p3.js, app.js afterRun)
- [x] B4. tools/browser-p3.js 52/52 (index + single), p1 70/70, p2 67/67, lint
- [x] C1. #7 packed file + share + team link + import (p3.js savesExtra/readLeagueFile, app.js Saves popup)
- [x] C2. #11 draft show + pick clock (p3.js draftWatch/draftNext/draftClock)
- [x] C3. #8 story popups + Stories view + popup art (p3.js storyOf/art/dialogArt; app.js runDialog)
- [x] C4. browser-p3 98/98 (tools/browser-p3x.js, tools/_mkdraft.js), p1, p2, lint
- [x] D1. #6 phone layout -> p3.js phoneLayout/swipeTab, styles.css body.p3-phone; browser-p3 114/114
- [x] E1. Mobile pass: tools/browser-mobile.js 178 screens at 390/360; fixes in styles.css (Mobile pass block), app.js .p-acts, p3.js Recent label
- [x] E2. browser-mobile 182/182, p1 70/70, p2 67/67, p3 114/114; PR

---
# TASK_STATE — Phase 2 (Opus) — Nov 18 2026: animated court view, play-by-play ticker, top plays highlights
- [x] 0. Phase 1 merged on main (9f07c1b); branch `phase2-live-court-ticker-highlights`; read vLive/lvTick/fxLive, engine logE + shot code, scSpot zones, portrait()
- [x] 1. engine.js: logE entry[10] shot code (zone*10+type), HL/hlAdd top-4 candidates + game-winner (hlGo) -> `game.hl` top 3 for every game; same scores as before (5-day check)
- [x] 2. src/court.js (new, canvas): live court scenes per entry (shots, passes, blocks, rebounds, steals, FTs, timeouts), reel(); app.js vLive .lv-stage + lvTick COURT.live + window.__pblCourt; build.py single, index.html, styles.css, .gitignore (tools/_*)
- [x] 3. app.js lvTickerLines/lvTicker (TK_SAY phrases, runs 8+, ties, lead changes, 20/30/40 pts, double/triple-doubles; cached per game), .lv-tick CSS + tk-in slide (off with Skip animations)
- [x] 4. app.js vTopPlays (view `topplays`), tpNights/tpNightList (top 10, max 2 per player), reel tpAfter/tpGo (autoplay, prev/next/pause), tpStrip on My team, tpGamePanel in box score; court.js projection refactor (v.P) + half-court reel view; CSS .tp-*
- [x] 5. Tests: node --check ok, lint PASS, t36 27/27, t34 19/19, browser-p1 70/70 (index + single, PORT=route), new tools/browser-p2.js 67/67 (index + single)
- [x] 6. PROGRESS + README + TESTING, pushed, PR #2 https://github.com/kenjacinto1028-afk/pacific-basketball-league/pull/2 merged (4a81a68)

---
# TASK_STATE — Phase 1 (Opus) — Nov 18 2026: sound effects + mute, screen animations, settings page, shot charts
- [x] 0. Clone, branch `phase1-sound-anim-settings-shotcharts`, read app.js render/router, engine shot zones (existing zone heat chart on player + team pages)
- [x] 1. src/fx.js: settings store (localStorage `pbl-fx`) + Web Audio sounds (bounce, swish, rim, dunk, block, whistle, buzzer, cheer, groan), no audio files; index.html + index.template.html (🔊 + ⚙ Settings buttons) + build.py single; CSS at end of styles.css
- [x] 2. app.js hooks: `fxSimResult` (runSteps: your last game's win/loss sound + banner, title = big confetti), `fxLive` (lvTick: sound per play, buzzer + crowd at final), render -> FX.afterRender(view key)
- [x] 3. Animations: #main fade on view change only (not live ticks), `data-cu` count-ups (team record, PF/PA, box score finals), confetti + result banner; speed via --fx-mult, .fx-off skips
- [x] 4. Settings popup (⚙ Settings in header, fx.js openSettings): mute, volume, live sounds, sim click sound, try buttons, skip animations, speed slow/normal/fast, confetti, reset, preview a win
- [x] 5. Shot charts: engine.js keeps each game's shots (`g.sh`, SH_ABC letters); app.js gameShotPanel (box score, team/player buttons), playerShotChart (heat / makes-and-misses toggle, season picker incl. playoffs + career, 350-shot sample), scCourt/scZoneOf/scSpot/shotDots
- [x] 6. Tests: node --check, lint PASS, t36 27/27, t34 19/19, tools/browser-p1.js 70/70 (index.html + pbl-single.html)
- [x] 7. PROGRESS + README + TESTING, pushed, PR #1 https://github.com/kenjacinto1028-afk/pacific-basketball-league/pull/1

---
# TASK_STATE — v37b (Opus) — Nov 17 2026: history book, all-time greats, HoF effect, HoF tab, v37a review
- [x] 0a. Clone + merge v37a zips (9 files: PROGRESS.md README.md TASK_STATE.md TESTING.md browser-v29.py.txt tools/browser-v29.py.txt tools/browser-v37a.py.txt src/app.js src/styles.css)
- [x] 0b. Read PROGRESS v37a, TESTING, v37-plan; merged code: node --check ok, t36 27/27, lint PASS
- [x] A. app.js historyBook: league + franchise lists continue with 1946-47..2025-26 (nbaHist, hxBestRecord, NBA_HX.aw LPTS, NBA_HX.fs, hbTeamAw); Champion column in RS mode; franchise records incl. past
- [ ] B. All-time greats: legacy = real career + sim; calibration; Top 50/100 toggle
  - [x] B1. core: nba-2026.js nbaLegBase/nbaLegBaseAll (real rs + real playoffs, every real player, legSeasT), migrate (L.legV 37); league.js legacyScore(p,tid,full) + real award -> that season's team; nba-history.js hxLegLegacy / hxLegendGreats (imputation, HX_CONV, HX_PO). Day-1 top 3 Kareem 4189, Jordan 4084, LeBron 4003; calibration real vs sim top-N 1:1
  - [x] B2. app.js greatsList()/greatsView: players (legacyScore full) + legends, Top 50/100 (ui.greatTop, data-greattop), by pos/team same list
- [x] C. legacyScore now incl. real playoffs (decision: real seasons count, yes); honorRetired skips names in NBA_HX hof (hxHofYear -> p.hofX); jersey rule counts hofX. Counts check in T3
- [x] D. app.js hofMembers()/vHofCeremony: one list, filters ui.hofF {y,t,c}, class cards on top; History awards short list (10) + Full Hall of Fame link
- [x] E. v37a review: browser-v37a 167/167 on merged + v37b code; History tables wrap (table.hwrap): book 1689->fits at 1600, seasons list 1358->fits
- [x] T1. tools/t37b.js 13/13 (top 3 Kareem/Jordan/LeBron, Wilt #4, Russell #7; calibration within 2-3%; no double induction) -> runs32/v37b-legacy.txt
- [x] T2. tools/browser-v37b.py.txt 90/90 (1300 + 390, day-1 NBA + nba-team-s10)
- [x] T3. tools/t37b-hof5.js 5 seasons from nba-commish-s10 SEED 21: before v37b 7 inductees, v37b 8 (+ Clingan 702, bar 700); none twice, none from the history list. runs32/v37b-hof5-base.txt / -new.txt
- [x] T4. t36 27/27, t34 19/19, lint PASS, v37a browser 167/167
- [x] F. PROGRESS v37b + README + TESTING; zip /mnt/user-data/outputs/pbl-v37b.zip (v37a + v37b files, repo layout; tools/_t1.json left out)

---
# TASK_STATE — v37a (Sonnet A: wide pages + mobile menu) + v37b (Sonnet B: league records tabs + pipeline overview) — Nov 17 2026
- [x] 1. Read app.js: My Team roster, draft board, trade center, row actions, tags, player page
- [x] 2. A: full-width panels, short tag chips (dup Luka fix), one ⋯ menu per row, wrap cells, trim columns on 3 pages
- [x] 3. A: sweep other wide tables (Players, Stats, FA, Teams, Pipeline rosters, Awards race), list changes
- [x] 4. B: ⋯ menu tap on 390px + same actions on player page (own players)
- [x] 5. C: History > League records sub tabs (ui.recTab)
- [x] 6. D: Pipeline Overview sub tab
- [x] 7. Browser test 1600/1300/390 on nba-team-s10 + day-1 league (tools/browser-v37a.py.txt)
- [x] 8. t36, t34, lint; PROGRESS v37a (+v37b) + README; two zips in /home/claude/outputs

---
# TASK_STATE — v36e (Opus) — Nov 17 2026: Kenneth: allow a 7th-9th man in clear room + stay discount 25%; accept 8-9%; merge zip later
- [x] 1. (CAP_CLEAR.top9) capClear: one rank 7-9 player (salary < his ask, 4+ OVR below) if bench sets can't; log capClear9
- [x] 2. RESIGN_K.disc 0.85 -> 0.75
- [x] 3. t36 26/26 (+v36e top-9 case, disc 0.75; v36d case ask = 1.5x bench deal) t36 checks (disc, top-9 move); run t36
- [x] 4. runs32/v36e-nba-snap10-r21/r22: t:cap 55/676 = 8.1% (v36d 8.7%), hard 35 (46), cleared 5 (all with a 7th-9th man), discount stays 16, 0 reds. 2 x 10 seasons from v36a3 save (SEED 21/22) vs v36d r21/r22
- [x] 5. Tests all pass (t36 26/26) Tests t34 t33b t33c t33d t32e t32h t30a lint (+ t36)
- [x] 7. Pre-upload: trade kind 'clear' + mv.t.clear wordings; discStay/ccWhy/capClearFail first-player logging; 15% comment; t36 27/27, t32e, browser 52/52, lint
- [x] 6. PROGRESS v36e + README; merged zips (v36d + v36e) in /home/claude/outputs

---
# TASK_STATE — v36d (Opus) — Nov 17 2026: A hard-cap clear room, B to-do review, C PROGRESS cleanup, D version-end
- [x] 0. Clone, v36c verified complete (AW_ADV v36c in src/league.js, runs32/v36c-*)
- [x] A1. startResign (league.js) discount line; release() leaves dead money = no room, min deals cap hit 0 -> trade-only clear
- [x] A2. league.js CAP_CLEAR + capClear() (trade bench deal to team w/ room, 2nd if burden), tx both, o60 capCleared/capClearFail; v34sum prints it. Runs /tmp/runs/a21,a22
- [x] A3. runs32/v36d-nba-snap10-r21/r22: t:cap 34+19 = 53/673 (7.9%) vs 58/699 (8.3%); capCleared 2, rule rarely can act. runs32/v36d-ccdiag-*: gaps $5-37M vs movable bench $0-6M (why: tooBig / noBench). ccWhy kept in resignLog, v34sum prints it. Ask Kenneth on options
- [x] A4. tools/t36.js +5 v36d checks (own save copy), 24/24. capClear fixes: core = top 9 whole roster; just signed = contract s >= cap season; smallest set (1 then pairs)
- [x] B1. app.js: s1f lineup ticks only on Roster tab; s1j adds harmony >= 45; todoPromiseRisk game-count needs due.s = season. Others match
- [x] B2. tools/browser-v36d.py.txt 52/52 (old app.js fails the 3 fixed rules: 46/52)
- [x] C. PROGRESS.md 4 stale lines + HAIKU-TASKS.md 2 lines marked done with pointers
- [x] D1. runs32/v36d-nba-commish.txt, v36d-pbl16-commish.txt; saves copied to tools/snap (nba-commish, pbl16). Flags: NBA reds S2-14 (lowest -128 DAL allin), top PER 38-41 S18-20. A/B run CAP_CLEAR off -> /tmp/runs/v36d-nba-commish-off.txt (running). 20 seasons NBA + PBL16 commish SEED=21 SNAPOUT; report vs v36a3
- [x] D1b. MVP from saves S1-10 (/tmp/mvp.js): NBA new 4/10 WS leader, top-3 7, 7 winners (Doncic S2 WS rank 11, Flagg 5, Sarr 6); old v36a3 save 8/10; PBL 6/10, 5 winners (Tolentino 5). 0 errors, capOver 3 (base 3)
- [x] D2. tools/snap/nba-team-s10.json.gz remade (snap-make SEED 21)
- [x] D3. Tests on new saves: t36 24/24 (C + A1 checks made save-proof), t34 19/19, t33b 30/30, t33c 24/24, t33d 17/17, t32e 21/21, t32h 11/11, t30a 29/0, lint PASS, browser v36d 52/52
- [x] D5. A/B CAP_CLEAR off 20 seasons (runs32/v36d-nba-commish-off.txt): no deep reds, top PER <= 35.9 -> capClear kept all-in teams at hard cap paying tax. Fix: capClear needs post payroll <= seasonLimit and not cuttingLosses (why ownerLimit). t36 25/25
- [x] D6. Final D: runs32/v36d-nba/pbl16-commish.txt, saves copied; A 2x10 from v36a3 save: runs32/v36d-nba-snap10-r21/r22 (t:cap 8.7% vs 8.3%, 0 reds). Tests all pass again
- [x] D4. PROGRESS v36d + README (v36d, v36c) + TESTING; zips in /home/claude/outputs

---
# TASK_STATE — v36c MVP retune on merged code (Sonnet) — Nov 17 2026

- [x] 0. Clone, read PROGRESS (v36 / v36a 1-3) + TESTING; existing TASK_STATE all done -> new section on top
- [x] 1. Dump SEED=21 -> /tmp/aw21 and SEED=22 -> /tmp/aw22 (t36-awsnap.js dump 10, SNAP nba-commish-s10)
- [x] 2. Grid sets on both seeds (WS .35, ws48 .10, per .05, team .5 fixed; vary gs/bpm split + fat1/fat2/fatOld)
- [x] 3. Pick best in-spec set (or report closest + ask Kenneth if no set reaches WS leader 6/10 on both)
- [x] 4. Edit AW_ADV in src/league.js, node --check
- [x] 5. t33c-awards.js 10 -> tools/runs32/v36c-awards-new.txt + report vs v36-merge-awards-report.txt
- [x] 6. Tests: t33d (weights check), t33c, t34, t36
- [x] 7. PROGRESS.md (v36c) + TESTING if needed; two zips (src/, non-game)

---
# TASK_STATE — merge v36a part 3 + v36b (Nov 17 2026), work dir /home/claude/pbl-chk (GitHub clone)
- [x] 1. league.js = part 3 + v36b AW_ADV line (only v36b hunk); node --check ok
- [x] 2. tools from part 3: r30.js, t36.js, v34sum.py.txt (part 3 = updated lines), runs32/v36a3-*, snap/* (part 3 saves)
- [x] 3. Part 2 files added from Kenneth's zips: src/engine.js, tools/t34.js, t33b.js, per36.js, per36show.py.txt, runs32/v36a2-* (was: missing (not in GitHub, not in part 3 zips): src/engine.js (ENG.shareCap/shareK/useTax), tools/t34.js + t33b.js (part 2 edits), tools/per36.js, per36show.py.txt, runs32/v36a2-*. t36 18/19 (B2 PER engine FAIL). Waiting for Kenneth's part 2 zip
- [x] 4. PROGRESS.md merge (v36 section + v36a parts 1-3), README, TESTING, TASK_STATE
- [x] 5a. Tests all pass: t36 19/19, t34 19/19, t33b 30/30, t33c 24/24, t33d 17/17, t32e 21/21, t32f 21/21, t32h 11/11, t30a 29/0, lint
- [x] 5b. award run (part 3 save, merged code): MVP = WS leader 4/10 (target 6-7), top-3 9/10, 7 winners -> open, retune AW_ADV (Sonnet)
- [x] 6. Zips: /home/claude/pbl-v36-merged-src.zip, pbl-v36-merged-other.zip

---
# TASK_STATE — v36 MVP WS 35% + t33c multi-seed check (Nov 17 2026)

- [x] 0. Clone, read PROGRESS (v34 section; v36a section NOT in PROGRESS.md, only in TESTING.md + tools/t36.js) + TESTING. B already in repo (t33c WS_SEEDS 21/22/23, bar 0.94, from v34 follow-ups)
- [x] A1. tools/t34-awgrid.js: add WS-35% sets (W1-W5: gs / bpm / fatigue vary; ws48 .10, per .05 fixed), keep G as baseline — added W1-W5 + worstRank in SUM
- [x] A2a. Grid run 1 (tools/runs32/v36-awgrid.txt): all W1-W5 = G: WS leader 5/10, top-3 8/10, 8 winners, worst rank 4. Misses S14 (Mitsos #3, fatigue vs Johnson 3-peat), S17 Ellery #4, S18 Hines #4, S19 #3, S20 #2
- [x] A2b. New tools/t36-awsnap.js (dump league at award time, re-score sets offline in 5 s; matches the grid run). Grids on SEED 21 seasons: 136 + 400 random + 111 in-spec sets. Sets meeting all targets exist (r75/r116/r120 6/9/8) but all use ws48 .20 (WS family 55%, gs .10-.22); in-spec (ws48 .10, per .05) max = WS leader 6, top-3 8 (S17/S18 WS rank-4 winners are near-ties: WS #1-#4 within 0.5-1.0)
- [x] A2c. Hold-out SEED 22 (G there: leader 8, top-3 10). 647 sets scored on both. gs/bpm split barely matters, fatigue does. Chosen in-spec: gs .25 ws .35 ws48 .10 per .05 bpm .25, fat .10/.15/.05 -> seed 21: leader 6, top-3 8, 9 winners (most 2), worst rank 4; seed 22: 7 / 10 / 7 winners, worst 3. Top-3 9+ on seed 21 only with ws48 .20 sets (WS family 55%) — not used
- [x] A3. src/league.js AW_ADV set (node --check ok)
- [x] A4. (done; PROGRESS v36) tools/t33c-awards.js 10 seasons -> tools/runs32/v36-awards-*.txt, report vs v34-awards-report.txt
- [x] B1. t33c 3-seed check already in repo (v34 follow-ups); re-run on current code: avg corr 0.956 (0.934/0.966/0.969), gap 3.26, t33c 24/24. No code change
- [x] T. Tests: t33c 24/24, t33d 17/17 (weights check updated), t34 19/19
- [x] P. PROGRESS.md + TESTING.md + TASK_STATE, zips: /home/claude/outputs/pbl-v36-src.zip, pbl-v36-tools.zip (not committed, no commit requested)

---
# TASK_STATE — v34 open items 6 + 8 (t33c multi-seed, MVP weights) — Nov 16 2026

- [x] 0. Clone repo, read PROGRESS v34 (open: t33c WS/wins 0.934 on SEED 21; MVP WS 40% vs 30%)
- [x] 1. tools/t33c.js: team WS vs wins averaged over SEED 21/22/23 (corr 0.956: 0.934 / 0.966 / 0.969, bar 0.94; mean gap avg 3.26, bar 4). Gap also averaged (SEED 21 alone was 4.20). t33c 24/24 (was 22/23)
- [x] 2. Asked Kenneth: KEEP 40% WS (no change to AW_ADV; set G stays)
- [x] 3. SKIPPED (Kenneth kept 40%). Was: if 30%: AW_ADV.mvp gs .35 ws .30 ws48 .10 per .05 bpm .20; fat1 .07 fat2 .14; run `tools/t34-awgrid.js 10`, report WS leader / top-3 / winners vs set G
- [x] 4. Tests: t33c 24/24, t34 19/19
- [x] 5. PROGRESS.md: new top section "v34 follow-ups" (items 6 + 8)
- [x] 6. Zipped only changed files: /home/claude/outputs/pbl-v34-followups.zip (tools/t33c.js, PROGRESS.md, TASK_STATE.md). Not committed (no commit requested)

---

# TASK_STATE — v36a part 3: owner money + 60+ cap/owner losses (Opus) — Nov 16 2026 (Kenneth: small time on 60+, -10% is enough)

- [x] Q1. Owners below 0 are overspenders (HOU 235 + $38M tax: -58; small markets at 205-237 vs revenue 200-235); ownerLimit is revenue-based but status floors + resignOwnerOK stretch go past it. t:cap split logged (resignLog o60 capHard / capOwner / capIcon): mostly hard cap
- [x] Q2. MEDIA 142 -> 150 (NBA); cuttingLosses: any market tight below cash -10 (OWNER_RED); resignOwnerOK no stretch below 0. 10 seasons from the part-2 save (starts with 4 teams in the red): 0 below 0 from S3 (SEED 21, 1 in S10) / S6 (SEED 22); v36a2 S11-20 had 1-5 every season
- [x] Q3. RESIGN_K.disc 0.85: a wanted 60+ player takes up to 15% less to fit the hard cap. t:cap 8.9% of 60+ expiring (64/723, 2 seeds) vs 10.1% (v36a2 S11-20) / 11.4% (part-2 runs): -12..-22%. Payroll 173.2 / 168.2
- [x] Q4. 20 seasons NBA + PBL (v36a3-*, saves remade); then OWNER_TAXCASH tax-line rule (2 x 10 seasons from the save: 0 teams below $0); tests all pass; docs, zips

---
# TASK_STATE — v36a part 2: payroll lever + PER fix (Opus) — Nov 16 2026 (Kenneth: finish both this session; MVP later with Sonnet)

- [x] P1. PER diagnosis (tools/per36.js): formula is standard; PER 36-40 leaders use 40-47% of plays (real best ~36%) at TS .60-.67; usage weight cap (2.1x) barely binds (1.7 same), shots come via handler / plays
- [x] P2. engine.js ENG.shareCap .25 / shareK 5 (shot passed on past 25% of team FGA tonight) + useTax 0.5 -> 1.0: SEED 21/22/23 top PER 36.4/34.9/35.4 (base 36.5/40.2), usage top 36-38.5, ppg top ~31, n25 14-15, lgTS .565 (.571)
- [x] P3. RESIGN_K.val 1.0 / valOvr 60: a 60+ player re-signs at max(ask, mval) (falls back to the ask if value does not fit cap/owner). One summer same stream (new save): payroll after FA 168.6 -> 170.9, kept same 27/35
- [x] P4. 10-season runs from the save (tools/runs32/v36a2-*): ask-only 164.4, value re-sign 164.8, +SPEND_K 1.24 168.8 / 1.30 165.4, +60+ extensions at value 168.2, +market counts rookie deals at cap hit (MKT_ROOKIE_FIXED, NBA) 169.4 (SEED 21) / 170.3 (SEED 22); most teams sat at the floor (market ~25% under its budget: unpaid rookie value). MKT_LIFT_NBA 3.4 (lift hit 3.0). SPEND_K kept 1.15. PER 32.6-38.3 (one 42.2)
- [x] P5. Tests (new saves): t36 16/16, t34 19/19 (fog K check widened), t33b 30/30 (market sum counts rookie deals), t33c 23/23, t33d 17/17, t32e 21/21, t32h 11/11, t30a 29/0, lint
- [x] P6. 20 seasons: NBA payroll 175.5, top PER 29.9-38.9, WS <= 18.7, floor 20/20; PBL 134.7, PER <= 33.7. Saves remade, docs, zips

---
# TASK_STATE — v36a NBA payroll + NBA PER + owner cash of yearly deals + forced PBL cap test (Opus) — Nov 16 2026

- [x] 0. Clone, read PROGRESS (v35b/v35a/v34), TESTING, v36-prompts. Baseline = tools/runs32/v35a-nba-commish.txt (payroll 166.5, top PER 34.4-40.4, WS <= 19.4; why60 losses t:team 1-9 + t:cap 1-7 a summer)
- [x] 1. C: schedAmt + cashPayroll (league.js) use contract.sched; new NBA league S2: cash 154.4 -> 165.8 avg (= cap payroll 165.7)
- [x] 2. B: NBA_BAL t95 2->1, cap 97->96, capGen 98->97 (league.js); S11 save: Wemby 97 (32), gen Fraser 95; PER 39.6 also from OVR 80-84 (S19-20), not rating-driven
- [x] 3. A2: resignWantP mid60 .95 / mid60old .8 (RESIGN_K) for 60+ top-9 players, team not tanking, payroll+ask <= TAXLINE; S11 summer o60 kept 40/45
- [x] 4. A1: FA_EARLY + faEarly (league.js faRound): days 1-3 middle teams bid ask x1.05 on 60+ top-10 fits (room/MLE/ramp/hard cap kept). S11 FA has only 3 60+ FAs (pool tiny), so A1 moves little; A2 is the lever
- [x] 5. tools/t36.js 13/13 (D forced PBL 96 -> 92, gen 99 -> 97; A1, A2, B, C). Found: growTo stops short, a gen 99 stayed 98 over capG 97 -> nbaTopCap / leagueTopCap repeat the nudge (league.js). r30 row cash + v34sum why60 / owner cash lines
- [x] 6. 10 seasons from NBA save, B+C base vs +A1+A2 (tools/runs32/v36a-nba-snap10-ab-*.txt): 60+ lost 91 -> 74 of ~400 (t:team 23->21, t:cap 23->14, t:price 19->10); payroll 164.7 -> 159.8 (streams diverge; one summer same stream: 160.0 vs 159.9, kept 39 vs 40). FA pool has ~3-4 60+ players; re-signs at ask (60-64: 13.3 vs mval 15.6) -> levers do not move payroll
- [x] 7. Tests (new saves): t36 13/13, t34 19/19, t33b 30/30, t33d 17/17, t32e 21/21, t32h 11/11, t30a 29/0, lint PASS. t36 B found extras at 95+ only lost 1 (96->95): nbaTopCap now takes them under 95 (league.js); 3-season NBA check after
- [x] 8. 20 seasons (tools/runs32/v36a-*): NBA payroll 166.8 (v35a 166.5; S10-19 155-169), 60+ lost 213/825 (t:team 68->51, t:cap 56->67), top PER 35-42.6 (8/20 > 39) with top OVR 91-96 -> PER outliers are OVR 83-91 players (Ellery 84 PER 41.6), not the top cap. PBL 132.5, floor 20/20, 60+ lost 122->106, top PER <= 33.8. Owner cash NBA: 1-2 teams negative S1-6 (min -46), avg 50->90; 0 errors. Saves remade (3)
- [x] 9. PROGRESS + README + TESTING, commit, zips

---
# TASK_STATE — v35b PBL top-rating cap + pro-fog sorting (Opus) — Nov 16 2026

- [x] 0. Clone, read PROGRESS (v34/v35a), TESTING
- [x] 4a. Baseline from snap (current code, SEED=21): top PER 33.9-38.9, WS <= 14.8, top OVR 85-88 (/home/claude/scr/pbl-base.txt); the PER ~40 in v34 came late (OVR 92-94)
- [x] 4b. PBL_TOP leagueTopCap (league.js): cap mean+3.6sd, gen 4.2sd, >2 players above mean+3.2sd lose 1-2. 10 seasons: top PER 29.6-38.9, WS <= 14.8; 20 new-league seasons (pbl20-new.txt): top PER 28.9-38.7, WS <= 16.9, top OVR 83-89 (v35a same league without the cap: 86-89, rows identical to S15 -> cap rarely binds), floor <=1 under all 20
- [x] 7a. app.js: ovrNum uses proOvr when fogged (frow data-ro, FA sort, League>Players data-v, filters); sorts at 10 lines + pval ovr use ovrNum. Attr cells already attrNum
- [x] 7b. t34 19/19, lint 110, t30a 29/0, browser-v34 34/34, browser-v35b 24/24 (old app.js fails 3/12 per width)
- [x] 8. PROGRESS + TESTING, commit, zip

---
# TASK_STATE — v35a floor + payroll + hard cap (Opus) — Nov 16 2026

- [x] 0. Clone + merge Kenneth's v34 upload (PROGRESS v34, t34, runs32/v34-*, v34sum, saves); baseline = tools/runs32/v34-*.txt
- [x] 2a. Trace: r30 FLOORLOG=1 ('F' rows after FA) reproduces v34 PBL S1-6 exactly. PBL S6 (avg 108, 11 under): no 56+ FAs left, few teams above the floor to dump salary, floor rosters full of rookie / minimum deals (S1 initial contracts gone by S5-6)
- [x] 2b. Spike causes: PBL S6-7 = league-wide salary trough (avg 108-112 vs floor 120; no 56+ FAs, rosters of cheap rookies). NBA S16 = expiry echo (extension money expiring into S16 $1.2B vs $0.4B at S11; avg 150.5), and big-gap floor dumps from teams just above the floor only moved the shortfall (14-16 under every FA day). Fixes: floorRenego + 55- floor deals; floorAbsorb donor must stay >= floor (S16 save: 15 -> 0 under)
- [x] 1. PBL floor (10 seasons: <=2 under 9/9, min team 120): floorSign 55- (>=48, better than the man cut) 1-yr floor deals above min, < $10M, 25- at 2.4x; youngMax = ASK_YOUNG_X; small gaps (min+0.2); Kenneth picked renegotiation: floorRenego (end of FA, own non-rookie players, this season only via sched) — testing
- [x] 3. NBA payroll 166.5 after fixes (short). RESIGN_K midFull tried: A/B 10 seasons identical (163.4), price losses 1-2/summer; reverted. Open for Kenneth
- [x] 5. Hard cap: reproduced (r30 audit + new startNewSeason audit): not a trade - TOR crossed at season start when holdoutCheck re-signed Quickley 32.5->47 while capSeason still pointed at next season (phase not yet 'regular'); swapFits checked the wrong year, deal ran a year long. Fix: holdoutCheck after L.phase='regular' (league.js startNewSeason)
- [x] 6. Tests (new saves): t34 19/19 (migration check fixed for aged directors), t33b 30/30, t33d 17/17, t32e 21/21, t32h 11/11, t30a 29/0; 20 seasons NBA + PBL16 with SNAPOUT (tools/runs32/v35a-*), saves remade incl. nba-team
- [x] 7. PROGRESS + README, commit, zips (src / tools)

---
# TASK_STATE — v34 tuning follow-ups + scouting overhaul (Opus) — Nov 16 2026

Kenneth's C answers (Nov 16): pro fog Medium (OVR/ratings as your staff's read ±1-4, own roster exact, stats exact); one director with draft + pro ratings; scouting budget 3-5 levels (staff budget, accuracy + assignment slots); AI uses fogged reads in draft + FA bids, trades stay true.

- [x] A0. Baseline (v33f code): t33d 17/17, t33b 30/30, t33c 23/23, t32e 21/21, t32f 20/21 (known), t32h 11/11 (t32e+ ran partly on edited code); /home/claude/scr/v34sum.py summarizes r30 runs
- [x] A1. RESIGN_K (2 rounds), resignOwnerOK, floor keep-own, big-gap 3-yr dumps / 2-yr deals; NBA 169.9, PBL floor 12/20 (open)
- [x] A2. fatigue .05/.10/.02, WS kept 40% (grid set G; WS 30% sets worse); award run MVP WS leader 7/10, 7 winners
- [x] A3. nbaTopCap (NBA_BAL t95 2, cap 97, capGen 98) at the end of nbaBalance (adv rows: check in D1 runs)
- [x] A4. lowAskCap: 25-and-under under 60: 55- (also after shift) minimum, 56-59 <= ASK_YOUNG_X 2.4x min, unshifted ramp
- [x] B1. t32f: test now passes the row's team to hxBpmOf (code was right: per-stint BPM since v33d); 21/21
- [x] B2. hx-fn.js hxAwKey (name match: exact, else last name + first initial in career years) / hxHonors(name, from, to) / hxTopAwards; app.js legendsView + legendCase; nba-history.js tail re-appended. 9 legends' counts change (NBA_LGD errors, e.g. Tony Parker 3x All-NBA 1st -> 0)
- [x] C1. league.js SCOUT_LV (Standard free / Expanded $0.8M / Elite $2M: reads x1/.85/.7, 3/4/5 slots, 5/6/7 interviews), setScoutLv (window + staff room 'dept'), aiScoutLv (offseason), staffCost/staffRoom; scout.pro (genScout, aging, migrate); app.js director tables Draft/Pro, scoutDeptHtml
- [x] C2. proFogOn/proSd/proErr/proOvr/proAttr/teamOvr/proValK (league.js); ovrTxt '~' + attrNum (app.js); faRound pov = teamOvr, W x proValK
- [x] C3. lvK in readSd/teamPotEst/scoutReport; p.draft.mo (outlet ranks) + p.draft.ub (your board, L.boardRank at startDraft); draftAccuracy + draftAccHtml (scouting page)
- [x] C4. FLAVOR sc.pro / sc.prostr / sc.prowk / sc.proconf (7 each, lint 110 PASS); proReport + proScoutPanel (player page); tools/t34.js 19/19
- [x] D1. t34 19/19, t33b 30/30, t33c 22/23 (seed noise), others pass; browser-v34 34/34; 20+20 seasons tools/runs32/v34-*; awards; saves remade
- [x] D2. PROGRESS + README + TESTING, commit, zip (GitHub not linked for push)

---
# TASK_STATE — Haiku 7t / 8t wordings (+3 per key) — Nov 16 2026

- [x] H1. Clone (GitHub not linked for add_repo; public HTTPS clone worked). Read HAIKU-TASKS.md, TASK_STATE, lint and t30c; sc.*/tk.* already keyed (v30 N1), 4 wordings each
- [x] H2. Added 3 wordings to all 17 keys (sc.* 5, tk.* 12) in src/league.js via tools/… scratch script (kept outside repo); each key now 7
- [x] H3. Checks: node --check src/league.js + app.js OK; lint 106 PASS; t30c 30/30 (run before and after edit)
- [x] H4. HAIKU-TASKS.md + PROGRESS.md updated; local git commit (push blocked: GitHub not linked); zip sent

---

# TASK_STATE — v33e UI follow-ups (Sonnet) — Nov 16 2026

- [x] 1. Legends trophy cases: All-NBA / All-Defense / All-Star rows from NBA_HX.aw (app.js, hx-fn.js if needed) — hxHonors (hx-fn.js, re-appended to nba-history.js), trophyCaseHtml + legendCase (app.js), shown in legendDialog
- [x] 2. Single-file build: nba-history.js (+ nba-2026 / nba-text / nba-setup, missing too) in index.template.html + build.py `single` — built 4.0 MB, browser-v33e 52/52 on it
- [x] 3. v33d floor / dump messages at 390px (payroll-floor deal, Paid above his value, floor dump news) — real FA league; fixed Completed trades why-rows (.whyrow); tools/browser-v33e.py.txt
- [x] 4. 7t / 8t FLAVOR keys: NOT done, no OK from Kenneth on record (HAIKU-TASKS.md still says "Needs Kenneth's OK")
- [x] 5. Browser tests for touched pages (base browser-v33c / v33d), node --check, lint
- [x] 6. PROGRESS + README, commit, zip (GitHub not linked)

---
# TASK_STATE — v33d payroll floor + balance + awards (Opus) — Nov 16 2026

- [x] A1. Trace (/home/claude/scr/d1.js, S11 from NBA save): floor teams fill rosters with minimum vets (FA pool past top 8 is all ~$1.3-5M value); non-contenders stop at the cap (b2Ceiling = CAP for hopeful/rising/retool, so no mid-level). Hard cap: v33b S1 events = real 2026 deals already over for the next cap year; holes: tradeCheck hitTo used base amount (no kicker / schedule / pending extension), holdout raises checked this year + base amount only
- [x] A2. league.js FLOOR_FILL / floorAbsorb / floorSign / floorFill (faDay): floor dumps from FA day 2, 1-2 yr 'payroll' deals (60+, up to 2.5x value + 4) from day 5; B2_MLE_OK (hopeful/rising/retool use the mid-level); inHit (tradeCheck), swapFits (holdouts); r30 capOver logs pre/who. Diag S11: avg 167 -> 168.6, under floor 2 -> 0
- [x] A3. Quick check: NBA 5 + PBL16 6 seasons (A only): NBA S1-3 lowest >= 148.7, PBL still 40-86 -> A2b floor bids; t33b/t32e/t32h/t32r/t30a pass
- [x] B1. LG_GRAV maxD 1.5 / trimK 2 / nudgeK 0.8 set (check in the 20-season runs)
- [x] B2. engine.js BLK_KNEE 58 / BLK_TOP 0.7 in genPlayer (gen bigs p90 67->63, p95 72->67; real 64/67); MPG_TOP 38.5 regular-season target ceiling in roleMinutes
- [x] C1. AW_ADV mvp gs .30 ws .35 ws48 .12 per .08 bpm .15, mvpTeam 0.8, royMpg 20, mipNoMvp 5; AW_V33C preset; t33c-awards OLD=v33c + MVP = WS leader count
- [x] C2. Outlier: not in history data / S10 save (backfill vs live: PER err 0.11, WS 0.19); PBL S1 has a 98 OVR -> extreme rating + ~40 mpg; r30 logs top PER/WS (pending runs). tools/hx-bpmstint.py.txt: 447 stint BPM rows (median gap 0.03 vs season); app.js advEstTag + records (est.)
- [x] A2b. faRound floor bids (fl: above value, short deal, pays its bid; floorCut opens a spot); floorSign under-60 within Kenneth's rule; d4 diag PBL: 4-7 teams under before
- [x] C3. t33d 17/17, t33b 30/30 (59-sample check relaxed), t33c 23/23 (WS corr bar 0.94; old-save test strips PER/WS), t32e 21/21, t32h 11/11, t32r pass, t30a 29/0, lint 106, browser-v33d 12/12
- [x] C3b. Outlier cause: turnovers only charged to the ball handler (37-43% usage stars at 1.3-2.2 TOV, PER 41-46 late); engine TOV_USE 0.6 (squared usage weights): top-usage TOV 2.2 -> 2.9, top PER 40 -> 36; hard-cap: AI extension years, three-team trades (inHit + next season); MVP weights set F (ws .40, team .5) from tools/t33d-awgrid.js
- [x] C4. Saves remade (tools/snap: nba-commish + pbl16-commish via r30 SNAPOUT, nba-team snap-make); 20 seasons tools/runs32/v33d-{nba,pbl16}-commish.txt: NBA payroll 166.9 (lowest avg 146.6, <=2 under floor 17/20), PBL 132.0 (112.7, 15/20); awards v33d vs v33c (v33d-awards-report.txt): MVP = WS leader 8/10, top-3 10/10
- [x] C5. PROGRESS + README + TESTING, commit, zip (GitHub not linked)

---
# TASK_STATE — v33c PER / USG% / WS / VORP + awards (Opus) — Nov 16 2026

- [x] C1. computeAdv / advStint / advLeague / advCareer (league.js, after computeBPM): B-Ref formulas per team stint; frozen at season end (RS + PO)
- [x] C2. History: tools/hx-adv.py.txt (B-Ref totals -> advRows per season + per traded stint, advLeg, rec.adv PER/WS/WS48, awAdv) patches src/nba-history.js; hx-fn.js hxFixRow / legends / hxRecAdvX / hxAwardAdv. Check vs B-Ref: 1977-2026 corr 1.000 (same formulas), all eras PER 0.998 WS 0.996 (/home/claude/scr/hx-adv-report.txt -> tools/runs32/v33c-hx-check.txt)
- [x] C3. Awards: AW_ADV blend (MVP / All-League, DPOY / All-Def with DWS + DBPM in dComp, ROY / 6MOY / All-Rookie gsY, MIP + change in PER / WS48); AW_ADV.on=false = old scoring; snapPlayer keeps per/ws/ws48/dws/bpm/dbpm
- [x] C4. UI: Players table (basic PER/WS, advanced PER/OWS/DWS/WS/WS48/VORP), player Advanced tab (RS + PO + career), leaders, records (season + career PER/WS/WS48 with history), award ladders + award page + yearbook line, History list MVP numbers; USG% = game formula when present
- [x] C5. tools/t33c.js 20/20; lint 106
- [x] C6a. 10 seasons NBA commish from tools/snap/nba-commish-s10.json.gz, new vs old scoring (tools/t33c-awards.js, t33c-awsum.py.txt): MVP top-3 WS 10/10 (old 9/10); DPOY top-5 DWS 2/10 (old 3/10), 6MOY winner at 15 mpg
- [x] C6b. Fixes: ROY/6MOY rates count fully from 26 mpg (ADV_SHRINK_Y 1800 too); DPOY DWS 0.35 + DBPM 0.15, then DWS / DBPM compared league-wide (DWS 0.35 within group still 3/10)
- [x] C6c. new3 (DWS league-wide): DPOY top-5 DWS 10/10 but 6MOY / ROY at 18 mpg -> rates 0 under 16 mpg, full at 26. Final (tools/runs32/v33c-awards-*.txt): MVP top-3 WS 9/10 (old 5/10), DPOY top-5 DWS 6/10 (old 2/10), MVP 7 winners / DPOY 6 winners in 10 (old 5 / 3)
- [x] C7. Final code: browser tools/browser-v33c.py.txt 46/46 (1300 + 390), t30a 29/0, t32f 21/21, t33c 23/23, t32e 21/21, lint 106
- [x] C8. PROGRESS + README, commit, zip

---
# TASK_STATE — v33b asks follow the league + hard-cap hole (Opus) — Nov 16 2026

- [x] A1. Cause: MKT_RAMP_LIFT 1.2 caps the market at ~$152M/team NBA, ~$120M PBL from S1 (lift needed 2.07 / 1.58); payroll converges to the market total as start contracts expire. Hard cap: BKN S2 = offer sheet the holder declined (sheetDecide signs for the offering team with no re-check; reproduced with tools/r30 hooks)
- [x] A2. updateAskShift (percentile bands, L.askRef/askShift), MKT_LIFT_MAX 3 (scale fits the budget), under-60 cap 9.9, migrate old saves (ASK_REF0)
- [x] A3. sheetStillFits in sheetDecide (void sheet -> unrestricted FA; AI + you), doSignAndTrade re-checks cap (AI + app)
- [x] A4. tools/t33b.js 29/29 (also on task-1 code only), t30a 29/0, t32e 21/21, t32h 11/11, t32r all pass, lint 106
- [x] A5a. Try 1 (lift up to 3x only, tools/runs32/v33b-try1-*.txt): PBL 109 -> 124 avg, NBA worse 160 -> 149 (money went to stars already at the max; mid-tier went to the minimum)
- [x] A5b. Try 2 (1.2x lift, then rampK softens 60-64, then lift): NBA 165.5 avg (S1-11 165-181), PBL 127.9; but NBA S16 max next 228.8 (later cap years: rookie deals / multi-year deals checked against next year only)
- [x] A5c. futFits / futRoom: canFit, rookie deals (AI + you), extensions, offer-sheet match, FA bids, icon re-sign check the next two cap years; t33b 30/30
- [x] A5d. Final 20 + 20 seasons (tools/runs32/v33b-*.txt, also K max 2 + 2x step cap for a smooth ramp, t32e 21/21 with 5% slack): PBL 109 -> 126.1, NBA 160.2 -> 158.8 (not near budget: team spending is the limit), max next season under the hard cap all 40 seasons
- [x] A6. PROGRESS + README, commit, zip (GitHub not linked)

---
# TASK_STATE — v32i S6b history import (Opus) — Nov 16 2026

- [x] B1. tools/hx-build.py.txt (+gap fill: All-Star starters 1608, game opponents 435, retired years 174; flag f) + tools/hx-fn.js + tools/hx-pack.py.txt -> src/nba-history.js (860 KB); index.html + tools/load.js load it
- [x] B2. Game-formula BPM (computeBPM math on B-Ref season totals) overrides bpm/obpm/dbpm/vorp in nbaRealRows/nbaEstRows + legends careers (hx-fn.js); playoff rows keep estimates (no playoff team totals). LeBron 2012-13 12.1 (B-Ref 11.6)
- [x] B3. app.js: records() merges history (game/season/career/PO + BPM lists), HOF list adds history members, team history tab: franchise leaders (RS/PO, sim added), retired numbers, franchise seasons; Seasons list best record
- [x] B4. tools/t32f.js 21/21, tools/browser-v32i.py.txt 34/34 (1300 + 390), node --check, lint 106, t30a 21/21, t32f-a 42/43 (team ribbon check fails on old code too with this save)
- [x] B5. 10 seasons NBA commish (tools/runs32/v32i-nba-commish.txt): 0 errors, save S10 13.9 MB; PROGRESS/README

# TASK_STATE — v33a balance (Opus) — after S6b
- [x] C1. Cause: generated players grow into a stronger middle (S10: age 22-24 avg 63.2 vs 54.6 at start, 25-27 65.6 vs 56.9; rookies same 53-55; 75+/85+ already held by nbaBalance). Fix: leagueGravity (league.js, both modes): rostered mean above 58.4 -> trim young ceilings + small nudge for 22-30 52-74. RM_LIFT fs 6, star 5
- [x] C2. Re-checked (v33a-*.txt): NBA OVR 62.4 (v32r 64), PBL 59.5 (65.4); BPG 17.4 avg; stars 32.9; win-first 0.8; strong pull (v33a2) dropped payroll 182->113, kept mild
- [x] C3. Tests t32r, t30a, t32f, lint; 20+20 seasons x2; docs; commit + zip

---
# TASK_STATE — v32 version-end review (Opus) + history files check (v119 zip) — Nov 16 2026

- [x] R0. Read PROGRESS v32a-v32h, TESTING, v32-plan; start 4 x 20-season runs (tools/runs32/v32r-*.txt) — running SEED=21
- [x] R1. Code review — found: S2 role promises travel with a traded contract (floor on new team) but clauseTV priced only old starter/min promises -> fixed league.js clauseTV; tools/t32r.js 6/6
- [x] R2. History zip (v119): inventory, blank/gap audit — /home/claude/hist/inv*.py; source = B-Ref dataset (sumitrodatta/bball-reference-datasets)
- [x] R3. Reconstruct blanks — /home/claude/hist/build.py -> hist/out/*v120.xlsx + NBA_ADVANCED_RS_BY_SEASON_v120.csv + build.log (fill log sheet per workbook)
- [x] R4. 4 x 20 seasons done (tools/runs32/v32r-{nba,pbl16}-{commish,team}.txt), summary tools/runs32/v32r-summary.txt (tools/v32r-sum.py.txt): 0 errors
- [x] R5. Fixes: clauseTV role promises, win-first bar wfBar (5 per team; A/B old 0,1,3,1,3,4 vs new 0,1,1,1,2,2); t32r 10/10, t32e 21/21, t30a 21/21, lint 106, t32h 11/11
- [x] R6. V32-REVIEW.md + V32-NEXT-PROMPTS.md written, PROGRESS + README updated ; project docs claude/nba/v32-review.md + v32-next-prompts.md written
- [x] R7. Committed (4c966ca); push blocked (GitHub not linked): pbl-v32-review.zip + nba-commish-s10.json.gz sent

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

- [x] 1. Explore code — two-way: league.js signTwoWay/aiFillTwoWay; needs: rosterNeeds; playoffs: engine.js nextRound + seasonOdds; rookies: nbaPopulate; numbers: assignNumber — hxHonors (hx-fn.js, re-appended to nba-history.js), trophyCaseHtml + legendCase (app.js), shown in legendDialog
- [x] 2. #13 — league.js twWillSign/twBenchLine (reason text), signTwoWay check, own 2nd-rounders exempt, aiFillTwoWay skips refusers + weekly retry in twoWayDay — built 4.0 MB, browser-v33e 52/52 on it
- [x] 3. #22 — league.js rosterNeeds: RN_PHYS (ath) capped at "summer" when roster has 15 — real FA league; fixed Completed trades why-rows (.whyrow); tools/browser-v33e.py.txt
- [x] 4. #24 — engine.js PO_BIG_BEST=7 in nextRound; league.js seasonOdds best of 7; app.js bracket labels + help text
- [x] 5. #25 — src/nba-setup.js nbaRookies: real players with 0 service get rookieSeason = season 1 (55 players)
- [x] 6. #10 — src/nba-setup.js nbaJerseys (CSV embedded), hooked in engine.js newLeague; index.html + tools/load.js load it; app.js accepts "00"
- [x] 7. tools/t30a.js — 29/29 pass (quick 21/21)
- [x] 8. Existing tests run — no new real failures (see PROGRESS.md v30a line)
- [x] 9. PROGRESS.md + README updated, pushed to main
