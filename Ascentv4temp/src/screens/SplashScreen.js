import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, LinearGradient as SvgGradient, Stop, Polygon, Path, Circle, G } from 'react-native-svg';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const AscentLogo = ({ size = 80 }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Defs>
      <SvgGradient id="splashMt1" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#1e3a5f" />
        <Stop offset="100%" stopColor="#0f172a" />
      </SvgGradient>
      <SvgGradient id="splashBoulder" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#f5f5dc" />
        <Stop offset="50%" stopColor="#e8e4c9" />
        <Stop offset="100%" stopColor="#d4c89a" />
      </SvgGradient>
    </Defs>
    {/* Single dark mountain */}
    <Polygon fill="url(#splashMt1)" points="10,95 50,12 90,95" />
    <Path d="M50,12 L10,95" stroke="#3d5a80" strokeWidth="1" fill="none" opacity="0.5" />
    {/* Large boulder */}
    <Circle cx="22" cy="42" r="12" fill="url(#splashBoulder)" stroke="#c9b896" strokeWidth="1" />
    <Path d="M18,40 Q22,38 24,42 Q22,46 19,44" stroke="#b8a676" strokeWidth="0.8" fill="none" opacity="0.6" />
    {/* Small Sisyphus silhouette */}
    <G fill="#1a1a2e">
      <Circle cx="14" cy="54" r="2.5" />
      <Path d="M14,56 L16,62 L13,63 L12,57 Z" />
      <Path d="M15,57 Q18,52 20,50" stroke="#1a1a2e" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <Path d="M13,58 Q16,54 18,52" stroke="#1a1a2e" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <Path d="M14,62 L18,68" stroke="#1a1a2e" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <Path d="M13,63 L10,70" stroke="#1a1a2e" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </G>
  </Svg>
);

export default function SplashScreen({ onComplete }) {
  // Animations for seamless splash-to-content transition
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Haptic on splash appear
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Staggered entrance animation - value delivered in <1 second
    Animated.sequence([
      // Logo appears immediately
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 8,
          tension: 100,
          useNativeDriver: true,
        }),
      ]),
      // Title fades in
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      // Tagline appears
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    // Progress bar animation (gives sense of loading without spinner)
    Animated.timing(progressWidth, {
      toValue: SCREEN_WIDTH * 0.5,
      duration: 1200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    // Quick transition - users see value fast
    const timer = setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onComplete?.();
    }, 1500); // Reduced from 2000ms

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <LinearGradient
      colors={['#3b82f6', '#8b5cf6']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <Animated.View
        style={[
          styles.iconContainer,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          },
        ]}
      >
        <AscentLogo size={50} />
      </Animated.View>

      <Animated.Text style={[styles.title, { opacity: textOpacity }]}>
        Ascent
      </Animated.Text>

      <Animated.Text style={[styles.subtitle, { opacity: taglineOpacity }]}>
        Build who you want to be
      </Animated.Text>

      {/* Progress indicator instead of spinner */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressFill,
              { width: progressWidth },
            ]}
          />
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    marginTop: 4,
  },
  progressContainer: {
    position: 'absolute',
    bottom: 80,
    alignItems: 'center',
  },
  progressTrack: {
    width: SCREEN_WIDTH * 0.5,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 2,
  },
});

export { AscentLogo };
