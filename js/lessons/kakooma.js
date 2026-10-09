/**
 * LESSON "kakooma" – Capitolul 1 · 1.2 "Kakooma"
 *
 * Goal: a number-detective puzzle (inspired by Greg Tang's KAKOOMA).
 *  - N shapes (4 = square, 5 = pentagon, 6 = hexagon) sit in a ring; each shape holds
 *    N numbers, one per triangular sector.
 *  - In every shape exactly ONE triple is linked by the chosen operation (y ⊕ z = w).
 *    The child taps the result: the sum / product, or for − and ÷ the "big − small" /
 *    "big ÷ small" result (the other true fact gets a gentle "almost" hint).
 *  - A solved shape is filled with its answer in big digits; the answer flies into the
 *    big shape in the middle.
 *  - When all small shapes are solved, the big shape (made of the N answers, same rule)
 *    becomes the final puzzle. Solving it ends the round; "Joc nou" deals a new one.
 *  - Settings (persisted): operation, numbers per shape and ONE limit – either the numbers
 *    used in the calculation or the result must be ≤ X. If X is too small to build a
 *    puzzle, it is raised automatically.
 *
 * Structure: CONFIG -> puzzle generator (pure) -> SVG geometry -> template() -> mount()
 * Styles: css/lessons/kakooma.css (all classes prefixed with "kk-").
 */
(function (App) {
  'use strict';

  /* ---------------- CONFIG ---------------- */

  // base: the underlying relation of a triple (y + z = w or y × z = w); minPart: smallest operand.
  const OPS = {
    add: { label: 'Adunare', icon: '➕', sign: '+', base: 'add', minPart: 1, result: 'suma' },
    sub: { label: 'Scădere', icon: '➖', sign: '−', base: 'add', minPart: 1, result: 'diferența' },
    mul: { label: 'Înmulțire', icon: '✖️', sign: '×', base: 'mul', minPart: 2, result: 'produsul' },
    div: { label: 'Împărțire', icon: '➗', sign: '÷', base: 'mul', minPart: 2, result: 'câtul' },
  };
  const SHAPES = { 4: { name: 'Pătrat', icon: '◼' }, 5: { name: 'Pentagon', icon: '⬟' }, 6: { name: 'Hexagon', icon: '⬢' } };
  const LIMITS = { operand: 'Numerele din calcul', result: 'Rezultatul' };
  const DEFAULTS = { op: 'add', n: 6, limit: 'result', max: 20 };
  const LIMIT_MIN = 3;
  const LIMIT_MAX = 400;
  const STORAGE_KEY = 'kakooma';
  const RING_RADIUS = 36; // % of the board: distance from the center to each small shape
  const FLIGHT_MS = 650;

  const INTRO =
    'Un joc de detectiv cu numere! În fiecare formă, <b>trei numere</b> sunt prietene printr-o operație. ' +
    'Găsește <b>rezultatul</b>, iar la final rezolvă <b>forma cea mare</b> din mijloc, după aceeași regulă.';

  const RULES = {
    add: 'Două numere <b>adunate</b> dau un alt număr din aceeași formă. Atinge <b>suma</b>!',
    sub: 'Trei numere sunt legate prin <b>scădere</b>: <b>mare − mic = diferența</b>. Atinge <b>diferența</b>!',
    mul: 'Două numere <b>înmulțite</b> dau un alt număr din aceeași formă. Atinge <b>produsul</b>!',
    div: 'Trei numere sunt legate prin <b>împărțire</b>: <b>mare ÷ mic = câtul</b>. Atinge <b>câtul</b>!',
  };
  const HINTS = {
    add: 'Caută două numere care, <b>adunate</b>, dau alt număr din formă.',
    sub: 'Caută un număr mare din care, <b>scăzând</b> un număr mic, obții alt număr din formă.',
    mul: 'Caută două numere care, <b>înmulțite</b>, dau alt număr din formă.',
    div: 'Caută un număr mare care, <b>împărțit</b> la un număr mic, dă alt număr din formă.',
  };

  /* ---------------- PURE HELPERS: puzzle generator ---------------- */

  const randInt = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const isInverse = (op) => op === 'sub' || op === 'div';
  const combine = (base, y, z) => (base === 'add' ? y + z : y * z);

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // A triple is { y < z, w = y ⊕ z }. For + and × the limit "operand" bounds y, z and "result"
  // bounds w; for − and ÷ (w − y = z) it is the other way round.
  function limits({ op, limit, max }) {
    const { base, minPart } = OPS[op];
    const onParts = (limit === 'operand') !== isInverse(op);
    return onParts
      ? { maxPart: max, maxWhole: combine(base, max - 1, max) }
      : { maxPart: base === 'add' ? max - minPart : Math.floor(max / minPart), maxWhole: max };
  }

  function tripleList(cfg, lim) {
    const { base, minPart } = OPS[cfg.op];
    const list = [];
    for (let y = minPart; y <= lim.maxPart; y++) {
      for (let z = y + 1; z <= lim.maxPart; z++) {
        const w = combine(base, y, z);
        if (w > lim.maxWhole) break;
        list.push({ y, z, w, answer: isInverse(cfg.op) ? z : w });
      }
    }
    return list;
  }

  // Number of distinct pairs whose sum/product is another number of the set.
  function countTriples(values, base) {
    const set = new Set(values);
    let count = 0;
    for (let i = 0; i < values.length; i++) {
      for (let j = i + 1; j < values.length; j++) {
        const w = combine(base, values[i], values[j]);
        if (set.has(w) && w !== values[i] && w !== values[j]) count++;
      }
    }
    return count;
  }

  function distractor(base, lim) {
    if (base === 'add') return randInt(1, lim.maxWhole);
    const part = () => randInt(2, Math.max(2, lim.maxPart));
    if (Math.random() < 0.5) return part();
    const product = part() * part();
    return product <= lim.maxWhole ? product : part();
  }

  function fillSet(seed, n, next) {
    const set = new Set(seed);
    for (let guard = 0; set.size < n && guard < 200; guard++) set.add(next());
    return set.size === n ? [...set] : null;
  }

  function makeShape(triples, n, base, next) {
    for (let tries = 0; tries < 200; tries++) {
      const triple = pick(triples);
      const values = fillSet([triple.y, triple.z, triple.w], n, next);
      if (values && countTriples(values, base) === 1) return { values: shuffle(values), triple };
    }
    return null;
  }

  // The final (center) shape is generated first; each of its numbers becomes the answer of one small shape.
  function generatePuzzle(cfg) {
    const { base } = OPS[cfg.op];
    const lim = limits(cfg);
    const triples = tripleList(cfg, lim);
    const byAnswer = new Map();
    triples.forEach((t) => {
      if (!byAnswer.has(t.answer)) byAnswer.set(t.answer, []);
      byAnswer.get(t.answer).push(t);
    });
    const finalTriples = triples.filter((t) => byAnswer.has(t.y) && byAnswer.has(t.z) && byAnswer.has(t.w));
    if (byAnswer.size < cfg.n || !finalTriples.length) return null;

    const answers = [...byAnswer.keys()];
    for (let attempt = 0; attempt < 30; attempt++) {
      const final = makeShape(finalTriples, cfg.n, base, () => pick(answers));
      if (!final) continue;
      const shapes = final.values.map((a) => makeShape(byAnswer.get(a), cfg.n, base, () => distractor(base, lim)));
      if (shapes.every(Boolean)) return { final, shapes };
    }
    return null;
  }

  function buildGame(cfg) {
    for (let max = cfg.max; max <= LIMIT_MAX; max += Math.max(1, Math.round(max * 0.1))) {
      const puzzle = generatePuzzle({ ...cfg, max });
      if (puzzle) return { puzzle, max };
    }
    return null;
  }

  function biggestTriple(cfg) {
    return tripleList(cfg, limits(cfg)).reduce(
      (best, t) => (!best || t.w > best.w || (t.w === best.w && t.y > best.y) ? t : best), null);
  }

  function equation(op, t) {
    const s = OPS[op].sign;
    return isInverse(op) ? `${t.w} ${s} ${t.y} = ${t.z}` : `${t.y} ${s} ${t.z} = ${t.w}`;
  }

  function sanitize(c) {
    const max = Math.round(Number(c.max));
    return {
      op: OPS[c.op] ? c.op : DEFAULTS.op,
      n: SHAPES[c.n] ? Number(c.n) : DEFAULTS.n,
      limit: LIMITS[c.limit] ? c.limit : DEFAULTS.limit,
      max: Number.isFinite(max) && max > 0 ? Math.min(LIMIT_MAX, Math.max(LIMIT_MIN, max)) : DEFAULTS.max,
    };
  }

  /* ---------------- SVG GEOMETRY (viewBox -100..100, shape centered at 0,0) ---------------- */

  const R = 96;
  const startAngle = (n) => (n === 4 ? -135 : -90); // square: flat sides; pentagon/hexagon: point up
  const rad = (deg) => (deg * Math.PI) / 180;
  const midAngle = (n, k) => startAngle(n) + (360 * (k + 0.5)) / n;
  const apothem = (n) => R * Math.cos(Math.PI / n);
  const digitScale = (len) => (len <= 2 ? 1 : len === 3 ? 0.8 : 0.62);
  const sectorFont = (n, text) => ({ 4: 38, 5: 32, 6: 28 }[n] * digitScale(text.length)).toFixed(1);
  const bigFont = (n, text) => (apothem(n) * 1.1 * digitScale(text.length)).toFixed(1);

  function vertex(n, k, r) {
    const a = rad(startAngle(n) + (360 * k) / n);
    return [r * Math.cos(a), r * Math.sin(a)];
  }
  const pts = (list) => list.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const polygon = (n, r) => pts(Array.from({ length: n }, (_, k) => vertex(n, k, r)));

  function shapeSvg(n, labels, ariaLabel, tabindex) {
    const d = apothem(n) * 0.62;
    const sectors = labels.map((value, k) => {
      const text = value === null ? '' : String(value);
      const a = rad(midAngle(n, k));
      return `
        <g class="kk-sector" data-idx="${k}" role="button" tabindex="${tabindex}" aria-label="${text || '?'}">
          <polygon points="${pts([[0, 0], vertex(n, k, R), vertex(n, k + 1, R)])}"/>
          <text x="${(d * Math.cos(a)).toFixed(1)}" y="${(d * Math.sin(a)).toFixed(1)}" font-size="${sectorFont(n, text)}">${text}</text>
        </g>`;
    }).join('');
    return `
      <svg viewBox="-100 -100 200 200" role="group" aria-label="${ariaLabel}">
        <polygon class="kk-outline" points="${polygon(n, R)}"/>
        <g class="kk-sectors">${sectors}</g>
        <polygon class="kk-hole" points="${polygon(n, 14)}"/>
        <text class="kk-big" x="0" y="0"></text>
      </svg>`;
  }

  /* ---------------- TEMPLATE ---------------- */

  function boardHtml(puzzle, n) {
    const ring = puzzle.shapes.map((shape, i) => {
      const a = rad(midAngle(n, i));
      const x = 50 + RING_RADIUS * Math.cos(a);
      const y = 50 + RING_RADIUS * Math.sin(a);
      return `
        <div class="kk-shape" data-shape="${i}" style="--x:${x.toFixed(2)}%;--y:${y.toFixed(2)}%;--kk-c:var(--place-${i})">
          ${shapeSvg(n, shape.values, `Forma ${i + 1}`, 0)}
        </div>`;
    }).join('');
    const final = `
      <div class="kk-shape kk-final" data-shape="final" style="--x:50%;--y:50%;--kk-c:var(--primary)">
        ${shapeSvg(n, puzzle.final.values.map(() => null), 'Forma cea mare', -1)}
      </div>`;
    return ring + final;
  }

  const radios = (name, items) => `
    <div class="kk-seg">
      ${items.map(([value, html]) => `<label><input type="radio" name="${name}" value="${value}"><span>${html}</span></label>`).join('')}
    </div>`;

  function template(ctx) {
    return `
      ${App.ui.lessonHeader(ctx, INTRO)}
      <div class="kk" data-phase="play">
        <div class="kk-stage">
          <section class="card kk-board-card" aria-label="Tabla de joc">
            <div class="kk-board"></div>
            <p class="kk-progress" aria-live="polite"></p>
            <div class="kk-mascot">
              <div class="kk-mascot-face" aria-hidden="true">🐝</div>
              <div class="kk-mascot-bubble"><p class="kk-say" aria-live="polite"></p></div>
            </div>
            <button type="button" class="btn btn-success btn-xl btn-block kk-again" data-action="new">🎲 Joc nou</button>
          </section>

          <aside class="kk-side">
            <section class="card">
              <h2 class="card-title">Cum se joacă</h2>
              <p class="kk-rule"></p>
            </section>

            <section class="card">
              <h2 class="card-title">⚙️ Setări</h2>
              <form class="kk-settings">
                <fieldset class="kk-field">
                  <legend>Operația</legend>
                  ${radios('kk-op', Object.entries(OPS).map(([k, o]) => [k, `${o.icon} ${o.label}`]))}
                </fieldset>
                <fieldset class="kk-field">
                  <legend>Câte numere are o formă</legend>
                  ${radios('kk-n', Object.entries(SHAPES).map(([k, s]) => [k, `${s.icon} ${k} · ${s.name}`]))}
                </fieldset>
                <fieldset class="kk-field">
                  <legend>Limita (alege una)</legend>
                  ${radios('kk-limit', Object.entries(LIMITS))}
                  <label class="kk-max">mai mic sau egal cu
                    <input type="number" name="kk-max" min="${LIMIT_MIN}" max="${LIMIT_MAX}" step="1" inputmode="numeric">
                  </label>
                  <p class="kk-limit-hint"></p>
                </fieldset>
                <button type="button" class="btn btn-accent btn-block" data-action="new">🎲 Joc nou</button>
              </form>
            </section>
          </aside>
        </div>
      </div>`;
  }

  /* ---------------- MOUNT ---------------- */

  function mount(root, ctx) {
    root.innerHTML = template(ctx);

    const container = root.querySelector('.kk');
    const boardEl = root.querySelector('.kk-board');
    const progressEl = root.querySelector('.kk-progress');
    const ruleEl = root.querySelector('.kk-rule');
    const sayEl = root.querySelector('.kk-say');
    const bubbleEl = root.querySelector('.kk-mascot-bubble');
    const form = root.querySelector('.kk-settings');
    const hintEl = root.querySelector('.kk-limit-hint');

    // `session` changes on every new game / unmount so in-flight animations know to stop.
    const state = {
      cfg: sanitize(App.storage.get(STORAGE_KEY, DEFAULTS) || {}),
      puzzle: null,
      solved: [],
      filled: 0,
      phase: 'play',
      session: 0,
    };

    const finalEl = () => boardEl.querySelector('.kk-final');
    const shapeOf = (key) => (key === 'final' ? state.puzzle.final : state.puzzle.shapes[+key]);

    /* ----- painting ----- */

    function say(html) {
      sayEl.innerHTML = html;
      App.effects.pop(bubbleEl);
    }

    function setPhase(phase) {
      state.phase = phase;
      container.dataset.phase = phase;
    }

    function paintProgress() {
      const n = state.cfg.n;
      const done = state.solved.filter(Boolean).length;
      if (state.phase === 'done') progressEl.textContent = '🏆 Ai terminat runda!';
      else if (state.phase === 'final') progressEl.textContent = '⭐ Acum forma cea mare din mijloc!';
      else progressEl.textContent = `${'⭐'.repeat(done)}${'☆'.repeat(n - done)}  Forme rezolvate: ${done} / ${n}`;
    }

    function paintSettings() {
      const { op, n, limit, max } = state.cfg;
      form.elements['kk-op'].value = op;
      form.elements['kk-n'].value = String(n);
      form.elements['kk-limit'].value = limit;
      form.elements['kk-max'].value = String(max);
      const t = biggestTriple(state.cfg);
      hintEl.innerHTML = t ? `Cel mai mare calcul posibil: <b>${equation(op, t)}</b>` : '';
    }

    function showBig(shapeEl, value) {
      const big = shapeEl.querySelector('.kk-big');
      big.textContent = String(value);
      big.setAttribute('font-size', bigFont(state.cfg.n, String(value)));
      shapeEl.classList.add('is-solved');
      shapeEl.querySelector('.kk-sectors').setAttribute('aria-hidden', 'true');
      shapeEl.querySelectorAll('.kk-sector').forEach((s) => s.setAttribute('tabindex', '-1'));
      App.effects.pop(shapeEl.querySelector('svg'));
    }

    function flash(sector, className) {
      sector.classList.add(className);
      setTimeout(() => sector.classList.remove(className), 700);
    }

    /* ----- game flow ----- */

    function newGame() {
      state.session++;
      const built = buildGame(state.cfg);
      if (!built) {
        boardEl.innerHTML = '';
        say('Ups! Cu aceste setări nu pot construi jocul. Încearcă altă limită.');
        return;
      }
      const bumped = built.max !== state.cfg.max;
      state.cfg.max = built.max;
      App.storage.set(STORAGE_KEY, state.cfg);

      state.puzzle = built.puzzle;
      state.solved = built.puzzle.shapes.map(() => false);
      state.filled = 0;
      setPhase('play');
      container.style.setProperty('--n', state.cfg.n);
      boardEl.innerHTML = boardHtml(state.puzzle, state.cfg.n);
      ruleEl.innerHTML = RULES[state.cfg.op];
      paintSettings();
      paintProgress();

      App.sound.play('start');
      const intro = `Găsește <b>${OPS[state.cfg.op].result}</b> în fiecare formă și atinge-o!`;
      say(bumped ? `Am mărit limita la <b>${built.max}</b> ca să încapă toate numerele. ${intro}` : intro);
    }

    async function sendToFinal(i, value, shapeEl) {
      const session = state.session;
      const target = finalEl().querySelector(`.kk-sector[data-idx="${i}"]`);
      await App.effects.flyBubble(shapeEl, target, { text: String(value), color: `var(--place-${i})`, duration: FLIGHT_MS });
      if (session !== state.session) return;

      const text = target.querySelector('text');
      text.textContent = String(value);
      text.setAttribute('font-size', sectorFont(state.cfg.n, String(value)));
      text.classList.add('is-new');
      target.setAttribute('aria-label', String(value));
      state.filled++;
      if (state.filled === state.cfg.n) enterFinal();
    }

    function enterFinal() {
      setPhase('final');
      finalEl().querySelectorAll('.kk-sector').forEach((s) => s.setAttribute('tabindex', '0'));
      paintProgress();
      App.sound.play('carry');
      say('Super! Toate formele mici sunt rezolvate. Acum rezolvă <b>forma cea mare</b>, după aceeași regulă!');
    }

    function solveSmall(i, shapeEl, triple) {
      state.solved[i] = true;
      showBig(shapeEl, triple.answer);
      App.sound.play('carry');
      App.effects.confetti(shapeEl, { count: 22, spread: 0.6 });
      say(`<b>Bravo!</b> ${equation(state.cfg.op, triple)}`);
      paintProgress();
      sendToFinal(i, triple.answer, shapeEl);
    }

    function solveFinal(shapeEl, triple) {
      setPhase('done');
      showBig(shapeEl, triple.answer);
      paintProgress();
      App.sound.play('celebrate');
      App.effects.confetti(shapeEl, { count: 90 });
      say(`<b>Felicitări!</b> ${equation(state.cfg.op, triple)}. Ai rezolvat tot Kakooma-ul! ` +
          'Apasă <b>Joc nou</b> pentru o rundă nouă.');
    }

    function choose(sector) {
      const shapeEl = sector.closest('.kk-shape');
      const key = shapeEl.dataset.shape;
      const isFinal = key === 'final';
      if (state.phase === 'done' || shapeEl.classList.contains('is-solved')) return;
      if (isFinal && state.phase !== 'final') {
        say('Mai întâi rezolvă <b>formele mici</b>!');
        return;
      }

      const { values, triple } = shapeOf(key);
      const value = values[+sector.dataset.idx];
      const { op } = state.cfg;

      if (value === triple.answer) {
        if (isFinal) solveFinal(shapeEl, triple);
        else solveSmall(+key, shapeEl, triple);
      } else if (isInverse(op) && value === triple.y) {
        const s = OPS[op].sign;
        flash(sector, 'is-almost');
        App.sound.play('step', 4);
        say(`Aproape! ${triple.w} ${s} ${triple.z} = ${triple.y} e adevărat, dar acum ` +
            `${op === 'sub' ? 'scade' : 'împarte la'} numărul <b>mai mic</b>: ${triple.w} ${s} ${triple.y} = ?`);
      } else {
        flash(sector, 'is-wrong');
        App.sound.play('bump');
        App.effects.shake(shapeEl.querySelector('svg'));
        say(`Hmm, <b>${value}</b> nu este ${OPS[op].result}. ${HINTS[op]}`);
      }
    }

    function applySettings() {
      const cfg = sanitize({
        op: form.elements['kk-op'].value,
        n: form.elements['kk-n'].value,
        limit: form.elements['kk-limit'].value,
        max: form.elements['kk-max'].value,
      });
      if (JSON.stringify(cfg) === JSON.stringify(state.cfg)) return paintSettings();
      state.cfg = cfg;
      newGame();
    }

    /* ----- listeners (all on root, removed together with it) ----- */

    root.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action="new"]');
      if (btn) return newGame();
      const sector = e.target.closest('.kk-sector');
      if (sector) choose(sector);
    });
    root.addEventListener('keydown', (e) => {
      const sector = e.target.closest && e.target.closest('.kk-sector');
      if (sector && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        choose(sector);
      }
    });
    form.addEventListener('change', applySettings);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      applySettings();
    });

    newGame();

    return () => { state.session++; };
  }

  App.registerLesson({ id: 'kakooma', mount });
})(window.MathApp);
