# ZPL Label Preview — Installation & Usage Guide

> **Reading level:** This guide is written for anyone who can follow numbered steps.
> No programming knowledge is required. Technical terms are explained the first time they appear.

---

## Table of Contents

1. [What Does This Extension Do?](#1-what-does-this-extension-do)
2. [What You Need Before You Start](#2-what-you-need-before-you-start)
3. [Step 1 — Download the Extension](#3-step-1--download-the-extension)
4. [Step 2 — Load the Extension Into Your Browser](#4-step-2--load-the-extension-into-your-browser)
5. [Step 3 — Start the Log Server](#5-step-3--start-the-log-server)
6. [Step 4 — Verify the Connection](#6-step-4--verify-the-connection)
7. [Using the Extension — The Popup](#7-using-the-extension--the-popup)
8. [Settings Reference](#8-settings-reference)
9. [Keyboard Shortcuts](#9-keyboard-shortcuts)
10. [Auto-Starting the Server (Optional)](#10-auto-starting-the-server-optional)
11. [Troubleshooting](#11-troubleshooting)
12. [Frequently Asked Questions](#12-frequently-asked-questions)

---

## 1. What Does This Extension Do?

When your warehouse or shipping software (PlexComponentHost) sends a label to a printer, it writes a record of that print job into a **log file** on your computer. This extension reads that log file, extracts the label design (in a format called **ZPL** — Zebra Programming Language), and turns it into an image you can see, zoom into, rotate, and download — all inside your web browser.

**Think of it as a "print preview" for your label printer, showing up automatically every time a label is sent.**

```
Your software sends a label
        ↓
PlexComponentHost writes it to a log file on your hard drive
        ↓
ZPL Label Preview reads the log file (via a local mini web server)
        ↓
The label design is sent to labelary.com to be turned into an image
        ↓
The image appears in your browser toolbar popup within seconds
```

> **Privacy note:** The only data that leaves your computer is the raw label design (ZPL code), which is sent to [labelary.com](https://labelary.com) for rendering. No names, addresses, or other business data is transmitted anywhere else.

---

## 2. What You Need Before You Start

Before installing, make sure you have the following:

### ✅ A supported browser

This extension works with any **Chromium-based browser**:
- **Google Chrome** (recommended)
- **Microsoft Edge**
- **Brave**

It does **not** work with Firefox or Safari.

### ✅ Python 3

Python 3 is a free programming language that we use to run a tiny local web server. The extension cannot read your log files directly (Chrome's security rules prevent it), so Python creates a bridge.

**Check if Python is already installed:**

- **Mac:** Open Terminal (press `⌘ Space`, type `Terminal`, press Enter) and run:
  ```
  python3 --version
  ```
  If you see something like `Python 3.11.2`, you're good. If you get an error, download Python 3 from [python.org/downloads](https://www.python.org/downloads/).

- **Windows:** Open Command Prompt (press `Windows Key`, type `cmd`, press Enter) and run:
  ```
  python --version
  ```
  If you see `Python 3.x.x`, you're good. If not, download from [python.org/downloads](https://www.python.org/downloads/). During installation, **check the box that says "Add Python to PATH"** — this is important.

### ✅ PlexComponentHost is installed and running

The extension reads log files created by PlexComponentHost. If PlexComponentHost is not installed or has never printed a label, there will be nothing to preview.

---

## 3. Step 1 — Download the Extension

1. Go to the [ZPL Label Preview GitHub page](https://github.com/rcepek/zpl-label-preview)
2. Click the green **Code** button
3. Click **Download ZIP**
4. Once downloaded, find the ZIP file (usually in your Downloads folder) and **extract/unzip it**
   - **Mac:** Double-click the ZIP file
   - **Windows:** Right-click the ZIP file → "Extract All…" → click Extract

You should now have a folder called `zpl-label-preview` (or `zpl-label-preview-main`). Remember where it is — you'll need it in the next step.

> **Tip:** Move this folder somewhere permanent, like your Documents folder. The browser loads the extension directly from this folder, so if you delete or move it later, the extension will stop working.

---

## 4. Step 2 — Load the Extension Into Your Browser

Chrome and Edge do not install extensions from ZIP files the usual way. Instead, we load it in **Developer Mode** — don't let the name worry you, it just means you can load extensions from your own computer.

### Google Chrome

1. Open Chrome and type `chrome://extensions` in the address bar, then press Enter
2. In the top-right corner, toggle **Developer mode** to ON (the toggle should turn blue)
3. Click the **Load unpacked** button that appears
4. Navigate to the `zpl-label-preview` folder you extracted and click **Select** (Mac) or **Select Folder** (Windows)

### Microsoft Edge

1. Open Edge and type `edge://extensions` in the address bar, then press Enter
2. In the left sidebar, toggle **Developer mode** to ON
3. Click **Load unpacked**
4. Select the `zpl-label-preview` folder

### Brave

1. Open Brave and type `brave://extensions` in the address bar, then press Enter
2. Toggle **Developer mode** to ON (top-right)
3. Click **Load unpacked**
4. Select the `zpl-label-preview` folder

---

**After loading, you should see the ZPL Label Preview card appear on the extensions page, and a label icon should appear in your browser toolbar.**

> If the toolbar icon isn't visible, click the **puzzle piece icon** (🧩) in the top-right of your browser and click the pin icon next to "ZPL Label Preview" to keep it visible.

---

## 5. Step 3 — Start the Log Server

This is the step that lets the extension read your log files. You need to run a small local web server using Python. **This must be running whenever you want the extension to work.**

### Mac — Easy Method (Double-click)

In the `zpl-label-preview` folder you downloaded, open the `scripts` folder and double-click **`start-server.command`**.

A Terminal window will open and you'll see something like:
```
Starting ZPL Label Preview log server...
Serving: /Users/yourname/Library/Logs/PlexComponentHost
URL:     http://localhost:8765

Press Ctrl+C to stop.
Serving HTTP on :: port 8765 ...
```

**Keep this window open.** Closing it stops the server and the extension won't be able to read new labels.

> **First time on Mac:** macOS may block the script with a security warning ("cannot be opened because the developer cannot be verified"). To fix this: right-click `start-server.command` → click **Open** → click **Open** again in the dialog. You only need to do this once.

### Mac — Manual Method

Open Terminal and paste this command, then press Enter:
```bash
python3 -m http.server 8765 --directory ~/Library/Logs/PlexComponentHost
```

### Windows — Easy Method (Double-click)

In the `zpl-label-preview\scripts` folder, double-click **`start-server.bat`**.

A Command Prompt window will open. Keep it open while using the extension.

> **Windows note:** If you see a "Windows protected your PC" SmartScreen warning, click **More info** → **Run anyway**.

### Windows — Manual Method

Open Command Prompt and run:
```
python -m http.server 8765 --directory "%LOCALAPPDATA%\PlexComponentHost\logs"
```

> **Important:** The log directory path above is the default. If PlexComponentHost stores logs somewhere else on your machine, adjust the path accordingly.

---

## 6. Step 4 — Verify the Connection

Before printing a real label, confirm everything is connected:

1. Make sure the Python server is running (Terminal/Command Prompt window is open and showing output)
2. Click the ZPL Label Preview icon in your browser toolbar
3. Click **Open Settings** (or right-click the icon → Options)
4. Click the **Test Connection** button

You should see a green message like: `Connected — notifier-20260309.log found`

If you see a red error, see the [Troubleshooting](#11-troubleshooting) section.

---

## 7. Using the Extension — The Popup

Click the extension icon in your browser toolbar at any time to open the popup.

### The Main View

```
┌─────────────────────────────────────────┐
│  4"×6" · PNG · Printed 3/9/26 5:38 PM  📋 ⚙ │
├─────────────────────────────────────────┤
│                                         │
│           [Label Image]                 │
│                                         │
├─────────────────────────────────────────┤
│        ↻  90°  [✓ Persist]   100%      │
├─────────────────────────────────────────┤
│  [← Prev]   Label 2 of 5   [Next →]    │
├─────────────────────────────────────────┤
│  [Download]          [Open full size]   │
├─────────────────────────────────────────┤
│  ← → navigate · R rotate · scroll zoom │  Clear history │
└─────────────────────────────────────────┘
```

### Every Button and Element Explained

| Element | What it does |
|---|---|
| **Label info** (top left) | Shows size, format, and when the label was printed |
| **📋 Copy ZPL** | Copies the raw label code to your clipboard (useful for support or debugging) |
| **⚙ Settings** | Opens the Settings page |
| **Label image** | The rendered preview of your label. Click it to open full-size in a new tab |
| **↻ Rotate** | Rotates the label 90° clockwise each time you click. Useful for landscape-format labels |
| **Rotation degree** | Shows the current rotation (0°, 90°, 180°, 270°) |
| **Persist checkbox** | When checked, the rotation stays the same when you switch between labels |
| **Zoom %** | Appears when you've scrolled to zoom in. Shows the current zoom level |
| **← / → buttons** | Navigate through your label history (shown when you have more than 1 label) |
| **Label X of Y** | Shows your position in the label history |
| **Download** | Downloads the current label to your Downloads folder (asks where to save) |
| **Open full size** | Opens the label image in a new browser tab at full resolution |
| **Clear history** | Deletes all stored labels. You'll be asked to confirm first |

### Carousel View

If you enable **Carousel View** in Settings, the prev/next buttons are replaced by a strip of thumbnails at the bottom. Click any thumbnail to jump to that label. Labels are grouped by date when you have history from multiple days.

### States the Popup Can Be In

| What you see | What it means |
|---|---|
| Spinning circle + "Watching for print jobs…" | Extension is connected and waiting. No labels have been detected yet today |
| A label image | A label was found. You're seeing the most recent one |
| Red error message | There's a connection problem — see Troubleshooting |

---

## 8. Settings Reference

Open Settings by right-clicking the extension icon → **Options**, or by clicking the ⚙ icon inside the popup.

---

### Log File Server

| Setting | What it does |
|---|---|
| **Mac / Windows tabs** | Shows the correct Terminal command for your OS. Click **Copy** to copy it |
| **Port** | The port number the Python server runs on. Default is `8765`. Only change this if another program is already using that port |
| **Test Connection** | Checks whether the server is running and the log file is accessible |
| **Re-process today's file from start** | Forces the extension to re-read the entire log file from the beginning. Use this if you think you've missed some labels |

---

### Label Size

Enter your physical label dimensions here. **These must match the label stock in your printer.** Getting this wrong won't break anything, but the preview may look stretched or cropped.

- **Width (in):** Label width in inches (e.g. `4` for a 4-inch wide label)
- **Height (in):** Label height in inches (e.g. `6` for a 4×6 shipping label)

---

### Printer DPI

This controls the resolution the label is rendered at. Match it to your printer:

| Setting | Printer type |
|---|---|
| **8 dpmm (203 DPI)** | Most standard Zebra label printers (ZP450, GK420, GX420, etc.) |
| **12 dpmm (300 DPI)** | High-quality Zebra printers (ZT230, ZT410 in 300 DPI mode) |
| **24 dpmm (600 DPI)** | Ultra-high-resolution printers |

When in doubt, leave it at **8 dpmm**. If barcodes look blurry, try 12 dpmm.

---

### Output Format

Controls the file format when you download a label:

| Format | Best for |
|---|---|
| **PNG** | General use — lossless quality, good for printing or sharing |
| **JPG** | Smaller file size, slight quality loss — good for archiving many labels |
| **PDF** | When you need a print-ready document. Note: PDF labels cannot be previewed in the popup — download only |

---

### Download Folder

- **Subfolder name:** When you download a label (manually or via auto-download), it goes into this subfolder inside your browser's default Downloads folder. Example: `ZPL Labels` → saves to `~/Downloads/ZPL Labels/label-xxx.png`
- Leave blank to save directly to your Downloads folder with no subfolder

---

### Polling Interval

How often to check the log file for new labels:
- While the **popup is open**: checks every 3 seconds regardless of this setting
- While the **popup is closed**: checks on a background alarm (Chrome enforces a 30-second minimum here — this is a browser limitation, not an extension one)

---

### Options

| Toggle | What it does |
|---|---|
| **Auto-download labels when detected** | Automatically saves every new label to your Downloads folder the moment it's detected — no button click needed |
| **Debug mode** | Shows a collapsible "Debug info" panel inside the popup with the raw log content and detected ZPL blocks — useful for troubleshooting |
| **Show label history as carousel** | Replaces the prev/next buttons with a scrollable filmstrip of label thumbnails |
| **Play chime when a new label is detected** | Plays a short audio tone through your speakers when a new label arrives (popup must be open) |
| **Show OS notification when a new label is detected** | Shows a system notification (like a standard app alert) even when the popup is closed |

---

### Preview Pop-up

| Setting | What it does |
|---|---|
| **Show preview pop-up on new label** | When a new label is detected, a floating window automatically opens showing the label |
| **Auto-close after (seconds)** | How many seconds the pop-up window stays open before closing itself. Minimum: 2 seconds, Maximum: 60 seconds |

---

## 9. Keyboard Shortcuts

These keyboard shortcuts work while the popup window is open and focused (i.e., you've clicked on it recently).

| Key | Action |
|---|---|
| `←` (left arrow) | Go to the previous label in history |
| `→` (right arrow) | Go to the next label in history |
| `R` | Rotate the label 90° clockwise |
| `Z` | Reset zoom back to 100% |
| Scroll wheel (on image) | Zoom in or out (50% to 400%) |

---

## 10. Auto-Starting the Server (Optional)

Running the server manually every time you restart your computer can be inconvenient. Here are ways to make it start automatically.

### Mac — Login Items

1. Open **System Settings** → **General** → **Login Items**
2. Click the **+** button
3. Navigate to the `zpl-label-preview/scripts` folder
4. Select `start-server.command` and click **Open**

The server will now start automatically when you log in. A Terminal window will briefly appear and then minimize.

### Mac — Alternate: Background Launch Agent (no window)

If you don't want a visible Terminal window, create a Launch Agent. This is more advanced — ask IT or a technical colleague to help.

### Windows — Startup Folder

1. Press `Windows Key + R`, type `shell:startup`, press Enter
2. A folder opens — copy a **shortcut** to `start-server.bat` into this folder
3. The server will start automatically when Windows starts

---

## 11. Troubleshooting

### "Log file not found" or "Cannot reach localhost:8765"

**Most common cause:** The Python server is not running.

Steps to fix:
1. Open Terminal (Mac) or Command Prompt (Windows)
2. Run the server command from Step 3 above
3. Click **Test Connection** in the extension settings to confirm it's working

If it still fails, try visiting `http://localhost:8765` in your browser. You should see a file directory listing. If you see a connection error, the server is not running.

---

### "Labelary API error 429" (in the browser console or debug section)

This means the labelary.com API has received too many requests in a short time. This usually happens when you click "Re-process today's file from start" on a file with many labels. The extension automatically limits to 5 labels on first load.

**Fix:** Wait 30–60 seconds, then click "Re-process today's file from start" again. Future prints will work normally.

---

### Labels stopped updating — new prints aren't showing up

1. Make sure the Python server is still running (the Terminal window is still open and hasn't timed out)
2. Close and reopen the popup — this triggers an immediate re-poll
3. If it still doesn't work, click **Re-process today's file from start** in Settings

---

### Label image looks stretched or the wrong shape

Your label dimensions in Settings don't match the actual label. Go to **Settings → Label Size** and enter the correct width × height in inches for your label stock.

---

### The extension was working before but now shows an error after restarting

The Python server stops when your computer restarts. Run the server command again (Step 3), or set up auto-start (Step 10).

---

### "Windows protected your PC" warning when running start-server.bat

This is a Windows SmartScreen warning for files downloaded from the internet.

**Fix:** Click **More info** → **Run anyway**. This only needs to be done once.

---

### Mac says "cannot be opened because the developer cannot be verified"

**Fix:** Right-click `start-server.command` → **Open** → click **Open** in the dialog. This bypasses the Gatekeeper check for this file only.

---

### The extension icon is missing from the toolbar

1. Click the **puzzle piece icon** (🧩) in the top-right of Chrome
2. Find "ZPL Label Preview" in the list
3. Click the pin icon to keep it visible in the toolbar

---

## 12. Frequently Asked Questions

**Does this extension send my label data to any third party?**

Only the ZPL code (the raw label design instructions) is sent to [labelary.com](https://labelary.com) to render the image. Everything else — your settings, label history, and browsing activity — stays entirely on your computer in browser storage. Labelary is a well-known, free ZPL rendering service used by developers worldwide.

---

**Do I need to run the Python server every time I restart my computer?**

Yes, unless you set up auto-start (see [Section 10](#10-auto-starting-the-server-optional)). The extension will show a "Cannot reach server" error if you forget, which is a helpful reminder.

---

**Can multiple people use this on the same computer?**

Yes. Each browser profile has its own extension settings and label history. If two people share a computer with separate browser profiles, each gets their own independent instance.

---

**Why can't the extension just read the log file directly without the Python server?**

Chrome's security model prevents extensions from reading files in system directories like `~/Library` on Mac (a sandboxed path). The Python server acts as a simple, read-only HTTP bridge — it makes the files accessible over `localhost` without exposing them to the internet.

---

**What happens to old labels? Are they stored forever?**

The extension keeps the last **100 labels** in browser storage. Once you reach 100, older labels are automatically removed when new ones arrive. You can also clear all labels manually using the **Clear history** button in the popup.

---

**Can I use a port other than 8765?**

Yes. Go to **Settings → Log File Server → Port**, enter a different port number (e.g. `9000`), click **Save Settings**, then restart the Python server with the new port:

```bash
python3 -m http.server 9000 --directory ~/Library/Logs/PlexComponentHost
```

---

**The label preview looks blurry or low resolution**

Try increasing the **Printer DPI** setting to 12 dpmm or 24 dpmm. Note that higher DPI increases the time it takes to render each label.

---

**Is this extension available in the Chrome Web Store?**

Not yet. For now it is installed manually as described in this guide. A Chrome Web Store submission is planned for a future version.

---

*For issues not covered here, please [open a GitHub issue](https://github.com/rcepek/zpl-label-preview/issues) with a description of the problem and what you tried.*
