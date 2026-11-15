# v29 Haiku task: Draft pipeline text (Haiku)

Edit only `src/league.js`: the block `// v29 text` (`Object.assign(FLAVOR, {...})`) and the `PIPE_ACH` labels, both in the "v29 Draft pipeline lite" block just above `module.exports`. Team names, codes, colors and award names come from `PIPELINE-SPEC.md`: **do not change them** (they are the user's).

1. **Add 3 more variants to every v29 key** (each has 1 wording now). Plain words, under 140 characters, keep every `{var}` of the first wording, straight single quotes, escape apostrophes as `\'`.

| Key | Meaning | Vars |
|---|---|---|
| `pp.sign` | a free agent signs with an international club | name, ovr, club, lg |
| `pp.champ.NCHF` / `.EABL` / `.APBA` | league champion (Founders Cup / EABL Crown / Pacific Rim Shield) | team, cup, ru, sc, mvp (APBA) |
| `pp.award` | top award (National POY / league MVP) | award, name, team |
| `pp.breakout` | breakout prospect season | name, team, lg, pts, reb, ast |
| `pp.stockUp`, `pp.stockDown` | draft stock moves | name, team, pts |
| `pp.declare` | top college prospect declares | name, yr (freshman…senior), team, draft |
| `pp.callup` | NBA/PBL team calls up a club player | team, name, club, lg, cost ("$0.9M" or "no") |
| `fd.pipe.award` | national feed post on the top award | award, name, team, lg |

2. **`PIPE_ACH` labels** (achievement names shown in "Before the pros"): you may reword (short, title case). Keep the keys.

Check: `node --check src/league.js` and `node tools/t29.js quick` (no FAIL). Publish with publish_files (`as: "src/league.js"`).
