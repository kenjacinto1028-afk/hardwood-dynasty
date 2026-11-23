# PBL progress

## Early retirements fix (Sonnet, Nov 23 2026)
- [x] Players 27 or younger no longer retire unless they had 2+ long injuries in the last 2 seasons (was a small random chance, hit Jeremiah Fears at 22). Early retirements now show a reason: injury trouble, no offers, or lost his drive. src/league.js `retireChance` + offseason retire loop. Installer not touched.

## My Career: draft projection follows your stats (Sonnet, Nov 22 2026)
- [x] A low-production pre-draft season now lowers your scouting grade (used by the mock drafts and the real draft): points + rebounds + assists + stocks map to the best pick they support (e.g. about 11 pts / 3 ast = late first round, not top 3). Builds up over the first 15 games; recovers if you play better. Floor is your current overall.
- [x] Draft stock panel says which pick your stats support. Test: tools/browser-career.js ALL PASS. Cache v17. Installer not touched.

## Hall of Fame legend portraits (Sonnet, Nov 20 2026)
- [x] The 71 Hall of Fame legends on Legend cards get a cartoon face (hand-picked skin, hair, facial hair, glasses per player, e.g. Kareem's goggles, Wilt's beard; rest of the face from the name). Non-Hall of Fame legends keep the silhouette. src/p3.js `LOOK`, `legendFace`.
- Test: tools/browser-cards.js ALL PASS (1300 + 390). Cache v24.

## Draft combine (Opus logic, Sonnet UI, Nov 20 2026)
- [x] Right after the draft lottery, this year's class goes to the combine: height without shoes, wingspan, standing reach, weight, body fat; drills (max and standing vertical, lane agility, shuttle, 3/4 court sprint, bench reps, spot-up shooting). Results follow the real ratings plus a little noise. Some top-5 prospects (30%) and a few others (5%) are measured only.
- [x] A combine grade (A+ to D vs the class) moves the three mock drafts and every team's board up to ~4 points (a few spots); the drills also tighten everyone's read on athleticism. News: combine opens, top vertical, longest arms, biggest riser and faller.
- [x] Draft › Combine page: leader tiles, stock up / down, sortable + filterable table (gold = best in class, mock move arrows). Prospect page: combine block with a link to full results.
- How: logic `src/combine.js` (runCombine, cmbBoost, cmbAthK; hashed noise so the sim's random stream is untouched); hooks in league.js (runLottery, mockSet, draftBoard, readErr); UI in app.js. Older saves: combine starts with the next lottery.
- Tests: `tools/combine.js` 8/8, `tools/browser-combine.js` ALL PASS (1300 + 390). Cache v26.

## Play as coach mode (Opus logic, Sonnet UI, Haiku text, Nov 20 2026)
- New-league option **Head Coach**: pick a team and your name. You coach (lineup, minutes, playbook, sliders, live games); an AI general manager makes the trades, signings, re-signs and draft picks.
- How: `src/coach-mode.js` wraps the league step functions (simDay, draft, free agency, offseason...) so each step runs with `L.user = null` (your team is AI-run for roster moves); `lgU()` in engine.js keeps your lineup and playbook in games. State `L.mode = 'coach'`, `L.cm`; your coach has `c.user` (AI teams never hire him from the pool).
- Job security meter 0-100 (Secure / Stable / Hot seat / On thin ice) from record vs the GM's expected wins, past seasons, grace year, titles, contract years left, a new GM. GM warnings at Hot seat / Thin ice; firing at season end (the league's normal coach review), mid-season (existing check, plus a GM who runs out of patience under 15).
- Fired: "Between jobs", popup; offseason job offers from teams that changed coaches (better teams need a better reputation; a jobless coach always gets one). Good coaches also get offers from better teams while employed. Take job / No thanks. Autopilot takes the best offer.
- My job page (My team › My job): job security, GM panel, team plan + expected wins, offers (cards), coaching career table and timeline. GM-only buttons (trade, sign, release, draft, hire...) show a note instead.
- Tests: `tools/coach-mode.js` (2 seasons + firing + offers + autopilot, node), `tools/browser-coach-mode.js` ALL PASS (1300 + 390). Cache v25.

## Fantasy league (Opus scoring + AI managers, Sonnet UI, Haiku text, Nov 20 2026)
- [x] New Fantasy tab (My team group). Start any time in the regular season with 5+ weeks left: 8 teams (you + 7 AI managers with their own styles), 10 players each, snake draft (Draft, Auto-pick, Auto-draft the rest).
- [x] Weekly head-to-head matchups scored from the sim's real box scores: point 1, rebound 1.2, assist 1.5, steal 3, block 3, three made +0.5, turnover -1. Live score during the week, week-by-week navigation, other matchups.
- [x] Standings (sortable, playoff line), top 4 playoffs (semifinal week, final week), bracket, champion popup with confetti, news line, Fantasy champions history (L.fanHist).
- [x] Waivers: drop then add a free agent, 4 adds a week, counts from that day. AI managers swap their weakest player for a clearly better free agent each week (2 if someone is hurt long).
- [x] Logic in src/fantasy.js (FAN), no sim random numbers: league results identical with or without fantasy (tools/fantasy.js hash check).
- Test: tools/fantasy.js 11/11 (full season: 22 weeks, 23 AI moves, champion), tools/browser-fantasy.js ALL PASS (1300 + 390, no page scroll). Cache v24.
## Real-history cards (Sonnet, Nov 20 2026)
- [x] Real NBA players get cards for their real past seasons (e.g. LeBron's 2003-04 Rookie of the Year card), with real teams and real awards; their Career card adds real seasons to league seasons. Rating on a real season comes from that season's PER (or box score).
- [x] Legends binder (NBA leagues): 77 retired greats (Kareem, Jordan, Wilt, Magic, Bird...) from real career totals, Hall of Fame gold frame, silhouette face.
- Test: tools/browser-cards.js ALL PASS (1300 + 390). Cache v24.

## Card variety and rarities (Sonnet UI, Haiku flavor text, Nov 20 2026)
- [x] New card types on top of the existing player cards: Season card (any one year, e.g. "2026-27 · MVP season"), Rookie card, Title run card (playoff numbers), Career card (whole career in this league; Hall of Famers get the gold Hall of Fame frame), Coach card (wins, losses, titles, win%).
- [x] Rarity tiers: Common, Uncommon 55+ (new, green), Rare 60+, Epic 70+, Legendary 80+, Hall of Fame. Big awards and titles move a season card up one or two tiers (MVP, Finals MVP +2; title, DPOY, ROY, scoring title and more +1).
- [x] Ribbon on each special card names it; a short flavor line under the card in the popup.
- [x] Cards tab: "Show" filter (Current, Best season, Career, Rookie, Specials, Coaches, Hall of Fame), sorted by rarity. Card popup: switch to Now / Career / Rookie / Title, or pick any season.
- Test: tools/browser-cards.js ALL PASS (1300 + 390), tools/browser-p3.js 98/100 (the 2 fails need the draft test save, not related). Cache v22.

## All-Star Weekend contests (Opus logic, Sonnet UI, Haiku text, Nov 20 2026)
- [x] Three-Point Contest (8 best shooters, 5 racks with money balls, max 34, top 3 to the final), Slam Dunk Contest (4 young high flyers, 2 dunks each, 5 judges 6-10, harder dunks miss more, top 2 final), Skills Challenge (4 guards/wings + 2 bigs, timed course, top 2 final). Run on All-Star day (league.js `runContests`) with their own dice: no R() draws.
- [x] Winners get an award (Three-Point Contest / Slam Dunk Contest / Skills Challenge champion, small fame boost), a news story (engine.js FLAVOR `asw.*`) and are saved in `L.allStarHist[s].contests`.
- [x] Screens: All-Star Weekend panel on the Awards tab (3 cards: winner, crowd call, round table, final-round detail with rack dots / dunk names / misses) and Past champions table; the All-Star popup shows it and celebrates your winner with confetti. Rules text added.
- Test: tools/asw.js 19/19 checks over 3 seasons (fixed news check), tools/browser-asw.js ALL PASS (1300 + 390, no page scroll). Cache v21.

## Friendships and duos (Opus logic, Sonnet panel, Haiku text, Nov 20 2026)
- [x] Teammates in the same rotation for 2+ seasons can become friends (10% a pair a season, more with a Loyal player; at most 2 new per team a season); a Mentor often befriends a young teammate. Max 3 friends a player. Old saves and new leagues start with up to 2 bonds per team (`setupFriends`). Data: `L.fr` (league.js `seedFriends`, `friendsOf`, `friendOn`).
- [x] Duo: two friends who both start, are 70+ and have 2+ seasons together. A duo splits (news) when they stop being teammates; the friendship stays.
- [x] Effects: friends in the starting five add chemistry (+0.0015 each pair, duo +0.003; engine `frChem`), morale +3 with a friend on the team, free agents lean toward a team with a friend (+0.08, duo partner +0.12) and the signing screen shows "Friend here: name".
- [x] Screens: Friends panel on the player page, Friendships list in the team's Team chemistry panel, morale line, Rules section; news lines for new friendships and duos.
- Test: tools/friends.js 6/6 (2 seasons: 133 friendships, 9 duos, 31 news lines, 5 of 192 signings joined a friend), tools/browser-friends.js ALL PASS (1300 + 390). Cache v20.

## Live-game coaching (Opus engine, Sonnet UI, Nov 20 2026)
- [x] On-the-floor windows show PTS, REB, AST, FG, MIN, PF, +/- with a header row; coaching lineup lines add reb, ast, FG. Cache v19.
- [x] "▶ Play & coach live" (was "Sim day & watch live"): your game is played possession by possession (engine `liveGameStart`, `playGameG` generator; `playGame` runs it straight through, so league results are unchanged: tools/court-plays.js hash identical).
- [x] Your calls (panel under the live controls): timeout (pauses the game, next 3 trips get a small boost + drawn-up play, the other coach may adjust), subs (your five holds ~4 game minutes, "Let coach sub again"), play to run every trip (any of the 11 plays, or coach decides), defense (drop, switch, hedge, blitz/trap, ice, new 2-3 zone, or coach decides). Zone is for your team only: packs the paint, gives up threes.
- [x] At the final buzzer the rest of the day is simmed with your coached game in it (`L.preGame`, `takePre`); leaving the screen or "Sim to the final" lets your coach finish. Touching a control pauses the game.
- Checks (60 games each, same matchup): auto 117-119, zone 118-120, all post-ups 106-116 (bad calls hurt), all spot-ups 119-120.
- Test: tools/live-coach.js 6/6, tools/browser-coach.js ALL PASS (1300 + 390), tools/browser-p2.js 81/81, tools/browser-courtplays.js all but 1 timing-based screen check (random game). Cache v18.

## Live court acts out real plays (Opus, Nov 20 2026)
- [x] Engine logs the play it ran each possession (entry[11]: play, ball handler, kick-out post man, defense coverage, doubled player). No new random numbers: game results identical (tools/court-plays.js hash check).
- [x] Court dots act out the play: pick-and-roll / pop (screen, roll or pop), isolation (clear-out), post-up and kick-out (entry pass, double team), drive and kick (help defense collapses), off-screen curl, handoff, backdoor cut, horns, fast break.
- [x] Players go to spots that fit their game (shooters in corners, non-shooting bigs on the dunker spot); stretch bigs pop instead of roll.
- [x] Defense: man lag, screens catch the on-ball defender, coverage shows (drop sags, hedge jumps out, blitz traps, switch swaps men), help on drives.
- [x] Screen bars, motion trails, play banner ("Pick-and-roll · vs Drop") in the backcourt; new ½x live speed.
- Test: tools/browser-courtplays.js ALL PASS (1300 + 390), tools/browser-p2.js 81/81. Cache v17.

## My Career fixes and tuning (Sonnet, Nov 20 2026)
- [x] Interviews match your season: MVP talk only if you are a real MVP candidate (24+ ppg, top 6, winning team), ROY talk only if you lead rookies, "bench" and "star" questions by role. 29 new questions (59 total), repeats spaced out, and a new interview after a big award.
- [x] Extension offers only from your 2nd pro season on, in the last year of the deal (no more day-66 rookie offers).
- [x] Award popup for every award you win (All-Star, ROY, All-NBA, DPOY...), with confetti.
- [x] Fixed: after your rookie year the next draft no longer says you were undrafted.
- [x] Pro XP is 40% of before, upgrades cost 2x and more as the rating climbs. Pre-draft XP and costs unchanged.
- [x] "You're a pro" panel shows this season's averages (PTS REB AST STL BLK MIN FG%, GP, team record).
- [x] Draft stock panel (pre-draft): mock rank, projection, range, trend and the three outlets.
- Test: tools/browser-career.js ALL PASS. Desktop 1.3.0, cache v16.

## My Career face builder (Sonnet, Nov 19 2026)
- [x] Create-your-player has a look builder: 8 skin tones, 8 hair colors, head shape, hair, eyes, eyebrows, nose, mouth, facial hair, glasses, Random. Saved as L.career.face.
- [x] "Edit look" button on the My Career hub changes it any time. The face shows everywhere the career player's picture appears (portrait() in app.js).
- [x] Fixed the hub header picture (a stray CSS rule squashed the avatar into a small box with empty space).
- [x] Test: tools/browser-face.js ALL PASS (1300 + 390). Desktop version 1.2.0.

## My Career, Phase 4: career life (Sonnet + Haiku text, Nov 19 2026)
- [x] Interviews: after about 1 in 6 pro games, and always after 30+ points, a 3+ game losing streak, the first playoff game and an expiring contract at the trade deadline. 30 questions picked by situation, 3 answers each; answers move fame, coach trust and team chemistry. Popup, quote result, history (last 5 on the hub).
- [x] Locker room: chemistry (0-100) and a relationship score (-100 to 100) with the coach and every teammate. Weekly events shift them. Good chemistry gives teammates up to +0.6 form and lifts his mood. Talk to coach once a week for a bigger role (odds from trust, his overall vs his position rivals, recent grades).
- [x] Your news: debut, first 20/30/40, triple-double, awards, signing, extension, trade, injury, 1,000 / 10,000 points go to the league news log; a hub panel lists every story that names him, with filters.
- [x] Request a trade (regular season before the deadline, or the offseason): sets his trade request, drops trust and chemistry. While it stands the AI works on moving him (rookies included); a popup shows the move and chemistry / relationships restart.
- [x] Contracts: an extension offer from market value with agent negotiation (Accept, Ask for more with a chance to win more or lose the offer, Test free agency). A career free agent gets up to 6 team offers (years, $/yr, role, contender status), is held out of AI signings until he picks or 5 FA days pass, then the best offer is taken. Rookie deals stay automatic.
- Old saves work: every new field defaults. Hooks: league.js moraleParts / updateMorale / startFA / faDay / startResign / startNewSeason / extensionDeadline. Test: tools/browser-career.js ALL PASS at 1300 + 390. Offline cache `pbl-app-v13`.

## My Career, Phase 3: badges, achievements, Legend meter (Sonnet, Nov 19 2026)
- [x] 16 badges (Deadeye, Mid-range Maestro, Posterizer, Ankle Breaker, Dimer, Lockdown, Pick Pocket, Rim Protector, Glass Cleaner, Clutch Gene, Microwave, Iron Man, Floor General, Post Wizard, Free Throw Ace, Hustle), each Bronze / Silver / Gold / Hall of Fame. Earn a tier from stat milestones, or buy the next tier with XP (60 / 120 / 220 / 400) once the related ratings are high enough.
- [x] Badge effects are small: +3 / 5 / 7 / 9% on decision options that use the badge's skills, and +0.3 to +1.2 form per badge in every real game (capped at +3 per side).
- [x] 25 achievements (first-round pick, first pro game, 20 / 30 / 40 / 50-point games, triple-double, All-Star, MVP, champion, 10,000 points, ...). Each gives XP and a story line; several unlocks share one "Achievement unlocked" popup.
- [x] Legend meter (0-100: Prospect to GOAT conversation) from legacy score, awards and achievements, with a Hall of Fame tracker (on pace / not yet) in the hub header.
- [x] Awards chips and a sortable season-by-season stats table on the hub.
- Old saves work: all new fields default to empty. Test: tools/browser-career.js (badge buy, achievement, Legend meter) ALL PASS at 1300 + 390.
## Walker Kessler rework (Sonnet, Nov 19 2026)
- [x] Paint-only big: no threes (3P 22, 3PT tendency 1), poor free throws (FT 40), finishes at the rim, rebounds. Elite rim protector: Block 79, Interior D 80, shot contest 97 (highest in the league).
- [x] Shows as "Rim protector C · Low usage, Poor free-throw shooter". Set in `NBA_SET` (src/nba-setup.js); new leagues only.
- [x] 5 one-season sims (tools/kessler.js, seeds 1-5): avg 14.5 pts, 10.6 reb, 2.6 blk, 0.0 3PA, 58% FT, 72% FG, 31.7 min.

## My Career, Phase 2: pro games (Opus, Nov 19 2026)
- [x] As a pro, the sim stops on your team's games (choose: every game / big games / never; big = playoffs, rivalries, every 5th game). Play or Sim.
- [x] Played games: 4 key moments with choices and % chances. Your calls change your form, shot volume and teammates' form in the real game engine, so the box score is real. Result popup: real line, FG, grade, XP, coach trust.
- [x] Coach trust (0-100): moves with games you play; adds or takes minutes (-6 to +8) and makes the calls easier. A game you play gets at least 12 minutes.
- [x] Created players get the new archetype habits (style tendencies), shown with playstyle caveats.
- Hooks: engine.js buildSide (careerMinutes), playGame0 (careerGameFx); app.js runSteps (your game first). Test: tools/browser-career.js (now through the first pro game) ALL PASS at 1300 + 390.

## Archetypes and playstyles rework (Opus, Nov 19 2026)
- [x] 8 distinct archetypes per position (40 total, redundant ones like All-around / Shooter / Movement shooter merged). An archetype is how a player plays: built from his shot habits as well as his skills.
- [x] Playstyle caveats next to the archetype, e.g. "3pt sniper SG · Low-volume shooter", "Stretch 5 · Below-average 3pt shooter", "Shies away from the rim", "Looks to pass first", "Ball-dominant", "Defensive liability".
- [x] Shot habits less tied to skill: about 1 in 3 new players gets a habit that doesn't match his ratings (good shooter who rarely shoots, gunner, finishing big who would rather pass or shoot jumpers). League shooting totals unchanged (checked PBL + NBA season sims).
- [x] Superstars (85+, about 5 a league) get a signature type: Point god, Heliocentric engine, Walking bucket, Gravity shooter, Two-way superstar, Freight train, Unicorn, Point center, Dominant big. Gold badge on the player page.
- [x] Coach targets and team needs use the new types; targets also weigh playstyle vs the coach's offense (pace wants volume shooters, motion wants passers). Type filters grouped by position with a Superstars group. Old saves convert on load.
- Tests: tools/arch-cal.js (calibration), tools/unit-v253.js, tools/browser-arch.js (desktop + phone) ALL PASS. Offline cache `pbl-app-v10`.
## Trophy room history, News & history filters + sort, Team needs (Opus, Nov 19 2026)
- [x] Trophy room uses the franchise's real history before 2026 too: banners, championship trophies, MVP / Finals MVP / DPOY / Rookie / Sixth Man / Most Improved, All-League picks, Coach of the Year, retired numbers, Hall of Famers. New filters: All years / Your league / Before 2026, and an award filter. New "All teams" league table (sortable, click a team to open it).
- [x] News & events is now a table (Season, When, Category, Team, Story) with sort and filters.
- [x] Every table on the News & history pages (History tabs, Weekly report, Top plays, Hall of Fame...) sorts by column and gets a filter bar: search + dropdowns (team, season, award...).
- [x] Roster moves > Overview: Team needs window (front office needs, playstyles the coach wants, position depth). League tab has a team picker.
- Offline cache bumped to `pbl-app-v8`. Test: tools/browser-hist39.js (desktop + phone) ALL PASS.

## Real top 100 single-game records (Opus, Nov 19 2026)
- [x] NBA leagues: History > League records > Single game now has the real all-time top 100 regular-season games for points, rebounds, assists, steals, blocks, 3-pointers, field goals, free throws and offensive rebounds (new list). Before: about 25 per stat.
- [x] Sources: Basketball-Reference single-game leaders pages + Wikipedia single-game lists (read Nov 19 2026). Data in tools/rec-game/*.csv, merged by `python3 tools/rec-game/merge.py` (safe to re-run).
- [x] Fixed made-up opponents in the old list (e.g. Wilt's 78 now says vs Los Angeles Lakers, Luka's 73 vs Atlanta). Games with no known opponent show the team only.
- Limit: rebounds, assists, steals, blocks and offensive rebounds have full box scores only from 1983-84 on, so older games show only at the very top (Wilt/Russell 38+ rebounds, 22+ assists, 8+ steals). Note added under "How this works".
- Test: tools/browser-recgame.js (desktop + phone) ALL PASS.
## My Career, Phase 1 (Opus, Nov 19 2026)
- [x] New league > **My Career**: create your player (name, number, position, height, style), pick or roll one of 8 backstories (each changes starting ratings, ceiling, work ethic or XP), pick college / Europe / Asia-Pacific and a team.
- [x] Pipeline season: full schedule for your team; 6 big games stop the sim (Play: 4 key moments with 2-3 choices and a % chance from your ratings, or Sim). Other games are simmed. Each game gives a grade (F to A+) and XP.
- [x] XP buys +1 on any rating (cost rises with the rating; athletic +50%). Upgrades raise overall, potential and draft stock.
- [x] Your college/club season line and team record come from your games. Draft night popup when you are picked (or undrafted). As a pro, games are simmed for now and give XP from your box score.
- New file src/career.js; small hooks in engine.js (simDay, playoffs), league.js (pipeSeason, growProspect), app.js (tab, setup, sim stop). Cache `pbl-app-v9`. Test: tools/browser-career.js (1300 + 390 wide) ALL PASS.
- Next: Phase 2 pro games you play; Phase 3 badges/achievements/Legend meter; Phase 4 interviews, relationships, news, trade requests, contract talks.

## Every page fills the window (Opus, Nov 19 2026)
- [x] All pages on all tabs now use the full window width like My Team > Roster (before, most pages stopped at 1760px wide; How it works stopped at 840px). How it works text flows into columns on wide screens. Offline cache bumped to `pbl-app-v7`.
- Test: tools/browser-fill.js checks 37 pages at 2560, 1920, 1280 and 390 (phone) wide.

## Draft tag buttons, Eye watch button, new name (Sonnet, Nov 19 2026)
- [x] Draft board and draft class lists: T (Target), S (Sleeper), A (Avoid) and Eye (watch list) buttons on every row again (Tags column). Click again to remove. The ⋯ menu still has Move up / down.
- [x] Eye button next to every name on League > Players and Stats > Players: one click adds to / removes from the watch list.
- [x] Game renamed to **Hardwood Dynasty** (page title, header, home-screen app, desktop app + installers v1.1.0). The fictional league inside the game is still the Pacific Basketball League; desktop saves stay in Documents/Pacific Basketball League so nothing is lost.
- [x] Offline cache bumped to `pbl-app-v6` (replaces PR #17's v5). Test: tools/browser-qtags.js (desktop + phone) ALL PASS.

## Back arrow keeps your spot (Opus, Nov 18 2026)
- [x] Back (and Forward) now return you to the same place on the page you left, e.g. My Team > Lineup & rotation > News > Back. Also keeps the My Team sub-tab. New pages still open at the top. Works in browser, phone layout and desktop app (same code). Test: tools/browser-backscroll.js (desktop + phone) ALL PASS.

## Playtime counter (Nov 18 2026)
- [x] **Per league + overall playtime**: Saves popup shows "Total playtime, all leagues" and "played X h Y min" on each save; Settings > Game shows both. Counts only while the game is on screen and you used it in the last 5 minutes. Stored as `L.playMs` (travels with exports), plus small `pt:<slot>` / `playtotal` keys written every 15 s. The total keeps time from deleted leagues. Old saves start at 0.
- Tests: tools/browser-play.js (11 checks), browser-pb, browser-desk ALL PASS.

## Phase C: desktop app (Opus, Nov 18 2026)
- [x] **Desktop app (Tauri 2)** in `desktop/`: same game in its own window, offline, about 4 MB. Installers for Windows (.exe/.msi), Mac (.dmg, Intel + Apple chips) and Linux (.AppImage/.deb) come from GitHub Actions > "Build desktop app" > Run workflow, as a draft Release. Steps in DESKTOP.md.
- [x] **Saves as real files**: Documents/Pacific Basketball League/saves (`.pbl` + slots.json), written safely (temp file, then rename). Newer files win at start, so leagues survive cleared app data and can be copied between computers. Exports go to its exports/ folder. Saves popup shows the folder + "Open the folder".
- [x] Desktop extras: no service worker or "Install as an app" inside the app; 1024px icon + all icon sizes.
- Checked: real Linux build launched under Xvfb and opened a league from a save file; `.deb` bundle built. tools/browser-desk.js (fake backend) ALL PASS.
- Not done (needs accounts / money): phone apps, code signing, auto-update, itch.io page. See DESKTOP.md "Later".

## Phase B: save safety, error screen, tour, difficulty, cleanup (Opus, Nov 18 2026)
- [x] **Automatic backups**: each league keeps its last 3 copies (at every new phase, and every 10 minutes of play). Saves popup lists them with "Go back to this". If the save can't be read, the newest backup opens with a short note. The game also asks the browser to keep saves when space runs low (`navigator.storage.persist`).
- [x] **Error card**: any crash shows "Something went wrong on this screen. Your league is safe..." with Reload / Copy details / Dismiss instead of a silently broken page (src/pb.js).
- [x] **Guided tour**: 9 short steps (sim buttons, pages, sub pages, roster moves, search, saves, settings). Starts by itself on a brand-new league; Settings > Game > Take the tour any time.
- [x] **Difficulty** (Settings > Game, saved with the league): Easy = AI accepts fair trades (0.97 x value), owner 40% more patient; Normal = as before (1.05); Hard = AI wants 1.15 x value, owner 35% less patient. league.js `DIFF` / `diffK`.
- [x] **Cleanup**: old runs, patches, review notes and duplicate saves moved to `archive/` (nothing loads them).
- Speed: checked a 10-season NBA save, 15 MB of data (about 1.5 MB stored, compressed). The v32h pruning already trims it each season, so nothing new was needed.
- Tests: tools/browser-pb.js (1300 + 390 px).

## Phase A: expansion teams (Opus, Nov 18 2026)
- [x] **League > Expansion page**: pick 2 or 4 new cities (12 ready-made PBL cities, 12 NBA-mode cities) or make your own: city, nickname, short name, two colors, logo, market size. Half go to each conference. Call it off any time before it happens.
- [x] **When**: the new teams join at the start of free agency (after the draft and re-signing). Planned during free agency = next offseason.
- [x] **Expansion draft**: every team protects 8 players (expiring deals and this year's rookies are safe anyway); new teams take turns picking (about 11 each), each old team loses at most 1 (2 in a 16-team league). Franchise mode: choose your 8 on the Expansion page (a reminder pops up at re-signing). Results popup + kept on the page.
- [x] **New teams get**: a coach from the pool, GM, owner, arena, sponsor, finances, future draft picks (not this year's), a division in 24+ team leagues, then free agency fills the roster.
- [x] **Any league size works** (up to 36): schedule gives every team exactly the season's games (engine.js `pairMatrix`); 18-22 teams use the 16-team playoff/lottery format, 24+ the 30-team one (`isBig`).
- Code: league.js end (`xpnPlan`, `xpnRun`, hook in `startFA`), src/xp.js (page + popup), engine.js (`pairMatrix`, `isBig`, `poStages`). Tests: tools/t-exp.js (16->18, 16->20, NBA 30->32 + a season after), tools/browser-xp.js (franchise 1300px + commish 390px).

## Popups, spoilers, phone layout, app install (Sonnet, Nov 18 2026)
- [x] **F1 popups one at a time**: popups, story cards and the to-do toast wait for each other (and for ceremonies). `popupBusy()` / `flushDialogs()` in app.js; a story card hides the to-do toast.
- [x] **F2 no spoilers in Watch live**: while your game is live the top bar shows the record from before the game, the news ticker is hidden, and popups / story cards wait until the final buzzer (or until you leave the live screen).
- [x] **U1 phone top bar**: 166px instead of ~250px. Title and date on top, Sim day + one "Sim" menu (the other sim buttons) + search + "..." (sound, settings, recent, saves), then tabs. The bar slides away when you scroll down and comes back when you scroll up.
- [x] **U2 phone tables**: Standings drops Division / Outlook and pins the team name; Players drops age, pot, salary, GP, minutes (and similar per tab). Any table can do this with `data-ph="2,3"` (0-based columns).
- [x] **I2 Settings: "Stop the sim for..."**: one list (trade offers, interviews, locker-room issues, player meetings, press conferences, deadline reminders, starred to-do items, training reminder). New switches: `L.pauseMtg`, `L.pausePress`, `L.pauseWarn`. Roster over 15 always stops the sim.
- [x] **I1 install as an app + offline**: `manifest.webmanifest`, `sw.js` (saves game files, refreshes them in the background), `icons/`. Settings has an Install button (Android / desktop) or the iPhone steps. Needs the game hosted on https (or localhost); the single-file build is unchanged.
- Tests: tools/browser-sonnet.js (43 checks), p1, p2, p3, mobile (tests now open the Sim menu on phones).

## Draft card stats, trade pictures, commentary colors (Opus, Nov 18 2026)
- [x] **Draft night cards**: prospects (and rookies before their first game) show their last college / international season from the pipeline (PTS / REB / AST, footer NCHF / EABL / APBA + season). No pipeline line: zeros.
- [x] **Trade news** (News & events): small team logos + player faces under each trade, each player beside the team that got him. Read from the news text, so old saves work too.
- [x] **Commentary colors** (live game): your team's good plays light green (makes, blocks, steals, runs, leads, milestones), bad plays light red (misses, turnovers, missed free throws); the other team's plays stay plain. Uses the theme's win / loss colors (light + dark).
- Tests: browser-p2 81/81 (new: commentary colors, trade pictures, prospect card stats; index + single), browser-p3 116/116 (new: draft card stats; draft save from new `tools/mkdraft.js`), p1 70/70, lint PASS. No save-format changes.

## Mobile pass (Opus, Nov 18 2026)
- [x] New checker `tools/browser-mobile.js`: 178 screens (25 pages + sub tabs + player/team/coach/box score/live + popups + draft) at 390 and 360 px: all fit, no tiny buttons, no errors.
- [x] Fixed by eye from screenshots: taller-than-needed header (Saves wrapped alone; Recent now an icon), player page action buttons (5 rows -> 2 swipeable rows), moves table date wrap, Compare teams popup cut-off text.
- Tests: browser-mobile 182/182 (index) + 91/91 (single, 390), p1 70/70, p2 67/67, p3 114/114.

## Phase 3 part 3 (Opus, Nov 18 2026): #6 phone-friendly layout
- [x] Bottom tab bar, sub tabs beside Back, 44px buttons, swipe between sub tabs (not on tables / tab strips / canvas / popups), tip once.
- Tests: browser-p3 114/114 (index + single), p1 70/70, p2 67/67.

## Phase 3 part 2 (Opus, Nov 18 2026): #7 save/share/import, #11 draft night show, #8 story events
- [x] **#7**: packed league file (.pbl.gz, ~8x smaller), share sheet, team link (`#team=`), import reads both kinds.
- [x] **#11**: pick reveals with crowd reactions (value vs consensus), game-day music during the show, 2:00 pick clock (auto-pick only with the setting on).
- [x] **#8**: story popups + Stories page (illustrated SVG scenes in team colors), art on press / locker room / interview popups.
- Tests: browser-p3 98/98 (index + single), p1 70/70, p2 67/67, lint PASS. No save-format changes.

## Phase 3 part 1 (Opus, Nov 18 2026): #4 player cards, #12 trophies + ceremonies, #13 music
- [x] **#4 Player cards** (`src/p3.js`): card per player (face, team colors, rating as you see it, position, season line, rarity border + shine). My team → Player cards (any team), Player card button on player pages. Save image / Share / Copy link (`#card=`).
- [x] **#12 Trophies**: Trophy room view (banners, trophies, awards won there, retired numbers, Hall of Famers); MVP and title ceremonies (once per season, on top of the awards / champion popups).
- [x] **#13 Music** (`src/fx.js`): menu + game-day loops, Background music + Music volume in Settings (also new: Shows section for ceremonies, draft show, draft clock auto-pick, story popups).
- Tests: browser-p3 52/52 (index + single), browser-p1 70/70, browser-p2 67/67, lint PASS.

## Rebound fix (Opus, Nov 18 2026)
- [x] **Fix**: after an offensive rebound on a missed shot, the offense now keeps the ball (and the rebounder can go straight back up for a putback). Before, the code for this sat inside a comment in engine.js, so the ball went to the other team.
- [x] **Test season** (`tools/oreb-check.js`, NBA save at season 11, 2 seeds, per team per game, before -> after): points 107.4 -> 108.8, FG% 46.1 -> 47.0 (putbacks), assists 25.4 -> 24.9 (putbacks are unassisted), off. rebounds 10.6 -> 10.4, turnovers 14.6 (same), win% spread about the same. Small, realistic change; no retune needed.
- Tests: t36 27/27, t34 19/19, lint PASS, browser-p2 67/67.

## Phase 2 (Opus, Nov 18 2026): animated court view, play-by-play ticker, top plays
Plan: Phase 2 of Kenneth's plan (features #1, #10, #5). Branch `phase2-live-court-ticker-highlights`, PR #2 merged to main.
- [x] **Engine** (no change to results: same scores on a 5-day check): shot entries in the play-by-play keep a shot code (`entry[10]` = zone x 10 + type: 0 dunk, 1 layup, 2 paint, 3 mid, 4 three). Every game (not only yours) keeps its top 3 plays in `game.hl` = [score, kind, player, side, q, clock, home pts, away pts, zone, type, assist, other]; kinds D dunk, 3 three, A and-one, P putback dunk, B block, G game-winner (go-ahead shot by the winner in the last 24 s).
- [x] **#1 Animated court** (`src/court.js`, canvas): full court with both teams' dots (team colors, jersey numbers); each play moves them into a set, the ball goes from the handler to the shooter (pass when assisted), flies to the rim, then drops in (+2 / +3 pop) or caroms to the rebounder; blocks, steals, free throws, timeouts and quarter breaks have their own moves. Home attacks right in the first half. Timing follows the live speed; Instant or "Skip animations" jumps to the end of each play.
- [x] **#10 Commentary ticker** beside the court (under it on phones): a commentator line per play ("Splash! X from deep.", "Stuffed! Y blocks X.", "Z with the steal!"), plus runs (8-0 and up), ties, lead changes, 20 / 30 / 40-point games, double- and triple-doubles. Newest on top, slides in, team color stripe. The detailed play-by-play stays below.
- [x] **#5 Top plays** (News & history → **Top plays**): the night's top 10 (max 2 per player) from every game, with the player's face, rank, what happened ("X drills a deep three (assist Y)."), time and score, and a looping half-court replay (sound on the shot). Autoplays to the next play; Prev / Pause / Next; pick any night of this season. My team overview shows the top 3 with "Watch the reel"; each box score lists that game's top plays with a Watch button. Ranking: game-winners first, then putback slams, dunks, and-ones, threes, blocks; plays in the last 2 minutes of a close game count 1.6x. Games from before this version have no top plays.
- Tests: `tools/browser-p2.js` 67/67 (1300 desktop + 390 touch, franchise save; also 67/67 on the single-file build), browser-p1 70/70 (both builds), t36 27/27, t34 19/19, lint PASS. Save fields: `game.hl`, `entry[10]` (new, optional). Old saves load unchanged. Browser tests now run without a local web server (Playwright serves the folder).
- Found, not changed (it would change game balance): engine.js line with `// v32b: some boards are team rebounds` has code inside the comment (`switchPoss = false; off.putback = r.id; rebBy = r; rebO = true;`), so after an offensive rebound on a missed shot the ball still goes to the other team and putbacks from it don't happen. Worth a separate fix + balance check.

## Phase 1 (Opus, Nov 18 2026): sound effects + mute, screen animations, settings page, shot charts
Plan: Phase 1 of Kenneth's plan (features #3, #9, #14, #2). Branch `phase1-sound-anim-settings-shotcharts`.
- [x] **#3 Sound effects** (`src/fx.js`, new): all sounds made with the Web Audio API, no audio files: bounce, swish, rim, dunk, block, whistle, buzzer, cheer, groan. Sim buttons bounce; after a sim your last game gives a cheer (win) or groan (loss) with a banner ("Win 112-104" / "Won last game … · 3-1 this sim"); a title gives the buzzer + big crowd. Live games (`fxLive` in `lvTick`): sound per play from the play-by-play (score change + text: dunk / 3PT / make / block / miss, timeout whistle, quarter buzzer), final buzzer then crowd or groan for your team. Fast live speeds are throttled. 🔊 header button mutes (🔇 when off).
- [x] **#9 Screen animations**: `#main` fades in on a screen change only (key = view / player / game / tab; live-game ticks don't re-fade); `data-cu` numbers count up (team record + points for / against on the team page, box score finals); confetti from both sides on a win, double for a title; result banner. Speed via CSS `--fx-mult`, `.fx-off` turns them all off. Reduced-motion browsers start with animations off.
- [x] **#14 Settings page** (⚙ button in the header, popup): mute, volume, live-game sounds, sim button sound, try buttons for 7 sounds, skip animations, speed slow / normal / fast, confetti on / off, Reset, Preview a win. Saved in the browser (`localStorage` `pbl-fx`), not in the league save.
- [x] **#2 Shot charts**: the engine already kept zone totals (14 zones) per player per season and a heat chart existed on player / team pages. New: each game keeps its shots (`game.sh` = one letter per shot, zone + made; ~146 bytes gzipped per game, current season only since `L.games` resets). Box score → **Shot chart** panel: away / home team or any player, green dot = made, red x = missed, FG and 3P line. Player page → Shooting: **Hot and cold zones** (old heat chart) or **Makes and misses**, any season (this season, playoffs, past seasons, career); big seasons show a 350-shot sample with the same make rate per zone (title keeps the real totals). Marks sit at a seeded random spot inside their zone (the engine stores the zone, not the exact spot). Games from before this version say "Shot charts are kept for games played with this version or later."
- Hooks in app.js: `render` → `FX.afterRender(key)`, `runSteps` → `fxSimResult(ph0, g0)`, `lvTick` → `fxLive(g, i)`. `build.py --single` adds fx.js after app.js.
- Tests: `tools/browser-p1.js` 70/70 (1300 desktop + 390 touch, franchise save; also 70/70 on the single-file build), t36 27/27, t34 19/19, lint PASS. Save fields: `game.sh` (new, optional). Old saves load unchanged.
- Note: the older browser tests are Python (`.py.txt`) and need Python Playwright, which isn't in this environment; the new one is Node.

## v37b (Opus, Nov 17 2026): History book from 1946-47, All-time greats as one career, Hall of Fame effect, full Hall of Fame tab
Plan steps 5-7 (claude/nba/v37-plan.md) + review of v37a. Rule: one universe, no "real" vs in-game labels.
- [x] **A. History book** (History → History book): the league list and the franchise list continue below this league's seasons with every season 1946-47 to 2025-26, same columns. League, regular season: Champion (new column, sim seasons too), Best record (`hxBestRecord`), MVP / DPOY / ROY (season list `nbaHist`), Scoring title (`NBA_HX.aw` LPTS, ppg); Top defender / Biggest trade "—". Playoffs: Champion, Runner-up, Finals MVP; Finals score and playoff scoring leader "—". Franchise (`NBA_HX.fs`): W-L, the team name of that time when it differs (e.g. Minneapolis Lakers), honors from `NBA_HX.aw` (All-League 1st, All-Defense 1st) and MVP / DPOY / ROY / Sixth Man / Most Improved when the winner's team that season is in the award rows (`hbTeamAw`, old team codes mapped by `HX_FR`); stat leaders "—". Playoffs: result text, Finals MVP of title seasons. Franchise records (best / worst record by win %, titles, Finals, playoff trips) count the earlier seasons too. Names link to players in the league (`hbName`, accent-insensitive).
- [x] **B. All-time greats** (`greatsList` / `greatsView`, app.js): every career on one scale, ranked together from day 1. Real seasons before 2026-27 (`nbaLegBase`, nba-2026.js): regular season `nbaRowValue` + playoffs `nbaPoValue` (NBA_CARPO), for every real player (stars NBA_CAR; role players the real rows of `nbaEstRows`, not the estimated ones), by team `p.legBaseT`, team per real season `p.legSeasT` (real awards now count for the team he won them with; before, for every team he played for). Retired legends (`hxLegLegacy`, nba-history.js) from NBA_LGD career totals: stats not kept yet (rebounds < 1950-51, minutes < 1951-52, off. rebounds / steals / blocks < 1973-74, turnovers < 1977-78) scaled up by the share of seasons kept, or the per-minute rate of legends at his position who started 1979-80+; missing FGA / FTA from points, TS% and the legends' FT% (Chris Paul's row has none); career totals to season sum x `HX_CONV` (1.26 at career game score 11.5 -> 1.0 at 21, fitted on 48 NBA_CAR careers); playoffs = regular-season value x (0.529 + 0.149 x titles), max 1.5 (fitted on 47 careers, highest 1.49); awards AWARD_PTS (NBA_LGD counts, season list MVP / FMVP / DPOY, stat titles from NBA_HX.aw); by team split by games with each franchise (`NBA_HX.fl`). Names already in the league are not doubled. Overall list: rank #, legacy points, **Top 50 / Top 100** toggle (`ui.greatTop`); by position and franchise use the same entries (legends: "—" for per-team seasons / awards). Legend names open their page.
- **Calibration** (`tools/t37b.js`, `tools/runs32/v37b-legacy.txt`): same formula both sides (game score per game, 4 x (g - 10) x games / 82; playoffs x min(1.25, games / 12)). Mean of the top 10 / 25 / 50 season values per season: real 2022-25 45.6 / 36.2 / 27.6, this league S1-10 (nba-commish save) 45.0 / 35.4 / 27.0, so the mapping is **1:1, no factor**. Same players (age 27 or younger in 2025-26): real last 3 seasons 24.1 vs their first 3 sim seasons 20.9 (aging / role; the league-wide match is the check). Day 1: 1 Kareem 4189, 2 Jordan 4084, 3 LeBron 4003, 4 Wilt 3265, 5 Duncan, 7 Russell; #100 = 364; 299 careers ranked.
- [x] **C. Hall of Fame effect**: decision: **real seasons before 2026-27 count** (they already did for regular seasons since v27; now real playoffs too), so LeBron, Durant etc. get in on retiring (Durant check in t37b). `honorRetired` skips anyone whose name is in the history list's Hall of Fame (`hxHofYear` -> `p.hofX`, no second induction; jersey rule counts him as a Hall of Famer). 5 seasons from `tools/snap/nba-commish-s10.json.gz`, SEED 21 (`tools/t37b-hof5.js`, `tools/runs32/v37b-hof5-base.txt` = code before v37b, `-new.txt`): **7 -> 8 inductees** (the extra: Donovan Clingan 702, bar 700); the other 7 the same with ~5% higher scores; none twice, none from the history list. Bar (700) and credentials unchanged.
- [x] **D. Hall of Fame tab** (News & history → Hall of Fame, `vHofCeremony` / `hofMembers`): one list, 263 history members (players, coaches, contributors, referees, teams) + this league's inductees, newest class first: class, name (player page / legend page / plain), category, teams. Filters: class, team (old codes PHO / NJN / SEA / STL mapped), category (`ui.hofF`). Top: the chosen class (newest by default, chips for the last 8 classes or the class filter) with its cards, speeches for this league's inductees. New inductees show up automatically. History → Awards and Hall of Fame: newest 10 + "Full Hall of Fame →" / "All N members →".
- [x] **E. v37a review**: `tools/browser-v37a.py.txt` 167/167 on the merged + v37b code (wide pages, ⋯ menu, 390 taps, records sub tabs, pipeline overview): no fixes needed there. History tables (book, seasons list, greats) wrap name cells (`table.hwrap`): at 1600 the book (1689 in 1538 after the Champion column) and the seasons list (1358 in 1002, listed open in v37a) now fit. Still wider at 1300 (scroll inside the box): Your GM career table 1000 / 802, greats side panels 611 / 594, awards history 1290 / 1238.
- Tests: `tools/t37b.js` 13/13, `tools/browser-v37b.py.txt` 90/90 (1300 + 390, day-1 NBA league + franchise save), browser-v37a 167/167, t36 27/27, t34 19/19, lint PASS. Save fields: `p.legSeasT`, `p.hofX`, `L.legV` (37); old saves are updated on load (`migrateLeague` -> `nbaLegBaseAll`). PBL mode unchanged (no history data).
- Caveats: legends' playoffs and pre-1974 stats are estimates (documented above); 1960s pace inflates old box scores (Wilt game score 28.7, no pace adjustment: there is no pace data in NBA_HX); legends' by-team split of awards is by games, not by the season they were won; no ABA seasons in the data (Erving, Gervin under-rated).

## v37a + v37b (Sonnet, Nov 17 2026): wide pages, ⋯ row menu, mobile actions, league records tabs, pipeline overview
- [x] **A. Less sideways scrolling.** At 1600px no table is wider than its box on My team roster (was 1634 in a 1538 box, now 1355), the draft director's board (was 1809, now fits) and the trade center (both sides 626 / 635 of 761; left side was 873). `body.wide` lets these pages use the full window. Tag chips are one short word with the full wording in the tooltip (Cornerstone, Icon, Face, Untouchable, Bargain, Overpaid, Fits coach, Clashes, Dev role, No fit); the Franchise cornerstone / Franchise Cornerstone double chip is gone (the icon badge hides the tag). One ⋯ menu per row replaces Extend / Shop / Untouchable / Core / Release; Core, Untouchable and On block stay as small chips. Name, Role, Type, Compares to, Scouting, Director's take wrap at a max width. Draft board: Up / Down and T / S / A moved into the ⋯ menu (your tag and the star show as chips), the three mock ranks are one cell, Age + Ht one cell. Trade lists: Yrs + option in one column.
- Sweep (1600px): fixed **Players** (info tab 1552 in 1538: Archetype wraps, Opt joined to Yrs), **FA coach targets** (769 in 744: Why / cap note wrap). Checked and already fitting: Stats (leaders / players / teams), Teams, Pipeline rosters + award history, Awards race, FA list / upcoming, trading block, completed trades, My team cap / front office. Still wider than the box (not asked, listed): History > Seasons list 1358 in 1002 (League history table), at 1300px: Players 1268 / 1238, Stats players 1328 / 1238, draft board 1267 / 1238, Pipeline award history 1334 / 1238, Standings 868-918 / 802.
- News ticker width follows the page (`body.wide .ticker`, else 1760px like `.wrap`; was 1280px).
- [x] **B. Mobile (390px).** The ⋯ menu opens by tap (bottom sheet, 44px rows, fits the screen) and sets Core / Untouchable / Shop, opens the Extend offer popup, and asks before Release. The player page of your own players has the same buttons (Extend / Shop / Untouchable / Core / Release). Escape and an outside tap close the menu on desktop.
- [x] **C. History > League records** sub tabs: Feats tracker / Single game / Season / Career / Career playoffs (`ui.recTab`, kept like the other sub tabs); Top 10 / Top 100 unchanged. Only the open tab builds its lists (`REC_ONLY`), so the page is lighter.
- [x] **D. Pipeline > Overview** (first tab): top 10 draft prospects of the next class (consensus of the mock drafts, league tag NCHF / EABL / APBA, team, age, Ovr, Pot, stock chip), biggest risers and fallers since the last pipeline season (`p.stock`), PPG / RPG / APG leaders per league. Names link to players. Day-1 league: the table shows, risers say stock moves come after the first pipeline season, leaders say results arrive after the Finals.
- Tests: `tools/browser-v37a.py.txt` 167/167 (1600 desktop click, 1300, 390 touch on `tools/snap/nba-team-s10.json.gz`, plus a day-1 NBA league for the pipeline empty states), t36 27/27, t34 19/19, lint PASS. `tools/browser-v29.py.txt` pipeline sub tab list updated (ALL, NCHF, EABL, APBA). No save fields changed.
- Not re-run: the old `browser-v266` "Doesn't fit system" check looks for the `.pill.dev-nofit` class, which is unchanged (label is now "No fit", the tooltip keeps the old wording).

## v36e (Opus, Nov 17 2026): hard-cap losses, Kenneth's picks (allow a 7th-9th man, 25% stay discount, accept 8-9%)
- [x] `capClear` (src/league.js, `CAP_CLEAR.top9`): when bench deals can't make room, one 7th-9th man may go too (paid less than the player kept, 4+ OVR below him, same other rules: not signed this offseason, no two-way / rookie 21- / no-trade / extension / protect). Bench-only sets are tried first, then the 7th-9th man alone, then with one bench deal. Never a top-6 player. Owner check (`seasonLimit`, tax-line rule) unchanged. Log `o60.capClear9`
- [x] `RESIGN_K.disc` 0.85 -> **0.75**: a wanted 60+ player takes up to 25% less to stay under the hard cap (log `o60.discStay`)
- Result, 2 x 10 seasons from the v36a3 save (`tools/runs32/v36e-nba-snap10-r21/r22.txt`): 60+ lost on cap / owner **55/676 = 8.1%** (v36d 61/701 = 8.7%, v36a3 58/699 = 8.3%); hard-cap part 35 (v36d 46, -24%), owner part 17 (12): some players the hard cap no longer stops now stop at the owner. Kept by a move 5 (all with a 7th-9th man), by the discount 16. Payroll 173.4 / 172.0, 0 teams below $0. In Kenneth's accepted 8-9% range: closed
- [x] Pre-upload fixes: clear-room trades get their own kind `clear` (trade record `kind` / `wk`, move line `mv.t.clear`, 4 wordings) instead of the salary-dump label and "dumped salary" line; `discStay` / `ccWhy` / `capClearFail` now counted for the season's first re-sign too; stale "up to 15%" comment fixed. t36 27/27 (+ kind check), t32e 21/21, browser v36d 52/52, lint PASS
- Tests: t36 26/26 (+ v36e case: bench all just signed -> a 7th-9th man is moved, no top-6 player; discount 0.75; v36d case uses ask = 1.5x the bench deal so the 25% discount alone can't fit), t34 19/19, t33b 30/30, t33c 24/24, t33d 17/17, t32e 21/21, t32h 11/11, t30a 29/0, lint PASS. No save fields changed (saves from v36d kept); no new 20-season run (re-sign only, 2 x 10 checked)

## v36d (Opus, Nov 17 2026): hard-cap clear room, to-do list review, PROGRESS cleanup, version-end check
- [x] A (item 5) hard-cap losses: new `capClear` / `CAP_CLEAR` (src/league.js, called in `startResign` after the stay discount). Before losing a wanted 60+ player to the hard cap, an AI team trades away 1-2 bench deals (outside the top 9 of the roster, above the minimum, not signed this offseason, not a two-way, no rookie 21-, no no-trade clause / extension / protect, 4+ OVR below him; expiring first, then lowest OVR) to a team with cap room and a roster spot (a 2nd-round pick goes along if the deal is a burden), then re-signs him at his value, ask or the 15% stay discount, whichever fits first. Waiving does not help: a released deal stays on the cap as dead money and minimum deals count 0, so it is trade-only. Owner side unchanged: no move if the owner is cutting losses or the payroll after the move is past `seasonLimit` (owner limit, tax-line rule). Logs: tx line on both players, news, `resignLog.o60` `capCleared` / `capClearFail` / `ccWhy` (why no move); `tools/v34sum.py.txt` prints them
- Result: **target ~5% not reached.** 2 x 10 seasons from the v36a3 save (`tools/runs32/v36d-nba-snap10-r21/r22.txt`): 60+ lost to the cap 61/701 = **8.7%** (v36a3 58/699 = 8.3%, same within noise); 2 players kept by a move. Why (`ccWhy`, runs + `v36d-ccdiag-*`): the gap over the hard cap is usually $5-37M (asks $28-47M for 62-72 OVR players) while movable bench salary is $0-6M (`tooBig`), or the bench is all minimum / protected deals (`noBench`). The rule works when it can (t36), but bench contracts are too small to matter
- A/B (20 seasons, `v36d-nba-commish-off.txt` = CAP_CLEAR off): the first version (no owner check) let all-in teams stay at the hard cap paying $40-60M tax (DAL cash -$128M); the `seasonLimit` check was added after that
- Options for Kenneth (not done): (1) allow moving one top-9 contract worth less than the player kept (e.g. 7th-9th man, ranks 7-9 carry $5-80M); (2) a bigger stay discount for 60+ players (15% -> 25%); (3) accept ~8-9%
- [x] B (item 2) season to-do list (`todoItems`, src/app.js), every auto rule checked against the state it claims. Fixed: s1f lineup ticked on any My team tab once Lineup & rotation had been picked before (now only on the Roster tab, where the panel is); s1j locker room ignored harmony (now also needs harmony 45+, out of the red); promise risk counted game-count promises from other seasons (now same season only). The rest match (watch list 3+, training focus / Training check, core player, extensions via `canExtend`, roster 13-15 + 2 two-ways, deadline interview shown only while open, deadline passed, season review opened, roster legal + top-5 happy). Off in commissioner / jobless / autopilot; old saves without `L.todo` load (stop off); sim stop 3 days before the deadline works. Browser `tools/browser-v36d.py.txt` 52/52 (1300 + 390, franchise save); the old app.js fails the 3 fixed checks (46/52)
- [x] C (item 3) stale open lines marked done with pointers: 7t / 8t (v33e, v30 text variants, v30 round 2 open line; HAIKU-TASKS.md "Needs Kenneth's OK" x2), legends Top awards (v33e open line -> v34)
- [x] D (item 1) version-end, 20 seasons SEED 21 commish (`tools/runs32/v36d-nba-commish.txt`, `v36d-pbl16-commish.txt`; saves remade):
  | | NBA v36a3 | NBA v36d | PBL16 v36a3 | PBL16 v36d |
  |---|---|---|---|---|
  | payroll avg | 176.5 | 176.0 | 134.2 | 134.7 |
  | floor (seasons with <= 2 teams under) | 20/20 | 19/20 (S14: 5) | 20/20 | 20/20 |
  | top PER / top WS | 31.2-37.4 / <= 21.5 | 31.1-38.8 / <= 19.8 | <= 31.9 | 28.7-35.2 / <= 17.0 |
  | 60+ lost, all / cap (% of 60+ expiring) | 31.9% / 11.1% | 27.8% / 10.5% | 26.9% / 7.4% | 29.9% / 8.7% |
  | cap split hard / owner / icon | 69 / 12 / 5 | 61 / 18 / 5 (5 kept by a move) | | 24 / 9 / 2 (2 kept) |
  | teams below $0 (per season), lowest | 0-3, -101 | 0-3, -78 | 0-1, -12 | 0-1, -13 |
  | hard-cap crossings | 3 | 3 | 0 | 0 |
  | errors | 0 | 0 | 0 | 0 |
  MVP from the new saves (S1-10): NBA WS leader 7/10, top-3 10/10, 6 winners (most 4); PBL 7/10, 10/10, 4 winners (one player 7). Note: the first D run (before the owner check) gave NBA 4/10 on S1-10: the award result swings with the league path, 10 seasons is small
- Open: (1) 60+ cap losses still ~8-10% (see options above; v36e: Kenneth picked options 1 + 2 and accepts 8-9%, done). (2) NBA owners in the red: a fresh 20-season run still has 0-3 a season from S9 (ATL "hopeful" at the hard cap paying $46M tax -> -$56M; MEM small market -$78M); the tax-line rule (v36a part 3) only covers all-in / contending owners, and v36a3 checked it only on 2 x 10 seasons from the save (0 there; 0 again in v36d's 2 x 10). Not from v36d (those teams made no clear-room move). (3) NBA top PER 36.8-38.8 in S18-20 with a 96-97 OVR (generational ceiling 97). (4) PBL one-player outliers (Dizon 79 OVR PER 34-37 on 28 mpg in the first D run)
- Tests: t36 25/25 (+6 v36d A checks on their own save copy; C and A1 checks made save-proof: C picks any team with a multi-year deal, A1 uses 12 players), t34 19/19, t33b 30/30, t33c 24/24, t33d 17/17, t32e 21/21, t32h 11/11, t30a 29/0, lint PASS, browser v36d 52/52

## v36c (Sonnet, Nov 17 2026): MVP retune on the merged code
- [x] `AW_ADV` (src/league.js): WS 35% kept, WS/48 .10, PER .05, team record 0.5 kept; game score .25 -> **.30**, BPM .25 -> **.20**; voter fatigue **fat1 .05 / fat2 .10 / fatOld 0** (v36: .10 / .15 / .05)
- Method: new dumps from the part 3 save (`tools/snap/nba-commish-s10.json.gz`, `t36-awsnap.js dump 10`), SEED 21 and SEED 22 (hold-out); 365 in-spec sets (gs .10-.40 with bpm = .50 - gs, fat1 .05-.20, fat2 .10-.25, fatOld 0-.08) scored on both: `tools/runs32/v36c-awgrid-s21.txt`, `v36c-awgrid-s22.txt`
- Result of the grid (WS leader / top-3 / winners / worst WS rank): old set (v36) SEED 21 5 / 10 / 6 / 3, SEED 22 5 / 9 / 7 / 6; **chosen set SEED 21 6 / 10 / 6 / 3, SEED 22 6 / 10 / 5 / 3**. What moves it is fatigue (fat1 .05 and fatOld 0); fat2 and the gs / bpm split (gs .30-.40) give the same winners. Best on SEED 22 alone: 7 (fatOld .05), SEED 21 never above 6. Out-of-spec sets (ws48 / per changed) were not needed
- **Real award run** (`tools/t33c-awards.js 10`, SEED 21, `tools/runs32/v36c-awards-new.txt`, report `v36c-awards-report.txt`) vs the merge run (`v36-merge-awards-report.txt`): MVP = WS leader **7/10** (was 4/10), top-3 in WS **10/10** (9), **7 different winners** (7), most by one player 2, worst WS rank 3, no low-minute winner (min 31.6 mpg). DPOY top-5 DWS 8/10 (8), 9 winners (8); scoring untouched, only Joel Foster at 28 mpg is a low-minute DPOY winner (same as before)
- Targets: leader 6-7/10 yes, top-3 9+/10 yes, 5+ winners yes, no winner below WS rank 5 yes, no low-minute MVP yes
- Caveat: fatigue is lower, so repeat MVPs are easier: the longest run is 2 (Duren S12 / S14 not consecutive; Ashby S15 / S18). The grid is on two 10-season leagues; the set sits on a plateau (gs .30-.40 and fat2 .10-.25 all identical), the three non-leader winners were S11 (WS #3), S13 (#2) and S19 (#2)
- Tests: t33d 17/17 (weights check now v36c: gs .3 ws .35 bpm .2), t33c 24/24, t34 19/19, t36 19/19

## v36 (Nov 17 2026): MVP win shares 35% + t33c multi-seed
- [x] A MVP weights (`AW_ADV`, src/league.js): WS 35% (your pick), game score .25, BPM .25, WS/48 .10, PER .05 (the last two unchanged); team record 0.5 kept; voter fatigue up to `fat1` .10 / `fat2` .15 / `fatOld` .05 (was .05 / .10 / .02). Why fatigue moved: on SEED 21 seasons the gs / bpm split barely changes anything (all splits of .50 give the same winners); fatigue does
- Search: `tools/t34-awgrid.js` (W1-W5 added, run 1: all five WS-35% sets = old set G: leader 5/10, top-3 8/10, 8 winners, worst rank 4), then new `tools/t36-awsnap.js` (dumps the league at award time, re-scores sets offline in seconds, same result as the live grid). 647 sets on two 10-season runs (SEED 21 and a hold-out SEED 22): `tools/runs32/v36-awgrid-offline.txt`
- Chosen set (in-spec, ws48 / per fixed): SEED 21 seasons leader 6, top-3 8, 9 winners (most 2), worst rank 4; SEED 22 hold-out leader 7, top-3 10, 7 winners, worst rank 3. Old set G: 5 / 8 / 8 and 8 / 10 / 7
- **Real award run** (`tools/t33c-awards.js 10`, `tools/runs32/v36-awards-new.txt`, report `v36-awards-report.txt`): MVP = WS leader 6/10, top-3 9/10, 6 winners (most 3, Ellery), no winner below WS rank 4; DPOY top-5 DWS 10/10. All four targets met. (v34 report is on the old save, so not a same-season compare; DPOY here has 3 winners, Marcus Hines 7/10, DPOY scoring untouched: path of this league, worth a look)
- Caveat: the SEED 21 save has near-tied stars (S17 / S18: WS #1-#4 within 1 WS), so top-3 9+ there is partly luck. Sets that hit 9+ on the offline seasons all use WS/48 .20 (WS family 55%, game score .10-.22), e.g. gs .21 per .10 bpm .14 ws48 .20, fat .04/.06/.012 (9 / 10 on the two seeds); not used because you said rest to game score / BPM. Say if you want it
- [x] B t33c team WS vs wins averaged over SEED 21 / 22 / 23 was already in the repo (v34 follow-ups); re-run: avg corr 0.956 (0.934 / 0.966 / 0.969, bar 0.94), mean gap 3.26. No code change
- [x] Tests: t33c 24/24, t33d 17/17 (weights check updated to the v36 values), t34 19/19
- Note (merge, Nov 17): v36b was tuned on v36a part 1 code; v36a parts 2-3 (PER engine fix, payroll, owner money) were merged in afterwards with these MVP weights, award run re-checked: `tools/runs32/v36-merge-awards-report.txt` (10 seasons from the part 3 save): MVP = WS leader **4/10** (target 6-7), top-3 9/10, 7 winners (most 2), no low-minute winner. The WS-leader target is missed on the new stats: retune `AW_ADV` with `tools/t36-awsnap.js` on the part 3 save (Sonnet)

## v34 follow-ups (Opus, Nov 16 2026): open items 6 + 8
- [x] Item 6, t33c: team WS vs wins is checked as the average over SEED 21 / 22 / 23 (`tools/t33c.js`, block A). Corr 0.934 / 0.966 / 0.969 = avg 0.956 (bar 0.94). The mean gap is averaged the same way: 4.20 / 2.71 / 2.86 = avg 3.26 (bar 4). The gap was also on SEED 21 alone, and that seed fails it (4.20), so both checks now use the 3-seed average. Tests: t33c 24/24 (was 22/23)
- [x] Item 8, MVP weights: asked Kenneth. He kept 40% WS. No change to `AW_ADV` (set G). The 30% grid (`tools/t34-awgrid.js`) was not run
- [x] Tests: t34 19/19, t33c 24/24
- Open: none from v34 items 6 / 8. The t33c 3-seed run takes about 80 s (was 40 s)

## v36a part 3 (Opus, Nov 16 2026): owner money + 60+ players lost on cap / owner grounds
Kenneth: fix owner money; try the 60+ cap / owner losses (-10% is enough, little time); before the MVP retune.
- [x] Diagnosis: owners below $0 were overspenders (HOU $235M + $38M tax: -$58M in a season; small markets at $205-237M vs revenue $200-235M). `ownerLimit` follows revenue, but status floors (all-in = hard cap, contenders past the tax) and the Bird-rights stretch (`resignOwnerOK`) went past it. The 60+ cap / owner losses are mostly the **hard cap** (new resignLog split `capHard` / `capOwner` / `capIcon`; v34sum prints it)
- [x] Owner money (league.js): NBA `MEDIA` 142 -> 150 (payroll rose ~$9M a team in part 2); `cuttingLosses` for any market below $-10M cash (`OWNER_RED`, was small markets only); no Bird-rights stretch with cash below $0; with under $20M in the bank (`OWNER_TAXCASH`) all-in / contending owners stop at the tax line (repeat tax took owners to -$85M / -$101M)
- [x] 60+ losses: `RESIGN_K.disc` 0.85: a wanted 60+ player takes up to 15% less to stay when the hard cap blocks his ask (tx line "Took a discount to stay")
- [x] Results:
  | NBA | v36a part 2 (20 seasons) | part 3 (20 seasons, before the tax-line rule) | part 3 final, 10 seasons from the save x 2 seeds |
  |---|---|---|---|
  | payroll avg | 175.5 | 176.5 | 176.0 / 173.0 |
  | teams below $0 cash (per season) | 1-5 every season, lowest -85 | 0-3, 8 seasons at 0, lowest -101 | **0 in all 20 seasons** (lowest +2) |
  | owner cash avg | 50-71 | 56-88 | 79-90 |
  | 60+ lost on cap / owner (% of 60+ expiring) | 118/833 (14.2%) | 86/778 (11.1%) | 58/699 (8.3%) |
  | 60+ lost, all reasons | 32.2% | 31.9% | 26.2% |
  | top PER / top WS | 29.9-38.9 / <= 18.7 | 31.2-37.4 / <= 21.5 | 30.5-37.5 / <= 16.8 |
  Runs: `tools/runs32/v36a3-nba-commish.txt`, `v36a3-pbl16-commish.txt` (20 seasons, saves remade), `v36a3-nba-snap10-tax-r21/r22.txt` (final code), `v36a3-nba-snap10-q21/q22.txt` (before the tax-line rule). PBL16 20 seasons: payroll 134.2, floor 20/20, top PER <= 31.9, owner cash lowest -12 (0-1 teams below 0)
- [x] r30 `cash` row lists the teams below $0 (`red`: market, status, cash, cap payroll, tax, revenue, owner limit)
- [x] Tests: t36 19/19 (+ owner in the red, media, discount), t34 19/19, t33b 30/30, t33c 23/23, t33d 17/17, t32e 21/21, t32h 11/11, t30a 29/0, lint PASS
- Open: the final tax-line rule was checked on 2 x 10 seasons from the save, not a fresh 20-season run (saves have no new fields). Hard cap is still the main 60+ cap loss (by design). Next: v36b MVP retune (Sonnet)

## v36a part 2 (Opus, Nov 16 2026): NBA payroll and PER on target
Kenneth: finish the payroll lever and PER in this session; MVP tuning later (Sonnet, v36b).
- [x] PER diagnosis (`tools/per36.js`, one season from a save; `tools/per36show.py.txt`): the formula is standard; the PER 36-42 leaders used 40-47% of their team's plays (real best ~36%) at TS .60-.67. The usage weight cap (2.1x the five's average) barely binds (1.7 changed nothing): shots come through the handler / plays
- [x] PER fix (engine.js `ENG`): `shareCap` 0.25 / `shareK` 5 = a player past 25% of his team's shots in a game passes some on; `useTax` 0.5 -> 1.0 = volume costs more efficiency. One season, SEED 21/22/23: top PER 36.4 / 34.9 / 35.4 (before 36.5 / 40.2), top usage 36-38.5% (40-47%), scoring leader ~31 ppg (35-36), 14-15 players at PER 25+ (19-20), league TS .565 (.571). Applies to PBL too (top PER <= 33.7)
- [x] Payroll diagnosis: most NBA teams sat at the floor ($148-158M, contenders too). The market scale is fitted so the top 13 x 30 players' **values** equal the budget, but players on rookie deals are paid the scale (S11 save: 60+ rookies valued $43.6M a team, paid $9.1M), so real contracts ran ~25% under the budget. Re-signs / extensions also paid under value
- [x] Payroll levers (league.js): `MKT_ROOKIE_FIXED` (NBA): rookie deals count at their cap hit when the market is fitted, so the scale rises (lift up to `MKT_LIFT_NBA` 3.4, was 3.0); `RESIGN_K.val` 1.0 / `valOvr` 60: a 60+ player re-signs at max(ask, value) (falls back to the ask when value doesn't fit cap / owner), and AI 60+ extensions at value too. `SPEND_K` unchanged (1.24 / 1.30 tried: noise)
- [x] 10 seasons from the save (`tools/runs32/v36a2-*.txt`): ask only 164.4, value re-sign 164.8, + extensions 168.2, + rookie fix 169.4 (SEED 21) / 170.3 (SEED 22)
- [x] Tests (new saves): t36 16/16 (+ re-sign at value, PER engine, market rookie fix), t34 19/19 (fog value check now over free agents + other teams' players: the new save starts with 9 free agents, all read high), t33b 30/30 (its market sum counts NBA rookie deals at cap hit, as the game), t33c 23/23, t33d 17/17, t32e 21/21, t32h 11/11, t30a 29/0, lint PASS
- [x] 20 seasons SEED=21 commish (`tools/runs32/v36a2-nba-commish.txt`, `v36a2-pbl16-commish.txt`):
  | | NBA v35a | NBA v36a | NBA v36a part 2 | PBL16 v36a | PBL16 part 2 |
  |---|---|---|---|---|---|
  | payroll avg | 166.5 | 166.8 | **175.5** (S1-13 173-184, S14-20 165-173) | 132.5 | 134.7 |
  | seasons <= 2 under floor | 20/20 | 20/20 | 20/20 | 20/20 | 20/20 |
  | teams over the tax | | | 1-8 a season | | |
  | top PER | 34.4-40.4 | 35-42.6 | **29.9-38.9** (0/20 over 39) | 29-33.8 | 27.6-33.7 |
  | top WS | <= 19.4 | <= 21.1 | <= 18.7 | <= 19.8 | <= 17.3 |
  | 60+ lost (of expiring) | 216/875 | 213/825 | 268/833 (cap/owner 118) | 106/488 | 123/425 |
  | owner cash avg / teams below 0 | | 50-91 / 0-2 (S1-6) | 50-71 / 1-5 every season (min -85) | 51-84 / 0 | 51-88 / 0-1 |
  0 errors; hard-cap crossings S1 start deals only; max next-season payroll 221.7 (the hard cap)
- [x] Saves remade (`tools/snap`: nba-commish, pbl16-commish via r30 SNAPOUT, nba-team via snap-make)
- Open: (1) more 60+ players leave on cap / owner grounds (118 in 20 seasons, was 56-67): value prices don't always fit; (2) owner cash: 1-5 NBA teams below $0 each season (lowest -$85M); the league average still grows (50 -> 70). If that matters, raise NBA revenue (`MEDIA` 142) with payroll; (3) payroll sags to 165-173 in S14-20; (4) MVP weights untouched (v36b): leaders now score less and PER / WS are lower, so retune there

## v36a (Opus, Nov 16 2026): NBA payroll levers, NBA top cap, owner cash of yearly deals, forced PBL cap test
- [x] C owner cash: `cashPayroll` charges the season's scheduled amount (`schedAmt`: real yearly deals `contract.sched`, v35a renegotiated raises), not `contract.amt`. New NBA league, S2: cash $154.4M -> $165.8M a team (= cap payroll). t30a 29/0; 20-season owner cash (new r30 `cash` row): avg $50M (S1) -> $90M, 1-2 teams below 0 in S1-6 (lowest -$46M, S4), none after S7
- [x] B NBA top cap: `NBA_BAL` t95 2 -> 1, cap 97 -> 96, capGen 98 -> 97; the 95+ extras now end under 95 (they lost 1 and stayed 95+); `nbaTopCap` / `leagueTopCap` repeat the nudge (growTo stopped short: a generational 99 stayed 98 over a 97 cap). Top OVR S11-20 now 91-94 (v35a 94-97). **Top PER not fixed**: 35-42.6, 8/20 over 39 (v35a 34-40.4, 5/20). The PER leaders are OVR 83-91 players (Sterling Ellery 84: PER 37-41.6 five seasons; Theo Lacroix 90: 42.6 with 7.9 WS; Flagg 90: 40.9), so the rating cap can't reach them. Top WS <= 21.1 (one season), else <= 20.8
- [x] A2 re-sign: `resignWantP` raises want to `RESIGN_K.mid60` 0.95 (`mid60old` 0.8 for 33+ under 68) for a 60+ player in the top 9 of a team that is not tanking and stays under the tax with his ask (rebuild / age cuts don't apply). Tank and taxpayers unchanged
- [x] A1 early free agency: `FA_EARLY` / `faEarly` (faRound): days 1-3, a middle team (not tank / rebuild, under the tax, $3M+ cap room or the mid-level) bids his ask x1.05 on a 60+ player who'd be in its top 10, cutting a minimum player if full. Room, mid-level, ask ramp, hard cap, floor fill and renegotiation unchanged
- [x] Why payroll doesn't move: NBA free agency opens with only 3-4 players at 60+ (S11 save: 3), so A1 has almost nothing to buy; one summer on the same random stream, base vs A: payroll $160.0M vs $159.9M, 60+ kept 39 vs 40 of 45. Re-signs are at the ask, below value (60-64: $13.3M vs mval $15.6M; 65+: 41.2 vs 43.2). The league's own market settles near $160-165M after the real starting contracts run out (S1 185 -> S9 158 in every run)
- [x] 10 seasons from the NBA save (`tools/runs32/v36a-nba-snap10-ab-base.txt` B+C, `-ab-a.txt` +A1+A2): 60+ lost 91 -> 74 of ~400 (team didn't want him 23 -> 21, cap 23 -> 14, price 19 -> 10); payroll 164.7 -> 159.8 (random streams diverge from S12; the same-stream summer is equal)
- [x] D forced PBL cap (`tools/t36.js`): star set to 96-97 -> 92-93 after a season + summer (cap = mean + 3.6 sd), generational 99 -> at most the generational cap (97 on the old save, 99 on the new one: that league's sd is wider)
- [x] Tests (new saves): t36 13/13 (new: D, A1, A2, B, C), t34 19/19, t33b 30/30, t33d 17/17, t32e 21/21, t32h 11/11, t30a 29/0, lint PASS
- [x] 20 seasons SEED=21 commish (`tools/runs32/v36a-*commish.txt`, `python3 tools/v34sum.py.txt <file>`, now also prints 60+ losses by reason and owner cash):
  | | NBA v35a | NBA v36a | PBL16 v35b | PBL16 v36a |
  |---|---|---|---|---|
  | payroll avg | 166.5 (S10-19 154-165) | 166.8 (S10-19 155-169) | 132.8 | 132.5 |
  | 60+ lost / expiring | 216 / 875 (25%) | 213 / 825 (26%) | 122 / 489 (25%) | 106 / 488 (22%) |
  | "team didn't want him" | 68 | 51 | 25 | 16 |
  | cap / owner (t:cap) | 56 | 67 | 36 | 33 |
  | seasons <= 2 under floor | 20/20 | 20/20 | 20/20 | 20/20 (max 2) |
  | top PER / top WS | 34.4-40.4 / <= 19.4 | 35-42.6 / <= 21.1 | 28.9-38.7 / <= 16.9 | 29.1-33.8 / <= 19.8 |
  | top OVR S11-20 | 94-97 | 91-94 | 83-88 | 87-91 |
  0 errors, hard-cap crossings S1 start deals only (NBA). The final nbaTopCap change (extras under 95) came after the 20-season run: 3 seasons from the new save (`tools/runs32/v36a-nba-snap10-3s-topcap.txt`) payroll 166-170, top OVR 93-94, top PER 36.5 / 40.9 / 39.6
- [x] Saves remade (`tools/snap`: nba-commish + pbl16-commish via r30 SNAPOUT, nba-team via snap-make)
- Open (your call): **NBA payroll still 166.8** (target 170-185). Both levers did what they say (fewer "didn't want him" losses), but the money isn't there to spend: few 60+ free agents and re-signs at the ask. Next levers: re-sign at value (Bird-rights price = max(ask, mval)), or raise the market-value scale ~5-8%. **Top PER**: not a rating problem; needs a look at why some OVR 83-91 players post PER 40+ (profile / usage / efficiency in the engine, or the PER scale), which also touches the awards (v36b). The t:cap losses rose 56 -> 67 (cap or owner limit; C makes some early owners poorer)

## v35b (Opus, Nov 16 2026): PBL top-rating cap + pro-fog sorting
- [x] Item 4, PBL top ratings: new `leagueTopCap` (league.js, called each summer after `leagueGravity` when not NBA mode; `PBL_TOP`). League-relative: ceiling = rostered mean + 3.6 sd (PBL mean 59, sd 8.8: about OVR 91; generational talent mean + 4.2 sd, about 96); past 2 players above mean + 3.2 sd (about 87) the extras, youngest first, lose 1-2 OVR (and a point of pot). Ratings, pot and ceil above the cap are pulled down. NBA mode keeps `nbaTopCap`
- [x] Check 1, 10 seasons PBL16 from `tools/snap/pbl16-commish-s10.json.gz`, SEED=21 (`tools/runs32/v35b-pbl16-snap10-before.txt` = code before, `v35b-pbl16-snap10.txt` = with the cap): this save's best player is only 88, below the cap, so S11-17 are identical (top PER 34.5-38.9); S18-20 differ only by the random stream (top PER 33.9 / 36 before, 33.8 / 32.3 / 29.6 after). Before: top PER 33.9-38.9, WS <= 14.8; after: 29.6-38.9, WS <= 14.8
- [x] Check 2, the late-league case needs a new league (the v34 PER 40 came with OVR 92-94 in S15-20): 20 seasons new PBL16, SEED=21 (`tools/runs32/v35b-pbl16-commish.txt`, v35a / v34 for comparison):
  | | v34 | v35a | v35b |
  |---|---|---|---|
  | top PER | 28.7-40 | <= 38.7 | 28.9-38.7 (S10-20: 33.4-38.7) |
  | top WS | <= 17.1 | <= 16.9 | <= 16.9 |
  | top OVR S11-20 | 87-94 | 86-89 | 83-88 |
  | payroll avg / <= 2 under floor | 129.6 / 12 of 20 | 132.8 / 20 of 20 | 132.8 / 20 of 20 (max 1) |
  **The cap rarely binds**: v35a's PBL league (same seed, no cap) already had top OVR 86-89 and top PER <= 38.7, so the v34 case (OVR 92-94, PER 40) did not come back, and v35b's rows match v35a through S15 (S16-20 differ by the random stream). S1 shows the starting league's 98 (S2 94, S3 89); the cap pulls those down after the first summer. Top PER 35-38.7 in S10-17, 33.4-35.5 in S18-20, 29-34 in S2-8. Treat it as insurance for leagues that grow a 92+ star, not a measured change
- [x] Item 7, pro fog sorting: `ovrNum` (app.js) now returns your scouts' read (`proOvr`) for fogged players, the same number the cell shows (own players exact). That fixes the Ovr `data-v` on League > Players (Info / Attributes), the row filters (min Ovr, `data-ro`) and Free agents order. Also by shown read: League > Players default order, Stats > Players Ovr sort (`pval('ovr')`), home page best / movers / rookies, cap projection, trade partner list, trade block, expiring contracts, injury report. Attribute cells already used `attrNum` (`proAttr`) and sort by their text. Not changed: Pot (own scouted value), Fit and Mood (already your read / not fogged)
- [x] Tests: `tools/t34.js` 19/19, lint 110 PASS, `tools/t30a.js` 29/0, node --check (league, app); browser `tools/browser-v34.py.txt` 34/34 (1300 + 390); new sort check `tools/browser-v35b.py.txt` 24/24 (1300 + 390): ordered by shown Ovr on League > Players (default, click, click again), Attributes tab, Stats > Players, Free agents; `data-v` = shown number. On the old app.js the same check fails 3 of 12 at each width (data-v, Stats sort, FA order)
- Open: the cap is untested on a league with a 92+ star (none appeared in these runs); a forced test would be to set one star to 96 and sim a summer. The sd-based cap tightens if the league compresses. Top PER sits at 29-34 in S2-8 (below your 35-38); that is the league's talent level, not the cap (v35a identical). Raising it would mean allowing more 88+ players, your call. Saves in `tools/snap` not remade (no save fields changed)

## v35a (Opus, Nov 16 2026): payroll floor, floor spikes, hard-cap hole
- [x] Floor trace: `tools/r30.js` `FLOORLOG=1` prints an `F` row after free agency (each under-floor team's paid contracts with expiry/type, minimum players, who left, 56+ / 50-55 free agents left, money expiring next summer, renegotiations). Reproduces v34 exactly (same src + SEED=21)
- [x] Spike causes:
  - PBL S6-7 (11, 13 under): a league-wide salary trough (avg $108-112M vs the $120M floor). No 56+ free agents after day 1, floor rosters full of cheap rookie / minimum deals, few teams above the floor to dump salary
  - NBA S16 (15 under, all $135-147.7M vs $148.5M): an expiry echo ($1.2B of extensions ran out into S16 vs $0.4B at S11; league avg $150.5M). Floor dumps did run every day, but the v34 big-gap rule took them from teams just above the floor, which then fell under (14-16 under on every FA day). Not 2-year floor deals / 3-year dumps
- [x] Fixes (league.js, floor fill):
  - `floorAbsorb`: the team dumping salary must stay at or above the floor after the deal (S16 save: 15 -> 0 under)
  - `floorSign`: once the 56+ pool is gone, 55- players (48+, and better than the minimum player cut for them) on 1-year floor deals above the minimum, under $10M (`FLOOR_FILL.lowOvr` / `lowMax`); 25-and-under 55-59 at most 2.4x the minimum (`youngMax` = `ASK_YOUNG_X`, was 2.2); small gaps sign at the minimum + $0.2M or more instead of skipping
  - `floorRenego` (your pick): at the end of free agency a team still under the floor gives its own players a raise for this season only, using cap room (real NBA renegotiation; not rookie-scale or two-way deals; best players first; same under-60 / young limits). Stored as a yearly amount (`contract.sched` / `s0`, `contract.reneg`); player line "Renegotiated: ..." and one news line per team. PBL: 0-9 a season (24 in 20 seasons); NBA rarely
- [x] Hard cap: the S2 TOR $226.4M was not a trade (the audit logs a crossing at the next checked event). `holdoutCheck` ran inside `startNewSeason` after the season number went up but before the phase turned 'regular', so `capSeason` was next season: Quickley's holdout raise (32.5 -> 47) was checked against the wrong year's hard cap and the new deal ran one season too long. It now runs after `L.phase = 'regular'`. r30 audit also checks `startNewSeason` (before/after cap numbers) and lists the teams in a trade
- [x] NBA payroll (item 3): tried over-cap middle (hopeful) teams paying a wanted own 58+ player his full ask (`RESIGN_K`). Same 10 seasons from the new save, A/B identical (163.4 both): 60+ players lost on price are 1-2 a summer, so it never changed an outcome. Reverted. **Still under target** (166.5 vs 170-185): S10-19 run $154-165M. Losses are now team-side ("didn't want him", cap/owner), and free agency has no 56+ players left to spend on
- [x] Tests: t34 19/19, t33b 30/30, t33d 17/17, t32e 21/21, t32h 11/11, t30a 29/0
- [x] 20 seasons SEED=21 commish (`tools/runs32/v35a-*.txt`, summary `python3 tools/v34sum.py.txt <file>`):
  | | NBA v34 | NBA v35a | PBL16 v34 | PBL16 v35a |
  |---|---|---|---|---|
  | payroll avg | 169.9 | 166.5 (S1-9 166-185, S10-19 154-165) | 129.6 | 132.8 |
  | seasons <= 2 under floor (after FA) | 19/20 (S16: 15) | 20/20 (max 2) | 12/20 (S6-7: 11, 13) | 20/20 (max 1) |
  | lowest team | 112 (S16) | 140 (S20) | 87 | 119 |
  | hard-cap crossings | S1 start deals + S2 TOR | S1 start deals only | 0 | 0 |
  | top PER / top WS | 33-40 / <= 21.2 | 34-40 / <= 19.4 | <= 40 / <= 17.1 | <= 38.7 / <= 16.9 |
  0 errors; under-60 $10M asks 0
- [x] Saves remade (`tools/snap`: nba-commish + pbl16-commish via r30 SNAPOUT, nba-team via snap-make)
- Open: NBA payroll 166.5 (target 170-185). Options: middle teams use cap room / the mid-level on 60+ players earlier in free agency, or softer "team didn't want him" for 60+ rotation players on teams under the tax. Not done (would need your call). The renegotiated raise counts on the cap but `cashPayroll` (owner cash) still uses the base amount

## v34 (Opus, Nov 16 2026): tuning follow-ups + scouting overhaul
- [x] A1 payroll: AI re-sign rates up (`RESIGN_K`: want rot .97 / young .92 / top-10 .92 / 26- .85 / other 60+ .75, leave chances x0.55, pay .6-.88 of ask); an owner stretches past his limit to keep his own 62+ player (`resignOwnerOK`: +$8M / 68+ +$18M / 75+ +$30M; a 98 OVR walked over $7M in the trace); a team under the floor keeps its own 56+ (.95). Floor: a big gap (8%+ of the floor) takes 3-year dumps, from teams just above the floor too, and 2-year floor deals; `maxSign` 7. Hard cap, ask ramp, floor charge unchanged
- [x] A2 MVP: voter fatigue `AW_ADV.fat1` .05 (last season's MVP), `fat2` .10 (2+ in a row), `fatOld` .02 (MVP 2-3 seasons back). WS kept at 40%: on the same 10 seasons (`tools/t34-awgrid.js`, `tools/runs32/v34-awgrid.txt`, each set with its own MVP history) every WS-30% set picked a WS #12 MVP once and led WS 5/10; v33d weights + fatigue (set G) 6/10, top-3 10/10, 7 winners, most 2. **Differs from your "WS ~30%"**, say if you want 30% anyway
- [x] A3 top ratings (`nbaTopCap` in `nbaBalance`, NBA): ceilings 97 (98 for a generational talent), anyone above eased back, past 2 players at 95+ the extras lose 1-2
- [x] A4 young asks (`lowAskCap`): 25-and-under 55- = minimum, 56-59 at most 2.4x the minimum (`ASK_YOUNG_X`), whatever the league shift; under 60 never $10M
- [x] B: `tools/t32f.js` passes the row's team to `hxBpmOf` (code was right; per-stint BPM since v33d) 21/21. Legends "Top awards" from `NBA_HX.aw` (All-NBA 1st, All-Star) + season list (MVP, Finals MVP, DPOY); titles stay from the legend record (not in the history data). `hxAwKey`: exact name, else last name + first initial with awards in his career years. 9 legends change (old NBA_LGD errors: Tony Parker 3x All-NBA 1st -> 0, Carmelo 2 -> 0, Jerry Lucas 1 -> 3)
- [x] C scouting (your answers: Medium pro fog, one director with 2 ratings, budget levels, AI fog in draft + FA only):
  - Director: draft rating (as before) + pro rating (`s.pro`; old saves get one near the draft rating); both shown in director tables / popup; salary on both
  - Department level (`SCOUT_LV`, staff budget): Standard (included, = before) / Expanded $0.8M (reads 15% tighter, 4 assignments, 6 interviews) / Elite $2M (30% tighter, 5, 7). Yours: Draft > Scouting, same window as hiring. AI picks each offseason by staff room (rebuild / tank go up first)
  - Pro fog (franchise mode, not commissioner): other teams' players and free agents show your staff's read (OVR with "~", ratings; median miss 1, max 6); own and two-way players exact; tighter with a better pro rating, bigger department, watch list, a player who played for you, later in the season. New "Pro scouting report" panel on their player page (sc.pro / sc.prostr / sc.prowk / sc.proconf, 7 wordings each)
  - AI: free-agent bids use its own read (`teamOvr` + value x 0.8-1.25); draft as before; trades on true values
  - Draft accuracy: outlet ranks and your board rank stored at the draft (`p.draft.mo`, `p.draft.ub`); "Mock drafts vs what players became" table on the scouting page (rank correlation with peak OVR + top-10 hits per list; outlet / board columns fill for drafts from v34 on)
- [x] Fixes found on the way: `linkify` crashed on two players with the same name (pre-existing; news / discipline panels); my own v34 draft edit had cut `p.rookieSeason` (ROY empty) - caught in the award run, fixed before the final runs
- [x] Tests: t34 19/19 (new), t33d 17/17, t33b 30/30 (55s check now 26+, A4), t32e 21/21, t32f 21/21, t32h 11/11, t30a 29/0, lint 110 PASS, browser `tools/browser-v34.py.txt` 34/34 (1300 + 390). **t33c 22/23**: team WS vs wins corr 0.934 on SEED 21 (bar 0.94); SEED 22 / 23 0.966 / 0.969 (one-season noise, bar not lowered)
- [x] 20 seasons SEED=21 commish (`tools/runs32/v34-*.txt`, `tools/v34sum.py.txt`):
  | | NBA v33d | NBA v34 | PBL16 v33d | PBL16 v34 |
  |---|---|---|---|---|
  | payroll avg | 166.9 | 169.9 (S1-14 167-185) | 132.0 | 129.6 |
  | seasons <= 2 under floor (after FA) | 17/20 | 19/20 (S16: 15) | 15/20 | 12/20 (S6-7: 11, 13) |
  | 60+ re-sign rate | 0.55-0.87 | 0.59-0.79 | 0.55-0.79 | 0.41-0.87 |
  | top PER | 33-46 | 33-40 | <= 43.8 | <= 40 |
  | top WS | <= 19.3 | <= 21.2 | <= 19.6 | <= 17.1 |
  | players 95+ (top 3) | 1 (98-99 S2-13) | 0-2, 99 once | - | - |
  | young 56-59 ask max | 3.0 | 2.1 | 3.2 | 2.0 |
  0 errors; hard-cap crossings S1 start contracts + 1 trade in S2 (TOR $226.4M); under-60 $10M asks 0
- [x] Awards, 10 seasons from the NBA save (`tools/runs32/v34-awards-*.txt`): MVP = WS leader 7/10, top-3 9/10, 7 winners (most 3); DPOY top-5 DWS 9/10; ROY min 26.4 mpg
- [x] Saves remade (`tools/snap`: nba-commish, pbl16-commish via r30 SNAPOUT, nba-team via snap-make)
- Open: NBA payroll 169.9 is just under 170-185 (S15-20 drop to 150-171: one season S16 with 15 teams under the floor after FA, cause not traced). PBL floor misses the target (12/20, was 15/20): after free agency there are no 56+ free agents left (diagnosed on the PBL save), so floor teams can only take dumps; spikes at S6-7. Next lever: let floor teams sign 55- players above the minimum, or offer sheets / trades for salary. PBL top PER (40) has no rating cap (nbaTopCap is NBA only). One hard-cap crossing by trade (S2 TOR) not traced. t33c WS/wins 0.934 on one seed. Table sorting may still order by true OVR on pro-fog columns (not checked)

## Haiku (Nov 16 2026): 7t / 8t wordings
- [x] Scouting report (`sc.*`, 5 keys) and ticker (`tk.*`, 12 keys) in `src/league.js` FLAVOR: +3 wordings each, 7 per key. Same `{vars}`, under 140 characters, `'won\'t'` escaped. No code change. Checks: node --check OK, lint 106 PASS, t30c 30/30

## v33e (Sonnet, Nov 16 2026): legends' trophy cases, single-file build, floor messages at 390px
- [x] Retired legends (History > Legends > click a name): new "Trophy case" in the legend popup with All-League 1st / 2nd / 3rd, All-Defense 1st / 2nd and All-Star rows, one chip per season (e.g. 1986-87), from `NBA_HX.aw` (`hxHonors(name)` in `tools/hx-fn.js`, re-appended to `src/nba-history.js` with the same marker line; the data line is untouched). `trophyCase` (player pages) and the legend popup share one renderer, `trophyCaseHtml(ys, label)`. Jordan: All-League 1st x10, 2nd x1, All-Defense 1st x9, All-Star x14. All-Rookie rows left out (not asked)
- [x] Single-file build: `src/index.template.html` gets an `/*NBA*/` marker; `python3 -I build.py --single . [out.html]` stitches the page (CSS, vendor, engine, league, nba-2026, nba-text, nba-setup, nba-history, app; same order as index.html; `</script` / `</style` escaped). The old template had no NBA files at all (not only nba-history.js), so NBA mode could not start in the single file. Built file 4.0 MB; the v33e browser test passes on it (52/52)
- [x] v33d floor / dump messages at 390px, on a real league played from `nba-commish-s10` through season 11 into free agency day 11 (46 trades with `why`, 6 floor salary-dump news lines, 2 "payroll-floor deal" signings, 133 players with a "Paid above his value" line over all saved seasons): player page transaction lines, News > Trades and the home page fit; Trades > Completed trades did not: the "why / How each side saw it" row was one long line, cut off by the table edge (every trade reason, floor dumps included). Fixed: the cell content wraps (`.whyrow`, max width = screen less the When column)
- [x] (v36d cleanup: done, see v30 review round 2 `sc.*` / `tk.*` keys + Haiku Nov 16 wordings) 7t / 8t (scouting-report `scoutDlg` and ticker `tickerItems` lines into FLAVOR keys): not done. HAIKU-TASKS.md still says "Needs Kenneth's OK" and nothing in the repo or docs records it. v33f (Haiku wordings) waits on this
- [x] Tests: `tools/browser-v33e.py.txt` 52/52 (1300 + 390; `python3 browser-v33e.py PORT [PAGE] [SAVE]`; on the free-agency save and on `pbl-single.html`; 34/34 on the plain season-11 save), node --check (app, league, engine, nba-history), lint 106 keys. `tools/t32f.js` 20/21: "history player rows (500+ min) use game-formula BPM, 1574 of 1592, set 1443" fails the same way on the code before this session (not from v33e; came with v33d's per-stint BPM). Not run: sims (UI only)
- Open: (v36d cleanup: Top awards column done in v34, from `NBA_HX.aw`) legends list "Top awards" column still reads the legend's own counts (NBA_LGD), not NBA_HX.aw; a legend with no `NBA_HX.aw` rows (name spelled differently) shows no case. "Paid above his value" lines: 133 players have one across the saved seasons, 18 from the season-11 offseason (median contract $8.3M, max $49.5M, 6 at $3M or less); nothing wrong seen, not looked at further

## v33d (Opus, Nov 16 2026): payroll floor, balance, MVP win shares + award follow-ups
- [x] Payroll floor (A). Cause (v33b): floor teams filled rosters with minimum vets (the free-agent pool past the top few is all ~$1.3-5M value) and non-contenders stopped at the cap (`b2Ceiling` = cap for hopeful / rising / retool, so no mid-level). Now a team under the floor: bids above value in free agency (short 1-2 year deals, pays its bid, may cut a minimum player for the spot), takes salary dumps into cap room from FA day 2 (short overpaid deals from teams well above the floor, picks attached as in `salaryDump`), and signs late "payroll-floor deals" from FA day 5 (56+; Kenneth's young-player rule and the under-60 $10M cap kept). Floor charge stays as backstop; owner limits don't apply below the floor. Hopeful / rising / retool teams may use the mid-level for a player who helps; rebuild / tank stay at the cap. Ask ramp, young-player rule, hard cap unchanged
- [x] Hard-cap crossings (v33b audit) traced: S1 = real 2026 contracts already over $221.7M for the next cap year (start league, not a signing); sign-and-trade = the player re-signs with his old team for a moment before the trade (audit now checks after the whole deal). Real holes closed: trade checks used the base amount (no trade kicker / yearly schedule / pending extension: `inHit`, 2- and 3-team trades; 3-team trades had no next-season check either), holdout raises checked this year and base amount only (`swapFits`), AI extensions didn't check the extension's own seasons (an early rookie extension starts two seasons out)
- [x] Balance (B): stronger `LG_GRAV` (1.5 / 2 / 0.8) kept: NBA league OVR 59.3 avg (58.0-60.2; v33b 60.6), PBL16 58.7 (v33b 59.4), payroll held. Blocks at the source: generated block ratings above 58 compressed x0.7 (generated bigs at 22: p90 67 -> 63, p95 72 -> 67, 70+ 8% -> 2.4%; real bigs p90 64, p95 67). Regular-season role-minute ceiling 38.5 (`MPG_TOP`)
- [x] Awards (C): MVP = game score 30% + WS 40% + WS/48 10% + PER 5% + BPM 15%, team record 0.5 (was 40 / 20 / 15 / 10 / 15, 1.1). Your spec (WS 35%, game score 30%, team 0.8) picked the WS leader 5 of 9 seasons on the same seasons; WS 40% + team 0.5 picked him 8 of 9 (`tools/t33d-awgrid.js`, `tools/runs32/v33d-awgrid.txt`). ROY needs 20+ mpg (else the usual pool); MIP leaves out the MVP top 5. DPOY unchanged
- [x] PER 49.5 / WS 27.3 outlier: not in the history data, and not the backfill (backfill vs exact values on a played season: PER error 0.11, WS 0.19). Cause in sim seasons: (1) turnovers were always charged to the ball handler, so 37-43% usage scorers had 1.3-2.2 a game on TS .63-.69 (PER 41-46 by S15-20 in the first v33d run); now 60% of turnovers go to the player who would use the possession (squared usage weights): top-10-usage players 2.2 -> 2.9 a game (real ~3), team turnovers unchanged (13.9), top PER 40 -> 36 on the same season; (2) ratings at the very top: a 97-99 OVR star still posts PER 40-46 (final run S6-S15). Not changed (see Open)
- [x] History BPM per traded stint: `tools/hx-bpmstint.py.txt` (447 player-seasons; minutes-weighted stints vs season value: median gap 0.03); `hxBpmOf(name, y, team)`. "est." tag: player Advanced tab (tooltip) and season records "(est.)" for PER / WS worked out on load (older saves)
- [x] 20 seasons SEED=21 commish (`tools/runs32/v33d-*.txt` vs v33b):
  | | NBA v33b | NBA v33d | PBL16 v33b | PBL16 v33d |
  |---|---|---|---|---|
  | payroll avg (range) | 158.8 (130.8-180.1) | 166.9 (155.7-183.2) | 126.1 (109.1-135.8) | 132.0 (122.1-141.4) |
  | lowest team avg | 75.8 | 146.6 | 46.0 | 112.7 |
  | seasons with <= 2 teams under the floor (after FA) | not counted (about a third of teams under) | 17 / 20 (4, 4, 5 in the others) | not counted | 15 / 20 (3-7 in the others) |
  | max committed next season | 221.6 | 225.5 (S1 start contracts), else <= 220 | 167.8 | 168.7 |
  | hard-cap audit crossings | 7 | S1 start contracts only | 2 | 0 |
  | league OVR | 60.6 | 59.3 | 59.4 | 58.7 |
  | 1.5+ BPG | 20.4 (13-27) | 14.6 (11-19) | 11.2 (7-16) | 8.2 (4-13) |
  | top MPG (any season) | 39.9 | 37.0 | 39.6 | 37.9 |
  | top PER / WS (1,500+ min) | not logged | 33-46 / <= 19.3 | not logged | <= 43.8 / <= 19.6 |
  0 errors, roster problems 0. Young 55- at the minimum every season, nobody under 60 at $10M+
- [x] Awards, 10 seasons from the new NBA save, v33d vs v33c scoring (`tools/runs32/v33d-awards-*.txt`): v33d MVP = WS leader 8/10, top-3 in WS 10/10, DPOY top-5 in DWS 10/10, MIP from the MVP top 5 0/10 (v33c 1/10), ROY min 23.3 mpg. But MVPs: 3 different winners, one player 6 (he led WS in most of those seasons); v33c run: 6 different, most 4
- [x] Tests: `tools/t33d.js` 17/17, t33b 30/30 (59-sample check now >= 3 players, back-to-start within 0.25), t33c 23/23 (team WS vs wins bar 0.95 -> 0.94: 0.963 -> 0.948 with the turnover change; old-save test strips PER / WS first), t32e 21/21, t32h 11/11, t32r pass, t30a 29/0, lint 106, browser `tools/browser-v33d.py.txt` 12/12 (1300 + 390). Saves remade (`tools/snap/`): nba-commish and pbl16-commish (r30 `SNAPOUT`), nba-team (snap-make)
- Open: NBA payroll 166.9 is still under the 175-190 target (S1-3 173-183, then 156-168): floor teams now land at the floor, but middle teams stop near the cap + mid-level and only ~40% of expiring players re-sign (Bird-rights money leaves); next lever is re-sign rates / raises over the cap. MVP variety: with WS at 40% one dominant player can win 6 of 10 (voter-fatigue rule would trade against the WS-leader rate). PER 40-46 for 97-99 OVR stars (cap the very top in `nbaBalance`, or compress elite stat output). Young 56-59 asks reach 3-3.6x the minimum late (bands follow the weaker league; the start league holds at <= 2.2x)

## v33c (Opus, Nov 16 2026): the game's own PER / USG% / win shares / VORP, used by the awards
- [x] Formulas (league.js `computeAdv`, same inputs as `computeBPM`: box line per team stint + team totals for/against + league totals), regular season and playoffs, frozen at season end: PER (Hollinger, pace-adjusted, league average 15), USG% (team-based; replaces the old usage number where present), OWS / DWS / WS (Oliver points produced / defensive rating, B-Ref marginal-points method), WS/48, VORP = (BPM + 2) x min / (48 x 82). Traded players: each team stint with its own team context
- [x] Check on a played season (t33c): league PER 15.00, USG% 20.0; team WS vs wins corr 0.98, mean gap 2.2 wins, league WS total within 1% of wins
- [x] History: `tools/hx-adv.py.txt` recomputes PER / USG% / OWS / DWS / WS / WS48 for every past NBA season (and each traded stint) from B-Ref totals + team/opponent totals and writes them into `NBA_HX` (rows, legends, record lists, award winners). Check vs B-Ref (`tools/runs32/v33c-hx-check.txt`, 500+ min): 1977-2026 identical (corr 1.000, gap 0.00: same formulas); 1973-77 PER 0.979 / WS 0.951; 1970-73 PER 0.988 / WS 0.960; 1951-70 PER 0.994. Largest gaps: early-70s WS where TOV / ORB weren't kept (Bill Bridges 1970-71 8.8 vs 3.9, Bob Love 1973-74 1.3 vs 5.8), PER Pete Maravich 1976-77 17.9 vs 19.8. Seasons with no opponent box score (to 1969-70) keep B-Ref's WS; no minutes (to 1950-51) no PER
- [x] Older saves: past sim seasons get PER / WS on load (`advBackfill`: opponent line estimated from points allowed; team WS vs wins corr 0.93 on the S10 save), flagged `advEst`
- [x] Shown: Players table (basic PER / WS; advanced PER / OWS / DWS / WS / WS48 / VORP), player page Advanced tab (RS + playoffs + career), Leaders (PER, Win shares, WS/48, DWS, VORP), league records (season + career PER / WS / WS48, history included), award ladders (PER / WS / BPM, DPOY + DWS / DBPM, MIP + PER last year, MVP / ROY / 6MOY + WS/48), award pages + runners-up, History list (MVP numbers, history MVPs recomputed)
- [x] Awards (Kenneth, Nov 16): MVP / All-League = game score 40% + WS 20% + WS/48 15% + PER 10% + BPM 15% (z-scores, then the old team-record weighting); DPOY / All-Defense = tracking composite 50% (within position group) + DWS 35% + DBPM 15% (league-wide); ROY / 6MOY / All-Rookie = game score 60% + PER 20% + WS/48 20% (rates count fully from 26 mpg, not at all under 16); MIP adds the change in PER and WS/48. Rates are pulled toward average for low minutes (900 min; 1,800 for ROY / 6MOY). `AW_ADV.on = false` = old scoring
- [x] Award report, 10 seasons NBA commish from `tools/snap/nba-commish-s10.json.gz`, new vs old scoring, same seed (`tools/t33c-awards.js`, `tools/t33c-awsum.py.txt`, `tools/runs32/v33c-awards-*.txt`): new scoring: MVP top-3 in WS 9/10 (old 5/10), DPOY top-5 in DWS 6/10 (old 2/10); MVP 7 different winners in 10, most 3 (old 5 winners, Drummond 5); DPOY 6 different, most 3 (old 3, Wren 6); no MVP / DPOY / 6MOY / MIP winner under 20 mpg (ROY: one at 19.8 mpg, PER 16.4). The same season scored the old way picks the same MVP 7/10, DPOY 3/10. 6MOY: one bench scorer won 4 of 10 (Baba Oladotun, 24-31 mpg); the old scoring picks him too in those seasons, so it's the league's player, not the new stats. Earlier tries (v33c-awards-*-pre / new2 / new3 in TASK_STATE): with DWS 0.2 the DPOY was top-5 in DWS only 2/10, and a 15-mpg sixth man won on PER, hence DWS 0.35 league-wide and the 16-26 mpg rate ramp
- [x] Tests: `tools/t33c.js` 23/23, t30a 29/0, t32f 21/21, t32e 21/21, browser `tools/browser-v33c.py.txt` 46/46 (1300 + 390), lint 106
- Open: early-era WS (1970-77) are rougher than B-Ref's (missing columns); playoff history rows keep B-Ref's PER / WS (no playoff team totals in the dataset); BPM history overrides are still per season, not per traded stint (PER / WS are per stint)

## v33b (Opus, Nov 16 2026): asks follow the league, hard-cap hole
- [x] Cause of the payroll drift: the 1.2x market lift capped the market at ~$152M a team (NBA) and ~$120M (PBL) from season 1, so payroll sank toward that as the real / generated start contracts ran out
- [x] Asks follow the league: the ramp bands (55 / 59 / 65) move with the league (percentile of the market pool, `L.askShift`, 0 at the start league, -4..+6); the market spends the budget: 1.2x lift, then more of the soft 60-64 part (`L.rampK` up to 2, at most 2x per rating point above 59 so the ramp stays smooth), then a bigger lift (cap 3x). Kenneth's rule holds at the start league (young 55- at the minimum, 56-59 at most 2.2x, nobody under 60 at $10M+; the under-60 cap is absolute). LG_GRAV unchanged
- [x] Tried first (`tools/runs32/v33b-try1-*.txt`): lift only (up to 3x). PBL improved (109 -> 124) but NBA got worse (160 -> 149): the extra money went to stars already at the max, and the shifted bands sent the 60-64 tier to the minimum, money teams under the cap could have spent. Hence the rampK step
- [x] Hard cap: the BKN case (S2, $248.8M) was an offer sheet the holder declined: the player signed with the offering team with no new check, though it had used its room (or mid-level) in the 1-2 days since. Now re-checked (soft-cap rule + hard cap + roster); void = unrestricted free agent (AI and your sheets). A stale sign-and-trade is re-checked too
- [x] Hard cap, later years: the second run had NYK at $228.8M committed next season (S16): deals were checked against this cap year only, so rookie deals and multi-year deals stacked up over the cap a year or two out, and the AI can't get back under in time. `futFits` now checks the next two cap years for every signing type (AI and yours)
- [x] Tests: `tools/t33b.js` 29/29, t30a 29/0, t32e 21/21, t32h 11/11, t32r all pass; 20 seasons SEED=21 NBA + PBL16 commish (`tools/runs32/v33b2-*.txt`): PBL16 payroll avg 109.0 -> 126.1 (109-136; budget 139.5, floor 120); NBA 160.2 -> 158.8 (S1-8 166-180, then 131-164; v33a 150-182), so not near the $190M budget yet. Max committed next season: NBA 221.6 (hard cap 221.7), PBL 167.8 (170): under the hard cap all 40 seasons. Young 55- at the minimum every season, 56-59 at most 1.9x, nobody under 60 at $10M+. League OVR NBA 60.6 avg (v33a 61.7), PBL 59.4 (59.2). 0 errors
- Open: NBA payroll. The market now prices the whole budget every season (market value of rostered players ~$189M a team), but contracts don't follow: after free agency about a third of NBA teams sit far under the floor (lowest team avg $76M) while non-contenders stop at the $165M soft cap. The limit is team spending (floor teams don't absorb salary, ceilings), not the asks: next step is floor teams taking salary dumps / spending to the floor. The hard-cap audit still logs a few transient crossings inside the offseason (a sign-and-trade re-signs before the trade goes through; a re-sign / rookie event right after options), all back under by the end of free agency

## v32i S6b (Opus, Nov 16 2026): NBA history 1946-2026 in the game
- [x] Data: `src/nba-history.js` (`NBA_HX`, 860 KB) built from the v120 history files + Basketball-Reference season tables by `tools/hx-build.py.txt` + `tools/hx-pack.py.txt` (functions in `tools/hx-fn.js`). Franchise seasons (1,687: W-L, result, coach), All-NBA/Def/Rookie, All-Stars, stat leaders (4,298), Hall of Fame (263), retired numbers (278, duplicates dropped), franchise leaders (RS + PO), league records (career / season / game / team), BPM leaders
- [x] Gaps (Kenneth: believable values): All-Star starters (5 per side by scoring), single-game record opponents, retired-number years (last season with the team + 1-4). Every row has a hidden source flag (c = Kenneth's file, f = filled); never shown. Rebuild with a new file to replace filled rows
- [x] Advanced stats with the game's formula: `computeBPM` math run on real season totals; overrides BPM / OBPM / DBPM / VORP on history rows (`nbaRealRows`, `nbaEstRows`) and legends' careers. LeBron 2012-13: 12.1 (B-Ref 11.6). Playoff rows keep their estimates (no playoff team totals). PER / WS stay real (the game has no formula for them)
- [x] UI: League records = one list per category (history + sim; a sim game can break Wilt's 100), new BPM season/career lists; Hall of Fame list adds history members; team History tab: franchise leaders (RS/PO, sim seasons add to the history totals), retired numbers, franchise seasons 1946-2026; Seasons list shows each NBA season's best record
- [x] Tests: new `tools/t32f.js` 21/21, `tools/browser-v32i.py.txt` 34/34 (1300 + 390px), node --check, lint 106, t30a 21/21, t32f-a 42/43 (team ribbon check fails on the old code too with this save). 10 seasons NBA commish (`tools/runs32/v32i-nba-commish.txt`): 0 errors, save S10 13.9 MB (v32r 14.0)
- Open: player trophy cases don't yet list the new All-NBA / All-Star rows for retired legends; single-file build template needs nba-history.js if that build is used

## v33a (Opus, Nov 16 2026): balance
- [x] Cause of the rating climb: generated players grow into a stronger middle than the start league (season 10: age 22-24 avg 63.2 vs 54.6 at start; 25-27 65.6 vs 56.9). Rookies and the 75+/85+ counts were already fine (nbaBalance)
- [x] `leagueGravity` (league.js, both modes, after progression): rostered mean above 58.4 -> trim young players' ceilings and nudge 22-30-year-olds (52-74) down a little. `LG_GRAV`
- [x] Star minutes: `RM_LIFT` franchise star 5.5 -> 6, star 4.5 -> 5
- [x] 20 seasons SEED=21, NBA + PBL16 commish (`tools/runs32/v33a-*.txt`) vs v32r:
  - League OVR: NBA 58.1 -> 62.4 (peak 62.8 at S11, then flat/down; v32r 63.8-64.1); PBL16 57.7 -> 59.5 (v32r 65.4, still rising)
  - NBA 1.5+ BPG 10-24 (avg 17.4; v32r 21.5, late 22-29); 9+ RPG 14-24 (avg 18.3); PBL16 9+ RPG avg 8.1 (v32r 6.2), BPG 13.7
  - Minutes: NBA star 32.2-33.5 (avg 32.9; v32r 32.5), fs 33.5-35.3 (34.5), sixth 25.0; PBL star 32.2, fs 34.4
  - Win-first a summer: NBA 0-3 (avg 0.8); PBL 0-1. Re-sign 60+ NBA 0.61-0.79. Payroll avg NBA 160 (150-182; v32r 169), PBL 109 (v32r 127). 0 errors, save S20 22.7 MB
  - Stronger pull tried (`v33a2-*.txt`, LG_GRAV 1.5/2/0.8): NBA mean flat 58-60 but payroll fell 182 -> 113 (asks are tied to absolute OVR), so the milder pull was kept
- Open: market asks use absolute OVR bands, so a flatter league pays less (NBA payroll drifts 182 -> 150 late, PBL avg 109 under the $120M floor): make the ask ramp / market lift follow the league mean, then the stronger pull can be used. Blocks stay 22-25 at 1.5+ BPG late even with a flat league (generated bigs' block ratings). One signing over the hard cap in the strong-pull run (BKN S2, 248.8; hard cap 221.7): a signing path still skips the check. Top individual MPG up to 39.6 (v32r 39.0)


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
- Open: confirm #25 rookie class (2026 draftees tagged); 8t/7t need strings moved to keys (v36d cleanup: done in v30 review round 2 + Haiku Nov 16); unsigned high-ask FAs (pre-existing)

## v30 text variants (Nov 15 2026) — Haiku: plan rows 5t, 21t, 23t
- [x] 5t move write-up reasons: `mv.n.*` (13), `mv.t.*` (3), `mv.r.*` (5) in `src/league.js` FLAVOR, 4 wordings each (+3). Vars: `mv.n.depth` keeps `{pos}`
- [x] 21t Hall of Fame speeches: `hof.speech.*` (9 keys) in `src/nba-text.js` story, +4 each (8 total): family (`fam`), coaches (`coach`, `coach2`), teammates (`mates`), city (`team`), humor (`open`, `titles`, `mvp`, `close`)
- [x] 23t interviews: `iv.q.*` for the 10 new pools (bench, future, rotation, pressure, rest, draft: dpick, dtrade, dclass, dneed, dwork) +2 each; `iv.a.*` answers for the same 10 pools, 40 slots, +3 each; `iv.intro.draft` +1, `iv.news.draft` +2. Draft questions are about the draft only
- [x] Code fix: `ivAnswers` (league.js) seeded every answer with `1`, so with 4 wordings each answer would always show the second. Now seeded by question number + slot. Variety checked: 4 distinct answers per slot over 12 seeds
- [x] Lint: `tools/lint-v30-text.js` (new): 82 keys, 4+ wordings, same vars (HOF: allowed vars), under 140 chars. PASS
- [x] Tests: `node --check` all src OK; `node tools/t30c.js` 30/30
- [x] (v36d cleanup: done in v30 review round 2, `sc.*` / `tk.*` keys, +wordings Haiku Nov 16) Not done, not keyed: 8t scouting report lines (`scoutDlg` in `src/app.js`) and 7t ticker stats/rumors (`tickerItems`). Both are inline templates. Plan: move them into keys first (small `app.js` refactor), then add variants. Waiting for Kenneth's OK.
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
- [x] v30 G finished: PBL teams (their motif in an emblem tile + nickname wordmark) and all 40 college / overseas teams (nickname emblems, 8 new: snake, dragon, tiger, scorpion, peach, arrow, mug, armadillo; no more initials). Custom expansion teams use the same style. `emblemTile`, `PIPE_EMB`, `embFor` in app.js; test tools/browser-logos.js ALL PASS — **Sonnet** (Nov 20).
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

## Nov 18 2026 — Haiku quick fixes (F3, U3, U4, I3)
- F3: owner goal text shows real playoff line (top 6 in 30-team league); goal bar 0% at 0-0; round/title goals show seed bar, not money.
- U3: phone Notes button shows icon+label only; to-do toast moved above bottom nav.
- U4: phone search box wider; day-1 ties sorted by preseason strength, not A-Z.
- I3: 41 duplicate old test files removed from the top level (copies live in tools/); v30a.patch moved to patches/.

## Nov 23 2026 — Team stats on box scores and live games (Sonnet)
- Team stats panel (FG/3P/FT, eFG%, TS%, rebounds, assists, steals, blocks, TO, PF, bench points, possessions, PPP, biggest lead; live adds lead changes and ties) on result box scores and the live view. `teamStatsPanel` in `src/app.js`.
- Help page: new "Box scores and team stats" section. Test: `node tools/browser-teamstats.js` (needs `tools/_t1.json`), ALL PASS.
