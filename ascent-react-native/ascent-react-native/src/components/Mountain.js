import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, {
  Defs, LinearGradient, Stop, Rect, Polygon, Path,
  Circle, G, Line, Text as SvgText
} from 'react-native-svg';
import { colors, radius, MILESTONES, MAX_STREAK_DAYS } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

// Path points following the left edge up to summit (matching HTML exactly)
const PATH_POINTS = [
  { x: 30, y: 165 },   // Start (base camp)
  { x: 45, y: 140 },   // Day ~10
  { x: 60, y: 115 },   // Day ~20
  { x: 85, y: 95 },    // Day ~30
  { x: 110, y: 70 },   // Day ~40
  { x: 135, y: 45 },   // Day ~50
  { x: 150, y: 22 },   // Summit (Day 60)
];

const getPositionAtProgress = (progress) => {
  if (progress <= 0) return PATH_POINTS[0];
  if (progress >= 1) return PATH_POINTS[PATH_POINTS.length - 1];
  
  const totalSegments = PATH_POINTS.length - 1;
  const segmentProgress = progress * totalSegments;
  const segmentIndex = Math.floor(segmentProgress);
  const segmentFraction = segmentProgress - segmentIndex;
  
  const start = PATH_POINTS[segmentIndex];
  const end = PATH_POINTS[Math.min(segmentIndex + 1, PATH_POINTS.length - 1)];
  
  return {
    x: start.x + (end.x - start.x) * segmentFraction,
    y: start.y + (end.y - start.y) * segmentFraction,
  };
};

export default function Mountain({ streak = 0, goal = 'Your Goal', onInfoPress }) {
  const pct = Math.min(streak / MAX_STREAK_DAYS, 1);
  const climberPos = getPositionAtProgress(pct);
  
  // Build full path string
  const fullPathD = `M ${PATH_POINTS.map(p => `${p.x},${p.y}`).join(' L ')}`;
  
  // Build walked path
  const walkedPoints = [];
  for (let i = 0; i < PATH_POINTS.length; i++) {
    const pointProgress = i / (PATH_POINTS.length - 1);
    if (pointProgress <= pct) {
      walkedPoints.push(PATH_POINTS[i]);
    } else {
      break;
    }
  }
  walkedPoints.push(climberPos);
  const walkedPathD = walkedPoints.length > 0 
    ? `M ${walkedPoints.map(p => `${p.x},${p.y}`).join(' L ')}`
    : '';
  
  // Calculate camp positions
  const camps = MILESTONES.map((m, i) => ({
    ...m,
    pos: getPositionAtProgress(m.day / MAX_STREAK_DAYS),
    unlocked: streak >= m.day,
    current: streak >= m.day && (i === MILESTONES.length - 1 || streak < MILESTONES[i + 1].day),
  }));
  
  const summitPos = PATH_POINTS[PATH_POINTS.length - 1];
  
  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🏔️ Your Ascent</Text>
        <View style={styles.headerRight}>
          <Text style={styles.progressText}>Day {streak} of {MAX_STREAK_DAYS}</Text>
          <TouchableOpacity style={styles.infoBtn} onPress={onInfoPress}>
            <Ionicons name="information-circle-outline" size={18} color={colors.text3} />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Mountain SVG */}
      <View style={styles.visual}>
        <Svg width="100%" height="180" viewBox="0 0 300 180">
          <Defs>
            <LinearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#dbeafe" />
              <Stop offset="100%" stopColor="#eff6ff" />
            </LinearGradient>
            <LinearGradient id="mtGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#475569" />
              <Stop offset="50%" stopColor="#64748b" />
              <Stop offset="100%" stopColor="#94a3b8" />
            </LinearGradient>
            <LinearGradient id="mtGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#64748b" />
              <Stop offset="100%" stopColor="#cbd5e1" />
            </LinearGradient>
          </Defs>
          
          {/* Sky */}
          <Rect fill="url(#skyGrad)" width="300" height="180" />
          
          {/* Background mountains */}
          <Polygon fill="#cbd5e1" points="180,180 230,80 280,120 300,100 300,180" />
          <Polygon fill="#e2e8f0" points="220,180 260,110 300,140 300,180" />
          
          {/* Main mountain */}
          <Polygon fill="url(#mtGrad)" points="0,180 30,165 60,140 90,120 120,90 150,22 180,70 210,180" />
          
          {/* Snow cap */}
          <Polygon fill="#f8fafc" points="138,40 150,22 162,40 155,38 150,42 145,38" />
          
          {/* Ridge detail */}
          <Path d="M30,165 Q60,150 90,120 T150,22" fill="none" stroke="#334155" strokeWidth="1" opacity="0.3" />
          
          {/* Full path (dashed trail) */}
          <Path d={fullPathD} fill="none" stroke="#fed7aa" strokeWidth="3" strokeDasharray="6,4" strokeLinecap="round" />
          
          {/* Walked path (solid orange) */}
          {pct > 0 && (
            <Path d={walkedPathD} fill="none" stroke="#f97316" strokeWidth="3" strokeLinecap="round" />
          )}
          
          {/* Milestone markers */}
          {camps.map((c, i) => (
            <G key={i}>
              <Circle
                cx={c.pos.x}
                cy={c.pos.y}
                r={5}
                fill={c.unlocked ? '#22c55e' : '#e2e8f0'}
                stroke="#fff"
                strokeWidth={2}
              />
            </G>
          ))}
          
          {/* Summit flag */}
          <G>
            <Line x1={summitPos.x} y1={summitPos.y - 5} x2={summitPos.x} y2={summitPos.y - 25} stroke="#eab308" strokeWidth={2} />
            <Polygon points={`${summitPos.x},${summitPos.y - 25} ${summitPos.x + 15},${summitPos.y - 20} ${summitPos.x},${summitPos.y - 15}`} fill="#eab308" />
          </G>
          
          {/* Climber icon */}
          <G>
            <Circle cx={climberPos.x} cy={climberPos.y} r={10} fill={colors.accent} stroke="#fff" strokeWidth={2} />
            <SvgText x={climberPos.x} y={climberPos.y + 4} textAnchor="middle" fontSize="11">🧗</SvgText>
          </G>
          
          {/* Start label */}
          <SvgText x={PATH_POINTS[0].x} y={PATH_POINTS[0].y + 14} textAnchor="middle" fontSize="8" fontWeight="600" fill="#64748b">Start</SvgText>
        </Svg>
      </View>
      
      {/* Goal display */}
      <View style={styles.goalBox}>
        <Text style={styles.goalLabel}>🎯 Your Goal</Text>
        <Text style={styles.goalText}>{goal}</Text>
      </View>
      
      {/* Milestone legend */}
      <View style={styles.legend}>
        {camps.map((c, i) => (
          <View key={i} style={styles.camp}>
            <View style={[
              styles.campIcon,
              c.unlocked && styles.campIconUnlocked,
              c.current && styles.campIconCurrent,
            ]}>
              <Text style={{ fontSize: 10 }}>{c.icon}</Text>
            </View>
            <Text style={[styles.campName, c.unlocked && styles.campNameUnlocked]}>{c.name}</Text>
            <Text style={styles.campDay}>Day {c.day}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    padding: 20,
    marginBottom: 20,
    overflow: 'hidden',
    backgroundColor: '#e0f2fe', // Gradient approximation
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  progressText: {
    fontSize: 12,
    color: colors.text3,
  },
  infoBtn: {
    padding: 4,
  },
  visual: {
    height: 180,
  },
  goalBox: {
    backgroundColor: colors.accentLight,
    borderRadius: radius.md,
    padding: 14,
    marginTop: 12,
  },
  goalLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.accent,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  goalText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 20,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.bg3,
  },
  camp: {
    alignItems: 'center',
    flex: 1,
  },
  campIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.bg3,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  campIconUnlocked: {
    backgroundColor: colors.success,
  },
  campIconCurrent: {
    backgroundColor: colors.accent,
  },
  campName: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text3,
  },
  campNameUnlocked: {
    color: colors.text,
  },
  campDay: {
    fontSize: 9,
    color: colors.text3,
  },
});
