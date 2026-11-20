#!/usr/bin/env python3
"""Rebuild src/nba-2026.js from the NBA data docs.

Usage: python3 build.py <nba_dir> <game_dir> [--check]
  nba_dir  = folder with the docs (claude/nba layout): nba-compact.json, hist.txt, pros.txt, conv.js,
             careers/stars-*.md, careers/legends.md, optional careers/car2.json + careers/carpo.json
  game_dir = game folder holding src/nba-2026.js
  --check  = build to memory and compare with the current src/nba-2026.js (no write)

Single-file page (v33e): python3 build.py --single <game_dir> [out.html]
  Stitches src/index.template.html + styles.css + vendor-faces, engine, league, then (/*NBA*/) nba-2026, nba-text,
  nba-setup, nba-history (same order as index.html), then app.js. Default out: <game_dir>/pbl-single.html.

Output order (same as the live file):
  header comment, NBA26 (one team per line), NBA_HIST, NBA_PROS, NBA_CAR, NBA_CAR2, NBA_CARPO, NBA_LGD, conv.js.
NBA_CAR2 / NBA_CARPO (v28.5 F5 role-player + playoff rows) come from careers/car2.json / carpo.json when present,
else the existing lines in src/nba-2026.js are kept as they are.
"""
import json, os, re, sys, glob

HEADER = ('// NBA 2026-27 data (rosters as of Nov 12 2026; 2025-26 per-game lines; contracts in $M per season). '
          'Source docs: claude/nba/teams/*.md')


def js(v):
    """Compact JSON, the same way the data lines are written in the game file."""
    return json.dumps(v, separators=(',', ':'), ensure_ascii=False)


def json_block(path):
    txt = open(path, encoding='utf-8').read()
    m = re.search(r'```json\s*\n(.*?)\n```', txt, re.S)
    if not m:
        sys.exit('no ```json block in ' + path)
    return json.loads(m.group(1))


def text_lines(path):
    return open(path, encoding='utf-8').read().strip('\n')


def build(nba, game):
    out = [HEADER, 'const NBA26 = {']
    teams = json.load(open(os.path.join(nba, 'nba-compact.json'), encoding='utf-8'))
    ab = list(teams)
    for i, k in enumerate(ab):
        out.append(js(k) + ':' + js(teams[k]) + (',' if i < len(ab) - 1 else ''))
    out.append('};')
    out.append('const NBA_HIST = `' + text_lines(os.path.join(nba, 'hist.txt')) + '`;')
    out.append('const NBA_PROS = `' + text_lines(os.path.join(nba, 'pros.txt')) + '`;')

    car = {}
    for f in sorted(glob.glob(os.path.join(nba, 'careers', 'stars-*.md')), key=lambda p: [int(x) if x.isdigit() else x for x in re.split(r'(\d+)', p)]):
        car.update(json_block(f)['players'])
    out.append('const NBA_CAR = ' + js(car) + ';')

    old = {}
    cur = os.path.join(game, 'src', 'nba-2026.js')
    if os.path.exists(cur):
        for l in open(cur, encoding='utf-8').read().split('\n'):
            for name in ('NBA_CAR2', 'NBA_CARPO'):
                if l.startswith('const %s = ' % name):
                    old[name] = l
    for name, fn in (('NBA_CAR2', 'car2.json'), ('NBA_CARPO', 'carpo.json')):
        p = os.path.join(nba, 'careers', fn)
        if os.path.exists(p):
            out.append('const %s = %s;' % (name, js(json.load(open(p, encoding='utf-8')))))
        elif name in old:
            out.append(old[name])
        else:
            sys.exit('missing %s: no careers/%s and no line in the current nba-2026.js' % (name, fn))

    lgd = json_block(os.path.join(nba, 'careers', 'legends.md'))['players']
    out.append('const NBA_LGD = ' + js(lgd) + ';')
    out.append(open(os.path.join(nba, 'conv.js'), encoding='utf-8').read().rstrip('\n'))
    return '\n'.join(out) + '\n'


SINGLE_JS = {'/*VENDOR*/': ['desk.js', 'vendor-faces.js'], '/*ENGINE*/': ['engine.js'], '/*LEAGUE*/': ['league.js'],
             '/*NBA*/': ['nba-2026.js', 'nba-text.js', 'nba-setup.js', 'nba-history.js'], '/*APP*/': ['app.js', 'fx.js', 'court.js', 'p3.js', 'xp.js', 'career-text.js', 'career.js', 'pb.js', 'fantasy.js', 'coach-mode.js', 'combine.js']}


def single(game, out):
    """One offline HTML file: the template with every src file inlined at its marker."""
    src = os.path.join(game, 'src')
    rd = lambda f: open(os.path.join(src, f), encoding='utf-8').read()
    page = rd('index.template.html')
    for mk in ['/*CSS*/'] + list(SINGLE_JS):
        if page.count(mk) != 1:
            sys.exit('marker %s must appear once in index.template.html (found %d)' % (mk, page.count(mk)))
    body = lambda fs: '\n'.join(rd(f).rstrip('\n') for f in fs).replace('</script', '<\\/script')
    page = page.replace('/*CSS*/', rd('styles.css').replace('</style', '<\\/style'))   # str.replace: no escape handling in the data
    for mk, fs in SINGLE_JS.items():
        page = page.replace(mk, body(fs))
    open(out, 'w', encoding='utf-8', newline='').write(page)
    print('built', out, len(page.encode()), 'bytes')


def main():
    if '--single' in sys.argv:
        a = [x for x in sys.argv[1:] if not x.startswith('--')]
        if not a:
            sys.exit(__doc__)
        single(a[0], a[1] if len(a) > 1 else os.path.join(a[0], 'pbl-single.html'))
        return
    a = [x for x in sys.argv[1:] if not x.startswith('--')]
    if len(a) != 2:
        sys.exit(__doc__)
    nba, game = a
    page = build(nba, game)
    cur = os.path.join(game, 'src', 'nba-2026.js')
    if '--check' in sys.argv:
        old = open(cur, encoding='utf-8').read()
        if old == page:
            print('identical:', cur, len(page), 'bytes')
            return
        ol, nl = old.split('\n'), page.split('\n')
        for i in range(max(len(ol), len(nl))):
            x = ol[i] if i < len(ol) else '<none>'
            y = nl[i] if i < len(nl) else '<none>'
            if x != y:
                j = next((k for k in range(min(len(x), len(y))) if x[k] != y[k]), min(len(x), len(y)))
                print('line %d differs at col %d\n  live : %s\n  built: %s' % (i + 1, j, x[max(0, j - 60):j + 80], y[max(0, j - 60):j + 80]))
                break
        sys.exit('DIFFERENT (live %d lines, built %d lines)' % (len(ol), len(nl)))
    open(cur, 'w', encoding='utf-8', newline='').write(page)
    print('built', cur, len(page), 'bytes')


if __name__ == '__main__':
    main()
