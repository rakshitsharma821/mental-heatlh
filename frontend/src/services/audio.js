// ============================================
// MindCare — Harmonic Web Audio Synthesizer
// Zero external MP3 dependency, 100% offline
// ============================================

class SoundEngine {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Soft singing-bowl harmonic chime
  playChime(type = 'inhale') {
    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // Frequencies for soothing chords
      let freq = 432; // Calming frequency
      if (type === 'inhale') freq = 528; // Solfeggio frequency (transformation/calm)
      else if (type === 'hold') freq = 639; // Heart connection
      else if (type === 'exhale') freq = 396; // Release fear & tension
      else if (type === 'complete') freq = 741; // Awakening intuition

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      // Smooth organic volume envelope
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.12, now + 0.35);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 2.3);
    } catch (e) {
      console.warn('Audio playback error:', e);
    }
  }

  playPop() {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320 + Math.random() * 200, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.08);

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.1);
    } catch (e) {
      console.warn('Pop sound error:', e);
    }
  }
}

export const soundEngine = new SoundEngine();
