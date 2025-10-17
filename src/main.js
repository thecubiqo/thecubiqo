/**
 * 🚀 Cubiqo Main Application - Milestone 1
 *
 * Pure 3D interactive cube with emotional colors
 * "Between light and code, consciousness takes form"
 */

import * as THREE from 'three';
import { SceneManager } from './core/scene.js';
import { Cube } from './core/cube.js';

class CubiqoApp {
  constructor() {
    this.scene = null;
    this.cube = null;
    this.clock = null;
    this.mouse = { x: 0, y: 0 };
    this.isInitialized = false;

    // UI elements
    this.colorButtons = [];

    this.init();
  }

  /**
   * Initialize the application
   */
  async init() {
    console.log('🎨 Initializing Cubiqo Milestone 1...');

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
      console.log('✅ Cubiqo Milestone 1 initialized successfully');

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
      }, 500);
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
  }

  /**
   * Setup mouse and touch tracking for cube interaction
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
        e.preventDefault();
        this.cube.triggerBounce();
      }, { passive: false });
    }
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
