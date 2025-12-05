// Proactive Insight Engine
// Detects patterns and surfaces meaningful observations

// ═══════════════════════════════════════════════════════════════
// INSIGHT TRIGGERS
// ═══════════════════════════════════════════════════════════════

const INSIGHT_TRIGGERS = [
  // ─────────────────────────────────────────────────────────────
  // TIME-BASED PATTERNS
  // ─────────────────────────────────────────────────────────────
  {
    id: 'morning_advantage',
    priority: 2,
    condition: (data) => {
      const morningRate = getCompletionRateByTime(data, 'morning');
      const eveningRate = getCompletionRateByTime(data, 'evening');
      return morningRate > 0 && eveningRate > 0 && morningRate > eveningRate * 1.25;
    },
    insight: {
      type: 'pattern',
      title: "Pattern detected",
      message: "Your morning completion rate is 25% higher than evening. Your chronotype might be telling you something.",
      action: {
        text: "Shift evening habits to morning?",
        type: 'suggestion',
      },
    },
  },
  
  {
    id: 'friday_friction',
    priority: 2,
    condition: (data) => {
      const fridayMisses = getMissesByDayOfWeek(data, 5);
      const avgMisses = getAverageDailyMissRate(data);
      return avgMisses > 0 && fridayMisses > avgMisses * 1.5;
    },
    insight: {
      type: 'pattern',
      title: "Friday pattern",
      message: "Fridays show 50% more friction. That's decision fatigue accumulating. Consider making Friday your official '2-minute only' day.",
      action: {
        text: "Enable Friday easy mode?",
        type: 'toggle',
      },
    },
  },
  
  {
    id: 'weekend_warrior',
    priority: 3,
    condition: (data) => {
      const weekdayRate = getWeekdayCompletionRate(data);
      const weekendRate = getWeekendCompletionRate(data);
      return weekendRate > 0 && weekdayRate > weekendRate * 1.3;
    },
    insight: {
      type: 'observation',
      title: "Weekend gap",
      message: "Your weekday consistency is solid, but weekends show more resistance. Different routines need different triggers.",
      action: null,
    },
  },

  // ─────────────────────────────────────────────────────────────
  // STREAK-BASED INSIGHTS
  // ─────────────────────────────────────────────────────────────
  {
    id: 'streak_threshold_7',
    priority: 1,
    condition: (data) => data.streakDays === 6,
    insight: {
      type: 'milestone_preview',
      title: "Threshold moment",
      message: "Tomorrow is day 7. Neuroscience shows: this is when encoding begins to stick. One more day locks in the pattern.",
      action: null,
    },
  },
  
  {
    id: 'streak_threshold_21',
    priority: 1,
    condition: (data) => data.streakDays === 20,
    insight: {
      type: 'milestone_preview',
      title: "21-day approach",
      message: "Tomorrow is day 21. The old myth said this is when habits form. It's not true—but the momentum you've built is real.",
      action: null,
    },
  },
  
  {
    id: 'streak_at_risk',
    priority: 0, // Highest priority
    condition: (data) => {
      const hour = new Date().getHours();
      const anyIncomplete = data.habits.some(h => !isHabitCompletedToday(data, h.id));
      return hour >= 20 && anyIncomplete && data.streakDays >= 3;
    },
    insight: {
      type: 'urgent',
      title: "Streak at risk",
      message: "Still time today. Even the 2-minute version preserves the chain.",
      action: {
        text: "Show 2-minute versions",
        type: 'navigate',
        target: 'twoMin',
      },
    },
  },

  // ─────────────────────────────────────────────────────────────
  // HABIT-SPECIFIC INSIGHTS
  // ─────────────────────────────────────────────────────────────
  {
    id: 'habit_too_hard',
    priority: 2,
    condition: (data) => {
      return data.habits.some(h => {
        const rate = getHabitCompletionRate(data, h.id, 14);
        return rate > 0 && rate < 0.4;
      });
    },
    insight: (data) => {
      const hardHabit = data.habits.find(h => getHabitCompletionRate(data, h.id, 14) < 0.4);
      return {
        type: 'diagnosis',
        title: "Resistance signal",
        message: `"${hardHabit?.name}" has high friction (under 40% completion). Either reduce scope or investigate: what makes it hard?`,
        action: {
          text: "Talk to coach about this",
          type: 'navigate',
          target: 'coach',
        },
      };
    },
  },
  
  {
    id: 'two_min_underused',
    priority: 3,
    condition: (data) => {
      const twoMinUsage = data.twoMinUsageCount || 0;
      const totalCompletions = data.completions?.length || 0;
      const missRate = getMissRate(data, 14);
      return totalCompletions > 20 && twoMinUsage < 3 && missRate > 0.3;
    },
    insight: {
      type: 'tip',
      title: "Tool unused",
      message: "You're missing 30% of days but rarely using the 2-minute version. On hard days, the tiny version IS the habit. It's not cheating—it's strategy.",
      action: {
        text: "Show 2-min automatically on hard days",
        type: 'toggle',
      },
    },
  },

  // ─────────────────────────────────────────────────────────────
  // POOL-BASED INSIGHTS
  // ─────────────────────────────────────────────────────────────
  {
    id: 'pool_correlation',
    priority: 3,
    condition: (data) => {
      // Check if completion rate correlates with pool level
      const highPoolCompletions = getCompletionRateByPoolLevel(data, 'high');
      const lowPoolCompletions = getCompletionRateByPoolLevel(data, 'low');
      return highPoolCompletions > 0 && lowPoolCompletions > 0 && 
             highPoolCompletions > lowPoolCompletions * 1.4;
    },
    insight: {
      type: 'pattern',
      title: "Pool correlation confirmed",
      message: "Your completion rate is 40% higher when your pool is above 60%. The dopamine model is real for you.",
      action: null,
    },
  },
  
  {
    id: 'morning_pool_optimizer',
    priority: 3,
    condition: (data) => {
      const morningHighPool = getMorningPoolAverage(data);
      return morningHighPool > 70 && !data.hasSeenMorningOptimizer;
    },
    insight: {
      type: 'tip',
      title: "Morning advantage",
      message: "Your morning pool averages 75%+. Consider scheduling your hardest habit before checking your phone.",
      action: {
        text: "Got it",
        type: 'dismiss',
      },
    },
  },

  // ─────────────────────────────────────────────────────────────
  // RETURN INSIGHTS
  // ─────────────────────────────────────────────────────────────
  {
    id: 'return_after_miss',
    priority: 1,
    condition: (data) => {
      const daysSinceLast = getDaysSinceLastCompletion(data);
      return daysSinceLast >= 1 && daysSinceLast <= 3 && data.streakDays > 0;
    },
    insight: (data) => {
      const daysMissed = getDaysSinceLastCompletion(data);
      return {
        type: 'welcome_back',
        title: "Welcome back",
        message: daysMissed === 1 
          ? "One day off doesn't erase neural adaptation. Your brain remembers the pattern."
          : `${daysMissed} days away. The research shows: it's not the miss that matters, it's the return.`,
        action: {
          text: "Continue",
          type: 'dismiss',
        },
      };
    },
  },
];

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

function getCompletionRateByTime(data, period) {
  if (!data.completions || data.completions.length === 0) return 0;
  
  const periodCompletions = data.completions.filter(c => {
    const hour = new Date(c.date).getHours();
    if (period === 'morning') return hour >= 5 && hour < 12;
    if (period === 'afternoon') return hour >= 12 && hour < 17;
    if (period === 'evening') return hour >= 17 && hour < 22;
    return false;
  });
  
  return periodCompletions.length / Math.max(data.completions.length, 1);
}

function getMissesByDayOfWeek(data, dayIndex) {
  // This would need actual tracking of misses by day
  // Simplified: calculate based on completion patterns
  const last30Days = getLast30Days();
  const relevantDays = last30Days.filter(d => d.getDay() === dayIndex);
  
  let misses = 0;
  relevantDays.forEach(day => {
    const dateStr = day.toDateString();
    const anyCompleted = data.habits?.some(h => 
      data.completions?.some(c => 
        c.odHabitId === h.id && new Date(c.date).toDateString() === dateStr
      )
    );
    if (!anyCompleted) misses++;
  });
  
  return misses / Math.max(relevantDays.length, 1);
}

function getAverageDailyMissRate(data) {
  const last30Days = getLast30Days();
  let totalMisses = 0;
  
  last30Days.forEach(day => {
    const dateStr = day.toDateString();
    const anyCompleted = data.habits?.some(h => 
      data.completions?.some(c => 
        c.odHabitId === h.id && new Date(c.date).toDateString() === dateStr
      )
    );
    if (!anyCompleted) totalMisses++;
  });
  
  return totalMisses / 30;
}

function getWeekdayCompletionRate(data) {
  return getCompletionRateByDayType(data, 'weekday');
}

function getWeekendCompletionRate(data) {
  return getCompletionRateByDayType(data, 'weekend');
}

function getCompletionRateByDayType(data, type) {
  if (!data.completions) return 0;
  
  const relevant = data.completions.filter(c => {
    const day = new Date(c.date).getDay();
    if (type === 'weekend') return day === 0 || day === 6;
    return day >= 1 && day <= 5;
  });
  
  return relevant.length / Math.max(data.completions.length, 1);
}

function isHabitCompletedToday(data, habitId) {
  const todayStr = new Date().toDateString();
  return data.completions?.some(c => 
    c.odHabitId === habitId && 
    new Date(c.date).toDateString() === todayStr
  );
}

function getHabitCompletionRate(data, habitId, days = 14) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const relevantCompletions = data.completions?.filter(c => 
    c.odHabitId === habitId && new Date(c.date) >= startDate
  );
  
  return (relevantCompletions?.length || 0) / days;
}

function getMissRate(data, days = 14) {
  if (!data.habits || data.habits.length === 0) return 0;
  
  const last = getLast30Days().slice(0, days);
  let missedDays = 0;
  
  last.forEach(day => {
    const dateStr = day.toDateString();
    const allCompleted = data.habits.every(h =>
      data.completions?.some(c => 
        c.odHabitId === h.id && new Date(c.date).toDateString() === dateStr
      )
    );
    if (!allCompleted) missedDays++;
  });
  
  return missedDays / days;
}

function getCompletionRateByPoolLevel(data, level) {
  // Would need pool history tracking
  // Placeholder implementation
  return 0;
}

function getMorningPoolAverage(data) {
  // Would need pool history tracking
  return data.poolData?.morningLevel || 65;
}

function getDaysSinceLastCompletion(data) {
  if (!data.completions || data.completions.length === 0) return 999;
  
  const lastCompletion = data.completions
    .map(c => new Date(c.date))
    .sort((a, b) => b - a)[0];
  
  const today = new Date();
  const diffTime = Math.abs(today - lastCompletion);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

function getLast30Days() {
  const days = [];
  const today = new Date();
  
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(d);
  }
  
  return days;
}

// ═══════════════════════════════════════════════════════════════
// MAIN INSIGHT CHECKER
// ═══════════════════════════════════════════════════════════════

/**
 * Check for proactive insights based on user data
 */
export const checkForInsights = (data, lastShownInsights = {}) => {
  const now = Date.now();
  const MIN_INTERVAL = 3 * 24 * 60 * 60 * 1000; // 3 days between same insight
  
  // Sort triggers by priority (lower = higher priority)
  const sortedTriggers = [...INSIGHT_TRIGGERS].sort((a, b) => a.priority - b.priority);
  
  for (const trigger of sortedTriggers) {
    // Skip if shown recently
    const lastShown = lastShownInsights[trigger.id];
    if (lastShown && now - lastShown < MIN_INTERVAL) {
      continue;
    }
    
    try {
      if (trigger.condition(data)) {
        // Get insight (may be a function for dynamic content)
        const insight = typeof trigger.insight === 'function' 
          ? trigger.insight(data) 
          : trigger.insight;
        
        return {
          id: trigger.id,
          ...insight,
        };
      }
    } catch (e) {
      // Condition check failed, skip this trigger
      console.warn(`Insight trigger ${trigger.id} failed:`, e);
    }
  }
  
  return null;
};

/**
 * Mark an insight as shown
 */
export const markInsightShown = (insightId, lastShownInsights = {}) => {
  return {
    ...lastShownInsights,
    [insightId]: Date.now(),
  };
};

/**
 * Get all applicable insights (for a dashboard view)
 */
export const getAllApplicableInsights = (data, lastShownInsights = {}, limit = 3) => {
  const insights = [];
  const now = Date.now();
  const MIN_INTERVAL = 24 * 60 * 60 * 1000; // 1 day for dashboard view
  
  for (const trigger of INSIGHT_TRIGGERS) {
    if (insights.length >= limit) break;
    
    const lastShown = lastShownInsights[trigger.id];
    if (lastShown && now - lastShown < MIN_INTERVAL) continue;
    
    try {
      if (trigger.condition(data)) {
        const insight = typeof trigger.insight === 'function' 
          ? trigger.insight(data) 
          : trigger.insight;
        
        insights.push({
          id: trigger.id,
          priority: trigger.priority,
          ...insight,
        });
      }
    } catch (e) {
      // Skip failed triggers
    }
  }
  
  return insights.sort((a, b) => a.priority - b.priority);
};
