/**
 * WebRTC Implementation for CQ-to-CQ Calls
 * Audio/Video calling and screen sharing
 */

import { cqWebSocketServer } from './websocket-server';
import { initiateCall, updateCallStatus } from './supabase-client';
import type { CQCall, CameraFacingMode } from './types';

// WebRTC configuration
const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    // Add TURN servers for better connectivity
    // {
    //   urls: 'turn:your-turn-server.com:3478',
    //   username: 'username',
    //   credential: 'password',
    // },
  ],
};

export class CQCallManager {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private screenShareStream: MediaStream | null = null;
  private callId: string | null = null;
  private userId: string;
  private remoteUserId: string | null = null;
  private facingMode: CameraFacingMode = 'user';

  constructor(userId: string) {
    this.userId = userId;
  }

  /**
   * Initiate an outgoing call
   */
  async initiateCall(
    conversationId: string,
    recipientId: string,
    type: 'audio' | 'video'
  ): Promise<string> {
    try {
      // Create call record in database
      const call = await initiateCall(conversationId, this.userId, recipientId, type);
      this.callId = call.id;
      this.remoteUserId = recipientId;

      // Get local media stream
      await this.initLocalStream(type === 'video');

      // Create peer connection
      this.createPeerConnection();

      // Add local tracks to peer connection
      if (this.localStream) {
        this.localStream.getTracks().forEach((track) => {
          this.peerConnection!.addTrack(track, this.localStream!);
        });
      }

      // Create and send offer
      const offer = await this.peerConnection!.createOffer();
      await this.peerConnection!.setLocalDescription(offer);

      // Send offer via WebSocket
      await cqWebSocketServer.sendToUser(recipientId, {
        type: 'call_signal',
        payload: {
          callId: call.id,
          senderId: this.userId,
          signal: {
            type: 'offer',
            sdp: offer.sdp,
          },
        },
        timestamp: new Date(),
      });

      return call.id;
    } catch (error) {
      console.error('Error initiating call:', error);
      throw error;
    }
  }

  /**
   * Answer an incoming call
   */
  async answerCall(callId: string, callType: 'audio' | 'video') {
    try {
      this.callId = callId;

      // Get local media stream
      await this.initLocalStream(callType === 'video');

      // Create peer connection
      this.createPeerConnection();

      // Add local tracks
      if (this.localStream) {
        this.localStream.getTracks().forEach((track) => {
          this.peerConnection!.addTrack(track, this.localStream!);
        });
      }

      // Wait for offer, then create answer
      // This will be handled by handleSignal() when offer arrives
    } catch (error) {
      console.error('Error answering call:', error);
      throw error;
    }
  }

  /**
   * Handle incoming WebRTC signal
   */
  async handleSignal(signal: any, senderId: string) {
    this.remoteUserId = senderId;

    if (signal.type === 'offer') {
      // Receiving an offer
      await this.peerConnection!.setRemoteDescription(
        new RTCSessionDescription({ type: 'offer', sdp: signal.sdp })
      );

      // Create answer
      const answer = await this.peerConnection!.createAnswer();
      await this.peerConnection!.setLocalDescription(answer);

      // Send answer back
      await cqWebSocketServer.sendToUser(senderId, {
        type: 'call_signal',
        payload: {
          callId: this.callId,
          senderId: this.userId,
          signal: {
            type: 'answer',
            sdp: answer.sdp,
          },
        },
        timestamp: new Date(),
      });

      // Update call status to active
      if (this.callId) {
        await updateCallStatus(this.callId, 'active');
      }
    } else if (signal.type === 'answer') {
      // Receiving an answer
      await this.peerConnection!.setRemoteDescription(
        new RTCSessionDescription({ type: 'answer', sdp: signal.sdp })
      );

      // Update call status to active
      if (this.callId) {
        await updateCallStatus(this.callId, 'active');
      }
    }
  }

  /**
   * Handle ICE candidate
   */
  async handleIceCandidate(candidate: RTCIceCandidateInit) {
    try {
      await this.peerConnection!.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
    }
  }

  /**
   * End the call
   */
  async endCall() {
    try {
      // Stop all tracks
      if (this.localStream) {
        this.localStream.getTracks().forEach((track) => track.stop());
      }
      if (this.screenShareStream) {
        this.screenShareStream.getTracks().forEach((track) => track.stop());
      }

      // Close peer connection
      if (this.peerConnection) {
        this.peerConnection.close();
      }

      // Update call status
      if (this.callId) {
        const startTime = new Date(); // Get from call record
        const endTime = new Date();
        const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

        await updateCallStatus(this.callId, 'ended', {
          endedAt: endTime,
          duration,
        });
      }

      // Notify other party
      if (this.remoteUserId) {
        await cqWebSocketServer.sendToUser(this.remoteUserId, {
          type: 'call_signal',
          payload: {
            callId: this.callId,
            senderId: this.userId,
            signal: { type: 'end' },
          },
          timestamp: new Date(),
        });
      }

      // Clean up
      this.cleanup();
    } catch (error) {
      console.error('Error ending call:', error);
    }
  }

  /**
   * Start screen sharing
   */
  async startScreenShare(): Promise<MediaStream> {
    try {
      // @ts-ignore - getDisplayMedia is available in browser
      this.screenShareStream = await navigator.mediaDevices.getDisplayMedia({
        video: ({
          cursor: 'always',
        } as any),
        audio: false,
      });

      // Replace video track in peer connection
      const videoTrack = this.screenShareStream.getVideoTracks()[0];
      const sender = this.peerConnection!.getSenders().find(
        (s) => s.track?.kind === 'video'
      );

      if (sender) {
        await sender.replaceTrack(videoTrack);
      }

      // Handle screen share stop
      videoTrack.onended = () => {
        this.stopScreenShare();
      };

      return this.screenShareStream;
    } catch (error) {
      console.error('Error starting screen share:', error);
      throw error;
    }
  }

  /**
   * Stop screen sharing
   */
  async stopScreenShare() {
    try {
      if (!this.screenShareStream) return;

      // Stop screen share tracks
      this.screenShareStream.getTracks().forEach((track) => track.stop());

      // Restore camera video track
      if (this.localStream) {
        const videoTrack = this.localStream.getVideoTracks()[0];
        const sender = this.peerConnection!.getSenders().find(
          (s) => s.track?.kind === 'video'
        );

        if (sender && videoTrack) {
          await sender.replaceTrack(videoTrack);
        }
      }

      this.screenShareStream = null;
    } catch (error) {
      console.error('Error stopping screen share:', error);
    }
  }

  /**
   * Toggle microphone mute
   */
  toggleMicrophone(muted: boolean) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = !muted;
      });
    }
  }

  /**
   * Toggle camera
   */
  toggleCamera(enabled: boolean) {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach((track) => {
        track.enabled = enabled;
      });
    }
  }

  /**
   * Switch between front and back camera
   */
  async switchCamera(): Promise<CameraFacingMode> {
    this.facingMode = this.facingMode === 'user' ? 'environment' : 'user';

    if (!this.localStream) return this.facingMode;

    // Stop existing video tracks
    this.localStream.getVideoTracks().forEach((track) => track.stop());

    try {
      // Get new video stream with the switched facing mode
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
          facingMode: { ideal: this.facingMode },
        },
      });

      const newVideoTrack = newStream.getVideoTracks()[0];

      // Remove old video tracks and add new one to local stream
      this.localStream.getVideoTracks().forEach((track) => {
        this.localStream!.removeTrack(track);
      });
      this.localStream.addTrack(newVideoTrack);

      // Replace the video track in the peer connection
      if (this.peerConnection) {
        const sender = this.peerConnection.getSenders().find(
          (s) => s.track?.kind === 'video'
        );
        if (sender) {
          await sender.replaceTrack(newVideoTrack);
        }
      }
    } catch (error) {
      console.error('Error switching camera:', error);
      // Revert facing mode on failure
      this.facingMode = this.facingMode === 'user' ? 'environment' : 'user';
      throw new Error('Failed to switch camera');
    }

    return this.facingMode;
  }

  /**
   * Get current camera facing mode
   */
  getFacingMode(): CameraFacingMode {
    return this.facingMode;
  }

  /**
   * Get local media stream
   */
  private async initLocalStream(includeVideo: boolean) {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: includeVideo
          ? {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              frameRate: { ideal: 30 },
              facingMode: { ideal: this.facingMode },
            }
          : false,
      });
    } catch (error) {
      console.error('Error getting local stream:', error);
      throw new Error('Failed to access camera/microphone');
    }
  }

  /**
   * Create peer connection
   */
  private createPeerConnection() {
    this.peerConnection = new RTCPeerConnection(ICE_SERVERS);

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.remoteUserId) {
        cqWebSocketServer.sendToUser(this.remoteUserId, {
          type: 'call_ice_candidate',
          payload: {
            callId: this.callId,
            senderId: this.userId,
            candidate: event.candidate.toJSON(),
          },
          timestamp: new Date(),
        });
      }
    };

    // Handle remote stream
    this.peerConnection.ontrack = (event) => {
      if (!this.remoteStream) {
        this.remoteStream = new MediaStream();
      }
      this.remoteStream.addTrack(event.track);
      
      // Emit event for UI to handle
      this.onRemoteStream?.(this.remoteStream);
    };

    // Handle connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      console.log(
        'Connection state:',
        this.peerConnection!.connectionState
      );

      if (
        this.peerConnection!.connectionState === 'disconnected' ||
        this.peerConnection!.connectionState === 'failed'
      ) {
        this.endCall();
      }
    };
  }

  /**
   * Clean up resources
   */
  private cleanup() {
    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;
    this.screenShareStream = null;
    this.callId = null;
    this.remoteUserId = null;
  }

  /**
   * Get local stream (for UI rendering)
   */
  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  /**
   * Get remote stream (for UI rendering)
   */
  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  /**
   * Event handler for remote stream
   */
  onRemoteStream?: (stream: MediaStream) => void;
}

/**
 * Global call manager instance factory
 */
export function createCallManager(userId: string): CQCallManager {
  return new CQCallManager(userId);
}

/**
 * Check if browser supports WebRTC
 */
export function isWebRTCSupported(): boolean {
  return !!(
    navigator.mediaDevices &&
    window.RTCPeerConnection
  );
}

/**
 * Check camera/microphone permissions
 */
export async function checkMediaPermissions(): Promise<{
  audio: boolean;
  video: boolean;
}> {
  const permissions = {
    audio: false,
    video: false,
  };

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });

    permissions.audio = stream.getAudioTracks().length > 0;
    permissions.video = stream.getVideoTracks().length > 0;

    // Stop tracks immediately
    stream.getTracks().forEach((track) => track.stop());
  } catch (error) {
    console.error('Error checking media permissions:', error);
  }

  return permissions;
}

/**
 * Get available media devices
 */
export async function getMediaDevices(): Promise<{
  audioInputs: MediaDeviceInfo[];
  videoInputs: MediaDeviceInfo[];
  audioOutputs: MediaDeviceInfo[];
}> {
  const devices = await navigator.mediaDevices.enumerateDevices();

  return {
    audioInputs: devices.filter((d) => d.kind === 'audioinput'),
    videoInputs: devices.filter((d) => d.kind === 'videoinput'),
    audioOutputs: devices.filter((d) => d.kind === 'audiooutput'),
  };
}
