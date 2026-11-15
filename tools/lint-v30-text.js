// v30 text lint: node tools/lint-v30-text.js  (SRC=src)
// Checks the v30 wording keys: at least 4 wordings, under 140 characters, no empty or doubled-space text, placeholders allowed.
//   mv.*                         write-up reasons (#5): same {vars} as the first wording
//   iv.q/a.<v30 pool>, iv.*.draft  interviews (#23): same {vars} as the first wording
//   hof.speech.*                 HOF speeches (#21): every {var} must be one the code passes for that key
// Use ALL=1 to check every FLAVOR and story key instead (older keys still have 1 wording by design).
const load = require('./load.js'), SRC = process.env.SRC || 'src', ALL = !!process.env.ALL;
const { run } = load(SRC, 3);
const flavor = JSON.parse(run('JSON.stringify(typeof FLAVOR!=="undefined"?FLAVOR:{})'));
const story = JSON.parse(run('JSON.stringify(typeof NBA_TEXT!=="undefined"&&NBA_TEXT.story?NBA_TEXT.story:{})'));
const V30_POOL = 'bench|future|rotation|pressure|rest|dpick|dtrade|dclass|dneed|dwork';
const inScope = k => ALL || new RegExp(`^(mv\\.|iv\\.(q|a)\\.(${V30_POOL})\\b|iv\\.(intro|news)\\.draft$|hof\\.speech\\.)`).test(k);
// vars the code passes for each HOF speech key (league.js hofSpeech)
const HOF_VARS = { 'hof.speech.open': ['name', 'seasons'], 'hof.speech.team': ['team', 'n'], 'hof.speech.coach': ['c1'], 'hof.speech.coach2': ['c1', 'c2'], 'hof.speech.mates': ['list', 'top', 'rest'], 'hof.speech.fam': ['rel', 'who'], 'hof.speech.titles': ['n', 'rings'], 'hof.speech.mvp': ['n', 'mvps'], 'hof.speech.close': ['name'] };
const sets = [['FLAVOR', flavor], ['story', story]];
const vars = s => [...new Set((s.match(/\{\w+\}/g) || []).map(x => x.slice(1, -1)))].sort();
let keys = 0, problems = [];
for (const [name, obj] of sets) for (const k of Object.keys(obj)) {
  if (!inScope(k)) continue;
  keys++;
  const list = obj[k];
  if (!Array.isArray(list)) { problems.push(`${name} ${k}: not an array`); continue; }
  if (list.length < 4) problems.push(`${name} ${k}: ${list.length} wording(s), need 4`);
  const v0 = vars(list[0] || ''), allowed = HOF_VARS[k];
  list.forEach((s, i) => {
    if (typeof s !== 'string' || !s.trim()) return problems.push(`${name} ${k}[${i}]: empty`);
    if (s.length >= 140) problems.push(`${name} ${k}[${i}]: ${s.length} chars (max 139)`);
    if (/ {2}|^\s|\s$/.test(s)) problems.push(`${name} ${k}[${i}]: spacing`);
    if (allowed) { const bad = vars(s).filter(v => !allowed.includes(v)); if (bad.length) problems.push(`${name} ${k}[${i}]: unknown var {${bad.join(' ')}}`); }
    else if (vars(s).join() !== v0.join()) problems.push(`${name} ${k}[${i}]: vars {${vars(s).join(' ')}} differ from first wording {${v0.join(' ')}}`);
  });
}
console.log(`v30 text lint: ${keys} keys checked${ALL ? ' (all)' : ' (mv, v30 interview pools, hof.speech)'}`);
if (problems.length) { console.log(problems.map(p => 'FAIL ' + p).join('\n')); console.log(`${problems.length} problem(s)`); process.exit(1); }
console.log('PASS all keys: 4+ wordings, vars match, under 140 chars');
