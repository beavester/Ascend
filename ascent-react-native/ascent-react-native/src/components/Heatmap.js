import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, shadows } from '../constants/theme';

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const LEVEL_COLORS = [
  colors.heatmap0,
  colors.heatmap25,
  colors.heatmap50,
  colors.heatmap75,
  colors.heatmap100,
];

export default function Heatmap({ data = [] }) {
  // Pad to 35 days (5 weeks)
  const paddedData = [...data];
  while (paddedData.length < 35) {
    paddedData.unshift({ level: -1, date: null }); // Empty cells
  }
  
  const today = new Date().toDateString();
  
  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Activity</Text>
        <View style={styles.legend}>
          <Text style={styles.legendText}>Less</Text>
          {LEVEL_COLORS.map((color, i) => (
            <View key={i} style={[styles.legendBox, { backgroundColor: color }]} />
          ))}
          <Text style={styles.legendText}>More</Text>
        </View>
      </View>
      
      {/* Days header */}
      <View style={styles.daysHeader}>
        {DAYS.map((day, i) => (
          <Text key={i} style={styles.dayLabel}>{day}</Text>
        ))}
      </View>
      
      {/* Grid */}
      <View style={styles.grid}>
        {paddedData.map((item, i) => {
          const isToday = item.date && new Date(item.date).toDateString() === today;
          const isEmpty = item.level === -1;
          const isFuture = item.date && new Date(item.date) > new Date();
          
          return (
            <View
              key={i}
              style={[
                styles.cell,
                isEmpty && styles.cellEmpty,
                isFuture && styles.cellFuture,
                !isEmpty && !isFuture && { backgroundColor: LEVEL_COLORS[item.level] || LEVEL_COLORS[0] },
                isToday && styles.cellToday,
              ]}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 20,
    ...shadows.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendText: {
    fontSize: 10,
    color: colors.text3,
  },
  legendBox: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  daysHeader: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  dayLabel: {
    flex: 1,
    fontSize: 10,
    fontWeight: '600',
    color: colors.text3,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  cell: {
    width: `${(100 - 6 * 1.5) / 7}%`,
    aspectRatio: 1,
    borderRadius: 3,
    backgroundColor: colors.heatmap0,
  },
  cellEmpty: {
    backgroundColor: 'transparent',
  },
  cellFuture: {
    backgroundColor: colors.bg2,
    opacity: 0.5,
  },
  cellToday: {
    borderWidth: 2,
    borderColor: colors.accent,
  },
});
