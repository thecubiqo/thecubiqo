'use client'

import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrthographicCamera } from '@react-three/drei'
import { useMemo, useRef } from 'react'

/**
 * Vollebak-grade procedural "filament creature"
 * - Spine: TubeGeometry along a curve, subtle breath deformation (CPU-light)
 * - Filaments: Instanced billboards rendered via shader (GPU-friendly, looks like hair/threads)
 */

const filamentVertex = /* glsl */ `
  precision highp float;

  attribute mat4 instanceMatrix;

  uniform float uTime;
  uniform float uOpacity;
  uniform float uBreath;

  varying vec2 vUv;
  varying float vFade;

  // hash
  float hash(float n){ return fract(sin(n)*43758.5453123); }

  void main() {
    vUv = uv;

    // Instance origin in VIEW SPACE (billboarding becomes trivial)
    vec4 originView = modelViewMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);

    // Strand dimensions (in view space units, controlled in JS by instance scaling)
    vec3 p = vec3(position.x, position.y, 0.0);

    // Seed per instance from matrix translation (stable)
    float seed = hash(originView.x * 12.31 + originView.y * 7.17 + originView.z * 3.11);

    // "Breathing" sway grows toward the tip (y -> 1)
    float tip = smoothstep(0.0, 1.0, vUv.y);
    float tip2 = tip * tip;

    float slow = sin(uTime * 0.55 + seed * 6.2831);
    float fast = sin(uTime * 1.8 + seed * 15.0);

    // Micro filament shimmer (subtle)
    float shimmer = (fast * 0.35 + slow * 0.65) * 0.015;

    // Breath: global low-frequency motion (museum calm)
    float breath = sin(uTime * 0.22) * 0.5 + 0.5;

    // Apply sway in view X (a little) and view Z (tiny depth flutter)
    p.x += (shimmer + (breath * 0.020 * uBreath)) * tip2;
    float zFlutter = (sin(uTime * 0.9 + seed * 10.0) * 0.006) * tip2;

    vec3 finalView = originView.xyz + vec3(p.x, p.y, 0.0) + vec3(0.0, 0.0, zFlutter);

    // Fade strands softly based on view depth (prevents harsh edges)
    // originView.z is negative in front of camera.
    float depth = clamp((-originView.z - 2.0) / 10.0, 0.0, 1.0);
    vFade = mix(1.0, 0.55, depth);

    gl_Position = projectionMatrix * vec4(finalView, 1.0);
  }
`

const filamentFragment = /* glsl */ `
  precision highp float;

  uniform float uOpacity;

  varying vec2 vUv;
  varying float vFade;

  void main() {
    // Thin strand centered at x=0.5
    float d = abs(vUv.x - 0.5);

    // Thickness profile: slightly thicker near base, thinner near tip
    float baseThick = mix(0.08, 0.028, vUv.y);
    float alphaLine = smoothstep(baseThick, 0.0, d);

    // Length fade (soft tip)
    float tipFade = smoothstep(1.0, 0.65, vUv.y);

    // Subtle "ink" richness: not pure white, avoids harsh glow
    vec3 col = vec3(0.93);

    float a = alphaLine * tipFade * uOpacity * vFade;

    // Kill near-transparent fragments for clean compositing
    if (a < 0.01) discard;

    gl_FragColor = vec4(col, a);
  }
`

function buildSpineCurve() {
  // Creature-like: arched spine in a crouch
  const pts = [
    new THREE.Vector3(-0.55, -0.10,  0.00),
    new THREE.Vector3(-0.25,  0.12,  0.04),
    new THREE.Vector3( 0.05,  0.22,  0.06),
    new THREE.Vector3( 0.32,  0.12,  0.02),
    new THREE.Vector3( 0.56, -0.06, -0.02),
  ]
  return new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.5)
}

function Creature() {
  // ---- Spine geometry (tube along curve) ----
  const spineMesh = useRef<THREE.Mesh>(null)

  const spine     = useMemo(() => buildSpineCurve(), [])
  const spineGeom = useMemo(() => new THREE.TubeGeometry(spine, 140, 0.055, 16, false), [spine])

  // ---- Filaments (instanced billboards + shader) ----
  const filamentsRef = useRef<THREE.InstancedMesh>(null)

  const filamentMat = useMemo(() => new THREE.ShaderMaterial({
    transparent: true,
    depthWrite:  false,
    uniforms: {
      uTime:    { value: 0 },
      uOpacity: { value: 0.95 },
      uBreath:  { value: 1.0 },
    },
    vertexShader:   filamentVertex,
    fragmentShader: filamentFragment,
  }), [])

  // Vertical unit plane — scaled per-instance for length/thickness
  const filamentGeo = useMemo(() => new THREE.PlaneGeometry(1, 1, 1, 1), [])

  const filamentCount = 1800
  const dummy         = useMemo(() => new THREE.Object3D(), [])

  const instanceMatrices = useMemo(() => {
    const mats: THREE.Matrix4[] = []
    for (let i = 0; i < filamentCount; i++) {
      const t      = Math.random()
      const p      = spine.getPoint(t)
      const angle  = Math.random() * Math.PI * 2
      const radius = THREE.MathUtils.lerp(0.04, 0.18, Math.random() ** 0.8)
      const lift   = THREE.MathUtils.lerp(0.02, 0.14, Math.random() ** 1.6)

      dummy.position.set(
        p.x + Math.cos(angle) * radius,
        p.y + lift,
        p.z + Math.sin(angle) * radius,
      )
      dummy.rotation.set(
        THREE.MathUtils.degToRad(THREE.MathUtils.lerp(-12, 10, Math.random())),
        THREE.MathUtils.degToRad(THREE.MathUtils.lerp(-15, 15, Math.random())),
        THREE.MathUtils.degToRad(THREE.MathUtils.lerp( -6,  6, Math.random())),
      )
      dummy.scale.set(
        THREE.MathUtils.lerp(0.002, 0.010, Math.random() ** 1.4),
        THREE.MathUtils.lerp(0.10,  0.36,  Math.random() ** 0.7),
        1.0,
      )
      dummy.updateMatrix()
      mats.push(dummy.matrix.clone())
    }
    return mats
  }, [spine, dummy])

  // Write instance matrices on the first rendered frame (ref is live by then)
  const initDone = useRef(false)

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()

    if (!initDone.current && filamentsRef.current) {
      for (let i = 0; i < instanceMatrices.length; i++) {
        filamentsRef.current.setMatrixAt(i, instanceMatrices[i])
      }
      filamentsRef.current.instanceMatrix.needsUpdate = true
      initDone.current = true
    }

    // Gentle breath on the spine
    if (spineMesh.current) {
      const breath = Math.sin(t * 0.22) * 0.5 + 0.5
      const s = 1.0 + breath * 0.012
      spineMesh.current.scale.set(s, s, s)
      spineMesh.current.rotation.z = Math.sin(t * 0.06) * 0.02
      spineMesh.current.rotation.y = Math.cos(t * 0.05) * 0.015
    }

    filamentMat.uniforms.uTime.value = t
  })

  return (
    <group>
      <mesh ref={spineMesh} geometry={spineGeom}>
        <meshStandardMaterial color="#f2f2f2" roughness={0.65} metalness={0.02} />
      </mesh>

      <instancedMesh ref={filamentsRef} args={[filamentGeo, filamentMat, filamentCount]} />
    </group>
  )
}

function CameraDrift() {
  useFrame(({ clock, camera }) => {
    const t = clock.getElapsedTime()
    // Microscopic gallery drift — museum stillness
    camera.position.x = Math.sin(t * 0.045) * 0.18
    camera.position.y = Math.cos(t * 0.050) * 0.14
    camera.updateProjectionMatrix()
  })
  return null
}

export default function CreatureScene() {
  return (
    <Canvas
      dpr={[1, 2]} // cap at 2× — full retina on modern displays, avoids overdraw on 3× phones
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
    >
      <OrthographicCamera makeDefault position={[0, 0, 10]} zoom={250} />

      {/* Restrained high-contrast lighting on black — no blown highlights */}
      <ambientLight intensity={0.35} />
      <directionalLight position={[3, 2, 4]}  intensity={0.65} />
      <directionalLight position={[-2, -1, 3]} intensity={0.25} />

      <CameraDrift />
      <Creature />
    </Canvas>
  )
}

