// Rave Audio Service
// Handles preloading and playing of rave celebration audio
// Uses expo-av for audio playback

// Audio configuration
const AUDIO_CONFIG = {
  allowsRecordingIOS: false,
  playsInSilentModeIOS: false, // Respect device silent mode
  staysActiveInBackground: false,
  shouldDuckAndroid: true,
};

// Try to import the audio file, fallback to null if not found
let RAVE_AUDIO_SOURCE = null;
try {
  // Place your 5-second mp3 file at: assets/audio/extratonecelebration.mp3
  RAVE_AUDIO_SOURCE = require('../../assets/audio/extratonecelebration.mp3');
} catch (e) {
  console.log('Rave audio file not found - visual effects will work without audio');
}

class RaveAudioService {
  constructor() {
    this.sound = null;
    this.isLoaded = false;
    this.isLoading = false;
    this.Audio = null;
  }

  // Lazy load expo-av to avoid crashes if not installed
  async getAudioModule() {
    if (this.Audio) return this.Audio;
    try {
      const expoAv = await import('expo-av');
      this.Audio = expoAv.Audio;
      return this.Audio;
    } catch (error) {
      console.warn('expo-av not installed. Run: npx expo install expo-av');
      return null;
    }
  }

  // Preload the rave audio for zero-latency playback
  async preload() {
    if (this.isLoaded || this.isLoading || !RAVE_AUDIO_SOURCE) return;

    this.isLoading = true;

    try {
      const Audio = await this.getAudioModule();
      if (!Audio) {
        this.isLoading = false;
        return;
      }

      // Set audio mode
      await Audio.setAudioModeAsync(AUDIO_CONFIG);

      // Load the sound file
      const { sound } = await Audio.Sound.createAsync(
        RAVE_AUDIO_SOURCE,
        {
          shouldPlay: false,
          volume: 1.0,
          isLooping: false,
        }
      );

      this.sound = sound;
      this.isLoaded = true;
      console.log('Rave audio preloaded successfully');
    } catch (error) {
      console.warn('Failed to preload rave audio:', error);
      // Graceful fallback - rave will work without audio
    } finally {
      this.isLoading = false;
    }
  }

  // Play the rave audio
  async play() {
    if (!this.sound || !this.isLoaded) {
      console.warn('Rave audio not loaded, skipping playback');
      return;
    }

    try {
      // Reset to beginning and play
      await this.sound.setPositionAsync(0);
      await this.sound.playAsync();
    } catch (error) {
      console.warn('Failed to play rave audio:', error);
    }
  }

  // Stop the audio
  async stop() {
    if (!this.sound || !this.isLoaded) return;

    try {
      await this.sound.stopAsync();
    } catch (error) {
      console.warn('Failed to stop rave audio:', error);
    }
  }

  // Get the sound object reference (for RaveOverlay)
  getSoundRef() {
    return this.sound;
  }

  // Cleanup on app unmount
  async unload() {
    if (this.sound) {
      try {
        await this.sound.unloadAsync();
      } catch (error) {
        console.warn('Failed to unload rave audio:', error);
      }
      this.sound = null;
      this.isLoaded = false;
    }
  }
}

// Singleton instance
export const raveAudio = new RaveAudioService();

// React hook for using rave audio
import { useEffect, useRef, useCallback } from 'react';

export function useRaveAudio() {
  const soundRef = useRef(null);

  useEffect(() => {
    // Preload on mount
    const init = async () => {
      await raveAudio.preload();
      soundRef.current = raveAudio.getSoundRef();
    };
    init();

    // Cleanup on unmount
    return () => {
      raveAudio.stop();
    };
  }, []);

  const play = useCallback(async () => {
    await raveAudio.play();
  }, []);

  const stop = useCallback(async () => {
    await raveAudio.stop();
  }, []);

  return {
    soundRef,
    play,
    stop,
    isLoaded: raveAudio.isLoaded,
  };
}

export default raveAudio;
