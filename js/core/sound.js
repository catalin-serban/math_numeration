/**
 * SOUND – tiny Web Audio synth (no audio files needed).
 *   MathApp.sound.play('step', digit)  – note that rises with the digit (0..9)
 *   MathApp.sound.play('carry' | 'borrow' | 'start' | 'celebrate' | 'bump')
 *   MathApp.sound.tone(freq, delay, duration, type, volume) – for custom sounds
 * Add new presets to PRESETS when a lesson needs them.
 */
(function (App) {
  'use strict';

  // C-major scale starting at C5; digit n -> SCALE[n]
  const SCALE = [523.25, 587.33, 659.25, 698.46, 783.99, 880.0, 987.77, 1046.5, 1174.66, 1318.51];

  let ctx = null;
  let enabled = App.storage.get('sound', true);

  function audio() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, delay = 0, duration = 0.2, type = 'triangle', volume = 0.15) {
    const ac = audio();
    if (!ac) return;
    const t = ac.currentTime + delay;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(volume, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(gain).connect(ac.destination);
    osc.start(t);
    osc.stop(t + duration + 0.05);
  }

  const arpeggio = (notes, gap, duration, type, volume) =>
    notes.forEach((f, i) => tone(f, i * gap, duration, type, volume));

  const PRESETS = {
    step: (digit = 0) => tone(SCALE[digit] ?? SCALE[0], 0, 0.22),
    carry: () => arpeggio([523.25, 659.25, 783.99, 1046.5], 0.07, 0.2),
    borrow: () => arpeggio([1046.5, 783.99, 659.25, 523.25], 0.07, 0.2),
    start: () => arpeggio([392.0, 523.25, 659.25], 0.09, 0.22),
    celebrate: () => arpeggio([523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5], 0.1, 0.3, 'square', 0.05),
    bump: () => tone(165, 0, 0.25, 'sawtooth', 0.06),
  };

  App.sound = {
    play(name, arg) {
      if (enabled && PRESETS[name]) PRESETS[name](arg);
    },
    tone,
    isEnabled: () => enabled,
    setEnabled(value) {
      enabled = !!value;
      App.storage.set('sound', enabled);
    },
  };
})(window.MathApp);
