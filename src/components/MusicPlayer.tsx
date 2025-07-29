"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface MusicPlayerProps {
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onVolumeChange: (volume: number) => void;
  volume: number;
  trackTitle?: string;
  audioSrc?: string;
  onEnded?: () => void;
}

export default function MusicPlayer({
  isPlaying,
  onPlay,
  onPause,
  onStop,
  onVolumeChange,
  volume,
  trackTitle,
  audioSrc,
  onEnded
}: MusicPlayerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        // Wait for audio to be ready before playing
        const playAudio = async () => {
          try {
            await audioRef.current!.play();
          } catch (error) {
            console.error('Audio play error:', error);
          }
        };
        playAudio();
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  // Handle audio source changes
  useEffect(() => {
    if (audioRef.current && audioSrc) {
      // Reset audio when source changes
      audioRef.current.load();
      
      // If we should be playing, wait for load and then play
      if (isPlaying) {
        const handleCanPlay = () => {
          audioRef.current?.play().catch(console.error);
          audioRef.current?.removeEventListener('canplay', handleCanPlay);
        };
        
        audioRef.current.addEventListener('canplay', handleCanPlay);
        
        return () => {
          audioRef.current?.removeEventListener('canplay', handleCanPlay);
        };
      }
    }
  }, [audioSrc, isPlaying]);

  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      onPause();
    } else {
      onPlay();
    }
  }, [isPlaying, onPlay, onPause]);

  const handleStop = useCallback(() => {
    onStop();
  }, [onStop]);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    onVolumeChange(newVolume);
  }, [onVolumeChange]);

  if (!audioSrc || !trackTitle) {
    return null;
  }

  return (
    <>
      <audio
        ref={audioRef}
        src={audioSrc}
        onEnded={onEnded}
        preload="metadata"
      />
      
      <motion.div
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 100, opacity: 0 }}
        className="fixed bottom-4 right-4 z-50"
      >
        <div className="bg-[#23232a]/95 backdrop-blur-sm border border-gray-800 rounded-2xl shadow-2xl">
          {/* Mobile Collapsed View */}
          {isMobile && !isExpanded && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsExpanded(true)}
              className="p-3 text-white hover:text-[var(--accent)] transition-colors"
            >
              <div className="w-8 h-8 bg-[var(--accent)] rounded-full flex items-center justify-center">
                {isPlaying ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </motion.button>
          )}

          {/* Expanded View */}
          {(isMobile ? isExpanded : true) && (
            <motion.div
              initial={isMobile ? { scale: 0.9, opacity: 0 } : false}
              animate={{ scale: 1, opacity: 1 }}
              className="p-4 min-w-[280px]"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-[var(--accent)] rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-[var(--foreground)]" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.369 4.369 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Now Playing</div>
                    <div className="text-sm font-medium text-white truncate max-w-[180px]">
                      {trackTitle}
                    </div>
                  </div>
                </div>
                {isMobile && (
                  <button
                    onClick={() => setIsExpanded(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Controls */}
              <div className="flex items-center gap-3 mb-3">
                <button
                  onClick={handlePlayPause}
                  className="w-10 h-10 bg-[var(--accent)] rounded-full flex items-center justify-center hover:opacity-90 transition-opacity"
                >
                  {isPlaying ? (
                    <svg className="w-5 h-5 text-[var(--foreground)]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-[var(--foreground)]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>

                {/* Stop Button */}
                <button
                  onClick={handleStop}
                  className="w-10 h-10 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center transition-colors"
                  title="Müziği Durdur"
                >
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                  </svg>
                </button>

                {/* Volume Control */}
                <div className="flex items-center gap-2 flex-1">
                  <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L4.5 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.5l3.883-3.793a1 1 0 011.414-.124zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="flex-1 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, var(--accent) 0%, var(--accent) ${volume * 100}%, #374151 ${volume * 100}%, #374151 100%)`
                    }}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </>
  );
} 