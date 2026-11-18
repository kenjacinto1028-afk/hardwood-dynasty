// Phase C (Nov 18 2026): desktop app bridge (Tauri). Does nothing in a normal browser.
// In the desktop app every save is also written as a real file: Documents/Pacific Basketball League/saves/<slot>.pbl (gzip JSON) + slots.json.
// On start, files newer than the app's own storage win (so a league survives the app's web data being cleared, or can be copied in from another PC).
// Exports / downloads go to Documents/Pacific Basketball League/exports. Loaded before app.js (app.js calls DESK.* from saveNow / load).
const DESK = (function () {
  const T = window.__TAURI__; if (!T || !T.core) return null;
  const inv = (c, a, o) => T.core.invoke(c, a, o);
  const raw = async (cmd, name, data) => { const buf = data instanceof Blob ? new Uint8Array(await data.arrayBuffer()) : typeof data === 'string' ? new TextEncoder().encode(data) : data; return inv(cmd, buf, { headers: { 'x-name': name } }); };
  const fname = id => String(id).replace(/[^A-Za-z0-9_.-]/g, '_') + '.pbl';
  async function readText(name) {
    const b = await inv('read_file', { name }); const u = new Uint8Array(b); if (!u.length) return null;
    if (u[0] === 0x1f && u[1] === 0x8b) { const s = new Blob([u]).stream().pipeThrough(new DecompressionStream('gzip')); return await new Response(s).text(); }
    return new TextDecoder().decode(u);
  }
  // after every save: the league file + the list of leagues
  async function mirror(slot, data, slots) {
    let d = data; if (typeof d === 'string' && window.CompressionStream) { try { d = await new Response(new Blob([d]).stream().pipeThrough(new CompressionStream('gzip'))).blob(); } catch (e) { } }
    await raw('save_file', fname(slot), d);
    await raw('save_file', 'slots.json', JSON.stringify(slots));
  }
  async function remove(slot, slots) { await inv('delete_file', { name: fname(slot) }); if (slots) await raw('save_file', 'slots.json', JSON.stringify(slots)); }
  // returns the leagues on disk that are newer than (or missing from) the app's storage: [{ info, text }]
  async function newer(idbSlots) {
    let list = []; try { const t = await readText('slots.json'); list = t ? JSON.parse(t) : []; } catch (e) { list = []; }
    const have = {}; for (const s of idbSlots || []) have[s.id] = s.updated || 0;
    const out = [];
    for (const s of list) if (!(s.id in have) || (s.updated || 0) > have[s.id] + 1000) { try { const text = await readText(fname(s.id)); if (text && JSON.parse(text).teams) out.push({ info: s, text }); } catch (e) { } }
    return out;
  }
  const folder = () => inv('saves_folder');
  async function openFolder() { const p = await folder(); try { await inv('plugin:opener|open_path', { path: p }); } catch (e) { return p; } return p; }
  // Export league / player card PNGs / share files: the game asks window.claude.use('downloads') first, so answer it here
  if (!window.claude) window.claude = {};
  if (!window.claude.use) window.claude.use = async k => k === 'downloads' ? { save: async ({ filename, data }) => { const p = await raw('export_file', String(filename).replace(/[^A-Za-z0-9_.-]/g, '_'), data); DESK.lastExport = p; return p; } } : null;
  // Saves popup: where the files are
  function savesExtra() {
    const box = document.getElementById('x-msg'); if (!box) return;
    const div = document.createElement('div'); div.className = 'muted'; div.style.cssText = 'font-size:12px;margin:6px 0';
    div.innerHTML = 'Desktop app: every save is also a file in <strong id="dk-path">Documents / Pacific Basketball League</strong> (exports go in its "exports" folder). Copy that folder to move your leagues to another computer. <button class="sm" id="dk-open">Open the folder</button>';
    box.parentNode.insertBefore(div, box);
    folder().then(p => { const e = div.querySelector('#dk-path'); if (e && p) e.textContent = p; }).catch(() => { });
    div.querySelector('#dk-open').onclick = async () => { const p = await openFolder(); if (p) box.textContent = 'Saves folder: ' + p; };
  }
  return { mirror, remove, newer, folder, openFolder, savesExtra, readText, lastExport: null };
})();
window.DESK = DESK;
