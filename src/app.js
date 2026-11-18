(function () {
let L = null;
const confName = (c, LL) => window.confName(c, LL || L);   // league.js can't see this closure's L
const ui = { view: 'standings', team: null, player: null, game: null, hs: null, day: null, psort: 'ovr', pdir: -1, pfTeam: 'all', pfPos: 'all', pq: '', busy: false,
  tradeWith: null, tGive: { players: [], picks: [] }, tGet: { players: [], picks: [] }, tradeMsg: null, neg: {}, faSort: 'ovr', setup: { mode: 'commish', team: 0, games: 82 } };
try { ui.mtab = localStorage.getItem('pbl-mtab') || 'roster'; } catch (e) { ui.mtab = 'roster'; }
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const ft = i => `${Math.floor(i / 12)}'${i % 12}"`;
const f1 = x => (isFinite(x) ? x : 0).toFixed(1);
const pct = (m, a) => a ? (m / a).toFixed(3).replace(/^0/, '') : '—';
const tname = id => L.teams[id].city + ' ' + L.teams[id].name;
const plink = p => `<a class="lk" data-player="${p.id}">${esc(p.name)}</a>`;
const isUser = tid => L.user != null && tid === L.user;

// ---------- logos ----------
const MOTIF = {
  star: '<polygon points="12,3 14.6,9.2 21,9.4 16,13.6 17.8,20 12,16.4 6.2,20 8,13.6 3,9.4 9.4,9.2"/>',
  cross: '<rect x="10.3" y="4" width="3.4" height="16" rx="1"/><rect x="5.5" y="8.5" width="13" height="3.4" rx="1"/>',
  peaks: '<polygon points="2.5,19 9,7 15.5,19"/><polygon points="10,19 15.5,10 21.5,19"/>',
  ridge: '<path d="M2 18 Q7 10 12 14 T22 12 L22 19 L2 19 Z"/><polygon points="14,14 16,10.5 18,14"/>',
  wing: '<path d="M3 13 L21 8 L19 11 L12 13 L16 18 L13.5 18 L8.5 13.5 L4.5 14.5 Z"/>',
  arch: '<path d="M5 20 L5 10 Q12 2 19 10 L19 20 L15 20 L15 12 Q12 8 9 12 L9 20 Z"/>',
  volcano: '<polygon points="3,20 10,8 14,8 21,20"/><circle cx="10" cy="5" r="1.6"/><circle cx="13.5" cy="3.8" r="1.3"/>',
  compass: '<polygon points="12,2.5 14,10 21.5,12 14,14 12,21.5 10,14 2.5,12 10,10"/>',
  spear: '<rect x="11" y="6" width="2" height="15" rx="1" transform="rotate(35 12 13)"/><polygon points="12,1.5 15.5,8 8.5,8" transform="rotate(35 12 13)"/>',
  mask: '<path fill-rule="evenodd" d="M3 9 Q12 3 21 9 Q21 18 12 20 Q3 18 3 9 Z M7 10.5 Q8.5 9 10 10.5 Q8.5 12.5 7 10.5 Z M14 10.5 Q15.5 9 17 10.5 Q15.5 12.5 14 10.5 Z"/>',
  shield: '<path d="M12 2.5 L20 5.5 Q20 15 12 21 Q4 15 4 5.5 Z"/>',
  durian: '<polygon points="12,2 13.5,5.5 17,4 16.5,7.8 20.5,8.5 18,11.5 21,14.5 17,15 17.5,19 13.7,17.5 12,21 10.3,17.5 6.5,19 7,15 3,14.5 6,11.5 3.5,8.5 7.5,7.8 7,4 10.5,5.5"/>',
  flower: '<circle cx="12" cy="6.5" r="3.4"/><circle cx="17.2" cy="10.3" r="3.4"/><circle cx="15.2" cy="16.5" r="3.4"/><circle cx="8.8" cy="16.5" r="3.4"/><circle cx="6.8" cy="10.3" r="3.4"/>',
  nugget: '<polygon points="5,13 8,7 14,5 19,8 20,14 16,19 9,19"/>',
  fist: '<polygon points="13.5,2 6,13 11.2,13 9.5,22 18,10 12.8,10"/>',
  bean: '<ellipse cx="12" cy="12" rx="6.5" ry="9" transform="rotate(30 12 12)"/><path d="M8.5 5.5 Q13 12 15.5 18.5" stroke="#00000055" stroke-width="1.6" fill="none"/>',
  // v21 expansion teams
  lantern: '<rect x="10" y="2" width="4" height="2.5" rx="1"/><path d="M6 6 Q12 3.5 18 6 Q20.5 12 18 18 Q12 20.5 6 18 Q3.5 12 6 6 Z"/><rect x="10" y="19" width="4" height="2.5" rx="1"/>',
  junk: '<path d="M3 17 H21 L18.5 21 H5.5 Z"/><path d="M7 16 L7 4 Q11 8 11 16 Z"/><path d="M13 16 L13 2 Q19 7 18.5 16 Z"/>',
  elephant: '<path d="M4 17 V11 Q4 5 11 5 Q17 5 18 10 Q20.5 11 20.5 15 Q20.5 20 18.5 20 Q18 17.5 17 17 L17 20 H14 V16 H9 V20 H6 V17 Z"/><circle cx="15.3" cy="9.5" r="0.9" fill="#ffffff99"/>',
  lotus: '<path d="M12 4 Q15.5 10 12 17 Q8.5 10 12 4 Z"/><path d="M12 17 Q5 15 3.5 8 Q9.5 9.5 12 17 Z"/><path d="M12 17 Q19 15 20.5 8 Q14.5 9.5 12 17 Z"/><rect x="5" y="18" width="14" height="2" rx="1"/>',
  ferry: '<path d="M2 15 H22 L19 20 H5 Z"/><rect x="6" y="9" width="10" height="6" rx="1"/><path d="M5 9 Q11 5 17 9 Z"/><rect x="17.5" y="7" width="2" height="8"/>',
  naga: '<path d="M5 20 Q3 14 8 12 Q13 10 11 6 Q10 3 13 2.5 Q17 2 17.5 5.5 L20 5 L18 7.5 Q19 11 14.5 13 Q10 15 12 18 Q13 20 17 20 Z"/>',
  peacock: '<path d="M12 21 Q9 16 10 12 Q11 9 12 8.5 Q13 9 14 12 Q15 16 12 21 Z"/><path d="M12 9 Q4 6 3 13 Q7 10 12 12 Z M12 9 Q20 6 21 13 Q17 10 12 12 Z M12 9 Q9 2 12 1.5 Q15 2 12 9 Z"/><circle cx="12" cy="7.5" r="1.4"/>',
  komodo: '<path d="M2 14 Q6 11 9 12 L13 11 Q17 9 20 11.5 L22 12 L20 13.5 Q17 14.5 14 14 L12 16 L13.5 19 L11.5 19 L10 16.5 L7 16 L6 19 L4 19 L5 15.5 Q3.5 15.5 2 14 Z"/>',
  orchid: '<path d="M12 11 Q8 2 5 5 Q4 9 12 11 Z"/><path d="M12 11 Q16 2 19 5 Q20 9 12 11 Z"/><path d="M12 11 Q3 12 4 16 Q8 18 12 11 Z"/><path d="M12 11 Q21 12 20 16 Q16 18 12 11 Z"/><path d="M12 11 Q9.5 17 12 21 Q14.5 17 12 11 Z"/>',
  hornbill: '<path d="M4 15 Q4 8 10 8 Q12 4.5 16 5 Q21 6.5 22 11 Q18 9.5 15.5 11 Q14 16 9 17 L6 21 L5.5 17 Q4 16.5 4 15 Z"/><circle cx="11" cy="10.5" r="0.9" fill="#ffffff99"/>',
  kouprey: '<path d="M3 6 Q5 9 8 9 Q10 7.5 12 8 Q14 7.5 16 9 Q19 9 21 6 Q20.5 10 17.5 11.5 Q17 16 14 18 L13.5 21 H10.5 L10 18 Q7 16 6.5 11.5 Q3.5 10 3 6 Z"/><circle cx="10" cy="12.5" r="0.9" fill="#ffffff99"/><circle cx="14" cy="12.5" r="0.9" fill="#ffffff99"/>',
  paradise: '<path d="M10 9 Q12 5 15 6 Q16.5 7 15 9 Q14 12 11.5 13 Q9 13 10 9 Z"/><path d="M11 13 Q8 18 3 21 Q8 15.5 9.5 12.5 Z M12 13 Q12 18 9 22 Q13 17 13.5 12.5 Z M13 12.5 Q16 17 21 19 Q16 15 14.5 12 Z"/><path d="M15 7 L18 6.5 L15.5 8.2 Z"/>',
  monkey: '<circle cx="5.5" cy="10" r="2.6"/><circle cx="18.5" cy="10" r="2.6"/><path d="M12 4 Q19 4 18 12 Q19 18 15 19 Q16.5 22 12 22 Q7.5 22 9 19 Q5 18 6 12 Q5 4 12 4 Z"/><ellipse cx="12" cy="16.5" rx="3.5" ry="2.6" fill="#ffffff55"/>',
  croc: '<path d="M2 12 L11 10 Q15 9 18 10.5 Q21 11.5 22 13 Q19 14 16 13.5 Q13 15 9 14.5 L7 17 L6 14.5 L2 13.5 Z"/><path d="M8 10.5 L9 9 L10 10.3 L11 8.7 L12 10 L13 8.6 L14 10" fill="none" stroke="currentColor" stroke-width="0.8"/><circle cx="17" cy="11.2" r="0.8" fill="#ffffff99"/>'
};
const leagueName = () => L && L.nba ? 'NBA 2026-27' : 'Pacific Basketball League';
const lgTag = () => L && L.nba ? 'NBA' : 'PBL';
const mktTxt = t => L && L.nba ? '' : ' · ' + MARKET_LABEL[t.market];
const logoCache = {};
function logo(tid, size) {
  size = size || 18; const key = tid + '-' + size;
  if (logoCache[key]) return logoCache[key];
  const t = L.teams[tid];
  return logoCache[key] = `<svg class="logo" width="${size}" height="${size}" viewBox="0 0 100 100" role="img" aria-label="${esc(t.name)} logo">${logoBody(t, size <= 26, size)}</svg>`;
}
// Team logos: A badge (shape per team), B monogram tile, C sash crest. Small sizes drop the letters.
const LOGO_OUT = { shield: 'M50 4 L90 16 Q92 62 50 96 Q8 62 10 16 Z', diamond: 'M50 3 L97 50 L50 97 L3 50 Z', square: 'M18 6 H82 Q94 6 94 18 V82 Q94 94 82 94 H18 Q6 94 6 82 V18 Q6 6 18 6 Z', circle: 'M50 4 A46 46 0 1 1 49.9 4 Z' };
const LOGO_IN = { shield: 'M50 11 L84 21 Q85 60 50 89 Q15 60 16 21 Z', diamond: 'M50 11 L89 50 L50 89 L11 50 Z', square: 'M20 13 H80 Q87 13 87 20 V80 Q87 87 80 87 H20 Q13 87 13 80 V20 Q13 13 20 13 Z', circle: 'M50 11 A39 39 0 1 1 49.9 11 Z' };
// v27 S2: NBA teams have no motif: draw a clean initials badge in the team colors, three styles, with a contrast check
function hexRgb(h) { h = String(h || '#888888').replace('#', ''); if (h.length === 3) h = h.replace(/./g, x => x + x); const n = parseInt(h, 16); return isNaN(n) ? [136, 136, 136] : [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function hexLum(h) { const [r, g, b] = hexRgb(h).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; }
function hexContrast(a, b) { const x = hexLum(a), y = hexLum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
// v30 G: original NBA-mode emblems, one per motif of NBA_TEXT.emblem. Drawn in a 100x100 box, solid shapes in f with cut-outs in g (the base color).
const embRot = (n, fn) => Array.from({ length: n }, (_, i) => fn(i)).join('');
const EMB = {
  hawk: (f, g) => `<path d="M46 40 L8 22 L18 40 L6 52 L22 56 L16 68 L46 64Z M54 40 L92 22 L82 40 L94 52 L78 56 L84 68 L54 64Z"/><path d="M50 26 L60 40 L50 88 L40 40Z"/><circle cx="50" cy="24" r="10"/><path d="M50 30 L44 40 L56 40Z" fill="${g}"/><circle cx="46" cy="22" r="2" fill="${g}"/><circle cx="54" cy="22" r="2" fill="${g}"/>`,
  eagle: (f, g) => `<path d="M50 84 L38 52 L8 12 L22 54 L36 74Z M50 84 L62 52 L92 12 L78 54 L64 74Z"/><path d="M50 36 L62 58 L50 92 L38 58Z"/><circle cx="50" cy="26" r="10"/><path d="M50 30 L45 42 L55 42Z" fill="${g}"/><circle cx="46" cy="24" r="2" fill="${g}"/><circle cx="54" cy="24" r="2" fill="${g}"/>`,
  hoop: (f, g) => `<rect x="22" y="8" width="56" height="34" rx="4" fill="none" stroke="${f}" stroke-width="6"/><rect x="38" y="22" width="24" height="16" rx="2" fill="none" stroke="${f}" stroke-width="4"/><ellipse cx="50" cy="52" rx="28" ry="6"/><path d="M26 56 L38 90 M38 58 L44 90 M50 60 V90 M62 58 L56 90 M74 56 L62 90 M31 72 H69" fill="none" stroke="${f}" stroke-width="4"/>`,
  ball: (f, g) => `<circle cx="50" cy="50" r="38"/><path d="M50 12 V88 M12 50 H88 M24 22 Q40 50 24 78 M76 22 Q60 50 76 78" fill="none" stroke="${g}" stroke-width="4"/>`,
  shield: (f, g) => `<path d="M50 8 L86 20 V50 Q86 76 50 92 Q14 76 14 50 V20Z"/><path d="M50 20 V82 M26 40 H74" stroke="${g}" stroke-width="7" fill="none"/>`,
  crown: (f, g) => `<path d="M14 70 L8 30 L32 50 L50 20 L68 50 L92 30 L86 70Z"/><rect x="14" y="74" width="72" height="10" rx="3"/><circle cx="8" cy="28" r="6"/><circle cx="50" cy="16" r="6"/><circle cx="92" cy="28" r="6"/><circle cx="50" cy="58" r="5" fill="${g}"/><circle cx="30" cy="62" r="4" fill="${g}"/><circle cx="70" cy="62" r="4" fill="${g}"/>`,
  bee: (f, g) => `<ellipse cx="50" cy="58" rx="18" ry="26"/><path d="M31 52 H69 M32 66 H68" stroke="${g}" stroke-width="6" fill="none"/><circle cx="50" cy="26" r="9"/><ellipse cx="28" cy="36" rx="16" ry="9" transform="rotate(-30 28 36)" fill="none" stroke="${f}" stroke-width="4"/><ellipse cx="72" cy="36" rx="16" ry="9" transform="rotate(30 72 36)" fill="none" stroke="${f}" stroke-width="4"/><path d="M50 82 L45 94 L55 94Z"/><path d="M45 18 L38 8 M55 18 L62 8" stroke="${f}" stroke-width="3" fill="none"/>`,
  star: (f, g) => `<polygon points="50,6 61,37 94,37 67,57 77,92 50,71 23,92 33,57 6,37 39,37"/><polygon points="50,34 55,47 69,47 58,55 62,68 50,60 38,68 42,55 31,47 45,47" fill="${g}"/>`,
  bull: (f, g) => `<path d="M10 58 Q12 40 34 38 L58 38 Q70 30 80 36 L90 32 L86 44 Q92 52 86 58 L76 62 L74 84 L66 84 L64 66 L38 68 L36 86 L28 86 L26 66 Q12 68 10 58Z"/><path d="M78 36 Q72 18 56 20 Q68 26 68 38Z"/><circle cx="80" cy="45" r="2.5" fill="${g}"/>`,
  ram: (f, g) => `<path d="M38 40 Q8 34 10 58 Q12 76 30 70 Q20 62 26 54 Q32 50 38 52 M62 40 Q92 34 90 58 Q88 76 70 70 Q80 62 74 54 Q68 50 62 52" fill="none" stroke="${f}" stroke-width="8" stroke-linecap="round"/><path d="M36 34 Q50 28 64 34 L60 72 Q50 90 40 72Z"/><circle cx="44" cy="80" r="2.5" fill="${g}"/><circle cx="56" cy="80" r="2.5" fill="${g}"/><path d="M42 46 L48 50 M58 46 L52 50" stroke="${g}" stroke-width="3"/>`,
  horse: (f, g) => `<path d="M30 90 L36 58 Q28 42 38 28 L40 10 L50 24 Q66 20 78 34 L90 52 Q92 62 82 64 L70 60 Q62 66 62 76 L66 90Z"/><circle cx="62" cy="36" r="3" fill="${g}"/><path d="M40 28 Q30 46 40 62" stroke="${g}" stroke-width="3" fill="none"/>`,
  sword: (f, g) => `<path d="M50 4 L59 20 V62 H41 V20Z"/><rect x="22" y="62" width="56" height="9" rx="3"/><rect x="45" y="71" width="10" height="16" rx="2"/><circle cx="50" cy="91" r="6"/><path d="M50 18 V56" stroke="${g}" stroke-width="3"/>`,
  gem: (f, g) => `<path d="M26 14 H74 L94 40 L50 92 L6 40Z"/><path d="M6 40 H94 M26 14 L36 40 L50 92 L64 40 L74 14 M36 40 L50 14 L64 40" fill="none" stroke="${g}" stroke-width="3"/>`,
  hammer: (f, g) => `<g transform="rotate(35 50 50)"><rect x="16" y="14" width="68" height="28" rx="5"/><rect x="43" y="40" width="14" height="52" rx="4"/></g><path d="M22 28 H44" stroke="${g}" stroke-width="3" transform="rotate(35 50 50)"/>`,
  gear: (f, g) => `<g transform="translate(50 50)"><circle r="30"/>${embRot(8, i => `<rect x="-8" y="-46" width="16" height="18" rx="2" transform="rotate(${i * 45})"/>`)}<circle r="13" fill="${g}"/></g>`,
  rocket: (f, g) => `<path d="M50 4 Q72 24 68 62 H32 Q28 24 50 4Z"/><path d="M32 50 L14 76 L32 70Z M68 50 L86 76 L68 70Z"/><circle cx="50" cy="38" r="9" fill="${g}"/><path d="M40 68 H60 L50 94Z"/>`,
  bolt: (f, g) => `<path d="M60 4 L20 56 H46 L36 96 L82 40 H55Z"/>`,
  wave: (f, g) => `<path d="M6 30 Q20 12 34 30 T62 30 T94 30 M6 52 Q20 34 34 52 T62 52 T94 52 M6 74 Q20 56 34 74 T62 74 T94 74" fill="none" stroke="${f}" stroke-width="9" stroke-linecap="round"/>`,
  ship: (f, g) => `<path d="M10 64 H90 L76 86 H24Z"/><rect x="48" y="10" width="5" height="54"/><path d="M55 12 L86 58 H55Z M45 22 L16 58 H45Z"/>`,
  mountain: (f, g) => `<path d="M2 88 L36 28 L52 54 L68 20 L98 88Z"/><path d="M26 46 L36 28 L46 44 L40 42 L36 48 L31 43Z M60 36 L68 20 L78 40 L70 36 L66 42Z" fill="${g}"/>`,
  tree: (f, g) => `<path d="M50 4 L74 34 H26Z M50 24 L80 58 H20Z M50 46 L88 82 H12Z"/><rect x="43" y="80" width="14" height="14"/>`,
  flame: (f, g) => `<path d="M50 4 Q56 28 74 42 Q90 58 80 78 Q70 94 50 94 Q30 94 20 78 Q12 60 28 44 Q34 52 40 54 Q40 30 50 4Z"/><path d="M50 56 Q62 68 64 78 Q62 88 50 88 Q38 88 36 78 Q38 66 50 56Z" fill="${g}"/>`,
  sun: (f, g) => `<g transform="translate(50 50)"><circle r="24"/>${embRot(12, i => `<rect x="-4" y="-46" width="8" height="16" rx="3" transform="rotate(${i * 30})"/>`)}<circle r="12" fill="${g}"/></g>`,
  buck: (f, g) => `<path d="M34 52 H66 L60 84 Q50 94 40 84Z"/><path d="M34 52 L20 46 L32 60Z M66 52 L80 46 L68 60Z"/><path d="M40 50 L30 30 L24 8 M30 30 L14 26 M34 40 L18 40 M60 50 L70 30 L76 8 M70 30 L86 26 M66 40 L82 40" fill="none" stroke="${f}" stroke-width="5" stroke-linecap="round"/><circle cx="43" cy="64" r="3" fill="${g}"/><circle cx="57" cy="64" r="3" fill="${g}"/><path d="M45 80 H55 L50 86Z" fill="${g}"/>`,
  wolf: (f, g) => `<path d="M16 8 L38 30 H62 L84 8 L88 46 L68 82 L50 94 L32 82 L12 46Z"/><path d="M30 48 L44 53 L38 58Z M70 48 L56 53 L62 58Z M43 76 H57 L50 86Z" fill="${g}"/>`,
  bird: (f, g) => `<ellipse cx="44" cy="62" rx="30" ry="18"/><path d="M60 52 Q76 44 70 26 L80 26 Q94 46 74 64Z"/><circle cx="74" cy="22" r="10"/><path d="M80 18 L98 30 Q90 42 78 32Z"/><path d="M20 62 Q40 48 56 64" fill="none" stroke="${g}" stroke-width="4"/><circle cx="76" cy="20" r="2" fill="${g}"/><path d="M40 78 L38 92 M52 78 L52 92" stroke="${f}" stroke-width="4"/>`,
  magic: (f, g) => `<rect x="12" y="46" width="64" height="8" rx="4" transform="rotate(-45 44 50)"/><path d="M22 76 L30 68" stroke="${g}" stroke-width="6" transform="translate(0 0)"/><path d="M74 8 Q76 22 90 24 Q76 26 74 40 Q72 26 58 24 Q72 22 74 8Z"/><path d="M24 14 Q25 20 31 21 Q25 22 24 28 Q23 22 17 21 Q23 20 24 14Z"/><path d="M82 56 Q83 61 88 62 Q83 63 82 68 Q81 63 76 62 Q81 61 82 56Z"/>`,
  raptor: (f, g) => `<path d="M8 74 Q12 42 40 30 Q66 20 92 40 L94 52 L62 54 L68 64 L58 66 L52 58 Q36 60 30 76Z"/><circle cx="52" cy="38" r="4" fill="${g}"/><path d="M64 54 L68 48 L72 54 L76 48 L80 54 L84 48 L88 54" fill="none" stroke="${g}" stroke-width="2.5"/>`,
  skyline: (f, g) => `<rect x="6" y="58" width="18" height="34"/><rect x="26" y="40" width="18" height="52"/><path d="M48 92 V32 L56 6 L64 32 V92Z"/><rect x="66" y="46" width="16" height="46"/><rect x="84" y="66" width="10" height="26"/><path d="M32 50 H38 M32 62 H38 M32 74 H38 M10 68 H20 M10 80 H20 M70 56 H78 M70 68 H78 M70 80 H78 M54 44 H58 M54 56 H58 M54 68 H58 M54 80 H58" stroke="${g}" stroke-width="3" fill="none"/>`,
  note: (f, g) => `<ellipse cx="32" cy="74" rx="16" ry="12" transform="rotate(-20 32 74)"/><ellipse cx="72" cy="64" rx="16" ry="12" transform="rotate(-20 72 64)"/><rect x="42" y="22" width="7" height="52"/><rect x="82" y="12" width="7" height="52"/><path d="M42 20 L89 8 V24 L42 36Z"/>`,
};
// v30 G: NBA logo = emblem (team colors) on a rounded tile; wordmark band on large sizes. No emblem entry -> initials badge (nbaLogoBody).
function nbaEmblemLogo(t, small, size) {
  const e = (typeof NBA_TEXT !== 'undefined' && NBA_TEXT.emblem && NBA_TEXT.emblem[t.abbr]) || null, fn = e && EMB[e.motif];
  if (!fn) return null;
  const c1 = t.c1, dark = hexLum(c1) < 0.5, c2 = hexContrast(c1, t.c2) >= 2.2 ? t.c2 : (dark ? '#ffffff' : '#111111');
  const word = !small && (size || 0) >= 40 && e.word ? String(e.word) : '';
  const frame = `<rect x="4" y="4" width="92" height="92" rx="20" fill="${c1}" stroke="${c2}" stroke-width="4"/>`;
  if (!word) return `${frame}<g fill="${c2}" transform="translate(${small ? '12 12) scale(.76' : '16 12) scale(.68'})">${fn(c2, c1)}</g>`;
  const ink = hexContrast(c2, '#ffffff') >= hexContrast(c2, '#111111') ? '#ffffff' : '#111111';
  return `${frame}<g fill="${c2}" transform="translate(23 10) scale(.54)">${fn(c2, c1)}</g><rect x="11" y="70" width="78" height="19" rx="5" fill="${c2}"/><text x="50" y="84" text-anchor="middle" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="13" fill="${ink}" textLength="${Math.min(70, 7.4 * word.length)}" lengthAdjust="spacingAndGlyphs">${esc(word)}</text>`;
}
function nbaLogoBody(t, st, sh) {
  const c1 = t.c1, dark = hexLum(c1) < 0.5;
  const c2 = hexContrast(c1, t.c2) >= 2.2 ? t.c2 : (dark ? '#ffffff' : '#111111');    // accent must stand out from the base
  const ink = hexContrast(c1, '#ffffff') >= hexContrast(c1, '#111111') ? '#ffffff' : '#111111';   // letters on the base color
  const ab = String(t.abbr || '').slice(0, 3), fs = ab.length >= 3 ? 36 : 44, tl = ab.length >= 3 ? 64 : 58;
  const txt = (x, y, fill, size, len) => `<text x="${x}" y="${y}" text-anchor="middle" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="${size || fs}" fill="${fill}" textLength="${len || tl}" lengthAdjust="spacingAndGlyphs">${esc(ab)}</text>`;
  if (st === 'B') return `<rect x="4" y="4" width="92" height="92" rx="22" fill="${c1}"/><path d="M4 74 H96 V74 Q96 96 74 96 H26 Q4 96 4 74 Z" fill="${c2}"/>${txt(50, 60, ink)}`;
  if (st === 'C') { const cid = 'nc' + t.id; return `<defs><clipPath id="${cid}"><path d="${LOGO_OUT.shield}"/></clipPath></defs><g clip-path="url(#${cid})"><rect width="100" height="100" fill="${c1}"/><path d="M0 14 L100 0 L100 18 L0 32 Z" fill="${c2}"/></g><path d="${LOGO_OUT.shield}" fill="none" stroke="${c2}" stroke-width="5"/>${txt(50, 64, ink)}`; }
  return `<path d="${LOGO_OUT[sh]}" fill="${c2}"/><path d="${LOGO_IN[sh]}" fill="${c1}"/>${sh === 'diamond' ? txt(50, 60, ink, ab.length >= 3 ? 24 : 28, ab.length >= 3 ? 40 : 34) : txt(50, 62, ink)}`;
}
function logoBody(t, small, size) {
  const st = t.logoStyle || 'ABC'[t.id % 3], sh = t.logoShape || ['shield', 'circle', 'diamond', 'square'][t.id % 4], m = MOTIF[t.logo] || '', c1 = t.c1, c2 = t.c2;
  if (L && L.nba && !t.logo) return nbaEmblemLogo(t, small, size) || nbaLogoBody(t, st, sh);
  const txt = (x, y, fs, fill, extra) => `<text x="${x}" y="${y}" text-anchor="middle" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="${fs}" fill="${fill}" ${extra || ''}>${esc(t.abbr)}</text>`;
  if (st === 'B') return `<rect x="4" y="4" width="92" height="92" rx="22" fill="${c1}"/>${small ? `<g transform="translate(14 14) scale(3)" fill="${c2}">${m}</g>` : `<path d="M4 70 H96 V74 Q96 96 74 96 H26 Q4 96 4 74 Z" fill="${c2}"/><g transform="translate(30 8) scale(1.65)" fill="${c2}">${m}</g>${txt(50, 91, 19, c1)}`}`;
  if (st === 'C') { const cid = 'lc' + t.id; return `<defs><clipPath id="${cid}"><path d="${LOGO_OUT.shield}"/></clipPath></defs><g clip-path="url(#${cid})"><rect width="100" height="100" fill="${c1}"/><path d="M0 30 L100 0 L100 14 L0 44 Z" fill="${c2}"/></g><path d="${LOGO_OUT.shield}" fill="none" stroke="${c2}" stroke-width="5"/><g transform="translate(${small ? '22 30) scale(2.3' : '29 34) scale(1.75'})" fill="${c2}">${m}</g>${small ? '' : txt(50, 27, 13, c1, 'transform="rotate(-16.7 50 22)"')}`; }
  const ty = sh === 'shield' ? 76 : sh === 'diamond' ? 72 : 82, fs = sh === 'diamond' ? 12 : 15;
  return `<path d="${LOGO_OUT[sh]}" fill="${c2}"/><path d="${LOGO_IN[sh]}" fill="${c1}"/>${small ? `<g transform="translate(20 20) scale(2.5)" fill="${c2}">${m}</g>` : `<g transform="translate(${sh === 'diamond' ? '29 20) scale(1.75' : '26 14) scale(2'})" fill="${c2}">${m}</g>${txt(50, ty, fs, c2)}`}`;
}
const tplain = (id, full) => `${logo(id)}${esc(full ? tname(id) : L.teams[id].abbr)}`;
const tlabel = (id, full) => `<a class="lk tl" data-team="${id}">${tplain(id, full)}</a>`;
const tlink = tlabel;
const glink = g => g ? `<a class="lk" data-gm="${g.id}">${esc(g.name)}</a>` : '—';
const clink = c => c ? `<a class="lk" data-coach="${c.id}">${esc(c.name)}</a>` : '—';
function giveLinks(give, labels) {
  const ps = (give.players || []).map(id => L.players[id] ? `<a class="lk" data-player="${id}">${esc(L.players[id].name)}</a>` : 'a player');
  const ks = labels ? labels.map(esc) : (give.picks || []).map(pk => { const k = L.picks.find(x => x.id === pk); return k ? esc(pickLabel(L, pickKV(k, give.prot && give.prot[pk]))) + ' pick' : 'a pick'; });
  const cash = give.cash > 0 ? [esc(money(give.cash)) + ' cash'] : [];   // v25.7c
  return [...ps, ...ks, ...cash].join(', ') || 'nothing';
}

// ---------- storage: IndexedDB with localStorage fallback ----------
const DBN = 'pbl-league', KEY = 'league-v4';
// v24.5.1: one shared connection (it used to open a new one on every read and write and never close them)
let idbP = null;
function idb() {
  if (idbP) return idbP;
  idbP = new Promise((res, rej) => { try { const r = indexedDB.open(DBN, 1); r.onupgradeneeded = () => r.result.createObjectStore('s'); r.onsuccess = () => { const db = r.result; db.onversionchange = () => { db.close(); idbP = null; }; db.onclose = () => { idbP = null; }; res(db); }; r.onerror = () => rej(r.error); } catch (e) { rej(e); } });
  idbP.catch(() => { idbP = null; });
  return idbP;
}
// Save slots: each league is stored under its own key, with a small index of slots
let SLOT = null;
async function dbGet(k) { try { const db = await idb(); return await new Promise((res, rej) => { const r = db.transaction('s', 'readonly').objectStore('s').get(k); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); } catch (e) { try { return localStorage.getItem(k); } catch (e2) { return null; } } }
async function gz(text) { const s = new Blob([text]).stream().pipeThrough(new CompressionStream('gzip')); return await new Response(s).blob(); }
async function gunz(blob) { const s = blob.stream().pipeThrough(new DecompressionStream('gzip')); return await new Response(s).text(); }
async function dbPut(k, v) { try { const db = await idb(); await new Promise((res, rej) => { const tx = db.transaction('s', 'readwrite'); tx.objectStore('s').put(v, k); tx.oncomplete = res; tx.onerror = () => rej(tx.error); }); } catch (e) { try { localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v)); } catch (e2) {} } }
async function dbDel(k) { try { const db = await idb(); await new Promise((res, rej) => { const tx = db.transaction('s', 'readwrite'); tx.objectStore('s').delete(k); tx.oncomplete = res; tx.onerror = () => rej(tx.error); }); } catch (e) { try { localStorage.removeItem(k); } catch (e2) {} } }
async function getSlots() { const v = await dbGet('slots'); try { return v ? (typeof v === 'string' ? JSON.parse(v) : v) : []; } catch (e) { return []; } }
function slotInfo() { return { id: SLOT, name: L.saveName || defaultSaveName(), mode: L.mode, team: L.user, season: L.season, phase: L.phase, updated: Date.now() }; }
function defaultSaveName() { return L.user != null ? tname(L.user) : 'Commissioner league'; }
// v24.5.1: saves run one at a time, in order, so an older save can't finish last and overwrite a newer one.
// Calls made while a save is running collapse into one follow-up save of the latest state.
let saveRun = Promise.resolve(), saveQueued = null;
function save() {
  if (saveQueued) return saveQueued;
  const next = saveRun.catch(() => { }).then(() => { saveQueued = null; return saveNow(); });
  saveQueued = next; saveRun = next;
  return next;
}
async function saveNow() {
  if (!L) return;
  if (!SLOT) SLOT = 'slot-' + Date.now();
  L.nextId = NEXT_ID;
  const json = JSON.stringify(L, (k, v) => k === '_used' ? undefined : v);
  // saves are stored compressed (about a tenth of the size) where the browser supports it
  let stored = false;
  if (window.CompressionStream && window.indexedDB) { try { const blob = await gz(json); const db = await idb(); await new Promise((res, rej) => { const tx = db.transaction('s', 'readwrite'); tx.objectStore('s').put(blob, 'league:' + SLOT); tx.oncomplete = res; tx.onerror = () => rej(tx.error); }); stored = true; } catch (e) { stored = false; } }
  if (!stored) await dbPut('league:' + SLOT, json);
  const slots = (await getSlots()).filter(x => x.id !== SLOT); slots.unshift(slotInfo());
  await dbPut('slots', JSON.stringify(slots)); await dbPut('current', SLOT);
}
async function loadSlot(id) { const v = await dbGet('league:' + id); if (!v) return null; try { return JSON.parse(typeof v === 'string' ? v : await gunz(v)); } catch (e) { return null; } }
async function load() {
  let cur = await dbGet('current');
  if (cur) { const x = await loadSlot(cur); if (x) { SLOT = cur; return x; } }
  // older single-save layout: move it into a slot
  const old = await dbGet(KEY);
  if (old) { SLOT = 'slot-' + Date.now(); const x = JSON.parse(old); L = x; await save(); await dbDel(KEY); L = null; return x; }
  return null;
}
function setLeague(x) { if (x && x.auto) { try { autoEnd(x); } catch (e) { } } L = x; NEXT_ID = L.nextId || (Math.max(...Object.keys(L.players).map(Number)) + 1); L._used = null; for (const k in logoCache) delete logoCache[k]; migrateLeague(L); ui.tsorts = {}; ui.nameRx = null; ui.awSeason = null; }

// ---------- stats helpers ----------
function rs(p) { return p.stats.rs || null; }
// Stats tab: regular season or playoffs
const skey = () => ui.sKey === 'po' ? 'po' : 'rs';
function sx(p) { return p.stats[skey()] || null; }
function pgx(p, k) { const s = sx(p); return s && s.gp ? s[k] / s.gp : 0; }
// Qualified = played at least half of his team's games so far (for a traded player, the team that has played the most)
function teamGamesFor(p, key) {
  const split = p.stats[key + 'T'], tids = split ? Object.keys(split).map(Number) : p.team != null ? [p.team] : [];
  return Math.max(0, ...tids.map(id => key === 'po' ? (L.teams[id].tpo ? L.teams[id].tpo.g : 0) : L.teams[id].w + L.teams[id].l));
}
function qualGp(p, key) { return Math.max(1, Math.ceil(teamGamesFor(p, key) * 0.5)); }
function isQual(p, key) { const s = p.stats[key]; return !!(s && s.gp && s.gp >= qualGp(p, key)); }
// v25.4 3: stat qualifiers. Everyone needs half his team's games; then each stat needs a per-game average OR a season total. NM = not met.
const QUAL = { fg: ['fga', 2, 90, '2 FGA a game or 90 FGA'], tp: ['tpa', 1.5, 75, '1.5 3PA a game or 75 3PA'], ft: ['fta', 1.5, 75, '1.5 FTA a game or 75 FTA'], ast: ['ast', 1.5, 75, '1.5 AST a game or 75 AST'], min: ['min', 0, 0, '10 minutes a game or 500 minutes'] };
function qualS(s, stat) { if (!s || !s.gp) return false; if (stat === 'min') return s.min / s.gp >= 600 || s.min >= 30000; const q = QUAL[stat]; return !!q && (s[q[0]] >= q[1] * s.gp || s[q[0]] >= q[2]); }
function qualOk(p, stat, key) { key = key || skey(); return isQual(p, key) && qualS(p.stats[key], stat); }
const nmCell = (p, stat, v) => qualOk(p, stat) ? v : `<span class="muted" title="Not met: ${QUAL[stat][3]}">NM</span>`;
const PQ = { fg: 'fg', tp: 'tp', ftp: 'ft', ts: 'fg', efg: 'fg', astto: 'ast', usg: 'min', pmg: 'min', bpm: 'min', obpm: 'min', dbpm: 'min', per: 'min', ws48: 'min' };   // Players-table sort key -> qualifier
function maxGpNow() { return skey() === 'po' ? Math.max(1, ...L.teams.map(t => t.tpo ? t.tpo.g : 0)) : Math.max(1, ...L.teams.map(t => t.w + t.l)); }
function pg(p, k) { const s = rs(p); return s && s.gp ? s[k] / s.gp : 0; }
function teamPlayers(tid) { return L.teams[tid].roster.map(id => L.players[id]); }
function standings() {
  const ts = seedOrder(L).map(id => L.teams[id]);
  const lead = ts[0];
  return ts.map(t => ({ t, gb: ((lead.w - t.w) + (t.l - lead.l)) / 2 }));
}
const modePill = t => `<span class="pill mode-${t.mode}${t.status ? ' st-' + shownStatus(t) : ''}" title="${esc((t.stShow ? `Shown as ${STATUS_LABEL[t.stShow]} for their record; the front office's plan is still ${STATUS_LABEL[t.status]}. ` : '') + (STATUS_WHY[t.status] || ''))}">${STATUS_LABEL[shownStatus(t)] || MODE_LABEL[t.mode]}</span>`;
// v27: real yearly amounts (contract.sched with s0) for NBA deals
function schedParts(p) {
  const c = p.contract; if (!c || !c.sched || c.s0 == null) return [];
  const cs = capSeason(L), out = [];
  for (let y = Math.max(cs, c.s0); y <= c.exp; y++) { const a = c.sched[y - c.s0]; if (a != null) out.push(seasonName(y) + ' ' + money(a)); }
  return out.length > 1 ? out : [];
}
function contractCell(p) {
  const c = p.contract; if (!c) return '<span class="muted">—</span>';
  const yl = yrsLeft(L, p);
  const flags = [c.opt ? (c.opt === 'PO' ? 'PO' : 'TO') : '', c.hg && p.team === p.draftTid ? '90%' : '', p.capRelief === capSeason(L) ? '50%' : '', c.type === 'rookie' ? 'R' : '', incsOf(c).length ? '+inc' : '', c.kick > 0 ? 'kick' : '', c.eto ? 'ETO' : '', c.role ? 'promise' : '', c.ntc ? 'NTC' : ''].filter(Boolean).join(' ');
  const ce = contractExtras(p).concat(schedParts(p)), tip = ce.length ? ` title="${esc(ce.join('\n'))}"` : '';
  return `<span${tip}>${money(c.amt)} <span class="muted">${yl ? yl + 'y' : 'exp'}${flags ? ' · ' + flags : ''}</span></span>${p.ext ? `<br><span class="muted">ext ${money(p.ext.amt)} × ${p.ext.yrs}</span>` : ''}`;
}
const commish = () => L.mode === 'commish';
const persShort = p => ({ Money: 'Money-first', Winner: 'Wants to win', Mentor: 'Mentor' }[p.pers] || p.pers);
function potRange(p) {
  if (L.user != null) { const e = teamPotEst(L, L.user, p); return e.sd ? [Math.max(p.ovr, e.est - e.sd), Math.min(99, e.est + e.sd)] : null; }
  if (p.prospect) { const k = Math.max(0, p.draftYear - capSeason(L) + 1); const sd = [3, 3, 6, 9, 11][Math.min(4, k)]; return [Math.max(p.ovr, p.scout - sd), Math.min(99, p.scout + sd)]; }
  const sd = p.age <= 21 ? 6 : p.age <= 24 ? 4 : p.age <= 27 ? 2 : 0;
  return sd ? [Math.max(p.ovr, p.scout - sd), Math.min(99, p.scout + sd)] : null;
}
function potCell(p) {
  if (commish()) return String(p.pot);
  const r = potRange(p); return r ? (r[0] === r[1] ? String(r[0]) : `${r[0]}–${r[1]}`) : '—';
}
// Cartoon portraits: generated from a fixed seed per person, so they never change and add nothing to saves
const FACE_RACE = { PH: [['brown', 70], ['asian', 20], ['white', 5], ['black', 5]], US: [['black', 50], ['white', 30], ['brown', 15], ['asian', 5]], JP: [['asian', 90], ['brown', 5], ['white', 5]], KR: [['asian', 90], ['brown', 5], ['white', 5]], CN: [['asian', 90], ['brown', 5], ['white', 5]], ID: [['brown', 60], ['asian', 40]], TH: [['brown', 60], ['asian', 40]], RS: [['white', 95], ['brown', 5]], LT: [['white', 95], ['brown', 5]], ES: [['white', 60], ['black', 20], ['brown', 20]], FR: [['white', 60], ['black', 20], ['brown', 20]], NG: [['black', 100]], SN: [['black', 100]], AU: [['white', 70], ['brown', 15], ['black', 10], ['asian', 5]], NZ: [['white', 55], ['brown', 40], ['asian', 5]], DE: [['white', 80], ['black', 15], ['brown', 5]], GR: [['white', 85], ['black', 10], ['brown', 5]], IT: [['white', 85], ['black', 10], ['brown', 5]], HR: [['white', 100]], SI: [['white', 100]], TR: [['white', 70], ['brown', 30]], CA: [['white', 45], ['black', 40], ['brown', 10], ['asian', 5]], MX: [['brown', 75], ['white', 25]], BR: [['brown', 45], ['white', 35], ['black', 20]], AR: [['white', 75], ['brown', 25]], PR: [['brown', 60], ['black', 25], ['white', 15]], GB: [['white', 65], ['black', 20], ['brown', 15]], IE: [['white', 90], ['black', 10]], VE: [['brown', 60], ['white', 25], ['black', 15]], CO: [['brown', 65], ['white', 20], ['black', 15]], UY: [['white', 80], ['brown', 20]], CL: [['brown', 50], ['white', 50]], TW: [['asian', 95], ['brown', 5]], VN: [['asian', 85], ['brown', 15]], MY: [['brown', 50], ['asian', 50]], LB: [['white', 60], ['brown', 40]], X: [['brown', 40], ['asian', 20], ['white', 20], ['black', 20]] };
const FACE_CACHE = new Map();
// faces must be drawn in a container that is in the page: the library measures parts to place and mirror them
let FACE_HOST = null;
function faceHost() { if (!FACE_HOST || !FACE_HOST.isConnected) { FACE_HOST = document.createElement('div'); FACE_HOST.setAttribute('aria-hidden', 'true'); FACE_HOST.style.cssText = 'position:absolute;left:-10000px;top:0;width:200px;height:300px;overflow:hidden;visibility:hidden'; document.body.appendChild(FACE_HOST); } return FACE_HOST; }
// Curated style (about half of all faces): plain eyes, brows, noses and mouths, everyday haircuts, no face lines, rare short beard
const FACE_CUR = { eye: ['eye10', 'eye11', 'eye18', 'eye19', 'eye2', 'eye4', 'eye6', 'eye9', 'eye16'], eyebrow: ['eyebrow2', 'eyebrow3', 'eyebrow4', 'eyebrow5', 'eyebrow9', 'eyebrow13', 'eyebrow14', 'eyebrow16', 'eyebrow17', 'eyebrow18', 'eyebrow19'], mouth: ['mouth', 'mouth2', 'straight', 'smile-closed'], nose: ['nose1', 'nose2', 'nose3', 'nose5', 'nose9', 'nose10', 'nose11', 'small'],
  hair: ['afro', 'bald', 'blowoutFade', 'cornrows', 'crop-fade', 'crop-fade2', 'crop', 'curly', 'curlyFade1', 'curlyFade2', 'dreads', 'fauxhawk-fade', 'middle-part', 'parted', 'short', 'short2', 'short3', 'short-fade', 'short-fade-2', 'short-bald'] };
function curateFace(f, rnd) {
  const pk = a => a[Math.floor(rnd() * a.length)];
  for (const k of ['eye', 'eyebrow', 'mouth', 'nose']) f[k] = { ...f[k], id: pk(FACE_CUR[k]) };
  f.eye.angle = Math.round((rnd() - 0.5) * 6); f.eyebrow.angle = Math.round((rnd() - 0.5) * 6); f.nose.size = 0.8 + rnd() * 0.3;
  f.hair = { ...f.hair, id: pk(FACE_CUR.hair) }; f.hairBg = { id: 'none' };
  f.facialHair = { id: rnd() < 0.15 ? 'goatee1' : 'none' };
  f.eyeLine = { id: 'none' }; f.smileLine = { id: 'none' }; f.miscLine = { id: 'none' }; f.glasses = { id: 'none' };
}
function portrait(kind, id, nat, tid, cls) {
  if (!window.FACES) return '';
  const key = kind + id + ':' + (tid == null ? '' : tid);
  let svg = FACE_CACHE.get(key);
  if (!svg) {
    let s = (hrand(id, kind === 'p' ? 11 : kind === 'c' ? 23 : 37, 5) * 4294967296) >>> 0;
    const rnd = () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
    const opts = FACE_RACE[nat] || FACE_RACE.X; let r = rnd() * 100, race = opts[0][0]; for (const [k, w] of opts) { if (r < w) { race = k; break; } r -= w; }
    const keep = Math.random; Math.random = rnd;
    try { const t = tid != null && L.teams[tid] ? L.teams[tid] : null; const face = window.FACES.generate(undefined, { gender: 'male', race });
      if (hrand(id, kind === 'p' ? 41 : kind === 'c' ? 43 : 47, 7) < 0.5) curateFace(face, rnd); if (kind !== 'p' || !/headband/.test((face.accessories || {}).id || '')) face.accessories = { id: 'none' }; const d = document.createElement('div'); window.FACES.display(faceHost(), face, { teamColors: t ? [t.c1, t.c2, '#ffffff'] : ['#5b6670', '#c9ced3', '#ffffff'] }); svg = faceHost().innerHTML; faceHost().innerHTML = ''; }
    catch (e) { svg = ''; } finally { Math.random = keep; }
    if (FACE_CACHE.size > 400) FACE_CACHE.clear();
    FACE_CACHE.set(key, svg);
  }
  return svg ? `<div class="face ${cls || ''}" aria-hidden="true">${svg}</div>` : '';
}
const potHead = () => commish() ? 'Pot' : 'Pot (scouted)';
// your director's read on development: bust risk or late-bloomer upside
function flagPill(p) {
  if (L.user == null) return '';
  const fl = dirFlags(L, L.user, p);
  return fl === 'bust' ? ' <span class="pill inj" title="Your scouting director thinks he may never reach his potential">Bust risk</span>' : fl === 'bloom' ? ' <span class="pill prot" title="Your scouting director thinks he could develop late">Late bloomer</span>' : '';
}
const usg = s => s && s.usg != null ? s.usg : s && s.usgDen ? 100 * (s.fga + 0.44 * s.fta + s.tov) / s.usgDen : 0;   // v33c: the game's USG% (team-based, computeAdv) when it has it
const hasUsg = s => !!(s && (s.usg != null || s.usgDen));
const tsPct = s => s && (s.fga + 0.44 * s.fta) ? s.pts / (2 * (s.fga + 0.44 * s.fta)) : 0;
const efgPct = s => s && s.fga ? (s.fgm + 0.5 * s.tpm) / s.fga : 0;
const effPg = s => s && s.gp ? (s.pts + s.orb + s.drb + s.ast + s.stl + s.blk - (s.fga - s.fgm) - (s.fta - s.ftm) - s.tov) / s.gp : 0;
const gmscPg = s => s && s.gp ? gmsc(seasonLine(s)) / s.gp : 0;
const pmPg = s => s && s.gp ? (s.pm || 0) / s.gp : 0;
const sgn = x => (x > 0 ? '+' : '') + f1(x);
// team ratings from season totals
function teamAdv(x) {
  if (!x || !x.g) return null;
  const poss = ((x.fga - x.orb + x.tov + 0.44 * x.fta) + (x.ofga - x.oorb + x.otov + 0.44 * x.ofta)) / 2;
  return { g: x.g, ppg: x.pts / x.g, opp: x.opts / x.g, fg: x.fgm / x.fga, tp: x.tpm / x.tpa, ft: x.ftm / x.fta, rpg: (x.orb + x.drb) / x.g, apg: x.ast / x.g, spg: x.stl / x.g, bpg: x.blk / x.g, tov: x.tov / x.g,
    pace: poss / (x.min / 48), ortg: 100 * x.pts / poss, drtg: 100 * x.opts / poss, efg: (x.fgm + 0.5 * x.tpm) / x.fga, oefg: (x.ofgm + 0.5 * x.otpm) / x.ofga, ts: x.pts / (2 * (x.fga + 0.44 * x.fta)),
    tovp: 100 * x.tov / (x.fga + 0.44 * x.fta + x.tov), orbp: 100 * x.orb / (x.orb + x.odrb), drbp: 100 * x.drb / (x.drb + x.oorb), ftr: x.fta / x.fga, tpar: x.tpa / x.fga };
}
// List filters: any table with data-flist="id" whose rows carry frow(p) attributes can be filtered by fbar("id")
const rwFlags = p => [isWatched(L, p) ? 'watch' : '', ptagOf(L, p) || '', p.team != null && p.contract && p.contract.exp === capSeason(L) - (['regular', 'playoffs', 'regular-done'].includes(L.phase) ? 0 : 1) ? 'exp' : '', p.injury > 0 ? 'hurt' : '', p.team != null && p.morale != null && p.morale < 40 ? 'unhappy' : '', p.age <= 23 ? 'young' : ''].filter(Boolean).join(' ');
const frow = p => `data-frow="1" data-rw="${rwFlags(p)}" data-rn="${esc(p.name.toLowerCase())}" data-rp="${p.pos}${p.pos2 != null ? ' ' + p.pos2 : ''}" data-ro="${ovrNum(p)}" data-ra="${p.age}" data-rt="${esc((p.arch || []).map(a => a.p + '|' + a.n).join(';'))}"`;
function typeOptions(sel) { const o = []; for (const pos in ARCH) for (const n in ARCH[pos]) { const k = pos + '|' + n; o.push(`<option value="${esc(k)}" ${sel === k ? 'selected' : ''}>${esc(n + ' ' + pos)}</option>`); } return o.join(''); }
const QF = { draft: [['', 'All'], ['watch', '★ Watch list'], ['target', 'Target'], ['sleeper', 'Sleeper'], ['avoid', 'Avoid']], roster: [['', 'All'], ['watch', '★ Watch list'], ['exp', 'Expiring'], ['unhappy', 'Unhappy'], ['hurt', 'Injured'], ['young', '23 and under']], def: [['', 'All'], ['watch', '★ Watch list'], ['exp', 'Expiring'], ['hurt', 'Injured'], ['young', '23 and under']] };
function fbar(sid, opts) {
  opts = opts || {}; const f = (ui.lf || {})[sid] || {};
  const qf = QF[['board', 'draftp'].includes(sid) ? 'draft' : sid === 'roster' ? 'roster' : 'def'];
  return `<div class="qf seg" role="group" aria-label="Quick filters">${qf.map(([v, n]) => `<button class="sm ${(f.w || '') === v ? 'primary' : ''}" data-qf="${sid}" data-qv="${v}">${n}</button>`).join('')}</div><div class="filters" data-fbar="${sid}"><input type="search" data-fq="${sid}" placeholder="Filter by name" value="${esc(f.q || '')}" aria-label="Filter by name" style="width:170px"><select data-fp="${sid}" aria-label="Position"><option value="">All positions</option>${POS.map((x, i) => `<option value="${i}" ${f.pos === String(i) ? 'selected' : ''}>${x}</option>`).join('')}</select><select data-fo="${sid}" aria-label="Minimum overall"><option value="">Any overall</option>${[45, 50, 55, 60, 65, 70, 75, 80].map(v => `<option value="${v}" ${f.ovr === String(v) ? 'selected' : ''}>${v}+ overall</option>`).join('')}</select><select data-ft="${sid}" aria-label="Player type"><option value="">All player types</option>${typeOptions(f.type)}</select>${opts.age === false ? '' : `<select data-fa="${sid}" aria-label="Maximum age"><option value="">Any age</option>${[21, 23, 25, 27, 30, 33].map(v => `<option value="${v}" ${f.age === String(v) ? 'selected' : ''}>${v} or younger</option>`).join('')}</select>`}<span class="muted" data-fcount="${sid}"></span>${opts.sortHint === false ? '' : '<span class="muted">· click a column header to sort</span>'}</div>`;
}
function applyFilters() {
  document.querySelectorAll('#main [data-fbar]').forEach(bar => {
    const sid = bar.dataset.fbar, f = (ui.lf || {})[sid] || {}; let n = 0, tot = 0;
    document.querySelectorAll(`#main [data-flist="${sid}"] [data-frow]`).forEach(r => {
      tot++;
      const ok = (!f.q || r.dataset.rn.includes(f.q.toLowerCase())) && (!f.pos || r.dataset.rp.split(' ').includes(f.pos)) && (!f.ovr || +r.dataset.ro >= +f.ovr) && (!f.age || +r.dataset.ra <= +f.age) && (!f.type || r.dataset.rt.split(';').includes(f.type)) && (!f.w || (r.dataset.rw || '').split(' ').includes(f.w));
      r.style.display = ok ? '' : 'none'; if (ok) n++;
    });
    const c = bar.querySelector('[data-fcount]'); if (c) c.textContent = n === tot ? `${tot} shown` : `${n} of ${tot} shown`;
  });
}

// v20: one-click prospect tags on the draft board (T / S / A, click again to clear) and the watch star
const ptagBtns = p => `${Object.entries(PTAGS).map(([k, n]) => `<button class="sm ${ptagOf(L, p) === k ? 'primary' : ''}" data-ptag="${p.id}" data-ptv="${k}" title="${n}">${n[0]}</button>`).join(' ')} <button class="sm ${isWatched(L, p) ? 'primary' : ''}" data-watch="${p.id}" title="Watch list">${isWatched(L, p) ? '★' : '☆'}</button>`;
// v37a: one ⋯ menu per row. Items carry the same data-* attributes the old buttons had, so the existing click handler runs them.
// kind 'my' (own roster row / player page: Extend, Shop, Untouchable, Core, Release), 'rel' (commissioner: Release), 'board' (draft board: Up, Down, Target / Sleeper / Avoid, Watch)
function rmBtn(kind, p, d) { return `<button class="sm rmbtn" data-rm="${p.id}" data-rmk="${kind}" ${d != null ? `data-rmd="${d}"` : ''} aria-haspopup="menu" aria-label="Actions for ${esc(p.name)}" title="Actions">⋯</button>`; }
function rmItems(kind, p, d) {
  const out = [];   // [label, attrs, class, disabled]
  if (kind === 'board') {
    const ids = draftBoard(L, L.user, d).map(x => x.id), i = ids.indexOf(p.id);
    out.push(['Move up on my board', `data-bup="${p.id}" data-bd="${d}"`, '', i <= 0], ['Move down', `data-bdown="${p.id}" data-bd="${d}"`, '', i < 0 || i >= ids.length - 1]);
    for (const [k, n] of Object.entries(PTAGS)) out.push([(ptagOf(L, p) === k ? '✓ ' : '') + n, `data-ptag="${p.id}" data-ptv="${k}"`, ptagOf(L, p) === k ? 'on' : '', false]);
    out.push([isWatched(L, p) ? '★ On watch list (remove)' : '☆ Add to watch list', `data-watch="${p.id}"`, isWatched(L, p) ? 'on' : '', false]);
    return out;
  }
  const mine = isUser(p.team), canRel = (mine || commish()) && L.phase !== 'playoffs';
  if (mine && canExtend(L, p)) out.push(['Extend contract…', `data-nego="${p.id}" data-rmext="1"`, '', false]);
  if (mine) out.push([p.block ? '✓ On the block (take off)' : 'Shop (put on the block)', `data-block="${p.id}"`, p.block ? 'on' : '', false], [p.protect ? '✓ Untouchable (remove)' : 'Untouchable', `data-protect="${p.id}"`, p.protect ? 'on' : '', false], [p.core ? '✓ Core player (remove)' : 'Core player', `data-core="${p.id}"`, p.core ? 'on' : '', false]);
  if (canRel) out.push(['Release…', `data-release="${p.id}"`, 'danger', false]);
  return out;
}
let rmHost = null, rmAt = 0;
function closeRM() { if (rmHost) { rmHost.hidden = true; rmHost.innerHTML = ''; } const b = document.querySelector('.rmbtn.open'); if (b) { b.classList.remove('open'); b.setAttribute('aria-expanded', 'false'); } }
function openRM(btn) {
  const p = L.players[+btn.dataset.rm]; if (!p) return;
  const items = rmItems(btn.dataset.rmk, p, btn.dataset.rmd != null ? +btn.dataset.rmd : null); if (!items.length) return;
  if (!rmHost) { rmHost = document.createElement('div'); rmHost.id = 'rowmenu'; rmHost.setAttribute('role', 'menu'); document.body.appendChild(rmHost); }
  closeRM();
  rmHost.innerHTML = `<div class="rm-h">${esc(p.name)}</div>` + items.map(([lb, at, cl, dis]) => `<button role="menuitem" class="rmi ${cl}" ${at} ${dis ? 'disabled' : ''}>${esc(lb)}</button>`).join('');
  rmHost.hidden = false; rmHost.classList.toggle('sheet', innerWidth <= 700);
  btn.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); rmAt = Date.now();
  if (innerWidth > 700) {   // popover next to the button, kept inside the window
    const r = btn.getBoundingClientRect(), w = rmHost.offsetWidth, h = rmHost.offsetHeight;
    let left = Math.min(Math.max(8, r.right - w), innerWidth - w - 8), top = r.bottom + 4; if (top + h > innerHeight - 8) top = Math.max(8, r.top - h - 4);
    rmHost.style.left = left + 'px'; rmHost.style.top = top + 'px'; rmHost.style.bottom = '';
  } else { rmHost.style.left = rmHost.style.top = ''; }
  const f = rmHost.querySelector('.rmi:not([disabled])'); if (f) f.focus({ preventScroll: true });
}
// capture phase: the ⋯ button must not also open the row's player page
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('[data-rm]');
  if (b) { e.preventDefault(); e.stopPropagation(); if (b.classList.contains('open')) closeRM(); else openRM(b); return; }
  if (rmHost && !rmHost.hidden) {
    const it = e.target.closest('#rowmenu .rmi');
    if (it) { const rel = it.dataset.release; setTimeout(() => { closeRM(); if (rel) { const m = document.getElementById('relmsg'); if (m) m.scrollIntoView({ block: 'center' }); } }, 0); }
    else if (!e.target.closest('#rowmenu')) closeRM();
  }
}, true);
document.addEventListener('keydown', e => { if (e.key === 'Escape' && rmHost && !rmHost.hidden) { const b = document.querySelector('.rmbtn.open'); closeRM(); if (b) b.focus(); } });
window.addEventListener('resize', () => closeRM());
window.addEventListener('scroll', e => { if (innerWidth > 700 && rmHost && !rmHost.hidden && Date.now() - rmAt > 400 && !(e.target.closest && e.target.closest('#rowmenu'))) closeRM(); }, true);
// v25.5: several panels in one window with tabs (state kept per window id in ui.twin)
function twin(id, tabs, title, hide) {
  const t = tabs.filter(x => x[1]);
  if (!t.length) return '';
  const sel = (ui.twin || {})[id], cur = t.find(x => x[0] === sel) || t[0];
  const bar = t.length > 1 ? `<div class="subtabs">${t.map(x => `<button class="sm ${x === cur ? 'primary' : ''}" data-twin="${id}|${x[0]}">${x[0]}</button>`).join('')}</div>` : '';
  if (t.length === 1 && !title) return cur[1];
  return `<section class="panel twin${hide ? ' hh' : ''}" style="margin-bottom:16px">${title ? `<h3>${title}</h3>` : ''}${bar}<div class="twbody">${cur[1]}</div></section>`;
}
// v20: watch list tab and the "Needs attention" panel on My Team
function watchPanel() {
  const ws = watchList(L);
  const st = p => { const ts = p.team != null && !isUser(p.team) ? tradeStatus(L, p) : null; return [p.prospect ? 'Prospect' : '', L.fa.includes(p.id) ? '<span class="pill shop">Free agent</span>' : '', ts && ts.k === 'block' ? '<span class="pill mode-rebuild">On the block</span>' : '', ts && ts.k === 'protect' ? '<span class="pill prot">Protected</span>' : '', p.injury > 0 ? `<span class="pill inj">Out ${injGames(p)}</span>` : '', ptagOf(L, p) ? `<span class="pill pos">${PTAGS[ptagOf(L, p)]}</span>` : ''].filter(Boolean).join(' ') || '—'; };
  const ctr = p => p.contract && p.team != null ? `${money(p.contract.amt)} thru ${seasonName(contractEnd(p))}` : '—';
  const news = L.log.filter(x => x.cat === 'watch').slice(0, 8);
  return `<section class="panel" style="margin-bottom:16px"><h3>Watch list · ${ws.length} of ${WATCH_MAX}</h3>${ws.length ? `<div class="tblwrap"><table><thead><tr><th class="l">Player</th><th class="l">Team</th><th class="l">Pos</th><th>Age</th><th>Ovr</th><th class="l">Contract</th><th class="l">Status</th><th></th></tr></thead><tbody>${ws.map(p => `<tr class="click" data-player="${p.id}"><td class="l">${esc(p.name)}</td><td class="l">${p.team != null ? tlabel(p.team) : p.prospect ? 'Draft class' : 'Free agent'}</td><td class="l">${posLabel(p)}</td><td>${p.age}</td><td>${ovrNum(p)}</td><td class="l">${ctr(p)}</td><td class="l">${st(p)}</td><td><button class="sm" data-watch="${p.id}" title="Remove from watch list">Remove</button></td></tr>`).join('')}</tbody></table></div>` : '<p class="muted">Nobody yet. Open any player or prospect and press ☆ Watch.</p>'}
  <p class="muted" style="font-size:12px;margin:8px 0 0">You get a news alert when a watched player is traded, put on the block, becomes a free agent, signs, is drafted, gets hurt long-term or jumps 3+ in overall. Use the ★ Watch list quick filter on the roster, trade, free agency and draft lists.</p></section>
  ${news.length ? `<section class="panel"><h3>Recent alerts</h3>${news.map(x => `<div class="leader" style="grid-template-columns:110px minmax(0,1fr)"><span class="muted">${seasonName(x.season)} · ${x.phase === 'regular' ? 'Day ' + (x.day + 1) : 'Offseason'}</span><span>${linkify(x.text)}</span></div>`).join('')}</section>` : ''}`;
}
function attentionItems(t) {
  const out = [], P = p => `<a class="lk" data-player="${p.id}">${esc(p.name)}</a>`;
  const add = (sev, html) => out.push({ sev, html });
  const ps = teamPlayers(t.id), rot = rotationOf(L, t).slice(0, 8), cs = capSeason(L), reg = ['regular', 'regular-done', 'playoffs'].includes(L.phase);
  const [lo, hi] = rosterBounds(L);
  if (ps.length < lo) add('act', `Roster has ${ps.length} players; you need at least ${lo}.`);
  if (ps.length > hi) add('act', `Roster has ${ps.length} players; the limit is ${hi}.`);
  const pay = payroll(L, t, cs);
  if (pay > APRON) add('act', `Payroll ${money(pay)} is over the ${money(APRON)} hard cap.`); else if (pay > TAXLINE) add('wat', `Payroll ${money(pay)} is over the ${money(TAXLINE)} tax line.`);
  for (const p of ps) if (p.tradeReq === L.season) add('act', `${P(p)} has asked for a trade.`);
  for (const p of ps) if (p.morale != null && p.morale < 40 && p.tradeReq !== L.season) add('wat', `${P(p)} is unhappy (morale ${p.morale}).`);
  const offers = (L.offers || []).length; if (offers) add('act', `${offers} trade offer${offers > 1 ? 's' : ''} waiting on the Trades tab.`);
  if (reg) { const core = rotationOf(L, t).slice(0, 10), sc = p => signConcerns(L, p, t, 'extension'), mood = p => { const m = sc(p).mood; return m ? ' ' + (m === 'happy' ? 'happy: −8%' : 'unhappy: +12%') : ''; };   // v25.5: split re-sign vs early extension, with a willing check
    const pl = p => `${P(p)} (${p.ovr}, ${money(p.contract.amt)}${mood(p) ? ',' + mood(p) : ''})`, why = p => { const k = sc(p).refuseKind; return k === 'unhappy' ? 'unhappy' : k === 'tanking' ? "you're tanking" : k === 'minutes' ? 'wants minutes' : 'unwilling'; };
    const ex = core.filter(p => p.contract && p.contract.exp === L.season), open = L.phase === 'regular' && L.day < deadlineDay(L);
    const re = ex.filter(p => canExtend(L, p)), reOk = re.filter(p => !sc(p).refuse), reNo = re.filter(p => sc(p).refuse);
    if (reOk.length) add('act', `Extend before the deadline (${dd(deadlineDay(L)) || 'day ' + deadlineDay(L)}), or he walks in free agency: ${reOk.map(pl).join(', ')}.`);
    const later = ex.filter(p => !canExtend(L, p)); if (later.length) add('wat', `Expiring after the season (re-sign in the offseason): ${later.map(pl).join(', ')}.`);
    const early = ps.filter(p => canExtend(L, p) && p.contract.exp > L.season), earlyOk = early.filter(p => !sc(p).refuse), earlyNo = early.filter(p => sc(p).refuse);
    if (open && earlyOk.length) add('wat', `Can extend now (1+ years left): ${earlyOk.map(pl).join(', ')}.`);
    const no = [...reNo, ...earlyNo]; if (no.length) add('wat', `Won't extend right now: ${no.map(p => `${P(p)} (${why(p)})`).join(', ')}.`); }
  if (L.phase === 'off-resign') { const n = ps.filter(p => p.contract && p.contract.exp < cs).length; if (n) add('act', `${n} of your players need a re-sign decision.`); }
  if (L.phase === 'off-resign' && (L.teamOptions || []).length) add('act', `Team option decision${L.teamOptions.length > 1 ? 's' : ''} waiting: ${L.teamOptions.map(id => L.players[id]).filter(Boolean).map(p => `${P(p)} (${money(p.contract.amt)})`).join(', ')}. Undecided options are exercised when free agency opens.`);
  { const late = (L.phase === 'regular' && L.day >= L.schedule.length - 14) || ['regular-done', 'playoffs', 'season-done'].includes(L.phase) || (L.phase.startsWith('off') && !['off-resign', 'off-fa', 'off-ready'].includes(L.phase));   // v23: options coming up
    if (late) { const op = ps.filter(p => p.contract && p.contract.opt && p.contract.exp === L.season + 1); const po = op.filter(p => p.contract.opt === 'PO'), to = op.filter(p => p.contract.opt === 'TO');
      if (to.length) add('wat', `Team options to decide when re-signing opens: ${to.map(p => `${P(p)} (${money(p.contract.amt)})`).join(', ')}.`);
      if (po.length) add('inf', `Player options coming up (his choice): ${po.map(p => `${P(p)} (${money(p.contract.amt)}, market ${money(p.mval)})`).join(', ')}.`); } }
  if (L.phase === 'regular' && L.day >= L.schedule.length - 14) { const tw = twOf(L, t); if (tw.length) add(L.day >= twPoDay(L) ? 'act' : 'wat', `Two-way player${tw.length > 1 ? 's' : ''} ${tw.map(p => `${P(p)} (${p.ovr})`).join(', ')} can't play in the playoffs unless converted before the regular season ends (day ${L.schedule.length}).`); }
  for (const p of rot) if (p.injLong && p.injury >= 10) add('wat', `${P(p)} is out ${injGames(p)} games.`);
  if (L.phase === 'regular' && t.w + t.l >= 10) for (const p of ps) { const s = p.stats.rs; const mpg = s && s.gp ? s.min / s.gp / 60 : 0; if (p.age <= 23 && (p.scout || 0) >= 72 && mpg < 12) add('wat', `${P(p)} (${p.age}, scouted ${p.scout}) is playing ${f1(mpg)} minutes a game.`); }
  if (L.phase === 'regular' && L.day < deadlineDay(L) && L.day >= deadlineDay(L) - 14) add('inf', `Trade deadline in ${deadlineDay(L) - L.day} days${dd(deadlineDay(L)) ? ' (' + dd(deadlineDay(L)) + ')' : ''}.`);
  const watchFA = watchList(L).filter(p => L.fa.includes(p.id)); if (watchFA.length) add('wat', `Watch list free agents: ${watchFA.map(P).join(', ')}.`);
  const watchBlock = watchList(L).filter(p => p.team != null && !isUser(p.team) && (tradeStatus(L, p) || {}).k === 'block'); if (watchBlock.length) add('wat', `On the block from your watch list: ${watchBlock.map(P).join(', ')}.`);
  if (['off-lottery', 'off-draft', 'off-review'].includes(L.phase) || (L.phase === 'regular' && L.day >= deadlineDay(L))) {
    const tg = Object.keys(L.ptag || {}).map(id => L.players[id]).filter(p => p && p.prospect && L.ptag[p.id] === 'target');
    if (tg.length) add('inf', `Draft targets still available: ${tg.slice(0, 5).map(P).join(', ')}${tg.length > 5 ? ` and ${tg.length - 5} more` : ''}.`);
  }
  const recent = L.log.filter(x => x.cat === 'watch' && x.season === L.season && (L.phase !== 'regular' || x.phase !== 'regular' || L.day - x.day <= 7)).slice(0, 3);
  for (const x of recent) add('inf', linkify(x.text));
  const rank = { act: 0, wat: 1, inf: 2 };
  return out.sort((a, b) => rank[a.sev] - rank[b.sev]);
}
function attentionPanel(t) {
  const it = attentionItems(t), lab = { act: 'Action', wat: 'Watch', inf: 'Info' };
  const show = ui.attAll ? it : it.slice(0, 6);
  return `<section class="panel" style="margin:16px 0"><h3>Needs attention${it.length ? ` · ${it.length}` : ''}</h3>${it.length ? `<div class="att">${show.map(x => `<span class="sev ${x.sev}">${lab[x.sev]}</span><span>${x.html}</span>`).join('')}</div>${it.length > 6 ? `<p style="margin:8px 0 0"><a class="lk" data-attall="1">${ui.attAll ? 'Show fewer' : `Show all ${it.length}`}</a></p>` : ''}` : '<p class="muted">All clear.</p>'}</section>`;
}
function moodCell(p) { const m = p.morale; if (m == null) return '—'; const l = moodLabel(m); return `<span class="mood m-${l}" title="Morale ${m}/100">${l} ${m}</span>`; }
function moralePanel(p) {
  if (p.team == null || p.morale == null) return '';
  const parts = p.moraleParts || moraleParts(L, p) || {};
  const row = (k, n, txt) => parts[k] == null ? '' : `<div class="leader" style="grid-template-columns:minmax(0,1fr) auto"><span>${n}${txt ? ` <span class="muted">${txt}</span>` : ''}</span><span class="v ${parts[k] > 0.5 ? 'w' : parts[k] < -0.5 ? 'lo' : ''}">${parts[k] > 0 ? '+' : ''}${f1(parts[k])}</span></div>`;
  const mm = p.moodMin > 0 ? `<div class="msg">The coach is giving him about ${p.moodMin} extra minutes a game to keep him happy.</div>` : '';
  return `<section class="panel" style="margin-bottom:16px"><h3>Morale · ${moodCell(p)}</h3>${mm}${p.tradeReq === L.season ? `<div class="msg no">He has asked for a trade. Unless his mood improves, he'll be harder to re-sign and plays slightly worse.</div>` : ''}${isUser(p.team) ? `<div style="margin:6px 0"><span class="k">Trust in you · ${gmTrustOf(p)}/100</span>${meter(gmTrustOf(p), gmTrustOf(p) < 35 ? 'hot' : gmTrustOf(p) < 50 ? 'warm' : '')}</div>` : ''}<div class="cols2">${row('minutes', 'Minutes vs role', parts.role ? `${f1(parts.mpg)} min · ${roleName(parts.role)} (${parts.expMin})` : parts.expMin != null ? `${f1(parts.mpg)} min, expects about ${parts.expMin}` : '')}${row('winning', 'Winning', p.pers === 'Winner' ? 'matters a lot to him' : '')}${row('pay', 'Pay vs market value', p.pers === 'Money' ? 'matters a lot to him' : '')}${row('loyalty', 'Time with the team', p.pers === 'Loyal' ? 'loyal' : '')}${row('fit', 'Fit with the coach\'s systems', '')}${row('shopped', 'On the trading block', '')}${row('family', 'Family on the team', '')}${row('mentor', 'Playing for his first coach', '')}${row('friction', 'Friction with the coach', '')}${row('locker', 'Locker room', lrLabel(lrOf(L.teams[p.team]).v))}${row('feud', 'Feud with a teammate', p.feud && L.players[p.feud.w] ? L.players[p.feud.w].name : '')}${row('talk', 'Talked with you', 'recent one-on-one')}${row('gmPromise', 'Your promise', parts.gmPromise < 0 ? 'broken' : 'open')}${row('susp', 'Team suspension', '')}</div><p class="muted" style="margin:6px 0 0;font-size:12px">Updated weekly and moves gradually. 70+ happy (re-signs at a discount), under 40 unhappy (asks more to re-sign), under 30 may request a trade. Mood shifts game form slightly.</p></section>`;
}
// v24.6: when an injured player is due back. Injuries heal by the day (healDay), so this walks his team's schedule.
// Returns { games: team games he'll still miss, day: first day he can play (0-based) or null, txt }.
function injReturn(p) {
  if (!(p.injury > 0)) return null;
  const g = injGames(p);
  if (isDTD(p)) { const plan = isUser(p.team) && p.hurtPlan ? (p.hurtPlan === 'play' ? ': you told him to play through it' : ': you told him to sit') : ': game-time call'; return { games: 0, day: L.phase === 'regular' ? L.day : null, dtd: true, txt: 'day-to-day' + plan }; }
  if (L.phase !== 'regular') return { games: g, day: null, txt: L.phase === 'playoffs' ? `out about ${g} game${g > 1 ? 's' : ''}` : `about ${g} game${g > 1 ? 's' : ''} of recovery left` };
  const gpd = gpdOf(L), h = L.day + Math.ceil(p.injury / gpd - 1e-6) - 1;   // he heals at the end of day h
  if (h + 1 >= L.schedule.length) return { games: g, day: null, txt: p.injSE || p.injury > SEASON_GAMES / 2 ? 'out for the season' : 'out for the rest of the regular season' };
  let miss = 0, back = h + 1;
  if (p.team != null) { for (let d = L.day; d <= h; d++) if ((L.schedule[d] || []).some(([a, b]) => a === p.team || b === p.team)) miss++; while (back < L.schedule.length && !(L.schedule[back] || []).some(([a, b]) => a === p.team || b === p.team)) back++; }
  if (back >= L.schedule.length) return { games: miss, day: null, txt: 'out for the rest of the regular season' };
  return { games: miss, day: back, txt: back === L.day ? 'available today' : `back day ${back + 1}${p.team != null ? ` (misses ${miss} game${miss === 1 ? '' : 's'})` : ''}` };
}
// v24.9: training focus (player page, lineup panel, development report)
const XO_TAG = { hub: 'Passing big', rebG: 'Rebounding guard', pointW: 'Playmaking wing', rebW: 'Rebounding wing' };
const styleTxt = p => p.xo ? XO_TAG[p.xo] : p.arch && p.arch[0] ? p.arch[0].n : 'balanced';
const focusName = (p, k) => k === 'bal' ? `Default (his style: ${styleTxt(p)})` : FOCUS[k].n;
const focusSel = p => `<select class="sm" data-focus="${p.id}">${FOCUS_KEYS.map(k => `<option value="${k}" ${(p.focus || 'bal') === k ? 'selected' : ''}>${esc(focusName(p, k))}</option>`).join('')}</select>`;
const focusLogTxt = p => { const f = p.focusLog; if (!f || !FOCUS[f.k]) return ''; const parts = Object.entries(f.d).filter(([k, v]) => v).map(([k, v]) => `${v > 0 ? '+' : ''}${v} ${LABELS[k] || k}`); return `${seasonName(f.s)} summer (${esc(FOCUS[f.k].n.toLowerCase())}): ${parts.length ? esc(parts.join(', ')) : 'no change'}`; };
function trainPanel(p) {
  if (p.prospect || p.retired || p.team == null) return '';
  const mine = isUser(p.team), f = p.focus || 'bal', big = p.pos >= 3;
  const note = f === 'shoot' ? `Free throws limit how far his three can climb: up to ${Math.min(99, p.ft + FT_GATE)} 3PT for now.${big ? ' A big who sticks with it can become a stretch five in 2-3 seasons; it costs a little post and rebounding.' : ''}` : f === 'cond' ? 'Slows the athletic decline that starts in the late 20s.' : f === 'bal' ? `Growth leans toward his style (${esc(styleTxt(p))}).` : 'Most of his growth goes to these skills; overall growth is the same, other skills grow less.';
  return `<section class="panel" style="margin-bottom:16px"><h3>Training focus</h3><div class="row" style="gap:10px;align-items:center">${mine ? focusSel(p) : `<strong>${esc(focusName(p, f))}</strong> <span class="muted">(set by ${esc(L.teams[p.team].abbr)})</span>`}<span class="muted" style="font-size:12px">${note}</span></div>${p.focusLog ? `<p class="muted" style="font-size:12px;margin:6px 0 0">Last ${focusLogTxt(p)}</p>` : ''}</section>`;
}
function trainEditor(t) {
  const ps = teamPlayers(t.id).filter(p => !p.prospect).sort((a, b) => a.age - b.age);
  return `<div class="panel" style="margin-top:12px"><h3>Training focus</h3><p class="muted" style="margin:-4px 0 8px;font-size:12px">Applied each summer when players develop. Growth goes toward the same ceiling; the focus decides where it goes. Young players change most; past ~30 only conditioning really helps. A focus you set stays until you change it or he changes teams.</p><label class="check" style="margin:0 0 8px"><input type="checkbox" id="trremind" ${L.noTrainRemind ? '' : 'checked'}> <span>Remind me about training at season start</span></label>${ps.map(p => `<div class="check"><span class="grow">${plink(p)} <span class="muted">${posLabel(p)} · ${p.age} · ${ovrTxt(p)}${p.focusLog ? ' · ' + esc(focusLogTxt(p)) : ''}</span></span>${focusSel(p)}</div>`).join('')}</div>`;
}
// v25.3: season-start training check (your team only): players reset by a team change come first
function trainCheckDialog() {
  const t = L.teams[L.user], rs = new Set(L.trainReset || []), ps = teamPlayers(t.id).filter(p => !p.prospect).sort((a, b) => (rs.has(b.id) - rs.has(a.id)) || b.ovr - a.ovr);
  const cur = p => p.focus && p.focus !== 'bal' ? `${esc(FOCUS[p.focus].n)}${p.focusSince ? ' since ' + seasonName(p.focusSince) : ''}` : `Default: ${esc(styleTxt(p))}`;
  const row = p => `<div class="check"><span class="grow">${plink(p)} <span class="muted">${posLabel(p)} · ${p.age} · ${cur(p)}</span>${rs.has(p.id) ? ' <span class="pill pos">New: default</span>' : ''}</span>${focusSel(p)}</div>`;
  dialog(`<h2>Training check</h2><p class="muted" style="margin-top:-4px">Pick each player's training for this season. Growth goes toward the same ceiling; the focus decides where it goes.</p><div style="max-height:55vh;overflow:auto">${ps.map(row).join('')}</div><div class="row" style="margin-top:10px"><button class="primary" id="tc-save">Save</button><button id="tc-keep">Keep all</button></div>`);
  const sel = {}; document.querySelectorAll('#modal select[data-focus]').forEach(el => { el.addEventListener('change', () => { sel[el.dataset.focus] = el.value; }); });
  $('#tc-save').onclick = () => { todoSeen('train'); for (const id in sel) { const p = L.players[+id]; if (p && isUser(p.team)) setFocus(L, p, sel[id]); } L.trainReset = []; closeDialog(); save(); render(); };
  $('#tc-keep').onclick = () => { todoSeen('train'); L.trainReset = []; closeDialog(); save(); render(); };
}
// v24.8: late-game settings (labels shared by the coach page and your lineup panel)
const LATE_LBL = { ft: ['Foul trouble', { sit: 'Sits players early', normal: 'Normal', ride: 'Rides his players' }], foul: ['Fouling when behind late', { never: 'Never', late: 'Last 30 seconds', aggr: 'Last 50 seconds' }], hack: ['Hack-a-player', { false: 'Off', true: 'Fouls bad free-throw shooters' }], to: ['Timeouts', { save: 'Saves them for the end', normal: 'Normal', runs: 'Stops runs early' }] };
const lateText = l => Object.keys(LATE_LBL).map(k => `<span class="k2">${LATE_LBL[k][0]}</span><span>${esc(LATE_LBL[k][1][String(l[k])])}</span>`).join('');
function lateEditor(t) {
  const l = lateOf(L, t), own = !!t.late;
  return `<div class="panel" style="margin-top:12px"><h3>Late-game settings</h3><p class="muted" style="margin:-4px 0 8px;font-size:12px">${own ? 'Your settings' : `Your coach's habits (${esc(t.coach.name)})`}: how foul trouble, fouling when behind, hack-a-player and timeouts are handled.${own ? ' <button class="sm" id="late-reset">Use the coach\'s habits</button>' : ''}</p><div class="kv">${Object.keys(LATE_LBL).map(k => `<span class="k2">${LATE_LBL[k][0]}</span><span><select data-late="${k}">${LATE_OPTS[k].map(v => `<option value="${v}" ${String(l[k]) === String(v) ? 'selected' : ''}>${esc(LATE_LBL[k][1][String(v)])}</option>`).join('')}</select></span>`).join('')}</div></div>`;
}
// v24.7: your call on a day-to-day player
const hurtPlanSel = p => isUser(p.team) && isDTD(p) ? ` <select class="sm" data-hurtplan="${p.id}" title="Day-to-day: who decides if he plays">${[['auto', 'Coach decides'], ['play', 'Play through it'], ['sit', 'Sit him']].map(([v, n]) => `<option value="${v}" ${(p.hurtPlan || 'auto') === v ? 'selected' : ''}>${n}</option>`).join('')}</select>` : '';
const injTip = p => { const r = injReturn(p); return esc(`${p.injName || 'Injury'}${r ? ' · ' + r.txt : ''}`); };
function injPill(p) { return suspPill(p) + (p.holdout && p.holdout.left > 0 ? ` <span class="pill inj" title="Holding out for a new deal">Holdout ${p.holdout.left}</span>` : '') + (p.injury > 0 ? (isDTD(p) ? ` <span class="injx dtd" title="${injTip(p)}" aria-label="Day-to-day">✚</span><span class="pill dtd" title="${injTip(p)}">DTD</span>` : ` <span class="injx" title="${injTip(p)}" aria-label="Injured">✚</span><span class="pill ${p.injLong ? 'long' : 'inj'}" title="${injTip(p)}">Out ${injGames(p)}</span>`) : '') + (p.minCap > 0 ? ` <span class="pill pos" title="Minutes restriction after a long injury">${p.minCap > 3 ? '~20' : '~26'} min</span>` : '') + (p.prone != null && p.prone >= L.season - 1 ? ' <span class="pill inj" title="3+ injuries of 5+ games in two seasons: teams pay a little less">Injury-prone</span>' : ''); }

// ---------- header ----------
const PHASE_TXT = { regular: null, 'regular-done': 'Regular season complete', playoffs: null, 'season-done': 'Year complete', 'off-review': 'Offseason · aging & retirements', 'off-lottery': 'Offseason · draft lottery', 'off-draft': 'Offseason · draft', 'off-resign': 'Offseason · re-signings', 'off-fa': 'Offseason · free agency', 'off-ready': 'Offseason · ready' };
function userPlaysToday() {
  if (!L || L.user == null) return false;
  if (L.phase === 'regular') { const d = L.schedule && L.schedule[L.day]; return !!d && d.some(([h, a]) => isUser(h) || isUser(a)); }
  if (L.phase === 'playoffs' && L.po) return (L.po.rounds[L.po.stage] || []).some(sr => sr.winner == null && (isUser(sr.hi) || isUser(sr.lo)));
  return false;
}
function controls() {
  const ph = L.phase;
  const liveB = userPlaysToday() ? [['live', '▶ Sim day & watch live']] : [];   // v25.2
  if (ph === 'regular') return [['day', 'Sim day'], ...liveB, ['week', 'Sim week'], ...(L.day < deadlineDay(L) ? [['deadline', 'Sim to trade deadline']] : []), ['end', 'Sim to end of season']];
  if (ph === 'regular-done') return [['startpo', 'Start play-in']];
  if (ph === 'playoffs') return [['pday', 'Sim day'], ...liveB, ['pround', 'Sim round'], ['pend', 'Sim to end of playoffs']];
  if (ph === 'season-done') return [['off', 'Start offseason']];
  if (ph === 'off-review') return [['lottery', 'Run draft lottery']];
  if (ph === 'off-lottery') return [['draft', 'Start draft']];
  if (ph === 'off-draft') { const s = L.draftOrder[L.draftIdx]; if (s && isUser(s.owner)) return [['autopick', 'Auto-pick for me']]; return L.user != null ? [['pick1', 'Next pick'], ['tomypick', 'Sim to my pick'], ['draftend', 'Sim draft']] : [['pick1', 'Sim pick'], ['draftend', 'Sim draft']]; }
  if (ph === 'off-resign') return [['fa', 'Open free agency']];
  if (ph === 'off-fa') return [['faday', 'Next free agency day'], ['faend', 'Sim to end of free agency']];
  if (ph === 'off-ready') return [['newseason', `Start ${seasonName(L.season + 1)}`]];
  return [];
}
// ===== v28.7: multi-season autopilot, locker room drama, dynasties & eras =====
const AUTO_NS = [1, 2, 3, 5, 10, 20];
function autoFrac(a) {
  const ph = L.phase, T = Math.max(1, (L.schedule || []).length);
  const f = ph === 'regular' ? 0.72 * L.day / T : ph === 'regular-done' || ph === 'playoffs' ? 0.74 + 0.08 * ((L.po && L.po.stage) || 0) / 5 : ph === 'season-done' ? 0.83 : ph.startsWith('off') ? (ph === 'off-ready' ? 0 : 0.86 + 0.1 * ['off-review', 'off-lottery', 'off-draft', 'off-resign', 'off-fa'].indexOf(ph) / 5) : 0;
  const done = Math.max(0, L.season - a.s0 - (a.endS - a.s0 + 1 > a.n ? 1 : 0));
  return Math.min(1, (done + (ph === 'off-ready' ? 1 : f)) / a.n);
}
function autoWhen(a) { const k = Math.min(a.n, L.season - (a.endS - a.n + 1) + 1); return `Autopilot · season ${Math.max(1, k)} of ${a.n} · ${seasonName(L.season)} · ${L.phase === 'regular' ? 'day ' + (L.day + 1) : L.phase === 'playoffs' ? 'playoffs' : L.phase.startsWith('off') ? 'offseason' : L.phase}${a.fast ? ' · fast' : ''}`; }
function multiDialog() {
  const n0 = ui.autoN || 5, fast0 = ui.autoFast !== false;
  dialog(`<h2>Sim seasons</h2><p class="muted">The AI runs ${L.user != null ? `the ${esc(tname(L.user))} like any other team: trades, re-signings, the draft, free agency, lineups and minutes, locker room issues and press conferences` : 'every team'}. It does not stop for anything. Meant for testing long runs.</p>
  <div class="row" style="flex-wrap:wrap;gap:6px;margin:10px 0">${AUTO_NS.map(n => `<button class="sm ${n === n0 ? 'primary' : ''}" data-autn="${n}">${n} season${n > 1 ? 's' : ''}</button>`).join('')}<label style="font-size:13px">or <input type="number" id="autn" min="1" max="${AUTO_FX.maxSeasons}" value="${n0}" style="width:60px"></label></div>
  <label style="display:block;margin:6px 0"><input type="checkbox" id="autfast" ${fast0 ? 'checked' : ''}> Fast mode <span class="muted">(saves once at the end, keeps the last 60 feed posts, no screen updates)</span></label>
  <p class="muted" style="font-size:12px">${L.phase === 'off-ready' ? 'Starts with the next season.' : 'The current season counts as the first.'} About ${L.sg >= 82 ? '25-45' : '20-30'} seconds a season. You can stop it from the header; it finishes the step it's on and gives the team back.</p>
  <div class="row"><button class="primary" id="aut-go">Start</button><button id="x-close">Cancel</button></div>`);
  $('#x-close').onclick = closeDialog;
  document.querySelectorAll('[data-autn]').forEach(b => b.onclick = () => { $('#autn').value = b.dataset.autn; document.querySelectorAll('[data-autn]').forEach(x => x.classList.toggle('primary', x === b)); });
  $('#aut-go').onclick = () => { const n = Math.max(1, Math.min(AUTO_FX.maxSeasons, +$('#autn').value || 1)), fast = $('#autfast').checked; ui.autoN = n; ui.autoFast = fast; closeDialog(); runAuto(n, fast); };
}
function runAuto(n, fast) {
  if (ui.busy) return;
  ui.undo = []; autoBegin(L, n, fast); ui.auto = true; ui.autoStop = false; ui.busy = true; renderHeader();
  const prog = $('#prog'); let rows = 0, lastPaint = 0;
  function tick() {
    const t0 = performance.now(); let more = true;
    try { while (more && performance.now() - t0 < (fast ? 120 : 60)) more = autoStep(L); } catch (e) { console.error(e); more = false; ui.autoErr = String(e && e.message || e); }
    if (ui.autoStop) more = false;
    const a = L.auto; if (a) { prog.style.width = Math.round(autoFrac(a) * 100) + '%'; if (performance.now() - lastPaint > 400) { lastPaint = performance.now(); $('#when').textContent = autoWhen(a); }
      if (!fast && a.rows.length > rows) { rows = a.rows.length; save(); render(); } }
    if (more) { setTimeout(tick, 0); return; }
    finishAuto();
  }
  setTimeout(tick, 0);
}
function finishAuto() {
  const sum = autoEnd(L); ui.auto = false; ui.busy = false; ui.autoStop = false;
  // popups that belong to seasons the AI already handled
  for (const s in (L.draftGrades || {})) L.draftGrades[s].shown = true;
  for (const k of ['summer', 'revealMine', 'allStar', 'deadlineRecap']) if (L[k]) L[k].shown = true;
  (L.jerseys || []).forEach(j => j.shown = true); L.faInbox = []; ui.faQ = false; ui.recent = [];
  $('#prog').style.width = '0'; save(); render();
  if (sum) runDialog(() => autoSummaryDialog(sum));
}
function autoSummaryDialog(sum) {
  sum = sum || L.autoLast; if (!sum) return;
  const me = sum.user, mins = Math.round(sum.ms / 1000);
  const rows = sum.rows.map(r => me != null
    ? `<tr><td class="l">${seasonName(r.s)}</td><td>${r.w}-${r.l}</td><td class="l">${r.res === 'Champion' ? '<strong>Champion</strong>' : esc(r.res || '')}</td><td class="l">${esc(STATUS_LABEL[r.status] || r.status || '')}</td><td class="l">${r.best ? (L.players[r.best.id] ? plink(L.players[r.best.id]) : esc(r.best.n)) + ' <span class="muted">' + r.best.o + '</span>' : ''}</td><td>${money(r.payroll)}</td><td>${r.trust != null ? r.trust : '—'}</td><td class="l">${r.champ != null ? tlabel(r.champ) : ''}</td></tr>`
    : `<tr><td class="l">${seasonName(r.s)}</td><td class="l">${r.champ != null ? tlabel(r.champ) : ''}</td></tr>`).join('');
  const head = me != null ? '<th class="l">Season</th><th>W-L</th><th class="l">Result</th><th class="l">Status</th><th class="l">Best player</th><th>Payroll</th><th>Owner trust</th><th class="l">Champion</th>' : '<th class="l">Season</th><th class="l">Champion</th>';
  const bySeason = {}; for (const m of sum.moves || []) (bySeason[m.s] = bySeason[m.s] || []).push(m);
  const moves = Object.keys(bySeason).sort((a, b) => b - a).map(s => `<details${s == sum.endS ? ' open' : ''}><summary>${seasonName(+s)} · ${bySeason[s].length} move${bySeason[s].length > 1 ? 's' : ''}</summary>${bySeason[s].slice(0, 40).map(m => `<div class="leader" style="grid-template-columns:minmax(0,1fr)"><span>${linkify(m.text)}</span></div>`).join('')}</details>`).join('');
  const W = dynWatch(L, 3);
  dialog(`<h2>Autopilot finished</h2><p class="muted">${sum.rows.length} season${sum.rows.length !== 1 ? 's' : ''} in ${mins >= 60 ? Math.floor(mins / 60) + ' min ' + (mins % 60) + ' s' : mins + ' s'}${sum.fast ? ' (fast mode)' : ''}.${me != null ? ` The ${esc(tname(me))} are yours again.` : ''}${ui.autoErr ? ` <span class="lo">Stopped on an error: ${esc(ui.autoErr)}</span>` : ''}</p>
  <div class="tblwrap"><table><thead><tr>${head}</tr></thead><tbody>${rows || '<tr><td class="l" colspan="8">No full season finished.</td></tr>'}</tbody></table></div>
  ${W.length ? `<p style="margin-top:8px"><strong>Dynasty watch:</strong> ${W.map(w => `${tlabel(w.tid)} <span class="muted">${esc(w.label)}</span>`).join(' · ')}</p>` : ''}
  ${me != null ? `<h3 style="margin-top:10px">What the AI did for your team</h3>${moves || '<p class="muted">No roster moves.</p>'}` : ''}
  <div class="row" style="margin-top:12px"><button class="primary" id="x-close">Close</button><button id="aut-dyn">Dynasties & eras</button></div>`, 'wide');
  ui.autoErr = null;
  $('#x-close').onclick = closeDialog; $('#aut-dyn').onclick = () => { closeDialog(); ui.histTab = 'dyn'; location.hash = '#history'; render(); };
}
// --- locker room ---
function dramaDialog() {
  const ev = dramaOpen(L); if (!ev) { closeDialog(); return; }
  const t = L.teams[ev.tid], ps = ev.pids.map(id => L.players[id]).filter(Boolean), lr = lrOf(t);
  dialog(`<h2>Locker room issue</h2><p class="muted">Locker room: <strong>${lrLabel(lr.v)}</strong> (${lr.v}/100)</p><div class="panel" style="margin:8px 0"><strong>${linkify(ev.text)}</strong>${ev.k === 'conduct' && ev.what && !String(ev.text).includes(ev.what) ? `<div class="muted" style="margin-top:4px">What happened: he ${esc(ev.what)}.</div>` : ''}${ps.length ? `<div class="muted" style="margin-top:6px">${ps.map(p => `${plink(p)} · morale ${p.morale} · coachability ${trRead(L, L.user, p, 'cch').txt || '?'}`).join('<br>')}</div>` : ''}</div>
  <div class="stack" style="gap:6px">${drChoicesFor(ev).map(k => [k, DR_CHOICES[k]]).map(([k, n]) => `<button class="drc" data-drc="${k}" title="${esc(DR_HINT[k])}"><strong>${esc(n)}${k === 'suspend' ? ` · ${drSuspGames(ev)} game${drSuspGames(ev) > 1 ? 's' : ''}` : ''}</strong><br><span class="muted" style="font-size:12px">${esc(DR_HINT[k])}</span></button>`).join('')}</div>
  <p class="muted" style="font-size:12px;margin-top:8px">Unanswered after a week, it settles itself ("let them sort it out"). <label><input type="checkbox" id="dr-nopause" ${L.pauseDrama === false ? 'checked' : ''}> Don't stop the sim for locker room issues</label></p><div class="row"><button id="x-close">Decide later</button></div>`);
  $('#x-close').onclick = closeDialog;
  $('#dr-nopause').onchange = e => { L.pauseDrama = e.target.checked ? false : true; save(); };
  document.querySelectorAll('[data-drc]').forEach(b => b.onclick = () => {
    const r = answerDrama(L, b.dataset.drc); if (!r) { closeDialog(); return; } save(); render();
    const fx = r.fx, nm = id => L.players[id] ? esc(L.players[id].name) : '', sg = v => `<span class="${v > 0 ? 'w' : v < 0 ? 'lo' : ''}">${v > 0 ? '+' : ''}${v}</span>`;
    const lines = [`Locker room ${sg(fx.h)} → ${lrLabel(lrOf(t).v)} (${lrOf(t).v})`, ...(fx.m || []).map((d, i) => d ? `${nm(ev.pids[i])} morale ${sg(d)}` : '').filter(Boolean), fx.others ? `Rest of the rotation morale ${sg(fx.others)}` : '', fx.rep ? `Media reputation ${sg(fx.rep)}` : '', fx.trust ? `Owner trust ${sg(fx.trust)}` : '', r.ev.fine ? `Fined ${fineStr(r.ev.fine)} (goes to the team's cash)` : '', r.ev.sg ? `Suspended ${r.ev.sg} game${r.ev.sg > 1 ? 's' : ''} without pay` : ''].filter(Boolean);
    dialog(`<h2>Locker room issue</h2><p>${esc(DR_CHOICES[r.ev.choice])}.</p>${lines.map(x => `<div class="leader" style="grid-template-columns:minmax(0,1fr)"><span>${x}</span></div>`).join('')}<div class="row" style="margin-top:10px"><button class="primary" id="x-close">Done</button></div>`);
    $('#x-close').onclick = closeDialog;
  });
}
function lockerPanel(t, mine) {
  const lr = lrOf(t), evs = dramaList(L, t.id, 6), feuds = rosterOf(L, t).filter(p => p.feud && p.feud.s === L.season && L.day <= p.feud.until && L.players[p.feud.w] && L.players[p.feud.w].team === t.id && p.id < p.feud.w);
  const pct = lr.v, col = pct >= 60 ? 'var(--good, #2e7d32)' : pct >= 45 ? 'var(--accent)' : 'var(--bad, #c62828)';
  const open = mine ? dramaOpen(L) : null;
  return `<div class="panel" style="margin-bottom:16px"><h3>Locker room · ${lrLabel(lr.v)}</h3><div class="lrbar" title="Harmony ${lr.v}/100"><span style="width:${pct}%;background:${col}"></span></div>
  ${open ? `<div class="msg no" style="margin-top:8px">${esc(open.text)} <button class="sm primary" data-sim-drama="1">Decide</button></div>` : ''}
  ${feuds.length ? `<p style="margin:8px 0 0"><strong>Feuds:</strong> ${feuds.map(p => `${plink(p)} vs ${plink(L.players[p.feud.w])}`).join(' · ')}</p>` : ''}
  ${evs.length ? evs.map(e => `<div class="leader" style="grid-template-columns:minmax(0,1fr) auto"><span>${e.pos ? '<span class="pill pos">Positive</span> ' : ''}${linkify(e.text)}${e.choice && e.choice !== 'ignore' ? ` <span class="muted">· ${esc(DR_CHOICES[e.choice])}${e.fine ? ', fined ' + fineStr(e.fine) : ''}${e.sg ? ', ' + e.sg + ' game' + (e.sg > 1 ? 's' : '') : ''}</span>` : ''}</span><span class="muted">${typeof dayTxt === 'function' ? dayTxt(e.day, e.s) : 'Day ' + (e.day + 1)}</span></div>`).join('') : '<p class="muted" style="margin:8px 0 0">Quiet so far this season.</p>'}
  <p class="muted" style="font-size:12px;margin:6px 0 0">Harmony moves morale a little (−4 to +3); losing streaks, unhappy regulars, egos and veterans losing minutes cause incidents.</p></div>`;
}
document.addEventListener('click', e => { const b = e.target.closest('[data-sim-drama]'); if (b) runDialog(dramaDialog); });
// --- v28.8 locker room 2: suspensions, discipline, interviews, one-on-ones, promises ---
const SIM_TIP = { iv: 'Answer the interview. Unanswered for 7 days it expires (media reputation -2).', mtg: 'A player asked for a meeting. Unanswered for 7 days: his morale -3 and trust in you -5.', drama: 'Unanswered after a week, it settles itself.' };
const suspTip = p => `Suspended ${p.susp.g} more game${p.susp.g > 1 ? 's' : ''} by the ${p.susp.k === 'team' ? 'team' : 'league'} (${p.susp.why}), without pay`;
const suspPill = p => isSusp(p) ? ` <span class="pill susp" title="${esc(suspTip(p))}">SUSP ${suspGames(p)}</span>` : '';
const fxSgn = v => `<span class="${v > 0 ? 'w' : v < 0 ? 'lo' : ''}">${v > 0 ? '+' : ''}${v}</span>`;
function suspReport() {
  const list = Object.values(L.players).filter(p => !p.retired && p.team != null && isSusp(p)).sort((a, b) => b.ovr - a.ovr);
  return `<section class="panel" style="margin-top:16px"><h2>Suspended players</h2><p class="muted" style="margin-top:-4px">Suspensions are unpaid. A suspended player sits like an injured one and each game served counts one off.</p>${list.length ? `<div class="tblwrap"><table><thead><tr><th class="l">Player</th><th class="l">Team</th><th>Ovr</th><th>Games left</th><th class="l">By</th><th class="l">Reason</th><th>Pay lost</th></tr></thead><tbody>${list.map(p => `<tr class="click ${isUser(p.team) ? 'mine' : ''}" data-player="${p.id}"><td class="l">${esc(p.name)}${suspPill(p)}</td><td class="l">${tlabel(p.team)}</td><td>${ovrTxt(p)}</td><td>${p.susp.g}</td><td class="l">${p.susp.k === 'team' ? 'Team' : 'League'}</td><td class="l">${esc(p.susp.why || '')}</td><td>${fineStr(p.susp.lost || 0)}</td></tr>`).join('')}</tbody></table></div>` : '<p class="muted">Nobody is suspended.</p>'}</section>`;
}
function suspendDialog(pid) {
  const p = L.players[pid]; if (!p) return;
  dialog(`<h2>Suspend ${esc(p.name)}</h2><p class="muted">Unpaid, 1 to 5 games. He sits like an injured player. Big morale hit for him; the room respects it unless he is your star.</p>
  <label class="k">Games<br><select id="sp-g" aria-label="Games">${[1, 2, 3, 4, 5].map(n => `<option value="${n}" ${n === 2 ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
  <label class="k" style="display:block;margin-top:8px">Reason<br><input id="sp-why" maxlength="80" style="width:100%;box-sizing:border-box" value="conduct detrimental to the team" aria-label="Reason"></label>
  <div id="sp-msg" class="msg no" hidden></div>
  <div class="row" style="margin-top:10px"><button class="primary" id="sp-go">Suspend</button><button id="x-close">Cancel</button></div>`);
  $('#x-close').onclick = closeDialog;
  $('#sp-go').onclick = () => {
    const r = suspendPlayer(L, pid, +$('#sp-g').value, $('#sp-why').value.trim());
    if (!r.ok) { const m = $('#sp-msg'); m.textContent = r.msg; m.hidden = false; return; }
    save(); closeDialog(); render();
  };
}
function ivFxHtml(fx) {
  fx = fx || {}; const o = [];
  if (fx.h) o.push(`Locker room harmony ${fxSgn(fx.h)}`);
  if (fx.hype) o.push(`Fan hype ${fxSgn(fx.hype)}`);
  if (fx.trust) o.push(`Owner trust ${fxSgn(fx.trust)}`);
  if (fx.rep) o.push(`Media reputation ${fxSgn(fx.rep)}`);
  if (fx.sm) o.push(`His morale ${fxSgn(fx.sm)}`);
  if (fx.all) o.push(`Rest of the rotation morale ${fxSgn(fx.all)}`);
  if (fx.coach) o.push('The coach hears about it');
  if (fx.claim) o.push(`On the record: you called ${{ title: 'a title', playoffs: 'a playoff spot', series: 'a series win' }[fx.claim]}. It is checked at season's end.`);
  if (fx.promise === 'stay') o.push('You promised he will not be traded this season');
  return o.length ? o.map(x => `<div class="leader" style="grid-template-columns:minmax(0,1fr)"><span>${x}</span></div>`).join('') : '<p class="muted">No change.</p>';
}
function ivDialog() {
  const I = L.iv; if (!I) { closeDialog(); return; }
  const shown = ui.ivShow && ui.ivShow.id === I.id ? ui.ivShow.qi : null;
  if (!ivOpen(L) && shown == null) { closeDialog(); return; }
  const qi = shown != null ? shown : I.qs.findIndex(q => q.ans == null); if (qi < 0) { ui.ivShow = null; closeDialog(); return; }
  const q = I.qs[qi], answered = q.ans != null, out = IV_OUTLETS.find(o => o.k === I.outlet) || IV_OUTLETS[0];
  const intro = fl('iv.intro.' + I.stage, { host: out.host, outlet: out.name }, I.id);
  dialog(`<h2>Media interview</h2><p class="muted" id="iv-meta">${esc(out.name)} · <strong>${esc(IV_PERIOD[I.stage] || I.stage)}</strong> · question ${qi + 1} of ${I.qs.length} · media reputation ${mediaRep(L)}</p>${I.stage === 'draft' ? '<p class="muted" id="iv-draftnote" style="margin:0 0 6px">Draft week: every question is about the draft.</p>' : ''}<p>${esc(intro)}</p><div class="panel" style="margin:8px 0"><strong>${esc(ivText(L, q))}</strong></div>${answered
    ? `<div class="rx-q" style="margin:8px 0">You: “${esc(ivAnswers(L, q)[q.ans])}”</div>${ivFxHtml(q.fx)}<div class="row" style="margin-top:10px"><button class="primary" id="iv-next">${I.qs.every(x => x.ans != null) ? 'Done' : 'Next question'}</button></div>`
    : `<div class="stack" style="gap:6px">${ivAnswers(L, q).map((a, i) => `<button class="drc" data-iva="${i}">${esc(a)}</button>`).join('')}</div><p class="muted" style="font-size:12px;margin-top:8px">No question repeats in a season (${ivPoolLeft(L, I.stage).length} left in this period's pool). ${I.stage === 'draft' ? 'Unanswered, the interview expires when the draft phase ends (media reputation -2).' : 'Unanswered for 7 days the interview expires (media reputation -2).'} <label><input type="checkbox" id="iv-nopause" ${L.pauseIv === false ? 'checked' : ''}> Don't stop the sim for interviews</label></p><div class="row"><button id="x-close">Later</button></div>`}`);
  const xc = $('#x-close'); if (xc) xc.onclick = closeDialog;
  const np = $('#iv-nopause'); if (np) np.onchange = e => { L.pauseIv = e.target.checked ? false : true; save(); };
  document.querySelectorAll('[data-iva]').forEach(b => b.onclick = () => {
    const r = ivAnswer(L, qi, +b.dataset.iva); if (!r) { closeDialog(); render(); return; }
    ui.ivShow = { id: I.id, qi }; save(); render(); ivDialog();
  });
  const nx = $('#iv-next'); if (nx) nx.onclick = () => { ui.ivShow = null; closeDialog(); render(); if (ivOpen(L)) runDialog(ivDialog); };
}
const MTG_WHY = { tradeReq: 'asked for a trade and wants to talk it out.', feud: 'is feuding with a teammate and wants to talk.', unhappy: 'is unhappy with how things are going and wants to talk.', rising: 'is coming on fast and wants to know where he stands.', checkin: 'is here for a check-in.' };
function mtgDialog() {
  const M = L.mtg; if (!M) { closeDialog(); return; }
  const showDone = ui.mtgShow === M.id, p = L.players[M.pid];
  if (!p || (!mtgOpen(L) && !showDone)) { closeDialog(); return; }
  if (showDone && M.st === 'done' && M.choice) {
    const fx = M.fx || {}, k = MTG_OPTS[M.choice].promise, pr = k ? promiseList(L, L.user).find(x => x.pid === p.id && x.k === k) : null;
    const lines = [pr ? `You promised ${plink(p)}: ${esc(promiseLabel(pr))}. Kept or broken, you will see it in the promises panel.` : '', fx.m ? `${esc(p.name)} morale ${fxSgn(fx.m)} (now ${p.morale})` : '', fx.trust ? `Trust in you ${fxSgn(fx.trust)} (now ${gmTrustOf(p)})` : '', fx.h ? `Locker room harmony ${fxSgn(fx.h)}` : ''].filter(Boolean);
    dialog(`<h2>One-on-one</h2><p>${esc(MTG_OPTS[M.choice].lbl)}.</p>${lines.map(x => `<div class="leader" style="grid-template-columns:minmax(0,1fr)"><span>${x}</span></div>`).join('')}<div class="row" style="margin-top:10px"><button class="primary" id="x-close">Done</button></div>`);
    $('#x-close').onclick = () => { ui.mtgShow = null; closeDialog(); render(); };
    return;
  }
  const opts = mtgOptions(L);
  dialog(`<h2>One-on-one</h2><div class="panel" style="margin:8px 0"><strong>${M.by === 'player' ? `${plink(p)} ${MTG_WHY[M.why]}` : `You sit down with ${plink(p)}.`}</strong><div class="muted" style="margin-top:6px">Morale ${p.morale != null ? p.morale : '—'} · trust in you ${gmTrustOf(p)}/100 · coachability ${trRead(L, L.user, p, 'cch').txt || '?'}</div></div>
  <div class="stack" style="gap:6px">${opts.map(o => `<button class="drc" data-mtg="${o.k}"><strong>${esc(o.lbl)}${o.v ? ` (${o.v} min)` : ''}</strong>${MTG_OPTS[o.k].promise ? '<br><span class="muted" style="font-size:12px">A promise is tracked: keep it and morale and trust rise, break it and they drop hard.</span>' : ''}</button>`).join('')}</div>
  <p class="muted" style="font-size:12px;margin-top:8px">${M.by === 'player' ? 'If you do not meet him within 7 days: his morale -3 and trust in you -5.' : 'You can meet each player about every 2 weeks.'}</p><div class="row"><button id="x-close">Later</button></div>`);
  $('#x-close').onclick = closeDialog;
  document.querySelectorAll('[data-mtg]').forEach(b => b.onclick = () => {
    const r = mtgAnswer(L, b.dataset.mtg); if (!r) { closeDialog(); render(); return; }
    ui.mtgShow = M.id; save(); render(); mtgDialog();
  });
}
// ---------- v30c UI: Roster moves overview (#1), Negotiate popup (#2), move write-ups (#5), Promises tabs (#19), Hall of Fame ceremony (#21) ----------
const wuHtml = wu => (wu || []).length ? `<div class="wu">${wu.map(w => `<div class="wul">${esc(w.text)}</div>`).join('')}</div>` : '';
const MV_KIND = { trade: 'Trade', sign: 'Signing', resign: 'Re-signed', release: 'Release' };
const plinkId = (id, nm) => L.players[id] ? plink(L.players[id]) : esc(nm || 'Former player');
function mvDesc(e) {
  if (e.kind === 'trade') return e.tids.map((t, i) => `${tlink(t)} get ${esc(e.gets && e.gets[i] != null ? e.gets[i] : '')}`).join('<br>');
  const t = tlink(e.tids[0]);
  if (e.kind === 'release') return `${t} released ${plinkId(e.pid, e.name)}`;
  return `${t} ${e.kind === 'resign' ? 're-signed' : 'signed'} ${plinkId(e.pid, e.name)} <span class="muted">${e.yrs} yr, ${money(e.amt)}/yr</span>`;
}
function mvTable(list) {
  if (!list.length) return '<p class="muted">Nothing yet. Trades, signings and releases show here with the reason each team gave.</p>';
  return `<div class="tblwrap"><table class="mvtbl"><thead><tr><th class="l">When</th><th class="l">Type</th><th class="l">Move</th><th class="l">Why</th></tr></thead><tbody>${list.map(e => `<tr data-mv="${e.n}"><td class="l nw">${esc(postWhen(e))}</td><td class="l"><span class="pill mvk-${e.kind}">${MV_KIND[e.kind]}</span></td><td class="l wrap">${mvDesc(e)}</td><td class="l wrap">${wuHtml(e.wu) || '<span class="muted">—</span>'}</td></tr>`).join('')}</tbody></table></div>`;
}
const RM_F = [['', 'All'], ['trade', 'Trades'], ['sign', 'Signings'], ['release', 'Releases']];
const rmKindOK = (e, f) => !f || (f === 'sign' ? e.kind === 'sign' || e.kind === 'resign' : e.kind === f);
function vRMoves() {
  if (L.user == null) ui.rmTab = 'league'; else if (ui.rmTab !== 'league') ui.rmTab = 'mine';
  if (!RM_F.some(x => x[0] === ui.rmF)) ui.rmF = '';
  const sub = `<div class="subtabs" id="rmtabs" style="margin-bottom:12px">${(L.user != null ? [['mine', 'My team']] : []).concat([['league', 'League']]).map(([k, n]) => `<button class="sm ${ui.rmTab === k ? 'primary' : ''}" data-rmtab="${k}">${n}</button>`).join('')}</div>`;
  const all = L.mv || [], mine = ui.rmTab === 'mine', base = mine ? all.filter(e => e.tids.includes(L.user)) : all;
  const cnt = k => base.filter(e => rmKindOK(e, k)).length;
  const bar = `<div class="row" id="rmfbar" style="margin-bottom:10px">${RM_F.map(([k, n]) => `<button class="sm chipbtn ${ui.rmF === k ? 'primary' : ''}" data-rmf="${k}">${n} (${cnt(k)})</button>`).join('')}</div>`;
  const list = base.filter(e => rmKindOK(e, ui.rmF)).slice(0, 60);
  let head = '';
  if (mine) {
    const t = L.teams[L.user], pay = payroll(L, t), room = faRoom(L, t), tw = (t.twoWay || []).length;
    head = `<section class="panel" id="rmsum" style="margin-bottom:12px"><h2>${tlabel(t.id, true)} · roster moves</h2><div class="rmstats"><div><div class="k">Roster</div><div class="v">${t.roster.length}/15</div></div><div><div class="k">Payroll</div><div class="v">${money(pay)}</div></div><div><div class="k">Cap room</div><div class="v">${money(Math.max(0, CAP - pay))}</div></div><div><div class="k">Can offer a free agent</div><div class="v">${room > 0 ? money(room) : 'Minimum only'}</div></div><div><div class="k">Mid-level</div><div class="v">${mleOpen(L, t) ? money(MLE) + ' left' : 'Used'}</div></div><div><div class="k">Two-way</div><div class="v">${tw}</div></div></div><p style="margin:8px 0 0"><a class="lk" href="#trades">Trades</a> · <a class="lk" href="#fa">Free agents</a> · <a class="lk" href="#draft">Draft</a></p></section>`;
  }
  return `<h2>Roster moves</h2>${sub}${head}<section class="panel"><h3>${mine ? 'Your team\'s moves' : 'League moves'}</h3>${bar}${mvTable(list)}<p class="muted" style="font-size:12px;margin:8px 0 0">Coach fit is the average fit of the top 8 players with the head coach's systems. Team overall is roster strength (best 8 by overall). Trades show both; signings and releases show coach fit.</p></section>`;
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-rmtab],[data-rmf]'); if (!b || !L || !$('#main').contains(b)) return;
  if (b.dataset.rmtab) ui.rmTab = b.dataset.rmtab; else ui.rmF = b.dataset.rmf; render();
});
// ----- #2 Negotiate popup -----
function negoSig(p) { const resign = L.phase === 'off-resign' && (L.resign || []).includes(p.id), ext = isUser(p.team) && canExtend(L, p); return { ext, resign, type: ext ? 'extension' : resign ? 're-sign' : 'signing' }; }
function negoBar(p) {
  const t = L.teams[L.user], s = negoSig(p), cc = signConcerns(L, p, t, s.type);
  if (p.ask == null) setAsk(L, p);
  const lab = s.ext ? 'Extension (starts next season)' : s.resign ? 'Re-sign' : 'Free agent';
  if (cc.refuse) return `<section class="panel" id="negbar" style="margin-bottom:16px"><h3>${lab}</h3><div class="msg no"><strong>Not interested.</strong> ${esc(cc.refuse)}</div></section>`;
  return `<section class="panel" id="negbar" style="margin-bottom:16px"><div class="row" style="align-items:center;gap:10px"><button class="primary" data-nego="${p.id}">Negotiate</button><span class="muted">${lab} · asking about ${money(p.ask || MINSAL)} · ${esc(t.abbr)} payroll ${money(s.ext ? payroll(L, t, L.season + 1) : payroll(L, t))} of ${money(CAP)}</span></div></section>`;
}
// cap numbers for the offer in the popup (they follow the amount and years in the form)
function negoCapBox(p) {
  const t = L.teams[L.user], s = negoSig(p), nl = ui.negLast && ui.negLast.pid === p.id ? ui.negLast : null;
  const amt = nl && isFinite(nl.amt) ? Math.max(nl.amt, MINSAL) : (p.ask || MINSAL), yrs = nl ? nl.yrs : p.prefY;
  const now = s.ext ? payroll(L, t, L.season + 1) : payroll(L, t), hit = contractHit(amt, false), after = now + hit;
  const room = (line, nm) => { const d = line - after; return `<div><div class="k">${nm}</div><div class="v ${d < -1e-6 ? 'neg' : ''}">${d < -1e-6 ? 'Over by ' + money(-d) : money(d) + ' left'}</div><div class="muted" style="font-size:11px">line ${money(line)}</div></div>`; };
  let verdict, vc = 'ok';
  if (hit === 0) verdict = 'Minimum deal: always fits.';
  else if (after > APRON + 1e-6 || (!s.ext && !canFit(L, t, amt, false, s.type))) { verdict = `Over the ${money(APRON)} hard cap: this offer is not allowed.`; vc = 'no'; }
  else if (after <= CAP + 1e-6) verdict = 'Fits under the cap.';
  else if (after <= TAXLINE + 1e-6) verdict = 'Over the cap, under the tax line.';
  else { let tx = 0; try { tx = taxCostOf(L, t, now, hit); } catch (e) { } verdict = `Over the tax line: about ${money(tx)} more in luxury tax.`; vc = 'warn'; }
  let mleBox = '';
  if (s.type === 'signing') {
    const ms = mleStatus(L, t, now, hit), n = ui.neg[p.id] || {}, use = ms.eligible && n.mle !== false;
    const warn = [];
    if (typeof MLE_REAL !== 'undefined' && MLE_REAL && hit > 0 && after > CAP + 1e-6) { if (!ms.eligible) warn.push(`Over the cap a free agent above the minimum needs the mid-level${ms.open ? '' : ` (${ms.why})`}. Only a minimum deal fits.`); else if (!use) warn.push(`Over the cap this offer needs the mid-level: tick "Use mid-level" or offer the minimum.`); }   // v32g
    if (use || (ms.open && hit > 0)) { if (after > APRON + 1e-6) warn.push(`This deal puts payroll at ${money(after)}, over the ${money(APRON)} hard cap: not allowed.`); else if (after > TAXLINE + 1e-6) { let tx = 0; try { tx = taxCostOf(L, t, now, hit); } catch (e) { } warn.push(`Payroll after ${money(after)} crosses the ${money(TAXLINE)} tax line: about ${money(tx)} in luxury tax.`); } }
    mleBox = `<div class="mlebox" id="mlebox" style="margin-top:8px;font-size:13px"><div class="row" style="align-items:center;gap:10px;flex-wrap:wrap"><label class="check" style="margin:0" title="Spend your once-a-season mid-level exception on this deal. Up to ${money(MLE)}, only while payroll is under the tax line before the deal."><input type="checkbox" id="neg-mle" data-negf="1" ${use ? 'checked' : ''} ${ms.eligible ? '' : 'disabled'}> Use mid-level</label><span><strong>Mid-level exception:</strong> ${ms.open ? `${money(ms.left)} left · not used yet this season` : `${money(0)} left · used this season`}</span></div>${!ms.eligible && ms.open && hit > 0 ? `<div class="muted" style="font-size:12px">Can't use it on this offer: ${esc(ms.why)}.</div>` : ''}${warn.map(w => `<div class="${after > APRON + 1e-6 ? 'lo' : 'warn'}" style="font-size:12px">${esc(w)}</div>`).join('')}</div>`;
  }
  return `<div class="capbox" id="negdlg"><div class="capgrid"><div><div class="k">${esc(t.abbr)} payroll${s.ext ? ' next season' : ''}</div><div class="v">${money(now)}</div></div><div><div class="k">This offer</div><div class="v">${money(amt)} × ${yrs || '?'} yr</div><div class="muted" style="font-size:11px">cap hit ${money(hit)}</div></div><div><div class="k">Payroll after</div><div class="v">${money(after)}</div></div>${room(CAP, 'Cap')}${room(TAXLINE, 'Tax line')}${room(APRON, 'Hard cap')}</div><div class="capv ${vc}">${esc(verdict)}</div>${mleBox}</div>`;
}
function negoDlg(pid) {
  const p = L.players[pid]; if (!p || L.user == null) { ui.negOpen = null; closeDialog(); return; }
  ui.negOpen = pid;
  const panel = negotiatePanel(p);   // sets ui.negLast
  dialog(`<h2>Negotiate · ${esc(p.name)}</h2><p class="muted" style="margin:0 0 8px">${posLabel(p)} · age ${p.age} · overall ${p.ovr}</p>${negoCapBox(p)}${panel}<div class="row" style="margin-top:8px"><button id="x-close">Close</button></div>`, 'wide');
  $('#x-close').onclick = () => { ui.negOpen = null; closeDialog(); };
  document.querySelectorAll('#modal [data-negf]').forEach(el => el.addEventListener('change', () => { ui.neg[pid] = Object.assign(readNeg(pid), { msg: '', ok: false }); negoDlg(pid); }));
}
document.addEventListener('click', e => { const b = e.target.closest('[data-nego]'); if (!b || !L) return; negoDlg(+b.dataset.nego); });
// after any render, an open Negotiate popup follows the new state (cap numbers, answer message)
function negoAfterRender() { if (ui.negOpen == null) return; if (document.getElementById('negdlg')) negoDlg(ui.negOpen); else ui.negOpen = null; }
// ----- #19 Promises: Current / Former players -----
function promisesPanel(t) {
  const all = promiseList(L, t.id), PL = { open: ['Open', ''], kept: ['Kept', 'pos'], broken: ['Broken', 'long'], void: ['Void', ''] };
  const cur = pr => { const p = L.players[pr.pid]; return !!p && p.team === t.id && !p.retired; };
  const nCur = all.filter(cur).length, nOld = all.length - nCur, tab = ui.prmTab === 'old' ? 'old' : 'cur', list = all.filter(pr => cur(pr) === (tab === 'cur')).slice(0, 40);
  const due = pr => pr.due.g != null ? `team game ${pr.due.g} (${t.w + t.l} played)` : pr.due.day != null ? `trade deadline (${dayTxt(pr.due.day, pr.due.s)})` : `before his deal ends (${seasonName(pr.due.s)})`;
  const where = pr => { const p = L.players[pr.pid]; return !p ? '—' : p.retired ? 'Retired' : p.team != null ? tlabel(p.team) : p.tw ? 'Two-way' : 'Free agent'; };
  const tabs = `<div class="subtabs" id="prmtabs" style="margin-bottom:8px"><button class="sm ${tab === 'cur' ? 'primary' : ''}" data-prmtab="cur">Current players (${nCur})</button><button class="sm ${tab === 'old' ? 'primary' : ''}" data-prmtab="old">Former players (${nOld})</button></div>`;
  const rows = list.map(pr => { const p = L.players[pr.pid]; return `<tr><td class="l">${p ? plink(p) : 'Former player'}</td><td class="l">${esc(promiseLabel(pr))}</td><td class="l">${esc(dayTxt(pr.day, pr.s))}</td><td class="l">${esc(due(pr))}</td>${tab === 'old' ? `<td class="l">${where(pr)}</td>` : ''}<td><span class="pill ${PL[pr.st][1]}">${PL[pr.st][0]}</span></td></tr>`; }).join('');
  return `<div class="panel" style="margin-bottom:16px" id="promisespanel"><h3>Promises</h3>${tabs}${list.length ? `<div class="tblwrap"><table id="promtbl"><thead><tr><th class="l">Player</th><th class="l">Promise</th><th class="l">Made</th><th class="l">Due</th>${tab === 'old' ? '<th class="l">Now</th>' : ''}<th>Status</th></tr></thead><tbody>${rows}</tbody></table></div>` : `<p class="muted">${tab === 'cur' ? 'No promises to current players. Meet a player from his page to make one.' : 'No promises to former players.'}</p>`}<p class="muted" style="font-size:12px;margin:6px 0 0">Kept: morale +5, trust in you +10, harmony +1. Broken: morale -12, trust -20, harmony -3, media reputation -1. Promises are judged weekly and at season's end.</p></div>`;
}
document.addEventListener('click', e => { const b = e.target.closest('[data-prmtab]'); if (!b || !L || !$('#main').contains(b)) return; ui.prmTab = b.dataset.prmtab; render(); });
// ----- #21 Hall of Fame ceremony: one page per class, one speech per inductee -----
function hofCareer(p) {
  let f = null; try { f = hofSpeechFacts(L, p); } catch (e) { }
  const n = k => (p.awards || []).filter(a => a.a === k).length, bits = [];
  if (f && f.seasons) bits.push(f.seasons + ' seasons');
  if (f && f.titles) bits.push(f.titles + ' title' + (f.titles > 1 ? 's' : ''));
  if (n('MVP')) bits.push(n('MVP') + ' MVP' + (n('MVP') > 1 ? 's' : ''));
  if (n('Finals MVP')) bits.push(n('Finals MVP') + ' Finals MVP');
  if (n('All-Star')) bits.push(n('All-Star') + ' All-Star' + (n('All-Star') > 1 ? 's' : ''));
  return bits.join(' · ');
}
// v37b: the full Hall of Fame: members from the history list (hxHofAll) and this league's inductees (L.hof) in one list; filters by
// class, team and category; the chosen class (newest by default) on top with its ceremony cards (speeches for this league's inductees)
const HOF_AB = { PHO: 'PHX', NJN: 'BKN', SEA: 'OKC', STL: 'ATL' };
function hofMembers() {
  const out = [], abT = {}; for (const t of L.teams) abT[typeof nbaAbOf === 'function' ? nbaAbOf(t) : t.abbr] = t.id;
  const byName = {}; for (const p of Object.values(L.players)) byName[p.name] = byName[p.name] || p;
  const legs = new Set(typeof nbaLegends === 'function' && L.nba ? nbaLegends().map(l => l.name) : []);
  if (typeof hxOn === 'function' && hxOn(L)) for (const r of NBA_HX.hof) {
    const abs = (r[3] || '').split(/,\s*/).filter(Boolean), tids = abs.map(a => abT[HOF_AB[a] || a]).filter(x => x != null);
    const p = r[2] === 'Player' && byName[r[0]] && byName[r[0]].real ? byName[r[0]] : null;
    out.push({ name: r[0], y: r[1], cat: r[2], tids, teams: abs.map(a => a.replace(/-.*/, '')).join(', '), p, leg: !p && legs.has(r[0]) });
  }
  for (const h of L.hof || []) out.push({ name: h.name, y: draftLabel(h.s), s: h.s, cat: 'Player', tids: (h.teams || []).filter(id => L.teams[id]), teams: (h.teams || []).filter(id => L.teams[id]).map(id => L.teams[id].abbr).join(', '), p: L.players[h.pid] || null, h });
  return out.sort((a, b) => b.y - a.y || a.name.localeCompare(b.name));
}
function hofNameCell(m) { return m.p ? plink(m.p) : m.leg ? `<a class="lk" data-legend="${esc(m.name)}">${esc(m.name)}</a>` : esc(m.name); }
function vHofCeremony() {
  const all = hofMembers();
  if (!all.length) return `<h2>Hall of Fame</h2><section class="panel"><p class="muted">No inductees yet. Players are considered when they retire, based on their production, awards and titles. Each class gets a ceremony here, with a speech from every inductee.</p></section>`;
  const F = ui.hofF = ui.hofF || {}, yrs = [...new Set(all.map(m => m.y))].sort((a, b) => b - a), cats = [...new Set(all.map(m => m.cat))];
  if (F.y != null && !yrs.includes(F.y)) F.y = null; if (F.c && !cats.includes(F.c)) F.c = ''; if (F.t != null && !L.teams[F.t]) F.t = null;
  const cy = F.y != null ? F.y : yrs[0], cls = all.filter(m => m.y === cy);
  const card = m => { const p = m.p; let sp = ''; if (m.h && p) try { sp = hofSpeech(L, p); } catch (e) { }
    return `<section class="panel hofcard"${m.h ? ` data-hofp="${m.h.pid}"` : ''}><div class="bio" style="align-items:center">${p ? portrait('p', p.id, p.nat, p.team) : ''}<div style="min-width:0"><h3 style="margin:0">${hofNameCell(m)}</h3><div class="muted">${esc(m.cat)}${m.teams ? ' · ' + esc(m.teams) : ''}${p ? ' · ' + posLabel(p) : ''}</div>${p && m.h ? `<div style="font-size:13px">${esc(hofCareer(p))}</div>` : ''}</div></div>${sp ? `<blockquote class="hofspeech">${esc(sp)}</blockquote>` : ''}</section>`; };
  const chips = yrs.slice(0, 8).map(y => `<button class="sm chipbtn ${y === cy ? 'primary' : ''}" data-hofyr="${y}">${y} (${all.filter(m => m.y === y).length})</button>`).join('');
  const list = all.filter(m => (F.y == null || m.y === F.y) && (F.t == null || m.tids.includes(F.t)) && (!F.c || m.cat === F.c));
  const filters = `<div class="filters"><select id="hof-y"><option value="">Every class</option>${yrs.map(y => `<option value="${y}" ${y === F.y ? 'selected' : ''}>Class of ${y}</option>`).join('')}</select><select id="hof-t"><option value="">Every team</option>${L.teams.map(t => `<option value="${t.id}" ${t.id === F.t ? 'selected' : ''}>${esc(t.city + ' ' + t.name)}</option>`).join('')}</select><select id="hof-c"><option value="">Every category</option>${cats.map(c => `<option ${c === F.c ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select></div>`;
  const tbl = list.length ? `<div class="tblwrap"><table><thead><tr><th>Class</th><th class="l">Name</th><th class="l">Category</th><th class="l wrapt">Teams</th></tr></thead><tbody>${list.map(m => `<tr><td>${m.y}</td><td class="l">${hofNameCell(m)}</td><td class="l">${esc(m.cat)}</td><td class="l wrapt">${esc(m.teams) || '<span class="muted">—</span>'}</td></tr>`).join('')}</tbody></table></div>` : '<p class="muted">Nobody matches these filters.</p>';
  return `<h2>Hall of Fame</h2><p class="muted" style="margin:-4px 0 10px">${all.length} members. New inductees are added here when they retire, with a speech from each.</p>
  <section class="panel"><h2 style="margin-top:0">Class of ${cy} <span class="muted" style="font-weight:400;font-size:13px">${cls.length} inductee${cls.length === 1 ? '' : 's'}</span></h2><div class="row" id="hofyrs" style="margin-bottom:10px;flex-wrap:wrap">${chips}</div><div class="stack">${cls.map(card).join('')}</div></section>
  <section class="panel" style="margin-top:16px"><h2 style="margin-top:0">Members <span class="muted" style="font-weight:400;font-size:13px">${list.length}</span></h2>${filters}${tbl}</section>`;
}
document.addEventListener('click', e => { const b = e.target.closest('[data-hofyr]'); if (!b || !L || !$('#main').contains(b)) return; ui.hofF = ui.hofF || {}; ui.hofF.y = +b.dataset.hofyr; render(); });
const DISC_OFF = { tech: 'Technical foul', eject: 'Ejection', flag: 'Flagrant foul', fight: 'Fight', late: 'Late / skipped practice', conduct: 'Conduct', discipline: 'Discipline' };
function vDiscipline() {
  const lead = (k, title, unit, fmt) => { const r = discLeaders(L, k, 15); return `<section class="panel"><h3>${title}</h3>${r.length ? `<div class="tblwrap"><table><thead><tr><th class="l">Player</th><th class="l">Team</th><th>${unit}</th></tr></thead><tbody>${r.map(x => `<tr class="click ${isUser(x.tid) ? 'mine' : ''}" data-player="${x.pid}"><td class="l">${esc(x.name)}</td><td class="l">${x.tid != null && L.teams[x.tid] ? tlabel(x.tid) : '<span class="muted">FA</span>'}</td><td>${fmt(x.v)}</td></tr>`).join('')}</tbody></table></div>` : '<p class="muted">Nobody yet this season.</p>'}</section>`; };
  const fines = (L.fines || []).slice(0, 15), susps = (L.susps || []).slice(0, 15);
  const lg = (L.lgFines && L.lgFines[L.season]) || 0, tm = L.teams.reduce((a, t) => a + ((t.fin && t.fin.fines) || 0), 0);
  const who = x => L.players[x.pid] ? plink(L.players[x.pid]) : 'Former player';
  const team = x => x.tid != null && L.teams[x.tid] ? tlabel(x.tid) : '<span class="muted">FA</span>';
  return `<p class="muted" style="margin:0 0 10px">${seasonName(L.season)} · league fines ${fineStr(lg)} · team fines ${fineStr(tm)}. Techs, flagrants, fights and ejections are fined by salary and go to the league; fines you give go to your team's cash.</p>
  <div class="grid2">${lead('tech', 'Technical fouls', 'Techs', v => v)}${lead('fines', 'Fines paid', 'Fines', fineStr)}${lead('suspG', 'Games suspended', 'Games', v => v)}${lead('flag', 'Flagrant foul points', 'Points', v => v)}</div>
  <div class="grid2" style="margin-top:16px"><section class="panel"><h3>Recent fines</h3>${fines.length ? `<div class="tblwrap"><table><thead><tr><th class="l">When</th><th class="l">Player</th><th class="l">Team</th><th class="l">For</th><th>Amount</th><th class="l">Paid to</th></tr></thead><tbody>${fines.map(f => `<tr><td class="l">${esc(dayTxt(f.day, f.s))}</td><td class="l">${who(f)}</td><td class="l">${team(f)}</td><td class="l">${esc(DISC_OFF[f.off] || f.why || f.off)}</td><td>${fineStr(f.amt)}</td><td class="l">${f.kind === 'team' ? 'Team' : 'League'}</td></tr>`).join('')}</tbody></table></div>` : '<p class="muted">No fines yet.</p>'}</section>
  <section class="panel"><h3>Recent suspensions</h3>${susps.length ? `<div class="tblwrap"><table><thead><tr><th class="l">When</th><th class="l">Player</th><th class="l">Team</th><th>Games</th><th class="l">By</th><th class="l">Reason</th><th>Pay lost</th></tr></thead><tbody>${susps.map(x => `<tr><td class="l">${esc(dayTxt(x.day, x.s))}</td><td class="l">${who(x)}</td><td class="l">${team(x)}</td><td>${x.g}</td><td class="l">${x.kind === 'team' ? 'Team' : 'League'}</td><td class="l">${esc(x.why || '')}</td><td>${fineStr(x.lost || 0)}</td></tr>`).join('')}</tbody></table></div>` : '<p class="muted">No suspensions yet.</p>'}</section></div>`;
}
document.addEventListener('click', e => {
  let b = e.target.closest('[data-susp]'); if (b) { suspendDialog(+b.dataset.susp); return; }
  b = e.target.closest('[data-meet]');
  if (b) {
    const r = meetPlayer(L, +b.dataset.meet);
    if (!r.ok) { dialog(`<h2>One-on-one</h2><p>${esc(r.msg)}</p><div class="row"><button class="primary" id="x-close">OK</button></div>`); $('#x-close').onclick = closeDialog; return; }
    ui.mtgShow = null; save(); render(); runDialog(mtgDialog);
  }
});

// --- dynasties & eras ---
function dynastyView() {
  const D = dynasties(L), W = dynWatch(L, 8), E = dynEras(L);
  const watch = W.length ? `<div class="tblwrap"><table><thead><tr><th class="l">Team</th><th class="l">Label</th><th>Titles (last 5)</th><th>Finals (last 5)</th><th>Score</th></tr></thead><tbody>${W.map(w => `<tr><td class="l">${tlabel(w.tid)}</td><td class="l"><span class="pill dyn-${w.label.split(' ')[0].toLowerCase()}">${esc(w.label)}</span></td><td>${w.titles}</td><td>${w.finals}</td><td>${w.v}</td></tr>`).join('')}</tbody></table></div><p class="muted" style="font-size:12px">Last 5 seasons: title 10, Finals loss 5, conference finals 2, second round 1, first round 0.5, best record 2; recent seasons count more.</p>` : '<p class="muted">Finish a season to start the watch list.</p>';
  const dyn = D.length ? D.map(d => { const core = dynCore(L, d, 5); return `<div class="dyncard"><div class="dynhead">${d.tid != null && L.teams[d.tid] ? logo(d.tid, 28) : ''}<div><strong>${esc(d.name)}</strong> <span class="pill">${esc(d.tier)}</span><div class="muted">${esc(d.from)} to ${esc(d.to)} · ${d.titles} titles · ${d.finals} Finals</div></div></div><div class="muted" style="font-size:12px">Titles: ${d.seasons.map(esc).join(', ')}</div>${core.length ? `<div style="margin-top:4px;font-size:13px">Core: ${core.map(c => L.players[c.id] ? plink(L.players[c.id]) + (c.titles > 1 ? ` <span class="muted">×${c.titles}</span>` : '') : esc(c.name)).join(', ')}</div>` : ''}</div>`; }).join('') : '<p class="muted">No dynasties yet. It takes 3 titles in a short span, or back-to-back titles plus a third Finals.</p>';
  const eras = E.map(e => `<tr><td class="l">${esc(e.from)}${e.to !== e.from ? ' – ' + esc(e.to) : ''}</td><td class="l">${e.open ? '<span class="muted">Open era</span>' : (e.tid != null ? tlabel(e.tid) : '')}${!e.open ? ` <span class="muted">${e.titles} title${e.titles !== 1 ? 's' : ''}</span>` : ''}</td><td class="l" style="font-size:12px">${e.champs.map(esc).join(' · ')}</td></tr>`).join('');
  return `<div class="grid2"><section class="panel"><h2>Dynasty watch</h2>${watch}<h2 style="margin-top:16px">Dynasties</h2>${dyn}</section><section class="panel"><h2>Eras</h2><div class="tblwrap"><table><thead><tr><th class="l">Seasons</th><th class="l">Owned by</th><th class="l">Champions</th></tr></thead><tbody>${eras || '<tr><td class="l" colspan="3">No seasons yet.</td></tr>'}</tbody></table></div><p class="muted" style="font-size:12px">Blocks of 5 seasons. The era belongs to the team with the most points (title 10, Finals 5, conference finals 2, best record 2) if it won 2+ titles; otherwise it's an open era.</p></section></div>`;
}
function multiBtn() { return ui.busy ? [] : [['multi', 'Sim seasons…']]; }
function renderHeader() {
  const total = L.schedule.length;
  const ph = L.phase === 'regular' ? `${dd(Math.min(L.day, total - 1)) ? dd(Math.min(L.day, total - 1)) + ' · ' : ''}Day ${Math.min(L.day + 1, total)} of ${total}` : L.phase === 'playoffs' ? poStages(L)[L.po.stage] : L.phase === 'off-fa' ? `Free agency · day ${L.faDay} of 10` : PHASE_TXT[L.phase];
  $('#b-back').disabled = !backStack.length;
  const ut = L.user != null ? L.teams[L.user] : null;
  // F2: while you watch your game live, the top bar shows the record from before that game (no spoiler)
  const lg = liveGame(), lgMine = lg && ut && (isUser(lg.home) || isUser(lg.away)), lgWon = lgMine && (isUser(lg.home) ? lg.hs > lg.as : lg.as > lg.hs);
  const recTxt = !ut ? ' · Commissioner' : lgMine ? ` · ${ut.w - (lgWon ? 1 : 0)}-${ut.l - (lgWon ? 0 : 1)}` : ' · ' + ut.w + '-' + ut.l + (L.phase === 'playoffs' && L.po ? ' · playoffs ' + poWL(ut.id) : '');
  $('#when').textContent = `${seasonName(L.season)} · ${ph}${recTxt}`;
  const fc = $('#fchip'); { const bn = $('#brandname'); if (bn && bn.textContent !== leagueName()) bn.textContent = leagueName(); }
  if (L.user != null) { const k = 'f' + L.user + L.teams[L.user].name; if (fc.dataset.k !== k) { fc.dataset.k = k; fc.innerHTML = `<a class="fchip lk tl" href="#myteam" title="Your team · ${leagueName()}">${logo(L.user, 36)}<strong>${esc(tname(L.user))}</strong><span>Franchise Mode</span></a>`; } fc.hidden = false; $('#brand').classList.add('fm'); document.title = tname(L.user) + ' · ' + leagueName(); }
  else if (L.mode === 'team' && L.jobless) { const k = 'jobless'; if (fc.dataset.k !== k) { fc.dataset.k = k; fc.innerHTML = `<span class="fchip"><strong>Between jobs</strong><span>Watching the league</span></span>`; } fc.hidden = false; $('#brand').classList.add('fm'); document.title = leagueName(); }
  else { fc.hidden = true; fc.innerHTML = ''; fc.dataset.k = ''; $('#brand').classList.remove('fm'); document.title = leagueName(); }
  const btns = ui.auto ? [['autostop', 'Stop autopilot']] : controls().concat(pressActive() ? [['press', 'Press conference']] : []).concat(dramaOpen(L) ? [['drama', 'Locker room issue']] : []).concat(L.user != null && ivOpen(L) ? [['iv', 'Interview']] : []).concat(L.user != null && mtgOpen(L) ? [['mtg', 'Meeting']] : []).concat(multiBtn());
  const key = L.phase + ui.busy + JSON.stringify(btns);
  if (ui.auto) { const a = L.auto; if (a) $('#when').textContent = autoWhen(a); }
  if ($('#simctl').dataset.k !== key) {
    $('#simctl').dataset.k = key;
    $('#simctl').innerHTML = btns.map(([k, t], i) => `<button data-sim="${k}" title="${esc(SIM_TIP[k] || '')}" class="${i === 0 ? 'primary' : ''}${k === 'multi' ? ' multi' : ''}" ${ui.busy && k !== 'autostop' ? 'disabled' : ''}>${t}</button>`).join('');
  }
  // v24: tabs are grouped. The top row has five groups; the row under it lists the views in the group you are in.
  const NAME = { cards: 'Player cards', trophies: 'Trophy room', stories: 'Stories', rmoves: 'Overview', hofc: 'Hall of Fame', feed: 'Feed', topplays: 'Top plays', myteam: 'My team', coaches: 'Staff & GMs', preview: 'Season preview', weekly: 'Weekly report', standings: 'Standings', review: 'Progression', schedule: 'Schedule', stats: 'Stats', players: 'Players', awards: 'Awards', teams: 'Teams', trades: 'Trades', fa: 'Free agency', draft: 'Draft', news: 'News & events', injuries: 'Injuries', discipline: 'Discipline', pipeline: 'Pipeline', history: 'History', rules: 'How it works' };
  const showPre = L.phase === 'regular' && L.day <= 7 || ui.view === 'preview';
  const groups = [
    L.user != null ? { k: 'team', t: 'My team', v: ['myteam', 'cards', 'coaches'] } : { k: 'team', t: 'Staff & GMs', v: ['coaches', 'cards'] },
    { k: 'league', t: 'League', v: ['standings', ...(L.offSummary ? ['review'] : []), 'schedule', 'teams', 'stats', 'players', 'injuries', 'discipline', 'awards', 'pipeline'] },
    { k: 'moves', t: 'Roster moves', v: ['rmoves', 'trades', 'fa', 'draft'] },
    { k: 'story', t: 'News & history', v: [...(showPre ? ['preview'] : []), 'weekly', 'news', 'stories', 'feed', 'topplays', 'history', 'trophies', 'hofc'] },
    { k: 'help', t: 'How it works', v: ['rules'] }
  ];
  const badge = v => v === 'trades' ? ((L.pending || []).length + (L.offers || []).length) : 0;
  const cur = groups.find(g => g.v.includes(ui.view)) || groups[0];
  ui.gLast = ui.gLast || {}; if (cur.v.includes(ui.view)) ui.gLast[cur.k] = ui.view;
  $('#tabs').innerHTML = groups.map(g => { const to = ui.gLast[g.k] && g.v.includes(ui.gLast[g.k]) ? ui.gLast[g.k] : g.v[0], n = g.v.reduce((a, v) => a + badge(v), 0); return `<a href="#${to}" data-v="${to}" class="${g === cur ? 'on' : ''}">${g.t}${n ? ` <span class="gc">(${n})</span>` : ''}</a>`; }).join('');
  const sub = cur.v.length > 1;
  $('#subrow').hidden = !sub;
  $('#subtabs').innerHTML = sub ? cur.v.map(v => `<a href="#${v}" data-v="${v}" class="${ui.view === v ? 'on' : ''}">${NAME[v]}${badge(v) ? ' (' + badge(v) + ')' : ''}</a>`).join('') : '';
  $('#b-fwd').disabled = !fwdStack.length;
}

// ---------- views ----------
// v26.5: social feed. Filters All / Your team / Players / Media / Rumors; 25 posts at a time.
const FEED_F = [['all', 'All'], ['team', 'Your team'], ['players', 'Players'], ['media', 'Media'], ['rumors', 'Rumors']];
// v26.6b: calendar dates (leagues with L.y0); old saves keep Day N
function dd(day, season) { if (!L || L.y0 == null || day == null) return null; const x = dayDate(season != null && season !== L.season ? { y0: L.y0, season, schedule: L.schedule } : L, day); return x ? x.label : null; }
const dayTxt = (day, season) => dd(day, season) || 'Day ' + (day + 1);
function postWhen(x) { return `${seasonName(x.s)} · ${x.day != null ? dayTxt(x.day, x.s) : x.ph === 'playoffs' ? 'Playoffs' : x.ph && (x.ph.startsWith('off') || x.ph === 'season-done') ? 'Offseason' : x.ph === 'regular-done' ? 'End of season' : 'Preseason'}`; }
function postCard(x) {
  const t = x.tid != null ? L.teams[x.tid] : null, pl = x.a === 'player' && x.aid != null && L.players[x.aid];
  const who = pl ? `<a class="lk" data-player="${pl.id}">${esc(x.au)}</a>` : x.a === 'team' && t ? `<a class="lk" data-team="${t.id}">${esc(x.au)}</a>` : esc(x.au);
  return `<div class="post ${x.mine ? 'mine' : ''}" data-post="${x.n}" style="border-left:4px solid ${t ? t.c1 : 'var(--line)'}"><div class="post-h"><strong>${who}</strong> <span class="muted">${esc(x.ah || '')}</span> <span class="pill post-${x.a}">${esc(FEED_AUTH[x.a] || '')}</span>${t && x.a !== 'team' ? ` <a class="lk tl" data-team="${t.id}">${esc(t.abbr)}</a>` : ''}</div><div class="post-t">${esc(postText(L, x))}${x.ev === 'pipe' ? ` <span class="pill pos">Pipeline</span>${x.pid != null && L.players[x.pid] ? ` <a class="lk" data-player="${x.pid}">${esc(L.players[x.pid].name)} →</a>` : ''}` : ''}</div><div class="muted post-f">♥ ${x.likes.toLocaleString()} · ${postWhen(x)}</div></div>`;
}
const STORY_NEWS = ['return', 'breakout', 'streak', 'comeback', 'faWhy', 'hot', 'unhappy'], STORY_POST = ['race', 'raceHold', 'retire', 'jersey'];
function storyBox() {
  const ns = L.log.filter(x => STORY_NEWS.includes(x.k)).slice(0, 5), ps = (L.feed || []).filter(x => STORY_POST.includes(x.ev)).slice(0, 3);
  if (!ns.length && !ps.length) return '';
  return `<div class="panel"><h3>Storylines</h3>${ns.map(x => `<div class="leader" style="grid-template-columns:minmax(0,1fr) auto"><span>${x.tid != null ? tlabel(x.tid, true) + ' ' : ''}${esc(x.text)}</span><span class="muted">${seasonName(x.season)}${x.phase === 'regular' ? ' · ' + dayTxt(x.day, x.season) : ''}</span></div>`).join('')}${ps.length ? '<div class="k" style="margin-top:8px">From the feed</div>' + ps.map(postCard).join('') : ''}</div>`;
}
function feedBox(n) {
  const l = feedList(L, 'all', n);
  return `<div class="panel"><h3>Latest <a class="lk" href="#feed" style="font-weight:400;font-size:13px">Feed →</a></h3>${l.length ? l.map(postCard).join('') : '<p class="muted">No posts yet.</p>'}</div>`;
}
// ---------- Phase 2: top plays of the night ----------
// Every game keeps its 3 best plays (engine game.hl). A night = all games of one day; the reel shows its top 10
// (at most 2 per player), each with the player's face, what happened and a small court replay (court.js COURT.reel).
const TP_KIND = { D: 'Dunk', 3: 'Three', A: 'And-one', P: 'Putback slam', B: 'Block', G: 'Game-winner' };
const TP_ICON = { D: '💥', 3: '🔥', A: '💪', P: '💥', B: '🚫', G: '🏆' };
function tpOf(g) {
  return (g.hl || []).map((h, k) => { const [sc, kind, pid, side, q, c, hs, as, zone, type, ast, other] = h; const tid = side === 0 ? g.home : g.away; return { sc, kind, pid, side, q, c, hs, as, zone, type, ast, other, gid: g.id, k, tid, oppTid: side === 0 ? g.away : g.home }; }).filter(x => L.players[x.pid]);
}
function tpNights() {
  const m = new Map();
  for (const g of L.games) { if (!g.hl || g.season !== L.season) continue; const key = g.day + (g.playoff ? 'p' : ''); if (!m.has(key)) m.set(key, { key, day: g.day, playoff: !!g.playoff, games: [] }); m.get(key).games.push(g); }
  return [...m.values()].sort((a, b) => b.games[0].id - a.games[0].id);
}
function tpNightList(n) {
  const all = n.games.flatMap(tpOf).sort((a, b) => b.sc - a.sc), per = {}, out = [];
  for (const x of all) { if ((per[x.pid] = (per[x.pid] || 0) + 1) > 2) continue; out.push(x); if (out.length >= 10) break; }
  return out;
}
function tpList() {
  if (ui.tpGame != null) { const g = L.games.find(x => x.id === ui.tpGame); if (g) return { list: tpOf(g).sort((a, b) => b.sc - a.sc), title: `${L.teams[g.away].abbr} at ${L.teams[g.home].abbr}`, game: g }; }
  const ns = tpNights(), n = ns.find(x => x.key === ui.tpNight) || ns[0];
  return n ? { list: tpNightList(n), title: n.games[0] ? dayTxt(n.day, L.season) + (n.playoff ? ' · playoffs' : '') : '', night: n, nights: ns } : { list: [], nights: ns };
}
function tpWhat(x) {
  const p = L.players[x.pid], nm = p ? shortName(p) : 'Player', o = x.other && L.players[x.other] ? shortName(L.players[x.other]) : null, a = x.ast && L.players[x.ast] ? shortName(L.players[x.ast]) : null;
  const shot = ['dunk', 'layup', 'shot in the paint', 'mid-range jumper', 'three'][x.type] || 'shot';
  const t = { D: `${nm} throws down a monster dunk`, 3: `${nm} drills a ${x.zone === 9 || x.zone === 13 ? 'corner ' : 'deep '}three`, A: `${nm} scores through contact on a ${shot}, and one`, P: `${nm} flies in for the putback slam`, B: `${nm} rejects ${o || 'the shot'} at the ${x.type <= 1 ? 'rim' : 'shot'}`, G: `${nm} hits the game-winning ${shot}${x.other ? ', and one' : ''}` }[x.kind] || nm;
  return t + (a && x.kind !== 'B' ? ` (assist ${a})` : '') + '.';
}
function tpWhen(x) {
  const own = x.side === 0 ? x.hs : x.as, opp = x.side === 0 ? x.as : x.hs, me = L.teams[x.tid].abbr, them = L.teams[x.oppTid].abbr;
  return `${qTxt(x.q)} ${clockTxt(x.c)} · ${me} ${own}-${opp} ${them}`;
}
function tpRow(x, i, on) {
  const p = L.players[x.pid];
  return `<button class="tp-row ${on ? 'on' : ''}" data-tp="i:${i}" aria-label="Play ${i + 1}: ${esc(tpWhat(x))}"><span class="tp-rk">${i + 1}</span>${portrait('p', x.pid, p.nat, x.tid, 'xs')}<span class="tp-rx"><strong>${esc(shortName(p))}</strong> <span class="pill tp-k tp-k${x.kind}">${TP_ICON[x.kind] || ''} ${TP_KIND[x.kind] || ''}</span><br><span class="muted">${esc(L.teams[x.tid].abbr)} vs ${esc(L.teams[x.oppTid].abbr)} · ${qTxt(x.q)} ${clockTxt(x.c)}</span></span></button>`;
}
function tpCard(x, i, n) {
  const p = L.players[x.pid];
  return `<div class="tp-face">${portrait('p', x.pid, p.nat, x.tid)}<span class="tp-num">#${i + 1}</span></div><div class="tp-info"><div class="k">${TP_ICON[x.kind] || ''} ${TP_KIND[x.kind] || ''} · play ${i + 1} of ${n}</div><h3 class="tp-name">${plink(p)} <span class="muted" style="font-weight:400">${logo(x.tid, 22)} ${esc(L.teams[x.tid].abbr)}</span></h3><p class="tp-what">${esc(tpWhat(x))}</p><p class="muted tp-when">${esc(tpWhen(x))} · <a class="lk" data-game="${x.gid}">Box score</a></p></div>`;
}
function vTopPlays() {
  const r = tpList(), list = r.list, i = Math.min(ui.tpI || 0, Math.max(0, list.length - 1)), x = list[i];
  const pick = r.nights && r.nights.length > 1 && ui.tpGame == null ? `<label class="muted" style="font-size:13px">Night <select id="tp-night">${r.nights.slice(0, 30).map(n => `<option value="${n.key}" ${n === r.night ? 'selected' : ''}>${esc(dayTxt(n.day, L.season))}${n.playoff ? ' · playoffs' : ''} (${n.games.length} game${n.games.length === 1 ? '' : 's'})</option>`).join('')}</select></label>` : '';
  const back = ui.tpGame != null ? `<button class="sm" data-tp="all">All games that night</button>` : '';
  if (!x) return `<h2>Top plays</h2><p class="muted">No top plays yet. Every game played from now on keeps its best plays: dunks, deep threes, and-ones, big blocks and game-winners. Sim a day and come back.</p>`;
  return `<h2>${ui.tpGame != null ? 'Top plays · ' + esc(r.title) : 'Top plays of the night'}</h2><div class="row" style="gap:10px;flex-wrap:wrap;align-items:center;margin:-4px 0 10px">${pick || (ui.tpGame != null ? '' : `<span class="muted">${esc(r.title)}</span>`)}${back}</div>
  <section class="panel tp-reel"><div class="tp-main"><div class="tp-stage"><canvas id="tp-canvas" role="img" aria-label="Replay of the play"></canvas></div><div class="tp-card" id="tp-card">${tpCard(x, i, list.length)}</div></div>
  <div class="row tp-ctl"><button class="sm" data-tp="prev" aria-label="Previous play">◀ Prev</button><button class="sm primary" data-tp="pause" id="tp-pause">${ui.tpPaused ? '▶ Play' : '❚❚ Pause'}</button><button class="sm" data-tp="next" aria-label="Next play">Next ▶</button><span class="muted" id="tp-pos">${i + 1} / ${list.length}</span></div></section>
  <section class="panel"><h3>${list.length} play${list.length === 1 ? '' : 's'}</h3><div class="tp-list" id="tp-list">${list.map((y, k) => tpRow(y, k, k === i)).join('')}</div></section>`;
}
// small strip for My team and the box score
function tpStrip() {
  const ns = tpNights(); if (!ns.length) return '';
  const list = tpNightList(ns[0]).slice(0, 3); if (!list.length) return '';
  return `<div class="panel tp-strip"><div class="row" style="justify-content:space-between;align-items:center;gap:8px"><h3 style="margin:0">Top plays of the night <span class="muted" style="font-weight:400;font-size:13px">${esc(dayTxt(ns[0].day, L.season))}</span></h3><a class="lk" href="#topplays" data-tpgo="night">▶ Watch the reel</a></div><div class="tp-mini">${list.map((x, k) => { const p = L.players[x.pid]; return `<a class="tp-mrow" href="#topplays" data-tpgo="n:${k}">${portrait('p', x.pid, p.nat, x.tid, 'xs')}<span><strong>${k + 1}. ${esc(shortName(p))}</strong> <span class="muted">${esc(L.teams[x.tid].abbr)}</span><br><span class="muted" style="font-size:12px">${TP_ICON[x.kind] || ''} ${TP_KIND[x.kind] || ''}</span></span></a>`; }).join('')}</div></div>`;
}
function tpGamePanel(g) {
  const list = g.hl ? tpOf(g) : null;
  if (!list || !list.length) return '';
  return `<section class="panel"><div class="row" style="justify-content:space-between;align-items:center"><h3 style="margin:0">Top plays</h3><button class="sm" data-tpgo="g:${g.id}">▶ Watch</button></div>${list.sort((a, b) => b.sc - a.sc).map(x => `<div class="leader" style="grid-template-columns:22px minmax(0,1fr) auto"><span>${TP_ICON[x.kind] || ''}</span><span>${esc(tpWhat(x))}</span><span class="muted">${qTxt(x.q)} ${clockTxt(x.c)}</span></div>`).join('')}</section>`;
}
let tpTimer = null;
function tpAfter() {
  clearTimeout(tpTimer); tpTimer = null;
  if (ui.view !== 'topplays' || ui.game != null || ui.player != null || ui.coach != null || ui.gm != null) { if (window.COURT) COURT.stop('tp-canvas'); return; }
  const r = tpList(), list = r.list; if (!list.length || !window.COURT) return;
  const i = Math.min(ui.tpI || 0, list.length - 1); ui.tpI = i;
  const m = (window.FX && FX.settings && { slow: 1.6, fast: 0.5 }[FX.settings.speed]) || 1, play = 2600 * m;
  COURT.reel('tp-canvas', list[i], play);
  if (!ui.tpPaused) tpTimer = setTimeout(() => { if (ui.view !== 'topplays' || !document.getElementById('tp-canvas')) return; tpGo((ui.tpI || 0) + 1, list.length); }, play + 1400 * m);
}
// move the reel without re-rendering the page (keeps the scroll position and the canvas)
function tpGo(i, n) {
  const r = tpList(), list = r.list; if (!list.length) return;
  ui.tpI = ((i % list.length) + list.length) % list.length; const x = list[ui.tpI];
  const card = document.getElementById('tp-card'); if (!card) { render(); return; }
  card.innerHTML = tpCard(x, ui.tpI, list.length);
  document.querySelectorAll('#tp-list .tp-row').forEach((b, k) => b.classList.toggle('on', k === ui.tpI));
  const pos = document.getElementById('tp-pos'); if (pos) pos.textContent = `${ui.tpI + 1} / ${list.length}`;
  tpAfter(); void n;
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-tp],[data-tpgo]'); if (!b || !L) return;
  if (b.dataset.tpgo) { e.preventDefault(); e.stopImmediatePropagation(); const v = b.dataset.tpgo; backStack.push(snapNow());
    ui.player = null; ui.coach = null; ui.gm = null; ui.tpPaused = false;
    if (v.startsWith('g:')) { ui.tpGame = +v.slice(2); ui.tpI = 0; ui.game = null; ui.liveMode = null; }
    else { ui.tpGame = null; ui.tpNight = null; ui.tpI = v.startsWith('n:') ? +v.slice(2) : 0; ui.game = null; }
    ui.view = 'topplays'; if (location.hash !== '#topplays') history.replaceState(null, '', '#topplays'); render(); window.scrollTo(0, 0); return; }
  e.stopImmediatePropagation();
  const v = b.dataset.tp;
  if (v === 'pause') { ui.tpPaused = !ui.tpPaused; b.textContent = ui.tpPaused ? '▶ Play' : '❚❚ Pause'; if (ui.tpPaused) { clearTimeout(tpTimer); tpTimer = null; } else tpGo((ui.tpI || 0) + 1); return; }
  if (v === 'all') { ui.tpGame = null; ui.tpI = 0; render(); return; }
  if (v === 'prev') return tpGo((ui.tpI || 0) - 1);
  if (v === 'next') return tpGo((ui.tpI || 0) + 1);
  if (v.startsWith('i:')) return tpGo(+v.slice(2));
}, true);
document.addEventListener('change', e => { const s = e.target.closest('#tp-night'); if (!s || !L) return; ui.tpNight = s.value; ui.tpI = 0; ui.tpGame = null; render(); });
function vFeed() {
  const f = ui.feedF || 'all', n = ui.feedN || 25, all = feedList(L, f, 100), list = all.slice(0, n);
  return `<h2>Feed</h2><section class="panel"><div class="row" style="margin-bottom:10px">${FEED_F.map(([k, nm]) => `<button class="sm chipbtn ${f === k ? 'primary' : ''}" data-feedf="${k}">${nm}</button>`).join('')}</div>${list.length ? list.map(postCard).join('') : '<p class="muted">No posts here yet. Play some games.</p>'}${all.length > n ? '<div class="row" style="margin-top:10px"><button id="feed-more">More</button></div>' : ''}</section>`;
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-feedf],#feed-more'); if (!b || !L || !$('#main').contains(b)) return;
  if (b.id === 'feed-more') ui.feedN = (ui.feedN || 25) + 25; else { ui.feedF = b.dataset.feedf; ui.feedN = 25; }
  render();
});
// ---------- v30b #8: pre-game scouting report (away team left, home team right) ----------
const scoutBtn = (h, a, txt) => `<button class="sm scoutbtn" data-scout="${h},${a}" title="Pre-game scouting report">${txt || 'Scout'}</button>`;
function scoutDlg(h, a) {
  const th = L.teams[h], ta = L.teams[a]; if (!th || !ta) return;
  const key = L.phase === 'playoffs' ? 'tpo' : 'trs', adv = t => { const x = teamAdv(t[key]) || teamAdv(t.trs); return x; };
  const A = adv(ta), H = adv(th);
  const rk = (f, t, low) => { const v = L.teams.map(x => ({ id: x.id, a: adv(x) })).filter(x => x.a).sort((p, q) => low ? p.a[f] - q.a[f] : q.a[f] - p.a[f]); const i = v.findIndex(x => x.id === t.id); return i < 0 ? null : i + 1; };
  const ord = n => n == null ? '' : n + (['th', 'st', 'nd', 'rd'][(n % 100 > 10 && n % 100 < 14) ? 0 : n % 10 < 4 ? n % 10 : 0]);
  const str = t => teamStrength(L, t), pr = t => L.pr && L.pr.now ? L.pr.now.indexOf(t.id) + 1 : 0;
  const rows = [], row = (lab, va, vb, fa, fb, low, tip) => { const ba = va == null || vb == null || va === vb ? '' : (low ? va < vb : va > vb) ? 'w' : '', bb = va == null || vb == null || va === vb ? '' : (low ? vb < va : vb > va) ? 'w' : ''; rows.push(`<tr><td class="${ba}">${va == null ? '—' : fa(va)}</td><td class="k2c" ${tip ? `title="${esc(tip)}"` : ''}>${lab}</td><td class="${bb}">${vb == null ? '—' : fb(vb)}</td></tr>`); };
  const same = x => String(x);
  row('Team rating', str(ta), str(th), f1, f1, false, 'Roster strength: best 8 players by overall, healthy players only');
  rows.push(`<tr><td>${ta.w}-${ta.l}</td><td class="k2c">Record</td><td>${th.w}-${th.l}</td></tr>`);
  rows.push(`<tr><td>${ta.aw || 0}-${ta.al || 0}</td><td class="k2c">Away / Home</td><td>${th.hw || 0}-${th.hl || 0}</td></tr>`);
  if (L.po) rows.push(`<tr><td>${poWL(a)}</td><td class="k2c">Playoff W-L</td><td>${poWL(h)}</td></tr>`);
  rows.push(`<tr><td>${esc(ta.last10 ? ta.last10.split('').filter(x => x === 'W').length + '-' + ta.last10.split('').filter(x => x === 'L').length : '—')}</td><td class="k2c">Last 10</td><td>${esc(th.last10 ? th.last10.split('').filter(x => x === 'W').length + '-' + th.last10.split('').filter(x => x === 'L').length : '—')}</td></tr>`);
  if (L.pr && L.pr.now) row('Power rank', pr(ta) || null, pr(th) || null, x => '#' + x, x => '#' + x, true);
  const E = (lab, f, fm, low, tip) => row(lab, A ? A[f] : null, H ? H[f] : null, fm, fm, low, tip);
  E('Points per game', 'ppg', f1); E('Opp. points', 'opp', f1, true); E('Off. rating', 'ortg', f1, false, 'Points per 100 possessions'); E('Def. rating', 'drtg', f1, true, 'Points allowed per 100 possessions (lower is better)');
  E('Pace', 'pace', f1); E('FG%', 'fg', x => pct(x, 1)); E('3P%', 'tp', x => pct(x, 1)); E('Rebounds', 'rpg', f1); E('Assists', 'apg', f1); E('Turnovers', 'tov', f1, true);
  // best players
  const best = t => teamPlayers(t.id).filter(p => !p.prospect).sort((p, q) => q.ovr - p.ovr).slice(0, 3);
  const pl = p => { const x = p.stats && p.stats[skey()] && p.stats[skey()].gp ? `${f1(pgx(p, 'pts'))} / ${f1(pgx(p, 'orb') + pgx(p, 'drb'))} / ${f1(pgx(p, 'ast'))}` : 'no games yet'; return `<div class="scp"><span>${plink(p)} <span class="muted">${posLabel(p)}</span>${p.injury > 0 ? ` <span class="pill inj" title="Injured">Out ${injGames(p)}</span>` : ''}</span><span><strong>${ovrTxt(p)}</strong></span><span class="muted">${x}</span></div>`; };
  // matchups: projected starting fives lined up by position
  const five = t => rotationOf(L, t).slice(0, 5).sort((p, q) => p.pos - q.pos || q.ovr - p.ovr);
  const fa = five(ta), fh = five(th);
  const mu = fa.map((p, i) => { const q = fh[i]; if (!q) return ''; const d = p.ovr - q.ovr; return `<tr><td class="l">${plink(p)} <span class="muted">${posLabel(p)}</span></td><td>${p.ovr}</td><td class="${d > 1 ? 'w' : d < -1 ? 'lo' : 'muted'}">${d > 0 ? '+' : ''}${d}</td><td>${q.ovr}</td><td class="l">${plink(q)} <span class="muted">${posLabel(q)}</span></td></tr>`; }).join('');
  // style
  const sty = t => { const c = t.coach, x = adv(t), tags = []; if (x) { const o = rk('ortg', t), d = rk('drtg', t, true), pc = rk('pace', t), tp = rk('tpar', t), tv = rk('tov', t, true); if (o <= 5) tags.push(`Top offense (${ord(o)})`); if (d <= 5) tags.push(`Top defense (${ord(d)})`); if (o >= L.teams.length - 4) tags.push('Struggling offense'); if (d >= L.teams.length - 4) tags.push('Struggling defense'); if (pc <= 5) tags.push('Plays fast'); if (pc >= L.teams.length - 4) tags.push('Plays slow'); if (tp <= 5) tags.push('Three-point heavy'); if (tv <= 4) tags.push('Takes care of the ball'); } return `<div class="row" style="flex-wrap:wrap;gap:6px"><span class="pill">${esc(OFF_SYS[c.off].name)}</span><span class="pill">${esc(DEF_SYS[c.def].name)}</span>${tags.map(g => `<span class="pill pos">${esc(g)}</span>`).join('')}</div><div class="muted" style="font-size:12px;margin-top:4px">Coach ${esc(c.name)} · ${c.ovr}</div>`; };
  // head to head this season + what to watch
  const hh = L.games.filter(g => g.season === L.season && ((g.home === h && g.away === a) || (g.home === a && g.away === h)));
  const sd = h * 31 + a + (L.day || 0) + (L.po ? L.po.day * 7 : 0);   // v30 8t: wording seed, stable for this game
  const hhTxt = hh.length ? hh.map(g => `<a class="lk" data-game="${g.id}">${g.playoff ? esc(g.stage || 'Playoffs') + ' G' + g.gnum : dayTxt(g.day)}: ${L.teams[g.away].abbr} ${g.as}, ${L.teams[g.home].abbr} ${g.hs}</a>`).join(' · ') : esc(fl('sc.nomeet', {}, sd));
  const watch = [];
  { const sa = str(ta), sh = str(th), d = sa - sh; watch.push(Math.abs(d) < 1 ? fl('sc.even', {}, sd) : fl('sc.edge', { abbr: d > 0 ? ta.abbr : th.abbr, hi: f1(Math.max(sa, sh)), lo: f1(Math.min(sa, sh)) }, sd)); }
  if (A && H) { watch.push(fl('sc.matchup', { off: ta.abbr, ortg: f1(A.ortg), ork: ord(rk('ortg', ta)), def: th.abbr, drtg: f1(H.drtg), drk: ord(rk('drtg', th, true)) }, sd + 1)); watch.push(fl('sc.matchup', { off: th.abbr, ortg: f1(H.ortg), ork: ord(rk('ortg', th)), def: ta.abbr, drtg: f1(A.drtg), drk: ord(rk('drtg', ta, true)) }, sd + 2)); }
  for (const t of [ta, th]) { const out = rotationOf(L, t).concat(teamPlayers(t.id)).filter((p, i, arr) => arr.indexOf(p) === i && p.injury > 0).sort((p, q) => q.ovr - p.ovr).slice(0, 3); if (out.length) watch.push(fl('sc.inj', { abbr: t.abbr, list: out.map(p => `${p.last || p.name.split(' ').pop()} (${p.ovr}, out ${injGames(p)})`).join(', ') }, sd + t.id)); }
  const hd = t => `<div class="sch-h">${logo(t.id, 44)}<div><strong>${esc(tname(t.id))}</strong><div class="muted" style="font-size:12px">${t.w}-${t.l}${L.po ? ' · playoffs ' + poWL(t.id) : ''}</div></div></div>`;
  dialog(`<h2>Scouting report</h2><p class="muted" style="margin-top:-6px">${L.phase === 'playoffs' ? 'Playoffs' : dayTxt(L.day)} · ${esc(ta.abbr)} at ${esc(th.abbr)}</p>
  <div class="sch-top">${hd(ta)}<span class="muted">Away</span><span class="muted">Home</span>${hd(th)}</div>
  <div class="tblwrap"><table class="sc-cmp"><thead><tr><th>${esc(ta.abbr)} <span class="muted">away</span></th><th></th><th>${esc(th.abbr)} <span class="muted">home</span></th></tr></thead><tbody>${rows.join('')}</tbody></table></div>
  <div class="grid2e" style="margin-top:12px"><div><h3>Best players · ${esc(ta.abbr)}</h3>${best(ta).map(pl).join('')}<div class="muted" style="font-size:11px">Overall · pts / reb / ast per game</div></div><div><h3>Best players · ${esc(th.abbr)}</h3>${best(th).map(pl).join('')}<div class="muted" style="font-size:11px">Overall · pts / reb / ast per game</div></div></div>
  <h3 style="margin-top:12px">Matchups by position</h3><div class="tblwrap"><table class="sc-mu"><thead><tr><th class="l">${esc(ta.abbr)}</th><th>Ovr</th><th>Edge</th><th>Ovr</th><th class="l">${esc(th.abbr)}</th></tr></thead><tbody>${mu}</tbody></table></div>
  <div class="grid2e" style="margin-top:12px"><div><h3>Playstyle · ${esc(ta.abbr)}</h3>${sty(ta)}</div><div><h3>Playstyle · ${esc(th.abbr)}</h3>${sty(th)}</div></div>
  <h3 style="margin-top:12px">What to watch</h3>${watch.map(w => `<div class="leader" style="grid-template-columns:minmax(0,1fr)"><span>${esc(w)}</span></div>`).join('')}
  <h3 style="margin-top:12px">This season's meetings</h3><p style="margin:0">${hhTxt}</p>
  <div class="row" style="margin-top:12px"><button class="primary" id="x-close">Close</button></div>`, 'wide');
  $('#x-close').onclick = closeDialog;
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-scout]'); if (!b || !L) return;
  e.stopImmediatePropagation(); e.preventDefault(); const [h, a] = b.dataset.scout.split(',').map(Number); scoutDlg(h, a);
}, true);
function gameCard(g) {
  const aw = g.as > g.hs;
  return `<div class="game" data-game="${g.id}"><div class="t ${aw ? 'won' : ''}">${tlabel(g.away)}&nbsp;${esc(L.teams[g.away].name)}</div><div class="s ${aw ? 'won' : 'muted'}">${g.as}</div><div class="t ${!aw ? 'won' : ''}">${logo(g.home)}@ ${esc(L.teams[g.home].abbr)}&nbsp;${esc(L.teams[g.home].name)}</div><div class="s ${!aw ? 'won' : 'muted'}">${g.hs}</div>${(() => { const tags = [g.playoff ? g.stage + ' · Game ' + g.gnum : '', g.ot ? `Final/${g.ot > 1 ? g.ot : ''}OT` : '', isRivalry(L, g.home, g.away) ? 'Rivalry' : ''].filter(Boolean); return tags.length ? `<div class="tag">${tags.join(' · ')}</div>` : ''; })()}</div>`;
}
function careerNote() {
  if (L.mode !== 'team') return '';
  if (L.jobless) return `<div class="note">You're between jobs and watching the league. ${(L.jobOffers || []).length ? `You have ${L.jobOffers.length} job offer${L.jobOffers.length > 1 ? 's' : ''}. <button class="sm primary" data-joboffers="1">See offers</button>` : 'Teams that fire their GM will call in the offseason if your reputation is good enough.'}</div>`;
  const o = L.user != null && L.teams[L.user].owner;
  const tu = L.user != null ? L.teams[L.user] : null;
  if (tu && tu.pstate === 'final') return `<div class="note"><strong>Final warning.</strong> Miss the playoffs this season and you're fired.</div>`;
  if (tu && tu.pstate === 'demand') return `<div class="note"><strong>Your owner demands the playoffs.</strong> ${tu.strikes} more season${tu.strikes > 1 ? 's' : ''} without them and you're fired.</div>`;
  if (tu && tu.pstate === 'probation') return `<div class="note"><strong>On probation.</strong> Make the playoffs again to win back your owner's confidence; a miss means next season is playoffs or you're fired.</div>`;
  if (o && o.hot) return `<div class="note"><strong>Hot seat.</strong> Your owner's trust is ${o.trust}/100. Another season like the last and you'll be fired. Goal: ${esc((o.goal || {}).txt || '')}.</div>`;
  return '';
}
function phaseNote() {
  const ph = L.phase;
  const n = {
    'regular-done': 'Regular season complete. Awards are in. Press Start play-in to begin the postseason.',
    'season-done': L.po && L.po.champion != null ? `Champions: ${esc(tname(L.po.champion))}. Press Start offseason for aging, retirements and the draft.` : '',
    'off-review': 'Players have aged and some have retired. Review the changes below, then run the draft lottery.',
    'off-lottery': 'The lottery is done. See the Draft tab for the order, then start the draft.',
    'off-draft': L.draftOrder && L.draftOrder[L.draftIdx] && isUser(L.draftOrder[L.draftIdx].owner) ? 'You are on the clock. Pick a player on the Draft tab.' : 'The draft is underway. Follow it on the Draft tab.',
    'off-resign': L.user != null ? `Re-signing window. ${L.resign && L.resign.length ? 'You have ' + L.resign.length + ' expiring player' + (L.resign.length > 1 ? 's' : '') + ' on the Free agency tab.' : 'You have no expiring contracts.'} Anyone not re-signed becomes a free agent.` : 'Teams have made their re-signing decisions. Open free agency next.',
    'off-fa': 'Free agency is open for 10 days. Asking prices drop each day for unsigned players.',
    'off-ready': L.user != null && userRosterProblem(L) ? userRosterProblem(L) : 'Rosters are set. Start the new season when you are ready.'
  }[ph];
  let pend = '';
  if (L.mode === 'commish' && L.pending && L.pending.length) pend = `<div class="note">${L.pending.length} trade${L.pending.length > 1 ? 's are' : ' is'} waiting for your review on the <a class="lk" href="#trades">Trades</a> tab. Trades go through at the next sim step unless you veto them.</div>`;
  if (L.user != null && (L.offers || []).length) pend += `<div class="note">You have ${L.offers.length} trade offer${L.offers.length > 1 ? 's' : ''} on the <a class="lk" href="#trades" data-trtab="offers">Trades</a> tab. Teams can withdraw offers at any time.</div>`;
  if (L.user != null && L.phase === 'off-resign' && (L.teamOptions || []).length) pend += `<div class="note">You have ${L.teamOptions.length} team option decision${L.teamOptions.length > 1 ? 's' : ''} on the <a class="lk" href="#fa">Free agency</a> tab. Undecided options are exercised when free agency opens.</div>`;
  if (L.user != null && L.phase === 'off-ready' && !L.teams[L.user].scout) pend += `<div class="note">You have no scouting director. Hire one on <a class="lk" href="#myteam">My Team</a>, or the front office will pick one when the season starts.</div>`;
  return stepsBar() + careerNote() + (n ? `<div class="note">${n}</div>` : '') + pend;
}
// Where you are in the postseason/offseason, and what comes next
function stepsBar() {
  const order = [['regular-done', 'Awards'], ['playoffs', 'Playoffs'], ['season-done', 'Champion'], ['off-review', 'Review'], ['off-lottery', 'Lottery'], ['off-draft', 'Draft'], ['off-resign', 'Re-sign'], ['off-fa', 'Free agency'], ['off-ready', 'New season']];
  const i = order.findIndex(x => x[0] === L.phase); if (i < 0) return '';
  return `<div class="steps" aria-label="Season steps">${order.map(([k, n], j) => `<span class="${j < i ? 'done' : j === i ? 'now' : ''}">${j < i ? '✓ ' : ''}${n}</span>`).join('')}${i < order.length - 1 ? `<span style="background:transparent">Next: <strong>${order[i + 1][1]}</strong></span>` : ''}</div>`;
}
const RS_TXT = { y: 'Clinched the 1 seed', x: 'Clinched a playoff spot', p: 'Clinched at least a play-in spot', o: 'Out of the direct playoff spots: play-in at best', e: 'Eliminated' };
let RACE = null;
// The race around the cut lines: games back, magic numbers, remaining schedule, head-to-head and tiebreakers with neighbours
function racePanel(conf, ids) {
  const h2 = seasonH2H(L);
  const rem = (a, b) => (RACE[a].opps || []).filter(x => x === b).length;
  const third = L.teams[ids[2]], fifth = L.teams[ids[4]];
  const gb = (t, ref) => ((ref.w - t.w) + (t.l - ref.l)) / 2;
  const tb = (a, b) => { const w = h2[a + '-' + b] || 0, l = h2[b + '-' + a] || 0, left = rem(a, b); const A = L.teams[a], B = L.teams[b];
    const lead = w > l ? 'leads' : w < l ? 'trails' : 'tied in'; const cpA = A.cw / Math.max(1, A.cw + A.cl), cpB = B.cw / Math.max(1, B.cw + B.cl);
    const holder = w !== l ? (w > l ? A.abbr : B.abbr) + ' (head-to-head)' : left ? 'undecided (' + left + ' left)' : cpA !== cpB ? (cpA > cpB ? A.abbr : B.abbr) + ' (conference record)' : (A.pf - A.pa >= B.pf - B.pa ? A.abbr : B.abbr) + ' (point differential)';
    return `${lead} ${esc(B.abbr)} ${w}-${l}${left ? `, ${left} left` : ''} · tiebreaker: ${holder}`; };
  const rows = ids.slice(1, 7).map(id => { const t = L.teams[id], i = ids.indexOf(id), r = RACE[id];
    const nb = [ids[i - 1], ids[i + 1]].filter(x => x != null);
    return `<tr class="${isUser(id) ? 'mine' : ''}"><td>${i + 1}</td><td class="l">${tlabel(id)}</td><td>${t.w}-${t.l}</td><td>${i < 3 ? '—' : f1(gb(t, third))}</td><td>${i < 5 ? '—' : f1(gb(t, fifth))}</td><td>${r.gl}</td><td>${r.oppPct != null ? pct(r.oppPct, 1) : '—'} <span class="muted">(#${r.sosRank || '—'})</span></td><td>${ids.filter(o => o !== id).reduce((a, o) => a + rem(id, o), 0)}</td><td class="l wrapt" style="max-width:360px">${nb.map(o => tb(id, o)).join('<br>')}</td></tr>`; }).join('');
  return `<details class="contracts" ${ui.raceOpen ? 'open' : ''} data-raceopen="1"><summary>Playoff race · ${confName(conf)}</summary><div class="tblwrap"><table><thead><tr><th>Seed</th><th class="l">Team</th><th>W-L</th><th title="Games behind the 3rd seed">GB 3rd</th><th title="Games behind the 5th seed">GB 5th</th><th>Left</th><th title="Remaining opponents' win % (rank, 1 = hardest)">Opp win %</th><th title="Remaining games against conference rivals">Conf games left</th><th class="l">Head-to-head with neighbours</th></tr></thead><tbody>${rows}</tbody></table></div></details>`;
}
function rivalryStrip() {
  if (L.phase !== 'regular') return '';
  const games = []; for (let d = L.day; d < Math.min(L.schedule.length, L.day + 7); d++) for (const [h, a] of L.schedule[d]) if (isRivalry(L, h, a)) games.push({ d, h, a });
  if (!games.length) return '';
  const h2 = seasonH2H(L);
  return `<div class="panel"><h3>Rivalry games · next 7 days</h3>${games.map(g => `<div class="leader" style="grid-template-columns:100px minmax(0,1fr) auto"><span class="muted">${dayTxt(g.d)}</span><span>${tlabel(g.a)} @ ${tlabel(g.h)}</span><span class="muted">season ${h2[g.a + '-' + g.h] || 0}-${h2[g.h + '-' + g.a] || 0}</span></div>`).join('')}</div>`;
}
// v28.3 F3: simple line chart in the finance-chart style (inline SVG, no libraries). series: [{name, color, vals:[number|null], hi}]
function lineChartSvg(labels, series, o) {
  o = o || {}; const W = o.W || 520, H = o.H || 200, pl = 40, pr = o.pr != null ? o.pr : 44, pt = 12, pb = 28, iw = W - pl - pr, ih = H - pt - pb, n = labels.length;
  if (!n) return '';
  const all = series.flatMap(x => x.vals).filter(v => v != null);
  const lo0 = o.lo != null ? o.lo : Math.min(...all), hi0 = o.hi != null ? o.hi : Math.max(...all), span = Math.max(1, hi0 - lo0), st = [1, 2, 5, 10, 20, 25, 50].find(x => span / x <= 6) || 100;
  const lo = Math.floor(lo0 / st) * st, hi = Math.max(lo + st, Math.ceil(hi0 / st) * st);
  const X = i => pl + (n === 1 ? iw / 2 : iw * i / (n - 1)), Y = v => pt + ih - (v - lo) / (hi - lo) * ih;
  let g = ''; for (let v = lo; v <= hi + 1e-9; v += st) g += `<line x1="${pl}" x2="${W - pr}" y1="${Y(v)}" y2="${Y(v)}" stroke="var(--line)" stroke-width="1" opacity=".5"/><text x="${pl - 6}" y="${Y(v) + 4}" text-anchor="end" font-size="11" fill="var(--muted)">${v}</text>`;
  const every = Math.ceil(n / 8);
  const xl = labels.map((l, i) => ((i % every === 0 && (i === n - 1 || n - 1 - i >= every)) || i === n - 1) ? `<text x="${X(i)}" y="${H - 8}" text-anchor="middle" font-size="11" fill="var(--muted)">${esc(l)}</text>` : '').join('');
  const ends = [];
  const lines = series.map(sr => {
    const pts = sr.vals.map((v, i) => v == null ? null : [X(i), Y(v)]), segs = []; let cur = [];
    pts.forEach(q => { if (q) cur.push(q); else if (cur.length) { segs.push(cur); cur = []; } }); if (cur.length) segs.push(cur);
    const w = sr.hi ? 2.5 : 1.5, op = sr.dim ? 0.35 : 1;
    const dots = n <= 30 ? pts.map((q, i) => q ? `<g><circle cx="${q[0]}" cy="${q[1]}" r="${sr.hi ? 4 : 3}" fill="${sr.color}" stroke="var(--surface)" stroke-width="1.5" opacity="${op}"/><circle cx="${q[0]}" cy="${q[1]}" r="10" fill="transparent"><title>${esc(sr.name)} · ${esc(labels[i])}: ${sr.vals[i]}${sr.tip ? sr.tip(i) : ''}</title></circle></g>` : '').join('') : '';
    const last = [...pts].reverse().find(Boolean);
    if (o.endLabels && last) ends.push({ x: last[0] + 5, y: last[1] + 4, t: sr.short || sr.name, c: sr.color, op });
    return segs.map(sg => `<polyline points="${sg.map(q => q.join(',')).join(' ')}" fill="none" stroke="${sr.color}" stroke-width="${w}" stroke-linejoin="round" opacity="${op}"/>`).join('') + dots;
  }).join('');
  ends.sort((a, b) => a.y - b.y); for (let i = 1; i < ends.length; i++) if (ends[i].y < ends[i - 1].y + 10) ends[i].y = ends[i - 1].y + 10;   // keep end labels apart
  const over = ends.length ? Math.max(0, ends[ends.length - 1].y - (H - pb + 4)) : 0; if (over) ends.forEach(e => { e.y -= over; });
  const endsSvg = ends.map(e => `<text x="${e.x}" y="${e.y}" font-size="10" fill="${e.c}" opacity="${e.op}">${esc(e.t)}</text>`).join('');
  return `<svg class="lchart" viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="${esc(o.aria || 'Line chart')}" style="max-width:${W}px;display:block">${g}${lines}${endsSvg}${xl}</svg>`;
}
const RACE_COLORS = ['#2563eb', '#dc2626', '#16a34a', '#d97706', '#7c3aed', '#0891b2', '#db2777', '#65a30d', '#ea580c', '#475569', '#0d9488', '#9333ea', '#ca8a04', '#be123c', '#4f46e5'];
// player page: overall rating at the end of each season it was tracked + now
function ovrChart(p) {
  if (p.prospect) return '';
  const rows = p.hist.filter(h => h.s != null && h.ovr != null).map(h => [h.s, h.ovr]);
  if (!p.retired && (!rows.length || rows[rows.length - 1][0] !== L.season)) rows.push([L.season, p.ovr]);
  if (rows.length < 2) return '';
  const svg = lineChartSvg(rows.map(r => seasonName(r[0]).slice(2)), [{ name: 'Overall', color: 'var(--accent)', vals: rows.map(r => r[1]), hi: 1 }], { aria: 'Overall rating by season', pr: 12, H: 180 });
  return `<section class="panel" style="margin-bottom:16px"><h3>Overall rating by season</h3>${svg}<div class="muted" style="font-size:12px;margin-top:4px">The chart starts when ratings were first tracked. Last point: rating now.</div></section>`;
}
// standings: wins by game day (L.race, saved every 7 days) for one conference
function raceChart() {
  const R = L.race; if (!R || R.s !== L.season || R.d.length < 2) return '';
  const c = ui.raceConf === 'South' ? 'South' : 'North', ids = seedOrder(L, c);
  const days = [0, ...R.d], labels = days.map(d => d ? 'Day ' + d : 'Start');
  const series = ids.map((id, i) => ({ name: L.teams[id].abbr, short: L.teams[id].abbr, color: RACE_COLORS[i % RACE_COLORS.length], vals: [0, ...R.w.map(w => w[id])], hi: isUser(id), dim: L.user != null && !isUser(id) && i >= 6 }));
  const sel = `<div class="subtabs">${['North', 'South'].map(k => `<button class="sm ${k === c ? 'primary' : ''}" data-racec="${k}">${confName(k)}</button>`).join('')}</div>`;
  return `<section class="panel"><h3>Standings race · wins by game day</h3>${sel}${lineChartSvg(labels, series, { aria: confName(c) + ' Conference wins by game day', lo: 0, endLabels: 1, H: 300, W: 560 })}<div class="muted" style="font-size:12px;margin-top:4px">Saved every 7 game days. Hover a point for the team and wins.</div></section>`;
}
// team history: franchise wins by sim season (+ this season so far, faded)
function franchiseChart(t) {
  const rows = (L.history || []).map(h => { const x = (h.standings || []).find(z => z.tid === t.id); return x ? [h.s, x.w, x.l] : null; }).filter(Boolean);
  const inS = ['regular', 'regular-done', 'playoffs'].includes(L.phase) && t.w + t.l > 0 && !rows.some(r => r[0] === L.season);
  if (inS) rows.push([L.season, t.w, t.l]);
  if (!rows.length) return '';
  const champ = new Set((L.history || []).filter(h => h.champion === t.id).map(h => h.s));
  const svg = lineChartSvg(rows.map(r => seasonName(r[0]).slice(2) + (inS && r[0] === L.season ? '*' : '')), [{ name: 'Wins', color: 'var(--accent)', vals: rows.map(r => r[1]), hi: 1, tip: i => ` (${rows[i][1]}-${rows[i][2]})${champ.has(rows[i][0]) ? ' · Champions' : ''}` }], { aria: 'Franchise wins by season', lo: 0, pr: 12, H: 180 });
  return `<section class="panel" style="margin-bottom:16px"><h3>Franchise wins by season</h3>${svg}<div class="muted" style="font-size:12px;margin-top:4px">${inS ? '* this season so far.' : ''}</div></section>`;
}
function vStandings() {
  RACE = ['regular', 'regular-done'].includes(L.phase) && L.day > 0 ? raceInfo(L) : null;
  const conf = c => {
    const ids = seedOrder(L, c);
    const race = ['regular', 'regular-done'].includes(L.phase) && L.day > 0 ? RACE : null;
    const rows = ids.map((id, i) => {
      const ri = race && race[id];
      const rcols = race ? `<td>${ri.gl}</td><td>${ri.m3 != null ? ri.m3 : '—'}</td><td>${ri.m5 != null ? ri.m5 : '—'}</td><td title="Opponents' win % ${ri.oppPct != null ? pct(ri.oppPct, 1) : '—'}">${ri.sosRank || '—'}</td>` : '';
      const t = L.teams[id]; const gp = t.w + t.l, d = gp ? (t.pf - t.pa) / gp : 0;
      const lead = L.teams[ids[0]]; const gb = ((lead.w - t.w) + (t.l - lead.l)) / 2;
      const strk = t.streak ? (t.streak > 0 ? 'W' + t.streak : 'L' + (-t.streak)) : '—';
      const l10 = t.last10 || '';
      const D = poDirect(L), P = poPlayinTo(L), tag = i < D ? '' : i < P ? ' <span class="pill pos">Play-in</span>' : '';
      return `<tr class="click ${i === D - 1 || i === P - 1 ? 'sep' : ''} ${isUser(t.id) ? 'mine' : ''}" data-team="${t.id}"><td>${i + 1}</td><td class="l">${tlabel(t.id, true)}${ri && ri.status ? `<span class="rs ${ri.status}" title="${RS_TXT[ri.status]}">${ri.status}</span>` : ''}${tag}</td>${L.nba ? `<td class="l muted">${esc(t.div || '')}</td>` : ''}<td class="l">${modePill(t)}</td><td><strong>${t.w}</strong></td><td><strong>${t.l}</strong></td><td>${gp ? pct(t.w, gp) : '.000'}</td><td>${gb ? gb.toFixed(1) : '—'}</td><td>${t.cw}-${t.cl}</td><td>${t.hw}-${t.hl}</td><td>${t.aw || 0}-${t.al || 0}</td><td class="${d > 0 ? 'w' : d < 0 ? 'lo' : ''}">${gp ? (d > 0 ? '+' : '') + f1(d) : '—'}</td><td>${strk}</td><td>${l10.split('').filter(x => x === 'W').length}-${l10.split('').filter(x => x === 'L').length}</td>${rcols}</tr>`;
    }).join('');
    return `<section class="panel"><h2>${confName(c)} Conference</h2><div class="tblwrap"><table><thead><tr><th>Seed</th><th class="l">Team</th>${L.nba ? '<th class="l">Div</th>' : ''}<th class="l">Outlook</th><th>W</th><th>L</th><th>Pct</th><th>GB</th><th>Conf</th><th>Home</th><th>Away</th><th>Diff</th><th>Strk</th><th>L10</th>${race ? `<th title="Games left">Left</th><th title="Magic number to clinch a top-${poDirect(L)} (playoff) spot">Magic top ${poDirect(L)}</th><th title="Magic number to clinch a top-${poPlayinTo(L)} (play-in or better) spot">Magic top ${poPlayinTo(L)}</th><th title="Strength of remaining schedule: 1 = hardest">SOS left</th>` : ''}</tr></thead><tbody>${rows}</tbody></table></div>${race ? racePanel(c, ids) : ''}</section>`;
  };
  const lastDay = L.day - 1;
  const poLast = L.po && L.po.day > 0 ? L.po.day - 1 : null;
  const recent = poLast != null ? L.games.filter(g => g.playoff && g.poDay === poLast) : lastDay >= 0 ? L.games.filter(g => g.day === lastDay && !g.playoff) : [];
  const next = L.phase === 'regular' && L.day < L.schedule.length ? L.schedule[L.day] : [];
  const br = L.po ? `<section class="panel" style="margin-bottom:16px"><h2>${seasonName(L.season)} playoffs${L.po.champion != null ? ' · Champions: ' + esc(tname(L.po.champion)) : ''} <button class="sm" data-brcols="1" style="float:right;font-weight:400">${ui.brCols ? 'Bracket view' : 'Round view'}</button></h2>${bracket(L.po.rounds)}</section>` : '';
  return `${phaseNote()}${br}${L.user == null ? storyBox() : ''}<div class="grid2"><div class="stack">${conf('North')}${conf('South')}${raceChart()}<details class="about"><summary>How this works</summary><p>${isBig(L) ? 'Top 6 in each conference make the playoffs. Seeds 7–10 play in: 7 vs 8 (the winner is the 7 seed) and 9 vs 10; the 7/8 loser then hosts the 9/10 winner for the 8 seed. The first round is 1–8, 4–5, 2–7, 3–6.' : 'Top 3 in each conference make the playoffs. Seeds 4 and 5 play in for the last spot (the 4 seed needs one win, the 5 seed two straight).'} Ties break on head-to-head record this season (among all tied teams), then conference record, then point differential. Marks: y clinched the 1 seed · x clinched a playoff spot · p clinched a play-in spot or better · o play-in at best · e eliminated. Clinches are conservative: a team is only marked when it would hold the spot even losing every tiebreaker. Magic number: wins by the team, or losses by the closest chaser, needed to clinch. SOS left: strength of the remaining schedule (1 = hardest), from opponents' power-ranking scores. Outlook is each front office's plan, reviewed at the 20%, 40% and 60% marks. During the playoffs the bracket shows at the top of this page.</p></details></div>
    <section class="stack">${rivalryStrip()}${prPanel()}<div class="panel"><h3>${poLast != null ? 'Latest playoff results' : lastDay >= 0 ? 'Latest results · ' + dayTxt(lastDay) : 'Latest results'}</h3>${recent.length ? `<div class="games">${recent.map(gameCard).join('')}</div>` : '<p class="muted">No recent games.</p>'}</div>
    ${next.length ? `<div class="panel"><h3>Next up · ${dayTxt(L.day)}</h3><div class="games">${next.map(([h, a]) => `<div class="game" data-team="${h}"><div class="t">${tlabel(a)}&nbsp;${esc(L.teams[a].name)}</div><div class="s muted">${L.teams[a].w}-${L.teams[a].l}</div><div class="t">${logo(h)}@ ${esc(L.teams[h].abbr)}&nbsp;${esc(L.teams[h].name)}</div><div class="s muted">${L.teams[h].w}-${L.teams[h].l}</div>${isRivalry(L, h, a) ? '<div class="tag">Rivalry game</div>' : ''}<div style="margin-top:6px">${scoutBtn(h, a)}</div></div>`).join('')}</div></div>` : ''}</section></div>`;
}
function prb(tid) { const b = prBlurb(L, tid); return b ? `<div class="muted prb">${esc(b)}</div>` : ''; }
function prPanel() {
  if (!L.pr || !L.pr.now) return '';
  const prev = L.pr.prev;
  const rows = L.pr.now.map((tid, i) => { const t = L.teams[tid], gp = t.w + t.l, pi = prev ? prev.indexOf(tid) : -1, mv = pi >= 0 ? pi - i : 0; const l10 = t.last10 || '';
    return `<tr class="click ${isUser(tid) ? 'mine' : ''}" data-team="${tid}"><td>${i + 1}</td><td>${mv > 0 ? `<span class="pr-up">▲${mv}</span>` : mv < 0 ? `<span class="pr-dn">▼${-mv}</span>` : '<span class="muted">–</span>'}</td><td class="l">${tlabel(tid, true)}${prb(tid)}</td><td>${t.w}-${t.l}</td><td>${l10 ? l10.split('').filter(x => x === 'W').length + '-' + l10.split('').filter(x => x === 'L').length : '—'}</td><td class="${gp && t.pf > t.pa ? 'w' : gp && t.pf < t.pa ? 'lo' : ''}">${gp ? sgn((t.pf - t.pa) / gp) : '—'}</td></tr>`; }).join('');
  return `<div class="panel"><h3>Power rankings · ${L.pr.day ? 'after day ' + L.pr.day : 'preseason'}</h3><div class="tblwrap"><table><thead><tr><th>#</th><th title="Change since the last update">Move</th><th class="l">Team</th><th>W-L</th><th>L10</th><th title="Point differential per game">Net</th></tr></thead><tbody>${rows}</tbody></table></div><details class="about"><summary>How this works</summary><p>Updated weekly. Early in the season it leans on roster strength (healthy players only); as games pile up it weighs record, point differential and the last 10 games more.</p></details></div>`;
}
// v25.5: weekly report (refreshes every 7 game days): headlines, big injuries, MVP ladder, power rankings
function vWeekly() {
  const w = L.wk && L.wk.s === L.season ? L.wk : null;
  if (!w) return `<h2>Weekly report</h2><p class="muted">The first report comes out after day 7 of the regular season, then every 7 days.</p>`;
  const arrow = d => d > 0 ? `<span class="w">▲${d}</span>` : d < 0 ? `<span class="lo">▼${-d}</span>` : '<span class="muted">–</span>';
  const prank = w.prPrev, mprev = w.mvpPrev;
  const heads = w.heads.length ? w.heads.map(h => `<div class="leader" style="grid-template-columns:minmax(0,1fr)"><span>${esc(h)}</span></div>`).join('') : '<p class="muted">A quiet week.</p>';
  const injs = w.inj.length ? `<div class="tblwrap"><table><thead><tr><th class="l">Player</th><th class="l">Team</th><th class="l">Injury</th><th>Out</th></tr></thead><tbody>${w.inj.map(x => { const p = L.players[x.pid]; return p ? `<tr class="click ${isUser(x.tid) ? 'mine' : ''}" data-player="${p.id}"><td class="l">${esc(p.name)} <span class="muted">${p.ovr}</span>${x.fresh ? ' <span class="pill inj">New</span>' : ''}</td><td class="l">${tlabel(x.tid)}</td><td class="l">${esc(x.name)}</td><td>${x.games} g</td></tr>` : ''; }).join('')}</tbody></table></div>` : '<p class="muted">No major injuries.</p>';
  const mvp = w.mvp.length ? `<div class="tblwrap"><table><thead><tr><th>#</th><th>Move</th><th class="l">Player</th><th class="l">Team</th><th>Pts</th><th>Reb</th><th>Ast</th></tr></thead><tbody>${w.mvp.map((x, i) => { const p = L.players[x.pid], pi = mprev ? mprev.indexOf(x.pid) : -1; return p ? `<tr class="click" data-player="${p.id}"><td>${i + 1}</td><td>${mprev ? (pi < 0 ? '<span class="pill pos">New</span>' : arrow(pi - i)) : '–'}</td><td class="l">${esc(p.name)}</td><td class="l">${tlabel(x.tid)}</td><td>${x.pts}</td><td>${x.reb}</td><td>${x.ast}</td></tr>` : ''; }).join('')}</tbody></table></div>` : '<p class="muted">No qualified candidates yet.</p>';
  const rows = (arr, off) => arr.map((tid, k) => { const i = off + k, t = L.teams[tid], pi = prank ? prank.indexOf(tid) : -1; return `<tr class="click ${isUser(tid) ? 'mine' : ''}" data-team="${tid}"><td>${i + 1}</td><td>${prank ? arrow(pi - i) : '–'}</td><td class="l">${tlabel(tid, true)}${prb(tid)}</td><td>${t.w}-${t.l}</td></tr>`; }).join('');
  const pr = `<div class="tblwrap"><table><thead><tr><th>#</th><th>Move</th><th class="l">Team</th><th>W-L</th></tr></thead><tbody>${rows(w.pr.slice(0, 10), 0)}${w.pr.length > 14 ? `<tr><td colspan="4" class="muted">…</td></tr>${rows(w.pr.slice(-4), w.pr.length - 4)}` : ''}</tbody></table></div>`;
  const mine = L.user != null ? w.pr.indexOf(L.user) : -1;
  return `<h2>Weekly report · ${w.final ? 'final week' : 'week ' + w.n} (after day ${w.day})</h2>${mine >= 0 ? `<div class="note">${esc(tname(L.user))}: #${mine + 1} in the power rankings${prank ? ' (' + (prank.indexOf(L.user) - mine > 0 ? 'up ' + (prank.indexOf(L.user) - mine) : prank.indexOf(L.user) - mine < 0 ? 'down ' + (mine - prank.indexOf(L.user)) : 'unchanged') + ' from last week)' : ''}.</div>` : ''}
  <div class="panel" style="margin-bottom:16px"><h3>Headlines</h3>${heads}</div>
  <div class="grid2e" style="margin-bottom:16px"><div class="panel"><h3>MVP ladder</h3>${mvp}</div><div class="panel"><h3>Power rankings</h3>${pr}</div></div>
  <div class="panel"><h3>Big injuries</h3>${injs}</div>`;
}
function vPreview() {
  const S = L.season;
  const act = Object.values(L.players).filter(p => p.team != null && !p.retired);
  const best = act.slice().sort((a, b) => ovrNum(b) - ovrNum(a)).slice(0, 12);
  const lastTid = p => { const h = p.hist.filter(x => x.s === S - 1).pop(); return h ? h.tid : undefined; };
  const movers = act.filter(p => { const lt = lastTid(p); return lt !== undefined && lt !== p.team; }).sort((a, b) => ovrNum(b) - ovrNum(a)).slice(0, 12);
  const rookies = act.filter(p => p.rookieSeason === S).sort((a, b) => ovrNum(b) - ovrNum(a) || b.scout - a.scout).slice(0, 10);
  const deals = []; for (const p of act) for (const c of p.contracts) if (c.s === S && ['signing', 're-sign', 'extension'].includes(c.type) && c.amt > MINSAL) deals.push({ p, c });
  deals.sort((a, b) => b.c.amt - a.c.amt);
  const newCoaches = L.teams.filter(t => { const st = t.coach.stints[t.coach.stints.length - 1]; return st && st.tid === t.id && st.from === S && S > 1; });
  const pr = (L.pr && L.pr.now) || L.teams.map(t => t.id);
  const pl = (p, extra) => `<tr class="click" data-player="${p.id}"><td class="l">${esc(p.name)}</td><td class="l">${tlabel(p.team)}</td><td class="l">${posLabel(p)}</td><td>${p.age}</td><td><strong>${ovrTxt(p)}</strong></td>${extra || ''}</tr>`;
  const tbl = (head, rows, empty) => rows ? `<div class="tblwrap"><table><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table></div>` : `<p class="muted">${empty}</p>`;
  const H = '<th class="l">Player</th><th class="l">Team</th><th class="l">Pos</th><th>Age</th><th>Ovr</th>';
  const ut = L.user != null ? L.teams[L.user] : null;
  const storyBox = (() => { const th = L.story && L.story.s === S ? L.story.th : []; const last = (L.storyHist || {})[S - 1] || []; if (!th.length && !last.length) return ''; return `<div class="grid2e" style="margin-bottom:16px"><div class="panel"><h3>Storylines</h3>${th.length ? th.map(x => `<div class="leader" style="grid-template-columns:minmax(0,1fr)"><span><strong>${esc(storyTitle(L, x))}</strong><br><span class="muted">${esc(storyStatus(L, x))}</span></span></div>`).join('') : '<p class="muted">Set at the start of the season.</p>'}</div><div class="panel"><h3>Last season's stories</h3>${last.length ? last.map(x => `<div><strong>${esc(x.t)}</strong> <span class="muted">${esc(x.r)}</span></div>`).join('') : '<p class="muted">None yet.</p>'}</div></div>`; })();
  return `<h2>${seasonName(S)} season preview <span class="muted" style="font-size:14px;font-weight:400">· ${SEASON_GAMES}-game season</span></h2>${storyBox}${ut ? `<div class="note">${esc(tname(ut.id))}: ranked #${pr.indexOf(ut.id) + 1} in the preseason power rankings · front office outlook: ${MODE_LABEL[ut.mode]} · expected about ${Math.round((ut.expW || 0.5) * SEASON_GAMES)} wins.</div>` : ''}
  ${favoritesBox()}
  <div class="grid2e" style="margin-bottom:16px"><div class="panel"><h3>Top teams</h3>${tbl('<th>#</th><th class="l">Team</th><th class="l">Outlook</th><th title="Wins the front office expects">Exp. W</th><th class="l">Best player</th><th class="l">Coach</th>', pr.slice(0, 8).map((tid, i) => { const t = L.teams[tid], b = teamPlayers(tid).sort((a, c) => c.ovr - a.ovr)[0]; return `<tr class="click ${isUser(tid) ? 'mine' : ''}" data-team="${tid}"><td>${i + 1}</td><td class="l">${tlabel(tid, true)}</td><td class="l">${modePill(t)}</td><td>${Math.round((t.expW || 0.5) * SEASON_GAMES)}</td><td class="l">${b ? esc(b.name) + ' <span class="muted">' + b.ovr + '</span>' : '—'}</td><td class="l">${esc(t.coach.name)}</td></tr>`; }).join(''), '')}</div>
  <div class="panel"><h3>Best players</h3>${tbl(H, best.map(p => pl(p)).join(''), '')}</div></div>
  <div class="grid2e" style="margin-bottom:16px"><div class="panel"><h3>Best players on new teams</h3>${tbl(H + '<th class="l">Last season</th>', movers.map(p => pl(p, `<td class="l">${tlabel(lastTid(p))}</td>`)).join(''), S === 1 ? 'Everyone is new in the league\'s first season.' : 'No notable moves.')}</div>
  <div class="panel"><h3>Top rookies</h3>${tbl(H + `<th>${potHead()}</th><th>Pick</th>`, rookies.map(p => pl(p, `<td>${potCell(p)}</td><td>${p.draft ? p.draft.rd + '-' + p.draft.no : 'Undrafted'}</td>`)).join(''), S === 1 ? 'No rookies in the first season; the first draft is after Year 1.' : 'No rookies on rosters.')}</div></div>
  <div class="grid2e"><div class="panel"><h3>Biggest contracts this offseason</h3>${tbl('<th class="l">Player</th><th class="l">Team</th><th class="l">Type</th><th>Per year</th><th>Years</th>', deals.slice(0, 10).map(({ p, c }) => `<tr class="click" data-player="${p.id}"><td class="l">${esc(p.name)}</td><td class="l">${tlabel(c.tid)}</td><td class="l">${esc(c.type)}</td><td>${money(c.amt)}</td><td>${c.yrs}</td></tr>`).join(''), 'No new contracts yet.')}</div>
  <div class="panel"><h3>New head coaches</h3>${newCoaches.length ? newCoaches.map(t => `<div class="leader" style="grid-template-columns:minmax(0,1fr) auto"><span>${tlabel(t.id, true)}</span><span>${clink(t.coach)} <span class="muted">${t.coach.ovr}</span></span></div>`).join('') : '<p class="muted">No coaching changes.</p>'}</div></div>`;
}
function vSchedule() {
  const total = L.schedule.length;
  if (!L.schedule.length) return `<section class="panel"><h2>Schedule</h2><p class="muted">No schedule yet.</p></section>`;
  if (ui.day == null) ui.day = Math.max(0, Math.min(L.day - 1, total - 1));
  const d = ui.day;
  const played = d < L.day && L.phase === 'regular' || (L.phase !== 'regular' && L.games.some(g => g.day === d && !g.playoff));
  const opts = L.schedule.map((_, i) => `<option value="${i}" ${i === d ? 'selected' : ''}>Day ${i + 1}${dd(i) ? ' · ' + dd(i) : ''}</option>`).join('');
  let body;
  if (played) body = `<div class="grid3">${L.games.filter(g => g.day === d && !g.playoff).map(gameCard).join('')}</div>`;
  else if (L.phase.startsWith('off')) body = '<p class="muted">Box scores from last season are archived. The new schedule appears when the season starts.</p>';
  else body = `<div class="grid3">${L.schedule[d].map(([h, a]) => `<div class="game" data-team="${h}"><div class="t">${tlabel(a, true)}</div><div class="s muted">${L.teams[a].w}-${L.teams[a].l}</div><div class="t">${logo(h)}@ ${esc(tname(h))}</div><div class="s muted">${L.teams[h].w}-${L.teams[h].l}</div><div class="tag">Not played yet</div><div style="margin-top:6px">${scoutBtn(h, a)}</div></div>`).join('')}</div>`;
  return `<section class="panel"><h2>Schedule <span class="muted" style="font-size:14px;font-weight:400">· ${SEASON_GAMES}-game season</span></h2><div class="row" style="margin-bottom:12px"><button id="d-prev" ${d <= 0 ? 'disabled' : ''}>Previous day</button><select id="d-sel" aria-label="Day">${opts}</select><button id="d-next" ${d >= total - 1 ? 'disabled' : ''}>Next day</button><span class="muted">${L.schedule[d].length} games · trades open from day ${tradeOpenDay(L) + 1} to day ${deadlineDay(L)} (trade deadline) · buyouts until day ${buyoutDeadlineDay(L)}</span></div>${body}</section>`;
}

function vLeaders() {
  const rs = sx, pg = pgx, po = skey() === 'po'; computeAdv(L, skey());
  const ps = Object.values(L.players).filter(p => p.team != null && rs(p) && rs(p).gp > 0);
  if (!ps.length) return `<section class="panel"><p class="muted">${po ? 'Playoff leaders appear once playoff games are played.' : 'Leaders appear once games are played this season.'} Past seasons are on the History tab.</p></section>`;
  const maxGp = maxGpNow();
  const qual = ps.filter(p => isQual(p, skey()));
  const cats = [
    ['Points', p => pg(p, 'pts'), f1, qual], ['Rebounds', p => pg(p, 'orb') + pg(p, 'drb'), f1, qual], ['Assists', p => pg(p, 'ast'), f1, qual],
    ['Steals', p => pg(p, 'stl'), f1, qual], ['Blocks', p => pg(p, 'blk'), f1, qual], ['3-pointers made', p => pg(p, 'tpm'), f1, qual],
    ['Field goal %', p => rs(p).fgm / rs(p).fga, x => pct(x, 1), qual.filter(p => qualOk(p, 'fg'))],
    ['3-point %', p => rs(p).tpm / rs(p).tpa, x => pct(x, 1), qual.filter(p => qualOk(p, 'tp'))],
    ['Free throw %', p => rs(p).ftm / rs(p).fta, x => pct(x, 1), qual.filter(p => qualOk(p, 'ft'))],
    ['Usage rate', p => usg(rs(p)), x => f1(x) + '%', qual.filter(p => qualOk(p, 'min'))], ['Plus-minus per game', p => pmPg(rs(p)), sgn, qual.filter(p => qualOk(p, 'min'))], ['True shooting %', p => tsPct(rs(p)), x => pct(x, 1), qual.filter(p => qualOk(p, 'fg'))], ['Minutes', p => pg(p, 'min') / 60, f1, qual], ['Turnovers', p => pg(p, 'tov'), f1, qual],
    ['Offensive rebounds', p => pg(p, 'orb'), f1, qual], ['Defensive rebounds', p => pg(p, 'drb'), f1, qual],
    ['Box plus-minus', p => rs(p).bpm != null ? rs(p).bpm : -99, sgn, qual.filter(p => qualOk(p, 'min'))], ['Defensive box plus-minus', p => rs(p).dbpm != null ? rs(p).dbpm : -99, sgn, qual.filter(p => qualOk(p, 'min'))],
    ['PER', p => rs(p).per != null ? rs(p).per : -99, f1, qual.filter(p => qualOk(p, 'min'))], ['Win shares', p => rs(p).ws != null ? rs(p).ws : -99, f1, ps], ['Win shares per 48', p => rs(p).ws48 != null ? rs(p).ws48 : -99, ws48Txt, qual.filter(p => qualOk(p, 'min'))],
    ['Defensive win shares', p => rs(p).dws != null ? rs(p).dws : -99, f1, ps], ['VORP', p => rs(p).vorp != null ? rs(p).vorp : -99, f1, ps]   // v33c
  ];
  return `<p class="muted" style="margin:0 0 8px"><span class="tipword" title="Qualified players have played at least half of their team's ${po ? 'playoff ' : ''}games so far (after 10 team games, 5 games). Percentages also need enough attempts (see the Players tab for the exact rules).">Per game · ${po ? 'playoffs' : 'regular season'}</span></p><div class="grid3">${cats.map(([name, fn, fmt, pool]) => {
    const top = pool.slice().sort((a, b) => fn(b) - fn(a)).slice(0, 8);
    return `<div class="panel"><h3>${name}</h3>${top.map((p, i) => `<div class="leader ${isUser(p.team) ? 'mine' : ''}"><span class="muted">${i + 1}</span><span>${logo(p.team)}${plink(p)} <span class="muted">${L.teams[p.team].abbr}</span></span><span class="v">${fmt(fn(p))}</span></div>`).join('') || '<p class="muted">No qualifiers yet.</p>'}</div>`;
  }).join('')}</div>`;
}

function seriesCard(sr, stageIdx, pin, short) {
  pin = pin != null ? pin : stageIdx === 0;
  const t = id => L.teams[id];
  const line = (id, seed, w) => `<div class="t ${sr.winner === id ? 'won' : ''} ${isUser(id) ? 'me' : ''}" style="${sr.winner != null && sr.winner !== id ? 'opacity:.55' : ''}"><span class="muted" style="width:22px;display:inline-block">${seed}</span>${short ? `<a class="lk tl" data-team="${id}">${logo(id)}${esc(L.teams[id].city)}</a>` : tlabel(id, true)}</div><div class="s ${sr.winner === id ? 'won' : 'muted'}">${w}</div>`;
  const status = sr.winner != null
    ? `${t(sr.winner).abbr} ${pin ? 'advance' : 'win ' + Math.max(sr.hw, sr.lw) + '-' + Math.min(sr.hw, sr.lw)}`
    : pin && sr.best === 1 ? 'Single game' : pin ? (sr.lw === 0 ? `${t(sr.hi).abbr} need 1 win · ${t(sr.lo).abbr} need 2 straight` : `${t(sr.lo).abbr} won game 1 · winner-take-all game 2`)
    : sr.hw === sr.lw ? (sr.hw ? `Series tied ${sr.hw}-${sr.lw}` : `Best of ${sr.best} · not started`) : `${t(sr.hw > sr.lw ? sr.hi : sr.lo).abbr} lead ${Math.max(sr.hw, sr.lw)}-${Math.min(sr.hw, sr.lw)}`;
  const games = (sr.games || []).map(id => { const g = L.games[id - 1]; return g ? `<a class="lk" data-game="${id}">G${g.gnum}: ${t(g.away).abbr} ${g.as}, ${t(g.home).abbr} ${g.hs}${g.ot ? ' (OT)' : ''}</a>` : ''; }).join(' · ');
  return `<div class="panel series ${isUser(sr.hi) || isUser(sr.lo) ? 'myseries' : ''}">${line(sr.hi, sr.hiSeed, sr.hw)}${line(sr.lo, sr.loSeed, sr.lw)}<div class="tag">${status}</div>${games ? `<div class="tag">${games}</div>` : ''}${sr.winner == null && L.phase === 'playoffs' ? scoutBtn(hiHome(sr, sr.games.length + 1) ? sr.hi : sr.lo, hiHome(sr, sr.games.length + 1) ? sr.lo : sr.hi) : ''}</div>`;
}
// v30b #18: the whole bracket in one window, like the NBA graphic: first conference left, second right, Finals in the center,
// play-in boxes outside, winners move toward the middle. Future slots fill in as series end (TBD until then).
function bracketOne(rounds) {
  const big = rounds.length > 4 || (rounds[0] && (rounds[0].series || rounds[0]).length === 4) || (L.po && L.po.big && rounds === L.po.rounds);
  const po = L.po && rounds === L.po.rounds ? L.po : null;
  const left = L.nba ? 'South' : 'North', right = left === 'North' ? 'South' : 'North';
  const R = i => rounds[i] ? (rounds[i].series || rounds[i]) : [];
  const T = (id, seed) => id == null ? { seed, text: 'TBD' } : { id, seed };
  const winOf = c => c && c.sr && c.sr.winner != null ? T(c.sr.winner, c.sr.winner === c.sr.hi ? c.sr.hiSeed : c.sr.loSeed) : null;
  const real = (sr, lab) => ({ sr, lab });
  const ph = (a, b, lab) => ({ a: a || { text: 'TBD' }, b: b || { text: 'TBD' }, lab });
  const feed = (prev, n, lab) => Array.from({ length: n }, (_, k) => prev[2 * k] && prev[2 * k + 1] ? ph(winOf(prev[2 * k]), winOf(prev[2 * k + 1]), lab) : ph(null, null, lab));
  const side = c => {
    const own = i => R(i).filter(sr => sr.conf === c), seeds = po && po.seeds ? po.seeds[c] : null;
    let pi = [], r1 = [], r2, cf;
    if (big) {
      pi = [...own(0).map((sr, k) => real(sr, k ? '9 vs 10' : '7 vs 8')), ...(own(1).length ? own(1).map(sr => real(sr, '8-seed game')) : seeds ? [ph({ text: 'Loser 7/8' }, { text: 'Winner 9/10' }, '8-seed game')] : [])];
      r1 = own(2).length ? own(2).map(sr => real(sr)) : seeds ? (() => { const seven = po.seven && po.seven[c], eight = own(1)[0] && own(1)[0].winner; return [ph(T(seeds[0], 1), T(eight, 8)), ph(T(seeds[3], 4), T(seeds[4], 5)), ph(T(seeds[1], 2), T(seven, 7)), ph(T(seeds[2], 3), T(seeds[5], 6))]; })() : [];
      r2 = own(3).length ? own(3).map(sr => real(sr)) : feed(r1, 2);
      cf = own(4).length ? own(4).map(sr => real(sr)) : feed(r2, 1);
    } else {
      pi = own(0).map(sr => real(sr, '4 vs 5'));
      r1 = [];
      r2 = own(1).length ? own(1).map(sr => real(sr)) : seeds ? [ph(T(seeds[0], 1), winOf(pi[0]) ? { ...winOf(pi[0]), seed: 4 } : { seed: 4, text: 'TBD' }), ph(T(seeds[1], 2), T(seeds[2], 3))] : [];
      cf = own(2).length ? own(2).map(sr => real(sr)) : feed(r2, 1);
    }
    return { pi, r1, r2, cf };
  };
  const SL = side(left), SR = side(right), fin = R(big ? 5 : 3)[0];
  const F = fin ? real(fin) : ph(winOf(SL.cf[0]), winOf(SR.cf[0]));
  const ln = (x, w, won, lost) => `<div class="bl ${won ? 'won' : ''} ${lost ? 'lost' : ''} ${x && x.id != null && isUser(x.id) ? 'me' : ''}"><span class="bseed">${x && x.seed != null ? x.seed : ''}</span>${x && x.id != null ? `<a class="lk tl" data-team="${x.id}">${logo(x.id, 16)}<span class="bab">${esc(L.teams[x.id].abbr)}</span></a>` : `<span class="muted">${esc((x && x.text) || 'TBD')}</span>`}<span class="bw">${w == null ? '' : w}</span></div>`;
  const bc = c => {
    if (c.sr) { const sr = c.sr, t = id => L.teams[id].abbr, w = sr.winner;
      const st = w != null ? (sr.best === 1 ? `${t(w)} won` : `${t(w)} win ${Math.max(sr.hw, sr.lw)}-${Math.min(sr.hw, sr.lw)}`) : sr.hw === sr.lw ? (sr.hw ? `Tied ${sr.hw}-${sr.lw}` : '') : `${t(sr.hw > sr.lw ? sr.hi : sr.lo)} lead ${Math.max(sr.hw, sr.lw)}-${Math.min(sr.hw, sr.lw)}`;
      return `<div class="bser ${isUser(sr.hi) || isUser(sr.lo) ? 'myseries' : ''}">${c.lab ? `<div class="blab">${c.lab}</div>` : ''}${ln({ id: sr.hi, seed: sr.hiSeed }, sr.hw, w === sr.hi, w != null && w !== sr.hi)}${ln({ id: sr.lo, seed: sr.loSeed }, sr.lw, w === sr.lo, w != null && w !== sr.lo)}${st ? `<div class="bst">${esc(st)}</div>` : ''}${w == null && L.phase === 'playoffs' ? `<a class="lk bsc" data-scout="${hiHome(sr, sr.games.length + 1) ? sr.hi : sr.lo},${hiHome(sr, sr.games.length + 1) ? sr.lo : sr.hi}">Scout</a>` : ''}</div>`; }
    return `<div class="bser pend">${c.lab ? `<div class="blab">${c.lab}</div>` : ''}${ln(c.a)}${ln(c.b)}</div>`;
  };
  const col = (title, conf, list, cls) => `<div class="bcol ${cls || ''}"><h4><span class="muted">${conf ? esc(confName(conf)) : ''}</span>${title}</h4><div class="bcards">${list.length ? list.map(bc).join('') : '<span class="muted">—</span>'}</div></div>`;
  const nm = big ? ['Play-in', 'First round', 'Conf. semis', 'Conf. finals'] : ['Play-in', '', 'Semifinals', 'Conf. finals'];
  const cols = (S, c, mirror) => { const a = [col(nm[0], c, S.pi, 'bpi'), ...(big ? [col(nm[1], c, S.r1)] : []), col(nm[2], c, S.r2), col(nm[3], c, S.cf)]; return mirror ? a.reverse() : a; };
  const champ = po && po.champion != null ? `<div class="bchamp">Champions<br><strong>${esc(tname(po.champion))}</strong></div>` : '';
  return `<div class="brone-wrap"><div class="brone ${big ? 'big' : 'small'}">${cols(SL, left).join('')}<div class="bcol bfin"><h4><span class="muted">${L.nba ? 'NBA' : 'League'}</span>Finals</h4><div class="bcards">${bc(F)}${champ}</div></div>${cols(SR, right, true).join('')}</div></div>`;
}
function bracket(rounds) {
  if (!ui.brCols) return bracketOne(rounds);
  return bracketCols(rounds);
}
function bracketCols(rounds) {
  // v21: the 30-team format has 6 rounds (two play-in rounds, first round, conference semis, conference finals, Finals)
  const big = rounds.length > 4 || (rounds[0] && (rounds[0].series || rounds[0]).length === 4) || (L.po && L.po.big && rounds === L.po.rounds);
  const col = (i, title, sub) => { const r = rounds[i]; const list = r ? (r.series || r) : null; return `<section class="pcol"><h3>${title}</h3><p class="muted" style="margin:-4px 0 8px;font-size:12px">${sub}</p>${list ? list.map((sr, k) => (sr.conf && (k === 0 || list[k - 1].conf !== sr.conf) ? `<div class="k">${confName(sr.conf)}</div>` : '') + seriesCard(sr, i, big ? i <= 1 : i === 0, big)).join('') : '<p class="muted">To be decided.</p>'}</section>`; };
  if (big) return `<div class="bracket big">${col(0, 'Play-in', 'Single games · 7 vs 8 (winner is the 7 seed), 9 vs 10')}${col(1, 'Play-in: last spot', 'The 7/8 loser hosts the 9/10 winner for the 8 seed')}${col(2, 'First round', 'Best of 7 · 1-8, 4-5, 2-7, 3-6')}${col(3, 'Conference semifinals', 'Best of 7')}${col(4, 'Conference finals', 'Best of 7')}${col(5, 'Finals', 'Best of 7 · ' + (L.nba ? 'East vs West' : 'North vs South') + '')}</div>`;
  return `<div class="bracket">${col(0, 'Play-in', 'Seed 4 hosts seed 5. The 4 seed needs 1 win, the 5 seed 2 straight.')}${col(1, 'Conference semifinals', 'Best of 5 · 1 vs play-in winner, 2 vs 3')}${col(2, 'Conference finals', 'Best of 5')}${col(3, 'Finals', 'Best of 7 · ' + (L.nba ? 'East vs West' : 'North vs South') + '')}</div>`;
}
// ---------- teams ----------
function vTeams() {
  if (ui.team != null) return vTeam(L.teams[ui.team]);
  // v22: North / South sub-tabs; 30-team leagues group each conference by division, the classic league by region
  const conf = ui.teamsConf === 'South' ? 'South' : 'North', big = isBig(L);
  const groups = big ? (L.nba ? NBA_DIV_ORDER : DIV_ORDER)[conf].map(d => [d + ' Division', L.teams.filter(t => t.div === d)]) : [...new Set(L.teams.filter(t => t.conf === conf).map(t => t.region))].map(r => [r, L.teams.filter(t => t.conf === conf && t.region === r)]);
  const tabs = `<div class="subtabs" style="margin-bottom:12px">${['North', 'South'].map(c => `<button class="sm ${c === conf ? 'primary' : ''}" data-tconf="${c}">${confName(c)} conference</button>`).join('')}</div>`;
  const card = t => {
    const ps = teamPlayers(t.id).sort((a, b) => ovrNum(b) - ovrNum(a));
    const pay = payroll(L, t);
    return `<div class="panel" style="cursor:pointer" data-team="${t.id}"><div class="row" style="justify-content:space-between;flex-wrap:nowrap"><strong style="display:flex;align-items:center;min-width:0">${logo(t.id, 30)}${esc(tname(t.id))}</strong><span class="muted">${t.w}-${t.l}</span></div><div class="muted" style="margin-top:6px">${confName(t.conf)}${t.div ? ' · ' + esc(t.div) : ''}${mktTxt(t)} · ${modePill(t)}${(t.divTitles || []).length ? ` · ${t.divTitles.length}× division champs` : ''}</div><div class="muted">Coach ${clink(t.coach)} (${t.coach.ovr})</div><div class="muted">${OFF_SYS[t.coach.off].name} / ${DEF_SYS[t.coach.def].name}</div><div style="margin-top:6px">Best: ${esc(ps[0].name)} <span class="muted">${posLabel(ps[0])} · ${ps[0].ovr}</span></div><div class="muted">Payroll ${money(pay)} · room ${money(Math.max(0, CAP - pay))}</div></div>`;
  };
  return `<h2>Teams</h2>${tabs}${groups.map(([name, ts]) => `<h3 style="margin:14px 0 8px">${esc(name)}${big ? ` <span class="muted" style="font-weight:400;font-size:13px">${ts.slice().sort((a, b) => (b.w - b.l) - (a.w - a.l))[0] && (ts[0].w + ts[0].l) ? 'Leader: ' + esc(ts.slice().sort((a, b) => (b.w - b.l) - (a.w - a.l))[0].abbr) : ''}</span>` : ''}</h3><div class="grid3">${ts.map(card).join('')}</div>`).join('')}`;
}
function teamStatsBlock(t) {
  const a = teamAdv(t.trs); if (!a) return '';
  const all = L.teams.map(x => ({ id: x.id, a: teamAdv(x.trs) })).filter(x => x.a);
  const rank = (k, low) => { const srt = all.slice().sort((x, y) => (low ? x.a[k] - y.a[k] : y.a[k] - x.a[k])); return srt.findIndex(x => x.id === t.id) + 1; };
  const net = a.ortg - a.drtg; all.forEach(x => x.a.net = x.a.ortg - x.a.drtg);
  const item = (k, v, r) => `<span class="k2">${k}</span><span>${v} <span class="muted">(${r}${['st', 'nd', 'rd'][r - 1] || 'th'})</span></span>`;
  return `<div class="panel"><h3>Team stats</h3><div class="kv">${item('Points per game', f1(a.ppg), rank('ppg'))}${item('Opponent points', f1(a.opp), rank('opp', true))}${item('Offensive rating', f1(a.ortg), rank('ortg'))}${item('Defensive rating', f1(a.drtg), rank('drtg', true))}${item('Net rating', sgn(net), rank('net'))}${item('Pace', f1(a.pace), rank('pace'))}</div><p style="margin:8px 0 0"><a class="lk" href="#tstats">All team stats</a></p></div>`;
}
function capBlock(t) {
  const pay = payroll(L, t), cs = capSeason(L);
  const dead = (t.dead || []).filter(d => d.exp >= cs && (d.from == null || d.from <= cs));
  const pr = capProjection(L, t);
  const cell = c => !c ? '<td class="muted">—</td>' : `<td data-v="${c.amt}" title="${c.ext ? 'Extension' : ''}${c.opt ? (c.opt === 'PO' ? ' Player option year' : ' Team option year') : ''}">${money(c.amt)}${c.opt ? ` <span class="pill ${c.opt === 'PO' ? 'shop' : 'prot'}">${c.opt}</span>` : ''}${c.ext ? ' <span class="muted">ext</span>' : ''}${c.amt > MINSAL && c.hit < c.amt - 0.05 ? ` <span class="muted">(${money(c.hit)} hit)</span>` : ''}</td>`;
  const rows = pr.players.map(r => `<tr class="click" data-player="${r.p.id}"><td class="l">${esc(shortName(r.p))}</td><td class="l">${posLabel(r.p)}</td><td>${r.p.age}</td><td>${r.p.ovr}</td>${r.cells.map(cell).join('')}</tr>`).join('');
  const tot = (label, f, cls) => `<tr class="nosort"><td class="l" colspan="4"><strong>${label}</strong></td>${pr.totals.map(x => `<td class="${cls ? cls(x) : ''}">${f(x)}</td>`).join('')}</tr>`;
  return `<div class="panel" style="margin-bottom:16px"><h3>Salary cap · ${cs === L.season ? 'this season' : 'next season'} and 5-year outlook</h3><div class="row" style="justify-content:space-between"><strong>${money(pay)}</strong><span class="muted">cap ${money(CAP)} · room ${money(Math.max(0, CAP - pay))} · floor ${money(MINPAY)}</span></div><div class="capbar"><i class="${pay > CAP ? 'over' : ''}" style="width:${Math.min(100, pay / CAP * 100)}%"></i></div>
  <div class="tblwrap"><table class="sortable" data-sid="capproj"><thead><tr><th class="l">Player</th><th class="l">Pos</th><th>Age</th><th>Ovr</th>${pr.years.map(y => `<th>${seasonName(y)}</th>`).join('')}</tr></thead><tbody>${rows}
  ${tot('Player salaries (cap hits)', x => money(x.sal))}${pr.totals.some(x => x.dead) ? tot('Dead money', x => x.dead ? money(x.dead) : '—') : ''}${pr.totals.some(x => x.floor) ? tot('Payroll-floor charge', x => x.floor ? money(x.floor) : '—') : ''}${tot('Total payroll', x => `<strong>${money(x.total)}</strong>`, x => x.total > TAXLINE ? 'over' : '')}${tot(`vs tax line (${money(TAXLINE)})`, x => x.total > TAXLINE ? `over by ${money(x.total - TAXLINE)}` : `${money(TAXLINE - x.total)} under`, x => x.total > TAXLINE ? 'over' : '')}${tot('Cap room', x => money(x.room), x => x.room < 0 ? 'lo' : x.room > 30 ? 'w' : '')}${tot('Players under contract', x => x.n)}</tbody></table></div>
  <p class="muted" style="margin:6px 0 0;font-size:12px">Cap ${money(CAP)} · tax line ${money(TAXLINE)} · hard cap ${money(APRON)} · mid-level exception ${mleOpen(L, t) ? `${money(MLE)} left, not used this season` : `${money(0)} left, used this season`}${payroll(L, t) > TAXLINE ? ' · <span class="lo">over the tax line: trades must match salaries, and free agents only at the minimum</span>' : payroll(L, t) > CAP ? ' · over the cap: trades can take back up to 125% of outgoing salary' : ''}</p>
  <details class="about"><summary>How this works</summary><p>Each column is a season. Option years are marked PO (player) or TO (team): a declined option comes off the books. Extensions start the season after the current deal ends. Minimum contracts (${money(MINSAL)}) don't count. Re-signed draftees on ${money(10)}+ deals count 90%, and players out for the season on ${money(10)}+ deals count 50%. A team that finishes under the ${money(MINPAY)} floor pays the difference, and that charge counts on its payroll for the season.${pay > CAP ? ' This team is over the cap because of rookie-scale deals and can only make moves that lower its payroll.' : ''}</p></details>
  ${dead.length ? `<p style="margin:8px 0 0">Dead money: ${dead.map(d => `${esc(d.name)} ${money(d.amt)} through ${seasonName(d.exp)}`).join(', ')} <span class="muted">(comes off if another team signs him)</span></p>` : ''}</div>`;
}
// Signed contracts: initial + last name, salary, share of the cap, years left, options
function contractList(t) {
  const cs = capSeason(L);
  const ps = teamPlayers(t.id).filter(p => p.contract).sort((a, b) => b.contract.amt - a.contract.amt);
  const dead = (t.dead || []).filter(d => d.exp >= cs && (d.from == null || d.from <= cs));
  const rows = ps.map(p => { const c = p.contract, hit = capHit(L, p), yl = yrsLeft(L, p, cs), share = hit / CAP * 100;
    return `<tr class="click" data-player="${p.id}"><td class="l">${esc(shortName(p))}</td><td data-v="${c.amt}">${money(c.amt)}</td><td data-v="${share}">${hit > 0 ? share.toFixed(1) + '%' : '<span class="muted" title="Minimum deals don\'t count against the cap">0% (min)</span>'}</td><td data-v="${yl}">${yl || '<span class="muted">exp</span>'}</td><td class="l">${c.opt || '—'}</td></tr>`; }).join('');
  const deadRows = dead.map(d => `<tr class="nosort"><td class="l muted">${esc(d.name)} (released)</td><td>${money(d.amt)}</td><td>${(d.amt / CAP * 100).toFixed(1)}%</td><td>${d.exp - cs + 1}</td><td class="l muted">Dead</td></tr>`).join('')
    + (t.floorPaid || []).filter(x => x.s === cs).map(x => `<tr class="nosort"><td class="l muted">Payroll-floor charge</td><td>${money(x.amt)}</td><td>${(x.amt / CAP * 100).toFixed(1)}%</td><td>1</td><td class="l muted">Floor</td></tr>`).join('');
  return `<details class="contracts" ${ui.capOpen ? 'open' : ''} id="capdet"><summary>Signed contracts · ${ps.length}</summary><div class="tblwrap"><table class="sortable" data-sid="contracts"><thead><tr><th class="l">Player</th><th>Per year</th><th title="Cap hit as a share of the ${money(CAP)} cap">% of cap</th><th title="Seasons left, counting ${cs === L.season ? 'this season' : 'next season'}">Years left</th><th class="l" title="PO = player option, TO = team option, on the final year">PO/TO</th></tr></thead><tbody>${rows}${deadRows}</tbody></table></div></details>`;
}
function needsBlock(t) {
  const n = teamNeeds(L, t);
  const top = Object.entries(n).sort((a, b) => b[1] - a[1]).slice(0, 5);
  return `<div class="panel"><h3>Front office needs</h3>${top.map(([k, v]) => { const [pos, name] = k.split('|'); return `<div class="leader" style="grid-template-columns:minmax(0,1fr) auto"><span>${esc(name)} ${pos}</span><span class="v">${v >= 0.9 ? 'High' : v >= 0.55 ? 'Medium' : 'Low'}</span></div>`; }).join('')}<details class="about"><summary>How this works</summary><p>Based on the coach's systems and which player types the rotation lacks. Teams pay up to 50% over market value to fill a high need.</p></details></div>`;
}
// ===== v26.2 (Sonnet): pick swaps, Stepien note, team pick panel =====
function dealPickIds() { return [...ui.tGive.picks, ...ui.tGet.picks]; }
function swapBox(side) {
  if (ui.tradeWith == null) return '';
  const g = side === 'give' ? ui.tGive : ui.tGet, gT = side === 'give' ? L.user : ui.tradeWith, rT = side === 'give' ? ui.tradeWith : L.user;
  const lo = nextDraftS(L), hi = L.season + PICK_YEARS, opts = []; for (let S = lo; S <= hi; S++) opts.push(S);
  const list = (g.swaps || []).map((sw, i) => { const e = swapCheck(L, sw, dealPickIds()), pts = swapPts(L, sw);
    return `<div class="row" style="margin-top:4px;align-items:center"><span>${esc(swapLabel(L, sw))}</span> <span class="pill pos" title="Value of the swap right: ${Math.round(pts)} pts">${pickTier(pts)}</span> <span class="muted">${Math.round(pts)} pts</span>${e ? ` <span class="lo">${esc(e)}</span>` : ' <span class="w">✓ valid</span>'}<button class="sm" data-swapdel="${side}" data-i="${i}">Remove</button></div>`; }).join('');
  return `<div style="margin-top:8px"><div class="row"><label class="muted" style="font-size:12px" title="${esc(L.teams[rT].abbr)} gets the right to swap 1sts with ${esc(L.teams[gT].abbr)} in that draft">Swap rights (${esc(L.teams[gT].abbr)} gives) <select class="sm" id="swy-${side}">${opts.map(S => `<option value="${S}">${draftLabel(S)} 1sts</option>`).join('')}</select></label><button class="sm" data-swapadd="${side}">Add swap</button></div>${list}</div>`;
}
function stepienNote() {
  if (ui.tradeWith == null) return '';
  const mv = {}; ui.tGive.picks.forEach(id => mv[id] = ui.tradeWith); ui.tGet.picks.forEach(id => mv[id] = L.user);
  if (!Object.keys(mv).length) return '';
  const m = stepienCheck(L, mv, [L.user]); return m ? `<div class="msg no" style="margin-top:8px"><strong>Can't propose.</strong> ${esc(m)}.</div>` : '';
}
const stepienBlocked = () => !!stepienNote();
function swapRowsOf(L, tid) { return swapsOf(L, tid); }
function picksBlock(t) {
  const ks = L.picks.filter(k => k.owner === t.id && !pickUsed(L, k)).sort((a, b) => a.s - b.s || a.rd - b.rd);
  const owed = L.picks.filter(k => k.orig === t.id && k.owner !== t.id && !pickUsed(L, k)).sort((a, b) => a.s - b.s || a.rd - b.rd);
  const sw = swapsOf(L, t.id), gaps = stepienGaps(L, t.id, null);
  const yrsL = [...new Set(ks.map(k => k.s))];
  const line = k => `<div>${esc(pickLabel(L, k))} ${pickChip(k)}${k.orig !== t.id ? ' <span class="muted">via ' + esc(L.teams[k.orig].abbr) + '</span>' : ''}${k.swap ? ' <span class="pill pos" title="Tied to a pick swap until the lottery">tied to a swap</span>' : ''}</div>`;
  return `<div class="panel"><h3>Draft picks</h3>${ks.length ? yrsL.map(S => `<div style="margin-top:6px"><strong>${draftLabel(S)} draft</strong></div>${ks.filter(k => k.s === S).map(line).join('')}`).join('') : '<p class="muted">None.</p>'}
  ${owed.length ? `<h3 style="margin-top:12px;font-size:14px">Owed to others</h3>${owed.map(k => `<div>${esc(pickLabel(L, k))} <span class="muted">to ${esc(L.teams[k.owner].abbr)}</span></div>`).join('')}` : ''}
  ${sw.length ? `<h3 style="margin-top:12px;font-size:14px">Open pick swaps</h3>${sw.map(x => `<div>${esc(swapLabel(L, x))}</div>`).join('')}` : ''}
  <p style="margin:10px 0 0">Stepien rule: ${gaps.length ? `<span class="lo">gap in ${gaps.map(g => seasonName(g)).join(', ')}</span>` : '<span class="w">OK</span>'} <span class="muted">(no 1st in two drafts in a row is not allowed)</span></p></div>`;
}
function picksBlockOld(t) {
  const ks = L.picks.filter(k => k.owner === t.id && !pickUsed(L, k)).sort((a, b) => a.s - b.s || a.rd - b.rd);
  return `<div class="panel"><h3>Draft picks owned</h3>${ks.length ? ks.map(k => `<div>${esc(pickLabel(L, k))} ${pickChip(k)}${k.orig !== t.id ? ' <span class="muted">via ' + L.teams[k.orig].abbr + '</span>' : ''}</div>`).join('') : '<p class="muted">None.</p>'}</div>`;
}
function vTeam(t) {
  const tab = ['history', 'fin'].includes(ui.teamTab) ? ui.teamTab : 'overview';
  const head = teamHeader(t);
  const todoAtt = isUser(t.id) && tab === 'overview' ? (() => { const td = todoPanel(), at = attentionPanel(t); return td ? `<div class="grid2e todo-att">${td}${at}</div>` : at; })() : '';   // v28.7 U1: to-do beside Needs attention
  const sub = `<div class="subtabs"><button class="sm" data-cmpt="${t.id}">Compare</button><button class="sm ${tab === 'overview' ? 'primary' : ''}" data-teamtab="overview">Overview</button><button class="sm ${tab === 'fin' ? 'primary' : ''}" data-teamtab="fin">Finances</button><button class="sm ${tab === 'history' ? 'primary' : ''}" data-teamtab="history">Team history</button></div>`;
  return `${ui.view === 'teams' ? '<div class="row" style="margin-bottom:10px"><button data-back="teams">All teams</button></div>' : ''}${isUser(t.id) ? phaseNote() : ''}${head}${tab === 'overview' ? recentStrip(t) + (isUser(t.id) ? tpStrip() : '') : ''}${todoAtt}${sub}${tab === 'history' ? teamHistory(t) + (typeof hxTeamPanels === 'function' ? hxTeamPanels(L, t) : '') : tab === 'fin' ? teamFinance(t) : teamOverview(t)}`;
}
// ---------- finances ----------
const meter = (v, cls) => `<div class="meter"><i class="${cls || ''}" style="width:${Math.max(0, Math.min(100, v))}%"></i></div>`;
function teamFinance(t) {
  const mine = isUser(t.id), pr = seasonProjection(L, t), f = t.fin || {}, o = t.owner;
  if (f.intlBuy) { pr.expenses = r1(pr.expenses + f.intlBuy); pr.profit = r1(pr.profit - f.intlBuy); }   // v29: seasonProjection leaves out international buyouts; the season-end books count them
  const price = ticketPrice(L, t), mkt = marketPrice(L, t);
  const avgAtt = f.homeGames ? Math.round(f.att / f.homeGames) : null;
  const projAtt = Math.round(Math.min(t.arena.cap, t.arena.cap * demandFor(L, t, price)));
  const line = (k, v, cls, note) => `<tr><td class="l">${k}${note ? ` <span class="muted">${note}</span>` : ''}</td><td class="${cls || ''}">${money(v)}</td></tr>`;
  const S = L.season, inSeason = ['regular', 'regular-done', 'playoffs', 'season-done'].includes(L.phase);
  const arena = `<div class="panel"><h3>${esc(t.arena.name)}</h3><div class="kv"><span class="k2">Capacity</span><span>${t.arena.cap.toLocaleString()} seats</span><span class="k2">${inSeason ? 'Average attendance' : 'Last season\'s attendance'}</span><span>${avgAtt != null ? `${avgAtt.toLocaleString()} (${Math.round(avgAtt / t.arena.cap * 100)}% full)` : 'No home games yet'}</span><span class="k2">Ticket price</span><span><strong>$${price}</strong> ${t.priceAuto ? '<span class="muted">(market price)</span>' : `<span class="muted">market $${mkt}</span>`}</span><span class="k2">Projected crowd at this price</span><span>${projAtt.toLocaleString()} (${Math.round(projAtt / t.arena.cap * 100)}%)</span></div>
    <div style="margin-top:8px"><span class="k">Fan hype · ${Math.round(t.hype)}</span>${meter(t.hype)}</div>
    ${mine || L.mode === 'commish' ? `<div class="row" data-ptid="${t.id}"><label>Ticket price $<input type="number" id="tprice" min="10" max="400" step="1" value="${price}"></label><button class="sm" id="setprice">Set price</button><button class="sm primary" id="mktprice">Use market price ($${mkt})</button></div><p class="muted" style="font-size:12px;margin:6px 0 0">Higher prices earn more per seat but sell fewer seats, and pricing well above market slowly cools fan hype. Market price follows hype automatically.</p>` : ''}</div>`;
  const trustCls = o.trust < 35 ? 'hot' : o.trust < 50 ? 'warm' : '';
  const owner = `<div class="panel"><h3>Owner · ${esc(o.name)}</h3><div><span class="k">Trust in ${mine ? 'you' : t.gm ? glink(t.gm) : 'the GM'} · ${o.trust}/100${o.hot ? ' · <span class="lo">on the hot seat</span>' : ''}</span>${meter(o.trust, trustCls)}</div><div class="kv"><span class="k2">This season's goal</span><span>${esc((o.goal || {}).txt || '—')}</span><span class="k2">Spending limit</span><span>${money(o.limit)} <span class="muted">(payroll ${money(payroll(L, t))})</span>${payroll(L, t) > o.limit ? ' <span class="lo">over the limit</span>' : ''}</span><span class="k2">Cash on hand</span><span class="${t.cash < 0 ? 'lo' : ''}">${money(t.cash)} <span class="muted">(owner keeps at most ${money(CASH_CAP[t.market])} in the team)</span></span><span class="k2">General manager</span><span>${mine ? 'You' : t.gm ? esc(t.gm.name) + ' <span class="muted">since ' + seasonName(t.gm.since) + '</span>' : '—'}</span></div>
    ${(t.ownerHist || []).length ? `<p class="muted" style="margin:8px 0 0;font-size:12px">Previous owners: ${t.ownerHist.map(x => `${esc(x.name)} (sold ${seasonName(x.to)})`).join(', ')}</p>` : ''}
    ${o.hist.length ? `<p class="muted" style="margin:8px 0 0;font-size:12px">Trust history: ${o.hist.slice(-6).map(h => `${seasonName(h.s)} ${h.trust} (${h.d >= 0 ? '+' : ''}${h.d}${h.met ? ', goal met' : ''})`).join(' · ')}</p>` : ''}
    <details class="about"><summary>How this works</summary><p>Each season the owner judges results against his goal and the preseason expectation, profit, and whether payroll stayed under his spending limit (a soft limit). Trust under 35 at season's end puts the GM on the hot seat; two straight seasons on the hot seat and he's fired in the offseason. A title or a strong season wins trust back.</p></details></div>`;
  const cur = `<div class="panel"><h3>${seasonName(inSeason ? S : S + 1)} · ${inSeason ? 'projected for the full season' : 'early projection'}</h3><div class="tblwrap"><table><tbody>
    <tr class="sep"><td class="l"><strong>Revenue</strong></td><td><strong>${money(pr.revenue)}</strong></td></tr>
    ${line('Ticket sales', pr.gate, '', inSeason && f.homeGames ? `${money(f.gate)} so far, ${f.homeGames} home games` : '')}${pr.playoff ? line('Playoff tickets', pr.playoff) : ''}${line('Media rights', pr.media)}${line('Jersey sales', jerseysFor(L, t), '', 'driven by your players\' fame')}${line('Other merchandise', r1(pr.merch - jerseysFor(L, t)))}${line('Sponsorship', pr.sponsor, '', t.sponsor ? esc(t.sponsor.name) : '')}${f.fines ? line('Fines collected', f.fines, 'w', 'team fines, added to revenue at season close') : ''}${pr.cashGot ? line('Cash received in trades', pr.cashGot, '', 'up to $5M a season') : ''}${line('Revenue sharing received', pr.shareIn, '', pr.taxShare ? `incl. ${money(pr.taxShare)} of luxury tax` : 'pool split evenly')}
    <tr class="sep"><td class="l"><strong>Expenses</strong></td><td><strong>${money(pr.expenses)}</strong></td></tr>
    ${line('Player salaries', pr.payCost, '', 'includes minimum deals and dead money')}${f.suspSaved ? line('Pay saved on suspensions', f.suspSaved, 'w', 'comes off salaries at season close') : ''}${line('Coach and scouting director', pr.staff)}${f.intlBuy ? line('International buyouts', f.intlBuy, '', 'call-ups from EABL clubs') : ''}${line('Revenue sharing paid', pr.shareOut, '', Math.round(SHARE_PCT * 100) + '% of tickets and merchandise')}${pr.cashSent ? line('Cash sent in trades', pr.cashSent, '', 'up to $5M a season') : ''}${pr.tax ? line('Luxury tax', pr.tax, 'over', isRepeatTaxer(L, t, inSeason ? S : S + 1) ? 'repeat-payer rate' : '') : ''}
    <tr><td class="l"><strong>Profit</strong></td><td class="${pr.profit >= 0 ? 'w' : 'lo'}"><strong>${money(pr.profit)}</strong></td></tr></tbody></table></div></div>`;
  // the next three seasons: committed payroll, tax and room
  const cp = capProjection(L, t);
  const baseRev = pr.revenue - pr.playoff - (pr.taxShare || 0);
  const fut = cp.totals.slice(0, 4).map(x => { const tax = taxFor(L, t, x.total, x.y), prof = baseRev - x.total - pr.staff - tax - pr.shareOut; return `<tr><td class="l">${seasonName(x.y)}</td><td>${money(x.total)}</td><td class="${x.total > TAXLINE ? 'over' : ''}">${x.total > TAXLINE ? '+' + money(x.total - TAXLINE) : money(TAXLINE - x.total) + ' under'}</td><td class="${tax ? 'over' : ''}">${tax ? money(tax) : '—'}</td><td class="${x.total > o.limit ? 'over' : ''}">${x.total > o.limit ? 'Over by ' + money(x.total - o.limit) : 'Within'}</td><td class="${prof >= 0 ? 'w' : 'lo'}">${money(prof)}</td></tr>`; }).join('');
  const futPanel = `<div class="panel"><h3>Planning · committed payroll, tax and sharing</h3><div class="tblwrap"><table><thead><tr><th class="l">Season</th><th>Committed payroll</th><th title="Tax line ${money(TAXLINE)}">vs tax line</th><th>Projected tax</th><th>Owner limit</th><th title="At this season's revenue, before playoffs and tax share">Est. profit</th></tr></thead><tbody>${fut}</tbody></table></div><p class="muted" style="margin:6px 0 0;font-size:12px">Teams under the tax line split the luxury tax pool. Committed payroll counts only contracts already signed; open roster spots will add salary. Mid-level exception: ${mleOpen(L, t) ? 'available' : 'used'} this ${capSeason(L) === L.season ? 'season' : 'offseason'}. Tax: $1.50 per $1 for the first ${money(5)} over ${money(TAXLINE)}, $2.00 for the next ${money(5)}, $2.50 beyond, plus $1.00 per $1 for teams that paid tax in 3 of the last 4 seasons. Nobody can pass ${money(APRON)}.</p></div>`;
  const hist = (t.finHist || []).slice().reverse();
  const histPanel = `<div class="panel"><h3>Financial history</h3>${hist.length ? `<div class="tblwrap"><table class="sortable" data-sid="finhist"><thead><tr><th class="l">Season</th><th>Revenue</th><th>Tickets</th><th>Playoffs</th><th>Merch</th><th title="Part of merchandise">Jerseys</th><th>Sponsor</th><th>Sharing in</th><th>Salaries</th><th title="Team fines collected">Fines</th><th title="Salary not paid during suspensions">Susp. saved</th><th>Staff</th><th title="International buyouts (call-ups)">Intl. buyouts</th><th>Tax</th><th title="Cash sent and received in trades">Trade cash</th><th>Profit</th><th title="Money the owner took out of the franchise">Owner took</th><th>Cash</th><th>Avg crowd</th><th>Full</th><th>Hype</th></tr></thead><tbody>${hist.map(h => `<tr><td class="l">${seasonName(h.s)}</td><td>${money(h.revenue)}</td><td>${money(h.gate)}</td><td>${money(h.playoff)}</td><td>${money(h.merch)}</td><td>${h.jersey != null ? money(h.jersey) : '—'}</td><td>${money((h.sponsor || 0) + (h.spBonus || 0))}</td><td>${money(h.shareIn + h.taxIn)}</td><td>${money(h.payroll)}</td><td>${h.fines ? money(h.fines) : '—'}</td><td>${h.suspSaved ? money(h.suspSaved) : '—'}</td><td>${money(h.staff)}</td><td>${h.intlBuy ? money(h.intlBuy) : '—'}</td><td class="${h.tax ? 'over' : ''}">${h.tax ? money(h.tax) : '—'}</td><td>${h.cashIn || h.cashOut ? `<span class="w">+${money(h.cashIn || 0)}</span> / <span class="lo">-${money(h.cashOut || 0)}</span>` : '—'}</td><td class="${h.profit >= 0 ? 'w' : 'lo'}"><strong>${money(h.profit)}</strong></td><td>${h.dist ? money(h.dist) : '—'}</td><td>${money(h.cash)}</td><td>${h.att.toLocaleString()}</td><td>${Math.round(h.full * 100)}%</td><td>${Math.round(h.hype)}</td></tr>`).join('')}</tbody></table></div>` : '<p class="muted">Completed seasons appear here.</p>'}</div>`;
  const sp = t.sponsor, spv = sponsorValue(L, t), pa = sp && sp.parts;
  const sponsorPanel = sp ? `<div class="panel"><h3>Sponsor · ${esc(sp.name)}</h3><div class="kv"><span class="k2">Deal</span><span><strong>${money(sp.amt)}</strong> a season, ${seasonName(sp.from)}–${seasonName(sp.exp)}</span>${pa ? `<span class="k2">When signed</span><span>${money(pa.base)} market and hype · ${pa.win >= 0 ? '+' : ''}${money(pa.win)} winning · +${money(pa.po)} playoffs · +${money(pa.stars)} star power</span>` : ''}<span class="k2">Worth today</span><span>${money(spv.amt)} <span class="muted">(${spv.amt > sp.amt ? 'a new deal would pay more' : spv.amt < sp.amt ? 'a new deal would pay less' : 'about the same'})</span></span><span class="k2">Star power</span><span>${money(spv.parts.stars)} <span class="muted">from players rated 79+ and recent award winners</span></span></div><p class="muted" style="font-size:12px;margin:6px 0 0">Deals run 2–3 seasons and are renegotiated when they end. Winning raises the price (most of all for small markets), and sponsors pay a playoff bonus each season.</p></div>` : '';
  const sb = t.staffBudget || 0, sc = staffCost(L, t, inSeason ? S : S + 1), ow = (t.coachOwed || []).filter(o => o.thru >= (inSeason ? S : S + 1));
  const staffPanel = `<div class="panel"><h3>Staff budget</h3><div class="kv"><span class="k2">Owner's budget</span><span><strong>${money(sb)}</strong> <span class="muted">(hard limit on new hires)</span></span><span class="k2">Head coach</span><span>${esc(t.coach.name)} · ${t.coach.contract ? money(t.coach.contract.amt) + ' through ' + seasonName(t.coach.contract.exp) : '—'}${t.coach.interim ? ' (interim)' : ''}</span><span class="k2">Scouting director</span><span>${t.scout ? esc(t.scout.name) + ' · ' + money(t.scout.contract ? t.scout.contract.amt : t.scout.salary) : '—'}</span><span class="k2">Owed to fired staff</span><span>${ow.length ? ow.map(o => `${esc(o.name)} ${money(o.amt)} through ${seasonName(o.thru)}`).join(', ') : 'None'}</span><span class="k2">Total</span><span class="${sc > sb ? 'lo' : ''}">${money(sc)}${sc > sb ? ' · over budget' : ` · ${money(sb - sc)} left`}</span></div></div>`;
  return `<div class="grid2e" style="margin-bottom:16px">${arena}${owner}</div><div class="grid2e" style="margin-bottom:16px">${cur}${futPanel}</div><div class="grid2e" style="margin-bottom:16px">${sponsorPanel}${staffPanel}</div>${finCharts(t)}${histPanel}`;
}
// v24.7: finance charts. Two separate charts (never two scales on one): cash at each season's end, and payroll against the owner's limit
// with the cap / tax / apron lines. Seasons before v24.7 didn't store the limit: they show today's limit, marked approximate.
function finCharts(t) {
  const S = L.season, inSeason = ['regular', 'regular-done', 'playoffs'].includes(L.phase);
  const rows = (t.finHist || []).slice(-12).map(h => ({ lab: seasonName(h.s), cash: h.cash, pay: h.capPay, lim: h.limit != null ? h.limit : t.owner.limit, approx: h.limit == null, now: false }));
  if (inSeason) rows.push({ lab: seasonName(S) + ' now', cash: t.cash || 0, pay: payroll(L, t, S), lim: t.owner.limit, approx: false, now: true });
  if (!rows.length) return '';
  const W = 520, H = 190, pl = 46, pr = 10, pt = 12, pb = 28, iw = W - pl - pr, ih = H - pt - pb, n = rows.length, bw = iw / n;
  const nice = (lo, hi) => { const span = Math.max(1, hi - lo), st = [5, 10, 20, 25, 50, 100].find(x => span / x <= 5) || 200; return { lo: Math.floor(lo / st) * st, hi: Math.ceil(hi / st) * st, st }; };
  const axis = (sc, y) => { let o = ''; for (let v = sc.lo; v <= sc.hi + 1e-9; v += sc.st) o += `<line x1="${pl}" x2="${W - pr}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)" stroke-width="1" opacity=".5"/><text x="${pl - 6}" y="${y(v) + 4}" text-anchor="end" font-size="11" fill="var(--muted)">${v}</text>`; return o; };
  const xl = rows.map((r, i) => (n <= 8 || i % Math.ceil(n / 8) === 0 || i === n - 1) ? `<text x="${pl + bw * (i + 0.5)}" y="${H - 8}" text-anchor="middle" font-size="11" fill="var(--muted)">${esc(r.now ? 'Now' : r.lab)}</text>` : '').join('');
  // cash line
  const cs = nice(Math.min(0, ...rows.map(r => r.cash)), Math.max(10, ...rows.map(r => r.cash))), cy = v => pt + ih - (v - cs.lo) / (cs.hi - cs.lo) * ih;
  const pts = rows.map((r, i) => [pl + bw * (i + 0.5), cy(r.cash)]);
  const cash = `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Cash at the end of each season" style="max-width:${W}px;display:block">${axis(cs, cy)}${cs.lo < 0 ? `<line x1="${pl}" x2="${W - pr}" y1="${cy(0)}" y2="${cy(0)}" stroke="var(--muted)" stroke-width="1"/>` : ''}
    <polyline points="${pts.map(p => p.join(',')).join(' ')}" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linejoin="round" ${rows.length && rows[n - 1].now ? '' : ''}/>
    ${pts.map((p, i) => `<g class="fpt"><circle cx="${p[0]}" cy="${p[1]}" r="4.5" fill="var(--accent)" stroke="var(--surface)" stroke-width="2"${rows[i].now ? ' fill-opacity=".45"' : ''}/><circle cx="${p[0]}" cy="${p[1]}" r="12" fill="transparent"><title>${esc(rows[i].lab)}: cash ${money(rows[i].cash)}</title></circle></g>`).join('')}${xl}
    <text x="${pts[n - 1][0]}" y="${Math.max(11, pts[n - 1][1] - 9)}" text-anchor="end" font-size="11" fill="var(--ink)">${money(rows[n - 1].cash)}</text></svg>`;
  // payroll bars vs owner's limit (tick) and league lines
  const ps = nice(0, Math.max(APRON + 5, ...rows.map(r => Math.max(r.pay, r.lim)))), py = v => pt + ih - (v - ps.lo) / (ps.hi - ps.lo) * ih;
  const ref = [[CAP, 'Cap'], [TAXLINE, 'Tax'], [APRON, 'Apron']].map(([v, k]) => `<line x1="${pl}" x2="${W - pr}" y1="${py(v)}" y2="${py(v)}" stroke="var(--muted)" stroke-width="1" stroke-dasharray="2 3"><title>${k} ${money(v)}</title></line>`).join('');
  const bars = rows.map((r, i) => { const x = pl + bw * i + Math.max(2, bw * 0.2), w = Math.max(4, bw * 0.6), y = py(r.pay), over = r.pay > r.lim + 1e-6;
    return `<g><rect x="${x}" y="${y}" width="${w}" height="${Math.max(0, py(ps.lo) - y)}" rx="3" fill="var(--accent)" fill-opacity="${r.now ? 0.45 : 0.85}"/><line x1="${x - 3}" x2="${x + w + 3}" y1="${py(r.lim)}" y2="${py(r.lim)}" stroke="var(--ink)" stroke-width="2.5"${r.approx ? ' stroke-dasharray="3 2"' : ''}/><rect x="${pl + bw * i}" y="${pt}" width="${bw}" height="${ih}" fill="transparent"><title>${esc(r.lab)}: payroll ${money(r.pay)} · owner's limit ${money(r.lim)}${r.approx ? ' (approximate: not stored before v24.7)' : ''}${over ? ' · over the limit' : ''}</title></rect></g>`; }).join('');
  const pay = `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Payroll against the owner's spending limit by season" style="max-width:${W}px;display:block">${axis(ps, py)}${ref}${bars}${xl}</svg>`;
  const leg = `<div class="row muted" style="gap:14px;font-size:12px;margin-top:4px"><span><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:var(--accent);opacity:.85;vertical-align:-1px"></span> Payroll (cap)</span><span><span style="display:inline-block;width:14px;height:0;border-top:2.5px solid var(--ink);vertical-align:3px"></span> Owner's limit${rows.some(r => r.approx) ? ' (dashed: approximate)' : ''}</span><span><span style="display:inline-block;width:14px;height:0;border-top:1px dotted var(--muted);vertical-align:3px"></span> Cap ${CAP} · tax ${TAXLINE} · apron ${APRON}</span>${inSeason ? '<span>Faded: this season so far</span>' : ''}</div>`;
  return `<div class="grid2e" style="margin-bottom:16px"><div class="panel"><h3>Cash at season's end ($M)</h3>${cash}${inSeason ? '<div class="muted" style="font-size:12px;margin-top:4px">Faded point: cash today.</div>' : ''}</div><div class="panel"><h3>Payroll vs owner's limit ($M)</h3>${pay}${leg}</div></div>`;
}
const HOT_LABEL = { record: 'Record below what was expected', streak: 'Losing streak', friction: 'Players clashing with the coach', callout: 'Your call-outs', press: 'Bad press', ring: 'Recent title' };
function hotBadge(t) {
  if (!t || !t.coach || (t.hot || 0) < 50) return '';
  const h = hotSeat(L, t), tip = Object.entries(h.parts).filter(([, v]) => v).map(([k, v]) => `${HOT_LABEL[k] || k}: ${v > 0 ? '+' : ''}${Math.round(v)}`).join('; ');
  return ` <span class="pill hot-seat ${t.hot >= 70 ? 'hot-hi' : ''}" title="${esc('Hot seat ' + t.hot + '/100. ' + tip)}">Hot seat</span>`;
}
function fanMeter(tid) {
  const m = fanMood(L, tid), v = m.v, w = Math.abs(v) / 2;
  return `<div class="kv fo-row" style="grid-template-columns:90px 1fr 90px" title="Mood of the last two weeks of fan posts, from -100 (angry) to +100 (thrilled)"><span class="k2">Fan mood</span><span class="fan-bar" role="img" aria-label="Fan mood ${v}"><i class="${v < 0 ? 'neg' : 'pos'}" style="${v < 0 ? 'right' : 'left'}:50%;width:${w}%"></i></span><span class="fo-val" style="white-space:nowrap">${m.n ? (v > 0 ? '+' : '') + v + ' · ' + m.n + ' posts' : 'no posts yet'}</span></div>`;
}
function teamHeader(t) {
  const gp = t.w + t.l, mine = isUser(t.id);
  return `<section class="panel" style="margin-bottom:12px"><div class="bio"><div style="display:flex;align-items:center;gap:12px;min-width:0">${logo(t.id, 64)}<div style="min-width:0"><div class="k">${confName(t.conf)} Conference · ${L.nba ? esc(t.div) + ' Division' : t.region}${mktTxt(t)}${mine ? ' · Your team' : ''}</div><div class="big">${esc(tname(t.id))}</div>${titleRibbon(t)}${iconLine(t)}</div></div><div><div class="k">Record</div><div class="v" data-cu>${t.w}-${t.l}</div>${t.w + t.l ? `<div class="muted" style="font-size:12px">Home ${t.hw || 0}-${t.hl || 0} · Away ${t.aw || 0}-${t.al || 0}</div>` : ''}</div><div><div class="k">Outlook</div><div class="v" style="font-size:16px">${modePill(t)}</div><div style="margin-top:2px">${foChip(t)}</div></div><div><div class="k">Points for / against</div><div class="v" data-cu>${gp ? f1(t.pf / gp) + ' / ' + f1(t.pa / gp) : '—'}</div></div><div><div class="k">Coach</div><div class="v" style="font-size:18px">${clink(t.coach)}${hotBadge(t)}</div></div><div><div class="k">General manager</div><div class="v" style="font-size:18px">${mine ? esc(meName()) : t.gm ? glink(t.gm) : '—'}</div></div><div><div class="k">Titles</div><div class="v">${nbaHistOn(L) ? nbaTitlesAll(L, t) : (t.titles || 0)}</div></div></div>${rafters(t)}${mine ? goalTracker(t) : ''}</section>`;
}
// v24.1: how the starting five fits together and with the coach's systems (same numbers the game engine uses)
function chemStrip(t) {
  const five = rotationOf(L, t).slice(0, 5); if (five.length < 5) return '';
  const ch = teamChem(five, t.coach), c = t.coach;
  const good = ch.total > 0.004, bad = ch.total < -0.004;
  return `<section class="panel"><h3>Lineup chemistry</h3><div class="row" style="flex-wrap:wrap;gap:6px"><span class="pill">${esc(OFF_SYS[c.off].name)}</span><span class="pill">${esc(DEF_SYS[c.def].name)}</span><span class="pill ${good ? 'pos' : bad ? 'mode-rebuild' : ''}">${good ? 'Helps the team' : bad ? 'Hurts the team' : 'Neutral'}</span>${ch.notes.map(n => `<span class="pill">${esc(n)}</span>`).join('')}</div><p class="muted" style="margin:8px 0 0">Starting five by rotation: ${five.map(p => esc(p.name.split(' ').pop()) + ' (' + (p.arch && p.arch[0] ? esc(p.arch[0].n) : POS[p.pos]) + ')').join(', ')}.</p><p class="muted" style="margin:6px 0 0;font-size:12px">Grades your starting five: spacing, ball-need crowding, rim protection, perimeter defense and fit with the coach's systems. Helps = strengths outweigh problems. Hurts = e.g. too few shooters or too many ball-dominant players. The grey tags show why.</p></section>`;
}
function chemWindow(t) { return twin('chem', [['Lineup chemistry', chemStrip(t)], ['Team chemistry', chemPanel(t)]], 'Chemistry', 1); }
function teamOverview(t) {
  const c = t.coach;
  const ps = teamPlayers(t.id).sort((a, b) => playerValue(b, c) - playerValue(a, c));
  const cov = [0, 0, 0, 0, 0]; ps.forEach(p => { cov[p.pos]++; if (p.pos2 != null) cov[p.pos2]++; });
  const gp = t.w + t.l;
  const mine = isUser(t.id);
  const canRel = (mine || commish()) && L.phase !== 'playoffs';
  const rows = ps.map(p => {
    const s = rs(p);
    return `<tr class="click" data-player="${p.id}" ${frow(p)}><td class="l nmc">${esc(p.name)}${injPill(p)}${scoutPill(p)}${p.hardship ? ' <span class="pill pos">Hardship</span>' : ''}${p.block ? ' <span class="pill mode-rebuild" title="On the trading block: teams know he is available">On block</span>' : ''}${tagChips(p)}${p.core && mine ? ' <span class="pill pos" title="Core player: coach targets never take his spot">Core</span>' : ''}${p.tradeReq === L.season ? ' <span class="pill inj">Wants a trade</span>' : ''}${tradeRestricted(L, p) ? ' <span class="pill pos" title="Signed as a free agent: can\'t be traded yet">New signing</span>' : ''}</td><td class="l">${posLabel(p)}</td><td class="l wrapt s" data-v="${roleSortV(p)}" title="${esc(roleTip(p))}">${roleCell(p)}</td><td class="l muted wrapt s">${esc(archLabel(p))}</td><td>${p.age}</td><td><strong>${ovrTxt(p)}</strong></td><td data-v="${commish() ? p.pot : p.scout}">${potCell(p)}</td><td>${fit(p, c)}</td><td data-v="${p.contract ? p.contract.amt : 0}">${contractCell(p)}</td><td>${s ? s.gp : 0}</td><td>${f1(pg(p, 'min') / 60)}</td><td>${f1(pg(p, 'pts'))}</td><td>${f1(pg(p, 'orb') + pg(p, 'drb'))}</td><td>${f1(pg(p, 'ast'))}</td><td>${hasUsg(s) ? f1(usg(s)) : '—'}</td><td data-v="${p.morale != null ? p.morale : 60}">${moodCell(p)}</td>${canRel || mine ? `<td>${rmBtn(mine ? 'my' : 'rel', p)}</td>` : ''}</tr>`;
  }).join('');
  const recent = L.games.filter(g => g.home === t.id || g.away === t.id).slice(-6).reverse();
  const sorted = ui.tsorts && ui.tsorts.roster;
  const canFire = mine && L.phase !== 'playoffs';
  const owed = (t.coachOwed || []).filter(o => o.thru >= coachStartSeason(L));
  const mt = ['roster', 'office', 'cap', 'shoot', 'rivals', 'games', 'plays', ...(mine ? ['watch'] : [])].includes(ui.mtab) ? ui.mtab : 'roster';
  const mtabs = `<div class="subtabs" style="margin-bottom:12px">${[['roster', 'Roster'], ['office', 'Front office'], ['cap', 'Salary cap'], ['shoot', 'Shooting'], ['plays', 'Play types'], ['rivals', 'Active rivalries'], ['games', 'Past games'], ...(mine ? [['watch', `Watch list (${watchList(L).length})`]] : [])].map(([k, n]) => `<button class="sm ${mt === k ? 'primary' : ''}" data-mtab="${k}">${n}</button>`).join('')}</div>`;
  if (mt === 'office') return mtabs + `<div class="grid2"><section class="stack">${foPanel(t)}${t.scout ? `<div class="panel"><h3>Scouting director</h3><div class="kv"><span class="k2">Name</span><span>${slink(t.scout)} · age ${t.scout.age}</span><span class="k2">Rating</span><span><strong>${t.scout.rating}</strong> · eye for ${SCOUT_EYE[t.scout.eye].toLowerCase()}</span><span class="k2">Contract</span><span>${t.scout.contract ? `${money(t.scout.contract.amt)}/yr through ${seasonName(t.scout.contract.exp)}` : money(t.scout.salary) + '/yr'}</span></div>${mine ? scoutControls(t) : ''}</div>` : mine ? `<div class="panel"><h3>Scouting director</h3><div class="msg no">The job is empty. Hire a director before the season starts, or the front office picks one for you (not one of the best).</div>${scoutControls(t)}</div>` : ''}<div class="panel"><h3>Head coach</h3>${coachKV(c)}${canFire ? `<div class="row" style="margin-top:10px"><button class="danger" data-firecoach="1">Fire ${esc(c.name)} and hire a new coach</button></div>` : mine ? `<p class="muted" style="margin:8px 0 0">Coaching changes wait until the playoffs are over.</p>` : ''}${owed.length ? `<p class="muted" style="margin:8px 0 0">Still paying fired staff: ${owed.map(o => `${esc(o.name)} ${money(o.amt)}/yr through ${seasonName(o.thru)}`).join(', ')} (counts against the staff budget, outside the player cap)</p>` : ''}${ui.coachMsg && mine ? `<div class="msg">${esc(ui.coachMsg)}</div>` : ''}</div></section><section class="stack">${picksBlock(t)}</section></div>${devTeamPanel(t)}`;
  if (mt === 'cap') return mtabs + capBlock(t);
  if (mt === 'watch') return mtabs + watchPanel();
  if (mt === 'rivals') return mtabs + rivalsTab(t);
  if (mt === 'games') return mtabs + pastGamesTab(t);
  if (mt === 'plays') return mtabs + playTypePanel(t);
  if (mt === 'shoot') return mtabs + (teamShootingPanel(t) || '<p class="muted">No shot data yet this season.</p>');
  return mtabs + (mine ? storyBox() + feedBox(3) + needsPanel(t) + positionReadPanel(t) : '') + lockerPanel(t, mine) + (mine ? promisesPanel(t) : '') + `<div class="panel" style="margin-bottom:16px"><h3>Roster · ${ps.length} players · ${sorted ? 'sorted (click a column again to flip, or <a class="lk" data-unsort="roster">reset</a>)' : 'ordered by coach\'s preference · click a column to sort'}</h3>${fbar('roster', { sortHint: false })}<div class="tblwrap"><table class="sortable" data-sid="roster" data-flist="roster"><thead><tr><th class="l">Player</th><th class="l">Pos</th><th class="l" title="The coach's role for him and the minutes it comes with">Role</th><th class="l">Type</th><th>Age</th><th>Ovr</th><th>${potHead()}</th><th title="How well he fits the coach's systems">Fit</th><th title="Per year, years left. PO/TO = player or team option on the final year. R = rookie deal. Extensions show under the contract.">Contract</th><th>GP</th><th>Min</th><th>Pts</th><th>Reb</th><th>Ast</th><th title="Usage rate: share of team possessions used while on the floor">USG%</th><th title="Morale: minutes vs role, winning, pay, loyalty, coach fit">Mood</th>${canRel || mine ? '<th class="nosort"></th>' : ''}</tr></thead><tbody>${rows}</tbody></table></div><div id="relmsg"></div>${chemWindow(t)}${twoWayTeamPanel(t)}</div>
  <div class="grid2"><section class="stack">
  ${twin('rot', [['Rotation & roles', rotationPanel(t)], ['Lineup & rotation', mine ? lineupEditor(t) : ''], ['Rotation chart', mine ? rotEditor(t) : '']])}
  <div class="panel"><h3>Recent games</h3>${recent.length ? `<div class="grid3">${recent.map(gameCard).join('')}</div>` : '<p class="muted">No games this season yet.</p>'}</div></section>
  <section class="stack">${teamStatsBlock(t)}
  ${rivalBlock(t)}
  ${t.retired.length ? `<div class="panel"><h3>Retired numbers</h3>${t.retired.map(r => `<div class="leader" style="grid-template-columns:44px minmax(0,1fr) auto"><span class="v">#${r.num}</span><span>${L.players[r.pid] ? plink(L.players[r.pid]) : esc(r.name)}</span><span class="muted">${seasonName(r.s)}</span></div>`).join('')}</div>` : ''}
  ${needsBlock(t)}
  <div class="panel"><h3 title="Players who can play each spot, counting secondary positions">Position coverage</h3><div class="coverage">${POS.map((x, i) => `<span class="${cov[i] < 2 ? 'thin' : ''}">${x} ${cov[i]}</span>`).join('')}</div></div></section></div>`;
}
// ---------- team history ----------
function poFromHist(h, tid) {
  let best = -1, won = false;
  (h.playoffs || []).forEach((r, i) => (r.series || []).forEach(sr => { if (sr.hi === tid || sr.lo === tid) { best = i; won = sr.winner === tid; } }));
  return poLabel(best < 0 ? null : ((h.playoffs[best] || {}).stage || PO_STAGES[best]), won);
}
function teamHistory(t) {
  return franchiseChart(t) + achHtml(t, 't') + teamHistoryInner(t);
}
function teamHistoryInner(t) { return teamHistoryBase(t) + staffHistory(t); }
function teamHistoryBase(t) {
  const tid = t.id;
  const seasons = L.history.filter(h => h.standings.some(x => x.tid === tid)).map(h => ({ h, st: h.standings.find(x => x.tid === tid) }));
  // best player each season (production with this team), and franchise totals from completed seasons
  const bestBy = {}, tot = {};
  for (const p of Object.values(L.players)) for (const h of p.hist) {
    // only what he did for this team: traded players' seasons are split by team (older seasons fall back to his end-of-season team)
    const part = h.rsT ? h.rsT[tid] : (h.tid === tid ? h.rs : null);
    if (!part || !part.gp) continue;
    const v = seasonValue({ rs: part });
    if (part.gp >= gpq(15) && (!bestBy[h.s] || v > bestBy[h.s].v)) bestBy[h.s] = { p, h: { s: h.s, rs: part }, v };
    const o = tot[p.id] = tot[p.id] || { p, gp: 0, pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, seasons: 0 };
    o.gp += part.gp; o.pts += part.pts; o.reb += part.orb + part.drb; o.ast += part.ast; o.stl += part.stl; o.blk += part.blk; o.seasons++;
  }
  const res = x => x.st.po || poFromHist(x.h, tid);
  const W = seasons.reduce((a, x) => a + x.st.w, 0), Lo = seasons.reduce((a, x) => a + x.st.l, 0);
  const made = seasons.filter(x => !/Missed|play-in/.test(res(x))).length;
  const finals = seasons.filter(x => /Finals$|Champion/.test(res(x))).length;
  const bestSeason = seasons.slice().sort((a, b) => b.st.w / Math.max(1, b.st.w + b.st.l) - a.st.w / Math.max(1, a.st.w + a.st.l))[0];
  const live = ['regular', 'regular-done', 'playoffs', 'season-done'].includes(L.phase) && t.w + t.l > 0;
  const curRow = live ? `<tr class="mine"><td class="l">${seasonName(L.season)}*</td><td>${t.w}-${t.l}</td><td>${pct(t.w, t.w + t.l)}</td><td>${t.hw || 0}-${t.hl || 0}</td><td>${t.aw || 0}-${t.al || 0}</td><td>${confName(t.conf)[0]}${seedOrder(L, t.conf).indexOf(tid) + 1}</td><td class="l">${L.po ? esc(poResult(L, tid)) : 'In progress'}</td><td class="l">${clink(t.coach)}</td><td class="l muted">${STATUS_LABEL[t.status] || MODE_LABEL[t.mode]}</td><td class="l"></td></tr>` : '';
  const rows = seasons.slice().reverse().map(x => { const b = bestBy[x.h.s]; const r = res(x); return `<tr><td class="l"><a class="lk" data-hs="${x.h.s}">${seasonName(x.h.s)}</a></td><td>${x.st.w}-${x.st.l}</td><td>${pct(x.st.w, x.st.w + x.st.l)}</td><td>${x.st.hw != null ? x.st.hw + '-' + x.st.hl : '—'}</td><td>${x.st.aw != null ? x.st.aw + '-' + x.st.al : '—'}</td><td>${x.st.conf ? confName(x.st.conf)[0] + x.st.confSeed : x.st.seed}</td><td class="l ${r === 'Champion' ? 'w' : ''}">${r === 'Champion' ? '<strong>Champion</strong>' : esc(r)}</td><td class="l">${x.st.cid != null && findCoach(L, x.st.cid) ? clink(findCoach(L, x.st.cid)) : esc(x.st.coach || '—')}</td><td class="l muted">${STATUS_LABEL[x.st.shown || x.st.status] || MODE_LABEL[x.st.mode] || ''}</td><td class="l">${b ? `${plink(b.p)} <span class="muted">${f1(b.h.rs.pts / b.h.rs.gp)} pts · ${f1((b.h.rs.orb + b.h.rs.drb) / b.h.rs.gp)} reb · ${f1(b.h.rs.ast / b.h.rs.gp)} ast</span>` : '—'}</td></tr>`; }).join('');
  // honors won while with this team
  const honors = [];
  for (const sKey of Object.keys(L.awards || {}).map(Number).sort((a, b) => b - a)) {
    const A = L.awards[sKey];
    for (const [k, n] of [['mvp', 'MVP'], ['fmvp', 'Finals MVP'], ['dpoy', 'Defensive POY'], ['roy', 'Rookie of the Year'], ['smoy', 'Sixth Man'], ['mip', 'Most Improved']]) if (A[k] != null && L.players[A[k]] && (k === 'fmvp' ? A.champion === tid : awardTid(A, k, A[k]) === tid)) honors.push(`<div class="leader" style="grid-template-columns:60px minmax(0,1fr)"><span class="muted">${seasonName(sKey)}</span><span>${n}: ${plink(L.players[A[k]])}</span></div>`);
    if (A.coy != null && A.coyTid === tid && findCoach(L, A.coy)) honors.push(`<div class="leader" style="grid-template-columns:60px minmax(0,1fr)"><span class="muted">${seasonName(sKey)}</span><span>Coach of the Year: ${clink(findCoach(L, A.coy))}</span></div>`);
  }
  honors.push(...nbaTeamHonors(t));
  const coaches = [...L.teams.map(x => x.coach), ...L.coachPool, ...(L.coachArchive || [])].filter((c, i, a) => a.indexOf(c) === i && c.stints.some(st => st.tid === tid));
  const coachRows = coaches.map(c => { const recs = (c.seasons || []).filter(x => x.tid === tid); const w = recs.reduce((a, x) => a + x.w, 0), l = recs.reduce((a, x) => a + x.l, 0); const st = c.stints.filter(x => x.tid === tid); return { c, w, l, from: Math.min(...st.map(x => x.from)), txt: st.map(x => `${seasonName(x.from)}–${x.to ? seasonName(x.to) : 'now'}`).join(', '), titles: recs.filter(x => x.po === 'Champion').length }; }).sort((a, b) => a.from - b.from);
  const lead = (k, n) => { const all = Object.values(tot).sort((a, b) => b[k] - a[k]); const top = all.slice(0, 5);
    REC_BUILD['fr-' + tid + '-' + k] = { title: `${t.abbr} franchise leaders · ${n.toLowerCase()}`, build: () => all.slice(0, 50).map(x => ({ pid: x.p.id, name: x.p.name, v: x[k], ctx: `${x.seasons} season${x.seasons > 1 ? 's' : ''}` })) };
    return `<div class="panel"><h3>${n}</h3>${top.length ? top.map((x, i) => `<div class="leader"><span class="muted">${i + 1}</span><span>${plink(x.p)} <span class="muted">${x.seasons} season${x.seasons > 1 ? 's' : ''}</span></span><span class="v">${x[k]}</span></div>`).join('') : '<p class="muted">None yet.</p>'}${all.length > 5 ? `<p style="margin:6px 0 0"><button class="sm" data-top100="fr-${tid}-${k}">Top 50</button></p>` : ''}</div>`; };
  const hofs = (L.hof || []).filter(h => h.teams.includes(tid));
  return `<div class="grid2"><section class="stack"><div class="panel"><h3>Season by season</h3>${rows || curRow ? `<div class="tblwrap"><table><thead><tr><th class="l">Season</th><th>W-L</th><th>Pct</th><th>Home</th><th>Away</th><th title="Conference seed">Seed</th><th class="l">Playoffs</th><th class="l">Coach</th><th class="l">Plan</th><th class="l">Top player</th></tr></thead><tbody>${curRow}${rows}</tbody></table></div>` : '<p class="muted">Completed seasons appear here.</p>'}${live ? '<p class="muted" style="margin:6px 0 0;font-size:12px">* current season</p>' : ''}</div>
    <h3 style="margin:4px 0 0">Franchise leaders · completed seasons, only games played for this team</h3><div class="grid3">${lead('pts', 'Points')}${lead('reb', 'Rebounds')}${lead('ast', 'Assists')}${lead('gp', 'Games played')}${lead('stl', 'Steals')}${lead('blk', 'Blocks')}</div></section>
  <section class="stack"><div class="panel"><h3>Franchise summary</h3><div class="kv"><span class="k2">Seasons</span><span>${seasons.length}</span><span class="k2">All-time record</span><span>${W}-${Lo}${W + Lo ? ' (' + pct(W, W + Lo) + ')' : ''}</span><span class="k2">Playoff appearances</span><span>${made}</span>${(() => { const F = teamFinalYears(t); return `<span class="k2">Finals appearances</span><span>${finals + F.rf}</span><span class="k2">Championships</span><span>${F.won.length}${F.won.length ? ` <span class="muted">${F.won.join(', ')}</span>` : ''}</span><span class="k2">Finals losses</span><span>${F.lost.length}${F.lost.length ? ` <span class="muted">${F.lost.join(', ')}</span>` : ''}</span>`; })()}<span class="k2">Best season</span><span>${bestSeason ? `${seasonName(bestSeason.h.s)}, ${bestSeason.st.w}-${bestSeason.st.l}` : '—'}</span></div></div>
  <div class="panel"><h3>Award winners</h3>${honors.join('') || '<p class="muted">None yet.</p>'}</div>
  <div class="panel"><h3>Head coaches</h3>${coachRows.length ? coachRows.map(x => `<div class="leader" style="grid-template-columns:minmax(0,1fr) auto"><span>${clink(x.c)} <span class="muted">${x.txt}</span></span><span class="muted">${x.w}-${x.l}${x.titles ? ' · ' + x.titles + ' title' + (x.titles > 1 ? 's' : '') : ''}</span></div>`).join('') : '<p class="muted">—</p>'}</div>
  ${t.retired.length ? `<div class="panel"><h3>Retired numbers</h3>${t.retired.map(r => `<div class="leader" style="grid-template-columns:44px minmax(0,1fr) auto"><span class="v">#${r.num}</span><span>${L.players[r.pid] ? plink(L.players[r.pid]) : esc(r.name)}</span><span class="muted">${seasonName(r.s)}</span></div>`).join('')}</div>` : ''}
  ${hofs.length ? `<div class="panel"><h3>Hall of Famers</h3>${hofs.map(h => `<div>${L.players[h.pid] ? plink(L.players[h.pid]) : esc(h.name)} <span class="muted">class of ${draftLabel(h.s)}</span></div>`).join('')}</div>` : ''}</section></div>`;
}
// ===== v32d: rotation chart editor (your team). t.rotChart = { q: [4 quarters][4 blocks of 3 min][5 player ids] }; null = the coach's pattern =====
const RC_BLK = 16;
function rcFromPlan(plan) { return Array.from({ length: RC_BLK }, (_, i) => { const m = Math.min(47, Math.floor(i / 4) * 12 + (i % 4) * 3 + 1); return plan[m].filter(Boolean).map(p => p.id); }); }
function rcSaved(t) { const c = t.rotChart; if (!c || !Array.isArray(c.q)) return null; const out = []; for (let q = 0; q < 4; q++) for (let b = 0; b < 4; b++) out.push(((c.q[q] || [])[b] || []).filter(x => x != null)); return out; }
function rcDraft(t) {
  if (!ui.rcDraft || ui.rcDraft.tid !== t.id) { let blocks = rcSaved(t), src = 'chart'; if (!blocks) { try { blocks = rcFromPlan(buildSide(L, t.id, true).plan); } catch (e) { blocks = Array.from({ length: RC_BLK }, () => []); } src = 'coach'; } ui.rcDraft = { tid: t.id, blocks, src, dirty: false }; }
  return ui.rcDraft;
}
function rcMinutes(d) { const m = {}; for (const b of d.blocks) for (const id of b) m[id] = (m[id] || 0) + 3; return m; }
function rcProblems(t, d) {
  const bad = [], pl = id => L.players[id];
  d.blocks.forEach((b, i) => { if (new Set(b).size !== 5) bad.push(`Q${Math.floor(i / 4) + 1} block ${i % 4 + 1} has ${new Set(b).size} players (needs 5)`); });
  return bad;
}
// v32g: a player in the chart who is out no longer blocks saving: a stand-in takes his blocks each game until he's back
function rcOut(d) { const out = []; for (const id of new Set(d.blocks.flat())) { const p = L.players[id]; if (p && ((p.injury > 0 && !isDTD(p)) || isSusp(p))) out.push(`${p.name} is out (${p.injury > 0 ? 'injured' : 'suspended'})`); } return out; }
function rcWarnings(t, mins) {
  const out = [];
  for (const id of t.roster) { const p = L.players[id], rk = p ? roleOf(L, p) : null, r = rk ? ROLE_BY[rk] : null; if (!r || p.injury > 0) continue; const m = mins[id] || 0; if (m < r.lo - 1.5) out.push([id, `${m} min is under his ${r.n} target (${r.lo}-${r.hi})`]); else if (m > r.hi + 1.5) out.push([id, `${m} min is over his ${r.n} target (${r.lo}-${r.hi})`]); }
  return out;
}
function rotEditor(t) {
  const d = rcDraft(t), mins = rcMinutes(d), probs = rcProblems(t, d), warns = rcWarnings(t, mins), wmap = new Map(warns);
  const sel = t.roster.map(id => L.players[id]).filter(Boolean).sort((a, b) => (mins[b.id] || 0) - (mins[a.id] || 0) || b.ovr - a.ovr);
  const heads = [0, 1, 2, 3].map(q => `<th colspan="4" class="rc-qh">Q${q + 1}</th>`).join('');
  const blk = Array.from({ length: RC_BLK }, (_, i) => `<th class="rc-bh ${i % 4 === 0 ? 'rc-bq' : ''}" title="Minutes ${(i % 4) * 3}-${(i % 4) * 3 + 3} of Q${Math.floor(i / 4) + 1}">${(i % 4) * 3 + 3}</th>`).join('');
  const rows = sel.map(p => { const out = (p.injury > 0 && !isDTD(p)) || isSusp(p), rk = roleOf(L, p), w = wmap.get(p.id), m = mins[p.id] || 0;
    return `<tr class="${out ? 'rc-out' : ''}"><td class="l rc-pn"><a class="lk" data-player="${p.id}">${esc(shortName(p))}</a> <span class="muted">${esc(posLabel(p))}</span></td>${Array.from({ length: RC_BLK }, (_, i) => { const on = d.blocks[i].includes(p.id); return `<td class="rc-c ${i % 4 === 0 ? 'rc-bq' : ''}"><button class="rc-b ${on ? 'on' : ''}" data-rcb="${p.id}|${i}" aria-pressed="${on}" aria-label="${esc(shortName(p))} Q${Math.floor(i / 4) + 1} block ${i % 4 + 1}" ${out && !on ? 'disabled' : ''}></button></td>`; }).join('')}<td class="${w ? 'lo' : ''}" title="${w ? esc(w) : ''}"><strong>${m}</strong></td><td class="muted" style="white-space:nowrap">${rk ? roleRange(rk) : '—'}</td></tr>`; }).join('');
  const cnt = `<tr class="nosort"><td class="l"><strong>On court</strong></td>${d.blocks.map((b, i) => { const n = new Set(b).size; return `<td class="rc-c ${i % 4 === 0 ? 'rc-bq' : ''} ${n === 5 ? 'w' : 'lo'}"><strong>${n}</strong></td>`; }).join('')}<td></td><td></td></tr>`;
  const using = t.rotChart && !d.dirty ? 'Using your saved chart.' : t.rotChart ? 'Editing (not saved yet).' : d.dirty ? 'Editing (not saved yet). The coach pattern is used until you save.' : 'Showing the coach pattern. Save it as your chart to start editing from it.';
  const lastTl = (() => { const g = [...L.games].reverse().find(x => (x.home === t.id || x.away === t.id) && x.tl); return g && g.tl[g.home === t.id ? 0 : 1]; })(), lastBad = lastTl && lastTl.bad ? lastTl.bad : null, lastSubs = lastTl && lastTl.subs && lastTl.subs.length ? lastTl.subs : null;
  return `<div class="panel"><h3>Rotation chart · Q1-Q4 in 3-minute blocks</h3><p class="muted" style="margin:-4px 0 8px;font-size:12px">${using} Tap a square to put a player on the court for that block; each block needs exactly 5. Starters of Q1 and Q3 open the halves. Blowouts, close finishes, foul trouble and injuries still change who plays.</p>
  <div class="tblwrap"><table class="rc-edit"><thead><tr><th class="l" rowspan="2">Player</th>${heads}<th rowspan="2">Min</th><th rowspan="2" title="His role's minutes range">Role</th></tr><tr>${blk}</tr></thead><tbody>${rows}${cnt}</tbody></table></div>
  ${probs.length ? `<div class="msg no" style="margin-top:8px"><strong>Can't save yet.</strong> ${probs.slice(0, 4).map(esc).join(' · ')}${probs.length > 4 ? ' · …' : ''}</div>` : ''}
  ${warns.length ? `<div class="msg" style="margin-top:8px;border-left:3px solid var(--warn)"><strong>Minutes vs role targets</strong> (more than half a block outside the range; players may get unhappy)<br>${warns.slice(0, 8).map(([id, tx]) => `${esc(shortName(L.players[id]))}: ${esc(tx)}`).join('<br>')}${warns.length > 8 ? `<br>+ ${warns.length - 8} more` : ''}</div>` : ''}
  ${rcOut(d).length ? `<div class="msg" style="margin-top:8px">${rcOut(d).map(esc).join(' · ')}: the best fit on the bench takes his blocks each game until he's back (the game's rotation chart says who).</div>` : ''}
  ${lastBad ? `<div class="msg no" style="margin-top:8px">Your last game did not use your chart: ${esc(lastBad)}.</div>` : ''}
  ${lastSubs ? `<div class="msg" style="margin-top:8px">Last game, players who were out got a stand-in: ${lastSubs.map(esc).join('; ')}.</div>` : ''}
  <div class="row" style="margin-top:10px;flex-wrap:wrap"><button class="primary" data-rcact="save" ${probs.length ? 'disabled' : ''}>Save chart</button><button data-rcact="revert" ${d.dirty ? '' : 'disabled'}>Undo edits</button><button data-rcact="reset" ${t.rotChart || d.dirty ? '' : 'disabled'}>Reset to coach pattern</button></div></div>`;
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-rcb],[data-rcact]'); if (!b || !L || L.user == null) return;
  const t = L.teams[L.user], d = rcDraft(t);
  if (b.dataset.rcb) { const [pid, i] = b.dataset.rcb.split('|').map(Number), blk = d.blocks[i], k = blk.indexOf(pid); if (k >= 0) blk.splice(k, 1); else blk.push(pid); d.dirty = true; }
  else { const a = b.dataset.rcact;
    if (a === 'save') { if (rcProblems(t, d).length) return; t.rotChart = { q: [0, 1, 2, 3].map(q => [0, 1, 2, 3].map(bk => d.blocks[q * 4 + bk].slice())) }; d.dirty = false; d.src = 'chart'; save(); }
    else if (a === 'reset') { t.rotChart = null; ui.rcDraft = null; save(); }
    else if (a === 'revert') ui.rcDraft = null; }
  const y = window.scrollY; render(); window.scrollTo(0, y);
});
function rotationPanel(t) {
  const g = buildSide(L, t.id, true);
  const order = [...g.court.filter(Boolean)];
  const bench = g.players.filter(p => !g.starters.has(p.id)).sort((a, b) => (g.target[b.id] || 0) - (g.target[a.id] || 0));
  const keys = new Set(g.players.slice().sort((a, b) => playerValue(b, t.coach) - playerValue(a, t.coach)).slice(0, 6).map(p => p.id));
  const pool8 = g.players.slice().sort((a, b) => playerValue(b, t.coach) - playerValue(a, t.coach)).slice(0, 8);
  const stoppers = new Set(pool8.slice().sort((a, b) => defScore(g, b) - defScore(g, a)).slice(0, 2).map(p => p.id));
  const scorers = new Set(pool8.slice().sort((a, b) => offScore(g, b) - offScore(g, a)).slice(0, 2).map(p => p.id));
  const injured = teamPlayers(t.id).filter(p => p.injury > 0 || isSusp(p));
  const row = (p, role) => { const s = rs(p); const notes = [keys.has(p.id) ? 'Closer' : '', stoppers.has(p.id) ? 'Late-game stopper' : '', scorers.has(p.id) ? 'Late-game scorer' : '', keys.has(p.id) ? 'Rests in blowouts' : ''].filter(Boolean).join(' · ');
    return `<tr class="click" data-player="${p.id}"><td class="l">${role}</td><td class="l">${esc(p.name)}</td><td class="l">${posLabel(p)}</td><td>${ovrTxt(p)}</td><td><strong>${Math.round((g.target[p.id] || 0) / 60)}</strong></td><td>${s && s.gp ? f1(s.min / s.gp / 60) : '—'}</td><td>${hasUsg(s) ? f1(usg(s)) : '—'}</td><td class="l muted">${notes}</td></tr>`; };
  const star = p => g.stars.has(p.id) ? 'Star · ' : '';
  const rl = p => t.manual ? null : roleOf(L, p);   // v32b
  const rows = [...order.map(p => row(p, rl(p) ? roleName(rl(p)) + ' (' + POS[g.slotOf[p.id]] + ')' : star(p) + 'Starter (' + POS[g.slotOf[p.id]] + ')')), ...bench.map((p, i) => row(p, rl(p) ? roleName(rl(p)) : star(p) + ((g.target[p.id] || 0) <= 0 ? 'Deep bench' : i === 0 ? 'Sixth man' : 'Rotation'))), ...injured.map(p => `<tr class="click" data-player="${p.id}"><td class="l">${p.injury > 0 ? 'Injured' : 'Suspended'}</td><td class="l">${esc(p.name)}</td><td class="l">${posLabel(p)}</td><td>${ovrTxt(p)}</td><td>0</td><td>${rs(p) && rs(p).gp ? f1(rs(p).min / rs(p).gp / 60) : '—'}</td><td>—</td><td class="l muted">${p.injury > 0 ? esc(p.injName || '') + ', out ' + injGames(p) : 'Suspended, ' + suspGames(p) + ' game' + (suspGames(p) > 1 ? 's' : '') + ' left'}</td></tr>`)].join('');
  return `<div class="panel"><h3>Rotation & roles · ${esc(t.coach.rot || 'Balanced')} rotation, ${t.manual && t.manual.depth ? t.manual.depth : t.coach.depth} deep</h3><div class="tblwrap"><table class="sortable" data-sid="rotation"><thead><tr><th class="l">Role</th><th class="l">Player</th><th class="l">Pos</th><th>Ovr</th><th>Proj min</th><th>Avg min</th><th>USG%</th><th class="l">Late game</th></tr></thead><tbody>${rows}</tbody></table></div>
  <details class="about"><summary>How this works</summary><p>Projected minutes are the coach's plan for a normal game. Every player has a role with a minutes range: Franchise star 34-37, Star 32-35, Starter 26-32, Sixth man 24-28, Rotation 16-24, Bench 8-16, Development 0-8. Tight rotations aim for the top of each range, deep rotations for the bottom; when someone is out, the others stretch their ranges. Players compare their minutes with their role (mood). In the last 5 minutes of close games the closers play; in the last 2 minutes the defense brings in stoppers and a trailing team brings in scorers. In blowouts the closers rest.</p></details></div>`;
}
function coachKV(c) {
  const k = c.contract;
  return `<div class="kv"><span class="k2">Name</span><span>${clink(c)} · age ${c.age}</span><span class="k2">Contract</span><span>${k ? `${money(k.amt)}/yr through ${seasonName(k.exp)}` : 'None'}</span><span class="k2">Overall</span><span><strong>${c.ovr}</strong>${commish() ? ' · potential ' + c.pot : ''}</span><span class="k2">Offense / defense / development</span><span>${c.ro} / ${c.rd} / ${c.rdev}</span><span class="k2">Systems</span><span>${OFF_SYS[c.off].name} · ${DEF_SYS[c.def].name}</span><span class="k2">Pace</span><span>${c.pace} possessions / 48</span><span class="k2">Rotation</span><span>${esc(c.rot || 'Balanced')}, ${c.depth} players</span><span class="k2">Minutes lean</span><span>${c.youth > 0 ? 'Favors young players' : c.youth < 0 ? 'Favors veterans' : 'Neutral'}</span><span class="k2">Career record</span><span>${c.w}-${c.l} · playoffs ${c.pw}-${c.pl} · titles ${c.titles}${c.coy ? ' · Coach of the Year ×' + c.coy : ''}</span></div>`;
}
// v25.1: My Team → Active rivalries: each active rival with this season's record, all-time, playoffs and the next meeting
function rivalsTab(t) {
  const rs = rivalOpps(L, t.id).map(x => ({ o: L.teams[x.o], kinds: x.kinds, r: h2h(L, t.id, x.o) })).sort((a, b) => ['arch', 'po', 'conf'].indexOf(a.kinds[0]) - ['arch', 'po', 'conf'].indexOf(b.kinds[0]));
  if (!rs.length) return '<p class="muted">No active rivalries.</p>';
  const H2 = seasonH2H(L);
  const poThis = o => { let w = 0, l = 0; for (const g of L.games) if (g.playoff && ((g.home === t.id && g.away === o) || (g.away === t.id && g.home === o))) { const my = g.home === t.id ? g.hs : g.as, th = g.home === t.id ? g.as : g.hs; if (my > th) w++; else l++; } return [w, l]; };
  const next = o => { if (L.phase === 'regular') for (let d = L.day; d < L.schedule.length; d++) for (const [h, a] of L.schedule[d]) if ((h === t.id && a === o) || (a === t.id && h === o)) return `${dayTxt(d)} ${h === t.id ? 'vs' : 'at'} ${L.teams[o].abbr}`; return L.phase === 'regular' ? 'None left this season' : 'Next season'; };
  const rows = rs.map(({ o, r, kinds }) => { const mine = r.lo === t.id; const w = mine ? r.wLo : r.wHi, l = mine ? r.wHi : r.wLo, pw = mine ? r.poLo : r.poHi, pl = mine ? r.poHi : r.poLo; const sw = H2[t.id + '-' + o.id] || 0, sl = H2[o.id + '-' + t.id] || 0; const [qw, ql] = poThis(o.id);
    return `<tr><td class="l">${tlabel(o.id, true)}</td><td class="l">${kinds.map(k => RIV_LABEL[k]).join(' · ')}</td><td data-v="${sw - sl}"><strong>${sw}-${sl}</strong>${qw + ql ? ` <span class="muted">(playoffs ${qw}-${ql})</span>` : ''}</td><td data-v="${w - l}">${w}-${l}</td><td data-v="${pw - pl}">${pw + pl ? pw + '-' + pl : '—'}</td><td data-v="${r.series || 0}">${r.series || 0}</td><td data-v="${Math.round(r.heat || 0)}">${Math.round(r.heat || 0)}</td><td class="l">${next(o.id)}</td></tr>`; }).join('');
  return `<section class="panel"><h3>Active rivalries · ${esc(t.abbr)}</h3><div class="tblwrap"><table class="sortable" data-sid="rivtab"><thead><tr><th class="l">Rival</th><th class="l">Kind</th><th title="Regular season (and playoff games) this season">This season</th><th title="Regular-season games all-time">All-time</th><th title="Playoff games all-time">Playoffs</th><th title="Playoff series against each other">Series</th><th title="How heated the rivalry is">Heat</th><th class="l">Next meeting</th></tr></thead><tbody>${rows}</tbody></table></div><p class="muted" style="margin:6px 0 0">Conference and arch rivals are permanent; a playoff rival comes from meeting often in the playoffs (2+ series in 5 seasons or 4+ in 10).</p></section>`;
}
// v25.1: My Team → Past games: every game this season (playoffs too), newest first, with notable performers; click a row for the box score
function pastGamesTab(t) {
  const gs = L.games.filter(g => g.home === t.id || g.away === t.id).slice().reverse();
  if (!gs.length) return '<p class="muted">No games played yet this season.</p>';
  const line = (r) => { const reb = r[10] + r[11], ast = r[12], stl = r[13], blk = r[14]; const p = L.players[r[0]]; const dd = [r[3], reb, ast, stl, blk].filter(x => x >= 10).length;
    return `${p ? esc(shortName(p)) : 'Player'} ${r[3]} pts${reb >= 5 ? ', ' + reb + ' reb' : ''}${ast >= 5 ? ', ' + ast + ' ast' : ''}${stl >= 4 ? ', ' + stl + ' stl' : ''}${blk >= 4 ? ', ' + blk + ' blk' : ''}${dd >= 3 ? ' <span class="pill">Triple-double</span>' : ''}`; };
  const rows = gs.map(g => { const home = g.home === t.id, my = home ? g.hs : g.as, th = home ? g.as : g.hs, o = home ? g.away : g.home, si = home ? 0 : 1;
    const best = sd => { const rs = (g.box || []).filter(r => r[1] === sd); return rs.length ? rs.reduce((a, r) => gmsc(r.slice(2)) > gmsc(a.slice(2)) ? r : a) : null; };
    const picks = [best(si), best(1 - si)].filter(Boolean); const ids = new Set(picks.map(r => r[0]));
    for (const r of g.box || []) { if (ids.has(r[0])) continue; const reb = r[10] + r[11]; if (r[3] >= 30 || [r[3], reb, r[12], r[13], r[14]].filter(x => x >= 10).length >= 3) { picks.push(r); ids.add(r[0]); } }
    const perf = picks.map(r => `<span class="pgperf">${L.teams[r[1] === 0 ? g.home : g.away].abbr} · ${line(r)}</span>`).join('');
    return `<tr class="click" data-game="${g.id}"><td class="l">${g.playoff ? esc(g.stage || 'Playoffs') + (g.gnum ? ' G' + g.gnum : '') : dayTxt(g.day, g.season)}</td><td class="l">${esc(L.teams[g.away].abbr)} at ${esc(L.teams[g.home].abbr)}<div class="pgperfs">${perf}</div></td><td><strong>${g.as}-${g.hs}</strong>${g.ot ? ' <span class="muted">' + (g.ot > 1 ? g.ot : '') + 'OT</span>' : ''}</td><td class="${my > th ? 'w' : 'lo'}"><strong>${my > th ? 'W' : 'L'}</strong> ${home ? 'vs' : 'at'} ${esc(L.teams[o].abbr)}</td></tr>`; }).join('');
  const w = gs.filter(g => (g.home === t.id ? g.hs > g.as : g.as > g.hs)).length;
  return `<section class="panel"><h3>Past games · ${seasonName(L.season)} · ${w}-${gs.length - w}</h3><div class="tblwrap"><table><thead><tr><th class="l">When</th><th class="l">Game · notable performers</th><th>Score</th><th>Result</th></tr></thead><tbody>${rows}</tbody></table></div><p class="muted" style="margin:6px 0 0">Newest first. Performers: the best game score on each side, plus any 30-point game or triple-double. Click a game for the box score.</p></section>`;
}
function rivalBlock(t) {
  const rs = rivalOpps(L, t.id).map(x => ({ o: L.teams[x.o], kinds: x.kinds, r: h2h(L, t.id, x.o) })).sort((a, b) => ['arch', 'po', 'conf'].indexOf(a.kinds[0]) - ['arch', 'po', 'conf'].indexOf(b.kinds[0]));
  if (!rs.length) return '';
  const H2 = seasonH2H(L), LEFT = L.phase === 'regular' ? L.schedule.slice(L.day).flat() : [];
  return `<div class="panel"><h3>Rivalries</h3>${rs.map(({ o, r, kinds }) => { const mine = r.lo === t.id; const w = mine ? r.wLo : r.wHi, l = mine ? r.wHi : r.wLo; const pw = mine ? r.poLo : r.poHi, pl = mine ? r.poHi : r.poLo; const sw = H2[t.id + '-' + o.id] || 0, sl = H2[o.id + '-' + t.id] || 0, left = LEFT.filter(([h, a]) => (h === t.id && a === o.id) || (a === t.id && h === o.id)).length; let nx = null; if (L.phase === 'regular') for (let d = L.day; d < L.schedule.length && nx == null; d++) for (const [h, a] of L.schedule[d]) if ((h === t.id && a === o.id) || (a === t.id && h === o.id)) { nx = { d, home: h === t.id }; break; }
    return `<div class="leader" style="grid-template-columns:minmax(0,1fr) auto"><span>${tlabel(o.id, true)} <span class="muted">${kinds.map(k => RIV_LABEL[k]).join(' · ')}</span></span><span class="muted">all-time ${w}-${l}${pw + pl ? ` · playoffs ${pw}-${pl}` : ''}${L.phase === 'regular' || sw + sl ? ` · <strong>this season ${sw}-${sl}</strong>${left ? `, ${left} left` : ''}` : ''}${nx ? ` · next: day ${nx.d + 1} ${nx.home ? 'vs' : 'at'} ${esc(o.abbr)}` : ''}</span></div>`; }).join('')}</div>`;
}
function lineupEditor(t) {
  const ps = teamPlayers(t.id);
  const m = t.manual || { starters: [null, null, null, null, null], order: [], depth: t.coach.depth };
  const opt = (sel, slot) => `<option value="">Coach decides</option>` + ps.slice().sort((a, b) => slotRating(b, slot) - slotRating(a, slot)).map(p => `<option value="${p.id}" ${sel === p.id ? 'selected' : ''}>${esc(p.name)} · ${slotRating(p, slot)} at ${POS[slot]}${p.injury > 0 ? ' (injured)' : isSusp(p) ? ' (suspended)' : ''}</option>`).join('');
  // projected starters: the user's picks, then the coach fills empty spots
  const proj = m.starters.slice(); const used = new Set(proj.filter(Boolean));
  const healthy = ps.filter(p => p.injury <= 0 && !isSusp(p));
  const pairs = []; for (const p of healthy) for (let s = 0; s < 5; s++) pairs.push([playerValue(p, t.coach, s), p, s]);
  pairs.sort((a, b) => b[0] - a[0]);
  for (const [v, p, s] of pairs) { if (proj[s] != null && L.players[proj[s]] && L.players[proj[s]].injury <= 0 && !isSusp(L.players[proj[s]])) continue; if (used.has(p.id)) continue; if (proj[s] == null || (L.players[proj[s]] && (L.players[proj[s]].injury > 0 || isSusp(L.players[proj[s]])))) { proj[s] = p.id; used.add(p.id); } }
  ui.benchIds = null;
  const startersLine = POS.map((x, s) => proj[s] ? `${x}: ${esc(L.players[proj[s]].name)}${m.starters[s] == null ? ' <span class="muted">(coach)</span>' : ''}` : x + ': —').join(' · ');
  const bench = ps.filter(p => !used.has(p.id) && !m.starters.includes(p.id)).sort((a, b) => { const o = m.order || []; const ia = o.indexOf(a.id), ib = o.indexOf(b.id); return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || playerValue(b, t.coach) - playerValue(a, t.coach); });
  ui.benchIds = bench.map(p => p.id);
  const moodT = `<label class="check" style="margin:0 0 8px"><input type="checkbox" id="moodauto" ${t.moodAuto !== false ? 'checked' : ''}> <span>Coach manages moods: a few extra minutes for unhappy regulars</span></label><label class="check" style="margin:0 0 8px" title="On the second night of a back-to-back, tired players play a little worse and get hurt a little more often. Resting them avoids that.">Load management on back-to-backs <select id="loadmgmt">${[[0, 'Off'], [1, 'Rest players 30+'], [2, 'Whole rotation']].map(([v, n]) => `<option value="${v}" ${(t.loadMgmt === true ? 1 : +t.loadMgmt || 0) === v ? 'selected' : ''}>${n}</option>`).join('')}</select></label>`;
  return `<div class="panel"><h3>Lineup & rotation</h3>${moodT}<details class="about"><summary>How this works</summary><p>Ratings shown are at each spot; out-of-position players get a penalty. Injured picks are skipped automatically.</p></details>
  <div class="grid3" style="gap:10px">${POS.map((x, s) => `<label><span class="k">Starting ${x}</span><br><select data-starter="${s}" style="width:100%">${opt(m.starters[s], s)}</select></label>`).join('')}
  <label><span class="k">Rotation size</span><br><select id="depth">${[8, 9, 10].map(n => `<option ${(m.depth || t.coach.depth) === n ? 'selected' : ''}>${n}</option>`).join('')}</select></label></div>
  <p style="margin:12px 0 0"><span class="k">Projected starters</span><br>${startersLine}</p>
  <h3 style="margin-top:14px;font-size:14px">Bench order (top players get more minutes)</h3>${bench.map((p, i) => `<div class="check"><span class="muted" style="width:20px">${i + 6}</span><span class="grow">${plink(p)} <span class="muted">${posLabel(p)} · ${ovrTxt(p)}</span>${injPill(p)}${scoutPill(p)}</span><button class="sm" data-up="${p.id}" ${i === 0 ? 'disabled' : ''}>Up</button><button class="sm" data-down="${p.id}" ${i === bench.length - 1 ? 'disabled' : ''}>Down</button></div>`).join('')}
  <div class="row" style="margin-top:10px"><button id="lineup-reset">Let the coach decide everything</button></div></div>${lateEditor(t)}${playbookEditor(t)}${philPanel(t.coach, t)}${trainEditor(t)}`;
}

// ---------- players ----------
const PCOLS = [['name', 'Player', 'l'], ['team', 'Team', 'l'], ['pos', 'Pos', 'l'], ['age', 'Age'], ['ovr', 'Ovr'], ['pot', 'Pot'], ['sal', 'Salary'], ['gp', 'GP'], ['min', 'Min'], ['pts', 'Pts'], ['orb', 'ORB'], ['drb', 'DRB'], ['reb', 'Reb'], ['ast', 'Ast'], ['stl', 'Stl'], ['blk', 'Blk'], ['usg', 'USG%'], ['fg', 'FG%'], ['tp', '3P%'], ['ftp', 'FT%'], ['bpm', 'BPM'], ['per', 'PER'], ['ws', 'WS']];
const ACOLS = [['name', 'Player', 'l'], ['team', 'Team', 'l'], ['pos', 'Pos', 'l'], ['ovr', 'Ovr'], ['gp', 'GP'], ['min', 'Min'], ['ts', 'TS%'], ['efg', 'eFG%'], ['usg', 'USG%'], ['astto', 'AST/TO'], ['tpar', '3PA rate'], ['ftr', 'FT rate'], ['gmsc', 'GmSc'], ['eff', 'EFF'], ['pmg', '+/- per game'], ['pmt', '+/- total'], ['obpm', 'OBPM'], ['dbpm', 'DBPM'], ['bpm', 'BPM'], ['per', 'PER'], ['ows', 'OWS'], ['dws', 'DWS'], ['ws', 'WS'], ['ws48', 'WS/48'], ['vorp', 'VORP']];
const COL_TIPS = { ts: 'True shooting: scoring efficiency counting threes and free throws', efg: 'Effective FG%: field goal % with threes worth 1.5', usg: 'Usage rate: share of team possessions used on the floor', astto: 'Assists per turnover', tpar: 'Share of shots that are threes', ftr: 'Free throw attempts per field goal attempt', gmsc: 'Game score per game: one-number box score rating', eff: 'Efficiency per game: points + rebounds + assists + steals + blocks − misses − turnovers', pmg: 'Plus-minus per game: team point margin while he was on the floor', pmt: 'Total plus-minus this season', obpm: 'Offensive box plus-minus: points per 100 possessions above a league-average player, estimated from the box score', dbpm: 'Defensive box plus-minus: defensive impact per 100 possessions above average, estimated from the box score', bpm: 'Box plus-minus: OBPM + DBPM. 0 is average, +5 is all-league level', per: 'Player efficiency rating: per-minute box score production, pace-adjusted; league average is 15', ows: 'Offensive win shares: wins added by his offense (points produced vs possessions used)', dws: 'Defensive win shares: wins added by his defense (stops, team defense, minutes)', ws: 'Win shares: OWS + DWS; a team\'s players add up to about its wins', ws48: 'Win shares per 48 minutes: league average is about .100', vorp: 'Value over replacement player: BPM above -2.0, times share of minutes (82-game scale)' };
function pval(p, k) {
  const s = sx(p), pg = pgx;
  switch (k) {
    case 'name': return p.name; case 'team': return p.team == null ? 'FA' : L.teams[p.team].abbr; case 'pos': return p.pos;
    case 'sal': return p.contract ? p.contract.amt : 0;
    case 'ovr': return ovrNum(p);   // v35b: your scouts' read
    case 'pot': return commish() ? p.pot : p.scout;
    case 'usg': return usg(s);
    case 'ts': return s && s.fga ? tsPct(s) : -1; case 'efg': return s && s.fga ? efgPct(s) : -1;
    case 'astto': return s && s.tov ? s.ast / s.tov : s && s.ast ? 99 : 0; case 'tpar': return s && s.fga ? s.tpa / s.fga : -1; case 'ftr': return s && s.fga ? s.fta / s.fga : -1;
    case 'gmsc': return gmscPg(s); case 'eff': return effPg(s); case 'pmg': return pmPg(s); case 'pmt': return s ? s.pm || 0 : 0;
    case 'gp': return s ? s.gp : 0; case 'min': return pg(p, 'min') / 60; case 'reb': return pg(p, 'orb') + pg(p, 'drb');
    case 'pts': case 'ast': case 'stl': case 'blk': case 'orb': case 'drb': return pg(p, k);
    case 'obpm': case 'dbpm': case 'bpm': case 'per': case 'ows': case 'dws': case 'ws': case 'ws48': case 'vorp': return s && s[k] != null ? s[k] : -99;
    case 'fg': return s && s.fga ? s.fgm / s.fga : -1; case 'tp': return s && s.tpa ? s.tpm / s.tpa : -1; case 'ftp': return s && s.fta ? s.ftm / s.fta : -1;
    default: return p[k];
  }
}
// v31: a cut player aged 26 or younger plays overseas (p.abroad); he is not a free agent and cannot be signed
function faTxt(p) { return p && p.abroad && !p.retired ? `<span class="muted" title="Plays overseas, not signable">${esc(abroadLabel(p))}</span>` : '<span class="muted">FA</span>'; }
// v33c: PER / OWS / DWS / WS / WS/48 / VORP cells (rates need the minutes qualifier, like BPM)
const ws48Txt = v => v == null ? '—' : (v < 0 ? '-' : '') + Math.abs(v).toFixed(3).replace(/^0/, '');
function advCells(p, s) { const q = x => p ? nmCell(p, 'min', x) : x; return `<td>${s && s.per != null ? q(f1(s.per)) : '—'}</td><td>${s && s.ows != null ? f1(s.ows) : '—'}</td><td>${s && s.dws != null ? f1(s.dws) : '—'}</td><td>${s && s.ws != null ? f1(s.ws) : '—'}</td><td>${s && s.ws48 != null ? q(ws48Txt(s.ws48)) : '—'}</td><td>${s && s.vorp != null ? f1(s.vorp) : '—'}</td>`; }
function vPlayers() {
  const rs = sx, pg = pgx; computeAdv(L, skey());
  let ps = Object.values(L.players).filter(p => !p.retired && !p.prospect);
  if (ui.pfTeam === 'retired') ps = Object.values(L.players).filter(p => p.retired);
  else if (ui.pfTeam !== 'all') ps = ps.filter(p => ui.pfTeam === 'fa' ? p.team == null && !p.abroad : ui.pfTeam === 'ov' ? !!p.abroad : p.team === +ui.pfTeam);
  if (ui.pfPos !== 'all') ps = ps.filter(p => p.pos === +ui.pfPos || p.pos2 === +ui.pfPos);
  if (ui.pq) { const q = ui.pq.toLowerCase(); ps = ps.filter(p => p.name.toLowerCase().includes(q)); }
  if (ui.pfAgeLo) ps = ps.filter(p => p.age >= +ui.pfAgeLo); if (ui.pfAgeHi) ps = ps.filter(p => p.age <= +ui.pfAgeHi);   // v28.7 S1
  if (skey() === 'po' && !ui.pq) ps = ps.filter(p => rs(p) && rs(p).gp > 0);
  // stat leaders only count qualified players: half of the team's games (and 8+ minutes for advanced rates)
  const showAll = ui.pAll || ui.pq || ui.pfTeam === 'retired';
  if (!showAll && ui.pfTeam !== 'fa') ps = ps.filter(p => isQual(p, skey()));
  if (ui.pfType) ps = ps.filter(p => (p.arch || []).some(a => a.p + '|' + a.n === ui.pfType));
  const k = ui.psort, d = ui.pdir;
  ps.sort((a, b) => { const q = PQ[k]; if (q) { const oa = qualS(sx(a), q) && isQual(a, skey()), ob = qualS(sx(b), q) && isQual(b, skey()); if (oa !== ob) return oa ? -1 : 1; if (!oa) return 0; } const x = pval(a, k), y = pval(b, k); return (typeof x === 'string' ? x.localeCompare(y) : x - y) * d; });   // v25.4: NM rows sort to the bottom both ways
  const pfTeamAge = `<label>Team <select id="pft" aria-label="Team"><option value="all">All teams</option>${L.teams.map(t => `<option value="${t.id}" ${ui.pfTeam == t.id ? 'selected' : ''}>${esc(tname(t.id))}</option>`).join('')}<option value="fa" ${ui.pfTeam === 'fa' ? 'selected' : ''}>Free agents</option><option value="ov" ${ui.pfTeam === 'ov' ? 'selected' : ''}>Overseas</option><option value="retired" ${ui.pfTeam === 'retired' ? 'selected' : ''}>Retired players</option></select></label><label>Age <input type="number" id="pfa1" min="18" max="45" value="${esc(ui.pfAgeLo || '')}" placeholder="min" style="width:58px"> – <input type="number" id="pfa2" min="18" max="45" value="${esc(ui.pfAgeHi || '')}" placeholder="max" style="width:58px"></label>`;   // v28.7 S1: team + age filters (all three views)
  const adv = ui.pAdv;
  if (ui.pDef) {   // v16 defense view: 20+ minutes a game and half the team's games
    const dk = skey() === 'po' ? 'dzp' : 'dz';
    const dp = ps.filter(p => p.stats[dk] && p.stats[dk][0] && (showAll || qualS(rs(p), 'min')));
    const drow = p => { const d = p.stats[dk], s = rs(p), g = s.gp; const fg = d[1] / d[0], xp = d[2] / d[0], df = (fg - xp) * 100;
      return `<tr class="click ${isUser(p.team) ? 'mine' : ''}" data-player="${p.id}"><td class="l">${esc(p.name)}${injPill(p)}</td><td class="l">${p.team == null ? faTxt(p) : tlabel(p.team)}</td><td class="l">${posLabel(p)}</td><td>${g}</td><td>${f1(s.min / g / 60)}</td><td>${f1(d[0] / g)}</td><td>${pct(fg, 1)}</td><td>${pct(xp, 1)}</td><td data-v="${df.toFixed(2)}" class="${df < 0 ? 'w' : 'lo'}">${df > 0 ? '+' : ''}${df.toFixed(1)}</td><td>${f1((d[2] - d[1]) / g)}</td><td>${f1(d[3] / Math.max(1, d[4]) * 100)}</td><td>${d[5] ? pct(d[6] / d[5], 1) : '—'}</td><td>${f1(s.stl / g)}</td><td>${f1(s.blk / g)}</td></tr>`; };
    const lead = (lab, f, fmt, asc) => { const top = dp.filter(p => rs(p).gp >= 1).sort((a, b) => (asc ? 1 : -1) * (f(a) - f(b))).slice(0, 5); return `<div class="panel"><h3>${lab}</h3>${top.map((p, i) => `<div class="leader" style="grid-template-columns:24px minmax(0,1fr) auto"><span class="muted">${i + 1}</span><span>${plink(p)} <span class="muted">${p.team != null ? L.teams[p.team].abbr : 'FA'}</span></span><span>${fmt(f(p))}</span></div>`).join('') || '<p class="muted">—</p>'}</div>`; };
    const D = p => p.stats[dk], G = p => rs(p).gp;
    const boards = `<div class="grid3" style="margin-bottom:12px">${lead('Shots saved per game', p => (D(p)[2] - D(p)[1]) / G(p), f1)}${lead('Defensive rating', p => D(p)[3] / Math.max(1, D(p)[4]) * 100, f1, true)}${lead('Opponent FG% vs expected', p => (D(p)[1] - D(p)[2]) / D(p)[0] * 100, v => v.toFixed(1), true)}</div>`;
    return `<section class="panel"><div class="filters">${pfTeamAge}<span class="seg"><button class="sm" data-padv="0">Basic</button><button class="sm" data-padv="1">Advanced</button><button class="sm primary" data-pdef="1">Defense</button></span>${showAll ? '' : '<span class="muted">10+ minutes a game or 500 minutes, and half the team\'s games</span>'}</div>${boards}
    <details class="about"><summary>How this works</summary><p>Contests: shots he defended as the primary defender. Opp FG% vs expected: how those shots went in compared with what they should have, given the shooters and shot types (negative is good). Shots saved: expected makes minus actual makes. Defensive rating: opponents' points per 100 possessions while he's on the floor. Rim FG%: opponents' shooting at the rim while he plays. Tracked from v15 on.</p></details>
    <div class="tblwrap"><table class="sortable" data-sid="pdef"><thead><tr><th class="l">Player</th><th class="l">Team</th><th class="l">Pos</th><th>GP</th><th>MPG</th><th>Contests</th><th>Opp FG%</th><th>Expected</th><th>Diff</th><th>Saved</th><th>DRtg</th><th>Rim FG%</th><th>STL</th><th>BLK</th></tr></thead><tbody>${dp.sort((a, b) => ((D(a)[1] - D(a)[2]) / D(a)[0]) - ((D(b)[1] - D(b)[2]) / D(b)[0])).slice(0, 300).map(drow).join('') || '<tr><td class="l muted" colspan="14">No defensive data yet.</td></tr>'}</tbody></table></div></section>`;
  }
  const rows = adv ? ps.slice(0, 300).map(p => { const s = rs(p); return `<tr class="click ${isUser(p.team) ? 'mine' : ''}" data-player="${p.id}"><td class="l">${esc(p.name)}${injPill(p)}${scoutPill(p)}</td><td class="l">${p.retired ? '<span class="muted">Retired</span>' : p.team == null ? faTxt(p) : tlabel(p.team)}</td><td class="l">${posLabel(p)}</td><td><strong>${ovrTxt(p)}</strong></td><td>${s ? s.gp : 0}</td><td>${f1(pg(p, 'min') / 60)}</td><td>${s && s.fga ? nmCell(p, 'fg', pct(tsPct(s), 1)) : '—'}</td><td>${s && s.fga ? nmCell(p, 'fg', pct(efgPct(s), 1)) : '—'}</td><td>${hasUsg(s) ? nmCell(p, 'min', f1(usg(s))) : '—'}</td><td>${s && s.tov ? nmCell(p, 'ast', (s.ast / s.tov).toFixed(2)) : '—'}</td><td>${s && s.fga ? pct(s.tpa / s.fga, 1) : '—'}</td><td>${s && s.fga ? pct(s.fta / s.fga, 1) : '—'}</td><td>${s ? f1(gmscPg(s)) : '—'}</td><td>${s ? f1(effPg(s)) : '—'}</td><td class="${pmPg(s) > 0 && qualOk(p, 'min') ? 'w' : pmPg(s) < 0 && qualOk(p, 'min') ? 'lo' : ''}">${s ? nmCell(p, 'min', sgn(pmPg(s))) : '—'}</td><td>${s ? (s.pm > 0 ? '+' : '') + (s.pm || 0) : '—'}</td>${['obpm', 'dbpm', 'bpm'].map(k => `<td class="${s && s[k] > 0 && qualOk(p, 'min') ? 'w' : s && s[k] < 0 && qualOk(p, 'min') ? 'lo' : ''}">${s && s[k] != null ? nmCell(p, 'min', sgn(s[k])) : '—'}</td>`).join('')}${advCells(p, s)}</tr>`; }).join('') : ps.slice(0, 300).map(p => {
    const s = rs(p);
    return `<tr class="click ${isUser(p.team) ? 'mine' : ''}" data-player="${p.id}"><td class="l">${esc(p.name)}${injPill(p)}${scoutPill(p)}</td><td class="l">${p.retired ? '<span class="muted">Retired</span>' : p.team == null ? faTxt(p) : tlabel(p.team)}</td><td class="l">${posLabel(p)}</td><td>${p.age}</td><td><strong>${ovrTxt(p)}</strong></td><td>${potCell(p)}</td><td>${p.contract ? money(p.contract.amt) : '—'}</td><td>${s ? s.gp : 0}</td><td>${f1(pg(p, 'min') / 60)}</td><td>${f1(pg(p, 'pts'))}</td><td>${f1(pg(p, 'orb'))}</td><td>${f1(pg(p, 'drb'))}</td><td>${f1(pg(p, 'orb') + pg(p, 'drb'))}</td><td>${f1(pg(p, 'ast'))}</td><td>${f1(pg(p, 'stl'))}</td><td>${f1(pg(p, 'blk'))}</td><td>${hasUsg(s) ? nmCell(p, 'min', f1(usg(s))) : '—'}</td><td>${s ? nmCell(p, 'fg', pct(s.fgm, s.fga)) : '—'}</td><td>${s ? nmCell(p, 'tp', pct(s.tpm, s.tpa)) : '—'}</td><td>${s ? nmCell(p, 'ft', pct(s.ftm, s.fta)) : '—'}</td><td class="${s && s.bpm > 0 && qualOk(p, 'min') ? 'w' : s && s.bpm < 0 && qualOk(p, 'min') ? 'lo' : ''}">${s && s.bpm != null ? nmCell(p, 'min', sgn(s.bpm)) : '—'}</td><td>${s && s.per != null ? nmCell(p, 'min', f1(s.per)) : '—'}</td><td>${s && s.ws != null ? f1(s.ws) : '—'}</td></tr>`;
  }).join('');
  return `<section class="panel"><div class="filters"><input type="search" id="pq" placeholder="Search by name" value="${esc(ui.pq)}" aria-label="Search players">
    ${pfTeamAge}
    <select id="pfp" aria-label="Position"><option value="all">All positions</option>${POS.map((x, i) => `<option value="${i}" ${ui.pfPos == i ? 'selected' : ''}>${x}</option>`).join('')}</select><span class="seg"><button class="sm ${adv ? '' : 'primary'}" data-padv="0">Basic</button><button class="sm ${adv ? 'primary' : ''}" data-padv="1">Advanced</button><button class="sm" data-pdef="1">Defense</button></span><select id="pfty" aria-label="Player type"><option value="">All player types</option>${typeOptions(ui.pfType)}</select><label class="muted" style="font-size:13px"><input type="checkbox" id="pall" ${ui.pAll ? 'checked' : ''}> Include players who haven't qualified</label><span class="muted">${ps.length} players${showAll ? '' : ` · qualified: half of their team's ${skey() === 'po' ? 'playoff ' : ''}games`}</span></div>
    <div class="tblwrap"><table><thead><tr>${(adv ? ACOLS : PCOLS).map(([k, n, c]) => `<th class="sort ${c || ''} ${ui.psort === k ? 'sorted' : ''}" data-sort="${k}" ${COL_TIPS[k] ? `title="${COL_TIPS[k]}"` : ''}>${n}${ui.psort === k ? (ui.pdir > 0 ? ' ▲' : ' ▼') : ''}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div><p class="muted" style="font-size:12px;margin:8px 0 0"><strong>NM</strong> = not met. Everyone needs half of his team's games; then FG%, TS% and eFG% need 2 FGA a game or 90 FGA; 3P% 1.5 3PA a game or 75; FT% 1.5 FTA a game or 75; AST/TO 1.5 AST a game or 75; usage, plus-minus and BPM 10 minutes a game or 500. Points, rebounds, assists, steals and blocks have no minimum. Not-met rows sort to the bottom.</p></section>`;
}

// v28.6: League > Players: every player in one table, Info and Stats tabs (stats start at 0 each season)
// v28.7 L2: League > Players: every player, filters, and tabs (Ratings & contract / Personal & physical / Attributes / Stats)
const PD_ATTR = [['spd', 'Spd'], ['agi', 'Agi'], ['vrt', 'Vrt'], ['str', 'Str'], ['fin', 'Fin'], ['pst', 'Post'], ['mid', 'Mid'], ['tp', '3PT'], ['ft', 'FT'], ['hnd', 'Hnd'], ['pas', 'Pas'], ['orb', 'ORB'], ['drw', 'Drw'], ['per', 'PerD'], ['pdf', 'PstD'], ['stl', 'Stl'], ['blk', 'Blk'], ['drb', 'DRB'], ['fdc', 'Fdc'], ['iq', 'IQ'], ['ocn', 'OCn'], ['dcn', 'DCn'], ['poc', 'PoC']];
function vPlayerDir() {
  const tab = ['info', 'bio', 'attr', 'stats'].includes(ui.pdTab) ? ui.pdTab : 'info', cs = capSeason(L);
  let ps = Object.values(L.players).filter(q => !q.retired && !q.prospect);
  const f = ui.pdTeam || 'all'; if (f === 'fa') ps = ps.filter(q => q.team == null && !q.abroad); else if (f === 'ov') ps = ps.filter(q => !!q.abroad); else if (f !== 'all') ps = ps.filter(q => q.team === +f);
  if (ui.pdPos != null && ui.pdPos !== 'all') ps = ps.filter(q => q.pos === +ui.pdPos || q.pos2 === +ui.pdPos);
  if (ui.pdq) { const k = ui.pdq.toLowerCase(); ps = ps.filter(q => q.name.toLowerCase().includes(k)); }
  if (ui.pdAgeLo) ps = ps.filter(q => q.age >= +ui.pdAgeLo); if (ui.pdAgeHi) ps = ps.filter(q => q.age <= +ui.pdAgeHi);
  if (ui.pdMin) ps = ps.filter(q => ovrNum(q) >= +ui.pdMin);
  if (ui.pdNat && ui.pdNat !== 'all') ps = ps.filter(q => q.nat === ui.pdNat);
  const A = (q, ks) => Math.round(ks.reduce((a, k) => a + attrNum(q, k), 0) / ks.length);
  const nm = v => `<td data-v="${v}">${v}</td>`;
  const teamTd = q => `<td class="l" data-v="${q.team == null ? 'ZZ' : L.teams[q.team].abbr}">${q.team == null ? faTxt(q) : tlabel(q.team)}</td>`;
  const tr = q => `<tr class="click ${isUser(q.team) ? 'mine' : ''}" data-player="${q.id}">`;
  ps.sort((a, b) => ovrNum(b) - ovrNum(a));
  let head, rows;
  if (tab === 'info') {
    head = [['Player', 'l'], ['Team', 'l'], ['Age'], ['Pos', 'l'], ['Archetype', 'l'], ['Ovr'], ['Pot'], ['Fit'], ['Mood'], ['Ath'], ['Off'], ['Def'], ['IQ'], ['Contract'], ['Yrs']];   // v37a: Opt (PO / TO) shares the Yrs cell
    rows = ps.slice(0, 600).map(q => { const co = q.team != null ? L.teams[q.team].coach : null, ft = co ? Math.round(fit(q, co)) : null, c = q.contract, yl = c ? yrsLeft(L, q, cs) : 0;
      return `<tr class="click ${isUser(q.team) ? 'mine' : ''}" data-player="${q.id}"><td class="l" data-v="${esc(q.name)}">${esc(q.name)}${injPill(q)}${scoutPill(q)}</td><td class="l" data-v="${q.team == null ? 'ZZ' : L.teams[q.team].abbr}">${q.team == null ? faTxt(q) : tlabel(q.team)}</td>${nm(q.age)}<td class="l" data-v="${q.pos}">${posLabel(q)}</td><td class="l wrapt s" data-v="${esc(archLabel(q))}">${esc(archLabel(q)) || '—'}</td><td data-v="${ovrNum(q)}"><strong>${ovrTxt(q)}</strong></td><td data-v="${q.pot}">${potCell(q)}</td><td data-v="${ft == null ? -1 : ft}">${ft == null ? '—' : ft + '%'}</td><td data-v="${q.morale == null ? -1 : q.morale}">${moodCell(q)}</td>${nm(A(q, ATH))}${nm(A(q, OFF))}${nm(A(q, DEF))}${nm(Math.round(attrNum(q, 'iq')))}<td data-v="${c ? c.amt : 0}">${c ? money(c.amt) : '—'}</td><td data-v="${yl}">${c ? yl || 'exp' : '—'}${c && c.opt ? ` <span class="muted" title="${c.opt === 'PO' ? 'Player' : 'Team'} option on the final year">${c.opt}</span>` : ''}</td></tr>`; });
  } else if (tab === 'bio') {
    head = [['Player', 'l'], ['Team', 'l'], ['Pos', 'l'], ['Age'], ['#'], ['Country', 'l'], ['Ht'], ['Wt'], ['Wingspan'], ['Exp'], ['Draft', 'l'], ['Personality', 'l'], ['Contract'], ['Yrs']];
    rows = ps.slice(0, 600).map(q => { const c = q.contract, yl = c ? yrsLeft(L, q, cs) : 0, d = q.draft;
      const dr = d ? `${draftLabel(d.s)} · R${d.rd}${d.no ? ' #' + d.no : ''}` : 'Undrafted';
      return `${tr(q)}<td class="l" data-v="${esc(q.name)}">${esc(q.name)}${injPill(q)}</td>${teamTd(q)}<td class="l" data-v="${q.pos}">${posLabel(q)}</td>${nm(q.age)}<td data-v="${q.num != null ? q.num : 999}">${q.num != null ? q.num : '—'}</td><td class="l">${esc(NAT_NAME[q.nat] || q.nat || '—')}</td><td data-v="${q.hgt}">${ft(q.hgt)}</td><td data-v="${q.wgt || 0}">${q.wgt ? q.wgt + ' lb' : '—'}</td><td data-v="${q.wing || 0}">${q.wing ? ft(q.wing) : '—'}</td>${nm(q.svc || 0)}<td class="l" data-v="${d ? (d.s * 100 + d.rd * 40 + (d.no || 39)) : 99999}">${dr}</td><td class="l" title="${esc(PERS[q.pers] || '')}">${esc(persShort(q))}</td><td data-v="${c ? c.amt : 0}">${c ? money(c.amt) : '—'}</td>${nm(yl)}</tr>`; });
  } else if (tab === 'attr') {
    head = [['Player', 'l'], ['Team', 'l'], ['Pos', 'l'], ['Age'], ['Ovr'], ...PD_ATTR.map(([k, n]) => [n, '', LABELS[k]])];
    rows = ps.slice(0, 600).map(q => { const av = posAvg(q.pos) || {};
      return `${tr(q)}<td class="l" data-v="${esc(q.name)}">${esc(q.name)}</td>${teamTd(q)}<td class="l" data-v="${q.pos}">${posLabel(q)}</td>${nm(q.age)}<td data-v="${ovrNum(q)}"><strong>${ovrTxt(q)}</strong></td>${PD_ATTR.map(([k]) => { const v = Math.round(attrNum(q, k)), m = av[k]; return `<td data-v="${v}" class="${m != null && v >= m + 10 ? 'w' : m != null && v <= m - 10 ? 'lo' : ''}">${v}</td>`; }).join('')}</tr>`; });
  } else {
    head = [['Player', 'l'], ['Team', 'l'], ['Pos', 'l'], ['GP'], ['MPG'], ['PTS'], ['REB'], ['AST'], ['STL'], ['BLK'], ['TOV'], ['FG%'], ['3P%'], ['FT%']];
    const po = skey() === 'po', S = q => q.stats[po ? 'po' : 'rs'] || {}, per = (q, k) => { const s = S(q); return s.gp ? s[k] / s.gp : 0; }, pc = (m, a) => a ? m / a : 0;
    rows = ps.slice(0, 600).map(q => { const s = S(q), g = s.gp || 0, v = (x, d) => `<td data-v="${x}">${x.toFixed(d)}</td>`;
      return `<tr class="click ${isUser(q.team) ? 'mine' : ''}" data-player="${q.id}"><td class="l" data-v="${esc(q.name)}">${esc(q.name)}${injPill(q)}</td><td class="l" data-v="${q.team == null ? 'ZZ' : L.teams[q.team].abbr}">${q.team == null ? faTxt(q) : tlabel(q.team)}</td><td class="l" data-v="${q.pos}">${posLabel(q)}</td>${nm(g)}${v((s.min || 0) / Math.max(1, g) / 60, 1)}${v(per(q, 'pts'), 1)}${v(g ? ((s.orb || 0) + (s.drb || 0)) / g : 0, 1)}${v(per(q, 'ast'), 1)}${v(per(q, 'stl'), 1)}${v(per(q, 'blk'), 1)}${v(per(q, 'tov'), 1)}${v(pc(s.fgm || 0, s.fga) * 100, 1)}${v(pc(s.tpm || 0, s.tpa) * 100, 1)}${v(pc(s.ftm || 0, s.fta) * 100, 1)}</tr>`; });
  }
  const nats = [...new Set(Object.values(L.players).filter(q => !q.retired && !q.prospect).map(q => q.nat).filter(Boolean))].sort((a, b) => (NAT_NAME[a] || a).localeCompare(NAT_NAME[b] || b));
  const tabs = [['info', 'Ratings & contract'], ['bio', 'Personal & physical'], ['attr', 'Attributes'], ['stats', 'Stats']].map(([k, n]) => `<button class="sm ${tab === k ? 'primary' : ''}" data-pdtab="${k}">${n}</button>`).join('');
  const notes = { info: 'Ath / Off / Def = average of that attribute group, IQ = basketball IQ. Fit = fit with the current head coach.', bio: 'Exp = seasons in the league. Draft = draft year, round and pick.', attr: 'Green / red = 10+ above / below the average starter-level player at his position. Hover a column for its name.', stats: 'Stats are this season only and start at zero.' }[tab];
  return `<h2>Players · ${seasonName(L.season)}</h2><div class="subtabs" style="margin-bottom:12px">${tabs}</div><section class="panel"><div class="filters"><input type="search" id="pdq" placeholder="Search by name" value="${esc(ui.pdq || '')}" aria-label="Search players"><select id="pdt" aria-label="Team"><option value="all">All teams</option>${L.teams.map(t => `<option value="${t.id}" ${f == t.id ? 'selected' : ''}>${esc(tname(t.id))}</option>`).join('')}<option value="fa" ${f === 'fa' ? 'selected' : ''}>Free agents</option><option value="ov" ${f === 'ov' ? 'selected' : ''}>Overseas</option></select><select id="pdp" aria-label="Position"><option value="all">All positions</option>${POS.map((x, i) => `<option value="${i}" ${ui.pdPos == i ? 'selected' : ''}>${x}</option>`).join('')}</select><select id="pdn" aria-label="Country"><option value="all">All countries</option>${nats.map(n => `<option value="${n}" ${ui.pdNat === n ? 'selected' : ''}>${esc(NAT_NAME[n] || n)}</option>`).join('')}</select><label>Age <input type="number" id="pda1" min="18" max="45" value="${esc(ui.pdAgeLo || '')}" placeholder="min" style="width:58px"> – <input type="number" id="pda2" min="18" max="45" value="${esc(ui.pdAgeHi || '')}" placeholder="max" style="width:58px"></label><label>Min Ovr <input type="number" id="pdm" min="0" max="99" value="${esc(ui.pdMin || '')}" style="width:58px"></label>${ui.pdq || f !== 'all' || (ui.pdPos != null && ui.pdPos !== 'all') || ui.pdAgeLo || ui.pdAgeHi || ui.pdMin || (ui.pdNat && ui.pdNat !== 'all') ? '<button class="sm" data-pdclear="1">Clear filters</button>' : ''}${tab === 'stats' ? `<span class="seg"><button class="sm ${skey() === 'po' ? '' : 'primary'}" data-skey="rs">Regular season</button><button class="sm ${skey() === 'po' ? 'primary' : ''}" data-skey="po">Playoffs</button></span>` : ''}</div>
  <div class="tblwrap"><table class="sortable" data-sid="pdir-${tab}"><thead><tr>${head.map(([n, c, t]) => `<th class="${c || ''}"${t ? ` title="${esc(t)}"` : ''}>${n}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div><p class="muted" style="font-size:12px;margin:8px 0 0">${ps.length} players${ps.length > 600 ? ' (top 600 by overall shown; use the filters)' : ''}. ${notes} Click a column to sort.</p></section>`;
}

// Position averages for color-coding attributes (computed from rostered players at each primary position)
let POS_AVG = null, POS_AVG_KEY = '';
function posAvg(pos) {
  const key = L.season + '-' + L.phase + '-' + L.day;
  if (POS_AVG_KEY !== key) {
    POS_AVG = [0, 1, 2, 3, 4].map(i => { const ps = Object.values(L.players).filter(p => p.team != null && p.pos === i); const o = {}; for (const k of [...ATH, ...OFF, ...DEF, ...INT]) o[k] = ps.reduce((a, p) => a + p[k], 0) / Math.max(1, ps.length); return o; });
    POS_AVG_KEY = key;
  }
  return POS_AVG[pos];
}
// v25.9 (S1-S3): trait tabs, scouting report box, comps and strengths/weaknesses
const TR_TIPS = { loy: 'Loyalty: how much he wants to stay with his team and re-sign.', mon: 'Money: how much he follows the biggest offer.', win: 'Winning: how much he wants a contender.', wrk: 'Work ethic: faster progression, and slower decline.', mot: 'Motor: effort on the floor, mostly defense.', cch: 'Coachability: progression and how well he fits his coach.', dur: 'Durability: how often and how badly he gets hurt.' };
function trView(p) {
  const v = traitsView(L, L.user, p);
  if (commish()) for (const r of v.off.concat(v.on)) { r.lv = 2; r.v = trv(p, r.k); r.txt = trWord(r.v); }
  return v;
}
function trRowHtml(r, p) {
  const tip = esc(TR_TIPS[r.k] || '');
  let val;
  if (r.lv >= 2 && r.v != null) val = `<span class="trbar" title="${tip}"><i style="width:${clamp(r.v, 0, 100)}%"></i></span><span class="an">${r.v}</span>`;
  else if (r.lv === 1 && r.v != null) val = `<span class="muted" title="${tip} A rough read, not exact.">~${r.v} ${esc(String(r.txt || '').toLowerCase())}</span>`;
  else val = `<span class="muted" title="${tip}">Unknown</span>`;
  if (p.prospect && r.k === 'wrk' && r.lv === 0 && myInterview(p)) val = `<span class="muted" title="Your interview's read; it can be wrong.">${esc(workLabel(myInterview(p).work))} (interview)</span>`;
  return `<div class="arow2 trrow"><span>${esc(r.n)}</span><span class="trval">${val}</span></div>`;
}
function trChangesHtml(p) {
  const v = traitsView(L, L.user, p);
  if (!v.log.length || (p.prospect && !commish())) return '<p class="muted" style="margin:8px 0 0">No trait changes yet.</p>';
  return `<h3 style="font-size:14px;margin-top:10px">Changes</h3>${v.log.map(x => `<div class="arow2" style="grid-template-columns:minmax(0,1fr) auto"><span>${esc(TR_NAMES[x.k] || x.k)} <span class="${x.d > 0 ? 'w' : 'lo'}">${x.d > 0 ? '+' : '−'}${Math.abs(x.d)}</span> <span class="muted">${esc(TR_WHY[x.why] || x.why)}</span></span><span class="muted">${seasonName(x.s)}</span></div>`).join('')}`;
}
function onTraitsCol(p) {
  const v = trView(p);
  let extra = '';
  if (!p.prospect) { const h = injHistory(L, p); extra = `<div class="arow2 stk"><span>Injuries</span><span title="Injuries of 25+ games (major), 15-24 games (mid), and all games missed to injury in the last 3 seasons. AI teams price this in.">${h.majors} major · ${h.mids} mid · ${h.missed} missed</span></div>${p.injury > 0 && p.injSE ? `<div class="arow2 stk"><span>Out</span><span class="lo">${injGames(p)} more games (${esc((p.injName || '').toLowerCase())})</span></div>` : ''}`; }
  const co = p.team != null && L.teams[p.team] ? L.teams[p.team].coach : null;
  if (co && !p.prospect) { const f = fit(p, co), ft = fitTag(p, co); extra += `<div class="arow2 stk" title="How well his skills match the head coach's offense and defense (${esc(co.name)})"><span>Coach fit</span><span><strong>${Math.round(f)}%</strong>${ft ? ` <span class="pill ${ft === 'fits' ? 'pos' : 'dev-nofit'}">${ft === 'fits' ? 'Fits' : 'Clashes'}</span>` : ''}</span></div>`; }
  return `<div><h3 style="font-size:14px">Traits</h3>${v.on.map(r => trRowHtml(r, p)).join('')}${extra}</div>`;
}
function trOffTab(p) {
  const v = trView(p), lab = p.pers || 'Balanced';
  const top = v.off.filter(r => r.v != null && r.k !== 'wrk').sort((a, b) => b.v - a.v)[0];
  const chip = hideIntangibles(p) ? (myInterview(p) ? `<span class="pill pos" title="Your interview's read; it can be wrong. ${esc(PERS[myInterview(p).pers] || '')}">${esc(persShort({ pers: myInterview(p).pers }))} (interview)</span>` : '<span class="muted">Personality unknown until you interview him</span>') : `<span class="pill pos" title="${esc(PERS[lab] || '')}">${esc(persShort({ pers: lab }))}</span>${top && top.lv >= 1 ? ` <span class="muted">Top pull: ${esc(top.n.toLowerCase())} ${top.lv >= 2 ? top.v : '~' + top.v}</span>` : ''}`;
  return `<div style="margin-bottom:8px">${chip}</div><div class="attrs">${v.off.map(r => trRowHtml(r, p)).join('')}</div>${trChangesHtml(p)}`;
}
function tierPill(r) { return `<span class="pill pos" title="Where he ranks among current players">${esc(r.tierN)}</span>`; }
function scoutBox(p) {
  if (p.retired) return '';
  if (p.prospect) return commish() ? `<section class="panel" style="margin-bottom:16px"><h3>Scouting report</h3>${compsHtml(p)}</section>` : '';
  const r = playerReport(L, p, L.user); if (!r || !r.slots.length) return '';
  const ps = r.playstyle, tags = ps ? ps.tags : [];
  return `<section class="panel" style="margin-bottom:16px"><div class="row" style="justify-content:space-between;margin-bottom:6px"><h3 style="margin:0">Scouting report</h3><span>${tierPill(r)}${tags.map(t => ` <span class="pill">${esc(t)}</span>`).join('')}</span></div>${r.slots.map(x => `<p class="srline" style="margin:4px 0">${esc(x.text)}</p>`).join('')}</section>`;
}
const SW_LBL = { shoot: ['Strong shooter', 'Weak shooter'], finish: ['Finishes well at the rim', 'Struggles to finish'], create: ['Strong ball handler', 'Loose handle for his position'], pass: ['Good passer', 'Weak passer'], post: ['Strong post game', 'Limited post game'], reb: ['Strong rebounder', 'Weak rebounder'], perD: ['Strong perimeter defender', 'Weak perimeter defender for his position'], rimD: ['Strong rim protector', 'Weak interior defender for his position'], ath: ['Explosive athlete', 'Below-average athlete'], iq: ['High basketball IQ', 'Low basketball IQ'] };
function strWeak(p) {
  const q = Object.assign({}, p); for (const g in PS_GRP) for (const k of PS_GRP[g]) q[k] = p.prospect ? attrRead(L, L.user, p, k) : p[k];
  const z = psZ(L, q), e = Object.keys(z).filter(g => SW_LBL[g]).sort((a, b) => z[b] - z[a]);
  return { str: e.filter(g => z[g] >= 0.8).slice(0, 3).map(g => SW_LBL[g][0]), weak: e.slice().reverse().filter(g => z[g] <= -0.8).slice(0, 3).map(g => SW_LBL[g][1]) };
}
function compsHtml(p) {
  let c; try { c = compsFor(L, L.user, p); } catch (e) { return ''; }
  if (!c) return '';
  const row = (lbl, x) => `<div class="leader" style="grid-template-columns:56px minmax(0,1fr)"><span class="k2">${lbl}</span><span>${x.ovr} · ${esc(x.tierN)} · ${x.league ? plink(L.players[x.league.pid]) + (x.league.retired ? ' <span class="muted">(retired)</span>' : '') : '—'} · <span title="An NBA player of this type and tier">NBA: ${x.nba ? esc(x.nba.name) : '—'}</span></span></div>`;
  const sw = strWeak(p);
  return `<div class="comps" style="margin-top:6px"><div class="k">Comps</div>${row('Floor', c.floor)}${row('Ceiling', c.ceil)}<div class="muted" style="margin-top:4px">Strengths: ${sw.str.length ? esc(sw.str.join(', ')) : '—'} · Weaknesses: ${sw.weak.length ? esc(sw.weak.join(', ')) : '—'}</div></div>`;
}
// v26.0 (S1-S5): five-season line, roster needs, tag chips, coach report
// v26.6: Development role (rebuilding / Rising teams, 23 and under) and "Doesn't fit system" (trade-status reason)
function devPills(p) {
  let o = '';
  try {
    const t = p.team != null ? L.teams[p.team] : null, d = t && !p.retired ? devRole(L, t, p) : null;
    if (d && (d.pot > 0 || d.adapt > 0)) o += ` <span class="pill dev-role" title="${esc(`Development role: potential +${d.pot}, role adapted +${d.adapt}${d.focus && FOCUS[d.focus] ? ', training: ' + FOCUS[d.focus].n : ''}`)}">Dev role</span>`;
    const ts = t ? tradeStatus(L, p) : null;
    if (ts && /fit the coach/i.test(ts.why || '')) o += ` <span class="pill dev-nofit" title="${esc("Doesn't fit the system: " + ts.why)}">No fit</span>`;
  } catch (e) { }
  return o;
}
// v27 L4: franchise icon / face of the franchise badge (tier from iconTier, L2)
const ICON_SHORT = { 'Franchise icon': 'Icon', 'Franchise cornerstone': 'Cornerstone', 'Face of the franchise': 'Face' };   // v37a: full wording stays in the tooltip
function iconPill(p) {
  let it = 0; try { it = p.team != null && !p.retired && !p.prospect ? iconTier(L, p, p.team) : 0; } catch (e) { }
  if (!it) return '';
  const tn = p.team != null ? tname(p.team) : '';
  return ` <span class="pill icon-t${it}" title="${esc(it === 2 ? `${p.name} is the franchise icon of the ${tn}: the club won't shop him, and a trade costs fan trust.` : `${p.name} is the ${(iconLabel(L, p, p.team) || 'face of the franchise').toLowerCase()} of the ${tn}: the club keeps him unless it rebuilds.`)}">${ICON_SHORT[iconLabel(L, p, p.team)] || iconLabel(L, p, p.team) || 'Face'}</span>`;
}
// v27 H2: header line "18× champions · last 2023-24 · 22 Finals trips" (real NBA history + this league)
function titleRibbon(t) {
  let rt = [], rf = []; try { rt = nbaRealTitles(L, t); rf = nbaRealFinals(L, t); } catch (e) { }
  const simT = L.history.filter(h => h.champion === t.id), simF = L.history.filter(h => h.champion === t.id || h.runnerUp === t.id);
  const n = rt.length + simT.length, f = rf.length + simF.length;
  if (!n && !f) return `<div class="muted titlerib" style="margin-top:4px">No titles or Finals trips yet</div>`;
  const last = simT.length ? seasonName(simT[simT.length - 1].s) : rt.length ? nbaSeasonLbl(rt[rt.length - 1].y) : '';
  return `<div class="muted titlerib" style="margin-top:4px">${n ? `<strong>${n}\u00d7 champion${n > 1 ? 's' : ''}</strong>${last ? ' \u00b7 last ' + last : ''}` : 'No titles'}${f ? ` \u00b7 ${f} Finals trip${f > 1 ? 's' : ''}` : ''}</div>`;
}
function iconLine(t) {
  let l = []; try { l = rosterOf(L, t).map(p => [p, iconTier(L, p, t.id)]).filter(x => x[1] > 0).sort((x, y) => y[1] - x[1]).slice(0, 2); } catch (e) { }
  return l.length ? `<div class="muted" style="margin-top:4px">${l.map(([p, it]) => `${iconLabel(L, p, t.id) || 'Face of the franchise'}: <a class="lk" data-player="${p.id}">${esc(p.name)}</a>`).join(' · ')}</div>` : '';
}
// v37a: chips are one short word; the full wording is in the tooltip
const TAG_SHORT = { corner: 'Cornerstone', untouch: 'Untouchable', bargain: 'Bargain', overpaid: 'Overpaid', fits: 'Fits coach', clash: 'Clashes' };
function tagChips(p, skip) {
  let t; try { t = playerTags(L, p); } catch (e) { return ''; }
  const ip = iconPill(p), sk = ip ? [...(skip || []), 'corner'] : (skip || []);   // v37a: the icon badge already says cornerstone (no duplicate chip)
  return ip + t.filter(x => !sk.includes(x.k)).map(x => ` <span class="pill tg-${x.k}" title="${esc(x.n + (x.why ? ': ' + x.why : ''))}">${esc(TAG_SHORT[x.k] || x.n)}</span>`).join('') + devPills(p);
}
function recentStrip(t) { const r = recentLine(L, t); return `<p class="muted recent5" style="margin:-4px 0 12px">${esc(r.text)}</p>`; }
const RN_CAT = { style: 'Team style', youth: 'Young talent', other: 'Other' };
function needsPanel(t) {
  const ns = rosterNeeds(L, t);
  return `<section class="panel" style="margin-bottom:16px"><h3>Roster needs</h3>${ns.length ? ns.map(n => `<div class="need"><span class="pill urg-${n.urg}" title="${esc(RN_CAT[n.cat] || '')}">${esc(RN_URG[n.urg])}</span><span>${esc(n.text)}</span><span class="muted need-cat">${esc(RN_CAT[n.cat] || '')}</span></div>`).join('') : '<p class="muted" style="margin:0">No pressing needs.</p>'}<details class="about"><summary>How this works</summary><p>The front office compares your rotation's skills with the other teams, your results once 10 games are in, how young talent is coming along, thin positions, expiring or unhappy stars, the coach fit and the payroll. Contenders feel a need now; rebuilders can wait until the summer.</p></details></section>`;
}
// v27.4 K3: coach philosophy sliders (read-only for AI coaches, editable for your own coach)
const SL_SHORT = { three: 'Threes', rim: 'Rim', glass: 'Glass', pace: 'Pace', ball: 'Ball', gamble: 'Gamble', help: 'Paint', depth: 'Depth' };
const SL_WORD = { three: ['Few', 'Volume'], rim: ['Few', 'Attack'], glass: ['Get back', 'Crash'], pace: ['Walk', 'Push'], ball: ['Iso', 'Motion'], gamble: ['Stay home', 'Gamble'], help: ['Chase', 'Pack'], depth: ['Tight', 'Deep'] };
function slChips(c) {
  let s; try { s = slOf(c); } catch (e) { return ''; }
  const top = SL_KEYS.map(k => [k, s[k]]).filter(x => Math.abs(x[1] - 50) >= 10).sort((x, y) => Math.abs(y[1] - 50) - Math.abs(x[1] - 50)).slice(0, 3);
  return top.length ? `<div class="sl-chips">${top.map(([k, v]) => `<span class="pill sl-chip" title="${esc(SL_NAME[k] + ': ' + (v >= 50 ? SL_HI[k] : SL_LO[k]))}">${SL_SHORT[k]}: ${SL_WORD[k][v >= 50 ? 1 : 0]}</span>`).join('')}</div>` : '';
}
function philPanel(c, team) {
  if (!c) return '';
  let s, d; try { s = slOf(c); d = slDefault(c); } catch (e) { return ''; }
  const mine = !!(team && isUser(team.id) && team.coach === c), txt = k => (typeof NBA_TEXT !== 'undefined' && NBA_TEXT.sl && NBA_TEXT.sl[k]) || `${SL_LO[k]} ↔ ${SL_HI[k]}`;
  // v30 P: one short line per setting; the explanation lives in the row tooltip
  const row = k => `<div class="sl-row" title="${esc(txt(k) + ' (' + SL_LO[k] + ' ↔ ' + SL_HI[k] + ') System default: ' + d[k] + '.')}"><strong class="sl-nm"><span class="sl-l">${esc(SL_NAME[k])}</span><span class="sl-s">${esc(SL_SHORT[k])}</span></strong><span class="muted sl-lo"><span class="sl-l">${esc(SL_LO[k])}</span><span class="sl-s">${esc(SL_WORD[k][0])}</span></span><div class="sl-rng"><input type="range" min="0" max="100" step="5" value="${s[k]}" data-sl="${k}" ${mine ? '' : 'disabled'} aria-label="${esc(SL_NAME[k])}"><span class="sl-tick" style="left:${d[k]}%" title="System default: ${d[k]}"></span></div><span class="muted sl-hi"><span class="sl-l">${esc(SL_HI[k])}</span><span class="sl-s">${esc(SL_WORD[k][1])}</span></span><span class="sl-val" id="slv-${k}">${s[k]}</span></div>`;
  return `<section class="panel" id="phil" style="margin-bottom:16px"><h3 class="sl-h">Philosophy${mine ? ' <button class="sm" id="sl-reset">Reset to system default</button>' : ''}</h3><p class="muted sl-how">Each slider runs 0-100 between two styles (50 = neutral). The number is his setting. The small line is his system default; far from it means he is playing against his system.</p>${SL_KEYS.map(row).join('')}</section>`;
}
function coachPanel(c, team) {
  const t = team || (L.user != null ? L.teams[L.user] : null), r = coachReport(L, c, t);
  if (!r) return '';
  const pl = id => L.players[id] ? plink(L.players[id]) : '—';
  const own = team && isUser(team.id);
  const who = !t ? '' : team ? (own ? 'your roster' : 'his roster') : 'your roster';
  const wants = r.wants.map(w => `<span class="pill ${w.has ? 'pos' : ''}" title="${t ? (w.has ? 'The rotation has one' : 'The rotation lacks one') : ''}">${w.has ? '✓ ' : ''}${esc(w.pos)} ${esc(w.n)}</span>`).join(' ');
  if (!t) return `<section class="panel" style="margin-bottom:16px"><h3>Coach report</h3><div class="kv"><span class="k2">Systems</span><span>${esc(r.style.offN)} offense · ${esc(r.style.defN)} defense${r.style.lean ? ' · favors ' + r.style.lean : ''}</span><span class="k2">Wants</span><span>${wants}</span></div></section>`;
  const f = r.fit;
  const fitCls = f.pct >= 75 ? 'w' : f.pct < 40 ? 'lo' : '';
  return `<section class="panel" style="margin-bottom:16px"><h3>Coach report${team ? '' : ' · fit with your roster'}</h3><p style="margin:0 0 8px">${esc(r.line)}</p>
  <div class="kv"><span class="k2">Systems</span><span>${esc(r.style.offN)} offense · ${esc(r.style.defN)} defense${r.style.lean ? ' · favors ' + r.style.lean : ''}</span>
  <span class="k2">Roster fit</span><span><strong class="${fitCls}">${f.pct}%</strong> <span class="muted">ranks #${f.rank} of ${f.of} system pairs for ${who}${f.rank > 3 ? ` · best fit: ${esc(f.best.offN)} / ${esc(f.best.defN)}` : ''}</span></span>
  ${r.star ? `<span class="k2">Star player</span><span>${pl(r.star.pid)} <span class="muted">fit ${r.star.fit}</span>${r.star.tag ? ` <span class="pill tg-${r.star.tag}">${esc(TAGS[r.star.tag])}</span>` : ''}</span>` : ''}
  <span class="k2">Key players</span><span>${r.key.length ? r.key.map(k => `<div>${pl(k.pid)} <span class="muted">fit ${k.fit}${k.rel ? ` (${k.rel > 0 ? '+' : ''}${k.rel} vs his usual)` : ''}${k.why.length ? ' · ' + esc(k.why.join(', ')) : ''}</span></div>`).join('') : '<span class="muted">None stands out</span>'}</span>
  <span class="k2">Clash with him</span><span>${r.clash.length ? r.clash.map(pl).join(', ') : '<span class="muted">Nobody in the rotation</span>'}</span>
  <span class="k2">Wants</span><span>${wants} <span class="muted">✓ = ${own ? 'you have one' : 'on the roster'}</span></span></div></section>`;
}
// v24.3: work ethic and injury-proneness are hidden tiers, revealed by seasons in the league (3-4); the commissioner sees the truth
function traitRow(k, p) {
  const tk = k === 'wrk' ? 'wet' : 'ipt', lv = commish() ? 2 : traitLevel(p, tk), txt = k === 'wrk' ? wetText(p, lv) : iptText(p, lv);
  const when = tk === 'wet' ? '4-6' : '5-7';   // v24.4: work ethic is known after 4-6 seasons, injury-proneness after 5-7
  const tip = lv >= 2 ? `Known (revealed after ${when} seasons in the league; stays known).` : lv === 1 ? `A rough read after a season in the league. The exact tier is known after ${when} seasons.` : 'Unknown until he has played in the league.';
  let extra = '';
  if (tk === 'ipt' && !p.prospect) {   // v24.4: what anyone can see of his injury history, and what a physical would show
    const h = injHistory(L, p);
    extra = `<div class="arow2 stk"><span>Injuries</span><span title="Injuries of 25+ games (major), 15-24 games (mid), and all games missed to injury in the last 3 seasons. AI teams price this in.">${h.majors} major · ${h.mids} mid · ${h.missed} missed</span></div>${p.injury > 0 && p.injSE ? `<div class="arow2 stk"><span>Out</span><span class="lo">${injGames(p)} more games (${esc((p.injName || '').toLowerCase())})</span></div>` : ''}`;
  }
  return `<div class="arow2"><span>${k === 'wrk' ? 'Work ethic' : 'Injury-proneness'}</span><span class="${lv >= 2 ? '' : 'muted'}" title="${esc(tip)}">${esc(txt)}${lv === 1 ? ' ?' : ''}</span></div>${extra}`;
}
function attrRow(k, v, p, tend) {
  v = Math.round(v);   // v28.6: athletic values can be fractional after aging
  if (tend) return `<div class="arow2"><span>${LABELS[k]}</span><span class="an">${v}</span></div>`;
  const avg = posAvg(p.pos)[k], d = v - avg;
  const cls = d > 10 ? 'ag' : d > 5 ? 'ay' : d < -10 ? 'ar' : d < -5 ? 'ao' : '';
  return `<div class="arow2"><span>${LABELS[k]}</span><span class="an ${cls}" title="${POS[p.pos]} average ${Math.round(avg)}">${v}</span></div>`;
}
// League leaders for a regular season: which player led each per-game, total and advanced category
const LEAD_LBL = { pts: 'PPG', orb: 'ORB/G', drb: 'DRB/G', reb: 'RPG', ast: 'APG', stl: 'SPG', blk: 'BPG', tpm: '3PM/G', min: 'MPG', fg: 'FG%', tp: '3P%', ft: 'FT%', usg: 'USG%', ts: 'TS%', efg: 'eFG%', gmsc: 'Game score', eff: 'EFF', pmg: '+/- per game', obpm: 'OBPM', dbpm: 'DBPM', bpm: 'BPM', per: 'PER', ws48: 'WS/48', 't:ws': 'win shares', 't:vorp': 'VORP',
  't:pts': 'total points', 't:orb': 'total off. rebounds', 't:drb': 'total def. rebounds', 't:reb': 'total rebounds', 't:ast': 'total assists', 't:stl': 'total steals', 't:blk': 'total blocks', 't:tpm': 'total threes', 't:min': 'total minutes' };
function leadMap(season) {
  ui.leadCache = ui.leadCache || {};
  const live = season === L.season && !L.history.some(h => h.s === season);
  const ck = season + (live ? ':' + L.phase + L.day : '');
  if (ui.leadCache[season] && ui.leadCache[season].ck === ck) return ui.leadCache[season].m;
  let rows = [];
  if (live) { computeAdv(L, 'rs'); rows = Object.values(L.players).filter(p => p.stats.rs && p.stats.rs.gp).map(p => ({ pid: p.id, s: p.stats.rs })); }
  else for (const p of Object.values(L.players)) for (const h of p.hist) if (h.s === season && h.rs && h.rs.gp) rows.push({ pid: p.id, s: h.rs });
  const hs = L.history.find(h => h.s === season);
  const maxGp = live ? Math.max(1, ...L.teams.map(t => t.w + t.l)) : hs ? Math.max(...hs.standings.map(x => x.w + x.l)) : Math.max(1, ...rows.map(r => r.s.gp));
  const q = live ? rows.filter(r => isQual(L.players[r.pid], 'rs')) : rows.filter(r => r.s.gp >= Math.max(1, Math.floor(maxGp * 0.5)));
  const qmin = q.filter(r => qualS(r.s, 'min'));
  const m = {};
  const top = (key, list, f) => { let best = null, bv = -Infinity; for (const r of list) { const v = f(r.s); if (v != null && isFinite(v) && v > bv) { bv = v; best = r.pid; } } if (best != null) m[key] = best; };
  const pg = k => s => k === 'reb' ? (s.orb + s.drb) / s.gp : s[k] / s.gp;
  for (const k of ['pts', 'orb', 'drb', 'reb', 'ast', 'stl', 'blk', 'tpm', 'min']) { top(k, q, pg(k)); top('t:' + k, rows, s => k === 'reb' ? s.orb + s.drb : s[k]); }
  top('fg', q.filter(r => qualS(r.s, 'fg')), s => s.fgm / s.fga); top('tp', q.filter(r => qualS(r.s, 'tp')), s => s.tpm / s.tpa); top('ft', q.filter(r => qualS(r.s, 'ft')), s => s.ftm / s.fta);
  top('usg', qmin, s => hasUsg(s) ? usg(s) : null); top('ts', q.filter(r => qualS(r.s, 'fg')), tsPct); top('efg', q.filter(r => qualS(r.s, 'fg')), efgPct);
  top('gmsc', q, gmscPg); top('eff', q, effPg); top('pmg', q, pmPg);
  for (const k of ['obpm', 'dbpm', 'bpm', 'per', 'ws48']) top(k, qmin, s => s[k]);
  top('t:ws', rows, s => s.ws); top('t:vorp', rows, s => s.vorp);   // v33c
  ui.leadCache[season] = { ck, m };
  return m;
}
function leadsFor(pid, season) { const m = leadMap(season); return Object.keys(m).filter(k => m[k] === pid); }
function statRow(label, s, tot, lead) {
  if (!s || !s.gp) return '';
  lead = lead || [];
  const g = k => tot ? s[k] : s[k] / s.gp, fmt = x => tot ? Math.round(x) : f1(x);
  const c = (k, v) => { const on = lead.includes(tot ? 't:' + k : k); return `<td class="${on ? 'lead' : ''}"${on ? ' title="Led the league"' : ''}>${v}</td>`; };
  return `<tr>${label}<td>${s.gp}</td><td>${s.gs}</td>${c('min', fmt(g('min') / 60))}${c('pts', fmt(g('pts')))}${c('orb', fmt(g('orb')))}${c('drb', fmt(g('drb')))}${c('reb', fmt(g('orb') + g('drb')))}${c('ast', fmt(g('ast')))}${c('stl', fmt(g('stl')))}${c('blk', fmt(g('blk')))}<td>${fmt(g('tov'))}</td>${c('tpm', fmt(g('tpm')))}${c('fg', pct(s.fgm, s.fga))}${c('tp', pct(s.tpm, s.tpa))}${c('ft', pct(s.ftm, s.fta))}${c('usg', hasUsg(s) ? f1(usg(s)) : '—')}${c('bpm', s.bpm != null ? sgn(s.bpm) : '—')}</tr>`;
}
const STAT_HEAD = '<th>GP</th><th>GS</th><th>Min</th><th>Pts</th><th title="Offensive rebounds">ORB</th><th title="Defensive rebounds">DRB</th><th>Reb</th><th>Ast</th><th>Stl</th><th>Blk</th><th>TO</th><th>3PM</th><th>FG%</th><th>3P%</th><th>FT%</th><th>USG%</th><th title="Box plus-minus per 100 possessions (a rate, so the same on per-game and totals)">BPM</th>';
function sumStats(list) { const o = {}; for (const s of list) if (s) for (const k in s) if (typeof s[k] === 'number') o[k] = (o[k] || 0) + s[k]; if (!o.gp) return null;
  // box plus-minus doesn't add up: career value is the minutes-weighted average
  for (const k of ['obpm', 'dbpm', 'bpm', 'per', 'usg']) { let a = 0, w = 0; for (const s of list) if (s && s[k] != null) { a += s[k] * s.min; w += s.min; } o[k] = w ? Math.round(a / w * 10) / 10 : null; }
  // v33c: win shares / VORP add up (seasons without them are left out); WS/48 from the seasons that have WS
  { let wm = 0, n = 0; for (const s of list) if (s && s.ws != null) { wm += s.min; n++; } for (const k of ['ows', 'dws', 'ws', 'vorp']) o[k] = n ? Math.round(list.reduce((a, s) => a + (s && s.ws != null && s[k] != null ? s[k] : 0), 0) * 10) / 10 : null; o.ws48 = n && wm ? Math.round(o.ws * 48 / (wm / 60) * 1000) / 1000 : null; }
  return o; }
function teamsTxt(h) { return h.teams && h.teams.length ? h.teams.map(id => L.teams[id].abbr).join('/') : '—'; }
// v33d: PER / WS on a season played before v33c are estimated when an older save is loaded (advBackfill: opponents' line from points allowed)
const ADV_EST_TIP = 'Estimated: this season was played before the game kept PER and win shares, so they were worked out later from the box scores and points allowed';
const advEstTag = s => s && s.advEst ? ` <span class="muted" title="${esc(ADV_EST_TIP)}">est.</span>` : '';
function advTable(p, key, past) {
  past = past || [];
  const ks = ['ts', 'efg', 'usg', 'astto', 'tpar', 'ftr', 'gmsc', 'eff', 'pmg', 'pmt', 'obpm', 'dbpm', 'bpm', 'per', 'ows', 'dws', 'ws', 'ws48', 'vorp'];
  const row = (label, s, lead) => { if (!s || !s.gp) return ''; lead = lead || []; const c = (k, v, cls) => `<td class="${lead.includes(k) ? 'lead' : cls || ''}"${lead.includes(k) ? ' title="Led the league"' : ''}>${v}</td>`;
    return `<tr>${label}<td>${s.gp}</td>${c('ts', pct(tsPct(s), 1))}${c('efg', pct(efgPct(s), 1))}${c('usg', hasUsg(s) ? f1(usg(s)) : '—')}<td>${s.tov ? (s.ast / s.tov).toFixed(2) : '—'}</td><td>${s.fga ? pct(s.tpa / s.fga, 1) : '—'}</td><td>${s.fga ? pct(s.fta / s.fga, 1) : '—'}</td>${c('gmsc', f1(gmscPg(s)))}${c('eff', f1(effPg(s)))}${s.noPm ? '<td>—</td><td>—</td>' : c('pmg', sgn(pmPg(s)), pmPg(s) > 0 ? 'w' : pmPg(s) < 0 ? 'lo' : '') + `<td>${(s.pm || 0) > 0 ? '+' : ''}${s.pm || 0}</td>`}${['obpm', 'dbpm', 'bpm'].map(k => c(k, s[k] != null ? sgn(s[k]) : '—', s[k] > 0 ? 'w' : s[k] < 0 ? 'lo' : '')).join('')}${c('per', s.per != null ? f1(s.per) : '—')}<td>${s.ows != null ? f1(s.ows) : '—'}</td><td>${s.dws != null ? f1(s.dws) : '—'}</td>${c('t:ws', s.ws != null ? f1(s.ws) : '—')}${c('ws48', ws48Txt(s.ws48))}${c('t:vorp', s.vorp != null ? f1(s.vorp) : '—')}</tr>`; };
  const rowsH = p.hist.filter(h => h[key] && h[key].gp).map(h => row(`<td class="l" data-v="${yr(h.s)}">${seasonName(h.s)}</td><td class="l">${teamsTxt(h)}${advEstTag(h[key])}</td>`, h[key], key === 'rs' ? leadsFor(p.id, h.s) : null)).join('');
  const cur = row(`<td class="l" data-v="${yr(L.season)}">${seasonName(L.season)}*</td><td class="l">${p.team != null ? L.teams[p.team].abbr : '—'}</td>`, p.stats[key], key === 'rs' && p.stats.rs ? leadsFor(p.id, L.season) : null);
  const rowsP = past.map(r => row(`<td class="l" data-v="${pastYr(r)}">${r.season}</td><td class="l">${r.team || '—'}${estTag(r)}</td>`, Object.assign(realStat(r), { noPm: 1 }))).join('');
  const all = sumStats([...past.filter(r => !r.est).map(realStat), ...p.hist.map(h => h[key]), p.stats[key]]);
  if (!rowsP && !rowsH && !cur) return '<p class="muted">No games yet.</p>';
  return `<div class="tblwrap"><table class="sortable" data-sid="p-${key}-adv"><thead><tr><th class="l">Season</th><th class="l">Team</th><th>GP</th>${ks.map(k => `<th title="${COL_TIPS[k]}">${ACOLS.find(c => c[0] === k)[1]}</th>`).join('')}</tr></thead><tbody>${rowsP}${rowsH}${cur}${all ? row('<td class="l"><strong>Career</strong></td><td></td>', all).replace('<tr>', '<tr class="nosort">') : ''}</tbody></table></div>`;
}
function careerTable(p, key, tot, past) {
  past = past || [];
  const rowsP = past.map(r => statRow(`<td class="l" data-v="${pastYr(r)}">${r.season}</td><td class="l">${r.team || '—'}${estTag(r)}</td><td>${pastAge(p, r)}</td><td>—</td>`, realStat(r), tot));
  const rowsH = p.hist.filter(h => h[key] && h[key].gp).map(h => statRow(`<td class="l" data-v="${yr(h.s)}">${seasonName(h.s)}</td><td class="l">${teamsTxt(h)}</td><td>${h.age}</td><td>${h.ovr}</td>`, h[key], tot, key === 'rs' ? leadsFor(p.id, h.s) : null));
  const cur = p.stats[key] && p.stats[key].gp ? statRow(`<td class="l" data-v="${yr(L.season)}">${seasonName(L.season)}*</td><td class="l">${p.team != null ? L.teams[p.team].abbr : '—'}</td><td>${p.age}</td><td>${ovrTxt(p)}</td>`, p.stats[key], tot, key === 'rs' ? leadsFor(p.id, L.season) : null) : '';
  const all = sumStats([...past.filter(r => !r.est).map(realStat), ...p.hist.map(h => h[key]), p.stats[key]]);
  if (!rowsP.length && !rowsH.length && !cur) return '<p class="muted">No games yet.</p>';
  return `<div class="tblwrap"><table class="sortable" data-sid="p-${key}-${tot ? 'tot' : 'pg'}"><thead><tr><th class="l">Season</th><th class="l">Team</th><th>Age</th><th>Ovr</th>${STAT_HEAD}</tr></thead><tbody>${rowsP.join('')}${rowsH.join('')}${cur}${all ? statRow('<td class="l"><strong>Career</strong></td><td></td><td></td><td></td>', all, tot).replace('<tr>', '<tr class="nosort">') : ''}</tbody></table></div>`;
}
// v28.7 F5: earlier seasons inside the one career table
const pastYr = r => parseInt(r.season, 10) || 0;
function pastAge(p, r) { const a = p.age - (yr(L.season) - pastYr(r)); return a > 15 && a < 50 ? a : '—'; }
const estTag = r => '';
function realStat(r) { const s = nbaStatOf(r); if (r.usg && (s.fga + s.fta + s.tov)) s.usgDen = 100 * (s.fga + 0.44 * s.fta + s.tov) / r.usg; return s; }
// v27.12 H4: real past seasons (stars: every real season; role players: "est." rows + the real 2025-26 line) shown before the sim seasons
const nbaPast = p => (L && L.nba && typeof nbaPastRows === 'function' && p && p.real) ? nbaPastRows(p) : [];
function nbaStatOf(r) { return { gp: r.gp || 0, gs: r.gs || 0, min: (r.mp || 0) * 60, pts: r.pts || 0, orb: r.orb || 0, drb: r.drb || 0, ast: r.ast || 0, stl: r.stl || 0, blk: r.blk || 0, tov: r.tov || 0, tpm: r.tpm || 0, tpa: r.tpa || 0, fgm: r.fgm || 0, fga: r.fga || 0, ftm: r.ftm || 0, fta: r.fta || 0, bpm: r.bpm == null ? null : r.bpm, usgDen: 0, per: r.per == null ? null : r.per, usg: r.usg == null ? null : r.usg, ows: r.ows == null ? null : r.ows, dws: r.dws == null ? null : r.dws, ws: r.ws == null ? null : r.ws, ws48: r.ws48 != null ? r.ws48 : r.ws != null && r.mp ? Math.round(r.ws * 48 / r.mp * 1000) / 1000 : null, vorp: r.vorp == null ? null : r.vorp }; }
// One panel per season type, with Per game / Totals / Advanced tabs
function statPanel(p, key) {
  ui.pTab = ui.pTab || {};
  const t = ui.pTab[key] || 'pg';
  const tabs = [['pg', 'Per game'], ['tot', 'Totals'], ['adv', 'Advanced']].map(([k, n]) => `<button class="sm ${t === k ? 'primary' : ''}" data-ptab="${key}:${k}">${n}</button>`).join('');
  const past = key === 'rs' ? nbaPast(p) : (L && L.nba && typeof nbaPoRows === 'function' && p && p.real) ? nbaPoRows(p) : [];
  const body = t === 'adv' ? advTable(p, key, past) : careerTable(p, key, t === 'tot', past);
  const notes = [key === 'rs' ? '* current season, in progress · <span class="lead-legend"></span> led the league that season (qualified players)' : '* current season, in progress', ].filter(Boolean).join(' · ');
  return `<section class="panel" style="margin-bottom:16px"><h3>${key === 'rs' ? 'Regular season' : 'Playoffs'}</h3><div class="subtabs">${tabs}</div>${body}<p class="muted" style="margin:6px 0 0;font-size:12px">${notes}</p></section>`;
}
// v37a: roster actions on the player page for your own players (same actions as the row's ⋯ menu; fine for touch)
function ownActions(p) {
  if (L.user == null || !isUser(p.team) || p.retired || p.prospect) return '';
  const rel = L.phase !== 'playoffs';
  return `<div class="pactions" role="group" aria-label="Roster actions">${canExtend(L, p) ? `<button class="sm" data-nego="${p.id}" title="Open the extension offer">Extend\u2026</button>` : ''}<button class="sm ${p.block ? 'on' : ''}" data-block="${p.id}" title="Let teams know he's available">${p.block ? 'On block \u2713' : 'Shop'}</button><button class="sm ${p.protect ? 'on' : ''}" data-protect="${p.id}" title="Untouchable: teams can't ask for him in a trade">${p.protect ? 'Untouchable \u2713' : 'Untouchable'}</button><button class="sm ${p.core ? 'on' : ''}" data-core="${p.id}" title="A player you build around (up to ${CORE_MAX}). Coach targets never take his spot.">${p.core ? 'Core \u2713' : 'Core'}</button>${rel ? `<button class="sm danger" data-release="${p.id}">Release\u2026</button>` : ''}</div><div id="relmsg"></div>`;
}
function vPlayer(p) {
  const groups = [['Athletic', ['spd', 'agi', 'vrt', 'str']], ['Offense', ['fin', 'pst', 'mid', 'tp', 'ft', 'hnd', 'pas', 'orb', 'drw']], ['Defense', ['per', 'pdf', 'stl', 'blk', 'drb', 'fdc']], ['Intangibles', ['iq', 'ocn', 'dcn', 'poc']], ['Offensive tendencies', ['tbd', 't3', 'tmd', 'trm', 'tps', 'tpa', 'tcs', 'ttr', 'tcr', 'tcl']], ['Defensive tendencies', ['tct', 'tgb']]];
  const team = p.team != null ? L.teams[p.team] : null;
  const log = L.games.filter(g => g.box.some(r => r[0] === p.id)).slice(-10).reverse();
  const logRows = log.map(g => {
    const r = g.box.find(r => r[0] === p.id); const side = r[1]; const opp = side === 0 ? g.away : g.home;
    const won = side === 0 ? g.hs > g.as : g.as > g.hs; const v = i => r[2 + i];
    return `<tr class="click" data-game="${g.id}"><td class="l">${g.playoff ? g.stage + ' G' + g.gnum : dayTxt(g.day, g.season)}</td><td class="l">${side === 0 ? 'vs' : '@'} ${L.teams[opp].abbr}</td><td class="${won ? 'w' : 'lo'}">${won ? 'W' : 'L'}</td><td>${Math.round(v(0) / 60)}</td><td>${v(1)}</td><td>${v(2)}-${v(3)}</td><td>${v(4)}-${v(5)}</td><td>${v(6)}-${v(7)}</td><td>${v(8) + v(9)}</td><td>${v(10)}</td><td>${v(11)}</td><td>${v(12)}</td></tr>`;
  }).join('');
  const stage = p.retired ? 'Retired' : p.age < p.peak ? 'Developing' : p.age < p.regStart ? 'Prime / plateau' : 'Declining';
  const acc = {}; for (const a of p.awards) (acc[a.a] = acc[a.a] || []).push(a.s);
  const accHtml = Object.keys(acc).length ? Object.entries(acc).sort((a, b) => b[1].length - a[1].length).map(([a, ss]) => `<div class="leader" style="grid-template-columns:minmax(0,1fr) auto"><span>${TROPHY_OF[a] ? trIcon(TROPHY_OF[a], '') : ''}${ss.length > 1 ? ss.length + '× ' : ''}${esc(a)}</span><span class="muted">${ss.map(s => seasonName(s)).join(', ')}</span></div>`).join('') : '<p class="muted">None yet.</p>';
  computeAdv(L, 'rs'); computeAdv(L, 'po');
  const seasonsPlayed = [...new Set([...p.hist.filter(h => h.rs && h.rs.gp).map(h => h.s), ...(p.stats.rs && p.stats.rs.gp ? [L.season] : [])])].sort((a, b) => b - a);
  const leadRows = seasonsPlayed.map(s => [s, leadsFor(p.id, s)]).filter(x => x[1].length);
  const leaderHtml = leadRows.length ? `<h3 style="margin-top:12px;font-size:14px">Led the league</h3>${leadRows.map(([s, ks]) => `<div class="leader" style="grid-template-columns:52px minmax(0,1fr)"><span class="muted">${seasonName(s)}${s === L.season && !L.history.some(h => h.s === s) ? '*' : ''}</span><span>${ks.map(k => `<span class="lead" style="padding:0 4px">${esc(LEAD_LBL[k] || k)}</span>`).join(' ')}</span></div>`).join('')}` : '';
  const fe = p.feats || { rs: {}, po: {} };
  const featRows = featList().filter(x => (fe.rs[x.key] || 0) + (fe.po[x.key] || 0) > 0);
  const FCAT = { pts: 'Scoring', fgm: 'Scoring', ftm: 'Scoring', tpm: 'Shooting', reb: 'Rebounding', orb: 'Rebounding', drb: 'Rebounding', ast: 'Playmaking', stl: 'Defense', blk: 'Defense', multi: 'All-around', gmsc: 'All-around', pm: 'All-around' };
  const fcats = [...new Set(featRows.map(x => FCAT[x.cat] || 'Other'))];
  const fsel = fcats.includes(ui.featTab) ? ui.featTab : fcats[0];
  const featTabs = fcats.length > 1 ? `<div class="subtabs">${fcats.map(c => `<button class="sm ${c === fsel ? 'primary' : ''}" data-feattab="${c}">${c}</button>`).join('')}</div>` : '';
  const featsHtml = featRows.length ? featTabs + `<div class="featgrid">${featRows.filter(x => (FCAT[x.cat] || 'Other') === fsel).map(x => `<div><span>${esc(x.label)}</span><span><strong>${fe.rs[x.key] || 0}</strong>${fe.po[x.key] ? ` <span class="muted">+${fe.po[x.key]} playoffs</span>` : ''}</span></div>`).join('')}</div>` : '<p class="muted">No milestone games yet. 30-point games, double-doubles, 10-rebound games and more are counted here.</p>';
  const hl = Object.entries(REC_KEYS).filter(([k]) => p.highs[k]).map(([k, n]) => { const h = p.highs[k]; return `<div class="leader" style="grid-template-columns:minmax(0,1fr) auto auto"><span>${n}</span><span class="v">${h.v}</span><span class="muted">${seasonName(h.s)} ${esc(h.lb)} vs ${L.teams[h.opp].abbr}</span></div>`; }).join('') || '<p class="muted">No games yet.</p>';
  const bestPo = p.best.filter(b => b.po), bestRs = p.best.filter(b => !b.po);
  const btab = ui.bestTab === 'po' && bestPo.length ? 'po' : 'rs';
  const bestList = btab === 'po' ? bestPo : bestRs;
  const bestTabs = `<div class="subtabs"><button class="sm ${btab === 'rs' ? 'primary' : ''}" data-besttab="rs">Regular season · ${bestRs.length}</button><button class="sm ${btab === 'po' ? 'primary' : ''}" data-besttab="po" ${bestPo.length ? '' : 'disabled'}>Playoffs · ${bestPo.length}</button></div>`;
  const best = p.best.length ? bestTabs + `<div class="tblwrap"><table class="sortable" data-sid="p-best"><thead><tr><th class="l">Game</th><th class="l">Opp</th><th class="l">Highlights</th><th>Min</th><th>Pts</th><th>Reb</th><th>Ast</th><th>Stl</th><th>Blk</th><th>FG</th><th>3P</th><th>FT</th></tr></thead><tbody>${bestList.map(b => { const r = b.line; return `<tr ${L.games[b.gid - 1] && L.games[b.gid - 1].season === b.s && b.s === L.season ? `class="click" data-game="${b.gid}"` : ''}><td class="l">${seasonName(b.s)} ${esc(b.lb)}</td><td class="l">${L.teams[b.tid].abbr} vs ${L.teams[b.opp].abbr}</td><td class="l">${esc(b.tags.join(', '))}</td><td>${Math.round(r[0] / 60)}</td><td>${r[1]}</td><td>${r[8] + r[9]}</td><td>${r[10]}</td><td>${r[11]}</td><td>${r[12]}</td><td>${r[2]}-${r[3]}</td><td>${r[4]}-${r[5]}</td><td>${r[6]}-${r[7]}</td></tr>`; }).join('')}</tbody></table></div>` : '<p class="muted">No standout games yet. Games with 50+ points, 20+ rebounds, 15+ assists, 7+ steals, 7+ blocks, 10+ threes or a triple-double are saved here.</p>';
  const inj = p.injuries.length ? p.injuries.slice().reverse().map(i => `<div>${seasonName(i.s)} ${esc(i.lb)}: ${esc(i.name || 'Injury')}, out ${i.games} game${i.games > 1 ? 's' : ''}${i.ce ? ' · career-threatening' : ''}</div>`).join('') : '<p class="muted">No injuries.</p>';
  const injParts = (() => { const c = {}; for (const x of p.injuries) { const k = x.part || injPart(x.name); c[k] = (c[k] || 0) + 1; } const e = Object.entries(c).sort((a, b) => b[1] - a[1]); return e.length ? `<div class="muted" style="margin:0 0 6px">By body part: ${e.map(([k, n]) => `${k} ${n}`).join(' · ')}${p.rested ? ` · rested ${p.rested} game${p.rested > 1 ? 's' : ''} (load management)` : ''}</div>` : ''; })();
  const cons = p.contracts.length ? `<div class="tblwrap"><table><thead><tr><th class="l">From</th><th class="l">Team</th><th class="l">Type</th><th>Per year</th><th>Years</th></tr></thead><tbody>${p.contracts.slice().reverse().map(c => `<tr><td class="l">${seasonName(c.s)}</td><td class="l">${L.teams[c.tid].abbr}</td><td class="l">${esc(c.type)}${c.opt ? ' · ' + (c.opt === 'PO' ? 'player' : 'team') + ' option' : ''}${c.hg ? ' · 90% cap hit' : ''}</td><td>${money(c.amt)}</td><td>${c.yrs}</td></tr>`).join('')}</tbody></table></div>` : '<p class="muted">No contracts yet.</p>';
  const tx = p.tx.length ? p.tx.slice().reverse().map(t => `<div><span class="muted">${seasonName(t.s)}</span> ${esc(t.t)}</div>`).join('') : '<p class="muted">Nothing yet.</p>';
  const c = p.contract;
  const negotiable = L.user != null && !p.retired && ((p.team == null && !p.tw && !p.prospect && !p.abroad && ['off-fa', 'off-ready', 'regular', 'off-resign', 'off-draft', 'off-review', 'off-lottery'].includes(L.phase)) || (L.phase === 'off-resign' && (L.resign || []).includes(p.id)) || (isUser(p.team) && canExtend(L, p)));
  const optDecision = L.user != null && (L.teamOptions || []).includes(p.id) ? `<section class="panel" style="margin-bottom:16px"><h3>Team option</h3><p>Next season is a team option at ${money(p.contract.amt)}. Exercise it to keep him, or decline and he becomes a free agent (you can still try to re-sign him).</p><div class="row"><button class="primary" data-topt="${p.id}" data-ex="1">Exercise option</button><button data-topt="${p.id}" data-ex="0">Decline option</button></div></section>` : '';
  const editing = ui.editName === p.id;
  const nameForm = editing ? `<div class="editname"><label><span class="k">First name</span><br><input id="en-first" value="${esc(p.first != null ? p.first : splitName(p.name)[0])}" maxlength="30" aria-label="First name"></label><label><span class="k">Last name</span><br><input id="en-last" value="${esc(p.last != null ? p.last : splitName(p.name)[1])}" maxlength="30" aria-label="Last name"></label><label><span class="k">Nationality</span><br><select id="en-nat" aria-label="Nationality">${Object.entries(NAT_NAME).map(([k, n]) => `<option value="${k}" ${k === p.nat ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></label><label><span class="k">Number</span><br><input id="en-num" type="number" min="0" max="99" style="width:70px" value="${p.num != null ? p.num : ''}" aria-label="Jersey number"></label><label><span class="k">Hometown</span><br><input id="en-home" value="${esc(p.home || '')}" maxlength="40" aria-label="Hometown"></label><button class="primary sm" data-savename="${p.id}">Save</button><button class="sm" data-editname="0">Cancel</button><span id="en-msg" class="muted"></span></div>` : '';
  return `<div class="row p-acts" style="margin-bottom:10px"><button data-back="1">Back</button><button data-p3card="${p.id}">Player card</button>${L.user != null && team && !isUser(team.id) && !p.retired ? `<button data-tradefor="${p.id}">Trade for this player</button>` : ''}${editing ? '' : `<button data-editname="${p.id}">Edit bio</button>`}<button data-cmpp="${p.id}">Compare</button>${L.user != null && L.mode !== 'commish' && isUser(p.team) && !p.retired ? `<button data-susp="${p.id}" title="Suspend him 1-5 games without pay">Suspend…</button><button data-meet="${p.id}" title="Sit down with him one-on-one">Meet</button>` : ''}${L.user != null && !p.retired ? `<button data-watch="${p.id}" class="${isWatched(L, p) ? 'primary' : ''}">${isWatched(L, p) ? '★ Watching' : '☆ Watch'}</button>` : ''}${L.user != null && p.prospect ? `<span class="seg" role="group" aria-label="Prospect tag">${Object.entries(PTAGS).map(([k, n]) => `<button class="sm ${ptagOf(L, p) === k ? 'primary' : ''}" data-ptag="${p.id}" data-ptv="${k}">${n}</button>`).join('')}</span>` : ''}</div>${ownActions(p)}
  <section class="panel" style="margin-bottom:16px"><div class="bio">${portrait('p', p.id, p.nat, p.team)}
    <div style="min-width:0"><div class="k">${team ? `<a class="lk" data-team="${team.id}">${logo(team.id)}${esc(tname(team.id))}</a>` : p.retired ? 'Retired ' + seasonName(p.retired) : p.prospect ? draftLabel(p.draftYear) + ' draft prospect' : p.tw ? `Two-way · <a class="lk" data-team="${p.tw.tid}">${logo(p.tw.tid)}${esc(tname(p.tw.tid))}</a> · ${p.tw.games}/${TW_GAMES} games` : p.abroad ? esc(abroadLabel(p)) : 'Free agent'} · ${p.num != null && !p.prospect ? '#' + p.num + ' · ' : ''}${posLabel(p)} · ${esc(NAT_NAME[p.nat] || '')}${p.home ? ' · From ' + esc(p.home) : ''}</div><div class="big">${esc(p.name)}</div>${nameForm}<div class="muted">${esc(archLabel(p))}${tagChips(p)}${p.coachId != null && findCoach(L, p.coachId) ? ` · <a class="lk pill pos" data-coach="${p.coachId}">Now a coach</a>` : ''}${p.xo ? ` · <span class="pill pos" title="Rare crossover player">${XO_TAG[p.xo]}</span>` : ''}${p.hof ? ' · <strong>Hall of Fame (' + seasonName(p.hof) + ')</strong>' : ''}${(p.retired || commish()) && !p.prospect ? ` · Legacy ${p.legacy != null ? p.legacy : legacyScore(p, null)} of ${hofMin(L)} HOF points` : ''}</div>${p.injury > 0 ? (isDTD(p) ? `<span class="pill dtd" title="${injTip(p)}">Day-to-day · ${esc((p.injName || '').toLowerCase())}</span>${hurtPlanSel(p)}` : `<span class="pill ${p.injLong ? 'long' : 'inj'}">Injured · out ${injGames(p)} game${injGames(p) > 1 ? 's' : ''}</span>`) : ''}${suspPill(p)}${p.hurtLog && p.hurtLog.s === L.season && p.hurtLog.gp ? ` <span class="muted" style="font-size:12px">Played hurt ${p.hurtLog.gp} game${p.hurtLog.gp > 1 ? 's' : ''} this season${p.hurtLog.aggr ? ` (aggravated ${p.hurtLog.aggr}×)` : ''}</span>` : ''}</div>
    <div><div class="k">Overall</div><div class="v">${ovrTxt(p)}</div>${flagPill(p)}</div><div><div class="k">Draft</div><div class="v" style="font-size:18px">${p.draft ? `${draftLabel(p.draft.s)} · Rd ${p.draft.rd}, #${p.draft.no} <span class="muted" style="font-size:14px">(${p.draft.rd === 1 ? p.draft.no : L.teams.length + p.draft.no} overall) ${p.draft.tid != null ? tlabel(p.draft.tid) : (p.draft.real ? p.draft.real + ' draft' : '')}</span>` : p.prospect ? draftLabel(p.draftYear) + ' class' : p.tx.some(t => /undrafted/i.test(t.t)) ? 'Undrafted' : 'Original player'}</div></div><div><div class="k">${commish() ? 'Potential' : 'Potential (scouted)'}</div><div class="v">${potCell(p)}</div></div>
    <div><div class="k">Age</div><div class="v">${p.age}</div></div><div><div class="k">Height</div><div class="v">${ft(p.hgt)}</div></div>
    <div><div class="k">Weight</div><div class="v">${p.wgt} lb</div></div><div><div class="k">Wingspan</div><div class="v">${ft(p.wing)}</div></div>
    ${team ? `<div><div class="k">System fit</div><div class="v">${fit(p, team.coach)} <span class="muted">${fit(p, team.coach) >= 65 ? 'good' : fit(p, team.coach) < 50 ? 'poor' : 'fair'} · ${esc(OFF_SYS[team.coach.off].name)} / ${esc(DEF_SYS[team.coach.def].name)}</span></div></div>` : ''}
  </div>
  ${sumCard(p)}${tiesLine(p)}
  <p class="muted" style="margin:12px 0 0">${!p.prospect ? `Fame: <span class="tipword" title="Built mostly from awards and All-Star selections (fading over time), plus scoring. Drives jersey sales, sponsors and where free agents want to play.">${fameLabel(p.fame || 0)} (${p.fame || 0})</span>. ` : ''}Personality: ${hideIntangibles(p) ? (() => { const iv = myInterview(p); return iv ? `<span class="tipword" title="Your interview's read; it can be wrong. ${esc(PERS[iv.pers] || '')}">${esc(persShort({ pers: iv.pers }))} (interview)</span>` : '<span class="muted">unknown until you interview him</span>'; })() : `<span class="tipword" title="${esc(PERS[p.pers] || '')}">${esc(persShort(p))}</span>${(() => { const r = trView(p).off.filter(x => x.k !== 'wrk' && x.v != null).sort((a, b) => b.v - a.v)[0]; return r ? ` <span class="muted">(top pull: ${esc(r.n.toLowerCase())} ${r.lv >= 2 ? r.v : '~' + r.v})</span>` : ''; })()}`}.${commish() && p.traj ? ` Career type: ${TRAJ[p.traj]}${p.gen ? ', generational talent' : ''}.` : ''}${commish() ? ` Career stage: <span class="tipword" title="Peak age ${p.peak}, decline from ${p.regStart}, decline speed ${p.regrLabel.toLowerCase()}${p.noGrow ? ', will not develop' : ''}. Scouts' potential estimate: ${p.scout}.">${stage}</span>.` : ''}${p.prospect ? (() => { const c = compFor(L, p); const mk = mockOrder(L, p.draftYear).findIndex(x => x.id === p.id) + 1; return ` Mock draft: #${mk} in the ${draftLabel(p.draftYear)} class.${c ? ' Player comparison: ' + plink(c) + ' (' + archLabel(c) + ', ' + c.ovr + ').' : ''}`; })() : ''} Years of service: ${p.svc}. Rating at each spot: ${POS.map((x, i) => `${x} ${slotRating(p, i)}`).join(' · ')}.</p>
  <p style="margin:6px 0 0">${agentLine(p)}Contract: ${c ? `${c.ntc ? '<span class="pill prot" title="No-trade clause: he must approve any trade">No-trade</span> ' : ''}${p.ext ? `${money(c.amt)}/yr in ${seasonName(c.exp)}, then ${money(p.ext.amt)}/yr through ${seasonName(contractEnd(p))} <strong>(${yrsLeft(L, p)} years left, extension signed)</strong>` : `${money(c.amt)}/yr through ${seasonName(c.exp)}`} (${c.type}${c.len ? ', ' + c.len + ' yr deal' : ''})${c.opt ? ` · ${c.opt === 'PO' ? 'player' : 'team'} option on the final year` : ''}${schedParts(p).length ? ` · <span class="muted">${schedParts(p).join(' · ')}</span>` : ''}${capHit(L, p) !== c.amt && c.exp >= capSeason(L) ? ' · cap hit ' + money(capHit(L, p)) : ''}` : 'none'}${p.ext ? ` · Extension: ${p.ext.yrs} yr from next season` : ''} · Market value ${money(p.mval || MINSAL)}${p.accPrem ? ` <span class="tipword" title="Past awards and honors raise his market value. Recent honors count most; older ones fade but never fully disappear.">(includes +${p.accPrem}% for accolades)</span>` : ''} · Max allowed ${money(maxFor(p))}${p.team == null && p.ask ? ` · Asking ${money(p.ask)}` : ''}</p>${(() => { const ce = contractExtras(p); return ce.length ? `<ul class="cx" style="margin:4px 0 0 18px;padding:0">${ce.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''; })()}</section>
  ${optDecision}${negotiable ? negoBar(p) : ''}${scoutPanel(p)}${proScoutPanel(p)}${moralePanel(p)}${twin('pdev', [['D-league', twoWayPanel(p)], ['Training focus', trainPanel(p)], ['Development report', devPanel(p)]], null, 1)}${scoutBox(p)}
  <section class="panel" style="margin-bottom:16px"><div class="row" style="justify-content:space-between;margin-bottom:6px"><h3 style="margin:0">Attributes <span class="tipword" style="font-size:12px;text-transform:none;letter-spacing:0" title="Playoff consistency is set when a player enters the league and never changes. Low means his playoff games swing more and tend to dip; high means he holds steady or rises a little.">· playoff consistency?</span></h3><div class="legend"><span><span class="an ag">&nbsp;</span>Well above ${POS[p.pos]} avg</span><span><span class="an ay">&nbsp;</span>Above</span><span><span class="an">&nbsp;</span>Average range</span><span><span class="an ao">&nbsp;</span>Below</span><span><span class="an ar">&nbsp;</span>Well below</span></div></div><div class="subtabs" style="margin-bottom:8px"><button class="sm ${ui.attrTab !== 'off' ? 'primary' : ''}" data-attrtab="on">On court</button><button class="sm ${ui.attrTab === 'off' ? 'primary' : ''}" data-attrtab="off">Off court</button></div>${ui.attrTab === 'off' ? trOffTab(p) : `<div class="attrs on">${onTraitsCol(p)}${groups.map(([g, ks]) => `<div><h3 style="font-size:14px">${g}</h3>${ks.map(k => (k === 'wrk' || k === 'dur') && !(k === 'wrk' && hideIntangibles(p) && myInterview(p)) ? traitRow(k, p) : k === 'wrk' && hideIntangibles(p) ? `<div class="arow2"><span>${LABELS[k]}</span><span class="muted" title="Hidden for prospects until you interview them">${myInterview(p) ? esc(workLabel(myInterview(p).work)) + ' (interview)' : '?'}</span></div>` : attrRow(k, attrNum(p, k), p, /tendencies/.test(g))).join('')}</div>`).join('')}${L.user != null && hiddenFor(L, p) ? `<p class="muted" style="font-size:12px;margin:8px 0 0">These are your scouting director's reads${L.teams[L.user].scout ? ` (${esc(L.teams[L.user].scout.name)}, rating ${L.teams[L.user].scout.rating})` : ''}, not his real ratings. Height, weight, wingspan and age are measured and exact. Real ratings are revealed after summer league.</p>` : ''}</div>`}</section>
  ${ovrChart(p)}
  ${statPanel(p, 'rs')}
  ${p.hist.some(h => h.po && h.po.gp) || (p.stats.po && p.stats.po.gp) ? statPanel(p, 'po') : ''}
  ${achHtml(p, 'p')}${trophyCase(p)}${pipePlayerPanels(p)}${feudPanel(p)}${shootingPanel(p)}${playerPlayPanel(p)}${defensePanel(p)}
  <section class="panel" style="margin-bottom:16px"><h3>Accolades</h3><div class="cols2">${accHtml}</div>${leaderHtml}</section>
  ${twin('pbest', [['Career highs', hl], ['Best games', best], ['Feats', featsHtml]])}
  <div class="grid2e" style="margin-bottom:16px"><section class="panel"><h3>Injury history</h3>${injParts}${inj}</section><section class="panel"><h3>Transactions</h3>${tx}</section></div>
  <section class="panel" style="margin-bottom:16px"><h3>Contract history</h3>${cons}</section>
  ${vsPanel(p)}
  <section class="panel" style="margin-bottom:16px"><h3>Game log · this season, last 10</h3>${log.length ? `<div class="tblwrap"><table><thead><tr><th class="l">Game</th><th class="l">Opp</th><th>Result</th><th>Min</th><th>Pts</th><th>FG</th><th>3P</th><th>FT</th><th>Reb</th><th>Ast</th><th>Stl</th><th>Blk</th></tr></thead><tbody>${logRows}</tbody></table></div>` : '<p class="muted">No games this season.</p>'}</section>`;
}
// v24.3: career line against each team (regular season and playoffs together)
function vsPanel(p) {
  if (p.prospect) return '';
  const rows = Object.keys(p.vs || {}).map(k => ({ t: +k, o: typeof vsUnpack === 'function' ? vsUnpack(p.vs[k]) : p.vs[k] })).filter(x => x.o.gp && L.teams[x.t]).sort((a, b) => L.teams[a.t].city.localeCompare(L.teams[b.t].city));
  if (!rows.length) return '<section class="panel" style="margin-bottom:16px"><h3>Against each team</h3><p class="muted">No games recorded against any team yet.</p></section>';
  const f = (n, g) => g ? (n / g).toFixed(1) : '—', pc = (m, a) => a ? (m / a * 100).toFixed(1) : '—';
  // v24.4: best and worst opponents (5+ games): by points per game and by win rate
  const q = rows.filter(r => r.o.gp >= 5), nm = r => esc(L.teams[r.t].abbr);
  let top = '';
  if (q.length >= 2) {
    const byP = q.slice().sort((a, b) => b.o.pts / b.o.gp - a.o.pts / a.o.gp), byW = q.slice().sort((a, b) => b.o.w / b.o.gp - a.o.w / a.o.gp);
    const pB = byP[0], pW = byP[byP.length - 1], wB = byW[0], wW = byW[byW.length - 1];
    top = `<p style="margin:0 0 8px">Best scoring vs <strong>${nm(pB)}</strong> (${f(pB.o.pts, pB.o.gp)} ppg) · worst vs <strong>${nm(pW)}</strong> (${f(pW.o.pts, pW.o.gp)})<br>Best record vs <strong>${nm(wB)}</strong> (${wB.o.w}-${wB.o.gp - wB.o.w}) · worst vs <strong>${nm(wW)}</strong> (${wW.o.w}-${wW.o.gp - wW.o.w}) <span class="muted">· 5+ games</span></p>`;
  }
  const cs = o => o.cs && o.cs.s === L.season ? o.cs : null;
  return `<section class="panel" style="margin-bottom:16px"><h3>Against each team</h3>${top}<div class="tblwrap"><table class="sortable" data-sid="p-vs"><thead><tr><th class="l">Opponent</th><th>GP</th><th>W-L</th><th>Min</th><th>Pts</th><th>Reb</th><th>Ast</th><th>Stl</th><th>Blk</th><th>TO</th><th>FG%</th><th>3P%</th><th>FT%</th><th title="This season: games, record, points per game">${seasonName(L.season)} GP</th><th>W-L</th><th>Pts</th><th title="Playoffs: games, record, points per game">Playoff GP</th><th>W-L</th><th>Pts</th></tr></thead><tbody>${rows.map(({ t, o }) => { const c = cs(o), po = o.po; return `<tr><td class="l">${tlabel(t, true)}</td><td>${o.gp}</td><td>${o.w}-${o.gp - o.w}</td><td>${(o.min / 60 / o.gp).toFixed(1)}</td><td>${f(o.pts, o.gp)}</td><td>${f(o.reb, o.gp)}</td><td>${f(o.ast, o.gp)}</td><td>${f(o.stl, o.gp)}</td><td>${f(o.blk, o.gp)}</td><td>${f(o.tov, o.gp)}</td><td>${pc(o.fgm, o.fga)}</td><td>${pc(o.tpm, o.tpa)}</td><td>${pc(o.ftm, o.fta)}</td><td>${c ? c.gp : '—'}</td><td>${c ? c.w + '-' + (c.gp - c.w) : '—'}</td><td>${c ? f(c.pts, c.gp) : '—'}</td><td>${po ? po.gp : '—'}</td><td>${po ? po.w + '-' + (po.gp - po.w) : '—'}</td><td>${po ? f(po.pts, po.gp) : '—'}</td></tr>`; }).join('')}</tbody></table></div><p class="muted" style="margin-top:6px">Career columns are per game, regular season and playoffs together. Counts from v24.3 on (this-season and playoff columns from v24.4); older games are not included.</p></section>`;
}
// ---------- v14: shooting by zone and TS% ratings by position ----------
// Your benchmarks (approximate): Elite / Very good / Good / Average / Below average, by position
const TS_TIERS = { PG: [62, 59, 56, 53], SG: [62, 59, 56, 53], SF: [63, 60, 57, 54], PF: [64, 61, 58, 55], C: [66, 63, 60, 57] };
function tsTier(posKey, ts) { const t = TS_TIERS[posKey] || TS_TIERS.SF; return ts >= t[0] ? 'Elite' : ts >= t[1] ? 'Very good' : ts >= t[2] ? 'Good' : ts >= t[3] ? 'Average' : 'Below average'; }
const tsOf = s => s && s.fga ? s.pts / (2 * (s.fga + 0.44 * s.fta)) * 100 : null;
const ZONE_GROUPS = [['At the rim', [0]], ['Paint (non-rim)', [1, 2, 3]], ['Mid-range', [4, 5, 6, 7, 8]], ['Corner 3', [9, 13]], ['Above-break 3', [10, 11, 12]]];
function zoneTable(z, title) {
  if (!z) return '';
  const tot = z.filter((_, i) => i % 2 === 0).reduce((a, b) => a + b, 0); if (!tot) return '';
  return `<div class="k" style="margin-top:8px">${esc(title)}</div><div class="tblwrap"><table><thead><tr><th class="l">Zone</th><th>FGM-FGA</th><th>FG%</th><th>Share</th></tr></thead><tbody>${ZONE_GROUPS.map(([n, ids]) => { let a = 0, m = 0; for (const i of ids) { a += z[i * 2]; m += z[i * 2 + 1]; } return `<tr><td class="l">${n}</td><td>${m}-${a}</td><td>${a ? (m / a * 100).toFixed(1) + '%' : '—'}</td><td>${(a / tot * 100).toFixed(0)}%</td></tr>`; }).join('')}</tbody></table></div>`;
}
function sumZ(list) { const out = new Array(28).fill(0); let any = false; for (const z of list) if (z) { any = true; for (let i = 0; i < 28; i++) out[i] += z[i] || 0; } return any ? out : null; }
// v25.2: points per possession by play type
const PT_KEYS = () => [...PLAY_KEYS, 'trans'];
function lgPPP() { const o = {}; for (const k of PT_KEYS()) { let n = 0, q = 0; for (const t of L.teams) if (t.pt && t.pt[k]) { n += t.pt[k][0]; q += t.pt[k][1]; } o[k] = n ? q / n : null; } return o; }
const ppp = x => x && x[0] ? (x[1] / x[0]).toFixed(2) : '—';
function playerPlayPanel(p) {
  const m = p.stats && p.stats.pt; if (!m) return '';
  const ks = Object.keys(m).filter(k => PLAYS[k] && m[k][0] >= 5).sort((a, b) => m[b][0] - m[a][0]); if (!ks.length) return '';
  const tot = ks.reduce((a, k) => a + m[k][0], 0), lg = lgPPP();
  return `<section class="panel" style="margin-bottom:16px"><h3>Play types · ${seasonName(L.season)}</h3><p style="margin:0">${ks.slice(0, 6).map(k => `<span class="tipword" title="${m[k][0]} possessions used, ${m[k][1]} points; league ${lg[k] != null ? lg[k].toFixed(2) : '—'}">${esc(PLAYS[k].n)}</span> <strong class="${lg[k] != null && m[k][1] / m[k][0] >= lg[k] + 0.05 ? 'w' : lg[k] != null && m[k][1] / m[k][0] <= lg[k] - 0.05 ? 'lo' : ''}">${ppp(m[k])}</strong> <span class="muted">PPP · ${Math.round(m[k][0] / tot * 100)}%</span>`).join(' · ')}</p><p class="muted" style="margin:4px 0 0;font-size:12px">Possessions he used (his shot, free throws or turnover) by the play that was run; regular season. Green = 0.05+ above the league's PPP for that play.</p></section>`;
}
function playTypePanel(t) {
  const pt = t.pt || {}, keys = PT_KEYS(), tot = keys.reduce((a, k) => a + ((pt[k] || [0])[0]), 0), lg = lgPPP();
  const cov = covOf(L, t), mine = isUser(t.id);
  const head = `<p class="muted" style="margin:-4px 0 8px">${esc(OFF_SYS[t.coach.off].name)} playbook${mine && t.pbAdj ? ' (your adjustments)' : ''}, adjusted to the roster. Pick-and-roll coverage: <strong>${COV_LBL[cov]}</strong>${mine && t.cov ? ' (your call' + (t.covHold ? ', held all game' : ', the coach can adjust in games') + ')' : ' (coach\'s default)'} · ${esc(COV_TXT[cov])}.${mine ? ' Change both on the Lineup & rotation tab.' : ''}</p>`;
  if (!tot) return `<section class="panel"><h3>Play types · ${esc(t.abbr)}</h3>${head}<p class="muted">No play-type data yet this season.</p></section>`;
  const rank = k => { const v = L.teams.filter(x => x.pt && x.pt[k] && x.pt[k][0] >= 15).map(x => x.pt[k][1] / x.pt[k][0]).sort((a, b) => b - a); if (!pt[k] || pt[k][0] < 15) return '—'; return v.indexOf(pt[k][1] / pt[k][0]) + 1; };
  const top = k => rosterOf(L, t).filter(p => p.stats.pt && p.stats.pt[k] && p.stats.pt[k][0] >= 5).sort((a, b) => b.stats.pt[k][0] - a.stats.pt[k][0]).slice(0, 2).map(p => `${plink(p)} <span class="muted">${ppp(p.stats.pt[k])} (${p.stats.pt[k][0]})</span>`).join(', ');
  const rows = keys.filter(k => pt[k] && pt[k][0]).map(k => { const x = pt[k], v = x[1] / x[0], l = lg[k];
    return `<tr><td class="l">${esc(PLAYS[k].n)}</td><td>${x[0]}</td><td>${(x[0] / tot * 100).toFixed(1)}%</td><td class="${l != null && v >= l + 0.04 ? 'w' : l != null && v <= l - 0.04 ? 'lo' : ''}"><strong>${v.toFixed(2)}</strong></td><td>${l != null ? l.toFixed(2) : '—'}</td><td>${rank(k)}</td><td class="l">${top(k) || '<span class="muted">—</span>'}</td></tr>`; }).join('');
  return `<section class="panel"><h3>Play types · ${esc(t.abbr)} · ${seasonName(L.season)}</h3>${head}<div class="tblwrap"><table class="sortable" data-sid="ptypes"><thead><tr><th class="l">Play</th><th title="Possessions that ended in a shot, free throws or a turnover">Poss</th><th>Freq</th><th title="Points per possession">PPP</th><th title="League points per possession for this play">League</th><th title="League rank in PPP (15+ possessions)">Rank</th><th class="l">Most used by (PPP, poss)</th></tr></thead><tbody>${rows}</tbody></table></div><p class="muted" style="margin:6px 0 0;font-size:12px">Regular season. Second-chance possessions after an offensive rebound aren't counted.</p></section>`;
}
// v25.2: your playbook (sliders) and pick-and-roll coverage, next to the late-game settings
function playbookEditor(t) {
  if (!isUser(t.id)) return '';
  const adj = t.pbAdj || {}, cov = covOf(L, t), dflt = coachCov(t.coach);
  const sl = k => { const v = adj[k] != null ? adj[k] : 2; return `<span class="k2">${esc(PLAYS[k].n)}</span><span><input type="range" min="0" max="4" step="1" value="${v}" data-pb="${k}" aria-label="${esc(PLAYS[k].n)} frequency" style="vertical-align:middle;width:140px"> <span class="muted">${PB_ADJ_LBL[v]}</span></span>`; };
  return `<div class="panel" style="margin-top:12px"><h3>Playbook & coverage</h3><p class="muted" style="margin:-4px 0 8px;font-size:12px">The coach runs a ${esc(OFF_SYS[t.coach.off].name.toLowerCase())} playbook, adjusted to who is healthy. Your sliders scale how often each play is called. ${t.pbAdj ? '<button class="sm" id="pb-reset">Use the coach\'s playbook</button>' : ''}</p><div class="kv">${PLAY_KEYS.map(sl).join('')}</div>
  <h3 style="margin-top:12px;font-size:14px">Pick-and-roll coverage</h3><div class="kv"><span class="k2">Pregame coverage</span><span><select id="cov-sel">${[['', `Coach's default (${COV_LBL[dflt]})`], ...COVS.map(c => [c, COV_LBL[c]])].map(([v, n]) => `<option value="${v}" ${(t.cov || '') === v ? 'selected' : ''}>${n}</option>`).join('')}</select></span><span class="k2">In games</span><span><select id="cov-hold"><option value="0" ${!t.covHold ? 'selected' : ''}>Coach adjusts at timeouts and breaks</option><option value="1" ${t.covHold ? 'selected' : ''}>Keep my coverage all game</option></select></span></div><p class="muted" style="margin:6px 0 0;font-size:12px">${esc(COV_LBL[cov])}: ${esc(COV_TXT[cov])}. Effects are small: talent decides most games.</p></div>`;
}
function shootingPanel(p) {
  if (p.prospect) return '';
  const posKey = POS[p.pos], s = p.stats.rs, ts = tsOf(s);
  const car = (() => { const rows = p.hist.filter(h => h.rs && h.rs.gp).map(h => h.rs).concat(s && s.gp ? [s] : []); if (!rows.length) return null; return rows.reduce((a, r) => ({ pts: a.pts + r.pts, fga: a.fga + r.fga, fta: a.fta + r.fta }), { pts: 0, fga: 0, fta: 0 }); })();
  const cts = tsOf(car), zc = sumZ(p.hist.map(h => h.z).concat([p.stats.zr]));
  if (ts == null && cts == null) return '';
  return `<section class="panel" style="margin-bottom:16px"><h3>Shooting</h3><p style="margin:0 0 4px">True shooting: ${ts != null ? `<strong>${ts.toFixed(1)}%</strong> this season · ${tsTier(posKey, ts)} for a ${posKey}` : 'no games this season'}${cts != null ? ` · career ${cts.toFixed(1)}% (${tsTier(posKey, cts)})` : ''}</p><p class="muted" style="margin:0;font-size:12px">${posKey} ratings: Elite ${TS_TIERS[posKey][0]}%+, Very good ${TS_TIERS[posKey][1]}–${TS_TIERS[posKey][0]}%, Good ${TS_TIERS[posKey][2]}–${TS_TIERS[posKey][1]}%, Average ${TS_TIERS[posKey][3]}–${TS_TIERS[posKey][2]}%.</p>${playerShotChart(p)}</section>`;
}
function teamShootingPanel(t) {
  if (!t.zr && !(t.zHist && Object.keys(t.zHist).length)) return '';
  return `<section class="panel" style="margin-top:16px"><h2>Shooting by zone</h2><div class="grid2e"><div>${shotChart(t.zr, 'Team, this season')}${zoneTable(t.zr, 'Team, this season')}</div><div>${shotChart(t.zrOpp, 'Opponents, this season')}${zoneTable(t.zrOpp, 'Opponents, this season')}</div></div></section>`;
}
// Half-court shot chart: color = FG% vs the league in that zone (red hot, blue cold), strength = how often he shoots from there
let SC_N = 0;
const SC_CLIP = 'M30 0 L30 140 A237.5 237.5 0 0 0 470 140 L470 0 Z';
const SC_ZONES = [
  ['c', 250, 52, 62], ['r', 170, 0, 53.3, 190], ['r', 223.3, 0, 53.4, 190], ['r', 276.7, 0, 53.3, 190],
  ['ri', 30, 0, 140, 140], ['ri', 30, 140, 140, 330], ['ri', 170, 190, 160, 280], ['ri', 330, 140, 140, 330], ['ri', 330, 0, 140, 140],
  ['r', 0, 0, 30, 140], ['ro', 0, 140, 180, 330], ['ro', 180, 0, 140, 470], ['ro', 320, 140, 180, 330], ['r', 470, 0, 30, 140]
];
const SC_LBL = [[250, 88], [196, 128], [250, 150], [304, 128], [100, 72], [104, 236], [250, 262], [396, 236], [400, 72], [15, 160], [70, 400], [250, 445], [430, 400], [485, 160]];
function leagueZoneAvg() {
  const key = L.season + ':' + L.day + ':' + L.phase; if (leagueZoneAvg.k === key) return leagueZoneAvg.v;
  const z = sumZ(L.teams.map(t => t.zr).concat(L.teams.map(t => t.zHist && t.zHist[L.season - 1] ? t.zHist[L.season - 1].z : null)));
  const v = []; for (let i = 0; i < 14; i++) v.push(z && z[i * 2] >= 50 ? z[i * 2 + 1] / z[i * 2] : [0.66, 0.47, 0.47, 0.47, 0.39, 0.4, 0.4, 0.4, 0.39, 0.37, 0.34, 0.34, 0.34, 0.37][i]);
  leagueZoneAvg.k = key; leagueZoneAvg.v = v; return v;
}
function shotChart(z, title) {
  if (!z) return ''; const tot = z.filter((_, i) => i % 2 === 0).reduce((a, b) => a + b, 0); if (tot < 10) return '';
  const id = 'sc' + (++SC_N), avg = leagueZoneAvg(), maxSh = Math.max(...SC_ZONES.map((_, i) => z[i * 2])) || 1;
  const col = (i) => { const a = z[i * 2]; if (!a) return 'var(--surface-2)'; const d = (z[i * 2 + 1] / a - avg[i]) * 100, k = clamp(d / 8, -1, 1); return k >= 0 ? `rgb(${Math.round(200 + 40 * k)},${Math.round(200 - 120 * k)},${Math.round(200 - 140 * k)})` : `rgb(${Math.round(200 + 140 * k)},${Math.round(200 + 60 * k)},${Math.round(200 - 40 * k)})`; };
  const shape = (s, i) => { const fill = col(i), op = z[i * 2] ? 0.35 + 0.65 * z[i * 2] / maxSh : 0.25, a = z[i * 2], m = z[i * 2 + 1], tip = `<title>${a ? `${m}-${a} (${(m / a * 100).toFixed(1)}%), ${(a / tot * 100).toFixed(0)}% of shots` : 'No shots'}</title>`;
    if (s[0] === 'c') return `<path d="M${s[1] - s[3]} 0 L${s[1] - s[3]} ${s[2]} A${s[3]} ${s[3]} 0 0 0 ${s[1] + s[3]} ${s[2]} L${s[1] + s[3]} 0 Z" fill="${fill}" fill-opacity="${op}" stroke="var(--line)">${tip}</path>`;
    const rect = `<rect x="${s[1]}" y="${s[2]}" width="${s[3]}" height="${s[4]}" fill="${fill}" fill-opacity="${op}" stroke="var(--line)"${s[0] === 'ri' ? ` clip-path="url(#${id}i)"` : s[0] === 'ro' ? ` mask="url(#${id}o)"` : ''}>${tip}</rect>`;
    return rect; };
  const lbl = SC_LBL.map(([x, y], i) => { const a = z[i * 2]; if (!a) return ''; const p = Math.round(z[i * 2 + 1] / a * 100); return (i === 9 || i === 13) ? `<text x="${x}" y="${y}" text-anchor="middle" font-size="13" font-weight="700" fill="var(--ink)" transform="rotate(-90 ${x} ${y})">${p}%</text>` : `<text x="${x}" y="${y}" text-anchor="middle" font-size="15" font-weight="700" fill="var(--ink)">${p}%</text><text x="${x}" y="${y + 15}" text-anchor="middle" font-size="11" fill="var(--muted)">${a} att</text>`; }).join('');
  return `<div class="k" style="margin-top:8px">${esc(title)}</div><svg class="shotchart" viewBox="0 0 500 470" role="img" aria-label="${esc(title)} shot chart">
  <defs><clipPath id="${id}i"><path d="${SC_CLIP}"/></clipPath><mask id="${id}o"><rect width="500" height="470" fill="#fff"/><path d="${SC_CLIP}" fill="#000"/></mask></defs>
  <rect width="500" height="470" fill="var(--surface)"/>
  ${SC_ZONES.slice(4).map((s, j) => shape(s, j + 4)).join('')}${SC_ZONES.slice(1, 4).map((s, j) => shape(s, j + 1)).join('')}${shape(SC_ZONES[0], 0)}
  ${scCourt()}${lbl}</svg>
  <div class="sclegend"><span style="background:rgb(60,140,240)"></span>Cold <span style="background:rgb(200,200,200)"></span>League avg <span style="background:rgb(240,80,60)"></span>Hot · stronger color = more shots</div>`;
}
// Phase 1: court lines shared by the heat chart and the makes / misses chart
function scCourt() {
  return `<path d="${SC_CLIP}" fill="none" stroke="var(--ink)" stroke-width="2" opacity=".55"/><rect x="170" y="0" width="160" height="190" fill="none" stroke="var(--ink)" stroke-width="2" opacity=".55"/>
  <circle cx="250" cy="190" r="60" fill="none" stroke="var(--ink)" stroke-width="1.5" opacity=".35"/><line x1="220" y1="40" x2="280" y2="40" stroke="var(--ink)" stroke-width="3"/><circle cx="250" cy="52" r="7.5" fill="none" stroke="var(--ink)" stroke-width="2"/>
  <rect x="1" y="1" width="498" height="468" fill="none" stroke="var(--ink)" stroke-width="2" opacity=".55"/>`;
}
// ---------- Phase 1: makes and misses chart (dots = made, x = missed) ----------
// The engine keeps the zone of each shot (14 zones, see engine.js pickZone), not the exact spot, so each dot is placed at a
// random point inside its zone (seeded, so the same chart looks the same every time).
function scZoneOf(x, y) {
  const in3 = (x >= 30 && x <= 470 && y <= 140) || Math.hypot(x - 250, y - 50.5) <= 237.5;
  if (!in3) { if (y < 140) return x < 30 ? 9 : 13; return x < 180 ? 10 : x < 320 ? 11 : 12; }
  if ((y <= 52 && x >= 188 && x <= 312) || (y > 52 && Math.hypot(x - 250, y - 52) <= 62)) return 0;
  if (x >= 170 && x <= 330 && y <= 190) return x < 223.3 ? 1 : x < 276.7 ? 2 : 3;
  if (y < 140) return x < 170 ? 4 : 8;
  return x < 170 ? 5 : x > 330 ? 7 : 6;
}
const SC_BOX = [[188, 312, 26, 114], [170, 223, 18, 190], [223, 277, 18, 190], [277, 330, 18, 190], [30, 170, 6, 140], [30, 170, 140, 290], [170, 330, 190, 290], [330, 470, 140, 290], [330, 470, 6, 140], [3, 27, 6, 140], [3, 180, 140, 330], [180, 320, 250, 330], [320, 497, 140, 330], [473, 497, 6, 140]];
function scRng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function scSpot(z, r) {
  const b = SC_BOX[z];
  for (let k = 0; k < 60; k++) { const x = b[0] + r() * (b[1] - b[0]), y = b[2] + r() * (b[3] - b[2]); if (scZoneOf(x, y) === z && (z < 9 || y < 140 || Math.hypot(x - 250, y - 50.5) <= 285)) return [x, y]; }
  return [(b[0] + b[1]) / 2, (b[2] + b[3]) / 2];
}
// shots: game letters (game.sh) -> [[zone, made], ...]
const shotsOfStr = t => [...(t || '')].map(c => { const i = 'ABCDEFGHIJKLMNOPQRSTUVWXYZab'.indexOf(c); return [i >> 1, i & 1]; }).filter(x => x[0] >= 0);
// zone totals (p.stats.zr etc.) -> shots; above cap, a fair sample (same make rate per zone)
function shotsOfZ(z, cap) {
  if (!z) return { list: [], tot: 0 };
  const tot = z.filter((_, i) => i % 2 === 0).reduce((a, b) => a + b, 0), k = cap && tot > cap ? cap / tot : 1, list = [];
  for (let i = 0; i < 14; i++) { const a = Math.round(z[i * 2] * k), m = Math.round(z[i * 2 + 1] * k); for (let j = 0; j < a; j++) list.push([i, j < m ? 1 : 0]); }
  return { list, tot, sampled: k < 1 };
}
function shotDots(list, title, seed, note, tot) {
  if (!list.length) return `<div class="k" style="margin-top:8px">${esc(title)}</div><p class="muted">No shots.</p>`;
  const r = scRng(seed || 1), mk = list.filter(x => x[1]).length, dots = list.map(([z, m]) => ({ z, m, p: scSpot(z, r) })).sort((a, b) => a.m - b.m);
  const marks = dots.map(d => { const [x, y] = d.p.map(v => Math.round(v)); return d.m ? `<circle class="mk" cx="${x}" cy="${y}" r="6.5"/>` : `<path class="ms" d="M${x - 5} ${y - 5}L${x + 5} ${y + 5}M${x + 5} ${y - 5}L${x - 5} ${y + 5}"/>`; }).join('');
  const t3 = list.filter(x => x[0] >= 9), T = tot || [mk, list.length, t3.filter(x => x[1]).length, t3.length];   // tot: real totals when the dots are a sample
  return `<div class="k" style="margin-top:8px">${esc(title)} · FG ${T[0]}-${T[1]} (${(T[0] / T[1] * 100).toFixed(0)}%)${T[3] ? ` · 3P ${T[2]}-${T[3]}` : ''}</div><svg class="shotchart scdots" viewBox="0 0 500 470" role="img" aria-label="${esc(title)}: ${mk} made, ${list.length - mk} missed">
  <rect width="500" height="470" fill="var(--surface)"/>${scCourt()}${marks}</svg>
  <div class="sclegend"><svg width="14" height="14" viewBox="0 0 14 14"><circle cx="7" cy="7" r="5.5" fill="var(--a-green)"/></svg>Made <svg width="14" height="14" viewBox="0 0 14 14"><path d="M2 2L12 12M12 2L2 12" stroke="var(--a-red)" stroke-width="2.4"/></svg>Missed</div>${note ? `<div class="muted" style="font-size:11px;margin:-4px 0 6px">${esc(note)}</div>` : ''}`;
}
// box score: whole team or one player
function gameShotPanel(g) {
  const head = '<h3>Shot chart</h3>';
  if (!g.sh) return `<section class="panel" style="margin-bottom:16px">${head}<p class="muted">Shot charts are kept for games played with this version or later.</p></section>`;
  const sel = ui.gsh && ui.gsh.g === g.id ? ui.gsh.k : 'a';
  const sideOf = id => { const r = g.box.find(x => x[0] === id); return r ? r[1] : null; };
  const teamStr = si => Object.keys(g.sh).filter(id => sideOf(+id) === si).map(id => g.sh[id]).join('');
  const btn = (k, t) => `<button class="sm ${sel === k ? 'on' : ''}" data-gsh="${g.id}:${k}">${t}</button>`;
  const si = sel === 'h' ? 0 : sel === 'a' ? 1 : sideOf(+sel);
  const ppl = g.box.filter(r => r[1] === si && g.sh[r[0]]).sort((a, b) => g.sh[b[0]].length - g.sh[a[0]].length);
  const pl = sel !== 'a' && sel !== 'h' ? L.players[+sel] : null;
  const list = shotsOfStr(pl ? g.sh[sel] : teamStr(si)), title = pl ? pl.name : tname(si === 0 ? g.home : g.away);
  return `<section class="panel" style="margin-bottom:16px">${head}<div class="sc-pick">${btn('a', esc(L.teams[g.away].abbr))}${btn('h', esc(L.teams[g.home].abbr))}</div><div class="sc-pick">${ppl.map(r => { const p = L.players[r[0]]; return btn(String(r[0]), p ? esc(shortName(p)) : 'Player'); }).join('')}</div><div style="max-width:440px">${shotDots(list, title, g.id * 7919 + (pl ? pl.id : si))}</div><p class="muted" style="margin:4px 0 0;font-size:12px">Each mark is one shot, placed in the area of the court it came from. Free throws are not shown.</p></section>`;
}
// player page: pick the season and the view (heat map by zone, or makes and misses)
function playerShotChart(p) {
  const opts = [];
  if (p.stats.zr) opts.push(['cur', 'This season', p.stats.zr]);
  if (p.stats.zp) opts.push(['po', 'Playoffs', p.stats.zp]);
  for (const h of p.hist.slice().reverse()) if (h.z && h.s != null) opts.push(['s' + h.s, seasonName(h.s), h.z]);
  const car = sumZ(p.hist.map(h => h.z).concat([p.stats.zr])); if (car && opts.length > 1) opts.push(['car', 'Career', car]);
  if (!opts.length) return '';
  const st = ui.psc && ui.psc.p === p.id ? ui.psc : { p: p.id, s: opts[0][0], m: 'heat' };
  const cur = opts.find(o => o[0] === st.s) || opts[0];
  const segs = `<span class="seg"><button class="sm ${st.m === 'heat' ? 'primary' : ''}" data-psc="${p.id}:m:heat">Hot and cold zones</button><button class="sm ${st.m === 'dots' ? 'primary' : ''}" data-psc="${p.id}:m:dots">Makes and misses</button></span>`;
  const sel = `<select data-pscs="${p.id}" aria-label="Season for the shot chart">${opts.map(o => `<option value="${o[0]}" ${o[0] === cur[0] ? 'selected' : ''}>${esc(o[1])}</option>`).join('')}</select>`;
  let chart;
  if (st.m === 'dots') { const z = cur[2], sh = shotsOfZ(z, 350), zs = (a, b, k) => { let v = 0; for (let i = a; i <= b; i++) v += z[i * 2 + k]; return v; };
    chart = shotDots(sh.list, cur[1], p.id * 31 + (cur[0].length * 97) + (parseInt(cur[0].slice(1)) || 0), sh.sampled ? `Showing a sample of 350 of his ${sh.tot} shots, with the same make rate in each area.` : '', [zs(0, 13, 1), zs(0, 13, 0), zs(9, 13, 1), zs(9, 13, 0)]); }
  else chart = shotChart(cur[2], cur[1]) || '<p class="muted">Not enough shots for a heat map yet (10+).</p>';
  return `<div class="row" style="gap:8px;flex-wrap:wrap;align-items:center;margin-top:8px">${segs}${sel}</div>${chart}${zoneTable(cur[2], cur[1] + ' by zone')}`;
}
// ---------- v13: summary card, achievements, rafters, goal tracker, recaps ----------
function tiesLine(p) {
  const rels = relatives(L, p).map(r => `${r.k === 'son' ? 'son of' : r.k === 'father' ? 'father of' : 'brother of'} ${r.c ? 'coach ' + clink(r.who) : plink(r.who)}`);
  const m = p.mentor != null ? findCoach(L, p.mentor) : null, fr = (p.friction || []).map(id => findCoach(L, id)).filter(Boolean);
  const bits = [...(rels.length ? ['Family: ' + rels.join(', ')] : []), ...(m && (p.svc || 0) >= 1 ? [`First coach: ${clink(m)}`] : []), ...(fr.length ? [`Friction: ${fr.map(clink).join(', ')}`] : [])];
  return bits.length ? `<p class="muted" style="margin:8px 0 0">${bits.join(' · ')}</p>` : '';
}
// v32b: role cell for roster tables
// v32d: expected minutes = the coach's plan for a normal game (same numbers as the Rotation & roles panel), cached per team and day
let EXPMIN = { k: '', m: {} };
function expMin(p) {
  if (p.team == null || !L) return null;
  const t = L.teams[p.team]; if (!t) return null;
  const k = `${L.season}|${L.phase}|${L.day}|${t.roster.length}|${t.rotChart ? 1 : 0}|${t.manual ? 1 : 0}`; if (EXPMIN.k !== k) EXPMIN = { k, m: {} };
  if (!EXPMIN.m[t.id]) { try { const g = buildSide(L, t.id, true), o = {}; for (const q of g.players) o[q.id] = Math.round((g.target[q.id] || 0) / 60); EXPMIN.m[t.id] = o; } catch (e) { EXPMIN.m[t.id] = {}; } }
  const v = EXPMIN.m[t.id][p.id]; return v == null ? null : v;
}
const roleMinTxt = k => { const r = ROLE_BY[k]; return r ? `${r.lo}-${r.hi} min a game, about ${Math.round((r.lo + r.hi) / 2)}` : ''; };
function roleCell(p) { const rk = p.team != null ? roleOf(L, p) : null, em = rk ? expMin(p) : null; return rk ? `${roleName(rk)} <span class="muted">${roleRange(rk)}${em != null ? ' · exp ' + em : ''}</span>` : '<span class="muted">—</span>'; }
function roleSortV(p) { const rk = p.team != null ? roleOf(L, p) : null; return rk ? 9 - roleRank(rk) : 0; }
function roleTip(p) { const rk = p.team != null ? roleOf(L, p) : null; if (!rk) return ''; const s = p.stats.rs, mpg = s && s.gp ? s.min / s.gp / 60 : null; const em = expMin(p); return `${roleName(rk)}: expects ${roleRange(rk)} min${em != null ? `, coach plans ${em}` : ''}${mpg != null ? `, playing ${f1(mpg)}` : ''}${p.contract && p.contract.role && ROLE_BY[p.contract.role.k] ? ` · promised ${roleName(p.contract.role.k)}` : ''}`; }
function sumCard(p) {
  if (p.prospect || p.retired) return '';
  const tid = p.team != null ? p.team : p.tw ? p.tw.tid : null, t = tid != null ? L.teams[tid] : null;
  let role = p.abroad ? 'Overseas' : 'Free agent';
  if (p.tw) role = 'Two-way';
  else if (t) { const rk = roleOf(L, p); if (rk) { const em = expMin(p); role = `${roleName(rk)} <span class="muted">${roleRange(rk)} min${em != null ? ' · plan ' + em : ''}</span>`; } else { const rot = rotationOf(L, t), i = rot.findIndex(x => x.id === p.id); role = i < 0 ? 'End of bench' : i < 5 ? 'Starter' : i < 8 ? 'Rotation' : 'Bench'; } }   // v32b: the coach's role
  const c = p.contract, last = p.hist.filter(h => h.ovr != null).slice(-1)[0], tr = last ? p.ovr - last.ovr : null;
  const s = p.stats.rs && p.stats.rs.gp ? p.stats.rs : null, h = !s ? p.hist.filter(x => x.rs && x.rs.gp).slice(-1)[0] : null, ss = s || (h && h.rs);
  const line = ss ? `${f1(ss.pts / ss.gp)} / ${f1((ss.orb + ss.drb) / ss.gp)} / ${f1(ss.ast / ss.gp)}` : '—';
  const box = (k, v) => `<div><div class="k">${k}</div><div class="v2">${v}</div></div>`;
  return `<div class="sumcard">${box('Role', role)}${box('Contract', c ? `${money(c.amt)} · ${yrsLeft(L, p)}y${c.opt ? ' ' + c.opt : ''}` : p.tw ? 'Two-way' : '—')}${box('Mood', p.morale != null ? moodCell(p) : '—')}${box('Trend', tr == null ? 'New' : tr > 0 ? `<span class="w">▲ ${tr}</span>` : tr < 0 ? `<span class="l2" style="color:var(--loss)">▼ ${-tr}</span>` : '—')}${box(s ? 'Pts / Reb / Ast' : 'Last season', line)}</div>`;
}
function achHtml(ent, kind, inline) {
  const names = kind === 'p' ? ACH_P : kind === 't' ? ACH_T : ACH_C, a = ent.ach || {};
  const got = Object.keys(a).filter(k => names[k]);
  if (!got.length) return '';
  const inner = got.sort((x, y) => a[y] - a[x]).map(k => { const log = (L.achLog || []).find(x => x.kind === kind && x.id === ent.id && x.key === k); return `<span class="ach on" title="${seasonName(a[k])}${log ? ': ' + esc(log.text) : ''}">${esc(names[k].split(':')[0])} · ${seasonName(a[k])}</span>`; }).join('');
  return inline ? `<h3 style="margin-top:12px">Achievements</h3><div>${inner}</div>` : `<section class="panel" style="margin-bottom:16px"><h3>Achievements</h3><div>${inner}</div></section>`;
}
function rafters(t) {
  const r = (t.retired || []).slice().sort((a, b) => a.s - b.s);
  if (!r.length) return '';
  return `<div class="rafters" aria-label="Retired numbers">${r.map(x => `<span class="jr" style="background:${t.c1};color:${t.c2}" title="${esc(x.name)}, retired ${seasonName(x.s)}">#${x.num}<small>${esc(x.name.split(' ').slice(-1)[0])}</small></span>`).join('')}</div>`;
}
// Owner goal progress for your team
function goalTracker(t) {
  if (L.mode !== 'team' || !t.owner || !t.owner.goal || !['regular', 'regular-done'].includes(L.phase)) return '';
  const g = t.owner.goal, gp = t.w + t.l, left = SEASON_GAMES - gp;
  let pctv = 0, txt = '';
  if (g.key === 'wins') { const proj = gp ? Math.round(t.w / gp * SEASON_GAMES) : 0; pctv = Math.min(100, t.w / g.n * 100); txt = `${t.w} of ${g.n} wins · pace ${proj}`; }
  else if (['po', 'poC', 'cf', 'finals'].includes(g.key)) { const conf = seedOrder(L, t.conf), seed = conf.indexOf(t.id) + 1; const D = poDirect(L), P = poPlayinTo(L); pctv = seed <= D ? 100 : seed <= P ? 60 : 25; txt = `Conference seed ${seed} of ${conf.length} · ${seed <= D ? 'in a playoff spot' : seed <= P ? 'play-in range' : 'outside'}`; }
  else { const pr = seasonProjection(L, t), pf = pr.profit != null ? pr.profit : pr.revenue - pr.expenses, need = t.market === 1 ? -10 : 0; pctv = pf >= need ? 100 : Math.max(0, 100 + (pf - need) * 5); txt = `Projected ${pf >= 0 ? 'profit' : 'loss'} ${money(Math.abs(pf))}`; }
  const cls = pctv >= 80 ? '' : pctv >= 50 ? 'warn' : 'bad';
  return `<div class="goalbar"><div class="k">Owner goal: ${esc(g.txt)}</div>${meter(pctv, cls)}<div class="muted" style="font-size:12px">${txt}${left > 0 ? ` · ${left} games left` : ''}</div></div>`;
}
function votesHtml(A, key) {
  const v = (A.votes || {})[key]; if (!v || !v.length) return '';
  const tie = (A.tie || {})[key], nm = id => L.players[id] ? esc(L.players[id].name) : '?';
  const tieTxt = tie ? `<p class="note" style="margin:6px 0">Tied at ${tie.pts} points. ${nm(tie.a)} won the tiebreak on ${tie.by === 'first' ? `first-place votes, ${tie.fa}–${tie.fb}` : 'the award score (first-place votes were also tied)'}.</p>` : '';
  return `<div class="runners"><strong>Voting</strong> <span class="muted">(100 voters, 10-7-5-3-1 points; ties go to more first-place votes, then the award score)</span>${tieTxt}<div class="tblwrap"><table><thead><tr><th class="l">Player</th><th>1st</th><th>Points</th><th>Share</th></tr></thead><tbody>${v.map(x => `<tr><td class="l">${L.players[x.pid] ? plink(L.players[x.pid]) : '—'}</td><td>${x.first}</td><td>${x.pts}</td><td>${x.share}%</td></tr>`).join('')}</tbody></table></div></div>`;
}
function jerseyDialog(list) {
  dialog(`<h2>Jersey retirement${list.length > 1 ? 's' : ''}</h2>${list.map(j => { const t = L.teams[j.tid]; return `<div class="awcard"><span class="jr" style="background:${t.c1};color:${t.c2};font-size:28px;padding:10px 14px;border-radius:8px;font-weight:800">#${j.num}</span><div><div class="big">${L.players[j.pid] ? plink(L.players[j.pid]) : esc(j.name)}</div><div>${tlabel(j.tid, true)} raise #${j.num} to the rafters.</div></div></div>`; }).join('')}<div class="row"><button class="primary" id="x-close">Nice</button></div>`);
  $('#x-close').onclick = closeDialog;
}
function ddayDialog() {
  L.ddWarned = L.season;
  const blk = rosterOf(L, L.teams[L.user]).filter(p => p.block), off = (L.offers || []).length;
  dialog(`<h2>Trade deadline day</h2><p>Today is the last day to make trades.${blk.length ? ` You're shopping ${blk.map(p => esc(p.name)).join(', ')}.` : ''}${off ? ` You have ${off} pending offer${off > 1 ? 's' : ''}.` : ''} Teams will be busy all day.</p><div class="row" style="margin-top:12px"><button class="primary" id="dd-trades">Go to Trades</button><button id="dd-sim">Sim deadline day</button><button id="x-close">Close</button></div>`);
  $('#x-close').onclick = closeDialog; $('#dd-trades').onclick = () => { closeDialog(); location.hash = '#trades'; };
  $('#dd-sim').onclick = () => { closeDialog(); const b = document.querySelector('#simctl [data-sim="day"]'); if (b) { ui.preOK = L.day + ':' + L.season; b.click(); } };
}
function deadlineDialog() {
  const r = L.deadlineRecap; if (!r) return;
  const big = r.big != null && L.players[r.big], dd = r.day || [];
  const head = r.day ? `<div class="panel" style="margin-bottom:10px"><h3>Deadline day: ${dd.length} deal${dd.length === 1 ? '' : 's'}</h3>${big ? `<div>Biggest name moved: ${plink(big)} (${big.ovr})</div>` : ''}${(r.buyers || []).length ? `<div>Buyers: ${r.buyers.map(x => tlabel(x)).join(', ')}</div>` : ''}${(r.sellers || []).length ? `<div>Sellers: ${r.sellers.map(x => tlabel(x)).join(', ')}</div>` : ''}${(r.rumors || []).length ? `<div class="muted">Rumored: ${r.rumors.filter(id => L.players[id]).map(id => esc(L.players[id].name) + (dd.some(t => [...t.aIn.players, ...t.bIn.players].includes(id)) ? ' (moved)' : ' (stayed)')).join(', ')}</div>` : ''}</div>` : '';
  dialog(`<h2>Trade deadline recap</h2>${head}${r.list.length ? `<p class="muted" style="margin-top:-4px">${r.list.length} deal${r.list.length > 1 ? 's' : ''} in the final two weeks.</p>${r.list.map(x => `<div class="panel" style="margin-bottom:8px"><div>${tlabel(x.a)} get ${esc(x.aGets)}</div><div>${tlabel(x.b)} get ${esc(x.bGets)}</div>${x.why ? `<div class="muted" style="font-size:12px">${esc(x.why.split('. ')[0])}</div>` : ''}</div>`).join('')}` : '<p>A quiet deadline: no deals in the final two weeks.</p>'}<div class="row"><button class="primary" id="x-close">Close</button></div>`);
  $('#x-close').onclick = closeDialog;
}
function revealDialog() {
  const r = L.revealMine; if (!r) return;
  const sc = L.teams[L.user].scout;
  const rows = r.list.map(x => { const p = L.players[x.pid]; if (!p) return ''; const d = x.ovr - x.read; const v = d >= 4 ? `<span class="w">Steal: ${d} better than we thought</span>` : d <= -4 ? `<span class="lo">Bust risk: ${-d} worse than we thought</span>` : d > 0 ? `<span class="w">A bit better (+${d})</span>` : d < 0 ? `<span class="lo">A bit worse (${d})</span>` : 'Right on the read';
    return `<tr><td class="l">${plink(p)}</td><td class="l">${esc(x.how)}</td><td>${x.read}</td><td><strong>${x.ovr}</strong></td><td class="l">${v}</td></tr>`; }).join('');
  dialog(`<h2>Rookie ratings revealed</h2><p class="muted" style="margin-top:-4px">Summer league is over. Real ratings vs ${sc ? esc(sc.name) + "'s" : 'your director\'s'} read.</p><div class="tblwrap"><table><thead><tr><th class="l">Player</th><th class="l">How</th><th>Read</th><th>Real</th><th class="l">Verdict</th></tr></thead><tbody>${rows}</tbody></table></div><div class="row" style="margin-top:12px"><button class="primary" id="x-close">Close</button></div>`);
  $('#x-close').onclick = closeDialog;
}
function summerDialog() {
  const s = L.summer; if (!s || s.s !== L.season) return;
  const mine = s.lines.filter(x => isUser(x.tid)), P = id => L.players[id] ? plink(L.players[id]) : '—';
  const rv = ((L.reveals || {})[L.season] || []).filter(x => isUser(x.tid));
  const rvHtml = rv.length ? `<h3 style="margin-top:12px">Ratings revealed</h3><p class="muted" style="margin-top:-4px">Your rookies' real overall vs your director's read and the media's.</p><div class="tblwrap"><table><thead><tr><th class="l">Player</th><th>Pick</th><th>Your read</th><th>Media</th><th>Real</th></tr></thead><tbody>${rv.map(x => `<tr><td class="l">${P(x.pid)}</td><td>${x.pick}</td><td>${x.team != null ? x.team : '—'}</td><td>${x.media}</td><td><strong>${x.ovr}</strong> ${x.team != null && x.ovr !== x.team ? `<span class="${x.ovr > x.team ? 'w' : 'lo'}">(${x.ovr > x.team ? '+' : ''}${x.ovr - x.team})</span>` : ''}</td></tr>`).join('')}</tbody></table></div>` : '';
  const rows = (mine.length ? mine : s.lines.slice(0, 8)).map(x => `<tr><td class="l">${P(x.pid)}</td><td>${f1(x.pts)}</td><td>${f1(x.reb)}</td><td>${f1(x.ast)}</td><td class="l">${x.note}${x.boost ? ' · +1 growth' : ''}</td></tr>`).join('');
  dialog(`<h2>Summer league</h2><p class="muted" style="margin-top:-4px">MVP: ${P(s.mvp)}. ${mine.length ? 'Your young players' : 'Top performers'}, 5 games:</p><div class="tblwrap"><table><thead><tr><th class="l">Player</th><th>Pts</th><th>Reb</th><th>Ast</th><th class="l">Coach's note</th></tr></thead><tbody>${rows}</tbody></table></div><div class="row"><button class="primary" id="x-close">Close</button></div>`);
  $('#x-close').onclick = closeDialog;
}
function intlDialog() {
  const t = L.intl; if (!t || t.s !== L.season) return;
  const N = k => esc(NAT_NAME[k] || k);
  dialog(`<h2>International tournament</h2><p><strong>${N(t.champ)}</strong> win the title. MVP: ${L.players[t.mvp] ? plink(L.players[t.mvp]) : '—'}.</p>${t.rounds.map(r => `<h3>${r.r}</h3>${r.g.map(g => `<div>${g.w === g.a ? '<strong>' + N(g.a) + '</strong>' : N(g.a)} vs ${g.w === g.b ? '<strong>' + N(g.b) + '</strong>' : N(g.b)}</div>`).join('')}`).join('')}${t.hurt.length ? `<p class="muted">Injured in the tournament: ${t.hurt.map(id => L.players[id] ? plink(L.players[id]) : '').join(', ')}</p>` : ''}<div class="row"><button class="primary" id="x-close">Close</button></div>`);
  $('#x-close').onclick = closeDialog;
}
function draftGradesDialog() {
  const d = (L.draftGrades || {})[L.season]; if (!d) return;
  const P = id => L.players[id] ? plink(L.players[id]) : '—';
  const rows = Object.entries(d.teams).sort((a, b) => b[1].v - a[1].v).map(([tid, g]) => `<tr class="${isUser(+tid) ? 'mine' : ''}"><td class="l">${tlabel(+tid)}</td><td><strong>${g.g}</strong></td><td>${g.n}</td></tr>`).join('');
  dialog(`<h2>${draftLabel(L.season)} draft grades</h2><p class="muted" style="margin-top:-4px">Picks against the consensus mock. Early grades, often wrong.</p><div class="grid2e"><div><div class="tblwrap"><table><thead><tr><th class="l">Team</th><th>Grade</th><th>Picks</th></tr></thead><tbody>${rows}</tbody></table></div></div><div><h3>Steals</h3>${d.steals.map(x => `<div>${P(x.pid)} <span class="muted">#${x.slot} (mock #${x.mock}) · ${L.teams[x.tid].abbr}</span></div>`).join('') || '<p class="muted">None.</p>'}<h3 style="margin-top:10px">Reaches</h3>${d.reaches.map(x => `<div>${P(x.pid)} <span class="muted">#${x.slot} (mock #${x.mock}) · ${L.teams[x.tid].abbr}</span></div>`).join('') || '<p class="muted">None.</p>'}</div></div><div class="row"><button class="primary" id="x-close">Close</button></div>`, 'wide');
  $('#x-close').onclick = closeDialog;
}
// ---------- v11b: scouting reports, interviews, two-way, development reports ----------
const hideIntangibles = p => p.prospect && L.user != null && !commish();
const myInterview = p => L.user != null ? ((L.teams[L.user].interviews || {})[p.id] || null) : null;
function scoutReportHtml(p, full) {
  const r = scoutReport(L, L.user, p); if (!r) return '';
  const c = r.comp != null ? L.players[r.comp] : null;
  const flag = r.flag === 'bust' ? ' · <strong>Bust risk</strong>' : r.flag === 'bloom' ? ' · <strong>Late bloomer?</strong>' : '';
  const role = r.role.replace(/^a /, '').replace(/^an /, '');
  return `<div class="take"><div><strong>${esc(role[0].toUpperCase() + role.slice(1))}</strong> · ${r.lo}–${r.hi} (best guess ${r.est}) · confidence ${r.conf.toLowerCase()}${r.focus ? ' · watched closely' : ''}${flag}</div>
  <div class="muted">Strong: ${r.strengths.length ? r.strengths.join(', ') : '—'} · Weak: ${r.concerns.length ? r.concerns.join(', ') : '—'}${c ? ` · Plays like ${full ? plink(c) : esc(c.name)} (${c.ovr})` : ''}</div>${compsHtml(p)}</div>`;
}
// v34: pro scouting report (players outside your team, franchise mode)
function proScoutPanel(p) {
  if (L.user == null || commish()) return '';
  const r = proReport(L, L.user, p); if (!r) return '';
  const sd = (L.season * 31 + p.id) % 7, line = [fl('sc.pro', { name: p.name, role: r.role, lo: r.lo, hi: r.hi }, sd)];
  if (r.strengths.length) line.push(fl('sc.prostr', { list: r.strengths.join(' and ') }, sd + 1));
  if (r.concerns.length) line.push(fl('sc.prowk', { list: r.concerns.join(' and ') }, sd + 2));
  line.push(fl('sc.proconf', { conf: r.conf, why: r.why.join(', ') }, sd + 3));
  return `<section class="panel" style="margin-bottom:16px"><h3>Pro scouting report${r.by ? ' · ' + esc(r.by) : ''}</h3><div class="take"><div><strong>Our read: ${r.ovr}</strong> <span class="muted">(${r.lo}–${r.hi})</span></div><div class="muted">${line.map(esc).join(' ')}</div></div><p class="muted" style="margin:6px 0 0;font-size:12px">Ratings shown with ~ are your scouts' read. Box stats, age, size and contracts are exact. Add him to your watch list for a closer look.</p></section>`;
}
function scoutPanel(p) {
  if (!p.prospect || L.user == null || commish()) return '';
  const iv = myInterview(p), left = interviewsLeft(L, L.user), sc = L.teams[L.user].scout;
  return `<section class="panel" style="margin-bottom:16px"><h3>Scouting report${sc ? ' · ' + esc(sc.name) : ''}</h3>${scoutReportHtml(p, true)}
  <p style="margin:0" class="muted">${iv ? `Interview (${seasonName(iv.s)}): personality reads as ${esc(persShort({ pers: iv.pers }).toLowerCase())}; work ethic: ${esc(workLabel(iv.work).toLowerCase())}. Interviews can be wrong.${iv.tr ? ` Rough reads: ${['loy', 'mon', 'win', 'mot', 'cch'].filter(k => iv.tr[k] != null).map(k => `${TR_NAMES[k].toLowerCase()} ~${iv.tr[k]} (${esc(trWord(iv.tr[k]).toLowerCase())})`).join(', ')}.` : ''}` : `Not interviewed yet. ${left > 0 ? `<button class="sm" data-x="iv:${p.id}">Interview him</button> <span class="muted">${left} left this season</span>` : 'No interviews left this season.'}`}</p>
  ${L.teams[L.user].scoutAssign.length < assignMax(L, L.user) && !L.teams[L.user].scoutAssign.some(a => a.k === 'pid' && a.v === p.id) ? `<p style="margin:8px 0 0"><button class="sm" data-x="asg:pid:${p.id}">Assign your director to watch him</button></p>` : ''}</section>`;
}
// v21: D-league line for any player who played there this season; your players get an on/off switch
function dlPanel(p) {
  if (p.tw || p.team == null) return '';
  const d = p.dl && p.dl.s === L.season && p.dl.gp ? p.dl : null, mine = isUser(p.team), el = dlEligible(L, p) || p.dlOff;
  if (!d && !(mine && el)) return '';
  const pg = k => f1(d[k] / d.gp);
  return `<section class="panel" style="margin-bottom:16px"><h3>D-league</h3>${d ? `<p style="margin:0 0 6px">${d.gp} games · ${pg('min')} min · ${pg('pts')} pts · ${pg('reb')} reb · ${pg('ast')} ast</p>` : '<p class="muted" style="margin:0 0 6px">No D-league games yet this season.</p>'}<p class="muted" style="margin:0 0 6px;font-size:12px">Players in their first 3 seasons and anyone barely playing get a D-league game on days they don't play for the team. Those minutes count half toward his development.</p>${mine ? `<label class="check" style="margin:0"><input type="checkbox" data-x="dloff:${p.id}" ${p.dlOff ? '' : 'checked'}> Play him in the D-league on off days</label>` : ''}</section>`;
}
// v30a #13 UI: his answer when he turns a two-way offer down (kept until the day / phase changes, or he signs somewhere)
function twNoHtml(p) {
  const x = ui.twNo; if (!x || x.pid !== p.id || x.s !== L.season || x.ph !== L.phase || x.d !== L.day || p.tw || p.team != null) return '';
  const k = /standard contract \(his market/.test(x.msg) || /expects a standard contract/.test(x.msg) ? 'Offer him a standard contract on this page, or put someone else in the slot.' : 'Ask again after the next week of games.';
  return `<div class="msg no" id="tw-no" style="margin-top:8px"><strong>Turned down.</strong> ${esc(x.msg.replace(/^.*?turned down the two-way deal:\s*/, '').replace(/^./, c => c.toUpperCase()))}<div class="muted" style="margin-top:4px">${k}</div></div>`;
}
function twoWayPanel(p) {
  if (L.user == null) return dlPanel(p);
  if (!p.tw) { const d = dlPanel(p); if (d) return d; }
  if (p.tw && isUser(p.tw.tid)) {
    const d = p.dl && p.dl.s === L.season ? p.dl : null;
    return `<section class="panel" style="margin-bottom:16px"><h3>Two-way contract</h3><p style="margin:0 0 6px">${p.tw.games} of ${TW_GAMES} games with the team used. ${p.tw.games >= TW_GAMES ? 'He can only play in the development league now unless you convert him.' : ''} Not eligible for the playoffs unless converted.</p>${d ? `<p style="margin:0 0 6px">Development league: ${d.gp} games, ${f1(d.pts / d.gp)} pts, ${f1(d.reb / d.gp)} reb, ${f1(d.ast / d.gp)} ast in ${f1(d.min / d.gp)} min.</p>` : ''}
    <div class="row"><label class="check" style="margin:0"><input type="checkbox" data-x="twact:${p.id}" ${p.tw.active ? 'checked' : ''}> Dress him for team games</label><button class="sm primary" data-x="twconv:${p.id}">Convert to a standard contract</button><button class="sm" data-x="twrelc:${p.id}">Release</button></div><p class="muted" id="tw-msg" style="margin:6px 0 0"></p></section>`;
  }
  if (twEligible(L, p) && ['regular', 'off-fa', 'off-ready'].includes(L.phase)) {
    const n = (L.teams[L.user].twoWay || []).length;
    return `<section class="panel" style="margin-bottom:16px"><h3>Two-way option</h3><p style="margin:0 0 6px">He's eligible for a two-way deal: off the cap and the 15-man roster, up to ${TW_GAMES} regular-season games with you, the rest in the development league. You have ${2 - n} slot${2 - n === 1 ? '' : 's'} open.</p>${n < 2 ? `<button class="sm primary" data-x="twsign:${p.id}">Sign to a two-way deal</button>` : ''}${twNoHtml(p)}<p class="muted" id="tw-msg" style="margin:6px 0 0"></p></section>`;
  }
  return '';
}
function devReportHtml(r) {
  return `<p style="margin:0 0 6px">${esc(r.text)}${r.trend != null ? ` ${r.trend > 0 ? 'Up ' + r.trend : r.trend < 0 ? 'Down ' + -r.trend : 'No change'} since last season.` : ''} Could peak around ${r.peak[0] === r.peak[1] ? r.peak[0] : r.peak[0] + '–' + r.peak[1]}.</p><p style="margin:0" class="muted">Build on: ${r.strengths.join(', ')}. Work on: ${r.focus.join(', ')}.${r.work ? ' ' + r.work : ''}${r.dl ? ' ' + r.dl : ''}</p>`;
}
function devPanel(p) {
  if (L.user == null) return '';
  const tid = p.team != null ? p.team : p.tw ? p.tw.tid : null;
  if (!isUser(tid)) return '';
  const r = coachDevReport(L, p); if (!r) return '';
  return `<section class="panel" style="margin-bottom:16px"><h3>Development report${r.coach ? ' · coach ' + esc(r.coach) : ''}</h3>${devReportHtml(r)}<p class="muted" style="margin:6px 0 0;font-size:12px">The coach's read; better development coaches read players more accurately.</p></section>`;
}
function chemPanel(t) {
  const d = teamDuos(L, t), pctv = Math.min(100, d.avg / 3 * 100);
  return `<section class="panel"><h3>Team chemistry</h3><div class="k">Top 8 · average seasons together ${f1(d.avg)}</div>${meter(pctv, pctv >= 60 ? '' : pctv >= 30 ? 'warn' : 'bad')}${d.best.length ? `<div style="margin-top:6px">${d.best.map(x => `<div>${plink(x.a)} &amp; ${plink(x.b)} <span class="muted">${Math.floor(x.n)}+ season${x.n >= 2 ? 's' : ''}</span></div>`).join('')}</div>` : '<p class="muted" style="margin:6px 0 0">No established duos yet.</p>'}<p class="muted" style="margin:6px 0 0;font-size:12px">Starters who've played together for years get a small edge; a brand-new five a small penalty.</p></section>`;
}
// v30a #16: release a two-way player (team panel + player page). Two-way deals sit off the cap and the 15-man roster, so no dead money.
function twRelDialog(pid) {
  const p = L.players[pid]; if (!p || !p.tw || !isUser(p.tw.tid)) return;
  dialog(`<h2>Release ${esc(p.name)}?</h2><p>He leaves your two-way slot and goes to free agency. ${p.tw.games} of ${TW_GAMES} team games used. You can sign another two-way player into the open slot.</p><div class="row"><button class="primary" id="twr-ok">Release</button><button id="twr-no">Keep him</button></div>`);
  $('#twr-no').onclick = closeDialog;
  $('#twr-ok').onclick = () => { const n = p.name; releaseTwoWay(L, p); closeDialog(); save(); render(); alertMsg(n + ' released from his two-way deal.'); };
}
function twoWayTeamPanel(t) {
  const tws = twOf(L, t), mine = isUser(t.id);
  if (!tws.length && !mine) return '';
  return `<section class="panel" style="margin-top:16px"><h2>Two-way players</h2>${tws.length ? `<div class="tblwrap"><table><thead><tr><th class="l">Player</th><th>Age</th><th>Ovr</th><th title="Games with the team (max ${TW_GAMES})">Team G</th><th title="Development league games">DL G</th><th>DL Pts</th><th>DL Reb</th><th>DL Ast</th>${mine ? '<th></th>' : ''}</tr></thead><tbody>${tws.map(p => { const d = p.dl && p.dl.s === L.season && p.dl.gp ? p.dl : null; return `<tr><td class="l">${plink(p)} <span class="muted">${posLabel(p)}</span></td><td>${p.age}</td><td>${ovrTxt(p)}</td><td>${p.tw.games}/${TW_GAMES}</td><td>${d ? d.gp : 0}</td><td>${d ? f1(d.pts / d.gp) : '—'}</td><td>${d ? f1(d.reb / d.gp) : '—'}</td><td>${d ? f1(d.ast / d.gp) : '—'}</td>${mine ? `<td style="white-space:nowrap"><button class="sm" data-x="twconv:${p.id}">Convert</button> <button class="sm" data-x="twrelc:${p.id}">Release</button></td>` : ''}</tr>`; }).join('')}</tbody></table></div>` : `<p class="muted">No two-way players. Sign free agents 27 or younger with fewer than 3 seasons of service (a season counts at 10+ regular-season games) from their player page (up to 2).</p>`}<p class="muted" id="tw-msg" style="margin:6px 0 0"></p></section>`;
}
function devTeamPanel(t) {
  if (!isUser(t.id)) return '';
  const ps = [...rosterOf(L, t), ...twOf(L, t)].filter(p => p.age <= 25).map(p => ({ p, r: coachDevReport(L, p) })).filter(x => x.r).sort((a, b) => a.p.age - b.p.age);
  if (!ps.length) return '';
  return `<section class="panel" style="margin-top:16px"><h2>Development reports · coach ${esc(t.coach.name)}</h2><p class="muted" style="margin-top:-4px">Players 25 and under. Click a player for the full report.</p>${ps.map(({ p, r }) => `<div class="leader" style="grid-template-columns:minmax(0,1fr) auto"><span>${plink(p)} <span class="muted">${p.age} · ${ovrTxt(p)}${p.tw ? ' · two-way' : ''}</span> · ${esc(r.text.split('.')[0])}</span><span class="muted">peak ${r.peak[0] === r.peak[1] ? r.peak[0] : r.peak[0] + '–' + r.peak[1]}</span></div>`).join('')}</section>`;
}
// Draft tab: scouting assignments and interviews
function scoutingView(d) {
  const t = L.teams[L.user], sc = t.scout, as = t.scoutAssign || [];
  const pros = (L.classes[d] || []).map(id => L.players[id]).filter(Boolean);
  const natsInClass = [...new Set(pros.map(p => p.nat))];
  const desc = a => a.k === 'pid' ? (L.players[a.v] ? esc(L.players[a.v].name) : 'a prospect') : a.k === 'nat' ? 'prospects from ' + esc(NAT_NAME[a.v] || a.v) : 'all ' + POS[a.v] + ' prospects';
  const slots = as.map((a, i) => `<div class="leader" style="grid-template-columns:minmax(0,1fr) auto"><span>${desc(a)} <span class="muted">${assignReady(L, a) ? 'reports in' : L.phase === 'regular' ? 'reports in ' + Math.max(1, 14 - (L.day - a.d)) + ' game days' : 'starts next season'}</span></span><button class="sm" data-x="asgdel:${i}">Remove</button></div>`).join('');
  const add = as.length < assignMax(L, L.user) ? `<div class="row" style="margin-top:8px"><select id="asg-v" aria-label="What to scout"><optgroup label="Country">${natsInClass.map(n => `<option value="nat:${n}">${esc(NAT_NAME[n] || n)}</option>`).join('')}</optgroup><optgroup label="Position">${POS.map((x, i) => `<option value="pos:${i}">${x}</option>`).join('')}</optgroup></select><button class="sm primary" data-x="asgadd">Assign</button></div><p class="muted" style="margin:4px 0 0;font-size:12px">To watch one prospect closely, use the button on his player page.</p>` : '';
  const ivs = Object.entries(t.interviews || {}).map(([id, iv]) => ({ p: L.players[id], iv })).filter(x => x.p && x.p.prospect);
  const rows = pros.slice().sort((a, b) => teamPotEst(L, L.user, b).est - teamPotEst(L, L.user, a).est).slice(0, 30);
  return `<section class="panel"><h2>Scouting · ${sc ? esc(sc.name) + ' (draft ' + sc.rating + ', pro ' + (sc.pro != null ? sc.pro : sc.rating) + ')' : 'no director'}</h2>
  ${scoutDeptHtml(t)}

  ${recsHtml(false)}
  <h3>Assignments (${as.length}/${assignMax(L, L.user)})</h3>${slots || '<p class="muted">None.</p>'}${add}<p class="muted" id="asg-msg"></p>
  <h3 style="margin-top:14px">Interviews (${interviewsLeft(L, L.user)} left this season)</h3>${ivs.length ? ivs.map(({ p, iv }) => `<div class="leader" style="grid-template-columns:minmax(0,1fr) auto"><span>${plink(p)} <span class="muted">${draftLabel(p.draftYear)} class</span></span><span class="muted">${esc(persShort({ pers: iv.pers }))} · ${esc(workLabel(iv.work))}</span></div>`).join('') : '<p class="muted">None yet. Interview prospects from their player page or the list below.</p>'}</section>
  <section class="panel"><h2>Reports · ${draftLabel(d)} class (top 30 by his read)</h2>${rows.map(p => `<details class="about" style="margin:4px 0"><summary>${esc(p.name)} <span class="muted">${posLabel(p)} · ${p.age} · ${esc(NAT_NAME[p.nat] || '')}</span></summary>${scoutReportHtml(p, false)}<div class="row"><button class="sm" data-player="${p.id}">Player page</button>${!myInterview(p) && interviewsLeft(L, L.user) > 0 ? `<button class="sm" data-x="iv:${p.id}">Interview</button>` : myInterview(p) ? `<span class="muted">Interviewed: ${esc(persShort({ pers: myInterview(p).pers }))} · ${esc(workLabel(myInterview(p).work))}</span>` : ''}</div></details>`).join('')}</section>${draftAccHtml()}`;
}
// v34: scouting department level (staff budget) and how the mocks / your board did
function scoutDeptHtml(t) {
  const lv = t.scoutLv || 0, open = scoutWindow(L), room = staffRoom(L, t, 'dept');
  const opts = SCOUT_LV.map((x, i) => `<button class="sm ${i === lv ? 'primary' : ''}" ${open && i !== lv ? `data-x="slv:${i}"` : 'disabled'} title="${esc(x.n)}: reads ${Math.round((1 - x.k) * 100)}% tighter, ${x.slots} assignments, ${x.iv} interviews">${esc(x.n)} · ${x.cost ? money(x.cost) : 'included'}</button>`).join('');
  return `<div class="k" style="margin-top:4px">Department</div><div class="row" role="group" aria-label="Scouting department level" style="flex-wrap:wrap;gap:6px">${opts}</div><p class="muted" style="margin:4px 0 8px;font-size:12px">${esc(SCOUT_LV[lv].n)}: draft and pro reads ${lv ? Math.round((1 - SCOUT_LV[lv].k) * 100) + '% tighter, ' : ''}${SCOUT_LV[lv].slots} assignments, ${SCOUT_LV[lv].iv} interviews a season. Paid from the staff budget (room ${money(Math.max(0, room))}). ${open ? 'Changes take effect now.' : 'Changes open after the draft, before the season.'}</p><p class="muted" id="slv-msg"></p>`;
}
function draftAccHtml() {
  const A = draftAccuracy(L).slice(0, 8); if (!A.length) return '';
  const c = x => x ? `<td><strong>${x.r != null ? x.r.toFixed(2) : '—'}</strong> <span class="muted">${x.hit}/10</span></td>` : '<td class="muted">—</td>';
  return `<section class="panel"><h2>Mock drafts vs what players became</h2><p class="muted" style="margin-top:-4px">For each class two or more seasons back: rank correlation with peak rating so far (1.00 = perfect order), and how many of the list's top 10 are top 10 by peak. Outlet and board columns start with drafts held from this version on.</p><div class="tblwrap"><table><thead><tr><th class="l">Draft</th><th>Real order</th><th>Consensus</th>${OUTLETS.map(o => `<th title="${esc(o.name)}">${esc(o.short)}</th>`).join('')}<th title="Your scouting director's board on draft day">Your board</th><th class="l">Best so far</th></tr></thead><tbody>${A.map(r => `<tr><td class="l">${draftLabel(r.s)}</td>${c(r.pick)}${c(r.cons)}${c(r.o0)}${c(r.o1)}${c(r.o2)}${c(r.mine)}<td class="l">${L.players[r.best] ? plink(L.players[r.best]) : '—'}</td></tr>`).join('')}</tbody></table></div></section>`;
}
function recsHtml(inDialog) {
  if (L.user == null || !L.classes || !L.classes[L.season]) return '';
  const r = scoutRecs(L, L.user);
  if (!r.assign.length && !r.interview.length) return inDialog ? '<p class="muted">Nothing to recommend right now.</p>' : '';
  const sc = L.teams[L.user].scout;
  return `<div class="${inDialog ? '' : 'panel'}" style="${inDialog ? '' : 'margin:8px 0;background:var(--bg2, transparent)'}"><h3 style="margin-top:0">Scouting director recommendations</h3><p class="muted" style="margin:-4px 0 6px;font-size:12px">You're projected to pick around #${r.pick} in the ${draftLabel(L.season)} draft (${L.phase === 'regular' && L.day < 10 ? 'by preseason expectations' : 'by current record'}). These are his suggestions; a weaker director gives shakier advice.</p>
  ${r.assign.length ? `<div class="k" style="margin-top:6px">Assignments</div>${r.assign.map(a => `<div class="leader" style="grid-template-columns:minmax(0,1fr) auto;align-items:center"><span>${esc(a.why)}</span><button class="sm primary" data-x="asg:${a.k}:${a.v}">Assign</button></div>`).join('')}` : ''}
  ${r.interview.length ? `<div class="k" style="margin-top:8px">Interviews (${interviewsLeft(L, L.user)} left)</div>${r.interview.map(x => `<div class="leader" style="grid-template-columns:minmax(0,1fr) auto;align-items:center"><span>${esc(x.why)}</span><button class="sm" data-x="iv:${x.pid}">Interview</button></div>`).join('')}` : ''}</div>`;
}
function scoutPromptDialog() {
  dialog(`<h2>Scouting check-in</h2>${recsHtml(true)}<div class="row" style="margin-top:12px"><button class="primary" id="sp-open">Open scouting</button><button id="x-close">Not now</button></div>`);
  $('#sp-open').onclick = () => { closeDialog(); ui.dpage = 'scout'; location.hash = '#draft'; render(); };
  $('#x-close').onclick = closeDialog;
}
function maybeScoutPrompt() {
  if (L.user == null || commish() || L.jobless || L.phase !== 'regular' || L.day < 1) return;
  const key = L.season + (L.day >= deadlineDay(L) ? ':deadline' : ':start');
  if (L.scoutPrompt === key) return;
  const r = scoutRecs(L, L.user); L.scoutPrompt = key;
  if (r.assign.length || r.interview.length) queueDialog(scoutPromptDialog);
}
function xAction(v, el) {
  const inModal = !!(el && $('#modal').contains(el) && $('#ov'));
  const [k, a, b] = v.split(':');
  const msg = (sel, m) => { const el = $(sel); if (m && el) el.textContent = m; };
  if (k === 'iv') { const m = interview(L, L.user, +a); if (m) { alertMsg(m); return; } }
  else if (k === 'asg') { setAssign(L, L.user, (L.teams[L.user].scoutAssign || []).length, { k: a, v: a === 'nat' ? b : +b }); }
  else if (k === 'asgdel') { setAssign(L, L.user, +a, null); }
  else if (k === 'slv') { const m = setScoutLv(L, L.user, +a); if (m) { msg('#slv-msg', m); return; } }   // v34
  else if (k === 'asgadd') { const [kk, vv] = $('#asg-v').value.split(':'); setAssign(L, L.user, (L.teams[L.user].scoutAssign || []).length, { k: kk, v: kk === 'pos' ? +vv : vv }); }
  else if (k === 'twsign') { const m = signTwoWay(L, L.players[+a], L.user);
    if (m) { if (/turned down the two-way deal/.test(m)) { ui.twNo = { pid: +a, msg: m, s: L.season, ph: L.phase, d: L.day }; save(); render(); } else msg('#tw-msg', m); return; }   // v30a #13 UI: refusals stay on the panel with his reason
    ui.twNo = null; }
  else if (k === 'twconv') { const m = convertTwoWay(L, L.players[+a]); if (m) { msg('#tw-msg', m); return; } }
  else if (k === 'twrel') { releaseTwoWay(L, L.players[+a]); }
  else if (k === 'twrelc') { twRelDialog(+a); return; }
  else if (k === 'twact') { const p = L.players[+a]; if (p.tw) p.tw.active = !p.tw.active; }
  else if (k === 'dloff') { const p = L.players[+a]; p.dlOff = !p.dlOff; }
  save(); render(); if (inModal) scoutPromptDialog();
}
function alertMsg(m) { dialog(`<p>${esc(m)}</p><div class="row"><button class="primary" id="am-ok">OK</button></div>`); $('#am-ok').onclick = closeDialog; }
function agentLine(p) {
  const a = agentOf(L, p); if (!a || p.prospect) return '';
  return `Agent: <a class="lk" data-agent="${a.id}">${esc(a.name)}</a> <span class="muted">(${esc(agKind(a).label.toLowerCase())}, ${a.style})</span> · `;
}

// ===== v26.1 (Sonnet): odds names, favorites, season review, negotiation extras, contract extras =====
function oddName(x) {
  if (!x) return '—';
  if (x.pid != null && L.players[x.pid]) return plink(L.players[x.pid]) + (x.tid != null ? ' <span class="muted">' + esc(L.teams[x.tid].abbr) + '</span>' : '');
  if (x.cid != null) { const c = findCoach(L, x.cid); return (c ? clink(c) : '—') + (x.tid != null ? ' <span class="muted">' + esc(L.teams[x.tid].abbr) + '</span>' : ''); }
  if (x.tid != null) return tlabel(x.tid);
  return '—';
}
const oddKey = x => x ? (x.pid != null ? 'p' + x.pid : x.cid != null ? 'c' + x.cid : 't' + x.tid) : '';
const pctTxt = p => p >= 0.995 ? '99%' : p < 0.005 ? '<1%' : Math.round(p * 100) + '%';
const FAV_CATS = [['title', 'Title'], ['mvp', 'MVP'], ['dpoy', 'Defensive POY'], ['roy', 'Rookie of the Year'], ['smoy', 'Sixth Man'], ['mip', 'Most Improved'], ['coy', 'Coach of the Year']];
function favoritesBox() {
  const S = L.season; let o; try { o = seasonOdds(L); } catch (e) { return ''; } if (!o) return '';
  const pre = L.odds && L.odds[S] && L.odds[S].pre, live = !!(pre && L.odds[S].live && pre !== o);
  const preP = (k, x) => { const y = pre && pre[k] ? pre[k].find(z => oddKey(z) === oddKey(x)) : null; return y ? y.p : 0; };
  const panel = ([k, n]) => { const a = (o[k] || []).slice(0, 5);
    return `<div class="panel"><h3>${n}</h3>${a.length ? a.map((x, i) => `<div class="leader"><span class="muted">${i + 1}</span><span>${oddName(x)}</span><span class="v" title="Chance ${pctTxt(x.p)}${live ? '; preseason ' + pctTxt(preP(k, x)) : ''}">${esc(x.odds)} <span class="muted">${pctTxt(x.p)}</span></span></div>`).join('') : `<p class="muted">${k === 'roy' ? 'No rookies yet.' : 'No favorites yet.'}</p>`}${live && a[0] ? `<p class="muted" style="margin:4px 0 0">Preseason: ${oddName(pre[k] && pre[k][0])} ${pre[k] && pre[k][0] ? esc(pre[k][0].odds) : ''}</p>` : ''}</div>`; };
  return `<h3 style="margin:8px 0">Favorites${live ? ' <span class="muted">(updated to the standings)</span>' : ''}</h3><div class="grid3 favs" style="margin-bottom:16px">${FAV_CATS.map(panel).join('')}</div>`;
}
function seasonReviewDialog(S) {
  S = S == null ? L.season : S; if (S === L.season) todoSeen('review');
  const h = (L.history || []).find(x => x.s === S), A = (L.awards || {})[S] || {}; if (!h && !A.mvp && !(S === L.season && L.po && L.po.champion != null)) return;
  const ov = oddsVsResult(L, S), ch = h && h.champion != null ? h.champion : S === L.season && L.po ? L.po.champion : null;
  if (ov && ch != null && ov.title && ov.title.won == null) { const pt = L.odds[S].pre.title.find(x => x.tid === ch); ov.title = { fav: ov.title.fav, won: ch, pWon: pt ? pt.p : 0 }; }
  const winName = (k, id) => k === 'title' || k === 'coy' ? (id != null ? tlabel(id) : '—') : (L.players[id] ? plink(L.players[id]) : '—');
  const row = ([k, n]) => { const r = ov && ov[k]; if (!r || r.won == null) return ''; const upset = r.pWon < 0.1, wonFav = r.fav && oddKey(r.fav) === (k === 'title' || k === 'coy' ? 't' + r.won : 'p' + r.won);
    return `<tr><td class="l">${n}</td><td class="l">${winName(k, r.won)}</td><td>${pctTxt(r.pWon)}</td><td class="l">${oddName(r.fav)} <span class="muted">${r.fav ? pctTxt(r.fav.p) : ''}</span></td><td class="l">${wonFav ? '<span class="w">Favorite won</span>' : upset ? '<span class="lo">Upset</span>' : '<span class="muted">Not the favorite</span>'}</td></tr>`; };
  const rows = ov ? FAV_CATS.map(row).join('') : '';
  const jl = (L.jerseys || []).filter(j => j.s === S), hf = (L.hof || []).filter(x => x.s === S);
  dialog(`<h2>${seasonName(S)} season review</h2>${ch != null ? `<p><strong>${esc(tname(ch))}</strong> won the title${h && h.runnerUp != null ? ' over ' + esc(tname(h.runnerUp)) : A.runnerUp != null ? ' over ' + esc(tname(A.runnerUp)) : ''}.</p>` : ''}
  ${rows ? `<div class="tblwrap"><table><thead><tr><th class="l">Award</th><th class="l">Winner</th><th title="Preseason chance of the winner">Chance</th><th class="l">Preseason favorite</th><th class="l"></th></tr></thead><tbody>${rows}</tbody></table></div>` : '<p class="muted">No preseason odds were saved for this season.</p>'}
  ${jl.length ? `<h3>Retired numbers</h3>${jl.map(j => `<div>${tlabel(j.tid)}: #${j.num} ${L.players[j.pid] ? plink(L.players[j.pid]) : esc(j.name)}</div>`).join('')}` : ''}
  ${hf.length ? `<h3>Hall of Fame class</h3>${hf.map(x => `<div>${L.players[x.pid] ? plink(L.players[x.pid]) : esc(x.name)}</div>`).join('')}` : ''}
  <div class="row" style="margin-top:12px"><button class="primary" id="x-close">Close</button></div>`, 'wide');
  $('#x-close').onclick = closeDialog;
}
// negotiation state lives in ui.neg[pid]: { amt, yrs, opt, incs:[{k,amt}], kick, eto, gtd, role, ntc }
function readNeg(pid) {
  const n = Object.assign({}, ui.neg[pid] || {}), v = id => { const e = document.getElementById(id); return e ? e.value : null; };
  if (v('neg-amt') != null) n.amt = parseFloat(v('neg-amt')); if (v('neg-yrs') != null) n.yrs = +v('neg-yrs'); if (v('neg-opt') != null) n.opt = v('neg-opt') || '';
  const rows = [...document.querySelectorAll('[data-incrow]')]; if (document.getElementById('neg-amt')) n.incs = rows.map(r => ({ k: r.querySelector('.neg-ik').value, amt: parseFloat(r.querySelector('.neg-ia').value) || 0 }));
  if (v('neg-kick') != null) n.kick = +v('neg-kick'); if (v('neg-eto') != null) n.eto = +v('neg-eto') || 0; if (v('neg-gtd') != null) n.gtd = +v('neg-gtd'); if (v('neg-role') != null) n.role = v('neg-role');
  const c = document.getElementById('neg-ntc'); if (c) n.ntc = c.checked;
  const mc = document.getElementById('neg-mle'); if (mc && !mc.disabled) n.mle = mc.checked;   // v32d
  if (n.yrs < 3) n.eto = 0; if (n.yrs < 2) n.gtd = 1;
  return n;
}
function extrasOf(n) {
  const x = {}, inc = (n.incs || []).filter(i => i.amt > 0).map(i => ({ k: i.k, amt: i.amt }));
  if (inc.length) x.incs = inc; if (n.kick > 0) x.kick = n.kick; if (n.eto > 0 && n.yrs >= 3) x.eto = n.eto; if (n.gtd != null && n.gtd < 1 && n.yrs >= 2) x.gtd = n.gtd;
  if (n.mle === false) x.mle = false;   // v32d: default = spend the mid-level when the deal can use it
  if (n.role) x.role = ROLE_BY[n.role] ? { k: n.role } : n.role === 'S' ? { k: 'starter' } : { k: 'min', v: +n.role };   // v32b: ROLES keys if (n.ntc) x.ntc = true;
  return x;
}
function negExtras(p, type, n) {
  const ntc = NTC_ELIGIBLE(p), incs = n.incs || [], yrs = n.yrs || 1, cap = Math.round((n.amt || 0) * 0.25 * 10) / 10, tot = incs.reduce((a, i) => a + (i.amt || 0), 0), t = L.teams[L.user];
  const sel = (id, opts, cur, title) => `<label title="${esc(title || '')}">${opts.label}<select id="${id}" data-negf="1">${opts.o.map(([v, l]) => `<option value="${v}" ${String(v) === String(cur) ? 'selected' : ''}>${l}</option>`).join('')}</select></label>`;
  const incRows = incs.map((i, ix) => { const lk = incLikely2(L, p, t, i.k); return `<div class="row" data-incrow="${ix}" style="margin:4px 0;align-items:center"><select class="neg-ik" data-negf="1">${INC_KINDS.map(k => `<option value="${k}" ${i.k === k ? 'selected' : ''}>if he ${INC_LABEL[k]}</option>`).join('')}</select><label>$M <input type="number" class="neg-ia" data-negf="1" min="0" step="0.1" value="${i.amt || 0}" style="width:70px"></label><span class="muted" title="How likely he thinks it is. 50% or more counts on the cap.">${Math.round(lk * 100)}%${lk >= 0.5 ? ' · on the cap' : ''}</span><button data-incdel="${ix}" data-pid="${p.id}" title="Remove">✕</button></div>`; }).join('');
  const incWorth = incs.reduce((a, i) => a + (i.amt || 0) * incLikely2(L, p, t, i.k), 0);
  return `<div style="flex-basis:100%"><div class="muted" style="margin:6px 0 2px">Incentives: paid in cash only if earned. Total up to 25% of salary (${money(cap)}); now ${money(tot)}${tot > cap + 0.05 ? ' <span class="lo">(over, extra is trimmed)</span>' : ''}${incs.length ? ` · worth about ${money(incWorth)} to him` : ''}.</div>${incRows}<button data-incadd="${p.id}" ${incs.length >= 5 ? 'disabled' : ''}>+ Add incentive</button></div>
  ${sel('neg-kick', { label: 'Trade kicker ', o: [[0, 'None'], [0.05, '5%'], [0.1, '10%'], [0.15, '15%']] }, n.kick || 0, 'First time he is traded his salary rises by this share. He takes less per year for it.')}
  ${yrs >= 3 ? sel('neg-eto', { label: 'Early opt-out ', o: [[0, 'None']].concat(Array.from({ length: yrs - 1 }, (_, i) => [i + 1, 'after year ' + (i + 1)])) }, n.eto || 0, 'He can leave after that year if he is worth more. He takes about 4% less.') : ''}
  ${yrs >= 2 ? sel('neg-gtd', { label: 'Final-year guarantee ', o: [[1, 'Full'], [0.75, '75%'], [0.5, '50%'], [0.25, '25%']] }, n.gtd != null ? n.gtd : 1, 'How much of the last year you owe if you release him. Less than full asks for a bit more money.') : ''}
  ${(() => { const er = expRole(L, t, p), pk = ROLE_BY[n.role] ? n.role : er, s0 = sel('neg-role', { label: 'Role ', o: [['', `Coach decides (likely ${roleName(er)}, ${roleRange(er)} min)`]].concat(ROLES.map(r => [r.k, `Promise: ${r.n} (${r.lo}-${r.hi} min)`])) }, ROLE_BY[n.role] ? n.role : '', 'The role you offer. A promised role is a floor the coach keeps: he takes less for a bigger role than he would get anyway and wants more (or refuses) for a smaller one. Break it and his mood drops.'); return s0 + `<div class="muted" style="flex-basis:100%;font-size:12px">${ROLE_BY[n.role] ? 'You promise' : 'Coach would likely use him as'}: <strong>${esc(roleName(pk))}</strong>, ${roleMinTxt(pk)}.</div>`; })()}
  ${ntc ? `<label class="check" style="margin:0" title="He must approve any trade. He takes about 5% less for it."><input type="checkbox" id="neg-ntc" data-negf="1" ${n.ntc ? 'checked' : ''}> No-trade clause</label>` : ''}`;
}
// contract extras: one line each, for the tooltip and the player page
function contractExtras(p) {
  const c = p.contract; if (!c) return [];
  const out = [], S = L.season;
  for (const x of incsOf(c)) out.push(`Incentive ${money(x.amt)} if he ${INC_LABEL[x.k] || x.k}: ${x.paid === S || x.paid ? '✓ paid' : x.lk ? 'likely (on the cap)' : 'unlikely (off the cap)'}`);
  if (c.kick > 0) out.push(`Trade kicker ${Math.round(c.kick * 100)}%: ${c.kicked ? 'used' : 'unused'}`);
  if (c.eto) out.push(`Early opt-out after ${seasonName(c.eto)}`);
  if (c.gtd != null && c.gtd < 1) out.push(`Final-year guarantee ${Math.round(c.gtd * 100)}%`);
  if (c.role) { const st = promiseState(L, p), lab = ROLE_BY[c.role.k] ? roleName(c.role.k).toLowerCase() + ' role (' + roleRange(c.role.k) + ' min)' : c.role.k === 'starter' ? 'start' : 'play ' + c.role.v + ' min'; out.push(`Promise: ${lab}: ${st === 'kept' ? 'Kept' : st === 'failing' ? 'At risk' : st === 'broken' ? 'Broken this season' : 'not yet judged'}`); }
  if (c.ntc) out.push('No-trade clause');
  return out;
}
function negExtrasOld(p, type, n) {
  const ntc = NTC_ELIGIBLE(p);
  return `<label title="Paid in cash only if earned; not on the cap. Up to 25% of the salary.">Incentive ($M) <input type="number" id="neg-inc" min="0" step="0.1" value="${n.inc || 0}" style="width:70px"></label><label>if he <select id="neg-inck">${Object.entries(INC_LABEL).map(([k, v]) => `<option value="${k}" ${n.incK === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label>${ntc ? `<label class="check" style="margin:0" title="He must approve any trade. He takes about 5% less for it."><input type="checkbox" id="neg-ntc" ${n.ntc ? 'checked' : ''}> No-trade clause</label>` : ''}`;
}
function agentDialog(id) {
  const a = (L.agents || []).find(x => x.id === id); if (!a) return;
  const cl = Object.values(L.players).filter(p => p.agent === id && !p.retired && !p.prospect).sort((x, y) => y.ovr - x.ovr);
  const K = agKind(a), tm = ids => (ids || []).map(id => L.teams[id] ? esc(L.teams[id].abbr) : '').filter(Boolean).join(', ');
  const stars = cl.filter(p => p.ovr >= 78).length;
  dialog(`<h2>Agent: ${esc(a.name)}</h2><p><strong>${esc(K.label)}</strong> · ${cl.length} clients (range ${K.lo}-${K.hi})${stars ? ` · ${stars} star${stars > 1 ? 's' : ''}` : ''}</p><p>${esc(K.txt)}.</p><p>${esc(AGENT_STYLE[a.style].txt)}.</p>${a.kind === 'power' ? `<p class="muted">Steers clients toward ${tm(a.fav) || '—'}; feuding with ${tm(a.feud) || '—'}.</p>` : ''}<h3>Clients · ${cl.length}</h3><div class="tblwrap"><table><thead><tr><th class="l">Player</th><th class="l">Team</th><th>Ovr</th><th>Contract</th></tr></thead><tbody>${cl.slice(0, 40).map(p => `<tr><td class="l">${plink(p)}</td><td class="l">${p.team != null ? tlabel(p.team) : 'FA'}</td><td>${ovrTxt(p)}</td><td>${contractCell(p)}</td></tr>`).join('')}</tbody></table></div><div class="row"><button class="primary" id="x-close">Close</button></div>`, 'wide');
  $('#x-close').onclick = closeDialog;
}
function holdoutDialog() {
  const ids = (L.holdouts || []).filter(id => L.players[id] && L.players[id].holdout); if (!ids.length) return;
  const p = L.players[ids[0]], t = holdoutTerms(L, p);
  dialog(`<h2>Holdout: ${esc(p.name)}</h2><p>His agent says he's underpaid (${money(p.contract.amt)}/yr; market value about ${money(p.mval)}). He'll sit out up to 15 games and his mood drops unless you give him a new deal.</p><div class="row"><button class="primary" id="ho-pay">Pay him: ${money(t.amt)} × ${t.yrs} yrs</button><button id="ho-firm">Hold firm</button></div><p class="muted" id="ho-msg"></p>`);
  $('#ho-pay').onclick = () => { const m = resolveHoldout(L, p.id, true); if (m) { $('#ho-msg').textContent = m; return; } save(); closeDialog(); render(); if ((L.holdouts || []).length) queueDialog(holdoutDialog); };
  $('#ho-firm').onclick = () => { resolveHoldout(L, p.id, false); save(); closeDialog(); render(); if ((L.holdouts || []).length) queueDialog(holdoutDialog); };
}
// v15: hidden prospect ratings. In franchise mode you see your director's read (marked ?) until summer league; commissioners see the truth.
function scoutPill(p) { return (p.tour === L.season && !p.retired ? ' <span class="pill" title="Farewell tour: he retires after this season">Final season</span>' : '') + (p.team == null && isRFA(L, p) ? ` <span class="pill" style="background:#e7eefb;color:#2f5d9e" title="Restricted: ${esc(L.teams[p.rfa.tid].abbr)} can match any offer sheet within 2 days">Restricted · ${esc(L.teams[p.rfa.tid].abbr)}</span>` : '') + L.user != null && hiddenFor(L, p) && !p.prospect ? ' <span class="pill" style="background:#fff3d6;color:#8a5a00" title="Rookie: ratings are scouting reads until summer league (after free agency). His real rating may be higher or lower.">Rookie · not final</span>' : ''; }
function ovrNum(p) { return L.user != null && hiddenFor(L, p) ? ovrRead(L, L.user, p) : L.user != null && proFogOn(L, L.user, p) ? proOvr(L, L.user, p) : p.ovr; }   // v35b: sort / filter by your scouts' read (same number the cell shows); own players exact
function ovrTxt(p) { return L.user != null && hiddenFor(L, p) ? `${ovrRead(L, L.user, p)}<span class="rdq" title="Your scouting director's read. Real ratings are revealed after summer league.">?</span>` : L.user != null && proFogOn(L, L.user, p) ? `${proOvr(L, L.user, p)}<span class="rdq" title="Your pro scouts' read (about ±${Math.max(1, Math.round(proSd(L, L.user, p) * 1.3))}). Only your own players' ratings are exact.">~</span>` : p.ovr; }
function attrNum(p, k) { return L.user != null && hiddenFor(L, p) ? attrRead(L, L.user, p, k) : L.user != null ? proAttr(L, L.user, p, k) : p[k]; }   // v34: pro fog for players outside your team
// v16: plain labels for what moves his price (+ raises it, - lowers it)
function negLabels(p, t, type) {
  const out = [], d = p.dem || 1, ag = agentOf(L, p);
  if (d >= 1.04) out.push(['In demand (archetype)', 1]); else if (d <= 0.96) out.push(['Crowded market', -1]);
  if (ag && ag.style === 'tough') out.push(['Tough agent', 1]); if (ag && ag.style === 'loyal' && (type !== 'signing')) out.push(['Agent favors re-signing', -1]);
  if (ag && ag.kind === 'power') { out.push(['Power-broker agent', 1]); if ((ag.fav || []).includes(t.id)) out.push(['Agent likes your team', -1]); else if ((ag.feud || []).includes(t.id)) out.push(['Agent feuding with your team', 1]); }
  if (ag && ag.kind === 'boutique') { const ap = agentAppeal(L, p, t); out.push(ap > 1 ? ['Boutique agent: clear role here', -1] : ap < 1 ? ['Boutique agent: crowded at his spot', 1] : ['Boutique agent: role and fit first', 0]); }
  if (ag && ag.kind === 'youth' && type === 'extension' && p.contract && p.contract.type === 'rookie') out.push(['Youth agent: first-extension discount', -1]);
  if (p.accPrem >= 5) out.push(['Accolades', 1]); if (superOK(L, p)) out.push(['Supermax eligible', 1]);
  if (p.pers === 'Money') out.push(['Money-first', 1]);
  if (p.pers !== 'Money' && t.market >= 3) out.push(['Big market appeal', -1]); else if (p.pers !== 'Money' && t.market <= 1 && !(p.fame >= 50)) out.push(['Small market', 1]);
  if (p.ovr >= 76 && !rosterOf(L, t).some(x => x.id !== p.id && x.ovr > p.ovr)) out.push(['Featured role', -1]);
  if (p.pers === 'Winner') out.push(t.mode === 'contend' ? ['Contender (wants to win)', -1] : t.mode === 'tank' || t.mode === 'rebuild' ? ['Wants to win', 1] : ['Wants to win', 0]);
  if (p.pers === 'Mentor' && (wantsMentor(L, t) || (p.team === t.id && youngTeam(L, t)))) out.push(['Young team to mentor', -1]);
  if (p.pers === 'Loyal' && (type !== 'signing' || p.lastTeam === t.id)) out.push(['Hometown discount', -1]);
  if (familyOn(L, p, t)) out.push(['Family here', -1]);
  if (grudgeVs(L, p, t.id)) out.push(['Holds a grudge', 1]);
  for (const n of signConcerns(L, p, t, type).notes) { if (/minutes|bigger role/i.test(n)) out.push(['Wants minutes', 1]); else if (/Happy here/.test(n)) out.push(['Happy here', -1]); else if (/Unhappy/.test(n)) out.push(['Unhappy here', 1]); else if (/contend/i.test(n) && p.pers !== 'Winner') out.push(['Veteran wants to contend', 1]); }
  if (p.prefY) out.push([`Prefers ${p.prefY} yr`, 0]);
  return out;
}
function cannotQuote(type) { return type === 'extension' && false; }
// v15: archetype demand note
function demNote(p) { const d = p.dem || 1; if (Math.abs(d - 1) < 0.04) return ''; return ` <span class="tipword" title="${d > 1 ? 'Many teams need his archetype and few players like him are available' : 'Plenty of players like him are available and few teams need one'}, so his price is ${d > 1 ? 'up' : 'down'} about ${Math.round(Math.abs(d - 1) * 100)}%.">${d > 1 ? 'In demand' : 'Crowded market'} (${d > 1 ? '+' : '−'}${Math.round(Math.abs(d - 1) * 100)}%)</span>`; }
// v16: pending free-agent offers
function faStatus(p) {
  if (L.phase !== 'off-fa' || p.team != null) return '';
  if (p.sheet) return `<div class="msg">${esc(p.name)} has signed an offer sheet with ${esc(L.teams[p.sheet.tid].abbr)} (${money(p.sheet.amt)}/yr × ${p.sheet.yrs}). ${p.rfa.tid === L.user ? `<button class="sm primary" data-rfa="${p.id}" data-ans="yes">Match</button> <button class="sm" data-rfa="${p.id}" data-ans="no">Let him go</button>` : `${esc(L.teams[p.rfa.tid].abbr)} can match.`}</div>`;
  const rfaNote = isRFA(L, p) && p.rfa.tid !== L.user ? `<p class="muted" style="margin:6px 0 0">Restricted free agent: if he accepts your offer it becomes an offer sheet, and ${esc(L.teams[p.rfa.tid].abbr)} can match it within 2 days.</p>` : '';
  const o = (L.faOffers || {})[p.id], b = (L.faBids || {})[p.id], star = (p.fame || 0) >= 60 || p.ovr >= 78;
  const talk = p.faTalk ? `<div class="msg"><strong>${esc(p.name)} wants to talk.</strong> He'll sign for ${money(p.faTalk.amt)}/yr over ${p.faTalk.yrs} yr. <button class="sm primary" data-fatalk="${p.id}" data-ans="yes">Accept</button> <button class="sm" data-fatalk="${p.id}" data-ans="no">Walk away</button> <span class="muted">Or send a new offer above. He waits one day.</span></div>` : '';
  const line = o ? `<p style="margin:6px 0 0"><strong>Your offer:</strong> ${money(o.amt)}/yr for ${o.yrs} yr, pending (holds that much of your cap room). ${b ? `He has ${b.n} offer${b.n > 1 ? 's' : ''}${b.best > 0 && b.uSc >= 0 && b.uSc < b.best ? ' · <span class="lo">your offer is below his best one</span>' : b.best > 0 ? ' · your offer is his best so far' : ''}.` : 'He decides once teams have made their offers.'} ${star ? 'Stars can wait up to 5 days.' : 'He decides within 2 days.'} <button class="sm" data-fawd="${p.id}">Withdraw</button></p>` : b && b.n ? `<p class="muted" style="margin:6px 0 0">He has ${b.n} offer${b.n > 1 ? 's' : ''} from other teams.</p>` : '';
  return rfaNote + talk + line;
}
function faInboxDialog() {
  ui.faQ = false; const ev = (L.faInbox || []).filter(e => L.players[e.pid]); L.faInbox = []; if (!ev.length) return;
  const P = id => plink(L.players[id]), T = id => id != null ? esc(L.teams[id].abbr) : '—';
  const row = e => e.k === 'signed' ? `<div class="leader" style="grid-template-columns:minmax(0,1fr) auto"><span>✔ ${P(e.pid)} signed with you: ${e.terms ? `${e.terms.yrs} yr, ${money(e.terms.amt)}/yr` : ''}</span></div>`
    : e.k === 'lost' ? `<div class="leader" style="grid-template-columns:minmax(0,1fr) auto"><span>✖ ${P(e.pid)} ${e.tid != null ? `signed with ${T(e.tid)}` : 'turned down your offer'}${e.why ? ` <span class="muted">(${esc(e.why)})</span>` : ''}</span></div>`
    : e.k === 'talk' ? `<div class="leader" style="grid-template-columns:minmax(0,1fr) auto"><span>💬 ${P(e.pid)} wants to talk: ${e.terms ? `${money(e.terms.amt)}/yr for ${e.terms.yrs} yr` : ''} <span class="muted">(${esc(e.why)})</span> <button class="sm primary" data-fatalk="${e.pid}" data-ans="yes">Accept</button> <button class="sm" data-fatalk="${e.pid}" data-ans="no">Walk away</button></span></div>`
    : e.k === 'sheet' ? `<div class="leader" style="grid-template-columns:minmax(0,1fr) auto"><span>📝 ${P(e.pid)} signed an offer sheet with ${T(e.tid)}: ${money(e.terms.amt)}/yr × ${e.terms.yrs}. Match it? You have 2 days. <button class="sm primary" data-rfa="${e.pid}" data-ans="yes">Match</button> <button class="sm" data-rfa="${e.pid}" data-ans="no">Let him go</button></span></div>`
    : e.k === 'sheetSent' ? `<div class="leader" style="grid-template-columns:minmax(0,1fr) auto"><span>📝 ${P(e.pid)} signed your offer sheet (${money(e.terms.amt)}/yr × ${e.terms.yrs}); ${T(e.tid)} can match</span></div>`
    : e.k === 'matched' ? `<div class="leader" style="grid-template-columns:minmax(0,1fr) auto"><span>✖ ${T(e.tid)} matched your offer sheet for ${P(e.pid)}</span></div>`
    : e.k === 'sheetWon' ? `<div class="leader" style="grid-template-columns:minmax(0,1fr) auto"><span>✔ ${P(e.pid)} is yours: his team didn't match (${money(e.terms.amt)}/yr × ${e.terms.yrs})</span></div>`
    : `<div class="leader" style="grid-template-columns:minmax(0,1fr) auto"><span>… ${P(e.pid)} is still deciding <span class="muted">(${esc(e.why)})</span></span></div>`;
  const seen = new Set(), last = ev.slice().reverse().filter(e => !seen.has(e.pid) && seen.add(e.pid)).reverse();
  dialog(`<h2>Free agency · your offers</h2>${last.map(row).join('')}<div class="row" style="margin-top:12px"><button id="x-close">Close</button></div>`);
  $('#x-close').onclick = closeDialog;
}
// v24.4: "Why his ask is what it is": each part of the ask with its effect, and what the deal does to your payroll
// v24.5: the physical read, shown only while a signing or trade is being discussed
function physicalLine(p) { if (!p || p.prospect || commish()) return ''; const lv = traitLevel(p, 'ipt'), ph = physicalRead(p), h = injHistory(L, p); return `<span class="tipword" title="A physical moves the injury-proneness read forward one season, for this deal only.">Physical</span>: ${esc(p.name)} · ${esc(lv >= 2 ? iptText(p, 2) : ph)} · ${h.majors} major injur${h.majors === 1 ? 'y' : 'ies'}, ${h.missed} games missed (3 seasons)${p.injury > 0 ? ` · <span class="lo">out ${injGames(p)} more games</span>` : ''}`; }
function askWhy(p, t, q, payNow, ext) {
  const pct = x => (x >= 1 ? '+' : '') + Math.round((x - 1) * 100) + '%';
  const ag = agentOf(L, p), am = ag ? AGENT_STYLE[ag.style].ask * agKind(ag).ask : 1, ap = ag ? agentAppeal(L, p, t) : 1;
  const lines = [`Market value: ${money(p.mval || MINSAL)}`, `Demand for his type: ${pct(p.dem || 1)}`, `Agent: ${ag ? agKind(ag).label.toLowerCase() + ', ' + ag.style : 'none'} (${pct(am)})${ap !== 1 ? ` · agent's view of ${t ? esc(t.abbr) : 'this team'}: ${pct(1 / ap)}` : ''}`, `Personality: ${p.pers}${p.pers === 'Money' ? ' (+6%)' : ''}`];
  if (p.sprem && p.sprem > 1) lines.push(`Suitor premium: ${pct(p.sprem)} (${p.suitors} teams can make a real offer)`); else if (p.suitors != null) lines.push(`Suitor premium: none (${p.suitors} real suitors)`);
  if (winPrem(L, p) > 1) lines.push(`Recent winner: ${pct(winPrem(L, p))}`);
  if (p.age >= 33) lines.push('Age 33+: -10%');
  const amt = q && q.quote ? q.quote : p.ask || MINSAL, after = payNow + contractHit(amt, false), cs = ext ? L.season + 1 : capSeason(L);
  lines.push('', `${t.abbr} payroll after the deal: ${money(after)} (cap ${money(CAP)}, tax line ${money(TAXLINE)}, hard cap ${money(APRON)})`, `Luxury tax owed at that payroll: ${money(taxFor(L, t, after, cs))}${isRepeatTaxer(L, t, cs) ? ' (repeat payer rate)' : ''}`);
  if (t.owner) { const olim = ext ? t.owner.limit : ownerLimitFor(L, t, cs); lines.push(`Owner's spending limit (${seasonName(ext ? L.season : cs)}): ${money(olim)}${after > olim ? ' (this deal goes past it)' : ''}`); if (!ext && after > olim) { const oc = ownerCheck(L, amt, 0); lines.push(oc.ok ? (oc.allIn ? 'Owner is all in (title goal): approved' : 'Approved: you already promised a tougher goal') : oc.ask ? `Needs owner approval: promise "${oc.next.txt}"` : 'Owner will not approve: ' + oc.msg); } }
  return `<span class="tipword" title="${esc(lines.join('\n'))}">Why his ask is what it is</span>`;
}
function negotiatePanel(p) {
  const resign = L.phase === 'off-resign' && (L.resign || []).includes(p.id);
  const ext = isUser(p.team) && canExtend(L, p);
  const type = ext ? 'extension' : resign ? 're-sign' : 'signing';
  if (p.ask == null) setAsk(L, p);
  if (p.prefY == null) p.prefY = yrsFor(p, p.ask || MINSAL);
  const t = L.teams[L.user];
  const q0 = cannotQuote(type) ? null : negotiate(L, p.id, MINSAL, p.prefY, L.user, type, null, { quote: true });
  const n = ui.neg[p.id] || { amt: q0 && q0.quote ? q0.quote : p.ask || MINSAL, yrs: q0 && q0.pref ? q0.pref : p.prefY, opt: '' };
  const q = cannotQuote(type) ? null : negotiate(L, p.id, Math.max(n.amt || MINSAL, MINSAL), n.yrs || p.prefY, L.user, type, null, Object.assign({ quote: true }, extrasOf(n)));
  ui.negLast = { pid: p.id, amt: n.amt, yrs: n.yrs, type };
  const labs = negLabels(p, t, type);
  const payNow = ext ? payroll(L, t, L.season + 1) : payroll(L, t);
  const cc = signConcerns(L, p, t, type);
  const concerns = cc.refuse ? `<div class="msg no"><strong>Not interested.</strong> ${esc(cc.refuse)}</div>` : `<p class="muted" style="margin:6px 0 0">What he cares about: ${cc.notes.length ? cc.notes.map(esc).join(' · ') : 'mostly the money'}. Most he can be paid: ${money(maxFor(p))} (${p.svc} years of service).</p>`;
  return `<section class="panel" style="margin-bottom:16px"><h3>${ext ? 'Extension (starts next season)' : resign ? 'Re-sign' : 'Make an offer'} · ${esc(t.abbr)} payroll ${money(payNow)} of ${money(CAP)}${ext ? ' next season' : ''}</h3>
  <div class="row"><label>Per year ($M) <input type="number" id="neg-amt" data-negf="1" min="1" step="0.1" value="${n.amt}"></label><label>Years <select id="neg-yrs" data-negf="1">${(type === 'signing' ? [1, 2, 3, 4] : [1, 2, 3, 4, 5]).map(y => `<option ${y === n.yrs ? 'selected' : ''}>${y}</option>`).join('')}</select></label><label>Final-year option <select id="neg-opt" data-negf="1"><option value="">None</option><option value="TO" ${n.opt === 'TO' ? 'selected' : ''}>Team option (he asks ~5% more)</option><option value="PO" ${n.opt === 'PO' ? 'selected' : ''}>Player option (he takes ~5% less)</option></select></label></div>
  <div class="row" style="flex-wrap:wrap;align-items:flex-start">${negExtras(p, type, n)}</div>
  <div class="row" style="margin-top:6px"><button class="primary" data-offer="${p.id}" data-type="${type}">Send offer</button></div>
  <p class="muted" style="margin:6px 0 0">Asking about ${money(p.ask || MINSAL)}${q && q.quote ? `; from ${esc(t.abbr)} he wants <strong>${money(q.quote)}/yr for ${q.pref} yr</strong>` : ''}. ${askWhy(p, t, q, payNow, ext)}${demNote(p)}${labs.length ? `<br><span class="muted">Why:</span> ${labs.map(x => `<span class="pill" style="margin:2px 4px 0 0;display:inline-block;${x[1] > 0 ? 'background:#fde8e4;color:#9a2c1c' : x[1] < 0 ? 'background:#e3f4e6;color:#1d6b33' : ''}">${esc(x[0])}</span>`).join('')}` : ''}${hiddenFor(L, p) ? '<br><span class="lo">Rookie: ratings are reads, not final, until summer league.</span>' : ''} <span class="tipword" title="${esc(PERS[p.pers])}. Your market size and team outlook also affect what he accepts.">${esc(persShort(p))}</span>. ${(resign || ext) && p.draftTid === L.user ? 'You drafted him, so a deal of ' + money(10) + ' or more counts 90% against your cap.' : ''}</p>
  ${concerns}
  ${type === 'signing' ? `<p class="muted" style="margin:6px 0 0">${physicalLine(p)}</p>` : ''}
  ${faStatus(p)}${n.msg ? `<div class="msg ${n.ok ? 'ok' : 'no'}">${esc(n.msg)}</div>` : ''}</section>`;
}
// ===== v25.2: live play-by-play. Your team's games keep a log (this season only); the live screen replays it at 1x-16x or instantly,
// with a running scoreboard, box score, team fouls and timeouts. Same result as the normal sim (it is the same game).
const LV_SPEED = [['1', '1x', 1200], ['2', '2x', 600], ['4', '4x', 300], ['16', '16x', 75], ['inst', 'Instant', 0]];
const clockTxt = c => Math.floor(c / 60) + ':' + String(c % 60).padStart(2, '0');
const qTxt = q => q <= 4 ? 'Q' + q : 'OT' + (q > 5 ? q - 4 : '');
function lvState(g) { if (!ui.lv || ui.lv.gid !== g.id) ui.lv = { gid: g.id, i: 0, speed: '2', paused: false, f: 'all', timer: null }; return ui.lv; }
function lvEntryHtml(g, e) {
  const [q, c, side, text, hs, as, fl] = e, tm = side === 0 ? L.teams[g.home].abbr : side === 1 ? L.teams[g.away].abbr : '';
  const cls = fl.includes('a') ? 'lv-adj' : fl.includes('t') ? 'lv-to' : fl.includes('q') ? 'lv-q' : fl.includes('s') ? 'lv-score' : '';
  return `<div class="lv-row ${cls}"><span class="lv-t">${qTxt(q)} ${clockTxt(c)}</span><span class="lv-tm">${esc(tm)}</span><span class="lv-tx">${fl.includes('c') ? '<span class="pill clutch">Clutch</span> ' : ''}${esc(text)}</span><span class="lv-sc">${as}-${hs}</span></div>`;
}
const lvShow = (f, e) => f === 'all' || (f === 'score' && (e[6].includes('s') || e[6].includes('q'))) || (f === 'close' && (e[6].includes('c') || e[6].includes('a')));
// v30b: record going into a game (regular season W-L, playoff W-L) from the stored games of that season; null when the season is gone
function gameRec(g, tid) {
  if (!L || g.season !== L.season) return null;
  let rw = 0, rl = 0, pw = 0, pl = 0;
  for (const x of L.games) { if (x.id >= g.id || (x.home !== tid && x.away !== tid)) continue; const w = (x.home === tid) === (x.hs > x.as); if (x.playoff) { if (w) pw++; else pl++; } else if (w) rw++; else rl++; }
  return { rw, rl, pw, pl };
}
function recLine(g, tid, home) {
  const r = gameRec(g, tid), t = L.teams[tid];
  return `${home ? 'Home' : 'Away'}${r ? ` · ${r.rw}-${r.rl}${g.playoff ? ` · playoffs ${r.pw}-${r.pl}` : ''}` : ''}`;
}
const minTxt = sec => { const m = Math.floor(sec / 60); return m + ':' + String(Math.round(sec - m * 60) % 60).padStart(2, '0'); };
const pmTxt = v => v > 0 ? '+' + v : String(v);
function lvBox(g, upto) {
  const st = {}; for (const r of g.box) st[r[0]] = { side: r[1], s: new Array(15).fill(0), gs: r[17] };
  for (let k = 0; k < upto; k++) { const ev = g.pbp[k][7]; if (!ev) continue; for (let j = 0; j < ev.length; j += 3) { const x = st[ev[j]]; if (x) x.s[ev[j + 1]] += ev[j + 2]; } }
  return st;
}
// v32d: the next planned subs for one team from its stored timeline (grouped by time), as text lines
function nextSubs(g, si, elapsed, k) {
  const tl = g.tl && g.tl[si]; if (!tl) return [];
  const when = t => { const q = t < 2880 ? Math.floor(t / 720) : 4 + Math.floor((t - 2880) / 300), a = q < 4 ? q * 720 : 2880 + (q - 4) * 300, left = (q < 4 ? 720 : 300) - (t - a); return `${qTxt(q + 1)} ${clockTxt(Math.max(0, Math.round(left)))}`; };
  const nm = id => { const p = L.players[id]; return p ? shortName(p) : '?'; };
  const by = new Map(); for (const e of tl.ev) { if (e[0] / 10 <= elapsed + 0.5) continue; if (!by.has(e[0])) by.set(e[0], { o: [], i: [] }); const x = by.get(e[0]); if (e[1] >= 0) x.o.push(e[1]); if (e[2] >= 0) x.i.push(e[2]); }
  return [...by.entries()].slice(0, k).map(([t, x]) => `${when(t / 10)}: ${x.i.map(nm).join(', ') || '—'} in for ${x.o.map(nm).join(', ') || '—'}`);
}
function vLive(g) {
  const lv = lvState(g), log = g.pbp, n = Math.min(lv.i, log.length), last = n ? log[n - 1] : null, done = n >= log.length;
  const hs = last ? last[4] : 0, as = last ? last[5] : 0, q = last ? last[0] : 1, c = last ? last[1] : 720;
  const st = lvBox(g, n), qNow = q, rp = pbpReplay(g, n), onSet = new Set(rp.court);
  const elapsedNow = n ? (q <= 4 ? (q - 1) * 720 + (720 - c) : 2880 + (q - 5) * 300 + (300 - c)) : 0;   // v32d
  const fouls = side => { let f = 0; for (let k = 0; k < n; k++) { const e = log[k]; if (e[0] !== qNow || !e[7]) continue; for (let j = 0; j < e[7].length; j += 3) if (e[7][j + 1] === 14 && st[e[7][j]] && st[e[7][j]].side === side) f += e[7][j + 2]; } return f; };
  const tos = side => { let used = 0, mq = 1; for (let k = 0; k < n; k++) { const e = log[k]; if (e[6].includes('t') && e[2] === side) used++; if (e[0] > mq) mq = e[0]; } return 7 + Math.max(0, mq - 4) * 2 - used; };
  const team = (side, tid, pts) => `<div class="lv-team"><div>${logo(tid, 40)}</div><div><div class="lv-name">${esc(L.teams[tid].abbr)}</div><div class="muted lv-rec" style="font-size:12px">${esc(recLine(g, tid, side === 0))}</div><div class="muted" style="font-size:12px">Fouls ${fouls(side)} · TO left ${tos(side)}</div></div><div class="lv-pts">${pts}</div></div>`;
  const courtWin = (side, tid) => { const ids = rp.court.slice(side === 0 ? 0 : 5, side === 0 ? 5 : 10); return `<div class="lv-court-tm" data-side="${side}"><div class="k">${esc(L.teams[tid].abbr)} on the floor</div>${ids.map(id => { const x = st[id] || { s: new Array(15).fill(0) }, pl = L.players[id]; return `<div class="lv-cp"><span class="lv-cpn">${pl ? `<a class="lk" data-player="${id}">${esc(shortName(pl))}</a>` : 'Player'}</span><span class="muted">${pl ? posLabel(pl) : ''}</span><span>${x.s[1]} pts</span><span class="${x.s[14] >= 5 ? 'lo' : 'muted'}">${x.s[14]} PF</span><span class="${(rp.pm[id] || 0) > 0 ? 'w' : (rp.pm[id] || 0) < 0 ? 'lo' : 'muted'}">${pmTxt(rp.pm[id] || 0)}</span></div>`; }).join('')}${(() => { const ns = nextSubs(g, side === 0 ? 0 : 1, elapsedNow, 3); return ns.length ? `<div class="muted lv-next" style="font-size:12px;margin-top:4px"><strong>Planned subs</strong>${ns.map(x => `<div>${esc(x)}</div>`).join('')}</div>` : ''; })()}</div>`; };
  const shown = []; for (let k = n - 1; k >= 0; k--) if (lvShow(lv.f, log[k])) shown.push(log[k]);
  const boxT = (side, tid) => { const ps = Object.keys(st).map(Number).filter(id => st[id].side === side).sort((a, b) => st[b].s[1] - st[a].s[1] || (st[b].gs || 0) - (st[a].gs || 0)); const v = (x, i) => x.s[i];
    return `<div class="tblwrap"><table class="lv-box"><thead><tr><th class="l">${esc(L.teams[tid].abbr)}</th><th>Min</th><th>Pts</th><th>Reb</th><th>Ast</th><th>Stl</th><th>Blk</th><th>TO</th><th>PF</th><th>FG</th><th>3P</th><th>FT</th><th title="Plus-minus">+/-</th></tr></thead><tbody>${ps.map(id => { const x = st[id], p = L.players[id], pmv = rp.pm[id] || 0; return `<tr class="${onSet.has(id) ? 'oncourt' : ''}"><td class="l">${onSet.has(id) ? '<span class="lv-dot" title="On the floor"></span>' : ''}${p ? esc(shortName(p)) : 'Player'}</td><td>${minTxt(rp.min[id] || 0)}</td><td><strong>${v(x, 1)}</strong></td><td>${v(x, 8) + v(x, 9)}</td><td>${v(x, 10)}</td><td>${v(x, 11)}</td><td>${v(x, 12)}</td><td>${v(x, 13)}</td><td class="${v(x, 14) >= 5 ? 'lo' : ''}">${v(x, 14)}</td><td>${v(x, 2)}-${v(x, 3)}</td><td>${v(x, 4)}-${v(x, 5)}</td><td>${v(x, 6)}-${v(x, 7)}</td><td class="${pmv > 0 ? 'w' : pmv < 0 ? 'lo' : ''}">${pmTxt(pmv)}</td></tr>`; }).join('')}</tbody></table></div>`; };
  const ctl = `<div class="row" style="gap:6px;flex-wrap:wrap;align-items:center"><button class="sm ${lv.paused ? 'primary' : ''}" data-lv="pause" ${done ? 'disabled' : ''}>${lv.paused ? '▶ Play' : '❚❚ Pause'}</button><span class="seg">${LV_SPEED.map(([k, t]) => `<button class="sm ${lv.speed === k ? 'primary' : ''}" data-lv="sp:${k}" ${done ? 'disabled' : ''}>${t}</button>`).join('')}</span><span class="seg">${[['all', 'All'], ['score', 'Scoring plays'], ['close', 'Close & late']].map(([k, t]) => `<button class="sm ${lv.f === k ? 'primary' : ''}" data-lv="f:${k}">${t}</button>`).join('')}</span><button class="sm" data-lv="box">Final box score</button></div>`;
  return `<div class="row" style="margin-bottom:10px"><button data-back="1">Back</button></div><section class="panel" style="margin-bottom:12px"><div class="k">${seasonName(g.season)} · ${g.playoff ? esc(g.stage) + ' · Game ' + g.gnum : dayTxt(g.day, g.season)} · Live</div>
  <div class="lv-board" id="lv-board">${team(1, g.away, as)}<div class="lv-clock">${done ? '<strong>Final</strong>' + (g.ot ? '/' + (g.ot > 1 ? g.ot : '') + 'OT' : '') : `<strong>${qTxt(q)}</strong><br>${clockTxt(c)}`}</div>${team(0, g.home, hs)}</div><div class="lv-stage"><div class="lv-anim"><canvas id="lv-canvas" role="img" aria-label="Animated court: dots are players, orange is the ball"></canvas><div class="lv-key muted"><span class="lv-sw" style="background:${esc(L.teams[g.away].c1 || '#888')}"></span>${esc(L.teams[g.away].abbr)} <span class="lv-sw" style="background:${esc(L.teams[g.home].c1 || '#888')}"></span>${esc(L.teams[g.home].abbr)} · numbers are jerseys</div></div>${lvTicker(g, n)}</div><div class="lv-court" id="lv-court">${courtWin(1, g.away)}${courtWin(0, g.home)}</div>${ctl}</section>
  <div class="grid2"><section class="panel"><h3>Play-by-play</h3><div class="lv-feed" id="lv-feed">${shown.slice(0, 400).map(e => lvEntryHtml(g, e)).join('') || '<p class="muted">Tip-off…</p>'}</div></section><section class="stack"><div class="panel"><h3>Box score</h3>${boxT(1, g.away)}${boxT(0, g.home)}</div></section></div>`;
}
// Phase 2: commentary ticker beside the court. Built once per game from the play-by-play (calls, runs, lead changes, ties,
// scoring milestones, double-doubles), shown up to the current play, newest on top.
const TK_CACHE = new Map();
const TK_SAY = {
  dunk: ['{n} throws it down!', '{n} with the slam!', 'Rim-rattler from {n}!', '{n} hammers it home!'],
  three: ['{n} from downtown… bang!', '{n} buries the three!', 'Splash! {n} from deep.', '{n} lets it fly… got it!'],
  lay: ['{n} lays it in.', '{n} finishes at the rim.', '{n} gets to the basket.'],
  paint: ['{n} scores inside.', '{n} with the floater.', '{n} works it in close.'],
  mid: ['{n} hits the jumper.', '{n} pulls up… good.', '{n} knocks down the mid-range.'],
  miss3: ['{n} misses from three.', '{n} can\'t connect from deep.'],
  miss: ['{n} misses.', '{n} no good.', '{n} can\'t get it to fall.'],
  block: ['Stuffed! {b} blocks {n}.', '{b} sends it back!', 'Get that outta here! {b} rejects {n}.'],
  steal: ['{s} picks off {n}!', '{s} with the steal!', '{s} jumps the lane!'],
  tov: ['{n} turns it over.', 'Sloppy pass from {n}.', '{n} loses the handle.']
};
function lvTickerLines(g) {
  if (TK_CACHE.has(g.id)) return TK_CACHE.get(g.id);
  const out = [], log = g.pbp || [], T = s => L.teams[s === 0 ? g.home : g.away], nm = id => { const p = L.players[id]; return p ? shortName(p) : 'Player'; };
  const pick = (k, i, v) => { const a = TK_SAY[k]; return a[(i * 7 + 3) % a.length].replace('{n}', v.n || '').replace('{b}', v.b || '').replace('{s}', v.s || ''); };
  const box = {}, bx = id => box[id] || (box[id] = { pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, dd: false, td: false });
  let run = [0, 0], prevLead = 0;
  const sideOf = {}, pSide = id => sideOf[id] != null ? sideOf[id] : (L.players[id] || {}).team === g.home ? 0 : (L.players[id] || {}).team === g.away ? 1 : null;
  for (const e of log) { const ev = e[7] || []; for (let j = 0; j < ev.length; j += 3) if ((ev[j + 1] === 1 || ev[j + 1] === 3) && sideOf[ev[j]] == null && (e[2] === 0 || e[2] === 1)) sideOf[ev[j]] = e[2]; }
  for (let i = 0; i < log.length; i++) {
    const e = log[i], prev = i ? log[i - 1] : null, fl = e[6] || '', ev = e[7] || [], add = (txt, cls, ic, side) => out.push({ i, q: e[0], c: e[1], txt, cls: cls || '', ic: ic || '', side });
    const by = st => { for (let j = 0; j < ev.length; j += 3) if (ev[j + 1] === st && ev[j + 2] > 0) return ev[j]; return null; };
    const dh = e[4] - (prev ? prev[4] : 0), da = e[5] - (prev ? prev[5] : 0);
    for (let j = 0; j < ev.length; j += 3) { const x = bx(ev[j]), k = ev[j + 1], d = ev[j + 2]; if (k === 1) x.pts += d; else if (k === 8 || k === 9) x.reb += d; else if (k === 10) x.ast += d; else if (k === 11) x.stl += d; else if (k === 12) x.blk += d; }
    const side = e[2], tx = String(e[3] || '');
    if (fl.includes('q')) { add(tx, 'tk-q', '⏱', -1); }
    else if (fl.includes('t')) add(tx, 'tk-to', '✋', side);
    else if (!fl.includes('u') && !fl.includes('a')) {
      const sh = by(3), fta = by(7), ast = by(10), blk = by(12), stl = by(11), tov = by(13), code = e[10], pts = dh + da;
      const ty = code != null ? code % 10 : /\bdunk\b/i.test(tx) ? 0 : /layup/i.test(tx) ? 1 : /3PT/.test(tx) ? 4 : /mid-range/i.test(tx) ? 3 : 2;
      const a1 = /and-one/.test(tx), aTxt = ast != null && ast !== sh ? ` (${nm(ast)} with the assist)` : '';
      if (sh != null) {
        if (pts > 0) add(pick(ty === 0 ? 'dunk' : ty === 4 ? 'three' : ty === 1 ? 'lay' : ty === 3 ? 'mid' : 'paint', i, { n: nm(sh) }) + (a1 ? ' And one!' : '') + aTxt, ty === 4 ? 'tk-3' : ty === 0 ? 'tk-dk' : 'tk-mk', ty === 4 ? '🔥' : ty === 0 ? '💥' : '🏀', side);
        else if (blk != null) add(pick('block', i, { n: nm(sh), b: nm(blk) }), 'tk-blk', '🚫', 1 - side);
        else add(pick(ty === 4 ? 'miss3' : 'miss', i, { n: nm(sh) }), 'tk-miss', '', side);
      } else if (fta != null) { const m = /(\d)\/(\d) FT|(\d) of (\d)/.exec(tx); add(`${nm(fta)} at the line${pts >= 0 ? `: ${pts} point${pts === 1 ? '' : 's'}` : ''}.`, pts > 0 ? 'tk-mk' : 'tk-miss', '🎯', side); void m; }
      else if (tov != null) { if (stl != null) add(pick('steal', i, { n: nm(tov), s: nm(stl) }), 'tk-stl', '🧤', 1 - side); else add(pick('tov', i, { n: nm(tov) }), 'tk-miss', '', side); }
    }
    // runs, ties and lead changes
    if (dh > 0) { run[0] += dh; if (run[1]) run[1] = 0; } if (da > 0) { run[1] += da; if (run[0] && dh <= 0) run[0] = 0; }
    for (const s of [0, 1]) { const r = run[s], got = s === 0 ? dh : da; if (got > 0 && r >= 8 && (r - got < 8 || Math.floor(r / 4) > Math.floor((r - got) / 4))) add(`${T(s).abbr} on a ${r}-0 run!`, 'tk-run', '📣', s); }
    if (dh + da > 0) { const lead = e[4] - e[5];
      if (lead === 0 && prevLead !== 0) add(`All tied up at ${e[4]}.`, 'tk-tie', '⚖️', -1);
      else if (lead !== 0 && prevLead !== 0 && Math.sign(lead) !== Math.sign(prevLead) || lead !== 0 && prevLead === 0 && i > 3 && e[4] + e[5] > 6) { const s = lead > 0 ? 0 : 1; add(`${T(s).abbr} ${prevLead === 0 ? 'go back in front' : 'take the lead'}, ${Math.max(e[4], e[5])}-${Math.min(e[4], e[5])}.`, 'tk-lead', '🔄', s); }
      prevLead = lead; }
    // player milestones
    for (let j = 0; j < ev.length; j += 3) { const id = ev[j], k = ev[j + 1], d = ev[j + 2], x = box[id]; if (!x || d <= 0) continue;
      const ps = k === 1 ? side : pSide(id);
      if (k === 1) for (const m of [20, 30, 40, 50]) if (x.pts >= m && x.pts - d < m) add(`${nm(id)} has ${x.pts} points.`, 'tk-star', '⭐', ps);
      const tens = [x.pts, x.reb, x.ast, x.stl, x.blk].filter(v => v >= 10).length;
      if (tens >= 2 && !x.dd) { x.dd = true; add(`Double-double for ${nm(id)}.`, 'tk-star', '⭐', pSide(id)); }
      if (tens >= 3 && !x.td) { x.td = true; add(`Triple-double for ${nm(id)}!`, 'tk-star', '🌟', pSide(id)); } }
  }
  TK_CACHE.set(g.id, out); if (TK_CACHE.size > 6) TK_CACHE.delete(TK_CACHE.keys().next().value);
  return out;
}
function lvTicker(g, n) {
  const all = lvTickerLines(g), list = [];
  for (let k = all.length - 1; k >= 0 && list.length < 80; k--) if (all[k].i < n) list.push(all[k]);
  const col = s => s === 0 ? L.teams[g.home].c1 : s === 1 ? L.teams[g.away].c1 : 'transparent';
  // my team's plays: good ones light green, bad ones light red; the other team's plays stay plain
  const me = isUser(g.home) ? 0 : isUser(g.away) ? 1 : null, GOOD = /tk-(3|dk|mk|blk|stl|run|lead|star)\b/;
  const mood = x => me == null || x.side !== me ? '' : x.cls === 'tk-miss' ? ' tk-me-bad' : GOOD.test(x.cls) ? ' tk-me-good' : '';
  return `<aside class="lv-tick panel" aria-live="polite"><h3>Commentary</h3><div class="lv-tk-list">${list.length ? list.map(x => `<div class="tk-row ${x.cls}${mood(x)}${x.i === n - 1 ? ' tk-new' : ''}" style="border-left-color:${esc(col(x.side) || 'transparent')}"><span class="tk-t">${qTxt(x.q)} ${clockTxt(x.c)}</span><span class="tk-x">${x.ic ? `<span class="tk-ic" aria-hidden="true">${x.ic}</span> ` : ''}${esc(x.txt)}</span></div>`).join('') : '<p class="muted">Tip-off coming up…</p>'}</div></aside>`;
}
// Phase 1: live-game sounds for the entry just shown; buzzer + crowd at the final
function fxLive(g, i) {
  if (!window.FX || !i) return;
  const fin = i >= g.pbp.length, mineH = isUser(g.home), mineA = isUser(g.away);
  FX.pbp(g.pbp[i - 1], i > 1 ? g.pbp[i - 2] : null, fin, fin && (mineH || mineA) ? (mineH ? g.hs > g.as : g.as > g.hs) : null);
}
function lvTick() {
  const lv = ui.lv; if (!lv) return; clearTimeout(lv.timer); lv.timer = null;
  const g = L && L.games.find(x => x.id === lv.gid);
  if (!g || ui.game !== lv.gid || ui.liveMode !== lv.gid || !g.pbp) return;
  if (window.COURT) { const sp0 = LV_SPEED.find(x => x[0] === lv.speed) || LV_SPEED[1]; COURT.live(g, Math.min(lv.i, g.pbp.length), lv.paused ? 0 : sp0[2]); }   // Phase 2: animated court
  if (lv.paused || lv.i >= g.pbp.length) return;
  const sp = LV_SPEED.find(x => x[0] === lv.speed) || LV_SPEED[1];
  if (!sp[2]) { lv.i = g.pbp.length; render(); fxLive(g, lv.i); if (window.COURT) COURT.live(g, lv.i, 0); return; }
  lv.timer = setTimeout(() => { if (ui.lv !== lv || ui.liveMode !== lv.gid) return; lv.i++; const y = window.scrollY; render(); window.scrollTo(0, y); fxLive(g, lv.i); lvTick(); }, sp[2]);
}
// Phase 1: shot chart pickers (box score team / player; player page view + season)
document.addEventListener('click', e => {
  const b = e.target.closest('[data-gsh],[data-psc]'); if (!b || !L) return;
  e.stopImmediatePropagation(); const y = window.scrollY;
  if (b.dataset.gsh) { const [g, k] = b.dataset.gsh.split(':'); ui.gsh = { g: +g, k }; }
  else { const [pid, , v] = b.dataset.psc.split(':'); const o = ui.psc && ui.psc.p === +pid ? ui.psc : { p: +pid, s: null, m: 'heat' }; ui.psc = Object.assign({}, o, { m: v }); }
  render(); window.scrollTo(0, y);
}, true);
document.addEventListener('change', e => {
  const s = e.target.closest('[data-pscs]'); if (!s || !L) return;
  const pid = +s.dataset.pscs, o = ui.psc && ui.psc.p === pid ? ui.psc : { p: pid, m: 'heat' }; ui.psc = Object.assign({}, o, { s: s.value });
  const y = window.scrollY; render(); window.scrollTo(0, y);
});
document.addEventListener('click', e => {
  const b = e.target.closest('[data-brcols]'); if (!b || !L) return;
  e.stopImmediatePropagation(); ui.brCols = !ui.brCols; render();
}, true);
document.addEventListener('click', e => {
  const b = e.target.closest('[data-lv],#b-live'); if (!b || !L) return;
  if (b.id === 'b-live') { const gid = +b.dataset.gid; ui.liveMode = gid; ui.lv = null; lvState(L.games.find(x => x.id === gid)); render(); lvTick(); return; }
  const lv = ui.lv; if (!lv) return; const v = b.dataset.lv;
  if (v === 'pause') lv.paused = !lv.paused; else if (v.startsWith('sp:')) { lv.speed = v.slice(3); lv.paused = false; } else if (v.startsWith('f:')) lv.f = v.slice(2); else if (v === 'box') { ui.liveMode = null; clearTimeout(lv.timer); render(); return; }
  render(); lvTick();
});
// v26.5: quotes after the game
function rxPanel(g) {
  if (!g.rx || !g.rx.length) return '';
  return `<section class="panel" style="margin-bottom:16px"><h3>Reactions</h3>${g.rx.map(q => { const pl = q.w !== 'coach' ? L.players[q.w] : null; return `<div class="rx"><div class="rx-w">${pl ? `<a class="lk" data-player="${pl.id}">${esc(rxWho(L, q))}</a>` : `${esc(rxWho(L, q))} <span class="muted">coach</span>`}${q.tid != null ? ` <span class="muted">· ${tlabel(q.tid)}</span>` : ''}</div><div class="rx-q">\u201C${esc(rxText(q, g.id))}\u201D</div></div>`; }).join('')}</section>`;
}
// ===== v32d: rotation chart (who was on court, by minute). Data: game.tl[side] = {st, ev, src, bad} from the engine =====
function tlStints(tl, total) {
  const on = {}, out = {}, end = Math.round(total * 10);
  for (const id of tl.st) on[id] = 0;
  const close = (id, t) => { if (on[id] == null) return; if (t > on[id]) (out[id] = out[id] || []).push([on[id] / 10, t / 10]); delete on[id]; };
  for (const e of tl.ev) { if (e[1] >= 0) close(e[1], e[0]); if (e[2] >= 0 && on[e[2]] == null) on[e[2]] = e[0]; }
  for (const id of Object.keys(on)) close(+id, end);
  return out;
}
const gameTotal = g => 2880 + (g.ot || 0) * 300;
function rotBars(stints, total, cls) {
  return stints.map(([a, b]) => `<i class="${cls}" style="left:${(a / total * 100).toFixed(2)}%;width:${((b - a) / total * 100).toFixed(2)}%" title="${minTxt(a)}-${minTxt(b)} (${Math.round((b - a) / 60 * 10) / 10} min)"></i>`).join('');
}
function rotChartPanel(g, si) {
  const tid = si === 0 ? g.home : g.away, tm = L.teams[tid], tl = g.tl && g.tl[si];
  const head = `<h3>${tlabel(tid, true)} rotation chart</h3>`;
  if (!tl) return `<section class="panel rotchart" style="margin-bottom:16px">${head}<p class="muted">No rotation timeline is stored for this game. It is kept for your games and the last 30 league games.</p></section>`;
  const total = gameTotal(g), st = tlStints(tl, total), sec = id => (st[id] || []).reduce((a, x) => a + x[1] - x[0], 0);
  const ids = Object.keys(st).map(Number).sort((a, b) => (tl.st.includes(b) - tl.st.includes(a)) || sec(b) - sec(a));
  const qs = [0, 1, 2, 3].concat(g.ot ? Array.from({ length: g.ot }, (_, i) => 4 + i) : []);
  const lines = qs.slice(1).map(q => { const x = q <= 4 ? q * 720 : 2880 + (q - 4) * 300; return `<b class="rc-q" style="left:${(x / total * 100).toFixed(2)}%"></b>`; }).join('');
  const axisFix = qs.map(q => { const a = q < 4 ? q * 720 : 2880 + (q - 4) * 300, w = q < 4 ? 720 : 300; return `<span style="left:${(a / total * 100).toFixed(2)}%;width:${(w / total * 100).toFixed(2)}%">${q < 4 ? 'Q' + (q + 1) : 'OT' + (q - 3 > 1 ? q - 3 : '')}</span>`; }).join('');
  const rows = ids.map(id => { const p = L.players[id], st0 = tl.st.includes(id); return `<div class="rc-row"><span class="rc-n" title="${p ? esc(p.name) : ''}">${p ? `<a class="lk" data-player="${id}">${esc(shortName(p))}</a>` : 'Player'}<span class="muted"> ${p ? esc(posLabel(p)) : ''}</span></span><span class="rc-track">${lines}${rotBars(st[id], total, st0 ? 'st' : 'bn')}</span><span class="rc-m">${Math.round(sec(id) / 60)}</span></div>`; }).join('');
  const src = tl.src === 'chart' ? 'Your saved rotation chart' : 'Coach pattern';
  return `<section class="panel rotchart" style="margin-bottom:16px">${head}<p class="muted" style="margin:-4px 0 8px;font-size:12px">${src}. Green bars = starters, orange bars = bench. Hover a bar for the time. Last column = minutes.${tl.bad ? ` <span class="warn">Your chart was not used: ${esc(tl.bad)}.</span>` : ''}${tl.subs && tl.subs.length ? ` <span class="warn">Chart changed for this game: ${tl.subs.map(esc).join('; ')}.</span>` : ''}</p><div class="rc-axis"><span class="rc-n"></span><span class="rc-track rc-ax">${axisFix}</span><span class="rc-m"></span></div>${rows}</section>`;
}
function vGame(g) {
  if (!g) return '<p class="muted">That box score is no longer stored.</p>';
  if (g.pbp && ui.liveMode === g.id) return vLive(g);
  const side = (si) => {
    const tid = si === 0 ? g.home : g.away;
    const rows = g.box.filter(r => r[1] === si).sort((a, b) => b[17] - a[17] || b[2] - a[2]);
    const tot = new Array(17).fill(0); rows.forEach(r => r.slice(2).forEach((v, i) => tot[i] += v || 0));
    const line = (r, tot) => { const v = i => r[i]; return `<td>${Math.round(v(0) / 60)}</td><td><strong>${v(1)}</strong></td><td>${v(2)}-${v(3)}</td><td>${v(4)}-${v(5)}</td><td>${v(6)}-${v(7)}</td><td>${v(8)}</td><td>${v(9)}</td><td>${v(8) + v(9)}</td><td>${v(10)}</td><td>${v(11)}</td><td>${v(12)}</td><td>${v(13)}</td><td>${v(14)}</td><td class="${!tot && v(16) > 0 ? 'w' : !tot && v(16) < 0 ? 'lo' : ''}">${tot ? '' : v(16) == null ? '—' : (v(16) > 0 ? '+' : '') + v(16)}</td>`; };
    return `<section class="panel" style="margin-bottom:16px"><h3>${tlabel(tid, true)} <span class="muted" style="font-size:13px;font-weight:400">${esc(recLine(g, tid, si === 0))}</span></h3><div class="tblwrap"><table><thead><tr><th class="l">Player</th><th class="l">Pos</th><th>Min</th><th>Pts</th><th>FG</th><th>3P</th><th>FT</th><th>Off</th><th>Def</th><th>Reb</th><th>Ast</th><th>Stl</th><th>Blk</th><th>TO</th><th>PF</th><th title="Plus-minus">+/-</th></tr></thead><tbody>
      ${rows.map(r => { const p = L.players[r[0]]; return `<tr class="click" data-player="${r[0]}"><td class="l">${p ? esc(p.name) : 'Former player'}${r[17] ? '' : ' <span class="muted">bench</span>'}${(g.hurt || []).includes(r[0]) ? ' <span class="pill dtd" title="Played through a day-to-day injury">Hurt</span>' : ''}${r[16] >= 6 ? ' <span class="pill inj">Fouled out</span>' : ''}</td><td class="l">${p ? posLabel(p) : ''}</td>${line(r.slice(2))}</tr>`; }).join('')}
      <tr><td class="l"><strong>Totals</strong></td><td></td>${line(tot, true)}</tr></tbody></table></div><p class="muted" style="margin:8px 0 0">FG ${pct(tot[2], tot[3])} · 3P ${pct(tot[4], tot[5])} · FT ${pct(tot[6], tot[7])}</p></section>`;
  };
  const qh = g.q.map((x, i) => `<th>${i < 4 ? 'Q' + (i + 1) : 'OT' + (i - 3 > 1 ? i - 3 : '')}</th>`).join('');
  const injuries = g.inj.length ? `<p>${g.inj.map(i => `${esc(L.players[i.pid] ? L.players[i.pid].name : 'Player')} (${L.teams[i.tid].abbr}) injured, out ${i.games} game${i.games > 1 ? 's' : ''}${i.long ? ', long-term' : ''}.`).join(' ')}</p>` : '';
  return `<div class="row" style="margin-bottom:10px"><button data-back="1">Back</button>${g.pbp ? `<button class="primary" id="b-live" data-gid="${g.id}">▶ Watch live</button>` : ''}</div>
  <section class="panel" style="margin-bottom:16px"><div class="k">${seasonName(g.season)} · ${g.playoff ? g.stage + ' · Game ' + g.gnum : dayTxt(g.day, g.season)}${g.ot ? ' · ' + g.ot + ' overtime' + (g.ot > 1 ? 's' : '') : ''}${g.cov ? ` · <span class="tipword" title="Pick-and-roll coverage (start > end)">Coverage: ${esc(L.teams[g.away].abbr)} ${esc(String(g.cov[1]).split('>').map(c => COV_LBL[c] || c).join(' → '))}, ${esc(L.teams[g.home].abbr)} ${esc(String(g.cov[0]).split('>').map(c => COV_LBL[c] || c).join(' → '))}</span>` : ''}</div>
  <div class="tblwrap"><table class="linescore" style="max-width:520px;margin-top:8px"><thead><tr><th class="l">Team</th>${qh}<th>Final</th></tr></thead><tbody>
  <tr><td class="l">${tlabel(g.away)}<div class="muted lv-rec" style="font-size:11px">${esc(recLine(g, g.away, false))}</div></td>${g.q.map(x => `<td>${x[1]}</td>`).join('')}<td><strong data-cu>${g.as}</strong></td></tr>
  <tr><td class="l">${tlabel(g.home)}<div class="muted lv-rec" style="font-size:11px">${esc(recLine(g, g.home, true))}</div></td>${g.q.map(x => `<td>${x[0]}</td>`).join('')}<td><strong data-cu>${g.hs}</strong></td></tr></tbody></table></div>${g.lg ? `<p class="muted" style="font-size:12px;margin:6px 0 0">Timeouts used: ${L.teams[g.away].abbr} ${g.lg.to[1]}, ${L.teams[g.home].abbr} ${g.lg.to[0]}${g.lg.ifl[0] + g.lg.ifl[1] ? ` · Intentional fouls late: ${L.teams[g.away].abbr} ${g.lg.ifl[1]}, ${L.teams[g.home].abbr} ${g.lg.ifl[0]}` : ''}${g.lg.hack[0] + g.lg.hack[1] ? ` · Hack-a-player: ${L.teams[g.away].abbr} ${g.lg.hack[1]}, ${L.teams[g.home].abbr} ${g.lg.hack[0]}` : ''}</p>` : ''}${injuries}</section>
  ${rxPanel(g)}${side(1)}${side(0)}${tpGamePanel(g)}${gameShotPanel(g)}${rotChartPanel(g, 1)}${rotChartPanel(g, 0)}${g.pbp ? `<details class="panel"><summary><strong>Play-by-play</strong> <span class="muted">· ${g.pbp.length} entries · defensive adjustments: ${g.pbp.filter(e => e[6].includes('a')).length}</span></summary><div class="lv-feed" style="max-height:none">${g.pbp.map(e => lvEntryHtml(g, e)).join('')}</div></details>` : ''}`;
}

// ---------- trades ----------
// v25.7: a future pick's projected range and tier, with the value behind it in the tooltip
function pickChip(k) {
  const p = pickProj(L, k), pts = pickPtsNow(L, k), tip = p.known ? `Slot set: #${p.no}. Value: ${Math.round(pts)} pts.` : `Projected from team status, roster and record. Value: ${Math.round(pts)} pts (class ×${classMult(L, k).toFixed(2)}, years out ×${PICK_UNC[pickDist(L, k)]}).`;
  return `<span class="pill pos" title="${esc(tip)}">${pickTier(pts)}</span> <span class="muted" title="${esc(tip)}">${esc(pickRange(L, k))}</span>`;
}
// cash box for one side of a deal: from sends to (limits: $5M a season each way)
function cashBox(side, from, to) {
  const g = side === 'give' ? ui.tGive : ui.tGet, room = Math.min(cashRoom(L, from).send, cashRoom(L, to).get), tight = from.id !== L.user && from.owner && from.owner.tight;
  return `<div class="row" style="margin-top:6px"><label>Cash ($M) <input type="number" class="sm" data-cash="${side}" min="0" max="${CASH_MAX}" step="0.5" value="${g.cash || 0}" style="width:70px" ${tight ? 'disabled' : ''}></label><span class="muted" style="font-size:12px">${tight ? `${esc(from.abbr)}'s owner is cutting costs: no cash` : `up to ${money(Math.min(CASH_MAX, room))} left this season`}</span></div>`;
}
// v25.8: a 1st whose team is in the deal, before -> after the trade (shown when the value moves 5%+)
function pickShift(k) {
  if (k.rd !== 1 || ui.tradeWith == null) return '';
  const sides = tradeSides(L.user, ui.tradeWith, ui.tGive, ui.tGet);
  if (!sides[k.orig] || !(sides[k.orig].out.length || sides[k.orig].in.length)) return '';
  const b = pickPtsNow(L, k), a = withCtx(sides, () => pickPtsNow(L, k)); if (!(b > 0) || Math.abs(a - b) / b < 0.05) return '';
  const rb = pickRange(L, k), ra = withCtx(sides, () => pickRange(L, k));
  return ` <span class="muted" title="Valued on the rosters after this trade" style="font-size:12px">${rb} → ${ra} (${Math.round(b)} → ${Math.round(a)})</span>`;
}
// v26.5: front-office personality (foSummary): style, Patience / Ambition bars, trait chips. Commissioner sees numbers; team mode sees Low / Mid / High.
function foLevel(v) { return v <= 35 ? 'Low' : v >= 65 ? 'High' : 'Mid'; }
function foPanel(t) {
  const f = foSummary(L, t), mine = isUser(t.id), num = commish();
  const bar = (k, v, tip) => `<div class="kv fo-row" title="${esc(tip)}"><span class="k2">${k}</span><span class="fo-bar" role="img" aria-label="${k}: ${num ? v : foLevel(v)}"><i style="width:${Math.max(4, v)}%"></i></span><span class="fo-val">${num ? v : foLevel(v)}</span></div>`;
  const rep = mine && L.mode === 'team' ? `<div class="kv fo-row" title="How the beat writers treat you. Press conference answers move it."><span class="k2">Media reputation</span><span class="fo-bar" role="img" aria-label="Media reputation ${mediaRep(L)}"><i style="width:${Math.max(4, mediaRep(L))}%"></i></span><span class="fo-val">${mediaRep(L)}</span></div>` : '';
  return `<div class="panel"><h3>Front office personality</h3><div class="row" style="margin-bottom:6px">${foChip(t)}${f.traits.map(x => `<span class="pill fo-trait fo-${x.k}" title="${esc(x.why)}">${esc(x.label)}</span>`).join('')}${f.traits.length ? '' : '<span class="muted" style="font-size:12px">No strong traits</span>'}${t.newGM != null && t.newGM >= L.season - 1 ? `<span class="pill new-gm" title="${esc('Took over as general manager in ' + seasonName(t.newGM))}">New GM</span>` : ''}</div>${bar('Patience', f.pat, 'How long they let a rebuild run before buying')}${bar('Ambition', f.amb, 'How soon they push to win')}${rep}${mine && L.mode === 'team' ? fanMeter(t.id) : ''}${!mine && t.lowRun != null ? `<div class="kv fo-row" style="grid-template-columns:1fr auto" title="Seasons in a row that ended in a rebuild or tank. At 3 the plan stops holding; at 4 the owner replaces the GM."><span class="k2">Low seasons in a row</span><span class="fo-val">${t.lowRun}</span></div>` : ''}</div>`;
}
function foChip(t) { const f = foOf(L, t); return `<span class="pill" title="How much they value picks. Belief ${Math.round(f.belief * 100)}%: how much they think a trade changes a team's future.">${FO_STYLE[f.style].label}</span>`; }
function assetList(tid, sel, side) {
  const cs = capSeason(L);
  const ps = teamPlayers(tid).sort((a, b) => ovrNum(b) - ovrNum(a));
  const ks = L.picks.filter(k => k.owner === tid && k.s >= L.season && !pickUsed(L, k)).sort((a, b) => a.s - b.s || a.rd - b.rd);
  const mineT = tid === L.user;
  return `${fbar('tr-' + side, { age: false, sortHint: false })}<div class="tblwrap"><table class="sortable" data-sid="tr-${side}" data-flist="tr-${side}"><thead><tr><th class="nosort"></th><th class="l">Player</th><th class="l">Pos</th><th>Age</th><th>Ovr</th><th>${commish() ? 'Pot' : 'Pot*'}</th><th>Per year</th><th title="Seasons left, counting ${cs === L.season ? 'this season' : 'next season'}. PO = player option, TO = team option on the final year">Yrs</th></tr></thead><tbody>${ps.map(p => { const c = p.contract, yl = c ? Math.max(0, c.exp - cs + 1) : 0;
    const ts = tradeStatus(L, p), restr = tradeRestricted(L, p), locked = (ts && ts.k === 'protect') || restr;
    return `<tr ${frow(p)} class="${locked ? 'locked' : ''}"><td><input type="checkbox" data-asset="${side}" data-kind="players" value="${p.id}" ${sel.players.includes(p.id) && !locked ? 'checked' : ''} ${locked ? `disabled title="${restr ? 'Signed as a free agent: can\'t be traded yet' : 'Protected: not available in trades'}"` : ''} aria-label="Include ${esc(p.name)}"></td><td class="l nmc"><a class="lk" data-player="${p.id}">${esc(p.name)}</a>${injPill(p)}${scoutPill(p)}${statusPill(p)}${tagChips(p, ['untouch'])}${restr ? ' <span class="pill pos" title="Signed as a free agent: can\'t be traded yet">New signing</span>' : ''}<div class="archtag">${esc(archLabel(p))}</div></td><td class="l">${posLabel(p)}</td><td>${p.age}</td><td>${ovrTxt(p)}</td><td data-v="${commish() ? p.pot : p.scout}">${potCell(p)}</td><td data-v="${c ? c.amt : 0}">${c ? money(c.amt) : '—'}</td><td data-v="${yl}">${c ? (yl || 'exp') : '—'}${c && c.opt ? ' <span class="muted" title="' + (c.opt === 'PO' ? 'Player option' : 'Team option') + ' on the final year">' + c.opt + '</span>' : ''}${p.ext ? ' <span class="muted" title="Extension signed">+ext</span>' : ''}</td></tr>`; }).join('')}
    ${(() => { const yrsL = [...new Set(ks.map(k => k.s))], nd = nextDraftS(L); let out = '';
      for (const S of yrsL) { const grp = ks.filter(k => k.s === S), key = side + S, open = ui.pkOpen && ui.pkOpen[key] != null ? ui.pkOpen[key] : S < nd + 2, nsel = grp.filter(k => sel.picks.includes(k.id)).length;
        out += `<tr class="nosort pkhead" data-pkyr="${key}" style="cursor:pointer"><td></td><td class="l" colspan="7"><strong>${open ? '▾' : '▸'} ${draftLabel(S)} draft</strong> <span class="muted">${grp.length} pick${grp.length > 1 ? 's' : ''}${nsel ? ' · ' + nsel + ' selected' : ''}</span></td></tr>`;
        if (open) out += grp.map(k => { const on = sel.picks.includes(k.id), canProt = side === 'give' && on && k.rd === 1 && !k.prot && !draftSlotOf(L, k) && !k.swap, pv = (sel.prot && sel.prot[k.id]) || 0, lock = !!k.swap;
          return `<tr class="nosort ${lock ? 'locked' : ''}"><td><input type="checkbox" data-asset="${side}" data-kind="picks" value="${k.id}" ${on ? 'checked' : ''} ${lock ? 'disabled title="Tied to a pick swap: can\'t be traded"' : ''} aria-label="Include pick"></td><td class="l" colspan="7">${esc(pickLabel(L, pv ? pickKV(k, pv) : k))} pick ${pickChip(k)}${lock ? ' <span class="pill pos">Tied to a swap</span>' : ''}${pickShift(k)}${canProt ? ` <label class="muted" style="font-size:12px;margin-left:6px">Protection <select class="sm" data-prot="${k.id}"><option value="0">None</option>${protOpts(L).map(n => `<option value="${n}" ${pv === n ? 'selected' : ''}>Top-${n}</option>`).join('')}</select></label>` : ''}</td></tr>`; }).join(''); }
      return out; })()}</tbody></table></div>${cashBox(side, L.teams[side === 'give' ? L.user : tid], L.teams[side === 'give' ? ui.tradeWith : L.user])}${swapBox(side)}`;
}
// Payroll before and after the proposed deal, this season and next, for both teams
function statusPill(p) { const s = tradeStatus(L, p); return s ? ` <span class="pill ${s.k === 'block' ? 'shop' : 'prot'}" title="${esc((s.k === 'block' ? 'Shopped: ' : 'Untouchable: ') + s.why)}">${s.k === 'block' ? 'Shopped' : 'Untouchable'}</span>` : ''; }
const BLOCK_WHY = ['Shopped by you', 'Looking to shed salary', 'Want draft picks or young players', 'Upgrading at his position', 'Clearing minutes for younger players', 'Wants a bigger role elsewhere', 'Contract is expiring'];
function tradingBlockPanel() {
  const all = Object.values(L.players).filter(p => p.team != null && !p.retired).map(p => ({ p, s: tradeStatus(L, p) })).filter(x => x.s);
  const shop = all.filter(x => x.s.k === 'block').sort((a, b) => ovrNum(b.p) - ovrNum(a.p)), prot = all.filter(x => x.s.k === 'protect').sort((a, b) => a.p.team - b.p.team || ovrNum(b.p) - ovrNum(a.p));
  const cs = capSeason(L);
  const rows = shop.map(({ p, s }) => { const c = p.contract, yl = c ? yrsLeft(L, p, cs) : 0, mine = isUser(p.team);
    return `<tr ${frow(p)} class="${mine ? 'mine' : ''}"><td class="l"><a class="lk" data-player="${p.id}">${esc(p.name)}</a>${injPill(p)}${scoutPill(p)}<div class="archtag">${esc(archLabel(p))}</div></td><td class="l">${tlabel(p.team)}</td><td class="l">${posLabel(p)}</td><td>${p.age}</td><td>${ovrTxt(p)}</td><td data-v="${c ? c.amt : 0}">${c ? money(c.amt) : '—'}</td><td>${c ? (yl || 'exp') : '—'}</td><td class="l">${c && c.opt ? c.opt : '—'}</td><td class="l wrapt">${mine ? `<select data-bwhy="${p.id}" aria-label="Why he's on the block">${BLOCK_WHY.map(w => `<option ${(p.blockWhy || BLOCK_WHY[0]) === w ? 'selected' : ''}>${esc(w)}</option>`).join('')}</select>` : esc(s.why)}</td><td>${mine ? '' : `<button class="sm" data-tradefor="${p.id}">Trade for</button>`}</td></tr>`; }).join('');
  return `<section class="panel" style="margin-bottom:16px"><h2>Trading block · ${shop.length} shopped</h2><p class="muted" style="margin-top:-4px">Players teams are openly shopping, and why. Shopped players are cheaper to get. Protected players can't be included in any trade.</p>
  ${shop.length ? `${fbar('tblock', { sortHint: false })}<div class="tblwrap"><table class="sortable" data-sid="tblock" data-flist="tblock"><thead><tr><th class="l">Player</th><th class="l">Team</th><th class="l">Pos</th><th>Age</th><th>Ovr</th><th>Per year</th><th>Yrs left</th><th class="l">Opt</th><th class="l">Reason</th><th class="nosort"></th></tr></thead><tbody>${rows}</tbody></table></div>` : '<p class="muted">Nobody is on the block right now.</p>'}
  <details class="contracts"><summary>Protected players · ${prot.length}</summary><div class="cols2">${prot.map(({ p, s }) => `<div class="leader" style="grid-template-columns:minmax(0,1fr) auto"><span>${plink(p)} <span class="muted">${L.teams[p.team].abbr} · ${ovrTxt(p)}</span></span><span class="muted">${esc(s.why)}</span></div>`).join('') || '<p class="muted">None.</p>'}</div></details></section>`;
}
function proposalsPanel() {
  if (!ui.props) return '';
  const list = ui.props.list;
  return `<div class="panel" style="margin-top:12px"><h3>Proposals for ${esc(ui.props.names)}</h3>${list.length ? list.map((o, i) => `<div class="panel pending" style="margin-bottom:8px"><div>${tlabel(o.a, true)} ${modePill(L.teams[o.a])} offer <strong>${giveLinks(o.aGive)}</strong></div><div>for <strong>${giveLinks(o.bGive)}</strong></div><div class="why">${esc(o.why)}</div><div class="row" style="margin-top:8px"><button class="primary sm" data-pacc="${i}">Accept</button><button class="sm" data-pload="${i}">Load into trade builder</button></div></div>`).join('') : '<p class="muted">No team made an offer. Try shopping him (Shop on My Team) to lower his price, or add more to the package.</p>'}</div>`;
}
function tradeProjection() {
  const me = L.teams[L.user], B = L.teams[ui.tradeWith], cs = capSeason(L), cn = cs + 1;
  const pay = (t, out, inn, c) => payroll(L, t, c) - out.reduce((a, id) => a + capHit(L, L.players[id], c), 0) + inn.reduce((a, id) => a + capHit(L, L.players[id], c), 0);
  const lvl = n => n > APRON + 1e-6 ? 3 : n > TAXLINE + 1e-6 ? 2 : n > CAP + 1e-6 ? 1 : 0;
  const flag = (a, b) => { if (lvl(b) <= lvl(a)) return lvl(b) === 3 ? '<span class="capflag hard">Over hard cap</span>' : ''; return ['', '<span class="capflag cap">Goes over the cap</span>', '<span class="capflag tax">Goes over the tax line</span>', '<span class="capflag hard">Over the hard cap: not allowed</span>'][lvl(b)]; };
  const row = (t, out, inn) => { const n0 = payroll(L, t, cs), n1 = pay(t, out, inn, cs), x0 = payroll(L, t, cn), x1 = pay(t, out, inn, cn), r = t.roster.length - out.length + inn.length; const d = n1 - n0;
    return `<tr><td class="l">${tlabel(t.id, true)}</td><td>${money(n0)}</td><td class="${n1 > TAXLINE + 1e-6 ? 'over' : n1 > CAP + 1e-6 ? 'warn' : ''}"><strong>${money(n1)}</strong> <span class="muted">${d ? (d > 0 ? '+' : '') + f1(d) : ''}</span>${flag(n0, n1)}</td><td class="${n1 > CAP ? 'lo' : ''}">${money(CAP - n1)}</td><td>${money(x0)}</td><td class="${x1 > CAP + 1e-6 ? 'lo' : ''}">${money(x1)}${flag(x0, x1)}</td><td>${r}</td></tr>`; };
  const any = ui.tGive.players.length + ui.tGet.players.length;
  return `<div class="panel" style="margin-top:12px;padding:10px 12px"><h3 style="font-size:14px">Payroll projection${any ? '' : ' · select players to see the effect'}</h3><div class="tblwrap"><table><thead><tr><th class="l">Team</th><th>Now (${seasonName(cs)})</th><th>After trade</th><th>Cap room after</th><th>Next season now (${seasonName(cn)})</th><th>Next season after</th><th>Roster after</th></tr></thead><tbody>${row(me, ui.tGive.players, ui.tGet.players)}${row(B, ui.tGet.players, ui.tGive.players)}</tbody></table></div><p class="muted" style="font-size:12px;margin:6px 0 0">Cap ${money(CAP)} · tax line ${money(TAXLINE)} (over it: luxury tax, matching salaries in trades, minimum-salary free agents only) · hard cap ${money(APRON)} (never allowed).</p><p class="muted" style="margin:4px 0 0;font-size:12px">Cap ${money(CAP)} · tax line ${money(TAXLINE)} · hard cap ${money(APRON)}. Over the cap a team can take back up to 125% of outgoing salary; over the tax line (or within ${money(5)} of the hard cap) salaries must match. Minimum deals don't count.</p></div>`;
}
// v25: three-team trades. Every asset on the three rosters gets a destination ("Stays" by default); each AI team judges only its own side.
function t3moves() {
  const t3 = ui.t3; if (!t3) return []; const teams = [L.user, t3.x, t3.y], out = [];
  for (const [key, to] of Object.entries(t3.mv)) {
    const kind = key[0] === 'p' ? 'players' : 'picks', id = kind === 'players' ? +key.slice(2) : key.slice(2);
    const from = kind === 'players' ? (L.players[id] || {}).team : (L.picks.find(k => String(k.id) === id) || {}).owner;
    const pid = kind === 'picks' ? (L.picks.find(k => String(k.id) === id) || {}).id : id;
    if (teams.includes(from) && teams.includes(to) && from !== to) { const m = { kind, id: pid, from, to }; if (kind === 'picks' && t3.prot && t3.prot[pid]) m.prot = t3.prot[pid]; out.push(m); }
  }
  if (t3.cash && t3.cash.amt > 0 && teams.includes(t3.cash.from) && teams.includes(t3.cash.to) && t3.cash.from !== t3.cash.to) out.push({ kind: 'cash', from: t3.cash.from, to: t3.cash.to, amt: t3.cash.amt });   // v25.7c
  return out;
}
function trade3Panel() {
  const open = inTradeWindow(L), t3 = ui.t3;
  const intro = 'Bring in a third team: send each player or pick to the team you choose. Every team must send and receive something, and each AI team judges only its own side, so a deal one team would turn down head-to-head can work with a third team in it.';
  if (!t3) return `<section class="panel" style="margin-bottom:16px"><h2>Three-team trade</h2><p class="muted" style="margin-top:-4px">${intro}</p><button id="t3-start" ${open ? '' : 'disabled'}>Start a 3-team trade</button></section>`;
  const others = L.teams.filter(t => t.id !== L.user), teams = [L.user, t3.x, t3.y], cs = capSeason(L);
  const sel = (id, cur, not) => `<select id="${id}">${others.filter(t => t.id !== not).map(t => `<option value="${t.id}" ${t.id === cur ? 'selected' : ''}>${esc(tname(t.id))} · ${MODE_LABEL[t.mode]}</option>`).join('')}</select>`;
  const dest = (kind, id, tid) => { const key = (kind === 'players' ? 'p:' : 'k:') + id, cur = t3.mv[key]; return `<select class="sm" data-t3="${key}"><option value="">Stays</option>${teams.filter(x => x !== tid).map(o => `<option value="${o}" ${cur === o ? 'selected' : ''}>→ ${esc(L.teams[o].abbr)}</option>`).join('')}</select>`; };
  const col = tid => { const ps = teamPlayers(tid).sort((a, b) => ovrNum(b) - ovrNum(a)), ks = L.picks.filter(k => k.owner === tid && k.s >= L.season && !pickUsed(L, k)).sort((a, b) => a.s - b.s || a.rd - b.rd);
    return `<div class="panel" style="padding:8px 10px"><h3>${tlabel(tid, true)}</h3><div class="tblwrap"><table><tbody>${ps.map(p => { const ts = tradeStatus(L, p), locked = tradeRestricted(L, p) || (tid !== L.user && ts && ts.k === 'protect'); return `<tr><td class="l"><a class="lk" data-player="${p.id}">${esc(p.name)}</a>${injPill(p)}${tagChips(p)}<div class="muted" style="font-size:12px">${posLabel(p)} · ${p.age} · ${ovrTxt(p)}${p.contract ? ' · ' + money(capHit(L, p, cs)) : ''}</div></td><td>${locked ? `<span class="muted" title="${tradeRestricted(L, p) ? 'Signed as a free agent: can\'t be traded yet' : 'Protected'}">—</span>` : dest('players', p.id, tid)}</td></tr>`; }).join('')}${ks.map(k => { const mvd = t3.mv['k:' + k.id] != null, pv = (t3.prot && t3.prot[k.id]) || 0; return `<tr><td class="l muted">${esc(pickLabel(L, pv ? pickKV(k, pv) : k))} pick<div>${pickChip(k)}${mvd && k.rd === 1 && !k.prot && !draftSlotOf(L, k) ? ` <select class="sm" data-t3prot="${k.id}" title="Protection"><option value="0">No prot.</option>${protOpts(L).map(n => `<option value="${n}" ${pv === n ? 'selected' : ''}>Top-${n}</option>`).join('')}</select>` : ''}</div></td><td>${dest('picks', k.id, tid)}</td></tr>`; }).join('')}</tbody></table></div></div>`; };
  const moves = t3moves(), S = sides3(L, teams, moves);
  const S3x = sides3to(L, teams, moves);
  const shift3 = t => L.picks.filter(k => k.rd === 1 && k.owner === t && !pickUsed(L, k) && k.s >= L.season).map(k => { const b = pickPtsNow(L, k), a = withCtx(S3x, () => pickPtsNow(L, k)); if (!(b > 0) || Math.abs(a - b) / b < 0.05) return ''; return `${draftLabel(k.s)} 1st${k.orig !== t ? ' (' + esc(L.teams[k.orig].abbr) + ')' : ''}: ${pickRange(L, k)} → ${withCtx(S3x, () => pickRange(L, k))}`; }).filter(Boolean);
  const payRow = t => { const T = L.teams[t], x = S[t], now = payroll(L, T, cs), aft = now - x.give.players.reduce((a, id) => a + capHit(L, L.players[id], cs), 0) + x.get.players.reduce((a, id) => a + capHit(L, L.players[id], cs), 0); return `<tr><td class="l">${tlabel(t, true)}</td><td class="l wrap">${esc(describe(L, x.get))}</td><td class="l wrap">${esc(describe(L, x.give))}</td><td>${money(now)} → <strong class="${aft > TAXLINE + 1e-6 ? 'lo' : ''}">${money(aft)}</strong></td><td>${T.roster.length - x.give.players.length + x.get.players.length}</td><td class="l wrap muted" title="1sts the team owns, valued on the rosters after this trade">${shift3(t).join('<br>') || '—'}</td><td class="l wrap muted">${esc(tradeGetsText(L, t, x.get, x.give))}${x.get.players.map(id => L.players[id]).filter(Boolean).map(p => fitMove(p, t)).join('')}</td></tr>`; };
  const m = t3.msg;
  return `<section class="panel" style="margin-bottom:16px"><h2>Three-team trade</h2><p class="muted" style="margin-top:-4px">${intro}</p>
  <div class="row" style="margin-bottom:10px"><label>Second team ${sel('t3x', t3.x, t3.y)}</label><label>Third team ${sel('t3y', t3.y, t3.x)}</label><button class="sm" id="t3-close">Close</button></div>
  <div class="grid3" style="gap:10px;align-items:start">${teams.map(col).join('')}</div>
  <div class="tblwrap" style="margin-top:10px"><table><thead><tr><th class="l">Team</th><th class="l">Gets</th><th class="l">Sends</th><th>Payroll (${seasonName(cs)})</th><th>Roster</th><th class="l" title="Only 1sts whose value moves 5%+">1sts before → after</th><th class="l">Gets (why)</th></tr></thead><tbody>${teams.map(payRow).join('')}</tbody></table></div>
  <div class="row" style="margin-top:10px"><span class="muted">Cash ($M, up to ${money(CASH_MAX)}):</span><select id="t3cf">${teams.map(t => `<option value="${t}" ${(t3.cash ? t3.cash.from : L.user) === t ? 'selected' : ''}>${esc(L.teams[t].abbr)}</option>`).join('')}</select> → <select id="t3ct">${teams.map(t => `<option value="${t}" ${(t3.cash ? t3.cash.to : t3.x) === t ? 'selected' : ''}>${esc(L.teams[t].abbr)}</option>`).join('')}</select><input type="number" id="t3ca" min="0" max="${CASH_MAX}" step="0.5" value="${t3.cash ? t3.cash.amt : 0}" style="width:70px"></div>
  <div class="row" style="margin-top:10px"><button class="primary" id="t3-propose" ${open && moves.length ? '' : 'disabled'}>Propose 3-team trade</button><button id="t3-clear">Clear</button></div>
  ${m ? `<div class="msg ${m.ok ? 'ok' : 'no'}">${esc(m.msg)}${m.ok ? ' <button class="primary sm" id="t3-confirm">Complete trade</button>' : ''}</div>` : ''}</section>`;
}
// v25.7: the coach's position read (who holds each spot, how deep it is, which playstyles are needed) and coach targets in three tabs
const PR_CHIP = { core: 'pos', thin: 'mode-rebuild', need: 'inj', set: '' };
function positionReadPanel(t) {
  if (t.id !== L.user) return '';
  const rows = positionRead(L, t).map(r => { const st = r.starter ? L.players[r.starter] : null;
    return `<tr><td class="l"><strong>${POS[r.pos]}</strong></td><td class="l"><span class="pill ${PR_CHIP[r.status]}">${r.status[0].toUpperCase() + r.status.slice(1)}</span></td><td class="l">${st ? plink(st) + ' <span class="muted">' + ovrTxt(st) + '</span>' : '—'}</td><td>${r.depth.length}</td><td class="l wrapt" style="max-width:340px">${esc(r.line)}</td><td class="l">${r.archs.map(x => `<span class="pill" title="${esc(x.why || 'needed here')}" style="margin-right:4px">${esc(x.n)}</span>`).join('') || '<span class="muted">—</span>'}</td></tr>`; }).join('');
  return `<section class="panel" style="margin-bottom:16px"><h3>Coach's position read</h3><div class="tblwrap"><table class="posread"><thead><tr><th class="l">Pos</th><th class="l">Status</th><th class="l">Starter</th><th title="Rotation players who can play the spot">Depth</th><th class="l">Coach says</th><th class="l">Playstyles wanted</th></tr></thead><tbody>${rows}</tbody></table></div><p class="muted" style="font-size:12px;margin:6px 0 0">Core players are the ones you mark on the roster (up to ${CORE_MAX}). The coach won't suggest anyone who'd take a core player's spot.</p></section>`;
}
function targetsPanel(kind, noRead) {
  if (L.user == null) return '';
  const tab = TARGET_TABS[ui.tgtTab] ? ui.tgtTab : 'plan', t = L.teams[L.user], list = coachTargets(L, t, kind, tab), dev = tab === 'dev';
  const rows = list.map(x => { const p = x.p; return `<tr class="click" data-player="${p.id}"><td class="l">${esc(p.name)}</td>${kind === 'fa' ? '' : `<td class="l">${tlabel(p.team)}</td>`}<td class="l">${posLabel(p)}</td><td>${p.age}</td><td><strong>${ovrTxt(p)}</strong></td><td>${dev ? `<span title="The coach's read of his potential">${x.est}</span>` : potCell(p)}</td><td>${kind === 'fa' ? money(p.ask || MINSAL) : p.contract ? money(p.contract.amt) + ' <span class="muted">' + (p.contract.exp - capSeason(L) + 1) + 'y</span>' : '—'}</td><td class="l wrapt m muted">${esc(x.why)}</td>${kind === 'fa' ? `<td class="l wrapt s capfit">${esc(x.cap || '')}</td>` : ''}${kind === 'fa' ? '' : `<td><button class="sm" data-tgt="${p.id}">Trade for</button></td>`}</tr>`; }).join('');
  const goal = tab === 'plan' ? `<p class="muted" style="margin:0 0 8px">Owner's goal: <strong>${esc(((t.owner || {}).goal || {}).txt || '—')}</strong> · team status: <strong>${esc(STATUS_LABEL[shownStatus(t)] || MODE_LABEL[t.mode])}</strong></p>` : tab === 'now' ? '<p class="muted" style="margin:0 0 8px">Players who help this season, whatever the age.</p>' : '<p class="muted" style="margin:0 0 8px">Players 24 and under, ranked by the coach\'s read of his potential.</p>';
  return `${noRead ? '' : positionReadPanel(t)}<section class="panel" style="margin-bottom:16px"><h2>Coach targets · ${kind === 'fa' ? 'free agents' : 'trades'}</h2><div class="subtabs" style="margin-bottom:8px">${Object.entries(TARGET_TABS).map(([k, n]) => `<button class="sm ${tab === k ? 'primary' : ''}" data-tgttab="${k}">${esc(n)}</button>`).join('')}</div>${goal}<p class="muted" style="margin-top:-4px">Fill your needs, fit the coach's systems, suit your ${MODE_LABEL[t.mode].toLowerCase()} timeline${kind === 'fa' ? ', and fit your budget' : ''}. No target takes a core player's spot.</p>${rows ? `<div class="tblwrap"><table><thead><tr><th class="l">Player</th>${kind === 'fa' ? '' : '<th class="l">Team</th>'}<th class="l">Pos</th><th>Age</th><th>Ovr</th><th>${dev ? 'Coach\'s read' : potHead()}</th><th>${kind === 'fa' ? 'Asking' : 'Contract'}</th><th class="l">Why</th>${kind === 'fa' ? '<th class="l">Cap fit</th>' : ''}${kind === 'fa' ? '' : '<th></th>'}</tr></thead><tbody>${rows}</tbody></table></div>` : '<p class="muted">No clear targets right now.</p>'}</section>`;
}

// v30a #9: who is buying and who is selling right now (front-office status: the same one the AI uses for its trade rules)
const BUY_ST = ['allin', 'contend', 'push', 'hopeful', 'rising'], SELL_ST = ['tank', 'rebuild', 'retool'];
function buyersSellersPanel() {
  const real = t => t.status || ({ contend: 'contend', hopeful: 'hopeful', rebuild: 'rebuild', tank: 'tank' }[t.mode]);
  const teams = L.teams.filter(t => t.id !== L.user), open = inTradeWindow(L);
  const row = t => { const k = real(t), pay = payroll(L, t), rec = t.w + t.l ? ` · ${t.w}-${t.l}` : '';
    return `<div class="leader bsrow" data-bs="${t.id}" style="grid-template-columns:minmax(0,1fr) auto;align-items:center"><span>${tlabel(t.id, true)} ${modePill(t)}<span class="muted">${rec} · payroll ${money(pay)}</span><br><span class="muted" style="font-size:12px">${esc(STATUS_WHY[k] || '')}</span></span>${L.user != null ? `<button class="sm" data-trwith="${t.id}" ${open ? '' : 'disabled'}>Trade</button>` : ''}</div>`; };
  const rk = t => BUY_ST.concat(SELL_ST).indexOf(real(t)), order = list => list.sort((a, b) => rk(a) - rk(b) || b.w - a.w);
  const buyers = order(teams.filter(t => BUY_ST.includes(real(t)))), sellers = order(teams.filter(t => SELL_ST.includes(real(t))));
  const rest = teams.length - buyers.length - sellers.length;
  return `<section class="panel" id="bspanel" style="margin-top:16px"><h2>Buyers and sellers</h2><p class="muted" style="margin-top:-4px">Each front office's current plan. Buyers pay picks and young players for help; sellers move veterans for picks and prospects.${open ? '' : ' Trading is closed right now.'}${rest > 0 ? ` ${rest} team${rest > 1 ? 's are' : ' is'} in neither group.` : ''}</p>
  <div class="grid2e"><div><h3 style="margin-top:0">Buyers · ${buyers.length}</h3>${buyers.map(row).join('') || '<p class="muted">None.</p>'}</div><div><h3 style="margin-top:0">Sellers · ${sellers.length}</h3>${sellers.map(row).join('') || '<p class="muted">None.</p>'}</div></div></section>`;
}
function vTrades() {
  const open = inTradeWindow(L);
  const T = L.schedule.length;
  const status = open ? (L.phase === 'regular' ? `Trading is open until the deadline ${dd(deadlineDay(L)) ? 'on ' + dd(deadlineDay(L)) : 'after day ' + deadlineDay(L)} (70% mark).` : 'Trading is open.') : L.phase === 'regular' ? (L.day < tradeOpenDay(L) ? `Trading opens ${dd(tradeOpenDay(L)) ? 'on ' + dd(tradeOpenDay(L)) : 'on day ' + (tradeOpenDay(L) + 1)} (25% mark).` : 'The trade deadline (70% mark) has passed. Trading reopens in the offseason.') : 'Trading is closed during the playoffs. It reopens in the offseason.';
  let builder = '';
  if (L.user != null) {
    const others = L.teams.filter(t => t.id !== L.user);
    if (ui.tradeWith == null) ui.tradeWith = others[0].id;
    const B = L.teams[ui.tradeWith];
    builder = `<section class="panel" style="margin-bottom:16px"><h2>Trade center</h2><p class="muted" style="margin-top:-4px"><span class="tipword" title="Rosters must stay between 13 and 15 in season, and no team can go over the ${money(CAP)} hard cap.">${status}</span> Mark players on My Team as <strong>Shop</strong> (on the trading block) to draw offers for them, or <strong>Untouchable</strong> to keep teams from asking (⋯ menu on the roster row, or his player page).</p>
    <div class="row" style="margin-bottom:12px"><label>Trade with <select id="tw">${others.map(t => `<option value="${t.id}" ${t.id === ui.tradeWith ? 'selected' : ''}>${esc(tname(t.id))} · ${MODE_LABEL[t.mode]}</option>`).join('')}</select></label>${modePill(B)} ${foChip(B)} <span class="muted">Their payroll ${money(payroll(L, B))} · yours ${money(payroll(L, L.teams[L.user]))}</span></div>
    <div class="tbuild"><div><h3>You give</h3>${assetList(L.user, ui.tGive, 'give')}</div><div><h3>You get from ${esc(B.abbr)}</h3>${assetList(B.id, ui.tGet, 'get')}</div></div>${stepienNote()}${tradeProjection()}${(ui.tGive.players.length || ui.tGive.picks.length || ui.tGet.players.length || ui.tGet.picks.length) ? getsLines(B.id, L.user, ui.tGive, ui.tGet) : ''}${ui.tGet.players.length ? `<div class="panel" style="margin-top:8px;padding:8px 12px">${ui.tGet.players.map(id => `<div class="muted">${physicalLine(L.players[id])}</div>`).join('')}</div>` : ''}
    <div class="row" style="margin-top:12px"><button class="primary" id="propose" ${open && !stepienBlocked() ? '' : 'disabled'}>Propose trade</button><button id="askprops" ${open && ui.tGive.players.length ? '' : 'disabled'} title="Check players on your side, then ask the league what they'd give">Ask for proposals for my selected player${ui.tGive.players.length > 1 ? 's' : ''}</button><button id="tclear">Clear</button></div>
    ${ui.tradeMsg ? `<div class="msg ${ui.tradeMsg.ok ? 'ok' : 'no'}">${esc(ui.tradeMsg.msg)}${ui.tradeMsg.ok && !ui.tradeMsg.done && !/completed|^Undone/.test(ui.tradeMsg.msg) ? ' <button class="primary sm" id="tconfirm">Complete trade</button>' : ui.tradeMsg.suggest ? ` <button class="sm" id="tsuggest">Add ${esc(ui.tradeMsg.suggest.name)}</button>` : ''}</div>` : ''}${proposalsPanel()}<details class="about"><summary>How this works</summary><p>Picks are valued on the rosters after the trade, so a tanking team that adds a star sees its own picks drop. Front offices differ (pick lovers, win-now), and sellers ask less when a star asked out, has 1 year left, or is old for a rebuilding team.</p><p>Teams value picks on a curve with big drops after #5, #14 and #45, so one top pick is worth far more than several mid ones. Future picks are valued from a projected range (shown with a tier) that follows team status, roster and record. Packages of several assets count for less than one great asset: the best piece counts in full, the next at 80%, then 60% and 40%. You can add up to $5M in cash each way per season (it counts in that season's profit), and add a top-N protection to a 1st you send: if it lands inside the protected slots it rolls to next year's pick, and after two rolls becomes a 2nd.</p></details></section>`;
  }
  const pend = L.mode === 'commish' ? `<section class="panel" style="margin-bottom:16px"><h2>Trades awaiting review</h2><p class="muted" style="margin-top:-4px"><span class="tipword" title="Agreed trades go through at the next sim step unless you veto them.">${status}</span></p>${(L.pending || []).length ? L.pending.map(tr => `<div class="panel pending" style="margin-bottom:8px"><div>${tlink(tr.a, true)} get <strong>${giveLinks(tr.bGive)}</strong></div><div>${tlink(tr.b, true)} get <strong>${giveLinks(tr.aGive)}</strong></div><div class="row" style="margin-top:8px"><span class="muted">${MODE_LABEL[L.teams[tr.a].mode]} ↔ ${MODE_LABEL[L.teams[tr.b].mode]}</span><button class="danger" data-veto="${tr.id}">Veto</button></div></div>`).join('') : '<p class="muted">No trades waiting.</p>'}</section>` : '';
  // v30a #4: completed trades filter: player-player (no picks), pick-pick (no players), mix (players on one side and picks on the other, or both)
  const trKind = t => { const sides = [t.aIn, t.bIn, t.cIn].filter(Boolean); if (!t.aIn || !t.bIn) return ''; const pl = sides.some(x => (x.players || []).length), pk = sides.some(x => (x.picks || []).length); return pl && pk ? 'mix' : pl ? 'pp' : pk ? 'kk' : ''; };
  const TRF = [['', 'All'], ['pp', 'Player-player'], ['kk', 'Pick-pick'], ['mix', 'Mix']];
  const trCnt = k => L.trades.filter(t => !k || trKind(t) === k).length;
  if (!TRF.some(x => x[0] === ui.trF)) ui.trF = '';
  const hist = L.trades.filter(t => !ui.trF || trKind(t) === ui.trF).slice(0, 60);
  const trFbar = `<div class="row" id="trfbar" style="margin-bottom:10px">${TRF.map(([k, n]) => `<button class="sm chipbtn ${ui.trF === k ? 'primary' : ''}" data-trf="${k}" title="${k === 'pp' ? 'Players only, no picks' : k === 'kk' ? 'Picks only, no players' : k === 'mix' ? 'Players and picks in the same deal' : 'Every trade'}">${n} · ${trCnt(k)}</button>`).join('')}</div>`;
  const offers = L.user != null ? `<section class="panel" style="margin-bottom:16px"><h2>Offers for you</h2><label class="muted" style="font-size:13px;display:block;margin:-4px 0 8px"><input type="checkbox" data-nopause="1" ${L.pauseOffers === false ? 'checked' : ''}> Don't stop the sim for trade offers (they wait here)</label>${(L.offers || []).length ? L.offers.map(o => `<div class="panel pending" style="margin-bottom:8px"><div>${tlink(o.a, true)} ${modePill(L.teams[o.a])} offer <strong>${giveLinks(o.aGive)}</strong></div><div>for your <strong>${giveLinks(o.bGive)}</strong></div>${getsLines(o.a, L.user, o.bGive, o.aGive)}${o.why ? `<div class="why">Why: ${esc(o.why)}</div>` : ''}<div class="row" style="margin-top:8px"><button class="primary" data-accept="${o.id}">Accept</button><button data-counter="${o.id}">Negotiate</button><button data-decline="${o.id}">Decline</button><span class="muted">${o.ttl} day${o.ttl > 1 ? 's' : ''} left at most · they may withdraw</span></div></div>`).join('') : '<p class="muted">No offers right now. AI teams make offers while trading is open.</p>'}</section>` : '';
  // v28.7 U2: sub tabs (Trade center / Offers for you / Trading block / Completed trades)
  const trTabs = [['center', 'Trade center'], ...(L.user != null ? [['offers', `Offers for you${(L.offers || []).length ? ' · ' + L.offers.length : ''}`]] : []), ['block', 'Trading block'], ['done', 'Completed trades']];
  if (!trTabs.some(x => x[0] === ui.trTab)) ui.trTab = 'center';
  const trSub = `<div class="subtabs" style="margin-bottom:12px">${trTabs.map(([k, n]) => `<button class="sm ${ui.trTab === k ? 'primary' : ''}" data-trtab="${k}">${esc(n)}</button>`).join('')}</div>`;
  if (ui.trTab === 'offers') return trSub + offers;
  if (ui.trTab === 'block') return trSub + tradingBlockPanel();
  if (ui.trTab === 'center') return trSub + `${builder}${L.user != null ? trade3Panel() : ''}${L.user != null && open ? targetsPanel('trade') : ''}${buyersSellersPanel()}${pend}` + (L.user == null && !pend ? '<p class="muted">Trades between AI teams show in Completed trades.</p>' : '');
  return trSub + `<section class="panel"><h2>Completed trades</h2>${trFbar}${hist.length ? `<div class="tblwrap"><table><thead><tr><th class="l">When</th><th class="l">Team</th><th class="l">Got</th><th class="l">Team</th><th class="l">Got</th></tr></thead><tbody>${hist.map(t => `<tr><td class="l">${seasonName(t.s)} ${esc(t.when)}</td><td class="l">${tlink(t.a)}</td><td class="l wrap">${t.aIn ? giveLinks(t.aIn, t.aIn.picks) : esc(t.aGets)}</td><td class="l">${tlink(t.b)}</td><td class="l wrap">${t.bIn ? giveLinks(t.bIn, t.bIn.picks) : esc(t.bGets)}</td></tr>${t.multi ? `<tr><td class="l muted">3-team</td><td class="l">${tlink(t.c)}</td><td class="l wrap" colspan="3">${t.cIn ? giveLinks(t.cIn, t.cIn.picks) : esc(t.cGets)}</td></tr>` : ''}${t.why || t.grades || t.wu ? `<tr><td></td><td class="l muted" colspan="4" style="font-size:12px"><div class="whyrow">${wuHtml(t.wu)}${t.grades ? `How each side saw it: ${L.teams[t.a].abbr} ${t.grades.a}, ${L.teams[t.b].abbr} ${t.grades.b}${t.multi ? `, ${L.teams[t.c].abbr} ${t.grades.c}` : ''}. ` : ''}${esc(t.why || '')}</div></td></tr>` : ''}`).join('')}</tbody></table></div>` : `<p class="muted">${ui.trF ? 'No trades of this kind yet.' : 'No trades yet.'}</p>`}</section>`;
}

// ---------- free agency ----------
function vFA() {
  // v30a #12: "Can afford" = his asking price fits the largest offer you can make (cap room, or the mid-level); minimum deals always fit
  const roomNow = L.user != null ? faRoom(L, L.teams[L.user]) : 0, canAff = p => (p.ask || p.mval || MINSAL) <= Math.max(MINSAL, roomNow) + 1e-6;
  const fas = L.fa.map(id => L.players[id]).filter(p => p && !p.retired && !(ui.faHideRook && L.user != null && hiddenFor(L, p)) && !(ui.faAfford && L.user != null && !canAff(p)));
  const key = ui.faSort;
  fas.sort((a, b) => key === 'ask' ? (b.ask || 0) - (a.ask || 0) : key === 'age' ? a.age - b.age : ovrNum(b) - ovrNum(a));
  let resign = '';
  if (L.user != null && L.phase === 'off-resign') {
    const ps = (L.resign || []).map(id => L.players[id]);
    const tos = (L.teamOptions || []).map(id => L.players[id]);
    if (tos.length) resign += `<section class="panel" style="margin-bottom:16px"><h2>Team option decisions</h2>${tos.map(p => `<div class="check"><span class="grow">${plink(p)} <span class="muted">${posLabel(p)} · ${p.age} · ${ovrTxt(p)} · option ${money(p.contract.amt)} · market ${money(p.mval)}</span></span><button class="sm primary" data-topt="${p.id}" data-ex="1">Exercise</button><button class="sm" data-topt="${p.id}" data-ex="0">Decline</button></div>`).join('')}</section>`;
    resign += `<section class="panel" style="margin-bottom:16px"><h2>Your expiring contracts</h2>${ps.length ? `<div class="tblwrap"><table class="sortable" data-sid="resign"><thead><tr><th class="l">Player</th><th class="l">Pos</th><th class="l">Type</th><th>Age</th><th>Ovr</th><th>${potHead()}</th><th>Last deal</th><th>Market</th><th>Asking</th><th></th></tr></thead><tbody>${ps.map(p => `<tr class="click" data-player="${p.id}"><td class="l">${esc(p.name)}${p.draftTid === L.user ? ' <span class="pill pos">Drafted</span>' : ''}</td><td class="l">${posLabel(p)}</td><td class="l muted">${esc(archLabel(p))}</td><td>${p.age}</td><td>${ovrTxt(p)}</td><td>${potCell(p)}</td><td>${p.contract ? money(p.contract.amt) : '—'}</td><td>${money(p.mval)}</td><td>${money(p.ask)}</td><td><button class="sm">Negotiate</button> <button class="sm" data-snt="${p.id}" title="Re-sign him and trade him to a team he'd sign with">Sign-and-trade</button></td></tr>`).join('')}</tbody></table></div>` : '<p class="muted">All set.</p>'}<p class="muted" style="margin:8px 0 0">Open a player to negotiate. Anyone you don't re-sign becomes a free agent when free agency opens.</p></section>`;
  }
  const canSign = L.user != null && ['regular', 'off-fa', 'off-ready', 'off-resign', 'off-review', 'off-lottery', 'off-draft'].includes(L.phase);
  const cuSet = new Set(L.user != null ? pipeCallable(L).map(x => x.id) : []);
  const rows = fas.map(p => `<tr class="click" data-player="${p.id}" ${frow(p)}><td class="l">${esc(p.name)}${injPill(p)}${scoutPill(p)}${clubChip(p)}</td><td class="l">${posLabel(p)}</td><td class="l muted">${esc(archLabel(p))}</td><td class="l muted" title="${esc(PERS[p.pers] || '')}">${esc(persShort(p))}</td><td>${p.age}</td><td><strong>${ovrTxt(p)}</strong></td><td>${potCell(p)}</td><td>${money(p.mval || MINSAL)}</td><td>${money(p.ask || MINSAL)}</td>${canSign ? `<td><button class="sm">Offer</button>${cuSet.has(p.id) ? ` <button class="sm primary" data-callup="${p.id}">Call up</button>` : ''}</td>` : ''}</tr>`).join('');
  const r2n = (L.r2Pending || []).length;
  // v28.7 U3: cap space | coach's position read, then front office needs | coach targets; Free agents now / Upcoming as sub tabs
  const ut = L.user != null ? L.teams[L.user] : null, tg = ut && L.fa.length ? targetsPanel('fa', true) : '';
  const mine = ut ? `<div class="grid2e fa-top">${myCapPanel(true)}${positionReadPanel(ut)}</div><div class="grid2e fa-top">${needsBlock(ut)}${tg || '<div></div>'}</div>` : '';
  // v28.7 P1: three pages: Overview (cap, coach read, needs, targets, re-signs, around the league) / Free agents / Upcoming free agents
  if (!['over', 'now', 'up'].includes(ui.faTab) || (ui.faTab === 'over' && L.user == null)) ui.faTab = L.user != null ? 'over' : 'now';
  const r2note = r2n ? `<div class="note">You have ${r2n} unsigned draft pick${r2n > 1 ? 's' : ''} on the <a class="lk" href="#draft">Draft</a> tab.</div>` : '';
  if (ui.faTab === 'over') return `${phaseNote()}${faToggle()}${faEndBar()}${r2note}${resign}${mine}${faAround()}`;
  if (ui.faTab === 'up') return `${phaseNote()}${faToggle()}${faEndBar()}${upcomingFA()}`;
  return `${phaseNote()}${faToggle()}${faEndBar()}${resign && L.phase === 'off-resign' ? `<div class="note">Re-sign decisions are on the <a class="lk" data-fav="over">Overview</a> page.</div>` : ''}<section class="panel"><h2>Free agents · ${fas.length}</h2><details class="about"><summary>How this works</summary><p>${L.phase === 'off-fa' ? `Day ${L.faDay} of 10. ` : ''}Undrafted players and second-round picks who weren't signed are here too. Asking prices fall the longer a player goes unsigned. A good player who signs well below his value only takes a 1-year deal so he can test the market again.${L.user != null ? ' Open a player to make an offer.' : ''}</p></details>
  <div class="filters"><label>Sort <select id="fas"><option value="ovr" ${key === 'ovr' ? 'selected' : ''}>Overall</option><option value="ask" ${key === 'ask' ? 'selected' : ''}>Asking price</option><option value="age" ${key === 'age' ? 'selected' : ''}>Youngest</option></select></label>${L.user != null ? `<label style="margin-left:12px"><input type="checkbox" data-hiderook="1" ${ui.faHideRook ? 'checked' : ''}> Hide unrevealed rookies</label><label style="margin-left:12px" title="Only players whose asking price fits the biggest offer you can make now (${money(Math.max(MINSAL, roomNow))}). Minimum-salary players always fit."><input type="checkbox" data-faafford="1" ${ui.faAfford ? 'checked' : ''}> Can afford (up to ${money(Math.max(MINSAL, roomNow))})</label>` : ''}</div>
  ${fbar('fa')}<div class="tblwrap"><table class="sortable" data-sid="fa" data-flist="fa"><thead><tr><th class="l">Player</th><th class="l">Pos</th><th class="l">Type</th><th class="l">Personality</th><th>Age</th><th>Ovr</th><th>${potHead()}</th><th>Market</th><th>Asking</th>${canSign ? '<th class="nosort"></th>' : ''}</tr></thead><tbody>${rows || '<tr><td class="l muted" colspan="8">No free agents.</td></tr>'}</tbody></table></div></section>`;
}

// Your cap situation and what the front office wants, shown while you shop
// v17: payroll, money held by pending free-agent offers, and room left
function capLockBar(t, pay) {
  const off = Object.entries(L.faOffers || {}).map(([id, o]) => ({ p: L.players[id], o })).filter(x => x.p);
  const lock = off.reduce((a, x) => a + x.o.amt, 0); if (!lock && L.phase !== 'off-fa') return '';
  const left = CAP - pay - lock, W = v => Math.max(0, Math.min(100, v / CAP * 100));
  return `<div style="display:flex;height:14px;border-radius:7px;overflow:hidden;background:#e8e6dc;margin:6px 0 4px" title="Payroll · locked in offers · room left"><i style="width:${W(pay)}%;background:#5b6b7a"></i><i style="width:${W(lock)}%;background:#e8a317"></i><i style="width:${W(Math.max(0, left))}%;background:#3aa060"></i></div>
  <div style="font-size:13px;margin-bottom:6px"><span style="color:#5b6b7a">■</span> Payroll ${money(pay)} · <span style="color:#c98a00">■</span> Locked in offers <strong>${money(lock)}</strong> · <span style="color:${left < 0 ? '#c0392b' : '#3aa060'}">■</span> ${left < 0 ? 'Over by ' + money(-left) : 'Room after offers ' + money(left)}${off.length ? `<div class="muted">${off.map(x => `${esc(x.p.name)} ${money(x.o.amt)}`).join(' · ')}</div>` : ''}</div>`;
}
function myCapPanel(capOnly) {
  const t = L.teams[L.user], cs = capSeason(L), pay = payroll(L, t), room = Math.max(0, CAP - pay);
  const [lo, hi] = rosterBounds(L);
  const cov = coverage(L, t);
  const cap = `<div class="panel"><h3>${esc(t.abbr)} cap space · ${cs === L.season ? 'this season' : 'next season'}</h3>${capLockBar(t, pay)}<div class="row" style="justify-content:space-between"><strong style="font-size:20px">${money(room)} room</strong><span class="muted">payroll ${money(pay)} of ${money(CAP)}</span></div><div class="capbar"><i class="${pay > CAP ? 'over' : ''}" style="width:${Math.min(100, pay / CAP * 100)}%"></i></div>
  <div class="kv"><span class="k2">Roster</span><span>${t.roster.length} players · ${L.phase === 'regular' ? `13–15 in season` : `13–15 by opening day`}${t.roster.length >= 15 ? ' · <span class="warn">full: release someone to sign</span>' : ''}</span><span class="k2">Largest non-minimum offer</span><span>${faRoom(L, t) >= 1.5 ? money(faRoom(L, t)) + (pay >= CAP ? ' (mid-level exception)' : '') : 'Minimum contracts only'}</span><span class="k2">Owner's spending limit</span><span>${money(t.owner.limit)}${pay > t.owner.limit ? ' <span class="lo">over: he won\'t be happy</span>' : ''}</span><span class="k2">Payroll floor</span><span>${pay >= MINPAY ? 'Met' : `${money(MINPAY - pay)} short of ${money(MINPAY)}`}</span><span class="k2">Position coverage</span><span>${POS.map((x, i) => `<span class="${cov[i] < 2 ? 'lo' : ''}">${x} ${cov[i]}</span>`).join(' · ')}</span></div>${contractList(t)}</div>`;
  return capOnly ? cap : `<div class="grid2e" style="margin-bottom:16px">${cap}${needsBlock(t)}</div>`;
}
const FA_WHY_LABEL = { money: 'Paid the most', loyal: 'Loyalty', winner: 'Chasing a title', role: 'Top option', market: 'Big market', fit: 'Best fit' };
function faAround() {
  const rs = (L.rumors || []).filter(r => r.k === 'fa' && r.s === L.season && L.players[r.pid]).slice(0, 8);
  const ds = Object.entries(L.faWhy || {}).filter(([id, x]) => x.s === L.season && L.players[id]).slice(-8).reverse();
  if (!rs.length && !ds.length) return '';
  const badge = r => r.hit > 0 ? '<span class="pill pos">Right</span>' : r.hit < 0 ? '<span class="pill neg">Wrong</span>' : '<span class="pill">Open</span>';
  return `<section class="panel" style="margin-bottom:16px"><h3>Around the league</h3><div class="grid2e"><div><div class="k">Rumors</div>${rs.length ? rs.map(r => `<div class="check"><span class="grow">${plink(L.players[r.pid])} <span class="muted">meeting with</span> ${(r.fa || []).map(t => tlabel(t, true)).join(', ') || '<span class="muted">a few teams</span>'}</span>${badge(r)}</div>`).join('') : '<p class="muted">None.</p>'}</div><div><div class="k">Decisions</div>${ds.length ? ds.map(([id, x]) => `<div class="check"><span class="grow">${plink(L.players[id])} <span class="muted">→</span> ${tlabel(x.tid, true)}</span><span class="pill">${esc(FA_WHY_LABEL[x.why] || x.why)}</span></div>`).join('') : '<p class="muted">None yet.</p>'}</div></div></section>`;
}
// v30a #14: same as the header's "Sim to end of free agency" (it already stops when a player wants to talk), placed on the Free agency page
function faEndBar() {
  if (L.phase !== 'off-fa') return '';
  return `<div class="note" style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><button class="sm primary" id="fa-end" ${ui.busy ? 'disabled' : ''}>Sim to end of free agency</button><span class="muted">Day ${L.faDay} of 10. Stops early if a player wants to talk to you.</span></div>`;
}
document.addEventListener('click', e => { const b = e.target.closest('#fa-end'); if (!b || !L) return; const h = document.querySelector('#simctl [data-sim="faend"]'); if (h && !h.disabled) h.click(); });
function faToggle() { const b = (k, n) => `<button class="sm ${ui.faTab === k ? 'primary' : ''}" data-fav="${k}">${n}</button>`; return `<div class="subtabs" style="margin-bottom:12px">${L.user != null ? b('over', 'Overview') : ''}${b('now', `Free agents · ${L.fa.length}`)}${b('up', 'Upcoming free agents')}</div>`; }
function upcomingFA() {
  const cs = capSeason(L);
  const ps = Object.values(L.players).filter(p => p.team != null && p.contract && !p.ext && (p.contract.exp === cs || (p.contract.opt && p.contract.exp === cs + 1))).sort((a, b) => ovrNum(b) - ovrNum(a));
  const kind = p => p.contract.exp === cs ? (p.contract.type === 'rookie' ? 'Rookie deal ends' : 'Expiring') : p.contract.opt === 'PO' ? 'Player option' : 'Team option';
  return `<section class="panel"><h2>Upcoming free agents · ${ps.length}</h2><p class="muted" style="margin-top:-4px"><span class="tipword" title="Players whose deals end after ${cs === L.season ? 'this season' : 'next season'}, plus players whose final year is an option that could make them free agents. Players who already signed an extension are left out.">Contracts ending after ${seasonName(cs)}</span></p>
  ${fbar('ufa')}<div class="tblwrap"><table class="sortable" data-sid="ufa" data-flist="ufa"><thead><tr><th class="l">Player</th><th class="l">Team</th><th class="l">Pos</th><th>Age</th><th>Ovr</th><th>${potHead()}</th><th>Salary</th><th class="l">Status</th><th class="l">Personality</th></tr></thead><tbody>${ps.map(p => `<tr class="click" data-player="${p.id}" ${frow(p)}><td class="l">${esc(p.name)}${injPill(p)}${scoutPill(p)}</td><td class="l">${tlabel(p.team)}</td><td class="l">${posLabel(p)}</td><td>${p.age}</td><td><strong>${ovrTxt(p)}</strong></td><td>${potCell(p)}</td><td>${money(p.contract.amt)}</td><td class="l">${kind(p)}</td><td class="l muted">${esc(persShort(p))}</td></tr>`).join('') || '<tr><td class="l muted" colspan="9">None.</td></tr>'}</tbody></table></div></section>`;
}
// ---------- draft ----------
function sntDialog(pid) {
  const p = L.players[pid], list = sntOffers(L, pid);
  dialog(`<h2>Sign-and-trade: ${esc(p.name)}</h2><p class="muted">He'd re-sign with you (about ${money(sntTerms(L, p).amt)}/yr) and be traded right away to a team he's willing to join. You get assets back instead of losing him for nothing.</p>${list.length ? list.map((o, i) => `<div class="panel pending" style="margin-bottom:8px"><div>${tlabel(o.a, true)} send <strong>${giveLinks(o.aGive)}</strong></div><div class="why">${esc(o.why)}</div><div class="row" style="margin-top:8px"><button class="primary sm" data-sntok="${i}">Do the sign-and-trade</button></div></div>`).join('') : '<p>No team is interested on those terms, or none he\'d agree to join has the cap room.</p>'}<div class="row" style="margin-top:12px"><button id="x-close">Close</button></div>`, 'wide');
  $('#x-close').onclick = closeDialog;
  document.querySelectorAll('[data-sntok]').forEach(b => b.onclick = () => { const o = list[+b.dataset.sntok]; const err = doSignAndTrade(L, o); if (typeof err === 'string') { alertMsg(err); return; } closeDialog(); save(); render(); alertMsg(`${p.name} was re-signed and traded to ${tname(o.a)}.`); });
}
function draftTerms(p) { return p.draft && p.draft.rd === 1 ? `3 yr, ${money(rookieScale(1, p.draft.no, L.teams.length))}/yr` : `2 yr, ${money(MINSAL)}/yr, team option yr 2`; }
function draftSignDialog() {
  const r2 = (L.r2Pending || []).map(id => L.players[id]).filter(Boolean); if (!r2.length || L.user == null) return;
  dialog(`<h2>Sign your draft picks?</h2><p class="muted">The draft is done. Choose who gets a contract. Teams almost always sign first-round picks. Second-rounders can also take a 2-year two-way deal.</p><div class="tblwrap"><table><thead><tr><th class="l">Player</th><th>Pick</th><th class="l">Pos</th><th>Age</th><th>Ovr</th><th>${potHead()}</th><th class="l">Contract</th><th></th></tr></thead><tbody>${r2.map(p => `<tr><td class="l">${plink(p)}</td><td>${p.draft ? p.draft.rd + '-' + p.draft.no : ''}</td><td class="l">${posLabel(p)}</td><td>${p.age}</td><td>${ovrTxt(p)}</td><td>${potCell(p)}</td><td class="l">${draftTerms(p)}</td><td><button class="sm primary" data-ds="${p.id}" data-sg="1">Sign</button> ${p.draft && p.draft.rd === 2 ? `<button class="sm" data-ds="${p.id}" data-sg="tw" title="2-year two-way deal (uses one of your 2 two-way slots)">Two-way</button> ` : ''}<button class="sm" data-ds="${p.id}" data-sg="0">Don't sign</button></td></tr>`).join('')}</tbody></table></div><div id="ds-msg"></div><div class="row" style="margin-top:12px"><button class="primary" id="ds-all">Sign all</button><button id="x-close">Decide later</button></div>`, 'wide');
  $('#x-close').onclick = closeDialog;
  const after = err => { save(); render(); if (err) { $('#ds-msg').innerHTML = `<div class="msg no">${esc(err)}</div>`; return; } if ((L.r2Pending || []).length) draftSignDialog(); else closeDialog(); };
  $('#ds-all').onclick = () => { let err = null; for (const id of (L.r2Pending || []).slice()) { err = decideSecondRounder(L, id, true) || err; } after(err); };
  document.querySelectorAll('[data-ds]').forEach(b => b.onclick = () => after(decideSecondRounder(L, +b.dataset.ds, b.dataset.sg === 'tw' ? 'tw' : b.dataset.sg === '1')));
}
// v30a #17: one reminder after the college / pro-league seasons are simmed (right after the Finals), before the draft
function pipeDoneDialog() {
  const S = L.season, H = (L.pipeHist || {})[S]; if (!H) return;
  const champ = PIPE_LGS.filter(lg => H[lg] && H[lg].ch != null).map(lg => `<div class="leader" style="grid-template-columns:minmax(0,1fr) auto"><span>${esc(PIPE_LG[lg].name)}</span><span>${pipeTl(lg, H[lg].ch, true)}</span></div>`).join('');
  const mv = Object.values(L.players).filter(p => p.prospect && !p.retired && p.draftYear === S && p.stock && p.stock.s === S && p.stock.d);
  const up = mv.filter(p => p.stock.d > 0).sort((a, b) => b.stock.d - a.stock.d).slice(0, 4), dn = mv.filter(p => p.stock.d < 0).sort((a, b) => a.stock.d - b.stock.d).slice(0, 4);
  const mvRow = (p, sg) => `<div class="leader" style="grid-template-columns:minmax(0,1fr) auto"><span>${plink(p)} <span class="muted">${posLabel(p)}</span></span><span class="${sg > 0 ? 'fx-up' : 'fx-dn'}">${sg > 0 ? '+' : '\u2212'}${Math.abs(p.stock.d)} read</span></div>`;
  dialog(`<h2>Pipeline seasons are done</h2><p>College and pro-league seasons are finished. Scouts have updated their reads from the stats, so check your board before the ${draftLabel(S)} draft.</p>
  ${champ ? `<h3 style="margin:8px 0 4px">Champions</h3>${champ}` : ''}
  ${up.length ? `<h3 style="margin:8px 0 4px">Stock up (${draftLabel(S)} class)</h3>${up.map(p => mvRow(p, 1)).join('')}` : ''}
  ${dn.length ? `<h3 style="margin:8px 0 4px">Stock down</h3>${dn.map(p => mvRow(p, -1)).join('')}` : ''}
  <div class="row" style="margin-top:12px"><button class="primary" id="pd-board">Open draft board</button><button id="pd-pipe">Open Pipeline</button><button id="x-close">Later</button></div>`);
  $('#x-close').onclick = closeDialog;
  $('#pd-board').onclick = () => { closeDialog(); ui.dpage = 'over'; ui.dtab = 'board'; ui.cls = S; location.hash = '#draft'; render(); };
  $('#pd-pipe').onclick = () => { closeDialog(); location.hash = '#pipeline'; render(); };
}
function maybeDraftDialog(ph0) { if (ph0 === 'off-draft' && L.phase !== 'off-draft' && L.user != null && (L.r2Pending || []).length) queueDialog(draftSignDialog); maybeOptionsDialog(); }
// v23: one popup at the start of the re-signing window: your players' option decisions and your team-option decisions
function maybeOptionsDialog() {
  const o = L.optSum; if (L.user == null || L.phase !== 'off-resign' || !o || o.s !== L.season || o.shown) return;
  if (!o.po.length && !(L.teamOptions || []).length) return;
  o.shown = true; queueDialog(optionsDialog);
}
function optionsDialog() {
  const o = L.optSum || { po: [] }, tos = (L.teamOptions || []).map(id => L.players[id]).filter(Boolean);
  const nx = seasonName(L.season + 1);
  const poRows = o.po.map(x => { const p = L.players[x.id]; return `<div class="check"><span class="grow">${plink(p)} <span class="muted">${posLabel(p)} · ${p.age} · ${ovrTxt(p)}</span><br>${x.out ? `<strong>Opted out</strong> of ${money(x.amt)} for ${nx} (market value ${money(x.mval)}). He's on your re-signing list.` : `<strong>Opted in</strong>: stays at ${money(x.amt)} for ${nx}.`}</span>${x.out && (L.resign || []).includes(p.id) ? `<button class="sm" data-optgo="${p.id}">Re-sign talks</button>` : ''}</div>`; }).join('');
  const toRows = tos.map(p => `<div class="check" id="to-${p.id}"><span class="grow">${plink(p)} <span class="muted">${posLabel(p)} · ${p.age} · ${ovrTxt(p)} · option ${money(p.contract.amt)} for ${nx} · market ${money(p.mval)}</span></span><button class="sm primary" data-dto="${p.id}" data-ex="1">Exercise</button><button class="sm" data-dto="${p.id}" data-ex="0">Decline</button></div>`).join('');
  dialog(`<h2>Contract options</h2>${o.po.length ? `<h3>Player options (his choice)</h3>${poRows}` : ''}${tos.length ? `<h3 style="margin-top:12px">Team options (your choice)</h3><p class="muted" style="margin-top:-4px">Decline and he becomes a free agent; you can still try to re-sign him. Options you don't decide are exercised when free agency opens.</p>${toRows}` : ''}<div class="row" style="margin-top:12px"><button class="primary" id="x-close">Done</button></div>`, 'wide');
  $('#x-close').onclick = closeDialog;
  document.querySelectorAll('[data-dto]').forEach(b => b.onclick = () => { const p = L.players[+b.dataset.dto], ex = b.dataset.ex === '1'; decideTeamOption(L, p.id, ex); save(); render(); const r = document.getElementById('to-' + p.id); if (r) r.innerHTML = `<span class="grow">${esc(p.name)}: option ${ex ? 'exercised' : 'declined; he\'s on your re-signing list'}.</span>`; });
  document.querySelectorAll('[data-optgo]').forEach(b => b.onclick = () => { closeDialog(); backStack.push({ view: ui.view }); ui.player = +b.dataset.optgo; render(); });
}
// v23: a few days before the regular season ends: two-way players can't play in the playoffs unless converted
function twoWayPoDialog() {
  L.twWarned = L.season;
  const t = L.teams[L.user], tws = twOf(L, t).sort((a, b) => b.ovr - a.ovr), cs = capSeason(L);
  const ros = rosterOf(L, t).slice().sort((a, b) => a.ovr - b.ovr), low = ros[0], full = t.roster.length >= 15;
  const cut = ros.map(p => `<option value="${p.id}">${esc(p.name)} (${p.ovr}) · ${money(p.contract ? p.contract.amt : 0)} thru ${p.contract ? seasonName(p.contract.exp) : '—'} · ${p.contract && capHit(L, p, cs) > 0 ? `dead money ${money(capHit(L, p, cs))}/yr` : 'no dead money'}</option>`).join('');
  const row = p => `<div class="panel" style="margin-bottom:8px" id="tw-${p.id}"><div>${plink(p)} <span class="muted">${posLabel(p)} · ${p.age} · ${ovrTxt(p)} · ${p.tw.games}/${TW_GAMES} games</span>${low ? ` <span class="muted">· your lowest-rated player: ${esc(low.name)} (${low.ovr})</span>` : ''}</div>
    <div class="row" style="margin-top:6px">${full ? `<label>Release <select data-twcut="${p.id}">${cut}</select></label><button class="sm primary" data-twconv="${p.id}">Release and convert</button>` : `<button class="sm primary" data-twconv="${p.id}">Convert (${money(MINSAL)}, 2 years, team option on year 2)</button>`}</div></div>`;
  dialog(`<h2>Two-way players and the playoffs</h2><p>The regular season ends in ${L.schedule.length - L.day} days. Two-way players can't play in the playoffs unless you convert them to a standard deal, and conversions close when the regular season ends.${full ? ' Your roster is full (15), so converting means releasing someone; his remaining salary stays on your cap as dead money until his deal ends, unless another team signs him.' : ''}</p>${tws.map(row).join('')}<div id="tw-msg"></div><div class="row"><button id="x-close">Skip</button></div>`, 'wide');
  $('#x-close').onclick = closeDialog;
  document.querySelectorAll('[data-twconv]').forEach(b => b.onclick = () => {
    const p = L.players[+b.dataset.twconv], sel = document.querySelector(`[data-twcut="${p.id}"]`);
    if (sel) { const c = L.players[+sel.value]; const blk = releaseBlock(L, c); if (blk) { $('#tw-msg').innerHTML = `<div class="msg no">${esc(blk)}</div>`; return; } release(L, c); }
    const err = convertTwoWay(L, p); if (err) { $('#tw-msg').innerHTML = `<div class="msg no">${esc(err)}</div>`; save(); render(); return; }
    save(); render(); const r = document.getElementById('tw-' + p.id); if (r) r.innerHTML = `<div>${esc(p.name)} converted${sel ? ` (released ${esc(L.players[+sel.value].name)})` : ''}. He's eligible for the playoffs.</div>`;
    // the other two-way's choices change once a spot is used
    if (document.querySelector('[data-twconv]') && !sel && t.roster.length >= 15) { closeDialog(); setTimeout(twoWayPoDialog, 0); }
  });
  save();
}
// Your scouting director's board for a class, next to the league mock draft, with reasons and realistic targets
// Director's take: short tags, most important first
function boardReason(p, br, mr, e) {
  const t = L.teams[L.user], why = [], cons = p.scout, diff = mr - br;
  why.push(diff >= 4 ? `+${diff} vs consensus` : diff <= -4 ? `${diff} vs consensus` : 'Near consensus');
  if (Math.abs(e.est - cons) >= 3) why.push(`Ceiling ${e.est} (cons ${cons})`);
  const nm = needMult(L, t, p); if (nm >= 1.3 && p.arch && p.arch[0]) why.push(`Need: ${p.arch[0].n} ${p.arch[0].p}`);
  const iv = myInterview(p); if (iv && iv.work < 45) why.push('Work-ethic flag'); if (p.dur <= 45 && traitLevel(p, 'ipt') >= 2) why.push('Durability flag');
  if ((t.mode === 'tank' || t.mode === 'rebuild') && p.age <= 19) why.push('Long runway');
  if ((t.mode === 'contend' || t.mode === 'hopeful') && p.ovr >= 55) why.push('Helps now');
  return why.join(' · ');
}
function boardPanel(d) {
  const t = L.teams[L.user], sc = t.scout;
  const board = draftBoard(L, L.user, d), mock = mockOrder(L, d);
  if (!board.length) return '';
  const mrank = p => mockRanksOf(L, p).c || mock.findIndex(x => x.id === p.id) + 1;
  const mcols = p => { const r = mockRanksOf(L, p), v = r.o.filter(Boolean); return `<td><strong>${r.c || '—'}</strong></td><td class="mk" data-v="${v.length ? v.reduce((a, b) => a + b, 0) / v.length : 999}" title="${esc(OUTLETS.map((o, i) => o.name + ' #' + (r.o[i] || '—')).join(' · '))}">${r.o.map(x => x || '—').join(' · ')}</td>`; };   // v37a: the three outlet ranks in one cell
  const myPicks = L.picks.filter(k => k.s === d && k.owner === L.user && !pickUsed(L, k)).sort((a, b) => a.rd - b.rd);
  const slots = myPicks.map(k => ({ k, slot: Math.round(projSlot(L, k)) + (k.rd === 2 ? L.teams.length : 0) }));
  const isTarget = p => slots.some(s => Math.abs(mrank(p) - s.slot) <= 2);
  const custom = L.myBoard && L.myBoard[d];
  // v25.1: scouting status (assignment covering him, interview) and a sortable table; the director's order stays the default
  const asg = p => { const as = (t.scoutAssign || []).filter(a => (a.k === 'pid' && a.v === p.id) || (a.k === 'nat' && a.v === p.nat) || (a.k === 'pos' && a.v === p.pos)); if (!as.length) return ''; return as.some(a => assignReady(L, a)) ? (as.some(a => a.k === 'pid') ? 'Watched' : 'Scouted') : 'Assigned'; };
  const stat = p => [asg(p), myInterview(p) ? 'Interviewed' : ''].filter(Boolean).join(' · ');
  const rows = board.slice(0, 30).map((p, i) => { const e = teamPotEst(L, L.user, p), mr = mrank(p);
    return `<tr class="click ${isTarget(p) ? 'target' : ''}" data-player="${p.id}" ${frow(p)}><td><strong>${i + 1}</strong></td>${mcols(p)}<td class="l nmc" data-v="${esc(p.name.toLowerCase())}">${esc(p.name)}${isTarget(p) ? ' <span class="pill prot" title="Scouting director target: near one of your picks">Target pick</span>' : ''}${ptagOf(L, p) ? ` <span class="pill pos" title="Your tag">${esc(PTAGS[ptagOf(L, p)])}</span>` : ''}${isWatched(L, p) ? ' <span title="On your watch list">\u2605</span>' : ''}${flagPill(p)}${stockChip(p) ? ' ' + stockChip(p) : ''}</td><td class="l">${posLabel(p)}</td><td class="l muted wrapt s">${esc(archLabel(p))}</td>${pipeSchoolTd(p).replace('<td class="l"', '<td class="l wrapt s"')}<td data-v="${p.age}">${p.age} \u00b7 ${ft(p.hgt)}</td><td>${ovrTxt(p)}</td><td>${potCell(p)}</td><td class="l muted wrapt s">${(c => c ? esc(c.name) : '—')(compFor(L, p))}</td><td class="l wrapt s" data-v="${stat(p) || 'zz'}">${stat(p) || '<span class="muted">—</span>'}</td><td class="l wrapt m">${esc(boardReason(p, i + 1, mr, e))}</td><td>${rmBtn('board', p, d)}</td></tr>`; }).join('');
  return `<section class="panel"><h2>Scouting director's board · ${draftLabel(d)} class</h2><p class="muted" style="margin-top:-4px">${sc ? `${esc(sc.name)} · scouting ${sc.rating} · eye for ${SCOUT_EYE[sc.eye].toLowerCase()}` : 'No director'} · ${slots.length ? `Your pick${slots.length > 1 ? 's' : ''}: ${slots.map(s => (s.k.rd === 1 ? 'Rd 1 ' : 'Rd 2 ') + (draftSlotOf(L, s.k) ? '#' + draftSlotOf(L, s.k).no : 'projected #' + (s.k.rd === 2 ? s.slot - L.teams.length : s.slot)) + (s.k.orig !== L.user ? ' (via ' + L.teams[s.k.orig].abbr + ')' : '')).join(', ')}. Targets are players mocked within 2 spots of your pick (consensus).` : 'You have no pick in this draft.'} ${custom ? '<strong>Custom order.</strong> <button class="sm" data-breset="' + d + '">Reset to director\'s board</button>' : 'Reorder from the \u22ef menu (Move up / down); auto-pick follows your board.'}${ui.tsorts && ui.tsorts.dboard ? ' Sorted view; <a class="lk" data-unsort="dboard">back to board order</a>.' : ''}</p>
  ${fbar('board', { sortHint: false })}<div class="tblwrap"><table class="sortable" data-sid="dboard" data-flist="board"><thead><tr><th title="Your board">Board</th><th title="Consensus of the three mock drafts">Cons</th><th title="${esc(OUTLETS.map(o => o.name + ' (' + o.short + '): ' + o.lean).join(' | '))}">${OUTLETS.map(o => o.short).join(' · ')}</th><th class="l">Prospect</th><th class="l">Pos</th><th class="l">Type</th><th class="l">School / club</th><th title="Age \u00b7 height">Age \u00b7 Ht</th><th>Ovr</th><th>${potHead()}</th><th class="l">Compares to</th><th class="l" title="Scouting assignment (Assigned = report pending; Scouted / Watched = report in) and interview">Scouting</th><th class="l nosort">Director's take</th><th class="nosort" title="Move up / down on your board, tag Target / Sleeper / Avoid, watch list">Edit</th></tr></thead><tbody>${rows}</tbody></table></div>${board.length > 30 ? `<p class="muted" style="margin:6px 0 0">Showing his top 30 of ${board.length}.</p>` : ''}</section>`;
}
function moveBoard(pid, d, dir) {
  L.myBoard = L.myBoard || {};
  const ids = draftBoard(L, L.user, d).map(p => p.id); const i = ids.indexOf(pid), j = i + dir;
  if (i < 0 || j < 0 || j >= ids.length) return;
  [ids[i], ids[j]] = [ids[j], ids[i]]; L.myBoard[d] = ids; save(); render();
}
// v32d: Draft tab > Team picks: any team's owned picks (this draft + future), with the original team, protection and swaps
function teamPicksPage() {
  const tid = ui.dpTeam != null && L.teams[ui.dpTeam] ? ui.dpTeam : (L.user != null ? L.user : 0), t = L.teams[tid]; ui.dpTeam = tid;
  const ks = L.picks.filter(k => k.owner === tid && !pickUsed(L, k)).sort((a, b) => a.s - b.s || a.rd - b.rd);
  const owed = L.picks.filter(k => k.orig === tid && k.owner !== tid && !pickUsed(L, k)).sort((a, b) => a.s - b.s || a.rd - b.rd);
  const sw = swapsOf(L, tid), traded = ks.filter(k => k.orig !== tid).length, firsts = ks.filter(k => k.rd === 1).length;
  const prot = k => !k.prot ? '<span class="muted">None</span>' : `<span class="pill pos" title="Conveys only if it lands outside the top ${k.prot}; otherwise it rolls to next year's draft">Top-${k.prot} protected</span>${k.roll ? ` <span class="muted">rolled over ${k.roll}×</span>` : ''}`;
  const rowOf = k => `<tr><td class="l"><strong>${esc(pickLabel(L, Object.assign({}, k, { prot: 0 })))}</strong></td><td>${k.rd}</td><td class="l">${k.orig === tid ? '<span class="muted">Own pick</span>' : `via ${tlabel(k.orig)}`}</td><td class="l">${prot(k)}</td><td class="l">${pickChip(k)}</td><td class="l">${k.swap ? '<span class="pill pos" title="Tied to a pick swap until the lottery">tied to a swap</span>' : ''}</td></tr>`;
  const yrsL = [...new Set(ks.map(k => k.s))];
  const body = ks.length ? yrsL.map(S => `<tr class="nosort pkhead"><td class="l" colspan="6"><strong>${draftLabel(S)} draft</strong> <span class="muted">${ks.filter(k => k.s === S).length} pick${ks.filter(k => k.s === S).length > 1 ? 's' : ''}</span></td></tr>${ks.filter(k => k.s === S).map(rowOf).join('')}`).join('') : '<tr><td class="l muted" colspan="6">No picks.</td></tr>';
  const opts = L.teams.map(x => `<option value="${x.id}" ${x.id === tid ? 'selected' : ''}>${esc(x.city + ' ' + x.name)}${x.id === L.user ? ' (you)' : ''}</option>`).join('');
  return `<section class="panel"><h2>Team picks</h2><div class="row" style="align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:8px"><label>Team <select id="dp-team">${opts}</select></label><span class="muted">${ks.length} pick${ks.length === 1 ? '' : 's'} owned · ${firsts} first-rounder${firsts === 1 ? '' : 's'} · ${traded} acquired from other teams</span></div>
  <div class="tblwrap"><table class="pk-table"><thead><tr><th class="l">Pick</th><th>Rd</th><th class="l">From</th><th class="l">Protection</th><th class="l">Value</th><th class="l">Notes</th></tr></thead><tbody>${body}</tbody></table></div>
  ${owed.length ? `<h3 style="margin-top:12px;font-size:14px">Owed to other teams</h3><div class="tblwrap"><table><tbody>${owed.map(k => `<tr><td class="l">${esc(pickLabel(L, Object.assign({}, k, { prot: 0 })))}</td><td class="l">to ${tlabel(k.owner)}</td><td class="l">${prot(k)}</td></tr>`).join('')}</tbody></table></div>` : ''}
  ${sw.length ? `<h3 style="margin-top:12px;font-size:14px">Open pick swaps</h3>${sw.map(x => `<div>${esc(swapLabel(L, x))}</div>`).join('')}` : ''}
  <p class="muted" style="font-size:12px;margin:10px 0 0">${esc(t.abbr)}: picks they own for this draft and later ones. "Value" is the projected range and tier. A protected 1st stays with the original owner if it lands inside the protected slots.</p></section>`;
}
document.addEventListener('change', e => { if (e.target && e.target.id === 'dp-team' && L) { ui.dpTeam = +e.target.value; render(); } });
function vDraft() {
  const years = Object.keys(L.classes || {}).map(Number).sort((a, b) => a - b);
  if (ui.cls == null || !years.includes(ui.cls)) ui.cls = years[0];
  if (ui.dpage === 'over' && L.phase === 'off-draft' && years.includes(L.season)) ui.cls = L.season;
  const d = ui.cls;
  const order = L.draftOrder || [];
  const live = L.phase === 'off-draft' || L.phase === 'off-lottery';
  const onClock = order[L.draftIdx];
  const myTurn = onClock && isUser(onClock.owner) && L.phase === 'off-draft' && d === L.season;
  const views = [...(L.user != null ? [['board', "Director's board"], ] : []), ['cons', 'Consensus'], ...OUTLETS.map((o, i) => ['o' + i, o.name])];
  if (!views.some(v => v[0] === ui.dtab)) ui.dtab = views[0][0];
  const ms = mockSet(L, d), oi = ui.dtab[0] === 'o' ? +ui.dtab.slice(1) : null;
  const pros = (oi != null ? ms.lists[oi] : ms.cons).map(id => L.players[id]).filter(Boolean);
  const subtabs = `<div class="subtabs">${views.map(([k, n]) => `<button class="sm ${ui.dtab === k ? 'primary' : ''}" data-dtab="${k}">${esc(n)}</button>`).join('')}</div>`;
  const tabs = years.map(y => `<button class="sm ${y === d ? 'primary' : ''}" data-cls="${y}">${draftLabel(y)} class${y === L.season && L.phase.startsWith('off') ? ' (this draft)' : ''}</button>`).join(' ');
  const stab = (() => { const k = Math.max(0, d - capSeason(L) + 1); return k <= 1 ? 'Projections are fairly stable.' : k === 2 ? 'Projections can still move.' : 'Early projections; expect big changes.'; })();
  const rows = pros.map((p, i) => { const c = compFor(L, p), r = mockRanksOf(L, p); return `<tr class="click" data-player="${p.id}" ${frow(p)}><td><strong>${i + 1}</strong></td>${oi != null ? `<td class="mk">${r.c || '—'}</td>` : ''}${OUTLETS.map((o, j) => j === oi ? '' : `<td class="mk">${r.o[j] || '—'}</td>`).join('')}<td class="l">${esc(p.name)}${stockChip(p) ? ' ' + stockChip(p) : ''}</td><td class="l">${posLabel(p)}</td><td class="l muted">${esc(archLabel(p))}</td><td class="l muted">${esc(NAT_NAME[p.nat])}</td>${pipeSchoolTd(p)}<td>${p.age}</td><td>${ft(p.hgt)}</td><td>${ovrTxt(p)}</td><td><strong>${potCell(p)}</strong></td><td class="l muted">${c ? esc(c.name) : '—'}</td>${myTurn ? `<td><button class="sm primary" data-draft="${p.id}">Draft</button></td>` : ''}</tr>`; }).join('');
  const orderHtml = order.length ? `<section class="panel"><h2>${draftLabel(L.season)} draft order</h2><div class="tblwrap"><table><thead><tr><th>Pick</th><th class="l">Team</th><th class="l">Selection</th></tr></thead><tbody>${order.map((o, i) => { const p = o.pid ? L.players[o.pid] : null; return `<tr class="${i === L.draftIdx && L.phase === 'off-draft' ? 'mine' : ''} ${p ? 'click' : ''}" ${p ? `data-player="${p.id}"` : ''}><td>${o.rd}-${o.no}</td><td class="l">${tlabel(o.owner)}${o.owner !== o.orig ? ' <span class="muted">via ' + L.teams[o.orig].abbr + '</span>' : ''}${o.rd === 1 && o.group ? (o.group === 'lottery' ? ` <span class="pill pos">Lottery pick</span> <span class="muted">(pre-lottery #${o.preRank})</span>` : ` <span class="muted">(${o.group})</span>`) : ''}${!p && L.user != null && inTradeWindow(L) ? (() => { const k = L.picks.find(x => x.s === L.season && x.rd === o.rd && x.orig === o.orig); return k ? (isUser(o.owner) ? ` <button class="sm" data-tradepick="${k.id}">Trade this pick</button>` : ` <button class="sm" data-tradeforpick="${k.id}">Trade for it</button>`) : ''; })() : ''}</td><td class="l">${p ? esc(p.name) + ' <span class="muted">' + posLabel(p) + (p.draft && p.draft.mock ? ' · mock #' + p.draft.mock : '') + '</span>' : i === L.draftIdx && L.phase === 'off-draft' ? '<strong>On the clock</strong>' : ''}</td></tr>`; }).join('')}</tbody></table></div></section>` : '';
  const r2 = (L.r2Pending || []).map(id => L.players[id]).filter(Boolean);
  const r2html = r2.length ? `<section class="panel"><h2>Your unsigned draft picks</h2><p class="muted" style="margin-top:-4px">First-rounders sign 3-year rookie-scale deals (passing on one is rare). Second-rounders sign 2-year minimum deals with a team option on year 2, or take a 2-year two-way deal (up to 2 slots). When free agency opens, undecided first-rounders are signed and undecided second-rounders become free agents.</p><div class="row" style="margin-bottom:8px"><button class="primary sm" data-signall="1">Sign all</button></div>${r2.map(p => `<div class="check"><span class="grow">${plink(p)} <span class="muted">Round ${p.draft ? p.draft.rd + ', pick ' + p.draft.no : '?'} · ${posLabel(p)} · ${p.age} · ${ovrTxt(p)} / ${potCell(p)} · ${draftTerms(p)}</span></span><button class="sm primary" data-r2="${p.id}" data-sign="1">Sign</button>${p.draft && p.draft.rd === 2 ? `<button class="sm" data-r2="${p.id}" data-sign="tw" title="A 2-year two-way deal: uses one of your 2 two-way slots, 20 games with the team a season, no playoffs unless converted">Two-way</button>` : ''}<button class="sm" data-r2="${p.id}" data-sign="0">Let go</button></div>`).join('')}</section>` : '';
  const liveNow = L.phase === 'off-draft' && d === L.season;
  // v28.7 R2: four pages: Overview / Draft classes / Scouting / Draft history
  const pages = [['over', 'Overview'], ['cls', 'Draft classes'], ['picks', 'Team picks'], ...(L.user != null ? [['scout', 'Scouting']] : []), ['hist', 'Draft history']];
  if (!pages.some(x => x[0] === ui.dpage)) ui.dpage = 'over';
  const ptabs = `<div class="subtabs" style="margin-bottom:12px">${pages.map(([k, n]) => `<button class="sm ${ui.dpage === k ? 'primary' : ''}" data-dpage="${k}">${esc(n)}</button>`).join('')}</div>`;
  const top = `${phaseNote()}${ptabs}<div class="stack">${r2html}${liveNow ? liveDraft(myTurn) : ''}`;
  const clsBar = `<section class="panel" style="padding-bottom:4px"><div class="row" style="margin-bottom:${ui.dpage === 'cls' ? 8 : 4}px">${tabs}</div>${ui.dpage === 'cls' ? subtabs : ''}</section>`;
  if (ui.dpage === 'over') return top + draftOverview(years[0], orderHtml) + '</div>';
  if (ui.dpage === 'scout') return top + clsBar + scoutingView(d) + picksBlock(L.teams[L.user]) + '</div>';
  if (ui.dpage === 'picks') return top + teamPicksPage() + '</div>';
  if (ui.dpage === 'hist') return top + draftHistory() + '</div>';
  const body = ui.dtab === 'board' ? boardPanel(d) : `<section class="panel"><h2>${oi != null ? esc(OUTLETS[oi].name) + ' mock' : 'Consensus mock'} · ${draftLabel(d)} class</h2><p class="muted" style="margin-top:-4px">${oi != null ? esc(OUTLETS[oi].lean) + '.' : 'Average of the three outlets\' mocks.'} ${stab}</p>`;
  if (ui.dtab === 'board') return `${top}${clsBar}${body}</div>`;   // v25.5: no consensus table under the board (it has its own tab)
  return `${top}${clsBar}${body}
  ${fbar('draftp')}<div class="tblwrap"><table class="sortable" data-sid="draftp" data-flist="draftp"><thead><tr><th>${oi != null ? OUTLETS[oi].short : 'Cons'}</th>${oi != null ? '<th title="Consensus">Cons</th>' : ''}${OUTLETS.map((o, j) => j === oi ? '' : `<th title="${esc(o.name)}">${o.short}</th>`).join('')}<th class="l">Prospect</th><th class="l">Pos</th><th class="l">Type</th><th class="l">From</th><th class="l">School / club</th><th>Age</th><th>Ht</th><th>Ovr</th><th>${potHead()}</th><th class="l">Compares to</th>${myTurn ? '<th></th>' : ''}</tr></thead><tbody>${rows || '<tr><td class="l muted" colspan="10">No prospects left in this class.</td></tr>'}</tbody></table></div></section></div>`;
}
// v28.7 R2: draft overview: your picks this draft, the order (offseason), top 10 of the class, last draft's grades
function draftOverview(cls, orderHtml) {
  const me = L.user, ks = me != null ? L.picks.filter(k => k.s === cls && k.owner === me && !pickUsed(L, k)).sort((a, b) => a.rd - b.rd) : [];
  const picksH = me != null ? `<section class="panel"><h2>Your picks · ${draftLabel(cls)} draft</h2>${ks.length ? ks.map(k => `<div>${esc(pickLabel(L, k))} ${pickChip(k)}${k.orig !== me ? ' <span class="muted">via ' + esc(L.teams[k.orig].abbr) + '</span>' : ''}</div>`).join('') : '<p class="muted">No picks in this draft.</p>'}<p style="margin:8px 0 0"><a class="lk" data-dpage="scout">All your future picks →</a></p></section>` : '';
  const board = me != null ? draftBoard(L, me, cls) : [], cons = (mockSet(L, cls).cons || []).map(id => L.players[id]).filter(Boolean).slice(0, 10);
  const topH = `<section class="panel"><h2>Top 10 · ${draftLabel(cls)} class</h2><div class="tblwrap"><table><thead><tr><th>Cons</th>${me != null ? '<th title="Your scouting director\'s board">Board</th>' : ''}<th class="l">Prospect</th><th class="l">Pos</th><th>Age</th><th>Ovr</th><th>${potHead()}</th></tr></thead><tbody>${cons.map((p, i) => { const b = board.findIndex(x => x.id === p.id); return `<tr class="click" data-player="${p.id}"><td><strong>${i + 1}</strong></td>${me != null ? `<td>${b >= 0 ? b + 1 : '—'}</td>` : ''}<td class="l">${esc(p.name)}${stockChip(p) ? ' ' + stockChip(p) : ''}</td><td class="l">${posLabel(p)}</td><td>${p.age}</td><td>${ovrTxt(p)}</td><td><strong>${potCell(p)}</strong></td></tr>`; }).join('') || '<tr><td class="l muted" colspan="7">No prospects.</td></tr>'}</tbody></table></div><p style="margin:8px 0 0"><a class="lk" data-dpage="cls">Full draft classes →</a></p></section>`;
  const gs = Object.keys(L.draftGrades || {}).map(Number).sort((a, b) => b - a)[0], G = gs != null ? L.draftGrades[gs] : null;
  const gradeH = G ? (() => { const tops = Object.entries(G.teams).sort((a, b) => b[1].v - a[1].v).slice(0, 3), mine = me != null ? G.teams[me] : null, P = id => L.players[id] ? plink(L.players[id]) : '—';
    return `<section class="panel"><h2>${draftLabel(gs)} draft grades</h2>${mine ? `<div class="kv"><span class="k2">Your grade</span><span><strong>${mine.g}</strong> <span class="muted">${mine.n} pick${mine.n > 1 ? 's' : ''}</span></span></div>` : ''}<div class="k" style="margin-top:8px">Top grades</div>${tops.map(([tid, g]) => `<div>${tlabel(+tid)} <strong>${g.g}</strong></div>`).join('')}${G.steals.length ? `<div class="k" style="margin-top:8px">Steals</div>${G.steals.map(x => `<div>${P(x.pid)} <span class="muted">#${x.slot} (mock #${x.mock}) · ${L.teams[x.tid].abbr}</span></div>`).join('')}` : ''}<p style="margin:8px 0 0"><a class="lk" data-dpage="hist">Draft history →</a></p></section>`; })() : '';
  return `${orderHtml}<div class="grid2e" style="align-items:start"><div class="stack">${picksH}${gradeH}</div>${topH}</div>`;
}
// v28.7 R2: each team's draft history (drafts made in this league): picks, grade, where they are now, best picks
function draftHistory() {
  const tid = ui.dhTeam != null && L.teams[ui.dhTeam] ? ui.dhTeam : (L.user != null ? L.user : 0);
  const ps = Object.values(L.players).filter(p => p.draft && p.draft.tid === tid);
  const peak = p => Math.max(p.ovr || 0, ...(p.hist || []).map(h => h.ovr || 0));
  const car = p => sumStats([...(p.hist || []).map(h => h.rs), p.stats && p.stats.rs]);
  const now = p => p.retired ? '<span class="muted">Retired</span>' : p.team != null ? tlabel(p.team) : '<span class="muted">Free agent</span>';
  const row = p => { const c = car(p); return `<tr class="click" data-player="${p.id}"><td data-v="${p.draft.s}">${draftLabel(p.draft.s)}</td><td data-v="${p.draft.rd * 100 + (p.draft.no || 99)}">${p.draft.rd}-${p.draft.no || '?'}</td><td class="l">${esc(p.name)}</td><td class="l">${posLabel(p)}</td><td class="l">${now(p)}</td><td>${p.draft.mock || '—'}</td><td>${p.retired ? '—' : ovrTxt(p)}</td><td>${peak(p)}</td><td>${c ? c.gp : 0}</td><td>${c && c.gp ? f1(c.pts / c.gp) : '—'}</td></tr>`; };
  const yrs = [...new Set(ps.map(p => p.draft.s))].sort((a, b) => b - a);
  const best = ps.slice().sort((a, b) => peak(b) - peak(a)).slice(0, 5);
  const sel = `<label>Team <select id="dh-team">${L.teams.map(t => `<option value="${t.id}" ${t.id === tid ? 'selected' : ''}>${esc(tname(t.id))}</option>`).join('')}</select></label>`;
  const grades = yrs.map(S => { const g = ((L.draftGrades || {})[S] || { teams: {} }).teams[tid]; return `<div class="leader" style="grid-template-columns:minmax(0,1fr) auto"><span>${draftLabel(S)} draft <span class="muted">${ps.filter(p => p.draft.s === S).length} pick${ps.filter(p => p.draft.s === S).length > 1 ? 's' : ''}</span></span><span class="v">${g ? g.g : '—'}</span></div>`; }).join('');
  const head = '<th>Draft</th><th>Pick</th><th class="l">Player</th><th class="l">Pos</th><th class="l">Now</th><th title="Consensus mock rank on draft day">Mock</th><th>Ovr</th><th title="Best overall rating so far">Peak</th><th>GP</th><th>PPG</th>';
  return `<section class="panel"><div class="row" style="margin-bottom:8px">${sel}</div><div class="grid2e" style="align-items:start"><div><h3>Best picks</h3>${best.length ? best.map(p => `<div class="leader" style="grid-template-columns:minmax(0,1fr) auto"><span>${plink(p)} <span class="muted">${draftLabel(p.draft.s)} · #${p.draft.rd === 1 ? p.draft.no : (p.draft.no || 0) + L.teams.length}</span></span><span class="v">peak ${peak(p)}</span></div>`).join('') : '<p class="muted">No picks yet.</p>'}</div><div><h3>Draft grades</h3>${grades || '<p class="muted">No drafts yet.</p>'}</div></div></section>
  <section class="panel"><h2>${esc(tname(tid))} picks · ${ps.length}</h2>${ps.length ? `<div class="tblwrap"><table class="sortable" data-sid="dhist"><thead><tr>${head}</tr></thead><tbody>${ps.sort((a, b) => b.draft.s - a.draft.s || a.draft.rd - b.draft.rd || (a.draft.no || 99) - (b.draft.no || 99)).map(row).join('')}</tbody></table></div>` : '<p class="muted">No drafts yet: this list fills in with the first draft you sim.</p>'}</section>`;
}
// Live draft: every pick as it's made on the left, your director's board (or the consensus) on the right
function liveDraft(myTurn) {
  const order = L.draftOrder || [];
  const left = order.map((o, i) => { const p = o.pid ? L.players[o.pid] : null; const now = i === L.draftIdx; const r = p && p.draft ? p.draft.mock : null;
    return `<tr class="${now ? 'now' : ''} ${isUser(o.owner) ? 'mine' : ''} ${p ? 'click' : ''}" ${p ? `data-player="${p.id}"` : ''} ${now ? 'id="livenow"' : ''}><td>${o.rd}-${o.no}</td><td class="l">${tlabel(o.owner)}</td><td class="l">${p ? esc(p.name) : now ? '<em>On the clock</em>' : ''}</td><td class="l">${p ? posLabel(p) : ''}</td><td>${p ? p.ovr : ''}</td><td>${p ? potCell(p) : ''}</td><td title="Consensus rank before the draft" class="${r && r - (o.rd === 1 ? o.no : L.teams.length + o.no) >= 6 ? 'lo' : r && (o.rd === 1 ? o.no : L.teams.length + o.no) - r >= 6 ? 'w' : ''}">${r || ''}</td></tr>`; }).join('');
  const board = (L.user != null ? draftBoard(L, L.user, L.season) : mockOrder(L, L.season)).slice(0, 40);
  // v30a #11: highlight my targets: prospects the director has near one of my remaining picks (within 2 of the slot), and my watch list
  const mySlots = L.user != null ? order.map((o, i) => ({ o, n: i + 1 })).filter(x => !x.o.pid && isUser(x.o.owner)).map(x => x.n) : [];
  const tgtOf = p => { if (L.user == null) return ''; const r = mockRanksOf(L, p).c || 0; return r && mySlots.some(n => Math.abs(r - n) <= 2) ? 'dir' : isWatched(L, p) ? 'watch' : ''; };
  const tgts = board.map(p => ({ p, k: tgtOf(p) })).filter(x => x.k);
  const tgtBar = L.user != null ? `<p class="muted" id="livetgt" style="margin:0 0 6px">${mySlots.length ? `Your next pick: <strong>#${mySlots[0]}</strong>${mySlots.length > 1 ? ` (+${mySlots.length - 1} more)` : ''}. ` : 'You have no picks left. '}${tgts.length ? `Your targets still on the board: ${tgts.slice(0, 8).map(x => esc(x.p.name)).join(', ')}${tgts.length > 8 ? ` +${tgts.length - 8}` : ''}.` : 'None of your targets are left.'}</p>` : '';
  const right = board.map((p, i) => { const r = mockRanksOf(L, p), tk = tgtOf(p); return `<tr class="click ${tk ? 'target' : ''}" ${tk ? `data-tgtk="${tk}"` : ''} data-player="${p.id}"><td><strong>${i + 1}</strong></td><td><strong>${r.c || '—'}</strong></td>${r.o.map(x => `<td class="mk">${x || '—'}</td>`).join('')}<td class="l">${esc(p.name)}${flagPill(p)}${tk ? ` <span class="pill prot" title="${tk === 'dir' ? 'Your scouting director has him near one of your picks' : 'On your watch list'}">${tk === 'dir' ? 'Target' : '★ Watch'}</span>` : ''}</td><td class="l">${posLabel(p)}</td><td>${p.age}</td><td>${ovrTxt(p)}</td><td>${potCell(p)}</td>${myTurn ? `<td><button class="sm primary" data-draft="${p.id}">Draft</button></td>` : ''}</tr>`; }).join('');
  const made = order.filter(o => o.pid).length;
  setTimeout(() => { const n = document.getElementById('livenow'); if (n && n.parentElement) { const box = n.closest('.livebox'); if (box) box.scrollTop = Math.max(0, n.offsetTop - 120); } }, 0);
  return `<div class="grid2e"><section class="panel"><h2>Live draft · ${made} of ${order.length} picks made</h2><div class="tblwrap livebox"><table><thead><tr><th>Pick</th><th class="l">Team</th><th class="l">Selection</th><th class="l">Pos</th><th>Ovr</th><th>${potHead()}</th><th title="Consensus mock rank (green: value pick, red: reach)">Cons</th></tr></thead><tbody>${left}</tbody></table></div></section>
  <section class="panel"><h2>${L.user != null ? "Director's board" : 'Consensus board'} · available</h2>${tgtBar}<div class="tblwrap livebox"><table><thead><tr><th>${L.user != null ? 'Board' : '#'}</th><th>Cons</th>${OUTLETS.map(o => `<th title="${esc(o.name)}">${o.short}</th>`).join('')}<th class="l">Prospect</th><th class="l">Pos</th><th>Age</th><th>Ovr</th><th>${potHead()}</th>${myTurn ? '<th></th>' : ''}</tr></thead><tbody>${right}</tbody></table></div>${myTurn ? '<p class="muted" style="margin:6px 0 0">You are on the clock.</p>' : ''}</section></div>`;
}
// ---------- history & records ----------
function awardName(pid) { const p = L.players[pid]; return p ? plink(p) : '—'; }
function yearbookHtml(s, tid) {
  const e = L.yearbook && L.yearbook[s] && L.yearbook[s][tid]; if (!e) return '<p class="muted">No yearbook for this season.</p>';
  const pl = id => L.players[id] ? plink(L.players[id]) : '—';
  return `<div class="grid2e"><div><h3 style="margin-top:0">${tlabel(tid, true)} · ${seasonName(s)}</h3><p style="font-size:16px"><strong>${esc(e.story)}</strong></p><div class="kv"><span class="k2">Record</span><span>${e.w}-${e.l} · ${ordinal(e.finish)} overall</span><span class="k2">Preseason prediction</span><span>${e.exp ? ordinal(e.exp) + ' (by roster strength)' : '—'}</span><span class="k2">Playoffs</span><span>${esc(e.po)}</span><span class="k2">Coach</span><span>${esc(e.coach)}</span>${e.allStars.length ? `<span class="k2">All-Stars</span><span>${e.allStars.map(pl).join(', ')}</span>` : ''}${e.awards.length ? `<span class="k2">Awards</span><span>${e.awards.map(esc).join(' · ')}</span>` : ''}</div></div>
  <div>${e.best.length ? `<h3 style="margin-top:0">Best moments</h3>${e.best.map(x => `<div class="tl">${esc(x)}</div>`).join('')}` : ''}${(e.up || []).length ? `<h3>Rising</h3>${e.up.map(([id, d]) => `<div>${pl(id)} <span class="w">+${d}</span></div>`).join('')}` : ''}${(e.down || []).length ? `<h3>Fading</h3>${e.down.map(([id, d]) => `<div>${pl(id)} <span class="lo">${d}</span></div>`).join('')}` : ''}${(e.traits || []).length ? `<h3>Trait changes</h3>${e.traits.map(x => `<div>${pl(x.pid)} <span class="muted">${esc(TR_NAMES[x.k] || x.k)}</span> <span class="${x.d > 0 ? 'w' : 'lo'}">${x.d > 0 ? '+' : '−'}${Math.abs(x.d)}</span> <span class="muted">${esc(TR_WHY[x.why] || x.why)}</span></div>`).join('')}` : ''}${e.moves.length ? `<h3>Key moves</h3>${e.moves.map(x => `<div class="tl muted">${esc(x)}</div>`).join('')}` : ''}</div></div>`;
}
function yearbookSection() {
  const ss = Object.keys(L.yearbook || {}).map(Number).sort((a, b) => b - a); if (!ss.length) return '';
  const s = ss.includes(ui.ybS) ? ui.ybS : ss[0], tid = ui.ybT != null ? ui.ybT : (L.user != null ? L.user : L.history.find(h => h.s === s)?.champion ?? 0);
  const yb = L.yearbook[s];
  const sur = Object.entries(yb).map(([id, e]) => [+id, e.exp ? e.exp - e.finish : 0]).sort((a, b) => b[1] - a[1]);
  return `<section class="panel" style="margin-top:16px"><h2>Yearbook</h2><div class="row" style="margin-bottom:10px"><label>Season <select id="yb-s">${ss.map(x => `<option value="${x}" ${x === s ? 'selected' : ''}>${seasonName(x)}</option>`).join('')}</select></label><label>Team <select id="yb-t">${L.teams.map(t => `<option value="${t.id}" ${t.id === tid ? 'selected' : ''}>${esc(tname(t.id))}</option>`).join('')}</select></label></div>
  ${yearbookHtml(s, tid)}<p class="muted" style="margin:10px 0 0;font-size:12px">Biggest surprise: ${tlabel(sur[0][0], true)} (${sur[0][1] >= 0 ? '+' : ''}${sur[0][1]} places vs prediction). Biggest letdown: ${tlabel(sur[sur.length - 1][0], true)} (${sur[sur.length - 1][1]} places).</p></section>`;
}
function yearbookDialog() {
  const s = L.season; if (!L.yearbook || !L.yearbook[s]) return; const tid = L.user != null ? L.user : L.firedFrom; if (tid == null) return;
  dialog(`<h2>${seasonName(s)} yearbook</h2>${yearbookHtml(s, tid)}<div class="row" style="margin-top:12px"><button class="primary" id="x-close">Continue</button></div>`, 'wide');
  $('#x-close').onclick = closeDialog;
}
// v28.4 F4: Hall of Fame speech under each inductee (built from his career; same text every time)
function hofSpeechHtml(h) { const p = L.players[h.pid]; if (!p || typeof hofSpeech !== 'function') return ''; let t = ''; try { t = hofSpeech(L, p); } catch (e) { } return t ? `<details class="hofsp" style="margin:0 0 8px"><summary class="muted" style="cursor:pointer;font-size:12px">Speech</summary><p style="margin:4px 0 0;font-size:13px">${esc(t)}</p></details>` : ''; }
function vHistory() {
  if (ui.hs != null) return vSeasonHistory(L.history.find(h => h.s === ui.hs));
  // v32f: one list, newest first: this league's seasons, then the NBA seasons back to 1946-47
  const simRow = h => ({ s: h.s, html: `<tr class="click" data-hs="${h.s}"><td class="l">${seasonName(h.s)}</td><td class="l">${h.champion != null ? tlabel(h.champion, true) : '—'}</td><td class="l">${h.runnerUp != null ? tlabel(h.runnerUp) : '—'}</td><td class="l">${h.awards.mvp != null && L.players[h.awards.mvp] ? plink(L.players[h.awards.mvp]) : '—'}${(() => { const w = (((L.awards || {})[h.s] || {}).ladder || {}).mvp, x = w && w[0] && w[0].pid === h.awards.mvp ? w[0] : null; return x && x.per != null ? ` <span class="muted" style="font-size:12px">PER ${f1(x.per)} · ${f1(x.ws)} WS · ${sgn(x.bpm)} BPM</span>` : ''; })()}</td><td class="l">${h.awards.fmvp != null && L.players[h.awards.fmvp] ? plink(L.players[h.awards.fmvp]) : '—'}</td><td class="l">${h.standings[0] ? tlabel(h.standings[0].tid) + ' ' + h.standings[0].w + '-' + h.standings[0].l : ''}</td></tr>` });
  const pastRow = h => ({ s: h.y - 2025, html: `<tr><td class="l">${nbaSeasonLbl(h.y)}</td><td class="l">${nbaTeamCell(h.champ, h.champTm, true)}</td><td class="l">${nbaTeamCell(h.ru, h.ruTm)}</td><td class="l">${nbaNameCell(h.mvp)}${(() => { const a = typeof hxAwardAdv === 'function' && typeof NBA_HX !== 'undefined' ? hxAwardAdv(h.y, 'mvp') : null; return a ? ` <span class="muted" style="font-size:12px" title="Game formula, recomputed from the box score">PER ${f1(a[1])}${a[2] != null ? ' · ' + f1(a[2]) + ' WS' : ''}${a[4] != null ? ' · ' + sgn(a[4]) + ' BPM' : ''}</span>` : ''; })()}</td><td class="l">${nbaNameCell(h.fmvp)}</td><td class="l">${(() => { const b = typeof hxBestRecord === 'function' && typeof NBA_HX !== 'undefined' ? hxBestRecord(h.y) : null; return b ? `${esc(b.name)} <span class="muted">${b.w}-${b.l}</span>` : '<span class="muted">—</span>'; })()}</td></tr>` });
  const rows = [...L.history.map(simRow), ...(nbaHistOn(L) ? nbaHist().map(pastRow) : [])].sort((a, b) => b.s - a.s).map(x => x.html).join('');
  const ttl = t => nbaHistOn(L) ? nbaTitlesAll(L, t) : (t.titles || 0);
  const titles = L.teams.filter(t => ttl(t)).map(t => ({ n: ttl(t), html: `<div class="leader" style="grid-template-columns:minmax(0,1fr) auto"><span>${tlabel(t.id, true)}</span><span class="v">${ttl(t)}</span></div>` }));
  if (nbaHistOn(L)) { const known = new Set(L.teams.map(nbaAbOf)), gone = {}; for (const h of nbaHist()) if (h.champ && !known.has(h.champ)) gone[h.champ] = (gone[h.champ] || 0) + 1; for (const [ab, n] of Object.entries(gone)) titles.push({ n, html: `<div class="leader" style="grid-template-columns:minmax(0,1fr) auto"><span>${esc(NBA_OLD[ab] || ab)}</span><span class="v">${n}</span></div>` }); }
  titles.sort((a, b) => b.n - a.n);
  const rivals = rivalPairs(L).map(q => Object.assign({ kinds: q.kinds }, h2h(L, q.lo, q.hi))).sort((a, b) => b.heat - a.heat).slice(0, 8);
  const hm = hofMembers();
  const extra = `<div class="grid2e" style="margin-top:16px"><section class="panel"><h2>Hall of Fame${hm.length ? ' <a class="lk" href="#hofc" style="font-weight:400;font-size:13px">Full Hall of Fame →</a>' : ''}</h2>${hm.length ? hm.slice(0, 10).map(m => `<div class="leader" style="grid-template-columns:minmax(0,1fr) auto"><span>${hofNameCell(m)} <span class="muted">${m.cat !== 'Player' ? esc(m.cat) + (m.teams ? ' · ' : '') : ''}${esc(m.teams)}</span>${m.h ? hofPre(m.h.pid) : ''}</span><span class="muted">class of ${m.y}</span></div>`).join('') + (hm.length > 10 ? `<p style="margin:6px 0 0"><a class="lk" href="#hofc">All ${hm.length} members →</a></p>` : '') : '<p class="muted">No inductees yet. Players are considered when they retire, based on their production, awards and titles.</p>'}</section>
  <section class="panel"><h2>Top rivalries</h2>${rivals.length ? rivals.map(r => `<div class="leader" style="grid-template-columns:minmax(0,1fr) auto"><span>${tlabel(r.lo)} vs ${tlabel(r.hi)} <span class="muted">${r.kinds.map(k => RIV_LABEL[k]).join(' · ')}</span></span><span class="muted">${r.wLo}-${r.wHi}${r.poLo + r.poHi ? ' · playoffs ' + r.poLo + '-' + r.poHi : ''}</span></div>`).join('') : '<p class="muted">None yet.</p>'}</section></div>`;
  const htab = ['seasons', 'dyn', 'book', 'awards', 'greats', 'records', 'ach', ...(nbaHistOn(L) ? ['legends'] : [])].includes(ui.histTab) ? ui.histTab : 'seasons';
  const hsub = `<div class="subtabs" style="margin-bottom:12px">${[['seasons', 'Seasons'], ['dyn', 'Dynasties & eras'], ...(nbaHistOn(L) ? [['legends', 'Legends']] : []), ['book', 'History book'], ['awards', 'Awards and Hall of Fame'], ['greats', 'All-time greats'], ['records', 'League records'], ['ach', 'Achievements']].map(([k, n]) => `<button class="sm ${htab === k ? 'primary' : ''}" data-histtab="${k}">${n}</button>`).join('')}</div>`;
  if (htab === 'dyn') return hsub + dynastyView();
  if (htab === 'legends') return hsub + legendsView();
  if (htab === 'awards') return hsub + awardsHistory() + awardLeadersPanels() + extra;
  if (htab === 'greats') return hsub + greatsView();
  if (htab === 'book') return hsub + historyBook();
  if (htab === 'ach') return hsub + achievementsView();
  if (htab === 'records') return hsub + records();
  return hsub + `<div class="grid2"><section class="panel"><h2>League history</h2>${rows ? `<div class="tblwrap"><table class="hwrap"><thead><tr><th class="l">Season</th><th class="l">Champion</th><th class="l">Runner-up</th><th class="l">MVP</th><th class="l">Finals MVP</th><th class="l">Best record</th></tr></thead><tbody>${rows}</tbody></table></div>` : '<p class="muted">Seasons are added here when each offseason starts.</p>'}</section>
  <section class="panel"><h2>Championships</h2>${titles.length ? titles.map(t => t.html).join('') : '<p class="muted">No champions yet.</p>'}</section></div>
  ${yearbookSection()}`;
}
// History book: the league season by season, any franchise season by season, and your GM career
// v37b History book helpers: a name from the history data, linked when he is in this league; a franchise's honors of an earlier season
const HX_FR = { NOH: 'NOP', NOK: 'NOP', NJN: 'BKN', BRK: 'BKN', CHO: 'CHA', CHH: 'CHA', SEA: 'OKC', WSB: 'WAS', CAP: 'WAS', BAL: 'WAS', CHP: 'WAS', CHZ: 'WAS', KCK: 'SAC', KCO: 'SAC', CIN: 'SAC', ROC: 'SAC', SDC: 'LAC', BUF: 'LAC', SDR: 'HOU', PHW: 'GSW', SFW: 'GSW', SYR: 'PHI', FTW: 'DET', MLH: 'ATL', STL: 'ATL', TRI: 'ATL', MNL: 'LAL', NOJ: 'UTA', VAN: 'MEM', PHO: 'PHX' };
function hbName(n) {
  if (!n) return '<span class="muted">—</span>';
  if (!hbName.m || hbName.L !== L) { hbName.m = {}; hbName.L = L; for (const p of Object.values(L.players)) { const k = hxNorm(p.name); if (p.real || !hbName.m[k]) hbName.m[k] = p; } }
  return nbaNames(n).map(x => hbName.m[hxNorm(x)] ? plink(hbName.m[hxNorm(x)]) : esc(x)).join(' / ');
}
let HB_AW = null;
function hbTeamAw(y, ab) {
  if (!HB_AW) { HB_AW = {}; const add = (y, t, txt) => { for (const a of String(t || '').split('/')) { const k = y + '|' + (HX_FR[a] || a); (HB_AW[k] = HB_AW[k] || []).includes(txt) || HB_AW[k].push(txt); } };
    const teamOf = {}; for (const r of NBA_HX.aw) teamOf[r[0] + '|' + hxNorm(r[2])] = r[3];
    for (const h of nbaHist()) for (const [k, lab] of [['mvp', 'MVP'], ['dpoy', 'DPOY'], ['roy', 'Rookie of the Year'], ['smoy', 'Sixth Man of the Year'], ['mip', 'Most Improved Player']]) for (const n of nbaNames(h[k])) { const t = teamOf[h.y + '|' + hxNorm(n)]; if (t) add(h.y, t, `${n} (${lab})`); }
    for (const r of NBA_HX.aw) if (r[1] === 'AN1' || r[1] === 'AD1') add(r[0], r[3], `${r[2]} (${r[1] === 'AN1' ? 'All-League 1st' : 'All-Defense 1st'})`); }
  return (HB_AW[y + '|' + ab] || []).map(esc).join(', ');
}
function historyBook() {
  const tr = s => { const list = (L.trades || []).filter(r => r.s === s); if (!list.length) return null; const val = r => [...r.aIn.players, ...r.bIn.players].reduce((m, id) => Math.max(m, L.players[id] ? (L.players[id].hist.find(h => h.s === s) || L.players[id]).ovr || 0 : 0), 0); return list.sort((a, b) => val(b) - val(a))[0]; };
  const P = id => id != null && L.players[id] ? plink(L.players[id]) : '—';
  const me = L.me && L.me.hist && L.me.hist.length ? `<section class="panel" style="margin-top:16px"><h2>Your GM career</h2><div class="tblwrap"><table><thead><tr><th class="l">Season</th><th class="l">Team</th><th>W-L</th><th class="l">Playoffs</th><th>Owner trust</th></tr></thead><tbody>${L.me.hist.slice().reverse().map(h => `<tr><td class="l">${seasonName(h.s)}</td><td class="l">${h.tid != null && L.teams[h.tid] ? tlabel(h.tid) : '—'}</td><td>${h.w}-${h.l}</td><td class="l">${esc(h.po || '—')}</td><td>${h.trust != null ? h.trust : '—'}</td></tr>`).join('')}</tbody></table></div></section>` : '';
  const mode = ui.bookMode === 'po' ? 'po' : 'rs';
  const msub = `<div class="subtabs" style="margin-bottom:12px"><button class="sm ${mode === 'rs' ? 'primary' : ''}" data-bookmode="rs">Regular season</button><button class="sm ${mode === 'po' ? 'primary' : ''}" data-bookmode="po">Playoffs</button></div>`;
  // playoff leaders for a season (points per game, 4+ games)
  const poLead = (sv, tid) => { let best = null; for (const p of Object.values(L.players)) for (const h of p.hist) { if (h.s !== sv || !h.po || h.po.gp < (tid == null ? 4 : 1) || (tid != null && h.tid !== tid)) continue; const v = h.po.pts / h.po.gp; if (!best || v > best.v) best = { p, v }; } return best; };
  const rsLead = (sv, tid, k) => { let best = null; for (const p of Object.values(L.players)) for (const h of p.hist) { if (h.s !== sv || !h.rs || h.rs.gp < gpq(20) || h.tid !== tid) continue; const v = (k === 'reb' ? h.rs.orb + h.rs.drb : h.rs[k]) / h.rs.gp; if (!best || v > best.v) best = { p, v }; } return best; };
  // v16: defensive leaders from tracked seasons (20+ minutes a game, half the games)
  const defQ = (h, r) => r.d && r.d[0] && r.rs && r.rs.gp >= gpq(29) && r.rs.min / r.rs.gp >= 1200;
  const defLead = (sv, tid) => { let b = null; for (const p of Object.values(L.players)) for (const h of p.hist) { if (h.s !== sv || (tid != null && h.tid !== tid) || !defQ(sv, h)) continue; const v = (h.d[2] - h.d[1]) / h.rs.gp; if (!b || v > b.v) b = { p, v }; } return b; };
  const defCell = x => x ? `${plink(x.p)} <span class="muted">${f1(x.v)} saved</span>` : '—';
  const fin = h => { const r = h.playoffs && h.playoffs[h.playoffs.length - 1]; return (r && r.stage === 'Finals' && r.series && r.series[0]) || null; };
  const lgRows = L.history.slice().reverse().map(h => {
    if (mode === 'po') { const f = fin(h), pl = poLead(h.s); return `<tr><td class="l"><a class="lk" data-hs="${h.s}">${seasonName(h.s)}</a></td><td class="l">${h.champion != null ? tlabel(h.champion) : '—'}</td><td class="l">${h.runnerUp != null ? tlabel(h.runnerUp) : '—'}</td><td>${f ? `${Math.max(f.hw, f.lw)}-${Math.min(f.hw, f.lw)}` : '—'}</td><td class="l">${P(h.awards.fmvp)}</td><td class="l">${pl ? `${plink(pl.p)} <span class="muted">${f1(pl.v)} ppg</span>` : '—'}</td></tr>`; }
    const best = h.standings.slice().sort((a, b) => b.w - a.w)[0]; const t = tr(h.s); const ms = (L.milestones || []).filter(m => m.s === h.s).length; const sc = h.awards.titles && h.awards.titles.pts;
    return `<tr><td class="l"><a class="lk" data-hs="${h.s}">${seasonName(h.s)}</a></td><td class="l">${h.champion != null ? tlabel(h.champion) : '—'}</td><td class="l">${tlabel(best.tid)} ${best.w}-${best.l}</td><td class="l">${P(h.awards.mvp)}</td><td class="l">${P(h.awards.dpoy)}</td><td class="l">${P(h.awards.roy)}</td><td class="l">${sc ? `${P(sc.pid)} <span class="muted">${f1(sc.v)}</span>` : '—'}</td><td class="l">${defCell(defLead(h.s))}</td><td class="l wrapt">${t ? `${L.teams[t.a].abbr} get ${esc(t.aGets)}` : '—'}</td><td>${ms || ''}</td></tr>`; }).join('');
  // v37b: the seasons before 2026-27 continue the same list (one universe); what the history data doesn't have shows —
  const hb = typeof nbaHistOn === 'function' && nbaHistOn(L) && typeof NBA_HX !== 'undefined', D = '<span class="muted">—</span>';
  const tc = (ab, then) => ab ? nbaTeamCell(ab, then) : D;
  const lpts = y => NBA_HX.aw.find(r => r[0] === y && r[1] === 'LPTS');
  const pastLg = !hb ? '' : nbaHist().slice().reverse().map(h => {
    if (mode === 'po') return `<tr><td class="l">${nbaSeasonLbl(h.y)}</td><td class="l">${tc(h.champ, h.champTm)}</td><td class="l">${tc(h.ru, h.ruTm)}</td><td>${D}</td><td class="l">${hbName(h.fmvp)}</td><td class="l">${D}</td></tr>`;
    const b = hxBestRecord(h.y), sc = lpts(h.y);
    return `<tr><td class="l">${nbaSeasonLbl(h.y)}</td><td class="l">${tc(h.champ, h.champTm)}</td><td class="l">${b ? `${nbaTeamCell(b.ab, b.name)} ${b.w}-${b.l}` : D}</td><td class="l">${hbName(h.mvp)}</td><td class="l">${hbName(h.dpoy)}</td><td class="l">${hbName(h.roy)}</td><td class="l">${sc ? `${hbName(sc[2])} <span class="muted">${f1(sc[4])}</span>` : D}</td><td class="l">${D}</td><td class="l">${D}</td><td></td></tr>`; }).join('');
  const lgAll = lgRows + pastLg;
  const lgHead = mode === 'po' ? `<th class="l">Season</th><th class="l">${trIcon('champ', 'Champion')}</th><th class="l">Runner-up</th><th>Finals</th><th class="l">${trIcon('fmvp', 'Finals MVP')}</th><th class="l">Playoff scoring leader</th>` : `<th class="l">Season</th><th class="l">${trIcon('champ', 'Champion')}</th><th class="l">Best record</th><th class="l">${trIcon('mvp', 'MVP')}</th><th class="l">${trIcon('dpoy', 'Defensive POY')}</th><th class="l">${trIcon('roy', 'Rookie of the Year')}</th><th class="l">Scoring title</th><th class="l" title="Most shots saved per game as the primary defender (20+ minutes, half the games)">Top defender</th><th class="l">Biggest trade</th><th title="Career milestones reached">Milestones</th>`;
  const ft = L.teams[ui.bookTeam] ? ui.bookTeam : (L.user != null ? L.user : 0), T = L.teams[ft];
  const fRows = L.history.slice().reverse().filter(h => h.standings.some(x => x.tid === ft)).map(h => { const st = h.standings.find(x => x.tid === ft);
    if (mode === 'po') { const res = poFromHist(h, ft); if (res === 'Missed playoffs') return ''; let w = 0, l = 0; (h.playoffs || []).forEach(r => (r.series || []).forEach(sr => { if (sr.hi === ft) { w += sr.hw; l += sr.lw; } else if (sr.lo === ft) { w += sr.lw; l += sr.hw; } })); const pl = poLead(h.s, ft); return `<tr><td class="l">${seasonName(h.s)}</td><td class="l">${esc(res)}</td><td>${w}-${l}</td><td class="l">${pl ? `${plink(pl.p)} <span class="muted">${f1(pl.v)} ppg</span>` : '—'}</td><td class="l">${h.awards.fmvp != null && L.players[h.awards.fmvp] && h.champion === ft ? P(h.awards.fmvp) : ''}</td></tr>`; }
    const lp = rsLead(h.s, ft, 'pts'), lr = rsLead(h.s, ft, 'reb'), la = rsLead(h.s, ft, 'ast');
    const aw = Object.values(L.players).flatMap(p => p.awards.filter(a => a.s === h.s && ['MVP', 'Defensive Player of the Year', 'Rookie of the Year', 'Sixth Man of the Year', 'Most Improved Player', 'All-League 1st Team', 'All-Defense 1st Team'].includes(a.a) && (p.hist.find(x => x.s === h.s) || {}).tid === ft).map(a => `${esc(p.name)} (${esc(a.a.replace('Defensive Player of the Year', 'DPOY').replace(' Team', ''))})`));
    return `<tr><td class="l">${seasonName(h.s)}</td><td>${st.w}-${st.l}</td><td class="l">${lp ? `${plink(lp.p)} <span class="muted">${f1(lp.v)}</span>` : '—'}</td><td class="l">${lr ? `${plink(lr.p)} <span class="muted">${f1(lr.v)}</span>` : '—'}</td><td class="l">${la ? `${plink(la.p)} <span class="muted">${f1(la.v)}</span>` : '—'}</td><td class="l">${defCell(defLead(h.s, ft))}</td><td class="l wrapt">${aw.join(', ') || '—'}</td></tr>`; }).join('');
  const fab = hb ? nbaAbOf(T) : null, fsx = hb ? hxSeasons(fab).slice().reverse() : [], curNm = T.city + ' ' + T.name;
  const fPast = fsx.map(r => { const nm = r[1] && r[1] !== curNm ? ` <span class="muted">${esc(r[1])}</span>` : '';
    if (mode === 'po') { if (!r[4] || r[4] === 'Missed Playoffs') return ''; const h = r[4] === 'Won Finals' ? nbaHist().find(x => x.y === r[0]) : null; return `<tr><td class="l">${nbaSeasonLbl(r[0])}${nm}</td><td class="l">${esc(r[4])}</td><td>${D}</td><td class="l">${D}</td><td class="l">${h ? hbName(h.fmvp) : ''}</td></tr>`; }
    return `<tr><td class="l">${nbaSeasonLbl(r[0])}${nm}</td><td>${r[2] != null ? r[2] + '-' + r[3] : D}</td><td class="l">${D}</td><td class="l">${D}</td><td class="l">${D}</td><td class="l">${D}</td><td class="l wrapt">${hbTeamAw(r[0], fab) || D}</td></tr>`; }).join('');
  const fAll = fRows + fPast;
  const fHead = mode === 'po' ? '<th class="l">Season</th><th class="l">Result</th><th>Games W-L</th><th class="l">Leading scorer</th><th class="l">Finals MVP</th>' : '<th class="l">Season</th><th>W-L</th><th class="l">Points leader</th><th class="l">Rebounds leader</th><th class="l">Assists leader</th><th class="l">Top defender</th><th class="l">Awards</th>';
  // franchise records: single games (tracked from v15), best seasons by players, team bests; and achievements
  const gr = (T.grec || {})[mode] || {};
  const gRecs = Object.entries(REC_KEYS).filter(([k]) => gr[k]).map(([k, n]) => `<div class="leader" style="grid-template-columns:minmax(0,1fr) auto"><span>${n}: <strong>${gr[k].v}</strong> · ${L.players[gr[k].pid] ? plink(L.players[gr[k].pid]) : esc(gr[k].name)} vs ${L.teams[gr[k].opp] ? L.teams[gr[k].opp].abbr : '?'}</span><span class="muted">${seasonName(gr[k].s)}</span></div>`).join('');
  const seasonBest = (k, lab) => { let b = null; for (const p of Object.values(L.players)) for (const h of p.hist) { const r = h[mode]; if (h.tid !== ft || !r || r.gp < (mode === 'po' ? 4 : 30)) continue; const v = (k === 'reb' ? r.orb + r.drb : r[k]) / r.gp; if (!b || v > b.v) b = { p, v, s: h.s }; } return b ? `<div class="leader" style="grid-template-columns:minmax(0,1fr) auto"><span>${lab}: <strong>${f1(b.v)}</strong> · ${plink(b.p)}</span><span class="muted">${seasonName(b.s)}</span></div>` : ''; };
  const dBest = (lab, f, asc, fmt) => { let b = null; for (const p of Object.values(L.players)) for (const h of p.hist) { if (h.tid !== ft || !defQ(h.s, h)) continue; const v = f(h); if (!b || (asc ? v < b.v : v > b.v)) b = { p, v, s: h.s }; } return b ? `<div class="leader" style="grid-template-columns:minmax(0,1fr) auto"><span>${lab}: <strong>${fmt(b.v)}</strong> · ${plink(b.p)}</span><span class="muted">${seasonName(b.s)}</span></div>` : ''; };
  const dRecs = mode === 'rs' ? [dBest('Shots saved per game', h => (h.d[2] - h.d[1]) / h.rs.gp, false, f1), dBest('Best defensive rating', h => h.d[3] / Math.max(1, h.d[4]) * 100, true, f1), dBest('Opp FG% vs expected', h => (h.d[1] - h.d[2]) / h.d[0] * 100, true, v => v.toFixed(1))].join('') : '';
  const sRecs = [['pts', 'Points per game'], ['reb', 'Rebounds per game'], ['ast', 'Assists per game'], ['stl', 'Steals per game'], ['blk', 'Blocks per game']].map(([k, n]) => seasonBest(k, n)).join('');
  const recs = L.history.filter(h => h.standings.some(x => x.tid === ft)).map(h => ({ s: h.s, st: h.standings.find(x => x.tid === ft) }));
  const rec2 = [...recs.map(x => ({ w: x.st.w, l: x.st.l, lbl: seasonName(x.s) })), ...fsx.filter(r => r[2] != null && r[3] != null).map(r => ({ w: r[2], l: r[3], lbl: nbaSeasonLbl(r[0]) }))], pc = x => x.w / Math.max(1, x.w + x.l);
  const bestR = rec2.slice().sort((a, b) => pc(b) - pc(a))[0], worstR = rec2.slice().sort((a, b) => pc(a) - pc(b))[0];
  const titles = L.history.filter(h => h.champion === ft).length + (hb ? nbaRealTitles(L, T).length : 0), finals = L.history.filter(h => h.champion === ft || h.runnerUp === ft).length + (hb ? nbaRealFinals(L, T).length : 0);
  const poTrips = L.history.filter(h => poFromHist(h, ft) !== 'Missed playoffs').length + fsx.filter(r => r[4] && r[4] !== 'Missed Playoffs').length;
  const teamRecs = mode === 'po' ? `<div class="kv"><span class="k2">Titles</span><span>${titles}</span><span class="k2">Finals trips</span><span>${finals}</span><span class="k2">Playoff trips</span><span>${poTrips} of ${recs.length + fsx.length}</span></div>` : bestR ? `<div class="kv"><span class="k2">Best record</span><span>${bestR.w}-${bestR.l} (${bestR.lbl})</span><span class="k2">Worst record</span><span>${worstR.w}-${worstR.l} (${worstR.lbl})</span></div>` : '<p class="muted">No completed seasons yet.</p>';
  const ach = (L.achLog || []).filter(x => (x.kind === 't' && x.id === ft) || (x.kind === 'p' && L.players[x.id] && (L.players[x.id].hist.find(h => h.s === x.s) || {}).tid === ft) || (x.kind === 'p' && x.tid === ft));
  const achHtmlF = ach.length ? ach.slice(0, 40).map(x => `<div class="leader" style="grid-template-columns:minmax(0,1fr) auto"><span>${x.kind === 'p' && L.players[x.id] ? plink(L.players[x.id]) + ' · ' : ''}${esc(x.text)}</span><span class="muted">${seasonName(x.s)}</span></div>`).join('') : '<p class="muted">None yet.</p>';
  return `${msub}<section class="panel"><h2>League by season · ${mode === 'po' ? 'playoffs' : 'regular season'}</h2>${lgAll ? `<div class="tblwrap"><table class="hwrap"><thead><tr>${lgHead}</tr></thead><tbody>${lgAll}</tbody></table></div>` : '<p class="muted">No completed seasons yet.</p>'}</section>
  <section class="panel" style="margin-top:16px"><h2>Franchise by season · ${mode === 'po' ? 'playoffs' : 'regular season'}</h2><div class="filters"><select id="bookteam">${L.teams.map(t => `<option value="${t.id}" ${t.id === ft ? 'selected' : ''}>${esc(t.city + ' ' + t.name)}</option>`).join('')}</select></div>${rafters(T)}${fAll ? `<div class="tblwrap"><table class="hwrap"><thead><tr>${fHead}</tr></thead><tbody>${fAll}</tbody></table></div>` : `<p class="muted">${mode === 'po' ? 'No playoff appearances yet.' : 'No completed seasons yet.'}</p>`}</section>
  <div class="grid2e" style="margin-top:16px"><section class="panel"><h2>Franchise records · ${mode === 'po' ? 'playoffs' : 'regular season'}</h2>${teamRecs}<h3 style="margin-top:10px">Best seasons</h3>${sRecs || '<p class="muted">None yet.</p>'}${dRecs ? `<h3 style="margin-top:10px">Best defensive seasons</h3>${dRecs}` : ''}<h3 style="margin-top:10px">Single game</h3>${gRecs || '<p class="muted">Tracked from this version on.</p>'}</section>
  <section class="panel"><h2>Franchise achievements</h2>${achHtmlF}</section></div>
  <details class="about" style="margin-top:12px"><summary>Full franchise history</summary>${teamHistoryInner(T)}</details>${me}`;
}
function achievementsView() {
  const log = L.achLog || [];
  const nm = x => x.kind === 'p' ? (L.players[x.id] ? plink(L.players[x.id]) : 'a player') : x.kind === 't' ? (L.teams[x.id] ? tlabel(x.id) : 'a team') : (findCoach(L, x.id) ? clink(findCoach(L, x.id)) : 'a coach');
  const cnt = {}; for (const x of log) { const k = x.kind + ':' + x.key; cnt[k] = (cnt[k] || 0) + 1; }
  const all = [...Object.entries(ACH_P).map(([k, n]) => ['p', k, n]), ...Object.entries(ACH_T).map(([k, n]) => ['t', k, n]), ...Object.entries(ACH_C).map(([k, n]) => ['c', k, n])];
  return `<div class="grid2e"><section class="panel"><h2>Latest</h2>${log.length ? log.slice(0, 40).map(x => `<div class="leader" style="grid-template-columns:minmax(0,1fr) auto"><span>${nm(x)} · ${esc(x.text)}</span><span class="muted">${seasonName(x.s)}</span></div>`).join('') : '<p class="muted">None yet.</p>'}</section>
  <section class="panel"><h2>How often</h2><p class="muted" style="margin-top:-4px">Players, teams and coaches who have unlocked each one. Your GM achievements are on your career page.</p>${all.map(([k, key, n]) => `<div class="leader" style="grid-template-columns:minmax(0,1fr) auto"><span>${esc(n)}</span><span class="muted">${cnt[k + ':' + key] || 0}</span></div>`).join('')}</section></div>`;
}
// All-time greats: legacy points = production each season + award points (same score the Hall of Fame uses)
// v37b: one career for everyone: seasons before 2026-27 (p.legBase, real awards) + this league's seasons; retired legends from their
// career totals (hxLegendGreats, same scale). Top 50 / Top 100 (ui.greatTop); by position and by team use the same entries.
function greatsList(tid) {
  const T = tid != null ? L.teams[tid] : null, ab = T && typeof nbaAbOf === 'function' ? nbaAbOf(T) : null;
  const mainPos = p => { const c = {}; for (const h of p.hist) if (h.rs && h.rs.gp && h.pos) { const k = h.pos.split('/')[0]; c[k] = (c[k] || 0) + h.rs.gp; } return Object.entries(c).sort((a, b) => b[1] - a[1])[0]?.[0] || POS[p.pos]; };
  const out = [];
  for (const p of Object.values(L.players)) {
    const realS = Object.keys(p.legSeasT || {}).filter(k => tid == null || p.legSeasT[k].includes(tid));
    if (tid != null && !realS.length && !p.hist.some(h => h.tid === tid && h.rs && h.rs.gp)) continue;
    const v = legacyScore(p, tid, true); if (!(v > 0)) continue;
    const rows = p.hist.filter(h => h.rs && h.rs.gp && (tid == null || h.tid === tid)), ss = new Set([...rows.map(h => h.s), ...realS.map(Number)]);
    const aw = p.awards.filter(a => tid == null || ss.has(a.s));
    out.push({ p, v, name: p.name, pos: mainPos(p), seasons: ss.size, peak: Math.max(0, ...rows.map(h => h.ovr || 0), tid == null && !p.retired ? p.ovr : 0) || '—',
      titles: aw.filter(a => a.a === 'Champion').length, mvp: aw.filter(a => a.a === 'MVP').length, as: aw.filter(a => a.a === 'All-Star').length,
      status: p.retired ? (p.hof || p.hofX ? 'Hall of Fame' : 'Retired') : (p.team != null && p.team >= 0 && L.teams[p.team] ? 'Active · ' + L.teams[p.team].abbr : 'Active') });
  }
  if (typeof hxLegendGreats === 'function') for (const { l, x } of hxLegendGreats(L)) {
    const v = tid == null ? x.v : (x.byT[ab] || 0); if (!(v > 0)) continue; const c = x.cnt;
    out.push({ l, v, name: l.name, pos: l.pos, seasons: tid == null ? x.seasons : '—', peak: '—', titles: tid == null ? c.Champion || 0 : '—', mvp: tid == null ? c.MVP || 0 : '—', as: tid == null ? c['All-Star'] || 0 : '—', status: l.hof ? 'Hall of Fame' : 'Retired' });
  }
  return out.sort((a, b) => b.v - a.v);
}
function greatsView() {
  const nameCell = x => x.p ? plink(x.p) : `<a class="lk" data-legend="${esc(x.name)}">${esc(x.name)}</a>`;
  const table = (list, tid) => list.length ? `<div class="tblwrap"><table class="hwrap"><thead><tr><th>#</th><th class="l">Player</th><th>Pos</th><th>Seasons</th><th title="Best rating in any season of this league">Peak</th><th>Titles</th><th>MVPs</th><th>All-Star</th><th title="Production each season plus award points; the Hall of Fame bar is ${hofMin(L)}">Legacy</th><th class="l">Status</th></tr></thead><tbody>${list.map((x, i) => `<tr><td>${i + 1}</td><td class="l">${nameCell(x)}</td><td>${x.pos}</td><td>${x.seasons}</td><td>${x.peak}</td><td>${x.titles}</td><td>${x.mvp}</td><td>${x.as}</td><td>${Math.round(x.v)}</td><td class="l muted">${x.status}</td></tr>`).join('')}</tbody></table></div>` : '<p class="muted">No completed seasons yet.</p>';
  const scored = greatsList(null), top = ui.greatTop === 100 ? 100 : 50;
  const pos = POS.includes(ui.greatPos) ? ui.greatPos : POS[0];
  const byPos = scored.filter(x => x.pos === pos).slice(0, 10);
  const gt = L.teams[ui.greatTeam] ? ui.greatTeam : (L.user != null && L.teams[L.user] ? L.user : 0);
  const byTeam = greatsList(gt).slice(0, 10);
  const tog = `<span class="subtabs" style="display:inline-flex;margin-left:8px;vertical-align:middle">${[50, 100].map(n => `<button class="sm ${n === top ? 'primary' : ''}" data-greattop="${n}">Top ${n}</button>`).join('')}</span>`;
  return `<details class="about"><summary>How this works</summary><p>Legacy points add up each season's production (game score per game: 4 points for each point above 10, on an 82-game season), playoff production on the same scale, and points for awards and titles (25 per title, 150 per MVP). Every season counts the same way, from 1946-47 on. Players whose seasons are only known as career totals are scored from those totals; stats not kept in their era (rebounds before 1950-51, steals, blocks and offensive rebounds before 1973-74, turnovers before 1977-78) are filled in at the usual rate for their position. It is the same score used for the Hall of Fame (${hofMin(L)} points, plus star credentials). Franchise lists count only seasons and awards with that team. Position is where the player spent most of his games.</p></details>
  <section class="panel"><h2>Top ${top} all time${tog}</h2>${table(scored.slice(0, top))}</section>
  <div class="grid2e" style="margin-top:16px"><section class="panel"><h2>Top 10 by position</h2><div class="subtabs" style="margin-bottom:8px">${POS.map(k => `<button class="sm ${k === pos ? 'primary' : ''}" data-greatpos="${k}">${k}</button>`).join('')}</div>${table(byPos)}</section>
  <section class="panel"><h2>Franchise greats</h2><div class="filters"><select id="greatteam">${L.teams.map(t => `<option value="${t.id}" ${t.id === gt ? 'selected' : ''}>${esc(t.city + ' ' + t.name)}</option>`).join('')}</select></div><p class="muted" style="margin:0 0 6px;font-size:12px">Seasons, peak, titles and awards with this team only (— where only career totals are known).</p>${table(byTeam, gt)}</section></div>`;
}
// Which team a player was on for a given award season
function awardTeamAbbr(pid) { const p = L.players[pid]; return p && p.team != null && L.teams[p.team] ? L.teams[p.team].abbr : ''; }
function awardTid(A, key, pid) {
  const snap = ((A.ladder || {})[key] || [])[0];
  if (snap && snap.pid === pid && snap.tid != null) return snap.tid;
  const p = L.players[pid]; if (!p) return null;
  const h = p.hist.find(x => x.s === A.season); if (h) return h.tid;
  return A.season === L.season ? p.team : null;
}
function awardCell(A, key) {
  if (key === 'coy') { if (A.coy == null) return '—'; const c = findCoach(L, A.coy); return `${c ? clink(c) : '—'}${A.coyTid != null ? ' <span class="muted">' + L.teams[A.coyTid].abbr + '</span>' : ''}`; }
  const id = A[key]; if (id == null || !L.players[id]) return '—';
  const tid = awardTid(A, key, id);
  return `${plink(L.players[id])}${tid != null ? ' <span class="muted">' + L.teams[tid].abbr + '</span>' : ''}`;
}
function awardsHistory() {
  const seasons = Object.keys(L.awards || {}).map(Number).filter(x => L.awards[x].mvp != null || L.awards[x].fmvp != null).sort((a, b) => b - a);
  const cols = [['mvp', 'MVP'], ['dpoy', 'Defensive POY'], ['roy', 'Rookie of the Year'], ['smoy', 'Sixth Man'], ['mip', 'Most Improved'], ['coy', 'Coach of the Year'], ['fmvp', 'Finals MVP']];
  // v32f: the NBA seasons before this league sit in the same table, below this league's seasons
  const pastAw = nbaHistOn(L) ? nbaHist().slice().reverse().map(h => `<tr><td class="l">${nbaSeasonLbl(h.y)}</td>${cols.map(([k]) => `<td class="l">${nbaNameCell(h[k])}</td>`).join('')}</tr>`).join('') : '';
  return `<section class="panel" style="margin-top:16px"><h2>Awards history</h2>${seasons.length || pastAw ? `<div class="tblwrap"><table><thead><tr><th class="l">Season</th>${cols.map(([k, n]) => `<th class="l">${trIcon(k, n)}</th>`).join('')}</tr></thead><tbody>${seasons.map(x => { const A = L.awards[x]; return `<tr><td class="l">${L.history.some(h => h.s === x) ? `<a class="lk" data-hs="${x}">${seasonName(x)}</a>` : seasonName(x)}</td>${cols.map(([k]) => `<td class="l">${k === 'fmvp' && A.fmvp == null ? '<span class="muted">' + (x === L.season && L.phase !== 'season-done' && !L.phase.startsWith('off') ? 'Playoffs' : '—') + '</span>' : awardCell(A, k)}</td>`).join('')}</tr>`; }).join('')}${pastAw}</tbody></table></div>` : '<p class="muted">Award winners are added here at the end of each regular season.</p>'}<p class="muted" style="margin:6px 0 0;font-size:12px">Open the Awards tab for each season's top-10 races, or a season above for All-League and All-Defense teams.</p></section>`;
}
// v27 H1: real NBA seasons 1946-47 to 2025-26 (data in nba-2026.js, not saved)
function nbaTeamCell(ab, then, strong) {
  const t = L.teams.find(x => nbaAbOf(x) === ab);
  if (!t) return esc(NBA_OLD[ab] || then || ab);
  return tlabel(t.id, strong) + (then && then !== tname(t.id) ? ` <span class="muted">${esc(then)}</span>` : '');
}
function nbaNameCell(v) {
  if (!v) return '<span class="muted">—</span>';
  if (!nbaNameCell.m || nbaNameCell.L !== L) { nbaNameCell.m = {}; nbaNameCell.L = L; for (const p of Object.values(L.players)) if (p.real || !nbaNameCell.m[p.name]) nbaNameCell.m[p.name] = p; }
  return nbaNames(v).map(n => nbaNameCell.m[n] ? plink(nbaNameCell.m[n]) : esc(n)).join(' / ');
}
// v32f: most wins of one award, this league's winners and the NBA seasons counted together
function awardLeadersAll(k, top) {
  const c = {}; for (const [n, x] of nbaAwardLeaders(k, 9999)) c[n] = x;
  for (const A of Object.values(L.awards || {})) { const id = A[k]; const nm = k === 'coy' ? (id != null && findCoach(L, id) ? findCoach(L, id).name : null) : (id != null && L.players[id] ? L.players[id].name : null); if (nm) c[nm] = (c[nm] || 0) + 1; }
  return Object.entries(c).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, top || 5);
}
function awardLeadersPanels() {
  if (!nbaHistOn(L)) return '';
  const lead = (k, n) => `<div class="panel"><h3>Most ${esc(n)} awards</h3>${awardLeadersAll(k, 5).map(([nm, c], i) => `<div class="leader"><span class="muted">${i + 1}</span><span>${nbaNameCell(nm)}</span><span class="v">${c}</span></div>`).join('')}</div>`;
  return `<div class="grid2e" style="margin-top:16px">${lead('mvp', 'MVP')}${lead('fmvp', 'Finals MVP')}${lead('dpoy', 'Defensive POY')}${lead('coy', 'Coach of the Year')}</div>`;
}
// v32f: a team's title and Finals years, NBA seasons and this league's seasons in one list (oldest first)
function teamFinalYears(t) {
  const F = nbaHistOn(L) ? nbaRealFinals(L, t) : [], ab = nbaAbOf(t);
  const won = [...F.filter(h => h.champ === ab).map(h => [h.y - 2025, nbaSeasonLbl(h.y)]), ...L.history.filter(h => h.champion === t.id).map(h => [h.s, seasonName(h.s)])].sort((a, b) => a[0] - b[0]).map(x => x[1]);
  const lost = [...F.filter(h => h.ru === ab).map(h => [h.y - 2025, nbaSeasonLbl(h.y)]), ...L.history.filter(h => h.runnerUp === t.id).map(h => [h.s, seasonName(h.s)])].sort((a, b) => a[0] - b[0]).map(x => x[1]);
  return { won, lost, rf: F.length };
}
// v32f: Finals MVPs of this franchise's earlier titles, as rows for the team's Award winners panel
function nbaTeamHonors(t) {
  if (!nbaHistOn(L)) return [];
  const ab = nbaAbOf(t);
  return nbaHist().filter(h => h.champ === ab && h.fmvp).reverse().map(h => `<div class="leader" style="grid-template-columns:60px minmax(0,1fr)"><span class="muted">${nbaSeasonLbl(h.y)}</span><span>Finals MVP: ${nbaNameCell(h.fmvp)}${h.champTm && h.champTm !== tname(t.id) ? ` <span class="muted">${esc(h.champTm)}</span>` : ''}</span></div>`);
}
function vSeasonHistory(h) {
  if (!h) { ui.hs = null; return vHistory(); }
  const A = h.awards || {};
  const team5 = ids => (ids || []).map(id => awardName(id)).join(', ') || '—';
  const leaders = [['Points', 'pts'], ['Rebounds', 'reb'], ['Assists', 'ast'], ['Steals', 'stl'], ['Blocks', 'blk']].map(([n, k]) => `<div class="panel"><h3>${n}</h3>${(h.leaders[k] || []).map((x, i) => `<div class="leader"><span class="muted">${i + 1}</span><span>${L.players[x.pid] ? plink(L.players[x.pid]) : esc(x.name)}</span><span class="v">${f1(x.v)}</span></div>`).join('')}</div>`).join('');
  return `<div class="row" style="margin-bottom:10px"><button data-hsback="1">All seasons</button><button data-review="${h.s}">Season review</button></div><h2>${seasonName(h.s)}${h.champion != null ? ' · Champions: ' + esc(tname(h.champion)) : ''}</h2>
  <div class="grid2" style="margin-bottom:16px"><section class="panel"><h3>Final standings</h3><div class="tblwrap"><table><thead><tr><th>#</th><th class="l">Team</th><th class="l">Outlook</th><th>W</th><th>L</th><th>PF/G</th><th>PA/G</th></tr></thead><tbody>${h.standings.map((s, i) => `<tr class="click" data-team="${s.tid}"><td>${s.conf ? confName(s.conf)[0] + s.confSeed : s.seed}</td><td class="l">${tlabel(s.tid, true)}</td><td class="l muted">${STATUS_LABEL[s.shown || s.status] || MODE_LABEL[s.mode] || ''}</td><td>${s.w}</td><td>${s.l}</td><td>${f1(s.pf / Math.max(1, s.w + s.l))}</td><td>${f1(s.pa / Math.max(1, s.w + s.l))}</td></tr>`).join('')}</tbody></table></div></section>
  <section class="panel"><h3>Awards</h3><div class="kv"><span class="k2">${trIcon('mvp', 'MVP')}</span><span>${A.mvp != null ? awardName(A.mvp) : '—'}</span><span class="k2">${trIcon('fmvp', 'Finals MVP')}</span><span>${A.fmvp != null ? awardName(A.fmvp) : '—'}</span><span class="k2">${trIcon('dpoy', 'Defensive POY')}</span><span>${A.dpoy != null ? awardName(A.dpoy) : '—'}</span><span class="k2">${trIcon('roy', 'Rookie of the Year')}</span><span>${A.roy != null ? awardName(A.roy) : '—'}</span><span class="k2">${trIcon('smoy', 'Sixth Man')}</span><span>${A.smoy != null ? awardName(A.smoy) : '—'}</span><span class="k2">${trIcon('mip', 'Most Improved')}</span><span>${A.mip != null ? awardName(A.mip) : '—'}</span>${A.clutch != null ? `<span class="k2">${trIcon('clutch', 'Clutch Player')}</span><span>${awardName(A.clutch)}</span>` : ''}${A.eoy ? `<span class="k2">${trIcon('eoy', 'Executive of the Year')}</span><span>${esc(A.eoy.name)} · ${tlink(A.eoy.tid)}</span>` : ''}${A.cfmvp ? Object.entries(A.cfmvp).map(([c, id]) => `<span class="k2">${trIcon('cfmvp', confName(c) + ' Conf. Finals MVP')}</span><span>${awardName(id)}</span>`).join('') : ''}<span class="k2">${trIcon('coy', 'Coach of the Year')}</span><span>${A.coy != null && findCoach(L, A.coy) ? clink(findCoach(L, A.coy)) : '—'}</span><span class="k2">${trIcon('m1', 'All-League 1st')}</span><span>${team5(A.all1)}</span><span class="k2">${trIcon('m2', 'All-League 2nd')}</span><span>${team5(A.all2)}</span><span class="k2">${trIcon('d1', 'All-Defense 1st')}</span><span>${team5(A.def1)}</span><span class="k2">${trIcon('d2', 'All-Defense 2nd')}</span><span>${team5(A.def2)}</span>
  ${A.titles ? Object.entries({ pts: 'Scoring', reb: 'Rebounding', ast: 'Assists', stl: 'Steals', blk: 'Blocks' }).map(([k, n]) => A.titles[k] ? `<span class="k2">${n} title</span><span>${awardName(A.titles[k].pid)} (${f1(A.titles[k].v)})</span>` : '').join('') : ''}</div>${h.s === 1 ? '<p class="muted" style="margin:8px 0 0">No Rookie of the Year in the first season, since every player was new to the league.</p>' : ''}</section></div>
  ${h.playoffs && h.playoffs.length ? `<h3>Playoffs</h3>${bracket(h.playoffs)}` : ''}
  <div class="grid2e" style="margin:16px 0"><section class="panel"><h3>All-League teams</h3>${teamListHtml(A, [['all1', '1st Team', 'm1'], ['all2', '2nd Team', 'm2'], ...(A.all3 ? [['all3', '3rd Team', 'm3']] : [])], true)}</section><section class="panel"><h3>All-Defense teams</h3>${teamListHtml(A, [['def1', '1st Team', 'd1'], ['def2', '2nd Team', 'd2']], true)}</section></div>
  ${A.fmvp != null ? fmvpHtml(A) : ''}
  ${(() => { let t = h.recap; if (!t && typeof seasonRecap === 'function') try { t = seasonRecap(L, h.s); } catch (e) { } return t ? `<section class="panel recap" style="margin-top:16px"><h3>Season recap</h3><p style="margin:0">${esc(t)}</p></section>` : ''; })()}
  <h3 style="margin-top:16px">Leaders</h3><div class="grid3">${leaders}</div>`;
}
// Record lists: every list is built to 100 entries; the page shows 10 and "Top 100" opens the rest
const REC_BUILD = {};
function recList(id, title, build, fmt) {
  REC_BUILD[id] = { title, build, fmt };
  const list = build();
  const rows = list.slice(0, 10).map((x, i) => `<div class="leader"><span class="muted">${i + 1}</span><span>${L.players[x.pid] ? plink(L.players[x.pid]) : esc(x.name)} <span class="muted">${esc(x.ctx || '')}</span></span><span class="v">${fmt ? fmt(x.v) : x.v}</span></div>`).join('') || '<p class="muted">None yet.</p>';
  return `<div class="panel"><h3>${title}</h3>${rows}${list.length > 10 ? `<p style="margin:6px 0 0"><button class="sm" data-top100="${id}">Top 100</button></p>` : ''}</div>`;
}
function top100Dialog(id) {
  const r = REC_BUILD[id]; if (!r) return;
  const list = r.build().slice(0, 100);
  dialog(`<h2>${r.title} · top ${list.length >= 50 && list.length < 100 && id.startsWith('fr-') ? 50 : list.length}</h2><div class="tblwrap" style="max-height:60vh;overflow:auto"><table><thead><tr><th>#</th><th class="l">Player</th><th class="l">When / notes</th><th>Value</th></tr></thead><tbody>${list.map((x, i) => `<tr><td>${i + 1}</td><td class="l">${L.players[x.pid] ? plink(L.players[x.pid]) : esc(x.name)}</td><td class="l muted">${esc(x.ctx || '')}</td><td><strong>${r.fmt ? r.fmt(x.v) : x.v}</strong></td></tr>`).join('')}</tbody></table></div><div class="row" style="margin-top:12px"><button id="x-close">Close</button></div>`, 'wide');
  $('#x-close').onclick = closeDialog;
}
function featsTracker() {
  const F = L.feats || { rs: {}, po: {} }, now = (L.featsBy || {})[L.season] || {};
  const all = Object.values(L.players);
  const rows = featList().map(x => {
    const ranked = all.filter(p => p.feats && p.feats.rs[x.key]).map(p => ({ pid: p.id, name: p.name, v: p.feats.rs[x.key], ctx: p.retired ? 'retired' : p.team != null ? L.teams[p.team].abbr : 'FA' })).sort((a, b) => b.v - a.v);
    REC_BUILD['feat-' + x.key] = { title: `Most ${x.label.toLowerCase()} games · regular season`, build: () => ranked };
    const lead = ranked[0];
    return `<tr><td class="l">${esc(x.label)}</td><td>${F.rs[x.key] || 0}</td><td>${now[x.key] || 0}</td><td>${F.po[x.key] || 0}</td><td class="l">${lead ? `${L.players[lead.pid] ? plink(L.players[lead.pid]) : esc(lead.name)} <span class="muted">${lead.v}</span>` : '—'}</td><td>${ranked.length ? `<button class="sm" data-top100="feat-${x.key}">Top 100</button>` : ''}</td></tr>`;
  }).join('');
  return `<h3>Feats tracker</h3><div class="panel" style="margin-bottom:16px"><div class="tblwrap"><table><thead><tr><th class="l">Feat (single game)</th><th>All-time, regular season</th><th>${seasonName(L.season)}</th><th>All-time, playoffs</th><th class="l">Most by one player</th><th></th></tr></thead><tbody>${rows}</tbody></table></div><p class="muted" style="margin:6px 0 0;font-size:12px">Counted from games played since this version was installed. Double-double = 10+ in two of points, rebounds, assists, steals and blocks.</p></div>`;
}
// v27.12 H4b: retired legends (real career totals)
const lgReb = r => r.trb != null ? r.trb : null;
const lgAw = a => ['MVP', 'Finals MVP', 'Champion', 'DPOY', 'All-NBA 1st', 'All-Star'].filter(k => a[k]).map(k => (a[k] > 1 ? a[k] + '× ' : '') + k).join(', ');
function legendsView() {
  const lg = nbaLegends(), rows = lg.map(x => { const r = x.rs, reb = lgReb(r);
    return `<tr class="click" data-legend="${esc(x.name)}"><td class="l"><strong>${esc(x.name)}</strong></td><td>${x.pos}</td><td>${x.from.slice(0, 4)}-${x.to.slice(0, 4)}</td><td class="l">${x.teams.join('/')}</td><td>${r.gp}</td><td>${r.pts != null ? r.pts.toLocaleString() : '—'}</td><td>${reb != null ? reb.toLocaleString() : '—'}</td><td>${r.ast != null ? r.ast.toLocaleString() : '—'}</td><td>${r.gp && r.pts != null ? f1(r.pts / r.gp) : '—'}</td><td>${x.hof || '—'}</td><td class="l">${esc(lgAw(typeof hxTopAwards === 'function' ? hxTopAwards(x) : x.aw))}</td></tr>`; }).join('');   // v34 B: from NBA_HX.aw / season list
  return `<h2 style="margin-top:20px">Legends</h2><p class="muted">${lg.length} retired greats with their career totals. Click a name for the career line and awards.</p><div class="panel"><div class="tblwrap"><table class="sortable" data-sid="legends"><thead><tr><th class="l">Name</th><th>Pos</th><th>Years</th><th class="l">Teams</th><th>GP</th><th>PTS</th><th>REB</th><th>AST</th><th>PPG</th><th>HOF</th><th class="l">Top awards</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
}
// v33e: retired legends' trophy case: All-NBA / All-Defense / All-Star seasons from NBA_HX.aw (history data)
function legendCase(name, x) {
  if (typeof hxHonors !== 'function') return '';
  const h = x ? hxHonors(name, hxYr(x.from), hxYr(x.to)) : hxHonors(name), ys = {}; for (const [k, n] of [['m1', 'All-League 1st Team'], ['m2', 'All-League 2nd Team'], ['m3', 'All-League 3rd Team'], ['d1', 'All-Defense 1st Team'], ['d2', 'All-Defense 2nd Team'], ['as', 'All-Star']]) if (h[k]) ys[n] = h[k];
  return trophyCaseHtml(ys, y => hxLbl(y)).replace('<section class="panel" style="margin-bottom:16px">', '<section class="panel" style="margin:12px 0">');
}
function legendDialog(name) {
  const x = nbaLegends().find(l => l.name === name); if (!x) return; const r = x.rs, g = r.gp || 1, reb = lgReb(r);
  const pg = v => v == null ? '—' : f1(v / g), tot = v => v == null ? '—' : v.toLocaleString();
  const aw = Object.entries(x.aw).sort((a, b) => b[1] - a[1]).map(([k, n]) => `<span class="muted" style="margin-right:10px">${n > 1 ? n + '× ' : ''}${esc(k)}</span>`).join('');
  dialog(`<h2>${esc(x.name)} <span class="muted" style="font-size:14px">retired · ${x.pos} · ${x.from.slice(0, 4)}-${x.to.slice(0, 4)} · ${x.teams.join('/')}</span></h2>
  <p class="muted">Born ${x.born}${x.hof ? ` · Hall of Fame ${x.hof}` : ''}</p>
  <div class="tblwrap"><table><thead><tr><th></th><th>GP</th><th>Min</th><th>PTS</th><th>REB</th><th>AST</th><th>STL</th><th>BLK</th><th>FG%</th><th>3P%</th><th>FT%</th><th>TS%</th><th>PER</th><th>WS</th></tr></thead><tbody>
  <tr><td class="l">Totals</td><td>${tot(r.gp)}</td><td>${tot(r.mp)}</td><td>${tot(r.pts)}</td><td>${tot(reb)}</td><td>${tot(r.ast)}</td><td>${tot(r.stl)}</td><td>${tot(r.blk)}</td><td>${r.fga && r.fgm != null ? pct(r.fgm, r.fga) : '—'}</td><td>${r.tpa && r.tpm != null ? pct(r.tpm, r.tpa) : '—'}</td><td>${r.fta && r.ftm != null ? pct(r.ftm, r.fta) : '—'}</td><td>${r.ts != null ? pct(r.ts, 1) : '—'}</td><td>${r.per != null ? f1(r.per) : '—'}</td><td>${r.ws != null ? f1(r.ws) : '—'}</td></tr>
  <tr><td class="l">Per game</td><td></td><td>${r.mp ? f1(r.mp / g) : '—'}</td><td>${pg(r.pts)}</td><td>${pg(reb)}</td><td>${pg(r.ast)}</td><td>${pg(r.stl)}</td><td>${pg(r.blk)}</td><td colspan="7"></td></tr></tbody></table></div>
  <h3 style="margin-top:12px">Awards</h3><div>${aw || '<span class="muted">None recorded.</span>'}</div>${legendCase(x.name, x)}<p class="muted" style="font-size:12px">Regular season. Blank = not tracked in that era.</p><p><button id="x-close" class="sm">Close</button></p>`);
  $('#x-close').onclick = closeDialog;
}
document.addEventListener('click', e => { const r = e.target.closest('[data-legend]'); if (r) legendDialog(r.dataset.legend); });
// v37a: League records sub tabs (ui.recTab stays set like the other sub tabs); only the open tab builds its lists
const REC_TABS = [['feats', 'Feats tracker'], ['game', 'Single game'], ['season', 'Season'], ['career', 'Career'], ['cpo', 'Career playoffs']], REC_PFX = { feats: [], game: ['g-'], season: ['s-'], career: ['c-'], cpo: ['cp-'] };
function records() {
  const rt = REC_TABS.some(x => x[0] === ui.recTab) ? ui.recTab : 'feats';
  REC_ONLY = REC_PFX[rt];
  try { return recordsBody(rt); } finally { REC_ONLY = null; }
}
function recordsBody(rt) {
  const all = Object.values(L.players);
  const HXo = typeof hxOn === 'function' && hxOn(L), hxCat = (b, ex) => HXo ? () => b().concat(ex()).sort((a, c) => c.v - a.v).slice(0, 100) : b;   // S6b: history (1946-2026) in the same lists
  const game = Object.entries(REC_KEYS).map(([k, n]) => recList('g-' + k, `${n} · game`, hxCat(() => (L.records.game[k] || []).map(r => ({ ...r, ctx: `${seasonName(r.s)} ${r.lb} vs ${L.teams[r.opp].abbr}` })), () => HX_GAME[k] ? hxRecGame(k) : [])));
  const seasons = [];
  for (const p of all) for (const h of p.hist) if (h.rs && h.rs.gp >= gpq(29)) seasons.push({ p, h });
  const sTop = (f, filter) => () => seasons.filter(x => !filter || filter(x.h.rs)).map(x => ({ pid: x.p.id, name: x.p.name, v: f(x.h.rs), ctx: seasonName(x.h.s) })).filter(x => x.v != null && isFinite(x.v)).sort((a, b) => b.v - a.v).slice(0, 100);
  const pgF = k => s => k === 'reb' ? (s.orb + s.drb) / s.gp : s[k] / s.gp;
  const perGameCats = [['Points per game', pgF('pts')], ['Rebounds per game', pgF('reb')], ['Off. rebounds per game', pgF('orb')], ['Def. rebounds per game', pgF('drb')], ['Assists per game', pgF('ast')], ['Steals per game', pgF('stl')], ['Blocks per game', pgF('blk')], ['3-pointers per game', pgF('tpm')], ['Usage rate', s => usg(s)], ['Box plus-minus (15+ min)', s => s.bpm != null && s.min / s.gp >= 900 ? s.bpm : null]];
  const pctCats = [['3-point % (1.5+ attempts/game or 75)', s => s.tpm / s.tpa, s => qualS(s, 'tp')], ['Free throw % (1.5+ attempts/game or 75)', s => s.ftm / s.fta, s => qualS(s, 'ft')], ['Field goal % (2+ attempts/game or 90)', s => s.fgm / s.fga, s => qualS(s, 'fg')]];
  const totCats = [['Points', s => s.pts], ['Rebounds', s => s.orb + s.drb], ['Assists', s => s.ast], ['Steals', s => s.stl], ['Blocks', s => s.blk], ['3-pointers', s => s.tpm]];
  const HXPG = { 'Points per game': 'PTS', 'Rebounds per game': 'TRB', 'Assists per game': 'AST', 'Steals per game': 'STL', 'Blocks per game': 'BLK' }, HXTOT = { Points: 'PTS', Rebounds: 'TRB', Assists: 'AST', Steals: 'STL', Blocks: 'BLK', '3-pointers': '3P' };
  const season = [...perGameCats.map(([n, f], i) => recList('s-pg' + i, `${n} · season`, HXPG[n] ? hxCat(sTop(f), () => hxRecSeason(HXPG[n], 'pg')) : sTop(f), n.startsWith('Box') ? sgn : f1)), ...pctCats.map(([n, f, flt], i) => recList('s-pct' + i, n, sTop(f, flt), x => pct(x, 1))), ...totCats.map(([n, f], i) => recList('s-tot' + i, `${n} · season total`, HXTOT[n] ? hxCat(sTop(f), () => hxRecSeason(HXTOT[n], 'tot')) : sTop(f)))];
  // v33c: PER / win shares / WS per 48 (game formula, history recomputed the same way): season 1,500+ min, career 15,000+ min (scaled to the season length)
  { const sMin = Math.round(1500 * SEASON_GAMES / 82), fmt = { per: f1, ws: f1, ws48: ws48Txt }, nm = { per: 'PER', ws: 'Win shares', ws48: 'Win shares per 48' };
    for (const k of ['per', 'ws', 'ws48']) { const b = () => seasons.filter(x => x.h.rs[k] != null && x.h.rs.min >= sMin * 60).map(x => ({ pid: x.p.id, name: x.p.name, v: x.h.rs[k], ctx: seasonName(x.h.s) + (x.h.rs.advEst ? ' (est.)' : '') })).sort((a, c) => c.v - a.v).slice(0, 100);
      season.push(recList('s-' + k + '-adv', `${nm[k]} · season (${sMin.toLocaleString()}+ min)`, HXo && typeof hxRecAdvX === 'function' ? hxCat(b, () => hxRecAdvX(k, 'season')) : b, fmt[k])); } }
  if (HXo) season.push(recList('s-bpm-hx', 'Box plus-minus · season (1,500+ min)', hxCat(() => seasons.filter(x => x.h.rs.bpm != null && x.h.rs.min >= 1500 * 60).map(x => ({ pid: x.p.id, name: x.p.name, v: x.h.rs.bpm, ctx: seasonName(x.h.s) })).sort((a, b) => b.v - a.v).slice(0, 100), () => hxRecAdv('season')), sgn));
  const careers = all.map(p => ({ p, s: sumStats([...nbaPast(p).filter(r => !r.est).map(nbaStatOf), ...p.hist.map(h => h.rs)]) })).filter(x => x.s);   // v27.12 H4: real seasons + sim seasons
  const names = new Set(all.map(p => p.name)), lgs = L.nba && typeof nbaLegends === 'function' ? nbaLegends().filter(l => !names.has(l.name)) : [];
  const cTop = f => () => [...careers.map(x => ({ pid: x.p.id, name: x.p.name, v: f(x.s), ctx: x.p.retired ? 'retired' : '' })), ...lgs.map(l => ({ pid: null, name: l.name, v: f(l.rs), ctx: 'retired legend' }))].filter(x => x.v != null && isFinite(x.v)).sort((a, b) => b.v - a.v).slice(0, 100);
  const HXC = { Points: 'PTS', Rebounds: 'TRB', Assists: 'AST', Steals: 'STL', Blocks: 'BLK', '3-pointers': '3P', 'Games played': 'G' }, known = new Set([...names, ...lgs.map(l => l.name)].map(n => typeof hxNorm === 'function' ? hxNorm(n) : n));
  const hxCar = (b, st, ty) => HXo && st ? () => b().concat((ty === 'PO' ? hxRecCareer(st, 'PO') : hxRecCareer(st)).filter(x => !known.has(hxNorm(x.name)))).sort((a, c) => c.v - a.v).slice(0, 100) : b;
  const career = [['Points', s => s.pts], ['Rebounds', s => s.orb != null && s.drb != null ? s.orb + s.drb : null], ['Off. rebounds', s => s.orb], ['Def. rebounds', s => s.drb], ['Assists', s => s.ast], ['Steals', s => s.stl], ['Blocks', s => s.blk], ['3-pointers', s => s.tpm], ['Games played', s => s.gp]].map(([n, f], i) => recList('c-' + i, `${n} · career`, hxCar(cTop(f), HXC[n])));
  if (HXo) career.push(recList('c-bpm-hx', 'Box plus-minus · career (15,000+ min)', () => hxRecAdv('career'), sgn));
  { const cMin = Math.round(15000 * SEASON_GAMES / 82), fmt = { per: f1, ws: f1, ws48: ws48Txt }, nm = { per: 'PER', ws: 'Win shares', ws48: 'Win shares per 48' };   // v33c
    for (const k of ['per', 'ws', 'ws48']) { const mn = k === 'ws' ? 0 : cMin, b = () => [...careers.filter(x => x.s[k] != null && x.s.min >= mn * 60).map(x => ({ pid: x.p.id, name: x.p.name, v: x.s[k], ctx: x.p.retired ? 'retired' : '' })), ...lgs.filter(l => l.rs[k] != null && (l.rs.mp || 0) >= mn).map(l => ({ pid: null, name: l.name, v: l.rs[k], ctx: 'retired legend' }))].sort((a, c) => c.v - a.v).slice(0, 100);
      career.push(recList('c-' + k + '-adv', `${nm[k]} · career${mn ? ` (${mn.toLocaleString()}+ min)` : ''}`, HXo && typeof hxRecAdvX === 'function' ? () => b().concat(hxRecAdvX(k, 'career').filter(x => !known.has(hxNorm(x.name)))).sort((a, c) => c.v - a.v).slice(0, 100) : b, fmt[k])); } }
  const poCar = all.map(p => ({ p, s: sumStats([...(typeof nbaPoRows === 'function' && p.real && L.nba ? nbaPoRows(p).map(nbaStatOf) : []), ...p.hist.map(h => h.po)]) })).filter(x => x.s && x.s.gp);   // v28.5 F5: real playoff rows + sim playoffs
  const poTop = f => () => poCar.map(x => ({ pid: x.p.id, name: x.p.name, v: f(x.s), ctx: x.p.retired ? 'retired' : '' })).filter(x => x.v != null && isFinite(x.v)).sort((a, b) => b.v - a.v).slice(0, 100);
  const careerPo = [['Points', s => s.pts], ['Rebounds', s => s.orb + s.drb], ['Assists', s => s.ast], ['Steals', s => s.stl], ['Blocks', s => s.blk], ['3-pointers', s => s.tpm], ['Games played', s => s.gp]].map(([n, f], i) => recList('cp-' + i, `${n} · career playoffs`, hxCar(poTop(f), HXC[n], 'PO')));
  const body = { feats: () => featsTracker(), game: () => `<div class="grid3">${game.join('')}</div>`, season: () => `<div class="grid3">${season.join('')}</div>`, career: () => `<div class="grid3">${career.join('')}</div>`, cpo: () => `<div class="grid3">${careerPo.join('')}</div>` }[rt]();
  return `<h2 style="margin-top:20px">League records</h2><details class="about"><summary>How this works</summary><p>Single-game records update live. Season and career records count completed seasons (29+ games for season records). Each list shows the top 10; press Top 100 for more.</p></details>
  ${REC_TABS.length ? `<div class="subtabs" style="margin-bottom:12px">${REC_TABS.map(([k, n]) => `<button class="sm ${rt === k ? 'primary' : ''}" data-rectab="${k}">${n}</button>`).join('')}</div>` : ''}${body}`;
}
function poWL(tid) { let w = 0, l = 0; for (const g of L.games) if (g.playoff && (g.home === tid || g.away === tid)) { if ((g.home === tid) === (g.hs > g.as)) w++; else l++; } return w + '-' + l; }
function vTeamStats() {
  const key = skey() === 'po' ? 'tpo' : 'trs', adv = ui.tsAdv;
  const rows = L.teams.map(t => ({ t, a: teamAdv(t[key]) })).filter(x => x.a);
  if (!rows.length) return `<section class="panel"><p class="muted">${key === 'tpo' ? 'No playoff games yet.' : 'No games yet this season.'}</p></section>`;
  const cols = adv ? [['pace', 'Pace', f1], ['ortg', 'Off rtg', f1], ['drtg', 'Def rtg', f1], ['net', 'Net rtg', sgn], ['efg', 'eFG%', x => pct(x, 1)], ['oefg', 'Opp eFG%', x => pct(x, 1)], ['ts', 'TS%', x => pct(x, 1)], ['tovp', 'TOV%', f1], ['orbp', 'ORB%', f1], ['drbp', 'DRB%', f1], ['ftr', 'FT rate', x => pct(x, 1)], ['tpar', '3PA rate', x => pct(x, 1)]]
    : [['ppg', 'PPG', f1], ['opp', 'Opp PPG', f1], ['diff', 'Diff', sgn], ['fg', 'FG%', x => pct(x, 1)], ['tp', '3P%', x => pct(x, 1)], ['ft', 'FT%', x => pct(x, 1)], ['rpg', 'RPG', f1], ['apg', 'APG', f1], ['spg', 'SPG', f1], ['bpg', 'BPG', f1], ['tov', 'TOV', f1]];
  const tips = { pace: 'Possessions per 48 minutes', ortg: 'Points scored per 100 possessions', drtg: 'Points allowed per 100 possessions (lower is better)', net: 'Off rtg minus def rtg', efg: 'Effective FG%', oefg: 'Opponent effective FG% (lower is better)', ts: 'True shooting %', tovp: 'Turnovers per 100 plays', orbp: 'Share of available offensive rebounds grabbed', drbp: 'Share of available defensive rebounds grabbed', ftr: 'Free throw attempts per field goal attempt', tpar: 'Share of shots that are threes' };
  for (const r of rows) { r.a.diff = r.a.ppg - r.a.opp; r.a.net = r.a.ortg - r.a.drtg; }
  const sk = cols.some(c => c[0] === ui.tsSort) ? ui.tsSort : cols[0][0];
  const low = ['opp', 'drtg', 'oefg', 'tovp', 'tov'].includes(sk);
  rows.sort((x, y) => (y.a[sk] - x.a[sk]) * (low ? -1 : 1) * (ui.tsDir || 1));
  function toggles() { return `<div class="filters"><span class="seg"><button class="sm ${adv ? '' : 'primary'}" data-tsadv="0">Basic</button><button class="sm ${adv ? 'primary' : ''}" data-tsadv="1">Advanced</button></span></div>`; }
  return `<section class="panel">${toggles()}<div class="tblwrap"><table><thead><tr><th class="l">Team</th><th>G</th><th>W-L</th>${cols.map(([k, n]) => `<th class="sort ${sk === k ? 'sorted' : ''}" data-tssort="${k}" ${tips[k] ? `title="${tips[k]}"` : ''}>${n}</th>`).join('')}</tr></thead><tbody>${rows.map(({ t, a }) => `<tr class="click ${isUser(t.id) ? 'mine' : ''}" data-team="${t.id}"><td class="l">${tlabel(t.id, true)}</td><td>${a.g}</td><td>${key === 'tpo' ? poWL(t.id) : t.w + '-' + t.l}</td>${cols.map(([k, n, f]) => `<td class="${k === 'diff' || k === 'net' ? (a[k] > 0 ? 'w' : 'lo') : ''}">${f(a[k])}</td>`).join('')}</tr>`).join('')}</tbody></table></div></section>`;
}
// ---------- stats tab: leaders, players and team stats for the current season ----------
function vStats() {
  const t = ui.statTab || 'leaders', po = skey() === 'po';
  const nav = `<div class="filters"><span class="seg">${[['leaders', 'Leaders'], ['players', 'Players'], ['teams', 'Team stats']].map(([k, n]) => `<button class="sm ${t === k ? 'primary' : ''}" data-stab="${k}">${n}</button>`).join('')}</span><span class="seg"><button class="sm ${po ? '' : 'primary'}" data-skey="rs">Regular season</button><button class="sm ${po ? 'primary' : ''}" data-skey="po">Playoffs</button></span></div>`;
  const body = t === 'players' ? vPlayers() : t === 'teams' ? vTeamStats() : vLeaders();
  return `<h2>${seasonName(L.season)} stats · ${po ? 'playoffs' : 'regular season'}</h2>${nav}${body}`;
}
// ---------- awards ----------
const AW_TABS = [['mvp', 'MVP'], ['dpoy', 'Defensive POY'], ['roy', 'Rookie of the Year'], ['smoy', 'Sixth Man'], ['mip', 'Most Improved'], ['clutch', 'Clutch'], ['coy', 'Coach of the Year']];
const AW_HOW = { clutch: 'Clutch time is the last 2 minutes of the 4th quarter or overtime with the score within 6. Needs 10+ clutch games. Ranked by clutch points per game, clutch shooting, plus/minus, go-ahead buckets and his team\'s record, then voted like the other awards.', mvp: 'Production = game score per game (40%), win shares (20%), WS/48 (15%), PER (10%) and box plus-minus (15%), each compared with the qualified players, then weighted heavily toward winning. Teams with a direct playoff spot get full credit (the best record a little extra); play-in teams and non-playoff teams are marked down, so an MVP from outside the direct playoff spots is rare.', dpoy: 'Picked from the All-Defense 1st Team, and he must play for a postseason team (top 5 in his conference, play-in included). Score: defensive win shares (35%) and defensive box plus-minus (15%), plus the tracking composite (50%): shots he saves as the primary defender vs what they should go in at, defensive rating while he plays, his defensive ratings, steals and blocks per 36 minutes, rim protection for bigs or contests for perimeter players, team defense. The tracking parts are compared within position groups; DWS and DBPM league-wide. A defensive archetype adds a small bonus, and a heavy scoring load (over 18 points a game) takes a little away, so specialists win ties with stars. Needs 24+ minutes a game.', roy: 'First-year players: game score per game (60%), PER (20%) and WS/48 (20%). PER and WS/48 count fully from 26 minutes a game, less below that, not at all under 16.', smoy: 'Players who started under 30% of their games: game score per game (60%), PER (20%) and WS/48 (20%). PER and WS/48 count fully from 26 minutes a game, less below that, not at all under 16.', mip: 'Biggest jump in game score per game from last season, plus rating growth and the change in PER and WS/48. Needs 30+ games last season.', coy: 'Wins compared with the preseason expectation for the roster, plus overall record.' };
const recTxt = (w, l) => w != null ? `${w}-${l}` : '—';
function awardSeasonData() {
  // live race during the regular season; the final vote once it's in
  if (L.phase === 'regular' && L.day > 0) return { s: L.season, live: true };
  const fin = Object.keys(L.awards || {}).map(Number).filter(s => L.awards[s].ladder).sort((a, b) => b - a);
  return { s: fin[0] != null ? fin[0] : null, live: false };
}
// v33c: the advanced numbers the award scoring now uses, in the ladders and award pages
function advH(key) { return `<th title="${esc(COL_TIPS.per)}">PER</th><th title="${esc(COL_TIPS.ws)}">WS</th><th title="${esc(COL_TIPS.bpm)}">BPM</th>${key === 'dpoy' ? `<th title="${esc(COL_TIPS.dws)}">DWS</th><th title="${esc(COL_TIPS.dbpm)}">DBPM</th>` : key === 'mip' ? '<th>PER last year</th>' : key === 'mvp' || key === 'roy' || key === 'smoy' ? `<th title="${esc(COL_TIPS.ws48)}">WS/48</th>` : ''}`; }
function advTd(key, x) { const o = v => v != null ? f1(v) : '—', sg = v => v != null ? sgn(v) : '—'; return `<td>${o(x.per)}</td><td>${o(x.ws)}</td><td>${sg(x.bpm)}</td>${key === 'dpoy' ? `<td>${o(x.dws)}</td><td>${sg(x.dbpm)}</td>` : key === 'mip' ? `<td>${o(x.prevPer)}</td>` : key === 'mvp' || key === 'roy' || key === 'smoy' ? `<td>${ws48Txt(x.ws48)}</td>` : ''}`; }
function advLine(x) { return x && x.per != null ? ` · PER ${f1(x.per)} · ${f1(x.ws)} WS · ${sgn(x.bpm)} BPM` : ''; }
function ladderRows(key, list, final) {
  if (!list || !list.length) return '<p class="muted">No qualified candidates yet.</p>';
  if (key === 'coy') return `<div class="tblwrap"><table class="sortable" data-sid="aw-coy"><thead><tr><th>#</th><th class="l">Coach</th><th class="l">Team</th><th>Record</th><th title="Wins the roster was expected to have by now">Expected W</th><th>Over / under</th></tr></thead><tbody>${list.map((x, i) => `<tr class="${final && i === 0 ? 'mine' : ''}"><td>${i + 1}</td><td class="l">${findCoach(L, x.cid) ? clink(findCoach(L, x.cid)) : esc(x.name)}${final && i === 0 ? ' <span class="pill pos">Winner</span>' : ''}</td><td class="l">${tlabel(x.tid, true)}</td><td>${recTxt(x.w, x.l)}</td><td>${x.expW}</td><td class="${x.w - x.expW > 0 ? 'w' : x.w - x.expW < 0 ? 'lo' : ''}">${x.w - x.expW > 0 ? '+' : ''}${x.w - x.expW}</td></tr>`).join('')}</tbody></table></div>`;
  const extraH = key === 'mip' ? '<th>Ovr now</th><th>Ovr last year</th><th>Pts last year</th>' : key === 'smoy' ? '<th>Starts</th>' : '';
  const extra = x => key === 'mip' ? `<td>${x.ovr}</td><td>${x.prevOvr != null ? x.prevOvr : '—'}</td><td>${x.prevPts != null ? f1(x.prevPts) : '—'}</td>` : key === 'smoy' ? `<td>${x.gs}</td>` : '';
  return `<div class="tblwrap"><table class="sortable" data-sid="aw-${key}"><thead><tr><th>#</th><th class="l">Player</th><th class="l">Team</th><th>Team record</th><th>GP</th><th>Min</th><th>Pts</th><th>Reb</th><th>Ast</th><th>Stl</th><th>Blk</th><th>FG%</th><th>3P%</th>${advH(key)}${extraH}</tr></thead><tbody>${list.map((x, i) => `<tr class="click ${final && i === 0 ? 'mine' : ''}" data-player="${x.pid}"><td>${i + 1}</td><td class="l">${L.players[x.pid] ? esc(L.players[x.pid].name) : esc(x.name)}${final && i === 0 ? ' <span class="pill pos">Winner</span>' : ''}</td><td class="l">${x.tid != null ? tlabel(x.tid, true) : '<span class="muted">FA</span>'}</td><td>${recTxt(x.w, x.l)}</td><td>${x.gp}</td><td>${f1(x.min)}</td><td><strong>${f1(x.pts)}</strong></td><td>${f1(x.reb)}</td><td>${f1(x.ast)}</td><td>${f1(x.stl)}</td><td>${f1(x.blk)}</td><td>${x.fg != null ? pct(x.fg, 1) : '—'}</td><td>${x.tp != null ? pct(x.tp, 1) : '—'}</td>${advTd(key, x)}${extra(x)}</tr>`).join('')}</tbody></table></div>`;
}
function allStarPanel(s) {
  const done = L.allStar && L.allStar.s === s ? L.allStar : null, hist = (L.allStarHist || {})[s];
  const liveVote = s === L.season && L.phase === 'regular' && !done;
  if (!liveVote && !hist) return '';
  const k = n => n >= 1e6 ? (n / 1e6).toFixed(2) + 'M' : n >= 1e3 ? Math.round(n / 1e3) + 'K' : n;
  const row = (pid, extra) => { const p = L.players[pid]; if (!p) return ''; return `<tr class="click ${isUser(p.team) ? 'mine' : ''}" data-player="${pid}"><td class="l">${esc(p.name)}</td><td class="l">${p.team != null ? L.teams[p.team].abbr : ''}</td><td class="l">${posLabel(p)}</td>${extra}</tr>`; };
  if (liveVote) {
    const day = allStarDay(L), left = day - L.day;
    const col = c => { const v = allStarVotes(L, c); const g = v.filter(x => L.players[x.pid].pos <= 1).slice(0, 2).map(x => x.pid), fc = v.filter(x => L.players[x.pid].pos >= 2).slice(0, 3).map(x => x.pid); const st = new Set([...g, ...fc]);
      return `<div><h3>${confName(c)}</h3><div class="tblwrap"><table><thead><tr><th class="l">Player</th><th class="l">Team</th><th class="l">Pos</th><th>Votes</th><th></th></tr></thead><tbody>${v.slice(0, 12).map(x => row(x.pid, `<td>${k(x.votes)}</td><td>${st.has(x.pid) ? '<span class="pill prot">Starter</span>' : ''}</td>`)).join('')}</tbody></table></div></div>`; };
    return `<section class="panel" style="margin-bottom:16px"><h2>All-Star voting · ${left > 0 ? `voting closes in ${left} day${left > 1 ? 's' : ''}` : 'final day'}</h2><p class="muted" style="margin-top:-4px">Fans vote in the starters (2 guards and 3 frontcourt players per conference) from fame and current play; 7 reserves per conference are picked on stats. The game is ${dd(day) ? 'on ' + dd(day) : 'on day ' + (day + 1)}.</p><div class="grid2e">${col('North')}${col('South')}</div></section>`;
  }
  const g = hist.game, mvp = g && g.mvp != null ? L.players[g.mvp] : null;
  const team = c => { const r = hist.rosters[c]; return `<div><h3>${confName(c)}${g ? ' · ' + (c === 'North' ? g.north : g.south) : ''}</h3><div class="tblwrap"><table><thead><tr><th class="l">Player</th><th class="l">Team</th><th class="l">Pos</th><th class="l"></th></tr></thead><tbody>${r.starters.map(id => row(id, '<td class="l"><span class="pill prot">Starter</span></td>')).join('')}${r.reserves.map(id => row(id, '<td class="l muted">Reserve</td>')).join('')}</tbody></table></div></div>`; };
  return `<section class="panel" style="margin-bottom:16px"><h2>${seasonName(s)} All-Star Game${g ? ` · ${confName(g.north > g.south ? 'North' : 'South')} ${Math.max(g.north, g.south)}-${Math.min(g.north, g.south)}` : ''}</h2>${mvp ? `<p style="margin-top:-4px">MVP: ${plink(mvp)}</p>` : ''}<div class="grid2e">${team('North')}${team('South')}</div></section>`;
}
function allStarDialog() {
  const s = L.allStar && L.allStar.s; if (s == null) return;
  L.allStar.shown = true;
  const mine = L.user != null ? [...L.allStar.rosters.North.starters, ...L.allStar.rosters.North.reserves, ...L.allStar.rosters.South.starters, ...L.allStar.rosters.South.reserves].filter(id => L.players[id] && L.players[id].team === L.user) : [];
  dialog(`<h2>${seasonName(s)} All-Star Game</h2>${L.user != null ? `<p>${mine.length ? `Your All-Stars: ${mine.map(id => plink(L.players[id])).join(', ')}.` : 'None of your players made the team this year.'}</p>` : ''}${allStarPanel(s)}<div class="row"><button class="primary" id="x-close">Continue</button></div>`, 'wide');
  $('#x-close').onclick = closeDialog;
}
function vAwards() {
  const key = ui.awKey || 'mvp';
  const d = awardSeasonData();
  const seasons = Object.keys(L.awards || {}).map(Number).filter(s => L.awards[s].ladder).sort((a, b) => b - a);
  let s = ui.awSeason != null && (seasons.includes(ui.awSeason) || (d.live && ui.awSeason === L.season)) ? ui.awSeason : d.s;
  const live = d.live && s === L.season;
  const list = s == null ? null : live ? awardLadder(L, key, 10) : (L.awards[s].ladder || {})[key];
  const opts = [...(d.live ? [L.season] : []), ...seasons.filter(x => !(d.live && x === L.season))];
  const sel = opts.length > 1 ? `<label>Season <select id="aw-season">${opts.map(x => `<option value="${x}" ${x === s ? 'selected' : ''}>${seasonName(x)}${d.live && x === L.season ? ' (live)' : ''}</option>`).join('')}</select></label>` : '';
  const status = s == null ? 'The award races start once games are played.' : live ? `Live race · ${seasonName(s)} · Day ${L.day} of ${L.schedule.length}. Players need ${awardMinGp(L)}+ games to qualify right now (40 by season's end).` : `Final results · ${seasonName(s)}${s === L.season - 1 && L.phase === 'regular' ? ' (last season; this year\'s race starts after the first games)' : ''}.`;
  return `${allStarPanel(s)}<section class="panel"><h2>Award races</h2><div class="filters"><span class="seg">${AW_TABS.map(([k, n]) => `<button class="sm ${k === key ? 'primary' : ''}" data-awkey="${k}">${n}</button>`).join('')}</span>${sel}</div>
  <div style="display:flex;gap:12px;align-items:center;margin:0 0 8px">${s != null ? trophySvg(key, 48, seasonName(s)) : ''}<p class="muted" style="margin:0">${status} <span class="tipword" title="${esc(AW_HOW[key])}">How it's decided</span></p></div>
  ${key === 'roy' && s === 1 ? '<p class="muted">No Rookie of the Year in the first season, since every player is new to the league.</p>' : s == null ? '' : ladderRows(key, list, !live)}
  <p class="muted" style="margin:8px 0 0;font-size:12px">All-League and All-Defense teams are announced with the awards at the end of the regular season. See the History tab for every season's winners.</p></section>`;
}
// Year-end awards dialog: one tab per award, winner up top, the next two below
function snapLine(x) { return `${f1(x.pts)} pts · ${f1(x.reb)} reb · ${f1(x.ast)} ast · ${f1(x.stl)} stl · ${f1(x.blk)} blk · ${x.fg != null ? pct(x.fg, 1) : '—'} FG · ${x.tp != null ? pct(x.tp, 1) : '—'} 3P · ${x.gp} games, ${f1(x.min)} min${advLine(x)}`; }
// "3rd MVP · also Y1, Y4" for winners and runners-up
function pastWins(pid, key, season) {
  if (key === 'coy') { const c = findCoach(L, pid); const w = c ? (c.honors || []).filter(h => h.a === 'Coach of the Year' && h.s < season).map(h => h.s) : []; return w; }
  const p = L.players[pid]; return p ? p.awards.filter(a => a.a === AWARD_NAMES[key] && a.s < season).map(a => a.s) : [];
}
const ordinal = n => n + (['th', 'st', 'nd', 'rd'][(n % 100 - 20) % 10] || ['th', 'st', 'nd', 'rd'][n % 100] || 'th');
function winBadge(pid, key, season, won) {
  const w = pastWins(pid, key, season); const label = key === 'coy' ? 'Coach of the Year' : AWARD_NAMES[key];
  if (won) return w.length ? `<span class="pill shop">${ordinal(w.length + 1)} ${esc(label)} · also won ${w.map(seasonName).join(', ')}</span>` : `<span class="pill prot">First ${esc(label)}</span>`;
  return w.length ? ` <span class="pill pos">${w.length}× winner (${w.map(seasonName).join(', ')})</span>` : '';
}
function awardWinnerHtml(A, key) {
  const lad = (A.ladder || {})[key] || [];
  if (key === 'roy' && A.roy == null) return '<p class="muted">No Rookie of the Year this season.</p>';
  if (key === 'mip' && A.mip == null) return '<p class="muted">No Most Improved Player this season.</p>';
  if (!lad.length) { const id = A[key]; const p = id != null ? L.players[id] : null; return p ? `<p>${plink(p)}</p>` : '<p class="muted">—</p>'; }
  const w = lad[0], ru = lad.slice(1, 3);
  if (key === 'coy') {
    const c = findCoach(L, w.cid);
    return `<div class="awcard"><div class="trrow">${trophySvg('coy', 64, seasonName(A.season))}${logo(w.tid, 56)}</div><div><div class="k">${esc(AWARD_NAMES.coy)}</div><div class="big">${c ? clink(c) : esc(w.name)}</div><div>${tlabel(w.tid, true)} · ${recTxt(w.w, w.l)} <span class="muted">(expected about ${w.expW} wins)</span></div><div style="margin-top:4px">${winBadge(w.cid, 'coy', A.season, true)}</div></div></div>
    <div class="runners"><strong>Finalists</strong>${ru.map((x, i) => `<div>${i + 2}. ${findCoach(L, x.cid) ? clink(findCoach(L, x.cid)) : esc(x.name)} · ${esc(tname(x.tid))} · ${recTxt(x.w, x.l)} (expected ${x.expW})${winBadge(x.cid, 'coy', A.season, false)}</div>`).join('') || '<div>None.</div>'}</div>`;
  }
  const p = L.players[w.pid];
  const clLine = key === 'clutch' && w.cl ? `<p class="note" style="margin:8px 0">Clutch: ${w.cl[0]} games · ${f1(w.cl[1] / w.cl[0])} pts per clutch game · ${w.cl[2] ? Math.round(w.cl[3] / w.cl[2] * 100) + '% FG' : '—'} · ${w.cl[4] >= 0 ? '+' : ''}${w.cl[4]} · ${w.cl[5]} go-ahead buckets</p>` : '';
  return clLine + `<div class="awcard"><div class="trrow">${trophySvg({ mvp: 'mvp', dpoy: 'dpoy', roy: 'roy', smoy: 'smoy', mip: 'mip', clutch: 'clutch' }[key] || 'mvp', 64, seasonName(A.season))}${w.tid != null ? logo(w.tid, 56) : ''}</div><div><div class="k">${esc(AWARD_NAMES[key])}</div><div class="big">${p ? plink(p) : esc(w.name)}${p ? ` <span class="muted" style="font-size:.6em">${posLabel(p)}</span>` : ''}</div><div>${w.tid != null ? tlabel(w.tid, true) : 'Free agent'} · team record ${recTxt(w.w, w.l)}</div>${key === 'dpoy' && A.dparts && A.dparts[w.pid] ? `<div class="muted" style="margin-top:2px">${dpartsTxt(A.dparts[w.pid])}</div>` : ''}<div style="margin-top:4px">${winBadge(w.pid, key, A.season, true)}</div></div></div>
  <div class="tblwrap"><table><thead><tr><th>GP</th><th>Min</th><th>Pts</th><th>Reb</th><th>Ast</th><th>Stl</th><th>Blk</th><th>TO</th><th>FG%</th><th>3P%</th><th>FT%</th>${w.per != null ? advH(key) : ''}${key === 'mip' ? '<th>Ovr change</th>' : ''}</tr></thead><tbody><tr><td>${w.gp}</td><td>${f1(w.min)}</td><td><strong>${f1(w.pts)}</strong></td><td>${f1(w.reb)}</td><td>${f1(w.ast)}</td><td>${f1(w.stl)}</td><td>${f1(w.blk)}</td><td>${w.tov != null ? f1(w.tov) : '—'}</td><td>${w.fg != null ? pct(w.fg, 1) : '—'}</td><td>${w.tp != null ? pct(w.tp, 1) : '—'}</td><td>${w.ft != null ? pct(w.ft, 1) : '—'}</td>${w.per != null ? advTd(key, w) : ''}${key === 'mip' ? `<td>${w.prevOvr != null ? w.prevOvr + ' → ' + w.ovr : '—'}</td>` : ''}</tr></tbody></table></div>
  <div class="runners"><strong>Runners-up</strong>${ru.map((x, i) => `<div>${i + 2}. ${L.players[x.pid] ? plink(L.players[x.pid]) + ' <span class="muted">' + posLabel(L.players[x.pid]) + '</span>' : esc(x.name)} · ${x.tid != null ? esc(tname(x.tid)) : 'FA'} (${recTxt(x.w, x.l)}) · ${snapLine(x)}${winBadge(x.pid, key, A.season, false)}</div>`).join('') || '<div>None.</div>'}</div>${votesHtml(A, key)}`;
}
// v15 defense line: opponents' FG% when he's the primary defender vs what those shots should go in at, contests, defensive rating
function dpartsTxt(d, short) { if (!d) return ''; const diff = d.dfg != null && d.dxp != null ? (d.dfg - d.dxp) * 100 : null; return `${short ? '' : 'Held his matchups to '}${d.dfg != null ? pct(d.dfg, 1) : '—'} FG${diff != null ? ` (<span class="${diff < 0 ? 'w' : 'lo'}">${diff > 0 ? '+' : ''}${diff.toFixed(1)}</span> vs expected)` : ''} · ${f1(d.con)} contests · ${f1(d.drtg)} DRtg`; }
// v17: grudges against former teams and player rivalries
// v19: trophy and medal art (original designs). Trophies carry the award and year on the plaque ("PBL" on history pages);
// medals carry the year (or "PBL") on the ribbon. Gradient ids are unique per drawing.
const TR_GOLD = ['#fff3b0', '#f2c94c', '#c9961a', '#8a6410'], TR_SILV = ['#ffffff', '#d9dee4', '#a7afb8', '#6e7781'], TR_BRON = ['#ffe0c2', '#e0a368', '#b06e33', '#7a4719'];
let trGid = 0;
const trId = p => 'tr' + p + (trGid++);
function trGrad(c) { const id = trId('g'); return { id, def: `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c[0]}"/><stop offset=".35" stop-color="${c[1]}"/><stop offset=".75" stop-color="${c[2]}"/><stop offset="1" stop-color="${c[3]}"/></linearGradient>` }; }
function trGradU(c) { const id = trId('u'); return { id, def: `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="38" y1="30" x2="84" y2="52" spreadMethod="reflect"><stop offset="0" stop-color="${c[1]}"/><stop offset=".3" stop-color="${c[0]}"/><stop offset=".6" stop-color="${c[1]}"/><stop offset="1" stop-color="${c[2]}"/></linearGradient>` }; }
function trWood() { const id = trId('w'); return { id, def: `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6b4423"/><stop offset="1" stop-color="#3b2412"/></linearGradient>` }; }
function trBase(w, l1, l2, plateG) { return `<rect x="22" y="128" width="76" height="26" rx="3" fill="url(#${w.id})"/><rect x="28" y="118" width="64" height="12" rx="2" fill="url(#${w.id})" opacity=".9"/><rect x="30" y="131" width="60" height="20" rx="2" fill="url(#${plateG.id})" stroke="#7a5a12" stroke-width=".6"/>
  <text x="60" y="${l2 ? 140 : 144.5}" text-anchor="middle" font-size="${l2 ? (l1.length > 11 ? 5.6 : 7) : 8.5}" font-weight="800" fill="#3d2c05" font-family="Inter,sans-serif" letter-spacing=".5">${l1}</text>${l2 ? `<text x="60" y="148.5" text-anchor="middle" font-size="7.5" font-weight="700" fill="#3d2c05" font-family="Inter,sans-serif">${l2}</text>` : ''}`; }
const trBall = (cx, cy, r) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#e57a2c" stroke="#7a3a10" stroke-width="1.6"/><path d="M${cx - r} ${cy} H${cx + r} M${cx} ${cy - r} V${cy + r} M${cx - r * .62} ${cy - r * .78} C${cx - r * .1} ${cy - r * .3} ${cx - r * .1} ${cy + r * .3} ${cx - r * .62} ${cy + r * .78} M${cx + r * .62} ${cy - r * .78} C${cx + r * .1} ${cy - r * .3} ${cx + r * .1} ${cy + r * .3} ${cx + r * .62} ${cy + r * .78}" fill="none" stroke="#7a3a10" stroke-width="1.2"/><ellipse cx="${cx - r * .35}" cy="${cy - r * .4}" rx="${r * .25}" ry="${r * .15}" fill="#fff" opacity=".35"/>`;
const trSvg = (size, defs, body, label) => `<svg xmlns="http://www.w3.org/2000/svg" class="trophy" width="${size}" height="${Math.round(size * 4 / 3)}" viewBox="0 0 120 160" role="img" aria-label="${label}"><defs>${defs}</defs>${body}</svg>`;
function trCup(kind, l1, l2, size) {
  const g = trGrad(TR_GOLD), w = trWood(), p = trGrad(TR_GOLD); let top = '', extra = '';
  if (kind === 'champ') top = `<path d="M30 14 H90 V44 C90 70 74 84 60 84 C46 84 30 70 30 44 Z" fill="url(#${g.id})" stroke="#7a5a12" stroke-width="1.5"/><path d="M30 22 C12 22 12 52 34 56 M90 22 C108 22 108 52 86 56" fill="none" stroke="url(#${g.id})" stroke-width="6" stroke-linecap="round"/><ellipse cx="60" cy="14" rx="30" ry="5" fill="#fff3b0" stroke="#7a5a12" stroke-width="1.2"/><path d="M52 84 H68 L66 104 H54 Z" fill="url(#${g.id})"/><rect x="40" y="104" width="40" height="14" rx="3" fill="url(#${g.id})" stroke="#7a5a12" stroke-width="1"/><path d="M40 30 C44 56 52 70 60 74" stroke="#fff" stroke-opacity=".45" stroke-width="3" fill="none"/>`;
  if (kind === 'dpoy') { const s = trGrad(['#e8eef5', '#7d9bb8', '#3f5f7f', '#1f344a']); extra = s.def; top = `<path d="M60 8 L94 20 V50 C94 76 78 92 60 100 C42 92 26 76 26 50 V20 Z" fill="url(#${s.id})" stroke="#16283a" stroke-width="1.5"/><path d="M60 16 L86 25 V50 C86 70 74 84 60 91 C46 84 34 70 34 50 V25 Z" fill="none" stroke="url(#${g.id})" stroke-width="2.5"/><path d="M60 30 L65 45 L81 45 L68 54 L73 70 L60 60 L47 70 L52 54 L39 45 L55 45 Z" fill="url(#${g.id})" stroke="#7a5a12" stroke-width=".8"/><rect x="54" y="100" width="12" height="10" fill="url(#${g.id})"/><rect x="44" y="108" width="32" height="10" rx="2" fill="url(#${g.id})"/>`; }
  if (kind === 'clutch') top = `<circle cx="60" cy="54" r="34" fill="url(#${g.id})" stroke="#7a5a12" stroke-width="1.5"/><circle cx="60" cy="54" r="27" fill="#fff8e1" stroke="#7a5a12" stroke-width="1"/><rect x="54" y="10" width="12" height="9" rx="2" fill="url(#${g.id})" stroke="#7a5a12"/><path d="M60 54 L60 33 M60 54 L74 62" stroke="#3d2c05" stroke-width="3" stroke-linecap="round"/>${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(i => { const a = i * Math.PI / 6; return `<line x1="${60 + Math.sin(a) * 23}" y1="${54 - Math.cos(a) * 23}" x2="${60 + Math.sin(a) * 26}" y2="${54 - Math.cos(a) * 26}" stroke="#7a5a12" stroke-width="1.4"/>`; }).join('')}<circle cx="60" cy="54" r="3" fill="#c0392b"/><rect x="54" y="88" width="12" height="16" fill="url(#${g.id})"/><rect x="44" y="104" width="32" height="14" rx="2" fill="url(#${g.id})"/>`;
  if (kind === 'eoy') top = `<path d="M38 26 H82 V52 C82 70 72 80 60 80 C48 80 38 70 38 52 Z" fill="url(#${g.id})" stroke="#7a5a12" stroke-width="1.5"/><ellipse cx="60" cy="26" rx="22" ry="4" fill="#fff3b0" stroke="#7a5a12"/><rect x="47" y="40" width="26" height="18" rx="2" fill="#3d2c05" opacity=".8"/><rect x="55" y="36" width="10" height="5" rx="1.5" fill="none" stroke="#3d2c05" stroke-width="2"/><path d="M47 48 H73" stroke="#f2c94c" stroke-width="1.2"/><path d="M53 80 H67 L65 100 H55 Z" fill="url(#${g.id})"/><rect x="42" y="100" width="36" height="18" rx="3" fill="url(#${g.id})" stroke="#7a5a12"/>`;
  if (kind === 'roy') top = `<path d="M60 6 L69 32 L97 32 L74 48 L83 75 L60 59 L37 75 L46 48 L23 32 L51 32 Z" fill="url(#${g.id})" stroke="#7a5a12" stroke-width="1.5"/><circle cx="60" cy="40" r="7" fill="#fff3b0" opacity=".8"/><path d="M55 72 C52 84 68 90 64 108 H56 C60 92 46 86 55 72 Z" fill="url(#${g.id})"/><rect x="44" y="106" width="32" height="12" rx="2" fill="url(#${g.id})"/>`;
  if (kind === 'mip') top = `<ellipse cx="60" cy="56" rx="30" ry="10" fill="none" stroke="url(#${g.id})" stroke-width="5"/><path d="M60 6 L84 34 H70 V100 H50 V34 H36 Z" fill="url(#${g.id})" stroke="#7a5a12" stroke-width="1.5"/><path d="M55 36 V98" stroke="#fff" stroke-opacity=".5" stroke-width="2"/><rect x="44" y="104" width="32" height="14" rx="2" fill="url(#${g.id})"/>`;
  if (kind === 'smoy') top = `<rect x="20" y="44" width="80" height="5" rx="2" fill="url(#${g.id})" opacity=".8"/><rect x="24" y="49" width="4" height="15" fill="url(#${g.id})" opacity=".8"/><rect x="92" y="49" width="4" height="15" fill="url(#${g.id})" opacity=".8"/>
    <rect x="18" y="64" width="84" height="9" rx="3" fill="url(#${g.id})" stroke="#7a5a12" stroke-width="1.2"/><rect x="24" y="73" width="7" height="29" fill="url(#${g.id})" stroke="#7a5a12" stroke-width=".8"/><rect x="89" y="73" width="7" height="29" fill="url(#${g.id})" stroke="#7a5a12" stroke-width=".8"/>
    ${trBall(44, 54, 10)}<path d="M62 64 L64 56 H90 L88 64 Z" fill="#f5ecd6" stroke="#7a5a12" stroke-width="1"/><text x="76" y="62.5" text-anchor="middle" font-size="8" font-weight="900" fill="#7a5a12" font-family="Inter,sans-serif">6</text>
    <rect x="34" y="100" width="52" height="18" rx="2" fill="url(#${g.id})" stroke="#7a5a12" stroke-width="1"/>`;
  return trSvg(size, g.def + w.def + p.def + extra, top + trBase(w, l1, l2, p), l1 + ' ' + (l2 || ''));
}
function trLimb(g, pts, w) { const pp = pts.map(p => p.join(',')).join(' '); return `<polyline points="${pp}" fill="none" stroke="#7a5a12" stroke-width="${w + 1.8}" stroke-linecap="round" stroke-linejoin="round"/><polyline points="${pp}" fill="none" stroke="url(#${g})" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`; }
function trShoe(g, x, y, dir) { return `<path d="M${x - 4 * dir} ${y - 2} q${8 * dir} -1 ${11 * dir} 3 l0 2 h${-13 * dir} z" fill="url(#${g})" stroke="#7a5a12" stroke-width="1"/>`; }
function trPerson(g, o) {
  return `${o.legs.map(l => trLimb(g, l, 7.5)).join('')}${o.shoes}<path d="${o.shorts}" fill="url(#${g})" stroke="#7a5a12" stroke-width="1.3"/><path d="${o.torso}" fill="url(#${g})" stroke="#7a5a12" stroke-width="1.3"/>${o.num ? `<text x="${o.num[0]}" y="${o.num[1]}" text-anchor="middle" font-size="9" font-weight="900" fill="#8a6410" font-family="Inter,sans-serif">${o.num[2]}</text>` : ''}${o.arms.map(a => trLimb(g, a, 6)).join('')}<rect x="${o.head[0] - 3}" y="${o.head[1] + 6}" width="6" height="6" fill="url(#${g})"/><circle cx="${o.head[0]}" cy="${o.head[1]}" r="8" fill="url(#${g})" stroke="#7a5a12" stroke-width="1.3"/><path d="M${o.head[0] - 6} ${o.head[1] - 3} q6 -7 12 0" fill="none" stroke="#8a6410" stroke-width="2"/><path d="${o.hl}" stroke="#fff" stroke-opacity=".5" stroke-width="2" fill="none"/>${o.extra || ''}`;
}
const trMini = (g, x, y, s) => `<g transform="translate(${x},${y}) scale(${s})"><path d="M-12 0 H12 V8 C12 16 6 20 0 20 C-6 20 -12 16 -12 8 Z" fill="url(#${g})" stroke="#7a5a12" stroke-width="1.4"/><path d="M-12 3 C-19 3 -19 12 -11 13 M12 3 C19 3 19 12 11 13" fill="none" stroke="url(#${g})" stroke-width="2.6"/><ellipse cx="0" cy="0" rx="12" ry="2.5" fill="#fff3b0" stroke="#7a5a12" stroke-width="1"/><rect x="-2.5" y="20" width="5" height="5" fill="url(#${g})"/><rect x="-7" y="25" width="14" height="4" rx="1" fill="url(#${g})" stroke="#7a5a12" stroke-width=".8"/></g>`;
function trStatue(kind, l1, l2, size) {
  const G = trGradU(TR_GOLD), w = trWood(), p = trGrad(TR_GOLD), g = G.id; let top = '';
  const plinth = `<rect x="38" y="104" width="44" height="14" rx="2" fill="url(#${g})" stroke="#7a5a12" stroke-width="1"/>`;
  if (kind === 'mvp') top = trPerson(g, { head: [60, 28], num: [60, 57, '1'], torso: 'M50 42 C48 48 48 58 50 66 H70 C72 58 72 48 70 42 C66 39 54 39 50 42 Z', shorts: 'M50 65 H70 L72 78 H61 L60 72 L59 78 H48 Z', legs: [[[55, 76], [55, 90], [55, 101]], [[65, 76], [65, 90], [65, 101]]], shoes: trShoe(g, 55, 102, -1) + trShoe(g, 65, 102, 1),
    arms: [[[51, 44], [44, 56], [46, 66]], [[69, 44], [75, 28], [76, 14]]], extra: trBall(77, 9, 8), hl: 'M53 46 C52 52 52 58 53 64' });
  if (kind === 'fmvp') top = trPerson(g, { head: [60, 36], num: [60, 64, '1'], torso: 'M50 48 C48 54 48 64 50 72 H70 C72 64 72 54 70 48 C66 45 54 45 50 48 Z', shorts: 'M50 71 H70 L72 82 H61 L60 77 L59 82 H48 Z', legs: [[[55, 80], [53, 92], [52, 101]], [[65, 80], [67, 92], [68, 101]]], shoes: trShoe(g, 52, 102, -1) + trShoe(g, 68, 102, 1),
    arms: [[[51, 50], [47, 36], [52, 22]], [[69, 50], [73, 36], [68, 22]]], extra: trMini(g, 60, 4, 0.9), hl: 'M53 52 C52 58 52 64 53 70' });
  if (kind === 'coy') top = trPerson(g, { torso: 'M50 40 C47 50 47 62 49 74 H71 C73 62 73 50 70 40 C66 37 54 37 50 40 Z', shorts: 'M49 73 H71 L70 80 H50 Z', head: [60, 26], legs: [[[55, 79], [55, 91], [55, 101]], [[65, 79], [65, 91], [65, 101]]], shoes: trShoe(g, 55, 102, -1) + trShoe(g, 65, 102, 1),
    arms: [[[51, 43], [47, 56], [66, 56]], [[69, 43], [73, 54], [54, 54]]], hl: 'M53 44 C51 52 51 62 52 70', extra: `<path d="M56 40 L60 48 L64 40" stroke="#7a5a12" stroke-width="1.2" fill="none"/><path d="M60 48 V62" stroke="#7a5a12" stroke-width="1" opacity=".6"/><circle cx="60" cy="64" r="2.6" fill="#c9961a" stroke="#7a5a12"/>` });
  return trSvg(size, G.def + w.def + p.def, top + plinth + trBase(w, l1, l2, p), l1 + ' ' + (l2 || ''));
}
function trMedal(kind, c, ribbon, rank, size) {
  const g = trGrad(c), r = trGrad(['#4a78c2', '#2f5d9e', '#24497d', '#1a355c']);
  const icon = { league: `<text x="60" y="106" text-anchor="middle" font-size="22" font-weight="900" fill="${c[3]}" font-family="Inter,sans-serif">${lgTag()}</text>`, def: `<path d="M60 80 L76 86 V98 C76 108 69 114 60 118 C51 114 44 108 44 98 V86 Z" fill="${c[3]}" opacity=".85"/>`, rook: `<path d="M60 80 L65 94 L80 94 L68 103 L72 117 L60 108 L48 117 L52 103 L40 94 L55 94 Z" fill="${c[3]}" opacity=".85"/>`, star: `<path d="M60 80 L65 94 L80 94 L68 103 L72 117 L60 108 L48 117 L52 103 L40 94 L55 94 Z" fill="#c0392b"/>` }[kind];
  const name = { league: 'ALL-LEAGUE', def: 'ALL-DEFENSE', rook: 'ALL-ROOKIE', star: 'ALL-STAR' }[kind] + (rank ? ' · ' + rank.toUpperCase() : '');
  return trSvg(size, g.def + r.def, `<path d="M34 4 L60 62 L86 4 Z" fill="url(#${r.id})"/><path d="M48 4 L60 34 L72 4 Z" fill="#c0392b"/><rect x="34" y="6" width="52" height="16" rx="2" fill="#1a355c" opacity=".9"/><text x="60" y="17.5" text-anchor="middle" font-size="9" font-weight="800" fill="#fff" font-family="Inter,sans-serif" letter-spacing=".5">${ribbon}</text>
  <circle cx="60" cy="98" r="34" fill="url(#${g.id})" stroke="${c[3]}" stroke-width="2.5"/><circle cx="60" cy="98" r="27" fill="none" stroke="${c[0]}" stroke-width="1.2" opacity=".8"/>${icon}
  <text x="60" y="148" text-anchor="middle" font-size="9" font-weight="800" fill="currentColor" font-family="Inter,sans-serif" letter-spacing=".4">${name}</text>`, name + ' ' + ribbon);
}
const TROPHY_OF = { 'Champion': 'champ', 'MVP': 'mvp', 'Finals MVP': 'fmvp', 'Defensive Player of the Year': 'dpoy', 'Rookie of the Year': 'roy', 'Sixth Man of the Year': 'smoy', 'Most Improved Player': 'mip', 'Coach of the Year': 'coy', 'All-League 1st Team': 'm1', 'All-League 2nd Team': 'm2', 'All-League 3rd Team': 'm3', 'Clutch Player of the Year': 'clutch', 'Conference Finals MVP': 'cfmvp', 'Executive of the Year': 'eoy', 'All-Defense 1st Team': 'd1', 'All-Defense 2nd Team': 'd2', 'All-Rookie 1st Team': 'r1', 'All-Rookie 2nd Team': 'r2', 'All-Star': 'as' };
const PLAQUE = { clutch: 'PBL CLUTCH', cfmvp: 'PBL CONF MVP', eoy: 'PBL EXECUTIVE', champ: 'PBL CHAMPS', mvp: 'PBL MVP', fmvp: 'PBL FINALS MVP', dpoy: 'PBL DPOY', roy: 'PBL ROOKIE', smoy: 'PBL 6TH MAN', mip: 'PBL MIP', coy: 'PBL COY' };
const MEDAL_OF = { m1: ['league', TR_GOLD, '1st'], m2: ['league', TR_SILV, '2nd'], m3: ['league', TR_BRON, '3rd'], d1: ['def', TR_GOLD, '1st'], d2: ['def', TR_SILV, '2nd'], r1: ['rook', TR_GOLD, '1st'], r2: ['rook', TR_BRON, '2nd'], as: ['star', TR_SILV, ''] };
// trophySvg(kind, size, label): label is a year ("2014"), a count ("×3"), or empty for history pages ("PBL" only)
function trophySvg(kind, size, label) {
  size = size || 44; label = label == null ? '' : String(label);
  if (MEDAL_OF[kind]) { const [k, c, rank] = MEDAL_OF[kind]; return trMedal(k, c, label && !/^×/.test(label) ? label : lgTag(), rank, size); }
  if (!PLAQUE[kind]) kind = 'mvp';
  const l1 = label ? PLAQUE[kind].replace('PBL', lgTag()) : lgTag(), l2 = label;
  return ['mvp', 'fmvp', 'coy', 'cfmvp'].includes(kind) ? trStatue(kind === 'cfmvp' ? 'fmvp' : kind, l1, l2, size) : trCup(kind, l1, l2, size);
}
const trChip = y => `<span class="trchip">${y}</span>`;
// Player pages: one trophy or medal per award type, with ×N and the years as chips
function trophyCase(p) {
  const ys = {}; for (const a of p.awards || []) if (TROPHY_OF[a.a]) (ys[a.a] = ys[a.a] || []).push(a.s);
  // stars carry every award in p.awards; other players take theirs from the NBA award list (v32f: one case, merged by type)
  if (p.real && nbaHistOn(L) && !(p.awards || []).some(a => a.real)) for (const h of nbaRealHonors(p.name)) { const nm = Object.keys(TROPHY_OF).find(k => TROPHY_OF[k] === h.k); if (nm) for (const y of h.ys) (ys[nm] = ys[nm] || []).push(y - 2025); }
  return trophyCaseHtml(ys, seasonName);
}
// v33e: shared by player pages and retired legends (ys = award name -> seasons; lbl turns a season into its chip text)
function trophyCaseHtml(ys, lbl) {
  const ks = Object.keys(TROPHY_OF).filter(k => ys[k]);
  if (!ks.length) return '';
  const short = k => k.replace('Defensive Player of the Year', 'DPOY').replace('Sixth Man of the Year', 'Sixth Man').replace('Most Improved Player', 'Most Improved').replace(' Team', '').replace('Champion', 'Champions');
  return `<section class="panel" style="margin-bottom:16px"><h3>Trophy case</h3><div class="trcase">${ks.map(k => { const s = ys[k].slice().sort((a, b) => a - b), med = !!MEDAL_OF[TROPHY_OF[k]];
    return `<div class="tritem" title="${esc(k)}"><div class="trart">${trophySvg(TROPHY_OF[k], med ? 54 : 64, med ? '' : s.length > 1 ? '×' + s.length : lbl(s[0]))}</div><div class="trname">${esc(short(k))}${s.length > 1 ? ` <strong>×${s.length}</strong>` : ''}</div><div class="trchips">${s.map(x => trChip(lbl(x))).join('')}</div></div>`; }).join('')}</div></section>`;
}
// Award popups: one trophy per win, each with its year
function trophyRow(kind, seasons, size) {
  const s = seasons.slice().sort((a, b) => a - b), show = s.slice(-6);
  return `<div class="trrow">${s.length > show.length ? `<span class="muted" style="font-size:12px;align-self:center">+${s.length - show.length}</span>` : ''}${show.map(x => trophySvg(kind, size, seasonName(x))).join('')}</div>`;
}
// Tables: a small icon with the year beside it
const trIcon = (kind, label) => `<span class="tricon"><img src="data:image/svg+xml;charset=utf-8,${encodeURIComponent(trophySvg(kind, 18, ''))}" width="18" height="24" alt="">${label ? `<span>${label}</span>` : ''}</span>`;
// v18: compare two players or two teams side by side
function cmpAcc(p) { const n = k => (p.awards || []).filter(a => a.a === k).length; return [['Titles', n('Champion')], ['MVP', n('MVP')], ['Finals MVP', n('Finals MVP')], ['DPOY', n('Defensive Player of the Year')], ['All-Star', n('All-Star')], ['All-League 1st', n('All-League 1st Team')], ['All-League 2nd', n('All-League 2nd Team')], ['All-Defense 1st', n('All-Defense 1st Team')], ['Rookie of the Year', n('Rookie of the Year')], ['All-Rookie', n('All-Rookie 1st Team') + n('All-Rookie 2nd Team')], ['Hall of Fame', p.hof ? 'Yes' : '—']]; }
document.addEventListener('click', e => { const b = e.target.closest('#modal [data-cmptab]'); if (!b || !ui.cmp) return; ui.cmpTab = b.dataset.cmptab; compareDialog(ui.cmp.kind, ui.cmp.a, ui.cmp.b); });
function compareDialog(kind, a, b) {
  ui.cmp = { kind, a, b };
  const opts = kind === 'p' ? Object.values(L.players).filter(p => !p.prospect && (p.team != null || p.retired || L.fa.includes(p.id)) && (p.hist.length || p.team != null)).sort((x, y) => y.ovr - x.ovr).slice(0, 600) : L.teams;
  const sel = (side, cur) => `<select id="cmp-${side}">${kind === 'p' ? `<option value="">Pick a player…</option>${opts.map(p => `<option value="${p.id}" ${p.id === cur ? 'selected' : ''}>${esc(p.name)} · ${p.retired ? 'retired' : p.team != null ? L.teams[p.team].abbr : 'FA'} · ${ovrNum(p)}</option>`).join('')}` : opts.map(t => `<option value="${t.id}" ${t.id === cur ? 'selected' : ''}>${esc(tname(t.id))}</option>`).join('')}</select>`;
  const row = (lab, x, y, better) => { let cx = '', cy = ''; if (better && typeof x === 'number' && typeof y === 'number' && x !== y) { const xb = better > 0 ? x > y : x < y; cx = xb ? 'w' : ''; cy = xb ? '' : 'w'; } return `<tr><td class="l muted">${lab}</td><td class="${cx}">${typeof x === 'number' && !Number.isInteger(x) ? f1(x) : x}</td><td class="${cy}">${typeof y === 'number' && !Number.isInteger(y) ? f1(y) : y}</td></tr>`; };
  let body = '<p class="muted">Pick two to compare.</p>';
  if (kind === 'p' && a != null && b != null && L.players[a] && L.players[b]) {
    const A = L.players[a], B = L.players[b]; try { computeBPM(L, 'rs'); } catch (e) { }
    const st = p => p.stats.rs && p.stats.rs.gp ? p.stats.rs : (p.hist.length ? p.hist[p.hist.length - 1].rs : null) || {};
    const pg = (p, k) => { const s = st(p); return s.gp ? (k === 'reb' ? s.orb + s.drb : s[k]) / s.gp : 0; };
    const ts = p => { const s = st(p); return s.fga ? s.pts / (2 * (s.fga + 0.44 * s.fta)) * 100 : 0; };
    const car = p => { const r = p.hist.filter(h => h.rs && h.rs.gp); const g = r.reduce((x, h) => x + h.rs.gp, 0); return g ? r.reduce((x, h) => x + h.rs.pts, 0) / g : 0; };
    const h = p2pRecord(L, a, b), rv = (L.rivals || []).find(r => (r.a === a && r.b === b) || (r.a === b && r.b === a));
    const c = p => p.contract ? `${money(p.contract.amt)} thru ${seasonName(contractEnd(p))}` : '—';
    const rows = [row('Team', A.retired ? 'Retired' : A.team != null ? L.teams[A.team].abbr : 'FA', B.retired ? 'Retired' : B.team != null ? L.teams[B.team].abbr : 'FA'), row('Position', posLabel(A), posLabel(B)), row('Type', esc(archLabel(A)), esc(archLabel(B))), row('Age', A.age, B.age), row('Overall', ovrNum(A), ovrNum(B), 1), row('Fame', fameLabel(A.fame || 0), fameLabel(B.fame || 0)),
      ...[['spd', 'Speed'], ['fin', 'Finishing'], ['mid', 'Mid-range'], ['tp', '3-point'], ['hnd', 'Handling'], ['pas', 'Passing'], ['per', 'Perimeter D'], ['pdf', 'Post D'], ['drb', 'Rebounding'], ['iq', 'IQ']].map(([k, n]) => row(n, attrNum(A, k), attrNum(B, k), 1)),
      row('Points / game', pg(A, 'pts'), pg(B, 'pts'), 1), row('Rebounds', pg(A, 'reb'), pg(B, 'reb'), 1), row('Assists', pg(A, 'ast'), pg(B, 'ast'), 1), row('Steals', pg(A, 'stl'), pg(B, 'stl'), 1), row('Blocks', pg(A, 'blk'), pg(B, 'blk'), 1), row('TS%', ts(A), ts(B), 1), row('BPM', st(A).bpm != null ? st(A).bpm : '—', st(B).bpm != null ? st(B).bpm : '—', 1), row('Career points / game', car(A), car(B), 1), row('Seasons', A.hist.filter(x => x.rs && x.rs.gp).length, B.hist.filter(x => x.rs && x.rs.gp).length),
      row('Contract', c(A), c(B)), row('Market value', money(A.mval || MINSAL), money(B.mval || MINSAL)),
      ...cmpAcc(A).map(([n, v], i) => row(n, v, cmpAcc(B)[i][1], typeof v === 'number' ? 1 : 0)),
      row('Head to head', h ? `${h.w}-${h.l}` : '—', h ? `${h.l}-${h.w}` : '—'), ...(rv ? [row('Rivalry', esc(rv.why), `since ${seasonName(rv.since)}`)] : [])];
    body = `<div class="tblwrap"><table><thead><tr><th class="l"></th><th>${plink(A)}</th><th>${plink(B)}</th></tr></thead><tbody>${rows.join('')}</tbody></table></div><p class="muted" style="font-size:12px">Head to head: games both played (players rated 72+, tracked from v18).</p>
      <div class="grid2e">${A.stats.zr ? shotChart(A.stats.zr, A.name) : '<p class="muted">No shot data</p>'}${B.stats.zr ? shotChart(B.stats.zr, B.name) : '<p class="muted">No shot data</p>'}</div>`;
  }
  if (kind === 't' && a != null && b != null) {
    const A = L.teams[a], B = L.teams[b], hh = h2h(L, a, b), lo = Math.min(a, b);
    const rec = (x) => { const w = x === lo ? hh.wLo : hh.wHi, l = x === lo ? hh.wHi : hh.wLo, pw = x === lo ? hh.poLo : hh.poHi, pl = x === lo ? hh.poHi : hh.poLo; return `${w}-${l}${pw + pl ? ` · playoffs ${pw}-${pl}` : ''}`; };
    const series = x => L.history.reduce((n, h) => n + (h.playoffs || []).reduce((m, rd) => m + (rd.series || []).filter(sr => ((sr.hi === a && sr.lo === b) || (sr.hi === b && sr.lo === a)) && sr.winner === x).length, 0), 0);
    const gp = t => Math.max(1, t.w + t.l), top3 = t => rosterOf(L, t).sort((x, y) => y.ovr - x.ovr).slice(0, 3).map(p => `${esc(p.name)} ${ovrNum(p)}`).join('<br>');
    const titles = t => L.history.filter(h => h.champion === t.id).length;
    const rows = [row('Record', recTxt(A.w, A.l), recTxt(B.w, B.l)), row('Conference rank', seedOrder(L, A.conf).indexOf(a) + 1, seedOrder(L, B.conf).indexOf(b) + 1, -1), row('Roster strength', Math.round(teamStrength(L, A)), Math.round(teamStrength(L, B)), 1), row('Points / game', A.pf / gp(A), B.pf / gp(B), 1), row('Allowed / game', A.pa / gp(A), B.pa / gp(B), -1), row('Margin', (A.pf - A.pa) / gp(A), (B.pf - B.pa) / gp(B), 1),
      row('Top players', top3(A), top3(B)), row('Coach', `${esc(A.coach.name)} (${A.coach.ovr})`, `${esc(B.coach.name)} (${B.coach.ovr})`), row('Systems', `${OFF_SYS[A.coach.off].name} · ${DEF_SYS[A.coach.def].name}`, `${OFF_SYS[B.coach.off].name} · ${DEF_SYS[B.coach.def].name}`),
      row('Payroll', money(payroll(L, A)), money(payroll(L, B))), row('Cap room', money(Math.max(0, CAP - payroll(L, A))), money(Math.max(0, CAP - payroll(L, B)))), row('Titles', titles(A), titles(B), 1),
      row('Head to head (all time)', rec(a), rec(b)), row('Playoff series won vs each other', series(a), series(b), 1)];
    // v25.1: three tabs: Personnel (as before), Basic stats and Advanced stats, each stat with its league rank; the better side highlighted
    const ct = ['pers', 'basic', 'adv'].includes(ui.cmpTab) ? ui.cmpTab : 'pers';
    const tabs = `<div class="subtabs" style="margin-bottom:8px">${[['pers', 'Personnel'], ['basic', 'Basic stats'], ['adv', 'Advanced stats']].map(([k, n]) => `<button class="sm ${ct === k ? 'primary' : ''}" data-cmptab="${k}">${n}</button>`).join('')}</div>`;
    if (ct === 'pers') body = tabs + `<div class="tblwrap"><table><thead><tr><th class="l"></th><th>${tlabel(a, true)}</th><th>${tlabel(b, true)}</th></tr></thead><tbody>${rows.join('')}</tbody></table></div>`;
    else body = tabs + cmpTeamStats(a, b, ct === 'adv');
  }
  dialog(`<h2>Compare ${kind === 'p' ? 'players' : 'teams'}</h2><div class="row" style="gap:8px;margin-bottom:10px">${sel('a', a)}<span class="muted">vs</span>${sel('b', b)}</div>${body}<div class="row" style="margin-top:12px"><button id="x-close">Close</button></div>`, 'wide');
  $('#x-close').onclick = closeDialog;
  for (const side of ['a', 'b']) $('#cmp-' + side).onchange = e => { const v = e.target.value === '' ? null : +e.target.value; compareDialog(kind, side === 'a' ? v : ui.cmp.a, side === 'b' ? v : ui.cmp.b); };
}
// v25.1: team stat comparison with league ranks (regular season, or the playoffs once both teams have played in them... regular season is the default)
function cmpTeamStats(a, b, adv) {
  const key = 'trs';
  const ext = x => { if (!x || !x.g) return null; const r = teamAdv(x); const poss = r.ortg ? 100 * x.pts / r.ortg : 1;
    Object.assign(r, { orpg: x.orb / x.g, drpg: x.drb / x.g, pf: x.pf / x.g, fgm: x.fgm / x.g, fga: x.fga / x.g, tpm: x.tpm / x.g, tpa: x.tpa / x.g, ftm: x.ftm / x.g, fta: x.fta / x.g,
      oppts: x.opts / x.g, oefg: (x.ofgm + 0.5 * x.otpm) / x.ofga, ots: x.opts / (2 * (x.ofga + 0.44 * x.ofta)), otovp: 100 * x.otov / (x.ofga + 0.44 * x.ofta + x.otov), oorbp: 100 * x.oorb / (x.oorb + x.drb), oftr: x.ofta / x.ofga, otpar: x.otpa / x.ofga, oortg: 100 * x.opts / poss });
    r.net = r.ortg - r.drtg; return r; };
  const all = L.teams.map(t => ({ id: t.id, s: ext(t[key]) })).filter(x => x.s);
  const A = all.find(x => x.id === a), B = all.find(x => x.id === b);
  if (!A || !B) return '<p class="muted">Both teams need games this season.</p>';
  const P = v => pct(v, 1), F = v => f1(v);
  const defs = adv ? [['Offense', null], ['ortg', 'Offensive rating', 1, F], ['drtg', 'Defensive rating', -1, F], ['net', 'Net rating', 1, v => (v > 0 ? '+' : '') + f1(v)], ['pace', 'Pace', 0, F], ['efg', 'eFG%', 1, P], ['ts', 'TS%', 1, P], ['tovp', 'TOV%', -1, F], ['orbp', 'ORB%', 1, F], ['ftr', 'FT rate', 1, P], ['tpar', '3PA rate', 0, P],
      ['Opponents', null], ['oefg', 'Opp eFG%', -1, P], ['ots', 'Opp TS%', -1, P], ['otovp', 'Opp TOV%', 1, F], ['oorbp', 'Opp ORB%', -1, F], ['oftr', 'Opp FT rate', -1, P], ['otpar', 'Opp 3PA rate', -1, P]]
    : [['ppg', 'Points', 1, F], ['oppts', 'Points allowed', -1, F], ['rpg', 'Rebounds', 1, F], ['orpg', 'Off. rebounds', 1, F], ['drpg', 'Def. rebounds', 1, F], ['apg', 'Assists', 1, F], ['spg', 'Steals', 1, F], ['bpg', 'Blocks', 1, F], ['tov', 'Turnovers', -1, F], ['pf', 'Fouls', -1, F],
      ['fg', 'FG', 1, null, 'fgm', 'fga'], ['tp', '3P', 1, null, 'tpm', 'tpa'], ['ft', 'FT', 1, null, 'ftm', 'fta']];
  const rank = (k, dir) => { const v = all.map(x => x.s[k]).sort((p, q) => dir < 0 ? p - q : q - p); return z => v.indexOf(z) + 1; };
  const ord = n => n + (n % 10 === 1 && n % 100 !== 11 ? 'st' : n % 10 === 2 && n % 100 !== 12 ? 'nd' : n % 10 === 3 && n % 100 !== 13 ? 'rd' : 'th');
  const rows = defs.map(d => { if (!d[1]) return `<tr class="nosort"><td class="l" colspan="3"><strong>${d[0]}</strong></td></tr>`;
    const [k, n, dir, f, mk, ak] = d, x = A.s[k], y = B.s[k], rk = rank(k, dir || 1);
    const cell = (S, v, o) => `<td class="${dir && v !== o && (dir > 0 ? v > o : v < o) ? 'w' : ''}">${mk ? `${f1(S[mk])}-${f1(S[ak])} · ${pct(v, 1)}` : f(v)} <span class="muted">${ord(rk(v))}</span></td>`;
    return `<tr><td class="l muted">${n}</td>${cell(A.s, x, y)}${cell(B.s, y, x)}</tr>`; }).join('');
  return `<div class="tblwrap"><table><thead><tr><th class="l">Per game · ${seasonName(L.season)} regular season</th><th>${tlabel(a, true)}</th><th>${tlabel(b, true)}</th></tr></thead><tbody>${rows}</tbody></table></div><p class="muted" style="font-size:12px">League rank of ${all.length} after each number. Green = better side${adv ? '; pace and 3PA rate are style, not better or worse' : ''}.</p>`;
}
function feudPanel(p) {
  const gs = (p.grudge || []).filter(g => g.until >= gameSeason(L) && L.teams[g.tid]), rs = rivalsOf(L, p);
  if (!gs.length && !rs.length) return '';
  return `<section class="panel" style="margin-bottom:16px"><h3>Rivalries</h3>${rs.map(r => `<div class="leader" style="grid-template-columns:minmax(0,1fr) auto"><span>${r.r.kind === 'draft' ? 'Draft-class rival' : 'Rival'}: ${plink(r.other)} ${r.other.team != null ? '· ' + tlabel(r.other.team) : ''} <span class="muted">(${esc(r.r.why)}, since ${seasonName(r.r.since)})</span></span><span>Head to head ${(r.r.w || {})[p.id] || 0}-${(r.r.w || {})[r.other.id] || 0}</span></div>`).join('')}${gs.map(g => `<div class="leader" style="grid-template-columns:minmax(0,1fr) auto"><span>Grudge vs ${tlabel(g.tid)} <span class="muted">(${esc(g.why)})</span></span><span class="muted">${g.perm ? 'permanent while he plays' : 'through ' + seasonName(g.until)}</span></div>`).join('')}<p class="muted" style="font-size:12px;margin:6px 0 0">He plays a little better and looks for his shot more in these games.</p></section>`;
}
function defensePanel(p) {
  // v16: this season plus every season tracked (from v15), no minimum
  const rows = [];
  const add = (lab, tid, d, st) => { if (!d || !d[0] || !st || !st.gp) return; const g = st.gp, fg = d[1] / d[0], xp = d[2] / d[0], df = (fg - xp) * 100; rows.push(`<tr><td class="l">${lab}</td><td class="l">${tid != null && L.teams[tid] ? L.teams[tid].abbr : '—'}</td><td>${g}</td><td>${f1(d[0] / g)}</td><td>${pct(fg, 1)}</td><td>${pct(xp, 1)}</td><td class="${df < 0 ? 'w' : 'lo'}">${df > 0 ? '+' : ''}${df.toFixed(1)}</td><td>${f1((d[2] - d[1]) / g)}</td><td>${f1(d[3] / Math.max(1, d[4]) * 100)}</td><td>${d[5] ? pct(d[6] / d[5], 1) : '—'}</td></tr>`); };
  if (!p.hist.some(h => h.s === L.season)) add(seasonName(L.season) + '*', p.team, p.stats && p.stats.dz, p.stats && p.stats.rs);
  for (const h of p.hist.slice().reverse()) add(seasonName(h.s), h.tid, h.d, h.rs);
  if (!rows.length) return '';
  return `<section class="panel" style="margin-bottom:16px"><h3>Defense</h3><div class="tblwrap"><table><thead><tr><th class="l">Season</th><th class="l">Team</th><th>GP</th><th title="Shots he defended as the primary defender, per game">Contests</th><th title="Opponents' FG% on those shots">Opp FG%</th><th title="What those shots should have gone in at">Expected</th><th>Diff</th><th title="Expected makes minus actual makes, per game">Saved</th><th title="Opponents' points per 100 possessions while he plays">DRtg</th><th title="Opponents' FG% at the rim while he plays">Rim FG%</th></tr></thead><tbody>${rows.join('')}</tbody></table></div><p class="muted" style="font-size:12px;margin:6px 0 0">Regular season. Tracked from v15 on. * this season.</p></section>`;
}
function teamListHtml(A, keys, plain) {
  const rec = tid => A.recs && A.recs[tid] ? ` (${A.recs[tid][0]}-${A.recs[tid][1]})` : '';
  const def = keys.some(([k]) => k.startsWith('def'));
  const row = id => { const p = L.players[id]; if (!p) return ''; const sn = (A.snaps || {})[id]; const tid = sn ? sn.tid : p.team;
    const dp = def && A.dparts && A.dparts[id];
    const st = sn ? (def ? (dp ? dpartsTxt(dp, true) + ` · ${f1(sn.stl)} stl · ${f1(sn.blk)} blk` : `${f1(sn.stl)} stl · ${f1(sn.blk)} blk · ${f1(sn.reb)} reb · ${f1(sn.pts)} pts`) : `${f1(sn.pts)} pts · ${f1(sn.reb)} reb · ${f1(sn.ast)} ast · ${sn.fg != null ? pct(sn.fg, 1) : '—'} FG`) : '';
    return `<div class="leader" style="grid-template-columns:minmax(0,1.3fr) minmax(0,1.4fr) auto"><span>${plink(p)} <span class="muted">${posLabel(p)}</span></span><span>${st}</span><span class="muted">${tid != null ? esc(L.teams[tid].abbr) + rec(tid) : 'FA'}</span></div>`; };
  return keys.map(([k, n, kd]) => `<h3 style="margin-top:10px;display:flex;align-items:center;gap:8px">${trophySvg(TROPHY_OF[n] || kd || 'm1', 40, plain ? '' : seasonName(A.season))}${n}</h3>${(A[k] || []).map(row).join('') || '<p class="muted">—</p>'}`).join('');
}
function awardsDialog(tab) {
  const A = L.awards[L.season]; if (!A) return;
  tab = tab || 'mvp';
  const tabs = [...AW_TABS, ['eoy', 'Executive'], ['all', 'All-League'], ['def', 'All-Defense'], ['roo', 'All-Rookie'], ['titles', 'Stat titles']];
  let body;
  if (tab === 'all') body = teamListHtml(A, [['all1', 'All-League 1st Team'], ['all2', 'All-League 2nd Team'], ...(A.all3 ? [['all3', 'All-League 3rd Team']] : [])]);
  else if (tab === 'eoy') body = A.eoy ? `<div class="awcard"><div class="trrow">${trophySvg('eoy', 64, seasonName(A.season))}${logo(A.eoy.tid, 56)}</div><div><div class="k">Executive of the Year</div><div class="big">${esc(A.eoy.name)}</div><div>${tlabel(A.eoy.tid, true)} · ${recTxt(L.teams[A.eoy.tid].w, L.teams[A.eoy.tid].l)}</div><p class="muted" style="margin:6px 0 0;font-size:12px">${A.eoy.impr == null ? '' : `${A.eoy.impr >= 0 ? '+' : ''}${A.eoy.impr} wins on last season · `}${A.eoy.beat >= 0 ? '+' : ''}${A.eoy.beat} vs preseason expectation · newcomers' production ${A.eoy.nv}</p></div></div><div class="runners"><strong>Finalists</strong>${(A.eoyLadder || []).slice(1, 3).map((x, i) => `<div>${i + 2}. ${esc(x.name)} · ${esc(tname(x.tid))} (${x.impr == null ? '' : `${x.impr >= 0 ? '+' : ''}${x.impr} wins, `}${x.beat >= 0 ? '+' : ''}${x.beat} vs expected)</div>`).join('') || '<div>None.</div>'}</div><p class="note">The general manager award: team improvement, beating its preseason expectation, and what this season's new arrivals produced. Play-in teams or better only.</p>` : '<p class="muted">Executive of the Year starts in v22.</p>';
  else if (tab === 'def') body = teamListHtml(A, [['def1', 'All-Defense 1st Team'], ['def2', 'All-Defense 2nd Team']]);
  else if (tab === 'roo') body = A.roo1 ? teamListHtml(A, [['roo1', 'All-Rookie 1st Team'], ['roo2', 'All-Rookie 2nd Team']]) : '<p class="muted">All-Rookie teams start in v18.</p>';
  else if (tab === 'titles') { const PL = x => L.players[x.pid] ? `${plink(L.players[x.pid])} <span class="muted">${awardTeamAbbr(x.pid)}</span>` : '—';   // v20: winner plus the next two
    body = `<div class="tblwrap"><table><thead><tr><th class="l">Title</th><th class="l">Winner</th><th>Per game</th><th class="l">2nd</th><th>Per game</th><th class="l">3rd</th><th>Per game</th></tr></thead><tbody>${Object.entries({ pts: 'Scoring', reb: 'Rebounding', ast: 'Assists', stl: 'Steals', blk: 'Blocks' }).map(([k, t]) => { const w = A.titles && A.titles[k]; if (!w) return ''; const ru = w.ru || [];
      return `<tr><td class="l">${t}</td><td class="l"><strong>${PL(w)}</strong></td><td><strong>${f1(w.v)}</strong></td>${[0, 1].map(i => ru[i] ? `<td class="l">${PL(ru[i])}</td><td>${f1(ru[i].v)}</td>` : '<td class="l muted">—</td><td></td>').join('')}</tr>`; }).join('')}</tbody></table></div>${A.titles && Object.values(A.titles).some(w => !w.ru) ? '<p class="muted" style="font-size:12px">Runners-up are recorded from v20 on.</p>' : ''}`; }
  else body = awardWinnerHtml(A, tab);
  dialog(`<h2>${seasonName(L.season)} awards</h2><div class="subtabs">${tabs.map(([k, n]) => `<button class="sm ${k === tab ? 'primary' : ''}" data-awtab="${k}">${n}</button>`).join('')}</div><div style="min-height:230px">${body}</div><div class="row" style="margin-top:14px"><button class="primary" id="x-close">Continue</button><span class="muted" style="font-size:12px">Every season's winners are saved on the History tab.</span></div>`, 'wide');
  $('#x-close').onclick = closeDialog;
  document.querySelectorAll('[data-awtab]').forEach(b => b.onclick = () => awardsDialog(b.dataset.awtab));
}
// v27.8 S3: coaching tree, former player, system history
function treeHtml(nodes) { return nodes.length ? `<ul class="ctree">${nodes.map(n => `<li>${clink(n.c)} <span class="muted">${n.c.retired ? 'retired' : (L.teams.find(t => t.coach === n.c) ? L.teams.find(t => t.coach === n.c).abbr : 'available')} · ovr ${n.c.ovr}</span>${treeHtml(n.kids)}</li>`).join('')}</ul>` : ''; }
function coachTreePanel(c) {
  const mentor = c.mentor != null ? findCoach(L, c.mentor) : null, tree = coachTree(L, c, 3), ex = c.exP != null ? L.players[c.exP] : null;
  const sh = (c.sysHist || []).slice().reverse().map(x => { const T = x.k === 'off' ? OFF_SYS : DEF_SYS; return `<div>${seasonName(x.s)} · ${x.k === 'off' ? 'offense' : 'defense'}: ${esc((T[x.from] || {}).name || x.from)} → ${esc((T[x.to] || {}).name || x.to)}</div>`; }).join('');
  if (!mentor && !tree.length && !ex && !sh) return '';
  return `<section class="panel" style="margin-bottom:16px"><h3>Coaching tree</h3>${ex ? `<div class="kv"><span class="k2">Former player</span><span>${plink(ex)}</span></div>` : ''}${mentor ? `<div class="kv"><span class="k2">Mentor</span><span>${clink(mentor)}</span></div>` : ''}${tree.length ? `<div class="k2" style="margin-top:6px">Coaches he has mentored</div>${treeHtml(tree)}` : '<p class="muted" style="font-size:12px">No coaches from his tree yet.</p>'}${sh ? `<h3 style="margin-top:12px">System history</h3>${sh}` : ''}</section>`;
}
// v27.8 S3: GM page, staff history
function vGM(g) {
  const cr = gmCareer(L, g), f = g.fo || {}, FS = FO_STYLE[f.style] || FO_STYLE.neutral, cur = L.teams.find(t => t.gm === g);
  const sum = cur ? foSummary(L, cur) : null, traits = sum ? sum.traits : [];
  const st = (g.stints || []).map(x => { const h = (g.hist || []).filter(y => y.tid === x.tid && y.s >= x.from && (x.to == null || y.s <= x.to)); const w = h.reduce((a, y) => a + y.w, 0), l = h.reduce((a, y) => a + y.l, 0);
    return `<tr class="click" data-team="${x.tid}"><td class="l">${tlabel(x.tid, true)}</td><td>${seasonName(x.from)}–${x.to != null ? seasonName(x.to) : 'now'}</td><td>${w}-${l}</td><td class="l muted">${x.to == null ? 'Current' : esc(x.how || 'Left')}</td></tr>`; }).join('');
  const hs = (g.hist || []).slice().reverse().map(h => `<tr><td class="l">${seasonName(h.s)}</td><td class="l">${tlink(h.tid)}</td><td>${h.w}-${h.l}</td><td class="l">${esc(h.po || '')}</td></tr>`).join('');
  return `<div class="crumbs"><button data-back="1">Back</button></div>
  <section class="panel" style="margin-bottom:16px"><div class="bio"><div style="min-width:0"><div class="k">${cur ? tlink(cur.id, true) : (L.gmPool || []).includes(g) ? 'Available GM' : 'Retired GM'}</div><div class="big">${esc(g.name)}</div><div class="row" style="margin-top:6px"><span class="pill">${esc(FS.label)}</span>${traits.map(x => `<span class="pill fo-trait fo-${x.k}" title="${esc(x.why)}">${esc(x.label)}</span>`).join('')}</div></div>
  <div><div class="k">Age</div><div class="v">${g.age != null ? g.age : '—'}</div></div><div><div class="k">Record</div><div class="v">${cr.w}-${cr.l}</div></div><div><div class="k">Seasons</div><div class="v">${cr.seasons}</div></div><div><div class="k">Playoffs</div><div class="v">${cr.playoffs}</div></div><div><div class="k">Titles</div><div class="v">${cr.titles}</div></div><div><div class="k">Teams</div><div class="v">${cr.teams.length}</div></div></div></section>
  <section class="panel" style="margin-bottom:16px"><h3>Stints</h3>${st ? `<div class="tblwrap"><table><thead><tr><th class="l">Team</th><th>Years</th><th>W-L</th><th class="l">Ended</th></tr></thead><tbody>${st}</tbody></table></div>` : '<p class="muted">No stints yet.</p>'}</section>
  <section class="panel"><h3>Season by season</h3>${hs ? `<div class="tblwrap"><table><thead><tr><th class="l">Season</th><th class="l">Team</th><th>W-L</th><th class="l">Playoffs</th></tr></thead><tbody>${hs}</tbody></table></div>` : '<p class="muted">No completed seasons yet.</p>'}</section>`;
}
function allGMs() { return [...L.teams.map(t => t.gm), ...(L.gmPool || []), ...(L.gmArchive || [])].filter((g, i, a) => g && a.indexOf(g) === i); }
function staffHistory(t) {
  const tid = t.id;
  const gms = allGMs().map(g => ({ g, stints: (g.stints || []).filter(x => x.tid === tid) })).filter(x => x.stints.length).map(x => { const h = (x.g.hist || []).filter(y => y.tid === tid), w = h.reduce((a, y) => a + y.w, 0), l = h.reduce((a, y) => a + y.l, 0); return { g: x.g, from: Math.min(...x.stints.map(s => s.from)), to: x.stints.some(s => s.to == null) ? null : Math.max(...x.stints.map(s => s.to)), w, l }; }).sort((a, b) => b.from - a.from);
  const cs = [...L.teams.map(x => x.coach), ...L.coachPool, ...(L.coachArchive || [])].filter((c, i, a) => c && a.indexOf(c) === i).map(c => { const stn = (c.stints || []).filter(x => x.tid === tid); if (!stn.length) return null; const r = (c.seasons || []).filter(x => x.tid === tid); return { c, from: Math.min(...stn.map(s => s.from)), to: stn.some(s => s.to == null) ? null : Math.max(...stn.map(s => s.to)), w: r.reduce((a, x) => a + x.w, 0), l: r.reduce((a, x) => a + x.l, 0) }; }).filter(Boolean).sort((a, b) => b.from - a.from);
  const yrs = x => `${seasonName(x.from)}–${x.to != null ? seasonName(x.to) : 'now'}`;
  const row = (lk, x) => `<tr><td class="l">${lk}</td><td>${yrs(x)}</td><td>${x.w}-${x.l}</td></tr>`;
  const tb = rows => `<div class="tblwrap"><table><thead><tr><th class="l">Name</th><th>Years</th><th>W-L</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  return `<div class="panel staffhist"><h3>Staff history</h3><div class="k2">General managers</div>${gms.length ? tb(gms.map(x => row(glink(x.g), x)).join('')) : '<p class="muted">No record.</p>'}<div class="k2" style="margin-top:8px">Head coaches</div>${cs.length ? tb(cs.map(x => row(clink(x.c), x)).join('')) : '<p class="muted">No record.</p>'}</div>`;
}
function vCoach(c) {
  const team = L.teams.find(t => t.coach.id === c.id);
  const rows = (c.seasons || []).slice().reverse().map(x => `<tr class="click" data-team="${x.tid}"><td class="l">${seasonName(x.s)}</td><td class="l">${tlabel(x.tid, true)}</td><td>${x.w}-${x.l}</td><td>${pct(x.w, x.w + x.l)}</td><td class="l">${esc(x.po)}</td><td class="l muted">${MODE_LABEL[x.mode] || ''}</td></tr>`).join('');
  const stints = c.stints.map(st => `<div>${tlink(st.tid, true)} <span class="muted">${seasonName(st.from)}${st.to ? '–' + seasonName(st.to) : '–present'}</span></div>`).join('') || '<p class="muted">Has not coached a team yet.</p>';
  const honors = (c.honors || []).map(h => `<div>${seasonName(h.s)}: ${esc(h.a)}${h.tid != null ? ' · ' + tlink(h.tid) : ''}</div>`).join('');
  const kc = c.contract;
  const rate = (k, n) => `<div class="arow2"><span>${n}</span><span class="an ${c[k] >= 75 ? 'ag' : c[k] >= 65 ? 'ay' : c[k] < 45 ? 'ar' : c[k] < 52 ? 'ao' : ''}">${c[k]}</span></div>`;
  const ce = ui.editCoach === c.id;
  return `<div class="crumbs"><button data-back="1">Back</button>${ce ? '' : `<button data-editcoach="${c.id}">Edit name</button>`}</div>
  <section class="panel" style="margin-bottom:16px"><div class="bio">${portrait('c', c.id, c.nat, team ? team.id : null)}<div style="min-width:0"><div class="k">${team ? tlink(team.id, true) : c.retired ? 'Retired ' + seasonName(c.retired) : 'Available coach'}</div><div class="big">${esc(c.name)}${hotBadge(team)}</div>${c.nat ? `<div class="muted" style="font-size:12px">${esc(NAT_NAME[c.nat] || '')}${(c.rel || []).length ? ' · father of ' + c.rel.map(r => L.players[r.id] ? plink(L.players[r.id]) : '').join(', ') : ''}</div>` : ''}${ce ? `<div class="editname"><label><span class="k">Full name</span><br><input id="ec-name" value="${esc(c.name)}" maxlength="40" aria-label="Coach name"></label><button class="primary sm" data-savecoach="${c.id}">Save name</button><button class="sm" data-editcoach="0">Cancel</button><span id="ec-msg" class="muted"></span></div>` : ''}<div class="muted">${OFF_SYS[c.off].name} offense · ${DEF_SYS[c.def].name} defense · ${esc(c.rot || 'Balanced')} rotation</div></div>
  <div><div class="k">Overall</div><div class="v">${c.ovr}</div></div>${commish() ? `<div><div class="k">Potential</div><div class="v">${c.pot}</div></div>` : ''}<div><div class="k">Age</div><div class="v">${c.age}</div></div><div><div class="k">Record</div><div class="v">${c.w}-${c.l}</div></div><div><div class="k">Playoffs</div><div class="v">${c.pw}-${c.pl}</div></div><div><div class="k">Titles</div><div class="v">${c.titles}</div></div><div><div class="k">Coach of the Year</div><div class="v">${c.coy || 0}</div></div><div><div class="k">Contract</div><div class="v" style="font-size:18px">${kc ? `${money(kc.amt)}/yr · through ${seasonName(kc.exp)}` : team ? '—' : 'Free agent'}</div></div></div></section>
  <div class="grid2e" style="margin-bottom:16px"><section class="panel"><h3>Ratings</h3>${rate('ro', 'Offense')}${rate('rd', 'Defense')}${rate('rdev', 'Player development')}<div class="kv" style="margin-top:10px"><span class="k2">Pace</span><span>${c.pace} possessions / 48</span><span class="k2">Rotation</span><span>${esc(c.rot || 'Balanced')}, ${c.depth} players</span><span class="k2">Minutes lean</span><span>${c.youth > 0 ? 'Favors young players' : c.youth < 0 ? 'Favors veterans' : 'Neutral'}</span></div></section>
  <section class="panel"><h3>Late-game habits</h3><div class="kv">${lateText(coachLate(c))}</div>${team && isUser(team.id) && team.late ? '<p class="muted" style="font-size:12px;margin-top:6px">Your team uses your own late-game settings (lineup panel).</p>' : ''}</section>
  <section class="panel"><h3>Coaching stops</h3>${stints}${honors ? `<h3 style="margin-top:12px">Honors</h3>${honors}` : ''}${achHtml(c, 'c', true)}</section></div>
  ${coachTreePanel(c)}
  ${coachPanel(c, team)}
  ${philPanel(c, team)}
  <section class="panel"><h3>Season by season</h3>${rows ? `<div class="tblwrap"><table><thead><tr><th class="l">Season</th><th class="l">Team</th><th>W-L</th><th>Pct</th><th class="l">Playoffs</th><th class="l">Plan</th></tr></thead><tbody>${rows}</tbody></table></div>` : '<p class="muted">No completed seasons yet.</p>'}</section>`;
}
function gmSection(part) {
  const rows = L.teams.map(t => { const g = t.gm, mine = isUser(t.id); const rec = mine ? (L.me ? L.me.hist : []) : g ? g.hist.filter(h => h.tid === t.id) : []; const w = rec.reduce((a, h) => a + h.w, 0), l = rec.reduce((a, h) => a + h.l, 0);
    return `<tr class="${mine ? 'mine' : ''}"><td class="l">${mine ? `<strong>${esc(meName())}</strong>${meName() !== 'You' ? ' <span class="muted">(you)</span>' : ''}` : g ? glink(g) : '—'}${(() => { const aw = ((mine ? L.me : g) || {}).awards || []; return aw.length ? ` ${trIcon('eoy', '')}<span class="muted" title="Executive of the Year: ${aw.map(x => seasonName(x.s)).join(', ')}">×${aw.length}</span>` : ''; })()}</td><td>${mine ? '—' : g && g.age != null ? g.age : '—'}</td><td class="l">${tlink(t.id)}</td><td>${mine ? (L.me.stints.slice(-1)[0] || {}).from ? seasonName(L.me.stints.slice(-1)[0].from) : '—' : g ? seasonName(g.since) : '—'}</td><td>${w}-${l}</td><td>${t.owner.trust}${t.owner.hot ? ' <span class="pill inj">Hot seat</span>' : ''}</td><td>${mine ? gmRep(L) : g ? gmRep(L, g) : '—'}</td><td>${mine ? L.me.fired || 0 : g ? g.fired || 0 : 0}</td></tr>`; }).join('');
  const me = L.me;
  const prof = me && L.mode === 'team' ? (() => {
    const draftees = Object.values(L.players).filter(p => p.draft && me.stints.some(s => s.tid === p.draft.tid && p.draft.s >= s.from - 1 && (s.to == null || p.draft.s <= s.to))).sort((a, b) => a.draft.s - b.draft.s || a.draft.rd - b.draft.rd || a.draft.no - b.draft.no);
    const peak = p => Math.max(p.ovr, ...p.hist.map(h => h.ovr));
    return `<section class="panel" style="margin-bottom:16px"><h2>Your GM profile${meName() !== 'You' ? ' · ' + esc(meName()) : ''}</h2><div class="kv"><span class="k2">Reputation</span><span><strong>${gmRep(L)}</strong>/100</span><span class="k2">Jobs</span><span>${me.stints.map(s => `${esc(L.teams[s.tid].abbr)} ${seasonName(s.from)}–${s.to ? seasonName(s.to) + (s.fired ? ' (fired)' : '') : 'now'}`).join(' · ') || '—'}</span><span class="k2">Times fired</span><span>${me.fired || 0}</span><span class="k2">Status</span><span>${L.jobless ? 'Between jobs' : 'Employed'}</span></div>
    ${me.hist.length ? `<h3 style="margin-top:12px">Seasons</h3><div class="tblwrap"><table><thead><tr><th class="l">Season</th><th class="l">Team</th><th>W-L</th><th class="l">Playoffs</th><th>Owner trust</th><th>Profit</th></tr></thead><tbody>${me.hist.slice().reverse().map(h => `<tr><td class="l">${seasonName(h.s)}</td><td class="l">${tlink(h.tid)}</td><td>${h.w}-${h.l}</td><td class="l">${esc(h.po)}</td><td>${h.trust}</td><td class="${h.profit >= 0 ? 'w' : 'lo'}">${money(h.profit)}</td></tr>`).join('')}</tbody></table></div>` : ''}
    <h3 style="margin-top:12px">Achievements</h3><div>${Object.entries(ACH).filter(([k]) => k !== 'fired').map(([k, n]) => `<span class="ach ${(me.ach || {})[k] != null ? 'on' : ''}" title="${(me.ach || {})[k] != null ? 'Unlocked in ' + seasonName(me.ach[k]) : 'Locked'}">${esc(n)}</span>`).join('')}</div>
    ${(me.timeline || []).length ? `<h3 style="margin-top:12px">Career timeline</h3>${me.timeline.slice().reverse().slice(0, 40).map(x => `<div class="tl"><span class="muted">${seasonName(x.s)}</span> · ${esc(x.t)}</div>`).join('')}` : ''}
    ${draftees.length ? `<h3 style="margin-top:12px">Your draft picks</h3><div class="tblwrap"><table class="sortable" data-sid="mydrafts"><thead><tr><th class="l">Player</th><th>Year</th><th>Pick</th><th>Mock</th><th>Now</th><th>Peak</th><th class="l">Status</th></tr></thead><tbody>${draftees.map(p => `<tr class="click" data-player="${p.id}"><td class="l">${esc(p.name)}</td><td>${draftLabel(p.draft.s)}</td><td>${p.draft.rd}-${p.draft.no}</td><td>${p.draft.mock || '—'}</td><td>${ovrTxt(p)}</td><td><strong>${peak(p)}</strong></td><td class="l muted">${p.retired ? 'Retired' : p.team != null ? L.teams[p.team].abbr : 'Free agent'}</td></tr>`).join('')}</tbody></table></div>` : ''}</section>`;
  })() : '';
  const list = `<section class="panel" style="margin-bottom:16px"><h2>General managers</h2><div class="tblwrap"><table class="sortable" data-sid="gms"><thead><tr><th class="l">GM</th><th>Age</th><th class="l">Team</th><th>Since</th><th>Record with team</th><th>Owner trust</th><th>Reputation</th><th>Times fired</th></tr></thead><tbody>${rows}</tbody></table></div>${(L.gmPool || []).length ? `<h3 style="margin-top:12px">Available GMs</h3><div class="tblwrap"><table><thead><tr><th class="l">GM</th><th>Age</th><th>Seasons</th><th>Record</th></tr></thead><tbody>${L.gmPool.map(g => { const c = gmCareer(L, g); return `<tr><td class="l">${glink(g)}</td><td>${g.age != null ? g.age : '—'}</td><td>${c.seasons}</td><td>${c.w}-${c.l}</td></tr>`; }).join('')}</tbody></table></div>` : ''}<details class="about"><summary>How this works</summary><p>Owners judge their GMs every season on their goal, results against expectations, profit and spending. Two straight seasons on the hot seat (trust under 35) gets a GM fired. Reputation comes from winning, playoff runs and titles, minus firings; teams with openings call GMs whose reputation fits.</p></details></section>`;
  return part === 'prof' ? prof : part === 'list' ? list : prof + list;
}
function findScout(id) { for (const t of L.teams) if (t.scout && t.scout.id === id) return t.scout; return (L.scoutPool || []).find(s => s.id === id) || null; }
const slink = s => s ? `<a class="lk" data-scoutp="${s.id}">${esc(s.name)}</a>` : '—';
function scoutDialog(id) {
  const s = findScout(id); if (!s) return;
  const team = L.teams.find(t => t.scout === s);
  const peak = p => Math.max(p.ovr, ...p.hist.map(h => h.ovr));
  const calls = (s.calls || []).slice().reverse().map(c => { const p = L.players[c.pid]; if (!p) return null;
    const judged = L.season - c.s >= 3 || p.age >= 25 || p.retired; const pk = peak(p), d = c.est - pk;
    return { c, p, pk, judged, d }; }).filter(Boolean);
  const j = calls.filter(x => x.judged), miss = j.length ? j.reduce((a, x) => a + Math.abs(x.d), 0) / j.length : null, bias = j.length ? j.reduce((a, x) => a + x.d, 0) / j.length : null;
  const verdict = x => !x.judged ? '<span class="muted">Too early</span>' : Math.abs(x.d) <= 3 ? '<span class="w">On target</span>' : x.d > 0 ? `<span class="lo">Overrated by ${x.d}</span>` : `<span class="w">Underrated by ${-x.d}</span>`;
  dialog(`<div class="row" style="align-items:flex-end;gap:14px">${portrait('s', s.id, s.nat, team ? team.id : null, 'sm')}<h2 style="margin:0">${esc(s.name)} · scouting director</h2></div><div class="kv" style="margin-top:10px"><span class="k2">Team</span><span>${team ? tlabel(team.id, true) : 'Available'}</span><span class="k2">Age</span><span>${s.age}</span><span class="k2">Rating</span><span>draft <strong>${s.rating}</strong> · pro <strong>${s.pro != null ? s.pro : s.rating}</strong> · eye for ${SCOUT_EYE[s.eye].toLowerCase()}</span><span class="k2">Typical miss on potential</span><span>about ±${Math.round(clamp(3 + (85 - s.rating) * 0.13, 3, 10) * 0.8)} (never more than ${DIR_MAXERR})</span>${s.contract ? `<span class="k2">Contract</span><span>${money(s.contract.amt)}/yr through ${seasonName(s.contract.exp)}</span>` : ''}<span class="k2">Track record</span><span>${j.length ? `${j.length} judged pick${j.length > 1 ? 's' : ''}: average miss ${f1(miss)} points, ${bias > 1 ? 'tends to overrate' : bias < -1 ? 'tends to underrate' : 'no clear lean'}` : 'No picks old enough to judge yet'}</span></div>
  ${calls.length ? `<h3 style="margin-top:12px">His projections vs what players became</h3><div class="tblwrap"><table><thead><tr><th class="l">Draft</th><th>Pick</th><th class="l">Player</th><th class="l">For</th><th title="His potential projection at the draft">Projected</th><th title="Consensus mock rank">Mock</th><th>Now</th><th>Peak</th><th class="l">Verdict</th></tr></thead><tbody>${calls.map(x => `<tr class="click" data-player="${x.p.id}"><td class="l">${draftLabel(x.c.s)}</td><td>${x.c.pick}</td><td class="l">${esc(x.p.name)}</td><td class="l">${L.teams[x.c.tid].abbr}</td><td><strong>${x.c.est}</strong></td><td>${x.c.mock || '—'}</td><td>${x.p.retired ? 'Ret.' : x.p.ovr}</td><td>${x.pk}</td><td class="l">${verdict(x)}</td></tr>`).join('')}</tbody></table></div><p class="muted" style="font-size:12px;margin:6px 0 0">A pick is judged once he's 25 or three seasons have passed. Peak is the best overall he has reached so far.</p>` : '<p class="muted">His draft picks (with his projections) appear here after a draft.</p>'}
  <div class="row" style="margin-top:12px"><button id="x-close">Close</button></div>`, 'wide');
  $('#x-close').onclick = closeDialog;
}
function scoutsSection() {
  const canHire = L.user != null && (scoutWindow(L) || !L.teams[L.user].scout);
  const mine = L.user != null ? L.teams[L.user].scout : null;
  const rowsT = L.teams.slice().sort((a, b) => (b.scout ? b.scout.rating : 0) - (a.scout ? a.scout.rating : 0)).map(t => t.scout ? `<tr class="${isUser(t.id) ? 'mine' : ''}"><td class="l">${slink(t.scout)}</td><td class="l">${tlink(t.id)}</td><td>${t.scout.age}</td><td><strong>${t.scout.rating}</strong></td><td>${t.scout.pro != null ? t.scout.pro : t.scout.rating}</td><td class="l">${SCOUT_EYE[t.scout.eye]}</td><td>${money(t.scout.salary)}</td></tr>` : '').join('');
  const rowsP = (L.scoutPool || []).slice().sort((a, b) => b.rating - a.rating).map(s => `<tr><td class="l">${slink(s)}</td><td>${s.age}</td><td><strong>${s.rating}</strong></td><td>${s.pro != null ? s.pro : s.rating}</td><td class="l">${SCOUT_EYE[s.eye]}</td><td>${money(s.salary)}</td>${canHire ? `<td>${canAffordStaff(L, L.teams[L.user], 'scout', s.salary) ? `<button class="sm primary" data-hirescout="${s.id}">Hire</button>` : '<span class="muted">Over budget</span>'}</td>` : ''}</tr>`).join('');
  return `<section class="panel" style="margin-bottom:16px"><h2>Scouting directors</h2><p class="muted" style="margin-top:-4px">A director has two ratings: draft (how accurate a team's reads on prospects and young players' potential are) and pro (how close its reads are on other teams' players and free agents). His eye (guards, wings or bigs) is sharper still. He builds the team's draft board.${mine ? ` Yours: <strong>${esc(mine.name)}</strong> (${mine.rating}, eye for ${SCOUT_EYE[mine.eye].toLowerCase()}).` : ''}</p>
  <div class="grid2e"><div><h3>Team directors</h3><div class="tblwrap"><table class="sortable" data-sid="scouts"><thead><tr><th class="l">Director</th><th class="l">Team</th><th>Age</th><th title="Draft scouting">Draft</th><th title="Pro / free-agent scouting">Pro</th><th class="l">Eye</th><th>Salary</th></tr></thead><tbody>${rowsT}</tbody></table></div></div>
  <div><h3>Available</h3>${ui.scoutMsg ? `<div class="msg">${esc(ui.scoutMsg)}</div>` : ''}<div class="tblwrap"><table class="sortable" data-sid="scoutpool"><thead><tr><th class="l">Director</th><th>Age</th><th title="Draft scouting">Draft</th><th title="Pro / free-agent scouting">Pro</th><th class="l">Eye</th><th>Salary</th>${canHire ? '<th class="nosort"></th>' : ''}</tr></thead><tbody>${rowsP}</tbody></table></div>${canHire ? `<p class="muted" style="font-size:12px;margin:6px 0 0">Hiring replaces your current director, who joins this list; the rest of his contract stays on your staff budget. Room for a new director: ${money(Math.max(0, staffRoom(L, L.teams[L.user], 'scout')))}.</p>` : ''}</div></div></section>`;
}
function coachYrsTxt(c) { return c.age >= 62 ? '1–2' : c.ovr >= 72 ? '3–5' : '2–4'; }
// Franchise Mode: fire your coach and pick a replacement in one step
// v15: scouting director controls on My Team (changes only after the draft, before the season)
function scoutControls(t) {
  if (!scoutWindow(L)) return `<p class="muted" style="margin:8px 0 0">Director changes open after the draft.</p>`;
  return `<div class="row" style="margin-top:10px">${t.scout ? `<button class="danger sm" data-firescout="1">Fire ${esc(t.scout.name)}</button>` : ''}<button class="sm" data-scouthire="1">${t.scout ? 'Replace' : 'Hire a director'}</button></div>${ui.scoutMsg ? `<div class="msg">${esc(ui.scoutMsg)}</div>` : ''}`;
}
function scoutHireDialog() {
  const t = L.teams[L.user], pool = (L.scoutPool || []).slice().sort((a, b) => b.rating - a.rating), room = staffRoom(L, t, 'scout');
  dialog(`<h2>Hire a scouting director</h2><p class="muted">${t.scout ? `Hiring replaces ${esc(t.scout.name)}. ${t.scout.contract && t.scout.contract.exp >= coachStartSeason(L) ? `You'll still owe him ${money(t.scout.contract.amt)}/yr through ${seasonName(t.scout.contract.exp)}.` : ''} ` : ''}Room in the staff budget: <strong>${money(Math.max(0, room))}</strong>. Deals of 3+ years are 5% cheaper per year.</p>
  <div class="tblwrap"><table><thead><tr><th class="l">Director</th><th>Age</th><th title="Draft scouting">Draft</th><th title="Pro / free-agent scouting">Pro</th><th class="l">Eye</th><th>Salary</th><th>Years</th><th></th></tr></thead><tbody>${pool.map(x => `<tr><td class="l">${slink(x)}</td><td>${x.age}</td><td><strong>${x.rating}</strong></td><td>${x.pro != null ? x.pro : x.rating}</td><td class="l">${SCOUT_EYE[x.eye]}</td><td>${money(x.salary)}</td><td><select data-sy="${x.id}">${[1, 2, 3, 4].map(y => `<option ${y === 3 ? 'selected' : ''}>${y}</option>`).join('')}</select></td><td>${canAffordStaff(L, t, 'scout', scoutAmt(x, 1)) ? `<button class="sm primary" data-hires="${x.id}">Hire</button>` : '<span class="muted">Over budget</span>'}</td></tr>`).join('')}</tbody></table></div>
  <div class="row" style="margin-top:12px"><button id="x-close">Cancel</button></div>`, 'wide');
  $('#x-close').onclick = closeDialog;
  document.querySelectorAll('[data-hires]').forEach(b => b.onclick = () => { const id = +b.dataset.hires, y = +document.querySelector(`[data-sy="${id}"]`).value; const err = hireScout(L, L.user, id, y); ui.scoutMsg = err || `You hired ${t.scout.name} as scouting director: ${y} yr, ${money(t.scout.contract.amt)}/yr.`; closeDialog(); save(); render(); });
}
function fireDialog() {
  const t = L.teams[L.user];
  const fl0 = coachFitList(L, t, L.coachPool.filter(c => !c.interim)), hs = ui.hireSort === 'ovr' ? 'ovr' : 'fit', pool = (hs === 'ovr' ? fl0.slice().sort((a, b) => b.c.ovr - a.c.ovr) : fl0).map(x => x.c), fitOf = {}; fl0.forEach(x => fitOf[x.c.id] = x);
  const room = staffRoom(L, t, 'coach'), left = coachYrsLeft(L, t.coach);
  const ok = (c, y) => canAffordStaff(L, t, 'coach', coachAmtFor(L, c, t, y));
  dialog(`<h2>Fire ${esc(t.coach.name)}?</h2><p>Pick his replacement. ${left && !t.coach.interim ? `You'll still owe ${esc(t.coach.name)} ${money(t.coach.contract.amt)}/yr through ${seasonName(t.coach.contract.exp)}, and it counts against your staff budget.` : 'Nothing more is owed to him.'}${left >= 2 && !t.coach.interim ? ` <strong>${esc(t.owner.name)} won't like paying two coaches: owner trust −4.</strong>` : ''}${L.phase === 'regular' ? ' The new coach takes over from the next game.' : ''}</p>
  <p class="muted">Staff budget ${money(t.staffBudget)} · room for a new coach after this change: <strong>${money(Math.max(0, room))}</strong>. Coaches who don't fit are greyed out. You can always promote an assistant as interim coach for ${money(INTERIM_PAY)} for the rest of the season.</p>
  <div class="row" style="margin-bottom:10px"><button class="sm" data-interim="1">Promote an assistant (interim)</button><span class="seg" role="group" aria-label="Sort coaches"><button class="sm ${hs === 'fit' ? 'primary' : ''}" data-hsort="fit">Sort: fit with your roster</button><button class="sm ${hs === 'ovr' ? 'primary' : ''}" data-hsort="ovr">Sort: overall</button></span></div>
  <div class="tblwrap"><table><thead><tr><th class="l">Coach</th><th>Age</th><th>Ovr</th><th>Off</th><th>Def</th><th>Dev</th><th class="l">Systems</th><th title="Average fit of your top 8 players with his systems, where it ranks among the 12 system pairs for your roster (0% worst, 100% best), and the change from your current coach">Fit with your roster</th><th>Contract (pick length)</th><th></th></tr></thead><tbody>${pool.map(c => `<tr><td class="l">${clink(c)}</td><td>${c.age}</td><td><strong>${c.ovr}</strong></td><td>${c.ro}</td><td>${c.rd}</td><td>${c.rdev}</td><td class="l muted">${OFF_SYS[c.off].name} · ${DEF_SYS[c.def].name}${slChips(c)}</td><td data-v="${fitOf[c.id].score}"><strong>${fitOf[c.id].score}</strong> <span class="muted">· ${fitOf[c.id].pct}%</span> <span class="${fitOf[c.id].delta > 0 ? 'w' : fitOf[c.id].delta < 0 ? 'lo' : 'muted'}" title="Compared with ${esc(t.coach.name)}">${fitOf[c.id].delta > 0 ? '+' : ''}${fitOf[c.id].delta}</span></td><td><select data-hy="${c.id}" aria-label="Contract length">${[1, 2, 3, 4, 5].map(y => `<option value="${y}" ${y === 3 ? 'selected' : ''} ${ok(c, y) ? '' : 'disabled'}>${y} yr · ${money(coachAmtFor(L, c, t, y))}${ok(c, y) ? '' : ' (over budget)'}</option>`).join('')}</select></td><td>${[1, 2, 3, 4, 5].some(y => ok(c, y)) ? `<button class="sm primary" data-hirec="${c.id}">Hire</button>` : '<span class="muted">Over budget</span>'}</td></tr>`).join('')}</tbody></table></div>
  <p class="muted" style="font-size:12px;margin:6px 0 0">Longer deals cost a little less per year, but if you fire him early you keep paying him.</p>
  <div class="row" style="margin-top:12px"><button id="x-close">Keep ${esc(t.coach.name)}</button></div>`, 'wide');
  $('#x-close').onclick = closeDialog;
  document.querySelectorAll('[data-hsort]').forEach(b => b.onclick = () => { ui.hireSort = b.dataset.hsort; fireDialog(); });
  const ib = document.querySelector('[data-interim]'); if (ib) ib.onclick = () => { const old = t.coach.name, nc = makeInterim(L, t); const err = hireCoach(L, L.user, nc.id, false, 1); ui.coachMsg = err || `You fired ${old} and promoted assistant ${t.coach.name} as interim coach (${money(INTERIM_PAY)}, through ${seasonName(t.coach.contract.exp)}).`; closeDialog(); save(); render(); };
  document.querySelectorAll('[data-hirec]').forEach(b => b.onclick = () => { const old = t.coach.name; const yrs = +document.querySelector(`[data-hy="${b.dataset.hirec}"]`).value; const err = hireCoach(L, L.user, +b.dataset.hirec, false, yrs); ui.coachMsg = err || `You fired ${old} and hired ${t.coach.name}: ${t.coach.contract.yrs} yr, ${money(t.coach.contract.amt)}/yr.`; closeDialog(); save(); render(); });
}
function teamStaffView(t) {
  const c = t.coach, s = t.scout, g = t.gm, o = t.owner, mine = isUser(t.id);
  const owed = (t.coachOwed || []).filter(x => x.thru >= coachStartSeason(L));
  return `<section class="panel" style="margin-bottom:16px"><h2>${tlabel(t.id, true)} · front office</h2><div class="grid2e">
  <div><h3>Head coach</h3><div class="kv"><span class="k2">Name</span><span>${clink(c)}${c.interim ? ' (interim)' : ''} · age ${c.age}</span><span class="k2">Rating</span><span><strong>${c.ovr}</strong> (off ${c.ro}, def ${c.rd}, dev ${c.rdev})</span><span class="k2">Systems</span><span>${OFF_SYS[c.off].name} · ${DEF_SYS[c.def].name} · ${esc(c.rot || 'Balanced')}</span><span class="k2">Contract</span><span>${c.contract ? `${money(c.contract.amt)}/yr through ${seasonName(c.contract.exp)}` : '—'}</span><span class="k2">Record</span><span>${c.w}-${c.l} · titles ${c.titles}</span></div></div>
  <div><h3>Scouting director</h3>${s ? `<div class="kv"><span class="k2">Name</span><span>${slink(s)} · age ${s.age}</span><span class="k2">Rating</span><span>draft <strong>${s.rating}</strong> · pro <strong>${s.pro != null ? s.pro : s.rating}</strong> · eye for ${SCOUT_EYE[s.eye].toLowerCase()}</span><span class="k2">Contract</span><span>${s.contract ? `${money(s.contract.amt)}/yr through ${seasonName(s.contract.exp)}` : money(s.salary) + '/yr'}</span></div>` : '<p class="muted">None</p>'}</div>
  <div><h3>General manager</h3><div class="kv"><span class="k2">Name</span><span>${mine ? esc(meName()) : g ? esc(g.name) : '—'}</span><span class="k2">Since</span><span>${mine ? (L.me.stints.slice(-1)[0] ? seasonName(L.me.stints.slice(-1)[0].from) : '—') : g && g.since != null ? seasonName(g.since) : '—'}</span><span class="k2">Reputation</span><span>${mine ? gmRep(L) : g ? gmRep(L, g) : '—'}</span><span class="k2">Times fired</span><span>${mine ? L.me.fired || 0 : g ? g.fired || 0 : 0}</span></div></div>
  <div><h3>Owner</h3><div class="kv"><span class="k2">Name</span><span>${esc(o.name)}</span><span class="k2">Trust in the GM</span><span>${o.trust}/100${o.hot ? ' · <span class="lo">hot seat</span>' : ''}</span><span class="k2">Goal</span><span>${esc((o.goal || {}).txt || '—')}</span><span class="k2">Staff budget</span><span>${money(t.staffBudget)}${owed.length ? ` · still paying ${owed.map(x => esc(x.name)).join(', ')}` : ''}</span></div></div>
  </div></section>`;
}
function vCoaches() {
  const pickT = `<div class="row" style="margin-bottom:12px"><label>View <select id="staffteam"><option value="">All teams</option>${L.teams.map(t => `<option value="${t.id}" ${ui.staffTeam === t.id ? 'selected' : ''}>${esc(tname(t.id))}</option>`).join('')}</select></label></div>`;
  if (ui.staffTeam != null && L.teams[ui.staffTeam]) return pickT + teamStaffView(L.teams[ui.staffTeam]);
  const canHire = L.user != null && L.phase !== 'playoffs';
  const ut = L.user != null ? L.teams[L.user] : null;
  const rowsT = L.teams.slice().sort((a, b) => b.coach.ovr - a.coach.ovr).map(t => { const c = t.coach; return `<tr class="click ${isUser(t.id) ? 'mine' : ''}" data-team="${t.id}"><td class="l">${clink(c)}${isUser(t.id) ? ' <span class="pill you">Your coach</span>' : ''}</td><td class="l">${tlink(t.id)}</td><td>${c.age}</td><td><strong>${c.ovr}</strong></td>${commish() ? `<td>${c.pot}</td>` : ''}<td>${c.ro}</td><td>${c.rd}</td><td>${c.rdev}</td><td class="l muted">${OFF_SYS[c.off].name} · ${DEF_SYS[c.def].name} · ${c.rot || 'Balanced'}${slChips(c)}</td><td>${c.w}-${c.l}</td><td>${c.pw}-${c.pl}</td><td>${c.titles}</td><td>${c.coy || 0}</td><td data-v="${c.contract ? c.contract.amt : 0}">${c.contract ? money(c.contract.amt) : '—'}</td><td>${c.contract ? seasonName(c.contract.exp) : '—'}</td></tr>`; }).join('');
  const rowsP = L.coachPool.slice().sort((a, b) => b.ovr - a.ovr).map(c => `<tr><td class="l">${clink(c)}</td><td>${c.age}</td><td><strong>${c.ovr}</strong></td>${commish() ? `<td>${c.pot}</td>` : ''}<td>${c.ro}</td><td>${c.rd}</td><td>${c.rdev}</td><td class="l muted">${OFF_SYS[c.off].name} · ${DEF_SYS[c.def].name} · ${c.rot || 'Balanced'}${slChips(c)}</td><td>${c.w}-${c.l}</td><td>${c.titles}</td><td>${c.coy || 0}</td>${ut ? `<td>${Math.round(coachFitScore(L, ut, c))}</td><td data-v="${coachValue(L, c, ut)}">${money(coachValue(L, c, ut))}</td><td>${coachYrsTxt(c)}</td>` : `<td data-v="${coachValue(L, c, null)}">${money(coachValue(L, c, null))}</td>`}${canHire ? `<td><button class="sm primary" data-hire="${c.id}">Hire…</button></td>` : ''}</tr>`).join('');
  const head = `<th>Age</th><th>Ovr</th>${commish() ? '<th>Pot</th>' : ''}<th>Off</th><th>Def</th><th>Dev</th><th class="l">Systems</th>`;
  const coachesHtml = `<section class="panel" style="margin-bottom:16px"><h2>Head coaches</h2><div class="tblwrap"><table class="sortable" data-sid="coaches"><thead><tr><th class="l">Coach</th><th class="l">Team</th>${head}<th>Record</th><th>Playoffs</th><th>Titles</th><th title="Coach of the Year awards">COY</th><th>Salary</th><th>Through</th></tr></thead><tbody>${rowsT}</tbody></table></div><details class="about"><summary>How this works</summary><p>Offense and defense ratings nudge shooting at both ends. Development affects how fast players improve. Coaches sign contracts worth more for a higher overall, titles, Coach of the Year awards, playoff wins, a winning record and a good fit with the roster. Coach pay is outside the player salary cap. Front offices judge coaches against what the roster was expected to do. Most changes happen in the offseason; firing during the season is rare and only happens when a team expected to make the playoffs falls far out of the race.</p></details></section>
  <section class="panel"><h2>Available coaches</h2>${ui.coachMsg ? `<div class="msg">${esc(ui.coachMsg)}</div>` : ''}${canHire ? `<p class="muted">Hiring replaces ${esc(ut.coach.name)}, who joins this list. ${coachYrsLeft(L, ut.coach) && !ut.coach.interim ? `You still owe him ${money(ut.coach.contract.amt)}/yr through ${seasonName(ut.coach.contract.exp)}, which counts against your ${money(ut.staffBudget)} staff budget.` : ''} Asking price is what he'd want from ${esc(ut.abbr)}, based on your roster's fit. Room for a new coach: ${money(Math.max(0, staffRoom(L, ut, 'coach')))}.</p>` : L.user != null ? `<p class="muted">Coaching changes wait until the playoffs are over.</p>` : ''}<div class="tblwrap"><table class="sortable" data-sid="coachpool"><thead><tr><th class="l">Coach</th>${head}<th>Career record</th><th>Titles</th><th title="Coach of the Year awards">COY</th>${ut ? `<th title="Average fit of ${esc(ut.abbr)}'s top 8 players with his systems">Fit</th><th>Asking</th><th>Years</th>` : '<th>Value</th>'}${canHire ? '<th class="nosort"></th>' : ''}</tr></thead><tbody>${rowsP}</tbody></table></div></section>`;
  const st = ['me', 'coaches', 'gms', 'scouts'].includes(ui.stab) ? ui.stab : (L.mode === 'team' ? 'me' : 'coaches');
  const tabsDef = [...(L.mode === 'team' ? [['me', 'Your GM profile']] : []), ['coaches', 'Head coaches'], ['gms', 'General managers'], ['scouts', 'Scouting directors']];
  const sub = `<div class="subtabs" style="margin-bottom:12px">${tabsDef.map(([k, n]) => `<button class="sm ${st === k ? 'primary' : ''}" data-sftab="${k}">${n}</button>`).join('')}</div>`;
  const inner = st === 'me' ? (gmSection('prof') || '<p class="muted">No GM career yet.</p>') : st === 'gms' ? gmSection('list') : st === 'scouts' ? scoutsSection() : coachesHtml;
  return `${pickT}${sub}${inner}`;
}
function linkify(text) {
  if (!ui.nameRx || ui.nameRxKey !== Object.keys(L.players).length) {
    const names = {};
    for (const p of Object.values(L.players)) if (!names[p.name] || (L.players[names[p.name].slice(1)] || {}).retired) names[p.name] = 'p' + p.id;   // v34: stored as 'p<id>' (two players with one name crashed here); an active player wins over a retired one
    for (const c of [...L.teams.map(t => t.coach), ...L.coachPool, ...(L.coachArchive || [])]) if (!names[c.name]) names[c.name] = 'c' + c.id;
    for (const t of L.teams) { names[t.city + ' ' + t.name] = 't' + t.id; }
    const keys = Object.keys(names).sort((a, b) => b.length - a.length).map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    ui.nameMap = names; ui.nameRx = new RegExp('(' + keys.join('|') + '|\\b(?:' + L.teams.map(t => t.abbr).join('|') + ')\\b)', 'g'); ui.nameRxKey = Object.keys(L.players).length;
  }
  return esc(text).replace(ui.nameRx, m => {
    const ab = L.teams.find(t => t.abbr === m); if (ab) return `<a class="lk" data-team="${ab.id}">${m}</a>`;
    const v = ui.nameMap[m]; if (!v) return m;
    const id = +v.slice(1); return v[0] === 'p' ? `<a class="lk" data-player="${id}">${m}</a>` : v[0] === 'c' ? `<a class="lk" data-coach="${id}">${m}</a>` : `<a class="lk" data-team="${id}">${m}</a>`;
  });
}
// ===== v29 Sonnet part: Draft pipeline UI (Pipeline tab, team colors, College / International table, stock chip, call-ups) =====
// Logic lives in league.js (PIPE_*, pipe*, callUp, preHonors). Names come from PIPE_TEAMS / PIPE_AW / PIPE_CONF / PIPE_LG; nothing is retyped here except color names -> hex.
const PIPE_HEX = { 'Navy Blue': '#1f2f5c', 'Seafoam': '#7fd1b9', 'Colonial Blue': '#3b5b92', 'Buff': '#e0c98f', 'Teal': '#14857f', 'Purple': '#6a3d9a', 'Peach': '#ffb58a', 'Forest Green': '#1f6b3a', 'Ice Blue': '#a9d8f0', 'Black': '#15171a', 'Rust Red': '#a4442a', 'Steel Grey': '#71808c', 'Scarlet': '#d1202f', 'Cream': '#f3ead0', 'Royal Blue': '#2455c6', 'Frost White': '#f0f6fb', 'Burnt Sienna': '#b0502d', 'Denim Blue': '#4a6fa5', 'Terracotta': '#c5603c', 'Sage Green': '#8aa17c', 'Gold': '#d9a521', 'Midnight Black': '#0d0f14', 'Cardinal Red': '#a6192e', 'Silver': '#aab2bb', 'Evergreen': '#0f5a40', 'Slate': '#566373', 'Mountain Purple': '#5d3a8a', 'Sunset Orange': '#f0732b', 'Sand': '#d9c49a', 'Ocean Blue': '#0f6fa8', 'Yellow': '#f5cf1c', 'Royal Purple': '#5b2a86', 'Crimson': '#b3122f', 'White': '#ffffff', 'Champagne': '#f1deb2', 'Charcoal': '#363b42', 'Electric Orange': '#ff6a13', 'Emerald Green': '#0c9a5c', 'Aegean Blue': '#1b6fa8', 'Marble White': '#f2f2ee', 'Turquoise': '#1bb5b0', 'Slate Grey': '#5f6b78', 'Red': '#d62828', 'Cobalt Blue': '#0047ab', 'Maroon': '#7a1230', 'Amber': '#ffb000', 'Vermilion': '#e34234', 'Obsidian Black': '#0b0c10', 'Sapphire Blue': '#0f4fb5', 'Sun Yellow': '#ffd23f', 'Burnt Orange': '#cc5500', 'Sky Blue': '#5bb6ea', 'Midnight Blue': '#142a5a', 'Imperial Red': '#c1121f', 'Olive Green': '#6b7a2c', 'Bronze': '#b0763a', 'Fern Green': '#4f9a4a', 'Coral Red': '#f05d52', 'Saffron': '#f4a300', 'Indigo': '#3f3a9a' };
const pipeHex = n => PIPE_HEX[n] || '#6b7280';
const PIPE_SHAPES = ['shield', 'circle', 'diamond', 'square'], pipeLogoCache = {};
const PIPE_TABS = [['ALL', 'Overview'], ['NCHF', 'College (NCHF)'], ['EABL', 'International upper (EABL)'], ['APBA', 'International lower (APBA)']];
function pipeLogo(lg, i, size) {
  size = size || 18; const k = lg + i + '-' + size; if (pipeLogoCache[k]) return pipeLogoCache[k];
  const t = pipeTeam(lg, i); if (!t) return '';
  const o = { id: 'p' + lg + i, abbr: t.abbr, c1: pipeHex(t.c1), c2: pipeHex(t.c2) };
  return pipeLogoCache[k] = `<svg class="logo" width="${size}" height="${size}" viewBox="0 0 100 100" role="img" aria-label="${esc(t.full)} logo">${nbaLogoBody(o, 'ABC'[i % 3], PIPE_SHAPES[i % 4])}</svg>`;
}
function pipeChip(lg, i, title) {
  const t = pipeTeam(lg, i); if (!t) return ''; const c1 = pipeHex(t.c1), c2 = pipeHex(t.c2), ink = hexContrast(c1, '#ffffff') >= hexContrast(c1, '#111111') ? '#ffffff' : '#111111';
  return `<span class="pchip" title="${esc(title || t.full)}" style="background:${c1};color:${ink};border-color:${c2}">${esc(t.abbr)}</span>`;
}
const pipeTl = (lg, i, full) => { const t = pipeTeam(lg, i); return t ? `<a class="lk tl" data-pipeteam="${lg}|${i}">${pipeLogo(lg, i, 18)}${esc(full ? t.full : t.abbr)}</a>` : ''; };
const pipeSwatch = n => `<span class="pswatch" style="background:${pipeHex(n)}" aria-hidden="true"></span>${esc(n)}`;
const pipeWho = (lg, x) => { if (!x) return '—'; const p = x.id != null ? L.players[x.id] : null; return `${p ? plink(p) : esc(x.n)} ${pipeChip(lg, x.t)}`; };   // no id = filler: plain text
const pipeRes = lg => (L.pipe && L.pipe.lg && L.pipe.lg[lg] && L.pipe.lg[lg].res) || null;
const pipeLatest = () => { const r = pipeRes('NCHF'); return r ? r.s : null; };
const pipeLine = (p, s, lg) => (p.pre || []).find(h => h.s === s && h.lg === lg) || null;
// conference awards in res.aw.conf[c] use short keys
const PIPE_CAW = { cpoy: 'poy', cfoy: 'foy', call1: 'all1', call2: 'all2' };

function pipeStandings(lg, res) {
  const rows = res.st.map(r => ({ i: r[0], w: r[1], l: r[2], cw: r[3], cl: r[4] }));
  const tbl = list => `<div class="tblwrap"><table><thead><tr><th class="l">Team</th><th>W</th><th>L</th>${lg === 'NCHF' ? '<th title="Conference record">Conf</th>' : '<th>Pct</th>'}</tr></thead><tbody>${list.map(r => `<tr class="click ${r.i === res.champ ? 'mine' : ''}" data-pipeteam="${lg}|${r.i}"><td class="l">${pipeTl(lg, r.i, true)}${r.i === res.champ ? ' <span class="pill pos">Champion</span>' : ''}</td><td>${r.w}</td><td>${r.l}</td><td>${lg === 'NCHF' ? `${r.cw}-${r.cl}` : (r.w + r.l ? (r.w / (r.w + r.l)).toFixed(3).replace(/^0/, '') : '—')}</td></tr>`).join('')}</tbody></table></div>`;
  if (lg !== 'NCHF') return tbl(rows.slice().sort((a, b) => b.w - a.w || a.l - b.l));
  return PIPE_CONF.map((cn, c) => `<h3 style="margin:10px 0 4px;font-size:14px">${esc(cn)}</h3>${tbl(rows.filter(r => (pipeTeam(lg, r.i) || {}).conf === c).sort((a, b) => b.cw - a.cw || a.cl - b.cl || b.w - a.w))}`).join('');
}
function pipeBracket(lg, res) {
  const D = L.pipe.lg[lg], rounds = []; for (const m of res.po || []) { let g = rounds.find(x => x.r === m.r); if (!g) rounds.push(g = { r: m.r, ms: [] }); g.ms.push(m); }
  const A = res.aw || {}, ct = res.champ != null ? pipeTeam(lg, res.champ) : null;
  const champ = ct ? `<div class="pcham"><span>${pipeLogo(lg, res.champ, 44)}</span><div><div class="k">${esc(PIPE_AW[lg].champ)} · ${seasonName(res.s)}</div><div class="v" style="font-size:20px">${pipeTl(lg, res.champ, true)}</div><div class="muted">Runner-up: ${res.ru != null ? pipeTl(lg, res.ru, true) : '—'}${A.fmvp ? ` · ${esc(PIPE_AW[lg].fmvp)}: ${pipeWho(lg, A.fmvp)}` : ''}</div></div></div>` : '';
  const seeds = lg === 'NCHF' && D.seeds ? `<p class="muted" style="margin:8px 0 0;font-size:12px">Seeds: ${D.seeds.map((t, k) => `${k + 1} ${esc((pipeTeam(lg, t) || {}).abbr || '')}`).join(' · ')}</p>` : '';
  const sc = m => m.sc && (m.sc[0] + m.sc[1] > 1) ? `<span class="muted">${m.sc[0]}-${m.sc[1]}</span>` : '';
  return `${champ}${rounds.map(g => `<div class="k" style="margin-top:10px">${esc(g.r)}</div>${g.ms.map(m => `<div class="leader pmatch" style="grid-template-columns:minmax(0,1fr) auto"><span><span class="${m.w === m.a ? 'pwin' : 'plose'}">${pipeTl(lg, m.a)}</span> <span class="muted">vs</span> <span class="${m.w === m.b ? 'pwin' : 'plose'}">${pipeTl(lg, m.b)}</span></span><span>${m.w != null ? `<strong>${esc((pipeTeam(lg, m.w) || {}).abbr || '')}</strong> ` : ''}${sc(m)}</span></div>`).join('')}`).join('')}${seeds}`;
}
function pipeLeaders(lg, res) {
  const cols = [['pts', 'Points'], ['reb', 'Rebounds'], ['ast', 'Assists'], ['stl', 'Steals'], ['blk', 'Blocks']];
  return `<div class="pgrid">${cols.map(([k, n]) => `<div><div class="k">${n}</div>${((res.lead || {})[k] || []).slice(0, 5).map((x, i) => `<div class="leader" style="grid-template-columns:18px minmax(0,1fr) auto"><span class="muted">${i + 1}</span><span class="pname">${pipeWho(lg, x)}</span><span class="v">${f1(x.v)}</span></div>`).join('') || '<p class="muted">—</p>'}</div>`).join('')}</div>`;
}
function pipeAwards(lg, res) {
  const A = res.aw || {}, names = PIPE_AW[lg];
  const one = (key, v) => `<div class="leader" style="grid-template-columns:minmax(0,1fr) minmax(0,1.2fr)"><span class="muted">${esc(names[key])}</span><span>${Array.isArray(v) ? v.map(x => `<div>${pipeWho(lg, x)}</div>`).join('') : pipeWho(lg, v)}</span></div>`;
  const keys = Object.keys(names).filter(k => k !== 'champ' && !PIPE_CAW[k] && A[k]);
  let html = keys.map(k => one(k, A[k])).join('');
  if (lg === 'NCHF' && A.conf) html += `<h3 style="margin:14px 0 4px;font-size:14px">Conference awards</h3>` + PIPE_CONF.map((cn, c) => { const C = A.conf[c]; if (!C) return ''; return `<details class="pconf" ${c === 0 ? 'open' : ''}><summary><strong>${esc(cn)}</strong></summary>${Object.keys(PIPE_CAW).filter(k => C[PIPE_CAW[k]]).map(k => one(k, C[PIPE_CAW[k]])).join('')}</details>`; }).join('');
  return html || '<p class="muted">No awards yet.</p>';
}
// every real player (prospect, drafted, club pro) with a line for this team and season, plus the fillers
function pipeRosterRows(lg, i, S) {
  const P = L.pipe, seen = new Set(), rows = [], res = pipeRes(lg), ls = res ? res.s : S;
  const add = p => { if (seen.has(p.id)) return; seen.add(p.id); const ln = pipeLine(p, ls, lg); const pro = !!(p.club || (ln && ln.x)) && !p.prospect;
    rows.push({ p, nm: p.name, pos: posLabel(p), age: p.age, ln, yr: lg === 'NCHF' && p.pFrom != null ? PIPE_YR_LABEL[Math.max(1, Math.min(4, pipeYear(p, S)))] : '', dr: p.prospect ? draftLabel(p.draftYear) : '', pro, min: ln ? ln.min : -1, role: p.pRole }); };
  for (const p of (pipeRosters(L, S)[lg] || [])[i] || []) add(p);
  for (const p of Object.values(L.players)) if (!seen.has(p.id) && p.pre && p.pre.some(h => h.s === ls && h.lg === lg && h.tid === i)) add(p);   // drafted / retired since: lines are kept
  for (const f of (P.lg[lg].t[i] || { f: [] }).f) rows.push({ f, nm: f.n, pos: POS[f.p], age: f.a, ln: f.ln || null, yr: lg === 'NCHF' ? PIPE_YR_LABEL[Math.max(1, Math.min(4, f.y))] : '', dr: '', pro: false, min: f.ln ? f.ln.min : -1, role: f.r });
  return rows.sort((a, b) => b.min - a.min || (b.p ? b.p.ovr : 0) - (a.p ? a.p.ovr : 0));
}
// v28.7 F3: "All players" view of a pipeline league, with position / age range / min OVR / min POT filters
const pipePotOf = r => { if (r.p) { if (commish()) return r.p.pot; const g = potRange(r.p); return g ? Math.round((g[0] + g[1]) / 2) : r.p.ovr; } return null; };
function pipeAll(lg, res) {
  const S = L.pipe.s, F = (ui.pipeF = ui.pipeF || {}), n = PIPE_TEAMS[lg].length, roleN = r => (PIPE_ROLE_NAME[lg] || {})[r] || '';
  const rows = []; for (let t = 0; t < n; t++) for (const r of pipeRosterRows(lg, t, S)) { r.ti = t; r.ov = r.p ? r.p.ovr : (r.f && r.f.o != null ? r.f.o : null); r.pt = pipePotOf(r); rows.push(r); }
  const posOK = r => !F.pos || String(r.pos).split('/').includes(F.pos);
  const ok = r => posOK(r) && (!F.amin || r.age >= +F.amin) && (!F.amax || r.age <= +F.amax) && (!F.ovr || (r.ov != null && r.ov >= +F.ovr)) && (!F.pot || (r.pt != null && r.pt >= +F.pot));
  const list = rows.filter(ok).sort((a, b) => (b.ov || 0) - (a.ov || 0) || (b.pt || 0) - (a.pt || 0));
  const num = (k, ph, w) => `<input type="number" data-pipef="${k}" placeholder="${ph}" value="${esc(F[k] || '')}" min="0" max="99" style="width:${w || 64}px" aria-label="${ph}">`;
  const bar = `<div class="filters" style="margin-bottom:8px"><select data-pipef="pos" aria-label="Position"><option value="">All positions</option>${POS.map(x => `<option ${F.pos === x ? 'selected' : ''}>${x}</option>`).join('')}</select> <label>Age ${num('amin', 'min', 56)}–${num('amax', 'max', 56)}</label> <label>Min OVR ${num('ovr', 'OVR')}</label> <label>Min POT ${num('pot', 'POT')}</label> <button class="sm" data-pipef-clear="1">Clear</button> <span class="muted">${list.length} of ${rows.length} shown</span></div>`;
  const body = list.slice(0, 600).map(r => { const nm = r.p ? plink(r.p) : esc(r.nm), ln = r.ln;
    return `<tr><td class="l">${nm}${r.pro ? ' <span class="pill pos" title="Pro on a club">Pro</span>' : ''}</td><td class="l">${pipeTl(lg, r.ti)}</td><td class="l">${esc(r.pos)}</td><td>${r.age}</td>${lg === 'NCHF' ? `<td class="l muted">${esc(r.yr)}</td>` : ''}<td class="l muted">${esc(r.dr)}</td><td>${r.ov != null ? r.ov : '—'}</td><td>${r.p ? potCell(r.p) : '—'}</td><td class="l muted" title="${esc(roleN(r.role))}">${esc(roleN(r.role).split(' / ')[0])}</td>${ln ? `<td>${ln.gp}</td><td>${f1(ln.min)}</td><td>${f1(ln.pts)}</td><td>${f1(ln.reb)}</td><td>${f1(ln.ast)}</td>` : '<td>—</td><td>—</td><td>—</td><td>—</td><td>—</td>'}</tr>`; }).join('');
  const cols = lg === 'NCHF' ? 15 : 14, opts = '<option value="-1" selected>All players</option>' + PIPE_TEAMS[lg].map((_, k) => `<option value="${k}">${esc(pipeTeamName(lg, k))}</option>`).join('');
  return `<section class="panel" id="pipe-roster" style="margin-bottom:16px"><div class="row" style="justify-content:space-between;align-items:center;margin-bottom:8px"><h2 style="margin:0">Rosters</h2><label>Team <select data-pipesel="${lg}" aria-label="Pipeline team">${opts}</select></label></div>${bar}
  <div class="tblwrap"><table class="sortable" data-sid="pipe-all"><thead><tr><th class="l">Player</th><th class="l">Team</th><th class="l">Pos</th><th>Age</th>${lg === 'NCHF' ? '<th class="l">Class</th>' : ''}<th class="l">Draft</th><th>Ovr</th><th>${potHead()}</th><th class="l">Role</th><th>GP</th><th>Min</th><th>Pts</th><th>Reb</th><th>Ast</th></tr></thead><tbody>${body || `<tr><td class="l muted" colspan="${cols}">No players match.</td></tr>`}</tbody></table></div>${list.length > 600 ? '<p class="muted" style="margin:6px 0 0;font-size:12px">Showing the top 600 by OVR: narrow the filters to see the rest.</p>' : ''}</section>`;
}
function pipeRoster(lg, res) {
  const P = L.pipe, n = PIPE_TEAMS[lg].length; ui.pipeT = ui.pipeT || {};
  let i = ui.pipeT[lg]; if (i === -1) return pipeAll(lg, res); if (i == null || i < 0 || i >= n) i = ui.pipeT[lg] = res && res.champ != null ? res.champ : 0;
  const t = pipeTeam(lg, i), S = P.s, rows = pipeRosterRows(lg, i, S), tr = res ? res.st.find(r => r[0] === i) : null;
  const opts = '<option value="-1">All players</option>' + PIPE_TEAMS[lg].map((_, k) => `<option value="${k}" ${k === i ? 'selected' : ''}>${esc(pipeTeamName(lg, k))}</option>`).join('');
  const roleN = r => (PIPE_ROLE_NAME[lg] || {})[r] || '';
  const body = rows.map(r => { const ln = r.ln, nm = r.p ? plink(r.p) : esc(r.nm);
    return `<tr><td class="l">${nm}${r.pro ? ' <span class="pill pos" title="Pro on a club">Pro</span>' : ''}</td><td class="l">${esc(r.pos)}</td><td>${r.age}</td>${lg === 'NCHF' ? `<td class="l muted">${esc(r.yr)}</td>` : ''}<td class="l muted">${esc(r.dr)}</td><td class="l muted" title="${esc(roleN(r.role))}">${esc(roleN(r.role).split(' / ')[0])}</td>${ln ? `<td>${ln.gp}</td><td>${f1(ln.min)}</td><td>${f1(ln.pts)}</td><td>${f1(ln.reb)}</td><td>${f1(ln.ast)}</td>` : '<td>—</td><td>—</td><td>—</td><td>—</td><td>—</td>'}</tr>`; }).join('');
  const roll = res && res.s !== S ? '<p class="muted" style="margin:6px 0 0;font-size:12px">New season: lines arrive after the Finals.</p>' : '';
  return `<section class="panel" id="pipe-roster" style="margin-bottom:16px"><div class="row" style="justify-content:space-between;align-items:center;margin-bottom:8px"><h2 style="margin:0">Rosters</h2><label>Team <select data-pipesel="${lg}" aria-label="Pipeline team">${opts}</select></label></div>
  <div class="row" style="align-items:center;gap:10px;margin-bottom:8px">${pipeLogo(lg, i, 40)}<div><strong style="font-size:17px">${esc(t.full)}</strong> <span class="muted">${esc(t.abbr)}${t.conf != null ? ' · ' + esc(PIPE_CONF[t.conf]) : ''}${tr ? ` · ${tr[1]}-${tr[2]}` : ''}</span><div class="pcolors">${pipeSwatch(t.c1)} <span class="muted">&amp;</span> ${pipeSwatch(t.c2)}</div></div></div>
  <div class="tblwrap"><table class="sortable" data-sid="pipe-ros"><thead><tr><th class="l">Player</th><th class="l">Pos</th><th>Age</th>${lg === 'NCHF' ? '<th class="l">Class</th>' : ''}<th class="l">Draft</th><th class="l">Role</th><th>GP</th><th>Min</th><th>Pts</th><th>Reb</th><th>Ast</th></tr></thead><tbody>${body || '<tr><td class="l muted" colspan="11">No roster yet.</td></tr>'}</tbody></table></div>${roll}</section>`;
}
function pipeHistory(lg) {
  const H = L.pipeHist || {}, ss = Object.keys(H).map(Number).filter(s => H[s][lg]).sort((a, b) => b - a);
  if (!ss.length) return '';
  const top = lg === 'NCHF' ? 'poy' : 'mvp';
  return `<section class="panel" style="margin-bottom:16px"><h2>Award history</h2><div class="tblwrap"><table><thead><tr><th class="l">Season</th><th class="l">Champion</th><th class="l">Runner-up</th><th class="l">${esc(PIPE_AW[lg][top])}</th>${lg === 'APBA' ? `<th class="l">${esc(PIPE_AW[lg].fmvp)}</th>` : lg === 'NCHF' ? `<th class="l">${esc(PIPE_AW[lg].foy)}</th>` : `<th class="l">${esc(PIPE_AW[lg].scorer)}</th>`}</tr></thead><tbody>${ss.map(s => { const h = H[s][lg], a = h.aw || {}, x = lg === 'APBA' ? a.fmvp : lg === 'NCHF' ? a.foy : a.scorer;
    return `<tr><td class="l">${seasonName(s)}</td><td class="l">${h.ch != null ? pipeTl(lg, h.ch, true) : '—'}</td><td class="l">${h.ru != null ? pipeTl(lg, h.ru, true) : '—'}</td><td class="l">${pipeWho(lg, a[top])}</td><td class="l">${pipeWho(lg, x)}</td></tr>`; }).join('')}</tbody></table></div></section>`;
}
// v37a: Pipeline > Overview (default): top 10 draft prospects of the next class from College / EABL / APBA, biggest risers and fallers
// since the last pipeline season (the stock chip numbers), and points / rebounds / assists leaders of each league
const pipeTag = (lg, tip) => lg ? `<span class="pill pos" title="${esc(tip || PIPE_LG[lg].name)}">${lg}</span>` : '';
function pipeOverview() {
  const d = nextDraftS(L), last = pipeLatest();
  let ids = []; try { ids = mockSet(L, d).cons; } catch (e) { }
  const inPipe = p => p && p.prospect && !p.retired && p.pl && p.pt != null;
  const top = ids.map(id => L.players[id]).filter(inPipe).slice(0, 10);
  const who = p => `<a class="lk" data-player="${p.id}">${esc(p.name)}</a>`;
  const topTbl = top.length ? `<div class="tblwrap"><table><thead><tr><th class="l">Prospect</th><th class="l">League</th><th>Age</th><th>Ovr</th><th>${potHead()}</th><th title="Stock move at the last pipeline season">Stock</th></tr></thead><tbody>${top.map((p, i) => `<tr class="click" data-player="${p.id}"><td class="l nmc"><span class="muted">${i + 1}.</span> <a class="lk" data-player="${p.id}">${esc(p.name)}</a>${flagPill(p)}<div class="archtag">${posLabel(p)} \u00b7 ${esc(pipeLabel(L, p))}</div></td><td class="l">${pipeTag(p.pl)}</td><td>${p.age}</td><td>${ovrTxt(p)}</td><td>${potCell(p)}</td><td>${stockChip(p) || '<span class="muted">\u2014</span>'}</td></tr>`).join('')}</tbody></table></div><p class="muted" style="margin:6px 0 0;font-size:12px">${draftLabel(d)} class, consensus of the three mock drafts (players still in College, EABL or APBA).</p>` : '<p class="muted">No pipeline prospects in the next class yet.</p>';
  const mv = last == null ? [] : Object.values(L.players).filter(p => inPipe(p) && p.stock && p.stock.s === last && p.stock.d);
  const rise = mv.filter(p => p.stock.d > 0).sort((a, b) => b.stock.d - a.stock.d || b.stock.z - a.stock.z).slice(0, 5), fall = mv.filter(p => p.stock.d < 0).sort((a, b) => a.stock.d - b.stock.d || a.stock.z - b.stock.z).slice(0, 5);
  const mvList = l => l.length ? l.map((p, i) => `<div class="leader" style="grid-template-columns:18px minmax(0,1fr) auto"><span class="muted">${i + 1}</span><span class="pname">${who(p)} ${pipeTag(p.pl)} <span class="muted">${esc(pipeLabel(L, p))} · ${draftLabel(p.draftYear)}</span></span><span class="v">${stockChip(p)}</span></div>`).join('') : '<p class="muted">None.</p>';
  const mvHtml = last == null ? `<p class="muted">Stock moves show after the first pipeline season (results arrive after the Finals).</p>` : `<p class="muted" style="margin:-4px 0 8px">Change in his scouting read after the ${seasonName(last)} pipeline season, from how his stat line compares with players of the same rating in his league.</p><div class="grid2e"><div><div class="k">Risers</div>${mvList(rise)}</div><div><div class="k">Fallers</div>${mvList(fall)}</div></div>`;
  const ldr = PIPE_LGS.map(lg => { const res = pipeRes(lg); const cols = [['pts', 'PPG'], ['reb', 'RPG'], ['ast', 'APG']];
    return `<div class="pipe-ldr"><h3 style="margin-top:4px">${esc(PIPE_LG[lg].name)}${res ? ` <span class="muted" style="font-weight:400;text-transform:none;letter-spacing:0">${seasonName(res.s)}</span>` : ''}</h3>${res ? `<div class="pgrid">${cols.map(([k, n]) => `<div><div class="k">${n}</div>${((res.lead || {})[k] || []).slice(0, 5).map((x, i) => `<div class="leader" style="grid-template-columns:18px minmax(0,1fr) auto"><span class="muted">${i + 1}</span><span class="pname">${pipeWho(lg, x)}</span><span class="v">${f1(x.v)}</span></div>`).join('') || '<p class="muted">—</p>'}</div>`).join('')}</div>` : '<p class="muted">Season results arrive after the Finals.</p>'}</div>`; }).join('');
  return `<section class="panel" style="margin-bottom:16px"><h2>Top 10 draft prospects</h2>${topTbl}</section>
  <section class="panel" style="margin-bottom:16px"><h2>Risers and fallers</h2>${mvHtml}</section>
  <section class="panel" style="margin-bottom:16px"><h2>Leaders by league</h2>${ldr}</section>`;
}
function vPipeline() {
  if (!PIPE_LGS.includes(ui.pipeLg) && ui.pipeLg !== 'ALL') ui.pipeLg = 'ALL';   // v37a: Overview is the first tab
  const lg = ui.pipeLg, ready = !!(L.pipe && L.pipe.lg && L.pipe.lg[lg]), res = ready ? L.pipe.lg[lg].res : null;
  const sub = `<div class="subtabs" style="margin-bottom:12px">${PIPE_TABS.map(([k, n]) => `<button class="sm ${k === lg ? 'primary' : ''}" data-pipelg="${k}">${n}</button>`).join('')}</div>`;
  if (lg === 'ALL') return `${sub}<h2>Pipeline overview</h2><p class="muted" style="margin-top:-4px">College (NCHF) and the two international leagues (EABL, APBA) that feed the draft. Pick a league tab for standings, brackets, awards and rosters.</p>${pipeOverview()}`;
  const head = `<h2>${esc(PIPE_LG[lg].name)}</h2><p class="muted" style="margin-top:-4px">${PIPE_LG[lg].kind === 'college' ? `${PIPE_TEAMS[lg].length} teams in ${PIPE_CONF.length} conferences` : `${PIPE_TEAMS[lg].length} teams`} · ${PIPE_LG[lg].G} games · results only, no box scores. These players feed the draft.</p>`;
  if (!ready) return `${sub}${head}<section class="panel"><p class="muted">Season results arrive after the Finals.</p></section>`;
  if (!res) return `${sub}${head}<section class="panel"><p class="muted">Season results arrive after the Finals.</p></section>${pipeRoster(lg, null)}`;
  return `${sub}${head}<p class="muted" style="margin:0 0 10px">${seasonName(res.s)} season</p>
  <div class="grid2e" style="margin-bottom:16px"><section class="panel"><h2>Champion and bracket</h2>${pipeBracket(lg, res)}</section><section class="panel"><h2>Standings</h2>${pipeStandings(lg, res)}</section></div>
  <section class="panel" style="margin-bottom:16px"><h2>Leaders</h2>${pipeLeaders(lg, res)}</section>
  <section class="panel" style="margin-bottom:16px"><h2>Awards</h2>${pipeAwards(lg, res)}</section>
  ${pipeRoster(lg, res)}${pipeHistory(lg)}`;
}

// S3: player page. College / International table + "Before the pros" trophy case (prospects, active and retired players)
const PIPE_BADGE = { NCHF: ['#d9a521', '#8a6410'], EABL: ['#9fb4d9', '#4a5f8a'], APBA: ['#e0975a', '#8a4b1a'] };
function pipeBadge(lg, n) { const c = PIPE_BADGE[lg] || PIPE_BADGE.NCHF; return `<svg width="54" height="54" viewBox="0 0 54 54" role="img" aria-label="${esc(lg)} honor"><circle cx="27" cy="27" r="24" fill="${c[0]}" stroke="${c[1]}" stroke-width="2"/><circle cx="27" cy="27" r="18" fill="none" stroke="#ffffff" stroke-width="1.4" opacity=".7"/><text x="27" y="31" text-anchor="middle" font-size="10" font-weight="800" fill="#2b2106" font-family="Inter,sans-serif">${esc(lg)}</text></svg>`; }
function preHonorsPanel(p) {
  const hs = typeof preHonors === 'function' ? preHonors(p) : []; if (!hs.length) return '';
  hs.sort((a, b) => b.n - a.n || a.lg.localeCompare(b.lg));
  return `<section class="panel" style="margin-bottom:16px"><h3>Before the pros</h3><div class="trcase">${hs.map(h => { const ss = h.s.slice().sort((a, b) => a - b), conf = h.c != null && PIPE_CONF[h.c] ? PIPE_CONF[h.c] : '';
    return `<div class="tritem" title="${esc(h.a)} · ${esc(h.lg)}${conf ? ' · ' + esc(conf) : ''}"><div class="trart">${pipeBadge(h.lg, h.n)}</div><div class="trname">${esc(h.a)}${h.n > 1 ? ` <strong>×${h.n}</strong>` : ''}</div><div class="muted" style="font-size:11px">${esc(h.lg)}${conf ? ' · ' + esc(conf) : ''}</div><div class="trchips">${ss.map(s => trChip(seasonName(s))).join('')}</div></div>`; }).join('')}</div></section>`;
}
function pipeCollegePanel(p) {
  const pre = (p.pre || []).slice().sort((a, b) => a.s - b.s), cu = L.user != null && pipeCallable(L).some(x => x.id === p.id), now = p.club && p.club.s === L.season ? p.club : null;
  if (!pre.length && !cu && !now) return '';
  const last = pre.length ? pre[pre.length - 1] : null, role = last ? (PIPE_ROLE_NAME[last.lg] || {})[p.pRole] || '' : '';
  const intro = p.prospect && last ? `<p style="margin:0 0 8px">Latest: <strong>${seasonName(last.s)}</strong> · ${esc(last.lg)} · ${esc(pipeTeamName(last.lg, last.tid))} · ${f1(last.pts)} pts, ${f1(last.reb)} reb, ${f1(last.ast)} ast in ${f1(last.min)} min${role ? ` · Role: <strong>${esc(role)}</strong>` : ''} ${stockChip(p)}</p>` : now ? `<p style="margin:0 0 8px">This season: <strong>${esc(pipeTeamName(now.lg, now.t))}</strong> (${esc(now.lg)}) ${pipeChip(now.lg, now.t)}${p.team == null ? ' · free agent on a club' : ''}</p>` : '';
  const yr = h => h.lg === 'NCHF' && p.pFrom != null && h.s >= p.pFrom && h.s - p.pFrom < 4 ? ` <span class="muted">${PIPE_YR_LABEL[h.s - p.pFrom + 1]}</span>` : '';
  const tbl = pre.length ? `<div class="tblwrap"><table><thead><tr><th class="l">Season</th><th class="l">League</th><th class="l">Team</th><th>GP</th><th>Min</th><th>Pts</th><th>Reb</th><th>Ast</th><th>Stl</th><th>Blk</th><th title="Three-pointers made">3PM</th></tr></thead><tbody>${pre.map(h => `<tr><td class="l">${seasonName(h.s)}</td><td class="l">${esc(h.lg)}${yr(h)}${h.x ? ' <span class="pill pos" title="Pro club season">Pro</span>' : ''}</td><td class="l">${esc(pipeTeamName(h.lg, h.tid))}</td><td>${h.gp}</td><td>${f1(h.min)}</td><td>${f1(h.pts)}</td><td>${f1(h.reb)}</td><td>${f1(h.ast)}</td><td>${f1(h.stl)}</td><td>${f1(h.blk)}</td><td>${f1(h.tpm)}</td></tr>`).join('')}</tbody></table></div>` : '';
  return `<section class="panel" style="margin-bottom:16px"><div class="row" style="justify-content:space-between;align-items:center;margin-bottom:6px"><h3 style="margin:0">College / International</h3>${cu ? `<button class="sm primary" data-callup="${p.id}">Call up</button>` : ''}</div>${intro}${tbl}</section>`;
}
const pipePlayerPanels = p => { try { return pipeCollegePanel(p) + preHonorsPanel(p); } catch (e) { return ''; } };

// S4: draft board columns (School / club, class year) and the stock chip (up / down since the last pipeline season)
function stockChip(p) {
  const s = p && p.stock, last = pipeLatest(); if (!s || last == null || s.s !== last || !s.d) return '';
  return `<span class="pill ${s.d > 0 ? 'stk-up' : 'stk-dn'}" title="z ${s.z}">${s.d > 0 ? '▲' : '▼'}${Math.abs(s.d)}</span>`;
}
function pipeSchool(p) {
  const t = pipeLabel(L, p); if (!t) return '<span class="muted">—</span>';
  const yr = (p.src === 'c' || p.pl === 'NCHF') && p.pFrom != null && L.pipe && L.pipe.s != null && p.src !== 'o' ? PIPE_YR_LABEL[Math.max(1, Math.min(4, pipeYear(p, L.pipe.s)))] : '';
  return `${esc(t)}${yr ? ` <span class="muted">${yr}</span>` : ''}`;
}
const pipeSchoolTd = p => `<td class="l" data-v="${esc(String(pipeLabel(L, p) || '').toLowerCase())}">${pipeSchool(p)}</td>`;

// S5: call-ups
function clubChip(p) {
  if (!p || !p.club || p.club.s !== L.season) return '';
  return ` <span class="clubchip" title="${esc(pipeTeamName(p.club.lg, p.club.t))} (${esc(p.club.lg)})">${pipeChip(p.club.lg, p.club.t)}<span class="muted" style="font-size:11px"> ${esc(p.club.lg)}</span></span>`;
}
function callUpDialog(pid) {
  const p = L.players[pid]; if (!p || L.user == null) return;
  const cost = pipeBuyout(L, p), t = L.teams[L.user], club = p.club ? pipeTeamName(p.club.lg, p.club.t) : '';
  dialog(`<h2>Call up ${esc(p.name)}?</h2><p>${esc(club)}${p.club ? ` (${esc(p.club.lg)})` : ''}. He signs a minimum deal (${money(MINSAL)}) for the rest of the season.</p><p>${cost ? `Buyout to his club: <strong>${money(cost)}</strong>, paid from team cash (shown under International buyouts in Finances).` : 'No buyout: he leaves his club for free.'}</p><p class="muted">Roster: ${t.roster.length} of 15.</p><div class="row"><button class="primary" id="cu-ok">Call up</button><button id="cu-no">Cancel</button></div>`);
  $('#cu-no').onclick = closeDialog;
  $('#cu-ok').onclick = () => { const r = callUp(L, pid); closeDialog(); save(); render(); alertMsg(r.msg); };
}
// delegated handlers (capture phase: they stop the click before row / link handlers run)
document.addEventListener('click', e => {
  if (!L) return;
  const cu = e.target.closest('[data-callup]'); if (cu) { e.stopPropagation(); e.preventDefault(); callUpDialog(+cu.dataset.callup); return; }
  if (e.target.closest('[data-pipef-clear]')) { e.stopPropagation(); ui.pipeF = {}; render(); return; }
  const lgb = e.target.closest('[data-pipelg]'); if (lgb && $('#main').contains(lgb)) { e.stopPropagation(); ui.pipeLg = lgb.dataset.pipelg; render(); return; }
  const tm = e.target.closest('[data-pipeteam]'); if (tm && $('#main').contains(tm)) { e.stopPropagation(); e.preventDefault(); const [lg, i] = tm.dataset.pipeteam.split('|'); ui.pipeLg = lg; (ui.pipeT = ui.pipeT || {})[lg] = +i; render(); const el = $('#pipe-roster'); if (el) el.scrollIntoView({ block: 'start' }); }
}, true);
document.addEventListener('change', e => { const pf = e.target.closest && e.target.closest('[data-pipef]'); if (pf && L) { (ui.pipeF = ui.pipeF || {})[pf.dataset.pipef] = pf.value; render(); return; }
  const s = e.target.closest && e.target.closest('select[data-pipesel]'); if (!s || !L) return; (ui.pipeT = ui.pipeT || {})[s.dataset.pipesel] = +s.value; render(); });
const hofPre = pid => { const p = L.players[pid], n = p && p.preAw ? p.preAw.length : 0; return n ? ` <span class="muted" title="College / international honors">· ${n} before the pros</span>` : ''; };
// trade news: small team logos + player faces, each player beside the team named just before him ("POR acquire X; DET acquire Y").
// Names come from the text, so old saves work too.
function newsPics(text) {
  linkify('');
  const gs = [], seen = new Set(); let cur = null;
  const grp = t => { let x = gs.find(y => y.t === t); if (!x) { x = { t, p: [] }; gs.push(x); } return x; };
  for (const m of String(text).match(ui.nameRx) || []) {
    const ab = L.teams.find(t => t.abbr === m), v = ui.nameMap[m];
    const tid = ab ? ab.id : v && v[0] === 't' ? +v.slice(1) : null;
    if (tid != null) { cur = grp(tid); continue; }
    const pid = v && v[0] === 'p' ? +v.slice(1) : null;
    if (pid != null && L.players[pid] && !seen.has(pid)) { seen.add(pid); (cur || grp(null)).p.push(pid); }
  }
  if (!gs.length) return '';
  const face = id => { const p = L.players[id]; return `<a class="np-p" data-player="${id}" title="${esc(p.name)}">${portrait('p', id, p.nat, p.team, 'np')}</a>`; };
  return `<span class="np">${gs.slice(0, 4).map(x => `<span class="np-g">${x.t != null ? `<a class="np-t" data-team="${x.t}" title="${esc(tname(x.t))}">${logo(x.t, 24)}</a>` : ''}${x.p.slice(0, 4).map(face).join('')}</span>`).join('')}</span>`;
}
function vNews() {
  const cats = [['', 'All'], ['trade', 'Trades'], ['tx', 'Transactions'], ['inj', 'Injuries'], ['feat', 'Feats'], ['award', 'Awards & honors'], ['draft', 'Draft'], ['coach', 'Coaches'], ['watch', 'Watch list'], ['rumor', 'Rumors'], ['beat', 'Beat reports'], ['feature', 'Features'], ['pipe', 'Pipeline'], ['league', 'League']];
  const c = ui.ncat || '';
  const items = L.log.filter(x => !c || (c === 'pipe' ? x.k === 'pipe' : x.cat === c)).slice(0, 250);
  const inj = Object.values(L.players).filter(p => p.team != null && p.injury > 0).sort((a, b) => b.injury - a.injury);
  const when = x => x.phase && (x.phase.startsWith('off') || x.phase === 'season-done') ? 'Offseason' : x.phase === 'playoffs' ? 'Playoffs' : 'Day ' + (x.day + 1);
  return `<div class="grid2"><section class="panel"><h2>News & events</h2><div class="row" style="margin-bottom:10px">${cats.map(([k, n]) => `<button class="sm chipbtn ${c === k ? 'primary' : ''}" data-ncat="${k}">${n}</button>`).join('')}</div>${items.length ? items.map(x => `<div class="leader" style="grid-template-columns:110px minmax(0,1fr)"><span class="muted">${seasonName(x.season)} · ${when(x)}</span><span>${linkify(x.text)}${x.cat === 'trade' ? newsPics(x.text) : ''}</span></div>`).join('') : '<p class="muted">Nothing here yet.</p>'}</section>
  <section class="panel"><h2>Injury report</h2><p class="muted" style="margin-top:-4px"><a class="lk" href="#injuries">Full report with return dates →</a></p>${inj.length ? `<div class="tblwrap"><table><thead><tr><th class="l">Player</th><th class="l">Team</th><th class="l">Injury</th><th>Out</th></tr></thead><tbody>${inj.slice(0, 15).map(p => `<tr class="click" data-player="${p.id}"><td class="l">${esc(p.name)}</td><td class="l">${tlabel(p.team)}</td><td class="l muted">${esc(p.injName || '')}</td><td>${injGames(p)}</td></tr>`).join('')}</tbody></table></div>` : '<p class="muted">Everyone is healthy.</p>'}</section></div>`;
}
// v24.6: league-wide injury report: who's out, how long, when he's back, and who returns soon
function vInjuries() {
  const sev = ui.injSev || '', tf = ui.injTeam == null ? '' : String(ui.injTeam);
  const all = Object.values(L.players).filter(p => !p.retired && p.injury > 0 && (p.team != null || (L.fa || []).includes(p.id)));
  const band = p => isDTD(p) ? 'dtd' : p.injSE ? 'se' : p.injury >= 25 ? 'long' : p.injury >= 5 ? 'mid' : 'short';
  const list = all.filter(p => (!sev || band(p) === sev) && (tf === '' || (tf === 'fa' ? p.team == null : String(p.team) === tf))).sort((a, b) => (a.team == null) - (b.team == null) || ovrNum(b) - ovrNum(a));
  const R0 = new Map(all.map(p => [p.id, injReturn(p)]));
  const soon = L.phase === 'regular' ? all.filter(p => p.team != null && !isDTD(p) && R0.get(p.id) && R0.get(p.id).day != null && R0.get(p.id).games <= 3).sort((a, b) => R0.get(a.id).day - R0.get(b.id).day || b.ovr - a.ovr) : [];
  const cnt = k => all.filter(p => p.team != null && band(p) === k).length;
  const sevs = [['', 'All'], ['dtd', 'Day-to-day'], ['short', 'Short (1-4)'], ['mid', '5-24 games'], ['long', '25+ games'], ['se', 'Season-ending']];
  const teamOpts = `<option value="">All teams</option>${L.teams.map(t => `<option value="${t.id}" ${tf === String(t.id) ? 'selected' : ''}>${esc(tname(t.id))}</option>`).join('')}<option value="fa" ${tf === 'fa' ? 'selected' : ''}>Free agents</option>`;
  const row = p => { const r = R0.get(p.id); return `<tr class="click ${isUser(p.team) ? 'mine' : ''}" data-player="${p.id}"><td class="l"><span class="injx" aria-hidden="true">✚</span> ${esc(p.name)}</td><td class="l">${p.team != null ? tlabel(p.team) : '<span class="muted">Free agent</span>'}</td><td>${posLabel(p)}</td><td>${ovrTxt(p)}</td><td class="l">${esc(p.injName || '')}${p.injRepeat ? ' <span class="muted" title="He has hurt this body part before">(again)</span>' : ''}</td><td data-v="${p.injury}">${isDTD(p) ? '<span class="pill dtd">DTD</span>' : `<span class="pill ${p.injSE ? 'long' : p.injLong ? 'long' : 'inj'}">${injGames(p)}</span>`}</td><td class="l" data-v="${r && r.day != null ? r.day : 9999}">${r ? esc(r.txt) : ''}${hurtPlanSel(p)}</td></tr>`; };
  const soonHtml = soon.length ? soon.slice(0, 12).map(p => { const r = R0.get(p.id); return `<div class="leader" style="grid-template-columns:minmax(0,1fr) auto"><span>${plink(p)} <span class="muted">${L.teams[p.team].abbr} · ${ovrTxt(p)} · ${esc((p.injName || '').toLowerCase())}</span></span><span>${r.day === L.day ? 'today' : 'day ' + (r.day + 1)}</span></div>`; }).join('') : '<p class="muted">Nobody due back in the next few games.</p>';
  return `<div class="grid2"><section class="panel"><h2>Injury report</h2><p class="muted" style="margin-top:-4px">${cnt('dtd') + cnt('short') + cnt('mid') + cnt('long') + cnt('se')} players hurt on team rosters: ${cnt('dtd')} day-to-day (game-time calls), ${cnt('short')} short, ${cnt('mid')} for 5-24 games, ${cnt('long')} for 25+, ${cnt('se')} season-ending. Injuries heal by the day, rest days included; return dates follow each team's schedule.</p>
  <div class="row" style="margin-bottom:10px"><select id="injteam">${teamOpts}</select>${sevs.map(([k, n]) => `<button class="sm chipbtn ${sev === k ? 'primary' : ''}" data-injsev="${k}">${n}</button>`).join('')}</div>
  ${list.length ? `<div class="tblwrap"><table class="sortable" data-sid="inj"><thead><tr><th class="l">Player</th><th class="l">Team</th><th>Pos</th><th>Ovr</th><th class="l">Injury</th><th title="Games of recovery left">Out</th><th class="l">Return</th></tr></thead><tbody>${list.map(row).join('')}</tbody></table></div>` : '<p class="muted">No injuries match.</p>'}</section>
  <section class="panel"><h2>Returning soon</h2><p class="muted" style="margin-top:-4px">Back within 3 games.</p>${soonHtml}</section></div>${suspReport()}`;
}
// v30a #15: type changes: show what changed per player (types added, dropped, upgraded to Elite, kept)
function typeDiff(m) {
  const [a, b] = String(m).split(' → '), A = a ? a.split(' + ') : [], B = b ? b.split(' + ') : [];
  const base = x => x.replace(/^Elite /, ''), mapA = new Map(A.map(x => [base(x), x])), mapB = new Map(B.map(x => [base(x), x]));
  const added = B.filter(x => !mapA.has(base(x))), dropped = A.filter(x => !mapB.has(base(x)));
  const up = B.filter(x => mapA.has(base(x)) && x.startsWith('Elite ') && !mapA.get(base(x)).startsWith('Elite ')), down = B.filter(x => mapA.has(base(x)) && !x.startsWith('Elite ') && mapA.get(base(x)).startsWith('Elite '));
  const kept = B.filter(x => mapA.has(base(x)) && !up.includes(x) && !down.includes(x));
  const kind = added.length && dropped.length ? 'Type replaced' : added.length ? 'New type' : dropped.length ? 'Type dropped' : up.length ? 'Now Elite' : down.length ? 'No longer Elite' : 'Changed';
  return { added, dropped, up, down, kept, kind };
}
function typeMoveRow(id, m, mine) {
  const p = L.players[id]; if (!p) return '';
  const d = typeDiff(m), chip = (x, c, tip) => `<span class="tchg ${c}" title="${tip}">${esc(x)}</span>`;
  return `<div class="tmove ${mine ? 'mine' : ''}" data-tmove="${id}"><div>${plink(p)} <span class="muted">${posLabel(p)} · ${p.age} · ${ovrTxt(p)}</span> <span class="pill tkind">${d.kind}</span></div><div class="tchgs">${d.dropped.map(x => chip(x, 'tdrop', 'Dropped')).join('')}${d.down.map(x => chip(x, 'tdrop', 'Lost the Elite tag')).join('')}${d.added.map(x => chip(x, 'tadd', 'New')).join('')}${d.up.map(x => chip(x, 'tadd', 'Upgraded to Elite')).join('')}${d.kept.map(x => chip(x, 'tkeep', 'Unchanged')).join('')}</div></div>`;
}
function devReport(s) {
  const d = s.dev || {}; const mine = id => L.players[id] && L.user != null && L.players[id].team === L.user;
  const sec = (title, list, note) => list && list.length ? `<div class="panel"><h3>${title}</h3><p class="muted" style="margin:-4px 0 6px;font-size:12px">${note}</p>${list.map(([id, dd]) => { const p = L.players[id]; return p ? `<div class="leader ${mine(id) ? 'mine' : ''}" style="grid-template-columns:minmax(0,1fr) auto"><span>${plink(p)} <span class="muted">${p.team != null ? L.teams[p.team].abbr : 'FA'} · ${p.age}</span></span><span class="${dd > 0 ? 'w' : dd < 0 ? 'lo' : ''}">${dd > 0 ? '+' : ''}${dd} → ${ovrTxt(p)}</span></div>` : ''; }).join('')}</div>` : '';
  const tm = s.typeMoves && s.typeMoves.length ? `<div class="panel" id="typechg"><h3>Type changes</h3><p class="muted" style="margin:-4px 0 6px;font-size:12px">Players whose game changed: aging athletes, new skills, or a second or third type for a rising star. <span class="tchg tadd">added</span> <span class="tchg tdrop">dropped</span> <span class="tchg tkeep">unchanged</span></p>${s.typeMoves.map(([id, m]) => typeMoveRow(id, m, mine(id))).join('')}</div>` : '';
  const body = [sec('Breakouts', d.breakouts, 'Young players who took a big step.'), sec('Late bloomers', d.bloomers, 'Second-rounders, undrafted players and slow developers who came on late.'), sec('Stalled', d.stalled, 'Young players with a big gap to their scouted potential who didn\'t improve.'), sec('Sliding', d.slides, 'Young players who went backwards.'), sec('Declining veterans', d.declines, 'Athleticism fades first, usually from 28 to 32.'), tm, (() => { const mine = L.user != null ? teamPlayers(L.user).filter(p => p.focusLog && p.focusLog.s >= L.season - 1) : []; return mine.length ? `<div class="panel"><h3>Your training focus</h3><p class="muted" style="margin:-4px 0 6px;font-size:12px">What each player's focus added this summer.</p>${mine.map(p => `<div class="leader" style="grid-template-columns:minmax(0,1fr)"><span>${plink(p)} <span class="muted">${esc(focusLogTxt(p))}</span></span></div>`).join('')}</div>` : ''; })()].filter(Boolean).join('');
  return body ? `<h2 style="margin:16px 0 8px">Development report</h2><div class="grid3" style="margin-bottom:16px">${body}</div>` : '';
}
// v30a #20: progression / regression report on its own page (League > Progression). Stays until the next season starts.
function reviewBanner() { return `<div class="panel" id="revbanner" style="margin-bottom:16px;display:flex;gap:10px;align-items:center;flex-wrap:wrap"><span>Progression &amp; regression report is ready: who improved, who declined, retirements, type changes.</span><a class="lk" href="#review" id="revlink">Open the report →</a></div>`; }
function vReviewPage() {
  const body = L.offSummary ? vReview() : '';
  return `<section class="panel" id="revpage" style="margin-bottom:16px"><h2>Progression &amp; regression · ${seasonName(L.season)} offseason</h2><p class="muted" style="margin:-4px 0 0">Rating changes after the season. Available here until the next season starts.</p></section>${body || '<p class="muted">No report yet. It appears after the season ends and ratings update.</p>'}`;
}
function vReview() {
  const s = L.offSummary; if (!s) return '';
  const mine = L.user != null && s.mine && s.mine.length ? `<div class="panel" style="margin-bottom:16px"><h3>Your team · rating changes</h3><div class="tblwrap"><table class="sortable" data-sid="rev-mine"><thead><tr><th class="l">Player</th><th class="l">Pos</th><th>Age</th><th>Before</th><th>Now</th><th>Change</th><th class="l">Status</th></tr></thead><tbody>${s.mine.map(([id, d]) => { const p = L.players[id]; if (!p) return ''; return `<tr class="click" data-player="${p.id}"><td class="l">${esc(p.name)}</td><td class="l">${posLabel(p)}</td><td>${p.age}</td><td>${p.ovr - d}</td><td><strong>${ovrTxt(p)}</strong></td><td class="${d > 0 ? 'w' : d < 0 ? 'lo' : ''}">${d > 0 ? '+' : ''}${d}</td><td class="l muted">${p.retired ? 'Retired' : p.age < p.peak ? 'Developing' : p.age < p.regStart ? 'Prime' : 'Declining'}</td></tr>`; }).join('')}</tbody></table></div></div>` : '';
  const line = ([id, d]) => { const p = L.players[id]; return p ? `<div class="leader" style="grid-template-columns:minmax(0,1fr) auto"><span>${plink(p)} <span class="muted">${p.team != null ? L.teams[p.team].abbr : 'FA'} · ${p.age}</span></span><span class="v ${d > 0 ? 'w' : 'lo'}">${d > 0 ? '+' : ''}${d} → ${ovrTxt(p)}</span></div>` : ''; };
  return `${mine}<div class="grid3" style="margin-bottom:16px"><div class="panel"><h3>Biggest improvements</h3>${s.up.map(line).join('')}</div><div class="panel"><h3>Biggest declines</h3>${s.down.map(line).join('')}</div>
  <div class="panel"><h3>Retired · ${s.retired.length}</h3>${s.retired.map(id => { const p = L.players[id]; return p ? `<div class="leader" style="grid-template-columns:minmax(0,1fr) auto"><span>${plink(p)}</span><span class="muted">${p.age} · ${esc(p.retireWhy || '')}</span></div>` : ''; }).join('') || '<p class="muted">Nobody.</p>'}</div>
  ${s.posMoves.length ? `<div class="panel"><h3>Position changes</h3>${s.posMoves.map(([id, m]) => L.players[id] ? `<div>${plink(L.players[id])} <span class="muted">${esc(m)}</span></div>` : '').join('')}</div>` : ''}</div>
  ${devReport(s)}`;
}

function vRules() {
  return `<section class="panel" style="max-width:840px"><h2>How ${L && L.nba ? 'the NBA 2026-27 league' : 'the Pacific Basketball League'} works</h2>
  ${L && L.nba && typeof NBA_TEXT !== 'undefined' ? `<h3>NBA mode</h3><ul>${NBA_TEXT.how.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
  <p>${L && L.nba ? 'Thirty teams in the East and West conferences, six divisions of five. 2026-27 rosters and contracts.' : 'Sixteen teams in two conferences: North (Luzon) and South (the Visayas and Mindanao).'} Each team plays ${SEASON_GAMES} games (the season length is chosen when the league is created), mostly against its own conference. Games are simulated possession by possession with four 12-minute quarters, a 24-second shot clock and 5-minute overtimes.</p>
  <h3>Players</h3><p>Height, weight and wingspan shape athleticism, rebounding and defense. Each player has an archetype for his position, such as Pass-first PG or Rim protector. Players rated 80+ can carry a second archetype, 88+ a third, and the best get an Elite version. Each player also has a personality (Loyal, Money-first, Wants to win or Balanced) that shapes contract talks.</p>
  <h3>Usage</h3><p>Every possession has a primary ball handler. Players with high ball dominance (built from handling, passing, scoring and IQ) handle it more, so they shoot more, get to the line more, assist more and turn it over more. Isolation coaches lean even harder on their top option, while motion offenses spread it around. USG% is the share of team possessions a player uses on the floor.</p>
  <h3>Rotations</h3><p>Coaches run tight, balanced or deep rotations. Tight rotations ride the starters, deep ones spread minutes, and a strong bench takes minutes from the starters on any team. Stars (78+) get extra minutes. In the last 5 minutes of close games the closers play. In the last 2 minutes the defense brings in its best defenders and a trailing team brings in its scorers. In blowouts the key players rest, which also lowers their injury risk.</p>
  <h3>Potential and scouting</h3><p>True potential is hidden from teams. They see a scouting estimate that sharpens with age. ${commish() ? 'As commissioner you see the true number.' : 'You see the same scouting range as every front office.'} Young players are valued partly on that estimate, so they earn a little more than veterans past their peak at the same rating.</p>
  <h3>Owners' patience</h3><p>After 3 straight seasons out of the playoffs (the play-in doesn't count), the owner demands a playoff team: 2 more misses and the GM is fired. Making the playoffs earns some trust but only probation; missing the next season means the one after is playoffs-or-fired. A new GM starts with a clean slate. Teams stuck in the middle for three seasons commit to a direction (rebuild or push), and teams with 4+ seasons without the playoffs get slightly better lottery odds.</p>
  <h3>Contracts: agents, incentives, no-trade clauses, holdouts</h3><p>Every player has an agent. Tough agents ask about 7% more and their underpaid stars may hold out at the start of a season (pay him or he sits up to 15 games and his mood drops). Fair agents stay close to market value. Loyal agents give the player's current team about a 6% discount. Click an agent's name to see his clients. Offers can include an incentive (up to 25% of the salary) paid in cash only if earned: 45+ games, an All-Star selection, or a playoff spot. It isn't on the cap, and players value it by how likely it is. Stars (75+, with 7+ seasons or aged 29+) can get a no-trade clause; they take about 5% less, but must approve any trade (contenders get an easier yes). Rookie-scale players can be extended a year early, at a discount.</p>
  <h3>Relationships, chemistry, injuries and offseason events</h3><p>Some prospects are brothers of current players or sons of coaches and former stars. Family on the same team lifts morale, and free agents lean toward teams where family plays. A player's first head coach is his mentor (small morale boost if reunited); a coach he asked to be traded away from is friction. Starters who have played together for years get a small edge (Chemistry panel on team pages). Injuries are tracked by body part; a part hurt before is more likely to go again and takes a little longer. Players with 3+ injuries of 5+ games in two seasons are labeled injury-prone (worth a bit less). After a long injury a player comes back on a minutes limit. AI contenders rest older stars on some back-to-backs (you can turn this on in your lineup settings). Bigger staff budgets bring players back a little sooner. Players 28+ with heavy career minutes wear down a little faster. After the draft, young players play a short summer league, and every 4 years the best countries play an international tournament. Each season has 3–6 storylines (Season Preview) that wrap up the next preseason.</p>
  <h3>Recaps, achievements and history</h3><p>Popups after sims (awards with voting, deadline recap, draft grades, jersey retirements and more) can be reopened from the Recent button; after clicking a name in a popup, use Back to popup. Players, teams and coaches unlock achievements (History → Achievements). Career milestones (10,000+ points, 1,000 games) appear in the news, and a weekly League pulse sums up the league. The History book shows the league and any franchise season by season, plus your GM career.</p>
  <h3>Scouting, interviews and two-way deals</h3><p>At the start of each season and after the trade deadline your director checks in with recommended assignments and interviews, each with a reason. The Draft tab's Scouting view lets you assign your director to up to 3 things: a country, a position or one prospect. After about two weeks of games his reads on those players sharpen (one prospect: much sharper); offseason assignments start next season. His written reports give a potential range, strengths, concerns and a player comparison, but they are his opinion and can be wrong: some directors have a blind spot for a type of player, and prospects develop along hidden paths. Personality and work ethic are hidden for prospects until you interview them (5 interviews a season; better directors read players more accurately). Each team has 2 two-way slots for free agents 27 or younger with fewer than 3 seasons of service (a season counts at 10+ regular-season games). Two-way players don't count against the cap or the 15-man roster, can play up to 20 regular-season games with the team (only games they play count), and play in the development league on other days. They can't play in the playoffs unless converted to a standard contract (minimum salary, 2 years with a team option), which needs an open roster spot and must happen during the regular season. A full development-league season (25+ games) gives young players a small boost. Two-way deals expire when free agency opens. Your coach writes development reports for players 25 and under: his read of their path, where they might peak and what to work on. Better development coaches read players more accurately.</p>
  <h3>Shot choice, trade fit and stat qualifiers</h3><p>Big men (PF and C) take threes and mid-range shots only as often as their skill supports, so a center who can't shoot rarely launches. A player's shot tendencies also drift about 20% each summer toward his skills: a big who learns to shoot slowly shoots more, and one who loses his shot stops. Trade offers and the trade builder show each player's system fit before and after the move (green ▲ is +5 or more, red ▼ is −5 or worse), plus what each team gets. On the Stats tab, every player needs half of his team's games; then each percentage needs enough attempts, as a per-game average or a season total (FG% 2 FGA a game or 90, 3P% and FT% 1.5 a game or 75, usage, plus-minus and BPM 10 minutes a game or 500). A stat that isn't met shows NM and sorts to the bottom.</p>
  <h3>Traits (v25.9)</h3><p>Every player has seven traits rated 1-100, shown on two tabs of his Attributes window. <strong>Off court</strong>: loyalty, money, winning, work ethic. <strong>On court</strong>: motor, coachability, durability. The old personality label (Loyal, Money-first, Wants to win, Balanced, Mentor) is just the strongest off-court trait (66+ and 8 clear of the next).</p>
  <table class="help-tbl"><tr><th>Trait</th><th>What it does</th></tr>
  <tr><td>Motor</td><td>Game effort: up to about ±1.2 rating points on defense and ±0.4 on offense each game (30 points from average, 55). High motor also feels back-to-backs less. A whole roster at 85 vs 25 is about +1 point of margin.</td></tr>
  <tr><td>Coachability</td><td>Growth ±15% at the extremes, and how much the coach's development rating helps. Fewer complaints about lost minutes; a broken promise hurts him less.</td></tr>
  <tr><td>Durability</td><td>Injury chance per game. Games lost a season: about 6 (low), 4 (mid), 3.7 (high). Drops after 30 and by 3 after a major injury.</td></tr>
  <tr><td>Work ethic</td><td>Growth ×0.62 (lazy) to ×1.42 (legendary); decline ×1.3 to ×0.62.</td></tr>
  <tr><td>Money</td><td>Ask +4% at 80. Pay weighs more in his mood. At 70+ he never goes below his ask and ignores market size. About half of money-70+ players leave when their deal ends.</td></tr>
  <tr><td>Loyalty</td><td>Re-sign discount up to 12%, mood rises with years on the team, rarely walks (about 1 in 5 at 70+).</td></tr>
  <tr><td>Winning</td><td>Takes less from contenders, more from losers; 66+ asks a premium from rebuilders, 72+ won't sign with or re-sign at a tanking team; easier no-trade approval for contenders.</td></tr></table>
  <p>Traits move each offseason: after 30 money falls and winning rises (without a ring); titles and playoffs raise loyalty; losing raises winning; a big raise lowers money; a trade lowers loyalty; losing your role lowers motor and coachability; a major injury lowers durability and motor; a good development coach raises coachability; plus a small drift to the middle. Changes of 2+ are in his Off court tab and the yearbook. You see a player's traits once he has played a season (or is on your team); before that a rough read; prospects only through interviews.</p>
  <h3>Scouting reports, playstyles and draft comps</h3><p>Every player has a scouting report: how valuable he is to his team and the league, his role and tier (Bench player · Role player · Low-end starter · Quality starter · All-Star · All-League · MVP, set by league rank: about 55 / 62 / 68 / 76 / 78 / 87 OVR in a 30-team league), stats he leads his team in, his playstyle line ("a pass-first playmaker who can also make shots"), notable traits, and his contract (under/fair/overpaid, years left, options). Prospects show strengths and weaknesses against their position, and a <strong>floor</strong> and <strong>ceiling</strong>: your scouts' read minus/plus the read's error and development doubt, each with a tier, a league comp (current or retired player with a similar peak and type) and an NBA comp.</p>
  <h3>Player tags (v26.0)</h3><p>Tags are recalculated whenever you look. <strong>Cornerstone</strong> (Franchise Cornerstone): one of his team's two most valuable players (rating, plus youth upside for 24 and under) and either All-Star level now (76+ in a 30-team league) or 23 or younger with an All-League potential read (78+). 0-2 per team; AI teams ask 12% more to give one up. <strong>Untouchable</strong>: his team won't trade him and AI teams never ask for him. On your team set it from the ⋯ menu on the roster row or the buttons on his player page. AI teams set it themselves: contenders and hopefuls protect their two most valuable players; rebuilders and tankers protect their best two players 24 and under with a 72+ potential read (if they have none, nobody); a team in a playoff race at the deadline also holds all its players 24 and under and its rotation players 26 and up. A star who asked out, or is in his last year with low morale, loses protection. <strong>Bargain</strong>: paid 70% or less of his value and $3M+ under. <strong>Overpaid</strong>: 135%+ of his value and $6M+ a year (buyers take 5% off; bargains +3%). <strong>Fits coach / Clashes with coach</strong> (rotation players): his fit with this coach compared with his average fit over all 12 system pairs: 11+ above (and 58+ fit) = fits; 9+ below (and 62 or less) = clashes. A good player can have a high fit % and still no tag.</p>
  <h3>Roster needs, team history and coach fit</h3><p>My team shows the last 5 seasons in one line and a list of needs tagged <strong>Fix now</strong> (red), <strong>Fix this summer</strong> (amber) or <strong>Minor</strong> (grey): rotation skills weaker than other teams (playmaking, shooting, rebounding, rim and perimeter defense, athleticism, inside scoring), bad offense or defense after 10 games, no young player projected as a starter, nobody or one player at a position, expiring, unhappy or aging top players, a roster that doesn't fit the coach, the tax, fewer than 13 players. Contenders get "now"; rebuilders "summer". A coach's page shows his systems, star, key players, clashes, roster fit (0% = worst of 12 system pairs for these players, 100% = best) and the player types he wants; hiring lists coaches by fit with your roster and the change from your current coach.</p>
  <h3>Favorites and the season review (v26.1)</h3><p>The season preview shows the top 5 for the title, MVP, DPOY, ROY, Sixth Man, MIP and COY with American odds (+350 = about 22%; longer than 100-1 shows +10000), from 1,000 simulations of the rest of the season. In season it uses the record so far and shows the preseason odds next to it. After the Finals a season review shows the champion, awards, Hall of Fame class, retired numbers and whether the preseason favorite won (reopen it from a season in History).</p>
  <h3>Contracts and the cap (v26.1)</h3><p>Cap ${money(CAP)} (soft), tax line ${money(TAXLINE)}, hard cap ${money(APRON)}. Every clause changes what a player asks for per year; the quote updates as you change them.</p>
  <table class="help-tbl"><tr><th>Feature</th><th>What it is</th><th>Cap effect</th><th>Ask</th></tr>
  <tr><td>Incentives</td><td>Up to 9 kinds (45+ games, 20+ ppg, All-Star, All-League, MVP, DPOY, playoffs, conference finals, title); total up to 25% of salary; paid in cash only if earned (end of regular season; conference finals and title after the playoffs).</td><td>A likely one (50%+ chance when signed) counts on the cap every season; an unlikely one doesn't.</td><td>He values each at amount × his chance of earning it.</td></tr>
  <tr><td>Trade kicker</td><td>5-15%. The first time he is traded his salary rises by that share for the rest of the deal (not above his max).</td><td>The new team takes the higher salary.</td><td>About −40% of the kicker (15% kicker ≈ 6% less).</td></tr>
  <tr><td>Early opt-out</td><td>On 3+ year deals: after year N he may leave (he does if he is worth 10%+ more and is 31 or younger).</td><td>None until used; then the rest comes off.</td><td>About 4% less.</td></tr>
  <tr><td>Partial guarantee</td><td>Only 25/50/75% of the final season is guaranteed.</td><td>Released early: dead money is the full salary up to the last season, then only the guaranteed share for that season.</td><td>Up to about 4.5% more (25%).</td></tr>
  <tr><td>Role promise</td><td>Starter (60%+ of games started) or a minutes target (20-32); judged weekly from 15 games, on games he was available.</td><td>None.</td><td>Starter ≈ 7% less for a player who might not start (less for sure starters; money-minded players care less, winners more).</td></tr>
  <tr><td>No-trade clause</td><td>For 75+ players with 7+ years or age 29+. He must approve each trade (contenders get a yes more often).</td><td>None.</td><td>5% less.</td></tr>
  <tr><td>Player / team option</td><td>Final year: player decides (PO) or team decides (TO).</td><td>Counts until declined.</td><td>PO 5% less, TO 5% more.</td></tr></table>
  <p><strong>Examples.</strong> A $20M player with $2M for 45+ games (75% likely) and $3M for a title (10%) has a $22M cap hit: the likely $2M counts, the title bonus doesn't, and he values the pair at about $1.8M. A $30M star with a 10% kicker traded in year 2 costs his new team $33M a year from then on. A $12M 33-year-old on 3 years with a 50% final-year guarantee, cut after year 1: $12M dead next season, then $6M the season after. A promised starter who starts 40% of his games: −12 morale, a falling-out with the coach, and −8 in his mood for the rest of that season (+2 while it is kept). AI teams use these too: kickers for stars with power agents, opt-outs for young stars, guarantees for older players, starter promises for players signed into a top-4 spot.</p>
  <h3>Draft picks: window, values, Stepien rule, swaps (v26.2-v26.4)</h3><p>Every team holds picks for this season and the next 6 drafts (14 picks). Value = slot points (#1 1000, #14 380, #15 300, #30 110, #31 100, #60 10) × class strength × doubt for years out (1, 0.9, 0.8, 0.74, then 0.55, 0.48, 0.42) × the team's pick taste (tank/rebuild 1.2, hopeful 1, contend 0.85) × its front office, on the rosters as they would be after the trade. Typical 1st by drafts out: about 440 / 290 / 300 / 260, then 150-195 from 4 drafts out (every team's far 1st looks alike); 2nds about 30-60. In a package the best asset counts 100%, then 80, 60, 40%. A tanking or rebuilding team values its <strong>own</strong> 1sts ×1.3 during its plan, so far 1sts won't buy its top pick. <strong>Protections</strong> (top-3/5/10 on a 1st): if it lands inside, it stays and the holder gets that team's next 1st (same protection, twice), then its 2nd. <strong>Stepien rule</strong>: no trade (yours, AI, three-team or draft-day) may leave a team without a 1st in two drafts in a row. <strong>Swaps</strong> (two-team trades): one side gives the other the right to swap 1sts in a chosen draft; both must own their own unprotected 1st; at the lottery the picks change hands only if the giver's is earlier. Picks tied to a swap can't be traded or protected. AI teams offer swaps to close small gaps.</p>

  <h3>Playstyles</h3><p>A playstyle is a label for what a player does best at his position, worked out from his ratings. It does not change a game by itself: the ratings do. It matters in three places. Coaches run an offensive system (Pace &amp; space, Inside-out, Motion, Star/isolation) and a defensive one (Switch everything, Rim protection, Pressure/trap); each changes pace, turnovers, shot mix, fouls and defense by shot type, and a player's System fit shows how well his ratings suit them. Lineup chemistry (My team) rewards shooting, rim protection and perimeter defense and penalizes lineups with too few shooters or too many players who need the ball. AI teams use playstyles to find roster needs in trades and free agency, and contract asks rise when few similar players are available.</p>
  <p class="muted"><strong>PG</strong> Defensive pest, Jumbo playmaker, Microwave scorer, Pass-first, Scoring, All-around, Shooting · <strong>SG</strong> Lockdown defender, Movement shooter, Shot creator, Shooter, Slasher, 3-and-D, Combo guard · <strong>SF</strong> Two-way wing, Athletic finisher, Scoring wing, 3-and-D wing, Slasher, Point forward, All-around · <strong>PF</strong> Rim runner, Small-ball four, Playmaking four, Stretch four, Post scorer, Rebounder/defender, All-around · <strong>C</strong> Playmaking hub, Rim runner, Mobile big, Rim protector, Post scorer, Stretch five, Rebounder</p>
  <h3>Games and chemistry</h3><p>Games are played possession by possession. Talent matters most, but so does fit: lineups without shooters get a cramped paint, too many players who need the ball hurts, missing rim protection or perimeter defense gives up easy shots, and players who fit the coach's systems play better. Big second-half leads tend to shrink as the leader relaxes and the trailing team pushes, so blowouts are rare. Every trade records each front office's view as a grade, and the reason, on the Trades page.</p>
  <h3>Scouting and the draft</h3><p>Until summer league (after free agency), a rookie's ratings are your scouting director's read, marked with a ? and a "Rookie · not final" tag. Each read has one over/under error for the player plus a smaller one for each skill group (scoring, playmaking, defense, athleticism), up to 10 points; better directors miss by less (about 2 for the best, 4–5 for the weakest), and scouting assignments sharpen the read. Height, weight, wingspan and age are exact. Other teams draft and trade on their own directors' reads, and the media's mock drafts are their own guess. You can fire or hire a director after the draft until the season starts; if the job is empty when the season starts, the front office hires one for you (never one of the best).</p>
  <h3>Contracts and demand</h3><p>Asking prices follow the market for a player's archetype: when many teams with room need one and few similar players are available, the price rises (up to 1.5× in free agency, 1.3× for re-signings and extensions, which look ahead to next summer); a crowded market lowers it (down to 0.85×). Offering a player's counter always gets a deal. A lowball offer (well under what he wants) raises his price a little, at most twice.</p>
  <h3>Free agency</h3><p>During the 10 days of free agency your offer is pending: it holds that much of your cap room while the player hears from other teams. Role players decide within 2 days and stars can wait up to 5. He doesn't simply take the most money: Money-first players mostly follow the money, Winners lean to contenders, Loyal players to their old team, Mentors to young teams, and everyone weighs role, market and family. If he picks another team he just signs there. If he'd rather play for you but your offer is short, he asks for a number; you have one day to accept, send a new offer or walk away. Teams can bid above the asking price, never above the max. Offers at the minimum, and signings during the season, are instant.</p>
  <h3>Rivalries and grudges</h3><p>A starter or star who is traded, an unhappy player who is released, or a good player who leaves on bad terms holds a grudge against that team for up to 2 seasons: in games against them he plays a little better (about 1.5 rating points) and looks for his shot more, and he's less keen to sign back there. The first meeting each season makes the news as a revenge game if he plays well (game score, rebounds, assists, steals and blocks, efficiency or plus/minus). A few prominent players (at most 8 pairs per league, one rival each) become rivals: stars at the same spot who meet in the playoffs or lead the same conference. Rivalries also start from award races (MVP, DPOY and Rookie of the Year winner vs runner-up), stars traded for each other, and a player who lost his minutes to a teammate. Draft-class rivals are a separate kind with their own limit (at most 4, one each): top-5 picks from the same draft at the same spot, once both start and are rated 70+. They last 3 seasons, renewed by another playoff meeting, with a smaller lift (about 1 point) when they meet and a head-to-head record on their pages. When you sim one day at a time you get a heads-up before these games.</p><p>Teams have rivals as well: a conference rival and an arch rival (both permanent) and a playoff rival, which is the team they have met most in the playoffs (2 or more series in the last 5 seasons, or 4 or more in the last 10) and can change. Rival games draw 6% to 9% more fans, and rival teams almost never trade with each other.</p>
  <h3>Restricted free agency</h3><p>Players coming off rookie deals (rated 60+) whose team doesn't re-sign them become restricted free agents. If one accepts another team's offer, it becomes an offer sheet and his old team has 2 days to match it on the same terms. If you hold his rights you get a prompt to match or let him go; if you made the offer, you'll hear whether his team matched.</p>
  <h3>Watch list, prospect tags and Needs attention</h3><p>Press ☆ Watch on any player or prospect (up to ${WATCH_MAX}) to follow him: he gets a ★ in every list, shows on My Team's Watch list tab, and you get a news alert when he's traded, put on the block, becomes a free agent, signs, is drafted, gets hurt long-term or jumps 3+ in overall. Tag draft prospects Target, Sleeper or Avoid from their page; you're told where your Targets went on draft night. Quick filters above the roster, trade, free agency and draft lists show only watched, tagged, expiring, injured, unhappy or young players. My Team's Needs attention panel lists what to act on: roster size, cap and tax, trade requests and unhappy players, offers waiting, expiring deals and extension windows, long injuries, young players without minutes, and news about your watch list and draft targets.</p>
  <h3>Deadline day and farewell tours</h3><p>Front offices spend the first weeks after trading opens evaluating their rosters and needs, so early deals are rare; calls pick up through the middle of the season and peak in the final two weeks. Most deals are for role players who fill a need; stars rarely move unless a rebuilding team sells, the player asks out, or he's on the block. The last day before the trade deadline is busier: rumors about who's being shopped and a burst of deals. The sim only stops for you if you have someone on the trading block or offers pending. Afterwards a recap lists every deal, buyers and sellers, the biggest name moved and which rumored players stayed. Some famous veterans (34+) announce their final season before it starts; they get a send-off in cities where they used to play and retire at season's end.</p>
  <h3>Supermax and mentors</h3><p>An MVP in the last 3 seasons, a DPOY in the last 2, or an All-League 1st Team or All-Defense 1st Team selection in the latest season unlocks one bigger contract per career: his current team can offer the next max tier (25% → 30% → 35% → 38% of the cap) and other teams can go halfway. During the season, players in the MVP or DPOY race bet on themselves: they only sign an extension at the max. If they win, the supermax opens up; if not, they come back at their real market value. From age 30, some veterans change: some start chasing a ring, some become Mentors who take less to lead young teams and help young players at their position develop a little, and a few want one last payday. Teams keep at most 2 Mentors.</p>
  <h3>Defensive Player of the Year</h3><p>The best perimeter defender guards the opponent's top perimeter scorer and the best big guards their top big. Defense is tracked by matchup: opponents' shooting against him compared with what those shots should go in at, contests, and defensive rating while he plays. All-Defense teams are 2 guards, 2 forwards and a center; the DPOY comes from the 1st Team and must play for a postseason team.</p>
  <h3>Shot zones and coach systems</h3><p>Every shot comes from a zone: dunks, lobs and putbacks at the rim; layups; paint shots (floaters, hooks, post moves); mid-range; and threes from the corners or above the break. Corner threes are a little easier, above-the-break threes a little harder. Help defense matters at the rim, so a strong shot-blocking team lowers everyone's finishing, not just the man guarding the shooter. Team and player pages show a half-court chart: red zones shoot better than league average, blue worse, and darker zones take more of the shots.</p>
  <p>Each system has a cost. Pace and space plays faster with more corner threes and transition but takes harder early-clock threes, turns it over more and grabs fewer offensive rebounds. Inside-out gets post-ups, lobs, putbacks, free throws and offensive rebounds but plays slower, shoots fewer threes and gets a crowded paint against rim protectors when it lacks shooters. Motion moves the ball for more assisted and catch-and-shoot looks, but low-IQ rosters turn it over more and it draws fewer fouls. Isolation feeds the star and draws fouls but assists less, and role players get fewer open looks. On defense, Switch takes away threes and pull-ups but gives up post mismatches and defensive rebounds; Rim protection lowers rim and paint shooting and free throws but gives up mid-range and above-the-break threes; Pressure forces turnovers and speeds the game up but gives up layups, open threes and fouls.</p>
  <p>True shooting (TS%) is judged by position, since bigs take easier shots: Elite is 62%+ for guards, 63%+ for SF, 64%+ for PF and 66%+ for C, with Very good, Good and Average bands 3 points apart below that.</p>
  <h3>Player development</h3><p>Playing time matters for players 23 and under: 24+ minutes a game speeds up growth noticeably, 16–24 a little, and under 8 slows it slightly. Rebuilding and tanking AI teams play their draft picks to hit on them: top-5 picks keep a big role (often starting) all season and a smaller one in year 2 if they're producing or improving; other 1st-rounders until the midseason review; 2nd-rounders get a season role (mostly end of the bench, sometimes bench minutes, now and then a start). Retooling teams give 1st-rounders bench minutes. A pick who clearly isn't producing loses part or all of that role. <strong>D-league:</strong> players in their first 3 seasons, and anyone barely playing, get a D-league game on days they don't play for the team; those minutes count half toward development (you can switch it off per player). Your own minutes are up to you (or your coach). Every player has a hidden development path: most get close to their potential, some boom and reach it, and some bust (a few even slide below where they started). Young players develop until about 24–27; athleticism starts to fade somewhere from 28 to 32 and skills a little later, so a player's type can change with age. Stars can carry a second type from 76 and a third from 84. The offseason review has a development report (breakouts, late bloomers, stalls, slides, declining veterans and type changes). Each season gets a yearbook on the History tab, comparing every team with its preseason prediction. Owners lose patience with long rebuilds, and very rarely sell the team. In Franchise Mode your GM profile tracks your career timeline and achievements, and the cartoon portraits are generated with the open-source facesjs library (Apache 2.0).</p>
  <h3>Fame and the All-Star Game</h3><p>Players build fame mostly through awards and All-Star selections (fading over time), plus scoring. Fame drives jersey sales and sponsor money, and famous free agents lean toward big markets, though a famous player is a bigger deal in a small market (more endorsements), stars like being the best player on a team, and players who want to win weigh the record over the market. Free agents sign for at most 4 years; only a player's own team can offer 5. Players from recent champions and finalists ask for more, rivals bid a little harder for them, and a champion's owner expects another Finals run. At about 55% of the season, fans vote in the All-Star starters (2 guards and 3 frontcourt players per conference) and reserves are picked on stats; ${L && L.nba ? 'East plays West' : 'North plays South'} (the game doesn't count in stats). Voting is live on the Awards tab.</p>
  <h3>Finances</h3><p>Teams earn ticket sales (arena capacity, ticket price and fan hype decide the crowd), playoff gates, media rights and merchandise, and pay player salaries (including minimum deals and dead money), coach and scouting director salaries, and any luxury tax. Sponsorship deals (2–3 seasons) pay more for bigger markets, fan hype, winning, playoff runs and star players; winning is worth the most to small markets, and sponsors add a playoff bonus each season. 20% of every team's ticket and merchandise money goes into a pool split evenly, and luxury tax is shared among teams under the tax line. Big markets earn more but can lose money by overspending; small markets need to win and fill the arena. Owners set a soft spending limit and a goal each season, and judge their GM on them; small-market owners accept modest losses, big-market owners expect a profit. Owners take out about 30% of each profit and anything above the franchise's cash cap ($120M big, $90M mid, $70M small market). Sponsor deals adjust a little each season with results. Each team page has a Finances tab with projections.</p>
  <h3>Salary cap and payroll floor</h3><p>Soft cap: ${money(CAP)} cap, ${money(TAXLINE)} tax line, ${money(APRON)} hard cap. Over the cap, teams can re-sign their own players, sign minimum deals, use the mid-level exception once a season (up to ${money(MLE)}, if they start under the tax line; it can take them over the line but not past the hard cap) and make salary-matched trades. Teams over the tax line pay tax and can't sign free agents above the minimum. Rookie deals count against the hard cap too. Until one week after the trade deadline (and again in the offseason) you can buy a player out instead of releasing him: he gives back part of what he's owed (more if he's a veteran, wants to win on a non-contender, or can earn it back elsewhere) and the rest stays as dead money unless another team signs him. Bought-out veterans usually sign cheaply with contenders. A team under the floor when the season starts pays the difference, and that charge counts on its payroll for the season, so it can't use that space in trades. Each team page shows a 5-year cap outlook. Hard cap ${money(CAP)} and payroll floor ${money(MINPAY)}. Teams under the floor shop harder in free agency; any team still under when the season starts pays the difference. Minimum contracts (${money(MINSAL)}) don't count against the cap. Maximum salaries: 25% of the cap for 0–6 years of service, 30% for 7–9, 35% for 10+. Re-signing a player you drafted on a ${money(10)}+ deal counts 90%. A ${money(10)}+ player out for the season counts 50% that season. A released player's salary (unless it's a minimum deal) stays on the cap as dead money until his deal would have ended, but it comes off the moment another team signs him.</p>
  <h3>Contracts</h3><p>Morale (minutes vs role, winning, pay, loyalty, coach fit, being shopped) moves weekly. Happy players re-sign at a discount; unhappy ones ask more, may refuse, and can request a trade. Players signed as free agents can't be traded until the 25% mark of the next season (14 days for in-season signings). In the re-signing window you can sign-and-trade an expiring player to a team he'd join. No player asks for more than the most he can legally be paid. Players also care about more than money: a good player who would be buried on your depth chart wants a premium or refuses, a win-first player asks more from a rebuilding team and won't sign with a tanking one, and money-first players won't take less than their ask or a team option. Each negotiation shows what the player cares about. Deals run 1–5 years. A deal of 2+ years can carry a team or player option on the final year. Player options are decided by the player at the start of the offseason (he opts out if he's worth more). Team options are decided by the team. Players in the last year of a deal that was originally 3+ years can be extended during the season until the trade deadline (70% mark); after that, every expiring contract goes to the offseason. A good player who signs well below his value only takes 1 year. Big-market teams and contenders attract free agents more easily, so small-market teams have to pay more. Honors add to a player's market value (MVP most, then DPOY, All-League and so on). Recent honors count most and old ones fade, so an aging former MVP still earns a bit more than a role player with the same rating, up to the maximum salary.</p>
  <h3>Draft</h3><p>${isBig(L) ? 'Lottery (30 teams): the 14 teams that miss the playoffs (10 non-playoff teams and the 4 play-in losers), worst record first, with NBA odds for the #1 pick: 14, 14, 14, 12.5, 10.5, 9, 7.5, 6, 4.5, 3, 2, 1.5, 1 and 0.5%. All 14 lottery picks are drawn the same way from the teams left; the 16 playoff teams pick 15–30 by record. ' : ''}Each team has a scouting director; his rating sets how accurate the team's potential estimates are (for prospects and young players): the best usually miss by 2–3 points, the weakest by about 6–7, and nobody misses by more than 10. Every player also has a hidden development path: some boom and reach their potential, most get close, and some bust well short; a good director can sometimes spot bust risk or a late bloomer. Draft classes vary: some are loaded, some deep but capped, some top-heavy with a few special talents, and some thin. He builds the team's draft board, and his profile (click his name) compares his projections with what his picks became. Three outlets publish mock drafts (Hoops Insider leans on production, The Upside Report on ceiling, Courtside Daily mocks team by team by needs); the consensus is the average of their ranks. Your board shows his take against all three and flags targets near your pick; you can reorder it, and auto-pick follows it. During the draft, the Draft tab shows every pick live next to your board. Coaches suggest trade and free-agent targets on those pages, and manage moods by giving a few extra minutes to unhappy players they want to keep (core rotation players, stars, good system fits, young talent on a rebuilding team); you can turn that off in your lineup settings. Picks can be traded during the draft, and teams trade up for players they love. After the draft you choose whether to sign each of your picks. AI teams nearly always sign first-rounders. Three future draft classes are visible with mock drafts. Next year's projections are fairly stable, two years out they can move, and three years out they are early guesses. Prospects rise and fall each year. Most top picks start in the 50s; rare prospects arrive at 60+, and a very rare one at 65–70. Some high-floor prospects never improve. Two rounds: the bottom five non-playoff teams draw for picks 1–5 (25/25/25/15/10%), the next non-playoff team picks 6th, the four play-in teams draw for 7–10, and playoff teams pick 11–16. First-rounders sign 3-year rookie deals. Teams choose whether to sign second-rounders, on 2-year minimum deals with a team option on year 2. Undrafted and unsigned picks become free agents.</p>
  <h3>Team status</h3><p>Front offices are reviewed twice a season, in the preseason (roster strength: ratings, coach-system fit, position balance, chemistry, health, star power and age) and at midseason before the deadline (about 55% this season's results and point differential, 45% roster strength). Teams are ranked league-wide and placed in bands (on a 30-team scale): 1–4 All-in (spend up to the hard cap, trade picks and young players for help), 5–8 Contender (up to the tax line, more for rich owners and big markets), 9–16 Push (a star or veterans close to contending: they buy instead of selling), Playoff hopeful or Retooling (aging or slipping, getting younger), 17–24 Rebuilding or hopeful, 25–30 Tanking (at most 20% of the league) or Rebuilding. Rebuilds run 2–3 seasons and tanks 1–2 (big markets 1). Midseason changes need a clear miss.</p>
  <h3>Locker room 2: suspensions, discipline, interviews, one-on-ones, promises</h3><p>A SUSP chip marks suspended players: they sit like injured ones and are not paid. Suspend your own player (1-5 games) from his page, or choose Suspend on a conduct issue. Fines go by salary: team fines add to your cash, league fines go to the league (League > Discipline lists leaders and recent fines and suspensions). Media interviews (opening week, before the deadline, first playoff game) stop the sim; your answers move hype, owner trust, media reputation and morale, and a title or playoff claim is checked at season's end. Use Meet on a player's page for a one-on-one; players also ask when unhappy, feuding, asking for a trade or rising. Promises you make (start, minutes, extension, trade, stay) are tracked in the Promises panel on My team: kept raises morale and trust, broken costs more.</p><h3>Team statuses: Rising, personality and minutes</h3><p>Rising teams are young and improving: they keep their young players and their own near 1sts and only take veterans on expiring deals. Statuses change by weighted odds, not a fixed rule, so a young team in playoff range might go Rising, Hopeful or back to a rebuild. Each front office also has a Patience and an Ambition rating (see the Front office tab) that nudge those odds: patient teams stay in a rebuild longer, ambitious teams start buying sooner. Status sets minutes: Rebuilding, Tanking and Rising teams play their players 24 and under more, and young players grow faster with minutes.</p>
  <h3>Front offices and trades</h3><p>Every front office marks players it's shopping (with a reason, shown on the Trades tab's trading block) and players it protects; protected players can't be traded. Teams value every remaining contract year: a bargain deal with years left is worth more, an overpaid long deal is a burden, and rebuilding teams like expiring contracts. Select your players and press Ask for proposals to hear what the league would give. Power rankings on the Standings tab update weekly from record, point differential, recent form and healthy roster strength. In Franchise Mode you can put players on the trading block (Shop) to draw offers, or Protect them so AI teams won't ask. Every AI offer explains why the team wants the deal. Each team is a Contender (top 4), Playoff hopeful, Rebuilding or Tanking team, reviewed at the 20%, 40% and 60% marks. A hyped draft class makes more bad teams tank. Trades are open in the offseason and from the 25% to the 70% mark of the regular season (the trade deadline). Sim day and Sim week stop at the deadline so you don't skip past it by accident. AI teams trade with each other and make offers to you, which they can withdraw. You can accept, decline or negotiate. As commissioner you can veto AI trades.</p>
  <h3>Coaches</h3><p>Coaches and scouting directors can be fired any time outside the playoffs, but the rest of their contract stays on the books and counts against the owner's staff budget, a hard limit on new hires. Firing a coach with 2+ years left also costs owner trust. A team that can't afford anyone promotes an assistant as interim coach. AI teams fire only after results fall short of expectations at two straight check-ins (20%, 40% and 60% of the season) or over a full season, give new coaches a season's grace, make at most one change a season, and only when the replacement fits the budget and is no worse. Coaches take a little less per year for longer deals. Coaches have offense, defense and development ratings, a potential, and systems that decide which player types a team wants. Young coaches improve and older ones decline and retire. Coaches sign contracts (amount and length) based on their overall, titles, Coach of the Year awards, playoff wins, career winning percentage and how their systems fit the roster. Coach pay sits outside the player cap; a fired coach is still paid through the end of his deal. Front offices judge coaches against what the roster was expected to do: most changes happen in the offseason, after a disappointing season, a run of them, or an expiring contract. Firing during the season is rare: only a team expected to make the playoffs that falls far below expectations and out of the race, and many seasons have none. In Franchise Mode you can fire your coach and hire a replacement any time outside the playoffs.</p>
  <h3>Playoffs</h3><p>${isBig(L) ? 'Top 6 per conference qualify. The play-in: 7 vs 8 (the winner is the 7 seed) and 9 vs 10, then the 7/8 loser hosts the 9/10 winner for the 8 seed. First round 1–8, 4–5, 2–7, 3–6, then conference semis, conference finals and the Finals. Every round is best of 7 (home games 1, 2, 5 and 7 for the higher seed).' : 'Top 3 per conference qualify. Seeds 4 and 5 play in: the 4 seed needs one win, the 5 seed two straight. Conference semifinals (1 vs play-in winner, 2 vs 3) and conference finals are best of 5. The Finals between conference champions are best of 7.'} Playoff games are more physical: a slightly slower pace, more fouls, tougher shots, and strength counts for more inside. Every player has a playoff consistency rating, set when he enters the league and never changed. Low ratings mean bigger swings from game to game and a small dip on average; high ratings mean steady or slightly better play.</p>
  <h3>Crossover players and training</h3><p>A few players are rare crossovers: a passing big, a rebounding guard, or a playmaking or rebounding wing. They show a tag on their page and pile up assists or rebounds well beyond their position. With no training focus set, a player grows toward his own style. A focus you pick stays until you change it or he changes teams, then he goes back to default (you get a Training check at season start).</p>
  <h3>Three-team trades</h3><p>On the Trades page you can bring a third team into a deal: pick the two other teams, then send each player or pick to the team you choose (anything left alone stays). Every team must send and receive something. Each AI team judges only its own side, with a slightly higher bar than a two-team deal, and checks roster size, salary matching, the hard cap and no-trade clauses for its own side. Rival teams won't swap players directly with each other, but can both deal with you. AI teams don't make three-team deals among themselves.</p><h3>Training focus</h3><p>Each summer, players grow toward a hidden ceiling (young players) or hold and then decline (veterans). A training focus doesn't change how much a player grows overall, it changes where it goes: shooting range, ball handling, playmaking, finishing, post game, perimeter defense, rim protection, rebounding, or conditioning (slows athletic decline). Focused work also adds a little to the focus skills in a player's prime, paid for by other skills. A big working on his shot can become a stretch five in 2–3 seasons, but free throws limit how far his three can climb (15 above his free throw rating). AI teams pick a focus for their players each summer; you set yours on the player page or the lineup panel.</p><h3>Late game</h3><p>Every coach has late-game habits (on his page): how early he sits players in foul trouble, whether he fouls when behind late (last 30 or 50 seconds, down 3–6 or 3–8, or down 1–2 once the shot clock is off), whether he hacks bad free-throw shooters (under 35 free throw) before the last two minutes, and how he uses his 7 timeouts (2 more per overtime). A team on the wrong end of a run may call timeout and runs a set play next time down (slightly better shot); in the last 24 seconds a team down 1–3 calls timeout to draw up a play. Leaders milk the clock, teams behind hurry, and a team about to be fouled puts its free-throw shooters on the floor. You can set your own team's habits on the lineup panel.</p><h3>Schedule and rest</h3><p>The 58-game season runs about 110 days: teams play 3–4 games a week with rest days in between, about 15% of games are the second night of a back-to-back, and nobody plays three days in a row. On the second night players are a little worse at both ends and a little more likely to get hurt. Coaches rest some players on those nights (older players, heavy-minutes players and injury-prone ones most, tanking teams the most); AI teams stop resting in the last two weeks unless they're tanking. Set your own team's load management on the lineup page.</p><h3>Injuries</h3><p>Injuries range from ankle sprains and illness (a game or two) to ACL and Achilles tears (50–80 games). Short injuries are far more common. Severe injuries can end careers, especially for older players. Injuries heal by the day, so rest days count, and players on teams out of the playoffs keep healing while the playoffs are on. Lengths are shown in games; the Injuries page (League tab) gives each player's expected return day. A minor injury (sprain, bruise, illness and the like, not concussions or hamstrings) with 2 games or less left makes a player day-to-day: a game-time call. If he plays he's playing hurt: a bit worse at both ends, fewer minutes, a higher injury risk, and a small chance he aggravates it and misses a few more games. Coaches play hurt players more in the playoffs and late in a playoff race, rarely when tanking or with young players. For your players you can leave it to the coach, tell him to play through it, or sit him (player page or Injuries page). Injuries heal partly over the offseason.</p>
  <h3>Agents</h3><p>Every agent has a style (tough, fair or loyal: how he negotiates) and a type. Power brokers (2-3, 40-60 clients each) represent most of the stars; asks run a bit high, their stars may hold out, and they steer clients toward their favorite teams and away from teams they are feuding with. Mid-size agencies carry 15-35 clients. Boutique agents (5-15) give close attention: fewer holdouts, and they care more about a clear role and fit than the last dollar. Rookie/youth specialists (10-25) sign most top-10 picks, push for rookie extensions a year early and give about 5% off the first extension. Agents under their range pick up new clients (draftees first); a new agency opens when the league outgrows the ones it has. The agent's page and the "Why his ask is what it is" box show both.</p>
  <h3>Draft classes and names</h3><p>About a quarter of each class is 18-20, about 40% is 21-22 and the rest 23-24. Age matters a lot for the ceiling: 23-24 year olds are more ready but mostly top out as role players and are rarely lottery picks; the top prospects are mostly 18-20, and mock drafts and boards weigh youth. ${L && L.nba ? 'New players (drafts, free agents) are mostly American and European; nationality' : 'New players (future classes and new leagues) are about 50% from English-speaking countries and Europe, 30% Filipino and 20% from South America and the rest of Asia; nationality'} and hometown follow the name. Players already in a league keep their names.</p>
  <h3>Shooting</h3><p>Free throws: about 50% at a 30 rating, 64% at 50, 81% at 75 and about 90% at 90; guards shoot best, centers worst, with a wider spread among bigs (and a few guards and wings who can't shoot them). A typical season has 8-15 regular free-throw shooters under 60%. Shot mix: about 40% threes, 30% at the rim, 17% elsewhere in the paint and 12% mid-range. Hack-a-player comes in short spells (2-4 trips) late in the 2nd quarter or in the 4th (not the last 2 minutes), only against shooters around 55% or worse, and stops when he sits or the gap grows.</p>
  <h3>Play types and coverages</h3><p>Every half-court possession runs a play from the coach's playbook: pick-and-roll (handler or roll man), pick-and-pop, isolation, post-up, spot-up, off-screen, handoff, cut, horns or a post-entry kick-out, plus transition. The playbook comes from the offensive system and who is healthy; yours can be adjusted with sliders on the Roster tab. Late in games teams run sets: after-timeout plays (sideline/baseline inbounds, an inbound lob), a closer isolation, a stagger for the best shooter when they need a 3, 2-for-1s and holding for the last shot. Defenses pick a pick-and-roll coverage (drop, switch, hedge, blitz, ice), each with trade-offs: drop gives up pick-and-pop threes, blitz forces turnovers but leaves the roll man and cutters, switching invites isolations and post-ups. At timeouts and quarter breaks a defense can change coverage against the play hurting it, double a hot post scorer or put its best defender on a hot scorer; sharper coaches react sooner and better. In a playoff series the adjustments carry over. Effects are small: talent decides most games. Points per possession by play type are on My Team → Play types and on player pages.</p>
  <h3>Live play-by-play</h3><p>Your team's games keep a play-by-play this season. "Sim day & watch live" (or Watch live on a box score) replays it at 1x, 2x, 4x, 16x or instantly, with a scoreboard, team fouls, timeouts and a running box score; the last 5 minutes of a game within 5 are tagged Clutch, and defensive adjustments appear in the feed. It is the same game as the box score. Filters: all, scoring plays, close and late.</p>
  <h3>Awards, history and honors</h3><p>Voted awards go to the vote winner; a tie breaks on first-place votes, then the award score, and the popup says so. All-Rookie teams take rookies who played at least 40% of the games. Stat leaders and the Stats tab only list qualified players: at least half of their team's games so far (after 10 team games, 5 games), plus enough attempts for percentages. The MVP and the other winning-weighted awards give near-full credit to the top 6 teams by record. MVP, Defensive Player of the Year and the All-League and All-Defense teams weigh winning; an MVP almost always comes from a top-3 seed. Rookie of the Year, Sixth Man, Most Improved and stat titles don't. Box plus-minus (BPM) estimates a player's impact per 100 possessions from the box score, split into offense (OBPM) and defense (DBPM). Player pages highlight stats a player led the league in, and the feats tracker counts milestone games (30+ points, double-doubles and so on). The Awards tab shows the live top-10 race for MVP, Defensive Player of the Year, Rookie of the Year, Sixth Man, Most Improved and Coach of the Year. Awards require 40 games played. Winners are announced when the regular season ends and saved in the History tab, along with each team's history on its team page. The Hall of Fame needs ${HOF_MIN} legacy points: production from strong regular seasons and playoff runs plus award points (MVP 150, Finals MVP 70, DPOY 60, All-League 1st 45, less for others, 25 per title). It also needs star credentials: 3+ All-Star selections, an MVP, Finals MVP, DPOY or All-League 1st Team, or 2+ All-League 2nd Teams. Retired players with enough points enter the Hall of Fame, and teams retire the numbers of long-time stars. Rivalries grow from geography, playoff series and close games.</p></section>`;
}
// ---------- setup ----------
function vSetup(note) {
  const s = ui.setup;
  const size = s.size === 16 ? 16 : 30, g = [58, 66, 82].includes(s.games) ? s.games : 82;
  const nba = !!s.nba && typeof NBA26 !== 'undefined';   // v27: real NBA 2026-27
  const fake = nba ? { nba: 1, teams: Object.keys(NBA26).map((ab, i) => { const d = NBA26[ab]; return { id: i, city: d.city, name: d.name, abbr: ab, region: d.div, conf: d.conf === 'East' ? 'North' : 'South', c1: d.colors[0], c2: d.colors[1], logo: '' }; }), mode: 'commish' }
    : { teams: leagueDefs(size).map((d, i) => ({ id: i, city: d[0], name: d[1], abbr: d[2], region: d[3], conf: confOfDef(d), c1: d[4], c2: d[5], logo: d[6] })), mode: 'commish' };
  if (s.team >= size) s.team = 0;
  const keep = L; L = fake; for (const k in logoCache) delete logoCache[k];
  const html = `<section class="panel" style="max-width:980px;margin:0 auto"><h2>New league</h2>${note ? `<div class="note">${note}</div>` : ''}<p>${nba ? `${NBA_TEXT.setup} A ${g}-game season.` : size === 30 ? `Thirty teams in two conferences of 15: the 16 Philippine teams plus 14 from capital cities around the region. A ${g}-game season. Top 6 per conference make the playoffs; seeds 7–10 play in.` : `Sixteen teams in two conferences: North (Luzon) and South (the Visayas and Mindanao). ${g}-game seasons. Top 3 per conference make the playoffs; seeds 4–5 play in.`} ${nba ? '' : 'Every player starts new to the league, on contracts based on his rating.'}</p>
  <h3>League</h3><div class="choice"><button data-setnba="0" class="${!nba ? 'on' : ''}"><strong>Pacific Basketball League</strong><br><span class="muted">Fictional league, generated players</span></button><button data-setnba="1" class="${nba ? 'on' : ''}"><strong>NBA 2026-27</strong><br><span class="muted">Teams, rosters, contracts and coaches as of Nov 2026. East / West, 6 divisions, play-in 7–10</span></button></div>
  ${nba ? '' : `<div class="choice"><button data-setsize="30" class="${size === 30 ? 'on' : ''}"><strong>30 teams</strong><br><span class="muted">Philippines plus 14 capital cities in the region</span></button><button data-setsize="16" class="${size === 16 ? 'on' : ''}"><strong>16 teams (classic)</strong><br><span class="muted">The original Philippine league</span></button></div>`}
  <h3>Season length</h3><div class="choice">${[[82, 'Full season', 'The default. About 156 days, a little slower to sim.'], [66, 'Medium', 'A shorter season with the same rules.'], [58, 'Short (classic)', 'The original length.']].map(([n, nm, d]) => `<button data-setgames="${n}" class="${g === n ? 'on' : ''}"><strong>${n} games</strong> <span class="muted">· ${nm}</span><br><span class="muted">${d}</span></button>`).join('')}</div>
  <div class="choice"><button data-setmode="commish" class="${s.mode === 'commish' ? 'on' : ''}"><strong>Commissioner</strong><br><span class="muted">Watch the league run itself. You can review and veto AI trades.</span></button>
  <button data-setmode="team" class="${s.mode === 'team' ? 'on' : ''}"><strong>Franchise Mode</strong><br><span class="muted">Run one team: set lineups, trade, sign and release players, draft, and hire or fire your coach. The AI runs the other ${size - 1} teams.</span></button></div>
  ${s.mode === 'team' ? `<h3>Pick your team</h3>${['North', 'South'].map(c => `<p class="k" style="margin:12px 0 6px">${nba ? (c === 'North' ? 'East' : 'West') : c} conference</p><div class="teamgrid">${fake.teams.filter(t => t.conf === c).map(t => `<button class="teampick ${s.team === t.id ? 'on' : ''}" data-setteam="${t.id}">${logo(t.id, 34)}<span>${esc(t.city)}<br><strong>${esc(t.name)}</strong><br><span class="muted">${nba ? esc(t.region) : `${t.region === 'Luzon' || t.region === 'Visayas' || t.region === 'Mindanao' ? '' : esc(t.region) + ' · '}${MARKET_LABEL[MARKET[t.abbr]]}`}</span></span></button>`).join('')}</div>`).join('')}` : ''}
  ${s.mode === 'team' ? `<div class="row" style="margin-top:14px"><label>Your name (general manager) <input id="gmname" maxlength="40" placeholder="You" value="${esc(s.gmName || '')}" style="min-width:220px"></label></div>` : ''}
  <div class="row" style="margin-top:18px"><button class="primary" id="create">Create league</button>${ui.prevL ? '<button id="setup-cancel">Cancel</button>' : ''}</div><p class="muted" style="font-size:12px">A new league gets its own save. Your other saves stay under Saves.</p></section>`;
  L = keep; for (const k in logoCache) delete logoCache[k];
  return html;
}

document.addEventListener('input', e => { if (e.target && e.target.id === 'gmname') ui.setup.gmName = e.target.value; });
const meName = () => L.me && L.me.name && L.me.name !== 'You' ? L.me.name : 'You';
// ===== v30 T: Season to-do list (franchise mode only; nothing in commissioner mode or during autopilot) =====
// State in L.todo = { stop, s, tick{}, hide{}, seen{}, toast{}, stopped{}, fold }. Season fields reset when L.season changes; `stop` (the sim-stop setting) is kept.
const TODO_GROUPS = [['start', 'Season start'], ['early', 'Early season'], ['mid', 'Mid-season to the trade deadline'], ['late', 'Deadline to the end of the regular season'], ['po', 'Playoffs'], ['off', 'Offseason']];
const todoOn = () => !!(L && L.mode === 'team' && L.user != null && !L.jobless && !L.auto && !ui.auto && !ui.setupOpen && L.schedule && L.schedule.length);
function todoState() {
  const T = L.todo || (L.todo = { stop: false });
  if (T.s !== L.season) { T.s = L.season; T.tick = {}; T.hide = {}; T.seen = {}; T.toast = {}; T.stopped = {}; }
  return T;
}
function todoSeen(k) { if (todoOn()) todoState().seen[k] = 1; }
function todoGroup() {
  const ph = L.phase; if (ph === 'playoffs') return 'po'; if (ph === 'regular-done') return 'late';
  if (ph !== 'regular') return 'off';
  const dl = deadlineDay(L), e = Math.max(1, Math.min(21, dl - 1)), s = Math.max(1, Math.min(7, e - 1));
  return L.day < s ? 'start' : L.day < e ? 'early' : L.day < dl ? 'mid' : 'late';
}
function todoPromiseRisk() {   // open promise to your players that falls due within 14 days / 10 team games
  const t = L.teams[L.user];
  return (L.promises || []).some(pr => pr.tid === L.user && pr.st === 'open' && pr.due && ((pr.due.day != null && pr.due.s === L.season && pr.due.day - L.day <= 14) || (pr.due.g != null && pr.due.s === L.season && pr.due.g - (t.w + t.l) <= 10)));
}
function todoUnhappy(top) {
  const t = L.teams[L.user], ps = top ? rotationOf(L, t).slice(0, 5) : teamPlayers(L.user);
  return ps.some(p => (p.morale != null && p.morale < 40) || p.tradeReq === L.season);
}
function todoExtOpen() {
  const t = L.teams[L.user], core = rotationOf(L, t).slice(0, 10);
  return teamPlayers(L.user).some(p => p.contract && canExtend(L, p) && !signConcerns(L, p, t, 'extension').refuse && (p.contract.exp === L.season ? core.includes(p) : p.contract.exp > L.season));
}
function todoGo(h, pre) { return () => { if (pre) pre(); if (location.hash === '#' + h) { ui.player = null; ui.game = null; ui.coach = null; ui.team = null; render(); window.scrollTo(0, 0); } else location.hash = '#' + h; }; }
const todoLineup = () => { ui.mtab = 'roster'; ui.twin = Object.assign({}, ui.twin, { rot: 'Lineup & rotation' }); };
const todoRoster = () => { ui.mtab = 'roster'; };
function todoItems() {
  const t = L.teams[L.user], T = todoState();
  const I = [];
  const add = (g, id, tx, why, go, o) => I.push(Object.assign({ id, g, t: tx, why, go }, o || {}));
  // 1. Season start
  add('start', 's1a', 'Check your roster, your coach\'s style and fit, and his targets', 'The coach report shows how well the roster fits his system and who clashes with him.', () => { backStack.push(snapNow()); ui.coach = t.coach && t.coach.id; ui.player = null; ui.game = null; render(); window.scrollTo(0, 0); });
  add('start', 's1b', 'Check your power ranking and preseason odds', 'Weekly report and Season preview show where you rank and what the odds say.', todoGo('weekly'));
  add('start', 's1c', 'Pick draft prospects to watch (3+ on the watch list)', 'Watched prospects get news alerts and show first on the draft board. Also send scouts on assignments.', todoGo('draft'), { auto: () => watchList(L).filter(p => p.prospect).length >= 3 });
  add('start', 's1d', 'Read the owner\'s goal and your team status', 'Front office tab: the owner goal decides how safe your job is.', todoGo('myteam', () => { ui.mtab = 'office'; }));
  add('start', 's1e', 'Set training focus for players 25 and under', 'Focus decides where growth goes each summer. Done once every young player has one, or you confirm the Training check.', () => trainCheckDialog(), { auto: () => !!T.seen.train || teamPlayers(L.user).filter(p => !p.prospect && p.age <= 25).every(p => !!p.focus) });
  add('start', 's1f', 'Set rotation, minutes, load management, playbook and coverage', 'Lineup & rotation panel. Ticks itself once you open it.', todoGo('myteam', todoLineup), { auto: () => !!T.seen.lineup });
  add('start', 's1g', 'Mark up to 4 core players and your untouchables', 'Core players are protected from AI trade asks and drive the front office view.', todoGo('myteam', todoRoster), { auto: () => teamPlayers(L.user).some(p => p.core) });
  add('start', 's1h', 'Extensions: decide on players who can extend now', 'Needs attention lists them. Ticks itself when nobody willing is left to extend.', todoGo('myteam', todoRoster), { auto: () => !todoExtOpen() });
  add('start', 's1i', 'Roster legal: 13-15 players, both two-way slots filled', 'Under 13 or over 15 stops the season from starting.', todoGo('myteam', todoRoster), { auto: () => !userRosterProblem(L) && twOf(L, t).length >= TW_MAX, star: true });
  add('start', 's1j', 'Locker room check: harmony, unhappy players, open one-on-ones', 'Ticks itself when harmony is out of the red and no issue, meeting or unhappy player is open.', todoGo('myteam', todoRoster), { auto: () => !dramaOpen(L) && !mtgOpen(L) && !todoUnhappy(false) && lrOf(t).v >= 45 });   // v36d: harmony too (red bar under 45)
  // 2. Early season
  add('early', 's2a', 'Review lineup chemistry and the first 10 games\' play types / coverage', 'Chemistry and Play types tabs show what works early.', todoGo('myteam', () => { ui.mtab = 'plays'; }));
  add('early', 's2b', 'Check unhappy players and promises at risk', 'Promises panel. Ticks itself when none is due within 14 days or 10 games.', todoGo('myteam', todoRoster), { auto: () => !todoPromiseRisk() && !todoUnhappy(false) });
  add('early', 's2c', 'Check pipeline stock: risers and fallers for your watch list', 'College, EABL and APBA stock moves change draft boards.', todoGo('pipeline'));
  // 3. Mid-season
  add('mid', 's3a', 'Decide buyer or seller: record vs owner goal and power ranking', 'Decide before the deadline: contend, hold or sell.', todoGo('weekly'), { star: true });
  add('mid', 's3b', 'Review the trade block, rumors and offers; pick protections, cash room, Stepien rule', 'Trades tab.', todoGo('trades'));
  add('mid', 's3c', 'Check the "Re-sign before season end" list', 'Players with expiring deals walk in free agency; extensions close at the deadline.', todoGo('myteam', todoRoster));
  add('mid', 's3d', 'Injury report: long injuries, call-ups from EABL / APBA if short-handed', 'Injuries tab.', todoGo('injuries'));
  add('mid', 's3e', 'Deadline interview (open now)', 'Your answers are checked against the season at the end.', () => runDialog(ivDialog), { auto: () => !ivOpen(L), star: true, show: () => !!ivOpen(L) });
  add('mid', 's3f', 'Trade deadline day', 'Ticks itself when the deadline passes.', todoGo('trades'), { auto: () => L.phase !== 'regular' || L.day >= deadlineDay(L) });
  // 4. After the deadline
  add('late', 's4a', 'Buyout market / free agents / two-way conversions to fill holes', 'Free agency tab.', todoGo('fa'));
  add('late', 's4b', 'Playoff push or tank: load management for stars, minutes for young players', 'Lineup & rotation panel.', todoGo('myteam', todoLineup));
  add('late', 's4c', 'Incentives and role promises close to being met or broken', 'Promises panel.', todoGo('myteam', todoRoster));
  add('late', 's4d', 'Award races you care about (MVP, ROY, MIP for your players)', 'Awards tab.', todoGo('awards'));
  // 5. Playoffs
  add('po', 's5a', 'Check the matchup and set coverage / adjustments for the series', 'Standings shows the bracket; Lineup panel has coverage.', todoGo('standings'));
  add('po', 's5b', 'Press conference / interview answers', 'Open when a press conference is waiting.', () => { if (pressActive()) runDialog(pressDialog); else location.hash = '#news'; }, { auto: () => !pressActive() });
  // 6. Offseason
  add('off', 's6a', 'Season review: owner review, goal met or missed, awards, Hall of Fame', 'Ticks itself when you open the review.', () => seasonReviewDialog(L.season), { auto: () => !!T.seen.review });
  add('off', 's6b', 'Lottery: check your pick position and resolved swaps / protections', 'Draft tab.', todoGo('draft'));
  add('off', 's6c', 'Draft: big board, mocks, pipeline stats, trade up / down, two-way choices for 2nd-rounders', 'Prospects you skip go to the AI.', todoGo('draft'), { star: true });
  add('off', 's6d', 'Re-sign: free agents, player / team options, qualifying offers, rookie extensions', 'Players not re-signed walk. Undecided options are exercised when free agency opens.', todoGo('myteam', todoRoster), { star: true });
  add('off', 's6e', 'Coach and staff: keep, fire or hire (coach fit list)', 'Staff & GMs tab.', todoGo('coaches'));
  add('off', 's6f', 'Free agency: cap room, owner limit, targets that fit, mid-level exception; roster back to 13+', 'Free agency tab.', todoGo('fa'), { star: true });
  add('off', 's6g', 'Development report: who grew, who dropped; reset training focus', 'Training check.', () => trainCheckDialog());
  add('off', 's6h', 'Before the new season: roster 13-15, no unhappy-star surprises', 'Ticks itself when the roster is legal and no top-5 player is unhappy.', todoGo('myteam', todoRoster), { auto: () => !userRosterProblem(L) && !dramaOpen(L) && !todoUnhappy(true), star: true });
  return I;
}
const todoDone = it => { const T = todoState(); return !!T.tick[it.id] || (it.auto ? it.auto() === true : false); };
function todoList(g) { const T = todoState(); return todoItems().filter(it => (!g || it.g === g) && (!it.show || it.show())).map(it => Object.assign({}, it, { done: todoDone(it), hidden: !!T.hide[it.id] })); }
function todoOpenCount(g) { return todoList(g || todoGroup()).filter(x => !x.done && !x.hidden).length; }
function todoStarOpen(upTo) { const order = TODO_GROUPS.map(x => x[0]), lim = order.indexOf(upTo); return todoList().filter(x => x.star && !x.done && !x.hidden && order.indexOf(x.g) <= lim); }
function todoPanel() {
  if (!todoOn()) return '';
  const T = todoState(), g = todoGroup(), gi = TODO_GROUPS.findIndex(x => x[0] === g), all = !!ui.todoAll, showH = !!ui.todoHid;
  const items = todoList(all ? null : g), hid = items.filter(x => x.hidden).length, open = items.filter(x => !x.done && !x.hidden).length;
  const nDone = items.filter(x => x.done && (showH || !x.hidden)).length, vis = items.filter(x => (showH || !x.hidden) && (ui.todoDone || !x.done));   // v28.7 U1: done items fold away
  const row = it => `<div class="todo-row${it.done ? ' done' : ''}${it.hidden ? ' hid' : ''}" data-todo-id="${it.id}"><label class="todo-chk" title="${it.auto ? (it.auto() === true ? 'Done: the game checked it' : 'Ticks itself when done. You can tick it too.') : 'Tick when you have done it'}"><input type="checkbox" data-todo-tick="${it.id}" ${it.done ? 'checked' : ''} ${it.auto && it.auto() === true && !T.tick[it.id] ? 'disabled' : ''} aria-label="${esc(it.t)}"></label><a class="todo-t lk" data-todo-go="${it.id}" title="${esc(it.why || '')} (click to open)">${it.star ? '<span class="todo-star" title="Starred: the sim can stop for these">★</span> ' : ''}${esc(it.t)}${it.auto ? ' <span class="muted todo-auto">(auto)</span>' : ''}</a><button class="todo-x" data-todo-hide="${it.id}" title="${it.hidden ? 'Show this item again' : 'Hide this item for the season'}" aria-label="${it.hidden ? 'Unhide' : 'Hide'}">${it.hidden ? '↺' : '✕'}</button></div>`;
  const grp = gk => { const rows = vis.filter(x => x.g === gk); return rows.length ? `<div class="todo-g"><strong>${esc(TODO_GROUPS.find(x => x[0] === gk)[1])}</strong>${rows.map(row).join('')}</div>` : ''; };
  const body = all ? TODO_GROUPS.map(x => grp(x[0])).join('') : grp(g);
  const doneLk = nDone ? `<p style="margin:4px 0 0;font-size:12px"><a class="lk" data-tododone="1">${ui.todoDone ? 'Hide done' : `Show done (${nDone})`}</a></p>` : '';
  return `<section class="panel todo" id="todo"><h3 class="todo-h"><span>Season to-do · ${esc(TODO_GROUPS[gi][1])}</span><span class="pill ${open ? 'hot-seat' : 'pos'}" title="Open items in this phase">${open ? open + ' open' : 'All done'}</span><button class="sm" data-todo-fold="1">${T.fold ? 'Show' : 'Hide list'}</button></h3>${T.fold ? '' : `${body || (nDone ? '<p class="muted" style="margin:0">All done in this phase.</p>' : '<p class="muted" style="margin:0">Nothing to do in this phase.</p>')}${doneLk}
  <details class="todo-opts"><summary>Options</summary><div class="todo-foot"><label><input type="checkbox" id="todo-stop" ${T.stop ? 'checked' : ''}> Stop the sim 3 days before the trade deadline and in the last week of the season if a ★ item is open</label><span><button class="sm" data-todo-all="1">${all ? 'This phase only' : 'All phases'}</button>${hid ? ` <button class="sm" data-todo-hidden="1">${showH ? 'Hide hidden' : 'Show hidden (' + hid + ')'}</button>` : ''}</span></div></details>`}</section>`;
}
function todoChip() {
  let c = document.getElementById('todochip'); const fc = $('#fchip');
  if (!todoOn()) { if (c) c.hidden = true; return; }
  if (!c) { c = document.createElement('a'); c.id = 'todochip'; c.className = 'fchip lk todochip'; c.href = '#myteam'; fc.insertAdjacentElement('afterend', c); }
  const n = todoOpenCount(), star = todoStarOpen(todoGroup()).some(x => x.g === todoGroup());
  c.hidden = false; c.className = 'fchip lk todochip' + (n ? ' open' : ''); c.title = n ? `${n} open to-do item${n > 1 ? 's' : ''} this phase${star ? ' (a ★ item is open)' : ''}` : 'To-do list: all done this phase';
  c.innerHTML = `<strong>To-do ${n ? n : '✓'}</strong>${star ? '<span class="todo-star">★</span>' : ''}`;
}
function todoToast(msg) {
  if (popupBusy() || document.getElementById('p3-story')) { clearTimeout(todoToast.w); todoToast.w = setTimeout(() => { if (L) todoToast(msg); }, 700); return; }   // F1: wait for popups / story cards / a live game
  let b = document.getElementById('todotoast'); if (!b) { b = document.createElement('div'); b.id = 'todotoast'; b.setAttribute('role', 'status'); document.body.appendChild(b); }
  b.innerHTML = `<span>${esc(msg)}</span> <button class="sm primary" data-todo-open="1">Open to-do</button> <button class="sm" data-todo-x="1" aria-label="Dismiss">✕</button>`; b.hidden = false;
  clearTimeout(todoToast.t); todoToast.t = setTimeout(() => { b.hidden = true; }, 9000);
}
function todoTick() {   // called from render(): lineup-seen flag + reminders (once each per season)
  if (!todoOn()) { const b = document.getElementById('todotoast'); if (b) b.hidden = true; return; }
  const T = todoState(), g = todoGroup();
  if (ui.view === 'myteam' && ui.player == null && ui.coach == null && ui.game == null && !['history', 'fin'].includes(ui.teamTab) && !['office', 'cap', 'shoot', 'rivals', 'games', 'plays', 'watch'].includes(ui.mtab) && (ui.twin || {}).rot === 'Lineup & rotation') T.seen.lineup = 1;   // v36d: only when the Roster tab (where the panel is) is showing
  if (ui.busy) return;
  const first = !T.toast[g]; T.toast[g] = 1;
  if (L.phase === 'regular') {
    const dl = deadlineDay(L), last = L.schedule.length - 7;
    if (!T.toast.dl && L.day >= dl - 3 && L.day < dl) { T.toast.dl = 1; const k = todoStarOpen('mid').length; todoToast(`Trade deadline in ${dl - L.day} day${dl - L.day > 1 ? 's' : ''}${k ? ': ' + k + ' ★ item' + (k > 1 ? 's' : '') + ' open' : ''}`); return; }
    if (!T.toast.last && L.day >= last) { T.toast.last = 1; todoToast('Last week of the regular season'); return; }
  }
  if (first) { const n = todoOpenCount(g); if (n) todoToast(`${TODO_GROUPS.find(x => x[0] === g)[1]}: ${n} to-do item${n > 1 ? 's' : ''} open`); }
}
// optional sim stop: 3 days before the deadline and at the start of the last regular-season week, only when a ★ item is open
function todoStopEnd(end) {
  ui.todoStopAt = null;
  if (!todoOn() || !todoState().stop || L.phase !== 'regular') return end;
  const T = todoState(), dl = deadlineDay(L), stops = [[Math.max(1, dl - 3), 'dl', 'mid'], [Math.max(1, L.schedule.length - 7), 'last', 'late']];
  for (const [d, k, up] of stops) if (d > L.day && d < end && !T.stopped[k] && todoStarOpen(up).length) { ui.todoStopAt = { d, k, up }; return d; }
  return end;
}
function todoStopNotice() {
  const s = ui.todoStopAt; if (!s) return; ui.todoStopAt = null;
  if (!todoOn() || L.phase !== 'regular' || L.day < s.d) return;
  const T = todoState(); T.stopped[s.k] = 1; const open = todoStarOpen(s.up);
  if (!open.length) return;
  queueDialog(() => { dialog(`<h2>Sim paused: to-do</h2><p>${s.k === 'dl' ? 'The trade deadline is 3 days away.' : 'The last week of the regular season starts.'} ${open.length} starred item${open.length > 1 ? 's are' : ' is'} still open:</p>${open.map(x => `<div class="leader" style="grid-template-columns:minmax(0,1fr)"><span>★ ${esc(x.t)}</span></div>`).join('')}<div class="row" style="margin-top:10px"><button class="primary" id="td-open">Open my to-do</button><button id="x-close">Keep simming</button></div>`); $('#x-close').onclick = closeDialog; $('#td-open').onclick = () => { closeDialog(); todoOpenPanel(); }; });
  save();
}
function todoOpenPanel() { const T = todoState(); T.fold = false; ui.mtab = ui.mtab || 'roster'; ui.teamTab = 'overview'; ui.player = null; ui.coach = null; ui.game = null; if (location.hash === '#myteam') render(); else location.hash = '#myteam'; setTimeout(() => { const e = document.getElementById('todo'); if (e) e.scrollIntoView({ block: 'start' }); }, 60); }
document.addEventListener('click', e => {
  const q = s => e.target.closest(s); if (!L || !todoOn()) return;
  const T = todoState(); let a;
  if ((a = q('[data-todo-open]'))) { const b = document.getElementById('todotoast'); if (b) b.hidden = true; todoOpenPanel(); return; }
  if (q('[data-todo-x]')) { document.getElementById('todotoast').hidden = true; return; }
  if (q('#todochip')) { e.preventDefault(); todoOpenPanel(); return; }
  if ((a = q('[data-todo-go]'))) { const it = todoItems().find(x => x.id === a.dataset.todoGo); if (it) it.go(); return; }
  if ((a = q('[data-todo-hide]'))) { const id = a.dataset.todoHide; if (T.hide[id]) delete T.hide[id]; else T.hide[id] = 1; save(); render(); return; }
  if (q('[data-todo-fold]')) { T.fold = !T.fold; save(); render(); return; }
  if (q('[data-todo-all]')) { ui.todoAll = !ui.todoAll; render(); return; }
  if (q('[data-todo-hidden]')) { ui.todoHid = !ui.todoHid; render(); return; }
});
document.addEventListener('change', e => {
  if (!L || !todoOn()) return; const T = todoState();
  if (e.target.matches('[data-todo-tick]')) { const id = e.target.dataset.todoTick; if (e.target.checked) T.tick[id] = 1; else delete T.tick[id]; save(); render(); }
  else if (e.target.id === 'todo-stop') { T.stop = e.target.checked; save(); }
});
// ---------- v30b #7: ticker (news, stats, rumors) ----------
// News = the latest league log lines; stats = live league leaders and last night's top game; rumors = real front-office state
// (teams shopping players, players asking out). Rebuilt only when the league changes, so the scroll does not restart on every redraw.
let tkKey = '', tkOff = false; try { tkOff = localStorage.getItem('pbl-tk-off') === '1'; } catch (e) { }
function tickerItems() {
  const items = [], cap = t => t.length > 150 ? t.slice(0, 147) + '…' : t, nm = p => shortName(p), ab = id => L.teams[id] ? L.teams[id].abbr : '';
  const NC = ['trade', 'tx', 'award', 'feat', 'feature', 'coach', 'draft', 'league', 'story', 'team'];
  { let n = 0; for (const x of L.log) { if (n >= 8) break; if (NC.includes(x.cat)) { items.push({ k: 'news', t: cap(x.text), tid: x.tid }); n++; } } }
  { let n = 0; for (const x of L.log) { if (n >= 2) break; if (x.cat === 'inj') { items.push({ k: 'news', t: cap(x.text), tid: x.tid }); n++; } } }
  // stats
  const key = L.phase === 'playoffs' && L.po ? 'po' : 'rs';
  const ps = Object.values(L.players).filter(p => p.team != null && !p.retired && p.stats && p.stats[key] && p.stats[key].gp > 0 && isQual(p, key));
  const lead = (fn, txt) => { let b = null, bv = -1; for (const p of ps) { const v = fn(p); if (v > bv) { bv = v; b = p; } } if (b && bv > 0) items.push({ k: 'stat', t: txt(b, bv), pid: b.id }); };
  const pg = (p, k) => p.stats[key][k] / p.stats[key].gp;
  const sd = L.season * 400 + (L.day || 0) + (L.po ? L.po.day * 3 : 0), T = (k, v, i) => fl(k, v, sd + (i || 0));   // v30 7t: wordings change each game day
  const pv = (p, v) => ({ name: nm(p), abbr: ab(p.team), v: f1(v) });
  lead(p => pg(p, 'pts'), (p, v) => T(key === 'po' ? 'tk.pts.po' : 'tk.pts', pv(p, v), 1));
  lead(p => pg(p, 'orb') + pg(p, 'drb'), (p, v) => T('tk.reb', pv(p, v), 2));
  lead(p => pg(p, 'ast'), (p, v) => T('tk.ast', pv(p, v), 3));
  lead(p => pg(p, 'stl'), (p, v) => T('tk.stl', pv(p, v), 4));
  lead(p => pg(p, 'blk'), (p, v) => T('tk.blk', pv(p, v), 5));
  lead(p => pg(p, 'tpm'), (p, v) => T('tk.tpm', pv(p, v), 6));
  if (L.phase === 'regular') {
    const tm = L.teams.filter(t => t.w + t.l >= 5).sort((a, b) => b.w / (b.w + b.l) - a.w / (a.w + a.l) || b.w - a.w)[0];
    if (tm) items.push({ k: 'stat', t: T('tk.record', { team: tname(tm.id), w: tm.w, l: tm.l }, 7), tid: tm.id });
    const o = L.teams.map(t => ({ t, a: teamAdv(t.trs) })).filter(x => x.a);
    if (o.length) { const bo = o.slice().sort((a, b) => b.a.ortg - a.a.ortg)[0], bd = o.slice().sort((a, b) => a.a.drtg - b.a.drtg)[0]; items.push({ k: 'stat', t: T('tk.offdef', { oabbr: bo.t.abbr, ortg: f1(bo.a.ortg), dabbr: bd.t.abbr, drtg: f1(bd.a.drtg) }, 8), tid: bo.t.id }); }
  }
  { const gs = L.phase === 'playoffs' && L.po && L.po.day > 0 ? L.games.filter(g => g.playoff && g.poDay === L.po.day - 1) : L.phase === 'regular' && L.day > 0 ? L.games.filter(g => g.day === L.day - 1 && !g.playoff) : [];
    let b = null; for (const g of gs) for (const r of g.box) if (!b || r[3] > b.pts) b = { pts: r[3], id: r[0], g, side: r[1] };
    if (b && L.players[b.id]) { const g = b.g, opp = b.side === 0 ? g.away : g.home; items.push({ k: 'stat', t: T('tk.top', { name: nm(L.players[b.id]), pts: b.pts, opp: ab(opp), res: g.hs > g.as === (b.side === 0) ? 'win' : 'loss' }, 9), pid: b.id }); } }
  // rumors
  { let n = 0; for (const x of L.log) { if (n >= 3) break; if (x.cat === 'rumor') { items.push({ k: 'rumor', t: cap(x.text), tid: x.tid }); n++; } } }
  if (L.phase === 'regular' || L.phase === 'off-review' || L.phase.startsWith('off')) {
    const open = typeof inTradeWindow === 'function' && inTradeWindow(L), out = [];
    for (const p of Object.values(L.players)) { if (p.team == null || p.retired || p.prospect || p.team === L.user) continue; if (p.tradeReq === L.season) out.push({ p, w: 2, t: T('tk.treq', { name: nm(p), abbr: ab(p.team), ovr: p.ovr }, p.id) }); else if (open) { const st = (L.teams[p.team].tstat || {})[p.id]; if (st && st.k === 'block') out.push({ p, w: 1, t: T('tk.block', { team: tname(p.team), name: nm(p), ovr: p.ovr }, p.id) }); } }
    out.sort((a, b) => b.w - a.w || b.p.ovr - a.p.ovr); for (const x of out.slice(0, 5)) items.push({ k: 'rumor', t: x.t, pid: x.p.id });
  }
  return items;
}
function renderTicker() {
  let el = document.getElementById('ticker');
  if (!L || ui.setupOpen || liveGame()) { if (el) el.hidden = true; return; }   // no news ticker while a live game is playing (spoilers)
  if (!el) { el = document.createElement('div'); el.id = 'ticker'; el.className = 'ticker'; $('#main').parentNode.insertBefore(el, $('#main')); }
  el.hidden = false;
  const f = ui.tkF || '', key = [L.season, L.phase, L.day, L.po ? L.po.day : 0, L.log.length, L.games.length, f, tkOff, L.user].join('|');
  if (key === tkKey && el.firstChild) return; tkKey = key;
  if (tkOff) { el.innerHTML = '<button class="sm" id="tk-show">Show ticker</button>'; return; }
  let items = []; try { items = tickerItems(); } catch (e) { console.error(e); }
  const shown = items.filter(x => !f || x.k === f), LAB = { news: 'News', stat: 'Stat', rumor: 'Rumor' };
  const one = shown.map(x => `<span class="tk-i tk-${x.k}"><span class="tk-l">${LAB[x.k]}</span> ${x.pid != null ? `<a class="lk" data-player="${x.pid}">${esc(x.t)}</a>` : x.tid != null ? `<a class="lk" data-team="${x.tid}">${esc(x.t)}</a>` : esc(x.t)}</span>`).join('');
  const secs = Math.max(40, Math.round(shown.reduce((a, x) => a + x.t.length + 8, 0) / 11));
  el.innerHTML = `<select id="tk-f" aria-label="Ticker filter"><option value="">All</option><option value="news" ${f === 'news' ? 'selected' : ''}>News</option><option value="stat" ${f === 'stat' ? 'selected' : ''}>Stats</option><option value="rumor" ${f === 'rumor' ? 'selected' : ''}>Rumors</option></select><div class="tk-view" aria-live="off">${shown.length ? `<div class="tk-track" style="animation-duration:${secs}s">${one}${one}</div>` : '<span class="muted" style="padding:0 10px">Nothing on the ticker yet.</span>'}</div><button class="sm" id="tk-x" aria-label="Hide ticker" title="Hide ticker">×</button>`;
}
document.addEventListener('change', e => { if (e.target && e.target.id === 'tk-f') { ui.tkF = e.target.value; tkKey = ''; renderTicker(); } });
document.addEventListener('click', e => {
  const b = e.target.closest('#tk-x,#tk-show'); if (!b) return;
  e.stopImmediatePropagation(); tkOff = b.id === 'tk-x'; try { localStorage.setItem('pbl-tk-off', tkOff ? '1' : '0'); } catch (x) { } tkKey = ''; renderTicker();
}, true);
function render() {
  closeRM();
  if (ui.setupOpen && L) { ui.prevL = L; }
  if (!L || ui.setupOpen) { $('#fchip').hidden = true; $('#brand').classList.remove('fm'); $('#tabs').innerHTML = ''; $('#subtabs').innerHTML = ''; $('#subrow').hidden = true; $('#simctl').innerHTML = ''; $('#simctl').dataset.k = ''; $('#when').textContent = ''; $('#main').innerHTML = vSetup(ui.setupNote); return; }
  try { watchScan(L); } catch (e) { }
  renderHeader();
  try { todoTick(); todoChip(); } catch (e) { console.error(e); }
  let html;
  if (ui.gm != null && findGM(L, ui.gm)) html = vGM(findGM(L, ui.gm));
  else if (ui.coach != null && findCoach(L, ui.coach)) html = vCoach(findCoach(L, ui.coach));
  else if (ui.game != null) html = vGame(L.games.find(g => g.id === ui.game));
  else if (ui.player != null && L.players[ui.player]) html = vPlayer(L.players[ui.player]);
  else {
    const v = ui.view;
    if (v === 'myteam' && L.user != null) html = vTeam(L.teams[L.user]);
    else if (window.P3V && P3V[v]) html = P3V[v]();   // Phase 3 views (src/p3.js)
    else html = ({ preview: vPreview, weekly: vWeekly, standings: vStandings, review: vReviewPage, schedule: vSchedule, stats: vStats, players: vPlayerDir, awards: vAwards, teams: vTeams, rmoves: vRMoves, hofc: vHofCeremony, trades: vTrades, fa: vFA, draft: vDraft, coaches: vCoaches, history: vHistory, news: vNews, feed: vFeed, topplays: vTopPlays, injuries: vInjuries, discipline: vDiscipline, pipeline: vPipeline, rules: vRules }[v] || vStandings)();
    if (L.phase === 'off-review' && L.offSummary && (v === 'standings' || v === 'myteam')) html = reviewBanner() + html;   // v30a #20: the report has its own page
  }
  html = undoBar() + html;
  if (ui.backDlg && (ui.player != null || ui.coach != null || ui.gm != null || ui.view === 'teams' || ui.team != null)) html = `<div class="backdlg"><button class="sm primary" id="b-backdlg">← Back to popup</button></div>` + html;
  $('#main').innerHTML = html;
  document.body.classList.toggle('wide', ['myteam', 'draft', 'trades', 'players', 'fa', 'pipeline', 'stats', 'awards', 'teams'].includes(ui.view) && ui.gm == null && ui.coach == null && ui.game == null);   // v37a: wide tables use the full window
  { const b = $('#b-undo'); if (b) b.onclick = doUndo; }
  { const b = $('#b-backdlg'); if (b) b.onclick = () => { const f = ui.backDlg; ui.backDlg = null; render(); if (f) runDialog(f); }; }
  ui.cur = snapNow();
  bindView();
  try { tpAfter(); } catch (e) { console.error(e); }   // Phase 2: top-plays reel
  try { if (window.FX) FX.afterRender(JSON.stringify([ui.cur, ui.mtab, ui.teamTab, ui.liveMode, ui.setupOpen ? 1 : 0])); } catch (e) { }   // Phase 1: page fade + count-ups (src/fx.js)
  renderNote();
  try { renderTicker(); } catch (e) { console.error(e); }
  try { negoAfterRender(); } catch (e) { console.error(e); }   // v30c #2
  try { if (window.P3) P3.afterRender(); } catch (e) { console.error(e); }   // Phase 3
}
// v25.1: pinned notes. One plain-text note per save (L.note), in a box in a screen corner on every screen;
// minimize to a tab, expand again (remembered in the save). Saved as you type. Sits under popups (z-index below .overlay).
let noteFor = null, noteL = null, noteTimer = null;
function renderNote() {
  let box = document.getElementById('pnote');
  if (!L || ui.setupOpen) { if (box) box.hidden = true; noteFor = null; return; }
  if (!box) { box = document.createElement('div'); box.id = 'pnote'; document.body.appendChild(box); }
  const n = L.note || (L.note = { text: '', open: false });
  const key = n.open ? 1 : 0;
  box.hidden = false;
  if (noteFor === key && noteL === L && box.firstChild) return;
  noteL = L;   // keep the textarea (and its focus) between renders
  noteFor = key; box.className = n.open ? 'open' : 'min';
  if (!n.open) {
    const first = (n.text || '').split('\n')[0].trim();
    box.innerHTML = `<button id="pnote-open" class="sm" title="Open your pinned note" aria-label="Open pinned note">📝 Notes${first ? ' · <span class="muted">' + esc(first.length > 22 ? first.slice(0, 22) + '…' : first) + '</span>' : ''}</button>`;
    box.querySelector('#pnote-open').onclick = () => { n.open = true; save(); renderNote(); const ta = document.getElementById('pnote-ta'); if (ta) ta.focus(); };
  } else {
    box.innerHTML = `<div class="pnote-h"><strong>Pinned note</strong><span class="muted" id="pnote-st">saved</span><button id="pnote-min" class="sm" title="Minimize" aria-label="Minimize note">–</button></div><textarea id="pnote-ta" aria-label="Pinned note" placeholder="Plans, targets, reminders… saved with this league."></textarea>`;
    const ta = box.querySelector('#pnote-ta'); ta.value = n.text || '';
    ta.oninput = () => { n.text = ta.value.slice(0, 20000); const st = document.getElementById('pnote-st'); if (st) st.textContent = 'saving…'; clearTimeout(noteTimer); noteTimer = setTimeout(() => { save(); const st2 = document.getElementById('pnote-st'); if (st2) st2.textContent = 'saved'; }, 600); };
    box.querySelector('#pnote-min').onclick = () => { n.text = ta.value; n.open = false; save(); renderNote(); };
  }
}

let CLOSED = new Set(); try { CLOSED = new Set(JSON.parse(localStorage.getItem('pbl-closed') || '[]')); } catch (e) {}
function panelKey(h) { return (ui.view + ':' + h.textContent.split('·')[0].replace(/[0-9]+/g, '').trim()).toLowerCase(); }
function makeCollapsible() {
  document.querySelectorAll('#main .panel').forEach(p => {
    const h = p.firstElementChild; if (!h || !/^H[23]$/.test(h.tagName) || p.children.length < 2) return;
    p.classList.add('cl'); h.tabIndex = 0; h.setAttribute('role', 'button');
    const k = panelKey(h); if (CLOSED.has(k)) p.classList.add('closed');
    h.setAttribute('aria-expanded', String(!p.classList.contains('closed')));
  });
}
document.addEventListener('click', e => {
  const h = e.target.closest('#main .panel.cl > h2:first-child, #main .panel.cl > h3:first-child');
  if (!h || e.target.closest('a,button,input,select')) return;
  const p = h.parentElement; p.classList.toggle('closed');
  const k = panelKey(h); if (p.classList.contains('closed')) CLOSED.add(k); else CLOSED.delete(k);
  h.setAttribute('aria-expanded', String(!p.classList.contains('closed')));
  try { localStorage.setItem('pbl-closed', JSON.stringify([...CLOSED])); } catch (err) {}
}, true);
document.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('#main .panel.cl > h2:first-child, #main .panel.cl > h3:first-child')) { e.preventDefault(); e.target.click(); } });
function bindView() {
  makeCollapsible();
  const on = (sel, ev, fn) => { const el = $(sel); if (el) el.addEventListener(ev, fn); };
  on('#trremind', 'change', e => { L.noTrainRemind = !e.target.checked; save(); });
  on('#pq', 'input', e => { ui.pq = e.target.value; const pos = e.target.selectionStart; render(); const n = $('#pq'); n.focus(); n.setSelectionRange(pos, pos); });
  on('#pft', 'change', e => { ui.pfTeam = e.target.value; render(); });
  on('#pfa1', 'change', e => { ui.pfAgeLo = e.target.value; render(); }); on('#pfa2', 'change', e => { ui.pfAgeHi = e.target.value; render(); });
  on('#pdt', 'change', e => { ui.pdTeam = e.target.value; render(); });
  on('#pdp', 'change', e => { ui.pdPos = e.target.value; render(); });
  on('#pdn', 'change', e => { ui.pdNat = e.target.value; render(); });
  for (const [id, k] of [['#pda1', 'pdAgeLo'], ['#pda2', 'pdAgeHi'], ['#pdm', 'pdMin']]) on(id, 'change', e => { ui[k] = e.target.value; render(); });
  on('#pdq', 'input', e => { ui.pdq = e.target.value; const pos = e.target.selectionStart; render(); const n = $('#pdq'); n.focus(); n.setSelectionRange(pos, pos); });
  document.querySelectorAll('select[data-hurtplan]').forEach(el => { el.addEventListener('click', e => e.stopPropagation()); el.addEventListener('change', () => { const p = L.players[+el.dataset.hurtplan]; p.hurtPlan = el.value === 'auto' ? null : el.value; save(); render(); }); });
  document.querySelectorAll('select[data-late]').forEach(el => el.addEventListener('change', () => { const t = L.teams[L.user]; if (!t) return; const k = el.dataset.late; t.late = Object.assign(t.late || {}, { [k]: k === 'hack' ? el.value === 'true' : el.value }); save(); render(); }));
  on('#late-reset', 'click', () => { const t = L.teams[L.user]; if (t) { t.late = null; save(); render(); } });
  document.querySelectorAll('input[data-pb]').forEach(el => el.addEventListener('change', () => { const t = L.teams[L.user]; if (!t) return; t.pbAdj = Object.assign(t.pbAdj || {}, { [el.dataset.pb]: +el.value }); if (Object.values(t.pbAdj).every(v => v === 2)) t.pbAdj = null; save(); render(); }));
  document.querySelectorAll('input[data-sl]').forEach(el => {
    el.addEventListener('input', () => { const v = $('#slv-' + el.dataset.sl); if (v) v.textContent = el.value; });
    el.addEventListener('change', () => { const t = L.teams[L.user]; if (!t || el.disabled) return; slSet(t.coach, el.dataset.sl, +el.value); save(); render(); });
  });
  on('#sl-reset', 'click', () => { const t = L.teams[L.user]; if (!t) return; const d = slDefault(t.coach); for (const k of SL_KEYS) slSet(t.coach, k, d[k]); save(); render(); });
  on('#pb-reset', 'click', () => { const t = L.teams[L.user]; if (t) { t.pbAdj = null; save(); render(); } });
  on('#cov-sel', 'change', e => { const t = L.teams[L.user]; if (t) { t.cov = e.target.value || null; save(); render(); } });
  on('#cov-hold', 'change', e => { const t = L.teams[L.user]; if (t) { t.covHold = e.target.value === '1'; save(); render(); } });
  document.querySelectorAll('select[data-focus]').forEach(el => { el.addEventListener('click', e => e.stopPropagation()); el.addEventListener('change', () => { const p = L.players[+el.dataset.focus]; if (!p || !isUser(p.team)) return; setFocus(L, p, el.value); save(); render(); }); });
  on('#t3-start', 'click', () => { const o = L.teams.filter(t => t.id !== L.user).map(t => t.id), x = ui.tradeWith != null && ui.tradeWith !== L.user ? ui.tradeWith : o[0]; ui.t3 = { x, y: o.find(t => t !== x), mv: {}, msg: null }; render(); });
  on('#t3-close', 'click', () => { ui.t3 = null; render(); });
  on('#t3-clear', 'click', () => { if (ui.t3) { ui.t3.mv = {}; ui.t3.msg = null; } render(); });
  { const t3team = k => e => { const t3 = ui.t3; t3[k] = +e.target.value; const keep = new Set([L.user, t3.x, t3.y]); for (const [key, to] of Object.entries(t3.mv)) { const id = key.slice(2), from = key[0] === 'p' ? (L.players[+id] || {}).team : (L.picks.find(x => String(x.id) === id) || {}).owner; if (!keep.has(to) || !keep.has(from)) delete t3.mv[key]; } t3.msg = null; render(); };
    on('#t3x', 'change', t3team('x')); on('#t3y', 'change', t3team('y')); }
  document.querySelectorAll('select[data-t3]').forEach(el => el.addEventListener('change', () => { if (!ui.t3) return; if (el.value === '') { delete ui.t3.mv[el.dataset.t3]; if (ui.t3.prot) delete ui.t3.prot[el.dataset.t3.slice(2)]; } else ui.t3.mv[el.dataset.t3] = +el.value; ui.t3.msg = null; render(); }));
  { const cs = () => { const t3 = ui.t3; if (!t3) return; t3.cash = { from: +$('#t3cf').value, to: +$('#t3ct').value, amt: Math.max(0, Math.min(CASH_MAX, Math.round((parseFloat($('#t3ca').value) || 0) * 2) / 2)) }; t3.msg = null; render(); }; ['#t3cf', '#t3ct', '#t3ca'].forEach(id => on(id, 'change', cs)); }
  document.querySelectorAll('select[data-t3prot]').forEach(el => el.addEventListener('change', () => { if (!ui.t3) return; ui.t3.prot = ui.t3.prot || {}; if (+el.value) ui.t3.prot[el.dataset.t3prot] = +el.value; else delete ui.t3.prot[el.dataset.t3prot]; ui.t3.msg = null; render(); }));   // v25.7 S6
  on('#t3-propose', 'click', () => { if (!ui.t3) return; ui.t3.msg = evaluateUserTrade3(L, [L.user, ui.t3.x, ui.t3.y], t3moves()); render(); });
  on('#t3-confirm', 'click', () => { if (!ui.t3) return; const teams = [L.user, ui.t3.x, ui.t3.y], mv = t3moves(), r = evaluateUserTrade3(L, teams, mv); if (!r.ok) { ui.t3.msg = r; render(); return; } executeTrade3(L, { teams, moves: mv }); ui.t3 = null; ui.tradeMsg = { ok: true, done: true, msg: '3-team trade completed.' }; save(); render(); cutCheck(); });
  on('#hof-y', 'change', e => { ui.hofF.y = e.target.value === '' ? null : +e.target.value; render(); });
  on('#hof-t', 'change', e => { ui.hofF.t = e.target.value === '' ? null : +e.target.value; render(); });
  on('#hof-c', 'change', e => { ui.hofF.c = e.target.value; render(); });
  on('#injteam', 'change', e => { ui.injTeam = e.target.value === '' ? null : e.target.value; render(); });
  on('#pfp', 'change', e => { ui.pfPos = e.target.value; render(); });
  on('#pfty', 'change', e => { ui.pfType = e.target.value; render(); });
  on('#pall', 'change', e => { ui.pAll = e.target.checked; render(); });
  document.querySelectorAll('[data-negf]').forEach(el => el.addEventListener('change', () => { const b = document.querySelector('[data-offer]'); if (!b) return; const pid = +b.dataset.offer; ui.neg[pid] = Object.assign(readNeg(pid), { msg: '', ok: false }); render(); }));
  document.querySelectorAll('select[data-bwhy]').forEach(el => el.addEventListener('change', () => { L.players[+el.dataset.bwhy].blockWhy = el.value; save(); render(); }));
  on('#d-sel', 'change', e => { ui.day = +e.target.value; render(); });
  on('#d-prev', 'click', () => { ui.day--; render(); });
  on('#d-next', 'click', () => { ui.day++; render(); });
  on('#fas', 'change', e => { ui.faSort = e.target.value; render(); });
  on('#tw', 'change', e => { ui.tradeWith = +e.target.value; ui.tGet = { players: [], picks: [] }; ui.tradeMsg = null; render(); });
  on('#tclear', 'click', () => { ui.tGive = { players: [], picks: [] }; ui.tGet = { players: [], picks: [] }; ui.tradeMsg = null; render(); });
  on('#askprops', 'click', () => { const ids = ui.tGive.players.slice(); ui.props = { names: ids.map(id => L.players[id].name).join(', '), list: proposalsFor(L, ids) }; render(); });
  on('#propose', 'click', () => { ui.tradeMsg = evaluateUserTrade(L, ui.tradeWith, ui.tGive, ui.tGet); render(); });
  on('#tsuggest', 'click', () => { const s = ui.tradeMsg.suggest; if (s.t === 'c') ui.tGive.cash = r1((ui.tGive.cash || 0) + s.amt); else (s.t === 'p' ? ui.tGive.players : ui.tGive.picks).push(s.id); ui.tradeMsg = evaluateUserTrade(L, ui.tradeWith, ui.tGive, ui.tGet); render(); });
  on('#tconfirm', 'click', () => { const r = evaluateUserTrade(L, ui.tradeWith, ui.tGive, ui.tGet); if (r.ok) { executeTrade(L, { a: L.user, b: ui.tradeWith, aGive: ui.tGive, bGive: ui.tGet }); ui.tGive = { players: [], picks: [] }; ui.tGet = { players: [], picks: [] }; ui.tradeMsg = { ok: true, msg: 'Trade completed.' }; save(); } else ui.tradeMsg = r; render(); cutCheck(); });
  document.querySelectorAll('[data-asset]').forEach(el => el.addEventListener('change', e => { const side = el.dataset.asset === 'give' ? ui.tGive : ui.tGet; const arr = side[el.dataset.kind]; const v = el.dataset.kind === 'players' ? +el.value : el.value; if (el.checked) arr.push(v); else { arr.splice(arr.indexOf(v), 1); if (side.prot) delete side.prot[v]; } ui.tradeMsg = null; render(); }));
  document.querySelectorAll('select[data-prot]').forEach(el => el.addEventListener('change', () => { const g = ui.tGive; g.prot = g.prot || {}; if (+el.value) g.prot[el.dataset.prot] = +el.value; else delete g.prot[el.dataset.prot]; ui.tradeMsg = null; render(); }));   // v25.7 S6
  document.querySelectorAll('input[data-cash]').forEach(el => el.addEventListener('change', () => { const g = el.dataset.cash === 'give' ? ui.tGive : ui.tGet; g.cash = Math.max(0, Math.min(CASH_MAX, Math.round((parseFloat(el.value) || 0) * 2) / 2)); ui.tradeMsg = null; render(); }));   // v25.7c
  document.querySelectorAll('[data-starter]').forEach(el => el.addEventListener('change', () => { const t = L.teams[L.user]; t.manual = t.manual || { starters: [null, null, null, null, null], order: [], depth: t.coach.depth }; const s = +el.dataset.starter; const v = el.value ? +el.value : null; t.manual.starters = t.manual.starters.map(x => x === v ? null : x); t.manual.starters[s] = v; save(); render(); }));
  on('#depth', 'change', e => { const t = L.teams[L.user]; t.manual = t.manual || { starters: [null, null, null, null, null], order: [], depth: t.coach.depth }; t.manual.depth = +e.target.value; save(); render(); });
  on('#lineup-reset', 'click', () => { L.teams[L.user].manual = null; save(); render(); });
  on('#aw-season', 'change', e => { ui.awSeason = +e.target.value; render(); });
  const ptid = () => L.teams[+$('[data-ptid]').dataset.ptid];
  on('#greatteam', 'change', e => { ui.greatTeam = +e.target.value; render(); });
  on('#bookteam', 'change', e => { ui.bookTeam = +e.target.value; render(); });
  on('#yb-s', 'change', e => { ui.ybS = +e.target.value; render(); });
  on('#dh-team', 'change', e => { ui.dhTeam = +e.target.value; render(); });   // v28.7 R2
  on('#yb-t', 'change', e => { ui.ybT = +e.target.value; render(); });
  on('#staffteam', 'change', e => { ui.staffTeam = e.target.value === '' ? null : +e.target.value; render(); });
  on('#loadmgmt', 'change', e => { L.teams[L.user].loadMgmt = +e.target.value; save(); });
  on('#moodauto', 'change', e => { const t = L.teams[L.user]; t.moodAuto = e.target.checked; if (!t.moodAuto) for (const p of rosterOf(L, t)) p.moodMin = 0; save(); render(); });
  on('#setprice', 'click', () => { const t = ptid(), v = Math.round(+$('#tprice').value); if (!isFinite(v) || v < 10) return; t.price = Math.min(400, v); t.priceAuto = false; save(); render(); });
  on('#mktprice', 'click', () => { const t = ptid(); t.priceAuto = true; t.price = null; save(); render(); });
  on('#capdet', 'toggle', e => { ui.capOpen = e.target.open; });
  document.querySelectorAll('details[data-raceopen]').forEach(d => d.addEventListener('toggle', () => { ui.raceOpen = d.open; }));
  applySorts();
  ui.lf = ui.lf || {};
  const setF = (sid, k, v) => { ui.lf[sid] = ui.lf[sid] || {}; ui.lf[sid][k] = v; applyFilters(); };
  document.querySelectorAll('#main input[data-fq]').forEach(el => el.addEventListener('input', () => setF(el.dataset.fq, 'q', el.value)));
  document.querySelectorAll('#main select[data-fp]').forEach(el => el.addEventListener('change', () => setF(el.dataset.fp, 'pos', el.value)));
  document.querySelectorAll('#main select[data-fo]').forEach(el => el.addEventListener('change', () => setF(el.dataset.fo, 'ovr', el.value)));
  document.querySelectorAll('#main select[data-fa]').forEach(el => el.addEventListener('change', () => setF(el.dataset.fa, 'age', el.value)));
  document.querySelectorAll('#main select[data-ft]').forEach(el => el.addEventListener('change', () => setF(el.dataset.ft, 'type', el.value)));
  document.querySelectorAll('#main [data-qf]').forEach(el => el.addEventListener('click', e => { e.stopPropagation(); setF(el.dataset.qf, 'w', el.dataset.qv); document.querySelectorAll(`#main [data-qf="${el.dataset.qf}"]`).forEach(b => b.classList.toggle('primary', b === el)); }));
  applyFilters();
}
// ---------- sortable tables: click a header to sort, again to flip; the choice sticks while you play ----------
ui.tsorts = {};
function cellVal(td) {
  if (!td) return null;
  const raw = td.dataset.v != null ? td.dataset.v : td.textContent.trim();
  if (raw === '' || raw === '—') return null;
  const n = parseFloat(String(raw).replace(/[$,%M+]/g, ''));
  return /^[-+$.\d]/.test(raw) && isFinite(n) ? n : String(raw).toLowerCase();
}
function sortTable(tb, i, dir) {
  const body = tb.tBodies[0]; if (!body) return;
  const rows = [...body.rows].filter(r => !r.classList.contains('nosort')), fixed = [...body.rows].filter(r => r.classList.contains('nosort'));
  rows.sort((a, b) => { const x = cellVal(a.cells[i]), y = cellVal(b.cells[i]); if (x == null && y == null) return 0; if (x == null) return 1; if (y == null) return -1; return (typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y))) * dir; });
  [...rows, ...fixed].forEach(r => body.appendChild(r));
}
function applySorts() {
  document.querySelectorAll('#main table.sortable').forEach(tb => {
    const st = ui.tsorts[tb.dataset.sid];
    tb.querySelectorAll('thead th').forEach((th, i) => { if (th.classList.contains('nosort')) return; th.dataset.ci = i; th.classList.toggle('sorted', !!st && st.i === i); if (st && st.i === i) th.dataset.arrow = st.dir > 0 ? ' ▲' : ' ▼'; else delete th.dataset.arrow; });
    if (st) sortTable(tb, st.i, st.dir);
  });
}
document.addEventListener('click', e => {
  const th = e.target.closest('#main table.sortable thead th');
  if (!th || th.classList.contains('nosort') || th.dataset.ci == null) return;
  const tb = th.closest('table'), sid = tb.dataset.sid, i = +th.dataset.ci, cur = ui.tsorts[sid];
  const firstVal = [...tb.tBodies[0].rows].map(r => cellVal(r.cells[i])).find(v => v != null);
  ui.tsorts[sid] = { i, dir: cur && cur.i === i ? -cur.dir : (typeof firstVal === 'number' ? -1 : 1) };
  render();
});
function moveBench(pid, dir) {
  const t = L.teams[L.user]; t.manual = t.manual || { starters: [null, null, null, null, null], order: [], depth: t.coach.depth };
  const bench = (ui.benchIds || []).slice();
  const i = bench.indexOf(pid), j = i + dir; if (j < 0 || j >= bench.length) return;
  [bench[i], bench[j]] = [bench[j], bench[i]]; t.manual.order = bench; save(); render();
}

const backStack = [], fwdStack = [];
let navLock = false;
{ const bp = backStack.push; backStack.push = function (...a) { if (!navLock) fwdStack.length = 0; return bp.apply(this, a); }; }   // any new navigation clears Forward
const snapNow = () => ({ player: ui.player, game: ui.game, team: ui.team, view: ui.view, hs: ui.hs, coach: ui.coach, gm: ui.gm });
function applyNav(prev) {
  Object.assign(ui, { player: null, game: null, team: null, hs: null, coach: null, gm: null }, prev);
  if (location.hash !== '#' + prev.view) history.replaceState(null, '', '#' + prev.view);
  render(); window.scrollTo(0, 0);
}
function goBack() {
  const prev = backStack.pop(); if (!prev) return;
  fwdStack.push(snapNow()); applyNav(prev);
}
function goFwd() {
  const nx = fwdStack.pop(); if (!nx) return;
  navLock = true; backStack.push(snapNow()); navLock = false; applyNav(nx);
}
function goHome() { location.hash = L && L.user != null ? '#myteam' : '#standings'; if (ui.player != null || ui.team != null || ui.coach != null || ui.game != null || ui.gm != null) { ui.gm = null; route(); } window.scrollTo(0, 0); }
document.addEventListener('click', e => {
  const el = e.target.closest('[data-rectab],[data-gm],[data-attrtab],[data-twin],[data-injsev],[data-agent],[data-x],[data-histtab],[data-greatpos],[data-greattop],[data-dtab],[data-dpage],[data-pdclear],[data-trtab],[data-tododone],[data-scoutp],[data-tgt],[data-joboffers],[data-bup],[data-bdown],[data-breset],[data-tradepick],[data-tradeforpick],[data-hirescout],[data-rfa],[data-cmpp],[data-cmpt],[data-nopause],[data-pdef],[data-hiderook],[data-faafford],[data-trf],[data-trwith],[data-fatalk],[data-fawd],[data-bookmode],[data-sftab],[data-mtab],[data-firescout],[data-scouthire],[data-snt],[data-buyterms],[data-confirm-buyout],[data-feattab],[data-besttab],[data-racec],[data-pacc],[data-pload],[data-pdtab],[data-pset],[data-ptab],[data-editcoach],[data-savecoach],[data-block],[data-protect],[data-core],[data-tgttab],[data-attall],[data-watch],[data-ptag],[data-top100],[data-signall],[data-stab],[data-skey],[data-awkey],[data-teamtab],[data-editname],[data-savename],[data-firecoach],[data-unsort],[data-player],[data-game],[data-team],[data-sort],[data-back],[data-hs],[data-hsback],[data-veto],[data-release],[data-up],[data-down],[data-offer],[data-pkyr],[data-swapadd],[data-swapdel],[data-incadd],[data-incdel],[data-review],[data-draft],[data-tradefor],[data-setmode],[data-setteam],#create,[data-confirm-release],[data-topt],[data-accept],[data-decline],[data-counter],[data-hire],[data-ncat],[data-cls],[data-r2],[data-padv],[data-tskey],[data-tsadv],[data-tssort],[data-coach],[data-fav],#setup-cancel,[data-setsize],[data-setnba],[data-setgames],[data-tconf]');
  if (!el || !($('#main').contains(el) || $('#modal').contains(el) || el.closest('#ticker') || el.closest('#rowmenu'))) return;
  if ($('#modal').contains(el) && (el.dataset.player || el.dataset.team || el.dataset.coach)) { ui.backDlg = ui.curDlg || null; closeDialog(); }
  const d = el.dataset;
  if (el.id === 'create') { const s = ui.setup; SLOT = 'slot-' + Date.now(); setLeague(newLeague({ mode: s.mode, userTeam: s.mode === 'team' ? s.team : null, size: s.nba ? 30 : s.size === 16 ? 16 : 30, nba: !!s.nba, games: [58, 66, 82].includes(s.games) ? s.games : 82 })); if (L.me && (s.gmName || '').trim()) L.me.name = s.gmName.trim().slice(0, 40); ui.setupOpen = false; ui.setupNote = null; ui.newSlot = false; backStack.length = 0; ui.cur = null; save(); location.hash = '#preview'; route(); return; }
  if (el.id === 'setup-cancel') { ui.setupOpen = false; L = ui.prevL; ui.prevL = null; render(); return; }
  if (d.setmode) { ui.setup.mode = d.setmode; render(); return; }
  if (d.setnba != null) { ui.setup.nba = d.setnba === '1'; ui.setup.team = 0; render(); return; }
  if (d.setsize) { ui.setup.size = +d.setsize; render(); return; }
  if (d.setgames) { ui.setup.games = +d.setgames; render(); return; }
  if (d.tconf) { ui.teamsConf = d.tconf; render(); return; }
  if (d.attrtab) { ui.attrTab = d.attrtab; render(); return; }
  if (d.twin) { const [w, k] = d.twin.split('|'); ui.twin = ui.twin || {}; ui.twin[w] = k; render(); return; }
  if (d.feattab) { ui.featTab = d.feattab; render(); return; }
  if (d.x) { xAction(d.x, el); return; }
  if (d.agent) { agentDialog(+d.agent); return; }
  if (d.histtab) { ui.histTab = d.histtab; render(); return; }
  if (d.rectab) { ui.recTab = d.rectab; render(); return; }
  if (d.greatpos) { ui.greatPos = d.greatpos; render(); return; }
  if (d.greattop) { ui.greatTop = +d.greattop; render(); return; }
  if (d.besttab) { ui.bestTab = d.besttab; render(); return; }
  if (d.racec) { ui.raceConf = d.racec; render(); return; }
  if (d.pset) { ui.pSet = d.pset; render(); return; }
  if (d.ptab) { const [k, v] = d.ptab.split(':'); ui.pTab = ui.pTab || {}; ui.pTab[k] = v; render(); return; }
  if (d.top100) { top100Dialog(d.top100); return; }
  if (d.attall) { ui.attAll = !ui.attAll; render(); return; }
  if (d.watch) { e.stopPropagation(); const r = toggleWatch(L, +d.watch); if (r === null) dialog(`<p>Your watch list is full (${WATCH_MAX} players). Remove someone first.</p><div class="row"><button id="x-close">OK</button></div>`), $('#x-close').onclick = closeDialog; save(); render(); return; }
  if (d.ptag) { e.stopPropagation(); setPtag(L, +d.ptag, d.ptv); save(); render(); return; }
  if (d.tgttab) { e.stopPropagation(); ui.tgtTab = d.tgttab; render(); return; }
  if (d.core) { e.stopPropagation(); const p = L.players[+d.core], msg = p ? setCore(L, p, !p.core) : null; if (msg) alertMsg(msg); save(); render(); return; }
  if (d.block || d.protect) { e.stopPropagation(); const p = L.players[+(d.block || d.protect)]; if (d.block) { p.block = !p.block; if (p.block) p.protect = false; } else { p.protect = !p.protect; if (p.protect) p.block = false; } save(); render(); return; }
  if (d.editcoach != null && el.tagName === 'BUTTON') { ui.editCoach = d.editcoach === '0' ? null : +d.editcoach; render(); const i = $('#ec-name'); if (i) i.focus(); return; }
  if (d.savecoach) { const c = findCoach(L, +d.savecoach), v = $('#ec-name').value.trim().replace(/\s+/g, ' '); if (!v) { $('#ec-msg').textContent = 'A name is required.'; return; } const old = c.name; c.name = v; renameEverywhere(L, old, v, 'coach', c.id); ui.editCoach = null; ui.nameRx = null; save(); render(); return; }
  if (d.stab) { ui.statTab = d.stab; if (d.stab === 'players') { ui.psort = ui.pAdv ? 'ts' : 'ovr'; } render(); return; }
  if (d.skey) { ui.sKey = d.skey; render(); return; }
  if (d.awkey) { ui.awKey = d.awkey; render(); return; }
  if (d.teamtab) { ui.teamTab = d.teamtab; render(); return; }
  if (d.hxty) { ui.hxTy = d.hxty; render(); return; }
  if (d.unsort) { delete ui.tsorts[d.unsort]; render(); return; }
  if (d.firecoach) { fireDialog(); return; }
  if (d.editname != null && el.tagName === 'BUTTON') { ui.editName = d.editname === '0' ? null : +d.editname; render(); if (ui.editName) { const f = $('#en-first'); if (f) f.focus(); } return; }
  if (d.savename) {
    const p = L.players[+d.savename]; const f = $('#en-first').value.trim().replace(/\s+/g, ' '), l = $('#en-last').value.trim().replace(/\s+/g, ' ');
    if (!l) { $('#en-msg').textContent = 'A last name is required.'; return; }
    const numRaw = $('#en-num').value.trim(), num = numRaw === '' ? p.num : numRaw === '00' ? '00' : Math.round(+numRaw);   // v30a: '00' is its own number
    if (numRaw !== '' && num !== '00' && !(num >= 0 && num <= 99)) { $('#en-msg').textContent = 'Numbers go from 0 to 99.'; return; }
    const tmId = p.team != null ? p.team : p.tw ? p.tw.tid : null;
    if (num !== p.num && tmId != null) {
      const tm = L.teams[tmId], mates = [...tm.roster, ...(tm.twoWay || [])].map(id => L.players[id]).filter(x => x && x.id !== p.id);
      const clash = mates.find(x => x.num === num); if (clash) { $('#en-msg').textContent = `${clash.name} already wears #${num}.`; return; }
      if ((tm.retired || []).some(r => r.num === num)) { $('#en-msg').textContent = `${tm.abbr} retired #${num}.`; return; }
    }
    const nat = $('#en-nat').value, home = $('#en-home').value.trim().replace(/\s+/g, ' ').slice(0, 40);
    if (nat !== p.nat) p.tx.push({ s: L.season, t: `Nationality changed from ${NAT_NAME[p.nat] || p.nat} to ${NAT_NAME[nat] || nat}` });
    if (num !== p.num && p.num != null) p.tx.push({ s: L.season, t: `Number changed from #${p.num} to #${num}` });
    p.nat = nat; p.num = num; p.home = home || null;
    const old = p.name; p.first = f; p.last = l; p.name = f ? f + ' ' + l : l;
    usedNames(L).add(p.name); L.usedNames = [...usedNames(L)];
    renameEverywhere(L, old, p.name, 'player', p.id);
    if (old !== p.name) p.tx.push({ s: L.season, t: `Name changed from ${old}` });
    ui.editName = null; ui.nameRx = null; save(); render(); return;
  }
  if (d.setteam != null && d.setteam !== undefined && el.classList.contains('teampick')) { ui.setup.team = +d.setteam; render(); return; }
  if (d.sort) { const k = d.sort; if (ui.psort === k) ui.pdir *= -1; else { ui.psort = k; ui.pdir = ['name', 'team', 'pos'].includes(k) ? 1 : -1; } render(); return; }
  if (d.veto) { vetoTrade(L, d.veto); save(); render(); return; }
  if (d.topt) { decideTeamOption(L, +d.topt, d.ex === '1'); save(); render(); return; }
  if (d.pdef) { ui.pDef = true; render(); return; }
  if (d.pdtab) { ui.pdTab = d.pdtab; render(); return; }
  if (d.pdclear) { ui.pdq = ''; ui.pdTeam = 'all'; ui.pdPos = 'all'; ui.pdAgeLo = ui.pdAgeHi = ui.pdMin = ''; ui.pdNat = 'all'; render(); return; }
  if (d.padv != null && el.dataset.padv !== undefined) { ui.pDef = false; ui.pAdv = d.padv === '1'; ui.psort = ui.pAdv ? 'ts' : 'ovr'; ui.pdir = -1; render(); return; }
  if (d.tskey) { ui.tsKey = d.tskey; render(); return; }
  if (d.tsadv != null && el.dataset.tsadv !== undefined) { ui.tsAdv = d.tsadv === '1'; render(); return; }
  if (d.tssort) { if (ui.tsSort === d.tssort) ui.tsDir = -(ui.tsDir || 1); else { ui.tsSort = d.tssort; ui.tsDir = 1; } render(); return; }
  if (d.r2) { e.stopPropagation(); const err = decideSecondRounder(L, +d.r2, d.sign === 'tw' ? 'tw' : d.sign === '1'); if (err) alertMsg(err); save(); render(); return; }
  if (d.accept) { const err = acceptOffer(L, d.accept); ui.tradeMsg = { ok: !err, msg: err || 'Trade completed.' }; save(); render(); cutCheck(); return; }
  if (d.decline) { declineOffer(L, d.decline); save(); render(); return; }
  if (d.pkyr) { ui.pkOpen = ui.pkOpen || {}; const cur = ui.pkOpen[d.pkyr]; const S = +d.pkyr.replace(/^[a-z]+/, ''), open = cur != null ? cur : S < nextDraftS(L) + 2; ui.pkOpen[d.pkyr] = !open; render(); return; }
  if (d.swapadd) { const side = d.swapadd, g = side === 'give' ? ui.tGive : ui.tGet, S = +$('#swy-' + side).value, gT = side === 'give' ? L.user : ui.tradeWith, rT = side === 'give' ? ui.tradeWith : L.user; g.swaps = (g.swaps || []).filter(x => x.s !== S).concat([{ s: S, g: gT, r: rT }]); ui.tradeMsg = null; render(); return; }
  if (d.swapdel) { const g = d.swapdel === 'give' ? ui.tGive : ui.tGet; (g.swaps || []).splice(+d.i, 1); ui.tradeMsg = null; render(); return; }
  if (d.counter) { const o = L.offers.find(x => x.id === d.counter); if (o) { ui.tradeWith = o.a; ui.tGive = { players: o.bGive.players.slice(), picks: o.bGive.picks.slice(), cash: o.bGive.cash || 0, prot: Object.assign({}, o.bGive.prot), swaps: (o.bGive.swaps || []).slice() }; ui.tGet = { players: o.aGive.players.slice(), picks: o.aGive.picks.slice(), cash: o.aGive.cash || 0, prot: Object.assign({}, o.aGive.prot), swaps: (o.aGive.swaps || []).slice() }; ui.tradeMsg = { ok: false, msg: 'Their offer is loaded below. Change it and propose your version.' }; ui.trTab = 'center'; if (location.hash !== '#trades') location.hash = '#trades'; } render(); window.scrollTo(0, 0); return; }
  if (d.fav != null) { ui.faTab = d.fav; render(); window.scrollTo(0, 0); return; }
  if (d.hire) { fireDialog(); return; }
  if (d.ncat != null && el.classList.contains('chipbtn')) { ui.ncat = d.ncat; render(); return; }
  if (d.injsev != null && el.classList.contains('chipbtn')) { ui.injSev = d.injsev; render(); return; }
  if (d.cls) { ui.cls = +d.cls; render(); return; }
  if (d.up) { e.stopPropagation(); moveBench(+d.up, -1); return; }
  if (d.down) { e.stopPropagation(); moveBench(+d.down, 1); return; }
  if (d.release) {
    e.stopPropagation();
    const p = L.players[+d.release];
    const blk = releaseBlock(L, p);
    if (blk) { $('#relmsg').innerHTML = `<div class="msg no">${esc(blk)}</div>`; return; }
    const dead = capHit(L, p), tm = L.teams[p.team];
    $('#relmsg').innerHTML = `<div class="msg">Release ${esc(p.name)} from ${esc(tm.abbr)}?${dead > 0 ? ` His ${money(dead)} cap hit stays on ${esc(tm.abbr)}'s books as dead money through ${seasonName(p.contract.exp)}, unless another team signs him.` : ' His minimum deal leaves no dead money.'} <button class="sm danger" data-confirm-release="${p.id}">Release</button>${buyoutOpen(L) && buyoutTerms(L, p) ? ` <button class="sm" data-buyterms="${p.id}">Negotiate a buyout instead</button>` : ''}</div>`;
    return;
  }
  if (d.joboffers) { jobOffersDialog(); return; }
  if (d.dtab) { ui.dtab = d.dtab; render(); return; }
  if (d.dpage) { ui.dpage = d.dpage; render(); window.scrollTo(0, 0); return; }
  if (d.tododone) { ui.todoDone = !ui.todoDone; render(); return; }
  if (d.trwith !== undefined && el.dataset.trwith !== undefined) { ui.tradeWith = +d.trwith; ui.tGive = { players: [], picks: [] }; ui.tGet = { players: [], picks: [] }; render(); window.scrollTo(0, 0); return; }
  if (d.trtab) { ui.trTab = d.trtab; render(); window.scrollTo(0, 0); return; }
  if (d.trf !== undefined && el.dataset.trf !== undefined) { ui.trF = d.trf; render(); return; }
  if (d.scoutp) { e.stopPropagation(); scoutDialog(+d.scoutp); return; }
  if (d.tgt) { e.stopPropagation(); const p = L.players[+d.tgt]; if (!p || p.team == null) return; ui.tradeWith = p.team; ui.tGet = { players: [p.id], picks: [] }; ui.tGive = { players: [], picks: [] }; ui.tradeMsg = null; render(); window.scrollTo(0, 0); return; }
  if (d.bup || d.bdown) { e.stopPropagation(); moveBoard(+(d.bup || d.bdown), +d.bd, d.bup ? -1 : 1); return; }
  if (d.breset) { delete L.myBoard[+d.breset]; save(); render(); return; }
  if (d.tradepick) { ui.trTab = 'center'; e.stopPropagation(); ui.tGive = { players: [], picks: [d.tradepick] }; ui.tGet = { players: [], picks: [] }; ui.tradeMsg = { ok: false, msg: 'Your pick is loaded. Choose a team and what you want back.' }; location.hash = '#trades'; return; }
  if (d.tradeforpick) { ui.trTab = 'center'; e.stopPropagation(); const k = L.picks.find(x => x.id === d.tradeforpick); ui.tradeWith = k.owner; ui.tGet = { players: [], picks: [k.id] }; ui.tGive = { players: [], picks: [] }; ui.tradeMsg = null; ui.player = null; if (location.hash === '#trades') { ui.view = 'trades'; render(); window.scrollTo(0, 0); } else location.hash = '#trades'; return; }
  if (d.firescout) { const nm = L.teams[L.user].scout.name; const err = fireScout(L, L.user); ui.scoutMsg = err || `You fired ${nm}. Hire a replacement before the season, or the front office will pick one.`; save(); render(); return; }
  if (d.scouthire) { scoutHireDialog(); return; }
  if (d.rfa) { const p = L.players[+d.rfa]; if (!p || !p.sheet) { closeDialog(); render(); return; }
    if (d.ans === 'yes') { const t = L.teams[L.user]; if (payroll(L, t) + p.sheet.amt > APRON + 1e-6) { alertMsg(`Matching would put you over the ${money(APRON)} hard cap.`); return; } if (t.roster.length >= 15) { alertMsg('Your roster is full. Release someone to match.'); return; } sheetDecide(L, p, true); }
    else sheetDecide(L, p, false, 'you declined to match');
    closeDialog(); save(); render(); return; }
  if (d.cmpp) { const p = L.players[+d.cmpp]; const r = rivalOf(L, p); compareDialog('p', p.id, r ? r.other.id : null); return; }
  if (d.cmpt) { const t = +d.cmpt; const o = L.user != null && t !== L.user ? L.user : L.teams.find(x => x.id !== t && x.conf === L.teams[t].conf).id; compareDialog('t', t, o); return; }
  if (d.nopause) { L.pauseOffers = L.pauseOffers === false ? true : false; save(); render(); return; }
  if (d.hiderook) { ui.faHideRook = !ui.faHideRook; render(); return; }
  if (d.faafford) { ui.faAfford = !ui.faAfford; render(); return; }
  if (d.fawd) { withdrawFAOffer(L, +d.fawd); ui.neg[+d.fawd] = { ...(ui.neg[+d.fawd] || {}), msg: 'Offer withdrawn.', ok: true }; save(); render(); return; }
  if (d.fatalk) { const p = L.players[+d.fatalk]; if (!p || !p.faTalk) { closeDialog(); render(); return; } const t0 = p.faTalk;
    if (d.ans === 'yes') { const o = (L.faOffers || {})[p.id] || {}; const r = negotiate(L, p.id, t0.amt, t0.yrs, L.user, 'signing', null, o.extra || {}); if (r.ok) { delete L.faOffers[p.id]; p.faTalk = null; ui.neg[p.id] = { amt: t0.amt, yrs: t0.yrs, msg: r.msg, ok: true }; } else ui.neg[p.id] = { amt: t0.amt, yrs: t0.yrs, msg: r.msg, ok: false }; }
    else { withdrawFAOffer(L, p.id); ui.neg[p.id] = { msg: `You walked away from ${p.name}.`, ok: true }; }
    closeDialog(); save(); render(); return; }
  if (d.sftab) { ui.stab = d.sftab; render(); return; }
  if (d.bookmode) { ui.bookMode = d.bookmode; render(); return; }
  if (d.mtab) { ui.mtab = d.mtab; try { localStorage.setItem('pbl-mtab', d.mtab); } catch (e) { } render(); return; }
  if (d.hirescout) { if (!scoutWindow(L) && L.teams[L.user].scout) { ui.scoutMsg = 'Scouting directors can only be changed after the draft, before the season starts.'; render(); return; } scoutHireDialog(); return;
    const err = hireScout(L, L.user, +d.hirescout); ui.scoutMsg = err || `You hired ${L.teams[L.user].scout.name} as scouting director.`; save(); render(); return; }
  if (d.snt) { e.stopPropagation(); sntDialog(+d.snt); return; }
  if (d.buyterms) { e.stopPropagation(); const p = L.players[+d.buyterms], b = buyoutTerms(L, p); if (!b) return; $('#relmsg').innerHTML = `<div class="msg">${buyoutText(p, b)} <button class="sm danger" data-confirm-buyout="${p.id}">Buy him out</button></div>`; return; }
  if (d.confirmBuyout) { const p = L.players[+d.confirmBuyout]; if (!releaseBlock(L, p) && buyoutOpen(L)) buyout(L, p); save(); render(); return; }
  if (d.confirmRelease) { const p = L.players[+d.confirmRelease]; if (!releaseBlock(L, p)) release(L, p); save(); render(); return; }
  if (d.incadd) { const pid = +d.incadd, n = readNeg(pid); n.incs = (n.incs || []).concat([{ k: 'gp', amt: Math.round((n.amt || 0) * 0.05 * 10) / 10 || 0.1 }]); ui.neg[pid] = n; render(); return; }
  if (d.incdel != null && d.pid) { const pid = +d.pid, n = readNeg(pid); n.incs.splice(+d.incdel, 1); ui.neg[pid] = n; render(); return; }
  if (d.review) { seasonReviewDialog(+d.review); return; }
  if (d.offer) {
    e.stopPropagation();
    const pid = +d.offer, N0 = readNeg(pid), amt = N0.amt, yrs = N0.yrs, opt = N0.opt || null, keep = { incs: N0.incs, kick: N0.kick, eto: N0.eto, gtd: N0.gtd, role: N0.role, ntc: N0.ntc };
    const multiFA = L.phase === 'off-fa' && d.type === 'signing' && (isFinite(amt) ? amt : 0) > MINSAL + 1e-6;
    const send = promise => { const x = extrasOf(N0); if (promise) x.ownerPromise = true; return multiFA ? submitFAOffer(L, pid, isFinite(amt) ? amt : 0, yrs, opt, x) : negotiate(L, pid, isFinite(amt) ? amt : 0, yrs, L.user, d.type, opt, x); };
    const finish = r => {
    if (multiFA) { ui.neg[pid] = { amt, yrs, opt: opt || '', ...keep, msg: r.msg, ok: r.ok }; if (r.ok) save(); render(); return; }
    ui.neg[pid] = { amt: r.counter ? r.counter.amt : amt, yrs: r.counter ? r.counter.yrs : yrs, opt: opt || '', ...keep, msg: r.msg, ok: r.ok };
    if (r.ok) save();
    render();
    if (r.ok) { const p = L.players[pid], a = r.accepted; dialog(`<div style="text-align:center">${logo(L.user, 64)}<h2 style="margin-top:8px">${esc(p.name)} accepted</h2><p>${a.type === 'extension' ? 'Extension' : a.type === 're-sign' ? 'Re-signed' : 'Signed'}: <strong>${a.yrs} year${a.yrs > 1 ? 's' : ''}, ${money(a.amt)} per year</strong>${a.opt ? ` with a ${a.opt === 'PO' ? 'player' : 'team'} option` : ''}${a.type === 'extension' ? ', starting next season' : ''}.</p><p class="muted">${esc(r.msg)}</p><p class="muted">${esc(L.teams[L.user].abbr)} payroll is now ${money(payroll(L, L.teams[L.user]))} of ${money(CAP)}.</p><div class="row" style="justify-content:center"><button class="primary" id="x-close">Great</button></div></div>`); $('#x-close').onclick = closeDialog; }
    };
    const r = send(false);
    // v24.5.1: the owner is asked only when the player would sign; promising re-sends the same offer with the promise attached, and the promise is made only if he signs
    if (r.owner && r.owner.ask) { ui.neg[pid] = { amt, yrs, opt: opt || '', ...keep, msg: r.msg, ok: false }; render(); ownerAskDialog(r.owner, () => finish(send(true))); return; }
    finish(r);
    return;
  }
  if (d.draft) { e.stopPropagation(); const ph0 = L.phase; draftPlayer(L, +d.draft); save(); render(); maybeDraftDialog(ph0); return; }
  if (d.signall) { let err = null; for (const id of (L.r2Pending || []).slice()) err = decideSecondRounder(L, id, true) || err; if (err) alertMsg(err); save(); render(); return; }
  if (d.pacc != null && el.dataset.pacc !== undefined) { const o = ui.props && ui.props.list[+d.pacc]; if (!o) return; if (!inTradeWindow(L) || !offerValid(L, o)) { ui.tradeMsg = { ok: false, msg: 'That proposal is no longer valid.' }; } else { executeTrade(L, o); ui.tradeMsg = { ok: true, msg: 'Trade completed.' }; ui.tGive = { players: [], picks: [] }; ui.tGet = { players: [], picks: [] }; save(); } ui.props = null; render(); cutCheck(); return; }
  if (d.pload != null && el.dataset.pload !== undefined) { const o = ui.props && ui.props.list[+d.pload]; if (!o) return; ui.tradeWith = o.a; ui.tGive = { players: o.bGive.players.slice(), picks: o.bGive.picks.slice(), cash: o.bGive.cash || 0, prot: Object.assign({}, o.bGive.prot), swaps: (o.bGive.swaps || []).slice() }; ui.tGet = { players: o.aGive.players.slice(), picks: o.aGive.picks.slice(), cash: o.aGive.cash || 0, prot: Object.assign({}, o.aGive.prot), swaps: (o.aGive.swaps || []).slice() }; ui.props = null; ui.tradeMsg = { ok: false, msg: 'Proposal loaded. Change it and press Propose trade.' }; render(); return; }
  if (d.tradefor) { ui.trTab = 'center'; const p0 = L.players[+d.tradefor], s0 = tradeStatus(L, p0); if (s0 && s0.k === 'protect') { alertMsg(`${p0.name} is protected (${s0.why.toLowerCase()}), so ${L.teams[p0.team].abbr} won't trade him.`); return; } }
  if (d.tradefor) { ui.trTab = 'center'; const p = L.players[+d.tradefor]; ui.tradeWith = p.team; ui.tGet = { players: [p.id], picks: [] }; ui.tGive = { players: [], picks: [] }; ui.tradeMsg = null; ui.player = null; ui.game = null; ui.coach = null; if (location.hash === '#trades') { ui.view = 'trades'; render(); window.scrollTo(0, 0); } else location.hash = '#trades'; return; }   // v15 fix: already on #trades, so the hash change never fired
  if (d.hs) { backStack.push(snapNow()); ui.hs = +d.hs; render(); window.scrollTo(0, 0); return; }
  if (d.hsback) { ui.hs = null; render(); return; }
  if (d.back) {
    if (d.back === 'teams') { ui.team = null; ui.player = null; ui.game = null; }
    else { if (backStack.length) { goBack(); return; } ui.player = null; ui.game = null; ui.coach = null; ui.gm = null; }
    render(); window.scrollTo(0, 0); return;
  }
  const snap = { player: ui.player, game: ui.game, team: ui.team, view: ui.view, hs: ui.hs, coach: ui.coach, gm: ui.gm };
  if (d.gm) { backStack.push(snap); ui.gm = +d.gm; ui.coach = null; ui.player = null; ui.game = null; render(); window.scrollTo(0, 0); return; }
  ui.gm = null;
  if (d.coach) { backStack.push(snap); ui.coach = +d.coach; ui.player = null; ui.game = null; render(); window.scrollTo(0, 0); return; }
  if (d.player) { backStack.push(snap); ui.player = +d.player; ui.game = null; ui.coach = null; }
  else if (d.game) { backStack.push(snap); ui.game = +d.game; ui.player = null; ui.coach = null; ui.liveMode = null; }
  else if (d.team) { ui.teamTab = 'overview'; if (isUser(+d.team)) { ui.coach = null; ui.player = null; ui.game = null; if (location.hash === '#myteam') { render(); window.scrollTo(0, 0); } else location.hash = '#myteam'; return; } backStack.push(snap); ui.view = 'teams'; ui.team = +d.team; ui.player = null; ui.game = null; ui.coach = null; if (location.hash !== '#teams') history.replaceState(null, '', '#teams'); }
  render(); window.scrollTo(0, 0);
});

const VIEWS = ['cards', 'trophies', 'stories', 'rmoves', 'hofc', 'topplays', 'preview', 'weekly', 'myteam', 'standings', 'review', 'schedule', 'stats', 'players', 'injuries', 'discipline', 'awards', 'pipeline', 'teams', 'trades', 'fa', 'draft', 'coaches', 'history', 'news', 'feed', 'rules'];
// old tab names still work as links
const VIEW_ALIAS = { leaders: ['stats', 'leaders'], tstats: ['stats', 'teams'], playoffs: ['standings', null] };
function route() {
  const h = location.hash.replace('#', '');
  ui.view = VIEWS.includes(h) ? h : VIEW_ALIAS[h] ? VIEW_ALIAS[h][0] : (L && L.user != null ? 'myteam' : 'standings');
  if (VIEW_ALIAS[h] && VIEW_ALIAS[h][1]) ui.statTab = VIEW_ALIAS[h][1];
  ui.teamTab = 'overview'; ui.editName = null;
  if (ui.cur && !ui.restoring) { backStack.push(ui.cur); if (backStack.length > 60) backStack.shift(); }
  ui.player = null; ui.game = null; ui.team = null; ui.hs = null; ui.coach = null; ui.gm = null;
  if (ui.view === 'schedule') ui.day = null;
  if (ui.view === 'topplays') { ui.tpGame = null; ui.tpI = 0; }
  render();
}
window.addEventListener('hashchange', route);
for (const id of ['#tabs', '#subtabs']) $(id).addEventListener('click', e => { const a = e.target.closest('a[data-v]'); if (a && location.hash === '#' + a.dataset.v) { e.preventDefault(); route(); window.scrollTo(0, 0); } });

// ---------- simulation controls ----------
// v26.5: press conference (team mode, one open at a time). One question at a time; four answers; then the quote and what changed.
function pressActive() { return L && L.user != null && L.mode === 'team' ? pressOpen(L) : null; }
function pressFxHtml(fx) {
  const sg = (v, lbl) => v ? `<span class="${v > 0 ? 'fx-up' : 'fx-dn'}">${v > 0 ? '+' : '\u2212'}${Math.abs(v)} ${lbl}</span>` : '';
  const parts = [sg(fx.hype, 'fan hype'), sg(fx.trust, 'owner trust'), sg(fx.rep, 'media reputation')].filter(Boolean);
  const mo = Object.entries(fx.morale || {}).filter(([id, d]) => d && L.players[id]).map(([id, d]) => `<span class="${d > 0 ? 'fx-up' : 'fx-dn'}">${esc(L.players[id].name)} ${d > 0 ? '+' : '\u2212'}${Math.abs(d)} morale</span>`);
  return parts.concat(mo).join(' · ') || '<span class="muted">No change</span>';
}
function pressDialog() {
  const P = ui.pressShow && L.press && ui.pressShow.id === L.press.id ? L.press : pressOpen(L);   // keep showing the last answer after the press closes
  if (!P || L.mode !== 'team') { closeDialog(); return; }
  const qi = P.qs.findIndex(q => !q.ans), last = qi < 0 ? P.qs.length - 1 : qi, shown = ui.pressShow != null && ui.pressShow.id === P.id ? ui.pressShow.qi : null;
  const qd = shown != null ? shown : last, q = P.qs[qd];
  const answered = q.ans != null;
  dialog(`<h2>Press conference</h2><p class="muted">Question ${qd + 1} of ${P.qs.length} · media reputation ${mediaRep(L)}</p><div class="panel" style="margin:8px 0"><strong>${esc(pressText(q))}</strong></div>${answered ? `<div class="rx-q" style="margin:8px 0">You: \u201C${esc(q.quote)}\u201D</div><p style="margin:6px 0">${pressFxHtml(q.fx)}</p><div class="row"><button class="primary" id="pr-next">${P.qs.every(x => x.ans) ? 'Done' : 'Next question'}</button></div>` : `<div class="row" id="pr-ch">${PRESS_CHOICES.map(c => `<button data-prc="${c}" title="${esc(PRESS_HINT[c])}">${PRESS_LABEL[c]}</button>`).join('')}</div>`}`);
  document.querySelectorAll('[data-prc]').forEach(b => b.onclick = () => { const r = answerPress(L, qd, b.dataset.prc); if (!r) return; ui.pressShow = { id: P.id, qi: qd }; save(); render(); pressDialog(); });
  const nx = $('#pr-next'); if (nx) nx.onclick = () => { ui.pressShow = null; closeDialog(); render(); if (pressOpen(L)) runDialog(pressDialog); };
}
const PRESS_HINT = { confident: 'Sound sure of yourself. Good in good times, risky after losses.', humble: 'Credit others. Steady media rep and owner trust.', deflect: 'Dodge the question. Costs media reputation.', callout: 'Challenge the player or the group. Can hurt morale.' };
function interruptKind() {
  if (L.user != null && L.phase === 'regular' && L.teams[L.user].roster.length > 15) return 'roster';   // v24.2: a trade left you over 15: cut before simming
  if (L.mode === 'commish' && (L.pending || []).some(t => t.isNew)) return 'pending';
  if (L.phase === 'regular' && L.pauseDrama !== false && dramaOpen(L) && ui.dramaSeen !== dramaOpen(L).id) return 'drama';   // v28.7
  if (L.user != null && L.pauseIv !== false && ivOpen(L) && ui.ivSeen !== ivOpen(L).id) return 'iv';   // v28.8
  if (L.user != null && L.phase === 'regular' && mtgOpen(L) && mtgOpen(L).by === 'player' && ui.mtgSeen !== mtgOpen(L).id) return 'mtg';
  if (L.pauseOffers !== false && (L.offers || []).some(o => o.isNew)) return 'offer';
  if (L.phase === 'regular' && L.user != null && L.ddWarned !== L.season && L.day === deadlineDay(L) - 1 && (rosterOf(L, L.teams[L.user]).some(p => p.block) || (L.offers || []).length)) return 'dday';   // v18: stop on deadline day only if you're shopping someone or have offers
  if (L.phase === 'regular' && L.user != null && L.extWarned !== L.season && L.day === deadlineDay(L) - 1 && teamPlayers(L.user).some(p => canExtend(L, p))) return 'ext';
  if (L.phase === 'regular' && L.user != null && L.buyWarned !== L.season && L.day === buyoutDeadlineDay(L) - 1 && teamPlayers(L.user).some(p => buyoutTerms(L, p))) return 'buyout';
  if (L.phase === 'regular' && L.user != null && L.twWarned !== L.season && L.day === twPoDay(L) && twOf(L, L.teams[L.user]).length) return 'twpo';   // v23
  return null;
}
const dlgQueue = [];
// v24.2: release prompt after a trade puts you over the limit; the sim stays blocked until you are at 15
// v24.5: the owner's terms for spending past his limit: promise a tougher goal, or keep the offer under his limit
function ownerAskDialog(oc, onAccept) {
  dialog(`<h2>Your owner needs convincing</h2><p>This signing puts payroll at <strong>${money(oc.after)}</strong>, past his <strong>${money(oc.lim)}</strong> spending limit for ${seasonName(oc.cs)}.</p><p>He'll approve it if you promise a tougher goal for ${seasonName(oc.cs)}:<br><span class="muted">Now:</span> ${esc(oc.cur.txt)}<br><span class="muted">Promise:</span> <strong>${esc(oc.next.txt)}</strong></p><p class="muted">The promise only counts if he signs. Miss the promised goal and you lose about twice the usual owner trust and take a strike toward the hot seat. Once a promised signing goes through, other signings that season up to ${money(OWNER_HARD)} past his limit are approved.</p><div class="row"><button class="primary" id="ow-yes">Promise the tougher goal</button><button id="ow-no">Keep under his limit</button></div>`);
  $('#ow-yes').onclick = () => { closeDialog(); onAccept(); };
  $('#ow-no').onclick = closeDialog;
}
function cutDialog() {
  const t = L.teams[L.user], n = t.roster.length - 15;
  if (n <= 0) { closeDialog(); return; }
  const ps = rosterOf(L, t).slice().sort((a, b) => a.ovr - b.ovr);
  // v24.4: the AI's suggested cut (non-core: outside your top 9, not a young rookie-scale player, not out long-term) and the cheapest option
  const deadOf = p => p.contract && capHit(L, p) > 0 ? capHit(L, p) * Math.max(1, p.contract.exp - capSeason(L) + 1) : 0;
  const sug = waivable(L, t, [])[0] || null, cheap = ps.slice().sort((a, b) => deadOf(a) - deadOf(b) || a.ovr - b.ovr)[0];
  const sugTxt = sug ? `<div class="panel" style="margin:8px 0"><strong>Suggested cut:</strong> ${esc(sug.name)} <span class="muted">${sug.ovr} ovr · ${sug.contract ? money(sug.contract.amt) + '/yr' : ''}${deadOf(sug) ? ' · ' + money(deadOf(sug)) + ' dead money in total' : ' · no dead money'}</span>${cheap && cheap.id !== sug.id ? `<br><span class="muted">Cheapest option: ${esc(cheap.name)} (${cheap.ovr} ovr${deadOf(cheap) ? ', ' + money(deadOf(cheap)) + ' dead money' : ', no dead money'})</span>` : ''}<div class="row" style="margin-top:6px"><button class="sm danger" data-cut="${sug.id}">Cut suggested player</button></div></div>` : '';
  dialog(`<h2>Release ${n} player${n > 1 ? 's' : ''}</h2><p>You have ${t.roster.length} players after that trade. Release ${n} to get to 15 before you can sim.</p>${sugTxt}${ps.map(p => { const dead = p.contract ? capHit(L, p) : 0; return `<div class="leader" style="grid-template-columns:minmax(0,1fr) auto;align-items:center"><span>${esc(p.name)} <span class="muted">${p.ovr} ovr · age ${p.age}${p.contract ? ' · ' + money(p.contract.amt) + ' through ' + seasonName(p.contract.exp) : ''}${dead > 0 ? ' · ' + money(dead) + ' dead money' : ''}</span></span><button class="sm danger" data-cut="${p.id}">Release</button></div>`; }).join('')}<div class="row"><button id="x-close">Later</button></div>`);
  $('#x-close').onclick = closeDialog;
  document.querySelectorAll('[data-cut]').forEach(b => b.onclick = () => { const p = L.players[+b.dataset.cut]; if (!p || releaseBlock(L, p)) return; release(L, p); save(); render(); if (L.teams[L.user].roster.length > 15) cutDialog(); else closeDialog(); });
}
function cutCheck() { if (L.user != null && L.phase === 'regular' && L.teams[L.user].roster.length > 15) queueDialog(cutDialog); }
// Popups shown after sims are remembered so you can reopen them (Recent button, or Back to popup after clicking a name)
function runDialog(fn) { fn(); try { if (window.P3) P3.dialogArt(); } catch (e) { } const h = $('#modal h2'); if (h) { ui.curDlg = fn; ui.recent = [{ t: h.textContent.trim(), fn, s: L.season, ph: L.phase }].concat((ui.recent || []).filter(r => r.fn !== fn && r.t !== h.textContent.trim())).slice(0, 8); } }
// F1/F2: one popup at a time. Popups wait (in dlgQueue) while another popup / ceremony is open, or while you watch your game live (no spoilers).
function liveGame() { if (!L || ui.liveMode == null || !ui.lv || ui.lv.gid !== ui.liveMode) return null; const g = L.games.find(x => x.id === ui.liveMode); return g && g.pbp && ui.lv.i < g.pbp.length ? g : null; }
function popupBusy() { return !!($('#ov') || document.getElementById('p3-cer') || liveGame()); }
function flushDialogs() { if (L && dlgQueue.length && !popupBusy()) runDialog(dlgQueue.shift()); }
setInterval(flushDialogs, 500);
function queueDialog(fn) { if (popupBusy()) dlgQueue.push(fn); else runDialog(fn); }
function recentDialog() {
  const r = ui.recent || [];
  dialog(`<h2>Recent popups</h2>${r.length ? r.map((x, i) => `<div class="leader" style="grid-template-columns:minmax(0,1fr) auto;align-items:center"><span>${esc(x.t)}</span><button class="sm" data-reopen="${i}">Open</button></div>`).join('') : '<p class="muted">Nothing yet. Popups from this session show up here.</p>'}<div class="row"><button id="x-close">Close</button></div>`);
  $('#x-close').onclick = closeDialog;
  document.querySelectorAll('[data-reopen]').forEach(b => b.onclick = () => { const x = r[+b.dataset.reopen]; closeDialog(); setTimeout(() => runDialog(x.fn), 0); });
}
function afterRun(ph0) {
  try { todoStopNotice(); } catch (e) { console.error(e); }
  if (ui.liveFrom != null) {   // v25.2: open your game on the live screen
    const g = L.games.slice(ui.liveFrom).find(x => x.pbp && (isUser(x.home) || isUser(x.away))); ui.liveFrom = null;
    if (g) { backStack.push(snapNow()); ui.game = g.id; ui.player = null; ui.coach = null; ui.liveMode = g.id; ui.lv = null; lvState(g); render(); window.scrollTo(0, 0); lvTick(); }
  }
  { const P = pressActive(); if (P && ui.pressSeen !== P.id) { ui.pressSeen = P.id; queueDialog(pressDialog); } }
  const k = interruptKind();
  if (k === 'drama') { ui.dramaSeen = dramaOpen(L).id; queueDialog(dramaDialog); }
  if (k === 'iv') { ui.ivSeen = ivOpen(L).id; queueDialog(ivDialog); }
  if (k === 'mtg') { ui.mtgSeen = mtgOpen(L).id; queueDialog(mtgDialog); }
  if (k === 'roster') queueDialog(cutDialog); else if (k === 'pending') queueDialog(pendingAlert); else if (k === 'offer') queueDialog(offerAlert); else if (k === 'ext') queueDialog(extWarning); else if (k === 'buyout') queueDialog(buyoutWarning); else if (k === 'dday') queueDialog(ddayDialog); else if (k === 'twpo') queueDialog(twoWayPoDialog);
  if (ui.snap && L.user != null) { const sn = ui.snap; ui.snap = null; const gms = L.games.slice(sn.g).filter(g => isUser(g.home) || isUser(g.away)); if (gms.length >= 2) queueDialog(() => simSummaryDialog(sn, gms)); }
  if (ph0 === 'regular' && L.phase === 'regular-done') queueDialog(() => { awardsDialog('mvp'); try { if (window.P3) P3.ceremony('mvp', true); } catch (e) { } });   // Phase 3: MVP ceremony on top
  if (ph0 === 'playoffs' && L.phase === 'season-done') { queueDialog(() => { championDialog(); try { if (window.P3) P3.ceremony('title', true); } catch (e) { } }); queueDialog(() => seasonReviewDialog(L.season)); }
  if (L.allStar && L.allStar.s === L.season && !L.allStar.shown) { L.allStar.shown = true; queueDialog(allStarDialog); }
  if (ph0 === 'season-done' && L.phase === 'off-review' && L.mode === 'team') { queueDialog(yearbookDialog); queueDialog(finSummaryDialog); if (L.jobless && (L.jobOffers || []).length) queueDialog(jobOffersDialog); if (L.pipeSeen !== L.season && L.pipeHist && L.pipeHist[L.season]) { L.pipeSeen = L.season; queueDialog(pipeDoneDialog); } }
  maybeDraftDialog(ph0);
  maybeScoutPrompt();
  if (L.user != null && (L.holdouts || []).length && L.phase === 'regular') queueDialog(holdoutDialog);
  if (L.deadlineRecap && L.deadlineRecap.s === L.season && !L.deadlineRecap.shown && L.phase === 'regular') { L.deadlineRecap.shown = true; queueDialog(deadlineDialog); }
  { const jl = (L.jerseys || []).filter(j => j.s === L.season && !j.shown); if (jl.length && L.phase.startsWith('off')) { jl.forEach(j => j.shown = true); queueDialog(() => jerseyDialog(jl)); } }
  if (L.summer && L.summer.s === L.season && !L.summer.shown && L.user != null) { L.summer.shown = true; queueDialog(summerDialog); }
  if (L.revealMine && L.revealMine.s === L.season && !L.revealMine.shown && L.user != null && L.revealMine.list.length) { L.revealMine.shown = true; queueDialog(revealDialog); }
  if (L.user != null && (L.faInbox || []).length && !ui.faQ) { ui.faQ = true; queueDialog(faInboxDialog); }
  if (L.draftGrades && L.draftGrades[L.season] && !L.draftGrades[L.season].shown && L.phase !== 'off-draft' && L.phase.startsWith('off')) { L.draftGrades[L.season].shown = true; queueDialog(draftGradesDialog); if (L.intl && L.intl.s === L.season) queueDialog(intlDialog); }
}
// Phase 1: sound, banner and confetti for your team's last game after a sim (the live screen does its own)
function fxSimResult(ph0, g0) {
  if (!window.FX || L.user == null) return;
  if (ph0 === 'playoffs' && L.phase === 'season-done' && L.po && isUser(L.po.champion)) { FX.gameResult({ title: true }); return; }
  const mine = L.games.slice(g0).filter(g => isUser(g.home) || isUser(g.away)); if (!mine.length) return;
  if (ui.liveMode != null && mine.some(g => g.id === ui.liveMode)) return;
  const g = mine[mine.length - 1], won = isUser(g.home) ? g.hs > g.as : g.as > g.hs, my = isUser(g.home) ? g.hs : g.as, op = isUser(g.home) ? g.as : g.hs;
  let w = 0; for (const x of mine) if (isUser(x.home) ? x.hs > x.as : x.as > x.hs) w++;
  const text = mine.length > 1 ? `${won ? 'Won' : 'Lost'} last game ${my}-${op} · ${w}-${mine.length - w} this sim` : `${won ? 'Win' : 'Loss'} ${my}-${op}`;
  FX.gameResult({ win: won, text });
}
function runSteps(stepFn, doneFn, label) {
  if (ui.busy) return; ui.busy = true; ui.undo = []; renderHeader();
  const prog = $('#prog'); const ph0 = L.phase, g0 = L.games.length;
  function tick() {
    const t0 = performance.now(); let more = true;
    while (more && performance.now() - t0 < 50) { more = stepFn(); if (more && interruptKind()) more = false; }
    prog.style.width = (label ? label() : 50) + '%';
    if (more) { setTimeout(tick, 0); return; }
    if (doneFn) doneFn();
    ui.busy = false; setTimeout(() => prog.style.width = '0', 300);
    save(); render(); afterRun(ph0);
    try { fxSimResult(ph0, g0); } catch (e) { console.error(e); }
  }
  setTimeout(tick, 0);
}
// v17: regular-season sims remember where they were going, so a trade prompt can "decline and keep simming"
function simRegular(k, end) {
  const start = L.day; ui.lastSim = { k, end };
  if (k !== 'day') snapStart();
  runSteps(() => { simDay(L); return L.phase === 'regular' && L.day < end; }, () => { if (L.day >= end || L.phase !== 'regular') ui.lastSim = null; }, () => (L.day - start) / Math.max(1, end - start) * 100);
}
function preGameInfo() {
  const d = L.schedule && L.schedule[L.day]; if (!d) return null;
  const gm = d.find(([h, a]) => isUser(h) || isUser(a)); if (!gm) return null;
  const opp = isUser(gm[0]) ? gm[1] : gm[0], me = L.teams[L.user], ot = L.teams[opp], items = [];
  const mine = rosterOf(L, me), theirs = rosterOf(L, ot);
  for (const p of mine) { const g = grudgeVs(L, p, opp); if (g) items.push(`${g.perm ? 'Rivalry and revenge game' : 'Revenge game'}: your ${esc(p.name)} faces ${esc(ot.abbr)} (${esc(g.why)})`); }
  for (const p of theirs) { const g = grudgeVs(L, p, L.user); if (g) items.push(`${g.perm ? 'Rivalry and revenge game' : 'Revenge game'}: ${esc(p.name)} faces you (${esc(g.why)})`); }
  for (const p of mine) for (const r of rivalsOf(L, p)) { if (r.other.team === opp) { const w = r.r.w || {}; items.push(`${r.r.kind === 'draft' ? 'Draft-class rivalry' : 'Rivalry'}: your ${esc(p.name)} vs ${esc(r.other.name)} (head to head ${w[p.id] || 0}-${w[r.other.id] || 0}, since ${esc(r.r.why)})`); } }
  if (isRivalry(L, L.user, opp)) items.push(`Team rivalry (${rivalKinds(L, L.user, opp).map(k => RIV_LABEL[k].toLowerCase()).join(', ')}): ${esc(me.abbr)} vs ${esc(ot.abbr)}`);
  return items.length ? { opp, items } : null;
}
function preGameDialog(info) {
  dialog(`<h2>Tonight: ${esc(L.teams[info.opp].city + ' ' + L.teams[info.opp].name)}</h2>${info.items.map(x => `<div class="leader" style="grid-template-columns:minmax(0,1fr) auto"><span>${x}</span></div>`).join('')}<div class="row" style="margin-top:12px"><button class="primary" id="pg-play">Play the game</button><button id="x-close">Not yet</button></div>`);
  $('#x-close').onclick = closeDialog;
  $('#pg-play').onclick = () => { ui.preOK = L.day + ':' + L.season; closeDialog(); const b = document.querySelector('#simctl [data-sim="day"]'); if (b) b.click(); };
}
// v17: what happened to your team over a multi-day sim
function simSummaryDialog(sn, gms) {
  const me = L.user, t = L.teams[me];
  let w = 0, l = 0; for (const g of gms) { const won = isUser(g.home) ? g.hs > g.as : g.as > g.hs; if (won) w++; else l++; }
  const rank = seedOrder(L, t.conf).indexOf(t.id) + 1;
  const news = L.log.filter(x => (x.n || 0) > sn.n && (x.tid === me || /Rivalry:/.test(x.text) && rosterOf(L, t).some(p => x.text.includes(p.name))));
  const pick = (rx, ks) => news.filter(x => rx.test(x.text) || (ks && (ks.includes(x.k) || ks.includes(x.cat))));   // v25.6: kind/category first, wording as the fallback for old saves
  const perf = []; for (const g of gms) for (const r of g.box) { const p = L.players[r[0]]; if (!p || p.team !== me) continue; const v = k => r[2 + IX[k]]; const reb = v('orb') + v('drb'); const td = [v('pts'), reb, v('ast'), v('stl'), v('blk')].filter(x => x >= 10).length >= 3; if (v('pts') >= 30 || td) perf.push({ p, g, t: `${v('pts')} pts, ${reb} reb, ${v('ast')} ast${td ? ' (triple-double)' : ''}`, v: v('pts') + (td ? 15 : 0) }); }
  perf.sort((a, b) => b.v - a.v);
  const sec = (title, arr, f) => arr.length ? `<h3 style="margin-top:10px">${title}</h3>${arr.slice(0, 5).map(f).join('')}${arr.length > 5 ? `<div class="muted">and ${arr.length - 5} more on the News tab</div>` : ''}` : '';
  const N = x => `<div class="leader" style="grid-template-columns:minmax(0,1fr) auto"><span>${linkify(x.text)}</span></div>`;
  const inj = rosterOf(L, t).filter(p => p.injury > 0 && p.injLong);
  const body = `<p style="margin-top:-4px"><strong>${w}-${l}</strong> over ${gms.length} games${L.phase === 'regular' || sn.ph === 'regular' ? ` · ${recTxt(t.w, t.l)} overall · ${rank}${['st', 'nd', 'rd'][rank - 1] || 'th'} in the conference${sn.rank && sn.rank !== rank ? ` (was ${sn.rank}${['st', 'nd', 'rd'][sn.rank - 1] || 'th'})` : ''}` : ''}${t.streak ? ` · ${t.streak > 0 ? 'won' : 'lost'} ${Math.abs(t.streak)} straight` : ''}</p>`
    + sec('Rivalry and revenge games', pick(/Revenge game|Rivalry:/), N)
    + sec('Big games', perf, x => `<div class="leader" style="grid-template-columns:minmax(0,1fr) auto"><span>${plink(x.p)}: ${x.t}</span><span class="muted">vs ${L.teams[isUser(x.g.home) ? x.g.away : x.g.home].abbr}</span></div>`)
    + sec('Milestones and achievements', pick(/milestone|career high|Achievement|unlocked|record/i, ['milestone']), N)
    + sec('Injuries', inj, p => `<div class="leader" style="grid-template-columns:minmax(0,1fr) auto"><span>${plink(p)}: ${esc(p.injName || 'injured')}, out about ${injGames(p)} more days</span></div>`)
    + sec('Mood and contracts', pick(/unhappy|trade request|wants out|holdout|extended|extension|bet on himself/i, ['extend']), N)
    + sec('Trade offers and front office', pick(/offer|owner|trust|fired|hired/i, ['coach']), N);
  dialog(`<h2>Since ${sn.ph === 'playoffs' ? 'the last playoff sim' : 'day ' + (sn.day + 1)}</h2>${body}<div class="row" style="margin-top:12px"><button class="primary" id="x-close">Close</button></div>`, 'wide');
  $('#x-close').onclick = closeDialog;
}
function snapStart() { if (L.user == null) { ui.snap = null; return; } const t = L.teams[L.user]; ui.snap = { day: L.day, ph: L.phase, w: t.w, l: t.l, rank: seedOrder(L, t.conf).indexOf(t.id) + 1, n: L.logN || 0, g: L.games.length, s: L.season }; }
$('#simctl').addEventListener('click', e => {
  const b = e.target.closest('[data-sim]'); if (!b || b.disabled) return;
  ui.undo = []; ui.simClick = true; setTimeout(() => { ui.simClick = false; }, 0);   // v24.7: a sim ends the undo window
  let k = b.dataset.sim;
  if (k === 'press') { runDialog(pressDialog); return; }
  if (k === 'drama') { runDialog(dramaDialog); return; }
  if (k === 'iv') { runDialog(ivDialog); return; }
  if (k === 'mtg') { runDialog(mtgDialog); return; }
  if (k === 'multi') { runDialog(multiDialog); return; }
  if (k === 'autostop') { ui.autoStop = true; return; }
  const T = L.schedule.length;
  if (k === 'live') { ui.liveFrom = L.games.length; ui.preOK = L.day + ':' + L.season; k = L.phase === 'playoffs' ? 'pday' : 'day'; }   // v25.2: sim the day, then open your game live
  if (k === 'day' || k === 'week' || k === 'end' || k === 'deadline') {
    // Sim day / week stop at the trade deadline (70% mark) if it falls in between; Sim to trade deadline goes right to it
    const dl = deadlineDay(L);
    let end = k === 'day' ? L.day + 1 : k === 'week' ? L.day + 7 : k === 'deadline' ? dl : T; const start = L.day;
    if (k !== 'end' && L.day < dl) end = Math.min(end, dl);
    if (interruptKind()) { afterRun(L.phase); return; }
    if (k === 'day' && L.user != null && ui.preOK !== L.day + ':' + L.season) { const info = preGameInfo(); if (info) { preGameDialog(info); return; } }   // v17: rivalry / revenge game tonight
    simRegular(k, todoStopEnd(end));
  }
  else if (k === 'startpo') { processPending(L); startPlayoffs(L); save(); location.hash = '#standings'; render(); }
  else if (k === 'pday') runSteps(() => { simPlayoffDay(L); return false; });
  else if (k === 'pround') { snapStart(); const st = L.po.stage; runSteps(() => { simPlayoffDay(L); return L.phase === 'playoffs' && L.po.stage === st; }); }
  else if (k === 'pend') { snapStart(); runSteps(() => { simPlayoffDay(L); return L.phase === 'playoffs'; }); }
  else if (k === 'off') runSteps(() => { startOffseason(L); return false; }, () => { location.hash = L.user != null ? '#myteam' : '#standings'; });
  else if (k === 'lottery') { runLottery(L); save(); location.hash = '#draft'; render(); }
  else if (k === 'draft') { startDraft(L); if (L.user == null) { } save(); location.hash = '#draft'; render(); if (L.user != null && L.pauseIv !== false && ivOpen(L)) { ui.ivSeen = ivOpen(L).id; queueDialog(ivDialog); } }
  else if (k === 'pick1') runSteps(() => { aiDraftPick(L); return false; });
  else if (k === 'draftend') runSteps(() => { if (L.phase !== 'off-draft') return false; const s = L.draftOrder[L.draftIdx]; if (s && isUser(s.owner)) return false; aiDraftPick(L); return L.phase === 'off-draft'; });
  else if (k === 'tomypick') runSteps(() => { if (L.phase !== 'off-draft') return false; const s = L.draftOrder[L.draftIdx]; if (!s || isUser(s.owner)) return false; aiDraftPick(L); return L.phase === 'off-draft' && !isUser(L.draftOrder[L.draftIdx]?.owner); });
  else if (k === 'autopick') { const ph0 = L.phase; aiDraftPick(L); save(); render(); maybeDraftDialog(ph0); }
  else if (k === 'fa') { startFA(L); save(); location.hash = '#fa'; render(); }
  else if (k === 'faday') runSteps(() => { faDay(L); return false; });
  else if (k === 'faend') runSteps(() => { faDay(L); return L.phase === 'off-fa' && !(L.faInbox || []).some(e => e.k === 'talk'); });   // v16: stops when a player wants to talk
  else if (k === 'newseason') {
    const prob = userRosterProblem(L);
    if (prob) { dialog(`<h2>Roster not ready</h2><p>${esc(prob)}</p><div class="row">${L.teams[L.user].roster.length < 13 ? '<button class="primary" id="autofill">Auto-fill with minimum contracts</button>' : ''}<button id="x-close">Go to my team</button></div>`); $('#x-close').onclick = () => { closeDialog(); location.hash = '#myteam'; }; const af = $('#autofill'); if (af) af.onclick = () => { autoFillUser(L); closeDialog(); save(); render(); }; return; }
    runSteps(() => { startNewSeason(L); return false; }, () => { location.hash = '#preview'; if (L.user != null && !L.noTrainRemind) queueDialog(trainCheckDialog); });
  }
});

function buyoutText(p, b) { return `${esc(p.name)} would give back <strong>${money(b.give)}</strong> of the ${money(b.owed)} left on his deal (${Math.round(b.rate * 100)}%). <strong>${money(b.deadPerYr)}/yr</strong> stays on your cap as dead money through ${seasonName(b.exp)}, and comes off if another team signs him. He becomes a free agent.`; }
// Day before the buyout deadline (one week after the trade deadline): your options
function buyoutWarning() {
  L.buyWarned = L.season;
  const ps = teamPlayers(L.user).map(p => ({ p, b: buyoutTerms(L, p) })).filter(x => x.b).sort((a, b) => b.b.owed - a.b.owed);
  dialog(`<h2>Buyout deadline tomorrow</h2><p>After tomorrow, players can only be released (full dead money) until the offseason. Bought-out players usually sign cheaply with contenders.</p><div class="tblwrap"><table><thead><tr><th class="l">Player</th><th>Age</th><th>Ovr</th><th>Per year</th><th>Years</th><th>He gives back</th><th>Dead money / yr</th><th></th></tr></thead><tbody>${ps.map(({ p, b }) => `<tr><td class="l">${plink(p)}</td><td>${p.age}</td><td>${ovrTxt(p)}</td><td>${money(p.contract.amt)}</td><td>${b.yl}</td><td>${money(b.give)}</td><td>${money(b.deadPerYr)}</td><td><button class="sm danger" data-bo="${p.id}">Buy out</button></td></tr>`).join('')}</tbody></table></div><div id="bo-msg"></div><div class="row" style="margin-top:12px"><button class="primary" id="x-close">Keep everyone</button></div>`, 'wide');
  $('#x-close').onclick = closeDialog;
  document.querySelectorAll('[data-bo]').forEach(b => b.onclick = () => { const p = L.players[+b.dataset.bo]; const blk = releaseBlock(L, p); if (blk) { $('#bo-msg').innerHTML = `<div class="msg no">${esc(blk)}</div>`; return; } buyout(L, p); save(); render(); b.closest('tr').innerHTML = `<td class="l" colspan="8">${esc(p.name)} bought out.</td>`; });
  save();
}
function alertMsg(t) { dialog(`<p>${esc(t)}</p><div class="row"><button id="x-close">OK</button></div>`); $('#x-close').onclick = closeDialog; }
function pendingAlert() {
  const fresh = L.pending.filter(t => t.isNew); fresh.forEach(t => t.isNew = false);
  const card = tr => `<div class="panel pending" style="margin-bottom:8px" id="pa-${tr.id}"><div>${tlabel(tr.a, true)} ${modePill(L.teams[tr.a])} get <strong>${giveLinks(tr.bGive)}</strong></div><div>${tlabel(tr.b, true)} <span class="muted">(${MODE_LABEL[L.teams[tr.b].mode]})</span> get <strong>${giveLinks(tr.aGive)}</strong></div><div class="row" style="margin-top:8px"><button class="primary sm" data-pa="${tr.id}" data-ok="1">Approve</button><button class="danger sm" data-pa="${tr.id}" data-ok="0">Veto</button></div></div>`;
  dialog(`<h2>Trade${fresh.length > 1 ? 's' : ''} for your review</h2>${fresh.map(card).join('')}<p class="muted">Trades you don't act on go through at the next sim step.</p><div class="row"><button id="x-close">Close</button></div>`);
  $('#x-close').onclick = closeDialog;
  document.querySelectorAll('[data-pa]').forEach(b => b.onclick = () => { const id = b.dataset.pa; if (b.dataset.ok === '1') approveTrade(L, id); else vetoTrade(L, id); const c = document.getElementById('pa-' + id); if (c) c.outerHTML = `<p class="muted">${b.dataset.ok === '1' ? 'Approved' : 'Vetoed'}.</p>`; save(); if (!document.querySelector('[data-pa]')) { closeDialog(); render(); } });
  save();
}
function fmvpHtml(A) {
  const p = A.fmvp != null ? L.players[A.fmvp] : null; if (!p) return '<p>Finals MVP: —</p>';
  const t = A.fmvpLine, g = k => t && t.gp ? f1(t[k] / t.gp) : '—';
  return `<div class="panel" style="text-align:left;margin-top:12px"><div class="k">Finals MVP${A.finalsScore ? ' · series won ' + A.finalsScore.join('-') : ''}</div><div class="big" style="font-size:30px">${plink(p)}</div><div class="muted">${posLabel(p)} · ${esc(tname(A.champion))}</div>${t && t.gp ? `<div class="tblwrap" style="margin-top:8px"><table><thead><tr><th>Games</th><th>Min</th><th>Pts</th><th>Reb</th><th>Ast</th><th>Stl</th><th>Blk</th><th>FG</th><th>3P</th><th>FT</th></tr></thead><tbody><tr><td>${t.gp}</td><td>${f1(t.min / 60 / t.gp)}</td><td><strong>${g('pts')}</strong></td><td>${g('reb')}</td><td>${g('ast')}</td><td>${g('stl')}</td><td>${g('blk')}</td><td>${pct(t.fgm, t.fga)}</td><td>${pct(t.tpm, t.tpa)}</td><td>${pct(t.ftm, t.fta)}</td></tr></tbody></table></div><p class="muted" style="margin:4px 0 0;font-size:12px">Per game in the Finals.</p>` : ''}</div>`;
}
function finSummaryDialog() {
  const tid = L.user != null ? L.user : L.firedFrom; if (tid == null) return;
  const t = L.teams[tid], h = t.finHist[t.finHist.length - 1], oh = t.owner.hist[t.owner.hist.length - 1]; if (!h) return;
  const fired = L.jobless && L.firedFrom === tid && L.me.stints[L.me.stints.length - 1].to === h.s;
  const verdict = fired ? `<div class="msg no"><strong>You've been fired.</strong> After two straight seasons on the hot seat, ${esc(t.owner.name)} has made a change.</div>` : oh ? `<div class="msg ${oh.d >= 0 ? 'ok' : 'no'}">${esc(t.owner.name)}: trust ${oh.trust}/100 (${oh.d >= 0 ? '+' : ''}${oh.d}). Goal "${esc(oh.goal || '')}" ${oh.met ? 'met' : 'missed'}.${t.owner.hot ? ' <strong>You are on the hot seat.</strong>' : ''}</div>` : '';
  const r = (k, v, cls) => `<tr><td class="l">${k}</td><td class="${cls || ''}">${money(v)}</td></tr>`;
  dialog(`<h2>${seasonName(h.s)} finances · ${esc(tname(tid))}</h2>${verdict}<div class="grid2e"><div class="tblwrap"><table><tbody>${r('Ticket sales', h.gate)}${h.playoff ? r('Playoff tickets', h.playoff) : ''}${r('Media rights', h.media)}${r('Merchandise', h.merch)}${h.jersey != null ? `<tr><td class="l muted">&nbsp;&nbsp;of which jerseys</td><td class="muted">${money(h.jersey)}</td></tr>` : ''}${h.sponsor ? r('Sponsorship', h.sponsor) : ''}${h.spBonus ? r('Sponsor playoff bonus', h.spBonus, 'w') : ''}${r('Revenue sharing in', h.shareIn)}${h.taxIn ? r('Luxury tax share', h.taxIn, 'w') : ''}<tr class="sep"><td class="l"><strong>Revenue</strong></td><td><strong>${money(h.revenue)}</strong></td></tr></tbody></table></div>
  <div class="tblwrap"><table><tbody>${r('Player salaries', h.payroll)}${r('Coach and director', h.staff)}${r('Revenue sharing out', h.shareOut)}${h.tax ? r('Luxury tax' + (h.repeat ? ' (repeat rate)' : ''), h.tax, 'over') : ''}<tr class="sep"><td class="l"><strong>Expenses</strong></td><td><strong>${money(h.expenses)}</strong></td></tr><tr><td class="l"><strong>Profit</strong></td><td class="${h.profit >= 0 ? 'w' : 'lo'}"><strong>${money(h.profit)}</strong></td></tr>${h.dist ? `<tr><td class="l">Owner took out</td><td>${money(h.dist)}</td></tr>` : ''}<tr><td class="l">Cash now</td><td>${money(h.cash)}</td></tr></tbody></table></div></div>
  <p class="muted">Average crowd ${h.att.toLocaleString()} (${Math.round(h.full * 100)}% full) at $${h.price} · fan hype ${Math.round(h.hype)}.</p><div class="row"><button class="primary" id="x-close">Continue</button></div>`, 'wide');
  $('#x-close').onclick = closeDialog;
}
function jobOffersDialog() {
  const offers = L.jobOffers || [];
  dialog(`<h2>Job offers</h2><p class="muted">Your reputation: ${gmRep(L)}/100. Teams that changed general managers this offseason${offers.length ? ' want to talk' : ' passed'}.</p>${offers.length ? `<div class="tblwrap"><table><thead><tr><th class="l">Team</th><th>Last season</th><th class="l">Outlook</th>${L.nba ? '' : '<th class="l">Market</th>'}<th>Owner limit</th><th>Cash</th><th></th></tr></thead><tbody>${offers.map(tid => { const t = L.teams[tid], h = L.history[L.history.length - 1], st = h ? h.standings.find(x => x.tid === tid) : null; return `<tr><td class="l">${tlabel(tid, true)}</td><td>${st ? st.w + '-' + st.l : '—'}</td><td class="l">${MODE_LABEL[t.mode]}</td>${L.nba ? '' : `<td class="l">${MARKET_LABEL[t.market]}</td>`}<td>${money(t.owner.limit)}</td><td>${money(t.cash)}</td><td><button class="sm primary" data-takejob="${tid}">Accept</button></td></tr>`; }).join('')}</tbody></table></div>` : ''}<div class="row" style="margin-top:12px"><button id="x-close">${offers.length ? 'Sit out a season' : 'Close'}</button></div>`, 'wide');
  $('#x-close').onclick = closeDialog;
  document.querySelectorAll('[data-takejob]').forEach(b => b.onclick = () => { takeJob(L, +b.dataset.takejob); closeDialog(); save(); location.hash = '#myteam'; render(); alertMsg(`You're the new general manager of the ${tname(L.user)}.`); });
}
function championDialog() {
  const c = L.po && L.po.champion; if (c == null) return;
  const A = L.awards[L.season] || {};
  dialog(`<div style="text-align:center"><div class="trrow" style="justify-content:center">${trophySvg('champ', 96, seasonName(L.season))}${logo(c, 84)}</div><h2 style="margin-top:10px">${esc(tname(c))}</h2><p>${seasonName(L.season)} champions${A.runnerUp != null ? ', beating the ' + esc(tname(A.runnerUp)) + ' in the Finals' : ''}.</p>${fmvpHtml(A)}<div class="row" style="justify-content:center;margin-top:12px"><button class="primary" id="x-close">Continue</button></div></div>`, 'wide');
  $('#x-close').onclick = closeDialog;
}
// v25.4: one line per team saying what it gets; a = first team, b = second (aGet = what a receives)
// v25.4 1: a player's system fit before and after a move (green +5 or more, red -5 or worse)
function fitMove(p, toTid) {
  const to = L.teams[toTid], from = p.team != null ? L.teams[p.team] : null; if (!to) return '';
  const a = from ? fit(p, from.coach) : null, b = fit(p, to.coach), d = a == null ? 0 : b - a;
  return `<div class="fitmv">${plink(p)}: Fit ${a == null ? '' : a + ' → '}<strong class="${d >= 5 ? 'w' : d <= -5 ? 'lo' : ''}">${b}${d >= 5 ? ' ▲' : d <= -5 ? ' ▼' : ''}</strong> <span class="muted">(${esc(OFF_SYS[to.coach.off].name)} / ${esc(DEF_SYS[to.coach.def].name)})</span></div>`;
}
function getsLines(a, b, aGet, bGet) {
  const one = (t, g, v) => { const x = tradeGetsText(L, t, g, v); return x ? `<div><strong>${esc(tname(t))} gets:</strong> ${esc(x)}.</div>` : ''; };
  const fits = (t, g) => (g.players || []).map(id => L.players[id]).filter(Boolean).map(p => fitMove(p, t)).join('');
  const h = one(a, aGet, bGet) + one(b, bGet, aGet), f = fits(a, aGet) + fits(b, bGet);
  return h || f ? `<div class="why">${h}${f ? `<div style="margin-top:4px">${f}</div>` : ''}</div>` : '';
}
function offerAlert() {
  const fresh = L.offers.filter(o => o.isNew);
  fresh.forEach(o => o.isNew = false);
  const ids = fresh.map(o => o.id);
  const draw = () => {
    const list = L.offers.filter(o => ids.includes(o.id));
    if (!list.length) { closeDialog(); render(); return; }
    dialog(`<h2>New trade offer${list.length > 1 ? 's' : ''}</h2>${list.map(o => `<div class="panel pending" style="margin-bottom:8px"><div>${tlabel(o.a, true)} offer <strong>${giveLinks(o.aGive)}</strong></div><div>for your <strong>${giveLinks(o.bGive)}</strong></div>${getsLines(o.a, L.user, o.bGive, o.aGive)}${o.why ? `<div class="why">${esc(o.why)}</div>` : ''}<div class="row" style="margin-top:8px"><button class="primary sm" data-oa="${o.id}">Accept</button><button class="sm danger" data-od="${o.id}">Decline</button></div></div>`).join('')}<div id="oa-msg"></div><p class="muted">Offers can be withdrawn at any time. You can also negotiate from the Trades tab.</p><div class="row"><button id="go-trades">Open the Trades tab</button><button id="x-close">Decide later</button></div>`, 'wide');
    { const box = $('#modal .row:last-of-type') || $('#modal'); box.insertAdjacentHTML('beforeend', `${ui.lastSim ? '<button id="decl-cont">Decline and keep simming</button>' : ''}<label style="margin-left:8px;font-size:13px"><input type="checkbox" id="no-pause" ${L.pauseOffers === false ? 'checked' : ''}> Don't stop the sim for trade offers</label>`); }
    const dc = $('#decl-cont'); if (dc) dc.onclick = () => { for (const o of list) declineOffer(L, o.id); save(); closeDialog(); const ls = ui.lastSim; if (ls && L.phase === 'regular' && L.day < ls.end && !interruptKind()) simRegular(ls.k, ls.end); else render(); };
    $('#no-pause').onchange = e => { L.pauseOffers = e.target.checked ? false : true; save(); };
    $('#x-close').onclick = closeDialog; $('#go-trades').onclick = () => { closeDialog(); ui.trTab = 'offers'; location.hash = '#trades'; };
    document.querySelectorAll('[data-oa]').forEach(b => b.onclick = () => { const err = acceptOffer(L, b.dataset.oa); save(); render(); if (!err) cutCheck(); if (err) { $('#oa-msg').innerHTML = `<div class="msg no">${esc(err)}</div>`; return; } ids.splice(ids.indexOf(b.dataset.oa), 1); alertMsg('Trade completed.'); });
    document.querySelectorAll('[data-od]').forEach(b => b.onclick = () => { declineOffer(L, b.dataset.od); save(); draw(); });
  };
  draw(); save();
}
function extWarning() {
  L.extWarned = L.season;
  const ps = teamPlayers(L.user).filter(p => canExtend(L, p));
  dialog(`<h2>Extension deadline tomorrow</h2><p>After the trade deadline (70% mark) nobody can be extended, and expiring contracts go to free agency in the offseason. Eligible players:</p>${ps.map(p => `<div class="check"><span class="grow">${esc(p.name)} <span class="muted">${posLabel(p)} · ${p.age} · ${ovrTxt(p)} · ${money(p.contract.amt)} expiring</span></span><button class="sm primary" data-extgo="${p.id}">Negotiate</button></div>`).join('')}<div class="row" style="margin-top:12px"><button id="x-close">Continue without extending</button></div>`);
  $('#x-close').onclick = closeDialog;
  document.querySelectorAll('[data-extgo]').forEach(b => b.onclick = () => { closeDialog(); backStack.push({ view: ui.view }); ui.player = +b.dataset.extgo; render(); });
  save();
}
// ---------- league file ----------
function dialog(html, cls) { $('#modal').innerHTML = `<div class="overlay" id="ov"><div class="dialog ${cls || ''}" role="dialog" aria-modal="true"><button class="dx" aria-label="Close" title="Close">×</button>${html}</div></div>`; $('#modal .dx').onclick = closeDialog; markMine($('#modal')); $('#ov').addEventListener('click', e => { if (e.target.id === 'ov') closeDialog(); }); }
function markMine(root) {
  if (L == null || L.user == null || !root) return;
  root.querySelectorAll('[data-player]').forEach(el => { const p = L.players[+el.dataset.player]; if (p && p.team === L.user) el.classList.add('mineHL'); });
}
function closeDialog() { $('#modal').innerHTML = ''; if (dlgQueue.length) setTimeout(flushDialogs, 0); }
$('#b-menu').textContent = 'Saves';
$('#b-recent').onclick = () => { if (L) recentDialog(); };
$('#b-menu').onclick = () => {
  dialog(`<h2>Saves</h2><div id="x-slots" class="muted">Loading saves…</div>
  ${L ? `<div class="row" style="margin:10px 0"><label>Save name <input type="search" id="x-name" value="${esc(L.saveName || defaultSaveName())}" style="width:220px"></label><button class="sm" id="x-rename">Rename</button><button class="sm" id="x-dup">Save a copy</button></div>` : ''}
  <div class="row" style="margin:10px 0 14px"><button class="primary" id="x-new">New league</button><button id="x-exp" ${L ? '' : 'disabled'}>Export this league</button><label class="btn" for="x-file">Import league file</label><input type="file" id="x-file" accept=".json,.gz,.pbl,application/json,application/gzip" hidden></div>
  ${L ? '<div id="x-p3" style="margin:-4px 0 12px"></div>' : ''}
  <div id="x-msg" class="muted"></div>
  <p class="muted" style="font-size:12px">Saves live in this browser on this device. Clearing browser data erases them, so export a backup now and then.</p>
  <div class="row"><button id="x-close">Close</button></div>`);
  $('#x-close').onclick = closeDialog;
  try { if (window.P3) P3.savesExtra(); } catch (e) { console.error(e); }   // Phase 3: small file, share, team link
  const drawSlots = async () => {
    const slots = await getSlots();
    $('#x-slots').innerHTML = slots.length ? slots.map(x => `<div class="check"><span class="grow"><strong>${esc(x.name)}</strong>${x.id === SLOT ? ' <span class="pill pos">Open</span>' : ''}<br><span class="muted">${x.mode === 'team' ? 'Franchise Mode' : 'Commissioner'} · ${seasonName(x.season)} · ${esc(PHASE_TXT[x.phase] || (x.phase === 'regular' ? 'Regular season' : x.phase === 'playoffs' ? 'Playoffs' : x.phase))} · saved ${new Date(x.updated).toLocaleString()}</span></span>${x.id === SLOT ? '' : `<button class="sm primary" data-sl="${x.id}">Load</button>`}<button class="sm danger" data-sd="${x.id}">Delete</button></div>`).join('') : '<p class="muted">No saves yet.</p>';
    document.querySelectorAll('[data-sl]').forEach(b => b.onclick = async () => { const x = await loadSlot(b.dataset.sl); if (!x) { $('#x-msg').textContent = 'That save could not be read.'; return; } SLOT = b.dataset.sl; await dbPut('current', SLOT); setLeague(x); ui.setupOpen = false; backStack.length = 0; ui.cur = null; closeDialog(); location.hash = x.user != null ? '#myteam' : '#standings'; route(); });
    document.querySelectorAll('[data-sd]').forEach(b => b.onclick = () => {
      b.outerHTML = `<span class="row"><span class="muted">Delete for good?</span><button class="sm danger" data-sdy="${b.dataset.sd}">Delete</button></span>`;
      document.querySelector(`[data-sdy="${b.dataset.sd}"]`).onclick = async () => { const id = b.dataset.sd; await dbDel('league:' + id); await dbPut('slots', JSON.stringify((await getSlots()).filter(x => x.id !== id))); if (id === SLOT) { SLOT = null; L = null; await dbDel('current'); closeDialog(); ui.setupOpen = true; render(); return; } drawSlots(); };
    });
  };
  drawSlots();
  if (L) {
    $('#x-rename').onclick = async () => { L.saveName = $('#x-name').value.trim() || defaultSaveName(); await save(); drawSlots(); };
    $('#x-dup').onclick = async () => { const copy = JSON.parse(JSON.stringify(L, (k, v) => k === '_used' ? undefined : v)); copy.saveName = (L.saveName || defaultSaveName()) + ' (copy)'; const keep = SLOT, keepL = L; SLOT = 'slot-' + Date.now(); L = copy; await save(); SLOT = keep; L = keepL; await dbPut('current', SLOT); $('#x-msg').textContent = 'Copy saved. Load it from the list any time.'; drawSlots(); };
  }
  $('#x-new').onclick = () => { closeDialog(); ui.setupOpen = true; ui.newSlot = true; render(); };
  $('#x-exp').onclick = async () => {
    L.nextId = NEXT_ID;
    const data = JSON.stringify(L, (k, v) => k === '_used' ? undefined : v);
    const name = `pbl-${(L.saveName || defaultSaveName()).toLowerCase().replace(/[^a-z0-9]+/g, '-')}-y${L.season}.json`;
    let dl = null; try { dl = await window.claude?.use?.('downloads'); } catch (e) {}
    if (dl) {
      try { await dl.save({ filename: name, data: new Blob([data], { type: 'application/json' }) }); $('#x-msg').textContent = 'Export saved as ' + name + '.'; return; }
      catch (e) { if (e && e.code === 'declined') { $('#x-msg').textContent = 'Export cancelled.'; return; } }
    }
    if (!window.claude) { try { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([data], { type: 'application/json' })); a.download = name; document.body.appendChild(a); a.click(); a.remove(); $('#x-msg').textContent = 'Downloaded ' + name + '.'; return; } catch (e) {} }
    $('#x-msg').innerHTML = `<p>Saving files isn't available here. Copy this text and paste it into a file named <strong>${name}</strong>.</p><textarea id="x-txt" readonly aria-label="League data"></textarea><div class="row" style="margin-top:8px"><button id="x-copy">Copy</button></div>`;
    $('#x-txt').value = data;
    $('#x-copy').onclick = () => { navigator.clipboard.writeText(data).then(() => $('#x-copy').textContent = 'Copied', () => { $('#x-txt').select(); }); };
  };
  $('#x-file').onchange = e => {
    const f = e.target.files[0]; if (!f) return;
    // Phase 3: plain .json or the packed (gzip) file from "Save league file (small)"
    const r = {}; const read = window.P3 ? P3.readLeagueFile(f) : f.text();
    read.then(t => { r.result = t; r.onload(); }, () => { $('#x-msg').textContent = 'That file could not be read.'; });
    r.onload = () => {
      try {
        const x = JSON.parse(r.result);
        if (!x || x.version !== 4 || !Array.isArray(x.teams) || !x.players) throw new Error('shape');
        SLOT = 'slot-' + Date.now(); setLeague(x); ui.setupOpen = false; backStack.length = 0; ui.cur = null; save(); closeDialog(); location.hash = x.user != null ? '#myteam' : '#standings'; route();
      } catch (err) { $('#x-msg').textContent = 'That file isn’t a league export from this version of the page. Choose a .json file made with Export league.'; }
    };
  };
};

$('#b-back').onclick = goBack; $('#b-fwd').onclick = goFwd; $('#b-home').onclick = goHome;
document.addEventListener('keydown', e => {
  if (e.altKey && e.key === 'ArrowLeft') { e.preventDefault(); goBack(); }
  if (e.altKey && e.key === 'ArrowRight') { e.preventDefault(); goFwd(); }
  if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { e.preventDefault(); $('#gsearch').focus(); }
  if (e.key === 'Escape' && $('#ov')) closeDialog();
});
// ---------- search ----------
function runSearch(q) {
  const box = $('#sres'); q = fold(q.trim());
  if (!L || q.length < 2) { box.hidden = true; box.innerHTML = ''; return; }
  // v24.6: accents ignored (Peña = pena), names that start with the search come first
  const starts = n => fold(n).split(' ').some(w => w.startsWith(q)) || fold(n).startsWith(q);
  const teams = L.teams.filter(t => fold(t.city + ' ' + t.name + ' ' + t.abbr).includes(q)).slice(0, 5);
  const coaches = [...L.teams.map(t => t.coach), ...L.coachPool, ...(L.coachArchive || [])].filter(c => fold(c.name).includes(q)).slice(0, 5);
  const players = Object.values(L.players).filter(p => fold(p.name).includes(q)).sort((a, b) => (a.retired ? 1 : 0) - (b.retired ? 1 : 0) || starts(b.name) - starts(a.name) || b.ovr - a.ovr).slice(0, 10);
  const pTag = p => p.retired ? 'Retired' : p.prospect ? 'Prospect S' + p.draftYear : p.team != null ? L.teams[p.team].abbr : 'Free agent';
  const sec = (title, items) => items.length ? `<div class="sk">${title}</div>${items.join('')}` : '';
  const html = sec('Teams', teams.map(t => `<div class="sr" data-st="${t.id}"><span>${tplain(t.id, true)}</span><span class="muted">${t.w}-${t.l}</span></div>`))
    + sec('Players', players.map(p => `<div class="sr" data-sp="${p.id}"><span>${esc(p.name)}${p.injury > 0 && !p.retired ? ` <span class="injx" title="${injTip(p)}">✚</span>` : ''} <span class="muted">${posLabel(p)}</span></span><span class="muted">${pTag(p)} · ${ovrTxt(p)}</span></div>`))
    + sec('Coaches', coaches.map(c => { const t = L.teams.find(x => x.coach.id === c.id); return `<div class="sr" data-sc="${c.id}"><span>${esc(c.name)}</span><span class="muted">${t ? t.abbr : c.retired ? 'Retired' : 'Available'} · ${c.ovr}</span></div>`; }));
  box.innerHTML = html || '<div class="sr muted">No matches.</div>';
  box.hidden = false;
  ui.sIdx = 0; const f = box.querySelector('.sr[data-st],.sr[data-sp],.sr[data-sc]'); if (f) f.classList.add('on');
}
const fold = x => String(x).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
$('#gsearch').addEventListener('input', e => runSearch(e.target.value));
$('#gsearch').addEventListener('keydown', e => {
  if (e.key === 'Escape') { e.target.value = ''; runSearch(''); e.target.blur(); return; }
  const items = [...document.querySelectorAll('#sres .sr[data-st],#sres .sr[data-sp],#sres .sr[data-sc]')];
  if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && items.length) {   // v24.6: arrow keys move through the results
    e.preventDefault(); ui.sIdx = ((ui.sIdx || 0) + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
    items.forEach((x, i) => x.classList.toggle('on', i === ui.sIdx)); items[ui.sIdx].scrollIntoView({ block: 'nearest' }); return;
  }
  if (e.key === 'Enter') { const f = items[ui.sIdx || 0] || items[0]; if (f) f.click(); }
});
document.addEventListener('click', e => {
  const r = e.target.closest('#sres .sr');
  if (!r) { if (!e.target.closest('.search')) $('#sres').hidden = true; return; }
  const d = r.dataset; $('#sres').hidden = true; $('#gsearch').value = '';
  backStack.push(snapNow());
  ui.player = null; ui.game = null; ui.coach = null;
  if (d.sp) ui.player = +d.sp;
  else if (d.sc) ui.coach = +d.sc;
  else if (d.st) { if (isUser(+d.st)) { location.hash = '#myteam'; render(); return; } ui.view = 'teams'; ui.team = +d.st; if (location.hash !== '#teams') history.replaceState(null, '', '#teams'); }
  render(); window.scrollTo(0, 0);
});
// ---------- v24.7: undo ----------
// Before your signing, release, buyout or trade, the whole league is copied (like a save). Until the next sim you can step back
// (last 3 moves). AI reactions inside the move (waivers, news, cap) roll back with it. The copies live in memory only.
const UNDO_MAX = 3; ui.undo = []; let undoDepth = 0;
function undoable(name, isMine, label) {
  const orig = window[name]; if (typeof orig !== 'function') return;
  window[name] = function (...args) {
    let snap = null, lab = '';
    if (undoDepth === 0 && L && L.user != null && !ui.busy && !ui.simClick) { try { if (isMine(...args)) { lab = label(...args); L.nextId = NEXT_ID; snap = JSON.stringify(L, (k, v) => k === '_used' ? undefined : v); } } catch (e) { snap = null; } }
    undoDepth++; let r; try { r = orig.apply(this, args); } finally { undoDepth--; }
    if (snap) { ui.undo.push({ json: snap, label: lab, slot: SLOT, s: L.season, ph: L.phase, day: L.day }); if (ui.undo.length > UNDO_MAX) ui.undo.shift(); }
    return r;
  };
}
undoable('signContract', (L, p, tid) => tid === L.user, (L, p, tid, amt, yrs, type) => `${type === 'extension' ? 'extension' : type === 'rookie' ? 'rookie deal' : 'signing'}: ${p.name}`);
undoable('release', (L, p) => p.team === L.user, (L, p) => `release: ${p.name}`);
undoable('buyout', (L, p) => p.team === L.user, (L, p) => `buyout: ${p.name}`);
undoable('executeTrade3', (L, tr) => tr.teams.includes(L.user), (L, tr) => `3-team trade with ${tr.teams.filter(t => t !== L.user).map(t => L.teams[t].abbr).join(' and ')}`);
undoable('executeTrade', (L, tr) => tr.a === L.user || tr.b === L.user, (L, tr) => `trade with ${L.teams[tr.a === L.user ? tr.b : tr.a].abbr}`);
const undoLive = () => (ui.undo || []).filter(u => u.slot === SLOT && L && u.s === L.season && u.ph === L.phase && u.day === L.day);
function undoBar() { const u = undoLive(); if (!u.length) return ''; const last = u[u.length - 1]; return `<div class="undobar"><span>Last move: <strong>${esc(last.label)}</strong></span><button class="sm" id="b-undo" title="Puts the league back to just before this move (only until you sim)">Undo</button>${u.length > 1 ? `<span class="muted">${u.length - 1} earlier move${u.length > 2 ? 's' : ''} can be undone too</span>` : ''}</div>`; }
function doUndo() {
  const live = undoLive(); if (!live.length) return; const u = live[live.length - 1];
  ui.undo = ui.undo.filter(x => x !== u);
  const view = { player: ui.player, team: ui.team };
  setLeague(JSON.parse(u.json));
  if (view.player != null && !L.players[view.player]) ui.player = null;
  ui.tGive = { players: [], picks: [] }; ui.tGet = { players: [], picks: [] }; ui.tradeMsg = { ok: true, done: true, msg: `Undone: ${u.label}.` };
  closeDialog(); save(); render();
}
// ---------- boot ----------
// test hook (read-only access for automated tests)
window.__pblCourt = { get L() { return L; }, scSpot, scRng };   // Phase 2: court.js reads the league and the shot-zone helpers
// Phase 3: app helpers for src/p3.js (it reads them through `with (PBL)`)
window.PBL = { get L() { return L; }, popupBusy, liveGame, ui, $, esc, f1, render, dialog, closeDialog, queueDialog, ovrTxt, lgTag, portrait, logo, isUser, awardTid, trophySvg, plink, tname, save };
window.__pbl = { get L() { return L; }, lvTicker: (g, n) => lvTicker(g, n), lvTickerLines: g => lvTickerLines(g), save: () => save(), render: () => render(), awardsDialog: t => awardsDialog(t), championDialog: () => championDialog(), trainCheckDialog: () => queueDialog(trainCheckDialog), openPlayer: id => { ui.player = id; render(); }, review: S => seasonReviewDialog(S), get ui() { return ui; }, interruptKind: () => interruptKind(), dlg: n => runDialog({ iv: ivDialog, mtg: mtgDialog, drama: dramaDialog }[n]), v30: { logo, logoBody, hexContrast, pipeLogo, todo: { on: () => todoOn(), state: () => todoState(), group: () => todoGroup(), list: g => todoList(g), open: g => todoOpenCount(g), stopEnd: e => todoStopEnd(e) } }, pipeUi: { pipeSchool: p => pipeSchool(p), pipeLatest: () => pipeLatest(), stockChip: p => stockChip(p) } };   // v29: test hooks
(async () => {
  $('#main').innerHTML = '<p class="muted">Loading your league…</p>';
  const saved = await load();
  if (saved && saved.version === 4 && saved.teams && saved.players) { setLeague(saved); route(); }
  else {
    let old = null; try { old = localStorage.getItem('league-v3') || localStorage.getItem('mbl-league-v1'); } catch (e) {}
    try { if (!old) { const db = await new Promise((res, rej) => { const r = indexedDB.open('mbl-league', 1); r.onupgradeneeded = () => r.result.createObjectStore('s'); r.onsuccess = () => res(r.result); r.onerror = rej; }); old = await new Promise(res => { const q = db.transaction('s', 'readonly').objectStore('s').get('league-v3'); q.onsuccess = () => res(q.result); q.onerror = () => res(null); }); } } catch (e) {}
    L = null; ui.setupOpen = true; ui.setupNote = old ? 'The Pacific Basketball League has 16 teams in two conferences, a 58-game season and new contract rules, so it needs a new league. Your Meridian league is still stored under the old version.' : null; render();
  }
})();
})();