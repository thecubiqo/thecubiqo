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

    // Handle window resize
    window.addEventListener('resize', () => this.onWindowResize());
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

    this.renderer.setSize(window.innerWidth, window.innerHeight);

    // Improved pixel ratio - use native resolution on mobile for crisp rendering
    let pixelRatio = window.devicePixelRatio;
    if (isLowEnd) {
      pixelRatio = Math.min(pixelRatio, 1.5); // 1.5x on low-end (better than 1x)
    } else if (isMobile) {
      pixelRatio = Math.min(pixelRatio, 2); // Full 2x on modern mobile
    } else {
      pixelRatio = Math.min(pixelRatio, 2); // Cap at 2x on desktop
    }
    this.renderer.setPixelRatio(pixelRatio);

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
   * Handle window resize
   */
  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
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
    window.removeEventListener('resize', this.onWindowResize);
    this.renderer.dispose();
    this.container.removeChild(this.renderer.domElement);
  }
}
