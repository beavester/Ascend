// Ratchet Service
// Handles invisible ratchet (auto target escalation) and cross-titration tracking

// ═══════════════════════════════════════════════════════════════
// INVISIBLE RATCHET
// Auto-increase targets when consistency stays high
// ═══════════════════════════════════════════════════════════════

const RATCHET_CONFIG = {
  minDaysBeforeRatchet: 14,      // Minimum days of data needed
  consistencyThreshold: 85,      // Must be above this to ratchet up
  downgradThreshold: 50,         // Below this triggers downgrade suggestion
  cooldownDays: 7,               // Days after ratchet before next check
  
  // Increment tiers based on current target
  incrementTiers: [
    { maxTarget: 3, increment: 1 },      // 2 → 3, 3 → 4
    { maxTarget: 7, increment: 2 },      // 5 → 7, 7 → 9
    { maxTarget: 15, increment: 3 },     // 10 → 13, 15 → 18
    { maxTarget: 30, increment: 5 },     // 20 → 25, 30 → 35
    { maxTarget: Infinity, increment: 5 }, // Cap at +5
  ],
};

/**
 * Check if a habit should have its target ratcheted up
 * @param {Object} habit - The habit object
 * @param {Array} completions - All completions
 * @param {Object} ratchetHistory - Previous ratchet events
 * @returns {Object|null} Ratchet recommendation or null
 */
export const checkRatchetUp = (habit, completions, ratchetHistory = {}) => {
  const habitCompletions = completions.filter(c => c.odHabitId === habit.id);
  
  if (habitCompletions.length < RATCHET_CONFIG.minDaysBeforeRatchet) {
    return null;
  }
  
  // Check cooldown
  const lastRatchet = ratchetHistory[habit.id];
  if (lastRatchet) {
    const daysSinceRatchet = Math.floor(
      (Date.now() - new Date(lastRatchet.date).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceRatchet < RATCHET_CONFIG.cooldownDays) {
      return null;
    }
  }
  
  // Calculate recent consistency (last 14 days)
  const today = new Date();
  const recentCompletions = habitCompletions.filter(c => {
    const completionDate = new Date(c.date);
    const daysDiff = Math.floor((today - completionDate) / (1000 * 60 * 60 * 24));
    return daysDiff <= 14 && c.completed;
  });
  
  const consistency = (recentCompletions.length / 14) * 100;
  
  if (consistency < RATCHET_CONFIG.consistencyThreshold) {
    return null;
  }
  
  // Calculate new target
  const currentTarget = habit.amount || 1;
  let increment = 1;
  
  for (const tier of RATCHET_CONFIG.incrementTiers) {
    if (currentTarget <= tier.maxTarget) {
      increment = tier.increment;
      break;
    }
  }
  
  const newTarget = currentTarget + increment;
  
  return {
    habitId: habit.id,
    habitName: habit.name,
    currentTarget,
    newTarget,
    increment,
    consistency: Math.round(consistency),
    message: `You've hit ${Math.round(consistency)}% consistency. Time to level up?`,
    recommendation: `${currentTarget} → ${newTarget} ${habit.unit}`,
  };
};

/**
 * Check if a habit is too hard and should be ratcheted down
 * @param {Object} habit - The habit object
 * @param {Array} completions - All completions
 * @returns {Object|null} Downgrade suggestion or null
 */
export const checkRatchetDown = (habit, completions) => {
  const habitCompletions = completions.filter(c => c.odHabitId === habit.id);
  
  if (habitCompletions.length < 7) {
    return null;
  }
  
  // Calculate recent consistency
  const today = new Date();
  const recentCompletions = habitCompletions.filter(c => {
    const completionDate = new Date(c.date);
    const daysDiff = Math.floor((today - completionDate) / (1000 * 60 * 60 * 24));
    return daysDiff <= 14;
  });
  
  const completed = recentCompletions.filter(c => c.completed).length;
  const total = Math.min(14, recentCompletions.length);
  const consistency = (completed / total) * 100;
  
  if (consistency >= RATCHET_CONFIG.downgradThreshold) {
    return null;
  }
  
  // Suggest lower target
  const currentTarget = habit.amount || 1;
  let suggestedTarget = currentTarget;
  
  // Step down based on current target
  if (currentTarget > 30) {
    suggestedTarget = currentTarget - 5;
  } else if (currentTarget > 15) {
    suggestedTarget = currentTarget - 3;
  } else if (currentTarget > 5) {
    suggestedTarget = currentTarget - 2;
  } else if (currentTarget > 1) {
    suggestedTarget = currentTarget - 1;
  }
  
  return {
    habitId: habit.id,
    habitName: habit.name,
    currentTarget,
    suggestedTarget,
    consistency: Math.round(consistency),
    message: `${Math.round(consistency)}% completion suggests this might be too ambitious.`,
    recommendation: `Consider ${suggestedTarget} ${habit.unit} instead`,
  };
};

/**
 * Apply a ratchet and record it
 * @param {Object} habit - The habit to update
 * @param {number} newTarget - The new target amount
 * @param {Object} ratchetHistory - Previous ratchet events
 * @returns {Object} Updated ratchet history
 */
export const applyRatchet = (habit, newTarget, ratchetHistory = {}) => {
  return {
    ...ratchetHistory,
    [habit.id]: {
      date: new Date().toISOString(),
      previousTarget: habit.amount,
      newTarget,
      direction: newTarget > habit.amount ? 'up' : 'down',
    },
  };
};

// ═══════════════════════════════════════════════════════════════
// CROSS-TITRATION TRACKING
// Measures how drain app usage changes as habits strengthen
// ═══════════════════════════════════════════════════════════════

/**
 * Record screen time for cross-titration tracking
 * @param {Object} screenTimeData - Screen time breakdown by app
 * @param {string} date - Date string
 * @param {Array} history - Existing history
 * @returns {Array} Updated history
 */
export const recordScreenTime = (screenTimeData, date, history = []) => {
  const entry = {
    date,
    timestamp: Date.now(),
    totalMinutes: screenTimeData.totalMinutes || 0,
    drainMinutes: 0,
    rechargeMinutes: 0,
    apps: {},
  };
  
  // Categorize apps
  const drainApps = ['twitter', 'instagram', 'tiktok', 'facebook', 'reddit', 'youtube', 'netflix'];
  const rechargeApps = ['meditation', 'headspace', 'calm', 'nike training', 'strava'];
  
  for (const [app, minutes] of Object.entries(screenTimeData.apps || {})) {
    const appLower = app.toLowerCase();
    entry.apps[app] = minutes;
    
    if (drainApps.some(d => appLower.includes(d))) {
      entry.drainMinutes += minutes;
    }
    if (rechargeApps.some(r => appLower.includes(r))) {
      entry.rechargeMinutes += minutes;
    }
  }
  
  // Keep last 90 days
  const cutoff = Date.now() - (90 * 24 * 60 * 60 * 1000);
  const filtered = history.filter(h => h.timestamp > cutoff);
  
  return [...filtered, entry];
};

/**
 * Calculate cross-titration metrics
 * @param {Array} screenTimeHistory - Screen time entries
 * @param {Array} completions - Habit completions
 * @param {Array} habits - All habits
 * @returns {Object} Cross-titration analysis
 */
export const calculateCrossTitration = (screenTimeHistory, completions, habits) => {
  if (screenTimeHistory.length < 14) {
    return {
      hasEnoughData: false,
      message: 'Track screen time for 2+ weeks to see cross-titration patterns.',
    };
  }
  
  const today = new Date();
  
  // Calculate weekly averages
  const weeks = [];
  for (let w = 0; w < 8; w++) {
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - (w * 7) - weekStart.getDay());
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    const weekScreenTime = screenTimeHistory.filter(d => {
      const date = new Date(d.date);
      return date >= weekStart && date <= weekEnd;
    });
    
    const weekCompletions = completions.filter(c => {
      const date = new Date(c.date);
      return date >= weekStart && date <= weekEnd;
    });
    
    weeks.push({
      weekNumber: w + 1,
      avgDrainMinutes: weekScreenTime.length > 0
        ? weekScreenTime.reduce((sum, d) => sum + d.drainMinutes, 0) / weekScreenTime.length
        : 0,
      completionRate: weekCompletions.length > 0
        ? (weekCompletions.filter(c => c.completed).length / weekCompletions.length) * 100
        : 0,
    });
  }
  
  // Calculate trends
  const recentWeeks = weeks.slice(0, 4);
  const olderWeeks = weeks.slice(4, 8);
  
  const recentDrainAvg = recentWeeks.reduce((sum, w) => sum + w.avgDrainMinutes, 0) / recentWeeks.length;
  const olderDrainAvg = olderWeeks.length > 0
    ? olderWeeks.reduce((sum, w) => sum + w.avgDrainMinutes, 0) / olderWeeks.length
    : recentDrainAvg;
  
  const recentCompletionAvg = recentWeeks.reduce((sum, w) => sum + w.completionRate, 0) / recentWeeks.length;
  const olderCompletionAvg = olderWeeks.length > 0
    ? olderWeeks.reduce((sum, w) => sum + w.completionRate, 0) / olderWeeks.length
    : recentCompletionAvg;
  
  const drainTrend = olderDrainAvg > 0
    ? ((recentDrainAvg - olderDrainAvg) / olderDrainAvg) * 100
    : 0;
  
  const completionTrend = olderCompletionAvg > 0
    ? ((recentCompletionAvg - olderCompletionAvg) / olderCompletionAvg) * 100
    : 0;
  
  // Determine cross-titration status
  let status = 'neutral';
  let message = '';
  let insight = '';
  
  if (drainTrend < -10 && completionTrend > 10) {
    status = 'positive';
    message = 'Cross-titration is working';
    insight = `Drain app usage is down ${Math.abs(Math.round(drainTrend))}% while habit completion is up ${Math.round(completionTrend)}%. Your brain is naturally redirecting.`;
  } else if (drainTrend > 10 && completionTrend < -10) {
    status = 'negative';
    message = 'Drain apps are competing';
    insight = `Screen time is up ${Math.round(drainTrend)}% and habits are down. Consider protecting morning pool with a screen-free routine.`;
  } else if (completionTrend > 15) {
    status = 'building';
    message = 'Habits strengthening';
    insight = `Completion rate is up ${Math.round(completionTrend)}%. Keep going — the cross-titration effect often follows.`;
  } else {
    status = 'neutral';
    message = 'Building baseline';
    insight = 'Continue tracking to see patterns emerge. Neural adaptation takes time.';
  }
  
  return {
    hasEnoughData: true,
    status,
    message,
    insight,
    drainTrend: Math.round(drainTrend),
    completionTrend: Math.round(completionTrend),
    recentDrainAvg: Math.round(recentDrainAvg),
    recentCompletionAvg: Math.round(recentCompletionAvg),
    weeklyData: weeks.reverse(), // Oldest to newest
  };
};

/**
 * Get cross-titration score (0-100)
 * Higher = stronger inverse relationship between drain apps and habit completion
 */
export const getCrossTitrationScore = (screenTimeHistory, completions) => {
  if (screenTimeHistory.length < 14) return null;
  
  // Calculate correlation coefficient between drain time and completion rate
  const dataPoints = [];
  const today = new Date();
  
  for (let d = 0; d < 30; d++) {
    const date = new Date(today);
    date.setDate(date.getDate() - d);
    const dateStr = date.toISOString().split('T')[0];
    
    const screenTime = screenTimeHistory.find(s => s.date === dateStr);
    const dayCompletions = completions.filter(c => c.date.startsWith(dateStr));
    
    if (screenTime && dayCompletions.length > 0) {
      dataPoints.push({
        drainMinutes: screenTime.drainMinutes,
        completionRate: (dayCompletions.filter(c => c.completed).length / dayCompletions.length) * 100,
      });
    }
  }
  
  if (dataPoints.length < 10) return null;
  
  // Calculate Pearson correlation
  const n = dataPoints.length;
  const sumDrain = dataPoints.reduce((sum, d) => sum + d.drainMinutes, 0);
  const sumCompletion = dataPoints.reduce((sum, d) => sum + d.completionRate, 0);
  const sumDrainCompletion = dataPoints.reduce((sum, d) => sum + (d.drainMinutes * d.completionRate), 0);
  const sumDrainSq = dataPoints.reduce((sum, d) => sum + (d.drainMinutes * d.drainMinutes), 0);
  const sumCompletionSq = dataPoints.reduce((sum, d) => sum + (d.completionRate * d.completionRate), 0);
  
  const numerator = (n * sumDrainCompletion) - (sumDrain * sumCompletion);
  const denominator = Math.sqrt(
    ((n * sumDrainSq) - (sumDrain * sumDrain)) *
    ((n * sumCompletionSq) - (sumCompletion * sumCompletion))
  );
  
  if (denominator === 0) return 50;
  
  const correlation = numerator / denominator;
  
  // Convert to 0-100 score where negative correlation = high score
  // -1 (perfect inverse) = 100, 0 = 50, +1 (perfect positive) = 0
  const score = Math.round(((-correlation + 1) / 2) * 100);
  
  return score;
};

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

export default {
  checkRatchetUp,
  checkRatchetDown,
  applyRatchet,
  recordScreenTime,
  calculateCrossTitration,
  getCrossTitrationScore,
};
