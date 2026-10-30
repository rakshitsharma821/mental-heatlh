import { useRef } from 'react';
import { prefersReduced } from '../../lib/env.js';
/** Pointer-driven 3D tilt with a soft light sheen. Pattern after the Tilt / Motion-Primitives idea, written from scratch (no copied code). */
export default function Tilt({ max = 8, as: Tag = 'div', className = '', children, ...rest }) {
  const ref = useRef(null);
  const move = (e) => {
    if (prefersReduced()) return;
    const el = ref.current, r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
    el.style.setProperty('--rx', `${((.5 - py) * max).toFixed(2)}deg`);
    el.style.setProperty('--ry', `${((px - .5) * max).toFixed(2)}deg`);
    el.style.setProperty('--gx', `${(px * 100).toFixed(1)}%`); el.style.setProperty('--gy', `${(py * 100).toFixed(1)}%`);
  };
  const leave = () => { const el = ref.current; el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); };
  return <Tag ref={ref} className={`tilt ${className}`} onPointerMove={move} onPointerLeave={leave} {...rest}>{children}</Tag>;
}
