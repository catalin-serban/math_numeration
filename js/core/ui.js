/**
 * UI helpers shared by lessons.
 * NOTE: these build HTML strings from trusted, static curriculum data only –
 * never interpolate user-typed text without escaping it first.
 */
(function (App) {
  'use strict';

  /** Standard header on top of every lesson: badge (chapter + number), title, intro. */
  function lessonHeader({ chapter, sub }, introHtml = '') {
    return `
      <header class="lesson-head" style="--chapter-color:${chapter.color}">
        <span class="lesson-badge">${chapter.icon} Capitolul ${chapter.number} · Lecția ${sub.number}</span>
        <h1 class="lesson-title">${sub.title}</h1>
        ${introHtml ? `<p class="lesson-intro">${introHtml}</p>` : ''}
      </header>`;
  }

  App.ui = { lessonHeader };
})(window.MathApp);
