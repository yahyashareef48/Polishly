Place the following icon files here before building:

  icon.ico   — Windows icon (multi-size ICO, 16/32/48/128px)
               Convert from: ../browser/icons/icon.svg
               Tool: https://convertio.co/svg-ico/ or Inkscape

  icon.png   — 128x128 PNG (used by Tauri for tray icon fallback)
               Copy from: ../browser/icons/icon128.png

The tray icon is loaded from icon.png at runtime.
The installer uses icon.ico.
