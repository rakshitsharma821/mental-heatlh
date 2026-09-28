import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { MOOD_CONFIG } from '../../services/quotes';

export default function MoodAtmosphereCanvas({ mood = 'calm' }) {
  const mountRef = useRef(null);
  const colorRef = useRef({
    current: new THREE.Color('#52b788'),
    target: new THREE.Color('#52b788')
  });

  useEffect(() => {
    const config = MOOD_CONFIG[mood] || MOOD_CONFIG['calm'];
    colorRef.current.target = new THREE.Color(config.hex || '#6ec6e6');
  }, [mood]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    camera.position.z = 20;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      container.appendChild(renderer.domElement);
    } catch (e) {
      console.warn('WebGL error in MoodAtmosphereCanvas:', e);
      return;
    }

    const particleCount = 45;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const origins = [];

    for (let i = 0; i < particleCount; i++) {
      const x = (Math.random() - 0.5) * 40;
      const y = (Math.random() - 0.5) * 30;
      const z = (Math.random() - 0.5) * 15;
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      origins.push({ x, y, z, seed: Math.random() * 100 });
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Particle sprite
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255,255,255,0.95)');
    grad.addColorStop(0.4, 'rgba(82,183,136,0.7)');
    grad.addColorStop(1, 'rgba(82,183,136,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(16, 16, 16, 0, Math.PI * 2);
    ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.PointsMaterial({
      size: 1.2,
      map: texture,
      color: 0x52b788,
      transparent: true,
      blending: THREE.NormalBlending,
      depthWrite: false,
      opacity: 0.75
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    let animId;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (document.hidden) return;

      const elapsed = clock.getElapsedTime();

      // Smooth color morphing
      colorRef.current.current.lerp(colorRef.current.target, 0.025);
      material.color.copy(colorRef.current.current);

      const pos = geometry.attributes.position.array;
      for (let i = 0; i < particleCount; i++) {
        const o = origins[i];
        pos[i * 3] = o.x + Math.sin(elapsed * 0.4 + o.seed) * 1.6;
        pos[i * 3 + 1] = o.y + Math.cos(elapsed * 0.35 + o.seed) * 1.8;
      }
      geometry.attributes.position.needsUpdate = true;
      particles.rotation.y = elapsed * 0.03;

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
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        opacity: 0.75
      }}
    />
  );
}
