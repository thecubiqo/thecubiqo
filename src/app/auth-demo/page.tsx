'use client'

/**
 * Auth Demo Page - Showcases the auth UI with provider buttons
 * No Supabase connection required - just UI demonstration
 */

import { useState } from 'react'

export default function AuthDemoPage() {
  const [showSuccess, setShowSuccess] = useState(false)
  const [email, setEmail] = useState('user@example.com')

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Auth UI Demo - Magic Link with Provider Buttons
          </h1>
          <p className="text-zinc-400 text-sm">
            This page demonstrates the enhanced magic link authentication UI with Gmail/Outlook quick access buttons.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* LoginForm Style (Light background) */}
          <div className="bg-gradient-to-b from-zinc-800 to-zinc-900 rounded-2xl p-8 border border-zinc-700">
            <h2 className="text-xl font-semibold text-white mb-4">LoginForm Component</h2>
            <p className="text-zinc-400 text-sm mb-6">Standard login form with success state</p>
            
            <div className="bg-gradient-to-br from-zinc-900/80 to-black/80 rounded-xl p-6">
              {!showSuccess ? (
                <div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email address"
                    className="w-full px-4 py-3.5 rounded-[12px] text-[15px] text-gray-900 placeholder-gray-400 outline-none transition-all bg-white/95 border border-transparent focus:border-white/40 mb-4"
                  />
                  <button
                    onClick={() => setShowSuccess(true)}
                    className="w-full py-3.5 rounded-[12px] bg-white text-gray-900 text-[15px] font-medium transition-opacity hover:opacity-85"
                  >
                    Continue
                  </button>
                  <p className="text-center text-[12px] text-white/35 mt-4">
                    We'll email you a secure sign-in link.
                  </p>
                </div>
              ) : (
                <div>
                  <div className="mt-4 p-3 rounded-[12px] text-[13px] bg-green-500/10 text-green-400">
                    Check your email for the magic link!
                    
                    {/* Provider buttons */}
                    <div className="mt-4 space-y-2">
                      <p className="text-white/50 text-[11px]">Quick access:</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            console.log('[LoginForm] Gmail button clicked')
                            alert('Gmail clicked! (Would open https://mail.google.com)')
                          }}
                          className="flex-1 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-[8px] text-white text-[12px] transition-colors flex items-center justify-center gap-1.5"
                        >
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"/>
                          </svg>
                          Gmail
                        </button>
                        <button
                          onClick={() => {
                            console.log('[LoginForm] Outlook button clicked')
                            alert('Outlook clicked! (Would open https://outlook.live.com)')
                          }}
                          className="flex-1 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-[8px] text-white text-[12px] transition-colors flex items-center justify-center gap-1.5"
                        >
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M24 7.387v9.226a.614.614 0 0 1-.614.614h-8.745a.614.614 0 0 1-.614-.614v-2.826h-2.641v2.826a.614.614 0 0 1-.614.614H2.027a.614.614 0 0 1-.614-.614V7.387c0-.339.275-.614.614-.614h8.745c.339 0 .614.275.614.614v2.826h2.641V7.387c0-.339.275-.614.614-.614h8.745c.339 0 .614.275.614.614z"/>
                          </svg>
                          Outlook
                        </button>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowSuccess(false)}
                    className="mt-4 text-sm text-zinc-400 hover:text-white"
                  >
                    ← Back to form
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* AuthNudgeModal Style (Dark premium) */}
          <div className="bg-gradient-to-b from-zinc-800 to-zinc-900 rounded-2xl p-8 border border-zinc-700">
            <h2 className="text-xl font-semibold text-white mb-4">AuthNudgeModal Component</h2>
            <p className="text-zinc-400 text-sm mb-6">Premium modal-style authentication</p>
            
            <div className="relative bg-gradient-to-b from-zinc-900 to-zinc-950 rounded-2xl shadow-2xl border border-zinc-800 overflow-hidden">
              {/* Glow effects */}
              <div className="absolute -top-10 -left-10 w-32 h-32 bg-orange-500/20 rounded-full blur-3xl" />
              <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl" />
              
              <div className="relative p-8">
                {/* Success state with provider buttons */}
                <div className="text-center py-4">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                    <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-light text-white mb-2">
                    Check your email
                  </h2>
                  <p className="text-zinc-400 text-sm mb-6">
                    We sent a magic link to <span className="text-white">{email}</span>
                  </p>
                  <p className="text-zinc-500 text-xs mb-6">
                    Click the link to connect. I'll be waiting.
                  </p>

                  {/* Provider buttons */}
                  <div className="space-y-2">
                    <p className="text-zinc-600 text-xs mb-3">Quick access:</p>
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => {
                          console.log('[AuthNudgeModal] Gmail button clicked')
                          alert('Gmail clicked! (Would open https://mail.google.com)')
                        }}
                        className="flex-1 px-4 py-2.5 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm transition-colors flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"/>
                        </svg>
                        Gmail
                      </button>
                      <button
                        onClick={() => {
                          console.log('[AuthNudgeModal] Outlook button clicked')
                          alert('Outlook clicked! (Would open https://outlook.live.com)')
                        }}
                        className="flex-1 px-4 py-2.5 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm transition-colors flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M24 7.387v9.226a.614.614 0 0 1-.614.614h-8.745a.614.614 0 0 1-.614-.614v-2.826h-2.641v2.826a.614.614 0 0 1-.614.614H2.027a.614.614 0 0 1-.614-.614V7.387c0-.339.275-.614.614-.614h8.745c.339 0 .614.275.614.614v2.826h2.641V7.387c0-.339.275-.614.614-.614h8.745c.339 0 .614.275.614.614z"/>
                        </svg>
                        Outlook
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature highlights */}
        <div className="mt-8 p-6 bg-zinc-900 rounded-lg border border-zinc-800">
          <h3 className="text-lg font-semibold text-white mb-4">✨ New Features Implemented:</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-green-400">✓</span>
                <p className="text-zinc-300">
                  <strong className="text-white">Gmail/Outlook Quick Access:</strong> Provider buttons appear after magic link is sent
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-400">✓</span>
                <p className="text-zinc-300">
                  <strong className="text-white">Click Event Tracking:</strong> Console logs when provider buttons are clicked
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-green-400">✓</span>
                <p className="text-zinc-300">
                  <strong className="text-white">Branded Email Template:</strong> Custom HTML email with CubiQo branding
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-400">✓</span>
                <p className="text-zinc-300">
                  <strong className="text-white">Real-time UI Updates:</strong> Auth state updates without page refresh via onAuthStateChange
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-6 flex gap-4">
          <a
            href="/email-preview"
            className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
          >
            View Email Template →
          </a>
          <a
            href="/"
            className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
          >
            Back to App
          </a>
        </div>
      </div>
    </div>
  )
}
