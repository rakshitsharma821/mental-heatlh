export const prefersReduced = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
export function webglOK() {
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    if (!gl) return false;
    const v = gl.getParameter && gl.getParameter(gl.VERSION);
    return typeof v === 'string' && v.length > 0;
  } catch {
    return false;
  }
}
export const finePointer = () => typeof matchMedia !== 'undefined' && matchMedia('(pointer:fine)').matches;
