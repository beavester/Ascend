import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors, radius, shadows } from '../constants/theme';

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function Heatmap({ habits = [], completions = [] }) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  // Build calendar cells
  const cells = [];
  
  // Empty cells for days before month starts
  for (let i = 0; i < firstDay; i++) {
    cells.push({ empty: true, key: `empty-${i}` });
  }
  
  // Cells for each day
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day);
    const dateStr = d.toDateString();
    const isToday = dateStr === today.toDateString();
    const isFuture = d > today;
    
    // Calculate completion for this day
    const dayCompletions = completions.filter(
      c => new Date(c.date).toDateString() === dateStr && c.completed
    );
    const total = habits.length || 1;
    const done = new Set(dayCompletions.map(c => c.odHabitId)).size;
    const pct = Math.round((done / total) * 100);
    const isComplete = pct >= 100;
    
    cells.push({
      day,
      date: d,
      dateStr: `${month + 1}/${day.toString().padStart(2, '0')}`,
      isToday,
      isFuture,
      pct,
      done,
      total,
      isComplete,
      key: `day-${day}`,
    });
  }
  
  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{MONTHS[month]} {year}</Text>
        <Text style={styles.legend}>Ring = % complete</Text>
      </View>
      
      {/* Days header */}
      <View style={styles.daysHeader}>
        {DAYS.map((day, i) => (
          <Text key={i} style={styles.dayLabel}>{day}</Text>
        ))}
      </View>
      
      {/* Calendar grid */}
      <View style={styles.grid}>
        {cells.map((cell) => {
          if (cell.empty) {
            return <View key={cell.key} style={styles.cell} />;
          }
          
          // Ring math
          const circumference = 2 * Math.PI * 16;
          const offset = circumference - (cell.pct / 100) * circumference;
          
          return (
            <View 
              key={cell.key} 
              style={[
                styles.cell,
                cell.isToday && styles.cellToday,
              ]}
            >
              <View style={styles.cellRing}>
                <Svg width={40} height={40} viewBox="0 0 40 40">
                  {/* Background ring */}
                  <Circle
                    cx={20}
                    cy={20}
                    r={16}
                    fill="none"
                    stroke={cell.isFuture ? colors.bg2 : colors.bg3}
                    strokeWidth={3}
                    opacity={cell.isFuture ? 0.5 : 1}
                  />
                  {/* Progress ring */}
                  {!cell.isFuture && (
                    <Circle
                      cx={20}
                      cy={20}
                      r={16}
                      fill="none"
                      stroke={colors.success}
                      strokeWidth={3}
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={offset}
                      transform="rotate(-90 20 20)"
                    />
                  )}
                </Svg>
              </View>
              <Text style={[
                styles.cellDate,
                cell.isToday && styles.cellDateToday,
                cell.isComplete && styles.cellDateComplete,
              ]}>
                {cell.dateStr}
              </Text>
            </View>
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
    fontSize: 10,
    color: colors.text3,
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
  },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
  },
  cellToday: {
    backgroundColor: colors.accentLight,
    borderRadius: 8,
  },
  cellRing: {
    position: 'absolute',
    width: 40,
    height: 40,
  },
  cellDate: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.text2,
  },
  cellDateToday: {
    color: colors.accent,
  },
  cellDateComplete: {
    color: colors.success,
  },
});
