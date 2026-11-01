// Procedural pastel brain (three.js). No model files, no textures — ~0 KB of assets.
import * as THREE from 'three';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { noise, lerp, ease } from './noise.js';

export const BRAIN_CFG = {
  breath: { inhale: 4, exhale: 5 }, dprCap: 1.5,
  busy: { lav: '#eccbd8', sage: '#f3dcb8', peach: '#ffc4a0', sky: '#f4cbc3', pulse: '#ff8a6b' },
  calm: { lav: '#d9ccf5', sage: '#bfe6d1', peach: '#ffdcc2', sky: '#cbe6fa', pulse: '#ff9d76' },
};
const ridged = (x, y, z) => { let a = 0, f = 1, amp = .62, n = 0; for (let i = 0; i < 2; i++) { a += amp * noise(x * f, y * f, z * f); n += amp; f *= 2.2; amp *= .5; } return a / n; };

function hemisphere(side) {
  let g = new THREE.IcosahedronGeometry(1, 44); g.deleteAttribute('uv'); g.deleteAttribute('normal'); g = mergeVertices(g, 1e-4);
  const p = g.attributes.position, fold = new Float32Array(p.count), v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i); const n = v.clone(); let x = n.x * .5, y = n.y * .7, z = n.z;
    const medial = side > 0 ? -x : x; if (medial > .28) x = side * (.22 - (medial - .28) * .15);
    if (y < 0) { y *= .62; y -= .10 * Math.exp(-Math.pow((z - .05) / .45, 2)) * (-n.y); }
    const taper = 1 - .16 * Math.pow(Math.abs(z), 3); x *= taper; y *= taper;
    const wx = noise(n.x * 2.1 + 7, n.y * 2.1, n.z * 2.1) - .5, wy = noise(n.x * 2.1, n.y * 2.1 + 9, n.z * 2.1) - .5, wz = noise(n.x * 2.1, n.y * 2.1, n.z * 2.1 + 13) - .5;
    const q = ridged(n.x * 3.1 + side * 5 + wx * 1.7, n.y * 3.1 + wy * 1.7, n.z * 3.1 + wz * 1.7);
    const d = .05 * (q - .5); const nn = new THREE.Vector3(x, y, z).normalize();
    p.setXYZ(i, x + nn.x * d + side * .255, y + nn.y * d + .05, z + nn.z * d);
  }
  g.setAttribute('fold', new THREE.BufferAttribute(fold, 1));
  g.setAttribute('cortex', new THREE.BufferAttribute(new Float32Array(p.count).fill(1), 1));
  g.computeVertexNormals(); return g;
}
function cerebellum() {
  let g = new THREE.IcosahedronGeometry(1, 26); g.deleteAttribute('uv'); g.deleteAttribute('normal'); g = mergeVertices(g, 1e-4);
  const p = g.attributes.position, fold = new Float32Array(p.count), v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const r = .5 + .5 * Math.sin(v.y * 34 + noise(v.x * 3, v.y * 3, v.z * 3) * 2); fold[i] = 1 - r; const d = .018 * r; p.setXYZ(i, v.x * .42 * (1 + d), v.y * .20 * (1 + d) - .50, v.z * .30 * (1 + d) - .62); }
  g.setAttribute('fold', new THREE.BufferAttribute(fold, 1)); g.setAttribute('cortex', new THREE.BufferAttribute(new Float32Array(p.count), 1)); g.computeVertexNormals(); return g;
}
function stem() {
  const g = new THREE.CylinderGeometry(.075, .055, .42, 28, 12, true); g.rotateX(.35); g.translate(0, -.68, -.28);
  g.setAttribute('fold', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count), 1));
  g.setAttribute('cortex', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count), 1)); return g;
}
const VERT = `attribute float fold;attribute float cortex;varying float vFold,vCortex;varying vec3 vN,vP,vV;void main(){vFold=fold;vCortex=cortex;vN=normalize(normalMatrix*normal);vec4 mv=modelViewMatrix*vec4(position,1.);vV=-mv.xyz;vP=position;gl_Position=projectionMatrix*mv;}`;
const FRAG = `uniform vec3 uLav,uSage,uPeach,uSky,uLight;varying float vFold,vCortex;varying vec3 vN,vP,vV;
float h(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float vn(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);return mix(mix(mix(h(i),h(i+vec3(1,0,0)),f.x),mix(h(i+vec3(0,1,0)),h(i+vec3(1,1,0)),f.x),f.y),mix(mix(h(i+vec3(0,0,1)),h(i+vec3(1,0,1)),f.x),mix(h(i+vec3(0,1,1)),h(i+vec3(1,1,1)),f.x),f.y),f.z);}
void main(){vec3 N=normalize(vN),V=normalize(vV);
 float wrap=clamp(dot(N,normalize((viewMatrix*vec4(uLight,0.)).xyz))*.5+.5,0.,1.);
 float t=clamp(vP.z*.5+.5,0.,1.),hh=clamp(vP.y*1.2+.5,0.,1.);
 vec3 base=mix(mix(uSky,uSage,smoothstep(.0,.45,hh)),mix(uLav,uPeach,smoothstep(.2,.9,t)),smoothstep(.25,.8,hh));
 vec3 p=vP*4.6; vec3 w=vec3(vn(p*.9+3.1),vn(p*.9+7.7),vn(p*.9+11.3))-.5;
 float q=.65*vn(p*1.7+w*1.5)+.35*vn(p*3.4+w*1.8); float aa=fwidth(q)*1.4;
 float sulcus=(1.-smoothstep(.006,.006+aa+.012,abs(q-.5)))*vCortex;
 vec3 c=mix(base,base*vec3(.70,.62,.80),sulcus*.78); c*=(1.0-0.30*vFold);
 c*=(0.82+0.26*wrap); c=mix(c,vec3(1.),.08);
 float fres=pow(1.-max(dot(N,V),0.),2.4); c=mix(c,vec3(1.,.98,.96),fres*.36);
 gl_FragColor=vec4(c,1.);
 #include <colorspace_fragment>
}`;
function dotTex() {
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.25, 'rgba(255,255,255,.85)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

/**
 * createBrain(canvas, { pulses, offsetX, onBreath })
 *  - returns { render(t, calm01, pointer), resize(), dispose() }
 *  calm01: 0 = busy/agitated, 1 = calm. Everything (colour, pulse speed, jitter, breathing depth) follows it.
 */
export function createBrain(canvas, { pulses = 46, offsetX = 0, onBreath } = {}) {
  const C = BRAIN_CFG;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, C.dprCap)); renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene(); const camera = new THREE.PerspectiveCamera(30, 1, .1, 50); camera.position.set(3.5, .75, 1.55); camera.lookAt(0, 0, 0);
  const col = (k) => new THREE.Color(C.calm[k]);
  const mat = new THREE.ShaderMaterial({ uniforms: { uLav: { value: col('lav') }, uSage: { value: col('sage') }, uPeach: { value: col('peach') }, uSky: { value: col('sky') }, uLight: { value: new THREE.Vector3(.5, .8, .6).normalize() } }, vertexShader: VERT, fragmentShader: FRAG });
  const group = new THREE.Group(); scene.add(group); const brain = new THREE.Group(); group.add(brain);
  const hemis = [hemisphere(-1), hemisphere(1)]; const geos = [...hemis, cerebellum(), stem()];
  hemis.forEach((g) => brain.add(new THREE.Mesh(g, mat))); brain.add(new THREE.Mesh(geos[2], mat)); brain.add(new THREE.Mesh(geos[3], mat)); brain.position.y = .02;

  const tex = dotTex(); const rnd = (a, b) => a + Math.random() * (b - a);
  const verts = []; hemis.forEach((g) => { const p = g.attributes.position, n = g.attributes.normal; for (let i = 0; i < p.count; i += 7) verts.push([new THREE.Vector3().fromBufferAttribute(p, i), new THREE.Vector3().fromBufferAttribute(n, i)]); });
  const curves = [];
  for (let k = 0; k < pulses; k++) {
    let cur = verts[Math.floor(Math.random() * verts.length)]; const dir = new THREE.Vector3(rnd(-1, 1), rnd(-.4, .6), rnd(-1, 1)).normalize(); const pts = [cur[0].clone().addScaledVector(cur[1], .025)];
    for (let s = 0; s < 8; s++) { const target = cur[0].clone().addScaledVector(dir, .2); let best = null, bd = 1e9; for (let j = 0; j < 260; j++) { const c = verts[Math.floor(Math.random() * verts.length)]; const d = c[0].distanceToSquared(target); if (d < bd) { bd = d; best = c; } } cur = best; pts.push(cur[0].clone().addScaledVector(cur[1], .025)); dir.add(new THREE.Vector3(rnd(-.4, .4), rnd(-.3, .3), rnd(-.4, .4))).normalize(); }
    curves.push(new THREE.CatmullRomCurve3(pts));
  }
  const N = curves.length, pPos = new Float32Array(N * 3), pGeo = new THREE.BufferGeometry(); pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  const pMat = new THREE.PointsMaterial({ map: tex, size: .085, transparent: true, depthWrite: false, color: C.calm.pulse, sizeAttenuation: true, opacity: .9 });
  const gMat = new THREE.PointsMaterial({ map: tex, size: .2, transparent: true, depthWrite: false, color: '#ffb48f', opacity: .2, sizeAttenuation: true });
  brain.add(new THREE.Points(pGeo, pMat)); brain.add(new THREE.Points(pGeo, gMat));
  const phase = curves.map(() => Math.random()), speed = curves.map(() => rnd(.05, .12));
  const busy = {}, calm = {}; ['lav', 'sage', 'peach', 'sky'].forEach((k) => { busy[k] = new THREE.Color(C.busy[k]); calm[k] = new THREE.Color(C.calm[k]); });
  const pB = new THREE.Color(C.busy.pulse), pC = new THREE.Color(C.calm.pulse), v = new THREE.Vector3();
  let lastBreathLabel = '';

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.fov = w / h < 1 ? 38 : 36;
    if (offsetX && w / h > 1.2) camera.setViewOffset(w, h, -w * offsetX, 0, w, h); else camera.clearViewOffset();
    camera.updateProjectionMatrix();
  }
  function render(t, calm01, pointer = { x: 0, y: 0 }) {
    const e = ease(calm01), tot = C.breath.inhale + C.breath.exhale, cyc = t % tot;
    const br = cyc < C.breath.inhale ? .5 - .5 * Math.cos(cyc / C.breath.inhale * Math.PI) : .5 + .5 * Math.cos((cyc - C.breath.inhale) / C.breath.exhale * Math.PI);
    brain.scale.setScalar(1 + lerp(.012, .05, e) * br);
    const jit = (1 - e) * .014; group.rotation.x = Math.sin(t * 9.1) * jit + pointer.y * .1; group.rotation.y = Math.sin(t * .18) * .3 + pointer.x * .3 + Math.sin(t * 7.3) * jit; group.position.y = Math.sin(t * .6) * .02;
    ['lav', 'sage', 'peach', 'sky'].forEach((k) => mat.uniforms['u' + k[0].toUpperCase() + k.slice(1)].value.copy(busy[k]).lerp(calm[k], e));
    pMat.color.copy(pB).lerp(pC, e); const sp = lerp(2.8, .5, e);
    for (let i = 0; i < N; i++) { const u = (phase[i] + t * speed[i] * sp) % 1; curves[i].getPointAt(u, v); pPos[i * 3] = v.x; pPos[i * 3 + 1] = v.y; pPos[i * 3 + 2] = v.z; }
    pGeo.attributes.position.needsUpdate = true;
    const label = cyc < C.breath.inhale ? 'in' : 'out'; if (label !== lastBreathLabel) { lastBreathLabel = label; onBreath && onBreath(label); }
    renderer.render(scene, camera);
  }
  function dispose() { geos.forEach((g) => g.dispose()); pGeo.dispose(); mat.dispose(); pMat.dispose(); gMat.dispose(); tex.dispose(); renderer.dispose(); }
  resize();
  return { render, resize, dispose };
}
