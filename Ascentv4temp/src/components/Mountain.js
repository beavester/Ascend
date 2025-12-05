import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import Svg, {
  Defs, LinearGradient, Stop, Rect, Polygon, Path,
  Circle, G, Line, Text as SvgText
} from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { MILESTONES, MAX_STREAK_DAYS } from '../constants/theme';

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

// Animated climber wrapper using standard Animated API
function AnimatedClimber({ x, y, todayComplete, colors }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    if (todayComplete) {
      // Subtle breathing pulse when on track
      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.08,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      
      const glowLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 0.4,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.15,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      
      pulseLoop.start();
      glowLoop.start();
      
      return () => {
        pulseLoop.stop();
        glowLoop.stop();
      };
    } else {
      pulseAnim.setValue(1);
      glowAnim.setValue(0);
    }
  }, [todayComplete]);
  
  return (
    <Animated.View 
      style={{
        position: 'absolute',
        left: x - 12,
        top: y - 12,
        width: 24,
        height: 24,
        transform: [{ scale: pulseAnim }],
      }}
    >
      {/* Glow effect */}
      <Animated.View 
        style={{
          position: 'absolute',
          width: 24,
          height: 24,
          borderRadius: 12,
          backgroundColor: colors.accent,
          opacity: glowAnim,
        }} 
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
  
  // Milestone markers
  const milestoneMarkers = MILESTONES.map(m => {
    const pos = getPositionAtProgress(m.day / MAX_STREAK_DAYS);
    const passed = streak >= m.day;
    return { ...m, ...pos, passed };
  });
  
  return (
    <View style={[styles.container, { backgroundColor: colors.card }, shadows.sm]}>
      <View style={styles.svgContainer}>
        <Svg width="100%" height="200" viewBox="0 0 300 200">
          <Defs>
            {/* Mountain gradients */}
            <LinearGradient id="mountainGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={isDark ? '#475569' : '#94a3b8'} />
              <Stop offset="1" stopColor={isDark ? '#334155' : '#64748b'} />
            </LinearGradient>
            <LinearGradient id="mountainFrontGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={isDark ? '#64748b' : '#cbd5e1'} />
              <Stop offset="1" stopColor={isDark ? '#475569' : '#94a3b8'} />
            </LinearGradient>
            <LinearGradient id="snowGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#fff" />
              <Stop offset="1" stopColor={isDark ? '#e2e8f0' : '#f1f5f9'} />
            </LinearGradient>
            <LinearGradient id="pathGrad" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor={colors.accent} stopOpacity="0.3" />
              <Stop offset="1" stopColor={colors.accent} />
            </LinearGradient>
          </Defs>
          
          {/* Sky background */}
          <Rect x="0" y="0" width="300" height="200" fill={isDark ? colors.bg : '#f0f9ff'} />
          
          {/* Back mountain */}
          <Polygon
            points="180,180 220,80 300,180"
            fill="url(#mountainGrad)"
            opacity="0.6"
          />
          
          {/* Main mountain */}
          <Polygon
            points="0,180 150,15 300,180"
            fill="url(#mountainFrontGrad)"
          />
          
          {/* Snow cap */}
          <Polygon
            points="130,40 150,15 170,40 160,38 150,42 140,38"
            fill="url(#snowGrad)"
          />
          
          {/* Full path (dashed, unwalked) */}
          <Path
            d={fullPathD}
            stroke={isDark ? '#475569' : '#94a3b8'}
            strokeWidth="2"
            strokeDasharray="4,4"
            fill="none"
            opacity="0.5"
          />
          
          {/* Walked path (solid) */}
          {walkedPathD && (
            <Path
              d={walkedPathD}
              stroke={colors.accent}
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
            />
          )}
          
          {/* Milestone markers */}
          {milestoneMarkers.map((m, i) => (
            <G key={i}>
              {/* Flag pole */}
              <Line
                x1={m.x}
                y1={m.y}
                x2={m.x}
                y2={m.y - 18}
                stroke={m.passed ? colors.accent : (isDark ? '#64748b' : '#94a3b8')}
                strokeWidth="1.5"
              />
              {/* Flag */}
              <Polygon
                points={`${m.x},${m.y - 18} ${m.x + 12},${m.y - 14} ${m.x},${m.y - 10}`}
                fill={m.passed ? colors.accent : (isDark ? '#475569' : '#cbd5e1')}
              />
              {/* Day label */}
              <SvgText
                x={m.x + 15}
                y={m.y - 12}
                fontSize="9"
                fill={m.passed ? colors.accent : colors.text3}
                fontWeight="600"
              >
                {m.day}
              </SvgText>
            </G>
          ))}
          
          {/* Summit flag */}
          <G>
            <Line x1="150" y1="15" x2="150" y2="-5" stroke="#fbbf24" strokeWidth="2" />
            <Polygon points="150,-5 168,0 150,5" fill="#fbbf24" />
            <Circle cx="150" cy="15" r="4" fill="#fbbf24" />
          </G>
        </Svg>
        
        {/* Climber (positioned over SVG) */}
        <AnimatedClimber 
          x={climberPos.x} 
          y={climberPos.y} 
          todayComplete={todayComplete}
          colors={colors}
        />
      </View>
      
      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: colors.accent }]}>{streak}</Text>
          <Text style={[styles.statLabel, { color: colors.text3 }]}>days</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.bg2 }]} />
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {Math.round(pct * 100)}%
          </Text>
          <Text style={[styles.statLabel, { color: colors.text3 }]}>to summit</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.bg2 }]} />
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {MAX_STREAK_DAYS - streak}
          </Text>
          <Text style={[styles.statLabel, { color: colors.text3 }]}>remaining</Text>
        </View>
      </View>
      
      {/* Goal reminder */}
      <View style={[styles.goalRow, { backgroundColor: colors.bg2 }]}>
        <Text style={[styles.goalLabel, { color: colors.text3 }]}>Goal:</Text>
        <Text style={[styles.goalText, { color: colors.text }]} numberOfLines={1}>
          {goal}
        </Text>
        {onInfoPress && (
          <TouchableOpacity onPress={onInfoPress} style={styles.infoBtn}>
            <Ionicons name="information-circle-outline" size={16} color={colors.text3} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  svgContainer: {
    position: 'relative',
    height: 200,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 30,
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 8,
  },
  goalLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  goalText: {
    fontSize: 13,
    flex: 1,
  },
  infoBtn: {
    padding: 4,
  },
});
