import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, LinearGradient as SvgGradient, Stop, Polygon, Path, Circle, G } from 'react-native-svg';

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
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete?.();
    }, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <LinearGradient
      colors={['#3b82f6', '#8b5cf6']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.iconContainer}>
        <AscentLogo size={50} />
      </View>
      <Text style={styles.title}>Ascent</Text>
      <Text style={styles.subtitle}>Structure your goals</Text>
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
  },
});

export { AscentLogo };
