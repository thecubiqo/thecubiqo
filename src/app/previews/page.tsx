'use client'

import React from 'react'

/**
 * /previews — hub page listing all preview & demo routes.
 *
 * Navigate here to find every visual preview available in the app.
 * No auth required.
 */

const routes = [
  {
    href: '/preview',
    label: 'Frontend (Landing)',
    description: 'Full public landing page — ParticleLanding 3D scene + overlay',
    emoji: '🌐',
  },
  {
    href: '/hero-webgl-preview',
    label: 'Hero WebGL',
    description: 'Wave-thread shader, SoulCore sphere & CubIQo™ 3D wordmark',
    emoji: '✨',
  },
  {
    href: '/neon-cube-preview',
    label: 'Neon Glass Cube',
    description: 'Standalone NeonGlassCube with auto-rotate & orbit controls toggle',
    emoji: '🟦',
  },
  {
    href: '/landing-preview',
    label: 'Tech Landing Cube',
    description: 'TechLandingCube with voice-reaction test button',
    emoji: '🎤',
  },
  {
    href: '/landing-demo',
    label: 'Landing Demo',
    description: 'ParticleLanding scene with LandingOverlay',
    emoji: '🎇',
  },
  {
    href: '/multimodal-demo',
    label: 'Multimodal Demo',
    description: 'Multimodal AI feature demo',
    emoji: '🤖',
  },
  {
    href: '/notifications-demo',
    label: 'Notifications Demo',
    description: 'Unified notifications system demo',
    emoji: '🔔',
  },
  {
    href: '/commerce-demo',
    label: 'Commerce Demo',
    description: 'Commerce / Shopify integration demo',
    emoji: '🛍️',
  },
  {
    href: '/registry-demo',
    label: 'Registry Demo',
    description: 'Agent registry demo',
    emoji: '📋',
  },
  {
    href: '/demo',
    label: 'Feature Flags Demo',
    description: 'Feature flag preview-mode controls',
    emoji: '🚩',
  },
]

const VERCEL_BASE = 'https://cubiqo-repo-git-copilot-preview-16de32-cubiqo-projects-d7156840.vercel.app'
const LOCAL_BASE = 'http://localhost:3000'

const linkRowStyle: React.CSSProperties = { display: 'flex', alignItems: 'baseline', gap: '12px', flexWrap: 'wrap' as const }
const labelStyle: React.CSSProperties = { fontSize: '0.75rem', color: '#7a94c4', minWidth: '90px' }
const linkStyle: React.CSSProperties = { color: '#8bb9fe', fontSize: '0.9rem', wordBreak: 'break-all' }

export default function PreviewsHub() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#050814',
        color: '#fff',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        padding: '48px 24px',
      }}
    >
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1
          style={{
            fontSize: '2rem',
            fontWeight: 300,
            letterSpacing: '0.25em',
            marginBottom: '8px',
            color: '#fff',
          }}
        >
          CUBIQO
        </h1>
        <p
          style={{
            fontSize: '0.85rem',
            color: '#8bb9fe',
            letterSpacing: '0.15em',
            marginBottom: '32px',
            textTransform: 'uppercase',
          }}
        >
          Preview Hub
        </p>

        {/* Quick-access links */}
        <div
          style={{
            padding: '20px 24px',
            background: 'rgba(232,92,0,0.08)',
            border: '1px solid rgba(232,92,0,0.35)',
            borderRadius: '12px',
            marginBottom: '40px',
          }}
        >
          <p style={{ margin: '0 0 12px', fontSize: '0.8rem', color: '#ffa060', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            🔗 Quick access
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={linkRowStyle}>
              <span style={labelStyle}>Vercel (live)</span>
              <a href={`${VERCEL_BASE}/preview`} target="_blank" rel="noreferrer" style={linkStyle}>
                {VERCEL_BASE}/preview
              </a>
            </div>
            <div style={linkRowStyle}>
              <span style={labelStyle}>Local dev</span>
              <a href={`${LOCAL_BASE}/preview`} target="_blank" rel="noreferrer" style={linkStyle}>
                {LOCAL_BASE}/preview
              </a>
            </div>
          </div>
        </div>

        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
          {routes.map(({ href, label, description, emoji }) => (
            <a
              key={href}
              href={href}
              className="block rounded-xl no-underline"
              style={{
                padding: '20px 24px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(139,185,254,0.18)',
                color: 'inherit',
                transition: 'background 0.2s, border-color 0.2s',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget
                el.style.background = 'rgba(139,185,254,0.10)'
                el.style.borderColor = 'rgba(139,185,254,0.45)'
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget
                el.style.background = 'rgba(255,255,255,0.04)'
                el.style.borderColor = 'rgba(139,185,254,0.18)'
              }}
            >
              <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>{emoji}</div>
              <div
                style={{
                  fontSize: '1rem',
                  fontWeight: 500,
                  marginBottom: '4px',
                  color: '#e0eaff',
                }}
              >
                {label}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#7a94c4', lineHeight: 1.5 }}>
                {description}
              </div>
              <div
                style={{
                  marginTop: '12px',
                  fontSize: '0.75rem',
                  color: '#8bb9fe',
                  letterSpacing: '0.05em',
                }}
              >
                {href} →
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
