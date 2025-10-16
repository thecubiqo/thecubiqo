/**
 * 🧊 Cube Component
 *
 * The heart of Cubiqo - a living, breathing, emotionally-aware 3D cube
 * Animations and behavior change based on emotional state (color)
 */

import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { getColor } from '../config/colors.js';

export class Cube {
  constructor() {
    this.mesh = null;
    this.material = null;
    this.currentColor = getColor('ORANGE'); // Start with ORANGE (Fourth Way)
    this.targetColor = this.currentColor;

    // Animation state
    this.time = 0;
    this.colorTransitionProgress = 1; // 1 = transition complete
    this.colorTransitionDuration = 1; // 1 second transition

    // Bounce animation state (when changing color, tapping, or idle)
    this.bounceProgress = 0;
    this.isBouncing = false;
    this.bounceDuration = 0.8; // seconds (slower, more elegant)
    this.bounceHeight = 0.15; // how high to jump (reduced from 0.3)
    this.idleBounceTimer = 0;
    this.nextIdleBounceTime = 15 + Math.random() * 10; // Random bounce every 15-25 seconds

    // Voice listening state
    this.isListening = false;
    this.listeningIntensity = 0; // 0-1, for pulsing effect

    // Thinking state
    this.isThinking = false;
    this.thinkingTime = 0;

    // Speaking state
    this.isSpeaking = false;
    this.speakingTime = 0;

    // Smooth transition between states (lerp for rotations)
    this.currentStateRotation = { x: 0, y: 0, z: 0 };
    this.targetStateRotation = { x: 0, y: 0, z: 0 };
    this.rotationTransitionSpeed = 3; // How fast to transition (higher = faster)

    // Eyes
    this.eyeGroup = null;
    this.leftEye = null;
    this.rightEye = null;
    this.leftPupil = null;
    this.rightPupil = null;
    this.blinkTimer = 0;
    this.isBlinking = false;
    this.nextBlinkTime = 3 + Math.random() * 4;
    this.blinkCount = 0; // For double blink in RED mode

    this.init();
  }

  /**
   * Initialize the cube
   */
  init() {
    // Detect mobile for performance optimization
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // Create rounded box geometry (reduce segments on mobile for performance)
    const segments = isMobile ? 3 : 4; // Lower geometry detail on mobile
    const geometry = new RoundedBoxGeometry(2, 2, 2, segments, 0.15);

    // Create hybrid material: satin-metal + semi-transparent polymer
    this.material = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0.4,           // Satin-metallic effect
      roughness: 0.3,           // Satin texture (not too glossy)
      transparent: true,
      opacity: 0.85,            // Semi-transparent (85%)
      transmission: 0.3,        // Glass/polymer transparency
      thickness: 0.5,           // Material thickness
      clearcoat: 0.5,           // Lacquer coating on top
      clearcoatRoughness: 0.2,  // Slightly matte coating
      emissive: this.currentColor.emissive,
      emissiveIntensity: this.currentColor.glowIntensity,
      ior: 1.5                  // Index of refraction (like plastic)
    });

    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.castShadow = true;

    // Create eyes
    this.createEyes();
  }

  /**
   * Create eye elements
   */
  createEyes() {
    // Detect mobile for performance optimization
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const circleSegments = isMobile ? 16 : 32; // Reduce circle segments on mobile

    this.eyeGroup = new THREE.Group();

    // Left eye
    const eyeGeometry = new THREE.CircleGeometry(0.15, circleSegments);
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    this.leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    this.leftEye.position.set(-0.3, 0.3, 1.01);
    this.eyeGroup.add(this.leftEye);

    // Right eye
    this.rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    this.rightEye.position.set(0.3, 0.3, 1.01);
    this.eyeGroup.add(this.rightEye);

    // Left pupil
    const pupilGeometry = new THREE.CircleGeometry(0.08, circleSegments);
    const pupilMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.leftPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
    this.leftPupil.position.set(-0.3, 0.3, 1.02);
    this.eyeGroup.add(this.leftPupil);

    // Right pupil
    this.rightPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
    this.rightPupil.position.set(0.3, 0.3, 1.02);
    this.eyeGroup.add(this.rightPupil);

    this.mesh.add(this.eyeGroup);
  }

  /**
   * Set target color (smooth transition)
   */
  setColor(colorName) {
    this.targetColor = getColor(colorName);
    this.colorTransitionProgress = 0; // Start transition

    // Trigger bounce animation
    this.triggerBounce();
  }

  /**
   * Trigger bounce animation (for color change, tap, idle)
   */
  triggerBounce() {
    this.isBouncing = true;
    this.bounceProgress = 0;
  }

  /**
   * Start listening mode (visual feedback)
   */
  startListening() {
    this.isListening = true;
    this.listeningIntensity = 0;
  }

  /**
   * Stop listening mode
   */
  stopListening() {
    this.isListening = false;
    this.listeningIntensity = 0;
  }

  /**
   * Start thinking mode (processing AI response)
   */
  startThinking() {
    this.isThinking = true;
    this.thinkingTime = 0;
  }

  /**
   * Stop thinking mode
   */
  stopThinking() {
    this.isThinking = false;
    this.thinkingTime = 0;
  }

  /**
   * Start speaking mode (voice output)
   */
  startSpeaking() {
    this.isSpeaking = true;
    this.speakingTime = 0;
  }

  /**
   * Stop speaking mode
   */
  stopSpeaking() {
    this.isSpeaking = false;
    this.speakingTime = 0;
  }

  /**
   * Update pupils to follow mouse/touch
   */
  updatePupilPosition(normalizedX, normalizedY) {
    const pupilRange = 0.04;
    this.leftPupil.position.x = -0.3 + normalizedX * pupilRange;
    this.leftPupil.position.y = 0.3 + normalizedY * pupilRange;
    this.rightPupil.position.x = 0.3 + normalizedX * pupilRange;
    this.rightPupil.position.y = 0.3 + normalizedY * pupilRange;
  }

  /**
   * Animation update loop
   */
  update(deltaTime, mouseX = 0, mouseY = 0) {
    this.time += deltaTime;

    // Subtle breathing position (very gentle, almost invisible)
    let baseY = Math.sin(this.time * 0.5) * 0.03; // Much subtler than before

    // Idle bounce timer (occasional spontaneous bounce)
    if (!this.isBouncing) {
      this.idleBounceTimer += deltaTime;
      if (this.idleBounceTimer >= this.nextIdleBounceTime) {
        this.triggerBounce();
        this.idleBounceTimer = 0;
        this.nextIdleBounceTime = 15 + Math.random() * 10; // Next bounce in 15-25 seconds
      }
    }

    // Bounce animation (when changing color, tap, or idle)
    if (this.isBouncing) {
      this.bounceProgress += deltaTime / this.bounceDuration;

      if (this.bounceProgress >= 1) {
        this.bounceProgress = 0;
        this.isBouncing = false;
      } else {
        // Gentle bounce effect (single smooth arc)
        const t = this.bounceProgress;
        const bounceEffect = Math.sin(t * Math.PI) * this.bounceHeight;
        baseY += bounceEffect;
      }
    }

    this.mesh.position.y = baseY;

    // Lerp animation speed during transition for smooth animation changes
    let currentAnimSpeed = this.currentColor.animationSpeed || 0.4;
    let currentBreathSpeed = this.currentColor.breathingSpeed || 1.5;
    let currentGlowIntensity = this.currentColor.glowIntensity || 0.5;

    if (this.colorTransitionProgress < 1) {
      // Smoothly interpolate animation parameters
      const targetAnimSpeed = this.targetColor.animationSpeed || 0.4;
      const targetBreathSpeed = this.targetColor.breathingSpeed || 1.5;
      const targetGlowIntensity = this.targetColor.glowIntensity || 0.5;

      currentAnimSpeed = this.lerp(currentAnimSpeed, targetAnimSpeed, this.colorTransitionProgress);
      currentBreathSpeed = this.lerp(currentBreathSpeed, targetBreathSpeed, this.colorTransitionProgress);
      currentGlowIntensity = this.lerp(currentGlowIntensity, targetGlowIntensity, this.colorTransitionProgress);
    }

    // Idle sway animation (gentle rotation with interpolated speed)
    let idleSwayY = Math.sin(this.time * currentAnimSpeed) * (10 * Math.PI / 180); // 10° reduced from 20°
    let idleSwayX = Math.sin(this.time * currentAnimSpeed * 0.7) * (8 * Math.PI / 180); // 8° breathing tilt

    // Calculate TARGET rotation for current state
    this.targetStateRotation.x = 0;
    this.targetStateRotation.y = 0;
    this.targetStateRotation.z = 0;

    // LISTENING MODE: Slower, more human-like nodding
    if (this.isListening) {
      this.listeningIntensity += deltaTime * 3;
      // Slower, more natural nod (like attentive listening)
      const nodSpeed = 1.8; // Reduced from 3 (more human-like)
      const nodAngle = Math.sin(this.listeningIntensity * nodSpeed) * (10 * Math.PI / 180); // Reduced from 15° to 10°
      this.targetStateRotation.x = nodAngle;
    }

    // THINKING MODE: V-shaped movement (down → center → up → center, repeat)
    if (this.isThinking) {
      this.thinkingTime += deltaTime;
      // V-shape movement: smooth down-up pattern
      const vSpeed = 0.4; // Very slow, contemplative
      const vProgress = (this.thinkingTime * vSpeed) % 2; // 0→2 loop

      let vAngle;
      if (vProgress < 1) {
        // Down phase: 0 → -12° (looking down, thinking)
        vAngle = -vProgress * (12 * Math.PI / 180);
      } else {
        // Up phase: -12° → 0 (returning to center)
        vAngle = -(2 - vProgress) * (12 * Math.PI / 180);
      }

      this.targetStateRotation.x = vAngle;
      // Slight side tilt for more natural thinking pose
      this.targetStateRotation.z = Math.sin(this.thinkingTime * 0.3) * (3 * Math.PI / 180);
    }

    // SPEAKING MODE: Reduced amplitude, more subtle
    if (this.isSpeaking) {
      this.speakingTime += deltaTime;
      // Gentler nod (up-down) synchronized with speech
      const speakNodSpeed = 2.5;
      const speakNodAngle = Math.sin(this.speakingTime * speakNodSpeed) * (7 * Math.PI / 180); // Reduced from 12° to 7°
      this.targetStateRotation.x = speakNodAngle;
      // Reduced side-to-side sway
      this.targetStateRotation.z = Math.sin(this.speakingTime * 1.5) * (2 * Math.PI / 180); // Reduced from 3° to 2°
    }

    // SMOOTH TRANSITION: Lerp current rotation towards target (prevents jerky changes)
    this.currentStateRotation.x = this.lerp(
      this.currentStateRotation.x,
      this.targetStateRotation.x,
      deltaTime * this.rotationTransitionSpeed
    );
    this.currentStateRotation.y = this.lerp(
      this.currentStateRotation.y,
      this.targetStateRotation.y,
      deltaTime * this.rotationTransitionSpeed
    );
    this.currentStateRotation.z = this.lerp(
      this.currentStateRotation.z,
      this.targetStateRotation.z,
      deltaTime * this.rotationTransitionSpeed
    );

    // Mouse tracking (3D - both X and Y axis)
    const mouseTiltX = -mouseY * (20 * Math.PI / 180); // Up-down: 20° range
    const mouseTiltY = mouseX * (20 * Math.PI / 180);  // Left-right: 20° range

    // Combine all rotations: idle sway + mouse tracking + smoothed state-based behavior
    this.mesh.rotation.x = mouseTiltX + idleSwayX + this.currentStateRotation.x;
    this.mesh.rotation.y = mouseTiltY + idleSwayY + this.currentStateRotation.y;
    this.mesh.rotation.z = this.currentStateRotation.z;

    // Breathing effect (pulsing glow with interpolated speed)
    let breathingIntensity = currentGlowIntensity +
                             Math.sin(this.time * currentBreathSpeed) * 0.15;

    // Listening mode: add pulsing effect
    if (this.isListening) {
      this.listeningIntensity += deltaTime * 3; // Increase intensity
      const listeningPulse = Math.sin(this.listeningIntensity * 4) * 0.3; // Fast pulse
      breathingIntensity += listeningPulse;

      // Add subtle scale pulsing while listening
      const scalePulse = 1 + Math.sin(this.listeningIntensity * 4) * 0.02; // 2% scale variation
      this.mesh.scale.setScalar(scalePulse);
    } else {
      // Reset scale when not listening
      this.mesh.scale.setScalar(1);
    }

    this.material.emissiveIntensity = breathingIntensity;

    // Color transition
    if (this.colorTransitionProgress < 1) {
      this.colorTransitionProgress += deltaTime / this.colorTransitionDuration;
      this.colorTransitionProgress = Math.min(this.colorTransitionProgress, 1);

      // Lerp between current and target color
      const currentEmissive = new THREE.Color(this.currentColor.emissive);
      const targetEmissive = new THREE.Color(this.targetColor.emissive);
      currentEmissive.lerp(targetEmissive, this.colorTransitionProgress);
      this.material.emissive.copy(currentEmissive);

      if (this.colorTransitionProgress >= 1) {
        this.currentColor = this.targetColor;
      }
    }

    // Blinking animation
    this.updateBlinking(deltaTime);

    // Update pupil position
    this.updatePupilPosition(mouseX, mouseY);
  }

  /**
   * Update blinking animation (adapts to color mode and state)
   */
  updateBlinking(deltaTime) {
    this.blinkTimer += deltaTime;

    // Get blink parameters from current color
    const blinkStyle = this.currentColor.blinkStyle || 'steady';
    const blinkSpeed = this.currentColor.blinkSpeed || 0.15;

    // Adjust blink frequency based on state
    let blinkInterval;
    if (this.isListening) {
      // LISTENING: Very frequent blinking (alert, attentive)
      blinkInterval = 0.8 + Math.random() * 0.7; // Blink every 0.8-1.5 seconds
    } else if (this.isThinking) {
      // THINKING: Very rare blinking (deep concentration)
      blinkInterval = 6 + Math.random() * 4; // Blink every 6-10 seconds
    } else if (this.isSpeaking) {
      // SPEAKING: Moderate blinking (natural conversation)
      blinkInterval = 2 + Math.random() * 2; // Blink every 2-4 seconds
    } else {
      // IDLE/CALM: Reduced frequency (peaceful)
      blinkInterval = 4 + Math.random() * 5; // Blink every 4-9 seconds (increased from 3-7)
    }

    if (!this.isBlinking && this.blinkTimer >= this.nextBlinkTime) {
      this.isBlinking = true;
      this.blinkTimer = 0;
      this.blinkCount = 0;
    }

    if (this.isBlinking) {
      const blinkProgress = this.blinkTimer / blinkSpeed;

      if (blinkProgress >= 1) {
        // Handle double blink for RED mode
        if (blinkStyle === 'double' && this.blinkCount === 0) {
          this.blinkCount = 1;
          this.blinkTimer = 0;
          // Short pause before second blink
          this.leftEye.scale.y = 1;
          this.rightEye.scale.y = 1;
        } else {
          // Blink complete
          this.isBlinking = false;
          this.blinkTimer = 0;
          this.blinkCount = 0;
          this.nextBlinkTime = blinkInterval; // Use state-based interval
          this.leftEye.scale.y = 1;
          this.rightEye.scale.y = 1;
        }
      } else {
        // Animate blink (close and open)
        const scaleY = Math.abs(Math.sin(blinkProgress * Math.PI));
        this.leftEye.scale.y = scaleY;
        this.rightEye.scale.y = scaleY;
      }
    }
  }

  /**
   * Linear interpolation helper
   */
  lerp(start, end, t) {
    return start + (end - start) * t;
  }

  /**
   * Get current color name
   */
  getCurrentColor() {
    return this.currentColor.name;
  }

  /**
   * Get the THREE.js mesh object
   */
  getMesh() {
    return this.mesh;
  }

  /**
   * Dispose and cleanup
   */
  dispose() {
    this.mesh.geometry.dispose();
    this.material.dispose();
  }
}
