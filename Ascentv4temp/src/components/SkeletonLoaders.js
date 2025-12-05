// Skeleton Loaders Component
// Premium loading states that don't feel like loading

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { useTheme } from '../hooks/useTheme';

// Base shimmer animation hook
const useShimmer = () => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmer = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    shimmer.start();
    return () => shimmer.stop();
  }, []);

  return shimmerAnim;
};

// Shimmer overlay component
const ShimmerOverlay = ({ style }) => {
  const shimmerAnim = useShimmer();
  const { colors, isDark } = useTheme();

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  });

  return (
    <View style={[styles.shimmerContainer, style]}>
      <Animated.View
        style={[
          styles.shimmer,
          {
            backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.5)',
            transform: [{ translateX }],
          },
        ]}
      />
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════
// HABIT CARD SKELETON
// ═══════════════════════════════════════════════════════════════
export const HabitCardSkeleton = () => {
  const { colors } = useTheme();

  return (
    <View style={[styles.habitCard, { backgroundColor: colors.card }]}>
      <View style={styles.habitRow}>
        {/* Checkbox */}
        <View style={[styles.skeletonCircle, { backgroundColor: colors.bg2 }]}>
          <ShimmerOverlay style={styles.circleOverlay} />
        </View>

        {/* Content */}
        <View style={styles.habitContent}>
          <View style={[styles.skeletonLine, styles.lineWide, { backgroundColor: colors.bg2 }]}>
            <ShimmerOverlay />
          </View>
          <View style={[styles.skeletonLine, styles.lineNarrow, { backgroundColor: colors.bg2 }]}>
            <ShimmerOverlay />
          </View>
        </View>

        {/* Streak badge */}
        <View style={[styles.skeletonBadge, { backgroundColor: colors.bg2 }]}>
          <ShimmerOverlay />
        </View>
      </View>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════
// TASK CARD SKELETON
// ═══════════════════════════════════════════════════════════════
export const TaskCardSkeleton = () => {
  const { colors } = useTheme();

  return (
    <View style={[styles.taskCard, { backgroundColor: colors.card }]}>
      <View style={styles.taskRow}>
        {/* Checkbox */}
        <View style={[styles.skeletonCircle, { backgroundColor: colors.bg2 }]}>
          <ShimmerOverlay style={styles.circleOverlay} />
        </View>

        {/* Content */}
        <View style={styles.taskContent}>
          <View style={[styles.skeletonLine, styles.lineWide, { backgroundColor: colors.bg2 }]}>
            <ShimmerOverlay />
          </View>
          <View style={[styles.skeletonLine, styles.lineMedium, { backgroundColor: colors.bg2, marginTop: 8 }]}>
            <ShimmerOverlay />
          </View>
        </View>
      </View>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════
// POOL VESSEL SKELETON
// ═══════════════════════════════════════════════════════════════
export const PoolVesselSkeleton = () => {
  const { colors } = useTheme();

  return (
    <View style={[styles.poolCard, { backgroundColor: colors.card }]}>
      <View style={styles.poolRow}>
        {/* Vessel */}
        <View style={[styles.skeletonVessel, { backgroundColor: colors.bg2 }]}>
          <ShimmerOverlay />
        </View>

        {/* Info */}
        <View style={styles.poolContent}>
          <View style={[styles.skeletonLine, styles.lineMedium, { backgroundColor: colors.bg2 }]}>
            <ShimmerOverlay />
          </View>
          <View style={[styles.skeletonLine, styles.lineWide, { backgroundColor: colors.bg2, marginTop: 8 }]}>
            <ShimmerOverlay />
          </View>
        </View>
      </View>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════
// COACH THINKING SKELETON
// ═══════════════════════════════════════════════════════════════
export const CoachThinkingSkeleton = () => {
  const { colors } = useTheme();
  const pulseAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.5,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  return (
    <View style={styles.coachBubble}>
      <View style={[styles.coachAvatar, { backgroundColor: colors.purpleLight }]}>
        <ShimmerOverlay style={styles.circleOverlay} />
      </View>
      <View style={[styles.thinkingBubble, { backgroundColor: colors.card }]}>
        <View style={styles.thinkingDots}>
          <Animated.View
            style={[styles.thinkingDot, { backgroundColor: colors.text3, opacity: pulseAnim }]}
          />
          <Animated.View
            style={[
              styles.thinkingDot,
              { backgroundColor: colors.text3, opacity: pulseAnim, transform: [{ scale: pulseAnim }] },
            ]}
          />
          <Animated.View
            style={[styles.thinkingDot, { backgroundColor: colors.text3, opacity: pulseAnim }]}
          />
        </View>
      </View>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════
// GENERIC LIST SKELETON
// ═══════════════════════════════════════════════════════════════
export const ListSkeleton = ({ count = 3, type = 'habit' }) => {
  const items = Array(count).fill(0);

  return (
    <View>
      {items.map((_, i) => (
        type === 'habit' ? (
          <HabitCardSkeleton key={i} />
        ) : (
          <TaskCardSkeleton key={i} />
        )
      ))}
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════
// STATS CARD SKELETON
// ═══════════════════════════════════════════════════════════════
export const StatsCardSkeleton = () => {
  const { colors } = useTheme();

  return (
    <View style={[styles.statsCard, { backgroundColor: colors.card }]}>
      <View style={[styles.skeletonStatNumber, { backgroundColor: colors.bg2 }]}>
        <ShimmerOverlay />
      </View>
      <View style={[styles.skeletonLine, styles.lineNarrow, { backgroundColor: colors.bg2, marginTop: 8 }]}>
        <ShimmerOverlay />
      </View>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  shimmerContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    borderRadius: 8,
  },
  shimmer: {
    width: 200,
    height: '100%',
    position: 'absolute',
  },
  circleOverlay: {
    borderRadius: 50,
  },

  // Habit Card
  habitCard: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  habitContent: {
    flex: 1,
    gap: 6,
  },

  // Task Card
  taskCard: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  taskContent: {
    flex: 1,
  },

  // Pool Card
  poolCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  poolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  poolContent: {
    flex: 1,
  },

  // Skeleton elements
  skeletonCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    overflow: 'hidden',
  },
  skeletonVessel: {
    width: 60,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
  },
  skeletonLine: {
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
  },
  lineWide: {
    width: '80%',
  },
  lineMedium: {
    width: '50%',
  },
  lineNarrow: {
    width: '30%',
  },
  skeletonBadge: {
    width: 40,
    height: 24,
    borderRadius: 8,
    overflow: 'hidden',
  },

  // Coach thinking
  coachBubble: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  coachAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    overflow: 'hidden',
  },
  thinkingBubble: {
    borderRadius: 16,
    padding: 12,
    paddingHorizontal: 16,
  },
  thinkingDots: {
    flexDirection: 'row',
    gap: 4,
  },
  thinkingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // Stats
  statsCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  skeletonStatNumber: {
    width: 48,
    height: 28,
    borderRadius: 6,
    overflow: 'hidden',
  },
});

export default {
  HabitCardSkeleton,
  TaskCardSkeleton,
  PoolVesselSkeleton,
  CoachThinkingSkeleton,
  ListSkeleton,
  StatsCardSkeleton,
};
