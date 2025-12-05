// Miss Recovery Modal
// Welcoming users back after missed days without shame

import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import Animated, { 
  FadeIn, 
  SlideInUp,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useHaptics } from '../hooks/useHaptics';

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export const MissRecoveryModal = ({ 
  visible, 
  recoveryInfo,
  onDismiss,
  onTalkToCoach,
}) => {
  const { colors } = useTheme();
  const haptics = useHaptics();
  
  if (!visible || !recoveryInfo) return null;
  
  const { message, daysMissed, previousStreak, type } = recoveryInfo;
  
  const handleDismiss = () => {
    haptics.tap();
    onDismiss?.();
  };
  
  const handleTalkToCoach = () => {
    haptics.tap();
    onTalkToCoach?.();
  };
  
  // Get appropriate icon based on type
  const getIcon = () => {
    switch (type) {
      case 'one_day': return '👋';
      case 'few_days': return '🤝';
      case 'week': return '💪';
      case 'extended': return '🌱';
      case 'new_start': return '✨';
      default: return '👋';
    }
  };
  
  return (
    <Modal 
      visible={visible} 
      transparent 
      animationType="fade"
      onRequestClose={handleDismiss}
    >
      <View style={styles.overlay}>
        <Animated.View 
          entering={SlideInUp.duration(400).springify()}
          style={[styles.modal, { backgroundColor: colors.card }]}
        >
          {/* Icon */}
          <Text style={styles.icon}>{getIcon()}</Text>
          
          {/* Title */}
          <Text style={[styles.title, { color: colors.text }]}>
            {message.title}
          </Text>
          
          {/* Body */}
          <Text style={[styles.body, { color: colors.text2 }]}>
            {message.body}
          </Text>
          
          {/* Stats row - only show if relevant */}
          {previousStreak > 0 && (
            <View style={[styles.statsRow, { backgroundColor: colors.bg2 }]}>
              <View style={styles.stat}>
                <Text style={[styles.statNumber, { color: colors.accent }]}>
                  {previousStreak}
                </Text>
                <Text style={[styles.statLabel, { color: colors.text3 }]}>
                  previous days
                </Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.bg3 }]} />
              <View style={styles.stat}>
                <Text style={[styles.statNumber, { color: colors.text }]}>
                  {daysMissed}
                </Text>
                <Text style={[styles.statLabel, { color: colors.text3 }]}>
                  days away
                </Text>
              </View>
            </View>
          )}
          
          {/* Reassurance message */}
          <View style={[styles.reassurance, { backgroundColor: colors.successLight }]}>
            <Ionicons name="checkmark-circle" size={18} color={colors.success} />
            <Text style={[styles.reassuranceText, { color: colors.success }]}>
              Neural pathways don't reset. They go dormant.
            </Text>
          </View>
          
          {/* Primary action */}
          <TouchableOpacity 
            style={[styles.primaryBtn, { backgroundColor: colors.accent }]}
            onPress={handleDismiss}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryBtnText}>{message.cta}</Text>
          </TouchableOpacity>
          
          {/* Secondary action - only for longer breaks */}
          {daysMissed >= 2 && (
            <TouchableOpacity 
              style={styles.secondaryBtn}
              onPress={handleTalkToCoach}
              activeOpacity={0.7}
            >
              <Text style={[styles.secondaryBtnText, { color: colors.accent }]}>
                Talk to coach about what happened
              </Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};

// ═══════════════════════════════════════════════════════════════
// LOW POOL WARNING COMPONENT (inline, not modal)
// ═══════════════════════════════════════════════════════════════

export const LowPoolGuidance = ({ poolLevel, colors }) => {
  if (poolLevel >= 40) return null;
  
  return (
    <View style={[styles.lowPoolContainer, { backgroundColor: colors.warningLight }]}>
      <Ionicons name="battery-half" size={18} color={colors.warning} />
      <View style={styles.lowPoolContent}>
        <Text style={[styles.lowPoolTitle, { color: colors.warning }]}>
          Low reserves
        </Text>
        <Text style={[styles.lowPoolText, { color: colors.text2 }]}>
          Use 2-minute versions or schedule hard habits for tomorrow morning.
        </Text>
      </View>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════
// STREAK AT RISK BANNER (for evening warnings)
// ═══════════════════════════════════════════════════════════════

export const StreakAtRiskBanner = ({ 
  visible, 
  incompleteCount,
  onShowTwoMin,
  colors,
}) => {
  if (!visible) return null;
  
  return (
    <Animated.View 
      entering={FadeIn.duration(300)}
      style={[styles.riskBanner, { backgroundColor: colors.warningLight }]}
    >
      <View style={styles.riskContent}>
        <Text style={[styles.riskTitle, { color: colors.warning }]}>
          {incompleteCount} habit{incompleteCount > 1 ? 's' : ''} remaining
        </Text>
        <Text style={[styles.riskMessage, { color: colors.text2 }]}>
          Still time today. Even the 2-minute version counts.
        </Text>
      </View>
      <TouchableOpacity 
        style={[styles.riskAction, { backgroundColor: colors.warning }]}
        onPress={onShowTwoMin}
      >
        <Text style={styles.riskActionText}>2-min</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  // Modal
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  modal: {
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  body: {
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    width: '100%',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
    marginHorizontal: 16,
  },
  reassurance: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    gap: 8,
  },
  reassuranceText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  primaryBtn: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryBtn: {
    marginTop: 16,
    paddingVertical: 8,
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '500',
  },
  
  // Low pool guidance
  lowPoolContainer: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'flex-start',
    gap: 10,
  },
  lowPoolContent: {
    flex: 1,
  },
  lowPoolTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  lowPoolText: {
    fontSize: 13,
    lineHeight: 18,
  },
  
  // Streak at risk banner
  riskBanner: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  riskContent: {
    flex: 1,
  },
  riskTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  riskMessage: {
    fontSize: 12,
    marginTop: 2,
  },
  riskAction: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginLeft: 12,
  },
  riskActionText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});

export default MissRecoveryModal;
