import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors, radius, shadows } from '../constants/theme';

export default function DailyRing({ 
  progress = 0, 
  completedItems = 0, 
  totalItems = 0, 
  streak = 0 
}) {
  const circumference = 2 * Math.PI * 52;
  const ringOffset = circumference - (progress / 100) * circumference;
  const isComplete = progress === 100;
  
  return (
    <View style={styles.container}>
      {/* Ring */}
      <View style={styles.ring}>
        <Svg width={120} height={120} viewBox="0 0 120 120" style={styles.svg}>
          {/* Background ring */}
          <Circle
            cx={60}
            cy={60}
            r={52}
            fill="none"
            stroke={colors.ringEmpty}
            strokeWidth={10}
          />
          {/* Progress ring */}
          <Circle
            cx={60}
            cy={60}
            r={52}
            fill="none"
            stroke={isComplete ? colors.ringComplete : colors.ringProgress}
            strokeWidth={10}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={ringOffset}
            transform="rotate(-90 60 60)"
          />
        </Svg>
        {/* Center content */}
        <View style={styles.center}>
          <Text style={styles.percent}>{progress}%</Text>
          <Text style={styles.label}>Today</Text>
        </View>
      </View>
      
      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.title}>
          {isComplete ? '🎉 Ring Closed!' : 'Close Your Ring'}
        </Text>
        <Text style={styles.subtitle}>
          {isComplete ? 'Amazing work today!' : 'Complete all tasks & habits'}
        </Text>
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statText}>
              <Text style={styles.statBold}>{completedItems}</Text>/{totalItems} done
            </Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statText}>
              🔥 <Text style={styles.statBold}>{streak}</Text> day streak
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 24,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    ...shadows.sm,
  },
  ring: {
    width: 120,
    height: 120,
    position: 'relative',
  },
  svg: {
    transform: [{ rotate: '0deg' }],
  },
  center: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  percent: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text3,
    textTransform: 'uppercase',
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: colors.text3,
    lineHeight: 18,
  },
  stats: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 13,
    color: colors.text2,
  },
  statBold: {
    fontWeight: '700',
  },
});
