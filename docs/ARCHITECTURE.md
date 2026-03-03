# Architecture Overview

X-Scroller has three runtime pieces: background service worker, content script, and popup UI.

## Components

## 1) `background.js`

- Initializes default config during install.
- Receives status updates from content scripts.
- Updates per-tab badge text and color (`RUN`/`PAUS`/`OFF`).

## 2) `content.js`

- Owns the automation controller for each X/Twitter page.
- Loads config from `chrome.storage.sync`.
- Runs:
  - Smooth scroll animation loop (`requestAnimationFrame`)
  - Debounced mouse-move interaction pause handling
  - Manual interaction pause mode with explicit resume
  - Floating in-page resume button for manual mode
  - Randomized refresh scheduler (`setTimeout`)
  - Optional promoted-post skip logic
- Exposes message API:
  - `cts:getStatus`
  - `cts:start`
  - `cts:stop`
  - `cts:applyConfig`
  - `cts:resumeAfterInteraction`

## 3) Popup (`popup.html`, `popup.js`, `popup.css`)

- Reads/saves user config from `chrome.storage.sync`.
- Sends control messages to active tab content script.
- Shows current running state, pause reason, next reload countdown, and first-run tab refresh guidance.

## Data flow

1. User updates settings in popup.
2. Popup stores settings to `chrome.storage.sync`.
3. Popup optionally pushes settings directly to active tab via `cts:applyConfig`.
4. Mouse interaction can trigger auto or manual pause depending on `interactionMode`.
5. Content script updates runtime state and sends status updates.
6. Background updates action badge for that tab.

## Lifecycle and safety

- Content script is guarded by a window-level singleton key (`__ctsTwitterScroller`).
- Re-injection destroys prior controller instance before re-initializing.
- Storage change events keep live tabs synced when settings change.
