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

    // Bounce animation state (when changing color)
    this.bounceProgress = 0;
    this.isBouncing = false;
    this.bounceDuration = 0.6; // seconds
    this.bounceHeight = 0.3; // how high to jump

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
    this.isBouncing = true;
    this.bounceProgress = 0;
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

    // Base floating animation (sine wave - always smooth)
    let baseY = Math.sin(this.time * Math.PI * 2) * 0.2;

    // Bounce animation (when changing color)
    if (this.isBouncing) {
      this.bounceProgress += deltaTime / this.bounceDuration;

      if (this.bounceProgress >= 1) {
        this.bounceProgress = 0;
        this.isBouncing = false;
      } else {
        // Spring bounce effect (ease-out bounce)
        const t = this.bounceProgress;
        const bounceEffect = Math.sin(t * Math.PI * 3) * (1 - t) * this.bounceHeight;
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

    // Idle sway animation (gentle left-right rotation with interpolated speed)
    const swayAngle = Math.sin(this.time * currentAnimSpeed) * (20 * Math.PI / 180); // 20°
    this.mesh.rotation.y = swayAngle;

    // Subtle forward-backward tilt (X-axis) for living, breathing feel
    const subtleTiltX = Math.sin(this.time * currentAnimSpeed * 0.7) * (8 * Math.PI / 180); // 8° slower than Y sway

    // Tilt to follow mouse (up-down) + subtle breathing tilt
    const mouseTiltAngle = -mouseY * (15 * Math.PI / 180); // 15°
    this.mesh.rotation.x = mouseTiltAngle + subtleTiltX;

    // Breathing effect (pulsing glow with interpolated speed)
    const breathingIntensity = currentGlowIntensity +
                               Math.sin(this.time * currentBreathSpeed) * 0.15;
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
   * Update blinking animation (adapts to color mode)
   */
  updateBlinking(deltaTime) {
    this.blinkTimer += deltaTime;

    // Get blink parameters from current color
    const blinkStyle = this.currentColor.blinkStyle || 'steady';
    const blinkSpeed = this.currentColor.blinkSpeed || 0.15;

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
          this.nextBlinkTime = 3 + Math.random() * 4;
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
