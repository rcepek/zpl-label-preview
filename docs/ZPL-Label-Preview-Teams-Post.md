# ZPL Label Preview — Installation & Quick Start Guide

## What's This For?

**No more surprises at the printer.** This browser extension reads your label designs the moment PlexComponentHost sends them to print — giving you a full preview right in your browser before they roll off the printer. Rotate, zoom, download, verify. All in seconds.

Think of it as a **print preview** that pops up automatically.

---

## ✅ Do You Have These?

Before you start, make sure:
- ✔️ **Chrome, Edge, or Brave** (not Firefox or Safari)
- ✔️ **Python 3** installed on your machine (likely already there on Windows)
- ✔️ **PlexComponentHost** installed and running

**Not sure about Python?** Open Command Prompt (Windows) or Terminal (Mac) and type `python --version` or `python3 --version`. If you see a version number, you're good. If not, grab it free from [python.org/downloads](https://www.python.org/downloads/).

---

## 🚀 4-Step Setup (15 minutes)

### **Step 1: Download the Extension**
1. Go to [github.com/rcepek/zpl-label-preview](https://github.com/rcepek/zpl-label-preview)
2. Click **Code** → **Download ZIP**
3. Unzip the folder and move it somewhere permanent (like Documents)

### **Step 2: Load It Into Your Browser**
1. Open your browser and go to:
   - **Chrome:** `chrome://extensions`
   - **Edge:** `edge://extensions`
   - **Brave:** `brave://extensions`
2. Turn **Developer mode** ON (top-right corner)
3. Click **Load unpacked** and select the `zpl-label-preview` folder

You should see the extension appear, and a label icon will show in your toolbar.

### **Step 3: Start the Python Server**
This is the bridge that lets the extension read your log files. **Keep this running whenever you want to use the extension.**

**Easy way (just double-click):**
- Navigate to: `zpl-label-preview/scripts`
- **Mac:** Double-click `start-server.command`
- **Windows:** Double-click `start-server.bat`

A Terminal/Command Prompt window opens. **Keep it open — closing it stops the server.**

**Manual way (if the above doesn't work):**
- **Mac:** Open Terminal, paste: `python3 -m http.server 8765 --directory ~/Library/Logs/PlexComponentHost`
- **Windows:** Open Command Prompt, paste: `python -m http.server 8765 --directory "%LOCALAPPDATA%\PlexComponentHost\logs"`

### **Step 4: Verify It Works**
1. Click the label icon in your toolbar
2. Click **Open Settings** (⚙)
3. Click **Test Connection**

You should see: `Connected — notifier-XXXXXXXX.log found` ✅

If you see red error text, jump to **Troubleshooting** below.

---

## 🎯 Using It — What You'll See

Click the extension icon anytime to open the popup:

**Top:** Label info (size, format, print time) + copy/settings buttons
**Middle:** Your label preview (click to zoom/rotate)
**Bottom:** Navigation buttons, download option, history

**Keyboard shortcuts (while popup is open):**
- `←` `→` — Navigate through label history
- `R` — Rotate 90°
- `Z` — Reset zoom
- **Scroll wheel** — Zoom in/out

---

## ⚙️ Quick Settings You Probably Want to Adjust

**Settings** → (⚙ icon in popup or right-click extension)

| Setting | What to do |
|---|---|
| **Label Size** | Enter your actual label dimensions (e.g., 4" × 6" for shipping labels). Must match your physical label stock. |
| **Printer DPI** | Leave at **8 dpmm** unless labels look blurry, then try 12 dpmm |
| **Output Format** | PNG (best for most uses), JPG (smaller files), or PDF (print-ready) |
| **Auto-download** | Enable if you want labels auto-saved to Downloads whenever they print |
| **Show as carousel** | Enable for a filmstrip view of your label history instead of prev/next buttons |

---

## 🔧 Troubleshooting Quick Hits

| Problem | Fix |
|---|---|
| **"Cannot reach localhost:8765"** | Python server isn't running. Go back to Step 3 and start it. |
| **Labels aren't updating** | Close/reopen the popup. Or restart the server. |
| **Labels look stretched or wrong shape** | Wrong label size in Settings. Fix the Width × Height to match your stock. |
| **Extension icon is missing** | Click the puzzle piece (🧩) in toolbar → find "ZPL Label Preview" → click the pin. |
| **"Windows protected your PC" warning** | Click **More info** → **Run anyway** (one-time thing). |
| **Mac says "cannot be opened because developer cannot be verified"** | Right-click `start-server.command` → **Open** → **Open** in the dialog. |

---

## 📚 Full Reference (Settings, Shortcuts, FAQs)

### **All Settings Explained**

**Log File Server**
- **Port:** Default is `8765`. Only change if another app uses that port.
- **Test Connection:** Verifies the server is running
- **Re-process today's file from start:** Forces a full re-read (use if labels were missed)

**Label Size**
- Enter width and height in inches to match your physical labels

**Printer DPI**
- **8 dpmm (203 DPI):** Standard Zebra printers (ZP450, GK420, etc.) — use this as default
- **12 dpmm (300 DPI):** High-quality printers (ZT230, ZT410 in 300 DPI mode)
- **24 dpmm (600 DPI):** Ultra-high-resolution

**Output Format**
- **PNG:** Lossless, best for general use
- **JPG:** Smaller file size, slight quality loss
- **PDF:** Print-ready (no preview in popup, download only)

**Download Folder**
- Set a subfolder name (e.g., "ZPL Labels") to auto-organize downloads. Leave blank to save directly to Downloads.

**Polling Interval**
- How often to check for new labels. While popup is open, it checks every 3 seconds. When closed, Chrome enforces a 30-second minimum.

**Options (Toggles)**
- **Auto-download:** Save every new label automatically (no clicks needed)
- **Debug mode:** Shows raw data for troubleshooting
- **Carousel view:** Filmstrip instead of prev/next buttons
- **Chime on new label:** Audio alert when a label arrives (popup must be open)
- **OS notification:** System alert even when popup is closed

**Preview Pop-up**
- **Show on new label:** Auto-open a floating preview when a label arrives
- **Auto-close after:** How many seconds before it closes itself (2–60 sec)

---

### **Privacy Note**

Only the raw label design (ZPL code) is sent to [labelary.com](https://labelary.com) for rendering. No names, addresses, or business data leaves your computer. Everything else stays local.

---

### **Frequently Asked Questions**

**Do I need to run the Python server every time I restart my computer?**
Yes, unless you set up auto-start. On Mac: System Settings → General → Login Items → add `start-server.command`. On Windows: copy a shortcut to `start-server.bat` into the Startup folder.

**Can multiple people use this on the same computer?**
Yes. Each browser profile gets its own extension settings and label history.

**Why can't the extension just read the log file directly?**
Chrome's security sandbox prevents direct access to system directories. Python creates a lightweight local HTTP bridge — read-only, no data leaves your machine.

**What happens to old labels?**
The extension stores the last 100 labels. When you hit 100, older ones auto-delete as new ones arrive. You can also manually clear history anytime.

**The preview looks blurry.**
Try increasing Printer DPI to 12 dpmm or 24 dpmm in Settings.

**Is this on the Chrome Web Store yet?**
Not yet. For now, manual installation only. A Web Store submission is planned for a future version.

---

## 🆘 Issues Not Covered Here?

[Open a GitHub issue](https://github.com/rcepek/zpl-label-preview/issues) with a description of the problem and what you tried.

---

### Questions? Ideas for Improvement?

Reply in this thread — let's make this work seamlessly for you.
