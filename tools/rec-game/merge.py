# Merge real NBA regular-season single-game top lists (Basketball-Reference leaders pages, read Nov 2026)
# into NBA_HX.rec.game.RS in src/nba-history.js. Keeps every existing row (they carry the opponent),
# adds the CSV rows that are new, sorts by value (then newest first) and keeps the top 100 per stat.
# Note: Basketball-Reference box-score lists for REB/AST/STL/BLK/OREB start in 1983-84, so the older
# rows already in the game (Wilt, Russell, Elmore Smith...) stay in and keep their place.
# Also <stat>_pre.csv: Wikipedia single-game lists for games before 1983-84 (rebounds 38+, assists 22+, steals 8+).
# Safe to re-run: rows already in the file are matched by player + date.
# Run from the repo root: python3 tools/rec-game/merge.py
import csv, json, os, re, unicodedata

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, '..', '..', 'src', 'nba-history.js')
STATS = {'pts': 'PTS', 'trb': 'TRB', 'ast': 'AST', 'stl': 'STL', 'blk': 'BLK', 'tpm': '3P', 'fgm': 'FGM', 'ftm': 'FTM', 'orb': 'ORB'}
TEAM = {'ATL': 'Atlanta Hawks', 'BOS': 'Boston Celtics', 'BRK': 'Brooklyn Nets', 'NJN': 'New Jersey Nets', 'CHO': 'Charlotte Hornets',
        'CHH': 'Charlotte Hornets', 'CHA': 'Charlotte Bobcats', 'CHI': 'Chicago Bulls', 'CLE': 'Cleveland Cavaliers', 'DAL': 'Dallas Mavericks',
        'DEN': 'Denver Nuggets', 'DET': 'Detroit Pistons', 'GSW': 'Golden State Warriors', 'HOU': 'Houston Rockets', 'IND': 'Indiana Pacers',
        'LAC': 'Los Angeles Clippers', 'LAL': 'Los Angeles Lakers', 'MEM': 'Memphis Grizzlies', 'MIA': 'Miami Heat', 'MIL': 'Milwaukee Bucks',
        'MIN': 'Minnesota Timberwolves', 'NOP': 'New Orleans Pelicans', 'NOH': 'New Orleans Hornets', 'NOJ': 'New Orleans Jazz',
        'NYK': 'New York Knicks', 'OKC': 'Oklahoma City Thunder', 'ORL': 'Orlando Magic', 'PHI': 'Philadelphia 76ers',
        'PHW': 'Philadelphia Warriors', 'SFW': 'San Francisco Warriors', 'PHO': 'Phoenix Suns', 'POR': 'Portland Trail Blazers',
        'SAC': 'Sacramento Kings', 'SAS': 'San Antonio Spurs', 'TOR': 'Toronto Raptors', 'UTA': 'Utah Jazz', 'WAS': 'Washington Wizards',
        'WSB': 'Washington Bullets', 'SEA': 'Seattle SuperSonics', 'MNL': 'Minneapolis Lakers', 'CIN': 'Cincinnati Royals', 'KCK': 'Kansas City Kings'}
FIX_OPP = {('FTM', 'bam adebayo', '2026-03-10'): 'Washington Wizards'}   # old row said Memphis; the 83-point game was vs Washington

def norm(n):
    n = unicodedata.normalize('NFKD', n); n = ''.join(c for c in n if not unicodedata.combining(c))
    return re.sub(r'\s+', ' ', re.sub(r"[.'’`,-]", '', n.lower())).strip()

lines = open(SRC, encoding='utf-8').read().split('\n')
pre = 'const NBA_HX = '
i = next(k for k, l in enumerate(lines) if l.startswith(pre))
body = lines[i][len(pre):]; assert body.endswith(';')
hx = json.loads(body[:-1])
rs = hx['rec']['game'].setdefault('RS', {})
for f, st in STATS.items():
    old = rs.get(st, [])
    for r in old:
        k = (st, norm(r[0]), r[2])
        if k in FIX_OPP: r[3] = FIX_OPP[k]
    seen = {(norm(r[0]), r[2]) for r in old}
    rows = list(old); added = 0
    # <stat>.csv = Basketball-Reference leaders page (flag b); <stat>_pre.csv = Wikipedia games before 1983-84 with opponents (flag w)
    for fn, fl in ((f + '.csv', 'b'), (f + '_pre.csv', 'w')):
        fp = os.path.join(HERE, fn)
        if not os.path.exists(fp): continue
        for c in csv.DictReader(open(fp, encoding='utf-8')):
            k = (norm(c['player']), c['date'])
            if k in seen: continue
            seen.add(k); added += 1
            rows.append([c['player'], TEAM.get(c['team'], c['team']), c['date'], c.get('opponent') or '', int(c['v']), fl])
    rows.sort(key=lambda r: (-r[4], [-ord(ch) for ch in r[2]]))
    rs[st] = rows[:100]
    print(f'{st}: {len(old)} old + {added} new -> {len(rs[st])} kept, cutoff {rs[st][-1][4]}')
lines[i] = pre + json.dumps(hx, ensure_ascii=False, separators=(',', ':')) + ';'
open(SRC, 'w', encoding='utf-8').write('\n'.join(lines))
