# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

---

## [1.0.0] - 2026-03-09

### Added

- Initial release of ZPL Label Preview as a Manifest V3 Chrome/Chromium extension.
- Real-time detection of new ZPL print jobs by polling the PlexComponentHost log file every 3 seconds while the popup is open.
- Background service worker alarm that continues polling every 30 seconds while the popup is closed, so no jobs are missed.
- Automatic daily log rotation support — the extension derives the current date to build the correct `notifier-YYYYMMDD.log` filename each day.
- Label rendering via the [labelary.com](https://labelary.com) API with configurable output in PNG, JPG, or PDF format.
- Configurable label dimensions (width × height in inches) and rendering resolution (8, 12, or 24 dpmm).
- Clockwise image rotation (↻) with an optional "Persist" lock that applies the selected rotation to every subsequent label automatically.
- Scroll-to-zoom interaction on the label preview image.
- Label history carousel storing up to 100 labels, with both carousel view and prev/next pagination controls.
- Auto-download feature that saves new labels to a user-configurable subfolder inside the system Downloads directory.
- Preview pop-out window that opens a floating browser window for each new label, with a configurable auto-close timer (in seconds).
- OS-level notifications via `chrome.notifications` when a new label is detected.
- Opt-in sound chime notification that plays an audio alert when a new print job arrives.
- Keyboard shortcuts: `←` / `→` to navigate label history, `R` to rotate clockwise, `Z` to reset zoom.
- "Copy ZPL" button to copy the raw ZPL source for the currently displayed label to the clipboard.
- "Clear History" button to wipe all stored labels from local storage.
- Debug mode panel showing the raw log file tail and all detected ZPL blocks to aid troubleshooting.
- Lightweight Python 3 HTTP server workflow (`python3 -m http.server 8765 --directory ...`) to expose the local log directory to the extension, working around Chrome's filesystem security restrictions.
- Full cross-platform support for macOS and Windows with Chrome, Microsoft Edge, and Brave.
- Options page with a full settings reference covering server URL, poll intervals, label dimensions, DPI, output format, auto-download path, pop-out behavior, notification preferences, rotation persistence, history limit, and debug mode.
- All label history and user settings persisted exclusively in `chrome.storage.local` — no remote data storage.
