"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface MusicTrack {
  id: string;
  title: string;
  audioUrl: string;
}

interface MusicContextType {
  currentTrack: MusicTrack | null;
  isPlaying: boolean;
  volume: number;
  setCurrentTrack: (track: MusicTrack | null) => void;
  play: () => void;
  pause: () => void;
  setVolume: (volume: number) => void;
  stop: () => void;
  forceStop: () => void;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export function MusicProvider({ children }: { children: ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<MusicTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);

  // Load volume from localStorage on mount
  useEffect(() => {
    const savedVolume = localStorage.getItem('music-volume');
    if (savedVolume) {
      setVolume(parseFloat(savedVolume));
    }
  }, []);

  // Save volume to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('music-volume', volume.toString());
  }, [volume]);

  const play = useCallback(() => {
    // Add a small delay to ensure audio is ready
    setTimeout(() => {
      setIsPlaying(true);
    }, 50);
  }, []);

  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const stop = useCallback(() => {
    setIsPlaying(false);
    setCurrentTrack(null);
  }, []);

  // Force stop music - used when navigating away
  const forceStop = useCallback(() => {
    setIsPlaying(false);
    setCurrentTrack(null);
  }, []);

  const handleSetCurrentTrack = useCallback((track: MusicTrack | null) => {
    // If we're setting a new track, stop the current one first
    if (currentTrack && track && currentTrack.id !== track.id) {
      setIsPlaying(false);
    }
    setCurrentTrack(track);
  }, [currentTrack]);

  const value: MusicContextType = {
    currentTrack,
    isPlaying,
    volume,
    setCurrentTrack: handleSetCurrentTrack,
    play,
    pause,
    setVolume,
    stop,
    forceStop,
  };

  return (
    <MusicContext.Provider value={value}>
      {children}
    </MusicContext.Provider>
  );
}

export function useMusic() {
  const context = useContext(MusicContext);
  if (context === undefined) {
    throw new Error('useMusic must be used within a MusicProvider');
  }
  return context;
} 