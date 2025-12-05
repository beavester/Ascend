# Rave Mode Audio Assets

Place your rave celebration audio file here:

## Required File
- `extratonecelebration.mp3` - 5-second celebration audio

## Requirements
- Duration: ~5 seconds (matches visual effects duration)
- Format: MP3 (compatible with expo-av)
- Recommended: Upbeat, energetic rave/EDM sound

## Installation
1. Add your MP3 file to this folder named `extratonecelebration.mp3`
2. Install expo-av: `npx expo install expo-av`
3. Restart the Expo bundler

## Notes
- The app will work without the audio file (visual effects only)
- Audio respects device silent mode (won't play if phone is on silent)
- Audio is preloaded on app init for zero-latency playback
