// RewardToast Component
// Variable reward display with standard Animated API

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { useTheme } from '../hooks/useTheme';

// ═══════════════════════════════════════════════════════════════
// REWARD TOAST
// ═══════════════════════════════════════════════════════════════

export const RewardToast = ({ 
  visible, 
  context = {}, 
  onHide,
  duration = 2500,
}) => {
  const { colors } = useTheme();
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    if (visible) {
      // Animate in
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
      
      // Auto hide
      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -100,
            duration: 300,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(() => onHide?.());
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [visible]);
  
  if (!visible) return null;
  
  const { message = 'Done.', type = 'acknowledgment', emoji } = context;
  
  const getTypeColor = () => {
    switch (type) {
      case 'identity': return colors.accent;
      case 'pattern': return colors.purple || '#a855f7';
      case 'neuroscience': return colors.success;
      case 'delight': return '#f59e0b';
      default: return colors.text;
    }
  };
  
  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          backgroundColor: colors.card,
          transform: [{ translateY }],
          opacity,
        }
      ]}
    >
      {emoji && <Text style={styles.emoji}>{emoji}</Text>}
      <Text style={[styles.message, { color: getTypeColor() }]}>
        {message}
      </Text>
    </Animated.View>
  );
};

// ═══════════════════════════════════════════════════════════════
// MILESTONE TOAST
// ═══════════════════════════════════════════════════════════════

export const MilestoneToast = ({
  visible,
  milestone,
  onHide,
}) => {
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    if (visible && milestone) {
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          friction: 6,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      
      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(() => onHide?.());
      }, 3500);
      
      return () => clearTimeout(timer);
    }
  }, [visible, milestone]);
  
  if (!visible || !milestone) return null;
  
  return (
    <Animated.View 
      style={[
        styles.milestoneContainer, 
        { 
          backgroundColor: colors.card,
          transform: [{ scale }],
          opacity,
        }
      ]}
    >
      <Text style={styles.milestoneEmoji}>{milestone.icon}</Text>
      <Text style={[styles.milestoneName, { color: colors.text }]}>
        {milestone.name}
      </Text>
      <Text style={[styles.milestoneMessage, { color: colors.text2 }]}>
        {milestone.message}
      </Text>
    </Animated.View>
  );
};

// ═══════════════════════════════════════════════════════════════
// INSIGHT BANNER
// ═══════════════════════════════════════════════════════════════

export const InsightBanner = ({
  insight,
  onDismiss,
  onAction,
}) => {
  const { colors } = useTheme();
  
  if (!insight) return null;
  
  const getTypeStyles = () => {
    switch (insight.type) {
      case 'urgent':
        return { bg: '#fef3c7', border: '#fbbf24', icon: '⚡' };
      case 'pattern':
        return { bg: '#f3e8ff', border: '#a855f7', icon: '📊' };
      case 'tip':
        return { bg: '#dcfce7', border: '#22c55e', icon: '💡' };
      case 'welcome_back':
        return { bg: '#dbeafe', border: '#3b82f6', icon: '👋' };
      default:
        return { bg: colors.bg2, border: colors.bg3, icon: '💭' };
    }
  };
  
  const typeStyles = getTypeStyles();
  
  return (
    <View style={[
      styles.insightContainer, 
      { backgroundColor: typeStyles.bg, borderLeftColor: typeStyles.border }
    ]}>
      <View style={styles.insightContent}>
        <Text style={styles.insightIcon}>{typeStyles.icon}</Text>
        <View style={styles.insightText}>
          <Text style={[styles.insightTitle, { color: colors.text }]}>
            {insight.title}
          </Text>
          <Text style={[styles.insightMessage, { color: colors.text2 }]}>
            {insight.message}
          </Text>
        </View>
      </View>
      
      <View style={styles.insightActions}>
        {insight.action && (
          <Text 
            style={[styles.insightActionText, { color: typeStyles.border }]}
            onPress={() => onAction?.(insight.action)}
          >
            {insight.action.label}
          </Text>
        )}
        <Text 
          style={[styles.insightDismiss, { color: colors.text3 }]}
          onPress={onDismiss}
        >
          Dismiss
        </Text>
      </View>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  // Reward Toast
  container: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 1000,
  },
  emoji: {
    fontSize: 24,
  },
  message: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  
  // Milestone
  milestoneContainer: {
    position: 'absolute',
    top: '30%',
    left: 40,
    right: 40,
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 12,
    zIndex: 1001,
  },
  milestoneEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  milestoneName: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
  },
  milestoneMessage: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  
  // Insight Banner
  insightContainer: {
    borderRadius: 12,
    borderLeftWidth: 4,
    padding: 14,
    marginBottom: 12,
  },
  insightContent: {
    flexDirection: 'row',
    gap: 10,
  },
  insightIcon: {
    fontSize: 20,
  },
  insightText: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  insightMessage: {
    fontSize: 13,
    lineHeight: 18,
  },
  insightActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
    marginTop: 10,
  },
  insightActionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  insightDismiss: {
    fontSize: 13,
  },
});

export default RewardToast;
