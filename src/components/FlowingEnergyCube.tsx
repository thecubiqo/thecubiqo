'use client'

/**
 * FlowingEnergyCube - Geometric energy ribbons defining cube structure
 * Uses 3D curves/tubes to create defined flowing paths
 */

import React, { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface FlowingEnergyCubeProps {
  intensity?: number
}

export function FlowingEnergyCube({ intensity = 0.5 }: FlowingEnergyCubeProps) {
  const groupRef = useRef<THREE.Group>(null)
  
  // Create flowing ribbon paths using CatmullRomCurve3
  const ribbonPaths = useMemo(() => {
    const size = 0.75
    const curves: THREE.CatmullRomCurve3[] = []
    
    // Edge flows - following cube edges with curves
    // Bottom square flowing
    curves.push(new THREE.CatmullRomCurve3([
      new THREE.Vector3(-size, -size, -size),
      new THREE.Vector3(-size * 0.7, -size, -size * 1.1),
      new THREE.Vector3(0, -size, -size * 1.05),
      new THREE.Vector3(size * 0.7, -size, -size * 1.1),
      new THREE.Vector3(size, -size, -size),
    ]))
    
    curves.push(new THREE.CatmullRomCurve3([
      new THREE.Vector3(size, -size, -size),
      new THREE.Vector3(size * 1.1, -size, -size * 0.7),
      new THREE.Vector3(size * 1.05, -size, 0),
      new THREE.Vector3(size * 1.1, -size, size * 0.7),
      new THREE.Vector3(size, -size, size),
    ]))
    
    curves.push(new THREE.CatmullRomCurve3([
      new THREE.Vector3(size, -size, size),
      new THREE.Vector3(size * 0.7, -size, size * 1.1),
      new THREE.Vector3(0, -size, size * 1.05),
      new THREE.Vector3(-size * 0.7, -size, size * 1.1),
      new THREE.Vector3(-size, -size, size),
    ]))
    
    curves.push(new THREE.CatmullRomCurve3([
      new THREE.Vector3(-size, -size, size),
      new THREE.Vector3(-size * 1.1, -size, size * 0.7),
      new THREE.Vector3(-size * 1.05, -size, 0),
      new THREE.Vector3(-size * 1.1, -size, -size * 0.7),
      new THREE.Vector3(-size, -size, -size),
    ]))
    
    // Top square flowing
    curves.push(new THREE.CatmullRomCurve3([
      new THREE.Vector3(-size, size, -size),
      new THREE.Vector3(-size * 0.7, size, -size * 1.1),
      new THREE.Vector3(0, size, -size * 1.05),
      new THREE.Vector3(size * 0.7, size, -size * 1.1),
      new THREE.Vector3(size, size, -size),
    ]))
    
    curves.push(new THREE.CatmullRomCurve3([
      new THREE.Vector3(size, size, -size),
      new THREE.Vector3(size * 1.1, size, -size * 0.7),
      new THREE.Vector3(size * 1.05, size, 0),
      new THREE.Vector3(size * 1.1, size, size * 0.7),
      new THREE.Vector3(size, size, size),
    ]))
    
    curves.push(new THREE.CatmullRomCurve3([
      new THREE.Vector3(size, size, size),
      new THREE.Vector3(size * 0.7, size, size * 1.1),
      new THREE.Vector3(0, size, size * 1.05),
      new THREE.Vector3(-size * 0.7, size, size * 1.1),
      new THREE.Vector3(-size, size, size),
    ]))
    
    curves.push(new THREE.CatmullRomCurve3([
      new THREE.Vector3(-size, size, size),
      new THREE.Vector3(-size * 1.1, size, size * 0.7),
      new THREE.Vector3(-size * 1.05, size, 0),
      new THREE.Vector3(-size * 1.1, size, -size * 0.7),
      new THREE.Vector3(-size, size, -size),
    ]))
    
    // Vertical edges
    curves.push(new THREE.CatmullRomCurve3([
      new THREE.Vector3(-size, -size, -size),
      new THREE.Vector3(-size * 1.05, -size * 0.5, -size * 1.05),
      new THREE.Vector3(-size * 1.05, 0, -size * 1.05),
      new THREE.Vector3(-size * 1.05, size * 0.5, -size * 1.05),
      new THREE.Vector3(-size, size, -size),
    ]))
    
    curves.push(new THREE.CatmullRomCurve3([
      new THREE.Vector3(size, -size, -size),
      new THREE.Vector3(size * 1.05, -size * 0.5, -size * 1.05),
      new THREE.Vector3(size * 1.05, 0, -size * 1.05),
      new THREE.Vector3(size * 1.05, size * 0.5, -size * 1.05),
      new THREE.Vector3(size, size, -size),
    ]))
    
    curves.push(new THREE.CatmullRomCurve3([
      new THREE.Vector3(size, -size, size),
      new THREE.Vector3(size * 1.05, -size * 0.5, size * 1.05),
      new THREE.Vector3(size * 1.05, 0, size * 1.05),
      new THREE.Vector3(size * 1.05, size * 0.5, size * 1.05),
      new THREE.Vector3(size, size, size),
    ]))
    
    curves.push(new THREE.CatmullRomCurve3([
      new THREE.Vector3(-size, -size, size),
      new THREE.Vector3(-size * 1.05, -size * 0.5, size * 1.05),
      new THREE.Vector3(-size * 1.05, 0, size * 1.05),
      new THREE.Vector3(-size * 1.05, size * 0.5, size * 1.05),
      new THREE.Vector3(-size, size, size),
    ]))
    
    // Diagonal flowing ribbons through center
    curves.push(new THREE.CatmullRomCurve3([
      new THREE.Vector3(-size, -size, -size),
      new THREE.Vector3(-size * 0.5, -size * 0.3, -size * 0.3),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(size * 0.5, size * 0.3, size * 0.3),
      new THREE.Vector3(size, size, size),
    ]))
    
    curves.push(new THREE.CatmullRomCurve3([
      new THREE.Vector3(size, -size, -size),
      new THREE.Vector3(size * 0.5, -size * 0.3, -size * 0.3),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(-size * 0.5, size * 0.3, size * 0.3),
      new THREE.Vector3(-size, size, size),
    ]))
    
    return curves
  }, [])
  
  // Create tube geometries from curves
  const ribbonTubes = useMemo(() => {
    return ribbonPaths.map((curve, i) => {
      const geometry = new THREE.TubeGeometry(curve, 64, 0.015, 8, false)
      return { geometry, index: i }
    })
  }, [ribbonPaths])
  
  // Color gradient material
  const createRibbonMaterial = (index: number, time: number) => {
    const offset = (index / ribbonPaths.length + time * 0.1) % 1
    
    let color: THREE.Color
    if (offset < 0.25) {
      // Blue to Purple
      color = new THREE.Color().lerpColors(
        new THREE.Color(0.2, 0.4, 1.0),
        new THREE.Color(0.5, 0.2, 0.9),
        offset * 4
      )
    } else if (offset < 0.5) {
      // Purple to Pink
      color = new THREE.Color().lerpColors(
        new THREE.Color(0.5, 0.2, 0.9),
        new THREE.Color(1.0, 0.3, 0.6),
        (offset - 0.25) * 4
      )
    } else if (offset < 0.75) {
      // Pink to Orange
      color = new THREE.Color().lerpColors(
        new THREE.Color(1.0, 0.3, 0.6),
        new THREE.Color(1.0, 0.5, 0.2),
        (offset - 0.5) * 4
      )
    } else {
      // Orange to Cyan
      color = new THREE.Color().lerpColors(
        new THREE.Color(1.0, 0.5, 0.2),
        new THREE.Color(0.3, 0.8, 1.0),
        (offset - 0.75) * 4
      )
    }
    
    return new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.8 + Math.sin(time + index) * 0.2,
      blending: THREE.AdditiveBlending,
    })
  }
  
  const materialsRef = useRef<THREE.MeshBasicMaterial[]>([])
  
  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    
    if (groupRef.current) {
      groupRef.current.rotation.y = time * 0.08
      groupRef.current.rotation.x = Math.sin(time * 0.06) * 0.08
      groupRef.current.position.y = Math.sin(time * 0.3) * 0.05
    }
    
    // Update materials with flowing colors
    materialsRef.current.forEach((material, i) => {
      const offset = (i / ribbonPaths.length + time * 0.1) % 1
      
      let color: THREE.Color
      if (offset < 0.25) {
        color = new THREE.Color().lerpColors(
          new THREE.Color(0.2, 0.4, 1.0),
          new THREE.Color(0.5, 0.2, 0.9),
          offset * 4
        )
      } else if (offset < 0.5) {
        color = new THREE.Color().lerpColors(
          new THREE.Color(0.5, 0.2, 0.9),
          new THREE.Color(1.0, 0.3, 0.6),
          (offset - 0.25) * 4
        )
      } else if (offset < 0.75) {
        color = new THREE.Color().lerpColors(
          new THREE.Color(1.0, 0.3, 0.6),
          new THREE.Color(1.0, 0.5, 0.2),
          (offset - 0.5) * 4
        )
      } else {
        color = new THREE.Color().lerpColors(
          new THREE.Color(1.0, 0.5, 0.2),
          new THREE.Color(0.3, 0.8, 1.0),
          (offset - 0.75) * 4
        )
      }
      
      material.color = color
      material.opacity = 0.75 + Math.sin(time * 2 + i) * 0.25 + intensity * 0.3
    })
  })
  
  useEffect(() => {
    materialsRef.current = ribbonTubes.map((_, i) => 
      createRibbonMaterial(i, 0)
    )
  }, [ribbonTubes])
  
  return (
    <group ref={groupRef}>
      {/* Render all ribbon tubes */}
      {ribbonTubes.map(({ geometry, index }) => (
        <mesh key={index} geometry={geometry}>
          <meshBasicMaterial
            ref={(ref) => {
              if (ref && !materialsRef.current[index]) {
                materialsRef.current[index] = ref
              }
            }}
            color={0x66ccff}
            transparent
            opacity={0.8}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
      
      {/* Orange core */}
      <mesh>
        <sphereGeometry args={[0.15, 32, 32]} />
        <meshBasicMaterial
          color="#ff7733"
          transparent
          opacity={0.7 + intensity * 0.3}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* Sparkles */}
      {[...Array(40)].map((_, i) => {
        const angle1 = (i / 40) * Math.PI * 2
        const angle2 = Math.sin(i * 0.5) * Math.PI * 0.5
        const radius = 0.4 + Math.random() * 0.3
        
        const x = Math.cos(angle1) * Math.cos(angle2) * radius
        const y = Math.sin(angle2) * radius
        const z = Math.sin(angle1) * Math.cos(angle2) * radius
        
        const isOrange = i % 4 === 0
        const color = isOrange ? "#ff9944" : (i % 2 === 0 ? "#66ddff" : "#ff66cc")
        
        return (
          <mesh key={i} position={[x, y, z]}>
            <sphereGeometry args={[0.008, 6, 6]} />
            <meshBasicMaterial
              color={color}
              transparent
              opacity={0.9}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        )
      })}
    </group>
  )
}
