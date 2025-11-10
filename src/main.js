/**
 * 🚀 Dicey Main Application
 *
 * Orchestrates the cube, voice, AI, and memory services
 * "Between light and code, consciousness takes form"
 */

import * as THREE from "three";
import { SceneManager } from "./core/scene.js";
import { DiceOrbit } from "./core/diceorbit.js";

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
    this.apiKeyModal = null;
    this.apiKeyInput = null;

    // Voice state management
    this.appState = "idle"; // 'idle' | 'listening' | 'thinking' | 'speaking'

    // FPS monitoring
    this.fpsHistory = [];
    this.fpsHistoryMaxLength = 60;
    this.fpsUpdateCounter = 0;
    this.fpsUpdateInterval = 10;
    this.fpsMonitor = null;

    this.init();
  }

  /**
   * Initialize the application
   */
  async init() {
    console.log("🎨 Initializing Cubiqo...");

    try {
      // Setup Three.js scene
      const container = document.getElementById("canvas-container");
      this.scene = new SceneManager(container);

      // Create the dice
      this.cube = new DiceOrbit();
      this.scene.add(this.cube.getGroup());

      // Setup clock for animations
      this.clock = new THREE.Clock();

      // Check for API key before setting up UI
      await this.checkApiKey();

      // Setup UI event listeners
      this.setupUI();

      // Setup mouse/touch tracking
      this.setupInputTracking();

      // Start animation loop
      this.animate();

      this.isInitialized = true;
      console.log("✅ Dicey initialized successfully");

      // Hide loading screen
      this.hideLoadingScreen();
    } catch (error) {
      console.error("❌ Initialization error:", error);
      this.showError("Failed to initialize Dicey. Please refresh the page.");
    }
  }

  /**
   * Check if API key is configured
   */
  async checkApiKey() {
    // Check localStorage for saved API key
    const savedKey = localStorage.getItem("anthropic_api_key");

    if (savedKey) {
      // Lazy load AI service
      if (!aiServiceInstance) {
        aiServiceInstance = (await import("./services/ai.js")).default;
      }
      aiServiceInstance.setApiKey(savedKey);
      console.log("✅ API key loaded from storage");
    } else {
      console.warn("⚠️ No API key found - AI features will require setup");
    }
  }

  /**
   * Show API key setup modal
   */
  showApiKeyModal() {
    this.apiKeyModal = document.getElementById("api-key-modal");
    if (this.apiKeyModal) {
      this.apiKeyModal.style.display = "flex";
    } else {
      // Fallback if modal doesn't exist in HTML
      const key = prompt("Enter your Anthropic API key (starts with sk-ant-):");
      if (key && key.startsWith("sk-ant-")) {
        this.saveApiKey(key);
      }
    }
  }

  /**
   * Hide API key modal
   */
  hideApiKeyModal() {
    if (this.apiKeyModal) {
      this.apiKeyModal.style.display = "none";
    }
  }

  /**
   * Save API key
   */
  async saveApiKey(apiKey) {
    localStorage.setItem("anthropic_api_key", apiKey);

    // Lazy load AI service
    if (!aiServiceInstance) {
      aiServiceInstance = (await import("./services/ai.js")).default;
    }
    aiServiceInstance.setApiKey(apiKey);

    this.hideApiKeyModal();
    console.log("✅ API key saved");
  }

  /**
   * Hide loading screen immediately (no delay for better performance)
   */
  hideLoadingScreen() {
    const loadingScreen = document.getElementById("loading-screen");
    if (loadingScreen) {
      loadingScreen.classList.add("hidden");
    }
  }

  /**
   * Show error message
   */
  showError(message) {
    const loadingScreen = document.getElementById("loading-screen");
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
    // Check if we're in dev mode
    const isDevMode = document.documentElement.classList.contains("dev-mode");

    // FPS Monitor
    this.fpsMonitor = isDevMode ? document.getElementById("fps-monitor") : null;

    // Manual Mode toggle
    this.manualModeActive = false;
    this.toggleManualModeBtn = document.getElementById("toggle-manual-mode");
    this.controlsContainer = document.getElementById("controls");

    if (this.toggleManualModeBtn && isDevMode) {
      this.toggleManualModeBtn.addEventListener("click", () => {
        this.manualModeActive = !this.manualModeActive;
        this.toggleManualModeBtn.classList.toggle(
          "active",
          this.manualModeActive
        );
        this.controlsContainer.classList.toggle(
          "manual-mode-hidden",
          !this.manualModeActive
        );
        console.log(`Manual Mode: ${this.manualModeActive ? "ON" : "OFF"}`);
      });
    }

    console.log(
      isDevMode
        ? "🛠️ Dev mode: FPS & Manual Mode enabled"
        : "🚀 Production mode: clean UI"
    );

    // API Key setup button/modal
    this.apiKeyInput = document.getElementById("api-key-input");
    const saveKeyBtn = document.getElementById("save-api-key-btn");

    if (saveKeyBtn && this.apiKeyInput) {
      saveKeyBtn.addEventListener("click", () => {
        const apiKey = this.apiKeyInput.value.trim();
        if (apiKey.startsWith("sk-ant-")) {
          this.saveApiKey(apiKey);
        } else {
          alert('Invalid API key. It should start with "sk-ant-"');
        }
      });
    }

    // Settings button to show API key modal
    const settingsBtn = document.getElementById("settings-btn");
    if (settingsBtn) {
      settingsBtn.addEventListener("click", () => {
        this.showApiKeyModal();
      });
    }

    // Color buttons (manual override)
    this.colorButtons = document.querySelectorAll(".color-btn");
    this.colorButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const colorName = btn.getAttribute("data-color");
        this.changeCubeColor(colorName);

        // Update active state
        this.colorButtons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
      });
    });

    // Theme toggle button (Light/Dark mode for dice)
    this.themeBtn = document.getElementById("theme-toggle");
    if (this.themeBtn) {
      this.themeBtn.addEventListener("click", () => {
        this.cube.toggleDirection();
        this.themeBtn.textContent = this.cube.getDirectionLabel();
      });
    }

    // Voice button
    this.voiceBtn = document.getElementById("voice-btn");

    if (this.voiceBtn) {
      // Prevent double-firing on touch devices
      this.voiceBtn.addEventListener(
        "touchstart",
        (e) => {
          e.preventDefault();
          this.handleVoiceClick();
        },
        { passive: false }
      );

      this.voiceBtn.addEventListener("click", () => this.handleVoiceClick());
    }

    // Check voice support
    const hasRecognition = !!(
      window.SpeechRecognition || window.webkitSpeechRecognition
    );
    const hasSynthesis = !!window.speechSynthesis;

    if (!hasRecognition || !hasSynthesis) {
      console.warn("Voice features not fully supported");
      if (this.voiceBtn) {
        this.voiceBtn.style.opacity = "0.5";
        this.voiceBtn.title = "Voice not supported in this browser";
      }
    }
  }

  /**
   * Setup mouse and touch tracking for cube interaction
   */
  setupInputTracking() {
    const handleMove = (clientX, clientY) => {
      const canvas = this.scene.renderer.domElement;
      const rect = canvas.getBoundingClientRect();

      this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    };

    // Mouse
    window.addEventListener("mousemove", (e) => {
      handleMove(e.clientX, e.clientY);
    });

    // Touch
    window.addEventListener("touchmove", (e) => {
      if (e.touches.length > 0) {
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    });

    // Click/Tap on cube for bounce
    const canvas = document.querySelector("canvas");
    if (canvas) {

      canvas.addEventListener("mousemove", (e) => {
        e.preventDefault();
        this.cube.rotateCube(0.002 * e.movementX, 0.002 * e.movementY, 0);
      });

      canvas.addEventListener(
        "touchstart",
        (e) => {
          e.preventDefault();
          this.cube.triggerBounce();
        },
        { passive: false }
      );
    }
  }

  /**
   * Handle voice button click with state management
   * Lazy loads VoiceService on first click
   */
  async handleVoiceClick() {
    // Lazy load VoiceService on first use
    if (!voiceServiceInstance) {
      const VoiceService = (await import("./services/voice.js")).default;
      voiceServiceInstance = new VoiceService();
      console.log("🎤 VoiceService loaded lazily");
    }

    if (!voiceServiceInstance.isSupported().recognition) {
      alert(
        "Voice input not supported in this browser.\n\nSupported browsers:\n• Chrome (Desktop & Mobile)\n• Safari (Desktop & iOS)\n• Edge"
      );
      return;
    }

    // Check if AI is configured
    if (!aiServiceInstance || !localStorage.getItem("anthropic_api_key")) {
      alert("Please configure your API key first to use AI features.");
      this.showApiKeyModal();
      return;
    }

    // State machine logic
    switch (this.appState) {
      case "idle":
        // Start listening
        this.appState = "listening";
        voiceServiceInstance.activateAudioContext();

        this.voiceBtn.classList.add("listening");
        this.voiceBtn.textContent = "🎙️";
        this.cube.startListening();

        voiceServiceInstance.startListening(
          (transcript) => this.handleTranscript(transcript),
          (error) => this.handleVoiceError(error)
        );
        break;

      case "listening":
        // Stop listening, return to idle
        this.appState = "idle";
        voiceServiceInstance.stopListening();
        this.cube.stopListening();

        this.voiceBtn.classList.remove("listening");
        this.voiceBtn.innerHTML = `<svg id="mic-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="26" height="26"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 1.5a3 3 0 013 3v7a3 3 0 01-6 0v-7a3 3 0 013-3zM19.5 10.5a7.5 7.5 0 01-15 0M12 19.5v3" /></svg>`;
        break;

      case "thinking":
        // Cannot interrupt AI thinking
        console.log("Cannot interrupt while AI is thinking");
        break;

      case "speaking":
        // Stop speaking, return to idle
        this.appState = "idle";
        voiceServiceInstance.stopSpeaking();
        this.cube.stopSpeaking();

        this.voiceBtn.innerHTML = `<svg id="mic-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="26" height="26"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 1.5a3 3 0 013 3v7a3 3 0 01-6 0v-7a3 3 0 013-3zM19.5 10.5a7.5 7.5 0 01-15 0M12 19.5v3" /></svg>`;
        break;
    }
  }

  /**
   * Handle voice transcript - Send to AI
   * Lazy loads AI and Memory services on first use
   */
  async handleTranscript(transcript) {
    console.log("📝 Transcript:", transcript);

    // Stop listening animation
    this.cube.stopListening();
    this.voiceBtn.classList.remove("listening");

    // Transition to thinking state
    this.appState = "thinking";

    try {
      // Lazy load AI and Memory services
      if (!aiServiceInstance) {
        aiServiceInstance = (await import("./services/ai.js")).default;
        // Re-load API key in case it was set after initial load
        const savedKey = localStorage.getItem("anthropic_api_key");
        if (savedKey) {
          aiServiceInstance.setApiKey(savedKey);
        }
        console.log("🤖 AI Service loaded lazily");
      }
      if (!memoryServiceInstance) {
        memoryServiceInstance = (await import("./services/memory.js")).default;
        console.log("💾 Memory Service loaded lazily");
      }

      // Start thinking animation
      this.cube.startThinking();
      this.voiceBtn.textContent = "💭";

      // Get current dice color/direction
      debugger;
      const currentColor = this.cube.getDirectionLabel(); // "Light" or "Dark"

      // Map to AI color names
      const colorMap = {
        Light: "WHITE", // Light mode = balanced/calm
        Dark: "BLACK", // Dark mode = intense/passionate
      };
      const aiColor = colorMap[currentColor] || "WHITE";

      // Get conversation history
      const history = await memoryServiceInstance.getRecentMemories();

      // Get AI response
      const response = await aiServiceInstance.chat(
        transcript,
        history,
        aiColor
      );

      console.log("🤖 AI Response:", response);

      // Stop thinking
      this.cube.stopThinking();

      // Change dice direction based on AI's emotional color
      if (response.color === "BLACK") {
        this.cube.toggleDirection(1); // Dark mode
        // html.classList.add("dark");
        // html.classList.remove("light");
        // themeText.textContent = "Light";
      } else {
        this.cube.toggleDirection(-1); // Light mode

        // html.classList.remove("dark");
        // html.classList.add("light");
        // themeText.textContent = "Dark";
      }

      // Transition to speaking state
      this.appState = "speaking";

      // Start speaking animation
      this.cube.startSpeaking();
      this.voiceBtn.textContent = "🗣️";

      if (
        voiceServiceInstance &&
        voiceServiceInstance.isSupported().synthesis
      ) {
        await voiceServiceInstance.speak(response.response);
      }

      // Stop speaking
      this.cube.stopSpeaking();

      // Save to memory with timestamp
      await memoryServiceInstance.saveConversation({
        userMessage: transcript,
        aiResponse: response.response,
        color: response.color,
        timestamp: new Date().toISOString(),
      });

      // Return to idle
      this.appState = "idle";
      this.voiceBtn.innerHTML = `<svg id="mic-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="26" height="26"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 1.5a3 3 0 013 3v7a3 3 0 01-6 0v-7a3 3 0 013-3zM19.5 10.5a7.5 7.5 0 01-15 0M12 19.5v3" /></svg>`;
    } catch (error) {
      console.error("❌ AI Error:", error);

      // Stop all animations on error
      this.cube.stopThinking();
      this.cube.stopSpeaking();

      // Return to idle state
      this.appState = "idle";

      this.voiceBtn.textContent = "❌";

      // Show user-friendly error
      let errorMessage = "AI request failed. ";
      if (error.message.includes("API key")) {
        errorMessage += "Please check your API key.";
        setTimeout(() => this.showApiKeyModal(), 2000);
      } else if (error.message.includes("rate limit")) {
        errorMessage += "Rate limit exceeded. Please try again later.";
      } else {
        errorMessage += "Please try again.";
      }

      alert(errorMessage);

      setTimeout(() => {
        this.voiceBtn.innerHTML = `<svg id="mic-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="26" height="26"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 1.5a3 3 0 013 3v7a3 3 0 01-6 0v-7a3 3 0 013-3zM19.5 10.5a7.5 7.5 0 01-15 0M12 19.5v3" /></svg>`;
      }, 2000);
    }
  }

  /**
   * Handle voice error
   */
  handleVoiceError(error) {
    console.error("Voice error:", error);

    // Stop listening animation
    this.cube.stopListening();
    this.voiceBtn.classList.remove("listening");

    // Return to idle state
    this.appState = "idle";

    // Show error briefly
    this.voiceBtn.textContent = "❌";

    setTimeout(() => {
      this.voiceBtn.innerHTML = `<svg id="mic-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="26" height="26"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 1.5a3 3 0 013 3v7a3 3 0 01-6 0v-7a3 3 0 013-3zM19.5 10.5a7.5 7.5 0 01-15 0M12 19.5v3" /></svg>`;
    }, 2000);
  }

  /**
   * Change cube color (manual override)
   */
  changeCubeColor(colorName) {
    // Map color names to dice direction if needed
    const colorToDirection = {
      happy: 1, // Light
      calm: 1, // Light
      excited: -1, // Dark
      sad: -1, // Dark
    };

    if (colorToDirection[colorName] !== undefined) {
      this.cube.toggleDirection(colorToDirection[colorName]);
    }
  }

  /**
   * Update FPS display
   */
  updateFPS(deltaTime) {
    const fps = deltaTime > 0 ? 1 / deltaTime : 0;

    this.fpsHistory.push(fps);
    if (this.fpsHistory.length > this.fpsHistoryMaxLength) {
      this.fpsHistory.shift();
    }

    this.fpsUpdateCounter++;
    if (this.fpsUpdateCounter >= this.fpsUpdateInterval && this.fpsMonitor) {
      this.fpsUpdateCounter = 0;

      const avgFps =
        this.fpsHistory.reduce((sum, f) => sum + f, 0) / this.fpsHistory.length;

      const fpsCurrentEl = this.fpsMonitor.querySelector(".fps-current");
      const fpsAvgEl = this.fpsMonitor.querySelector(".fps-avg");

      if (fpsCurrentEl) {
        fpsCurrentEl.textContent = `FPS: ${Math.round(fps)}`;
      }
      if (fpsAvgEl) {
        fpsAvgEl.textContent = `Avg: ${Math.round(avgFps)}`;
      }

      this.fpsMonitor.classList.remove("fps-good", "fps-medium", "fps-bad");
      if (avgFps >= 50) {
        this.fpsMonitor.classList.add("fps-good");
      } else if (avgFps >= 30) {
        this.fpsMonitor.classList.add("fps-medium");
      } else {
        this.fpsMonitor.classList.add("fps-bad");
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

    // Update dice with all animations
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

    if (voiceServiceInstance) {
      voiceServiceInstance.stopListening();
      voiceServiceInstance.stopSpeaking();
    }
  }
}

// Wait for DOM to be ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    window.cubiqo = new CubiqoApp();
  });
} else {
  window.cubiqo = new CubiqoApp();
}

// Cleanup on page unload
window.addEventListener("beforeunload", () => {
  if (window.cubiqo) {
    window.cubiqo.dispose();
  }
});
