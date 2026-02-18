/**
 * Multimodal Coordinator
 * Combines vision and audio inputs into unified context
 */

import { CameraService } from './camera';
import { AudioService } from './audio';
import type { 
  MultimodalContext, 
  VisionResult, 
  EmotionState,
  AudioFeatures,
  UserState 
} from './types';

export class MultimodalCoordinator {
  private cameraService: CameraService;
  private audioService: AudioService;
  private lastVisionResult: VisionResult | null = null;
  private lastEmotionState: EmotionState | null = null;
  private lastAudioFeatures: AudioFeatures | null = null;

  constructor() {
    this.cameraService = new CameraService();
    this.audioService = new AudioService();
  }

  /**
   * Initialize both vision and audio
   */
  async initialize(options: {
    enableVision?: boolean;
    enableAudio?: boolean;
    cameraType?: 'front' | 'back';
  }): Promise<{ vision: boolean; audio: boolean }> {
    const results = {
      vision: false,
      audio: false,
    };

    if (options.enableVision) {
      results.vision = await this.cameraService.initialize(options.cameraType || 'front');
    }

    if (options.enableAudio) {
      results.audio = await this.audioService.initialize();
    }

    // Start continuous audio analysis if audio is enabled
    if (results.audio) {
      this.audioService.startAnalysis((features) => {
        this.lastAudioFeatures = features;
        this.lastEmotionState = this.audioService.detectEmotion(features);
      }, 500);
    }

    return results;
  }

  /**
   * Get current multimodal context
   */
  getContext(): MultimodalContext {
    const context: MultimodalContext = {
      timestamp: Date.now(),
      metadata: {
        visionEnabled: this.cameraService.isActive(),
        audioEnabled: this.audioService.isActive(),
      },
    };

    if (this.lastVisionResult) {
      context.vision = {
        objects: this.lastVisionResult.objects,
        faces: this.lastVisionResult.faces,
        sceneDescription: this.lastVisionResult.sceneDescription,
      };
    }

    if (this.lastEmotionState && this.lastAudioFeatures) {
      context.audio = {
        emotion: this.lastEmotionState,
        features: this.lastAudioFeatures,
      };
    }

    // Derive user state from multimodal inputs
    context.userState = this.deriveUserState();

    return context;
  }

  /**
   * Derive user state from vision and audio
   */
  private deriveUserState(): UserState {
    const state: UserState = {
      engagement: 'medium',
      mood: 'neutral',
      attention: 'unknown',
    };

    // Use audio emotion to inform mood
    if (this.lastEmotionState) {
      state.mood = this.lastEmotionState.primary;
      
      // Map arousal to engagement
      if (this.lastEmotionState.arousal > 0.7) {
        state.engagement = 'high';
      } else if (this.lastEmotionState.arousal < 0.3) {
        state.engagement = 'low';
      }
    }

    // Use face detection to inform attention
    if (this.lastVisionResult && this.lastVisionResult.faces.length > 0) {
      state.attention = 'focused';
    } else if (this.lastVisionResult) {
      state.attention = 'distracted';
    }

    return state;
  }

  /**
   * Create enhanced prompt with multimodal context
   */
  createEnhancedPrompt(userMessage: string): {
    originalText: string;
    enhancedText: string;
    systemContext: string;
  } {
    const context = this.getContext();
    let systemContext = '';
    let enhancedText = userMessage;

    // Add vision context
    if (context.vision) {
      const objects = context.vision.objects.map(obj => obj.label).join(', ');
      if (objects) {
        systemContext += `\n[Vision Context] I can see: ${objects}`;
      }

      if (context.vision.faces.length > 0) {
        systemContext += `\n[Vision Context] User is present in frame`;
      }
    }

    // Add audio context
    if (context.audio) {
      const emotion = context.audio.emotion.primary;
      systemContext += `\n[Audio Context] User emotion: ${emotion}`;
    }

    // Add user state
    if (context.userState) {
      systemContext += `\n[User State] Mood: ${context.userState.mood}, Engagement: ${context.userState.engagement}`;
    }

    return {
      originalText: userMessage,
      enhancedText,
      systemContext,
    };
  }

  /**
   * Get camera service
   */
  getCameraService(): CameraService {
    return this.cameraService;
  }

  /**
   * Get audio service
   */
  getAudioService(): AudioService {
    return this.audioService;
  }

  /**
   * Stop all services
   */
  stop(): void {
    this.cameraService.stop();
    this.audioService.stop();
  }
}
