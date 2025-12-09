'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-black/90 backdrop-blur-md' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/site" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center transform group-hover:scale-105 transition-transform">
              <span className="text-white text-lg font-bold">Q</span>
            </div>
            <span className="font-bold tracking-widest text-lg hidden sm:block">
              CubiQo™
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-white/70 hover:text-white transition-colors">
              Features
            </a>
            <a href="#demo" className="text-sm text-white/70 hover:text-white transition-colors">
              Demo
            </a>
            <a href="#worlds" className="text-sm text-white/70 hover:text-white transition-colors">
              Worlds
            </a>
            <a href="#contact" className="text-sm text-white/70 hover:text-white transition-colors">
              Contact
            </a>
          </div>

          {/* CTA Button */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/"
              className="px-6 py-2.5 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-medium hover:from-orange-400 hover:to-red-400 transition-all transform hover:scale-105"
            >
              Try CubiQo
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-white/70 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden pb-4 border-t border-white/10">
            <div className="flex flex-col gap-4 pt-4">
              <a href="#features" className="text-sm text-white/70 hover:text-white transition-colors">
                Features
              </a>
              <a href="#demo" className="text-sm text-white/70 hover:text-white transition-colors">
                Demo
              </a>
              <a href="#worlds" className="text-sm text-white/70 hover:text-white transition-colors">
                Worlds
              </a>
              <a href="#contact" className="text-sm text-white/70 hover:text-white transition-colors">
                Contact
              </a>
              <Link
                href="/"
                className="inline-flex justify-center px-6 py-2.5 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-medium"
              >
                Try CubiQo
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
