# Agent Dashboard Browser Extension

This folder can be packaged as a Chromium extension for Chrome or Edge.

## Build

```powershell
npm run extension:package
```

The generated files are written to:

- `dist/agent-dashboard-extension`
- `dist/agent-dashboard-extension.zip`

## Local Install

1. Open `chrome://extensions` or `edge://extensions`.
2. Enable Developer mode.
3. Choose **Load unpacked**.
4. Select `Agent/dist/agent-dashboard-extension`.

## Store Upload

Upload `Agent/dist/agent-dashboard-extension.zip` to the Chrome Web Store or Microsoft Edge Add-ons dashboard.

## Runtime Notes

- The extension uses `index.html` as a new-tab page.
- Remote JavaScript is not loaded; third-party runtime code is bundled locally.
- Static data works offline after packaging.
- Weather still calls the configured QWeather API directly.
- Stock and Bilibili manual refresh need a server-side updater in a published extension; without that, the extension falls back to bundled JSON data.
- The 3D pet runtime is skipped in the extension package to avoid Chrome Web Store remote-code checks from bundled decoder URLs.
