import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus } from 'lucide-react-native';
import { colors, borderRadius, shadows, spacing } from '../constants/theme';
import { useAppData } from '../hooks/useAppData';
import { generateTwoMinuteTask, generateTwoMinuteHabit } from '../services/ai';
import MountainView from '../components/MountainView';
import TaskCard from '../components/TaskCard';
import HabitCard from '../components/HabitCard';
import AddHabitModal from '../components/AddHabitModal';

const TodayScreen = () => {
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.name}>{data.name || 'Climber'}</Text>
          </View>
          <View style={styles.streakBadge}>
            <Text style={styles.streakNumber}>{data.streakDays}</Text>
            <Text style={styles.streakLabel}>day streak</Text>
          </View>
        </View>

        {/* Mountain */}
        <MountainView
          streakDays={data.streakDays}
          goal={data.goal}
          onInfoPress={showMountainInfo}
        />

        {/* Today's Task */}
        {todayTask && (
          <View style={styles.section}>
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
          <Text style={styles.sectionTitle}>Daily Habits</Text>
          
          {data.habits.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No habits yet. Add one to get started!</Text>
            </View>
          ) : (
            data.habits.map((habit) => (
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
            ))
          )}

          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setShowAddModal(true)}
          >
            <Plus size={16} color={colors.text2} />
            <Text style={styles.addBtnText}>Add Habit</Text>
          </TouchableOpacity>
        </View>
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
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  greeting: {
    fontSize: 14,
    color: colors.text3,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  streakBadge: {
    alignItems: 'center',
    backgroundColor: colors.warningLight,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: borderRadius.md,
  },
  streakNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.warning,
  },
  streakLabel: {
    fontSize: 11,
    color: colors.warning,
    fontWeight: '600',
  },
  section: {
    marginTop: spacing.xl,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  emptyState: {
    backgroundColor: colors.card,
    padding: 24,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: colors.text3,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: colors.bg2,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
    gap: 6,
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text2,
  },
});

export default TodayScreen;
