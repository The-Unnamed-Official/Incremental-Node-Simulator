(function () {
  const formatTime = (seconds) => {
    const clamped = Math.max(0, seconds || 0);
    const mins = Math.floor(clamped / 60)
      .toString()
      .padStart(2, '0');
    const secs = Math.floor(clamped % 60)
      .toString()
      .padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const applyTrackVisuals = (track, coverEl, shell) => {
    if (!track || !coverEl || !shell) return;
    const accent = track.accent || 'var(--accent)';
    const accent2 = track.accent2 || 'var(--accent-slight)';
    const isLayersTrack = (track.title || '').toLowerCase() === 'layers';
    coverEl.style.setProperty('--cover-accent', accent);
    coverEl.style.setProperty('--cover-accent-secondary', accent2);
    coverEl.style.setProperty('--cover-image', track.cover ? `url('${track.cover}')` : 'none');
    coverEl.classList.toggle('is-layers-track', isLayersTrack);
    const sigil = document.getElementById('music-cover-sigil');
    if (sigil) {
      sigil.textContent = track.shortCode || '';
    }
    shell.style.setProperty('--player-accent', accent);
  };

  const getTrackMeta = () => {
    if (typeof getCurrentBGMTrack === 'function') {
      return getCurrentBGMTrack();
    }
    return null;
  };

  const syncPlayIcon = (button) => {
    if (!button || typeof bgmAudio === 'undefined' || !bgmAudio) return;
    button.textContent = bgmAudio.paused ? '▶' : 'Ⅱ';
    button.classList.toggle('is-playing', !bgmAudio.paused);
    button.setAttribute('aria-label', bgmAudio.paused ? 'Play music' : 'Pause music');
  };

  document.addEventListener('DOMContentLoaded', () => {
    const shell = document.getElementById('music-player');
    if (!shell) return;
    shell.classList.add('collapsed');

    const toggle = document.getElementById('music-player-toggle');
    const content = document.getElementById('music-player-content');
    const closeButton = document.getElementById('music-player-close');
    const toggleSummary = document.getElementById('music-toggle-summary');
    const titleEl = document.getElementById('music-title');
    const artistEl = document.getElementById('music-artist');
    const coverEl = document.getElementById('music-cover');
    const progress = document.getElementById('music-progress');
    const currentTimeEl = document.getElementById('music-current');
    const durationEl = document.getElementById('music-duration');
    const playBtn = document.getElementById('music-player-play');
    const nextBtn = document.getElementById('music-player-next');
    const prevBtn = document.getElementById('music-player-prev');

    let scrubbing = false;
    let audioListenersAttached = false;

    const attachAudioListeners = () => {
      if (audioListenersAttached || typeof bgmAudio === 'undefined' || !bgmAudio) return;
      bgmAudio.addEventListener('timeupdate', syncProgress);
      bgmAudio.addEventListener('loadedmetadata', syncProgress);
      bgmAudio.addEventListener('play', () => syncPlayIcon(playBtn));
      bgmAudio.addEventListener('pause', () => syncPlayIcon(playBtn));
      bgmAudio.addEventListener('ended', () => syncPlayIcon(playBtn));
      audioListenersAttached = true;
    };

    const setCollapsed = (collapsed, options = {}) => {
      const openedFromToggle = !collapsed && document.activeElement === toggle;
      shell.classList.toggle('collapsed', collapsed);
      if (toggle) {
        toggle.setAttribute('aria-expanded', String(!collapsed));
        toggle.setAttribute('aria-label', collapsed ? 'Open music player' : 'Close music player');
        toggle.toggleAttribute('inert', !collapsed);
        toggle.setAttribute('aria-hidden', String(!collapsed));
      }
      if (content) {
        content.toggleAttribute('inert', collapsed);
        content.setAttribute('aria-hidden', String(collapsed));
      }
      if (!collapsed) {
        document.dispatchEvent(new CustomEvent('nodeshift:utility-open', { detail: { id: shell.id } }));
      }
      if (options.focus) {
        (collapsed ? toggle : closeButton)?.focus({ preventScroll: true });
      } else if (openedFromToggle) {
        closeButton?.focus({ preventScroll: true });
      }
    };

    const updateTrackDetails = () => {
      const track = getTrackMeta();
      if (!track) return;
      titleEl.textContent = track.title || '';
      artistEl.textContent = track.artist || '';
      if (toggleSummary) {
        toggleSummary.textContent = (track.shortCode || track.title || 'READY').slice(0, 12).toUpperCase();
      }
      applyTrackVisuals(track, coverEl, shell);
      if (typeof bgmAudio !== 'undefined' && bgmAudio) {
        durationEl.textContent = Number.isFinite(bgmAudio.duration)
          ? formatTime(bgmAudio.duration)
          : '';
      }
      attachAudioListeners();
    };

    const syncProgress = () => {
      if (typeof bgmAudio === 'undefined' || !bgmAudio) return;
      const duration = Number.isFinite(bgmAudio.duration) ? bgmAudio.duration : 0;
      const current = Number.isFinite(bgmAudio.currentTime) ? bgmAudio.currentTime : 0;
      if (!scrubbing && duration > 0) {
        const pct = Math.min(100, Math.max(0, (current / duration) * 100));
        progress.value = pct;
      }
      currentTimeEl.textContent = formatTime(scrubbing ? (progress.value / 100) * duration : current);
      durationEl.textContent = duration > 0 ? formatTime(duration) : '';
    };

    const ensurePlayback = () => {
      if (typeof bgmAudio === 'undefined' || !bgmAudio) return;
      const playPromise = bgmAudio.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {});
      }
    };

    if (toggle) {
      toggle.addEventListener('click', () => {
        setCollapsed(!shell.classList.contains('collapsed'));
      });
    }
    closeButton?.addEventListener('click', () => setCollapsed(true, { focus: true }));

    document.addEventListener('nodeshift:utility-open', (event) => {
      if (event.detail?.id !== shell.id) setCollapsed(true);
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !shell.classList.contains('collapsed')) {
        setCollapsed(true, { focus: true });
      }
    });

    if (playBtn) {
      playBtn.addEventListener('click', () => {
        if (typeof bgmAudio === 'undefined' || !bgmAudio) return;
        if (bgmAudio.paused) {
          ensurePlayback();
        } else {
          bgmAudio.pause();
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (typeof advanceBGMTrack === 'function') {
          advanceBGMTrack(true);
        }
        ensurePlayback();
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (typeof bgmAudio !== 'undefined' && bgmAudio) {
          if (bgmAudio.currentTime > 3) {
            bgmAudio.currentTime = 0;
            ensurePlayback();
            return;
          }
        }
        if (typeof rewindBGMTrack === 'function') {
          rewindBGMTrack(true);
        }
        ensurePlayback();
      });
    }

    if (progress) {
      progress.addEventListener('pointerdown', () => {
        scrubbing = true;
      });
      progress.addEventListener('input', () => {
        scrubbing = true;
        if (typeof bgmAudio === 'undefined' || !bgmAudio) return;
        const duration = Number.isFinite(bgmAudio.duration) ? bgmAudio.duration : 0;
        currentTimeEl.textContent = formatTime((progress.value / 100) * duration);
      });
      progress.addEventListener('change', () => {
        if (typeof bgmAudio === 'undefined' || !bgmAudio) return;
        const duration = Number.isFinite(bgmAudio.duration) ? bgmAudio.duration : 0;
        const desired = (progress.value / 100) * duration;
        if (Number.isFinite(desired)) {
          bgmAudio.currentTime = desired;
        }
        scrubbing = false;
        syncProgress();
      });
      progress.addEventListener('pointerup', () => {
        scrubbing = false;
      });
      progress.addEventListener('pointerleave', () => {
        scrubbing = false;
      });
    }

    document.addEventListener('bgm-track-change', updateTrackDetails);
    attachAudioListeners();

    updateTrackDetails();
    syncProgress();
    syncPlayIcon(playBtn);
    setCollapsed(true);
  });
})();
