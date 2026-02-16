/**
 * React Hook for CQ-to-CQ Calls
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createCallManager, isWebRTCSupported } from '../webrtc-calls';
import type { CQCallManager } from '../webrtc-calls';

export function useCQCalls(userId: string) {
  const [isInCall, setIsInCall] = useState(false);
  const [callType, setCallType] = useState<'audio' | 'video' | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const callManagerRef = useRef<CQCallManager | null>(null);

  useEffect(() => {
    if (!userId) return;

    // Initialize call manager
    callManagerRef.current = createCallManager(userId);

    // Set up remote stream handler
    callManagerRef.current.onRemoteStream = (stream) => {
      setRemoteStream(stream);
    };

    return () => {
      if (callManagerRef.current) {
        callManagerRef.current.endCall();
      }
    };
  }, [userId]);

  /**
   * Start a call
   */
  const startCall = useCallback(
    async (
      conversationId: string,
      recipientId: string,
      type: 'audio' | 'video'
    ) => {
      if (!callManagerRef.current) {
        throw new Error('Call manager not initialized');
      }

      if (!isWebRTCSupported()) {
        throw new Error('WebRTC is not supported in this browser');
      }

      try {
        const callId = await callManagerRef.current.initiateCall(
          conversationId,
          recipientId,
          type
        );

        setIsInCall(true);
        setCallType(type);
        setLocalStream(callManagerRef.current.getLocalStream());

        return callId;
      } catch (error) {
        console.error('Error starting call:', error);
        throw error;
      }
    },
    []
  );

  /**
   * Answer an incoming call
   */
  const answerCall = useCallback(async (callId: string, type: 'audio' | 'video') => {
    if (!callManagerRef.current) {
      throw new Error('Call manager not initialized');
    }

    try {
      await callManagerRef.current.answerCall(callId, type);

      setIsInCall(true);
      setCallType(type);
      setLocalStream(callManagerRef.current.getLocalStream());
    } catch (error) {
      console.error('Error answering call:', error);
      throw error;
    }
  }, []);

  /**
   * End the call
   */
  const endCall = useCallback(async () => {
    if (!callManagerRef.current) return;

    try {
      await callManagerRef.current.endCall();

      setIsInCall(false);
      setCallType(null);
      setLocalStream(null);
      setRemoteStream(null);
      setIsMuted(false);
      setIsCameraOff(false);
      setIsScreenSharing(false);
    } catch (error) {
      console.error('Error ending call:', error);
    }
  }, []);

  /**
   * Toggle microphone mute
   */
  const toggleMute = useCallback(() => {
    if (!callManagerRef.current) return;

    const newMutedState = !isMuted;
    callManagerRef.current.toggleMicrophone(newMutedState);
    setIsMuted(newMutedState);
  }, [isMuted]);

  /**
   * Toggle camera
   */
  const toggleCamera = useCallback(() => {
    if (!callManagerRef.current) return;

    const newCameraState = !isCameraOff;
    callManagerRef.current.toggleCamera(!newCameraState);
    setIsCameraOff(newCameraState);
  }, [isCameraOff]);

  /**
   * Start screen sharing
   */
  const startScreenShare = useCallback(async () => {
    if (!callManagerRef.current) {
      throw new Error('Call manager not initialized');
    }

    try {
      await callManagerRef.current.startScreenShare();
      setIsScreenSharing(true);
    } catch (error) {
      console.error('Error starting screen share:', error);
      throw error;
    }
  }, []);

  /**
   * Stop screen sharing
   */
  const stopScreenShare = useCallback(async () => {
    if (!callManagerRef.current) return;

    try {
      await callManagerRef.current.stopScreenShare();
      setIsScreenSharing(false);
    } catch (error) {
      console.error('Error stopping screen share:', error);
    }
  }, []);

  return {
    isInCall,
    callType,
    isMuted,
    isCameraOff,
    isScreenSharing,
    localStream,
    remoteStream,
    startCall,
    answerCall,
    endCall,
    toggleMute,
    toggleCamera,
    startScreenShare,
    stopScreenShare,
  };
}
