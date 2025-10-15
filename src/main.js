/**
 * 🚀 Cubiqo Main Application
 *
 * Orchestrates the cube, voice, AI, and memory services
 * "Between light and code, consciousness takes form"
 */

import { SceneManager } from './core/scene.js';
import { Cube } from './core/cube.js';
import voiceService from './services/voice.js';
import aiService from './services/ai.js';
import memoryService from './services/memory.js';

class CubiqoApp {
  constructor() {
    this.scene = null;
    this.cube = null;
    this.clock = null;
    this.mouse = { x: 0, y: 0 };
    this.isInitialized = false;

    // UI elements
    this.voiceBtn = null;
    this.transcriptEl = null;
    this.colorButtons = [];

    this.init();
  }

  /**
   * Initialize the application
   */
  async init() {
    console.log('🎨 Initializing Cubiqo...');

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

    // Check API key
    this.checkAPIKey();

    // Start animation loop
    this.animate();

    this.isInitialized = true;
    console.log('✅ Cubiqo initialized successfully');
  }

  /**
   * Setup UI elements and event listeners
   */
  setupUI() {
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
    this.transcriptEl = document.getElementById('transcript');

    if (this.voiceBtn) {
      this.voiceBtn.addEventListener('click', () => this.handleVoiceClick());
    }

    // Check voice support
    const support = voiceService.isSupported();
    if (!support.recognition || !support.synthesis) {
      console.warn('Voice features not fully supported');
      if (this.voiceBtn) {
        this.voiceBtn.style.opacity = '0.5';
        this.voiceBtn.title = 'Voice not supported in this browser';
      }
    }
  }

  /**
   * Setup mouse and touch tracking for pupil movement
   */
  setupInputTracking() {
    const handleMove = (clientX, clientY) => {
      this.mouse.x = (clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(clientY / window.innerHeight) * 2 + 1;
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
  }

  /**
   * Handle voice button click
   */
  async handleVoiceClick() {
    if (!voiceService.isSupported().recognition) {
      this.showTranscript('Voice input not supported', 3000);
      return;
    }

    // iOS Safari: Activate audio context on user gesture
    voiceService.activateAudioContext();

    // Start listening
    this.voiceBtn.classList.add('listening');
    this.voiceBtn.textContent = '🎙️';
    this.showTranscript('Listening...', 0);

    voiceService.startListening(
      (transcript) => this.handleTranscript(transcript),
      (error) => this.handleVoiceError(error)
    );
  }

  /**
   * Handle voice transcript
   */
  async handleTranscript(transcript) {
    console.log('Transcript:', transcript);

    this.voiceBtn.classList.remove('listening');
    this.voiceBtn.textContent = '🎤';
    this.showTranscript(`You: ${transcript}`, 2000);

    // Get AI response
    try {
      this.showTranscript('Thinking...', 0);

      const history = await memoryService.getRecentMemories();
      const response = await aiService.chat(transcript, history);

      console.log('AI Response:', response);

      // Change cube color based on emotion
      this.changeCubeColor(response.color);

      // Speak response
      this.showTranscript(`Cubiqo: ${response.response}`, 0);

      if (voiceService.isSupported().synthesis) {
        await voiceService.speak(response.response);
      }

      // Save to memory
      await memoryService.saveConversation({
        userMessage: transcript,
        aiResponse: response.response,
        color: response.color
      });

      // Hide transcript after speaking
      setTimeout(() => this.hideTranscript(), 2000);

    } catch (error) {
      console.error('AI Error:', error);
      this.showTranscript(`Error: ${error.message}`, 3000);
    }
  }

  /**
   * Handle voice error
   */
  handleVoiceError(error) {
    console.error('Voice error:', error);
    this.voiceBtn.classList.remove('listening');
    this.voiceBtn.textContent = '🎤';
    this.showTranscript(`Voice error: ${error}`, 3000);
  }

  /**
   * Change cube color
   */
  changeCubeColor(colorName) {
    this.cube.setColor(colorName);
  }

  /**
   * Show transcript message
   */
  showTranscript(text, autohideMs = 0) {
    if (!this.transcriptEl) return;

    this.transcriptEl.textContent = text;
    this.transcriptEl.classList.add('visible');

    if (autohideMs > 0) {
      setTimeout(() => this.hideTranscript(), autohideMs);
    }
  }

  /**
   * Hide transcript
   */
  hideTranscript() {
    if (this.transcriptEl) {
      this.transcriptEl.classList.remove('visible');
    }
  }

  /**
   * Check if API key is configured
   */
  checkAPIKey() {
    // Try to get API key from localStorage or prompt user
    let apiKey = localStorage.getItem('cubiqo_api_key');

    if (!apiKey) {
      // For now, we'll prompt the user (Phase 2 will have proper settings UI)
      const message = 'Welcome to Cubiqo! To enable AI conversation, please enter your Anthropic API key (it will be stored locally):';
      apiKey = prompt(message);

      if (apiKey) {
        localStorage.setItem('cubiqo_api_key', apiKey);
      }
    }

    if (apiKey) {
      aiService.setApiKey(apiKey);
      console.log('✅ API key configured');
    } else {
      console.warn('⚠️ No API key provided. Voice features will not work.');
    }
  }

  /**
   * Main animation loop
   */
  animate() {
    requestAnimationFrame(() => this.animate());

    const deltaTime = this.clock.getDelta();

    // Update cube
    this.cube.update(deltaTime, this.mouse.x, this.mouse.y);

    // Render scene
    this.scene.render();
  }

  /**
   * Cleanup on unload
   */
  dispose() {
    this.scene.dispose();
    this.cube.dispose();
    voiceService.stopListening();
    voiceService.stopSpeaking();
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
