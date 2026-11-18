# v29 Draft pipeline: data from the user (Nov 13). Use exactly; do not invent other names.

## Team counts (user's numbers; replaces "8 + 8, 12-16" in the plan)
- **EABL** Euro-Atlantic Basketball League (upper international, EuroLeague/ACB tier, 40-min FIBA games): **12 teams**
- **APBA** Asia-Pacific Basketball Association (lower international, faster pace, B.League/NBL/PBA hybrid, imports + locals): **12 teams**
- **NCHF** National Collegiate Hoops Federation (college D1): **16 teams in 4 conferences of 4**

Format: City — Nickname | CODE | colors. Renames marked * replace names/codes that clash with NBA or PBL teams (user chose "rename only the clashes"; awaiting the user's OK, changes allowed).

### EABL
London — Monarchs | LDN | Royal Purple & Gold
Madrid — Matadors | MAD | Crimson & White
Paris — Lumière | PAR | Navy Blue & Champagne
Berlin — Ironworks | BER | Charcoal & Electric Orange
Milan — Vipers | MLN* (was MIL, NBA code) | Emerald Green & Black
Athens — Titans | ATH | Aegean Blue & Marble White
Istanbul — Bosphorus | IST | Turquoise & Scarlet
Belgrade — Wolves | BLG | Slate Grey & Red
Munich — Brewers | MUN | Cobalt Blue & Silver
Barcelona — Dragons | BCN | Maroon & Amber
Kaunas — Foresters | KAU | Forest Green & White
Tel Aviv — Maccabees | TLV | Royal Blue & Yellow

### APBA
Tokyo — Shoguns | TYO | Vermilion & Obsidian Black
Manila — Islanders | MNI* (was MNL, PBL code) | Sapphire Blue & Sun Yellow
Seoul — Tigers | SEL | Burnt Orange & Black
Sydney — Harbourmen | SYD | Teal & Navy Blue
Taipei — Skyhawks | TPS* (was TPE, PBL code) | Sky Blue & White
Melbourne — Southern Cross | MEL | Midnight Blue & Silver
Beijing — Emperors | PEK | Imperial Red & Gold
Jakarta — Garudas* (was Komodos JKT, same as PBL team) | JKG* | Olive Green & Bronze
Auckland — Kiwis | AKL | Black & Fern Green
Singapore — Merlions | SGP* (was SIN, PBL code) | Coral Red & White
Bangkok — Thunder* (was Elephants BKK, same as PBL team) | BKT* | Saffron & Indigo
Osaka — Samurai | OSA | Crimson & Charcoal

### NCHF
**Eastern Seaboard Conference**
Boston — Harborhawks | BHH* (was BOS) | Navy Blue & Seafoam
Philadelphia — Liberty | PHL* (was PHI) | Colonial Blue & Buff
Charlotte — Stingers* (was Hornets, NBA team) | CLT | Teal & Purple
Atlanta — Peaches | ATP* (was ATL) | Peach & Forest Green
**Great Lakes Conference**
Chicago — Wind | CWD* (was CHI) | Ice Blue & Black
Detroit — Motormen* (was Pistons, NBA team) | DTM* (was DET) | Rust Red & Steel Grey
Columbus — Pilots* (was Aviators, same as PBL Angeles City Aviators) | CMH | Scarlet & Cream
Minneapolis — Loons* (was Lakers, NBA team history) | MSP | Royal Blue & Frost White
**Sunbelt & Heartland Conference**
Dallas — Wranglers | DWR* (was DAL) | Burnt Sienna & Denim Blue
Austin — Armadillos | AUS | Terracotta & Sage Green
Nashville — Troubadours | BNA | Gold & Midnight Black
St. Louis — Archers | STL | Cardinal Red & Silver
**Pacific & Mountain Conference**
Seattle — Cascades | SEA | Evergreen & Slate
Denver — Summit* (was Altitude, same as PBL Baguio Altitude) | DSU* (was DEN) | Mountain Purple & Gold
Phoenix — Scorpions | PSC* (was PHX) | Sunset Orange & Sand
San Diego — Surfers | SAN | Ocean Blue & Yellow

## Awards (user's names)
**NCHF**: champion The Founders Cup; National Player of the Year (The Sterling-Vance Trophy); National Freshman of the Year (The Redshirt-to-Star Award); National Defensive Player of the Year (The Iron Rim Trophy); Sixth Man of the Year (The Sparkplug Award); All-NCHF First Team (5) and Second Team (5); NCHF All-Freshman Team (5); NCHF All-Defensive Team (5). Each conference: Conference Player of the Year, Freshman of the Year, All-Conference First and Second Teams.
**EABL**: champion The EABL Crown (Final Four); EABL Season MVP; EABL Best Defender; EABL Rising Star (under 22); Top Scorer: The Golden Net Trophy (highest ppg); All-EABL First Team (5, positionless); EABL All-Defensive Team (5).
**APBA**: champion The Pacific Rim Shield; APBA Most Valuable Player; Pacific Rim Shield Finals MVP; APBA Defensive Player of the Year; APBA Best Sixth Man; APBA Rookie of the Year (first-year domestic pros); All-APBA First Team; APBA All-Defensive Team (5).
Champions need a short playoff (results only, no games): EABL Final Four (top 4), APBA top 4 → Finals (Finals MVP), NCHF Founders Cup (8 teams). Replaces "standings + champion only".

## Stat targets per game (PTS / REB / AST) by role. Tune the quick stat sim to land near these on average (with the hidden variance on top).
**NCHF** (college, 40 min)
- National POY / lottery lock: 22.5 / 8.0 / 4.5 (~30%+ usage)
- All-Conference 1st team star: 18.5 / 6.5 / 3.5 (26-28% usage)
- Secondary star / 2nd option: 14.5 / 5.5 / 3.0
- Solid starter / role player: 10.0 / 4.5 / 2.0
- 6th man / energy bench: 8.5 / 3.5 / 1.5 (20-24 min)
- Rotation bench (7th-9th): 4.5 / 2.5 / 1.0 (12-16 min)
**EABL** (40-min FIBA; 20+ ppg is rare, efficient)
- League MVP / Euro superstar: 18.0 / 5.5 / 5.0
- All-League 1st team: 15.5 / 6.0 / 3.5
- High-level starter: 12.0 / 4.5 / 2.5 (25-28 min)
- Average starter / glue guy: 9.0 / 4.0 / 2.0 (20-24 min)
- Key rotation / 6th man: 8.0 / 3.0 / 2.0
- Deep bench / domestic prospect: 3.5 / 1.5 / 0.8 (8-12 min)
**APBA** (faster pace; imports dominate)
- Dominant import / MVP: 25.0 / 10.5 / 4.5
- All-League import / elite local: 20.0 / 7.5 / 4.0 (34+ min)
- Top domestic star: 15.0 / 4.5 / 4.5
- Solid domestic starter: 9.5 / 4.0 / 2.0
- Rotation bench: 6.0 / 2.5 / 1.5 (14-18 min)
- End of bench / developmental: 2.5 / 1.2 / 0.5
APBA rosters: imports (former NBA/G-League level, free agents) + locals; EABL: vets 30+, fringe free agents, international prospects.
