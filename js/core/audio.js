const SFX_DEFINITIONS = {
  pointerAtk: { src: 'files/pointer_atk.mp3', baseVolume: 0.65 },
  pointerHitA: { src: 'files/pointer_hit.mp3', baseVolume: 0.38 },
  pointerHitB: { src: 'files/pointer_hit2.mp3', baseVolume: 0.38 },
  nodeDie: { src: ['files/node_die.mp3', 'files/node_die2.mp3', 'files/node_die3.mp3'], baseVolume: 0.32 },
  bossDie: { src: 'files/boss_die.mp3', baseVolume: 0.3 },
  bitsGain: { src: ['files/bits_gain.mp3', 'files/bits_gain2.mp3', 'files/bits_gain3.mp3'], baseVolume: 0.26, },
  mouseClickIn: { src: 'files/mouse_click_in.mp3', baseVolume: 0.34 },
  mouseClickOut: { src: 'files/mouse_click_out.mp3', baseVolume: 0.34 },
  levelUp: { src: 'files/level_up.mp3', baseVolume: 0.46 },
};

const sfxLibrary = new Map();
let sfxLoaded = false;
let bgmAudio;
const baseBgmTracks = [
  'files/bg_music.mp3',
  'files/bg_music2.mp3',
  'files/bg_music3.mp3',
  'files/bg_music4.mp3',
  'files/bg_music5.mp3',
  'files/bg_music6.mp3',
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
  const track = bgmTracks[bgmTrackIndex % bgmTracks.length];
  bgmAudio.src = track;
  bgmAudio.load?.();
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
