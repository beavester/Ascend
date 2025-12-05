import { createContext, useContext } from 'react';
import { calculateOverallStreak, calculateStreak, isCompletedToday, getTodayString } from '../services/storage';

export const AppContext = createContext(null);

export function useAppData() {
  const context = useContext(AppContext);
  
  if (!context) {
    throw new Error('useAppData must be used within AppContext.Provider');
  }
  
  const { data, updateData } = context;

  // Add a habit
  const addHabit = (habit) => {
    const newHabit = {
      id: `habit_${Date.now()}`,
      name: habit.name,
      goalAmount: habit.goalAmount,
      unit: habit.unit,
      createdAt: new Date().toISOString(),
    };
    
    updateData({
      ...data,
      habits: [...data.habits, newHabit],
    });
    
    return newHabit;
  };

  // Delete a habit
  const deleteHabit = (habitId) => {
    updateData({
      ...data,
      habits: data.habits.filter(h => h.id !== habitId),
      completions: data.completions.filter(c => c.habitId !== habitId),
    });
  };

  // Complete a habit
  const completeHabit = (habitId) => {
    const newCompletion = {
      habitId,
      date: new Date().toISOString(),
      completed: true,
    };
    
    const newCompletions = [...data.completions, newCompletion];
    const newStreakDays = calculateOverallStreak(data.habits, newCompletions);
    
    updateData({
      ...data,
      completions: newCompletions,
      streakDays: newStreakDays,
    });
  };

  // Uncomplete a habit
  const uncompleteHabit = (habitId) => {
    const today = getTodayString();
    const newCompletions = data.completions.filter(
      c => !(c.habitId === habitId && new Date(c.date).toDateString() === today)
    );
    const newStreakDays = calculateOverallStreak(data.habits, newCompletions);
    
    updateData({
      ...data,
      completions: newCompletions,
      streakDays: newStreakDays,
    });
  };

  // Check if habit is completed today
  const isHabitDoneToday = (habitId) => {
    return isCompletedToday(data.completions, habitId);
  };

  // Get habit streak
  const getHabitStreak = (habitId) => {
    return calculateStreak(data.completions, habitId);
  };

  // Complete a task
  const completeTask = (taskId) => {
    const newCompletion = {
      taskId,
      date: new Date().toISOString(),
      completed: true,
    };
    
    updateData({
      ...data,
      taskCompletions: [...data.taskCompletions, newCompletion],
    });
  };

  // Check if task is completed today
  const isTaskDoneToday = (taskId) => {
    const today = getTodayString();
    return data.taskCompletions.some(
      c => c.taskId === taskId && new Date(c.date).toDateString() === today
    );
  };

  // Set curriculum
  const setCurriculum = (curriculum) => {
    updateData({
      ...data,
      curriculum,
      currentWeek: 1,
    });
  };

  // Set daily tasks
  const setDailyTasks = (tasks) => {
    updateData({
      ...data,
      dailyTasks: tasks,
    });
  };

  // Add chat message
  const addChatMessage = (role, content) => {
    const newMessage = {
      id: `msg_${Date.now()}`,
      role,
      content,
      timestamp: new Date().toISOString(),
    };
    
    updateData({
      ...data,
      chatMessages: [...data.chatMessages, newMessage],
    });
    
    return newMessage;
  };

  // Clear chat
  const clearChat = () => {
    updateData({
      ...data,
      chatMessages: [],
    });
  };

  // Set user info
  const setUserInfo = (info) => {
    updateData({
      ...data,
      ...info,
    });
  };

  // Get today's task based on day of week
  const getTodayTask = () => {
    if (!data.dailyTasks || data.dailyTasks.length === 0) return null;
    const dayOfWeek = new Date().getDay(); // 0 = Sunday
    const taskIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert to 0-6 Mon-Sun
    return data.dailyTasks[taskIndex] || data.dailyTasks[0];
  };

  // Get current week's milestone
  const getCurrentMilestone = () => {
    if (!data.curriculum) return null;
    for (const phase of data.curriculum.phases) {
      const week = phase.weeks.find(w => w.week === data.currentWeek);
      if (week) return week.milestone;
    }
    return null;
  };

  return {
    data,
    updateData,
    // Habits
    addHabit,
    deleteHabit,
    completeHabit,
    uncompleteHabit,
    isHabitDoneToday,
    getHabitStreak,
    // Tasks
    completeTask,
    isTaskDoneToday,
    getTodayTask,
    getCurrentMilestone,
    // Curriculum
    setCurriculum,
    setDailyTasks,
    // Chat
    addChatMessage,
    clearChat,
    // User
    setUserInfo,
  };
}
