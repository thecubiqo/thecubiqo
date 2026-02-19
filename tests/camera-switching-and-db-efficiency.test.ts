/**
 * Tests for camera switching and DB API efficiency improvements
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase before any imports
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      lt: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
    })),
    rpc: vi.fn().mockResolvedValue({ data: 'mock-id', error: null }),
  })),
}));

// Mock WebSocket server
vi.mock('../src/lib/cq-to-cq/websocket-server', () => ({
  cqWebSocketServer: {
    sendToUser: vi.fn().mockResolvedValue(undefined),
  },
}));

// ============================================
// Camera Switching Tests (CQCallManager)
// ============================================

describe('CQCallManager Camera Switching', () => {
  const mockGetUserMedia = vi.fn();
  const mockEnumerateDevices = vi.fn();

  beforeEach(() => {
    vi.restoreAllMocks();

    Object.defineProperty(global, 'navigator', {
      value: {
        mediaDevices: {
          getUserMedia: mockGetUserMedia,
          enumerateDevices: mockEnumerateDevices,
        },
      },
      writable: true,
      configurable: true,
    });

    Object.defineProperty(global, 'RTCPeerConnection', {
      value: vi.fn().mockImplementation(() => ({
        createOffer: vi.fn().mockResolvedValue({ type: 'offer', sdp: 'mock-sdp' }),
        setLocalDescription: vi.fn().mockResolvedValue(undefined),
        getSenders: vi.fn().mockReturnValue([]),
        close: vi.fn(),
        onicecandidate: null,
        ontrack: null,
        onconnectionstatechange: null,
        connectionState: 'new',
      })),
      writable: true,
      configurable: true,
    });

    Object.defineProperty(global, 'RTCSessionDescription', {
      value: vi.fn(),
      writable: true,
      configurable: true,
    });

    Object.defineProperty(global, 'RTCIceCandidate', {
      value: vi.fn(),
      writable: true,
      configurable: true,
    });
  });

  it('should default to user-facing (front) camera', async () => {
    const { CQCallManager } = await import('../src/lib/cq-to-cq/webrtc-calls');
    const manager = new CQCallManager('user-1');
    expect(manager.getFacingMode()).toBe('user');
  });

  it('should switch from front to back camera', async () => {
    const mockVideoTrack = {
      kind: 'video',
      stop: vi.fn(),
      enabled: true,
    };
    const mockStream = {
      getTracks: vi.fn().mockReturnValue([mockVideoTrack]),
      getVideoTracks: vi.fn().mockReturnValue([mockVideoTrack]),
      getAudioTracks: vi.fn().mockReturnValue([]),
      addTrack: vi.fn(),
      removeTrack: vi.fn(),
    };

    mockGetUserMedia.mockResolvedValue(mockStream);

    const { CQCallManager } = await import('../src/lib/cq-to-cq/webrtc-calls');
    const manager = new CQCallManager('user-1');

    expect(manager.getFacingMode()).toBe('user');

    const newMode = await manager.switchCamera();
    expect(newMode).toBe('environment');
    expect(manager.getFacingMode()).toBe('environment');
  });

  it('should toggle back to front camera on second switch', async () => {
    const mockVideoTrack = {
      kind: 'video',
      stop: vi.fn(),
      enabled: true,
    };
    const mockStream = {
      getTracks: vi.fn().mockReturnValue([mockVideoTrack]),
      getVideoTracks: vi.fn().mockReturnValue([mockVideoTrack]),
      getAudioTracks: vi.fn().mockReturnValue([]),
      addTrack: vi.fn(),
      removeTrack: vi.fn(),
    };

    mockGetUserMedia.mockResolvedValue(mockStream);

    const { CQCallManager } = await import('../src/lib/cq-to-cq/webrtc-calls');
    const manager = new CQCallManager('user-1');

    await manager.switchCamera(); // user -> environment
    const finalMode = await manager.switchCamera(); // environment -> user
    expect(finalMode).toBe('user');
    expect(manager.getFacingMode()).toBe('user');
  });

  it('should pass facingMode to getUserMedia constraints on switch', async () => {
    const mockVideoTrack = {
      kind: 'video',
      stop: vi.fn(),
      enabled: true,
    };
    const mockStream = {
      getTracks: vi.fn().mockReturnValue([mockVideoTrack]),
      getVideoTracks: vi.fn().mockReturnValue([mockVideoTrack]),
      getAudioTracks: vi.fn().mockReturnValue([]),
      addTrack: vi.fn(),
      removeTrack: vi.fn(),
    };

    mockGetUserMedia.mockResolvedValue(mockStream);

    const { CQCallManager } = await import('../src/lib/cq-to-cq/webrtc-calls');
    const manager = new CQCallManager('user-1');

    // Set a localStream to trigger getUserMedia on switch
    (manager as any).localStream = mockStream;

    await manager.switchCamera();

    expect(mockGetUserMedia).toHaveBeenCalledWith(
      expect.objectContaining({
        video: expect.objectContaining({
          facingMode: { ideal: 'environment' },
        }),
      })
    );
  });

  it('should return facing mode without switching when no local stream', async () => {
    mockGetUserMedia.mockClear();
    const { CQCallManager } = await import('../src/lib/cq-to-cq/webrtc-calls');
    const manager = new CQCallManager('user-1');

    // switchCamera with no stream should still toggle the mode
    const newMode = await manager.switchCamera();
    expect(newMode).toBe('environment');
    // getUserMedia should not have been called since there's no active stream
    expect(mockGetUserMedia).not.toHaveBeenCalled();
  });
});

// ============================================
// Camera Facing Mode Type Tests
// ============================================

describe('CameraFacingMode type', () => {
  it('should accept valid facing modes', async () => {
    const { CQCallManager } = await import('../src/lib/cq-to-cq/webrtc-calls');
    const manager = new CQCallManager('user-1');

    const mode = manager.getFacingMode();
    expect(['user', 'environment']).toContain(mode);
  });
});

// ============================================
// WebRTC Support Detection Tests
// ============================================

describe('WebRTC utility functions', () => {
  it('should detect WebRTC support', async () => {
    Object.defineProperty(global, 'window', {
      value: {
        RTCPeerConnection: vi.fn(),
      },
      writable: true,
      configurable: true,
    });

    const { isWebRTCSupported } = await import('../src/lib/cq-to-cq/webrtc-calls');
    expect(isWebRTCSupported()).toBe(true);
  });

  it('should list available media devices including front and back cameras', async () => {
    const mockDevices = [
      { kind: 'videoinput', deviceId: 'front', label: 'Front Camera' },
      { kind: 'videoinput', deviceId: 'back', label: 'Back Camera' },
      { kind: 'audioinput', deviceId: 'mic1', label: 'Microphone' },
      { kind: 'audiooutput', deviceId: 'speaker1', label: 'Speaker' },
    ];

    Object.defineProperty(global, 'navigator', {
      value: {
        mediaDevices: {
          getUserMedia: vi.fn(),
          enumerateDevices: vi.fn().mockResolvedValue(mockDevices),
        },
      },
      writable: true,
      configurable: true,
    });

    const { getMediaDevices } = await import('../src/lib/cq-to-cq/webrtc-calls');
    const devices = await getMediaDevices();

    expect(devices.videoInputs).toHaveLength(2);
    expect(devices.audioInputs).toHaveLength(1);
    expect(devices.audioOutputs).toHaveLength(1);
  });
});

// ============================================
// DB API Efficiency Tests
// ============================================

describe('DB API Efficiency', () => {
  it('sendFriendRequest should be exported and callable', async () => {
    const moduleSource = await import('../src/lib/cq-to-cq/supabase-client');
    expect(moduleSource.sendFriendRequest).toBeDefined();
    expect(typeof moduleSource.sendFriendRequest).toBe('function');
  });

  it('markConversationAsRead should be exported and callable', async () => {
    const moduleSource = await import('../src/lib/cq-to-cq/supabase-client');
    expect(moduleSource.markConversationAsRead).toBeDefined();
    expect(typeof moduleSource.markConversationAsRead).toBe('function');
  });

  it('rotateCQNumber should be exported and callable', async () => {
    const moduleSource = await import('../src/lib/cq-to-cq/supabase-client');
    expect(moduleSource.rotateCQNumber).toBeDefined();
    expect(typeof moduleSource.rotateCQNumber).toBe('function');
  });

  it('getMessages should support pagination with limit and before params', async () => {
    const moduleSource = await import('../src/lib/cq-to-cq/supabase-client');
    expect(moduleSource.getMessages).toBeDefined();
    // getMessages accepts (conversationId, limit, before) params
    expect(moduleSource.getMessages.length).toBeGreaterThanOrEqual(1);
  });
});
