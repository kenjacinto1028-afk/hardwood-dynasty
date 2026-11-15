# v30 Haiku task: wording variants (Nov 15 2026) — done for 5t, 21t, 23t

Rule: 4 wordings per key, under 140 characters, same `{vars}` as the first wording (HOF speeches: vars must be ones `hofSpeech` passes). Check with `node tools/lint-v30-text.js` (scope: `mv.*`, v30 interview pools, `hof.speech.*`) and `node tools/t30c.js` (must stay 30/30).

- [x] 5t Move write-up reasons: `mv.n.*`, `mv.t.*`, `mv.r.*` in `src/league.js` FLAVOR (+3 each)
- [x] 21t HOF speeches: `hof.speech.*` in `src/nba-text.js` story (+4 each: family, coaches, teammates, city, humor)
- [x] 23t Interviews: `iv.q.*` pools and `iv.a.*` answers in `src/league.js` (+2 / +3 each), `iv.intro.draft` and `iv.news.draft` (draft questions stay about the draft)
- [ ] 8t Scouting report lines: NOT keyed. Lines are inline in `src/app.js` (`scoutDlg`). Needs a small refactor into keys first, then variants. Needs Kenneth's OK.
- [ ] 7t Ticker stats and rumors: NOT keyed. Inline in `src/league.js` / `src/app.js` (`tickerItems`). Same refactor as 8t.

Code change in this run: `ivAnswers` seeded every answer with `1`, so with 4 wordings it would always show the 2nd. Now seeded by question + slot.

---

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
