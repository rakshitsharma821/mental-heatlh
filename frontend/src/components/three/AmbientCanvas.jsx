import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function AmbientCanvas({ count = 35, speed = 0.4 }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Check reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const particleCount = prefersReducedMotion ? 12 : count;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    camera.position.z = 25;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: 'low-power' });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      container.appendChild(renderer.domElement);
    } catch (e) {
      console.warn('WebGL not supported for ambient canvas:', e);
      return;
    }

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const opacities = new Float32Array(particleCount);
    const originalPositions = [];

    for (let i = 0; i < particleCount; i++) {
      const x = (Math.random() - 0.5) * 45;
      const y = (Math.random() - 0.5) * 35;
      const z = (Math.random() - 0.5) * 20;
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      opacities[i] = Math.random() * 0.4 + 0.15;
      originalPositions.push({ x, y, z, seed: Math.random() * 100 });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Particle sprite: sunlit garden pollen mote
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(82, 183, 136, 0.85)');
    grad.addColorStop(0.45, 'rgba(246, 189, 96, 0.55)');
    grad.addColorStop(1, 'rgba(246, 189, 96, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(16, 16, 16, 0, Math.PI * 2);
    ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.PointsMaterial({
      size: 0.95,
      map: texture,
      transparent: true,
      blending: THREE.NormalBlending,
      depthWrite: false,
      opacity: 0.65
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    let animId;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (document.hidden) return;

      const elapsed = clock.getElapsedTime() * speed;
      const pos = geometry.attributes.position.array;

      for (let i = 0; i < particleCount; i++) {
        const p = originalPositions[i];
        pos[i * 3] = p.x + Math.sin(elapsed * 0.3 + p.seed) * 1.5;
        pos[i * 3 + 1] = p.y + Math.cos(elapsed * 0.25 + p.seed) * 1.8;
      }
      geometry.attributes.position.needsUpdate = true;
      particles.rotation.y = elapsed * 0.02;

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container || !renderer) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      if (renderer) {
        renderer.dispose();
        if (renderer.domElement && renderer.domElement.parentNode) {
          renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
      }
      geometry.dispose();
      material.dispose();
      texture.dispose();
    };
  }, [count, speed]);

  return (
    <div
      ref={mountRef}
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        opacity: 0.85
      }}
    />
  );
}
