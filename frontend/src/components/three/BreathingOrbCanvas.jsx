// ============================================
// MindCare Sanctuary — Breathing Orb 3D Canvas
// Lightweight Three.js iridescent breathing sphere with floating pastel petals
// Features:
// 1. Single WebGL canvas, DPR capped at 1.5, low-power preference
// 2. IntersectionObserver + Page Visibility pause when offscreen/tab hidden
// 3. prefers-reduced-motion & user motion preference -> static CSS pastel aurora fallback
// 4. Automatic low-end hardware degrade (concurrency/memory/frame-time) -> static poster
// 5. Custom Fresnel / gradient shader (soft iridescence, zero heavy transmission/refraction)
// 6. Instanced mesh for 40 softly lit floating petals
// 7. Full disposal and cleanup of geometries, materials, listeners, and WebGL context on unmount
// 8. Dynamic synchronized breathwork pacing (Inhale, Hold, Exhale)
// ============================================

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

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

export default function BreathingOrbCanvas({
  size = 'large', // 'large' | 'compact'
  speed = 1.0,
  interactive = true,
  className = '',
  breathingPhase = null, // 'Inhale' | 'Hold' | 'Exhale' | null
  phaseDuration = 4,
  secondsRemaining = 4
}) {
  const mountRef = useRef(null);
  const [reducedMotion, setReducedMotion] = useState(getIsReducedMotion);
  const [frameDegraded, setFrameDegraded] = useState(false);

  const breathRef = useRef({
    phase: breathingPhase,
    duration: phaseDuration,
    remaining: secondsRemaining,
    currentScale: 1.0,
    targetScale: 1.0
  });

  useEffect(() => {
    breathRef.current.phase = breathingPhase;
    breathRef.current.duration = phaseDuration;
    breathRef.current.remaining = secondsRemaining;
  }, [breathingPhase, phaseDuration, secondsRemaining]);

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

  useEffect(() => {
    if (reducedMotion || frameDegraded) return; // Use static CSS poster fallback

    const container = mountRef.current;
    if (!container) return;

    let animId = null;
    let isVisible = true;
    let isTabActive = !document.hidden;
    let slowFrames = 0;

    const width = container.clientWidth || 480;
    const height = container.clientHeight || 480;

    // Detect hardware capability for antialias
    const concurrency = navigator.hardwareConcurrency || 4;
    const canAntialias = concurrency >= 4 && (window.devicePixelRatio || 1) <= 2;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, size === 'compact' ? 12 : 11);

    // 2. Renderer (Capped DPR <= 1.5, powerPreference low-power)
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: canAntialias,
        powerPreference: 'low-power'
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      container.appendChild(renderer.domElement);
    } catch (e) {
      console.warn('WebGL init note for BreathingOrbCanvas:', e.message);
      setFrameDegraded(true);
      return;
    }

    // 3. Iridescent Breathing Sphere Shader Material
    const orbRadius = size === 'compact' ? 2.4 : 2.9;
    const orbGeometry = new THREE.SphereGeometry(orbRadius, 48, 48);

    const orbMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColorSage: { value: new THREE.Color('#74c69d') },
        uColorLavender: { value: new THREE.Color('#9d84b7') },
        uColorPeach: { value: new THREE.Color('#f6bd60') },
        uColorSky: { value: new THREE.Color('#6ba3c7') },
        uColorBase: { value: new THREE.Color('#f8fbf9') }
      },
      vertexShader: `
        uniform float uTime;
        varying vec3 vNormal;
        varying vec3 vViewDir;
        varying vec2 vUv;

        void main() {
          vNormal = normalize(normalMatrix * normal);
          vUv = uv;

          // 8-10 second organic calm breathing cycle
          float breathCycle = sin(uTime * 0.72) * 0.05 + 1.0;
          vec3 displaced = position * breathCycle;

          vec4 modelViewPos = modelViewMatrix * vec4(displaced, 1.0);
          vViewDir = normalize(-modelViewPos.xyz);

          gl_Position = projectionMatrix * modelViewPos;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColorSage;
        uniform vec3 uColorLavender;
        uniform vec3 uColorPeach;
        uniform vec3 uColorSky;
        uniform vec3 uColorBase;

        varying vec3 vNormal;
        varying vec3 vViewDir;
        varying vec2 vUv;

        void main() {
          vec3 norm = normalize(vNormal);
          vec3 view = normalize(vViewDir);

          // Fresnel rim factor (gives luminous soft edge aura)
          float fresnel = clamp(1.0 - dot(norm, view), 0.0, 1.0);
          float rimFactor = pow(fresnel, 2.2);

          // Subtle iridescent color shift based on angle and breath phase
          float wave = sin(vUv.x * 3.1415 + uTime * 0.35) * 0.5 + 0.5;
          float wave2 = cos(vUv.y * 3.1415 + uTime * 0.28) * 0.5 + 0.5;

          vec3 pastelBlend = mix(uColorSage, uColorSky, wave);
          pastelBlend = mix(pastelBlend, uColorLavender, wave2 * 0.6);
          pastelBlend = mix(pastelBlend, uColorPeach, rimFactor * 0.5);

          // Inner pearlescent core with glowing translucent rim
          vec3 finalColor = mix(uColorBase, pastelBlend, rimFactor * 0.85 + 0.15);

          float alpha = mix(0.72, 0.95, rimFactor);

          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    const orbMesh = new THREE.Mesh(orbGeometry, orbMaterial);
    scene.add(orbMesh);

    // 4. Instanced Floating Petals / Pastels Particles Pool (40 particles)
    const PARTICLE_COUNT = 40;
    const petalGeometry = new THREE.PlaneGeometry(0.24, 0.36);
    const petalMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    const instancedPetals = new THREE.InstancedMesh(petalGeometry, petalMaterial, PARTICLE_COUNT);
    const dummy = new THREE.Object3D();
    const petalData = [];

    const pastelPalettes = [
      new THREE.Color('#74c69d'), // Sage
      new THREE.Color('#9d84b7'), // Lavender
      new THREE.Color('#e99a80'), // Peach
      new THREE.Color('#6ba3c7'), // Sky
      new THREE.Color('#f6bd60')  // Amber sun
    ];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const radius = orbRadius * (1.3 + Math.random() * 1.5);
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI * 0.85;

      const x = radius * Math.cos(theta) * Math.cos(phi);
      const y = radius * Math.sin(phi);
      const z = radius * Math.sin(theta) * Math.cos(phi);

      petalData.push({
        baseX: x,
        baseY: y,
        baseZ: z,
        rotSpeedX: (Math.random() - 0.5) * 0.015,
        rotSpeedY: (Math.random() - 0.5) * 0.02,
        floatSpeed: 0.6 + Math.random() * 0.8,
        phase: Math.random() * Math.PI * 2
      });

      dummy.position.set(x, y, z);
      dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      dummy.updateMatrix();
      instancedPetals.setMatrixAt(i, dummy.matrix);

      // Assign subtle pastel tint
      const col = pastelPalettes[i % pastelPalettes.length];
      instancedPetals.setColorAt(i, col);
    }

    instancedPetals.instanceMatrix.needsUpdate = true;
    if (instancedPetals.instanceColor) instancedPetals.instanceColor.needsUpdate = true;
    scene.add(instancedPetals);

    // 5. Interactive Mouse Parallax & Scroll Dampers
    const mouse = { targetX: 0, targetY: 0, currentX: 0, currentY: 0 };
    const scroll = { targetY: 0, currentY: 0 };

    const handleMouseMove = (e) => {
      if (!interactive) return;
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mouse.targetX = Math.max(-1, Math.min(1, x)) * 0.8;
      mouse.targetY = Math.max(-1, Math.min(1, y)) * 0.6;
    };

    const handleScroll = () => {
      scroll.targetY = window.scrollY * 0.0018;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });

    // 6. IntersectionObserver: Pause when off-screen
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        isVisible = entry.isIntersecting;
      });
    }, { threshold: 0.05 });

    observer.observe(container);

    // 7. Page Visibility API: Pause when tab is hidden
    const handleVisibilityChange = () => {
      isTabActive = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 8. Resize Handler
    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth || 480;
      const newH = container.clientHeight || 480;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };
    window.addEventListener('resize', handleResize, { passive: true });

    // 9. Animation Render Loop
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);

      if (!isVisible || !isTabActive) return; // Paused when offscreen or tab hidden

      // Frame time monitoring: auto-degrade on sustained low FPS
      const delta = clock.getDelta();
      if (delta > 0.045) { // < 22 FPS
        slowFrames++;
        if (slowFrames > 40) {
          console.warn('MindCare: Auto-degrading 3D canvas due to sustained low frame-rate.');
          setFrameDegraded(true);
          return;
        }
      } else {
        slowFrames = Math.max(0, slowFrames - 1);
      }

      const elapsedTime = clock.getElapsedTime() * speed;

      // Update shader uniform time
      orbMaterial.uniforms.uTime.value = elapsedTime;

      // Breathwork Pacing Sync
      const bState = breathRef.current;
      if (bState && bState.phase) {
        const dur = Math.max(0.5, bState.duration || 4);
        const rem = typeof bState.remaining === 'number' ? bState.remaining : dur;
        const progress = Math.max(0, Math.min(1, 1 - (rem / dur)));

        let targetScale = 1.0;
        if (bState.phase === 'Inhale') {
          targetScale = 0.88 + progress * 0.46;
        } else if (bState.phase === 'Hold') {
          targetScale = 1.34 + Math.sin(elapsedTime * 2.0) * 0.02;
        } else if (bState.phase === 'Exhale') {
          targetScale = 1.34 - progress * 0.46;
        }

        bState.currentScale += (targetScale - bState.currentScale) * 0.08;
        const s = bState.currentScale;
        orbMesh.scale.set(s, s, s);
      } else {
        orbMesh.scale.set(1.0, 1.0, 1.0);
      }

      // Parallax smoothing (lerp)
      mouse.currentX += (mouse.targetX - mouse.currentX) * 0.045;
      mouse.currentY += (mouse.targetY - mouse.currentY) * 0.045;
      scroll.currentY += (scroll.targetY - scroll.currentY) * 0.06;

      // Gentle orbital tilt and camera drift
      orbMesh.rotation.y = elapsedTime * 0.12 + mouse.currentX * 0.35;
      orbMesh.rotation.x = Math.sin(elapsedTime * 0.1) * 0.15 + mouse.currentY * 0.25;

      camera.position.x = mouse.currentX * 1.2;
      camera.position.y = mouse.currentY * 0.8 - scroll.currentY * 1.5;
      camera.lookAt(0, 0, 0);

      // Animate floating petals
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const p = petalData[i];
        const bob = Math.sin(elapsedTime * p.floatSpeed + p.phase) * 0.35;
        const drift = Math.cos(elapsedTime * 0.4 + p.phase) * 0.2;

        dummy.position.set(p.baseX + drift, p.baseY + bob, p.baseZ + drift);
        dummy.rotation.x += p.rotSpeedX;
        dummy.rotation.y += p.rotSpeedY;
        dummy.updateMatrix();
        instancedPetals.setMatrixAt(i, dummy.matrix);
      }
      instancedPetals.instanceMatrix.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    // 10. Complete Cleanup & Disposal on unmount
    return () => {
      if (animId) cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      observer.disconnect();

      // Geometry & material disposal
      orbGeometry.dispose();
      orbMaterial.dispose();
      petalGeometry.dispose();
      petalMaterial.dispose();
      instancedPetals.dispose?.();

      if (renderer) {
        renderer.dispose();
        renderer.forceContextLoss?.();
        if (renderer.domElement && renderer.domElement.parentNode) {
          renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
      }
    };
  }, [size, speed, interactive, reducedMotion, frameDegraded]);

  // Accessible Fallback for reduced motion or degraded low-end device: Pure CSS soft glowing iridescent orb
  if (reducedMotion || frameDegraded) {
    return (
      <div
        className={`breathing-orb-fallback ${className}`}
        aria-hidden="true"
        role="presentation"
        style={{
          width: size === 'compact' ? '280px' : '420px',
          height: size === 'compact' ? '280px' : '420px',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 35%, rgba(255, 255, 255, 0.95), rgba(116, 198, 157, 0.6) 45%, rgba(157, 132, 183, 0.5) 75%, rgba(246, 189, 96, 0.45) 100%)',
          boxShadow: '0 0 45px rgba(82, 183, 136, 0.35), inset 0 0 30px rgba(255, 255, 255, 0.8)',
          filter: 'blur(1px)',
          margin: '0 auto'
        }}
      />
    );
  }

  return (
    <div
      ref={mountRef}
      className={`breathing-orb-container ${className}`}
      aria-hidden="true"
      role="presentation"
      style={{
        width: '100%',
        height: size === 'compact' ? '340px' : '480px',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: interactive ? 'auto' : 'none'
      }}
    />
  );
}
