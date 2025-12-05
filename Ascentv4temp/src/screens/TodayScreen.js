import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { shadows, spacing, radius, typography } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { useAppData } from '../hooks/useAppData';
import { generateTwoMinuteTask, generateTwoMinuteHabit } from '../services/ai';
import MountainView from '../components/MountainView';
import TaskCard from '../components/TaskCard';
import HabitCard from '../components/HabitCard';
import AddHabitModal from '../components/AddHabitModal';
import * as Haptics from 'expo-haptics';

const TodayScreen = () => {
  const { colors, isDark } = useTheme();
  const {
    data,
    addHabit,
    completeHabit,
    uncompleteHabit,
    isHabitDoneToday,
    getHabitStreak,
    completeTask,
    isTaskDoneToday,
    getTodayTask,
    getCurrentMilestone,
  } = useAppData();

  const [showAddModal, setShowAddModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // 2-min states
  const [taskTwoMin, setTaskTwoMin] = useState(null);
  const [taskTwoMinLoading, setTaskTwoMinLoading] = useState(false);
  const [habitTwoMin, setHabitTwoMin] = useState({});
  const [habitTwoMinLoading, setHabitTwoMinLoading] = useState({});

  const todayTask = getTodayTask();
  const milestone = getCurrentMilestone();
  const todayTaskId = todayTask ? `task_${todayTask.day}` : null;
  const isTaskDone = todayTaskId ? isTaskDoneToday(todayTaskId) : false;

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleGetTaskTwoMin = async () => {
    if (!todayTask) return;
    setTaskTwoMinLoading(true);
    try {
      const result = await generateTwoMinuteTask(todayTask.task);
      setTaskTwoMin(result);
    } catch (error) {
      console.error('Error getting 2-min task:', error);
    } finally {
      setTaskTwoMinLoading(false);
    }
  };

  const handleGetHabitTwoMin = async (habit) => {
    if (!habit) {
      // Clear
      setHabitTwoMin({});
      return;
    }
    
    setHabitTwoMinLoading({ ...habitTwoMinLoading, [habit.id]: true });
    try {
      const result = await generateTwoMinuteHabit({
        habitName: habit.name,
        goalAmount: habit.goalAmount,
        unit: habit.unit,
      });
      setHabitTwoMin({ ...habitTwoMin, [habit.id]: result });
    } catch (error) {
      console.error('Error getting 2-min habit:', error);
    } finally {
      setHabitTwoMinLoading({ ...habitTwoMinLoading, [habit.id]: false });
    }
  };

  const handleCompleteTask = () => {
    if (todayTaskId) {
      completeTask(todayTaskId);
      setTaskTwoMin(null);
    }
  };

  const handleCompleteHabit = (habitId) => {
    completeHabit(habitId);
    // Clear 2-min for this habit
    const newTwoMin = { ...habitTwoMin };
    delete newTwoMin[habitId];
    setHabitTwoMin(newTwoMin);
  };

  const showMountainInfo = () => {
    Alert.alert(
      '60-Day Journey',
      'Research shows it takes about 60 days to form a lasting habit. Your climb represents this journey—each day you show up, you get closer to the summit.\n\nMilestones:\n• Day 7: Base Camp\n• Day 14: Camp 1\n• Day 30: Camp 2\n• Day 45: Camp 3\n• Day 60: Summit 🏆',
      [{ text: 'Got it!' }]
    );
  };

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Calculate today's progress for visual feedback
  const completedCount = data.habits.filter(h => isHabitDoneToday(h.id)).length;
  const totalHabits = data.habits.length;
  const progressPercent = totalHabits > 0 ? Math.round((completedCount / totalHabits) * 100) : 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent}
          />
        }
      >
        {/* Header with improved hierarchy */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.text3 }]}>{getGreeting()}</Text>
            <Text style={[styles.name, { color: colors.text }]}>{data.name || 'Climber'}</Text>
          </View>
          <TouchableOpacity
            style={[styles.streakBadge, { backgroundColor: colors.warningLight }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              Alert.alert(
                `${data.streakDays} Day Streak`,
                'Keep showing up! Consistency beats perfection.',
                [{ text: 'Got it!' }]
              );
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="flame" size={16} color={colors.warning} style={{ marginBottom: 2 }} />
            <Text style={[styles.streakNumber, { color: colors.warning }]}>{data.streakDays}</Text>
            <Text style={[styles.streakLabel, { color: colors.warning }]}>day streak</Text>
          </TouchableOpacity>
        </View>

        {/* Progress indicator - visual at-a-glance status */}
        {totalHabits > 0 && (
          <View style={[styles.progressCard, { backgroundColor: colors.card }]}>
            <View style={styles.progressHeader}>
              <Text style={[styles.progressLabel, { color: colors.text2 }]}>Today's Progress</Text>
              <Text style={[styles.progressValue, { color: progressPercent === 100 ? colors.success : colors.accent }]}>
                {completedCount}/{totalHabits}
              </Text>
            </View>
            <View style={[styles.progressBar, { backgroundColor: colors.bg3 }]}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: progressPercent === 100 ? colors.success : colors.accent,
                    width: `${progressPercent}%`
                  }
                ]}
              />
            </View>
            {progressPercent === 100 && (
              <View style={styles.progressComplete}>
                <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                <Text style={[styles.progressCompleteText, { color: colors.success }]}>All habits done!</Text>
              </View>
            )}
          </View>
        )}

        {/* Mountain */}
        <MountainView
          streakDays={data.streakDays}
          goal={data.goal}
          onInfoPress={showMountainInfo}
        />

        {/* Today's Task */}
        {todayTask && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="calendar-outline" size={16} color={colors.accent} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Today's Task</Text>
            </View>
            <TaskCard
              task={todayTask}
              milestone={milestone}
              isDone={isTaskDone}
              onComplete={handleCompleteTask}
              onGetTwoMin={handleGetTaskTwoMin}
              twoMinData={taskTwoMin}
              isLoadingTwoMin={taskTwoMinLoading}
              onDismissTwoMin={() => setTaskTwoMin(null)}
            />
          </View>
        )}

        {/* Habits */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="repeat-outline" size={16} color={colors.accent} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Daily Habits</Text>
            {data.habits.length > 0 && (
              <View style={[styles.countBadge, { backgroundColor: colors.accentLight }]}>
                <Text style={[styles.countBadgeText, { color: colors.accent }]}>{data.habits.length}</Text>
              </View>
            )}
          </View>

          {data.habits.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.emptyIconContainer, { backgroundColor: colors.accentLight }]}>
                <Ionicons name="add-circle-outline" size={32} color={colors.accent} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No habits yet</Text>
              <Text style={[styles.emptyText, { color: colors.text3 }]}>
                Start small. Even 2 minutes counts.
              </Text>
              <TouchableOpacity
                style={[styles.emptyAddBtn, { backgroundColor: colors.accent }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setShowAddModal(true);
                }}
              >
                <Ionicons name="add" size={18} color="#fff" />
                <Text style={styles.emptyAddBtnText}>Add Your First Habit</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {data.habits.map((habit) => (
                <HabitCard
                  key={habit.id}
                  habit={habit}
                  isDone={isHabitDoneToday(habit.id)}
                  streak={getHabitStreak(habit.id)}
                  onComplete={handleCompleteHabit}
                  onUncomplete={uncompleteHabit}
                  onGetTwoMin={handleGetHabitTwoMin}
                  twoMinData={habitTwoMin[habit.id]}
                  isLoadingTwoMin={habitTwoMinLoading[habit.id]}
                />
              ))}

              <TouchableOpacity
                style={[styles.addBtn, { backgroundColor: colors.bg2, borderColor: colors.border }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowAddModal(true);
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.addBtnIcon, { backgroundColor: colors.accentLight }]}>
                  <Ionicons name="add" size={16} color={colors.accent} />
                </View>
                <Text style={[styles.addBtnText, { color: colors.text2 }]}>Add Another Habit</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.text3} />
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Bottom padding for safe scrolling */}
        <View style={{ height: 40 }} />
      </ScrollView>

      <AddHabitModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={addHabit}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  greeting: {
    fontSize: 14,
    marginBottom: 2,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
  },
  streakBadge: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.lg,
  },
  streakNumber: {
    fontSize: 22,
    fontWeight: '700',
  },
  streakLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Progress card
  progressCard: {
    padding: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  progressValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressComplete: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.sm,
    justifyContent: 'center',
  },
  progressCompleteText: {
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    marginTop: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  // Empty state
  emptyState: {
    padding: spacing.xl,
    borderRadius: radius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
  },
  emptyAddBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  // Add button
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.lg,
    marginTop: spacing.sm,
    borderWidth: 1,
  },
  addBtnIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  addBtnText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
});

export default TodayScreen;
