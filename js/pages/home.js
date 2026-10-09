/**
 * PAGE: home – hero + one card per chapter (generated from curriculum.js,
 * so new chapters/subchapters appear here automatically).
 */
(function (App) {
  'use strict';

  function subItem(chapter, sub) {
    if (sub.comingSoon) {
      return `<li><span class="is-disabled"><span class="nav-num">${sub.number}</span>${sub.title}<span class="nav-tag">În curând</span></span></li>`;
    }
    return `<li><a href="#/${App.curriculum.routeOf(chapter, sub)}"><span class="nav-num">${sub.number}</span>${sub.title}<span class="go">→</span></a></li>`;
  }

  function chapterCard(chapter) {
    return `
      <article class="card chapter-card" style="--chapter-color:${chapter.color}">
        <div class="chapter-card-head">
          <span class="chapter-card-icon">${chapter.icon}</span>
          <div><small>Capitolul ${chapter.number}</small><h3>${chapter.title}</h3></div>
        </div>
        <p>${chapter.description || ''}</p>
        <ul class="chapter-card-subs">${chapter.subchapters.map((s) => subItem(chapter, s)).join('')}</ul>
      </article>`;
  }

  App.registerLesson({
    id: 'home',
    mount(root) {
      const first = App.curriculum.firstAvailable();
      const digits = Array.from({ length: 10 }, (_, d) => `<span style="--i:${d};--c:var(--place-${d % 6})">${d}</span>`).join('');

      root.innerHTML = `
        <section class="hero">
          <div class="hero-text">
            <span class="hero-kicker">✨ Clasa pregătitoare</span>
            <h1>Bine ai venit în <span class="hero-highlight">Țara Numerelor</span>!</h1>
            <p>Aici învățăm să numărăm, să recunoaștem cifrele și să ne jucăm cu numerele. Alege un capitol și hai la drum!</p>
            ${first ? `<a class="btn btn-accent btn-xl" href="#/${App.curriculum.routeOf(first.chapter, first.sub)}">▶ Începe prima lecție</a>` : ''}
          </div>
          <div class="hero-art" aria-hidden="true">${digits}</div>
        </section>

        <h2 class="section-title">Capitole</h2>
        <div class="chapter-grid">${App.curriculum.chapters.map(chapterCard).join('')}</div>`;
    },
  });
})(window.MathApp);
