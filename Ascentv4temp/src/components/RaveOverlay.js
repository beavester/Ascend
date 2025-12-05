// RaveOverlay Component
// 5-second audio-visual rave celebration for 2-min habit completions
// Features: strobe background, lasers, flame particles, synced audio

import React, { useEffect, useRef, useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Modal,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
  cancelAnimation,
  runOnJS,
  interpolateColor,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Rave color palette
const RAVE_COLORS = {
  magenta: '#FF00FF',
  cyan: '#00FFFF',
  yellow: '#FFFF00',
  white: '#FFFFFF',
  orange: '#FF6600',
  lime: '#00FF00',
  pink: '#FF1493',
};

const STROBE_COLORS = [
  RAVE_COLORS.magenta,
  RAVE_COLORS.cyan,
  RAVE_COLORS.yellow,
  RAVE_COLORS.white,
];

const RAVE_DURATION = 5000; // 5 seconds
const STROBE_INTERVAL = 120; // ~8 flashes per second

// ═══════════════════════════════════════════════════════════════
// STROBE BACKGROUND
// ═══════════════════════════════════════════════════════════════

const StrobeBackground = ({ active }) => {
  const colorIndex = useSharedValue(0);

  useEffect(() => {
    if (active) {
      colorIndex.value = withRepeat(
        withTiming(3, { duration: STROBE_INTERVAL * 4, easing: Easing.steps(4) }),
        -1,
        false
      );
    }
    return () => cancelAnimation(colorIndex);
  }, [active]);

  const animatedStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      colorIndex.value,
      [0, 1, 2, 3],
      STROBE_COLORS
    );
    return { backgroundColor };
  });

  return <Animated.View style={[styles.strobeBackground, animatedStyle]} />;
};

// ═══════════════════════════════════════════════════════════════
// LASER BEAM
// ═══════════════════════════════════════════════════════════════

const LaserBeam = ({ delay, startX, color, direction }) => {
  const rotation = useSharedValue(direction === 'left' ? -45 : 45);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.9, { duration: 100 }),
          withTiming(0.3, { duration: 100 })
        ),
        -1,
        true
      )
    );

    rotation.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(direction === 'left' ? 15 : -15, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(direction === 'left' ? -45 : 45, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );

    return () => {
      cancelAnimation(rotation);
      cancelAnimation(opacity);
    };
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: startX },
      { rotate: `${rotation.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.laserContainer, animatedStyle]}>
      <LinearGradient
        colors={['transparent', color, color, 'transparent']}
        style={styles.laserBeam}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      {/* Glow effect */}
      <View style={[styles.laserGlow, { backgroundColor: color, shadowColor: color }]} />
    </Animated.View>
  );
};

// ═══════════════════════════════════════════════════════════════
// FLAME PARTICLE
// ═══════════════════════════════════════════════════════════════

const FlameParticle = ({ startX, delay, size }) => {
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.5);

  useEffect(() => {
    const drift = (Math.random() - 0.5) * 60;

    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-SCREEN_HEIGHT * 0.5, { duration: 1200, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 0 })
        ),
        -1,
        false
      )
    );

    translateX.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(drift, { duration: 1200, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 0 })
        ),
        -1,
        false
      )
    );

    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 200 }),
          withTiming(0, { duration: 1000 })
        ),
        -1,
        false
      )
    );

    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1.5, { duration: 400, easing: Easing.out(Easing.quad) }),
          withTiming(0.3, { duration: 800 })
        ),
        -1,
        false
      )
    );

    return () => {
      cancelAnimation(translateY);
      cancelAnimation(translateX);
      cancelAnimation(opacity);
      cancelAnimation(scale);
    };
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.flameParticle, { left: startX, width: size, height: size * 1.5 }, animatedStyle]}>
      <LinearGradient
        colors={[RAVE_COLORS.yellow, RAVE_COLORS.orange, '#FF0000', 'transparent']}
        style={styles.flameGradient}
        start={{ x: 0.5, y: 1 }}
        end={{ x: 0.5, y: 0 }}
      />
    </Animated.View>
  );
};

// ═══════════════════════════════════════════════════════════════
// FLAME COLUMN (multiple particles)
// ═══════════════════════════════════════════════════════════════

const FlameColumn = ({ x }) => {
  const particles = [];
  const particleCount = 8;

  for (let i = 0; i < particleCount; i++) {
    const delay = i * 150;
    const size = 20 + Math.random() * 30;
    const offsetX = (Math.random() - 0.5) * 40;
    particles.push(
      <FlameParticle
        key={i}
        startX={x + offsetX}
        delay={delay}
        size={size}
      />
    );
  }

  return <>{particles}</>;
};

// ═══════════════════════════════════════════════════════════════
// DISCO BALL (center decoration)
// ═══════════════════════════════════════════════════════════════

const DiscoBall = () => {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withSequence(
      withTiming(1.2, { duration: 300, easing: Easing.out(Easing.back(2)) }),
      withTiming(1, { duration: 200 })
    );

    rotation.value = withRepeat(
      withTiming(360, { duration: 2000, easing: Easing.linear }),
      -1,
      false
    );

    return () => {
      cancelAnimation(rotation);
      cancelAnimation(scale);
    };
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation.value}deg` },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View style={[styles.discoBall, animatedStyle]}>
      <View style={styles.discoBallInner}>
        {/* Disco ball facets */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
          <View
            key={angle}
            style={[
              styles.discoBallFacet,
              { transform: [{ rotate: `${angle}deg` }, { translateY: -20 }] },
            ]}
          />
        ))}
      </View>
    </Animated.View>
  );
};

// ═══════════════════════════════════════════════════════════════
// MAIN RAVE OVERLAY COMPONENT
// ═══════════════════════════════════════════════════════════════

export const RaveOverlay = ({
  trigger,
  onComplete,
  audioRef, // Pass from parent for audio control
}) => {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef(null);
  const hasTriggeredRef = useRef(false);

  const startRave = useCallback(() => {
    if (hasTriggeredRef.current) return;
    hasTriggeredRef.current = true;

    setVisible(true);

    // Haptic burst pattern
    const hapticBurst = async () => {
      for (let i = 0; i < 5; i++) {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    };
    hapticBurst();

    // Play audio if available
    if (audioRef?.current?.playAsync) {
      audioRef.current.setPositionAsync(0);
      audioRef.current.playAsync().catch(console.warn);
    }

    // Auto-dismiss after 5 seconds
    timeoutRef.current = setTimeout(() => {
      setVisible(false);
      hasTriggeredRef.current = false;

      // Stop audio
      if (audioRef?.current?.stopAsync) {
        audioRef.current.stopAsync().catch(console.warn);
      }

      onComplete?.();
    }, RAVE_DURATION);
  }, [onComplete, audioRef]);

  useEffect(() => {
    if (trigger && !hasTriggeredRef.current) {
      startRave();
    }
  }, [trigger, startRave]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (audioRef?.current?.stopAsync) {
        audioRef.current.stopAsync().catch(() => {});
      }
    };
  }, [audioRef]);

  if (!visible) return null;

  // Generate lasers
  const laserConfigs = [
    { delay: 0, startX: -SCREEN_WIDTH * 0.3, color: RAVE_COLORS.magenta, direction: 'right' },
    { delay: 100, startX: SCREEN_WIDTH * 0.3, color: RAVE_COLORS.cyan, direction: 'left' },
    { delay: 200, startX: -SCREEN_WIDTH * 0.1, color: RAVE_COLORS.lime, direction: 'right' },
    { delay: 300, startX: SCREEN_WIDTH * 0.1, color: RAVE_COLORS.pink, direction: 'left' },
    { delay: 400, startX: -SCREEN_WIDTH * 0.5, color: RAVE_COLORS.yellow, direction: 'right' },
    { delay: 500, startX: SCREEN_WIDTH * 0.5, color: RAVE_COLORS.orange, direction: 'left' },
  ];

  // Flame column positions
  const flamePositions = [
    SCREEN_WIDTH * 0.15,
    SCREEN_WIDTH * 0.5,
    SCREEN_WIDTH * 0.85,
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.container}>
        {/* Strobe background */}
        <StrobeBackground active={visible} />

        {/* Disco ball */}
        <View style={styles.discoBallContainer}>
          <DiscoBall />
        </View>

        {/* Laser beams */}
        <View style={styles.laserLayer}>
          {laserConfigs.map((config, index) => (
            <LaserBeam key={index} {...config} />
          ))}
        </View>

        {/* Flame columns */}
        <View style={styles.flameLayer}>
          {flamePositions.map((x, index) => (
            <FlameColumn key={index} x={x} />
          ))}
        </View>

        {/* Center text flash */}
        <View style={styles.centerTextContainer}>
          <Animated.Text style={styles.raveText}>
            RAVE MODE
          </Animated.Text>
        </View>
      </View>
    </Modal>
  );
};

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  strobeBackground: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.7,
  },
  laserLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  laserContainer: {
    position: 'absolute',
    top: -50,
    width: 8,
    height: SCREEN_HEIGHT * 1.5,
    alignItems: 'center',
  },
  laserBeam: {
    width: 4,
    height: '100%',
    borderRadius: 2,
  },
  laserGlow: {
    position: 'absolute',
    width: 20,
    height: '100%',
    opacity: 0.4,
    borderRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 10,
  },
  flameLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  flameParticle: {
    position: 'absolute',
    bottom: 0,
    borderRadius: 100,
    overflow: 'hidden',
  },
  flameGradient: {
    flex: 1,
    borderRadius: 100,
  },
  discoBallContainer: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.15,
    alignSelf: 'center',
    zIndex: 10,
  },
  discoBall: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 30,
    elevation: 20,
  },
  discoBallInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#555',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  discoBallFacet: {
    position: 'absolute',
    width: 8,
    height: 8,
    backgroundColor: '#fff',
    borderRadius: 1,
  },
  centerTextContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  raveText: {
    fontSize: 48,
    fontWeight: '900',
    color: '#fff',
    textShadowColor: RAVE_COLORS.magenta,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 30,
    letterSpacing: 8,
  },
});

export default RaveOverlay;
