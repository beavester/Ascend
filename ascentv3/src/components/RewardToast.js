// Variable Reward Toast Component
// Creates anticipation through randomized, meaningful feedback

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue,
  withTiming,
  withSequence,
  withDelay,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../hooks/useTheme';
import { getCompletionReward, shouldShowReward } from '../services/rewards';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ═══════════════════════════════════════════════════════════════
// MAIN REWARD TOAST COMPONENT
// ═══════════════════════════════════════════════════════════════

export const RewardToast = ({ 
  visible, 
  context = {},
  onHide,
  duration = 2500,
}) => {
  const { colors } = useTheme();
  const [reward, setReward] = useState(null);
  
  const translateY = useSharedValue(80);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);
  
  // Generate reward when becoming visible
  useEffect(() => {
    if (visible) {
      const newReward = getCompletionReward(context);
      setReward(newReward);
      
      // Animate in
      opacity.value = withTiming(1, { duration: 200 });
      translateY.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.back(1.5)) });
      scale.value = withTiming(1, { duration: 200 });
      
      // Animate out after duration
      translateY.value = withDelay(
        duration,
        withTiming(80, { duration: 200 }, () => {
          runOnJS(handleHide)();
        })
      );
      opacity.value = withDelay(duration, withTiming(0, { duration: 200 }));
    }
  }, [visible]);
  
  const handleHide = useCallback(() => {
    setReward(null);
    onHide?.();
  }, [onHide]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));
  
  if (!visible || !reward) return null;
  
  // Different styles based on reward type
  const getRewardStyle = () => {
    switch (reward.type) {
      case 'identity':
        return { backgroundColor: colors.accentLight, borderColor: colors.accent };
      case 'pattern':
        return { backgroundColor: colors.purpleLight, borderColor: colors.purple };
      case 'science':
        return { backgroundColor: colors.successLight, borderColor: colors.success };
      case 'delight':
        return { backgroundColor: colors.warningLight, borderColor: colors.warning };
      default:
        return { backgroundColor: colors.bg2, borderColor: colors.bg3 };
    }
  };
  
  const rewardStyle = getRewardStyle();
  
  return (
    <Animated.View 
      style={[
        styles.container,
        rewardStyle,
        animatedStyle,
      ]}
    >
      <Text style={[styles.message, { color: colors.text }]}>
        {reward.message}
      </Text>
    </Animated.View>
  );
};

// ═══════════════════════════════════════════════════════════════
// MILESTONE TOAST (for special achievements)
// ═══════════════════════════════════════════════════════════════

export const MilestoneToast = ({
  visible,
  milestone,
  onHide,
}) => {
  const { colors } = useTheme();
  
  const translateY = useSharedValue(100);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);
  
  useEffect(() => {
    if (visible && milestone) {
      // Animate in with more drama
      opacity.value = withTiming(1, { duration: 300 });
      scale.value = withSequence(
        withTiming(1.1, { duration: 300, easing: Easing.out(Easing.back(2)) }),
        withTiming(1, { duration: 150 })
      );
      translateY.value = withTiming(0, { duration: 400, easing: Easing.out(Easing.back(1.2)) });
    }
  }, [visible, milestone]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));
  
  if (!visible || !milestone) return null;
  
  return (
    <Animated.View style={[styles.milestoneContainer, { backgroundColor: colors.card }, animatedStyle]}>
      <Text style={styles.milestoneIcon}>{milestone.icon}</Text>
      <Text style={[styles.milestoneTitle, { color: colors.text }]}>
        {milestone.title}
      </Text>
      <Text style={[styles.milestoneMessage, { color: colors.text2 }]}>
        {milestone.message}
      </Text>
    </Animated.View>
  );
};

// ═══════════════════════════════════════════════════════════════
// INSIGHT BANNER (for proactive insights at top of screen)
// ═══════════════════════════════════════════════════════════════

export const InsightBanner = ({
  insight,
  onDismiss,
  onAction,
}) => {
  const { colors } = useTheme();
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);
  
  useEffect(() => {
    if (insight) {
      opacity.value = withTiming(1, { duration: 200 });
      translateY.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.cubic) });
    }
  }, [insight]);
  
  const handleDismiss = () => {
    translateY.value = withTiming(-100, { duration: 200 });
    opacity.value = withTiming(0, { duration: 200 }, () => {
      runOnJS(onDismiss)();
    });
  };
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));
  
  if (!insight) return null;
  
  // Get banner style based on insight type
  const getBannerStyle = () => {
    switch (insight.type) {
      case 'urgent':
        return { backgroundColor: colors.warningLight, borderLeftColor: colors.warning };
      case 'milestone_preview':
        return { backgroundColor: colors.accentLight, borderLeftColor: colors.accent };
      case 'pattern':
        return { backgroundColor: colors.purpleLight, borderLeftColor: colors.purple };
      case 'tip':
        return { backgroundColor: colors.successLight, borderLeftColor: colors.success };
      case 'welcome_back':
        return { backgroundColor: colors.accentLight, borderLeftColor: colors.accent };
      default:
        return { backgroundColor: colors.bg2, borderLeftColor: colors.text3 };
    }
  };
  
  const bannerStyle = getBannerStyle();
  
  return (
    <Animated.View style={[styles.bannerContainer, bannerStyle, animatedStyle]}>
      <View style={styles.bannerContent}>
        {insight.title && (
          <Text style={[styles.bannerTitle, { color: colors.text }]}>
            {insight.title}
          </Text>
        )}
        <Text style={[styles.bannerMessage, { color: colors.text2 }]}>
          {insight.message}
        </Text>
        
        {insight.action && (
          <View style={styles.bannerActions}>
            <Text 
              style={[styles.bannerAction, { color: colors.accent }]}
              onPress={() => {
                onAction?.(insight.action);
                handleDismiss();
              }}
            >
              {insight.action.text}
            </Text>
            <Text 
              style={[styles.bannerDismiss, { color: colors.text3 }]}
              onPress={handleDismiss}
            >
              Dismiss
            </Text>
          </View>
        )}
      </View>
      
      {!insight.action && (
        <Text 
          style={[styles.bannerClose, { color: colors.text3 }]}
          onPress={handleDismiss}
        >
          ✕
        </Text>
      )}
    </Animated.View>
  );
};

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  // Reward toast
  container: {
    position: 'absolute',
    bottom: 180,
    left: 32,
    right: 32,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  message: {
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 22,
  },
  
  // Milestone toast
  milestoneContainer: {
    position: 'absolute',
    bottom: 150,
    left: 24,
    right: 24,
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 12,
  },
  milestoneIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  milestoneTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  milestoneMessage: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  
  // Insight banner
  bannerContainer: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
    borderRadius: 12,
    borderLeftWidth: 4,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bannerContent: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  bannerMessage: {
    fontSize: 13,
    lineHeight: 20,
  },
  bannerActions: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 16,
  },
  bannerAction: {
    fontSize: 13,
    fontWeight: '600',
  },
  bannerDismiss: {
    fontSize: 13,
  },
  bannerClose: {
    fontSize: 16,
    paddingLeft: 12,
  },
});

export default RewardToast;
