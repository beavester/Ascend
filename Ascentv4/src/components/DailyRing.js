import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../hooks/useTheme';
import { radius } from '../constants/theme';

export default function DailyRing({ 
  progress = 0, 
  completedItems = 0, 
  totalItems = 0, 
  streak = 0 
}) {
  const { colors, shadows, getStreakColor } = useTheme();
  const prevProgress = useRef(progress);
  
  // Animation values
  const ringScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);
  
  const circumference = 2 * Math.PI * 28;
  const ringOffset = circumference - (progress / 100) * circumference;
  const isComplete = progress === 100;
  
  // Streak color based on depth
  const streakColor = getStreakColor(streak);
  
  // Pulse animation when ring completes
  useEffect(() => {
    const wasComplete = prevProgress.current === 100;
    const nowComplete = progress === 100;
    
    if (nowComplete && !wasComplete) {
      // Ring just completed - subtle pulse + haptic
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      ringScale.value = withSequence(
        withSpring(1.08, { damping: 8 }),
        withSpring(1, { damping: 12 })
      );
      
      // Subtle glow effect
      glowOpacity.value = withSequence(
        withTiming(0.6, { duration: 200 }),
        withTiming(0, { duration: 600 })
      );
    }
    
    prevProgress.current = progress;
  }, [progress]);
  
  const ringAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
  }));
  
  const glowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));
  
  return (
    <View style={[styles.container, { backgroundColor: colors.card, ...shadows.sm }]}>
      {/* Animated Ring */}
      <Animated.View style={[styles.ring, ringAnimatedStyle]}>
        {/* Glow effect (only visible briefly on completion) */}
        <Animated.View style={[styles.glow, { backgroundColor: colors.success }, glowAnimatedStyle]} />
        
        <Svg width={70} height={70} viewBox="0 0 70 70">
          {/* Background ring */}
          <Circle
            cx={35}
            cy={35}
            r={28}
            fill="none"
            stroke={colors.ringEmpty}
            strokeWidth={6}
          />
          {/* Progress ring */}
          <Circle
            cx={35}
            cy={35}
            r={28}
            fill="none"
            stroke={isComplete ? colors.ringComplete : colors.ringProgress}
            strokeWidth={6}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={ringOffset}
            transform="rotate(-90 35 35)"
          />
        </Svg>
        
        {/* Center content */}
        <View style={styles.center}>
          <Text style={[styles.percent, { color: colors.text }]}>{progress}%</Text>
        </View>
      </Animated.View>
      
      {/* Info - identity-based framing */}
      <View style={styles.info}>
        <Text style={[styles.label, { color: colors.text }]}>
          {isComplete ? 'Done for today' : 'Today'}
        </Text>
        <Text style={[styles.stats, { color: colors.text3 }]}>
          {completedItems}/{totalItems} completed
        </Text>
        {streak > 0 && (
          <Text style={[styles.streak, { color: streakColor }]}>
            {streak} {streak === 1 ? 'day' : 'days'} showing up
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ring: {
    width: 70,
    height: 70,
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  center: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  percent: {
    fontSize: 16,
    fontWeight: '800',
  },
  info: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  stats: {
    fontSize: 12,
    marginTop: 2,
  },
  streak: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
});
