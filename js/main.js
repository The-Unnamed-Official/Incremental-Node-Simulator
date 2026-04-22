let upgrades = [];
let upgradeLookup = new Map();
let areaUpgradeDefs = [];
let collectUpgradeDefs = [];
let spawnUpgradeDefs = [];
let speedUpgradeDefs = [];
let milestones = [];
let achievements = [];
let skins = [];
let nodeSpawnTimer = 0;
let tooltipEl;
let achievementTimer = 0;
let milestoneTimer = 0;
let activeUpdateLogVersion = null;
let frameCounter = 0;
let cachedNodeAreaRect = null;
let cachedNodeAreaFrame = -1;
let activeFloatTextCount = 0;
const floatTextLaneState = new Map();
const GREEN_MOMENTUM_DURATION = 6;
const GREEN_MOMENTUM_MAX_STACKS = 3;
const HIGH_DENSITY_NODE_THRESHOLD = 120;
const HIGH_DENSITY_EFFECT_THRESHOLD = 90;
const MAX_SPAWNS_PER_FRAME = 24;
const MAX_FLOAT_TEXTS = 40;
const NODE_PASSIVE_REGEN_RATE = 0.01;
let greenMomentumTimer = 0;
let greenMomentumStacks = 0;

const UI = {};
const dropdownRegistry = new Map();
const skillCheckState = {
  active: false,
  timer: 0,
  duration: 0,
  reward: null,
  onFail: null,
  sliderPosition: 0,
  sliderDirection: 1,
  sliderSpeed: 0,
  secondaryPosition: 0,
  secondaryDirection: 1,
  secondarySpeed: 0,
  targetStart: 0,
  targetEnd: 0,
  secondaryStart: 0,
  secondaryEnd: 0,
  windowSize: 0,
  difficulty: 'normal',
  variant: 'linear',
};

const TUTORIAL_STORAGE_KEY = 'ins-tutorial-complete';
const TUTORIAL_PREF_KEY = 'ins-tutorial-prefs';
const VERSION_TUTORIAL_PROMPT_VERSION = 'v1.700';
let shouldForceVersionTutorial = false;
const tutorialState = {
  active: false,
  completed: false,
  stepIndex: 0,
  awaitingNodeKills: false,
  requiredNodeKills: { red: 1, blue: 1 },
  nodeKillProgress: { red: 0, blue: 0 },
  nodeShowcaseActive: false,
  nodeCapOverride: null,
  awaitingUpgrade: false,
  upgradePurchased: false,
  awaitingSkillCheck: false,
  skillCheckComplete: false,
  pendingNodeTypes: [],
  preferences: { showTips: true },
};

const cursorPosition = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
let cursorInNodeArea = false;
let bitTokenSweepScheduled = false;
let topBarObserver = null;
let topBarStickyObserver = null;
let tutorialHighlightFrame = null;

document.addEventListener('DOMContentLoaded', () => {
  cacheElements();
  setupLayoutMetrics();
  setupStickyTopBarState();
  setupUpdateLogs();
  generateUpgrades();
  generateAreaUpgrades();
  generateCollectUpgrades();
  generateSpawnUpgrades();
  generateSpeedUpgrades();
  generateMilestones();
  generateAchievements();
  loadGame();
  setupTabs();
  setupUpgradeTabs();
  setupFilters();
  setupProgressDock();
  applySavedUpgradeFilter();
  setupSettings();
  renderPalettePreviews();
  renderMilestones();
  renderAchievements();
  renderAreaUpgrades();
  renderCollectUpgrades();
  renderSpawnUpgrades();
  renderSpeedUpgrades();
  initTooltip();
  setupCryptoControls();
  setupLabControls();
  setupLevelDialog();
  setupLevelSelector();
  setupCursor();
  setupAudio();
  setupSkillCheck();
  setupSkillDetailDismissal();
  syncLabVisibility();
  updateStats();
  updateResources();
  setupNewGameDialog();
  setupPersistence();
  startGameLoop();
  maybeShowUpdateLog();
  setupTutorial();
});

function cacheElements() {
  UI.bits = document.getElementById('bits-display');
  UI.cryptcoins = document.getElementById('cryptcoin-display');
  UI.prestige = document.getElementById('prestige-display');
  UI.xp = document.getElementById('xp-display');
  UI.rank = document.getElementById('rank-display');
  UI.rankProgressFill = document.getElementById('rank-progress-fill');
  UI.rankProgressLabel = document.getElementById('rank-progress-label');
  UI.lp = document.getElementById('lp-display');
  UI.skillTree = document.getElementById('skill-tree');
  UI.upgradeCount = document.getElementById('upgrade-count');
  UI.upgradeTotal = document.getElementById('upgrade-total');
  UI.upgradeTabs = document.querySelectorAll('.upgrade-tab');
  UI.upgradePanels = document.querySelectorAll('.upgrade-panel');
  UI.nodeArea = document.getElementById('node-area');
  UI.particleLayer = document.getElementById('particle-layer');
  UI.bitLayer = document.getElementById('bit-layer');
  UI.currentLevel = document.getElementById('current-level');
  UI.levelSelect = document.getElementById('level-select');
  UI.versionDisplay = document.getElementById('version-display');
  UI.topBar = document.querySelector('.top-bar');
  if (UI.versionDisplay) {
    UI.versionDisplay.textContent = GAME_VERSION;
  }
  UI.milestoneList = document.getElementById('milestone-list');
  UI.achievementGrid = document.getElementById('achievement-grid');
  UI.areaUpgradeGrid = document.getElementById('area-upgrade-grid');
  UI.collectUpgradeGrid = document.getElementById('collect-upgrade-grid');
  UI.spawnUpgradeGrid = document.getElementById('spawn-upgrade-grid');
  UI.speedUpgradeGrid = document.getElementById('speed-upgrade-grid');
  UI.milestoneDock = document.getElementById('milestone-dock');
  UI.achievementDot = document.querySelector('[data-dot="achievements"]');
  UI.milestoneDot = document.querySelector('[data-dot="milestones"]');
  UI.claimAllButton = document.getElementById('claim-all-progress');
  UI.cryptoDeposited = document.getElementById('crypto-deposited');
  UI.cryptoReturns = document.getElementById('crypto-returns');
  UI.cryptoTimer = document.getElementById('crypto-timer');
  UI.cryptoStatus = document.getElementById('crypto-status');
  UI.cryptoMined = document.getElementById('crypto-mined');
  UI.cryptoEarlyWithdraw = document.getElementById('crypto-early-withdraw');
  UI.cryptoProgressFill = document.getElementById('crypto-progress-fill');
  UI.withdrawCrypto = document.getElementById('withdraw-crypto');
  UI.cryptoMineVisual = document.getElementById('crypto-mine-visual');
  UI.cryptoSpeedUpgrades = document.getElementById('crypto-speed-upgrades');
  UI.labLocked = document.getElementById('lab-locked');
  UI.labPanel = document.getElementById('lab-panel');
  UI.labProgressFill = document.getElementById('lab-progress-fill');
  UI.labProgressText = document.getElementById('lab-progress-text');
  UI.labSpeed = document.getElementById('lab-speed');
  UI.skinGrid = document.getElementById('skin-grid');
  UI.saveGame = document.getElementById('save-game');
  UI.newGame = document.getElementById('new-game');
  UI.saveStatus = document.getElementById('save-status');
  UI.saveTimestamp = document.getElementById('save-timestamp');
  UI.customCursor = document.getElementById('custom-cursor');
  UI.skillCheck = document.getElementById('skill-check');
  UI.skillCheckProgress = document.getElementById('skill-check-progress');
  UI.skillCheckTarget = document.getElementById('skill-check-target');
  UI.skillCheckSlider = document.getElementById('skill-check-slider');
  UI.skillCheckVariants = document.querySelectorAll('[data-skill-variant]');
  UI.skillCheckVerticalTarget = document.getElementById('skill-check-vertical-target');
  UI.skillCheckVerticalSlider = document.getElementById('skill-check-vertical-slider');
  UI.skillCheckCrossTarget = document.getElementById('skill-check-cross-target');
  UI.skillCheckCrossH = document.getElementById('skill-check-cross-h');
  UI.skillCheckCrossV = document.getElementById('skill-check-cross-v');
  UI.skillCheckAction = document.getElementById('skill-check-action');
  UI.skillCheckTitle = document.getElementById('skill-check-title');
  UI.skillCheckDescription = document.getElementById('skill-check-description');
  UI.skillCheckUpgrade = document.getElementById('skill-check-upgrade');
  UI.skillCheckTier = document.getElementById('skill-check-tier');
  UI.skillCheckReward = document.getElementById('skill-check-reward');
  UI.skillCheckPenalty = document.getElementById('skill-check-penalty');
  UI.tutorialOverlay = document.getElementById('tutorial-overlay');
  UI.tutorialPanel = document.querySelector('.tutorial-panel');
  UI.tutorialBackdrop = document.querySelector('.tutorial-backdrop');
  UI.tutorialHighlight = document.getElementById('tutorial-highlight');
  UI.tutorialTitle = document.getElementById('tutorial-step-title');
  UI.tutorialBody = document.getElementById('tutorial-step-body');
  UI.tutorialGoal = document.getElementById('tutorial-step-goal');
  UI.tutorialNext = document.getElementById('tutorial-next');
  UI.tutorialSkip = document.getElementById('tutorial-skip');
  UI.tutorialProgress = document.getElementById('tutorial-step-progress');
  UI.levelDialog = document.getElementById('level-dialog');
  UI.levelDialogSummary = document.getElementById('level-dialog-summary');
  UI.levelContinue = document.getElementById('level-continue');
  UI.levelReplay = document.getElementById('level-replay');
  UI.newGameDialog = document.getElementById('new-game-dialog');
  UI.newGameConfirm = document.getElementById('confirm-new-game');
  UI.newGameCancel = document.getElementById('cancel-new-game');
  UI.updateLog = document.getElementById('update-log');
  UI.updateLogTabs = document.getElementById('update-log-tabs');
  UI.updateLogBody = document.getElementById('update-log-body');
  UI.updateLogClose = document.getElementById('update-log-close');
  UI.quickStatDamage = document.getElementById('stat-damage');
  UI.quickStatCrit = document.getElementById('stat-crit');
  UI.quickStatAuto = document.getElementById('stat-auto');
  UI.quickStatSpawn = document.getElementById('stat-spawn');
  UI.quickStatBoss = document.getElementById('stat-boss');
  UI.bossPhaseFill = document.getElementById('boss-phase-fill');
  UI.bossPhasePhase = document.getElementById('boss-phase-phase');
  UI.bossPhaseMeta = document.getElementById('boss-phase-meta');
  UI.palettePreviewRow = document.getElementById('palette-preview-row');
  UI.skillDetailPopup = document.getElementById('skill-detail-popup');
  UI.nodeArenaBackdrop = document.getElementById('node-arena-backdrop');
  UI.title = document.querySelector('.title');
  UI.tipsToggle = document.getElementById('tips-toggle');
  UI.replayTutorial = document.getElementById('replay-tutorial');
  if (UI.title) {
    let icon = document.getElementById('game-icon');
    if (!icon) {
      icon = document.createElement('img');
      icon.id = 'game-icon';
      icon.className = 'game-icon';
      icon.src = 'files/icons/game_icon.png';
      icon.alt = 'Game Icon';
      UI.title.appendChild(icon);

      icon.addEventListener('click', (ev) => {
        icon.classList.remove('hurt');
        void icon.offsetWidth;
        icon.classList.add('hurt');
        if (typeof playPointerHitSFX === 'function') {
          playPointerHitSFX();
        } else if (typeof playSFX === 'function') {
          const key = Math.random() < 0.5 ? 'pointerHitA' : 'pointerHitB';
          playSFX(key);
        }
      });
      icon.addEventListener('animationend', () => icon.classList.remove('hurt'));
    }
  }
}

function closeOtherDropdowns(activeWrapper) {
  dropdownRegistry.forEach((api) => {
    if (api.wrapper !== activeWrapper) {
      api.close();
    }
  });
}

function setupCustomDropdown(selectEl) {
  if (!selectEl) return null;
  const existing = dropdownRegistry.get(selectEl);
  if (existing) return existing;
  const wrapper = document.createElement('div');
  wrapper.className = 'custom-dropdown';
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'custom-dropdown__button';
  const label = document.createElement('span');
  const chevron = document.createElement('span');
  chevron.className = 'chevron';
  chevron.textContent = '▾';
  button.append(label, chevron);
  const list = document.createElement('div');
  list.className = 'custom-dropdown__list';
  wrapper.append(button, list);
  selectEl.insertAdjacentElement('afterend', wrapper);
  selectEl.setAttribute('aria-hidden', 'true');

  const api = {
    wrapper,
    refresh,
    sync,
    close,
    open,
  };

  function sync() {
    const options = Array.from(list.querySelectorAll('[data-value]'));
    const active = options.find((opt) => opt.dataset.value === selectEl.value) || options[0];
    options.forEach((opt) => opt.classList.toggle('active', opt === active));
    if (active) {
      label.textContent = active.textContent;
    }
  }

  function refresh() {
    list.innerHTML = '';
    Array.from(selectEl.options).forEach((opt) => {
      const optionBtn = document.createElement('button');
      optionBtn.type = 'button';
      optionBtn.className = 'custom-dropdown__option';
      optionBtn.dataset.value = opt.value;
      optionBtn.textContent = opt.textContent;
      optionBtn.disabled = opt.disabled;
      optionBtn.addEventListener('click', () => {
        selectEl.value = opt.value;
        selectEl.dispatchEvent(new Event('change', { bubbles: true }));
        sync();
        close();
      });
      list.appendChild(optionBtn);
    });
    sync();
  }

  function close() {
    wrapper.classList.remove('open');
  }

  function open() {
    closeOtherDropdowns(wrapper);
    wrapper.classList.add('open');
  }

  button.addEventListener('click', () => {
    if (wrapper.classList.contains('open')) {
      close();
    } else {
      open();
    }
  });

  document.addEventListener('click', (event) => {
    if (!wrapper.contains(event.target)) {
      close();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      close();
    }
  });

  selectEl.addEventListener('change', sync);
  refresh();
  dropdownRegistry.set(selectEl, api);
  return api;
}

function setupPersistence() {
  if (UI.saveGame) {
    UI.saveGame.addEventListener('click', () => {
      saveGame({ notify: true });
    });
  }
  if (UI.newGame) {
    UI.newGame.addEventListener('click', () => {
      openNewGameDialog();
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

function openNewGameDialog() {
  if (!UI.newGameDialog) return;
  UI.newGameDialog.classList.remove('hidden');
  UI.newGameDialog.setAttribute('aria-hidden', 'false');
}

function closeNewGameDialog() {
  if (!UI.newGameDialog) return;
  UI.newGameDialog.classList.add('hidden');
  UI.newGameDialog.setAttribute('aria-hidden', 'true');
}

function setupNewGameDialog() {
  if (!UI.newGameDialog) return;
  UI.newGameDialog.setAttribute('aria-hidden', 'true');
  if (UI.newGameConfirm) {
    UI.newGameConfirm.addEventListener('click', () => {
      closeNewGameDialog();
      startNewGame();
    });
  }
  if (UI.newGameCancel) {
    UI.newGameCancel.addEventListener('click', () => {
      closeNewGameDialog();
    });
  }
  UI.newGameDialog.addEventListener('click', (event) => {
    if (event.target === UI.newGameDialog) {
      closeNewGameDialog();
    }
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !UI.newGameDialog.classList.contains('hidden')) {
      closeNewGameDialog();
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
  const matched = buttons.some((btn) => btn.dataset.filter === desired);
  const activeFilter = matched ? desired : buttons[0].dataset.filter;
  if (!matched) {
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
  if (state.currentLevel.bossActive) {
    spawnBoss({ restore: true });
  }
  if (UI.versionDisplay) {
    UI.versionDisplay.textContent = GAME_VERSION;
  }
}

function hydrateState(source = {}) {
  const defaults = getDefaultState();
  const mergedNodes = { ...defaults.nodesDestroyed, ...(source.nodesDestroyed || {}) };
  const mergedLevel = { ...defaults.currentLevel, ...(source.currentLevel || {}) };
  const mergedCrypto = { ...defaults.crypto, ...(source.crypto || {}) };
  const mergedCryptoSpeed = { ...(defaults.crypto.speedUpgrades || {}), ...((mergedCrypto && mergedCrypto.speedUpgrades) || {}) };
  const mergedSettings = { ...defaults.settings, ...(source.settings || {}) };
  const mergedUpgrades = { ...(defaults.upgrades || {}), ...(source.upgrades || {}) };
  const mergedArea = { ...(defaults.areaUpgrades || {}), ...(source.areaUpgrades || {}) };
  const mergedAreaVersions = { ...(defaults.areaUpgradeVersions || {}), ...(source.areaUpgradeVersions || {}) };
  const mergedCollect = { ...(defaults.collectUpgrades || {}), ...(source.collectUpgrades || {}) };
  const mergedSpawn = { ...(defaults.spawnUpgrades || {}), ...(source.spawnUpgrades || {}) };
  const mergedSpawnVersions = { ...(defaults.spawnUpgradeVersions || {}), ...(source.spawnUpgradeVersions || {}) };
  const mergedSpeed = { ...(defaults.speedUpgrades || {}), ...(source.speedUpgrades || {}) };
  const mergedMilestones = { ...(defaults.milestoneClaims || {}), ...(source.milestoneClaims || {}) };
  const mergedAchievementClaims = { ...(defaults.achievementClaims || {}), ...(source.achievementClaims || {}) };
  const mergedAchievementLog = { ...(defaults.achievementLog || {}), ...(source.achievementLog || {}) };
  state.bits = Number.isFinite(Number(source.bits)) ? Number(source.bits) : defaults.bits;
  state.cryptcoins = Number.isFinite(Number(source.cryptcoins)) ? Number(source.cryptcoins) : defaults.cryptcoins;
  state.prestige = Number.isFinite(Number(source.prestige)) ? Number(source.prestige) : defaults.prestige;
  state.xp = Number.isFinite(Number(source.xp)) ? Number(source.xp) : defaults.xp;
  state.playtime = Number.isFinite(Number(source.playtime)) ? Number(source.playtime) : defaults.playtime;
  state.paletteChangeCount = Number.isFinite(Number(source.paletteChangeCount))
    ? Number(source.paletteChangeCount)
    : defaults.paletteChangeCount;
  state.level = Math.max(1, Number.isFinite(Number(source.level)) ? Number(source.level) : defaults.level);
  state.highestCompletedLevel = Math.max(
    0,
    Number.isFinite(Number(source.highestCompletedLevel))
      ? Number(source.highestCompletedLevel)
      : defaults.highestCompletedLevel,
  );
  state.lp = Number.isFinite(Number(source.lp)) ? Number(source.lp) : defaults.lp;
  state.levelXP = Number.isFinite(Number(source.levelXP)) ? Number(source.levelXP) : defaults.levelXP;
  state.xpForNext = Math.max(1, Number.isFinite(Number(source.xpForNext)) ? Number(source.xpForNext) : defaults.xpForNext);
  state.health = Number.isFinite(Number(source.health)) ? Number(source.health) : defaults.health;
  state.maxHealth = Number.isFinite(Number(source.maxHealth)) ? Number(source.maxHealth) : defaults.maxHealth;
  state.nodesDestroyed = {
    red: Math.max(0, Number.isFinite(Number(mergedNodes.red)) ? Number(mergedNodes.red) : defaults.nodesDestroyed.red),
    blue: Math.max(0, Number.isFinite(Number(mergedNodes.blue)) ? Number(mergedNodes.blue) : defaults.nodesDestroyed.blue),
    green: Math.max(0, Number.isFinite(Number(mergedNodes.green)) ? Number(mergedNodes.green) : defaults.nodesDestroyed.green),
    gold: Math.max(0, Number.isFinite(Number(mergedNodes.gold)) ? Number(mergedNodes.gold) : defaults.nodesDestroyed.gold),
    void: Math.max(0, Number.isFinite(Number(mergedNodes.void)) ? Number(mergedNodes.void) : defaults.nodesDestroyed.void),
    prismatic: Math.max(
      0,
      Number.isFinite(Number(mergedNodes.prismatic)) ? Number(mergedNodes.prismatic) : defaults.nodesDestroyed.prismatic,
    ),
  };
  state.bossKills = Number.isFinite(Number(source.bossKills)) ? Number(source.bossKills) : defaults.bossKills;
  state.currentLevel = {
    index: Math.max(1, Number.isFinite(Number(mergedLevel.index)) ? Number(mergedLevel.index) : defaults.currentLevel.index),
    timer: Number.isFinite(Number(mergedLevel.timer)) ? Number(mergedLevel.timer) : defaults.currentLevel.timer,
    active: coerceBoolean(mergedLevel.active, defaults.currentLevel.active),
    bossActive: coerceBoolean(mergedLevel.bossActive, defaults.currentLevel.bossActive),
    bossHP: Number.isFinite(Number(mergedLevel.bossHP)) ? Number(mergedLevel.bossHP) : defaults.currentLevel.bossHP,
    bossMaxHP: Number.isFinite(Number(mergedLevel.bossMaxHP)) ? Number(mergedLevel.bossMaxHP) : defaults.currentLevel.bossMaxHP,
    bossDamageDealt: Math.max(
      0,
      Number.isFinite(Number(mergedLevel.bossDamageDealt)) ? Number(mergedLevel.bossDamageDealt) : defaults.currentLevel.bossDamageDealt,
    ),
  };
  const expectedTimer = getLevelDuration(state.currentLevel.index);
  state.currentLevel.timer = Math.min(expectedTimer, Math.max(0, state.currentLevel.timer || expectedTimer));
  if (state.currentLevel.bossActive) {
    state.currentLevel.active = true;
  } else if (!state.currentLevel.active) {
    state.currentLevel.active = true;
    if (state.currentLevel.timer <= 0) {
      state.currentLevel.timer = expectedTimer;
    }
    nodeSpawnTimer = 0;
  }
  const validUpgradeIds = new Set(upgrades.map((upgrade) => upgrade.id));
  const sanitizedUpgrades = {};
  Object.entries(mergedUpgrades).forEach(([id, level]) => {
    const numeric = Number(level);
    if (Number.isFinite(numeric) && numeric > 0 && validUpgradeIds.has(id)) {
      sanitizedUpgrades[id] = numeric;
    }
  });
  state.upgrades = sanitizedUpgrades;
  const sanitizedArea = {};
  Object.entries(mergedArea).forEach(([id, level]) => {
    const numeric = Number(level);
    if (Number.isFinite(numeric) && numeric > 0) {
      sanitizedArea[id] = numeric;
    }
  });
  state.areaUpgrades = sanitizedArea;
  state.areaUpgradeVersions = sanitizeUpgradeVersions(mergedAreaVersions);
  const sanitizedCollect = {};
  Object.entries(mergedCollect).forEach(([id, level]) => {
    const numeric = Number(level);
    if (Number.isFinite(numeric) && numeric > 0) {
      sanitizedCollect[id] = numeric;
    }
  });
  state.collectUpgrades = sanitizedCollect;
  const sanitizedSpawn = {};
  Object.entries(mergedSpawn).forEach(([id, level]) => {
    const numeric = Number(level);
    if (Number.isFinite(numeric) && numeric > 0) {
      sanitizedSpawn[id] = numeric;
    }
  });
  state.spawnUpgrades = sanitizedSpawn;
  state.spawnUpgradeVersions = sanitizeUpgradeVersions(mergedSpawnVersions);
  const sanitizedSpeed = {};
  Object.entries(mergedSpeed).forEach(([id, level]) => {
    const numeric = Number(level);
    if (Number.isFinite(numeric) && numeric > 0) {
      sanitizedSpeed[id] = numeric;
    }
  });
  state.speedUpgrades = sanitizedSpeed;
  const legacyPhaseLevel = Math.max(0, state.areaUpgrades['phase-halo'] || 0);
  const legacyPhaseVersion = Math.max(1, state.areaUpgradeVersions['phase-halo'] || 1);
  const legacyPhaseTotal = (legacyPhaseVersion - 1) * 10 + legacyPhaseLevel;
  if (!state.upgrades.PHASE_HALO && legacyPhaseTotal > 0) {
    state.upgrades.PHASE_HALO = Math.min(10, legacyPhaseTotal);
  }
  state.areaUpgrades = {};
  state.areaUpgradeVersions = {};
  state.areaUnlocked = coerceBoolean(source.areaUnlocked, defaults.areaUnlocked);
  state.spawnUnlocked = coerceBoolean(source.spawnUnlocked, defaults.spawnUnlocked);
  state.cryptoUnlocked = coerceBoolean(source.cryptoUnlocked, defaults.cryptoUnlocked);
  state.labUnlocked = coerceBoolean(source.labUnlocked, defaults.labUnlocked);
  if (!state.areaUnlocked && Object.keys(state.areaUpgrades).length > 0) {
    state.areaUnlocked = true;
  }
  if (!state.spawnUnlocked && Object.keys(state.spawnUpgrades).length > 0) {
    state.spawnUnlocked = true;
  }
  state.labProgress = Math.max(0, Number.isFinite(Number(source.labProgress)) ? Number(source.labProgress) : defaults.labProgress);
  state.labSpeed = Math.max(0, Number.isFinite(Number(source.labSpeed)) ? Number(source.labSpeed) : defaults.labSpeed);
  state.labDeposited = Math.max(0, Number.isFinite(Number(source.labDeposited)) ? Number(source.labDeposited) : defaults.labDeposited);
  state.crypto = {
    deposit: Math.max(0, Number.isFinite(Number(mergedCrypto.deposit)) ? Number(mergedCrypto.deposit) : defaults.crypto.deposit),
    rate: Math.max(0, Number.isFinite(Number(mergedCrypto.rate)) ? Number(mergedCrypto.rate) : defaults.crypto.rate),
    mined: Math.max(0, Number.isFinite(Number(mergedCrypto.mined)) ? Number(mergedCrypto.mined) : defaults.crypto.mined),
    duration: Math.max(0, Number.isFinite(Number(mergedCrypto.duration)) ? Number(mergedCrypto.duration) : defaults.crypto.duration),
    timeRemaining: Math.max(
      0,
      Number.isFinite(Number(mergedCrypto.timeRemaining)) ? Number(mergedCrypto.timeRemaining) : defaults.crypto.timeRemaining,
    ),
    speedUpgrades: sanitizeRecord(mergedCryptoSpeed),
  };
  if (state.crypto.deposit > 0 && state.crypto.duration <= 0) {
    state.crypto.duration = Math.max(10, Math.log(state.crypto.deposit + 1) * 30);
  }
  if (state.crypto.deposit > 0) {
    recalculateCryptoRate();
  }
  if (!state.cryptoUnlocked && (state.crypto.deposit > 0 || state.crypto.rate > 0)) {
    state.cryptoUnlocked = true;
  }
  state.skins = {
    active: defaults.skins.active,
    owned: new Set(['default']),
  };
  state.milestoneClaims = sanitizeRecord(mergedMilestones);
  state.achievementClaims = sanitizeRecord(mergedAchievementClaims);
  state.achievementLog = sanitizeAchievementLog(mergedAchievementLog);
  const savedStatsSnapshot = sanitizeStatsSnapshot(source.statsSnapshot || defaults.statsSnapshot);
  state.statsSnapshot = savedStatsSnapshot;
  if (savedStatsSnapshot) {
    Object.keys(savedStatsSnapshot).forEach((key) => {
      if (typeof stats[key] === 'number') {
        stats[key] = savedStatsSnapshot[key];
      }
    });
  }
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
    showTips: coerceBoolean(mergedSettings.showTips, defaults.settings.showTips),
  };
  state.selectedUpgradeFilter = typeof source.selectedUpgradeFilter === 'string'
    ? source.selectedUpgradeFilter
    : defaults.selectedUpgradeFilter;
  state.lastSeenVersion = typeof source.lastSeenVersion === 'string' ? source.lastSeenVersion : defaults.lastSeenVersion;
  const lastSavedCandidate = Number(source.lastSavedAt);
  state.lastSavedAt = Number.isFinite(lastSavedCandidate) && lastSavedCandidate > 0 ? lastSavedCandidate : defaults.lastSavedAt;
  state.tutorialCompleted = coerceBoolean(source.tutorialCompleted, defaults.tutorialCompleted);
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

function sanitizeRecord(candidate) {
  if (!candidate || typeof candidate !== 'object') {
    return {};
  }
  return Object.keys(candidate).reduce((acc, key) => {
    acc[key] = Boolean(candidate[key]);
    return acc;
  }, {});
}

function sanitizeUpgradeVersions(candidate) {
  if (!candidate || typeof candidate !== 'object') {
    return {};
  }
  return Object.keys(candidate).reduce((acc, key) => {
    const numeric = Number(candidate[key]);
    if (Number.isFinite(numeric) && numeric > 0) {
      acc[key] = numeric;
    }
    return acc;
  }, {});
}

function sanitizeAchievementLog(candidate) {
  if (!candidate || typeof candidate !== 'object') {
    return {};
  }
  return Object.keys(candidate).reduce((acc, key) => {
    const value = Number(candidate[key]);
    if (Number.isFinite(value) && value > 0) {
      acc[key] = value;
    }
    return acc;
  }, {});
}

function sanitizeStatsSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== 'object') {
    return null;
  }
  const sanitized = {};
  Object.keys(stats).forEach((key) => {
    const value = Number(snapshot[key]);
    if (Number.isFinite(value)) {
      sanitized[key] = value;
    }
  });
  return Object.keys(sanitized).length > 0 ? sanitized : null;
}

function saveGame(options = {}) {
  const { notify = false, message } = options;
  try {
    const payload = JSON.stringify(state, stateReplacer);
    localStorage.setItem(SAVE_KEY, payload);
    state.lastSavedAt = Date.now();
    updateSaveTimestamp();
    if (notify) showSaveStatus(message || 'Game saved', 'info');
    return true;
  } catch (error) {
    console.error('Failed to save game', error);
    const isQuota =
      error &&
      (error.name === 'QuotaExceededError' ||
        error.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
        error.code === 22);
    if (!isQuota) {
      showSaveStatus('Failed to save game', 'error');
      return false;
    }

    // Build a compact snapshot that drops large/optional data
    const compact = {
      bits: state.bits,
      cryptcoins: state.cryptcoins,
      prestige: state.prestige,
      xp: state.xp,
      level: state.level,
      highestCompletedLevel: state.highestCompletedLevel,
      lp: state.lp,
      upgrades: state.upgrades,
      areaUpgrades: state.areaUpgrades,
      spawnUpgrades: state.spawnUpgrades,
      speedUpgrades: state.speedUpgrades,
      collectUpgrades: state.collectUpgrades,
      currentLevel: {
        index: state.currentLevel.index,
        timer: state.currentLevel.timer,
        active: state.currentLevel.active,
        bossActive: state.currentLevel.bossActive,
      },
      settings: state.settings,
      lastSavedAt: Date.now(),
    };

    // Try a compact write to localStorage
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(compact));
      state.lastSavedAt = Date.now();
      updateSaveTimestamp();
      showSaveStatus('Saved compact snapshot (local storage near capacity)', 'info');
      return true;
    } catch (compactErr) {
      console.warn('Compact save failed, attempting pruning and fallbacks', compactErr);

      // Attempt to prune obviously large keys from localStorage (non-critical)
      try {
        const keysToPrune = [];
        for (let i = 0; i < localStorage.length; i += 1) {
          const key = localStorage.key(i);
          if (!key || key === SAVE_KEY) continue;
          try {
            const val = localStorage.getItem(key) || '';
            if (val.length > 20000) keysToPrune.push(key);
          } catch (e) {
            // ignore read errors
          }
        }
        keysToPrune.forEach((k) => localStorage.removeItem(k));
        // Retry compact save after pruning
        localStorage.setItem(SAVE_KEY, JSON.stringify(compact));
        state.lastSavedAt = Date.now();
        updateSaveTimestamp();
        showSaveStatus('Saved compact snapshot after pruning storage', 'info');
        return true;
      } catch (pruneErr) {
        console.warn('Prune + localStorage retry failed, trying sessionStorage', pruneErr);

        // Try sessionStorage as a transient fallback
        try {
          sessionStorage.setItem(SAVE_KEY, JSON.stringify(compact));
          state.lastSavedAt = Date.now();
          updateSaveTimestamp();
          showSaveStatus('Saved to session storage (persistent save failed)', 'info');
          return true;
        } catch (sessionErr) {
          console.warn('sessionStorage fallback failed, offering download', sessionErr);

          // Final fallback: trigger download of compact snapshot so the user can restore later
          try {
            const blob = new Blob([JSON.stringify(compact)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ins-save-${GAME_VERSION}.json`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
            showSaveStatus('Storage full — a local backup was downloaded.', 'info');
            return true;
          } catch (downloadErr) {
            console.error('All save fallbacks failed', downloadErr);
            showSaveStatus('Failed to save — storage full and fallbacks failed', 'error');
            return false;
          }
        }
      }
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
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(SAVE_KEY);
    }
  } catch (error) {
    console.warn('Failed to clear save data', error);
  }
  saveGame({ notify: true, message: 'Progress reset... Please wait' });

  setTimeout(() => {
    hydrateState(getDefaultState());
    activeNodes.forEach((node) => node.el?.remove());
    activeNodes.clear();
    syncNodeDensityState();
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
    renderMilestones();
    renderAchievements();
    renderAreaUpgrades();
    syncLabVisibility();
    applySettingsToControls();
    applyDisplaySettings();
    updateBGMVolume();
    updateStats();
    updateResources();
    localStorage.clear();
    location.reload();
  }, 2000);
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

function getTabRule(tabId) {
  return TAB_UNLOCK_RULES[tabId] || null;
}

function isTabUnlocked(tabId) {
  const rule = getTabRule(tabId);
  if (!rule) return true;
  if (rule.minLevel && state.level < rule.minLevel) return false;
  if (rule.requirement && typeof rule.requirement === 'function' && !rule.requirement()) return false;
  if (rule.stateKey) {
    return Boolean(state[rule.stateKey]);
  }
  return true;
}

function getUpgradeSectionRule(sectionId) {
  return UPGRADE_SECTION_RULES[sectionId] || null;
}

function isUpgradeSectionUnlocked(sectionId) {
  const rule = getUpgradeSectionRule(sectionId);
  if (!rule) return true;
  if (rule.minLevel && state.level < rule.minLevel) return false;
  if (rule.requirement && typeof rule.requirement === 'function' && !rule.requirement()) return false;
  if (rule.stateKey) {
    return Boolean(state[rule.stateKey]);
  }
  return true;
}

function canPurchaseUpgradeSection(sectionId) {
  const rule = getUpgradeSectionRule(sectionId);
  if (!rule || isUpgradeSectionUnlocked(sectionId)) return false;
  if (rule.minLevel && state.level < rule.minLevel) return false;
  if (rule.requirement && typeof rule.requirement === 'function' && !rule.requirement()) return false;
  if (!rule.cost) return false;
  const { currency, amount } = rule.cost;
  return state[currency] >= amount;
}

function canPurchaseTab(tabId) {
  const rule = getTabRule(tabId);
  if (!rule || isTabUnlocked(tabId)) return false;
  if (rule.minLevel && state.level < rule.minLevel) return false;
  if (rule.requirement && typeof rule.requirement === 'function' && !rule.requirement()) return false;
  if (!rule.cost) return false;
  const { currency, amount } = rule.cost;
  return state[currency] >= amount;
}

function formatTabRequirement(rule) {
  if (!rule) return '';
  const parts = [];
  if (rule.minLevel) {
    parts.push(`Rank ${rule.minLevel}`);
  }
  if (rule.requirementLabel) {
    parts.push(rule.requirementLabel);
  }
  if (rule.cost) {
    const label = rule.cost.label || `${rule.cost.amount.toLocaleString()} ${rule.cost.currency}`;
    parts.push(label);
  }
  return parts.join(' • ');
}

function setLockableButtonContent(button, label, requirement = '') {
  if (!button) return;
  const safeLabel = label || button.dataset.label || '';
  if (requirement) {
    button.innerHTML = `
      <span class="button-label">${safeLabel}</span>
      <span class="button-meta">${requirement}</span>
    `;
    return;
  }
  button.innerHTML = `<span class="button-label">${safeLabel}</span>`;
}

function getRuleFailureMessage(rule, currency = null) {
  if (!rule) return 'Locked';
  if (rule.minLevel && state.level < rule.minLevel) {
    return `Reach Rank ${rule.minLevel}`;
  }
  if (rule.requirementLabel && rule.requirement && typeof rule.requirement === 'function' && !rule.requirement()) {
    return rule.requirementLabel;
  }
  if (rule.cost && currency && state[currency] < rule.cost.amount) {
    const shortfall = Math.max(0, rule.cost.amount - state[currency]);
    return `Need ${formatNumberShort(shortfall)} ${rule.cost.currency}`;
  }
  return 'Locked';
}

function updateTabAvailability() {
  const buttons = document.querySelectorAll('.tab-button');
  buttons.forEach((btn) => {
    const tabId = btn.dataset.tab;
    const rule = getTabRule(tabId);
    const unlocked = isTabUnlocked(tabId);
    const canPurchase = canPurchaseTab(tabId);
    btn.classList.toggle('locked', !unlocked);
    btn.classList.toggle('purchasable', !unlocked && canPurchase);
    const baseLabel = rule?.label || btn.dataset.label || btn.textContent;
    const requirement = !unlocked ? formatTabRequirement(rule) : '';
    setLockableButtonContent(btn, baseLabel, requirement);
    btn.setAttribute('aria-disabled', unlocked ? 'false' : 'true');
    if (unlocked) {
      btn.removeAttribute('title');
    } else {
      btn.title = requirement || (rule?.label ? `${rule.label} locked` : 'Locked');
    }
  });
}

function attemptTabUnlock(tabId, sourceEl) {
  const rule = getTabRule(tabId);
  if (!rule || isTabUnlocked(tabId)) return true;
  if (rule.minLevel && state.level < rule.minLevel) {
    if (sourceEl) createFloatText(sourceEl, getRuleFailureMessage(rule), '#ff6ea8', { variant: 'requirement', priority: 'high' });
    return false;
  }
  if (!rule.cost) return false;
  const { currency, amount } = rule.cost;
  if (state[currency] < amount) {
    if (sourceEl) createFloatText(sourceEl, getRuleFailureMessage(rule, currency), '#ff6ea8', { variant: 'requirement', priority: 'high' });
    return false;
  }
  state[currency] -= amount;
  if (tabId === 'lab') {
    unlockLab();
  } else if (rule.stateKey) {
    state[rule.stateKey] = true;
    queueSave();
  }
  updateResources();
  if (sourceEl) createFloatText(sourceEl, 'Unlocked!', '#76f4c6', { variant: 'status', priority: 'high' });
  return true;
}

function attemptUpgradeSectionUnlock(sectionId, sourceEl) {
  const rule = getUpgradeSectionRule(sectionId);
  if (!rule || isUpgradeSectionUnlocked(sectionId)) return true;
  if (rule.minLevel && state.level < rule.minLevel) {
    if (sourceEl) createFloatText(sourceEl, getRuleFailureMessage(rule), '#ff6ea8', { variant: 'requirement', priority: 'high' });
    return false;
  }
  if (rule.requirement && typeof rule.requirement === 'function' && !rule.requirement()) {
    if (sourceEl) createFloatText(sourceEl, getRuleFailureMessage(rule), '#ff6ea8', { variant: 'requirement', priority: 'high' });
    return false;
  }
  if (!rule.cost) return false;
  const { currency, amount } = rule.cost;
  if (state[currency] < amount) {
    if (sourceEl) createFloatText(sourceEl, getRuleFailureMessage(rule, currency), '#ff6ea8', { variant: 'requirement', priority: 'high' });
    return false;
  }
  state[currency] -= amount;
  if (rule.stateKey) {
    state[rule.stateKey] = true;
  }
  updateResources();
  if (sourceEl) createFloatText(sourceEl, 'Unlocked!', '#76f4c6', { variant: 'status', priority: 'high' });
  return true;
}

function setupTabs() {
  const buttons = document.querySelectorAll('.tab-button');
  const buttonsSettings = document.querySelectorAll('.setting-button');
  const contents = document.querySelectorAll('.tab-content');
  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const tabId = btn.dataset.tab;
      const rule = getTabRule(tabId);
      if (rule && !isTabUnlocked(tabId)) {
        const purchased = attemptTabUnlock(tabId, btn);
        if (!purchased || !isTabUnlocked(tabId)) {
          updateTabAvailability();
          return;
        }
      }
      buttons.forEach((b) => b.classList.remove('active'));
      contents.forEach((c) => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`tab-${tabId}`).classList.add('active');
      updateTabAvailability();
    });
  });
  buttonsSettings.forEach((btn) => {
    btn.addEventListener('click', () => {
      const tabId = btn.dataset.tab;
      const rule = getTabRule(tabId);
      if (rule && !isTabUnlocked(tabId)) {
        const purchased = attemptTabUnlock(tabId, btn);
        if (!purchased || !isTabUnlocked(tabId)) {
          updateTabAvailability();
          return;
        }
      }
      buttons.forEach((b) => b.classList.remove('active'));
      contents.forEach((c) => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`tab-${tabId}`).classList.add('active');
      updateTabAvailability();
    });
  });
  updateTabAvailability();
}

function updateUpgradeTabAvailability() {
  if (!UI.upgradeTabs?.length) return;
  UI.upgradeTabs.forEach((btn) => {
    const sectionId = btn.dataset.upgradeTab;
    const rule = getUpgradeSectionRule(sectionId);
    const unlocked = isUpgradeSectionUnlocked(sectionId);
    const purchasable = canPurchaseUpgradeSection(sectionId);
    btn.classList.toggle('locked', !unlocked);
    btn.classList.toggle('purchasable', !unlocked && purchasable);
    const baseLabel = rule?.label || btn.dataset.label || btn.textContent;
    const requirement = !unlocked ? formatTabRequirement(rule) : '';
    setLockableButtonContent(btn, baseLabel, requirement);
    btn.setAttribute('aria-disabled', unlocked ? 'false' : 'true');
    if (requirement) {
      btn.title = `${baseLabel} — ${requirement}`;
    } else {
      btn.removeAttribute('title');
    }
  });
}

function activateUpgradeSection(sectionId) {
  const buttons = Array.from(UI.upgradeTabs || []);
  const panels = Array.from(UI.upgradePanels || []);
  buttons.forEach((btn) => {
    const isActive = btn.dataset.upgradeTab === sectionId;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });
  panels.forEach((panel) => {
    panel.classList.toggle('active', panel.id === `upgrade-panel-${sectionId}`);
  });
  if (sectionId === 'point-magnet') {
    renderCollectUpgrades();
  } else if (sectionId === 'faster-nodes') {
    renderSpawnUpgrades();
  } else if (sectionId === 'point-speed') {
    renderSpeedUpgrades();
  }
}

function setupUpgradeTabs() {
  if (!UI.upgradeTabs?.length) return;
  UI.upgradeTabs.forEach((btn) => {
    btn.addEventListener('click', () => {
      const sectionId = btn.dataset.upgradeTab;
      const rule = getUpgradeSectionRule(sectionId);
      if (rule && !isUpgradeSectionUnlocked(sectionId)) {
        const unlocked = attemptUpgradeSectionUnlock(sectionId, btn);
        if (!unlocked || !isUpgradeSectionUnlocked(sectionId)) {
          updateUpgradeTabAvailability();
          return;
        }
      }
      activateUpgradeSection(sectionId);
      updateUpgradeTabAvailability();
    });
  });
  activateUpgradeSection('skill-tree');
  updateUpgradeTabAvailability();
}

function syncFilterButtons(activeFilter) {
  const filters = document.querySelectorAll('.filter');
  filters.forEach((filter) => {
    const isActive = filter.dataset.filter === activeFilter;
    filter.classList.toggle('active', isActive);
    filter.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });
}

function setupFilters() {
  const filters = document.querySelectorAll('.filter');
  filters.forEach((filter) => {
    filter.addEventListener('click', () => {
      const value = filter.dataset.filter;
      if (state.selectedUpgradeFilter !== value) {
        state.selectedUpgradeFilter = value;
        queueSave();
      }
      renderUpgrades(value);
    });
  });
  const currentFilter = document.querySelector('.filter.active')?.dataset.filter || state.selectedUpgradeFilter;
  if (currentFilter) {
    syncFilterButtons(currentFilter);
  }
}

function setupProgressDock() {
  const tabs = document.querySelectorAll('.progress-tab');
  const panels = document.querySelectorAll('.progress-panel');
  if (tabs.length === 0) {
    return;
  }
  if (UI.claimAllButton) {
    UI.claimAllButton.addEventListener('click', claimAllRewards);
  }
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.progressTab;
      tabs.forEach((button) => {
        const isActive = button === tab;
        button.classList.toggle('active', isActive);
        button.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });
      panels.forEach((panel) => {
        const match = panel.id === `progress-${target}`;
        panel.classList.toggle('active', match);
        if (match) {
          panel.removeAttribute('aria-hidden');
        } else {
          panel.setAttribute('aria-hidden', 'true');
        }
      });
    });
  });
}

function setupStickyTopBarState() {
  if (!UI.topBar || typeof IntersectionObserver === 'undefined') {
    return;
  }
  const sentinel = document.createElement('div');
  sentinel.className = 'top-bar-sentinel';
  UI.topBar.parentElement?.insertBefore(sentinel, UI.topBar);

  topBarStickyObserver = new IntersectionObserver((entries) => {
    const [entry] = entries;
    const isStuck = entry && !entry.isIntersecting && entry.boundingClientRect.top < 0;
    UI.topBar.classList.toggle('is-sticky', Boolean(isStuck));
  });

  topBarStickyObserver.observe(sentinel);
}

function updateTopBarOffset() {
  const height = UI.topBar?.getBoundingClientRect().height ?? 0;
  document.documentElement.style.setProperty('--top-bar-height', `${height}px`);
}

function setupLayoutMetrics() {
  updateTopBarOffset();
  if (typeof ResizeObserver !== 'undefined' && UI.topBar) {
    topBarObserver = new ResizeObserver(() => updateTopBarOffset());
    topBarObserver.observe(UI.topBar);
  }
  window.addEventListener('resize', updateTopBarOffset);
}

function setupUpdateLogs() {
  if (UI.versionDisplay) {
    UI.versionDisplay.addEventListener('click', () => openUpdateLog(GAME_VERSION));
  }
  if (UI.updateLogClose) {
    UI.updateLogClose.addEventListener('click', closeUpdateLog);
  }
  if (UI.updateLog) {
    UI.updateLog.addEventListener('click', (event) => {
      if (event.target === UI.updateLog) {
        closeUpdateLog();
      }
    });
  }
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isUpdateLogOpen()) {
      closeUpdateLog();
    }
  });
  renderUpdateLogs();
  selectUpdateLog(GAME_VERSION, false);
}

function getUpdateLogs() {
  return UPDATE_LOGS.slice(0, 6).map((log) => ({
    ...log,
    isLatest: log.version === GAME_VERSION,
  }));
}

function renderUpdateLogs() {
  if (!UI.updateLogTabs) return;
  const logs = getUpdateLogs();
  UI.updateLogTabs.innerHTML = '';
  logs.forEach((log) => {
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'update-log-tab';
    tab.dataset.version = log.version;
    const safeId = log.version.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    tab.id = `update-log-tab-${safeId}`;
    tab.setAttribute('role', 'tab');
    tab.innerHTML = `
      <span>${log.version}${log.isLatest ? ' (Latest Update)' : ''}</span>
      ${log.isLatest ? '<span class="tag">(Latest Update)</span>' : ''}
    `;
    tab.addEventListener('click', () => selectUpdateLog(log.version));
    UI.updateLogTabs.appendChild(tab);
  });
}

function selectUpdateLog(version, animate = true) {
  const logs = getUpdateLogs();
  const target = logs.find((log) => log.version === version) || logs[0];
  if (!target) return;
  activeUpdateLogVersion = target.version;
  const tabs = UI.updateLogTabs?.querySelectorAll('.update-log-tab');
  tabs?.forEach((tab) => {
    const isActive = tab.dataset.version === target.version;
    tab.classList.toggle('active', isActive);
    tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
    tab.setAttribute('tabindex', isActive ? '0' : '-1');
    if (isActive && UI.updateLogBody) {
      UI.updateLogBody.setAttribute('aria-labelledby', tab.id);
    }
  });
  renderUpdateLogContent(target, animate);
}

function renderUpdateLogContent(log, animate = true) {
  if (!UI.updateLogBody || !log) return;
  const body = UI.updateLogBody;
  const startHeight = body.getBoundingClientRect().height || body.scrollHeight || 1;
  const animateHeight = Boolean(animate && startHeight);
  const entry = document.createElement('div');
  entry.className = 'update-log-entry';
  const meta = document.createElement('div');
  meta.className = 'meta';
  const versionPill = document.createElement('span');
  versionPill.className = 'version-pill';
  versionPill.textContent = `${log.version}${log.isLatest ? ' (Latest Update)' : ''}`;
  meta.appendChild(versionPill);
  if (log.isLatest) {
    const latest = document.createElement('span');
    latest.className = 'latest-label';
    latest.textContent = '(Latest Update)';
    meta.appendChild(latest);
  }
  entry.appendChild(meta);
  const title = document.createElement('h3');
  title.textContent = log.title;
  entry.appendChild(title);
  const description = document.createElement('p');
  description.textContent = log.description;
  entry.appendChild(description);
  const list = document.createElement('ul');
  list.className = 'update-log-list';
  log.changes.forEach((change) => {
    const item = document.createElement('li');

    if (typeof change === 'string') {
      item.textContent = change;
    }
    else if (change && typeof change === 'object') {
      if (change.text) {
        const mainText = document.createElement('span');
        mainText.textContent = change.text;
        item.appendChild(mainText);
      }

      if (Array.isArray(change.sub) && change.sub.length > 0) {
        const subList = document.createElement('ul');
        subList.className = 'update-log-sublist';

        change.sub.forEach((sub) => {
          const subItem = document.createElement('li');
          subItem.textContent = sub;
          subList.appendChild(subItem);
        });

        item.appendChild(subList);
      }
    }

    list.appendChild(item);
  });
  entry.appendChild(list);
  if (animateHeight) {
    body.classList.add('changing');
    body.style.height = `${startHeight}px`;
    body.style.opacity = '0.2';
  } else {
    body.classList.remove('changing');
    body.style.height = '';
    body.style.opacity = '1';
  }

  body.innerHTML = '';
  body.appendChild(entry);

  const targetHeight = body.scrollHeight || entry.getBoundingClientRect().height || startHeight;
  const heightDelta = Math.abs(targetHeight - startHeight);
  const cleanup = () => {
    body.style.height = '';
    body.style.opacity = '1';
    body.classList.remove('changing');
  };
  if (animateHeight && heightDelta > 0.5) {
    requestAnimationFrame(() => {
      body.style.height = `${targetHeight}px`;
      body.style.opacity = '1';
    });
    const handleTransitionEnd = (event) => {
      if (event.target !== body || event.propertyName !== 'height') return;
      cleanup();
      body.removeEventListener('transitionend', handleTransitionEnd);
    };
    body.addEventListener('transitionend', handleTransitionEnd);
  } else {
    cleanup();
  }
}

function openUpdateLog(targetVersion = GAME_VERSION, animateContent = true) {
  renderUpdateLogs();
  selectUpdateLog(targetVersion, animateContent);
  if (UI.updateLog) {
    UI.updateLog.classList.remove('hidden');
    UI.updateLog.setAttribute('aria-hidden', 'false');
  }
  document.body.style.overflow = 'hidden';
}

function isUpdateLogOpen() {
  return Boolean(UI.updateLog && !UI.updateLog.classList.contains('hidden'));
}

function closeUpdateLog() {
  if (UI.updateLog) {
    UI.updateLog.classList.add('hidden');
    UI.updateLog.setAttribute('aria-hidden', 'true');
  }
  document.body.style.overflow = '';
}

function maybeShowUpdateLog() {
  const seen = typeof state.lastSeenVersion === 'string' ? state.lastSeenVersion : null;
  if (seen !== GAME_VERSION) {
    shouldForceVersionTutorial = GAME_VERSION === VERSION_TUTORIAL_PROMPT_VERSION;
    openUpdateLog(GAME_VERSION, false);
    state.lastSeenVersion = GAME_VERSION;
    queueSave();
  } else {
    shouldForceVersionTutorial = false;
  }
}

function setupSettings() {
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
  if (UI.tipsToggle) {
    UI.tipsToggle.addEventListener('change', (e) => {
      state.settings.showTips = e.target.checked;
      tutorialState.preferences.showTips = state.settings.showTips;
      persistTutorialPreferences();
      queueSave();
    });
  }
  if (UI.replayTutorial) {
    UI.replayTutorial.addEventListener('click', () => {
      startTutorial({ replay: true });
    });
  }
  const paletteSelect = document.getElementById('palette-select');
  if (paletteSelect) {
    paletteSelect.addEventListener('change', (e) => {
      const nextPalette = e.target.value;
      if (state.settings.palette !== nextPalette) {
        state.paletteChangeCount = (state.paletteChangeCount || 0) + 1;
      }
      state.settings.palette = nextPalette;
      applyDisplaySettings();
      renderPalettePreviews();
      queueSave();
    });
    UI.paletteDropdown = setupCustomDropdown(paletteSelect);
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

const PALETTE_SWATCHES = {
  default: ['#7fffd6', '#0c101c'],
  violet: ['#b99bff', '#1a0d1c'],
  gold: ['#ffd666', '#1c180c'],
  diamond: ['#66f5ff', '#0c181c'],
  emerald: ['#80ff66', '#0c1c0f'],
  pinky: ['#ff66f2', '#1c0c1b'],
  ruby: ['#ff6666', '#1c0c0c'],
  nebula: ['#9fc4ff', '#0d0f1c'],
  sunset: ['#ffb07f', '#1c110c'],
  obsidian: ['#815f92', '#281a2e'],
  ocean: ['#4dd9ff', '#07141c'],
  storm: ['#9db6ff', '#12182b'],
  terminal: ['#86ff90', '#0b140e'],
};

function renderPalettePreviews() {
  if (!UI.palettePreviewRow) return;
  UI.palettePreviewRow.innerHTML = '';
  const current = state.settings?.palette || 'default';
  Object.entries(PALETTE_SWATCHES).forEach(([id, [a, b]]) => {
    const chip = document.createElement('span');
    chip.className = 'palette-chip';
    chip.style.setProperty('--chip-a', a);
    chip.style.setProperty('--chip-b', b);
    if (id === current) {
      chip.style.boxShadow = `${getComputedStyle(document.documentElement).getPropertyValue('--pixel-shadow')}, 0 0 10px ${a}`;
      chip.style.borderColor = a;
    }
    chip.title = id;
    chip.addEventListener('click', () => {
      const paletteSelect = document.getElementById('palette-select');
      if (paletteSelect) {
        paletteSelect.value = id;
        paletteSelect.dispatchEvent(new Event('change'));
      }
    });
    UI.palettePreviewRow.appendChild(chip);
  });
}

function applyDisplaySettings() {
  document.body.classList.toggle('disable-crt', !state.settings.crt);
  document.body.classList.toggle('disable-scanlines', !state.settings.scanlines);
  document.body.classList.toggle('reduced-motion', state.settings.reducedAnimation);
  document.body.classList.remove(
    'palette-violet',
    'palette-diamond',
    'palette-gold',
    'palette-emerald',
    'palette-pinky',
    'palette-ruby',
    'palette-nebula',
    'palette-sunset',
    'palette-obsidian',
    'palette-ocean',
    'palette-storm',
    'palette-terminal',
  );
  if (state.settings.palette && state.settings.palette !== 'default') {
    document.body.classList.add(`palette-${state.settings.palette}`);
  }
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
  const tipsToggle = document.getElementById('tips-toggle');
  if (tipsToggle) {
    tipsToggle.checked = state.settings.showTips;
  }
  const paletteSelect = document.getElementById('palette-select');
  if (paletteSelect) {
    paletteSelect.value = state.settings.palette;
  }
  if (UI.paletteDropdown?.sync) {
    UI.paletteDropdown.sync();
  }
  const bgmVolume = document.getElementById('bgm-volume');
  if (bgmVolume) {
    bgmVolume.value = Math.round(state.settings.bgm * 100);
  }
  const sfxVolume = document.getElementById('sfx-volume');
  if (sfxVolume) {
    sfxVolume.value = Math.round(state.settings.sfx * 100);
  }
}

const tutorialSteps = [
  {
    id: 'resources',
    title: 'Track the currencies',
    body: 'The top bar tracks Bits, CC, Prestige, XP, Operator Rank, and LP. Bits buy most upgrades, CC powers advanced systems, Prestige unlocks larger progression jumps, XP fills your Rank bar, and LP supports long-term sync upgrades.',
    target: () => document.querySelector('.resource-bar'),
    goal: 'Keep an eye on these numbers—every system flows through them.',
  },
  {
    id: 'rank',
    title: 'Operator Rank vs Stage',
    body: 'Operator Rank is your player progression bar. Stage is the current breach difficulty in the arena. Rank unlocks systems while Stage controls node health, reward scale, and boss pressure.',
    target: () => document.querySelector('.top-bar') || document.querySelector('.resource-bar'),
    goal: 'Rank = player progression. Stage = current combat lane.',
  },
  {
    id: 'arena',
    title: 'The node arena',
    body: 'Hover over this field to fire automatically. Nodes drift in here—destroy them to collect bits, XP, prestige, and loot.',
    target: () => UI.nodeArea,
    goal: 'Your cursor is your weapon. Keep it over the arena to attack.',
  },
  {
    id: 'side-panel',
    title: 'Systems dock',
    body: 'Use these tabs to buy upgrades, manage the Crypto Mine and Lab, swap themes, and tune settings. The right panel is your command center, and locked tabs now explain what they need.',
    target: () => document.querySelector('.side-panel'),
    goal: 'Tabs unlock more tools as you progress.',
  },
  {
    id: 'nodes',
    title: 'Meet the nodes',
    body: 'Red nodes are common and blue nodes are tanky. Green and gold variants show up later—just clear a red node and a blue node here to get the feel.',
    target: () => UI.nodeArea,
    onEnter: startNodeShowcase,
  },
  {
    id: 'rare-nodes',
    title: 'Rare node roles',
    body: 'Green Nodes move faster and help snowball. Gold Nodes burst richer rewards. Void Nodes drain pressure with heavier stats and sustain effects. Prismatic Nodes rotate reward types based on their current hue.',
    target: () => UI.nodeArea,
    goal: 'Node colors matter. Each rare family changes reward flow or combat tempo.',
  },
  {
    id: 'upgrade',
    title: 'Skills and the main tree',
    body: 'Open the Upgrades tab and purchase any upgrade. Upgrades raise damage, crits, economy, and more. This one will trigger a guided skill check—click inside the highlighted band before the timer ends or use your space-bar, that works too!.',
    target: () => document.querySelector('[data-tab="upgrades"]'),
    onEnter: prepareUpgradeTutorial,
  },
  {
    id: 'upgrade-sections',
    title: 'Specialized upgrade lanes',
    body: 'Point Magnet expands collection reach, Faster Nodes increases swarm density and spawn speed, and Point Speed makes the cursor strike faster. Locked tabs now show their requirements clearly instead of hiding them.',
    target: () => document.querySelector('.upgrade-tabs'),
    goal: 'The side upgrade lanes tune collection, swarm size, and attack tempo.',
  },
  {
    id: 'currencies',
    title: 'What everything is for',
    body: 'Bits handle everyday purchases. CC is your advanced currency for mining upgrades, the Crypto Mine, and later research. Prestige unlocks stronger progression lanes. XP fills Operator Rank. LP is awarded for long-term progress and stage pushing.',
    target: () => document.querySelector('.resource-bar'),
    goal: 'Spend Bits often, protect Prestige, and use CC for advanced systems.',
  },
  {
    id: 'achievements',
    title: 'Achievements and milestones',
    body: 'Achievements grant quick rewards (like “Destroy your first node”), and milestones unlock bigger boosts or new systems over time. Claim them often.',
    target: () => document.querySelector('.progress-dock'),
    goal: 'Check in for easy claims to keep momentum.',
  },
  {
    id: 'levels',
    title: 'Push stages and bosses',
    body: 'Stages set node health and rewards. Beating bosses increases stage difficulty and payouts. You can replay old stages or push forward for bigger gains.',
    target: () => document.querySelector('.level-readout'),
    goal: 'Kill nodes → earn bits → buy upgrades → beat bosses → unlock more content.',
  },
  {
    id: 'boss-tracker',
    title: 'Boss tracker and stages',
    body: 'The boss bar now doubles as a countdown when a boss is not active. When the timer ends, the boss arrives. Boss wins advance your Stage, raise payouts, and keep the run scaling.',
    target: () => document.querySelector('.boss-phase'),
    goal: 'Watch the countdown, survive the stage, then break the boss to advance.',
  },
  {
    id: 'crypto-mine',
    title: 'Crypto Mine and CC',
    body: 'Deposit Bits into the Crypto Mine to generate CC over time. The mine now shows mined-so-far output live, and you can withdraw early for 70% of the current CC if you do not want to wait for the full timer.',
    target: () => document.querySelector('[data-tab="crypto"]'),
    goal: 'Full timer pays 100%. Early withdrawal pays 70% of mined CC.',
  },
  {
    id: 'music',
    title: 'Stream-safe music',
    body: 'The music player uses original music produced by the creator The Unnamed! They are safe to stream or record with zero copyright worries. Swap tracks, lower BGM, or mute anytime.',
    target: () => document.getElementById('music-player'),
    goal: 'Pick a track you like; they are all DMCA-safe.',
  },
  {
    id: 'themes',
    title: 'Themes and presentation',
    body: 'Themes are cosmetic style swaps, while reduced animation and settings help late-game fights stay smoother and easier to read. Use them to make the game look how you want without losing clarity.',
    target: () => document.querySelector('.top-bar-settings'),
    goal: 'Use themes for style and settings for comfort and performance.',
  },
  {
    id: 'settings',
    title: 'Themes and settings',
    body: 'Settings let you replay this tutorial or toggle occasional tips. Use the “Replay tutorial” button if you want a refresher.',
    target: () => document.querySelector('[data-tab="settings"]') || document.querySelector('.top-bar-settings'),
    goal: 'Use settings to revisit guidance without slowing normal runs.',
  },
  {
    id: 'finish',
    title: 'You are ready',
    body: 'Keep the loop going—destroy nodes, gather resources, buy upgrades, and conquer bosses. Have fun experimenting with builds and themes!',
    target: () => UI.nodeArea,
    goal: 'Good luck, Operator.',
  },
];

function setupTutorial() {
  loadTutorialPreferences();
  const storedCompletion = getTutorialCompletionFlag();
  tutorialState.completed = state.tutorialCompleted || storedCompletion;
  const forceTutorial = shouldForceVersionTutorial && GAME_VERSION === VERSION_TUTORIAL_PROMPT_VERSION;
  if (tutorialState.completed && !state.tutorialCompleted) {
    state.tutorialCompleted = true;
    queueSave();
  }
  if (UI.tutorialNext) {
    UI.tutorialNext.addEventListener('click', advanceTutorialStep);
  }
  if (UI.tutorialSkip) {
    UI.tutorialSkip.addEventListener('click', () => finishTutorial(true));
  }
  window.addEventListener('resize', refreshTutorialHighlight);
  document.addEventListener('scroll', refreshTutorialHighlight, true);
  persistTutorialPreferences();
  applySettingsToControls();
  if (forceTutorial) {
    tutorialState.completed = false;
    state.tutorialCompleted = false;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(TUTORIAL_STORAGE_KEY);
      }
    } catch (error) {
      console.warn('Failed to reset tutorial completion for version tutorial prompt', error);
    }
    queueSave();
    closeUpdateLog();
    startTutorial({ replay: true });
    shouldForceVersionTutorial = false;
  } else if (!tutorialState.completed) {
    startTutorial();
  }
}

function loadTutorialPreferences() {
  const defaults = { showTips: true };
  let stored = {};
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(TUTORIAL_PREF_KEY);
      if (raw) {
        stored = JSON.parse(raw);
      }
    }
  } catch (error) {
    console.warn('Failed to load tutorial preferences', error);
  }
  tutorialState.preferences = { ...defaults, ...(stored || {}) };
  if (typeof tutorialState.preferences.showTips === 'boolean') {
    state.settings.showTips = tutorialState.preferences.showTips;
  }
}

function persistTutorialPreferences() {
  const payload = { showTips: Boolean(state.settings.showTips) };
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(TUTORIAL_PREF_KEY, JSON.stringify(payload));
    }
  } catch (error) {
    console.warn('Failed to save tutorial preferences', error);
  }
}

function getTutorialCompletionFlag() {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(TUTORIAL_STORAGE_KEY);
      return raw === 'true';
    }
  } catch (error) {
    console.warn('Failed to read tutorial flag', error);
  }
  return false;
}

function persistTutorialCompletion() {
  tutorialState.completed = true;
  state.tutorialCompleted = true;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(TUTORIAL_STORAGE_KEY, 'true');
    }
  } catch (error) {
    console.warn('Failed to record tutorial completion', error);
  }
  queueSave();
}

function startTutorial({ replay = false } = {}) {
  tutorialState.active = true;
  tutorialState.stepIndex = 0;
  tutorialState.completed = false;
  tutorialState.upgradePurchased = false;
  tutorialState.skillCheckComplete = false;
  tutorialState.awaitingUpgrade = false;
  tutorialState.awaitingSkillCheck = false;
  tutorialState.nodeShowcaseActive = false;
  tutorialState.nodeCapOverride = null;
  document.body.classList.add('tutorial-active');
  if (UI.tutorialOverlay) {
    UI.tutorialOverlay.classList.remove('hidden');
  }
  startTutorialHighlightTracking();
  showTutorialStep(replay ? 0 : tutorialState.stepIndex);
}

function finishTutorial(markComplete = false) {
  tutorialState.active = false;
  tutorialState.nodeShowcaseActive = false;
  tutorialState.awaitingNodeKills = false;
  tutorialState.awaitingUpgrade = false;
  tutorialState.awaitingSkillCheck = false;
  tutorialState.nodeCapOverride = null;
  document.body.classList.remove('tutorial-locked');
  if (UI.tutorialOverlay) {
    UI.tutorialOverlay.classList.add('hidden');
  }
  stopTutorialHighlightTracking();
  syncTutorialLayout(null);
  document.body.classList.remove('tutorial-active');
  if (markComplete) {
    persistTutorialCompletion();
  }
}

function advanceTutorialStep() {
  const step = getCurrentTutorialStep();
  if (step && !isTutorialStepComplete(step)) {
    return;
  }
  const nextIndex = tutorialState.stepIndex + 1;
  if (nextIndex >= tutorialSteps.length) {
    finishTutorial(true);
  } else {
    showTutorialStep(nextIndex);
  }
}

function getCurrentTutorialStep() {
  return tutorialSteps[tutorialState.stepIndex] || null;
}

function getCurrentTutorialTarget(step = getCurrentTutorialStep()) {
  if (!step) return null;
  if (typeof step.target === 'function') return step.target();
  return step.target || null;
}

function showTutorialStep(index) {
  const step = tutorialSteps[index];
  if (!step) {
    finishTutorial(true);
    return;
  }
  tutorialState.stepIndex = index;
  if (UI.tutorialTitle) {
    UI.tutorialTitle.textContent = step.title;
  }
  if (UI.tutorialBody) {
    UI.tutorialBody.textContent = step.body;
  }
  if (UI.tutorialProgress) {
    UI.tutorialProgress.textContent = `Step ${index + 1} / ${tutorialSteps.length}`;
  }
  enterTutorialStep(step);
  refreshTutorialStepUI(step);
}

function enterTutorialStep(step) {
  if (!step) return;
  if (step.onEnter) {
    step.onEnter();
  }
}

function refreshTutorialStepUI(step = getCurrentTutorialStep()) {
  updateTutorialGoal(step);
  updateTutorialButtons(step);
  syncTutorialLayout(step);
  refreshTutorialHighlight();
}

function updateTutorialButtons(step = getCurrentTutorialStep()) {
  if (!UI.tutorialNext) return;
  const finalStep = tutorialState.stepIndex >= tutorialSteps.length - 1;
  UI.tutorialNext.textContent = finalStep ? 'Finish' : 'Next';
  UI.tutorialNext.disabled = step ? !isTutorialStepComplete(step) : false;
}

function syncTutorialLayout(step = getCurrentTutorialStep()) {
  if (!UI.tutorialOverlay) return;
  const focusNodes = Boolean(step && step.id === 'nodes');
  UI.tutorialOverlay.classList.toggle('tutorial-panel-right', focusNodes);
  UI.tutorialOverlay.classList.toggle('tutorial-backdrop-clear', focusNodes);
  if (UI.tutorialPanel) {
    UI.tutorialPanel.classList.toggle('is-right', focusNodes);
  }
}

function startTutorialHighlightTracking() {
  if (tutorialHighlightFrame != null) return;
  const tick = () => {
    if (!tutorialState.active) {
      tutorialHighlightFrame = null;
      return;
    }
    refreshTutorialHighlight();
    tutorialHighlightFrame = requestAnimationFrame(tick);
  };
  tutorialHighlightFrame = requestAnimationFrame(tick);
}

function stopTutorialHighlightTracking() {
  if (tutorialHighlightFrame != null) {
    cancelAnimationFrame(tutorialHighlightFrame);
    tutorialHighlightFrame = null;
  }
}

function refreshTutorialHighlight() {
  if (!tutorialState.active || !UI.tutorialHighlight) return;
  const target = getCurrentTutorialTarget();
  if (!target) {
    UI.tutorialHighlight.style.width = '0px';
    UI.tutorialHighlight.style.height = '0px';
    return;
  }
  const rect = target.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) {
    UI.tutorialHighlight.style.width = '0px';
    UI.tutorialHighlight.style.height = '0px';
    return;
  }
  const padding = 10;
  UI.tutorialHighlight.style.left = `${rect.left - padding}px`;
  UI.tutorialHighlight.style.top = `${rect.top - padding}px`;
  UI.tutorialHighlight.style.width = `${rect.width + padding * 2}px`;
  UI.tutorialHighlight.style.height = `${rect.height + padding * 2}px`;
}

function formatNodeGoalProgress() {
  const parts = Object.keys(tutorialState.requiredNodeKills).map((key) => {
    const goal = tutorialState.requiredNodeKills[key] || 0;
    const current = tutorialState.nodeKillProgress[key] || 0;
    return `${key.toUpperCase()}: ${Math.min(current, goal)} / ${goal}`;
  });
  return parts.join(' • ');
}

function updateTutorialGoal(step = getCurrentTutorialStep()) {
  if (!UI.tutorialGoal) return;
  let text = '';
  let complete = false;
  if (!step) {
    UI.tutorialGoal.textContent = text;
    UI.tutorialGoal.classList.toggle('complete', complete);
    return;
  }
  if (step.id === 'nodes') {
    text = `Destroy the required nodes: ${formatNodeGoalProgress()}`;
    complete = isTutorialNodeGoalComplete();
  } else if (step.id === 'upgrade') {
    text = `Buy an upgrade and clear the skill check (${tutorialState.upgradePurchased ? 'purchased' : 'not purchased'}, ${tutorialState.skillCheckComplete ? 'skill check tried' : 'skill check pending'})`;
    complete = tutorialState.upgradePurchased && tutorialState.skillCheckComplete;
  } else if (typeof step.goal === 'function') {
    text = step.goal();
  } else if (typeof step.goal === 'string') {
    text = step.goal;
  }
  UI.tutorialGoal.textContent = text;
  UI.tutorialGoal.classList.toggle('complete', complete);
}

function isTutorialNodeGoalComplete() {
  return Object.keys(tutorialState.requiredNodeKills).every((key) => {
    const need = tutorialState.requiredNodeKills[key] || 0;
    const have = tutorialState.nodeKillProgress[key] || 0;
    return have >= need;
  });
}

function isTutorialStepComplete(step = getCurrentTutorialStep()) {
  if (!step) return true;
  if (step.id === 'nodes') {
    return isTutorialNodeGoalComplete();
  }
  if (step.id === 'upgrade') {
    return tutorialState.upgradePurchased && tutorialState.skillCheckComplete;
  }
  return true;
}

function startNodeShowcase() {
  tutorialState.awaitingNodeKills = true;
  tutorialState.nodeShowcaseActive = true;
  tutorialState.nodeKillProgress = Object.keys(tutorialState.requiredNodeKills).reduce((acc, key) => {
    acc[key] = 0;
    return acc;
  }, {});
  tutorialState.pendingNodeTypes = Object.keys(tutorialState.requiredNodeKills);
  tutorialState.nodeCapOverride = 1;
  activeNodes.forEach((node) => node.el?.remove());
  activeNodes.clear();
  syncNodeDensityState();
  nodeSpawnTimer = 0;
  document.body.classList.add('tutorial-locked');
}

function prepareUpgradeTutorial() {
  tutorialState.awaitingUpgrade = true;
  tutorialState.upgradePurchased = false;
  tutorialState.skillCheckComplete = false;
  tutorialState.awaitingSkillCheck = false;
  tutorialState.nodeCapOverride = null;
  if (state.bits < 200) {
    state.bits = 200;
    updateResources();
  }
  const upgradeTab = document.querySelector('[data-tab="upgrades"]');
  if (upgradeTab) {
    upgradeTab.click();
  }
}

function registerTutorialNodeKill(typeId) {
  if (!tutorialState.nodeShowcaseActive || !typeId) return;
  const need = tutorialState.requiredNodeKills[typeId];
  if (need) {
    tutorialState.nodeKillProgress[typeId] = Math.min(need, (tutorialState.nodeKillProgress[typeId] || 0) + 1);
  }
  if (isTutorialNodeGoalComplete()) {
    tutorialState.nodeShowcaseActive = false;
    tutorialState.awaitingNodeKills = false;
    tutorialState.nodeCapOverride = null;
    document.body.classList.remove('tutorial-locked');
  } else {
    nodeSpawnTimer = 0;
  }
  refreshTutorialStepUI();
}

function handleTutorialUpgradePurchase() {
  if (!tutorialState.active) return;
  const step = getCurrentTutorialStep();
  if (!step || step.id !== 'upgrade') return;
  tutorialState.upgradePurchased = true;
  refreshTutorialStepUI(step);
}

function handleTutorialSkillCheckResult() {
  if (!tutorialState.active) return;
  const step = getCurrentTutorialStep();
  if (!step || step.id !== 'upgrade') return;
  if (!tutorialState.awaitingSkillCheck && tutorialState.skillCheckComplete) return;
  tutorialState.skillCheckComplete = true;
  tutorialState.awaitingSkillCheck = false;
  refreshTutorialStepUI();
}

function getTutorialNodeTypeOverride() {
  if (!tutorialState.nodeShowcaseActive) return null;
  const nextId = tutorialState.pendingNodeTypes.find((id) => {
    const need = tutorialState.requiredNodeKills[id] || 0;
    const have = tutorialState.nodeKillProgress[id] || 0;
    return have < need;
  });
  if (!nextId) return null;
  return nodeTypes.find((type) => type.id === nextId) || null;
}

function getActiveNodeCap() {
  if (tutorialState.nodeCapOverride != null) {
    return tutorialState.nodeCapOverride;
  }
  return Math.max(1, Math.floor(stats.maxNodes));
}

function snapshotTutorialPersistence() {
  return {
    completed: tutorialState.completed || state.tutorialCompleted || getTutorialCompletionFlag(),
    prefs: { showTips: Boolean(state.settings.showTips) },
  };
}

function restoreTutorialPersistence(snapshot) {
  if (!snapshot) return;
  if (snapshot.completed) {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(TUTORIAL_STORAGE_KEY, 'true');
      }
    } catch (error) {
      console.warn('Failed to restore tutorial completion', error);
    }
  }
  if (snapshot.prefs) {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(TUTORIAL_PREF_KEY, JSON.stringify(snapshot.prefs));
      }
    } catch (error) {
      console.warn('Failed to restore tutorial preferences', error);
    }
  }
}

function generateSkins() {
  skins = [];
}

function renderSkins() {
  if (!UI.skinGrid) return;
  UI.skinGrid.innerHTML = '';
  if (skins.length === 0) return;
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
    { key: 'damage', count: 400, baseName: 'Node Piercer', minLevel: 5, maxLevel: 20, baseCost: 50, scale: 1.35 },
    { key: 'crit', count: 300, baseName: 'Critical Bloom', minLevel: 3, maxLevel: 12, baseCost: 120, scale: 1.4 },
    { key: 'economyNode', category: 'economy', count: 350, baseName: 'Bit Condenser', minLevel: 4, maxLevel: 20, baseCost: 110, scale: 1.32 },
    { key: 'economy', count: 300, baseName: 'Extraction Protocol', minLevel: 6, maxLevel: 24, baseCost: 90, scale: 1.35 },
    { key: 'control', count: 5, baseName: 'Node Field', minLevel: 4, maxLevel: 18, baseCost: 140, scale: 1.38 },
  ];
  const effects = {
    damage: (stats, level, data) => {
      stats.damage += stats.baseDamage * data.perLevel * level;
    },
    crit: (stats, level, data) => {
      const chanceBonus = Math.max(0, data.perLevel || 0);
      if (chanceBonus > 0) {
        stats.critChance += chanceBonus * level;
      }
      const growth = Math.max(1, data.multiplierGrowth || 1);
      if (growth > 1) {
        stats.critMultiplier *= Math.pow(growth, level);
      }
    },
    economyNode: (stats, level, data) => {
      stats.bitNodeBonus += data.perLevel * level;
    },
    economy: (stats, level, data) => {
      stats.bitGain += data.perLevel * level;
    },
    control: (stats, level, data) => {
      const scaledBonus = 1 + data.perLevel;
      stats.maxNodes += Math.floor(level * scaledBonus);
      stats.nodeSpawnDelay = Math.max(0.3, stats.nodeSpawnDelay - level * 0.02 * scaledBonus);
    },
  };

  upgrades = [];
  upgradeLookup = new Map();
  const previousByCategory = new Map();
  let idCounter = 1;
  families.forEach((family) => {
    for (let i = 0; i < family.count; i += 1) {
      const tierIndex = Math.floor(i / 10);
      const withinTier = i % 10;
      const maxLevel = family.minLevel + (i % (family.maxLevel - family.minLevel + 1));
      let perLevel = 0.09 * Math.pow(2.2, i);
      let multiplierGrowth = family.key === 'crit' ? 1.5 : 1;
      if (family.key === 'economy' || family.key === 'economyNode') {
        perLevel = 5 * Math.pow(3.3, tierIndex);
      }
      if (family.key === 'crit') {
        const critConfig = getCritUpgradeConfig(i);
        perLevel = critConfig.chancePerLevel;
        multiplierGrowth = critConfig.multiplierGrowth;
      }
      const costBase = family.baseCost * 2 ** tierIndex;
      const costScale = 1.5;
      const id = `${family.key.toUpperCase()}_${idCounter}`;
      const tierLabel = tierIndex === 0 ? '' : ` ${romanNumeral(tierIndex + 1)}`;
      const name = `${family.baseName}${tierLabel} ${romanNumeral(withinTier + 1)}`;
      const desc =
        family.key === 'crit'
          ? describeCritUpgrade(perLevel, maxLevel, multiplierGrowth)
          : describeUpgrade(family.key, perLevel, maxLevel);
      const requirements = {};
      const currency = 'bits';
      const category = family.category || family.key;
      const previousId = previousByCategory.get(category) || null;
      const upgrade = {
        id,
        category,
        name,
        description: desc,
        maxLevel,
        perLevel,
        costBase,
        costScale,
        currency,
        requirements,
        sequenceIndex: i,
        previousId,
        effect: (statsObj, level) =>
          effects[family.key](statsObj, level, { perLevel, family, multiplierGrowth }),
      };
      upgrades.push(upgrade);
      upgradeLookup.set(id, upgrade);
      previousByCategory.set(category, id);
      idCounter += 1;
    }
  });

  const phaseHaloPrevious = previousByCategory.get('point-area') || null;
  const phaseHalo = {
    id: 'PHASE_HALO',
    category: 'point-area',
    name: 'Phase Halo',
    description: '+6px pointer size per level',
    maxLevel: 20,
    perLevel: 6,
    costBase: 250,
    costScale: 1.35,
    currency: 'bits',
    requirements: {},
    sequenceIndex: idCounter,
    previousId: phaseHaloPrevious,
    effect: (statsObj, level, upgrade) => {
      statsObj.pointerSize += (upgrade.perLevel || 0) * level;
    },
  };
  upgrades.push(phaseHalo);
  upgradeLookup.set(phaseHalo.id, phaseHalo);
  previousByCategory.set('point-area', phaseHalo.id);
  idCounter += 1;

  upgrades.push({
    id: 'BOSS_EXECUTION',
    category: 'damage',
    name: 'Boss Execution',
    description: '+6% boss damage per boss kill per level',
    maxLevel: 4,
    perKillBonus: 0.06,
    costBase: 20,
    costScale: 2.1,
    currency: 'prestige',
    requirements: { prestige: 12 },
    sequenceIndex: idCounter,
    effect: (statsObj, level, upgrade) => {
      statsObj.bossKillDamageRamp += (upgrade.perKillBonus || 0) * level;
    },
  });
  upgradeLookup.set('BOSS_EXECUTION', upgrades[upgrades.length - 1]);
}

function describeUpgrade(category, perLevel, maxLevel) {
  switch (category) {
    case 'damage':
      return `+${(perLevel * 100).toFixed(1)}% damage / level (${maxLevel} lvls)`;
    case 'economyNode':
      return `+${perLevel.toFixed(1)} bits from nodes / level`;
    case 'economy':
      return `+${perLevel.toFixed(2)} bits+ / level`;
    case 'control':
      return 'Faster spawns & higher node cap';
    default:
      return '';
  }
}

function describeCritUpgrade(chancePerLevel, maxLevel, multiplierGrowth) {
  const chanceCopy = chancePerLevel > 0 ? `+${(chancePerLevel * 100).toFixed(2)}% crit chance / level` : '';
  const damageCopy = multiplierGrowth > 1 ? `+${multiplierGrowth.toFixed(2)}x crit damage / level` : '';
  const parts = [chanceCopy, damageCopy].filter(Boolean);
  const body = parts.length > 0 ? parts.join(', ') : 'Critical damage';
  const capCopy = chancePerLevel > 0 ? ', capped at 70% total crit chance' : '';
  return `${body}${capCopy} (${maxLevel} lvls)`;
}

function getCritUpgradeConfig(sequenceIndex) {
  const critConfigs = [
    { chancePerLevel: 0.018, multiplierGrowth: 1.24 },
    { chancePerLevel: 0, multiplierGrowth: 1.2 },
    { chancePerLevel: 0.02, multiplierGrowth: 1.18 },
    { chancePerLevel: 0, multiplierGrowth: 1.16 },
    { chancePerLevel: 0.022, multiplierGrowth: 1.14 },
    { chancePerLevel: 0, multiplierGrowth: 1.12 },
    { chancePerLevel: 0.024, multiplierGrowth: 1.1 },
    { chancePerLevel: 0, multiplierGrowth: 1.08 },
    { chancePerLevel: 0.012, multiplierGrowth: 1.06 },
  ];
  if (sequenceIndex < critConfigs.length) {
    return critConfigs[sequenceIndex];
  }
  return { chancePerLevel: 0, multiplierGrowth: 1.04 };
}

function generateAreaUpgrades() {
  areaUpgradeDefs = [];
}

function generateSpawnUpgrades() {
  spawnUpgradeDefs = [
    {
      id: 'replicant-forge',
      name: 'Replicant Forge',
      description: '+6 max nodes and faster baseline replication every level',
      maxLevel: 4,
      costBase: 3200,
      costScale: 1.52,
      currency: 'bits',
      delayReduction: 0.12,
      nodeBonus: 6,
      minDelay: 0.18,
      effect: (statsObj, level, upgrade) => {
        statsObj.nodeSpawnDelay = Math.max(upgrade.minDelay, statsObj.nodeSpawnDelay - upgrade.delayReduction * level);
        statsObj.maxNodes += upgrade.nodeBonus * level;
      },
    },
    {
      id: 'swarm-weave',
      name: 'Swarm Weave',
      description: '+14 max nodes with tighter queue handling per level',
      maxLevel: 4,
      costBase: 18000,
      costScale: 1.6,
      currency: 'bits',
      delayReduction: 0.04,
      nodeBonus: 14,
      minDelay: 0.12,
      effect: (statsObj, level, upgrade) => {
        statsObj.nodeSpawnDelay = Math.max(upgrade.minDelay, statsObj.nodeSpawnDelay - upgrade.delayReduction * level);
        statsObj.maxNodes += upgrade.nodeBonus * level;
      },
    },
    {
      id: 'quantum-relay',
      name: 'Quantum Relay',
      description: '+28 max nodes and denser relay bursts per level',
      maxLevel: 3,
      costBase: 85000,
      costScale: 1.68,
      currency: 'bits',
      delayReduction: 0.03,
      nodeBonus: 28,
      minDelay: 0.09,
      effect: (statsObj, level, upgrade) => {
        statsObj.nodeSpawnDelay = Math.max(upgrade.minDelay, statsObj.nodeSpawnDelay - upgrade.delayReduction * level);
        statsObj.maxNodes += upgrade.nodeBonus * level;
      },
    },
  ];
}

function generateSpeedUpgrades() {
  speedUpgradeDefs = [
    {
      id: 'servo-haste',
      name: 'Servo Haste',
      description: '-0.01s auto interval per level',
      maxLevel: 10,
      costBase: 260,
      costScale: 1.38,
      currency: 'bits',
      intervalReduction: 0.01,
      minInterval: 0.12,
      effect: (statsObj, level, upgrade) => {
        statsObj.autoInterval = Math.max(upgrade.minInterval, statsObj.autoInterval - upgrade.intervalReduction * level);
      },
    },
    {
      id: 'neural-overdrive',
      name: 'Neural Overdrive',
      description: '-0.05s auto interval per level',
      maxLevel: 5,
      costBase: 4200,
      costScale: 1.44,
      currency: 'bits',
      intervalReduction: 0.05,
      minInterval: 0.1,
      effect: (statsObj, level, upgrade) => {
        statsObj.autoInterval = Math.max(upgrade.minInterval, statsObj.autoInterval - upgrade.intervalReduction * level);
      },
    },
  ];
}

function generateCollectUpgrades() {
  collectUpgradeDefs = [
    {
      id: 'magnet-sheath',
      name: 'Magnet Sheath',
      tierNames: ['Magnet Sheath I', 'Magnet Sheath II', 'Magnet Sheath III'],
      description: '+60px bit collection radius per level',
      maxLevel: 3,
      costBase: 720,
      costScale: 1.68,
      currency: 'bits',
      radiusPerLevel: 60,
      effect: (statsObj, level, upgrade) => {
        statsObj.bitCollectRadius += upgrade.radiusPerLevel * level;
      },
    },
  ];
}

function getAreaUpgradeVersion(id) {
  return Math.max(1, state.areaUpgradeVersions[id] || 1);
}

function getSpawnUpgradeVersion(id) {
  return Math.max(1, state.spawnUpgradeVersions[id] || 1);
}

function getAreaVersionBaseCost(upgrade, version) {
  if (version === 1) {
    return upgrade.costBase;
  }
  const previousCost = getAreaUpgradeCost(upgrade, upgrade.maxLevel - 1, version - 1);
  return Math.ceil(previousCost * 3);
}

function getSpawnVersionBaseCost(upgrade, version) {
  if (version === 1) {
    return upgrade.costBase;
  }
  const previousCost = getSpawnUpgradeCost(upgrade, upgrade.maxLevel - 1, version - 1);
  return Math.ceil(previousCost * 3);
}

function getAreaUpgradeCost(upgrade, level, version = getAreaUpgradeVersion(upgrade.id)) {
  if (!upgrade || level >= upgrade.maxLevel) {
    return 0;
  }
  const base = getAreaVersionBaseCost(upgrade, version);
  return Math.ceil(base * 1.8 ** level);
}

function getSpawnUpgradeCost(upgrade, level, version = getSpawnUpgradeVersion(upgrade.id)) {
  if (!upgrade || level >= upgrade.maxLevel) {
    return 0;
  }
  const base = getSpawnVersionBaseCost(upgrade, version);
  return Math.ceil(base * 1.8 ** level);
}

function getCollectUpgradeCost(upgrade, level) {
  if (!upgrade || level >= upgrade.maxLevel) {
    return 0;
  }
  return Math.ceil(upgrade.costBase * upgrade.costScale ** level);
}

function getAreaUpgradeLpCost(version) {
  if (version <= 1) return 0;
  const costs = [0, 1, 3, 5, 10, 15];
  return costs[Math.min(version, costs.length - 1)];
}

function getSpawnUpgradePrestigeCost(version) {
  if (version <= 1) return 0;
  const costs = [0, 1, 2, 4, 8];
  return costs[Math.min(version, costs.length - 1)];
}

function hasCompletedPhaseHaloI() {
  const phaseHaloLevel = state.upgrades?.PHASE_HALO || 0;
  return phaseHaloLevel >= 10;
}

function renderAreaUpgrades() {
  if (!UI.areaUpgradeGrid) return;
  UI.areaUpgradeGrid.innerHTML = '';
  const fragment = document.createDocumentFragment();
  areaUpgradeDefs.forEach((upgrade) => {
    const level = state.areaUpgrades[upgrade.id] || 0;
    const version = getAreaUpgradeVersion(upgrade.id);
    const maxed = level >= upgrade.maxLevel;
    const cost = getAreaUpgradeCost(upgrade, level, version);
    const lpCost = getAreaUpgradeLpCost(version);
    const percent = Math.min(100, (level / upgrade.maxLevel) * 100);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'area-upgrade';
    button.dataset.id = upgrade.id;
    button.setAttribute('role', 'listitem');
    if (maxed) {
      button.classList.add('maxed');
    }
    button.innerHTML = `
      <div class="title">${upgrade.name} ${romanNumeral(version)}</div>
      <div class="desc">${upgrade.description}</div>
      <div class="level">Level ${level} / ${upgrade.maxLevel}</div>
      <div class="progress-track"><div class="fill" style="width: ${percent}%"></div></div>
      <div class="cost">${maxed
        ? 'Fully synced'
        : `Cost: <span>${cost.toLocaleString()}</span> ${upgrade.currency}${lpCost ? ` + ${lpCost} LP` : ''}`}</div>
    `;
    const affordable = !maxed && state[upgrade.currency] >= cost && state.lp >= lpCost;
    button.classList.toggle('available', affordable);
    button.classList.toggle('unaffordable', !maxed && !affordable);
    button.disabled = maxed || !affordable;
    button.addEventListener('click', () => attemptAreaPurchase(upgrade));
    fragment.appendChild(button);
  });
  UI.areaUpgradeGrid.appendChild(fragment);
}

function attemptAreaPurchase(upgrade) {
  if (!upgrade) return;
  const level = state.areaUpgrades[upgrade.id] || 0;
  const version = getAreaUpgradeVersion(upgrade.id);
  if (level >= upgrade.maxLevel) {
    if (version < 5) {
      state.areaUpgradeVersions[upgrade.id] = version + 1;
      state.areaUpgrades[upgrade.id] = 0;
      renderAreaUpgrades();
    }
    return;
  }
  const cost = getAreaUpgradeCost(upgrade, level, version);
  const lpCost = getAreaUpgradeLpCost(version);
  if (state[upgrade.currency] < cost || state.lp < lpCost) {
    return;
  }
  state[upgrade.currency] -= cost;
  state.lp -= lpCost;
  const nextLevel = level + 1;
  state.areaUpgrades[upgrade.id] = nextLevel;
  if (nextLevel >= upgrade.maxLevel && version < 5) {
    state.areaUpgradeVersions[upgrade.id] = version + 1;
    state.areaUpgrades[upgrade.id] = 0;
  }
  updateStats();
  updateResources();
  renderAreaUpgrades();
  queueSave();
}

function applyAreaUpgrades(statsObj) {
  areaUpgradeDefs.forEach((upgrade) => {
    const level = (getAreaUpgradeVersion(upgrade.id) - 1) * upgrade.maxLevel + (state.areaUpgrades[upgrade.id] || 0);
    if (level > 0 && typeof upgrade.effect === 'function') {
      upgrade.effect(statsObj, level, upgrade);
    }
  });
}

function renderCollectUpgrades() {
  if (!UI.collectUpgradeGrid) return;
  UI.collectUpgradeGrid.innerHTML = '';
  const fragment = document.createDocumentFragment();
  collectUpgradeDefs.forEach((upgrade) => {
    const level = state.collectUpgrades[upgrade.id] || 0;
    const maxed = level >= upgrade.maxLevel;
    const cost = getCollectUpgradeCost(upgrade, level);
    const percent = Math.min(100, (level / upgrade.maxLevel) * 100);
    const displayName = getUpgradeDisplayName(upgrade, level);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'area-upgrade';
    button.dataset.id = upgrade.id;
    button.setAttribute('role', 'listitem');
    if (maxed) {
      button.classList.add('maxed');
    }
    button.innerHTML = `
      <div class="title">${displayName}</div>
      <div class="desc">${upgrade.description}</div>
      <div class="level">Level ${level} / ${upgrade.maxLevel}</div>
      <div class="progress-track"><div class="fill" style="width: ${percent}%"></div></div>
      <div class="cost">${maxed ? 'Fully synced' : `Cost: <span>${cost.toLocaleString()}</span> ${upgrade.currency}`}</div>
    `;
    const affordable = !maxed && state[upgrade.currency] >= cost;
    button.classList.toggle('available', affordable);
    button.classList.toggle('unaffordable', !maxed && !affordable);
    button.disabled = maxed || !affordable;
    button.addEventListener('click', () => attemptCollectPurchase(upgrade));
    fragment.appendChild(button);
  });
  UI.collectUpgradeGrid.appendChild(fragment);
}

function attemptCollectPurchase(upgrade) {
  if (!upgrade) return;
  const level = state.collectUpgrades[upgrade.id] || 0;
  if (level >= upgrade.maxLevel) {
    return;
  }
  const cost = getCollectUpgradeCost(upgrade, level);
  if (state[upgrade.currency] < cost) {
    return;
  }
  state[upgrade.currency] -= cost;
  const nextLevel = level + 1;
  state.collectUpgrades[upgrade.id] = nextLevel;
  updateStats();
  updateResources();
  renderCollectUpgrades();
  queueSave();
}

function applyCollectUpgrades(statsObj) {
  collectUpgradeDefs.forEach((upgrade) => {
    const level = state.collectUpgrades[upgrade.id] || 0;
    if (level > 0 && typeof upgrade.effect === 'function') {
      upgrade.effect(statsObj, level, upgrade);
    }
  });
}

function getUpgradeDisplayName(upgrade, level = 0) {
  if (Array.isArray(upgrade?.tierNames) && upgrade.tierNames.length > 0) {
    const index = Math.min(Math.max(0, level), upgrade.tierNames.length - 1);
    return upgrade.tierNames[index];
  }
  return upgrade?.name || '';
}

function renderSpawnUpgrades() {
  if (!UI.spawnUpgradeGrid) return;
  UI.spawnUpgradeGrid.innerHTML = '';
  const fragment = document.createDocumentFragment();
  spawnUpgradeDefs.forEach((upgrade) => {
    const level = state.spawnUpgrades[upgrade.id] || 0;
    const version = getSpawnUpgradeVersion(upgrade.id);
    const maxed = level >= upgrade.maxLevel;
    const cost = getSpawnUpgradeCost(upgrade, level, version);
    const prestigeCost = getSpawnUpgradePrestigeCost(version);
    const percent = Math.min(100, (level / upgrade.maxLevel) * 100);
    const displayName = getUpgradeDisplayName(upgrade, level);
    const title = version > 1 ? `${displayName} ${romanNumeral(version)}` : displayName;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'area-upgrade';
    button.dataset.id = upgrade.id;
    button.setAttribute('role', 'listitem');
    if (maxed) {
      button.classList.add('maxed');
    }
    button.innerHTML = `
      <div class="title">${title}</div>
      <div class="desc">${upgrade.description}</div>
      <div class="level">Level ${level} / ${upgrade.maxLevel}</div>
      <div class="progress-track"><div class="fill" style="width: ${percent}%"></div></div>
      <div class="cost">${maxed
        ? 'Fully synced'
        : `Cost: <span>${cost.toLocaleString()}</span> ${upgrade.currency}${prestigeCost ? ` + ${prestigeCost} Prestige` : ''}`}</div>
    `;
    const resourcePool = upgrade.currency === 'prestige' ? state.prestige : state.bits;
    const affordable = !maxed && resourcePool >= cost && state.prestige >= prestigeCost;
    button.classList.toggle('available', affordable);
    button.classList.toggle('unaffordable', !maxed && !affordable);
    button.disabled = maxed || !affordable;
    button.addEventListener('click', () => attemptSpawnPurchase(upgrade));
    fragment.appendChild(button);
  });
  UI.spawnUpgradeGrid.appendChild(fragment);
}

function attemptSpawnPurchase(upgrade) {
  if (!upgrade) return;
  const level = state.spawnUpgrades[upgrade.id] || 0;
  const version = getSpawnUpgradeVersion(upgrade.id);
  if (level >= upgrade.maxLevel) {
    if (version < 5) {
      state.spawnUpgradeVersions[upgrade.id] = version + 1;
      state.spawnUpgrades[upgrade.id] = 0;
      renderSpawnUpgrades();
    }
    return;
  }
  const cost = getSpawnUpgradeCost(upgrade, level, version);
  const currency = upgrade.currency === 'prestige' ? 'prestige' : 'bits';
  const prestigeBonus = getSpawnUpgradePrestigeCost(version);
  if (state[currency] < cost || state.prestige < prestigeBonus) {
    return;
  }
  state[currency] -= cost;
  state.prestige -= prestigeBonus;
  const nextLevel = level + 1;
  state.spawnUpgrades[upgrade.id] = nextLevel;
  if (nextLevel >= upgrade.maxLevel && version < 5) {
    state.spawnUpgradeVersions[upgrade.id] = version + 1;
    state.spawnUpgrades[upgrade.id] = 0;
  }
  updateStats();
  updateResources();
  renderSpawnUpgrades();
  queueSave();
}

function applySpawnUpgrades(statsObj) {
  spawnUpgradeDefs.forEach((upgrade) => {
    const level = (getSpawnUpgradeVersion(upgrade.id) - 1) * upgrade.maxLevel + (state.spawnUpgrades[upgrade.id] || 0);
    if (level > 0 && typeof upgrade.effect === 'function') {
      upgrade.effect(statsObj, level, upgrade);
    }
  });
}

function renderSpeedUpgrades() {
  if (!UI.speedUpgradeGrid) return;
  UI.speedUpgradeGrid.innerHTML = '';
  const fragment = document.createDocumentFragment();
  speedUpgradeDefs.forEach((upgrade) => {
    const level = state.speedUpgrades[upgrade.id] || 0;
    const maxed = level >= upgrade.maxLevel;
    const cost = getCollectUpgradeCost(upgrade, level);
    const percent = Math.min(100, (level / upgrade.maxLevel) * 100);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'area-upgrade';
    button.dataset.id = upgrade.id;
    button.setAttribute('role', 'listitem');
    if (maxed) {
      button.classList.add('maxed');
    }
    button.innerHTML = `
      <div class="title">${upgrade.name}</div>
      <div class="desc">${upgrade.description}</div>
      <div class="level">Level ${level} / ${upgrade.maxLevel}</div>
      <div class="progress-track"><div class="fill" style="width: ${percent}%"></div></div>
      <div class="cost">${maxed ? 'Fully synced' : `Cost: <span>${cost.toLocaleString()}</span> ${upgrade.currency}`}</div>
    `;
    const affordable = !maxed && state[upgrade.currency] >= cost;
    button.classList.toggle('available', affordable);
    button.classList.toggle('unaffordable', !maxed && !affordable);
    button.disabled = maxed || !affordable;
    button.addEventListener('click', () => attemptSpeedPurchase(upgrade));
    fragment.appendChild(button);
  });
  UI.speedUpgradeGrid.appendChild(fragment);
}

function attemptSpeedPurchase(upgrade) {
  if (!upgrade) return;
  const level = state.speedUpgrades[upgrade.id] || 0;
  if (level >= upgrade.maxLevel) {
    return;
  }
  const cost = getCollectUpgradeCost(upgrade, level);
  if (state[upgrade.currency] < cost) {
    return;
  }
  state[upgrade.currency] -= cost;
  const nextLevel = level + 1;
  state.speedUpgrades[upgrade.id] = nextLevel;
  updateStats();
  updateResources();
  renderSpeedUpgrades();
  queueSave();
}

function applySpeedUpgrades(statsObj) {
  speedUpgradeDefs.forEach((upgrade) => {
    const level = state.speedUpgrades[upgrade.id] || 0;
    if (level > 0 && typeof upgrade.effect === 'function') {
      upgrade.effect(statsObj, level, upgrade);
    }
  });
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

function buildCategorySequences() {
  const sequences = new Map();
  upgrades.forEach((upgrade, index) => {
    const list = sequences.get(upgrade.category) || [];
    list.push({ upgrade, order: index });
    sequences.set(upgrade.category, list);
  });
  sequences.forEach((list) => list.sort((a, b) => a.order - b.order));
  return sequences;
}

function isCategoryVisible(category, activeFilter) {
  return activeFilter === 'all' || category === activeFilter;
}

function getVisibleUpgradeSet(activeFilter, categorySequences) {
  const visible = new Set();
  categorySequences.forEach((list, category) => {
    if (!isCategoryVisible(category, activeFilter)) {
      return;
    }
    const firstPendingIndex = list.findIndex(({ upgrade }) => {
      const level = state.upgrades[upgrade.id] || 0;
      return level < upgrade.maxLevel;
    });
    const cutoff = firstPendingIndex === -1 ? list.length - 1 : firstPendingIndex;
    list.slice(0, cutoff + 1).forEach(({ upgrade }) => {
      visible.add(upgrade.id);
    });
  });
  return visible;
}

function getUpgradeDisplayName(upgrade, level) {
  if (upgrade.id === 'PHASE_HALO') {
    const version = Math.min(4, Math.max(1, Math.ceil(Math.max(level, 0) / 3) || 1));
    return `${upgrade.name} ${romanNumeral(version)}`;
  }
  return upgrade.name;
}

function buildSkillBranchLayout(activeFilter) {
  const categorySequences = buildCategorySequences();
  const visibleUpgrades = getVisibleUpgradeSet(activeFilter, categorySequences);
  const branchMap = new Map();
  upgrades.forEach((upgrade) => {
    if (!isCategoryVisible(upgrade.category, activeFilter)) return;
    if (!visibleUpgrades.has(upgrade.id)) return;
    const level = state.upgrades[upgrade.id] || 0;
    const branch = branchMap.get(upgrade.category) || [];
    branch.push({ upgrade, level });
    branchMap.set(upgrade.category, branch);
  });
  branchMap.forEach((list, category) => {
    branchMap.set(
      category,
      [...list].sort((a, b) => (a.upgrade.sequenceIndex || 0) - (b.upgrade.sequenceIndex || 0)),
    );
  });
  return branchMap;
}

function drawSkillConnections(layer, elementMap) {
  if (!layer) return;
  layer.innerHTML = '';
  const rect = layer.getBoundingClientRect();
  elementMap.forEach((nodeEl, id) => {
    const upgrade = upgradeLookup.get(id);
    if (!upgrade?.previousId) return;
    const parentEl = elementMap.get(upgrade.previousId);
    if (!parentEl) return;
    const childRect = nodeEl.getBoundingClientRect();
    const parentRect = parentEl.getBoundingClientRect();
    const startX = parentRect.left + parentRect.width / 2 - rect.left;
    const startY = parentRect.top + parentRect.height / 2 - rect.top;
    const endX = childRect.left + childRect.width / 2 - rect.left;
    const endY = childRect.top + childRect.height / 2 - rect.top;
    const dx = endX - startX;
    const dy = endY - startY;
    const length = Math.hypot(dx, dy);
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    const line = document.createElement('span');
    line.className = 'skill-connector';
    line.style.width = `${length}px`;
    line.style.transform = `translate(${startX}px, ${startY}px) rotate(${angle}deg)`;
    layer.appendChild(line);
  });
}

function getSkillCheckPreview(upgrade, cost, previousLevel = 0) {
  const difficulty = upgrade.category === 'damage' ? 'easy' : 'normal';
  const rewardBits = Math.ceil(cost * (difficulty === 'hard' ? 0.95 : difficulty === 'normal' ? 0.7 : 0.45));
  const rewardXP = Math.ceil(15 * (difficulty === 'hard' ? 2.2 : difficulty === 'normal' ? 1.4 : 1));
  const penalty = Math.min(state[upgrade.currency] || 0, cost);
  return {
    difficulty,
    rewardBits,
    rewardXP,
    penalty,
    rewardLabel: `Reward: +${rewardBits.toLocaleString()} bits, +${rewardXP.toLocaleString()} XP`,
    penaltyLabel: `Penalty: -${penalty.toLocaleString()} ${upgrade.currency}`,
    previousLevel,
  };
}

function showSkillDetail(target, upgrade) {
  if (!UI.skillDetailPopup || !target || !upgrade) return;
  const level = state.upgrades[upgrade.id] || 0;
  const nextLevel = Math.min(upgrade.maxLevel, level + 1);
  const cost = getUpgradeCost(upgrade, level);
  const preview = getSkillCheckPreview(upgrade, cost, level);
  const detail = UI.skillDetailPopup;
  detail.innerHTML = `
    <div class="title">${upgrade.name}</div>
    <div class="meta">
      <span>Next: ${nextLevel}/${upgrade.maxLevel}</span>
      <span>Cost: ${cost.toLocaleString()} ${upgrade.currency}</span>
      <span>Skill check: 18% chance (${preview.difficulty})</span>
      <span>${preview.rewardLabel}</span>
      <span>${preview.penaltyLabel}</span>
    </div>
    <div class="desc">${upgrade.description}</div>
  `;
  detail.dataset.upgradeId = upgrade.id;
  detail.dataset.sourceId = target.dataset.id || upgrade.id;
  detail.classList.remove('hidden');
  const rect = target.getBoundingClientRect();
  const popupRect = detail.getBoundingClientRect();
  const margin = 10;
  let left = rect.left;
  let top = rect.bottom + margin;
  if (left + popupRect.width > window.innerWidth) {
    left = window.innerWidth - popupRect.width - margin;
  }
  if (top + popupRect.height > window.innerHeight) {
    top = rect.top - popupRect.height - margin;
  }
  detail.style.left = `${Math.max(8, left)}px`;
  detail.style.top = `${Math.max(8, top)}px`;
}

function hideSkillDetail() {
  if (UI.skillDetailPopup) {
    delete UI.skillDetailPopup.dataset.upgradeId;
    delete UI.skillDetailPopup.dataset.sourceId;
    UI.skillDetailPopup.classList.add('hidden');
  }
}

function setupSkillDetailDismissal() {
  document.addEventListener('pointerdown', (event) => {
    if (!UI.skillDetailPopup || UI.skillDetailPopup.classList.contains('hidden')) return;
    if (event.target.closest('.skill-node')) return;
    if (!UI.skillDetailPopup.contains(event.target)) {
      hideSkillDetail();
    }
  });
}

function renderUpgrades(filter) {
  if (!UI.skillTree) return;
  const buttonFilter = document.querySelector('.filter.active')?.dataset.filter;
  const activeFilter = filter || state.selectedUpgradeFilter || buttonFilter || 'damage';
  state.selectedUpgradeFilter = activeFilter;
  syncFilterButtons(activeFilter);
  UI.skillTree.innerHTML = '';
  hideSkillDetail();
  const fragment = document.createDocumentFragment();
  const branchMap = buildSkillBranchLayout(activeFilter);

  branchMap.forEach((nodes, category) => {
    const branchEl = document.createElement('section');
    branchEl.className = 'skill-branch';
    branchEl.dataset.category = category;
    branchEl.setAttribute('role', 'listitem');
    const title = document.createElement('div');
    title.className = 'branch-title';
    const totalNodes = nodes.length;
    title.innerHTML = `<span>${category.toUpperCase()}</span><span>${totalNodes} nodes</span>`;
    const track = document.createElement('div');
    track.className = 'branch-track';
    const connectorLayer = document.createElement('div');
    connectorLayer.className = 'connector-layer';
    const elementMap = new Map();
    nodes.forEach(({ upgrade, level }) => {
      const nodeEl = document.createElement('button');
      nodeEl.type = 'button';
      nodeEl.className = 'skill-node';
      if (!upgrade.previousId) {
        nodeEl.classList.add('origin');
      }
      nodeEl.dataset.id = upgrade.id;
      nodeEl.dataset.category = upgrade.category;
      const displayName = getUpgradeDisplayName(upgrade, level);
      const cost = getUpgradeCost(upgrade, level);
      const lockedByReq = !meetsRequirements(upgrade);
      const previousMet = !upgrade.previousId || (state.upgrades[upgrade.previousId] || 0) > 0;
      const affordable = level < upgrade.maxLevel && state[upgrade.currency] >= cost;
      const statusLabel =
        level >= upgrade.maxLevel
          ? 'Fully synced'
          : lockedByReq || !previousMet
          ? getUpgradeLockLabel(upgrade)
          : getUpgradeAffordabilityLabel(upgrade, cost);
      nodeEl.innerHTML = `
          <div class="title">${displayName}</div>
          <div class="desc">${upgrade.description}</div>
          <div class="level">Level ${level} / ${upgrade.maxLevel}</div>
          <div class="cost">Cost: <span>${formatCost(upgrade, level)}</span> ${formatCurrencyLabel(upgrade.currency)}</div>
          <div class="meta">${statusLabel}</div>
        `;
      if (level >= upgrade.maxLevel) {
        nodeEl.classList.add('purchased');
      } else if (!lockedByReq && previousMet && affordable) {
        nodeEl.classList.add('available');
      }
      if (lockedByReq || !previousMet) {
        nodeEl.classList.add('locked');
      } else if (!affordable) {
        nodeEl.classList.add('unaffordable');
      }
      nodeEl.addEventListener('click', (event) => {
        showSkillDetail(nodeEl, upgrade);
        attemptPurchase(upgrade, nodeEl);
        event.stopPropagation();
      });
      nodeEl.addEventListener('mousemove', (event) => showUpgradeTooltip(event, upgrade));
      nodeEl.addEventListener('mouseleave', () => {
        hideTooltip();
        hideSkillDetail();
      });
      nodeEl.addEventListener('mouseenter', () => showSkillDetail(nodeEl, upgrade));
      track.appendChild(nodeEl);
      elementMap.set(upgrade.id, nodeEl);
    });
    track.appendChild(connectorLayer);
    requestAnimationFrame(() => drawSkillConnections(connectorLayer, elementMap));
    branchEl.appendChild(title);
    branchEl.appendChild(track);
    fragment.appendChild(branchEl);
  });

  UI.skillTree.appendChild(fragment);
  const totalPurchased = Object.keys(state.upgrades).length;
  if (UI.upgradeCount) {
    UI.upgradeCount.textContent = `${totalPurchased}`;
  }
  if (UI.upgradeTotal) {
    UI.upgradeTotal.textContent = upgrades.length;
  }
}

function refreshVisibleUpgradeStates() {
  if (!UI.skillTree) return;
  const skillNodes = UI.skillTree.querySelectorAll('.skill-node[data-id]');
  if (!skillNodes.length) return;
  skillNodes.forEach((nodeEl) => {
    const upgradeId = nodeEl.dataset.id;
    const upgrade = upgradeLookup.get(upgradeId);
    if (!upgrade) return;
    const level = state.upgrades[upgrade.id] || 0;
    const cost = getUpgradeCost(upgrade, level);
    const lockedByReq = !meetsRequirements(upgrade);
    const previousMet = !upgrade.previousId || (state.upgrades[upgrade.previousId] || 0) > 0;
    const affordable = level < upgrade.maxLevel && state[upgrade.currency] >= cost;
    const statusLabel =
      level >= upgrade.maxLevel
        ? 'Fully synced'
        : lockedByReq || !previousMet
        ? getUpgradeLockLabel(upgrade)
        : getUpgradeAffordabilityLabel(upgrade, cost);
    const displayName = getUpgradeDisplayName(upgrade, level);

    const titleEl = nodeEl.querySelector('.title');
    const levelEl = nodeEl.querySelector('.level');
    const costEl = nodeEl.querySelector('.cost');
    const costValueEl = nodeEl.querySelector('.cost span');
    const metaEl = nodeEl.querySelector('.meta');

    if (titleEl) titleEl.textContent = displayName;
    if (levelEl) levelEl.textContent = `Level ${level} / ${upgrade.maxLevel}`;
    if (costValueEl) costValueEl.textContent = formatCost(upgrade, level);
    if (costEl) {
      costEl.innerHTML = `Cost: <span>${formatCost(upgrade, level)}</span> ${formatCurrencyLabel(upgrade.currency)}`;
    }
    if (metaEl) metaEl.textContent = statusLabel;

    nodeEl.classList.toggle('purchased', level >= upgrade.maxLevel);
    nodeEl.classList.toggle('available', level < upgrade.maxLevel && !lockedByReq && previousMet && affordable);
    nodeEl.classList.toggle('locked', level < upgrade.maxLevel && (lockedByReq || !previousMet));
    nodeEl.classList.toggle('unaffordable', level < upgrade.maxLevel && !lockedByReq && previousMet && !affordable);
  });
  refreshVisibleSkillDetail();
}

function refreshVisibleSkillDetail() {
  if (!UI.skillDetailPopup || UI.skillDetailPopup.classList.contains('hidden')) return;
  const upgradeId = UI.skillDetailPopup.dataset.upgradeId;
  const sourceId = UI.skillDetailPopup.dataset.sourceId;
  if (!upgradeId || !sourceId) return;
  const sourceEl = UI.skillTree?.querySelector(`.skill-node[data-id="${sourceId}"]`);
  const upgrade = upgradeLookup.get(upgradeId);
  if (!sourceEl || !upgrade) {
    hideSkillDetail();
    return;
  }
  showSkillDetail(sourceEl, upgrade);
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

function getUpgradeCost(upgrade, level) {
  if (!upgrade || level >= upgrade.maxLevel) {
    return 0;
  }
  const startingCost = getUpgradeStartingCost(upgrade);
  return Math.ceil(startingCost * UPGRADE_LEVEL_GROWTH ** level);
}

function getUpgradeStartingCost(upgrade) {
  if (!upgrade) return 0;
  const previous = upgrade.previousId ? upgradeLookup.get(upgrade.previousId) : null;
  if (!previous) {
    return upgrade.costBase;
  }
  const previousFinalLevel = Math.max(0, (previous.maxLevel || 1) - 1);
  const previousCost = getUpgradeCost(previous, previousFinalLevel);
  return Math.ceil(previousCost * UPGRADE_TIER_GROWTH);
}

function formatCost(upgrade, level) {
  if (level >= upgrade.maxLevel) {
    return 'max';
  }
  const cost = getUpgradeCost(upgrade, level);
  return cost.toLocaleString();
}

function formatCurrencyLabel(currency) {
  switch (currency) {
    case 'bits':
      return 'Bits';
    case 'prestige':
      return 'Prestige';
    case 'cryptcoins':
      return 'CC';
    case 'lp':
      return 'LP';
    default:
      return currency ? `${currency.charAt(0).toUpperCase()}${currency.slice(1)}` : '';
  }
}

function getUpgradeLockLabel(upgrade) {
  if (!upgrade) return 'Locked';
  if (upgrade.previousId && (state.upgrades[upgrade.previousId] || 0) <= 0) {
    const previous = upgradeLookup.get(upgrade.previousId);
    const previousLevel = previous ? state.upgrades[previous.id] || 0 : 0;
    return previous ? `Requires ${getUpgradeDisplayName(previous, previousLevel)}` : 'Requires previous node';
  }
  if (upgrade.requirements?.prestige && state.prestige < upgrade.requirements.prestige) {
    return `Requires ${formatNumberShort(upgrade.requirements.prestige)} Prestige`;
  }
  if (upgrade.requirements?.lp && state.lp < upgrade.requirements.lp) {
    return `Requires ${formatNumberShort(upgrade.requirements.lp)} LP`;
  }
  return 'Locked';
}

function getUpgradeAffordabilityLabel(upgrade, cost) {
  if (!upgrade) return '';
  const resource = Math.max(0, Number(state[upgrade.currency]) || 0);
  const shortfall = Math.max(0, cost - resource);
  if (shortfall <= 0) {
    return 'Ready to purchase';
  }
  return `Need ${formatNumberShort(shortfall)} more ${formatCurrencyLabel(upgrade.currency)}`;
}

function attemptPurchase(upgrade, sourceEl = null) {
  const level = state.upgrades[upgrade.id] || 0;
  if (level >= upgrade.maxLevel) {
    return;
  }
  if (upgrade.previousId && (state.upgrades[upgrade.previousId] || 0) <= 0) {
    if (sourceEl) {
      createFloatText(sourceEl, getUpgradeLockLabel(upgrade), '#ff6ea8', { variant: 'requirement', priority: 'high' });
    }
    return;
  }
  if (!meetsRequirements(upgrade)) {
    if (sourceEl) {
      createFloatText(sourceEl, getUpgradeLockLabel(upgrade), '#ff6ea8', { variant: 'requirement', priority: 'high' });
    }
    return;
  }
  const cost = getUpgradeCost(upgrade, level);
  if (state[upgrade.currency] < cost) {
    if (sourceEl) {
      createFloatText(sourceEl, getUpgradeAffordabilityLabel(upgrade, cost), '#ff6ea8', { variant: 'requirement', priority: 'high' });
    }
    return;
  }
  state[upgrade.currency] -= cost;
  state.upgrades[upgrade.id] = level + 1;
  updateStats();
  updateResources();
  const activeFilter =
    document.querySelector('.filter.active')?.dataset.filter || state.selectedUpgradeFilter || 'damage';
  renderUpgrades(activeFilter);
  renderMilestones();
  handleTutorialUpgradePurchase(upgrade);
  maybeStartSkillCheck(upgrade, cost, level);
  queueSave();
}

function maybeStartSkillCheck(upgrade, cost, previousLevel) {
  if (skillCheckState.active) return;
  const forcingTutorialCheck = tutorialState.active && tutorialState.awaitingUpgrade && !tutorialState.skillCheckComplete;
  const baseChance = 0.18;
  if (!forcingTutorialCheck && Math.random() > baseChance) {
    return;
  }
  const preview = getSkillCheckPreview(upgrade, cost, previousLevel);
  const difficulty = forcingTutorialCheck ? 'easy' : preview.difficulty;
  const { rewardBits, rewardXP, penalty } = preview;
  startSkillCheck({
    upgrade,
    difficulty,
    summary: preview,
    reward: () => {
      state.bits += rewardBits;
      gainXP(rewardXP);
      createFloatText(UI.customCursor || document.body, `+${rewardBits} bits`, '#ffd166', { variant: 'currency' });
      updateResources();
    },
    onFail: () => {
      state[upgrade.currency] -= penalty;
      state.upgrades[upgrade.id] = previousLevel;
      updateStats();
      updateResources();
      const activeFilter =
        document.querySelector('.filter.active')?.dataset.filter || state.selectedUpgradeFilter || 'damage';
      renderUpgrades(activeFilter);
      renderMilestones();
      createFloatText(UI.customCursor || document.body, `-${cost + penalty} ${upgrade.currency}`, '#ff6ea8', { variant: 'requirement' });
      queueSave();
    },
  });
  if (forcingTutorialCheck) {
    tutorialState.awaitingSkillCheck = true;
    tutorialState.awaitingUpgrade = false;
  }
}

function showUpgradeTooltip(event, upgrade) {
  if (!tooltipEl) return;
  const level = state.upgrades[upgrade.id] || 0;
  const nextCost = level < upgrade.maxLevel ? getUpgradeCost(upgrade, level) : null;
  const displayName = getUpgradeDisplayName(upgrade, level);
  tooltipEl.innerHTML = `
    <strong>${displayName}</strong><br/>
    ${upgrade.description}<br/>
    Level: ${level} / ${upgrade.maxLevel}<br/>
    ${nextCost ? `Next cost: ${nextCost.toLocaleString()} ${upgrade.currency}` : 'Fully upgraded'}
  `;
  tooltipEl.style.display = 'block';
  const offset = 12;
  const { clientX, clientY } = event;
  window.requestAnimationFrame(() => {
    const { width, height } = tooltipEl.getBoundingClientRect();
    const maxLeft = window.innerWidth - width - offset;
    const maxTop = window.innerHeight - height - offset;
    const left = Math.min(clientX + offset, Math.max(offset, maxLeft));
    const top = Math.min(clientY + offset, Math.max(offset, maxTop));
    tooltipEl.style.left = `${left}px`;
    tooltipEl.style.top = `${top}px`;
  });
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
  milestones = [];
  const addMilestone = (config) => {
    milestones.push({
      claimed: false,
      description: '',
      ...config,
      id: config.id || `${config.type}-${config.goal}`,
    });
  };

  const nodeTracks = [
    {
      type: 'red',
      label: 'Red Circuit',
      goals: [25, 150, 600, 1800, 10000, 60000, 250000, 1000000],
      rewards: [
        () => grantBits(80),
        () => grantBits(420),
        () => grantBits(1800),
        () => grantBits(6200),
        () => grantBits(28000),
        () => grantBits(130000),
        () => {
          grantBits(520000);
          grantPrestige(35);
        },
        () => {
          grantBits(2500000);
          grantPrestige(120);
        },
      ],
    },
    {
      type: 'blue',
      label: 'Blue Circuit',
      goals: [25, 150, 500, 1500, 8000, 50000, 220000, 750000],
      rewards: [
        () => grantBits(120),
        () => grantBits(520),
        () => grantBits(2400),
        () => grantBits(8200),
        () => grantBits(36000),
        () => grantBits(155000),
        () => {
          grantBits(640000);
          grantPrestige(40);
        },
        () => {
          grantBits(3100000);
          grantPrestige(160);
        },
      ],
    },
    {
      type: 'green',
      label: 'Emerald Circuit',
      goals: [20, 140, 480, 1500, 9000, 60000, 260000, 900000],
      rewards: [
        () => {
          grantBits(200);
          grantCryptcoins(8);
        },
        () => {
          grantBits(880);
          grantCryptcoins(18);
        },
        () => {
          grantBits(3200);
          grantCryptcoins(60);
        },
        () => {
          grantBits(11000);
          grantCryptcoins(180);
        },
        () => {
          grantBits(52000);
          grantCryptcoins(620);
        },
        () => {
          grantBits(210000);
          grantCryptcoins(2200);
        },
        () => {
          grantBits(860000);
          grantCryptcoins(6200);
        },
        () => {
          grantBits(3800000);
          grantCryptcoins(16000);
        },
      ],
    },
    {
      type: 'gold',
      label: 'Golden Circuit',
      goals: [10, 50, 150, 400, 2000, 8000, 25000, 100000],
      rewards: [
        () => {
          grantBits(4000);
          grantCryptcoins(25);
        },
        () => {
          grantBits(18000);
          grantCryptcoins(120);
        },
        () => {
          grantBits(75000);
          grantCryptcoins(420);
        },
        () => {
          grantBits(220000);
          grantCryptcoins(1400);
        },
        () => {
          grantBits(620000);
          grantCryptcoins(3600);
        },
        () => {
          grantBits(1800000);
          grantCryptcoins(9600);
        },
        () => {
          grantBits(5200000);
          grantCryptcoins(18000);
        },
      ],
    },
  ];

  nodeTracks.forEach((track) => {
    track.goals.forEach((goal, index) => {
      addMilestone({
        type: track.type,
        goal,
        label: `${track.label} ${index + 1}`,
        reward: track.rewards[index],
        description: `Destroy ${goal.toLocaleString()} ${track.type} nodes.`,
      });
    });
  });

  const bossMilestones = [
    { goal: 1, reward: () => grantPrestige(1) },
    { goal: 5, reward: () => grantPrestige(6) },
    {
      goal: 15,
      reward: () => {
        grantPrestige(20);
        grantBits(6000);
      },
    },
    {
      goal: 40,
      reward: () => {
        grantPrestige(60);
        grantBits(20000);
      },
    },
    {
      goal: 75,
      reward: () => {
        grantPrestige(140);
        grantBits(120000);
      },
    },
    {
      goal: 140,
      reward: () => {
        grantPrestige(260);
        grantBits(240000);
      },
    },
    {
      goal: 250,
      reward: () => {
        grantPrestige(480);
        grantBits(520000);
      },
    },
    {
      goal: 500,
      reward: () => {
        grantPrestige(1200);
        grantBits(1500000);
      },
    },
  ];

  bossMilestones.forEach((entry, index) => {
    addMilestone({
      type: 'boss',
      goal: entry.goal,
      reward: entry.reward,
      label: `Boss Hunter ${index + 1}`,
      description: `Neutralise ${entry.goal.toLocaleString()} bosses.`,
    });
  });

  const upgradeMilestones = [
    { goal: 15, reward: () => grantBits(300) },
    { goal: 60, reward: () => grantBits(2000) },
    {
      goal: 140,
      reward: () => {
        grantBits(4500);
        grantPrestige(4);
      },
    },
    {
      goal: 280,
      reward: () => {
        grantBits(12000);
        grantPrestige(12);
      },
    },
    {
      goal: upgrades.length,
      reward: () => {
        grantBits(62000);
        grantPrestige(24);
      },
      label: 'Total Synchronisation',
      description: 'Purchase every available upgrade at least once.',
    },
  ];

  upgradeMilestones.forEach((entry, index) => {
    addMilestone({
      type: 'upgrades',
      goal: entry.goal,
      reward: entry.reward,
      stat: () => Object.keys(state.upgrades).length,
      label: `Upgrade Architect ${index + 1}`,
      description: `Purchase ${entry.goal.toLocaleString()} upgrades.`,
    });
  });

  const playtimeMilestones = [
    { goal: 600, reward: () => grantBits(1500) },
    {
      goal: 3600,
      reward: () => {
        grantBits(6000);
        grantPrestige(3);
      },
    },
    {
      goal: 10800,
      reward: () => {
        grantBits(16000);
        grantPrestige(10);
      },
    },
    {
      goal: 86400,
      reward: () => {
        grantBits(52000);
        grantPrestige(30);
      },
    },
    {
      goal: 259200,
      reward: () => {
        grantBits(180000);
        grantPrestige(90);
      },
    },
    {
      goal: 604800,
      reward: () => {
        grantBits(480000);
        grantPrestige(220);
      },
    },
    {
      goal: 1800000,
      reward: () => {
        grantBits(1500000);
        grantPrestige(600);
      },
    },
    {
      goal: 3600000,
      reward: () => {
        grantBits(3600000);
        grantPrestige(1500);
      },
    },
  ];

  playtimeMilestones.forEach((entry, index) => {
    addMilestone({
      type: 'playtime',
      goal: entry.goal,
      reward: entry.reward,
      stat: () => state.playtime,
      label: `Time Dilation ${index + 1}`,
      description: `Spend ${formatDurationShort(entry.goal)} inside the simulator.`,
    });
  });
}

function renderMilestones() {
  const containers = [];
  if (UI.milestoneList) {
    containers.push({ el: UI.milestoneList, variant: 'list' });
  }
  if (UI.milestoneDock) {
    containers.push({ el: UI.milestoneDock, variant: 'dock' });
  }
  if (containers.length === 0) {
    updateProgressIndicators();
    return;
  }
  containers.forEach(({ el }) => {
    el.innerHTML = '';
  });
  milestones.forEach((milestone) => {
    const progress = getMilestoneProgress(milestone);
    containers.forEach(({ el, variant }) => {
      el.appendChild(buildMilestoneElement(milestone, progress, variant));
    });
  });
  updateProgressIndicators();
}

function buildMilestoneElement(milestone, progress, variant) {
  const claimButton = document.createElement('button');
  claimButton.type = 'button';
  claimButton.className = 'pill';
  claimButton.textContent = progress.claimed ? 'claimed' : progress.ready ? 'claim' : 'locked';
  claimButton.disabled = progress.claimed || !progress.ready;
  claimButton.addEventListener('click', () => claimMilestoneReward(milestone));

  if (variant === 'dock') {
    const card = document.createElement('div');
    card.className = 'progress-card milestone-card';
    card.setAttribute('role', 'listitem');
    if (progress.claimed) {
      card.classList.add('claimed');
    } else if (progress.ready) {
      card.classList.add('ready');
    }
    const statusClass = progress.claimed ? 'status claimed' : progress.ready ? 'status ready' : 'status';
    const percent = Math.min(100, (progress.current / progress.goal) * 100);
    const progressText = `${formatMilestoneValue(milestone, progress.current)} / ${formatMilestoneValue(milestone, milestone.goal)}`;
    card.innerHTML = `
      <div class="card-kicker">Milestone</div>
      <div class="card-header">
        <strong>${milestone.label}</strong>
        <span class="${statusClass}">${progress.claimed ? 'Claimed' : progress.ready ? 'Reward ready' : 'In progress'}</span>
      </div>
      <div class="card-body">${describeMilestone(milestone)}</div>
      <div class="reward-line">Reward milestone ready for claim</div>
      <div class="progress-track"><div class="fill" style="width: ${percent}%"></div></div>
      <div class="card-metrics">${progressText}</div>
    `;
    card.appendChild(claimButton);
    return card;
  }

  const node = document.createElement('div');
  node.className = 'milestone';
  node.setAttribute('role', 'listitem');
  const info = document.createElement('div');
  const progressText = `${formatMilestoneValue(milestone, progress.current)} / ${formatMilestoneValue(
    milestone,
    milestone.goal,
  )}`;
  info.innerHTML = `<strong>${milestone.label}</strong><br/>Progress: ${progressText}`;
  const reward = document.createElement('div');
  reward.className = 'progress';
  reward.textContent = progress.claimed ? 'claimed' : progress.ready ? 'reward ready' : 'keep going';
  node.append(info, reward, claimButton);
  return node;
}

function claimMilestoneReward(milestone) {
  const current = getMilestoneProgress(milestone);
  if (current.claimed || !current.ready) {
    return;
  }
  if (typeof milestone.reward === 'function') {
    milestone.reward();
  }
  milestone.claimed = true;
  state.milestoneClaims[milestone.id] = true;
  updateStats();
  updateResources();
  renderMilestones();
  queueSave();
}

function getMilestoneProgress(milestone) {
  const baseCurrent =
    typeof milestone.stat === 'function'
      ? Number(milestone.stat()) || 0
      : milestone.type === 'boss'
      ? state.bossKills
      : state.nodesDestroyed[milestone.type] || 0;
  const current = Math.max(0, baseCurrent);
  const ready = current >= milestone.goal;
  const claimed = Boolean(state.milestoneClaims[milestone.id]);
  milestone.claimed = claimed;
  return {
    current,
    ready,
    claimed,
    goal: milestone.goal,
  };
}

function describeMilestone(milestone) {
  if (milestone.description) {
    return milestone.description;
  }
  switch (milestone.type) {
    case 'red':
      return `Destroy ${milestone.goal.toLocaleString()} red nodes.`;
    case 'blue':
      return `Destroy ${milestone.goal.toLocaleString()} blue nodes.`;
    case 'green':
      return `Destroy ${milestone.goal.toLocaleString()} green nodes.`;
    case 'gold':
      return `Destroy ${milestone.goal.toLocaleString()} gold nodes.`;
    case 'boss':
      return `Neutralise ${milestone.goal.toLocaleString()} bosses.`;
    case 'upgrades':
      return `Purchase ${milestone.goal.toLocaleString()} upgrades.`;
    case 'playtime':
      return `Spend ${formatDurationShort(milestone.goal)} inside the simulator.`;
    default:
      return `Pursue ${milestone.goal.toLocaleString()} objectives.`;
  }
}

const NUMBER_SUFFIXES = [
  '',
  'K',
  'Mil',
  'Bil',
  'Tri',
  'Qua',
  'Qui',
  'Sex',
  'Sep',
  'Oct',
  'Non',
  'Dec',
];

function formatNumberShort(value) {
  const numeric = Number(value) || 0;
  const absValue = Math.abs(numeric);
  if (absValue < 1) {
    return numeric.toFixed(3).replace(/\.0+$/u, '').replace(/\.$/u, '');
  }
  let tier = 0;
  let scaled = numeric;
  while (Math.abs(scaled) >= 1000 && tier < NUMBER_SUFFIXES.length - 1) {
    scaled /= 1000;
    tier += 1;
  }
  const precision = Math.abs(scaled) >= 100 ? 0 : Math.abs(scaled) >= 10 ? 1 : 2;
  const fixed = scaled.toFixed(precision);
  const formatted = fixed.replace(/(\.\d*?[1-9])0+$|\.0+$/u, '$1').replace(/\.$/u, '');
  if (tier === 0) {
    return formatted;
  }
  return `${formatted} ${NUMBER_SUFFIXES[tier]}`;
}

function formatMilestoneValue(milestone, value) {
  if (milestone.type === 'playtime') {
    return formatDurationShort(value);
  }
  return formatNumberShort(Math.max(0, value));
}

function formatDurationShort(seconds) {
  const totalSeconds = Math.max(0, Math.floor(Number(seconds) || 0));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (hours > 0) {
    return `${hours}h`;
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
}

function formatClockShort(seconds) {
  const totalSeconds = Math.max(0, Math.ceil(Number(seconds) || 0));
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const secs = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, '0');
  return `${minutes}:${secs}`;
}

function getClaimableAchievementCount() {
  return achievements.reduce((count, achievement) => {
    const progress = getAchievementProgress(achievement);
    return count + (progress.achieved && !progress.claimed ? 1 : 0);
  }, 0);
}

function getClaimableMilestoneCount() {
  return milestones.reduce((count, milestone) => {
    const progress = getMilestoneProgress(milestone);
    return count + (progress.ready && !progress.claimed ? 1 : 0);
  }, 0);
}

function claimAllRewards() {
  let claimedAny = false;
  achievements.forEach((achievement) => {
    const progress = getAchievementProgress(achievement);
    if (progress.achieved && !progress.claimed) {
      applyAchievementReward(achievement.reward);
      state.achievementClaims[achievement.id] = true;
      claimedAny = true;
    }
  });
  milestones.forEach((milestone) => {
    const progress = getMilestoneProgress(milestone);
    if (progress.ready && !progress.claimed) {
      milestone.reward();
      state.milestoneClaims[milestone.id] = true;
      claimedAny = true;
    }
  });
  if (claimedAny) {
    renderAchievements();
    renderMilestones();
    updateResources();
    queueSave();
  }
}

function toggleNotificationDot(dotEl, isActive) {
  if (!dotEl) return;
  dotEl.classList.toggle('active', isActive);
  dotEl.setAttribute('aria-hidden', isActive ? 'false' : 'true');
}

function updateProgressIndicators() {
  const claimableAchievements = getClaimableAchievementCount();
  const claimableMilestones = getClaimableMilestoneCount();
  toggleNotificationDot(UI.achievementDot, claimableAchievements > 0);
  toggleNotificationDot(UI.milestoneDot, claimableMilestones > 0);
  const totalClaimable = claimableAchievements + claimableMilestones;
  if (UI.claimAllButton) {
    UI.claimAllButton.classList.toggle('visible', totalClaimable > 0);
  }
}

const ACHIEVEMENT_DIFFICULTY_WEIGHTS = {
  trivial: 1,
  standard: 1.6,
  hard: 2.4,
  legendary: 3.2,
};

function createAchievement(config) {
  const achievement = {
    difficulty: 'standard',
    category: 'general',
    ...config,
  };
  achievement.reward = buildAchievementReward(achievement);
  return achievement;
}

function buildAchievementReward(achievement) {
  const difficultyWeight = ACHIEVEMENT_DIFFICULTY_WEIGHTS[achievement.difficulty] || 1;
  const goalValue = Math.max(1, Number(achievement.goal) || 1);
  const progressScale = Math.max(1, Math.log10(goalValue + 3));
  const bits = Math.round(120 * progressScale * difficultyWeight);
  const xp = Math.round(35 * progressScale * difficultyWeight);
  const prestige =
    goalValue >= 10 || difficultyWeight > 1.5
      ? Math.max(1, Math.round(progressScale * (difficultyWeight - 0.4)))
      : 0;
  const cryptcoins =
    achievement.category === 'crypto'
      ? Math.max(1, Math.round(progressScale * 2.5 * difficultyWeight))
      : 0;
  return { bits, xp, prestige, cryptcoins };
}

function describeAchievementReward(reward) {
  if (!reward || typeof reward !== 'object') return 'No reward';
  const parts = [];
  if (reward.bits) parts.push(`${Math.round(reward.bits).toLocaleString()} bits`);
  if (reward.xp) parts.push(`${Math.round(reward.xp).toLocaleString()} XP`);
  if (reward.cryptcoins) parts.push(`${Math.round(reward.cryptcoins).toLocaleString()} cryptcoins`);
  if (reward.prestige) parts.push(`${Math.round(reward.prestige).toLocaleString()} prestige`);
  return parts.length > 0 ? parts.join(' · ') : 'No reward';
}

function getAchievementProgress(achievement) {
  const current = Math.max(0, Number(achievement.stat()) || 0);
  const goalValue = Math.max(1, achievement.goal);
  const percent = Math.min(100, (current / goalValue) * 100);
  const achieved = current >= goalValue;
  const claimed = Boolean(state.achievementClaims[achievement.id]);
  const recordedAt = Number(state.achievementLog[achievement.id]);
  if (achieved && !recordedAt) {
    state.achievementLog[achievement.id] = Date.now();
    queueSave(2000);
  }
  return { current, goal: goalValue, percent, achieved, claimed };
}

function applyAchievementReward(reward) {
  if (!reward || typeof reward !== 'object') return;
  const bits = Math.max(0, Math.round(Number(reward.bits) || 0));
  const xp = Math.max(0, Math.round(Number(reward.xp) || 0));
  const prestige = Math.max(0, Math.round(Number(reward.prestige) || 0));
  const cryptcoins = Math.max(0, Math.round(Number(reward.cryptcoins) || 0));
  if (bits > 0) {
    state.bits += bits;
  }
  if (xp > 0) {
    gainXP(xp);
  }
  if (prestige > 0) {
    state.prestige += prestige;
  }
  if (cryptcoins > 0) {
    state.cryptcoins += cryptcoins;
  }
}

function claimAchievementReward(achievement) {
  const progress = getAchievementProgress(achievement);
  if (!progress.achieved || progress.claimed) {
    return;
  }
  applyAchievementReward(achievement.reward);
  state.achievementClaims[achievement.id] = true;
  renderAchievements();
  updateResources();
  queueSave();
}

function generateAchievements() {
  achievements = [
    createAchievement({
      id: 'first-node',
      label: 'First Breach',
      description: 'Destroy your first node.',
      goal: 1,
      difficulty: 'trivial',
      stat: () => totalNodesDestroyed(),
    }),
    createAchievement({
      id: 'hundred-nodes',
      label: 'Node Recycler',
      description: 'Destroy 100 nodes.',
      goal: 100,
      difficulty: 'standard',
      stat: () => totalNodesDestroyed(),
    }),
    createAchievement({
      id: 'level-5',
      label: 'Escalation',
      description: 'Reach Rank 5.',
      goal: 5,
      difficulty: 'standard',
      stat: () => state.level,
    }),
    createAchievement({
      id: 'level-15',
      label: 'Unending Ascent',
      description: 'Reach Rank 15.',
      goal: 15,
      difficulty: 'hard',
      stat: () => state.level,
    }),
    createAchievement({
      id: 'palette-swaps',
      label: 'Palette Switcher',
      description: 'Swap your palette three times.',
      goal: 3,
      difficulty: 'trivial',
      stat: () => state.paletteChangeCount || 0,
    }),
    createAchievement({
      id: 'palette-swaps-10',
      label: 'Palette Veteran',
      description: 'Swap your palette ten times.',
      goal: 10,
      difficulty: 'trivial',
      stat: () => state.paletteChangeCount || 0,
    }),
    createAchievement({
      id: 'prestige-10',
      label: 'Prestige Initiate',
      description: 'Earn 10 prestige.',
      goal: 10,
      difficulty: 'hard',
      category: 'prestige',
      stat: () => state.prestige,
    }),
    createAchievement({
      id: 'upgrade-50',
      label: 'Tinkerer',
      description: 'Purchase 50 upgrades.',
      goal: 50,
      difficulty: 'standard',
      stat: () => Object.keys(state.upgrades).length,
    }),
    createAchievement({
      id: 'upgrade-200',
      label: 'Tree Diver',
      description: 'Purchase 200 upgrades.',
      goal: 200,
      difficulty: 'hard',
      stat: () => Object.keys(state.upgrades).length,
    }),
    createAchievement({
      id: 'lab-unlock',
      label: 'Researcher',
      description: 'Assemble the lab.',
      goal: 1,
      difficulty: 'hard',
      stat: () => (state.labUnlocked ? 1 : 0),
    }),
    createAchievement({
      id: 'crypto-hoard',
      label: 'Miner 49k',
      description: 'Accumulate 50k CC.',
      goal: 50000,
      difficulty: 'legendary',
      category: 'crypto',
      stat: () => state.cryptcoins,
    }),
    createAchievement({
      id: 'boss-hunter',
      label: 'Boss Circuit',
      description: 'Neutralise 3 bosses.',
      goal: 3,
      difficulty: 'standard',
      category: 'boss',
      stat: () => state.bossKills,
    }),
    createAchievement({
      id: 'executioner',
      label: 'Executioner',
      description: 'Neutralise 20 bosses.',
      goal: 20,
      difficulty: 'legendary',
      category: 'boss',
      stat: () => state.bossKills,
    }),
    createAchievement({
      id: 'bit-avalanche',
      label: 'Bit Avalanche',
      description: 'Hold 250,000 bits at once.',
      goal: 250000,
      difficulty: 'hard',
      category: 'economy',
      stat: () => state.bits,
    }),
    createAchievement({
      id: 'bit-supermassive',
      label: 'Supermassive Cache',
      description: 'Hold 1,000,000,000 bits at once.',
      goal: 1_000_000_000,
      difficulty: 'legendary',
      category: 'economy',
      stat: () => state.bits,
    }),
    createAchievement({
      id: 'bit-singularity',
      label: 'Bit Singularity',
      description: 'Hold 1,000,000,000,000,000 bits at once.',
      goal: 1_000_000_000_000_000,
      difficulty: 'legendary',
      category: 'economy',
      stat: () => state.bits,
    }),
    createAchievement({
      id: 'bit-omniloop',
      label: 'Omniloop Overflow',
      description: 'Hold 100,000,000,000,000,000 bits at once.',
      goal: 100_000_000_000_000_000,
      difficulty: 'legendary',
      category: 'economy',
      stat: () => state.bits,
    }),
    createAchievement({
      id: 'level-1000',
      label: 'Layered Reality',
      description: 'Reach Rank 1,000.',
      goal: 1000,
      difficulty: 'hard',
      stat: () => state.level,
    }),
    createAchievement({
      id: 'level-10000',
      label: 'Ten-Thousandth Gate',
      description: 'Reach Rank 10,000.',
      goal: 10000,
      difficulty: 'legendary',
      stat: () => state.level,
    }),
    createAchievement({
      id: 'level-50000',
      label: 'Ascension Stack',
      description: 'Reach Rank 50,000.',
      goal: 50000,
      difficulty: 'legendary',
      stat: () => state.level,
    }),
    createAchievement({
      id: 'level-200000',
      label: 'Beyond Simulation',
      description: 'Reach Rank 200,000.',
      goal: 200000,
      difficulty: 'legendary',
      stat: () => state.level,
    }),
    createAchievement({
      id: 'prestige-500',
      label: 'Prestige Wave',
      description: 'Earn 500 prestige.',
      goal: 500,
      difficulty: 'hard',
      category: 'prestige',
      stat: () => state.prestige,
    }),
    createAchievement({
      id: 'prestige-5000',
      label: 'Prestige Torrent',
      description: 'Earn 5,000 prestige.',
      goal: 5000,
      difficulty: 'legendary',
      category: 'prestige',
      stat: () => state.prestige,
    }),
    createAchievement({
      id: 'prestige-25000',
      label: 'Prestige Maelstrom',
      description: 'Earn 25,000 prestige.',
      goal: 25000,
      difficulty: 'legendary',
      category: 'prestige',
      stat: () => state.prestige,
    }),
    createAchievement({
      id: 'prestige-90000',
      label: 'Prestige Apex',
      description: 'Earn 90,000 prestige.',
      goal: 90000,
      difficulty: 'legendary',
      category: 'prestige',
      stat: () => state.prestige,
    }),
    createAchievement({
      id: 'crypto-elite',
      label: 'Crypt Billionaire',
      description: 'Accumulate 10,000,000 CC.',
      goal: 10_000_000,
      difficulty: 'legendary',
      category: 'crypto',
      stat: () => state.cryptcoins,
    }),
  ];
}

function renderAchievements() {
  if (!UI.achievementGrid) return;
  UI.achievementGrid.innerHTML = '';
  achievements.forEach((achievement) => {
    const progress = getAchievementProgress(achievement);
    const difficultyLabel = `${achievement.difficulty}`.toUpperCase();
    const card = document.createElement('div');
    card.className = 'progress-card achievement';
    card.setAttribute('role', 'listitem');
    if (progress.achieved) {
      card.classList.add('completed');
      const completion = Number(state.achievementLog[achievement.id]);
      if (Number.isFinite(completion)) {
        const completedDate = new Date(completion);
        if (!Number.isNaN(completedDate.getTime())) {
          card.title = `Completed on ${completedDate.toLocaleString()}`;
        }
      }
    }
    if (progress.achieved && !progress.claimed) {
      card.classList.add('ready');
    }
    if (progress.claimed) {
      card.classList.add('claimed');
    }
    const statusClass = progress.claimed ? 'status claimed' : progress.achieved ? 'status ready' : 'status';
    const statusText = progress.claimed
      ? 'Claimed'
      : progress.achieved
      ? 'Reward ready'
      : `${Math.floor(progress.percent)}%`;
    card.innerHTML = `
      <div class="card-kicker">${difficultyLabel} Achievement</div>
      <div class="card-header">
        <strong>${achievement.label}</strong>
        <span class="${statusClass}">${statusText}</span>
      </div>
      <div class="card-body">${achievement.description}</div>
      <div class="reward-line">Reward: ${describeAchievementReward(achievement.reward)}</div>
      <div class="progress-track"><div class="fill" style="width: ${progress.percent}%"></div></div>
      <div class="card-metrics">${formatNumberShort(Math.min(progress.current, achievement.goal))} / ${formatNumberShort(
    achievement.goal,
  )}</div>
    `;
    const claimButton = document.createElement('button');
    claimButton.type = 'button';
    claimButton.className = 'pill';
    claimButton.textContent = progress.claimed ? 'claimed' : progress.achieved ? 'claim' : 'locked';
    claimButton.disabled = progress.claimed || !progress.achieved;
    claimButton.addEventListener('click', () => claimAchievementReward(achievement));
    card.appendChild(claimButton);
    UI.achievementGrid.appendChild(card);
  });
  updateProgressIndicators();
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
  UI.withdrawCrypto?.addEventListener('click', () => settleCryptoRun({ early: true }));
  renderCryptoSpeedUpgrades();
}

function depositToCrypto(amount) {
  if (!state.cryptoUnlocked) return;
  if (state.bits >= amount) {
    state.bits -= amount;
    state.crypto.deposit += amount;
    const duration = Math.max(10, Math.log(state.crypto.deposit + 1) * 30);
    state.crypto.duration = duration;
    state.crypto.timeRemaining = duration;
    recalculateCryptoRate();
    updateCryptoUI();
    updateResources();
    queueSave();
  }
}

function getCryptoSpeedBonus() {
  return CRYPTO_SPEED_UPGRADES.reduce(
    (total, tier) => total + (state.crypto.speedUpgrades[tier.id] ? tier.bonus : 0),
    0,
  );
}

function recalculateCryptoRate() {
  if (state.crypto.deposit <= 0) {
    state.crypto.rate = 0;
    return;
  }
  const baseRate = Math.sqrt(state.crypto.deposit) / 10;
  state.crypto.rate = baseRate + getCryptoSpeedBonus();
}

function resetCryptoRun() {
  state.crypto.deposit = 0;
  state.crypto.rate = 0;
  state.crypto.mined = 0;
  state.crypto.duration = 0;
  state.crypto.timeRemaining = 0;
}

function settleCryptoRun({ early = false } = {}) {
  const hasActiveRun = state.crypto.deposit > 0 || state.crypto.mined > 0;
  if (!hasActiveRun) return;
  const mined = Math.max(0, state.crypto.mined || 0);
  const payout = early ? Math.floor(mined * 0.7) : mined;
  if (payout > 0) {
    state.cryptcoins += payout;
    createFloatText(UI.cryptoMineVisual || UI.nodeArea || document.body, `+${formatNumberShort(payout)} CC`, '#ffd166', {
      variant: 'currency',
      priority: 'high',
    });
  }
  resetCryptoRun();
  updateCryptoUI();
  updateResources();
  queueSave();
}

function renderCryptoSpeedUpgrades() {
  if (!UI.cryptoSpeedUpgrades) return;
  UI.cryptoSpeedUpgrades.innerHTML = '';
  CRYPTO_SPEED_UPGRADES.forEach((tier) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'pill';
    const purchased = Boolean(state.crypto.speedUpgrades[tier.id]);
    const affordable = state.cryptcoins >= tier.cost;
    button.classList.toggle('unaffordable', !purchased && !affordable);
    button.disabled = purchased || !affordable;
    button.textContent = purchased
      ? `${tier.label}: +${tier.bonus}/s (owned)`
      : `${tier.label}: +${tier.bonus}/s — ${formatNumberShort(tier.cost)} CC`;
    button.addEventListener('click', () => purchaseCryptoSpeedUpgrade(tier));
    UI.cryptoSpeedUpgrades.appendChild(button);
  });
}

function purchaseCryptoSpeedUpgrade(tier) {
  if (!tier || state.crypto.speedUpgrades[tier.id]) return;
  if (state.cryptcoins < tier.cost) return;
  state.cryptcoins -= tier.cost;
  state.crypto.speedUpgrades[tier.id] = true;
  recalculateCryptoRate();
  updateCryptoUI();
  updateResources();
  renderCryptoSpeedUpgrades();
  queueSave();
}

function updateCryptoUI() {
  if (!UI.cryptoDeposited || !UI.cryptoReturns || !UI.cryptoTimer) return;
  UI.cryptoDeposited.textContent = formatNumberShort(state.crypto.deposit);
  UI.cryptoReturns.textContent = `${formatNumberShort(state.crypto.rate)} / sec`;
  UI.cryptoTimer.textContent = formatClockShort(state.crypto.timeRemaining);
  if (UI.cryptoMined) {
    UI.cryptoMined.textContent = `${formatNumberShort(state.crypto.mined || 0)} CC`;
  }
  if (UI.cryptoEarlyWithdraw) {
    UI.cryptoEarlyWithdraw.textContent = `${formatNumberShort(Math.floor((state.crypto.mined || 0) * 0.7))} CC`;
  }
  if (UI.cryptoStatus) {
    UI.cryptoStatus.textContent =
      state.crypto.deposit > 0
        ? state.crypto.timeRemaining > 0
          ? 'Mining'
          : 'Ready'
        : 'Idle';
  }
  if (UI.cryptoProgressFill) {
    const duration = Math.max(1, state.crypto.duration || 0);
    const progress =
      state.crypto.deposit > 0 && duration > 0
        ? Math.max(0, Math.min(1, 1 - state.crypto.timeRemaining / duration))
        : 0;
    UI.cryptoProgressFill.style.width = `${progress * 100}%`;
  }
  if (UI.withdrawCrypto) {
    const payout = Math.floor((state.crypto.mined || 0) * 0.7);
    UI.withdrawCrypto.textContent =
      state.crypto.deposit > 0
        ? `Withdraw early (70%) ${payout > 0 ? `- ${formatNumberShort(payout)} CC` : ''}`
        : 'Withdraw early (70%)';
    UI.withdrawCrypto.disabled = state.crypto.deposit <= 0 || payout <= 0;
  }
  UI.cryptoMineVisual?.classList.toggle('active', state.crypto.deposit > 0);
}

function setupLabControls() {
  document.getElementById('lab-confirm').addEventListener('click', () => {
    if (!state.labUnlocked) return;
    const amount = Number(document.getElementById('lab-deposit').value);
    if (Number.isFinite(amount) && amount > 0 && state.cryptcoins >= amount) {
      state.cryptcoins -= amount;
      state.labDeposited += amount;
      state.labSpeed = Math.sqrt(state.labDeposited) / 5;
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

function setupLevelSelector() {
  if (!UI.levelSelect) UI.levelSelect = document.getElementById('level-select');
  if (!UI.levelSelect) return;
  UI.levelSelect.addEventListener('change', () => {
    const desired = Number(UI.levelSelect.value);
    if (Number.isFinite(desired)) {
      jumpToLevel(desired);
    }
  });
  UI.levelDropdown = setupCustomDropdown(UI.levelSelect);
  refreshLevelOptions();
}

function refreshLevelOptions() {
  if (!UI.levelSelect) return;
  const unlockedLevel = Math.max(1, state.highestCompletedLevel + 1);
  const maxLevel = Math.max(unlockedLevel, state.currentLevel.index);
  UI.levelSelect.innerHTML = '';
  for (let i = 1; i <= maxLevel; i += 1) {
    const option = document.createElement('option');
    option.value = `${i}`;
    option.textContent = `Stage ${i}`;
    UI.levelSelect.appendChild(option);
  }
  UI.levelSelect.value = `${state.currentLevel.index}`;
  if (UI.levelDropdown?.refresh) {
    UI.levelDropdown.refresh();
  }
}

function jumpToLevel(targetLevel) {
  const maxLevel = Math.max(Math.max(1, state.highestCompletedLevel + 1), state.currentLevel.index);
  const desired = Math.max(1, Math.min(Math.floor(targetLevel), maxLevel));
  setCurrentLevel(desired);
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
    updateCursorAreaState(isNodeAreaInteractive(x, y));
    requestBitTokenSweep();
  };
  updateCursorPosition(cursorPosition.x, cursorPosition.y);
  const syncTouchPosition = (event) => {
    const touch = event.touches?.[0] || event.changedTouches?.[0];
    if (!touch) return;
    updateCursorPosition(touch.clientX, touch.clientY);
  };
  document.addEventListener('pointermove', (event) => {
    updateCursorPosition(event.clientX, event.clientY);
  });
  document.addEventListener('touchstart', syncTouchPosition, { passive: true });
  document.addEventListener('touchmove', syncTouchPosition, { passive: true });
  if (UI.nodeArea) {
    const preventNodeAreaScroll = (event) => {
      const touch = event.touches?.[0] || event.changedTouches?.[0];
      if (!touch) return;
      if (isPointerInsideNodeArea(touch.clientX, touch.clientY)) {
        event.preventDefault();
      }
      syncTouchPosition(event);
    };
    UI.nodeArea.addEventListener('touchstart', preventNodeAreaScroll, { passive: false });
    UI.nodeArea.addEventListener('touchmove', preventNodeAreaScroll, { passive: false });
  }
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
  loadSFX();
  setupButtonClickAudio();
  bgmAudio = document.getElementById('bgm');
  if (!bgmAudio) {
    audioUnlocked = true;
    return;
  }
  initBGMPlaylist();
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

function spawnCursorPulse(x, y, options = {}) {
  const pulse = document.createElement('div');
  pulse.className = 'cursor-pulse';
  if (options.hit) pulse.classList.add('hit');
  if (options.kill) pulse.classList.add('kill');
  if (options.critical) pulse.classList.add('critical');
  if (options.boss) pulse.classList.add('boss');
  pulse.style.left = `${x}px`;
  pulse.style.top = `${y}px`;
  pulse.style.imageRendering = 'pixelated';
  pulse.style.setProperty('--cursor-size', `${getCursorDisplaySize()}px`);
  document.body.appendChild(pulse);
  pulse.addEventListener('animationend', () => pulse.remove());
}

function triggerCursorClickAnimation(x, y, options = {}) {
  if (!UI.customCursor) return;
  UI.customCursor.classList.add('active');
  UI.customCursor.classList.toggle('impact', !!options.hit);
  UI.customCursor.classList.toggle('kill-shot', !!options.kill);
  UI.customCursor.classList.toggle('critical-shot', !!options.critical);
  UI.customCursor.classList.toggle('boss-target', !!options.boss);
  if (cursorClickTimeout) {
    clearTimeout(cursorClickTimeout);
  }
  cursorClickTimeout = setTimeout(() => {
    if (UI.customCursor) {
      UI.customCursor.classList.remove('active');
      UI.customCursor.classList.remove('impact', 'kill-shot', 'critical-shot', 'boss-target');
    }
  }, options.kill || options.critical || options.boss ? 180 : 140);
  spawnCursorPulse(x, y, options);
}

function setupSkillCheck() {
  if (!UI.skillCheck || !UI.skillCheckAction || !UI.skillCheckProgress || !UI.skillCheckSlider || !UI.skillCheckTarget) {
    return;
  }
  UI.skillCheckAction.addEventListener('click', attemptSkillCheckResolution);
  const handleSkillCheckKey = (event) => {
    if (!skillCheckState.active) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      attemptSkillCheckResolution();
    }
  };
  UI.skillCheckAction.addEventListener('keydown', handleSkillCheckKey);
  document.addEventListener('keydown', handleSkillCheckKey);
}

const SKILL_CHECK_VARIANT_DETAILS = {
  linear: {
    title: 'Signal Pulse',
    description: 'Time the resolve pulse when the signal crosses the highlighted zone around {target}.',
  },
  cross: {
    title: 'Axis Weave',
    description: 'Catch the sweeping horizontal beam and the climbing lift inside the same access window for {target}.',
  },
  vertical: {
    title: 'Access Elevator',
    description: 'Ride the vertical stream so the carrier slips through the access window for {target}.',
  },
};

const SKILL_CHECK_VARIANTS = ['linear', 'vertical', 'cross'];
const SKILL_CHECK_CONFETTI_COLORS = ['#8fffe0', '#6ed6ff', '#ff82be', '#ffe566'];

function getSkillCheckVariant() {
  const index = Math.floor(Math.random() * SKILL_CHECK_VARIANTS.length);
  return SKILL_CHECK_VARIANTS[index] || 'linear';
}

function getSkillCheckConfig(difficulty) {
  const settings = SKILL_CHECK_DIFFICULTIES[difficulty] || SKILL_CHECK_DIFFICULTIES.normal;
  const levelFactor = Math.max(0, state.level - 1);
  const speedMultiplier = 1 + Math.min(0.7, levelFactor * 0.012);
  const windowReduction = Math.min(0.55, levelFactor * 0.01);
  const windowSize = Math.max(settings.minWindow, settings.window * (1 - windowReduction));
  const sliderSpeed = settings.baseSpeed * speedMultiplier;
  return {
    duration: settings.duration,
    sliderSpeed,
    windowSize,
  };
}

function setSkillCheckVariant(variant) {
  skillCheckState.variant = variant;
  if (UI.skillCheck) {
    UI.skillCheck.dataset.variant = variant;
  }
  if (UI.skillCheckVariants?.forEach) {
    UI.skillCheckVariants.forEach((el) => {
      el.classList.toggle('active', el.dataset.skillVariant === variant);
    });
  }
}

function flashSkillCheckFailTint() {
  document.body.classList.add('skill-fail');
  setTimeout(() => document.body.classList.remove('skill-fail'), 500);
}

function updateSkillCheckTargets() {
  const startPercent = skillCheckState.targetStart * 100;
  const windowPercent = skillCheckState.windowSize * 100;
  const secondaryStartPercent = skillCheckState.secondaryStart * 100;
  const secondaryWindowPercent = skillCheckState.windowSize * 100;
  if (UI.skillCheckTarget) {
    UI.skillCheckTarget.style.left = `${startPercent}%`;
    UI.skillCheckTarget.style.width = `${windowPercent}%`;
  }
  if (UI.skillCheckVerticalTarget) {
    UI.skillCheckVerticalTarget.style.top = `${startPercent}%`;
    UI.skillCheckVerticalTarget.style.height = `${windowPercent}%`;
  }
  if (UI.skillCheckCrossTarget) {
    UI.skillCheckCrossTarget.style.left = `${startPercent}%`;
    UI.skillCheckCrossTarget.style.top = `${secondaryStartPercent}%`;
    UI.skillCheckCrossTarget.style.width = `${windowPercent}%`;
    UI.skillCheckCrossTarget.style.height = `${secondaryWindowPercent}%`;
  }
}

function updateSkillCheckSliderVisuals() {
  const sliderPercent = skillCheckState.sliderPosition * 100;
  if (UI.skillCheckSlider) {
    UI.skillCheckSlider.style.left = `${sliderPercent}%`;
  }
  if (UI.skillCheckCrossH) {
    UI.skillCheckCrossH.style.left = `${sliderPercent}%`;
  }
  const secondaryPercent = skillCheckState.secondaryPosition * 100;
  if (UI.skillCheckVerticalSlider) {
    UI.skillCheckVerticalSlider.style.top = `${sliderPercent}%`;
  }
  if (UI.skillCheckCrossV) {
    UI.skillCheckCrossV.style.top = `${secondaryPercent}%`;
  }
}

function refreshSkillCheckVisuals() {
  updateSkillCheckTargets();
  updateSkillCheckSliderVisuals();
  if (UI.skillCheckProgress) {
    UI.skillCheckProgress.style.width = '100%';
  }
}

function spawnSkillCheckConfetti() {
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    return;
  }
  const pieces = 20;
  for (let i = 0; i < pieces; i += 1) {
    const confetti = document.createElement('span');
    const side = i % 2 === 0 ? 'left' : 'right';
    confetti.className = `skill-check-confetti skill-check-confetti--${side}`;
    confetti.style.top = `${10 + Math.random() * 80}%`;
    confetti.style.width = `${6 + Math.random() * 6}px`;
    confetti.style.height = `${10 + Math.random() * 10}px`;
    const primary = SKILL_CHECK_CONFETTI_COLORS[Math.floor(Math.random() * SKILL_CHECK_CONFETTI_COLORS.length)];
    const accent = SKILL_CHECK_CONFETTI_COLORS[Math.floor(Math.random() * SKILL_CHECK_CONFETTI_COLORS.length)];
    confetti.style.background = `linear-gradient(135deg, ${primary}, ${accent})`;
    confetti.style.animationDuration = `${0.95 + Math.random() * 0.5}s`;
    confetti.style.animationDelay = `${Math.random() * 0.18}s`;
    confetti.style.setProperty('--confetti-spin', `${Math.random() * 300 - 150}deg`);
    document.body.appendChild(confetti);
    confetti.addEventListener('animationend', () => confetti.remove());
  }
}

function attemptSkillCheckResolution() {
  if (!skillCheckState.active) return;
  const withinPrimaryWindow =
    skillCheckState.sliderPosition >= skillCheckState.targetStart &&
    skillCheckState.sliderPosition <= skillCheckState.targetEnd;
  const withinSecondaryWindow =
    skillCheckState.variant !== 'cross' ||
    (skillCheckState.secondaryPosition >= skillCheckState.secondaryStart &&
      skillCheckState.secondaryPosition <= skillCheckState.secondaryEnd);
  resolveSkillCheck(withinPrimaryWindow && withinSecondaryWindow);
}

function startSkillCheck({ upgrade, difficulty, reward, onFail, summary }) {
  if (!UI.skillCheck || !UI.skillCheckAction || !UI.skillCheckTarget || !UI.skillCheckSlider) return;
  const config = getSkillCheckConfig(difficulty);
  const sliderPosition = Math.min(0.95, Math.max(0.05, Math.random()));
  const sliderDirection = sliderPosition > 0.5 ? -1 : 1;
  const maxTargetStart = Math.max(0, 1 - config.windowSize);
  const targetStart = maxTargetStart > 0 ? Math.random() * maxTargetStart : 0;
  const secondaryPosition = Math.min(0.95, Math.max(0.05, Math.random()));
  const secondaryDirection = secondaryPosition > 0.5 ? -1 : 1;
  const secondaryStart = maxTargetStart > 0 ? Math.random() * maxTargetStart : 0;
  const variant = getSkillCheckVariant();
  skillCheckState.active = true;
  skillCheckState.timer = 0;
  const duration = variant === 'cross' ? Math.max(config.duration, 60) : config.duration;
  skillCheckState.duration = duration;
  skillCheckState.reward = reward;
  skillCheckState.onFail = onFail || null;
  skillCheckState.sliderSpeed = config.sliderSpeed;
  skillCheckState.secondarySpeed = variant === 'cross' ? config.sliderSpeed * 0.92 : config.sliderSpeed;
  skillCheckState.windowSize = config.windowSize;
  skillCheckState.sliderPosition = sliderPosition;
  skillCheckState.secondaryPosition = variant === 'cross' ? secondaryPosition : sliderPosition;
  skillCheckState.sliderDirection = sliderDirection;
  skillCheckState.secondaryDirection = variant === 'cross' ? secondaryDirection : sliderDirection;
  skillCheckState.targetStart = targetStart;
  skillCheckState.targetEnd = targetStart + config.windowSize;
  skillCheckState.secondaryStart = variant === 'cross' ? secondaryStart : targetStart;
  skillCheckState.secondaryEnd = skillCheckState.secondaryStart + config.windowSize;
  skillCheckState.difficulty = difficulty;
  skillCheckState.meta = summary || null;
  setSkillCheckVariant(variant);
  const variantCopy = SKILL_CHECK_VARIANT_DETAILS[variant] || SKILL_CHECK_VARIANT_DETAILS.linear;
  UI.skillCheckTitle.textContent = `${variantCopy.title} — ${difficulty.toUpperCase()}`;
  const targetLabel = upgrade?.name || 'the target';
  UI.skillCheckDescription.textContent = variantCopy.description.replace('{target}', targetLabel);
  if (UI.skillCheckUpgrade) {
    UI.skillCheckUpgrade.textContent = targetLabel;
  }
  if (UI.skillCheckTier) {
    const nextLevel = (upgrade ? (state.upgrades[upgrade.id] || 0) + 1 : 0) || 0;
    UI.skillCheckTier.textContent = nextLevel ? `Next tier: ${nextLevel}` : '';
  }
  if (UI.skillCheckReward) {
    UI.skillCheckReward.textContent = summary?.rewardLabel || '';
  }
  if (UI.skillCheckPenalty) {
    UI.skillCheckPenalty.textContent = summary?.penaltyLabel || '';
  }
  UI.skillCheck.classList.remove('hidden');
  refreshSkillCheckVisuals();
  UI.skillCheckAction.focus();
}

function resolveSkillCheck(success) {
  if (!skillCheckState.active) return;
  skillCheckState.active = false;
  if (UI.skillCheck) {
    UI.skillCheck.classList.add('hidden');
  }
  if (success) {
    if (typeof skillCheckState.reward === 'function') {
      skillCheckState.reward();
    }
    spawnSkillCheckConfetti();
  } else if (!success) {
    flashSkillCheckFailTint();
    if (typeof skillCheckState.onFail === 'function') {
      skillCheckState.onFail();
    } else {
      createFloatText(document.body, 'Skill check failed', '#ff6ea8', { variant: 'requirement', priority: 'high' });
    }
  }
  handleTutorialSkillCheckResult(success);
  skillCheckState.reward = null;
  skillCheckState.onFail = null;
  skillCheckState.sliderSpeed = 0;
  skillCheckState.secondarySpeed = 0;
  skillCheckState.secondaryPosition = 0;
  skillCheckState.secondaryDirection = 1;
  skillCheckState.secondaryStart = 0;
  skillCheckState.secondaryEnd = 0;
  skillCheckState.windowSize = 0;
  skillCheckState.timer = 0;
  if (UI.skillCheckProgress) {
    UI.skillCheckProgress.style.width = '0%';
  }
  if (UI.skillCheckTarget) {
    UI.skillCheckTarget.style.width = '0%';
  }
  if (UI.skillCheckSlider) {
    UI.skillCheckSlider.style.left = '0%';
  }
  if (UI.skillCheckAction) {
    UI.skillCheckAction.blur();
  }
  skillCheckState.meta = null;
}

function updateSkillCheck(delta) {
  if (!skillCheckState.active) return;
  skillCheckState.timer += delta;
  const elapsed = Math.min(1, skillCheckState.timer / skillCheckState.duration);
  if (UI.skillCheckProgress) {
    UI.skillCheckProgress.style.width = `${Math.max(0, (1 - elapsed) * 100)}%`;
  }
  let sliderMoved = false;
  if (skillCheckState.sliderSpeed > 0) {
    skillCheckState.sliderPosition += skillCheckState.sliderSpeed * delta * skillCheckState.sliderDirection;
    if (skillCheckState.sliderPosition >= 1) {
      skillCheckState.sliderPosition = 1;
      skillCheckState.sliderDirection = -1;
    } else if (skillCheckState.sliderPosition <= 0) {
      skillCheckState.sliderPosition = 0;
      skillCheckState.sliderDirection = 1;
    }
    sliderMoved = true;
  }
  if (skillCheckState.variant === 'cross' && skillCheckState.secondarySpeed > 0) {
    skillCheckState.secondaryPosition +=
      skillCheckState.secondarySpeed * delta * skillCheckState.secondaryDirection;
    if (skillCheckState.secondaryPosition >= 1) {
      skillCheckState.secondaryPosition = 1;
      skillCheckState.secondaryDirection = -1;
    } else if (skillCheckState.secondaryPosition <= 0) {
      skillCheckState.secondaryPosition = 0;
      skillCheckState.secondaryDirection = 1;
    }
    sliderMoved = true;
  }
  if (sliderMoved) {
    updateSkillCheckSliderVisuals();
  }
  if (skillCheckState.timer >= skillCheckState.duration) {
    resolveSkillCheck(false);
  }
}

function markFrameStart() {
  frameCounter += 1;
  cachedNodeAreaFrame = -1;
  cachedNodeAreaRect = null;
}

function getNodeAreaRect() {
  if (!UI.nodeArea) return null;
  if (cachedNodeAreaFrame === frameCounter && cachedNodeAreaRect) {
    return cachedNodeAreaRect;
  }
  const rect = UI.nodeArea.getBoundingClientRect();
  cachedNodeAreaRect = {
    left: rect.left,
    right: rect.right,
    top: rect.top,
    bottom: rect.bottom,
    width: UI.nodeArea.clientWidth || rect.width,
    height: UI.nodeArea.clientHeight || rect.height,
  };
  cachedNodeAreaFrame = frameCounter;
  return cachedNodeAreaRect;
}

function startGameLoop() {
  updateStats();
  let last = performance.now();
  function loop(now) {
    const delta = Math.min(0.05, (now - last) / 1000);
    last = now;
    markFrameStart();
    tick(delta);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}

function tick(delta) {
  state.playtime += delta;
  updateLevel(delta);
  updateNodes(delta);
  updateGreenMomentum(delta);
  updateAutoClick(delta);
  updateBoss(delta);
  updateCrypto(delta);
  updateLab(delta);
  updateSkillCheck(delta);
  milestoneTimer += delta;
  if (milestoneTimer >= 1) {
    renderMilestones();
    milestoneTimer = 0;
  }
  achievementTimer += delta;
  if (achievementTimer >= 1) {
    renderAchievements();
    achievementTimer = 0;
  }
}

const activeNodes = new Map();
let activeBoss = null;
let autoClickTimer = 0;
let cursorClickTimeout;
let lastBossImpactEffectAt = 0;

function isHighDensityMode() {
  return activeNodes.size >= HIGH_DENSITY_EFFECT_THRESHOLD;
}

function syncNodeDensityState() {
  if (!UI.nodeArea) return;
  UI.nodeArea.classList.toggle('high-density', activeNodes.size >= HIGH_DENSITY_NODE_THRESHOLD);
}

function removeNodeFromArena(node) {
  if (!node) return;
  if (node.shakeTimeout) clearTimeout(node.shakeTimeout);
  if (node.hitTimeout) clearTimeout(node.hitTimeout);
  if (node.critTimeout) clearTimeout(node.critTimeout);
  node.el?.remove();
  activeNodes.delete(node.id);
  syncNodeDensityState();
}

function getNodeCenterInArea(node) {
  return {
    x: node.position.x + NODE_SIZE / 2,
    y: node.position.y + NODE_SIZE / 2,
  };
}

function getNodeCenterOnScreen(node) {
  const areaRect = getNodeAreaRect();
  if (!areaRect) return null;
  const center = getNodeCenterInArea(node);
  return {
    x: areaRect.left + center.x,
    y: areaRect.top + center.y,
  };
}

function updateNodes(delta) {
  if (!UI.nodeArea) return;
  if (!state.currentLevel.active) return;
  nodeSpawnTimer -= delta;
  const maxNodes = getActiveNodeCap();
  const spawnDelay = Math.max(0.02, stats.nodeSpawnDelay);
  let spawnCount = 0;
  while (nodeSpawnTimer <= 0 && activeNodes.size < maxNodes && spawnCount < MAX_SPAWNS_PER_FRAME) {
    spawnNode();
    nodeSpawnTimer += spawnDelay;
    spawnCount += 1;
  }
  if (activeNodes.size >= maxNodes) {
    nodeSpawnTimer = Math.max(nodeSpawnTimer, 0);
  }
  const areaRect = getNodeAreaRect();
  if (!areaRect) return;
  const { width, height } = areaRect;
  activeNodes.forEach((node) => {
    const healthChanged = tickNodeBehavior(node, delta);
    node.position.x += node.velocity.x * delta;
    node.position.y += node.velocity.y * delta;
    node.rotation += node.rotationSpeed * delta;
    applyNodeTransform(node);
    if (healthChanged) {
      updateNodeElement(node);
    }
    const bounds = node.bounds;
    if (
      node.position.x < -bounds ||
      node.position.x > width + bounds ||
      node.position.y < -bounds ||
      node.position.y > height + bounds
    ) {
      removeNodeFromArena(node);
    }
  });
  syncNodeDensityState();
}

function updateGreenMomentum(delta) {
  if (greenMomentumTimer <= 0) return;
  greenMomentumTimer = Math.max(0, greenMomentumTimer - delta);
  if (greenMomentumTimer === 0) {
    greenMomentumStacks = 0;
  }
}

function updateAutoClick(delta) {
  if (!state.currentLevel.active) return;
  autoClickTimer += delta;
  const interval = getAutoClickInterval();
  while (autoClickTimer >= interval) {
    autoClickTimer -= interval;
    performAutoClick();
  }
}

function getAutoClickInterval() {
  const baseInterval = Math.max(0.1, stats.autoInterval);
  if (greenMomentumTimer <= 0 || greenMomentumStacks <= 0) return baseInterval;
  const haste = 1 - Math.min(0.5, greenMomentumStacks * 0.15);
  return Math.max(0.05, baseInterval * haste);
}

function getPointerSize() {
  const baseSize = BASE_POINTER_SIZE || 32;
  return Math.max(baseSize, stats.pointerSize || 0);
}

function getCursorDisplaySize(inNodeArea = cursorInNodeArea) {
  if (!inNodeArea) return BASE_POINTER_SIZE || 32;
  return getPointerSize();
}

function getBitCollectSize() {
  const base = getPointerSize();
  return Math.max(8, base + (stats.bitCollectRadius || 0));
}

function applyCursorSize() {
  if (UI.customCursor) {
    const targetSize = cursorInNodeArea ? getPointerSize() : BASE_POINTER_SIZE || 32;
    const zoom = cursorInNodeArea ? 1 : 0.9;
    UI.customCursor.style.setProperty('--cursor-size', `${targetSize}px`);
    UI.customCursor.style.setProperty('--cursor-zoom', zoom);
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

function getBitCollectRect(x, y) {
  const size = getBitCollectSize();
  const half = size / 2;
  return {
    left: x - half,
    right: x + half,
    top: y - half,
    bottom: y + half,
  };
}

function isPointerInsideNodeArea(x, y, areaRect = getNodeAreaRect()) {
  if (!areaRect) return false;
  if (areaRect.width <= 0 || areaRect.height <= 0) return false;
  return x >= areaRect.left && x <= areaRect.right && y >= areaRect.top && y <= areaRect.bottom;
}

function updateCursorAreaState(inNodeArea) {
  if (cursorInNodeArea === inNodeArea) {
    if (inNodeArea) {
      applyCursorSize();
    }
    return;
  }
  cursorInNodeArea = inNodeArea;
  applyCursorSize();
}

function requestBitTokenSweep() {
  if (bitTokenSweepScheduled) return;
  bitTokenSweepScheduled = true;
  requestAnimationFrame(() => {
    bitTokenSweepScheduled = false;
    collectBitTokensAtPointer();
  });
}

function collectBitTokensAtPointer() {
  if (!UI.bitLayer || !UI.nodeArea) return;
  const tokens = UI.bitLayer.querySelectorAll('.bit-token:not(.collecting)');
  if (tokens.length === 0) return;
  const pointerRect = getBitCollectRect(cursorPosition.x, cursorPosition.y);
  tokens.forEach((token) => {
    const tokenRect = token.getBoundingClientRect();
    if (pointerIntersectsRect(pointerRect, tokenRect)) {
      collectBitToken(token);
    }
  });
}

function getPointerCenterInArea(areaRect) {
  const half = getPointerSize() / 2;
  const minX = half;
  const maxX = Math.max(half, areaRect.width - half);
  const minY = half;
  const maxY = Math.max(half, areaRect.height - half);
  const x = Math.min(Math.max(cursorPosition.x - areaRect.left, minX), maxX);
  const y = Math.min(Math.max(cursorPosition.y - areaRect.top, minY), maxY);
  return { x, y, half };
}

function pointerIntersectsRect(pointerRect, rect) {
  return (
    pointerRect.left <= rect.right &&
    pointerRect.right >= rect.left &&
    pointerRect.top <= rect.bottom &&
    pointerRect.bottom >= rect.top
  );
}

function isNodeAreaInteractive(pointerX, pointerY) {
  if (!UI.nodeArea) return false;
  if (isUpdateLogOpen()) return false;
  const element = document.elementFromPoint(pointerX, pointerY);
  if (!element) return false;
  return element === UI.nodeArea || UI.nodeArea.contains(element);
}

function getPointerRectInArea(areaRect, pointerX = cursorPosition.x, pointerY = cursorPosition.y) {
  const size = getPointerSize();
  const half = size / 2;
  return {
    left: pointerX - areaRect.left - half,
    right: pointerX - areaRect.left + half,
    top: pointerY - areaRect.top - half,
    bottom: pointerY - areaRect.top + half,
  };
}

function pointerIntersectsNode(pointerRect, node, padding = 6) {
  const left = node.position.x - padding;
  const right = node.position.x + NODE_SIZE + padding;
  const top = node.position.y - padding;
  const bottom = node.position.y + NODE_SIZE + padding;
  return (
    pointerRect.left <= right &&
    pointerRect.right >= left &&
    pointerRect.top <= bottom &&
    pointerRect.bottom >= top
  );
}

function performAutoClick() {
  if (!UI.nodeArea) return;
  const areaRect = getNodeAreaRect();
  if (!areaRect || areaRect.width <= 0 || areaRect.height <= 0) return;
  const inside = isPointerInsideNodeArea(cursorPosition.x, cursorPosition.y, areaRect);
  if (!inside) return;
  const pointerX = cursorPosition.x;
  const pointerY = cursorPosition.y;
  if (!isNodeAreaInteractive(pointerX, pointerY)) return;
  playSFX('pointerAtk');
  const pointerRect = getPointerRectInArea(areaRect, pointerX, pointerY);
  let hitSomething = false;
  let destroyedNode = false;
  let critHit = false;
  const nodesHit = [];
  activeNodes.forEach((node) => {
    if (pointerIntersectsNode(pointerRect, node)) {
      nodesHit.push(node);
    }
  });
  if (nodesHit.length > 0) {
    nodesHit.forEach((node) => {
      const result = strikeNode(node);
      destroyedNode = destroyedNode || !!result?.destroyed;
      critHit = critHit || !!result?.crit;
    });
    hitSomething = true;
  }
  triggerCursorClickAnimation(pointerX, pointerY, {
    hit: hitSomething,
    kill: destroyedNode,
    critical: critHit,
    boss: hitSomething && state.currentLevel.bossActive,
  });
  if (hitSomething) {
    playPointerHitSFX();
  }
}

function spawnNode() {
  if (!UI.nodeArea) return;
  const areaRect = getNodeAreaRect();
  if (!areaRect) return;
  const tutorialType = getTutorialNodeTypeOverride();
  const type = tutorialType || weightedNodeType();
  if (!type) return;
  const { width, height } = areaRect;
  const margin = 90;
  const horizontalRange = Math.max(0, width - NODE_SIZE);
  const verticalRange = Math.max(0, height - NODE_SIZE);
  const randomX = () => Math.random() * horizontalRange;
  const randomY = () => Math.random() * verticalRange;
  const side = Math.floor(Math.random() * 4);
  let startX = 0;
  let startY = 0;
  let targetX = 0;
  let targetY = 0;
  switch (side) {
    case 0:
      startX = -margin;
      startY = randomY();
      targetX = width + margin;
      targetY = randomY();
      break;
    case 1:
      startX = width + margin;
      startY = randomY();
      targetX = -margin;
      targetY = randomY();
      break;
    case 2:
      startX = randomX();
      startY = -margin;
      targetX = randomX();
      targetY = height + margin;
      break;
    default:
      startX = randomX();
      startY = height + margin;
      targetX = randomX();
      targetY = -margin;
      break;
  }

  triggerArenaFlash(type);
  const travelTimeBase = 10 + Math.random() * 6;
  const travelTime = travelTimeBase / Math.max(1, type.speedMultiplier || 1);
  const velocity = {
    x: (targetX - startX) / travelTime,
    y: (targetY - startY) / travelTime,
  };
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
    rotationSpeed: (Math.random() - 0.5) * 28,
    bounds: margin,
  };
  if (type.id === 'prismatic') {
    node.behaviorState = { hueTimer: 0 };
    applyPrismaticHue(node, pickPrismaticHue(type));
  }
  if (type.id === 'void') {
    node.behaviorState = { drain: 0 };
  }
  const el = document.createElement('div');
  el.className = `node ${type.color}`;
  const visual = document.createElement('div');
  visual.className = 'node-visual';
  const healthRing = document.createElement('div');
  healthRing.className = 'health-ring';
  const fill = document.createElement('div');
  fill.className = 'fill';
  const core = document.createElement('div');
  core.className = 'core';
  visual.append(healthRing, fill, core);
  const hpLabel = document.createElement('div');
  hpLabel.className = 'hp';
  el.append(visual, hpLabel);
  node.el = el;
  node.visualEl = visual;
  node.fillEl = fill;
  node.healthRingEl = healthRing;
  node.hpEl = hpLabel;
  if (type.id === 'prismatic') {
    applyPrismaticHue(node, node.currentHue || pickPrismaticHue(type));
  }
  applyNodeTransform(node);
  UI.nodeArea.appendChild(el);
  activeNodes.set(node.id, node);
  syncNodeDensityState();
  if (!state.settings.reducedAnimation && !isHighDensityMode()) {
    requestAnimationFrame(() => el.classList.add('pulse'));
    setTimeout(() => el.classList.remove('pulse'), 420);
  }
  updateNodeElement(node);
}

function pickPrismaticHue(type) {
  if (!type?.hues?.length) return 'azure';
  const index = Math.floor(Math.random() * type.hues.length);
  return type.hues[index] || 'azure';
}

const PRISMATIC_COLORS = {
  azure: { hex: '#7ef6ff', rgb: '126, 246, 255' },
  emerald: { hex: '#6df3a1', rgb: '109, 243, 161' },
  crimson: { hex: '#ff6ea8', rgb: '255, 110, 168' },
  auric: { hex: '#ffd166', rgb: '255, 209, 102' },
  void: { hex: '#b38bff', rgb: '179, 139, 255' },
};

function applyPrismaticHue(node, hue) {
  if (!node?.el) return;
  const palette = PRISMATIC_COLORS[hue] || PRISMATIC_COLORS.azure;
  node.currentHue = hue;
  node.el.dataset.hue = hue;
  node.el.style.setProperty('--node-prism-color', palette.hex);
  node.el.style.setProperty('--node-prism-rgb', palette.rgb);
}

function tickNodeBehavior(node, delta) {
  if (!node?.type) return false;
  const previousHP = Number(node.hp) || 0;
  if (node.hp < node.maxHP) {
    const passiveRegen = Math.max(0, node.maxHP * NODE_PASSIVE_REGEN_RATE * delta);
    if (passiveRegen > 0) {
      node.hp = Math.min(node.maxHP, node.hp + passiveRegen);
    }
  }
  if (node.type.id === 'void') {
    const drain = Math.max(0, node.type.behavior?.drainPerSecond || 0);
    if (drain > 0) {
      const damage = drain * delta;
      state.health = Math.max(0, state.health - damage);
      const healFactor = Math.max(0, node.type.behavior?.healOnDrain || 0);
      if (healFactor > 0 && node.hp < node.maxHP) {
        node.hp = Math.min(node.maxHP, node.hp + damage * healFactor);
      }
    }
  }
  if (node.type.id === 'prismatic') {
    node.behaviorState = node.behaviorState || { hueTimer: 0 };
    node.behaviorState.hueTimer += delta;
    if (!node.currentHue) {
      applyPrismaticHue(node, pickPrismaticHue(node.type));
    }
    if (node.behaviorState.hueTimer >= 3.2) {
      node.behaviorState.hueTimer = 0;
      applyPrismaticHue(node, pickPrismaticHue(node.type));
    }
  }
  return Math.abs(node.hp - previousHP) > 0.0001;
}

function weightedNodeType() {
  const roll = Math.random();
  if (roll >= 0.997) return nodeTypes.find((type) => type.id === 'gold') || nodeTypes[0];
  if (roll >= 0.992) return nodeTypes.find((type) => type.id === 'prismatic') || nodeTypes[0];
  if (roll >= 0.965) return nodeTypes.find((type) => type.id === 'void') || nodeTypes[0];
  if (roll >= 0.74) return nodeTypes.find((type) => type.id === 'blue') || nodeTypes[0];
  if (roll >= 0.64) return nodeTypes.find((type) => type.id === 'green') || nodeTypes[0];
  return nodeTypes.find((type) => type.id === 'red') || nodeTypes[0];
}

let arenaFlashTimeout;
function triggerArenaFlash(type) {
  if (!type || !UI.nodeArea || !UI.nodeArenaBackdrop) return;
  if (isHighDensityMode()) return;
  const rare = type.id === 'gold' || type.id === 'void' || type.id === 'prismatic';
  if (!rare) return;
  const highlight =
    (type.id === 'gold' && '#ffd166') ||
    (type.id === 'void' && '#b38bff') ||
    (type.id === 'prismatic' && PRISMATIC_COLORS.azure.hex) ||
    '#7fffd6';
  UI.nodeArea.style.setProperty('--rare-highlight', highlight);
  UI.nodeArenaBackdrop?.style.setProperty('--rare-highlight', highlight);
  UI.nodeArea.classList.add('rare-flash');
  clearTimeout(arenaFlashTimeout);
  arenaFlashTimeout = setTimeout(() => UI.nodeArea.classList.remove('rare-flash'), 1200);
}

function calculateCursorDamage(options = {}) {
  const { allowCrit = true } = options;
  let damage = stats.damage;
  damage += activeNodes.size * stats.nodeCountDamageBonus * stats.damage;
  let crit = false;
  if (allowCrit && Math.random() < stats.critChance) {
    crit = true;
    damage *= stats.critMultiplier;
  }
  damage = Math.max(damage, 1);
  return { damage, crit };
}

function strikeNode(node) {
  const { damage, crit } = calculateCursorDamage();
  if (crit) {
    createNodeFloatText(node, 'CRIT!', '#ff6ea8', { variant: 'critical', priority: 'high' });
  }
  node.hp -= damage;
  const destroyed = node.hp <= 0;
  triggerNodeDamageEffect(node, { crit });
  if (!isHighDensityMode() || crit) {
    createNodeFloatText(node, `-${Math.round(damage)}`, 'var(--accent-strong)', { variant: 'damage' });
  }
  if (destroyed) {
    destroyNode(node, { crit });
  } else {
    updateNodeElement(node);
  }
  return { damage, crit, destroyed };
}

function triggerNodeDamageEffect(node, options = {}) {
  if (!node || !node.el || state.settings.reducedAnimation || isHighDensityMode()) return;
  node.el.classList.remove('shaking');
  node.el.classList.remove('hit');
  node.el.classList.remove('critical-hit');
  // force reflow so the animation can restart even during rapid hits
  void node.el.offsetWidth;
  node.el.classList.add('shaking', 'hit');
  if (options.crit) {
    node.el.classList.add('critical-hit');
  }
  if (node.shakeTimeout) clearTimeout(node.shakeTimeout);
  if (node.hitTimeout) clearTimeout(node.hitTimeout);
  if (node.critTimeout) clearTimeout(node.critTimeout);
  node.shakeTimeout = setTimeout(() => node.el && node.el.classList.remove('shaking'), 240);
  node.hitTimeout = setTimeout(() => node.el && node.el.classList.remove('hit'), 220);
  if (options.crit) {
    node.critTimeout = setTimeout(() => node.el && node.el.classList.remove('critical-hit'), 280);
  }
}

function createFloatTextAt(x, y, text, color = 'var(--accent-strong)', options = {}) {
  const priority = options.priority || 'normal';
  if (priority !== 'high' && activeFloatTextCount >= MAX_FLOAT_TEXTS) {
    return;
  }
  const variant = options.variant || 'default';
  const laneCount = options.laneCount || (variant === 'damage' ? 4 : variant === 'currency' ? 3 : 2);
  const anchorKey = options.anchorKey || `${Math.round(x / 48)}:${Math.round(y / 48)}`;
  const laneKey = `${variant}:${anchorKey}`;
  const laneIndex = floatTextLaneState.get(laneKey) || 0;
  floatTextLaneState.set(laneKey, (laneIndex + 1) % laneCount);
  const laneCenter = (laneCount - 1) / 2;
  const laneOffsetX = (laneIndex - laneCenter) * (options.laneSpacingX || 18) + (options.offsetX || 0);
  const laneOffsetY = (options.offsetY || 0) - laneIndex * (options.laneSpacingY || 10);
  const rise = options.rise || (variant === 'requirement' ? 136 : 108);
  const float = document.createElement('div');
  activeFloatTextCount += 1;
  float.className = 'float-text';
  float.classList.add(`float-${variant}`);
  if (variant === 'critical') {
    float.classList.add('critical');
  }
  float.style.left = `${x}px`;
  float.style.top = `${y}px`;
  float.style.color = color;
  float.style.setProperty('--float-offset-x', `${laneOffsetX}px`);
  float.style.setProperty('--float-offset-y', `${laneOffsetY}px`);
  float.style.setProperty('--float-rise', `${rise}px`);
  float.textContent = text;
  document.body.appendChild(float);
  const lifespan =
    options.lifespan || (variant === 'critical' ? 2100 : variant === 'requirement' ? 1850 : variant === 'currency' ? 1750 : 1600);
  setTimeout(() => {
    activeFloatTextCount = Math.max(0, activeFloatTextCount - 1);
    floatTextLaneState.delete(laneKey);
    float.remove();
  }, lifespan);
}

function createFloatText(target, text, color = 'var(--accent-strong)', options = {}) {
  if (!target) return;
  const rect = target.getBoundingClientRect();
  createFloatTextAt(rect.left + rect.width / 2, rect.top + rect.height / 2, text, color, options);
}

function createNodeFloatText(node, text, color = 'var(--accent-strong)', options = {}) {
  const center = getNodeCenterOnScreen(node);
  if (!center) return;
  createFloatTextAt(center.x, center.y, text, color, options);
}

function randomInRange(min, max) {
  const safeMin = Number.isFinite(min) ? min : 0;
  const safeMax = Number.isFinite(max) ? max : safeMin;
  if (safeMax <= safeMin) return safeMin;
  return safeMin + Math.random() * (safeMax - safeMin);
}

function getLevelBitReward(typeId, levelIndex = 1) {
  const level = Math.max(1, Math.floor(levelIndex));
  const baseRange = BIT_REWARD_TABLE[typeId] || BIT_REWARD_TABLE.red;
  const levelMultiplier = Math.pow(3, Math.max(0, level - 1));
  const min = baseRange.min * levelMultiplier;
  const max = baseRange.max * levelMultiplier;
  return Math.round(randomInRange(min, max));
}

function getBossDamageFromNodeType(typeId) {
  if (typeId === 'red') return Math.round(randomInRange(15, 20));
  if (typeId === 'blue') return Math.round(randomInRange(30, 40));
  if (typeId === 'green') return Math.round(randomInRange(80, 150));
  if (typeId === 'gold') return Math.round(randomInRange(200, 400));
  if (typeId === 'void') return Math.round(randomInRange(260, 420));
  if (typeId === 'prismatic') return Math.round(randomInRange(120, 320));
  return 0;
}

function rollRareCryptoDrop(node) {
  const typeId = node?.type?.id || 'red';
  const chances = {
    red: 0.00025,
    blue: 0.0004,
    green: 0.00055,
    gold: 0.0011,
    void: 0.0008,
    prismatic: 0.0014,
  };
  const rewardRanges = {
    red: [1, 2],
    blue: [1, 3],
    green: [2, 4],
    gold: [3, 6],
    void: [3, 5],
    prismatic: [4, 8],
  };
  const chance = chances[typeId] || 0;
  if (Math.random() >= chance) {
    return 0;
  }
  const [minReward, maxReward] = rewardRanges[typeId] || [1, 2];
  const levelBonus = Math.min(4, Math.floor(Math.log10(Math.max(10, state.currentLevel.index + 9))));
  return Math.max(1, Math.round(randomInRange(minReward, maxReward + levelBonus)));
}

function destroyNode(node, options = {}) {
  const rewardsGranted = dropRewards(node);
  playSFX('nodeDie');
  const key = node.type.id;
  state.nodesDestroyed[key] = (state.nodesDestroyed[key] || 0) + 1;
  registerTutorialNodeKill(node.type?.id);
  createNodeExplosion(node, options);
  if (node.type?.id === 'green') {
    applyGreenNodeMomentum(node);
  }
  if (node.type?.id === 'gold') {
    createGoldenBitBurst(node);
  }
  if (node.type?.id === 'void') {
    const restored = Math.min(state.maxHealth - state.health, Math.ceil(node.maxHP * 0.04));
    if (restored > 0) {
      state.health += restored;
      createNodeFloatText(node, `+${restored} HP`, '#b38bff', { variant: 'status' });
    }
  }
  if (node.type?.id === 'prismatic' && node.currentHue) {
    createNodeFloatText(node, node.currentHue.toUpperCase(), '#cde7ff', { variant: 'status' });
  }
  spawnBitTokens(node, rewardsGranted?.bits || 0);
  removeNodeFromArena(node);
  renderMilestones();
}

function dropRewards(node) {
  const type = node?.type || nodeTypes[0];
  const rewards = type.reward(state.currentLevel.index, node);
  const baseBits = rewards.bits ?? 0;
  const nodeElement = node?.el;
  let harvestedBits = 0;
  if (baseBits || stats.bitNodeBonus) {
    const totalBits = Math.max(0, baseBits + stats.bitNodeBonus);
    harvestedBits = Math.max(0, totalBits * stats.bitGain);
    state.bits += harvestedBits;
    if (state.currentLevel.bossActive) {
      const payload = getBossDamageFromNodeType(type.id);
      if (payload > 0) {
        applyBossDamage(payload, nodeElement);
      }
    }
  }
  if (rewards.xp) {
    gainXP(rewards.xp * stats.xpGain);
  }
  if (rewards.cryptcoins) {
    state.cryptcoins += rewards.cryptcoins;
    createNodeFloatText(node, `+${formatNumberShort(rewards.cryptcoins)} CC`, '#7ef6ff', { variant: 'currency' });
  }
  if (rewards.prestige) {
    state.prestige += rewards.prestige;
  }
  const rareCryptoDrop = rollRareCryptoDrop(node);
  if (rareCryptoDrop > 0) {
    state.cryptcoins += rareCryptoDrop;
    createNodeFloatText(node, `Lucky CC +${formatNumberShort(rareCryptoDrop)}`, '#9efcff', {
      variant: 'currency',
      priority: 'high',
    });
  }
  updateResources();
  queueSave(2000);
  return { bits: harvestedBits };
}

function applyGreenNodeMomentum(node) {
  greenMomentumTimer = GREEN_MOMENTUM_DURATION;
  greenMomentumStacks = Math.min(GREEN_MOMENTUM_MAX_STACKS, greenMomentumStacks + 1);
  if (node?.el) {
    createNodeFloatText(node, 'Momentum!', '#7fffd6', { variant: 'status', priority: 'high' });
  }
}

function formatNodeHPValue(value) {
  return formatNumberShort(Math.max(0, Math.ceil(value))).replace(/\s+/gu, '');
}

function updateNodeElement(node) {
  if (!node.el) return;
  const hpEl = node.hpEl || node.el.querySelector('.hp');
  if (hpEl) {
    hpEl.textContent = formatNodeHPValue(node.hp);
    hpEl.title = `${Math.max(0, Math.ceil(node.hp)).toLocaleString()} HP`;
    node.hpEl = hpEl;
  }
  const fillEl = node.fillEl || node.el.querySelector('.fill');
  if (fillEl) {
    const ratio = Math.max(0, Math.min(1, node.hp / node.maxHP));
    fillEl.style.transform = `scaleY(${ratio})`;
    node.fillEl = fillEl;
  }
}

function applyNodeTransform(node) {
  if (!node.el) return;
  node.el.style.transform = `translate3d(${node.position.x}px, ${node.position.y}px, 0) rotate(${node.rotation}deg)`;
}

function getNodeEffectRGB(node) {
  if (!node?.el || typeof getComputedStyle !== 'function') return '127, 255, 214';
  const rgb = getComputedStyle(node.el).getPropertyValue('--node-color-rgb').trim();
  return rgb || '127, 255, 214';
}

function createNodeExplosion(node, options = {}) {
  if (!UI.particleLayer || !node.el) return;
  if (state.settings.reducedAnimation || isHighDensityMode()) return;
  const { x, y } = getNodeCenterInArea(node);
  const explosion = document.createElement('div');
  explosion.className = 'explosion';
  if (options.crit) {
    explosion.classList.add('critical');
  }
  explosion.style.setProperty('--burst-rgb', getNodeEffectRGB(node));
  explosion.style.left = `${x}px`;
  explosion.style.top = `${y}px`;
  explosion.style.transform = 'translate(-50%, -50%)';
  const shardCount = options.crit ? 8 : 5;
  const spread = options.crit ? 68 : 50;
  for (let i = 0; i < shardCount; i += 1) {
    const shard = document.createElement('span');
    shard.style.setProperty('--tx', `${(Math.random() - 0.5) * spread * 2}px`);
    shard.style.setProperty('--ty', `${(Math.random() - 0.5) * spread * 2}px`);
    shard.style.setProperty('--rot', `${(Math.random() - 0.5) * 180}deg`);
    shard.style.animationDelay = `${Math.random() * 40}ms`;
    explosion.appendChild(shard);
  }
  UI.particleLayer.appendChild(explosion);
  setTimeout(() => explosion.remove(), options.crit ? 620 : 520);
}

function createGoldenBitBurst(node) {
  if (!UI.particleLayer || !node.el || state.settings.reducedAnimation || isHighDensityMode()) return;
  const { x, y } = getNodeCenterInArea(node);
  const burst = document.createElement('div');
  burst.className = 'golden-bit-burst';
  burst.style.left = `${x}px`;
  burst.style.top = `${y}px`;
  burst.style.transform = 'translate(-50%, -50%)';
  const shardCount = 14;
  for (let i = 0; i < shardCount; i += 1) {
    const shard = document.createElement('span');
    shard.style.setProperty('--tx', `${(Math.random() - 0.5) * 260}px`);
    shard.style.setProperty('--ty', `${(Math.random() - 0.5) * 260}px`);
    shard.style.setProperty('--rot', `${(Math.random() - 0.5) * 160}deg`);
    shard.style.animationDelay = `${Math.random() * 60}ms`;
    burst.appendChild(shard);
  }
  UI.particleLayer.appendChild(burst);
  burst.addEventListener('animationend', () => burst.remove());
}

function spawnBitTokens(node, rewardBits = 0) {
  if (!UI.bitLayer || !node.el) return;
  const { x: centerX, y: centerY } = getNodeCenterInArea(node);
  const baseCount = 3 + Math.floor(Math.random() * 3);
  const requestedTokenCount =
    state.settings.reducedAnimation || isHighDensityMode() ? Math.max(1, Math.floor(baseCount / 2)) : baseCount;
  const existingTokens = UI.bitLayer.childElementCount || 0;
  const maxTokens = isHighDensityMode() ? 40 : 80;
  const availableSlots = Math.max(0, maxTokens - existingTokens);
  const tokenCount = Math.max(1, Math.min(requestedTokenCount, availableSlots || 1));
  const valueBase = Math.max(1, Math.round(4 + state.currentLevel.index * 1.2));
  const isGold = node?.type?.id === 'gold';
  const tokenValues = [];
  const normalizedReward = Math.max(0, rewardBits);
  const desiredTotal =
    normalizedReward > 0
      ? Math.max(requestedTokenCount, Math.round(normalizedReward * 0.2))
      : valueBase * requestedTokenCount;
  const goldBase = isGold ? Math.max(valueBase, Math.ceil(desiredTotal / tokenCount)) : valueBase;
  for (let i = 0; i < requestedTokenCount; i += 1) {
    let tokenValue = isGold
      ? Math.round(goldBase * (0.7 + Math.random() * 0.6))
      : valueBase + Math.floor(Math.random() * valueBase);
    if (isGold && i === requestedTokenCount - 1) {
      const runningTotal = tokenValues.reduce((sum, val) => sum + val, 0);
      tokenValue = Math.max(tokenValue, desiredTotal - runningTotal);
    }
    tokenValues.push(tokenValue);
  }
  if (tokenCount < tokenValues.length) {
    const compressed = new Array(tokenCount).fill(0);
    tokenValues.forEach((value, index) => {
      compressed[index % tokenCount] += value;
    });
    tokenValues.length = 0;
    tokenValues.push(...compressed);
  }
  const fragment = document.createDocumentFragment();
  const spawnedTokens = [];
  for (let i = 0; i < tokenCount; i += 1) {
    const token = document.createElement('div');
    token.className = 'bit-token';
    const offsetX = (Math.random() - 0.5) * 160;
    const offsetY = (Math.random() - 0.5) * 160;
    token.style.left = `${centerX + offsetX}px`;
    token.style.top = `${centerY + offsetY}px`;
    if (!state.settings.reducedAnimation) {
      token.style.setProperty('--bit-rotation', `${Math.random() * 360}deg`);
      token.style.setProperty('--bit-bob', `${6 + Math.random() * 14}px`);
      token.style.animationDelay = `${Math.random() * 0.12}s`;
    } else {
      token.classList.add('reduced-motion');
    }
    token.dataset.value = `${tokenValues[i] || valueBase}`;
    token.tabIndex = 0;
    token.addEventListener('pointerenter', () => collectBitToken(token));
    token.addEventListener('click', () => collectBitToken(token));
    token.addEventListener('focus', () => collectBitToken(token));
    token.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        collectBitToken(token);
      }
    });
    fragment.appendChild(token);
    spawnedTokens.push(token);
  }
  UI.bitLayer.appendChild(fragment);
  requestAnimationFrame(() => spawnedTokens.forEach((token) => token.classList.add('visible')));
  requestBitTokenSweep();
}

function collectBitToken(token) {
  if (!token || token.classList.contains('collecting')) return;
  const areaRect = getNodeAreaRect() || UI.nodeArea.getBoundingClientRect();
  const { x: clampedX, y: clampedY } = getPointerCenterInArea(areaRect);
  token.classList.add('collecting');
  token.style.pointerEvents = 'none';
  playSFX('bitsGain');
  const value = Number(token.dataset.value) || 1;
  state.bits += value;
  gainXP(Math.ceil(value * 0.4));
  updateResources();
  queueSave(2000);
  animateTokenToCursor(token, areaRect, clampedX, clampedY, () => {
    createFloatText(UI.customCursor || document.body, `+${value} bits`, '#ffd166', { variant: 'currency' });
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
    const { x: pointerX, y: pointerY } = getPointerCenterInArea(areaRect);
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

function getBossCenterInArea(bossObj = activeBoss) {
  if (!bossObj) return null;
  return {
    x: bossObj.position.x + bossObj.size / 2,
    y: bossObj.position.y + bossObj.size / 2,
  };
}

function createBossImpactBurst(options = {}) {
  if (!UI.particleLayer || !activeBoss?.el || state.settings.reducedAnimation) return;
  const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const minInterval = options.defeat ? 0 : options.critical ? 70 : 120;
  if (!options.defeat && now - lastBossImpactEffectAt < minInterval) return;
  lastBossImpactEffectAt = now;
  const center = getBossCenterInArea(activeBoss);
  if (!center) return;
  const burst = document.createElement('div');
  burst.className = 'boss-impact-burst';
  if (options.critical) {
    burst.classList.add('critical');
  }
  if (options.defeat) {
    burst.classList.add('defeat');
  }
  burst.style.left = `${center.x}px`;
  burst.style.top = `${center.y}px`;
  burst.style.transform = 'translate(-50%, -50%)';
  const shardCount = options.defeat ? 16 : options.critical ? 10 : 7;
  const spread = options.defeat ? 128 : options.critical ? 92 : 72;
  for (let i = 0; i < shardCount; i += 1) {
    const shard = document.createElement('span');
    shard.style.setProperty('--tx', `${(Math.random() - 0.5) * spread * 2}px`);
    shard.style.setProperty('--ty', `${(Math.random() - 0.5) * spread * 2}px`);
    shard.style.setProperty('--rot', `${(Math.random() - 0.5) * 220}deg`);
    shard.style.animationDelay = `${Math.random() * 55}ms`;
    burst.appendChild(shard);
  }
  UI.particleLayer.appendChild(burst);
  setTimeout(() => burst.remove(), options.defeat ? 820 : 460);
}

function triggerBossDamageEffect(options = {}) {
  if (!activeBoss?.el || state.settings.reducedAnimation) return;
  const bossEl = activeBoss.el;
  bossEl.classList.remove('hit');
  bossEl.classList.remove('critical-hit');
  void bossEl.offsetWidth;
  bossEl.classList.add('hit');
  if (options.critical) {
    bossEl.classList.add('critical-hit');
  }
  if (activeBoss.hitTimeout) clearTimeout(activeBoss.hitTimeout);
  if (activeBoss.critTimeout) clearTimeout(activeBoss.critTimeout);
  activeBoss.hitTimeout = setTimeout(() => bossEl.isConnected && bossEl.classList.remove('hit'), 220);
  if (options.critical) {
    activeBoss.critTimeout = setTimeout(() => bossEl.isConnected && bossEl.classList.remove('critical-hit'), 340);
  }
  createBossImpactBurst(options);
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

function clearActiveEntities() {
  activeNodes.forEach((node) => node.el?.remove());
  activeNodes.clear();
  syncNodeDensityState();
  if (activeBoss?.el) {
    activeBoss.el.remove();
  }
  activeBoss = null;
  state.currentLevel.bossActive = false;
  state.currentLevel.bossHP = 0;
  state.currentLevel.bossMaxHP = 0;
  state.currentLevel.bossDamageDealt = 0;
}

function setCurrentLevel(levelIndex) {
  const targetLevel = Math.max(1, Math.floor(levelIndex || 1));
  hideLevelDialog();
  clearActiveEntities();
  autoClickTimer = 0;
  state.currentLevel.index = targetLevel;
  if (targetLevel > 1) {
    state.highestCompletedLevel = Math.max(state.highestCompletedLevel, targetLevel - 1);
  }
  state.currentLevel.active = true;
  state.currentLevel.timer = getLevelDuration(targetLevel);
  UI.currentLevel.textContent = targetLevel;
  refreshLevelOptions();
  if (UI.levelSelect) {
    UI.levelSelect.value = `${targetLevel}`;
  }
  nodeSpawnTimer = 0;
  updateStats();
  updateResources();
  queueSave(500);
}

function resetLevel(increase = true) {
  const nextLevel = increase ? state.currentLevel.index + 1 : state.currentLevel.index;
  if (increase) {
    state.highestCompletedLevel = Math.max(state.highestCompletedLevel, state.currentLevel.index);
    state.level = Math.max(state.level, nextLevel);
    gainXP(50 * nextLevel);
    state.lp += 1;
  }
  setCurrentLevel(nextLevel);
}

function spawnBoss(options = {}) {
  const { restore = false } = options;
  let bossHP;
  let bossMaxHP;
  if (restore) {
    bossMaxHP = Number.isFinite(Number(state.currentLevel.bossMaxHP))
      ? Math.max(1, Number(state.currentLevel.bossMaxHP))
      : NaN;
    if (!Number.isFinite(bossMaxHP) || bossMaxHP <= 0) {
      const baseHP = getBossBaseHP(state.currentLevel.index);
      bossMaxHP = Math.ceil(baseHP * Math.max(1, stats.bossHPFactor || 1));
    }
    bossHP = Number.isFinite(Number(state.currentLevel.bossHP))
      ? Math.max(0, Number(state.currentLevel.bossHP))
      : bossMaxHP;
    state.currentLevel.bossActive = true;
    state.currentLevel.bossMaxHP = bossMaxHP;
    state.currentLevel.bossHP = Math.min(bossMaxHP, bossHP);
    state.currentLevel.bossDamageDealt = Math.max(0, Number(state.currentLevel.bossDamageDealt) || 0);
  } else {
    const baseHP = getBossBaseHP(state.currentLevel.index);
    bossHP = Math.ceil(baseHP * stats.bossHPFactor);
    bossMaxHP = bossHP;
    state.currentLevel.bossActive = true;
    state.currentLevel.bossHP = bossHP;
    state.currentLevel.bossMaxHP = bossMaxHP;
    state.currentLevel.bossDamageDealt = 0;
  }
  const boss = document.createElement('div');
  boss.className = 'boss-node';
  boss.innerHTML = `
    <div class="boss-core">
      <div class="boss-health-shell">
        <div class="boss-health-fill"></div>
        <div class="boss-health-overlay">
          <span>Boss Core</span>
          <span class="value">100%</span>
        </div>
      </div>
      <div class="boss-damage-readout">Damage dealt <span class="boss-damage-value">${Math.round(
        state.currentLevel.bossDamageDealt,
      ).toLocaleString()}</span></div>
    </div>
  `;
  UI.nodeArea.appendChild(boss);
  activeBoss = {
    el: boss,
    position: { x: 0, y: 0 },
    velocity: { x: 0, y: 0 },
    rotation: Math.random() * 360,
    rotationSpeed: (Math.random() - 0.5) * 18,
    size: 144,
    damageValueEl: boss.querySelector('.boss-damage-value'),
    healthFillEl: boss.querySelector('.boss-health-fill'),
    healthValueEl: boss.querySelector('.boss-health-overlay .value'),
  };
  configureBossPath(activeBoss, true);
  updateBossDamageCounter();
  updateBossBar();
}

function updateBossDamageCounter() {
  if (!activeBoss?.damageValueEl) return;
  const dealt = Math.max(0, Math.round(state.currentLevel.bossDamageDealt || 0));
  activeBoss.damageValueEl.textContent = dealt.toLocaleString();
}

function getBossCursorDamage() {
  const { damage, crit } = calculateCursorDamage();
  const bossDamage = Math.max(1, damage * 0.5);
  if (crit && activeBoss?.el) {
    createFloatText(activeBoss.el, 'CRIT!', '#ff6ea8', { variant: 'critical' });
  }
  return bossDamage;
}

function damageBoss() {
  applyBossDamage(getBossCursorDamage());
}

function applyBossDamage(amount, sourceEl = activeBoss?.el) {
  if (!state.currentLevel.bossActive) return;
  const damage = Math.max(0, Number(amount) || 0);
  if (damage <= 0) return;
  const ramp = 1 + state.bossKills * (stats.bossKillDamageRamp || 0);
  const effectiveDamage = Math.max(0, damage * ramp);
  const criticalImpact = effectiveDamage >= 180;
  state.currentLevel.bossHP -= effectiveDamage;
  state.currentLevel.bossDamageDealt = Math.max(0, (state.currentLevel.bossDamageDealt || 0) + effectiveDamage);
  if (activeBoss?.el) {
    createFloatText(activeBoss.el, `-${Math.round(effectiveDamage)}`, 'var(--accent)', { variant: 'damage' });
    showBossDamageNumber(effectiveDamage, { critical: criticalImpact });
    triggerBossDamageEffect({ critical: criticalImpact });
  }
  updateBossDamageCounter();
  updateBossBar();
  if (state.currentLevel.bossHP <= 0) {
    defeatBoss();
  }
}

function showBossDamageNumber(damage, options = {}) {
  if (!activeBoss?.el) return;
  const number = document.createElement('div');
  number.className = 'boss-damage-number';
  if (options.critical) {
    number.classList.add('critical');
  }
  number.textContent = `-${Math.round(damage)}`;
  activeBoss.el.appendChild(number);
  requestAnimationFrame(() => number.classList.add('visible'));
  setTimeout(() => number.remove(), 2320);
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
  const fill = activeBoss?.healthFillEl || bossEl.querySelector('.boss-health-fill');
  const value = activeBoss?.healthValueEl || bossEl.querySelector('.boss-health-overlay .value');
  const denominator = Math.max(1, state.currentLevel.bossMaxHP || 1);
  const ratio = Math.max(0, state.currentLevel.bossHP) / denominator;
  if (fill) {
    const healthColor = ratio > 0.66 ? 'rgba(255, 182, 196, 0.9)' : ratio > 0.33 ? '#ffd166' : '#ff6ea8';
    fill.style.setProperty('--boss-hp', ratio);
    fill.style.background = `linear-gradient(180deg, ${healthColor} 0%, rgba(255, 109, 145, 0.9) 100%)`;
  }
  if (value) {
    value.textContent = `${Math.round(ratio * 100)}%`;
  }
  updateBossDamageCounter();
  updateBossPhaseBar();
}

function playBossDefeatAnimation(bossEl) {
  if (!bossEl || state.settings.reducedAnimation) return Promise.resolve();
  createBossImpactBurst({ critical: true, defeat: true });
  const baseTransform = bossEl.style.transform || '';
  return new Promise((resolve) => {
    const animation = bossEl.animate(
      [
        { transform: `${baseTransform} scale(1)`, opacity: 1, filter: 'drop-shadow(0 0 0 rgba(255, 209, 127, 0.5))' },
        { transform: `${baseTransform} scale(1.12) rotate(4deg)`, opacity: 1, filter: 'drop-shadow(0 0 28px rgba(255, 209, 127, 0.8))' },
        { transform: `${baseTransform} scale(1.22) rotate(-8deg)`, opacity: 0.95, filter: 'drop-shadow(0 0 42px rgba(255, 243, 191, 0.95))' },
        { transform: `${baseTransform} scale(0.08) rotate(18deg)`, opacity: 0, filter: 'drop-shadow(0 0 52px rgba(255, 243, 191, 1))' },
      ],
      { duration: 720, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'forwards' },
    );
    animation.addEventListener('finish', () => resolve());
    animation.addEventListener('cancel', () => resolve());
  });
}

function defeatBoss() {
  playSFX('bossDie');
  state.currentLevel.bossActive = false;
  state.currentLevel.active = false;
  state.bossKills += 1;
  renderMilestones();
  const defeatedBossEl = activeBoss?.el;
  const rewardBits = Math.round(500 * state.currentLevel.index * stats.bitGain);
  const prestige = 1 * stats.prestigeGain;
  const xp = 120 * stats.xpGain;
  const summary = `Recovered ${Math.round(rewardBits).toLocaleString()} bits, ${xp.toFixed(0)} XP, ${prestige.toFixed(0)} prestige.`;

  const cleanup = () => {
    state.highestCompletedLevel = Math.max(state.highestCompletedLevel, state.currentLevel.index);
    activeBoss = null;
    state.bits += rewardBits;
    gainXP(xp);
    grantPrestige(prestige);
    activeNodes.forEach((node) => node.el.remove());
    activeNodes.clear();
    syncNodeDensityState();
    if (defeatedBossEl?.isConnected) {
      defeatedBossEl.remove();
    }
    updateResources();
    refreshLevelOptions();
    showLevelDialog(summary);
    queueSave();
  };

  playBossDefeatAnimation(defeatedBossEl).then(cleanup);
}

function persistStatsSnapshot() {
  state.statsSnapshot = Object.keys(stats).reduce((acc, key) => {
    if (typeof stats[key] === 'number' && Number.isFinite(stats[key])) {
      acc[key] = stats[key];
    }
    return acc;
  }, {});
}

function updateStats() {
  stats.damage = stats.baseDamage;
  stats.critChance = 0.05;
  stats.critMultiplier = 2;
  stats.autoInterval = 1;
  stats.pointerSize = BASE_POINTER_SIZE;
  stats.bitGain = 1;
  stats.bitNodeBonus = 0;
  stats.bitCollectRadius = 0;
  stats.xpGain = 1;
  stats.prestigeGain = 1;
  stats.nodeSpawnDelay = 1.8;
  stats.maxNodes = 6;
  stats.nodeHPFactor = 1 + state.currentLevel.index * 0.03;
  stats.bossHPFactor = 1;
  stats.nodeCountDamageBonus = 0;
  stats.bossKillDamageRamp = 0;
  stats.maxHealth = 100 + state.level * 5;
  const levelPressure = Math.max(0, state.currentLevel.index - 1);
  const spawnAcceleration = Math.min(1.35, levelPressure * 0.045);
  stats.nodeSpawnDelay = Math.max(0.45, stats.nodeSpawnDelay - spawnAcceleration);
  stats.maxNodes += Math.floor(levelPressure * 1.5);
  stats.bossHPFactor = 1 + levelPressure * 0.05;
  Object.entries(state.upgrades).forEach(([id, level]) => {
    const upgrade = upgrades.find((u) => u.id === id);
    if (upgrade) {
      upgrade.effect(stats, level, upgrade);
    }
  });
  applyAreaUpgrades(stats);
  applyCollectUpgrades(stats);
  applySpawnUpgrades(stats);
  applySpeedUpgrades(stats);
  stats.critChance = Math.min(0.7, Math.max(0, stats.critChance));
  stats.maxNodes = Math.max(6, Math.floor(stats.maxNodes));
  stats.nodeSpawnDelay = Math.max(0.02, stats.nodeSpawnDelay);
  state.maxHealth = stats.maxHealth;
  state.health = Math.min(state.health, state.maxHealth);
  applyCursorSize();
  persistStatsSnapshot();
  updateQuickStats();
  updateBossPhaseBar();
}

function updateQuickStats() {
  if (!UI.quickStatDamage) return;
  UI.quickStatDamage.textContent = `${Math.round(stats.damage).toLocaleString()}`;
  UI.quickStatCrit.textContent = `${(stats.critChance * 100).toFixed(1)}% / 70% cap x${stats.critMultiplier.toFixed(2)}`;
  UI.quickStatAuto.textContent = `${stats.autoInterval.toFixed(2)}s`;
  UI.quickStatSpawn.textContent = `${stats.nodeSpawnDelay.toFixed(2)}s / ${stats.maxNodes}`;
  const bossHp = Math.round(getBossBaseHP(state.currentLevel.index) * stats.bossHPFactor);
  UI.quickStatBoss.textContent = bossHp.toLocaleString();
}

function updateBossPhaseBar() {
  if (!UI.bossPhaseFill || !UI.bossPhasePhase) return;
  if (state.currentLevel.bossActive) {
    const max = Math.max(1, state.currentLevel.bossMaxHP || getBossBaseHP(state.currentLevel.index));
    const ratio = Math.max(0, state.currentLevel.bossHP) / max;
    const phase = ratio > 0.66 ? 1 : ratio > 0.33 ? 2 : ratio > 0 ? 3 : '-';
    UI.bossPhaseFill.style.transform = `scaleX(${ratio})`;
    UI.bossPhaseFill.style.background = 'linear-gradient(90deg, rgba(255, 110, 168, 0.85), rgba(255, 209, 102, 0.88))';
    UI.bossPhasePhase.textContent = `Phase ${phase}`;
    if (UI.bossPhaseMeta) {
      UI.bossPhaseMeta.textContent = `${formatNumberShort(Math.max(0, state.currentLevel.bossHP))} / ${formatNumberShort(max)} HP`;
    }
    return;
  }
  const duration = Math.max(1, getLevelDuration(state.currentLevel.index));
  const remaining = Math.max(0, state.currentLevel.timer || 0);
  const progress = Math.max(0, Math.min(1, 1 - remaining / duration));
  UI.bossPhaseFill.style.transform = `scaleX(${progress})`;
  UI.bossPhaseFill.style.background = 'linear-gradient(90deg, rgba(118, 244, 198, 0.78), rgba(126, 246, 255, 0.82))';
  UI.bossPhasePhase.textContent = `Boss in ${formatClockShort(remaining)}`;
  if (UI.bossPhaseMeta) {
    UI.bossPhaseMeta.textContent = `Stage ${state.currentLevel.index} countdown`;
  }
}

function updateResources() {
  UI.bits.textContent = formatNumberShort(Math.floor(state.bits));
  UI.cryptcoins.textContent = formatNumberShort(Math.floor(state.cryptcoins));
  UI.prestige.textContent = formatNumberShort(Math.floor(state.prestige));
  UI.xp.textContent = formatNumberShort(Math.floor(state.xp));
  if (UI.rank) {
    UI.rank.textContent = formatNumberShort(state.level);
  }
  if (UI.rankProgressLabel) {
    UI.rankProgressLabel.textContent = `${formatNumberShort(Math.floor(state.levelXP))} / ${formatNumberShort(
      Math.floor(state.xpForNext),
    )} XP`;
  }
  if (UI.rankProgressFill) {
    const ratio = Math.max(0, Math.min(1, (state.levelXP || 0) / Math.max(1, state.xpForNext || 1)));
    UI.rankProgressFill.style.transform = `scaleX(${ratio})`;
  }
  UI.lp.textContent = formatNumberShort(state.lp);
  UI.currentLevel.textContent = state.currentLevel.index;
  updateCryptoUI();
  renderCryptoSpeedUpgrades();
  updateLabUI();
  renderAreaUpgrades();
  renderCollectUpgrades();
  renderSpawnUpgrades();
  renderSpeedUpgrades();
  refreshVisibleUpgradeStates();
  updateTabAvailability();
  updateUpgradeTabAvailability();
  updateQuickStats();
  updateBossPhaseBar();
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
    playSFX('levelUp');
  }
  queueSave(2000);
}

function grantBits(amount) {
  state.bits += amount;
  updateResources();
  queueSave(2000);
}

function grantCryptcoins(amount) {
  state.cryptcoins += amount;
  updateResources();
  queueSave(2000);
}

function grantPrestige(amount) {
  state.prestige += amount;
  updateResources();
  queueSave();
}

function updateCrypto(delta) {
  if (!state.cryptoUnlocked || state.crypto.deposit <= 0 || state.crypto.rate <= 0) return;
  state.crypto.timeRemaining = Math.max(0, state.crypto.timeRemaining - delta);
  const generated = state.crypto.rate * delta;
  state.crypto.mined += generated;
  if (state.crypto.timeRemaining <= 0) {
    settleCryptoRun();
    return;
  }
  updateCryptoUI();
}

function updateLab(delta) {
  if (!state.labUnlocked || state.labSpeed <= 0) return;
  state.labProgress = Math.min(1000, state.labProgress + state.labSpeed * delta);
  updateLabUI();
}

function totalNodesDestroyed() {
  return (
    state.nodesDestroyed.red +
    state.nodesDestroyed.blue +
    state.nodesDestroyed.green +
    state.nodesDestroyed.gold +
    (state.nodesDestroyed.void || 0) +
    (state.nodesDestroyed.prismatic || 0)
  );
}

window.addEventListener('resize', () => {
  activeNodes.forEach((node) => updateNodeElement(node));
});
