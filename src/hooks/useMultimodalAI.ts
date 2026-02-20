/**
 * Multimodal AI Hooks
 * React hooks for using multimodal capabilities
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { MultimodalCoordinator } from '../lib/multimodal/coordinator';
import type { 
  MultimodalContext, 
  VisionResult, 
  EmotionState,
  PermissionState 
} from '../lib/multimodal/types';

/**
 * Hook for multimodal AI functionality
 */
export function useMultimodalAI(options: {
  enableVision?: boolean;
  enableAudio?: boolean;
  autoStart?: boolean;
} = {}) {
  const [isActive, setIsActive] = useState(false);
  const [visionEnabled, setVisionEnabled] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [context, setContext] = useState<MultimodalContext | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [cameraPermission, setCameraPermission] = useState<PermissionState>('prompt');
  const [micPermission, setMicPermission] = useState<PermissionState>('prompt');

  const coordinatorRef = useRef<MultimodalCoordinator | null>(null);
  const contextIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Initialize coordinator
   */
  const initialize = useCallback(async () => {
    try {
      if (!coordinatorRef.current) {
        coordinatorRef.current = new MultimodalCoordinator();
      }

      const results = await coordinatorRef.current.initialize({
        enableVision: options.enableVision ?? false,
        enableAudio: options.enableAudio ?? false,
        cameraType: 'front',
      });

      setVisionEnabled(results.vision);
      setAudioEnabled(results.audio);
      setIsActive(results.vision || results.audio);

      // Update permissions
      if (results.vision) {
        setCameraPermission('granted');
      }
      if (results.audio) {
        setMicPermission('granted');
      }

      // Start periodic context updates
      if (contextIntervalRef.current) {
        clearInterval(contextIntervalRef.current);
      }
      contextIntervalRef.current = setInterval(() => {
        if (coordinatorRef.current) {
          const newContext = coordinatorRef.current.getContext();
          setContext(newContext);
        }
      }, 1000);

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to initialize'));
      if (options.enableVision) {
        setCameraPermission('denied');
      }
      if (options.enableAudio) {
        setMicPermission('denied');
      }
    }
  }, [options.enableVision, options.enableAudio]);

  /**
   * Stop all multimodal features
   */
  const stop = useCallback(() => {
    if (coordinatorRef.current) {
      coordinatorRef.current.stop();
    }
    if (contextIntervalRef.current) {
      clearInterval(contextIntervalRef.current);
    }
    setIsActive(false);
    setVisionEnabled(false);
    setAudioEnabled(false);
    setContext(null);
  }, []);

  /**
   * Get enhanced prompt with multimodal context
   */
  const getEnhancedPrompt = useCallback((message: string) => {
    if (!coordinatorRef.current) {
      return {
        originalText: message,
        enhancedText: message,
        systemContext: '',
      };
    }
    return coordinatorRef.current.createEnhancedPrompt(message);
  }, []);

  /**
   * Auto-start if requested
   */
  useEffect(() => {
    if (options.autoStart) {
      initialize();
    }

    return () => {
      stop();
    };
  }, [options.autoStart, initialize, stop]);

  return {
    isActive,
    visionEnabled,
    audioEnabled,
    context,
    error,
    cameraPermission,
    micPermission,
    initialize,
    stop,
    getEnhancedPrompt,
  };
}

/**
 * Hook for checking media permissions
 */
export function useMediaPermissions() {
  const [camera, setCamera] = useState<PermissionState>('prompt');
  const [microphone, setMicrophone] = useState<PermissionState>('prompt');

  useEffect(() => {
    const checkPermissions = async () => {
      if (!navigator.permissions) return;

      try {
        const cameraResult = await navigator.permissions.query({ 
          name: 'camera' as PermissionName 
        });
        setCamera(cameraResult.state as PermissionState);

        const micResult = await navigator.permissions.query({ 
          name: 'microphone' as PermissionName 
        });
        setMicrophone(micResult.state as PermissionState);
      } catch (err) {
        console.error('Failed to check permissions:', err);
      }
    };

    checkPermissions();
  }, []);

  return { camera, microphone };
}
