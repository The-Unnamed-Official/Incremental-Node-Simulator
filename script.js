const TICK_RATE = 1000 / 60;
const BOSS_TIMER = 60;

const state = {
  bits: 0,
  netcoins: 0,
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
    timer: BOSS_TIMER,
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
  settings: {
    crt: true,
    scanlines: true,
    screenShake: 50,
    bgm: 0.5,
    sfx: 0.7,
    palette: 'default',
  },
};

const stats = {
  baseDamage: 5,
  damage: 5,
  critChance: 0.05,
  critMultiplier: 2,
  autoDamage: 0,
  autoInterval: 1,
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
      return { bits: 80 + level * 12, netcoins: 1 + level * 0.1 };
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

let upgrades = [];
let milestones = [];
let achievements = [];
let skins = [];
let tooltipEl;
let achievementTimer = 0;

const UI = {};

document.addEventListener('DOMContentLoaded', () => {
  cacheElements();
  setupTabs();
  setupFilters();
  setupSettings();
  generateSkins();
  generateUpgrades();
  generateMilestones();
  generateAchievements();
  renderSkins();
  renderUpgrades();
  renderMilestones();
  renderAchievements();
  initTooltip();
  setupCryptoControls();
  setupLabControls();
  setupGameplayControls();
  updateResources();
  startGameLoop();
});

function cacheElements() {
  UI.bits = document.getElementById('bits-display');
  UI.netcoins = document.getElementById('netcoin-display');
  UI.prestige = document.getElementById('prestige-display');
  UI.xp = document.getElementById('xp-display');
  UI.level = document.getElementById('level-display');
  UI.lp = document.getElementById('lp-display');
  UI.upgradeGrid = document.getElementById('upgrade-grid');
  UI.upgradeCount = document.getElementById('upgrade-count');
  UI.weirdProgress = document.getElementById('weird-progress');
  UI.nodeArea = document.getElementById('node-area');
  UI.bossArea = document.getElementById('boss-area');
  UI.bossProgress = document.getElementById('boss-progress');
  UI.bossTimer = document.getElementById('boss-timer');
  UI.levelReset = document.getElementById('level-reset');
  UI.autoNode = document.getElementById('auto-node');
  UI.currentLevel = document.getElementById('current-level');
  UI.health = document.getElementById('health-display');
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
      renderUpgrades(value);
    });
  });
}

function setupSettings() {
  UI.toggleCRT.addEventListener('click', () => {
    state.settings.crt = !state.settings.crt;
    document.body.classList.toggle('no-crt', !state.settings.crt);
    UI.toggleCRT.textContent = state.settings.crt ? 'CRT ON' : 'CRT OFF';
  });
  const screenShake = document.getElementById('screen-shake');
  screenShake.addEventListener('input', (e) => {
    state.settings.screenShake = Number(e.target.value);
  });
  const crtToggle = document.getElementById('crt-toggle');
  crtToggle.addEventListener('change', (e) => {
    state.settings.crt = e.target.checked;
    document.body.classList.toggle('no-crt', !state.settings.crt);
    UI.toggleCRT.textContent = state.settings.crt ? 'CRT ON' : 'CRT OFF';
  });
  const scanlineToggle = document.getElementById('scanline-toggle');
  scanlineToggle.addEventListener('change', (e) => {
    state.settings.scanlines = e.target.checked;
    document.body.classList.toggle('no-crt', !state.settings.scanlines);
  });
  const paletteSelect = document.getElementById('palette-select');
  paletteSelect.addEventListener('change', (e) => {
    document.body.classList.remove('palette-default', 'palette-violet', 'palette-emerald');
    const palette = e.target.value;
    state.settings.palette = palette;
    if (palette !== 'default') {
      document.body.classList.add(`palette-${palette}`);
    }
  });
  document.getElementById('bgm-volume').addEventListener('input', (e) => {
    state.settings.bgm = Number(e.target.value) / 100;
  });
  document.getElementById('sfx-volume').addEventListener('input', (e) => {
    state.settings.sfx = Number(e.target.value) / 100;
  });
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
        }
      } else {
        state.skins.active = skin.id;
        renderSkins();
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

function renderUpgrades(filter = 'all') {
  UI.upgradeGrid.innerHTML = '';
  const fragment = document.createDocumentFragment();
  let purchased = 0;
  upgrades.forEach((upgrade) => {
    if (filter !== 'all' && upgrade.category !== filter) {
      return;
    }
    const level = state.upgrades[upgrade.id] || 0;
    if (level >= upgrade.maxLevel) {
      purchased += 1;
    }
    const card = document.createElement('div');
    card.className = 'upgrade-card';
    card.dataset.id = upgrade.id;
    card.dataset.category = upgrade.category;
    if (level >= upgrade.maxLevel) {
      card.classList.add('purchased');
    }
    if (!meetsRequirements(upgrade)) {
      card.classList.add('locked');
    }
    card.innerHTML = `
      <div class="core"></div>
      <div class="title">${upgrade.name}</div>
      <div class="desc">${upgrade.description}</div>
      <div class="level">Level ${level} / ${upgrade.maxLevel}</div>
      <div class="cost">Cost: <span>${formatCost(upgrade, level)}</span> ${upgrade.currency}</div>
    `;
    card.addEventListener('click', () => attemptPurchase(upgrade));
    card.addEventListener('mousemove', (event) => showUpgradeTooltip(event, upgrade));
    card.addEventListener('mouseleave', hideTooltip);
    fragment.appendChild(card);
  });
  UI.upgradeGrid.appendChild(fragment);
  const totalPurchased = Object.keys(state.upgrades).length;
  UI.upgradeCount.textContent = `${totalPurchased}`;
  UI.weirdProgress.textContent = `${state.weirdSkillsPurchased} / 20`;
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
  }
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
    { type: 'gold', goal: 500, reward: () => grantNetcoins(50) },
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
    { id: 'crypto-hoard', label: 'Miner 49k', description: 'Accumulate 50k netcoins.', goal: 50000, stat: () => state.netcoins },
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
    if (Number.isFinite(amount) && amount > 0 && state.netcoins >= amount) {
      state.netcoins -= amount;
      state.labDeposited += amount;
      state.labSpeed = Math.sqrt(state.labDeposited) / 5 + state.weirdSkillsPurchased * 0.25;
      updateLabUI();
      updateResources();
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
    }
  });
}

function unlockLab() {
  state.labUnlocked = true;
  UI.labLocked.classList.add('hidden');
  UI.labPanel.classList.remove('hidden');
  renderAchievements();
}

function updateLabUI() {
  if (!state.labUnlocked) return;
  const progress = Math.min(1, state.labProgress / 1000);
  UI.labProgressFill.style.width = `${progress * 100}%`;
  UI.labProgressText.textContent = `${state.labProgress.toFixed(3)} / 1000.000`;
  UI.labSpeed.textContent = `${state.labSpeed.toFixed(3)} / sec`;
}

function setupGameplayControls() {
  UI.levelReset.addEventListener('click', () => {
    resetLevel(false);
  });
  UI.autoNode.addEventListener('click', () => {
    autoSpawnNode();
  });
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
  updateBoss(delta);
  updateCrypto(delta);
  updateLab(delta);
  achievementTimer += delta;
  if (achievementTimer >= 1) {
    renderAchievements();
    achievementTimer = 0;
  }
}

let nodeSpawnTimer = 0;
const activeNodes = new Map();

function updateNodes(delta) {
  nodeSpawnTimer -= delta;
  if (nodeSpawnTimer <= 0 && activeNodes.size < stats.maxNodes) {
    spawnNode();
    nodeSpawnTimer = Math.max(0.35, stats.nodeSpawnDelay - stats.weirdSynergy * 0.2);
  }
  activeNodes.forEach((node) => {
    node.hp = Math.min(node.maxHP, node.hp + stats.regen * delta);
    updateNodeElement(node);
  });
}

function spawnNode() {
  const area = UI.nodeArea.getBoundingClientRect();
  const type = weightedNodeType();
  const level = state.currentLevel.index;
  const hp = Math.ceil(type.hp(level) * stats.nodeHPFactor);
  const node = {
    id: `${type.id}-${Date.now()}-${Math.random()}`,
    type,
    hp,
    maxHP: hp,
  };
  const el = document.createElement('div');
  el.className = `node ${type.color} skin-${state.skins.active}`;
  el.style.left = `${Math.random() * (area.width - 90) + 10}px`;
  el.style.top = `${Math.random() * (area.height - 90) + 10}px`;
  el.innerHTML = '<div class="core"></div><div class="hp"></div>';
  el.addEventListener('click', () => strikeNode(node));
  UI.nodeArea.appendChild(el);
  node.el = el;
  activeNodes.set(node.id, node);
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
  createFloatText(node.el, `-${Math.round(damage)}`);
  if (node.hp <= 0) {
    destroyNode(node);
  } else {
    updateNodeElement(node);
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
  if (rewards.netcoins) {
    state.netcoins += rewards.netcoins;
  }
  updateResources();
}

function updateNodeElement(node) {
  if (!node.el) return;
  node.el.querySelector('.hp').textContent = `${Math.max(0, Math.ceil(node.hp))}`;
}

function updateLevel(delta) {
  const level = state.currentLevel;
  if (!level.active) return;
  level.timer -= delta;
  if (!level.bossActive) {
    const progress = Math.max(0, level.timer) / BOSS_TIMER;
    UI.bossProgress.style.width = `${(1 - progress) * 100}%`;
    UI.bossTimer.textContent = `${Math.max(0, level.timer).toFixed(1)}s`;
    if (level.timer <= 0) {
      spawnBoss();
    }
  }
}

function resetLevel(increase = true) {
  activeNodes.forEach((node) => node.el.remove());
  activeNodes.clear();
  state.currentLevel.timer = BOSS_TIMER;
  state.currentLevel.active = true;
  state.currentLevel.bossActive = false;
  UI.bossArea.innerHTML = '';
  if (increase) {
    state.currentLevel.index += 1;
    state.level = Math.max(state.level, state.currentLevel.index);
    gainXP(50 * state.currentLevel.index);
    state.lp += 1;
  }
  UI.currentLevel.textContent = state.currentLevel.index;
  updateStats();
  updateResources();
}

function spawnBoss() {
  const bossHP = Math.ceil((200 + state.currentLevel.index * 40) * stats.bossHPFactor);
  state.currentLevel.bossActive = true;
  state.currentLevel.bossHP = bossHP;
  state.currentLevel.bossMaxHP = bossHP;
  UI.bossArea.innerHTML = '';
  const boss = document.createElement('div');
  boss.className = 'boss';
  const name = bossNames[state.currentLevel.index % bossNames.length];
  boss.innerHTML = `
    <div>${name}</div>
    <div class="hp-bar"><div class="hp-fill"></div></div>
  `;
  boss.addEventListener('click', () => damageBoss(25));
  UI.bossArea.appendChild(boss);
}

function damageBoss(playerDamage) {
  if (!state.currentLevel.bossActive) return;
  const bossDamage = (stats.damage + playerDamage + stats.autoDamage) * (1 + stats.weirdSynergy);
  state.currentLevel.bossHP -= bossDamage;
  updateBossBar();
  if (state.currentLevel.bossHP <= 0) {
    defeatBoss();
  }
}

function updateBoss(delta) {
  if (!state.currentLevel.bossActive) return;
  const damage = Math.max(0, 5 + state.currentLevel.index * 1.5 - stats.defense);
  state.health = Math.max(0, state.health - damage * delta);
  if (state.health <= 0) {
    // fail level
    state.health = state.maxHealth;
    state.currentLevel.index = Math.max(1, state.currentLevel.index - 1);
    resetLevel(false);
  }
  updateBossBar();
  UI.health.textContent = `${Math.round(state.health)} / ${Math.round(state.maxHealth)}`;
}

function updateBossBar() {
  const bossEl = UI.bossArea.querySelector('.boss');
  if (!bossEl) return;
  const fill = bossEl.querySelector('.hp-fill');
  const ratio = Math.max(0, state.currentLevel.bossHP) / state.currentLevel.bossMaxHP;
  fill.style.width = `${ratio * 100}%`;
}

function defeatBoss() {
  state.currentLevel.bossActive = false;
  state.bossKills += 1;
  UI.bossArea.innerHTML = '';
  const rewardBits = 500 * state.currentLevel.index * stats.bitGain;
  const prestige = 1 * stats.prestigeGain;
  const xp = 120 * stats.xpGain;
  state.bits += rewardBits;
  gainXP(xp);
  grantPrestige(prestige);
  resetLevel(true);
}

function autoSpawnNode() {
  spawnNode();
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
  stats.bossHPFactor = 1 + state.currentLevel.index * 0.05;
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
  state.maxHealth = stats.maxHealth;
  state.health = Math.min(state.health, state.maxHealth);
  UI.health.textContent = `${Math.round(state.health)} / ${Math.round(state.maxHealth)}`;
}

function updateResources() {
  UI.bits.textContent = Math.floor(state.bits).toLocaleString();
  UI.netcoins.textContent = Math.floor(state.netcoins).toLocaleString();
  UI.prestige.textContent = Math.floor(state.prestige).toLocaleString();
  UI.xp.textContent = `${Math.floor(state.xp).toLocaleString()} (${Math.floor(state.levelXP)}/${Math.floor(state.xpForNext)})`;
  UI.level.textContent = state.level;
  UI.lp.textContent = state.lp;
  UI.currentLevel.textContent = state.currentLevel.index;
  updateCryptoUI();
  updateLabUI();
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

function grantNetcoins(amount) {
  state.netcoins += amount;
}

function grantPrestige(amount) {
  state.prestige += amount;
}

function updateCrypto(delta) {
  if (state.crypto.deposit <= 0 || state.crypto.rate <= 0) return;
  state.crypto.timeRemaining = Math.max(0, state.crypto.timeRemaining - delta);
  const generated = state.crypto.rate * delta;
  state.netcoins += generated;
  if (state.crypto.timeRemaining <= 0) {
    state.crypto.deposit = 0;
    state.crypto.rate = 0;
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
