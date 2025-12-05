import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, {
  Defs, LinearGradient, Stop, Rect, Polygon, Path,
  Circle, G, Line, Text as SvgText
} from 'react-native-svg';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { radius, MILESTONES, MAX_STREAK_DAYS } from '../constants/theme';

// Path points following the left edge up to summit
const PATH_POINTS = [
  { x: 30, y: 165 },
  { x: 45, y: 140 },
  { x: 60, y: 115 },
  { x: 85, y: 95 },
  { x: 110, y: 70 },
  { x: 135, y: 45 },
  { x: 150, y: 22 },
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

// Animated climber wrapper
function AnimatedClimber({ x, y, todayComplete, colors }) {
  const pulseValue = useSharedValue(1);
  const glowOpacity = useSharedValue(0);
  
  useEffect(() => {
    if (todayComplete) {
      // Subtle breathing pulse when on track
      pulseValue.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 1500 }),
          withTiming(1, { duration: 1500 })
        ),
        -1,
        true
      );
      // Gentle glow
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.4, { duration: 1500 }),
          withTiming(0.15, { duration: 1500 })
        ),
        -1,
        true
      );
    } else {
      pulseValue.value = 1;
      glowOpacity.value = 0;
    }
  }, [todayComplete]);
  
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseValue.value }],
  }));
  
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));
  
  return (
    <Animated.View 
      style={[
        {
          position: 'absolute',
          left: x - 12,
          top: y - 12,
          width: 24,
          height: 24,
        },
        pulseStyle
      ]}
    >
      {/* Glow effect */}
      <Animated.View 
        style={[
          {
            position: 'absolute',
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: colors.accent,
          },
          glowStyle
        ]} 
      />
      {/* Climber circle */}
      <View style={{
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: colors.accent,
        borderWidth: 2,
        borderColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <Text style={{ fontSize: 11 }}>🧗</Text>
      </View>
    </Animated.View>
  );
}

export default function Mountain({ streak = 0, goal = 'Your Goal', todayComplete = false, onInfoPress }) {
  const { colors, shadows, isDark } = useTheme();
  
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
  
  // Theme-aware colors for SVG
  const skyGradient = isDark 
    ? { start: colors.mountainSky1, end: colors.mountainSky2 }
    : { start: '#dbeafe', end: '#eff6ff' };
  
  const bgCardColor = isDark ? colors.bg2 : '#e0f2fe';
  
  return (
    <View style={[styles.card, { backgroundColor: bgCardColor }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Your Ascent</Text>
        <View style={styles.headerRight}>
          <Text style={[styles.progressText, { color: colors.text3 }]}>
            Day {streak} of {MAX_STREAK_DAYS}
          </Text>
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
              <Stop offset="0%" stopColor={skyGradient.start} />
              <Stop offset="100%" stopColor={skyGradient.end} />
            </LinearGradient>
            <LinearGradient id="mtGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={isDark ? '#334155' : '#475569'} />
              <Stop offset="50%" stopColor={colors.mountainRock} />
              <Stop offset="100%" stopColor={isDark ? '#64748b' : '#94a3b8'} />
            </LinearGradient>
          </Defs>
          
          {/* Sky */}
          <Rect fill="url(#skyGrad)" width="300" height="180" />
          
          {/* Background mountains */}
          <Polygon fill={isDark ? '#475569' : '#cbd5e1'} points="180,180 230,80 280,120 300,100 300,180" />
          <Polygon fill={isDark ? '#334155' : '#e2e8f0'} points="220,180 260,110 300,140 300,180" />
          
          {/* Main mountain */}
          <Polygon fill="url(#mtGrad)" points="0,180 30,165 60,140 90,120 120,90 150,22 180,70 210,180" />
          
          {/* Snow cap */}
          <Polygon fill={colors.mountainSnow} points="138,40 150,22 162,40 155,38 150,42 145,38" />
          
          {/* Ridge detail */}
          <Path 
            d="M30,165 Q60,150 90,120 T150,22" 
            fill="none" 
            stroke={isDark ? '#1e293b' : '#334155'} 
            strokeWidth="1" 
            opacity="0.3" 
          />
          
          {/* Full path (dashed trail) */}
          <Path 
            d={fullPathD} 
            fill="none" 
            stroke={isDark ? '#78350f' : '#fed7aa'} 
            strokeWidth="3" 
            strokeDasharray="6,4" 
            strokeLinecap="round" 
          />
          
          {/* Walked path (solid orange) */}
          {pct > 0 && (
            <Path 
              d={walkedPathD} 
              fill="none" 
              stroke={colors.mountainPath} 
              strokeWidth="3" 
              strokeLinecap="round" 
            />
          )}
          
          {/* Milestone markers */}
          {camps.map((c, i) => (
            <G key={i}>
              {/* Glow for current milestone */}
              {c.current && (
                <Circle
                  cx={c.pos.x}
                  cy={c.pos.y}
                  r={8}
                  fill={colors.success}
                  opacity={0.3}
                />
              )}
              <Circle
                cx={c.pos.x}
                cy={c.pos.y}
                r={5}
                fill={c.unlocked ? colors.success : colors.bg3}
                stroke="#fff"
                strokeWidth={2}
              />
            </G>
          ))}
          
          {/* Summit flag */}
          <G>
            <Line 
              x1={summitPos.x} 
              y1={summitPos.y - 5} 
              x2={summitPos.x} 
              y2={summitPos.y - 25} 
              stroke={colors.warning} 
              strokeWidth={2} 
            />
            <Polygon 
              points={`${summitPos.x},${summitPos.y - 25} ${summitPos.x + 15},${summitPos.y - 20} ${summitPos.x},${summitPos.y - 15}`} 
              fill={colors.warning} 
            />
          </G>
          
          {/* Start label */}
          <SvgText 
            x={PATH_POINTS[0].x} 
            y={PATH_POINTS[0].y + 14} 
            textAnchor="middle" 
            fontSize="8" 
            fontWeight="600" 
            fill={colors.text3}
          >
            Start
          </SvgText>
        </Svg>
        
        {/* Animated climber (rendered outside SVG for React Native animation) */}
        <AnimatedClimber 
          x={climberPos.x} 
          y={climberPos.y} 
          todayComplete={todayComplete}
          colors={colors}
        />
      </View>
      
      {/* Goal display */}
      <View style={[styles.goalBox, { backgroundColor: colors.accentLight }]}>
        <Text style={[styles.goalLabel, { color: colors.accent }]}>🎯 Your Goal</Text>
        <Text style={[styles.goalText, { color: colors.text }]}>{goal}</Text>
      </View>
      
      {/* Milestone legend */}
      <View style={[styles.legend, { borderTopColor: isDark ? colors.bg3 : colors.bg3 }]}>
        {camps.map((c, i) => (
          <View key={i} style={styles.camp}>
            <View style={[
              styles.campIcon,
              { backgroundColor: colors.bg3 },
              c.unlocked && { backgroundColor: colors.success },
              c.current && { backgroundColor: colors.accent },
            ]}>
              <Text style={{ fontSize: 10 }}>{c.icon}</Text>
            </View>
            <Text style={[
              styles.campName, 
              { color: colors.text3 },
              c.unlocked && { color: colors.text }
            ]}>
              {c.name}
            </Text>
            <Text style={[styles.campDay, { color: colors.text3 }]}>Day {c.day}</Text>
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
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  progressText: {
    fontSize: 12,
  },
  infoBtn: {
    padding: 4,
  },
  visual: {
    height: 180,
    position: 'relative',
  },
  goalBox: {
    borderRadius: radius.md,
    padding: 14,
    marginTop: 12,
  },
  goalLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  goalText: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  camp: {
    alignItems: 'center',
    flex: 1,
  },
  campIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  campName: {
    fontSize: 10,
    fontWeight: '600',
  },
  campDay: {
    fontSize: 9,
  },
});
