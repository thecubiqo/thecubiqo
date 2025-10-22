/**
 * 🚀 Cubiqo Main Application
 *
 * Orchestrates the cube, voice, AI, and memory services
 * "Between light and code, consciousness takes form"
 */

import * as THREE from 'three';
import { SceneManager } from './core/scene.js';
import { Cube } from './core/cube.js';

// Lazy-loaded services (imported only when needed)
let voiceServiceInstance = null;
let aiServiceInstance = null;
let memoryServiceInstance = null;

class CubiqoApp {
  constructor() {
    this.scene = null;
    this.cube = null;
    this.clock = null;
    this.mouse = { x: 0, y: 0 };
    this.isInitialized = false;

    // UI elements
    this.voiceBtn = null;
    this.colorButtons = [];

    // Voice state management
    this.appState = 'idle'; // 'idle' | 'listening' | 'thinking' | 'speaking'

    // FPS monitoring
    this.fpsHistory = [];
    this.fpsHistoryMaxLength = 60; // Track last 60 frames
    this.fpsUpdateCounter = 0;
    this.fpsUpdateInterval = 10; // Update UI every 10 frames
    this.fpsMonitor = null;

    this.init();
  }

  /**
   * Initialize the application
   */
  async init() {
    console.log('🎨 Initializing Cubiqo...');

    try {
      // Setup Three.js scene
      const container = document.getElementById('canvas-container');
      this.scene = new SceneManager(container);

      // Create the cube
      this.cube = new Cube();
      this.scene.add(this.cube.getMesh());

      // Setup clock for animations
      this.clock = new THREE.Clock();

      // Setup UI event listeners
      this.setupUI();

      // Setup mouse/touch tracking
      this.setupInputTracking();

      // Start animation loop
      this.animate();

      this.isInitialized = true;
      console.log('✅ Cubiqo initialized successfully');

      // Hide loading screen
      this.hideLoadingScreen();

    } catch (error) {
      console.error('❌ Initialization error:', error);
      this.showError('Failed to initialize Cubiqo. Please refresh the page.');
    }
  }

  /**
   * Hide loading screen immediately (no delay for better performance)
   */
  hideLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      loadingScreen.classList.add('hidden');
      // Removed 500ms delay for better Speed Index
    }
  }

  /**
   * Show error message
   */
  showError(message) {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      loadingScreen.innerHTML = `
        <div class="error">
          <p>${message}</p>
        </div>
      `;
    }
  }

  /**
   * Setup UI elements and event listeners
   */
  setupUI() {
    // Check if we're in dev mode (determined by inline script in <head>)
    const isDevMode = document.documentElement.classList.contains('dev-mode');

    // FPS Monitor (only exists in dev mode via CSS)
    this.fpsMonitor = isDevMode ? document.getElementById('fps-monitor') : null;

    // Manual Mode toggle (only exists in dev mode via CSS)
    this.manualModeActive = false; // Start with AI-only mode
    this.toggleManualModeBtn = document.getElementById('toggle-manual-mode');
    this.controlsContainer = document.getElementById('controls');

    if (this.toggleManualModeBtn && isDevMode) {
      this.toggleManualModeBtn.addEventListener('click', () => {
        this.manualModeActive = !this.manualModeActive;
        this.toggleManualModeBtn.classList.toggle('active', this.manualModeActive);
        this.controlsContainer.classList.toggle('manual-mode-hidden', !this.manualModeActive);

        console.log(`Manual Mode: ${this.manualModeActive ? 'ON' : 'OFF'}`);
      });
    }

    // Log mode for debugging
    console.log(isDevMode ? '🛠️ Dev mode: FPS & Manual Mode enabled' : '🚀 Production mode: clean UI');

    // Color buttons
    this.colorButtons = document.querySelectorAll('.color-btn');
    this.colorButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const colorName = btn.getAttribute('data-color');
        this.changeCubeColor(colorName);

        // Update active state
        this.colorButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    // Voice button
    this.voiceBtn = document.getElementById('voice-btn');

    if (this.voiceBtn) {
      // Prevent double-firing on touch devices (touchstart + click)
      this.voiceBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.handleVoiceClick();
      }, { passive: false });

      this.voiceBtn.addEventListener('click', () => this.handleVoiceClick());
    }

    // Check voice support (without loading VoiceService yet)
    const hasRecognition = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    const hasSynthesis = !!window.speechSynthesis;

    if (!hasRecognition || !hasSynthesis) {
      console.warn('Voice features not fully supported');
      if (this.voiceBtn) {
        this.voiceBtn.style.opacity = '0.5';
        this.voiceBtn.title = 'Voice not supported in this browser';
      }
    }
  }

  /**
   * Setup mouse and touch tracking for pupil movement and cube interaction
   */
  setupInputTracking() {
    const handleMove = (clientX, clientY) => {
      // Use canvas dimensions for accurate mouse tracking (window.inner* can be buggy on iOS)
      const canvas = this.scene.renderer.domElement;
      const rect = canvas.getBoundingClientRect();

      this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    };

    // Mouse
    window.addEventListener('mousemove', (e) => {
      handleMove(e.clientX, e.clientY);
    });

    // Touch
    window.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    });

    // Click/Tap on cube for bounce
    const canvas = document.querySelector('canvas');
    if (canvas) {
      canvas.addEventListener('click', () => {
        this.cube.triggerBounce();
      });

      canvas.addEventListener('touchstart', (e) => {
        e.preventDefault(); // Prevent double-firing with click
        this.cube.triggerBounce();
      }, { passive: false });
    }
  }

  /**
   * Handle voice button click with state management
   * Lazy loads VoiceService on first click
   */
  async handleVoiceClick() {
    // Lazy load VoiceService on first use
    if (!voiceServiceInstance) {
      const VoiceService = (await import('./services/voice.js')).default;
      voiceServiceInstance = new VoiceService();
      console.log('🎤 VoiceService loaded lazily');
    }

    if (!voiceServiceInstance.isSupported().recognition) {
      alert('Voice input not supported in this browser.\n\nSupported browsers:\n• Chrome (Desktop & Mobile)\n• Safari (Desktop & iOS)\n• Edge\n\nFirefox does not support voice input yet.');
      return;
    }

    // State machine logic
    switch (this.appState) {
      case 'idle':
        // Start listening
        this.appState = 'listening';
        voiceServiceInstance.activateAudioContext();

        this.voiceBtn.classList.add('listening');
        this.voiceBtn.textContent = '🎙️';
        this.cube.startListening();

        voiceServiceInstance.startListening(
          (transcript) => this.handleTranscript(transcript),
          (error) => this.handleVoiceError(error)
        );
        break;

      case 'listening':
        // Stop listening, return to idle
        this.appState = 'idle';
        voiceServiceInstance.stopListening();
        this.cube.stopListening();

        this.voiceBtn.classList.remove('listening');
        this.voiceBtn.textContent = '🎤';
        break;

      case 'thinking':
        // Do nothing - cannot interrupt AI thinking
        console.log('Cannot interrupt while AI is thinking');
        break;

      case 'speaking':
        // Stop speaking, return to idle (do NOT start listening)
        this.appState = 'idle';
        voiceServiceInstance.stopSpeaking();
        this.cube.stopSpeaking();

        this.voiceBtn.textContent = '🎤';
        break;
    }
  }

  /**
   * Handle voice transcript
   * Lazy loads AI and Memory services on first use
   */
  async handleTranscript(transcript) {
    console.log('Transcript:', transcript);

    // Stop listening animation
    this.cube.stopListening();
    this.voiceBtn.classList.remove('listening');

    // Transition to thinking state
    this.appState = 'thinking';

    // Get AI response
    try {
      // Lazy load AI and Memory services
      if (!aiServiceInstance) {
        aiServiceInstance = (await import('./services/ai.js')).default;
        console.log('🤖 AI Service loaded lazily');
      }
      if (!memoryServiceInstance) {
        memoryServiceInstance = (await import('./services/memory.js')).default;
        console.log('💾 Memory Service loaded lazily');
      }

      // Start thinking mode: cube rotates slowly, rare blinking
      this.cube.startThinking();
      this.voiceBtn.textContent = '💭'; // Thinking

      // Get current cube color
      const currentColor = this.cube.getCurrentColor();

      const history = await memoryServiceInstance.getRecentMemories();
      const response = await aiServiceInstance.chat(transcript, history, currentColor);

      console.log('AI Response:', response);

      // Stop thinking mode
      this.cube.stopThinking();

      // Change cube color based on emotion
      this.changeCubeColor(response.color);

      // Transition to speaking state
      this.appState = 'speaking';

      // Start speaking mode: rhythmic nodding
      this.cube.startSpeaking();
      this.voiceBtn.textContent = '🗣️'; // Speaking

      if (voiceServiceInstance && voiceServiceInstance.isSupported().synthesis) {
        await voiceServiceInstance.speak(response.response);
      }

      // Stop speaking mode
      this.cube.stopSpeaking();

      // Save to memory
      await memoryServiceInstance.saveConversation({
        userMessage: transcript,
        aiResponse: response.response,
        color: response.color
      });

      // Return to idle state
      this.appState = 'idle';
      this.voiceBtn.textContent = '🎤';

    } catch (error) {
      console.error('AI Error:', error);

      // Stop all animations on error
      this.cube.stopThinking();
      this.cube.stopSpeaking();

      // Return to idle state
      this.appState = 'idle';

      this.voiceBtn.textContent = '❌'; // Error
      setTimeout(() => {
        this.voiceBtn.textContent = '🎤';
      }, 2000);
    }
  }

  /**
   * Handle voice error
   */
  handleVoiceError(error) {
    console.error('Voice error:', error);

    // Stop listening animation
    this.cube.stopListening();

    this.voiceBtn.classList.remove('listening');

    // Return to idle state
    this.appState = 'idle';

    // Show error briefly
    this.voiceBtn.textContent = '❌';

    setTimeout(() => {
      this.voiceBtn.textContent = '🎤';
    }, 2000);
  }

  /**
   * Change cube color
   */
  changeCubeColor(colorName) {
    this.cube.setColor(colorName);
  }

  /**
   * Update FPS display
   */
  updateFPS(deltaTime) {
    // Calculate current FPS
    const fps = deltaTime > 0 ? 1 / deltaTime : 0;

    // Add to history
    this.fpsHistory.push(fps);
    if (this.fpsHistory.length > this.fpsHistoryMaxLength) {
      this.fpsHistory.shift();
    }

    // Update UI every N frames to avoid DOM thrashing
    this.fpsUpdateCounter++;
    if (this.fpsUpdateCounter >= this.fpsUpdateInterval && this.fpsMonitor) {
      this.fpsUpdateCounter = 0;

      // Calculate average FPS
      const avgFps = this.fpsHistory.reduce((sum, f) => sum + f, 0) / this.fpsHistory.length;

      // Update display
      const fpsCurrentEl = this.fpsMonitor.querySelector('.fps-current');
      const fpsAvgEl = this.fpsMonitor.querySelector('.fps-avg');

      if (fpsCurrentEl) {
        fpsCurrentEl.textContent = `FPS: ${Math.round(fps)}`;
      }
      if (fpsAvgEl) {
        fpsAvgEl.textContent = `Avg: ${Math.round(avgFps)}`;
      }

      // Update color based on average FPS
      this.fpsMonitor.classList.remove('fps-good', 'fps-medium', 'fps-bad');
      if (avgFps >= 50) {
        this.fpsMonitor.classList.add('fps-good');
      } else if (avgFps >= 30) {
        this.fpsMonitor.classList.add('fps-medium');
      } else {
        this.fpsMonitor.classList.add('fps-bad');
      }
    }
  }

  /**
   * Main animation loop
   */
  animate() {
    requestAnimationFrame(() => this.animate());

    const deltaTime = this.clock.getDelta();

    // Update FPS monitor
    this.updateFPS(deltaTime);

    // Update cube
    this.cube.update(deltaTime, this.mouse.x, this.mouse.y);

    // Update shadow based on cube position
    const cubeYPos = this.cube.getMesh().position.y;
    this.scene.updateShadow(cubeYPos);

    // Render scene
    this.scene.render();
  }

  /**
   * Cleanup on unload
   */
  dispose() {
    this.scene.dispose();
    this.cube.dispose();

    // Cleanup voice service if it was loaded
    if (voiceServiceInstance) {
      voiceServiceInstance.stopListening();
      voiceServiceInstance.stopSpeaking();
    }
  }
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.cubiqo = new CubiqoApp();
  });
} else {
  window.cubiqo = new CubiqoApp();
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (window.cubiqo) {
    window.cubiqo.dispose();
  }
});
