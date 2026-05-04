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
  gradient.addColorStop(0, "rgba(255,255,255,1.0)");
  gradient.addColorStop(0.25, "rgba(255,255,255,0.4)");
  gradient.addColorStop(0.55, "rgba(255,255,255,0.08)");
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

function computeStreamPoint({
  side,
  u,
  lineT,
  offset,
  amp,
  freq,
  phase,
  time,
  xMax,
  centerGap,
  depth,
}) {
  const x = side * (xMax - u * (xMax - centerGap));
  const convergence = 0.9 - Math.pow(u, 1.25) * 0.42;
  const braid = Math.sin(u * freq + phase + time * 0.72) * amp;
  const counter = Math.sin(u * freq * 0.48 - phase * 0.7 - time * 0.42) * amp * 0.42;
  const y = offset * convergence + braid + counter;
  const z = Math.cos(u * freq * 0.7 + phase + time * 0.48) * depth + (lineT - 0.5) * depth * 0.72;
  return [x, y, z];
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
  const laneOffsets = new Float32Array(count);
  const mixed = new THREE.Color();
  const blended = new THREE.Color();

  let ptr = 0;
  for (let l = 0; l < lines; l++) {
    const lineNorm = l / Math.max(lines - 1, 1);
    const verticalBias = (lineNorm - 0.5) * spread;
    const laneSign = l % 2 === 0 ? 1 : -1;

    for (let s = 0; s < segments; s++) {
      const segNorm = s / Math.max(segments - 1, 1);
      const towardCenter = 1 - segNorm;
      const xSpan = segNorm * width;
      const x = side === -1 ? -xSpan - inset : xSpan + inset;
      // Boxy plasma shape: spread stays ~45% even at outer tip (not tapered to zero)
      const boxFactor = 0.45 + Math.pow(towardCenter, 0.38) * 0.55;
      const cellularNoise = (Math.random() - 0.5) * amplitude * 0.22 * (0.45 + towardCenter);
      const y = verticalBias * boxFactor + Math.sin(segNorm * Math.PI * 2 + l * 0.24) * amplitude * (0.35 + towardCenter * 0.65) + cellularNoise;
      const z = Math.cos(segNorm * Math.PI * 3 + l * 0.19) * (0.06 + towardCenter * 0.38) + (lineNorm - 0.5) * 0.14 + (Math.random() - 0.5) * 0.08;

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
      laneOffsets[ptr / 3] = laneSign * (0.55 + Math.random() * 0.55);
      ptr += 3;
    }
  }

  return { positions, basePositions, colors, seeds, laneOffsets };
}

export default function ParticleWaveHD({ isVoiceMode, audioLevel = 0, presentation = "app" }) {
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

    const isLanding = presentation === "landing";
    const layout = isLanding
      ? {
          cameraZ: 11.0,
          primaryLines: 88,
          primarySegments: 138,
          primaryWidth: 5.35,
          primarySpread: 2.2,
          primaryAmplitude: 0.46,
          primaryInset: 0.1,
          primarySize: 0.046,
          primaryOpacity: 0.48,
          secondaryLines: 52,
          secondarySegments: 112,
          secondaryWidth: 4.8,
          secondarySpread: 1.62,
          secondaryAmplitude: 0.36,
          secondaryInset: 0.2,
          secondarySize: 0.064,
          secondaryOpacity: 0.56,
          particleCount: 32000,
          particleXMax: 5.65,
          particleYSpread: 2.9,
          particleZSpread: 1.28,
        }
      : {
          cameraZ: 11.8,
          primaryLines: 76,
          primarySegments: 118,
          primaryWidth: 2.9,
          primarySpread: 2.18,
          primaryAmplitude: 0.44,
          primaryInset: 0.06,
          primarySize: 0.052,
          primaryOpacity: 0.56,
          secondaryLines: 46,
          secondarySegments: 96,
          secondaryWidth: 2.25,
          secondarySpread: 1.52,
          secondaryAmplitude: 0.34,
          secondaryInset: 0.08,
          secondarySize: 0.064,
          secondaryOpacity: 0.48,
          particleCount: 12500,
          particleXMax: 3.08,
          particleYSpread: 2.24,
          particleZSpread: 1.04,
        };
    const useReferencePlume = isLanding || presentation === "app";

    const scene = new THREE.Scene();
    scene.background = null; // Removed hardcoded background for app integration
    // No fog — fog was creating invisible black patches across the particle field

    const camera = new THREE.PerspectiveCamera(34, mount.clientWidth / mount.clientHeight, 0.1, 100);
    camera.position.set(0, 0, layout.cameraZ);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); // Made alpha true
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = isLanding ? 1.85 : 1.36;
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

    const leftA = new THREE.Color("#28cfff");
    const leftB = new THREE.Color("#8ff7ff");
    const rightA = new THREE.Color("#ff9f55");
    const rightB = new THREE.Color("#ff5f9f");
    const purple = new THREE.Color("#9384ff");
    const livingGreen = new THREE.Color("#63f3b7");
    const signalGold = new THREE.Color("#f2cf74");

    const waveSystems = [];
    const filamentSystems = [];
    const streamSystems = [];

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
      points.renderOrder = 4;
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
        line.renderOrder = 3;
        lineGroup.add(line);
        lines.push({ geometry: g, material: m, line });
      }
      scene.add(lineGroup);
      filamentSystems.push({ config, lineGroup, lines });
    }

    addWaveSystem({
      side: -1,
      lines: layout.primaryLines,
      segments: layout.primarySegments,
      width: layout.primaryWidth,
      spread: layout.primarySpread,
      amplitude: layout.primaryAmplitude,
      inset: layout.primaryInset,
      size: layout.primarySize,
      opacity: layout.primaryOpacity,
    });
    addWaveSystem({
      side: 1,
      lines: layout.primaryLines,
      segments: layout.primarySegments,
      width: layout.primaryWidth,
      spread: layout.primarySpread,
      amplitude: layout.primaryAmplitude,
      inset: layout.primaryInset,
      size: layout.primarySize,
      opacity: layout.primaryOpacity,
    });
    addWaveSystem({
      side: -1,
      lines: layout.secondaryLines,
      segments: layout.secondarySegments,
      width: layout.secondaryWidth,
      spread: layout.secondarySpread,
      amplitude: layout.secondaryAmplitude,
      inset: layout.secondaryInset,
      size: layout.secondarySize,
      opacity: layout.secondaryOpacity,
    });
    addWaveSystem({
      side: 1,
      lines: layout.secondaryLines,
      segments: layout.secondarySegments,
      width: layout.secondaryWidth,
      spread: layout.secondarySpread,
      amplitude: layout.secondaryAmplitude,
      inset: layout.secondaryInset,
      size: layout.secondarySize,
      opacity: layout.secondaryOpacity,
    });

    function addNodeStreamSystem(side) {
      const lineCount = isLanding ? 38 : 32;
      const segments = isLanding ? 128 : 112;
      const xMax = isLanding ? 5.3 : 3.34;
      const centerGap = isLanding ? 0.34 : 0.2;
      const streamColor = side === -1 ? leftA : rightB;
      const streamAccent = side === -1 ? leftB : purple;
      const group = new THREE.Group();
      const lines = [];

      for (let l = 0; l < lineCount; l++) {
        const lineT = l / Math.max(lineCount - 1, 1);
        const offset = (lineT - 0.5) * (isLanding ? 1.32 : 1.18);
        const amp = (isLanding ? 0.16 : 0.13) + Math.sin(lineT * Math.PI) * (isLanding ? 0.14 : 0.1);
        const freq = THREE.MathUtils.lerp(7.4, 11.8, (l % 7) / 6);
        const phase = Math.random() * Math.PI * 2;
        const depth = THREE.MathUtils.lerp(0.07, isLanding ? 0.2 : 0.16, lineT);
        const positions = new Float32Array(segments * 3);
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        const color = new THREE.Color().copy(streamColor).lerp(streamAccent, lineT * 0.55);
        const material = new THREE.LineBasicMaterial({
          color,
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        const line = new THREE.Line(geometry, material);
        line.renderOrder = 6;
        group.add(line);
        lines.push({ geometry, material, line, lineT, offset, amp, freq, phase, depth });
      }

      const nodeCount = lineCount * (isLanding ? 8 : 7);
      const nodePositions = new Float32Array(nodeCount * 3);
      const nodeColors = new Float32Array(nodeCount * 3);
      const nodeSeeds = [];
      const color = new THREE.Color();
      for (let i = 0; i < nodeCount; i++) {
        const lineIndex = i % lineCount;
        const lineT = lineIndex / Math.max(lineCount - 1, 1);
        color.copy(streamColor).lerp(new THREE.Color("#ffffff"), 0.54 + Math.sin(lineT * Math.PI) * 0.24);
        nodeColors[i * 3] = color.r;
        nodeColors[i * 3 + 1] = color.g;
        nodeColors[i * 3 + 2] = color.b;
        nodeSeeds.push({
          lineIndex,
          u: THREE.MathUtils.randFloat(0.08, 0.94),
          speed: THREE.MathUtils.randFloat(0.018, 0.038),
          phase: Math.random() * Math.PI * 2,
        });
      }
      const nodeGeometry = new THREE.BufferGeometry();
      nodeGeometry.setAttribute("position", new THREE.BufferAttribute(nodePositions, 3));
      nodeGeometry.setAttribute("color", new THREE.BufferAttribute(nodeColors, 3));
      const nodeMaterial = new THREE.PointsMaterial({
        size: isLanding ? 4.2 : 4.8,
        map: glowMap || null,
        alphaMap: glowMap || null,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        depthTest: false,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: false,
      });
      const nodes = new THREE.Points(nodeGeometry, nodeMaterial);
      nodes.renderOrder = 8;
      group.add(nodes);

      scene.add(group);
      streamSystems.push({
        side,
        group,
        lines,
        lineCount,
        segments,
        xMax,
        centerGap,
        nodeGeometry,
        nodeMaterial,
        nodeSeeds,
        nodes,
      });
    }

    addNodeStreamSystem(-1);
    addNodeStreamSystem(1);

    const particleCount = layout.particleCount;
    const particlePositions = new Float32Array(particleCount * 3);
    const particleBase = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);
    const particleSeeds = new Float32Array(particleCount);
    const particleLanes = new Float32Array(particleCount);
    const temp = new THREE.Color();

    for (let i = 0; i < particleCount; i++) {
      const idx = i * 3;
      const side = i % 2 === 0 ? -1 : 1;
      const xNorm = useReferencePlume ? Math.random() : Math.pow(Math.random(), 0.58);
      const xMag = THREE.MathUtils.lerp(useReferencePlume ? 0 : 0.08, layout.particleXMax, xNorm);
      const envelope = useReferencePlume
        ? 0.11 + Math.pow(1 - xNorm, 0.7) * 1.05
        : 0.36 + Math.pow(1 - xMag / layout.particleXMax, 0.48) * 0.9;
      const outlier = useReferencePlume && Math.random() < 0.1 ? (isLanding ? 1.75 : 1.45) : 1;
      const gaussian = (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
      const x = side * xMag;
      const y = useReferencePlume
        ? gaussian * layout.particleYSpread * envelope * outlier
        : THREE.MathUtils.randFloatSpread(layout.particleYSpread * envelope);
      const z = useReferencePlume
        ? THREE.MathUtils.randFloatSpread(layout.particleZSpread * envelope) + Math.sin(xNorm * Math.PI * 4 + side) * 0.08
        : THREE.MathUtils.randFloatSpread(layout.particleZSpread * envelope);
      particlePositions[idx] = x;
      particlePositions[idx + 1] = y;
      particlePositions[idx + 2] = z;
      particleBase[idx] = x;
      particleBase[idx + 1] = y;
      particleBase[idx + 2] = z;
      const coreMix = THREE.MathUtils.clamp(1 - Math.abs(x) / layout.particleXMax, 0, 1);
      if (useReferencePlume) {
        temp.copy(side === -1 ? leftA : rightB)
          .lerp(side === -1 ? livingGreen : signalGold, xNorm * (side === -1 ? 0.08 : 0.34))
          .lerp(purple, coreMix * 0.38);
      } else {
        temp.copy(side === -1 ? leftA : rightB)
          .lerp(purple, coreMix * 0.72)
          .lerp(side === -1 ? livingGreen : signalGold, Math.pow(coreMix, 2.2) * 0.18);
      }
      const lift = useReferencePlume
        ? THREE.MathUtils.randFloat(isLanding ? 0.92 : 0.72, isLanding ? 1.42 : 1.04)
        : THREE.MathUtils.randFloat(0.46, 1.18);
      particleColors[idx] = temp.r * lift;
      particleColors[idx + 1] = temp.g * lift;
      particleColors[idx + 2] = temp.b * lift;
      particleSeeds[i] = Math.random() * 1000;
      particleLanes[i] = (Math.random() < 0.5 ? -1 : 1) * THREE.MathUtils.randFloat(0.45, 1.15);
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    particleGeometry.setAttribute("color", new THREE.BufferAttribute(particleColors, 3));
    const particleMaterial = new THREE.PointsMaterial({
      size: isLanding ? 0.086 : 0.04,
      map: glowMap || null,
      alphaMap: glowMap || null,
      transparent: true,
      opacity: isLanding ? 0.94 : 0.56,
      depthWrite: false,
      depthTest: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });
    const particleCloud = new THREE.Points(particleGeometry, particleMaterial);
    particleCloud.renderOrder = 2;
    scene.add(particleCloud);

    const ambientPlanes = [];
    if (isLanding) {
      [
        { x: -2.25, y: 0.03, z: -0.58, w: 4.45, h: 2.35, color: "#2f7188", opacity: 0.016, rz: -0.018 },
        { x: 2.18, y: 0.04, z: -0.62, w: 4.8, h: 2.38, color: "#7b4053", opacity: 0.014, rz: 0.016 },
        { x: 0, y: 0.1, z: -0.78, w: 1.24, h: 3.2, color: "#777aa4", opacity: 0.012, rz: 0 },
        { x: 0, y: 0.02, z: -0.88, w: 9.2, h: 0.28, color: "#87716f", opacity: 0.012, rz: 0.004 },
      ].forEach((plane) => {
        const geometry = new THREE.PlaneGeometry(plane.w, plane.h);
        const material = new THREE.MeshBasicMaterial({
          color: plane.color,
          transparent: true,
          opacity: 0,
          depthWrite: false,
          side: THREE.DoubleSide,
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(plane.x, plane.y, plane.z);
        mesh.rotation.z = plane.rz;
        mesh.renderOrder = 1;
        scene.add(mesh);
        ambientPlanes.push({ mesh, geometry, material, ...plane });
      });
    }

    // Voice cuboid: plasma, not floating giant wireframe.
    const cuboidGroup = new THREE.Group();
    cuboidGroup.renderOrder = 6;
    scene.add(cuboidGroup);

    const cuboidTargetRotation = { x: -0.34, y: 0.58, z: 0.045 };
    const shellEdges = [];
    const cuboidFrameCount = 8;
    Array.from({ length: cuboidFrameCount }).forEach((_, i) => {
      const turn = i / Math.max(cuboidFrameCount - 1, 1);
      const size = 2.04 - Math.sin(turn * Math.PI) * 0.08;
      const geo = new THREE.EdgesGeometry(new THREE.BoxGeometry(size, size, size));
      const lineColor = new THREE.Color("#6f66ff").lerp(new THREE.Color("#c5a9ff"), turn * 0.72);
      const mat = new THREE.LineBasicMaterial({
        color: lineColor,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const lines = new THREE.LineSegments(geo, mat);
      lines.renderOrder = i === cuboidFrameCount - 1 ? 8 : 6;
      cuboidGroup.add(lines);
      shellEdges.push({
        lines,
        geometry: geo,
        material: mat,
        turn,
        endpoint: i === 0 || i === cuboidFrameCount - 1,
      });
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
    shellParticles.renderOrder = 6;
    cuboidGroup.add(shellParticles);

    const voiceSignalGroup = new THREE.Group();
    voiceSignalGroup.position.z = 0.72;
    voiceSignalGroup.renderOrder = 9;
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
        depthTest: false,
        side: THREE.DoubleSide,
      });
      const bar = new THREE.Mesh(geo, mat);
      bar.position.x = x;
      bar.renderOrder = 9;
      voiceSignalGroup.add(bar);
      signalBars.push({ mesh: bar, geometry: geo, material: mat, xNorm, phase: Math.random() * Math.PI * 2 });
    }

    const clock = new THREE.Clock();
    let frameId = 0;
    
    // Smooth transition tracking
    let currentMorph = voiceModeRef.current ? 1 : 0;
    let voiceEngagedAt = voiceModeRef.current ? 0 : null;
    let wasVoiceActive = voiceModeRef.current;

    const animate = () => {
      const t = clock.getElapsedTime();
      
      // Continuous ambient variations — no dead zones, always visible
      const breathe     = (Math.sin(t * 0.13) + 1) * 0.5;        // 0→1 slow cycle
      const pulse       = (Math.sin(t * 0.08 + 1.5) + 1) * 0.5;  // offset cycle
      // Voice morph
      const targetMorph = voiceModeRef.current ? 1 : 0;
      const targetVoiceActive = targetMorph > 0.5;
      if (targetVoiceActive !== wasVoiceActive) {
        voiceEngagedAt = targetVoiceActive ? t : null;
        wasVoiceActive = targetVoiceActive;
      }
      const voiceAge = voiceEngagedAt === null ? 0 : Math.max(0, t - voiceEngagedAt);
      currentMorph += (targetMorph - currentMorph) * 0.05;

      const ambientVisibility = 1 - currentMorph;
      const voiceMorph = currentMorph;
      const plasmaMode = currentMorph * 0.35;
      const preMorph = 1 - voiceMorph;
      const waveAmp = 0.2 + breathe * (isLanding ? 0.36 : 0.28);
      const spreadVar = 0.92 + pulse * (isLanding ? 0.16 : 0.11);
      const beamMode = 0.08 + pulse * (isLanding ? 0.16 : 0.11);
      const particleMode = 0.28 + breathe * (isLanding ? 0.42 : 0.32);
      const convergence = (0.04 + Math.pow((Math.sin(t * 0.115) + 1) * 0.5, 1.4) * (isLanding ? 0.22 : 0.12)) * preMorph;

      waveSystems.forEach((sys, sysIndex) => {
        const arr = sys.geometry.attributes.position.array;

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
          const lane = sys.laneOffsets[i] || 1;

          const waveA = Math.sin(segT * 9.5 - t * 1.05 + lineIndex * 0.13 + seed * 0.0008);
          const waveB = Math.cos(segT * 14.0 + t * 0.8 - lineIndex * 0.105 + seed * 0.0009);
          const helixPhase = segT * Math.PI * (isLanding ? 7.1 : 6.2) - t * 0.54 + lineT * Math.PI * 3.4 + seed * 0.0007;
          const braidY = Math.sin(helixPhase) * lane * (0.035 + towardCenter * (isLanding ? 0.11 : 0.075)) * preMorph;
          const braidZ = Math.cos(helixPhase) * lane * (0.045 + towardCenter * (isLanding ? 0.16 : 0.105)) * preMorph;
          const membrane = Math.sin(lineT * Math.PI * 2 + t * 0.22 + sysIndex * 0.6) * 0.035 * preMorph;
          const ripple = (waveA * 0.58 + waveB * 0.34) * waveAmp * (0.45 + towardCenter * 0.95);

          const cuboidX = sys.side * (0.18 + lineT * 0.86);
          const cuboidY = (lineT - 0.5) * 1.7 + Math.sin(segT * Math.PI * 2 + lineIndex * 0.08) * 0.045;
          const cuboidZ = Math.sin(segT * Math.PI * 2 + lineT * 2.2 + seed * 0.0006) * 0.34;

          const ambientX = bx - sys.side * convergence * (0.3 + towardCenter * 0.9) + sys.side * Math.sin(t * 0.36 + lineT * 4.1 + seed * 0.001) * 0.04 * towardCenter * preMorph;
          const ambientY = (by + ripple + braidY + membrane) * spreadVar;
          const ambientZ = bz + braidZ + Math.cos(segT * 10.8 - t * 0.72 + seed * 0.0007) * (0.04 + towardCenter * (isLanding ? 0.1 : 0.07));

          arr[idx] = THREE.MathUtils.lerp(ambientX, cuboidX, voiceMorph * (0.3 + towardCenter * 0.7));
          arr[idx + 1] = THREE.MathUtils.lerp(ambientY, cuboidY, voiceMorph * 0.9);
          arr[idx + 2] = THREE.MathUtils.lerp(ambientZ, cuboidZ, voiceMorph * 0.88);
        }

        sys.geometry.attributes.position.needsUpdate = true;
        sys.points.rotation.z = Math.sin(t * 0.055 + sysIndex * 0.2) * (isLanding ? 0.009 : 0.006);
        sys.points.rotation.x = Math.cos(t * 0.04 + sysIndex * 0.15) * (isLanding ? 0.011 : 0.007);
        sys.points.rotation.y = Math.sin(t * 0.035 + sysIndex * 0.2) * (isLanding ? 0.018 : 0.012);

        const opacityBase = sysIndex < 2 ? layout.primaryOpacity : layout.secondaryOpacity;
        sys.material.opacity = isLanding
          ? ambientVisibility * opacityBase
          : Math.max(0.2, ambientVisibility * opacityBase + voiceMorph * 0.07);
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
          entry.material.opacity = 0;
        });
        net.lineGroup.rotation.z = Math.sin(t * 0.055 + netIndex * 0.2) * (isLanding ? 0.009 : 0.006);
        net.lineGroup.rotation.x = Math.cos(t * 0.04 + netIndex * 0.15) * (isLanding ? 0.011 : 0.007);
        net.lineGroup.rotation.y = Math.sin(t * 0.035 + netIndex * 0.2) * (isLanding ? 0.018 : 0.012);
      });

      streamSystems.forEach((system) => {
        const streamPresence = isLanding ? preMorph : Math.max(preMorph, voiceMorph * 0.36);
        system.group.position.z = isLanding ? 0 : THREE.MathUtils.lerp(0, -0.62, voiceMorph);
        system.group.rotation.y = Math.sin(t * 0.035 + system.side) * 0.012 * streamPresence;
        system.lines.forEach((entry) => {
          const pos = entry.geometry.attributes.position.array;
          for (let s = 0; s < system.segments; s++) {
            const u = s / Math.max(system.segments - 1, 1);
            const point = computeStreamPoint({
              side: system.side,
              u,
              lineT: entry.lineT,
              offset: entry.offset,
              amp: entry.amp,
              freq: entry.freq,
              phase: entry.phase,
              time: t,
              xMax: system.xMax,
              centerGap: system.centerGap,
              depth: entry.depth,
            });
            const dst = s * 3;
            pos[dst] = point[0];
            pos[dst + 1] = point[1];
            pos[dst + 2] = point[2];
          }
          entry.geometry.attributes.position.needsUpdate = true;
          const laneEnergy = 0.72 + Math.sin(t * 0.26 + entry.phase) * 0.18;
          entry.material.opacity = streamPresence * (isLanding ? 0.16 : 0.2) * laneEnergy;
        });

        const nodePos = system.nodeGeometry.attributes.position.array;
        system.nodeSeeds.forEach((node, i) => {
          const line = system.lines[node.lineIndex];
          const u = (node.u + t * node.speed) % 1;
          const point = computeStreamPoint({
            side: system.side,
            u,
            lineT: line.lineT,
            offset: line.offset,
            amp: line.amp,
            freq: line.freq,
            phase: line.phase + node.phase * 0.08,
            time: t,
            xMax: system.xMax,
            centerGap: system.centerGap,
            depth: line.depth,
          });
          const idx = i * 3;
          nodePos[idx] = point[0];
          nodePos[idx + 1] = point[1];
          nodePos[idx + 2] = point[2];
        });
        system.nodeGeometry.attributes.position.needsUpdate = true;
        system.nodeMaterial.opacity = streamPresence * (isLanding ? 0.95 : 0.9);
      });

      const particleArray = particleGeometry.attributes.position.array;
      for (let i = 0; i < particleSeeds.length; i++) {
        const idx = i * 3;
        const bx = particleBase[idx];
        const by = particleBase[idx + 1];
        const bz = particleBase[idx + 2];
        const seed = particleSeeds[i];
        const side = bx < 0 ? -1 : 1;
        const lane = particleLanes[i] || 1;
        const inward = THREE.MathUtils.clamp(1 - Math.abs(bx) / layout.particleXMax, 0, 1);

        // Always use base positions for ambient cloud — no merging compression
        const cuboidPX = side * (0.08 + inward * 0.78);
        const cuboidBackY = Math.sin(seed * 0.004 + t * 0.58) * (0.42 + inward * 0.34);
        const cuboidBackZ = -0.74 - inward * 0.28 + Math.cos(seed * 0.005 + t * 0.42) * 0.14;
        const helix = Math.sin(t * 0.38 + seed * 0.012 + inward * Math.PI * 3.2) * lane * preMorph;
        const px = THREE.MathUtils.lerp(bx - side * convergence * (0.2 + inward), cuboidPX, voiceMorph * 0.9);

        const py = THREE.MathUtils.lerp(by + helix * (0.025 + inward * 0.08), cuboidBackY, voiceMorph * 0.9);
        const pz = THREE.MathUtils.lerp(bz + Math.cos(t * 0.34 + seed * 0.01) * lane * (0.02 + inward * 0.09) * preMorph, cuboidBackZ, voiceMorph * 0.92);
        const voiceDamping = 1 - voiceMorph * 0.55;
        const voiceDepthDamping = 1 - voiceMorph * 0.72;

        particleArray[idx] = px + side * Math.sin(t * 0.44 + seed * 0.002) * (0.025 + particleMode * (isLanding ? 0.105 : 0.075)) * voiceDamping;
        particleArray[idx + 1] = py + Math.cos(t * 0.78 + seed * 0.008) * (0.025 + particleMode * (isLanding ? 0.15 : 0.12)) * voiceDamping;
        particleArray[idx + 2] = pz + Math.sin(t * 0.9 + seed * 0.01) * (0.035 + particleMode * (isLanding ? 0.105 : 0.08)) * voiceDepthDamping;
      }
      particleGeometry.attributes.position.needsUpdate = true;
      // Keep the idle plume visible, then dim it into the cuboid's rear plane while listening.
      const ambientParticleOpacity = Math.max(isLanding ? 0.62 : 0.1, ambientVisibility * (0.12 + particleMode * (isLanding ? 0.7 : 0.14) + beamMode * 0.04));
      const rearParticleOpacity = isLanding ? ambientParticleOpacity : 0.13 + particleMode * 0.04;
      particleMaterial.opacity = THREE.MathUtils.lerp(ambientParticleOpacity, rearParticleOpacity, voiceMorph);
      particleCloud.rotation.y = THREE.MathUtils.lerp(t * (isLanding ? 0.019 : 0.014), cuboidTargetRotation.y * 0.36, voiceMorph);
      particleCloud.rotation.x = THREE.MathUtils.lerp(Math.sin(t * 0.052) * (isLanding ? 0.015 : 0.01), cuboidTargetRotation.x * 0.24, voiceMorph);

      ambientPlanes.forEach((plane, i) => {
        plane.material.opacity = preMorph * plane.opacity * (0.82 + Math.sin(t * 0.09 + i) * 0.12);
        plane.mesh.rotation.z = plane.rz + Math.sin(t * 0.045 + i * 0.7) * 0.012;
        plane.mesh.position.y = plane.y + Math.sin(t * 0.05 + i) * 0.025;
      });

      // Cuboid shell + internal plasma particles.
      shellEdges.forEach((shell, i) => {
        const phaseScan = (Math.sin(t * 0.42 - shell.turn * Math.PI * 1.6) + 1) * 0.5;
        const frameReveal = smoothstep(0.08, 1.2, voiceAge) * voiceMorph;
        const endpointWeight = shell.endpoint ? 1 : 0.52;
        shell.lines.rotation.x = cuboidTargetRotation.x * shell.turn + Math.sin(t * 0.08 + i) * 0.006 * voiceMorph;
        shell.lines.rotation.y = cuboidTargetRotation.y * shell.turn + Math.cos(t * 0.07 + i * 0.4) * 0.008 * voiceMorph;
        shell.lines.rotation.z = cuboidTargetRotation.z * shell.turn;
        shell.lines.scale.setScalar(0.98 + shell.turn * 0.035 + plasmaMode * 0.006);
        shell.material.opacity = frameReveal * endpointWeight * (0.08 + phaseScan * 0.05 + (shell.endpoint ? 0.08 : 0));
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
      const shellResolve = voiceMorph * smoothstep(0.25, 1.25, voiceAge);
      shellParticles.rotation.set(
        cuboidTargetRotation.x * shellResolve,
        cuboidTargetRotation.y * shellResolve,
        cuboidTargetRotation.z * shellResolve
      );
      shellParticleMaterial.opacity = voiceMorph * 0.12;
      cuboidGroup.rotation.set(0, 0, 0);

      // Subtle tri-color audio signal through cuboid.
      const realAudio = audioLevelRef.current;
      const st = t * 0.35; // Slow down base autonomous movement
      const speakingPulse = 0.22 + (Math.pow((Math.sin(st * 2.4) + 1) * 0.5, 1.5) * 0.38) * (1 + realAudio * 1.8);
      signalBars.forEach((bar, i) => {
        const envelope = Math.exp(-Math.pow((bar.xNorm - 0.5) / 0.38, 2));
        const wave = Math.sin(i * 0.34 - st * 5.8 + bar.phase) * 0.65 + Math.sin(i * 0.17 + st * 2.8) * 0.35;
        const heartbeat = Math.exp(-Math.pow(((((st * 1.35 + bar.xNorm * 0.95) % 1) - 0.17) / 0.05), 2)) * (0.42 + realAudio * 0.8);
        const amp = (0.08 + envelope * 0.18) * speakingPulse + heartbeat * 0.18;
        bar.mesh.scale.y = 0.24 + Math.abs(wave) * amp * (2.2 + realAudio * 2.4);
        bar.mesh.position.y = Math.sin(i * 0.08 + st * 1.15) * 0.014;
        bar.mesh.position.z = Math.sin(i * 0.05 + st * 0.9) * 0.01;
        bar.material.opacity = voiceMorph * (0.08 + envelope * 0.2 + realAudio * 0.08);
      });

      coreLight.intensity = 8 + breathe * 2 + particleMode * 2 + voiceMorph * 9;
      camera.position.x = Math.sin(t * 0.022) * 0.01;
      camera.position.y = Math.cos(t * 0.018) * 0.008;
      camera.position.z = layout.cameraZ - voiceMorph * 0.28;
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
      streamSystems.forEach((system) => {
        system.lines.forEach((entry) => {
          entry.geometry.dispose();
          entry.material.dispose();
        });
        system.nodeGeometry.dispose();
        system.nodeMaterial.dispose();
      });
      ambientPlanes.forEach((plane) => {
        plane.geometry.dispose();
        plane.material.dispose();
      });
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
  }, [presentation]);

  return <div ref={mountRef} style={{ width: '100%', height: '100%' }} />;
}
