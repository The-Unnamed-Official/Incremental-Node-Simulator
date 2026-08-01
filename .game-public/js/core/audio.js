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

const SPOTIFY_ARTIST_URL = 'https://open.spotify.com/artist/3SnvJY2XpNIRX3YgsU7Xld';

document.addEventListener('bgm-track-change', (event) => {
  const track = event.detail.track;

  const titleElem = document.querySelector('[data-bgm-title]');
  const artistElem = document.querySelector('[data-bgm-artist]');
  const coverElem = document.querySelector('[data-bgm-cover]');

  if (titleElem) {
    titleElem.textContent = track.title ?? '';
  }

  if (artistElem) {
    artistElem.innerHTML = `
      <a 
        href="${SPOTIFY_ARTIST_URL}" 
        target="_blank" 
        rel="noopener noreferrer" 
        class="bgm-artist-link"
      >
        ${track.artist}
      </a>
    `;
  }

  if (coverElem) {
    coverElem.src = track.cover ?? '';
  }
});

const baseBgmTracks = [
  {
    src: 'files/music/bg_music.mp3',
    title: 'Gray Rain',
    artist: 'The Unnamed',
    accent: '#63e6be',
    accent2: '#111627',
    cover: 'files/covers/bg_music.jpg',
  },
  {
    src: 'files/music/bg_music2.mp3',
    title: 'Broken Echoes',
    artist: 'The Unnamed',
    accent: '#7ef6ff',
    accent2: '#0c1326',
    cover: 'files/covers/bg_music2.jpg',
  },
  {
    src: 'files/music/bg_music3.mp3',
    title: 'Metal Crusher',
    artist: 'The Unnamed',
    accent: '#ffb8e8',
    accent2: '#1d1029',
    cover: 'files/covers/bg_music3.jpg',
  },
  {
    src: 'files/music/bg_music4.mp3',
    title: 'Keep It Up',
    artist: 'The Unnamed',
    accent: '#8df6a2',
    accent2: '#0e1d17',
    cover: 'files/covers/bg_music4.jpg',
  },
  {
    src: 'files/music/bg_music5.mp3',
    title: 'Neon Drift',
    artist: 'The Unnamed',
    accent: '#2189d3ff',
    accent2: '#3e2130ff',
    cover: 'files/covers/bg_music5.jpg',
  },
  {
    src: 'files/music/bg_music6.mp3',
    title: 'Every End...',
    artist: 'The Unnamed',
    accent: '#8ad7ff',
    accent2: '#0f172a',
    cover: 'files/covers/bg_music6.jpg',
  },
  {
    src: 'files/music/bg_music7.mp3',
    title: 'Heaven Says',
    artist: 'The Unnamed',
    accent: '#3a3631ff',
    accent2: '#5d5e61ff',
    cover: 'files/covers/bg_music7,8,9,10,11,12.jpg',
  },
  {
    src: 'files/music/bg_music8.mp3',
    title: 'Intruder',
    artist: 'The Unnamed',
    accent: '#3a3631ff',
    accent2: '#5d5e61ff',
    cover: 'files/covers/bg_music7,8,9,10,11,12.jpg',
  },
  {
    src: 'files/music/bg_music9.mp3',
    title: 'Break You Down',
    artist: 'The Unnamed',
    accent: '#3a3631ff',
    accent2: '#5d5e61ff',
    cover: 'files/covers/bg_music7,8,9,10,11,12.jpg',
  },
  {
    src: 'files/music/bg_music10.mp3',
    title: 'Overthrone',
    artist: 'The Unnamed',
    accent: '#3a3631ff',
    accent2: '#5d5e61ff',
    cover: 'files/covers/bg_music7,8,9,10,11,12.jpg',
  },
  {
    src: 'files/music/bg_music11.mp3',
    title: 'Encounter',
    artist: 'The Unnamed',
    accent: '#3a3631ff',
    accent2: '#5d5e61ff',
    cover: 'files/covers/bg_music7,8,9,10,11,12.jpg',
  },
  {
    src: 'files/music/bg_music12.mp3',
    title: 'Manipulated',
    artist: 'The Unnamed',
    accent: '#3a3631ff',
    accent2: '#5d5e61ff',
    cover: 'files/covers/bg_music7,8,9,10,11,12.jpg',
  },
  {
    src: 'files/music/bg_music13.mp3',
    title: 'LAYERS',
    artist: 'The Unnamed',
    accent: '#ffffffff',
    accent2: '#000000ff',
    cover: 'files/covers/bg_music13.jpg',
  },
  {
    src: 'files/music/bg_music14.mp3',
    title: 'Cooked Beyond Return',
    artist: 'The Unnamed & Calzif',
    accent: '#7d34b9ff',
    accent2: '#570c75ff',
    cover: 'files/covers/bg_music14.jpg',
  },
  {
    src: 'files/music/bg_music15.mp3',
    title: 'Flowing',
    artist: 'The Unnamed',
    accent: '#2d3f41ff',
    accent2: '#353e57ff',
    cover: 'files/covers/bg_music15,16.jpg',
  },
  {
    src: 'files/music/bg_music16.mp3',
    title: 'Still',
    artist: 'The Unnamed',
    accent: '#3d4a55ff',
    accent2: '#6d757cff',
    cover: 'files/covers/bg_music15,16.jpg',
  },
  {
    src: 'files/music/bg_music17.mp3',
    title: 'Close to the Edge',
    artist: 'The Unnamed & Calzif',
    accent: '#1d2327ff',
    accent2: '#1c2f38ff',
    cover: 'files/covers/bg_music17.png',
  },
  {
    src: 'files/music/bg_music18.mp3',
    title: 'FaultCode',
    artist: 'The Unnamed',
    accent: '#1f2d7aff',
    accent2: '#381c20ff',
    cover: 'files/covers/bg_music18.png',
  },
  {
    src: 'files/music/bg_music19.mp3',
    title: 'Stranger to Myself',
    artist: 'The Unnamed',
    accent: '#4d4a3fff',
    accent2: '#382a25ff',
    cover: 'files/covers/bg_music19.png',
  },
  {
    src: 'files/music/bg_music20.mp3',
    title: 'Too Close',
    artist: 'The Unnamed',
    accent: '#443919ff',
    accent2: '#294350ff',
    cover: 'files/covers/bg_music20.png',
  },
  {
    src: 'files/music/bg_music21.mp3',
    title: 'AA EE OO',
    artist: 'The Unnamed & Mixin',
    accent: '#d591f5',
    accent2: '#bbfff9',
    cover: 'files/covers/bg_music21.jpg',
  },
  {
    src: 'files/music/bg_music22.mp3',
    title: 'Abyssal',
    artist: 'The Unnamed',
    accent: '#1f2d7aff',
    accent2: '#381c20ff',
    cover: 'files/covers/bg_music22.jpg',
  },
  {
    src: 'files/music/bg_music23.mp3',
    title: 'Darkness in Light',
    artist: 'The Unnamed',
    accent: '#000000',
    accent2: '#7f7952',
    cover: 'files/covers/bg_music23.jpg',
  },
  {
    src: 'files/music/bg_music24.mp3',
    title: 'Do Better',
    artist: 'The Unnamed',
    accent: '#1c2556',
    accent2: '#6c7180',
    cover: 'files/covers/bg_music24.jpg',
  },
  {
    src: 'files/music/bg_music25.mp3',
    title: 'Equinox, Equilibrium',
    artist: 'The Unnamed & Mixin',
    accent: '#ffffff',
    accent2: '#000000',
    cover: 'files/covers/bg_music25.jpg',
  },
  {
    src: 'files/music/bg_music26.mp3',
    title: 'Felled',
    artist: 'The Unnamed',
    accent: 'rgb(85, 0, 0)',
    accent2: 'rgb(94, 49, 1)',
    cover: 'files/covers/bg_music26.jpg',
  },
  {
    src: 'files/music/bg_music27.mp3',
    title: 'I Had to Become This',
    artist: 'The Unnamed & Mixin',
    accent: 'rgb(107, 31, 122)',
    accent2: 'rgb(150, 51, 92)',
    cover: 'files/covers/bg_music27,28,35,36,37,38,40,44.jpg',
  },
  {
    src: 'files/music/bg_music28.mp3',
    title: 'If I Let it Out',
    artist: 'The Unnamed & Mixin',
    accent: 'rgb(107, 31, 122)',
    accent2: 'rgb(150, 51, 92)',
    cover: 'files/covers/bg_music27,28,35,36,37,38,40,44.jpg',
  },
  {
    src: 'files/music/bg_music29.mp3',
    title: 'Call',
    artist: 'The Unnamed & Mixin',
    accent: 'rgb(21, 125, 169)',
    accent2: 'rgb(37, 62, 42)',
    cover: 'files/covers/bg_music29.jpg',
  },
  {
    src: 'files/music/bg_music30.mp3',
    title: 'Lit Up',
    artist: 'The Unnamed',
    accent: 'rgb(39, 122, 31)',
    accent2: 'rgb(61, 209, 66)',
    cover: 'files/covers/bg_music30.jpg',
  },
  {
    src: 'files/music/bg_music31.mp3',
    title: 'Laminar',
    artist: 'The Unnamed',
    accent: 'rgb(201, 191, 133)',
    accent2: 'rgb(117, 105, 75)',
    cover: 'files/covers/bg_music31.jpg',
  },
  {
    src: 'files/music/bg_music32.mp3',
    title: 'Peace for Thoughts',
    artist: 'The Unnamed',
    accent: 'rgb(250, 255, 219)',
    accent2: 'rgb(255, 243, 163)',
    cover: 'files/covers/bg_music32.jpg',
  },
  {
    src: 'files/music/bg_music33.mp3',
    title: 'Roll the Black Tide',
    artist: 'The Unnamed & Bouy & Calzif',
    accent: 'rgb(23, 63, 21)',
    accent2: 'rgb(4, 75, 48)',
    cover: 'files/covers/bg_music33.jpg',
  },
  {
    src: 'files/music/bg_music34.mp3',
    title: 'Ruined Lives',
    artist: 'The Unnamed & Mixin',
    accent: 'rgb(160, 97, 42)',
    accent2: 'rgb(194, 159, 127)',
    cover: 'files/covers/bg_music34.jpg',
  },
  {
    src: 'files/music/bg_music35.mp3',
    title: 'Sevenfold',
    artist: 'The Unnamed & Mixin',
    accent: 'rgb(107, 31, 122)',
    accent2: 'rgb(150, 51, 92)',
    cover: 'files/covers/bg_music27,28,35,36,37,38,40,44.jpg',
  },
  {
    src: 'files/music/bg_music36.mp3',
    title: 'Static Touch',
    artist: 'The Unnamed & Mixin',
    accent: 'rgb(107, 31, 122)',
    accent2: 'rgb(150, 51, 92)',
    cover: 'files/covers/bg_music27,28,35,36,37,38,40,44.jpg',
  },
  {
    src: 'files/music/bg_music37.mp3',
    title: 'Still Here, Not Living',
    artist: 'The Unnamed & Mixin',
    accent: 'rgb(107, 31, 122)',
    accent2: 'rgb(150, 51, 92)',
    cover: 'files/covers/bg_music27,28,35,36,37,38,40,44.jpg',
  },
  {
    src: 'files/music/bg_music38.mp3',
    title: 'Still Not Enough',
    artist: 'The Unnamed & Mixin',
    accent: 'rgb(107, 31, 122)',
    accent2: 'rgb(150, 51, 92)',
    cover: 'files/covers/bg_music27,28,35,36,37,38,40,44.jpg',
  },
  {
    src: 'files/music/bg_music39.mp3',
    title: 'Synth Melody',
    artist: 'The Unnamed',
    accent: 'rgb(141, 93, 218)',
    accent2: 'rgb(73, 14, 252)',
    cover: 'files/covers/bg_music39.jpg',
  },
  {
    src: 'files/music/bg_music40.mp3',
    title: 'Too Much Silence',
    artist: 'The Unnamed & Mixin',
    accent: 'rgb(107, 31, 122)',
    accent2: 'rgb(150, 51, 92)',
    cover: 'files/covers/bg_music27,28,35,36,37,38,40,44.jpg',
  },
  {
    src: 'files/music/bg_music41.mp3',
    title: 'Vivid Flow',
    artist: 'The Unnamed',
    accent: 'rgb(34, 12, 162)',
    accent2: 'rgb(208, 0, 219)',
    cover: 'files/covers/bg_music41.jpg',
  },
  {
    src: 'files/music/bg_music42.mp3',
    title: 'Vocal Harm',
    artist: 'The Unnamed',
    accent: 'rgb(220, 0, 0)',
    accent2: 'rgb(33, 0, 0)',
    cover: 'files/covers/bg_music42.jpg',
  },
  {
    src: 'files/music/bg_music43.mp3',
    title: 'Voluntary Chaos',
    artist: 'The Unnamed',
    accent: 'rgb(154, 148, 113)',
    accent2: 'rgb(37, 36, 28)',
    cover: 'files/covers/bg_music43.jpg',
  },
  {
    src: 'files/music/bg_music44.mp3',
    title: 'Watching From the Outside',
    artist: 'The Unnamed & Mixin',
    accent: 'rgb(107, 31, 122)',
    accent2: 'rgb(150, 51, 92)',
    cover: 'files/covers/bg_music27,28,35,36,37,38,40,44.jpg',
  },
  {
    src: 'files/music/bg_music45.mp3',
    title: 'Cryo',
    artist: 'The Unnamed & Mixin',
    accent: 'rgb(31, 116, 41)',
    accent2: 'rgb(37, 121, 160)',
    cover: 'files/covers/bg_music45.jpg',
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
