// Dopamine Vessel Component
// Visual representation of the user's motivation reserves
// Using standard React Native Animated API (no reanimated)

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import Svg, { 
  Defs, 
  LinearGradient, 
  RadialGradient,
  Stop, 
  Rect, 
  Ellipse,
  G,
  ClipPath,
} from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { getPoolStatusMessage } from '../services/dopaminePool';

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

  // Clamp level to valid range 0-100
  const clampedLevel = Math.max(0, Math.min(100, level));

  // Pool color based on level
  const getPoolColor = (lvl) => {
    if (lvl >= 70) return { main: '#60a5fa', glow: '#93c5fd', status: 'high' };
    if (lvl >= 40) return { main: '#fbbf24', glow: '#fde68a', status: 'moderate' };
    return { main: '#f87171', glow: '#fecaca', status: 'low' };
  };
  
  const poolColors = getPoolColor(clampedLevel);
  const statusMessage = getPoolStatusMessage(clampedLevel);

  // Vessel dimensions
  const vesselWidth = compact ? 50 : 70;
  const vesselHeight = compact ? 90 : 130;
  const liquidHeight = (clampedLevel / 100) * (vesselHeight - 20);
  
  if (compact) {
    return (
      <TouchableOpacity 
        style={[styles.compactContainer, { backgroundColor: colors.card }]}
        onPress={onInfoPress}
        activeOpacity={0.8}
      >
        <CompactVessel
          level={clampedLevel}
          color={poolColors.main}
          glowColor={poolColors.glow}
        />
        <Text style={[styles.compactLevel, { color: poolColors.main }]}>
          {Math.round(clampedLevel)}%
        </Text>
      </TouchableOpacity>
    );
  }
  
  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.text }]}>Drive Pool</Text>
          <TouchableOpacity onPress={onInfoPress} style={styles.infoBtn}>
            <Ionicons name="information-circle-outline" size={18} color={colors.text3} />
          </TouchableOpacity>
        </View>
        <Text style={[styles.subtitle, { color: colors.text3 }]}>
          Available motivation
        </Text>
      </View>
      
      {/* Main vessel visualization */}
      <View style={styles.vesselSection}>
        <View style={styles.vesselWrapper}>
          <Svg width={vesselWidth + 20} height={vesselHeight + 20} viewBox={`-10 -10 ${vesselWidth + 20} ${vesselHeight + 20}`}>
            <Defs>
              <LinearGradient id="liquidGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={poolColors.glow} stopOpacity="0.9" />
                <Stop offset="1" stopColor={poolColors.main} stopOpacity="0.7" />
              </LinearGradient>
              <RadialGradient id="glowGrad" cx="50%" cy="30%" r="60%">
                <Stop offset="0" stopColor={poolColors.glow} stopOpacity="0.4" />
                <Stop offset="1" stopColor={poolColors.main} stopOpacity="0" />
              </RadialGradient>
              <ClipPath id="vesselClip">
                <Rect x="5" y="5" width={vesselWidth - 10} height={vesselHeight - 10} rx="8" />
              </ClipPath>
            </Defs>
            
            {/* Outer glow for high levels */}
            {level >= 60 && (
              <Rect
                x="-4"
                y="-4"
                width={vesselWidth + 8}
                height={vesselHeight + 8}
                rx="14"
                fill={poolColors.glow}
                opacity="0.2"
              />
            )}
            
            {/* Vessel outline */}
            <Rect
              x="0"
              y="0"
              width={vesselWidth}
              height={vesselHeight}
              rx="10"
              fill={colors.bg2}
              stroke={colors.bg3}
              strokeWidth="2"
            />
            
            {/* Liquid fill */}
            <G clipPath="url(#vesselClip)">
              <Rect
                x="5"
                y={vesselHeight - liquidHeight - 5}
                width={vesselWidth - 10}
                height={liquidHeight}
                fill="url(#liquidGrad)"
              />
              
              {/* Surface highlight */}
              <Ellipse
                cx={vesselWidth / 2}
                cy={vesselHeight - liquidHeight - 3}
                rx={(vesselWidth - 20) / 2}
                ry="4"
                fill={poolColors.glow}
                opacity="0.5"
              />
            </G>
            
            {/* Measurement marks */}
            {[25, 50, 75].map(mark => (
              <Rect
                key={mark}
                x={vesselWidth - 12}
                y={vesselHeight - (mark / 100) * (vesselHeight - 20) - 8}
                width="6"
                height="1"
                fill={colors.text3}
                opacity="0.5"
              />
            ))}
          </Svg>
        </View>
        
        {/* Level and status */}
        <View style={styles.statusSection}>
          <Text style={[styles.levelText, { color: poolColors.main }]}>
            {Math.round(level)}%
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: poolColors.main + '20' }]}>
            <View style={[styles.statusDot, { backgroundColor: poolColors.main }]} />
            <Text style={[styles.statusLabel, { color: poolColors.main }]}>
              {poolColors.status === 'high' ? 'High' : 
               poolColors.status === 'moderate' ? 'Moderate' : 'Low'}
            </Text>
          </View>
          <Text style={[styles.statusMessage, { color: colors.text2 }]}>
            {statusMessage.message}
          </Text>
        </View>
      </View>
      
      {/* Log activity button */}
      {onLogActivity && (
        <TouchableOpacity 
          style={[styles.logButton, { backgroundColor: colors.bg2 }]}
          onPress={onLogActivity}
        >
          <Ionicons name="add-circle-outline" size={18} color={colors.accent} />
          <Text style={[styles.logButtonText, { color: colors.accent }]}>
            Log Activity
          </Text>
        </TouchableOpacity>
      )}
      
      {/* Breakdown section */}
      {showBreakdown && breakdown.length > 0 && (
        <View style={styles.breakdownSection}>
          <Text style={[styles.breakdownTitle, { color: colors.text3 }]}>
            Today's Activity
          </Text>
          {breakdown.map((item, i) => (
            <View key={i} style={styles.breakdownRow}>
              <Text style={[styles.breakdownLabel, { color: colors.text2 }]}>
                {item.label}
              </Text>
              <Text style={[
                styles.breakdownValue, 
                { color: item.value > 0 ? colors.success : colors.warning }
              ]}>
                {item.value > 0 ? '+' : ''}{item.value}%
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════
// COMPACT VESSEL (for widgets/headers)
// ═══════════════════════════════════════════════════════════════

const CompactVessel = ({ level, color, glowColor }) => {
  const height = 60;
  const width = 30;
  const liquidHeight = (level / 100) * (height - 10);
  
  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Defs>
        <LinearGradient id="compactLiquid" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={glowColor} stopOpacity="0.8" />
          <Stop offset="1" stopColor={color} stopOpacity="0.6" />
        </LinearGradient>
      </Defs>
      
      <Rect
        x="2"
        y="2"
        width={width - 4}
        height={height - 4}
        rx="6"
        fill="#1e293b"
        stroke="#334155"
        strokeWidth="1"
      />
      
      <Rect
        x="4"
        y={height - liquidHeight - 4}
        width={width - 8}
        height={liquidHeight}
        rx="4"
        fill="url(#compactLiquid)"
      />
    </Svg>
  );
};

// ═══════════════════════════════════════════════════════════════
// POOL INFO CONTENT (for modal)
// ═══════════════════════════════════════════════════════════════

export const PoolInfoContent = ({ colors }) => (
  <View style={styles.infoContent}>
    <Text style={[styles.infoTitle, { color: colors.text }]}>
      🧠 Your Drive Pool
    </Text>
    
    <Text style={[styles.infoText, { color: colors.text2 }]}>
      This represents your available motivation — the biological capacity to start hard things.
    </Text>
    
    <View style={[styles.infoSection, { backgroundColor: colors.bg2 }]}>
      <Text style={[styles.infoSectionTitle, { color: colors.text }]}>
        🌅 Morning Refill
      </Text>
      <Text style={[styles.infoSectionText, { color: colors.text2 }]}>
        Sleep restores your pool. Yesterday's completions add momentum. Streaks build baseline.
      </Text>
    </View>
    
    <View style={[styles.infoSection, { backgroundColor: colors.bg2 }]}>
      <Text style={[styles.infoSectionTitle, { color: colors.text }]}>
        📱 Drains
      </Text>
      <Text style={[styles.infoSectionText, { color: colors.text2 }]}>
        Social media, endless scrolling, dopamine-heavy apps withdraw from the same account.
      </Text>
    </View>
    
    <View style={[styles.infoSection, { backgroundColor: colors.bg2 }]}>
      <Text style={[styles.infoSectionTitle, { color: colors.text }]}>
        ⚡ Recharges
      </Text>
      <Text style={[styles.infoSectionText, { color: colors.text2 }]}>
        Exercise, sunlight, meditation, cold exposure — deposits that restore capacity.
      </Text>
    </View>
    
    <Text style={[styles.infoFooter, { color: colors.text3 }]}>
      Low pool ≠ failure. It means today is for 2-minute versions.
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
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  infoBtn: {
    padding: 2,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  vesselSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  vesselWrapper: {
    alignItems: 'center',
  },
  statusSection: {
    flex: 1,
  },
  levelText: {
    fontSize: 36,
    fontWeight: '800',
    marginBottom: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
    marginBottom: 8,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusMessage: {
    fontSize: 13,
    lineHeight: 18,
  },
  logButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 16,
  },
  logButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  breakdownSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  breakdownTitle: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  breakdownLabel: {
    fontSize: 13,
  },
  breakdownValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  compactLevel: {
    fontSize: 14,
    fontWeight: '700',
  },
  infoContent: {
    padding: 8,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 16,
  },
  infoSection: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  infoSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  infoSectionText: {
    fontSize: 13,
    lineHeight: 18,
  },
  infoFooter: {
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default DopamineVessel;
