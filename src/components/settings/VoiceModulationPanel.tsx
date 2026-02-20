'use client';

import React, { useState } from 'react';
import { 
  VoiceMood, 
  VOICE_MOODS, 
  detectVoiceMood 
} from '@/lib/voice-modulation';

export function VoiceModulationPanel() {
  const [selectedMood, setSelectedMood] = useState<VoiceMood>('neutral');
  const [sampleText, setSampleText] = useState('');
  const [detectedMood, setDetectedMood] = useState<VoiceMood | null>(null);

  const handleTextChange = (text: string) => {
    setSampleText(text);
    if (text.trim().length > 0) {
      const mood = detectVoiceMood(text);
      setDetectedMood(mood);
    } else {
      setDetectedMood(null);
    }
  };

  const moods: VoiceMood[] = ['sincere', 'candid', 'intimate', 'neutral'];
  
  const moodLabels: Record<VoiceMood, string> = {
    sincere: 'Sincere',
    candid: 'Candid',
    intimate: 'Intimate',
    neutral: 'Neutral'
  };

  const selectedSettings = VOICE_MOODS[selectedMood];

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-2">
          🎙️ Voice Modulation
        </h3>
        <p className="text-white/60 text-sm">
          Madhyama Marg (Middle Path) - Natural voice expression
        </p>
      </div>

      {/* Mood Selection */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-white/80 mb-3">
          Voice Mood Presets
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {moods.map((mood) => (
            <button
              key={mood}
              onClick={() => setSelectedMood(mood)}
              className={`
                px-4 py-3 rounded-lg border transition-all
                ${selectedMood === mood
                  ? 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                  : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'
                }
              `}
            >
              {moodLabels[mood]}
            </button>
          ))}
        </div>
      </div>

      {/* Settings Display */}
      <div className="mb-6 space-y-4">
        <h4 className="text-sm font-medium text-white/80 mb-3">
          AI-Controlled Settings
        </h4>
        
        {/* Stability */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-white/70">Stability</span>
            <span className="text-xs text-white/60">
              {(selectedSettings.stability * 100).toFixed(0)}%
            </span>
          </div>
          <div className="bg-white/10 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-orange-500/50 h-full rounded-full transition-all"
              style={{ width: `${selectedSettings.stability * 100}%` }}
            />
          </div>
        </div>

        {/* Similarity Boost */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-white/70">Similarity Boost</span>
            <span className="text-xs text-white/60">
              {(selectedSettings.similarity_boost * 100).toFixed(0)}%
            </span>
          </div>
          <div className="bg-white/10 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-blue-500/50 h-full rounded-full transition-all"
              style={{ width: `${selectedSettings.similarity_boost * 100}%` }}
            />
          </div>
        </div>

        {/* Style */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-white/70">Style</span>
            <span className="text-xs text-white/60">
              {(selectedSettings.style * 100).toFixed(0)}%
            </span>
          </div>
          <div className="bg-white/10 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-purple-500/50 h-full rounded-full transition-all"
              style={{ width: `${selectedSettings.style * 100}%` }}
            />
          </div>
        </div>

        {/* Speaker Boost */}
        <div className="flex items-center justify-between py-2">
          <span className="text-sm text-white/70">Speaker Boost</span>
          <div className={`
            px-3 py-1 rounded-full text-xs font-medium
            ${selectedSettings.use_speaker_boost 
              ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
              : 'bg-white/5 text-white/60 border border-white/10'
            }
          `}>
            {selectedSettings.use_speaker_boost ? 'Enabled' : 'Disabled'}
          </div>
        </div>
      </div>

      {/* Auto-Detection Demo */}
      <div className="border-t border-white/10 pt-6">
        <h4 className="text-sm font-medium text-white/80 mb-3">
          AI Auto-Detection Demo
        </h4>
        <p className="text-xs text-white/60 mb-3">
          Type text below to see which mood the AI would automatically detect
        </p>
        
        <textarea
          value={sampleText}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder="Type some text here..."
          className="
            w-full px-4 py-3 rounded-lg
            bg-white/5 border border-white/10
            text-white placeholder:text-white/40
            focus:outline-none focus:border-orange-500/50 focus:bg-white/10
            transition-all resize-none
          "
          rows={3}
        />

        {detectedMood && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-sm text-white/70">Detected Mood:</span>
            <span className="
              px-3 py-1 rounded-full text-xs font-medium
              bg-orange-500/20 text-orange-400 border border-orange-500/30
            ">
              {moodLabels[detectedMood]}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
