/**
 * 🎲 Dice Orbit Animation
 * Orbits a GLTF dice model around the center with color transitions
 * Includes interactive animation states: bounce, listening, thinking, speaking
 */
import * as THREE from "three";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";
export class DiceOrbit {
  constructor() {
    this.orbitGroup = new THREE.Group();
    this.diceModel = null;
    this.direction = 1; // 1 = clockwise, -1 = counter-clockwise
    this.greyValue = 0.5; // Grayscale value (0 = black, 1 = white)
    this.angle = 0;
    this.radius = 0.9;
    this.isLoaded = false;
    // Store original orbit position when stopping
    this.storedOrbitPosition = { x: 0, y: 0 };
    // Bounce animation state
    this.isBouncing = false;
    this.bounceProgress = 0;
    this.bounceHeight = 0.5;
    // Listening animation state (stops orbit, gentle wave motion)
    this.isListening = false;
    this.listeningTime = 0;
    this.listeningWaveSpeed = 2;
    // Thinking animation state (stops orbit, slow spin in place)
    this.isThinking = false;
    this.thinkingTime = 0;
    this.baseRotationSpeed = { x: 1.2, y: 1.6 };
    // Speaking animation state (stops orbit, gentle rotation)
    this.isSpeaking = false;
    this.speakingTime = 0;
    // Original scale
    this.baseScale = 0.22;
    this.loadModel();
  }
  /**
   * Load the dice GLTF model
   */
  async loadModel() {
    const loader = new GLTFLoader();
    try {
      const gltf = await loader.loadAsync("./dice.glb");
      this.diceModel = gltf.scene;
      this.diceModel.scale.set(this.baseScale, this.baseScale, this.baseScale);
      // Enable shadows
      this.diceModel.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      this.orbitGroup.add(this.diceModel);
      this.isLoaded = true;
      console.log("✅ Dice model loaded");
    } catch (error) {
      console.error("❌ Failed to load dice model:", error);
    }
  }
  /**
   * Trigger bounce animation
   */
  triggerBounce() {
    if (this.isInActiveState()) return; // Don't bounce during other animations
    this.isBouncing = true;
    this.bounceProgress = 0;
  }
  /**
   * Check if any special state is active
   */
  isInActiveState() {
    return this.isListening || this.isThinking || this.isSpeaking;
  }
  /**
   * Store current orbit position before stopping
   */
  storeOrbitPosition() {
    this.storedOrbitPosition.x = this.orbitGroup.position.x;
    this.storedOrbitPosition.y = this.orbitGroup.position.y;
  }
  /**
   * Start listening mode - STOPS orbit, gentle wave motion
   */
  startListening() {
    if (this.isListening) return;
    this.stopAllStates();
    this.storeOrbitPosition();
    this.isListening = true;
    this.listeningTime = 0;
    console.log("🎧 Listening mode started - orbit stopped");
  }
  /**
   * Stop listening mode
   */
  stopListening() {
    this.isListening = false;
    this.listeningTime = 0;
    // Reset to base scale
    if (this.diceModel) {
      this.diceModel.scale.set(this.baseScale, this.baseScale, this.baseScale);
    }
    console.log("🎧 Listening mode stopped");
  }
  /**
   * Start thinking mode - STOPS orbit, slow contemplative spin
   */
  startThinking() {
    if (this.isThinking) return;
    this.stopAllStates();
    this.storeOrbitPosition();
    this.isThinking = true;
    this.thinkingTime = 0;
    console.log("💭 Thinking mode started - orbit stopped");
  }
  /**
   * Stop thinking mode
   */
  stopThinking() {
    this.isThinking = false;
    this.thinkingTime = 0;
    this.orbitGroup.position.z = 0;
    console.log("💭 Thinking mode stopped");
  }
  /**
   * Start speaking mode - STOPS orbit, gentle rotation
   */
  startSpeaking() {
    if (this.isSpeaking) return;
    this.stopAllStates();
    this.storeOrbitPosition();
    this.isSpeaking = true;
    this.speakingTime = 0;
    console.log("🗣️ Speaking mode started - orbit stopped");
  }
  /**
   * Stop speaking mode
   */
  stopSpeaking() {
    this.isSpeaking = false;
    this.speakingTime = 0;
    // Reset scale and position
    if (this.diceModel) {
      this.diceModel.scale.set(this.baseScale, this.baseScale, this.baseScale);
    }
    this.orbitGroup.position.z = 0;
    console.log("🗣️ Speaking mode stopped");
  }
  /**
   * Stop all animation states
   */
  stopAllStates() {
    this.isListening = false;
    this.isThinking = false;
    this.isSpeaking = false;
    this.isBouncing = false;
  }
  /**
   * Toggle rotation direction
   */
  toggleDirection(num) {
    this.direction = num ? num : this.direction * -1;
    const immediateColorShift = 0.1;
    if (this.direction > 0) {
      this.greyValue = Math.max(0, this.greyValue - immediateColorShift);
    } else {
      this.greyValue = Math.min(1, this.greyValue + immediateColorShift);
    }
    this.updateColors();
  }
  rotateCube(x, y, z) {
    if (!this.diceModel) return;
    this.diceModel.rotation.x += x;
    this.diceModel.rotation.y += y;
    this.diceModel.rotation.z += z;
  }
  /**
   * Get current direction state
   */
  getDirectionLabel() {
    return this.direction > 0 ? "Light" : "Dark";
  }
  /**
   * Update dice colors based on grey value
   */
  updateColors() {
    if (!this.diceModel) return;
    const bodyColor = new THREE.Color(
      this.greyValue,
      this.greyValue,
      this.greyValue
    );
    const dotColor = new THREE.Color(
      1 - this.greyValue,
      1 - this.greyValue,
      1 - this.greyValue
    );
    this.diceModel.traverse((child) => {
      if (child.isMesh) {
        if (child.material.name === "BodyMaterial") {
          child.material.color.copy(bodyColor);
        } else if (child.material.name === "DotMaterial") {
          child.material.color.copy(dotColor);
        }
      }
    });
  }
  /**
   * Update bounce animation
   */
  updateBounce(deltaTime) {
    if (!this.isBouncing) return;
    this.bounceProgress += deltaTime * 3;
    if (this.bounceProgress >= 1) {
      this.isBouncing = false;
      this.bounceProgress = 0;
      this.orbitGroup.position.z = 0;
      return;
    }
    const bounce = Math.sin(this.bounceProgress * Math.PI) * this.bounceHeight;
    this.orbitGroup.position.z = bounce;
  }
  /**
   * Update listening animation - STOPPED orbit, gentle wave motion
   */
  updateListening(deltaTime) {
    if (!this.isListening || !this.diceModel) return;
    this.listeningTime += deltaTime;
    // Keep dice at stored position (no orbit)
    this.orbitGroup.position.x = this.storedOrbitPosition.x;
    this.orbitGroup.position.y = this.storedOrbitPosition.y;
    this.orbitGroup.position.z = 0;
    // Pulsing scale effect (breathing)
    const breathScale = 1 + Math.sin(this.listeningTime * 2) * 0.08;
    this.diceModel.scale.set(
      this.baseScale * breathScale,
      this.baseScale * breathScale,
      this.baseScale * breathScale
    );
    // Slow, gentle rotation to show it's "alive"
    this.diceModel.rotation.y += deltaTime * 0.5;
    // Maintain current color
  }
  /**
   * Update thinking animation - STOPPED orbit, slow contemplative spin
   */
  updateThinking(deltaTime) {
    if (!this.isThinking || !this.diceModel) return;
    this.thinkingTime += deltaTime;
    // Keep dice at stored position (no orbit)
    this.orbitGroup.position.x = this.storedOrbitPosition.x;
    this.orbitGroup.position.y = this.storedOrbitPosition.y;
    this.orbitGroup.position.z = 0;
    // Slow, contemplative spin in place
    this.diceModel.rotation.x += deltaTime * 0.3;
    this.diceModel.rotation.y += deltaTime * 0.4;
    // Subtle pulsing to show processing
    const thinkingPulse = 1 + Math.sin(this.thinkingTime * 1.2) * 0.03;
    this.diceModel.scale.set(
      this.baseScale * thinkingPulse,
      this.baseScale * thinkingPulse,
      this.baseScale * thinkingPulse
    );
    // Maintain current color
  }
  /**
   * Update speaking animation - STOPPED orbit, gentle rotation
   */
  updateSpeaking(deltaTime) {
    if (!this.isSpeaking || !this.diceModel) return;
    this.speakingTime += deltaTime;
    // Keep dice at stored position (no orbit, no nodding)
    this.orbitGroup.position.x = this.storedOrbitPosition.x;
    this.orbitGroup.position.y = this.storedOrbitPosition.y;
    this.orbitGroup.position.z = 0;
    // Gentle rotation (maintain from listening)
    this.diceModel.rotation.y += deltaTime * 0.5;
    // Maintain base scale (no pulsing)
    this.diceModel.scale.set(
      this.baseScale,
      this.baseScale,
      this.baseScale
    );
    // No color change - maintain current color
  }
  /**
   * Update normal orbit animation
   */
  updateOrbit(deltaTime) {
    // Only orbit when not in a special state
    if (this.isInActiveState()) return;
    this.angle += deltaTime * 0.6 * this.direction;
    this.orbitGroup.position.x = Math.cos(this.angle) * this.radius;
    this.orbitGroup.position.y = Math.sin(this.angle) * this.radius;
  }
  /**
   * Update normal rotation
   */
  updateNormalRotation(deltaTime) {
    if (!this.diceModel) return;
    this.diceModel.rotation.x += deltaTime * this.baseRotationSpeed.x;
    this.diceModel.rotation.y += deltaTime * this.baseRotationSpeed.y;
  }
  /**
   * Update normal color transition
   */
  updateNormalColor(deltaTime) {
    const delta = this.direction > 0 ? -deltaTime * 3 : deltaTime * 3;
    this.greyValue = THREE.MathUtils.clamp(this.greyValue + delta, 0, 1);
    this.updateColors();
  }
  /**
   * Main update function (call this in your animate loop)
   */
  update(deltaTime) {
    if (!this.isLoaded || !this.diceModel) return;
    // Handle bounce (can happen during orbit)
    if (this.isBouncing && !this.isInActiveState()) {
      this.updateBounce(deltaTime);
    }
    // Handle different states (mutually exclusive)
    if (this.isListening) {
      this.updateListening(deltaTime);
    } else if (this.isThinking) {
      this.updateThinking(deltaTime);
    } else if (this.isSpeaking) {
      this.updateSpeaking(deltaTime);
    } else {
      // Normal idle state
      // Reset scale and z-position if coming from another state
      if (this.diceModel.scale.x !== this.baseScale) {
        this.diceModel.scale.set(
          this.baseScale,
          this.baseScale,
          this.baseScale
        );
      }
      if (this.orbitGroup.position.z !== 0 && !this.isBouncing) {
        this.orbitGroup.position.z = 0;
      }
      if (this.diceModel.rotation.z !== 0) {
        this.diceModel.rotation.z = 0; // Reset tilt from listening
      }
      // Normal animations
      this.updateOrbit(deltaTime);
      this.updateNormalRotation(deltaTime);
      this.updateNormalColor(deltaTime);
    }
  }
  /**
   * Get the orbit group to add to scene
   */
  getGroup() {
    return this.orbitGroup;
  }
  /**
   * Cleanup
   */
  dispose() {
    if (this.diceModel) {
      this.diceModel.traverse((child) => {
        if (child.isMesh) {
          child.geometry.dispose();
          if (child.material.map) child.material.map.dispose();
          child.material.dispose();
        }
      });
    }
  }
}