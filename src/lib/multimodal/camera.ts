/**
 * Camera Service
 * Handle camera access and basic vision processing
 */

import type { CameraType, VisionDetection } from './types';

export class CameraService {
  private stream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private isProcessing = false;

  /**
   * Initialize camera
   */
  async initialize(camera: CameraType = 'front'): Promise<boolean> {
    try {
      const facingMode = camera === 'front' ? 'user' : 'environment';
      
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      return true;
    } catch (error) {
      console.error('Failed to initialize camera:', error);
      return false;
    }
  }

  /**
   * Attach camera stream to video element
   */
  attachToVideo(video: HTMLVideoElement): void {
    if (!this.stream) {
      throw new Error('Camera not initialized');
    }

    this.videoElement = video;
    video.srcObject = this.stream;
  }

  /**
   * Capture frame from video
   */
  captureFrame(): ImageData | null {
    if (!this.videoElement) return null;

    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      this.canvas.width = this.videoElement.videoWidth;
      this.canvas.height = this.videoElement.videoHeight;
    }

    const ctx = this.canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(this.videoElement, 0, 0, this.canvas.width, this.canvas.height);
    return ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * Basic motion detection
   * Returns true if significant motion detected
   */
  detectMotion(threshold = 30): boolean {
    const frame = this.captureFrame();
    if (!frame) return false;

    // Simple motion detection would compare with previous frame
    // This is a placeholder for more sophisticated detection
    return false;
  }

  /**
   * Detect bright areas (simple object highlighting)
   */
  detectBrightAreas(): VisionDetection[] {
    const frame = this.captureFrame();
    if (!frame) return [];

    // Placeholder for object detection
    // In production, this would use TensorFlow.js or similar
    return [];
  }

  /**
   * Stop camera
   */
  stop(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null;
      this.videoElement = null;
    }

    this.isProcessing = false;
  }

  /**
   * Get current stream
   */
  getStream(): MediaStream | null {
    return this.stream;
  }

  /**
   * Check if camera is active
   */
  isActive(): boolean {
    return this.stream !== null && this.stream.active;
  }
}
