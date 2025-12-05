// Retention Service
// Implements retention-maximizing patterns: Day 1/3/7 cliffs, loss aversion, identity reinforcement
// Goal: User closes app feeling like "someone who shows up"

import AsyncStorage from '@react-native-async-storage/async-storage';

// ═══════════════════════════════════════════════════════════════
// RETENTION CLIFF MILESTONES
// ═══════════════════════════════════════════════════════════════

export const RETENTION_MILESTONES = {
  DAY_1: {
    day: 1,
    title: "First Step Taken",
    message: "You showed up. That's what matters.",
    subtext: "Most people never start. You did.",
    icon: "footsteps",
    celebrationType: "special",
  },
  DAY_3: {
    day: 3,
    title: "Building Momentum",
    message: "3 days in. You're proving this isn't a fluke.",
    subtext: "Consistency is starting to become your thing.",
    icon: "trending-up",
    celebrationType: "medium",
  },
  DAY_7: {
    day: 7,
    title: "One Week Strong",
    message: "A full week. You're not dabbling—you're committed.",
    subtext: "You've unlocked: Streak Shield (1 grace day)",
    icon: "shield-checkmark",
    celebrationType: "special",
    unlock: "streakShield",
  },
  DAY_14: {
    day: 14,
    title: "Two Weeks Deep",
    message: "This is becoming who you are.",
    subtext: "Habits take root around now. Keep going.",
    icon: "leaf",
    celebrationType: "medium",
  },
  DAY_30: {
    day: 30,
    title: "Monthly Legend",
    message: "30 days. You're in the top 5% who make it this far.",
    subtext: "You've unlocked: Advanced Insights",
    icon: "trophy",
    celebrationType: "special",
    unlock: "advancedInsights",
  },
  DAY_60: {
    day: 60,
    title: "Identity Shift Complete",
    message: "You don't just do habits. You ARE someone who shows up.",
    subtext: "This is your new normal.",
    icon: "person-circle",
    celebrationType: "special",
  },
  DAY_100: {
    day: 100,
    title: "Century Club",
    message: "100 days. Extraordinary.",
    subtext: "You've built something permanent.",
    icon: "diamond",
    celebrationType: "special",
  },
};

// ═══════════════════════════════════════════════════════════════
// LOSS AVERSION COPY
// ═══════════════════════════════════════════════════════════════

export const getLossAversionCopy = (streak, incompleteCount, timeOfDay) => {
  // Evening warnings are most effective
  const isEvening = timeOfDay >= 18; // 6 PM or later
  const isLateNight = timeOfDay >= 21; // 9 PM or later

  if (streak === 0) {
    return {
      title: "Start fresh today",
      message: "One completion and you're on the board.",
      urgency: "low",
    };
  }

  if (streak === 1 && incompleteCount > 0) {
    return {
      title: isEvening ? "Don't lose your start" : "Keep the momentum",
      message: isEvening
        ? "You started yesterday. Don't let that go to waste."
        : `${incompleteCount} habit${incompleteCount > 1 ? 's' : ''} to keep your streak alive.`,
      urgency: isEvening ? "high" : "medium",
    };
  }

  if (streak >= 2 && streak <= 6) {
    return {
      title: isEvening ? `Don't lose ${streak} days of work` : "Building steam",
      message: isEvening
        ? `${streak} days invested. ${incompleteCount} left to protect them.`
        : `${streak}-day streak. You're proving something.`,
      urgency: isEvening ? "high" : "medium",
    };
  }

  if (streak === 7) {
    return {
      title: isEvening ? "Week streak at risk!" : "One week strong",
      message: isEvening
        ? "7 days of showing up. Don't break the chain now."
        : "A full week! This is becoming real.",
      urgency: isEvening ? "critical" : "low",
    };
  }

  if (streak > 7 && streak < 30) {
    return {
      title: isEvening ? `${streak} days on the line` : `${streak}-day streak`,
      message: isEvening
        ? `You've invested ${streak} days. Protect your progress.`
        : "You're in rare territory. Most people quit by now.",
      urgency: isEvening ? "high" : "low",
    };
  }

  if (streak >= 30) {
    return {
      title: isEvening ? `A ${streak}-day legacy at stake` : `${streak} days and counting`,
      message: isEvening
        ? `${streak} days of proof that you show up. Don't break now.`
        : "You've built something remarkable. Keep stacking.",
      urgency: isEvening ? "critical" : "low",
    };
  }

  return {
    title: "Keep going",
    message: "Every day counts.",
    urgency: "low",
  };
};

// ═══════════════════════════════════════════════════════════════
// IDENTITY REINFORCEMENT MESSAGES
// ═══════════════════════════════════════════════════════════════

export const getIdentityMessage = (context) => {
  const { streak, completedToday, totalCompletions, consistency } = context;

  // After completion - reinforce identity
  const completionMessages = [
    "That's what you do now.",
    "Showing up, as usual.",
    "Another day of being you.",
    "This is who you are.",
    "Consistency looks good on you.",
    "You're the type who follows through.",
    "One more rep in your identity.",
    "Building character, one day at a time.",
  ];

  // Based on streak length
  if (streak >= 30) {
    return {
      message: "You're not building a habit. You ARE this habit.",
      type: "identity",
    };
  }

  if (streak >= 14) {
    return {
      message: "This isn't discipline anymore. It's just who you are.",
      type: "identity",
    };
  }

  if (streak >= 7) {
    return {
      message: "You're becoming someone who shows up. Keep going.",
      type: "growth",
    };
  }

  if (completedToday) {
    return {
      message: completionMessages[Math.floor(Math.random() * completionMessages.length)],
      type: "reinforcement",
    };
  }

  if (consistency >= 80) {
    return {
      message: "You're in the top tier of consistency. Rare company.",
      type: "status",
    };
  }

  return {
    message: "Every time you show up, you're voting for who you want to be.",
    type: "motivation",
  };
};

// ═══════════════════════════════════════════════════════════════
// EMPTY STATE COPY (No dead ends!)
// ═══════════════════════════════════════════════════════════════

export const EMPTY_STATE_COPY = {
  noHabits: {
    title: "Your journey starts here",
    message: "Add your first habit—something you can do in 2 minutes.",
    cta: "Add First Habit",
    hint: "Tip: 'Read 1 page' beats 'Read 30 minutes'",
    icon: "add-circle",
  },
  noCompletionsToday: {
    title: "Fresh slate",
    message: "Today's habits are waiting. Start with the easiest one.",
    cta: "View Today's Habits",
    icon: "sunny",
  },
  noTrends: {
    title: "Trends unlock after 3 days",
    message: "Complete habits for 3 days to see patterns emerge.",
    cta: "Complete Today First",
    progress: "3 days to unlock",
    icon: "stats-chart",
  },
  noMessages: {
    title: "Your AI coach is ready",
    message: "Ask anything about habits, motivation, or getting unstuck.",
    cta: "Start Conversation",
    suggestions: [
      "How do I stay consistent?",
      "I'm struggling with motivation",
      "Help me start small",
    ],
    icon: "chatbubble-ellipses",
  },
  noPlan: {
    title: "No weekly plan yet",
    message: "Set intentions for the week to stay focused.",
    cta: "Plan Your Week",
    icon: "calendar",
  },
  allDone: {
    title: "All done!",
    message: "You crushed it today. Rest up and come back tomorrow.",
    icon: "checkmark-circle",
    celebration: true,
  },
};

// ═══════════════════════════════════════════════════════════════
// FIRST COMPLETION CELEBRATION
// ═══════════════════════════════════════════════════════════════

export const getFirstCompletionCelebration = (habitName) => ({
  title: "First one down!",
  message: `You completed "${habitName}". That's your first step.`,
  subtext: "The hardest part is starting. You just did that.",
  icon: "rocket",
  confetti: true,
});

// ═══════════════════════════════════════════════════════════════
// PROGRESS GLANCEABILITY
// ═══════════════════════════════════════════════════════════════

export const getProgressSummary = (data) => {
  const {
    habits = [],
    completions = [],
    streak = 0,
    completedToday = 0,
    poolLevel = 65,
  } = data;

  const totalHabits = habits.length;
  const progressPercent = totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0;

  // What they've done
  const accomplished = completedToday > 0
    ? `${completedToday}/${totalHabits} done`
    : "Ready to start";

  // How far they've come
  const journey = streak > 0
    ? `${streak}-day streak`
    : "Day 1";

  // What's next
  const remaining = totalHabits - completedToday;
  const nextAction = remaining > 0
    ? `${remaining} to go`
    : "All complete!";

  // Energy context
  const energyLabel = poolLevel >= 70
    ? "High energy"
    : poolLevel >= 40
      ? "Moderate"
      : "Low energy";

  return {
    accomplished,
    journey,
    nextAction,
    progressPercent,
    energyLabel,
    poolLevel,
    isComplete: remaining === 0 && totalHabits > 0,
  };
};

// ═══════════════════════════════════════════════════════════════
// SMART FRICTION REDUCTION
// ═══════════════════════════════════════════════════════════════

export const shouldSuggest2MinVersion = (context) => {
  const { poolLevel, streak, failedYesterday, habitDifficulty, timeOfDay } = context;

  // Always suggest if pool is very low
  if (poolLevel < 30) return true;

  // Suggest if they failed yesterday and pool is moderate
  if (failedYesterday && poolLevel < 50) return true;

  // Suggest for hard habits when pool is below 50
  if (habitDifficulty >= 7 && poolLevel < 50) return true;

  // Late night + low pool = suggest 2-min
  if (timeOfDay >= 22 && poolLevel < 60) return true;

  // New users (streak < 3) with low pool
  if (streak < 3 && poolLevel < 50) return true;

  return false;
};

// ═══════════════════════════════════════════════════════════════
// RETENTION TRACKING
// ═══════════════════════════════════════════════════════════════

const RETENTION_KEY = '@ascent_retention';

export const trackRetentionEvent = async (event, data = {}) => {
  try {
    const existing = await AsyncStorage.getItem(RETENTION_KEY);
    const events = existing ? JSON.parse(existing) : [];

    events.push({
      event,
      data,
      timestamp: new Date().toISOString(),
    });

    // Keep last 100 events
    if (events.length > 100) {
      events.shift();
    }

    await AsyncStorage.setItem(RETENTION_KEY, JSON.stringify(events));
  } catch (error) {
    console.warn('Failed to track retention event:', error);
  }
};

export const getRetentionEvents = async () => {
  try {
    const data = await AsyncStorage.getItem(RETENTION_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    return [];
  }
};

// ═══════════════════════════════════════════════════════════════
// CHECK FOR MILESTONE
// ═══════════════════════════════════════════════════════════════

export const checkForMilestone = (daysSinceStart, shownMilestones = []) => {
  const milestones = Object.values(RETENTION_MILESTONES);

  for (const milestone of milestones) {
    if (daysSinceStart >= milestone.day && !shownMilestones.includes(milestone.day)) {
      return milestone;
    }
  }

  return null;
};

// ═══════════════════════════════════════════════════════════════
// FEELING-FOCUSED FEEDBACK
// ═══════════════════════════════════════════════════════════════

export const getCompletionFeedback = (context) => {
  const {
    isFirst,
    isLast,
    streak,
    habitName,
    wasStruggling,
    usedTwoMin,
  } = context;

  if (isFirst && streak === 0) {
    return {
      title: "You started!",
      subtitle: "The hardest part is behind you.",
      feeling: "accomplished",
    };
  }

  if (isLast) {
    return {
      title: "All done!",
      subtitle: streak > 0
        ? `${streak + 1}-day streak secured.`
        : "Perfect day. You crushed it.",
      feeling: "triumphant",
    };
  }

  if (usedTwoMin) {
    return {
      title: "Still counts!",
      subtitle: "Showing up matters more than intensity.",
      feeling: "relieved",
    };
  }

  if (wasStruggling) {
    return {
      title: "You pushed through",
      subtitle: "That's what separates you from quitters.",
      feeling: "proud",
    };
  }

  // Random positive reinforcement
  const messages = [
    { title: "Nice.", subtitle: "One more step forward.", feeling: "satisfied" },
    { title: "Done.", subtitle: "That's the way.", feeling: "confident" },
    { title: "Check.", subtitle: "On to the next.", feeling: "focused" },
    { title: "Locked in.", subtitle: "Building proof.", feeling: "determined" },
  ];

  return messages[Math.floor(Math.random() * messages.length)];
};

export default {
  RETENTION_MILESTONES,
  EMPTY_STATE_COPY,
  getLossAversionCopy,
  getIdentityMessage,
  getProgressSummary,
  shouldSuggest2MinVersion,
  checkForMilestone,
  getCompletionFeedback,
  getFirstCompletionCelebration,
  trackRetentionEvent,
};
