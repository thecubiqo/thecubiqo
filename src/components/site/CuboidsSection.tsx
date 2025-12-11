'use client'

import { useMemo } from 'react'

interface Cube {
  id: number
  size: number
  x: number
  y: number
  delay: number
  intensity: number
}

export function CuboidsSection() {
  // Generate random cube positions
  const cubes = useMemo<Cube[]>(() => {
    const result: Cube[] = []
    const gridCols = 8
    const gridRows = 5

    for (let row = 0; row < gridRows; row++) {
      for (let col = 0; col < gridCols; col++) {
        // Add some randomness to grid positions
        const baseX = (col / gridCols) * 100
        const baseY = (row / gridRows) * 100
        const offsetX = (Math.random() - 0.5) * 8
        const offsetY = (Math.random() - 0.5) * 8

        result.push({
          id: row * gridCols + col,
          size: 40 + Math.random() * 40, // 40-80px
          x: baseX + offsetX,
          y: baseY + offsetY,
          delay: Math.random() * 3,
          intensity: 0.5 + Math.random() * 0.5, // 0.5-1.0
        })
      }
    }
    return result
  }, [])

  return (
    <section className="relative py-24 overflow-hidden bg-[#0a0a0a]">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black z-10 pointer-events-none" />

      {/* Hexagon pattern overlay (subtle) */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l25.98 15v30L30 60 4.02 45V15z' fill='none' stroke='%234a5568' stroke-width='1'/%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Cubes container */}
      <div className="relative h-[400px] md:h-[500px] max-w-7xl mx-auto">
        {cubes.map((cube) => (
          <div
            key={cube.id}
            className="absolute transform-gpu animate-float"
            style={{
              left: `${cube.x}%`,
              top: `${cube.y}%`,
              width: cube.size,
              height: cube.size,
              animationDelay: `${cube.delay}s`,
              animationDuration: `${4 + Math.random() * 2}s`,
            }}
          >
            {/* Cube face - front */}
            <div
              className="absolute inset-0 rounded-lg transform rotate-3"
              style={{
                background: `linear-gradient(135deg,
                  rgba(46, 208, 255, ${cube.intensity * 0.8}) 0%,
                  rgba(144, 246, 240, ${cube.intensity * 0.6}) 50%,
                  rgba(46, 208, 255, ${cube.intensity * 0.4}) 100%)`,
                boxShadow: `
                  0 0 ${20 * cube.intensity}px rgba(46, 208, 255, ${cube.intensity * 0.5}),
                  0 0 ${40 * cube.intensity}px rgba(46, 208, 255, ${cube.intensity * 0.3}),
                  0 0 ${60 * cube.intensity}px rgba(144, 246, 240, ${cube.intensity * 0.2}),
                  inset 0 0 ${20 * cube.intensity}px rgba(255, 255, 255, 0.1)
                `,
                border: '1px solid rgba(144, 246, 240, 0.3)',
              }}
            />

            {/* Inner glow center */}
            <div
              className="absolute rounded-md"
              style={{
                top: '20%',
                left: '20%',
                right: '20%',
                bottom: '20%',
                background: `radial-gradient(circle,
                  rgba(144, 246, 240, ${cube.intensity * 0.8}) 0%,
                  rgba(46, 208, 255, ${cube.intensity * 0.4}) 50%,
                  transparent 70%)`,
              }}
            />

            {/* Purple edge highlight */}
            <div
              className="absolute inset-0 rounded-lg transform -rotate-2"
              style={{
                background: `linear-gradient(45deg,
                  rgba(255, 0, 245, ${cube.intensity * 0.15}) 0%,
                  transparent 50%)`,
                border: '1px solid rgba(255, 0, 245, 0.1)',
              }}
            />
          </div>
        ))}
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent z-10" />

      {/* Optional: CoQo mascot placeholder */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 text-center">
        <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-gradient-to-br from-cyan-400/20 to-purple-500/20 border border-cyan-400/30 flex items-center justify-center">
          <span className="text-cyan-400 text-2xl font-bold">Q</span>
        </div>
        <span className="text-cyan-400/60 text-xs tracking-widest">CUBIQO</span>
      </div>

      {/* Styles for float animation */}
      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-15px) rotate(3deg);
          }
        }
        .animate-float {
          animation: float ease-in-out infinite;
        }
      `}</style>
    </section>
  )
}
