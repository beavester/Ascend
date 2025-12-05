// Dopamine Pool Service
// Behavioral pharmacokinetics engine for motivation tracking

// ═══════════════════════════════════════════════════════════════
// DRAIN RATES BY APP CATEGORY
// ═══════════════════════════════════════════════════════════════

export const DEFAULT_DRAIN_RATES = {
  // Tier 1: High-drain (infinite scroll, variable reward, passive consumption)
  social: {
    rate: -1.5,  // % per minute
    apps: ['TikTok', 'Instagram', 'Twitter', 'X', 'Facebook', 'Reddit', 'Snapchat'],
    description: 'Infinite scroll + variable rewards',
  },
  
  // Tier 2: Moderate drain (engaging but can be compulsive)  
  video: {
    rate: -0.8,
    apps: ['YouTube', 'Netflix', 'Hulu', 'Disney+', 'HBO', 'Twitch'],
    description: 'Passive consumption, finite content',
  },
  
  // Tier 3: Low drain (necessary, occasional compulsion)
  communication: {
    rate: -0.3,
    apps: ['Messages', 'Slack', 'Email', 'Discord', 'WhatsApp', 'Telegram'],
    description: 'Connection, but notification-driven',
  },
  
  // Tier 4: Neutral (utility)
  utility: {
    rate: 0,
    apps: ['Maps', 'Calendar', 'Calculator', 'Settings', 'Camera', 'Notes', 'Weather'],
    description: 'Functional, no dopamine loop',
  },
  
  // Tier 5: Potential recharge (user-classified)
  recharge: {
    rate: 0.2, // Slight positive
    apps: ['Kindle', 'Audible', 'Meditation', 'Calm', 'Headspace'],
    description: 'Restorative activities',
  },
};

// ═══════════════════════════════════════════════════════════════
// RECHARGE ACTIVITIES
// ═══════════════════════════════════════════════════════════════

export const RECHARGE_ACTIVITIES = {
  exercise: {
    light: { minutes: 15, boost: 8, label: 'Light exercise' },
    moderate: { minutes: 30, boost: 15, label: 'Moderate workout' },
    intense: { minutes: 45, boost: 12, label: 'Intense workout' }, // Less due to cortisol
  },
  
  meditation: {
    short: { minutes: 5, boost: 5, label: 'Quick meditation' },
    standard: { minutes: 15, boost: 10, label: 'Full meditation' },
  },
  
  outdoors: {
    walk: { minutes: 20, boost: 8, label: 'Walk outside' },
    sunlight: { minutes: 15, boost: 10, label: 'Morning sunlight' },
  },
  
  social: {
    inPerson: { minutes: 30, boost: 10, label: 'In-person time' },
    deepConversation: { minutes: 60, boost: 15, label: 'Deep conversation' },
  },
  
  coldExposure: {
    shower: { minutes: 2, boost: 12, label: 'Cold exposure' },
  },
  
  sleep: {
    good: { hours: 7, boost: 25, label: '7+ hours sleep' },
    great: { hours: 8, boost: 30, label: '8+ hours sleep' },
  },
};

// ═══════════════════════════════════════════════════════════════
// POOL CALCULATION
// ═══════════════════════════════════════════════════════════════

/**
 * Calculate morning pool level based on previous day and sleep
 */
export const calculateMorningPool = (userData) => {
  let baselineRefill = 65; // Start at 65% baseline after sleep
  
  // Previous day completion bonus
  if (userData.yesterdayComplete) {
    baselineRefill += 10; // Residual satisfaction
  }
  
  // Streak momentum bonus
  const streak = userData.streakDays || 0;
  if (streak >= 7) baselineRefill += 5;
  if (streak >= 21) baselineRefill += 5;
  if (streak >= 60) baselineRefill += 5;
  
  // Sleep quality modifier (if tracked)
  if (userData.lastSleepHours) {
    if (userData.lastSleepHours >= 8) baselineRefill += 10;
    else if (userData.lastSleepHours >= 7) baselineRefill += 5;
    else if (userData.lastSleepHours < 6) baselineRefill -= 10;
  }
  
  return Math.min(100, Math.max(20, baselineRefill));
};

/**
 * Calculate current pool level based on activities
 */
export const calculateCurrentPool = (poolData) => {
  const { 
    morningLevel = 65, 
    drainActivities = [], 
    rechargeActivities = [],
    hoursSinceWake = 0,
  } = poolData;
  
  let pool = morningLevel;
  
  // Apply drain activities
  drainActivities.forEach(activity => {
    const category = getCategoryForApp(activity.app);
    const rate = DEFAULT_DRAIN_RATES[category]?.rate || 0;
    pool += (activity.minutes * rate);
  });
  
  // Apply recharge activities
  rechargeActivities.forEach(activity => {
    pool += activity.boost;
  });
  
  // Natural hourly recovery (slow)
  pool += hoursSinceWake * 1; // +1% per hour naturally
  
  // Clamp to valid range
  return Math.max(0, Math.min(100, Math.round(pool)));
};

/**
 * Get category for an app name
 */
export const getCategoryForApp = (appName, customMappings = {}) => {
  // Check custom mappings first
  if (customMappings[appName]) {
    return customMappings[appName];
  }
  
  const lowerName = appName.toLowerCase();
  
  for (const [category, data] of Object.entries(DEFAULT_DRAIN_RATES)) {
    if (data.apps.some(app => lowerName.includes(app.toLowerCase()))) {
      return category;
    }
  }
  
  return 'utility'; // Default to neutral
};

/**
 * Calculate drain from screen time data
 */
export const calculateDrainFromScreenTime = (screenTimeByApp, customMappings = {}) => {
  let totalDrain = 0;
  const breakdown = [];
  
  for (const [appName, minutes] of Object.entries(screenTimeByApp)) {
    const category = getCategoryForApp(appName, customMappings);
    const rate = DEFAULT_DRAIN_RATES[category]?.rate || 0;
    const drain = minutes * rate;
    
    if (drain !== 0) {
      totalDrain += drain;
      breakdown.push({
        app: appName,
        minutes,
        impact: Math.round(drain),
        category,
      });
    }
  }
  
  // Sort by impact (most draining first)
  breakdown.sort((a, b) => a.impact - b.impact);
  
  return {
    totalDrain: Math.round(totalDrain),
    breakdown,
  };
};

/**
 * Log a recharge activity and calculate boost
 */
export const logRechargeActivity = (activityType, intensity) => {
  const activity = RECHARGE_ACTIVITIES[activityType]?.[intensity];
  
  if (!activity) {
    return { boost: 0, error: 'Unknown activity' };
  }
  
  return {
    type: activityType,
    intensity,
    boost: activity.boost,
    label: activity.label,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Get pool status message based on level
 */
export const getPoolStatusMessage = (level) => {
  if (level >= 80) {
    return {
      status: 'high',
      message: "Full reserves. Prime time for challenging work.",
      suggestion: "Tackle your hardest habit now.",
      color: '#22c55e', // green
    };
  }
  if (level >= 60) {
    return {
      status: 'good',
      message: "Solid reserves. Good for focused work.",
      suggestion: "A good time for any habit.",
      color: '#3b82f6', // blue
    };
  }
  if (level >= 40) {
    return {
      status: 'moderate',
      message: "Moderate reserves. Stick to routines.",
      suggestion: "Keep it simple today.",
      color: '#f59e0b', // amber
    };
  }
  if (level >= 20) {
    return {
      status: 'low',
      message: "Low reserves. Use 2-minute versions.",
      suggestion: "Tiny moves only. No pressure.",
      color: '#f97316', // orange
    };
  }
  return {
    status: 'depleted',
    message: "Reserves depleted. Recovery time.",
    suggestion: "Rest or recharge activities only.",
    color: '#ef4444', // red
  };
};

/**
 * Get recommended habit order based on pool level
 */
export const getRecommendedHabitOrder = (habits, poolLevel) => {
  // Sort habits by resistance/difficulty
  const sorted = [...habits].sort((a, b) => {
    const aResistance = a.resistance || 5;
    const bResistance = b.resistance || 5;
    
    // High pool = hard habits first
    if (poolLevel >= 60) {
      return bResistance - aResistance;
    }
    // Low pool = easy habits first
    return aResistance - bResistance;
  });
  
  return sorted;
};

/**
 * Initialize pool data for a new day
 */
export const initializeDailyPool = (userData) => {
  return {
    date: new Date().toISOString().split('T')[0],
    morningLevel: calculateMorningPool(userData),
    currentLevel: calculateMorningPool(userData),
    drainActivities: [],
    rechargeActivities: [],
    lastUpdated: new Date().toISOString(),
  };
};

/**
 * Manually log a drain activity (for self-reporting)
 */
export const logDrainActivity = (appName, minutes, customMappings = {}) => {
  const category = getCategoryForApp(appName, customMappings);
  const rate = DEFAULT_DRAIN_RATES[category]?.rate || 0;
  const impact = Math.round(minutes * rate);
  
  return {
    app: appName,
    minutes,
    impact,
    category,
    timestamp: new Date().toISOString(),
  };
};
