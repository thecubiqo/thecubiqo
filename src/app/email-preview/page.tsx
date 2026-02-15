'use client'

/**
 * Email Preview Page
 * Shows branded email template preview for magic link
 */

import { useState } from 'react'
import { MagicLinkEmailTemplate } from '@/components/auth/MagicLinkEmailTemplate'

export default function EmailPreviewPage() {
  const [email, setEmail] = useState('user@example.com')
  const [magicLink] = useState(`${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback?code=abc123...`)

  return (
    <div className="min-h-screen bg-zinc-950 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Magic Link Email Preview
          </h1>
          <p className="text-zinc-400 text-sm">
            This is how the magic link email will look when users request to sign in.
          </p>
        </div>

        {/* Controls */}
        <div className="mb-6 p-4 bg-zinc-900 rounded-lg border border-zinc-800">
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Preview Email:
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@example.com"
            className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
          />
          <p className="mt-2 text-xs text-zinc-500">
            Change the email to see how it appears in the template
          </p>
        </div>

        {/* Email Preview */}
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-medium text-white">
              Email Preview
            </h2>
            <button
              onClick={() => {
                const emailHTML = document.getElementById('email-preview')?.innerHTML
                if (emailHTML) {
                  const blob = new Blob([emailHTML], { type: 'text/html' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = 'magic-link-email.html'
                  a.click()
                  URL.revokeObjectURL(url)
                }
              }}
              className="px-4 py-2 text-sm bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
            >
              Download HTML
            </button>
          </div>
          
          <div 
            id="email-preview"
            className="bg-black rounded-lg overflow-hidden"
          >
            <MagicLinkEmailTemplate 
              email={email}
              magicLink={magicLink}
            />
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 p-4 bg-zinc-900 rounded-lg border border-zinc-800">
          <h3 className="text-sm font-medium text-white mb-2">
            📝 How to use this template in Supabase:
          </h3>
          <ol className="text-sm text-zinc-400 space-y-2 list-decimal list-inside">
            <li>Go to your Supabase Dashboard → Authentication → Email Templates</li>
            <li>Select "Magic Link" template</li>
            <li>Click "Download HTML" above and copy the content</li>
            <li>Paste the HTML into the Supabase email template editor</li>
            <li>Replace <code className="px-1 py-0.5 bg-zinc-800 rounded text-orange-400">{'{{ .ConfirmationURL }}'}</code> with the actual Supabase variable</li>
            <li>Save and test the template</li>
          </ol>
          <div className="mt-4 p-3 bg-zinc-800 rounded border border-zinc-700">
            <p className="text-xs text-zinc-500 mb-2">Supabase Template Variables:</p>
            <code className="text-xs text-orange-400">
              {'{{ .ConfirmationURL }}'} - Magic link URL<br />
              {'{{ .Token }}'} - Verification token<br />
              {'{{ .SiteURL }}'} - Your site URL<br />
            </code>
          </div>
        </div>
      </div>
    </div>
  )
}
