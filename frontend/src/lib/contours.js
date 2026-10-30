// Soft topographic lines on a 2D canvas. amplitude falls as `calm01` rises — tangled -> flowing.
import { noise, lerp, ease } from './noise.js';
export function createContours(canvas, { lines = 26, rgb = '47,93,80' } = {}) {
  const ctx = canvas.getContext('2d');
  function resize() { const d = Math.min(devicePixelRatio, 1.25); canvas.width = canvas.clientWidth * d; canvas.height = canvas.clientHeight * d; ctx.setTransform(d, 0, 0, d, 0, 0); }
  function draw(t, p) {
    const W = canvas.clientWidth, H = canvas.clientHeight; ctx.clearRect(0, 0, W, H);
    const amp = lerp(150, 14, ease(p)), freq = lerp(2.6, .7, ease(p)), spd = lerp(.22, .05, p);
    for (let i = 0; i < lines; i++) {
      const y0 = H * (.1 + .8 * i / (lines - 1)); ctx.beginPath();
      for (let x = 0; x <= W; x += 14) {
        const nx = x / W * freq, off = (noise(nx * 2.2 + t * spd, i * .35, t * spd * .7) - .5) * 2 * amp + Math.sin(x / W * Math.PI * 2 + i * .4 + t * .12) * lerp(6, 26, p);
        const y = y0 + off; x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.strokeStyle = `rgba(${rgb},${lerp(.16, .11, p).toFixed(3)})`; ctx.lineWidth = 1; ctx.stroke();
    }
  }
  resize(); return { resize, draw };
}
