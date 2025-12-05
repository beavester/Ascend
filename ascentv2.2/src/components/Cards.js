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
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      scale.value = withSpring(1.15, { damping: 10 }, () => {
        scale.value = withSpring(1);
      });
    } else {
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
// TWO-MINUTE POPUP COMPONENT (shared between Task and Habit)
// ═══════════════════════════════════════════════════════════════
function TwoMinPopup({ content, onComplete, onClose, colors }) {
  if (!content) return null;
  
  return (
    <View style={[styles.twoMinPopup, { backgroundColor: colors.warningLight, borderColor: colors.warning }]}>
      <View style={styles.twoMinBadge}>
        <Ionicons name="sparkles" size={12} color={colors.warning} />
        <Text style={[styles.twoMinBadgeText, { color: colors.warning }]}>2-Minute Version</Text>
      </View>
      <Text style={[styles.twoMinText, { color: colors.text }]}>{content.twoMinuteVersion}</Text>
      <Text style={[styles.twoMinWhy, { color: colors.text2 }]}>{content.whyThisWorks}</Text>
      <View style={styles.twoMinActions}>
        <TouchableOpacity 
          style={[styles.btnPrimary, { backgroundColor: colors.accent }]} 
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onComplete();
          }}
        >
          <Text style={styles.btnPrimaryText}>Done</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.btnLight, { backgroundColor: colors.bg2 }]} 
          onPress={() => {
            Haptics.selectionAsync();
            onClose();
          }}
        >
          <Text style={[styles.btnLightText, { color: colors.text2 }]}>Close</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════
// TASK CARD COMPONENT (for daily AI tasks)
// Now uses inline 2-min button in the same row
// ═══════════════════════════════════════════════════════════════
export function TaskCard({ 
  task, 
  weekNum, 
  completed, 
  onComplete,
  taskId 
}) {
  const { colors, shadows } = useTheme();
  const [twoMinOpen, setTwoMinOpen] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showReflection, setShowReflection] = useState(false);
  
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
  
  return (
    <Animated.View style={[styles.card, { backgroundColor: colors.card, ...shadows.sm }, cardAnimatedStyle]}>
      {/* Main row - checkbox, content, 2-min button all inline */}
      <View style={styles.itemRow}>
        <AnimatedCheckbox 
          completed={completed} 
          onComplete={handleComplete}
          colors={colors}
        />
        <View style={styles.itemContent}>
          <Text style={[styles.itemText, { color: colors.text }]}>{task}</Text>
          <View style={styles.itemMeta}>
            <View style={[styles.tagAI, { backgroundColor: colors.purpleLight }]}>
              <Text style={[styles.tagAIText, { color: colors.purple }]}>Week {weekNum}</Text>
            </View>
          </View>
        </View>
        
        {/* Inline 2-min button */}
        {!completed && (
          <TouchableOpacity 
            style={[styles.twoMinBtn, { backgroundColor: colors.bg2, borderColor: colors.bg3 }]}
            onPress={handleTwoMin}
            disabled={loading}
            activeOpacity={0.7}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.purple} />
            ) : (
              <Ionicons name="sparkles" size={16} color={colors.purple} />
            )}
          </TouchableOpacity>
        )}
      </View>
      
      {showReflection && (
        <ReflectionPrompt 
          onDismiss={() => setShowReflection(false)} 
          colors={colors}
        />
      )}
      
      {/* 2-min popup when open */}
      {twoMinOpen && !completed && (
        <TwoMinPopup 
          content={twoMinOpen}
          onComplete={handleComplete}
          onClose={() => setTwoMinOpen(null)}
          colors={colors}
        />
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
  
  const streakColor = getStreakColor(streak);
  
  return (
    <Animated.View style={[styles.card, { backgroundColor: colors.card, ...shadows.sm }, cardAnimatedStyle]}>
      {/* Main row - checkbox, content, streak, 2-min button, delete all inline */}
      <View style={styles.itemRow}>
        <AnimatedCheckbox 
          completed={completed} 
          onComplete={handleComplete}
          colors={colors}
        />
        <View style={styles.itemContent}>
          <Text style={[styles.itemText, { color: colors.text }]}>{habit.name}</Text>
          <Text style={[styles.itemSubtext, { color: colors.text3 }]}>{habit.amount} {habit.unit}</Text>
        </View>
        
        {/* Streak badge */}
        {streak > 0 && (
          <View style={[styles.streakBadge, { backgroundColor: colors.bg2, borderColor: streakColor }]}>
            <Text style={[styles.streakText, { color: streakColor }]}>{streak}d</Text>
          </View>
        )}
        
        {/* Inline 2-min button */}
        {!completed && (
          <TouchableOpacity 
            style={[styles.twoMinBtn, { backgroundColor: colors.bg2, borderColor: colors.bg3 }]}
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
        <TwoMinPopup 
          content={twoMinOpen}
          onComplete={handleComplete}
          onClose={() => setTwoMinOpen(null)}
          colors={colors}
        />
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
    padding: 14,
    marginBottom: 10,
  },
  
  // Unified row layout for both Task and Habit cards
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemContent: {
    flex: 1,
  },
  itemText: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 20,
  },
  itemSubtext: {
    fontSize: 12,
    marginTop: 2,
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  
  // Checkbox
  check: {
    width: 26,
    height: 26,
    borderWidth: 2,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Tags
  tagAI: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagAIText: {
    fontSize: 11,
    fontWeight: '600',
  },
  
  // Streak badge
  streakBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  streakText: {
    fontSize: 12,
    fontWeight: '600',
  },
  
  // Inline 2-min button (same size as delete button area)
  twoMinBtn: {
    width: 32,
    height: 32,
    borderWidth: 1,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Delete button
  deleteBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // 2-min popup
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
  
  // Reflection prompt
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
