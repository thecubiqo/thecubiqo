import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { env } from '@/lib/env'

// GET /api/deployments/[id]/preview-frame - Get the actual template HTML with config injected
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const configParam = searchParams.get('config')

    // Get deployment with config
    const deployment = await prisma.deployment.findUnique({
      where: { id },
      include: {
        config: true,
        template: true,
        domain: true,
      },
    })

    if (!deployment) {
      return new NextResponse('Deployment not found', { status: 404 })
    }

    // Use config from query param if provided (for live preview), otherwise use saved config
    let config: any
    if (configParam) {
      try {
        config = JSON.parse(decodeURIComponent(configParam))
      } catch (e) {
        config = deployment.config?.configJson || {}
      }
    } else {
      config = deployment.config?.configJson || {}
    }

    // Generate preview HTML matching template1 structure EXACTLY
    const previewHtml = generateTemplate1PreviewHTML(config, deployment.domain.domainName, env.apiUrl, id)

    return new NextResponse(previewHtml, {
      headers: {
        'Content-Type': 'text/html',
      },
    })
  } catch (error) {
    console.error('Error generating preview frame:', error)
    return new NextResponse('Failed to generate preview', { status: 500 })
  }
}

function hexToRgba(hex: string, alpha: number): string {
  if (!hex || !hex.startsWith('#')) return `rgba(255, 255, 255, ${alpha})`
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function generateTemplate1PreviewHTML(config: any, domainName: string, apiUrl: string, deploymentId: string): string {
  // Extract config with defaults matching original template
  const nav = config.navigation || {}
  const hero = config.hero || {}
  const colors = config.colors || {}
  const devices = config.devices || {}
  const intelligence = config.intelligence || {}
  const video = config.video || {}
  const contact = config.contact || {}
  const merch = config.merch || {}
  const worlds = config.worlds || {}
  const cuboids = config.cuboids || {}
  const footer = config.footer || {}

  // Color system matching original template EXACTLY
  const colorConfig = {
    RED: { hex: 0xc2185b, emissive: 0x8b0a3d, css: '#c2185b' },
    YELLOW: { hex: 0xffa000, emissive: 0xe68a00, css: '#ffa000' },
    GREEN_BLUE: { hex: 0x00897b, emissive: 0x005a52, css: '#00897b' },
    ORANGE: { hex: 0xff6f00, emissive: 0xcc5900, css: '#ff6f00' },
  }

  // Helper to get file URL
  const getFileUrl = (filePath: string | undefined) => {
    if (!filePath) return ''
    if (filePath.startsWith('http')) return filePath
    if (filePath.startsWith('/uploads/')) {
      const parts = filePath.split('/').filter(Boolean)
      if (parts.length >= 3 && parts[0] === 'uploads') {
        const [, depId, ...fileParts] = parts
        const filename = fileParts.join('/')
        return `${apiUrl}/api/uploads/${depId}/${filename}`
      }
      return `${apiUrl}${filePath}`
    }
    return `${apiUrl}/api/uploads/${deploymentId}/${filePath}`
  }

  // Default worlds data matching original
  const defaultWorlds = [
    { id: 'cubiqo', name: 'CubiQo', description: 'Main emotional AI companion', color: 'ORANGE' },
    { id: 'headlines', name: 'Headlines', description: 'News debate with Hari & Ingle', color: 'RED' },
    { id: 'vocspad', name: 'Vocspad', description: 'Voice + keyboard notepad', color: 'YELLOW' },
    { id: 'dicey', name: 'Dicey', description: 'Decision helper', color: 'GREEN_BLUE', customCube: 'dice' },
    { id: 'coqo', name: 'CoQo', description: 'Coming soon', color: 'ORANGE', disabled: true },
    { id: 'settings', name: 'Settings', description: 'System configuration', color: 'GREEN_BLUE', customCube: 'settings' },
  ]

  const worldsData = worlds.items || defaultWorlds

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${hero.headingLine1 || 'Cuz life is'} ${hero.headingLine2 || 'three dimensional'}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      background: #000;
      color: #fff;
      overflow-x: hidden;
    }
    
    /* Canvas positioning */
    #three-canvas {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 0;
      pointer-events: none;
    }
    
    /* Navigation - scroll aware */
    nav {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 50;
      transform: translateY(-100%);
      transition: transform 0.3s ease-out;
    }
    nav.visible {
      transform: translateY(0);
    }
    nav .nav-content {
      background: rgba(0, 0, 0, 0.8);
      backdrop-filter: blur(20px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }
    #intelligence-cube, .world-cube {
      display: block;
      width: 100% !important;
      height: 100% !important;
      min-width: 200px;
      min-height: 200px;
    }
    #cuboids-canvas {
      display: block;
      width: 100%;
      height: 100%;
    }
  </style>
</head>
<body>
  <!-- 3D Background Canvas -->
  <canvas id="three-canvas"></canvas>
  
  <!-- Navigation -->
  <nav id="main-nav">
    <div class="nav-content">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center gap-8">
            <a href="/" class="flex items-center gap-2.5 group">
              ${nav.logoIcon ? `<img src="${getFileUrl(nav.logoIcon)}" alt="Logo" class="w-9 h-9 rounded-lg" />` : `
              <div class="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center transform group-hover:scale-105 transition-transform">
                <span class="text-white text-sm font-bold">${(nav.logoText || 'Q')[0]}</span>
              </div>
              `}
              <span class="font-semibold tracking-wider text-white/90 hidden sm:block">
                ${nav.logoText || 'CubiQo'}
              </span>
            </a>
            <div class="hidden md:flex items-center gap-6">
              ${(nav.links || [
                { label: 'Features', href: '#features' },
                { label: 'Contact', href: '#contact' },
                { label: 'Worlds', href: '#worlds' },
              ]).map((link: any) => `
                <a href="${link.href || '#'}" class="text-sm text-white/60 hover:text-white transition-colors">
                  ${link.label || 'Link'}
                </a>
              `).join('')}
            </div>
          </div>
          <div class="flex items-center gap-4">
            <a href="https://coop.ai" target="_blank" rel="noopener noreferrer" class="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
              <div class="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
              <span class="text-xs text-white/70">Co-op Assist</span>
            </a>
            <button class="md:hidden p-2 text-white/60 hover:text-white" onclick="document.getElementById('mobile-menu').classList.toggle('hidden')">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
        <div id="mobile-menu" class="hidden md:hidden pb-4 border-t border-white/5 mt-2 pt-4">
          <div class="flex flex-col gap-3">
            ${(nav.links || []).map((link: any) => `
              <a href="${link.href || '#'}" class="text-sm text-white/60 hover:text-white transition-colors py-2">
                ${link.label || 'Link'}
              </a>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  </nav>

  <main>
    <!-- Hero Section - EXACT match to original -->
    <section class="relative h-screen w-full overflow-hidden">
      <div class="relative z-20 h-full flex flex-col items-center justify-center px-4">
        <div class="text-center">
          <p class="text-cyan-400 text-xs sm:text-sm tracking-[0.3em] uppercase mb-6">
            ${hero.tagline || 'The Cooperative Virtual Assistant'}
          </p>
          <h1 class="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold mb-6 leading-tight">
            <span class="block bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-transparent">
              ${hero.headingLine1 || 'Cuz life is'}
            </span>
            <span class="block bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              ${hero.headingLine2 || 'three dimensional'}
            </span>
          </h1>
          <p class="text-base sm:text-lg md:text-xl text-white/50 max-w-xl mx-auto mb-10">
            ${hero.subtitle || 'Privacy-first AI companion with infinite memory'}
          </p>
        </div>
        <div class="flex flex-col items-center gap-6">
          <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="${hero.primaryCTA?.href || '#demo'}" class="group px-8 py-3.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium hover:from-cyan-400 hover:to-blue-500 transition-all transform hover:scale-105 shadow-lg shadow-cyan-500/25">
              <span class="flex items-center gap-2">
                ${hero.primaryCTA?.text || 'Start Talking'}
                <svg class="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </span>
            </a>
            <a href="${hero.secondaryCTA?.href || '#demo'}" class="px-8 py-3.5 rounded-full border border-white/20 text-white/80 font-medium hover:bg-white/10 hover:border-white/30 transition-all backdrop-blur-sm">
              ${hero.secondaryCTA?.text || 'Watch Demo'}
            </a>
          </div>
          <button class="group flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 hover:border-cyan-500/30 transition-all">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/40 to-purple-500/40 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-cyan-500/20">
              <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <div class="text-left">
              <span class="block text-sm font-medium text-white group-hover:text-cyan-300 transition-colors">
                ${hero.previewButton?.text || '15 sec preview'}
              </span>
              <span class="block text-xs text-white/50">
                ${hero.previewButton?.subtext || 'See CubiQo in action'}
              </span>
            </div>
          </button>
        </div>
        <div class="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
          <div class="flex flex-col items-center gap-2 animate-bounce">
            <span class="text-xs text-white/40 tracking-widest uppercase">Scroll</span>
            <svg class="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
      </div>
      <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 z-10 pointer-events-none"></div>
      <div class="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent z-10 pointer-events-none"></div>
    </section>

    <!-- Devices Section -->
    <section id="features" class="py-24 bg-black">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex flex-col lg:flex-row items-center justify-center gap-8 mb-16">
          <div class="w-48 h-96 bg-zinc-900/50 rounded-3xl border border-white/10 flex items-center justify-center">
            ${devices.mobileImage ? `<img src="${getFileUrl(devices.mobileImage)}" alt="Mobile" class="w-full h-full object-contain rounded-3xl" />` : '<span class="text-white/40 text-sm">[IMG_MOBILE]</span>'}
          </div>
          <div class="w-32 h-40 bg-zinc-900/50 rounded-2xl border border-white/10 flex items-center justify-center">
            ${devices.watchImage ? `<img src="${getFileUrl(devices.watchImage)}" alt="Watch" class="w-full h-full object-contain rounded-2xl" />` : '<span class="text-white/40 text-sm">[IMG_WATCH]</span>'}
          </div>
          <div class="w-64 h-80 bg-zinc-900/50 rounded-2xl border border-white/10 flex items-center justify-center">
            ${devices.tabletImage ? `<img src="${getFileUrl(devices.tabletImage)}" alt="Tablet" class="w-full h-full object-contain rounded-2xl" />` : '<span class="text-white/40 text-sm">[IMG_TABLET]</span>'}
          </div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          ${(devices.features || [
            { title: 'Privacy First', description: 'Your data stays yours. Local-first architecture with optional sync.' },
            { title: 'Infinite Memory', description: 'Remember everything. Extract and recall memories across conversations.' },
            { title: 'Dual AI Models', description: 'Claude, GPT, and more. Choose the best model for each task.' },
            { title: 'Multi-World', description: 'Headlines, Vocspad, and more. Different modes for different needs.' },
          ]).map((feature: any) => `
            <div class="group p-6 rounded-2xl bg-zinc-900/30 border border-white/5 hover:border-orange-500/30 transition-all hover:bg-zinc-900/50">
              <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center text-orange-400 mb-4 group-hover:scale-110 transition-transform">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 class="text-lg font-semibold text-white mb-2">${feature.title || 'Feature'}</h3>
              <p class="text-sm text-white/60">${feature.description || 'Feature description'}</p>
            </div>
          `).join('')}
        </div>
      </div>
    </section>

    <!-- Intelligence Section - EXACT match -->
    <section class="py-24 bg-gradient-to-b from-black to-zinc-950">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16">
          <p class="text-orange-400 text-sm tracking-widest uppercase mb-4">
            ${intelligence.sectionTagline || 'Beyond Artificial'}
          </p>
          <h2 class="text-3xl sm:text-4xl md:text-5xl font-bold">
            <span class="bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
              ${intelligence.titleLine1 || 'Intelligence,'}
            </span>
            <span class="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
              ${intelligence.titleLine2 || ' Reimagined'}
            </span>
          </h2>
        </div>
        <div class="grid lg:grid-cols-2 gap-12 items-center">
          <div class="relative aspect-square max-w-md mx-auto lg:mx-0">
            <canvas id="intelligence-cube" class="w-full h-full" width="400" height="400"></canvas>
          </div>
          <div class="space-y-8">
            <div>
              <h3 class="text-2xl font-bold text-white mb-4">
                ${intelligence.heading || 'The Cooperative Virtual Assistant'}
              </h3>
              <p class="text-white/60 leading-relaxed">
                ${intelligence.description || "CubiQo is not just another AI. It's a cooperative companion that learns, adapts, and grows with you. Built on principles of privacy, empathy, and genuine understanding."}
              </p>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              ${(intelligence.capabilities || [
                { title: 'Emotional Intelligence', description: 'Understands context, mood, and nuance. Responds with empathy.' },
                { title: 'Voice-First Design', description: 'Natural conversations with multi-voice support.' },
                { title: 'Context Awareness', description: 'Remembers your preferences, history, and patterns.' },
                { title: 'Regional Adaptation', description: 'Adapts language, culture, and references to your region.' },
              ]).map((cap: any) => `
                <div class="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-orange-500/30 transition-colors">
                  <h4 class="text-white font-medium mb-1">${cap.title || 'Capability'}</h4>
                  <p class="text-sm text-white/50">${cap.description || 'Description'}</p>
                </div>
              `).join('')}
            </div>
            <div class="pt-4">
              <a href="https://coop.ai" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group">
                <span class="text-white/80">Learn about CO-OP</span>
                <svg class="w-4 h-4 text-white/60 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Video Section -->
    <section id="demo" class="py-24 bg-zinc-950">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16">
          <p class="text-orange-400 text-sm tracking-widest uppercase mb-4">
            ${video.sectionTagline || 'See It In Action'}
          </p>
          <h2 class="text-3xl sm:text-4xl md:text-5xl font-bold">
            <span class="bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
              ${video.title || 'Meet Qboid &'}
            </span>
            <span class="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
              ${video.subtitle || ' System'}
            </span>
          </h2>
          <p class="mt-4 text-white/60 max-w-2xl mx-auto">
            ${video.description || 'Watch how CubiQo transforms your daily interactions with AI.'}
          </p>
        </div>
        <div class="max-w-4xl mx-auto mb-8">
          <div class="aspect-video bg-zinc-900/50 rounded-2xl border border-white/10 flex items-center justify-center backdrop-blur-sm overflow-hidden group cursor-pointer hover:border-orange-500/30 transition-colors">
            ${video.videoUrl ? `
              <video src="${getFileUrl(video.videoUrl)}" controls class="w-full h-full object-cover"></video>
            ` : `
              <div class="text-center">
                <div class="w-20 h-20 rounded-full bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <svg class="w-10 h-10 text-orange-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                <span class="text-white/40 text-sm">[VIDEO_DEMO]</span>
                <p class="text-white/60 mt-2">Click to play demo</p>
              </div>
            `}
          </div>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          ${(video.thumbnails || [
            { label: 'Getting Started' },
            { label: 'Voice Commands' },
            { label: 'Memory Features' },
            { label: 'Multi-World' },
          ]).map((thumb: any) => `
            <div class="aspect-video bg-zinc-900/30 rounded-xl border border-white/5 flex items-center justify-center hover:border-orange-500/30 cursor-pointer transition-all hover:scale-105">
              <div class="text-center p-4">
                <div class="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-2">
                  <svg class="w-4 h-4 text-white/50" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                <span class="text-xs text-white/60">${thumb.label || 'Thumbnail'}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </section>

    <!-- Contact Section -->
    <section id="contact" class="py-24 bg-gradient-to-b from-zinc-950 to-black relative overflow-hidden">
      <div class="absolute top-1/2 left-1/4 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl"></div>
      <div class="absolute bottom-0 right-1/4 w-64 h-64 bg-red-500/10 rounded-full blur-3xl"></div>
      <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="max-w-2xl mx-auto text-center">
          <p class="text-orange-400 text-sm tracking-widest uppercase mb-4">
            ${contact.sectionTagline || 'Stay Connected'}
          </p>
          <h2 class="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            <span class="bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
              ${contact.title || 'Get in Touch'}
            </span>
          </h2>
          <p class="text-white/60 mb-8">
            ${contact.description || 'Join Cubiqo VIP for early access, updates, and exclusive features.'}
          </p>
          <form class="flex flex-col sm:flex-row gap-4 max-w-md mx-auto" onsubmit="event.preventDefault(); alert('Form submitted!');">
            <input
              type="email"
              placeholder="${contact.formPlaceholder || 'Enter your email'}"
              class="flex-1 px-6 py-3 rounded-full bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-orange-500/50 transition-colors"
              required
            />
            <button
              type="submit"
              class="px-8 py-3 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-medium hover:from-orange-400 hover:to-red-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
            >
              ${contact.buttonText || 'Join VIP'}
            </button>
          </form>
          <div class="mt-12 flex flex-wrap items-center justify-center gap-6 text-white/40 text-sm">
            ${(contact.trustBadges || [
              { text: 'No spam' },
              { text: 'Privacy-first' },
              { text: 'Early access' },
            ]).map((badge: any) => `
              <div class="flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>${badge.text || 'Badge'}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </section>

    <!-- Merch Section -->
    <section class="py-24 bg-black">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <div class="inline-block px-8 py-4 bg-zinc-900/50 rounded-2xl border border-white/10">
            <span class="text-white/40 text-sm">[COOP_LOGO]</span>
          </div>
        </div>
        <div class="text-center mb-12">
          <p class="text-orange-400 text-sm tracking-widest uppercase mb-4">
            ${merch.sectionTagline || 'Official Merch'}
          </p>
          <h2 class="text-3xl sm:text-4xl font-bold">
            <span class="bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
              ${merch.title || 'Wear the Cube'}
            </span>
          </h2>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          ${(merch.items || [
            { name: 'CubiQo Hoodie Black', price: '$75' },
            { name: 'CubiQo Hoodie White', price: '$75' },
          ]).map((item: any, idx: number) => `
            <div class="group relative rounded-2xl overflow-hidden border border-white/10 hover:border-orange-500/30 transition-all">
              <div class="aspect-square bg-zinc-900/50 flex items-center justify-center">
                <span class="text-white/40 text-sm">[IMG_HOODIE_${idx + 1}]</span>
              </div>
              <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-8">
                <button class="px-6 py-2 rounded-full bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors">
                  Coming Soon
                </button>
              </div>
              <div class="p-4 bg-zinc-950">
                <h3 class="text-white font-medium">${item.name || 'Merch Item'}</h3>
                <p class="text-white/60 text-sm">${item.price || '$0'}</p>
              </div>
            </div>
          `).join('')}
        </div>
        <div class="mt-16 max-w-2xl mx-auto">
          <div class="aspect-video bg-zinc-900/30 rounded-2xl border border-white/5 flex items-center justify-center">
            <span class="text-white/40 text-sm">[IMG_COOP]</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Worlds Section -->
    <section id="worlds" class="py-24 bg-gradient-to-b from-black to-zinc-950 relative overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-red-500/5"></div>
      <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16">
          <p class="text-orange-400 text-sm tracking-widest uppercase mb-4">
            ${worlds.sectionTagline || 'Explore Different Modes'}
          </p>
          <h2 class="text-3xl sm:text-4xl md:text-5xl font-bold">
            <span class="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
              ${worlds.title || 'CUBIQO WORLDS'}
            </span>
          </h2>
          <p class="mt-4 text-white/60 max-w-2xl mx-auto">
            ${worlds.description || 'Each world is a unique AI experience tailored for specific tasks.'}
          </p>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          ${worldsData.map((world: any) => `
            <a href="${world.href || '#'}" class="group relative rounded-2xl border border-white/10 overflow-hidden transition-all hover:border-orange-500/30 hover:scale-105 ${world.disabled ? 'pointer-events-none opacity-50' : ''}">
              <div class="aspect-square p-4">
                <canvas class="world-cube world-${world.id}" data-color="${world.color || 'ORANGE'}" data-custom="${world.customCube || ''}" width="200" height="200"></canvas>
              </div>
              <div class="p-4 bg-zinc-950/80 border-t border-white/5">
                <h3 class="text-white font-semibold">${world.name || 'World'}</h3>
                <p class="text-xs text-white/50">${world.description || 'Description'}</p>
              </div>
              ${!world.disabled ? `
                <div class="absolute inset-0 bg-gradient-to-t from-orange-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              ` : ''}
            </a>
          `).join('')}
        </div>
        <div class="mt-16 text-center">
          <div class="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/5 border border-white/10">
            <div class="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center">
              <svg class="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <span class="text-white/70 text-sm">
              Each world has voice and chat modes
            </span>
          </div>
        </div>
      </div>
    </section>

    <!-- Cuboids Section -->
    <section class="relative h-[600px] md:h-[700px] overflow-hidden bg-[#050515]">
      <div class="absolute inset-0 opacity-30" style="background-image: url(&quot;data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='49' viewBox='0 0 28 49'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%238000ff' fill-opacity='0.4'%3E%3Cpath d='M13.99 9.25l13 7.5v15l-13 7.5L1 31.75v-15l12.99-7.5zM3 17.9v12.7l10.99 6.34 11-6.35V17.9l-11-6.34L3 17.9zM0 15l12.98-7.5V0h-2v6.35L0 12.69v2.3zm0 18.5L12.98 41v8h-2v-6.85L0 35.81v-2.3zM15 0v7.5L27.99 15H28v-2.31h-.01L17 6.35V0h-2zm0 49v-8l12.99-7.5H28v2.31h-.01L17 42.15V49h-2z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E&quot;);"></div>
      <canvas id="cuboids-canvas" class="absolute inset-0"></canvas>
      <div class="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30 pointer-events-none z-10"></div>
      <div class="absolute inset-0 bg-gradient-to-r from-purple-900/20 via-transparent to-blue-900/20 pointer-events-none z-10"></div>
      <div class="relative z-20 h-full flex flex-col items-center justify-center px-4">
        <div class="mb-8">
          <div class="w-24 h-24 rounded-2xl bg-gradient-to-br from-cyan-400/50 to-purple-500/50 border-2 border-cyan-400/50 flex items-center justify-center backdrop-blur-sm shadow-lg shadow-cyan-500/30">
            <span class="text-4xl font-bold bg-gradient-to-br from-cyan-300 to-purple-300 bg-clip-text text-transparent drop-shadow-lg">
              Q
            </span>
          </div>
        </div>
        <h3 class="text-3xl md:text-4xl font-bold text-center mb-4">
          <span class="bg-gradient-to-r from-cyan-300 via-blue-300 to-purple-300 bg-clip-text text-transparent drop-shadow-lg">
            ${cuboids.title || 'Meet CoQo'}
          </span>
        </h3>
        <p class="text-white/70 text-center max-w-md text-sm md:text-base">
          ${cuboids.description || 'Your AI companion in the CUBIQO ecosystem'}
        </p>
      </div>
      <div class="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent z-10 pointer-events-none"></div>
    </section>
  </main>

  <!-- Footer -->
  <footer class="bg-black border-t border-white/10">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
        <div class="col-span-2 md:col-span-1">
          <a href="/" class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
              <span class="text-white text-lg font-bold">${(footer.brandName || 'Q')[0]}</span>
            </div>
            <span class="font-bold tracking-widest">${footer.brandName || 'CubiQo™'}</span>
          </a>
          <p class="text-sm text-white/50 mb-4">
            ${footer.brandDescription || 'The Cooperative Virtual Assistant. Privacy-first AI companion.'}
          </p>
          <div class="flex flex-wrap gap-2">
            <a href="#" class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
              <svg class="w-5 h-5 text-white/70" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              <span class="text-xs text-white/70">App Store</span>
            </a>
            <a href="#" class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
              <svg class="w-5 h-5 text-white/70" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
              </svg>
              <span class="text-xs text-white/70">Google Play</span>
            </a>
          </div>
        </div>
        <div>
          <h4 class="text-sm font-semibold text-white mb-4">Product</h4>
          <ul class="space-y-2">
            ${(footer.productLinks || [
              { label: 'Features', href: '#features' },
              { label: 'Demo', href: '#demo' },
              { label: 'Worlds', href: '#worlds' },
              { label: 'Pricing', href: '#' },
            ]).map((link: any) => `
              <li><a href="${link.href || '#'}" class="text-sm text-white/50 hover:text-white transition-colors">${link.label || 'Link'}</a></li>
            `).join('')}
          </ul>
        </div>
        <div>
          <h4 class="text-sm font-semibold text-white mb-4">Company</h4>
          <ul class="space-y-2">
            ${(footer.companyLinks || [
              { label: 'About', href: '#' },
              { label: 'Blog', href: '#' },
              { label: 'Careers', href: '#' },
              { label: 'Contact', href: '#contact' },
            ]).map((link: any) => `
              <li><a href="${link.href || '#'}" class="text-sm text-white/50 hover:text-white transition-colors">${link.label || 'Link'}</a></li>
            `).join('')}
          </ul>
        </div>
        <div>
          <h4 class="text-sm font-semibold text-white mb-4">Legal</h4>
          <ul class="space-y-2">
            ${(footer.legalLinks || [
              { label: 'Privacy', href: '#' },
              { label: 'Terms', href: '#' },
              { label: 'Cookies', href: '#' },
            ]).map((link: any) => `
              <li><a href="${link.href || '#'}" class="text-sm text-white/50 hover:text-white transition-colors">${link.label || 'Link'}</a></li>
            `).join('')}
          </ul>
        </div>
      </div>
      <div class="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p class="text-sm text-white/40">
          ${footer.copyrightText || `© ${new Date().getFullYear()} ${domainName}. All rights reserved.`}
        </p>
        <div class="flex items-center gap-4">
          <a href="#" class="text-white/40 hover:text-white transition-colors">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </a>
          <a href="#" class="text-white/40 hover:text-white transition-colors">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
            </svg>
          </a>
          <a href="#" class="text-white/40 hover:text-white transition-colors">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
            </svg>
          </a>
          <a href="#" class="text-white/40 hover:text-white transition-colors">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z"/>
            </svg>
          </a>
        </div>
      </div>
    </div>
  </footer>

  <script type="module">
    import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.181.0/build/three.module.js';
    
    // Navigation scroll handler
    const nav = document.getElementById('main-nav');
    let lastScrollY = window.scrollY;
    window.addEventListener('scroll', () => {
      const scrollY = window.scrollY;
      const heroHeight = window.innerHeight;
      if (scrollY > heroHeight * 0.8) {
        nav.classList.add('visible');
      } else {
        nav.classList.remove('visible');
      }
      lastScrollY = scrollY;
    });

    // Hero background - Metallic cubes with reflective floor
    const heroCanvas = document.getElementById('three-canvas');
    const heroScene = new THREE.Scene();
    const heroCamera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
    heroCamera.position.set(0, 0, 10);
    const heroRenderer = new THREE.WebGLRenderer({ canvas: heroCanvas, alpha: true, antialias: true });
    heroRenderer.setSize(window.innerWidth, window.innerHeight);
    heroRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    heroScene.background = new THREE.Color('#050508');
    heroScene.fog = new THREE.Fog('#050508', 10, 30);
    
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    heroScene.add(ambientLight);
    const dirLight1 = new THREE.DirectionalLight(0x4a9eff, 0.8);
    dirLight1.position.set(5, 5, 5);
    heroScene.add(dirLight1);
    const dirLight2 = new THREE.DirectionalLight(0xff4a8d, 0.5);
    dirLight2.position.set(-5, 3, -5);
    heroScene.add(dirLight2);
    const pointLight = new THREE.PointLight(0xffffff, 0.5);
    pointLight.position.set(0, 5, 0);
    heroScene.add(pointLight);
    
    const heroCubes = [];
    for (let i = 0; i < 30; i++) {
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshStandardMaterial({
        color: '#1a1a2e',
        metalness: 0.9,
        roughness: 0.1,
        envMapIntensity: 1.5,
      });
      const cube = new THREE.Mesh(geometry, material);
      cube.position.x = (Math.random() - 0.5) * 20;
      cube.position.y = (Math.random() - 0.5) * 10;
      cube.position.z = -5 - Math.random() * 15;
      cube.scale.setScalar(0.3 + Math.random() * 1.2);
      cube.userData = {
        rotationSpeed: 0.1 + Math.random() * 0.3,
        floatSpeed: 0.3 + Math.random() * 0.5,
        floatAmplitude: 0.2 + Math.random() * 0.5,
        initialY: cube.position.y,
        delay: Math.random() * 10,
      };
      heroScene.add(cube);
      heroCubes.push(cube);
    }
    
    // Reflective floor
    const floorGeometry = new THREE.PlaneGeometry(50, 50);
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: '#0a0a0f',
      metalness: 0.8,
      roughness: 0.8,
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -6;
    floor.position.z = -10;
    heroScene.add(floor);
    
    const gridHelper = new THREE.GridHelper(50, 50, '#1a1a2e', '#1a1a2e');
    gridHelper.position.y = -5.9;
    gridHelper.position.z = -10;
    heroScene.add(gridHelper);
    
    const heroClock = new THREE.Clock();
    function animateHero() {
      requestAnimationFrame(animateHero);
      const time = heroClock.getElapsedTime();
      heroCubes.forEach(cube => {
        const { rotationSpeed, floatSpeed, floatAmplitude, initialY, delay } = cube.userData;
        cube.rotation.x = (time + delay) * rotationSpeed * 0.3;
        cube.rotation.y = (time + delay) * rotationSpeed * 0.5;
        cube.position.y = initialY + Math.sin((time + delay) * floatSpeed) * floatAmplitude;
      });
      heroRenderer.render(heroScene, heroCamera);
    }
    animateHero();
    
    window.addEventListener('resize', () => {
      heroCamera.aspect = window.innerWidth / window.innerHeight;
      heroCamera.updateProjectionMatrix();
      heroRenderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Intelligence Cube - RED color, thinking animation
    const intelCanvas = document.getElementById('intelligence-cube');
    if (intelCanvas) {
      // Wait for canvas to be properly sized
      setTimeout(() => {
        const intelScene = new THREE.Scene();
        const intelCamera = new THREE.PerspectiveCamera(45, intelCanvas.clientWidth / intelCanvas.clientHeight || 1, 0.1, 1000);
        intelCamera.position.set(0, 0, 6);
        const intelRenderer = new THREE.WebGLRenderer({ canvas: intelCanvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
        intelRenderer.setSize(intelCanvas.clientWidth || 400, intelCanvas.clientHeight || 400);
        intelRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        intelRenderer.shadowMap.enabled = true;
        
        // Environment map for reflections (simplified)
        const envScene = new THREE.Scene();
        envScene.background = new THREE.Color(0x222222);
        const pmremGenerator = new THREE.PMREMGenerator(intelRenderer);
        pmremGenerator.compileEquirectangularShader();
        let envMap;
        try {
          envMap = pmremGenerator.fromScene(envScene, 0.04).texture;
        } catch (e) {
          // Fallback if PMREMGenerator fails
          envMap = null;
        }
        
        const intelAmbient = new THREE.AmbientLight(0xffffff, 0.6);
        intelScene.add(intelAmbient);
        const intelSpot1 = new THREE.SpotLight(0xffffff, 0.8);
        intelSpot1.position.set(5, 8, 5);
        intelSpot1.angle = Math.PI / 6;
        intelSpot1.penumbra = 0.5;
        intelSpot1.castShadow = true;
        intelSpot1.shadow.mapSize.width = 1024;
        intelSpot1.shadow.mapSize.height = 1024;
        intelScene.add(intelSpot1);
        const intelSpot2 = new THREE.SpotLight(0xffffff, 0.5);
        intelSpot2.position.set(-5, 5, -5);
        intelSpot2.angle = Math.PI / 4;
        intelSpot2.penumbra = 0.5;
        intelScene.add(intelSpot2);
        
        const color = colorConfig.RED;
        
      // Create cube with rounded appearance (using higher segments)
      const cubeSize = 2;
      const cubeGeometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize, 8, 8, 8);
      const cubeMaterial = new THREE.MeshPhysicalMaterial({
        color: color.hex,
        metalness: 0.4,
        roughness: 0.3,
        transparent: true,
        opacity: 0.85,
        transmission: 0.3,
        thickness: 0.5,
        clearcoat: 0.5,
        clearcoatRoughness: 0.2,
        emissive: color.emissive,
            emissiveIntensity: 0.9, // Match glowIntensity from RED color
            ior: 1.5,
            ...(envMap ? { envMap: envMap, envMapIntensity: 1.0 } : {}),
      });
      const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
      cube.castShadow = true;
      intelScene.add(cube);
      
      // Contact shadows (simplified - using plane)
      const shadowPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(10, 10),
        new THREE.ShadowMaterial({ opacity: 0.4 })
      );
      shadowPlane.rotation.x = -Math.PI / 2;
      shadowPlane.position.y = -2;
      shadowPlane.receiveShadow = true;
      intelScene.add(shadowPlane);
      
      // Eyes
      const eyeGeometry = new THREE.CircleGeometry(0.15, 32);
      const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
      const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
      leftEye.position.set(-0.3, 0.3, 1.01);
      intelScene.add(leftEye);
      const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
      rightEye.position.set(0.3, 0.3, 1.01);
      intelScene.add(rightEye);
      
      const pupilGeometry = new THREE.CircleGeometry(0.08, 32);
      const pupilMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const leftPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
      leftPupil.position.set(-0.3, 0.3, 1.02);
      intelScene.add(leftPupil);
      const rightPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
      rightPupil.position.set(0.3, 0.3, 1.02);
      intelScene.add(rightPupil);
      
      const intelClock = new THREE.Clock();
      function animateIntel() {
        requestAnimationFrame(animateIntel);
        const time = intelClock.getElapsedTime();
        // Thinking animation - V-shaped movement
        const vSpeed = 0.4;
        const vProgress = (time * vSpeed) % 2;
        let vAngle = 0;
        if (vProgress < 1) {
          vAngle = -vProgress * (12 * Math.PI / 180);
        } else {
          vAngle = -(2 - vProgress) * (12 * Math.PI / 180);
        }
        cube.rotation.x = vAngle;
        cube.rotation.z = Math.sin(time * 0.3) * (3 * Math.PI / 180);
        cube.rotation.y = time * 0.3;
        intelRenderer.render(intelScene, intelCamera);
      }
      animateIntel();
      
      const resizeIntel = () => {
        const width = intelCanvas.clientWidth || 400;
        const height = intelCanvas.clientHeight || 400;
        intelCamera.aspect = width / height;
        intelCamera.updateProjectionMatrix();
        intelRenderer.setSize(width, height);
      };
      window.addEventListener('resize', resizeIntel);
      // Initial resize
      resizeIntel();
      }, 100);
    }

    // Worlds Cubes - with custom cubes for dice and settings
    const worldCanvases = document.querySelectorAll('.world-cube');
    worldCanvases.forEach((canvas: HTMLCanvasElement) => {
      // Wait for canvas to be properly sized
      setTimeout(() => {
        const colorName = canvas.dataset.color || 'ORANGE';
        const customCube = canvas.dataset.custom || '';
        const color = colorConfig[colorName] || colorConfig.ORANGE;
        
        const scene = new THREE.Scene();
        const width = canvas.clientWidth || 200;
        const height = canvas.clientHeight || 200;
        const camera = new THREE.PerspectiveCamera(40, width / height || 1, 0.1, 1000);
        camera.position.set(0, 0, 3);
        const renderer = new THREE.WebGLRenderer({ canvas: canvas as HTMLCanvasElement, alpha: true, antialias: true, powerPreference: 'high-performance' });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        
        // Environment map for reflections (simplified)
        const envScene = new THREE.Scene();
        envScene.background = new THREE.Color(0x222222);
        const pmremGenerator = new THREE.PMREMGenerator(renderer);
        pmremGenerator.compileEquirectangularShader();
        let envMap;
        try {
          envMap = pmremGenerator.fromScene(envScene, 0.04).texture;
        } catch (e) {
          // Fallback if PMREMGenerator fails
          envMap = null;
        }
        
        const ambient = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambient);
        const spot1 = new THREE.DirectionalLight(0xffffff, 0.8);
        spot1.position.set(5, 5, 5);
        scene.add(spot1);
        const spot2 = new THREE.DirectionalLight(0xffffff, 0.5);
        spot2.position.set(-5, 5, -5);
        scene.add(spot2);
        const pointLight = new THREE.PointLight(0x00ffff, 0.3);
        pointLight.position.set(-3, -3, -3);
        scene.add(pointLight);
        
        if (customCube === 'dice') {
          // Dice cube with rounded box appearance
          const diceGeo = new THREE.BoxGeometry(1, 1, 1, 4, 4, 4);
          const diceMat = new THREE.MeshStandardMaterial({
            color: '#0a2030',
            metalness: 0.8,
            roughness: 0.2,
            emissive: '#004455',
            emissiveIntensity: 0.3,
            ...(envMap ? { envMap: envMap } : {}),
          });
          const diceCube = new THREE.Mesh(diceGeo, diceMat);
          scene.add(diceCube);
          
          // Add dots on all faces
          const dotGeo = new THREE.SphereGeometry(0.08, 16, 16);
          const dotMat = new THREE.MeshStandardMaterial({
            color: '#ffffff',
            emissive: '#00ffff',
            emissiveIntensity: 0.5,
          });
          // Front face - 1 dot
          const dot1 = new THREE.Mesh(dotGeo, dotMat);
          dot1.position.set(0, 0, 0.52);
          scene.add(dot1);
          // Back face - 2 dots
          const dot2a = new THREE.Mesh(dotGeo, dotMat);
          dot2a.position.set(0.2, 0.2, -0.52);
          scene.add(dot2a);
          const dot2b = new THREE.Mesh(dotGeo, dotMat);
          dot2b.position.set(-0.2, -0.2, -0.52);
          scene.add(dot2b);
          // Top face - 3 dots
          const dot3a = new THREE.Mesh(dotGeo, dotMat);
          dot3a.position.set(-0.2, 0.52, -0.2);
          scene.add(dot3a);
          const dot3b = new THREE.Mesh(dotGeo, dotMat);
          dot3b.position.set(0, 0.52, 0);
          scene.add(dot3b);
          const dot3c = new THREE.Mesh(dotGeo, dotMat);
          dot3c.position.set(0.2, 0.52, 0.2);
          scene.add(dot3c);
          
          const clock = new THREE.Clock();
          function animate() {
            requestAnimationFrame(animate);
            const time = clock.getElapsedTime();
            diceCube.rotation.x = Math.sin(time * 0.5) * 0.1;
            diceCube.rotation.y = time * 0.3;
            // Rotate dots with cube
            [dot1, dot2a, dot2b, dot3a, dot3b, dot3c].forEach(dot => {
              dot.rotation.copy(diceCube.rotation);
            });
            renderer.render(scene, camera);
          }
          animate();
        } else if (customCube === 'settings') {
          // Settings cube with code texture
          const settingsGeo = new THREE.BoxGeometry(1, 1, 1, 4, 4, 4);
          // Create code texture
          const codeCanvas = document.createElement('canvas');
          codeCanvas.width = 256;
          codeCanvas.height = 256;
          const ctx = codeCanvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#0a1520';
            ctx.fillRect(0, 0, 256, 256);
            ctx.font = '10px monospace';
            ctx.fillStyle = '#00ff88';
            const lines = [
              'cubiqo.color.lock()',
              'cubiqo.animation.set()',
              'cubiqo.voice.enable()',
              'cubiqo.memory.sync()',
              'cubiqo.theme.dark()',
              'cubiqo.reset()',
            ];
            lines.forEach((line, i) => {
              ctx.fillText(line, 10, 30 + i * 35);
            });
          }
          const codeTexture = new THREE.CanvasTexture(codeCanvas);
          codeTexture.needsUpdate = true;
          
          const settingsMat = new THREE.MeshStandardMaterial({
            color: '#1a1a2e',
            metalness: 0.7,
            roughness: 0.3,
            emissive: '#00ff88',
            emissiveIntensity: 0.1,
            ...(envMap ? { envMap: envMap } : {}),
          });
          const settingsCube = new THREE.Mesh(settingsGeo, settingsMat);
          scene.add(settingsCube);
          
          // Code panels on sides
          const panelGeo = new THREE.PlaneGeometry(0.9, 0.9);
          const panelMat = new THREE.MeshStandardMaterial({
            map: codeTexture,
            transparent: true,
            opacity: 0.9,
            emissive: '#00ff88',
            emissiveIntensity: 0.2,
          });
          const faces = [
            { pos: [0, 0, 0.51], rot: [0, 0, 0] },
            { pos: [0, 0, -0.51], rot: [0, Math.PI, 0] },
            { pos: [0.51, 0, 0], rot: [0, Math.PI / 2, 0] },
            { pos: [-0.51, 0, 0], rot: [0, -Math.PI / 2, 0] },
          ];
          faces.forEach(face => {
            const panel = new THREE.Mesh(panelGeo, panelMat.clone());
            panel.position.set(...face.pos);
            panel.rotation.set(...face.rot);
            scene.add(panel);
          });
          
          const clock = new THREE.Clock();
          function animate() {
            requestAnimationFrame(animate);
            const time = clock.getElapsedTime();
            settingsCube.rotation.y = time * 0.2;
            renderer.render(scene, camera);
          }
          animate();
        } else {
          // Regular cube with eyes - using higher segments for rounded appearance
          const cubeGeo = new THREE.BoxGeometry(2, 2, 2, 8, 8, 8);
          const cubeMat = new THREE.MeshPhysicalMaterial({
            color: color.hex,
            metalness: 0.4,
            roughness: 0.3,
            transparent: true,
            opacity: 0.85,
            transmission: 0.3,
            thickness: 0.5,
            clearcoat: 0.5,
            clearcoatRoughness: 0.2,
            emissive: color.emissive,
            emissiveIntensity: color === colorConfig.ORANGE ? 0.5 : color === colorConfig.RED ? 0.9 : color === colorConfig.YELLOW ? 0.7 : 0.6,
            ior: 1.5,
            ...(envMap ? { envMap: envMap, envMapIntensity: 1.0 } : {}),
          });
          const worldCube = new THREE.Mesh(cubeGeo, cubeMat);
          worldCube.castShadow = true;
          scene.add(worldCube);
          
          // Contact shadows
          const shadowPlane = new THREE.Mesh(
            new THREE.PlaneGeometry(10, 10),
            new THREE.ShadowMaterial({ opacity: 0.4 })
          );
          shadowPlane.rotation.x = -Math.PI / 2;
          shadowPlane.position.y = -2;
          shadowPlane.receiveShadow = true;
          scene.add(shadowPlane);
          
          const eyeGeo = new THREE.CircleGeometry(0.15, 32);
          const eyeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
          const le = new THREE.Mesh(eyeGeo, eyeMat);
          le.position.set(-0.3, 0.3, 1.01);
          scene.add(le);
          const re = new THREE.Mesh(eyeGeo, eyeMat);
          re.position.set(0.3, 0.3, 1.01);
          scene.add(re);
          
          const pupilGeo = new THREE.CircleGeometry(0.08, 32);
          const pupilMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
          const lp = new THREE.Mesh(pupilGeo, pupilMat);
          lp.position.set(-0.3, 0.3, 1.02);
          scene.add(lp);
          const rp = new THREE.Mesh(pupilGeo, pupilMat);
          rp.position.set(0.3, 0.3, 1.02);
          scene.add(rp);
          
          const clock = new THREE.Clock();
          function animate() {
            requestAnimationFrame(animate);
            const time = clock.getElapsedTime();
            worldCube.rotation.x = Math.sin(time * 0.5) * 0.1;
            worldCube.rotation.y = time * 0.3;
            renderer.render(scene, camera);
          }
          animate();
        }
        
        const resizeWorld = () => {
          const w = canvas.clientWidth || 200;
          const h = canvas.clientHeight || 200;
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        };
        window.addEventListener('resize', resizeWorld);
        resizeWorld();
      }, 100);
    });

    // Cuboids Section - 60 floating cyan cubes
    const cuboidsCanvas = document.getElementById('cuboids-canvas');
    if (cuboidsCanvas) {
      const cuboidsScene = new THREE.Scene();
      const cuboidsCamera = new THREE.PerspectiveCamera(45, cuboidsCanvas.clientWidth / cuboidsCanvas.clientHeight, 0.1, 1000);
      cuboidsCamera.position.set(0, 0, 8);
      const cuboidsRenderer = new THREE.WebGLRenderer({ canvas: cuboidsCanvas as HTMLCanvasElement, alpha: true, antialias: true });
      cuboidsRenderer.setSize(cuboidsCanvas.clientWidth, cuboidsCanvas.clientHeight);
      cuboidsRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      cuboidsScene.background = new THREE.Color('#050515');
      
      const cuboidsAmbient = new THREE.AmbientLight(0xffffff, 0.3);
      cuboidsScene.add(cuboidsAmbient);
      const cuboidsDir1 = new THREE.DirectionalLight(0x00ffff, 1);
      cuboidsDir1.position.set(5, 5, 5);
      cuboidsScene.add(cuboidsDir1);
      const cuboidsDir2 = new THREE.DirectionalLight(0xff00ff, 0.8);
      cuboidsDir2.position.set(-5, 3, -5);
      cuboidsScene.add(cuboidsDir2);
      const cuboidsPoint1 = new THREE.PointLight(0x00ffff, 2, 20);
      cuboidsPoint1.position.set(0, 0, 8);
      cuboidsScene.add(cuboidsPoint1);
      const cuboidsPoint2 = new THREE.PointLight(0x8000ff, 1, 15);
      cuboidsPoint2.position.set(-5, 2, 3);
      cuboidsScene.add(cuboidsPoint2);
      const cuboidsPoint3 = new THREE.PointLight(0x00e5ff, 1, 15);
      cuboidsPoint3.position.set(5, -2, 3);
      cuboidsScene.add(cuboidsPoint3);
      
      const cuboidsCubes = [];
      const cuboidsGroups = [];
      const colors = ['#00e5ff', '#00bfff', '#00ffff', '#40e0ff', '#00d4ff', '#66ffff'];
      for (let i = 0; i < 60; i++) {
        const cubeColor = colors[Math.floor(Math.random() * colors.length)];
        const emissiveIntensity = 0.5 + Math.random() * 0.8;
        
        // Create group for cube + edges + sphere
        const cubeGroup = new THREE.Group();
        
        // Main cube with bright glow
        const geo = new THREE.BoxGeometry(1, 1, 1);
        const mat = new THREE.MeshStandardMaterial({
          color: cubeColor,
          metalness: 0.3,
          roughness: 0.1,
          emissive: cubeColor,
          emissiveIntensity: emissiveIntensity * 3,
          envMapIntensity: 1,
          transparent: true,
          opacity: 0.9,
        });
        const cuboid = new THREE.Mesh(geo, mat);
        cubeGroup.add(cuboid);
        
        // Purple/magenta edges
        const edgesGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(1.02, 1.02, 1.02));
        const edgesMat = new THREE.LineBasicMaterial({
          color: 0xff00ff,
          transparent: true,
          opacity: 0.8,
        });
        const edges = new THREE.LineSegments(edgesGeo, edgesMat);
        cubeGroup.add(edges);
        
        // Inner glow sphere
        const sphereGeo = new THREE.SphereGeometry(0.35, 16, 16);
        const sphereMat = new THREE.MeshBasicMaterial({
          color: cubeColor,
          transparent: true,
          opacity: 0.6,
        });
        const sphere = new THREE.Mesh(sphereGeo, sphereMat);
        cubeGroup.add(sphere);
        
        cubeGroup.position.x = (Math.random() - 0.5) * 18;
        cubeGroup.position.y = (Math.random() - 0.5) * 10;
        cubeGroup.position.z = -1 - Math.random() * 12;
        cubeGroup.scale.setScalar(0.2 + Math.random() * 0.7);
        cubeGroup.userData = {
          rotationSpeed: 0.15 + Math.random() * 0.4,
          floatSpeed: 0.3 + Math.random() * 0.5,
          floatAmplitude: 0.2 + Math.random() * 0.5,
          initialY: cubeGroup.position.y,
          cuboid: cuboid,
          edges: edges,
        };
        cuboidsScene.add(cubeGroup);
        cuboidsCubes.push(cubeGroup);
        cuboidsGroups.push(cubeGroup);
      }
      
      cuboidsScene.fog = new THREE.Fog('#0a0020', 8, 25);
      
      const cuboidsClock = new THREE.Clock();
      function animateCuboids() {
        requestAnimationFrame(animateCuboids);
        const time = cuboidsClock.getElapsedTime();
        cuboidsCubes.forEach(cubeGroup => {
          const { rotationSpeed, floatSpeed, floatAmplitude, initialY, cuboid, edges } = cubeGroup.userData;
          // Rotate the cube mesh
          cuboid.rotation.x = time * rotationSpeed * 0.2;
          cuboid.rotation.y = time * rotationSpeed * 0.3;
          // Copy rotation to edges
          if (edges) {
            edges.rotation.copy(cuboid.rotation);
          }
          // Floating motion on the group
          cubeGroup.position.y = initialY + Math.sin(time * floatSpeed) * floatAmplitude;
        });
        cuboidsRenderer.render(cuboidsScene, cuboidsCamera);
      }
      animateCuboids();
      
      window.addEventListener('resize', () => {
        cuboidsCamera.aspect = cuboidsCanvas.clientWidth / cuboidsCanvas.clientHeight;
        cuboidsCamera.updateProjectionMatrix();
        cuboidsRenderer.setSize(cuboidsCanvas.clientWidth, cuboidsCanvas.clientHeight);
      });
    }
  </script>
</body>
</html>`
}
