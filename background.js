const DEFAULT_CONFIG = {
  enabled: true,
  autoStartOnLoad: true,
  pauseOnHidden: true,
  preferNewPostsButton: true,
  baseStepPx: 1.4,
  tickMs: 70,
  startupDelaySec: 3,
  minReloadMinutes: 3,
  maxReloadMinutes: 8
};

chrome.runtime.onInstalled.addListener(async () => {
  const current = await chrome.storage.sync.get(Object.keys(DEFAULT_CONFIG));
  const merged = { ...DEFAULT_CONFIG, ...current };
  await chrome.storage.sync.set(merged);
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "statusUpdate" && sender.tab?.id) {
    const status = message.status || {};
    const badge = status.running ? "RUN" : "OFF";
    const color = status.running ? "#1d9bf0" : "#6b7280";
    chrome.action.setBadgeText({ tabId: sender.tab.id, text: badge }).catch(() => {});
    chrome.action.setBadgeBackgroundColor({ tabId: sender.tab.id, color }).catch(() => {});
    sendResponse({ ok: true });
    return true;
  }

  if (message?.type === "getDefaultConfig") {
    sendResponse({ config: DEFAULT_CONFIG });
    return true;
  }

  return false;
});
