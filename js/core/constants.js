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

const BIT_REWARD_TABLE = {
  red: { min: 5, max: 10 },
  blue: { min: 15, max: 30 },
  green: { min: 30, max: 60 },
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
    requirement: () => hasCompletedPhaseHaloI(),
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
    id: 'green',
    name: 'Green Node',
    color: 'green',
    speedMultiplier: 3,
    reward(level) {
      const safeLevel = Math.max(1, Math.floor(level));
      return {
        bits: getLevelBitReward('green', safeLevel),
        xp: 5 + safeLevel * 0.6,
        cryptcoins: 0.5 + safeLevel * 0.1,
      };
    },
    hp(level) {
      const safeLevel = Math.max(1, Math.floor(level));
      return 15 * Math.pow(5, Math.max(0, safeLevel - 1));
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
