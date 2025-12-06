import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { 
  Defs, 
  LinearGradient, 
  Stop, 
  Rect, 
  Polygon, 
  Path, 
  Circle, 
  G, 
  Line,
  Text as SvgText 
} from 'react-native-svg';
import { Info } from 'lucide-react-native';
import { lightColors as colors, radius as borderRadius, shadows } from '../constants/theme';
import { MILESTONES, MAX_STREAK_DAYS } from '../constants/milestones';

const MountainView = ({ streakDays, goal, onInfoPress }) => {
  const pct = Math.min(streakDays / MAX_STREAK_DAYS, 1);

  // Mountain edge path points
  const pathPoints = [
    { x: 30, y: 165 },   // Start
    { x: 45, y: 140 },   // Day ~10
    { x: 60, y: 115 },   // Day ~20
    { x: 85, y: 95 },    // Day ~30
    { x: 110, y: 70 },   // Day ~40
    { x: 135, y: 45 },   // Day ~50
    { x: 150, y: 22 },   // Summit
  ];

  const getPositionAtProgress = (progress) => {
    if (progress <= 0) return pathPoints[0];
    if (progress >= 1) return pathPoints[pathPoints.length - 1];

    const totalSegments = pathPoints.length - 1;
    const segmentProgress = progress * totalSegments;
    const segmentIndex = Math.floor(segmentProgress);
    const segmentFraction = segmentProgress - segmentIndex;

    const start = pathPoints[segmentIndex];
    const end = pathPoints[Math.min(segmentIndex + 1, pathPoints.length - 1)];

    return {
      x: start.x + (end.x - start.x) * segmentFraction,
      y: start.y + (end.y - start.y) * segmentFraction,
    };
  };

  const fullPathD = `M ${pathPoints.map(p => `${p.x},${p.y}`).join(' L ')}`;

  // Build walked path
  const climberPos = getPositionAtProgress(pct);
  const walkedPoints = [];
  for (let i = 0; i < pathPoints.length; i++) {
    const pointProgress = i / (pathPoints.length - 1);
    if (pointProgress <= pct) {
      walkedPoints.push(pathPoints[i]);
    } else {
      break;
    }
  }
  walkedPoints.push(climberPos);
  const walkedPathD = walkedPoints.length > 0 
    ? `M ${walkedPoints.map(p => `${p.x},${p.y}`).join(' L ')}` 
    : '';

  const getMilestonePos = (day) => getPositionAtProgress(day / MAX_STREAK_DAYS);

  const camps = MILESTONES.map((m, i) => ({
    ...m,
    pos: getMilestonePos(m.day),
    unlocked: streakDays >= m.day,
    current: streakDays >= m.day && (i === MILESTONES.length - 1 || streakDays < MILESTONES[i + 1].day),
  }));

  const summitPos = pathPoints[pathPoints.length - 1];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🏔️ Your Ascent</Text>
        <View style={styles.headerRight}>
          <Text style={styles.progress}>Day {streakDays} of {MAX_STREAK_DAYS}</Text>
          <TouchableOpacity onPress={onInfoPress} style={styles.infoBtn}>
            <Info size={14} color={colors.text3} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.svgContainer}>
        <Svg viewBox="0 0 300 180" style={styles.svg}>
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

          {/* Full path (dashed) */}
          <Path
            d={fullPathD}
            fill="none"
            stroke="#fed7aa"
            strokeWidth="3"
            strokeDasharray="6,4"
            strokeLinecap="round"
          />

          {/* Walked path */}
          {pct > 0 && (
            <Path
              d={walkedPathD}
              fill="none"
              stroke="#f97316"
              strokeWidth="3"
              strokeLinecap="round"
            />
          )}

          {/* Milestone markers */}
          {camps.map((c, i) => (
            <G key={i} x={c.pos.x} y={c.pos.y}>
              <Circle
                r="5"
                fill={c.unlocked ? '#22c55e' : '#e2e8f0'}
                stroke="#fff"
                strokeWidth="2"
              />
            </G>
          ))}

          {/* Summit flag */}
          <G x={summitPos.x} y={summitPos.y - 5}>
            <Line x1="0" y1="0" x2="0" y2="-20" stroke="#eab308" strokeWidth="2" />
            <Polygon points="0,-20 15,-15 0,-10" fill="#eab308" />
          </G>

          {/* Climber */}
          <G x={climberPos.x} y={climberPos.y}>
            <Circle r="10" fill="#3b82f6" stroke="#fff" strokeWidth="2" />
            <SvgText y="4" textAnchor="middle" fontSize="11">🧗</SvgText>
          </G>

          {/* Start label */}
          <SvgText
            x={pathPoints[0].x}
            y={pathPoints[0].y + 14}
            fontSize="8"
            fontWeight="600"
            fill="#64748b"
            textAnchor="middle"
          >
            Start
          </SvgText>
        </Svg>
      </View>

      {/* Goal display */}
      <View style={styles.goalBox}>
        <Text style={styles.goalLabel}>🎯 YOUR GOAL</Text>
        <Text style={styles.goalText}>{goal || 'Your Goal'}</Text>
      </View>

      {/* Milestone legend */}
      <View style={styles.legend}>
        {camps.map((c, i) => (
          <View key={i} style={[styles.camp, c.unlocked && styles.campUnlocked, c.current && styles.campCurrent]}>
            <View style={[styles.campIcon, c.unlocked && styles.campIconUnlocked]}>
              <Text style={styles.campEmoji}>{c.icon}</Text>
            </View>
            <Text style={styles.campName}>{c.name}</Text>
            <Text style={styles.campDay}>Day {c.day}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: 16,
    ...shadows.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progress: {
    fontSize: 13,
    color: colors.text3,
    marginRight: 8,
  },
  infoBtn: {
    padding: 4,
  },
  svgContainer: {
    aspectRatio: 300 / 180,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  svg: {
    width: '100%',
    height: '100%',
  },
  goalBox: {
    marginTop: 12,
    padding: 14,
    borderRadius: borderRadius.md,
    backgroundColor: colors.accentLight,
  },
  goalLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.accent,
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
  },
  camp: {
    alignItems: 'center',
    opacity: 0.5,
  },
  campUnlocked: {
    opacity: 1,
  },
  campCurrent: {
    opacity: 1,
  },
  campIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.bg2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  campIconUnlocked: {
    backgroundColor: colors.successLight,
  },
  campEmoji: {
    fontSize: 16,
  },
  campName: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text2,
    marginBottom: 2,
  },
  campDay: {
    fontSize: 9,
    color: colors.text3,
  },
});

export default MountainView;
