'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export function Navigation() {
  const [isVisible, setIsVisible] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      // Show nav after scrolling past hero (100vh)
      const scrollY = window.scrollY
      const heroHeight = window.innerHeight
      setIsVisible(scrollY > heroHeight * 0.8)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ease-out ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div className="bg-black/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Logo + Nav Links */}
            <div className="flex items-center gap-8">
              {/* Logo */}
              <Link href="/site" className="flex items-center gap-2.5 group">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center transform group-hover:scale-105 transition-transform">
                  <span className="text-white text-sm font-bold">Q</span>
                </div>
                <span className="font-semibold tracking-wider text-white/90 hidden sm:block">
                  CubiQo
                </span>
              </Link>

              {/* Desktop Nav Links */}
              <div className="hidden md:flex items-center gap-6">
                <a
                  href="#features"
                  className="text-sm text-white/60 hover:text-white transition-colors"
                >
                  Features
                </a>
                <a
                  href="#contact"
                  className="text-sm text-white/60 hover:text-white transition-colors"
                >
                  Contact
                </a>
                <a
                  href="#worlds"
                  className="text-sm text-white/60 hover:text-white transition-colors"
                >
                  Worlds
                </a>
              </div>
            </div>

            {/* Right: Co-op Badge + Chat */}
            <div className="flex items-center gap-4">
              {/* Co-op Assist Badge */}
              <a
                href="https://coop.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
              >
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs text-white/70">Co-op Assist</span>
              </a>

              {/* Chat Bubble */}
              <Link
                href="/"
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 hover:from-cyan-500/30 hover:to-blue-600/30 transition-all group"
              >
                <svg
                  className="w-4 h-4 text-cyan-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                <span className="text-sm text-cyan-400 group-hover:text-cyan-300 transition-colors hidden sm:inline">
                  Chat
                </span>
              </Link>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 text-white/60 hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isMobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden pb-4 border-t border-white/5 mt-2 pt-4">
              <div className="flex flex-col gap-3">
                <a
                  href="#features"
                  className="text-sm text-white/60 hover:text-white transition-colors py-2"
                >
                  Features
                </a>
                <a
                  href="#contact"
                  className="text-sm text-white/60 hover:text-white transition-colors py-2"
                >
                  Contact
                </a>
                <a
                  href="#worlds"
                  className="text-sm text-white/60 hover:text-white transition-colors py-2"
                >
                  Worlds
                </a>
                <a
                  href="https://coop.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors py-2"
                >
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  Co-op Assist
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
