/**
 * EFFECTS – reusable animations for all lessons (styles in css/components.css).
 *   pop(el)                          – bouncy scale "pop"
 *   shake(el)                        – "no-no" shake (limit reached, wrong answer)
 *   confetti(el, { count, spread })  – confetti burst from the element's center
 *   flyBubble(fromEl, toEl, { text, color, duration }) -> Promise
 *                                    – a labelled bubble flies in an arc between two elements
 * All effects respect prefers-reduced-motion.
 */
(function (App) {
  'use strict';

  const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const DEFAULT_COLORS = [0, 1, 2, 3, 4, 5].map((i) => `var(--place-${i})`);

  let layerEl = null;
  function layer() {
    if (!layerEl || !layerEl.isConnected) {
      layerEl = document.createElement('div');
      layerEl.className = 'fx-layer';
      layerEl.setAttribute('aria-hidden', 'true');
      document.body.appendChild(layerEl);
    }
    return layerEl;
  }

  function center(el) {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  function pop(el, className = 'fx-pop') {
    if (!el) return;
    el.classList.remove(className);
    void el.offsetWidth; // force reflow so the CSS animation restarts
    el.classList.add(className);
  }

  function shake(el) {
    pop(el, 'fx-shake');
  }

  function confetti(anchorEl, { count = 36, spread = 1, colors = DEFAULT_COLORS } = {}) {
    if (!anchorEl || reducedMotion()) return;
    const { x, y } = center(anchorEl);
    const host = layer();
    for (let n = 0; n < count; n++) {
      const piece = document.createElement('span');
      piece.className = 'fx-confetti';
      piece.style.left = `${x}px`;
      piece.style.top = `${y}px`;
      piece.style.background = colors[n % colors.length];
      if (n % 3 === 0) piece.style.borderRadius = '50%';
      host.appendChild(piece);

      const angle = Math.random() * Math.PI * 2;
      const dist = (60 + Math.random() * 150) * spread;
      const dx = Math.cos(angle) * dist;
      const dy = Math.sin(angle) * dist;
      const anim = piece.animate(
        [
          { transform: 'translate(0, 0) rotate(0deg)', opacity: 1 },
          { transform: `translate(${dx}px, ${dy - 50}px) rotate(${Math.random() * 360}deg)`, opacity: 1, offset: 0.55 },
          { transform: `translate(${dx * 1.15}px, ${dy + 130}px) rotate(${Math.random() * 720}deg) scale(.6)`, opacity: 0 },
        ],
        { duration: 1100 + Math.random() * 700, easing: 'cubic-bezier(.2,.8,.3,1)', fill: 'forwards' }
      );
      anim.onfinish = () => piece.remove();
    }
  }

  function flyBubble(fromEl, toEl, { text = '+1', color = 'var(--primary)', duration = 700 } = {}) {
    const a = center(fromEl);
    const b = center(toEl);
    const bubble = document.createElement('div');
    bubble.className = 'fx-bubble';
    bubble.textContent = text;
    bubble.style.setProperty('--fx-color', color);
    layer().appendChild(bubble);

    const peakY = Math.min(a.y, b.y) - 70;
    const at = (x, y, s) => `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${s})`;
    const anim = bubble.animate(
      [
        { transform: at(a.x, a.y, 0.3), opacity: 0 },
        { transform: at(a.x, a.y - 20, 1.15), opacity: 1, offset: 0.2 },
        { transform: at(a.x + (b.x - a.x) * 0.35, peakY, 1.05), offset: 0.5 },
        { transform: at(a.x + (b.x - a.x) * 0.75, peakY + (b.y - peakY) * 0.35, 1), offset: 0.75 },
        { transform: at(b.x, b.y, 0.85), opacity: 1 },
      ],
      { duration: reducedMotion() ? 1 : duration, easing: 'ease-in-out', fill: 'forwards' }
    );
    return anim.finished.catch(() => {}).then(() => bubble.remove());
  }

  App.effects = { pop, shake, confetti, flyBubble, reducedMotion };
})(window.MathApp);
