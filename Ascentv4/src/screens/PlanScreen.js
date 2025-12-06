import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react-native';
import { lightColors as colors, radius as borderRadius, shadows, spacing } from '../constants/theme';
import { useAppData } from '../hooks/useAppData';
import { generateCurriculum, generateDailyTasks } from '../services/ai';

const PlanScreen = () => {
  const { data, setCurriculum, setDailyTasks } = useAppData();
  const [expandedPhase, setExpandedPhase] = useState(0);
  const [regenerating, setRegenerating] = useState(false);

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const curriculum = await generateCurriculum({
        goal: data.goal,
        weeksAvailable: data.weeksAvailable,
        currentLevel: data.currentLevel,
        context: data.goalContext,
      });
      setCurriculum(curriculum);

      // Also regenerate daily tasks for current week
      const milestone = curriculum.phases[0]?.weeks[0]?.milestone || data.goal;
      const tasks = await generateDailyTasks({
        milestone,
        goalContext: data.goal,
      });
      setDailyTasks(tasks.tasks);
    } catch (error) {
      console.error('Error regenerating:', error);
    } finally {
      setRegenerating(false);
    }
  };

  const togglePhase = (index) => {
    setExpandedPhase(expandedPhase === index ? -1 : index);
  };

  if (!data.curriculum) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No Plan Yet</Text>
          <Text style={styles.emptyText}>
            Complete onboarding to generate your personalized curriculum.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{data.curriculum.title}</Text>
            <Text style={styles.subtitle}>
              {data.curriculum.totalWeeks} weeks • Week {data.currentWeek} of {data.curriculum.totalWeeks}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={handleRegenerate}
            disabled={regenerating}
          >
            {regenerating ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : (
              <RefreshCw size={18} color={colors.accent} />
            )}
          </TouchableOpacity>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${(data.currentWeek / data.curriculum.totalWeeks) * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {Math.round((data.currentWeek / data.curriculum.totalWeeks) * 100)}% complete
          </Text>
        </View>

        {/* Phases */}
        {data.curriculum.phases.map((phase, phaseIndex) => {
          const isExpanded = expandedPhase === phaseIndex;
          const phaseWeeks = phase.weeks;
          const currentWeekInPhase = phaseWeeks.some(w => w.week === data.currentWeek);

          return (
            <View key={phaseIndex} style={styles.phaseContainer}>
              <TouchableOpacity
                style={[styles.phaseHeader, currentWeekInPhase && styles.phaseHeaderActive]}
                onPress={() => togglePhase(phaseIndex)}
                activeOpacity={0.7}
              >
                <View style={styles.phaseHeaderLeft}>
                  <View
                    style={[
                      styles.phaseDot,
                      currentWeekInPhase && styles.phaseDotActive,
                    ]}
                  />
                  <View>
                    <Text style={styles.phaseName}>{phase.name}</Text>
                    <Text style={styles.phaseWeeks}>
                      Weeks {phaseWeeks[0]?.week} - {phaseWeeks[phaseWeeks.length - 1]?.week}
                    </Text>
                  </View>
                </View>
                {isExpanded ? (
                  <ChevronUp size={20} color={colors.text3} />
                ) : (
                  <ChevronDown size={20} color={colors.text3} />
                )}
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.phaseContent}>
                  {phaseWeeks.map((week) => {
                    const isCurrent = week.week === data.currentWeek;
                    const isPast = week.week < data.currentWeek;

                    return (
                      <View
                        key={week.week}
                        style={[
                          styles.weekItem,
                          isCurrent && styles.weekItemCurrent,
                          isPast && styles.weekItemPast,
                        ]}
                      >
                        <View style={styles.weekHeader}>
                          <View
                            style={[
                              styles.weekCheck,
                              isPast && styles.weekCheckDone,
                              isCurrent && styles.weekCheckCurrent,
                            ]}
                          >
                            {isPast && <Check size={12} color="#fff" strokeWidth={3} />}
                          </View>
                          <Text
                            style={[
                              styles.weekLabel,
                              isCurrent && styles.weekLabelCurrent,
                            ]}
                          >
                            Week {week.week}
                            {isCurrent && ' (Current)'}
                          </Text>
                        </View>
                        <Text
                          style={[
                            styles.weekMilestone,
                            isPast && styles.weekMilestonePast,
                          ]}
                        >
                          {week.milestone}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}

        {/* Daily Tasks Preview */}
        {data.dailyTasks && data.dailyTasks.length > 0 && (
          <View style={styles.tasksSection}>
            <Text style={styles.tasksSectionTitle}>This Week's Tasks</Text>
            {data.dailyTasks.map((task, index) => (
              <View key={index} style={styles.taskPreview}>
                <Text style={styles.taskDay}>Day {task.day}</Text>
                <Text style={styles.taskText}>{task.task}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: colors.text3,
  },
  refreshBtn: {
    padding: 8,
    backgroundColor: colors.accentLight,
    borderRadius: borderRadius.sm,
  },
  progressContainer: {
    marginBottom: spacing.xl,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.bg3,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: colors.text3,
    textAlign: 'right',
  },
  phaseContainer: {
    marginBottom: spacing.md,
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.sm,
  },
  phaseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
  },
  phaseHeaderActive: {
    backgroundColor: colors.accentLight,
  },
  phaseHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  phaseDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.bg3,
    marginRight: 12,
  },
  phaseDotActive: {
    backgroundColor: colors.accent,
  },
  phaseName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  phaseWeeks: {
    fontSize: 12,
    color: colors.text3,
  },
  phaseContent: {
    padding: spacing.lg,
    paddingTop: 0,
  },
  weekItem: {
    padding: spacing.md,
    backgroundColor: colors.bg,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  weekItemCurrent: {
    backgroundColor: colors.accentLight,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
  },
  weekItemPast: {
    opacity: 0.6,
  },
  weekHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  weekCheck: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.bg3,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekCheckDone: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  weekCheckCurrent: {
    borderColor: colors.accent,
  },
  weekLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text3,
  },
  weekLabelCurrent: {
    color: colors.accent,
  },
  weekMilestone: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    marginLeft: 26,
  },
  weekMilestonePast: {
    textDecorationLine: 'line-through',
  },
  tasksSection: {
    marginTop: spacing.xl,
  },
  tasksSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  taskPreview: {
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  taskDay: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.accent,
    marginBottom: 4,
  },
  taskText: {
    fontSize: 14,
    color: colors.text,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.text3,
    textAlign: 'center',
  },
});

export default PlanScreen;
