const SFX_DEFINITIONS = {
  pointerAtk: { src: 'files/pointer_atk.mp3', baseVolume: 0.08 },
  pointerHitA: { src: 'files/pointer_hit.mp3', baseVolume: 0.38 },
  pointerHitB: { src: 'files/pointer_hit2.mp3', baseVolume: 0.38 },
  nodeDie: { src: ['files/node_die.mp3', 'files/node_die2.mp3', 'files/node_die3.mp3'], baseVolume: 1 },
  bossDie: { src: 'files/boss_die.mp3', baseVolume: 0.38 },
  bitsGain: { src: ['files/bits_gain.mp3', 'files/bits_gain2.mp3', 'files/bits_gain3.mp3'], baseVolume: 0.18, },
  mouseClickIn: { src: 'files/mouse_click_in.mp3', baseVolume: 0.38 },
  mouseClickOut: { src: 'files/mouse_click_out.mp3', baseVolume: 0.38 },
  levelUp: { src: 'files/level_up.mp3', baseVolume: 0.38 },
};

const sfxLibrary = new Map();
let sfxLoaded = false;
let bgmAudio;
function buildCoverGlyph(label, accent = '#63e6be', depth = '#111627') {
  const safeLabel = label?.slice(0, 5) || 'BGM';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid meet">`
    + `<defs>`
    + `<linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">`
    + `<stop offset="0%" stop-color="${accent}" stop-opacity="0.9"/>`
    + `<stop offset="100%" stop-color="${depth}" stop-opacity="0.95"/>`
    + `</linearGradient>`
    + `</defs>`
    + `<rect x="0" y="0" width="400" height="400" rx="32" ry="32" fill="url(#g)"/>`
    + `<rect x="22" y="22" width="356" height="356" fill="none" stroke="${accent}" stroke-width="10"/>`
    + `<text x="50%" y="55%" font-family="'Press Start 2P', 'Share Tech Mono', monospace" font-size="54" fill="#e8fff7" text-anchor="middle" letter-spacing="3">${safeLabel}</text>`
    + `</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const baseBgmTracks = [
  {
    src: 'files/bg_music.mp3',
    title: 'Gray Rain',
    artist: 'The Unnamed',
    accent: '#63e6be',
    accent2: '#111627',
    shortCode: 'GR',
    cover: buildCoverGlyph('GR', '#55666aff', '#111627'),
  },
  {
    src: 'files/bg_music2.mp3',
    title: 'Broken Echoes',
    artist: 'The Unnamed',
    accent: '#7ef6ff',
    accent2: '#0c1326',
    shortCode: 'BE',
    cover: buildCoverGlyph('BE', '#7ef6ff', '#0c1326'),
  },
  {
    src: 'files/bg_music3.mp3',
    title: 'Metal Crusher',
    artist: 'The Unnamed',
    accent: '#ffb8e8',
    accent2: '#1d1029',
    shortCode: 'MC',
    cover: buildCoverGlyph('MC', '#ffb8e8', '#1d1029'),
  },
  {
    src: 'files/bg_music4.mp3',
    title: 'Keep It Up',
    artist: 'The Unnamed',
    accent: '#8df6a2',
    accent2: '#0e1d17',
    shortCode: 'KIU',
    cover: buildCoverGlyph('KIU', '#8df6a2', '#0e1d17'),
  },
  {
    src: 'files/bg_music5.mp3',
    title: 'Neon Drift',
    artist: 'The Unnamed',
    accent: '#2189d3ff',
    accent2: '#3e2130ff',
    shortCode: 'ND',
    cover: buildCoverGlyph('ND', '#1323b9ff', '#d6295aff'),
  },
  {
    src: 'files/bg_music6.mp3',
    title: 'Every End...',
    artist: 'The Unnamed',
    accent: '#8ad7ff',
    accent2: '#0f172a',
    shortCode: 'EE',
    cover: buildCoverGlyph('EE', '#8ad7ff', '#0f172a'),
  },
];
let bgmTracks = [];
let bgmTrackIndex = 0;
let bgmEndHandler = null;
let audioUnlocked = false;

function loadSFX() {
  if (sfxLoaded) return;
  Object.entries(SFX_DEFINITIONS).forEach(([key, def]) => {
    const sources = Array.isArray(def.src) ? def.src : [def.src];
    sources.forEach((src) => {
      const preloadAudio = document.createElement('audio');
      preloadAudio.src = src;
      preloadAudio.preload = 'auto';
      preloadAudio.load?.();
    });
    sfxLibrary.set(key, { def: { ...def, sources } });
  });
  sfxLoaded = true;
}

function getSFXVolume(baseVolume = 1) {
  const userVolume = Math.min(1, Math.max(0, state.settings?.sfx ?? 0.7));
  return Math.min(1, Math.max(0, baseVolume * userVolume));
}

function pickSFXSource(entry) {
  const sources = entry?.def?.sources || entry?.def?.src || [];
  if (Array.isArray(sources)) {
    const index = Math.floor(Math.random() * sources.length);
    return sources[index];
  }
  return sources;
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
  const src = pickSFXSource(entry);
  if (!src) return;
  const instance = new Audio(src);
  instance.volume = volume;
  instance.preload = 'auto';
  const playPromise = instance.play();
  if (playPromise && typeof playPromise.catch === 'function') {
    playPromise.catch(() => {});
  }
}

function applyBGMSource() {
  if (!bgmAudio || !bgmTracks.length) return;
  bgmAudio.loop = false;
  const track = getCurrentBGMTrack();
  if (!track?.src) return;
  bgmAudio.src = track.src;
  bgmAudio.load?.();
  document.dispatchEvent(
    new CustomEvent('bgm-track-change', {
      detail: { track, index: bgmTrackIndex % bgmTracks.length, total: bgmTracks.length },
    }),
  );
}

function advanceBGMTrack(playOnAdvance = true) {
  if (!bgmAudio || !bgmTracks.length) return;
  bgmTrackIndex = (bgmTrackIndex + 1) % bgmTracks.length;
  applyBGMSource();
  if (playOnAdvance && audioUnlocked) {
    const playPromise = bgmAudio.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {});
    }
  }
}

function rewindBGMTrack(playOnAdvance = true) {
  if (!bgmAudio || !bgmTracks.length) return;
  bgmTrackIndex = (bgmTrackIndex - 1 + bgmTracks.length) % bgmTracks.length;
  applyBGMSource();
  if (playOnAdvance && audioUnlocked) {
    const playPromise = bgmAudio.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {});
    }
  }
}

function initBGMPlaylist() {
  if (!bgmAudio) return;
  bgmTracks = [...baseBgmTracks];
  for (let i = bgmTracks.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [bgmTracks[i], bgmTracks[j]] = [bgmTracks[j], bgmTracks[i]];
  }
  bgmTrackIndex = 0;
  applyBGMSource();
  if (bgmEndHandler) {
    bgmAudio.removeEventListener('ended', bgmEndHandler);
  }
  bgmEndHandler = () => advanceBGMTrack(true);
  bgmAudio.addEventListener('ended', bgmEndHandler);
}

function getCurrentBGMTrack() {
  if (!bgmTracks.length) return null;
  const track = bgmTracks[bgmTrackIndex % bgmTracks.length];
  if (typeof track === 'string') {
    return { src: track };
  }
  return track;
}

function playPointerHitSFX() {
  const key = Math.random() < 0.5 ? 'pointerHitA' : 'pointerHitB';
  playSFX(key);
}

function setupButtonClickAudio() {
  const getButtonTarget = (event) => {
    const target = event.target;
    if (!target || typeof target.closest !== 'function') return null;
    return target.closest('button');
  };
  document.addEventListener('pointerdown', (event) => {
    if (getButtonTarget(event)) {
      playSFX('mouseClickIn');
    }
  });
  document.addEventListener('pointerup', (event) => {
    if (getButtonTarget(event)) {
      playSFX('mouseClickOut');
    }
  });
}
