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
    coverEl.style.setProperty('--cover-accent', accent);
    coverEl.style.setProperty('--cover-accent-secondary', accent2);
    coverEl.style.setProperty('--cover-image', track.cover ? `url('${track.cover}')` : 'none');
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
    button.innerHTML = bgmAudio.paused
      ? '<i class="fa-solid fa-play" style="color: var(--accent);"></i>'
      : '<i class="fa-solid fa-pause" style="color: var(--accent);"></i>';
    button.classList.toggle('is-playing', !bgmAudio.paused);
  };

  document.addEventListener('DOMContentLoaded', () => {
    const shell = document.getElementById('music-player');
    if (!shell) return;

    const toggle = document.getElementById('music-player-toggle');
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
    
    const MIN_VERTICAL_MARGIN = 24;
    let isDraggingPlayer = false;
    let dragPointerId = null;
    let dragOffsetY = 0;

    const clampPlayerTop = (desiredTop) => {
      const viewportHeight =
        window.innerHeight || document.documentElement.clientHeight || 0;
      const rect = shell.getBoundingClientRect();
      const maxTop = Math.max(
        MIN_VERTICAL_MARGIN,
        viewportHeight - rect.height - MIN_VERTICAL_MARGIN,
      );
      return Math.min(Math.max(desiredTop, MIN_VERTICAL_MARGIN), maxTop);
    };

    const setPlayerTop = (top) => {
      const clamped = clampPlayerTop(top);
      shell.style.top = `${clamped}px`;
      shell.style.bottom = 'auto';
    };

    const initPlayerVerticalPosition = () => {
      const rect = shell.getBoundingClientRect();
      const viewportHeight =
        window.innerHeight || document.documentElement.clientHeight || 0;
      const startTop = viewportHeight - rect.height - MIN_VERTICAL_MARGIN;
      setPlayerTop(startTop);
    };

    const startPlayerDrag = (event) => {
      if (isDraggingPlayer) return;
      isDraggingPlayer = true;
      dragPointerId = event.pointerId;

      const rect = shell.getBoundingClientRect();
      dragOffsetY = event.clientY - rect.top;

      if (shell.setPointerCapture) {
        try {
          shell.setPointerCapture(dragPointerId);
        } catch (_) {}
      }

      shell.classList.add('dragging');
      document.body.classList.add('cursor-music-dragging');
    };

    const movePlayerDrag = (event) => {
      if (!isDraggingPlayer) return;
      if (dragPointerId != null && event.pointerId !== dragPointerId) return;
      setPlayerTop(event.clientY - dragOffsetY);
    };

    const stopPlayerDrag = (event) => {
      if (!isDraggingPlayer) return;
      if (event && dragPointerId != null && event.pointerId !== dragPointerId) return;

      isDraggingPlayer = false;

      if (dragPointerId != null && shell.releasePointerCapture) {
        try {
          shell.releasePointerCapture(dragPointerId);
        } catch (_) {}
      }
      dragPointerId = null;

      shell.classList.remove('dragging');
      document.body.classList.remove('cursor-music-dragging');
    };

    const attachAudioListeners = () => {
      if (audioListenersAttached || typeof bgmAudio === 'undefined' || !bgmAudio) return;
      bgmAudio.addEventListener('timeupdate', syncProgress);
      bgmAudio.addEventListener('loadedmetadata', syncProgress);
      bgmAudio.addEventListener('play', () => syncPlayIcon(playBtn));
      bgmAudio.addEventListener('pause', () => syncPlayIcon(playBtn));
      bgmAudio.addEventListener('ended', () => syncPlayIcon(playBtn));
      audioListenersAttached = true;
    };

    const setToggleIcon = () => {
      if (!toggle) return;
      const collapsed = shell.classList.contains('collapsed');
      toggle.innerHTML = collapsed
        ? '<i class="fa-solid fa-arrow-right-from-bracket fa-flip-horizontal" style="color: var(--accent);"></i>'
        : '<i class="fa-solid fa-arrow-right-to-bracket" style="color: var(--accent);"></i>';
    };

    const updateTrackDetails = () => {
      const track = getTrackMeta();
      if (!track) return;
      titleEl.textContent = track.title || '';
      artistEl.textContent = track.artist || '';
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
        shell.classList.toggle('collapsed');
        setToggleIcon();
      });
      setToggleIcon();
    }

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

    initPlayerVerticalPosition();

    window.addEventListener('resize', () => {
      const rect = shell.getBoundingClientRect();
      setPlayerTop(rect.top);
    });

    shell.addEventListener('pointerdown', (event) => {
      if (event.button !== 0) return;

      const t = event.target;
      if (
        t.closest('#music-player-toggle') ||
        t.closest('.player-meta') ||
        t.closest('.player-progress') ||
        t.closest('.player-controls')
      ) {
        return;
      }

      if (!t.closest('.music-player')) return;

      event.preventDefault();
      startPlayerDrag(event);
    });

    shell.addEventListener('pointermove', (event) => {
      movePlayerDrag(event);
    });

    shell.addEventListener('pointerup', (event) => {
      stopPlayerDrag(event);
    });

    shell.addEventListener('pointercancel', (event) => {
      stopPlayerDrag(event);
    });

    window.addEventListener('blur', (event) => {
      stopPlayerDrag(event);
    });

    shell.addEventListener('pointerenter', () => {
      document.body.classList.add('cursor-music-drag');
    });

    shell.addEventListener('pointerleave', () => {
      if (!isDraggingPlayer) {
        document.body.classList.remove('cursor-music-drag');
      }
    });

    document.addEventListener('bgm-track-change', updateTrackDetails);
    attachAudioListeners();

    updateTrackDetails();
    syncProgress();
    syncPlayIcon(playBtn);
  });
})();
