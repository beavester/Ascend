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
  
  // ═══════════════════════════════════════════════════════════════
  // NEW: Dopamine Pool System
  // ═══════════════════════════════════════════════════════════════
  poolData: {
    currentLevel: 65,
    morningLevel: 65,
    lastUpdated: null,
    drainActivities: [],
    rechargeActivities: [],
    customAppMappings: {}, // User's custom app classifications
  },
  
  // Pool history for insights
  poolHistory: [], // { date, morningLevel, endLevel, drains, recharges }
  
  // ═══════════════════════════════════════════════════════════════
  // NEW: Insight System
  // ═══════════════════════════════════════════════════════════════
  lastShownInsights: {}, // { insightId: timestamp }
  
  // ═══════════════════════════════════════════════════════════════
  // NEW: Variable Reward Tracking
  // ═══════════════════════════════════════════════════════════════
  recentRewards: [], // Last few reward types shown (for variety)
  completionsToday: 0,
  lastCompletionDate: null,
  
  // ═══════════════════════════════════════════════════════════════
  // NEW: Cross-Titration Tracking
  // ═══════════════════════════════════════════════════════════════
  screenTimeBaseline: null, // Initial screen time when starting
  screenTimeHistory: [], // Weekly averages for comparison
  
  // ═══════════════════════════════════════════════════════════════
  // NEW: 2-Minute Version Usage
  // ═══════════════════════════════════════════════════════════════
  twoMinUsageCount: 0,
  showTwoMinAutomatically: false, // For low pool days
  
  // ═══════════════════════════════════════════════════════════════
  // NEW: Settings
  // ═══════════════════════════════════════════════════════════════
  showDopaminePool: true, // Toggle pool visibility
  fridayEasyMode: false, // 2-min only on Fridays
  hasSeenPoolIntro: false, // First-time pool explanation
  hasSeenMissRecovery: false, // Track if recovery modal shown today

  // ═══════════════════════════════════════════════════════════════
  // NEW: Daily Intention System
  // ═══════════════════════════════════════════════════════════════
  dailyIntention: null, // { text, date, completed }
  intentionHistory: [], // Array of past intentions for patterns

  // ═══════════════════════════════════════════════════════════════
  // NEW: Invisible Ratchet System
  // ═══════════════════════════════════════════════════════════════
  ratchetData: {
    habitFloors: {}, // { habitId: { floor: number, lastRaised: date } }
    consistencyWindow: 14, // Days to track for floor calculation
  },
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

// ═══════════════════════════════════════════════════════════════
// POOL HISTORY SNAPSHOTS
// ═══════════════════════════════════════════════════════════════

/**
 * Save daily pool snapshot for trend analysis
 */
export const savePoolHistorySnapshot = async (poolData, habits, completions) => {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    if (!json) return null;

    const data = JSON.parse(json);
    const today = new Date().toISOString().split('T')[0];

    // Calculate today's completions
    const todayStr = getTodayStr();
    const todayCompletions = habits.filter(h =>
      completions.some(
        c => c.odHabitId === h.id &&
        new Date(c.date).toDateString() === todayStr &&
        c.completed
      )
    ).length;

    const snapshot = {
      date: today,
      morningLevel: poolData.morningLevel || 65,
      endLevel: poolData.currentLevel || 65,
      drains: poolData.drainActivities?.length || 0,
      recharges: poolData.rechargeActivities?.length || 0,
      habitsCompleted: todayCompletions,
      totalHabits: habits.length,
    };

    // Add to history (keep last 90 days)
    const poolHistory = [...(data.poolHistory || [])];

    // Check if today already exists
    const existingIndex = poolHistory.findIndex(s => s.date === today);
    if (existingIndex >= 0) {
      poolHistory[existingIndex] = snapshot; // Update existing
    } else {
      poolHistory.push(snapshot); // Add new
    }

    // Keep only last 90 days
    const trimmedHistory = poolHistory.slice(-90);

    data.poolHistory = trimmedHistory;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));

    return trimmedHistory;
  } catch (e) {
    console.error('Error saving pool history snapshot:', e);
    return null;
  }
};

/**
 * Get pool history for charts
 */
export const getPoolHistory = async (days = 30) => {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    if (!json) return [];

    const data = JSON.parse(json);
    return (data.poolHistory || []).slice(-days);
  } catch (e) {
    console.error('Error getting pool history:', e);
    return [];
  }
};

// ═══════════════════════════════════════════════════════════════
// COACH INSIGHT STORAGE
// ═══════════════════════════════════════════════════════════════

/**
 * Store coach insight for future reference
 */
export const saveCoachInsight = async (insight) => {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    if (!json) return false;

    const data = JSON.parse(json);
    const insights = data.coachInsights || [];

    insights.push({
      ...insight,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
    });

    // Keep last 50 insights
    data.coachInsights = insights.slice(-50);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));

    return true;
  } catch (e) {
    console.error('Error saving coach insight:', e);
    return false;
  }
};

/**
 * Get stored coach insights for pattern analysis
 */
export const getCoachInsights = async (limit = 20) => {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    if (!json) return [];

    const data = JSON.parse(json);
    return (data.coachInsights || []).slice(-limit);
  } catch (e) {
    console.error('Error getting coach insights:', e);
    return [];
  }
};

/**
 * Track coach interaction patterns
 */
export const trackCoachInteraction = async (interactionType, metadata = {}) => {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    if (!json) return;

    const data = JSON.parse(json);
    const interactions = data.coachInteractions || [];

    interactions.push({
      type: interactionType,
      ...metadata,
      timestamp: new Date().toISOString(),
    });

    // Keep last 100 interactions
    data.coachInteractions = interactions.slice(-100);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Error tracking coach interaction:', e);
  }
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
