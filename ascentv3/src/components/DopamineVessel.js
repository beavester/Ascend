// Dopamine Vessel Component
// Visual representation of the user's motivation reserves

import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  interpolateColor,
} from 'react-native-reanimated';
import Svg, { 
  Defs, 
  LinearGradient, 
  RadialGradient,
  Stop, 
  Rect, 
  Ellipse,
  Path,
  G,
  ClipPath,
} from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { getPoolStatusMessage } from '../services/dopaminePool';

const AnimatedView = Animated.createAnimatedComponent(View);

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export const DopamineVessel = ({ 
  level = 65, 
  previousLevel,
  onInfoPress,
  onLogActivity,
  compact = false,
  showBreakdown = false,
  breakdown = [],
}) => {
  const { colors } = useTheme();
  const displayLevel = useSharedValue(previousLevel || level);
  const shimmerOffset = useSharedValue(0);
  
  // Animate level changes smoothly
  useEffect(() => {
    displayLevel.value = withTiming(level, { 
      duration: 1500,
      easing: Easing.out(Easing.cubic),
    });
  }, [level]);
  
  // Subtle shimmer animation for "alive" feeling
  useEffect(() => {
    shimmerOffset.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1, // infinite
      false
    );
  }, []);
  
  // Get status info based on level
  const status = useMemo(() => getPoolStatusMessage(level), [level]);
  
  // Colors based on level
  const liquidColors = useMemo(() => {
    if (level >= 70) return { primary: '#60a5fa', secondary: '#3b82f6', glow: '#93c5fd' };
    if (level >= 40) return { primary: '#fbbf24', secondary: '#f59e0b', glow: '#fde68a' };
    return { primary: '#f87171', secondary: '#ef4444', glow: '#fecaca' };
  }, [level]);
  
  const animatedContainerStyle = useAnimatedStyle(() => ({
    opacity: withTiming(1, { duration: 500 }),
  }));

  if (compact) {
    return (
      <CompactVessel 
        level={level} 
        status={status}
        liquidColors={liquidColors}
        onInfoPress={onInfoPress}
        colors={colors}
      />
    );
  }

  return (
    <AnimatedView style={[styles.container, { backgroundColor: colors.card }, animatedContainerStyle]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.text }]}>Drive Reserve</Text>
          <TouchableOpacity onPress={onInfoPress} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="information-circle-outline" size={18} color={colors.text3} />
          </TouchableOpacity>
        </View>
        <Text style={[styles.subtitle, { color: colors.text3 }]}>
          {status.suggestion}
        </Text>
      </View>
      
      <View style={styles.vesselRow}>
        {/* The vessel SVG */}
        <View style={styles.vesselContainer}>
          <Svg width={70} height={120} viewBox="0 0 70 120">
            <Defs>
              {/* Liquid gradient */}
              <LinearGradient id="liquidGrad" x1="0" y1="1" x2="0" y2="0">
                <Stop offset="0%" stopColor={liquidColors.primary} stopOpacity="0.95" />
                <Stop offset="50%" stopColor={liquidColors.secondary} stopOpacity="0.85" />
                <Stop offset="100%" stopColor={liquidColors.glow} stopOpacity="0.7" />
              </LinearGradient>
              
              {/* Glow effect for high levels */}
              <RadialGradient id="glowGrad" cx="50%" cy="50%" r="60%">
                <Stop offset="0%" stopColor={liquidColors.glow} stopOpacity="0.3" />
                <Stop offset="100%" stopColor={liquidColors.glow} stopOpacity="0" />
              </RadialGradient>
              
              {/* Vessel clip path */}
              <ClipPath id="vesselClip">
                <Path d="M10,15 Q10,8 18,8 L52,8 Q60,8 60,15 L60,105 Q60,112 52,112 L18,112 Q10,112 10,105 Z" />
              </ClipPath>
            </Defs>
            
            {/* Outer glow when high */}
            {level >= 70 && (
              <Ellipse cx="35" cy="60" rx="40" ry="65" fill="url(#glowGrad)" />
            )}
            
            {/* Glass vessel outline */}
            <Path 
              d="M10,15 Q10,8 18,8 L52,8 Q60,8 60,15 L60,105 Q60,112 52,112 L18,112 Q10,112 10,105 Z"
              fill="rgba(148,163,184,0.05)"
              stroke="rgba(148,163,184,0.2)"
              strokeWidth="1.5"
            />
            
            {/* Liquid fill */}
            <G clipPath="url(#vesselClip)">
              <Rect 
                x="10" 
                y={112 - (level * 1.04)}
                width="50" 
                height={level * 1.04}
                fill="url(#liquidGrad)"
              />
              
              {/* Surface shimmer */}
              <Ellipse 
                cx="35" 
                cy={112 - (level * 1.04)} 
                rx="20" 
                ry="2.5"
                fill="rgba(255,255,255,0.35)"
              />
            </G>
            
            {/* Measurement marks */}
            {[25, 50, 75].map(mark => (
              <React.Fragment key={mark}>
                <Path 
                  d={`M7,${112 - (mark * 1.04)} L13,${112 - (mark * 1.04)}`}
                  stroke="rgba(148,163,184,0.3)"
                  strokeWidth="1"
                />
                <Path 
                  d={`M57,${112 - (mark * 1.04)} L63,${112 - (mark * 1.04)}`}
                  stroke="rgba(148,163,184,0.3)"
                  strokeWidth="1"
                />
              </React.Fragment>
            ))}
          </Svg>
        </View>
        
        {/* Level and status */}
        <View style={styles.statusContainer}>
          <Text style={[styles.levelNumber, { color: status.color }]}>
            {level}%
          </Text>
          <Text style={[styles.statusMessage, { color: colors.text2 }]}>
            {status.message}
          </Text>
          
          {/* Quick actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={[styles.quickAction, { backgroundColor: colors.bg2 }]}
              onPress={() => onLogActivity?.('recharge')}
            >
              <Ionicons name="add" size={14} color={colors.accent} />
              <Text style={[styles.quickActionText, { color: colors.accent }]}>
                Log recharge
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      
      {/* Breakdown section */}
      {showBreakdown && breakdown.length > 0 && (
        <View style={[styles.breakdownSection, { borderTopColor: colors.bg2 }]}>
          <Text style={[styles.breakdownTitle, { color: colors.text3 }]}>
            Today's impact
          </Text>
          {breakdown.slice(0, 3).map((item, index) => (
            <View key={index} style={styles.breakdownItem}>
              <Text style={[styles.breakdownApp, { color: colors.text2 }]}>
                {item.app}
              </Text>
              <Text style={[
                styles.breakdownImpact, 
                { color: item.impact < 0 ? '#f87171' : '#4ade80' }
              ]}>
                {item.impact > 0 ? '+' : ''}{item.impact}%
              </Text>
            </View>
          ))}
        </View>
      )}
    </AnimatedView>
  );
};

// ═══════════════════════════════════════════════════════════════
// COMPACT VERSION (for widget/inline use)
// ═══════════════════════════════════════════════════════════════

const CompactVessel = ({ level, status, liquidColors, onInfoPress, colors }) => (
  <TouchableOpacity 
    style={[styles.compactContainer, { backgroundColor: colors.card }]}
    onPress={onInfoPress}
    activeOpacity={0.7}
  >
    <View style={styles.compactVessel}>
      <Svg width={32} height={48} viewBox="0 0 32 48">
        <Defs>
          <LinearGradient id="compactLiquid" x1="0" y1="1" x2="0" y2="0">
            <Stop offset="0%" stopColor={liquidColors.primary} stopOpacity="0.9" />
            <Stop offset="100%" stopColor={liquidColors.glow} stopOpacity="0.6" />
          </LinearGradient>
          <ClipPath id="compactClip">
            <Rect x="4" y="4" width="24" height="40" rx="4" />
          </ClipPath>
        </Defs>
        
        <Rect 
          x="4" y="4" width="24" height="40" rx="4"
          fill="rgba(148,163,184,0.05)"
          stroke="rgba(148,163,184,0.2)"
          strokeWidth="1"
        />
        
        <G clipPath="url(#compactClip)">
          <Rect 
            x="4" 
            y={44 - (level * 0.4)}
            width="24" 
            height={level * 0.4}
            fill="url(#compactLiquid)"
          />
        </G>
      </Svg>
    </View>
    
    <View style={styles.compactInfo}>
      <Text style={[styles.compactLevel, { color: status.color }]}>{level}%</Text>
      <Text style={[styles.compactLabel, { color: colors.text3 }]}>Drive</Text>
    </View>
  </TouchableOpacity>
);

// ═══════════════════════════════════════════════════════════════
// POOL INFO MODAL CONTENT
// ═══════════════════════════════════════════════════════════════

export const PoolInfoContent = ({ colors }) => (
  <View style={styles.infoContent}>
    <Text style={[styles.infoTitle, { color: colors.text }]}>
      What is the Drive Reserve?
    </Text>
    
    <Text style={[styles.infoText, { color: colors.text2 }]}>
      Your brain has a limited supply of motivation each day. High-stimulation activities (social media, endless scrolling) burn through it fast. The pool shows what you have left.
    </Text>
    
    <View style={[styles.infoSection, { backgroundColor: colors.bg2 }]}>
      <Text style={[styles.infoSectionTitle, { color: colors.text }]}>
        What drains it:
      </Text>
      <Text style={[styles.infoSectionText, { color: colors.text2 }]}>
        • Social media scrolling{'\n'}
        • Video streaming{'\n'}
        • News consumption{'\n'}
        • Gaming
      </Text>
    </View>
    
    <View style={[styles.infoSection, { backgroundColor: colors.bg2 }]}>
      <Text style={[styles.infoSectionTitle, { color: colors.text }]}>
        What refills it:
      </Text>
      <Text style={[styles.infoSectionText, { color: colors.text2 }]}>
        • Sleep (biggest refill){'\n'}
        • Exercise{'\n'}
        • Time outdoors{'\n'}
        • Meditation{'\n'}
        • Real social connection
      </Text>
    </View>
    
    <Text style={[styles.infoFooter, { color: colors.text3 }]}>
      This isn't about avoiding "bad" activities. It's about being aware of the tradeoff. Low pool? Use 2-minute versions. High pool? Tackle the hard stuff.
    </Text>
  </View>
);

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  vesselRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  vesselContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusContainer: {
    flex: 1,
  },
  levelNumber: {
    fontSize: 36,
    fontWeight: '700',
  },
  statusMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  quickActions: {
    flexDirection: 'row',
    marginTop: 12,
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    gap: 4,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  breakdownSection: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  breakdownTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  breakdownApp: {
    fontSize: 13,
  },
  breakdownImpact: {
    fontSize: 13,
    fontWeight: '600',
  },
  
  // Compact styles
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    gap: 8,
  },
  compactVessel: {
    alignItems: 'center',
  },
  compactInfo: {
    alignItems: 'flex-start',
  },
  compactLevel: {
    fontSize: 18,
    fontWeight: '700',
  },
  compactLabel: {
    fontSize: 11,
  },
  
  // Info modal styles
  infoContent: {
    padding: 4,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 16,
  },
  infoSection: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  infoSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  infoSectionText: {
    fontSize: 13,
    lineHeight: 20,
  },
  infoFooter: {
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 20,
    marginTop: 8,
  },
});

export default DopamineVessel;
