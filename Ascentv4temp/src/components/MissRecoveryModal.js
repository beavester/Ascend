// MissRecoveryModal Component
// Return-after-miss encouragement with standard Animated API

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';

// ═══════════════════════════════════════════════════════════════
// MISS RECOVERY MODAL
// ═══════════════════════════════════════════════════════════════

export const MissRecoveryModal = ({
  visible,
  recoveryInfo,
  onDismiss,
  onTalkToCoach,
}) => {
  const { colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.8);
      opacityAnim.setValue(0);
    }
  }, [visible]);
  
  if (!recoveryInfo) return null;
  
  const { daysMissed, tier, message, subMessage, encouragement } = recoveryInfo;
  
  const getTierIcon = () => {
    switch (tier) {
      case 'single': return '🌱';
      case 'few': return '🔄';
      case 'week': return '🌤️';
      case 'extended': return '🌅';
      default: return '👋';
    }
  };
  
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <Animated.View 
          style={[
            styles.modal, 
            { 
              backgroundColor: colors.card,
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            }
          ]}
        >
          {/* Icon */}
          <Text style={styles.icon}>{getTierIcon()}</Text>
          
          {/* Title */}
          <Text style={[styles.title, { color: colors.text }]}>
            Welcome Back
          </Text>
          
          {/* Days badge */}
          <View style={[styles.daysBadge, { backgroundColor: colors.bg2 }]}>
            <Text style={[styles.daysText, { color: colors.text2 }]}>
              {daysMissed === 1 ? '1 day away' : `${daysMissed} days away`}
            </Text>
          </View>
          
          {/* Main message */}
          <Text style={[styles.message, { color: colors.text }]}>
            {message}
          </Text>
          
          {/* Sub message */}
          {subMessage && (
            <Text style={[styles.subMessage, { color: colors.text2 }]}>
              {subMessage}
            </Text>
          )}
          
          {/* Encouragement */}
          <View style={[styles.encouragementBox, { backgroundColor: colors.accentLight }]}>
            <Text style={[styles.encouragement, { color: colors.accent }]}>
              {encouragement}
            </Text>
          </View>
          
          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity 
              style={[styles.secondaryBtn, { backgroundColor: colors.bg2 }]}
              onPress={onTalkToCoach}
            >
              <Ionicons name="chatbubble-outline" size={18} color={colors.text2} />
              <Text style={[styles.secondaryBtnText, { color: colors.text2 }]}>
                Talk to Coach
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.primaryBtn, { backgroundColor: colors.accent }]}
              onPress={onDismiss}
            >
              <Text style={styles.primaryBtnText}>Let's Go</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

// ═══════════════════════════════════════════════════════════════
// LOW POOL GUIDANCE
// ═══════════════════════════════════════════════════════════════

export const LowPoolGuidance = ({ poolLevel, onTwoMinVersion }) => {
  const { colors } = useTheme();
  
  if (poolLevel >= 40) return null;
  
  return (
    <View style={[styles.lowPoolContainer, { backgroundColor: '#fef3c7' }]}>
      <View style={styles.lowPoolContent}>
        <Text style={styles.lowPoolIcon}>🔋</Text>
        <View style={styles.lowPoolText}>
          <Text style={[styles.lowPoolTitle, { color: '#92400e' }]}>
            Low reserves today
          </Text>
          <Text style={[styles.lowPoolMessage, { color: '#a16207' }]}>
            Perfect day for 2-minute versions. Showing up is what matters.
          </Text>
        </View>
      </View>
      
      {onTwoMinVersion && (
        <TouchableOpacity 
          style={styles.lowPoolAction}
          onPress={onTwoMinVersion}
        >
          <Text style={[styles.lowPoolActionText, { color: '#b45309' }]}>
            See 2-min versions →
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════
// STREAK AT RISK BANNER
// ═══════════════════════════════════════════════════════════════

export const StreakAtRiskBanner = ({ 
  streakDays, 
  incompleteCount,
  onPress,
}) => {
  const { colors } = useTheme();
  
  if (!streakDays || streakDays < 3 || incompleteCount === 0) return null;
  
  return (
    <TouchableOpacity 
      style={[styles.riskBanner, { backgroundColor: '#fef3c7' }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.riskContent}>
        <View style={styles.riskIconWrap}>
          <Ionicons name="flame" size={20} color="#f59e0b" />
        </View>
        <View style={styles.riskText}>
          <Text style={[styles.riskTitle, { color: '#92400e' }]}>
            {streakDays}-day streak at risk
          </Text>
          <Text style={[styles.riskMessage, { color: '#a16207' }]}>
            {incompleteCount} habit{incompleteCount > 1 ? 's' : ''} left today
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#b45309" />
    </TouchableOpacity>
  );
};

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  // Modal
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modal: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  icon: {
    fontSize: 48,
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  daysBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 16,
  },
  daysText: {
    fontSize: 13,
    fontWeight: '500',
  },
  message: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  subMessage: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  encouragementBox: {
    width: '100%',
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
  },
  encouragement: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  primaryBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  
  // Low Pool
  lowPoolContainer: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  lowPoolContent: {
    flexDirection: 'row',
    gap: 10,
  },
  lowPoolIcon: {
    fontSize: 20,
  },
  lowPoolText: {
    flex: 1,
  },
  lowPoolTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  lowPoolMessage: {
    fontSize: 13,
    lineHeight: 18,
  },
  lowPoolAction: {
    marginTop: 10,
    alignItems: 'flex-end',
  },
  lowPoolActionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  
  // Streak Risk
  riskBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  riskContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  riskIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  riskText: {
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
});

export default MissRecoveryModal;
