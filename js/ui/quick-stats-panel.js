(function () {
  document.addEventListener('DOMContentLoaded', () => {
    const panel = document.getElementById('quick-stats-panel');
    if (!panel) return;

    const toggle = document.getElementById('quick-stats-toggle');
    panel.classList.add('collapsed');
    const MIN_VERTICAL_MARGIN = 24;
    let isDragging = false;
    let pointerId = null;
    let dragOffsetY = 0;

    const clampTop = (desiredTop) => {
      const viewportHeight =
        window.innerHeight || document.documentElement.clientHeight || 0;
      const rect = panel.getBoundingClientRect();
      const maxTop = Math.max(
        MIN_VERTICAL_MARGIN,
        viewportHeight - rect.height - MIN_VERTICAL_MARGIN,
      );
      return Math.min(Math.max(desiredTop, MIN_VERTICAL_MARGIN), maxTop);
    };

    const setPanelTop = (top) => {
      const clamped = clampTop(top);
      panel.style.top = `${clamped}px`;
      panel.style.bottom = 'auto';
    };

    const initPosition = () => {
      const rect = panel.getBoundingClientRect();
      const viewportHeight =
        window.innerHeight || document.documentElement.clientHeight || 0;
      const startTop = viewportHeight - rect.height - MIN_VERTICAL_MARGIN;
      setPanelTop(startTop);
    };

    const setToggleIcon = () => {
      if (!toggle) return;
      const collapsed = panel.classList.contains('collapsed');
      toggle.textContent = collapsed ? '»' : '«';
      toggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
    };

    const startDrag = (event) => {
      if (isDragging) return;
      isDragging = true;
      pointerId = event.pointerId;
      const rect = panel.getBoundingClientRect();
      dragOffsetY = event.clientY - rect.top;

      if (panel.setPointerCapture) {
        try {
          panel.setPointerCapture(pointerId);
        } catch (_) {}
      }

      panel.classList.add('dragging');
    };

    const moveDrag = (event) => {
      if (!isDragging) return;
      if (pointerId != null && event.pointerId !== pointerId) return;
      setPanelTop(event.clientY - dragOffsetY);
    };

    const stopDrag = (event) => {
      if (!isDragging) return;
      if (event && pointerId != null && event.pointerId !== pointerId) return;

      isDragging = false;
      if (pointerId != null && panel.releasePointerCapture) {
        try {
          panel.releasePointerCapture(pointerId);
        } catch (_) {}
      }
      pointerId = null;
      panel.classList.remove('dragging');
    };

    if (toggle) {
      toggle.addEventListener('click', () => {
        panel.classList.toggle('collapsed');
        setToggleIcon();
      });
      setToggleIcon();
    }

    panel.addEventListener('pointerdown', (event) => {
      if (event.button !== 0) return;
      if (event.target.closest('#quick-stats-toggle')) return;
      event.preventDefault();
      startDrag(event);
    });

    panel.addEventListener('pointermove', moveDrag);
    panel.addEventListener('pointerup', stopDrag);
    panel.addEventListener('pointercancel', stopDrag);
    window.addEventListener('blur', stopDrag);

    window.addEventListener('resize', () => {
      const rect = panel.getBoundingClientRect();
      setPanelTop(rect.top);
    });

    initPosition();
  });
})();
