// Pacific Basketball League desktop app.
// The game itself is the same web page as the browser version (desktop/dist, copied by copy-web.js).
// These commands give it real save files: <Documents>/Pacific Basketball League/saves/<slot>.pbl (gzip JSON),
// plus slots.json (the list) and exports to the same folder's exports/ subfolder.
use std::fs;
use std::path::PathBuf;
use tauri::Manager;

fn base_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    // Documents if the system has one; else ~/Documents if it exists; else the app's own data folder
    if let Ok(d) = app.path().document_dir() { return Ok(d.join("Pacific Basketball League")); }
    if let Ok(h) = app.path().home_dir() { let d = h.join("Documents"); if d.is_dir() { return Ok(d.join("Pacific Basketball League")); } }
    Ok(app.path().app_data_dir().map_err(|e| e.to_string())?.join("Pacific Basketball League"))
}

fn saves_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let d = base_dir(app)?.join("saves");
    fs::create_dir_all(&d).map_err(|e| e.to_string())?;
    Ok(d)
}

// only plain file names: letters, digits, - _ . (no folders)
fn safe_name(name: &str) -> Result<String, String> {
    let ok = !name.is_empty()
        && name.len() <= 120
        && !name.starts_with('.')
        && name.chars().all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_' || c == '.');
    if ok { Ok(name.to_string()) } else { Err(format!("bad file name: {name}")) }
}

// Big files go as raw bytes (not JSON number arrays): the name travels in the "x-name" header.
fn raw_req(request: &tauri::ipc::Request) -> Result<(String, Vec<u8>), String> {
    let name = request.headers().get("x-name").and_then(|v| v.to_str().ok()).ok_or("missing x-name")?.to_string();
    let tauri::ipc::InvokeBody::Raw(data) = request.body() else { return Err("expected raw bytes".into()) };
    Ok((safe_name(&name)?, data.clone()))
}

#[tauri::command]
fn save_file(app: tauri::AppHandle, request: tauri::ipc::Request) -> Result<(), String> {
    let (name, data) = raw_req(&request)?;
    let dir = saves_dir(&app)?;
    // write to a temp file first, then rename: a crash mid-write never leaves a half-written save
    let tmp = dir.join(format!("{name}.tmp"));
    fs::write(&tmp, &data).map_err(|e| e.to_string())?;
    fs::rename(&tmp, dir.join(&name)).map_err(|e| e.to_string())
}

#[tauri::command]
fn read_file(app: tauri::AppHandle, name: String) -> Result<tauri::ipc::Response, String> {
    let p = saves_dir(&app)?.join(safe_name(&name)?);
    let data = if p.exists() { fs::read(p).map_err(|e| e.to_string())? } else { vec![] };
    Ok(tauri::ipc::Response::new(data))
}

#[tauri::command]
fn delete_file(app: tauri::AppHandle, name: String) -> Result<(), String> {
    let p = saves_dir(&app)?.join(safe_name(&name)?);
    if p.exists() { fs::remove_file(p).map_err(|e| e.to_string())?; }
    Ok(())
}

#[tauri::command]
fn list_files(app: tauri::AppHandle) -> Result<Vec<String>, String> {
    let mut out = vec![];
    for e in fs::read_dir(saves_dir(&app)?).map_err(|e| e.to_string())? {
        if let Ok(e) = e { if let Some(n) = e.file_name().to_str() { if !n.ends_with(".tmp") { out.push(n.to_string()); } } }
    }
    out.sort();
    Ok(out)
}

// "Export this league" and other downloads: saved to <Documents>/Pacific Basketball League/exports
#[tauri::command]
fn export_file(app: tauri::AppHandle, request: tauri::ipc::Request) -> Result<String, String> {
    let (name, data) = raw_req(&request)?;
    let d = base_dir(&app)?.join("exports");
    fs::create_dir_all(&d).map_err(|e| e.to_string())?;
    let p = d.join(name);
    fs::write(&p, &data).map_err(|e| e.to_string())?;
    Ok(p.to_string_lossy().to_string())
}

#[tauri::command]
fn saves_folder(app: tauri::AppHandle) -> Result<String, String> {
    Ok(base_dir(&app)?.to_string_lossy().to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![save_file, read_file, delete_file, list_files, export_file, saves_folder])
        .run(tauri::generate_context!())
        .expect("error while running the Pacific Basketball League app");
}
