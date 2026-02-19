/**
 * Multimodal AI Demo Page
 * Demonstrates vision and hearing capabilities
 */

'use client';

import { useState } from 'react';
import { MultimodalToggle } from '@/components/multimodal/MultimodalToggle';
import { CameraPreview } from '@/components/multimodal/CameraPreview';
import { useMultimodalAI } from '@/hooks/useMultimodalAI';

export default function MultimodalDemoPage() {
  const [showCamera, setShowCamera] = useState(false);
  const [testMessage, setTestMessage] = useState('');
  const [enhancedPrompt, setEnhancedPrompt] = useState<any>(null);

  const multimodal = useMultimodalAI({
    enableVision: showCamera,
    enableAudio: true,
    autoStart: false,
  });

  const handleToggle = (enabled: boolean) => {
    setShowCamera(enabled);
  };

  const handleTestPrompt = () => {
    if (testMessage) {
      const enhanced = multimodal.getEnhancedPrompt(testMessage);
      setEnhancedPrompt(enhanced);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            🎭 Multimodal AI Demo
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Experience CUBIQO's Vision & Hearing capabilities
          </p>
          <div className="flex justify-center items-center space-x-2 text-sm text-gray-500">
            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
              👁️ Vision
            </span>
            <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full">
              🎤 Hearing
            </span>
            <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full">
              🧠 Context-Aware
            </span>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Controls */}
          <div className="space-y-6">
            {/* Toggle Component */}
            <MultimodalToggle 
              onToggle={handleToggle}
              defaultEnabled={false}
              showDetails={true}
            />

            {/* Features List */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                🚀 Capabilities
              </h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                    <span className="text-lg">👁️</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">Vision</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Object detection, face recognition, scene understanding
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                    <span className="text-lg">🎤</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">Hearing</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Speech-to-text, emotion detection, tone analysis
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                    <span className="text-lg">🧠</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">Context Fusion</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Combines vision & audio for intelligent responses
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
                    <span className="text-lg">🔒</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">Privacy First</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      All processing happens locally in your browser
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Test Prompt Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                🧪 Test Context Enhancement
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Your Message:
                  </label>
                  <textarea
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    placeholder="Type a message to see how multimodal context enhances it..."
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                </div>
                <button
                  onClick={handleTestPrompt}
                  disabled={!testMessage || !multimodal.isActive}
                  className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Enhance with Context
                </button>

                {enhancedPrompt && (
                  <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg space-y-3">
                    <div>
                      <p className="text-xs font-semibold text-blue-900 dark:text-blue-200 mb-1">
                        Original:
                      </p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {enhancedPrompt.originalText}
                      </p>
                    </div>
                    {enhancedPrompt.systemContext && (
                      <div>
                        <p className="text-xs font-semibold text-blue-900 dark:text-blue-200 mb-1">
                          Context Added:
                        </p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                          {enhancedPrompt.systemContext}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Camera Preview & Status */}
          <div className="space-y-6">
            {/* Camera Preview */}
            {showCamera && multimodal.isActive && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  📹 Camera Feed
                </h2>
                <div className="aspect-video">
                  <CameraPreview 
                    cameraType="front"
                    showOverlay={true}
                  />
                </div>
              </div>
            )}

            {/* Current Context Display */}
            {multimodal.context && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  📊 Live Context
                </h2>
                <div className="space-y-4">
                  {/* User State */}
                  {multimodal.context.userState && (
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Mood</p>
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">
                            {multimodal.context.userState.mood}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Engagement</p>
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">
                            {multimodal.context.userState.engagement}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Attention</p>
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">
                            {multimodal.context.userState.attention}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Audio Features */}
                  {multimodal.context.audio && (
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <h3 className="text-sm font-semibold text-purple-900 dark:text-purple-200 mb-2">
                        🎤 Audio Analysis
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Emotion:</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {multimodal.context.audio.emotion.primary}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Confidence:</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {Math.round(multimodal.context.audio.emotion.confidence * 100)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Valence:</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {multimodal.context.audio.emotion.valence > 0 ? '😊 Positive' : '😔 Negative'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Vision Info */}
                  {multimodal.context.vision && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">
                        👁️ Vision Analysis
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Objects Detected:</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {multimodal.context.vision.objects.length}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Faces Detected:</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {multimodal.context.vision.faces.length}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Last updated: {new Date(multimodal.context.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Instructions */}
            {!showCamera && (
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-lg p-8 text-white">
                <h2 className="text-2xl font-bold mb-4">Getting Started</h2>
                <ol className="space-y-3 text-sm">
                  <li className="flex items-start">
                    <span className="flex-shrink-0 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center mr-3 font-bold">1</span>
                    <span>Toggle "Multimodal AI" to ON</span>
                  </li>
                  <li className="flex items-start">
                    <span className="flex-shrink-0 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center mr-3 font-bold">2</span>
                    <span>Allow camera and microphone access when prompted</span>
                  </li>
                  <li className="flex items-start">
                    <span className="flex-shrink-0 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center mr-3 font-bold">3</span>
                    <span>Watch as CUBIQO understands your environment</span>
                  </li>
                  <li className="flex items-start">
                    <span className="flex-shrink-0 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center mr-3 font-bold">4</span>
                    <span>Test context enhancement with your own messages</span>
                  </li>
                </ol>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 dark:text-gray-400 pt-8 border-t border-gray-200 dark:border-gray-700">
          <p>
            🔒 All processing happens locally in your browser. No data is sent to external servers.
          </p>
          <p className="mt-2">
            Built with ❤️ by the CUBIQO team
          </p>
        </div>
      </div>
    </div>
  );
}
