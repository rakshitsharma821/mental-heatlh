import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function GeometricShapesCanvas() {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.z = 24;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      container.appendChild(renderer.domElement);
    } catch (e) {
      console.warn('WebGL error in GeometricShapesCanvas:', e);
      return;
    }

    const group = new THREE.Group();
    scene.add(group);

    // Shape 1: Wireframe Icosahedron
    const icoGeo = new THREE.IcosahedronGeometry(3.5, 0);
    const wireMat1 = new THREE.MeshBasicMaterial({
      color: 0x40916c, // Forest leaf green
      wireframe: true,
      transparent: true,
      opacity: 0.28
    });
    const ico = new THREE.Mesh(icoGeo, wireMat1);
    ico.position.set(-10, 6, -2);
    group.add(ico);

    // Shape 2: Wireframe Torus
    const torusGeo = new THREE.TorusGeometry(3.0, 0.8, 8, 24);
    const wireMat2 = new THREE.MeshBasicMaterial({
      color: 0xd4a373, // Warm sand
      wireframe: true,
      transparent: true,
      opacity: 0.24
    });
    const torus = new THREE.Mesh(torusGeo, wireMat2);
    torus.position.set(11, -5, -4);
    group.add(torus);

    // Shape 3: Octahedron
    const octGeo = new THREE.OctahedronGeometry(2.6, 0);
    const wireMat3 = new THREE.MeshBasicMaterial({
      color: 0x52b788, // Sage mint
      wireframe: true,
      transparent: true,
      opacity: 0.26
    });
    const oct = new THREE.Mesh(octGeo, wireMat3);
    oct.position.set(8, 7, -6);
    group.add(oct);

    let animId;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (document.hidden) return;

      const elapsed = clock.getElapsedTime();

      ico.rotation.x = elapsed * 0.08;
      ico.rotation.y = elapsed * 0.12;

      torus.rotation.x = elapsed * 0.1;
      torus.rotation.z = elapsed * 0.07;

      oct.rotation.y = elapsed * 0.09;
      oct.rotation.z = elapsed * 0.06;

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
      icoGeo.dispose();
      wireMat1.dispose();
      torusGeo.dispose();
      wireMat2.dispose();
      octGeo.dispose();
      wireMat3.dispose();
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
        opacity: 0.8
      }}
    />
  );
}
