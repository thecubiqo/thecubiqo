'use client';

import { useState, useEffect } from 'react';

export default function StatusBar() {
  const [isConnected, setIsConnected] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [buildStatus, setBuildStatus] = useState<'idle' | 'building' | 'success' | 'error'>('idle');

  // Simulate connection status
  useEffect(() => {
    const interval = setInterval(() => {
      // In production, check actual WebSocket connection
      setIsConnected(Math.random() > 0.1); // 90% connected
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const getConnectionStatus = () => {
    if (isConnected) {
      return (
        <div className="flex items-center gap-2 text-green-400">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-xs">Connected</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2 text-red-400">
        <div className="w-2 h-2 bg-red-400 rounded-full"></div>
        <span className="text-xs">Disconnected</span>
      </div>
    );
  };

  const getSaveStatus = () => {
    if (isSaving) {
      return (
        <div className="flex items-center gap-2 text-blue-400">
          <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs">Saving...</span>
        </div>
      );
    }
    if (lastSaved) {
      return (
        <div className="text-xs text-gray-400">
          Saved {lastSaved.toLocaleTimeString()}
        </div>
      );
    }
    return null;
  };

  const getBuildStatus = () => {
    switch (buildStatus) {
      case 'building':
        return (
          <div className="flex items-center gap-2 text-yellow-400">
            <div className="w-3 h-3 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs">Building...</span>
          </div>
        );
      case 'success':
        return (
          <div className="flex items-center gap-2 text-green-400">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-xs">Build successful</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-2 text-red-400">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-xs">Build failed</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-800 border-t border-gray-700 px-4 py-2 flex items-center justify-between text-xs">
      <div className="flex items-center gap-6">
        {getConnectionStatus()}
        {getBuildStatus()}
      </div>
      
      <div className="flex items-center gap-6">
        {getSaveStatus()}
        <div className="text-gray-400">
          Ln 1, Col 1
        </div>
        <div className="text-gray-400">
          UTF-8
        </div>
        <div className="text-gray-400">
          TypeScript React
        </div>
      </div>
    </div>
  );
}
