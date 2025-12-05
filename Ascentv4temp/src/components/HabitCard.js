import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { shadows, spacing, radius } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import * as Haptics from 'expo-haptics';

const HabitCard = ({
  habit,
  isDone,
  streak,
  onComplete,
  onUncomplete,
  onGetTwoMin,
  twoMinData,
  isLoadingTwoMin,
}) => {
  const { colors, isDark } = useTheme();

  // Animations
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const checkScaleAnim = useRef(new Animated.Value(isDone ? 1 : 0)).current;
  const celebrateAnim = useRef(new Animated.Value(0)).current;
  const shineAnim = useRef(new Animated.Value(0)).current;

  // Celebrate animation when completing
  useEffect(() => {
    if (isDone) {
      Animated.parallel([
        // Check bounces in
        Animated.spring(checkScaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 400,
          useNativeDriver: true,
        }),
        // Card scale pulse
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.02,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
        ]),
        // Celebration burst
        Animated.sequence([
          Animated.timing(celebrateAnim, {
            toValue: 1,
            duration: 300,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
          }),
          Animated.timing(celebrateAnim, {
            toValue: 0,
            duration: 400,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: false,
          }),
        ]),
        // Shine effect
        Animated.timing(shineAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.timing(checkScaleAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
      shineAnim.setValue(0);
    }
  }, [isDone]);

  const handlePress = () => {
    if (isDone) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onUncomplete(habit.id);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onComplete(habit.id);
    }
  };

  // Interpolations
  const celebrateOpacity = celebrateAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.3, 0],
  });

  const celebrateScale = celebrateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 2],
  });

  const shineTranslate = shineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 400],
  });

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
      <View style={[styles.card, { backgroundColor: isDone ? (colors.successLight || 'rgba(16, 185, 129, 0.1)') : colors.card }]}>
        {/* Celebration burst */}
        <Animated.View
          style={[
            styles.celebrateBurst,
            {
              backgroundColor: colors.success || colors.accent,
              opacity: celebrateOpacity,
              transform: [{ scale: celebrateScale }],
            },
          ]}
        />

        {/* Shine effect on completion */}
        {isDone && (
          <Animated.View
            style={[
              styles.shineEffect,
              {
                transform: [{ translateX: shineTranslate }],
              },
            ]}
          />
        )}

        <TouchableOpacity
          style={[
            styles.check,
            {
              backgroundColor: isDone ? (colors.success || colors.accent) : 'transparent',
              borderColor: isDone ? (colors.success || colors.accent) : colors.border,
            },
          ]}
          onPress={handlePress}
          activeOpacity={0.7}
        >
          <Animated.View style={{ transform: [{ scale: checkScaleAnim }] }}>
            {isDone && <Ionicons name="checkmark" size={18} color="#fff" />}
          </Animated.View>
        </TouchableOpacity>

        <View style={styles.info}>
          <Text style={[styles.name, { color: isDone ? colors.text3 : colors.text }, isDone && styles.nameDone]}>
            {habit.name}
          </Text>
          <Text style={[styles.meta, { color: colors.text3 }]}>{habit.goalAmount} {habit.unit}</Text>
        </View>

        {streak > 0 && (
          <View style={[styles.streak, { backgroundColor: colors.warningLight || 'rgba(251, 191, 36, 0.15)' }]}>
            <Ionicons name="flame" size={14} color={colors.warning} />
            <Text style={[styles.streakText, { color: colors.warning }]}>{streak}</Text>
          </View>
        )}

        {!isDone && (
          <TouchableOpacity
            style={[styles.twoMinBtn, { backgroundColor: colors.bg2 }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onGetTwoMin(habit);
            }}
            disabled={isLoadingTwoMin}
          >
            {isLoadingTwoMin ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : (
              <Ionicons name="sparkles" size={16} color={colors.accent} />
            )}
          </TouchableOpacity>
        )}

        {isDone && (
          <View style={[styles.completedBadge, { backgroundColor: colors.success || colors.accent }]}>
            <Ionicons name="checkmark-circle" size={12} color="#fff" />
          </View>
        )}
      </View>

      {twoMinData && (
        <View style={[styles.twoMinPopup, { backgroundColor: colors.warningLight || 'rgba(251, 191, 36, 0.15)', borderColor: colors.warning }]}>
          <View style={styles.twoMinBadge}>
            <Ionicons name="sparkles" size={12} color={colors.warning} />
            <Text style={[styles.twoMinBadgeText, { color: colors.warning }]}>2-MINUTE VERSION</Text>
          </View>
          <Text style={[styles.twoMinText, { color: colors.text }]}>{twoMinData.twoMinuteVersion}</Text>
          <Text style={[styles.twoMinWhy, { color: colors.text2 }]}>{twoMinData.whyThisWorks}</Text>
          <View style={styles.twoMinActions}>
            <TouchableOpacity
              style={[styles.twoMinBtn2, styles.twoMinBtnPrimary, { backgroundColor: colors.accent }]}
              onPress={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                handlePress();
              }}
            >
              <Ionicons name="checkmark" size={16} color="#fff" style={{ marginRight: 4 }} />
              <Text style={styles.twoMinBtnTextPrimary}>Did It!</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.twoMinBtn2, { backgroundColor: colors.card }]}
              onPress={() => onGetTwoMin(null)}
            >
              <Text style={[styles.twoMinBtnText, { color: colors.text2 }]}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.lg,
    ...shadows.sm,
    overflow: 'hidden',
  },
  celebrateBurst: {
    position: 'absolute',
    left: 20,
    top: '50%',
    width: 30,
    height: 30,
    marginTop: -15,
    borderRadius: 15,
  },
  shineEffect: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    transform: [{ skewX: '-20deg' }],
  },
  check: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    marginLeft: spacing.md,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  nameDone: {
    textDecorationLine: 'line-through',
  },
  meta: {
    fontSize: 13,
  },
  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    marginRight: spacing.sm,
  },
  streakText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  twoMinBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  twoMinPopup: {
    borderWidth: 2,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  twoMinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  twoMinBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginLeft: 4,
  },
  twoMinText: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: spacing.sm,
    lineHeight: 22,
  },
  twoMinWhy: {
    fontSize: 13,
    fontStyle: 'italic',
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  twoMinActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  twoMinBtn2: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  twoMinBtnPrimary: {
    flex: 1,
    justifyContent: 'center',
  },
  twoMinBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  twoMinBtnTextPrimary: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});

export default HabitCard;
