// HintBubble Component
// Contextual tooltips and first-time hints for intuitive navigation
// Follows the "Bioluminescent Depth" aesthetic

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Easing,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ═══════════════════════════════════════════════════════════════
// HINT BUBBLE - Floating contextual tooltip
// ═══════════════════════════════════════════════════════════════

export const HintBubble = ({
  visible,
  message,
  subtext,
  icon,
  position = 'bottom', // 'top', 'bottom', 'left', 'right'
  align = 'center', // 'left', 'center', 'right'
  onDismiss,
  autoDismiss = 5000, // ms, 0 to disable
  style,
}) => {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(position === 'top' ? -10 : 10)).current;
  const scale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 250,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 250,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
      ]).start();

      // Auto dismiss
      if (autoDismiss > 0 && onDismiss) {
        const timer = setTimeout(() => {
          handleDismiss();
        }, autoDismiss);
        return () => clearTimeout(timer);
      }
    } else {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 0.9, duration: 150, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const handleDismiss = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 0.9, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      onDismiss?.();
    });
  };

  if (!visible && opacity._value === 0) return null;

  const getArrowStyle = () => {
    const base = {
      width: 0,
      height: 0,
      borderLeftWidth: 8,
      borderRightWidth: 8,
      borderLeftColor: 'transparent',
      borderRightColor: 'transparent',
    };

    if (position === 'bottom') {
      return {
        ...base,
        borderBottomWidth: 8,
        borderBottomColor: colors.accent,
        marginBottom: -1,
      };
    }
    return {
      ...base,
      borderTopWidth: 8,
      borderTopColor: colors.accent,
      marginTop: -1,
    };
  };

  return (
    <Animated.View
      style={[
        styles.hintContainer,
        {
          opacity,
          transform: [{ translateY }, { scale }],
        },
        style,
      ]}
    >
      {position === 'bottom' && (
        <View style={[styles.arrowContainer, { alignSelf: align === 'center' ? 'center' : align === 'left' ? 'flex-start' : 'flex-end', paddingHorizontal: 20 }]}>
          <View style={getArrowStyle()} />
        </View>
      )}

      <TouchableOpacity
        style={[styles.hintBubble, { backgroundColor: colors.accent }]}
        onPress={handleDismiss}
        activeOpacity={0.9}
      >
        <View style={styles.hintContent}>
          {icon && (
            <View style={styles.hintIconContainer}>
              <Ionicons name={icon} size={16} color="#fff" />
            </View>
          )}
          <View style={styles.hintTextContainer}>
            <Text style={styles.hintMessage}>{message}</Text>
            {subtext && <Text style={styles.hintSubtext}>{subtext}</Text>}
          </View>
          <View style={styles.dismissHint}>
            <Ionicons name="close" size={14} color="rgba(255,255,255,0.6)" />
          </View>
        </View>
      </TouchableOpacity>

      {position === 'top' && (
        <View style={[styles.arrowContainer, { alignSelf: align === 'center' ? 'center' : align === 'left' ? 'flex-start' : 'flex-end', paddingHorizontal: 20 }]}>
          <View style={getArrowStyle()} />
        </View>
      )}
    </Animated.View>
  );
};

// ═══════════════════════════════════════════════════════════════
// PULSE INDICATOR - Draws attention to interactive elements
// ═══════════════════════════════════════════════════════════════

export const PulseIndicator = ({
  visible,
  size = 12,
  color,
  style,
}) => {
  const { colors } = useTheme();
  const pulseColor = color || colors.accent;
  const pulseScale = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible) {
      const pulse = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(pulseScale, {
              toValue: 2,
              duration: 1000,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(pulseScale, {
              toValue: 1,
              duration: 0,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(pulseOpacity, {
              toValue: 0,
              duration: 1000,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(pulseOpacity, {
              toValue: 0.8,
              duration: 0,
              useNativeDriver: true,
            }),
          ]),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={[styles.pulseContainer, style]}>
      <Animated.View
        style={[
          styles.pulseRing,
          {
            width: size * 2,
            height: size * 2,
            borderRadius: size,
            borderColor: pulseColor,
            transform: [{ scale: pulseScale }],
            opacity: pulseOpacity,
          },
        ]}
      />
      <View
        style={[
          styles.pulseDot,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: pulseColor,
          },
        ]}
      />
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════
// TAP HINT - Shows tap gesture hint over elements
// ═══════════════════════════════════════════════════════════════

export const TapHint = ({
  visible,
  message = 'Tap',
  style,
}) => {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0)).current;
  const handY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      opacity.setValue(1);
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(handY, {
            toValue: 5,
            duration: 400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(handY, {
            toValue: 0,
            duration: 400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.delay(800),
        ])
      );
      animation.start();
      return () => animation.stop();
    } else {
      opacity.setValue(0);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.tapHintContainer, { opacity }, style]}>
      <Animated.View style={{ transform: [{ translateY: handY }] }}>
        <Ionicons name="hand-right" size={24} color={colors.accent} />
      </Animated.View>
      <Text style={[styles.tapHintText, { color: colors.text2 }]}>{message}</Text>
    </Animated.View>
  );
};

// ═══════════════════════════════════════════════════════════════
// SWIPE HINT - Shows swipe gesture over elements
// ═══════════════════════════════════════════════════════════════

export const SwipeHint = ({
  visible,
  direction = 'left', // 'left', 'right', 'up', 'down'
  message,
  style,
}) => {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      opacity.setValue(1);

      const isHorizontal = direction === 'left' || direction === 'right';
      const animValue = isHorizontal ? translateX : translateY;
      const startVal = direction === 'left' || direction === 'up' ? 20 : -20;
      const endVal = direction === 'left' || direction === 'up' ? -20 : 20;

      animValue.setValue(startVal);

      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(animValue, {
            toValue: endVal,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.delay(500),
          Animated.timing(animValue, {
            toValue: startVal,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    } else {
      opacity.setValue(0);
    }
  }, [visible, direction]);

  if (!visible) return null;

  const iconName = direction === 'left' ? 'arrow-back' :
                   direction === 'right' ? 'arrow-forward' :
                   direction === 'up' ? 'arrow-up' : 'arrow-down';

  return (
    <Animated.View
      style={[
        styles.swipeHintContainer,
        { opacity },
        style
      ]}
    >
      <View style={[styles.swipeHintPill, { backgroundColor: colors.accent + '20' }]}>
        <Animated.View style={{ transform: [{ translateX }, { translateY }] }}>
          <Ionicons name={iconName} size={18} color={colors.accent} />
        </Animated.View>
        {message && (
          <Text style={[styles.swipeHintText, { color: colors.accent }]}>{message}</Text>
        )}
      </View>
    </Animated.View>
  );
};

// ═══════════════════════════════════════════════════════════════
// FEATURE SPOTLIGHT - Full-screen spotlight on a feature
// ═══════════════════════════════════════════════════════════════

export const FeatureSpotlight = ({
  visible,
  title,
  description,
  icon,
  onDismiss,
  position = { top: '50%', left: '50%' }, // Position of the spotlight center
}) => {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleDismiss = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.timing(opacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onDismiss?.();
    });
  };

  if (!visible) return null;

  return (
    <Animated.View style={[styles.spotlightOverlay, { opacity }]}>
      <TouchableOpacity
        style={styles.spotlightBackdrop}
        onPress={handleDismiss}
        activeOpacity={1}
      />
      <View style={[styles.spotlightContent, { backgroundColor: colors.card }]}>
        {icon && (
          <View style={[styles.spotlightIcon, { backgroundColor: colors.accentLight }]}>
            <Ionicons name={icon} size={28} color={colors.accent} />
          </View>
        )}
        <Text style={[styles.spotlightTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.spotlightDescription, { color: colors.text2 }]}>{description}</Text>
        <TouchableOpacity
          style={[styles.spotlightButton, { backgroundColor: colors.accent }]}
          onPress={handleDismiss}
        >
          <Text style={styles.spotlightButtonText}>Got it</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

// ═══════════════════════════════════════════════════════════════
// INLINE HINT - Small inline hint text
// ═══════════════════════════════════════════════════════════════

export const InlineHint = ({
  visible,
  message,
  icon,
  style,
}) => {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: visible ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  if (!visible && opacity._value === 0) return null;

  return (
    <Animated.View style={[styles.inlineHint, { opacity }, style]}>
      {icon && <Ionicons name={icon} size={12} color={colors.text3} style={{ marginRight: 4 }} />}
      <Text style={[styles.inlineHintText, { color: colors.text3 }]}>{message}</Text>
    </Animated.View>
  );
};

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  // Hint Bubble
  hintContainer: {
    position: 'absolute',
    zIndex: 1000,
    maxWidth: SCREEN_WIDTH - 40,
  },
  arrowContainer: {
    alignItems: 'center',
  },
  hintBubble: {
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  hintContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hintIconContainer: {
    marginRight: 10,
  },
  hintTextContainer: {
    flex: 1,
  },
  hintMessage: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  hintSubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 2,
  },
  dismissHint: {
    marginLeft: 8,
    padding: 2,
  },

  // Pulse Indicator
  pulseContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    borderWidth: 2,
  },
  pulseDot: {},

  // Tap Hint
  tapHintContainer: {
    alignItems: 'center',
    gap: 4,
  },
  tapHintText: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Swipe Hint
  swipeHintContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  swipeHintPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  swipeHintText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Feature Spotlight
  spotlightOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
  },
  spotlightBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  spotlightContent: {
    width: SCREEN_WIDTH - 60,
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
  },
  spotlightIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  spotlightTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  spotlightDescription: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  spotlightButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 10,
  },
  spotlightButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },

  // Inline Hint
  inlineHint: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inlineHintText: {
    fontSize: 11,
    fontStyle: 'italic',
  },
});

export default HintBubble;
