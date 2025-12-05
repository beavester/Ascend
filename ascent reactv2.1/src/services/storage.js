import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@ascent_v15_data';

export const getInitialData = () => ({
  // User
  name: '',
  goal: '',
  goalContext: '',
  weeksAvailable: 8,
  currentLevel: 'beginner',
  
  // State
  onboardingComplete: false,
  startDate: null,
  
  // Habits
  habits: [],
  completions: [], // { odHabitId, date, completed }
  
  // Curriculum
  curriculum: null,
  dailyTasks: [], // array of { day, task }
  taskCompletions: [], // array of task IDs like "week1-day3"
  currentWeek: 1,
  
  // Progress  
  streakDays: 0,
  unlockedMilestones: [],
  
  // Streak Pause (humane version - life happens)
  streakFreezes: 2, // Start with 2, earn 1 per week of consistency
  pausedDays: [], // Dates when freeze was used
  
  // Reflections (for deepening intrinsic connection)
  reflections: [], // { date, habitId, prompt, response }
  
  // Chat
  chatMessages: [],
});

export const loadData = async () => {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    if (json) {
      const saved = JSON.parse(json);
      return { ...getInitialData(), ...saved };
    }
    return null;
  } catch (e) {
    console.error('Load error:', e);
    return null;
  }
};

export const saveData = async (data) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Save error:', e);
  }
};

export const clearData = async () => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('Clear error:', e);
  }
};

// Helpers matching HTML logic
export const getTodayStr = () => new Date().toDateString();

export const isHabitCompletedToday = (completions, habitId) => {
  const todayStr = getTodayStr();
  return completions.some(
    c => c.odHabitId === habitId && 
    new Date(c.date).toDateString() === todayStr && 
    c.completed
  );
};

export const calculateHabitStreak = (completions, habitId) => {
  const today = new Date();
  let streak = 0;
  
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toDateString();
    
    const done = completions.some(
      c => c.odHabitId === habitId && 
      new Date(c.date).toDateString() === dateStr && 
      c.completed
    );
    
    if (i === 0 && !done) continue;
    if (done) streak++;
    else break;
  }
  
  return streak;
};

export const calculateOverallStreak = (habits, completions) => {
  if (habits.length === 0) return 0;
  
  const today = new Date();
  let streak = 0;
  
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toDateString();
    
    const allDone = habits.every(h =>
      completions.some(
        c => c.odHabitId === h.id && 
        new Date(c.date).toDateString() === dateStr && 
        c.completed
      )
    );
    
    if (i === 0 && !allDone) continue;
    if (allDone) streak++;
    else break;
  }
  
  return streak;
};

// Heatmap data (last 35 days)
export const getHeatmapData = (habits, completions) => {
  const days = [];
  const today = new Date();
  
  for (let i = 34; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toDateString();
    
    if (habits.length === 0) {
      days.push({ date: d, level: 0 });
    } else {
      const completed = habits.filter(h =>
        completions.some(
          c => c.odHabitId === h.id && 
          new Date(c.date).toDateString() === dateStr && 
          c.completed
        )
      ).length;
      
      const pct = (completed / habits.length) * 100;
      let level = 0;
      if (pct > 0) level = 1;
      if (pct >= 50) level = 2;
      if (pct >= 75) level = 3;
      if (pct === 100) level = 4;
      
      days.push({ date: d, level });
    }
  }
  
  return days;
};
