/**
 * Multimodal Toggle Component
 * UI control for enabling/disabling multimodal AI capabilities
 */

'use client';

import { useState, useEffect } from 'react';
import { useMultimodalAI } from '@/hooks/useMultimodalAI';

interface MultimodalToggleProps {
  onToggle?: (enabled: boolean) => void;
  defaultEnabled?: boolean;
  showDetails?: boolean;
}

export function MultimodalToggle({ 
  onToggle, 
  defaultEnabled = false,
  showDetails = true 
}: MultimodalToggleProps) {
  const [enabled, setEnabled] = useState(defaultEnabled);
  const [expanded, setExpanded] = useState(false);
  const [visionEnabled, setVisionEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);

  const multimodal = useMultimodalAI({
    enableVision: enabled && visionEnabled,
    enableAudio: enabled && audioEnabled,
    autoStart: false,
  });

  const handleToggle = async () => {
    const newEnabled = !enabled;
    setEnabled(newEnabled);

    if (newEnabled) {
      await multimodal.initialize();
    } else {
      multimodal.stop();
    }

    onToggle?.(newEnabled);
  };

  const handleVisionToggle = () => {
    setVisionEnabled(!visionEnabled);
  };

  const handleAudioToggle = () => {
    setAudioEnabled(!audioEnabled);
  };

  useEffect(() => {
    // Re-initialize when sub-options change
    if (enabled) {
      multimodal.stop();
      multimodal.initialize();
    }
  }, [visionEnabled, audioEnabled]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 space-y-4">
      {/* Main Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            enabled 
              ? 'bg-gradient-to-br from-blue-500 to-purple-600' 
              : 'bg-gray-300 dark:bg-gray-700'
          }`}>
            {enabled ? (
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Multimodal AI
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {enabled ? 'Active - Vision & Hearing' : 'Inactive'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleToggle}
            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
              enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                enabled ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>

          {showDetails && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg 
                className={`w-5 h-5 transform transition-transform ${expanded ? 'rotate-180' : ''}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Status Indicators */}
      {enabled && (
        <div className="flex space-x-4 text-sm">
          {multimodal.visionEnabled && (
            <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Camera Active</span>
            </div>
          )}
          {multimodal.audioEnabled && (
            <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span>Microphone Active</span>
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {multimodal.error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-sm text-red-800 dark:text-red-200">
            {multimodal.error.message}
          </p>
        </div>
      )}

      {/* Detailed Controls */}
      {showDetails && expanded && (
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Capabilities
          </h4>

          {/* Vision Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Vision</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Object & face detection</p>
              </div>
            </div>
            <button
              onClick={handleVisionToggle}
              disabled={!enabled}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                visionEnabled && enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
              } ${!enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  visionEnabled && enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Audio Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Hearing</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Speech & emotion detection</p>
              </div>
            </div>
            <button
              onClick={handleAudioToggle}
              disabled={!enabled}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                audioEnabled && enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
              } ${!enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  audioEnabled && enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Permissions Info */}
          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-md">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              <strong>Permissions:</strong> Camera: {multimodal.cameraPermission}, Microphone: {multimodal.micPermission}
            </p>
          </div>

          {/* Context Display */}
          {multimodal.context && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
              <p className="text-xs font-semibold text-blue-900 dark:text-blue-200 mb-2">
                Current Context
              </p>
              {multimodal.context.userState && (
                <div className="text-xs text-blue-800 dark:text-blue-300 space-y-1">
                  <p>Mood: {multimodal.context.userState.mood}</p>
                  <p>Engagement: {multimodal.context.userState.engagement}</p>
                  <p>Attention: {multimodal.context.userState.attention}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
