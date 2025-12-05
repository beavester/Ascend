import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows } from '../constants/theme';

const TaskCard = ({
  task,
  milestone,
  isDone,
  onComplete,
  onGetTwoMin,
  twoMinData,
  isLoadingTwoMin,
  onDismissTwoMin,
}) => {
  if (!task) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>TODAY'S FOCUS</Text>
        <Text style={styles.milestone}>{milestone}</Text>
      </View>

      <View style={[styles.card, isDone && styles.cardDone]}>
        <TouchableOpacity
          style={[styles.check, isDone && styles.checkDone]}
          onPress={onComplete}
          activeOpacity={0.7}
        >
          {isDone && <Ionicons name="checkmark" size={18} color="#fff" />}
        </TouchableOpacity>
        <View style={styles.content}>
          <Text style={styles.dayLabel}>Day {task.day}</Text>
          <Text style={[styles.taskText, isDone && styles.taskTextDone]}>{task.task}</Text>
        </View>
      </View>

      {!isDone && (
        <TouchableOpacity
          style={styles.twoMinTrigger}
          onPress={onGetTwoMin}
          disabled={isLoadingTwoMin}
          activeOpacity={0.7}
        >
          <View style={styles.twoMinIcon}>
            {isLoadingTwoMin ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="sparkles" size={14} color="#fff" />
            )}
          </View>
          <View style={styles.twoMinTriggerText}>
            <Text style={styles.twoMinTriggerTitle}>Can't start?</Text>
            <Text style={styles.twoMinTriggerSub}>Get 2-minute version</Text>
          </View>
        </TouchableOpacity>
      )}

      {twoMinData && (
        <View style={styles.twoMinPopup}>
          <View style={styles.twoMinBadge}>
            <Ionicons name="sparkles" size={12} color={colors.warning} />
            <Text style={styles.twoMinBadgeText}>2-MINUTE VERSION</Text>
          </View>
          <Text style={styles.twoMinText}>{twoMinData.twoMinuteVersion}</Text>
          <Text style={styles.twoMinWhy}>{twoMinData.whyThisWorks}</Text>
          <View style={styles.twoMinActions}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnPrimary]}
              onPress={onComplete}
            >
              <Text style={styles.actionBtnTextPrimary}>Did It</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={onDismissTwoMin}>
              <Text style={styles.actionBtnText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  header: {
    marginBottom: 12,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.accent,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  milestone: {
    fontSize: 14,
    color: colors.text2,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
    ...shadows.sm,
  },
  cardDone: {
    borderLeftColor: colors.success,
    backgroundColor: colors.successLight,
  },
  check: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkDone: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  content: {
    flex: 1,
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text3,
    marginBottom: 4,
  },
  taskText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 22,
  },
  taskTextDone: {
    textDecorationLine: 'line-through',
    color: colors.text3,
  },
  twoMinTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginTop: 12,
    backgroundColor: colors.bg2,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.bg3,
  },
  twoMinIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  twoMinTriggerText: {
    flex: 1,
  },
  twoMinTriggerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  twoMinTriggerSub: {
    fontSize: 12,
    color: colors.text3,
  },
  twoMinPopup: {
    backgroundColor: colors.warningLight,
    borderWidth: 2,
    borderColor: colors.warning,
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
  },
  twoMinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  twoMinBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.warning,
    marginLeft: 4,
  },
  twoMinText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    lineHeight: 22,
  },
  twoMinWhy: {
    fontSize: 13,
    fontStyle: 'italic',
    color: colors.text2,
    marginBottom: 12,
  },
  twoMinActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: colors.card,
  },
  actionBtnPrimary: {
    backgroundColor: colors.accent,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text2,
  },
  actionBtnTextPrimary: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});

export default TaskCard;
