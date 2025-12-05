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
  const circumference = 2 * Math.PI * 28;
  const ringOffset = circumference - (progress / 100) * circumference;
  const isComplete = progress === 100;
  
  return (
    <View style={styles.container}>
      {/* Compact Ring */}
      <View style={styles.ring}>
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
          <Text style={styles.percent}>{progress}%</Text>
        </View>
      </View>
      
      {/* Compact Info */}
      <View style={styles.info}>
        <Text style={styles.label}>
          {isComplete ? '🎉 Done!' : 'Today'}
        </Text>
        <Text style={styles.stats}>
          {completedItems}/{totalItems} • 🔥 {streak}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...shadows.sm,
  },
  ring: {
    width: 70,
    height: 70,
    position: 'relative',
  },
  center: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  percent: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  info: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  stats: {
    fontSize: 12,
    color: colors.text3,
    marginTop: 2,
  },
});
