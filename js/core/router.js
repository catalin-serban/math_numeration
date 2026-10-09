/**
 * ROUTER – hash based (#/<chapter-id>/<sub-id>), works without a server.
 *   ''                       -> page "home"
 *   '<chapter>/<sub>'        -> lesson registered under sub.lessonId
 *   anything else / comingSoon -> "not found" message
 * On every navigation the previous lesson's cleanup function is called first.
 */
(function (App) {
  'use strict';

  const SITE_TITLE = 'Țara Numerelor';
  let content, crumbs;
  let cleanup = null;

  const currentRoute = () => decodeURIComponent(location.hash.replace(/^#\/?/, '')).replace(/\/+$/, '');

  function resolve(route) {
    if (!route) return { lessonId: 'home', ctx: { route } };
    const found = App.curriculum.findByRoute(route);
    if (!found || found.sub.comingSoon) return { lessonId: null, ctx: { route } };
    return { lessonId: found.sub.lessonId, ctx: { route, ...found } };
  }

  function notFoundHtml() {
    return `
      <div class="card empty-state">
        <div class="empty-state-icon">🦉</div>
        <h1>Ups! Lecția asta nu e gata încă.</h1>
        <p class="lesson-intro">Alege altă lecție din meniu sau întoarce-te acasă.</p>
        <p><a class="btn" href="#/">🏠 Acasă</a></p>
      </div>`;
  }

  function renderCrumbs({ chapter, sub }) {
    crumbs.innerHTML = chapter
      ? `<span>${chapter.icon} Capitolul ${chapter.number} · ${chapter.title}</span><span class="crumb-sep">›</span><strong>${sub.title}</strong>`
      : '';
  }

  function render() {
    if (cleanup) {
      try { cleanup(); } catch (err) { console.error(err); }
      cleanup = null;
    }

    const route = currentRoute();
    const { lessonId, ctx } = resolve(route);
    const lesson = lessonId && App.getLesson(lessonId);

    const view = document.createElement('div');
    view.className = 'view';
    content.replaceChildren(view);

    if (lesson) {
      const result = lesson.mount(view, ctx);
      cleanup = typeof result === 'function' ? result : null;
    } else {
      if (lessonId) console.error(`Lesson "${lessonId}" is referenced in curriculum.js but not registered.`);
      view.innerHTML = notFoundHtml();
    }

    App.sidebar.setActive(route);
    renderCrumbs(ctx);
    document.title = ctx.sub ? `${ctx.sub.title} · ${SITE_TITLE}` : SITE_TITLE;
    window.scrollTo(0, 0);
  }

  function start({ contentEl, crumbsEl }) {
    content = contentEl;
    crumbs = crumbsEl;
    window.addEventListener('hashchange', render);
    render();
  }

  App.router = {
    start,
    navigate: (route) => { location.hash = `#/${route}`; },
  };
})(window.MathApp);
