// seasons are stored as 1, 2, 3... v26.6b: the base year is per league (L.y0, set by setSeasonLen). Old saves: 1999 (season 1 = "2000").
// New leagues: L.y0 = 2025, so season 1 is the 2026-27 season: yr(1) = 2026 (the year it starts), seasonName(1) = "2026-27", its draft is the 2027 draft (draftLabel).
let YEAR0 = 1999, DRAFT_OFF = 0;
const yr = s => YEAR0 + s;
const seasonName = s => DRAFT_OFF ? yr(s) + '-' + String(yr(s) + 1).slice(2) : String(yr(s));
const draftLabel = s => yr(s) + DRAFT_OFF;
// ===== Pacific Basketball League engine =====
// Ratings are 1-99. Height/wingspan in inches, weight in pounds.

const POS = ['PG', 'SG', 'SF', 'PF', 'C'];
const R = Math.random;
function rnd(a, b) { return a + R() * (b - a); }
function rint(a, b) { return Math.floor(rnd(a, b + 1)); }
function gauss(m, s) { let u = 0, v = 0; while (!u) u = R(); while (!v) v = R(); return m + s * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
function pick(a) { return a[Math.floor(R() * a.length)]; }
function wpick(items, w) { let t = 0; for (const x of w) t += x; let r = R() * t; for (let i = 0; i < items.length; i++) { r -= w[i]; if (r <= 0) return items[i]; } return items[items.length - 1]; }
const r99 = x => Math.round(clamp(x, 1, 99));

// ===== v25.6 step 0: flavor text =====
// Every line below is variant 1 = the exact text the game used before. fl(key, vars, seed) picks a variant WITHOUT using R(), so sim results never change.
// A numeric seed picks variant (seed % n); any other seed is hashed. Fill {placeholders} from vars; an unknown placeholder is left as written.
// Add variants by appending to a key's array. Keep the same {placeholders} as variant 1.
const FLAVOR = {
  // weekly report headlines (league.js updateWeekly; seed = week number)
  'wk.mvpLead': ['{name} leads the MVP race at {pts} points a game', '{name} keeps the MVP lead: {pts} pts, {reb} reb, {ast} ast', '{name} stays out front in the MVP chase', "Still {name}'s award to lose: {pts} points a game", '{name} still leads the MVP ladder at {pts} points a game'],
  'wk.mvpOpen': ['{name} opens as the MVP favorite at {pts} points a game', '{name} is the early MVP favorite at {pts} points a game', '{name} sets the pace in the MVP race: {pts} points a game', 'The MVP ladder opens with {name} on top ({pts} ppg)'],
  'wk.mvpTakeover': ['{name} overtakes {prev} atop the MVP ladder', '{name} passes {prev} for the top spot on the MVP ladder', 'New MVP leader: {name} moves ahead of {prev}', '{prev} is out of first: {name} takes over the MVP ladder', '{name} moves to the top of the MVP ladder, ahead of {prev}'],
  'wk.injury': ['{name} ({team}) is out {games} games: {injury}', 'Injury blow: {name} ({team}) will miss {games} games with {injury}', '{team} lose {name} for {games} games: {injury}', '{name} ({team}) sidelined {games} games by {injury}', '{name} ({team}) is sidelined for {games} games with {injury}'],
  'wk.riser': ['{team} surge {d} spots to #{rank} in the power rankings', "{team} are the week's biggest risers, up {d} to #{rank}", '{team} climb {d} places to #{rank}', 'Big week for {team}: up {d} to #{rank}', '{team} jump {d} spots to #{rank}'],
  'wk.faller': ['{team} slide {d} spots to #{rank}', '{team} tumble in the power rankings, down {d}', '{team} drop {d} places to #{rank}', 'Rough week for {team}: down {d} to #{rank}', '{team} fall {d} places to #{rank} in the power rankings'],
  'wk.topTake': ['{team} take over the top spot in the power rankings', 'New #1: {team} move to the top of the power rankings', '{team} grab the top spot in the power rankings', '{team} jump to #1 in the power rankings', '{team} claim first place in the power rankings'],
  'wk.topStay': ['{team} stay on top of the power rankings at {rec}', '{team} remain the team to beat ({rec})', '{team} hold the #1 spot at {rec}', 'Nobody has caught {team} yet ({rec})', '{team} keep the top spot in the power rankings ({rec})'],
  'wk.topOpen': ['{team} start on top of the power rankings at {rec}', '{team} open at #1 in the power rankings ({rec})', '{team} lead the first power rankings at {rec}', 'Power rankings open with {team} on top ({rec})', '{team} head the opening power rankings at {rec}'],
  'wk.scorer': ['{name} scored {pts} points over the week', '{name} piled up {pts} points on the week', '{pts} points in a week for {name}', '{name} led the league with {pts} points over the week', '{name} led the week with {pts} points'],
  'wk.streakW': ['{team} have won {n} in a row', '{team} are rolling: {n} straight wins', '{team} extend their winning streak to {n}', '{n} wins in a row for {team}', '{team} keep the winning run going: {n} straight'],
  'wk.streakL': ['{team} have lost {n} straight', '{team} are stuck in a {n}-game losing streak', '{n} straight losses for {team}', "{team} can't buy a win: {n} in a row lost", '{team} have dropped {n} in a row'],
  // news feed (league.js logNews calls; seed = next news number)
  'news.sign': ['{team} signed {name} ({ovr}): {yrs} yr, {amt}/yr{os}', '{team} signed {name} ({ovr}) for {yrs} yr, {amt}/yr{os}', '{name} ({ovr}) signed with {team}: {yrs} yr, {amt}/yr{os}', '{team} signed {name} ({ovr}): {yrs} yr at {amt}/yr{os}', '{name} ({ovr}) joins {team} on a {yrs}-year deal, {amt}/yr{os}'],
  'news.resign': ['{team} re-signed {name} ({ovr}): {yrs} yr, {amt}/yr{os}', '{team} re-signed {name} ({ovr}) for {yrs} yr, {amt}/yr{os}', '{name} ({ovr}) re-signed with {team}: {yrs} yr, {amt}/yr{os}', '{team} re-signed {name} ({ovr}): {yrs} yr at {amt}/yr{os}'],
  'news.extend': ['{team} extended {name}: {yrs} yr, {amt}/yr', '{team} extended {name} for {yrs} yr, {amt}/yr', '{name} extended with {team}: {yrs} yr, {amt}/yr', '{team} extended {name}: {yrs} yr at {amt}/yr'],
  'news.release': ['{team} released {name}', '{name} was released by {team}', '{team} released {name} from the roster', '{team} cut {name} loose'],
  'news.trade': ['Trade: {a} get {aGets}; {b} get {bGets}{grades}', 'Trade: {a} acquire {aGets}; {b} acquire {bGets}{grades}', 'Trade done: {a} receive {aGets}, {b} receive {bGets}{grades}', 'Trade: {b} send out {aGets}; {a} send out {bGets}{grades}', 'Deal: {a} land {aGets}, {b} land {bGets}{grades}'],
  'news.injLong': ['{name} ({team}) is out for the season: {injury}, about {games} games{next}', '{name} ({team}) is done for the season: {injury}, about {games} games{next}', 'Season over for {name} ({team}): {injury}, about {games} games{next}', '{name} ({team}) is out for the season with {injury}, about {games} games{next}', '{name} ({team}) will not play again this season: {injury}, about {games} games{next}'],
  'news.injury': ['{name} ({team}): {injury}, out {games} game{s}{ce}{extra}', '{name} ({team}) hurt: {injury}, out {games} game{s}{ce}{extra}', '{name} ({team}): {injury}, will miss {games} game{s}{ce}{extra}', 'Injury: {name} ({team}), {injury}, out {games} game{s}{ce}{extra}'],
  'news.coachFired': ['{team} fired {old} and {how} {new}{note}', '{old} is out at {team}: they {how} {new}{note}', '{team} made a change: {old} fired, {how} {new}{note}', '{team} part ways with {old}; they {how} {new}{note}'],
  'news.coachFiredHot': ['{team} fired {old} at {rec} (expected to contend) and hired {new}', 'Surprise firing: {team} let {old} go at {rec} and hired {new}', '{team} fired {old} at {rec}, a team expected to contend, and hired {new}'],
  'news.retire': ['{name}{tm} retires at {age}{inj}', '{name}{tm} calls it a career at {age}{inj}', '{name}{tm} retires, age {age}{inj}', '{name}{tm} hangs up his sneakers at {age}{inj}'],
  // deadline rumors
  'rumor.seller': ['Deadline day rumor: {team} are shopping {name} ({ovr}, {pos})', 'Deadline day rumor: {team} have {name} ({ovr}, {pos}) on the block', 'Deadline day rumor: {team} are open to moving {name} ({ovr}, {pos})', 'Deadline buzz: {team} would listen on {name} ({ovr}, {pos})'],
  // contract talk notes (league.js signConcerns; seed = player id + season)
  'neg.minutes': ["Wants minutes: he'd be about {rank}th on your depth chart (+12%)", "Expects a real rotation role: about {rank}th on your depth chart (+12%)", "Wants a steady rotation spot: about {rank}th on your depth chart (+12%)"],
  'neg.role': ['Wants a bigger role: about {rank}th on your depth chart (+5%)', 'Hopes for a bigger role: about {rank}th on your depth chart (+5%)', 'Wants a larger share of the rotation: about {rank}th on your depth chart (+5%)'],
  'neg.winner': ['Wants to win: {team} are {mode} (+{pct}%)', 'Wants a contender: {team} are {mode} (+{pct}%)', 'Wants to win now: {team} are {mode} (+{pct}%)'],
  'neg.vet': ['Veteran who wants to contend (+8%)', 'Veteran eyeing a title shot (+8%)', 'Veteran who wants a ring (+8%)'],
  'neg.happy': ['Happy here (-8%)', 'Likes it here (-8%)', 'Content with your team (-8%)'],
  'neg.unhappy': ['Unhappy here (+12%)', 'Not happy here (+12%)', 'Frustrated with the situation (+12%)'],
  'neg.loyal': ['Loyal: gives you a hometown discount', 'Loyal to the franchise: gives you a hometown discount', 'Would take less to stay home'],
  'neg.money': ["Money-first: won't take less than his asking price, and wants about 10% more to accept a team option", "Money first: won't go below his ask, and wants about 10% more for a team option"],
  // awards, milestones, Hall of Fame
  'ms.points': ['Milestone: {name} reaches {n} career points', 'Milestone: {name} scores career point {n}', 'Milestone: {name} hits {n} career points', 'Milestone: {name} notches {n} career points'],
  'ms.games': ['Milestone: {name} plays his {n}th career game', 'Milestone: {name} suits up for career game {n}', 'Milestone: {name} appears in his {n}th career game', 'Milestone: {name} logs career game number {n}'],
  'hof.induct': ['{name} is inducted into the Pacific Basketball League Hall of Fame', '{name} enters the Pacific Basketball League Hall of Fame', 'Hall of Fame: {name} is inducted into the Pacific Basketball League Hall of Fame', '{name} will join the Pacific Basketball League Hall of Fame'],
  'award.vote': ['{award}: {name}', '{award} goes to {name}', '{name} wins the {award}'],
  'award.fmvp': ['Finals MVP: {name}', '{name} is named Finals MVP', 'Finals MVP goes to {name}', 'Finals MVP honors go to {name}'],
  'award.cfmvp': ['{conf} Conference Finals MVP: {name}', '{name} is named {conf} Conference Finals MVP', '{conf} Conference Finals MVP goes to {name}', '{name} wins {conf} Conference Finals MVP'],
  // play-by-play result phrases (engine.js playGame; seed = quarter, clock and score)
  'pbp.make': ['{name} → {shot} make', '{name} → {shot} good', '{name} → {shot} drops', '{name} → {shot} splashes in'],
  'pbp.miss': ['{name} → {shot} miss', '{name} → {shot} no good', '{name} → {shot} rims out', '{name} → {shot} bricked'],
  'pbp.blocked': ['{name} → {shot} blocked by {blocker}', '{name} → {shot} swatted by {blocker}', '{name} → {shot} rejected by {blocker}', '{name} → {shot} shut down by {blocker}'],
  'pbp.turnover': ['Turnover: {name}', 'Turnover: {name} gives it away', 'Turnover: {name} loses the ball', 'Turnover: {name} coughs it up'],
  // v25.7 coach's position read (league.js positionRead; seed = team + position + season). {pos} {name} {n} {arch}
  'pr.core': ['Built around {name} at {pos}: add {arch} who complements him, not a starter who takes his minutes'],
  'pr.thin': ['Thin at {pos} ({n} in the rotation): we need {arch}'],
  'pr.need': ['{name} starts at {pos}, but the system wants {arch}'],
  'pr.set': ['{pos} is set with {name}; {arch} would only add depth'],
  // v25.8 H1 deal reasons (league.js sellLeverage / dealView; short clauses, joined by addWhy). {name} {team}
  'deal.why.asked': ['{name} asked out, so {team} will take less', '{name} wants out, and {team} know it', '{name} asked to leave, so {team} will listen to offers'],
  'deal.why.unhappy': ['{name} is unhappy at {team}', '{name} has lost faith in {team}', '{team} know {name} is unhappy'],
  'deal.why.oneYear': ['{name} has one year left, so {team} have less leverage', '{name} is in the last year of his deal', '{name} has one year left on his contract'],
  'deal.why.expiring': ['{name} is in the final year of his deal, so {team} have little leverage', '{name} is playing out his contract', '{name} is on an expiring deal'],
  'deal.why.timeline': ['{team} are rebuilding and {name} is older than their timeline', '{name} is too old for the rebuild at {team}', '{name} would not fit the timeline at {team}'],
  'deal.why.picks': ['{team} front office loves picks', '{team} value draft picks highly', '{team} are keen on picks'],
  'deal.why.winNow': ['{team} front office wants to win now', '{team} would rather have help now than picks', '{team} want players who can help now'],
  // ===== v26.5 (Opus wrote variant 1; Haiku adds 3+ per key, same {vars}). Posts are short social-media lines; quotes have no quote marks (the UI adds them). =====
  // status news (league.js statusNews). {team} {abbr} {status} {was}
  'st.oldstar': ['{team} go for it while their veteran star still has it', 'No rebuild yet: the {team} build around their aging star'],   // v27 L3
  'fd.icon.fan.upset': ['They traded {name}. I do not know this team anymore.', '{name} was {city}. Trading him feels wrong.'],   // v27 L2
  'fd.icon.beat.calm': ['The {team} have traded franchise icon {name}. It is the end of an era.', 'A franchise icon is gone: the {team} moved {name}.'],
  'st.rising': ['The {team} are winning with a young roster, and the playoffs are the goal now.', 'The {team} are ahead of the curve, a playoff team built on young legs.', 'The {team} are in the race sooner than planned, and the young players are leading it.', 'The {team} are ahead of schedule: they are in the playoff race but staying young'],
  'st.impatient': ['The {team} are tired of waiting, so they are trading for help and going for it now.', 'The {team} ownership wants wins today. The rebuild is off and the front office is buying.', 'The {team} have decided the rebuild has gone on long enough. Time to win now.', 'The {team} front office is done waiting: they cut the rebuild short and will buy now'],
  'st.patient': ['The {team} are sticking to the plan. The wins are nice, but the young core comes first.', 'The {team} will not rush it. Winning some games is fine, and the rebuild still goes on.', 'The {team} keep their long view. The record is better, but the rebuild is not finished.', 'The {team} stay patient: they are winning, but the rebuild goes on'],
  // v27 S1/S2 (Haiku S4: more variants in src/nba-text.js flavor)
  'co.sys': ['{name} ({abbr}) is changing his {side}: {from} → {to}'],
  'co.ex': ['Former player {name} is joining the coaching ranks'],
  'gm.retire': ['{abbr} general manager {name} is retiring after {n} seasons with the team'],
  'gm.hired': ['{abbr} hired {name} as general manager to replace him'],
  'st.newGM': ['The {team} fired their GM after {n} straight losing seasons; the new front office wants to win now', 'After {n} years at the bottom, the {team} have a new GM and a new plan', 'Change at the top: the {team} replaced their GM after {n} rebuilding seasons', 'The {team} owner ran out of patience: a new GM takes over after {n} losing seasons'],
  'fd.newGM.nat.calm': ['{n} losing seasons was enough. The {team} have a new GM, and the new boss will want results fast.', 'New GM for the {team}. Expect veterans and a push for the play-in.', 'The {team} rebuild is over by order of the owner. New GM, new timeline.', 'After {n} years of waiting, the {team} owner made the call: new GM.'],
  'fd.newGM.fan.happy': ['New GM! Finally. {n} years of this was too many.', 'A fresh start for the {abbr}. About time.', 'New front office, new hope. Let us go.', 'They finally made a change. I am ready to believe again.'],
  'st.grewUp': ['The {team} rebuild is over early. The young core is ready and the team is contending.', 'The {team} kids grew up quickly. The rebuild is done and the title talk starts now.', 'The {team} young core has arrived sooner than expected, and now they are contenders.', 'The {team} grew up fast: the young core has them contending'],
  // feed posts: fd.<event>.<author>.<tone>. Authors: fan, beat (team beat writer), nat (national writer), player, team (team account)
  'fd.status.beat.calm': ['Update: the {team} are {status} for now. Here is what it means for the roster.', 'Quick note: the {team} have been listed as {status}. Expect more moves this year.', 'The {team} are now {status}. The front office has not said much more yet.', 'Front office update: the {team} are now {status}.'],
  'fd.status.beat.snark': ['The {team} are {status} now, which is a plan. Nobody has explained the plan yet.', 'Well, the {team} are {status}. Hope somebody wrote down the details.', 'So the {team} went from one plan to {status}. We will see how long this one lasts.', 'So the {team} are {status} now. Bold plan. Let us see how it goes.'],
  'fd.status.beat.warm': ['The {team} are {status} now, and the young players deserve the chance to grow.', 'Good move to label the {team} {status}. Honest about where they stand.', 'The {team} are {status} now. A clear plan gives the fans something to believe in.', 'Smart call: the {team} are {status} now, and the plan makes sense.'],
  'fd.status.fan.happy': ['{abbr} fans, we are {status} now! Let us go.', 'Big news for {abbr}: {status} now. Feeling good about this.', 'Finally, {status}! Proud of this {abbr} group.', 'We are {status} now?! Finally some good news, {abbr} fans.'],
  'fd.status.fan.upset': ['Now we are {status}? Feels like we just changed plans again.', 'Another change. We are {status} now, and nobody asked the fans.', '{status} for {abbr}? I will believe it when I see it.', '{status} again. How many years do we have to wait?'],
  'fd.status.rising.nat.calm': ['The {team} are in the race sooner than most people thought. Their young players are ahead of schedule.', 'Few predicted the {team} would be this good this early. The young players are carrying a lot.', 'The {team} look ready to contend, and the young core is the reason.', 'Nobody expected the {team} in the race this soon. The kids are ahead of schedule.'],
  'fd.status.grewUp.nat.calm': ['The {team} have grown up fast. The rebuild is behind them and the young core can win now.', 'The {team} rebuild is finished. Their young players are ready to be a real contender.', 'Quick turnaround for the {team}. Those young players are ready to win now.', 'The {team} rebuild is over. That young core is ready to contend now.'],
  'fd.win.team.hype': ['WIN! {teamName} {score} over the {oppName}. {star}: {line}. Let us go!', 'We got it! {teamName} beat the {oppName} {score}. {star} had {line}.', 'Another one for the {teamName}. {score} over the {oppName}, and {star} led the way: {line}.', 'FINAL: {teamName} {score} over the {oppName}. {star}: {line}.'],
  'fd.loss.team.calm': ['Final: the {oppName} won {score}. {star} had {line}. We will clean it up and move on.', 'Tough one. We lost {score} to the {oppName}. {star} finished with {line}.', 'We fell {score} to the {oppName}. {star} had {line}. The next game matters now.', 'Final: a {score} loss to the {oppName}. {star} had {line}. Back at it next game.'],
  'fd.win.fan.happy': ['Nice win over {opp}. {star} was the best player on the floor.', 'Great night. Beat {opp}, and {star} carried us.', 'Solid win against {opp}. Thanks to {star} for another big game.', 'Good win over {opp}. {star} was everywhere tonight.'],
  'fd.win.fan.hype': ['{n} in a row! Something special is happening. {star} is HIM.', 'That is {n} straight! Nobody wants to play this team right now. {star} again!', '{n} wins in a row and {star} is on fire. Let us ride this!', '{n} straight! This team is for real. {star} is HIM.'],
  'fd.loss.fan.calm': ['Lost to {opp}. Shake it off, we play again soon.', 'Not the result we wanted against {opp}. Next game.', 'Tough night against {opp}. We will get the next one.', 'Tough loss to {opp}. On to the next one.'],
  'fd.loss.fan.upset': ['Lost to {opp}, {score}. This keeps happening. Something has to change.', 'Another loss to {opp} ({score}). The effort has to be better.', 'Dropped one to {opp}, {score}. Not good enough, and everyone knows it.', 'Lost to {opp} {score}. Something has to change, and fast.'],
  'fd.quote': ['{quote}'],
  'fd.line.nat.hype': ['{name} put up {line} against {opp}. That is elite stuff.', 'Look at {name}: {line} on {opp}. He is playing at another level.', '{name} went off for {line} against {opp}. Hard to stop right now.', '{name} just put up {line} on {opp}. Different level.'],
  'fd.trade.nat.calm': ['Trade news: {a} land {aGets}, and {b} get {bGets}.', 'Two teams made a deal: {a} receive {aGets}; {b} receive {bGets}.', 'A notable swap: {a} get {aGets}, while {b} take {bGets}.', 'Big trade: {a} get {aGets}; {b} get {bGets}.'],
  'fd.trade.beat.calm': ['Deal done: {a} acquire {aGets}; {b} acquire {bGets}.', 'Trade confirmed: {a} get {aGets}. {b} get {bGets}.', 'The trade is official. {a} get {aGets}, {b} get {bGets}.', 'Trade done: {a} get {aGets}; {b} get {bGets}.'],
  'fd.trade.fan.happy': ['We got {gets}?! Great work by the front office.', 'Big win for us: {gets}. Love this move.', '{gets} are ours now. This is what we needed!', 'We got {gets}?! Front office cooked on this one.'],
  'fd.trade.fan.upset': ['We gave up a lot for {gets}. Was it worth it?', 'So we are getting {gets}. Hope this one works out.', 'Getting {gets} for that price? I have questions.', 'We traded for {gets}? Somebody explain this to me.'],
  'fd.trade.fan.calm': ['Getting {gets} is a fair move. Let us see how it goes.', 'Mixed feelings about {gets}. Time will tell.', 'Not sure about {gets} yet. We will need a few weeks.', 'Not sure how I feel about getting {gets}. We will see.'],
  'fd.traded.in.team.hype': ['Welcome to the {team}, {name}! We are glad you are here!', '{name} is a {team} player now. Let us go!', 'Big welcome to {name}! The {team} are ready for you.', 'Welcome to the {team}, {name}!'],
  'fd.traded.player.loyal': ['Thank you, {fromCity}. I will always be grateful for this city.', '{fromCity} was home for a long time. Nothing but love for these fans.', 'Leaving {fromCity} is hard. Thanks for everything, I will miss you all.', '{fromCity} will always be home. Thank you for everything.'],
  'fd.traded.player.winner': ['Ready for a new start in {toCity}. The goal is a title.', 'New team, same goal: win. Let us chase it in {toCity}.', '{toCity} is a good place to win. I am ready to work for a ring.', 'New chapter in {toCity}. Time to chase a ring.'],
  'fd.traded.player.relief': ['Happy for a fresh start in {toCity}. Ready to get going.', 'A change of scenery in {toCity} is what I needed. Let us go to work.', 'Glad to be in {toCity}. New team, new chance.', 'Fresh start in {toCity}. Ready to get to work.'],
  'fd.traded.player.money': ['It is a job. Off to {toCity} to get paid and play.', 'Nothing personal, it is business. See you in {toCity}.', 'The contract talks are done. Now I am headed to {toCity}.', 'Business is business. On to {toCity}.'],
  'fd.traded.player.calm': ['Thank you, {fromCity}. Excited for the next chapter with the {to}.', 'I learned a lot in {fromCity}. Now I am ready to work with the {to}.', 'Thanks to everyone in {fromCity}. Looking forward to the {to}.', 'Thank you, {fromCity}. On to the next chapter with the {to}.'],
  'fd.rumor.true.nat.calm': ['Told you so: {name} is headed to {to}.', 'The rumors were right. {name} is going to {to}.', 'Confirmed: {name} has moved to {to}, as reported earlier.', 'Called it: {name} is headed to {to}.'],
  'fd.sign.team.hype': ['Welcome to {city}, {name}! Big day for this team.', '{name} is officially a member of the team in {city}. Let us go!', 'We got {name}! Welcome to {city}.', 'Welcome to {city}, {name}!'],
  'fd.resign.team.hype': ['{name} is staying in {city}! Huge for this team.', 'Big news: {name} signs on for more years in {city}.', 'Great news for {city}. {name} is back.', '{name} is staying in {city}!'],
  'fd.sign.player.money': ['Locked in for {yrs} years. The family is taken care of. Let us work.', '{yrs} years is a good deal for me. Time to get to work.', 'Happy with the {yrs}-year deal. The money side is done, now the games.', '{yrs} years. Family is set. Let us work.'],
  'fd.sign.player.winner': ['I want a ring, and this {team} group can help me get one.', 'Ready to compete for titles with the {team}. Let us go.', 'Came here to win with the {team}. That is the plan.', 'Came here to win. Let us get it, {team}.'],
  'fd.sign.player.calm': ['Looking forward to my time with the {team}.', 'Thanks for the chance. I am ready to work with the {team}.', 'I am happy to be here, and I want to help the {team} win.', 'Excited for this next step with the {team}.'],
  'fd.resign.player.loyal': ['I never wanted to be anywhere else. {city} is home.', 'Staying in {city} means a lot to me. Thank you, fans.', 'I love this city, and I am glad to keep playing in {city}.', 'Never wanted to be anywhere else. {city} forever.'],
  'fd.resign.player.money': ['The contract is done. Now I can focus on basketball.', 'Deal is signed. Time to get back to work.', 'Happy with the new deal. Now I just have to play.', 'Got my deal done. Now back to hooping.'],
  'fd.resign.player.calm': ['Glad to keep playing for the {team}.', 'Excited to be back with the {team} for another season.', 'I want to keep building something here with the {team}.', 'Happy to be back with the {team}.'],
  'fd.sign.fan.happy': ['Huge signing: {name} is ours! Love it.', '{name} is here. This makes the team better right away.', 'Yes! {name} is a great add for this roster.', 'We got {name}! Great signing.'],
  'fd.sign.fan.upset': ['{amt} a year for {name}? That is a lot of money.', 'We are paying {amt} to {name}. Hope he earns it.', '{amt} for {name}. The front office better get results.', '{amt} a year for {name}? That is a lot.'],
  'fd.resign.fan.happy': ['Great news, {name} is staying with us!', 'Glad {name} is not going anywhere. Keep him!', 'Happy to see {name} sign again. Good decision.', '{name} is staying! Love it.'],
  'fd.resign.fan.upset': ['{amt} a year to keep {name}? That is a lot.', 'Paying {amt} to keep {name}. Let us hope it pays off.', 'We re-signed {name} at {amt}. Time will tell if it was worth it.', '{amt} a year to keep {name}? We are paying too much.'],
  'fd.sign.beat.calm': ['Signing: {name} joins the {team} on {yrs} years at {amt} a year.', 'Report: {name} to the {team}, {yrs} years, {amt} a year, per the deal.', 'The {team} have signed {name}: {yrs} years, {amt} a year.', '{name} to the {team}: {yrs} years, {amt} a year.'],
  'fd.resign.beat.calm': ['Re-signing: {name} stays with the {team} on {yrs} years at {amt} a year.', 'Report: {name} will remain with the {team}, {yrs} years at {amt} a year.', 'The {team} keep {name} for {yrs} years, {amt} a year.', '{name} stays with the {team}: {yrs} years, {amt} a year.'],
  'fd.inj.beat.calm': ['Update: {name} ({team}) is expected to miss about {games} games with {injury}.', 'Injury report: {name} ({team}) is out about {games} games. The diagnosis is {injury}.', 'The {team} will be without {name} for roughly {games} games after {injury}.', '{name} ({team}) will miss about {games} games with {injury}.'],
  'fd.inj.fan.upset': ['Not {name}, not now. This season keeps getting harder.', 'Come on, {name}. We need you healthy.', 'Bad news about {name}. Hope the recovery is quick.', 'Not {name}. Not now. Get well soon.'],
  'fd.inj.player.motor': ['Back to work. This setback will make me stronger.', 'Hard days, but I am coming back better than before.', 'Every injury is a test. I plan to pass it.', 'Setback for a comeback. I will be back stronger.'],
  'fd.inj.player.calm': ['Thanks to everyone for the support. I am working hard and will return soon.', 'Thank you for the support. The team is in good hands while I recover.', 'I appreciate all the love. Getting healthy is the focus right now.', 'Thanks for all the support. I will be back soon.'],
  'fd.award.nat.calm': ['{award} goes to {name}. A strong season earned it.', 'Congrats to {name} on winning the {award}.', 'The {award} is {name}. Nobody had a better year.', '{name} is your {award}. Well earned.'],
  'fd.award.team.hype': ['The {award} is ours with {name}! Let us celebrate.', '{name} takes home the {award}! Proud of this group.', 'Huge honor: {name} wins the {award}!', 'Your {award}: {name}!'],
  'fd.award.player.humble': ['I am thankful for my teammates and my coaches. This is for them.', 'It was a team effort. I just got lucky with the moments.', 'Thank you to my family and everyone who helped me get here.', 'Could not do it without my teammates and coaches. Thank you.'],
  'fd.award.player.confident': ['I earned this {award}. There is more coming.', 'I knew I had a special season in me. The {award} is just the start.', 'The {award} is nice. The next goal is a title.', 'Put in the work, got the {award}. Not done yet.'],
  'fd.ms.team.hype': ['Big moment: {name} reaches {what}. Congrats!', '{name} hits {what}! Huge milestone for the team.', 'Congrats to {name} on reaching {what}.', '{name} reaches {what}. Congrats!'],
  'fd.promise.player.upset': ['I was told something different. The action does not match the words.', 'Promises were made. Nothing has changed yet.', 'They said one thing and then did another. Not happy about it.', 'Was told one thing. Seeing another.'],
  'fd.promise.beat.calm': ['Watch this: {name} was promised {what} and has not gotten it yet.', 'Report: {name} was told he would get {what}. So far, that has not happened.', 'Still open: {name} was promised {what}, and the team has not delivered.', 'Worth watching: {name} was promised {what}, and he is not getting it.'],
  'fd.hold.beat.calm': ['Talks are stuck: {name} is holding out, and {team} and his camp are far apart.', 'No deal yet. {name} is holding out while {team} and his agent trade offers.', 'Holdout watch: {name} wants more, and {team} are not ready to pay it.', '{name} is holding out. {team} and his camp are far apart.'],
  'fd.hold.player.money': ['Know your worth. Nothing less.', 'I am not signing for less than I am worth.', 'The price is the price. Pay the player.', 'Know your worth.'],
  'fd.hold.fan.upset': ['Just pay {name} or trade him already.', 'The holdout drags on. Sign {name} or move him.', 'Stop the drama. Pay {name} or send him somewhere else.', 'Just pay {name} already, or trade him.'],
  'fd.champ.team.hype': ['CHAMPIONS! The {team} are on top, {res} over the {opp}!', 'Title won! The {team} beat the {opp} {res}. Unreal!', 'The {team} are the best team in the league. They beat the {opp}, {res}!', 'CHAMPIONS! The {team} win it all, {res} over the {opp}!'],
  'fd.champ.nat.calm': ['The {team} won the title and beat the {opp}, {res}.', 'The {team} took the championship, defeating the {opp} {res}.', 'A title for the {team}. The {opp} fell {res}.', 'The {team} are champions. They beat the {opp} {res}.'],
  'fd.champ.fan.hype': ['We are champions! I still can not believe it!', 'Title! We did it! Best day ever.', 'Champions! Every fan earned this one.', 'WE ARE CHAMPIONS! I can not believe it!'],
  'fd.series.win.fan.hype': ['We beat the {opp}! Next round, here we come!', 'The {opp} are done! On to the next round!', 'Series win over the {opp}! This team is rolling.', 'We beat the {opp}! On to the next round!'],
  'fd.series.loss.fan.upset': ['Out of the playoffs. The front office has work to do this summer.', 'Playoffs done. Hard to take, and it is back to the drawing board.', 'That is it for this season. Time to see what changes.', 'Season over. Big summer ahead for this front office.'],
  'fd.callout.player.upset': ['Some things should be handled in the locker room, not the press.', 'I am tired of talking about it. Some people need to step up.', 'Not everyone is giving full effort. Everyone knows it.', 'Some things should stay in the locker room.'],
  'fd.press.beat': ['{coach}: {quote}'],
  // rumors (news + posts). {name} {ovr} {pos} {team} {other}
  'rumor.shop': ['Rumor: {team} are shopping {name} ({ovr}, {pos}), and {other} have made calls', 'Report: {other} have asked about {name} ({ovr}, {pos}) as {team} listen to offers', 'Rumor: {team} may move {name} ({ovr}, {pos}). {other} are among the teams calling', 'Rumor: {team} are shopping {name} ({ovr}, {pos}), and {other} have called'],
  'rumor.userShop': ['Rumor: other teams keep calling {team} about {name} ({ovr}, {pos}); {other} are the most interested', 'Rumor: {team} have received offers for {name} ({ovr}, {pos}), and {other} are leading the calls', 'Report: {name} ({ovr}, {pos}) is on the market for {team}, and {other} are the most active suitor', 'Rumor: teams are calling {team} about {name} ({ovr}, {pos}); {other} are the most interested'],
  'rumor.untouch': ['Rumor: {team} have told teams that {name} ({ovr}, {pos}) is not available', 'Rumor: {name} ({ovr}, {pos}) is not for sale, according to {team} sources', 'Rumor: {team} have shut down every call about {name} ({ovr}, {pos})', 'Rumor: {team} have told callers that {name} ({ovr}, {pos}) is off the table'],
  'rumor.interest': ['Rumor: {other} have asked about {name} ({ovr}, {pos}) at {team}', 'Report: {other} are scouting {name} ({ovr}, {pos}) from {team}', 'Rumor: {other} would like {name} ({ovr}, {pos}) if {team} make him available', 'Rumor: {other} have interest in {name} ({ovr}, {pos}) of {team}'],
  // beat reports on your team (weekly). {team} {abbr} {rec} {w} {n} {names} {name} {mpg} {status}. A .snark / .warm version of a key is used when your media reputation is low / high
  'beat.hot': ['Beat report: the {team} won {w} of their last {n} ({rec}), and the locker room is loud again', 'Beat report: a {w}-{n} run has the {team} looking like a new group ({rec})', 'Beat report: the {team} are {w} wins in {n} games, and the mood has changed ({rec})', 'Beat report: the {team} have won {w} of their last {n} and look like a different team ({rec})'],
  'beat.cold': ['Beat report: the {team} have won just {w} of their last {n} ({rec}), and questions are growing', 'Beat report: a {w}-win stretch in {n} games has the {team} searching for answers ({rec})', 'Beat report: the {team} ({rec}) have only {w} wins in {n}, and the room is quiet', 'Beat report: the {team} have won just {w} of their last {n} ({rec}), and the mood is getting tense'],
  'beat.cold.snark': ['Beat report: {w} wins in {n} games. The {team} ({rec}) still say the turnaround is coming', 'Beat report: the {team} ({rec}) went {w} wins in {n}. The plan is still a secret.', 'Beat report: {w} wins in {n}. The {team} ({rec}) are working on the slogan, not the record.', 'Beat report: {w} wins in {n} games. The {team} ({rec}) keep saying it will turn around'],
  'beat.injury': ['Beat report: the {team} are without {n} rotation players, including {names}', 'Beat report: injuries have cost the {team} {n} rotation players, {names} among them', 'Beat report: {names} are out, and the {team} are missing {n} rotation players', 'Beat report: the {team} are missing {n} rotation players, including {names}'],
  'beat.youth': ['Beat report: {name} is logging {mpg} minutes a night for the {status} {team}', 'Beat report: {name} is getting real run, {mpg} minutes a night with the {status} {team}', 'Beat report: the {status} {team} are giving {name} {mpg} minutes a night', 'Beat report: {name} is playing {mpg} minutes a night for the {status} {team}'],
  'beat.steady': ['Beat report: the {team} are at {rec}, a steady week with little drama', 'Beat report: nothing dramatic for the {team} this week ({rec})', 'Beat report: the {team} are {rec}, playing it safe', 'Beat report: the {team} sit at {rec}, steady if not spectacular'],
  'beat.steady.snark': ['Beat report: the {team} are {rec}. The front office seems to be enjoying the quiet', 'Beat report: the {team} are {rec}, and the most exciting news is the coffee machine', 'Beat report: {rec} for the {team}. Management is not in a hurry to say much', 'Beat report: the {team} are {rec}. Nobody in the front office is talking much'],
  // power-ranking blurbs. {team} {abbr} {rank} {d} {rec} {status}
  'prb.top': ['Still the team to beat at {rec}.', 'The top team in the league at {rec}.', 'Nobody has caught them at {rec}.', 'The team to beat at {rec}.'],
  'prb.up': ['Up {d} spots after a strong week.', 'Climbed {d} spots with a strong week.', 'A big jump: up {d} spots.', 'Up {d} spots on a strong week.'],
  'prb.down': ['Down {d} spots after a bad week.', 'Slipped {d} spots after a rough stretch.', 'Dropped {d} spots. Time to get things back on track.', 'Down {d} spots after a rough week.'],
  'prb.rising': ['Ahead of schedule, and still giving the young players minutes.', 'Young core is ahead of schedule and still in the race.', 'Playing the kids and winning. Ahead of schedule.', 'Ahead of schedule and still playing the kids.'],
  'prb.tank': ['Eyes on the lottery and a lot of young development.', 'Playing for next year. The lottery is the goal.', 'Development first, wins second.', 'Eyes on the lottery.'],
  'prb.rebuild': ['Young players are getting their reps.', 'Rebuilding with the young roster, patiently.', 'Growing the young group one game at a time.', 'Young players getting their reps.'],
  'prb.contend': ['A real contender at {rec}.', 'Contending at {rec}. Title talk is here.', 'Playing like a contender at {rec}.', 'A real contender at {rec}.'],
  'prb.steady': ['Holding steady at {rec}.', 'Steady at {rec}. Nothing flashy.', 'Solid, if unspectacular, at {rec}.', 'Holding steady at {rec}.'],
  // feature stories. breakout {name} {team} {ppg} {prev} {age}; streak {team} {abbr} {n} {rec}; comeback {name} {team} {injury} {games} {line}
  'feat.breakout': ['Breakout: {name} ({team}) is averaging {ppg} points a game, up from {prev} last season', 'Rising star: {name} ({team}) has jumped to {ppg} points a game, from {prev} a year ago', 'Scoring leap: {name} ({team}) is at {ppg} a game after {prev} last year', 'Breakout: {name} ({team}) is scoring {ppg} points a game, up from {prev} last season'],
  'feat.streak': ['The {team} have won {n} in a row and are now {rec}', 'Winning run: the {team} are on {n} straight, now at {rec}', 'Rolling right now: {n} straight wins puts the {team} at {rec}', 'Hot streak: the {team} have won {n} straight and sit at {rec}'],
  'feat.comeback': ['Back on the floor: {name} ({team}) returns from {injury} after {games} games and posted {line}', 'Return story: {name} ({team}) missed {games} games with {injury}, then came back with {line}', 'Comeback: {name} ({team}) is back from {injury} after {games} games: {line}', 'Comeback: {name} ({team}) is back from {injury} after {games} games: {line}'],
  // game reactions (quotes, no quote marks). {team} {opp} {oppName} {score} {coach} {star} {name} {line} {min} {avg}
  'rx.coach.win': ['We played the right way tonight. Good win for the group.', 'Happy with the effort. The guys did what we asked.', 'That was a team win. Everyone chipped in.', 'Good win. We defended and shared the ball.'],
  'rx.coach.loss': ['We did not do enough tonight. Film session tomorrow.', 'Not our night. We have to be better next time.', 'Frustrating loss. We have a lot to fix.', 'Not good enough tonight. We will look at the film.'],
  'rx.coach.blowW': ['Everybody played hard, and it showed. That is the standard.', 'When we move the ball like that, we are a tough team.', 'That is the team I want to see every night.', 'That is what we look like when everybody plays hard.'],
  'rx.coach.blowL': ['That was not acceptable. I have to do a better job.', 'We were not ready from the start. That falls on me.', 'We got beat in every way tonight. We have to fix it.', 'That was embarrassing. It starts with me.'],
  'rx.coach.closeW': ['We made the big plays when we needed them. Proud of them.', 'Close games are about the little things. We got them tonight.', 'Those last possessions were the difference. Good work by the guys.', 'We made the plays late. Proud of the guys.'],
  'rx.coach.closeL': ['A few possessions decided it. We have to finish those.', 'We were in it until the end. Now we need the last plays.', 'Close loss. We need to make one more play.', 'A couple of plays here or there. We have to finish.'],
  'rx.coach.rivalW': ['Beating {oppName} always feels a little bigger.', 'That one meant something against {oppName}. Good win.', 'Nobody wants to lose to {oppName}. We did not.', 'Always means a little more against {oppName}.'],
  'rx.coach.rivalL': ['They got the better of us tonight, {oppName}. We will be back.', 'Losing to {oppName} hurts. We have to answer.', 'Give {oppName} credit. We will see them again soon.', 'They got us tonight. We will see them again.'],
  'rx.big.confident': ['I knew I was going to get my shots. Nights like this happen.', 'When the game is on, I am ready for it. Tonight I was locked in.', 'I am feeling it right now. Keep the ball coming.', 'When I get going like that, nobody can stop me.'],
  'rx.big.humble': ['The guys set me up the whole night. I just finished the plays.', 'Thanks to the team. They kept finding me in good spots.', 'It was the team, not just me. I am grateful for the help.', 'My teammates found me. I just made the shots.'],
  'rx.lossStar.upset': ['Nobody can win by themselves. We need more from everyone.', 'I played hard, but the rest of the guys have to show up too.', 'We need more help out there. I cannot do it alone.', 'I can not do it all by myself out there.'],
  'rx.lossStar.calm': ['The loss is what matters. We will be better in the next game.', 'Stats do not mean much after a loss. Next game, let us go.', 'We have to move on quickly. There is another game coming.', 'Numbers do not matter when we lose. Next game.'],
  'rx.min.upset': ['Only {min} minutes? I think I can help more than that.', 'I played {min} minutes. That is not enough for what I bring.', 'I want more time. {min} minutes is not enough for me.', '{min} minutes? I do not get it. I need to be out there.'],
  'rx.min.calm': ['The coach decides the rotation. I will stay ready.', 'Whatever my role is, I will give it my best.', 'I trust the staff. When my number is called, I am ready.', 'Coach makes the calls. I will be ready when my number is called.'],
  'rx.young': ['I just try to keep it simple and let the game come to me.', 'The coaches give me a clear job, and I try to do it every night.', 'I am learning every game. Confidence is growing.', 'Coach trusts me, so I just play my game.'],
  'rx.rival.W': ['That one was personal. We wanted it bad.', 'Big win against a rival. The guys were ready.', 'We needed that one. It felt good.', 'We wanted this one bad.'],
  'rx.rival.L': ['That one stings. Our fans deserved better.', 'Losing to a rival always hurts. We will get the next one.', 'Not a good night. We owe them one back.', 'That one stings. We owe them one.'],
  // press conferences. Questions: press.q.<trigger> {team} {abbr} {n} {name} {opp}; press.q.player.good / bad {name} {team}
  'press.q.streakW': ['How is the team winning {n} straight games?', 'What is the secret to {n} wins in a row?', 'Is this run a sign that the team is for real?', '{n} straight wins. Is this team for real?'],
  'press.q.streakL': ['Another loss, now {n} straight. What needs to change?', 'Is {n} straight losses a sign of a bigger problem?', 'The losses keep piling up. What is the plan to fix this?', '{n} straight losses. What is going wrong?'],
  'press.q.trade': ['Why was this trade the right move for the team?', 'Did this deal change the plan for the season?', 'Is this trade a sign of a new direction?', 'What does this trade mean for the team?'],
  'press.q.deadline': ['What did you accomplish at the deadline?', 'Do you feel the roster is good enough now?', 'Did you make the moves you wanted before the deadline?', 'The deadline has passed. Are you happy with this roster?'],
  'press.q.exit': ['Where did the series get away from you against the {opp}?', 'What is your biggest lesson from the loss to the {opp}?', 'How do you explain the exit against the {opp}?', 'The season is over. What went wrong against the {opp}?'],
  'press.q.champ': ['What was the key to winning it all?', 'How does it feel to be the champions?', 'Can this team repeat next season?', 'You are champions. What does this mean to you?'],
  'press.q.star': ['What does {name} bring that the team did not have before?', 'How big is it to land {name}?', 'Why did you choose {name} for this roster?', 'You landed {name}. How big is this signing?'],
  'press.q.player.good': ['Why is {name} playing so well right now?', 'Is {name} the best he has been this year?', 'What is {name} doing differently this season?', 'What has gotten into {name} lately?'],
  'press.q.player.bad': ['Is {name} struggling, and what can he do to improve?', 'Are you worried about {name}?', 'What is the plan for {name} right now?', 'Is {name} doing enough right now?'],
  // answers: press.a.<confident|humble|deflect|callout>.<p (player question) | t (team question)>.<good | bad news>. {name} {team} {coach}
  'press.a.confident.t.good': ['We knew this was coming. This group can win every night.', 'I like where we are. The guys have earned this.', 'We are for real. Let us keep going.', 'We expected this. This group can beat anybody.'],
  'press.a.confident.t.bad': ['It is a rough patch. We will turn it around, I promise.', 'Our record does not show how good we are. We will fix it.', 'We have the talent. The results will come.', 'We will turn this around. I have no doubt about this team.'],
  'press.a.confident.p.good': ['I expect {name} to keep getting better. He is one of the best.', '{name} has been great all year, and I expect more of the same.', 'Watch {name}. He is just getting started.', '{name} is one of the best in this league, and he is just getting started.'],
  'press.a.confident.p.bad': ['{name} will be fine. He is too good to stay in a slump.', 'I am not worried about {name}. The shots will fall.', '{name} is working hard. The results will change soon.', '{name} will be fine. He is too good to stay down.'],
  'press.a.humble.t.good': ['It is only one step. We still have a lot of work to do.', 'We are grateful for the wins, but we are not satisfied.', 'The guys played well. We have to keep our feet on the ground.', 'We have not done anything yet. One game at a time.'],
  'press.a.humble.t.bad': ['We let the team down. The coaches and players all need to be better.', 'This loss is on us, and we will look at what went wrong.', 'We did not play well. I have to help the guys get there.', 'That is on me. I have to put the guys in better spots.'],
  'press.a.humble.p.good': ['{name} made the big plays. Give him the credit.', 'I just try to help {name}. He did the rest.', 'A lot of this is {name} and the work he has put in.', '{name} has put in the work, and it shows. The credit goes to him.'],
  'press.a.humble.p.bad': ['{name} and I both have work to do. We will get better together.', 'I need to help {name} more. That is my job.', 'We all have to improve, {name} too. That includes me.', 'We all have to be better, me first. {name} included.'],
  'press.a.deflect.t.good': ['We are not thinking about that. Next game.', 'Nothing has changed for us. Same routine.', 'We will take it one day at a time.', 'We are focused on the next game.'],
  'press.a.deflect.t.bad': ['I am not going to talk about that right now. Next game.', 'Our focus is on the next practice.', 'We will look at it later. For now, the next game.', 'We are focused on the next game.'],
  'press.a.deflect.p.good': ['That is a question for him. I am focused on the team.', 'I will let the play speak for itself.', 'Every guy is important. I am not picking one.', 'I am not going to single anybody out.'],
  'press.a.deflect.p.bad': ['I do not want to comment on one player right now.', 'We are a team. I will keep it that way.', 'Everyone here is working. That is all I will say.', 'I am not going to single anybody out.'],
  'press.a.callout.t.good': ['The record is good. The effort on defense has to get better.', 'We are good, but we can be much better. Some guys know who they are.', 'Some guys are coasting, and that has to stop. We can be better.', 'We are winning, but some guys are coasting. That has to stop.'],
  'press.a.callout.t.bad': ['Not everyone is playing hard enough right now. That is the truth.', 'Some of us are not showing up the way we should.', 'I have had enough of the effort. It has to change now.', 'Some guys are not playing hard enough. They know who they are.'],
  'press.a.callout.p.good': ['{name} is good, but he needs to bring more on defense.', 'I want more from {name} on the glass and on defense.', '{name} is playing well. He can be even better if he locks in on defense.', '{name} is playing well, but he can give us more on defense.'],
  'press.a.callout.p.bad': ['{name} has to play better. He knows it, and so do we.', 'I need {name} to step up. Nothing else will fix this.', 'Right now {name} is not doing enough. That needs to change.', '{name} has to be better. Simple as that.'],
  // ===== v26.6 (Opus wrote variant 1; Haiku adds 3+ per key, same {vars}). =====
  // free agency. fa.meet {name} {ovr} {pos} {teams}; fa.why.* and fd.faPick.nat.* {name} {team} {abbr} {city} {n}
  'fa.meet': ['Free agency: {name} ({ovr}, {pos}) has meetings set with {teams}', 'Free agent market: {name} ({ovr}, {pos}) is talking with {teams}', 'Pitches are in: {name} ({ovr}, {pos}) will hear from {teams}', 'Free agency: {name} ({ovr}, {pos}) is meeting with {teams}'],
  'fa.why.money': ['{name} chose the {team} for the biggest offer ({n} teams bid)', 'The money decided it: {name} signed with the {team} out of {n} bids', '{name} took the top offer from the {team} among {n} teams', '{name} picked the {team} because they paid the most ({n} teams bid)'],
  'fa.why.loyal': ['{name} re-signed with the {team} because he wanted to stay', 'Loyalty won out: {name} is staying with the {team}', '{name} chose to stay put with the {team}', '{name} went back to the {team}: he wanted to stay home'],
  'fa.why.winner': ['{name} picked the {team} for a real shot at a title', 'A contender won the bidding: {name} is headed to the {team}', '{name} wants a ring, so he chose the {team}', '{name} picked the {team} to chase a title'],
  'fa.why.role': ['{name} picked the {team}, where he gets the big role', 'The offer that won: a starring role with the {team} for {name}', '{name} wants to be the main option, and the {team} gave him that', '{name} picked the {team}, where he will be the top option'],
  'fa.why.market': ['{name} picked the {team} and the spotlight in {city}', 'Big city pull: {name} chose {city} and the {team}', 'The {team} in {city} won over {name} with the big stage', '{name} picked the {team} and the big stage in {city}'],
  'fa.why.fit': ['{name} picked the {team} as the best fit out of {n} offers', 'The {team} fit {name} best of the {n} teams in the mix', 'Fit mattered most: {name} signed with the {team} over {n} other offers', '{name} picked the {team}: the best fit of {n} offers'],
  'fd.faPick.nat.money': ['{name} to {city}. The money talked, and nobody topped the offer.', 'Big payday: {name} is going to {city} on the best offer on the table.', '{name} signs in {city}. The offer was simply too good.', '{name} to {city}. Follow the money: nobody topped their offer.'],
  'fd.faPick.nat.loyal': ['{name} is staying with the {team}. Loyalty still matters in this league.', 'Home is home: {name} will keep wearing the {team} colors.', 'The {team} keep {name}. He wanted to finish his career here.', '{name} is staying with the {team}. Loyalty still counts.'],
  'fd.faPick.nat.winner': ['{name} picks the {team}. A title chance is what he came for.', 'The {team} get {name}. He wants a ring and believes this roster can win.', '{name} is headed to the {team} to chase a championship.', '{name} picks the {team}. He wants a ring, and they can give him a shot.'],
  'fd.faPick.nat.role': ['{name} to the {team}: he will be the main piece there.', 'The {team} get {name}, who wanted a bigger role than before.', '{name} picks the {team} because he gets the keys to the offense.', '{name} to the {team}: he gets to be the guy there.'],
  'fd.faPick.nat.market': ['Big stage, big city: {name} is headed to {city}.', '{name} signs with {city} and the spotlight that comes with it.', 'Everyone wanted {name}, but he chose {city} for the bright lights.', '{name} picks {city}. Big market, big stage.'],
  'fd.faPick.nat.fit': ['The {team} won {name} over {n} suitors. The system made the choice easy.', '{name} went with the {team} from {n} offers. The roles lined up.', 'Out of {n} teams, {name} picked the {team}. Good fit on both sides.', '{name} picks the {team} out of {n} offers. It just fit.'],
  // rumors. {name} {ovr} {pos} {team} {other}; unhappy {name} {team} {teamName}
  'rumor.near': ['Rumor: {team} and {other} discussed {name} ({ovr}, {pos}), but talks have stopped', 'Rumor: a deal for {name} ({ovr}, {pos}) between {team} and {other} fell apart', 'Rumor: {other} came close to landing {name} ({ovr}, {pos}) from {team}', 'Rumor: {team} and {other} talked about {name} ({ovr}, {pos}), but the deal stalled'],
  'rumor.unhappy': ['Rumor: {name} has asked to leave the {teamName}', 'Rumor: {name} is frustrated at the {teamName} and is open to a move', 'Rumor: {name} would like a new home after a rough stretch with the {teamName}', 'Rumor: {name} is unhappy with the {teamName} and wants out'],
  'fd.rumor.fan.calm': ['Heard {other} are interested in {name}. Let us hope it happens.', 'Word is {other} want {name}. Make the call already.', 'Rumors say {other} are chasing {name}. Keep an eye on it.', 'Hearing {other} want {name}. Somebody make it happen.'],
  'fd.cryptic.player.upset': ['Some chapters close quietly. Turning the page now.', 'Not every story ends the way you planned. Time to move on.', 'You can feel when a season is over before anyone says it.', 'Sometimes you have to know when it is time for something new.'],
  // coach hot seat. {coach} {team} {abbr} {rec}
  'beat.hotseat': ['{coach} is on the hot seat: the {team} are {rec}, and patience is running out', 'Beat report: {coach} needs wins soon, with the {team} at {rec}', 'Beat report: the {team} ({rec}) have put {coach} under pressure from the front office', '{coach} is on the hot seat: the {team} are {rec} and the front office is watching'],
  'fd.hotseat.nat.calm': ['{coach} is in trouble: the {team} are {rec} and the job is on the line.', 'The {team} at {rec}. The next few weeks will decide the future of {coach}.', '{coach} may not survive the season if the {team} keep losing at {rec}.', '{coach} is on thin ice with the {team} at {rec}.'],
  'fd.hotseat.beat.calm': ['{coach} after practice: We are working on it, and the answers will come.', '{coach} after practice: I know the pressure. I just have to keep the guys focused.', '{coach} after practice: Nobody is more frustrated than me. We will fix it.', '{coach} after practice: We have to be better, and that starts with me.'],
  // storylines. return {name} {team} {old} {oldCity} {line}; race {award} {name} {prev} {pts} {rec}; retire {name} {team} {yrs}; jersey {name} {team} {num}
  'feat.return': ['First game back against the {old}: {name} ({team}) posted {line}', 'Revenge game: {name} ({team}) returned to face the {old} and scored {line}', 'Back in town: {name} ({team}) played against the {old} and recorded {line}', 'Homecoming: {name} ({team}) faced the {old} for the first time since the trade: {line}'],
  'fd.return.player.loyal': ['Thank you, {oldCity}. Always good to see the fans again.', 'Coming back to {oldCity} felt like home. Thanks for the love.', '{oldCity} made me who I am. I will always owe you for that.', 'Always love coming back to {oldCity}. Thank you for the welcome.'],
  'fd.return.player.calm': ['Strange to be on the other side tonight. Good to see everybody.', 'It felt different tonight. I just tried to play my game.', 'Nothing special, just another game. I was focused on the win.', 'Weird walking into the other locker room. Good to see everybody.'],
  'fd.return.player.upset': ['I had a lot to prove tonight, and I wanted to show it.', 'That game meant more to me than I can say. I am glad I answered.', 'Some people forget what you did for them. I just played.', 'Felt good to play here again. I had a lot to prove tonight.'],
  'fd.revenge.nat.hype': ['{name} came back and dropped {line} on the {old}. Statement game.', 'The return game is over: {name} put up {line} against the {old}.', '{name} made a point to the {old}: {line}. Wow.', '{name} came back and dropped {line} on the {old}. Revenge game.'],
  'fd.race.nat.calm': ['MVP race update: {name} has passed {prev} for the top spot.', 'The MVP ladder changed: {name} moves ahead of {prev}.', 'New favorite for MVP: {name}, ahead of {prev}.', 'New MVP favorite: {name} moves past {prev}.'],
  'fd.raceHold.nat.calm': ['{name} keeps the MVP lead at {pts} points a game.', 'Nobody has caught {name} in the MVP race yet. He is averaging {pts} points.', 'The MVP favorite is still {name}, scoring {pts} a game.', '{name} is still the MVP favorite, at {pts} points a game.'],
  'fd.retire.nat.calm': ['After {yrs} seasons, {name} is calling it a career.', '{name} retires after {yrs} seasons. A career worth remembering.', 'Hang up the sneakers: {name} retires after {yrs} years in the league.', '{name} retires after {yrs} seasons. What a career.'],
  'fd.retire.team.hype': ['Thank you, {name}. Forever a {team} legend.', 'Retirement day for {name}. The {team} will always remember him.', 'Congrats on a great career, {name}. You will always be part of the {team}.', 'Thank you, {name}. A {team} legend.'],
  'fd.jersey.team.hype': ['Retiring number {num}: {name} is a {team} legend forever!', 'Number {num} is up in the rafters. {name} gave the {team} everything.', 'The {team} honor {name} with the retired number {num}. Forever.', 'Number {num} goes to the rafters. {name}, forever a {team} legend.'],
  'pbp.steal': ['Turnover: {name} (stolen by {stealer})', 'Turnover: {stealer} steals it from {name}', 'Turnover: {name} picked off by {stealer}', 'Turnover: {stealer} jumps the pass from {name}']
};
function flHash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function fl(key, vars, seed) {
  const nv = typeof NBA_TEXT !== 'undefined' && typeof L !== 'undefined' && L && L.nba ? NBA_TEXT.flavor[key] : null;   // v27: NBA-mode text
  const v = nv && nv.length ? nv : FLAVOR[key]; if (!v || !v.length) return '';
  const h = typeof seed === 'number' && isFinite(seed) ? Math.abs(Math.floor(seed)) : flHash(String(seed == null ? '' : seed));
  return v[h % v.length].replace(/\{(\w+)\}/g, (m, k) => vars && vars[k] != null ? vars[k] : m);
}

// Name pools by origin. v25.1 mix for new players: 50% English-speaking or European (US 24, Canada/UK/Ireland/Australia/NZ 12, other Europe 14),
// 30% Filipino, 20% other (South America 8, other Asia 12). Players in existing saves keep their names. Each sub-pool has a weight (w) and hometowns (h).
const NAMES = {
  PH: { w: 30, f: ['Jose','Juan','Miguel','Rafael','Paolo','Carlo','Marco','Angelo','Jericho','Joshua','Christian','John Paul','Mark','Kevin','Jayson','Ramon','Emmanuel','Gabriel','Andres','Renz','Kyle','Jerome','Arvin','Nico','Vince','Bryan','Dominic','Rodel','Jeric','Raffy','Allen','Ronald','Joaquin','Enzo','Lance','Ivan','Matthew','Adrian','Ralph','Earl','Jun','Benjie','Dennis','Lester','Aldrin','Cedrick','Nathan','RJ','Jhon','Kiel'],
        l: ['Santos','Reyes','Cruz','Bautista','Garcia','Mendoza','Torres','Villanueva','Ramos','Aquino','Castillo','Dela Cruz','De Leon','Navarro','Salazar','Pascual','Manalo','Dizon','Soriano','Gonzales','Fernandez','Tolentino','Ocampo','Mercado','Panganiban','Macaraeg','Dimaculangan','Bernardo','Rivera','Valdez','Agustin','Javier','Espiritu','Sison','Lacson','Medina','Samonte','Cabrera','Galang','Dimagiba','Magbanua','Quiambao','Sevilla','Tumbaga','Yap','Lim','Tan','Co','Abalos','Belmonte','Cortez','Dumalag','Estrada','Fajardo','Gutierrez','Hernandez','Ilagan','Laxamana','Mangubat','Nepomuceno','Pineda','Rosales','Tiongson','Umali','Vergara','Ybanez','Zamora'],
        h: ['Quezon City','Manila','Cebu City','Davao City','Pasig','Makati','Taguig','Caloocan','Iloilo City','Bacolod','Cagayan de Oro','Zamboanga City','General Santos','Antipolo','Baguio','Angeles City','Batangas City','Lipa','Tacloban','Legazpi','Dumaguete','Olongapo','San Fernando','Tarlac City','Malolos','Lucena','Naga','Puerto Princesa','Butuan','Marikina'] },
  US: { w: 24, f: ['Marcus','Jalen','Isaiah','Malik','Andre','Caleb','Darius','Elijah','Jordan','Tyrese','Devin','Quentin','Bryce','Corey','Xavier','Jamal','Reggie','Aaron','Rashad','Terrence','Damon','Desmond','Kendall','Joel','Amari','Nate','Russell','Grant','Wesley','Shane','Darnell','Trey','Cedric','Lamar','Keon','Miles','Quincy','Tyler','Austin','Brandon','Cole','Derrick','Garrett','Hunter','Jaylen','Kobe','Landon','Mason','Noah','Tre','Cameron','Dylan','Ethan','Jaden','Keegan','Logan','Micah','Parker','Ryan','Zion', 'Dante', 'Julian', 'Malcolm', 'Trevon', 'Jabari', 'Kareem', 'Marquis', 'Demetrius', 'Tariq', 'Byron', 'Dorian', 'Calvin', 'Nolan', 'Gerald', 'Vernon', 'Lance', 'Antonio', 'Brent', 'Cody', 'Derek', 'Eric', 'Gabe', 'Jared', 'Kenny', 'Leon', 'Marvin', 'Omari', 'Sterling', 'Terrell', 'Wendell', 'Vincent', 'Otis', 'Raymond', 'Stefan'],
        l: ['Bellamy','Whitfield','Drummond','Ashby','Thornton','Holloway','Sinclair','Rutledge','Fairley','Kingsley','Barrows','Calloway','Easley','Garrity','Hargrove','Jessup','Keaton','Prescott','Quarles','Strickland','Tolliver','Underwood','Vance','Wexford','Yarbrough','Abernathy','Crenshaw','Ellery','Gentry','Lockhart','Maddox','Norwood','Winslow','Brooks','Carter','Dawson','Foster','Hayes','Jenkins','Mitchell','Parker','Robinson','Sanders','Turner','Walker','Coleman','Bryant','Henderson','Harris','Simmons','Ellis','Graham','Howard','Johnson','Lewis','Morgan','Price','Reed','Stewart','Watson', 'Abbott', 'Brewer', 'Dunmore', 'Gaines', 'Hadley', 'Kilgore', 'Lanier', 'Mabry', 'Nettles', 'Orr', 'Pruitt', 'Rhodes', 'Sheffield', 'Truitt', 'Vickers', 'Wren', 'Yancey', 'Akins', 'Bowers', 'Cummings', 'Greer', 'Hines', 'Oglesby', 'Pickett', 'Rawls', 'Sutton', 'Upshaw', 'Vaughn', 'Waller', 'Ware'],
        h: ['Chicago','Atlanta','Houston','Los Angeles','Philadelphia','Baltimore','Detroit','Indianapolis','Oakland','Brooklyn','Dallas','Memphis','New Orleans','Seattle','Phoenix','Charlotte','Louisville','Milwaukee','Raleigh','Las Vegas','Columbus','Kansas City','San Antonio','Portland','Minneapolis','Newark','Richmond','Birmingham','Denver','St. Louis'] },
  EN: { w: 12, list: [
        { c: 'CA', w: 4, f: ['Liam','Owen','Dillon','Brandon','Shai','Andrew','Tristan','Kyle','Mitchell','Connor','Evan','Jamal', 'Blake', 'Nolan', 'Gavin', 'Riley', 'Cody'], l: ['Murray','Tremblay','Bennett','McKenzie','Gagnon','Wiggins','Roy','Campbell','Fraser','Leblanc','MacLeod','Boucher', 'Pelletier', 'Lavoie', 'Thibault', 'Dubois', 'Pilon'], h: ['Toronto','Montreal','Vancouver','Hamilton','Mississauga','Ottawa','Winnipeg','Calgary','Brampton','Halifax'] },
        { c: 'GB', w: 3.5, f: ['Oliver','Harry','George','Jack','Callum','Alfie','Ethan','Reece','Kieran','Lewis','Joel','Tobi', 'Freddie', 'Archie', 'Theo', 'Charlie', 'Jacob'], l: ['Smith','Clarke','Hughes','Patel','Ward','Hall','Wright','Baker','Ellis','Okoro','Fletcher','Holt', 'Ashworth', 'Pearce', 'Greaves', 'Dunn', 'Hartley'], h: ['London','Manchester','Birmingham','Leeds','Sheffield','Glasgow','Bristol','Leicester','Newcastle','Cardiff'] },
        { c: 'IE', w: 1.5, f: ['Conor','Sean','Cian','Darragh','Eoin','Padraig','Niall','Ronan', 'Rory', 'Fionn', 'Dara'], l: ['Murphy','Kelly','Byrne','Walsh','Ryan','Doyle','Brennan','Quinn', 'Gallagher', 'Hogan', 'Keane'], h: ['Dublin','Cork','Limerick','Galway','Waterford'] },
        { c: 'AU', w: 2.5, f: ['Lachlan','Jack','Riley','Cooper','Mitchell','Dyson','Josh','Hayden','Jock','Will', 'Ky', 'Zac', 'Tom', 'Harrison', 'Tanner', 'Brodie'], l: ['Kessler','Halvorsen','Lyle','Brightwater','Daniels','Exum','Ingles','Giddey','Thybulle','Landale', 'Mackay', 'Sheridan', 'Ferrier'], h: ['Melbourne','Sydney','Brisbane','Perth','Adelaide','Canberra','Hobart','Townsville','Cairns','Geelong'] },
        { c: 'NZ', w: 0.5, f: ['Tai','Corey','Finn','Reuben','Isaac', 'Kieran', 'Sione'], l: ['Webster','Fotu','Abercrombie','Ngatai','Tuhoe', 'Taufa', 'Pomare'], h: ['Auckland','Wellington','Christchurch','Hamilton','Dunedin'] } ] },
  EU: { w: 14, list: [
        { c: 'RS', f: ['Nikola','Marko','Stefan','Luka','Bogdan','Milos','Vasilije','Uros','Aleksa','Filip', 'Dusan', 'Nemanja'], l: ['Petrovic','Jovanovic','Radovan','Dimitrov','Markovic','Ilic','Nikolic','Pavlovic','Stojanovic','Bjelica', 'Obradovic', 'Kostic'], h: ['Belgrade','Novi Sad','Nis','Kragujevac','Subotica'] },
        { c: 'LT', f: ['Andrius','Ignas','Tomas','Mindaugas','Rokas','Lukas','Deividas', 'Julius', 'Edgaras'], l: ['Sabonis','Kazlauskas','Jankunas','Valanciunas','Grigonis','Kuzminskas','Sirvydis', 'Zubrus', 'Lekavicius'], h: ['Kaunas','Vilnius','Klaipeda','Siauliai','Panevezys'] },
        { c: 'ES', f: ['Mateo','Hugo','Pablo','Alejandro','Sergio','Alvaro','Dario','Juancho', 'Adrian', 'Marin', 'Ortega'], l: ['Ibarra','Fernandez','Llull','Navarro','Garrido','Saez','Abrines','Hernangomez', 'Marin', 'Ortega'], h: ['Madrid','Barcelona','Valencia','Malaga','Bilbao','Zaragoza'] },
        { c: 'FR', f: ['Bastien','Theo','Mathis','Killian','Evan','Nolan','Rudy','Moussa', 'Enzo', 'Yanis'], l: ['Lacroix','Fontaine','Moreau','Delacroix','Bertrand','Girard','Diaw','Fournier', 'Morel', 'Lambert'], h: ['Paris','Lyon','Marseille','Nantes','Lille','Strasbourg'] },
        { c: 'DE', f: ['Lukas','Jonas','Felix','Moritz','Niklas','Johannes', 'Tim', 'Leon'], l: ['Schneider','Hartmann','Vogel','Krause','Brandt','Lange', 'Fischer', 'Wagner'], h: ['Berlin','Munich','Hamburg','Bamberg','Ulm','Cologne'] },
        { c: 'GR', f: ['Giorgos','Nikos','Kostas','Dimitris','Thanasis', 'Panagiotis', 'Stelios'], l: ['Papadakis','Antonopoulos','Vasileiou','Karras','Mitsos', 'Lambrou', 'Doukas'], h: ['Athens','Thessaloniki','Patras','Heraklion'] },
        { c: 'IT', f: ['Luca','Matteo','Alessandro','Simone','Davide', 'Federico', 'Marco'], l: ['Romano','Bianchi','Ferrari','Conti','Ricci', 'Greco', 'Marino'], h: ['Milan','Rome','Bologna','Venice','Turin'] },
        { c: 'HR', f: ['Ivan','Dario','Ante','Mario','Josip', 'Filip', 'Toni'], l: ['Horvat','Kovacic','Babic','Maric','Juric', 'Matic', 'Kukic'], h: ['Zagreb','Split','Rijeka','Zadar'] },
        { c: 'SI', f: ['Ziga','Jaka','Klemen','Matej', 'Luka', 'Anze'], l: ['Novak','Krajnc','Zupan','Vidmar', 'Kosir', 'Zajc'], h: ['Ljubljana','Maribor','Celje'] },
        { c: 'TR', f: ['Emre','Cedi','Furkan','Alperen','Mert', 'Berk', 'Kerem'], l: ['Yilmaz','Demir','Korkmaz','Aydin','Celik', 'Kaya', 'Arslan'], h: ['Istanbul','Ankara','Izmir','Bursa'] } ] },
  SA: { w: 8, list: [
        { c: 'BR', w: 2.5, f: ['Thiago','Lucas','Rafael','Bruno','Gustavo','Matheus','Leandro','Vitor', 'Caio', 'Enzo'], l: ['Silva','Souza','Oliveira','Barbosa','Nascimento','Pereira','Santos','Costa', 'Almeida', 'Rocha'], h: ['Sao Paulo','Rio de Janeiro','Belo Horizonte','Brasilia','Franca','Porto Alegre'] },
        { c: 'AR', w: 2, f: ['Facundo','Nicolas','Leandro','Tomas','Gonzalo','Luca','Juan Pablo', 'Santiago', 'Ezequiel'], l: ['Campazzo','Deck','Bolmaro','Vildoza','Laprovittola','Scola','Delia', 'Ruiz', 'Ferrer'], h: ['Buenos Aires','Cordoba','Rosario','Bahia Blanca','Mar del Plata'] },
        { c: 'VE', w: 1, f: ['Gregory','Nestor','Heissler','Windi','David', 'Jesus'], l: ['Echenique','Colmenares','Guillent','Graterol','Cubillan', 'Lugo'], h: ['Caracas','Maracaibo','Valencia','Barquisimeto'] },
        { c: 'CO', w: 1, f: ['Andres','Camilo','Sebastian','Felipe','Julian', 'Daniel', 'Mateo'], l: ['Ramirez','Moreno','Rojas','Castano','Ospina', 'Gomez', 'Herrera'], h: ['Bogota','Medellin','Cali','Barranquilla'] },
        { c: 'UY', w: 0.7, f: ['Esteban','Bruno','Joaquin','Agustin', 'Nicolas'], l: ['Batista','Fitipaldo','Osimani','Calfani', 'Pereyra'], h: ['Montevideo','Salto','Paysandu'] },
        { c: 'CL', w: 0.8, f: ['Matias','Benjamin','Vicente','Ignacio', 'Diego'], l: ['Munoz','Gonzalez','Araya','Contreras', 'Fuentes'], h: ['Santiago','Valparaiso','Concepcion'] } ] },
  AS: { w: 12, list: [
        { c: 'JP', w: 2.5, f: ['Kenji','Daiki','Haruto','Ren','Sota','Yuto','Takumi','Kaito','Riku','Shota','Yuki','Rui', 'Hiroki', 'Yusei'], l: ['Nakamura','Tanaka','Watanabe','Sato','Kobayashi','Yamamoto','Ito','Kato','Fujita','Matsuda','Hachimura','Tominaga', 'Ogawa', 'Ishida'], h: ['Tokyo','Osaka','Yokohama','Nagoya','Sendai','Fukuoka','Sapporo','Kobe'] },
        { c: 'KR', w: 1.5, f: ['Min-jun','Ji-ho','Seo-jun','Hyun-woo','Jae-won','Dong-hyun','Sung-min','Tae-yang', 'Ha-joon', 'Woo-jin'], l: ['Kim','Park','Lee','Choi','Jung','Kang','Yoon','Han', 'Shin', 'Seo'], h: ['Seoul','Busan','Incheon','Daegu','Suwon'] },
        { c: 'CN', w: 2, f: ['Wei','Hao','Jun','Lei','Ming','Tao','Yang','Zhi','Kai','Zhe', 'Jian', 'Feng'], l: ['Zhang','Wang','Li','Chen','Liu','Zhou','Huang','Xu','Guo','Sun', 'Ma', 'Zhao'], h: ['Beijing','Shanghai','Guangzhou','Shenzhen','Xinjiang','Shandong','Liaoning'] },
        { c: 'TW', w: 1, f: ['Chih-wei','Yu-hsiang','Kuan-ting','Po-chen','Chun-hsiang', 'Yi-han'], l: ['Lin','Chen','Huang','Tsai','Wu', 'Hsu', 'Liao'], h: ['Taipei','Taichung','Kaohsiung','Tainan','Taoyuan'] },
        { c: 'ID', w: 1.5, f: ['Arief','Budi','Dimas','Rizky','Bagas','Fajar', 'Galih', 'Ferdinand'], l: ['Santoso','Wijaya','Saputra','Pratama','Nugroho','Hidayat', 'Kusuma', 'Setiawan'], h: ['Jakarta','Surabaya','Bandung','Medan','Yogyakarta'] },
        { c: 'TH', w: 1, f: ['Anan','Kittisak','Somchai','Thanawat','Nattapong', 'Pongsak'], l: ['Srisuk','Chaiyaporn','Wongsa','Thongdee','Rattana', 'Phanthong'], h: ['Bangkok','Chiang Mai','Khon Kaen','Pattaya'] },
        { c: 'VN', w: 1, f: ['Minh','Tuan','Huy','Khoa','Long', 'Duc', 'Bao'], l: ['Nguyen','Tran','Le','Pham','Vo', 'Dang'], h: ['Ho Chi Minh City','Hanoi','Da Nang','Hai Phong'] },
        { c: 'MY', w: 0.8, f: ['Hafiz','Aiman','Wei Liang','Arjun', 'Syafiq'], l: ['Rahman','Tan','Ismail','Lim', 'Lee'], h: ['Kuala Lumpur','Penang','Johor Bahru','Ipoh'] },
        { c: 'LB', w: 0.7, f: ['Wael','Karim','Ali','Hayk'], l: ['Haddad','Khoury','Nasr','Saleh'], h: ['Beirut','Tripoli','Sidon'] } ] },
  // kept for nationalities in older saves; not drawn for new players
  AM: { w: 0, list: [
        { c: 'MX', f: ['Diego','Santiago','Emiliano','Luis','Jorge'], l: ['Hernandez','Lopez','Gutierrez','Rojas','Villalobos'], h: ['Mexico City','Guadalajara','Monterrey'] },
        { c: 'PR', f: ['Jose Juan','Angel','Gian','Ismael','Christian'], l: ['Rivera','Colon','Arroyo','Clemente','Ortiz'], h: ['San Juan','Bayamon','Ponce'] } ] },
  AF: { w: 0, list: [
        { c: 'NG', f: ['Emeka','Chidi','Kofi','Ayo','Sekou', 'Tunde', 'Obinna'], l: ['Okafor','Nwosu','Adeyemi','Ogunleye','Eboue', 'Balogun', 'Eze'], h: ['Lagos','Abuja'] },
        { c: 'SN', f: ['Mamadou','Cheikh','Ousmane','Abdou', 'Pape', 'Moussa'], l: ['Diallo','Ndiaye','Sow','Faye', 'Gueye', 'Ba'], h: ['Dakar','Thies'] } ] }
};
const NAT_NAME = { PH: 'Philippines', US: 'United States', JP: 'Japan', KR: 'South Korea', CN: 'China', ID: 'Indonesia', TH: 'Thailand', RS: 'Serbia', LT: 'Lithuania', ES: 'Spain', FR: 'France', NG: 'Nigeria', AU: 'Australia', DE: 'Germany', GR: 'Greece', IT: 'Italy', HR: 'Croatia', SI: 'Slovenia', TR: 'Turkey', CA: 'Canada', MX: 'Mexico', BR: 'Brazil', AR: 'Argentina', PR: 'Puerto Rico', NZ: 'New Zealand', SN: 'Senegal',
  GB: 'United Kingdom', IE: 'Ireland', VE: 'Venezuela', CO: 'Colombia', UY: 'Uruguay', CL: 'Chile', TW: 'Taiwan', VN: 'Vietnam', MY: 'Malaysia', LB: 'Lebanon' };
const NAME_POOL = {};   // country code -> sub-pool (for hometowns)
for (const g in NAMES) { if (NAMES[g].f) NAME_POOL[g] = NAMES[g]; else for (const x of NAMES[g].list) NAME_POOL[x.c] = x; }
function hometownFor(c) { const p = NAME_POOL[c]; return p && p.h ? pick(p.h) : null; }
// The country is chosen first and kept, so small name pools running out don't shift the nationality mix;
// when a pool is used up, a middle initial makes the name unique. Returns [name, country, first, last, hometown].
function genIdentity(used) {
  const grps = Object.keys(NAMES), grp = wpick(grps, grps.map(k => NAMES[k].w));
  let f, l, c, hs;
  if (NAMES[grp].f) { f = NAMES[grp].f; l = NAMES[grp].l; c = grp; hs = NAMES[grp].h; }
  else { const ls = NAMES[grp].list, sub = wpick(ls, ls.map(x => x.w != null ? x.w : 1)); f = sub.f; l = sub.l; c = sub.c; hs = sub.h; }
  const home = hs ? pick(hs) : null;
  for (let i = 0; i < 60; i++) {
    const fn = pick(f), ln = pick(l), n = fn + ' ' + ln;
    if (!used || !used.has(n)) { used && used.add(n); return [n, c, fn, ln, home]; }
  }
  for (let i = 0; i < 200; i++) {
    const fn = pick(f) + ' ' + 'ABCDEFGHJKLMNPRSTVW'[rint(0, 18)] + '.', ln = pick(l), n = fn + ' ' + ln;
    if (!used.has(n)) { used.add(n); return [n, c, fn, ln, home]; }
  }
  const k = rint(2, 99); return [f[0] + ' ' + l[0] + ' ' + k, c, f[0], l[0] + ' ' + k, home];
}
// Split a full name into first and last (handles two-word last names like "Dela Cruz")
const MULTI_LAST = ['Dela Cruz', 'De Leon'];
function splitName(name) {
  name = String(name || '').trim();
  for (const l of MULTI_LAST) if (name.endsWith(' ' + l)) return [name.slice(0, -l.length - 1), l];
  const i = name.lastIndexOf(' ');
  return i > 0 ? [name.slice(0, i), name.slice(i + 1)] : ['', name];
}
// "J. Santos": first-name initial and last name
function shortName(p) {
  const f = p.first != null ? p.first : splitName(p.name)[0], l = p.last != null ? p.last : splitName(p.name)[1];
  return (f ? f.trim()[0] + '. ' : '') + l;
}
// Playoff consistency (1-99), set once when a player is created. Low = more up-and-down in the playoffs.
function genPoc() { return r99(gauss(55, 16)); }
function genName(used) { return genIdentity(used)[0]; }

// city, nickname, abbr, region, primary, secondary, logo motif
const TEAM_DEFS = [
  ['Manila', 'Metro Stars', 'MNL', 'Luzon', '#1d3f8f', '#f2c230', 'star'],
  ['Bagong Antipolo', 'Pilgrims', 'ANT', 'Luzon', '#6b2d8f', '#e8d7a8', 'cross'],
  ['Baguio', 'Altitude', 'BAG', 'Luzon', '#1f6b4f', '#cfe8dc', 'peaks'],
  ['Tagaytay', 'Ridgebacks', 'TAG', 'Luzon', '#8a3b12', '#f0b27a', 'ridge'],
  ['Angeles City', 'Aviators', 'ANG', 'Luzon', '#2a5d9f', '#d9e4f2', 'wing'],
  ['Vigan', 'Heritage', 'VIG', 'Luzon', '#7a2e2e', '#e6cfa3', 'arch'],
  ['Legazpi', 'Mayon Express', 'LGZ', 'Luzon', '#c0392b', '#2c2c2c', 'volcano'],
  ['Cebu City', 'Navigators', 'CEB', 'Visayas', '#0f5e75', '#f4d35e', 'compass'],
  ['Iloilo', 'Dinagyang Warriors', 'ILO', 'Visayas', '#b5651d', '#1a1a1a', 'spear'],
  ['Bacolod', 'MassKara', 'BAC', 'Visayas', '#d1347a', '#f7d046', 'mask'],
  ['Tacloban', 'Valor', 'TAC', 'Visayas', '#2f3e46', '#d4a017', 'shield'],
  ['Davao', 'Durians', 'DAV', 'Mindanao', '#5b7f1a', '#e3d26f', 'durian'],
  ['Zamboanga', 'Hermosa', 'ZAM', 'Mindanao', '#c2185b', '#7ec8e3', 'flower'],
  ['Cagayan de Oro', 'Gold Rush', 'CDO', 'Mindanao', '#9a7b0a', '#1b1b1b', 'nugget'],
  ['General Santos', 'Strikers', 'GSC', 'Mindanao', '#0b4f8a', '#e74c3c', 'fist'],
  ['Batangas', 'Barako', 'BAT', 'Luzon', '#5a3825', '#e9c89a', 'bean']
];
// v21 expansion: 14 teams from capital cities nearby (8th field: conference). A new league has 30 teams; "classic" keeps the original 16.
const EXP_DEFS = [
  ['Taipei', 'Lanterns', 'TPE', 'Taiwan', '#b3202b', '#f6c544', 'lantern', 'North'],
  ['Hong Kong', 'Harbour Junks', 'HKG', 'Hong Kong', '#8c1d18', '#f4e1c1', 'junk', 'North'],
  ['Bangkok', 'Elephants', 'BKK', 'Thailand', '#2d3a8c', '#f0c419', 'elephant', 'North'],
  ['Hanoi', 'Lotus', 'HAN', 'Vietnam', '#c2477e', '#f6e7b0', 'lotus', 'North'],
  ['Macau', 'Ferries', 'MAC', 'Macau', '#0f6b5a', '#f2c14e', 'ferry', 'North'],
  ['Vientiane', 'Nagas', 'VTE', 'Laos', '#1e7a46', '#f2d16b', 'naga', 'North'],
  ['Naypyidaw', 'Peacocks', 'NPT', 'Myanmar', '#136f63', '#e8b33c', 'peacock', 'North'],
  ['Jakarta', 'Komodos', 'JKT', 'Indonesia', '#4c6b1f', '#f1d36b', 'komodo', 'South'],
  ['Singapore', 'Orchids', 'SIN', 'Singapore', '#7b2a8c', '#f4f0e6', 'orchid', 'South'],
  ['Kuala Lumpur', 'Hornbills', 'KUL', 'Malaysia', '#cf4a1a', '#1d1d1d', 'hornbill', 'South'],
  ['Phnom Penh', 'Kouprey', 'PNH', 'Cambodia', '#5a2d1a', '#e9c46a', 'kouprey', 'South'],
  ['Port Moresby', 'Paradise', 'POM', 'Papua New Guinea', '#c8102e', '#ffcc33', 'paradise', 'South'],
  ['Bandar Seri Begawan', 'Proboscis', 'BWN', 'Brunei', '#a8761a', '#203a2c', 'monkey', 'South'],
  ['Dili', 'Crocodiles', 'DIL', 'Timor-Leste', '#2e5e3a', '#d9b44a', 'croc', 'South']
];
const MARKET = { MNL: 3, CEB: 3, DAV: 3, ANT: 2, BAG: 2, ANG: 2, ILO: 2, BAC: 2, CDO: 2, GSC: 2, BAT: 2, ZAM: 2, TAG: 1, VIG: 1, LGZ: 1, TAC: 1,
  TPE: 3, HKG: 3, BKK: 3, JKT: 3, SIN: 3, HAN: 2, MAC: 2, VTE: 2, KUL: 2, PNH: 2, POM: 2, NPT: 1, BWN: 1, DIL: 1 };
const confOfDef = d => d[7] || (d[3] === 'Luzon' ? 'North' : 'South');
const leagueDefs = size => size === 16 ? TEAM_DEFS : [...TEAM_DEFS, ...EXP_DEFS];
const isBig = L => L.teams.length >= 24;   // Phase A: leagues of 24+ teams use the 30-team formats (expansion can make 18-22 or 32-36)
// v22: divisions (30-team leagues) for rivalries and division titles; the schedule is unchanged
const DIVISIONS = { Metro: ['MNL', 'ANT', 'TAG', 'BAT', 'LGZ'], 'Northern Seas': ['BAG', 'ANG', 'VIG', 'TPE', 'HKG'], Mekong: ['BKK', 'HAN', 'MAC', 'VTE', 'NPT'],
  Visayas: ['CEB', 'ILO', 'BAC', 'TAC', 'BWN'], Mindanao: ['DAV', 'ZAM', 'CDO', 'GSC', 'DIL'], Straits: ['JKT', 'SIN', 'KUL', 'PNH', 'POM'] };
const DIV_ORDER = { North: ['Metro', 'Northern Seas', 'Mekong'], South: ['Visayas', 'Mindanao', 'Straits'] };
const divOf = abbr => Object.keys(DIVISIONS).find(d => DIVISIONS[d].includes(abbr)) || null;
const MARKET_LABEL = { 3: 'Big market', 2: 'Mid market', 1: 'Small market' };
const PERS = { Loyal: 'Loyal: gives his current team a discount and is hard to pry away', Money: 'Money-first: goes to the highest bidder and asks for a bit more', Winner: 'Wants to win: takes less to join a contender', Balanced: 'Balanced: weighs money, winning and city about equally', Mentor: 'Mentor: wants to lead a young team, takes less to join one and helps its young players develop' };

const OFF_SYS = {
  pace:   { name: 'Pace & space', w: { spd: 2, tp: 2.5, agi: 1, fin: 1 } },
  inside: { name: 'Inside-out',   w: { pst: 2.5, str: 1.5, fin: 1.5, orb: 1 } },
  motion: { name: 'Motion',       w: { pas: 2.5, iq: 2, mid: 1, tp: 1 } },
  iso:    { name: 'Star / isolation', w: { hnd: 2.5, drw: 1.5, mid: 1.5, fin: 1 } }
};
const DEF_SYS = {
  switch:   { name: 'Switch everything', w: { agi: 2, per: 1.5, pdf: 1, wingB: 1.5 } },
  rim:      { name: 'Rim protection',    w: { blk: 2.5, pdf: 1.5, drb: 1, hgtB: 1.5 } },
  pressure: { name: 'Pressure / trap',   w: { stl: 2.5, spd: 1.5, per: 1 } }
};
// Shot-mix multipliers by offensive system
const SYS_SHOT = {
  pace:   { tp: 1.3, rim: 1.1, mid: 0.75, post: 0.7 },
  inside: { tp: 0.85, rim: 1.05, mid: 1.0, post: 1.6 },
  motion: { tp: 1.05, rim: 1.0, mid: 1.15, post: 0.95 },
  iso:    { tp: 0.95, rim: 1.1, mid: 1.25, post: 1.0 }
};
// System trade-offs (v14). Offense: pace = possessions added; tov = turnover multiplier; orb = offensive-rebound chance;
// foul = shooting-foul multiplier; corner = share of threes from the corners; ast = assist-chance multiplier; cs = catch-and-shoot bonus multiplier.
// Defense: what it takes away (negative) and what it gives up (positive), by shot type.
const SYS_FX = {
  off: {
    pace:   { pace: 3.5, tov: 1.04, orb: -0.02, foul: 1.0, corner: 0.36, ast: 1.0, cs: 1.0, early3: -0.008, trans: 1.2 },
    inside: { pace: -2, tov: 1.03, orb: 0.02, foul: 1.1, corner: 0.22, ast: 1.0, cs: 1.0, crowd: -0.02 },
    motion: { pace: 0, tov: 1.0, orb: 0, foul: 0.93, corner: 0.3, ast: 1.15, cs: 2.0, iqTov: 0.006 },
    iso:    { pace: -1, tov: 1.0, orb: 0, foul: 1.1, corner: 0.22, ast: 0.85, cs: 0.5 }
  },
  def: {
    switch:   { pace: 0, tp: -0.012, mid: -0.012, paintBig: 0.025, drb: 0.015 },
    rim:      { pace: 0, dunk: -0.03, lay: -0.025, paint: -0.02, mid: 0.015, tpTop: 0.01, foul: 0.9 },
    pressure: { pace: 2, tov: 1.09, lay: 0.015, tp: 0.008, foul: 1.08 }
  }
};
// Shot zones for charts: 0 restricted area; 1-3 paint (left, middle, right); 4-8 mid-range (left baseline, left elbow, top, right elbow, right baseline);
// 9-13 threes (left corner, left wing, top, right wing, right corner)
const ZONES = 14;
const SH_ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZab';   // Phase 1: shot letters for game.sh (index = zone * 2 + made)
function pickZone(type, corner) {
  if (type === 'dunk' || type === 'lay') return 0;
  if (type === 'paint') return wpick([1, 2, 3], [1, 2, 1]);
  if (type === 'mid') return wpick([4, 5, 6, 7, 8], [3, 4, 6, 4, 3]);
  return R() < corner ? (R() < 0.5 ? 9 : 13) : wpick([10, 11, 12], [1, 1.2, 1]);
}

// Position skill templates (means before talent/physical adjustments)
const TPL = {
  PG: { fin: 58, pst: 30, mid: 56, tp: 58, ft: 75, hnd: 70, pas: 70, orb: 28, drw: 52, per: 56, pdf: 30, stl: 56, blk: 24, drb: 34, t3: 55, tmd: 45, trm: 50, tps: 10, tpa: 70 },
  SG: { fin: 58, pst: 35, mid: 58, tp: 60, ft: 75, hnd: 60, pas: 54, orb: 32, drw: 52, per: 56, pdf: 36, stl: 52, blk: 30, drb: 38, t3: 60, tmd: 50, trm: 50, tps: 12, tpa: 45 },
  SF: { fin: 58, pst: 44, mid: 55, tp: 54, ft: 70, hnd: 52, pas: 48, orb: 42, drw: 50, per: 54, pdf: 46, stl: 48, blk: 38, drb: 48, t3: 50, tmd: 50, trm: 50, tps: 25, tpa: 42 },
  PF: { fin: 58, pst: 52, mid: 50, tp: 44, ft: 64, hnd: 42, pas: 42, orb: 55, drw: 50, per: 46, pdf: 55, stl: 42, blk: 50, drb: 58, t3: 38, tmd: 45, trm: 55, tps: 45, tpa: 35 },
  C:  { fin: 60, pst: 56, mid: 40, tp: 30, ft: 56, hnd: 34, pas: 40, orb: 64, drw: 52, per: 38, pdf: 62, stl: 38, blk: 60, drb: 64, t3: 15, tmd: 30, trm: 60, tps: 60, tpa: 30 }
};
const HGT_MEAN = { PG: 74.5, SG: 77, SF: 79, PF: 81, C: 83.3 };

const ATH = ['spd', 'agi', 'vrt', 'str'];
const OFF = ['fin', 'pst', 'mid', 'tp', 'ft', 'hnd', 'pas', 'orb', 'drw'];
const DEF = ['per', 'pdf', 'stl', 'blk', 'drb', 'fdc'];
const INT = ['iq', 'ocn', 'dcn', 'dur', 'wrk', 'poc'];
const TEND = ['t3', 'tmd', 'trm', 'tps', 'tpa', 'tct', 'tgb'];
const SKILL_KEYS = [...OFF, ...DEF, 'iq']; // skill attributes (age later)
const PROG_KEYS = [...ATH, ...OFF, ...DEF, 'iq'];
const LABELS = {
  hgt: 'Height', wgt: 'Weight', wing: 'Wingspan', spd: 'Speed', agi: 'Agility', vrt: 'Vertical', str: 'Strength',
  fin: 'Finishing', pst: 'Post scoring', mid: 'Mid-range', tp: '3-point', ft: 'Free throw', hnd: 'Ball handling', pas: 'Passing', orb: 'Off. rebounding', drw: 'Draw foul',
  per: 'Perimeter D', pdf: 'Post D', stl: 'Steals', blk: 'Blocks', drb: 'Def. rebounding', fdc: 'Foul discipline',
  iq: 'Basketball IQ', ocn: 'Off. consistency', dcn: 'Def. consistency', dur: 'Durability', wrk: 'Work ethic', poc: 'Playoff consistency',
  t3: '3-point', tmd: 'Mid-range', trm: 'Drive / rim', tps: 'Post-up', tpa: 'Pass', tbd: 'Ball dominance', tct: 'Contest shots', tgb: 'Go for steals', ttr: 'Run in transition', tcr: 'Crash the glass', tcl: 'Wants the ball late', tcs: 'Catch-and-shoot'
};

let NEXT_ID = 1;

// Physical modifiers
function physZ(p) {
  const bmi = p.wgt / (p.hgt * p.hgt) * 703;
  return { h: (p.hgt - 79) / 4, b: (bmi - 25.3) / 1.6, w: (p.wing - p.hgt - 3.5) / 2.3 };
}


// ===== v24.3: hidden traits and career trajectories =====
// Work ethic (6 tiers) and injury-proneness (4 tiers) are hidden and revealed by seasons in the league.
// v24.4: work ethic after p.rvlW (4-6) seasons, injury-proneness after p.rvlI (5-7); once fully revealed a trait stays revealed (p.knW / p.knI).
const V244 = { b2: true };   // feature flags (the test harness turns B2 off for a comparison run)
const WET_NAMES = ['Lazy', 'Below average', 'Average', 'Above average', 'Work horse', 'Legendary'];
const WET_W = [8, 20, 42, 20, 7.5, 2.5];                 // share of players; talent pulls the top tiers up (pickWet)
const WET_G = [0.62, 0.85, 1.0, 1.12, 1.25, 1.42];       // growth speed
const WET_R = [1.3, 1.12, 1.0, 0.9, 0.78, 0.62];         // decline speed
const WET_WRK = [28, 44, 60, 73, 86, 96];                // the work-ethic number older code still reads
const WET_STALL = [0.07, 0.03, 0, -0.02, -0.04, -0.06];  // change in the chance of a sideways year
const IPT_NAMES = ['Durable', 'Normal', 'Fragile', 'Very fragile'];
const IPT_W = [20, 55, 20, 5];
const IPT_DUR = [84, 68, 48, 30];                        // the durability number older code still reads
const IPT_INJ = [1, 1, 1.12, 1.25];                      // extra injury chance per game on top of durability
const IPT_LEN = [0.9, 1, 1.15, 1.3];                     // injury length
const IPT_REG = [0.92, 1, 1.12, 1.3];                    // decline speed
const IPT_STALL = [-0.03, 0, 0.07, 0.14];                // change in the chance of a sideways year
const TRAJ = { early: 'Early peak', std: 'Standard', late: 'Late bloomer', long: 'Long, evolving' };
// legendary work ethic is 2-3% of players, and at least a quarter of them are stars: the chance rises steeply with talent (his prime rating)
function pickWet(pot) {
  const w = WET_W.slice();
  w[4] = pot >= 78 ? 14 : pot >= 70 ? 9 : 6.5; w[5] = pot >= 78 ? 14 : pot >= 70 ? 2.4 : pot >= 62 ? 1.1 : 0.55;
  w[0] *= pot >= 78 ? 0.6 : 1;
  return wpick([0, 1, 2, 3, 4, 5], w);
}
function pickTraj(q) { return wpick(['early', 'std', 'late', 'long'], q > 1 ? [38, 40, 14, 8] : [36, 46, 12, 6]); }
// early: peaks 22-25 and fades from 27-29. standard: as before. late: peaks 27-29. long: athletic peak 25-27, then the legs go while shooting, passing and feel keep growing to 31-34
function setTraj(p, traj) {
  p.traj = traj;
  if (traj === 'early') { p.peak = rint(22, 25); p.athAge = rint(26, 28); p.regStart = Math.max(29, p.athAge + rint(1, 2)); }
  else if (traj === 'late') { p.peak = rint(27, 29); p.athAge = rint(30, 32); p.regStart = Math.max(32, p.athAge + rint(1, 3)); }
  else if (traj === 'long') { p.peak = rint(25, 27); p.athAge = rint(28, 30); p.skillPeak = rint(31, 34); p.regStart = p.skillPeak + rint(1, 3); }
  else { p.peak = rint(24, 28); p.athAge = rint(27, 31); p.regStart = Math.max(30, p.athAge + rint(1, 3)); }
}
// what a viewer knows of a hidden trait: 0 unknown, 1 a rough read (after a season), 2 exact (after 3-4 seasons in the league)
function rvlOf(p, k) { return k === 'ipt' ? (p.rvlI || 5) : (p.rvlW || 4); }
function traitLevel(p, k, extra) { k = k || 'wet'; if (k === 'ipt' ? p.knI : p.knW) return 2; const n = (p.seen || 0) + (extra || 0), r = rvlOf(p, k); return n >= r ? 2 : n >= 1 ? 1 : 0; }
// share of a hidden trait the league has seen (0-1); extra = seasons added by a physical before a trade or signing
function traitFrac(p, k, extra) { if (k === 'ipt' ? p.knI : p.knW) return 1; return clamp(((p.seen || 0) + (extra || 0)) / rvlOf(p, k), 0, 1); }
function markRevealed(p) { if (traitLevel(p, 'wet') >= 2) p.knW = true; if (traitLevel(p, 'ipt') >= 2) p.knI = true; }
function wetText(p, lv) { if (p.wet == null) return 'Unknown'; return lv >= 2 ? WET_NAMES[p.wet] : lv === 1 ? (p.wet <= 1 ? 'Leans below average' : p.wet === 2 ? 'Leans average' : 'Leans above average') : 'Unknown'; }
function iptText(p, lv) { if (p.ipt == null) return 'Unknown'; return lv >= 2 ? IPT_NAMES[p.ipt] : lv === 1 ? (p.ipt === 0 ? 'Leans durable' : p.ipt === 1 ? 'Looks normal' : 'Leans injury-prone') : 'Unknown'; }

// ===== v25.9: personality traits, 1-100 each =====
// Off the court: loyalty, money, winning, work ethic. On the court: motor, coachability, durability.
// Work ethic and durability are the existing hidden numbers (p.wrk from the work-ethic tier, p.dur from injury-proneness); the other five live in p.tr.
// p.pers stays as a label for the strongest off-court pull (persLabel), so older code and saves keep working; decisions now read the numbers (tw).
const TR_OFF = ['loy', 'mon', 'win', 'wrk'], TR_ON = ['mot', 'cch', 'dur'];
const TR_NAMES = { loy: 'Loyalty', mon: 'Money', win: 'Winning', wrk: 'Work ethic', mot: 'Motor', cch: 'Coachability', dur: 'Durability' };
const TR_LEAD = { Loyal: 'loy', Money: 'mon', Winner: 'win' };
function genTraits(p, rg) {
  const g = rg || gauss, lead = TR_LEAD[p.pers];
  const b = k => r99(g(50, 13) + (lead === k ? 27 : lead ? -4 : 0) + (p.pers === 'Balanced' ? 3 : 0));
  p.tr = { loy: b('loy'), mon: b('mon'), win: b('win'),
    mot: r99(g(55, 14) + ((p.wrk || 60) - 60) * 0.25),
    cch: r99(g(56, 14) + ((p.iq || 50) - 50) * 0.15 - Math.max(0, (p.age || 25) - 30) * 0.8) };
  if (p.pers === 'Mentor') { p.tr.cch = Math.max(p.tr.cch, 62); p.tr.loy = r99(p.tr.loy + 6); p.tr.win = r99(p.tr.win + 6); }
  p.tr.loy = Math.max(15, p.tr.loy); p.tr.mon = Math.max(15, p.tr.mon); p.tr.win = Math.max(15, p.tr.win); p.tr.mot = Math.max(15, p.tr.mot); p.tr.cch = Math.max(15, p.tr.cch);
  return p.tr;
}
function trv(p, k) { if (!p) return 50; if (k === 'wrk') return p.wrk != null ? p.wrk : 60; if (k === 'dur') return p.dur != null ? p.dur : 68; return p.tr && p.tr[k] != null ? p.tr[k] : 50; }
// 0 at 50, +1 at 80, -1 at 20 (clamped -1.2..1.6); twp keeps only the part above 50
function tw(p, k) { return clamp((trv(p, k) - 50) / 30, -1.2, 1.6); }
// centered on the league average of the trait (motor 55, coachability 56), so the average player is unchanged
const TR_MID = { mot: 55, cch: 56 };
function trc(p, k) { return clamp((trv(p, k) - (TR_MID[k] || 50)) / 30, -1.3, 1.5); }
function twp(p, k) { return Math.max(0, tw(p, k)); }
// label for the strongest off-court pull: Loyal / Money / Winner when one stands out (66+ and 8 clear), else Balanced. Mentor is its own role.
function persLabel(p) {
  if (p.pers === 'Mentor' || !p.tr) return p.pers;
  const v = [['Loyal', p.tr.loy], ['Money', p.tr.mon], ['Winner', p.tr.win]].sort((a, b) => b[1] - a[1]);
  return v[0][1] >= 66 && v[0][1] - v[1][1] >= 8 ? v[0][0] : 'Balanced';
}
// words for a 1-100 trait
function trWord(v) { return v >= 85 ? 'Elite' : v >= 70 ? 'High' : v >= 56 ? 'Above average' : v >= 45 ? 'Average' : v >= 30 ? 'Low' : 'Very low'; }

// Build a player at "prime" level, then de-age / age to current.
const BLK_KNEE = 58, BLK_TOP = 0.7;
let TOV_USE = 0.6;   // v33d: share of turnovers charged by usage (the rest to the ball handler)
function genPlayer(intendedPos, talent, age, used) {
  const t = TPL[intendedPos];
  const idn = genIdentity(used);
  const p = { id: NEXT_ID++, name: idn[0], first: idn[2], last: idn[3], nat: idn[1], home: idn[4] || undefined, age, team: null, injury: 0, injLong: false, svc: 0, hist: [], awards: [], injuries: [], tx: [], best: [], highs: {}, contracts: [],
    pers: wpick(['Loyal', 'Money', 'Winner', 'Balanced'], [20, 25, 25, 30]), num: pick([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 20, 21, 22, 23, 24, 25, 30, 31, 32, 33, 34, 35, 41, 44, 55, 77]) };
  p.hgt = Math.round(clamp(gauss(HGT_MEAN[intendedPos], 1.7), 69, 91));
  // Unicorns: a few players have unusual size for their position (tall guards, short bigs), and a very rare giant.
  // Size alone doesn't make them good; a quarter of them are also unusually mobile (or strong) for their size.
  let freak = false;
  { const r = R(), pi = POS.indexOf(intendedPos);
    if ((intendedPos === 'C' || intendedPos === 'PF') && r < 0.012) { p.hgt = rint(87, 90); p.uni = pi; p.giant = true; }
    else if (r < 0.045) {
      const up = intendedPos === 'PG' || intendedPos === 'SG' || (intendedPos === 'SF' && R() < 0.5);
      p.hgt = Math.round(clamp(HGT_MEAN[intendedPos] + (up ? 1 : -1) * rnd(3.5, 6.5), 69, 91)); p.uni = pi;
    }
    if (p.uni != null && R() < 0.25) freak = true; }
  p.wgt = Math.round(clamp(185 + (p.hgt - 75) * 8 + (intendedPos === 'C' ? 12 : intendedPos === 'PF' ? 6 : 0) + gauss(0, 13), 165, 300));
  p.wing = Math.round(clamp(p.hgt + gauss(3.5, 2.3), p.hgt - 3, p.hgt + 10));
  const z = physZ(p);
  const q = talent; // ~N(0,1) scaled
  const a = {};
  a.spd = 60 + q * 7 - z.h * 6 - z.b * 4 + gauss(0, 8);
  a.agi = 60 + q * 7 - z.h * 6 - z.b * 4 + gauss(0, 8);
  a.vrt = 58 + q * 7 - z.b * 3 + gauss(0, 9);
  a.str = 55 + q * 5 + z.b * 8 + z.h * 4 + gauss(0, 8);
  if (freak) { if (z.h > 0) { a.spd += z.h * 5; a.agi += z.h * 5; } else { a.vrt += 8 - z.h * 3; a.str += 6; } }
  for (const k of ['fin', 'pst', 'mid', 'tp', 'ft', 'hnd', 'pas', 'orb', 'drw', 'per', 'pdf', 'stl', 'blk', 'drb']) a[k] = t[k] + q * 8 + gauss(0, 8);
  // v25.2 free throws: tied to his shooting touch (3PT), a wider spread for bigs (some bricklayers, a few good shooters),
  // and a small share of non-shooters at guard and wing
  { const big = intendedPos === 'PF' || intendedPos === 'C';
    a.ft = t.ft + q * (big ? 5 : 7) + (a.tp - t.tp - q * 8) * 0.4 + gauss(0, big ? 11 : 6);
    if (!big && R() < (intendedPos === 'SF' ? 0.035 : 0.02)) a.ft -= rnd(12, 24); }
  a.blk += z.h * 4 + z.w * 4 + (a.vrt - 58) * 0.15;
  if (a.blk > BLK_KNEE) a.blk = BLK_KNEE + (a.blk - BLK_KNEE) * BLK_TOP;   // v33d: generated bigs' top end matched to real ones (p90 67 -> ~64, p95 72 -> ~68; real 64 / 67), median unchanged
  a.pdf += z.h * 3 + z.b * 3;
  a.orb += z.h * 3 + z.w * 1.5; a.drb += z.h * 3 + z.w * 1.5;
  a.per += z.w * 3; a.stl += z.w * 3;
  a.fin += (a.vrt - 58) * 0.15;
  a.fdc = 64 + q * 3 + gauss(0, 10);
  a.iq = 55 + q * 7 + gauss(0, 9);
  a.ocn = 58 + q * 3 + gauss(0, 12); a.dcn = 58 + q * 3 + gauss(0, 12);
  a.dur = 65 + gauss(0, 14); a.wrk = 60 + gauss(0, 15);
  // v25.3 crossover stars: rare trait with a big lift in one skill, paid back elsewhere so overall stays the same
  { const XR = { hub: 0.06, rebG: 0.04, pointW: 0.045, rebW: 0.04 }, XM = q >= 1 ? 2 : 1; let xo = null;
    if ((intendedPos === 'PF' || intendedPos === 'C') && R() < XR.hub * XM) xo = 'hub';
    else if ((intendedPos === 'PG' || intendedPos === 'SG') && R() < XR.rebG * XM) xo = 'rebG';
    else if (intendedPos === 'SF') { const r = R(); if (r < XR.pointW * XM) xo = 'pointW'; else if (r < (XR.pointW + XR.rebW) * XM) xo = 'rebW'; }
    const XL = { hub: { pas: 70 - t.pas + 4, hnd: (70 - t.hnd) * 0.45, iq: 6 }, rebG: { drb: 64 - t.drb, orb: (64 - t.orb) * 0.5, pas: 8, vrt: 4, str: 5 }, pointW: { pas: 70 - t.pas + 2, hnd: 10, iq: 4 }, rebW: { drb: 64 - t.drb, orb: (64 - t.orb) * 0.5, str: 4 } };
    const XPAY = { hub: ['per', 'blk', 'spd', 'agi'], rebG: ['tp', 'mid', 'ft'], pointW: ['tp', 'per', 'stl'], rebW: ['tp', 'hnd', 'mid'] };
    if (xo) { p.xo = xo; const pi = POS.indexOf(intendedPos); for (const k in a) p[k] = r99(a[k]); const o0 = ovrAt(p, pi);
      const pa0 = a.pas; for (const k in XL[xo]) a[k] += XL[xo][k] * (0.85 + R() * 0.3); p.xoPas = Math.round(a.pas - pa0);
      for (const k in a) p[k] = r99(a[k]);
      const PAY = XPAY[xo];
      for (let i = 0; i < 60 && ovrAt(p, pi) > o0 + 0.3; i++) { const k = PAY[i % PAY.length]; a[k] -= 1; p[k] = r99(a[k]); } } }
  for (const k in a) p[k] = r99(a[k]);
  // v24.3: hidden work-ethic and injury-proneness tiers (the numbers older code reads are set from the tier); veterans start partly observed
  p.ipt = wpick([0, 1, 2, 3], IPT_W); p.dur = r99(IPT_DUR[p.ipt] + gauss(0, 4));
  p.rvlW = rint(4, 6); p.rvlI = rint(5, 7); p.seen = clamp(age - 20, 0, 7);
  p.poc = genPoc();
  // Tendencies: template + skill pull
  // v25.4 2b: the random part of each shot tendency is kept (p.tv) so tendencies can follow skills later; a good shooter sometimes just doesn't shoot much
  p.tk = intendedPos; p.tv = { t3: gauss(0, 10), tmd: gauss(0, 10), trm: gauss(0, 10), tps: gauss(0, 10) };
  if (p.tp >= 62 && R() < 0.2) p.tv.t3 -= rnd(10, 18);
  const qk = shotQuirk(p, intendedPos);   // v35: habits that don't follow the skills (a finishing big who would rather pass or shoot jumpers, a gunner, ...)
  { const tg = tendTarget(p); for (const k of TEND_K) p[k] = r99(tg[k]); }
  p.tpa = r99(t.tpa + (p.pas - t.pas) * 0.6 + gauss(0, 10) + (qk.tpa || 0));
  p.tct = r99(60 + gauss(0, 12));
  p.tgb = r99(45 + (p.stl - 50) * 0.5 + gauss(0, 12));
  addTendencies(p);
  // Hidden values
  // v24.3: career trajectory (early peak, standard, late bloomer, long and evolving) sets the peak and decline ages
  setTraj(p, pickTraj(q));
  p.path = devPath();
  p.regr = wpick([0.6, 1.0, 1.5], p.traj === 'early' ? [15, 55, 30] : p.traj === 'late' ? [35, 50, 15] : p.traj === 'long' ? [45, 45, 10] : [25, 55, 20]); // slow / usual / fast decliner
  p.regrLabel = p.regr < 1 ? 'Slow' : p.regr > 1 ? 'Fast' : 'Usual';
  assignPositions(p);
  p.pot = ovr(p);
  p.wet = pickWet(p.pot); p.wrk = r99(WET_WRK[p.wet] + gauss(0, 4));   // v24.3: work-ethic tier, skewed toward the most talented
  genTraits(p); p.pers = persLabel(p);   // v25.9
  setBallDominance(p);
  // De-age young players (below peak) and age older ones
  if (age < p.peak) {
    const yrs = Math.min(p.peak - age, 6);
    const f = Math.pow(1 - rnd(0.025, 0.045), yrs);
    for (const k of PROG_KEYS) p[k] = r99(p[k] * f);
    // a young player's real ceiling is uncertain: some won't reach it
    p.pot = Math.round(p.pot + gauss(0, 2));
  } else if (age > p.regStart) {
    for (let y = p.regStart; y < age; y++) regressYear(p, y);
  }
  assignPositions(p);
  p.ovr = ovr(p);
  if (p.pot < p.ovr) p.pot = p.ovr;
  p.stats = {};
  p.arch = archetypes(p);
  p.scout = p.pot;
  setCeil(p);
  return p;
}

// How much the offense runs through a player: handling, passing, scoring and IQ, shaded by position
function setBallDominance(p) {
  const score = Math.max(p.fin, p.mid, p.tp, p.pst);
  p.tbd = r99(42 + (p.hnd - 50) * 0.35 + (p.pas - 50) * 0.2 + (score - 55) * 0.3 + (p.iq - 50) * 0.1 + [10, 4, 0, -6, -10][p.pos] + gauss(0, 7));
}
function domWeight(g, p) {
  const skill = 0.45 * eff(g, p, 'hnd') + 0.55 * Math.max(eff(g, p, 'fin'), eff(g, p, 'mid'), eff(g, p, 'tp'), eff(g, p, 'pst'));
  return Math.pow(Math.max(5, p.tbd) / 50, 1.5) * Math.pow(Math.max(10, skill) / 60, 1.0) * (p.xo === 'hub' ? 3.0 : p.xo === 'pointW' ? 1.6 : 1);   // v25.3
}
// Position from height and skill profile
function assignPositions(p) {
  const big = (p.pst + p.pdf + p.blk + p.orb + p.drb) / 5;
  const small = (p.hnd + p.pas + p.tp + p.per) / 4;
  const h = p.hgt + clamp((big - small + 4) / 14, -3, 3);
  const cuts = [74.1, 77.2, 80.4, 83.6];
  let prim = 0; while (prim < 4 && h >= cuts[prim]) prim++;
  if (prim === 0 && p.pas < 48) prim = 1;
  if (prim === 4 && p.hgt < 80) prim = 3;
  if (p.keepPos != null) { const hp = prim; p.pos = p.keepPos; if (p.pos2 === p.pos || (p.pos2 != null && Math.abs(p.pos2 - p.pos) > 1)) p.pos2 = null; if (p.pos2 == null && Math.abs(hp - p.pos) === 1) p.pos2 = hp; return; }   // v27 U13: real NBA players keep their listed position (a 6-6 PG was moved to SG and lost 5-7 overall in his first summer)
  if (p.uni != null) {   // unicorns keep the position they play; size can add a second one next to it
    const hp = prim; prim = p.uni; p.pos = prim; p.pos2 = Math.abs(hp - prim) === 1 ? hp : null; return;
  }
  let sec = null;
  if (prim > 0 && h - cuts[prim - 1] < 0.7) sec = prim - 1;
  else if (prim < 4 && cuts[prim] - h < 0.7) sec = prim + 1;
  p.pos = prim; p.pos2 = sec;
}
function posLabel(p) { return POS[p.pos] + (p.pos2 != null ? '/' + POS[p.pos2] : ''); }

// Overall rating by slot (position weights)
const OVR_W = {
  0: { fin: 1, mid: 1, tp: 1.4, ft: 0.4, hnd: 1.8, pas: 1.8, drw: 0.6, per: 1.3, stl: 0.7, iq: 1.2, spd: 1, agi: 0.9, pst: 0.1, orb: 0.1, drb: 0.3, pdf: 0.2, blk: 0.1, vrt: 0.3, str: 0.2 },
  1: { fin: 1.1, mid: 1.2, tp: 1.6, ft: 0.4, hnd: 1.1, pas: 0.9, drw: 0.6, per: 1.4, stl: 0.7, iq: 1, spd: 0.9, agi: 0.9, pst: 0.2, orb: 0.2, drb: 0.4, pdf: 0.3, blk: 0.2, vrt: 0.4, str: 0.3 },
  2: { fin: 1.2, mid: 1.1, tp: 1.3, ft: 0.3, hnd: 0.8, pas: 0.7, drw: 0.6, per: 1.3, stl: 0.6, iq: 1, spd: 0.7, agi: 0.8, pst: 0.5, orb: 0.4, drb: 0.7, pdf: 0.7, blk: 0.4, vrt: 0.5, str: 0.6 },
  3: { fin: 1.3, mid: 0.8, tp: 0.8, ft: 0.3, hnd: 0.4, pas: 0.5, drw: 0.6, per: 0.7, stl: 0.4, iq: 1, spd: 0.4, agi: 0.5, pst: 1.1, orb: 1, drb: 1.3, pdf: 1.2, blk: 0.9, vrt: 0.6, str: 1 },
  4: { fin: 1.4, mid: 0.4, tp: 0.3, ft: 0.2, hnd: 0.2, pas: 0.4, drw: 0.6, per: 0.4, stl: 0.3, iq: 1, spd: 0.3, agi: 0.3, pst: 1.3, orb: 1.3, drb: 1.6, pdf: 1.6, blk: 1.6, vrt: 0.5, str: 1.2 }
};
function ovrAt(p, slot) {
  const w = OVR_W[slot]; let s = 0, t = 0;
  for (const k in w) { s += p[k] * w[k]; t += w[k]; }
  let v = s / t;
  // spread out: average player ~55, elite ~85+
  v = 55 + (v - 52) * 1.6;
  return r99(v);
}
function ovr(p) { return ovrAt(p, p.pos); }
// Rating when playing a slot, with out-of-position penalty
function slotRating(p, slot) {
  const k = p.ovr + '|' + p.age + '|' + p.pos + '|' + p.pos2;
  let m = SR_C.get(p); if (!m || m.k !== k) { m = { k, a: [] }; SR_C.set(p, m); }
  if (m.a[slot] != null) return m.a[slot];
  const base = ovrAt(p, slot);
  let v = base;
  if (!(slot === p.pos || slot === p.pos2)) { const d = Math.min(Math.abs(slot - p.pos), p.pos2 != null ? Math.abs(slot - p.pos2) : 9); v = base - (d === 1 ? 4 : d === 2 ? 10 : 18); }
  m.a[slot] = v; return v;
}
function posPenalty(p, slot) { // multiplier on ratings in-game
  if (slot === p.pos || slot === p.pos2) return 1;
  const d = Math.min(Math.abs(slot - p.pos), p.pos2 != null ? Math.abs(slot - p.pos2) : 9);
  return d === 1 ? 0.95 : d === 2 ? 0.88 : 0.8;
}

// System fit 0-99
function sysVal(p, w) {
  const z = physZ(p); let s = 0, t = 0;
  for (const k in w) {
    let v = k === 'wingB' ? 60 + z.w * 12 : k === 'hgtB' ? 60 + z.h * 12 : p[k];
    s += v * w[k]; t += w[k];
  }
  return s / t;
}
// cached per player (keyed on what can change it) because games ask for these thousands of times a day
const FIT_C = new WeakMap(), SR_C = new WeakMap();
// Game balance: night-to-night swings, how much a big lead relaxes the leader (and pushes the trailer), team chemistry weight
const ENG = { zone: { dunk: 0.80, lay: 0.55, paint: 0.44, mid: 0.445, tp: 0.350 }, sysD: { switch: -0.003, rim: 0.0045, pressure: -0.001 }, rebSlope: 0.003, grudge: 1.5, rival: 1.0, dLoad: 20, useTax: 1.0, drift: 0.004, knee: 85, kneeSlope: 0.5, sys: { pace: -0.0005, motion: 0.006, iso: 0, inside: -0.005 }, pace: 0.93, tov: 0.113, tovSlope: 0.018, slope: 1.3, formSd: 0.22, teamNight: 2.2, relax: 0.005, relaxCap: 0.09, relaxFrom: 8, chem: 1, b2bO: 0.8, b2bD: 0.6, b2bInj: 1.25, hurtBase: 1.5, hurtPer: 1.5, hurtInj: 1.5, aggr: 0.04, ato: 0.03, hackFt: 37, hackStart: 0.15, ftA: 0.30, ftB: 0.0068, mix: { rim: 0.833, post: 1.59, mid: 0.686, tp: 1.145, corner: 0.85 }, c3: 0.034, atb3: 0.005, bg: { tp: [42, 18, 0.08], mid: [38, 18, 0.2] }, tpSlope: 0.0036, orbPow: 1.1, drbPow: 1.0, rebPos: [0.9, 0.92, 1, 1.05, 1.12], teamReb: 0.06, blkK: 1.9, blkPow: 1.2, blkSel: 1.6, shareCap: 0.25, shareK: 5 };   // v36a: shareCap / shareK (shot share past which a shot is passed on), useTax 0.5 -> 1.0 (volume costs more efficiency): top usage 40-47% -> 36-38.5%, top PER 36.5-40.2 -> 34.9-36.4 (one season from the S10 save, SEED 21-23)   // v32b blocks: was 1 / 1.4 / 2.2 (6 players at 1.5+ BPG, 2.6 a team)   // v32b: rebound / block shares (tuned below)   // v25.4: big-man gate, lower 3P%   // v25.2: shot mix and three-point zone offsets   // v24.8: after-timeout play bonus, hack-a-player   // v24.7: playing hurt   // v24.6: back-to-back fatigue
// v27 K5: the coach's sliders tilt what his system wants (more threes -> shooting, crash -> offensive boards, motion -> passing / IQ, iso -> handle / draw, gamble -> steals, pack paint -> blocks, run off the line -> perimeter D, pace -> speed)
const SL_W_C = new WeakMap();
function slWeights(coach) {
  if (ENG_TICK) { const y = SL_W_C.get(coach); if (y && y.tick === ENG_TICK) return y; }
  const sd = slD(coach), key = sd.key + '|' + (coach.pace || 99); const m = SL_W_C.get(coach); if (m && m.key === key) { m.tick = ENG_TICK; return m; }
  const o = { ...OFF_SYS[coach.off].w }, d = { ...DEF_SYS[coach.def].w }, add = (w, k, x) => { if (x) w[k] = Math.max(0, (w[k] || 0) + x); };
  add(o, 'tp', 2 * sd.three); add(o, 'fin', 1.5 * sd.rim); add(o, 'pst', sd.rim); add(o, 'str', 0.5 * sd.rim); add(o, 'orb', 1.5 * sd.glass);
  add(o, 'pas', 1.5 * Math.max(0, sd.ball)); add(o, 'iq', Math.max(0, sd.ball)); add(o, 'hnd', 1.5 * Math.max(0, -sd.ball)); add(o, 'drw', Math.max(0, -sd.ball));
  add(o, 'spd', clamp(((coach.pace || 99) - 99) / 7, -1, 1));
  add(d, 'stl', 1.5 * sd.gamble); add(d, 'blk', 1.5 * Math.max(0, sd.help)); add(d, 'per', 1.2 * Math.max(0, -sd.help));
  const r = { key, o, d, tick: ENG_TICK }; SL_W_C.set(coach, r); return r;
}
function fit(p, coach) {
  if (ENG_TICK) { const y = FIT_C.get(p); if (y && y.tick === ENG_TICK && y.c === coach) return y.v; }
  const W = slWeights(coach), k = W.key + coach.off + '|' + coach.def + '|' + p.ovr + '|' + p.age + '|' + p.pos;
  const m = FIT_C.get(p); if (m && m.k === k) { m.tick = ENG_TICK; m.c = coach; return m.v; }
  const o = sysVal(p, W.o), d = sysVal(p, W.d);
  const v = r99(55 + ((o + d) / 2 - 52) * 1.6);
  FIT_C.set(p, { k, v, tick: ENG_TICK, c: coach }); return v;
}
function playerValue(p, coach, slot) {
  const r = slot == null ? p.ovr : slotRating(p, slot);
  let v = 0.75 * r + 0.25 * fit(p, coach);
  if (coach.youth > 0 && p.age <= 24) v += coach.youth * 1.5;
  if (coach.youth < 0 && p.age >= 28) v += -coach.youth * 1.5;
  return v;
}

// ===== Progression (applied in the offseason) =====
// v24.5: superstar (85+) count kept near 7-9 a season: growth above 84 keeps only part of its gain, and elite primes lean slightly down
const ELITE = { knee: 84, keep: 0.5, prime: 0.002 };
function eliteTaper(cur, gain) { if (gain <= 0) return gain; const top = cur + gain; if (top <= ELITE.knee) return gain; const below = Math.max(0, ELITE.knee - cur); return below + (gain - below) * ELITE.keep; }
// v24.4: a major injury (25+ games) costs about 1 ovr (x0.6 durable to x1.6 very fragile, doubled by another major in the previous 2 seasons),
// capped at 2.5 per injury and 4 a season. A developing player loses it from his growth, everyone else from athleticism.
// About half is rust that comes back the next offseason (p.rust), half is permanent.
const INJ_TOLL = { base: 1, cap: 2.5, seasonCap: 4, rust: 0.5 };
function dropOvr(p, amt, keys) {
  const d0 = {}; for (const k of keys) d0[k] = p[k];
  const goal = ovr(p) - amt;
  for (let i = 0; i < 8 && ovr(p) > goal + 0.25; i++) { const f = Math.min(0.06, (ovr(p) - goal) / Math.max(20, ovr(p)) * 2.2); for (const k of keys) p[k] = r99(p[k] * (1 - f)); }
  const d = {}; for (const k of keys) if (p[k] !== d0[k]) d[k] = d0[k] - p[k]; return d;
}
function injuryToll(p, season, majors, ipt, developing) {
  const prior = (p.injuries || []).some(x => x.games >= 25 && x.s < season && x.s >= season - 2);
  const se = (p.injuries || []).some(x => x.s === season && x.games >= gpq(50)) ? 1.5 : 1;   // v24.5: season-ending injuries count 1.5x (same caps)
  const per = Math.min(INJ_TOLL.cap, INJ_TOLL.base * [0.6, 1, 1.25, 1.6][ipt] * (prior ? 2 : 1) * se * rnd(0.8, 1.2));
  const tot = Math.min(INJ_TOLL.seasonCap, per * majors);
  const keys = developing ? PROG_KEYS.filter(k => k !== 'iq') : ATH;
  const d = dropOvr(p, tot, keys), rust = {};
  // v24.5 fix: a developing player regrows toward his ceiling anyway, so his permanent half comes off the ceiling and no rust is stored
  // (v24.4 returned the rust on top of the regrowth, which could push young players past where they should end up)
  if (developing) { if (p.ceil != null) p.ceil = Math.max(ovr(p), Math.round(p.ceil - tot * (1 - INJ_TOLL.rust))); }
  else { for (const k in d) { const r = Math.round(d[k] * INJ_TOLL.rust); if (r > 0) rust[k] = r; }
    if (Object.keys(rust).length) p.rust = { s: season, d: rust, amt: r1(tot * INJ_TOLL.rust) }; }
  (p.injToll = p.injToll || []).push({ s: season, amt: r1(tot), dev: developing });
}
// Hidden development path: boom (reaches his potential, a few go past it), average (most of the way), bust (stalls well short)
function devPath() { return wpick(['boom', 'avg', 'bust'], [20, 55, 25]); }
// v27 P2-P4: NBA-mode progression knobs (tuned with tools/s20.js to 4-5 at 90+, 8-10 at 85+, ~30 at 75+ after 10-20 seasons)
const NBA_PROG = { avg: [0.55, 0.85], bust: [0.25, 0.55], brk: 0.045, brkAmt: [3, 7], drop: 0.035, dropAmt: [3, 6], bloom: 0.025, potCut: { top: 2, first: 4, rest: 3 } };
// v27 P3: swings. Development is not a smooth curve: a breakout summer, a lost year, a late bloom, an early fall-off
function devSwing(p, age) {
  const k = NBA_PROG, o0 = ovr(p);
  if (age <= 25 && R() < k.brk * (p.wet != null && p.wet >= 4 ? 1.4 : 1)) { growTo(p, o0 + rnd(k.brkAmt[0], k.brkAmt[1]), age); p.ceil = Math.max(p.ceil || 0, ovr(p) + rint(0, 4)); p.swing = 'breakout'; return; }
  if (age >= 26 && age <= 28 && R() < k.bloom && o0 < 78) { p.ceil = Math.max(p.ceil || 0, o0 + rint(4, 9)); p.peak = Math.max(p.peak, age + rint(1, 2)); p.swing = 'bloom'; return; }
  if (R() < k.drop * (age <= 24 ? 0.6 : age >= 29 ? 1.4 : 1) * (p.ipt != null && p.ipt >= 2 ? 1.5 : 1)) { growTo(p, o0 - rnd(k.dropAmt[0], k.dropAmt[1]), Math.max(age, 26)); if (age <= 24) p.ceil = Math.max(ovr(p) + 1, (p.ceil || p.pot) - rint(2, 6)); p.swing = 'drop'; return; }
  p.swing = null;
}
function setCeil(p) {
  if (!p.path) p.path = devPath();
  if (p.athAge == null) { p.athAge = clamp((p.regStart || 30) - rint(1, 2), 28, 32); }
  const gap = Math.max(0, p.pot - p.ovr);
  // about 30% of busts are severe (more likely with poor work ethic or durability): they slide below where they started
  if (p.path === 'bust' && p.severe == null) p.severe = R() < (p.wrk < 50 || p.dur < 50 ? 0.42 : 0.24);
  if (p.path === 'bust' && p.severe && !p.bloom) { p.ceil = Math.max(25, p.ovr - rint(1, 6)); return; }
  if (p.bloom) { p.ceil = Math.max(p.pot, rint(65, 74)); p.peak = Math.max(p.peak, rint(26, 28)); return; }
  const nk = typeof NBA_ON !== 'undefined' && NBA_ON ? NBA_PROG : null;   // v27 P4: NBA mode thins the middle (avg / bust paths reach less of the gap)
  p.ceil = Math.round(p.path === 'boom' ? p.pot + (R() < 0.3 ? rint(1, 3) : 0) : p.path === 'avg' ? p.ovr + gap * (nk ? rnd(nk.avg[0], nk.avg[1]) : rnd(0.72, 0.92)) : p.ovr + gap * (nk ? rnd(nk.bust[0], nk.bust[1]) : rnd(0.4, 0.65)));
}
const linOvr = o => (o - 55) / 1.6 + 52;
// move the growable ratings until overall reaches the target (athletic ratings stop growing at about 25)
const EVOLVE = { tp: 2.2, mid: 2, ft: 1.6, pas: 1.8, hnd: 1.5, iq: 2, per: 1.4, pst: 1.3, drw: 1.3 };   // v24.3: what an evolving player keeps adding
function growTo(p, target, age, bias) {
  const w = {}; let any = false;
  for (const k of PROG_KEYS) { w[k] = ATH.includes(k) && age >= Math.min(p.peak, 25) ? 0 : rnd(0.6, 1.4) * ((bias && bias[k]) || 1); if (w[k]) any = true; }
  if (!any) return;
  for (let i = 0; i < 6; i++) {
    const cur = ovr(p); if (Math.abs(target - cur) < 0.5) break;
    const f = linOvr(target) / Math.max(5, linOvr(cur)) - 1;
    for (const k of PROG_KEYS) if (w[k]) p[k] = r99(p[k] * (1 + f * w[k] * 1.15));
    assignPositions(p);
  }
}
// Newer tendencies: running in transition, crashing the offensive glass, wanting the ball late, catch-and-shoot vs pull-up
// v25.4 2b: where a player's shot tendencies sit for his current skills (template for his creation position + skill pull + his own random part)
const TEND_K = ['t3', 'tmd', 'trm', 'tps'];
function tendBase(p) {
  const t = TPL[p.tk] || TPL[POS[p.pos]];
  return { t3: t.t3 + (p.tp - t.tp) * 0.8, tmd: t.tmd + (p.mid - t.mid) * 0.6, trm: t.trm + (p.fin - t.fin) * 0.6 + (p.spd - 60) * 0.3, tps: t.tps + (p.pst - t.pst) * 0.6 };
}
// v35: about 1 in 3 players gets a shot habit that doesn't follow his skills. Shifts the kept random part (p.tv), so it lasts as skills change.
const QUIRK = {
  big: [['perim', 0.11, { t3: [10, 20], tmd: [8, 14], trm: [-14, -8], tps: [-10, -5] }], ['shyPass', 0.09, { trm: [-18, -10], tps: [-14, -8], tpa: [12, 20] }],
    ['midBig', 0.08, { tmd: [14, 22], t3: [-6, 0], tps: [-6, 0] }], ['paintOnly', 0.08, { t3: [-16, -8], tmd: [-12, -6], trm: [6, 12], tps: [4, 10] }]],
  wing: [['gunner', 0.09, { t3: [10, 16], tmd: [-6, -2] }], ['midLover', 0.08, { tmd: [12, 20], t3: [-10, -4] }], ['slash', 0.07, { trm: [10, 16], t3: [-8, -3] }],
    ['passer', 0.07, { tpa: [12, 18], t3: [-6, -2], tmd: [-6, -2] }], ['avoid', 0.05, { trm: [-14, -8], t3: [4, 8] }]]
};
function shotQuirk(p, ip) {
  const L = QUIRK[ip === 'PF' || ip === 'C' ? 'big' : 'wing'], r = R(); let acc = 0;
  for (const [id, pr, sh] of L) { acc += pr; if (r < acc) { const o = {}; for (const k in sh) { const v = rnd(sh[k][0], sh[k][1]); if (k === 'tpa') o.tpa = v; else p.tv[k] += v; } p.qk = id; return o; } }
  return {};
}
function tendTarget(p) { const b = tendBase(p), o = {}; for (const k of TEND_K) o[k] = b[k] + ((p.tv && p.tv[k]) || 0); return o; }
function fillTv(p) { if (p.tv) return; const b = tendBase(p); p.tv = {}; for (const k of TEND_K) p.tv[k] = p[k] - b[k]; }   // old saves: no jump
function driftTendencies(p) { fillTv(p); const tg = tendTarget(p); for (const k of TEND_K) p[k] = r99(p[k] + 0.2 * (r99(tg[k]) - p[k])); }
function addTendencies(p) {
  if (p.ttr == null) p.ttr = r99(50 + (p.spd - 60) * 0.5 + gauss(0, 12));
  if (p.tcr == null) p.tcr = r99(40 + (p.orb - 50) * 0.6 + gauss(0, 12));
  if (p.tcl == null) p.tcl = r99(55 + gauss(0, 14));
  if (p.tcs == null) p.tcs = r99(55 + (p.tp - p.mid) * 0.4 - (p.hnd - 55) * 0.3 + gauss(0, 12));
}
// v24.9 training focus. Growth still goes toward the same ceiling (the overall gain doesn't change), but the focus skills get most of it.
// A big working on his shot can become a stretch five over 2-3 seasons; free throws gate how far his three can go.
const FOCUS = {
  bal: { n: 'Balanced', k: {} }, shoot: { n: 'Shooting range', k: { tp: 2, mid: 1.6, ft: 1.4 } }, handle: { n: 'Ball handling', k: { hnd: 2.6, pas: 1.3 } },
  play: { n: 'Playmaking', k: { pas: 2.6, iq: 1.8, hnd: 1.3 } }, finish: { n: 'Finishing', k: { fin: 2.6, drw: 1.8 } }, post: { n: 'Post game', k: { pst: 2.6, str: 1.4 } },
  perD: { n: 'Perimeter defense', k: { per: 2.6, stl: 1.8 } }, rim: { n: 'Rim protection', k: { blk: 2.6, pdf: 2 } }, reb: { n: 'Rebounding', k: { drb: 2.6, orb: 2.2 } },
  cond: { n: 'Conditioning', k: { spd: 1.6, agi: 1.6, vrt: 1.4, str: 1.4 } }
};
const FOCUS_KEYS = Object.keys(FOCUS);
function focusBias(p) { const f = FOCUS[p.focus]; if (!f || p.focus === 'bal') return null; const b = {}; for (const k of PROG_KEYS) b[k] = f.k[k] || 0.6; return b; }
// v25.3: with no chosen focus, growth leans toward his style (primary archetype)
function styleBias(p) {
  const b = {};   // v25.3d: crossovers lean to their archetype label like everyone else
  const a = p.arch && p.arch[0], w = a && typeof ARCH !== 'undefined' && ARCH[a.p] && ARCH[a.p][a.n];   // a.p: the label can come from his second position
  if (!w) return null;
  for (const k of PROG_KEYS) b[k] = 1 + 0.3 * (w[k] || 0);
  return b;
}
const FT_GATE = 15;   // a shooting focus can't push his 3-point rating more than 15 above his free throw
// v27 U13 (NBA mode): decline starts gently and speeds up; stars lose less (skill and feel hold while the legs go): about -1.5 to -2.5 a year from the early 30s, faster after 36
const NBA_AGE = { base: 0.8, star: 0.8, starAt: 80, ramp: [0.55, 0.75, 0.9], late: 36, lateK: 1.25 };
function nbaRegK(p, ageNow) { const y = Math.max(0, ageNow - (p.regStart || ageNow)), A = NBA_AGE; return A.base * (ovr(p) >= A.starAt ? A.star : 1) * (A.ramp[y] != null ? A.ramp[y] : 1) * (ageNow >= A.late ? A.lateK : 1); }
function regressYear(p, ageNow) {
  const tm = (p.wet != null ? WET_R[p.wet] : 1) * (p.ipt != null ? IPT_REG[p.ipt] : 1) * (typeof NBA_ON !== 'undefined' && NBA_ON ? nbaRegK(p, ageNow) : 1);   // v24.3: work ethic and injury-proneness set how fast he declines
  for (const k of PROG_KEYS) {
    const athletic = ATH.includes(k);
    let pct = rnd(0.02, 0.05) * p.regr * tm * (athletic ? 1.3 * (p.focus === 'cond' ? 0.8 : 1) : k === 'iq' ? 0 : k === 'ft' || k === 'tp' || k === 'mid' || k === 'pas' ? 0.5 : 0.8);   // v24.9: conditioning slows the athletic part
    if (k === 'iq') pct = -rnd(0, 0.01); // IQ can still creep up
    p[k] = r99(p[k] * (1 - pct));
  }
}
function progressPlayer(p, coach, season) {
  const age = p.age; // age during the season just finished
  const dev = coach ? coach.dev : 0; // -2..+2
  const changes = {};
  // v24.4: last season's injury rust comes back first
  if (p.rust) { for (const k in p.rust.d) p[k] = r99(p[k] + p.rust.d[k]); p.rust = null; p.ovr = ovr(p); }
  fillTv(p);
  const before = {}; for (const k of PROG_KEYS) before[k] = p[k];
  const athAge = p.athAge != null ? p.athAge : p.regStart;
  // v24.3: hidden traits. Work ethic sets growth and decline speed; injury-proneness adds decline and stalls, and a major injury (25+ games) costs athleticism
  const wet = p.wet != null ? p.wet : null, ipt = p.ipt != null ? p.ipt : 1;
  const tm = (wet != null ? WET_R[wet] : 1) * IPT_REG[ipt];
  const majors = season != null ? (p.injuries || []).filter(x => x.s === season && x.games >= 25).length : 0;
  if (age >= p.regStart) {
    regressYear(p, age);
  } else if (age >= athAge) {
    // athletic decline starts first; skills hold. A long, evolving career keeps adding shooting, passing and feel while the legs go.
    const evolving = p.traj === 'long' && age < (p.skillPeak || p.regStart);
    if (p.holdOvr == null) p.holdOvr = ovr(p);
    for (const k of PROG_KEYS) p[k] = r99(p[k] * (ATH.includes(k) ? 1 - rnd(0.02, 0.045) * p.regr * tm * (p.focus === 'cond' ? 0.75 : 1) : 1 + (evolving ? rnd(0.004, 0.016) : rnd(-0.01, 0.012))));
    if (evolving) { const cur = ovr(p), tgt = cur + eliteTaper(cur, Math.min(p.holdOvr - rnd(0.5, 2) - 0.4 * (age - athAge), cur + 3) - cur); if (cur < tgt - 0.5) growTo(p, tgt, age, EVOLVE); }
  } else if (age >= p.peak) {
    const lean = (wet != null ? [-0.004, -0.002, 0, 0.001, 0.002, 0.003][wet] : 0) - (ovr(p) >= ELITE.knee ? ELITE.prime : 0);   // v24.5: elite primes drift a little down
    for (const k of PROG_KEYS) p[k] = r99(p[k] * (1 + rnd(-0.01, 0.01) + lean));
  } else {
    // growth toward his hidden ceiling, spread over the years left before his peak
    const ceil = p.ceil != null ? p.ceil : p.pot, cur = ovr(p);
    const yrsLeft = Math.max(1, (p.traj === 'late' ? p.peak : Math.min(p.peak, 27)) - age);
    const wg = wet != null ? WET_G[wet] : 0.85 + p.wrk / 400;
    let gain = (p.severe ? ceil - cur : Math.max(0, ceil - cur)) / yrsLeft * rnd(0.75, 1.3) * wg * (1 + dev * 0.08 * clamp(1 + 0.3 * trc(p, 'cch'), 0.65, 1.45)) * (1 + 0.12 * trc(p, 'cch')) * ((coach && coach.minK) || 1);   // v26.6 R1: coach dev 0.06 -> 0.08 per point; minutes multiplier (minK)   // v25.9: coachable players get more from coaching
    if (R() < 0.1 + IPT_STALL[ipt] + (wet != null ? WET_STALL[wet] : 0) + Math.min(0.3, 0.1 * majors)) gain = rnd(-1.5, 0.5);   // some years go sideways (more often with a lazy or fragile player)
    if (p.gen && gain > 0) gain = Math.min(gain, p.rocket ? 9 : 5.5);
    gain = eliteTaper(cur, gain);   // v24.5: growth past 84 comes harder   // v24.3: generational rookies climb steadily; only a rare 'rocket' makes a 3-year jump to 85+
    growTo(p, cur + gain, age, focusBias(p) || styleBias(p));   // v24.9: training focus steers where the growth goes
  }
  if (typeof NBA_ON !== 'undefined' && NBA_ON) devSwing(p, age);   // v27 P3
  // v24.9: focused work adds to the focus skills (more for young players, some in his prime and early decline), paid for by other skills so overall stays put
  if (p.focus && p.focus !== 'bal' && p.focus !== 'cond' && age < (p.regStart || 31)) {
    const fk = Object.keys(FOCUS[p.focus].k).filter(k => k !== 'iq' && !ATH.includes(k)), wg2 = wet != null ? WET_G[wet] : 1, o0 = ovr(p);
    const amt = (age < p.peak ? rnd(1, 2.5) : rnd(0.4, 1.4)) * wg2;
    if (fk[0]) p[fk[0]] = r99(p[fk[0]] + amt); if (fk[1]) p[fk[1]] = r99(p[fk[1]] + amt * 0.5);
    if (p.focus === 'shoot' && p.pos >= 3) { p.tp = r99(p.tp + rnd(0.3, 1.2) * wg2 * (age < p.peak ? 1 : 0.6)); p.mid = r99(p.mid + rnd(0.3, 1) * wg2); }   // the stretch-five path
    const payK = (p.pos >= 3 ? ['pst', 'orb', 'drb', 'pdf', 'fin'] : ['fin', 'per', 'drb', 'stl', 'mid']).filter(k => !fk.includes(k) && !(k in FOCUS[p.focus].k));
    for (let i = 0; i < 12 && ovr(p) > o0 + 0.3 && payK.length; i++) { const k = payK[i % payK.length]; p[k] = r99(p[k] - 1); }
  }
  if (p.focus === 'shoot' && p.tp > before.tp && p.tp > p.ft + FT_GATE) p.tp = Math.max(before.tp, p.ft + FT_GATE);
  if (majors) injuryToll(p, season, majors, ipt, age < p.peak);
  // very rarely a player's work ethic changes by a tier (injury-proneness never does)
  let wetChange = null;
  if (wet != null && age >= 20 && R() < 0.007) {
    const nw = clamp(wet + (R() < (age <= 25 ? 0.6 : age >= 31 ? 0.35 : 0.5) ? 1 : -1), 0, 5);
    if (nw !== wet) { wetChange = [wet, nw]; (p.wetHist = p.wetHist || []).push({ s: season, from: wet, to: nw }); p.wet = nw; p.wrk = r99(WET_WRK[nw] + gauss(0, 4)); }
  }
  // mileage: players 28+ with heavy career minutes (regular season and playoffs) wear down a little faster
  if (age >= 28 && p.mileage > gpq(18000)) { const m = clamp((p.mileage - gpq(18000)) / gpq(14000), 0, 1);   /* v26.6: scaled to season length */ for (const k of PROG_KEYS) if (k !== 'iq') p[k] = r99(p[k] * (1 - (ATH.includes(k) ? 0.02 : 0.008) * m)); }
  // weight drift with age, which feeds speed/agility through the physical modifiers
  if (age >= 27) p.wgt = Math.round(clamp(p.wgt + gauss(1, 3), 160, 310));
  p.age++;
  const oldPos = posLabel(p);
  assignPositions(p);
  driftTendencies(p);   // v25.4 2b: tendencies follow the skills, 20% a summer
  p.ovr = ovr(p);
  if (p.ovr > p.pot) p.pot = p.ovr;
  for (const k of PROG_KEYS) if (p[k] !== before[k]) changes[k] = p[k] - before[k];
  if (p.focus && p.focus !== 'bal') { const d = {}; for (const k of Object.keys(FOCUS[p.focus].k)) d[k] = Math.round(p[k] - before[k]); p.focusLog = { s: season, k: p.focus, d }; } else p.focusLog = null;
  return { changes, wetChange, posChanged: oldPos !== posLabel(p) ? oldPos + ' → ' + posLabel(p) : null };
}

// ===== League creation =====
let COACH_ID = 1;
// After loading a save: continue coach IDs after the highest one in use, and repair any duplicates from older versions
function syncIds(L) {
  const all = [...L.teams.map(t => t.coach), ...(L.coachPool || []), ...(L.coachArchive || [])];
  let max = 0; for (const c of all) max = Math.max(max, c.id || 0);
  COACH_ID = max + 1;
  const seen = new Map(); let fixed = 0;
  for (const c of all) { if (seen.has(c.id) && seen.get(c.id) !== c) { c.id = COACH_ID++; fixed++; } else seen.set(c.id, c); }
  return fixed;
}
function genCoach(used, young) {
  const age = young ? rint(32, 42) : rint(36, 62);
  const base = young ? gauss(52, 6) : gauss(60, 8);
  const idn = genIdentity(used);
  const c = {
    id: COACH_ID++, name: idn[0], nat: idn[1], age,
    ro: r99(base + gauss(0, 7)), rd: r99(base + gauss(0, 7)), rdev: r99(base + gauss(0, 8)),
    off: pick(Object.keys(OFF_SYS)), def: pick(Object.keys(DEF_SYS)),
    pace: rint(94, 104), depth: rint(8, 10), youth: rint(-2, 2), rot: null,
    w: 0, l: 0, pw: 0, pl: 0, titles: 0, stints: []
  };
  c.pot = r99(Math.max(coachOvr(c), coachOvr(c) + (age < 45 ? rnd(4, 18) : rnd(0, 4))));
  c.rot = c.off === 'motion' ? wpick(['Deep', 'Balanced', 'Tight'], [55, 35, 10]) : c.off === 'iso' ? wpick(['Deep', 'Balanced', 'Tight'], [10, 35, 55]) : wpick(['Deep', 'Balanced', 'Tight'], [25, 50, 25]);
  if (c.rot === 'Deep') c.depth = Math.max(c.depth, 10); if (c.rot === 'Tight') c.depth = Math.min(c.depth, 8);
  coachDerive(c);
  slSeed(c);   // v27 K1
  return c;
}
// ===== v27 K1: coach philosophy sliders (0-100). Each is a trade-off; the coach's offensive / defensive system sets the defaults,
// so a coach with no sliders (old saves) plays exactly as before. Effects only use the gap from his system's default (K2).
const SL_KEYS = ['three', 'rim', 'glass', 'pace', 'ball', 'gamble', 'help', 'depth'];
const SL_NAME = { three: 'Three-point focus', rim: 'Paint / rim focus', glass: 'Crash the glass', pace: 'Pace', ball: 'Ball movement', gamble: 'Gambling for steals', help: 'Pack the paint', depth: 'Rotation depth' };
const SL_LO = { three: 'Few threes', rim: 'Few rim attacks', glass: 'Get back on defense', pace: 'Walk it up', ball: 'Star / isolation', gamble: 'Stay home', help: 'Run shooters off the line', depth: 'Tight (7-8)' };
const SL_HI = { three: '5-out, high volume', rim: 'Rim pressure, post-ups', glass: 'Send bodies to the glass', pace: 'Push in transition', ball: 'Motion, extra passes', gamble: 'Jump passing lanes', help: 'Wall off the lane', depth: 'Deep (10-11)' };
const SL_OFF = { pace: { three: 70, rim: 55, glass: 35, ball: 50 }, inside: { three: 35, rim: 70, glass: 65, ball: 45 }, motion: { three: 55, rim: 50, glass: 50, ball: 75 }, iso: { three: 45, rim: 50, glass: 45, ball: 25 } };
const SL_DEF = { switch: { gamble: 45, help: 40 }, rim: { gamble: 35, help: 70 }, pressure: { gamble: 75, help: 50 } };
// his system's defaults + his own tempo (c.pace 92-106) and depth (c.depth 7-11)
function slDefault(c) { return Object.assign({ three: 50, rim: 50, glass: 50, ball: 50 }, SL_OFF[c.off] || {}, { gamble: 50, help: 50 }, SL_DEF[c.def] || {}, { pace: clamp(Math.round((((c.pace || 99) + ((SYS_FX.off[c.off] || {}).pace || 0) + ((SYS_FX.def[c.def] || {}).pace || 0)) - 92) / 14 * 100), 0, 100), depth: clamp(Math.round(((c.depth || 9) - 7) * 25), 0, 100) }); }
// sliders are kept as his lean on top of his systems: if his system changes, the lean moves with it
function slSync(c) { if (!c || !c.sl) return; const now = c.off + '|' + c.def; if (c.slFor === now) return; if (c.slFor) { const [o, d] = c.slFor.split('|'), od = slDefault({ ...c, off: o, def: d }), nd = slDefault(c); for (const k of SL_KEYS) if (k !== 'pace' && k !== 'depth') c.sl[k] = clamp(Math.round(c.sl[k] - od[k] + nd[k]), 0, 100); } c.slFor = now; }
function slOf(c) { slSync(c); const d = slDefault(c); return c && c.sl ? Object.assign(d, c.sl) : d; }
// give a coach his own sliders: system defaults plus a personal lean (new coaches, real coaches)
function slSeed(c, spread) { const d = slDefault(c), s = {}; for (const k of SL_KEYS) s[k] = k === 'pace' || k === 'depth' ? d[k] : clamp(Math.round(d[k] + gauss(0, spread == null ? 9 : spread)), 0, 100); c.sl = s; c.slFor = c.off + '|' + c.def; return s; }
// set one slider; pace and depth also drive the engine's tempo (c.pace) and rotation size (c.depth)
function slSet(c, k, v) { slSync(c); const s = c.sl || slSeed(c, 0); s[k] = clamp(Math.round(v), 0, 100); c.sl = s; SLD_CACHE.delete(c);
  if (k === 'pace') c.pace = Math.round(92 + s.pace / 100 * 14 - ((SYS_FX.off[c.off] || {}).pace || 0) - ((SYS_FX.def[c.def] || {}).pace || 0));
  if (k === 'depth') { c.depth = 7 + Math.round(s.depth / 25); c.rot = c.depth >= 10 ? 'Deep' : c.depth <= 8 ? 'Tight' : 'Balanced'; } }
// gaps from the system default, -1..+1 (cached per coach object; cleared when a slider or system changes)
const SLD_CACHE = new WeakMap();
// v28.7: inside a game nothing these caches read can change, so one check per game replaces the key build (ENG_TICK > 0 only while playGame runs)
let ENG_TICK = 0, ENG_SEQ = 0;
function slD(c) { if (!c) return SL_ZERO; if (ENG_TICK) { const y = SLD_CACHE.get(c); if (y && y.tick === ENG_TICK) return y; } slSync(c); const key = (c.sl ? SL_KEYS.map(k => c.sl[k]).join(',') : '') + c.off + c.def; let x = SLD_CACHE.get(c); if (x && x.key === key) { x.tick = ENG_TICK; return x; }
  const d = slDefault(c), s = slOf(c); x = { key }; for (const k of SL_KEYS) x[k] = k === 'pace' || k === 'depth' ? 0 : clamp((s[k] - d[k]) / 50, -1.2, 1.2); x.tick = ENG_TICK; SLD_CACHE.set(c, x); return x; }
const slDep = c => clamp((((c && c.depth) || 9) - 9) / 2, -1, 1);   // rotation depth -1 (7) .. +1 (11)
const SL_ZERO = { three: 0, rim: 0, glass: 0, pace: 0, ball: 0, gamble: 0, help: 0, depth: 0 };
// K2 effect sizes (one place to tune; tools/k27.js sweeps them)
const SL_FX = { three: { tp: 0.36, mid: -0.12, trans: 0.24 }, rim: { rim: 0.26, post: 0.2, mid: -0.12, tov: 0.07, foul: 0.03 }, glass: { orb: 0.016, trans: 0.6 }, depth: { inj: 0.15, q4: 0.004 },
  pace: { tov: 0, trans: 0.12 }, ball: { ast: 0.11, dom: 0.3, tovSw: 0.06, defIso: 0.004 }, gamble: { tov: 0.09, foul: 0.07, mk: 0.008 }, help: { rimMk: 0.016, tpMk: 0.016, tpMix: 0.08 } };
function coachOvr(c) { return Math.round((c.ro + c.rd + c.rdev) / 3); }
function coachDerive(c) { c.dev = clamp(Math.round((c.rdev - 60) / 12), -2, 2); c.ovr = coachOvr(c); }
function newLeague(opts) {
  opts = opts || {};
  NEXT_ID = 1;
  const used = new Set();
  COACH_ID = 1;
  const league = { version: 4, v246: true, season: 1, day: 0, phase: 'regular', mode: opts.mode || 'commish', user: opts.mode === 'team' ? opts.userTeam : null,
    teams: [], players: {}, games: [], schedule: [], log: [], nextId: 0, history: [], records: { game: {} }, picks: [], pending: [], trades: [], fa: [], awards: {},
    offers: [], coachPool: [], hof: [], h2h: {}, classes: {}, coachNext: 0 };
  if (opts.nba && typeof nbaPopulate === 'function') { league.nba = 1; setEconomy(league); nbaPopulate(league, used); if (typeof nbaSetupV30a === 'function') nbaSetupV30a(league); }   // v27: real NBA 2026-27 (v30a: rookies + real jersey numbers, src/nba-setup.js)
  else { if (typeof setEconomy === 'function') setEconomy(league);
  leagueDefs(opts.size === 16 ? 16 : 30).forEach((d, i) => {
    const coach = genCoach(used);
    league.teams.push({ id: i, city: d[0], name: d[1], abbr: d[2], region: d[3], conf: confOfDef(d), market: MARKET[d[2]] || 2, c1: d[4], c2: d[5], logo: d[6], coach, w: 0, l: 0, hw: 0, hl: 0, aw: 0, al: 0, pf: 0, pa: 0, cw: 0, cl: 0, streak: 0, roster: [], dead: [], mode: 'hopeful', titles: 0, retired: [] });
    coach.stints.push({ tid: i, from: 1 });
  });
  for (let i = 0; i < Math.round(league.teams.length / 2); i++) league.coachPool.push(genCoach(used, i < league.teams.length / 4));
  const plan = ['PG', 'PG', 'PG', 'SG', 'SG', 'SG', 'SF', 'SF', 'SF', 'PF', 'PF', 'PF', 'C', 'C'];
  // Generate a pool for each roster spot, then deal it out snake-style for rough parity
  plan.forEach((pos, j) => {
    const pool = [];
    for (let i = 0; i < league.teams.length; i++) {
      const talent = Math.max(-1.6, j % 3 === 0 ? gauss(0.4, 0.8) : gauss(-0.3, 0.75));
      const age = clamp(Math.round(gauss(26.5, 4)), 19, 36);
      pool.push(genPlayer(pos, talent, age, used));
    }
    pool.sort((a, b) => b.ovr - a.ovr);
    const order = league.teams.map(t => t.id).sort(() => R() - 0.5);
    if (j % 2) order.reverse();
    pool.forEach((p, i) => { const t = league.teams[order[i]]; p.team = t.id; league.players[p.id] = p; t.roster.push(p.id); });
  });
  for (const t of league.teams) ensureCoverage(league, t, used);
  // free agent pool
  league.fa = [];
  for (let i = 0; i < Math.round(league.teams.length * 1.9); i++) {
    const p = genPlayer(pick(POS), gauss(-0.9, 0.7), clamp(Math.round(gauss(27, 4)), 20, 35), used);
    league.players[p.id] = p; league.fa.push(p.id);
  }
  }
  league.usedNames = [...used];
  league.sg = SG_OPTS.includes(opts.games) ? opts.games : 82;   // v26.6: 82 games by default
  league.y0 = opts.y0 != null ? opts.y0 : 2025;   // v26.6b: season 1 = the 2026-27 season
  if (typeof setSeasonLen === 'function') setSeasonLen(league); else SEASON_GAMES = league.sg;
  league.schedule = makeSchedule(league.teams, league.sg, league.season);
  { // logo styles: badge (A), monogram tile (B) or sash crest (C), spread across the league
    const st = league.teams.map((_, i) => 'ABC'[i % 3]).sort(() => R() - 0.5);
    league.teams.forEach((t, i) => { t.logoStyle = st[i]; t.logoShape = pick(['shield', 'circle', 'diamond', 'square']); });
  }
  for (const t of league.teams) for (const id of t.roster) assignNumber(league, league.players[id], t);
  initDraftClasses(league);
  initFinances(league);
  computeModes(league, 'Preseason');
  migrateLeague(league);
  if (typeof aiFillTwoWay === 'function') aiFillTwoWay(league);
  if (typeof setLgOvr === 'function') { setLgOvr(league); league.lgOvr0 = league.lgOvr; }
  if (typeof storyStart === 'function') { try { initFamilies(league); storyStart(league); } catch (e) { } }
  league.nextId = NEXT_ID;
  return league;
}
function coverage(league, t) {
  const c = [0, 0, 0, 0, 0];
  for (const id of t.roster) { const p = league.players[id]; c[p.pos]++; if (p.pos2 != null) c[p.pos2]++; }
  return c;
}
// Make sure at least 2 players can play each position
function ensureCoverage(league, t, used) {
  for (let guard = 0; guard < 40; guard++) {
    const c = coverage(league, t);
    const need = c.findIndex(x => x < 2);
    if (need < 0) return;
    // replace the lowest-rated player at the most-covered position
    const most = c.indexOf(Math.max(...c));
    const cands = t.roster.map(id => league.players[id]).filter(p => p.pos === most || p.pos2 === most).sort((a, b) => a.ovr - b.ovr);
    const out = cands[0] || t.roster.map(id => league.players[id]).sort((a, b) => a.ovr - b.ovr)[0];   // v25.2 fix: the most-covered spot can be all second positions
    let np;
    for (let k = 0; k < 30; k++) { np = genPlayer(POS[need], gauss(-0.2, 0.8), clamp(Math.round(gauss(26, 4)), 19, 35), used); if (np.pos === need || np.pos2 === need) break; }
    np.pos = need; if (np.pos2 === need) np.pos2 = null;
    np.ovr = ovr(np); if (np.pot < np.ovr) np.pot = np.ovr; np.arch = archetypes(np);
    np.team = t.id; league.players[np.id] = np;
    t.roster[t.roster.indexOf(out.id)] = np.id;
    delete league.players[out.id];
  }
}

// 58 games: 6 vs each conference rival (7 x 6 = 42) and 2 vs each team in the other conference (8 x 2 = 16)
// v24.6: spread over ~110 days with rest days (3-4 games a week, ~15% back-to-backs, never 3 games in 3 days).
// Each day, teams behind their pace play first; a team that played yesterday needs to be further behind to go again.
// v26.6: season length is a league setting (L.sg: 58, 66 or 82; new leagues 82, old saves 58). SEASON_GAMES is set by setSeasonLen (league.js) on new / load.
let SEASON_GAMES = 58;
const SCHED = { spread: 1.9, b2bPen: 0.7, th: -0.2, jit: 0.3 }, SG_OPTS = [58, 66, 82];
const gpq = n => Math.round(n * SEASON_GAMES / 58);   // a games threshold written for 58 games, scaled to the season length
// 30 teams: each conference split into 3 divisions of 5 (t.div, else by order). Returns { c: conf, d: division 0-2, p: place 0-4, q: place in conference 0-14 }
function schedSlots(teams) {
  const out = {}, confs = [...new Set(teams.map(t => t.conf))];
  for (const c of confs) {
    const ts = teams.filter(t => t.conf === c).slice().sort((a, b) => String(a.div || (typeof divOf === 'function' ? divOf(a.abbr) : '') || '').localeCompare(String(b.div || (typeof divOf === 'function' ? divOf(b.abbr) : '') || '')) || a.id - b.id);
    ts.forEach((t, q) => out[t.id] = { c, ci: confs.indexOf(c), d: Math.floor(q / 5), p: q % 5, q });
  }
  return out;
}
// games between teams i and j in a season of G games (s rotates the uneven pairs each season)
function pairGames(teams, i, j, G, slots, s) {
  const n = teams.length, same = teams[i].conf === teams[j].conf;
  if (G === 58 || G == null) return n > 16 ? 2 : same ? 6 : 2;
  if (n <= 16) return same ? 6 : G === 82 ? 5 : 3;                 // 8 per conference: 7 x 6 + 8 x 5 = 82, 7 x 6 + 8 x 3 = 66
  const a = slots[teams[i].id], b = slots[teams[j].id];
  if (same && a.d === b.d) return G === 82 ? 4 : 3;                // division: 4 x 4 = 16 (82), 4 x 3 = 12 (66)
  if (same) {
    if (G === 66) return 3;                                         // 10 x 3 = 30
    const [x, y] = ((b.d - a.d + 3) % 3) === 1 ? [a, b] : [b, a];   // NBA style: 6 conference opponents x 4, 4 x 3 (2 in each other division, rotating)
    return ((y.p - x.p - s) % 5 + 10) % 5 <= 1 ? 3 : 4;
  }
  if (G === 82) return 2;                                           // 15 x 2 = 30
  const [x, y] = a.ci === 0 ? [a, b] : [b, a];                      // 66: 9 x 2 + 6 x 1 = 24 against the other conference
  return ((y.q - x.q - s) % 15 + 30) % 15 <= 5 ? 1 : 2;
}
// Phase A: any other league size (after expansion): every team plays exactly G games. Base a games vs each conference rival and b vs each
// other team, then the leftover games go to a rotating ring of opponents (conference rivals first), so each team gets the same number.
function pairMatrix(teams, G, s) {
  const n = teams.length, idx = teams.map((t, i) => i).sort((x, y) => String(teams[x].conf).localeCompare(String(teams[y].conf)) || x - y);
  const c = teams.filter(t => t.conf === teams[0].conf).length, sm = c - 1, ot = n - c;
  let best = null;
  for (let b = 1; b <= 12; b++) for (let a = b; a <= b + 3; a++) { const r = G - sm * a - ot * b; if (r < 0 || r > n - 1 || (r % 2 && n % 2)) continue; const sc = r * 0.2 + Math.abs(a / b - 1.5); if (!best || sc < best.sc) best = { a, b, r, sc }; }
  if (!best) best = { a: 1, b: 1, r: 0 };
  const M = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (i !== j) M[i][j] = teams[i].conf === teams[j].conf ? best.a : best.b;
  const rot = idx.map((_, k) => idx[(k + (s || 0)) % n]), add = (x, y) => { M[x][y]++; M[y][x]++; };
  for (let k = 1; k <= Math.floor(best.r / 2); k++) for (let q = 0; q < n; q++) add(rot[q], rot[(q + k) % n]);
  if (best.r % 2) for (let q = 0; q < n / 2; q++) add(rot[q], rot[q + n / 2]);
  return M;
}
function makeSchedule(teams, G, season) {
  const games = [], n = teams.length, slots = schedSlots(teams), s = season || 0;
  const PM = n !== 16 && n !== 30 ? pairMatrix(teams, G || 58, s) : null;
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    const cnt = PM ? PM[i][j] : pairGames(teams, i, j, G, slots, s);
    for (let r = 0; r < cnt; r++) games.push((r + i + j + (cnt % 2 ? s : 0)) % 2 ? [i, j] : [j, i]);
  }
  for (let i = games.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [games[i], games[j]] = [games[j], games[i]]; }
  const per = games.length * 2 / n, D = Math.round(per * SCHED.spread);
  const played = new Array(n).fill(0), last = new Array(n).fill(-9), last2 = new Array(n).fill(-9);
  const days = []; let rest = games, d = 0;
  while (rest.length && d < 1000) {
    const pr = teams.map((_, i) => last[i] === d - 1 && last2[i] === d - 2 ? -99 : per * (d + 1) / D - played[i] - (last[i] === d - 1 ? SCHED.b2bPen : 0));
    const order = rest.map(g => [Math.min(pr[g[0]], pr[g[1]]) + R() * SCHED.jit, g]).sort((x, y) => y[0] - x[0]);
    const day = [], used = new Set(), next = [];
    for (const [sc, g] of order) { if (sc > SCHED.th && !used.has(g[0]) && !used.has(g[1])) { day.push(g); used.add(g[0]); used.add(g[1]); } else next.push(g); }
    if (!day.length) { const k = next.findIndex(g => pr[g[0]] > -99 && pr[g[1]] > -99); if (k >= 0) day.push(next.splice(k, 1)[0]); }
    for (const [h, a] of day) for (const t of [h, a]) { last2[t] = last[t]; last[t] = d; played[t]++; }
    days.push(day); rest = next; d++;
  }
  return days;
}


// ===== Game simulation (possession by possession) =====
// Box score columns
const BX = ['min', 'pts', 'fgm', 'fga', 'tpm', 'tpa', 'ftm', 'fta', 'orb', 'drb', 'ast', 'stl', 'blk', 'tov', 'pf', 'gs', 'pm'];
const IX = {}; BX.forEach((k, i) => IX[k] = i);

// ---------- v32b: roles with minutes expectations ----------
// Each rostered player gets a role from his coach (p.role, refreshed weekly and when the roster changes). A role sets the minutes he
// expects; the game plan (roleMinutes) fits those ranges to 240 minutes for whoever is available that night.
const ROLES = [
  { k: 'fs', n: 'Franchise star', lo: 34, hi: 37, flex: 0.15 },
  { k: 'star', n: 'Star', lo: 32, hi: 35, flex: 0.25 },
  { k: 'starter', n: 'Starter', lo: 26, hi: 32, flex: 0.5 },
  { k: 'sixth', n: 'Sixth man', lo: 24, hi: 28, flex: 0.6 },
  { k: 'rot', n: 'Rotation', lo: 16, hi: 24, flex: 1 },
  { k: 'bench', n: 'Bench', lo: 8, hi: 16, flex: 1.4 },
  { k: 'dev', n: 'Development', lo: 0, hi: 8, flex: 2 }];
const ROLE_BY = {}; ROLES.forEach((r, i) => { r.i = i; ROLE_BY[r.k] = r; });
const ROLE_KEYS = ROLES.map(r => r.k);
function roleRank(k) { return ROLE_BY[k] ? ROLE_BY[k].i : 6; }
function roleName(k) { return ROLE_BY[k] ? ROLE_BY[k].n : '—'; }
function roleRange(k) { const r = ROLE_BY[k]; return r ? r.lo + '-' + r.hi : ''; }
function roleMid(k) { const r = ROLE_BY[k]; return r ? (r.lo + r.hi) / 2 : 0; }
// league-wide cut lines: franchise stars are about the top half-player per team, stars the next ~1.1 per team (by rating)
function roleCuts(league) {
  const key = league.season + ':' + (league.day || 0) + ':' + (league.phase || '');
  if (league._rc && league._rc.key === key) return league._rc;
  const ov = []; for (const t of league.teams) for (const id of t.roster) { const p = league.players[id]; if (p) ov.push(p.ovr); }
  ov.sort((a, b) => b - a); const n = league.teams.length;
  const at = i => ov[Math.min(ov.length - 1, Math.max(0, i))] || 99;
  league._rc = { key, fs: Math.max(at(Math.round(n * 0.5) - 1), 70), star: Math.max(at(Math.round(n * 1.6) - 1), 66) };
  Object.defineProperty(league, '_rc', { value: league._rc, enumerable: false, writable: true, configurable: true });   // not saved
  return league._rc;
}
function roleValue(league, t, p) { const NBm = typeof NBA_ON !== 'undefined' && NBA_ON; return playerValue(p, t.coach) + ((t.yb || {})[p.id] || 0) + (NBm ? Math.max(-4, Math.min(4, p.rmb || 0)) : 0); }
// roles for a roster (Map pid -> key). extra: a player who isn't on the team yet (what role he would get). Players out long-term keep their role.
function teamRoles(league, t, extra) {
  const cut = roleCuts(league), coach = t.coach;
  let ps = t.roster.map(id => league.players[id]).filter(p => p && !(p.injLong && p.injury >= 30));
  if (extra && !ps.includes(extra)) ps = ps.concat(extra);
  const val = new Map(ps.map(p => [p.id, roleValue(league, t, p)]));
  const pairs = []; for (const p of ps) for (let s = 0; s < 5; s++) pairs.push([playerValue(p, coach, s) + val.get(p.id) - playerValue(p, coach), p, s]);
  pairs.sort((a, b) => b[0] - a[0]);
  const slot = [null, null, null, null, null], used = new Set();
  for (const [, p, s] of pairs) { if (slot[s] || used.has(p.id)) continue; slot[s] = p; used.add(p.id); }
  const out = new Map(), st = slot.filter(Boolean).sort((a, b) => b.ovr - a.ovr);
  let fs = false, stars = 0;
  for (const p of st) { let k = 'starter'; if (!fs && p.ovr >= cut.fs && stars === 0) { k = 'fs'; fs = true; } else if (stars < 2 && p.ovr >= cut.star) { k = 'star'; stars++; } out.set(p.id, k); }
  const bench = ps.filter(p => !used.has(p.id)).sort((a, b) => val.get(b.id) - val.get(a.id));
  const nRot = clamp((coach.depth || 9) - 6, 1, 5);
  bench.forEach((p, i) => out.set(p.id, i === 0 ? 'sixth' : i <= nRot ? 'rot' : i <= nRot + 2 ? 'bench' : 'dev'));
  for (const p of ps) {
    const c = p.contract, pr = c && c.role ? (ROLE_BY[c.role.k] ? c.role.k : c.role.k === 'starter' ? 'starter' : null) : null;   // a role promise is a floor
    if (pr && p.team === t.id && roleRank(pr) < roleRank(out.get(p.id))) out.set(p.id, pr);
    const us = league.user === t.id && t.roleSet && t.roleSet[p.id];   // your own call (data only for now; S4 adds the editor)
    if (us && ROLE_BY[us] && p.team === t.id) out.set(p.id, us);
  }
  return out;
}
// refresh p.role for a team (weekly, at season start, after roster moves). Cheap: one greedy pass.
function setTeamRoles(league, t) {
  const m = teamRoles(league, t);
  for (const [id, k] of m) { const p = league.players[id]; if (p) { p.role = k; p.roleT = t.id; } }
  for (const id of t.roster) { const p = league.players[id]; if (p && !m.has(id) && p.roleT !== t.id) { p.role = teamRoles(league, t, p).get(id) || 'dev'; p.roleT = t.id; } }   // out long-term: the role he'd have healthy
  t.roleKey = t.roster.join(',') + '|' + (t.coach ? t.coach.id : '');
}
function rolesFresh(league, t) { if (t.roleKey !== t.roster.join(',') + '|' + (t.coach ? t.coach.id : '')) setTeamRoles(league, t); }
function roleOf(league, p) { if (p.team == null) return null; const t = league.teams[p.team]; if (t) rolesFresh(league, t); return p.roleT === p.team ? p.role : null; }
// fit role ranges to the minutes on offer: one shared shift (lambda) times each role's flexibility, clamped to the range; bisection.
// list: [{ id, k, w }] (w = optional extra lean, minutes). Returns { id: minutes }.
const RM_LIFT = [6, 5, 3, 10.5, -1.5, -3, 0];   // v33a: franchise star 5.5 -> 6, star 4.5 -> 5 (20-season runs sat at the low end: fs 34.1-34.4, star 32.0-32.7)
// was:   // v32h: franchise star 6.5 -> 5.5 (with the sixth man entering earlier, 6-6.5 pushed them to ~38 early in a season; 5.5 averages ~34-35 over full seasons). v32g: sixth man 5.5 -> 10.5, franchise star 5.5 -> 6.5 (with the long-run placement in planRotation, sixth men land ~25 instead of ~22.7). v32c: a normal game's plan: top roles above their range by about what blowouts and foul trouble take off, rotation / bench a bit under (blowout garbage time adds it back), so season averages land in the ranges   // short-handed nights: stars stretch 1.5 at most (calc), the bench takes the rest   // plan a bit above the role so the minutes played (after blowout rest and foul trouble) land in it
const MPG_TOP = 38.5;   // v33d: regular-season target ceiling (franchise star 37 + lift 6 could plan 43; top player averaged 39.6). Blowout rest and overtime move the season average around it
function roleMinutes(list, coach, playoff, total) {
  total = total || 240;
  const style = (coach && coach.rot) || 'Balanced', lean = style === 'Tight' ? 0.9 : style === 'Deep' ? 0.55 : 0.75;   // top roles aim high: blowout rest takes ~1.5 min off them
  const pref = x => { const r = ROLE_BY[x.k] || ROLE_BY.dev; let f = r.i <= 2 ? lean : r.i === 3 ? 0.7 : r.i === 4 ? 0.5 : r.i === 5 ? 0.35 : 0.15; if (playoff) f = r.i <= 1 ? 1.4 : r.i === 2 ? Math.min(1.2, f + 0.3) : r.i >= 4 ? 0.15 : f; return r.lo + (r.hi - r.lo) * f + (x.w || 0) + RM_LIFT[r.i]; };
  const sk = style === 'Tight' ? 0.5 : style === 'Deep' ? 1.6 : 1;   // how much the top three roles give up when minutes are tight (tight coaches protect them)
  const fx = r => r.flex * (r.i <= 2 ? sk : 1), poHi = r => playoff && r.i <= 2 ? 2 : 0;   // playoffs: the top roles can run 2 past their range
  const calc = (lam, wide) => { let s = 0; const m = {}; for (const x of list) { const r = ROLE_BY[x.k] || ROLE_BY.dev, lo = wide ? 0 : r.lo + Math.min(0, RM_LIFT[r.i]), hi = Math.min(r.hi + Math.max(0, RM_LIFT[r.i]) + poHi(r) + (wide ? (r.i <= 1 ? Math.min(wide, 1.5) : wide) : 0), playoff ? 99 : MPG_TOP); m[x.id] = clamp(pref(x) + lam * fx(r), lo, hi); s += m[x.id]; } return [s, m]; };
  let wide = 0, a = -60, b = 60;
  if (calc(b, 0)[0] < total) wide = calc(b, 6)[0] >= total ? 6 : 14;   // short-handed: roles stretch past their top
  else if (calc(a, 0)[0] > total) wide = 0.001;                        // too many players: lower ends can drop to zero
  for (let i = 0; i < 40; i++) { const mid = (a + b) / 2; if (calc(mid, wide)[0] > total) b = mid; else a = mid; }
  const [s, m] = calc((a + b) / 2, wide);
  if (s > 0 && Math.abs(s - total) > 0.5) for (const id in m) m[id] *= total / s;
  return m;
}
// ---------- v32c: rotation timeline ----------
// Each coach has a rotation pattern (coachPat): when his starters first sit in the 1st and 3rd quarters (two groups, staggered by
// position), and how he splits the rest between the 2nd and 4th. planRotation turns it into a minute-by-minute plan (48 x 5, by
// slot) whose minutes match the role targets (g.target); bench stints fill the gaps by position. The game follows the plan unless
// the game is close late, a blowout, overtime, foul trouble, or an injury (subStep). Your team can save a chart (t.rotChart:
// 4 quarters x 4 blocks of 3 minutes, 5 ids each) that replaces the coach's plan; a player out that night gets a stand-in for his
// blocks (v32g); a chart that can't be fixed that way falls back to the coach's.
const ROT_BLK = 3;   // chart block length (minutes)
const SIX_EARLY = 4;   // v32h: most minutes the sixth man's partner sits early (per half)
const PAT_C = new WeakMap();
const PAT_FIRST = [[2, 3], [2, 3], [1, 2], [3, 4], [0, 2], [1, 4]];   // slots that sit first (SF + PF most often, as in the classic pattern)
function coachPat(c) {
  if (!c) return { e1: 6, e2: 9, first: [2, 3], q4: 0.55 };
  const k = (c.id || 0) + '|' + (c.rot || '') + '|' + (c.depth || 9), y = PAT_C.get(c); if (y && y.k === k) return y;
  let h = ((((c.id || 1) * 2654435761) >>> 0) ^ 0x5bd1e995) >>> 0; const nx = () => { h = (Math.imul(h ^ (h >>> 15), 2246822507) ^ 0x9e3779b9) >>> 0; return (h % 1000) / 1000; };
  const st = c.rot || 'Balanced', b = st === 'Tight' ? [7, 10] : st === 'Deep' ? [5, 8] : [6, 9];
  const x = { k, e1: b[0] + (nx() - 0.5), e2: b[1] + (nx() - 0.5), first: PAT_FIRST[Math.floor(nx() * PAT_FIRST.length)], q4: 0.5 + nx() * 0.12 };
  PAT_C.set(c, x); return x;
}
function slotFit(p, s) { return s === p.pos || s === p.pos2 ? 1 : Math.min(Math.abs(s - p.pos), p.pos2 != null ? Math.abs(s - p.pos2) : 9) === 1 ? 0.72 : 0.3; }
// best slot order for a set of 5 players (greedy on position fit, then value)
function slotsFor(five, coach) {
  const pairs = []; for (const p of five) for (let s = 0; s < 5; s++) pairs.push([slotFit(p, s) * 100 + playerValue(p, coach) * 0.01, p, s]);
  pairs.sort((a, b) => b[0] - a[0]); const out = [null, null, null, null, null], used = new Set();
  for (const [, p, s] of pairs) { if (out[s] || used.has(p.id)) continue; out[s] = p; used.add(p.id); }
  return out;
}
// the coach's plan: plan[m][slot] = player (m = minute 0-47)
function planRotation(g) {
  const pat = coachPat(g.coach), T = id => (g.target[id] || 0) / 60, jit = () => (R() - 0.5) * 1.2;
  const plan = Array.from({ length: 48 }, () => [null, null, null, null, null]), busy = Array.from({ length: 48 }, () => new Set());
  const put = (p, s, a, b) => { for (let m = Math.max(0, a); m < Math.min(48, b); m++) { plan[m][s] = p; busy[m].add(p.id); } };
  const st = g.court.slice(), onSt = new Set(st.filter(Boolean).map(p => p.id));
  // v32h: plan the sixth man first. The starter he pairs with (best position fit, not a star) sits a couple of minutes earlier
  // each half and comes back earlier, so the sixth man's run starts before the rest of the starters' rest pattern
  // (the window where any starter sits was the limit on his minutes).
  const six = g.players.filter(p => !onSt.has(p.id) && !g.out.has(p.id)).sort((a, b) => T(b.id) - T(a.id))[0];
  let pair = -1, sh = 0;
  if (six && T(six.id) >= 18) {
    let bv = -1; st.forEach((p, s) => { if (!p || (g.stars && g.stars.has(p.id))) return; const v = slotFit(six, s) + (pat.first.includes(s) ? 0.05 : 0) - T(p.id) / 400; if (v > bv) { bv = v; pair = s; } });
    sh = clamp(Math.round(T(six.id) - 21), 1, SIX_EARLY);
  }
  st.forEach((p, s) => {
    if (!p) return;
    const t = clamp(Math.round(T(p.id)), 0, 48), star = g.stars && g.stars.has(p.id);
    let o1 = (pat.first.includes(s) ? pat.e1 : pat.e2) + jit() + (star ? 1 : 0), o3 = o1 + (R() - 0.4) * 0.8;
    if (s === pair) { o1 -= sh; o3 -= sh; }
    o1 = clamp(Math.round(o1), 3, 12); o3 = clamp(Math.round(o3), 3, 12);
    if (o1 + o3 > t) { o1 = Math.floor(t / 2); o3 = t - o1; }
    let rest = t - o1 - o3;
    while (rest > 24 && (o1 < 12 || o3 < 12)) { if (o1 <= o3 && o1 < 12) o1++; else o3++; rest--; }
    let b4 = Math.min(12, Math.round(rest * pat.q4)), b2 = Math.min(12, rest - b4); if (rest - b4 - b2 > 0) b4 = Math.min(12, rest - b2);
    put(p, s, 0, o1); put(p, s, 24 - b2, 24); put(p, s, 24, 24 + o3); put(p, s, 48 - b4, 48);
  });
  const bench = g.players.filter(p => !onSt.has(p.id) && !g.out.has(p.id));
  const B = new Map(bench.map(p => [p.id, Math.round(T(p.id))]));
  // v32g: the first man off the bench (18+ min planned) gets one long run in each half, sliding to whichever slot opens, so his
  // minutes aren't lost to position fit in the gap fill below (sixth men averaged ~22.7 vs their 24-28 range)
  const top = bench.slice().sort((a, b) => B.get(b.id) - B.get(a.id))[0];
  if (top && B.get(top.id) >= 18) for (const [h0, h1, need] of [[0, 24, Math.ceil(B.get(top.id) / 2)], [24, 48, B.get(top.id) - Math.ceil(B.get(top.id) / 2)]]) {
    let m = h0, got = 0, s = -1;
    while (m < h1 && !plan[m].some(x => !x)) m++;
    for (; m < h1 && got < need; m++) {
      const open = [0, 1, 2, 3, 4].filter(k => !plan[m][k]); if (!open.length) { s = -1; continue; }   // starters all on: his next stint starts at the next opening
      const k = open.includes(s) ? s : open.sort((a, b) => slotFit(top, b) - slotFit(top, a))[0];
      put(top, k, m, m + 1); s = k; got++;
    }
    B.set(top.id, B.get(top.id) - got);
  }
  const gaps = []; for (let s = 0; s < 5; s++) { let a = -1; for (let m = 0; m <= 48; m++) { const open = m < 48 && !plan[m][s]; if (open && a < 0) a = m; if (!open && a >= 0) { gaps.push({ s, a, b: m }); a = -1; } } }
  gaps.sort((x, y) => x.a - y.a || (y.b - y.a) - (x.b - x.a));
  for (const gp of gaps) {
    let m = gp.a;
    while (m < gp.b) {
      let best = null, bv = -1;
      for (const p of bench) { if (busy[m].has(p.id)) continue; const left = B.get(p.id), v = (0.4 + 0.6 * slotFit(p, gp.s)) * (left > 0 ? 1 + left / 5 : 0.05) + (m > 0 && plan[m - 1][gp.s] === p ? 0.5 : 0); if (v > bv) { bv = v; best = p; } }
      if (!best) break;
      let len = Math.max(1, Math.min(gp.b - m, B.get(best.id) > 0 ? B.get(best.id) : 1));
      let e = m; while (e < m + len && !busy[e].has(best.id)) e++;
      put(best, gp.s, m, e); B.set(best.id, B.get(best.id) - (e - m)); m = Math.max(e, m + 1);
    }
  }
  planEven(plan, busy, bench, B);
  return plan;
}
// v32g: the gap fill above follows position fit, so a sixth man often ended ~4 min short of his plan (bench / development players
// over theirs). Even it out: a bench player still owed 1+ minutes extends one of his stints by a minute, taking it from a bench
// player on court then who is owed less (decent position fit; same slot preferred). Starters' minutes are never touched.
function planEven(plan, busy, bench, B) {
  const isB = new Set(bench.map(p => p.id));
  for (let it = 0; it < 120; it++) {
    const need = bench.filter(p => B.get(p.id) >= 1).sort((a, b) => B.get(b.id) - B.get(a.id));
    let done = false;
    for (const X of need) {
      let best = null, bv = 1e9;
      for (let m = 0; m < 48; m++) {
        if (busy[m].has(X.id)) continue;
        for (let s = 0; s < 5; s++) {
          const Y = plan[m][s]; if (!Y || !isB.has(Y.id) || Y === X) continue;
          if (!((m > 0 && busy[m - 1].has(X.id)) || (m < 47 && busy[m + 1].has(X.id)))) continue;   // extend a stint (he may slide to the next slot), no new fragments
          if (B.get(Y.id) >= B.get(X.id) - 1 || slotFit(X, s) < Math.min(0.72, slotFit(Y, s))) continue;
          const v = B.get(Y.id) - slotFit(X, s) - (m > 0 && plan[m - 1][s] === X || m < 47 && plan[m + 1][s] === X ? 0.5 : 0); if (v < bv) { bv = v; best = [m, s, Y]; }
        }
      }
      if (!best) continue;
      const [m, s, Y] = best; plan[m][s] = X; busy[m].delete(Y.id); busy[m].add(X.id); B.set(X.id, B.get(X.id) - 1); B.set(Y.id, B.get(Y.id) + 1); done = true; break;
    }
    if (!done) break;
  }
}
// your saved chart -> plan, or a reason it can't be used. v32g: a player in the chart who is out tonight (injury, suspension,
// traded) no longer voids the chart: one stand-in takes all his blocks (best position fit for his spot, then value, a player
// not already on court in those blocks); only if nobody fits does a block fall back to the coach pattern. g.chartSubs lists the swaps.
function chartPlan(league, g) {
  const ch = g.t.rotChart; if (!ch || !Array.isArray(ch.q)) return { bad: null };
  const avail = new Map(g.players.map(p => [p.id, p])), mine = new Set(g.t.roster.concat(g.t.twoWay || [])), plan = [];
  const blocks = [];
  for (let qi = 0; qi < 4; qi++) for (let b = 0; b < 12 / ROT_BLK; b++) {
    const ids = ((ch.q[qi] || [])[b] || []).filter(x => x != null);
    if (ids.length !== 5 || new Set(ids).size !== 5) return { bad: `Q${qi + 1} block ${b + 1}: needs 5 different players` };
    blocks.push(ids.slice());
  }
  const ok = id => avail.has(id) && mine.has(id), subs = [];
  const missing = [...new Set(blocks.flat())].filter(id => !ok(id));
  const cnt = {}; for (const bl of blocks) for (const id of bl) cnt[id] = (cnt[id] || 0) + 1;
  for (const id of missing) {
    const P = league.players[id], pos = P ? P.pos : 2, his = blocks.map((bl, i) => bl.includes(id) ? i : -1).filter(i => i >= 0);
    const score = c => slotFit(c, pos) * 10 + playerValue(c, g.coach) * 0.08 - (cnt[c.id] || 0) * 0.35;   // fit first, then the better player, lighter load
    const pool = g.players.filter(c => ok(c.id) && !missing.includes(c.id)).sort((a, b) => score(b) - score(a));
    const one = pool.find(c => his.every(i => !blocks[i].includes(c.id)));
    for (const i of his) {
      const c = one || pool.find(x => !blocks[i].includes(x.id)); if (!c) return { bad: `${P ? P.name : 'A player'} is not available and nobody can take his spot` };
      blocks[i][blocks[i].indexOf(id)] = c.id; cnt[c.id] = (cnt[c.id] || 0) + 1;
      const sub = subs.find(x => x.out === id && x.in === c.id); if (sub) sub.n++; else subs.push({ out: id, in: c.id, n: 1 });
    }
  }
  for (const ids of blocks) { const five = slotsFor(ids.map(id => avail.get(id)), g.coach); for (let m = 0; m < ROT_BLK; m++) plan.push(five); }
  return { plan, subs };
}
function rotSetup(league, g, playoff) {
  const cp = league.user === g.t.id ? chartPlan(league, g) : { bad: null };
  if (cp.plan) {
    g.plan = cp.plan; g.planSrc = 'chart'; if (cp.subs && cp.subs.length) g.chartSubs = cp.subs.map(x => { const a = league.players[x.out], b = league.players[x.in]; return `${a ? a.name : 'A player'} out: ${b ? b.name : 'a teammate'} took his ${x.n} block${x.n > 1 ? 's' : ''}`; });
    const mins = {}; for (const row of cp.plan) for (const p of row) mins[p.id] = (mins[p.id] || 0) + 1;
    for (const p of g.players) g.target[p.id] = (mins[p.id] || 0) * 60;
    for (const p of g.court) if (p) g.st[p.id][IX.gs] = 0;
    g.court = cp.plan[0].slice(); g.slotOf = {}; g.court.forEach((p, s) => { g.slotOf[p.id] = s; g.st[p.id][IX.gs] = 1; });
    g.starters = new Set(g.court.map(p => p.id));
  } else { g.plan = planRotation(g); g.planSrc = 'coach'; if (cp.bad) g.chartBad = cp.bad; }
}
function subState(g, quarter, clock, margin, ot) {
  const m = Math.abs(margin), closing = ot || (quarter === 4 && clock <= 300 && m <= 10) || (quarter === 4 && clock <= 120 && m <= 15);
  const blowout = !closing && ((quarter === 4 && m >= 20) || (quarter === 4 && clock <= 360 && m >= 16) || (quarter === 3 && clock <= 180 && m >= 28));
  return closing ? 'close' : blowout ? 'blowout' : 'normal';
}
function inTrouble(g, p, quarter, clock) {
  const pf = g.st[p.id][IX.pf], ftc = g.late ? g.late.ft : 'normal', big = g.stars && g.stars.has(p.id) ? 1 : 0;   // coaches ride their stars one foul longer
  if (quarter < 4 && pf >= quarter + (ftc === 'ride' ? 2 : 1) + big) return true;
  if (quarter === 4 && pf >= 5 && clock > (ftc === 'sit' ? 420 : ftc === 'ride' ? 180 : 300)) return true;
  return false;
}
// follow the plan for this minute; fill holes (fouled out, injured, foul trouble) by position fit and minutes still owed
function followPlan(g, elapsed, quarter, clock) {
  const mi = Math.min(47, Math.floor(elapsed / 60 + 1e-6)), want = g.plan[mi].slice(), ok = p => p && !g.out.has(p.id) && !inTrouble(g, p, quarter, clock);
  for (let s = 0; s < 5; s++) if (!ok(want[s]) || want.indexOf(want[s]) !== s) want[s] = null;
  if (want.some(x => !x)) {
    const inW = new Set(want.filter(Boolean).map(p => p.id)), onNow = new Set(g.court.filter(Boolean).map(p => p.id));
    const pool = g.players.filter(p => !inW.has(p.id) && ok(p));
    for (let s = 0; s < 5; s++) if (!want[s]) {
      let best = null, bv = -1e9;
      for (const p of pool) { if (inW.has(p.id)) continue; const owe = (g.target[p.id] - g.st[p.id][IX.min]) / 60, v = slotFit(p, s) * 10 + clamp(owe, -10, 20) * 0.4 + (onNow.has(p.id) ? 3 : 0) + playerValue(p, g.coach) * 0.03; if (v > bv) { bv = v; best = p; } }
      if (best) { want[s] = best; inW.add(best.id); }
    }
  }
  if (want.some(x => !x)) return false;
  const same = want.every(p => g.court.some(c => c && c.id === p.id));
  if (!same) { g.court = want; g.slotOf = {}; want.forEach((p, s) => g.slotOf[p.id] = s); }
  g.state = 'normal'; return true;
}
// at a quarter break: anyone behind his plan so far (foul trouble, a blowout stretch) gets his next stints stretched by the minutes he
// lost, taken from bench players next to him in the plan (players ahead of plan first)
function planMakeUp(g, elapsed) {
  const P = g.plan; if (!P) return; const m0 = Math.ceil(elapsed / 60 - 1e-6); if (m0 >= 47) return;
  const pl = {}; for (let m = 0; m < m0; m++) for (const p of P[m]) if (p) pl[p.id] = (pl[p.id] || 0) + 1;
  const left = {}; for (let m = m0; m < 48; m++) for (const p of P[m]) if (p) left[p.id] = (left[p.id] || 0) + 1;
  const owe = p => (pl[p.id] || 0) - g.st[p.id][IX.min] / 60;   // + = behind plan
  const short = g.players.filter(p => !g.out.has(p.id) && owe(p) >= 1).sort((a, b) => (g.target[b.id] || 0) - (g.target[a.id] || 0));
  for (const p of short) {
    let need = Math.round(owe(p)), guard = 0;
    while (need > 0 && guard++ < 6) {
      let did = false;
      for (let m = m0; m < 48 && need > 0; m++) {
        if (P[m].includes(p) || !((m > m0 && P[m - 1].includes(p)) || (m < 47 && P[m + 1].includes(p)))) continue;
        let bs = -1, bv = -1e9;
        for (let s = 0; s < 5; s++) { const q = P[m][s]; if (!q || q === p || slotFit(p, s) < 0.72 || (g.starters.has(q.id) && owe(q) > -1)) continue; const v = -owe(q) * 2 - (g.target[q.id] || 0) / 600 + slotFit(p, s); if (v > bv) { bv = v; bs = s; } }
        if (bs < 0) continue;
        const q = P[m][bs]; P[m] = P[m].slice(); P[m][bs] = p; pl[q.id] = (pl[q.id] || 0); need--; did = true;
      }
      if (!did) break;
    }
  }
}
// one substitution check (every possession). due = the old 3-minute window (or a forced change)
function subStep(g, elapsed, quarter, clock, margin, ot, due) {
  const st = subState(g, Math.min(quarter, 4), clock, margin, ot), changed = st !== g.subSt; g.subSt = st;
  if (g.plan && st === 'normal' && !ot && quarter <= 4 && followPlan(g, elapsed, quarter, clock)) return;
  if (due || changed) doSubs(g, elapsed, Math.min(quarter, 4), clock, margin, ot);
}
// timeline: starters + sub events [deciseconds, out id, in id]; compact, rebuilt into minutes by tlMinutes
function tlNote(g, elapsed) {
  const now = g.court.filter(Boolean).map(p => p.id); if (!g.tl) { g.tl = { st: now.slice(), ev: [], src: g.planSrc || 'coach' }; if (g.chartBad) g.tl.bad = g.chartBad; if (g.chartSubs) g.tl.subs = g.chartSubs; g.tlLast = now; return null; }
  const last = g.tlLast, outs = last.filter(id => !now.includes(id)), ins = now.filter(id => !last.includes(id)); if (!outs.length && !ins.length) return null;
  const t = Math.round(elapsed * 10); for (let i = 0; i < Math.max(outs.length, ins.length); i++) g.tl.ev.push([t, outs[i] != null ? outs[i] : -1, ins[i] != null ? ins[i] : -1]);
  g.tlLast = now; return { outs, ins };
}
// seconds on court per player and the five on court each minute, rebuilt from a stored timeline
function tlReplay(tl, total) {
  const sec = {}, on = new Set(tl.st), byMin = []; let t0 = 0, k = 0;
  const add = t => { for (const id of on) sec[id] = (sec[id] || 0) + (t - t0) / 10; t0 = t; };
  const end = Math.round((total || 2880) * 10);
  for (let m = 0; m * 600 < end; m++) { const t = m * 600 + 300; while (k < tl.ev.length && tl.ev[k][0] <= t) { const e = tl.ev[k++]; add(e[0]); if (e[1] >= 0) on.delete(e[1]); if (e[2] >= 0) on.add(e[2]); } byMin.push([...on]); }
  while (k < tl.ev.length) { const e = tl.ev[k++]; add(e[0]); if (e[1] >= 0) on.delete(e[1]); if (e[2] >= 0) on.add(e[2]); }
  add(end);
  return { sec, byMin };
}
const TL_KEEP = 30;   // league games (not yours) that keep their timeline
function tlPrune(league) {
  const G = league.games; let n = 0;
  for (let i = G.length - 1; i >= 0; i--) { const g = G[i]; if (!g.tl) continue; if (league.user != null && (g.home === league.user || g.away === league.user)) continue; if (++n > TL_KEEP) { delete g.tl; break; } }
}
function buildSide(league, tid, isHome, playoff) {
  const t = league.teams[tid], coach = t.coach;
  let avail = t.roster.map(id => league.players[id]).filter(p => p.injury <= 0 && !(p.holdout && p.holdout.left > 0) && !(p.susp && p.susp.g > 0));   // v28.8: suspended players sit
  // v24.7: day-to-day players are game-time calls; those who play are playing hurt (see dtdPlays, ENG.hurt*)
  const hurt = new Set();
  for (const id of t.roster) { const p = league.players[id]; if (isDTD(p) && !(p.holdout && p.holdout.left > 0) && !(p.susp && p.susp.g > 0) && dtdPlays(league, t, p, playoff)) { avail.push(p); hurt.add(p.id); } }
  // v24.6 load management: on the second night of a back-to-back, players can sit. Older players, fragile ones and those who played
  // heavy minutes last night sit more; tanking teams rest the most. AI teams stop resting in the last ~2 weeks unless they're tanking.
  // Your team: t.loadMgmt 0 = off, 1 = players 30+ (true in old saves), 2 = the whole rotation.
  if (!playoff && playedYesterday(league, tid)) {
    const mine = league.user === tid, lvl = mine ? (t.loadMgmt === true ? 1 : +t.loadMgmt || 0) : 2;
    const late = league.day >= league.schedule.length - 14 && t.mode !== 'tank';
    if (lvl && !(late && !mine)) {
      const modeK = mine ? 1 : ({ tank: 1.6, rebuild: 1.25, hopeful: 0.9, push: 0.85, contend: 1, allin: 0.9 })[t.mode] || 1;
      const cands = avail.filter(p => p.ovr >= 64 && (lvl === 2 || p.age >= 30)).map(p => {
        const ageK = p.age >= 34 ? 0.5 : p.age >= 32 ? 0.36 : p.age >= 30 ? 0.2 : p.age >= 27 ? 0.07 : 0.03;
        const mins = p.lastMin || 0, minK = mins >= 36 ? 1.4 : mins >= 30 ? 1.15 : mins > 0 ? 0.9 : 0.6;
        const ipK = [0.85, 1, 1.25, 1.5][p.ipt != null ? p.ipt : 1];
        return [p, Math.min(0.75, ageK * minK * ipK * modeK * (mine ? 1.3 : 1))];
      }).filter(([p, c]) => R() < c).sort((a, b) => b[0].ovr - a[0].ovr).slice(0, 2).map(x => x[0]);
      if (cands.length && avail.length - cands.length >= 9) { avail = avail.filter(p => !cands.includes(p)); for (const p of cands) p.rested = (p.rested || 0) + 1; }
    }
  }
  if (!playoff && t.twoWay && t.twoWay.length) { const healthy = avail.length; for (const id of t.twoWay) { const p = league.players[id]; if (p && p.tw && p.tw.games < 20 && p.injury <= 0 && !(p.susp && p.susp.g > 0) && (p.tw.active || healthy < 12 || (league.user !== tid && t.roster.length <= 13))) avail.push(p); } }
  const g = { t, coach, isHome, players: avail, st: {}, zs: {}, dz: {}, zsOpp: new Array(ZONES * 2).fill(0), form: {}, slotOf: {}, court: [null, null, null, null, null], target: {}, fouled: new Set(), out: new Set(), qFouls: 0, pts: 0, hurt };
  for (const id of [...hurt]) if (!avail.some(p => p.id === id)) hurt.delete(id);   // rested after all
  for (const p of avail) {
    g.st[p.id] = new Array(BX.length).fill(0);
    g.form[p.id] = { o: gauss(0, (100 - p.ocn) / 100 * 7 * ENG.formSd), d: gauss(0, (100 - p.dcn) / 100 * 7 * ENG.formSd) };
    // morale: a happy player plays a touch better, an unhappy one a touch worse (about ±1.2 rating points at the extremes)
    if (p.morale != null) { const m = (p.morale - 60) / 40 * 1.2; g.form[p.id].o += m; g.form[p.id].d += m; }
    // v25.9: motor: effort shows on defense and the glass (about ±1.2 rating points on D, ±0.4 on O at 30 points from average); high motor also shakes off back-to-backs a bit
    if (p.tr) { const m = trc(p, 'mot'); g.form[p.id].d += 1.2 * m; g.form[p.id].o += 0.4 * m; }
    // v24.6: second night of a back-to-back: tired legs (a little worse at both ends, a little more injury risk)
    if (!playoff && p.lastDay === league.day - 1) { const k = ((p.lastMin || 0) >= 32 ? 1.2 : 1) * clamp(1 - 0.15 * trc(p, 'mot'), 0.8, 1.2); g.form[p.id].o -= ENG.b2bO * k; g.form[p.id].d -= ENG.b2bD * k; (g.tired = g.tired || new Set()).add(p.id); }
    // v24.7: playing hurt: worse at both ends, more so the more it hurts
    if (hurt.has(p.id)) { const k = ENG.hurtBase + ENG.hurtPer * p.injury; g.form[p.id].o -= k; g.form[p.id].d -= k; }
    if (playoff) {
      // Playoff swing: built into each player at creation (poc). Shaky players swing more and dip a little; steady ones hold up or rise slightly.
      const c = p.poc == null ? 55 : p.poc, sd = (100 - c) / 100 * 11, bias = (c - 55) / 45 * 2.5;
      g.form[p.id].o += gauss(bias, sd); g.form[p.id].d += gauss(bias * 0.7, sd * 0.7);
    }
  }
  // v27 U8: NBA mode: a whole-team good or bad night (shared by everyone), so the best teams lose a few more and the worst win a few more (regular season only)
  if (!playoff && typeof NBA_ON !== 'undefined' && NBA_ON && ENG.teamNight) { const tn = gauss(0, ENG.teamNight); for (const p of avail) { g.form[p.id].o += tn; g.form[p.id].d += tn * 0.6; } }
  // Starting five: greedy on value at each slot
  const usedP = new Set();
  const manual = league.user === tid && t.manual ? t.manual : null;
  if (manual) manual.starters.forEach((id, s) => { const p = avail.find(x => x.id === id); if (p && !usedP.has(p.id)) { g.court[s] = p; usedP.add(p.id); } });
  const pairs = [];
  const yb = (!manual && t.yb) || {};   // v20: young teams give their rookies a bigger role early
  const NBm = !manual && typeof NBA_ON !== 'undefined' && NBA_ON, rmb = p => NBm ? Math.max(-4, Math.min(4, p.rmb || 0)) : 0;   // v27.13 U7: NBA mode, real minutes role (p.rmb, fades 25% a season); v32a: capped at +-4 so it only breaks near-ties
  for (const p of avail) for (let s = 0; s < 5; s++) pairs.push([playerValue(p, coach, s) + (yb[p.id] || 0) + rmb(p), p, s]);
  pairs.sort((a, b) => b[0] - a[0]);
  for (const [v, p, s] of pairs) { if (g.court[s] || usedP.has(p.id)) continue; g.court[s] = p; usedP.add(p.id); }
  g.starters = new Set(g.court.filter(Boolean).map(p => p.id));
  // Rotation: starters + best bench up to coach depth (or the user's order)
  let bench = avail.filter(p => !usedP.has(p.id)).sort((a, b) => playerValue(b, coach) + (yb[b.id] || 0) + rmb(b) - playerValue(a, coach) - (yb[a.id] || 0) - rmb(a));
  if (manual) { const ord = manual.order || []; bench.sort((a, b) => (ord.indexOf(a.id) < 0 ? 99 : ord.indexOf(a.id)) - (ord.indexOf(b.id) < 0 ? 99 : ord.indexOf(b.id))); }
  const depth = manual && manual.depth ? manual.depth : coach.depth;
  const rot = bench.slice(0, Math.max(0, depth - 5));
  // Minutes plan: coach style (tight / balanced / deep) plus bench quality decide how minutes spread
  const style = coach.rot || 'Balanced';
  const NB = typeof NBA_ON !== 'undefined' && NBA_ON;   // v27.13 U7: NBA mode, a shorter real-style rotation (sim minutes ran 4 per game low)
  const benchMin = style === 'Deep' ? [22, 20, 18, 15, 13] : style === 'Tight' ? [26, 18, 12, 8, 5] : NB ? [25, 20, 15, 10, 6] : [24, 19, 15, 11, 8];
  // v32b: minutes follow roles (teamRoles / roleMinutes); your manual depth chart keeps the older plan below
  if (!manual) {
    rolesFresh(league, t);
    const rk = p => (p.roleT === tid && ROLE_BY[p.role]) ? p.role : 'dev';
    const list = avail.map(p => ({ id: p.id, k: rk(p) }));
    const mm = roleMinutes(list, coach, playoff, 240);
    for (const p of avail) g.target[p.id] = (mm[p.id] || 0) * 60;
    if (league.career && typeof careerMinutes === 'function') careerMinutes(league, avail, g.target);   // My Career: coach trust moves your minutes
    g.stars = new Set(avail.filter(p => rk(p) === 'fs' || rk(p) === 'star').map(p => p.id));
    if (!g.stars.size) { const b = avail.slice().sort((a, b) => playerValue(b, coach) - playerValue(a, coach))[0]; if (b) g.stars.add(b.id); }
  } else {
    const sv = g.court.filter(Boolean).map(p => playerValue(p, coach));
    const avgSv = sv.reduce((a, b) => a + b, 0) / (sv.length || 1);
    const bv = rot.slice(0, 3).map(p => playerValue(p, coach));
    const avgBv = bv.length ? bv.reduce((a, b) => a + b, 0) / bv.length : 0;
    const benchGood = bv.length && avgBv >= avgSv - 4 ? 2 : 0; // a strong bench takes minutes from the starters
    const base = (style === 'Deep' ? 29.5 : style === 'Tight' ? 33.5 : 31.5) + (NB ? 2.5 : 0) - benchGood;
    const hiCap = style === 'Tight' ? 38 : style === 'Deep' ? 34 : NB ? 38 : 36;
    // the team's best player (and a second one if he's good) gets star minutes
    { const byV = g.players.slice().sort((a, b) => playerValue(b, coach) - playerValue(a, coach)); g.stars = new Set(byV.filter((p, i) => i === 0 || (i === 1 && p.ovr >= 74) || p.ovr >= 78).slice(0, 2).map(p => p.id)); }
    let stTot = 0;
    for (const p of g.court) if (p) { g.target[p.id] = clamp(base + (playerValue(p, coach) - avgSv) * 0.35 + (g.stars.has(p.id) ? (NB ? 3 : 2) : 0) + ((yb[p.id] || 0) + rmb(p)) * 0.35, 24, hiCap) * 60; stTot += g.target[p.id]; }   // v26.5: status minutes (t.yb)
    let bTot = 0; rot.forEach((p, i) => { g.target[p.id] = (benchMin[i] + (g.stars.has(p.id) ? 4 : 0)) * 60; bTot += g.target[p.id]; });
    const remain = 2880 * 5 - stTot;
    if (bTot > 0) { const sc = remain / bTot; rot.forEach(p => g.target[p.id] = Math.min(g.target[p.id] * sc, 32 * 60)); }
  }
  for (const p of avail) if (!(p.id in g.target)) g.target[p.id] = 0;
  // minutes restriction after a long injury: about 20 minutes for 3 games, then 26 for 3 more
  for (const p of avail) if (p.minCap > 0 && g.target[p.id] > 0) g.target[p.id] = Math.min(g.target[p.id], (p.minCap > 3 ? 20 : 26) * 60);
  for (const p of avail) if (g.hurt && g.hurt.has(p.id) && g.target[p.id] > 0) g.target[p.id] = Math.min(g.target[p.id], (p.injury > 1 ? 22 : 27) * 60);   // v24.7: playing hurt
  // Position-aware minutes: one position can only absorb so many minutes (48, plus ~18 if someone slides over a spot).
  // Bench players stacked at the same position lose minutes, which go to bench players at thinner positions.
  if (!manual) {
    const rotP = avail.filter(p => g.target[p.id] > 0), cap = 48 * 60 + 18 * 60;
    for (let pos = 0; pos < 5; pos++) {
      const here = rotP.filter(p => p.pos === pos), tot = here.reduce((a, p) => a + g.target[p.id], 0);
      if (tot <= cap) continue;
      const cut = here.filter(p => !g.starters.has(p.id) && !g.stars.has(p.id)), cutTot = cut.reduce((a, p) => a + g.target[p.id], 0); if (!cutTot) continue;
      const excess = Math.min(tot - cap, cutTot * 0.6), others = rotP.filter(p => p.pos !== pos && !g.starters.has(p.id));
      for (const p of cut) g.target[p.id] -= excess * g.target[p.id] / cutTot;
      const oTot = others.reduce((a, p) => a + g.target[p.id], 0);
      if (oTot > 0) for (const p of others) g.target[p.id] = Math.min(32 * 60, g.target[p.id] + excess * g.target[p.id] / oTot);
    }
  }
  // coach's mood management: extra minutes for unhappy regulars, taken from content rotation players
  if (!playoff) {
    const up = avail.filter(p => p.moodMin > 0 && g.target[p.id] > 0);
    const add = up.reduce((a, p) => a + p.moodMin * 60, 0);
    const donors = avail.filter(p => g.target[p.id] > 0 && !(p.moodMin > 0) && (p.morale == null || p.morale >= 55));
    const dTot = donors.reduce((a, p) => a + g.target[p.id], 0);
    if (add > 0 && dTot > add * 3) { for (const p of up) g.target[p.id] += p.moodMin * 60; for (const p of donors) g.target[p.id] -= add * g.target[p.id] / dTot; }
  }
  g.court.forEach((p, s) => { if (p) { g.slotOf[p.id] = s; g.st[p.id][IX.gs] = 1; } });
  try { rotSetup(league, g, playoff); } catch (e) { g.plan = null; }   // v32c: rotation plan (coach pattern or your chart)
  g.chem = teamChem(g.court.filter(Boolean), coach);
  // player chemistry: starters who have played together for years get a small edge; a brand-new five a small penalty
  { const f = g.court.filter(Boolean); let s = 0, n = 0; for (let i = 0; i < f.length; i++) for (let j = i + 1; j < f.length; j++) { s += duoYears(league, f[i].id, f[j].id); n++; } g.chem.duo = n ? (s / n - 1) * 0.003 : 0; if (coach && coach.ch0) g.chem.duo = Math.max(0, g.chem.duo); g.chem.duoAvg = n ? s / n : 0; }
  return g;
}
// Team chemistry: do the starters fit together? Spacing, too many ball-dominant players, rim protection, perimeter defense, system fit.
function duoKey(a, b) { return a < b ? a + '-' + b : b + '-' + a; }
function duoYears(league, a, b) { const d = league.duo && league.duo[duoKey(a, b)]; return d ? Math.min(4, d) : 0; }
function teamChem(five, coach) {
  if (five.length < 5) return { space: 0, crowd: 0, rim: 0, perim: 0, fit: 0, total: 0, notes: [] };
  const avg = k => five.reduce((a, p) => a + p[k], 0) / five.length;
  const shooters = five.filter(p => p.tp >= 62).length, doms = five.filter(p => p.tbd >= 66).length;
  const rimP = Math.max(...five.map(p => p.blk + physZ(p).h * 6));
  const notes = [];
  const space = shooters <= 1 ? -0.018 : shooters === 2 ? -0.007 : shooters >= 4 ? 0.006 : 0;     // cramped paint without shooters
  if (shooters <= 1) notes.push('little spacing'); else if (shooters >= 4) notes.push('great spacing');
  const crowd = doms >= 3 ? -0.006 * (doms - 2) : 0;                                                  // too many players who need the ball
  if (doms >= 3) notes.push(`${doms} players who need the ball`);
  const rim = rimP < 58 ? -0.02 : rimP >= 75 ? 0.008 : 0;                                            // rim protection (applied to opponents' shots inside)
  if (rimP < 58) notes.push('no rim protection'); else if (rimP >= 75) notes.push('strong rim protection');
  const per = avg('per'), perim = per < 50 ? -0.012 : per >= 66 ? 0.006 : 0;                           // perimeter defense (applied to opponents' jumpers)
  if (per < 50) notes.push('weak perimeter defense');
  const f = five.reduce((a, p) => a + fit(p, coach), 0) / 5, fitB = clamp((f - 60) * 0.0007, -0.012, 0.012);
  if (f >= 70) notes.push('fits the coach\'s systems'); else if (f < 52) notes.push('poor fit with the coach\'s systems');
  if (coach && coach.ch0) { const z = Math.max; return { space: z(0, space), crowd: z(0, crowd), rim: z(0, rim), perim: z(0, perim), fit: z(0, fitB), total: z(0, space) + z(0, crowd) + z(0, rim) + z(0, perim) + z(0, fitB), notes }; }   // v28.6: this coach's lineups never lose points to chemistry (JJ Redick, Lakers request)
  return { space, crowd, rim, perim, fit: fitB, total: space + crowd + rim + perim + fitB, notes };
}

function eff(g, p, k, def) {
  const f = g.form[p.id];
  const slot = g.slotOf[p.id];
  let v = p[k]; if (v > ENG.knee) v = ENG.knee + (v - ENG.knee) * ENG.kneeSlope;   // diminishing returns on elite ratings
  return (v + (def ? f.d : f.o)) * posPenalty(p, slot);
}

// Choose who is on the floor
function defScore(g, p) { const z = physZ(p); return (p.per + p.pdf + p.stl + p.blk + p.drb) / 5 + p.iq * 0.15 + z.w * 2; }
function offScore(g, p) { return Math.max(p.fin, p.mid, p.tp, p.pst) * 0.6 + p.hnd * 0.2 + p.ft * 0.1 + p.iq * 0.1; }
// Last two minutes of a close game: defenders in when a stop is needed, scorers and shooters when a basket is needed
// v24.8: late-game settings. Each coach has his own (derived from his id, so old saves need nothing); your team can override them (t.late).
// ft: foul trouble (sit = cautious, ride = leaves him in); foul: fouling when trailing late (never / late = last ~35s / aggr = last minute);
// hack: foul a bad free-throw shooter on purpose; to: timeouts (save = keeps them for the end, runs = calls one early to stop a run).
const LATE_OPTS = { ft: ['sit', 'normal', 'ride'], foul: ['never', 'late', 'aggr'], hack: [false, true], to: ['save', 'normal', 'runs'] };
function coachLate(c) {
  const h = (((((c && c.id) || 1) * 2654435761) >>> 0) ^ 0x5bd1e995) >>> 0;   // v27 N8: unsigned (was negative for ~half of coaches -> ft undefined)
  return { ft: ['sit', 'normal', 'normal', 'ride'][h % 4], foul: ['never', 'late', 'late', 'late', 'aggr'][(h >>> 3) % 5], hack: (h >>> 6) % 4 === 0, to: ['save', 'normal', 'normal', 'runs'][(h >>> 9) % 4] };
}
// ===== v25.2: play types (offense) and pick-and-roll coverages (defense) =====
// Each half-court possession runs a play from the coach's playbook. The play decides who handles and who shoots, the shot zones,
// and the assist and turnover rates. mix = shot-type multipliers (normalized per playbook so league shot mix stays put); mk = make-rate nudge.
const PLAYS = {
  pnr:    { n: 'Pick-and-roll', s: 'PnR', mix: { dunk: 0.8, lay: 1.2, paint: 1.1, mid: 1.35, tp: 0.95 }, ast: 0.8, tov: 1.04, mk: 0 },
  roll:   { n: 'Pick-and-roll (roll man)', s: 'Roll', mix: { dunk: 2.2, lay: 1.6, paint: 0.8, mid: 0.25, tp: 0.08 }, ast: 1.35, tov: 1.0, mk: 0.01 },
  pop:    { n: 'Pick-and-pop', s: 'Pop', mix: { dunk: 0.15, lay: 0.3, paint: 0.4, mid: 1.6, tp: 2.4 }, ast: 1.35, tov: 0.95, mk: 0 },
  iso:    { n: 'Isolation', s: 'Iso', mix: { dunk: 0.7, lay: 1.15, paint: 1.0, mid: 1.45, tp: 0.95 }, ast: 0.25, tov: 1.0, mk: -0.012 },
  post:   { n: 'Post-up', s: 'Post', mix: { dunk: 0.5, lay: 0.6, paint: 3.2, mid: 0.8, tp: 0.15 }, ast: 0.55, tov: 1.08, mk: 0 },
  spot:   { n: 'Spot-up', s: 'Spot', mix: { dunk: 0.5, lay: 0.9, paint: 0.5, mid: 0.9, tp: 2.0 }, ast: 1.45, tov: 0.85, mk: 0.004 },
  screen: { n: 'Off-screen', s: 'Screen', mix: { dunk: 0.1, lay: 0.35, paint: 0.5, mid: 1.8, tp: 1.9 }, ast: 1.4, tov: 0.9, mk: 0 },
  dho:    { n: 'Handoff', s: 'DHO', mix: { dunk: 0.6, lay: 1.1, paint: 0.9, mid: 1.2, tp: 1.2 }, ast: 1.15, tov: 1.0, mk: 0 },
  cut:    { n: 'Cut', s: 'Cut', mix: { dunk: 2.0, lay: 2.0, paint: 0.6, mid: 0.1, tp: 0.05 }, ast: 1.5, tov: 1.02, mk: 0.02 },
  horns:  { n: 'Horns', s: 'Horns', mix: { dunk: 1.0, lay: 1.0, paint: 1.0, mid: 1.15, tp: 1.05 }, ast: 1.1, tov: 1.0, mk: 0 },
  kick:   { n: 'Post entry kick-out', s: 'Kick-out', mix: { dunk: 0.3, lay: 0.6, paint: 0.4, mid: 0.8, tp: 2.5 }, ast: 1.5, tov: 1.04, mk: 0.006 },
  trans:  { n: 'Transition', s: 'Trans', mix: null, ast: 1, tov: 1, mk: 0 }
};
const PLAY_KEYS = ['pnr', 'roll', 'pop', 'iso', 'post', 'spot', 'screen', 'dho', 'cut', 'horns', 'kick'];
// base playbook by offensive system (relative frequencies)
const PB_SYS = {
  pace:   { pnr: 18, roll: 7, pop: 6, iso: 6, post: 3, spot: 17, screen: 7, dho: 7, cut: 6, horns: 5, kick: 3 },
  inside: { pnr: 12, roll: 8, pop: 3, iso: 6, post: 17, spot: 10, screen: 5, dho: 6, cut: 8, horns: 7, kick: 10 },
  motion: { pnr: 12, roll: 6, pop: 5, iso: 4, post: 7, spot: 12, screen: 14, dho: 11, cut: 12, horns: 10, kick: 4 },
  iso:    { pnr: 17, roll: 6, pop: 4, iso: 18, post: 8, spot: 12, screen: 5, dho: 5, cut: 5, horns: 4, kick: 4 }
};
const PB_ADJ = [0, 0.5, 1, 1.6, 2.3], PB_ADJ_LBL = ['Never', 'Less', 'Normal', 'More', 'A lot'];   // your sliders (t.pbAdj)
// who fits a play (about 1 for a typical rotation player)
const PF = {
  pnr: p => Math.pow(Math.max(5, p.tbd || 50) / 50, 1.5) * Math.pow(Math.max(10, p.hnd) / 60, 1.5) * Math.pow(Math.max(10, Math.max(p.fin, p.mid, p.tp)) / 60, 1),
  roll: p => (p.pos >= 3 ? 1 : 0.25) * Math.pow(Math.max(10, 0.35 * p.fin + 0.3 * p.vrt + 0.2 * (60 + physZ(p).h * 10) + 0.15 * p.str) / 60, 3),
  pop: p => (p.pos >= 3 ? 1 : 0.35) * Math.pow(Math.max(10, p.tp) / 60, 4),
  iso: p => Math.pow(Math.max(10, Math.max(p.fin, p.mid, p.tp)) / 60, 3) * Math.pow(Math.max(10, p.hnd) / 60, 1.5) * Math.max(5, p.tbd || 50) / 50,
  post: p => Math.max(5, p.tps) / 50 * Math.pow(Math.max(10, 0.65 * p.pst + 0.2 * p.str + 0.15 * (60 + physZ(p).h * 10)) / 60, 3),
  spot: p => Math.pow(Math.max(10, p.tp) / 60, 4) * (0.5 + p.t3 / 100) * (0.5 + (p.tcs || 55) / 110),
  screen: p => (p.pos <= 2 ? 1 : 0.3) * Math.pow(Math.max(10, Math.max(p.tp, p.mid)) / 60, 3) * Math.max(20, p.spd) / 60,
  dho: p => (p.pos <= 2 ? 1 : 0.3) * Math.pow(Math.max(10, Math.max(p.fin, p.mid, p.tp)) / 60, 2.5),
  cut: p => Math.pow(Math.max(10, p.fin) / 60, 2.5) * (p.spd + p.vrt) / 120,
  horns: p => 1, kick: p => Math.pow(Math.max(10, p.tp) / 60, 4) * (0.5 + p.t3 / 100)
};
const PF_REF = { pnr: 2.7, roll: 1.2, pop: 0.75, iso: 3.3, post: 1.4, spot: 2.1, screen: 2.0, dho: 1.65, cut: 1.8, horns: 1, kick: 2.1 };   // a typical team's best two
function playbookOf(league, g) {
  const sys = PB_SYS[g.coach.off] || PB_SYS.motion, rot = g.players.filter(p => (g.target[p.id] || 0) > 0);
  const adj = league.user === g.t.id && g.t.pbAdj ? g.t.pbAdj : null, w = {};
  for (const k of PLAY_KEYS) {
    const f = rot.map(p => PF[k](p)).sort((a, b) => b - a), top = ((f[0] || 0) + (f[1] || 0)) / 2;
    w[k] = sys[k] * clamp(Math.pow(top / PF_REF[k], 0.6), 0.55, 1.6) * (adj && adj[k] != null ? PB_ADJ[adj[k]] : 1);
  }
  if (!PLAY_KEYS.some(k => w[k] > 0)) w.horns = 1;
  const tot = PLAY_KEYS.reduce((a, k) => a + w[k], 0), norm = {};
  for (const ty of ['dunk', 'lay', 'paint', 'mid', 'tp']) norm[ty] = PLAY_KEYS.reduce((a, k) => a + w[k] * PLAYS[k].mix[ty], 0) / tot;
  g.pb = w; g.pbNorm = norm;
}
// pick-and-roll coverages; each has trade-offs by play (mk = make-rate change for the offense, tov = turnover multiplier)
const COVS = ['drop', 'switch', 'hedge', 'blitz', 'ice'];
const COV_LBL = { drop: 'Drop', switch: 'Switch', hedge: 'Hedge', blitz: 'Blitz', ice: 'Ice' };
const COV_TXT = { drop: 'Big sags back to protect the rim: gives up pick-and-pop threes and pull-ups', switch: 'Switch the screen: kills off-screen shooting, gives up isolations and post mismatches', hedge: 'Big jumps out on the ball handler: slows him, the roll man gets space', blitz: 'Trap the ball handler: forces turnovers, gives up the roll man and cuts', ice: 'Push side pick-and-rolls to the baseline: a middle ground' };
const COV_FX = {
  drop:   { pnr: { mk: 0.006 }, roll: { mk: -0.025 }, pop: { mk: 0.03 }, dho: { mk: 0.01 }, cut: { mk: -0.01 } },
  switch: { pnr: { mk: -0.01 }, roll: { mk: -0.015 }, pop: { mk: -0.01 }, iso: { mk: 0.015 }, post: { mk: 0.02 }, screen: { mk: -0.025 }, dho: { mk: -0.012 } },
  hedge:  { pnr: { mk: -0.015, tov: 1.06 }, roll: { mk: 0.015 }, pop: { mk: 0.012 }, dho: { mk: -0.006 } },
  blitz:  { pnr: { mk: -0.03, tov: 1.15 }, roll: { mk: 0.03 }, cut: { mk: 0.02 }, pop: { mk: 0.015 }, kick: { mk: 0.01 }, spot: { mk: 0.004 } },
  ice:    { pnr: { mk: -0.01 }, roll: { mk: -0.006 }, pop: { mk: 0.006 }, spot: { mk: 0.004 } }
};
// how the offense leans against a coverage (scaled by the offensive coach)
const COV_OFF = { switch: { post: 1.3, iso: 1.25, screen: 0.8 }, blitz: { roll: 1.35, pop: 1.3, pnr: 0.85 }, drop: { pop: 1.2, pnr: 1.1 }, hedge: { roll: 1.15 }, ice: {} };
function coachCov(c) { if (c && c.cov && COVS.includes(c.cov)) return c.cov; const h = (((((c && c.id) || 1) * 2246822519) >>> 0) ^ 0x27d4eb2d) >>> 0, r = (h % 100) / 100;
  return c && c.def === 'switch' ? (r < 0.7 ? 'switch' : 'hedge') : c && c.def === 'pressure' ? (r < 0.5 ? 'blitz' : 'hedge') : (r < 0.75 ? 'drop' : 'ice'); }
function covOf(league, t) { return league.user === t.id && t.cov && COVS.includes(t.cov) ? t.cov : coachCov(t.coach); }
const coachAdj = c => clamp(((c.rd || 60) * 0.6 + (c.ovr || 60) * 0.4 - 50) / 35, 0, 1);   // 0 slow / overreacts ... 1 sharp
function pickPlay(off, def) {
  const cm = COV_OFF[def.cov] || {}, k = clamp(0.5 + ((off.coach.ro || 60) - 50) / 50, 0.3, 1.2), ks = [], ws = [];
  for (const p of PLAY_KEYS) { let w = off.pb[p]; if (cm[p]) w *= 1 + (cm[p] - 1) * k; if (def.dbl != null && off.court.some(x => x && x.id === def.dbl)) { if (p === 'post') w *= 0.8; else if (p === 'kick') w *= 1.3; } ks.push(p); ws.push(w); }
  return wpick(ks, ws);
}
function lateOf(league, t) { const base = coachLate(t.coach); return league.user === t.id && t.late ? Object.assign(base, t.late) : base; }
function lateSubs(g, need) {
  const pool = g.players.filter(p => !g.out.has(p.id) && g.st[p.id][IX.pf] < 6).sort((a, b) => playerValue(b, g.coach) - playerValue(a, g.coach)).slice(0, 8);
  const pairs = [];
  for (const p of pool) for (let s = 0; s < 5; s++) {
    const pen = (s === p.pos || s === p.pos2) ? 0 : Math.min(Math.abs(s - p.pos), p.pos2 != null ? Math.abs(s - p.pos2) : 9) === 1 ? 4 : 12;
    const spec = need === 'stop' ? defScore(g, p) : need === 'ft' ? offScore(g, p) * 0.5 + ((p.ft || 60) - 60) * 0.8 : offScore(g, p);   // v24.8: 'ft' = protect a lead against fouling
    pairs.push([playerValue(p, g.coach, s) * 0.5 + spec * 0.6 - pen, p, s]);
  }
  pairs.sort((a, b) => b[0] - a[0]);
  const court = [null, null, null, null, null], used = new Set();
  for (const [sc, p, s] of pairs) { if (court[s] || used.has(p.id)) continue; court[s] = p; used.add(p.id); }
  if (court.some(c => !c)) return;
  g.court = court; g.slotOf = {}; court.forEach((p, s) => g.slotOf[p.id] = s);
  g.state = need;
}
function doSubs(g, elapsed, quarter, clock, margin, ot) {
  const eligible = g.players.filter(p => !g.out.has(p.id));
  const m = Math.abs(margin);
  // Close finish: best five play. Blowout: rest the key players (fewer minutes, less injury exposure).
  const closing = ot || (quarter === 4 && clock <= 300 && m <= 10) || (quarter === 4 && clock <= 120 && m <= 15);
  const blowout = !closing && ((quarter === 4 && m >= 20) || (quarter === 4 && clock <= 360 && m >= 16) || (quarter === 3 && clock <= 180 && m >= 28));
  g.state = closing ? 'close' : blowout ? 'blowout' : 'normal';
  if (!g.keys) g.keys = new Set(g.players.slice().sort((a, b) => playerValue(b, g.coach) - playerValue(a, g.coach)).slice(0, 6).map(p => p.id));
  const pairs = [];
  for (const p of eligible) {
    const pf = g.st[p.id][IX.pf], played = g.st[p.id][IX.min];
    const needSec = g.target[p.id] * Math.min(1, (elapsed + 180) / 2880) - played;
    const onNow = g.court.some(c => c && c.id === p.id);
    let trouble = 0;
    const ftc = g.late ? g.late.ft : 'normal';   // v24.8: each coach handles foul trouble his way
    if (!closing && quarter < 4 && pf >= quarter + (ftc === 'ride' ? 2 : 1)) trouble = ftc === 'sit' ? 9 : 7;
    if (quarter === 4 && pf >= 5 && clock > (ftc === 'sit' ? 420 : ftc === 'ride' ? 180 : 300)) trouble = 6;
    if (closing && ftc === 'sit' && pf >= 5) trouble = 3;
    if (g.oppHack && quarter >= 4 && (p.ft || 60) < ENG.hackFt) trouble += 4;   // the other coach hacks bad free-throw shooters
    for (let s = 0; s < 5; s++) {
      const pen = (s === p.pos || s === p.pos2) ? 0 : Math.min(Math.abs(s - p.pos), p.pos2 != null ? Math.abs(s - p.pos2) : 9) === 1 ? 4 : 12;
      let score;
      if (closing) score = playerValue(p, g.coach, s) / 4 - pen - trouble;
      else if (blowout) score = (g.keys.has(p.id) ? -30 : 0) + (g.target[p.id] > 0 ? 0 : 1.5) + playerValue(p, g.coach, s) * 0.02 - pen - trouble * 0.3;
      else score = needSec / 60 + (onNow ? 0.8 : 0) - pen - trouble + playerValue(p, g.coach, s) * 0.03 + (g.stars && g.stars.has(p.id) && needSec > -120 ? 3 : 0);
      pairs.push([score, p, s]);
    }
  }
  pairs.sort((a, b) => b[0] - a[0]);
  const court = [null, null, null, null, null], used = new Set();
  for (const [sc, p, s] of pairs) { if (court[s] || used.has(p.id)) continue; court[s] = p; used.add(p.id); }
  g.court = court; g.slotOf = {};
  court.forEach((p, s) => { if (p) g.slotOf[p.id] = s; });
}

function onCourt(g) { return g.court.filter(Boolean); }
function avgOf(g, k, def) { const c = onCourt(g); let s = 0; for (const p of c) s += eff(g, p, k, def); return s / c.length; }

// v25.4 2a: bigs (PF/C) take threes and mid-range shots only as often as their skill supports
function bigGate(p, r, k) { if (p.pos < 3 || !k) return 1; return clamp((r - k[0]) / k[1], p.qk === 'perim' || p.qk === 'midBig' ? Math.max(k[2], 0.35) : k[2], 1); }   // v35: bigs who love jumpers take some even when they can't hit them
// v27 U8: in NBA mode real players' shot tendencies already carry their team's style, so the system's shot mix counts half (3PA spread 22-56 → about 30-46)
const SYS_SHOT_NBA = {}; for (const k in SYS_SHOT) { SYS_SHOT_NBA[k] = {}; for (const x in SYS_SHOT[k]) SYS_SHOT_NBA[k][x] = 1 + (SYS_SHOT[k][x] - 1) * 0.5; }
const NBA_TPK = 0.5;   // v27.13 U7: NBA mode, the coach's three-point slider counts half (team 3PA spread was 22-60, real 31-46)
// v28 F1: NBA mode, per-team 3PA governor. Team 3PA/g was 24-52 (real 2025-26 about 31-46). After each regular-season game a team whose
// season 3PA/g sits outside [NBA_TP3[0], NBA_TP3[1]] nudges its three-point weight t.tpK; carried into next season at half strength (sqrt).
const NBA_TP3 = [32, 44, 0.3, 0.45, 2.2];   // lo, hi, step exponent, K min, K max
function nbaTpKUpdate(t, season) {
  if (t.tpKs !== season) { t.tpK = t.tpK ? Math.sqrt(t.tpK) : 1; t.tpKs = season; }
  const x = t.trs; if (!x || x.g < 3) return;
  const r = x.tpa / x.g * 48 / (x.min / x.g), b = r > NBA_TP3[1] ? NBA_TP3[1] : r < NBA_TP3[0] ? NBA_TP3[0] : 0;
  if (b && r > 0) t.tpK = clamp((t.tpK || 1) * Math.pow(b / r, NBA_TP3[2]), NBA_TP3[3], NBA_TP3[4]);
}
function shotWeights(g, p) {
  const sys = (typeof NBA_ON !== 'undefined' && NBA_ON ? SYS_SHOT_NBA : SYS_SHOT)[g.coach.off], sd = slD(g.coach), od = g.oppCoach ? slD(g.oppCoach) : SL_ZERO, F = SL_FX;   // v27 K2
  const kTp = Math.max(0.3, 1 + (F.three.tp * sd.three + F.help.tpMix * od.help) * (typeof NBA_ON !== 'undefined' && NBA_ON ? NBA_TPK : 1)) * (typeof NBA_ON !== 'undefined' && NBA_ON && g.t && g.t.tpK || 1), kRim = Math.max(0.3, 1 + F.rim.rim * sd.rim), kPost = Math.max(0.3, 1 + F.rim.post * sd.rim), kMid = Math.max(0.3, 1 + F.three.mid * sd.three + F.rim.mid * sd.rim);
  const iqPow = 1 + p.iq / 50;
  const z = physZ(p);
  const rimSk = 0.6 * eff(g, p, 'fin') + 0.15 * p.vrt + 0.15 * p.str + 0.1 * p.spd;
  const postSk = 0.65 * eff(g, p, 'pst') + 0.2 * p.str + 0.15 * (60 + z.h * 10);
  // finishing types: dunks/lobs lean on size and bounce; layups on touch, handle and speed; floaters on touch and feel
  const dunkSk = 0.35 * eff(g, p, 'fin') + 0.3 * p.vrt + 0.2 * (60 + z.h * 10) + 0.15 * p.str;
  const laySk = 0.6 * eff(g, p, 'fin') + 0.15 * eff(g, p, 'hnd') + 0.15 * p.spd + 0.1 * p.iq;
  const floatSk = 0.5 * eff(g, p, 'fin') + 0.3 * p.iq + 0.2 * eff(g, p, 'mid');
  return { dunkSk, laySk, floatSk, dunkShare: clamp(0.14 + (dunkSk - 55) * 0.014 + z.h * 0.09 + (p.pos >= 3 ? 0.1 : 0), 0.03, 0.8),
    rim: p.trm * Math.pow(rimSk / 60, iqPow) * sys.rim * ENG.mix.rim * kRim,
    post: p.tps * 0.5 * Math.pow(postSk / 60, iqPow) * sys.post * ENG.mix.post * kPost,
    mid: p.tmd * 0.8 * Math.pow(eff(g, p, 'mid') / 60, iqPow) * sys.mid * ENG.mix.mid * kMid * bigGate(p, eff(g, p, 'mid'), ENG.bg.mid),
    tp: p.t3 * 1.45 * Math.pow(eff(g, p, 'tp') / 60, iqPow) * sys.tp * ENG.mix.tp * kTp * bigGate(p, eff(g, p, 'tp'), ENG.bg.tp),
    rimSk, postSk
  };
}
function usage(g, p) { return usage0(g, p) * (p.uf || 1) * ((g.ub && g.ub[p.id]) || 1) * ((g.t && g.t.ud && g.t.ud[p.id]) || 1); }   // v26.6: t.ud = development touches (youthPlan)
function usage0(g, p) {
  const os = (eff(g, p, 'fin') * p.trm + eff(g, p, 'mid') * p.tmd + eff(g, p, 'tp') * p.t3 + eff(g, p, 'pst') * p.tps) / (p.trm + p.tmd + p.t3 + p.tps);
  const best = Math.max(eff(g, p, 'fin'), eff(g, p, 'mid'), eff(g, p, 'tp'), eff(g, p, 'pst'));
  const s = 0.5 * os + 0.5 * best + (eff(g, p, 'hnd') - 50) * 0.15;
  return Math.pow(Math.max(s, 10) / 60, 2.3) * (1.25 - p.tpa / 200);
}

function rebPosW(g, p) { const s = g.slotOf[p.id]; return ENG.rebPos[s != null ? s : p.pos] || 1; }   // v32b: where he plays on the floor (bigs box out near the rim)
function rebKey(g, p, k) { const z = physZ(p); return Math.max(1, eff(g, p, k, k === 'drb') + z.h * ((p.xo === 'rebG' || p.xo === 'rebW') ? 1 : 5) + z.w * 2 + (p.vrt - 58) * 0.15); }

// name, relative frequency, min games, max games, severe (can end a career)
const INJURIES = [
  ['Ankle sprain', 22, 1, 6], ['Bruised knee', 10, 1, 3], ['Back spasms', 8, 1, 5], ['Hamstring strain', 8, 3, 12], ['Calf strain', 6, 2, 10],
  ['Groin strain', 5, 2, 8], ['Sprained wrist', 5, 1, 6], ['Concussion', 4, 1, 7], ['Finger dislocation', 5, 1, 4], ['Hip pointer', 4, 1, 5],
  ['Illness', 8, 1, 3], ['Plantar fasciitis', 3, 4, 15], ['Broken nose', 2, 0, 2], ['Shoulder strain', 3, 2, 8], ['Knee tendinitis', 4, 2, 10],
  ['High ankle sprain', 3, 6, 14], ['Stress reaction (foot)', 1.5, 7, 22], ['Broken hand', 1.2, 10, 24], ['MCL sprain', 1.2, 7, 30],
  ['Torn meniscus', 0.7, 14, 40], ['Fractured foot', 0.5, 18, 45], ['Torn labrum (shoulder)', 0.3, 21, 55],
  ['ACL tear', 0.25, 50, 85, 1, 1], ['Achilles tear', 0.15, 60, 90, 1, 1], ['Patellar tendon rupture', 0.08, 55, 90, 1, 1]   // v24.5: wider spread for long injuries; [5] = season-ending tier (carries over in full)
];
// Body part of each injury: a part hurt before is a little more likely to go again, and takes a little longer
const INJ_PART = [['ankle', 'Ankle'], ['knee', 'Knee'], ['mcl', 'Knee'], ['meniscus', 'Knee'], ['acl', 'Knee'], ['patellar', 'Knee'], ['back', 'Back'], ['hamstring', 'Hamstring'], ['calf', 'Calf'], ['achilles', 'Achilles'], ['groin', 'Groin'], ['wrist', 'Wrist'], ['hand', 'Hand'], ['finger', 'Hand'], ['concussion', 'Head'], ['nose', 'Head'], ['hip', 'Hip'], ['foot', 'Foot'], ['plantar', 'Foot'], ['shoulder', 'Shoulder'], ['labrum', 'Shoulder'], ['illness', 'Illness']];
function injPart(name) { const n = (name || '').toLowerCase(); const m = INJ_PART.find(([k]) => n.includes(k)); return m ? m[1] : 'Other'; }
// v24.5.1: season-ending injuries: at most 80 games, and about 22 games heal over the summer (a full offseason of rehab)
const SE_CAP = 80, SE_SUMMER = 22;
// v24.5.1: shared 'healed' step so every path clears the flags and posts the return news
function injHealed(league, p, tid) { p.injLong = false; p.hurtPlan = null; if (p.injSE) { p.injSE = false; if (typeof logNews === 'function' && tid != null) logNews(league, `${p.name} is back from his ${(p.injName || 'injury').toLowerCase()}`, tid, 'inj'); } if (p.injRamp) { p.minCap = 6; p.injRamp = false; } }
// v24.6: injuries heal by the day, not by the game. p.injury stays in games (what the AI, news and thresholds read) and every day
// takes off the share of a game a team plays per day (58 games over ~110 days, about 0.53), for everyone: rostered, two-way,
// unsigned, and lottery teams during the playoffs. Rest days heal too. Playoff days count as a full game (one every day or two).
function gpdOf(league) { const n = league.schedule && league.schedule.length; return n ? Math.min(1, SEASON_GAMES / n) : 1; }
function injGames(p) { return p && p.injury > 0 ? Math.max(1, Math.ceil(p.injury - 1e-6)) : 0; }   // games left, as shown
function healDay(league, amt) {
  for (const p of Object.values(league.players)) {
    if (!(p.injury > 0) || p.retired) continue;
    p.injury = Math.round((p.injury - amt) * 1000) / 1000;
    if (p.injury <= 0.001) { p.injury = 0; injHealed(league, p, p.team != null ? p.team : null); }
  }
}

// v24.7: day-to-day. A minor injury (sprains, bruises, illness...) with 2 games or less left is a game-time call.
// Concussions, hamstrings and anything long or severe always sit.
const DTD_MAX = 2, DTD_NAMES = ['Ankle sprain', 'Bruised knee', 'Back spasms', 'Sprained wrist', 'Finger dislocation', 'Hip pointer', 'Illness', 'Broken nose', 'Groin strain', 'Knee tendinitis', 'Plantar fasciitis', 'Shoulder strain', 'Calf strain'];
function isDTD(p) { return !!p && p.injury > 0 && p.injury <= DTD_MAX && !p.injSevere && !p.injSE && !p.injLong && DTD_NAMES.includes(p.injName); }
// Does he play tonight? Your players follow your call (p.hurtPlan: 'play' / 'sit'); otherwise the coach decides:
// less likely the more it hurts, much more likely in the playoffs and for contenders late in the season, rarely for tanking teams or young players.
function dtdPlays(league, t, p, playoff) {
  const plan = league.user === t.id ? p.hurtPlan || 'auto' : 'auto';
  if (plan === 'sit') return false; if (plan === 'play') return true;
  let c = 0.75 - 0.2 * p.injury;
  if (playoff) c += 0.3;
  else { if (t.mode === 'tank') c -= 0.3; else if (league.day >= league.schedule.length * 0.75 && ['contend', 'allin', 'push'].includes(t.mode)) c += 0.1; if (p.age <= 22) c -= 0.1; }
  if (p.ipt >= 2) c -= 0.05;
  return R() < clamp(c, 0.05, 0.95);
}
function addInjury(p, med) {
  const prev = {}; for (const x of p.injuries || []) { const pt = x.part || injPart(x.name); prev[pt] = (prev[pt] || 0) + 1; }
  const it = wpick(INJURIES, INJURIES.map(x => x[1] * (prev[injPart(x[0])] ? 1.5 : 1)));
  const rep = prev[injPart(it[0])] || 0;
  p.injury = Math.max(1, Math.round(rint(it[2], it[3]) * (1 + 0.15 * Math.min(rep, 3)) * (med || 1) * IPT_LEN[p.ipt != null ? p.ipt : 1]));   // v24.3: fragile players take longer to come back
  if (p.injury > 20) p.injury += rint(-3, 3); else if (p.injury >= 10) p.injury += rint(-2, 2);   // v28.7 F6: variety on longer layoffs (10-20 games ±2, 20+ ±3)
  p.injPart = injPart(it[0]); p.injRepeat = rep > 0;
  if (p.injury >= 15) p.injRamp = true;
  p.injLong = p.injury >= 14;
  p.injName = it[0]; p.injSevere = !!it[4]; p.injSE = !!it[5];
  if (p.injSE) p.injury = Math.min(SE_CAP, p.injury);   // v24.5.1: capped at 80 games (was 110)
  return p.injury;
}

// Medical staff: teams with bigger staff budgets get players back a little sooner (up to about 10%)
function medFactor(t) { const b = t && t.staffBudget != null ? t.staffBudget : 12; return 1 - 0.1 * clamp((b - 9) / 7, 0, 1); }
function playedYesterday(league, tid) { const d = league.schedule && league.schedule[league.day - 1]; return !!d && d.some(([h, a]) => h === tid || a === tid); }
function playGame(league, homeId, awayId, playoff) { const t0 = ENG_TICK; ENG_TICK = ++ENG_SEQ; try { return playGame0(league, homeId, awayId, playoff); } finally { ENG_TICK = t0; } }
function playGame0(league, homeId, awayId, playoff) {
  const H = buildSide(league, homeId, true, playoff), A = buildSide(league, awayId, false, playoff);
  H.oppCoach = A.coach; A.oppCoach = H.coach;   // v27 K2: shot mix reacts to the other coach's help defense
  // v24.8 late game: settings, timeouts (7 a game, 2 more per overtime), runs, intentional fouls
  for (const [g, o] of [[H, A], [A, H]]) { g.late = lateOf(league, g.t); g.tos = 7; g.toUsed = 0; g.toLate = 0; g.run = 0; g.ifl = 0; g.hacks = 0; g.atoNext = false; }
  H.oppHack = A.late.hack; A.oppHack = H.late.hack;
  const sides = [H, A];
  // v25.2: playbooks, pick-and-roll coverages, what each defense has seen, playoff adjustments carried from the last game, and the
  // play-by-play log (your team's games only)
  const series = playoff && league.po ? (league.po.rounds[league.po.stage] || []).find(sr => (sr.hi === homeId && sr.lo === awayId) || (sr.lo === homeId && sr.hi === awayId)) : null;
  for (const [g, o] of [[H, A], [A, H]]) {
    playbookOf(league, g); g.cov = covOf(league, g.t); g.cov0 = g.cov; g.covFixed = league.user === g.t.id && !!g.t.covHold; g.seen = {}; g.ppt = {}; g.pptP = {}; g.dbl = null; g.lock = null; g.hk = { on: false, left: 0, tgt: null, n: 0 };
    const ad = series && series.adj && series.adj[g.t.id];
    if (ad && !g.covFixed) { if (COVS.includes(ad.cov)) g.cov = ad.cov; if (ad.dbl != null && o.players.some(p => p.id === ad.dbl)) g.dbl = ad.dbl; if (ad.lock != null && o.players.some(p => p.id === ad.lock)) g.lock = ad.lock; }
  }
  const LOG = league.user != null && (league.user === homeId || league.user === awayId) && !league.noLog ? [] : null;
  const nm = p => p ? (p.last || splitName(p.name)[1]) : '';
  let lastCourt = '';   // v30b: entry[8] = the ten on-court ids (home 5, then away 5) when the lineup changed since the last logged play, else 0; entry[9] = seconds the play used (minutes + plus-minus replay)
  const logE = (q, clock, side, text, flags, ev, ct, secs, sx, pl) => { if (LOG) { const e = [q, Math.max(0, Math.round(clock)), side, text, H.pts, A.pts, flags || '', ev || 0]; if (ct) { const k = ct.join(); e.push(k === lastCourt ? 0 : ct, secs || 0); lastCourt = k; if (sx != null || pl) e.push(sx == null ? null : sx); if (pl) e.push(pl); } LOG.push(e); } };   // Nov 20: entry[11] = [play, handler id, post man id (kick-outs) or 0, defense coverage, doubled player id or 0] for the court animation   // Phase 2: entry[10] = shot code zone * 10 + type (0 dunk, 1 layup, 2 paint, 3 mid, 4 three) for the live court
  // Phase 2: top plays of every game (not only yours): [score, kind, player, side 0 home / 1 away, q, clock, home pts, away pts, zone, type, assist, other]; no random numbers used, so results don't change
  const HL = []; let hlGo = null;
  const hlAdd = x => { HL.push(x); HL.sort((a, b) => b[0] - a[0]); if (HL.length > 4) HL.length = 4; };
  // v32c: record substitutions in the timeline and as play-by-play lines (flag 'u')
  const subLog = (q, clock) => { for (const g of [H, A]) { const d = tlNote(g, elapsed); if (d && LOG) { const nmL = ids => ids.map(id => nm(league.players[id])).join(', '); logE(q, clock, g === H ? 0 : 1, `${g.t.abbr} sub: ${nmL(d.ins)} in${d.outs.length ? ' for ' + nmL(d.outs) : ''}`, 'u', 0, [...onCourt(H).map(p => p.id), ...onCourt(A).map(p => p.id)], 0); } } };
  const PLUR = { pnr: 'pick-and-rolls', roll: 'rolls to the rim', pop: 'pick-and-pops', iso: 'isolations', post: 'post-ups', spot: 'spot-ups', screen: 'off-screen looks', dho: 'handoffs', cut: 'cuts', horns: 'horns sets', kick: 'kick-outs', trans: 'transition' };
  // a defense reacts to what is hurting it (at timeouts and quarter breaks); smarter coaches react sooner and pick the right counter more often
  function adjustD(g, o, q, clock) {
    if (g.covFixed) return;
    const sk = coachAdj(g.coach); if (R() > 0.15 + sk * 0.35) return;
    const over = sk < 0.35 && R() < 0.4;
    let worst = null, wv = 0;
    for (const k in g.seen) { const x = g.seen[k], n = x[0]; if (!n || k === 'trans') continue; const ppp = x[1] / n; if (n < (over ? 3 : 6) || ppp < (over ? 1.25 : 1.4)) continue; const v = (ppp - 1.05) * Math.sqrt(n); if (v > wv) { wv = v; worst = k; } }
    let hot = null; const thr = q <= 2 ? 15 : q === 3 ? 21 : 27;
    for (const p of o.players) { const pts = o.st[p.id][IX.pts]; if (pts >= thr && (!hot || pts > o.st[hot.id][IX.pts])) hot = p; }
    const who = id => o.players.find(p => p.id === id);
    const lockOn = p => { const per = p.pos <= 2, dv = per ? (x => x.per * 0.6 + x.agi * 0.2 + x.spd * 0.2) : (x => x.pdf * 0.5 + x.blk * 0.3 + x.str * 0.2); const best = g.court.filter(Boolean).filter(x => per ? x.pos <= 2 || x.pos2 === 2 : x.pos >= 3).sort((a, b) => dv(b) - dv(a))[0]; if (!best) return null; g.lock = p.id; return `${g.t.abbr} puts ${nm(best)} on ${nm(p)}`; };
    let note = null;
    if (worst) {
      const x = g.seen[worst], used = who(x[2]);
      let nc = null;
      if (worst === 'pnr') nc = g.cov === 'hedge' ? 'blitz' : g.cov === 'blitz' ? 'hedge' : (R() < 0.3 + sk * 0.4 ? 'blitz' : 'hedge');
      else if (worst === 'roll') nc = g.cov === 'drop' ? 'ice' : 'drop';
      else if (worst === 'pop' || worst === 'kick' || (worst === 'spot' && g.cov === 'drop')) nc = g.cov === 'switch' ? 'hedge' : 'switch';
      else if (worst === 'screen') nc = g.cov === 'switch' ? 'hedge' : 'switch';
      else if (worst === 'cut') nc = g.cov === 'blitz' || g.cov === 'hedge' ? 'drop' : null;
      else if (worst === 'post' && used && g.dbl !== used.id) { g.dbl = used.id; note = `${g.t.abbr} sends doubles at ${nm(used)} in the post`; }
      else if (used && g.lock !== used.id) note = lockOn(used);
      if (over && nc) nc = pick(COVS.filter(c => c !== g.cov));   // a weak coach overreacts
      if (nc && nc !== g.cov) { g.cov = nc; note = `${g.t.abbr} ${nc === 'switch' ? 'starts switching' : 'switches to ' + COV_LBL[nc].toLowerCase()}${used ? ` on ${nm(used)} ${PLUR[worst]}` : ''}`; }
      g.seen[worst] = [0, 0, x[2]];   // judge the new look fresh
    }
    if (!note && hot && g.lock !== hot.id && R() < 0.3 + sk * 0.4) note = lockOn(hot);
    if (note) { (g.notes = g.notes || []).push(note); logE(q, clock, g === H ? 0 : 1, note, 'a'); }
  }
  // v17: grudges against a former team and player rivalries: a small lift to everything he does, and he looks for his shot more
  H.ub = {}; A.ub = {}; H.special = []; A.special = [];
  for (const [g, o] of [[H, A], [A, H]]) for (const p of g.players) {
    const gr = (p.grudge || []).find(x => x.tid === o.t.id && x.until >= league.season);
    const rv = (league.rivals || []).find(r => r.until >= league.season && ((r.a === p.id && o.players.some(q => q.id === r.b)) || (r.b === p.id && o.players.some(q => q.id === r.a))));
    const b = (gr ? ENG.grudge : 0) + (rv ? ENG.rival : 0); if (!b) continue;
    g.form[p.id].o += b; g.form[p.id].d += b; g.ub[p.id] = 1 + b * 0.1;
    g.special.push({ pid: p.id, grudge: !!gr, rival: rv ? (rv.a === p.id ? rv.b : rv.a) : null });
  }
  if (league.career && typeof careerGameFx === 'function') careerGameFx(league, H, A);   // My Career: your calls in this game
  // Playoff games are more physical: slower, more fouls, tougher shots, and strength matters more inside
  const PHY = playoff ? { pace: 0.985, trans: 0.9, foul: 1.12, shot: 0.007, str: 0.0006 } : { pace: 1, trans: 1, foul: 1, shot: 0, str: 0 };
  // each coach's tempo, nudged by his systems: pace & space and pressure speed it up, inside-out slows it down
  const sysPace = c => c.pace + (SYS_FX.off[c.off] || {}).pace + (SYS_FX.def[c.def] || {}).pace;
  const pace = (sysPace(H.coach) + sysPace(A.coach)) / 2 * PHY.pace * ENG.pace;
  const events = { injuries: [], clutch: {} };
  // v22 clutch tracking: final 2 minutes of the 4th quarter or overtime, score within 6. Per player: [points, FGA, FGM, plus/minus, go-ahead buckets]
  const clAdd = (id, i, v) => { const c = events.clutch[id] || (events.clutch[id] = [0, 0, 0, 0, 0]); c[i] += v; };
  const clFin = c => { const op = (c.off === H ? H.pts - c.h : A.pts - c.a), dp = (c.off === H ? A.pts - c.a : H.pts - c.h), lead0 = (c.off === H ? c.h - c.a : c.a - c.h);
    c.offC.forEach((p, i) => { const st = c.off.st[p.id], dpts = st[IX.pts] - c.pts[i]; clAdd(p.id, 0, dpts); clAdd(p.id, 1, st[IX.fga] - c.fga[i]); clAdd(p.id, 2, st[IX.fgm] - c.fgm[i]); clAdd(p.id, 3, op - dp); if (dpts > 0 && lead0 <= 0 && lead0 + op - dp > 0) clAdd(p.id, 4, 1); });
    c.defC.forEach(p => clAdd(p.id, 3, dp - op)); };
  let poss = R() < 0.5 ? 0 : 1; const firstPoss = poss;
  let elapsed = 0, quarter = 0;
  const qScores = [];

  function injuryCheck(g, involved) {
    if (league.noInj) return;
    for (const p of onCourt(g)) {
      let pr = 0.00012 * (1.8 - p.dur / 100) * IPT_INJ[p.ipt != null ? p.ipt : 1] * (involved && involved.has(p.id) ? 2.5 : 1) * (g.tired && g.tired.has(p.id) ? ENG.b2bInj : 1) * (g.hurt && g.hurt.has(p.id) ? ENG.hurtInj : 1) * (1 - SL_FX.depth.inj * slDep(g.coach));   // v27 K2: deep benches wear players down less; v24.3: injury-proneness tier; v24.6: back-to-back fatigue
      if (R() < pr) {
        const n = addInjury(p, medFactor(g.t));
        p.injury += gpdOf(league); // v24.6: today's healing tick comes after this game and leaves n
        g.out.add(p.id);
        events.injuries.push({ pid: p.id, tid: g.t.id, games: n, long: p.injLong, name: p.injName, severe: p.injSevere });
        return true;
      }
    }
    return false;
  }

  function runPeriod(len, ot) {
    quarter++;
    let clock = len, lastSub = elapsed;
    H.qFouls = 0; A.qFouls = 0;
    if (ot) for (const g of sides) { g.tos += 2; g.toLate = 0; }
    else if (quarter <= 3) for (const g of sides) if (g.tos > 4 && R() < 0.55) { g.tos--; g.toUsed++; logE(quarter, len, g === H ? 0 : 1, `Timeout ${g.t.abbr}`, 't'); }   // routine timeouts (no effect on play)
    for (const g of sides) g.hk.on = false;
    if (quarter >= 2) { adjustD(H, A, quarter, len); adjustD(A, H, quarter, len); }   // v25.2: quarter breaks and halftime
    poss = ot ? (R() < 0.5 ? 0 : 1) : (quarter === 1 || quarter === 4 ? firstPoss : 1 - firstPoss);
    const startH = H.pts, startA = A.pts;
    if (!ot && quarter >= 2) for (const g of sides) if (g.planSrc === 'coach') planMakeUp(g, elapsed);   // v32c: make up minutes lost to fouls / blowouts
    for (const g of sides) subStep(g, elapsed, quarter, clock, (g === H ? 1 : -1) * (H.pts - A.pts), ot, true);   // v32c: plan or coach's call
    subLog(quarter, clock);
    let orebPoss = false, cPend = null, pushTeam = null;   // v25.3: pushTeam = side whose rebounder (rebG/pointW) starts the break
    while (clock > 0) {
      const off = sides[poss], def = sides[1 - poss];
      // substitution windows (every ~3 minutes) or forced
      const need = sides.some(g => g.court.some(p => !p || g.out.has(p.id)));
      const late = quarter >= 4 && clock <= 360;
      { const due = need || elapsed - lastSub >= (late ? 60 : 180); if (due) lastSub = elapsed;
        for (const g of sides) subStep(g, elapsed, quarter, clock, (g === H ? 1 : -1) * (H.pts - A.pts), ot, due); }   // v32c: follow the rotation plan
      if (quarter >= 4 && clock <= 120 && Math.abs(H.pts - A.pts) <= 6) {
        // the defense protects a lead or a tie with stoppers; the offense chasing points goes to its scorers
        const offSide = sides[poss], defSide = sides[1 - poss];
        const offLead = (offSide === H ? 1 : -1) * (H.pts - A.pts);
        lateSubs(defSide, 'stop');
        if (offLead <= 0) lateSubs(offSide, 'score');
      }
      // v24.8: a leader expecting to be fouled puts its free-throw shooters on the floor
      if (quarter >= 4 && clock <= 60 && sides.some(g => g.late.foul !== 'never')) { const ld = H.pts > A.pts ? H : A.pts > H.pts ? A : null, tr = ld === H ? A : H; if (ld && tr.late.foul !== 'never' && Math.abs(H.pts - A.pts) <= 10 && ld.state !== 'ft') lateSubs(ld, 'ft'); }
      subLog(quarter, clock);
      const offC = onCourt(off), defC = onCourt(def);
      if (offC.length < 5 || defC.length < 5) { /* extremely rare: play short-handed */ }
      if (cPend) { clFin(cPend); cPend = null; }
      if (quarter >= 4 && clock <= 120 && Math.abs(H.pts - A.pts) <= 6) cPend = { off, offC, defC, h: H.pts, a: A.pts, pts: offC.map(p => off.st[p.id][IX.pts]), fga: offC.map(p => off.st[p.id][IX.fga]), fgm: offC.map(p => off.st[p.id][IX.fgm]) };
      // v24.8 late game: timeouts, intentional fouls, hack-a-player, clock management
      const lead0 = (off === H ? 1 : -1) * (H.pts - A.pts), lateQ = quarter >= 4;
      let special = null, atoNow = false;
      { // a team on the wrong end of a run calls timeout (how soon depends on the coach), and runs a set play next time down
        for (const g of sides) { const o = g === H ? A : H, L8 = g.late.to, thr = L8 === 'runs' ? 6 : L8 === 'save' ? 10 : 8, keep = L8 === 'save' ? 3 : L8 === 'runs' ? 1 : 2;
          if (o.run >= thr && g.tos > keep && !(lateQ && clock <= 180)) { g.tos--; g.toUsed++; logE(quarter, clock, g === H ? 0 : 1, `Timeout ${g.t.abbr} (${o.t.abbr} on a ${o.run}-0 run)`, 't'); o.run = 0; g.atoNext = true; adjustD(H, A, quarter, clock); adjustD(A, H, quarter, clock); } }
        if (off.atoNext) { off.atoNext = false; atoNow = true; }
        // late and close: the offense calls timeout to advance the ball and draw up a play
        if (lateQ && clock <= 24 && lead0 <= 0 && lead0 >= -3 && off.tos > 0 && off.toLate < 2 && !orebPoss) { off.tos--; off.toUsed++; off.toLate++; atoNow = true; logE(quarter, clock, off === H ? 0 : 1, `Timeout ${off.t.abbr}`, 't'); adjustD(def, off, quarter, clock); }
      }
      if (!orebPoss) {
        const trail = -lead0, dl = def.late;   // trail > 0: the defense is ahead; the defense fouls when IT trails, i.e. lead0 > 0
        const win = dl.foul === 'aggr' ? 50 : dl.foul === 'late' ? 30 : 0, maxDown = dl.foul === 'aggr' ? 8 : 6;
        if (lateQ && win && clock <= win && ((lead0 >= 3 && lead0 <= maxDown) || (lead0 >= 1 && clock <= 20))) special = 'ifoul';   // down 1-2 only once the shot clock is off
        else if (lateQ && clock <= 8 && lead0 === -3 && dl.foul !== 'never' && def.qFouls >= 5 && R() < 0.5) special = 'give';   // up 3 with seconds left: foul before they can shoot a three
        else if (dl.hack) {   // v25.2: short spells only (2-4 trips), late in the 2nd quarter or in the 4th outside the last 2 minutes
          const hk = def.hk, win = (quarter === 2 && clock <= 150) || (quarter === 4 && clock <= 600 && clock > 120);
          if (hk.on && (!win || !offC.some(p => p.id === hk.tgt) || Math.abs(lead0) > 10)) hk.on = false;   // he went to the bench, the window closed or the gap grew
          if (!hk.on && win && hk.n < 2 && Math.abs(lead0) <= 8 && R() < ENG.hackStart) { const t0 = offC.filter(p => (p.ft || 60) < ENG.hackFt).sort((a, b) => (a.ft || 60) - (b.ft || 60))[0]; if (t0) { hk.on = true; hk.left = rint(2, 4); hk.tgt = t0.id; hk.n++; } }
          if (hk.on) { special = 'hack'; if (--hk.left <= 0) hk.on = false; }
        }
      }
      // Possession length
      const fromOreb = orebPoss;
      const transition = !orebPoss && R() < (pushTeam === off ? 1.5 : 1) * 0.11 * ((SYS_FX.off[off.coach.off] || {}).trans || 1) * (avgOf(off, 'spd') / 60) * Math.sqrt(onCourt(off).reduce((a, p) => a + (p.ttr || 50), 0) / onCourt(off).length / 50) * (pace / 99) * PHY.trans * (1 + SL_FX.pace.trans * clamp(((off.coach.pace || 99) - 99) / 7, -1, 1)) * Math.max(0.5, 1 + SL_FX.three.trans * Math.max(0, slD(def.coach).three) + SL_FX.glass.trans * slD(def.coach).glass);   // v27 K2: long rebounds / crashing give up run-outs
      let secs = transition ? rnd(3, 7) : orebPoss ? clamp(gauss(8, 4), 2, 20) : clamp(gauss(2880 / (2 * pace) - 0.5, 5), 4, 24);
      let shotClockViolation = false, holdShot = false, twoFor1 = false;
      if (special) secs = special === 'hack' ? rnd(2, 6) : rnd(1, 4);
      else {
        // v24.8 clock: the leader milks it late, the team behind hurries, and the last possession of a period holds for the last shot
        if (lateQ && clock <= 120 && lead0 > 0 && lead0 <= 12 && !transition) secs = orebPoss ? clamp(gauss(12, 2), 6, 14) : clamp(gauss(19, 3), 12, 24);
        else if (lateQ && clock <= 60 && lead0 < 0 && lead0 >= -12) secs = clamp(gauss(8, 3), 3, 14);
        if (clock <= 24 && !orebPoss) { secs = lateQ && lead0 < 0 && clock >= 10 ? clock - rnd(2, 6) : clock; holdShot = true; }   // hold for the last shot (a team behind late leaves itself a little time)
        else if (quarter <= 3 && clock > 28 && clock <= 40 && !transition && !orebPoss && R() < 0.6) { secs = Math.min(secs, rnd(4, 9)); twoFor1 = true; }   // v25.2: 2-for-1 at the end of a quarter
        if (!transition && !orebPoss && R() < 0.005 * (1 + (55 - avgOf(off, 'iq')) / 30)) { secs = Math.min(24, clock); shotClockViolation = true; }
      }
      if (secs > clock) secs = clock;
      clock -= secs; elapsed += secs;
      for (const g of sides) for (const p of onCourt(g)) g.st[p.id][IX.min] += secs;
      orebPoss = false; pushTeam = null;
      const involved = new Set();
      const pmH = H.pts, pmA = A.pts, onH = onCourt(H), onA = onCourt(A);
      { const d = H.pts - A.pts; if (d > (H.maxLead || 0)) H.maxLead = d; if (-d > (A.maxLead || 0)) A.maxLead = -d; }
      let switchPoss = true;

      const weights = offC.map(p => usage(off, p));
      { const avgW = weights.reduce((x, y) => x + y, 0) / weights.length; for (let i = 0; i < weights.length; i++) weights[i] = Math.min(weights[i], avgW * 2.1); }
      // Primary ball handler for this possession: the offense runs through ball-dominant players (more so in an isolation system)
      const dom = offC.map(p => domWeight(off, p));
      if (off.coach.off === 'iso') { const mx = Math.max(...dom); for (let i = 0; i < dom.length; i++) if (dom[i] === mx) dom[i] *= 1.3; }
      if (off.coach.off === 'motion') { const avg = dom.reduce((a, b) => a + b, 0) / dom.length; for (let i = 0; i < dom.length; i++) dom[i] = (dom[i] + avg) / 2; }
      { const bd = slD(off.coach).ball; if (bd) { const avg = dom.reduce((a, b) => a + b, 0) / dom.length, k = clamp(SL_FX.ball.dom * bd, -0.6, 0.6); for (let i = 0; i < dom.length; i++) dom[i] = Math.max(0.01, dom[i] + (avg - dom[i]) * k); } }   // v27 K2: motion spreads it, iso concentrates
      let handler = wpick(offC, dom);
      // v25.2: the play, and late-game sets (need a 3, after-timeout plays, closer isolation, last shot)
      let play = null, setN = null, forceShooter = null, forceType = null, usedBy = null, desc = '', shotX = null, kickFrom = 0;
      const snapE = LOG ? [...onH.map(p => [p.id, H]), ...onA.map(p => [p.id, A])].map(([id, g]) => [id, g, g.st[id].slice(1, 15)]) : null;
      if (!special && !shotClockViolation) {
        if (transition) play = 'trans';
        else if (!fromOreb) {
          const c0 = clock + secs;
          if (lateQ && c0 <= 40 && lead0 === -3) { const sh = offC.slice().sort((a, b) => eff(off, b, 'tp') - eff(off, a, 'tp'))[0]; play = 'screen'; forceShooter = sh; forceType = 'tp'; setN = `Need a 3: stagger for ${nm(sh)}`; }
          else if (atoNow) { const lob = offC.filter(p => p.pos >= 3).sort((a, b) => PF.roll(b) - PF.roll(a))[0]; if (lob && PF.roll(lob) >= 1.3 && R() < 0.22) { play = 'roll'; forceShooter = lob; forceType = 'dunk'; setN = `ATO · Inbound lob to ${nm(lob)}`; } else { play = pickPlay(off, def); setN = 'ATO · ' + (R() < 0.5 ? 'Sideline out-of-bounds' : 'Baseline out-of-bounds'); } }
          else if (lateQ && c0 <= 120 && lead0 <= 0 && lead0 >= -2 && R() < 0.45) { const cl = offC.slice().sort((a, b) => usage0(off, b) * ((b.tcl || 55) / 55) - usage0(off, a) * ((a.tcl || 55) / 55))[0]; play = 'iso'; forceShooter = cl; setN = `Closer iso for ${nm(cl)}`; }
          else play = pickPlay(off, def);
          if (holdShot && !setN) setN = 'Hold for last shot'; else if (twoFor1) setN = '2-for-1';
        }
      }
      if (play === 'dho' || play === 'horns' || play === 'kick') { const hb = offC.find(p => p.xo === 'hub'); if (hb && hb.id !== handler.id && R() < 0.6) handler = hb; }   // v25.3: a passing big runs the set
      const PX = play ? PLAYS[play] : null, CX = play ? (COV_FX[def.cov] || {})[play] || {} : {};
      if (special) {
        // v24.8: intentional foul. The offense gets the ball to good free-throw shooters; a hack goes after the bad one.
        const tgt = special === 'hack' ? (offC.find(p => p.id === def.hk.tgt) || offC.slice().sort((a, b) => (a.ft || 60) - (b.ft || 60))[0])
          : R() < (def.late.hack ? 0.35 : 0.2) ? offC.slice().sort((a, b) => (a.ft || 60) - (b.ft || 60))[0] : wpick(offC, offC.map(p => Math.pow(Math.max(10, p.ft || 60), 3) * (0.5 + domWeight(off, p))));
        const fouler = wpick(defC, defC.map(p => def.st[p.id][IX.pf] >= 5 ? 0.02 : 1 / (1 + def.st[p.id][IX.pf])));
        def.st[fouler.id][IX.pf]++; def.qFouls++; if (def.st[fouler.id][IX.pf] >= 6) def.out.add(fouler.id);
        if (special === 'hack') def.hacks++; else def.ifl++;
        involved.add(tgt.id);
        const f0 = off.st[tgt.id][IX.ftm];
        const r = freeThrows(off, def, tgt, 2, involved); if (r === 'oreb') { orebPoss = true; switchPoss = false; }
        if (LOG) desc = `${special === 'hack' ? `Hack-a-${nm(tgt)}` : special === 'give' ? 'Foul to give' : 'Intentional foul'} (${nm(fouler)}): ${nm(tgt)} ${off.st[tgt.id][IX.ftm] - f0}/2 FT`;
      } else if (shotClockViolation) {
        off.st[handler.id][IX.tov]++;
        if (LOG) desc = `Shot-clock violation (${nm(handler)})`;
      } else {
        // Turnover?
        const sec = 0.5 * eff(off, handler, 'hnd') + 0.3 * eff(off, handler, 'pas') + 0.2 * eff(off, handler, 'iq');
        const gamble = defC.reduce((s, p) => s + p.tgb, 0) / defC.length;
        const sO = slD(off.coach), sDf = slD(def.coach);   // v27 K2: rim pressure, pace, motion vs a switching defense, gambling defenses
        let pTO = (1 + SL_FX.rim.tov * sO.rim + SL_FX.pace.tov * (((off.coach.pace || 99) - 99) / 7) + (def.cov === 'switch' ? SL_FX.ball.tovSw * Math.max(0, sO.ball) : 0) + SL_FX.gamble.tov * sDf.gamble) * ENG.tov * (1 + (60 - sec) * ENG.tovSlope) * (1 + (avgOf(def, 'stl', true) - 50) * 0.008) * (1 + (gamble - 45) * 0.004) * ((SYS_FX.def[def.coach.def] || {}).tov || 1) * ((SYS_FX.off[off.coach.off] || {}).tov || 1) * (off.coach.off === 'motion' ? 1 + Math.max(0, 55 - avgOf(off, 'iq')) * SYS_FX.off.motion.iqTov : 1) * (transition ? 1.1 : 1) * (PX ? PX.tov : 1) * (CX.tov || 1);
        if (R() < pTO) {
          if (TOV_USE > 0 && R() < TOV_USE) { const w = wpick(offC, weights.map(x => x * x)); if (w) handler = w; }   // v33d: turnovers follow usage too, not only the ball handler (high-usage scorers had 1-2 a game: PER 41-46)
          off.st[handler.id][IX.tov]++; involved.add(handler.id); usedBy = handler;
          let stl = null;
          if (R() < 0.52 * (1 + (gamble - 45) * 0.006)) {
            const st = wpick(defC, defC.map(p => Math.pow(eff(def, p, 'stl', true), 2) * (0.5 + p.tgb / 100)));
            def.st[st.id][IX.stl]++; involved.add(st.id); stl = st;
          }
          if (LOG) desc = stl ? fl('pbp.steal', { name: nm(handler), stealer: nm(stl) }, quarter * 100000 + Math.round(clock) * 100 + H.pts + A.pts * 3) : fl('pbp.turnover', { name: nm(handler) }, quarter * 100000 + Math.round(clock) * 100 + H.pts + A.pts * 3);
        } else {
          // Non-shooting foul?
          const fdcAvg = avgOf(def, 'fdc', true);
          if (R() < 0.065 * PHY.foul * (1 + (55 - fdcAvg) * 0.012)) {
            const fouler = wpick(defC, defC.map(p => (150 - p.fdc) * (def.st[p.id][IX.pf] >= 4 ? 0.35 : 1)));
            def.st[fouler.id][IX.pf]++; def.qFouls++;
            if (def.st[fouler.id][IX.pf] >= 6) def.out.add(fouler.id);
            if (def.qFouls >= 5) {
              const sh = R() < 0.5 ? handler : wpick(offC, weights); usedBy = sh; const f0 = off.st[sh.id][IX.ftm];
              const r = freeThrows(off, def, sh, 2, involved); if (r === 'oreb') { orebPoss = true; switchPoss = false; }
              if (LOG) desc = `Foul on ${nm(fouler)} (bonus): ${nm(sh)} ${off.st[sh.id][IX.ftm] - f0}/2 FT`;
            } else { switchPoss = false; orebPoss = true; if (LOG) desc = `Foul on ${nm(fouler)}`; } // side-out, same team keeps the ball
          } else {
            // Shot: the handler creates his own shot, or moves the ball to a teammate
            const best = Math.max(eff(off, handler, 'fin'), eff(off, handler, 'mid'), eff(off, handler, 'tp'), eff(off, handler, 'pst'));
            const clutchTime = quarter >= 4 && clock <= 120 && Math.abs(H.pts - A.pts) <= 6;
            const pSelf = clamp(0.24 + (handler.tbd - 50) / 180 - (handler.tpa - 50) / 200 + (best - 60) / 300 - ((handler.tcs || 55) - 55) / 300 + (clutchTime ? ((handler.tcl || 55) - 55) / 150 : 0) + (off.coach.off === 'iso' ? 0.05 : off.coach.off === 'motion' ? -0.05 : 0), 0.1, 0.65);
            let self = R() < pSelf;
            const mates0 = offC.filter(p => p.id !== handler.id);
            const mw = () => mates0.map(p => weights[offC.indexOf(p)] * (clutchTime ? Math.pow((p.tcl || 55) / 55, 1.5) : 1));
            let shooter;
            // v25.2: the play decides who shoots: the handler in a pick-and-roll, the best isolation scorer, a roll man, a popper, a spot-up shooter...
            if (forceShooter) { shooter = forceShooter; self = forceShooter.id === handler.id || play === 'iso'; }
            else if (play === 'pnr') { self = self || R() < 0.75; shooter = self ? handler : wpick(mates0, mw()); }
            else if (play === 'iso') { shooter = wpick(offC, offC.map((p, i) => weights[i] * PF.iso(p))); self = true; }
            else if (play && PF[play] && play !== 'dho' && play !== 'horns') { self = false; shooter = wpick(mates0, mates0.map(p => weights[offC.indexOf(p)] * Math.pow(Math.max(0.05, PF[play](p)), 0.8))); }
            else shooter = self ? handler : wpick(mates0, mw());
            // v36a: a player already past ENG.shareCap of his team's shots tonight gives up some of them to a teammate (top usage ran 40-46%, PER 40+)
            if (!forceShooter && ENG.shareCap) { let tf = 0; for (const id in off.st) tf += off.st[id][IX.fga]; if (tf >= 12) { const sh = off.st[shooter.id][IX.fga] / tf; if (sh > ENG.shareCap && R() < Math.min(0.6, (sh - ENG.shareCap) * ENG.shareK)) { const ms = offC.filter(p => p.id !== shooter.id); shooter = wpick(ms, ms.map(p => weights[offC.indexOf(p)])); self = false; } } }
            // a doubled post scorer kicks it out about a third of the time
            if (play === 'post' && def.dbl === shooter.id && R() < 0.35) { const post = shooter, outs = offC.filter(p => p.id !== post.id); kickFrom = post.id; shooter = wpick(outs, outs.map(p => PF.kick(p))); self = false; play = 'kick'; setN = `Double on ${nm(post)} → kick-out`; }
            // putback: right after an offensive rebound, the rebounder often goes straight back up
            let putback = false;
            if (fromOreb && off.putback != null) { const rb = offC.find(p => p.id === off.putback); if (rb && R() < 0.38) { shooter = rb; putback = true; } }
            off.putback = null;
            involved.add(shooter.id);
            const sw = shotWeights(off, shooter);
            const OX = SYS_FX.off[off.coach.off] || {}, DX = SYS_FX.def[def.coach.def] || {};
            // rim attempts split into dunks/lobs (more for big, bouncy players, and more when set up by a pass) and layups; post-ups and floaters are paint shots
            const big = shooter.pos >= 3;
            const rimW = sw.rim * (transition ? 2.2 : 1), dShare = clamp(sw.dunkShare * (self ? 0.75 : 1.35) * (transition ? 1.3 : 1), 0.02, 0.85);
            const floatW = shooter.trm * 0.22 * (big ? 0.25 : 1) * Math.pow(sw.floatSk / 60, 2) * ENG.mix.post;
            let types = ['dunk', 'lay', 'paint', 'mid', 'tp'], tw = [rimW * dShare, rimW * (1 - dShare), sw.post * (transition ? 0.2 : 1) + floatW, sw.mid, sw.tp];
            if (play && PLAYS[play].mix && !putback) { const mx = PLAYS[play].mix, nz = off.pbNorm; tw = tw.map((w, i) => w * mx[types[i]] / (nz[types[i]] || 1)); }
            const type = putback ? (sw.dunkShare > 0.25 ? 'dunk' : 'lay') : forceType || wpick(types, tw);
            const zone = pickZone(type, (OX.corner || 0.26) * ENG.mix.corner);
            const slot = off.slotOf[shooter.id];
            const mm = matchups(off, def);
            let defender = mm[shooter.id] || def.court[slot] || defC[0];
            if (def.coach.def === 'switch' && R() < 0.18) defender = defC[Math.floor(R() * defC.length)];   // switches create mismatches
            const z = physZ(defender);
            const contest = 0.85 + defender.tct / 400; // 1.0 at 60
            // v15: carrying the offense costs a little on defense (about 2 points of defense at a 30% shot share)
            const dLoad = (() => { let tf = 0; for (const id in def.st) tf += def.st[id][IX.fga]; if (tf < 10) return 0; return Math.max(0, def.st[defender.id][IX.fga] / tf - 0.2) * ENG.dLoad; })();
            const perD = (0.5 * eff(def, defender, 'per', true) + 0.2 * defender.agi + 0.15 * defender.spd + 0.15 * defender.iq + z.w * 2) - dLoad;
            const intD = 0.4 * (0.4 * eff(def, defender, 'pdf', true) + 0.2 * eff(def, defender, 'blk', true) + 0.15 * defender.str + 0.15 * (60 + z.h * 10) + 0.1 * defender.iq - dLoad) + 0.6 * (avgOf(def, 'pdf', true) * 0.5 + avgOf(def, 'blk', true) * 0.5);   // help defense matters at the rim
            const helpIQ = avgOf(def, 'iq', true);
            let pm;
            const ZB = ENG.zone;
            if (type === 'dunk') pm = ZB.dunk + (sw.dunkSk - 60) * 0.003 - (intD - 55) * 0.0022;
            else if (type === 'lay') pm = ZB.lay + (sw.laySk - 60) * 0.0045 - (intD - 55) * 0.0035 + physZ(shooter).h * 0.015;   // size helps finish over help
            else if (type === 'paint') { const ps = (shooter.tps * sw.postSk + floatW * 4 * sw.floatSk) / (shooter.tps + floatW * 4 || 1); pm = ZB.paint + (ps - 60) * 0.0045 - (intD - 55) * 0.0035; }
            else if (type === 'mid') pm = ZB.mid + (eff(off, shooter, 'mid') - 60) * 0.0045 - (perD - 58) * 0.0025;
            else pm = ZB.tp + (eff(off, shooter, 'tp') - 60) * ENG.tpSlope - (perD - 58) * 0.0022 + (zone === 9 || zone === 13 ? ENG.c3 : ENG.atb3 * clamp((eff(off, shooter, 'tp') - 35) / 30, 0, 1.3));   // v25.2: the above-the-break lift goes to real shooters
            if (putback) pm += 0.04;
            if (atoNow) pm += ENG.ato;   // v24.8: a play drawn up in a timeout
            { const b0 = ZB[type]; pm = b0 + (pm - b0) * ENG.slope; }   // how much skill gaps matter
            // system trade-offs
            const inside = type === 'dunk' || type === 'lay' || type === 'paint';
            if (type === 'tp' && OX.early3 && !self) pm += OX.early3 * (transition ? 0 : 1);
            if (type === 'tp' && OX.early3 && self) pm += OX.early3;
            if (inside && OX.crowd && off.chem && off.chem.space < 0 && def.coach.def === 'rim') pm += OX.crowd;
            if (DX[type]) pm += DX[type];
            if (play) { pm += (PLAYS[play].mk || 0) + (((COV_FX[def.cov] || {})[play] || {}).mk || 0); if (play === 'post' && def.dbl === shooter.id) pm -= 0.04; }   // v25.2: play and coverage
            if (type === 'tp' && DX.tpTop && zone >= 10 && zone <= 12) pm += DX.tpTop;
            if (type === 'paint' && DX.paintBig && big) pm += DX.paintBig;
            // volume costs efficiency: a player taking a big share of his team's shots gets tougher looks
            { let tf = 0; for (const id in off.st) tf += off.st[id][IX.fga]; if (tf >= 10) { const sh = off.st[shooter.id][IX.fga] / tf; if (sh > 0.2) pm -= ENG.useTax * (sh - 0.2); } }
            // ratings drift up over the years; this keeps league-wide shooting steady
            if (league.lgOvr0 != null && league.lgOvr > league.lgOvr0) pm -= ENG.drift * (league.lgOvr - league.lgOvr0);
            pm -= (contest - 1) * 0.15;
            // chemistry: our spacing/ball movement/fit, their rim protection and perimeter defense
            { const oc = off.chem, dc = def.chem; if (oc && dc) { pm += ENG.chem * (oc.space * (inside ? 1 : 0.4) + oc.crowd + oc.fit + (oc.duo || 0)) + (ENG.sys[off.coach.off] || 0) + (ENG.sysD[def.coach.def] || 0); pm -= ENG.chem * (inside ? dc.rim : dc.perim); } }
            // game state: a big second-half lead relaxes the leader and pushes the trailing team
            { const lead = (off === H ? 1 : -1) * (H.pts - A.pts); if (quarter >= 2 && Math.abs(lead) > ENG.relaxFrom) pm -= Math.sign(lead) * Math.min(ENG.relaxCap, (Math.abs(lead) - ENG.relaxFrom) * ENG.relax); }
            pm -= (helpIQ - 55) * 0.0008;
            if (!self && (type === 'tp' || type === 'mid')) pm += ((shooter.tcs || 55) - 55) * 0.0004 * (OX.cs || 1);   // catch-and-shoot specialists hit assisted jumpers
            if (clutchTime) pm += ((shooter.tcl || 55) - 55) * 0.0008;                                       // some players want the big shot
            if (transition && (type === 'dunk' || type === 'lay')) pm += 0.05;
            if (off.isHome) pm += 0.008 + ((off.t.hype == null ? 50 : off.t.hype) - 50) * 0.0001;   // a hyped crowd helps a little
            pm += (off.coach.ro - 60) * 0.0005 - (def.coach.rd - 60) * 0.0005;
            { const dd = slD(def.coach); pm += (inside ? -SL_FX.help.rimMk * dd.help : type === 'tp' ? SL_FX.help.tpMk * dd.help : 0) + SL_FX.gamble.mk * Math.max(0, dd.gamble) + SL_FX.ball.defIso * Math.max(0, -dd.ball); if (quarter >= 4) pm += SL_FX.depth.q4 * (slDep(off.coach) - slDep(def.coach)); }   // v27 K2: pack the paint vs run off the line; gambling breakdowns; iso teams' role players drift on defense
            if (playoff) { pm -= PHY.shot; if (inside) pm += (shooter.str - defender.str) * PHY.str; }
            const dEff = ENG.slope * (type === 'mid' ? -(perD - 58) * 0.0025 : type === 'tp' ? -(perD - 58) * 0.0022 : -0.4 * ((0.4 * eff(def, defender, 'pdf', true) + 0.2 * eff(def, defender, 'blk', true) + 0.15 * defender.str + 0.15 * (60 + z.h * 10) + 0.1 * defender.iq - dLoad) - 55) * (type === 'dunk' ? 0.0022 : 0.0035)) - (contest - 1) * 0.15;
            const pmX = clamp(pm - dEff, 0.12, 0.92);
            pm = clamp(pm, 0.12, 0.92);
            const is3 = type === 'tp';
            // Block?
            const blkBase = { dunk: 0.03, lay: 0.085, paint: 0.06, mid: 0.025, tp: 0.008 }[type];
            const blocker = wpick(defC, defC.map(p => Math.pow(Math.max(1, eff(def, p, 'blk', true) + physZ(p).h * 6 + physZ(p).w * 4), ENG.blkSel) * (p.id === defender.id ? 1.6 : 1)));
            const pBlk = blkBase * ENG.blkK * Math.pow((eff(def, blocker, 'blk', true) + physZ(blocker).h * 6 + physZ(blocker).w * 4) / 60, ENG.blkPow);   // v32b: blkK / blkPow (was 1 / 1.4): more blocks for elite rim protectors
            // Shooting foul?
            const fBase = { dunk: 0.13, lay: 0.2, paint: 0.15, mid: 0.05, tp: 0.02 }[type] * (1 + SL_FX.rim.foul * slD(off.coach).rim + SL_FX.gamble.foul * slD(def.coach).gamble) * (OX.foul || 1) * (inside ? (DX.foul || 1) : 1) * (off.coach.off === 'iso' && shooter.id !== handler.id ? 0.92 : 1);
            const fouler = R() < (def.st[defender.id][IX.pf] >= 4 ? 0.25 : 0.5) ? defender : wpick(defC, defC.map(p => (150 - p.fdc) * (def.st[p.id][IX.pf] >= 4 ? 0.35 : 1)));
            const pFoul = fBase * PHY.foul * (eff(off, shooter, 'drw') / 52) * (1 + (60 - fouler.fdc) * 0.01) * contest;
            const fouled = R() < pFoul;
            if (fouled) { def.st[fouler.id][IX.pf]++; def.qFouls++; if (def.st[fouler.id][IX.pf] >= 6) def.out.add(fouler.id); involved.add(fouler.id); }
            let blocked = !fouled && R() < pBlk;
            let made = !blocked && R() < (fouled ? pm * 0.45 : pm);
            const st = off.st[shooter.id];
            let astBy = null, rebBy = null, rebO = false, ft0 = 0, ftN = 0;
            if (blocked) { def.st[blocker.id][IX.blk]++; involved.add(blocker.id); }
            if (!(fouled && !made)) { const d0 = dzOf(def, defender.id); d0[0]++; if (made) d0[1]++; d0[2] += pmX; if (inside) for (const q of defC) { const dq = dzOf(def, q.id); dq[5]++; if (made) dq[6]++; } }
            if (!(fouled && !made)) { st[IX.fga]++; if (is3) st[IX.tpa]++; const zs = off.zs[shooter.id] || (off.zs[shooter.id] = new Array(ZONES * 2).fill(0)); zs[zone * 2]++; def.zsOpp[zone * 2]++; if (made) { zs[zone * 2 + 1]++; def.zsOpp[zone * 2 + 1]++; } }
            if (made) {
              const pts = is3 ? 3 : 2; st[IX.fgm]++; st[IX.pts] += pts; off.pts += pts; if (is3) st[IX.tpm]++;
              const aBase = { dunk: putback ? 0 : 0.8, lay: 0.42, paint: 0.3, mid: 0.5, tp: 0.84 }[type] * Math.sqrt(Math.max(20, avgOf(off, 'pas') - onCourt(off).reduce((s, p) => s + (p.xoPas || 0), 0) / 5) / 52) * (self ? 0.55 : 1.25) * (OX.ast || 1) * (1 + SL_FX.ball.ast * slD(off.coach).ball) * (play ? PLAYS[play].ast : 1);
              if (R() < Math.min(0.95, aBase)) {
                const mates = offC.filter(p => p.id !== shooter.id);
                const a = !self && R() < 0.3 + eff(off, handler, 'pas') / 250 ? handler : wpick(mates, mates.map(p => Math.pow(eff(off, p, 'pas'), 2.5) * (0.4 + p.tpa / 100)));
                off.st[a.id][IX.ast]++; astBy = a;
              }
              if (fouled) { ft0 = st[IX.ftm]; freeThrows(off, def, shooter, 1, involved); ftN = 1; }
            } else if (fouled) {
              ft0 = st[IX.ftm]; ftN = is3 ? 3 : 2;
              const r = freeThrows(off, def, shooter, is3 ? 3 : 2, involved); if (r === 'oreb') { orebPoss = true; switchPoss = false; }
            } else {
              // Rebound
              const offReb = avgOf(off, 'orb') + physAvg(off), defReb = avgOf(def, 'drb', true) + physAvg(def);
              let pO = 0.235 + (offReb - defReb) * ENG.rebSlope + (blocked ? 0.04 : 0) + (is3 ? 0.01 : 0) + (onCourt(off).reduce((a, p) => a + (p.tcr || 40), 0) / onCourt(off).length - 40) * 0.0012 + (OX.orb || 0) + (DX.drb || 0) + SL_FX.glass.orb * slD(off.coach).glass;
              if (R() < clamp(pO, 0.1, 0.4)) {
                const r = wpick(offC, offC.map(p => Math.pow(rebKey(off, p, 'orb'), ENG.orbPow) * rebPosW(off, p)));
                if (R() >= ENG.teamReb) off.st[r.id][IX.orb]++; involved.add(r.id); orebPoss = true; switchPoss = false; off.putback = r.id; rebBy = r; rebO = true;   // v32b: some boards are team rebounds (no player credit). Fix (Nov 18): offense keeps the ball after its rebound
              } else {
                const r = wpick(defC, defC.map(p => Math.pow(rebKey(def, p, 'drb'), ENG.drbPow) * rebPosW(def, p) * (is3 && (p.xo === 'rebG' || p.xo === 'rebW') ? 1.5 : 1)));
                if (R() >= ENG.teamReb) def.st[r.id][IX.drb]++; rebBy = r; if (r.xo === 'rebG' || r.xo === 'pointW') pushTeam = def;
              }
            }
            { // Phase 2: highlight candidates (dunks, threes, and-ones, blocks, clutch go-ahead shots)
              const ti = { dunk: 0, lay: 1, paint: 2, mid: 3, tp: 4 }[type], sg = off === H ? 1 : -1, before = sg * (pmH - pmA), after = sg * (H.pts - A.pts);
              const late = quarter >= 4 && clock <= 120 && Math.abs(H.pts - A.pts) <= 6, flair = ((shooter.id * 7 + Math.round(clock) * 13 + quarter) % 10) / 20;
              const side = off === H ? 0 : 1, hl = (sc, k, pid, other) => hlAdd([Math.round((sc + flair) * (late ? 1.6 : 1) * 10) / 10, k, pid, k === 'B' ? 1 - side : side, quarter, Math.max(0, Math.round(clock)), H.pts, A.pts, zone, ti, astBy ? astBy.id : 0, other || 0]);
              if (made) { const k = putback && type === 'dunk' ? 'P' : fouled ? 'A' : type === 'dunk' ? 'D' : is3 ? '3' : null;
                if (k) hl({ P: 6.5, A: 4.5, D: 5, 3: 4.2 }[k] + (transition ? 1 : 0) + (k === 'A' && type === 'dunk' ? 2 : 0) + (is3 && zone >= 10 && zone <= 12 ? 0.3 : 0) + (before <= 0 && after > 0 ? 1.5 : 0), k, shooter.id, 0);
                if (before <= 0 && after > 0) hlGo = [quarter, clock, shooter.id, side, H.pts, A.pts, zone, ti, astBy ? astBy.id : 0, fouled ? 1 : 0]; }
              else if (blocked) hl(3.5 + (type === 'dunk' || type === 'lay' ? 1 : 0), 'B', blocker.id, shooter.id);
              if (LOG) shotX = zone * 10 + ti; }
            usedBy = shooter;
            if (LOG) { const SN = { dunk: 'dunk', lay: 'layup', paint: shooter.tps * sw.postSk >= floatW * 4 * sw.floatSk ? 'post hook' : 'floater', mid: 'mid-range jumper', tp: (zone === 9 || zone === 13) ? 'corner 3PT' : '3PT' }[type];
              desc = `${setN ? setN + ' · ' : ''}${play && play !== 'trans' ? PLAYS[play].n + ': ' : play === 'trans' ? 'Transition: ' : fromOreb ? (putback ? 'Putback: ' : 'Second chance: ') : ''}${fl(made ? 'pbp.make' : blocked ? 'pbp.blocked' : 'pbp.miss', { name: nm(shooter), shot: SN, blocker: blocked ? nm(blocker) : '' }, quarter * 100000 + Math.round(clock) * 100 + H.pts + A.pts * 3)}${made && fouled ? ', and-one ' + (st[IX.ftm] - ft0) + '/1' : !made && fouled ? ` (fouled by ${nm(fouler)}, ${st[IX.ftm] - ft0}/${ftN} FT)` : ''}${astBy ? ` (ast. ${nm(astBy)})` : ''}${rebBy ? ` · ${rebO ? 'offensive rebound' : 'rebound'} ${nm(rebBy)}` : ''}`; }
          }
        }
      }
      { const gH = H.pts - pmH, gA = A.pts - pmA; for (const p of onH) dzOf(H, p.id)[3] += gA; for (const p of onA) dzOf(A, p.id)[3] += gH; if (switchPoss) for (const p of (poss === 0 ? onA : onH)) dzOf(poss === 0 ? A : H, p.id)[4]++; }
      { const gH = H.pts - pmH, gA = A.pts - pmA; if (gH > 0) { H.run += gH; A.run = 0; } if (gA > 0) { A.run += gA; H.run = 0; } }   // v24.8: runs
      { const dh = (H.pts - pmH) - (A.pts - pmA); if (dh) { for (const p of onH) H.st[p.id][IX.pm] += dh; for (const p of onA) A.st[p.id][IX.pm] -= dh; } }
      // v25.2: points per possession by play (team, the player who used it, and what the defense has seen tonight)
      if (play && usedBy) { const gained = off.pts - (off === H ? pmH : pmA); const x = off.ppt[play] || (off.ppt[play] = [0, 0]); x[0]++; x[1] += gained;
        const m = off.pptP[usedBy.id] || (off.pptP[usedBy.id] = {}), y = m[play] || (m[play] = [0, 0]); y[0]++; y[1] += gained;
        const z = def.seen[play] || (def.seen[play] = [0, 0, null]); z[0]++; z[1] += gained; z[2] = usedBy.id; }
      if (LOG && desc) { const ev = []; for (const [id, g, a0] of snapE) { const a1 = g.st[id]; for (let i = 0; i < 14; i++) { const d = a1[i + 1] - a0[i]; if (d) ev.push(id, i + 1, d); } }
        const sc = (off.pts - (off === H ? pmH : pmA)) > 0, cl = quarter >= 4 && clock <= 300 && Math.abs(H.pts - A.pts) <= 5;
        logE(quarter, clock, off === H ? 0 : 1, desc, (sc ? 's' : '') + (cl ? 'c' : ''), ev.length ? ev : 0, LOG ? [...onH.map(p => p.id), ...onA.map(p => p.id)] : null, secs, shotX, play ? [play, handler ? handler.id : 0, kickFrom, def.cov || '', def.dbl != null ? def.dbl : 0] : null); }
      injuryCheck(off, involved); injuryCheck(def, involved);
      if (switchPoss) poss = 1 - poss;
    }
    if (cPend) clFin(cPend);
    qScores.push([H.pts - startH, A.pts - startA]);
    logE(quarter, 0, -1, `End of ${ot ? 'OT' + (quarter > 5 ? quarter - 4 : '') : 'Q' + quarter}: ${A.t.abbr} ${A.pts}, ${H.t.abbr} ${H.pts}`, 'q');
  }

  function physAvg(g) { let s = 0; const c = onCourt(g); for (const p of c) s += physZ(p).h * 8 + physZ(p).w * 3; return s / c.length; }

  function freeThrows(off, def, shooter, n, involved) {
    const st = off.st[shooter.id];
    const pct = clamp(ENG.ftA + eff(off, shooter, 'ft') * ENG.ftB, 0.2, 0.95);   // v25.2: steeper (30 -> 50%, 50 -> 64%, 75 -> 81%, 90 -> ~91% after the elite knee)
    let last = true;
    for (let i = 0; i < n; i++) { st[IX.fta]++; last = R() < pct; if (last) { st[IX.ftm]++; st[IX.pts]++; off.pts++; } }
    if (!last) {
      const offC = onCourt(off), defC = onCourt(def);
      if (R() < 0.13) { const r = wpick(offC, offC.map(p => Math.pow(rebKey(off, p, 'orb'), ENG.orbPow) * rebPosW(off, p))); if (R() >= ENG.teamReb) off.st[r.id][IX.orb]++; return 'oreb'; }
      const r = wpick(defC, defC.map(p => Math.pow(rebKey(def, p, 'drb'), ENG.drbPow) * rebPosW(def, p))); if (R() >= ENG.teamReb) def.st[r.id][IX.drb]++;
    }
    return 'done';
  }

  for (let q = 0; q < 4; q++) runPeriod(720, false);
  let ot = 0;
  while (H.pts === A.pts && ot < 8) { ot++; runPeriod(300, true); }
  if (H.pts === A.pts) { H.pts++; } // safety: never ends tied

  const game = finishGame(league, H, A, qScores, ot, events);
  game.pt = { [H.t.id]: H.ppt, [A.t.id]: A.ppt }; game.ptP = Object.assign({}, H.pptP, A.pptP);
  game.cov = [H.cov0 + (H.cov !== H.cov0 ? '>' + H.cov : ''), A.cov0 + (A.cov !== A.cov0 ? '>' + A.cov : '')];
  game.tl = [H.tl || null, A.tl || null];   // v32c: rotation timeline (kept for your games and recent league games)
  if (LOG) game.pbp = LOG;
  { // Phase 2: a go-ahead shot by the winner in the last 24 seconds (or of OT) is the game-winner, the night's top play
    const hg = hlGo, win = H.pts > A.pts ? 0 : 1;
    if (hg && hg[3] === win && hg[0] >= 4 && hg[1] <= 24) { for (let i = HL.length - 1; i >= 0; i--) if (HL[i][2] === hg[2] && HL[i][4] === hg[0] && HL[i][5] === Math.max(0, Math.round(hg[1]))) HL.splice(i, 1); hlAdd([20 + (hg[1] <= 3 ? 4 : 0), 'G', hg[2], hg[3], hg[0], Math.max(0, Math.round(hg[1])), hg[4], hg[5], hg[6], hg[7], hg[8], hg[9]]); }
    if (HL.length) game.hl = HL.slice(0, 3); }
  if (series) { series.adj = series.adj || {}; for (const g of [H, A]) series.adj[g.t.id] = { cov: g.cov, dbl: g.dbl, lock: g.lock }; }   // adjustments carry over to the next game of the series
  return game;
}

// v15 defensive assignments: the best perimeter defender takes the opponent's top perimeter scorer and the best big takes their top big,
// always within position groups (guards/wings on slots 0-2, bigs on 3-4). Switch defense can still leave mismatches.
function matchups(off, def) {
  const key = off.court.map(p => p ? p.id : 0).join() + '|' + def.court.map(p => p ? p.id : 0).join() + '|' + (def.lock || 0);
  if (def.mKey === key) return def.mMap;
  const m = {}, threat = p => p.ovr + (p.tbd || 50) * 0.25 + Math.max(p.mid || 0, p.tp || 0, p.fin || 0) * 0.2;
  const perD = p => p.per * 0.6 + p.agi * 0.2 + p.spd * 0.2, bigD = p => p.pdf * 0.5 + p.blk * 0.3 + p.str * 0.2;
  for (const [slots, dv] of [[[0, 1, 2], perD], [[3, 4], bigD]]) {
    const o = slots.map(s => off.court[s]).filter(Boolean).sort((a, b) => threat(b) - threat(a));
    const d = slots.map(s => def.court[s]).filter(Boolean).sort((a, b) => dv(b) - dv(a));
    o.forEach((p, i) => { if (d[i]) m[p.id] = d[i]; });
    // v25.2: the best defender in the group takes the hot scorer the coach locked onto
    if (def.lock != null && o.some(p => p.id === def.lock) && d[0] && m[def.lock] !== d[0]) { const was = m[def.lock], other = o.find(p => m[p.id] === d[0]); m[def.lock] = d[0]; if (other) m[other.id] = was; }
  }
  def.mKey = key; def.mMap = m; return m;
}
function dzOf(g, id) { return g.dz[id] || (g.dz[id] = [0, 0, 0, 0, 0, 0, 0]); }   // [contested FGA, FGM allowed, expected FGM, opp pts on court, def possessions, opp rim FGA on court, opp rim FGM on court]
function finishGame(league, H, A, qScores, ot, events) {
  const box = [];
  for (const g of [H, A]) for (const p of g.players) {
    const s = g.st[p.id];
    if (s[IX.min] > 0 || s[IX.gs]) box.push([p.id, g === H ? 0 : 1, ...s.map((v, i) => i === 0 ? Math.round(v) : v)]);
  }
  const hurtIds = [H, A].flatMap(g => [...(g.hurt || [])].filter(id => g.st[id] && g.st[id][IX.min] > 0));
  const game = { lg: { to: [H.toUsed, A.toUsed], ifl: [H.ifl, A.ifl], hack: [H.hacks, A.hacks] }, hurt: hurtIds.length ? hurtIds : undefined, cl: Object.keys(events.clutch).length ? events.clutch : undefined, id: league.games.length + 1, season: league.season, day: league.day, home: H.t.id, away: A.t.id, hs: H.pts, as: A.pts, ot, q: qScores, box, inj: events.injuries, playoff: false, lead: [H.maxLead || 0, A.maxLead || 0], zs: Object.assign({}, H.zs, A.zs), zsOpp: [H.zsOpp, A.zsOpp], dz: Object.assign({}, H.dz, A.dz), special: [...(H.special || []), ...(A.special || [])] };
  return game;
}

// Apply a finished game to standings, player stats, injuries
function applyGame(league, game) {
  const h = league.teams[game.home], a = league.teams[game.away];
  const hw = game.hs > game.as;
  if (!game.playoff) {
    h.pf += game.hs; h.pa += game.as; a.pf += game.as; a.pa += game.hs;
    if (hw) { h.w++; h.hw++; a.l++; a.al = (a.al || 0) + 1; } else { a.w++; a.aw = (a.aw || 0) + 1; h.l++; h.hl++; }
    h.streak = hw ? Math.max(1, h.streak + 1) : Math.min(-1, h.streak - 1);
    a.streak = !hw ? Math.max(1, a.streak + 1) : Math.min(-1, a.streak - 1);
    if (h.conf === a.conf) { if (hw) { h.cw++; a.cl++; } else { a.cw++; h.cl++; } }
    if (hw) { h.coach.w++; a.coach.l++; } else { a.coach.w++; h.coach.l++; }
    h.last10 = ((h.last10 || '') + (hw ? 'W' : 'L')).slice(-10);
    a.last10 = ((a.last10 || '') + (!hw ? 'W' : 'L')).slice(-10);
  }
  if (game.playoff) { if (hw) { h.coach.pw++; a.coach.pl++; } else { a.coach.pw++; h.coach.pl++; } }
  addTeamStats(league, game);
  recordH2H(league, game);
  const key = game.playoff ? 'po' : 'rs';
  if (game.dz) { const dk = game.playoff ? 'dzp' : 'dz'; for (const id in game.dz) { const p = league.players[id]; if (!p) continue; const a = p.stats[dk] || (p.stats[dk] = [0, 0, 0, 0, 0, 0, 0]), b = game.dz[id]; for (let i = 0; i < 7; i++) a[i] += b[i]; } delete game.dz; }
  // shot zones (makes/attempts by zone): player season totals, team shooting and opponents' shooting
  if (game.zs) {
    const zk = game.playoff ? 'zp' : 'zr', add = (arr, src) => { for (let i = 0; i < src.length; i++) arr[i] += src[i]; };
    for (const id in game.zs) { const p = league.players[id]; if (!p) continue; if (!p.stats[zk]) p.stats[zk] = new Array(ZONES * 2).fill(0); add(p.stats[zk], game.zs[id]); }
    for (const [t, opp, i] of [[h, a, 0], [a, h, 1]]) {
      if (game.playoff) continue;
      t.zr = t.zr || new Array(ZONES * 2).fill(0); t.zrOpp = t.zrOpp || new Array(ZONES * 2).fill(0);
      for (const id in game.zs) { const p = league.players[id]; if (p && (p.team === t.id || (p.tw && p.tw.tid === t.id))) add(t.zr, game.zs[id]); }
      add(t.zrOpp, game.zsOpp[i]);
    }
    // Phase 1: keep each game's shots for the box-score shot chart: one letter per shot, SH_ABC[zone * 2 + made] (this season's games only; old games have none)
    game.sh = {}; for (const id in game.zs) { const z = game.zs[id]; let t = ''; for (let i = 0; i < ZONES; i++) { const at = z[i * 2], mk = z[i * 2 + 1]; if (at) t += SH_ABC[i * 2 + 1].repeat(mk) + SH_ABC[i * 2].repeat(at - mk); } if (t) game.sh[id] = t; }
    delete game.zs; delete game.zsOpp;
  }
  // v25.2: points per possession by play type (regular season): team totals and the player who used the possession
  if (game.pt) {
    if (!game.playoff) {
      for (const tid in game.pt) { const t = league.teams[tid]; if (!t) continue; t.pt = t.pt || {}; for (const k in game.pt[tid]) { const x = t.pt[k] || (t.pt[k] = [0, 0]); x[0] += game.pt[tid][k][0]; x[1] += game.pt[tid][k][1]; } }
      for (const id in game.ptP) { const p = league.players[id]; if (!p) continue; const m = p.stats.pt || (p.stats.pt = {}); for (const k in game.ptP[id]) { const x = m[k] || (m[k] = [0, 0]); x[0] += game.ptP[id][k][0]; x[1] += game.ptP[id][k][1]; } }
    }
    delete game.pt; delete game.ptP;
  }
  for (const row of game.box) {
    const p = league.players[row[0]]; if (!p) continue;
    p.stats[key] = p.stats[key] || { gp: 0, gs: 0, min: 0, pts: 0, fgm: 0, fga: 0, tpm: 0, tpa: 0, ftm: 0, fta: 0, orb: 0, drb: 0, ast: 0, stl: 0, blk: 0, tov: 0, pf: 0, pm: 0 };
    if (p.stats[key].pm == null) p.stats[key].pm = 0;
    const s = p.stats[key];
    if (row[2] > 0) s.gp++;
    BX.forEach((k, i) => { if (k === 'gs') s.gs += row[2 + i]; else s[k] += row[2 + i]; });
    // split by team, so a player traded mid-season is credited to each team for the games he played there
    const tid = row[1] === 0 ? game.home : game.away;
    const split = p.stats[key + 'T'] = p.stats[key + 'T'] || {};
    const ts = split[tid] = split[tid] || { gp: 0, gs: 0, min: 0, pts: 0, fgm: 0, fga: 0, tpm: 0, tpa: 0, ftm: 0, fta: 0, orb: 0, drb: 0, ast: 0, stl: 0, blk: 0, tov: 0, pf: 0, pm: 0 };
    if (row[2] > 0) ts.gp++;
    BX.forEach((k, i) => { ts[k] = (ts[k] || 0) + row[2 + i]; });
    // v24.3: career line against each opponent (regular season and playoffs together)
    if (row[2] > 0) {
      const opp = tid === game.home ? game.away : game.home, vs = p.vs = p.vs || {};
      if (Array.isArray(vs[opp]) && typeof vsUnpack === 'function') vs[opp] = vsUnpack(vs[opp]);   // v32h: a packed line (retired player back in the league)
      const o = vs[opp] = vs[opp] || { gp: 0, w: 0, min: 0, pts: 0, fgm: 0, fga: 0, tpm: 0, tpa: 0, ftm: 0, fta: 0, reb: 0, ast: 0, stl: 0, blk: 0, tov: 0 };
      o.gp++; if ((tid === game.home) === (game.hs > game.as)) o.w++;
      o.min += row[2 + IX.min]; o.pts += row[2 + IX.pts]; o.fgm += row[2 + IX.fgm]; o.fga += row[2 + IX.fga]; o.tpm += row[2 + IX.tpm]; o.tpa += row[2 + IX.tpa]; o.ftm += row[2 + IX.ftm]; o.fta += row[2 + IX.fta];
      o.reb += row[2 + IX.orb] + row[2 + IX.drb]; o.ast += row[2 + IX.ast]; o.stl += row[2 + IX.stl]; o.blk += row[2 + IX.blk]; o.tov += row[2 + IX.tov];
      // v24.4: this season's line (replaced when a new season starts) and a playoff split, next to the career row
      const won = (tid === game.home) === (game.hs > game.as), reb = row[2 + IX.orb] + row[2 + IX.drb];
      const sk = game.playoff ? 'po' : 'cs';
      if (sk === 'cs' && (!o.cs || o.cs.s !== league.season)) o.cs = { s: league.season, gp: 0, w: 0, min: 0, pts: 0, reb: 0, ast: 0 };
      const x = o[sk] = o[sk] || { gp: 0, w: 0, min: 0, pts: 0, reb: 0, ast: 0 };
      x.gp++; if (won) x.w++; x.min += row[2 + IX.min]; x.pts += row[2 + IX.pts]; x.reb += reb; x.ast += row[2 + IX.ast];
    }
  }
  // injuries tick down for both rosters
  if (!game.playoff) for (const t of [h, a]) for (const id of t.roster) { const p = league.players[id]; if (p.holdout && p.holdout.left > 0 && --p.holdout.left === 0) { p.holdout = null; if (typeof logNews === 'function') logNews(league, `${p.name} ends his holdout and reports to ${t.abbr}`, t.id, 'tx'); } }
  for (const t of [h, a]) for (const id of t.roster) { const p = league.players[id]; if (!(p.injury > 0) && p.minCap > 0 && game.box.some(r => r[0] === p.id && r[2] > 0)) p.minCap--; }
  // v24.6: who played and how long (for back-to-back fatigue and resting); healing is daily now (healDay)
  if (!game.playoff) for (const r of game.box) if (r[2 + IX.min] > 0) { const p = league.players[r[0]]; if (p) { p.lastDay = game.day; p.lastMin = Math.round(r[2 + IX.min] / 60); } }
  recordGame(league, game);
  if (typeof gameAch === 'function') gameAch(league, game);
  if (typeof financeGame === 'function') financeGame(league, game);
  if (league.log.length > 400) league.log.length = 400;
}

// Team totals for and against, per season (regular season and playoffs separately)
const TS_KEYS = ['pts', 'fgm', 'fga', 'tpm', 'tpa', 'ftm', 'fta', 'orb', 'drb', 'ast', 'stl', 'blk', 'tov', 'pf'];
function addTeamStats(league, game) {
  const sum = si => { const o = {}; for (const k of TS_KEYS) o[k] = 0; for (const r of game.box) if (r[1] === si) TS_KEYS.forEach(k => o[k] += r[2 + IX[k]]); return o; };
  const hs = sum(0), as = sum(1);
  const key = game.playoff ? 'tpo' : 'trs';
  for (const [t, mine, opp, ot] of [[league.teams[game.home], hs, as, game.ot], [league.teams[game.away], as, hs, game.ot]]) {
    const x = t[key] = t[key] || { g: 0, min: 0 };
    x.g++; x.min += 48 + 5 * (ot || 0);
    for (const k of TS_KEYS) { x[k] = (x[k] || 0) + mine[k]; x['o' + k] = (x['o' + k] || 0) + opp[k]; }

    if (!game.playoff && typeof NBA_ON !== 'undefined' && NBA_ON) nbaTpKUpdate(t, league.season);   // v28 F1
  }
}
// v28.3 F3: standings race, wins of every team saved every 7 game days (current season only)
function raceRec(L) {
  if (!L.race || L.race.s !== L.season) L.race = { s: L.season, d: [], w: [] };
  if (L.race.d[L.race.d.length - 1] === L.day) return;
  L.race.d.push(L.day); L.race.w.push(L.teams.map(t => t.w));
}
function simDay(league) {
  if (league.phase !== 'regular' || league.day >= league.schedule.length) return false;
  beforeDay(league);
  for (const [h, a] of league.schedule[league.day]) {
    const g = playGame(league, h, a);
    applyGame(league, g);
    league.games.push(g); tlPrune(league);
  }
  if (typeof twoWayDay === 'function') twoWayDay(league, league.games.slice(-league.schedule[league.day].length));
  healDay(league, gpdOf(league));
  league.day++;
  if (league.career && typeof careerDay === 'function') { try { careerDay(league, league.games.slice(-league.schedule[league.day - 1].length)); } catch (e) { console.error(e); } }   // My Career
  if (league.day % 7 === 0 || league.day >= league.schedule.length) raceRec(league);   // v28.3 F3
  afterDay(league);
  if (league.day >= league.schedule.length) {
    if (typeof updateWeekly === 'function') { try { if (league.day % 7 !== 0) { updatePowerRankings(league); updateWeekly(league, true); } else if (league.wk && league.wk.s === league.season) league.wk.final = true; } catch (e) { } }   // v25.5: report for the last days of the season
    league.phase = 'regular-done'; if (typeof relabelStatus === 'function') relabelStatus(league); computeAwards(league); if (typeof payIncentives === 'function') payIncentives(league); }
  return true;
}


// ===== Playoffs =====
// Top 6 qualify. Play-in: 7v10 and 8v9; higher seed needs 1 win, lower seed needs 2 straight.
// Fixed bracket: QF 1v8, 4v5, 2v7, 3v6 (best of 5), SF best of 5, Finals best of 7.
// Conference format: top 3 per conference qualify. Play-in: seed 4 hosts seed 5 (4 needs 1 win, 5 needs 2 straight).
// Conference semis 1 v 4/5 winner and 2 v 3 (best of 5), conference finals (best of 5), Finals between conference champions (best of 7).
const PO_STAGES = ['Play-in', 'Conference semifinals', 'Conference finals', 'Finals'];
// v21 (30 teams): top 6 per conference qualify. Play-in: 7 vs 8 (winner is the 7 seed), 9 vs 10; then the 7/8 loser hosts the 9/10 winner for the 8 seed.
// First round 1v8, 4v5, 2v7, 3v6, conference semis, conference finals and Finals: all best of 7 (v30a; was best of 5 before the Finals).
const PO_STAGES_BIG = ['Play-in', 'Play-in: last spot', 'First round', 'Conference semifinals', 'Conference finals', 'Finals'];
const PO_BIG_BEST = 7;   // v30a #24: first round, conference semis and conference finals are best of 7 in 30-team leagues (was 5); the Finals were already 7
const poStages = L => (L.po && L.po.big != null ? L.po.big : L.teams && isBig(L)) ? PO_STAGES_BIG : PO_STAGES;
const isPlayin = (L, i) => /Play-in/.test(poStages(L)[i] || '');
// Result label from the last stage a team reached (works for both formats and old saves)
function poLabel(stage, won) {
  if (stage == null) return 'Missed playoffs';
  if (stage === 'Finals') return won ? 'Champion' : 'Lost in Finals';
  if (/Play-in/.test(stage)) return 'Lost in play-in';
  if (stage === 'First round') return 'Lost in first round';
  if (stage === 'Conference semifinals') return 'Lost in conference semis';
  return 'Lost in conference finals';
}
const poDirect = L => isBig(L) ? 6 : 3, poPlayinTo = L => isBig(L) ? 10 : 5;
const CONFS = ['North', 'South'];
const pctOf = t => t.w / Math.max(1, t.w + t.l);
// This season's head-to-head wins: m['a-b'] = games a won against b (regular season)
function seasonH2H(league) {
  const m = {};
  for (const g of league.games) { if (g.playoff || g.season !== league.season) continue; const w = g.hs > g.as ? g.home : g.away, l = w === g.home ? g.away : g.home; m[w + '-' + l] = (m[w + '-' + l] || 0) + 1; }
  return m;
}
// Seeding: win %, then for tied teams head-to-head this season (among all tied teams), conference record, point differential
function seedOrder(league, conf) {
  const ts = league.teams.filter(t => !conf || t.conf === conf).slice().sort((a, b) => pctOf(b) - pctOf(a));
  const out = []; let h2 = null;
  for (let i = 0; i < ts.length;) {
    let j = i; while (j < ts.length && Math.abs(pctOf(ts[j]) - pctOf(ts[i])) < 1e-9) j++;
    const grp = ts.slice(i, j);
    if (grp.length > 1) {
      h2 = h2 || seasonH2H(league);
      const ids = grp.map(t => t.id);
      const hp = t => { let w = 0, g = 0; for (const o of ids) if (o !== t.id) { const a = h2[t.id + '-' + o] || 0, b = h2[o + '-' + t.id] || 0; w += a; g += a + b; } return g ? w / g : 0.5; };
      const cp = t => (t.cw + t.cl) ? t.cw / (t.cw + t.cl) : 0.5;
      grp.sort((a, b) => hp(b) - hp(a) || cp(b) - cp(a) || (b.pf - b.pa) - (a.pf - a.pa) || (b.expW || 0) - (a.expW || 0));
    }
    out.push(...grp); i = j;
  }
  return out.map(t => t.id);
}
function mkSeries(hi, lo, hiSeed, loSeed, hiNeed, loNeed, best, conf) {
  return { hi, lo, hiSeed, loSeed, hiNeed, loNeed, best, conf, hw: 0, lw: 0, games: [], winner: null };
}
function startPlayoffs(league) {
  const seeds = { North: seedOrder(league, 'North'), South: seedOrder(league, 'South') };
  const big = isBig(league);
  league.po = { seeds, stage: 0, rounds: [], champion: null, day: 0, big };
  if (big) league.po.rounds.push(CONFS.flatMap(c => [mkSeries(seeds[c][6], seeds[c][7], 7, 8, 1, 1, 1, c), mkSeries(seeds[c][8], seeds[c][9], 9, 10, 1, 1, 1, c)]));
  else league.po.rounds.push(CONFS.map(c => mkSeries(seeds[c][3], seeds[c][4], 4, 5, 1, 2, 2, c)));
  league.phase = 'playoffs';
  const ab = id => league.teams[id].abbr;
  if (big) { league.log.unshift({ season: league.season, day: league.day, cat: 'league', text: `Playoffs set. ${CONFS.map(c => `${c}: ${seeds[c].slice(0, 6).map(ab).join(', ')}; play-in ${ab(seeds[c][6])} vs ${ab(seeds[c][7])}, ${ab(seeds[c][8])} vs ${ab(seeds[c][9])}`).join('. ')}.` }); return; }
  league.log.unshift({ season: league.season, day: league.day, cat: 'league', text: `Playoffs set. ${confName('North', league)}: ${seeds.North.slice(0, 3).map(ab).join(', ')}, play-in ${ab(seeds.North[3])} vs ${ab(seeds.North[4])}. ${confName('South', league)}: ${seeds.South.slice(0, 3).map(ab).join(', ')}, play-in ${ab(seeds.South[3])} vs ${ab(seeds.South[4])}.` });
}
function hiHome(sr, n) {
  if (sr.best === 2) return true;
  if (sr.best === 5) return [1, 2, 5].includes(n);
  return [1, 2, 5, 7].includes(n);
}
function nextRound(league) {
  const po = league.po, r = po.rounds[po.stage];
  const W = sr => ({ id: sr.winner, seed: sr.winner === sr.hi ? sr.hiSeed : sr.loSeed });
  const pair = (a, b, best, conf) => { const need = Math.ceil(best / 2); return a.seed < b.seed || (a.seed === b.seed && pctOf(league.teams[a.id]) >= pctOf(league.teams[b.id])) ? mkSeries(a.id, b.id, a.seed, b.seed, need, need, best, conf) : mkSeries(b.id, a.id, b.seed, a.seed, need, need, best, conf); };
  let next = null;
  if (po.big) {
    const L_ = (sr) => sr.winner === sr.hi ? sr.lo : sr.hi;
    if (po.stage === 0) { po.seven = {}; next = CONFS.map((c, i) => { const a = r[i * 2], b = r[i * 2 + 1]; po.seven[c] = a.winner; return mkSeries(L_(a), b.winner, 8, b.winner === b.hi ? 9 : 10, 1, 1, 1, c); }); }
    const B = PO_BIG_BEST;   // v30a #24: every round best of 7 in 30-team leagues
    if (po.stage === 1) { next = []; CONFS.forEach((c, i) => { const s = po.seeds[c], eight = r[i].winner; next.push(pair({ id: s[0], seed: 1 }, { id: eight, seed: 8 }, B, c), pair({ id: s[3], seed: 4 }, { id: s[4], seed: 5 }, B, c), pair({ id: s[1], seed: 2 }, { id: po.seven[c], seed: 7 }, B, c), pair({ id: s[2], seed: 3 }, { id: s[5], seed: 6 }, B, c)); }); }
    else if (po.stage === 2) next = [0, 1, 2, 3].map(k => pair(W(r[k * 2]), W(r[k * 2 + 1]), B, r[k * 2].conf));
    else if (po.stage === 3) next = [pair(W(r[0]), W(r[1]), B, 'North'), pair(W(r[2]), W(r[3]), B, 'South')];
    else if (po.stage === 4) { const a = { id: r[0].winner, seed: 1 }, b = { id: r[1].winner, seed: 1 }; next = [pair(a, b, 7, null)]; }
  } else if (po.stage === 0) {
    next = [];
    CONFS.forEach((c, i) => { const s = po.seeds[c]; next.push(pair({ id: s[0], seed: 1 }, { id: r[i].winner, seed: 4 }, 5, c), pair({ id: s[1], seed: 2 }, { id: s[2], seed: 3 }, 5, c)); });
  } else if (po.stage === 1) next = [pair(W(r[0]), W(r[1]), 5, 'North'), pair(W(r[2]), W(r[3]), 5, 'South')];
  else if (po.stage === 2) { const a = { id: r[0].winner, seed: 1 }, b = { id: r[1].winner, seed: 1 }; next = [pair(a, b, 7, null)]; }
  if (next) { po.rounds.push(next); po.stage++; }
  else {
    po.champion = r[0].winner; league.phase = 'season-done';
    const t = league.teams[po.champion];
    t.titles = (t.titles || 0) + 1;
    if (typeof hypeBump === 'function') hypeBump(t, 10);
    finalsMVP(league, r[0]);
    league.log.unshift({ season: league.season, day: league.day, cat: 'award', text: `The ${t.city} ${t.name} win the ${yr(league.season)} championship, ${Math.max(r[0].hw, r[0].lw)}-${Math.min(r[0].hw, r[0].lw)} in the Finals.` });
  }
}
// Play one day of the current round. Returns false if nothing was played.
function simPlayoffDay(league) {
  if (league.phase !== 'playoffs') return false;
  const po = league.po, round = po.rounds[po.stage];
  let played = 0;
  beforeDay(league);
  for (const sr of round) {
    if (sr.winner != null) continue;
    const n = sr.games.length + 1;
    const home = hiHome(sr, n) ? sr.hi : sr.lo, away = home === sr.hi ? sr.lo : sr.hi;
    const g = playGame(league, home, away, true);
    g.playoff = true; g.stage = poStages(league)[po.stage]; g.gnum = n; g.poDay = po.day;
    g.id = league.games.length + 1;
    applyGame(league, g); league.games.push(g); tlPrune(league); sr.games.push(g.id); played++;
    if (league.career && typeof careerDay === 'function') { try { careerDay(league, [g]); } catch (e) { console.error(e); } }   // My Career: pro XP
    const hiWon = (home === sr.hi) === (g.hs > g.as);
    if (hiWon) sr.hw++; else sr.lw++;
    if (sr.hw >= sr.hiNeed) sr.winner = sr.hi;
    else if (sr.lw >= sr.loNeed) sr.winner = sr.lo;
    if (sr.winner != null) {
      const pin = isPlayin(league, po.stage);
      updateRivalry(league, sr.hi, sr.lo, pin ? 1 : 2.5);
      if (!pin) (league.poLog = league.poLog || []).push({ s: league.season, a: sr.hi, b: sr.lo });   // v24.3: playoff-series history for playoff rivals
      if (typeof hypeBump === 'function') hypeBump(league.teams[sr.winner], pin ? 2 : 4);
      if (typeof rivalSeriesNews === 'function') try { rivalSeriesNews(league, sr.winner, sr.winner === sr.hi ? sr.lo : sr.hi, pin); } catch (e) { }   // v24.4
      if (typeof mediaSeries === 'function') try { mediaSeries(league, sr, pin); } catch (e) { }   // v26.5
      const w = league.teams[sr.winner], l = league.teams[sr.winner === sr.hi ? sr.lo : sr.hi];
      league.log.unshift({ season: league.season, day: league.day, cat: 'league', text: `${poStages(league)[po.stage]}: ${w.city} ${w.name} beat ${l.city} ${l.name}${pin ? '' : `, ${Math.max(sr.hw, sr.lw)}-${Math.min(sr.hw, sr.lw)}`}.` });
    }
  }
  healDay(league, 1);   // v24.6
  po.day++;
  if (round.every(sr => sr.winner != null)) nextRound(league);
  return played > 0;
}


// ===== v29 Draft pipeline: quick stat sim (season lines only, no games) =====
// Role targets per game from archive/notes/PIPELINE-SPEC.md: [pts, reb, ast, min]. 'walkon' (NCHF 10th man and below) is not in the spec: garbage minutes only.
const PIPE_ROLES = {
  NCHF: { poy: [22.5, 8.0, 4.5, 34], all1: [18.5, 6.5, 3.5, 33], second: [14.5, 5.5, 3.0, 31], starter: [10.0, 4.5, 2.0, 27], sixth: [8.5, 3.5, 1.5, 22], bench: [4.5, 2.5, 1.0, 14], walkon: [1.2, 0.7, 0.3, 4] },
  EABL: { mvp: [18.0, 5.5, 5.0, 30], all1: [15.5, 6.0, 3.5, 29], high: [12.0, 4.5, 2.5, 26.5], avg: [9.0, 4.0, 2.0, 22], sixth: [8.0, 3.0, 2.0, 19], deep: [3.5, 1.5, 0.8, 10] },
  APBA: { mvp: [25.0, 10.5, 4.5, 36], imp: [20.0, 7.5, 4.0, 34.5], domstar: [15.0, 4.5, 4.5, 32], domstart: [9.5, 4.0, 2.0, 26], bench: [6.0, 2.5, 1.5, 16], end: [2.5, 1.2, 0.5, 7] }
};
// Spec wording for each role (tests and the Pipeline page)
const PIPE_ROLE_NAME = {
  NCHF: { poy: 'National POY / lottery lock', all1: 'All-Conference 1st team star', second: 'Secondary star / 2nd option', starter: 'Solid starter / role player', sixth: '6th man / energy bench', bench: 'Rotation bench (7th-9th)', walkon: 'Walk-on (10th+)' },
  EABL: { mvp: 'League MVP / Euro superstar', all1: 'All-League 1st team', high: 'High-level starter', avg: 'Average starter / glue guy', sixth: 'Key rotation / 6th man', deep: 'Deep bench / domestic prospect' },
  APBA: { mvp: 'Dominant import / MVP', imp: 'All-League import / elite local', domstar: 'Top domestic star', domstart: 'Solid domestic starter', bench: 'Rotation bench', end: 'End of bench / developmental' }
};
// Hidden variance: SIT_SD = the season's situation (usage on a weak team, system fit, luck), RANK_SD = noise in the coach's pecking order.
// Tuned so production tracks true rating at r ~ 0.6-0.7 (tools/t29.js).
const PIPE_SIM = { SIT_SD: 0.5, SIT_LO: 0.5, SIT_HI: 1.75, RANK_SD: 10, Q_K: 0.03 };
// soft ceilings per game [pts, reb, ast]: above the knee only 30% of the excess counts (no 50-point college seasons)
const PIPE_KNEE = { NCHF: [27, 12, 8], EABL: [21, 10, 8], APBA: [31, 14, 9] };
// raw skill shape: scoring, rebounding, passing, steals, blocks, 3-point share of points. Fillers (x.f) use a position template.
function pipeRaw(x) {
  if (x.f) { const i = clamp(x.p | 0, 0, 4); return { sc: 1, rb: [0.65, 0.8, 1, 1.2, 1.4][i], as: [1.7, 1.3, 0.9, 0.7, 0.5][i], st: [1.2, 1.1, 1, 0.9, 0.8][i], bk: [0.3, 0.4, 0.7, 1.3, 1.9][i], tp: [0.35, 0.4, 0.33, 0.2, 0.06][i] }; }
  const g = (k, d) => x[k] != null ? x[k] : d, cl = v => clamp(v, 0.25, 2.5);
  return { sc: cl(1 + ((g('fin', 50) + g('mid', 50) + g('tp', 50)) / 3 - 50) / 60 + (g('tbd', 50) - 50) / 150),
    rb: cl(1 + ((g('orb', 50) + g('drb', 50)) / 2 - 50) / 45 + (g('hgt', 78) - 78) * 0.04),
    as: cl(1 + (g('pas', 50) - 50) / 40 + (g('tbd', 50) - 50) / 100),
    st: cl(1 + (g('stl', 50) - 50) / 50), bk: cl(0.2 + Math.max(0, (g('blk', 40) - 30) / 40) + (g('hgt', 78) - 78) * 0.08),
    tp: clamp((g('tp', 40) - 35) / 70, 0.01, 0.55) * clamp(g('t3', 50) / 50, 0.3, 1.6) };
}
// rows: [{ x, role, v (true rating), gp }] for one league-season. Returns a line per row (same order).
// Each role is normalized so its average lands on the spec target; the situation factor (mean 1) sits on top.
function pipeLines(lg, rows) {
  const T = PIPE_ROLES[lg], out = new Array(rows.length), by = {};
  rows.forEach((r, i) => { r.raw = pipeRaw(r.x); r.sit = clamp(Math.exp(gauss(0, PIPE_SIM.SIT_SD) - PIPE_SIM.SIT_SD * PIPE_SIM.SIT_SD / 2), PIPE_SIM.SIT_LO, PIPE_SIM.SIT_HI); (by[r.role] = by[r.role] || []).push(i); });
  for (const role in by) {
    const ix = by[role], t = T[role], n = ix.length, mv = ix.reduce((a, i) => a + rows[i].v, 0) / n;
    for (const i of ix) rows[i].q = clamp(1 + PIPE_SIM.Q_K * (rows[i].v - mv), 0.55, 1.6);
    const mean = f => ix.reduce((a, i) => a + f(rows[i]), 0) / n;
    const mq = mean(r => r.q), mp = mean(r => r.q * r.raw.sc), mr = mean(r => Math.pow(r.q, 0.7) * r.raw.rb), ma = mean(r => Math.pow(r.q, 0.7) * r.raw.as), ms = mean(r => r.raw.st), mb = mean(r => r.raw.bk);
    const K = PIPE_KNEE[lg], kn = (v, k) => v > k ? k + (v - k) * 0.2 : v, o1 = v => Math.round(Math.max(0, v) * 10) / 10;
    // after the soft ceiling, rescale the role so its average stays on the spec target
    const fit = (vals, tgt, k) => { let v = vals.slice(); for (let it = 0; it < 4; it++) { const m = v.reduce((a, x) => a + kn(x, k), 0) / n; if (!m) break; v = v.map(x => x * tgt / m); } return v.map(x => kn(x, k)); };
    const P = fit(ix.map(i => t[0] * rows[i].q * rows[i].raw.sc / mp * rows[i].sit), t[0], K[0]);
    const B = fit(ix.map(i => t[1] * Math.pow(rows[i].q, 0.7) * rows[i].raw.rb / mr * Math.pow(rows[i].sit, 0.5)), t[1], K[1]);
    const A = fit(ix.map(i => t[2] * Math.pow(rows[i].q, 0.7) * rows[i].raw.as / ma * Math.pow(rows[i].sit, 0.5)), t[2], K[2]);
    ix.forEach((i, j) => {
      const r = rows[i], min = clamp(t[3] * (r.q / mq) * gauss(1, 0.05), 1, 39.5), mk = min / 30;
      const stl = Math.max(0, 0.9 * r.raw.st / ms * mk * gauss(1, 0.15)), blk = Math.max(0, 0.55 * r.raw.bk / mb * mk * gauss(1, 0.2));
      out[i] = { gp: r.gp, min: o1(min), pts: o1(P[j]), reb: o1(B[j]), ast: o1(A[j]), stl: o1(stl), blk: o1(blk), tpm: o1(P[j] * r.raw.tp / 3) };
    });
  }
  return out;
}
// production score used for awards, stock and the stat-vs-rating check
function pipeVal(l) { return l ? l.pts + 0.7 * l.reb + 0.9 * l.ast + 1.3 * (l.stl + l.blk) : 0; }

// ===== v30b: replay a stored play-by-play (entry[8] lineup changes, entry[9] seconds) up to n entries.
// Returns { court: [home 5, away 5 ids], min: {id: seconds}, pm: {id: plus-minus} }; matches the final box score at n = log.length.
function pbpReplay(g, n) {
  const log = g.pbp || [], m = Math.min(n == null ? log.length : n, log.length);
  let court = g.tl && g.tl[0] && g.tl[1] ? [...g.tl[0].st, ...g.tl[1].st] : [0, 1].flatMap(s => g.box.filter(r => r[1] === s && r[17]).map(r => r[0])), h = 0, a = 0;   // v32c: starting fives from the timeline
  const min = {}, pm = {};
  for (let k = 0; k < m; k++) {
    const e = log[k]; if (e[8]) court = e[8];
    const dh = (e[4] - h) - (e[5] - a); h = e[4]; a = e[5];
    if (e[9]) for (const id of court) min[id] = (min[id] || 0) + e[9];
    if (dh) for (let i = 0; i < court.length; i++) pm[court[i]] = (pm[court[i]] || 0) + (i < 5 ? dh : -dh);
  }
  return { court, min, pm };
}
