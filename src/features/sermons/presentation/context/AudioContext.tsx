import { useRef, useEffect, createContext, useContext, ReactNode } from 'react';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { useSermonStore } from '@/store/useSermonStore';
import { useAuthStore } from '@/store/useAuthStore';

interface AudioContextType {
  sound: Audio.Sound | null;
  playAudio: (audioUrl: string, sermonId: string) => Promise<void>;
  pauseAudio: () => Promise<void>;
  resumeAudio: () => Promise<void>;
  stopAudio: () => Promise<void>;
  seekAudio: (position: number) => Promise<void>;
  setRate: (rate: number) => Promise<void>;
}

const AudioContext = createContext<AudioContextType | null>(null);

export function AudioProvider({ children }: { children: ReactNode }) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  
  const { setCurrentPosition, setIsPlaying, saveProgress } = useSermonStore();
  const currentUser = useAuthStore((state) => state.currentUser);

  useEffect(() => {
    // Configure audio session
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
    });

    return () => {
      // Cleanup
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, []);

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      return;
    }

    setIsPlaying(status.isPlaying);
    const currentPos = Math.floor((status.positionMillis || 0) / 1000);
    setCurrentPosition(currentPos);
  };

  const playAudio = async (audioUrl: string, sermonId: string) => {
    try {
      // If there's already a sound playing, stop it
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true },
        onPlaybackStatusUpdate
      );

      soundRef.current = sound;
      setIsPlaying(true);

      // Start progress saving
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }

      progressInterval.current = setInterval(async () => {
        if (currentUser && soundRef.current) {
          const status = await soundRef.current.getStatusAsync();
          if (status.isLoaded && status.isPlaying) {
            const currentPos = Math.floor((status.positionMillis || 0) / 1000);
            saveProgress(currentUser.uid, sermonId, currentPos);
          }
        }
      }, 5000);

    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  const pauseAudio = async () => {
    if (soundRef.current) {
      await soundRef.current.pauseAsync();
      setIsPlaying(false);
    }
  };

  const resumeAudio = async () => {
    if (soundRef.current) {
      await soundRef.current.playAsync();
      setIsPlaying(true);
    }
  };

  const stopAudio = async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
      soundRef.current = null;
      setIsPlaying(false);
      setCurrentPosition(0);
      
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
        progressInterval.current = null;
      }
    }
  };

  const seekAudio = async (position: number) => {
    if (soundRef.current) {
      await soundRef.current.setPositionAsync(position);
    }
  };

  const setRate = async (rate: number) => {
    if (soundRef.current) {
      await soundRef.current.setRateAsync(rate, true);
    }
  };

  const value: AudioContextType = {
    sound: soundRef.current,
    playAudio,
    pauseAudio,
    resumeAudio,
    stopAudio,
    seekAudio,
    setRate,
  };

  return (
    <AudioContext.Provider value={value}>
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within AudioProvider');
  }
  return context;
}
