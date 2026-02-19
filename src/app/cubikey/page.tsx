'use client'

import { AppLayout } from '@/components/AppLayout'

export default function CubiKeyPage() {
  return (
    <AppLayout>
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-4">CubiKey</h1>
          <p className="text-white/60 mb-8">
            Secure, decentralized authentication powered by blockchain.
          </p>
          
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8">
            <div className="space-y-4">
              <div>
                <span className="inline-block px-3 py-1 bg-orange-500/20 text-orange-400 text-sm rounded-full mb-4">
                  Beta
                </span>
                <p className="text-white/80">
                  CubiKey authentication system is currently in beta testing.
                </p>
              </div>
              
              <div className="border-t border-white/10 pt-4">
                <h3 className="text-lg font-semibold text-white mb-2">Features</h3>
                <ul className="list-disc list-inside text-white/60 space-y-2">
                  <li>Passwordless authentication</li>
                  <li>Blockchain-backed identity</li>
                  <li>Cross-platform support</li>
                  <li>Self-sovereign identity</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
