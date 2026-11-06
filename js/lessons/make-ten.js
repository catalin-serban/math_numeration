/**
 * LESSON "make-ten" – Capitolul 2 · 2.2 "Facem 10!"
 *
 * Goal: the "make ten" strategy (adunarea / scăderea cu trecere peste ordin).
 *  A snake made of bubbles has a framed "zone of 10" (two groups of 5) in its body.
 *  Addition a + b (sum 11..18): a purple bubbles sit in the zone, b gold bubbles wait in the pool.
 *    1. need   – how many does a need to reach 10? (10 − a) -> gold bubbles fly into the zone
 *    2. left   – how many are left from b? (b − need)        -> they join the snake after the zone
 *    3. result – 10 + left = ?
 *  Subtraction m − s (m 11..18, s > m − 10): full zone + (m − 10) bubbles outside it.
 *    1. need   – how many do we take away to reach 10? (m − 10) -> they fly into the basket
 *    2. left   – how many more must go? (s − need)              -> taken from the zone
 *    3. result – 10 − left = ?
 *  Under the equation a number bond splits the second term into need + left.
 *  Levels: "friends" (only step 1 – the friends of 10), "guided" (all steps with the snake),
 *  "numbers" (all steps, snake hidden).
 *  Answers: 3 big buttons or the digit keys (two digits for 11..18); Enter = next exercise.
 *  Extra: in steps 1–2 the child can also drag (or tap) the bubbles; when the right amount
 *  has been moved, the step is solved. A round has 5 exercises; settings are persisted.
 *
 * Structure: CONFIG -> pure helpers (exercises, choices, texts) -> template() -> mount()
 * Styles: css/lessons/make-ten.css (all classes prefixed with "mt-").
 */
(function (App) {
  'use strict';

  /* ---------------- CONFIG ---------------- */

  const OPS = {
    add: { label: 'Adunare', icon: '➕' },
    sub: { label: 'Scădere', icon: '➖' },
  };
  const LEVELS = {
    friends: { label: 'Prietenii lui 10', icon: '🤝' },
    guided: { label: 'Pas cu pas', icon: '🐍' },
    numbers: { label: 'Doar cu cifre', icon: '🧠' },
  };
  const DEFAULTS = { op: 'add', level: 'guided' };
  const STORAGE_KEY = 'make-ten';
  const ROUND = 5;
  const ZONE = 10;
  const FRIENDS_POOL = 9; // gold bubbles offered in the "friends of 10" level (addition)
  const FLY_MS = 560;
  const STAGGER_MS = 140;
  const PAUSE_MS = 450;
  const KEY_WAIT_MS = 1200;
  const DRAG_THRESHOLD = 6;
  const DROP_MARGIN = 28;

  const INTRO =
    'Cel mai ușor calculăm dacă ajungem întâi la <b>10</b>! Șarpele are un <b>chenar de 10</b>: ' +
    'îl umplem (sau coborâm până la el), apoi adăugăm (sau scoatem) <b>ce a mai rămas</b>.';

  /* ---------------- PURE HELPERS ---------------- */

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function addExercise(a, b) {
    const need = ZONE - a;
    return b == null
      ? { op: 'add', a, need, result: ZONE }
      : { op: 'add', a, b, need, left: b - need, result: a + b };
  }

  function subExercise(m, s) {
    const need = m - ZONE;
    return s == null
      ? { op: 'sub', m, need, result: ZONE }
      : { op: 'sub', m, s, need, left: s - need, result: m - s };
  }

  function allExercises(op, level) {
    const list = [];
    if (level === 'friends') {
      for (let k = 1; k <= 9; k++) list.push(op === 'add' ? addExercise(k) : subExercise(ZONE + k));
    } else if (op === 'add') {
      for (let a = 2; a <= 9; a++) for (let b = 2; b <= 9; b++) if (a + b > ZONE) list.push(addExercise(a, b));
    } else {
      for (let m = ZONE + 1; m <= 18; m++) for (let s = m - ZONE + 1; s <= 9; s++) list.push(subExercise(m, s));
    }
    return list;
  }

  const stepsFor = (level) => (level === 'friends' ? ['need'] : ['need', 'left', 'result']);
  const answerOf = (ex, step) => ex[step];
  const rangeOf = (ex, step) => (step === 'result' && ex.op === 'add' ? [ZONE + 1, 18] : [1, 9]);

  function makeChoices(answer, [lo, hi]) {
    const near = [...shuffle([answer - 1, answer + 1]), ...shuffle([answer - 2, answer + 2]), answer + 3, answer - 3];
    const wrong = near.filter((v) => v >= lo && v <= hi).slice(0, 2);
    return [answer, ...wrong].sort((x, y) => x - y);
  }

  function sanitize(c) {
    return {
      op: OPS[c.op] ? c.op : DEFAULTS.op,
      level: LEVELS[c.level] ? c.level : DEFAULTS.level,
    };
  }

  /* ----- texts ----- */

  function greet(ex) {
    if (ex.op === 'add') {
      return ex.b == null
        ? `Ce prieten îi trebuie lui <b>${ex.a}</b> ca să facă <b>10</b>?`
        : `Hai să calculăm <b>${ex.a} + ${ex.b}</b>! Întâi facem <b>10</b>.`;
    }
    return ex.s == null
      ? `Coborâm de la <b>${ex.m}</b> până la <b>10</b>.`
      : `Hai să calculăm <b>${ex.m} − ${ex.s}</b>! Întâi coborâm la <b>10</b>.`;
  }

  function question(ex, step) {
    if (ex.op === 'add') {
      if (step === 'need') return `Câte îi mai trebuie lui <b>${ex.a}</b> ca să ajungă la <b>10</b>?`;
      if (step === 'left') return `Din <b>${ex.b}</b> am dat <b>${ex.need}</b>. Câte au mai rămas?`;
      return `Cât fac <b>10 + ${ex.left}</b>?`;
    }
    if (step === 'need') return `Câte scoatem din <b>${ex.m}</b> ca să ajungem la <b>10</b>?`;
    if (step === 'left') return `Trebuie să scoatem <b>${ex.s}</b>. Am scos <b>${ex.need}</b>. Câte mai scoatem?`;
    return `Cât fac <b>10 − ${ex.left}</b>?`;
  }

  function hint(ex, step, snake) {
    if (ex.op === 'add') {
      if (step === 'need') return snake ? 'Numără <b>locurile goale</b> din chenarul de 10.' : `Numără pe degete de la <b>${ex.a}</b> până la <b>10</b>.`;
      if (step === 'left') return snake ? 'Numără bulițele galbene care au rămas jos.' : `Câte rămân dacă din <b>${ex.b}</b> dăm <b>${ex.need}</b>?`;
      return `Gândește-te: o zece și încă <b>${ex.left}</b> unități.`;
    }
    if (step === 'need') return snake ? 'Numără bulițele <b>din afara</b> chenarului.' : `<b>${ex.m}</b> înseamnă o zece și <b>${ex.need}</b> unități.`;
    if (step === 'left') return snake ? 'Numără <b>locurile goale</b> din coș.' : `Numără de la <b>${ex.need}</b> până la <b>${ex.s}</b>.`;
    return snake ? 'Numără bulițele care au rămas în chenar.' : `Numără înapoi de la <b>10</b>, de <b>${ex.left}</b> ori.`;
  }

  function stepLine(ex, step) {
    if (ex.op === 'add') {
      if (step === 'need') return `${ex.a} + ${ex.need} = 10`;
      if (step === 'left') return `${ex.b} = ${ex.need} + ${ex.left}`;
      return `10 + ${ex.left} = ${ex.result}`;
    }
    if (step === 'need') return `${ex.m} − ${ex.need} = 10`;
    if (step === 'left') return `${ex.s} = ${ex.need} + ${ex.left}`;
    return `10 − ${ex.left} = ${ex.result}`;
  }

  function summaryLine(ex) {
    return ex.op === 'add'
      ? `${ex.a} + ${ex.b} = ${ex.a} + ${ex.need} + ${ex.left} = 10 + ${ex.left} = <b>${ex.result}</b>`
      : `${ex.m} − ${ex.s} = ${ex.m} − ${ex.need} − ${ex.left} = 10 − ${ex.left} = <b>${ex.result}</b>`;
  }

  function praise(ex, step) {
    const line = `<b>${stepLine(ex, step)}</b>`;
    if (step === 'need') return `Bravo! ${line}. ${ex.op === 'add' ? 'Am făcut' : 'Am ajuns la'} <b>10</b>! 🎯`;
    if (step === 'left') return `Da! ${line}.`;
    return `Super! ${line}.`;
  }

  function dragTip(ex, step) {
    if (ex.op === 'add') return 'Poți și să <b>tragi</b> (sau să atingi) bulițele galbene în șarpe.';
    return step === 'need'
      ? 'Poți și să <b>tragi</b> (sau să atingi) bulițele din afara chenarului în coș.'
      : 'Poți și să <b>tragi</b> (sau să atingi) bulițe din chenar în coș.';
  }

  /* ---------------- TEMPLATE ---------------- */

  const radios = (name, items) => `
    <div class="mt-seg">
      ${items.map(([value, html]) => `<label><input type="radio" name="${name}" value="${value}"><span>${html}</span></label>`).join('')}
    </div>`;

  const box = (step, c, extra = '') => `<span class="mt-box ${extra}" data-box="${step}" data-c="${c}">?</span>`;

  function equationHtml(ex) {
    const partC = ex.op === 'add' ? 'b' : 'out';
    const first = ex.op === 'add' ? ex.a : ex.m;
    const sign = ex.op === 'add' ? '+' : '−';
    if (ex.left == null) {
      return `
        <span class="mt-n">${first}</span><span class="mt-op">${sign}</span>${box('need', partC)}
        <span class="mt-op">=</span><span class="mt-n mt-ten">10</span>`;
    }
    const second = ex.op === 'add' ? ex.b : ex.s;
    return `
      <span class="mt-n">${first}</span><span class="mt-op">${sign}</span>
      <span class="mt-split">
        <span class="mt-n">${second}</span>
        <svg class="mt-legs" viewBox="0 0 100 34" aria-hidden="true"><line x1="50" y1="3" x2="20" y2="31"/><line x1="50" y1="3" x2="80" y2="31"/></svg>
        <span class="mt-parts">${box('need', partC)}${box('left', partC)}</span>
      </span>
      <span class="mt-op">=</span>${box('result', 'res', 'mt-box-res')}`;
  }

  function template(ctx) {
    const slots = Array.from({ length: ZONE }, () => '<span class="mt-slot"></span>').join('');
    return `
      ${App.ui.lessonHeader(ctx, INTRO)}
      <div class="mt" data-op="add" data-level="guided" data-step="need">
        <section class="card mt-toolbar" aria-label="Setări">
          <form class="mt-settings">
            ${radios('mt-op', Object.entries(OPS).map(([k, o]) => [k, `${o.icon} ${o.label}`]))}
            ${radios('mt-level', Object.entries(LEVELS).map(([k, l]) => [k, `${l.icon} ${l.label}`]))}
          </form>
          <p class="mt-progress" aria-live="polite"></p>
        </section>

        <section class="card mt-snake-card" aria-label="Șarpele cu bulițe">
          <div class="mt-snake">
            <span class="mt-tail" aria-hidden="true"></span>
            <div class="mt-zone" aria-hidden="true">
              <span class="mt-zone-tag">10</span>
              <div class="mt-slots">${slots}</div>
            </div>
            <span class="mt-break" aria-hidden="true"></span>
            <div class="mt-rest" aria-hidden="true"></div>
            <div class="mt-head" aria-hidden="true">
              <span class="mt-eye"></span><span class="mt-eye"></span><span class="mt-tongue"></span>
            </div>
          </div>
          <div class="mt-tray" aria-hidden="true">
            <span class="mt-tray-label"></span>
            <div class="mt-tray-bubbles"></div>
          </div>
        </section>

        <div class="mt-play">
          <section class="card mt-eq-card" aria-label="Calculul">
            <div class="mt-eq"></div>
            <ol class="mt-lines"></ol>
          </section>

          <section class="card mt-ask-card" aria-label="Întrebarea">
            <p class="mt-question" aria-live="polite"></p>
            <div class="mt-choices"></div>
            <p class="mt-tip"></p>
            <button type="button" class="btn btn-success btn-xl btn-block mt-next" data-action="next"></button>
            <div class="mt-mascot">
              <div class="mt-mascot-face" aria-hidden="true">🐍</div>
              <div class="mt-mascot-bubble"><p class="mt-say" aria-live="polite"></p></div>
            </div>
          </section>
        </div>
      </div>`;
  }

  /* ---------------- MOUNT ---------------- */

  function mount(root, ctx) {
    root.innerHTML = template(ctx);

    const $ = (sel) => root.querySelector(sel);
    const container = $('.mt');
    const form = $('.mt-settings');
    const progressEl = $('.mt-progress');
    const snakeEl = $('.mt-snake');
    const zoneEl = $('.mt-zone');
    const slotsEl = $('.mt-slots');
    const restEl = $('.mt-rest');
    const headEl = $('.mt-head');
    const trayEl = $('.mt-tray');
    const trayLabel = $('.mt-tray-label');
    const trayBubbles = $('.mt-tray-bubbles');
    const eqEl = $('.mt-eq');
    const eqCard = $('.mt-eq-card');
    const linesEl = $('.mt-lines');
    const questionEl = $('.mt-question');
    const choicesEl = $('.mt-choices');
    const tipEl = $('.mt-tip');
    const nextBtn = $('.mt-next');
    const sayEl = $('.mt-say');
    const bubbleEl = $('.mt-mascot-bubble');

    // `session` changes on every new exercise / unmount so in-flight animations know to stop.
    const state = {
      cfg: sanitize(App.storage.get(STORAGE_KEY, DEFAULTS) || {}),
      list: [],
      index: 0,
      ex: null,
      steps: [],
      stepIdx: 0,
      busy: false,
      session: 0,
      keyBuf: '',
      keyTimer: 0,
      drag: null,
    };

    const currentStep = () => state.steps[state.stepIdx] || 'done';
    const snakeVisible = () => state.cfg.level !== 'numbers';
    const isDone = () => currentStep() === 'done';

    /* ----- painting ----- */

    function say(html) {
      sayEl.innerHTML = html;
      App.effects.pop(bubbleEl);
    }

    function paintSettings() {
      form.elements['mt-op'].value = state.cfg.op;
      form.elements['mt-level'].value = state.cfg.level;
      container.dataset.op = state.cfg.op;
      container.dataset.level = state.cfg.level;
    }

    function paintProgress() {
      const done = state.index;
      progressEl.textContent = `${'⭐'.repeat(done)}${'☆'.repeat(ROUND - done)}  ${done} / ${ROUND}`;
    }

    function makeBubble(c) {
      const el = document.createElement('span');
      el.className = 'mt-bubble';
      el.dataset.c = c;
      return el;
    }

    const zoneBubbles = () => [...slotsEl.querySelectorAll('.mt-bubble')];
    const emptySlots = (host) => [...host.querySelectorAll('.mt-slot:not(.is-filled)')];
    const restBubbles = () => [...restEl.querySelectorAll('.mt-bubble')];
    const trayCount = () => trayBubbles.querySelectorAll('.mt-bubble').length;

    function updateTen() {
      zoneEl.classList.toggle('is-ten', zoneBubbles().length === ZONE);
    }

    function fillSlot(slot, c) {
      slot.classList.add('is-filled');
      slot.appendChild(makeBubble(c));
    }

    function renderSnake(ex) {
      slotsEl.querySelectorAll('.mt-slot').forEach((slot, i) => {
        slot.className = 'mt-slot';
        slot.textContent = '';
        if (ex.op === 'sub' || i < ex.a) fillSlot(slot, 'a');
      });
      restEl.textContent = '';
      if (ex.op === 'sub') for (let i = 0; i < ex.need; i++) restEl.appendChild(makeBubble('a'));

      trayBubbles.textContent = '';
      if (ex.op === 'add') {
        const count = ex.b == null ? FRIENDS_POOL : ex.b;
        for (let i = 0; i < count; i++) trayBubbles.appendChild(makeBubble('b'));
        trayLabel.innerHTML = ex.b == null ? '🫧 Bulițe galbene' : `🫧 <b>${ex.b}</b> bulițe galbene`;
      } else {
        if (ex.s != null) {
          for (let i = 0; i < ex.s; i++) trayBubbles.insertAdjacentHTML('beforeend', '<span class="mt-slot"></span>');
        }
        trayLabel.innerHTML = ex.s == null ? '🧺 Coșul' : `🧺 Scoatem <b>${ex.s}</b>`;
      }
      headEl.classList.remove('is-happy');
      updateTen();
    }

    /* ----- moving bubbles (FLIP: measure, move in the DOM, animate from the old place) ----- */

    // `n` distinct empty basket slots (extra slots are created when the basket has no placeholders).
    function trayTargets(n) {
      const slots = emptySlots(trayBubbles).slice(0, n);
      while (slots.length < n) {
        const fresh = document.createElement('span');
        fresh.className = 'mt-slot';
        trayBubbles.appendChild(fresh);
        slots.push(fresh);
      }
      return slots;
    }

    function animateFrom(el, from, delay) {
      if (!snakeVisible() || App.effects.reducedMotion()) return Promise.resolve();
      const to = el.getBoundingClientRect();
      const dx = from.left + from.width / 2 - (to.left + to.width / 2);
      const dy = from.top + from.height / 2 - (to.top + to.height / 2);
      el.classList.add('is-flying');
      const anim = el.animate(
        [
          { translate: `${dx}px ${dy}px`, scale: 1.1 },
          { translate: `${dx / 2}px ${dy / 2 - 46}px`, scale: 1.3, offset: 0.5 },
          { translate: '0px 0px', scale: 1 },
        ],
        { duration: FLY_MS, delay, easing: 'ease-in-out', fill: 'backwards' }
      );
      return anim.finished.catch(() => {}).then(() => el.classList.remove('is-flying'));
    }

    // items: [{ src, dest, c? }] – dest is an empty .mt-slot or a container that gets the bubble appended.
    function moveMany(items) {
      const session = state.session;
      const froms = items.map(({ src }) => src.getBoundingClientRect());
      const moved = items.map(({ src, dest, c }) => {
        const el = makeBubble(c || src.dataset.c);
        const slot = src.parentElement.classList.contains('mt-slot') ? src.parentElement : null;
        if (slot) slot.classList.remove('is-filled');
        src.remove();
        if (dest.classList.contains('mt-slot')) dest.classList.add('is-filled');
        dest.appendChild(el);
        return el;
      });
      return Promise.all(
        moved.map((el, k) =>
          animateFrom(el, froms[k], k * STAGGER_MS).then(() => {
            if (session !== state.session) return;
            if (snakeVisible()) App.sound.play('step', Math.min(9, k + 1));
            if (el.dataset.c === 'a' && el.closest('.mt-tray')) el.dataset.c = 'out';
          })
        )
      ).then(() => {
        if (session === state.session) updateTen();
      });
    }

    // Moves whatever is still missing for `step` (some bubbles may already have been dragged).
    function itemsFor(step) {
      const ex = state.ex;
      if (ex.op === 'add') {
        const pool = [...trayBubbles.querySelectorAll('.mt-bubble')];
        if (step === 'need') {
          const slots = emptySlots(slotsEl);
          return pool.slice(0, slots.length).map((src, k) => ({ src, dest: slots[k] }));
        }
        if (step === 'left') return pool.map((src) => ({ src, dest: restEl }));
        return [];
      }
      let srcs = [];
      if (step === 'need') srcs = restBubbles();
      else if (step === 'left') {
        const missing = ex.s - trayCount();
        if (missing > 0) srcs = zoneBubbles().slice(-missing).reverse();
      }
      const dests = trayTargets(srcs.length);
      return srcs.map((src, k) => ({ src, dest: dests[k] }));
    }

    function stepComplete(step) {
      const ex = state.ex;
      if (ex.op === 'add') {
        if (step === 'need') return zoneBubbles().length === ZONE;
        return trayCount() === 0;
      }
      if (step === 'need') return restBubbles().length === 0;
      return trayCount() === ex.s;
    }

    function grabbables(step) {
      if (state.ex.op === 'add') return [...trayBubbles.querySelectorAll('.mt-bubble')];
      return step === 'need' ? restBubbles() : zoneBubbles();
    }

    const canDrag = () => snakeVisible() && !state.busy && (currentStep() === 'need' || currentStep() === 'left');

    function refreshGrab() {
      root.querySelectorAll('.mt-bubble.is-grab').forEach((b) => b.classList.remove('is-grab'));
      if (canDrag()) grabbables(currentStep()).forEach((b) => b.classList.add('is-grab'));
    }

    function dropZone() {
      if (state.ex.op === 'sub') return trayEl;
      return currentStep() === 'need' ? zoneEl : snakeEl;
    }

    function overDropZone(x, y) {
      const r = dropZone().getBoundingClientRect();
      return x >= r.left - DROP_MARGIN && x <= r.right + DROP_MARGIN && y >= r.top - DROP_MARGIN && y <= r.bottom + DROP_MARGIN;
    }

    function grabMove(el) {
      const step = currentStep();
      const ex = state.ex;
      let dest;
      if (ex.op === 'add') dest = step === 'need' ? emptySlots(slotsEl)[0] : restEl;
      else dest = trayTargets(1)[0];
      if (!dest) return;
      const session = state.session;
      const flight = moveMany([{ src: el, dest }]);
      if (stepComplete(step)) {
        state.busy = true;
        refreshGrab();
        flight.then(() => session === state.session && solveStep(null));
      }
    }

    /* ----- exercise flow ----- */

    function newRound() {
      state.list = shuffle(allExercises(state.cfg.op, state.cfg.level)).slice(0, ROUND);
      state.index = 0;
      paintSettings();
      App.sound.play('start');
      loadExercise();
    }

    function loadExercise() {
      state.session++;
      state.ex = state.list[state.index];
      state.steps = stepsFor(state.cfg.level);
      state.stepIdx = 0;
      state.busy = false;
      renderSnake(state.ex);
      eqEl.innerHTML = equationHtml(state.ex);
      linesEl.textContent = '';
      paintProgress();
      say(greet(state.ex));
      askStep();
    }

    function askStep() {
      const ex = state.ex;
      const step = currentStep();
      container.dataset.step = step;
      questionEl.innerHTML = question(ex, step);
      choicesEl.innerHTML = makeChoices(answerOf(ex, step), rangeOf(ex, step))
        .map((v) => `<button type="button" class="btn btn-xl btn-ghost mt-choice" data-value="${v}">${v}</button>`)
        .join('');
      eqEl.querySelectorAll('.mt-box').forEach((b) => b.classList.toggle('is-active', b.dataset.box === step));
      const keys = 'Sau scrie răspunsul cu tastele <kbd>0</kbd>–<kbd>9</kbd>.';
      tipEl.innerHTML = canDrag() ? `${dragTip(ex, step)} ${keys}` : keys;
      refreshGrab();
      App.effects.pop(questionEl);
    }

    function lockChoices() {
      const answer = String(answerOf(state.ex, currentStep()));
      choicesEl.querySelectorAll('.mt-choice').forEach((b) => {
        b.disabled = true;
        if (b.dataset.value === answer) b.classList.add('is-right');
      });
    }

    function addLine(html, extra = '') {
      const li = document.createElement('li');
      if (extra) li.className = extra;
      li.innerHTML = html;
      linesEl.appendChild(li);
      App.effects.pop(li);
    }

    async function solveStep() {
      const session = state.session;
      const ex = state.ex;
      const step = currentStep();
      state.busy = true;
      refreshGrab();
      lockChoices();

      const filled = eqEl.querySelector(`[data-box="${step}"]`);
      if (filled) {
        filled.textContent = String(answerOf(ex, step));
        filled.classList.remove('is-active');
        filled.classList.add('is-filled');
        App.effects.pop(filled);
      }
      App.sound.play('ok');
      say(praise(ex, step));

      await moveMany(itemsFor(step));
      if (session !== state.session) return;

      addLine(stepLine(ex, step));
      if (step === 'need') {
        App.sound.play(ex.op === 'add' ? 'carry' : 'borrow');
        App.effects.pop(zoneEl);
      }
      await wait(PAUSE_MS);
      if (session !== state.session) return;

      state.stepIdx++;
      state.busy = false;
      if (isDone()) finishExercise();
      else askStep();
    }

    function finishExercise() {
      const ex = state.ex;
      container.dataset.step = 'done';
      state.index++;
      paintProgress();
      if (state.steps.length > 1) addLine(summaryLine(ex), 'is-summary');
      headEl.classList.add('is-happy');
      questionEl.innerHTML = 'Gata! 🎉';
      choicesEl.textContent = '';
      tipEl.textContent = '';

      if (state.index >= ROUND) {
        App.sound.play('celebrate');
        App.effects.confetti(eqCard, { count: 90 });
        nextBtn.textContent = '🎲 Rundă nouă';
        say('<b>Felicitări!</b> Ai terminat toată runda! Apasă <b>Rundă nouă</b> ca să mai jucăm.');
      } else {
        App.effects.confetti(eqCard, { count: 26, spread: 0.6 });
        nextBtn.textContent = 'Următorul ➜';
        const done = ex.left == null
          ? `Bravo! <b>${stepLine(ex, 'need')}</b>.`
          : `Bravo! <b>${ex.op === 'add' ? `${ex.a} + ${ex.b}` : `${ex.m} − ${ex.s}`} = ${ex.result}</b>.`;
        say(`${done} Apasă <b>Următorul</b>.`);
      }
      nextBtn.focus({ preventScroll: true });
    }

    function next() {
      if (!isDone()) return;
      if (state.index >= ROUND) newRound();
      else loadExercise();
    }

    function wrong(btn) {
      const step = currentStep();
      btn.classList.add('is-wrong');
      btn.disabled = true;
      App.effects.shake(btn);
      App.sound.play('bump');
      say(`Încă o dată! ${hint(state.ex, step, snakeVisible())}`);
      showHint(step);
    }

    function showHint(step) {
      if (!snakeVisible()) return;
      const ex = state.ex;
      let els;
      if (ex.op === 'add') {
        if (step === 'need') els = emptySlots(slotsEl);
        else if (step === 'left') els = [...trayBubbles.querySelectorAll('.mt-bubble')];
        else els = restBubbles();
      } else if (step === 'need') els = restBubbles();
      else if (step === 'left') els = emptySlots(trayBubbles);
      else els = zoneBubbles();
      els.forEach((el) => App.effects.pop(el, 'is-hint'));
    }

    function answer(btn) {
      if (state.busy || isDone() || !btn || btn.disabled) return;
      if (Number(btn.dataset.value) === answerOf(state.ex, currentStep())) solveStep();
      else wrong(btn);
    }

    /* ----- keyboard: digits pick a choice (two digits for 11..18), Enter = next ----- */

    function clearKeys() {
      state.keyBuf = '';
      clearTimeout(state.keyTimer);
      choicesEl.querySelectorAll('.is-typing').forEach((b) => b.classList.remove('is-typing'));
    }

    function typeDigit(d) {
      if (state.busy || isDone()) return;
      const buttons = [...choicesEl.querySelectorAll('.mt-choice:not(:disabled)')];
      const buf = state.keyBuf + d;
      clearKeys();
      const exact = buttons.find((b) => b.dataset.value === buf);
      const prefix = buttons.filter((b) => b.dataset.value.startsWith(buf) && b.dataset.value !== buf);
      if (exact && !prefix.length) {
        exact.classList.add('is-pressed');
        setTimeout(() => exact.classList.remove('is-pressed'), 120);
        answer(exact);
      } else if (prefix.length) {
        state.keyBuf = buf;
        prefix.forEach((b) => b.classList.add('is-typing'));
        state.keyTimer = setTimeout(clearKeys, KEY_WAIT_MS);
      } else if (buf.length > 1) {
        typeDigit(d);
      } else {
        App.effects.shake(choicesEl);
        say('Alege unul dintre numerele de pe <b>butoane</b>.');
      }
    }

    function onKey(e) {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.key === 'Enter' && isDone()) {
        if (e.target.closest && e.target.closest('button')) return; // the focused button handles it
        e.preventDefault();
        next();
      } else if (/^\d$/.test(e.key)) {
        e.preventDefault();
        typeDigit(e.key);
      }
    }

    /* ----- drag (pointer events, captured on the bubble so everything stays inside root) ----- */

    function onPointerDown(e) {
      const el = e.target.closest('.mt-bubble.is-grab');
      if (!el || state.busy || e.button > 0) return;
      e.preventDefault();
      el.setPointerCapture(e.pointerId);
      state.drag = { el, id: e.pointerId, x: e.clientX, y: e.clientY, moved: false };
    }

    function onPointerMove(e) {
      const d = state.drag;
      if (!d || e.pointerId !== d.id) return;
      const dx = e.clientX - d.x;
      const dy = e.clientY - d.y;
      if (!d.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      d.moved = true;
      d.el.classList.add('is-dragging');
      d.el.style.translate = `${dx}px ${dy}px`;
    }

    function onPointerUp(e) {
      const d = state.drag;
      if (!d || e.pointerId !== d.id) return;
      state.drag = null;
      d.el.classList.remove('is-dragging');
      const dropped = e.type === 'pointerup' && (!d.moved || overDropZone(e.clientX, e.clientY));
      if (dropped && canDrag() && d.el.isConnected) {
        grabMove(d.el);
        return;
      }
      if (d.moved) {
        const from = d.el.style.translate;
        d.el.style.translate = '';
        d.el.animate([{ translate: from }, { translate: '0px 0px' }], { duration: 250, easing: 'ease-out' });
      }
    }

    /* ----- listeners ----- */

    root.addEventListener('click', (e) => {
      const choice = e.target.closest('.mt-choice');
      if (choice) return answer(choice);
      if (e.target.closest('[data-action="next"]')) next();
    });
    root.addEventListener('pointerdown', onPointerDown);
    root.addEventListener('pointermove', onPointerMove);
    root.addEventListener('pointerup', onPointerUp);
    root.addEventListener('pointercancel', onPointerUp);
    form.addEventListener('change', () => {
      state.cfg = sanitize({ op: form.elements['mt-op'].value, level: form.elements['mt-level'].value });
      App.storage.set(STORAGE_KEY, state.cfg);
      newRound();
    });
    form.addEventListener('submit', (e) => e.preventDefault());
    document.addEventListener('keydown', onKey);

    newRound();
    say('Salut! Eu sunt <b>Zuzu</b>, șarpele care iubește numărul <b>10</b>. ' + greet(state.ex));

    return () => {
      state.session++;
      clearKeys();
      document.removeEventListener('keydown', onKey);
    };
  }

  App.registerLesson({ id: 'make-ten', mount });
})(window.MathApp);
