(function () {
  document.addEventListener('DOMContentLoaded', () => {
    const panel = document.getElementById('quick-stats-panel');
    const toggle = document.getElementById('quick-stats-toggle');
    const content = document.getElementById('quick-stats-content');
    const closeButton = document.getElementById('quick-stats-close');
    if (!panel || !toggle || !content) return;

    const setCollapsed = (collapsed, options = {}) => {
      const openedFromToggle = !collapsed && document.activeElement === toggle;
      panel.classList.toggle('collapsed', collapsed);
      toggle.setAttribute('aria-expanded', String(!collapsed));
      toggle.setAttribute('aria-label', collapsed ? 'Open live stats' : 'Close live stats');
      toggle.toggleAttribute('inert', !collapsed);
      toggle.setAttribute('aria-hidden', String(!collapsed));
      content.toggleAttribute('inert', collapsed);
      content.setAttribute('aria-hidden', String(collapsed));

      if (!collapsed) {
        document.dispatchEvent(new CustomEvent('nodeshift:utility-open', { detail: { id: panel.id } }));
      }
      if (options.focus) {
        (collapsed ? toggle : closeButton)?.focus({ preventScroll: true });
      } else if (openedFromToggle) {
        closeButton?.focus({ preventScroll: true });
      }
    };

    toggle.addEventListener('click', () => setCollapsed(!panel.classList.contains('collapsed')));
    closeButton?.addEventListener('click', () => setCollapsed(true, { focus: true }));

    document.addEventListener('nodeshift:utility-open', (event) => {
      if (event.detail?.id !== panel.id) setCollapsed(true);
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !panel.classList.contains('collapsed')) {
        setCollapsed(true, { focus: true });
      }
    });

    panel.classList.add('collapsed');
    setCollapsed(true);
  });
})();
