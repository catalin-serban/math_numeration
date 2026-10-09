/**
 * CURRICULUM – the single place that defines the menu (chapters -> subchapters).
 *
 * HOW TO ADD CONTENT
 *  - New chapter:    push an object into `chapters` (unique `id`, next `number`,
 *                    an emoji `icon`, a `color`, `description`, `subchapters: []`).
 *  - New subchapter: push into a chapter's `subchapters`:
 *        { id: 'slug', number: 'N.M', title, description, lessonId: 'lesson-id' }
 *    `lessonId` must match the id passed to MathApp.registerLesson(...) in
 *    js/lessons/<lesson-id>.js. Use `comingSoon: true` (and no lessonId) to show
 *    a disabled "în curând" entry.
 *  - Route (URL hash) is generated automatically: #/<chapter.id>/<sub.id>
 *    so keep ids lowercase, ASCII, dash-separated and never rename published ones.
 */
(function (App) {
  'use strict';

  const chapters = [
    {
      id: 'capitol-1',
      number: 1,
      title: 'Lumea Numerelor',
      icon: '🔢',
      color: '#4D96FF',
      description: 'Descoperim cifrele, numărăm pas cu pas și aflăm ce sunt unitățile, zecile și sutele.',
      subchapters: [
        {
          id: 'turnurile-cifrelor',
          number: '1.1',
          title: 'Turnurile Cifrelor',
          description: 'Numărăm cu chenarul colorat și vedem cum 10 unități devin o zece.',
          lessonId: 'counting-columns',
        },
        {
          id: 'kakooma',
          number: '1.2',
          title: 'Kakooma',
          description: 'Joc de detectiv: găsește numărul care se obține din alte două numere ale aceleiași forme.',
          lessonId: 'kakooma',
        },
      ],
    },
    {
      id: 'capitol-2',
      number: 2,
      title: 'Adunarea',
      icon: '➕',
      color: '#2FBF71',
      description: 'Punem numerele laolaltă și aflăm cât fac împreună.',
      subchapters: [
        { id: 'adunam-pana-la-10', number: '2.1', title: 'Adunăm până la 10', comingSoon: true },
      ],
    },
  ];

  const routeOf = (chapter, sub) => `${chapter.id}/${sub.id}`;

  function findByRoute(route) {
    for (const chapter of chapters) {
      for (const sub of chapter.subchapters) {
        if (routeOf(chapter, sub) === route) return { chapter, sub };
      }
    }
    return null;
  }

  function firstAvailable() {
    for (const chapter of chapters) {
      const sub = chapter.subchapters.find((s) => !s.comingSoon);
      if (sub) return { chapter, sub };
    }
    return null;
  }

  App.curriculum = { chapters, routeOf, findByRoute, firstAvailable };
})(window.MathApp);
