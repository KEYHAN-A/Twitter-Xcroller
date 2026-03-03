# Configuration Reference

This document explains each user-facing setting used by X-Scroller.

## Core toggles

- `enabled`: Master switch for automation. When disabled, loops stop immediately.
- `autoStartOnLoad`: Starts automation automatically after page load/initialization.
- `pauseOnHidden`: Keeps state running but pauses movement when the tab is hidden.
- `preferNewPostsButton`: Attempts to click X's top "new posts" prompt before doing `location.reload()`.

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
- Mouse movement temporarily pauses auto-scroll using a short debounce window so manual interaction is not interrupted.
