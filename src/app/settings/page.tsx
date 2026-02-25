'use client'

import { AppLayout } from '@/components/AppLayout'
import { VoiceModulationPanel } from '@/components/settings/VoiceModulationPanel'
import { VerbalCommandsPanel } from '@/components/settings/VerbalCommandsPanel'

export default function SettingsPage() {
  return (
    <AppLayout>
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-4">Settings</h1>
          <p className="text-white/60 mb-8">
            Manage your account and preferences.
          </p>

          <div className="space-y-6">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Appearance</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-white/80">Theme</span>
                  <select className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white">
                    <option>Dark</option>
                    <option>Light</option>
                    <option>System</option>
                  </select>
                </div>
              </div>
            </div>

            <VoiceModulationPanel />

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Voice</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-white/80">Voice Input</span>
                  <button className="px-4 py-2 bg-orange-500/20 text-orange-400 rounded-lg hover:bg-orange-500/30 transition-colors">
                    Enable
                  </button>
                </div>
              </div>
            </div>

            <VerbalCommandsPanel />

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Privacy</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-white/80">Memory</span>
                  <button className="px-4 py-2 bg-white/10 text-white/80 rounded-lg hover:bg-white/20 transition-colors">
                    Manage
                  </button>
                </div>

                <div className="flex items-center justify-between border-t border-white/10 pt-4">
                  <div>
                    <span className="text-red-400 block font-medium">Delete Account & Data</span>
                    <span className="text-white/50 text-xs text-balance max-w-[200px] sm:max-w-xs block mt-1">
                      Permanently delete your profile, memories, and settings. This cannot be undone.
                    </span>
                  </div>
                  <button
                    onClick={async () => {
                      if (confirm("Are you entirely sure you want to delete your account? All data will be permanently wiped.")) {
                        try {
                          await fetch('/api/user/delete-data', { method: 'DELETE' });
                          window.location.href = '/';
                        } catch (err) {
                          alert('Failed to delete data. Please try again or contact support.');
                        }
                      }
                    }}
                    className="px-4 py-2 bg-red-500/20 text-red-400 font-medium rounded-lg hover:bg-red-500/30 transition-colors shrink-0"
                  >
                    Delete Data
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
