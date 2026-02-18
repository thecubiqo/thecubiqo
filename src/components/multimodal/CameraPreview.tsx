/**
 * Camera Preview Component
 * Shows live camera feed with detection overlays
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { CameraService } from '@/lib/multimodal/camera';

interface CameraPreviewProps {
  cameraType?: 'front' | 'back';
  onStreamReady?: (stream: MediaStream) => void;
  showOverlay?: boolean;
}

export function CameraPreview({ 
  cameraType = 'front',
  onStreamReady,
  showOverlay = true 
}: CameraPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [service] = useState(() => new CameraService());
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initCamera = async () => {
      try {
        const success = await service.initialize(cameraType);
        
        if (success && videoRef.current) {
          service.attachToVideo(videoRef.current);
          const stream = service.getStream();
          if (stream) {
            onStreamReady?.(stream);
          }
          setIsActive(true);
          setError(null);
        } else {
          setError('Failed to initialize camera');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Camera error');
      }
    };

    initCamera();

    return () => {
      service.stop();
    };
  }, [cameraType, service, onStreamReady]);

  return (
    <div className="relative rounded-lg overflow-hidden bg-gray-900">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />

      {/* Status Overlay */}
      {showOverlay && (
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
          <div className="flex items-center space-x-2 bg-black/50 backdrop-blur-sm rounded-full px-3 py-2">
            {isActive ? (
              <>
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-white text-sm font-medium">Live</span>
              </>
            ) : (
              <span className="text-white text-sm">Initializing...</span>
            )}
          </div>

          <div className="bg-black/50 backdrop-blur-sm rounded-full px-3 py-2">
            <span className="text-white text-sm">
              {cameraType === 'front' ? '🤳 Front' : '📷 Back'}
            </span>
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="text-center p-6">
            <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-white text-sm">{error}</p>
            <p className="text-gray-400 text-xs mt-2">
              Please check camera permissions
            </p>
          </div>
        </div>
      )}

      {/* Detection Overlay Placeholder */}
      {showOverlay && isActive && (
        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-black/50 backdrop-blur-sm rounded-lg p-3">
            <p className="text-white text-xs">
              👁️ Vision active - Ready to detect objects and faces
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
