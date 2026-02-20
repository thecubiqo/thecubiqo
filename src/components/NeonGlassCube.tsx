'use client'

/**
 * Neon Glass Cube
 * Modern WebGL cube with procedural neon effects
 * Based on the demo code shared
 */

import { useRef, useEffect } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

interface NeonGlassCubeProps {
  width?: number
  height?: number
  autoRotate?: boolean
  showControls?: boolean
  className?: string
}

export default function NeonGlassCube({
  width = 400,
  height = 400,
  autoRotate = true,
  showControls = true,
  className = ''
}: NeonGlassCubeProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const cubeRef = useRef<THREE.Mesh | null>(null)
  const animationIdRef = useRef<number | null>(null)

  // Shader code
  const vertexShader = `
    varying vec3 vPos;
    varying vec3 vNrm;
    
    void main() {
      vPos = (modelMatrix * vec4(position, 1.0)).xyz;
      vNrm = normalize(mat3(modelMatrix) * normal);
      gl_Position = projectionMatrix * viewMatrix * vec4(vPos, 1.0);
    }
  `

  const fragmentShader = `
    uniform float uTime;
    varying vec3 vPos;
    varying vec3 vNrm;
    
    float hash(vec3 p) {
      p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
      p *= 17.0;
      return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
    }
    
    float noise(vec3 p) {
      vec3 i = floor(p);
      vec3 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      
      float n000 = hash(i + vec3(0, 0, 0));
      float n100 = hash(i + vec3(1, 0, 0));
      float n010 = hash(i + vec3(0, 1, 0));
      float n110 = hash(i + vec3(1, 1, 0));
      float n001 = hash(i + vec3(0, 0, 1));
      float n101 = hash(i + vec3(1, 0, 1));
      float n011 = hash(i + vec3(0, 1, 1));
      float n111 = hash(i + vec3(1, 1, 1));
      
      float n00 = mix(n000, n100, f.x);
      float n10 = mix(n010, n110, f.x);
      float n01 = mix(n001, n101, f.x);
      float n11 = mix(n011, n111, f.x);
      
      float n0 = mix(n00, n10, f.y);
      float n1 = mix(n01, n11, f.y);
      
      return mix(n0, n1, f.z);
    }
    
    float fbm(vec3 p) {
      float v = 0.0;
      float a = 0.55;
      for (int i = 0; i < 5; i++) {
        v += a * noise(p);
        p *= 2.02;
        a *= 0.5;
      }
      return v;
    }
    
    vec3 palette(float t) {
      vec3 a = vec3(0.15, 0.30, 0.95);
      vec3 b = vec3(0.15, 0.95, 0.85);
      vec3 c = vec3(0.95, 0.25, 0.75);
      return mix(mix(a, b, smoothstep(0.2, 0.6, t)), c, smoothstep(0.55, 0.95, t));
    }
    
    void main() {
      vec3 p = vPos * 1.1;
      
      // Animate blobs
      float n = fbm(p + vec3(0.0, 0.0, uTime * 0.22));
      float blobs = smoothstep(0.55, 0.78, n);
      
      // Glass base
      vec3 base = vec3(0.08, 0.14, 0.35);
      
      // Emissive blobs
      vec3 col = palette(n);
      float rim = pow(1.0 - max(0.0, dot(normalize(vNrm), normalize(cameraPosition - vPos))), 2.0);
      vec3 emissive = col * (0.9 * blobs + 0.35 * rim);
      
      // Fake internal scattering
      float haze = smoothstep(0.0, 1.0, fbm(p * 0.65 + uTime * 0.08)) * 0.18;
      
      vec3 outCol = base + emissive + haze;
      gl_FragColor = vec4(outCol, 0.72);
    }
  `

  useEffect(() => {
    if (!containerRef.current) return

    // Initialize Three.js
    const scene = new THREE.Scene()
    scene.fog = new THREE.Fog(0x050814, 3, 14)
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100)
    camera.position.set(3.2, 2.0, 4.2)
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    rendererRef.current = renderer

    containerRef.current.innerHTML = ''
    containerRef.current.appendChild(renderer.domElement)

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.enabled = showControls
    controlsRef.current = controls

    // Lighting
    scene.add(new THREE.AmbientLight(0x2233ff, 0.5))
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.0)
    keyLight.position.set(4, 6, 3)
    scene.add(keyLight)

    // Cube geometry
    const geometry = new THREE.BoxGeometry(2.6, 1.6, 2.2, 1, 1, 1)

    // Shader material
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 }
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide
    })

    const cube = new THREE.Mesh(geometry, material)
    scene.add(cube)
    cubeRef.current = cube

    // Pedestal
    const pedestalGeometry = new THREE.CylinderGeometry(1.3, 1.5, 0.25, 64)
    const pedestalMaterial = new THREE.MeshStandardMaterial({
      color: 0x061032,
      metalness: 0.4,
      roughness: 0.3
    })
    const pedestal = new THREE.Mesh(pedestalGeometry, pedestalMaterial)
    pedestal.position.y = -1.05
    scene.add(pedestal)

    // Animation
    let time = 0
    const clock = new THREE.Clock()

    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate)
      
      const delta = clock.getDelta()
      time += delta

      if (material.uniforms.uTime) {
        material.uniforms.uTime.value = time
      }

      if (autoRotate && cubeRef.current) {
        cubeRef.current.rotation.y = time * 0.25
        cubeRef.current.rotation.x = Math.sin(time * 0.15) * 0.05
      }

      if (controlsRef.current) {
        controlsRef.current.update()
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current)
      }
    }

    animate()

    // Handle resize
    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current) return
      
      cameraRef.current.aspect = width / height
      cameraRef.current.updateProjectionMatrix()
      rendererRef.current.setSize(width, height)
    }

    // Initial render
    handleResize()

    // Cleanup
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
      }
      
      if (controlsRef.current) {
        controlsRef.current.dispose()
      }
      
      if (rendererRef.current) {
        rendererRef.current.dispose()
      }
      
      // Dispose geometries and materials
      geometry.dispose()
      material.dispose()
      pedestalGeometry.dispose()
      pedestalMaterial.dispose()
    }
  }, [width, height, autoRotate, showControls])

  return (
    <div className={`neon-glass-cube ${className}`} ref={containerRef} style={{
      width: `${width}px`,
      height: `${height}px`,
      borderRadius: '8px',
      overflow: 'hidden',
      background: '#050814'
    }} />
  )
}