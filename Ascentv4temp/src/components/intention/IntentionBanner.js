// Daily Intention Banner Component
// Per spec: "Today I will..." - a daily micro-commitment that focuses attention

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { typography, spacing, radius } from '../../constants/theme';
import * as Haptics from 'expo-haptics';

// ═══════════════════════════════════════════════════════════════
// INTENTION BANNER - Daily micro-commitment
// ═══════════════════════════════════════════════════════════════

export const IntentionBanner = ({
  intention,
  onSetIntention,
  isComplete,
  onToggleComplete,
  style,
}) => {
  const { colors, isDark } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(intention || '');
  const inputRef = useRef(null);

  // Animations
  const glowAnim = useRef(new Animated.Value(0)).current;
  const checkAnim = useRef(new Animated.Value(isComplete ? 1 : 0)).current;
  const celebrateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const borderAnim = useRef(new Animated.Value(0)).current;

  // Subtle glow pulse when intention is set but not complete
  useEffect(() => {
    if (intention && !isComplete) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 2500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 2500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [intention, isComplete]);

  // Border glow animation when editing
  useEffect(() => {
    if (isEditing) {
      const borderPulse = Animated.loop(
        Animated.sequence([
          Animated.timing(borderAnim, {
            toValue: 1,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
          Animated.timing(borderAnim, {
            toValue: 0.4,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
        ])
      );
      borderPulse.start();
      return () => borderPulse.stop();
    }
  }, [isEditing]);

  // Check animation with celebration burst
  useEffect(() => {
    if (isComplete) {
      // Celebrate animation sequence
      Animated.parallel([
        Animated.spring(checkAnim, {
          toValue: 1,
          friction: 4,
          tension: 300,
          useNativeDriver: false,
        }),
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.02,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(celebrateAnim, {
            toValue: 1,
            duration: 400,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
          }),
          Animated.timing(celebrateAnim, {
            toValue: 0,
            duration: 600,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: false,
          }),
        ]),
      ]).start();
    } else {
      Animated.timing(checkAnim, {
        toValue: 0,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    }
  }, [isComplete]);

  const handleSubmit = () => {
    const trimmed = editText.trim();
    if (trimmed) {
      onSetIntention(trimmed);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setIsEditing(false);
  };

  const handleToggle = () => {
    if (!intention) return;
    onToggleComplete(!isComplete);
    if (!isComplete) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.2],
  });

  const checkScale = checkAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.7, 1.15, 1],
  });

  const celebrateOpacity = celebrateAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.4, 0],
  });

  const celebrateScale = celebrateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.8],
  });

  const borderOpacity = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 1],
  });

  // Empty state - prompt to set intention
  if (!intention && !isEditing) {
    return (
      <TouchableOpacity
        style={[styles.container, { backgroundColor: colors.bg2, borderColor: colors.border }, style]}
        onPress={() => {
          setIsEditing(true);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setTimeout(() => inputRef.current?.focus(), 100);
        }}
        activeOpacity={0.8}
      >
        <View style={styles.promptContent}>
          <View style={[styles.promptIconContainer, { backgroundColor: colors.accentLight || 'rgba(99, 102, 241, 0.15)' }]}>
            <Ionicons name="sparkles" size={20} color={colors.accent} />
          </View>
          <Text style={[styles.promptLabel, { color: colors.text3 }]}>
            Set your intention for today
          </Text>
          <Text style={[styles.promptText, { color: colors.text2 }]}>
            Today I will...
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  // Editing state
  if (isEditing) {
    return (
      <Animated.View style={[styles.editWrapper, { opacity: borderOpacity }]}>
        <LinearGradient
          colors={[colors.accent, colors.accentLight || colors.accent, colors.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.editGradientBorder}
        >
          <View style={[styles.editContainer, { backgroundColor: colors.bg2 }, style]}>
            <View style={styles.editHeader}>
              <Ionicons name="pencil" size={14} color={colors.accent} />
              <Text style={[styles.todayLabel, { color: colors.accent }]}>Today I will...</Text>
            </View>
            <TextInput
              ref={inputRef}
              style={[styles.input, { color: colors.text }]}
              value={editText}
              onChangeText={setEditText}
              placeholder="enter your intention"
              placeholderTextColor={colors.text3}
              autoFocus
              onSubmitEditing={handleSubmit}
              returnKeyType="done"
              multiline={false}
              maxLength={100}
            />
            <View style={styles.editActions}>
              <TouchableOpacity
                style={[styles.editButton, { backgroundColor: colors.bg3 }]}
                onPress={() => {
                  setIsEditing(false);
                  setEditText(intention || '');
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Text style={[styles.editButtonText, { color: colors.text2 }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.editButton, styles.setButton, { backgroundColor: colors.accent }]}
                onPress={handleSubmit}
              >
                <Ionicons name="checkmark" size={16} color="#fff" style={{ marginRight: 4 }} />
                <Text style={[styles.editButtonText, { color: '#fff' }]}>Set</Text>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
    );
  }

  // Display state with intention set
  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[styles.container, { backgroundColor: colors.bg2, borderColor: isComplete ? colors.success || colors.accent : colors.border }, style]}
        onPress={handleToggle}
        onLongPress={() => {
          setEditText(intention);
          setIsEditing(true);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }}
        activeOpacity={0.8}
      >
        {/* Subtle glow when active */}
        <Animated.View
          style={[
            styles.glowOverlay,
            {
              backgroundColor: colors.accent,
              opacity: isComplete ? 0 : glowOpacity,
            },
          ]}
        />

        {/* Celebration burst when completing */}
        <Animated.View
          style={[
            styles.celebrationBurst,
            {
              backgroundColor: colors.success || colors.accent,
              opacity: celebrateOpacity,
              transform: [{ scale: celebrateScale }],
            },
          ]}
        />

        <View style={styles.intentionContent}>
          {/* Enhanced Checkbox */}
          <TouchableOpacity style={styles.checkboxContainer} onPress={handleToggle}>
            <Animated.View
              style={[
                styles.checkbox,
                {
                  backgroundColor: isComplete ? (colors.success || colors.accent) : 'transparent',
                  borderColor: isComplete ? (colors.success || colors.accent) : colors.border,
                  transform: [{ scale: checkScale }],
                },
              ]}
            >
              {isComplete && (
                <Ionicons name="checkmark" size={16} color="#fff" />
              )}
            </Animated.View>
          </TouchableOpacity>

          {/* Intention text */}
          <View style={styles.textContainer}>
            <Text style={[styles.todayLabelSmall, { color: colors.text3 }]}>
              Today I will...
            </Text>
            <Animated.Text
              style={[
                styles.intentionText,
                {
                  color: isComplete ? colors.text3 : colors.text,
                  textDecorationLine: isComplete ? 'line-through' : 'none',
                },
              ]}
              numberOfLines={2}
            >
              {intention}
            </Animated.Text>
          </View>
        </View>

        {/* Hint with icon */}
        <View style={styles.hintContainer}>
          {isComplete ? (
            <>
              <Ionicons name="checkmark-circle" size={12} color={colors.success || colors.accent} />
              <Text style={[styles.hint, { color: colors.success || colors.accent }]}>Complete!</Text>
            </>
          ) : (
            <>
              <Ionicons name="hand-left-outline" size={12} color={colors.text3} />
              <Text style={[styles.hint, { color: colors.text3 }]}>Tap to complete</Text>
            </>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  container: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    overflow: 'hidden',
  },
  editWrapper: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  editGradientBorder: {
    padding: 2,
    borderRadius: radius.lg,
  },
  editContainer: {
    borderRadius: radius.lg - 2,
    padding: spacing.md,
  },
  editHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.xs,
  },
  glowOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: radius.lg,
  },
  celebrationBurst: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 50,
    height: 50,
    marginLeft: -25,
    marginTop: -25,
    borderRadius: 25,
  },
  promptContent: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  promptIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  promptLabel: {
    ...typography.caption,
    marginBottom: 6,
  },
  promptText: {
    ...typography.h3,
    fontWeight: '600',
  },
  todayLabel: {
    ...typography.label,
    letterSpacing: 0.5,
  },
  todayLabelSmall: {
    ...typography.caption,
    marginBottom: 2,
  },
  input: {
    ...typography.body,
    paddingVertical: spacing.sm,
    paddingHorizontal: 0,
    fontSize: 16,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  editButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  setButton: {
    minWidth: 80,
    justifyContent: 'center',
  },
  editButtonText: {
    ...typography.bodySmall,
    fontWeight: '600',
  },
  intentionContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkboxContainer: {
    marginRight: spacing.md,
    paddingTop: 2,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: radius.md,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  intentionText: {
    ...typography.body,
    fontWeight: '500',
    fontSize: 15,
    lineHeight: 22,
  },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: spacing.sm,
  },
  hint: {
    ...typography.caption,
    fontWeight: '500',
  },
});

export default IntentionBanner;
