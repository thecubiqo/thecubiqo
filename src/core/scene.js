/**
 * 🎬 Scene Setup
 *
 * Initializes Three.js scene, camera, renderer, and lighting
 * Optimized for performance on mobile devices
 */

import * as THREE from 'three';

export class SceneManager {
  constructor(container) {
    this.container = container;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.lights = {};
    this.shadowPlane = null;
    this.resizeTimeout = null; // For debouncing resize events

    this.init();
  }

  /**
   * Initialize the Three.js scene
   */
  init() {
    // Create scene
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x16213e, 5, 15);

    // Setup camera
    this.setupCamera();

    // Setup renderer
    this.setupRenderer();

    // Setup lighting
    this.setupLighting();

    // Setup shadow plane
    this.setupShadowPlane();

    // Handle window resize with debouncing (iOS Safari fires multiple events)
    window.addEventListener('resize', () => this.handleResize());
  }

  /**
   * Setup camera
   */
  setupCamera() {
    this.camera = new THREE.PerspectiveCamera(
      45,                                    // FOV
      window.innerWidth / window.innerHeight, // Aspect ratio
      0.1,                                   // Near clipping
      1000                                   // Far clipping
    );
    this.camera.position.z = 6;
  }

  /**
   * Setup renderer with adaptive performance optimization
   */
  setupRenderer() {
    // Detect device capabilities
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isLowEnd = isMobile && (navigator.hardwareConcurrency <= 4 || navigator.deviceMemory <= 4);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true, // Always enable antialiasing for better quality
      alpha: true,
      powerPreference: isMobile ? 'default' : 'high-performance' // Balanced for mobile
    });

    // Improved pixel ratio - use native resolution on mobile for crisp rendering
    let pixelRatio = window.devicePixelRatio;
    if (isLowEnd) {
      pixelRatio = Math.min(pixelRatio, 1.5); // 1.5x on low-end (better than 1x)
    } else if (isMobile) {
      pixelRatio = Math.min(pixelRatio, 2); // Full 2x on modern mobile
    } else {
      pixelRatio = Math.min(pixelRatio, 2); // Cap at 2x on desktop
    }

    // IMPORTANT: Set pixel ratio BEFORE setSize to prevent double multiplication
    this.renderer.setPixelRatio(pixelRatio);

    // Now set size (will use pixel ratio set above)
    this.renderer.setSize(window.innerWidth, window.innerHeight, true);

    // Shadow settings (keep enabled for quality)
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Append to container
    this.container.appendChild(this.renderer.domElement);

    console.log(`📱 Renderer: ${isMobile ? 'Mobile' : 'Desktop'}, Pixel Ratio: ${pixelRatio.toFixed(1)}x, AA: true, Shadows: true`);
  }

  /**
   * Setup scene lighting
   */
  setupLighting() {
    // Ambient light (soft overall illumination)
    this.lights.ambient = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(this.lights.ambient);

    // Main point light (key light for cube)
    this.lights.main = new THREE.PointLight(0xffffff, 1.5, 100);
    this.lights.main.position.set(5, 5, 5);
    this.lights.main.castShadow = true;
    this.scene.add(this.lights.main);

    // Fill light (softer, from opposite side)
    this.lights.fill = new THREE.PointLight(0xffffff, 0.5, 100);
    this.lights.fill.position.set(-3, 2, -3);
    this.scene.add(this.lights.fill);
  }

  /**
   * Setup shadow plane (subtle shadow under cube)
   */
  setupShadowPlane() {
    const shadowGeometry = new THREE.CircleGeometry(2.5, 32);
    const shadowMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.3
    });

    this.shadowPlane = new THREE.Mesh(shadowGeometry, shadowMaterial);
    this.shadowPlane.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    this.shadowPlane.position.y = -2; // Below the cube
    this.shadowPlane.receiveShadow = true;

    this.scene.add(this.shadowPlane);
  }

  /**
   * Update shadow based on cube position (call from render loop)
   */
  updateShadow(cubeYPosition) {
    if (this.shadowPlane) {
      // Shadow grows/shrinks based on cube height
      const scale = 1 + cubeYPosition * 0.05;
      this.shadowPlane.scale.setScalar(scale);

      // Shadow fades when cube is higher
      this.shadowPlane.material.opacity = 0.3 - cubeYPosition * 0.05;
    }
  }

  /**
   * Debounced resize handler (prevents multiple rapid calls on iOS)
   */
  handleResize() {
    // Clear previous timeout
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }

    // Debounce resize calls (wait 150ms after last resize event)
    this.resizeTimeout = setTimeout(() => {
      this.onWindowResize();
    }, 150);
  }

  /**
   * Handle window resize
   */
  onWindowResize() {
    console.log('🎯 onWindowResize() called!'); // DEBUG: confirm function is running

    // Detect device capabilities for pixel ratio
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isLowEnd = isMobile && (navigator.hardwareConcurrency <= 4 || navigator.deviceMemory <= 4);

    // BEST PRACTICE: Use container dimensions (most reliable, no Safari bugs)
    // The container has 100vw x 100vh in CSS, so its clientWidth/Height are accurate
    const containerWidth = this.container.clientWidth;
    const containerHeight = this.container.clientHeight;

    // Fallback to window.inner* if container not available (shouldn't happen)
    let width = containerWidth || window.innerWidth;
    let height = containerHeight || window.innerHeight;

    // Debug logging
    const windowW = window.innerWidth;
    const windowH = window.innerHeight;
    if (windowW !== width || windowH !== height) {
      console.warn(`⚠️ Window mismatch! window.inner: ${windowW}x${windowH}, container: ${width}x${height} (using container)`);
    }

    // Recalculate pixel ratio (important for orientation changes on iOS)
    let pixelRatio = window.devicePixelRatio;
    if (isLowEnd) {
      pixelRatio = Math.min(pixelRatio, 1.5);
    } else if (isMobile) {
      pixelRatio = Math.min(pixelRatio, 2);
    } else {
      pixelRatio = Math.min(pixelRatio, 2);
    }

    // Update pixel ratio BEFORE setSize (prevents accumulation)
    this.renderer.setPixelRatio(pixelRatio);

    // Update camera aspect ratio
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    // Update renderer size (true = update CSS style automatically)
    // This ensures canvas buffer and CSS size are in sync
    this.renderer.setSize(width, height, true);

    // Simple logging
    console.log(`✅ Resize: ${width}x${height}, Pixel Ratio: ${pixelRatio.toFixed(1)}x, Container: ${containerWidth}x${containerHeight}, window.inner: ${windowW}x${windowH}`);
  }

  /**
   * Add object to scene
   */
  add(object) {
    this.scene.add(object);
  }

  /**
   * Remove object from scene
   */
  remove(object) {
    this.scene.remove(object);
  }

  /**
   * Render the scene
   */
  render() {
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Cleanup and dispose
   */
  dispose() {
    // Clear any pending resize timeout
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }

    // Remove event listener (note: we bound to handleResize, not onWindowResize)
    window.removeEventListener('resize', this.handleResize);
    this.renderer.dispose();
    this.container.removeChild(this.renderer.domElement);
  }
}
