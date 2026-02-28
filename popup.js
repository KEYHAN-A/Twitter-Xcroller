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

const el = {
  enabled: document.getElementById("enabled"),
  autoStartOnLoad: document.getElementById("autoStartOnLoad"),
  pauseOnHidden: document.getElementById("pauseOnHidden"),
  preferNewPostsButton: document.getElementById("preferNewPostsButton"),
  baseStepPx: document.getElementById("baseStepPx"),
  tickMs: document.getElementById("tickMs"),
  startupDelaySec: document.getElementById("startupDelaySec"),
  minReloadMinutes: document.getElementById("minReloadMinutes"),
  maxReloadMinutes: document.getElementById("maxReloadMinutes"),
  speedValue: document.getElementById("speedValue"),
  countdown: document.getElementById("countdown"),
  statusPill: document.getElementById("statusPill"),
  saveButton: document.getElementById("saveButton"),
  applyButton: document.getElementById("applyButton"),
  toggleButton: document.getElementById("toggleButton")
};

let latestStatus = null;
let countdownTimer = null;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function normalizeConfig(raw) {
  const cfg = { ...DEFAULT_CONFIG, ...raw };
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

function configFromForm() {
  return normalizeConfig({
    enabled: el.enabled.checked,
    autoStartOnLoad: el.autoStartOnLoad.checked,
    pauseOnHidden: el.pauseOnHidden.checked,
    preferNewPostsButton: el.preferNewPostsButton.checked,
    baseStepPx: Number(el.baseStepPx.value),
    tickMs: Number(el.tickMs.value),
    startupDelaySec: Number(el.startupDelaySec.value),
    minReloadMinutes: Number(el.minReloadMinutes.value),
    maxReloadMinutes: Number(el.maxReloadMinutes.value)
  });
}

function fillForm(config) {
  el.enabled.checked = config.enabled;
  el.autoStartOnLoad.checked = config.autoStartOnLoad;
  el.pauseOnHidden.checked = config.pauseOnHidden;
  el.preferNewPostsButton.checked = config.preferNewPostsButton;
  el.baseStepPx.value = String(config.baseStepPx);
  el.tickMs.value = String(config.tickMs);
  el.startupDelaySec.value = String(config.startupDelaySec);
  el.minReloadMinutes.value = String(config.minReloadMinutes);
  el.maxReloadMinutes.value = String(config.maxReloadMinutes);
  el.speedValue.textContent = `${config.baseStepPx.toFixed(1)} px/tick`;
}

async function getActiveTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0] || null;
}

function isTwitterUrl(url) {
  if (!url) {
    return false;
  }
  return url.startsWith("https://x.com/") || url.startsWith("https://twitter.com/");
}

async function sendToActiveTab(payload) {
  const tab = await getActiveTab();
  if (!tab?.id || !isTwitterUrl(tab.url)) {
    return null;
  }
  try {
    return await chrome.tabs.sendMessage(tab.id, payload);
  } catch (_) {
    return null;
  }
}

function renderStatus(status) {
  latestStatus = status || null;
  const running = Boolean(status?.running);
  el.statusPill.textContent = running ? "Running" : "Paused";
  el.statusPill.classList.toggle("running", running);
  el.toggleButton.textContent = running ? "Stop" : "Start";
}

function formatRemaining(ms) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}m ${String(sec).padStart(2, "0")}s`;
}

function renderCountdown() {
  if (!latestStatus?.nextReloadAt) {
    el.countdown.textContent = "Next reload: --";
    return;
  }
  const remaining = latestStatus.nextReloadAt - Date.now();
  if (remaining <= 0) {
    el.countdown.textContent = "Next reload: soon";
    return;
  }
  el.countdown.textContent = `Next reload: ${formatRemaining(remaining)}`;
}

async function refreshFromTab() {
  const result = await sendToActiveTab({ type: "cts:getStatus" });
  if (!result) {
    renderStatus({ running: false, nextReloadAt: null });
    el.countdown.textContent = "Open x.com or twitter.com tab";
    return;
  }
  renderStatus(result.status);
  if (result.config) {
    fillForm(normalizeConfig(result.config));
  }
  renderCountdown();
}

async function saveConfig() {
  const config = configFromForm();
  await chrome.storage.sync.set(config);
  await refreshFromTab();
}

async function applyConfigToTab() {
  const config = configFromForm();
  await chrome.storage.sync.set(config);
  const response = await sendToActiveTab({ type: "cts:applyConfig", config });
  if (response?.status) {
    renderStatus(response.status);
    renderCountdown();
  }
}

async function toggleRunning() {
  const action = latestStatus?.running ? "cts:stop" : "cts:start";
  const response = await sendToActiveTab({ type: action });
  if (response?.status) {
    renderStatus(response.status);
    renderCountdown();
  }
}

async function initialize() {
  const stored = await chrome.storage.sync.get(Object.keys(DEFAULT_CONFIG));
  const config = normalizeConfig(stored);
  fillForm(config);
  renderStatus({ running: false, nextReloadAt: null });
  renderCountdown();
  await refreshFromTab();

  el.baseStepPx.addEventListener("input", () => {
    el.speedValue.textContent = `${Number(el.baseStepPx.value).toFixed(1)} px/tick`;
  });

  el.saveButton.addEventListener("click", saveConfig);
  el.applyButton.addEventListener("click", applyConfigToTab);
  el.toggleButton.addEventListener("click", toggleRunning);

  countdownTimer = setInterval(renderCountdown, 1000);
}

window.addEventListener("unload", () => {
  if (countdownTimer) {
    clearInterval(countdownTimer);
  }
});

initialize();
