/**
 * Multimodal Permissions
 * Handle camera and microphone permissions
 */

import type { CameraPermissionState, MicrophonePermissionState } from './types';

/**
 * Check camera permission status
 */
export async function checkCameraPermission(): Promise<CameraPermissionState> {
  if (!navigator.permissions) {
    return { granted: false, denied: false, prompt: true };
  }

  try {
    const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
    return {
      granted: result.state === 'granted',
      denied: result.state === 'denied',
      prompt: result.state === 'prompt',
    };
  } catch (error) {
    console.error('Error checking camera permission:', error);
    return { granted: false, denied: false, prompt: true };
  }
}

/**
 * Check microphone permission status
 */
export async function checkMicrophonePermission(): Promise<MicrophonePermissionState> {
  if (!navigator.permissions) {
    return { granted: false, denied: false, prompt: true };
  }

  try {
    const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
    return {
      granted: result.state === 'granted',
      denied: result.state === 'denied',
      prompt: result.state === 'prompt',
    };
  } catch (error) {
    console.error('Error checking microphone permission:', error);
    return { granted: false, denied: false, prompt: true };
  }
}

/**
 * Request camera access
 */
export async function requestCameraAccess(preferredCamera: 'front' | 'back' = 'front'): Promise<MediaStream | null> {
  try {
    const facingMode = preferredCamera === 'front' ? 'user' : 'environment';
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode },
      audio: false,
    });
    return stream;
  } catch (error) {
    console.error('Error requesting camera access:', error);
    return null;
  }
}

/**
 * Request microphone access
 */
export async function requestMicrophoneAccess(): Promise<MediaStream | null> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: false,
      audio: true,
    });
    return stream;
  } catch (error) {
    console.error('Error requesting microphone access:', error);
    return null;
  }
}

/**
 * Stop media stream
 */
export function stopMediaStream(stream: MediaStream | null): void {
  if (!stream) return;
  
  stream.getTracks().forEach(track => {
    track.stop();
  });
}
