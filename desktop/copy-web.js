// Copies the game files (the same ones the web version uses) into desktop/dist for the desktop app.
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'), OUT = path.join(__dirname, 'dist');
fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
const copy = rel => { const a = path.join(ROOT, rel), b = path.join(OUT, rel); fs.mkdirSync(path.dirname(b), { recursive: true }); fs.copyFileSync(a, b); };
for (const f of ['index.html', 'manifest.webmanifest']) copy(f);
for (const dir of ['src', 'icons']) for (const f of fs.readdirSync(path.join(ROOT, dir))) if (!f.startsWith('.') && fs.statSync(path.join(ROOT, dir, f)).isFile() && !f.endsWith('.html')) copy(path.join(dir, f));
console.log('copied game files to', OUT);
