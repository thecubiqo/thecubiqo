/**
 * 🚀 Cubiqo Main Application
 *
 * Orchestrates the cube, voice, AI, and memory services
 * "Between light and code, consciousness takes form"
 */

import * as THREE from 'three';
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
    this.colorButtons = [];

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
   * Hide loading screen with smooth transition
   */
  hideLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      setTimeout(() => {
        loadingScreen.classList.add('hidden');
      }, 500); // Small delay to ensure everything is loaded
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
   * Setup mouse and touch tracking for pupil movement and cube interaction
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
   * Handle voice button click
   */
  async handleVoiceClick() {
    if (!voiceService.isSupported().recognition) {
      alert('Voice input not supported in this browser.\n\nSupported browsers:\n• Chrome (Desktop & Mobile)\n• Safari (Desktop & iOS)\n• Edge\n\nFirefox does not support voice input yet.');
      return;
    }

    // iOS Safari: Activate audio context on user gesture
    voiceService.activateAudioContext();

    // Start listening - UI feedback
    this.voiceBtn.classList.add('listening');
    this.voiceBtn.textContent = '🎙️'; // Listening

    // Start cube listening animation
    this.cube.startListening();

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

    // Stop listening animation
    this.cube.stopListening();
    this.voiceBtn.classList.remove('listening');

    // Get AI response
    try {
      // Start thinking mode: cube rotates slowly, rare blinking
      this.cube.startThinking();
      this.voiceBtn.textContent = '💭'; // Thinking

      // Get current cube color
      const currentColor = this.cube.getCurrentColor();

      const history = await memoryService.getRecentMemories();
      const response = await aiService.chat(transcript, history, currentColor);

      console.log('AI Response:', response);

      // Stop thinking mode
      this.cube.stopThinking();

      // Change cube color based on emotion
      this.changeCubeColor(response.color);

      // Start speaking mode: rhythmic nodding
      this.cube.startSpeaking();
      this.voiceBtn.textContent = '🗣️'; // Speaking

      if (voiceService.isSupported().synthesis) {
        await voiceService.speak(response.response);
      }

      // Stop speaking mode
      this.cube.stopSpeaking();

      // Save to memory
      await memoryService.saveConversation({
        userMessage: transcript,
        aiResponse: response.response,
        color: response.color
      });

      // Reset to ready state
      this.voiceBtn.textContent = '🎤';

    } catch (error) {
      console.error('AI Error:', error);

      // Stop all animations on error
      this.cube.stopThinking();
      this.cube.stopSpeaking();

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
   * Main animation loop
   */
  animate() {
    requestAnimationFrame(() => this.animate());

    const deltaTime = this.clock.getDelta();

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
