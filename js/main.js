/**
 * BOOTSTRAP – must be the last script in index.html.
 */
(function (App) {
  'use strict';

  const soundBtn = document.getElementById('soundToggle');
  function paintSound() {
    const on = App.sound.isEnabled();
    soundBtn.textContent = on ? '🔊' : '🔇';
    soundBtn.setAttribute('aria-pressed', String(on));
    soundBtn.title = on ? 'Oprește sunetul' : 'Pornește sunetul';
  }
  soundBtn.addEventListener('click', () => {
    App.sound.setEnabled(!App.sound.isEnabled());
    paintSound();
    App.sound.play('step', 4);
  });
  paintSound();

  App.sidebar.init({
    navEl: document.getElementById('sidebarNav'),
    toggleEl: document.getElementById('sidebarToggle'),
    backdropEl: document.getElementById('sidebarBackdrop'),
  });

  App.router.start({
    contentEl: document.getElementById('content'),
    crumbsEl: document.getElementById('breadcrumbs'),
  });

  // Re-enable CSS transitions after the first paint.
  requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.remove('preload')));
})(window.MathApp);
