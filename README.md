# X-Scroller

`X-Scroller` is a Manifest V3 Chrome extension that keeps your X/Twitter timeline moving with smooth auto-scroll, randomized refresh, and optional promoted-post skipping.

## Why this project exists

X/Twitter has no built-in "hands-off scroll and refresh" mode for passive monitoring.  
X-Scroller provides a lightweight way to keep a timeline active while reducing repetitive manual actions.

## Features

- Smooth continuous scrolling tuned for long sessions
- Randomized refresh interval (`minReloadMinutes` to `maxReloadMinutes`)
- Optional preference for the in-feed **new posts** button before full reload
- Promoted/ad post detection and buffered skip movement
- Pause when tab is hidden (optional)
- Popup controls with live running status and next-reload countdown

## Project structure

- `manifest.json`: extension manifest and permissions
- `background.js`: defaults, install-time settings init, badge updates
- `content.js`: in-page controller (scroll loop, refresh loop, ad skipping, message handlers)
- `popup.html` / `popup.css` / `popup.js`: extension UI and settings management
- `docs/CONFIGURATION.md`: settings reference and practical tuning guidance
- `docs/ARCHITECTURE.md`: event/data flow and component responsibilities

## Install (unpacked)

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select this repository folder

## Basic usage

1. Open `https://x.com` or `https://twitter.com`
2. Click the extension icon
3. Configure settings in the popup
4. Click **Apply to tab**
5. Use **Start / Stop** as needed

## Development notes

- No build step is required; this is plain JS/CSS/HTML.
- The extension stores user settings in `chrome.storage.sync`.
- The content script is designed to be idempotent and safely re-initializes itself per page context.

## Limitations

- UI selectors on X/Twitter can change at any time and may require updates.
- Promoted-post detection is heuristic-based and intentionally conservative.
- The extension currently targets Chromium-based browsers with MV3 support.

## Privacy

X-Scroller does not send data to external servers.  
All behavior runs locally in your browser extension context.
