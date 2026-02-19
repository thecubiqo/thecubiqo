/**
 * React Hook for CQ Number Management
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getActiveCQNumber,
  rotateCQNumber,
  getPrivacySettings,
} from '../supabase-client';
import {
  createCQNumber,
  shouldRotateCQNumber,
  getTimeUntilRotation,
  formatRotationTime,
  generateCQNumberQRData,
  generateCQNumberLink,
} from '../cq-number-generator';
import type { CQNumber, CQPrivacySettings } from '../types';

export function useCQNumber(userId: string) {
  const [cqNumber, setCQNumber] = useState<CQNumber | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeUntilRotation, setTimeUntilRotation] = useState<string>('');
  const [privacySettings, setPrivacySettings] =
    useState<CQPrivacySettings | null>(null);

  // Load CQ number
  useEffect(() => {
    if (!userId) return;

    const loadCQNumber = async () => {
      setLoading(true);
      try {
        const [cqNum, privacy] = await Promise.all([
          getActiveCQNumber(userId),
          getPrivacySettings(userId),
        ]);

        setCQNumber(cqNum);
        setPrivacySettings(privacy);
      } catch (error) {
        
      } finally {
        setLoading(false);
      }
    };

    loadCQNumber();
  }, [userId]);

  // Update time until rotation
  useEffect(() => {
    if (!cqNumber) return;

    const updateTime = () => {
      const ms = getTimeUntilRotation(cqNumber);
      setTimeUntilRotation(formatRotationTime(ms));
    };

    updateTime();
    const interval = setInterval(updateTime, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [cqNumber]);

  // Check if rotation is needed
  useEffect(() => {
    if (!cqNumber || !privacySettings) return;

    if (privacySettings.autoRotateCQ && shouldRotateCQNumber(cqNumber)) {
      handleRotation();
    }
  }, [cqNumber, privacySettings]);

  /**
   * Handle CQ number rotation
   */
  const handleRotation = useCallback(async () => {
    if (!userId || !privacySettings) return;

    try {
      const newCQNumberData = createCQNumber(
        userId,
        privacySettings.rotationIntervalDays
      );

      await rotateCQNumber(
        userId,
        newCQNumberData.cqNumber,
        newCQNumberData.expiresAt,
        newCQNumberData.rotationInterval
      );

      // Reload CQ number
      const updatedCQNumber = await getActiveCQNumber(userId);
      setCQNumber(updatedCQNumber);
    } catch (error) {
      
      throw error;
    }
  }, [userId, privacySettings]);

  /**
   * Manually rotate CQ number
   */
  const rotateCQNumberManually = useCallback(async () => {
    await handleRotation();
  }, [handleRotation]);

  /**
   * Get QR code data for sharing
   */
  const getQRCodeData = useCallback(
    (displayName?: string) => {
      if (!cqNumber) return null;
      return generateCQNumberQRData(cqNumber.cqNumber, displayName);
    },
    [cqNumber]
  );

  /**
   * Get shareable link
   */
  const getShareableLink = useCallback(() => {
    if (!cqNumber) return null;
    return generateCQNumberLink(cqNumber.cqNumber);
  }, [cqNumber]);

  /**
   * Copy CQ number to clipboard
   */
  const copyCQNumber = useCallback(async () => {
    if (!cqNumber) return false;

    try {
      await navigator.clipboard.writeText(cqNumber.cqNumber);
      return true;
    } catch (error) {
      
      return false;
    }
  }, [cqNumber]);

  return {
    cqNumber,
    loading,
    timeUntilRotation,
    privacySettings,
    rotateCQNumber: rotateCQNumberManually,
    getQRCodeData,
    getShareableLink,
    copyCQNumber,
  };
}
