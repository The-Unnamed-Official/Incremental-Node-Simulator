const TICK_RATE = 1000 / 60;
const BASE_LEVEL_DURATION = 42;
const LEVEL_DURATION_INCREMENT = 7;
const BASE_BOSS_HP = 180;
const BOSS_HP_INCREMENT = 2.42;
const NODE_SIZE = 82;
const GAME_VERSION = 'v2.100';

const UPDATE_LOGS = [
  {
    version: 'v2.100',
    title: 'NodeShift v2.1 // Breach Deck',
    description:
      'A complete stability recovery and visual systems rebuild: the full runtime is active again, every control is wired, and the interface now reads like a responsive neon breach console.',
    changes: [
      {
        text: 'Runtime restored',
        sub: [
          'Repaired the bootstrap fault that prevented the game loop, upgrades, controls, nodes, and cursor from initialising.',
          'Added early boot fault capture so a future startup problem cannot fail as a silent, dead interface.',
          'Resolved the duplicate upgrade-name routine exposed by the repaired bootstrap path.',
        ],
      },
      {
        text: 'Breach Deck interface',
        sub: [
          'Rebuilt every major surface around a sharper neon-pixel command deck with stronger hierarchy, contrast, focus states, responsive stacking, and clearer live status.',
          'Reworked the battlefield, boss tracker, telemetry, resource cards, module bay, upgrade cards, progress archive, dialogs, settings, music, and stat docks as one coherent visual system.',
          'The native pointer is now suppressed across the entire game while the high-visibility pixel reticle remains active globally.',
        ],
      },
      {
        text: 'Interaction polish',
        sub: [
          'Buttons now have consistent hover, pressed, focus, affordable, locked, and selected states.',
          'Dense panels use contained scrolling and sticky controls without hiding upgrades or breaking the combat viewport.',
          'Reduced-motion mode keeps the hierarchy and cursor while disabling nonessential scanning sweeps.',
        ],
      },
    ],
  },
  {
    version: 'v2.000',
    title: 'NodeShift v2 // Continuum',
    description:
      'A complete command-deck UI rebuild, repaired progression curve, fair bonus skill checks, safer saves, compact records, and a repeatable Continuum endgame.',
    changes: [
      {
        text: 'New command deck',
        sub: [
          'The arena, stage controls, boss state, resources, live telemetry, and next objective now fit together in one readable combat viewport.',
          'Upgrade paths and permanent records use compact scroll regions instead of stretching the entire page or leaving cards off-screen.',
          'Music and combat-stat modules start docked, stay available, and no longer cover the battlefield by default.',
        ],
      },
      {
        text: 'Progression rebuilt',
        sub: [
          'Node and boss health now scale alongside rewards instead of jumping by 100x between early stages.',
          'Rank XP, stage timers, spawn pressure, boss rewards, the Lab, and the Crypto Mine now remain useful deeper into a run.',
          'The repeatable Continuum Core adds four long-run upgrade routes for damage, yield, cadence, and boss output.',
        ],
      },
      {
        text: 'Fair calibration checks',
        sub: [
          'A failed check never removes the purchased upgrade and never charges the price twice.',
          'Failure builds calibration assistance, widening the next target until the player succeeds.',
          'Axis Weave no longer lasts a full minute and every check clearly advertises its fail-safe behavior.',
        ],
      },
      {
        text: 'Reliability pass',
        sub: [
          'Save timestamps are stored correctly, fallback saves preserve advanced systems, and unrelated browser storage is never deleted.',
          'Long idle gaps advance active research and mining safely without simulating thousands of missed animation frames.',
          'Duplicate IDs, a broken default music path, malformed labels, and several number-format overflow cases are repaired.',
        ],
      },
    ],
  },
  {
    version: 'v1.700',
    title: 'Total Rework & Bugfix',
    description:
      'A full-scale rework focused on clearer progression, stronger performance, better scaled-device support, a richer crypto loop, and a huge amount of polish and bug fixing across the whole game.',
    changes: [
      {
        text: 'Full game rework',
        sub: [
          'Refreshed the main battlefield visuals with a cleaner arena, sharper readability, and smoother high-density rendering.',
          'Reworked player progression so Operator Rank now reads clearly as a bar instead of being confused with Stage progression.',
          'Added a boss countdown directly into the boss tracker so you can see exactly when the next boss will spawn.',
          'Added more themes, including Ocean, Storm, and Terminal.',
        ],
      },
      {
        text: 'Bug fixes lined up cleanly',
        sub: [
          'Skill tree cards and upgrade cards now adapt correctly to different resolutions, browser zoom levels, and scaled devices.',
          'The overall game layout is more zoomed out by default so the interface feels less cramped on desktop displays.',
          'Phone and smaller-device layouts now stack more cleanly, with touch-friendly spacing and fewer overlapping panels.',
          'Hidden skills and upgrade cards no longer slip off-screen on smaller or differently scaled displays.',
          'New upgrades now wrap into clean rows instead of drifting out of bounds and becoming unpurchasable.',
          'Inline tab and upgrade text now stays balanced and readable instead of breaking into ugly chopped-up word stacks.',
          'Upgrade tabs now show their requirements cleanly instead of stacking unreadable lock text.',
          'Cards and upgrades that cannot be afforded now read as disabled and greyed out until you can buy them.',
          'Live purchase requirement text now updates correctly as your bits, prestige, LP, or CC change.',
          'The refreshed tutorial is forced once on the first launch after v1.700 so returning players see the new guidance.',
          'Floating text for damage, currencies, and requirements now spreads out more clearly instead of collapsing into itself.',
          'Node movement no longer lags behind because of transform easing fighting the live simulation.',
          'Spawn timing now catches up correctly during dense waves, preventing delayed or uneven swarm growth.',
          'High-density fights now shed heavier effects automatically so hundreds of active nodes stay smooth and responsive.',
        ],
      },
      {
        text: 'Balance and systems',
        sub: [
          'Critical upgrades were rebalanced and total crit chance is now hard-capped at 70%.',
          'Some nodes can now drop very rare bonus CC payouts.',
          'Node HP bars now update live while damaged nodes slowly regenerate 1% of their max HP every second.',
          'The Crypto Mine now shows mined-so-far output live, supports early withdrawal at 70%, and states that behavior clearly in the interface.',
          'The tutorial now covers currencies, skills, nodes, stages, themes, settings, crypto systems, and progression more thoroughly.',
        ],
      },
      {
        text: 'Animation rework and combat feedback',
        sub: [
          'A large batch of cursor, node, and boss animations was fully reworked to feel cleaner, heavier, and more responsive.',
          'Node hurt, death, and boss impact animations now have clearer visual punch without undoing the performance improvements for dense fights.',
          'Critical hits now get stronger feedback too, including sharper cursor reactions, brighter impact bursts, and more noticeable CRIT moments.',
        ],
      },
      {
        text: 'Playlist expansion (Songs 21-45)',
        sub: [
          '21. AA EE OO - The Unnamed & Mixin',
          '22. Abyssal - The Unnamed',
          '23. Darkness in Light - The Unnamed',
          '24. Do Better - The Unnamed',
          '25. Equinox, Equilibrium - The Unnamed & Mixin',
          '26. Felled - The Unnamed',
          '27. I Had to Become This - The Unnamed & Mixin',
          '28. If I Let it Out - The Unnamed & Mixin',
          '29. Call - The Unnamed & Mixin',
          '30. Lit Up - The Unnamed',
          '31. Laminar - The Unnamed',
          '32. Peace for Thoughts - The Unnamed',
          '33. Roll the Black Tide - The Unnamed & Bouy & Calzif',
          '34. Ruined Lives - The Unnamed & Mixin',
          '35. Sevenfold - The Unnamed & Mixin',
          '36. Static Touch - The Unnamed & Mixin',
          '37. Still Here, Not Living - The Unnamed & Mixin',
          '38. Still Not Enough - The Unnamed & Mixin',
          '39. Synth Melody - The Unnamed',
          '40. Too Much Silence - The Unnamed & Mixin',
          '41. Vivid Flow - The Unnamed',
          '42. Vocal Harm - The Unnamed',
          '43. Voluntary Chaos - The Unnamed',
          '44. Watching From the Outside - The Unnamed & Mixin',
          '45. Cryo - The Unnamed & Mixin',
        ],
      },
      {
        text: 'Cleanup and removals',
        sub: [
          'Removed the buyable skin system because it no longer added meaningful progression.',
          'Retired the old skin panel to keep settings focused and reduce clutter.',
          'Achievements and milestones now have more distinct card styling so progress screens are easier to scan.',
          'Cleaned up several legacy UI and save-state edge cases tied to the old presentation layer.',
        ],
      },
    ],
  },
  {
    version: 'v0.633',
    title: 'Many important bug fixes and other neat additions!',
    description: 'This update fixes key upgrade issues and introduces a fresh skill challenge.',
    changes: [
      'The issue with skill upgrades continuing behind the upgrading card making them unpurchasable after just a few upgrades have been fixed!',
      'Improved damage counters.',
      'Skill upgrades now wrap cleanly into new rows instead of stretching off-screen.',
      'Introduced the dual-axis Axis Weave skill check and retired the broken radial version.',
      'Improved damage counters for better clarity.',
      "Made LAYERS' border shift through black and white :O",
      "And so, so, so many other bug fixes.. believe me...",
    ],
  },
  {
    version: 'v0.630',
    title: 'Music Update v2!',
    description:
      'This update focuses on adding a more diverse amount of music tracks from The Unnamed aka the creator himself! You can check them out by clicking his name in the music player!',
    changes: [
      {
        text: 'Added 4 new songs to the playlist!',
        sub: [
          'LAYERS',
          'Cooked Beyond Return',
          'Flowing',
          'Still',
        ],
      },
    ],
  },
  {
    version: 'v0.620',
    title: 'Node Expansion & System Reworks!',
    description:
      'This update focuses on polishing gameplay flow, adding more node variety, improving UI clarity, enhancing skill checks, and laying the foundation for future progression systems.',
    changes: [
      {
        text: 'DOUBLED the amount of songs by adding 6 whole new remix tracks made by me!',
        sub: [
          'Heaven Says',
          'Intruder',
          'Break You Down',
          'Overthrone',
          'Encounter',
          'Manipulated',
        ],
      },

      'Added a tutorial which can also be replayed!',

      {
        text: 'Added new rare node behaviors and improvements.',
        sub: [
          'Expanded visual effects for rare nodes',
          'More detailed particle bursts on kill',
          'Enhanced reward feedback for rare node types',
        ],
      },

      {
        text: 'Improved node info representation, preparing for advanced future node types.',
        sub: [
          'Void nodes (concept integration support)',
          'Prismatic nodes (color-cycling logic groundwork)',
        ],
      },

      {
        text: 'Adjusted critical blooms and improved node-kill responsiveness.',
        sub: [
          'Sharper bloom effect timing',
          'Smoother node HP-to-death transition',
          'Faster post-kill bit dispersion response',
        ],
      },

      {
        text: 'Upgraded UI responsiveness with smoother interactions.',
        sub: [
          'Improved hover animations',
          'Tighter click feedback',
          'Better pressed/active transitions',
        ],
      },

      {
        text: 'Added subtle arena feedback changes.',
        sub: [
          'Arena tinting during rare node spawns',
          'Stronger wave-intensity cues',
          'Better node-spawn visual clarity',
        ],
      },

      {
        text: 'Enhanced skill check flow.',
        sub: [
          'Clearer presentation of the check area',
          'More readable success/failure feedback',
          'Better timing window clarity',
        ],
      },

      {
        text: 'Added groundwork for a visual skill-tree system.',
        sub: [
          'Support for grid-based node positioning',
          'Backend for branching/unlock logic',
          'State hooks for multi-level skill paths',
        ],
      },

      {
        text: 'Improved boss HP handling.',
        sub: [
          'Prepared multi-phase HP segmentation',
          'Improved scaled HP rendering',
          'More accurate boss feedback flow',
        ],
      },

      {
        text: 'Refined palette handling and visual cohesion.',
        sub: [
          'Added micro-support for palette previews',
          'Improved theme consistency across UI components',
        ],
      },

      {
        text: 'Improved music-player responsiveness.',
        sub: [
          'Prepared palette-reactive border glow',
          'Prepared event-based pulse effects (boss spawn/kill)',
        ],
      },

      {
        text: 'Tweaked resource update logic.',
        sub: [
          'Cleaner stat feedback',
          'More readable bit/XP progression pacing',
          'Better synchronization across UI panels',
        ],
      },

      'Improved autosave reliability and added hooks for future “last saved” indicators.',

      'Optimized DOM updates across multiple panels to prepare for new upcoming systems.',

      {
        text: 'Refactored UI containers to support future additions.',
        sub: [
          'Node info panel foundations',
          'Quick-stats overlay preparation',
          'More flexible skill tree layout container',
        ],
      },

      'Updated internal node scaling structure for better long-term progression stability.',

      'Improved animation timing for destruction particles, gold-node explosions, and rare-node effects.',

      'Refined SFX triggers for hits, kills, and pointer interactions to feel tighter and more responsive.',

      'Minor layout adjustments across upgrade screens for future skill-tree visualization.',

      'General polish, bug fixes, stability improvements, and smoother transitions across palettes.',
    ],
  },
  {
    version: 'v0.600',
    title: 'Color Update!!',
    description:
      'The colors have taken over!!',
    changes: [
      'A COMPLETE overhaul on EVERY SINGLE color palette you see with custom colors and easily changable themes now!!',
      'This took me exactly 8 hours, 28 minutes and 30 seconds...',
    ],
  },
  {
    version: 'v0.580',
    title: 'Draggable Music Dock & Clickable Credits!',
    description:
      'The music player has been fully upgraded: it’s now draggable up and down the screen with smooth cursor feedback, the layout has been polished, and both the artist and developer credits are now clickable so you can jump straight to the music and the game files.',
    changes: [
      'Made the music player vertically draggable, limited between 24px from the top and 24px from the bottom of the screen.',
      'Added smooth custom cursor states to clearly indicate when you can drag the music player and when it is being moved.',
      'Refined the music player layout and visuals for a cleaner, more polished look.',
      'Fixed drag jitter and odd jumps after refresh so the player feels stable and responsive even when moving quickly.',
      'Made the artist name clickable and linked it directly to the artist’s Spotify profile in a new tab.',
      'Added a Developer pill under the title that links straight to the game files for easy access.',
    ],
  },
  {
    version: 'v0.565',
    title: 'New Name, New Icons & A Polished Music Player!',
    description:
      'Welcome to NodeShift! The game now sports its brand-new identity along with crisp new tab icons and a fully upgraded music player UI. Saving issues should now be completely resolved—so enjoy returning to your grind with zero worries!',
    changes: [
      'Renamed the game to **NodeShift** — a cleaner, catchier identity for the project!',
      'Added custom favicons, giving the browser tab a fresh and professional look.',
      'Improved and refined the music player UI for a smoother and more stylish experience.',
    ],
  },
  {
    version: 'v0.561',
    title: 'Important save bug-fix!',
    description:
      'Saving should now have absolutely no problems, so you can finally get back to your precious grind!!',
    changes: [
      'A save game bug where saves were failing with QuotaExceededError because the full serialized state could exceed localStorage capacity (large logs/sets/snapshots kept being serialized)',
      'Fixed a save error (QuotaExceededError) by adding robust fallbacks: compact snapshots, pruning of large localStorage entries, sessionStorage fallback, and a downloadable emergency backup if persistent storage is exhausted.',
    ],
  },
  {
    version: 'v0.555',
    title: 'The Sound & Music Update',
    description:
      'A full audio overhaul doubles the soundtrack, layers in granular click, pickup, and death cues, and tightens the upgrade lanes.',
    changes: [
      'Expanded the background music rotation to six tracks and refreshed every core sound with new variations for clicks, pickups, level ups, and node deaths.',
      'Rebuilt P-Magnet, N-Speed, and P-Speed tracks to lean on fewer, clearer upgrade nodes while rebalancing special node pacing and rewards.',
      'Skill checks, node health, prestige drops, and UI labels picked up polish so the battlefield feels sharper and communicates requirements more clearly.',
    ],
  },
  {
    version: 'v0.505',
    title: 'Code split polish, custom soundtrack, and green surge',
    description:
      'A tighter boot sequence, a fresh self-made track, and a brand new green runner keep the simulator responsive and lively.',
    changes: [
      'Core constants, state, audio, and the main loop now load as deferred, ordered files so the browser can parse the page faster while keeping dependencies tidy.',
      'Added a new background music track produced in-house and expanded the playlist rotation so sessions cycle across four songs.',
      'Introduced a speedy Green Node variant that drops bits, XP, and cryptcoins while granting a short auto-fire haste buff when intercepted.',
    ],
  },
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
  void: { min: 70, max: 120 },
  prismatic: { min: 60, max: 140 },
};

const CRYPTO_SPEED_UPGRADES = [
  { id: 'crypto-speed-10', label: 'Flux Heatsink', bonus: 10, cost: 10000 },
  { id: 'crypto-speed-100', label: 'Dual-Core Converter', bonus: 100, cost: 50000 },
  { id: 'crypto-speed-500', label: 'Quantum Loom', bonus: 500, cost: 1_000_000 },
];

const UPGRADE_LEVEL_GROWTH = 1.1;
const UPGRADE_TIER_GROWTH = 1.22;

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
      return 15 * Math.pow(2.08, Math.max(0, safeLevel - 1));
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
      return 30 * Math.pow(2.1, Math.max(0, safeLevel - 1));
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
        prestige: 1,
      };
    },
    hp(level) {
      const safeLevel = Math.max(1, Math.floor(level));
      return 38 * Math.pow(2.12, Math.max(0, safeLevel - 1));
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
      return 110 * Math.pow(2.18, Math.max(0, safeLevel - 1));
    },
  },
  {
    id: 'void',
    name: 'Void Node',
    color: 'void',
    speedMultiplier: 0.65,
    hp(level) {
      const safeLevel = Math.max(1, Math.floor(level));
      return 220 * Math.pow(2.22, Math.max(0, safeLevel - 1));
    },
    reward(level) {
      const safeLevel = Math.max(1, Math.floor(level));
      return {
        bits: getLevelBitReward('void', safeLevel),
        prestige: 0.5 + safeLevel * 0.05,
      };
    },
    behavior: {
      drainPerSecond: 1.5,
      healOnDrain: 0.25,
    },
  },
  {
    id: 'prismatic',
    name: 'Prismatic Node',
    color: 'prismatic',
    speedMultiplier: 1.4,
    reward(level, node) {
      const safeLevel = Math.max(1, Math.floor(level));
      const color = node?.currentHue || 'amber';
      const colorRewards = {
        azure: { bits: getLevelBitReward('blue', safeLevel), xp: 10 + safeLevel * 0.8 },
        emerald: { bits: getLevelBitReward('green', safeLevel), cryptcoins: 1 + safeLevel * 0.15 },
        crimson: { bits: getLevelBitReward('red', safeLevel), prestige: 0.35 + safeLevel * 0.08 },
        auric: { bits: getLevelBitReward('gold', safeLevel), cryptcoins: 2 + safeLevel * 0.2 },
        void: { bits: getLevelBitReward('void', safeLevel), xp: 18 + safeLevel },
      };
      return colorRewards[color] || colorRewards.azure;
    },
    hp(level) {
      const safeLevel = Math.max(1, Math.floor(level));
      return 95 * Math.pow(2.16, Math.max(0, safeLevel - 1));
    },
    hues: ['azure', 'emerald', 'crimson', 'auric', 'void'],
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
  easy: { duration: 6.6, baseSpeed: 0.46, window: 0.36, minWindow: 0.22 },
  normal: { duration: 6, baseSpeed: 0.62, window: 0.29, minWindow: 0.17 },
  hard: { duration: 5.4, baseSpeed: 0.76, window: 0.24, minWindow: 0.14 },
};
