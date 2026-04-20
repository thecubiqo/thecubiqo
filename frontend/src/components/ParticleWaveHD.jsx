"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

function makeGlowSprite() {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.1, "rgba(255,255,255,0.8)");
  gradient.addColorStop(0.3, "rgba(255,255,255,0.2)");
  gradient.addColorStop(0.6, "rgba(255,255,255,0.05)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function smoothstep(edge0, edge1, x) {
  const t = THREE.MathUtils.clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function phaseWindow(t, start, end, feather = 0.8) {
  return smoothstep(start - feather, start + feather, t) * (1 - smoothstep(end - feather, end + feather, t));
}

function createWaveField({
  side,
  lines,
  segments,
  width,
  spread,
  amplitude,
  inset,
  colorA,
  colorB,
  coreColor,
}) {
  const count = lines * segments;
  const positions = new Float32Array(count * 3);
  const basePositions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  const mixed = new THREE.Color();
  const blended = new THREE.Color();

  let ptr = 0;
  for (let l = 0; l < lines; l++) {
    const lineNorm = l / Math.max(lines - 1, 1);
    const verticalBias = (lineNorm - 0.5) * spread;

    for (let s = 0; s < segments; s++) {
      const segNorm = s / Math.max(segments - 1, 1);
      const towardCenter = 1 - segNorm;
      const xSpan = segNorm * width;
      const x = side === -1 ? -xSpan - inset : xSpan + inset;
      const y = verticalBias * Math.pow(towardCenter, 0.72) + Math.sin(segNorm * Math.PI * 2 + l * 0.24) * amplitude * (0.22 + towardCenter * 0.88);
      const z = Math.cos(segNorm * Math.PI * 3 + l * 0.19) * (0.04 + towardCenter * 0.28) + (lineNorm - 0.5) * 0.08;

      positions[ptr] = x;
      positions[ptr + 1] = y;
      positions[ptr + 2] = z;
      basePositions[ptr] = x;
      basePositions[ptr + 1] = y;
      basePositions[ptr + 2] = z;

      mixed.copy(colorA).lerp(colorB, lineNorm);
      blended.copy(mixed).lerp(coreColor, Math.pow(towardCenter, 1.5) * 0.9);
      colors[ptr] = blended.r;
      colors[ptr + 1] = blended.g;
      colors[ptr + 2] = blended.b;
      seeds[ptr / 3] = Math.random() * 1000;
      ptr += 3;
    }
  }

  return { positions, basePositions, colors, seeds };
}

export default function ParticleWaveHD({ isVoiceMode, audioLevel = 0 }) {
  const mountRef = useRef(null);
  const voiceModeRef = useRef(isVoiceMode || false);
  const audioLevelRef = useRef(audioLevel);

  useEffect(() => {
    voiceModeRef.current = isVoiceMode;
  }, [isVoiceMode]);

  useEffect(() => {
    audioLevelRef.current = audioLevel;
  }, [audioLevel]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = null; // Removed hardcoded background for app integration
    scene.fog = new THREE.FogExp2("#111114", 0.024);

    const camera = new THREE.PerspectiveCamera(34, mount.clientWidth / mount.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 11.8);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); // Made alpha true
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.5;
    mount.appendChild(renderer.domElement);

    const glowMap = makeGlowSprite();

    scene.add(new THREE.AmbientLight("#ffffff", 0.18));
    const leftLight = new THREE.PointLight("#37b8ff", 12, 22);
    leftLight.position.set(-6.8, 1.2, 4.8);
    scene.add(leftLight);
    const coreLight = new THREE.PointLight("#8e82ff", 8, 18);
    coreLight.position.set(0, 0, 3.8);
    scene.add(coreLight);
    const rightLight = new THREE.PointLight("#ff9360", 12, 22);
    rightLight.position.set(6.8, 1.2, 4.8);
    scene.add(rightLight);

    const leftA = new THREE.Color("#34b6ff");
    const leftB = new THREE.Color("#73ebff");
    const rightA = new THREE.Color("#ff9a50");
    const rightB = new THREE.Color("#ff6da9");
    const purple = new THREE.Color("#8c85ff");

    const waveSystems = [];
    const filamentSystems = [];

    function addWaveSystem(config) {
      const paletteA = config.side === -1 ? leftA : rightA;
      const paletteB = config.side === -1 ? leftB : rightB;
      const data = createWaveField({ ...config, colorA: paletteA, colorB: paletteB, coreColor: purple });

      const pointsGeometry = new THREE.BufferGeometry();
      pointsGeometry.setAttribute("position", new THREE.BufferAttribute(data.positions, 3));
      pointsGeometry.setAttribute("color", new THREE.BufferAttribute(data.colors, 3));

      const pointsMaterial = new THREE.PointsMaterial({
        size: config.size,
        map: glowMap || null,
        alphaMap: glowMap || null,
        transparent: true,
        opacity: config.opacity,
        depthWrite: false,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
      });

      const points = new THREE.Points(pointsGeometry, pointsMaterial);
      scene.add(points);
      waveSystems.push({ ...config, ...data, geometry: pointsGeometry, material: pointsMaterial, points });

      const lineGroup = new THREE.Group();
      const lineColor = new THREE.Color().copy(paletteA).lerp(paletteB, 0.38).lerp(purple, 0.1);
      const lines = [];
      for (let l = 0; l < config.lines; l++) {
        const pos = new Float32Array(config.segments * 3);
        const g = new THREE.BufferGeometry();
        g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
        const m = new THREE.LineBasicMaterial({
          color: lineColor,
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        const line = new THREE.Line(g, m);
        lineGroup.add(line);
        lines.push({ geometry: g, material: m, line });
      }
      scene.add(lineGroup);
      filamentSystems.push({ config, lineGroup, lines });
    }

    addWaveSystem({ side: -1, lines: 36, segments: 140, width: 7.25, spread: 3.0, amplitude: 0.68, inset: 0.22, size: 0.058, opacity: 0.64 });
    addWaveSystem({ side: 1, lines: 36, segments: 140, width: 7.25, spread: 3.0, amplitude: 0.68, inset: 0.22, size: 0.058, opacity: 0.64 });
    addWaveSystem({ side: -1, lines: 16, segments: 116, width: 6.5, spread: 1.75, amplitude: 0.42, inset: 0.05, size: 0.08, opacity: 0.72 });
    addWaveSystem({ side: 1, lines: 16, segments: 116, width: 6.5, spread: 1.75, amplitude: 0.42, inset: 0.05, size: 0.08, opacity: 0.72 });

    const particleCount = 20000;
    const particlePositions = new Float32Array(particleCount * 3);
    const particleBase = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);
    const particleSeeds = new Float32Array(particleCount);
    const temp = new THREE.Color();

    for (let i = 0; i < particleCount; i++) {
      const idx = i * 3;
      const side = i % 2 === 0 ? -1 : 1;
      const x = side * THREE.MathUtils.randFloat(0.2, 9.5);
      const y = THREE.MathUtils.randFloatSpread(3.2);
      const z = THREE.MathUtils.randFloatSpread(2.0);
      particlePositions[idx] = x;
      particlePositions[idx + 1] = y;
      particlePositions[idx + 2] = z;
      particleBase[idx] = x;
      particleBase[idx + 1] = y;
      particleBase[idx + 2] = z;
      temp.copy(side === -1 ? leftA : rightA).lerp(side === -1 ? purple : rightB, THREE.MathUtils.clamp(1 - Math.abs(x) / 9.5, 0, 1));
      const lift = THREE.MathUtils.randFloat(0.4, 1.1);
      particleColors[idx] = temp.r * lift;
      particleColors[idx + 1] = temp.g * lift;
      particleColors[idx + 2] = temp.b * lift;
      particleSeeds[i] = Math.random() * 1000;
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    particleGeometry.setAttribute("color", new THREE.BufferAttribute(particleColors, 3));
    const particleMaterial = new THREE.PointsMaterial({
      size: 0.024,
      map: glowMap || null,
      alphaMap: glowMap || null,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });
    const particleCloud = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particleCloud);

    // Voice cuboid: plasma, not floating giant wireframe.
    const cuboidGroup = new THREE.Group();
    scene.add(cuboidGroup);

    const shellEdges = [];
    [2.15, 1.82].forEach((size, i) => {
      const geo = new THREE.EdgesGeometry(new THREE.BoxGeometry(size, size, size));
      const mat = new THREE.LineBasicMaterial({
        color: i === 0 ? "#8f84ff" : "#b79fff",
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const lines = new THREE.LineSegments(geo, mat);
      cuboidGroup.add(lines);
      shellEdges.push({ lines, geometry: geo, material: mat, scale: i === 0 ? 1 : 0.86 });
    });

    const shellParticlesCount = 1800;
    const shellPositions = new Float32Array(shellParticlesCount * 3);
    const shellColors = new Float32Array(shellParticlesCount * 3);
    const shellSeeds = new Float32Array(shellParticlesCount);
    const shellColor = new THREE.Color("#a791ff");
    for (let i = 0; i < shellParticlesCount; i++) {
      const idx = i * 3;
      const face = Math.floor(Math.random() * 6);
      const u = THREE.MathUtils.randFloatSpread(2.0);
      const v = THREE.MathUtils.randFloatSpread(2.0);
      const half = 1.08;
      let x = 0, y = 0, z = 0;
      if (face === 0) { x = half; y = u; z = v; }
      if (face === 1) { x = -half; y = u; z = v; }
      if (face === 2) { x = u; y = half; z = v; }
      if (face === 3) { x = u; y = -half; z = v; }
      if (face === 4) { x = u; y = v; z = half; }
      if (face === 5) { x = u; y = v; z = -half; }
      shellPositions[idx] = x;
      shellPositions[idx + 1] = y;
      shellPositions[idx + 2] = z;
      shellColors[idx] = shellColor.r;
      shellColors[idx + 1] = shellColor.g;
      shellColors[idx + 2] = shellColor.b;
      shellSeeds[i] = Math.random() * 1000;
    }
    const shellParticleGeometry = new THREE.BufferGeometry();
    shellParticleGeometry.setAttribute("position", new THREE.BufferAttribute(shellPositions, 3));
    shellParticleGeometry.setAttribute("color", new THREE.BufferAttribute(shellColors, 3));
    const shellParticleMaterial = new THREE.PointsMaterial({
      size: 0.032,
      map: glowMap || null,
      alphaMap: glowMap || null,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });
    const shellParticles = new THREE.Points(shellParticleGeometry, shellParticleMaterial);
    cuboidGroup.add(shellParticles);

    const voiceSignalGroup = new THREE.Group();
    cuboidGroup.add(voiceSignalGroup);
    const signalBars = [];
    const ruby = new THREE.Color("#b83b4f");
    const teal = new THREE.Color("#45c9c8");
    const paleYellow = new THREE.Color("#d8cf95");
    const mix = new THREE.Color();
    const signalBarCount = 72;
    for (let i = 0; i < signalBarCount; i++) {
      const xNorm = i / (signalBarCount - 1);
      const x = (xNorm - 0.5) * 3.25;
      if (xNorm < 0.34) mix.copy(ruby).lerp(paleYellow, xNorm / 0.34);
      else if (xNorm < 0.68) mix.copy(paleYellow).lerp(teal, (xNorm - 0.34) / 0.34);
      else mix.copy(teal).lerp(ruby, (xNorm - 0.68) / 0.32);
      const geo = new THREE.PlaneGeometry(0.028, 0.2);
      const mat = new THREE.MeshBasicMaterial({
        color: mix,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const bar = new THREE.Mesh(geo, mat);
      bar.position.x = x;
      voiceSignalGroup.add(bar);
      signalBars.push({ mesh: bar, geometry: geo, material: mat, xNorm, phase: Math.random() * Math.PI * 2 });
    }

    const clock = new THREE.Clock();
    let frameId = 0;
    
    // Smooth transition tracking
    let currentMorph = voiceModeRef.current ? 1 : 0;

    const animate = () => {
      const t = clock.getElapsedTime();
      
      // Interpolate towards target state
      const targetMorph = voiceModeRef.current ? 1 : 0;
      currentMorph += (targetMorph - currentMorph) * 0.05;

      const ambientVisibility = 1 - currentMorph;
      const unifiedWave = currentMorph * 0.7; // Partially unify waves when voice starts
      const separation = 0;
      const voiceMorph = currentMorph;
      const plasmaMode = currentMorph * 0.35; // keep some plasma feel
      const filamentMode = 0.5 * (1 - currentMorph);
      const ribbonMode = 0.5 * (1 - currentMorph);
      const beamMode = 0.2 * (1 - currentMorph);
      const particleMode = 0.3;

      waveSystems.forEach((sys, sysIndex) => {
        const arr = sys.geometry.attributes.position.array;
        const lineCenter = (sys.lines - 1) * 0.5;

        for (let i = 0; i < sys.seeds.length; i++) {
          const idx = i * 3;
          const pointIndex = i % sys.segments;
          const lineIndex = Math.floor(i / sys.segments);
          const lineT = lineIndex / Math.max(sys.lines - 1, 1);
          const segT = pointIndex / Math.max(sys.segments - 1, 1);
          const towardCenter = 1 - segT;
          const seed = sys.seeds[i];
          const bx = sys.basePositions[idx];
          const by = sys.basePositions[idx + 1];
          const bz = sys.basePositions[idx + 2];

          const waveA = Math.sin(segT * 8.0 - t * 0.9 + lineIndex * 0.14 + seed * 0.0008);
          const waveB = Math.cos(segT * 12.0 + t * 0.72 - lineIndex * 0.11 + seed * 0.0009);
          const filament = (waveA * 0.5 + waveB * 0.32) * (0.08 + towardCenter * 0.18 + filamentMode * 0.08 + ribbonMode * 0.04);

          const mergedX = sys.side * (0.03 + Math.abs(bx) * 0.16);
          const splitX = bx;
          const baseAmbientX = THREE.MathUtils.lerp(mergedX, splitX, separation);
          const cuboidX = sys.side * (0.18 + lineT * 0.86);
          const baseX = THREE.MathUtils.lerp(baseAmbientX, cuboidX, voiceMorph * (0.3 + towardCenter * 0.7));

          const mergedY = by * 0.22;
          const splitY = by;
          const baseAmbientY = THREE.MathUtils.lerp(mergedY, splitY, separation);
          const cuboidY = (lineT - 0.5) * 1.7 + Math.sin(segT * Math.PI * 2 + lineIndex * 0.08) * 0.045;
          const baseY = THREE.MathUtils.lerp(baseAmbientY, cuboidY, voiceMorph * 0.9);

          const mergedZ = bz * 0.55;
          const splitZ = bz;
          const baseAmbientZ = THREE.MathUtils.lerp(mergedZ, splitZ, separation);
          const cuboidZ = Math.sin(segT * Math.PI * 2 + lineT * 2.2 + seed * 0.0006) * 0.34;
          const baseZ = THREE.MathUtils.lerp(baseAmbientZ, cuboidZ, voiceMorph * 0.88);

          const ribbonLift = Math.sin(segT * Math.PI + t * 0.35 + sysIndex * 0.3) * ribbonMode * 0.16;
          const beamTighten = beamMode * (1 - lineT) * 0.18;
          arr[idx] = baseX + Math.sin(t * 0.55 + lineT * 4.0) * 0.03 * towardCenter - sys.side * unifiedWave * towardCenter * 0.16;
          arr[idx + 1] = baseY + filament + ribbonLift;
          arr[idx + 2] = baseZ + Math.cos(segT * 10.0 - t * 0.65 + seed * 0.0007) * (0.03 + towardCenter * 0.08) - beamTighten;
        }

        sys.geometry.attributes.position.needsUpdate = true;
        sys.points.rotation.z = Math.sin(t * 0.04 + sysIndex * 0.2) * 0.005;
        sys.points.rotation.x = Math.cos(t * 0.035 + sysIndex * 0.15) * 0.007;
        sys.points.rotation.y = Math.sin(t * 0.03 + sysIndex * 0.2) * 0.012;

        const opacityBase = sysIndex < 2 ? 0.44 : 0.54;
        sys.material.opacity = ambientVisibility * opacityBase + (voiceMorph * 0.1);
      });

      filamentSystems.forEach((net, netIndex) => {
        net.lines.forEach((entry, lineIndex) => {
          const pos = entry.geometry.attributes.position.array;
          const sourceArray = waveSystems[netIndex].geometry.attributes.position.array;
          for (let s = 0; s < net.config.segments; s++) {
            const src = (lineIndex * net.config.segments + s) * 3;
            const dst = s * 3;
            pos[dst] = sourceArray[src];
            pos[dst + 1] = sourceArray[src + 1];
            pos[dst + 2] = sourceArray[src + 2];
          }
          entry.geometry.attributes.position.needsUpdate = true;
          entry.material.opacity = ambientVisibility * (filamentMode * 0.16 + ribbonMode * 0.08 + beamMode * 0.04);
        });
        net.lineGroup.rotation.z = Math.sin(t * 0.04 + netIndex * 0.2) * 0.005;
        net.lineGroup.rotation.x = Math.cos(t * 0.035 + netIndex * 0.15) * 0.007;
        net.lineGroup.rotation.y = Math.sin(t * 0.03 + netIndex * 0.2) * 0.012;
      });

      const particleArray = particleGeometry.attributes.position.array;
      for (let i = 0; i < particleSeeds.length; i++) {
        const idx = i * 3;
        const bx = particleBase[idx];
        const by = particleBase[idx + 1];
        const bz = particleBase[idx + 2];
        const seed = particleSeeds[i];
        const side = bx < 0 ? -1 : 1;
        const inward = THREE.MathUtils.clamp(1 - Math.abs(bx) / 9.5, 0, 1);

        const mergedPX = side * (0.04 + Math.abs(bx) * 0.2);
        const splitPX = bx;
        const ambientPX = THREE.MathUtils.lerp(mergedPX, splitPX, separation);
        const cuboidPX = side * (0.12 + inward * 0.92);
        const px = THREE.MathUtils.lerp(ambientPX, cuboidPX, voiceMorph * 0.9);

        const ambientPY = THREE.MathUtils.lerp(by * 0.22, by, separation);
        const py = THREE.MathUtils.lerp(ambientPY, Math.sin(seed * 0.004 + t * 0.8) * 0.9, voiceMorph * 0.88);
        const ambientPZ = THREE.MathUtils.lerp(bz * 0.5, bz, separation);
        const pz = THREE.MathUtils.lerp(ambientPZ, Math.cos(seed * 0.005 + t * 0.62) * 0.88, voiceMorph * 0.84);

        particleArray[idx] = px + side * Math.sin(t * 0.42 + seed * 0.002) * (0.02 + particleMode * 0.07);
        particleArray[idx + 1] = py + Math.cos(t * 0.74 + seed * 0.008) * (0.02 + particleMode * 0.12);
        particleArray[idx + 2] = pz + Math.sin(t * 0.85 + seed * 0.01) * (0.03 + particleMode * 0.08);
      }
      particleGeometry.attributes.position.needsUpdate = true;
      particleMaterial.opacity = ambientVisibility * (0.22 + particleMode * 0.4 + beamMode * 0.08) + voiceMorph * 0.16;
      particleCloud.rotation.y = t * 0.014;
      particleCloud.rotation.x = Math.sin(t * 0.05) * 0.01;

      // Cuboid shell + internal plasma particles.
      shellEdges.forEach((shell, i) => {
        shell.lines.rotation.x = Math.sin(t * 0.06 + i * 0.4) * 0.03 * voiceMorph;
        shell.lines.rotation.y = Math.cos(t * 0.05 + i * 0.5) * 0.045 * voiceMorph;
        shell.lines.rotation.z = Math.sin(t * 0.04 + i * 0.2) * 0.02 * voiceMorph;
        shell.lines.scale.setScalar(shell.scale + plasmaMode * 0.01);
        shell.material.opacity = voiceMorph * (i === 0 ? 0.22 : 0.12);
      });

      const shellPos = shellParticleGeometry.attributes.position.array;
      for (let i = 0; i < shellSeeds.length; i++) {
        const idx = i * 3;
        const seed = shellSeeds[i];
        shellPos[idx] += Math.sin(t * 0.5 + seed * 0.002) * 0.0012;
        shellPos[idx + 1] += Math.cos(t * 0.46 + seed * 0.0023) * 0.0012;
        shellPos[idx + 2] += Math.sin(t * 0.42 + seed * 0.0021) * 0.0012;
      }
      shellParticleGeometry.attributes.position.needsUpdate = true;
      shellParticleMaterial.opacity = voiceMorph * 0.26;

      cuboidGroup.rotation.y = Math.sin(t * 0.045) * 0.06 * voiceMorph;
      cuboidGroup.rotation.x = Math.cos(t * 0.038) * 0.025 * voiceMorph;

      // Visible tri-color ECG/audio signal through cuboid.
      const realAudio = audioLevelRef.current;
      const speakingPulse = 0.35 + (Math.pow((Math.sin(t * 2.4) + 1) * 0.5, 1.5) * 0.65) * (1 + realAudio * 3.0);
      signalBars.forEach((bar, i) => {
        const envelope = Math.exp(-Math.pow((bar.xNorm - 0.5) / 0.38, 2));
        const wave = Math.sin(i * 0.34 - t * 5.8 + bar.phase) * 0.65 + Math.sin(i * 0.17 + t * 2.8) * 0.35;
        const heartbeat = Math.exp(-Math.pow(((((t * 1.35 + bar.xNorm * 0.95) % 1) - 0.17) / 0.05), 2)) * (1.35 + realAudio * 2.0);
        const amp = (0.16 + envelope * 0.34) * speakingPulse + heartbeat * 0.48;
        bar.mesh.scale.y = 0.42 + Math.abs(wave) * amp * (4.8 + realAudio * 5.0);
        bar.mesh.position.y = Math.sin(i * 0.08 + t * 1.15) * 0.014;
        bar.mesh.position.z = Math.sin(i * 0.05 + t * 0.9) * 0.01;
        bar.material.opacity = voiceMorph * (0.28 + envelope * 0.46);
      });

      coreLight.intensity = 8 + unifiedWave * 3 + particleMode * 2 + voiceMorph * 9;
      camera.position.x = Math.sin(t * 0.022) * 0.01;
      camera.position.y = Math.cos(t * 0.018) * 0.008;
      camera.position.z = 11.8 - voiceMorph * 0.28;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
      frameId = window.requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      const width = mount.clientWidth;
      const height = mount.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.cancelAnimationFrame(frameId);

      waveSystems.forEach((sys) => {
        sys.geometry.dispose();
        sys.material.dispose();
      });
      filamentSystems.forEach((net) => {
        net.lines.forEach((entry) => {
          entry.geometry.dispose();
          entry.material.dispose();
        });
      });
      particleGeometry.dispose();
      particleMaterial.dispose();
      shellEdges.forEach((shell) => {
        shell.geometry.dispose();
        shell.material.dispose();
      });
      shellParticleGeometry.dispose();
      shellParticleMaterial.dispose();
      signalBars.forEach((bar) => {
        bar.geometry.dispose();
        bar.material.dispose();
      });
      glowMap?.dispose();
      renderer.dispose();

      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} style={{ width: '100%', height: '100%' }} />;
}
