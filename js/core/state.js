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
      green: 0,
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

const DEFAULT_STATE_SERIALIZED = JSON.stringify(createInitialState(), stateReplacer);
let autoSaveHandle = null;
let saveTimeout = null;
let saveStatusTimer = null;

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
