# Twitter-Xcroller

> **Smooth X/Twitter auto-scroll with smart interaction, ad skipping, and auto-refresh.**

Twitter-Xcroller is a Chrome extension that automates infinite scrolling on X (Twitter), with intelligent features like ad skipping, user-interaction-aware pausing, and automatic feed refresh. It runs silently in the background and requires minimal configuration.

---

## Overview

Twitter-Xcroller provides a seamless browsing experience on X/Twitter by automating the scroll behavior that the platform's infinite feed requires. Unlike naive scrollers, it detects user interaction and pauses automatically, intelligently skips ads, and refreshes the feed at random intervals to simulate natural browsing patterns.

## Features

- **Smooth auto-scrolling** — Uses `requestAnimationFrame` for buttery-smooth, frame-rate-synced scrolling
- **Ad detection & skipping** — Identifies promoted content via `data-testid="placementTracking"`, "Ad"/"Promoted" labels, and aria attributes, then smoothly skips past them
- **Interaction-aware pausing** — Pauses when you interact with the page (click, hover, scroll) and auto-resumes after a short delay
- **Two interaction modes:**
  - `auto_resume_on_mouse` — Auto-pauses and resumes after mouse movement settles
  - `manual_resume_on_mouse` — Pauses and shows a floating "Continue" button for manual resume
- **Smart feed refresh** — At random intervals (configurable 3–8 min default), clicks "New Posts" button or reloads the page
- **Tab visibility handling** — Automatically pauses when the tab is hidden via `pauseOnHidden`
- **Floating resume button** — Glassmorphic resume button appears when paused in manual mode
- **Badge indicators** — Extension badge shows `RUN`, `PAUS`, or `OFF` status
- **Configurable via popup** — Adjust scroll speed, timing, and behavior from the popup UI

## Tech Stack

| Component | Technology |
|-----------|------------|
| Extension Type | Chrome Extension Manifest V3 |
| Background | Service Worker (module type) |
| Content Script | Vanilla JavaScript (ES6+) |
| Popup | HTML + CSS + JS |
| Storage | `chrome.storage.sync` API |
| Target Sites | `x.com/*`, `twitter.com/*` |

## Project Structure

```
Twitter-Xcroller/
├── manifest.json           # MV3 manifest (permissions, content scripts, background)
├── background.js           # Service worker: badge management, config defaults
├── content.js              # Core scrolling engine with ad detection
├── popup.html              # Popup UI layout
├── popup.css               # Popup styling
├── popup.js                # Popup logic: config sync, status display
├── docs/
│   ├── ARCHITECTURE.md     # Architecture documentation
│   └── CONFIGURATION.md    # Configuration reference
├── .gitignore
└── README.md
```

## Installation

### Manual Install (Chrome)

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right)
3. Click **Load unpacked**
4. Select the `Twitter-Xcroller` folder
5. The extension icon appears in your toolbar

### Alternative Browsers

The extension uses standard Chrome Extension APIs (Manifest V3). It should work in:
- **Microsoft Edge** — Load as unpacked extension via `edge://extensions/`
- **Brave** — Load as unpacked extension via `brave://extensions/`
- **Opera** — Load as unpacked extension via `opera://extensions/`

## Usage

### Getting Started

1. Navigate to [x.com](https://x.com) or [twitter.com](https://twitter.com)
2. Click the Twitter-Xcroller extension icon
3. Toggle the extension **ON** — scrolling starts automatically after a 3-second delay
4. Use the popup to adjust settings as needed

### Popup Controls

| Control | Description |
|---------|-------------|
| **Enable/Disable** | Toggle auto-scrolling on/off |
| **Auto-Start** | Automatically start when visiting X/Twitter |
| **Pause on Hidden** | Pause when the tab loses focus |
| **Prefer New Posts** | Click "New Posts" button on refresh instead of reload |
| **Interaction Mode** | Choose between auto-resume or manual-resume |
| **Scroll Speed** | Base step size in pixels per tick |
| **Tick Interval** | Milliseconds between scroll increments |
| **Startup Delay** | Seconds to wait before starting |
| **Refresh Interval** | Min/max range for random feed refresh timing |

### Interaction Behavior

- **Mouse movement** triggers a brief pause so you can interact with posts
- **Clicks, hovers, and manual scrolling** also pause the auto-scroll
- In **manual mode**, a floating "Continue" button appears — click it to resume
- **Ad detection** automatically skips past promoted content smoothly

## Development

### Running Locally

1. Open Chrome → `chrome://extensions/`
2. Enable Developer mode
3. Click **Load unpacked** → select the `Twitter-Xcroller` directory
4. Navigate to x.com to test

### Key Code Areas

- **`content.js`** — Core scrolling engine (`createController()`, `runSmoothScrollFrame()`, `findVisibleAdArticle()`)
- **`background.js`** — Badge management, default config setup, runtime messaging
- **`popup.js`** — UI state management, config persistence via `chrome.storage.sync`

### Configuration Schema

```javascript
{
  enabled: true,
  autoStartOnLoad: true,
  pauseOnHidden: true,
  preferNewPostsButton: true,
  interactionMode: "auto_resume_on_mouse",  // or "manual_resume_on_mouse"
  baseStepPx: 1.4,                          // pixels per tick
  tickMs: 70,                               // ms between ticks
  startupDelaySec: 3,                       // seconds before starting
  minReloadMinutes: 3,                      // min refresh interval
  maxReloadMinutes: 8                       // max refresh interval
}
```

### Debugging

- Open the extension's service worker: `chrome://extensions/` → Twitter-Xcroller → "Service Worker" link
- Check `content.js` console on any X/Twitter tab
- Badge shows: `RUN` (running), `PAUS` (paused), `OFF` (disabled)

### Ad Detection Logic

The extension identifies ads via three heuristics:
1. `data-testid="placementTracking"` attribute on `<article>` elements
2. Spans containing "Ad" or "Promoted" text
3. `aria-label` containing "promoted"

When detected, it smoothly jumps past the ad using a calculated skip distance (140–620px).
