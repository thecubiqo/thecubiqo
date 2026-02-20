/**
 * Audio Service
 * Handle microphone access and audio analysis
 */

import type { AudioFeatures, EmotionType, EmotionState } from './types';

export class AudioService {
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private isAnalyzing = false;

  /**
   * Initialize audio capture
   */
  async initialize(): Promise<boolean> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Create audio context
      this.audioContext = new AudioContext();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;

      // Connect stream to analyser
      this.source = this.audioContext.createMediaStreamSource(this.stream);
      this.source.connect(this.analyser);

      return true;
    } catch (error) {
      console.error('Failed to initialize audio:', error);
      return false;
    }
  }

  /**
   * Get current audio features
   */
  getAudioFeatures(): AudioFeatures | null {
    if (!this.analyser) return null;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const timeDataArray = new Uint8Array(bufferLength);
    
    this.analyser.getByteFrequencyData(dataArray);
    this.analyser.getByteTimeDomainData(timeDataArray);

    // Calculate volume (RMS)
    let sum = 0;
    for (let i = 0; i < timeDataArray.length; i++) {
      const normalized = (timeDataArray[i] - 128) / 128;
      sum += normalized * normalized;
    }
    const rms = Math.sqrt(sum / timeDataArray.length);
    const volume = Math.min(100, rms * 200); // Scale to 0-100

    // Calculate dominant frequency (simple pitch estimation)
    let maxIndex = 0;
    let maxValue = 0;
    for (let i = 0; i < dataArray.length; i++) {
      if (dataArray[i] > maxValue) {
        maxValue = dataArray[i];
        maxIndex = i;
      }
    }
    const nyquist = (this.audioContext?.sampleRate || 44100) / 2;
    const pitch = (maxIndex * nyquist) / bufferLength;

    return {
      volume,
      pitch,
      cadence: 0, // Would need more sophisticated analysis
      energy: rms,
      timestamp: Date.now(),
      frequencyData: dataArray,
    };
  }

  /**
   * Detect emotion from audio features
   * This is a simplified placeholder - production would use ML model
   */
  detectEmotion(features: AudioFeatures): EmotionState {
    // Simple heuristic-based emotion detection
    let emotion: EmotionType = 'neutral';
    let valence = 0;
    let arousal = 0;

    // High volume + high pitch = excited/happy
    if (features.volume > 60 && features.pitch > 300) {
      emotion = 'excited';
      valence = 0.7;
      arousal = 0.8;
    }
    // Low volume + low pitch = sad/calm
    else if (features.volume < 30 && features.pitch < 200) {
      emotion = 'calm';
      valence = -0.2;
      arousal = 0.2;
    }
    // Medium levels = neutral
    else {
      emotion = 'neutral';
      valence = 0;
      arousal = 0.5;
    }

    return {
      primary: emotion,
      confidence: 0.6, // Lower confidence for heuristic-based detection
      valence,
      arousal,
      timestamp: Date.now(),
    };
  }

  /**
   * Start continuous audio analysis
   */
  startAnalysis(callback: (features: AudioFeatures) => void, interval = 500): void {
    if (this.isAnalyzing) return;

    this.isAnalyzing = true;
    const analyze = () => {
      if (!this.isAnalyzing) return;

      const features = this.getAudioFeatures();
      if (features) {
        callback(features);
      }

      setTimeout(analyze, interval);
    };

    analyze();
  }

  /**
   * Stop audio analysis
   */
  stopAnalysis(): void {
    this.isAnalyzing = false;
  }

  /**
   * Stop audio capture
   */
  stop(): void {
    this.stopAnalysis();

    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.analyser = null;
  }

  /**
   * Get current stream
   */
  getStream(): MediaStream | null {
    return this.stream;
  }

  /**
   * Check if audio is active
   */
  isActive(): boolean {
    return this.stream !== null && this.stream.active;
  }
}
