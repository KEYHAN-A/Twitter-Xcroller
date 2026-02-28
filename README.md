# Continuous Twitter Scroller (Chrome Extension)

A simple Manifest V3 extension that keeps X/Twitter moving automatically:

- Smooth slow auto-scroll.
- Randomized auto-reload between configurable min/max minutes.
- Compact popup panel to control behavior.

## Install (Unpacked)

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select this folder: `twitter-scroller`.

## How It Works

- Open an `x.com` or `twitter.com` tab.
- Click the extension icon.
- Configure settings:
  - Enable automation
  - Auto-start on load
  - Pause on hidden tab
  - Prefer "new posts" button over reload
  - Scroll speed (`baseStepPx`)
  - Reload min/max range (minutes)
  - Tick interval and startup delay
- Click **Save** to persist defaults.
- Click **Apply to tab** to push settings immediately.
- Use **Start/Stop** for manual control.

## Notes

- Reload time is randomized each cycle between min/max values.
- If enabled, the extension first tries clicking X's top "new posts" button, then falls back to page reload.
- A new random interval is picked after every page load.
- Popup shows a simple countdown to the next reload when running.
