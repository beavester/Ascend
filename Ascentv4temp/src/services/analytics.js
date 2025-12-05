// Analytics Service
// Tracks user patterns and generates behavioral insights

// ═══════════════════════════════════════════════════════════════
// TIME PATTERN ANALYSIS
// ═══════════════════════════════════════════════════════════════

/**
 * Analyze completion time patterns
 * Returns best/worst times for habit completion
 */
export const analyzeTimePatterns = (completions) => {
  if (completions.length < 14) {
    return { hasEnoughData: false };
  }
  
  // Group completions by hour
  const hourlyStats = {};
  for (let h = 0; h < 24; h++) {
    hourlyStats[h] = { completed: 0, total: 0 };
  }
  
  completions.forEach(c => {
    const hour = new Date(c.date).getHours();
    hourlyStats[hour].total++;
    if (c.completed) {
      hourlyStats[hour].completed++;
    }
  });
  
  // Calculate rates
  const hourlyRates = Object.entries(hourlyStats)
    .filter(([_, stats]) => stats.total >= 3) // Need minimum data
    .map(([hour, stats]) => ({
      hour: parseInt(hour),
      rate: stats.total > 0 ? (stats.completed / stats.total) * 100 : 0,
      count: stats.total,
    }))
    .sort((a, b) => b.rate - a.rate);
  
  // Time windows
  const morningHours = hourlyRates.filter(h => h.hour >= 5 && h.hour < 12);
  const afternoonHours = hourlyRates.filter(h => h.hour >= 12 && h.hour < 17);
  const eveningHours = hourlyRates.filter(h => h.hour >= 17 && h.hour < 22);
  const nightHours = hourlyRates.filter(h => h.hour >= 22 || h.hour < 5);
  
  const windowRates = {
    morning: morningHours.length > 0 
      ? morningHours.reduce((sum, h) => sum + h.rate, 0) / morningHours.length 
      : 0,
    afternoon: afternoonHours.length > 0 
      ? afternoonHours.reduce((sum, h) => sum + h.rate, 0) / afternoonHours.length 
      : 0,
    evening: eveningHours.length > 0 
      ? eveningHours.reduce((sum, h) => sum + h.rate, 0) / eveningHours.length 
      : 0,
    night: nightHours.length > 0 
      ? nightHours.reduce((sum, h) => sum + h.rate, 0) / nightHours.length 
      : 0,
  };
  
  const bestWindow = Object.entries(windowRates)
    .sort((a, b) => b[1] - a[1])[0];
  
  const worstWindow = Object.entries(windowRates)
    .filter(([_, rate]) => rate > 0)
    .sort((a, b) => a[1] - b[1])[0];
  
  return {
    hasEnoughData: true,
    hourlyRates,
    windowRates,
    bestWindow: bestWindow ? { name: bestWindow[0], rate: Math.round(bestWindow[1]) } : null,
    worstWindow: worstWindow ? { name: worstWindow[0], rate: Math.round(worstWindow[1]) } : null,
    peakHour: hourlyRates[0]?.hour,
    peakHourRate: Math.round(hourlyRates[0]?.rate || 0),
  };
};

// ═══════════════════════════════════════════════════════════════
// DAY OF WEEK ANALYSIS
// ═══════════════════════════════════════════════════════════════

/**
 * Analyze day-of-week patterns
 */
export const analyzeDayPatterns = (completions) => {
  if (completions.length < 21) {
    return { hasEnoughData: false };
  }
  
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayStats = dayNames.map(name => ({ name, completed: 0, total: 0 }));
  
  completions.forEach(c => {
    const day = new Date(c.date).getDay();
    dayStats[day].total++;
    if (c.completed) {
      dayStats[day].completed++;
    }
  });
  
  const dayRates = dayStats.map(d => ({
    ...d,
    rate: d.total > 0 ? Math.round((d.completed / d.total) * 100) : 0,
  }));
  
  const sortedByRate = [...dayRates].sort((a, b) => b.rate - a.rate);
  
  // Weekend vs weekday
  const weekdayRate = dayRates.slice(1, 6).reduce((sum, d) => sum + d.rate, 0) / 5;
  const weekendRate = (dayRates[0].rate + dayRates[6].rate) / 2;
  
  return {
    hasEnoughData: true,
    dayRates,
    bestDay: sortedByRate[0],
    worstDay: sortedByRate.filter(d => d.total > 0).pop(),
    weekdayRate: Math.round(weekdayRate),
    weekendRate: Math.round(weekendRate),
    weekendWarrior: weekendRate > weekdayRate + 10,
    weekdayDipper: weekdayRate > weekendRate + 10,
  };
};

// ═══════════════════════════════════════════════════════════════
// HABIT-SPECIFIC ANALYSIS
// ═══════════════════════════════════════════════════════════════

/**
 * Analyze individual habit performance
 */
export const analyzeHabitPerformance = (habit, completions) => {
  const habitCompletions = completions.filter(c => c.odHabitId === habit.id);
  
  if (habitCompletions.length < 7) {
    return { hasEnoughData: false, habitId: habit.id };
  }
  
  const today = new Date();
  
  // Last 7 days
  const last7Days = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const completion = habitCompletions.find(c => c.date.startsWith(dateStr));
    last7Days.push({
      date: dateStr,
      completed: completion?.completed || false,
    });
  }
  
  const weekRate = last7Days.filter(d => d.completed).length / 7 * 100;
  
  // Last 30 days
  const last30Days = [];
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const completion = habitCompletions.find(c => c.date.startsWith(dateStr));
    last30Days.push({
      date: dateStr,
      completed: completion?.completed || false,
    });
  }
  
  const monthRate = last30Days.filter(d => d.completed).length / 30 * 100;
  
  // Trend (is it improving?)
  const firstHalf = last30Days.slice(15, 30).filter(d => d.completed).length / 15 * 100;
  const secondHalf = last30Days.slice(0, 15).filter(d => d.completed).length / 15 * 100;
  const trend = secondHalf - firstHalf;
  
  // Current streak
  let currentStreak = 0;
  for (const day of last30Days) {
    if (day.completed) {
      currentStreak++;
    } else {
      break;
    }
  }
  
  // Longest streak in data
  let longestStreak = 0;
  let tempStreak = 0;
  for (const day of last30Days.reverse()) {
    if (day.completed) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  }
  
  // Resistance level (based on time patterns)
  const timePatterns = analyzeTimePatterns(habitCompletions);
  
  return {
    hasEnoughData: true,
    habitId: habit.id,
    habitName: habit.name,
    weekRate: Math.round(weekRate),
    monthRate: Math.round(monthRate),
    trend: Math.round(trend),
    trendDirection: trend > 5 ? 'improving' : trend < -5 ? 'declining' : 'stable',
    currentStreak,
    longestStreak,
    bestTime: timePatterns.bestWindow,
    totalCompletions: habitCompletions.filter(c => c.completed).length,
    
    // Resistance categorization
    resistanceLevel: weekRate >= 80 ? 'low' : weekRate >= 50 ? 'medium' : 'high',
    isSticky: currentStreak >= 7 && weekRate >= 80,
    needsAttention: weekRate < 50 && trend < 0,
  };
};

// ═══════════════════════════════════════════════════════════════
// POOL-COMPLETION CORRELATION
// ═══════════════════════════════════════════════════════════════

/**
 * Analyze correlation between pool levels and completion rates
 */
export const analyzePoolCorrelation = (poolHistory, completions) => {
  if (poolHistory.length < 14) {
    return { hasEnoughData: false };
  }
  
  // Match pool levels with completion rates
  const dataPoints = [];
  
  poolHistory.forEach(p => {
    const dayCompletions = completions.filter(c => 
      c.date.startsWith(p.date)
    );
    
    if (dayCompletions.length > 0) {
      const completionRate = (dayCompletions.filter(c => c.completed).length / dayCompletions.length) * 100;
      
      dataPoints.push({
        date: p.date,
        morningPool: p.morningPool || 65,
        completionRate,
      });
    }
  });
  
  if (dataPoints.length < 10) {
    return { hasEnoughData: false };
  }
  
  // High pool vs low pool completion rates
  const highPoolDays = dataPoints.filter(d => d.morningPool >= 70);
  const lowPoolDays = dataPoints.filter(d => d.morningPool < 50);
  
  const highPoolCompletion = highPoolDays.length > 0
    ? highPoolDays.reduce((sum, d) => sum + d.completionRate, 0) / highPoolDays.length
    : 0;
  
  const lowPoolCompletion = lowPoolDays.length > 0
    ? lowPoolDays.reduce((sum, d) => sum + d.completionRate, 0) / lowPoolDays.length
    : 0;
  
  const poolImpact = highPoolCompletion - lowPoolCompletion;
  
  // Calculate Pearson correlation
  const n = dataPoints.length;
  const sumPool = dataPoints.reduce((sum, d) => sum + d.morningPool, 0);
  const sumCompletion = dataPoints.reduce((sum, d) => sum + d.completionRate, 0);
  const sumPoolCompletion = dataPoints.reduce((sum, d) => sum + (d.morningPool * d.completionRate), 0);
  const sumPoolSq = dataPoints.reduce((sum, d) => sum + (d.morningPool * d.morningPool), 0);
  const sumCompletionSq = dataPoints.reduce((sum, d) => sum + (d.completionRate * d.completionRate), 0);
  
  const numerator = (n * sumPoolCompletion) - (sumPool * sumCompletion);
  const denominator = Math.sqrt(
    ((n * sumPoolSq) - (sumPool * sumPool)) *
    ((n * sumCompletionSq) - (sumCompletion * sumCompletion))
  );
  
  const correlation = denominator !== 0 ? numerator / denominator : 0;
  
  return {
    hasEnoughData: true,
    dataPoints,
    highPoolCompletion: Math.round(highPoolCompletion),
    lowPoolCompletion: Math.round(lowPoolCompletion),
    poolImpact: Math.round(poolImpact),
    correlation: Math.round(correlation * 100) / 100,
    correlationStrength: 
      Math.abs(correlation) > 0.7 ? 'strong' :
      Math.abs(correlation) > 0.4 ? 'moderate' :
      Math.abs(correlation) > 0.2 ? 'weak' : 'none',
    poolMatters: poolImpact > 15,
    insight: poolImpact > 20 
      ? `You complete ${Math.round(poolImpact)}% more habits on high-pool days. Protecting morning reserves pays off.`
      : poolImpact > 10
      ? `Pool level has a moderate effect on your completion rate.`
      : `Your completion rate is consistent regardless of pool level.`,
  };
};

// ═══════════════════════════════════════════════════════════════
// COMPREHENSIVE ANALYTICS REPORT
// ═══════════════════════════════════════════════════════════════

/**
 * Generate comprehensive analytics report
 */
export const generateAnalyticsReport = (data) => {
  const { habits = [], completions = [], poolHistory = [] } = data;
  
  const timePatterns = analyzeTimePatterns(completions);
  const dayPatterns = analyzeDayPatterns(completions);
  const poolCorrelation = analyzePoolCorrelation(poolHistory, completions);
  
  // Per-habit analysis
  const habitAnalytics = habits.map(h => analyzeHabitPerformance(h, completions));
  
  // Overall stats
  const totalCompletions = completions.filter(c => c.completed).length;
  const totalDays = new Set(completions.map(c => c.date.split('T')[0])).size;
  const avgCompletionsPerDay = totalDays > 0 ? totalCompletions / totalDays : 0;
  
  // Best performing habit
  const bestHabit = habitAnalytics
    .filter(h => h.hasEnoughData)
    .sort((a, b) => b.weekRate - a.weekRate)[0];
  
  // Habit needing attention
  const needsAttention = habitAnalytics
    .filter(h => h.hasEnoughData && h.needsAttention);
  
  // Sticky habits (well-established)
  const stickyHabits = habitAnalytics
    .filter(h => h.hasEnoughData && h.isSticky);
  
  return {
    // Summary
    summary: {
      totalCompletions,
      totalDays,
      avgCompletionsPerDay: Math.round(avgCompletionsPerDay * 10) / 10,
      activeHabits: habits.length,
      stickyHabitsCount: stickyHabits.length,
    },
    
    // Time patterns
    timePatterns,
    dayPatterns,
    
    // Pool correlation
    poolCorrelation,
    
    // Habit-specific
    habitAnalytics,
    bestHabit,
    needsAttention,
    stickyHabits,
    
    // Key insights (for display)
    keyInsights: generateKeyInsights({
      timePatterns,
      dayPatterns,
      poolCorrelation,
      bestHabit,
      needsAttention,
    }),
    
    generatedAt: new Date().toISOString(),
  };
};

/**
 * Generate key insights for display
 */
const generateKeyInsights = ({ timePatterns, dayPatterns, poolCorrelation, bestHabit, needsAttention }) => {
  const insights = [];
  
  // Time insight
  if (timePatterns.hasEnoughData && timePatterns.bestWindow) {
    insights.push({
      type: 'time',
      icon: '⏰',
      title: `${timePatterns.bestWindow.name.charAt(0).toUpperCase() + timePatterns.bestWindow.name.slice(1)} is your sweet spot`,
      message: `${timePatterns.bestWindow.rate}% completion rate during ${timePatterns.bestWindow.name} hours.`,
    });
  }
  
  // Day insight
  if (dayPatterns.hasEnoughData && dayPatterns.worstDay) {
    insights.push({
      type: 'day',
      icon: '📅',
      title: `${dayPatterns.worstDay.name}s are tough`,
      message: `Only ${dayPatterns.worstDay.rate}% completion. Consider easier targets or 2-min versions.`,
    });
  }
  
  // Pool insight
  if (poolCorrelation.hasEnoughData && poolCorrelation.poolMatters) {
    insights.push({
      type: 'pool',
      icon: '⚡',
      title: 'Pool level matters',
      message: poolCorrelation.insight,
    });
  }
  
  // Best habit
  if (bestHabit?.hasEnoughData) {
    insights.push({
      type: 'success',
      icon: '🌟',
      title: `${bestHabit.habitName} is solid`,
      message: `${bestHabit.weekRate}% this week. ${bestHabit.isSticky ? "This one's automatic." : 'Keep building.'}`,
    });
  }
  
  // Needs attention
  if (needsAttention.length > 0) {
    const habit = needsAttention[0];
    insights.push({
      type: 'attention',
      icon: '🔧',
      title: `${habit.habitName} needs adjusting`,
      message: `${habit.weekRate}% and ${habit.trendDirection}. Maybe lower the target or make it easier?`,
    });
  }
  
  return insights.slice(0, 4); // Limit to 4 insights
};

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

export default {
  analyzeTimePatterns,
  analyzeDayPatterns,
  analyzeHabitPerformance,
  analyzePoolCorrelation,
  generateAnalyticsReport,
};
