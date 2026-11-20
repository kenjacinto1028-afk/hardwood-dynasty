# Desktop app (Windows, Mac, Linux)

The desktop app is the same game in its own window. It doesn't need a browser and works offline. Leagues are saved as real files.

## Get the installers (no coding)
1. On GitHub, open the repo, go to **Actions**, pick **Build desktop app**, then click **Run workflow**. It takes about 15-25 minutes.
2. Go to **Releases**. A release called "Hardwood Dynasty v1.3.0" holds the installers:
   - Windows: `.exe` (or `.msi`)
   - Mac: `.dmg` (works on Intel and Apple chips)
   - Linux: `.AppImage` or `.deb`
3. Download the one for your computer and install it. Click **Publish release** if you want a public download link.

The app isn't signed yet, so the computer may warn you the first time:
- Windows: click "More info", then "Run anyway".
- Mac: right-click the app, choose Open, then Open again.

## Saves
- Every save is also a file in **Documents / Pacific Basketball League / saves** (`.pbl` = compressed league).
- To move leagues to another computer, copy that folder over. The newest copy of each league is used when the app starts.
- "Export this league" and player-card pictures go into **Documents / Pacific Basketball League / exports**.
- The game also keeps its 3 automatic backups per league (Saves popup).

## New version
Bump `version` in `desktop/package.json`, `desktop/src-tauri/Cargo.toml` and `desktop/src-tauri/tauri.conf.json`. Then run the workflow again, or push a tag like `v1.0.1`.

## For developers
- `desktop/copy-web.js` copies `index.html`, `src/` and `icons/` into `desktop/dist`. The app shows that folder.
- `desktop/src-tauri/src/lib.rs` holds the save-file commands (`save_file`, `read_file`, `list_files`, `delete_file`, `export_file`, `saves_folder`). `src/desk.js` connects the game to them and does nothing in a normal browser.
- To build locally: `cd desktop && npm install && npm run build`. This needs Rust, plus on Linux the webkit2gtk-4.1 dev packages.
- Test the bridge without the app: `node tools/browser-desk.js`. It uses a fake backend.

## Later (not done yet)
- Phone apps (Android / iPhone): Tauri can build these from the same project (`tauri android init` / `tauri ios init`). Store accounts are needed.
- Code signing, so there are no warnings: needs a Windows certificate and an Apple Developer account ($99/yr).
- Auto-update: Tauri's updater plugin plus a signing key.
- itch.io page: make a free itch.io account, create a project, and upload the installers from Releases (or use their `butler` tool).
