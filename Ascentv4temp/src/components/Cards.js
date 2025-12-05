import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  interpolateColor,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useHaptics } from '../hooks/useHaptics';
import { REFLECTION_PROMPTS, shouldShowReflection } from '../constants/theme';
import { getTwoMinuteVersion, getTwoMinuteHabit } from '../services/ai';
import { getCelebrationType } from '../services/rewards';

// ═══════════════════════════════════════════════════════════════
// VARIABLE CELEBRATION ANIMATIONS
// ═══════════════════════════════════════════════════════════════
const CELEBRATION_CONFIGS = {
  subtle: {
    scale: 1.05,
    duration: 200,
  },
  medium: {
    scale: 1.15,
    duration: 300,
  },
  special: {
    scale: 1.25,
    duration: 400,
  },
};

// ═══════════════════════════════════════════════════════════════
// ANIMATED CHECKBOX COMPONENT (using Reanimated)
// ═══════════════════════════════════════════════════════════════
function AnimatedCheckbox({ completed, onComplete, colors }) {
  const haptics = useHaptics();
  const scale = useSharedValue(1);
  const fillProgress = useSharedValue(completed ? 1 : 0);
  const rotation = useSharedValue(0);

  useEffect(() => {
    fillProgress.value = withTiming(completed ? 1 : 0, { duration: 300 });
  }, [completed]);

  const handlePress = () => {
    if (!completed) {
      // Variable celebration animation
      const celebrationType = getCelebrationType();
      const config = CELEBRATION_CONFIGS[celebrationType.animation] || CELEBRATION_CONFIGS.subtle;

      // Apply variable haptic
      if (celebrationType.haptic === 'heavy') {
        haptics.heavy();
      } else if (celebrationType.haptic === 'medium') {
        haptics.medium();
      } else {
        haptics.light();
      }

      // Variable scale animation
      scale.value = withSequence(
        withSpring(config.scale, { damping: 8, stiffness: 400 }),
        withSpring(1, { damping: 12, stiffness: 200 })
      );

      // Rare: add rotation for special celebrations
      if (celebrationType.animation === 'special') {
        rotation.value = withSequence(
          withTiming(10, { duration: 100 }),
          withTiming(-10, { duration: 100 }),
          withTiming(0, { duration: 100 })
        );
      }
    } else {
      haptics.select();
    }
    onComplete();
  };

  const animatedStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      fillProgress.value,
      [0, 1],
      ['transparent', colors.success]
    );
    const borderColor = interpolateColor(
      fillProgress.value,
      [0, 1],
      [colors.bg3, colors.success]
    );

    return {
      transform: [
        { scale: scale.value },
        { rotate: `${rotation.value}deg` },
      ],
      backgroundColor,
      borderColor,
    };
  });

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
      <Animated.View style={[styles.check, animatedStyle]}>
        {completed && <Ionicons name="checkmark" size={14} color="#fff" />}
      </Animated.View>
    </TouchableOpacity>
  );
}

// ═══════════════════════════════════════════════════════════════
// REFLECTION PROMPT COMPONENT (using Reanimated)
// ═══════════════════════════════════════════════════════════════
function ReflectionPrompt({ onDismiss, colors }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(10);
  const prompt = REFLECTION_PROMPTS[Math.floor(Math.random() * REFLECTION_PROMPTS.length)];

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 400 });
    translateY.value = withTiming(0, { duration: 400 });

    const timer = setTimeout(() => {
      opacity.value = withTiming(0, { duration: 300 });
      translateY.value = withTiming(10, { duration: 300 }, () => {
        runOnJS(onDismiss)();
      });
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    Haptics.selectionAsync();
    opacity.value = withTiming(0, { duration: 200 });
    translateY.value = withTiming(10, { duration: 200 }, () => {
      runOnJS(onDismiss)();
    });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.reflectionContainer, { backgroundColor: colors.accentLight }, animatedStyle]}>
      <TouchableOpacity onPress={handleDismiss} activeOpacity={0.8}>
        <Text style={[styles.reflectionText, { color: colors.accent }]}>{prompt}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ═══════════════════════════════════════════════════════════════
// TWO-MINUTE POPUP COMPONENT
// ═══════════════════════════════════════════════════════════════
function TwoMinPopup({ content, onComplete, onClose, colors }) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.95);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 200 });
    scale.value = withSpring(1, { damping: 15 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  if (!content) return null;

  return (
    <Animated.View style={[styles.twoMinPopup, { backgroundColor: colors.warningLight, borderColor: colors.warning }, animatedStyle]}>
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
    </Animated.View>
  );
}

// ═══════════════════════════════════════════════════════════════
// PROGRESSIVE DISCLOSURE ACTIONS (revealed on long-press)
// ═══════════════════════════════════════════════════════════════
function ProgressiveActions({ visible, onTwoMin, onEdit, onDelete, loading, colors }) {
  const opacity = useSharedValue(0);
  const height = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(visible ? 1 : 0, { duration: 200 });
    height.value = withTiming(visible ? 44 : 0, { duration: 200 });
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    height: height.value,
    overflow: 'hidden',
  }));

  return (
    <Animated.View style={[styles.progressiveActions, animatedStyle]}>
      <TouchableOpacity
        style={[styles.actionBtn, { backgroundColor: colors.bg2 }]}
        onPress={onTwoMin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color={colors.accent} />
        ) : (
          <>
            <Ionicons name="sparkles" size={14} color={colors.accent} />
            <Text style={[styles.actionBtnText, { color: colors.accent }]}>2-min</Text>
          </>
        )}
      </TouchableOpacity>

      {onEdit && (
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.bg2 }]}
          onPress={onEdit}
        >
          <Ionicons name="pencil" size={14} color={colors.text2} />
          <Text style={[styles.actionBtnText, { color: colors.text2 }]}>Edit</Text>
        </TouchableOpacity>
      )}

      {onDelete && (
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.bg2 }]}
          onPress={onDelete}
        >
          <Ionicons name="trash-outline" size={14} color={colors.danger} />
          <Text style={[styles.actionBtnText, { color: colors.danger }]}>Delete</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

// ═══════════════════════════════════════════════════════════════
// TASK CARD COMPONENT (with Reanimated)
// ═══════════════════════════════════════════════════════════════
export function TaskCard({
  task,
  weekNum,
  completed,
  onComplete,
  taskId,
  onTwoMinComplete, // Callback when 2-min version is completed
}) {
  const { colors, shadows } = useTheme();
  const [twoMinOpen, setTwoMinOpen] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showReflection, setShowReflection] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const cardOpacity = useSharedValue(completed ? 0.6 : 1);
  const cardScale = useSharedValue(1);

  useEffect(() => {
    cardOpacity.value = withTiming(completed ? 0.6 : 1, { duration: 400 });
  }, [completed]);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ scale: cardScale.value }],
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
    setExpanded(false);
  };

  const handleLongPress = () => {
    if (!completed) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setExpanded(!expanded);
    }
  };

  return (
    <Pressable onLongPress={handleLongPress} delayLongPress={400}>
      <Animated.View style={[styles.card, { backgroundColor: colors.card, ...shadows.sm }, cardAnimatedStyle]}>
        {/* Main row - checkbox and content */}
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

          {/* Quick 2-min button (always visible when not completed) */}
          {!completed && !expanded && (
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

        {/* Progressive disclosure actions */}
        <ProgressiveActions
          visible={expanded && !completed}
          onTwoMin={handleTwoMin}
          loading={loading}
          colors={colors}
        />

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
            onComplete={() => {
              handleComplete();
              // Trigger rave mode callback for 2-min completion
              if (onTwoMinComplete) {
                onTwoMinComplete(task);
              }
            }}
            onClose={() => setTwoMinOpen(null)}
            colors={colors}
          />
        )}
      </Animated.View>
    </Pressable>
  );
}

// ═══════════════════════════════════════════════════════════════
// HABIT CARD COMPONENT - with progressive disclosure & reanimated
// ═══════════════════════════════════════════════════════════════
export function HabitCard({
  habit,
  completed,
  streak,
  streakStatus,
  streakColor,
  onComplete,
  onDelete,
  poolLevel,
  onTwoMinComplete, // Callback when 2-min version is completed
}) {
  const { colors, shadows, getStreakColor } = useTheme();
  const [twoMinOpen, setTwoMinOpen] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showReflection, setShowReflection] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const cardOpacity = useSharedValue(completed ? 0.6 : 1);
  const cardScale = useSharedValue(1);

  useEffect(() => {
    cardOpacity.value = withTiming(completed ? 0.6 : 1, { duration: 400 });
  }, [completed]);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ scale: cardScale.value }],
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
    setExpanded(false);
  };

  const handleLongPress = () => {
    if (!completed) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setExpanded(!expanded);
    }
  };

  const handleDelete = () => {
    Haptics.selectionAsync();
    setExpanded(false);
    onDelete();
  };

  // Use provided streak color or fall back to theme color
  const displayStreakColor = streakColor || getStreakColor(streak);

  // Show 2-min automatically when pool is low and habit not complete
  const showTwoMinPrompt = !completed && poolLevel && poolLevel < 40;

  // Calculate energy match indicator
  // habit.resistance: 1-10 scale where 10 is hardest
  const habitDifficulty = habit.resistance || 5; // Default mid-range
  const getEnergyMatch = () => {
    if (!poolLevel) return null;
    // High pool (70+) matches well with hard habits (7-10)
    // Medium pool (40-69) matches well with medium habits (4-6)
    // Low pool (<40) matches well with easy habits (1-3)
    if (poolLevel >= 70 && habitDifficulty >= 7) return { match: 'great', icon: 'flash', color: colors.success };
    if (poolLevel >= 40 && poolLevel < 70 && habitDifficulty >= 4 && habitDifficulty <= 6) return { match: 'good', icon: 'sunny', color: colors.warning };
    if (poolLevel < 40 && habitDifficulty <= 3) return { match: 'good', icon: 'leaf', color: colors.success };
    if (poolLevel < 40 && habitDifficulty >= 7) return { match: 'hard', icon: 'battery-dead', color: colors.error || '#ef4444' };
    if (poolLevel >= 70 && habitDifficulty <= 3) return { match: 'easy', icon: 'rocket', color: colors.accent };
    return null;
  };
  const energyMatch = getEnergyMatch();

  return (
    <Pressable onLongPress={handleLongPress} delayLongPress={400}>
      <Animated.View style={[styles.card, { backgroundColor: colors.card, ...shadows.sm }, cardAnimatedStyle]}>
        {/* Energy match indicator - shows when there's a notable match/mismatch */}
        {energyMatch && !completed && !twoMinOpen && !expanded && (
          <View style={[styles.energyMatchBar, { backgroundColor: energyMatch.color + '15' }]}>
            <Ionicons name={energyMatch.icon} size={12} color={energyMatch.color} />
            <Text style={[styles.energyMatchText, { color: energyMatch.color }]}>
              {energyMatch.match === 'great' ? 'Great time for this!' :
               energyMatch.match === 'good' ? 'Good match for your energy' :
               energyMatch.match === 'easy' ? 'Could challenge yourself more' :
               energyMatch.match === 'hard' ? 'Consider 2-min version' : ''}
            </Text>
          </View>
        )}

        {/* Low pool suggestion (only show if no energy match indicator) */}
        {showTwoMinPrompt && !energyMatch && !twoMinOpen && !expanded && (
          <View style={[styles.lowPoolHint, { backgroundColor: colors.warningLight }]}>
            <Text style={[styles.lowPoolHintText, { color: colors.warning }]}>
              Low reserves - try the 2-min version
            </Text>
          </View>
        )}

        {/* Main row - checkbox, content, streak */}
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

          {/* Streak badge with status indicator */}
          {streak > 0 && (
            <View style={[
              styles.streakBadge,
              {
                backgroundColor: colors.bg2,
                borderColor: displayStreakColor,
              }
            ]}>
              <Text style={[styles.streakText, { color: displayStreakColor }]}>{streak}d</Text>
            </View>
          )}

          {/* Quick 2-min button (visible when not completed and not expanded) */}
          {!completed && !expanded && (
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
        </View>

        {/* Progressive disclosure actions (revealed on long-press) */}
        <ProgressiveActions
          visible={expanded && !completed}
          onTwoMin={handleTwoMin}
          onDelete={handleDelete}
          loading={loading}
          colors={colors}
        />

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
            onComplete={() => {
              handleComplete();
              // Trigger rave mode callback for 2-min completion
              if (onTwoMinComplete) {
                onTwoMinComplete(habit);
              }
            }}
            onClose={() => setTwoMinOpen(null)}
            colors={colors}
          />
        )}
      </Animated.View>
    </Pressable>
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
      <Text style={[styles.quoteAuthor, { color: colors.text3 }]}>- {author}</Text>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
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

  // Inline 2-min button
  twoMinBtn: {
    width: 32,
    height: 32,
    borderWidth: 1,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Progressive disclosure actions
  progressiveActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '500',
  },

  // Delete button (hidden by default, shown in progressive actions)
  deleteBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // 2-min popup
  twoMinPopup: {
    borderWidth: 2,
    borderRadius: 12,
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
    borderRadius: 8,
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
    borderRadius: 8,
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
    borderRadius: 8,
  },
  reflectionText: {
    fontSize: 14,
    fontWeight: '500',
    fontStyle: 'italic',
    textAlign: 'center',
  },

  // Energy match indicator
  energyMatchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 10,
    marginTop: -4,
  },
  energyMatchText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Low pool hint
  lowPoolHint: {
    padding: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 10,
    marginTop: -4,
  },
  lowPoolHintText: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Quote card
  quoteCard: {
    borderRadius: 16,
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
