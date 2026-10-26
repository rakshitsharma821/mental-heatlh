// ============================================
// MindCare Sanctuary — Calm 3D Brain Hero
// Procedural, lightweight pastel 3D brain with:
// 1. Dual cerebral hemispheres, central sagittal fissure, cerebellum, brain stem
// 2. Continuous domain-warped wormy gyri and crisp sulci valleys
// 3. Warm thought-pulses traveling along the cortex
// 4. Opaque custom ShaderMaterial with sRGB color space & <colorspace_fragment>
// 5. 9-second autonomic breathing cycle (scale + halo) with synced "Breathe in..." / "Breathe out..." caption
// 6. Soft round pastel motes (strictly no sharp/diamond/pyramid shapes)
// 7. 3/4 side view with slow sway & gentle mouse/touch parallax
// 8. Single canvas, DPR capped at 1.5, low-power mode, IntersectionObserver + visibility pauses
// 9. Full disposal of geometries, materials, shaders, textures on unmount
// 10. Automatic degrade on low-end hardware and strict reduced-motion compliance
// ============================================

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { theme } from '../../styles/theme';
import { UI_STRINGS } from '../../config/strings';

// Hardware and motion preference detection
const getIsReducedMotion = () => {
  try {
    const media = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const stored = typeof localStorage !== 'undefined' && localStorage.getItem('mindcare_reduce_motion') === 'true';
    const isLowEndHardware = typeof navigator !== 'undefined' && (
      (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) ||
      (navigator.deviceMemory && navigator.deviceMemory <= 2)
    );
    return Boolean(media || stored || isLowEndHardware);
  } catch (_) {
    return false;
  }
};

// Generates a soft circular mote texture
function createCircleTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 30);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.35, 'rgba(255, 255, 255, 0.85)');
  gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.35)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// Generates soft radial halo texture for the breathing back-glow
function createHaloTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 126);
  gradient.addColorStop(0, 'rgba(157, 132, 183, 0.32)'); // Soft lavender
  gradient.addColorStop(0.4, 'rgba(116, 198, 157, 0.20)'); // Soft sage
  gradient.addColorStop(0.75, 'rgba(246, 189, 96, 0.08)'); // Soft peach
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// Domain-warped gyri calculation producing continuous wormy cerebral folds
function calculateGyriFold(nx, ny, nz) {
  // 1. Primary domain warp for organic curved flow
  const w1x = nx + 0.35 * Math.sin(ny * 2.8 + 0.9) + 0.22 * Math.cos(nz * 2.5 + 1.4);
  const w1y = ny + 0.35 * Math.sin(nz * 3.0 + 1.8) + 0.22 * Math.cos(nx * 2.7 + 0.5);
  const w1z = nz + 0.35 * Math.sin(nx * 2.9 + 2.1) + 0.22 * Math.cos(ny * 2.8 + 1.6);

  // 2. Secondary warp for serpentine "wormy" winding
  const w2x = w1x + 0.24 * Math.sin(w1y * 5.2 + 2.1);
  const w2y = w1y + 0.24 * Math.sin(w1z * 4.8 + 1.3);
  const w2z = w1z + 0.24 * Math.sin(w1x * 5.4 + 0.8);

  // 3. Multi-directional ridged gyri waves
  const g1 = Math.sin(w2x * 6.2 + Math.cos(w2y * 4.8) * 1.6 + w2z * 3.8);
  const g2 = Math.cos(w2y * 6.5 + Math.sin(w2z * 5.2) * 1.6 + w2x * 4.2);
  const g3 = Math.sin(w2z * 5.8 + Math.cos(w2x * 4.6) * 1.6 + w2y * 4.5);

  // Undulating gyri field
  const rawCombined = (g1 * g2 + g2 * g3 + g3 * g1) * 0.5 + 0.5; // 0 to 1
  // Smooth ridge profile: valleys stay down, crests round off gently
  const fold = Math.sin(rawCombined * Math.PI);
  return Math.max(0.0, Math.min(1.0, fold));
}

// Deform hemisphere geometry with wormy gyri, sagittal fissure damping, and sulcus vertex attribute
function deformHemisphereGeometry(geom, isLeft = true) {
  const posAttr = geom.attributes.position;
  const count = posAttr.count;
  const sulcusAttr = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const x = posAttr.getX(i);
    const y = posAttr.getY(i);
    const z = posAttr.getZ(i);

    const len = Math.sqrt(x * x + y * y + z * z) || 1.0;
    const nx = x / len;
    const ny = y / len;
    const nz = z / len;

    // Organic wormy gyri
    const fold = calculateGyriFold(nx, ny, nz);

    // Sagittal fissure damping:
    // Medial face points towards x = 0 (positive nx for left, negative nx for right)
    const facingInner = isLeft ? nx : -nx;
    const fissureDamp = facingInner > 0.02
      ? Math.max(0.05, 1.0 - Math.pow(facingInner, 1.1) * 1.4)
      : 1.0;

    // Ventral / stem connection damping
    const ventralDamp = ny < -0.35 ? Math.max(0.1, 1.0 + (ny + 0.35) * 1.6) : 1.0;

    // Anatomical lobe shaping:
    // Frontal lobe (positive Z, positive Y) slightly fuller
    // Occipital lobe (negative Z) slightly rounded down
    const lobeMod = 1.0 + (nz > 0.2 ? 0.06 * nz : -0.04 * Math.abs(nz));

    const displacement = fold * 0.085 * fissureDamp * ventralDamp * lobeMod;

    posAttr.setXYZ(
      i,
      x + nx * displacement,
      y + ny * displacement,
      z + nz * displacement
    );

    sulcusAttr[i] = fold;
  }

  geom.setAttribute('aSulcus', new THREE.BufferAttribute(sulcusAttr, 1));
  geom.computeVertexNormals();
  return geom;
}

// Folia deformation for cerebellum (fine horizontal parallel ridges)
function deformCerebellumGeometry(geom) {
  const posAttr = geom.attributes.position;
  const count = posAttr.count;
  const sulcusAttr = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const x = posAttr.getX(i);
    const y = posAttr.getY(i);
    const z = posAttr.getZ(i);

    const len = Math.sqrt(x * x + y * y + z * z) || 1.0;
    const nx = x / len;
    const ny = y / len;
    const nz = z / len;

    const f1 = 1.0 - Math.abs(Math.sin(ny * 20.0 + nz * 6.0));
    const f2 = 1.0 - Math.abs(Math.sin(nx * 10.0 + ny * 14.0));
    const fold = Math.pow(f1 * 0.7 + f2 * 0.3, 1.5);
    const disp = fold * 0.05;

    posAttr.setXYZ(i, x + nx * disp, y + ny * disp, z + nz * disp);
    sulcusAttr[i] = fold;
  }

  geom.setAttribute('aSulcus', new THREE.BufferAttribute(sulcusAttr, 1));
  geom.computeVertexNormals();
  return geom;
}

// Longitudinal ridges for brain stem
function deformBrainStemGeometry(geom) {
  const posAttr = geom.attributes.position;
  const count = posAttr.count;
  const sulcusAttr = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const x = posAttr.getX(i);
    const y = posAttr.getY(i);
    const z = posAttr.getZ(i);

    const angle = Math.atan2(z, x);
    const fold = 0.5 + 0.5 * Math.sin(angle * 6.0);
    const disp = fold * 0.02;

    const r = Math.sqrt(x * x + z * z) || 1.0;
    const nx = x / r;
    const nz = z / r;

    posAttr.setXYZ(i, x + nx * disp, y, z + nz * disp);
    sulcusAttr[i] = fold;
  }

  geom.setAttribute('aSulcus', new THREE.BufferAttribute(sulcusAttr, 1));
  geom.computeVertexNormals();
  return geom;
}

export default function CalmBrainHero({ className = '', style = {} }) {
  const mountRef = useRef(null);
  const [reducedMotion, setReducedMotion] = useState(getIsReducedMotion);
  const [frameDegraded, setFrameDegraded] = useState(false);
  const [breathingText, setBreathingText] = useState(UI_STRINGS.hero?.breatheIn || 'Breathe in...');

  // Motion preference listeners
  useEffect(() => {
    const handleMediaChange = () => setReducedMotion(getIsReducedMotion());
    const handleCustomChange = (e) => {
      if (e?.detail?.reduceMotion !== undefined) {
        setReducedMotion(Boolean(e.detail.reduceMotion));
      } else {
        setReducedMotion(getIsReducedMotion());
      }
    };

    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      mediaQuery.addEventListener('change', handleMediaChange);
      window.addEventListener('mindcare-motion-preference-changed', handleCustomChange);
      return () => {
        mediaQuery.removeEventListener('change', handleMediaChange);
        window.removeEventListener('mindcare-motion-preference-changed', handleCustomChange);
      };
    }
  }, []);

  // Three.js Scene Setup & Loop
  useEffect(() => {
    if (reducedMotion || frameDegraded) return;

    const container = mountRef.current;
    if (!container) return;

    let animId = null;
    let isVisible = true;
    let isTabActive = !document.hidden;
    let slowFrames = 0;

    const width = container.clientWidth || 540;
    const height = container.clientHeight || 520;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0.15, 3.8);

    let renderer = null;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'low-power'
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      container.appendChild(renderer.domElement);
    } catch (e) {
      setFrameDegraded(true);
      return;
    }

    // 2. Custom Shader Material for Soft Pastel Brain
    // Uses true pastel tokens: soft sage, lavender, peach, sky
    const brainUniforms = {
      uTime: { value: 0 },
      uBreathScale: { value: 1.0 },
      uSage: { value: new THREE.Color('#74c69d') },
      uLavender: { value: new THREE.Color('#b8a6d6') },
      uPeach: { value: new THREE.Color('#f6bd60') },
      uSky: { value: new THREE.Color('#94c2e0') },
      uSulcusDark: { value: new THREE.Color('#3a5345') } // Subtle deep sage-slate for sulci valleys
    };

    const brainMaterial = new THREE.ShaderMaterial({
      uniforms: brainUniforms,
      vertexShader: `
        attribute float aSulcus;
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec3 vWorldPosition;
        varying float vSulcus;
        uniform float uTime;
        uniform float uBreathScale;

        void main() {
          vSulcus = aSulcus;
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;

          float breathPulse = (uBreathScale - 1.0) * 0.32;
          vec3 displacedPos = position + normal * breathPulse;
          vec4 worldPos = modelMatrix * vec4(displacedPos, 1.0);
          vWorldPosition = worldPos.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uSage;
        uniform vec3 uLavender;
        uniform vec3 uPeach;
        uniform vec3 uSky;
        uniform vec3 uSulcusDark;

        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec3 vWorldPosition;
        varying float vSulcus;

        void main() {
          vec3 normal = normalize(vNormal);
          vec3 viewDir = normalize(cameraPosition - vWorldPosition);

          // 1. Soft 3-Point Light
          vec3 keyDir = normalize(vec3(0.5, 0.75, 0.7));
          float keyLight = max(dot(normal, keyDir), 0.0);

          vec3 fillDir = normalize(vec3(-0.6, -0.3, -0.5));
          float fillLight = max(dot(normal, fillDir), 0.0);

          float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), 2.4);

          // 2. Base Pastel Gradient across cortex
          // Frontal/anterior is soft sage (#74c69d)
          // Top/posterior is soft lavender (#b8a6d6)
          // Lateral/lower is sky blue (#94c2e0)
          float tY = clamp((vPosition.y + 0.6) / 1.3, 0.0, 1.0);
          float tZ = clamp((vPosition.z + 0.8) / 1.6, 0.0, 1.0);

          vec3 basePastel = mix(uSage, uLavender, tY * 0.65 + (1.0 - tZ) * 0.35);
          basePastel = mix(basePastel, uSky, (1.0 - tY) * 0.45);

          // 3. Clear, subtle darker sulcus valley shading
          // In the valleys (vSulcus near 0), mix in subtle darker tone
          float sulcusVal = clamp(vSulcus, 0.0, 1.0);
          vec3 surfaceColor = mix(uSulcusDark, basePastel, smoothstep(0.12, 0.72, sulcusVal));

          // 4. Soft diffuse lighting (warm daylight ambient + gentle key)
          float lighting = 0.58 + keyLight * 0.36 + fillLight * 0.16;
          vec3 litColor = surfaceColor * lighting;

          // 5. Warm thought-pulses travelling slowly along cortex
          // Wave travels along front-to-back contours
          float pulseWave = sin(vPosition.y * 3.4 + vPosition.z * 2.6 + vPosition.x * 1.6 - uTime * 1.4);
          float pulseGlow = smoothstep(0.72, 0.98, pulseWave);

          float pulseWave2 = sin(vPosition.z * 3.0 - vPosition.y * 2.2 + vPosition.x * 2.0 - uTime * 1.1 + 2.5);
          float pulseGlow2 = smoothstep(0.76, 0.99, pulseWave2);

          float totalPulse = max(pulseGlow, pulseGlow2 * 0.7);
          vec3 warmPeachPulse = mix(uPeach, vec3(1.0, 0.94, 0.86), 0.45);
          litColor += warmPeachPulse * (totalPulse * 0.38);

          // 6. Soft sky rim highlight
          litColor += uSky * (fresnel * 0.34);

          gl_FragColor = vec4(litColor, 1.0);

          #include <colorspace_fragment>
        }
      `,
      transparent: false,
      depthWrite: true,
      depthTest: true
    });

    // 3. Procedural Brain Assembly in a Group
    const brainGroup = new THREE.Group();

    // 3a. Dual Cerebral Hemispheres (Left & Right)
    // Using SphereGeometry with 64x52 segments for smooth, continuous curvature
    const hemiGeomLeft = new THREE.SphereGeometry(0.78, 64, 52);
    deformHemisphereGeometry(hemiGeomLeft, true);
    const hemiMeshLeft = new THREE.Mesh(hemiGeomLeft, brainMaterial);
    hemiMeshLeft.position.set(-0.28, 0.08, 0);
    hemiMeshLeft.scale.set(0.70, 0.85, 1.12);
    brainGroup.add(hemiMeshLeft);

    const hemiGeomRight = new THREE.SphereGeometry(0.78, 64, 52);
    deformHemisphereGeometry(hemiGeomRight, false);
    const hemiMeshRight = new THREE.Mesh(hemiGeomRight, brainMaterial);
    hemiMeshRight.position.set(0.28, 0.08, 0);
    hemiMeshRight.scale.set(0.70, 0.85, 1.12);
    brainGroup.add(hemiMeshRight);

    // 3b. Cerebellum (Tucked posterior-inferiorly)
    const cerebGeomLeft = new THREE.SphereGeometry(0.32, 44, 32);
    deformCerebellumGeometry(cerebGeomLeft);
    const cerebMeshLeft = new THREE.Mesh(cerebGeomLeft, brainMaterial);
    cerebMeshLeft.position.set(-0.22, -0.42, -0.46);
    cerebMeshLeft.scale.set(0.85, 0.62, 0.78);
    brainGroup.add(cerebMeshLeft);

    const cerebGeomRight = new THREE.SphereGeometry(0.32, 44, 32);
    deformCerebellumGeometry(cerebGeomRight);
    const cerebMeshRight = new THREE.Mesh(cerebGeomRight, brainMaterial);
    cerebMeshRight.position.set(0.22, -0.42, -0.46);
    cerebMeshRight.scale.set(0.85, 0.62, 0.78);
    brainGroup.add(cerebMeshRight);

    // 3c. Brain Stem (Tapered cylinder extending downward from under cerebellum)
    const stemGeom = new THREE.CylinderGeometry(0.15, 0.10, 0.55, 32, 16);
    deformBrainStemGeometry(stemGeom);
    const stemMesh = new THREE.Mesh(stemGeom, brainMaterial);
    stemMesh.position.set(0, -0.66, -0.16);
    stemMesh.rotation.x = 0.20;
    brainGroup.add(stemMesh);

    // 3/4 Side Profile View
    // Angle reveals both frontal lobe, lateral temporal lobe, cerebellum, and stem
    const baseRotX = 0.18;
    const baseRotY = 0.72;
    const baseRotZ = -0.05;
    brainGroup.rotation.set(baseRotX, baseRotY, baseRotZ);
    brainGroup.position.set(0, 0.12, 0);
    scene.add(brainGroup);

    // 4. Soft Breathing Halo Billboard Behind Brain
    const haloTexture = createHaloTexture();
    const haloGeom = new THREE.PlaneGeometry(3.5, 3.5);
    const haloMat = new THREE.MeshBasicMaterial({
      map: haloTexture,
      transparent: true,
      opacity: 0.60,
      blending: THREE.NormalBlending,
      depthWrite: false
    });
    const haloMesh = new THREE.Mesh(haloGeom, haloMat);
    haloMesh.position.set(0, 0.1, -0.4);
    scene.add(haloMesh);

    // 5. Soft Round Floating Motes (No sharp/diamond/pyramid shapes)
    const moteTexture = createCircleTexture();
    const moteCount = 36;
    const motePositions = new Float32Array(moteCount * 3);
    const moteColors = new Float32Array(moteCount * 3);
    const moteOffsets = new Float32Array(moteCount);

    const pastelPalette = [
      new THREE.Color('#74c69d'), // Soft Sage
      new THREE.Color('#b8a6d6'), // Soft Lavender
      new THREE.Color('#f6bd60'), // Soft Peach
      new THREE.Color('#94c2e0')  // Soft Sky
    ];

    for (let i = 0; i < moteCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI * 0.75;
      const rad = 1.25 + Math.random() * 1.15;

      motePositions[i * 3] = rad * Math.cos(phi) * Math.sin(theta);
      motePositions[i * 3 + 1] = rad * Math.sin(phi) + 0.1;
      motePositions[i * 3 + 2] = rad * Math.cos(phi) * Math.cos(theta);

      const color = pastelPalette[i % pastelPalette.length];
      moteColors[i * 3] = color.r;
      moteColors[i * 3 + 1] = color.g;
      moteColors[i * 3 + 2] = color.b;

      moteOffsets[i] = Math.random() * Math.PI * 2;
    }

    const motesGeom = new THREE.BufferGeometry();
    motesGeom.setAttribute('position', new THREE.BufferAttribute(motePositions, 3));
    motesGeom.setAttribute('color', new THREE.BufferAttribute(moteColors, 3));

    const motesMat = new THREE.PointsMaterial({
      size: 0.085,
      map: moteTexture,
      transparent: true,
      opacity: 0.70,
      vertexColors: true,
      blending: THREE.NormalBlending,
      depthWrite: false
    });
    const motes = new THREE.Points(motesGeom, motesMat);
    scene.add(motes);

    // 6. Interactive Mouse & Touch Parallax
    const targetParallax = { x: 0, y: 0 };
    const currentParallax = { x: 0, y: 0 };

    const handlePointerMove = (e) => {
      const rect = container.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const nx = ((clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -(((clientY - rect.top) / rect.height) * 2 - 1);
      targetParallax.x = Math.max(-1, Math.min(1, nx)) * 0.20;
      targetParallax.y = Math.max(-1, Math.min(1, ny)) * 0.14;
    };

    const handlePointerLeave = () => {
      targetParallax.x = 0;
      targetParallax.y = 0;
    };

    container.addEventListener('pointermove', handlePointerMove, { passive: true });
    container.addEventListener('touchmove', handlePointerMove, { passive: true });
    container.addEventListener('pointerleave', handlePointerLeave);

    // 7. Visibility & Intersection Observers
    const handleVisibility = () => {
      isTabActive = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibility);

    const intersectionObserver = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
    }, { threshold: 0.1 });
    intersectionObserver.observe(container);

    // 8. Animation Loop with 9s Autonomic Breathing Cycle
    const clock = new THREE.Clock();
    const breathDuration = theme.motion?.durations?.brainBreathSeconds || 9.0;
    let lastCaptionState = null;

    const animate = () => {
      animId = requestAnimationFrame(animate);

      if (!isVisible || !isTabActive) return;

      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      // Prolonged frame drop fallback
      if (delta > 0.1) {
        slowFrames++;
        if (slowFrames > 60) {
          setFrameDegraded(true);
          return;
        }
      } else {
        slowFrames = Math.max(0, slowFrames - 1);
      }

      // Autonomic 9s Breathing Cycle
      const breathPhase = (elapsedTime % breathDuration) / breathDuration;
      const isExhaling = breathPhase >= 0.5;
      const breathCycleSine = Math.sin(breathPhase * Math.PI * 2 - Math.PI / 2); // -1 to 1
      const normalizedBreath = (breathCycleSine + 1.0) * 0.5; // 0 to 1

      // Caption sync
      if (isExhaling !== lastCaptionState) {
        lastCaptionState = isExhaling;
        setBreathingText(isExhaling ? (UI_STRINGS.hero?.breatheOut || 'Breathe out...') : (UI_STRINGS.hero?.breatheIn || 'Breathe in...'));
      }

      // Scale breathing modulation (0.975 to 1.045)
      const currentBreathScale = 1.0 + normalizedBreath * 0.052;
      brainUniforms.uBreathScale.value = currentBreathScale;
      brainUniforms.uTime.value = elapsedTime;

      // Halo breathing sync
      haloMesh.scale.set(1.0 + normalizedBreath * 0.12, 1.0 + normalizedBreath * 0.12, 1);
      haloMat.opacity = 0.40 + normalizedBreath * 0.25;

      // Parallax smooth interpolation
      currentParallax.x += (targetParallax.x - currentParallax.x) * 0.05;
      currentParallax.y += (targetParallax.y - currentParallax.y) * 0.05;

      // Slow organic sway
      const swayYaw = Math.sin(elapsedTime * 0.42) * 0.045;
      const swayPitch = Math.cos(elapsedTime * 0.32) * 0.03;

      brainGroup.rotation.y = baseRotY + swayYaw + currentParallax.x;
      brainGroup.rotation.x = baseRotX + swayPitch - currentParallax.y;
      brainGroup.scale.setScalar(currentBreathScale);

      // Float soft round motes
      const posAttr = motesGeom.attributes.position;
      for (let i = 0; i < moteCount; i++) {
        const off = moteOffsets[i];
        const bob = Math.sin(elapsedTime * 0.55 + off) * 0.0014;
        posAttr.setY(i, posAttr.getY(i) + bob);
      }
      posAttr.needsUpdate = true;
      motes.rotation.y = elapsedTime * 0.035;

      renderer.render(scene, camera);
    };

    animate();

    // 9. Resize Handler
    const handleResize = () => {
      if (!container || !renderer) return;
      const w = container.clientWidth || 540;
      const h = container.clientHeight || 520;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 10. Complete Cleanup & Resource Disposal on Unmount
    return () => {
      cancelAnimationFrame(animId);
      document.removeEventListener('visibilitychange', handleVisibility);
      intersectionObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('pointermove', handlePointerMove);
      container.removeEventListener('touchmove', handlePointerMove);
      container.removeEventListener('pointerleave', handlePointerLeave);

      // Dispose Geometries
      hemiGeomLeft.dispose();
      hemiGeomRight.dispose();
      cerebGeomLeft.dispose();
      cerebGeomRight.dispose();
      stemGeom.dispose();
      haloGeom.dispose();
      motesGeom.dispose();

      // Dispose Materials & Shaders
      brainMaterial.dispose();
      haloMat.dispose();
      motesMat.dispose();

      // Dispose Textures
      if (haloTexture) haloTexture.dispose();
      if (moteTexture) moteTexture.dispose();

      // Dispose Renderer & WebGL Context
      if (renderer) {
        renderer.dispose();
        if (renderer.domElement && renderer.domElement.parentNode) {
          renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
      }
    };
  }, [reducedMotion, frameDegraded]);

  // Reduced motion or low-end fallback poster (Canvas-free, elegant botanical pastel representation)
  if (reducedMotion || frameDegraded) {
    return (
      <div
        className={`calm-brain-hero-fallback ${className}`}
        style={{
          width: '100%',
          maxWidth: '560px',
          minHeight: '440px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          padding: '24px',
          ...style
        }}
        data-testid="calm-brain-static-fallback"
      >
        <svg
          viewBox="0 0 340 300"
          width="100%"
          height="100%"
          style={{ maxWidth: '380px', maxHeight: '340px', filter: 'drop-shadow(0 12px 32px rgba(82, 183, 136, 0.16))' }}
          role="img"
          aria-label="Pastel procedural brain representing mindful restoration"
        >
          <defs>
            <radialGradient id="brainPosterGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="var(--accent-lavender-soft)" stopOpacity="0.8" />
              <stop offset="50%" stopColor="var(--accent-sage-soft)" stopOpacity="0.4" />
              <stop offset="100%" stopColor="var(--bg-primary)" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="brainPastelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#74c69d" />
              <stop offset="50%" stopColor="#b8a6d6" />
              <stop offset="100%" stopColor="#94c2e0" />
            </linearGradient>
            <linearGradient id="brainSulcusGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3a5345" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#245741" stopOpacity="0.5" />
            </linearGradient>
          </defs>

          {/* Background Ambient Halo */}
          <circle cx="170" cy="150" r="135" fill="url(#brainPosterGlow)" />

          {/* Dual Hemispheres Silhouette & Gyri Folds */}
          <g transform="translate(170, 140)">
            {/* Left Hemisphere */}
            <path
              d="M -6 -80 C -60 -80 -120 -40 -120 20 C -120 70 -70 100 -20 95 C -10 95 -6 80 -6 70 Z"
              fill="url(#brainPastelGrad)"
              opacity="0.9"
            />
            {/* Right Hemisphere */}
            <path
              d="M 6 -80 C 60 -80 120 -40 120 20 C 120 70 70 100 20 95 C 10 95 6 80 6 70 Z"
              fill="url(#brainPastelGrad)"
              opacity="0.95"
            />
            {/* Cerebellum Lobes */}
            <ellipse cx="-45" cy="85" rx="35" ry="24" fill="#b8a6d6" opacity="0.85" />
            <ellipse cx="45" cy="85" rx="35" ry="24" fill="#b8a6d6" opacity="0.85" />
            {/* Brain Stem */}
            <path d="M -15 88 L -8 135 L 8 135 L 15 88 Z" fill="#74c69d" opacity="0.8" />
            {/* Sagittal Fissure Divider */}
            <line x1="0" y1="-80" x2="0" y2="88" stroke="#3a5345" strokeWidth="2.5" strokeOpacity="0.4" />
            {/* Gyri Ridges */}
            <path d="M -90 10 Q -60 -10 -40 15 Q -20 35 -10 20" stroke="white" strokeWidth="3" fill="none" opacity="0.5" strokeLinecap="round" />
            <path d="M -100 -30 Q -60 -50 -30 -30 Q -10 -15 -8 -50" stroke="white" strokeWidth="3" fill="none" opacity="0.5" strokeLinecap="round" />
            <path d="M 90 10 Q 60 -10 40 15 Q 20 35 10 20" stroke="white" strokeWidth="3" fill="none" opacity="0.5" strokeLinecap="round" />
            <path d="M 100 -30 Q 60 -50 30 -30 Q 10 -15 8 -50" stroke="white" strokeWidth="3" fill="none" opacity="0.5" strokeLinecap="round" />
          </g>

          {/* Floating Pastel Motes */}
          <circle cx="60" cy="80" r="5" fill="#74c69d" opacity="0.6" />
          <circle cx="280" cy="70" r="6" fill="#b8a6d6" opacity="0.6" />
          <circle cx="50" cy="210" r="4" fill="#f6bd60" opacity="0.6" />
          <circle cx="290" cy="200" r="5" fill="#94c2e0" opacity="0.6" />
        </svg>

        {/* Breathing Synchronized Caption Pill */}
        <div
          className="glass-card"
          style={{
            marginTop: '16px',
            padding: '10px 22px',
            borderRadius: 'var(--radius-full)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.86rem',
            fontWeight: 600,
            color: 'var(--accent-forest)',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <span style={{ color: 'var(--accent-mint)' }}></span>
          <span>{UI_STRINGS.hero?.breatheCycleCaption || '9s Natural Respiratory Cycle • Adaptive Calming'}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`calm-brain-hero-wrapper ${className}`}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        minHeight: '520px',
        ...style
      }}
    >
      {/* 3D Canvas Mount */}
      <div
        ref={mountRef}
        style={{
          width: '100%',
          maxWidth: '560px',
          height: '500px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'grab'
        }}
        aria-label="3D calm pastel brain hero with gentle breathing and thought pulses"
      />

      {/* Floating Glass Pill with Synchronized 9s Breath Pacing Caption */}
      <div
        className="glass-card"
        style={{
          position: 'absolute',
          bottom: '8px',
          padding: '8px 20px',
          borderRadius: 'var(--radius-full)',
          display: 'flex',
          alignItems: 'center',
          gap: '9px',
          fontSize: '0.82rem',
          fontWeight: 600,
          color: 'var(--accent-forest)',
          boxShadow: 'var(--shadow-md)',
          pointerEvents: 'none',
          transition: 'all 0.6s cubic-bezier(0.2, 0, 0.2, 1)'
        }}
      >
        <span
          style={{
            display: 'inline-block',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: 'var(--accent-leaf)',
            boxShadow: '0 0 8px var(--accent-mint)'
          }}
        />
        <span style={{ letterSpacing: '0.02em', minWidth: '92px', textAlign: 'center' }}>
          {breathingText}
        </span>
        <span style={{ color: 'var(--border-hover)', margin: '0 2px' }}>•</span>
        <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
          {UI_STRINGS.hero?.breatheCycleCaption || '9s Natural Cycle'}
        </span>
      </div>
    </div>
  );
}
