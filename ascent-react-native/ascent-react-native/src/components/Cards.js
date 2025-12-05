import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { colors, radius, shadows } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { getTwoMinuteVersion, getTwoMinuteHabit } from '../services/ai';

// Task Card Component (for daily AI tasks)
export function TaskCard({ 
  task, 
  weekNum, 
  completed, 
  onComplete,
  taskId 
}) {
  const [twoMinOpen, setTwoMinOpen] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const handleTwoMin = async () => {
    if (loading) return;
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
    <View style={[styles.card, completed && styles.cardCompleted]}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={[styles.check, completed && styles.checkDone]} 
          onPress={onComplete}
        >
          {completed && <Ionicons name="checkmark" size={14} color="#fff" />}
        </TouchableOpacity>
        <View style={styles.content}>
          <Text style={styles.text}>{task}</Text>
          <View style={styles.meta}>
            <View style={styles.tagAI}>
              <Text style={styles.tagAIText}>Week {weekNum}</Text>
            </View>
          </View>
        </View>
      </View>
      
      {!completed && (
        <TouchableOpacity 
          style={styles.twoMinTrigger} 
          onPress={handleTwoMin}
          disabled={loading}
        >
          <View style={styles.aiIcon}>
            {loading ? (
              <ActivityIndicator size="small" color={colors.purple} />
            ) : (
              <Ionicons name="sparkles" size={16} color={colors.purple} />
            )}
          </View>
          <View>
            <Text style={styles.triggerTextBold}>Can't start?</Text>
            <Text style={styles.triggerTextSub}>Get 2-minute version</Text>
          </View>
        </TouchableOpacity>
      )}
      
      {twoMinOpen && !completed && (
        <View style={styles.twoMinPopup}>
          <View style={styles.twoMinBadge}>
            <Ionicons name="sparkles" size={12} color={colors.warning} />
            <Text style={styles.twoMinBadgeText}>2-Minute Version</Text>
          </View>
          <Text style={styles.twoMinText}>{twoMinOpen.twoMinuteVersion}</Text>
          <Text style={styles.twoMinWhy}>{twoMinOpen.whyThisWorks}</Text>
          <View style={styles.twoMinActions}>
            <TouchableOpacity style={styles.btnPrimary} onPress={onComplete}>
              <Text style={styles.btnPrimaryText}>Did It</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnLight} onPress={() => setTwoMinOpen(null)}>
              <Text style={styles.btnLightText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

// Habit Card Component
export function HabitCard({
  habit,
  completed,
  streak,
  onComplete,
  onDelete
}) {
  const [twoMinOpen, setTwoMinOpen] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const handleTwoMin = async () => {
    if (loading) return;
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
  
  return (
    <View style={[styles.card, completed && styles.cardCompleted]}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={[styles.check, completed && styles.checkDone]} 
          onPress={onComplete}
        >
          {completed && <Ionicons name="checkmark" size={14} color="#fff" />}
        </TouchableOpacity>
        <View style={styles.content}>
          <Text style={styles.text}>{habit.name}</Text>
          <View style={styles.meta}>
            <Text style={styles.metaText}>{habit.amount} {habit.unit}</Text>
            {streak > 0 && (
              <View style={styles.streakBadge}>
                <Text style={styles.streakText}>🔥 {streak}</Text>
              </View>
            )}
          </View>
        </View>
        <TouchableOpacity style={styles.deleteBtn} onPress={onDelete}>
          <Ionicons name="trash-outline" size={16} color={colors.text3} />
        </TouchableOpacity>
      </View>
      
      {!completed && (
        <TouchableOpacity 
          style={styles.twoMinTrigger} 
          onPress={handleTwoMin}
          disabled={loading}
        >
          <View style={styles.aiIcon}>
            {loading ? (
              <ActivityIndicator size="small" color={colors.purple} />
            ) : (
              <Ionicons name="sparkles" size={16} color={colors.purple} />
            )}
          </View>
          <View>
            <Text style={styles.triggerTextBold}>Struggling?</Text>
            <Text style={styles.triggerTextSub}>Get 2-minute version</Text>
          </View>
        </TouchableOpacity>
      )}
      
      {twoMinOpen && !completed && (
        <View style={styles.twoMinPopup}>
          <View style={styles.twoMinBadge}>
            <Ionicons name="sparkles" size={12} color={colors.warning} />
            <Text style={styles.twoMinBadgeText}>2-Minute Version</Text>
          </View>
          <Text style={styles.twoMinText}>{twoMinOpen.twoMinuteVersion}</Text>
          <Text style={styles.twoMinWhy}>{twoMinOpen.whyThisWorks}</Text>
          <View style={styles.twoMinActions}>
            <TouchableOpacity style={styles.btnPrimary} onPress={onComplete}>
              <Text style={styles.btnPrimaryText}>Did It</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnLight} onPress={() => setTwoMinOpen(null)}>
              <Text style={styles.btnLightText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

// Quote Card Component
export function QuoteCard({ text, author }) {
  return (
    <View style={styles.quoteCard}>
      <Text style={styles.quoteText}>"{text}"</Text>
      <Text style={styles.quoteAuthor}>— {author}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: 16,
    marginBottom: 10,
    ...shadows.sm,
  },
  cardCompleted: {
    opacity: 0.6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  check: {
    width: 26,
    height: 26,
    borderWidth: 2,
    borderColor: colors.bg3,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkDone: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  content: {
    flex: 1,
  },
  text: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
    lineHeight: 22,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  metaText: {
    fontSize: 12,
    color: colors.text3,
  },
  tagAI: {
    backgroundColor: colors.purpleLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagAIText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.purple,
  },
  streakBadge: {
    backgroundColor: colors.warningLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  streakText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.warning,
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
    borderTopColor: colors.bg2,
  },
  aiIcon: {
    width: 32,
    height: 32,
    backgroundColor: colors.purpleLight,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  triggerTextBold: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  triggerTextSub: {
    fontSize: 11,
    color: colors.text3,
  },
  twoMinPopup: {
    backgroundColor: colors.warningLight,
    borderWidth: 2,
    borderColor: colors.warning,
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
    color: colors.warning,
    textTransform: 'uppercase',
  },
  twoMinText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 22,
    marginBottom: 8,
  },
  twoMinWhy: {
    fontSize: 13,
    fontStyle: 'italic',
    color: colors.text2,
    lineHeight: 18,
    marginBottom: 12,
  },
  twoMinActions: {
    flexDirection: 'row',
    gap: 8,
  },
  btnPrimary: {
    flex: 1,
    backgroundColor: colors.accent,
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
    backgroundColor: colors.bg2,
    paddingVertical: 10,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  btnLightText: {
    color: colors.text2,
    fontSize: 14,
    fontWeight: '600',
  },
  quoteCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
    ...shadows.sm,
  },
  quoteText: {
    fontSize: 15,
    fontStyle: 'italic',
    color: colors.text,
    lineHeight: 24,
    marginBottom: 8,
  },
  quoteAuthor: {
    fontSize: 13,
    color: colors.text3,
    fontWeight: '500',
  },
});
