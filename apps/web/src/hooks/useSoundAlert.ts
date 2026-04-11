"use client";

import { useEffect, useState, useCallback, useRef } from 'react';

const SOUND_PREFERENCE_KEY = 'admin-sound-alert-enabled';

/**
 * Hook for managing notification sound alerts
 * 
 * Features:
 * - Play notification sound
 * - Toggle sound on/off
 * - Store preference in localStorage
 * - Respect browser autoplay policies
 * - Handle playback errors gracefully
 * 
 * @example
 * ```tsx
 * const { isEnabled, setEnabled, playSound } = useSoundAlert();
 * 
 * if (isEnabled) {
 *   playSound();
 * }
 * ```
 */
export function useSoundAlert() {
  const [isEnabled, setIsEnabled] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  /**
   * Initialize audio element
   */
  useEffect(() => {
    // Load preference from localStorage
    const stored = localStorage.getItem(SOUND_PREFERENCE_KEY);
    if (stored !== null) {
      setIsEnabled(stored === 'true');
    }
    
    // Create audio element
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio('/sounds/notification.mp3');
      audioRef.current.volume = 0.5;
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);
  
  /**
   * Play notification sound
   */
  const playSound = useCallback(async () => {
    if (!isEnabled || !audioRef.current || document.hidden) {
      return;
    }
    
    try {
      // Reset audio to start
      audioRef.current.currentTime = 0;
      await audioRef.current.play();
    } catch (error) {
      // Silently handle autoplay errors
      console.warn('Failed to play notification sound:', error);
    }
  }, [isEnabled]);
  
  /**
   * Toggle sound on/off and persist preference
   */
  const setEnabled = useCallback((enabled: boolean) => {
    setIsEnabled(enabled);
    localStorage.setItem(SOUND_PREFERENCE_KEY, String(enabled));
  }, []);
  
  return {
    isEnabled,
    setEnabled,
    playSound
  };
}
