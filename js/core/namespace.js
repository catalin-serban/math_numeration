/**
 * Global namespace + lesson registry. Loaded FIRST.
 *
 * Every file attaches itself to window.MathApp. We use classic <script> tags
 * (no ES modules / bundler) so the site also works by double-clicking index.html.
 */
window.MathApp = window.MathApp || {};

(function (App) {
  'use strict';

  const lessons = new Map();

  /**
   * Register a lesson (or page). Contract:
   *   id               – unique string; referenced by `lessonId` in curriculum.js
   *   mount(root, ctx) – render into `root` (an empty <div>). May return a cleanup
   *                      function (remove document listeners, timers...) that the
   *                      router calls when the user navigates away.
   *   ctx              – { route, chapter, sub } (chapter/sub are undefined for pages)
   */
  App.registerLesson = function (def) {
    if (!def || !def.id || typeof def.mount !== 'function') {
      throw new Error('registerLesson: expected { id, mount(root, ctx) }');
    }
    if (lessons.has(def.id)) console.warn(`Lesson "${def.id}" registered twice – overriding.`);
    lessons.set(def.id, def);
  };

  App.getLesson = (id) => lessons.get(id);

  const PREFIX = 'tara-numerelor:';
  App.storage = {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem(PREFIX + key);
        return raw === null ? fallback : JSON.parse(raw);
      } catch {
        return fallback;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(PREFIX + key, JSON.stringify(value));
      } catch {
        /* storage unavailable (private mode / file:// restrictions) */
      }
    },
  };
})(window.MathApp);
