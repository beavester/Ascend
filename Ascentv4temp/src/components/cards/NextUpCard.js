// Next Up Card Component
// Per spec: Shows the next incomplete habit with smart prioritization
// Reduces cognitive load by answering "What should I do now?"

import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../hooks/useTheme';
import { typography, spacing, radius, glowShadows } from '../../constants/theme';
import { shouldSuggestTwoMinute } from '../../services/ratchet';
import * as Haptics from 'expo-haptics';

// PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP
// NEXT UP CARD - Smart habit suggestion
// PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP

export const NextUpCard = ({
  habit,
  onComplete,
  onSkip,
  onTwoMinute,
  poolLevel = 65,
  consistency = 50,
  floor = 0,
  style,
}) => {
  const { colors, isDark } = useTheme();

  // Animations
  const glowAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const borderGlowAnim = useRef(new Animated.Value(0)).current;

  // Determine if we should suggest 2-minute version
  const suggest2Min = shouldSuggestTwoMinute(consistency, floor, poolLevel);

  // Pulse glow for attention
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  // Shimmer effect across the card
  useEffect(() => {
    const shimmer = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    shimmer.start();
    return () => shimmer.stop();
  }, []);

  // Border glow animation
  useEffect(() => {
    const borderPulse = Animated.loop(
      Animated.sequence([
        Animated.timing(borderGlowAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(borderGlowAnim, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ])
    );
    borderPulse.start();
    return () => borderPulse.stop();
  }, []);

  const handlePress = () => {
    // Bounce animation with spring
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 0.96,
        friction: 3,
        tension: 200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleComplete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onComplete?.(habit.id);
  };

  const handleTwoMin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onTwoMinute?.(habit);
  };

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.15, 0.35],
  });

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 400],
  });

  const borderOpacity = borderGlowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  if (!habit) {
    return (
      <View style={[styles.container, styles.emptyContainer, { backgroundColor: colors.bg2, borderColor: colors.successLight || 'rgba(34, 197, 94, 0.1)' }, style]}>
        <View style={[styles.celebrationIcon, { backgroundColor: colors.successLight || 'rgba(34, 197, 94, 0.15)' }]}>
          <Text style={styles.celebrationEmoji}>🎉</Text>
        </View>
        <Text style={[styles.emptyText, { color: colors.success || '#22c55e' }]}>
          All done for today!
        </Text>
        <Text style={[styles.emptySubtext, { color: colors.text2 }]}>
          You crushed it. Rest up and come back tomorrow.
        </Text>
        <Text style={[styles.identityReinforcement, { color: colors.text3 }]}>
          That's what you do now. ✨
        </Text>
      </View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: colors.bg2,
          transform: [{ scale: scaleAnim }],
        },
        isDark && glowShadows.subtleGlow(colors.accent),
        style,
      ]}
    >
      {/* Animated gradient border */}
      <Animated.View
        style={[
          styles.gradientBorderContainer,
          { opacity: borderOpacity },
        ]}
      >
        <LinearGradient
          colors={[colors.accent, colors.accentLight || colors.accent, colors.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBorder}
        />
      </Animated.View>

      {/* Inner card background */}
      <View style={[styles.innerCard, { backgroundColor: colors.bg2 }]}>
        {/* Glow overlay */}
        <Animated.View
          style={[
            styles.glowOverlay,
            {
              backgroundColor: colors.accent,
              opacity: glowOpacity,
            },
          ]}
        />

        {/* Shimmer effect */}
        <Animated.View
          style={[
            styles.shimmerOverlay,
            {
              transform: [{ translateX: shimmerTranslate }],
            },
          ]}
        >
          <LinearGradient
            colors={['transparent', 'rgba(255,255,255,0.08)', 'transparent']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.shimmerGradient}
          />
        </Animated.View>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.labelContainer}>
            <View style={[styles.labelDot, { backgroundColor: colors.accent }]} />
            <Text style={[styles.label, { color: colors.accent }]}>NEXT UP</Text>
          </View>
          {poolLevel < 40 && (
            <View style={[styles.lowPoolBadge, { backgroundColor: colors.warningLight || 'rgba(251, 191, 36, 0.15)' }]}>
              <Text style={[styles.lowPoolText, { color: colors.warning }]}>Low energy</Text>
            </View>
          )}
        </View>

        {/* Habit info */}
        <TouchableOpacity
          style={styles.habitContent}
          onPress={handlePress}
          activeOpacity={0.8}
        >
          <Text style={[styles.habitName, { color: colors.text }]}>{habit.name}</Text>
          {habit.target && (
            <Text style={[styles.habitTarget, { color: colors.text2 }]}>{habit.target}</Text>
          )}
        </TouchableOpacity>

        {/* 2-minute suggestion when appropriate */}
        {suggest2Min && (
          <View style={[styles.suggestion, { backgroundColor: colors.bg3 }]}>
            <Text style={[styles.suggestionText, { color: colors.text2 }]}>
              Pool is {poolLevel < 40 ? 'low' : 'moderate'}. Try the 2-minute version?
            </Text>
          </View>
        )}

        {/* Action buttons */}
        <View style={styles.actions}>
          {suggest2Min ? (
            <>
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton, { borderColor: colors.border }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onSkip?.(habit.id);
                }}
              >
                <Text style={[styles.buttonText, { color: colors.text2 }]}>Skip</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.twoMinButton, { backgroundColor: colors.warning }]}
                onPress={handleTwoMin}
              >
                <Text style={[styles.buttonText, { color: '#fff' }]}>2-Min Version</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.primaryButton, { backgroundColor: colors.accent }]}
                onPress={handleComplete}
              >
                <Text style={[styles.buttonText, { color: '#fff' }]}>Full</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton, { borderColor: colors.border }]}
                onPress={handleTwoMin}
              >
                <Text style={[styles.buttonText, { color: colors.text2 }]}>2-Min</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.primaryButton, styles.primaryButtonLarge, { backgroundColor: colors.accent }]}
                onPress={handleComplete}
              >
                <Text style={[styles.buttonText, { color: '#fff' }]}>Mark Complete</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Animated.View>
  );
};

// PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP
// COMPACT NEXT UP (for smaller display)
// PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP

export const CompactNextUp = ({
  habit,
  onPress,
  style,
}) => {
  const { colors } = useTheme();

  if (!habit) return null;

  return (
    <TouchableOpacity
      style={[styles.compactContainer, { backgroundColor: colors.bg2, borderColor: colors.border }, style]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.compactContent}>
        <Text style={[styles.compactLabel, { color: colors.accent }]}>NEXT:</Text>
        <Text style={[styles.compactName, { color: colors.text }]} numberOfLines={1}>
          {habit.name}
        </Text>
      </View>
      <View style={[styles.compactArrow, { backgroundColor: colors.accent }]}>
        <Text style={styles.arrowText}>&gt;</Text>
      </View>
    </TouchableOpacity>
  );
};

// PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP
// STYLES
// PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP
const styles = StyleSheet.create({
  container: {
    borderRadius: radius.xl,
    padding: 2,
    overflow: 'hidden',
  },
  gradientBorderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: radius.xl,
  },
  gradientBorder: {
    flex: 1,
    borderRadius: radius.xl,
  },
  innerCard: {
    borderRadius: radius.xl - 2,
    padding: spacing.lg,
    overflow: 'hidden',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    borderWidth: 1,
  },
  glowOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: radius.xl - 2,
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 100,
  },
  shimmerGradient: {
    flex: 1,
    width: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  labelDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    ...typography.label,
    letterSpacing: 1.5,
    fontWeight: '700',
  },
  lowPoolBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  lowPoolText: {
    ...typography.caption,
    fontWeight: '600',
  },
  habitContent: {
    marginBottom: spacing.md,
  },
  habitName: {
    ...typography.h2,
    marginBottom: 4,
  },
  habitTarget: {
    ...typography.body,
  },
  suggestion: {
    padding: spacing.sm,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  suggestionText: {
    ...typography.bodySmall,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  button: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    flex: 1,
  },
  primaryButtonLarge: {
    flex: 2,
  },
  secondaryButton: {
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  twoMinButton: {
    flex: 1,
  },
  buttonText: {
    ...typography.bodySmall,
    fontWeight: '600',
  },
  emptyText: {
    ...typography.h3,
    marginBottom: 4,
    textAlign: 'center',
  },
  emptySubtext: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: 8,
  },
  celebrationIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  celebrationEmoji: {
    fontSize: 28,
  },
  identityReinforcement: {
    ...typography.caption,
    fontStyle: 'italic',
    marginTop: 4,
  },
  // Compact styles
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
  },
  compactContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  compactLabel: {
    ...typography.caption,
    fontWeight: '700',
  },
  compactName: {
    ...typography.body,
    flex: 1,
  },
  compactArrow: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});

export default NextUpCard;
