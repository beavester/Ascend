// Organic Pool Vessel Component
// "Bioluminescent Depth" aesthetic - the hero element of the app
// A curved, asymmetric container that feels alive with floating particles

import React, { useEffect, useRef, useMemo, useState } from 'react';
import { View, StyleSheet, Animated, Easing, Dimensions, Platform } from 'react-native';
import Svg, { Path, Defs, LinearGradient, RadialGradient, Stop, ClipPath, G, Ellipse, Rect, Circle } from 'react-native-svg';
import { useTheme } from '../../hooks/useTheme';
import { getPoolColor, getPoolGlowColor, getPoolGlowIntensity, animation } from '../../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const VESSEL_WIDTH = Math.min(SCREEN_WIDTH * 0.55, 200);
const VESSEL_HEIGHT = VESSEL_WIDTH * 1.5;

// Particle configuration for bioluminescent effect
const PARTICLE_COUNT = 8;

// ═══════════════════════════════════════════════════════════════
// ANIMATED SVG COMPONENTS
// ═══════════════════════════════════════════════════════════════
// Note: We use Animated.View wrapper instead of animated SVG components
// for better performance and compatibility

// ═══════════════════════════════════════════════════════════════
// ORGANIC VESSEL SHAPE
// Inspired by bioluminescent jellyfish / alchemist flask
// ═══════════════════════════════════════════════════════════════
const getVesselPath = (width, height) => {
  const w = width;
  const h = height;

  // Organic, asymmetric flask shape
  // Narrow neck, wide body, subtle asymmetry
  return `
    M ${w * 0.35} 0
    C ${w * 0.25} ${h * 0.02}, ${w * 0.2} ${h * 0.05}, ${w * 0.18} ${h * 0.12}
    C ${w * 0.08} ${h * 0.22}, ${w * 0.02} ${h * 0.35}, ${w * 0.05} ${h * 0.5}
    C ${w * 0.03} ${h * 0.65}, ${w * 0.1} ${h * 0.78}, ${w * 0.2} ${h * 0.88}
    C ${w * 0.3} ${h * 0.95}, ${w * 0.45} ${h}, ${w * 0.5} ${h}
    C ${w * 0.55} ${h}, ${w * 0.7} ${h * 0.95}, ${w * 0.8} ${h * 0.88}
    C ${w * 0.9} ${h * 0.78}, ${w * 0.97} ${h * 0.65}, ${w * 0.95} ${h * 0.5}
    C ${w * 0.98} ${h * 0.35}, ${w * 0.92} ${h * 0.22}, ${w * 0.82} ${h * 0.12}
    C ${w * 0.8} ${h * 0.05}, ${w * 0.75} ${h * 0.02}, ${w * 0.65} 0
    Z
  `;
};

// Liquid surface wave path - creates an organic, undulating surface
const getLiquidSurfacePath = (width, height, fillY, waveOffset) => {
  const waveHeight = height * 0.015; // Subtle wave amplitude
  const waveCount = 3;

  // Start from left edge at fill level
  let path = `M 0 ${fillY}`;

  // Create wavy top surface
  const segments = 20;
  for (let i = 0; i <= segments; i++) {
    const x = (i / segments) * width;
    const waveY = fillY + Math.sin((i / segments) * Math.PI * waveCount + waveOffset) * waveHeight;
    path += ` L ${x} ${waveY}`;
  }

  // Complete the rectangle
  path += ` L ${width} ${height} L 0 ${height} Z`;

  return path;
};

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export const OrganicPoolVessel = ({
  level = 65,
  size = 'large',
  showLabel = true,
  animated = true,
  onPress,
}) => {
  const { colors, isDark } = useTheme();

  // Animation values
  const glowAnim = useRef(new Animated.Value(1)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;
  const breatheAnim = useRef(new Animated.Value(1)).current;

  // State for animated level (SVG doesn't support Animated.Value directly)
  const [animatedLevel, setAnimatedLevel] = useState(level);
  const [waveOffset, setWaveOffset] = useState(0);
  const [particles, setParticles] = useState([]);

  // Calculate dimensions based on size
  const dimensions = useMemo(() => {
    switch (size) {
      case 'small': return { width: VESSEL_WIDTH * 0.5, height: VESSEL_HEIGHT * 0.5 };
      case 'medium': return { width: VESSEL_WIDTH * 0.75, height: VESSEL_HEIGHT * 0.75 };
      case 'large':
      default: return { width: VESSEL_WIDTH, height: VESSEL_HEIGHT };
    }
  }, [size]);

  // Derived values
  const poolColor = getPoolColor(level, isDark);
  const glowColor = getPoolGlowColor(level, isDark);
  const glowIntensity = getPoolGlowIntensity(level);

  // Generate initial particles
  useEffect(() => {
    const initialParticles = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      id: i,
      x: 0.2 + Math.random() * 0.6,
      y: Math.random(),
      size: 1.5 + Math.random() * 2.5,
      speed: 0.3 + Math.random() * 0.5,
      opacity: 0.3 + Math.random() * 0.5,
      phase: Math.random() * Math.PI * 2,
    }));
    setParticles(initialParticles);
  }, []);

  // ═══════════════════════════════════════════════════════════════
  // LEVEL CHANGE ANIMATION (using state for SVG compatibility)
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!animated) {
      setAnimatedLevel(level);
      return;
    }

    // Animate level change smoothly
    const startLevel = animatedLevel;
    const diff = level - startLevel;
    const duration = animation.drainDuration;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentLevel = startLevel + diff * eased;

      setAnimatedLevel(currentLevel);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [level]);

  // ═══════════════════════════════════════════════════════════════
  // GLOW PULSE ANIMATION (Always running)
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!animated) return;

    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1 + animation.glowPulseIntensity,
          duration: animation.glowPulseFrequency / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 1 - animation.glowPulseIntensity,
          duration: animation.glowPulseFrequency / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ])
    );
    glowLoop.start();

    return () => glowLoop.stop();
  }, [animated]);

  // ═══════════════════════════════════════════════════════════════
  // PARTICLE ANIMATION (Floating bioluminescent particles)
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!animated || particles.length === 0) return;

    let animationId;
    let lastTime = Date.now();

    const animateParticles = () => {
      const now = Date.now();
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      setParticles(prev => prev.map(particle => {
        // Move particle upward slowly
        let newY = particle.y - particle.speed * delta * 0.15;

        // Reset to bottom when reaching top of liquid
        if (newY < 0) {
          newY = 1;
        }

        // Subtle horizontal drift with sine wave
        const drift = Math.sin(now / 1000 + particle.phase) * 0.01;
        let newX = particle.x + drift;

        // Keep within bounds
        newX = Math.max(0.15, Math.min(0.85, newX));

        return {
          ...particle,
          x: newX,
          y: newY,
        };
      }));

      animationId = requestAnimationFrame(animateParticles);
    };

    animationId = requestAnimationFrame(animateParticles);
    return () => cancelAnimationFrame(animationId);
  }, [animated, particles.length]);

  // ═══════════════════════════════════════════════════════════════
  // WAVE ANIMATION (Liquid surface movement)
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    if (!animated) return;

    let animationId;
    const animateWave = () => {
      setWaveOffset(prev => (prev + 0.02) % (Math.PI * 2));
      animationId = requestAnimationFrame(animateWave);
    };

    animationId = requestAnimationFrame(animateWave);
    return () => cancelAnimationFrame(animationId);
  }, [animated]);

  // Calculate fill height based on animated level (inverted because SVG y increases downward)
  const fillHeight = dimensions.height * 0.95 - (animatedLevel / 100) * (dimensions.height * 0.8);

  // Glow opacity based on animation and intensity
  const glowOpacity = glowAnim.interpolate({
    inputRange: [0.9, 1, 1.1],
    outputRange: [glowIntensity * 0.5, glowIntensity, glowIntensity * 0.5],
  });

  return (
    <View style={[styles.container, { width: dimensions.width, height: dimensions.height }]}>
      {/* Outer glow layer - largest, most diffuse */}
      <Animated.View
        style={[
          styles.glowLayer,
          {
            backgroundColor: glowColor,
            opacity: glowOpacity,
            transform: [{ scale: 1.6 }],
          },
        ]}
      />
      {/* Middle glow layer - medium intensity */}
      <Animated.View
        style={[
          styles.glowLayer,
          {
            backgroundColor: glowColor,
            opacity: glowOpacity,
            transform: [{ scale: 1.35 }],
          },
        ]}
      />
      {/* Inner glow layer - brightest core */}
      <Animated.View
        style={[
          styles.glowLayer,
          {
            backgroundColor: poolColor,
            opacity: glowOpacity,
            transform: [{ scale: 1.15 }],
          },
        ]}
      />

      <Svg
        width={dimensions.width}
        height={dimensions.height}
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
      >
        <Defs>
          {/* Vessel outline gradient */}
          <LinearGradient id="vesselGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={colors.bg3} stopOpacity="0.8" />
            <Stop offset="50%" stopColor={colors.bg2} stopOpacity="0.6" />
            <Stop offset="100%" stopColor={colors.bg3} stopOpacity="0.8" />
          </LinearGradient>

          {/* Liquid gradient */}
          <LinearGradient id="liquidGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={poolColor} stopOpacity="0.9" />
            <Stop offset="50%" stopColor={poolColor} stopOpacity="0.7" />
            <Stop offset="100%" stopColor={poolColor} stopOpacity="0.5" />
          </LinearGradient>

          {/* Glow gradient for liquid surface */}
          <LinearGradient id="liquidGlow" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={glowColor} stopOpacity="0.5" />
            <Stop offset="40%" stopColor={glowColor} stopOpacity="0.2" />
            <Stop offset="100%" stopColor={glowColor} stopOpacity="0" />
          </LinearGradient>

          {/* Radial gradient for liquid depth - brighter center */}
          <RadialGradient id="liquidDepth" cx="50%" cy="30%" rx="50%" ry="60%">
            <Stop offset="0%" stopColor={glowColor} stopOpacity="0.3" />
            <Stop offset="60%" stopColor={poolColor} stopOpacity="0.1" />
            <Stop offset="100%" stopColor={poolColor} stopOpacity="0" />
          </RadialGradient>

          {/* Clip path for liquid to stay inside vessel */}
          <ClipPath id="vesselClip">
            <Path d={getVesselPath(dimensions.width, dimensions.height)} />
          </ClipPath>
        </Defs>

        {/* Vessel glass effect (background) */}
        <Path
          d={getVesselPath(dimensions.width, dimensions.height)}
          fill="url(#vesselGradient)"
          stroke={colors.border}
          strokeWidth={1.5}
          opacity={0.6}
        />

        {/* Liquid fill (clipped to vessel) */}
        <G clipPath="url(#vesselClip)">
          {/* Main liquid body with wavy surface */}
          <Path
            d={getLiquidSurfacePath(dimensions.width, dimensions.height, fillHeight, waveOffset)}
            fill="url(#liquidGradient)"
          />

          {/* Liquid glow overlay at surface */}
          <Rect
            x={0}
            y={fillHeight}
            width={dimensions.width}
            height={dimensions.height * 0.25}
            fill="url(#liquidGlow)"
          />

          {/* Bioluminescent floating particles */}
          {particles.map(particle => {
            // Only render particles that are within the liquid
            const particleY = fillHeight + (particle.y * (dimensions.height - fillHeight));
            if (particleY < fillHeight) return null;

            return (
              <Circle
                key={particle.id}
                cx={particle.x * dimensions.width}
                cy={particleY}
                r={particle.size}
                fill={glowColor}
                opacity={particle.opacity * 0.8}
              />
            );
          })}

          {/* Secondary smaller particles for depth */}
          {particles.map(particle => {
            const particleY = fillHeight + ((particle.y + 0.3) % 1 * (dimensions.height - fillHeight));
            if (particleY < fillHeight) return null;

            return (
              <Circle
                key={`small-${particle.id}`}
                cx={(1 - particle.x) * dimensions.width}
                cy={particleY}
                r={particle.size * 0.5}
                fill="#ffffff"
                opacity={particle.opacity * 0.4}
              />
            );
          })}

          {/* Radial depth overlay for 3D effect */}
          <Ellipse
            cx={dimensions.width * 0.5}
            cy={fillHeight + (dimensions.height - fillHeight) * 0.3}
            rx={dimensions.width * 0.4}
            ry={(dimensions.height - fillHeight) * 0.4}
            fill="url(#liquidDepth)"
          />
        </G>

        {/* Vessel outline (on top) */}
        <Path
          d={getVesselPath(dimensions.width, dimensions.height)}
          fill="none"
          stroke={colors.border}
          strokeWidth={2}
          opacity={0.4}
        />

        {/* Primary highlight reflection - larger, diffuse */}
        <Ellipse
          cx={dimensions.width * 0.32}
          cy={dimensions.height * 0.25}
          rx={dimensions.width * 0.12}
          ry={dimensions.height * 0.15}
          fill="#ffffff"
          opacity={0.06}
        />

        {/* Secondary highlight - small, bright accent */}
        <Ellipse
          cx={dimensions.width * 0.28}
          cy={dimensions.height * 0.18}
          rx={dimensions.width * 0.04}
          ry={dimensions.height * 0.06}
          fill="#ffffff"
          opacity={0.15}
        />

        {/* Tertiary highlight - rim light effect */}
        <Ellipse
          cx={dimensions.width * 0.7}
          cy={dimensions.height * 0.35}
          rx={dimensions.width * 0.03}
          ry={dimensions.height * 0.08}
          fill="#ffffff"
          opacity={0.04}
        />
      </Svg>

      {/* Level label with glow effect */}
      {showLabel && (
        <View style={styles.labelContainer}>
          {/* Shadow layer for depth */}
          <Animated.Text
            style={[
              styles.levelText,
              styles.levelTextShadow,
              {
                color: 'transparent',
                textShadowColor: glowColor,
                textShadowRadius: 20,
                textShadowOffset: { width: 0, height: 0 },
              },
            ]}
          >
            {Math.round(animatedLevel)}%
          </Animated.Text>
          {/* Main text */}
          <Animated.Text
            style={[
              styles.levelText,
              {
                color: poolColor,
                textShadowColor: glowColor,
                textShadowRadius: 12,
                textShadowOffset: { width: 0, height: 2 },
              },
            ]}
          >
            {Math.round(animatedLevel)}%
          </Animated.Text>
        </View>
      )}
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════
// COMPACT VERSION (for inline use)
// ═══════════════════════════════════════════════════════════════
export const CompactPoolVessel = ({ level = 65, size = 60 }) => {
  const { colors, isDark } = useTheme();
  const poolColor = getPoolColor(level, isDark);

  return (
    <View style={[styles.compactContainer, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 40 40">
        <Defs>
          <LinearGradient id="compactLiquid" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={poolColor} stopOpacity="0.8" />
            <Stop offset="100%" stopColor={poolColor} stopOpacity="0.4" />
          </LinearGradient>
          <ClipPath id="compactClip">
            <Path d="M 12 2 C 8 2, 4 6, 4 12 C 4 20, 8 36, 20 38 C 32 36, 36 20, 36 12 C 36 6, 32 2, 28 2 Z" />
          </ClipPath>
        </Defs>

        {/* Background */}
        <Path
          d="M 12 2 C 8 2, 4 6, 4 12 C 4 20, 8 36, 20 38 C 32 36, 36 20, 36 12 C 36 6, 32 2, 28 2 Z"
          fill={colors.bg2}
          stroke={colors.border}
          strokeWidth={1}
        />

        {/* Liquid */}
        <G clipPath="url(#compactClip)">
          <Rect
            x={0}
            y={40 - (level / 100) * 36}
            width={40}
            height={40}
            fill="url(#compactLiquid)"
          />
        </G>
      </Svg>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowLayer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 100,
    // Use shadow for blur effect on iOS, Android will show solid color
  },
  labelContainer: {
    position: 'absolute',
    bottom: '35%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelText: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -1.5,
  },
  levelTextShadow: {
    position: 'absolute',
  },
  compactContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default OrganicPoolVessel;
