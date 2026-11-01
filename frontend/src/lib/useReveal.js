import { useEffect, useRef } from 'react';
/** adds .in when the element scrolls into view (CSS handles the animation, reduced-motion safe) */
export function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    if (!('IntersectionObserver' in window)) { el.classList.add('in'); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { el.classList.add('in'); io.disconnect(); } }, { rootMargin: '0px 0px -10% 0px' });
    io.observe(el); return () => io.disconnect();
  }, []);
  return ref;
}
