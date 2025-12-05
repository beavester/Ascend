// Retention Components
// Milestone celebrations, empty states with CTAs, progress glanceability
// Every element answers: "What does the user FEEL after this?"

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../hooks/useTheme';
import { spacing, radius } from '../constants/theme';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ═══════════════════════════════════════════════════════════════
// MILESTONE CELEBRATION MODAL
// For Day 1, 3, 7 retention cliffs
// ═══════════════════════════════════════════════════════════════

export const MilestoneModal = ({
  visible,
  milestone,
  onDismiss,
}) => {
  const { colors, isDark } = useTheme();
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(0)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Haptic burst for milestone
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Staggered entrance
      Animated.sequence([
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 6,
            tension: 100,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
        Animated.spring(iconScale, {
          toValue: 1,
          friction: 4,
          tension: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Confetti animation
      Animated.loop(
        Animated.timing(confettiAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    } else {
      scaleAnim.setValue(0.8);
      opacityAnim.setValue(0);
      iconScale.setValue(0);
    }
  }, [visible]);

  if (!visible || !milestone) return null;

  const handleDismiss = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss?.();
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <Animated.View style={[styles.milestoneOverlay, { opacity: opacityAnim }]}>
        <TouchableOpacity
          style={styles.milestoneBackdrop}
          activeOpacity={1}
          onPress={handleDismiss}
        />

        <Animated.View
          style={[
            styles.milestoneCard,
            {
              backgroundColor: colors.card,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Icon with celebration animation */}
          <Animated.View
            style={[
              styles.milestoneIconContainer,
              {
                backgroundColor: colors.accentLight,
                transform: [{ scale: iconScale }],
              },
            ]}
          >
            <Ionicons
              name={milestone.icon || 'trophy'}
              size={40}
              color={colors.accent}
            />
          </Animated.View>

          {/* Day badge */}
          <View style={[styles.dayBadge, { backgroundColor: colors.accent }]}>
            <Text style={styles.dayBadgeText}>DAY {milestone.day}</Text>
          </View>

          <Text style={[styles.milestoneTitle, { color: colors.text }]}>
            {milestone.title}
          </Text>

          <Text style={[styles.milestoneMessage, { color: colors.text2 }]}>
            {milestone.message}
          </Text>

          {milestone.subtext && (
            <View style={[styles.milestoneSubtextBox, { backgroundColor: colors.bg2 }]}>
              <Ionicons
                name={milestone.unlock ? 'lock-open' : 'sparkles'}
                size={14}
                color={colors.accent}
              />
              <Text style={[styles.milestoneSubtext, { color: colors.text2 }]}>
                {milestone.subtext}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.milestoneButton, { backgroundColor: colors.accent }]}
            onPress={handleDismiss}
          >
            <Text style={styles.milestoneButtonText}>Continue</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

// ═══════════════════════════════════════════════════════════════
// COMPELLING EMPTY STATE
// No dead ends - always a clear CTA
// ═══════════════════════════════════════════════════════════════

export const EmptyState = ({
  icon,
  title,
  message,
  cta,
  onAction,
  hint,
  progress,
  suggestions,
  celebration,
}) => {
  const { colors } = useTheme();
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Gentle bounce animation to draw attention
    const bounce = Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -5,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    bounce.start();
    return () => bounce.stop();
  }, []);

  return (
    <View style={styles.emptyContainer}>
      <Animated.View
        style={[
          styles.emptyIconCircle,
          {
            backgroundColor: celebration ? colors.successLight : colors.accentLight,
            transform: [{ translateY: bounceAnim }],
          },
        ]}
      >
        <Ionicons
          name={icon || 'add-circle'}
          size={36}
          color={celebration ? colors.success : colors.accent}
        />
      </Animated.View>

      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        {title}
      </Text>

      <Text style={[styles.emptyMessage, { color: colors.text2 }]}>
        {message}
      </Text>

      {progress && (
        <View style={[styles.progressBadge, { backgroundColor: colors.bg2 }]}>
          <Ionicons name="time-outline" size={12} color={colors.text3} />
          <Text style={[styles.progressText, { color: colors.text3 }]}>
            {progress}
          </Text>
        </View>
      )}

      {cta && onAction && (
        <TouchableOpacity
          style={[styles.emptyCta, { backgroundColor: colors.accent }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onAction();
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.emptyCtaText}>{cta}</Text>
          <Ionicons name="arrow-forward" size={16} color="#fff" />
        </TouchableOpacity>
      )}

      {suggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          {suggestions.map((suggestion, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.suggestionPill, { backgroundColor: colors.bg2 }]}
              onPress={() => {
                Haptics.selectionAsync();
                onAction?.(suggestion);
              }}
            >
              <Text style={[styles.suggestionText, { color: colors.text2 }]}>
                {suggestion}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {hint && (
        <View style={styles.hintContainer}>
          <Ionicons name="bulb-outline" size={14} color={colors.text3} />
          <Text style={[styles.hintText, { color: colors.text3 }]}>
            {hint}
          </Text>
        </View>
      )}
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════
// PROGRESS HEADER
// Glanceable: Where am I? How far have I come? What's next?
// ═══════════════════════════════════════════════════════════════

export const ProgressHeader = ({
  accomplished,
  journey,
  nextAction,
  progressPercent,
  energyLabel,
  poolLevel,
  isComplete,
}) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.progressHeader, { backgroundColor: colors.card }]}>
      {/* Progress bar */}
      <View style={[styles.progressBarContainer, { backgroundColor: colors.bg2 }]}>
        <View
          style={[
            styles.progressBarFill,
            {
              backgroundColor: isComplete ? colors.success : colors.accent,
              width: `${progressPercent}%`,
            },
          ]}
        />
      </View>

      {/* Stats row */}
      <View style={styles.progressStats}>
        {/* What they've done */}
        <View style={styles.progressStat}>
          <Text style={[styles.progressValue, { color: isComplete ? colors.success : colors.text }]}>
            {accomplished}
          </Text>
          <Text style={[styles.progressLabel, { color: colors.text3 }]}>Today</Text>
        </View>

        {/* Divider */}
        <View style={[styles.progressDivider, { backgroundColor: colors.border }]} />

        {/* How far they've come */}
        <View style={styles.progressStat}>
          <Text style={[styles.progressValue, { color: colors.warning }]}>
            {journey}
          </Text>
          <Text style={[styles.progressLabel, { color: colors.text3 }]}>Journey</Text>
        </View>

        {/* Divider */}
        <View style={[styles.progressDivider, { backgroundColor: colors.border }]} />

        {/* What's next */}
        <View style={styles.progressStat}>
          <Text style={[styles.progressValue, { color: colors.text }]}>
            {nextAction}
          </Text>
          <Text style={[styles.progressLabel, { color: colors.text3 }]}>Next</Text>
        </View>
      </View>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════
// LOSS AVERSION BANNER
// "Don't lose your streak" framing
// ═══════════════════════════════════════════════════════════════

export const LossAversionBanner = ({
  title,
  message,
  urgency, // 'low', 'medium', 'high', 'critical'
  onAction,
  actionLabel,
}) => {
  const { colors } = useTheme();

  const urgencyColors = {
    low: colors.text3,
    medium: colors.warning,
    high: colors.warning,
    critical: colors.error || '#ef4444',
  };

  const urgencyBg = {
    low: colors.bg2,
    medium: colors.warningLight,
    high: colors.warningLight,
    critical: 'rgba(239, 68, 68, 0.1)',
  };

  const borderColor = urgencyColors[urgency] || colors.text3;
  const bgColor = urgencyBg[urgency] || colors.bg2;

  return (
    <TouchableOpacity
      style={[
        styles.lossAversionBanner,
        {
          backgroundColor: bgColor,
          borderLeftColor: borderColor,
        },
      ]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onAction?.();
      }}
      activeOpacity={0.8}
    >
      <View style={styles.lossAversionContent}>
        <Ionicons
          name={urgency === 'critical' ? 'warning' : urgency === 'high' ? 'flame' : 'time'}
          size={18}
          color={borderColor}
        />
        <View style={styles.lossAversionText}>
          <Text style={[styles.lossAversionTitle, { color: borderColor }]}>
            {title}
          </Text>
          <Text style={[styles.lossAversionMessage, { color: colors.text2 }]}>
            {message}
          </Text>
        </View>
      </View>
      {actionLabel && (
        <View style={[styles.lossAversionAction, { backgroundColor: borderColor }]}>
          <Text style={styles.lossAversionActionText}>{actionLabel}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

// ═══════════════════════════════════════════════════════════════
// IDENTITY REINFORCEMENT TOAST
// "That's what you do now" style messages
// ═══════════════════════════════════════════════════════════════

export const IdentityToast = ({
  visible,
  message,
  type, // 'identity', 'growth', 'reinforcement', 'status'
  onDismiss,
}) => {
  const { colors } = useTheme();
  const translateY = useRef(new Animated.Value(100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          friction: 8,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-dismiss after 3 seconds
      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: 100,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(() => onDismiss?.());
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) return null;

  const typeIcons = {
    identity: 'person',
    growth: 'trending-up',
    reinforcement: 'checkmark-circle',
    status: 'star',
    motivation: 'flash',
  };

  return (
    <Animated.View
      style={[
        styles.identityToast,
        {
          backgroundColor: colors.card,
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <View style={[styles.identityToastIcon, { backgroundColor: colors.accentLight }]}>
        <Ionicons name={typeIcons[type] || 'sparkles'} size={16} color={colors.accent} />
      </View>
      <Text style={[styles.identityToastText, { color: colors.text }]}>
        {message}
      </Text>
    </Animated.View>
  );
};

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  // Milestone Modal
  milestoneOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  milestoneBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  milestoneCard: {
    width: SCREEN_WIDTH - 48,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
  },
  milestoneIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  dayBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 16,
  },
  dayBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  milestoneTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  milestoneMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
  },
  milestoneSubtextBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  milestoneSubtext: {
    fontSize: 13,
    fontWeight: '500',
  },
  milestoneButton: {
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    minWidth: 160,
    minHeight: 48, // iOS HIG: minimum 44pt tap target
    alignItems: 'center',
    justifyContent: 'center',
  },
  milestoneButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    padding: 32,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  progressBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginBottom: 20,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 16,
    minHeight: 48, // iOS HIG: minimum 44pt tap target
  },
  emptyCtaText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  suggestionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  suggestionPill: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    minHeight: 44, // iOS HIG: minimum 44pt tap target
    justifyContent: 'center',
  },
  suggestionText: {
    fontSize: 13,
  },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  hintText: {
    fontSize: 13,
    fontStyle: 'italic',
  },

  // Progress Header
  progressHeader: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  progressBarContainer: {
    height: 4,
    borderRadius: 2,
    marginBottom: 16,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressStat: {
    flex: 1,
    alignItems: 'center',
  },
  progressValue: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  progressLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  progressDivider: {
    width: 1,
    height: 28,
  },

  // Loss Aversion Banner
  lossAversionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    borderLeftWidth: 4,
    marginBottom: 16,
  },
  lossAversionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  lossAversionText: {
    flex: 1,
  },
  lossAversionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  lossAversionMessage: {
    fontSize: 13,
  },
  lossAversionAction: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginLeft: 12,
    minHeight: 44, // iOS HIG: minimum 44pt tap target
    justifyContent: 'center',
  },
  lossAversionActionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },

  // Identity Toast
  identityToast: {
    position: 'absolute',
    bottom: 100,
    left: 24,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  identityToastIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  identityToastText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default {
  MilestoneModal,
  EmptyState,
  ProgressHeader,
  LossAversionBanner,
  IdentityToast,
};
