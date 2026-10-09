/**
 * SIDEBAR – builds the collapsible chapter/subchapter menu from App.curriculum.
 * You normally don't edit this file when adding lessons: edit curriculum.js instead.
 *
 * Behaviour:
 *  - Desktop: ☰ toggles an icon-only "rail" (body.sidebar-collapsed), remembered in storage.
 *  - Mobile (<= 900px): ☰ opens an off-canvas menu (body.sidebar-open).
 *  - Each chapter is an accordion; open chapters are remembered in storage.
 */
(function (App) {
  'use strict';

  const MOBILE = window.matchMedia('(max-width: 900px)');
  const body = document.body;
  let nav, toggleBtn;

  function subHtml(chapter, sub) {
    const inner = `<span class="nav-num">${sub.number}</span><span class="nav-label">${sub.title}</span>`;
    if (sub.comingSoon) {
      return `<li><span class="nav-link nav-sub is-disabled" title="În curând">${inner}<span class="nav-tag">curând</span></span></li>`;
    }
    const route = App.curriculum.routeOf(chapter, sub);
    return `<li><a class="nav-link nav-sub" href="#/${route}" data-route="${route}">${inner}</a></li>`;
  }

  function chapterHtml(chapter, isOpen) {
    return `
      <li class="nav-chapter${isOpen ? ' is-open' : ''}" data-chapter="${chapter.id}" style="--chapter-color:${chapter.color}">
        <button type="button" class="nav-chapter-btn" aria-expanded="${isOpen}" title="Capitolul ${chapter.number}: ${chapter.title}">
          <span class="nav-icon">${chapter.icon}</span>
          <span class="nav-label"><small>Capitolul ${chapter.number}</small>${chapter.title}</span>
          <span class="nav-caret" aria-hidden="true">›</span>
        </button>
        <div class="nav-subs-wrap">
          <ul class="nav-subs">${chapter.subchapters.map((s) => subHtml(chapter, s)).join('')}</ul>
        </div>
      </li>`;
  }

  function render() {
    const { chapters } = App.curriculum;
    const open = new Set(App.storage.get('openChapters', chapters.length ? [chapters[0].id] : []));
    nav.innerHTML = `
      <ul class="nav-root">
        <li><a class="nav-link nav-home" href="#/" data-route="" title="Acasă"><span class="nav-icon">🏠</span><span class="nav-label">Acasă</span></a></li>
        <li class="nav-heading"><span class="nav-label">Capitole</span></li>
        ${chapters.map((ch) => chapterHtml(ch, open.has(ch.id))).join('')}
      </ul>`;
  }

  function setChapterOpen(li, open) {
    li.classList.toggle('is-open', open);
    li.querySelector('.nav-chapter-btn').setAttribute('aria-expanded', String(open));
    App.storage.set('openChapters', [...nav.querySelectorAll('.nav-chapter.is-open')].map((el) => el.dataset.chapter));
  }

  const isRail = () => !MOBILE.matches && body.classList.contains('sidebar-collapsed');

  function updateToggle() {
    const expanded = MOBILE.matches ? body.classList.contains('sidebar-open') : !body.classList.contains('sidebar-collapsed');
    toggleBtn.setAttribute('aria-expanded', String(expanded));
  }

  function setCollapsed(collapsed) {
    body.classList.toggle('sidebar-collapsed', collapsed);
    App.storage.set('sidebarCollapsed', collapsed);
    updateToggle();
  }

  function closeMobile() {
    body.classList.remove('sidebar-open');
    updateToggle();
  }

  function applyMode() {
    if (MOBILE.matches) {
      body.classList.remove('sidebar-collapsed');
    } else {
      body.classList.remove('sidebar-open');
      body.classList.toggle('sidebar-collapsed', App.storage.get('sidebarCollapsed', false));
    }
    updateToggle();
  }

  function init({ navEl, toggleEl, backdropEl }) {
    nav = navEl;
    toggleBtn = toggleEl;
    render();
    applyMode();

    MOBILE.addEventListener('change', applyMode);

    toggleBtn.addEventListener('click', () => {
      if (MOBILE.matches) {
        body.classList.toggle('sidebar-open');
        updateToggle();
      } else {
        setCollapsed(!body.classList.contains('sidebar-collapsed'));
      }
    });

    backdropEl.addEventListener('click', closeMobile);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && body.classList.contains('sidebar-open')) closeMobile();
    });

    nav.addEventListener('click', (e) => {
      const btn = e.target.closest('.nav-chapter-btn');
      if (btn) {
        const li = btn.closest('.nav-chapter');
        if (isRail()) {
          setCollapsed(false); // clicking an icon in rail mode expands the menu on that chapter
          setChapterOpen(li, true);
        } else {
          setChapterOpen(li, !li.classList.contains('is-open'));
        }
        return;
      }
      if (e.target.closest('a.nav-link') && MOBILE.matches) closeMobile();
    });
  }

  /** Highlight the link for `route` and make sure its chapter is expanded. */
  function setActive(route) {
    nav.querySelectorAll('a.nav-link').forEach((a) => {
      const active = a.dataset.route === route;
      a.classList.toggle('is-active', active);
      if (active) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
      if (active) {
        const li = a.closest('.nav-chapter');
        if (li && !li.classList.contains('is-open')) setChapterOpen(li, true);
      }
    });
  }

  App.sidebar = { init, setActive };
})(window.MathApp);
