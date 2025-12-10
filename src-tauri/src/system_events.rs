use tauri::{AppHandle, Manager, Runtime, Emitter};
use rusqlite::Connection;
use std::sync::Mutex;

pub fn setup_system_event_listeners<R: Runtime>(app: &tauri::App<R>) {
    let app_handle = app.handle().clone();

    // For macOS-specific system events (sleep, lock)
    #[cfg(target_os = "macos")]
    setup_macos_system_events(app_handle);
}

#[cfg(target_os = "macos")]
fn setup_macos_system_events<R: Runtime>(app_handle: AppHandle<R>) {
    use std::process::Command;
    use std::sync::{Arc, atomic::{AtomicBool, Ordering}};
    use std::time::Duration;

    let app_handle = Arc::new(app_handle);
    let was_locked = Arc::new(AtomicBool::new(false));

    // Spawn a background thread to check for screen lock state
    std::thread::spawn(move || {
        loop {
            std::thread::sleep(Duration::from_secs(2));

            // Check if screen is locked using macOS command
            let output = Command::new("python3")
                .arg("-c")
                .arg("import Quartz; import sys; sys.exit(0 if Quartz.CGSessionCopyCurrentDictionary() else 1)")
                .output();

            if let Ok(output) = output {
                let is_locked = !output.status.success();

                if is_locked && !was_locked.load(Ordering::Relaxed) {
                    // Screen just got locked
                    println!("Screen locked detected - stopping all running sessions");

                    // Stop all running sessions in database
                    if let Some(db) = app_handle.try_state::<Mutex<Connection>>() {
                        if let Ok(_stopped) = crate::commands::sessions::stop_all_running_sessions(db.clone()) {
                            println!("All running sessions stopped due to screen lock");
                        }
                    }

                    let _ = app_handle.emit("screen-lock", ());
                    was_locked.store(true, Ordering::Relaxed);
                } else if !is_locked && was_locked.load(Ordering::Relaxed) {
                    // Screen just got unlocked
                    println!("Screen unlocked detected");
                    was_locked.store(false, Ordering::Relaxed);
                }
            }
        }
    });
}
