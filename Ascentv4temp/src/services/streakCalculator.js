// Resilient Streak Calculator
// Consistency-based approach instead of binary streaks

// ═══════════════════════════════════════════════════════════════
// STREAK CONFIGURATION
// ═══════════════════════════════════════════════════════════════

const STREAK_CONFIG = {
  // Window for calculating consistency
  windowDays: 30,
  
  // Thresholds for status
  solidThreshold: 80,    // 80%+ = solid
  amberThreshold: 60,    // 60-79% = amber
  // Below 60% = rebuilding
  
  // Messages for different states
  messages: {
    solid: [
      "This is becoming who you are.",
      "Solid foundation. The neural pathways are strong.",
      "Consistency is identity. You're proving it.",
    ],
    amber: [
      "Some wobble, but still in the game.",
      "The pathway is there. Keep showing up.",
      "Life happened. The pattern remembers you.",
    ],
    rebuilding: [
      "Rebuilding phase. Every rep counts.",
      "Starting again is easier than starting fresh.",
      "The neural pathway is dormant, not dead.",
    ],
  },
  
  // Colors for different states
  colors: {
    solid: '#22c55e',    // green
    amber: '#f59e0b',    // amber
    rebuilding: '#94a3b8', // neutral gray (NOT red - no shame)
  },
};

// ═══════════════════════════════════════════════════════════════
// MAIN CALCULATION FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Calculate resilient streak for a specific habit
 */
export const calculateResilientStreak = (completions, habitId) => {
  const now = new Date();
  const windowDays = STREAK_CONFIG.windowDays;
  const last30 = [];
  
  // Build array of last 30 days
  for (let i = 0; i < windowDays; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toDateString();
    
    const wasCompleted = completions?.some(c => 
      c.odHabitId === habitId && 
      new Date(c.date).toDateString() === dateStr &&
      c.completed
    );
    
    last30.push({ date, dateStr, completed: wasCompleted });
  }
  
  // Calculate metrics
  const completedDays = last30.filter(d => d.completed).length;
  const consistencyScore = Math.round((completedDays / windowDays) * 100);
  
  // Current run (consecutive from today, allowing today to be incomplete)
  let currentRun = 0;
  let startIndex = last30[0].completed ? 0 : 1; // Allow today to be incomplete
  
  for (let i = startIndex; i < last30.length; i++) {
    if (last30[i].completed) currentRun++;
    else break;
  }
  
  // Best run in window
  let bestRun = 0;
  let tempRun = 0;
  for (const day of last30) {
    if (day.completed) {
      tempRun++;
      bestRun = Math.max(bestRun, tempRun);
    } else {
      tempRun = 0;
    }
  }
  
  // Determine status
  let status, color;
  if (consistencyScore >= STREAK_CONFIG.solidThreshold) {
    status = 'solid';
    color = STREAK_CONFIG.colors.solid;
  } else if (consistencyScore >= STREAK_CONFIG.amberThreshold) {
    status = 'amber';
    color = STREAK_CONFIG.colors.amber;
  } else {
    status = 'rebuilding';
    color = STREAK_CONFIG.colors.rebuilding;
  }
  
  // Get contextual message
  const messages = STREAK_CONFIG.messages[status];
  const message = messages[Math.floor(Math.random() * messages.length)];
  
  return {
    consistencyScore,
    currentRun,
    bestRun,
    completedDays,
    windowDays,
    status,
    message,
    color,
    last30,
  };
};

/**
 * Calculate overall resilient streak across all habits
 */
export const calculateOverallResilientStreak = (habits, completions) => {
  if (!habits || habits.length === 0) {
    return {
      consistencyScore: 0,
      currentRun: 0,
      status: 'rebuilding',
      message: "Add your first habit to begin.",
      color: STREAK_CONFIG.colors.rebuilding,
    };
  }
  
  const now = new Date();
  const windowDays = STREAK_CONFIG.windowDays;
  const dailyScores = [];
  
  // For each day, calculate what percentage of habits were completed
  for (let i = 0; i < windowDays; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toDateString();
    
    const completedHabits = habits.filter(h =>
      completions?.some(c => 
        c.odHabitId === h.id && 
        new Date(c.date).toDateString() === dateStr &&
        c.completed
      )
    ).length;
    
    const dayScore = habits.length > 0 ? completedHabits / habits.length : 0;
    dailyScores.push({ date, score: dayScore, perfect: dayScore === 1 });
  }
  
  // Calculate overall consistency
  const avgScore = dailyScores.reduce((sum, d) => sum + d.score, 0) / windowDays;
  const consistencyScore = Math.round(avgScore * 100);
  
  // Current run of perfect days
  let currentRun = 0;
  let startIndex = dailyScores[0].perfect ? 0 : 1;
  
  for (let i = startIndex; i < dailyScores.length; i++) {
    if (dailyScores[i].perfect) currentRun++;
    else break;
  }
  
  // Determine status
  let status, color;
  if (consistencyScore >= STREAK_CONFIG.solidThreshold) {
    status = 'solid';
    color = STREAK_CONFIG.colors.solid;
  } else if (consistencyScore >= STREAK_CONFIG.amberThreshold) {
    status = 'amber';
    color = STREAK_CONFIG.colors.amber;
  } else {
    status = 'rebuilding';
    color = STREAK_CONFIG.colors.rebuilding;
  }
  
  const messages = STREAK_CONFIG.messages[status];
  const message = messages[Math.floor(Math.random() * messages.length)];
  
  return {
    consistencyScore,
    currentRun,
    perfectDays: dailyScores.filter(d => d.perfect).length,
    windowDays,
    status,
    message,
    color,
    dailyScores,
  };
};

// ═══════════════════════════════════════════════════════════════
// MISS RECOVERY HELPERS
// ═══════════════════════════════════════════════════════════════

/**
 * Get information about recent misses for recovery messaging
 */
export const getMissRecoveryInfo = (completions, habits) => {
  if (!habits || habits.length === 0) {
    return null;
  }
  
  const now = new Date();
  const todayStr = now.toDateString();
  
  // Check if anything was completed today
  const completedToday = habits.some(h =>
    completions?.some(c => 
      c.odHabitId === h.id && 
      new Date(c.date).toDateString() === todayStr
    )
  );
  
  if (completedToday) {
    return null; // User is active today, no recovery needed
  }
  
  // Find last completion date
  let lastCompletionDate = null;
  if (completions && completions.length > 0) {
    const sorted = [...completions]
      .filter(c => c.completed)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (sorted.length > 0) {
      lastCompletionDate = new Date(sorted[0].date);
    }
  }
  
  if (!lastCompletionDate) {
    return {
      daysMissed: 999,
      previousStreak: 0,
      type: 'new_start',
      message: {
        title: "Let's begin.",
        body: "No past data to worry about. Just today.",
        cta: "Start now",
      },
    };
  }
  
  // Calculate days missed
  const diffTime = Math.abs(now - lastCompletionDate);
  const daysMissed = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  // Estimate previous streak (simplified)
  const previousStreak = calculatePreviousStreak(completions, habits, lastCompletionDate);
  
  if (daysMissed === 0) {
    return null; // Same day, no miss
  }
  
  if (daysMissed === 1) {
    return {
      daysMissed: 1,
      previousStreak,
      type: 'one_day',
      message: {
        title: "Welcome back.",
        body: "One day off doesn't erase neural adaptation. Your brain remembers the pattern. What matters is today.",
        cta: "Let's continue",
      },
    };
  }
  
  if (daysMissed <= 3) {
    return {
      daysMissed,
      previousStreak,
      type: 'few_days',
      message: {
        title: `${daysMissed} days away.`,
        body: "Life happened. Research shows: it's not the miss that matters, it's the return. Two consecutive misses is where habits unravel. You came back.",
        cta: "I'm back",
      },
    };
  }
  
  if (daysMissed <= 7) {
    return {
      daysMissed,
      previousStreak,
      type: 'week',
      message: {
        title: "A week away.",
        body: `You built ${previousStreak} days of neural pathways before. They don't disappear—they go dormant. Reactivating is faster than building new ones.`,
        cta: "Reactivate",
      },
    };
  }
  
  return {
    daysMissed,
    previousStreak,
    type: 'extended',
    message: {
      title: "Fresh start isn't starting over.",
      body: `${previousStreak > 0 ? `Your previous ${previousStreak}-day streak created pathways that are still there, waiting.` : ''} The neural architecture exists. It just needs reactivation.`,
      cta: "Begin again",
    },
  };
};

/**
 * Calculate previous streak before a break
 */
function calculatePreviousStreak(completions, habits, beforeDate) {
  if (!completions || !habits || habits.length === 0) return 0;
  
  let streak = 0;
  const checkDate = new Date(beforeDate);
  
  for (let i = 0; i < 365; i++) {
    checkDate.setDate(checkDate.getDate() - 1);
    const dateStr = checkDate.toDateString();
    
    const allCompleted = habits.every(h =>
      completions.some(c => 
        c.odHabitId === h.id && 
        new Date(c.date).toDateString() === dateStr &&
        c.completed
      )
    );
    
    if (allCompleted) streak++;
    else break;
  }
  
  return streak;
}

// ═══════════════════════════════════════════════════════════════
// INVISIBLE RATCHET HELPERS
// ═══════════════════════════════════════════════════════════════

/**
 * Check if a habit should have its target increased (invisible ratchet)
 */
export const shouldRatchetUp = (habit, completions) => {
  const { currentTarget = habit.amount || 1, lastRatchetDate, failedRatchetCount = 0 } = habit;
  
  // Check if enough time has passed (14 days minimum)
  if (lastRatchetDate) {
    const daysSince = Math.floor((Date.now() - new Date(lastRatchetDate)) / (1000 * 60 * 60 * 24));
    if (daysSince < 14) {
      return { shouldIncrease: false, reason: 'too_soon' };
    }
  }
  
  // Check if user has plateaued (3 failed ratchets)
  if (failedRatchetCount >= 3) {
    return { shouldIncrease: false, reason: 'plateau' };
  }
  
  // Check consistency
  const streak = calculateResilientStreak(completions, habit.id);
  if (streak.consistencyScore < 85) {
    return { shouldIncrease: false, reason: 'inconsistent' };
  }
  
  // Calculate new target
  const increment = getIncrement(currentTarget);
  const newTarget = currentTarget + increment;
  
  return {
    shouldIncrease: true,
    currentTarget,
    newTarget,
    increment,
    reason: 'ready',
  };
};

/**
 * Get increment amount based on current target
 */
function getIncrement(current) {
  if (current <= 2) return 1;      // 2 → 3
  if (current <= 5) return 2;      // 5 → 7
  if (current <= 10) return 3;     // 10 → 13
  if (current <= 20) return 5;     // 20 → 25
  return 5;                        // Cap at 5
}

/**
 * Check if habit should decrease (downward ratchet for hard times)
 */
export const shouldRatchetDown = (habit, completions) => {
  const streak = calculateResilientStreak(completions, habit.id);
  const { currentTarget = habit.amount || 1, originalTarget = 1 } = habit;
  
  // If below 50% and above original target, suggest decrease
  if (streak.consistencyScore < 50 && currentTarget > originalTarget) {
    const newTarget = Math.max(originalTarget, currentTarget - getIncrement(currentTarget));
    
    return {
      shouldDecrease: true,
      currentTarget,
      suggestedTarget: newTarget,
      message: "Life's been harder lately. Want to drop back to what was working?",
    };
  }
  
  return { shouldDecrease: false };
};
