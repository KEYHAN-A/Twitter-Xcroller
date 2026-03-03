# Configuration Reference

This document explains each user-facing setting used by X-Scroller.

## Core toggles

- `enabled`: Master switch for automation. When disabled, loops stop immediately.
- `autoStartOnLoad`: Starts automation automatically after page load/initialization.
- `pauseOnHidden`: Keeps state running but pauses movement when the tab is hidden.
- `preferNewPostsButton`: Attempts to click X's top "new posts" prompt before doing `location.reload()`.
- `interactionMode`:
  - `auto_resume_on_mouse`: Debounced mouse movement pauses scroll briefly, then auto-resumes.
  - `manual_resume_on_mouse`: Debounced mouse movement pauses scroll until explicitly resumed.

## Scrolling behavior

- `baseStepPx` (default `1.4`, range `0.5` to `8`): Base movement amount.
- `tickMs` (default `70`, range `30` to `500`): Timing baseline used to convert speed into a per-frame target.
- `startupDelaySec` (default `3`, range `0` to `60`): Delay before loops begin after start.

## Refresh behavior

- `minReloadMinutes` (default `3`, range `0.5` to `240`)
- `maxReloadMinutes` (default `8`, range `minReloadMinutes` to `240`)

On each cycle, the extension picks a random delay between these values and schedules the next refresh.

## Suggested presets

### Passive monitoring

- `baseStepPx`: `1.2`
- `tickMs`: `70`
- `minReloadMinutes`: `4`
- `maxReloadMinutes`: `10`
- `pauseOnHidden`: `true`

### Faster feed movement

- `baseStepPx`: `2.2`
- `tickMs`: `60`
- `minReloadMinutes`: `2`
- `maxReloadMinutes`: `5`

## Notes

- Values are normalized and clamped in both popup and content logic.
- If `maxReloadMinutes` is set below `minReloadMinutes`, it is auto-corrected.
- In manual mode, you can resume from either the popup "Continue in tab" action or the in-page floating "Continue" button.
- If popup controls do not connect on a tab yet, refresh that X/Twitter tab once so the content script is active.
