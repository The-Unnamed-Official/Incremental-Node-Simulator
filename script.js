const TICK_RATE = 1000 / 60;
const BASE_LEVEL_DURATION = 60;
const LEVEL_DURATION_INCREMENT = 10;
const BASE_BOSS_HP = 200;
const BOSS_HP_INCREMENT = 100;
const NODE_SIZE = 82;
const GAME_VERSION = 'v0.324';

function getLevelDuration(levelIndex = 1) {
  const safeIndex = Math.max(1, levelIndex);
  return BASE_LEVEL_DURATION + (safeIndex - 1) * LEVEL_DURATION_INCREMENT;
}

function getBossBaseHP(levelIndex = 1) {
  const safeIndex = Math.max(1, levelIndex);
  return BASE_BOSS_HP + (safeIndex - 1) * BOSS_HP_INCREMENT;
}

function createInitialState() {
  return {
    bits: 0,
    cryptcoins: 0,
    prestige: 0,
    xp: 0,
    level: 1,
    lp: 0,
    levelXP: 0,
    xpForNext: 100,
    health: 100,
    maxHealth: 100,
    nodesDestroyed: {
      red: 0,
      blue: 0,
      gold: 0,
    },
    bossKills: 0,
    currentLevel: {
      index: 1,
      timer: getLevelDuration(1),
      active: true,
      bossActive: false,
      bossHP: 0,
      bossMaxHP: 0,
    },
    upgrades: {},
    weirdSkillsPurchased: 0,
    labUnlocked: false,
    labProgress: 0,
    labSpeed: 0,
    labDeposited: 0,
    crypto: {
      deposit: 0,
      rate: 0,
      timeRemaining: 0,
    },
    skins: {
      owned: new Set(['default']),
      active: 'default',
    },
    automationSkills: {},
    settings: {
      crt: true,
      scanlines: true,
      screenShake: 50,
      bgm: 0.5,
      sfx: 0.7,
      palette: 'default',
      reducedAnimation: false,
    },
    selectedUpgradeFilter: 'damage',
    lastSavedAt: null,
  };
}

const state = createInitialState();

const SAVE_KEY = 'ins-progress-v1';
const AUTO_SAVE_INTERVAL = 15000;
const DEFAULT_STATE_SERIALIZED = JSON.stringify(createInitialState(), stateReplacer);
let autoSaveHandle = null;
let saveTimeout = null;
let saveStatusTimer = null;

const stats = {
  baseDamage: 5,
  damage: 5,
  critChance: 0.05,
  critMultiplier: 2,
  autoDamage: 0,
  autoInterval: 1,
  pointerSize: 32,
  bitGain: 1,
  xpGain: 1,
  prestigeGain: 1,
  nodeSpawnDelay: 2,
  maxNodes: 4,
  nodeHPFactor: 1,
  bossHPFactor: 1,
  defense: 0,
  regen: 0,
  healthDamageBonus: 0,
  nodeCountDamageBonus: 0,
  weirdSynergy: 0,
};

const nodeTypes = [
  {
    id: 'red',
    name: 'Red Node',
    color: 'red',
    reward(level) {
      const base = 8 + level * 3;
      return { bits: base };
    },
    hp(level) {
      return 24 + level * 4;
    },
  },
  {
    id: 'blue',
    name: 'Blue Node',
    color: 'blue',
    reward(level) {
      const base = 6 + level * 2;
      return { bits: base * 0.8, xp: 4 + level };
    },
    hp(level) {
      return 30 + level * 5;
    },
  },
  {
    id: 'gold',
    name: 'Gold Node',
    color: 'gold',
    reward(level) {
      return { bits: 80 + level * 12, cryptcoins: 1 + level * 0.1 };
    },
    hp(level) {
      return 50 + level * 10;
    },
  },
];

const bossNames = [
  'Reality Architect',
  'Quantum Predator',
  'Neon Leviathan',
  'Entropy Weaver',
  'Starving Singularity',
  'Vitriol Angel',
  'Oblivion Scribe',
  'Graviton Oracle',
];

const SKILL_CHECK_DIFFICULTIES = {
  easy: 4.2,
  normal: 3.1,
  hard: 2.4,
};

let upgrades = [];
let milestones = [];
let achievements = [];
let skins = [];
let automationNodes = [];
let tooltipEl;
let achievementTimer = 0;

const UI = {};
const skillCheckState = {
  active: false,
  timer: 0,
  duration: 0,
  resolve: null,
  reward: null,
};

const cursorPosition = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
let bgmAudio;
let audioUnlocked = false;

document.addEventListener('DOMContentLoaded', () => {
  cacheElements();
  generateSkins();
  generateUpgrades();
  generateAutomationSkills();
  generateMilestones();
  generateAchievements();
  loadGame();
  setupTabs();
  setupFilters();
  applySavedUpgradeFilter();
  setupSettings();
  renderSkins();
  renderMilestones();
  renderAchievements();
  renderAutomationTree();
  initTooltip();
  setupCryptoControls();
  setupLabControls();
  setupLevelDialog();
  setupCursor();
  setupAudio();
  setupSkillCheck();
  syncLabVisibility();
  updateStats();
  updateResources();
  setupPersistence();
  startGameLoop();
});

function cacheElements() {
  UI.bits = document.getElementById('bits-display');
  UI.cryptcoins = document.getElementById('cryptcoin-display');
  UI.prestige = document.getElementById('prestige-display');
  UI.xp = document.getElementById('xp-display');
  UI.level = document.getElementById('level-display');
  UI.lp = document.getElementById('lp-display');
  UI.skillTree = document.getElementById('skill-tree');
  UI.upgradeCount = document.getElementById('upgrade-count');
  UI.weirdProgress = document.getElementById('weird-progress');
  UI.nodeArea = document.getElementById('node-area');
  UI.particleLayer = document.getElementById('particle-layer');
  UI.bitLayer = document.getElementById('bit-layer');
  UI.currentLevel = document.getElementById('current-level');
  UI.versionDisplay = document.getElementById('version-display');
  if (UI.versionDisplay) {
    UI.versionDisplay.textContent = GAME_VERSION;
  }
  UI.milestoneList = document.getElementById('milestone-list');
  UI.achievementGrid = document.getElementById('achievement-grid');
  UI.cryptoDeposited = document.getElementById('crypto-deposited');
  UI.cryptoReturns = document.getElementById('crypto-returns');
  UI.cryptoTimer = document.getElementById('crypto-timer');
  UI.labLocked = document.getElementById('lab-locked');
  UI.labPanel = document.getElementById('lab-panel');
  UI.labProgressFill = document.getElementById('lab-progress-fill');
  UI.labProgressText = document.getElementById('lab-progress-text');
  UI.labSpeed = document.getElementById('lab-speed');
  UI.toggleCRT = document.getElementById('toggle-crt');
  UI.skinGrid = document.getElementById('skin-grid');
  UI.automationTree = document.getElementById('automation-tree');
  UI.saveGame = document.getElementById('save-game');
  UI.newGame = document.getElementById('new-game');
  UI.saveStatus = document.getElementById('save-status');
  UI.saveTimestamp = document.getElementById('save-timestamp');
  UI.customCursor = document.getElementById('custom-cursor');
  UI.skillCheck = document.getElementById('skill-check');
  UI.skillCheckProgress = document.getElementById('skill-check-progress');
  UI.skillCheckAction = document.getElementById('skill-check-action');
  UI.skillCheckTitle = document.getElementById('skill-check-title');
  UI.skillCheckDescription = document.getElementById('skill-check-description');
  UI.levelDialog = document.getElementById('level-dialog');
  UI.levelDialogSummary = document.getElementById('level-dialog-summary');
  UI.levelContinue = document.getElementById('level-continue');
  UI.levelReplay = document.getElementById('level-replay');
}

function setupPersistence() {
  if (UI.saveGame) {
    UI.saveGame.addEventListener('click', () => {
      saveGame({ notify: true });
    });
  }
  if (UI.newGame) {
    UI.newGame.addEventListener('click', () => {
      const confirmed = window.confirm('Start a new simulation? This will erase your current progress.');
      if (!confirmed) return;
      startNewGame();
    });
  }
  if (!autoSaveHandle) {
    autoSaveHandle = setInterval(() => saveGame(), AUTO_SAVE_INTERVAL);
  }
  window.addEventListener('beforeunload', () => {
    flushSaveQueue();
    saveGame();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flushSaveQueue();
      saveGame();
    }
  });
}

function applySavedUpgradeFilter() {
  const buttons = Array.from(document.querySelectorAll('.filter'));
  if (buttons.length === 0) {
    renderUpgrades('damage');
    return;
  }
  const desired = state.selectedUpgradeFilter || 'damage';
  let matched = false;
  buttons.forEach((btn) => {
    if (btn.dataset.filter === desired) {
      btn.classList.add('active');
      matched = true;
    } else {
      btn.classList.remove('active');
    }
  });
  const activeFilter = matched ? desired : buttons[0].dataset.filter;
  if (!matched) {
    buttons.forEach((btn, index) => {
      if (index === 0) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
    state.selectedUpgradeFilter = activeFilter;
    queueSave();
  }
  renderUpgrades(activeFilter);
}

function loadGame() {
  let data = null;
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        data = JSON.parse(raw);
      }
    }
  } catch (error) {
    console.warn('Failed to load save data', error);
  }
  hydrateState(data || {});
  syncLabVisibility();
  if (UI.versionDisplay) {
    UI.versionDisplay.textContent = GAME_VERSION;
  }
}

function hydrateState(source = {}) {
  const defaults = getDefaultState();
  const mergedNodes = { ...defaults.nodesDestroyed, ...(source.nodesDestroyed || {}) };
  const mergedLevel = { ...defaults.currentLevel, ...(source.currentLevel || {}) };
  const mergedCrypto = { ...defaults.crypto, ...(source.crypto || {}) };
  const mergedSettings = { ...defaults.settings, ...(source.settings || {}) };
  const mergedAutomation = { ...defaults.automationSkills, ...(source.automationSkills || {}) };
  const mergedUpgrades = { ...(defaults.upgrades || {}), ...(source.upgrades || {}) };
  const mergedSkins = {
    active: (source.skins && source.skins.active) || defaults.skins.active,
    owned: (source.skins && source.skins.owned) || defaults.skins.owned,
  };

  state.bits = Number.isFinite(Number(source.bits)) ? Number(source.bits) : defaults.bits;
  state.cryptcoins = Number.isFinite(Number(source.cryptcoins)) ? Number(source.cryptcoins) : defaults.cryptcoins;
  state.prestige = Number.isFinite(Number(source.prestige)) ? Number(source.prestige) : defaults.prestige;
  state.xp = Number.isFinite(Number(source.xp)) ? Number(source.xp) : defaults.xp;
  state.level = Math.max(1, Number.isFinite(Number(source.level)) ? Number(source.level) : defaults.level);
  state.lp = Number.isFinite(Number(source.lp)) ? Number(source.lp) : defaults.lp;
  state.levelXP = Number.isFinite(Number(source.levelXP)) ? Number(source.levelXP) : defaults.levelXP;
  state.xpForNext = Math.max(1, Number.isFinite(Number(source.xpForNext)) ? Number(source.xpForNext) : defaults.xpForNext);
  state.health = Number.isFinite(Number(source.health)) ? Number(source.health) : defaults.health;
  state.maxHealth = Number.isFinite(Number(source.maxHealth)) ? Number(source.maxHealth) : defaults.maxHealth;
  state.nodesDestroyed = {
    red: Math.max(0, Number.isFinite(Number(mergedNodes.red)) ? Number(mergedNodes.red) : defaults.nodesDestroyed.red),
    blue: Math.max(0, Number.isFinite(Number(mergedNodes.blue)) ? Number(mergedNodes.blue) : defaults.nodesDestroyed.blue),
    gold: Math.max(0, Number.isFinite(Number(mergedNodes.gold)) ? Number(mergedNodes.gold) : defaults.nodesDestroyed.gold),
  };
  state.bossKills = Number.isFinite(Number(source.bossKills)) ? Number(source.bossKills) : defaults.bossKills;
  state.currentLevel = {
    index: Math.max(1, Number.isFinite(Number(mergedLevel.index)) ? Number(mergedLevel.index) : defaults.currentLevel.index),
    timer: Number.isFinite(Number(mergedLevel.timer)) ? Number(mergedLevel.timer) : defaults.currentLevel.timer,
    active: coerceBoolean(mergedLevel.active, defaults.currentLevel.active),
    bossActive: coerceBoolean(mergedLevel.bossActive, defaults.currentLevel.bossActive),
    bossHP: Number.isFinite(Number(mergedLevel.bossHP)) ? Number(mergedLevel.bossHP) : defaults.currentLevel.bossHP,
    bossMaxHP: Number.isFinite(Number(mergedLevel.bossMaxHP)) ? Number(mergedLevel.bossMaxHP) : defaults.currentLevel.bossMaxHP,
  };
  const expectedTimer = getLevelDuration(state.currentLevel.index);
  state.currentLevel.timer = Math.min(expectedTimer, Math.max(0, state.currentLevel.timer || expectedTimer));
  const sanitizedUpgrades = {};
  Object.entries(mergedUpgrades).forEach(([id, level]) => {
    const numeric = Number(level);
    if (Number.isFinite(numeric) && numeric > 0) {
      sanitizedUpgrades[id] = numeric;
    }
  });
  state.upgrades = sanitizedUpgrades;
  state.weirdSkillsPurchased = Math.max(
    0,
    Number.isFinite(Number(source.weirdSkillsPurchased)) ? Number(source.weirdSkillsPurchased) : defaults.weirdSkillsPurchased,
  );
  state.labUnlocked = coerceBoolean(source.labUnlocked, defaults.labUnlocked);
  state.labProgress = Math.max(0, Number.isFinite(Number(source.labProgress)) ? Number(source.labProgress) : defaults.labProgress);
  state.labSpeed = Math.max(0, Number.isFinite(Number(source.labSpeed)) ? Number(source.labSpeed) : defaults.labSpeed);
  state.labDeposited = Math.max(0, Number.isFinite(Number(source.labDeposited)) ? Number(source.labDeposited) : defaults.labDeposited);
  state.crypto = {
    deposit: Math.max(0, Number.isFinite(Number(mergedCrypto.deposit)) ? Number(mergedCrypto.deposit) : defaults.crypto.deposit),
    rate: Math.max(0, Number.isFinite(Number(mergedCrypto.rate)) ? Number(mergedCrypto.rate) : defaults.crypto.rate),
    timeRemaining: Math.max(
      0,
      Number.isFinite(Number(mergedCrypto.timeRemaining)) ? Number(mergedCrypto.timeRemaining) : defaults.crypto.timeRemaining,
    ),
  };
  state.skins = {
    active: typeof mergedSkins.active === 'string' ? mergedSkins.active : defaults.skins.active,
    owned: new Set(Array.isArray(mergedSkins.owned) ? mergedSkins.owned : defaults.skins.owned),
  };
  if (!state.skins.owned.has('default')) {
    state.skins.owned.add('default');
  }
  const sanitizedAutomation = {};
  Object.entries(mergedAutomation).forEach(([id, purchased]) => {
    if (purchased) {
      sanitizedAutomation[id] = true;
    }
  });
  state.automationSkills = sanitizedAutomation;
  state.settings = {
    crt: coerceBoolean(mergedSettings.crt, defaults.settings.crt),
    scanlines: coerceBoolean(mergedSettings.scanlines, defaults.settings.scanlines),
    screenShake: Number.isFinite(Number(mergedSettings.screenShake))
      ? Number(mergedSettings.screenShake)
      : defaults.settings.screenShake,
    bgm: Number.isFinite(Number(mergedSettings.bgm)) ? Number(mergedSettings.bgm) : defaults.settings.bgm,
    sfx: Number.isFinite(Number(mergedSettings.sfx)) ? Number(mergedSettings.sfx) : defaults.settings.sfx,
    palette: typeof mergedSettings.palette === 'string' ? mergedSettings.palette : defaults.settings.palette,
    reducedAnimation: coerceBoolean(mergedSettings.reducedAnimation, defaults.settings.reducedAnimation),
  };
  state.selectedUpgradeFilter = typeof source.selectedUpgradeFilter === 'string'
    ? source.selectedUpgradeFilter
    : defaults.selectedUpgradeFilter;
  const lastSavedCandidate = Number(source.lastSavedAt);
  state.lastSavedAt = Number.isFinite(lastSavedCandidate) && lastSavedCandidate > 0 ? lastSavedCandidate : defaults.lastSavedAt;
  state.health = Math.min(state.maxHealth, Math.max(0, state.health));
  updateSaveTimestamp();
}

function getDefaultState() {
  try {
    return JSON.parse(DEFAULT_STATE_SERIALIZED);
  } catch (error) {
    console.warn('Failed to parse default state snapshot', error);
    return JSON.parse(JSON.stringify(createInitialState(), stateReplacer));
  }
}

function stateReplacer(key, value) {
  if (value instanceof Set) {
    return Array.from(value);
  }
  return value;
}

function coerceBoolean(value, fallback) {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const lower = value.toLowerCase();
    if (lower === 'true') return true;
    if (lower === 'false') return false;
  }
  return fallback;
}

function saveGame(options = {}) {
  const { notify = false, message } = options;
  const previous = state.lastSavedAt;
  try {
    if (typeof localStorage === 'undefined') {
      return;
    }
    const now = Date.now();
    state.lastSavedAt = now;
    const payload = JSON.stringify(state, stateReplacer);
    localStorage.setItem(SAVE_KEY, payload);
    updateSaveTimestamp();
    if (notify) {
      showSaveStatus(message || 'Progress saved');
    }
  } catch (error) {
    state.lastSavedAt = previous;
    updateSaveTimestamp();
    console.warn('Failed to save game', error);
    if (notify) {
      showSaveStatus('Save failed', 'error');
    }
  }
}

function queueSave(delay = 1000) {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  saveTimeout = setTimeout(() => {
    saveTimeout = null;
    saveGame();
  }, delay);
}

function flushSaveQueue() {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
    saveTimeout = null;
  }
}

function showSaveStatus(text, type = 'info') {
  if (!UI.saveStatus) return;
  UI.saveStatus.textContent = text;
  UI.saveStatus.classList.toggle('error', type === 'error');
  UI.saveStatus.classList.add('visible');
  if (saveStatusTimer) {
    clearTimeout(saveStatusTimer);
  }
  saveStatusTimer = setTimeout(() => {
    if (UI.saveStatus) {
      UI.saveStatus.classList.remove('visible');
    }
    saveStatusTimer = null;
  }, 3200);
}

function updateSaveTimestamp() {
  if (!UI.saveTimestamp) {
    return;
  }
  if (!state.lastSavedAt) {
    UI.saveTimestamp.textContent = 'never';
    UI.saveTimestamp.removeAttribute('title');
    return;
  }
  const date = new Date(state.lastSavedAt);
  if (Number.isNaN(date.getTime())) {
    UI.saveTimestamp.textContent = 'never';
    UI.saveTimestamp.removeAttribute('title');
    return;
  }
  UI.saveTimestamp.textContent = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  UI.saveTimestamp.title = date.toLocaleString();
}

function startNewGame() {
  hydrateState(getDefaultState());
  activeNodes.forEach((node) => node.el.remove());
  activeNodes.clear();
  if (activeBoss?.el) {
    activeBoss.el.remove();
  }
  activeBoss = null;
  nodeSpawnTimer = 0;
  autoClickTimer = 0;
  state.currentLevel.timer = getLevelDuration(state.currentLevel.index);
  state.currentLevel.active = true;
  state.currentLevel.bossActive = false;
  state.health = state.maxHealth;
  hideLevelDialog();
  applySavedUpgradeFilter();
  renderSkins();
  renderMilestones();
  renderAchievements();
  renderAutomationTree();
  syncLabVisibility();
  applySettingsToControls();
  applyDisplaySettings();
  updateBGMVolume();
  updateStats();
  updateResources();
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(SAVE_KEY);
    }
  } catch (error) {
    console.warn('Failed to clear save data', error);
  }
  saveGame({ notify: true, message: 'Progress reset' });
}

function syncLabVisibility() {
  if (!UI.labLocked || !UI.labPanel) return;
  if (state.labUnlocked) {
    UI.labLocked.classList.add('hidden');
    UI.labPanel.classList.remove('hidden');
  } else {
    UI.labLocked.classList.remove('hidden');
    UI.labPanel.classList.add('hidden');
  }
}

function setupTabs() {
  const buttons = document.querySelectorAll('.tab-button');
  const contents = document.querySelectorAll('.tab-content');
  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      buttons.forEach((b) => b.classList.remove('active'));
      contents.forEach((c) => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
      if (btn.dataset.tab === 'automation') {
        requestAnimationFrame(drawAutomationConnectors);
      }
    });
  });
}

function setupFilters() {
  const filters = document.querySelectorAll('.filter');
  filters.forEach((filter) => {
    filter.addEventListener('click', () => {
      filters.forEach((f) => f.classList.remove('active'));
      filter.classList.add('active');
      const value = filter.dataset.filter;
      if (state.selectedUpgradeFilter !== value) {
        state.selectedUpgradeFilter = value;
        queueSave();
      }
      renderUpgrades(value);
    });
  });
}

function setupSettings() {
  if (UI.toggleCRT) {
    UI.toggleCRT.addEventListener('click', () => {
      state.settings.crt = !state.settings.crt;
      const crtToggle = document.getElementById('crt-toggle');
      if (crtToggle) {
        crtToggle.checked = state.settings.crt;
      }
      UI.toggleCRT.textContent = state.settings.crt ? 'CRT ON' : 'CRT OFF';
      applyDisplaySettings();
      queueSave();
    });
  }
  const screenShake = document.getElementById('screen-shake');
  if (screenShake) {
    screenShake.addEventListener('input', (e) => {
      state.settings.screenShake = Number(e.target.value);
      queueSave();
    });
  }
  const crtToggle = document.getElementById('crt-toggle');
  if (crtToggle) {
    crtToggle.addEventListener('change', (e) => {
      state.settings.crt = e.target.checked;
      if (UI.toggleCRT) {
        UI.toggleCRT.textContent = state.settings.crt ? 'CRT ON' : 'CRT OFF';
      }
      applyDisplaySettings();
      queueSave();
    });
  }
  const scanlineToggle = document.getElementById('scanline-toggle');
  if (scanlineToggle) {
    scanlineToggle.addEventListener('change', (e) => {
      state.settings.scanlines = e.target.checked;
      applyDisplaySettings();
      queueSave();
    });
  }
  const reduceAnimationToggle = document.getElementById('reduce-animation');
  if (reduceAnimationToggle) {
    reduceAnimationToggle.addEventListener('change', (e) => {
      state.settings.reducedAnimation = e.target.checked;
      applyDisplaySettings();
      queueSave();
    });
  }
  const paletteSelect = document.getElementById('palette-select');
  if (paletteSelect) {
    paletteSelect.addEventListener('change', (e) => {
      state.settings.palette = e.target.value;
      applyDisplaySettings();
      queueSave();
    });
  }
  const bgmVolume = document.getElementById('bgm-volume');
  if (bgmVolume) {
    bgmVolume.addEventListener('input', (e) => {
      state.settings.bgm = Number(e.target.value) / 100;
      updateBGMVolume();
      queueSave();
    });
  }
  const sfxVolume = document.getElementById('sfx-volume');
  if (sfxVolume) {
    sfxVolume.addEventListener('input', (e) => {
      state.settings.sfx = Number(e.target.value) / 100;
      queueSave();
    });
  }
  applySettingsToControls();
  applyDisplaySettings();
  updateBGMVolume();
}

function applyDisplaySettings() {
  document.body.classList.toggle('disable-crt', !state.settings.crt);
  document.body.classList.toggle('disable-scanlines', !state.settings.scanlines);
  document.body.classList.toggle('reduced-motion', state.settings.reducedAnimation);
  document.body.classList.remove('palette-violet', 'palette-emerald');
  if (state.settings.palette && state.settings.palette !== 'default') {
    document.body.classList.add(`palette-${state.settings.palette}`);
  }
  UI.toggleCRT.textContent = state.settings.crt ? 'CRT ON' : 'CRT OFF';
}

function applySettingsToControls() {
  const screenShake = document.getElementById('screen-shake');
  if (screenShake) {
    screenShake.value = state.settings.screenShake;
  }
  const crtToggle = document.getElementById('crt-toggle');
  if (crtToggle) {
    crtToggle.checked = state.settings.crt;
  }
  const scanlineToggle = document.getElementById('scanline-toggle');
  if (scanlineToggle) {
    scanlineToggle.checked = state.settings.scanlines;
  }
  const reduceAnimationToggle = document.getElementById('reduce-animation');
  if (reduceAnimationToggle) {
    reduceAnimationToggle.checked = state.settings.reducedAnimation;
  }
  const paletteSelect = document.getElementById('palette-select');
  if (paletteSelect) {
    paletteSelect.value = state.settings.palette;
  }
  const bgmVolume = document.getElementById('bgm-volume');
  if (bgmVolume) {
    bgmVolume.value = Math.round(state.settings.bgm * 100);
  }
  const sfxVolume = document.getElementById('sfx-volume');
  if (sfxVolume) {
    sfxVolume.value = Math.round(state.settings.sfx * 100);
  }
  if (UI.toggleCRT) {
    UI.toggleCRT.textContent = state.settings.crt ? 'CRT ON' : 'CRT OFF';
  }
}

function generateSkins() {
  skins = [
    { id: 'default', name: 'Default Core', cost: 0, description: 'Standard breach-grade node.' },
    { id: 'midnight', name: 'Midnight Bloom', cost: 1500, description: 'Deep blue core with starlight shimmer.' },
    { id: 'ember', name: 'Ember Pulse', cost: 4000, description: 'Charred shell containing molten data.' },
    { id: 'glitch', name: 'Glitch Prism', cost: 12000, description: 'Reality-warping shader, shifts per click.' },
    { id: 'aurora', name: 'Aurora Silk', cost: 25000, description: 'Refracted light swirling forever.' },
  ];
}

function renderSkins() {
  UI.skinGrid.innerHTML = '';
  skins.forEach((skin) => {
    const card = document.createElement('div');
    card.className = 'skin-card';
    if (state.skins.owned.has(skin.id)) {
      card.classList.add('owned');
    }
    const preview = document.createElement('div');
    preview.className = 'skin-preview';
    preview.innerHTML = `<div class="node ${skin.id === 'default' ? 'blue' : ''} skin-${skin.id}"><div class="core"></div></div>`;
    const title = document.createElement('div');
    title.textContent = skin.name;
    const desc = document.createElement('div');
    desc.textContent = skin.description;
    const cost = document.createElement('div');
    cost.textContent = skin.cost ? `${skin.cost.toLocaleString()} bits` : 'owned';
    const button = document.createElement('button');
    button.className = 'pill';
    if (state.skins.active === skin.id) {
      button.textContent = 'equipped';
      button.disabled = true;
    } else if (state.skins.owned.has(skin.id)) {
      button.textContent = 'equip';
    } else {
      button.textContent = 'buy';
    }
    button.addEventListener('click', () => {
      if (!state.skins.owned.has(skin.id)) {
        if (state.bits >= skin.cost) {
          state.bits -= skin.cost;
          state.skins.owned.add(skin.id);
          state.skins.active = skin.id;
          renderSkins();
          updateResources();
          queueSave();
        }
      } else {
        state.skins.active = skin.id;
        renderSkins();
        queueSave();
      }
    });
    card.append(preview, title, desc, cost, button);
    UI.skinGrid.appendChild(card);
  });
}

function generateUpgrades() {
  const families = [
    { key: 'damage', count: 80, baseName: 'Node Piercer', minLevel: 5, maxLevel: 20, baseCost: 50, scale: 1.35, perLevel: 0.06 },
    { key: 'crit', count: 60, baseName: 'Critical Bloom', minLevel: 3, maxLevel: 12, baseCost: 120, scale: 1.4, perLevel: 0.02 },
    { key: 'economy', count: 70, baseName: 'Extraction Protocol', minLevel: 5, maxLevel: 25, baseCost: 80, scale: 1.33, perLevel: 0.05 },
    { key: 'control', count: 50, baseName: 'Node Field', minLevel: 4, maxLevel: 18, baseCost: 140, scale: 1.38, perLevel: 0.04 },
    { key: 'defense', count: 50, baseName: 'Resilience Matrix', minLevel: 4, maxLevel: 15, baseCost: 100, scale: 1.36, perLevel: 4 },
    { key: 'ability', count: 50, baseName: 'Catalyst Drive', minLevel: 3, maxLevel: 10, baseCost: 160, scale: 1.42, perLevel: 0.08 },
    { key: 'weird', count: 40, baseName: 'Paradox Glyph', minLevel: 1, maxLevel: 6, baseCost: 1, scale: 2.5, perLevel: 0.15 },
  ];
  const effects = {
    damage: (stats, level, data) => {
      stats.damage += stats.baseDamage * data.perLevel * level;
    },
    crit: (stats, level, data) => {
      stats.critChance += data.perLevel * level;
    },
    economy: (stats, level, data) => {
      stats.bitGain += data.perLevel * level;
    },
    control: (stats, level) => {
      stats.maxNodes += Math.floor(level / 2);
      stats.nodeSpawnDelay = Math.max(0.3, stats.nodeSpawnDelay - level * 0.02);
    },
    defense: (stats, level, data) => {
      stats.maxHealth += data.perLevel * level;
      stats.regen += 0.05 * level;
      stats.defense += 0.4 * level;
    },
    ability: (stats, level, data) => {
      stats.autoDamage += 1.2 * level;
      stats.healthDamageBonus += data.perLevel * level;
    },
    weird: (stats, level, data) => {
      stats.weirdSynergy += data.perLevel * level;
      stats.nodeCountDamageBonus += 0.03 * level;
    },
  };

  upgrades = [];
  let idCounter = 1;
  families.forEach((family) => {
    for (let i = 0; i < family.count; i += 1) {
      const maxLevel = family.minLevel + (i % (family.maxLevel - family.minLevel + 1));
      const perLevel = family.perLevel * (1 + (i % 3) * 0.25);
      const costBase = family.baseCost * (1 + (i % 5) * 0.4);
      const costScale = family.scale + (i % 4) * 0.03;
      const id = `${family.key.toUpperCase()}_${idCounter}`;
      const name = `${family.baseName} ${romanNumeral((i % 24) + 1)}`;
      const desc = describeUpgrade(family.key, perLevel, maxLevel);
      const requirements = {};
      let currency = 'bits';
      if (family.key === 'weird') {
        requirements.prestige = Math.floor(i / 4) + 1;
        requirements.lp = Math.floor(i / 6);
        currency = 'prestige';
      } else if (family.key === 'ability' && i % 5 === 0) {
        requirements.lp = Math.floor(i / 5) + 1;
      }
      upgrades.push({
        id,
        category: family.key,
        name,
        description: desc,
        maxLevel,
        perLevel,
        costBase,
        costScale,
        currency,
        requirements,
        effect: (statsObj, level) => effects[family.key](statsObj, level, { perLevel, family }),
      });
      idCounter += 1;
    }
  });
}

function describeUpgrade(category, perLevel, maxLevel) {
  switch (category) {
    case 'damage':
      return `Boost raw node damage by ${(perLevel * 100).toFixed(1)}% per level. (${maxLevel} lvls)`;
    case 'crit':
      return `Increase crit chance by ${(perLevel * 100).toFixed(1)}% per level.`;
    case 'economy':
      return `Increase Bit yield by ${(perLevel * 100).toFixed(1)}% per level.`;
    case 'control':
      return `Enhance node control fields, spawning nodes faster and sustaining more on screen.`;
    case 'defense':
      return `Reinforce conduits, adding ${perLevel.toFixed(0)} HP per level and slight regen.`;
    case 'ability':
      return `Unlock catalyst routines adding auto-damage and scaling with health.`;
    case 'weird':
      return `Paradoxical glyph raising reality fracture damage by ${(perLevel * 100).toFixed(1)}%.`;
    default:
      return '';
  }
}

function romanNumeral(num) {
  const map = [
    [1000, 'M'],
    [900, 'CM'],
    [500, 'D'],
    [400, 'CD'],
    [100, 'C'],
    [90, 'XC'],
    [50, 'L'],
    [40, 'XL'],
    [10, 'X'],
    [9, 'IX'],
    [5, 'V'],
    [4, 'IV'],
    [1, 'I'],
  ];
  let result = '';
  let remaining = num;
  map.forEach(([value, numeral]) => {
    while (remaining >= value) {
      result += numeral;
      remaining -= value;
    }
  });
  return result;
}

function renderUpgrades(filter) {
  if (!UI.skillTree) return;
  const buttonFilter = document.querySelector('.filter.active')?.dataset.filter;
  const activeFilter = filter || state.selectedUpgradeFilter || buttonFilter || 'damage';
  state.selectedUpgradeFilter = activeFilter;
  UI.skillTree.innerHTML = '';
  const fragment = document.createDocumentFragment();
  const branchMap = new Map();
  const branchCounters = new Map();
  upgrades.forEach((upgrade) => {
    if (activeFilter !== 'all' && upgrade.category !== activeFilter) {
      return;
    }
    const level = state.upgrades[upgrade.id] || 0;
    const counter = branchCounters.get(upgrade.category) || 0;
    const tier = Math.floor(counter / 6);
    const branch = branchMap.get(upgrade.category) || [];
    if (!branch[tier]) {
      branch[tier] = [];
    }
    branch[tier].push({ upgrade, level });
    branchMap.set(upgrade.category, branch);
    branchCounters.set(upgrade.category, counter + 1);
  });

  branchMap.forEach((tiers, category) => {
    const branchEl = document.createElement('section');
    branchEl.className = 'skill-branch';
    branchEl.dataset.category = category;
    branchEl.setAttribute('role', 'listitem');
    const title = document.createElement('div');
    title.className = 'branch-title';
    const totalNodes = tiers.reduce((acc, tierNodes) => acc + tierNodes.length, 0);
    title.innerHTML = `<span>${category.toUpperCase()}</span><span>${totalNodes} nodes</span>`;
    const track = document.createElement('div');
    track.className = 'branch-track';
    tiers.forEach((tierNodes, tierIndex) => {
      tierNodes.forEach(({ upgrade, level }) => {
        const nodeEl = document.createElement('button');
        nodeEl.type = 'button';
        nodeEl.className = 'skill-node';
        if (tierIndex === 0) {
          nodeEl.classList.add('origin');
        }
        nodeEl.dataset.id = upgrade.id;
        nodeEl.dataset.category = upgrade.category;
        nodeEl.innerHTML = `
          <div class="title">${upgrade.name}</div>
          <div class="desc">${upgrade.description}</div>
          <div class="level">Level ${level} / ${upgrade.maxLevel}</div>
          <div class="cost">Cost: <span>${formatCost(upgrade, level)}</span> ${upgrade.currency}</div>
        `;
        if (level >= upgrade.maxLevel) {
          nodeEl.classList.add('purchased');
        }
        if (!meetsRequirements(upgrade)) {
          nodeEl.classList.add('locked');
        }
        nodeEl.addEventListener('click', () => attemptPurchase(upgrade));
        nodeEl.addEventListener('mousemove', (event) => showUpgradeTooltip(event, upgrade));
        nodeEl.addEventListener('mouseleave', hideTooltip);
        track.appendChild(nodeEl);
      });
    });
    branchEl.appendChild(title);
    branchEl.appendChild(track);
    fragment.appendChild(branchEl);
  });

  UI.skillTree.appendChild(fragment);
  const totalPurchased = Object.keys(state.upgrades).length;
  UI.upgradeCount.textContent = `${totalPurchased}`;
  UI.weirdProgress.textContent = `${state.weirdSkillsPurchased} / 20`;
}

function generateAutomationSkills() {
  automationNodes = [
    {
      id: 'sync-core',
      name: 'Sync Core',
      tagline: 'Kickstarts automation (-8% interval)',
      position: { row: 2, col: 5 },
      cost: { prestige: 2, lp: 3 },
      prereqs: [],
      effect: (statsObj) => {
        statsObj.autoInterval *= 0.92;
      },
    },
    {
      id: 'signal-doubler',
      name: 'Signal Doubler',
      tagline: 'Split the control beam (-10%)',
      position: { row: 3, col: 3 },
      cost: { prestige: 4, lp: 4 },
      prereqs: ['sync-core'],
      effect: (statsObj) => {
        statsObj.autoInterval *= 0.9;
      },
    },
    {
      id: 'frequency-gate',
      name: 'Frequency Gate',
      tagline: 'Phase locks cadence (-10%)',
      position: { row: 3, col: 7 },
      cost: { prestige: 4, lp: 5 },
      prereqs: ['sync-core'],
      effect: (statsObj) => {
        statsObj.autoInterval *= 0.9;
      },
    },
    {
      id: 'servo-cluster',
      name: 'Servo Cluster',
      tagline: 'Staggered actuators (-8%)',
      position: { row: 4, col: 2 },
      cost: { prestige: 6, lp: 7 },
      prereqs: ['signal-doubler'],
      effect: (statsObj) => {
        statsObj.autoInterval *= 0.92;
      },
    },
    {
      id: 'phase-weaver',
      name: 'Phase Weaver',
      tagline: 'Braids both channels (-12%)',
      position: { row: 4, col: 5 },
      cost: { prestige: 8, lp: 9 },
      prereqs: ['signal-doubler', 'frequency-gate'],
      effect: (statsObj) => {
        statsObj.autoInterval *= 0.88;
      },
    },
    {
      id: 'quantum-latch',
      name: 'Quantum Latch',
      tagline: 'Stabilises drift (-10%)',
      position: { row: 4, col: 8 },
      cost: { prestige: 8, lp: 9 },
      prereqs: ['frequency-gate'],
      effect: (statsObj) => {
        statsObj.autoInterval *= 0.9;
      },
    },
    {
      id: 'tachyon-loop',
      name: 'Tachyon Loop',
      tagline: 'Propels cadence (-18%)',
      position: { row: 5, col: 4 },
      cost: { prestige: 12, lp: 13 },
      prereqs: ['servo-cluster', 'phase-weaver'],
      effect: (statsObj) => {
        statsObj.autoInterval *= 0.82;
      },
    },
    {
      id: 'singularity-array',
      name: 'Singularity Array',
      tagline: 'Locks temporal echo (-15%)',
      position: { row: 5, col: 6 },
      cost: { prestige: 12, lp: 13 },
      prereqs: ['phase-weaver', 'quantum-latch'],
      effect: (statsObj) => {
        statsObj.autoInterval *= 0.85;
      },
    },
    {
      id: 'autonomy-core',
      name: 'Autonomy Core',
      tagline: 'Full automation (-25%)',
      position: { row: 6, col: 5 },
      cost: { prestige: 18, lp: 18 },
      prereqs: ['tachyon-loop', 'singularity-array'],
      effect: (statsObj) => {
        statsObj.autoInterval *= 0.75;
      },
    },
  ];
  const validSkillIds = new Set(automationNodes.map((skill) => skill.id));
  Object.keys(state.automationSkills).forEach((id) => {
    if (!validSkillIds.has(id)) {
      delete state.automationSkills[id];
    }
  });
}

function renderAutomationTree() {
  if (!UI.automationTree) return;
  UI.automationTree.innerHTML = '';
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.classList.add('automation-links');
  UI.automationTree.appendChild(svg);
  automationNodes.forEach((skill) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'automation-node';
    button.dataset.skill = skill.id;
    button.style.gridColumn = `${skill.position.col}`;
    button.style.gridRow = `${skill.position.row}`;
    const purchased = Boolean(state.automationSkills[skill.id]);
    const unlocked = skill.prereqs.length === 0 || skill.prereqs.every((id) => state.automationSkills[id]);
    const canAfford = state.prestige >= (skill.cost?.prestige || 0) && state.lp >= (skill.cost?.lp || 0);
    if (purchased) {
      button.classList.add('purchased');
    } else if (!unlocked) {
      button.classList.add('locked');
    }
    let costText = 'installed';
    if (!purchased) {
      const prestigeCost = skill.cost?.prestige || 0;
      const lpCost = skill.cost?.lp || 0;
      costText = `${prestigeCost} prestige · ${lpCost} LP`;
    }
    button.innerHTML = `
      <strong>${skill.name}</strong>
      <span>${skill.tagline}</span>
      <div class="cost">${costText}</div>
    `;
    button.disabled = purchased || !unlocked || !canAfford;
    button.addEventListener('click', () => purchaseAutomationSkill(skill));
    UI.automationTree.appendChild(button);
  });
  requestAnimationFrame(drawAutomationConnectors);
}

function purchaseAutomationSkill(skill) {
  if (!skill || state.automationSkills[skill.id]) return;
  const unlocked = skill.prereqs.length === 0 || skill.prereqs.every((id) => state.automationSkills[id]);
  if (!unlocked) return;
  const prestigeCost = skill.cost?.prestige || 0;
  const lpCost = skill.cost?.lp || 0;
  if (state.prestige < prestigeCost || state.lp < lpCost) return;
  state.prestige -= prestigeCost;
  state.lp -= lpCost;
  state.automationSkills[skill.id] = true;
  updateStats();
  updateResources();
  queueSave();
}

function drawAutomationConnectors() {
  if (!UI.automationTree) return;
  const svg = UI.automationTree.querySelector('.automation-links');
  if (!svg) return;
  const rect = UI.automationTree.getBoundingClientRect();
  svg.setAttribute('width', rect.width);
  svg.setAttribute('height', rect.height);
  svg.setAttribute('viewBox', `0 0 ${rect.width} ${rect.height}`);
  while (svg.firstChild) {
    svg.firstChild.remove();
  }
  automationNodes.forEach((skill) => {
    const child = UI.automationTree.querySelector(`[data-skill='${skill.id}']`);
    if (!child) return;
    const childRect = child.getBoundingClientRect();
    const childCenter = {
      x: childRect.left - rect.left + childRect.width / 2,
      y: childRect.top - rect.top + childRect.height / 2,
    };
    skill.prereqs.forEach((parentId) => {
      const parent = UI.automationTree.querySelector(`[data-skill='${parentId}']`);
      if (!parent) return;
      const parentRect = parent.getBoundingClientRect();
      const parentCenter = {
        x: parentRect.left - rect.left + parentRect.width / 2,
        y: parentRect.top - rect.top + parentRect.height / 2,
      };
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', parentCenter.x);
      line.setAttribute('y1', parentCenter.y);
      line.setAttribute('x2', childCenter.x);
      line.setAttribute('y2', childCenter.y);
      if (state.automationSkills[parentId] && state.automationSkills[skill.id]) {
        line.setAttribute('stroke', 'rgba(118, 244, 198, 0.85)');
      }
      svg.appendChild(line);
    });
  });
}

function meetsRequirements(upgrade) {
  const level = state.upgrades[upgrade.id] || 0;
  if (level >= upgrade.maxLevel) {
    return true;
  }
  const { requirements } = upgrade;
  if (requirements.prestige && state.prestige < requirements.prestige) {
    return false;
  }
  if (requirements.lp && state.lp < requirements.lp) {
    return false;
  }
  return true;
}

function formatCost(upgrade, level) {
  if (level >= upgrade.maxLevel) {
    return 'max';
  }
  const cost = Math.ceil(upgrade.costBase * upgrade.costScale ** level);
  return cost.toLocaleString();
}

function attemptPurchase(upgrade) {
  const level = state.upgrades[upgrade.id] || 0;
  if (level >= upgrade.maxLevel) {
    return;
  }
  if (!meetsRequirements(upgrade)) {
    return;
  }
  const cost = Math.ceil(upgrade.costBase * upgrade.costScale ** level);
  if (state[upgrade.currency] >= cost) {
    state[upgrade.currency] -= cost;
    state.upgrades[upgrade.id] = level + 1;
    if (upgrade.category === 'weird') {
      state.weirdSkillsPurchased += 1;
      if (!state.labUnlocked && state.weirdSkillsPurchased >= 20) {
        unlockLab();
      }
    }
    updateStats();
    updateResources();
    renderUpgrades(document.querySelector('.filter.active').dataset.filter);
    maybeStartSkillCheck(upgrade, cost);
    queueSave();
  }
}

function maybeStartSkillCheck(upgrade, cost) {
  if (skillCheckState.active) return;
  const baseChance = 0.18;
  const bonusChance = upgrade.category === 'weird' ? 0.12 : upgrade.category === 'ability' ? 0.08 : 0;
  if (Math.random() > baseChance + bonusChance) {
    return;
  }
  const difficulty = upgrade.category === 'damage' ? 'easy' : upgrade.category === 'weird' ? 'hard' : 'normal';
  const rewardBits = Math.ceil(cost * (difficulty === 'hard' ? 0.95 : difficulty === 'normal' ? 0.7 : 0.45));
  const rewardXP = Math.ceil(15 * (difficulty === 'hard' ? 2.2 : difficulty === 'normal' ? 1.4 : 1));
  startSkillCheck({
    upgrade,
    difficulty,
    reward: () => {
      state.bits += rewardBits;
      gainXP(rewardXP);
      createFloatText(UI.customCursor || document.body, `+${rewardBits} bits`, '#ffd166');
      updateResources();
    },
  });
}

function showUpgradeTooltip(event, upgrade) {
  if (!tooltipEl) return;
  const level = state.upgrades[upgrade.id] || 0;
  const nextCost = level < upgrade.maxLevel ? Math.ceil(upgrade.costBase * upgrade.costScale ** level) : null;
  tooltipEl.innerHTML = `
    <strong>${upgrade.name}</strong><br/>
    ${upgrade.description}<br/>
    Level: ${level} / ${upgrade.maxLevel}<br/>
    ${nextCost ? `Next cost: ${nextCost.toLocaleString()} ${upgrade.currency}` : 'Fully upgraded'}
  `;
  tooltipEl.style.display = 'block';
  tooltipEl.style.left = `${event.pageX + 12}px`;
  tooltipEl.style.top = `${event.pageY + 12}px`;
}

function hideTooltip() {
  if (tooltipEl) {
    tooltipEl.style.display = 'none';
  }
}

function initTooltip() {
  tooltipEl = document.createElement('div');
  tooltipEl.className = 'tooltip';
  tooltipEl.style.display = 'none';
  document.body.appendChild(tooltipEl);
}

function generateMilestones() {
  milestones = [
    { id: 'destroy-500-red', label: 'Red Defeater', goal: 500, type: 'red', reward: () => grantBits(500), claimed: false },
    { id: 'destroy-500-blue', label: 'Blue Defeater', goal: 500, type: 'blue', reward: () => grantBits(500), claimed: false },
  ];
  const milestonesExtra = [
    { type: 'red', goal: 2000, reward: () => grantBits(2500) },
    { type: 'blue', goal: 2000, reward: () => grantBits(2500) },
    { type: 'gold', goal: 500, reward: () => grantcryptcoins(50) },
    { type: 'boss', goal: 25, reward: () => grantPrestige(25) },
  ];
  milestonesExtra.forEach((entry, index) => {
    milestones.push({
      id: `${entry.type}-${entry.goal}`,
      label: `${entry.type.toUpperCase()} Hunter ${index + 1}`,
      goal: entry.goal,
      type: entry.type,
      reward: entry.reward,
      claimed: false,
    });
  });
}

function renderMilestones() {
  UI.milestoneList.innerHTML = '';
  milestones.forEach((milestone) => {
    const progress = getMilestoneProgress(milestone);
    const node = document.createElement('div');
    node.className = 'milestone';
    const info = document.createElement('div');
    info.innerHTML = `<strong>${milestone.label}</strong><br/>Progress: ${progress.current.toLocaleString()} / ${milestone.goal.toLocaleString()}`;
    const reward = document.createElement('div');
    reward.className = 'progress';
    reward.textContent = progress.claimed ? 'claimed' : progress.ready ? 'reward ready' : 'keep going';
    const button = document.createElement('button');
    button.className = 'pill';
    button.textContent = progress.claimed ? 'claimed' : progress.ready ? 'claim' : 'locked';
    button.disabled = progress.claimed || !progress.ready;
    button.addEventListener('click', () => {
      if (!progress.claimed && progress.ready) {
        milestone.reward();
        milestone.claimed = true;
        renderMilestones();
        updateResources();
      }
    });
    node.append(info, reward, button);
    UI.milestoneList.appendChild(node);
  });
}

function getMilestoneProgress(milestone) {
  const current = milestone.type === 'boss' ? state.bossKills : state.nodesDestroyed[milestone.type] || 0;
  const ready = current >= milestone.goal;
  return {
    current,
    ready,
    claimed: Boolean(milestone.claimed),
    goal: milestone.goal,
  };
}

function generateAchievements() {
  achievements = [
    { id: 'first-node', label: 'First Breach', description: 'Destroy your first node.', goal: 1, stat: () => totalNodesDestroyed() },
    { id: 'hundred-nodes', label: 'Node Recycler', description: 'Destroy 100 nodes.', goal: 100, stat: () => totalNodesDestroyed() },
    { id: 'level-5', label: 'Escalation', description: 'Reach level 5.', goal: 5, stat: () => state.level },
    { id: 'level-15', label: 'Unending Ascent', description: 'Reach level 15.', goal: 15, stat: () => state.level },
    { id: 'prestige-10', label: 'Prestige Initiate', description: 'Earn 10 prestige.', goal: 10, stat: () => state.prestige },
    { id: 'upgrade-50', label: 'Tinkerer', description: 'Purchase 50 upgrades.', goal: 50, stat: () => Object.keys(state.upgrades).length },
    { id: 'upgrade-200', label: 'Tree Diver', description: 'Purchase 200 upgrades.', goal: 200, stat: () => Object.keys(state.upgrades).length },
    { id: 'weird-10', label: 'Weird Whisperer', description: 'Purchase 10 weird upgrades.', goal: 10, stat: () => state.weirdSkillsPurchased },
    { id: 'lab-unlock', label: 'Researcher', description: 'Assemble the lab.', goal: 1, stat: () => (state.labUnlocked ? 1 : 0) },
    { id: 'crypto-hoard', label: 'Miner 49k', description: 'Accumulate 50k cryptcoins.', goal: 50000, stat: () => state.cryptcoins },
  ];
}

function renderAchievements() {
  UI.achievementGrid.innerHTML = '';
  achievements.forEach((achievement) => {
    const current = achievement.stat();
    const achieved = current >= achievement.goal;
    const card = document.createElement('div');
    card.className = 'achievement';
    if (achieved) {
      card.classList.add('owned');
    }
    card.innerHTML = `
      <strong>${achievement.label}</strong>
      <div>${achievement.description}</div>
      <div class="progress">${Math.min(current, achievement.goal).toLocaleString()} / ${achievement.goal.toLocaleString()}</div>
    `;
    UI.achievementGrid.appendChild(card);
  });
}

function setupCryptoControls() {
  document.querySelectorAll('.deposit').forEach((button) => {
    button.addEventListener('click', () => {
      const amount = Number(button.dataset.amount);
      depositToCrypto(amount);
    });
  });
  document.getElementById('confirm-deposit').addEventListener('click', () => {
    const amount = Number(document.getElementById('custom-deposit').value);
    if (Number.isFinite(amount) && amount > 0) {
      depositToCrypto(amount);
      document.getElementById('custom-deposit').value = '';
    }
  });
  document.getElementById('withdraw-crypto').addEventListener('click', () => {
    if (state.crypto.deposit > 0) {
      state.bits += state.crypto.deposit;
      state.crypto.deposit = 0;
      state.crypto.rate = 0;
      state.crypto.timeRemaining = 0;
      updateCryptoUI();
      updateResources();
      queueSave();
    }
  });
}

function depositToCrypto(amount) {
  if (state.bits >= amount) {
    state.bits -= amount;
    state.crypto.deposit += amount;
    state.crypto.rate = Math.sqrt(state.crypto.deposit) / 10 + stats.weirdSynergy;
    state.crypto.timeRemaining = Math.max(10, Math.log(state.crypto.deposit + 1) * 30);
    updateCryptoUI();
    updateResources();
    queueSave();
  }
}

function updateCryptoUI() {
  UI.cryptoDeposited.textContent = state.crypto.deposit.toLocaleString();
  UI.cryptoReturns.textContent = `${state.crypto.rate.toFixed(3)} / sec`;
  const time = Math.max(0, state.crypto.timeRemaining);
  const minutes = Math.floor(time / 60)
    .toString()
    .padStart(2, '0');
  const seconds = Math.floor(time % 60)
    .toString()
    .padStart(2, '0');
  UI.cryptoTimer.textContent = `${minutes}:${seconds}`;
}

function setupLabControls() {
  document.getElementById('lab-confirm').addEventListener('click', () => {
    if (!state.labUnlocked) return;
    const amount = Number(document.getElementById('lab-deposit').value);
    if (Number.isFinite(amount) && amount > 0 && state.cryptcoins >= amount) {
      state.cryptcoins -= amount;
      state.labDeposited += amount;
      state.labSpeed = Math.sqrt(state.labDeposited) / 5 + state.weirdSkillsPurchased * 0.25;
      updateLabUI();
      updateResources();
      queueSave();
    }
  });
  document.getElementById('breach-lab').addEventListener('click', () => {
    if (state.labProgress >= 1000) {
      grantPrestige(250);
      state.labProgress = 0;
      state.labDeposited = 0;
      state.labSpeed = 0;
      updateLabUI();
      updateResources();
      queueSave();
    }
  });
}

function unlockLab() {
  state.labUnlocked = true;
  syncLabVisibility();
  renderAchievements();
  queueSave();
}

function updateLabUI() {
  if (!state.labUnlocked) return;
  const progress = Math.min(1, state.labProgress / 1000);
  UI.labProgressFill.style.width = `${progress * 100}%`;
  UI.labProgressText.textContent = `${state.labProgress.toFixed(3)} / 1000.000`;
  UI.labSpeed.textContent = `${state.labSpeed.toFixed(3)} / sec`;
}

function setupLevelDialog() {
  if (!UI.levelDialog) UI.levelDialog = document.getElementById('level-dialog');
  if (!UI.levelDialogSummary) UI.levelDialogSummary = document.getElementById('level-dialog-summary');
  if (!UI.levelContinue) UI.levelContinue = document.getElementById('level-continue');
  if (!UI.levelReplay) UI.levelReplay = document.getElementById('level-replay');
  if (!UI.levelDialog || !UI.levelContinue || !UI.levelReplay) return;
  UI.levelContinue.addEventListener('click', () => {
    hideLevelDialog();
    resetLevel(true);
  });
  UI.levelReplay.addEventListener('click', () => {
    hideLevelDialog();
    resetLevel(false);
  });
}

function showLevelDialog(summary) {
  if (!UI.levelDialog) UI.levelDialog = document.getElementById('level-dialog');
  if (!UI.levelDialogSummary) UI.levelDialogSummary = document.getElementById('level-dialog-summary');
  if (!UI.levelContinue) UI.levelContinue = document.getElementById('level-continue');
  if (!UI.levelDialog || !UI.levelDialogSummary) return;
  UI.levelDialogSummary.textContent = summary;
  UI.levelDialog.classList.remove('hidden');
  if (UI.levelContinue) {
    UI.levelContinue.focus({ preventScroll: true });
  }
}

function hideLevelDialog() {
  if (!UI.levelDialog) UI.levelDialog = document.getElementById('level-dialog');
  if (!UI.levelDialog) return;
  UI.levelDialog.classList.add('hidden');
}

function setupCursor() {
  if (!UI.customCursor) return;
  const cursor = UI.customCursor;
  applyCursorSize();
  const updateCursorPosition = (x, y) => {
    cursorPosition.x = x;
    cursorPosition.y = y;
    cursor.style.left = `${x}px`;
    cursor.style.top = `${y}px`;
  };
  updateCursorPosition(cursorPosition.x, cursorPosition.y);
  document.addEventListener('pointermove', (event) => {
    updateCursorPosition(event.clientX, event.clientY);
  });
  document.addEventListener('pointerdown', (event) => {
    const insideNodeArea = !!UI.nodeArea && (event.target === UI.nodeArea || UI.nodeArea.contains(event.target));
    if (insideNodeArea) {
      return;
    }
    cursor.classList.add('active');
    spawnCursorPulse(event.clientX, event.clientY);
  });
  document.addEventListener('pointerup', () => {
    cursor.classList.remove('active');
  });
  document.addEventListener('pointerleave', () => {
    cursor.classList.remove('active');
  });
}

function setupAudio() {
  bgmAudio = document.getElementById('bgm');
  if (!bgmAudio) return;
  const handleUnlock = () => {
    document.removeEventListener('pointerdown', handleUnlock);
    document.removeEventListener('keydown', handleUnlock);
    if (!bgmAudio) return;
    updateBGMVolume();
    const playPromise = bgmAudio.play();
    if (playPromise && typeof playPromise.then === 'function') {
      playPromise
        .then(() => {
          audioUnlocked = true;
        })
        .catch(() => {
          audioUnlocked = false;
          attachListeners();
        });
    } else {
      audioUnlocked = true;
    }
  };
  const attachListeners = () => {
    if (audioUnlocked) return;
    document.addEventListener('pointerdown', handleUnlock, { once: true });
    document.addEventListener('keydown', handleUnlock, { once: true });
  };
  attachListeners();
  updateBGMVolume();
}

function updateBGMVolume() {
  if (!bgmAudio) return;
  const volume = Math.min(1, Math.max(0, state.settings.bgm));
  bgmAudio.volume = volume;
}

function spawnCursorPulse(x, y) {
  if (state.settings.reducedAnimation) return;
  const pulse = document.createElement('div');
  pulse.className = 'cursor-pulse';
  pulse.style.left = `${x}px`;
  pulse.style.top = `${y}px`;
  pulse.style.imageRendering = 'pixelated';
  pulse.style.setProperty('--cursor-size', `${getPointerSize()}px`);
  document.body.appendChild(pulse);
  pulse.addEventListener('animationend', () => pulse.remove());
}

function triggerCursorClickAnimation(x, y) {
  if (!UI.customCursor) return;
  UI.customCursor.classList.add('active');
  if (cursorClickTimeout) {
    clearTimeout(cursorClickTimeout);
  }
  cursorClickTimeout = setTimeout(() => {
    if (UI.customCursor) {
      UI.customCursor.classList.remove('active');
    }
  }, 140);
  spawnCursorPulse(x, y);
}

function setupSkillCheck() {
  if (!UI.skillCheck || !UI.skillCheckAction || !UI.skillCheckProgress) return;
  UI.skillCheckAction.addEventListener('click', () => {
    if (skillCheckState.active) {
      resolveSkillCheck(true);
    }
  });
}

function startSkillCheck({ upgrade, difficulty, reward }) {
  if (!UI.skillCheck) return;
  const duration = SKILL_CHECK_DIFFICULTIES[difficulty] || SKILL_CHECK_DIFFICULTIES.normal;
  skillCheckState.active = true;
  skillCheckState.timer = 0;
  skillCheckState.duration = duration;
  skillCheckState.reward = reward;
  UI.skillCheckTitle.textContent = `${difficulty.toUpperCase()} skill check`;
  UI.skillCheckDescription.textContent = `Stabilise ${upgrade.name} by resolving before reality fractures.`;
  UI.skillCheck.classList.remove('hidden');
  UI.skillCheckAction.focus();
}

function resolveSkillCheck(success) {
  if (!skillCheckState.active) return;
  skillCheckState.active = false;
  UI.skillCheck.classList.add('hidden');
  if (success && typeof skillCheckState.reward === 'function') {
    skillCheckState.reward();
  } else if (!success) {
    createFloatText(document.body, 'Skill check failed', '#ff6ea8');
  }
  skillCheckState.reward = null;
  UI.skillCheckProgress.style.width = '0%';
}

function updateSkillCheck(delta) {
  if (!skillCheckState.active || !UI.skillCheckProgress) return;
  skillCheckState.timer += delta;
  const progress = Math.min(1, skillCheckState.timer / skillCheckState.duration);
  UI.skillCheckProgress.style.width = `${progress * 100}%`;
  if (skillCheckState.timer >= skillCheckState.duration) {
    resolveSkillCheck(false);
  }
}

function startGameLoop() {
  updateStats();
  let last = performance.now();
  function loop(now) {
    const delta = (now - last) / 1000;
    last = now;
    tick(delta);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}

function tick(delta) {
  updateLevel(delta);
  updateNodes(delta);
  updateAutoClick(delta);
  updateBoss(delta);
  updateCrypto(delta);
  updateLab(delta);
  updateSkillCheck(delta);
  achievementTimer += delta;
  if (achievementTimer >= 1) {
    renderAchievements();
    achievementTimer = 0;
  }
}

let nodeSpawnTimer = 0;
const activeNodes = new Map();
let activeBoss = null;
let autoClickTimer = 0;
let cursorClickTimeout;

function updateNodes(delta) {
  if (!UI.nodeArea) return;
  if (!state.currentLevel.active) return;
  nodeSpawnTimer -= delta;
  if (nodeSpawnTimer <= 0 && activeNodes.size < stats.maxNodes) {
    spawnNode();
    nodeSpawnTimer = Math.max(0.35, stats.nodeSpawnDelay - stats.weirdSynergy * 0.2);
  }
  const areaRect = UI.nodeArea.getBoundingClientRect();
  const width = UI.nodeArea.clientWidth || areaRect.width;
  const height = UI.nodeArea.clientHeight || areaRect.height;
  activeNodes.forEach((node) => {
    node.hp = Math.min(node.maxHP, node.hp + stats.regen * delta);
    node.position.x += node.velocity.x * delta;
    node.position.y += node.velocity.y * delta;
    node.rotation += node.rotationSpeed * delta;
    applyNodeTransform(node);
    updateNodeElement(node);
    const bounds = node.bounds;
    if (
      node.position.x < -bounds ||
      node.position.x > width + bounds ||
      node.position.y < -bounds ||
      node.position.y > height + bounds
    ) {
      node.el.remove();
      activeNodes.delete(node.id);
    }
  });
}

function updateAutoClick(delta) {
  if (!state.currentLevel.active) return;
  autoClickTimer += delta;
  const interval = Math.max(0.1, stats.autoInterval);
  while (autoClickTimer >= interval) {
    autoClickTimer -= interval;
    performAutoClick();
  }
}

function getPointerSize() {
  return Math.max(8, stats.pointerSize || 0);
}

function applyCursorSize() {
  if (UI.customCursor) {
    UI.customCursor.style.setProperty('--cursor-size', `${getPointerSize()}px`);
  }
}

function getPointerRect(x, y) {
  const size = getPointerSize();
  const half = size / 2;
  return {
    left: x - half,
    right: x + half,
    top: y - half,
    bottom: y + half,
  };
}

function pointerIntersectsRect(pointerRect, rect) {
  return (
    pointerRect.left <= rect.right &&
    pointerRect.right >= rect.left &&
    pointerRect.top <= rect.bottom &&
    pointerRect.bottom >= rect.top
  );
}

function getPointerPolygon(rect) {
  return [
    { x: rect.left, y: rect.top },
    { x: rect.right, y: rect.top },
    { x: rect.right, y: rect.bottom },
    { x: rect.left, y: rect.bottom },
  ];
}

function getNodePolygon(node, areaRect) {
  const size = (node.el && node.el.offsetWidth) || NODE_SIZE;
  const half = size / 2;
  let centerX = areaRect.left + node.position.x + half;
  let centerY = areaRect.top + node.position.y + half;
  if (node.el) {
    const rect = node.el.getBoundingClientRect();
    centerX = rect.left + rect.width / 2;
    centerY = rect.top + rect.height / 2;
  }
  const angle = ((node.rotation || 0) * Math.PI) / 180;
  const sin = Math.sin(angle);
  const cos = Math.cos(angle);
  const corners = [
    { x: -half, y: -half },
    { x: half, y: -half },
    { x: half, y: half },
    { x: -half, y: half },
  ];
  return corners.map((corner) => ({
    x: centerX + corner.x * cos - corner.y * sin,
    y: centerY + corner.x * sin + corner.y * cos,
  }));
}

function getPolygonAxes(polygon) {
  const axes = [];
  for (let i = 0; i < polygon.length; i += 1) {
    const current = polygon[i];
    const next = polygon[(i + 1) % polygon.length];
    const edgeX = next.x - current.x;
    const edgeY = next.y - current.y;
    const axis = { x: -edgeY, y: edgeX };
    const length = Math.hypot(axis.x, axis.y);
    if (length === 0) continue;
    axes.push({ x: axis.x / length, y: axis.y / length });
  }
  return axes;
}

function projectPolygon(axis, polygon) {
  let min = Infinity;
  let max = -Infinity;
  polygon.forEach((point) => {
    const projection = point.x * axis.x + point.y * axis.y;
    if (projection < min) min = projection;
    if (projection > max) max = projection;
  });
  return { min, max };
}

function polygonsIntersect(polygonA, polygonB) {
  const axes = [...getPolygonAxes(polygonA), ...getPolygonAxes(polygonB)];
  for (const axis of axes) {
    const projectionA = projectPolygon(axis, polygonA);
    const projectionB = projectPolygon(axis, polygonB);
    if (projectionA.max < projectionB.min || projectionB.max < projectionA.min) {
      return false;
    }
  }
  return true;
}

function performAutoClick() {
  if (!UI.nodeArea) return;
  const areaRect = UI.nodeArea.getBoundingClientRect();
  if (areaRect.width <= 0 || areaRect.height <= 0) return;
  const inside =
    cursorPosition.x >= areaRect.left &&
    cursorPosition.x <= areaRect.right &&
    cursorPosition.y >= areaRect.top &&
    cursorPosition.y <= areaRect.bottom;
  if (!inside) return;
  const pointerX = cursorPosition.x;
  const pointerY = cursorPosition.y;
  const pointerRect = getPointerRect(pointerX, pointerY);
  const pointerPolygon = getPointerPolygon(pointerRect);
  if (state.currentLevel.bossActive && activeBoss?.el) {
    const bossRect = activeBoss.el.getBoundingClientRect();
    if (pointerIntersectsRect(pointerRect, bossRect)) {
      triggerCursorClickAnimation(pointerX, pointerY);
      damageBoss();
      return;
    }
  }
  const nodesHit = [];
  activeNodes.forEach((node) => {
    if (!node.el) return;
    const nodePolygon = getNodePolygon(node, areaRect);
    if (polygonsIntersect(pointerPolygon, nodePolygon)) {
      nodesHit.push(node);
    }
  });
  if (nodesHit.length > 0) {
    triggerCursorClickAnimation(pointerX, pointerY);
    nodesHit.forEach((node) => strikeNode(node));
  }
}

function spawnNode() {
  if (!UI.nodeArea) return;
  const areaRect = UI.nodeArea.getBoundingClientRect();
  const width = UI.nodeArea.clientWidth || areaRect.width;
  const height = UI.nodeArea.clientHeight || areaRect.height;
  const margin = 120;
  const side = Math.floor(Math.random() * 4);
  let startX = 0;
  let startY = 0;
  let targetX = 0;
  let targetY = 0;
  switch (side) {
    case 0:
      startX = -margin;
      startY = Math.random() * height;
      targetX = width + margin;
      targetY = Math.random() * height;
      break;
    case 1:
      startX = width + margin;
      startY = Math.random() * height;
      targetX = -margin;
      targetY = Math.random() * height;
      break;
    case 2:
      startX = Math.random() * width;
      startY = -margin;
      targetX = Math.random() * width;
      targetY = height + margin;
      break;
    default:
      startX = Math.random() * width;
      startY = height + margin;
      targetX = Math.random() * width;
      targetY = -margin;
      break;
  }

  const travelTime = 10 + Math.random() * 6;
  const velocity = {
    x: (targetX - startX) / travelTime,
    y: (targetY - startY) / travelTime,
  };

  const type = weightedNodeType();
  const level = state.currentLevel.index;
  const hp = Math.ceil(type.hp(level) * stats.nodeHPFactor);
  const node = {
    id: `${type.id}-${Date.now()}-${Math.random()}`,
    type,
    hp,
    maxHP: hp,
    position: { x: startX, y: startY },
    velocity,
    rotation: Math.random() * 360,
    rotationSpeed: (Math.random() - 0.5) * 45,
    bounds: margin,
  };
  const el = document.createElement('div');
  el.className = `node ${type.color} skin-${state.skins.active}`;
  el.innerHTML = '<div class="core"></div><div class="hp"></div>';
  el.style.transition = 'none';
  node.el = el;
  applyNodeTransform(node);
  UI.nodeArea.appendChild(el);
  requestAnimationFrame(() => {
    el.style.transition = '';
    el.classList.add('pulse');
  });
  setTimeout(() => el.classList.remove('pulse'), 600);
  activeNodes.set(node.id, node);
  updateNodeElement(node);
}

function weightedNodeType() {
  const roll = Math.random();
  if (roll > 0.92) return nodeTypes[2];
  if (roll > 0.5) return nodeTypes[1];
  return nodeTypes[0];
}

function strikeNode(node) {
  let damage = stats.damage;
  damage += state.health / state.maxHealth * stats.healthDamageBonus * stats.damage;
  damage += activeNodes.size * stats.nodeCountDamageBonus * stats.damage;
  if (Math.random() < stats.critChance) {
    damage *= stats.critMultiplier;
    createFloatText(node.el, 'CRIT!', '#ff6ea8');
  }
  damage = Math.max(damage, 1);
  node.hp -= damage;
  triggerNodeDamageEffect(node);
  createFloatText(node.el, `-${Math.round(damage)}`);
  if (node.hp <= 0) {
    destroyNode(node);
  } else {
    updateNodeElement(node);
  }
}

function triggerNodeDamageEffect(node) {
  if (!node || !node.el || state.settings.reducedAnimation) return;
  const baseTransform =
    node.el.style.transform || window.getComputedStyle(node.el).transform || '';
  try {
    node.el.animate(
      [
        { transform: baseTransform },
        { transform: `${baseTransform} translate3d(-3px, 2px, 0)` },
        { transform: `${baseTransform} translate3d(3px, -2px, 0)` },
        { transform: baseTransform },
      ],
      { duration: 200, easing: 'steps(3, end)' }
    );
  } catch (err) {
    node.el.style.transform = baseTransform;
  }
}

function createFloatText(target, text, color = 'var(--accent-strong)') {
  const rect = target.getBoundingClientRect();
  const float = document.createElement('div');
  float.className = 'float-text';
  float.style.left = `${rect.left + rect.width / 2}px`;
  float.style.top = `${rect.top + rect.height / 2}px`;
  float.style.color = color;
  float.textContent = text;
  document.body.appendChild(float);
  setTimeout(() => float.remove(), 800);
}

function destroyNode(node) {
  dropRewards(node.type);
  const key = node.type.id;
  state.nodesDestroyed[key] = (state.nodesDestroyed[key] || 0) + 1;
  createNodeExplosion(node);
  spawnBitTokens(node);
  node.el.remove();
  activeNodes.delete(node.id);
  renderMilestones();
}

function dropRewards(type) {
  const rewards = type.reward(state.currentLevel.index);
  if (rewards.bits) {
    state.bits += rewards.bits * stats.bitGain;
  }
  if (rewards.xp) {
    gainXP(rewards.xp * stats.xpGain);
  }
  if (rewards.cryptcoins) {
    state.cryptcoins += rewards.cryptcoins;
  }
  updateResources();
}

function updateNodeElement(node) {
  if (!node.el) return;
  node.el.querySelector('.hp').textContent = `${Math.max(0, Math.ceil(node.hp))}`;
}

function applyNodeTransform(node) {
  if (!node.el) return;
  node.el.style.setProperty('--node-x', `${node.position.x}px`);
  node.el.style.setProperty('--node-y', `${node.position.y}px`);
  node.el.style.setProperty('--node-rotation', `${node.rotation}deg`);
  node.el.style.transform = `translate3d(${node.position.x}px, ${node.position.y}px, 0) rotate(${node.rotation}deg)`;
}

function createNodeExplosion(node) {
  if (!UI.particleLayer || !node.el) return;
  if (state.settings.reducedAnimation) return;
  const areaRect = UI.nodeArea.getBoundingClientRect();
  const nodeRect = node.el.getBoundingClientRect();
  const x = nodeRect.left - areaRect.left + nodeRect.width / 2;
  const y = nodeRect.top - areaRect.top + nodeRect.height / 2;
  const explosion = document.createElement('div');
  explosion.className = 'explosion';
  explosion.style.left = `${x}px`;
  explosion.style.top = `${y}px`;
  explosion.style.transform = 'translate(-50%, -50%)';
  UI.particleLayer.appendChild(explosion);
  explosion.addEventListener('animationend', () => explosion.remove());
}

function spawnBitTokens(node) {
  if (!UI.bitLayer || !node.el) return;
  const areaRect = UI.nodeArea.getBoundingClientRect();
  const nodeRect = node.el.getBoundingClientRect();
  const centerX = nodeRect.left - areaRect.left + nodeRect.width / 2;
  const centerY = nodeRect.top - areaRect.top + nodeRect.height / 2;
  const baseCount = 3 + Math.floor(Math.random() * 3);
  const tokenCount = state.settings.reducedAnimation ? Math.max(1, Math.floor(baseCount / 2)) : baseCount;
  const valueBase = Math.max(1, Math.round(4 + state.currentLevel.index * 1.2));
  for (let i = 0; i < tokenCount; i += 1) {
    const token = document.createElement('div');
    token.className = 'bit-token';
    const offsetX = (Math.random() - 0.5) * 160;
    const offsetY = (Math.random() - 0.5) * 160;
    token.style.left = `${centerX + offsetX}px`;
    token.style.top = `${centerY + offsetY}px`;
    token.dataset.value = `${valueBase + Math.floor(Math.random() * valueBase)}`;
    token.tabIndex = 0;
    token.addEventListener('pointerenter', () => collectBitToken(token));
    token.addEventListener('click', () => collectBitToken(token));
    token.addEventListener('focus', () => collectBitToken(token));
    token.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        collectBitToken(token);
      }
    });
    UI.bitLayer.appendChild(token);
    requestAnimationFrame(() => token.classList.add('visible'));
    setTimeout(() => {
      if (!token.classList.contains('collecting')) {
        token.remove();
      }
    }, 12000);
  }
}

function collectBitToken(token) {
  if (!token || token.classList.contains('collecting')) return;
  const areaRect = UI.nodeArea.getBoundingClientRect();
  const targetX = cursorPosition.x - areaRect.left;
  const targetY = cursorPosition.y - areaRect.top;
  const clampedX = Math.min(Math.max(targetX, 16), areaRect.width - 16);
  const clampedY = Math.min(Math.max(targetY, 16), areaRect.height - 16);
  token.classList.add('collecting');
  token.style.pointerEvents = 'none';
  const value = Number(token.dataset.value) || 1;
  state.bits += value;
  gainXP(Math.ceil(value * 0.4));
  updateResources();
  animateTokenToCursor(token, areaRect, clampedX, clampedY, () => {
    createFloatText(UI.customCursor || document.body, `+${value} bits`, '#ffd166');
    token.remove();
  });
}

function animateTokenToCursor(token, areaRect, fallbackX, fallbackY, onComplete) {
  if (!token) return;
  const finish = () => {
    token.__animationFrame = null;
    if (typeof onComplete === 'function') onComplete();
  };
  if (state.settings.reducedAnimation) {
    token.style.left = `${fallbackX}px`;
    token.style.top = `${fallbackY}px`;
    token.style.transform = 'translate(-50%, -50%) scale(0.35)';
    token.style.opacity = '0';
    requestAnimationFrame(finish);
    return;
  }

  const initialX = Number.parseFloat(token.style.left) || fallbackX;
  const initialY = Number.parseFloat(token.style.top) || fallbackY;
  const duration = 320;
  let startTime = null;

  const step = (timestamp) => {
    if (!token.isConnected) {
      finish();
      return;
    }
    if (startTime === null) startTime = timestamp;
    const elapsed = timestamp - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const pointerX = Math.min(Math.max(cursorPosition.x - areaRect.left, 16), areaRect.width - 16);
    const pointerY = Math.min(Math.max(cursorPosition.y - areaRect.top, 16), areaRect.height - 16);
    const ease = 1 - Math.pow(1 - progress, 3);
    const currentX = initialX + (pointerX - initialX) * ease;
    const currentY = initialY + (pointerY - initialY) * ease;
    token.style.left = `${currentX}px`;
    token.style.top = `${currentY}px`;
    const scale = Math.max(0.35, 1 - ease * 0.65);
    token.style.transform = `translate(-50%, -50%) scale(${scale})`;
    token.style.opacity = `${Math.max(0, 1 - ease * 0.85)}`;
    if (progress < 1) {
      token.__animationFrame = requestAnimationFrame(step);
    } else {
      token.style.opacity = '0';
      finish();
    }
  };

  token.__animationFrame = requestAnimationFrame(step);
}

function configureBossPath(bossObj, initial = false) {
  if (!bossObj || !UI.nodeArea) return;
  const width = UI.nodeArea.clientWidth || UI.nodeArea.getBoundingClientRect().width;
  const height = UI.nodeArea.clientHeight || UI.nodeArea.getBoundingClientRect().height;
  bossObj.size = 144;
  if (initial) {
    bossObj.position.x = Math.max(0, (width - bossObj.size) / 2);
    bossObj.position.y = Math.max(0, (height - bossObj.size) / 2);
    bossObj.rotation = Math.random() * 360;
  }
  const speed = 40 + Math.random() * 55;
  const angle = Math.random() * Math.PI * 2;
  bossObj.velocity = {
    x: Math.cos(angle) * speed,
    y: Math.sin(angle) * speed,
  };
  bossObj.rotationSpeed = (Math.random() - 0.5) * 18;
  bossObj.bounds = { width, height };
  applyBossTransform(bossObj);
}

function applyBossTransform(bossObj) {
  if (!bossObj || !bossObj.el) return;
  bossObj.el.style.transform = `translate3d(${bossObj.position.x}px, ${bossObj.position.y}px, 0) rotate(${bossObj.rotation}deg)`;
}

function updateLevel(delta) {
  const level = state.currentLevel;
  if (!level.active) return;
  if (level.bossActive) return;
  level.timer = Math.max(0, level.timer - delta);
  if (level.timer <= 0) {
    spawnBoss();
  }
}

function resetLevel(increase = true) {
  hideLevelDialog();
  activeNodes.forEach((node) => node.el.remove());
  activeNodes.clear();
  if (activeBoss?.el) {
    activeBoss.el.remove();
  }
  autoClickTimer = 0;
  state.currentLevel.active = true;
  state.currentLevel.bossActive = false;
  activeBoss = null;
  if (increase) {
    state.currentLevel.index += 1;
    state.level = Math.max(state.level, state.currentLevel.index);
    gainXP(50 * state.currentLevel.index);
    state.lp += 1;
  }
  state.currentLevel.timer = getLevelDuration(state.currentLevel.index);
  UI.currentLevel.textContent = state.currentLevel.index;
  updateStats();
  updateResources();
}

function spawnBoss() {
  const baseHP = getBossBaseHP(state.currentLevel.index);
  const bossHP = Math.ceil(baseHP * stats.bossHPFactor);
  state.currentLevel.bossActive = true;
  state.currentLevel.bossHP = bossHP;
  state.currentLevel.bossMaxHP = bossHP;
  const boss = document.createElement('div');
  boss.className = 'boss-node';
  const name = bossNames[state.currentLevel.index % bossNames.length];
  boss.innerHTML = `
    <div class="boss-name">${name}</div>
    <div class="hp-bar"><div class="hp-fill"></div></div>
  `;
  UI.nodeArea.appendChild(boss);
  activeBoss = {
    el: boss,
    position: { x: 0, y: 0 },
    velocity: { x: 0, y: 0 },
    rotation: Math.random() * 360,
    rotationSpeed: (Math.random() - 0.5) * 18,
    size: 144,
  };
  configureBossPath(activeBoss, true);
}

function getBossCursorDamage() {
  // Boss damage is fixed to the base cursor power so upgrades and automation do not apply.
  return Math.max(1, stats.baseDamage);
}

function damageBoss() {
  if (!state.currentLevel.bossActive) return;
  const bossDamage = getBossCursorDamage();
  state.currentLevel.bossHP -= bossDamage;
  updateBossBar();
  if (state.currentLevel.bossHP <= 0) {
    defeatBoss();
  }
}

function updateBoss(delta) {
  if (!state.currentLevel.bossActive || !activeBoss || !UI.nodeArea) return;

  // Allow boss encounters to last indefinitely until the player wins.
  // Previously the player would automatically lose once their health reached
  // zero which occurred after a short, unavoidable timer. This reset the
  // level mid-fight, causing the boss and node area to disappear. By removing
  // the passive damage tick we keep the encounter active until the boss is
  // defeated manually.
  updateBossBar();
  activeBoss.position.x += activeBoss.velocity.x * delta;
  activeBoss.position.y += activeBoss.velocity.y * delta;
  activeBoss.rotation += activeBoss.rotationSpeed * delta;
  const width = UI.nodeArea.clientWidth || UI.nodeArea.getBoundingClientRect().width;
  const height = UI.nodeArea.clientHeight || UI.nodeArea.getBoundingClientRect().height;
  const maxX = Math.max(0, width - activeBoss.size);
  const maxY = Math.max(0, height - activeBoss.size);
  if (activeBoss.position.x <= 0 || activeBoss.position.x >= maxX) {
    activeBoss.velocity.x *= -1;
    activeBoss.position.x = Math.min(Math.max(activeBoss.position.x, 0), maxX);
  }
  if (activeBoss.position.y <= 0 || activeBoss.position.y >= maxY) {
    activeBoss.velocity.y *= -1;
    activeBoss.position.y = Math.min(Math.max(activeBoss.position.y, 0), maxY);
  }
  applyBossTransform(activeBoss);
}

function updateBossBar() {
  if (!UI.nodeArea) return;
  const bossEl = UI.nodeArea.querySelector('.boss-node');
  if (!bossEl) return;
  const fill = bossEl.querySelector('.hp-fill');
  const denominator = state.currentLevel.bossMaxHP || 1;
  const ratio = Math.max(0, state.currentLevel.bossHP) / denominator;
  fill.style.width = `${ratio * 100}%`;
}

function defeatBoss() {
  state.currentLevel.bossActive = false;
  state.currentLevel.active = false;
  state.bossKills += 1;
  if (activeBoss?.el) {
    activeBoss.el.remove();
  }
  activeBoss = null;
  const rewardBits = Math.round(500 * state.currentLevel.index * stats.bitGain);
  const prestige = 1 * stats.prestigeGain;
  const xp = 120 * stats.xpGain;
  state.bits += rewardBits;
  gainXP(xp);
  grantPrestige(prestige);
  activeNodes.forEach((node) => node.el.remove());
  activeNodes.clear();
  const summary = `Recovered ${Math.round(rewardBits).toLocaleString()} bits, ${xp.toFixed(0)} XP, ${prestige.toFixed(0)} prestige.`;
  updateResources();
  showLevelDialog(summary);
  queueSave();
}

function updateStats() {
  stats.damage = stats.baseDamage;
  stats.critChance = 0.05;
  stats.critMultiplier = 2;
  stats.autoDamage = 0;
  stats.autoInterval = 1;
  stats.bitGain = 1;
  stats.xpGain = 1;
  stats.prestigeGain = 1;
  stats.nodeSpawnDelay = 2;
  stats.maxNodes = 4;
  stats.nodeHPFactor = 1 + state.currentLevel.index * 0.03;
  stats.bossHPFactor = 1;
  stats.defense = 0;
  stats.regen = 0;
  stats.healthDamageBonus = 0;
  stats.nodeCountDamageBonus = 0;
  stats.weirdSynergy = 0;
  stats.maxHealth = 100 + state.level * 5;
  Object.entries(state.upgrades).forEach(([id, level]) => {
    const upgrade = upgrades.find((u) => u.id === id);
    if (upgrade) {
      upgrade.effect(stats, level);
    }
  });
  applyAutomationBonuses();
  state.maxHealth = stats.maxHealth;
  state.health = Math.min(state.health, state.maxHealth);
  applyCursorSize();
}

function applyAutomationBonuses() {
  automationNodes.forEach((skill) => {
    if (state.automationSkills[skill.id] && typeof skill.effect === 'function') {
      skill.effect(stats);
    }
  });
  stats.autoInterval = Math.max(0.08, stats.autoInterval);
}

function updateResources() {
  UI.bits.textContent = Math.floor(state.bits).toLocaleString();
  UI.cryptcoins.textContent = Math.floor(state.cryptcoins).toLocaleString();
  UI.prestige.textContent = Math.floor(state.prestige).toLocaleString();
  UI.xp.textContent = `${Math.floor(state.xp).toLocaleString()} (${Math.floor(state.levelXP)}/${Math.floor(state.xpForNext)})`;
  UI.level.textContent = state.level;
  UI.lp.textContent = state.lp;
  UI.currentLevel.textContent = state.currentLevel.index;
  updateCryptoUI();
  updateLabUI();
  renderAutomationTree();
}

function gainXP(amount) {
  state.xp += amount;
  state.levelXP += amount;
  while (state.levelXP >= state.xpForNext) {
    state.levelXP -= state.xpForNext;
    state.level += 1;
    state.lp += 1;
    state.xpForNext *= 1.2;
    state.maxHealth += 10;
    state.health = state.maxHealth;
  }
}

function grantBits(amount) {
  state.bits += amount;
}

function grantCryptcoins(amount) {
  state.cryptcoins += amount;
}

function grantPrestige(amount) {
  state.prestige += amount;
  queueSave();
}

function updateCrypto(delta) {
  if (state.crypto.deposit <= 0 || state.crypto.rate <= 0) return;
  state.crypto.timeRemaining = Math.max(0, state.crypto.timeRemaining - delta);
  const generated = state.crypto.rate * delta;
  state.cryptcoins += generated;
  if (state.crypto.timeRemaining <= 0) {
    state.crypto.deposit = 0;
    state.crypto.rate = 0;
    queueSave();
  }
  updateCryptoUI();
}

function updateLab(delta) {
  if (!state.labUnlocked || state.labSpeed <= 0) return;
  state.labProgress = Math.min(1000, state.labProgress + state.labSpeed * delta);
  updateLabUI();
}

function totalNodesDestroyed() {
  return state.nodesDestroyed.red + state.nodesDestroyed.blue + state.nodesDestroyed.gold;
}

window.addEventListener('resize', () => {
  activeNodes.forEach((node) => updateNodeElement(node));
  drawAutomationConnectors();
});
