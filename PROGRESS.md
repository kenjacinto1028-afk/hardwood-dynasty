# PBL progress

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
