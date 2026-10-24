// ============================================
// MindCare Sanctuary — Living 3D Inner World Tree (Real Three.js Depth)
// True 3D geometry, volumetric foliage meshes, real PCF soft shadows,
// interactive mouse parallax, and multi-depth sunlit fireflies
// ============================================

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function InnerWorldCanvas({
  mode = 'hero',             // 'hero' | 'panel' | 'breathing' | 'ambient'
  growthLevel = 0.65,        // 0.15 (young sapling) to 1.0 (blooming sanctuary tree)
  breathingPhase = null,     // 'Inhale' | 'Hold' | 'Exhale' | null
  breathingDuration = 4,
  rippleTrigger = null,
  isTyping = false,
  moodColor = null
}) {
  const mountRef = useRef(null);
  const stateRef = useRef({
    growth: Math.max(0.2, Math.min(1.0, growthLevel)),
    breathingPhase,
    targetGlowScale: 1.0,
    currentGlowScale: 1.0,
    targetGlowColor: new THREE.Color('#52b788'),
    currentGlowColor: new THREE.Color('#52b788'),
    isTyping,
    rippleActive: false,
    rippleRadius: 0.2,
    rippleOpacity: 0.0,
    moodColorHex: moodColor || '#52b788'
  });

  useEffect(() => {
    const s = stateRef.current;
    s.growth = Math.max(0.2, Math.min(1.0, growthLevel));
    s.isTyping = isTyping;

    if (moodColor) {
      s.moodColorHex = moodColor;
    }

    if (breathingPhase) {
      s.breathingPhase = breathingPhase;
      if (breathingPhase === 'Inhale') {
        s.targetGlowScale = 1.45;
        s.targetGlowColor = new THREE.Color('#52b788');
      } else if (breathingPhase === 'Hold') {
        s.targetGlowScale = 1.45;
        s.targetGlowColor = new THREE.Color('#f6bd60');
      } else if (breathingPhase === 'Exhale') {
        s.targetGlowScale = 0.95;
        s.targetGlowColor = new THREE.Color('#72a1bf');
      }
    } else {
      s.targetGlowScale = 1.0;
      s.targetGlowColor = new THREE.Color(s.moodColorHex);
    }
  }, [growthLevel, breathingPhase, isTyping, moodColor]);

  useEffect(() => {
    if (rippleTrigger) {
      stateRef.current.rippleActive = true;
      stateRef.current.rippleRadius = 0.3;
      stateRef.current.rippleOpacity = 0.75;
    }
  }, [rippleTrigger]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 500;
    const height = container.clientHeight || 500;

    const scene = new THREE.Scene();

    // Perspective Camera positioned at elevated natural angle
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    const initialCamY = mode === 'hero' ? 3.6 : 3.2;
    const initialCamZ = mode === 'hero' ? 14.5 : 12.5;
    camera.position.set(0, initialCamY, initialCamZ);
    camera.lookAt(0, 2.6, 0);

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'low-power'
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));

      // Enable Real Soft Shadows
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;

      container.appendChild(renderer.domElement);
    } catch (e) {
      console.warn('WebGL initialization error:', e);
      return;
    }

    // ==========================================
    // 1. LIGHTING (Sunlight + Atmosphere + Canopy Heart)
    // ==========================================
    // Soft sky and ground bounce
    const hemiLight = new THREE.HemisphereLight(0xfdfbf7, 0xd8e2dc, 1.5);
    scene.add(hemiLight);

    // Warm Key Sunlight with real shadows
    const sunLight = new THREE.DirectionalLight(0xfff7ed, 2.2);
    sunLight.position.set(7, 14, 8);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 32;
    sunLight.shadow.camera.left = -7;
    sunLight.shadow.camera.right = 7;
    sunLight.shadow.camera.top = 7;
    sunLight.shadow.camera.bottom = -7;
    sunLight.shadow.bias = -0.0004;
    sunLight.shadow.radius = 2.5;
    scene.add(sunLight);

    // Subtle cool rim light from opposite side
    const rimLight = new THREE.DirectionalLight(0xb7e4c7, 0.8);
    rimLight.position.set(-6, 8, -6);
    scene.add(rimLight);

    // Inner Canopy Vitality Light (pulsates gently with breathing)
    const heartLight = new THREE.PointLight('#f6bd60', 1.8, 8);
    heartLight.position.set(0, 3.2, 0);
    scene.add(heartLight);

    // ==========================================
    // 2. SANCTUARY GROUND BASIN & REFLECTIVE WATER
    // ==========================================
    const worldGroup = new THREE.Group();
    scene.add(worldGroup);

    // Raised Circular Garden Island (Receives real shadows from tree)
    const islandGeo = new THREE.CylinderGeometry(5.2, 5.5, 0.35, 48);
    const islandMat = new THREE.MeshStandardMaterial({
      color: 0xf0f4ef, // Soft warm porcelain ground
      roughness: 0.85,
      metalness: 0.05
    });
    const island = new THREE.Mesh(islandGeo, islandMat);
    island.position.y = -0.175;
    island.receiveShadow = true;
    worldGroup.add(island);

    // Moss / Lawn Outer Ring
    const mossRingGeo = new THREE.RingGeometry(4.2, 5.18, 48);
    const mossRingMat = new THREE.MeshStandardMaterial({
      color: 0xd8e2dc, // Calming light sage earth
      roughness: 0.9,
      side: THREE.DoubleSide
    });
    const mossRing = new THREE.Mesh(mossRingGeo, mossRingMat);
    mossRing.rotation.x = -Math.PI / 2;
    mossRing.position.y = 0.005;
    mossRing.receiveShadow = true;
    worldGroup.add(mossRing);

    // Clear Spring Water Pond (Glossy, translucent, receives shadow)
    const waterGeo = new THREE.CircleGeometry(4.18, 48);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0xb7e4c7, // Soft clear spring teal
      roughness: 0.18,
      metalness: 0.25,
      transparent: true,
      opacity: 0.72
    });
    const waterPlane = new THREE.Mesh(waterGeo, waterMat);
    waterPlane.rotation.x = -Math.PI / 2;
    waterPlane.position.y = 0.01;
    waterPlane.receiveShadow = true;
    worldGroup.add(waterPlane);

    // Concentric Ripple on user action
    const rippleGeo = new THREE.RingGeometry(0.2, 0.35, 36);
    const rippleMat = new THREE.MeshBasicMaterial({
      color: 0x40916c,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide
    });
    const rippleMesh = new THREE.Mesh(rippleGeo, rippleMat);
    rippleMesh.rotation.x = -Math.PI / 2;
    rippleMesh.position.y = 0.02;
    worldGroup.add(rippleMesh);

    // ==========================================
    // 3. TRUE 3D PROCEDURAL TREE WITH DEPTH
    // ==========================================
    const treeGroup = new THREE.Group();
    worldGroup.add(treeGroup);

    const growth = stateRef.current.growth;

    // Bark Material
    const barkMat = new THREE.MeshStandardMaterial({
      color: 0x5a3e2b, // Natural warm timber bark
      roughness: 0.8,
      metalness: 0.08
    });

    // Root Flares (3D curved roots anchoring into the pond island)
    const rootCount = 5;
    for (let r = 0; r < rootCount; r++) {
      const angle = (r / rootCount) * Math.PI * 2;
      const rootLength = 0.9 + Math.random() * 0.4;
      const rootGeo = new THREE.CylinderGeometry(0.08, 0.22, rootLength, 8);
      const rootMesh = new THREE.Mesh(rootGeo, barkMat);
      rootMesh.castShadow = true;
      rootMesh.receiveShadow = true;

      rootMesh.position.set(
        Math.cos(angle) * 0.42,
        0.1,
        Math.sin(angle) * 0.42
      );
      rootMesh.rotation.y = angle;
      rootMesh.rotation.z = 0.65;
      treeGroup.add(rootMesh);
    }

    // Main Trunk (Tiered, tapered cylinders curving upward)
    const trunkHeight = 2.8 + growth * 1.8;
    const trunkSegments = 3;
    const trunkMeshGroup = new THREE.Group();

    for (let s = 0; s < trunkSegments; s++) {
      const segHeight = trunkHeight / trunkSegments;
      const rBot = (0.36 - s * 0.06) + growth * 0.08;
      const rTop = (0.30 - s * 0.06) + growth * 0.06;
      const segGeo = new THREE.CylinderGeometry(rTop, rBot, segHeight, 12);
      const segMesh = new THREE.Mesh(segGeo, barkMat);
      segMesh.position.y = segHeight * (s + 0.5);
      segMesh.rotation.z = (s === 1 ? 0.06 : (s === 2 ? -0.04 : 0));
      segMesh.castShadow = true;
      segMesh.receiveShadow = true;
      trunkMeshGroup.add(segMesh);
    }
    treeGroup.add(trunkMeshGroup);

    // Primary & Secondary Radial 3D Branches
    const branchCount = Math.round(5 + growth * 4);
    const branchTips = [];

    for (let b = 0; b < branchCount; b++) {
      const phi = (b / branchCount) * Math.PI * 2 + (b * 0.3);
      const yAttach = trunkHeight * 0.55 + ((b % 3) * 0.35);
      const branchLen = 1.1 + growth * 0.8;
      const branchGeo = new THREE.CylinderGeometry(0.06, 0.14, branchLen, 8);
      const branchMesh = new THREE.Mesh(branchGeo, barkMat);
      branchMesh.castShadow = true;
      branchMesh.receiveShadow = true;

      // Position branch origin
      branchMesh.position.set(0, yAttach, 0);
      branchMesh.rotation.y = phi;
      branchMesh.rotation.z = 0.75 + (b % 2) * 0.15;
      treeGroup.add(branchMesh);

      // Compute branch tip in 3D world space
      const tipX = Math.cos(phi) * Math.sin(0.75) * branchLen;
      const tipY = yAttach + Math.cos(0.75) * (branchLen * 0.5);
      const tipZ = Math.sin(phi) * Math.sin(0.75) * branchLen;
      branchTips.push({ x: tipX, y: tipY, z: tipZ, scale: 0.85 + (b % 3) * 0.2 });
    }

    // Add Top Apex Branch Tip
    branchTips.push({ x: 0, y: trunkHeight + 0.3, z: 0, scale: 1.35 });
    branchTips.push({ x: 0.35, y: trunkHeight + 0.1, z: 0.25, scale: 1.0 });
    branchTips.push({ x: -0.3, y: trunkHeight + 0.15, z: -0.2, scale: 0.95 });

    // ==========================================
    // 4. VOLUMETRIC 3D FOLIAGE NODES (Solid 3D Meshes, NOT 2D Points)
    // ==========================================
    const foliagePalette = [
      new THREE.Color('#2d6a4f'), // Evergreen
      new THREE.Color('#40916c'), // Leaf Green
      new THREE.Color('#52b788'), // Mint Sprout
      new THREE.Color('#74c69d'), // Sunlight Leaf
      new THREE.Color('#95d5b2')  // Soft Dew
    ];

    const foliageGroup = new THREE.Group();
    treeGroup.add(foliageGroup);

    branchTips.forEach((tip, idx) => {
      // Create a lush faceted cluster of 3D icosahedrons at each branch tip
      const subClusters = 3 + Math.round(growth * 3);
      for (let sc = 0; sc < subClusters; sc++) {
        const radius = (0.55 + Math.random() * 0.45) * tip.scale;
        const folGeo = new THREE.IcosahedronGeometry(radius, 1);

        // Soft, organic vertex jitter for natural foliage silhouette
        const posAttr = folGeo.attributes.position;
        for (let i = 0; i < posAttr.count; i++) {
          const vx = posAttr.getX(i);
          const vy = posAttr.getY(i);
          const vz = posAttr.getZ(i);
          const deform = 1.0 + (Math.sin(vx * 3 + idx) * 0.12);
          posAttr.setXYZ(i, vx * deform, vy * deform * 0.85, vz * deform);
        }
        folGeo.computeVertexNormals();

        const colorIndex = (idx + sc) % foliagePalette.length;
        const folMat = new THREE.MeshStandardMaterial({
          color: foliagePalette[colorIndex],
          roughness: 0.72,
          metalness: 0.08,
          flatShading: true
        });

        const folMesh = new THREE.Mesh(folGeo, folMat);
        const offsetX = (Math.random() - 0.5) * 0.7;
        const offsetY = (Math.random() - 0.5) * 0.5;
        const offsetZ = (Math.random() - 0.5) * 0.7;

        folMesh.position.set(tip.x + offsetX, tip.y + offsetY, tip.z + offsetZ);
        folMesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);

        folMesh.castShadow = true;
        folMesh.receiveShadow = true;
        foliageGroup.add(folMesh);
      }
    });

    // Gentle Breathing Glow Aura (Replaces the ugly wireframe sphere)
    const auraHaloGeo = new THREE.SphereGeometry(2.4 + growth * 1.2, 24, 24);
    const auraHaloMat = new THREE.MeshBasicMaterial({
      color: 0x52b788,
      transparent: true,
      opacity: 0.12,
      side: THREE.BackSide
    });
    const auraHaloMesh = new THREE.Mesh(auraHaloGeo, auraHaloMat);
    auraHaloMesh.position.set(0, trunkHeight * 0.75, 0);
    treeGroup.add(auraHaloMesh);

    // ==========================================
    // 5. TRUE MULTI-DEPTH 3D FIREFLIES & POLLEN
    // ==========================================
    const fireflyCount = 40;
    const fireflyGroup = new THREE.Group();
    scene.add(fireflyGroup);

    const firefliesData = [];
    const pGeo = new THREE.SphereGeometry(0.065, 8, 8);

    for (let i = 0; i < fireflyCount; i++) {
      // Disperse across wide 3D space with genuine Z depth (-5 to +7)
      const fx = (Math.random() - 0.5) * 9.5;
      const fy = 0.5 + Math.random() * 5.5;
      const fz = (Math.random() - 0.5) * 11;

      // Color shifts: warm sunlight gold, soft mint, gentle amber
      const moteColor = Math.random() > 0.4 ? 0xf6bd60 : 0x74c69d;
      const pMat = new THREE.MeshBasicMaterial({
        color: moteColor,
        transparent: true,
        opacity: 0.65 + Math.random() * 0.35
      });
      const moteMesh = new THREE.Mesh(pGeo, pMat);
      moteMesh.position.set(fx, fy, fz);

      // Vary scale based on Z to reinforce optical depth
      const depthScale = 0.8 + Math.random() * 1.2;
      moteMesh.scale.set(depthScale, depthScale, depthScale);

      fireflyGroup.add(moteMesh);

      firefliesData.push({
        mesh: moteMesh,
        baseX: fx,
        baseY: fy,
        baseZ: fz,
        speed: 0.35 + Math.random() * 0.55,
        freq: 0.8 + Math.random() * 1.5,
        phase: Math.random() * Math.PI * 2
      });
    }

    // ==========================================
    // 6. INTERACTIVE MOUSE PARALLAX & ANIMATION LOOP
    // ==========================================
    let mouse = { x: 0, y: 0 };
    let targetCamera = { x: 0, y: initialCamY };

    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;

      // Normalized coordinates (-1 to +1)
      mouse.x = (clientX / rect.width) * 2 - 1;
      mouse.y = -(clientY / rect.height) * 2 + 1;

      // Gentle camera swing bounds
      targetCamera.x = mouse.x * 2.2;
      targetCamera.y = initialCamY + (mouse.y * 1.2);
    };

    window.addEventListener('mousemove', handleMouseMove);

    let animId;
    let clock = new THREE.Clock();

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let isVisible = true;
    let isTabActive = !document.hidden;

    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
    }, { threshold: 0.05 });
    observer.observe(container);

    const handleVisibility = () => {
      isTabActive = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibility);

    const animate = () => {
      if (prefersReducedMotion) {
        renderer.render(scene, camera);
        return;
      }
      animId = requestAnimationFrame(animate);
      if (!isVisible || !isTabActive) return;
      if (document.hidden) return;

      const elapsed = clock.getElapsedTime();
      const s = stateRef.current;

      // 1. Smooth Camera Parallax Lerp
      camera.position.x += (targetCamera.x - camera.position.x) * 0.045;
      camera.position.y += (targetCamera.y - camera.position.y) * 0.045;
      camera.lookAt(0, 2.5, 0);

      // 2. Meditative slow tree rotation
      worldGroup.rotation.y = elapsed * 0.04;

      // 3. Water Ripple Animation
      if (s.rippleActive) {
        s.rippleRadius += 0.055;
        s.rippleOpacity -= 0.014;
        rippleMesh.scale.set(s.rippleRadius, s.rippleRadius, 1);
        rippleMat.opacity = Math.max(0, s.rippleOpacity);
        if (s.rippleOpacity <= 0) {
          s.rippleActive = false;
        }
      }

      // 4. Breathing Canopy Aura Lerp
      s.currentGlowScale += (s.targetGlowScale - s.currentGlowScale) * 0.035;
      auraHaloMesh.scale.set(s.currentGlowScale, s.currentGlowScale, s.currentGlowScale);

      s.currentGlowColor.lerp(s.targetGlowColor, 0.03);
      auraHaloMat.color.copy(s.currentGlowColor);
      heartLight.color.copy(s.currentGlowColor);

      // 5. Subtle Foliage Swaying in Mountain Breeze
      foliageGroup.rotation.z = Math.sin(elapsed * 0.6) * 0.02;
      foliageGroup.rotation.x = Math.cos(elapsed * 0.5) * 0.015;

      // 6. Multi-Depth Fireflies Helical Drift
      const speedMultiplier = s.isTyping ? 1.8 : 0.8;
      firefliesData.forEach((fd) => {
        fd.mesh.position.x = fd.baseX + Math.sin(elapsed * fd.speed * speedMultiplier + fd.phase) * 0.85;
        fd.mesh.position.y = fd.baseY + Math.cos(elapsed * 0.5 * fd.speed + fd.phase) * 0.55;
        fd.mesh.position.z = fd.baseZ + Math.sin(elapsed * 0.3 * fd.speed + fd.phase) * 0.65;

        // Subtle twinkling opacity
        fd.mesh.material.opacity = 0.5 + Math.sin(elapsed * fd.freq + fd.phase) * 0.45;
      });

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container || !renderer) return;
      const w = container.clientWidth || 500;
      const h = container.clientHeight || 500;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      observer.disconnect();
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (renderer) {
        renderer.dispose();
        if (renderer.domElement && renderer.domElement.parentNode) {
          renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
      }
      islandGeo.dispose();
      islandMat.dispose();
      waterGeo.dispose();
      waterMat.dispose();
      mossRingGeo.dispose();
      mossRingMat.dispose();
      barkMat.dispose();
      auraHaloGeo.dispose();
      auraHaloMat.dispose();
      pGeo.dispose();
    };
  }, [mode]);

  return (
    <div
      ref={mountRef}
      style={{
        width: '100%',
        height: '100%',
        minHeight: '440px',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'grab'
      }}
      title="Interactive 3D Sanctuary Tree — Move cursor to explore angle"
    />
  );
}
