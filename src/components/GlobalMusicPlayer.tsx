"use client";

import { useMusic } from "@/contexts/MusicContext";
import MusicPlayer from "./MusicPlayer";

export default function GlobalMusicPlayer() {
  const { currentTrack, isPlaying, volume, play, pause, stop, setVolume } = useMusic();

  if (!currentTrack) {
    return null;
  }

  return (
    <MusicPlayer
      isPlaying={isPlaying}
      onPlay={play}
      onPause={pause}
      onStop={stop}
      onVolumeChange={setVolume}
      volume={volume}
      trackTitle={currentTrack.title}
      audioSrc={currentTrack.audioUrl}
    />
  );
} 