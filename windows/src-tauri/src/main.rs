// Prevents a console window appearing on Windows in release builds
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::sync::Mutex;
use arboard::Clipboard;
use enigo::{Direction, Enigo, Key, Keyboard, Settings as EnigoSettings};
use serde::{Deserialize, Serialize};
use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    AppHandle, Manager, State,
};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

// ── App state ────────────────────────────────────────────────────────────────

#[derive(Default)]
struct AppState {
    selected_text: Mutex<String>,
    cursor_pos: Mutex<(i32, i32)>,
}

// ── Config ───────────────────────────────────────────────────────────────────

#[derive(Serialize, Deserialize, Clone, Debug)]
struct PolishlyConfig {
    #[serde(rename = "geminiApiKey", default)]
    gemini_api_key: String,
    #[serde(rename = "geminiModel", default = "default_model")]
    gemini_model: String,
}

fn default_model() -> String {
    "gemini-2.5-flash-lite".to_string()
}

impl Default for PolishlyConfig {
    fn default() -> Self {
        Self {
            gemini_api_key: String::new(),
            gemini_model: default_model(),
        }
    }
}

fn config_path() -> std::path::PathBuf {
    let mut path = dirs::config_dir().unwrap_or_else(|| std::path::PathBuf::from("."));
    path.push("Polishly");
    path.push("config.json");
    path
}

// ── Native dialog helpers ─────────────────────────────────────────────────────

#[cfg(windows)]
fn native_dialog(title: &str, message: &str, style: u32) {
    use std::ffi::OsStr;
    use std::iter::once;
    use std::os::windows::ffi::OsStrExt;
    let title_w: Vec<u16> = OsStr::new(title).encode_wide().chain(once(0)).collect();
    let msg_w: Vec<u16> = OsStr::new(message).encode_wide().chain(once(0)).collect();
    unsafe { winapi::um::winuser::MessageBoxW(std::ptr::null_mut(), msg_w.as_ptr(), title_w.as_ptr(), style); }
}

#[cfg(not(windows))]
fn native_dialog(_title: &str, _message: &str, _style: u32) {}

fn info_dialog(message: &str) {
    native_dialog("Polishly", message, 0x00000040); // MB_OK | MB_ICONINFORMATION
}

// ── Tauri commands ────────────────────────────────────────────────────────────

#[tauri::command]
fn get_settings() -> PolishlyConfig {
    let path = config_path();
    if let Ok(content) = std::fs::read_to_string(&path) {
        if let Ok(config) = serde_json::from_str::<PolishlyConfig>(&content) {
            return config;
        }
    }
    PolishlyConfig::default()
}

#[tauri::command]
fn save_settings(api_key: String, model: String) -> Result<(), String> {
    let config = PolishlyConfig {
        gemini_api_key: api_key,
        gemini_model: model,
    };
    let path = config_path();
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let json = serde_json::to_string_pretty(&config).map_err(|e| e.to_string())?;
    std::fs::write(&path, json).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn get_selected_text(state: State<AppState>) -> String {
    state.selected_text.lock().unwrap().clone()
}

#[tauri::command]
fn show_popup(app: AppHandle, state: State<AppState>) {
    if let Some(icon_win) = app.get_webview_window("icon") {
        let _ = icon_win.hide();
    }
    let (cx, cy) = *state.cursor_pos.lock().unwrap();
    if let Some(popup) = app.get_webview_window("popup") {
        let _ = popup.set_position(tauri::PhysicalPosition::new(cx + 10, cy - 40));
        let _ = popup.show();
        let _ = popup.set_focus();
    }
}

#[tauri::command]
fn replace_text(text: String) -> Result<(), String> {
    let mut clipboard = Clipboard::new().map_err(|e| e.to_string())?;
    clipboard.set_text(text).map_err(|e| e.to_string())?;
    std::thread::sleep(std::time::Duration::from_millis(80));
    let mut enigo = Enigo::new(&EnigoSettings::default()).map_err(|e| e.to_string())?;
    enigo.key(Key::Control, Direction::Press).map_err(|e| e.to_string())?;
    enigo.key(Key::Unicode('v'), Direction::Click).map_err(|e| e.to_string())?;
    enigo.key(Key::Control, Direction::Release).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn hide_all_windows(app: AppHandle) {
    for label in ["icon", "popup"] {
        if let Some(w) = app.get_webview_window(label) {
            let _ = w.hide();
        }
    }
}

#[tauri::command]
fn open_settings(app: AppHandle) {
    if let Some(w) = app.get_webview_window("settings") {
        let _ = w.show();
        let _ = w.set_focus();
    }
}

// ── Hotkey logic ──────────────────────────────────────────────────────────────

fn capture_selection() -> Option<String> {
    let mut clipboard = Clipboard::new().ok()?;
    let prev_text = clipboard.get_text().ok();
    let _ = clipboard.set_text(String::new());
    std::thread::sleep(std::time::Duration::from_millis(30));

    let mut enigo = Enigo::new(&EnigoSettings::default()).ok()?;
    let _ = enigo.key(Key::Control, Direction::Press);
    let _ = enigo.key(Key::Unicode('c'), Direction::Click);
    let _ = enigo.key(Key::Control, Direction::Release);
    std::thread::sleep(std::time::Duration::from_millis(150));

    let captured = clipboard.get_text().ok().and_then(|t| {
        let trimmed = t.trim().to_string();
        if trimmed.is_empty() { None } else { Some(trimmed) }
    });

    if let Some(prev) = prev_text {
        let _ = clipboard.set_text(prev);
    }
    captured
}

#[cfg(windows)]
fn get_cursor_pos() -> (i32, i32) {
    use winapi::shared::windef::POINT;
    use winapi::um::winuser::GetCursorPos;
    let mut pt = POINT { x: 0, y: 0 };
    unsafe { GetCursorPos(&mut pt); }
    (pt.x, pt.y)
}

#[cfg(not(windows))]
fn get_cursor_pos() -> (i32, i32) { (200, 200) }

// ── Entry point ───────────────────────────────────────────────────────────────

fn main() {
    tauri::Builder::default()
        .manage(AppState::default())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .setup(|app| {
            // ── System tray ──
            let settings_item = MenuItem::with_id(app, "settings",     "Settings",          true, None::<&str>)?;
            let quit_item     = MenuItem::with_id(app, "quit",         "Quit Polishly",     true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&settings_item, &quit_item])?;

            let mut tray = TrayIconBuilder::new()
                .tooltip("Polishly — Win+Shift+P to polish selected text")
                .menu(&menu)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "settings" => open_settings(app.clone()),
                    "quit"     => app.exit(0),
                    _ => {}
                });

            // Only attach icon if one is bundled — avoids a panic if assets are missing
            if let Some(icon) = app.default_window_icon() {
                tray = tray.icon(icon.clone());
            }

            tray.build(app)?;

            // ── Global hotkey: Win+Shift+P ──
            let app_handle = app.handle().clone();
            let shortcut = Shortcut::new(Some(Modifiers::SUPER | Modifiers::SHIFT), Code::KeyP);

            app.global_shortcut().on_shortcut(shortcut, move |_app, _shortcut, event| {
                if event.state != ShortcutState::Pressed { return; }
                let cursor = get_cursor_pos();
                let handle = app_handle.clone();
                std::thread::spawn(move || {
                    let Some(text) = capture_selection() else { return };
                    let state = handle.state::<AppState>();
                    *state.selected_text.lock().unwrap() = text;
                    *state.cursor_pos.lock().unwrap() = cursor;
                    if let Some(icon_win) = handle.get_webview_window("icon") {
                        let _ = icon_win.set_position(tauri::PhysicalPosition::new(
                            cursor.0 + 10, cursor.1 - 40,
                        ));
                        let _ = icon_win.show();
                    }
                });
            })?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_settings,
            save_settings,
            get_selected_text,
            replace_text,
            show_popup,
            hide_all_windows,
            open_settings,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Polishly");
}
