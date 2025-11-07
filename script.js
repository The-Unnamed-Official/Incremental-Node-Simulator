const TICK_RATE = 1000 / 60;
const BOSS_TIMER = 60;
const NODE_SIZE = 82;

const state = {
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
};

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
  setupTabs();
  setupFilters();
  setupSettings();
  generateSkins();
  generateUpgrades();
  generateAutomationSkills();
  generateMilestones();
  generateAchievements();
  renderSkins();
  renderUpgrades();
  renderAutomationTree();
  renderMilestones();
  renderAchievements();
  initTooltip();
  setupCryptoControls();
  setupLabControls();
  setupLevelDialog();
  setupCursor();
  setupAudio();
  setupSkillCheck();
  updateResources();
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
  UI.bossProgress = document.getElementById('boss-progress');
  UI.bossTimer = document.getElementById('boss-timer');
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
  UI.automationTree = document.getElementById('automation-tree');
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
      renderUpgrades(value);
    });
  });
}

function setupSettings() {
  UI.toggleCRT.addEventListener('click', () => {
    state.settings.crt = !state.settings.crt;
    UI.toggleCRT.textContent = state.settings.crt ? 'CRT ON' : 'CRT OFF';
    applyDisplaySettings();
  });
  const screenShake = document.getElementById('screen-shake');
  screenShake.value = state.settings.screenShake;
  screenShake.addEventListener('input', (e) => {
    state.settings.screenShake = Number(e.target.value);
  });
  const crtToggle = document.getElementById('crt-toggle');
  crtToggle.checked = state.settings.crt;
  crtToggle.addEventListener('change', (e) => {
    state.settings.crt = e.target.checked;
    UI.toggleCRT.textContent = state.settings.crt ? 'CRT ON' : 'CRT OFF';
    applyDisplaySettings();
  });
  const scanlineToggle = document.getElementById('scanline-toggle');
  scanlineToggle.checked = state.settings.scanlines;
  scanlineToggle.addEventListener('change', (e) => {
    state.settings.scanlines = e.target.checked;
    applyDisplaySettings();
  });
  const reduceAnimationToggle = document.getElementById('reduce-animation');
  reduceAnimationToggle.checked = state.settings.reducedAnimation;
  reduceAnimationToggle.addEventListener('change', (e) => {
    state.settings.reducedAnimation = e.target.checked;
    applyDisplaySettings();
  });
  const paletteSelect = document.getElementById('palette-select');
  paletteSelect.value = state.settings.palette;
  paletteSelect.addEventListener('change', (e) => {
    document.body.classList.remove('palette-default', 'palette-violet', 'palette-emerald');
    const palette = e.target.value;
    state.settings.palette = palette;
    if (palette !== 'default') {
      document.body.classList.add(`palette-${palette}`);
    }
  });
  const bgmVolume = document.getElementById('bgm-volume');
  bgmVolume.value = Math.round(state.settings.bgm * 100);
  bgmVolume.addEventListener('input', (e) => {
    state.settings.bgm = Number(e.target.value) / 100;
    updateBGMVolume();
  });
  const sfxVolume = document.getElementById('sfx-volume');
  sfxVolume.value = Math.round(state.settings.sfx * 100);
  sfxVolume.addEventListener('input', (e) => {
    state.settings.sfx = Number(e.target.value) / 100;
  });
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
  if (!UI.skillTree) return;
  UI.skillTree.innerHTML = '';
  const fragment = document.createDocumentFragment();
  const branchMap = new Map();
  const branchCounters = new Map();
  upgrades.forEach((upgrade) => {
    if (filter !== 'all' && upgrade.category !== filter) {
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
      id: 'pulse-seed',
      name: 'Pulse Seed',
      tagline: 'Establish auto-click cadence (0.95s)',
      position: { row: 3, col: 5 },
      cost: { prestige: 2, lp: 3 },
      prereqs: [],
      effect: (statsObj) => {
        statsObj.autoInterval *= 0.95;
      },
    },
    {
      id: 'dual-oscillator',
      name: 'Dual Oscillator',
      tagline: 'Split-beam sync (0.86s)',
      position: { row: 2, col: 4 },
      cost: { prestige: 4, lp: 6 },
      prereqs: ['pulse-seed'],
      effect: (statsObj) => {
        statsObj.autoInterval *= 0.9;
      },
    },
    {
      id: 'quantum-cradle',
      name: 'Quantum Cradle',
      tagline: 'Phase-narrow loop (0.86s)',
      position: { row: 2, col: 6 },
      cost: { prestige: 4, lp: 6 },
      prereqs: ['pulse-seed'],
      effect: (statsObj) => {
        statsObj.autoInterval *= 0.9;
      },
    },
    {
      id: 'overclock-halo',
      name: 'Overclock Halo',
      tagline: 'Harmonic glare (0.8s)',
      position: { row: 1, col: 5 },
      cost: { prestige: 6, lp: 9 },
      prereqs: ['pulse-seed'],
      effect: (statsObj) => {
        statsObj.autoInterval *= 0.84;
      },
    },
    {
      id: 'resonance-spiral',
      name: 'Resonance Spiral',
      tagline: 'Feedback drift (0.72s)',
      position: { row: 4, col: 3 },
      cost: { prestige: 7, lp: 10 },
      prereqs: ['dual-oscillator'],
      effect: (statsObj) => {
        statsObj.autoInterval *= 0.84;
      },
    },
    {
      id: 'singularity-dial',
      name: 'Singularity Dial',
      tagline: 'Tension fold (0.72s)',
      position: { row: 4, col: 7 },
      cost: { prestige: 7, lp: 10 },
      prereqs: ['quantum-cradle'],
      effect: (statsObj) => {
        statsObj.autoInterval *= 0.84;
      },
    },
    {
      id: 'tachyon-loop',
      name: 'Tachyon Loop',
      tagline: 'Breach taps @0.5s',
      position: { row: 5, col: 5 },
      cost: { prestige: 12, lp: 16 },
      prereqs: ['resonance-spiral', 'singularity-dial', 'overclock-halo'],
      effect: (statsObj) => {
        statsObj.autoInterval *= 0.7;
      },
    },
  ];
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
    if (Number.isFinite(amount) && amount > 0 && state.cryptcoins >= amount) {
      state.cryptcoins -= amount;
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
  cursor.style.setProperty('--cursor-size', `${getPointerSize()}px`);
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
  const baseTransform = node.el.style.transform || '';
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
  token.style.left = `${clampedX}px`;
  token.style.top = `${clampedY}px`;
  token.style.transform = 'translate(-50%, -50%) scale(0.2)';
  const value = Number(token.dataset.value) || 1;
  state.bits += value;
  gainXP(Math.ceil(value * 0.4));
  updateResources();
  token.addEventListener(
    'transitionend',
    () => {
      createFloatText(UI.customCursor || document.body, `+${value} bits`, '#ffd166');
      token.remove();
    },
    { once: true }
  );
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
  hideLevelDialog();
  activeNodes.forEach((node) => node.el.remove());
  activeNodes.clear();
  if (activeBoss?.el) {
    activeBoss.el.remove();
  }
  autoClickTimer = 0;
  state.currentLevel.timer = BOSS_TIMER;
  state.currentLevel.active = true;
  state.currentLevel.bossActive = false;
  activeBoss = null;
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
  const bossHP = Math.ceil((600 + state.currentLevel.index * 160) * stats.bossHPFactor);
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
  const ratio = Math.max(0, state.currentLevel.bossHP) / state.currentLevel.bossMaxHP;
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
  applyAutomationBonuses();
  state.maxHealth = stats.maxHealth;
  state.health = Math.min(state.health, state.maxHealth);
  UI.health.textContent = `${Math.round(state.health)} / ${Math.round(state.maxHealth)}`;
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
}

function updateCrypto(delta) {
  if (state.crypto.deposit <= 0 || state.crypto.rate <= 0) return;
  state.crypto.timeRemaining = Math.max(0, state.crypto.timeRemaining - delta);
  const generated = state.crypto.rate * delta;
  state.cryptcoins += generated;
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
  drawAutomationConnectors();
});
