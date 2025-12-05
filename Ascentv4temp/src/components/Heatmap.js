import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable, Animated } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../hooks/useTheme';

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Animated cell component for staggered entrance (standard Animated API)
function AnimatedCell({ cell, index, colors, onPress }) {
  const opacity = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    // Staggered entrance animation - 15ms delay between cells
    const delay = Math.min(index * 15, 600); // Cap at 600ms total
    setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }, delay);
  }, []);
  
  if (cell.empty) {
    return <View style={styles.cell} />;
  }
  
  // Ring math
  const circumference = 2 * Math.PI * 16;
  const offset = circumference - (cell.pct / 100) * circumference;
  
  return (
    <Animated.View style={{ opacity }}>
      <TouchableOpacity 
        style={[
          styles.cell,
          cell.isToday && { backgroundColor: colors.accentLight, borderRadius: 8 },
        ]}
        onPress={() => onPress(cell)}
        activeOpacity={0.7}
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
            {!cell.isFuture && cell.pct > 0 && (
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
          { color: colors.text2 },
          cell.isToday && { color: colors.accent },
          cell.isComplete && { color: colors.success },
        ]}>
          {cell.dateStr}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// Tooltip component
function Tooltip({ cell, visible, onClose, colors }) {
  if (!visible || !cell) return null;
  
  const dateObj = cell.date;
  const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dateObj.getDay()];
  const monthName = MONTHS[dateObj.getMonth()];
  const dayNum = dateObj.getDate();
  
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.tooltipOverlay} onPress={onClose}>
        <Animated.View 
          entering={FadeIn.duration(200)}
          style={[styles.tooltip, { backgroundColor: colors.card }]}
        >
          <Text style={[styles.tooltipDate, { color: colors.text }]}>
            {dayName}, {monthName} {dayNum}
          </Text>
          <Text style={[styles.tooltipStats, { color: colors.text2 }]}>
            {cell.done} of {cell.total} habits completed
          </Text>
          {cell.pct > 0 && (
            <View style={[styles.tooltipBar, { backgroundColor: colors.bg3 }]}>
              <View 
                style={[
                  styles.tooltipProgress, 
                  { 
                    backgroundColor: cell.isComplete ? colors.success : colors.accent,
                    width: `${cell.pct}%` 
                  }
                ]} 
              />
            </View>
          )}
          <Text style={[styles.tooltipHint, { color: colors.text3 }]}>
            Tap anywhere to close
          </Text>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

export default function Heatmap({ habits = [], completions = [] }) {
  const { colors, shadows } = useTheme();
  const [selectedCell, setSelectedCell] = useState(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  
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
  
  const handleCellPress = (cell) => {
    if (cell.isFuture) return;
    
    Haptics.selectionAsync();
    setSelectedCell(cell);
    setTooltipVisible(true);
  };
  
  const handleCloseTooltip = () => {
    setTooltipVisible(false);
    setSelectedCell(null);
  };
  
  return (
    <View style={[styles.card, { backgroundColor: colors.card, ...shadows.sm }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>{MONTHS[month]} {year}</Text>
        <Text style={[styles.legend, { color: colors.text3 }]}>Tap for details</Text>
      </View>
      
      {/* Days header */}
      <View style={styles.daysHeader}>
        {DAYS.map((day, i) => (
          <Text key={i} style={[styles.dayLabel, { color: colors.text3 }]}>{day}</Text>
        ))}
      </View>
      
      {/* Calendar grid */}
      <View style={styles.grid}>
        {cells.map((cell, index) => (
          <AnimatedCell 
            key={cell.key}
            cell={cell}
            index={index}
            colors={colors}
            onPress={handleCellPress}
          />
        ))}
      </View>
      
      {/* Tooltip */}
      <Tooltip 
        cell={selectedCell}
        visible={tooltipVisible}
        onClose={handleCloseTooltip}
        colors={colors}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
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
  },
  legend: {
    fontSize: 10,
  },
  daysHeader: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  dayLabel: {
    flex: 1,
    fontSize: 10,
    fontWeight: '600',
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
  cellRing: {
    position: 'absolute',
    width: 40,
    height: 40,
  },
  cellDate: {
    fontSize: 9,
    fontWeight: '700',
  },
  // Tooltip styles
  tooltipOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  tooltip: {
    borderRadius: 16,
    padding: 20,
    minWidth: 200,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  tooltipDate: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  tooltipStats: {
    fontSize: 14,
    marginBottom: 12,
  },
  tooltipBar: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    marginBottom: 12,
    overflow: 'hidden',
  },
  tooltipProgress: {
    height: '100%',
    borderRadius: 3,
  },
  tooltipHint: {
    fontSize: 11,
    fontStyle: 'italic',
  },
});
