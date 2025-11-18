const TICK_RATE = 1000 / 60;
const BASE_LEVEL_DURATION = 60;
const LEVEL_DURATION_INCREMENT = 10;
const BASE_BOSS_HP = 200;
const BOSS_HP_INCREMENT = 100;
const NODE_SIZE = 82;
const GAME_VERSION = 'v0.501';

const UPDATE_LOGS = [
  {
    version: 'v0.501',
    title: 'Palette selector & execution protocols',
    description:
      'New pixel dropdowns, heavier boss-hunting upgrades, and refreshed progress calls keep the simulator sharp while the battlefield gets a bit makeover.',
    changes: [
      'Level and palette selectors now render as chunky 8-bit dropdowns with crisp focus rings and fast keyboard support.',
      'Bit tokens now shatter into rose-colored triangles that tumble at random angles instead of the old yellow squares.',
      'Added Boss Execution tiers: an expensive upgrade line that adds a growing boss damage multiplier per boss kill.',
      'Achievements and milestones call out unclaimed rewards with brighter glows, new tier goals for bosses and loot, and a claim all control when rewards are ready.',
      'Enemy payouts and prices have been retuned alongside the new dropdown menus and palette selector styling.',
      'Moved settings button, updated skill pricing and Point Speed upgrade, renamed Bit Magnetics to Point Magnet and Spawn Matrix to Faster Nodes while moving them under Upgrades, removed milestones and anomaly upgrade tabs, added a custom new game warning, fixed level access, optimized the code, and reduced cursor lag with Reduced Animations.',
      'Introduced enormous milestone and achievement ladders for ultra-long runs, big node slayer streaks, prestige surges, and massive bit stockpiles.',
      'Cryptcoin mine now includes conversion accelerator upgrades and clearer number formatting across stats for giant values.',
    ],
  },
  {
    version: 'v0.499',
    title: 'Boss polish & golden jackpots',
    description:
      'Boss fights look and feel better with centered frames, clearer payouts, and golden nodes that burst into guaranteed treasure.',
    changes: [
      'Golden nodes now explode into an 8-bit shower that spawns at least 1k bits worth of tokens when defeated.',
      'Boss boards keep their text and health bars centered and clipped inside the arena with a new defeat animation before the continue menu.',
      'Red, blue, and gold nodes now pierce bosses for 15-20, 30-40, and 200-400 damage respectively when they break.',
      'Upgrade filters now read as compact chips while settings switches inherit the tactile toggle styling with smoother on/off motion.',
      'The custom cursor now grows only inside the node spawn field and smoothly scales when entering or leaving.',
    ],
  },
  {
    version: 'v0.498',
    title: 'Boss conduits & slimmer sidebars',
    description:
      'Boss damage now flows from your harvesting runs while the interface tucks tabs and upgrade filters into tighter rows.',
    changes: [
      'Bosses now take damage from the bits you harvest instead of direct cursor pokes, with a running damage meter on their frame.',
      'Added new Bit Magnetics upgrades that boost collection reach while converting gathered scraps into extra bit income.',
      'Refreshed the sticky top resource bar spacing so it stays pinned and readable while you scroll.',
      'Adjusted the node arena padding and hover tooltip timing so upgrade details stay anchored instead of clipping off-screen.',
      'Side panel tabs and upgrade filters render as a compact horizontal row to reclaim sidebar space.',
      'Retired Defense and Ability upgrade families, rebranding Weird into the Anomaly track to match the current progression.',
    ],
  },
  {
    version: 'v0.492',
    title: 'Signal clarity & steadier nodes',
    description:
      'A polish pass that makes the battlefield easier to read while reinforcing the new upgrade matrices.',
    changes: [
      'Nodes now broadcast a health perimeter that drains smoothly as you carve through them, so their condition is obvious without reading numbers.',
      'Movement, shake, and hit reactions have been retuned to glide instead of jitter, keeping combat satisfying even during swarms.',
      'Damage Area and Spawn Matrix upgrades surface their versioned tiers more cleanly to match the refreshed systems and pacing.',
    ],
  },
  {
    version: 'v0.485',
    title: 'Foundations for the rework',
    description:
      'Lays the groundwork for the new simulator loop with achievement flow fixes and a sturdier UI structure.',
    changes: [
      'Achievements now queue at the bottom of the chronicle with a dedicated claim action so you never miss a reward.',
      'The node spawn field now sticks to the viewport, keeping the fight space glued to your screen as you scroll.',
      'Primary game tabs were reworked to enforce unlock requirements, guiding progression instead of overwhelming new players.',
      'Upgrade costs were rebalanced with a tighter scale, capping most tracks at level X (10) and letting you focus on the current version tier only.',
    ],
  },
];

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
    highestCompletedLevel: 0,
    lp: 0,
    levelXP: 0,
    xpForNext: 100,
    playtime: 0,
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
      bossDamageDealt: 0,
    },
    upgrades: {},
    areaUpgrades: {},
    areaUpgradeVersions: {},
    collectUpgrades: {},
    spawnUpgrades: {},
    spawnUpgradeVersions: {},
    speedUpgrades: {},
    areaUnlocked: false,
    spawnUnlocked: false,
    cryptoUnlocked: false,
    labUnlocked: false,
    labProgress: 0,
    labSpeed: 0,
    labDeposited: 0,
    crypto: {
      deposit: 0,
      rate: 0,
      timeRemaining: 0,
      speedUpgrades: {},
    },
    skins: {
      owned: new Set(['default']),
      active: 'default',
    },
    milestoneClaims: {},
    achievementClaims: {},
    achievementLog: {},
    statsSnapshot: null,
    paletteChangeCount: 0,
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
    lastSeenVersion: null,
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

const BASE_POINTER_SIZE = 32;

const stats = {
  baseDamage: 5,
  damage: 5,
  critChance: 0.05,
  critMultiplier: 2,
  autoInterval: 1,
  pointerSize: BASE_POINTER_SIZE,
  bitGain: 1,
  bitNodeBonus: 0,
  bitCollectRadius: 0,
  xpGain: 1,
  prestigeGain: 1,
  nodeSpawnDelay: 2,
  maxNodes: 4,
  nodeHPFactor: 1,
  bossHPFactor: 1,
  nodeCountDamageBonus: 0,
  bossKillDamageRamp: 0,
};

const BIT_REWARD_TABLE = {
  red: { min: 5, max: 10 },
  blue: { min: 15, max: 30 },
  gold: { min: 50, max: 100 },
};

const CRYPTO_SPEED_UPGRADES = [
  { id: 'crypto-speed-10', label: 'Flux Heatsink', bonus: 10, cost: 10000 },
  { id: 'crypto-speed-100', label: 'Dual-Core Converter', bonus: 100, cost: 50000 },
  { id: 'crypto-speed-500', label: 'Quantum Loom', bonus: 500, cost: 1_000_000 },
];

const UPGRADE_LEVEL_GROWTH = 1.1;
const UPGRADE_TIER_GROWTH = 1.5;

const TAB_UNLOCK_RULES = {
  crypto: { label: 'Crypto Mine', stateKey: 'cryptoUnlocked', cost: { currency: 'bits', amount: 100000, label: '100k Bits' } },
  lab: { label: 'Lab', stateKey: 'labUnlocked', cost: { currency: 'cryptcoins', amount: 1000, label: '1k CC' } },
};

const UPGRADE_SECTION_RULES = {
  'point-magnet': {
    label: 'P-Magnet',
    minLevel: 20,
    requirement: hasCompletedPhaseHaloI,
    requirementLabel: 'Unlocked',
  },
  'faster-nodes': { label: 'N-Speed', stateKey: 'spawnUnlocked', cost: { currency: 'prestige', amount: 5, label: 'Unlocked' } },
  'point-speed': { label: 'P-Speed' },
};

const nodeTypes = [
  {
    id: 'red',
    name: 'Red Node',
    color: 'red',
    reward(level) {
      return { bits: getLevelBitReward('red', level) };
    },
    hp(level) {
      const safeLevel = Math.max(1, Math.floor(level));
      return 15 * Math.pow(5, Math.max(0, safeLevel - 1));
    },
  },
  {
    id: 'blue',
    name: 'Blue Node',
    color: 'blue',
    reward(level) {
      return { bits: getLevelBitReward('blue', level), xp: 4 + level };
    },
    hp(level) {
      const safeLevel = Math.max(1, Math.floor(level));
      return 30 * Math.pow(5, Math.max(0, safeLevel - 1));
    },
  },
  {
    id: 'gold',
    name: 'Gold Node',
    color: 'gold',
    reward(level) {
      return { bits: getLevelBitReward('gold', level), cryptcoins: 1 + level * 0.15 };
    },
    hp(level) {
      const safeLevel = Math.max(1, Math.floor(level));
      return 115 * Math.pow(5, Math.max(0, safeLevel - 1));
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
  easy: { duration: 4.5, baseSpeed: 0.6, window: 0.3, minWindow: 0.16 },
  normal: { duration: 3.8, baseSpeed: 0.85, window: 0.22, minWindow: 0.1 },
  hard: { duration: 3.2, baseSpeed: 1.05, window: 0.16, minWindow: 0.075 },
};

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
  targetStart: 0,
  targetEnd: 0,
  windowSize: 0,
  difficulty: 'normal',
};

const cursorPosition = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
let cursorInNodeArea = false;
let bitTokenSweepScheduled = false;
let bgmAudio;
let audioUnlocked = false;
let topBarObserver = null;
let topBarStickyObserver = null;

const SFX_DEFINITIONS = {
  pointerAtk: { src: 'files/pointer_atk.mp3', baseVolume: 0.65 },
  pointerHitA: { src: 'files/pointer_hit.mp3', baseVolume: 0.38 },
  pointerHitB: { src: 'files/pointer_hit2.mp3', baseVolume: 0.38 },
  nodeDie: { src: 'files/node_die.mp3', baseVolume: 0.32 },
  bossDie: { src: 'files/boss_die.mp3', baseVolume: 0.3 },
  bitsGain: { src: 'files/bits_gain.mp3', baseVolume: 0.26 },
};

const sfxLibrary = new Map();
let sfxLoaded = false;

function loadSFX() {
  if (sfxLoaded) return;
  Object.entries(SFX_DEFINITIONS).forEach(([key, def]) => {
    const preloadAudio = document.createElement('audio');
    preloadAudio.src = def.src;
    preloadAudio.preload = 'auto';
    preloadAudio.load?.();
    sfxLibrary.set(key, { def });
  });
  sfxLoaded = true;
}

function getSFXVolume(baseVolume = 1) {
  const userVolume = Math.min(1, Math.max(0, state.settings?.sfx ?? 0.7));
  return Math.min(1, Math.max(0, baseVolume * userVolume));
}

function playSFX(key) {
  if (!sfxLoaded) {
    loadSFX();
  }
  if (!audioUnlocked) return;
  const entry = sfxLibrary.get(key);
  if (!entry) return;
  const volume = getSFXVolume(entry.def.baseVolume);
  if (volume <= 0) return;
  const instance = new Audio(entry.def.src);
  instance.volume = volume;
  instance.preload = 'auto';
  const playPromise = instance.play();
  if (playPromise && typeof playPromise.catch === 'function') {
    playPromise.catch(() => {});
  }
}

function playPointerHitSFX() {
  const key = Math.random() < 0.5 ? 'pointerHitA' : 'pointerHitB';
  playSFX(key);
}

document.addEventListener('DOMContentLoaded', () => {
  cacheElements();
  setupLayoutMetrics();
  setupStickyTopBarState();
  setupUpdateLogs();
  generateSkins();
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
  renderSkins();
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
  syncLabVisibility();
  updateStats();
  updateResources();
  setupNewGameDialog();
  setupPersistence();
  startGameLoop();
  maybeShowUpdateLog();
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
  UI.skillCheckAction = document.getElementById('skill-check-action');
  UI.skillCheckTitle = document.getElementById('skill-check-title');
  UI.skillCheckDescription = document.getElementById('skill-check-description');
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
  const mergedSkins = {
    active: (source.skins && source.skins.active) || defaults.skins.active,
    owned: (source.skins && source.skins.owned) || defaults.skins.owned,
  };

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
    timeRemaining: Math.max(
      0,
      Number.isFinite(Number(mergedCrypto.timeRemaining)) ? Number(mergedCrypto.timeRemaining) : defaults.crypto.timeRemaining,
    ),
    speedUpgrades: sanitizeRecord(mergedCryptoSpeed),
  };
  if (state.crypto.deposit > 0) {
    recalculateCryptoRate();
  }
  if (!state.cryptoUnlocked && (state.crypto.deposit > 0 || state.crypto.rate > 0)) {
    state.cryptoUnlocked = true;
  }
  state.skins = {
    active: typeof mergedSkins.active === 'string' ? mergedSkins.active : defaults.skins.active,
    owned: new Set(Array.isArray(mergedSkins.owned) ? mergedSkins.owned : defaults.skins.owned),
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
  if (!state.skins.owned.has('default')) {
    state.skins.owned.add('default');
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
  };
  state.selectedUpgradeFilter = typeof source.selectedUpgradeFilter === 'string'
    ? source.selectedUpgradeFilter
    : defaults.selectedUpgradeFilter;
  state.lastSeenVersion = typeof source.lastSeenVersion === 'string' ? source.lastSeenVersion : defaults.lastSeenVersion;
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
  renderAreaUpgrades();
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
    parts.push(`Lv ${rule.minLevel}`);
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
    btn.textContent = requirement ? `${baseLabel} (${requirement})` : baseLabel;
    btn.setAttribute('aria-disabled', unlocked ? 'false' : 'true');
    if (unlocked) {
      btn.removeAttribute('title');
    } else {
      btn.title = rule?.label ? `${rule.label} locked` : 'Locked';
    }
  });
}

function attemptTabUnlock(tabId, sourceEl) {
  const rule = getTabRule(tabId);
  if (!rule || isTabUnlocked(tabId)) return true;
  if (rule.minLevel && state.level < rule.minLevel) {
    if (sourceEl) createFloatText(sourceEl, `Reach level ${rule.minLevel}`, '#ff6ea8');
    return false;
  }
  if (!rule.cost) return false;
  const { currency, amount } = rule.cost;
  if (state[currency] < amount) {
    if (sourceEl) createFloatText(sourceEl, 'Insufficient resources', '#ff6ea8');
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
  if (sourceEl) createFloatText(sourceEl, 'Unlocked!', '#76f4c6');
  return true;
}

function attemptUpgradeSectionUnlock(sectionId, sourceEl) {
  const rule = getUpgradeSectionRule(sectionId);
  if (!rule || isUpgradeSectionUnlocked(sectionId)) return true;
  if (rule.minLevel && state.level < rule.minLevel) {
    if (sourceEl) createFloatText(sourceEl, `Reach level ${rule.minLevel}`, '#ff6ea8');
    return false;
  }
  if (!rule.cost) return false;
  const { currency, amount } = rule.cost;
  if (state[currency] < amount) {
    if (sourceEl) createFloatText(sourceEl, 'Insufficient resources', '#ff6ea8');
    return false;
  }
  state[currency] -= amount;
  if (rule.stateKey) {
    state[rule.stateKey] = true;
  }
  updateResources();
  if (sourceEl) createFloatText(sourceEl, 'Unlocked!', '#76f4c6');
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
    btn.textContent = requirement ? `${baseLabel} (${requirement})` : baseLabel;
    btn.setAttribute('aria-disabled', unlocked ? 'false' : 'true');
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
    item.textContent = change;
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
    openUpdateLog(GAME_VERSION, false);
    state.lastSeenVersion = GAME_VERSION;
    queueSave();
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
  const paletteSelect = document.getElementById('palette-select');
  if (paletteSelect) {
    paletteSelect.addEventListener('change', (e) => {
      const nextPalette = e.target.value;
      if (state.settings.palette !== nextPalette) {
        state.paletteChangeCount = (state.paletteChangeCount || 0) + 1;
      }
      state.settings.palette = nextPalette;
      applyDisplaySettings();
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

function applyDisplaySettings() {
  document.body.classList.toggle('disable-crt', !state.settings.crt);
  document.body.classList.toggle('disable-scanlines', !state.settings.scanlines);
  document.body.classList.toggle('reduced-motion', state.settings.reducedAnimation);
  document.body.classList.remove('palette-violet', 'palette-emerald');
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

function generateSkins() {
  skins = [
    { id: 'default', name: 'Default Core', cost: 0, description: 'Standard breach-grade node.' },
    {
      id: 'midnight',
      name: 'Midnight Bloom',
      cost: 1500,
      description: 'Orbital halo with drifting starlight around a midnight core.',
    },
    {
      id: 'ember',
      name: 'Ember Pulse',
      cost: 4000,
      description: 'Forged casing split with molten fractures and radiant sparks.',
    },
    {
      id: 'glitch',
      name: 'Glitch Prism',
      cost: 12000,
      description: 'Reality-warping shader, shifts per click.',
    },
    {
      id: 'aurora',
      name: 'Aurora Silk',
      cost: 25000,
      description: 'Multilayer lattice of refracted light and harmonic pulses.',
    },
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
      stats.critChance += data.perLevel * level;
      stats.critMultiplier *= Math.pow(data.multiplierGrowth || 1, level);
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
      const perLevel =
        family.key === 'economy' ? 5 * Math.pow(3.3, i) : 0.09 * Math.pow(2.2, i);
      const costBase = family.baseCost * 2 ** tierIndex;
      const costScale = 1.5;
      const id = `${family.key.toUpperCase()}_${idCounter}`;
      const tierLabel = tierIndex === 0 ? '' : ` ${romanNumeral(tierIndex + 1)}`;
      const name = `${family.baseName}${tierLabel} ${romanNumeral(withinTier + 1)}`;
      const desc = describeUpgrade(family.key, perLevel, maxLevel);
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
          effects[family.key](statsObj, level, { perLevel, family, multiplierGrowth: family.key === 'crit' ? 1.5 : 1 }),
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
    costBase: 240000,
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
    case 'crit':
      return `+${(perLevel * 100).toFixed(1)}% crit chance / level, +1.5x crit multiplier / level`;
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

function generateAreaUpgrades() {
  areaUpgradeDefs = [];
}

function generateSpawnUpgrades() {
  spawnUpgradeDefs = [
    {
      id: 'tachyon-injector',
      name: 'Tachyon Injector',
      description: '-0.12s spawn delay per level',
      maxLevel: 12,
      costBase: 320,
      costScale: 1.42,
      currency: 'bits',
      delayReduction: 0.12,
      effect: (statsObj, level, upgrade) => {
        statsObj.nodeSpawnDelay = Math.max(0.2, statsObj.nodeSpawnDelay - upgrade.delayReduction * level);
      },
    },
    {
      id: 'replication-forge',
      name: 'Replication Forge',
      description: '-0.08s spawn delay & +max nodes',
      maxLevel: 9,
      costBase: 1800,
      costScale: 1.55,
      currency: 'bits',
      delayReduction: 0.08,
      nodeBonusInterval: 2,
      effect: (statsObj, level, upgrade) => {
        statsObj.nodeSpawnDelay = Math.max(0.2, statsObj.nodeSpawnDelay - upgrade.delayReduction * level);
        statsObj.maxNodes += Math.floor(level / upgrade.nodeBonusInterval);
      },
    },
    {
      id: 'entropy-splicer',
      name: 'Entropy Splicer',
      description: '-0.15s spawn delay per level',
      maxLevel: 6,
      costBase: 5200,
      costScale: 1.7,
      currency: 'prestige',
      delayReduction: 0.15,
      minDelay: 0.05,
      effect: (statsObj, level, upgrade) => {
        statsObj.nodeSpawnDelay = Math.max(upgrade.minDelay, statsObj.nodeSpawnDelay - upgrade.delayReduction * level);
      },
    },
    {
      id: 'fractal-hatchery',
      name: 'Fractal Hatchery',
      description: '+2 max nodes & -0.25s spawn delay per level',
      maxLevel: 10,
      costBase: 8200,
      costScale: 1.6,
      currency: 'bits',
      delayReduction: 0.25,
      nodeBonus: 2,
      minDelay: 0.08,
      effect: (statsObj, level, upgrade) => {
        statsObj.nodeSpawnDelay = Math.max(upgrade.minDelay, statsObj.nodeSpawnDelay - upgrade.delayReduction * level);
        statsObj.maxNodes += upgrade.nodeBonus * level;
      },
    },
    {
      id: 'hypergrid-overclocker',
      name: 'Hypergrid Overclocker',
      description: '-0.45s spawn delay & +3 max nodes per level',
      maxLevel: 6,
      costBase: 52000,
      costScale: 1.9,
      currency: 'prestige',
      delayReduction: 0.45,
      nodeBonus: 3,
      minDelay: 0.05,
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
    {
      id: 'tachyon-conductors',
      name: 'Tachyon Conductors',
      description: '-0.09s auto interval per level',
      maxLevel: 5,
      costBase: 12000,
      costScale: 1.52,
      currency: 'prestige',
      intervalReduction: 0.09,
      minInterval: 0.08,
      effect: (statsObj, level, upgrade) => {
        statsObj.autoInterval = Math.max(upgrade.minInterval, statsObj.autoInterval - upgrade.intervalReduction * level);
      },
    },
  ];
}

function generateCollectUpgrades() {
  collectUpgradeDefs = [
    {
      id: 'magnetic-sheath',
      name: 'Magnetic Sheath',
      description: '+18px bit collection radius per level',
      maxLevel: 10,
      costBase: 180,
      costScale: 1.36,
      currency: 'bits',
      radiusPerLevel: 18,
      effect: (statsObj, level, upgrade) => {
        statsObj.bitCollectRadius += upgrade.radiusPerLevel * level;
      },
    },
    {
      id: 'orbital-graviton',
      name: 'Orbital Graviton',
      description: '+30px bit collection radius per level',
      maxLevel: 8,
      costBase: 2400,
      costScale: 1.48,
      currency: 'bits',
      radiusPerLevel: 30,
      effect: (statsObj, level, upgrade) => {
        statsObj.bitCollectRadius += upgrade.radiusPerLevel * level;
      },
    },
    {
      id: 'phase-lens-array',
      name: 'Phase Lens Array',
      description: '+42px bit collection radius per level',
      maxLevel: 6,
      costBase: 7200,
      costScale: 1.62,
      currency: 'prestige',
      radiusPerLevel: 42,
      effect: (statsObj, level, upgrade) => {
        statsObj.bitCollectRadius += upgrade.radiusPerLevel * level;
      },
    },
    {
      id: 'flux-harvester',
      name: 'Flux Harvester',
      description: '+16px collection radius & +8% bit gains per level',
      maxLevel: 6,
      costBase: 12600,
      costScale: 1.44,
      currency: 'bits',
      radiusPerLevel: 16,
      bitGainPerLevel: 0.08,
      effect: (statsObj, level, upgrade) => {
        statsObj.bitCollectRadius += upgrade.radiusPerLevel * level;
        statsObj.bitGain += upgrade.bitGainPerLevel * level;
      },
    },
    {
      id: 'quantum-rake',
      name: 'Quantum Rake',
      description: '+22px collection radius & +12% bit gains per level',
      maxLevel: 4,
      costBase: 22000,
      costScale: 1.56,
      currency: 'prestige',
      radiusPerLevel: 22,
      bitGainPerLevel: 0.12,
      effect: (statsObj, level, upgrade) => {
        statsObj.bitCollectRadius += upgrade.radiusPerLevel * level;
        statsObj.bitGain += upgrade.bitGainPerLevel * level;
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
        : `Cost: <span>${cost.toLocaleString()}</span> ${upgrade.currency}${prestigeCost ? ` + ${prestigeCost} Prestige` : ''}`}</div>
    `;
    const resourcePool = upgrade.currency === 'prestige' ? state.prestige : state.bits;
    const affordable = !maxed && resourcePool >= cost && state.prestige >= prestigeCost;
    button.classList.toggle('available', affordable);
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

function renderUpgrades(filter) {
  if (!UI.skillTree) return;
  const buttonFilter = document.querySelector('.filter.active')?.dataset.filter;
  const activeFilter = filter || state.selectedUpgradeFilter || buttonFilter || 'damage';
  state.selectedUpgradeFilter = activeFilter;
  syncFilterButtons(activeFilter);
  UI.skillTree.innerHTML = '';
  const fragment = document.createDocumentFragment();
  const categorySequences = buildCategorySequences();
  const visibleUpgrades = getVisibleUpgradeSet(activeFilter, categorySequences);
  const branchMap = new Map();
  const branchCounters = new Map();
  upgrades.forEach((upgrade) => {
    if (!isCategoryVisible(upgrade.category, activeFilter)) {
      return;
    }
    if (!visibleUpgrades.has(upgrade.id)) {
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
        const displayName = getUpgradeDisplayName(upgrade, level);
        nodeEl.innerHTML = `
          <div class="title">${displayName}</div>
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
  if (UI.upgradeCount) {
    UI.upgradeCount.textContent = `${totalPurchased}`;
  }
  if (UI.upgradeTotal) {
    UI.upgradeTotal.textContent = upgrades.length;
  }
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

function attemptPurchase(upgrade) {
  const level = state.upgrades[upgrade.id] || 0;
  if (level >= upgrade.maxLevel) {
    return;
  }
  if (!meetsRequirements(upgrade)) {
    return;
  }
  const cost = getUpgradeCost(upgrade, level);
  if (state[upgrade.currency] >= cost) {
    state[upgrade.currency] -= cost;
    state.upgrades[upgrade.id] = level + 1;
    updateStats();
    updateResources();
    const activeFilter =
      document.querySelector('.filter.active')?.dataset.filter || state.selectedUpgradeFilter || 'damage';
    renderUpgrades(activeFilter);
    renderMilestones();
    maybeStartSkillCheck(upgrade, cost, level);
    queueSave();
  }
}

function maybeStartSkillCheck(upgrade, cost, previousLevel) {
  if (skillCheckState.active) return;
  const baseChance = 0.18;
  if (Math.random() > baseChance) {
    return;
  }
  const difficulty = upgrade.category === 'damage' ? 'easy' : 'normal';
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
    onFail: () => {
      const penalty = Math.min(state[upgrade.currency], cost);
      state[upgrade.currency] -= penalty;
      state.upgrades[upgrade.id] = previousLevel;
      updateStats();
      updateResources();
      const activeFilter =
        document.querySelector('.filter.active')?.dataset.filter || state.selectedUpgradeFilter || 'damage';
      renderUpgrades(activeFilter);
      renderMilestones();
      createFloatText(UI.customCursor || document.body, `-${penalty} ${upgrade.currency}`, '#ff6ea8');
      queueSave();
    },
  });
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
      <div class="card-header">
        <strong>${milestone.label}</strong>
        <span class="${statusClass}">${progress.claimed ? 'Claimed' : progress.ready ? 'Reward ready' : 'In progress'}</span>
      </div>
      <div class="card-body">${describeMilestone(milestone)}</div>
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
  'Thousand',
  'Million',
  'Billion',
  'Trillion',
  'Quadrillion',
  'Quintillion',
  'Sextillion',
  'Septillion',
  'Octillion',
  'Nonillion',
  'Decillion',
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
  const formatted = scaled.toFixed(precision).replace(/\.0+$|0+$/u, '');
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
      description: 'Reach level 5.',
      goal: 5,
      difficulty: 'standard',
      stat: () => state.level,
    }),
    createAchievement({
      id: 'level-15',
      label: 'Unending Ascent',
      description: 'Reach level 15.',
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
      description: 'Reach level 1,000.',
      goal: 1000,
      difficulty: 'hard',
      stat: () => state.level,
    }),
    createAchievement({
      id: 'level-10000',
      label: 'Ten-Thousandth Gate',
      description: 'Reach level 10,000.',
      goal: 10000,
      difficulty: 'legendary',
      stat: () => state.level,
    }),
    createAchievement({
      id: 'level-50000',
      label: 'Ascension Stack',
      description: 'Reach level 50,000.',
      goal: 50000,
      difficulty: 'legendary',
      stat: () => state.level,
    }),
    createAchievement({
      id: 'level-200000',
      label: 'Beyond Simulation',
      description: 'Reach level 200,000.',
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
  renderCryptoSpeedUpgrades();
}

function depositToCrypto(amount) {
  if (!state.cryptoUnlocked) return;
  if (state.bits >= amount) {
    state.bits -= amount;
    state.crypto.deposit += amount;
    recalculateCryptoRate();
    state.crypto.timeRemaining = Math.max(10, Math.log(state.crypto.deposit + 1) * 30);
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

function renderCryptoSpeedUpgrades() {
  if (!UI.cryptoSpeedUpgrades) return;
  UI.cryptoSpeedUpgrades.innerHTML = '';
  CRYPTO_SPEED_UPGRADES.forEach((tier) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'pill';
    const purchased = Boolean(state.crypto.speedUpgrades[tier.id]);
    const affordable = state.cryptcoins >= tier.cost;
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
  UI.cryptoDeposited.textContent = formatNumberShort(state.crypto.deposit);
  UI.cryptoReturns.textContent = `${formatNumberShort(state.crypto.rate)} / sec`;
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
    option.textContent = `Level ${i}`;
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
  loadSFX();
  bgmAudio = document.getElementById('bgm');
  if (!bgmAudio) {
    audioUnlocked = true;
    return;
  }
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
  const pulse = document.createElement('div');
  pulse.className = 'cursor-pulse';
  pulse.style.left = `${x}px`;
  pulse.style.top = `${y}px`;
  pulse.style.imageRendering = 'pixelated';
  pulse.style.setProperty('--cursor-size', `${getCursorDisplaySize()}px`);
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
  if (!UI.skillCheck || !UI.skillCheckAction || !UI.skillCheckProgress || !UI.skillCheckSlider || !UI.skillCheckTarget) {
    return;
  }
  UI.skillCheckAction.addEventListener('click', attemptSkillCheckResolution);
  UI.skillCheckAction.addEventListener('keydown', (event) => {
    if (!skillCheckState.active) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      attemptSkillCheckResolution();
    }
  });
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

function attemptSkillCheckResolution() {
  if (!skillCheckState.active) return;
  const withinWindow =
    skillCheckState.sliderPosition >= skillCheckState.targetStart &&
    skillCheckState.sliderPosition <= skillCheckState.targetEnd;
  resolveSkillCheck(withinWindow);
}

function startSkillCheck({ upgrade, difficulty, reward, onFail }) {
  if (!UI.skillCheck || !UI.skillCheckAction || !UI.skillCheckTarget || !UI.skillCheckSlider) return;
  const config = getSkillCheckConfig(difficulty);
  const sliderPosition = Math.min(0.95, Math.max(0.05, Math.random()));
  const sliderDirection = sliderPosition > 0.5 ? -1 : 1;
  const maxTargetStart = Math.max(0, 1 - config.windowSize);
  const targetStart = maxTargetStart > 0 ? Math.random() * maxTargetStart : 0;
  skillCheckState.active = true;
  skillCheckState.timer = 0;
  skillCheckState.duration = config.duration;
  skillCheckState.reward = reward;
  skillCheckState.onFail = onFail || null;
  skillCheckState.sliderSpeed = config.sliderSpeed;
  skillCheckState.windowSize = config.windowSize;
  skillCheckState.sliderPosition = sliderPosition;
  skillCheckState.sliderDirection = sliderDirection;
  skillCheckState.targetStart = targetStart;
  skillCheckState.targetEnd = targetStart + config.windowSize;
  skillCheckState.difficulty = difficulty;
  UI.skillCheckTitle.textContent = `${difficulty.toUpperCase()} skill check`;
  UI.skillCheckDescription.textContent = `Time the resolve pulse when the signal crosses the highlighted zone around ${upgrade.name}.`;
  UI.skillCheck.classList.remove('hidden');
  if (UI.skillCheckTarget) {
    UI.skillCheckTarget.style.left = `${skillCheckState.targetStart * 100}%`;
    UI.skillCheckTarget.style.width = `${skillCheckState.windowSize * 100}%`;
  }
  if (UI.skillCheckSlider) {
    UI.skillCheckSlider.style.left = `${skillCheckState.sliderPosition * 100}%`;
  }
  if (UI.skillCheckProgress) {
    UI.skillCheckProgress.style.width = '100%';
  }
  UI.skillCheckAction.focus();
}

function resolveSkillCheck(success) {
  if (!skillCheckState.active) return;
  skillCheckState.active = false;
  if (UI.skillCheck) {
    UI.skillCheck.classList.add('hidden');
  }
  if (success && typeof skillCheckState.reward === 'function') {
    skillCheckState.reward();
  } else if (!success) {
    if (typeof skillCheckState.onFail === 'function') {
      skillCheckState.onFail();
    } else {
      createFloatText(document.body, 'Skill check failed', '#ff6ea8');
    }
  }
  skillCheckState.reward = null;
  skillCheckState.onFail = null;
  skillCheckState.sliderSpeed = 0;
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
}

function updateSkillCheck(delta) {
  if (!skillCheckState.active) return;
  skillCheckState.timer += delta;
  const elapsed = Math.min(1, skillCheckState.timer / skillCheckState.duration);
  if (UI.skillCheckProgress) {
    UI.skillCheckProgress.style.width = `${Math.max(0, (1 - elapsed) * 100)}%`;
  }
  if (skillCheckState.sliderSpeed > 0) {
    skillCheckState.sliderPosition += skillCheckState.sliderSpeed * delta * skillCheckState.sliderDirection;
    if (skillCheckState.sliderPosition >= 1) {
      skillCheckState.sliderPosition = 1;
      skillCheckState.sliderDirection = -1;
    } else if (skillCheckState.sliderPosition <= 0) {
      skillCheckState.sliderPosition = 0;
      skillCheckState.sliderDirection = 1;
    }
    if (UI.skillCheckSlider) {
      UI.skillCheckSlider.style.left = `${skillCheckState.sliderPosition * 100}%`;
    }
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
    const delta = (now - last) / 1000;
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

function updateNodes(delta) {
  if (!UI.nodeArea) return;
  if (!state.currentLevel.active) return;
  nodeSpawnTimer -= delta;
  if (nodeSpawnTimer <= 0 && activeNodes.size < stats.maxNodes) {
    spawnNode();
    nodeSpawnTimer = Math.max(0.15, stats.nodeSpawnDelay);
  }
  const areaRect = getNodeAreaRect();
  if (!areaRect) return;
  const { width, height } = areaRect;
  activeNodes.forEach((node) => {
    node.position.x += node.velocity.x * delta;
    node.position.y += node.velocity.y * delta;
    node.rotation += node.rotationSpeed * delta;
    applyNodeTransform(node);
    const bounds = node.bounds;
    if (
      node.position.x < -bounds ||
      node.position.x > width + bounds ||
      node.position.y < -bounds ||
      node.position.y > height + bounds
    ) {
      node.el?.remove();
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
  const areaRect = getNodeAreaRect();
  if (!areaRect || areaRect.width <= 0 || areaRect.height <= 0) return;
  const inside = isPointerInsideNodeArea(cursorPosition.x, cursorPosition.y, areaRect);
  if (!inside) return;
  const pointerX = cursorPosition.x;
  const pointerY = cursorPosition.y;
  if (!isNodeAreaInteractive(pointerX, pointerY)) return;
  playSFX('pointerAtk');
  triggerCursorClickAnimation(pointerX, pointerY);
  const pointerRect = getPointerRect(pointerX, pointerY);
  const pointerPolygon = getPointerPolygon(pointerRect);
  let hitSomething = false;
  const nodesHit = [];
  activeNodes.forEach((node) => {
    if (!node.el) return;
    const nodePolygon = getNodePolygon(node, areaRect);
    if (polygonsIntersect(pointerPolygon, nodePolygon)) {
      nodesHit.push(node);
    }
  });
  if (nodesHit.length > 0) {
    nodesHit.forEach((node) => strikeNode(node));
    hitSomething = true;
  }
  if (hitSomething) {
    playPointerHitSFX();
  }
}

function spawnNode() {
  if (!UI.nodeArea) return;
  const areaRect = getNodeAreaRect();
  if (!areaRect) return;
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
    rotationSpeed: (Math.random() - 0.5) * 28,
    bounds: margin,
  };
  const el = document.createElement('div');
  el.className = `node ${type.color} skin-${state.skins.active}`;
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
  el.style.transition = 'none';
  node.el = el;
  node.visualEl = visual;
  node.fillEl = fill;
  node.healthRingEl = healthRing;
  node.hpEl = hpLabel;
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
  if (roll > 0.995) return nodeTypes[2];
  if (roll > 0.6) return nodeTypes[1];
  return nodeTypes[0];
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
    createFloatText(node.el, 'CRIT!', '#ff6ea8');
  }
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
  node.el.classList.remove('shaking');
  node.el.classList.remove('hit');
  // force reflow so the animation can restart even during rapid hits
  void node.el.offsetWidth;
  node.el.classList.add('shaking', 'hit');
  if (node.shakeTimeout) clearTimeout(node.shakeTimeout);
  if (node.hitTimeout) clearTimeout(node.hitTimeout);
  node.shakeTimeout = setTimeout(() => node.el && node.el.classList.remove('shaking'), 240);
  node.hitTimeout = setTimeout(() => node.el && node.el.classList.remove('hit'), 220);
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
  if (typeId === 'gold') return Math.round(randomInRange(200, 400));
  return 0;
}

function destroyNode(node) {
  const rewardsGranted = dropRewards(node);
  playSFX('nodeDie');
  const key = node.type.id;
  state.nodesDestroyed[key] = (state.nodesDestroyed[key] || 0) + 1;
  createNodeExplosion(node);
  if (node.type?.id === 'gold') {
    createGoldenBitBurst(node);
  }
  spawnBitTokens(node, rewardsGranted?.bits || 0);
  if (node.shakeTimeout) clearTimeout(node.shakeTimeout);
  if (node.hitTimeout) clearTimeout(node.hitTimeout);
  node.el.remove();
  activeNodes.delete(node.id);
  renderMilestones();
}

function dropRewards(node) {
  const type = node?.type || nodeTypes[0];
  const rewards = type.reward(state.currentLevel.index);
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
  }
  updateResources();
  queueSave(2000);
  return { bits: harvestedBits };
}

function updateNodeElement(node) {
  if (!node.el) return;
  const hpEl = node.hpEl || node.el.querySelector('.hp');
  if (hpEl) {
    hpEl.textContent = `${Math.max(0, Math.ceil(node.hp))}`;
    node.hpEl = hpEl;
  }
  const fillEl = node.fillEl || node.el.querySelector('.fill');
  if (fillEl) {
    const ratio = Math.max(0, Math.min(1, node.hp / node.maxHP));
    const healthColor = ratio > 0.66 ? 'rgba(127, 255, 214, 0.95)' : ratio > 0.33 ? '#ffd166' : '#ff6ea8';
    node.el.style.setProperty('--hp-ratio', ratio);
    node.el.style.setProperty('--hp-color', healthColor);
    if (node.healthRingEl) {
      node.healthRingEl.style.setProperty('--hp-ratio', ratio);
      node.healthRingEl.style.setProperty('--hp-color', healthColor);
    }
    fillEl.style.transform = `scaleY(${ratio})`;
    node.fillEl = fillEl;
  }
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

function createGoldenBitBurst(node) {
  if (!UI.particleLayer || !node.el || state.settings.reducedAnimation) return;
  const areaRect = UI.nodeArea.getBoundingClientRect();
  const nodeRect = node.el.getBoundingClientRect();
  const x = nodeRect.left - areaRect.left + nodeRect.width / 2;
  const y = nodeRect.top - areaRect.top + nodeRect.height / 2;
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
  const areaRect = UI.nodeArea.getBoundingClientRect();
  const nodeRect = node.el.getBoundingClientRect();
  const centerX = nodeRect.left - areaRect.left + nodeRect.width / 2;
  const centerY = nodeRect.top - areaRect.top + nodeRect.height / 2;
  const baseCount = 3 + Math.floor(Math.random() * 3);
  const tokenCount = state.settings.reducedAnimation ? Math.max(1, Math.floor(baseCount / 2)) : baseCount;
  const valueBase = Math.max(1, Math.round(4 + state.currentLevel.index * 1.2));
  const isGold = node?.type?.id === 'gold';
  const tokenValues = [];
  const normalizedReward = Math.max(0, rewardBits);
  const desiredTotal = normalizedReward > 0 ? Math.max(tokenCount, Math.round(normalizedReward * 0.2)) : valueBase * tokenCount;
  const goldBase = isGold ? Math.max(valueBase, Math.ceil(desiredTotal / tokenCount)) : valueBase;
  for (let i = 0; i < tokenCount; i += 1) {
    let tokenValue = isGold
      ? Math.round(goldBase * (0.7 + Math.random() * 0.6))
      : valueBase + Math.floor(Math.random() * valueBase);
    if (isGold && i === tokenCount - 1) {
      const runningTotal = tokenValues.reduce((sum, val) => sum + val, 0);
      tokenValue = Math.max(tokenValue, desiredTotal - runningTotal);
    }
    tokenValues.push(tokenValue);
  }
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
    UI.bitLayer.appendChild(token);
    requestAnimationFrame(() => token.classList.add('visible'));
  }
  requestBitTokenSweep();
}

function collectBitToken(token) {
  if (!token || token.classList.contains('collecting')) return;
  const areaRect = UI.nodeArea.getBoundingClientRect();
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
    createFloatText(activeBoss.el, 'CRIT!', '#ff6ea8');
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
  state.currentLevel.bossHP -= effectiveDamage;
  state.currentLevel.bossDamageDealt = Math.max(0, (state.currentLevel.bossDamageDealt || 0) + effectiveDamage);
  if (activeBoss?.el) {
    createFloatText(activeBoss.el, `-${Math.round(effectiveDamage)}`, 'var(--accent)');
    showBossDamageNumber(effectiveDamage);
  }
  updateBossDamageCounter();
  updateBossBar();
  if (state.currentLevel.bossHP <= 0) {
    defeatBoss();
  }
}

function showBossDamageNumber(damage) {
  if (!activeBoss?.el) return;
  const number = document.createElement('div');
  number.className = 'boss-damage-number';
  number.textContent = `-${Math.round(damage)}`;
  activeBoss.el.appendChild(number);
  requestAnimationFrame(() => number.classList.add('visible'));
  setTimeout(() => number.remove(), 320);
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
}

function playBossDefeatAnimation(bossEl) {
  if (!bossEl || state.settings.reducedAnimation) return Promise.resolve();
  const baseTransform = bossEl.style.transform || '';
  return new Promise((resolve) => {
    const animation = bossEl.animate(
      [
        { transform: `${baseTransform} scale(1)`, opacity: 1, filter: 'drop-shadow(0 0 0 rgba(255, 209, 127, 0.5))' },
        { transform: `${baseTransform} scale(1.08) rotate(2deg)`, opacity: 1, filter: 'drop-shadow(0 0 24px rgba(255, 209, 127, 0.75))' },
        { transform: `${baseTransform} scale(0.15) rotate(-12deg)`, opacity: 0, filter: 'drop-shadow(0 0 32px rgba(255, 243, 191, 0.9))' },
      ],
      { duration: 640, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'forwards' },
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
  stats.nodeSpawnDelay = 2;
  stats.maxNodes = 4;
  stats.nodeHPFactor = 1 + state.currentLevel.index * 0.03;
  stats.bossHPFactor = 1;
  stats.nodeCountDamageBonus = 0;
  stats.bossKillDamageRamp = 0;
  stats.maxHealth = 100 + state.level * 5;
  const levelPressure = Math.max(0, state.currentLevel.index - 1);
  const spawnAcceleration = Math.min(1.2, levelPressure * 0.04);
  stats.nodeSpawnDelay = Math.max(0.6, stats.nodeSpawnDelay - spawnAcceleration);
  stats.maxNodes += Math.floor(levelPressure / 5);
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
  stats.nodeSpawnDelay = Math.max(0.05, stats.nodeSpawnDelay);
  state.maxHealth = stats.maxHealth;
  state.health = Math.min(state.health, state.maxHealth);
  applyCursorSize();
  persistStatsSnapshot();
}

function updateResources() {
  UI.bits.textContent = formatNumberShort(Math.floor(state.bits));
  UI.cryptcoins.textContent = formatNumberShort(Math.floor(state.cryptcoins));
  UI.prestige.textContent = formatNumberShort(Math.floor(state.prestige));
  UI.xp.textContent = `${formatNumberShort(Math.floor(state.xp))} (${formatNumberShort(
    Math.floor(state.levelXP),
  )}/${formatNumberShort(Math.floor(state.xpForNext))})`;
  UI.level.textContent = formatNumberShort(state.level);
  UI.lp.textContent = formatNumberShort(state.lp);
  UI.currentLevel.textContent = state.currentLevel.index;
  updateCryptoUI();
  renderCryptoSpeedUpgrades();
  updateLabUI();
  renderAreaUpgrades();
  renderCollectUpgrades();
  renderSpawnUpgrades();
  renderSpeedUpgrades();
  updateTabAvailability();
  updateUpgradeTabAvailability();
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
});
