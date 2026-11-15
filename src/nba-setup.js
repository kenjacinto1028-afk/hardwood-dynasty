// v30a NBA-mode setup extras (runs once from newLeague, right after nbaPopulate; kept out of nba-2026.js so build.py rebuilds don't drop it).
// #25 real first-year players are rookies in season 1 (ROTY / All-Rookie in year 1). #10 real jersey numbers (project doc claude/nba/jersey-numbers.csv.txt).
// Jersey CSV: Team,Player,Jersey. Match by team + name (accents / punctuation / case ignored). Blank number = random free number.
// Two players on one team with the same number: the first row keeps it, the next gets a random free number. "00" is kept as the string '00'.
const NBA_JERSEY_CSV = `Team,Player,Jersey
ATL,Jalen Johnson,1
ATL,Dyson Daniels,5
ATL,Nickeil Alexander-Walker,7
ATL,Onyeka Okongwu,17
ATL,CJ McCollum,3
ATL,Luguentz Dort,0
ATL,Aaron Wiggins,2
ATL,Corey Kispert,24
ATL,Jock Landale,31
ATL,Mouhamed Gueye,
ATL,Asa Newell,14
ATL,Kingston Flemings,4
ATL,Zuby Ejiofor,20
ATL,Henri Veesaar,
ATL,Dorian Finney-Smith,8
ATL,RayJ Dennis,10
ATL,Keshon Gilbert,
ATL,Jalen Wilson,
BKN,Julius Randle,30
BKN,Michael Porter Jr.,17
BKN,Terance Mann,14
BKN,Day'Ron Sharpe,20
BKN,Moritz Wagner,13
BKN,Keon Ellis,1
BKN,Mikel Brown Jr.,0
BKN,Egor Demin,8
BKN,Noah Clowney,21
BKN,Josh Minott,00
BKN,Nolan Traore,10
BKN,Drake Powell,4
BKN,Ben Saraf,77
BKN,Joshua Jefferson,9
BKN,Danny Wolf,2
BKN,Chaney Johnson,31
BKN,Tyler Bilodeau,
BKN,Grant Nelson,
BOS,Jayson Tatum,0
BOS,Paul George,13
BOS,Derrick White,9
BOS,Payton Pritchard,11
BOS,Mitchell Robinson,4
BOS,Sam Hauser,30
BOS,Neemias Queta,88
BOS,Baylor Scheierman,55
BOS,Jordan Walsh,27
BOS,Luka Garza,52
BOS,Mike Conley,45
BOS,Ron Harper Jr.,8
BOS,Hugo Gonzalez,28
BOS,Chris Cenac Jr.,12
BOS,Dillon Mitchell,20
BOS,Amari Williams,
CHA,Coby White,3
CHA,Naz Reid,0
CHA,Grayson Allen,8
CHA,Brandon Miller,24
CHA,Grant Williams,2
CHA,Royce O'Neale,00
CHA,Kon Knueppel,7
CHA,Tidjane Salaun,31
CHA,Hannes Steinbach,22
CHA,Christian Anderson Jr.,5
CHA,Pat Connaughton,
CHA,Liam McNeeley,33
CHA,Moussa Diabate,14
CHA,Mouhamadou Gueye,
CHA,Ryan Kalkbrenner,11
CHA,Sion James,4
CHA,P.J. Hall,16
CHI,Josh Giddey,3
CHI,Nic Claxton,9
CHI,Norman Powell,24
CHI,Patrick Williams,44
CHI,Isaac Okoro,35
CHI,Caleb Wilson,8
CHI,Jalen Smith,25
CHI,Zach Collins,12
CHI,Tre Jones,30
CHI,Rob Dillingham,
CHI,Matas Buzelis,14
CHI,Noa Essengue,2
CHI,Dailyn Swain,5
CHI,Leonard Miller,11
CHI,Tobe Awaka,19
CLE,Donovan Mitchell,45
CLE,James Harden,1
CLE,Evan Mobley,4
CLE,Jarrett Allen,31
CLE,Peyton Watson,8
CLE,Mario Hezonja,33
CLE,Sam Merrill,5
CLE,Jaylon Tyson,20
CLE,Thomas Bryant,3
CLE,Nae'Qwan Tomlin,
CLE,Craig Porter Jr.,9
CLE,Tyrese Proctor,24
CLE,Meleek Thomas,15
CLE,Ernest Udeh Jr.,
CLE,Khalifa Diop,
DAL,Kyrie Irving,11
DAL,Cooper Flagg,32
DAL,P.J. Washington,25
DAL,Daniel Gafford,21
DAL,Santi Aldama,34
DAL,Zaccharie Risacher,10
DAL,Caleb Martin,16
DAL,Naji Marshall,3
DAL,Max Christie,0
DAL,Dereck Lively II,
DAL,Morez Johnson Jr.,14
DAL,Marcus Sasser,8
DAL,Sergio De Larrea,55
DAL,Tarik Biberovic,
DAL,Moussa Cisse,30
DAL,Jett Howard,9
DAL,Tobi Lawal,33
DEN,Nikola Jokic,15
DEN,Jamal Murray,27
DEN,Aaron Gordon,32
DEN,Cameron Johnson,23
DEN,Christian Braun,0
DEN,DeMar DeRozan,10
DEN,Tyus Jones,5
DEN,Spencer Jones,21
DEN,Marvin Bagley III,3
DEN,Alpha Diallo,11
DEN,Julian Strawther,
DEN,DaRon Holmes II,14
DEN,Zeke Nnaji,22
DEN,Trevon Brazile,7
DEN,Cam Whitmore,00
DEN,Ryan Nembhard,9
DET,Cade Cunningham,2
DET,Jalen Duren,0
DET,Ausar Thompson,9
DET,Duncan Robinson,55
DET,John Collins,20
DET,Isaiah Joe,17
DET,Kevin Huerter,27
DET,Ron Holland II,5
DET,Paul Reed,7
DET,Ebuka Okorie,23
DET,Daniss Jenkins,24
DET,Javonte Green,31
DET,Gary Harris,
DET,Taurean Prince,12
DET,Tolu Smith III,35
DET,Chaz Lanier,8
DET,Elijah Harkless,94
DET,Isaac Jones,13
DET,Ugonna Onyenso,
GSW,Stephen Curry,30
GSW,Jimmy Butler,
GSW,Draymond Green,23
GSW,Kristaps Porzingis,
GSW,Moses Moody,
GSW,Brandin Podziemski,2
GSW,Yaxel Lendeborg,1
GSW,Al Horford,20
GSW,De'Anthony Melton,8
GSW,Gui Santos,15
GSW,Will Richard,3
GSW,Brandon Williams,12
GSW,Georges Niang,32
GSW,Gary Payton II,0
GSW,Charles Bassey,28
HOU,Kevin Durant,7
HOU,Alperen Sengun,28
HOU,Fred VanVleet,5
HOU,Jabari Smith Jr.,10
HOU,Amen Thompson,1
HOU,Tari Eason,17
HOU,Reed Sheppard,15
HOU,Steven Adams,12
HOU,Clint Capela,30
HOU,Marcus Smart,36
HOU,Bogdan Bogdanovic,31
HOU,Bruce Thornton,2
HOU,Jae'Sean Tate,8
HOU,Isaiah Crawford,27
HOU,Julian Phillips,
HOU,Oscar Tshiebwe,9
HOU,Quadir Copeland,
HOU,Sean Pedulla,
IND,Tyrese Haliburton,0
IND,Pascal Siakam,43
IND,Ivica Zubac,40
IND,Andrew Nembhard,2
IND,Obi Toppin,1
IND,Aaron Nesmith,23
IND,T.J. McConnell,9
IND,Jarace Walker,5
IND,Kelly Oubre Jr.,10
IND,Ben Sheppard,26
IND,Jay Huff,32
IND,Quenton Jackson,29
IND,Larry Nance Jr.,22
IND,Johnny Furphy,
IND,Braden Smith,3
IND,Kobe Brown,24
IND,Taelon Peter,
LAC,Darius Garland,10
LAC,Brandon Ingram,
LAC,Rui Hachimura,28
LAC,Keaton Wagler,1
LAC,Derrick Jones Jr.,5
LAC,Brook Lopez,11
LAC,Gradey Dick,9
LAC,Isaiah Jackson,23
LAC,Kris Dunn,8
LAC,Bradley Beal,
LAC,Max Strus,31
LAC,Jordan Miller,
LAC,Kobe Sanders,4
LAC,Yanic Konan Niederhauser,
LAC,Cam Christie,24
LAC,Johni Broome,
LAC,Nick Martinelli,12
LAC,Baba Miller,18
LAL,Luka Doncic,77
LAL,Austin Reaves,15
LAL,Walker Kessler,14
LAL,Quentin Grimes,5
LAL,Sandro Mamukelashvili,54
LAL,Jarred Vanderbilt,2
LAL,Collin Sexton,10
LAL,Jaden Hardy,7
LAL,Jake LaRavia,12
LAL,Dalton Knecht,1
LAL,Cameron Carr,43
LAL,Kevon Looney,55
LAL,Matisse Thybulle,4
LAL,Ziaire Williams,11
LAL,Bronny James,9
LAL,Adou Thiero,1
LAL,Chris Manon,30
MEM,Jerami Grant,3
MEM,Zach Edey,14
MEM,Ty Jerome,2
MEM,Cedric Coward,23
MEM,Cameron Boozer,27
MEM,Isaiah Stewart,28
MEM,Jaylen Wells,0
MEM,Cam Spencer,24
MEM,Quinten Post,41
MEM,Taylor Hendricks,22
MEM,D'Angelo Russell,
MEM,Kris Murray,17
MEM,Walter Clayton Jr.,1
MEM,Karim Lopez,35
MEM,Jordan Hawkins,15
MEM,Micah Peavy,16
MEM,Olivier-Maxence Prosper,18
MEM,Scotty Pippen Jr.,1
MEM,GG Jackson II,45
MEM,Javon Small,10
MIA,Giannis Antetokounmpo,7
MIA,Bam Adebayo,13
MIA,Andrew Wiggins,22
MIA,Nikola Jovic,5
MIA,Bobby Portis Jr.,95
MIA,Davion Mitchell,2
MIA,Tim Hardaway Jr.,10
MIA,Klay Thompson,11
MIA,Pelle Larsson,9
MIA,Dru Smith,12
MIA,Myron Gardner,15
MIA,Simone Fontecchio,0
MIA,Nick Richards,8
MIA,Ryan Conwell,4
MIA,Trevor Keels,
MIA,Tre Donaldson,
MIA,Vladislav Goldin,
MIA,J'Vonne Hadley,
MIL,Tyler Herro,11
MIL,Myles Turner,3
MIL,Kyle Kuzma,18
MIL,Gary Trent Jr.,5
MIL,Caris LeVert,
MIL,AJ Green,20
MIL,Brayden Burries,0
MIL,Jaime Jaquez Jr.,24
MIL,Ousmane Dieng,21
MIL,Nate Ament,15
MIL,Kevin Porter Jr.,
MIL,Kel'el Ware,9
MIL,Ryan Rollins,13
MIL,Kasparas Jakucionis,25
MIL,Jericho Sims,00
MIL,Pete Nance,35
MIL,Bogoljub Markovic,23
MIL,Kam Jones,
MIN,Anthony Edwards,5
MIN,LaMelo Ball,1
MIN,Rudy Gobert,27
MIN,Jaden McDaniels,3
MIN,Ayo Dosunmu,13
MIN,Jonathan Kuminga,24
MIN,Donte DiVincenzo,
MIN,Joan Beringer,19
MIN,Trey Lyles,41
MIN,Jaylen Clark,7
MIN,Bones Hyland,8
MIN,Terrence Shannon Jr.,4
MIN,Isaiah Evans,33
MIN,Enrique Freeman,
MIN,Rocco Zikarsky,44
MIN,Zyon Pullin,15
NOP,Zion Williamson,1
NOP,Jordan Poole,3
NOP,Dejounte Murray,5
NOP,Trey Murphy III,25
NOP,Herbert Jones,2
NOP,Bennedict Mathurin,24
NOP,Jeremiah Fears,0
NOP,Saddiq Bey,41
NOP,Derik Queen,22
NOP,DeAndre Jordan,6
NOP,Yves Missi,21
NOP,AJ Johnson,14
NOP,Bryce McGowens,11
NOP,Karlo Matkovic,17
NOP,Trendon Watford,9
NOP,Hunter Dickinson,
NOP,Jaron Pierre Jr.,10
NYK,Karl-Anthony Towns,32
NYK,OG Anunoby,8
NYK,Jalen Brunson,11
NYK,Mikal Bridges,25
NYK,Josh Hart,3
NYK,Landry Shamet,44
NYK,Jose Alvarado,5
NYK,Miles McBride,2
NYK,Pacome Dadiet,4
NYK,Mohamed Diawara,51
NYK,Andre Drummond,0
NYK,Jordan Clarkson,00
NYK,Tyler Kolek,13
OKC,Shai Gilgeous-Alexander,2
OKC,Chet Holmgren,7
OKC,Jalen Williams,8
OKC,Isaiah Hartenstein,55
OKC,Alex Caruso,9
OKC,Jaylin Williams,6
OKC,Cason Wallace,22
OKC,Aday Mara,15
OKC,Nikola Topic,44
OKC,Kenrich Williams,34
OKC,Thomas Sorber,
OKC,Bennett Stirtz,14
OKC,Jared McCain,3
OKC,Ajay Mitchell,25
OKC,Brooks Barnhizer,23
ORL,Franz Wagner,22
ORL,Paolo Banchero,5
ORL,Desmond Bane,3
ORL,Jalen Suggs,4
ORL,Wendell Carter Jr.,34
ORL,Anthony Black,0
ORL,Goga Bitadze,35
ORL,Tristan da Silva,23
ORL,Jase Richardson,11
ORL,Jamal Cain,8
ORL,Jevon Carter,2
ORL,Jonathan Isaac,
ORL,Nikola Vucevic,9
ORL,Noah Penda,
ORL,Colin Castleton,14
ORL,Izaiyah Nelson,
PHI,Joel Embiid,21
PHI,Tyrese Maxey,0
PHI,Jaylen Brown,7
PHI,LeBron James,23
PHI,VJ Edgecombe,77
PHI,Anfernee Simons,5
PHI,Dean Wade,45
PHI,Kentavious Caldwell-Pope,1
PHI,Dominick Barlow,
PHI,Adem Bona,30
PHI,Ariel Hukporti,
PHI,Labaron Philon Jr.,00
PHI,Justin Edwards,11
PHI,Jabari Walker,33
PHI,Caleb Love,8
PHI,Rayan Rupert,12
PHX,Devin Booker,15
PHX,Jalen Green,4
PHX,Miles Bridges,22
PHX,Dillon Brooks,3
PHX,Mark Williams,
PHX,Collin Gillespie,12
PHX,Luke Kennard,8
PHX,Khaman Maluach,10
PHX,Jordan Goodwin,23
PHX,Koa Peat,18
PHX,Ryan Dunn,0
PHX,Drew Timme,
PHX,Jamaree Bouyea,17
PHX,Oso Ighodaro,11
PHX,Rasheer Fleming,20
PHX,Pat Spencer,61
PHX,Duop Reath,26
POR,Ja Morant,1
POR,Jrue Holiday,5
POR,Deni Avdija,8
POR,Shaedon Sharpe,
POR,Toumani Camara,33
POR,Robert Williams III,35
POR,Scoot Henderson,00
POR,Damian Lillard,0
POR,Donovan Clingan,23
POR,Yang Hansen,16
POR,Micah Potter,9
POR,Vit Krejci,27
POR,Sidy Cissoko,91
POR,Branden Carlson,10
POR,John Tonje,2
SAC,Zach LaVine,8
SAC,Domantas Sabonis,11
SAC,De'Andre Hunter,15
SAC,Keegan Murray,13
SAC,Malik Monk,0
SAC,Darius Acuff Jr.,5
SAC,Precious Achiuwa,9
SAC,Nique Clifford,
SAC,Alex Karaban,33
SAC,Emanuel Sharp,34
SAC,Maxime Raynaud,
SAC,Daeqwon Plowden,29
SAC,Dylan Cardwell,32
SAC,Ben Simmons,
SAC,Adam Flagler,
SAS,De'Aaron Fox,4
SAS,Victor Wembanyama,1
SAS,Devin Vassell,24
SAS,Stephon Castle,5
SAS,Keldon Johnson,3
SAS,Julian Champagnie,30
SAS,Tobias Harris,
SAS,Dylan Harper,2
SAS,Luke Kornet,7
SAS,Harrison Barnes,40
SAS,Carter Bryant,11
SAS,Jayden Quaintance,
SAS,Tarris Reed Jr.,10
SAS,Jordan McLaughlin,0
SAS,Maliq Brown,15
SAS,Ja'Kobi Gillespie,17
SAS,David Jones Garcia,25
TOR,Kawhi Leonard,2
TOR,Scottie Barnes,4
TOR,Immanuel Quickley,5
TOR,RJ Barrett,9
TOR,Jakob Poeltl,19
TOR,Collin Murray-Boyles,30
TOR,Ja'Kobe Walter,14
TOR,Kyle Anderson,13
TOR,Trayce Jackson-Davis,32
TOR,Jamal Shead,1
TOR,Jamison Battle,77
TOR,Alijah Martin,55
TOR,Allen Graves,22
TOR,Jaden Bradley,8
TOR,Nate Bittle,
TOR,Malachi Smith,18
UTA,Lauri Markkanen,23
UTA,Jaren Jackson Jr.,20
UTA,Keyonte George,3
UTA,Darryn Peterson,22
UTA,Ace Bailey,19
UTA,Josh Green,5
UTA,Jusuf Nurkic,
UTA,Jaxson Hayes,11
UTA,Josh Okogie,21
UTA,Brice Sensabaugh,28
UTA,Svi Mykhailiuk,10
UTA,Kyle Filipowski,2
UTA,Isaiah Collier,8
UTA,Mo Bamba,44
UTA,Blake Hinson,
UTA,Trey Alexander,
UTA,Tamar Bates,
WAS,Anthony Davis,23
WAS,Trae Young,3
WAS,AJ Dybantsa,4
WAS,Alex Sarr,20
WAS,Deandre Ayton,8
WAS,Khris Middleton,22
WAS,Bilal Coulibaly,0
WAS,Tre Johnson,12
WAS,Tre Mann,1
WAS,Bub Carrington,7
WAS,Will Riley,27
WAS,Kyshawn George,18
WAS,Tristan Vukcevic,
WAS,Justin Champagnie,9
WAS,Anthony Gill,16
WAS,Jamir Watkins,
WAS,Felix Okpara,34
WAS,Reece Beekman,26`;
const nbaNameKey = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
function nbaJerseyRows() {
  return NBA_JERSEY_CSV.trim().split('\n').slice(1).map(l => { const [team, name, num] = l.split(',').map(x => (x || '').trim()); return { team, name, num: num === '' ? null : num === '00' ? '00' : +num }; }).filter(r => r.team && r.name);
}
// stats in NBA_JERSEY_LAST = { rows, matched, set, blank, dupe, missing, dupes } (module variable, not saved; for tests)
let NBA_JERSEY_LAST = null;
function nbaJerseys(L) {
  const rows = nbaJerseyRows(), st = { rows: rows.length, matched: 0, set: 0, blank: 0, dupe: 0, fa: 0, missing: [], dupes: [] };
  const byTeam = {}, faKey = new Map((L.fa || []).map(id => L.players[id]).filter(p => p && p.real).map(p => [nbaNameKey(p.name), p]));
  for (const t of L.teams) {
    const ab = t.nbaAb || t.abbr, ps = [...t.roster, ...(t.twoWay || [])].map(id => L.players[id]).filter(Boolean), m = new Map();
    for (const p of ps) m.set(nbaNameKey(p.name), p);
    byTeam[ab] = { t, m, taken: new Set(), list: ps };
    for (const p of ps) p.num = null;   // real teams: only the list sets numbers; the rest get random free numbers below
  }
  for (const r of rows) {
    const T = byTeam[r.team], p = T && T.m.get(nbaNameKey(r.name));
    if (!p) {   // cut to free agency at league start (roster / two-way limits): he keeps his number if it is free where he signs (assignNumber)
      const f = r.num != null && faKey.get(nbaNameKey(r.name)); if (f) { f.num = r.num; st.fa++; }
      st.missing.push(r.team + ' ' + r.name); continue;
    }
    st.matched++;
    if (r.num == null) { st.blank++; continue; }
    if (T.taken.has(String(r.num))) { st.dupe++; st.dupes.push(r.team + ' #' + r.num + ' ' + r.name); continue; }   // first row keeps it
    p.num = r.num; T.taken.add(String(r.num)); st.set++;
  }
  // everyone left (blank, duplicate, not on the list) gets a random number free on his team (roster + two-way)
  for (const ab in byTeam) {
    const T = byTeam[ab];
    for (const p of T.list) if (p.num == null) {
      const used = new Set([...T.list.filter(x => x.num != null).map(x => String(x.num)), ...(T.t.retired || []).map(r => String(r.num))]);
      const pool = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 30, 31, 32, 33, 34, 35, 40, 41, 42, 43, 44, 45, 50, 51, 52, 55, 77, 88, 99].filter(n => !used.has(String(n)));
      p.num = pool.length ? pick(pool) : rint(60, 98);
    }
  }
  NBA_JERSEY_LAST = st;
  return st;
}
// #25: players in their first NBA season (no years of service) are rookies in season 1, so ROTY and All-Rookie are awarded after year 1
function nbaRookies(L) {
  let n = 0;
  for (const id in L.players) { const p = L.players[id]; if (p.real && !p.prospect && !(p.svc > 0) && p.rookieSeason == null) { p.rookieSeason = L.season; n++; } }
  return n;
}
function nbaSetupV30a(L) {
  let v32 = null; try { v32 = nbaSetupV32(L); } catch (e) { v32 = { error: String(e && e.message || e) }; }   // v32a: ratings, roster fixes (before rookies + jerseys so they see the final rosters)
  const rk = nbaRookies(L), js = nbaJerseys(L);
  return { rookies: rk, jersey: js, v32 };
}
// ===== v32a (S1): rating changes, roster setup, rivalry. Lives here (not in nba-2026.js / conv.js) so a build.sh rebuild keeps it. =====
// Attribute groups: scoring = fin, mid, tp, pst; rebounding = orb, drb; passing = pas. Unnumbered = 3 points. Each entry is added to the attribute, then the overall is recomputed.
const SC3 = { fin: -3, mid: -3, tp: -3, pst: -3 }, RB = n => ({ orb: n, drb: n }), PS3 = { pas: -3 }, BLK3 = { blk: 3 };
const NBA_ADJ = {
  'Kawhi Leonard': Object.assign({}, SC3, RB(-3), PS3),
  'Jaylen Brown': SC3, 'Kyrie Irving': SC3, 'Kon Knueppel': SC3,
  'Jamal Murray': Object.assign({}, SC3, PS3),
  "Kel'el Ware": RB(-7), 'Chet Holmgren': RB(-7), 'Evan Mobley': RB(-7),
  'Paolo Banchero': RB(-3), 'Jalen Johnson': RB(-3), 'Deni Avdija': RB(-3), 'Pascal Siakam': RB(-3), 'Michael Porter Jr.': RB(-3),
  'Anthony Edwards': Object.assign({}, RB(-3), PS3),
  'Stephon Castle': PS3, 'Shai Gilgeous-Alexander': PS3, 'Derrick White': PS3,
  'Anthony Davis': BLK3, 'Nic Claxton': BLK3, 'Rudy Gobert': BLK3,
  'Ivica Zubac': { fin: 2, orb: 3, drb: 3, pdf: 3 },                                              // a bit better: finishing, rebounding, defense (not overboard)
  'Walker Kessler': { blk: 3, pdf: 3, fin: -3, mid: -3, tp: -3, pst: -3, drw: -3, pas: -3, hnd: -3 }  // better defensive big (rim + defense up), offense attributes down
};
const NBA_OVR_ADJ = { 'Joel Embiid': -5 };                                                         // exactly -5 overall
const NBA_PRONE = { 'Kawhi Leonard': 1, 'Joel Embiid': 1 };                                       // injury prone: at least "Fragile" (ipt 2, dur 40-ish); ipt 3 = very fragile
const NBA_PERM_GRUDGE = { 'Luka Doncic': 'DAL' };                                                  // permanent revenge + rivalry vs this team while he plays, whatever team he is on
function nbaApplyRatings(L) {
  const rep = [];
  for (const p of Object.values(L.players)) {
    if (!p.real) continue; const a = NBA_ADJ[p.name], o = NBA_OVR_ADJ[p.name], pr = NBA_PRONE[p.name]; if (!a && o == null && !pr) continue;
    const before = p.ovr;
    if (a) for (const k in a) p[k] = r99(p[k] + a[k]);
    p.ovr = ovr(p);
    if (o != null) { const want = before + o, K = [...OFF, ...DEF, 'iq'].filter(k => k !== 'ft' && k !== 'fdc'); for (let i = 0; i < 400 && ovr(p) !== want; i++) { const k = K[i % K.length]; p[k] = r99(p[k] + (ovr(p) > want ? -1 : 1)); } p.ovr = ovr(p); }
    if (pr && (p.ipt == null || p.ipt < 2)) { p.ipt = 2; p.dur = r99(IPT_DUR[2] + gauss(0, 2)); }
    else if (pr) p.dur = Math.min(p.dur, IPT_DUR[2]);
    if (p.ovr !== before) { p.pot = Math.round(Math.max(p.ovr, p.pot + (p.ovr - before))); p.scout = p.pot; }   // potential moves with the overall (never below it)
    try { setCeil(p); p.arch = archetypes(p); } catch (e) { }
    rep.push({ name: p.name, before, after: p.ovr, ipt: p.ipt });
  }
  return rep;
}
// real minutes role (p.rmb): only for players still on the team whose minutes he played, with a full-season sample, and small (a tie-break, not a demotion).
// The old rule compared his minutes last season with his rank on his NEW team and capped at +-10 (LaMelo Ball -3.6 on MIN vs a 24-game Dosunmu +9.8 started over him).
const RMB_CAP = 4, RMB_MIN_GP = 40;
function nbaFixRmb(L) {
  const EXP = [33, 32, 30, 28, 26, 22, 18, 14, 10, 7, 4, 3, 2, 2, 2]; let kept = 0, dropped = 0;
  for (const p of Object.values(L.players)) if (p.real && p.rmb != null) delete p.rmb;
  for (const t of L.teams) rosterOf(L, t).slice().sort((a, b) => b.ovr - a.ovr).forEach((p, i) => {
    const x = nbaRowOf(p.name), s = x && x[1][11];
    if (!s || s[2] == null || (s[0] || 0) < RMB_MIN_GP || (typeof NBA_PREV !== 'undefined' && NBA_PREV[p.name] && NBA_PREV[p.name] !== t.abbr)) { dropped++; return; }
    const d = Math.max(-RMB_CAP, Math.min(RMB_CAP, (s[2] - EXP[i]) * 0.9)); if (Math.abs(d) >= 1) { p.rmb = Math.round(d * 10) / 10; kept++; }
  });
  return { kept, dropped };
}
function nbaSetupV32(L) {
  const out = { ratings: nbaApplyRatings(L) }, byName = n => Object.values(L.players).find(p => p.real && p.name === n), tAb = ab => L.teams.find(t => t.abbr === ab);
  // Porzingis: retired at league start (his real career rows stay: they are looked up by name), GSW sign the best free big at the minimum
  { const p = byName('Kristaps Porzingis'), gs = tAb('GSW');
    if (p && gs && !p.retired) {
      retirePlayer(L, p, 'retired before the season'); out.porz = true;
      const fa = L.fa.map(id => L.players[id]).filter(q => q && !q.retired && q.pos >= 3 && !(q.injury > 0)).sort((a, b) => (b.real ? 1 : 0) - (a.real ? 1 : 0) || b.ovr - a.ovr)[0];   // a real free-agent big first (Kevin Love)
      if (fa && gs.roster.length < 15) { addToTeam(L, fa, gs.id); fa.contract = { amt: MINSAL, exp: L.season, hg: false, type: 'initial', len: 1, opt: null }; fa.contracts = fa.contracts || []; fa.contracts.push({ s: L.season, tid: gs.id, amt: MINSAL, yrs: 1, type: 'initial', hg: false }); fa.tx.push({ s: L.season, t: `On the ${gs.abbr} opening-night roster (2026-27)` }); out.porzFill = fa.name; }
    } }
  // Lakers: Dalton Knecht starts as a free agent, Adou Thiero (cut by the roster limit) makes the team
  { const lal = tAb('LAL'), kn = byName('Dalton Knecht'), th = byName('Adou Thiero');
    if (lal && kn && th) {
      if (kn.team === lal.id) { removeFromTeam(L, kn); kn.contract = null; kn.contracts = []; kn.lastTeam = lal.id; if (!L.fa.includes(kn.id)) L.fa.push(kn.id); try { setAsk(L, kn); } catch (e) { } out.lal = 'knecht-fa'; }
      if (th.team !== lal.id && !th.tw && lal.roster.length < 15) {
        addToTeam(L, th, lal.id); const x = nbaRowOf('Adou Thiero'), amt = x ? x[1][9] : [2.151, 2.526];
        th.contract = { amt: amt[0], exp: L.season + amt.length - 1, hg: false, type: 'rookie', len: amt.length, opt: x && x[1][10] ? String(x[1][10]).slice(0, 2) : null, sched: amt.length > 1 ? amt.slice() : undefined, s0: L.season };
        th.contracts = th.contracts || []; th.contracts.push({ s: L.season, tid: lal.id, amt: amt[0], yrs: amt.length, type: 'rookie', hg: false }); th.tx.push({ s: L.season, t: `On the ${lal.abbr} opening-night roster (2026-27)` });
      }
      th.rookieSeason = L.season;
    } }
  // Luka Doncic vs Dallas: permanent grudge (revenge boost + rivalry tag) while he plays
  for (const n in NBA_PERM_GRUDGE) { const p = byName(n), t = tAb(NBA_PERM_GRUDGE[n]); if (p && t) { p.grudge = (p.grudge || []).filter(g => g.tid !== t.id); p.grudge.push({ tid: t.id, until: 9999, perm: 1, why: 'Dallas traded him away', s: L.season }); out.grudge = (out.grudge || 0) + 1; } }
  out.rmb = nbaFixRmb(L);
  return out;
}
