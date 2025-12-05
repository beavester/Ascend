import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withTiming,
  interpolateColor,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { radius, REFLECTION_PROMPTS, shouldShowReflection } from '../constants/theme';
import { getTwoMinuteVersion, getTwoMinuteHabit } from '../services/ai';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

// ═══════════════════════════════════════════════════════════════
// ANIMATED CHECKBOX COMPONENT
// ═══════════════════════════════════════════════════════════════
function AnimatedCheckbox({ completed, onComplete, colors }) {
  const scale = useSharedValue(1);
  const fillProgress = useSharedValue(completed ? 1 : 0);
  
  useEffect(() => {
    fillProgress.value = withTiming(completed ? 1 : 0, { duration: 300 });
  }, [completed]);
  
  const handlePress = () => {
    if (!completed) {
      // Subtle haptic - confirmation, not celebration
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      // Gentle scale animation
      scale.value = withSpring(1.15, { damping: 10 }, () => {
        scale.value = withSpring(1);
      });
    } else {
      // Selection haptic for unchecking
      Haptics.selectionAsync();
    }
    onComplete();
  };
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: interpolateColor(
      fillProgress.value,
      [0, 1],
      ['transparent', colors.success]
    ),
    borderColor: interpolateColor(
      fillProgress.value,
      [0, 1],
      [colors.bg3, colors.success]
    ),
  }));
  
  return (
    <AnimatedTouchable
      style={[styles.check, animatedStyle]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {completed && <Ionicons name="checkmark" size={14} color="#fff" />}
    </AnimatedTouchable>
  );
}

// ═══════════════════════════════════════════════════════════════
// REFLECTION PROMPT COMPONENT
// ═══════════════════════════════════════════════════════════════
function ReflectionPrompt({ onDismiss, colors }) {
  const opacity = useSharedValue(0);
  const prompt = REFLECTION_PROMPTS[Math.floor(Math.random() * REFLECTION_PROMPTS.length)];
  
  useEffect(() => {
    opacity.value = withTiming(1, { duration: 400 });
    
    // Auto-dismiss after 5 seconds
    const timer = setTimeout(() => {
      opacity.value = withTiming(0, { duration: 300 }, () => {
        runOnJS(onDismiss)();
      });
    }, 5000);
    
    return () => clearTimeout(timer);
  }, []);
  
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));
  
  const handleDismiss = () => {
    Haptics.selectionAsync();
    opacity.value = withTiming(0, { duration: 200 }, () => {
      runOnJS(onDismiss)();
    });
  };
  
  return (
    <Animated.View style={[styles.reflectionContainer, { backgroundColor: colors.accentLight }, animatedStyle]}>
      <TouchableOpacity onPress={handleDismiss} activeOpacity={0.8}>
        <Text style={[styles.reflectionText, { color: colors.accent }]}>{prompt}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ═══════════════════════════════════════════════════════════════
// TASK CARD COMPONENT (for daily AI tasks)
// ═══════════════════════════════════════════════════════════════
export function TaskCard({ 
  task, 
  weekNum, 
  completed, 
  onComplete,
  taskId 
}) {
  const { colors, shadows, getStreakColor } = useTheme();
  const [twoMinOpen, setTwoMinOpen] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showReflection, setShowReflection] = useState(false);
  
  // Card fade animation
  const cardOpacity = useSharedValue(completed ? 0.6 : 1);
  
  useEffect(() => {
    cardOpacity.value = withTiming(completed ? 0.6 : 1, { duration: 400 });
  }, [completed]);
  
  const cardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
  }));
  
  const handleComplete = () => {
    if (!completed && shouldShowReflection()) {
      setShowReflection(true);
    }
    onComplete();
  };
  
  const handleTwoMin = async () => {
    if (loading) return;
    Haptics.selectionAsync();
    setLoading(true);
    try {
      const result = await getTwoMinuteVersion(task);
      setTwoMinOpen(result);
    } catch (error) {
      console.error('2-min failed:', error);
      setTwoMinOpen({
        twoMinuteVersion: `Just start "${task}" for 2 minutes. Set a timer.`,
        whyThisWorks: "Starting is the hardest part. Once you begin, momentum takes over."
      });
    }
    setLoading(false);
  };
  
  const dynamicStyles = {
    card: {
      backgroundColor: colors.card,
      ...shadows.sm,
    },
    text: { color: colors.text },
    text2: { color: colors.text2 },
    text3: { color: colors.text3 },
    tagAI: { backgroundColor: colors.purpleLight },
    tagAIText: { color: colors.purple },
    aiIcon: { backgroundColor: colors.purpleLight },
    twoMinTrigger: { borderTopColor: colors.bg2 },
    twoMinPopup: { backgroundColor: colors.warningLight, borderColor: colors.warning },
    btnPrimary: { backgroundColor: colors.accent },
    btnLight: { backgroundColor: colors.bg2 },
  };
  
  return (
    <Animated.View style={[styles.card, dynamicStyles.card, cardAnimatedStyle]}>
      <View style={styles.header}>
        <AnimatedCheckbox 
          completed={completed} 
          onComplete={handleComplete}
          colors={colors}
        />
        <View style={styles.content}>
          <Text style={[styles.text, dynamicStyles.text]}>{task}</Text>
          <View style={styles.meta}>
            <View style={[styles.tagAI, dynamicStyles.tagAI]}>
              <Text style={[styles.tagAIText, dynamicStyles.tagAIText]}>Week {weekNum}</Text>
            </View>
          </View>
        </View>
      </View>
      
      {showReflection && (
        <ReflectionPrompt 
          onDismiss={() => setShowReflection(false)} 
          colors={colors}
        />
      )}
      
      {!completed && !showReflection && (
        <TouchableOpacity 
          style={[styles.twoMinTrigger, dynamicStyles.twoMinTrigger]} 
          onPress={handleTwoMin}
          disabled={loading}
          activeOpacity={0.7}
        >
          <View style={[styles.aiIcon, dynamicStyles.aiIcon]}>
            {loading ? (
              <ActivityIndicator size="small" color={colors.purple} />
            ) : (
              <Ionicons name="sparkles" size={16} color={colors.purple} />
            )}
          </View>
          <View>
            <Text style={[styles.triggerTextBold, dynamicStyles.text]}>Can't start?</Text>
            <Text style={[styles.triggerTextSub, dynamicStyles.text3]}>Get 2-minute version</Text>
          </View>
        </TouchableOpacity>
      )}
      
      {twoMinOpen && !completed && (
        <View style={[styles.twoMinPopup, dynamicStyles.twoMinPopup]}>
          <View style={styles.twoMinBadge}>
            <Ionicons name="sparkles" size={12} color={colors.warning} />
            <Text style={[styles.twoMinBadgeText, { color: colors.warning }]}>2-Minute Version</Text>
          </View>
          <Text style={[styles.twoMinText, dynamicStyles.text]}>{twoMinOpen.twoMinuteVersion}</Text>
          <Text style={[styles.twoMinWhy, dynamicStyles.text2]}>{twoMinOpen.whyThisWorks}</Text>
          <View style={styles.twoMinActions}>
            <TouchableOpacity 
              style={[styles.btnPrimary, dynamicStyles.btnPrimary]} 
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                handleComplete();
              }}
            >
              <Text style={styles.btnPrimaryText}>Done</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.btnLight, dynamicStyles.btnLight]} 
              onPress={() => {
                Haptics.selectionAsync();
                setTwoMinOpen(null);
              }}
            >
              <Text style={[styles.btnLightText, dynamicStyles.text2]}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </Animated.View>
  );
}

// ═══════════════════════════════════════════════════════════════
// HABIT CARD COMPONENT - with inline 2-min button
// ═══════════════════════════════════════════════════════════════
export function HabitCard({
  habit,
  completed,
  streak,
  onComplete,
  onDelete
}) {
  const { colors, shadows, getStreakColor } = useTheme();
  const [twoMinOpen, setTwoMinOpen] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showReflection, setShowReflection] = useState(false);
  
  // Card fade animation
  const cardOpacity = useSharedValue(completed ? 0.6 : 1);
  
  useEffect(() => {
    cardOpacity.value = withTiming(completed ? 0.6 : 1, { duration: 400 });
  }, [completed]);
  
  const cardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
  }));
  
  const handleComplete = () => {
    if (!completed && shouldShowReflection()) {
      setShowReflection(true);
    }
    onComplete();
  };
  
  const handleTwoMin = async () => {
    if (loading) return;
    Haptics.selectionAsync();
    setLoading(true);
    try {
      const result = await getTwoMinuteHabit(habit.name, `${habit.amount} ${habit.unit}`);
      setTwoMinOpen(result);
    } catch (error) {
      console.error('2-min habit failed:', error);
      setTwoMinOpen({
        twoMinuteVersion: `Just do 2 minutes of ${habit.name.toLowerCase()}.`,
        whyThisWorks: "Showing up matters more than duration."
      });
    }
    setLoading(false);
  };
  
  // Get streak color based on depth
  const streakColor = getStreakColor(streak);
  
  const dynamicStyles = {
    card: {
      backgroundColor: colors.card,
      ...shadows.sm,
    },
    text: { color: colors.text },
    text2: { color: colors.text2 },
    text3: { color: colors.text3 },
    streakBadge: { 
      backgroundColor: colors.bg2,
      borderWidth: 1,
      borderColor: streakColor,
    },
    streakText: { color: streakColor },
    twoMinBtn: { 
      backgroundColor: colors.bg2, 
      borderColor: colors.bg3 
    },
    twoMinPopup: { backgroundColor: colors.warningLight, borderColor: colors.warning },
    btnPrimary: { backgroundColor: colors.accent },
    btnLight: { backgroundColor: colors.bg2 },
  };
  
  return (
    <Animated.View style={[styles.card, dynamicStyles.card, cardAnimatedStyle]}>
      <View style={styles.habitRow}>
        <AnimatedCheckbox 
          completed={completed} 
          onComplete={handleComplete}
          colors={colors}
        />
        <View style={styles.habitInfo}>
          <Text style={[styles.habitName, dynamicStyles.text]}>{habit.name}</Text>
          <Text style={[styles.habitMeta, dynamicStyles.text3]}>{habit.amount} {habit.unit}</Text>
        </View>
        
        {/* Identity-based streak badge: "Xd" not "🔥 X" */}
        {streak > 0 && (
          <View style={[styles.streakBadge, dynamicStyles.streakBadge]}>
            <Text style={[styles.streakText, dynamicStyles.streakText]}>{streak}d</Text>
          </View>
        )}
        
        {/* Inline 2-min button */}
        {!completed && (
          <TouchableOpacity 
            style={[styles.twoMinBtn, dynamicStyles.twoMinBtn]}
            onPress={handleTwoMin}
            disabled={loading}
            activeOpacity={0.7}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : (
              <Ionicons name="sparkles" size={16} color={colors.accent} />
            )}
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={styles.deleteBtn} 
          onPress={() => {
            Haptics.selectionAsync();
            onDelete();
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={16} color={colors.text3} />
        </TouchableOpacity>
      </View>
      
      {showReflection && (
        <ReflectionPrompt 
          onDismiss={() => setShowReflection(false)} 
          colors={colors}
        />
      )}
      
      {/* 2-min popup when open */}
      {twoMinOpen && !completed && (
        <View style={[styles.twoMinPopup, dynamicStyles.twoMinPopup]}>
          <View style={styles.twoMinBadge}>
            <Ionicons name="sparkles" size={12} color={colors.warning} />
            <Text style={[styles.twoMinBadgeText, { color: colors.warning }]}>2-Minute Version</Text>
          </View>
          <Text style={[styles.twoMinText, dynamicStyles.text]}>{twoMinOpen.twoMinuteVersion}</Text>
          <Text style={[styles.twoMinWhy, dynamicStyles.text2]}>{twoMinOpen.whyThisWorks}</Text>
          <View style={styles.twoMinActions}>
            <TouchableOpacity 
              style={[styles.btnPrimary, dynamicStyles.btnPrimary]} 
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                handleComplete();
              }}
            >
              <Text style={styles.btnPrimaryText}>Done</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.btnLight, dynamicStyles.btnLight]} 
              onPress={() => {
                Haptics.selectionAsync();
                setTwoMinOpen(null);
              }}
            >
              <Text style={[styles.btnLightText, dynamicStyles.text2]}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </Animated.View>
  );
}

// ═══════════════════════════════════════════════════════════════
// QUOTE CARD COMPONENT
// ═══════════════════════════════════════════════════════════════
export function QuoteCard({ text, author }) {
  const { colors, shadows } = useTheme();
  
  return (
    <View style={[
      styles.quoteCard, 
      { 
        backgroundColor: colors.card, 
        borderLeftColor: colors.accent,
        ...shadows.sm 
      }
    ]}>
      <Text style={[styles.quoteText, { color: colors.text }]}>"{text}"</Text>
      <Text style={[styles.quoteAuthor, { color: colors.text3 }]}>— {author}</Text>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  card: {
    borderRadius: radius.md,
    padding: 16,
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  habitInfo: {
    flex: 1,
  },
  habitName: {
    fontSize: 15,
    fontWeight: '500',
  },
  habitMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  check: {
    width: 26,
    height: 26,
    borderWidth: 2,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  text: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  tagAI: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagAIText: {
    fontSize: 12,
    fontWeight: '600',
  },
  streakBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  streakText: {
    fontSize: 12,
    fontWeight: '600',
  },
  twoMinBtn: {
    width: 32,
    height: 32,
    borderWidth: 1,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBtn: {
    padding: 4,
  },
  twoMinTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  aiIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  triggerTextBold: {
    fontSize: 13,
    fontWeight: '600',
  },
  triggerTextSub: {
    fontSize: 11,
  },
  twoMinPopup: {
    borderWidth: 2,
    borderRadius: radius.md,
    padding: 14,
    marginTop: 12,
  },
  twoMinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  twoMinBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  twoMinText: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
    marginBottom: 8,
  },
  twoMinWhy: {
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 18,
    marginBottom: 12,
  },
  twoMinActions: {
    flexDirection: 'row',
    gap: 8,
  },
  btnPrimary: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  btnPrimaryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  btnLight: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  btnLightText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Reflection prompt styles
  reflectionContainer: {
    marginTop: 12,
    padding: 12,
    borderRadius: radius.sm,
  },
  reflectionText: {
    fontSize: 14,
    fontWeight: '500',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  // Quote card
  quoteCard: {
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
  },
  quoteText: {
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 22,
    marginBottom: 6,
  },
  quoteAuthor: {
    fontSize: 12,
    fontWeight: '500',
  },
});
