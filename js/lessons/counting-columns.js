/**
 * LESSON "counting-columns" – Capitolul 1 · 1.1 "Turnurile Cifrelor"
 *
 * Goal: the child counts step by step and sees place value at work.
 *  - Each column ("turn") holds the digits 0..9 (0 at the bottom, 9 at the top).
 *  - A colored frame marks the current digit; ↑ moves it up, ↓ moves it down.
 *  - Going past 9: the frame slides back to 0, a "+1" bubble flies to the column
 *    on the left and that column's frame climbs one step (10 units = 1 ten).
 *  - Columns on the left stay empty until they are needed.
 *  - The "Numărul nostru" card shows the aggregated number, each digit framed in
 *    the color of its column, plus the decomposition ("2 zeci și 3 unități").
 *  - Optional (switch "Scriu eu numărul", off by default): the child types a number
 *    and the columns jump straight to it.
 *
 * Structure (reuse it for new lessons):
 *   CONFIG -> pure helpers -> template() -> mount() { state, paint*, actions, listeners, cleanup }
 * Styles: css/lessons/counting-columns.css (all classes prefixed with "cc-").
 */
(function (App) {
  'use strict';

  /* ---------------- CONFIG ---------------- */

  // index 0 = units (rightmost). Add/remove entries to change the number of columns;
  // colors come from --place-<index> in css/theme.css.
  const PLACES = [
    { short: 'U', title: 'Unități', singular: 'unitate', plural: 'unități' },
    { short: 'Z', title: 'Zeci', singular: 'zece', plural: 'zeci' },
    { short: 'S', title: 'Sute', singular: 'sută', plural: 'sute' },
    { short: 'M', title: 'Mii', singular: 'mie', plural: 'mii' },
    { short: 'ZM', title: 'Zeci de mii', singular: 'zece de mii', plural: 'zeci de mii' },
    { short: 'SM', title: 'Sute de mii', singular: 'sută de mii', plural: 'sute de mii' },
  ];
  const COLS = PLACES.length;
  const MAX_VALUE = 10 ** COLS - 1;
  const FLIGHT_MS = 700; // duration of the "+1" / "10" bubble between columns

  const INTRO =
    'Fiecare turn are cifrele de la <b>0</b> la <b>9</b>. Apasă <b>Start</b>, apoi săgeata <kbd>↑</kbd> ' +
    'ca să urce chenarul. Când turnul unităților se umple, <b>10 unități</b> se transformă în <b>1 zece</b> ' +
    'și începe să crească turnul din stânga!';

  /* ---------------- PURE HELPERS ---------------- */

  const digitsOf = (value) => PLACES.map((_, i) => Math.floor(value / 10 ** i) % 10);
  const usedColumns = (value) => String(value).length; // 0 -> 1: units are always in use
  const placeColor = (i) => `var(--place-${i})`;
  const unitName = (i, digit) => (digit === 1 ? PLACES[i].singular : PLACES[i].plural);
  const formatNumber = (value) => String(value).replace(/\B(?=(\d{3})+(?!\d))/g, '\u202F');
  const colored = (i, html) => `<b style="color:${placeColor(i)}">${html}</b>`;
  const joinRo = (parts) =>
    parts.length < 2 ? parts.join('') : `${parts.slice(0, -1).join(', ')} și ${parts[parts.length - 1]}`;

  function decomposition(value) {
    const digits = digitsOf(value);
    const parts = [];
    for (let i = usedColumns(value) - 1; i >= 0; i--) {
      parts.push(colored(i, `${digits[i]} ${unitName(i, digits[i])}`));
    }
    return joinRo(parts);
  }

  /* ---------------- TEMPLATE ---------------- */

  function columnHtml(i) {
    let cells = '';
    for (let d = 9; d >= 0; d--) cells += `<div class="cc-cell" data-digit="${d}" style="--i:${d}">${d}</div>`;
    return `
      <div class="cc-col is-empty" data-place="${i}" style="--pc:${placeColor(i)}">
        <div class="cc-col-head" title="${PLACES[i].title}">
          <span class="cc-col-short">${PLACES[i].short}</span>
          <span class="cc-col-name">${PLACES[i].title}</span>
        </div>
        <div class="cc-track">${cells}<div class="cc-frame" aria-hidden="true"></div></div>
      </div>`;
  }

  function digitHtml(i) {
    return `
      <div class="cc-digit is-hidden" data-place="${i}" style="--pc:${placeColor(i)}">
        <span class="cc-digit-box">0</span>
        <span class="cc-digit-label">${PLACES[i].short}</span>
      </div>`;
  }

  function template(ctx) {
    const highToLow = PLACES.map((_, i) => COLS - 1 - i); // leftmost column = highest place
    return `
      ${App.ui.lessonHeader(ctx, INTRO)}
      <div class="cc" data-started="false" style="--cols:${COLS}">
        <div class="cc-stage">
          <section class="card cc-board-card" aria-label="Turnurile cifrelor">
            <div class="cc-board">${highToLow.map(columnHtml).join('')}</div>
          </section>

          <aside class="cc-side">
            <section class="card cc-number-card">
              <h2 class="card-title">Numărul nostru</h2>
              <div class="cc-number">
                <div class="cc-number-placeholder" aria-hidden="true">?</div>
                ${highToLow.map(digitHtml).join('')}
              </div>
              <p class="cc-decomp" aria-live="polite"></p>
            </section>

            <section class="card cc-controls-card">
              <label class="cc-switch">
                <input type="checkbox" data-role="manual-toggle">
                <span class="cc-switch-track" aria-hidden="true"></span>
                <span>✍️ Scriu eu numărul</span>
              </label>
              <input type="text" class="cc-manual-input" inputmode="numeric" autocomplete="off" maxlength="${COLS}"
                     placeholder="ex. 305" aria-label="Scrie un număr" hidden>
              <button type="button" class="btn btn-accent btn-xl btn-block cc-start" data-action="start">▶ Start</button>
              <div class="cc-controls">
                <button type="button" class="btn btn-success btn-xl cc-up" data-action="up">▲ Încă unul</button>
                <button type="button" class="btn btn-warm" data-action="down">▼ Înapoi</button>
                <button type="button" class="btn btn-ghost" data-action="reset">↺ De la capăt</button>
              </div>
              <p class="cc-hint">Poți folosi și tastele <kbd>↑</kbd> și <kbd>↓</kbd></p>
            </section>

            <section class="cc-mascot">
              <div class="cc-mascot-face" aria-hidden="true">🦉</div>
              <div class="cc-mascot-bubble"><p class="cc-say" aria-live="polite"></p></div>
            </section>
          </aside>
        </div>
      </div>`;
  }

  /* ---------------- MOUNT ---------------- */

  function mount(root, ctx) {
    root.innerHTML = template(ctx);

    const container = root.querySelector('.cc');
    const boardCard = root.querySelector('.cc-board-card');
    const startBtn = root.querySelector('[data-action="start"]');
    const upBtn = root.querySelector('[data-action="up"]');
    const downBtn = root.querySelector('[data-action="down"]');
    const decompEl = root.querySelector('.cc-decomp');
    const sayEl = root.querySelector('.cc-say');
    const bubbleEl = root.querySelector('.cc-mascot-bubble');
    const manualToggle = root.querySelector('[data-role="manual-toggle"]');
    const manualInput = root.querySelector('.cc-manual-input');

    const columns = []; // columns[placeIndex] = { el, frame, cells[digit] }
    root.querySelectorAll('.cc-col').forEach((el) => {
      const col = { el, frame: el.querySelector('.cc-frame'), cells: [] };
      el.querySelectorAll('.cc-cell').forEach((c) => { col.cells[+c.dataset.digit] = c; });
      columns[+el.dataset.place] = col;
    });
    const boxes = []; // boxes[placeIndex] = { el, value }
    root.querySelectorAll('.cc-digit').forEach((el) => {
      boxes[+el.dataset.place] = { el, value: el.querySelector('.cc-digit-box') };
    });

    // `session` changes on reset/unmount so in-flight animations know to stop.
    const state = { started: false, value: 0, busy: false, session: 0 };

    /* ----- painting ----- */

    function paintColumn(i, digit, used, rolling = false) {
      const col = columns[i];
      const active = state.started && used;
      col.el.classList.toggle('is-active', active);
      col.el.classList.toggle('is-empty', i > 0 && !active);
      col.el.classList.toggle('is-rolling', rolling);
      col.el.style.setProperty('--digit', digit);
      col.cells.forEach((cell, d) => cell.classList.toggle('is-current', active && d === digit));
      if (active) App.effects.pop(col.frame, 'cc-wiggle');
    }

    function paintNumber() {
      const digits = digitsOf(state.value);
      const used = usedColumns(state.value);
      boxes.forEach((box, i) => {
        const visible = state.started && i < used;
        box.el.classList.toggle('is-hidden', !visible);
        const text = String(digits[i]);
        if (box.value.textContent !== text) {
          box.value.textContent = text;
          if (visible) App.effects.pop(box.value);
        }
      });
      decompEl.innerHTML = state.started ? `= ${decomposition(state.value)}` : 'Apasă <b>Start</b> și hai să numărăm!';
    }

    function paintAll() {
      container.dataset.started = String(state.started);
      const digits = digitsOf(state.value);
      const used = usedColumns(state.value);
      PLACES.forEach((_, i) => paintColumn(i, digits[i], i < used));
      paintNumber();
    }

    function say(html) {
      sayEl.innerHTML = html;
      App.effects.pop(bubbleEl);
    }

    /* ----- animated transitions between two values ----- */

    // +1: units upward. Every 9 rolls to 0 and sends "+1" to the next column.
    async function climb(before, after, usedAfter, session) {
      for (let i = 0; i < COLS && before[i] !== after[i]; i++) {
        const rolls = before[i] === 9;
        const flight = rolls
          ? App.effects.flyBubble(columns[i].frame, columns[i + 1].cells[after[i + 1]], {
              text: '+1', color: placeColor(i + 1), duration: FLIGHT_MS,
            })
          : null;
        paintColumn(i, after[i], i < usedAfter, rolls);
        if (!flight) {
          App.sound.play('step', after[i]);
          break;
        }
        App.sound.play('carry');
        await flight;
        if (session !== state.session) return false;
      }
      return true;
    }

    // -1: the first non-zero column goes down; each 0 below it "borrows" 10 and becomes 9.
    async function descend(before, after, usedAfter, session) {
      let k = 0;
      while (before[k] === 0) k++;
      paintColumn(k, after[k], k < usedAfter);
      if (k === 0) App.sound.play('step', after[0]);
      for (let i = k - 1; i >= 0; i--) {
        App.sound.play('borrow');
        await App.effects.flyBubble(columns[i + 1].frame, columns[i].cells[9], {
          text: '10', color: placeColor(i), duration: FLIGHT_MS,
        });
        if (session !== state.session) return false;
        paintColumn(i, 9, true, true);
      }
      return true;
    }

    /* ----- mascot feedback ----- */

    function react(before, after, usedBefore, usedAfter, delta) {
      if (delta > 0 && usedAfter > usedBefore) {
        const i = usedAfter - 1;
        App.sound.play('celebrate');
        App.effects.confetti(columns[i].el, { count: 56 });
        say(`<b>Bravo!</b> 10 ${PLACES[i - 1].plural} fac ${colored(i, `1 ${PLACES[i].singular}`)}. ` +
            `A apărut turnul ${colored(i, PLACES[i].title)} – am ajuns la <b>${formatNumber(state.value)}</b>!`);
      } else if (delta > 0 && after[0] === 0) {
        let r = 0;
        while (before[r + 1] === 9) r++;
        App.effects.confetti(columns[r + 1].el, { count: 18, spread: 0.6 });
        say(`10 ${PLACES[r].plural} = ${colored(r + 1, `1 ${PLACES[r + 1].singular}`)}. Acum avem ${decomposition(state.value)}.`);
      } else if (delta < 0 && after[0] === 9) {
        let k = 0;
        while (before[k] === 0) k++;
        say(`Am desfăcut ${colored(k, `1 ${PLACES[k].singular}`)} în ${colored(k - 1, `10 ${PLACES[k - 1].plural}`)}.`);
      } else if (delta > 0 && after[0] === 9) {
        say(`Turnul ${colored(0, 'unităților')} e plin! Ce crezi că se întâmplă dacă mai urcăm o dată?`);
      } else if (delta > 0 && state.value === 1) {
        say('Super! Continuă să urci cu săgeata <kbd>↑</kbd>.');
      }
    }

    function hitLimit(atBottom) {
      App.sound.play('bump');
      App.effects.shake(boardCard);
      say(atBottom
        ? 'Suntem la <b>0</b>. Mai jos de atât nu putem coborî!'
        : `Uau! <b>${formatNumber(MAX_VALUE)}</b> e cel mai mare număr care încape în turnurile noastre!`);
    }

    /* ----- actions ----- */

    async function step(delta) {
      if (!state.started || state.busy) return;
      const next = state.value + delta;
      if (next < 0 || next > MAX_VALUE) {
        hitLimit(next < 0);
        return;
      }
      const session = state.session;
      const before = digitsOf(state.value);
      const after = digitsOf(next);
      const usedBefore = usedColumns(state.value);
      const usedAfter = usedColumns(next);
      state.value = next;
      state.busy = true;

      const finished = delta > 0
        ? await climb(before, after, usedAfter, session)
        : await descend(before, after, usedAfter, session);
      if (!finished) return;

      state.busy = false;
      paintNumber();
      syncInput();
      react(before, after, usedBefore, usedAfter, delta);
    }

    /* ----- manual entry ----- */

    function syncInput() {
      if (!manualInput.hidden) manualInput.value = state.started ? String(state.value) : '';
    }

    function setManual(on) {
      manualInput.hidden = !on;
      if (!on) return;
      syncInput();
      manualInput.focus();
      say(`Scrie un număr de cel mult <b>${COLS} cifre</b> și îl vezi imediat în turnuri!`);
    }

    function showTyped() {
      const digits = manualInput.value.replace(/\D/g, '').slice(0, COLS);
      if (digits !== manualInput.value) manualInput.value = digits;
      if (!digits) return;
      const value = Number(digits);
      state.session++; // cancel any running animation
      state.busy = false;
      state.started = true;
      state.value = value;
      paintAll();
      App.sound.play('step', value % 10);
      say(`<b>${formatNumber(value)}</b> = ${decomposition(value)}.`);
    }

    function start() {
      state.started = true;
      state.value = 0;
      paintAll();
      syncInput();
      App.sound.play('start');
      say('Hai să numărăm! Apasă săgeata <kbd>↑</kbd> sau butonul <b>Încă unul</b>.');
      upBtn.focus();
    }

    function reset() {
      state.session++;
      state.started = false;
      state.value = 0;
      state.busy = false;
      paintAll();
      syncInput();
      say('Apasă <b>Start</b> ca să începem din nou!');
      startBtn.focus();
    }

    function press(btn) {
      btn.classList.add('is-pressed');
      setTimeout(() => btn.classList.remove('is-pressed'), 120);
    }

    /* ----- listeners ----- */

    function onClick(e) {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const action = btn.dataset.action;
      if (action === 'start') start();
      else if (action === 'up') step(1);
      else if (action === 'down') step(-1);
      else if (action === 'reset') reset();
    }

    function onKey(e) {
      if (e.altKey || e.ctrlKey || e.metaKey || e.target === manualInput) return;
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (!state.started) {
          App.effects.pop(startBtn);
          say('Mai întâi apasă <b>Start</b>!');
          return;
        }
        press(upBtn);
        step(1);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (!state.started) return;
        press(downBtn);
        step(-1);
      }
    }

    root.addEventListener('click', onClick);
    manualToggle.addEventListener('change', () => setManual(manualToggle.checked));
    manualInput.addEventListener('input', showTyped);
    document.addEventListener('keydown', onKey);

    void container.offsetWidth; // commit the initial "empty" styles so the units column animates in
    paintAll();
    say('Salut! Eu sunt <b>Bufnița Cifrica</b>. Apasă <b>Start</b> și numărăm împreună!');

    // Cleanup: called by the router when leaving the lesson.
    return () => {
      state.session++;
      document.removeEventListener('keydown', onKey);
    };
  }

  App.registerLesson({ id: 'counting-columns', mount });
})(window.MathApp);
