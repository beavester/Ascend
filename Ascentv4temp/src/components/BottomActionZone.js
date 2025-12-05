// BottomActionZone Component
// Fixed action button for current incomplete habit
// Using standard React Native Animated API (Expo Go compatible)

import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useHaptics } from '../hooks/useHaptics';

// ═══════════════════════════════════════════════════════════════
// BOTTOM ACTION ZONE
// ═══════════════════════════════════════════════════════════════

export const BottomActionZone = ({
  currentHabit,
  completedCount = 0,
  totalCount = 0,
  onComplete,
  dayComplete,
}) => {
  const { colors, shadows } = useTheme();
  const haptics = useHaptics();

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Subtle pulse animation when zone is active
  useEffect(() => {
    if (!dayComplete && currentHabit) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.02,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [dayComplete, currentHabit]);

  const handlePress = () => {
    // Animate press
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 100,
        useNativeDriver: true,
      }),
    ]).start();

    haptics.celebration();
    onComplete?.(currentHabit?.id);
  };

  // Day complete state
  if (dayComplete) {
    return (
      <View style={[styles.zone, styles.completeZone, { backgroundColor: colors.successLight || '#dcfce7' }]}>
        <View style={styles.completeContent}>
          <Ionicons name="checkmark-circle" size={32} color={colors.success || '#22c55e'} />
          <View style={styles.completeTextWrap}>
            <Text style={[styles.completeTitle, { color: colors.success || '#22c55e' }]}>
              Day complete
            </Text>
            <Text style={[styles.completeMessage, { color: colors.text2 }]}>
              Rest well. You earned it.
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // No habit to show
  if (!currentHabit) {
    return null;
  }

  return (
    <View style={styles.zone}>
      {/* Progress indicator with visual feedback */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressDots]}>
          {Array.from({ length: totalCount }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.progressDot,
                { backgroundColor: i < completedCount ? colors.success : colors.bg3 }
              ]}
            />
          ))}
        </View>
        <Text style={[styles.label, { color: colors.text3 }]}>
          {completedCount} of {totalCount} habits done
        </Text>
      </View>

      {/* Main action button with enhanced visual clarity */}
      <Animated.View style={{ transform: [{ scale: Animated.multiply(scaleAnim, pulseAnim) }] }}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.accent, ...shadows.md }]}
          onPress={handlePress}
          activeOpacity={0.9}
        >
          <View style={styles.buttonContent}>
            <View style={styles.buttonLeft}>
              <View style={styles.checkCircle}>
                <Ionicons name="checkmark" size={18} color={colors.accent} />
              </View>
            </View>
            <View style={styles.buttonCenter}>
              <Text style={styles.habitLabel}>COMPLETE HABIT</Text>
              <Text style={styles.habitName} numberOfLines={2}>
                {currentHabit.name}
              </Text>
            </View>
            <View style={styles.buttonRight}>
              <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.6)" />
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* 2-min hint if available */}
      {currentHabit.twoMinVersion && (
        <View style={[styles.hintContainer, { backgroundColor: colors.bg2 }]}>
          <Ionicons name="sparkles" size={14} color={colors.warning} />
          <Text style={[styles.hint, { color: colors.text2 }]} numberOfLines={2}>
            2-min version: {currentHabit.twoMinVersion}
          </Text>
        </View>
      )}
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════
// COMPACT ACTION ZONE (for inline use)
// ═══════════════════════════════════════════════════════════════

export const CompactActionZone = ({
  currentHabit,
  onComplete,
  onTwoMin,
  poolLevel,
}) => {
  const { colors } = useTheme();
  const haptics = useHaptics();

  if (!currentHabit) return null;

  const showTwoMinPrompt = poolLevel && poolLevel < 40;

  const handleComplete = () => {
    haptics.celebration();
    onComplete?.(currentHabit.id);
  };

  return (
    <View style={[styles.compactZone, { backgroundColor: colors.bg2, borderColor: colors.bg3 }]}>
      {/* Low pool hint */}
      {showTwoMinPrompt && (
        <View style={[styles.lowPoolHint, { backgroundColor: colors.warningLight || '#fef3c7' }]}>
          <Text style={[styles.lowPoolText, { color: colors.warning || '#92400e' }]}>
            Low reserves - try the 2-min version
          </Text>
        </View>
      )}

      <View style={styles.compactContent}>
        <View style={styles.compactInfo}>
          <Text style={[styles.compactLabel, { color: colors.text3 }]}>Next up</Text>
          <Text style={[styles.compactHabit, { color: colors.text }]} numberOfLines={1}>
            {currentHabit.name}
          </Text>
        </View>

        <View style={styles.compactActions}>
          {onTwoMin && (
            <TouchableOpacity
              style={[styles.twoMinBtn, { backgroundColor: colors.bg3 }]}
              onPress={() => onTwoMin(currentHabit.id)}
            >
              <Text style={[styles.twoMinText, { color: colors.text2 }]}>2min</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.compactCompleteBtn, { backgroundColor: colors.accent }]}
            onPress={handleComplete}
          >
            <Ionicons name="checkmark" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  // Main Zone
  zone: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  progressDots: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionButton: {
    minHeight: 76,
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  buttonLeft: {
    marginRight: 12,
  },
  checkCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonCenter: {
    flex: 1,
  },
  habitLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 2,
  },
  habitName: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  buttonRight: {
    marginLeft: 8,
  },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  hint: {
    fontSize: 12,
    flex: 1,
  },

  // Complete state
  completeZone: {
    borderRadius: 16,
    padding: 20,
  },
  completeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  completeTextWrap: {
    flex: 1,
  },
  completeTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  completeMessage: {
    fontSize: 14,
    marginTop: 2,
  },

  // Compact Zone
  compactZone: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  lowPoolHint: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  lowPoolText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  compactContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  compactInfo: {
    flex: 1,
  },
  compactLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  compactHabit: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 2,
  },
  compactActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  twoMinBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  twoMinText: {
    fontSize: 13,
    fontWeight: '600',
  },
  compactCompleteBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default BottomActionZone;
