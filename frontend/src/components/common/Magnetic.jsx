import { useRef } from 'react';
import { prefersReduced, finePointer } from '../../lib/env.js';
/** Button that leans a few px toward the cursor. Desktop pointer only. */
export default function Magnetic({ as: Tag = 'a', strength = 10, className = '', children, ...rest }) {
  const ref = useRef(null);
  const on = (e) => { if (prefersReduced() || !finePointer()) return; const el = ref.current, r = el.getBoundingClientRect(); el.style.transform = `translate(${((e.clientX - r.left) / r.width - .5) * strength}px,${((e.clientY - r.top) / r.height - .5) * strength}px)`; };
  const off = () => { ref.current.style.transform = ''; };
  return <Tag ref={ref} className={className} onPointerMove={on} onPointerLeave={off} style={{ transition: 'transform .25s var(--ease)' }} {...rest}>{children}</Tag>;
}
