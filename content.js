const EXTENSION_KEY = "__ctsTwitterScroller";

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

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function normalizeConfig(raw) {
  const cfg = { ...DEFAULT_CONFIG, ...(raw || {}) };
  const minReloadMinutes = clamp(Number(cfg.minReloadMinutes) || DEFAULT_CONFIG.minReloadMinutes, 0.5, 240);
  const maxReloadMinutes = clamp(Number(cfg.maxReloadMinutes) || DEFAULT_CONFIG.maxReloadMinutes, minReloadMinutes, 240);

  return {
    enabled: Boolean(cfg.enabled),
    autoStartOnLoad: Boolean(cfg.autoStartOnLoad),
    pauseOnHidden: Boolean(cfg.pauseOnHidden),
    preferNewPostsButton: Boolean(cfg.preferNewPostsButton),
    baseStepPx: clamp(Number(cfg.baseStepPx) || DEFAULT_CONFIG.baseStepPx, 0.5, 8),
    tickMs: clamp(Math.round(Number(cfg.tickMs) || DEFAULT_CONFIG.tickMs), 30, 500),
    startupDelaySec: clamp(Number(cfg.startupDelaySec) || DEFAULT_CONFIG.startupDelaySec, 0, 60),
    minReloadMinutes,
    maxReloadMinutes
  };
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function isVisibleButton(element) {
  if (!element) {
    return false;
  }
  const rect = element.getBoundingClientRect();
  if (rect.width < 30 || rect.height < 16) {
    return false;
  }
  if (rect.bottom < 0 || rect.top > window.innerHeight) {
    return false;
  }
  const style = window.getComputedStyle(element);
  return style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0";
}

function createController() {
  const state = {
    config: { ...DEFAULT_CONFIG },
    running: false,
    animationFrameId: null,
    lastFrameTime: null,
    smoothMultiplier: 1,
    targetMultiplier: 1,
    nextDriftAt: 0,
    nextAdCheckAt: 0,
    pendingAdSkipPx: 0,
    lastAdSkipAt: 0,
    adSkipCooldownMs: 2200,
    scrollCarry: 0,
    reloadTimer: null,
    startDelayTimer: null,
    nextReloadAt: null
  };

  function notifyStatus() {
    const status = getStatus();
    chrome.runtime.sendMessage({ type: "statusUpdate", status }).catch(() => {});
    return status;
  }

  function clearAllTimers() {
    if (state.animationFrameId) {
      cancelAnimationFrame(state.animationFrameId);
      state.animationFrameId = null;
    }
    if (state.reloadTimer) {
      clearTimeout(state.reloadTimer);
      state.reloadTimer = null;
    }
    if (state.startDelayTimer) {
      clearTimeout(state.startDelayTimer);
      state.startDelayTimer = null;
    }
    state.lastFrameTime = null;
    state.pendingAdSkipPx = 0;
    state.scrollCarry = 0;
    state.nextReloadAt = null;
  }

  function runSmoothScrollFrame(timestamp) {
    if (!state.running) {
      return;
    }
    if (state.config.pauseOnHidden && document.hidden) {
      state.lastFrameTime = timestamp;
      state.animationFrameId = requestAnimationFrame(runSmoothScrollFrame);
      return;
    }

    if (state.lastFrameTime == null) {
      state.lastFrameTime = timestamp;
      state.animationFrameId = requestAnimationFrame(runSmoothScrollFrame);
      return;
    }

    if (state.pendingAdSkipPx > 0) {
      const deltaMsForSkip = Math.min(200, Math.max(0, timestamp - state.lastFrameTime));
      const basePerMs = state.config.baseStepPx / Math.max(1, state.config.tickMs);
      const maxSkipChunkPx = clamp(basePerMs * deltaMsForSkip * 8, 14, 42);
      const chunk = Math.min(state.pendingAdSkipPx, maxSkipChunkPx);
      window.scrollBy(0, chunk);
      state.pendingAdSkipPx -= chunk;
      state.lastFrameTime = timestamp;
      state.animationFrameId = requestAnimationFrame(runSmoothScrollFrame);
      return;
    }

    if (timestamp >= state.nextAdCheckAt && timestamp - state.lastAdSkipAt >= state.adSkipCooldownMs) {
      state.nextAdCheckAt = timestamp + randomBetween(900, 1400);
      const adInView = findVisibleAdArticle();
      if (adInView) {
        const jumpDistance = clamp(adInView.rect.bottom + randomBetween(20, 55), 140, 620);
        state.pendingAdSkipPx = jumpDistance;
        state.lastAdSkipAt = timestamp;
        // Debounce ad-skips so dense ad clusters do not create back-to-back jumps.
        state.adSkipCooldownMs = Math.round(randomBetween(2200, 3200));
        state.scrollCarry = 0;
        state.lastFrameTime = timestamp;
        state.animationFrameId = requestAnimationFrame(runSmoothScrollFrame);
        return;
      }
    }

    // Keep real-time speed stable while still preventing huge jumps.
    const deltaMs = Math.min(200, Math.max(0, timestamp - state.lastFrameTime));
    state.lastFrameTime = timestamp;

    // Keep only a subtle drift so speed feels steady.
    if (timestamp >= state.nextDriftAt) {
      state.targetMultiplier = randomBetween(0.985, 1.015);
      state.nextDriftAt = timestamp + randomBetween(2500, 5000);
    }
    state.smoothMultiplier += (state.targetMultiplier - state.smoothMultiplier) * 0.12;

    const basePerMs = state.config.baseStepPx / Math.max(1, state.config.tickMs);
    const desired = basePerMs * deltaMs * state.smoothMultiplier;

    // Carry tiny fractional movement so low speeds remain smooth and consistent.
    state.scrollCarry += desired;
    if (state.scrollCarry >= 0.25) {
      window.scrollBy(0, state.scrollCarry);
      state.scrollCarry = 0;
    }

    state.animationFrameId = requestAnimationFrame(runSmoothScrollFrame);
  }

  function findVisibleAdArticle() {
    const articles = document.querySelectorAll("article");
    for (const article of articles) {
      const rect = article.getBoundingClientRect();
      if (rect.bottom < 60 || rect.top > window.innerHeight * 0.72) {
        continue;
      }
      if (isLikelyAdArticle(article)) {
        return { rect };
      }
    }
    return null;
  }

  function isLikelyAdArticle(article) {
    if (article.querySelector('[data-testid="placementTracking"]')) {
      return true;
    }

    const spans = article.querySelectorAll("span");
    for (const span of spans) {
      const text = (span.textContent || "").trim();
      if (text === "Ad" || text === "Promoted") {
        return true;
      }
    }

    const ariaLabel = (article.getAttribute("aria-label") || "").toLowerCase();
    if (ariaLabel.includes("promoted")) {
      return true;
    }

    return false;
  }

  function scheduleReload() {
    if (!state.running) {
      return;
    }

    const minMs = state.config.minReloadMinutes * 60 * 1000;
    const maxMs = state.config.maxReloadMinutes * 60 * 1000;
    const delayMs = Math.round(randomBetween(minMs, maxMs));
    state.nextReloadAt = Date.now() + delayMs;

    state.reloadTimer = setTimeout(() => {
      if (!state.running) {
        return;
      }
      const clicked = state.config.preferNewPostsButton ? clickNewPostsButton() : false;
      if (clicked) {
        scheduleReload();
        notifyStatus();
        return;
      }
      window.location.reload();
    }, delayMs);
  }

  function clickNewPostsButton() {
    const candidates = Array.from(document.querySelectorAll('button, div[role="button"], a[role="button"]'));
    const topCandidates = candidates.filter((element) => {
      if (!isVisibleButton(element)) {
        return false;
      }
      const rect = element.getBoundingClientRect();
      return rect.top >= -40 && rect.top <= 280;
    });

    for (const element of topCandidates) {
      const text = `${element.textContent || ""} ${element.getAttribute("aria-label") || ""}`.toLowerCase();
      if (text.includes("new post") || text.includes("new posts")) {
        element.click();
        return true;
      }
    }

    return false;
  }

  function runLoops() {
    if (state.animationFrameId) {
      cancelAnimationFrame(state.animationFrameId);
      state.animationFrameId = null;
    }
    if (state.reloadTimer) {
      clearTimeout(state.reloadTimer);
      state.reloadTimer = null;
    }

    state.lastFrameTime = null;
    state.smoothMultiplier = 1;
    state.targetMultiplier = 1;
    state.pendingAdSkipPx = 0;
    state.lastAdSkipAt = 0;
    state.adSkipCooldownMs = 2200;
    state.scrollCarry = 0;
    state.nextDriftAt = performance.now() + randomBetween(800, 1800);
    state.nextAdCheckAt = performance.now() + randomBetween(500, 900);
    state.animationFrameId = requestAnimationFrame(runSmoothScrollFrame);
    scheduleReload();
    notifyStatus();
  }

  function start() {
    clearAllTimers();
    if (!state.config.enabled) {
      state.running = false;
      notifyStatus();
      return getStatus();
    }

    state.running = true;
    const delay = Math.round(state.config.startupDelaySec * 1000);
    state.startDelayTimer = setTimeout(runLoops, delay);
    notifyStatus();
    return getStatus();
  }

  function stop() {
    state.running = false;
    clearAllTimers();
    notifyStatus();
    return getStatus();
  }

  function setConfig(nextConfig) {
    state.config = normalizeConfig(nextConfig);
    if (state.config.enabled && state.running) {
      start();
    } else if (!state.config.enabled) {
      stop();
    } else {
      notifyStatus();
    }
    return { ...state.config };
  }

  function getStatus() {
    return {
      running: state.running,
      enabled: state.config.enabled,
      nextReloadAt: state.nextReloadAt,
      pauseOnHidden: state.config.pauseOnHidden,
      preferNewPostsButton: state.config.preferNewPostsButton
    };
  }

  async function initialize() {
    const stored = await chrome.storage.sync.get(Object.keys(DEFAULT_CONFIG));
    setConfig(stored);

    if (state.config.enabled && state.config.autoStartOnLoad) {
      start();
    } else {
      notifyStatus();
    }
  }

  function handleVisibilityChange() {
    if (!state.running || !state.config.pauseOnHidden) {
      return;
    }
    notifyStatus();
  }

  function handleMessage(message, sender, sendResponse) {
    if (!message || typeof message !== "object") {
      return false;
    }

    switch (message.type) {
      case "cts:getStatus":
        sendResponse({ status: getStatus(), config: state.config });
        return true;
      case "cts:start":
        sendResponse({ status: start(), config: state.config });
        return true;
      case "cts:stop":
        sendResponse({ status: stop(), config: state.config });
        return true;
      case "cts:applyConfig": {
        const config = setConfig(message.config || {});
        sendResponse({ status: getStatus(), config });
        return true;
      }
      default:
        return false;
    }
  }

  function destroy() {
    stop();
    chrome.runtime.onMessage.removeListener(handleMessage);
    chrome.storage.onChanged.removeListener(handleStorageChange);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
  }

  function handleStorageChange(changes, area) {
    if (area !== "sync") {
      return;
    }
    const next = { ...state.config };
    let didChange = false;
    for (const key of Object.keys(DEFAULT_CONFIG)) {
      if (changes[key]) {
        next[key] = changes[key].newValue;
        didChange = true;
      }
    }
    if (didChange) {
      setConfig(next);
    }
  }

  chrome.runtime.onMessage.addListener(handleMessage);
  chrome.storage.onChanged.addListener(handleStorageChange);
  document.addEventListener("visibilitychange", handleVisibilityChange);

  return {
    initialize,
    destroy
  };
}

(async () => {
  if (window[EXTENSION_KEY]?.destroy) {
    window[EXTENSION_KEY].destroy();
  }

  const controller = createController();
  window[EXTENSION_KEY] = controller;
  await controller.initialize();
})();
