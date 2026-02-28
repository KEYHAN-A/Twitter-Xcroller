# X-Scroller

`X-Scroller` is a Chrome extension for continuous X/Twitter feed monitoring.

It auto-scrolls smoothly, keeps the feed fresh with randomized refresh timing, can click the top "new posts" prompt before reloading, and skips promoted posts while maintaining smooth motion.

## Features

- Smooth continuous scrolling (tuned for long-running sessions)
- Randomized refresh window (min/max minutes)
- Optional "prefer new posts button" behavior on `x.com`
- Fallback to hard reload when no new-posts prompt is detected
- Promoted/ad post skipping with debounce and buffered skip motion
- Compact popup controls with saved settings and countdown

## Install (Unpacked)

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select this project folder

## Usage

1. Open a tab on `https://x.com` or `https://twitter.com`
2. Click the extension icon
3. Configure your settings:
   - Enable automation
   - Auto-start on page load
   - Pause when tab is hidden
   - Prefer "new posts" button over reload
   - Scroll speed
   - Reload min/max
4. Click **Apply to tab**
5. Use **Start/Stop** anytime

## Behavior Notes

- Each cycle chooses a new random refresh time between your min/max values.
- If "prefer new posts" is enabled, X-Scroller tries to click the blue top prompt first.
- If no prompt is found, it reloads the tab.
- Ad skipping uses cooldown + buffered movement to avoid jarring back-to-back jumps.
